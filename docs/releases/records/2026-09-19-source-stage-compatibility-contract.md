# 2026-09-19-source-stage-compatibility-contract — Source Stage Compatibility Contract

## Release ID

`2026-09-19-source-stage-compatibility-contract`

## Status

`candidate`

## Plain-English Summary

This release records the Source stage contract that the product already follows:
the external Source New flow has five visible checkpoints, while accepted Source
events still use the internal canonical stage spine for event state, evidence,
and routing.

The prior guard checked source text for an old eleven-stage string list. That
made the suite red for formatting reasons and did not prove the runtime
contract. The guard now executes the exported contracts instead: external
checkpoints, internal stage order, legacy stage-key normalization, and journey
routing for stages that are hidden by a shorter product journey.

## Layer Impact

`global-control-lane`, Layer 4 product contract and test coverage only.

No Layer 1 client intake, Layer 2 adapter, Layer 3 canonical model, schema,
migration, row mutation, tenant-data load, approval action, prompt path, or
model behavior changes are included.

## Client Applicability

- All clients: Source product users inherit the clarified contract after merge.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts` now exports the public Source
  New checkpoint order: request intake plus the four accepted-event phases.
- `src/lib/source/new-workspace/phase-state.test.ts` asserts that the external
  flow remains five checkpoints and does not absorb internal lifecycle stages.
- `src/__tests__/integration/source/source-old-surface-archive.test.ts` replaces
  the source-text eleven-stage guard with executable assertions over the public
  checkpoint order, the internal canonical stage order, legacy key
  normalization, and journey-aware route links.
- `src/lib/source/__tests__/sourcing-motion-journeys.test.ts` adds alias cases
  for skipped-stage routing.

## QA / Validation

Baseline before the fix:

- `npx jest src/__tests__/integration/source/source-old-surface-archive.test.ts --runInBand`
  failed 1 of 3 tests. The failing case expected single-quoted stage literals in
  source text, while the actual contract was exported with double-quoted
  literals.
- `npx jest src/lib/source/__tests__/sourcing-motion-journeys.test.ts --runInBand`
  passed 10 of 10 tests.

After:

- `npx jest src/__tests__/integration/source/source-old-surface-archive.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts src/lib/source/new-workspace/phase-state.test.ts --runInBand`
  passed 42 of 42 tests.

Mutation checks:

- Removing the request-intake checkpoint from
  `SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER` failed both the phase-state contract and
  the old-surface integration guard.
- Bypassing `normalizeSourceStageKey` in `coerceStageToSourceJourney` caused
  legacy route keys such as `rfp_rfi_package` to route to Strategy instead of
  the next visible checkpoint, failing both the journey suite and integration
  guard.

Broader local validation:

- `npm run check:source-integration-quarantine` passed: 12 excluded of 93 Source
  integration suites; 81 run on every PR.
- `npx jest src/__tests__/integration/source --no-coverage --ci $(node scripts/quality/source-integration-ignore-args.mjs)`
  passed 81 suites / 679 tests.
- `npm run test:behaviors` passed 37 suites / 371 tests.
- `npm run test:integration:ci-visibility` passed.
- Focused ESLint on changed source/test files passed with no output.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  passed.
- `npx eslint src/` exited 0 with existing warnings only: 249 warnings, 0
  errors.
- `npm run release:check` passed.
- `git diff --check` passed.
- Public-content scan over changed tracked files and this release record found
  no real-client narrative, confidential incident detail, or signed-in/live
  acceptance claim. Matches were generic code vocabulary such as
  `waiting_on_client`, `vendor_responses`, and `suppliers`.

PR CI and merge/deploy evidence are pending.

## Rollout Plan

Open a PR and merge through the protected GitHub path after local validation and
CI. The repo-owned ACA main deploy workflow will build and deploy the merge SHA
as usual. No manual runtime command, migration apply, feature flag, tenant-data
mutation, or data-build job is part of this rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before any deployed claim.
- Worker image invariant: Required after deploy before any deployed claim.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not required for the test-only behavior claim;
  no signed-in product acceptance is claimed here.

## Rollback Plan

Revert the PR. The stale source-text guard would return and the explicit
external checkpoint export would disappear. No data rollback is required.

## Audit Evidence

- Local failing-before and passing-after Jest output listed above.
- Mutation results listed above.
- PR URL, CI checks, merge SHA, and deploy/runtime evidence to be added after
  those stages happen.

## Known Gaps

- This does not create a persisted event-owned stage-plan snapshot.
- This does not change Source New activation, request acceptance, approval
  routing, or signed-in UX behavior.
