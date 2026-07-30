# Knowledge Graph Binding Contract — Relationships mode, airline-demo-new

Scope: the Relationships mode's graph canvas, node/edge drawers, hop controls, candidate toggle and
current/target overlay, as implemented in the prototype's `buildGraph()` / `GRAPHS` constant
(`xdc-script.js` lines ~190-283, ~686-770). Cross-references: `GAP-##` = the gap register;
`SD-##` = `semantic-defects.csv`.

Governing rule from AGENTS.md's V6 graph substrate guidance, restated because it binds this whole document:
**Postgres owns the governed graph substrate; graph engines and visual libraries consume clean slices, they do
not define the source of truth.** Nothing below proposes a graph database. The physical substrate is
`consumption.relationship_node_v1` / `consumption.relationship_edge_v1` / `consumption.relationship_evidence_v1`,
all already registered in `CONSUMPTION_PROJECTION_REGISTRY.json`.

---

## 1. Node field requirements

| Field                     | Status today                                                               | Required for the UI                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node_id`                 | Present (implied by 34,534 populated node rows)                            | Stable, typed, per Enterprise IA's "every object has a stable, typed ID" rule                                                                                                                                                                                                                                                                                                                                                                                          |
| `label`                   | Present                                                                    | Human-readable display text                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `node_type`               | Present, but prototype vocabulary is broader than the canonical dictionary | Must map to a real Enterprise IA Layer-3 object type (Application/Vendor/Metric/Risk/Program/Platform/Tool/AIUseCase/etc.). The prototype's own pseudo-types — `Goal`, `Aggregate`, `Workflow`, `Open gap`, `Current`, `Domain` — are UI framing labels, **not** canonical object types, and must be resolved to a real backing object or explicitly declared as a UI-composite node type in a follow-up ratification, not silently rendered as if they were canonical |
| `focal` flag              | UI-only, fine as client state                                              | No canonical requirement                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `authority_state`         | Present at the assertion level                                             | Drives solid (accepted) vs dashed (candidate) rendering                                                                                                                                                                                                                                                                                                                                                                                                                |
| `endpoint_catalog_backed` | **Missing**                                                                | New field (registry amendment #10) — `false` for any node whose source object_type has no ID-backed catalog (today: `capability`, `service_tower` origin objects per SD-08/SD-14)                                                                                                                                                                                                                                                                                      |
| `state_scope`             | **Missing**                                                                | New field (registry amendment #10) — `current` \| `target`, required for the current/target overlay (Section 5)                                                                                                                                                                                                                                                                                                                                                        |

**Node render gate:** a node may render as an ordinary clickable, evidence-bearing node only if `node_type`
resolves to a real canonical object type **and** `endpoint_catalog_backed = true`. A node that fails either
check must render, if shown at all, with a visually distinct "unverified" treatment — never identical to an
accepted node.

## 2. Edge field requirements

| Field                                  | Status today                                                                                                                                                                                      | Required for the UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `from_node_id`, `to_node_id`           | Required per field contract; "endpoint must exist in relationship_node_v1" is already the stated guidance                                                                                         | Both must resolve — the field contract already states this rule, it must simply be enforced                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `relationship_type_ref`                | Present as a controlled dictionary at the raw-relationship-load level (19 types in perfectly uniform 3,000/6,000-row buckets — "a controlled dictionary, not free text," per lineage audit Sec 7) | Must map to a ratified canonical relationship verb per Enterprise IA Sec 4. The verbs the prototype actually surfaces as edge labels ("supplies crew state," "reads," "grounds," "blocks start," "should be measured by," "contests source") are **not** in Enterprise IA's example dictionary (`supports`, `owned by`, `hosted on`, `owns`, `implements`, `part of`, `measures`, `applies to`) and need explicit ratification before they can be trusted as governed business phrases rather than ad hoc prototype text |
| `authority_state`                      | Present                                                                                                                                                                                           | accepted (solid) / candidate (dashed, excluded by default) / — plus a distinct `conflicting` state for contradictions                                                                                                                                                                                                                                                                                                                                                                                                    |
| Evidence link                          | Present via `relationship_evidence_v1`                                                                                                                                                            | Every edge must resolve to at least one evidence fragment before it can render as clickable-with-a-drawer                                                                                                                                                                                                                                                                                                                                                                                                                |
| `endpoint_catalog_backed`              | **Missing**                                                                                                                                                                                       | Same as node-level; an edge inherits `false` if either endpoint does                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `state_scope`, `target_approval_state` | **Missing**                                                                                                                                                                                       | New fields (registry amendment #10), required for Section 5                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

**Edge render gate:** an edge renders solid-and-clickable only if `authority_state = accepted`,
`endpoint_catalog_backed = true` on both endpoints, and `relationship_type_ref` resolves to a ratified verb.
Any edge failing the type-ratification check specifically must render exactly as the prototype's own tooltip
already models: **"relationship not typed"** — never a plausible-sounding invented verb.

## 3. Evidence field requirements (edge/node drawer)

`consumption.relationship_evidence_v1` is registered and populated, but the drawer needs fields not confirmed
in the sampled field contract (registry amendment #11):

- `confidence` (high/medium/low) — drives the drawer's "Confidence" row
- `review_state` (pending/reviewed) — drives "Review"
- `authority_state_detail` (authoritative/not_authoritative) — drives "Authority," distinct from the coarser
  `authority_state` on the edge itself
- `effective_from` / `effective_to` — drives "In effect: From X — no end date"

**Evidence render gate:** all five fields above must resolve for a given edge before its drawer may render
anything beyond the bare source citation. A drawer with a citation but no confidence/review/authority must
show those rows as "Not yet captured," never defaulted to a plausible-looking value like "High" / "Reviewed."

## 4. One-hop / two-hop projection needs

- **Default state:** one hop from the focal entity, `authority_state = accepted` only. This must be a
  **server-side query constraint**, not a client-side filter over a fully-fetched two-hop graph — Enterprise
  IA's access-control and evidence-governance rules apply at the query boundary, not the render boundary.
- **Two-hop expansion:** requires a recursive traversal capability over `relationship_edge_v1`. The
  `21-phase3c2e-executable-data-layer` README states "recursive SQL traversal helpers" as a stated deliverable
  of the Graph Path, but the specific file reviewed in this pass
  (`sql/001_shared_knowledge_publication_consumption.sql`) was not fully inspected line-by-line for a shipped
  recursive function — **this must be verified directly against that file before two-hop expansion is trusted
  in production**, not assumed present because the README says it is planned.
- **Node cap and aggregation:** the prototype's own design notes state graphs must always be "a focused
  projection: focal entity, one hop by default, two on request, node cap with aggregation." No node-cap or
  aggregation rule is specified in any reviewed contract file — this needs its own design decision (e.g. "cap
  at N nodes, aggregate the remainder into a single 'N more' node") before implementation, not left to ad hoc
  client-side truncation.

**Render gate:** two-hop expansion is disabled until the recursive traversal function is verified to exist and
to enforce the same `authority_state`/`endpoint_catalog_backed` filters as the one-hop default.

## 5. Candidate-exclusion rules

- **Default:** `authority_state = candidate` edges/nodes are excluded from every graph view, every count, and
  every downstream Cube measure (`RelationshipGraph.accepted_relationship_count` filters `authority_state =
'accepted'` specifically — this is already correctly built).
- **Explicit toggle:** a "Show candidates" control may re-include them, rendered dashed, with an explicit
  "excluded from decisions" label — this is a client-side render toggle over an already-broader server
  response, or a distinct query parameter; either is acceptable as long as the **default** response from the
  server never includes candidates.
- **Open design decision, unresolved:** the prototype's own notes name "whether proposed relationships may be
  included in a two-hop expansion for users holding a review role" as an open decision. This must be resolved
  — and the resolution encoded as an explicit role check — before two-hop-plus-candidates is ever shipped;
  it cannot be inferred from the current contract.

**Render gate:** candidate inclusion requires an explicit user action (not a default) and the response must be
visually and programmatically distinguishable from accepted content at every layer (color, dash pattern,
exclusion from any count or Cube measure).

## 6. Current/target overlay semantics

This is the graph-specific instance of GAP-07 (the gap register's highest-leverage structural fix). Today,
**no node or edge in the governed contract carries a current/target distinction.** The prototype's `ct` graph
(`GRAPHS.ct`, "Current against target — engineering") shows `Current` node type, `Proposed target` node type,
and `Approved target` node type simultaneously on one canvas, connected by a `replaced by` edge, with a
`Contradiction` node type where the two disagree on timing.

**Target contract:**

- `state_scope` (`current` \| `target`) on both nodes and edges (registry amendment #10).
- `target_approval_state` (`proposed` \| `approved`, null when `state_scope = current`) — approved targets
  require a strictly higher authority bar than proposed ones; this is not the same axis as `authority_state`
  (a target can be `authority_state = accepted` as a _proposal_ while still being `target_approval_state =
proposed`, i.e., accepted-as-a-real-proposal is not the same as approved-as-the-plan-of-record).
- The `replaced by` edge type must be added to the canonical relationship dictionary (Enterprise IA Sec 4)
  alongside the existing example verbs.
- A target node and its current-state counterpart are **two separate rows joined by a relationship**, never
  one row mutated in place — consistent with Enterprise IA's rule that adapters and projections append, they
  do not overwrite.

**Render gate:** the overlay toggle is disabled (current-state graph only) until `state_scope` and
`target_approval_state` are ratified and populated for both sides of at least one real comparison.

**Safe empty state:** when the toggle is enabled by a user but no target-state rows exist for the focal
entity, show "No target state published for this entity" rather than silently rendering the current-state
graph as if the toggle had no effect (a silent no-op here would be misleading in a different way than an
explicit gap message).

## 7. Legend and visual-encoding correctness

The prototype's legend (Accepted solid / Candidate dashed-excluded / Gap-or-contradiction red-dashed) is
correct **as a design**, but its correctness at runtime is entirely downstream of Sections 1–2 above: a legend
promising "Accepted" only means what it says once `endpoint_catalog_backed` and `relationship_type_ref`
ratification are both enforced. Do not ship the legend's visual promise ahead of the data guarantees that back
it — this is precisely the failure mode SD-08 describes ("relationship graphs with meaningless nodes/edges,"
the exact defect category this whole document exists to prevent).
