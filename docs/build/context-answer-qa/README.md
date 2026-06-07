# Grounded CXO Answer-Quality Audit — Azure runtime (2026-06-07)

Audit of whether Sentinel/Nexus can answer executive questions from the **Azure**
data plane (the runtime DB `abarva_control`), post-activation of `main@70c4f98bf`.
Method: real `askIntelligence` run headless inside the private operator job
(`NODE_OPTIONS=--conditions=react-server` + the new image), Azure Postgres + Azure
Search only. No Supabase. No secret values printed.

## Headline

The Azure cutover migrated the **pattern/genome layer** but **not** the
**enterprise context fact layer**. As a result:

- **Pattern/treasury/decision-pattern questions are answerable** where the corpus is
  loaded (Lakeshore strong).
- **All "CXO fact" questions — named executives, org structure, current data &
  analytics stack, applications/systems, vendors/contracts, KPIs — are `NOT_LOADED`
  for every client**, because `enterprise_context_*` does not exist in `abarva_control`.

This is an **ingestion / data-migration gap**, not a retrieval or answer-quality bug.
Retrieval + Anthropic synthesis are healthy: answers are grounded where data exists,
and **the model correctly refuses to hallucinate** missing facts (zero
`SYNTHETIC_MISLABEL`, zero fabricated execs/stacks observed).

## Three-layer truth (loaded vs visible vs answerable)

| Layer | Where | In Azure runtime? | Effect |
|---|---|---|---|
| `corpus_patterns` (9,026) · `genome_patterns` (43,436) · `intelligence_graph_edges` (93,743) | Azure `abarva_control` | ✅ | Pattern questions answerable |
| `applications` (232, likely `is_demo_data`) | Azure | ✅ (synthetic) | Demo systems only |
| **`enterprise_context_*`** (records/**facts**/chunks/sources — execs, org, systems, vendors, KPIs, current-state stack) | **Supabase only** | ❌ **absent** | **All CXO fact questions `NOT_LOADED`** |

> Earlier this session, `enterprise_context_facts` (e.g. Meridian's ~38,640 facts incl.
> Epic Clarity / SQL Server / Tableau / SAS) was read from **Supabase**. It was never
> migrated to Azure. **Supabase therefore must NOT be retired** — it holds the only copy
> of this layer.

## Live probe evidence (real `askIntelligence`, Azure runtime)

| Client | Dimension | Classification | Evidence |
|---|---|---|---|
| Lakeshore | corpus patterns (Kyriba/treasury) | **FULLY_ANSWERABLE** | 8 sources, all real Kyriba patterns |
| Lakeshore | execs / data-analytics stack | **NOT_LOADED** | "aren't in the loaded tenant data"; refused to fabricate |
| Apex | execs / data-analytics stack | **NOT_LOADED** | "neither org-structure nor systems-inventory is ingested" |
| Apex | corpus patterns (forecasting/contact-center) | **PARTIALLY_ANSWERABLE** | 1 corpus source + model reasoning |
| Meridian | execs / data-analytics stack | **NOT_LOADED** | refused to name CEO/CFO or invent stack |
| Meridian | corpus patterns (clinical) | **RETRIEVAL_FAILURE / NOT_LOADED** | 0 sources; "reasoning from domain expertise, not a loaded corpus match" |

(Universality: because `enterprise_context_*` is absent platform-wide, the fact-layer
classification `NOT_LOADED` applies to **all 9 clients**; Morgan St / SkyHarbor / etc.
are not separately probed because the schema settles the outcome.)

## Recommended fixes by lane

- **Ingestion / data-load (PRIMARY):** migrate the `enterprise_context_*` layer from
  Supabase → Azure `abarva_control` (or governed re-ingest via the Admin bulk loader,
  with parity proof). This unblocks every CXO fact question. **Until then, keep Supabase.**
- **Retrieval / indexing:** Meridian/Apex pattern coverage is weak vs Lakeshore — verify
  per-tenant genome/corpus coverage + that retrieval queries the populated index.
- **Answer-prompt / synthesis:** no fix needed — Anthropic-only, grounded, fail-closed,
  non-hallucinating. (Keep.)
- **Binder / pattern-validation:** grounding-scoped guard (#3268) in place; no new issue.
- **Tenant isolation:** resolve clients by `tenant_key` (Meridian = "Healthcare Composite
  Demo Tenant" row `6e419b6e`; its facts loaded under a different id/key) so the audit
  doesn't mis-scope once the fact layer is migrated.

See `coverage-matrix.csv`, `failure-register.csv`, `results.json`.
