# Grounded CXO Answer-Quality Audit — Azure runtime (2026-06-07)

Audit of whether Sentinel/Nexus can answer executive questions from the **Azure**
data plane (runtime DB `abarva_control`), post-activation of `main@70c4f98bf`.
Method: real `askIntelligence` run headless inside the private operator job
(`NODE_OPTIONS=--conditions=react-server` + the new image), Azure Postgres + Azure
Search only. No Supabase. No secret values printed.

## Status update

This audit was run **before** the emergency enterprise-context restore. Its
answer-quality observations remain useful as a pre-restore baseline, but the
blanket finding "`enterprise_context_*` absent in Azure" is now superseded.

Post-restore truth, proven at 2026-06-07T20:12Z:

- `enterprise_context_*` tables exist again in Azure `abarva_control`.
- `enterprise_context_chunks`: 15,847 rows restored and reindexed.
- `enterprise_context_records`: 3,503 rows restored.
- `enterprise_context_facts`: 38,640 rows restored.
- `tenant-context-v1` Azure Search rebuilt and verified for Apex, First Capital,
  Lakeshore, Meridian, Northstar, and SkyHarbor.

The next audit step is **not** "migrate from Supabase" anymore. The next step is
to rerun the CXO answer-quality probes against the restored Azure context and
classify which questions are now fully answerable, partially answerable, or still
not loaded.

## Three-layer truth after restore

| Layer | Where | In Azure runtime? | Effect |
|---|---|---|---|
| `corpus_patterns` (9,026) · `genome_patterns` (43,436) · `intelligence_graph_edges` (93,743) | Azure `abarva_control` | yes | Pattern questions answerable |
| `applications` (232, likely `is_demo_data`) | Azure | yes | Demo systems only; must not be mislabeled as live-loader-backed |
| `enterprise_context_chunks` | Azure `abarva_control` + Azure Search `tenant-context-v1` | yes, 15,847 | Chunk-backed CXO current-state answers can now retrieve context |
| `enterprise_context_records` / `enterprise_context_facts` | Azure `abarva_control` | yes, Meridian structured layer restored | Meridian structured current-state facts can now be tested |

## Final Azure coverage after restore

| Client | Facts | Records | Chunks | Current QA posture |
|---|---:|---:|---:|---|
| Apex Retail | 0 | 0 | 6,497 | rerun as chunk-backed / partial |
| Meridian Health System | 38,640 | 3,503 | 3,503 | rerun as structured + chunk-backed |
| SkyHarbor Air | 0 | 0 | 3,240 | rerun as chunk-backed / partial |
| Lakeshore Holdings | 0 | 0 | 1,329 | rerun as chunk-backed / partial |
| Northstar Clinical Technologies | 0 | 0 | 878 | rerun as chunk-backed / partial |
| First Capital | 0 | 0 | 400 | rerun as chunk-backed / partial |
| Lakefront Capital Boston | 0 | 0 | 0 | likely not loaded |
| Morgan Street Holdings Chicago | 0 | 0 | 0 | likely not loaded |
| Roosevelt Holdings Atlanta | 0 | 0 | 0 | likely not loaded |

## Pre-restore live probe evidence

The original probe showed the agent behaved safely when the fact layer was
missing: it refused to invent executives or current-state stacks. Those rows are
kept as baseline evidence in `results.json`.

| Client | Dimension | Pre-restore classification | Evidence |
|---|---|---|---|
| Lakeshore | corpus patterns (Kyriba/treasury) | FULLY_ANSWERABLE | 8 sources, all real Kyriba patterns |
| Lakeshore | execs / data-analytics stack | SUPERSEDED_BY_RESTORE | Previously refused to fabricate because fact layer was absent |
| Apex | execs / data-analytics stack | SUPERSEDED_BY_RESTORE | Previously refused to fabricate because fact layer was absent |
| Apex | corpus patterns (forecasting/contact-center) | PARTIALLY_ANSWERABLE | 1 corpus source + model reasoning |
| Meridian | execs / data-analytics stack | SUPERSEDED_BY_RESTORE | Previously refused to fabricate because fact layer was absent |
| Meridian | corpus patterns (clinical) | RETRIEVAL_FAILURE / NOT_LOADED | 0 sources; "reasoning from domain expertise, not a loaded corpus match" |

## Recommended fixes by lane

- **Answer QA / retrieval (next):** rerun the grounded CXO question set against
  restored Azure context. Pay special attention to Meridian analytics-stack
  questions and Lakeshore chunk-backed current-state questions.
- **Ingestion / data-load:** extract structured facts for clients that currently
  only have chunks (Apex, Lakeshore, SkyHarbor, Northstar, First Capital) if CXO
  answers need deterministic exec/org/system/KPI facts instead of chunk synthesis.
- **Retrieval / indexing:** Azure Search is rebuilt to 15,847 docs. Verify
  recall@k for simple factual questions by tenant.
- **Answer-prompt / synthesis:** keep Anthropic-only, grounded, fail-closed answer
  behavior. Do not reintroduce OpenAI reasoning.
- **Binder / pattern-validation:** grounding-scoped guard (#3268) remains the
  required pattern posture.
- **Tenant isolation:** use canonical `tenant_key` and live `clients.id`;
  restored context rows were canonicalized and now have 0 orphaned `client_id`s.

See `coverage-matrix.csv`, `failure-register.csv`, `results.json`, and
`../legacy-shutdown-readiness/restore-and-search-proof-2026-06-07.md`.
