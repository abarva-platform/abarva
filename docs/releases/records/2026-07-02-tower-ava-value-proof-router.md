# 2026-07-02-tower-ava-value-proof-router — Tower value-proof router hardening

## Release ID

`2026-07-02-tower-ava-value-proof-router`

## Status

`candidate`

## Plain-English Summary

Routes Tower value-proof questions through the governed Tower answer path instead of the older Atlas fallback path. This fixes live 422 blocks where Lakeshore value-proof questions generated internal phrases such as “read model” before display.

## Layer Impact

- `global-control-lane`: Updates shared Tower question routing for all clients.
- `client-data-lane`: No data, schema, ingestion, or client facts changed.

## Client Applicability

- All clients: Tower aVa questions about measured-value evidence, missing value proof, and board-ready value evidence.
- Specific clients: Validated against Lakeshore and SkyHarbor via the Tower 50x2 audit lane.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/tower-factual-spine.ts`: broadens governed Tower routing for value-proof evidence prompts.
- `src/lib/atlas/__tests__/tower-factual-spine.test.ts`: adds the exact failed live prompts to the governed-router regression set.

## QA / Validation

- Pass: `npx jest src/lib/atlas/__tests__/tower-factual-spine.test.ts src/lib/cio-tower/__tests__/answer.test.ts --runInBand` — 43/43 passed.
- Pass: `npx eslint src/lib/atlas/tower-factual-spine.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Not run yet: live signed-in `BASE_URL=https://app.abarva.ai node tmp/run-tower-ava-live-50x2.mjs`; run after ACA deploy.

## Rollout Plan

Merge to `main`; repo-owned ACA main deploy builds and deploys the new image; verify ACA revision, digest, traffic, and health; rerun the live Tower 50x2 audit.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy` on `main`.
- Shared runtime mutators: No local/manual ACA traffic mutation in this release.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Must show template image, traffic revision image, and active revision image aligned.
- Worker image invariant: Managed by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, via the Tower 50x2 audit.

## Rollback Plan

Revert this commit or redeploy the previous known-good `main` image through the repo-owned ACA deploy workflow.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- Live audit folder: pending post-deploy.

## Known Gaps

This release only fixes governed routing for value-proof questions. It does not change Tower data, dashboard visuals, or non-Tower surfaces.
