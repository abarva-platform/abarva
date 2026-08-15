# 2026-08-15 Source Contract Handoff CTA Deduplication

## Release ID

`2026-08-15-source-contract-handoff-cta-dedup`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now presents a single primary handoff action to open the Optimize Contract plan. The contract story panel still explains the recommended action and why it matters, but it no longer repeats the same button inside the page body.

## Layer Impact

- `global-control-lane`: Updates the shared Source Contract 360 presentation layer only. The underlying contract read model, optimization opportunity rows, evidence rows, and workflow routing stay unchanged.

## Client Applicability

- All clients: Yes, for tenants using the Source Contract 360 workspace surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Removes the duplicate in-panel `Open optimize plan` button from `ContractCanvas`.
- Keeps the existing header action as the single canonical Contract 360 to Optimize Contract handoff.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx --runInBand`
- PASS: `npx eslint src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared Product/Lab runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Contract 360 shows one Optimize handoff action and routes to the selected contract's Optimize module.

## Rollback Plan

Revert the PR to restore the duplicate in-panel action. No schema, data, environment, or feature flag rollback is required.

## Audit Evidence

- Focused component test output.
- ESLint output.
- Post-deploy ACA runtime invariant.
- Signed-in browser proof on the Contract 360 to Optimize Contract handoff.

## Known Gaps

This does not change the Optimize Contract workflow state, evidence readiness, calculation traceability, or value proof gates.
