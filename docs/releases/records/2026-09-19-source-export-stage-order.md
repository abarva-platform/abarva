# 2026-09-19-source-export-stage-order — Source exports use one stage order

## Release ID

`2026-09-19-source-export-stage-order`

## Status

`candidate`

## Plain-English Summary

Source export builders now use one shared lifecycle-stage presentation map when they show stage
numbers and labels. This keeps the CXO narrative report and Deal Pack aligned for shared Source
stage keys, including Transition as Stage 10 and Value as Stage 11.

The claim is narrow: this release standardizes export stage presentation. It does not decide award
language policy, does not add a renderer-only award gate, and does not mutate tenant data.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 (Source product projection): updates Source export presentation logic for CXO report and
  Deal Pack generation so stage labels come from one canonical order.
- Layers 1, 2, and 3: no change. No intake, adapter, canonical model, migration, data load, or
  data mutation is included.
- Control plane / CI: adds focused behavior coverage for the shared stage-order contract and for
  both export builders' rendered behavior.

## Client Applicability

- All clients: applies to shared Source export generation code.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/constants.ts`
- `src/lib/source/__tests__/stage-presentation.test.ts`
- `src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts`
- `src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts`
- `src/lib/source/exports/deal-pack/stage-sections.ts`
- `src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts`
- `docs/backlog/tracks/04-source-commercial/BACKLOG.md`

## QA / Validation

- PASS: focused stage-order, Deal Pack, and CXO report suites:
  `npm test -- --runTestsByPath src/lib/source/__tests__/stage-presentation.test.ts src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts --runInBand`,
  3 suites / 44 tests.
- PASS: mutation check. Temporarily changing the shared stage position from one-based to
  zero-based made the shared contract, Deal Pack, and CXO report tests fail; restoring the
  one-based map made the same focused suites pass again.
- PASS: relevant Source export suite: `npm test -- src/lib/source/exports --runInBand`, 26 suites /
  290 tests.
- PASS: focused ESLint:
  `npx eslint src/lib/source/constants.ts src/lib/source/__tests__/stage-presentation.test.ts src/lib/source/exports/deal-pack/stage-sections.ts src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts`.
- PASS: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.
- PASS: `git diff --check`.

## Rollout Plan

Merge through PR into `main`. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the merge SHA as usual. No migration, data-build job, seed load, manual data write, or
manual Azure runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No hand-run Azure command is part of this release.
- Approved image digest: produced by the post-merge repo-owned deploy workflow.
- ACA runtime invariant: required after deploy before claiming the runtime is current.
- Worker image invariant: unchanged; prove alongside the runtime invariant if deploy evidence is
  recorded.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: separate acceptance layer. This release record does not claim
  signed-in acceptance.

## Rollback Plan

Revert the PR. Source exports return to their prior private stage-label behavior. No data or schema
rollback is required.

## Audit Evidence

- Focused stage-order, Deal Pack, and CXO report test output.
- Mutation-failure output for the shared map.
- Relevant Source export suite output.
- Focused ESLint, TypeScript, release check, and diff check output.
- PR, CI, merge, deploy, runtime invariant, and signed-in acceptance evidence: pending.

## Known Gaps

- Item 79 award-language policy remains a separate owner decision and is not changed here.
- Signed-in acceptance is not claimed by this release record.
