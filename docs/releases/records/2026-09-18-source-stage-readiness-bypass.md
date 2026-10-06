# 2026-09-18-source-stage-readiness-bypass — Enforce stage readiness on all advance paths

## Release ID

`2026-09-18-source-stage-readiness-bypass`

## Status

`candidate`

## Plain-English Summary

An authorized self-approval no longer moves a sourcing event past an unresolved stage criterion. The reviewer must resolve the criterion through the existing governed process before advancing.

## Layer Impact

Layer 4 Source control-plane routes only. Canonical data and read models are unchanged.

## Client Applicability

- All clients: Source event approvals and direct stage advancement.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

The event approval and direct stage PATCH handlers stop opting into the computed-readiness bypass. Handler tests exercise the real gate evaluator with a pending hard criterion.

## QA / Validation

Both handler regressions failed on the old behavior and passed after the change. Reintroducing the bypass in both handlers made the tests fail again. The two focused suites pass (25 tests). Lint, typecheck, and release validation results are recorded in the PR.

## Rollout Plan

Squash-merge through a PR, then the repo-owned ACA main deployment workflow. No migration, tenant-data build, or flag update.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Assigned by the workflow after merge.
- ACA runtime invariant: Verify after deployment; not yet proven.
- Worker image invariant: Verify required workers at deployment; not yet proven.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for an affected Source event in a controlled acceptance session.

## Rollback Plan

Revert the PR and redeploy through the same workflow if a regression is confirmed. No data migration to reverse. Re-enabling the bypass would reopen the original governance gap, so investigate any blocked event before rollback.

## Audit Evidence

Focused Jest handler tests, explicit bypass mutation result, PR checks, and eventual deployment digest/readback. Signed-in acceptance is not claimed.

## Known Gaps

This change prevents premature advancement; it does not author a new waiver workflow or reconcile any already-advanced events. The shared gate helper still exposes a bypass option for non-route callers; these two live handlers no longer use it.
