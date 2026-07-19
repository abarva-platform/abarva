# 2026-07-19-source-backlog-ledger-old-surface-archive — Source Backlog Ledger And Old Surface Archive Guard

## Release ID

`2026-07-19-source-backlog-ledger-old-surface-archive`

## Status

`candidate`

## Plain-English Summary

Adds a Source done ledger that separates planned, merged, deployed, and signed-in
proven work. It also archives the old Source event-shell routing path by removing
the `UniversalCanvasShell` fallback from the event detail route. Source event
pages now mount the redesigned Source analytics shell directly for every tenant;
rollback is a code revert, not a quiet flag fallback to the old shell.

## Layer Impact

- `global-control-lane`: Source event routing and static route tests change for
  all tenants. No schema, migration, model call, or data-plane write is added.
- Documentation/backlog control: Adds a ledger for Source release state and
  future execution order.

## Client Applicability

- All clients: Yes, Source event detail routes use the redesigned shell.
- Specific clients: None.
- Internal only: The backlog ledger is operator-facing documentation.
- Public/demo only: No.
- Feature flag: None. This removes the event-route dependency on the
  `source_analytics` fallback decision.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/page.tsx`
- `src/__tests__/integration/source/source-old-surface-archive.test.ts`
- Source route-control static tests updated to assert the old shell is not
  imported or mounted by the event detail route.
- `docs/backlog/tracks/04-source-commercial/SOURCE_DONE_LEDGER.md`

## QA / Validation

- Pass: `npx jest src/__tests__/integration/source/source-route-shell-control.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts src/__tests__/integration/source/source-authenticated-route-smoke.test.ts src/__tests__/integration/source/source-context-action-enforcement.test.ts src/__tests__/integration/source/source-old-surface-archive.test.ts --runInBand` (29/29; existing duplicate manual mock warnings).
- Pass: `npx eslint 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/__tests__/integration/source/source-route-shell-control.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts src/__tests__/integration/source/source-authenticated-route-smoke.test.ts src/__tests__/integration/source/source-context-action-enforcement.test.ts src/__tests__/integration/source/source-old-surface-archive.test.ts`.
- Pass: `git diff --check`.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` (plain `npx tsc --noEmit --pretty false` hit a local Node heap limit before diagnostics).
- Pass: `npm run release:check` (initial candidate record failed because this section did not state pass/fail/not-run/blocked statuses; corrected and reran clean).

## Rollout Plan

Standard PR to `main`, squash merge, repo-owned ACA main deploy, then signed-in
browser proof on `https://app.abarva.ai/source/events/<eventId>` across the
canonical Source stages.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow if worker images are
  updated.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR to restore the previous event-route fallback branch. If already
deployed, use the repo-owned ACA main deploy workflow on the reverted merge SHA
and re-run the signed-in Source route proof.

## Audit Evidence

- PR URL: TBD.
- CI / local validation: TBD.
- ACA deploy run: TBD after merge.
- Signed-in screenshots/proof: TBD after deploy.

## Known Gaps

This does not delete the `UniversalCanvasShell` component file because existing
direct component tests still cover legacy helper behavior. It removes the
reachable Source event route path to that shell. Full component deletion is a
follow-up once dependent tests/helpers are retired or migrated.
