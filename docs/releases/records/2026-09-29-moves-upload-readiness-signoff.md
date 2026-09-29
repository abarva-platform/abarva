# 2026-09-29 — Moves Uploaded Replacement Readiness Gate

## Release ID

`2026-09-29-moves-upload-readiness-signoff`

## Status

`candidate`

## Plain-English Summary

Moves now applies the client-readiness scan to the exact text extracted from an uploaded replacement document before saving or signing it off. A blocked upload is not stored; a reviewer can deliberately acknowledge the listed findings, and that override is recorded in the audit log. The acknowledgement retry retains the same uploaded file.

## Layer Impact

- **Release lane: `global-control-lane`.** This shared Moves approval control applies to client-reviewed deliverable uploads.
- **Layer 3 — Canonical Enterprise Model:** No canonical data model or evidence contract changes. The signed-off deliverable remains the governed record.
- **Layer 4 — Products:** The sign-off route and reviewer control now enforce the same readiness policy for uploaded replacements and AI drafts.

## Client Applicability

- All clients: Yes, for Moves deliverables approved through the uploaded-replacement path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Scan extracted replacement text before creating an approved artifact or deliverable version.
- Return the existing structured readiness-blocker response when acknowledgement is absent.
- Allow only an explicit multipart acknowledgement to retry the same uploaded file; record acknowledged findings through the existing audit event.
- Reject missing or empty multipart files before they can fall through to the legacy approve-as-drafted path.
- Add route and component tests for the fail-closed path and the deliberate retry.

## QA / Validation

- Planted regression before the fix: Fail, with a blocked DOCX upload incorrectly returning HTTP 200.
- Planted empty-multipart regression before the fix: Fail, with an empty upload incorrectly returning HTTP 200.
- Targeted sign-off route and reviewer component suites after the fix: Pass (2 suites, 22 tests).
- Typecheck: Pass (`npm run typecheck`).
- ESLint and `git diff --check`: Pass on changed files.
- Release check, CI, deployment, and signed-in proof: Pending.

## Rollout Plan

Merge through the protected `main` PR path, then deploy the exact merge SHA using `.github/workflows/aca-main-deploy.yml`. No migration, feature flag, or data backfill is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the approved main deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification; the change does not modify worker code.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify a blocked upload is not stored, an explicit acknowledgement applies to that same upload and is audited, and the gate advances only after successful canonical sign-off.

## Rollback Plan

Revert the code change through a follow-up PR and deploy that merge SHA through the same ACA workflow. No data rollback is needed; the new path prevents rejected uploads from being written before the readiness check.

## Audit Evidence

- Sign-off route regression tests and reviewer-component acknowledgement test.
- PR, CI, exact-SHA ACA deployment, runtime invariant, and signed-in smoke evidence: Pending.

## Known Gaps

The readiness scan evaluates extractable text. It does not independently verify whether client-provided factual or monetary claims are supported by uploaded evidence; that distinction remains to be tested in the synthetic review cycle.
