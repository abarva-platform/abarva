# 2026-06-04-source-lifecycle-routing-guard — Source Lifecycle Routing Guard

## Release ID

`2026-06-04-source-lifecycle-routing-guard`

## Status

`candidate`

## Plain-English Summary

Adds the first Source lifecycle routing guard so persisted sourcing events route users to the right workspace based on event state. Waiting events route to approval instead of opening the work canvas, active events can use the canvas, closed events route to summary, and archived events route to the Source queue.

## Layer Impact

- Release lane: `global-control-lane`.
- `global-control-lane`: Updates shared Source request routing in `src/proxy.ts` for all clients using persisted `source_events` rows.

## Client Applicability

- All clients: Applies to authenticated Source event routes when the event exists in the tenant-scoped `source_events` table.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/proxy.ts`
- `src/lib/source/lifecycle-routing-guard.ts`
- `src/lib/source/__tests__/lifecycle-routing-guard.test.ts`

## QA / Validation

- Pass: `npm run test -- src/lib/source/__tests__/lifecycle-routing-guard.test.ts` (7 tests passed; Jest emitted pre-existing duplicate manual mock warnings).
- Pass: `npx playwright test tests/e2e/source/lifecycle-routing-guard.spec.ts --workers=1` (2 tests passed).
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npx tsc --noEmit --skipLibCheck`.
- Pass: `npx eslint src/proxy.ts src/lib/source/lifecycle-routing-guard.ts src/lib/source/__tests__/lifecycle-routing-guard.test.ts tests/e2e/source/lifecycle-routing-guard.spec.ts --max-warnings 0`.
- Not run: Production smoke; this PR must merge and deploy before the direct-route 302 behavior can be validated on `app.abarva.ai`.

## Rollout Plan

Merge to `main`; Vercel deploys the updated proxy automatically. No database migration is required.

## Rollback Plan

Revert the PR. This removes the proxy lifecycle routing hook and restores the prior authenticated-only Source routing behavior.

## Audit Evidence

- PR URL and CI run.
- Unit test output for the pure route policy.
- Post-deploy route smoke showing a waiting event redirects to `/approval`.

## Known Gaps

Seed-only demo slugs that do not exist in `source_events` fail open. This is intentional for this guard because the proxy must not brick demo rows when no persisted lifecycle record exists.
