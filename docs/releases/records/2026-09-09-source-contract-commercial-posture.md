# 2026-09-09-source-contract-commercial-posture — Source Contract Commercial Posture

## Release ID

`2026-09-09-source-contract-commercial-posture`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now surfaces a compact commercial posture strip for the selected contract. The strip projects existing governed contract and optimization rows into decision-ready labels for commitment posture, value type, top lever, evidence depth, decision owner, and next action. Source aVa also receives the same posture context and a fixed contract-optimization response shape so lever questions use a consistent executive format.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source presentation and Source aVa surface context changed. The release does not add tenant data, change loaders, or alter Layer 3 canonical facts.

## Client Applicability

- All clients: Source users with Contract 360 access receive the UI and aVa framing when governed contract and opportunity rows are available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Contract 360 view model derives a commercial posture object from existing contract economics, opportunity value types, evidence grades, owner fields, and next actions.
- Contract 360 renders the posture strip in both the product shell and the legacy canvas path ahead of the executive story panel.
- Source aVa surface context includes posture facts, a contract-optimization answer frame, and demo-safe suggested prompts for commercial posture, value types, CFO wording, and vendor asks.
- Deterministic Source aVa contract answers use Verdict, Rationale, Lever table, and Caveat sections for contract optimization questions.
- Source opportunity readers treat loaded opportunity titles as display labels when the payload has no explicit label, preventing ID-like opportunity keys from appearing as the top-lever card headline.
- The cloud-consumption loader now persists explicit display labels in opportunity payloads for future governed loads.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' --runInBand` — pass, 3 suites / 39 tests.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' src/lib/source/ava/source-workspace-visual-answer.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts` — pass.
- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' --runInBand` — required for the product-shell mount regression.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/lib/source/ava/source-workspace-visual-answer.ts'` — required for the product-shell follow-up.
- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts' --runInBand` — required for contract posture lever-label formatting.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand` — required for loaded opportunity title normalization.

## Rollout Plan

Merge through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. No data-build job, migration, or manual data-plane write is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime rollout.
- Shared runtime mutators: None in this release.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360 Story tab plus Source aVa contract-optimization prompt.

## Rollback Plan

Revert the release PR and allow the repo-owned ACA main deploy workflow to publish the prior Source Contract 360 and aVa behavior. No data rollback is required.

## Audit Evidence

Review the pull request, targeted Jest output, ESLint output, ACA deployment run, runtime invariant check, and live signed-in Source proof after deployment.

## Known Gaps

The strip is a product projection over existing rows. It does not add new evidence families or convert candidate opportunity values into finance-confirmed outcomes.
