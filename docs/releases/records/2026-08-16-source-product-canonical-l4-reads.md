# 2026-08-16-source-product-canonical-l4-reads — Source Product Canonical L4 Reads

## Release ID

`2026-08-16-source-product-canonical-l4-reads`

## Status

`candidate`

## Plain-English Summary

Source product reads now prefer the refreshed canonical Source L4 tenant key before falling back to legacy alias-family reads. This prevents refreshed governed rows from being blended with older canary or alias rows when both exist.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products: Source workspace, Vendor 360, and related Source portfolio readers resolve governed product projections from canonical Source L4 rows first.

Layer 3 canonical model: No schema or canonical object write is included.

## Client Applicability

- All clients: Source readers use the same canonical-first rule.
- Specific clients: The current runtime proof focuses on the approved demo refresh scope.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source data-model readers use canonical Source tenant keys before alias fallback for `source.contract_360`, `source.contract_vendor_360`, `source.vendor_contract_portfolio`, `source.contract_application_scope`, and `source.contract_initiative_dependency`.
- Source workspace cube snapshot reads governed `consumption.*` rows by canonical tenant key.
- Unit tests assert canonical-first behavior and legacy fallback preservation.

## QA / Validation

- `npm test -- 'src/lib/source/data-model/__tests__/read-adapter.test.ts' 'src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts' --runInBand` — passed.
- `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/source-v4-workspace-snapshot.ts src/lib/source/data-model/__tests__/read-adapter.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts` — passed.

## Rollout Plan

Merge to main through PR. The repo-owned ACA main deploy workflow builds and deploys the runtime image. After deploy, verify the ACA runtime invariant and signed-in Source product pages against refreshed Layer 4 projections.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned main deploy workflow.
- Approved image digest: To be captured from ACA deploy evidence.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace and Vendor 360 / portfolio route.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to restore the prior product read behavior. Data-plane contents are not mutated by this release.

## Audit Evidence

- PR URL, merge commit, ACA deploy evidence, and post-deploy signed-in product proof to be captured after merge.
- Local validation commands listed above.

## Known Gaps

This release changes product read selection only. It does not create new Layer 3 canonical records, Source L4 rows, Cube rows, or document evidence.
