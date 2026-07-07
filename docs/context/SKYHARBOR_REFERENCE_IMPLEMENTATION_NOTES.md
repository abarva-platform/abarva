# SkyHarbor Reference Implementation Notes (Phase 0)

_Context Layer Factory remediation — reference study before building Lakeshore / Apex / Meridian._
_Authored 2026-06-10. Source: code study of the SkyHarbor substrate + governed context-layer loaders._

## TL;DR — what we replicate, and the one trap we must NOT replicate

SkyHarbor produced a deterministic, template-aligned, 15-segment enterprise substrate and ran it
through a governed Azure load. **However, SkyHarbor's _live DB_ result was chunks-heavy**: the
loader it wired up (`scripts/seed/load-tenant-substrate.ts`) commits `enterprise_context_chunks`
in bulk but **skips structured `enterprise_context_records` / `enterprise_context_facts`** (Phase 1
source-files skipped on an FK constraint; records/facts live only as dataset files). Live audit:
~480 chunks but only ~10 facts / ~2 records. **That is exactly the "stopped at chunks" failure this
lane must avoid.**

➡️ **Decision (deviation, justified):** This lane uses the **governed structured-fact loader**
`src/scripts/enterprise-context/load-enterprise-context.ts` (+ template registry + per-client
ingestion plan, cf. `src/lib/enterprise-context/ingestion/meridian-loader.ts`), which writes
`sources → source_files → records → facts → chunks` with `fact_key` / `value_hash` /
`lifecycle_state` supersede semantics. We keep SkyHarbor's **generator discipline** (determinism,
templates, manifest, verification gates, Blob staging, independent DB verification) but route the
commit through the records+facts path, not the chunks-only path.

## Phase-0 answers

1. **Generator pattern.** `scripts/skyharbor/generate-skyharbor-substrate.mjs` (~90 KB) is a
   deterministic 7-stage pipeline (briefs → templates → source uploads → records → graph → chunks →
   verification). Hardcoded `CLIENT_ID` / `CLIENT_KEY` / `TODAY`; stable IDs via
   `stableId(prefix, sha(seed))`; no RNG. Each of 15 segments emits
   `records/json/<slug>.json`, `records/csv/<slug>.csv`, `templates/schemas/<slug>.schema.json`,
   `briefs/<slug>.brief.md`, plus synthetic `source_uploads/*`.

2. **Templates / dimensions.** 15 segments (S01 enterprise_profile … S15 sourcing_pipeline), each
   with a JSON-schema (`required: client_id, client_key, segment_id, data_basis,
   source_artifact_path, approval_status, confidence`; `additionalProperties:true` for
   segment-specific fields) + ontology/controlled-vocabulary YAML. ~645 records total.
   **For the governed loader, the authoritative templates are the runtime template registry**
   (Meridian already has 26 healthcare templates registered) — `record_type` must match a
   registered template key.

3. **Caps.** No hard file-size cap in code; records insert in **batches of 100**; embeddings run at
   configurable concurrency (default 6). Practical guidance: keep per-dimension CSVs to enterprise-
   credible row counts (tens–low-hundreds), multi-file by dimension, manifest-listed.

4. **Manifest.** `manifest.yaml`: `name, client_id, client_key, generated_at, segments,
   record_count, chunk_count, policy`. Files discovered by convention; verifier asserts per-segment
   artifacts exist. The governed loader additionally reads a `manifest.json` + per-file template
   declarations.

5. **Loader path.** SkyHarbor wired `scripts/seed/load-tenant-substrate.ts` (chunks-mostly,
   5 phases, idempotent). **We instead use** `src/scripts/enterprise-context/load-enterprise-context.ts`
   which routes each dataset file → `record_type`(template) → records → per-column facts → chunks,
   upserting on stable keys.

6. **Records / facts / chunks writes (governed path).** Upsert keys:
   sources `(tenant_key, source_system, source_key)`; source_files `(tenant_key, source_file_id)`;
   records `(tenant_key, canonical_record_id)`; facts `(tenant_key, record_id, fact_key,
   value_hash)`; chunks `(tenant_key, chunk_id)`. One fact per non-common column per row.

7. **Supersede (not duplicate).** New fact with same `fact_key` but new `value_hash` is inserted
   `lifecycle_state='active'`; the prior active fact is set `lifecycle_state='superseded'`,
   `supersedes_fact_id=<new>`. Records carry the same lifecycle + `superseded_by_record_id`.
   Re-ingest of identical `(tenant_key,record_id,fact_key,value_hash)` is a no-op (idempotent).

8. **Blob staging.** SkyHarbor's wired loader skipped source-file rows / Blob; provenance was kept
   only in chunk columns. **Deviation (justified):** this lane stages originals to Azure Blob and
   commits `enterprise_context_source_files` so facts are citation-ready
   (`source_file` + `evidence_pointer`). Convention:
   `clients/<client_id>/<dataset>/<dimension>/source_uploads/<file>`.

9. **DB verification.** Independent counts (`db-substrate-audit`), RLS cross-tenant zero-leak check,
   fact-fingerprint check, ground-truth runner. We replicate with a read-only ACA probe that counts
   by table × tenant_key × dimension × lifecycle_state and checks orphan/duplicate-active facts.

10. **What stayed gated after SkyHarbor load.** Azure AI Search **indexing** of facts/chunks,
    **promotion** to `agent_ready`, and **context-bundle proof** (real retrieve→cite→answer) were
    NOT done. Those are explicit phases in this lane.

## Source-basis / confidence / classification conventions
`data_basis ∈ {public_anchor, synthetic_comparable, generated_assumption, user_supplied_future}`;
confidence ≈ 0.92 (public_anchor) / 0.88 (synthetic); `approval_status ∈ {approved_synthetic,
pending_customer_approval, rejected, superseded}`. Governed tables use `lifecycle_state ∈
{active, superseded, inactive}`, `confidence NUMERIC(4,3)`, `freshness_status`, `classification`.

## Acceptance (Phase 0)
Understanding demonstrated; the single material deviation (governed records+facts loader instead of
the chunks-only loader SkyHarbor happened to wire) is explicitly justified by this lane's hard rule
"do not stop at chunks."
