# 2026-08-16-source-canonical-l4-rls-selection - Source canonical L4 RLS selection

## Release ID

`2026-08-16-source-canonical-l4-rls-selection`

## Status

`candidate`

## Plain-English Summary

Source product readers now set the database tenant session to the canonical tenant key when checking refreshed governed L4 and Cube-facing views. Legacy alias keys remain available only in the explicit fallback path, so refreshed canonical rows are not hidden behind older alias-scoped projections.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products: Source workspace, Vendor 360, Home Source summary, and Source cube snapshot readers select canonical L4 rows before any legacy fallback.

Layer 3 canonical model: No schema, canonical object, or source data write is included.

## Client Applicability

- All clients: Yes. The read-selection invariant applies to every Source tenant.
- Specific clients: Current validation focuses on the approved demo refresh scope.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`: canonical Source read path filters and RLS session use `canonicalTenantKey(...)`.
- `src/lib/source/data-model/source-v4-workspace-snapshot.ts`: governed workspace snapshot reads use canonical tenant keys.
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`: asserts canonical session keys for Source readers.
- `src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts`: asserts canonical session keys for governed cube snapshot reads.

## QA / Validation

- Pass: `npm test -- 'src/lib/source/data-model/__tests__/read-adapter.test.ts' 'src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts' --runInBand`.
- Pass: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/source-v4-workspace-snapshot.ts src/lib/source/data-model/__tests__/read-adapter.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts`.

## Rollout Plan

Merge to `main` through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. After deploy, verify the ACA runtime invariant and rerun signed-in product proof for Home and Source portfolio routes.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned main deploy workflow.
- Approved image digest: To be captured from ACA deploy evidence.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to restore the prior read-selection behavior. No data-plane rollback is required because this release does not mutate source data.

## Audit Evidence

- PR URL, merge commit, ACA deploy evidence, and signed-in crawl proof to be captured after merge.
- Local validation commands listed above.

## Known Gaps

This release fixes product read selection only. It does not create additional L4 facts for performance or sourcing-event cubes.
