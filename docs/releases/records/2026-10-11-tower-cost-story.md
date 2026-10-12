# 2026-10-11-tower-cost-story — Tower cost tab source amounts

## Release ID

`2026-10-11-tower-cost-story`

## Status

`candidate`

## Plain-English Summary

The Tower Funding and cost tab now shows the annual IT spend planning estimate and every source category amount when the active governed projection passes reconciliation. Vendor contract amounts appear in a separate list because their overlap with the spend categories is unknown. The tab says when the approved fiscal-year budget is unknown and keeps its existing funding and evidence findings.

## Layer Impact

- Release lane: `global-control-lane` for a shared Tower read and presentation path.
- Layer 3 canonical model: read-only. The page uses cost measures and source references already linked by the governed projection; it creates no new financial facts.
- Layer 4 Tower: the active serving read model checks the category sum and lineage before exposing a cost breakdown. The Cost tab presents that breakdown in plain English.

## Client Applicability

- All clients: the display path is available only when that client's active governed Tower serving rows contain a complete, reconciled cost breakdown.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add a typed Cost lens to the Tower command-center view.
- Read the active aggregate, category, and contract rows with source-row references and required non-additive labels.
- Show the annual planning total, expandable category and contract lists, source locations, and the approved-budget gap in the Funding and cost tab.
- Add reader and rendered-panel tests for reconciliation, active-assessment filtering, separate contract exposure, and plain-English labels.

## QA / Validation

- Focused Tower reader and rendered-panel tests: 40 passed.
- ESLint for changed TypeScript and TSX files: passed.
- Full TypeScript check under Node 24: passed.
- `git diff --check`: passed.
- Browser proof awaits an active serving load and signed-in runtime after deployment.

## Rollout Plan

Merge the stacked source-model release and this presentation change through protected PRs. The repo-owned ACA main deployment workflow builds and promotes the approved main image. The Cost section appears only after the active governed serving rows include the reconciled aggregate, category, and contract rows; it does not expose an inactive candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow after merge.
- ACA runtime invariant: verify web template and 100% traffic revision use the approved digest.
- Worker image invariant: verify required worker job images remain on the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: inspect the Funding and cost tab after active serving promotion.

## Rollback Plan

Revert this UI/read-model commit through a PR and redeploy the resulting main image. The canonical measures and source data remain unchanged.

## Audit Evidence

- This PR and its focused tests.
- The source-model stage receipt and active serving readback are separate evidence for loaded numbers.
- Post-deploy ACA digest and signed-in Cost tab proof must be captured before calling this live-proven.

## Known Gaps

- The approved fiscal-year budget remains unknown until a governed source supplies it.
- Contract overlap with IT spend categories is unknown, so there is no combined total.
- The source summary and category-row sum differ; the tab uses the reconciled row sum and shows the difference.
