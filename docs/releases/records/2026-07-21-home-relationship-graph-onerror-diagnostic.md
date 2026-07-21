# 2026-07-21-home-relationship-graph-onerror-diagnostic — Diagnostic: wire React Flow onError

## Release ID

`2026-07-21-home-relationship-graph-onerror-diagnostic`

## Status

`candidate`

## Plain-English Summary

Two prior attempts to fix the Home relationship graph (`#5215` React Flow rebuild, `#5224` node-position fix) were each independently declared verified — real production builds, full CI, exact-diff test comparisons — and each was still broken when actually checked live: 22 node boxes render, zero connecting edges. Neither typecheck, bundling, nor CI catches this because it's a runtime behavior inside React Flow's internal edge/handle resolution.

Rather than attempt a third speculative fix, this candidate wires `@xyflow/react`'s built-in `onError` callback, which fires for exactly this class of internally-caught, silently-dropped-edge condition (React Flow has specific internal error codes for "couldn't create edge for source/target handle") in both development and production, unlike console warnings which are often dev-only. This is a diagnostic-only change: it adds no fix, just visibility, so the next attempt is grounded in the actual error code and message React Flow reports, not another guess.

## Layer Impact

- `global-control-lane`: 8-line additive change, no behavior change, `console.error` only fires if React Flow itself reports an internal error.

## Client Applicability

- All clients reaching the Home Knowledge Relationships dimension.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: adds `onError` to the `<ReactFlow>` instance in `RelationshipTopologyGraph`, logging the error code, message, and current node/edge counts to the console.

## QA / Validation

- `npx eslint` — pass (clean).
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — pass (0 errors).
- `NODE_OPTIONS='--max-old-space-size=8192' npx next build` — pass (exit 0).
- Unit tests — not-run: this is a diagnostic instrumentation change (adds a console.error inside an onError callback) with no logic branch to unit test.
- Live signed-in browser check reading the actual console error output — not-run yet; this is the point of the candidate, to be done immediately after deploy as the next step.

## Rollout Plan

Merge and deploy through the normal lane. After deploy, load the live Relationships dimension for Meridian, check the browser console for a `[nkh-topology react-flow error]` entry, and use that to write the actual fix as a follow-up PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — reading the console output IS the proof for this candidate.

## Rollback Plan

Revert the PR. Purely additive diagnostic logging, no behavior change to roll back.

## Audit Evidence

- Live DOM inspection from the two prior attempts, both showing `.react-flow__node` count 22, `.react-flow__edge-path` count 0.

## Known Gaps

- This does not fix the graph. It exists solely to stop guessing and get a real error signal for the next fix.
