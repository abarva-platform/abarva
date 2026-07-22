# 2026-07-22-shell-phantom-viewport-scroll — Shell stops claiming a second full viewport

## Release ID

`2026-07-22-shell-phantom-viewport-scroll`

## Status

`candidate`

## Plain-English Summary

Chasing the last of the Tower fold turned up a product-wide layout bug that was never a Tower problem.

Tower measured **exactly 73px taller than the window at every viewport size tested** — 1440x900, 1600x985, 1920x1055 and 1600x900 all reported the same 73px. A constant overflow that does not move with the window is the signature of a fixed layout cost, not of too much content; if it were density, the number would change with the viewport.

`MaestroChrome` composes the page correctly: a flex column of `min-height: 100vh` holding the top nav plus a `flex: 1` wrapper. `AppShell` is that wrapper's child — and it re-asserted `min-height: 100vh` on both its root grid and its right-hand column. That demanded a whole viewport **below** the 73px nav, so every shell-native surface was exactly the nav's height taller than the window and always carried a scrollbar with nothing under the fold.

`AppShell` now fills the space its parent gives it (`flex: 1`, `min-height: 0`) instead of claiming the viewport a second time. The Tower mart's own `min-height: calc(100vh - 132px)` — a hardcoded guess at the chrome above it, which no longer matched the real 73px nav — is replaced with `100%` for the same reason: the shell sizes correctly now, so the surface should simply fill it.

Verified by simulating the change against the live signed-in product across four surfaces and two window sizes before writing it:

| Surface                   | Before | After | Result                                |
| ------------------------- | ------ | ----- | ------------------------------------- |
| `/tower` 1600x900         | 973    | 900   | fits exactly                          |
| `/tower` 1920x1055        | 1128   | 1055  | fits exactly                          |
| `/intelligence` 1600x900  | 973    | 900   | fits exactly                          |
| `/intelligence` 1920x1055 | 1128   | 1055  | fits exactly                          |
| `/source` 1920x1055       | 1128   | 1067  | phantom removed; real content remains |
| `/home` 1600x900          | 7829   | 7829  | long page still scrolls normally      |

The last two rows are the important ones: the fix removes the phantom viewport without collapsing surfaces that legitimately need to scroll.

## Layer Impact

- `global-control-lane`: `src/components/shell/AppShell.tsx` — layout sizing for every shell-native surface (Home, Intelligence, Moves, Source, Tower). No data path, query, or schema change.
- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — removes the hardcoded chrome offset on the Tower mart container.

## Client Applicability

- All clients: yes. This is a shared shell change; blast radius is deliberately noted below.
- Feature flag: none.

## Changes Included

- `src/components/shell/AppShell.tsx` — root grid and right-hand column no longer set `min-height: 100vh`; they fill the parent flex row instead.
- `src/components/tower/TowerIndexPage.tsx` — Tower mart container `min-height` changed from `calc(100vh - 132px)` to `100%`.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `npm run test:nav` — 26/26.
- Pass: `jest src/components/tower/__tests__/` — 19/19.
- `jest src/components/shell` — 27 pass, 1 fail. The failure (`Admin shell vocabulary > uses canonical Admin command palette destinations`) was confirmed **pre-existing** by re-running it against a stashed working tree; it is unrelated to this change and is not introduced here.
- Simulated against the live signed-in product across four surfaces and two window sizes; results in the table above.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only; no migration, no job, no data change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected; verified before claiming live-proven.
- Live signed-in proof required: yes — because this is a shared shell change, confirm Tower, Intelligence, Source, Moves and Home all still render correctly, not Tower alone.

## Rollback Plan

Revert the PR. Two style declarations; nothing depends on them.

## Audit Evidence

- Deployed-build measurement on revision `mc490a9c8`: `martTop=73`, `martHeight=768`, `mainContentHeight=760`, `scrollHeight=973`, `innerHeight=900` — content genuinely fit inside the shell while the document remained 73px too tall, which isolated the cause to the shell rather than the surface.
- Constant 73px overflow reproduced at four viewport sizes.

## Known Gaps

- `/source` still exceeds a 900px window by real content after the phantom is removed. That is a genuine density question for that surface and is deliberately out of scope here rather than being folded into a shell fix.
