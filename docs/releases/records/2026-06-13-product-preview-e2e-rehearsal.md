# 2026-06-13-product-preview-e2e-rehearsal — Product Preview End-To-End Rehearsal

## Release ID

`2026-06-13-product-preview-e2e-rehearsal`

## Status

`candidate`

## Plain-English Summary

Adds the Product Preview end-to-end rehearsal packet for ENV-11. The packet defines what must be tested before a Product Preview release can be considered pilot-ready: signed-in browser flows, APIs, context health, tenant-scoped retrieval, citations, artifacts, audit traces, and module readiness across Intelligence, Moves, Source, and Tower.

No Azure resources are created by this change. No release candidate is deployed, no migration is run, no traffic is shifted, no data is loaded, and no go/no-go decision is made.

## Layer Impact

- `global-control-lane`: Adds product release rehearsal governance for Product Preview.
- `internal-admin`: Gives AbarVa operators a repeatable rehearsal checklist before Product Prod promotion.

## Client Applicability

- All clients: Indirectly, because Product Preview proves product releases before Product Prod.
- Specific clients: None.
- Internal only: Yes, this is an AbarVa product-development rehearsal packet.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.md`
- `docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.json`
- `scripts/azure/verify-product-preview-e2e-rehearsal.mjs`
- `npm run azure:product-preview-e2e-rehearsal:verify`
- Production-readiness gate wiring for the verifier.

## QA / Validation

- PASS — `npm run azure:product-preview-e2e-rehearsal:verify`
- PASS — `npm run azure:product-preview-rc-gates:verify`
- PASS — `npm run azure:product-preview-provisioning:verify`
- PASS — `npm run audit:architecture-rules`
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main`. The change is documentation and CI guardrail only. Real Product Preview rehearsal remains approval-gated and depends on Product Preview infrastructure plus a deployed release candidate.

## Rollback Plan

Revert the PR. Since this is non-mutating, rollback only removes the packet and CI verifier.

## Audit Evidence

- PR URL.
- CI run showing the end-to-end rehearsal verifier and production-readiness gate passing.
- Release record.

## Known Gaps

The rehearsal matrix is scaffolded but not yet executed because Product Preview infrastructure and a real release candidate are not created by this PR.
