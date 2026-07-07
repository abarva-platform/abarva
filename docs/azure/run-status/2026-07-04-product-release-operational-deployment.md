# Product Release Operational Deployment - 2026-07-04

## Status

Product Dev, Product Preview, and Product Prod are release-operational at the Azure Container Apps runtime layer.

This does not start client data migration, client private-plane cutover, DNS cutover, or public `app.abarva.ai` traffic cutover.

## Source

- GitHub PR #4405: Product release factory governance and operational audit.
- GitHub PR #4406: Product Docker build base-image override.
- Source merge commit: `b0a8517b4c3711f550dc7c41ca1e6b0f6b0c3ae7`.
- Product image tag: `main-b0a8517b4c3711f550dc7c41ca1e6b0f6b0c3ae7`.
- Product image digest: `sha256:d0acb0ade8ba0e327ef459b75f050040ef1a2755d37aebf2dd3d872ea16ee0ad`.
- Base image override used for product build: `node:24-bookworm-slim`.
- Base image digest reported by ACR build: `sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc`.

## ACR Changes

All three product registries were upgraded from Basic to Premium before the Product build and promotion:

| Environment | Registry | Final SKU |
| --- | --- | --- |
| Product Dev | `acrabvpdev001` | Premium |
| Product Preview | `acrabvpprev001` | Premium |
| Product Prod | `acrabvpprod001` | Premium |

The image was built in Product Dev ACR and imported by digest to Product Preview and Product Prod ACRs using the Product Dev registry resource ID.

## Runtime Deployment

| Environment | Subscription | Container App | Revision | Image |
| --- | --- | --- | --- | --- |
| Product Dev | `sub-abarva-product-dev-eus-001` | `ca-abarva-pdev-web-eus2-001` | `ca-abarva-pdev-web-eus2-001--mb0a8517b` | `acrabvpdev001.azurecr.io/abarva/web@sha256:d0acb0ade8ba0e327ef459b75f050040ef1a2755d37aebf2dd3d872ea16ee0ad` |
| Product Preview | `sub-abarva-product-preview-eus-001` | `ca-abarva-pprev-web-eus2-001` | `ca-abarva-pprev-web-eus2-001--mb0a8517b` | `acrabvpprev001.azurecr.io/abarva/web@sha256:d0acb0ade8ba0e327ef459b75f050040ef1a2755d37aebf2dd3d872ea16ee0ad` |
| Product Prod | `sub-abarva-product-prod-eus-001` | `ca-abarva-pprod-web-eus2-001` | `ca-abarva-pprod-web-eus2-001--mb0a8517b` | `acrabvpprod001.azurecr.io/abarva/web@sha256:d0acb0ade8ba0e327ef459b75f050040ef1a2755d37aebf2dd3d872ea16ee0ad` |

Each Container App reports 100% traffic to `latestRevision`, and `latestReadyRevisionName` equals the new revision listed above.

## Health Proof

Each environment returned:

```json
{
  "ok": true,
  "checks": {
    "postgres": true,
    "direct_postgres": true,
    "azure_graph": "postgres"
  }
}
```

Root route header checks returned HTTP 200 on the environment FQDNs and did not show Vercel runtime headers.

## Strict Audit

Command:

```bash
npm run azure:product-release-operational:audit:strict -- --health-timeout-ms 30000
```

Result:

```json
{
  "status": "release_operational",
  "summary": {
    "environments": 3,
    "release_operational": 3,
    "provisioned_not_operational": 0,
    "provisioned_needs_approval": 0,
    "unknown": 0,
    "pass": 57,
    "attention": 0,
    "fail": 0
  }
}
```

## Explicit Non-Claims

- No client private data migration was started.
- No client private-plane runtime was created or cut over.
- No public DNS or Front Door cutover was performed.
- No `app.abarva.ai` production traffic move was performed.
- No signed-in Clerk/SSO browser QA is claimed in this run-status file.
- No schema/data migration replay is claimed beyond the existing CI gates attached to the merged PRs.

## Follow-Ups

- Add a repo-owned Product Dev -> Product Preview -> Product Prod GitHub Actions deployment workflow with Buildx cache.
- Add permanent ACR import trust/RBAC between Product environment registries.
- Run signed-in Product Dev and Preview browser QA before client migration rehearsals.
- Complete Clerk Entra SSO hardening in Product Dev before public/client cutover decisions.
