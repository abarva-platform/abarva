# 2026-05-30-tower-route-conflict — Tower Dynamic Route Conflict Fix

## Release ID

`2026-05-30-tower-route-conflict`

## Status

`candidate`

## Plain-English Summary

Fixes a Next.js 16 App Router conflict under Tower programs. The Tower program detail route and the Tower program value route now use the same dynamic segment name, so local development can start without the `moveId` versus `programId` route reload error.

## Layer Impact

- `global-control-lane`: Tower routing is shared control-plane behavior. The public URL shape remains `/tower/programs/<id>` and `/tower/programs/<id>/value`; only the source folder parameter name changes.

## Client Applicability

- All clients: Tower program and value routes.
- Specific clients: None.
- Internal only: Local development and CI route compilation stability.
- Public/demo only: Demo Tower walkthrough routes benefit from the same fix.
- Feature flag: None.

## Changes Included

- Renames the Tower value route source folder from `src/app/(maestro)/tower/programs/[moveId]/value/page.tsx` to `src/app/(maestro)/tower/programs/[programId]/value/page.tsx`.
- Keeps the domain variable as `moveId` inside the page because the value-state read model still uses Move terminology.
- Adds an invariant test that pins the aligned Next.js 16 dynamic segment shape.
- Updates route documentation references from `[moveId]/value` to `[programId]/value`.

## QA / Validation

- Reproduced: `npm run dev` on `origin/main` logged `You cannot use different slug names for the same dynamic path ('programId' !== 'moveId')`.
- Passed: `npm run dev` after the fix started cleanly and served `/tower` without the dynamic-route reload error.
- Passed: `npx jest src/__tests__/integration/tower/tower-invariants.test.ts --runInBand -t "dynamic segments aligned"`.
- Passed: `npx tsc --noEmit --pretty false`.
- Known unrelated failure: full `src/__tests__/integration/tower/tower-invariants.test.ts` still fails on pre-existing redirect-shell assertions for Tower subroutes that already exist on `origin/main`.

## Rollout Plan

Merge to main and let the normal Vercel deployment pick up the route source rename. No migration or feature flag is required.

## Rollback Plan

Revert the release commit. If reverted, local Next.js 16 development will again hit the dynamic segment conflict until an alternate route design is applied.

## Audit Evidence

- PR: Pending.
- Error reproduction: local `npm run dev` output in the clean worktree.
- Test: `src/__tests__/integration/tower/tower-invariants.test.ts`.

## Known Gaps

This release fixes only the Next.js dynamic segment-name conflict under `/tower/programs`. It does not clean up the older Tower redirect-shell assertions that already fail in the full `tower-invariants` suite on `origin/main`; those subroute cleanup decisions should be handled as a separate Tower routing debt slice because they affect multiple visible Tower entry points beyond the program value route.
