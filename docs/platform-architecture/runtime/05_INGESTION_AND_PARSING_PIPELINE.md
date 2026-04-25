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

## Readiness States

Ingestion should expose missing, requested, uploaded, connected, loaded, parsed, available, usable evidence, low confidence, stale, access restricted, not applicable, and waived states.

## MVP / V1 / V2

MVP: file inventory and manual readiness. V1: deterministic parsing, normalization, and evidence ledger. V2: automated enrichment, exception handling, and continuous freshness monitoring.
