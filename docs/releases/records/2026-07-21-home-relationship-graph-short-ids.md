# 2026-07-21-home-relationship-graph-short-ids — Fix: use short synthetic ids, not raw entity names, for React Flow node/edge identity

## Release ID

`2026-07-21-home-relationship-graph-short-ids`

## Status

`candidate`

## Plain-English Summary

Three attempts at the Home relationship graph shipped before this one: `#5215` (React Flow rebuild), `#5224` (node-position fix), `#5228`/`#5230` (diagnostics). Each of the first two was independently declared verified and each was still broken live: 22 node boxes, zero connecting edges. The diagnostics finally found the real cause with hard evidence, not another guess.

`onError` (`#5228`) never fired — this bug isn't one of React Flow's recognized error conditions. `onInit` (`#5230`) then read React Flow's actual internal store and found `internalEdgeCount` correctly matched `propsEdgeCount` (14 of 14) — the data reached React Flow intact. But the edge's `id`/`source`/`target` values were themselves the bug: `RelationshipTopologyGraph` used the raw entity name as the node id (`source:${name}` / `target:${name}`). The derived relationship graph's "to" values can be full executive-interview-quote sentences — one captured example was 270+ characters with slashes, colons, commas, and periods. Using that verbatim as a React Flow id broke the internal DOM lookups React Flow uses to resolve each edge's endpoint handle position -- silently, with no error surfaced anywhere.

Fixed by generating short, safe, opaque ids (`source-0`, `target-0`, ...) for every node, keyed by name via a `Map`, and using those same short ids for every edge's `source`/`target`/`id`. The real name now lives only in `data.label` (truncated for display) and `data.fullName` (untruncated, for a future tooltip) — never in anything React Flow uses for identity/lookup.

Also removes the `onInit` diagnostic (`#5230`) now that it's answered its question — a full internal-state dump on every graph mount is not appropriate for permanent production code. Keeps `onError` (`#5228`), since it's genuinely useful low-noise defensive instrumentation for the future.

## Layer Impact

- `global-control-lane`: Contained change to `buildRelationshipTopology()`'s node/edge id generation. No data-shape, API, or dependency change.

## Client Applicability

- All clients reaching the Home Knowledge Relationships dimension.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: `buildRelationshipTopology()` now builds `sourceIdByName`/`targetIdByName` maps (name → short synthetic id) and uses those ids for node `id` and every edge's `id`/`source`/`target`. The real name moves to `data.label`/`data.fullName`. Removes the `onInit` diagnostic block added in `#5230`; keeps `onError`.
- `src/components/home/__tests__/buildRelationshipTopology.test.ts`: updates the two existing id-prefix assertions (`"source:"`/`"target:"` → `"source-"`/`"target-"`, matching the new format). Adds a new regression test reproducing the exact live failure shape — a 270-character quote-sentence target name with slashes/colons/commas/periods — asserting every node/edge id stays short (`<20`/`<40` chars) and matches a safe `^(source|target)-\d+$` pattern, and never contains the raw long name.

## QA / Validation

Run in a fresh isolated `git worktree` off current `origin/main` (includes `#5215`, `#5224`, `#5228`, `#5230`), with a real (non-symlinked) `npm install`:

- `npx eslint` — pass (clean).
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — pass (0 errors).
- `NODE_OPTIONS='--max-old-space-size=8192' npx next build` — pass (exit 0).
- `npx jest src/components/home/__tests__/buildRelationshipTopology.test.ts` — pass (7/7, including the new long-name regression test).
- `npx jest src/lib/home src/components/home` — pass: 210 passed / 54 failed / 264 total, exact-failing-test-name diff against a freshly rebuilt baseline off the exact same `origin/main` commit: 0 new failures.
- Live signed-in browser DOM check after deploy — not-run yet; this is the definitive proof for this candidate given the last two "verified" attempts were both wrong. Must confirm `.react-flow__edge-path` count > 0 on the deployed Relationships dimension before this is called done, not just that CI/build passed.

## Rollout Plan

Merge and deploy through the normal lane. **After deploy, run the exact same live DOM check used to catch the original bug** (`.react-flow__node` count, `.react-flow__edge-path` count) on the Relationships dimension for Meridian before reporting this as fixed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — DOM-level edge-path count, not just page-load success.

## Rollback Plan

Revert the PR. Contained change to id generation inside one function; reverting restores the prior (broken) behavior exactly, no data or migration rollback needed.

## Audit Evidence

- Live `onInit` console capture from the deployed `#5230` candidate, showing `internalEdgeCount: 14` matching `propsEdgeCount: 14` and the actual long-form edge id/source/target values that caused the failure (captured via console interception, included in this PR's description).
- Live DOM checks from the two prior "verified but still broken" attempts (`#5215`, `#5224`), both showing `.react-flow__node` count 22, `.react-flow__edge-path` count 0.

## Known Gaps

- Not yet live-verified. Given the history on this exact bug, no claim of "fixed" should be made until the live DOM check runs and shows a non-zero edge-path count.
