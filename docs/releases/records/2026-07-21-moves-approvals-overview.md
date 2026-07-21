# 2026-07-21-moves-approvals-overview — Cross-phase Approvals overview (MOVES-UI-002)

## Release ID

`2026-07-21-moves-approvals-overview`

## Status

`candidate`

## Plain-English Summary

Adds a new cross-phase "Approvals overview" to the live Moves phase workspace
(`MovesPhaseStandaloneClient.tsx`): one list showing gate/tally/approval status for all 6
phases at a glance, instead of only being visible one phase at a time. Closes the Phase 5
open question from MOVES-UI-001. Gated behind a new, independent flag
`moves_approvals_overview_v1`, off by default — no visible change to any user until enabled.
Built entirely from already-computed data (`getMovePhaseTallies()`); no new API route, no
change to gate/approval logic, no fabricated approver names or per-role rows.

## Layer Impact

- **Presentation only**, reusing existing data and existing navigation. `governance.ts`,
  `GATE_RULES`, `evaluateGate()`, `PhaseApproveAndBuild.tsx`'s internals, and the two-call
  approve flow are all untouched.

## Client Applicability

- All clients: no (flag off by default)
- Specific clients: none yet — `includeTenants: []`
- Internal only: no
- Public/demo only: no
- Feature flag: `moves_approvals_overview_v1` (new, independent from `moves_finder_shell_v1`)

## Changes Included

- `src/lib/features/registry.ts` — new `moves_approvals_overview_v1` flag definition
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — new `"approvals"`
  `workspaceView`, `ApprovalsOverviewGate`/`ApprovalsOverviewFlagReader` (mirrors the existing
  Finder-shell flag-gate pattern), `ApprovalsOverview` component sourced from
  `getMovePhaseTallies(move)`, rail Approvals-link behavior change (flag-gated only)
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 4 new
  tests: flag-off parity, flag-on overview content traced to a mocked tallies fixture,
  current-phase review-and-approve navigation, other-phase link hrefs / unreachable-phase
  no-action state

## QA / Validation

- `npx eslint`: clean
- `npx jest MovesPhaseStandaloneClient.test.tsx`: 28/28 passing
- Full `strategic-moves` suite: 112/112 passing (1 pre-existing unrelated failure, confirmed
  via `git stash` to predate this change)
- `tsc --noEmit`: one pre-existing error at `MovesPhaseStandaloneClient.test.tsx:41`, confirmed
  unchanged by this diff via `git show`
- Manually isolated the real functional diff from unrelated prettier re-wrap noise before
  opening this PR (same tooling drift as prior MOVES-UI-001 PRs)

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. Flag ships OFF — zero behavioral change at deploy time.
3. Next: enable for 1-2 proof tenants, live-verify signed-in, consider default-on alongside
   `moves_finder_shell_v1`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly — standard main-deploy workflow picks this up
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: flag ships default OFF, no env var change needed
- Live signed-in proof required: not required for this release (flag off for 100% of
  traffic); required before any tenant enablement

## Rollback Plan

Revert the merge commit, or leave the flag at `includeTenants: []` (no runtime action needed
even without reverting).

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-002
