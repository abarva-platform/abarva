# 2026-10-10 — Moves scroll proof across responsive layouts

## Release ID

`2026-10-10-moves-scroll-proof-responsive`

## Status

`candidate`

## Plain-English Summary

The signed-in read-only walk now recognizes that the same long work page can scroll inside its workspace pane on desktop and through the document on phone. It still requires the actual Root causes row and end-of-step action to become visible after ordinary wheel scrolling.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1–3: no intake, adapter, canonical data, schema, or loader change.
- Layer 4: test-only correction to the Moves signed-in walk; no product runtime change.

## Client Applicability

- No client runtime behavior changes.
- The synthetic demo Move is the current signed-in walk target.

## Changes Included

- Accept either the page's internal scroll offset or the document scroll offset when proving reachability.
- Keep the row and end-of-step action visibility assertions at 1440px and 390px.
- Add a local browser case that exercises both responsive scroll paths.

## QA / Validation

- Focused Chromium cases for pane and document scrolling: pass, 2 tests.
- Mutation check: ignoring document scroll made the 390px browser case fail; restoring it passed.
- Typecheck, changed-file ESLint, library orphan audit, and route/export reachability: pass.
- Test coverage census: no new Jest file; `coveredTestFiles` remains 2,827.
- Tenancy fence and manual generated files: current with no new change.
- Release gates: pass, all 11 gates.
- Signed-in read-only walk after the repo-owned deploy: pending.
- The preceding deployed UI was observed read-only: at 1440×900 the pane scrolled, and at 390×900 the document scrolled; both brought the row and action into view.

## Rollout Plan

Squash merge after current-head CI and the open-PR coverage-count collision check. The repo-owned ACA main workflow owns any shared runtime update. Confirm the runtime invariant, then use the automatic signed-in read-only walk result.

## Deployment Authority

- Shared web traffic: repo-owned `.github/workflows/aca-main-deploy.yml` only.
- No data build or governed UI action is part of this change.

## Rollback Plan

Revert this test-only change through a release PR if the walk reports a false result. Product records and approvals are unaffected.

## Audit Evidence

- Pull request, current-head CI, synthetic browser case, deployed walk artifact, and signed-in read-only screenshots.

## Known Gaps

- The broader walk remains limited to phases currently reachable on the demo Move.
- The preceding overall measured UX score was 87/100; the 90-point target remains open due to performance and dark contrast.
