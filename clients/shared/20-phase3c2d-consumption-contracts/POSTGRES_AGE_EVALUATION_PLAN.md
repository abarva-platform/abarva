# PostgreSQL AGE Evaluation Plan

Status: evaluation contract only. Apache AGE is not required for the first Airline Demo New or Healthcare Demo New Knowledge Baseline.

## Decision

Keep Azure PostgreSQL relational graph tables as the canonical graph substrate. Evaluate Apache AGE only as a read-side acceleration layer if measured traversal needs exceed what indexed relational SQL and recursive CTEs can support cleanly.

AGE must never become the source of truth for tenant facts, relationship evidence, metric values, source lineage, publication state, or product authorization. If adopted later, AGE consumes an approved projection from `consumption.relationship_node_v1`, `consumption.relationship_edge_v1`, and `consumption.relationship_evidence_v1`.

## Why this is not P0

The immediate product risk is graph semantics and consumption certification, not graph-engine capacity:

- relationship endpoints must resolve to canonical objects;
- relationship types must be normalized;
- evidence and owner coverage must be visible;
- cross-tenant edges must be blocked;
- stale, candidate, withheld, not-measured and conflicting states must survive to Home, Cube and aVa.

Adding AGE before those gates pass would make weak or synthetic relationships easier to traverse and harder to govern.

## Current scale assumption

The expected first synthetic enterprise baselines are within relational Postgres territory:

- Healthcare Demo New: roughly tens of thousands of relationship edges after validation.
- Airline Demo New target: roughly tens of thousands of relationship edges after remediation.
- A real 50B+ enterprise pilot may reach hundreds of thousands to low millions of edges after applications, integrations, data products, contracts, processes, controls and owners are loaded.

These volumes do not by themselves justify AGE. The deciding factor is traversal shape and latency, not row count.

## Candidate AGE use cases

Evaluate AGE when users need repeated, variable-depth traversals such as:

- blast radius: system -> integration -> data product -> process -> owner -> control;
- AI use case dependency path: use case -> process -> data product -> source system -> platform -> vendor -> contract;
- vendor concentration: vendor -> contracts -> applications -> functions -> risks -> outcomes;
- lineage chains across application, database, BI, metric and executive decision objects;
- shortest paths between a transformation program and blocked evidence or ownership gaps.

AGE is not needed for one-hop adjacency, filtered relationship maps, Home dimension summaries, Cube metrics, or deterministic top-N dependency cards.

## Evaluation thresholds

Run the AGE proof only if at least one threshold is breached on the relational path:

| Gate | Threshold |
|---|---|
| p95 traversal latency | Greater than 750 ms for approved 2-4 hop paths with tenant filter and warm cache |
| query complexity | Recursive SQL becomes too fragile to maintain across three or more product consumers |
| result size | More than 5,000 candidate paths require server-side graph pruning before UI/API consumption |
| workload isolation | Graph traversal load materially impacts baseline Home/API/Cube response budgets |
| graph algorithms | shortest path, path expansion or centrality becomes a product requirement rather than an analyst-only audit |

## Azure readiness checks

Before any AGE implementation PR, prove:

- the target Azure Database for PostgreSQL Flexible Server version supports AGE in the selected region;
- `azure.extensions` and `shared_preload_libraries` can enable AGE without replacing the database version;
- extension creation is permitted under the managed identity / admin model;
- backup, restore, point-in-time recovery and failover are tested with AGE enabled;
- RLS and tenant isolation remain enforced before data reaches AGE projection queries;
- the extension is supported in the private client data-plane SKU, not only the shared lab server.

## Shadow projection approach

If adopted, use this order:

1. Keep canonical nodes and edges in relational Knowledge / consumption tables.
2. Add an inactive `graph_projection.age_graph_snapshot_v1` manifest with baseline refs and content hashes.
3. Project only accepted, tenant-scoped, source-backed graph slices into AGE.
4. Compare AGE traversal output with relational traversal output for the same query pack.
5. Activate only read-side APIs whose answers are parity-proven and faster.
6. Keep last-known-good relational traversal available as fallback.

## Certification query pack

The first AGE proof must compare relational SQL vs AGE for:

- 25 two-hop dependency questions;
- 25 three-to-four-hop dependency questions;
- 10 sparse/missing relationship questions;
- 10 cross-tenant negative tests;
- 10 stale/superseded relationship tests;
- 10 large-result pruning tests.

Acceptance requires same business answer, same tenant fence, same evidence boundary, and same availability-state handling. Faster traversal alone is not acceptance.
