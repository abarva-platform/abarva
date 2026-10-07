# 2026-10-07 Source contract toolbar compactness

## Release ID

`2026-10-07-source-contract-toolbar-compact`

## Status

`candidate`

## Plain-English Summary

Contract detail had two controls for the same return action. At narrower desktop widths, the duplicate forced the sticky tab toolbar onto two rows and could cover the first line of contract content while scrolling. The toolbar now retains navigation tabs and the evidence-map action on one row where space allows; the existing return control remains in the contract briefing header.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation only. Canonical records, Source projections, calculations, and approval state are unchanged.

## Client Applicability

- All clients: Yes, wherever Source Contract 360 is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source availability only; no new flag.

## Changes Included

- Remove the duplicate return button from the contract tab toolbar.
- Keep the existing return control and its navigation behavior in the contract briefing header.
- Keep tabs and the evidence-map command on one row at desktop widths; preserve the mobile layout.
- Update the browser-surface test to exercise the remaining return path and reject the duplicate.

## QA / Validation

- Red-first test failed on the duplicate control before the change and passed after it.
- All 37 Source workspace suites passed: 352 tests. Typecheck passed with an increased Node heap. Edited TypeScript files lint without errors; one pre-existing unused-variable warning remains in the workspace component. All 11 release gates passed.
- Post-deploy responsive and signed-in visual review: pending.

## Rollout Plan

Squash-merge the reviewed PR, then deploy only through the repository-owned ACA main workflow. No migration, data build, or configuration change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Established by the main deploy workflow after merge.
- ACA runtime invariant: Verify template image, healthy 100%-traffic revision, and its image match by digest.
- Worker image invariant: Verify required workers remain on the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Reopen the affected contract at compact and wide desktop widths.

## Rollback Plan

Revert this presentation commit through a PR and let the repo-owned main deploy workflow publish the revert. No data rollback is involved.

## Audit Evidence

PR and CI links will be attached after publication. Local test output and signed-in review findings remain separate from deployment proof.

## Known Gaps

This does not add evidence, author negotiation asks, or size opportunities.
