# Neo4j Deprecation Plan

Status: Phase A in flight as of 2026-05-15
Owner: Platform / Graph
Related: `ADR-006-graph-layer-strategy.md`, `CURRENT-STATE.md`

## Context

Neo4j has been carried in the repo as driver code (`neo4j-driver`) plus
Cypher migrations (`db/graph/migrations/*.cypher`), but it is NOT the
real system of record for the relationship graph. The live graph is in
Postgres:

| Table                       | Count |
| --------------------------- | ----: |
| `enterprise_graph_nodes`    | 1,313 |
| `enterprise_graph_edges`    | 1,568 |

The Azure lab Neo4j resource has been reporting `neo4j=false` on
`/api/health` since the parallel-run cutover and is on the path to
deletion. This document captures the three-phase plan to remove it
cleanly.

## Phase A — Gate off (this PR)

The PR `chore(graph): gate Neo4j behind graph_neo4j_enabled flag
(default off)` ships:

- New feature flag `graph_neo4j_enabled` in `src/lib/features/registry.ts`
  (tenant-policy, `includeTenants: []`, default OFF for everyone).
- New gate helper `src/lib/graph/neo4j-gate.ts`
  (`isNeo4jEnabled`, `setNeo4jEnabledOverride`, `logNeo4jSkipped`).
- New driver factory entry points in `src/lib/graph/driver.ts`:
  - `getGraphDriverIfEnabled()` — async, returns `null` when gated off,
    dynamic-imports `neo4j-driver` only when gated on.
  - `withGraphSession(callSite, fn, fallback)` — preferred wrapper.
  - `Neo4jDisabledError` — thrown by the legacy sync `getGraphDriver()`
    when the gate is off so call sites can catch and degrade.
- Every call site refactored so the `neo4j-driver` import only happens
  inside the gated execution path. No connection is attempted at boot.
- `/api/health` reports `neo4j: 'skipped'` (not `'fail'`) when the flag
  is off; `allOk` no longer requires Neo4j to be true.
- Regression test in `src/__tests__/features/neo4j-gate.test.ts`.

After Phase A merges, the Azure Neo4j resource can be deleted without
app crashes.

### Gated call sites (Phase A)

| File                                                     | Fallback shape                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/graph/retrieval.ts` (7 entry points)            | `[]` for list shapes; `null` for `getGenomePatternDetail` / sponsor    |
| `src/lib/graph/reasoning.ts` (6 entry points)            | `null` for single-row results; `[]` for list results                   |
| `src/lib/graph/mutations.ts` (`syncPersonToGraph`)       | `undefined` (no-op; Postgres holds the row)                            |
| `src/lib/graph/engagement-sync.ts` (`syncEngagementToGraph`) | `undefined` (no-op; Postgres holds the row)                        |
| `src/lib/agent/pattern-trigger.ts` (`writeTriggerEdge`)  | `undefined` (no-op; Postgres `enterprise_graph_edges` is canonical)    |
| `src/lib/intelligence/genome-query-broker.ts`            | `200` with `rows: []` and an "OFF — broker summary stands in" hint     |
| `src/lib/intelligence/pattern-deliverable-query.ts`      | Existing seed-manifest citation fallback (already in place pre-PR)     |
| `src/app/api/health/route.ts` (Neo4j probe)              | `'skipped'` (not `false` / `error`)                                    |
| `src/scripts/query-graph.ts`                             | Operator override: `setNeo4jEnabledOverride(true)` at script entry     |
| `src/scripts/migrate-graph.ts`                           | Operator override: `setNeo4jEnabledOverride(true)` at script entry     |
| `src/scripts/seed/peer-contradictions-expansion.ts`      | Operator override: `setNeo4jEnabledOverride(true)` at script entry     |
| `src/scripts/audit/audit-tenant-data-planes.ts`          | Honours flag — when off the Neo4j plane is "skipped" in the report     |

## Phase B — Delete Azure resource (~1 week soak)

Preconditions:

- Phase A merged and deployed to production with `graph_neo4j_enabled`
  staying empty in `includeTenants`.
- `/api/health` returns `neo4j: 'skipped'` in every environment.
- Pilot tenants (Apex Retail, Meridian Health, First Capital Financial)
  show no regression for 7 days across:
  - Intelligence brief assembly (pattern detail, peer decisions, cross-
    client learning)
  - Sentinel genome-query path
  - Pattern↔deliverable citation rendering
  - Engagement turn writes
  - Programs gate evaluation

Actions:

- Delete the Azure Neo4j resource (Container App / VM, whichever is
  live in `abarva-lab-sub`).
- Remove `NEO4J_*` from Key Vault projection / Container Apps secrets.
- Confirm Postgres-only execution still passes the same per-tenant
  smoke set listed above.

## Phase C — Remove driver dep + retire Cypher migrations

Actions:

- Delete `src/lib/graph/driver.ts`, `src/lib/graph/retrieval.ts`,
  `src/lib/graph/reasoning.ts`, `src/lib/graph/mutations.ts`,
  `src/lib/graph/engagement-sync.ts`, `src/lib/graph/neo4j-gate.ts`,
  `src/scripts/query-graph.ts`, `src/scripts/migrate-graph.ts`.
- Inline the Postgres traversal helpers everywhere the gate today
  returns a fallback (most callers already tolerate the empty shape;
  the ones that depend on a real graph result need Postgres-backed
  helpers — see "Open follow-ups" below).
- Remove `neo4j-driver` from `package.json`.
- Move `db/graph/migrations/*.cypher` to `docs/legacy/graph-cypher-migrations/`
  for historical reference. They are NOT deleted — the schema they
  describe is still useful documentation for the Postgres edge types.
- Remove the `graph_neo4j_enabled` flag from
  `src/lib/features/registry.ts`.
- Drop the architecture test references that allowlist `neo4j` as a
  provider kind once we have Cosmos Gremlin or stay on
  `postgres_relationship_fallback` only.

## Open follow-ups

These call sites accept an "empty graph result" gracefully today but
should be backed by real Postgres traversal helpers before any tenant
genuinely depends on them:

- `getPeerDecisionsForPhase`, `getActivePatterns`, `getChainedPatterns`,
  `getSimilarEngagements`, `getAllGenomePatterns`,
  `getGenomePatternDetail`, `getSponsorContext` — peer / pattern /
  sponsor queries currently return `[]` / `null` when the gate is off.
  The Postgres `enterprise_graph_*` tables have the data; we just don't
  yet have a JOIN-based traversal helper to project it back into these
  view-model shapes.
- `runBrokeredGenomeQuery` — the broker summary stands in for the
  Cypher execution result. A Postgres-backed query translator is the
  longer-term replacement.

These are tracked as follow-ups, not Phase A blockers, because every
caller already tolerates `[]` / `null` and the broker bundle continues
to ship the graph neighborhood summary on the side.

## AzLAB references to update

These AzLABs still reference Neo4j and need updates as part of Phase B
or Phase C so the lab documentation stays accurate:

- `AZLAB-SEQUENCING-ROADMAP.md` — graph-provider sequencing.
- `AZLAB17-azure-native-graph-foundation.md` — Cosmos Gremlin as the
  forward path; Neo4j section becomes "historical compatibility".
- `ADR-006-graph-layer-strategy.md` — Neo4j drops from "supported
  provider" to "removed (Phase C)".
