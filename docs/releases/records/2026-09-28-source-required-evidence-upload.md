# 2026-09-28-source-required-evidence-upload — Bind required evidence uploads

## Release ID

`2026-09-28-source-required-evidence-upload`

## Status

`candidate`

## Plain-English Summary

The Upload command beside a Source evidence requirement now opens a file picker for that requirement and shows its upload result in the same row. Previously that command only moved the page to unrelated session-note upload controls. The server validates the selected requirement and file type before storing a file, and keeps uploaded evidence separate from gate-defining deliverables.

## Layer Impact

Release lane: `global-control-lane` with a narrow existing Source evidence-write path.

- Layer 1 client intake: a user-provided source file is received through the existing private upload route; no new intake format is required.
- Layer 3 canonical/evidence authority: the existing event evidence state links to a declared requirement ID. The upload remains a receipt and parsed-evidence step, not a new commercial fact or approval.
- Layer 4 Source projection: the evidence checklist gains a specific, actionable picker and local error/status readback.

## Client Applicability

- All clients: Source New event evidence checklist.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Required-evidence upload control and status in the Source Files checklist.
- Optional `evidenceRequirementId` in the existing artifact upload route, validated against the current stage and accepted format before storage.
- Substrate sync honors the validated ID instead of inferring it from the filename. Explicitly bound evidence is registered as `other`/`uploaded_source_artifact`, so it cannot satisfy a stage-deliverable presence gate.
- Focused route, substrate, and mounted UI regression tests.

## QA / Validation

- **Pass:** red-first route and substrate tests failed for missing binding and invalid selections before implementation.
- **Pass:** mounted UI tests failed when the checklist only scrolled to generic session uploads.
- **Pass:** deleting the route's evidence-family isolation, the substrate's selected-ID binding, or the UI's ID field failed targeted tests; each mutation was restored.
- **Pass:** 29 Source canvas suites / 231 tests and focused route/substrate suites / 32 tests, including the text/plain trigger used for signed-in replay.
- **Pass:** Node 24 TypeScript no-emit check and scoped ESLint (three existing test-file warnings, zero errors).
- **Not run:** PR CI, official ACA deploy, immutable runtime readback, and signed-in upload/readiness replay; these are required before live acceptance.

## Rollout Plan

Squash-merge the reviewed PR after applicable CI, then allow only the repo-owned ACA main deploy workflow to build and promote the exact merge SHA. No schema migration, data build, feature flag, or ad-hoc traffic change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending exact merged-SHA deployment.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; upload a non-sensitive synthetic source file to a selected requirement, verify the persisted evidence state after reload, and confirm the gate still requires human review.

## Rollback Plan

Revert the squash commit through a normal PR. Existing generic uploads and stored evidence remain intact; no data reversal is required.

## Audit Evidence

- PR, checks, exact merge SHA, ACA run and digest proof: pending.
- Local behavior tests and recorded mutation results in the PR.
- Signed-in event-level readback: pending.

## Known Gaps

- A successful file receipt or parse does not itself constitute a human evidence review, client-final artifact acceptance, or stage approval.
- Search indexing and canonical fact promotion remain separate governed steps.
