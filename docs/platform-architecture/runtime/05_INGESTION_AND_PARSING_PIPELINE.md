# Ingestion And Parsing Pipeline

## Purpose

Define how files and connected data become usable evidence without making models the primary parsers.

## Pipeline

The pipeline is:

1. Parse.
2. Normalize.
3. Chunk.
4. Enrich.
5. Extract.
6. Embed.
7. Persist.
8. Evidence ledger.

## Responsibilities

- Parse source files with deterministic parsers where possible.
- Normalize tables, documents, metadata, and references.
- Chunk text and records for retrieval.
- Enrich with tenant, work-object, and source metadata.
- Extract structured facts, risks, dates, pricing terms, obligations, and owners.
- Embed approved chunks.
- Persist structured and unstructured records.
- Create evidence ledger links from claims to source material.

## Model Boundary

Models may assist extraction or summarization only after source material is parsed and normalized. Models are not the system of record for parsing.

## Fallback Parser Boundary

When the primary parser fails, returns low confidence, or produces visibly
garbled output, fallback parsing must follow
`docs/architecture/azure/PARSER_FALLBACK_DECISION_TREE.md`.

- Marker is the private/self-hosted fallback for sensitive, restricted,
  regulated, unknown-sensitivity, or no-third-party-consent documents.
- LlamaParse is permitted only for non-sensitive documents after explicit
  operator approval and customer third-party processing consent.
- No fallback output may be committed to indexes, evidence ledgers, graph
  records, deliverables, or recommendations until a human approves the parsed
  result.

The testable policy contract lives in
`src/lib/ingestion/parser-fallback-policy.ts` so future ingestion workers can
invoke the same decision tree before calling any fallback parser.

## Readiness States

Ingestion should expose missing, requested, uploaded, connected, loaded, parsed, available, usable evidence, low confidence, stale, access restricted, not applicable, and waived states.

## Admin/Setup And Source Boundary

The parsing pipeline feeds Admin/Setup readiness and the Evidence Ledger. Admin/Setup owns the readiness state that tells the platform whether a dataset, file, connector, or parsed source can be treated as usable evidence.

Source does not run its own parsing pipeline. Source consumes readiness and evidence state from the platform pipeline, then translates that state into sourcing workflow impact, such as RFP tier, scorecard confidence, vendor evaluation readiness, pricing normalization readiness, and value ledger confidence.

If a Source attachment or vendor contract is uploaded but not parsed, Source must show that it cannot cite the file yet. If data is loaded but not validated as usable evidence, Source must not use it for artifacts, scorecards, pricing normalization, or value claims.

## MVP / V1 / V2

MVP: file inventory and manual readiness. V1: deterministic parsing, normalization, and evidence ledger. V2: automated enrichment, exception handling, and continuous freshness monitoring.
