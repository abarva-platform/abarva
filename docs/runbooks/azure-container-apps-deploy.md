# Azure Container Apps Deploy Runbook

## Purpose

`app.abarva.ai` is deployed through Azure Container Apps. Vercel is not an approved deployment path for the live app.

Use this runbook whenever a user asks whether the app is deployed, asks to deploy, asks to roll back, or asks for live QA on `app.abarva.ai`.

## Canonical Target

- Azure subscription: `abarva-lab-sub`
- Resource group: `rg-abarva-controlplane-lab-eastus`
- Container app: `ca-abarva-web-lab-eastus`
- Container registry: `acrabarvalab001`
- Public domain: `https://app.abarva.ai`
- Image repository: `acrabarvalab001.azurecr.io/abarva/web`

## Deploy Steps

Replace `<sha>` with the exact commit SHA being deployed. Replace `<digest>` with the immutable image digest produced by ACR for that build; do not deploy mutable tags to the shared app runtime.

```bash
git worktree add --detach /tmp/nexus-deploy-<sha> <sha>

az acr build \
  -r acrabarvalab001 \
  -t abarva/web:<tag> \
  /tmp/nexus-deploy-<sha>

az containerapp update \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --image "acrabarvalab001.azurecr.io/abarva/web@sha256:<digest>"
```

Wait for the new revision to become healthy:

```bash
az containerapp show \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --query '{latestRevisionName:properties.latestRevisionName,latestReadyRevisionName:properties.latestReadyRevisionName,image:properties.template.containers[0].image,traffic:properties.configuration.ingress.traffic}' \
  -o json

az containerapp revision show \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --revision <revision-name> \
  --query '{name:name,active:properties.active,replicas:properties.replicas,trafficWeight:properties.trafficWeight,healthState:properties.healthState,provisioningState:properties.provisioningState,image:properties.template.containers[0].image}' \
  -o json
```

Move traffic only after the new revision is healthy:

```bash
az containerapp ingress traffic set \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --revision-weight <revision-name>=100
```

## Required Live QA

After traffic is moved, verify live behavior against the public domain:

```bash
for p in / /access /home /sign-in /signed-out /forbidden /access-denied; do
  printf '\n--- %s ---\n' "$p"
  curl -sI --max-time 20 "https://app.abarva.ai$p" | sed -n '1,16p'
done
```

For signed-in product surfaces, run browser QA with a valid approved user. Do not claim user-visible success from image build, revision health, or curl alone when the request is about a signed-in experience.

## Rollback

Rollback is an ACA traffic operation. Find the prior healthy revision, then move traffic back:

```bash
az containerapp revision list \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --query '[].{name:name,active:properties.active,trafficWeight:properties.trafficWeight,healthState:properties.healthState,image:properties.template.containers[0].image}' \
  -o table

az containerapp ingress traffic set \
  -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus \
  --revision-weight <previous-good-revision>=100
```

## What Not To Use

Do not use these as production deploy evidence for `app.abarva.ai`:

- Vercel deployment status
- Vercel preview URLs
- `nexus-vert-kappa.vercel.app`
- `vercel deploy`
- `vercel rollback`
- `*.vercel.app` smoke results

The repository keeps `vercel.ts` only as a disabled sentinel so a linked Vercel project fails loudly instead of creating a misleading deployment.
