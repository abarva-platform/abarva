# 2026-06-05-lakeshore-tower-atlas-federated-proof - Lakeshore Tower/Atlas Federated Proof

## Release ID

`2026-06-05-lakeshore-tower-atlas-federated-proof`

## Status

`candidate`

## Plain-English Summary

This release tightens Lakeshore Tower demo readiness. It fixes Tower portfolio value reads against the live schema, makes Atlas value answers follow the CXO digest contract, and adds an authenticated Lakeshore QA harness for Tower routes, value-state APIs, legacy synthesis honesty, and Atlas federated command answers.

## Layer Impact

- `global-control-lane`: Atlas prompt and scripted ROI response shape are shared Tower behavior for all clients.
- `client-data-lane`: Tower value-state reads now match the live data-plane schema for client-scoped portfolio value rows.
- `internal-admin`: Adds a QA harness and evidence packet for Lakeshore demo readiness.

## Client Applicability

- All clients: Atlas hard-question naming discipline and scripted ROI digest shape.
- Specific clients: Lakeshore is the proof target for the new QA harness.
- Internal only: The QA script and generated report artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/tower/value-states/repository.ts`
- `src/lib/atlas/prompt.ts`
- `src/lib/atlas/scripted-engine.ts`
- `src/lib/tower/value-states/__tests__/repository.azure-read.test.ts`
- `src/lib/atlas/__tests__/prompt-client-naming.test.ts`
- `scripts/lakeshore/tower-atlas-federated-qa.mjs`

## QA / Validation

- `node scripts/lakeshore/tower-atlas-federated-qa.mjs` against production captured the pre-fix Tower value-state failure and Atlas answer-shape gaps.
- Focused Jest, diff hygiene, and release check are required before PR.
- A post-deploy rerun of the QA harness is required before calling the Lakeshore Tower lane green.

## Rollout Plan

Merge to main through PR, deploy the latest main to Vercel production, then rerun the Lakeshore Tower/Atlas federated QA harness against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR. The value-state query reverts to the previous join predicate; Atlas prompt and scripted ROI output return to the prior shape. The QA script is internal and can be ignored or removed without runtime effect.

## Audit Evidence

- PR URL: to be added when opened.
- Pre-fix evidence: `audit-artifacts/lakeshore-tower-atlas-federated-qa/`.
- Post-fix evidence: to be added after deploy.

## Known Gaps

- Legacy `/api/tower/synthesis` remains tenant-safe and honest for Lakeshore but does not yet synthesize Lakeshore DB portfolio instances. The primary Atlas path is `/api/v1/atlas/ask`.
- Tenant-scoped `/tenant/lakeshore/tower` and `/tenant/lakeshore-holdings/tower` are optional route aliases and currently return the app's governed 404.
