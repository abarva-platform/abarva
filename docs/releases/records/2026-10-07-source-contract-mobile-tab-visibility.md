# 2026-10-07 Source contract mobile tab visibility

## Release ID

`2026-10-07-source-contract-mobile-tab-visibility`

## Status

`candidate`

## Plain-English Summary

At narrow widths, a direct link to a contract tab could select the tab while leaving its label outside the horizontally scrollable toolbar. The selected tab now scrolls into view. The compact toolbar also stops covering contract content during vertical scrolling, and its evidence-map command fills the mobile row.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation only. Canonical records, projections, calculations, and approval state are unchanged.

## Client Applicability

- All clients: Yes, wherever Source Contract 360 is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source availability only; no new flag.

## Changes Included

- Keep the selected contract tab visible in the horizontal toolbar after direct navigation or tab changes.
- Use a non-sticky contract toolbar at mobile widths so the tab row does not cover the selected content.
- Make the mobile evidence-map command use the full toolbar width.
- Add focused left, right, and no-overflow tab-position tests.

## QA / Validation

- Red-first test failed on the missing selected-tab scroll behavior before implementation and passed after it.
- All 37 Source workspace suites passed: 354 tests. Typecheck passed with an increased Node heap. Edited TypeScript files lint without errors; one pre-existing unused-variable warning remains in the workspace component. All 11 release gates passed.
- Post-deploy signed-in mobile and desktop visual readback: pending.

## Rollout Plan

Squash-merge the reviewed PR, then deploy only through the repository-owned ACA main workflow. No migration, data build, or configuration change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Established by the main deploy workflow after merge.
- ACA runtime invariant: Verify template image, healthy 100%-traffic revision, and its image match by digest.
- Worker image invariant: Verify required workers remain on the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Open a contract directly on a late tab at mobile width and verify the selected tab and content are visible.

## Rollback Plan

Revert this presentation commit through a PR and let the repo-owned main deploy workflow publish the revert. No data rollback is involved.

## Audit Evidence

PR and CI links will be attached after publication. Local test output and signed-in review findings remain separate from deployment proof.

## Known Gaps

This does not add evidence, author negotiation asks, or size opportunities.
