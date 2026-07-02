# V6 Graph Substrate Contract

## Status

Design and physical-table standard for the AbarVa V6 enterprise graph substrate.

This standard exists because the current system already has graph-shaped
storage, but the graph is fragmented across older layers and is not yet a
single enterprise-grade V6 graph.

Physical tables were introduced by migration
`supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql`:

- `intelligence_v6.relationship_types`
- `intelligence_v6.graph_nodes`
- `intelligence_v6.graph_edges`
- `intelligence_v6.graph_quality_reports`

These tables are additive. They do not, by themselves, replace any current
Home, Intelligence, Source, Moves, or Tower read path.

## Core Decision

Use Azure Postgres as the canonical graph substrate first.

Do not make Azure Cosmos DB for Apache Gremlin, Apache AGE, Neo4j, NetworkX, or
a graph visual library the design center until the V6 graph semantics are clean.

The immediate problem is not lack of a graph engine. The problem is graph
quality:

- nodes are often inferred from edge IDs;
- relationship layers are fragmented;
- relationship type values mix verbs with evidence notes;
- owner, evidence, confidence, and caveat metadata are inconsistent;
- old substrate tables can still influence answer paths;
- graph visuals can make weak semantics look more certain than they are.

## Canonical Path

```text
V6 files
  -> intelligence_v6.business_records
  -> intelligence_v6.relationship_edges
  -> intelligence_v6.graph_nodes
  -> intelligence_v6.graph_edges
  -> intelligence_v6.relationship_types
  -> intelligence_v6.graph_quality_reports
  -> Home / Intelligence / Source / Moves / Tower graph slices
```

## Existing Layers

These graph-shaped layers may exist in the repo or live database:

- `enterprise_graph_nodes`
- `enterprise_graph_edges`
- `enterprise_context_relationships`
- `source_graph_edges`
- `ai_control_context_relationships`
- `operational_evidence_relationships`
- `semantic2_relationships`
- `intelligence_v6.relationship_edges`
- `cio_tower.relationships`

Treat the older public layers as compatibility or sunset candidates unless a
current V6 contract explicitly depends on them. Do not create another
disconnected graph layer.

## Required Node Contract

Every canonical V6 graph node must include:

- `tenant_key`
- `node_id`
- `object_family`
- `business_display_name`
- `canonical_name`
- `source_record_id`
- `source_file`
- `source_row_number`
- `source_evidence_refs`
- `owner`
- `criticality`
- `confidence`
- `known_gaps`
- `metadata`
- `created_at`
- `updated_at`

Nodes should be materialized from V6 object records, not only inferred from
relationship rows. If an edge references a node that cannot be resolved from the
canonical object records, mark the edge as orphaned.

## Required Edge Contract

Every canonical V6 graph edge must include:

- `tenant_key`
- `relationship_id`
- `from_node_id`
- `to_node_id`
- `relationship_type`
- `relationship_category`
- `relationship_confidence`
- `evidence_basis`
- `raw_relationship_type`
- `source_file`
- `source_row_number`
- `known_gaps`
- `caveats`
- `metadata`
- `created_at`
- `updated_at`

Preserve the raw relationship type for audit, but never let raw values become
the executive-facing graph vocabulary.

## Relationship Type Dictionary

Relationship types must be normalized through a dictionary before graph
traversal, graph rendering, or model-prompt use.

Initial approved relationship types:

- `SUPPORTS`
- `DEPENDS_ON`
- `HOSTED_ON`
- `OWNED_BY`
- `PRIMARY_SYSTEM_FOR`
- `SYSTEM_OF_RECORD_FOR`
- `VENDOR_SUPPORTS_SYSTEM`
- `FUNDS`
- `MITIGATES`
- `FEEDS`
- `BLOCKS`
- `MEASURES`
- `USES`
- `MODERNIZES`
- `IMPACTS`
- `GOVERNS`
- `ROLLS_UP_TO`

Each dictionary entry should define:

- canonical label;
- inverse label;
- allowed source object families;
- allowed target object families;
- semantic category;
- directionality;
- executive-safe flag;
- description.

## Normalization Rules

Normalize casing and common variants:

| Raw value | Canonical value |
| --- | --- |
| `supports` | `SUPPORTS` |
| `supporting` | `SUPPORTS` |
| `depends on` | `DEPENDS_ON` |
| `hosted on` | `HOSTED_ON` |
| `primary` | `PRIMARY_SYSTEM_FOR` |
| `system_of_record` | `SYSTEM_OF_RECORD_FOR` |
| `vendor matched to supported system evidence` | `VENDOR_SUPPORTS_SYSTEM` |

Move evidence notes out of `relationship_type`.

Example:

```text
Bad:
relationship_type = "V4 application row with unresolved owner join"

Good:
relationship_type = "OWNED_BY"
evidence_basis = "V4 application row with unresolved owner join"
known_gaps = ["owner_join_unresolved"]
relationship_confidence = "low"
```

## Graph Quality Report

Each tenant graph must produce a deterministic quality report with:

- total nodes;
- total edges;
- explicit node count;
- inferred node count;
- orphan edge count and rate;
- self-edge count and rate;
- placeholder object-family count and rate;
- normalized relationship type count and rate;
- high, medium, and low confidence edge counts;
- source-owner coverage rate;
- evidence coverage rate;
- executive-readiness score.

Executive UI may summarize graph quality, but it must not expose raw internal
IDs as if they were business-readable context.

Example executive-safe signal:

```text
Airline Demo has strong relationship volume, but owner coverage is not yet
board-grade. Dependency maps are useful for exploration and should remain
medium-confidence until owner and source evidence gaps are resolved.
```

## Traversal Strategy

Start with Postgres recursive SQL over the canonical graph tables for:

- app dependency and blast-radius paths;
- vendor-to-system dependency maps;
- AI initiative to data/system dependencies;
- risk/control propagation;
- owner accountability paths;
- program/value dependency views.

Evaluate Apache AGE only if recursive SQL becomes hard to maintain or too slow
for required traversals.

Evaluate Azure Cosmos DB for Apache Gremlin only if clean graph slices need
managed, high-scale graph traversal outside the primary Postgres read model.

## Product Boundary

Graph engines and visual libraries consume clean graph slices. They do not
define AbarVa source of truth.

Home, Intelligence, Source, Moves, and Tower may use graph slices only when:

- tenant fencing is proven;
- node resolution is reported;
- edge normalization is reported;
- quality score is present;
- source lineage is available;
- data-thin and orphan conditions remain visible to aVa.

Adoption must be staged. The graph substrate may be built and quality-scored in
shadow/read-only mode before a module consumes it. A module should switch to the
V6 graph only when the switch preserves or improves answer quality, tenant
safety, and latency.

Tower has a stricter boundary: Tower read models, metric tables, and fact tables
own metric values. The graph may explain dependencies, lineage, blockers, and
ownership context, but it must not calculate spend, value, ROI, or risk metrics.

## Acceptance Criteria

- Canonical nodes materialize from all V6 object records.
- Raw relationship rows remain auditable.
- Normalized edges use approved relationship types.
- Evidence notes are not treated as relationship verbs.
- Orphan edges are detected.
- Self-edges are counted.
- Cross-tenant edges are blocked.
- Graph quality scoring is deterministic.
- Executive UI does not leak raw graph payloads or internal IDs.
- AGE or Cosmos adoption is optional and justified by measured traversal needs,
  not by the existence of graph-shaped data.
