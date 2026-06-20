# Deploy Authority And Runtime Invariant

This runbook prevents a stale branch image from becoming the live Azure Container Apps runtime when someone updates env vars, feature flags, scale, secrets, or traffic.

## Allowed Shared-Runtime Mutator

The only allowed shared Product/Lab web traffic mutator is the repo-owned `ACA main deploy` workflow in `.github/workflows/aca-main-deploy.yml`.

Shared runtime means any Container App or Container Apps Job that serves or generates artifacts for multiple clients in Product/Lab. Branch experiments, preview testing, and client-specific rehearsals must use their own environment or Container App.

## Runtime Invariant

For every shared ACA web app update:

- The source commit is `origin/main` HEAD.
- The web image is pinned by digest: `acr.../abarva/web@sha256:<digest>`.
- The Container App template image equals the approved digest-pinned image.
- The 100 percent traffic revision image equals the same approved digest-pinned image.
- Worker jobs that execute code for the same release use the same approved digest-pinned image.

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

## Proof Bundle

Do not call a release live-proven until the evidence bundle contains:

- PR and merge commit.
- ACA deploy workflow run.
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
