# 2026-06-07-grounded-cxo-answer-qa — Grounded CXO answer-quality audit

## Release ID
`2026-06-07-grounded-cxo-answer-qa`

## Status
`released` (evidence/report; no runtime change)

## Plain-English Summary
Audited whether Sentinel/Nexus can answer executive questions from the **Azure**
runtime. Result: pattern/treasury questions are answerable (Lakeshore strong), but
**every "CXO fact" question — execs, org, current data/analytics stack, systems,
vendors, KPIs — is `NOT_LOADED` for all clients**, because the `enterprise_context_*`
fact layer was never migrated to Azure (it exists only in Supabase). This is an
ingestion/migration gap; retrieval + Anthropic synthesis are healthy and correctly
refuse to hallucinate.

## Layer Impact
- `client-data-lane`: read-only audit/evidence (no data mutated). Names a P0 ingestion gap
  in the client data plane and a hard constraint on Supabase retirement.
- `global-control-lane`: confirms reasoning provider posture (Anthropic-only) in the shared app.

## Client Applicability
- All clients (the fact-layer gap is platform-wide).

## Changes Included
- `docs/build/context-answer-qa/README.md`, `results.json`, `coverage-matrix.csv`, `failure-register.csv`.

## QA / Validation
- **PASS (method)** — real `askIntelligence` headless on the deployed image; Azure Postgres + Azure Search only.
- **FINDING** — schema inventory of `abarva_control`: `enterprise_context_*` ABSENT; corpus/genome present.
- **PASS** — provider proof: reasoning = anthropic·allow.
- Signed-in browser QA: **not-run** (needs Clerk persona — Lane 4).

## Rollout Plan
No runtime rollout. Drives the next mission: migrate/re-ingest `enterprise_context_*` to Azure.

## Rollback Plan
Not applicable — this record is read-only audit evidence; it changes no schema, data, image,
or config, so there is nothing to roll back. If the audit conclusions are later superseded,
add a follow-up record rather than reverting.

## Audit Evidence
`docs/build/context-answer-qa/*` (README, results.json, coverage-matrix.csv, failure-register.csv).

## Known Gaps
- **P0:** migrate `enterprise_context_*` Supabase → Azure (or governed re-ingest with parity).
- **Supabase must NOT be retired** until that parity is proven — it holds the only copy.
- **P1:** uneven per-tenant pattern coverage (Meridian/Apex weak vs Lakeshore).
- **P2:** Meridian `clients` id vs fact `tenant_key` reconciliation.
- Signed-in browser QA outstanding (Lane 4).
