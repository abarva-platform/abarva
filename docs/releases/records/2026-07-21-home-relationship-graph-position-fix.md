# 2026-07-21-home-relationship-graph-position-fix — Fix: React Flow graph rendered zero edges

## Release ID

`2026-07-21-home-relationship-graph-position-fix`

## Status

`candidate`

## Plain-English Summary

`#5215` rebuilt the Home Knowledge relationship graph with React Flow + dagre, fixed and merged, then deployed. Live signed-in check immediately after deploy found it still broken: 22 node boxes rendered, but zero connecting lines (`.react-flow__node` count 22, no `.react-flow__edge-path` elements anywhere in the DOM, only the arrow marker definition).

Root cause: the graph's nodes never set `sourcePosition`/`targetPosition`. React Flow's default node handles point Top (target) and Bottom (source) — correct for a vertical flow, wrong for this graph's left-to-right dagre layout (`rankdir: "LR"`). Every official React Flow + dagre example sets `sourcePosition`/`targetPosition` explicitly to match the layout direction; omitting this is a known integration mistake, and in this case it caused React Flow to silently drop every edge during its internal render pass rather than draw a badly-angled one.

Fixed by setting `sourcePosition: Position.Right` / `targetPosition: Position.Left` on every node, matching the LR layout.

## Layer Impact

- `global-control-lane`: One component fix, no new dependency, no data-shape change.

## Client Applicability

- All clients: same as `#5215` — reaches tenants with an approved Home design-contract pack (Meridian confirmed; more tenants landed via a separate commit shortly before this one).

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: adds `sourcePosition`/`targetPosition` to every node built by `buildRelationshipTopology()`.
- `src/components/home/__tests__/buildRelationshipTopology.test.ts`: adds a regression test asserting every node carries the correct `Position.Right`/`Position.Left` values.

## QA / Validation

**Note on process:** this candidate exists because the previous one (`#5215`) was declared "fully live and verified" after passing typecheck, a real `next build`, and 28/28 CI checks — none of which caught this, because it's a runtime rendering behavior specific to React Flow's internal edge/handle resolution, not a compile-time or bundling concern. The bug was only found by actually looking at the live page and querying the rendered DOM. This candidate's evidence below is held to the same standard plus one more: the live DOM check that caught the bug in the first place, repeated after the fix.

Run in a fresh isolated `git worktree` off `origin/main` (which already includes `#5215`), with a real (non-symlinked) `npm install`:

- `npx eslint` — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — 0 errors.
- `NODE_OPTIONS='--max-old-space-size=8192' npx next build` — succeeded (exit 0), full route manifest generated.
- `npx jest src/lib/home src/components/home` — 209 passed / 54 failed / 263 total, exact-failing-test-name diff against a freshly rebuilt baseline off the exact same `origin/main` commit: **0 new failures**.
- 1 new unit test asserting `sourcePosition`/`targetPosition` are set correctly on every node (a unit test can't render actual SVG paths in jsdom, so this guards the specific field the bug traced to, not full rendering behavior).
- **Not yet done**: live DOM re-check after this deploys. This is the step that actually matters for this specific bug and must happen before this is called fixed — recommend querying `.react-flow__edge-path` (or equivalent) count > 0 on the deployed Relationships dimension for Meridian, the same check that caught the original defect.

## Rollout Plan

Open PR from this candidate; merge through the normal protected `main` lane; deploy through the repo-owned ACA main deploy workflow. **After deploy, do not report this as fixed until the live DOM check confirms visible edges** — this exact release record's own prior candidate was reported live-verified when it wasn't.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — and specifically, DOM-level proof of rendered edges, not just page-load success.

## Rollback Plan

Revert the PR. Two-line change, fully additive (adds fields to existing node objects), no data or migration rollback needed.

## Audit Evidence

- Local command output above, including the successful `next build` log.
- Live DOM inspection of the broken state, captured via browser devtools query against `app.abarva.ai` immediately after `#5215` deployed: `.react-flow__node` count 22, `.react-flow__edge-path`/`.react-flow__edge` count 0, `.react-flow__edges` container HTML containing only the arrow marker `<defs>`, no edge elements.

## Known Gaps

- Live post-deploy DOM verification not yet run (this is the load-bearing verification step for this specific fix — see QA section).
