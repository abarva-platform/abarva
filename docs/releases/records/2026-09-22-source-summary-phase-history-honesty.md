# Source summary phase-history honesty

## Release ID

`2026-09-22-source-summary-phase-history-honesty`

## Status

`candidate`

## Plain-English Summary

The Source event summary now uses recorded phase evidence when it labels the
five-step Source New journey. A terminal event no longer receives a completion
checkmark for a phase that has no governed history; the rail names that state
as a historical gap instead.

## Layer Impact

- `global-control-lane`
- Layer 4 product projection: Source event journey rail only.
- No canonical data, adapter, schema, migration, policy, or writer changes.

## Client Applicability

- All clients: Yes, on governed Source event summary surfaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Carry the event lifecycle into the Source shell read model.
- Reuse Source New phase-state semantics for the summary journey rail.
- Derive recorded phase history from visible event artifacts and approval
  ledger evidence.
- Render historical gaps and missing records without completion checkmarks.
- Preserve the separate contract-optimization journey behavior.

## QA / Validation

- PASS: red-first mounted regression for a completed event with no supplier/NDA
  history.
- PASS: focused Source journey suite, 16 tests.
- PASS: mutation that falsely asserted supplier history failed the intended
  mounted behavior test.
- PASS: TypeScript typecheck with an explicit local heap allowance after the
  default local Node process exhausted its heap.
- PASS: scoped ESLint.
- PENDING: release-control check, hosted CI, ACA runtime proof, and signed-in
  replay.

## Rollout Plan

Land the dependency release first, squash-merge this candidate after all
applicable checks pass, and use the repository-owned ACA main deployment
workflow. Verify the immutable runtime digest before signed-in replay.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repository-owned workflow only.
- Approved image digest: Pending merge and deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned ACA main
workflow. No data or migration rollback is required.

## Audit Evidence

- Focused Jest output and recorded mutation failure.
- Pull request and hosted checks after opening.
- Repo-owned ACA deployment and runtime-invariant artifact after merge.
- Signed-in comparison of the Source New workspace and event summary rail.

## Known Gaps

- Supplier authority that exists only in canonical candidate records and has no
  supplier/NDA artifact is conservatively not shown as recorded on this rail.
  The Source New supplier panel remains the detailed authority surface.
