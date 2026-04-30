# TENANT-DATA-DESIGN — Integration Architecture for the Persisted Tenant-Data Layer

Slice ID: TENANT-DATA-DESIGN
Status: design (no code)
Authored: 2026-04-29
Type: design doc — wiring slices (TD-1 … TD-9) execute against this once
the founder shares the schema.

This doc specifies **how** the new persisted tenant-data layer (Apex
Retail loaded 2026-04-30; Meridian following 2026-05-01) gets read by
the agent context broker, without breaking the existing code-fixture
contract that today's tenants rely on. It is intentionally schema-shy:
the founder applied the migration via Supabase Dashboard / a one-off
ingestion script, and the table names and column shapes are not yet in
the repo. Where shape is unknown the contract is abstract and the open
questions in §8 call it out.

Read alongside: `src/lib/knowledge/agent-context-broker.ts`,
`src/lib/knowledge/enterprise-data-room.ts`,
`src/lib/programs/programs-broker-adapter.ts`,
`docs/specs/platform/data-ingestion-integration.md` (packets 1, 5, 6),
`docs/architecture/ABARVA_PLANES_ARCHITECTURE.md`,
`docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` Parts C.2 and
E.5. Memory: `feedback_broker_boundary.md`,
`project_apex_tenant_data_drop.md`.

---

## 1. Premise

**The platform's promise.** AbarVa is "every engagement makes every
future engagement smarter." That claim is grounded only if the agent's
view of a tenant is rich, provenanced, and cross-linked at Director+
depth — not at C-suite-glossy depth.

**The gap.** Today's `EnterpriseDataRoom` (`src/lib/knowledge/enterprise-
data-room.ts`) is a **code fixture**: ~6 executives per tenant, a few
systems, a thin program inventory, a graph that's deterministically
generated from the same source files at build time. It is good enough
to answer "who is the CIO?" — it is not good enough to answer "who owns
the system that measures the revenue KPI?" or "is anyone leading two
critical-path programs at the same time?"

**The drop.** On 2026-04-30 the founder loaded a comprehensive
enterprise-data foundation directly into the Apex Retail Supabase DB:

- 14 segment families (`enterprise_profile`, `org_structure`,
  `it_landscape`, `kpi_dictionary`, `program_inventory`,
  `evidence_ledger`, `vendor_contracts`, `cross_program_signals`, plus
  6 more).
- 403 records with composite ids of shape
  `<segment_id>:<sub-namespace>:<tenant>:<local-id>` (e.g.
  `it_landscape:sys:apex:sap-s4`). Each record has `segment_id`,
  `record_id`, `record_kind`, plus segment-specific fields.
- 257 graph nodes with stable ids (`enterprise:apex-retail`,
  `person:apex:diana-lopez`, `sys:apex:sap-s4`, `kpi:apex:001`,
  `program:apex-cdp-2026`, `vendor:apex:sap`,
  `evidence_ledger:ev:apex:001`).
- 275 graph edges (`HAS_EXECUTIVE`, `OWNED_BY`, `LICENSED_FROM`,
  `SPONSORED_BY`, `MEASURED_FROM`, `LED_BY`, …).
- 415 context chunks with `embedding_status: 'pending'` — text is
  ready for retrieval, embeddings are not yet computed.
- 14 expected baselines, 14 audit-log rows, 1 ingestion run.

The migration file is **not** committed to the repo. Table names and
exact column shapes are unknown; the example records and graph node
patterns shown in §3, §4, and the founder's drop notes are the only
confirmed surface.

**The two-layer reality during the migration window.** Multiple tenants
today have rich code-fixture data (Apex Retail, Meridian Health, First
Capital). Apex now also has DB-persisted data. The broker must serve
**both** — picking one source per request — until every pilot tenant is
in the DB layer. We do not delete the code-fixture in this design.

**The retrieval reality.** `embedding_status: 'pending'` means vector
similarity search does not light up at TD-1. The structured retrieval
path (SQL filter + keyword `ILIKE`) is good enough to ground chat
context for the pilot. Vector layers in once the embedding job runs;
the contract in §5 is shaped so that the swap does not break callers.

**The boundary, restated.** Per `feedback_broker_boundary.md`: app-tier
code (routes, surfaces, programs adapter) **must not** import the new
data-room or graph modules directly. Everything goes through
`AgentContextBroker`. This design preserves that — the new
`TenantDataAdapter` lives behind the broker and is the only module that
talks to Supabase for tenant data.

---

## 2. Architecture

The integration follows the planes model from
`ABARVA_PLANES_ARCHITECTURE.md`. The new persisted layer lives in
**Plane 5 — Data Plane** (Postgres / Supabase). The
`TenantDataAdapter` is the read-side projection consumed by **Plane 3
— Context Plane** through the existing **Plane 4 — Knowledge / Evidence
Plane** broker.

```
App Plane ──► AgentContextBroker (Plane 3/4 seam)
                      │
                      ├──► EnterpriseDataRoom  (existing code fixture)
                      │
                      └──► TenantDataAdapter   (NEW — server-only)
                                  │
                                  └──► tenant-data-store.ts
                                              │
                                              └──► Supabase (Plane 5)
```

Two new server-only modules.

### 2.1 `src/lib/knowledge/tenant-data-adapter.ts` — the contract

```ts
// Server-only. Imported only by agent-context-broker.ts.
import 'server-only';

/** The 14 segment families confirmed in the drop. */
export type SegmentId =
  | 'enterprise_profile'
  | 'org_structure'
  | 'it_landscape'
  | 'kpi_dictionary'
  | 'program_inventory'
  | 'evidence_ledger'
  | 'vendor_contracts'
  | 'cross_program_signals'
  // 6 more — names confirmed by founder before TD-2 lands.
  | 'segment_9_tbd'
  | 'segment_10_tbd'
  | 'segment_11_tbd'
  | 'segment_12_tbd'
  | 'segment_13_tbd'
  | 'segment_14_tbd';

/**
 * Composite record id of shape
 * `<segment_id>:<sub-namespace>:<tenant>:<local-id>`,
 * e.g. `it_landscape:sys:apex:sap-s4`.
 */
export type RecordId = string;

/** record_kind values discovered in the drop, plus an open string for forward-compat. */
export type RecordKind =
  | 'systems_inventory'
  | 'kpi_definition'
  | 'program_record'
  | 'evidence_claim'
  | 'vendor_contract'
  | 'org_role'
  | 'cross_program_signal'
  | (string & {});

export interface SegmentRollup {
  segmentId: SegmentId;
  recordCount: number;
  recordKinds: RecordKind[];
  /** ISO timestamp of latest known ingestion run that touched this segment. */
  lastIngestedAt: string | null;
}

/**
 * A persisted record. Segment-specific fields live in `fields` —
 * typed shape per record_kind is defined in §3 (mapper module).
 * The adapter is intentionally generic; the mapper is where types
 * sharpen up.
 */
export interface TenantRecord {
  segmentId: SegmentId;
  recordId: RecordId;
  recordKind: RecordKind;
  title: string;
  fields: Record<string, unknown>; // shape narrowed by mapper per kind
}

export type GraphNodeKind =
  | 'enterprise'
  | 'person'
  | 'sys'
  | 'kpi'
  | 'program'
  | 'vendor'
  | 'evidence_ledger'
  | (string & {});

export interface GraphNode {
  nodeId: string;       // e.g. 'sys:apex:sap-s4'
  kind: GraphNodeKind;  // parsed from nodeId prefix
  title: string;
  /** Optional back-pointer to the source record_id, when the node is record-backed. */
  recordId: RecordId | null;
}

export type GraphEdgeType =
  | 'HAS_EXECUTIVE'
  | 'OWNED_BY'
  | 'LICENSED_FROM'
  | 'SPONSORED_BY'
  | 'MEASURED_FROM'
  | 'LED_BY'
  | (string & {});

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
  edgeType: GraphEdgeType;
}

export interface ContextChunk {
  chunkId: string;
  recordId: RecordId | null;     // null when chunk is doc-level, not record-level
  text: string;
  embeddingStatus: 'pending' | 'embedded' | 'failed';
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface EvidenceRecord {
  evidenceId: string;
  claim: string;
  sourceDoc: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: number;
  caveat: string | null;
}

export interface TenantDataAdapter {
  listSegments(tenantKey: string): Promise<SegmentRollup[]>;
  listRecords(
    tenantKey: string,
    segmentId: SegmentId,
    opts?: { limit?: number; recordKind?: RecordKind },
  ): Promise<TenantRecord[]>;
  getRecord(tenantKey: string, recordId: RecordId): Promise<TenantRecord | null>;
  listGraphNodes(tenantKey: string, kind?: GraphNodeKind): Promise<GraphNode[]>;
  listGraphEdgesForNode(
    tenantKey: string,
    nodeId: string,
    direction?: 'outgoing' | 'incoming' | 'both',
  ): Promise<GraphEdge[]>;
  listContextChunks(
    tenantKey: string,
    opts?: { recordIds?: RecordId[]; embeddingStatus?: ContextChunk['embeddingStatus'] },
  ): Promise<ContextChunk[]>;
  /** Provenance-aware fetch for evidence_ledger ids. */
  getEvidence(tenantKey: string, evidenceId: string): Promise<EvidenceRecord | null>;
}
```

### 2.2 `src/lib/knowledge/tenant-data-store.ts` — the implementation

- Server-only. Uses the Supabase **service-role** client. Reads only.
- Tenant-scoped. Every method takes `tenantKey` as the first arg. The
  store either:
  - filters by an explicit `tenant_key` column (preferred), or
  - parses the tenant slug out of the composite `record_id` /
    `node_id` prefix when the schema does not carry an explicit
    column. **Open question §8.1.**
- Trusts DB-side RLS as the second-layer safety net (presumed already
  in place per §6).
- Exposes one named export `tenantDataStore: TenantDataAdapter`.
- Stub mode: when `process.env.TENANT_DATA_LIVE !== 'true'`, every
  method returns an empty array (TD-1 behavior; lets the broker wire
  up before TD-2 lands).

This shape lets TD-1 ship before the founder shares the schema:
contract + types + stub. TD-2 wires the real SQL once column names are
known.

---

## 3. Broker integration

The broker becomes a **two-source consumer**. Algorithm, per request:

1. Call `tenantDataStore.listSegments(tenantKey)`.
2. If it returns `[]` (stub mode, unknown tenant, or empty rows):
   delegate to the existing `getEnterpriseDataRoom(tenantKey)` path
   unchanged. Tag the bundle `sourceBasis: 'enterprise_data_room_fixture'`.
3. If it returns rollups: **serve from the persisted layer for every
   domain that has rows**. Tag the bundle
   `sourceBasis: 'tenant_data_persisted'`. Do **not** mix sources for a
   single domain. (If `org_structure` has rows but `program_inventory`
   does not, the bundle's people are persisted and its programs come
   from the fixture — but each context item is tagged at the item level
   so the agent can reason about freshness.)
4. Per-item tagging is done on `EnterpriseAgentContextItem.sourceBasis`
   — the field already exists, but its value union must extend:

```ts
// existing: 'synthetic_seed' | 'client_provided' | 'public_source' | 'derived' | 'agent_generated'
// add:
//   | 'tenant_data_persisted'
//   | 'enterprise_data_room_fixture'
```

### 3.1 Mapping discipline

Each persisted `record_kind` maps to one existing or new
`EnterpriseContextItemKind`. The mapper module
`src/lib/knowledge/tenant-record-mapper.ts` (added in TD-4) is the
single seam between persisted shape and broker shape.

| Persisted record_kind | Source segment | Target context-item kind | Notes |
|---|---|---|---|
| `systems_inventory` | `it_landscape` | `system` | `vendor`, `annual_cost_usd`, `renewal_date`, `business_criticality`, `owner_id` (links to person via graph) |
| `kpi_definition` | `kpi_dictionary` | **NEW** `kpi_metric` | `current_value`, `target_fy2026`, `source_system`, `data_owner`, `confidence` |
| `program_record` | `program_inventory` | `program` | `current_phase`, `budget_*`, `sponsor`, `program_lead`, `vendors[]`, `open_contradiction` |
| `evidence_claim` | `evidence_ledger` | `evidence` | `claim`, `source_doc`, `classification`, `confidence`, `caveat` |
| `vendor_contract` | `vendor_contracts` | `vendor_contract` | `renewal_date`, `key_risk` |
| `org_role` | `org_structure` | `person` | reports-to relationship resolved via graph edge, not embedded field |
| `cross_program_signal` | `cross_program_signals` | **NEW** `cross_program_signal` | `programs[]`, `severity`, `recommendation` |

Two new `EnterpriseContextItemKind` values are required:

```ts
// extend src/lib/knowledge/agent-context-broker.ts
export type EnterpriseContextItemKind =
  | 'tenant_summary' | 'person' | 'program' | 'artifact' | 'evidence'
  | 'system' | 'vendor_contract' | 'sourcing_event' | 'financial_metric'
  | 'graph_candidate' | 'policy_readiness'
  // NEW:
  | 'kpi_metric'
  | 'cross_program_signal';
```

`kpi_metric` is **not** a re-use of `financial_metric`. KPIs have
provenance (`source_system`, `data_owner`, `confidence`) that the
broker must surface verbatim; folding them into `financial_metric`
would lose those fields.

### 3.2 Why "never mix sources within a single response" matters

The Programs broker adapter (`programs-broker-adapter.ts`,
`formatProgramsBrokerBundleForPrompt`) flattens the bundle into a
prompt block. If half the executive bench came from the fixture and
half from the persisted layer, the prompt would lie about freshness.
The bundle therefore tags **per-domain source basis**, and the prompt
formatter labels the section ("Executive bench (persisted)" vs
"Executive bench (synthetic seed)"). The agent treats the persisted
section as authoritative when both exist; the formatter never appends
a fixture row to a persisted section. **Rule:** within one
`EnterpriseContextItemKind`, all items in a single bundle share one
`sourceBasis` value.

---

## 4. Graph traversal

The graph layer (257 nodes, 275 edges, stable typed edges) deserves a
dedicated query path. The use cases are concrete:

- **"Who owns the system that measures this KPI?"** —
  `kpi:apex:001 → MEASURED_FROM → sys:apex:sap-s4 → OWNED_BY → person:apex:diana-lopez`.
- **"Which programs does this exec sponsor?"** —
  `person:apex:jennifer-park ← SPONSORED_BY ← program:apex-cdp-2026`.
- **"Which programs share a program lead?"** —
  `person:apex:priya-iyer ← LED_BY ← program:apex-cdp-2026, program:apex-cc-ai-2026`
  (this is exactly the `cross_program_signals:xprog:apex:001` row).

### 4.1 Helper contract

```ts
export interface GraphNeighborhood {
  rootId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Depth at which each node was discovered (0 = root). */
  depthByNode: Record<string, number>;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[]; // edges.length === nodes.length - 1
}

export interface GraphTraversal {
  fromRoot(
    tenantKey: string,
    rootId: string,
    opts?: { maxDepth?: number; edgeTypes?: GraphEdgeType[] },
  ): Promise<GraphNeighborhood>;
  pathBetween(
    tenantKey: string,
    fromId: string,
    toId: string,
    maxDepth?: number,
  ): Promise<GraphPath | null>;
}
```

### 4.2 Implementation discipline

- **No graph database.** BFS in JavaScript over results from a small
  number of `listGraphEdgesForNode` calls, with a depth cap of 3 by
  default and a hard ceiling of 5. Cross-tenant traversal is
  impossible because every call carries `tenantKey`.
- **SQL recursive CTE is acceptable** for `pathBetween` if the BFS
  round-trip count gets ugly. Decision deferred to TD-3 implementation.
- **Powers existing surfaces.** The existing
  `GraphNeighborhoodArtifact` in `src/lib/agent/artifacts.ts` (the
  `graph-neighborhood` artifact Sentinel emits) is the first consumer.
  Today it carries `topEdges[]` from the code-fixture graph; TD-3
  wires it to `fromRoot(tenantKey, rootId, { maxDepth: 1 })`.
- **The broker's `EnterpriseGraphNeighborhoodSummary`** (already in
  the bundle shape) gets populated from real graph data when
  `includeGraphNeighborhood: true`.

---

## 5. Context chunks + retrieval

415 chunks are persisted with `embedding_status: 'pending'`. The
embedding pipeline is not yet live (open question §8.5).

### 5.1 The contract — embedding-agnostic

```ts
export interface ChunkRetrieval {
  byRecord(tenantKey: string, recordId: RecordId): Promise<ContextChunk[]>;
  byKeyword(tenantKey: string, keywords: string[], limit?: number): Promise<ContextChunk[]>;
  /** Throws RetrievalNotEnabledError if vector index is not yet live. */
  byVector(tenantKey: string, queryVector: number[], limit?: number): Promise<ContextChunk[]>;
}
```

The contract is shaped so that:
- TD-6 (now): `byRecord` and `byKeyword` are real; `byVector` throws.
- TD-9 (later, when embeddings run): `byVector` flips on; callers do
  not change.

### 5.2 Now — structured retrieval (TD-6)

- `byRecord` — `WHERE record_id = ANY($1) AND tenant_key = $2`.
  Constant-time once indexed.
- `byKeyword` — `ILIKE` over a small number of keywords joined with
  `OR`, ranked by simple `ts_rank` if a `tsvector` column exists on
  the chunks table; fall back to insertion order if not. Limit 20 by
  default.
- This is enough to ground chat context on a specific program / KPI /
  system. It is **not** enough to answer free-form "find the chunk
  that discusses customer-data-quality" — that needs vectors.

### 5.3 Later — vector retrieval (TD-9, gated on embeddings)

- pgvector cosine similarity, or whatever index the embedding pipeline
  picks. The contract does not encode the choice.
- Caller passes a query vector (computed by the model gateway, not by
  the broker). The broker stays out of the embedding business.

---

## 6. Pilot-readiness floor

- **Tenant-scoped RLS at the DB layer.** Presumed in place from the
  founder's import. The adapter trusts RLS and additionally filters by
  `tenant_key` in every query as a defense-in-depth check. Schema
  question §8.1 confirms or denies an explicit column.
- **Service-role write boundary.** Only ingestion runs and admin
  operations write. The adapter is read-only — no `insert`/`update`/
  `delete` exposed. Writes go through the existing ingestion / tool
  plane.
- **Source-basis tagging on every emitted item.** New union values
  `'tenant_data_persisted'` and `'enterprise_data_room_fixture'`.
  Observability into whether the agent grounded against persisted vs
  code-fixture data, per-tenant, per-domain.
- **Telemetry events** (PostHog, in TD-8):
  - `tenant_data_used` — `{ tenantKey, segmentId, recordCount }`
  - `tenant_data_fallback_to_fixture` — `{ tenantKey, reason: 'unknown_tenant' | 'empty_segments' | 'adapter_error' }`
  - `tenant_data_graph_traversal` — `{ tenantKey, rootKind, depth, nodeCount }`
- **Schema-drift probe.** A startup function (or a cold-path
  `/api/admin/tenant-data-health`) that confirms the 14 expected
  segments exist with the expected `record_kind` set per segment.
  Warns loudly (Sentry, log line at `error` level) if not. This catches
  the case where someone re-runs the migration with a renamed segment.
- **No app-tier import of `tenant-data-store.ts` or `tenant-data-
  adapter.ts`.** ESLint rule (added in TD-1) enforces it. Boundary
  per `feedback_broker_boundary.md`.

This satisfies the cross-cutting failure-mode-driven design pilot floor
in `PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` Part F (audit log,
RLS, telemetry on every state transition).

---

## 7. Slice plan

| Slice | Scope | Pre-requisite |
|---|---|---|
| **TD-1** | `TenantDataAdapter` contract + types + stub `tenantDataStore` returning empty arrays. ESLint boundary rule. No DB calls. | None |
| **TD-2** | Supabase-backed `listSegments` / `listRecords` / `getRecord`. Real SQL against the persisted layer. Service-role client wiring. | Founder shares schema (table names + column shapes) |
| **TD-3** | `listGraphNodes` / `listGraphEdgesForNode` + `GraphTraversal` (`fromRoot`, `pathBetween`). Wires the existing `graph-neighborhood` artifact to real data. | TD-2 |
| **TD-4** | Mapper module `tenant-record-mapper.ts` covering 7 record kinds. Two new `EnterpriseContextItemKind` values (`kpi_metric`, `cross_program_signal`). | TD-2 |
| **TD-5** | Broker integration — two-source consumer, source-basis tagging at item and section level. Updated `formatProgramsBrokerBundleForPrompt` so labels are honest. | TD-4 |
| **TD-6** | `ChunkRetrieval.byRecord` + `byKeyword`. `byVector` stub that throws. | TD-2 |
| **TD-7** | Cross-program signal artifact emission directly from `cross_program_signals` rows. Sentinel surface. | TD-5 |
| **TD-8** | Schema-drift probe + the three PostHog telemetry events. Admin health endpoint. | TD-5 |
| **TD-9** | Vector retrieval (pgvector or whatever the embedding pipeline picks). Flips `byVector` on without changing callers. | Embedding job lives; founder confirms index strategy |

The hard gate is **TD-2**: the founder must confirm the table names
and column shapes (or hand over the migration file) before TD-2 can be
implemented. Everything else flows from TD-2.

TD-1 is safe to ship now: it adds types and a stub that returns empty
arrays, which means the broker keeps using the code-fixture path
unchanged. No behavior change in production.

---

## 8. Open questions

1. **Tenant scoping at the DB layer.** Does each table have an
   explicit `tenant_key` column, or is tenancy implied via the
   `segment_id` / `record_id` prefix (e.g. `it_landscape:sys:apex:…`)?
   RLS posture and the adapter's filtering predicate depend on the
   answer. **Lean:** explicit column is much safer; ask the founder to
   add one if it is not already there.
2. **`engagements.id` ↔ `program_inventory.record_id`.** The OV2-2a
   slice uses `engagements` (uuid PK) as the operational program
   record. The persisted layer uses `program_inventory` (string
   `record_id` like `program_inventory:apex-cdp-2026`). What is the
   canonical mapping? Two are not the same source of truth — `engagements`
   is operational state (lifecycle, gates, sponsor sign-off);
   `program_inventory` is the broker-readable enterprise inventory
   (open contradictions, vendors, budget consumed). **Lean:** keep
   them separate; bridge with a one-time migration that writes
   `program_inventory.record_id` into a new column on `engagements`,
   so the broker can join when both rows exist.
3. **Should `EnterpriseDataRoom` be deleted once all pilot tenants are
   in the DB layer?** **Lean:** retain as a **fallback** only — for
   unauthenticated demo, cold-start, and tenants with no DB rows yet.
   Mark deprecated when DB has parity. Do not duplicate.
4. **Embedding pipeline trigger.** Is the embedding job manual (founder
   fires it), automatic on ingestion, or scheduled? This decides
   whether TD-9 is a slice or a runtime concern. **Open.**
5. **Schema drift between Apex and Meridian.** Apex loaded
   2026-04-30, Meridian following 2026-05-01. Are the two tenants
   loaded against the **same** schema, or did the schema evolve
   between drops? The schema-drift probe in TD-8 catches this at
   startup, but the design assumes one schema across all four pilot
   tenants. Confirm with the founder before TD-2.
6. **Does the audit log feed back into the broker?** 14 audit-log
   rows shipped with the drop. Out of scope for this design — audit
   is a Plane 8 (Governance / Audit) concern, not a context-broker
   concern. Mentioned for completeness.

---

## 9. Reviewer instructions

Read this doc in this order:

1. **§1 Premise.** If you disagree that the broker should be a
   two-source consumer (vs. a hard cut-over from fixture to persisted),
   stop and tell me — every section below assumes the two-source model
   for the migration window.
2. **§2 Architecture.** The shape of `TenantDataAdapter` and the
   server-only boundary. If the contract is wrong, every slice from
   TD-2 onward is wrong.
3. **§3 Broker integration.** Specifically the per-item source-basis
   tagging and the "never mix sources within one
   `EnterpriseContextItemKind`" rule. This is the most opinionated
   call in the doc.
4. **§7 Slice plan.** TD-1 is the next slice to ship; it is safe
   without the schema. TD-2 is the gate. Confirm TD-1 can land before
   the schema is shared.
5. **§8 Open questions.** Q1 (tenant scoping) and Q2
   (`engagements` ↔ `program_inventory`) are the two that decide
   whether the slice plan is right. Both need the founder's input.

The two questions that decide whether the slice plan is right:

- **Q1 — does the new layer have an explicit `tenant_key` column?** If
  yes, the adapter is straightforward; if no, the adapter has to parse
  composite ids and the safety story leans entirely on RLS.
- **Q2 — is `engagements` synced with `program_inventory`?** If yes,
  the broker can serve unified program context; if no, TD-5 must
  document which source wins for each field.

---

## End of TENANT-DATA-DESIGN

The next move is **TD-1** (contract + stub) — safe to ship without the
schema. After that, the founder needs to share the persisted-layer
schema (table names + column shapes, or the migration file itself) so
TD-2 can wire the real reads.
