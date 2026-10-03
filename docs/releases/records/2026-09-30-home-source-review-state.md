# 2026-09-30-home-source-review-state - Home Source Review State

## Release ID

`2026-09-30-home-source-review-state`

## Status

`candidate`

## Plain-English Summary

Home now reports whether the source files behind its served record have been accepted for review. The page, advisor guard, and walkthrough exports use the same read-only review state. A source-catalog change invalidates the rendered-record marker, so a later answer or export cannot silently use a different review state.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: read-only, tenant- and assessment-scoped source-file catalog lookup. No canonical or source record is changed.
- Layer 4: a status label and shared record-version check across Home, advisor, and export.

## Client Applicability

- All clients: Home records served from ECL show the source-file review status where a catalog is available.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Summarize accepted, partial, blocked, and superseded source files for the served assessment.
- Include the catalog state in the Home record marker used by advisor and full export.
- Keep served rows visible but label review state unavailable if the catalog read fails.
- Require accepted source files before labelling a published narrative coherent with its served record.

## QA / Validation

- PASS: focused tests (60/60) cover accepted, partial, and unavailable catalog states; a changed catalog marker; and advisor/export record-change refusal.
- PASS: TypeScript, touched-file lint, and formatting.
- PASS: Home test ratchet at 769/797 with 12 baselined failing suites and no movement away from the baseline.
- PASS: release check after the required QA status was recorded.
- NOT RUN until deployment: signed-in proof of the rail, advisor, and export labels against the same record source.

## Rollout Plan

Merge by PR and deploy through the repo-owned ACA main workflow. This release performs no data-build job or tenant write. Check the runtime image invariant before signed-in Home proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web template and 100%-traffic revision image equality.
- Worker image invariant: verify both required workers use the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: source review label, record marker parity, and export visibility.

## Rollback Plan

Revert by a new controlled PR and deploy through the same workflow if the catalog lookup affects Home availability. No data rollback is needed.

## Audit Evidence

- Focused and ratchet test output, PR checks, main deploy run, runtime digest readback, and signed-in browser proof.

## Known Gaps

This reports review status; it does not approve source files, resolve incomplete source links, generate a current narrative, or promote a projection. A catalog lookup failure is visible as unavailable rather than treated as accepted.
