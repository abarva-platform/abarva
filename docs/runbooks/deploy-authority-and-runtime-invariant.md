# Deploy Authority And Runtime Invariant

This runbook prevents a stale branch image from becoming the live Azure Container Apps runtime when someone updates env vars, feature flags, scale, secrets, or traffic.

## Allowed Shared-Runtime Mutator

The only allowed shared Product/Lab web traffic mutator is the repo-owned `ACA main deploy` workflow in `.github/workflows/aca-main-deploy.yml`.

Shared runtime means any Container App or Container Apps Job that serves or generates artifacts for multiple clients in Product/Lab. Branch experiments, preview testing, and client-specific rehearsals must use their own environment or Container App.

The scheduled `ACA runtime drift monitor` workflow in `.github/workflows/aca-runtime-drift-monitor.yml` is read-only drift detection. It must never shift traffic or mutate the Container App.

## Runtime Invariant

For every shared ACA web app update:

- The source commit is `origin/main` HEAD.
- The web image is pinned by digest: `acr.../abarva/web@sha256:<digest>`.
- The ACR digest has a `main-<sha>` tag and no forbidden runtime tag such as `source-*`, `codex-*`, `worktree-*`, `preview-*`, or `local-*`.
- The 100 percent traffic revision name is a main revision: `m<sha>` or `main-<sha>`.
- The Container App template image equals the approved digest-pinned image.
- The 100 percent traffic revision image equals the same approved digest-pinned image.
- Worker jobs that execute code for the same release use the same approved digest-pinned image.

## ACR Build And Registry Policy

The shared Product/Lab web registry is `acrabarvalab001`. It must stay on the Premium SKU, and the repo-owned `ACA main deploy` workflow must stop before building if the live registry is not Premium.

Shared web images are built and pushed by `.github/workflows/aca-main-deploy.yml` only. The approved build path is Docker Buildx in GitHub Actions with GitHub Actions cache:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

Do not run ad-hoc ACR remote builds, local `docker push`, branch deploy workflow pushes, or agent-specific build scripts against `acrabarvalab001/abarva/web`. If a preview or client-preprod environment needs an image, use its own registry/repository or an explicitly documented environment lane.

The deploy workflow captures:

- ACR name and SKU.
- ACR usage JSON.
- Git commit, `main-<sha>` tag, resolved digest, and digest-pinned runtime image.
- ACA template image and 100 percent traffic revision image.

## Prune Safety

Pruning is storage hygiene, not a deploy mechanism. The rule is dry-run first, then approved delete.

Always identify the active image digest before considering deletion:

```bash
az containerapp show \
  --name ca-abarva-web-lab-eastus \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --query properties.template.containers[0].image \
  --output tsv
```

Safe dry run for old `main-*` tags:

```bash
az acr run \
  --registry acrabarvalab001 \
  --cmd "acr purge --filter 'abarva/web:main-.*' --ago 14d --dry-run" \
  /dev/null
```

Approved deletion must reference the reviewed dry-run output and keep the active ACA digest plus the rollback window:

```bash
# acr-prune-approved: reviewed dry-run output, active ACA digest retained, rollback window retained.
ACR_PURGE_APPROVED=true \
az acr run \
  --registry acrabarvalab001 \
  --cmd "acr purge --filter 'abarva/web:main-.*' --ago 14d" \
  /dev/null
```

Do not purge untagged manifests by default. Digest-pinned runtimes and rollback references can depend on manifests that no longer have a friendly tag. Untagged-manifest deletion requires a named break-glass note:

```bash
# acr-prune-untagged-approved: <approver>, <date>, <active digest checked>, <rollback digests retained>.
```

For env/feature-flag changes, never run an image-less update against a shared runtime. Azure creates a new revision from the current Container App template. If that template still points at an old mutable tag, the env-only update reintroduces stale code.

## Forbidden Pattern

Do not run this against a shared runtime:

```bash
# deploy-authority-exception: forbidden-example
az containerapp update \
  --name ca-abarva-web-lab-eastus \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --set-env-vars ABARVA_FEATURE_EXAMPLE_TENANTS=first-capital
```

That command can mint a new revision from whatever image is currently stored in the template.

## Required Env/Flag Update Shape

Use the approved digest-pinned image from the current main deploy evidence, then include it in the update:

```bash
APP_NAME=ca-abarva-web-lab-eastus
RESOURCE_GROUP=rg-abarva-controlplane-lab-eastus
APPROVED_IMAGE='acrabarvalab001.azurecr.io/abarva/web@sha256:<digest>'

az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --image "$APPROVED_IMAGE" \
  --set-env-vars ABARVA_FEATURE_EXAMPLE_TENANTS=first-capital
```

After the update, verify template and traffic images:

```bash
az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "{templateImage:properties.template.containers[0].image,traffic:properties.configuration.ingress.traffic,latestReadyRevisionName:properties.latestReadyRevisionName}" \
  --output json
```

Then inspect the 100 percent traffic revision:

```bash
az containerapp revision show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --revision "<revision-with-100-percent-traffic>" \
  --query "{image:properties.template.containers[0].image,health:properties.healthState,running:properties.runningState}" \
  --output json
```

Or run the invariant checker:

```bash
npm run deploy:aca-runtime-invariant -- \
  --expected-image 'acrabarvalab001.azurecr.io/abarva/web@sha256:<digest>' \
  --out-dir audit-artifacts/aca-runtime-drift
```

The checker fails if:

- Traffic is split or the 100 percent revision is not a main revision.
- The template image and traffic revision image differ.
- The active image is not digest-pinned.
- The active digest lacks a `main-<sha>` tag.
- The active digest has a forbidden tag such as `source-*`.
- The health endpoint is not `ok=true`.

## Proof Bundle

Do not call a release live-proven until the evidence bundle contains:

- PR and merge commit.
- ACA deploy workflow run.
- Deploy identity: GitHub actor, Azure client id, subscription, and UTC timestamp.
- Approved digest-pinned image.
- Template image after update.
- 100 percent traffic revision image after update.
- Worker job image export when workers are in scope.
- Feature flag/env var state when flags are in scope.
- Live signed-in client proof for every affected client and route/artifact.

## Migration Rule

For the new environment migration, create separate Product Dev, Product Preview, Product Prod, client preprod, and client prod Container Apps. Do not point branch deploys at a shared Product/Lab app as a shortcut. The promotion unit is the digest-pinned image, not a mutable tag or branch name.

Cloud-side enforcement must match the repo rule:

- Only the GitHub OIDC identity used by the repo-owned main deploy workflow should have write permission to shared Product/Lab Container Apps and worker jobs.
- Human/operator identities may have read access by default; write access requires a named break-glass role, time-bound assignment, and evidence capture.
- Branch or preview deploy identities must be scoped to preview/client-preprod Container Apps only.
- The ACR promotion path must record the image digest before any Product/Lab runtime update.

## RBAC Lockdown Procedure

Read current writers before changing anything:

```bash
APP_SCOPE='/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.App/containerApps/ca-abarva-web-lab-eastus'
ACR_SCOPE='/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ContainerRegistry/registries/acrabarvalab001'

az role assignment list --scope "$APP_SCOPE" --include-inherited \
  --query '[].{principalName:principalName,principalType:principalType,role:roleDefinitionName,scope:scope,principalId:principalId}' \
  --output table

az role assignment list --scope "$ACR_SCOPE" --include-inherited \
  --query '[].{principalName:principalName,principalType:principalType,role:roleDefinitionName,scope:scope,principalId:principalId}' \
  --output table
```

The intended steady state for the shared Product/Lab web app is:

- `abarva-github-aca-main-deploy` has the minimum Container Apps write role needed for `ca-abarva-web-lab-eastus` and the minimum ACR push/build role needed for `acrabarvalab001/abarva/web`.
- Runtime managed identities have only pull/data-plane permissions needed at runtime; they do not have Container Apps write or ACR push.
- Agent/Codex/preview service principals do not have write access to the shared Product/Lab Container App or ACR repository. They use preview/client-preprod resources.
- Human users have Reader by default. Break-glass write access is time-bound and documented.

Revoke broad non-main writers only after confirming the approved deploy principal:

```bash
# Example only: replace PRINCIPAL_ID and ROLE with the exact assignment found above.
az role assignment delete \
  --assignee '<principal-id-to-remove>' \
  --role '<role-to-remove>' \
  --scope "$APP_SCOPE"

az role assignment delete \
  --assignee '<principal-id-to-remove>' \
  --role '<role-to-remove>' \
  --scope "$ACR_SCOPE"
```

After RBAC changes, immediately run:

```bash
npm run deploy:aca-runtime-invariant -- --out-dir audit-artifacts/aca-runtime-drift-rbac-proof
```

## 2026-06-24 Flip-Back Incident Evidence

Observed bad state:

- Rogue ACR tag: `source-ava-93055367`.
- Rogue digest: `sha256:50ffc9dd48f40522a1c344e211d7ff30ff537722fc8d7223b59c66657803994b`.
- ACR created time: `2026-06-24T00:10:43.010835Z`.
- Rogue ACA revision: `ca-abarva-web-lab-eastus--0000141`.
- Rogue revision created time: `2026-06-24T00:11:28Z`.
- Rogue revision image: `acrabarvalab001.azurecr.io/abarva/web@sha256:50ffc9dd48f40522a1c344e211d7ff30ff537722fc8d7223b59c66657803994b`.
- Bad traffic state: `0000141` received `100%` traffic.

Live correction:

- Approved revision: `ca-abarva-web-lab-eastus--main-e70ae041`.
- Approved digest: `sha256:67812c07215f98662aed720ee38ca7aaa8674bcda267fbdf520b8334fad99e9c`.
- The rogue `0000141` revision was deactivated after traffic was restored to the approved main revision.

RBAC finding at incident time:

- Human account `anand.sundaram@thesundaram.com` had inherited subscription Owner.
- Service principal `sp-abarva-codex-lab` had subscription Owner plus resource-group Contributor and ACR push.
- Service principal `cursor-abarva-cloud-agent-20260606` had resource-group Contributor, Container Apps Contributor, and ACR push.
- Service principal `abarva-github-aca-main-deploy` had resource-group Contributor.
- User `admin@abarva.ai` had subscription Contributor.

Those broad writers mean the repo kernel can catch drift but cannot prevent a terminal, agent, or non-main workflow with Azure credentials from mutating the shared runtime. Cloud RBAC must be reduced to the intended steady state above.
