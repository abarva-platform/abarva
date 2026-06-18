# 2026-06-18-meridian-lakeshore-v2-context-tower-datasets — Meridian and Lakeshore V2 Context + AI Control Tower Datasets

## Release ID

`2026-06-18-meridian-lakeshore-v2-context-tower-datasets`

## Status

`candidate`

## Plain-English Summary

Adds refresh-ready local synthetic V2 data packs for Meridian Health and Lakeshore Industries. Each pack follows the 6-family / 19-dimension Intelligence context model, includes source-document narratives for corpus ingestion, includes browseable Move/corpus patterns, and includes AI Control Tower T00-T13 monthly feed files.

Meridian is modeled as a complex integrated provider-payer preparing to move from fragmented on-prem data capabilities to Databricks on AWS. The corpus patterns explicitly support the PHS/Meridian Moves use cases: unified clinical plus claims data, automation-ready data foundation, call center optimization, HEDIS/STAR provider performance, cost-of-care transparency, payment integrity, and automated close/reporting.

Lakeshore is modeled as a private industrial enterprise centered on treasury modernization and Kyriba. The corpus patterns support Kyriba rollout decisions, bank connectivity, payments controls, cash visibility, automated close, finance AI, and ServiceNow finance-support automation.

This is a local dataset and generator. It does not load production data or mutate Azure/Postgres.

## Layer Impact

- `client-data-lane`: Adds local client-scoped synthetic dataset files under `datasets/meridian-health-synthetic-v2/` and `datasets/lakeshore-industries-synthetic-v2/`.
- `internal-admin`: Adds a deterministic generation script that can be rerun by the delivery/admin team before a controlled backend refresh.
- `experimental`: The AI Control Tower feeds and corpus patterns are target inputs for future Tower/Intelligence data-plane binding and demo testing.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Meridian Health (`tenant_key=meridian-health`) and Lakeshore Industries (`tenant_key=lakeshore`).
- Internal only: Dataset generation and local verification.
- Public/demo only: Synthetic source documents and demo feeds may be used for demo ingestion after a separate loader run.
- Feature flag: Not applicable.

## Changes Included

- `scripts/context-packs/generate-meridian-lakeshore-v2-context-tower.mjs`
- `datasets/meridian-health-synthetic-v2/`
- `datasets/lakeshore-industries-synthetic-v2/`
- `docs/releases/records/2026-06-18-meridian-lakeshore-v2-context-tower-datasets.md`

## QA / Validation

- PASS: `node --check scripts/context-packs/generate-meridian-lakeshore-v2-context-tower.mjs`
- PASS: `node scripts/context-packs/generate-meridian-lakeshore-v2-context-tower.mjs`
- PASS: Meridian generated 43 files with 92 applications, 132 integrations, 34 vendors, 14 AI Control Tower initiatives, 70 AI milestones, 260 relationship edges, and 7 corpus patterns.
- PASS: Lakeshore generated 41 files with 86 applications, 118 integrations, 28 vendors, 10 AI Control Tower initiatives, 50 AI milestones, 226 relationship edges, and 4 corpus patterns.
- PASS: Verification files generated:
  - `datasets/meridian-health-synthetic-v2/99-verification/expected-row-counts.json`
  - `datasets/meridian-health-synthetic-v2/99-verification/golden-questions.json`
  - `datasets/lakeshore-industries-synthetic-v2/99-verification/expected-row-counts.json`
  - `datasets/lakeshore-industries-synthetic-v2/99-verification/golden-questions.json`

## Rollout Plan

No runtime rollout occurs from this release. To make these datasets active, run a future controlled ingestion flow that stages source files, parses/validates the dimension files, writes client-scoped context rows/facts/evidence into Azure/Postgres, refreshes embeddings/search, and verifies signed-in Intelligence/Tower answers for each client.

## Rollback Plan

Delete `datasets/meridian-health-synthetic-v2/`, `datasets/lakeshore-industries-synthetic-v2/`, and `scripts/context-packs/generate-meridian-lakeshore-v2-context-tower.mjs`, or git-revert this release. No database rollback is required because no data-plane writes are included.

## Audit Evidence

- Generator script: `scripts/context-packs/generate-meridian-lakeshore-v2-context-tower.mjs`
- Meridian manifest: `datasets/meridian-health-synthetic-v2/manifest.yaml`
- Meridian corpus patterns: `datasets/meridian-health-synthetic-v2/corpus-patterns/move-patterns.jsonl`
- Lakeshore manifest: `datasets/lakeshore-industries-synthetic-v2/manifest.yaml`
- Lakeshore corpus patterns: `datasets/lakeshore-industries-synthetic-v2/corpus-patterns/move-patterns.jsonl`
- Verification counts: `datasets/meridian-health-synthetic-v2/99-verification/` and `datasets/lakeshore-industries-synthetic-v2/99-verification/`

## Context Ingestion Evidence

- Local artifact generated: Yes. Meridian has 43 local files; Lakeshore has 41 local files.
- Local parse/preflight: Basic generator execution and manifest/count checks passed.
- Product loader/API acceptance: Not run.
- Azure Blob/object storage staging: Not run.
- Queue/private worker handoff: Not run.
- Parser extraction with source citations: Not run. Synthetic source documents, evidence identifiers, and corpus pattern references are present for a future parser run.
- Review/approval queue: Not run.
- Client data-plane commit: Not run.
- Embedding/search refresh: Not run.
- Live signed-in retrieval or answer QA: Not run.

Current state: local generated datasets only.

## Known Gaps

- Not yet loaded into Azure/Postgres.
- No Blob staging or private worker parse has been run.
- No embeddings/search refresh has been run.
- No live signed-in Intelligence or Tower QA has proven either dataset.
- Synthetic documents are markdown source documents. Lakeshore also has an existing richer document bundle under `docs/build/lakeshore-enterprise-context/`; a later artifact pass can generate richer Meridian PDF/PPTX/XLSX source artifacts if needed for ingestion demos.
