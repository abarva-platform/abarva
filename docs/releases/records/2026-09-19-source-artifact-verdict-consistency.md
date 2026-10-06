# 2026-09-19-source-artifact-verdict-consistency — Source CXO report follows the verdict kernel

## Release ID

`2026-09-19-source-artifact-verdict-consistency`

## Status

`candidate`

## Plain-English Summary

Source export artifacts already use a deterministic expert-judgment kernel to decide whether an
event is award-ready, should proceed to BAFO, should pause for evidence, or should not award yet.
This release keeps the CXO narrative report pinned to that same kernel for the award-ready path
instead of letting a later lifecycle-stage label downgrade the report to a pending state after the
kernel has already found no critical blockers, pricing gaps, or evidence gaps.

The claim is intentionally narrow: this changes the report label and its automated guard. It does
not make any live-client award, value, deployment, evidence-readiness, or signed-in acceptance
claim.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 (Source product projection): updates the Source CXO report synthesis so its displayed
  verdict follows the existing Source expert-judgment kernel.
- Layers 1, 2, and 3: no change. No intake, adapter, canonical model, schema, migration, or data
  mutation is included.
- Control plane / CI: adds a behavior test under the CI-covered behavior suite so this exact
  adapter contract does not drift silently.

## Client Applicability

- All clients: applies to shared Source CXO report generation code.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts`
- `src/__tests__/behaviors/source-artifact-verdict-consistency.test.ts`
- `src/lib/source/exports/__tests__/artifact-verdict-consistency.test.ts`
- `src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts`

## QA / Validation

- Pre-fix reproduction on clean `origin/main` with a temporary local `node_modules` symlink:
  `npx jest src/lib/source/exports/__tests__/artifact-verdict-consistency.test.ts --runInBand`
  failed 1/10, expected `Award / proceed` and received `Pending — Evaluation / BAFO /
  Decision`.
- Pre-fix CI-visible behavior guard:
  `npx jest src/__tests__/behaviors/source-artifact-verdict-consistency.test.ts --runInBand`
  failed with the same verdict mismatch.
- Focused post-fix behavior guard:
  `npx jest src/__tests__/behaviors/source-artifact-verdict-consistency.test.ts --runInBand`
  passed, 1/1.
- Original Source export regression:
  `npx jest src/lib/source/exports/__tests__/artifact-verdict-consistency.test.ts --runInBand`
  passed, 10/10.
- CXO report and kernel suites:
  `npx jest src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts src/lib/source/expert-judgment/__tests__/source-judgment-kernel.test.ts --runInBand`
  passed, 14/14.
- Relevant broader Source export suite: `npx jest src/lib/source/exports --runInBand` passed,
  26 suites / 288 tests.
- CI-covered behavior gate: `npm run coverage:behavior-gate` passed, 25 suites / 265 tests,
  observed lines/statements 93.44, functions 68.12, branches 60.27.
- Focused ESLint passed:
  `npx eslint src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts src/lib/source/exports/__tests__/artifact-verdict-consistency.test.ts src/__tests__/behaviors/source-artifact-verdict-consistency.test.ts`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` passed with no
  diagnostics after clearing `tsconfig.tsbuildinfo`.
- `npm run release:check -- --base origin/main --head HEAD` passed.
- `git diff --check` passed.
- PR checks, merge, deploy, and runtime invariant: pending.

## Rollout Plan

Merge to main through a protected pull request. The repo-owned Azure Container Apps main deploy
workflow builds and deploys the merge SHA as usual. No migration, data-build job, seed load, or
manual Azure runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No hand-run Azure command is part of this release.
- Approved image digest: produced by the post-merge deploy workflow.
- ACA runtime invariant: prove after merge as standard practice before calling the merge deployed.
- Worker image invariant: unchanged; prove alongside the runtime invariant if deploy evidence is
  recorded.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no for this local release claim. The changed behavior is an export
  synthesis contract covered by unit and CI-visible behavior tests; signed-in acceptance remains a
  separate proof layer.

## Rollback Plan

Revert the PR. The CXO report returns to the prior stage-gated verdict label behavior and the
behavior guard is removed. No data or schema rollback is required.

## Audit Evidence

- The pre-fix focused and CI-visible failing tests above.
- The post-fix focused, broader Source export, and behavior-gate passing tests above.
- The `Behavior coverage floor` workflow, which runs `npm run coverage:behavior-gate` and
  therefore executes `src/__tests__/behaviors/source-artifact-verdict-consistency.test.ts`.
- Pull request, CI, merge, and deploy evidence: pending.

## Known Gaps

- Signed-in acceptance is not claimed by this release record.
