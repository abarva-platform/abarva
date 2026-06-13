# Product Dev Synthetic Data Baseline

## Purpose

This packet makes ENV-08 executable before any synthetic reference load runs. It defines what counts as a product-grade synthetic data baseline and how it must move through the same governed Admin bulk-load process that pilot clients will use.

It is intentionally non-mutating. Do not upload, stage, parse, commit, index, promote, or deploy data from this packet without explicit approval.

Machine-readable companion: `docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.json`.

Verifier: `npm run azure:product-dev-synthetic-data:verify`.

## Core Rule

Synthetic data is a reference showcase, not a shortcut path.

Synthetic reference datasets must prove the same path a pilot client will use:

source files -> Admin bulk upload -> Azure Blob staged originals -> parser -> records/facts/chunks -> search index -> tenant-scoped retrieval -> citation-ready answer -> context bundle proof.

Do not call chunks-only data ready.
Do not call facts-only data ready.
Do not call indexed-only data ready.
Context-bundle proven is the real bar.

PHI is not accepted. PII is not accepted.

## Current Contract

The governed Admin bulk path is manifest-driven and supports loose multi-file uploads. Do not claim one-file ZIP support, server-side unzip, or automatic PDF/DOCX/PPTX/XLSX fact commitment unless a PR implements and validates that exact path.

Structured CSV, JSON, JSONL, and YAML can commit when schema validation passes. XLSX, PDF, DOCX, and PPTX extraction must preserve source-location evidence and enter review-required status unless a tested template-specific parser proves deterministic mapping.

## Required Pipeline States

Every synthetic reference load must report these states separately:

- local artifact generated
- local parse/preflight passed
- product loader/API accepted the upload
- Azure Blob/object storage staged the original files
- queue/private worker handoff happened
- parser extracted text/tables/facts with source citations
- review/approval queue received low-confidence or document-derived evidence
- context rows/facts/chunks were committed to the data plane
- embeddings/search index were refreshed
- live signed-in retrieval or answer QA proved the context is usable

## Ingestion Receipt

Every load must produce a receipt with:

- client id
- tenant key
- environment key
- dataset manifest id
- source file name and hash
- blob URI
- parser name and version
- record, fact, chunk, and citation counts
- low-confidence and review-required counts
- search index refresh id
- retrieval probe id
- created timestamp

## Idempotency

Re-uploading the same logical fact must not create duplicate current facts.

Required behavior:

- deterministic fact key
- same file re-upload is a no-op
- changed fact supersedes the previous current fact
- old fact remains auditable but is excluded from the default current view
- duplicate active facts are blocked
- duplicate active chunks are blocked

## Readiness

No row may auto-promote to `agent_ready`.

Initial readiness is `not_reviewed`. A row may become `promotion_candidate` only after retrieval and citation proof. A row may become `agent_ready` only after validated context-bundle proof.

`not_reviewed`, `blocked`, and `quarantined` rows must not enter model input.

## Required Synthetic Dimensions

The product reference baseline should cover:

- enterprise profile
- leadership/org
- applications/systems
- infrastructure/cloud
- integrations
- vendor contracts
- IT financials
- KPIs/value
- DORA/engineering metrics
- incidents/ITSM
- SLAs
- initiatives/moves
- risks/controls
- artifacts/evidence
- AI/data/use cases

## Approval Boundary

Explicit approval is required before:

- running a Product Dev bulk load
- writing to the Product Dev data plane
- refreshing Product Dev search indexes
- promoting any row to `agent_ready`
- loading any client private data
- accepting any PHI or PII

## Completion Bar

ENV-08 is complete only when the synthetic reference datasets are loaded through the governed Admin bulk path, Azure Blob staging is proven, records/facts/chunks are committed, search indexes are refreshed, tenant-scoped retrieval works, citations render, no duplicates exist, and context-bundle proof passes.
