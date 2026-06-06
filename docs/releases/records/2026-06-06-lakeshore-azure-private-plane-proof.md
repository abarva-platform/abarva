# 2026-06-06-lakeshore-azure-private-plane-proof — Lakeshore Azure Private-Plane Proof

## Release ID

`2026-06-06-lakeshore-azure-private-plane-proof`

## Status

`candidate`

## Plain-English Summary

This release records the fresh Azure private-plane connectivity proof for the Lakeshore demo-readiness packet. A current Azure Container Apps Job run passed all five substrate checks: Postgres, Blob Storage, Service Bus, Key Vault, and Azure AI Search.

## Layer Impact

- `public-demo`: Updates the buyer/demo evidence index with current proof that the Azure private data lane is functioning.
- `internal-admin`: Adds operator-facing evidence for Azure substrate readiness and the remaining public-route token/env gap.

No runtime code, schema, migrations, or live client data changed.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore proof packet and demo-readiness evidence only.
- Internal only: Azure operator proof evidence and truth-boundary notes.
- Public/demo only: Demo proof index documentation.
- Feature flag: None.

## Changes Included

- Added `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3193-azure-private-plane/azure-connectivity-smoke.md`.
- Updated `docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md` with current Azure private-plane proof and remaining public-route token/env boundary.
- Added this release record.

## QA / Validation

- Confirmed PR #3193 merged to main with all 19 checks passing.
- Confirmed production deployment `dpl_G2NWxCwBseLMAmTP3YFhfb7Gw9qS` is READY and aliased to `https://app.abarva.ai`.
- Confirmed `https://app.abarva.ai/api/health` returns `ok: true` with Postgres/direct Postgres checks green.
- Ran Azure Container Apps Job `job-azure-connectivity-smoke-eus`.
- Captured execution `job-azure-connectivity-smoke-eus-fti8q63`, status `Succeeded`, start `2026-06-06T10:10:21+00:00`, end `2026-06-06T10:10:58+00:00`.
- Captured job logs showing pass results for Postgres, Blob Storage, Service Bus, Key Vault, and Azure AI Search.

## Rollout Plan

Merge this docs-only evidence update to main. No app redeploy is required for runtime behavior, though the docs index may be redeployed with the next production docs deploy.

## Rollback Plan

Revert the documentation commit if the evidence needs to be corrected. There are no migrations or runtime changes to roll back.

## Audit Evidence

- Azure execution: `job-azure-connectivity-smoke-eus-fti8q63`.
- Azure web runtime revision observed: `ca-abarva-web-lab-eastus--0000047`.
- Vercel production deployment observed before this evidence update: `dpl_G2NWxCwBseLMAmTP3YFhfb7Gw9qS`.
- Evidence file: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3193-azure-private-plane/azure-connectivity-smoke.md`.

## Known Gaps

- The public Vercel guarded health route still returns masked `404` without `AZURE_CONNECTIVITY_HEALTH_TOKEN` or `INTERNAL_HEALTH_TOKEN`.
- Vercel production env still needs the route/operator token and private-plane service env if route-level positive proof from `app.abarva.ai` is required.
- Corpus expansion remains intentionally held until after non-corpus demo readiness.

