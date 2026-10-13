# 2026-10-12 — Tower evidence label clarity

## Release ID

`2026-10-12-tower-evidence-label-clarity`

## Status

`candidate`

## Plain-English Summary

Four Tower labels now describe the records actually shown. A case count has a readable space, the funding panel identifies proof items when spend categories are unavailable, evidence gaps use everyday words, and the adoption panel says when it has usage observations but no tool rollout rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Tower display text and one derived evidence-gap description change. The canonical records, source assertions, financial amounts, gates, and counting bases do not change.

## Client Applicability

- All clients: The wording follows each tenant's active Tower projection.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower AI case footer, portfolio funding/proof and adoption labels, and evidence-gap description.
- Focused view-model and rendered-panel regressions for absent spend categories, zero rollouts with separate usage rows, and case-count spacing.
- Release lane: `global-control-lane`.

## QA / Validation

- Node 24 focused Tower suites: 3 passed, 96 tests passed.
- Node 24 TypeScript check passed with an 8 GB heap; changed-file ESLint passed.
- `npm run release:check` passed all 11 gates; `git diff --check` passed.
- Signed-in baseline review identified the four labels against the active serving projection. This candidate is not yet live.

## Rollout Plan

Open a protected PR and hold merge until the coordinated data release is stable. After approval to merge, the repository-owned ACA main workflow builds and deploys the exact main commit. Recheck the six Tower tabs against the active selector before calling the copy live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repository workflow only; no branch or local traffic changes.
- Approved image digest: Set by the repository workflow after merge.
- ACA runtime invariant: Verify web template and 100%-traffic revision use the workflow's digest.
- Worker image invariant: Verify required worker jobs use the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the four changed Tower labels.

## Rollback Plan

Revert the PR through protected main and use the repository-owned ACA workflow to redeploy. The change has no data migration or selector mutation.

## Audit Evidence

- This PR's diff and CI checks; the release record documents the display-only scope.
- Post-merge ACA run, digest parity, health readback, and signed-in Tower inspection when rollout is authorized.

## Known Gaps

Source-reported plans and usage counts still need their separate reviews before they can become approved financial results or adoption rates. This change does not fill missing source data.
