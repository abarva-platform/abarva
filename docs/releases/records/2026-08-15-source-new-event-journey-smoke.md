# 2026-08-15-source-new-event-journey-smoke — Source New Event Journey Smoke

## Release ID

`2026-08-15-source-new-event-journey-smoke`

## Status

`candidate`

## Plain-English Summary

This release expands the Source proof surface for the New Event journey. It adds a focused automated smoke test that renders every canonical stage through the active Source canvas and checks that the user can see where they are, what the active work area is, what evidence is requested, and how supporting workspaces are reached. It does not change product behavior, persistence, tenant data, parser ingestion, or approval logic.

## Layer Impact

- Layer 4 Products: adds automated UI proof coverage around the existing Source projection.
- Layers 1-3: no intake, adapter, canonical model, schema, loader, or data-plane changes.

## Client Applicability

- All clients: CI coverage only; no runtime behavior changes.
- Specific clients: none.
- Internal only: Source QA and release proof workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx` for the 11-stage active canvas contract.
- Adds `qa:source-new-event-journey-smoke`.
- Wires the new smoke into `.github/workflows/source-layout-smoke.yml`.

## QA / Validation

- Pass: `npm run qa:source-new-event-journey-smoke`
- Pass: `npm run qa:source-stage-shell-layout`
- Pass: `npm run qa:source-responses-layout`
- Pass: `npx eslint src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The repo-owned Source layout smoke workflow will run the expanded journey smoke on pull requests and merge queue entries. No Azure runtime behavior changes are introduced by this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this QA-only slice before merge.
- ACA runtime invariant: not required for local test proof; required before claiming any deployed app state.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not required for this test-only slice before merge; any later product claim must provide signed-in route proof separately.

## Rollback Plan

Revert the test, package script, workflow step, and this release record.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local smoke output: `npm run qa:source-new-event-journey-smoke` passed 12 tests.
- Release check output: passed; Release Control Gate, Deploy Authority Gate, and Pilot Data Loader Gate passed.

## Known Gaps

This is an automated smoke expansion only. It does not repair excluded tenant membership proof, persist stage approvals, parse vendor files, or implement the next UX/evidence feature slices.
