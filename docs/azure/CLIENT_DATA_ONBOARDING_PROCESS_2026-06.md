# Client Data Onboarding Process

## Purpose

This packet makes ENV-15 executable without improvising. It defines the required process for onboarding client data into client preprod and client prod private planes.

It is intentionally non-mutating. Do not upload, stage, parse, commit, index, promote, or run client data through any private data plane from this packet without explicit approval.

Machine-readable companion: `docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.json`.

Verifier: `npm run azure:client-data-onboarding:verify`.

## Core Rule

Every client upload path must produce the same evidence chain:

source files -> Admin bulk upload -> Azure Blob staged originals -> Postgres source registration -> parser -> records/facts/chunks -> current-view refresh -> Azure AI Search -> tenant-scoped retrieval -> citation rendering -> promotion calculation -> context bundle proof -> module readiness.

Do not call chunks-only data ready.
Do not call facts-only data ready.
Do not call indexed-only data ready.
Context-bundle proven is the real bar.

PHI is not accepted. PII is not accepted unless a future contract explicitly changes the policy and the governance framework is updated first.

## Current Contract

The governed Admin bulk path is manifest-driven and supports loose multi-file uploads. Do not claim one-file ZIP support, server-side unzip, or automatic PDF/DOCX/PPTX/XLSX fact commitment unless a PR implements and validates that exact path.

Structured CSV, JSON, JSONL, and YAML can commit when schema validation passes. XLSX, PDF, DOCX, and PPTX extraction must preserve source-location evidence and enter review-required status unless a tested template-specific parser proves deterministic mapping.

## Required Templates

Client uploads must map to the canonical context dimensions:

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

Synthetic reference datasets must use these same templates. Synthetic data is a reference showcase, not a shortcut path.

## Required Pipeline States

Every client load must report these states separately:

- source files received
- local parse/preflight passed
- Admin bulk upload accepted
- Azure Blob/object storage staged the original files
- source files registered in Postgres metadata
- queue/private worker handoff happened
- parser extracted text/tables/facts with source locations
- review queue received low-confidence or document-derived evidence
- enterprise context records were committed
- enterprise context facts were committed
- enterprise context chunks were committed
- facts default current view was refreshed
- embeddings/search index was refreshed
- tenant-scoped retrieval was proved
- citation rendering was proved
- promotion status was calculated
- context bundle trace was proved
- module readiness was calculated

## Ingestion Receipt

Every load must produce a receipt with:

- client id
- tenant key
- environment key
- client plane
- dataset manifest id
- upload batch id
- source file name and hash
- blob URI
- source file id
- parser name and version
- template id and version
- record, fact, chunk, and citation counts
- low-confidence and review-required counts
- superseded fact count
- duplicate fact and chunk counts
- search index name and refresh id
- retrieval probe id
- context bundle trace id
- created timestamp

## Idempotency

Updating org structure, financial KPIs, vendor contracts, systems, or any other dimension must update or supersede existing current facts. It must not create duplicate current facts.

Required behavior:

- deterministic source file hash
- deterministic fact key
- same file re-upload is a no-op
- changed fact supersedes the previous current fact
- old fact remains auditable
- old fact is excluded from the default current view
- duplicate active facts are blocked
- duplicate active chunks are blocked
- duplicate search documents are blocked

## Promotion and Readiness

No row may auto-promote to `agent_ready`.

Initial readiness is `not_reviewed`. A row may become `promotion_candidate` only after retrieval and citation proof. A row may become `agent_ready` only after validated context-bundle proof and explicit promotion approval.

`not_reviewed`, `blocked`, and `quarantined` rows must not enter model input. Restricted rows require a policy-allowed use.

## Module Proof

Each client data onboarding run must produce at least one context-bundle proof for:

- Intelligence
- Moves
- Source
- Tower

Each proof must show tenant resolution, current facts selected, wrong-tenant facts excluded, superseded facts excluded, not-reviewed/blocked/quarantined rows excluded, citations emitted, model input context hash emitted, and unsupported claims flagged.

## Approval Boundary

Explicit approval is required before:

- opening a client upload window
- running client preprod ingestion
- running client prod ingestion
- approving parsers for review-required formats
- approving low-confidence evidence
- refreshing search indexes
- promoting any row to `agent_ready`
- executing any client prod data action

## Hard Stops

Stop if any of these are true:

- client id or tenant key is missing
- upload manifest is missing
- source file hash is missing
- blob staging proof is missing
- parser/source-location evidence is missing
- source registration is missing
- duplicate active facts exist
- orphan facts exist
- search index proof is missing
- tenant-scoped retrieval proof is missing
- citation metadata is missing
- context-bundle proof is missing
- PHI or PII is present without an explicit future policy change
- wrong-tenant context appears in a bundle

## Completion Rule

ENV-15 is scaffold-ready when this onboarding process packet and its verifier are merged. It is complete only after an approved client preprod upload produces a full receipt, duplicate checks pass, retrieval and citations work, context-bundle proof passes, and module readiness is accurate.
