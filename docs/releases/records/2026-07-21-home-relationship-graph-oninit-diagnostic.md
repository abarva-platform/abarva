# 2026-07-21-home-relationship-graph-oninit-diagnostic — Diagnostic: read React Flow's internal store via onInit

## Release ID

`2026-07-21-home-relationship-graph-oninit-diagnostic`

## Status

`candidate`

## Plain-English Summary

Follow-up to `#5228` (which wired `onError` and confirmed it never fires — this bug isn't one of React Flow's recognized error conditions). This candidate adds `onInit`, which receives the live `ReactFlowInstance` after mount and lets us read `instance.getNodes()`/`instance.getEdges()` directly — the graph's actual internal state, not just the props we passed in. If internal edge count is 0 despite props edge count being non-zero, the props never made it into the store (a wiring bug on our side). If internal edge count matches props but still renders nothing, the bug is in React Flow's rendering of a correctly-stored edge (a library/compat issue, e.g. with React 19).

Diagnostic only — still no fix. This is meant to narrow the search space with real evidence: local dev debugging was attempted (signed in successfully via the demo-invite flow) but blocked by an unrelated pre-existing local-dev gap (the Responsible AI acknowledgment gate is permanently disabled locally because it depends on live Postgres connectivity this sandbox doesn't have) — so production is genuinely the only place this can be observed for now, hence adding a second round of instrumentation rather than a third blind fix.

## Layer Impact

- `global-control-lane`: ~20-line additive change, no behavior change. `console.error` only, gated inside `onInit`, fires once per graph mount.

## Client Applicability

- All clients reaching the Home Knowledge Relationships dimension.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: adds `onInit` to the `<ReactFlow>` instance in `RelationshipTopologyGraph`, logging props vs. internal node/edge counts, the first internal edge object, the first internal node's measured dimensions and source/target position, and the current viewport.

## QA / Validation

- `npx eslint` — pass (clean).
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — pass (0 errors).
- `NODE_OPTIONS='--max-old-space-size=8192' npx next build` — pass (exit 0).
- Unit tests — not-run: diagnostic instrumentation only, no logic branch to test.
- Live signed-in browser console read — not-run yet; this is the point of the candidate.

## Rollout Plan

Merge and deploy through the normal lane. After deploy, load the live Relationships dimension for Meridian, read the `[nkh-topology onInit]` console entry, and use the internal-vs-props comparison to write the actual fix.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — reading the console output IS the proof for this candidate.

## Rollback Plan

Revert the PR. Purely additive diagnostic logging.

## Audit Evidence

- `#5228`'s `onError` deployed and confirmed silent (no console entry) against the same live failure (22 nodes, 0 edge-path elements) on the current production build.

## Known Gaps

- Still does not fix the graph. Local dev debugging remains blocked by the Responsible AI acknowledgment ledger's Postgres dependency -- a separate, pre-existing local-dev gap worth its own fix at some point, not addressed here.
