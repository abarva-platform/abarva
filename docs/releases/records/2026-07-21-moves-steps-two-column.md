# 2026-07-21-moves-steps-two-column — Steps two-column Finder view (MOVES-UI-001)

## Release ID

`2026-07-21-moves-steps-two-column`

## Status

`candidate`

## Plain-English Summary

Replaces the Steps view's internal layout on the live Moves phase page
(`MovesPhaseStandaloneClient.tsx`) with the exact two-column pattern the owner approved in the
reference design: a grouped left sub-menu (phase-capture input fields + workflow steps) and a
detail pane on the right, with an inline evidence-citation toggle and a collapsible "Coming
up" next-phase preview. Gated behind the existing `moves_finder_shell_v1` flag (currently on
for Lakeshore, SkyHarbor, Meridian) — when the flag is off, the page renders the exact
pre-existing horizontal stepper, byte-for-byte.

## Layer Impact

- **Presentation only**, reusing existing data and existing action handlers:
  - Left-menu rows come from `getPhaseCaptureSections()`/`phaseCaptureValues` (capture inputs)
    and the existing `phase.substeps`/`substepIndex` state (workflow steps) — the same sources
    already driving the pre-existing stepper, not a new parallel source of truth.
  - The right-hand workflow detail pane renders the exact same `<PhaseBody>` element/props used
    in the flag-off path, so uploads, decision panels, and the gate-approval flow are reused
    unmodified, not rebuilt.
  - Citation toggle binds to the real per-fact `source` field already produced by
    `diagnosis-facts.ts` for structured facts (e.g. P2's `baseline_metrics`) — renders only when
    a fact actually has a captured source.
  - "Coming up" binds to the real `buildNextPhaseReadinessPack()` output, the same function the
    existing Approve substep's readiness panel already calls.
  - No new API routes, no new fetches, no changes to `governance.ts`, `PhaseApproveAndBuild.tsx`
    internals, or the Approvals overview (`moves_approvals_overview_v1`).

## Client Applicability

- All clients: no
- Specific clients: Lakeshore, SkyHarbor, Meridian (existing `moves_finder_shell_v1` tenants —
  unchanged by this PR)
- Internal only: no
- Public/demo only: no
- Feature flag: `moves_finder_shell_v1` (no change to the flag definition itself)

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — new `FinderStepsColumns`
  two-column view, mounted only when `moves_finder_shell_v1` resolves true; flag-off path is
  the identical pre-existing JSX, reindented only
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 6 new tests
  using real RTL `fireEvent` interactions (not shape assertions): row-click detail-pane update,
  citation reveal/hide, real file-input upload exercising the existing evidence-upload wiring,
  Coming-up expand/collapse, each checked across both flag states

## QA / Validation

- `npx eslint`: clean on both touched files
- `npx jest MovesPhaseStandaloneClient.test.tsx`: 34/34 passing (28 pre-existing + 6 new
  functional-interaction tests, per an explicit owner requirement that interactive elements be
  smoke-tested with real fireEvent interactions, not just prop-shape assertions)
- Full `strategic-moves` suite: 118/118 passing (1 pre-existing unrelated Clerk/jest-transform
  failure, confirmed via `git stash` to predate this change)
- `tsc --noEmit` (whole project): 4 pre-existing errors in untouched test-file lines, confirmed
  via `git show`/`git stash`; zero new errors
- Flag-off byte-parity verified explicitly via `git diff` and a dedicated test
- Honesty checks performed: citation toggle confirmed absent-by-default (no fabricated
  sources); upload smoke test exercises the real, already-existing evidence-upload endpoint
  wiring, not a mock

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change needed — this ships to the same tenants already seeing
   `moves_finder_shell_v1` (Lakeshore, SkyHarbor, Meridian).
3. Live signed-in click-through recommended before considering this fully proven (blocked on
   an active authenticated session — see prior release records' note on Clerk OTP-only sign-in
   constraints).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: no flag/env change in this PR
- Live signed-in proof required: yes, recommended before default-on; not yet completed (same
  access constraint as prior releases this session)

## Rollback Plan

Revert the merge commit, or set `moves_finder_shell_v1`'s `includeTenants` back to `[]` (reverts
all MOVES-UI-001 chrome for all tenants, one line).

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-001
- Prior release records: `docs/releases/records/2026-07-20-moves-finder-shell-live-polish.md`,
  `docs/releases/records/2026-07-21-moves-ui-flags-cross-prove.md`
