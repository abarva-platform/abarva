# Azure Container Apps Deploy Runbook

## Purpose

`app.abarva.ai` is deployed through Azure Container Apps. Vercel is not an approved deployment path for the live app.

Use this runbook whenever a user asks whether the app is deployed, asks to deploy, asks to roll back, or asks for live QA on `app.abarva.ai`.

## Deployment Authority

**Only the repo-owned ACA main deploy workflow may build or deploy shared Product/Lab web traffic.**

- Canonical workflow: `.github/workflows/aca-main-deploy.yml`
- Triggers on push to `refs/heads/main` only
- Builds image via Docker Buildx with GitHub Actions cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`)
- Pushes `main-<sha>` tag to `acrabarvalab001.azurecr.io/abarva/web`
<!-- deploy-authority-exception: descriptive text below, not an executed command -->
- Resolves digest and deploys with `--image acrabarvalab001.azurecr.io/abarva/web:main-<sha>@sha256:<digest>`
- Waits for new revision to become healthy before shifting traffic
- Shifts 100% ingress traffic to the new revision via the workflow

<!-- deploy-authority-exception: prohibition statement below, not an executed command -->
Agents must not run `az acr build`, local `docker push`, or branch workflows that write to `acrabarvalab001/abarva/web`.

## Canonical Target

- Azure subscription: `abarva-lab-sub`
- Resource group: `rg-abarva-controlplane-lab-eastus`
- Container app: `ca-abarva-web-lab-eastus`
- Container registry: `acrabarvalab001` (Premium SKU required)
- Public domain: `https://app.abarva.ai`
- Image repository: `acrabarvalab001.azurecr.io/abarva/web`

## Deploy Steps

**All production deploys go through the GitHub Actions workflow.** To trigger a deploy:

1. Merge the approved PR to `main`.
2. The `aca-main-deploy.yml` workflow triggers automatically on push to `main`.
3. The workflow builds, pushes, and deploys the image with a digest-pinned `--image`.
4. Monitor the workflow run — the job waits for the new revision to become healthy before shifting traffic.
5. After the workflow completes, verify the runtime invariant (see below).

To trigger a manual re-deploy of the current `main` HEAD:

```bash
# deploy-authority-exception: operator-initiated re-deploy of main HEAD via approved workflow
env -u GH_TOKEN gh workflow run "ACA main deploy" \
  --repo abarva-platform/abarva \
  --ref main
```

## Runtime Invariant

After any deploy, verify that the ACA runtime invariant holds before claiming the change is live:

```bash
az containerapp show \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --query '{template_image:properties.template.containers[0].image,traffic:properties.configuration.ingress.traffic,latestRevision:properties.latestRevisionName,latestReady:properties.latestReadyRevisionName}' \
  -o json
```

The invariant is satisfied when:
- The template image, the 100%-traffic revision image, and all required worker job images match the approved `main-<sha>@sha256:<digest>` digest.
- The `latestReadyRevisionName` carries 100% traffic weight.

## Required Live QA

After the invariant is verified, run browser QA with a valid signed-in user. Do not claim user-visible success from image build, revision health, or curl alone when the request is about a signed-in experience.

Unauthenticated smoke check (for route-level health only):

```bash
for p in / /access /home /sign-in /signed-out /forbidden /access-denied; do
  printf '\n--- %s ---\n' "$p"
  curl -sI --max-time 20 "https://app.abarva.ai$p" | sed -n '1,16p'
done
```

## Rollback

Rollback is an ACA traffic operation. The approved path is to re-deploy the prior good `main` SHA via the workflow — not to manually shift traffic.

To list recent revisions and their health state:

```bash
az containerapp revision list \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --query '[].{name:name,active:properties.active,trafficWeight:properties.trafficWeight,healthState:properties.healthState,image:properties.template.containers[0].image}' \
  -o table
```

If a rollback requires shifting traffic outside the workflow (documented break-glass only), use the prior good revision name:

```bash
# deploy-authority-exception: break-glass rollback — document in incident record before running
az containerapp ingress traffic set \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --revision-weight <previous-good-revision>=100
```

Break-glass rollback requires a post-incident release record entry and must be followed by a proper workflow deploy at the next opportunity.

## What Not To Use

Do not use these as production deploy evidence for `app.abarva.ai`:

- Vercel deployment status
- Vercel preview URLs
- `nexus-vert-kappa.vercel.app`
- `vercel deploy`
- `vercel rollback`
- Any `*.vercel.app` URL
<!-- deploy-authority-exception: prohibition statement, not an executed command -->
- Local `docker push` or ad-hoc `az acr build` commands targeting `acrabarvalab001/abarva/web`
- Branch-triggered container app revisions (feature branches must not mutate shared web traffic)
