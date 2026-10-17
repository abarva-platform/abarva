# u697 — The live walk files a phase the page holds back as not reachable

## Release ID

`2026-10-17-moves-walk-held-phase-not-reachable`

## Status

`candidate`

## Plain-English Summary

The post-deploy step-page walk decides which phases to walk from the Move's stored current phase. The step pages can hold a Move at an earlier phase: when evidence that an earlier phase depends on goes back to pending review, routes for the later phase redirect to the earlier phase's open step. The walk then landed every later-phase view on the earlier phase's page and reported each one as a failure ("view did not settle", or the wrong step id). The page was doing what it should, and the walk reported six failures where the honest answer is "not reachable: the Move is held at the earlier phase".

One harness change: after the phase landing, if the landed path names an earlier phase than the one requested, every view in the requested phase is recorded as `not_reachable`. The reason names the phase it is held at and the URL it redirected to. The landing row itself keeps its own pass/fail result.

## Layer Impact

Release lane: `global-control-lane`.

- **Test harness only (Moves live walk):** `tests/e2e/moves-step-pages-live-walk.spec.ts`. No product, data, route or flag change.

## Client Applicability

- **All clients:** none; the walk is a read-only check against the synthetic demo Move.
- **Specific clients:** none.
- **Internal only:** yes (CI evidence).
- **Public/demo only:** no.
- **Feature flag:** unchanged.

## Changes Included

- `tests/e2e/moves-step-pages-live-walk.spec.ts`:
  - `heldAtEarlierPhase(landed, phase)` reads the phase from the landed path;
  - the walk loop records a held phase's views as `not_reachable` (shared `recordUnreachableViews` helper, also used by the existing stored-phase branch);
  - a fixture test for the redirect, same-phase, later-phase and sign-in cases.

## QA / Validation

- Fixture tests: PASS, 3 / 3 (new held-phase case, confirmed-order foot, write-guard allowance).
- `npm run typecheck`: PASS. ESLint: PASS. `npm run release:check`: PASS.
- Live walk: NOT RUN locally (needs the signed-in CI secrets); the next post-deploy walk is the proof.

## Rollout Plan

Takes effect on the next post-deploy walk. While the Move is held at the earlier phase, expect the later phase's five views as `not_reachable` with the held-at reason instead of `fail`. Once the earlier phase's evidence is approved again, the redirect stops and the views are walked as before.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this PR's content.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's later-phase rows.

## Rollback Plan

Revert the squash commit.

## Known Gaps

- **A redirect that is itself a defect would read as not reachable.** The reason line carries the landed URL, so a wrong redirect stays visible in the summary, but it no longer fails the walk on its own. The journey gate readback still reports the stored phase separately.
- **Unchanged findings.** The Files workspace download check and the UX scorer's next-action findings are unaffected.

## Audit Evidence

- PR URL and CI run; walk 39044729079's proof rows for the later-phase views.
