# 2026-07-02-tower-ava-hold-evidence-route — Tower hold-until-evidence routing

## Release ID

`2026-07-02-tower-ava-hold-evidence-route`

## Status

`candidate`

## Plain-English Summary

This release routes the exact Tower aVa question shape "Which AI initiatives should leadership hold until evidence improves?" into the governed deterministic Tower path. The live audit showed this one prompt still fell through to the slower model-backed path, where visible-answer enforcement blocked internal wording.

## Layer Impact

- `global-control-lane`: Updates shared Tower routing for all tenants.
- `client-data-lane`: No data, schema, ingestion, or tenant fact changes.

## Client Applicability

- All clients: Yes, for Tower aVa value-proof and evidence-improvement questions.
- Specific clients: Live failure was Lakeshore `ai-06`; SkyHarbor was already passing.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/tower-factual-spine.ts`: adds "evidence improves" / "hold until evidence" wording to the governed Tower candidate gate.
- `src/lib/atlas/__tests__/tower-factual-spine.test.ts`: adds the exact failed live prompt to the governed-candidate regression list.

## QA / Validation

- Pass: `npx jest src/lib/atlas/__tests__/tower-factual-spine.test.ts src/lib/cio-tower/__tests__/answer.test.ts --runInBand` — 43/43 passed.
- Pass: `npx eslint src/lib/atlas/tower-factual-spine.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts`.
- Not run yet: TypeScript and `npm run release:check`.
- Not run yet after deploy: rerun `BASE_URL=https://app.abarva.ai node tmp/run-tower-ava-live-50x2.mjs` and confirm the audit reaches 100/100 with no slow 20s model detour for `ai-06`.

## Rollout Plan

Merge to `main`; use the repo-owned Azure Container Apps main deploy workflow; verify ACA revision, image digest, 100% traffic, and health; rerun the signed-in Tower 50x2 audit.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy` on `main`.
- Shared runtime mutators: No local/manual ACA traffic mutation in this release.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Managed by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR or redeploy the previous approved `main` image through the repo-owned ACA deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- Live audit before fix: `/Users/anand/Downloads/tower-ava-50x2-live-post4331-2026-07-02T14-41-29-362Z` showed 99/100 with one Lakeshore `ai-06` 422 and 20.9s latency.
- Live audit after fix: pending.

## Known Gaps

This release only fixes the last Tower aVa routing/latency outlier in the 50x2 audit. Tower right-side canvas polish remains a separate product slice.
