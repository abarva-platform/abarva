# AbarVa Context & Corpus — Target Data Architecture (PR-0, design-only)

**Status:** design. No code/schema/data change in this PR. PR-1 governance types and PR-3
migrations MUST conform to this model. Date: 2026-06-08.

Goal: a best-in-class, future-proof context/corpus data architecture so we do **not** come back for
a redesign — achieved via a designed target + **safe expand/contract migration** (no big-bang, no
destructive change). Grounded in the live current state below.

---

## 1. Current state (verified)

**Runtime:** Azure Container Apps `ca-abarva-web-lab-eastus` (rev `--0000070`, 100% traffic) behind
`app.abarva.ai`; `/api/health` ok=true, postgres=true, direct_postgres=true. Sub `abarva-lab-sub`.

**Substrate:** Postgres `pg-abarva-context-lab-001` (eastus2, private) · Blob
`stabarvaprivatedplab001` · Azure AI Search `srch-abarva-context-lab-eastus` (indexes
`tenant-context-v1`, `corpus-global`, `corpus-client-*`) · Service Bus `q-context-ingestion-events`
· Key Vault `kv-abarva-lab-001` · App Insights/Log Analytics. Identity: Clerk.

**Code paths (verified):** read `data-plane/azureRead.ts` (read-only, blocks mutation SQL);
compat bridge `data-plane/postgresCompat.ts` (transitional Supabase-style `.from()`); blob
`data-plane/objectStorage.ts`; tenant retrieval `azure-search/tenant-context-retriever.ts`; corpus
retrieval `corpus/azure-search.ts`; ingestion worker `scripts/azure-context-ingestion-worker.ts` +
sensitive guard `ingestion/azure-landing-zone-consumer.ts`; embeddings
`knowledge/context-broker/embedding-client.ts` (OpenAI `text-embedding-3-*`); reasoning
`…/stream.ts` (Anthropic). Writes via `data-plane/write-adapters/*` with a selector `index.ts`.

**Live tables (referenced):** `clients`, `engagements`, `enterprise_context_chunks`,
`knowledge_sources`, `genome_patterns`, `pattern_packs`, `ai_initiatives`, `data_inventory_records`,
`data_ingestion_runs` (+ source/move/artifact/vendor/system/KPI tables). Recent migrations show
active canonicalization + anthropic-first-party + loader-gate work.

**Three data layers today:** Client context (Postgres+Blob+AI Search) · Industry corpus (Postgres
corpus tables + seeds + AI Search) · Real-time signals (designed, partial/stubbed).

**Transitional / to retire:** `supabaseWriteAdapter.ts` fallback in the write selector; legacy
Supabase/Neon/**Pinecone** references in docs/comments; the `postgresCompat` `.from()` bridge.

**Embeddings reconciliation:** OpenAI `text-embedding-3-*` → Azure AI Search vectors is the **live,
allowed** path. The _blocked_ item was the old **Pinecone-targeting** `embed:pending-chunks` runner.
Anthropic-only governs **reasoning**, not embeddings. Retrievability target = Azure AI Search
(vector + keyword) + Postgres FTS; **no Pinecone**.

---

## 2. Target architecture

### 2.1 Layered pipeline + readiness state machine (the spine)

`raw/blob` → `parsed/structured` → `retrievable (indexed)` → `validated governed bundle` →
`cited output`. Every object carries a **readiness state**:
`uploaded → committed → indexed → retrievable → cite-render-verified`
(plus `restricted / quarantined / blocked / retired`). Only `cite-render-verified` (end-to-end:
DB row → retrieval → bundle → visible citation) counts as `agent_ready`. This is the distinction
that catches "loaded but not indexed" (Lakeshore) and "indexed but not surfaced" (#3322) BEFORE a
client sees it.

### 2.2 Canonical governed-object model (one schema, all tenants)

A single `GovernedObject` contract — same shape for every tenant and both planes — carrying: id,
tenant_id (or `corpus_global`), client_key (cover key), object_type, source_layer, industry,
enterprise_area, function, process_area, use_case_category, phase applicability, applicable_agents,
**provenance lineage**, source_basis, source_references, classification, compliance_basis,
confidence_level + rationale, readiness state, retrievability, value_levers, known_failure_modes,
guardrails, human_in_loop_controls, allowed/blocked agent actions, policy_version, contract_hash,
owner, timestamps. PR-1 emits this as TS types + Zod; existing tables expose it via additive
columns + a normalized provenance/readiness sidecar where a column doesn't fit.

### 2.3 Three planes + a cross-cutting governance plane

- **Client context plane** — tenant-private (Postgres + Blob + AI Search `tenant-context-v1`).
- **Industry corpus plane** — shared, tenant-neutral patterns (Postgres corpus tables + AI Search
  `corpus-global`); `corpus-client-*` = a client's _curated_ slice (promotion from private →
  reusable requires explicit curation; PHI/PII/real-names never auto-promote).
- **Real-time signals plane** — vendor/market/regulatory; make the stub a first-class layer with
  the same governed-object contract (so it's not a future bolt-on).
- **Governance plane (cross-cut)** — provenance lineage (`data_ingestion_runs`, append-only),
  readiness ledger, policy validation results, exception register, cover-name mapping (ops-only).

### 2.4 Tenant isolation by construction

`tenant_id` on every context row; **Postgres row-level security** as the enforcement floor (not
just app filters); retrieval is tenant-scoped at the index (separate AI Search scoping per tenant);
**zero cross-tenant joins**. Cover-name canonicalization at ingest; **real client names
(PHS, Morgan Street, …) never persisted in any agent-usable layer** — only in an ops-restricted
mapping; CI + runtime leak check fails on any real-name appearance.

### 2.5 One canonical bundle + reasoning spine

`buildValidatedAgentContextBundle(...)` returns the **one** bundle that subsumes today's
`AskSource[]` / `CompositionBundle` / `ContextBundle`, and is the `retrievalBundle` inside a
`DecisionReasoningRequest { intent, phase, tenant, module, contextPolicy, retrievalBundle,
groundingReport, modelInput, responseValidation, citedOutput }`. Non-`agent_ready` objects are
filtered at query time (defense-in-depth), so ungoverned rows can't reach Claude even if present.

### 2.6 Write path

`azurePostgresWriteAdapter` becomes the **only** runtime write path; the `supabaseWriteAdapter`
fallback is removed from the selector and an architecture-rules CI gate forbids new Supabase/
Pinecone/Neo4j runtime imports (extend the existing `architecture-rules.yml`).

---

## 3. Best-in-class principles → design choices

(1) tenant isolation by construction → RLS + tenant_id + scoped indexes. (2) one model all tenants
→ `GovernedObject`. (3) explicit state machine → readiness ledger. (4) provenance first-class →
append-only lineage, never stripped (tested invariant). (5) cover-name canonicalization → boundary
mapping + leak check. (6) confidence/classification as data → derived from `CANONICAL_TENANTS`
compliance metadata. (7) retrieval-agnostic Azure-native → AI Search + Postgres FTS, no Pinecone.
(8) idempotent replayable ingestion → run-keyed, dedup, deterministic backfill. (9) versioned +
reversible → expand/contract, reverse SQL. (10) auditable end-to-end → claim → row → run → source.

---

## 4. Environment / subscription topology (target)

| Environment                | Purpose                                             | Subscription       |
| -------------------------- | --------------------------------------------------- | ------------------ |
| Product Dev                | fast eng, synthetic data, CI smoke                  | AbarVa dev         |
| Product Preview / Lab      | ACA deploy, private DB/search/blob, pilot rehearsal | AbarVa lab (today) |
| Product Prod control plane | shared AbarVa SaaS control plane                    | AbarVa prod        |
| Client pre-prod data plane | client UAT / private-data rehearsal                 | client pre-prod    |
| Client prod data plane     | real client data                                    | client prod        |

The `GovernedObject` + isolation model is **identical across environments**; only the subscription/
data-plane boundary changes. This is what gives serious clients a clean private-data-plane story
without re-architecting.

---

## 5. Current → target gap map

| Area          | Today                                    | Target                                  | Gap action                         |
| ------------- | ---------------------------------------- | --------------------------------------- | ---------------------------------- |
| Object model  | per-surface fields                       | one `GovernedObject`                    | PR-1 types + PR-3 additive columns |
| Bundles       | 3 shapes (AskSource/Composition/Context) | one canonical bundle                    | PR-5                               |
| Readiness     | implicit                                 | explicit state machine + ledger         | PR-3                               |
| Provenance    | partial (`data_ingestion_runs`)          | append-only, end-to-end, tested         | PR-3 + PR-5/7 invariant            |
| Isolation     | app-level filters                        | RLS floor + scoped indexes + leak check | PR-3 (RLS) + PR-4 (leak gate)      |
| Retrieval     | AI Search + FTS (+stale Pinecone refs)   | AI Search + FTS only                    | retire Pinecone refs; PR-4 gate    |
| Writes        | azurePostgres + Supabase fallback        | azurePostgres only                      | remove fallback; PR-4 gate         |
| Compat bridge | `postgresCompat.from()`                  | typed adapters                          | phase out post-PR-5                |
| Signals plane | stubbed                                  | governed first-class layer              | later slice, same contract         |
| Cover names   | ad-hoc                                   | boundary canonicalization + leak check  | PR-3/PR-4                          |

---

## 6. Migration strategy — expand/contract only (no redesign, no outage)

1. **Expand**: add `GovernedObject` columns/sidecar tables additively; dual-write new fields; no
   reads change yet. Reverse SQL documented. Run as ACA jobs (private DB unreachable from laptops).
2. **Backfill**: deterministic, idempotent, run-keyed; dry-run report first; readiness computed
   (committed/indexed/retrievable/cited).
3. **Cutover reads**: `buildValidatedAgentContextBundle` reads the governed model; agents migrate
   Sentinel→Nexus→Source→Atlas→Tower.
4. **Contract**: once all reads use the governed model, remove the Supabase fallback + the
   `postgresCompat` bridge; CI gates lock it.
   Each step is its own PR, additive, reversible, CI-green before merge.

---

## 7. Open decisions for founder

1. **RLS now or phase 2?** RLS is the strongest isolation floor but touches every query path —
   recommend phase-2 (after the governed bundle + app-level scoping are proven) to avoid a big-bang.
2. **Signals plane scope** — fold into this initiative now (same contract) or as a fast-follow?
3. **Client private-data-plane** — when does the first client move to a dedicated client-prod
   subscription (vs the shared lab)? That sets how soon the cross-subscription boundary is needed.
4. **Compat-bridge retirement window** — aggressive (block new `.from()` now) vs gradual.
