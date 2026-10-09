# 2026-10-07 Source contract Optimize clarity

## Release ID

`2026-10-07-source-contract-optimize-clarity`

## Status

`candidate`

## Plain-English Summary

Contract 360 no longer presents empty negotiation tabs and repeated unsized value cards when the contract has only an evidence-stage opportunity. It shows the governed next action instead, while preserving any recorded potential or Finance-confirmed amounts. Tabs with authored content remain available, and the contract list no longer promises to open a different page than its click target.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation only. Layer 3 facts, projections, opportunity calculations, and approval state are unchanged.

## Client Applicability

- All clients: Yes, wherever Source Contract 360 is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source availability only; no new flag.

## Changes Included

- Contract 360 Optimize chooses only tabs with usable content and shows the existing governed action when none qualify.
- Unsized placeholders are not rendered as established value types.
- Evidence-stage contracts with recorded value retain those amounts without implying Finance confirmation.
- Contract list action wording matches the Story landing view.
- The repeated contract ID is removed from the toolbar.
- Focused UI regression tests.

## QA / Validation

- Red-first UI tests reproduced the empty-tab presentation and unsized placeholders before implementation.
- All 37 Source preview workspace suites: 352 tests passed, including the existing contract-surface proof updated to reject an unsupported Comparator tab.
- TypeScript typecheck passed with an increased Node heap; default heap exhausted before reporting diagnostics.
- Edited TypeScript files lint without errors; one pre-existing unused-variable warning remains in the workspace component.
- Signed-in post-deploy review is pending.

## Rollout Plan

Squash-merge the reviewed PR, then use only the repository-owned ACA main deploy workflow. No migration, data build, or configuration change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Established by the main deploy workflow after merge.
- ACA runtime invariant: Verify template image, healthy 100%-traffic revision, and its image match by digest.
- Worker image invariant: Verify required workers remain on the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Review an evidence-stage contract and one contract with authored asks after deployment.

## Rollback Plan

Revert the presentation commit through a PR and let the repo-owned main deploy workflow publish the revert. No data rollback is involved.

## Audit Evidence

PR and CI links will be attached after publication. Focused test output and signed-in review findings remain separate from deployment proof.

## Known Gaps

This does not author missing buyer asks, establish comparator data, validate the commercial correctness of existing asks, or size an opportunity.
