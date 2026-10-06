# 2026-10-02 — Declare the Evidence Family on a General Upload

## Release ID

`2026-10-02-declare-evidence-family-on-upload`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-10-02-discovery-readiness-declared-family`.

A Move's file cabinet lets anyone upload evidence, but gave no way to say which required evidence the file covers. The product decided that from keywords in the file's name and opening lines. On a deployed synthetic workflow, a controls file whose second row mentioned knowledge freshness was credited to the knowledge family, and the controls requirement stayed open until the file was reworded.

The uploader can now choose which required evidence a file covers. The choice is optional. When made, it is recorded with the evidence and the readiness check credits the file to that family. When not made, behavior is as before.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves upload behavior for every client; not behind a feature flag.

- **Product layer — Moves file cabinet:** A "Covers required evidence" choice on evidence uploads, listing the families the phase requires.
- **Product layer — upload API:** An optional field naming the declared family. A family the Move does not require is refused with an error rather than ignored.
- **Evidence handling:** The declared family is stored where the inferred one was. Review and approval are unchanged — a declared file still has to be reviewed and approved before it counts.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- File cabinet panel: optional family selector, shown for evidence uploads when the phase has required families.
- Phase workspace: passes the phase's required families to the panel.
- Upload route: validates and forwards the declared family.
- Evidence ingest: records the declared family in place of the inferred one, and notes in the source reference that it was declared.
- Validation helper and tests.

## QA / Validation

- Targeted Jest: pass — `121 suites, 1143 tests` across Moves library and components and the upload route, 8 new.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Signed-in runtime verification: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, upload a file on a synthetic workflow with a declared family whose keywords point elsewhere, approve it, and confirm the declared family reads as covered.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included. Evidence already recorded with a declared family keeps that family; the readiness check reads it either way.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The declaration cannot be changed after upload; a reviewer cannot correct the family during review.
- A file can be declared against one family only.
- Uploads made without a declaration still depend on keyword inference.
- The server-side path is covered by a validation-helper test and a component test, not by a full route test.
