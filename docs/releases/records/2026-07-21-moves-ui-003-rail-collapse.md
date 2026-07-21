# 2026-07-21-moves-ui-003-rail-collapse — Rail collapse/expand toggle (MOVES-UI-003)

## Release ID

`2026-07-21-moves-ui-003-rail-collapse`

## Status

`candidate`

## Plain-English Summary

Adds the rail collapse/expand toggle that was part of the original approved MOVES-UI-001
design but was missing from the live component — found by a full driven E2E verification pass
(`proof/moves-ui-001-002-e2e-20260721/`). Gated behind the existing `moves_finder_shell_v1`
flag; when off, no toggle exists and the rail behaves exactly as before.

## Layer Impact

- **Presentation only.** New `railCollapsed` client state and a toggle button in
  `MovesPhaseStandaloneClient.tsx`'s rail; collapsed state hides labels/group headers and
  shrinks the rail to icon-only width, reusing the same phase-row `<Link>`/click handlers so
  navigation is unchanged. No new API routes, fetches, or changes to gate/approval logic.

## Client Applicability

- All clients: no
- Specific clients: Lakeshore, SkyHarbor, Meridian (existing `moves_finder_shell_v1` tenants)
- Internal only: no
- Public/demo only: no
- Feature flag: `moves_finder_shell_v1` (no change to the flag definition)

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — `railCollapsed` state,
  `.mxw-rail-toggle` button, `.mxw-side-collapsed`/`.mxw-surface-rail-collapsed` CSS (reusing
  `MovePhaseExplorer.module.css`'s collapsed-state values as the size/spacing reference)
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 3 new tests:
  flag-off (no toggle in DOM, byte-parity), flag-on collapse/expand (real DOM class change,
  labels removed/restored), and collapsed-state navigation (a reachable phase remains a real
  `<a>` with the correct `href`)

## QA / Validation

- `npx eslint`: clean
- `npx jest MovesPhaseStandaloneClient.test.tsx`: 37/37 passing (34 pre-existing + 3 new)
- `npm run test:behaviors`: 195/195 passing (unrelated sanity check)
- `tsc --noEmit`: no errors attributable to touched files (full-project run has a known,
  pre-existing local-machine crash unrelated to this change; CI is authoritative)
- **Not yet done**: live signed-in browser re-verification of the toggle on a real proof
  tenant — the sandbox used to build this has no real Clerk keys. Recommended before
  considering this fully proven, same as the original MOVES-UI-001/002 pattern.

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change needed — ships to the same tenants already seeing
   `moves_finder_shell_v1`.
3. Live signed-in click-through of the collapse toggle specifically, on at least one proof
   tenant, before closing out MOVES-UI-003.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: no flag/env change in this PR
- Live signed-in proof required: yes, specifically for the collapse toggle — not yet completed

## Rollback Plan

Revert the merge commit, or set `moves_finder_shell_v1`'s `includeTenants` back to `[]`.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` § MOVES-UI-003
- E2E verification that found this gap: `proof/moves-ui-001-002-e2e-20260721/`
