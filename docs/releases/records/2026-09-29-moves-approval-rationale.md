# 2026-09-29 — Moves Approval Rationale

## Release ID

`2026-09-29-moves-approval-rationale`

## Status

`candidate`

## Plain-English Summary

Moves reviewers can include a short approval note when they sign off a generated deliverable or upload an approved replacement. The note is stored on the approval-granted lifecycle event alongside the reviewer and decision timestamp.

## Layer Impact

- Release lane: `global-control-lane`.
- Product workflow: adds an optional reviewer note to the existing deliverable sign-off action.
- Canonical governance record: stores the note in the existing lifecycle-event comments field; no schema change.

## Client Applicability

- All clients: available wherever the existing Moves deliverable sign-off action is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds approval-note transport to the sign-off UI and API.
- Persists the note on the `approval_granted` lifecycle event.
- Rejects non-text or overlong approval notes.

## QA / Validation

- Targeted component, route, and lifecycle tests: `Pass` (3 suites, 26 tests).
- Typecheck: `Pass`.
- Changed-file lint: `Pass`.
- Release check: `Pass` after adding the required lane declaration.
- Live signed-in approval proof: `Not run`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the change. No migration or flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the official workflow.
- Approved image digest: pending.
- ACA runtime invariant: pending workflow verification.
- Worker image invariant: pending workflow verification.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, verify the note on a synthetic approval event.

## Rollback Plan

Revert the code commit through a follow-up pull request and deploy the revert through the same repo-owned workflow. Existing lifecycle events remain readable; no data migration is involved.

## Audit Evidence

Pull request, passing CI checks, exact ACA deploy run, runtime image invariant, and signed-in synthetic approval readback.

## Known Gaps

The approval note is optional for compatibility with existing API callers. This change does not alter approver authority or readiness-blocker acknowledgement requirements.
