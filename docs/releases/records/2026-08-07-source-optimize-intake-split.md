# 2026-08-07-source-optimize-intake-split — Split Optimize Intake From Generic Sourcing Intake

## Release ID

`2026-08-07-source-optimize-intake-split`

## Status

`candidate`

## Plain-English Summary

The Source workspace now sends "Optimize a contract" to the existing contract-optimization intake
instead of the generic new sourcing-event intake. The optimize intake visibly presents the Door 1
contract-optimization motion, shows the four evidence ledgers used for contract value decisions, and
names created Door 1 events as contract optimizations instead of sourcing events.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source workspace navigation and Source intake presentation now distinguish generic
  sourcing from existing-contract optimization.
- Canonical Model: no change.
- Source Adapters: no change.
- Client Intake: no client extract or template change.

## Client Applicability

- All clients: shared Source UI and event-intake behavior.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing Source availability flags continue to govern access.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: routes the workspace "Optimize a
  contract" entry to `/source/new?intent=contract-optimization`.
- `src/components/source/SourceOriginatePage.tsx`: labels contract optimization as its own intake,
  renders a compact four-ledger evidence strip for Door 1, and names Door 1 created events as
  contract optimizations.
- Regression tests for Source intake and workspace view-model routing.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/__tests__/intake-intent.test.ts src/__tests__/integration/source/source-originate-page.test.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand` — 55/55 passed. Existing duplicate manual-mock warnings were emitted by Jest.
- PASS: `npx eslint src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/components/source/SourceOriginatePage.tsx src/__tests__/integration/source/source-originate-page.test.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys
the updated web image. No migration, operator job, feature flag, or data reload is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: standard post-deploy invariant required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for `/source/preview/workspace` optimize navigation and
  `/source/new?intent=contract-optimization`.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned workflow. No data rollback is required.

## Audit Evidence

- PR diff and checks.
- Focused Jest and ESLint output.
- Post-deploy signed-in browser proof for the workspace optimize link and the intent-shaped intake.

## Known Gaps

This release fixes the front-door distinction only. It does not replace the deeper Contract 360
optimization evidence population or the quantified cockpit work.
