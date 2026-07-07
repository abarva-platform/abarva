# Context Framework — Current-State Discovery (Workstream 0)

**Date:** 2026-06-09 · **Branch:** `ctx-framework` (clean worktree off `origin/main` @ #3356)
**Purpose:** Gate all code changes. Map what already exists so the framework is
**extended, not rebuilt**. No code is changed in this PR.

> This workstream **extends** the existing governance lane tracked in
> `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md` +
> `docs/governance/context-corpus-enforcement-tracker.json`. It does **not**
> create a new tracker or a new promotion evaluator.

---

## 1. Existing promotion evaluator (EXTEND — do not duplicate)

- **`src/lib/governance/promotion-evaluator.ts`** — pure
  `evaluatePromotion(row: ReadinessRow) → PromotionEvaluation`. Mirrors the
  canonical gates in `evaluateGovernedObject` / `computeProposedReadiness`.
  - **10 criteria** (policy_valid, tenant_scoped, classification_allowed,
    source_basis_present, confidence_present, provenance_present,
    indexed_or_retrievable [`fts_indexed`|`search_indexed`], citation_renderable
    [`cited_render_verified_at` not null], applicable_agents_valid).
  - **Recommendation ladder:** `block → restricted → gap(not_reviewed) →
    not-indexed → not-cite-rendered → agent_ready`. Outputs one of
    `agent_ready | restricted | blocked | remain_not_reviewed`.
  - **Gap:** there is **no explicit `promotion_candidate` state** — rows that are
    committed and eligible-but-unapproved collapse into `remain_not_reviewed`.
    The brief's `promotion_candidate` concept is an **extension point** here
    (committed + criteria-met-but-awaiting-governed-approval), not a new system.
- **`src/lib/governance/promotion-preview-render.ts`** → renders
  `docs/governance/AGENT_READY_PROMOTION_PREVIEW_2026-05-09.md` (totals, by
  recommendation/tenant/object-type, failure reasons, SkyHarbor section, top-25
  recommended/blocked, a NOT-executed SQL plan). **Extend this report format.**
- **`src/lib/governance/context-corpus-policy.ts`** — canonical authority:
  enums `AGENT_READINESS` (7), `RETRIEVABILITY` (4; retrievable =
  {`fts_indexed`,`search_indexed`}), `CLASSIFICATIONS`, `SOURCE_LAYERS`,
  `APPLICABLE_AGENTS`; `GovernedObject` Zod schema; `evaluateGovernedObject`;
  `isAgentUsable`; `isCanonicalClientKey`.
- **`src/lib/governance/agent-context-bundle.ts`** —
  `buildValidatedAgentContextBundle` (the only seam agents may consume).
- **Sidecar table** `public.governed_object_readiness`
  (migration `20260608160000_governed_object_readiness.sql`): unique
  `(object_table, object_id, client_key)`; holds readiness/retrievability/
  classification/source_basis/confidence/provenance/cited_render_verified_at/
  policy_validation_status. Backfilled async by
  `src/scripts/governance/readiness-backfill.ts` (defaults `not_reviewed` /
  `committed_not_indexed`, never sets `cited_render_verified_at`).

**Conclusion:** the promotion contract, policy authority, readiness sidecar, and
preview report all exist. Workstream F extends `promotion-evaluator.ts` +
preview, adding an explicit `promotion_candidate` surface — no new evaluator.

---

## 2. Governance trackers + CI validators (USE — do not duplicate)

- Trackers: `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`
  (human) + `docs/governance/context-corpus-enforcement-tracker.json` (machine).
  PRs #3328–#3336 closed the original 9-slice governance lane.
- CI validators (`npm run validate:context-corpus[:...]`): `exceptions`,
  `tenant-coverage`, `agent-readiness` (no code mints `agent_ready` outside the
  policy seam), `duplicates` (enums defined once), `manifests`. Implemented in
  `src/scripts/governance/validate-context-corpus.ts`. **New validators in this
  brief (`validate:fact-duplication`, `validate:context-coverage`) are added
  here, registered alongside these.**
- Manifest policy: `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md` +
  `DATASET_POLICY_MANIFEST_TEMPLATE.json`; `docs/governance/dataset-manifests/`
  currently holds only a README — **no per-tenant manifests exist yet**.

---

## 3. Current Admin bulk ingestion path (EXTEND)

- **UI:** `src/components/admin/context-layer/CsvUploadConnector.tsx`; admin
  pages `src/app/(maestro)/admin/context-layer/{uploads,templates,approval-queue}/`.
- **API:** `src/app/api/admin/context-layer/csv-upload/route.ts` (single file,
  5MB) and `src/app/api/admin/context-layer/bulk-upload/route.ts`
  (manifest-driven multi-file; modes `validate_only|stage_and_enqueue|stage_and_process`).
- **ZIP:** **already implemented** — `bulk-upload/route.ts` unpacks a ZIP (≤25MB,
  5MB/file), reads `manifest.json`/`bulk-manifest.json`, extracts files. So the
  contract is **manifest-driven loose multi-file AND ZIP**. (Do not *newly*
  claim ZIP; do confirm/validate the existing path end-to-end before relying on
  it as governed.)
- **Lib:** `src/lib/context-ingestion/csv-upload-connector.ts` (parse CSV/JSON/
  JSONL/YAML → chunks + structured promotion), `bulk-context-upload.ts`
  (manifest, ZIP, blob staging, Service Bus enqueue), `template-registry.ts`
  (PHS 23 + Meridian 54+ templates: enterprise_profile, financial_kpis,
  org_roles, erp_landscape, vendor_contracts, …), `file-classifier.ts`,
  `approval-queue.ts`, `tenant-context-read-model.ts`,
  `admin-structured-context-promotion.ts` (commits structured facts).
- **Write target tables:** `enterprise_context_sources`,
  `enterprise_context_source_files`, `enterprise_context_records`,
  `enterprise_context_facts`, `enterprise_context_chunks`; segment baselines in
  `data_inventory_records`.

**Conclusion:** the template-driven Admin bulk path (incl. ZIP) exists. Workstream
A registers canonical per-dimension templates in the existing registry; Workstream
C makes synthetic tenants flow through this same path; no new uploader.

---

## 4. Idempotency / duplication — current behavior (the critical finding)

Verified directly from source:

| Layer | Code | Same file re-upload | One value changed | Filename changed (same content) |
|------|------|---------------------|-------------------|---------------------------------|
| sources / source_files | `.upsert(onConflict: tenant_key,source_system,source_key)` / `(…,source_file_id)` | update in place ✓ | update ✓ | new source_file_id → new rows ⚠ |
| records | `.upsert(onConflict: tenant_key,canonical_record_id)` | update ✓ | update ✓ | new `canonical_record_id` → **duplicate records** ⚠ |
| **facts** | `.upsert(onConflict: tenant_key,record_id,fact_key,value_hash)` | no-op ✓ | **NEW row** (new `value_hash`); old fact stays `lifecycle_state="active"`, `supersedes_fact_id` **not set** → **two active rows for one logical fact** ❌ | duplicate ⚠ |
| **chunks** | plain `.insert(batch)` into `enterprise_context_chunks`; `chunk_id = csv:${tenant}:${file}:${fileHash}:row-${n}` | **duplicate-key FAILURE** (insert, not upsert) ❌ | fileHash changes → new chunk_ids, **old chunks orphaned** ❌ | duplicate ⚠ |
| Azure AI Search | corpus path uses `mergeOrUpload`; **tenant chunk → search path has no dedup/merge guard** | possible dup | possible dup | possible dup |

**Verdict (today):** records/facts/sources **upsert**, but (a) a **changed fact
creates a second active row** for the same `fact_key` (no supersede), (b)
**chunks duplicate or fail** on re-upload (deterministic chunk_id + plain
insert), and (c) **filename changes duplicate** records/facts/chunks. There is
**no `load_batch_id`, no `is_current`** (lifecycle uses `active|superseded|
inactive` but supersede is not auto-driven), and **no content-hash dedup on
chunks**. Columns that exist to help: `payload_hash` (records), `value_hash`
(facts), `file_hash` (source files, unused for chunk dedup),
`superseded_by_record_id` / `supersedes_fact_id` (present, not auto-populated).

**Conclusion:** Workstream B implements deterministic logical-fact identity +
supersede (`is_current` via lifecycle), content-stable chunk ids, chunk upsert,
search-doc dedup, and `load_batch_id`; plus `validate:fact-duplication`.

---

## 5. Current answerability derivation (REPLACE with measured)

- **Hardcoded constants:**
  - `src/lib/agent-golden/suites.ts` — `expectedAnswerability` literals at lines
    46/56/66/76/86/96/106/116/126/136/146 (all `PARTIALLY_ANSWERABLE` except
    `industry_corpus`=FULLY, `missing_unsupported`=NOT_LOADED).
  - `src/lib/agent-domain-matrix/matrix.ts` — literals at lines
    48/55/62/69/76/83/90/97/104/111 (mostly PARTIALLY; `benchmark_pattern`=FULLY,
    `missing_evidence`=NOT_LOADED).
- **Existing data-state machinery to derive from (reuse):**
  - `src/lib/knowledge/coverage.ts` (`CoverageStatus` full|partial|missing,
    `QuestionCategory`→required/optional segments), `coverageReport.ts`.
  - `src/lib/governance/tenant-coverage.ts` +
    `src/scripts/governance/tenant-coverage-report.ts`.
  - `governed_object_readiness` (agent_readiness_status + retrievability +
    cited_render_verified_at) — the four-state truth.

**Conclusion:** Workstream D derives answerability from
coverage + governed readiness + the live trace (retrieval/citation), removing the
constants. Statuses: ANSWERED_AND_GROUNDED / CONTENT_GAP / INGESTION_GAP /
INDEXING_GAP / RETRIEVAL_GAP / CONTEXT_BUNDLE_GAP / CITATION_RENDERING_GAP /
CLAIM_SUPPORT_GAP / NOT_LOADED / NOT_TESTED.

---

## 6. Lakeshore — current source locations (RECONCILE, not empty)

Lakeshore is **canonical and richly loaded** — correcting the earlier "no
dataset" statement.

- Canonical key `lakeshore-holdings` (industry `diversified`) in
  `src/config/tenants/CANONICAL_TENANTS.ts`; runtime tenant key `lakeshore`.
- Artifacts under **`docs/build/lakeshore/`**: `loaded/` (18 CSV data files /
  1,329 records, 21 documents, load-runs, how-to, review-bundle ZIP, workbook,
  `manifest.json`, `CORPUS_COVERAGE_MAP.md`), `current-state-load-v2/` (13 CSVs +
  `manifest.json`/`manifest.production.json`), `agent-grounding/`,
  `loader-hardening/`, and audits `LAKESHORE_LIVE_DATA_AUDIT_2026-06-05.md`,
  `LAKESHORE_PRIVATE_PLANE_VECTOR_PROOF_2026-06-06.md`.
- Audited live state: 1,329 context records across 9 segments;
  `lakeshore-patterns-v1` Azure Search index ~8,987 docs; 12 Kyriba treasury
  patterns vector-proven; 2 source events; 6 Moves; personas Meera Rao (CIO),
  Daniel Whitaker (CFO).
- **No `datasets/lakeshore*` directory.** Lakeshore did NOT flow through the
  canonical `datasets/<tenant>-synthetic-v1/` template path.

**Conclusion:** Workstream E **reconciles/migrates** Lakeshore's existing loaded
CSVs + manifests into the canonical template-governed `datasets/` path and the
governed Admin bulk flow — preserving its proven load — rather than treating it
as empty.

---

## 7. SkyHarbor executive identity mismatch (REMEDIATE/TRACK)

`datasets/skyharbor-air-synthetic-v1/records/json/executive_decision_map.json`
(agent-retrievable) vs `src/lib/auth/canonical-auth-roster.ts` (auth personas)
disagree: only **CIO Amala Rao matches**. CFO (Marisol Chen vs Mara Chen), CTO
(Evan Kline vs Victor Hale), COO (Tara Whitcomb vs Darius King), CISO (Owen
Mercer vs Nadia Sethi) differ; 6 decision-map execs are absent from the roster.
An agent answering "who is the CTO?" can contradict the signed-in identity.
Workstream G reconciles to one canonical exec set or tracks it explicitly.

---

## 8. Workstream plan confirmation (no duplication)

| WS | Action | Reuses |
|----|--------|--------|
| A | Canonical `CONTEXT_FRAMEWORK_v1` spec + register per-dimension templates | `template-registry.ts`, 16-domain taxonomy |
| B | Deterministic fact identity + supersede + chunk/search dedup + `validate:fact-duplication` | `enterprise_context_*` upsert paths, existing hash cols |
| C | Route synthetic + pilot loads through existing Admin bulk path | `bulk-upload/route.ts`, `csv-upload-connector.ts` |
| D | Derive answerability (remove constants) | `knowledge/coverage.ts`, `governed_object_readiness`, agent-trace |
| E | Reconcile/migrate Lakeshore + other tenants into `datasets/` template path | `docs/build/lakeshore/*`, datasets/ |
| F | Extend `promotion-evaluator.ts` with `promotion_candidate` + preview | `promotion-evaluator.ts`, `promotion-preview-render.ts` |
| G | Context-bundle proof for Nexus/Sentinel + SkyHarbor exec fix | `agent-verification`, `buildValidatedAgentContextBundle` |

**Acceptance for Workstream 0:** clean worktree off origin/main ✓; existing
evaluator/trackers/bulk-path/Lakeshore/idempotency/answerability located ✓; no
duplicate evaluator or tracker created ✓; no code changed in this PR ✓.
