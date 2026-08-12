# 2026-08-12-source-bafo-scenario-compare — Source BAFO Scenario Compare

## Release ID

`2026-08-12-source-bafo-scenario-compare`

## Status

`candidate`

## Plain-English Summary

The Source BAFO stage now shows a deterministic scenario compare that answers what can realistically be improved before final vendor asks are sent. It separates conservative, base, and stretch negotiation scenarios, shows blockers, identifies the next useful vendor-specific action, and keeps savings caveated as directional rather than booked value.

## Layer Impact

- Product surface: Source BAFO UI only. The stage now presents a workflow-oriented scenario compare alongside the existing lever envelope and concession ledger.
- Canonical/data layer: No schema, migration, persistence, loader, adapter, upload, parser, or live data-plane change.
- Evidence governance: The UI reinforces that blocker resolution and human approval are required before BAFO negotiation material is treated as final.

## Client Applicability

- All clients: Yes, for Source New Event BAFO-stage UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/components/source/canvas/bafo/BafoScenarioComparePanel.tsx`.
- Wired the deterministic scenario compare into `src/components/source/canvas/bafo/BafoStageView.tsx`.
- Added `src/components/source/canvas/bafo/__tests__/BafoStageView.test.tsx`.
- Added this release record.

## QA / Validation

- PASS: Focused Jest for the BAFO stage render contract: `npm test -- --runTestsByPath src/components/source/canvas/bafo/__tests__/BafoStageView.test.tsx --runInBand`.
- PASS: ESLint for affected files: `npx eslint src/components/source/canvas/bafo/BafoScenarioComparePanel.tsx src/components/source/canvas/bafo/BafoStageView.tsx src/components/source/canvas/bafo/__tests__/BafoStageView.test.tsx`.
- PASS: Whitespace diff check: `git diff --check`.
- PASS: TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: Release check: `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN YET: GitHub PR checks.
- NOT RUN YET: Signed-in live Source BAFO route proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA to the shared lab/product web runtime. After deploy, verify the ACA runtime invariant and perform signed-in browser proof on the Source BAFO stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the main deploy workflow.
- Approved image digest: Pending deploy workflow.
- ACA runtime invariant: Pending deploy workflow evidence.
- Worker image invariant: Pending deploy workflow evidence.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source BAFO route.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to deploy the reverted `main` image. No database rollback is required because there are no schema, persistence, or data-plane changes.

## Audit Evidence

To be filled after PR, CI, deploy, and live proof:

- PR URL:
- Merge commit:
- ACA deploy run:
- Runtime digest:
- Live screenshot:

## Known Gaps

This does not implement live negotiation dispatch, model-generated BAFO briefs, upload parsing, persistence, scoring calibration, or approval workflow changes. It surfaces deterministic scenario guidance only.
