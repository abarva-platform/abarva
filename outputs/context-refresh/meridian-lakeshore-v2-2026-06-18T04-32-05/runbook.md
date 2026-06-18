# Meridian + Lakeshore V2 Refresh Preflight Receipt

Run id: `meridian-lakeshore-v2-2026-06-18T04-32-05`
Generated at: 2026-06-18T04:32:05.549Z

## Scope

This receipt validates local V2 source packs and emits client-scoped replacement SQL. It does **not** delete data, stage blobs, commit context rows, refresh embeddings, or prove signed-in retrieval.

## Clients

### meridian-health

- OK: yes
- Dataset: `datasets/meridian-health-synthetic-v2`
- Manifest entries: 19
- Context CSV rows counted from manifest files: 496
- Graph edges: 260
- Tower CSV rows: 259
- Corpus patterns: 7
- Source docs: 5
- Errors: none

### lakeshore

- OK: yes
- Dataset: `datasets/lakeshore-industries-synthetic-v2`
- Manifest entries: 19
- Context CSV rows counted from manifest files: 435
- Graph edges: 226
- Tower CSV rows: 201
- Corpus patterns: 4
- Source docs: 3
- Errors: none


## Replacement Rules

- Preserve `clients`, users, memberships, auth, audit/egress logs, and global `corpus_patterns`.
- Archive current client rows before delete in the ACA/private DB execution step.
- Delete only rows matching the client id or tenant aliases listed in each generated SQL file.
- Load order after delete: manifest YAML/CSV dimensions, source docs/chunks, private corpus patterns, Tower T00-T13, graph edges last, insight evaluator, embeddings/search, signed-in QA.

## Generated Artifacts

- `receipt.json`
- `runbook.md`
- `sql/meridian-health-replace.sql`
- `sql/lakeshore-replace.sql`

## Ingestion Truth

- Local artifact generated: yes
- Local parse/preflight: yes
- Product loader/API acceptance: not run
- Azure Blob/object storage staging: not run
- Queue/private worker handoff: not run
- Parser extraction with source citations: not run
- Review/approval queue: not run
- Client data-plane commit: not run
- Embedding/search refresh: not run
- Live signed-in retrieval or answer QA: not run
