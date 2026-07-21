# 2026-07-21-home-relationship-graph-reactflow — Home Relationship Graph: React Flow rebuild + connectivity bug fix

## Release ID

`2026-07-21-home-relationship-graph-reactflow`

## Status

`candidate`

## Plain-English Summary

Replaces the custom-SVG relationship graph (shipped in `#5208`) with a real graph rendered by React Flow (`@xyflow/react`) + `dagre` auto-layout, per direct instruction after live review: the custom SVG rendered node dots with zero visible connecting lines once merged.

That review caught a real, confirmed bug, not just a preference: `RelationshipTopologyGraph` independently ranked "from" nodes and "to" nodes by degree and only kept edges where BOTH endpoints happened to be in their own top-10 — with 510 distinct source entities and 657 distinct targets for Meridian, that intersection was empty in production. `document.querySelector(...).querySelectorAll('circle').length` returned 20 (nodes rendered); `.querySelectorAll('path').length` returned 0 (zero edges rendered). The graph looked like disconnected dots.

Fixed by rebuilding the node/edge selection to guarantee connectivity by construction: rank sources by out-degree, take the top N, include every real edge FROM those sources, then rank targets only among that already-connected edge set (never independently). If capping targets orphans a source, drop that source too. Every rendered node now provably has at least one rendered edge — covered by a dedicated regression test (`buildRelationshipTopology.test.ts`).

## Layer Impact

- `global-control-lane`: Adds two new npm dependencies (`@xyflow/react`, `@dagrejs/dagre`) and rebuilds one component (`RelationshipTopologyGraph` inside `HomeKnowledgeDesignContractSurface.tsx`). No API, schema, or data-shape change — same `HomeRelationshipEdge[]` input as before.

## Client Applicability

- All clients: same as the parent PR (`#5208`) — the Home Knowledge cockpit route, currently reached only by tenants with an approved Home design-contract pack (Meridian today).
- Feature flag: none.

## Changes Included

- `package.json` / `package-lock.json`: adds `@xyflow/react@^12.11.2` and `@dagrejs/dagre@^3.0.0`.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: replaces the custom-SVG `RelationshipTopologyGraph` with a React Flow + dagre implementation. Extracts the node/edge-selection logic into an exported, independently-testable `buildRelationshipTopology()` function with the connectivity-guarantee fix described above.
- `src/components/home/__tests__/buildRelationshipTopology.test.ts` (new): 5 tests — empty input, every source node has a visible edge, every target node has a visible edge (a synthetic reproduction of the shape that broke the old algorithm), honest subset-count reporting when capped, and dagre-assigned (non-collapsed) node positions.

## QA / Validation

Run in an isolated `git worktree` off fresh `origin/main`, with a **real (non-symlinked) `npm install`** rather than the usual shared `node_modules` symlink — required because this candidate changes `package.json`/the lockfile, and a symlinked `node_modules` wouldn't produce an accurate lockfile diff or let a real build run:

- `npx eslint` on all touched/new files — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — 0 errors.
- **`NODE_OPTIONS='--max-old-space-size=8192' npx next build` — ran successfully to completion (exit 0), full route manifest generated.** This is the direct verification the prior candidate (`#5208`) was missing: `tsc --noEmit` never catches client/server bundling issues, only an actual build does (that gap is exactly what let the `node:fs`-in-a-client-bundle bug from the prior release ship past local checks and get caught only by CI). Confirmed via a genuine build this time, not just static import-graph inspection.
- `npx jest src/lib/home src/components/home` — 203 passed / 55 failed / 258 total, verified via exact-failing-test-name diff against a **freshly rebuilt baseline off the current `origin/main`** (the previous baseline was stale — main has moved since `#5208` merged): **0 new failures, 0 fixed** (this candidate doesn't touch anything in the 55 pre-existing failures' path).
- 5 new unit tests, including a synthetic reproduction of the exact shape that produced the zero-edge bug (many high-out-degree sources fanning out to unique low-degree targets, plus many low-out-degree sources converging on a few high-in-degree targets) — asserts every rendered node now has a rendered edge.
- Live signed-in browser proof: not yet run for this candidate specifically (the prior custom-SVG version was live-verified and confirmed broken by the same review that triggered this rebuild).

## Rollout Plan

Open PR from this candidate; merge through the normal protected `main` lane; deploy through the repo-owned ACA main deploy workflow. After deploy, live-verify the Relationships dimension for Meridian renders visible connecting lines between source and target nodes, not just node dots.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this candidate.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. `RelationshipTopologyGraph` is the only consumer of the new dependencies; reverting removes both the dependency and the only code that imports it. No data or migration rollback needed.

## Audit Evidence

- Local command output above, including the successful `next build` log.
- Live DOM inspection confirming the prior bug: `circleCount: 20, pathCount: 0` on the deployed `#5208` version, captured via browser devtools query against `app.abarva.ai`.

## Known Gaps

- Live signed-in browser screenshot of this specific rebuild not yet captured — recommend running immediately after deploy, specifically checking that connecting lines are visible (not just node boxes), since that's the exact defect this candidate fixes.
- The graph still only shows a capped subset (top 8 sources / top 14 targets by connectivity) for readability — full-graph exploration across all 2,642 edges is not in scope here. React Flow's built-in pan/zoom controls are included, but the node set is pre-filtered client-side before rendering, not dynamically expandable yet.
