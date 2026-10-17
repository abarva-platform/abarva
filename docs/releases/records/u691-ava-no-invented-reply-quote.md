# u691 — aVa no longer quotes a question nobody asked

## Release ID

`2026-10-17-moves-ava-no-invented-reply-quote`

## Status

`candidate`

## Plain-English Summary

On every Moves phase, the aVa panel opened with an "In reply to" quote: "Ask about the current charter step for <Move>." That quote was a fixed string written into the workspace. Nobody had asked it. It named the charter step on every phase, including P0, P2 and P3, where the current step is not a charter step. And aVa's first message under it is the step's own opening briefing, not a reply to anything.

A quote labelled "In reply to" tells the reader someone asked that question. The workspace no longer supplies one. aVa opens on the step's briefing, and the dock still shows a quote wherever another surface passes a real one. The Move's name was only used to build that sentence, so it is no longer passed to the workspace.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4, products (Moves aVa panel):** one quote removed, and one unused prop removed. No data, route or behaviour change.

## Client Applicability

- **All clients:** yes, wherever the Moves capture workspace is shown.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none.

## Changes Included

- `src/components/strategic-moves/MovesCaptureWorkspace.tsx`: no `initialQuote`; the `moveName` prop is removed.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: stops passing `moveName` to the workspace.
- `src/components/strategic-moves/__tests__/MovesCaptureWorkspace.test.tsx`: the dock mock now exposes `initialQuote`, which it used to drop. A test checks it is empty on P0 to P5.
- `src/components/strategic-moves/__tests__/moves-capture-composer-streaming.test.tsx`: drops the removed prop.

## QA / Validation

- Workspace suite: pass, 11 / 11. Strategic-moves suites: pass, 74 suites, 1458 tests.
- Mutation testing: 1 / 1 killed. Restoring the fixed quote fails all six phase cases.
- `npm run typecheck`: pass. ESLint: pass. `npm run release:check`: pass (exit 0).

## Rollout Plan

Ships in the next repo-owned ACA main deploy. The post-deploy walk's screenshots show the aVa panel without the quote.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's step-page screenshots.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **No real reply context replaces the quote.** When a person asks aVa something, the thread itself shows the question; the dock does not repeat it as a quote.

## Audit Evidence

- PR URL and CI run; the live walk's aVa panel before the change.
