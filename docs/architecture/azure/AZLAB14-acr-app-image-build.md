# AbarVa Azure Lab ACR App Image Build

Status: image built and pushed to `acrabarvalab001` on 2026-05-14  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Data posture: synthetic/no-client-data only

## Purpose

This stage proves that the real AbarVa Next.js app can be packaged by Azure Container Registry remote build and stored in the Azure image supply chain.

This is a material step beyond infrastructure smoke testing:

- ACR can build from the repo source package.
- The Dockerfile can install dependencies on Node 24.
- The Next.js production build can compile and typecheck inside Azure.
- The runtime image can be produced without baking `.env` files or secrets.
- The resulting image can be pushed to ACR for future Container Apps deployment.

## Image

| Field | Value |
|---|---|
| Registry | `acrabarvalab001.azurecr.io` |
| Repository | `abarva/web` |
| Tag | `lab-ebe449ae-r3` |
| Digest | `sha256:4a2d750ec9f989238bbeebfc1e07a0c71c6cc682ae0de0ac23c74a05e1838c1d` |
| Base image | `node:24-bookworm-slim` |

## Build Findings

The first build attempt failed because `.dockerignore` excluded all of `docs/`, while app CSS imports `docs/design/strategic-moves/tokens.css`.

The fix keeps docs excluded but allows the single required design-token file:

- `docs/*`
- `!docs/design/`
- `docs/design/*`
- `!docs/design/strategic-moves/`
- `docs/design/strategic-moves/*`
- `!docs/design/strategic-moves/tokens.css`

The second build attempt compiled successfully but failed during TypeScript with Node heap exhaustion. The fix adds build-stage heap headroom:

```dockerfile
ENV NODE_OPTIONS=--max-old-space-size=4096
```

The third build succeeded and pushed the image.

## Validation Evidence

ACR build result:

- Run ID: `ca3`
- Result: successful
- Build duration: about 5m38s
- Next.js compile: succeeded
- TypeScript: succeeded
- Static page generation: 267/267 succeeded
- Image push: succeeded

ACR verification:

- `az acr repository show-tags --repository abarva/web` returned `lab-ebe449ae-r3`
- Latest manifest digest returned `sha256:4a2d750ec9f989238bbeebfc1e07a0c71c6cc682ae0de0ac23c74a05e1838c1d`

## What This Does Not Prove Yet

This proves build and registry readiness. It does not yet prove runtime readiness because the real app still needs environment wiring:

- Clerk publishable/secret keys
- Supabase/Postgres connection information
- model/provider keys or gateway configuration
- app URL/session settings
- Key Vault to Container Apps secret projection
- health endpoint validation behind Container Apps

Those should be handled in the next runtime PR, not hidden in the image.

