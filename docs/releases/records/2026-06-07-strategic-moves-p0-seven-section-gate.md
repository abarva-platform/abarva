# 2026-06-07-strategic-moves-p0-seven-section-gate - Strategic Moves P0 seven-section gate

## Release ID

`2026-06-07-strategic-moves-p0-seven-section-gate`

## Status

`candidate`

## Plain-English Summary

Strategic Moves origination now requires the full seven-section P0 scaffold before a draft Move can be promoted to P1 Charter. The UI no longer marks steps 5-7 as optional or describes promotion as a four-section gate.

## Layer Impact

- `global-control-lane`: Updates shared authenticated Strategic Moves client behavior and copy. No database schema, tenant data-plane, or migration changes are included.

## Client Applicability

- All clients: Applies to every tenant using `/strategic-moves/new`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `StrategicMoveOriginateClient` to count all seven scaffold sections as required for promotion.
- Updates Nexus first-message copy to describe the full seven-section P0 scaffold.
- Adds a component regression test for the seven-section promotion gate.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand` passed. Jest reported pre-existing duplicate manual mock warnings for markdown/GFM mocks, but the focused suite passed.
- `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/composeOriginateFirstMessage.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge to main and deploy through the normal Vercel application rollout. The change is active immediately in the authenticated Strategic Moves Originate route.

## Rollback Plan

Revert the application commit or rollback the Vercel deployment. No migration rollback is required.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3249
- Local validation: focused Jest suite, touched-file ESLint, and release control gate listed above.

## Known Gaps

No data-plane or server-side promote-contract changes are included. This release only changes the client-side Originate gate and copy, so any future server-side enforcement of the seven-section P0 doctrine should be tracked separately if product requires API-level rejection of incomplete submissions.
