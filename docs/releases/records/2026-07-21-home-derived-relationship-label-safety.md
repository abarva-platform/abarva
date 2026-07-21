# 2026-07-21-home-derived-relationship-label-safety — Home Derived Graph Label Safety

## Release ID

`2026-07-21-home-derived-relationship-label-safety`

## Status

`candidate`

## Plain-English Summary

Home now applies the same client-readable label safety rule to both relationship graph sources: the approved-pack fallback and the richer `derived/relationship-graph.json` files. The first label-safety pass protected fallback-derived edges, but live proof showed raw labels still leaking from server-derived graph files, including `_to_confirm`, `DATA-####`, `PROG-*`, `CHG-*`, and snake_case package labels.

## Layer Impact

- `global-control-lane`: Home Knowledge graph rendering now filters non-business-readable labels consistently across both graph paths.
- `client-data-lane`: no source data is edited or hidden from evidence inventory; only graph-node rendering is filtered for CXO readability.

## Client Applicability

- All clients: yes, where Home uses approved-pack relationship rows or derived graph files.
- Specific clients: Airline Demo, FS Demo, Lakeshore Holdings, Retail Demo, Healthcare Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/derive-relationship-edges.ts`: expands business-readable label filtering to snake_case placeholders and uppercase id chains.
- `src/lib/home/read-derived-relationship-graph.ts`: applies the same label gate to derived graph-file edges before they are passed to the client.
- `src/lib/home/__tests__/derive-relationship-edges.test.ts`: adds regression coverage for snake_case and uppercase id-chain labels.
- `src/lib/home/__tests__/read-derived-relationship-graph.test.ts`: adds regression coverage for derived graph-file leaks found in live proof.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/__tests__/derive-relationship-edges.test.ts src/lib/home/__tests__/read-derived-relationship-graph.test.ts --runInBand` — passed, 14 tests.
- `npx eslint src/lib/home/derive-relationship-edges.ts src/lib/home/read-derived-relationship-graph.ts src/lib/home/__tests__/derive-relationship-edges.test.ts src/lib/home/__tests__/read-derived-relationship-graph.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.
- Post-deploy signed-in proof for Airline Demo, FS Demo, and Healthcare Demo — not-run before merge/deploy.

## Rollout Plan

Merge to `main`; deploy through the repo-owned ACA main deploy workflow. After deployment, rerun signed-in Home proof and verify the Relationships graph renders with zero placeholder/id-like node labels.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: workflow-managed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or roll ACA traffic back to the previous healthy revision. No data rollback is required.

## Audit Evidence

- Pre-fix live proof: `proof/home-relationship-label-safety-live-20260721/results.json` showed graph label violations for Airline Demo and Healthcare Demo.
- Post-fix PR: pending.
- Post-deploy proof: pending.

## Known Gaps

This keeps incomplete/source-id labels out of the executive graph. It does not remediate the underlying source rows; those remain evidence-quality cleanup items.
