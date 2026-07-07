# 2026-06-17-first-capital-context-engine-build-brief — First Capital Financial V2 Dataset + Context Engine Build Brief

## Release ID

`2026-06-17-first-capital-context-engine-build-brief`

## Status

`candidate`

## Plain-English Summary

Generates the complete First Capital Financial synthetic dataset in the 6-family / 19-dimension universal context model (22 base files + 10 AI Control Tower supplement files + 151-edge property graph = 33 files total), and delivers a Codex execution brief that drives the 5-phase engineering build: schema migration, admin loader extensions, Azure Blob persistence, ACA seed job, and golden-question smoke tests. No production DB changes have been made yet — this release covers dataset generation and the engineering plan. The actual DB load and schema migration are executed in follow-on phases documented in the brief.

## Layer Impact

- **client-data-lane**: First Capital Financial synthetic dataset files generated locally under `datasets/first-capital-financial-synthetic-v2/`. Generator scripts in `scripts/seed/`. No DB writes yet — DB changes are planned in Phase 0 (schema migration) and Phase 2 (ACA load job) of the execution brief.
- **global-control-lane**: `src/lib/context-ingestion/types.ts` and `src/lib/context-ingestion/template-registry.ts` updated with 6-family dimension types and universal template definitions. These changes apply to all tenants but add capabilities, no behavior removal.

## Client Applicability

- Specific clients: First Capital Financial (tenant_key=`first-capital`) is the target data tenant for this dataset.
- All clients: The 6-family type additions to `types.ts` and `template-registry.ts` are universal framework changes — no per-tenant gating needed.

## Changes Included

- `scripts/seed/generate-first-capital-v2.mjs` — CREATED: generates 22 base dimension files for First Capital Financial across all 6 dimension families (F01–F17 + D19 + graph)
- `scripts/seed/generate-first-capital-tower-supplement.mjs` — CREATED: generates 10 AI Control Tower supplement files (T01–T10, 167 rows: milestones, benefit realization, Copilot by function, ERP/platform agents, ServiceNow metrics, function productivity scorecard, model risk inventory, AI spend, risk register, gate approval history)
- `datasets/first-capital-financial-synthetic-v2/` — CREATED: 33 files (22 dimension files + 10 Tower supplement files + manifest + verification)
- `src/lib/context-ingestion/types.ts` — MODIFIED: added 6-family dimension types, `ContextDimensionFamily`, `DomainSegment`, `DIMENSION_FAMILY_MAP`; fixed `tenantKey` hardcode in `ExtractedContextFact`
- `src/lib/context-ingestion/template-registry.ts` — MODIFIED: added `UNIVERSAL_CONTEXT_TEMPLATES` (19 templates), `family`, `loadOrder` fields to `ContextTemplateDefinition`
- `docs/codex-handoff/FIRST_CAPITAL_CONTEXT_ENGINE_BUILD_BRIEF.md` — CREATED: 5-phase engineering execution brief for Codex
- `docs/releases/records/2026-06-17-first-capital-context-engine-build-brief.md` — CREATED: this record

## QA / Validation

Status: PASS (dataset generation) / NOT-RUN (DB migration, ACA load, golden questions)

- PASS: `node scripts/seed/generate-first-capital-v2.mjs` — ran clean; 22 files generated; verified F01–F17 + D19 + graph structure
- PASS: `node scripts/seed/generate-first-capital-tower-supplement.mjs` — ran clean; 10 files generated; 167 Tower rows confirmed
- PASS: Verified 33-file manifest structure matches `datasets/first-capital-financial-synthetic-v2/manifest.yaml`
- NOT-RUN: TypeScript typecheck (`npx tsc --noEmit`) — types.ts + template-registry.ts reviewed via IDE; full typecheck runs in Phase 0 PR
- NOT-RUN: DB schema migration — Phase 0 of execution brief
- NOT-RUN: ACA load job — Phase 2 of execution brief
- NOT-RUN: Golden questions smoke test — Phase 4 of execution brief

## Rollout Plan

This release itself has no runtime rollout — it is dataset generation + planning artifacts. Rollout is phased:

1. **Phase 0 (schema migration)**: PR with `supabase/migrations/20260618000000_dimension_family_columns.sql` → ACA job `job-abarva-db-migrate-lab-eastus` → verify in Log Analytics
2. **Phase 1 (loader extensions)**: PR with `context-commit.ts` rewrite + `yaml-loader.ts` + `jsonl-graph-loader.ts` + `blob-stager.ts` + new manifest-load route → merge after typecheck + integration test pass
3. **Phase 2 (First Capital ACA load)**: `scripts/jobs/load-first-capital-v2.ts` → ACA job → Log Analytics confirmation → golden questions smoke test
4. **Phase 3 (Explorer visibility)**: Admin UI dimension family grouping + blob URL links → merge + deploy


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Dataset files are in `datasets/` — git revert removes them. No DB changes yet; schema migration rollback in Phase 0 is: `ALTER TABLE enterprise_context_records DROP COLUMN dimension_family, DROP COLUMN domain_segment, DROP COLUMN business_function, DROP COLUMN load_order;` and `DROP VIEW ai_control_graph_view;`. Data load rollback is: `DELETE FROM enterprise_context_* WHERE tenant_key = 'first-capital'` (safe, additive only, no data existed before).

## Audit Evidence

- Generator output: `datasets/first-capital-financial-synthetic-v2/` (33 files in git)
- Verification file: `datasets/first-capital-financial-synthetic-v2/99-verification/expected-row-counts.json`
- Golden questions: `datasets/first-capital-financial-synthetic-v2/99-verification/golden-questions.json`
- Tower supplement counts: `datasets/first-capital-financial-synthetic-v2/99-verification/tower-supplement-counts.json`
- Engineering brief: `docs/codex-handoff/FIRST_CAPITAL_CONTEXT_ENGINE_BUILD_BRIEF.md`

## Context Ingestion Evidence

- Local artifact generated: ✓ 33 CSV/YAML/JSONL files in `datasets/first-capital-financial-synthetic-v2/`
- Local parse/preflight: ✓ Both generator scripts ran clean; column counts and row counts verified
- Product loader/API acceptance: NOT YET — Phase 1 loader extensions build this path
- Azure Blob/object storage staging: NOT YET — Phase 1 `blob-stager.ts` + Phase 2 ACA job
- Queue/private worker handoff: NOT YET — ACA job is Phase 2
- Parser extraction with source citations: NOT YET — YAML/JSONL parsers are Phase 1
- Review/approval queue: NOT APPLICABLE — structured CSV/YAML facts auto-commit on schema validation
- Client data-plane commit: NOT YET — Phase 2 ACA job
- Embedding/search refresh: NOT YET — follows Phase 2 commit
- Live signed-in retrieval or answer QA: NOT YET — Phase 4 golden questions smoke test

Path type: loose multi-file bulk upload (manifest-driven), YAML profile + CSV dimensions + JSONL graph, DB commit planned in Phase 2 ACA job inside VNet.

## Known Gaps

- Admin loader does not yet support YAML, JSONL, or manifest-driven batch loads (Phase 1)
- `context-commit.ts` is a stub with no DB writes (Phase 1)
- Schema migration not yet written as file (Phase 0)
- Azure Blob staging not wired to loader (Phase 1)
- Admin explorer does not show dimension family grouping or blob URLs (Phase 3)
- SkyHarbor Air, Meridian Health, and Apex Retail V2 datasets not yet generated in 6-family format
- Insights rule engine (zero code exists) deferred — not in this brief scope
