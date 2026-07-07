# Product Dev CI/CD Packet

## Purpose

This packet makes ENV-07 executable before Product Dev exists. It defines how code reaches Product Dev, what evidence must be captured, what gates must stay green, and where an agent must stop for approval.

It is intentionally non-mutating. Do not create secrets, federated credentials, Azure resources, migrations, deployments, or traffic shifts from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_DEV_CICD_PACKET_2026-06.json`.

Verifier: `npm run azure:product-dev-cicd:verify`.

## Target

- Environment: Product Dev
- Runtime: Azure Container Apps
- Registry: Azure Container Registry
- Promotion unit: pinned image digest
- Default traffic shift: manual after health proof
- Data allowed: synthetic, fixture, engineering-test
- Data disallowed: client-confidential, PHI, PII, raw client private documents

PHI is not accepted. PII is not accepted.

## Release Flow

1. Merge a green PR to `main`.
2. Build an Azure image with a deterministic tag: `azure-main-<yyyymmdd>-<git_sha>`.
3. Record the pushed image digest.
4. Run migration replay before any live migration.
5. Deploy to Product Dev by pinned digest only after approval.
6. Prove `/`, `/api/health`, Azure/Postgres health, and required signed-in smoke paths.
7. Shift Product Dev traffic only after health proof.
8. Save the release evidence bundle and rollback command.

## Required PR Checks

Minimum checks:

- release check
- typecheck
- ESLint
- gitleaks
- fresh Postgres migration replay
- production readiness gate
- context corpus governance gate
- canonical tenant allowlist
- runtime Supabase import guard
- Vercel production runtime guard
- control-plane purity
- browser matrix smoke

## Approval Boundary

Explicit approval is required before:

- creating or changing GitHub environment secrets
- creating or changing Azure federated credentials
- deploying runtime to Product Dev
- running database migrations against Product Dev
- shifting Product Dev traffic
- increasing budget or runtime capacity
- loading any client private data

## Pre-Deploy Evidence

Every Product Dev deploy must capture:

- PR number
- merge commit SHA
- release record path
- CI check rollup
- migration replay result
- image tag
- image digest
- target subscription
- target resource group
- target Container App
- feature flags
- rollback target revision

## Post-Deploy Evidence

Every Product Dev deploy must capture:

- ACA revision
- ACA revision image digest
- traffic state before and after
- curl root headers
- curl health JSON
- proof that no Vercel headers are present
- Azure/Postgres health
- `direct_postgres=true`
- signed-in smoke if auth credentials are available
- rollback command

## Data Controls

Product Dev is still a product-development environment. It may use synthetic, fixture, and engineering-test data only.

Context loads must follow the governed ingestion truth standard: staged file, parser, committed records/facts/chunks, index refresh, retrieval proof, and citation proof are separate states. Uploads must produce an ingestion receipt. Nothing may auto-promote to `agent_ready`.

## Rollback Requirements

Before traffic changes, the evidence bundle must include:

- previous ACA revision
- previous image digest
- traffic restore command
- migration rollback or forward-fix note
- saved release evidence bundle

## Command Templates

These are templates only. Do not run without approval.

```bash
az acr build \
  --registry acrabarvalab001 \
  --image abarva/web:azure-main-<yyyymmdd>-<git_sha> \
  .
```

```bash
az containerapp update \
  --resource-group "<PRODUCT_DEV_RESOURCE_GROUP>" \
  --name "<PRODUCT_DEV_CONTAINER_APP>" \
  --image "<ACR_LOGIN_SERVER>/abarva/web@sha256:<digest>"
```

```bash
az containerapp ingress traffic set \
  --resource-group "<PRODUCT_DEV_RESOURCE_GROUP>" \
  --name "<PRODUCT_DEV_CONTAINER_APP>" \
  --revision-weight "<NEW_REVISION>=100"
```

## Completion Bar

ENV-07 is complete only when the Product Dev CI/CD path actually builds, deploys, verifies, records evidence, and proves rollback in Product Dev. Until then this packet is scaffold-ready only.
