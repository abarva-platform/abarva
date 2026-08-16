# Unified spine — layer-by-layer build spec

**Status:** design for execution. One integration pipeline, all client inputs, all products.
**Replaces:** three independent supply chains (client intake, operational telemetry, corpus).
**Rule:** a new source is a *binding*. A new product is a *projector*. Neither is a new pipeline.

Each layer below states its input, process, output, the physical pipeline, and what must be true
before the layer is considered done. Layers are numbered in dependency order — L1 must be real
before L2 means anything.

---

## L1 · Intake

Every origin enters the same way. The collector differs; the contract does not.

| | |
| --- | --- |
| **Input** | Client spreadsheets (24–26 tabs, monthly) · operational APIs (Jira, Azure Cost, ServiceNow CMDB/ITSM, Workday HCM, GitHub DORA, Copilot, Cursor, Claude Code, ERP) · documents (contracts, evidence PDFs) |
| **Process** | Each source resolves to one **binding** declaring: collector kind (`file` \| `api` \| `document`), tenant, cadence, the canonical types it can produce, and the **basis** it asserts (`declared` \| `observed`). Collector runs, lands raw payload unmodified, stamps `source_binding_id` + `collected_at` + `load_run_id`. |
| **Output** | Raw landing records, one per source per run, byte-identical to what arrived. Plus a shape-validation report per binding. |
| **Pipeline** | ACA Job per binding kind. File collectors read `datasets/tenant-inputs/active/<tenant>/current/`. API collectors are the existing `src/scripts/tower/ingest-*.ts`, rehomed to land here instead of `public.tower_*`. Raw payloads to Blob; landing records to Postgres. |
| **Done when** | Every existing source — 26 tabs + 10 API adapters — is a registry entry. `bindings declared == bindings landing` is a reportable number. |

**Design notes.** Never edit an inbound file: corrections are declared transformations downstream,
so any historical answer can be rebuilt. Identity is declared in the binding, never inferred from a
folder name or an API account.

**Build order.** The binding registry interface first, then rehome exactly one API collector as
proof the contract holds for a non-file origin. Do not rehome all ten before the first one is proven.

---

## L2 · Adapters

| | |
| --- | --- |
| **Input** | One landing record from one binding. |
| **Process** | Map source fields to canonical fields; coerce types; normalise units, currencies and dates; attach an evidence pointer (binding, file or endpoint, row or record id). No joins. No inference. No identity resolution. |
| **Output** | Typed records carrying provenance and the binding's asserted `basis`. |
| **Pipeline** | In-process TypeScript, no store. One adapter module per binding, all conforming to a single `Adapter` interface so the runner is source-agnostic. |
| **Done when** | Every binding has an adapter, and adapter coverage is reported per tenant (today: 96 of 100 domains available, `source_event_pack` missing on four tenants). |

**Design notes.** Adapters stay deliberately dumb. The moment an adapter starts resolving names to
IDs, that logic exists in N places and disagrees with itself. Thin adapters, thick canonical.

---

## L3 · Canonical model

The narrow waist. The only place identity is decided.

| | |
| --- | --- |
| **Input** | Every adapter's typed records, for one tenant, in one run. |
| **Process** | **Identity** — resolve aliases to one object, mint IDs once and persist them (never hash from a name; a corrected spelling would detach every historical reference). **Facts** — write each with `basis`, so declared and observed coexist rather than overwrite. **Relationships** — resolve endpoints against the object registry; normalise verbs through the relationship-type dictionary. **Quarantine** — hold what does not resolve, with a reason. |
| **Output** | 19 object types · ~6,198 records per two tenants · 1,751 graph nodes · 5,556 edges · quarantine report · one `load_run_id` for the whole run. |
| **Pipeline** | `scripts/data-build/refresh-runtime-layers.ts` as an ACA Job, writing `intelligence_v6.*`. Dry-run default; writes need explicit approval env vars. |
| **Done when** | Telemetry lands here as `observed` facts alongside `declared` ones, and variance is computable rather than a question nobody can answer. |

**The `basis` dimension — the change that makes one model hold both chains.**

```
spend_value_fact
  basis = declared   source: client 08_spend_value.csv        $44M
  basis = observed   source: ingest-azure-cost                $51M
  basis = derived    variance, computed from the two          +16%
```

Both are true. Neither overwrites the other. The variance becomes a product feature rather than a
data problem — *"you believe you spend $44M; your infrastructure billed $51M; here is the 16% you
are not tracking"* is worth more than either number alone.

**Non-negotiables.** Never create a node to satisfy an edge. Quarantine rate is an error budget,
watched, not filtered out — currently 1.14%.

---

## L3.5 · Derived intelligence

Generated *from* canonical, never assembled beside it. This is the layer that folds the corpus into
the spine.

| | |
| --- | --- |
| **Input** | The canonical model for one `load_run_id`. |
| **Process** | Materialise graph nodes and edges. Compute derived facts including cross-basis variance. Generate **chunks from canonical objects and their evidence**, each carrying its `canonical_object_id` and `load_run_id`. Embed chunks. |
| **Output** | `intelligence_v6.graph_*` · derived fact rows · chunk rows · vectors in Azure AI Search. |
| **Pipeline** | Same ACA Job run as L3, same run id. Search index written after Postgres commits, so Postgres is never behind the index. |
| **Done when** | Every chunk resolves to a canonical object, so every citation an agent returns points at a thing the products also display. |

**Why this matters more than it looks.** Today the corpus is assembled on its own track: a chunk can
be indexed and retrievable without resolving to any canonical object, so a citation points at *text*
rather than at a *thing*. Deriving chunks from canonical means an agent and a screen can no longer
disagree, because they resolve to one record — and it makes the four states checkable end to end:
loaded → indexed → retrievable → cited.

---

## L4 · Projections

| | |
| --- | --- |
| **Input** | The canonical model — and nothing else. A projector that reads L1 directly will drift from every other product. |
| **Process** | Shape canonical facts for one product's questions. Stamp every projected row with `load_run_id`. Register in the projector registry, declaring consumed types. |
| **Output** | Product read models (`source.*`, `tower.*`) and cube views (`consumption.*_v1`, 46 today). |
| **Pipeline** | One registered projector per product, run in the same job as L3 so all products share one run id. |
| **Done when** | `validate:projection-coverage --strict` passes: every canonical type reaches a product, every surface has a projector reading canonical. |

**Current state, from the gate shipped in [#6450](https://github.com/abarva-platform/abarva/pull/6450):**

```
canonical types      : 19
reaching a product   : 2  (11%)
surfaces on spine    : source
surfaces off spine   : home, tower, moves, intelligence
```

**Design notes.** Projections are disposable — you should be able to drop and rebuild every L4 table
without losing information. If you cannot, something is being *stored* at L4 that belongs at L3.

---

## L5 · Serving

| | |
| --- | --- |
| **Input** | Cube views (structured surfaces) · derived chunks + vectors (agents). |
| **Process** | **Structured** — Source 360, Tower, Home query cube views directly. No retrieval, no model. **Conversational** — aVa agents run hybrid retrieval: Postgres keyword and Azure vector in parallel, merged by reciprocal rank fusion, filtered through the context broker, then Claude writes narrative over numbers it did not compute. |
| **Output** | Rendered surfaces and cited answers. |
| **Pipeline** | Next.js routes with read-only credentials. All agent context through `src/lib/knowledge/agent-context-broker.ts`. |
| **Done when** | Every aVa agent — Nexus, Sentinel, Atlas, Steward — retrieves over the same derived corpus and cites the same objects the products display. |

**Boundaries that must hold.** Claude owns narrative, never arithmetic. The graph explains
dependencies, never calculates money. Read models and metric tables own values.

---

## The end-to-end test

One run produces one `load_run_id`, and that id appears on every canonical record, every product
projection, every chunk, and every citation the agents return. Then one question becomes answerable:

> **Are Home, Tower, Source, Moves and aVa all describing the same build?**

Today that question has no answer, because no shared identifier spans them. That — not duplication —
is the real cost of three chains.

---

## Build sequence

Each step is independently shippable and makes the next one smaller.

| # | Step | Unblocks | Status |
| ---: | --- | --- | --- |
| 1 | Projector registry + coverage gate | Makes the gap enforced rather than described | **shipped — [#6450](https://github.com/abarva-platform/abarva/pull/6450)** |
| 2 | Source binding registry interface | An API becomes just another intake | next |
| 3 | Rehome one API collector to land in canonical | Proves the binding contract holds for non-file origins | |
| 4 | Add `basis` to fact types | Declared and observed coexist; variance computable | |
| 5 | Rehome remaining collectors; rewire `project-tower-mart` to read canonical | Tower joins the spine | |
| 6 | Derive chunks from canonical | Agents cite objects; four states checkable | |
| 7 | `--strict` becomes the default | Coverage regressions fail the build | |

**The failure mode to avoid:** building the unified spine *beside* the three existing chains, which
would leave four. Every step above moves an existing component onto the spine rather than adding a
parallel one.

**Do not start with step 5.** Rehoming ten collectors before the binding contract is proven on one
is how this becomes a six-week branch that never merges.
