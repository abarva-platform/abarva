# 2026-06-24-semantic-question-layer — Semantic Question and Operational Evidence Data Plane Foundation

## Release ID

`2026-06-24-semantic-question-layer`

## Status

`candidate`

## Plain-English Summary

Adds the shared Enterprise Semantic Question Layer foundation that lets AbarVa map normal English questions to governed enterprise dimensions, metrics, evidence, caveats, and verified answer behavior. This is a platform-level service, not a Home feature. Home, Intelligence, Moves, Source, Control Tower, aVa, and Context Layer Admin share the same semantic interpretation, query planning, evidence retrieval, answer, and verification contract.

This candidate now includes the Azure/Postgres data-plane design and additive migration scaffold for the semantic catalog, business glossary/synonyms, metric registry, semantic joins/views, query plans/results, evidence/citations, answer verification, tenant volumetrics/coverage/readiness, feedback/change requests, and cross-module usage tracking.

The module-level operating rule is now explicit: Home asks "what do we know?", Moves asks "what should we do?", Source asks "which vendor and why?", Control Tower asks "are we delivering value?", and aVa explains it like an advisor. The 19 universal dimensions are the backbone, and planned datasets such as operational evidence, Moves readiness, Source proposal intelligence, rate cards, AI Control Tower, and healthcare clinical/claims register as semantic extensions.

This candidate also adds the typed operational evidence data-plane migration and load/proof contract for process intelligence and AI opportunity discovery. Raw files remain in controlled storage; structured evidence is normalized into typed Azure/Postgres tables; sanitized summaries feed retrieval/aVa/Claude; Moves receives projections rather than becoming the raw operational data lake.

Update: this candidate now includes the Azure/Postgres-backed semantic answer runtime, the `/api/enterprise-semantic/ask` route, Intelligence/aVa routing into the semantic runtime for dataset/volumetric/readiness/operational/value/rate-card questions, live VNet read proof artifacts, and a forward migration that expands the persisted metric catalog beyond the first six seed metrics to the governed TypeScript metric registry. Runtime tenant reads include known canonical aliases for SkyHarbor and Lakeshore so alias-loaded rows are not silently dropped.

## Layer Impact

- `global-control-lane`: shared semantic contracts, question routing, metric registry, planning, answer composition, verification, and standards for all clients.
- `client-data-lane`: adds an additive migration for typed operational evidence tables, tenant-scoped RLS policies, indexes, load lineage, semantic snapshots, and Moves evidence-slot projection. No client data was loaded in this local slice.

## Client Applicability

- All clients: yes, through shared semantic contracts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this slice.

## Changes Included

- `src/lib/enterprise-context/semantic-question-layer.ts`
- `src/lib/enterprise-context/__tests__/semantic-question-layer.test.ts`
- `src/lib/enterprise-context/operational-evidence-data-plane.ts`
- `src/lib/enterprise-context/__tests__/operational-evidence-data-plane.test.ts`
- `supabase/migrations/20260624120000_operational_evidence_data_plane.sql`
- `supabase/migrations/20260624143000_enterprise_semantic_question_layer.sql`
- `src/lib/enterprise-context/schema.ts`
- `src/lib/enterprise-context/__tests__/schema.test.ts`
- `src/lib/knowledge/coverage.ts`
- `src/lib/knowledge/__tests__/coverage.test.ts`
- `src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts`
- `docs/standards/SEMANTIC_QUESTION_LAYER_STANDARD.md`
- `docs/architecture/azure/OPERATIONAL_EVIDENCE_DATA_PLANE_DESIGN.md`
- `docs/architecture/azure/ENTERPRISE_SEMANTIC_QUESTION_LAYER_DATA_PLANE_DESIGN.md`
- `src/lib/enterprise-context/semantic-answer-runtime.ts`
- `src/lib/enterprise-context/__tests__/semantic-answer-runtime.test.ts`
- `src/app/api/enterprise-semantic/ask/route.ts`
- `src/app/api/enterprise-semantic/ask/__tests__/route.test.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`
- `supabase/migrations/20260624163000_semantic_metric_registry_expansion.sql`
- `reports/semantic-layer-inventory/**`
- `reports/semantic-layer-runtime-proof/**`

Platform service entry points added/confirmed:

- `getEnterpriseSemanticQuestionLayerContract()`
- `answerEnterpriseSemanticQuestion({ requestedByModule, question, records, tenantKey, userId })`
- `routeSemanticQuestion(question, { requestedByModule })`
- `planSemanticQuestion(question, records, { requestedByModule })`

## QA / Validation

- `npx tsc --noEmit --pretty false` — passed.
- `npm test -- --runTestsByPath src/lib/enterprise-context/__tests__/semantic-question-layer.test.ts src/lib/enterprise-context/__tests__/operational-evidence-data-plane.test.ts src/lib/enterprise-context/__tests__/schema.test.ts src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts` — local targeted suite.
- `npm test -- --runTestsByPath src/lib/enterprise-context/__tests__/semantic-question-layer.test.ts` — passed after adding platform service contract and module-aware routing coverage.
- Schema contract test now includes `20260624143000_enterprise_semantic_question_layer.sql` and asserts semantic data-plane tables plus tenant readiness views.
- `npx eslint src/lib/enterprise-context/semantic-question-layer.ts src/lib/enterprise-context/__tests__/semantic-question-layer.test.ts src/lib/enterprise-context/operational-evidence-data-plane.ts src/lib/enterprise-context/__tests__/operational-evidence-data-plane.test.ts src/lib/enterprise-context/schema.ts src/lib/enterprise-context/__tests__/schema.test.ts src/lib/knowledge/coverage.ts src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts` — local targeted lint.
- Live Azure/Postgres VNet proof — passed via ACA job `job-abarva-private-operator-eus-em94mhj`.
  - Image: `acrabarvalab001.azurecr.io/abarva/operational-evidence-live-proof@sha256:8a64d6495b2defc79131b1d64319dfdfbfa6ef9b1b63bcb7fb6543b0d55b9a1c`.
  - Migration: `20260624120000_operational_evidence_data_plane.sql` applied.
  - Schema: 14 operational evidence tables present, 20 indexes counted, 70 RLS policies counted, RLS enabled on every operational evidence table.
  - Tenant load: `morganstreet` synthetic-demo evidence loaded with 8 file manifests, 5 work items, 2 events, 2 process observations, 3 system-service maps, 2 automation opportunities, 2 human-agent responsibility rows, 2 value estimates, 2 insights, 16 relationships, 3 semantic snapshots, and 4 Moves evidence-slot coverage rows.
  - Retrieval: structured queries returned app friction, bottlenecks, automation priorities, Moves projection, relationship sample, semantic snapshot sample, and a sanitized search chunk plan.
  - Isolation: RLS positive tenant read count `5`; cross-tenant negative read count `0`; `rlsBlocksCrossTenant=true`.
- Semantic-layer apply/seed proof — passed via private Azure/Postgres VNet path.
  - Migration applied: `20260624143000_enterprise_semantic_question_layer.sql`.
  - Seeded rows: 30 semantic dimensions, 120 semantic fields, 6 first-pass semantic metrics, 17 synonyms, 131 tenant/source/dimension volumetric rows, 113 tenant dimension coverage rows, 66 tenant metric coverage rows, and 55 tenant question readiness rows.
  - Proof package: `/Users/anand/Downloads/enterprise-semantic-layer-erd-volumetric-20260624.zip`.
- Semantic runtime VNet read proof — passed via ACA job `job-abarva-private-operator-eus-kpby9nw`.
  - Live counts proven: 30 semantic dimensions, 131 tenant data volumetrics, 113 tenant dimension coverage rows, 55 tenant question readiness rows.
  - Tenant proof: Morgan Street process intelligence answerable; Lakeshore inventory answerable with process/business-case gaps; Meridian inventory answerable and business case partially answerable.
  - Operator job restored to `/bin/true`.
  - Proof package: `/Users/anand/Downloads/enterprise-semantic-runtime-proof-20260624.zip`.
- Metric registry expansion — added `20260624163000_semantic_metric_registry_expansion.sql` so the persisted `semantic_metrics` catalog is expanded from the first six seed metrics to the full governed starter registry. This does not mark all tenant metrics computable; `tenant_metric_coverage` remains the readiness truth.
- 200-question semantic quality gauntlet — passed against Apex Retail and SkyHarbor Air using the Azure/Postgres VNet seed proof as the replay source.
  - Before baseline: `45.8%`.
  - After semantic runtime: `100%`.
  - Question count: `200` total, `100` per tenant.
  - Categories: inventory, application friction, process intelligence, bottlenecks, value, readiness, governance, vendor/finance, data quality, and cross-dimension.
  - Tenant pass rates: Apex Retail `100%`, SkyHarbor Air `100%`.
  - Top remaining failures: none.
  - Report: `reports/semantic-layer-quality-gauntlet/20260624/semantic-layer-quality-gauntlet.html`.
  - Download copy: `/Users/anand/Downloads/semantic-layer-quality-gauntlet-200q-20260624.html`.

## Rollout Plan

Merge to main, apply the additive Azure/Postgres migration through the approved DB migration lane, and deploy through the standard Azure Container Apps release lane when this candidate is included in a runtime release. No destructive schema changes are included.

## Deployment Authority

- Repo-owned main deploy path only for `app.abarva.ai`.
- Azure/Postgres migrations must run through the approved private VNet DB migration/operator lane; local laptop DB access is not a valid proof path.
- ACA runtime mutation must use the approved main image digest produced by the repo-owned workflow.
- No branch, local script, worktree image, `source-*`, `codex-*`, or preview image may receive shared ACA traffic.
- Required post-deploy proof: active ACA revision, template image, 100% traffic image, health endpoint, semantic API route response, and signed-in browser answer proof for at least one pilot tenant before calling this browser-live.

## Rollback Plan

Revert the semantic question layer files, operational evidence data-plane files, coverage alias/test updates, semantic data-plane design files, and additive migrations. If migrations have already been applied, rollback requires dropping only the new operational evidence and semantic-layer tables after confirming no production evidence, answer, or catalog rows depend on them.

## Audit Evidence

- Semantic contract/test files listed above.
- TypeScript, Jest, and ESLint command output from local validation.
- Operational evidence migration and data-plane proof tests listed above.
- Enterprise Semantic Question Layer Azure/Postgres design: `docs/architecture/azure/ENTERPRISE_SEMANTIC_QUESTION_LAYER_DATA_PLANE_DESIGN.md`.
- Additive semantic data-plane migration scaffold: `supabase/migrations/20260624143000_enterprise_semantic_question_layer.sql`.
- Live proof record: `reports/operational-evidence-live-proof/20260624-050103/PROOF_RECORD.md`.
- Download proof package: `/Users/anand/Downloads/abarva-operational-evidence-live-proof-20260624-050103.zip`.
- Semantic quality gauntlet report: `reports/semantic-layer-quality-gauntlet/20260624/semantic-layer-quality-gauntlet.html`.
- Semantic quality gauntlet download copy: `/Users/anand/Downloads/semantic-layer-quality-gauntlet-200q-20260624.html`.
- This release record.

## Context Ingestion Evidence

- Local artifact generated: operational evidence data-plane migration, semantic-layer data-plane migration scaffold, semantic-layer Azure/Postgres design, in-memory load/proof plan, and live VNet proof runner.
- Local parse/preflight: 8-template synthetic pack validates through `buildOperationalEvidenceDataPlanePlan`.
- Product loader/API acceptance: live proof used the private ACA operator job path, not a user-facing upload API.
- Azure Blob/object storage staging: represented by immutable private blob URI/hash/redaction receipt manifests in `operational_evidence_file_manifests`; original raw files were not pushed to live Blob by this proof.
- Queue/private worker handoff: proof ran through the private ACA VNet job path; queue orchestration was not exercised.
- Parser extraction with source citations: deterministic normalization from the 8 minimum templates into typed rows with source refs and evidence relationships.
- Review/approval queue: review caveats represented in Moves slot coverage and semantic snapshots, including synthetic-demo and finance validation caveats.
- Client data-plane commit: live Azure/Postgres operational-evidence commit completed for tenant `morganstreet` with synthetic-demo labels. Semantic-layer catalog, volumetrics, coverage, and question-readiness seed completed in Azure/Postgres and is backed by the downloaded proof JSON. Metric expansion is a forward migration in this PR and still needs the approved DB migration lane after merge.
- Embedding/search refresh: sanitized Azure AI Search chunk plan generated and verified to exclude sensitive raw payloads; live Azure AI Search indexing was not pushed.
- Live signed-in retrieval or answer QA: not run; tenant-scoped structured retrieval was run inside the VNet proof job, and a 200-question semantic quality gauntlet was run against the VNet seed proof replay source for Apex Retail and SkyHarbor Air.

Path type: live Azure/Postgres migration apply, tenant-scoped synthetic-demo structured load, RLS/isolation proof, structured retrieval proof, and Moves projection proof. Not a live Blob raw-file upload, live Azure AI Search index push, or signed-in browser answer QA.

## Known Gaps

- The Enterprise Semantic Question Layer is implemented as a shared platform service with module-aware routing and Intelligence/aVa runtime routing for semantic dataset/readiness/value/rate-card questions. Home/Moves/Source/Tower UI rendering still needs to call the platform entry point everywhere.
- Semantic-layer Azure/Postgres schema and first-pass seed are VNet-proven. The metric expansion forward migration still needs approved DB migration application after merge.
- Live signed-in browser QA across tenants was not run in this slice.
- Runtime answers are VNet-read-proven through Azure/Postgres semantic projections; production browser proof on `app.abarva.ai` still requires merge, ACA deploy, and signed-in crawl.
