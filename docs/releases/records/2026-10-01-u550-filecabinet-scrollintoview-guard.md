# 2026-10-01-u550-filecabinet-scrollintoview-guard — Guard the Moves review-panel scroll and cancel its frame

## Release ID

`2026-10-01-u550-filecabinet-scrollintoview-guard`

## Status

`candidate`

## Plain-English Summary

When a reviewer opens a document review in the Moves File Cabinet, the panel schedules one
animation frame that scrolls the review section into view. That code checked that the panel
existed but not that the browser provides `scrollIntoView`, and it never cancelled the frame
when the review closed or the panel unmounted.

jsdom does not implement `scrollIntoView`, so the existing evidence-review suite failed or passed
depending on whether that frame fired before test teardown. It failed once in the "Unit suites
that pass on main" job and passed on rerun.

The component now checks for the method before calling it and cancels the pending frame in the
effect cleanup. The scroll behaviour in a real browser is unchanged.

## Layer Impact

Release lane: `global-control-lane` — a shared Moves component, all clients, no flag.

- **Layer 4 (Products / Moves) only.** One effect in
  `src/components/strategic-moves/FileCabinetPanel.tsx`. No route, schema, adapter, prompt,
  data-plane object or canonical model is touched.
- One new test suite, wired into the existing "Run the Moves evidence revision suites" step of
  `.github/workflows/unit-suites.yml`, which names its suites by path.

## Client Applicability

- All clients: no visible change. Browsers that implement `scrollIntoView` scroll exactly as
  before; ones that do not no longer throw from an animation frame.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/FileCabinetPanel.tsx` — guard the method, cancel the frame.
- `src/components/strategic-moves/__tests__/FileCabinetPanel.scroll-into-view.test.tsx` (new,
  3 cases) — runs the animation frame deterministically instead of leaving it to the scheduler.
- `.github/workflows/unit-suites.yml` — one path added to the existing Moves step.

## QA / Validation

Fail-first, on `origin/main` `18480bbe7a` with only the new suite added: **2 of 3 failing**
(`TypeError` from the missing method; frame still pending after unmount). After the fix: **3 of 3
passing**.

Mutations, each confirmed to change the file before running:

| mutation | result |
|---|---|
| method guard reduced to a ref check | 1 of 3 fails |
| frame cancellation removed | 1 of 3 fails |
| scroll call removed | 1 of 3 fails |

The full "Moves evidence revision suites" step locally, after the change: 9 suites / 85 tests,
0 failing, three consecutive runs (8 suites before, with the new one absent).

- `npx eslint` on both changed source files: exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: exit 0.

## Rollout Plan

Merge to `main` through the repo-owned squash path. The component change ships in the next image
built by the main deploy workflow. No flag, environment variable, migration or data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as for any
  commit.
- Shared runtime mutators: none.
- Approved image digest: whatever the post-merge deploy run produces; this release adds no
  runtime configuration.
- ACA runtime invariant: the post-merge deploy run is read and the template digest compared with
  the 100%-traffic revision digest, as a routine check.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: **No.** Every supported browser implements `scrollIntoView`, so
  the rendered behaviour of opening a review is identical before and after; the change only
  affects environments that lack the method, and test teardown.

## Rollback Plan

Revert the squash commit. The effect returns to the unguarded, uncancelled call; nothing
persisted depends on it. No migration, no data change, no flag.

## Known Gaps

- The original flake was observed once in CI and never reproduced locally; the new suite makes
  the failing path deterministic rather than waiting for it to recur.
- Other components may schedule `scrollIntoView` in uncancelled frames; this change does not
  survey them.

## Audit Evidence

- Backlog item U-550.
- The PR's CI run of `unit-suites.yml`, which now includes the new suite.
