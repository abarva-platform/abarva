# Source Golden Event Stage 1+2 Green

## Release ID

`2026-06-04-source-golden-event-stage12-green`

## Status

`draft`

## Plain-English Summary

This release packages the Source golden-event fixes that made the Apex AMS Stage 1 Strategy and Stage 2 Scope lanes pass again in the clean Source worktree. It hardens the Source E2E auth/session path, adds a non-production reset-to-strategy helper for the golden event, and updates the Stage 1+2 audit harness so gate blockers and generated Scope content are read from the surfaces the product actually renders today.

## Layer Impact

- `global-control-lane`
  The Source golden-event audit spec and shared E2E auth/harness helpers are updated so Stage 1 and Stage 2 exercise the real current stage-flow contract instead of failing on stale session state or stale selectors.
- `internal-admin`
  A non-production-only reset route is added for the Apex golden event so the deterministic Stage 1→2 proof can restart at Strategy without manual DB surgery.

## Client Applicability

- All clients: None directly at runtime.
- Specific clients: None directly at runtime.
- Internal only: Yes. This is Source test/harness work plus a non-production golden-event reset helper.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source E2E auth freshness hardening in `tests/e2e/source/_auth.ts`
- Source Stage 1+2 audit harness updates in `tests/e2e/source/_audit-harness.ts`
- Golden-event Stage 1+2 spec updates in `tests/e2e/source/golden-event-apex-ams.spec.ts`
- Non-production Apex golden-event reset helper in `src/app/api/v1/source/[eventId]/test-reset/route.ts`

## QA / Validation

- `npm run test:behaviors` — passed
- `npm run test:nav` — passed
- `SOURCE_AUTH_REFRESH=1 RUN_SCOPE_PROBE=1 BASE_URL=http://localhost:3004 npx playwright test tests/e2e/source/golden-event-apex-ams.spec.ts -g "Stage 2" --workers=1` — passed in the clean worktree
- `BASE_URL=http://localhost:3000 npx playwright test tests/e2e/source/golden-event-apex-ams.spec.ts --grep "Stage 1|Stage 2" --workers=1` — blocked after rebase in `beforeEach`; exact blocker is the current localhost:3000 proof path timing out while booting/authing the clean worktree server

## Rollout Plan

Open a PR from the clean Source worktree branch for review. Once the localhost:3000 Playwright proof is green, squash-merge to `main`. No database rollout or feature flag is required. The reset helper is already guarded away from production by `NODE_ENV === "production"`.

## Rollback Plan

Revert the PR commit. No schema rollback is required. If the reset helper causes confusion in non-production, removing `src/app/api/v1/source/[eventId]/test-reset/route.ts` cleanly removes the route.

## Audit Evidence

- Local Stage 2 proof packet:
  `reports/source-golden-event/2026-06-04-11-14-22/source-golden-event-apex-ams-spec-ts-apex-ams-sourcing-golden-event-stage-2-scop/audit.json`
- Repo test output for `npm run test:behaviors`
- Repo test output for `npm run test:nav`
- Playwright failure packet for the blocked localhost:3000 proof:
  `test-results/source-golden-event-apex-a-d4185-nce-approval-records-reason-chromium/error-context.md`

## Known Gaps

- The requested localhost:3000 Stage 1+2 Playwright proof is not green yet after rebase; the current blocker is the `beforeEach` hook timing out in the local server/auth boot path.
- Separation-of-duties contract gaps remain out of scope for this release candidate.
