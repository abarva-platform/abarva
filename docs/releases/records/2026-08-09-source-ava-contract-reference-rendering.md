# 2026-08-09-source-ava-contract-reference-rendering — Source aVa Contract Reference Rendering

## Release ID

`2026-08-09-source-ava-contract-reference-rendering`

## Status

`candidate`

## Plain-English Summary

This release keeps public Source contract references visible in aVa answers when the selected contract is part of the governed Source workspace context. The same render safety layer continues to suppress raw UUIDs, bracketed internal handles, old data-layer labels, and non-contract internal codes.

## Layer Impact

Affected lane: `global-control-lane`.

Layer 4 PRODUCTS only. The change affects how aVa answer packets are cleaned and shaped for client-visible rendering. It does not change canonical data, Source calculations, loaders, migrations, cubes, or workflow state.

## Client Applicability

- All clients: yes, shared aVa answer rendering and Source contract-chat behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Product-truth runtime cleanup preserves public Source contract IDs in the `CTR-###` family while continuing to remove other raw internal codes.
- aVa answer render sanitization and render-layer shaping preserve the same public Source contract IDs in prose, facts, graph labels, and artifact payloads.
- Source workspace aVa route tests now assert deterministic contract visual answers include the selected contract reference.
- Removed an unused test fixture from the affected route test file.

## QA / Validation

- `pass` Focused Jest: `src/lib/intelligence/answer/__tests__/answer-safety.test.ts`, `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`, `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`, Source workspace aVa, Contract 360 view-model, optimization ledger, optimization opportunity, and Door 1 route tests. Result: 9 suites passed, 65 tests passed.
- `pass` Focused ESLint on changed sanitizer, shaper, runtime-guard, route test, and Source workspace aVa test files.
- `pending` `npm run release:check`.
- `pending` Live signed-in Source/aVa browser proof after merge/deploy.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image to the shared web runtime. No manual data-plane, schema, migration, loader, cube, or feature-flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: required before claiming live proof
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes, Source workspace aVa response with selected contract context

## Rollback Plan

Revert the rendering PR and allow the repo-owned ACA main deploy workflow to redeploy the prior render behavior. No migration rollback is required.

## Audit Evidence

PR, merge commit, GitHub Actions deploy run, focused test output, release-check output, live signed-in Source/aVa proof bundle.

## Known Gaps

This release does not alter Contract 360 tab layout, optimization calculations, evidence loading, or workflow approvals.
