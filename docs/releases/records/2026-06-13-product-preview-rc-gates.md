# 2026-06-13-product-preview-rc-gates — Product Preview Release Candidate Gates

## Release ID

`2026-06-13-product-preview-rc-gates`

## Status

`candidate`

## Plain-English Summary

Adds the Product Preview release-candidate gate packet for ENV-10. This defines the evidence that must exist before a release candidate is considered ready: pinned image digest, migration replay, CI status, health checks, signed-in QA, context health, citation proof, rollback proof, and approvals.

No Azure resources are created by this change. No release candidate is deployed, no migration is run, no traffic is shifted, no data is loaded, and no promotion to Product Prod is performed.

## Layer Impact

- `global-control-lane`: Adds product release governance for Product Preview release candidates.
- `internal-admin`: Gives AbarVa operators a reviewable gate checklist before Product Prod promotion.

## Client Applicability

- All clients: Indirectly, because Product Preview governs product releases before Product Prod.
- Specific clients: None.
- Internal only: Yes, this is an AbarVa product-development release gate.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.md`
- `docs/azure/PRODUCT_PREVIEW_RELEASE_CANDIDATE_GATES_2026-06.json`
- `scripts/azure/verify-product-preview-rc-gates.mjs`
- `npm run azure:product-preview-rc-gates:verify`
- Production-readiness gate wiring for the verifier.

## QA / Validation

- PASS — `npm run azure:product-preview-rc-gates:verify`
- PASS — `npm run azure:product-preview-provisioning:verify`
- PASS — `npm run azure:product-dev-cicd:verify`
- PASS — `npm run azure:product-dev-synthetic-data:verify`
- PASS — `npm run audit:architecture-rules`
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main`. The change is documentation and CI guardrail only. Real Product Preview release-candidate deployment remains approval-gated.

## Rollback Plan

Revert the PR. Since this is non-mutating, rollback only removes the packet and CI verifier.

## Audit Evidence

- PR URL.
- CI run showing the release-candidate verifier and production-readiness gate passing.
- Release record.

## Known Gaps

The release-candidate gates are scaffolded but not yet proven by a real Product Preview deployment because the Product Preview subscription is not created by this PR.
