# 2026-06-18-meridian-lakeshore-v2-refresh-scaffold — Meridian and Lakeshore V2 Refresh Scaffold

## Release ID

`2026-06-18-meridian-lakeshore-v2-refresh-scaffold`

## Status

`candidate`

## Plain-English Summary

Adds the controlled refresh scaffold for Meridian Health and Lakeshore Industries. The scaffold validates the local V2 source packs, emits client-scoped replacement SQL, creates a handoff brief, and adds a dry-run validated ACA/private data-plane worker for the future refresh.

This does not delete or load database rows. It prepares the audit-safe path for replacing the current Meridian/Lakeshore context, corpus, Intelligence, and AI Control Tower rows with the new V2 packs.

## Layer Impact

- `client-data-lane`: Adds refresh orchestration artifacts for Meridian and Lakeshore client data.
- `internal-admin`: Adds a dry-run script and handoff brief for the delivery/admin team.
- `experimental`: Supports the backend redesign path for Intelligence and AI Control Tower, but does not activate a runtime feature.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Meridian Health (`tenant_key=meridian-health`) and Lakeshore Industries (`tenant_key=lakeshore`).
- Internal only: Refresh preflight, generated SQL, and execution brief.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- `scripts/jobs/load-meridian-lakeshore-v2.cjs`
- `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`
- Generated preflight receipts under `outputs/context-refresh/`
- `docs/releases/records/2026-06-18-meridian-lakeshore-v2-refresh-scaffold.md`

## QA / Validation

- PASS: `node --check scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- PASS: `node scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- PASS: `node --check scripts/jobs/load-meridian-lakeshore-v2.cjs`
- PASS: `node scripts/jobs/load-meridian-lakeshore-v2.cjs` dry-run with existing workspace dependencies.
- PASS: Meridian preflight reports 496 context CSV rows, 259 Tower CSV rows, 260 graph edges, and 7 corpus patterns.
- PASS: Lakeshore preflight reports 435 context CSV rows, 201 Tower CSV rows, 226 graph edges, and 4 corpus patterns.
- PASS: Meridian worker dry-run builds 24 source files, 497 context records, 5,428 facts, 502 chunks, 260 graph edges, 7 private patterns, and 14 Tower sources.
- PASS: Lakeshore worker dry-run builds 22 source files, 436 context records, 4,809 facts, 439 chunks, 226 graph edges, 4 private patterns, and 14 Tower sources.

## Rollout Plan

No runtime rollout occurs from this release. The next step is to run the generated scaffold inside the ACA/private data-plane execution flow after the context engine loader path is ready. That future run must archive current client rows, delete by client scope only, load V2 packs, refresh embeddings/search, run the insight evaluator, and prove signed-in Intelligence/Tower QA.

## Rollback Plan

Delete `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`, `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`, and generated `outputs/context-refresh/` receipts, or git-revert this release. No database rollback is required because no data-plane writes are included.

## Audit Evidence

- Refresh scaffold: `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- ACA/private DB worker: `scripts/jobs/load-meridian-lakeshore-v2.cjs`
- Build brief: `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`
- Preflight receipts: `outputs/context-refresh/`
- Source packs:
  - `datasets/meridian-health-synthetic-v2/`
  - `datasets/lakeshore-industries-synthetic-v2/`

## Context Ingestion Evidence

- Local artifact generated: Yes. Dry-run preflight receipt and generated SQL were produced under `outputs/context-refresh/`.
- Local parse/preflight: Yes. Meridian and Lakeshore local packs passed manifest/count/pattern/graph validation, and the worker dry-run produced record/fact/chunk/Tower row counts.
- Product loader/API acceptance: Not run.
- Azure Blob/object storage staging: Not run.
- Queue/private worker handoff: Not run.
- Parser extraction with source citations: Not run.
- Review/approval queue: Not run.
- Client data-plane commit: Not run.
- Embedding/search refresh: Not run.
- Live signed-in retrieval or answer QA: Not run.

Current state: local refresh scaffold only.

## Known Gaps

- The ACA archive/delete/load worker exists but has not been run with `--apply`.
- Does not yet commit the V2 packs to Azure/Postgres.
- Does not refresh embeddings/search.
- Does not run signed-in Intelligence/Tower QA.
