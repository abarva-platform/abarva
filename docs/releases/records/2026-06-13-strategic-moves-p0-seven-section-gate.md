# 2026-06-13-strategic-moves-p0-seven-section-gate - Strategic Moves P0 Seven-Section Gate

## Release ID

`2026-06-13-strategic-moves-p0-seven-section-gate`

## Status

`candidate`

## Plain-English Summary

Strategic Move origination now requires the full seven-section P0 scaffold before a move can be promoted to P1 Charter. The previous UI treated evidence family, value hypothesis, and foundation readiness as optional, which made a partially formed Move look promotable before the P0 brief was truly complete.

## Layer Impact

- `global-control-lane`: updates the shared authenticated Strategic Moves origination experience and Nexus opening copy for every tenant.
- No `client-data-lane` changes: this PR does not change tenant data, schemas, migrations, loaders, or promotion/readiness state.

## Client Applicability

- All clients: yes, all tenants using `/strategic-moves/new` receive the same P0 gate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/composeOriginateFirstMessage.ts`
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- This release record.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/composeOriginateFirstMessage.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- Pending before PR: `npm run release:check -- --base origin/main --head HEAD`
- Pending before PR: `git diff --check origin/main..HEAD`

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image, deploy the image to the lab ACA app, shift lab traffic after the new revision is ready, and verify `https://app.abarva.ai/` plus `/api/health`.

## Rollback Plan

Revert the PR and redeploy the prior Azure Container Apps image or shift traffic back to the previous known-good revision. No database rollback is required.

## Audit Evidence

- Replacement PR for stale draft #3249.
- Focused Jest regression test proving four captured sections still keep Promote disabled.
- Focused ESLint and release gate output.
- Post-merge Azure deployment proof will be recorded in the progress report if merged.

## Known Gaps

This PR only aligns the P0 client-side originate gate and Nexus prompt copy. It does not change server-side P0 promotion validation, sponsor/person provisioning, phase approval routing, or existing Move records that may already have been created under the prior four-section UI guidance. Those remain governed by the existing API and phase-gate controls.
