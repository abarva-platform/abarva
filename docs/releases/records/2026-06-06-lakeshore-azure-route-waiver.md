# 2026-06-06-lakeshore-azure-route-waiver — Lakeshore Azure Public-Route Waiver

## Release ID

`2026-06-06-lakeshore-azure-route-waiver`

## Status

`candidate`

## Plain-English Summary

This release records the decision that the public Vercel Azure connectivity health route is not required to call Lakeshore non-corpus demo readiness green. The Azure private-plane proof is the Container Apps Job smoke, which passed all substrate checks. The public Vercel route remains an optional guarded operator diagnostic.

## Layer Impact

- `public-demo`: Updates the demo proof index to mark Lakeshore non-corpus readiness as green and move corpus work to the final lane.
- `internal-admin`: Adds an operator-facing waiver explaining why the public Vercel route-level Azure proof is optional and not a private-plane blocker.

No runtime code, schema, migrations, or live client data changed.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore proof packet only.
- Internal only: Azure route-waiver rationale.
- Public/demo only: Demo proof status and evidence index.
- Feature flag: None.

## Changes Included

- Added `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3193-azure-private-plane/public-route-waiver.md`.
- Updated `docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md`.
- Added this release record.

## QA / Validation

- Previously captured Azure Container Apps Job execution `job-azure-connectivity-smoke-eus-fti8q63`: succeeded with Postgres, Blob Storage, Service Bus, Key Vault, and Azure AI Search all passing.
- Production deployment `dpl_BzoHpHQrYafhpZZMdhFDRBzvj48u` was READY and aliased to `https://app.abarva.ai`.
- `https://app.abarva.ai/api/health` returned `ok: true` with Postgres/direct Postgres checks green.
- Current-production Lakeshore app readiness after #3196: 26/26 pass, 0 watch, 0 fail.
- Current-production Source/Moves retrieval after #3196: 8/8 pass, 0 fail.

## Rollout Plan

Merge this docs-only evidence decision to main. No runtime deploy is required for behavior; deploy the docs/index with the next production documentation refresh.

## Rollback Plan

Revert the documentation commit if the team decides public Vercel route-level proof must remain a Lakeshore blocker. There are no migrations or runtime changes to roll back.

## Audit Evidence

- Azure proof: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3193-azure-private-plane/azure-connectivity-smoke.md`.
- Waiver proof: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3193-azure-private-plane/public-route-waiver.md`.
- Current-production app readiness reports copied to `/Users/anand/Downloads/lakeshore-success-brief-2026-06-05/live-proof/post-3196`.

## Known Gaps

- Corpus expansion and hardening remain intentionally last.
- Public Vercel route-level Azure connectivity proof remains optional operations work.

