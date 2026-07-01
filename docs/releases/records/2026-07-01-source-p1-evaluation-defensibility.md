# 2026-07-01-source-p1-evaluation-defensibility — Source P1 Evaluation Defensibility

## Release ID

`2026-07-01-source-p1-evaluation-defensibility`

## Status

`candidate`

## Plain-English Summary

This release hardens the Source vendor evaluation output so a sourcing executive can see why vendors rank the way they do, what BAFO evidence could move the scores, and which vendors should be treated as finalists versus price benchmarks.

## Layer Impact

- `global-control-lane`: Updates shared Source proposal-intelligence scoring logic, the Source evaluation renderer, and the Source aVa answer engine.
- `public-demo`: Improves the SkyHarbor Source demo path without introducing real vendor names or customer data.

## Client Applicability

- All clients: Shared Source runtime code receives the safer scoring and answer-format behavior.
- Specific clients: SkyHarbor Source P1 demo path uses the synthetic Vendor A/B/C evidence.
- Internal only: None.
- Public/demo only: Synthetic vendor evaluation evidence remains demo-labelled and generic.
- Feature flag: Existing Source demo/simple-front tenant flags control runtime exposure.

## Changes Included

- Adds score transparency, finalist posture, weighted score contribution, and BAFO score-improvement scenarios to the Source evaluation decision view.
- Updates the evaluation scorecard panel to show how the score is defended and how BAFO cures can move vendor scores.
- Updates Source aVa evaluation answers so Vendor B is a price benchmark unless specified staffing, retained-effort, pass-through, and productivity-credit gaps are cured.
- Adds route evidence for finalist recommendation and score-impact scenarios.
- Polishes score-impact answer copy so aVa says what BAFO must provide, rather than producing mechanical “cures price...” phrasing.

## QA / Validation

- `npx jest src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — passed, 68 tests.
- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — passed, 44 tests for the score-impact answer copy follow-up.
- `npx eslint src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts` — passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps `aca-main-deploy` workflow, then run signed-in Source browser proof on the SkyHarbor evaluation event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Source runtime, renderer, and answer engine only.
- Approved image digest: To be recorded after ACA deployment.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Covered by ACA main deploy workflow.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image through the approved main deploy lane. No migration rollback is required.

## Audit Evidence

- PR URL, CI results, ACA deployment evidence, and signed-in Source proof ZIP will be attached once merged and deployed.

## Known Gaps

This does not implement uploaded long-proposal extraction. It hardens the evaluation recommendation and score-defensibility layer built from the existing P1 MVE profiles, challenge log, leverage seeds, and BAFO pack.
