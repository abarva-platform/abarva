# Data / Evidence / Knowledge Layer

## Page / Category Name

Data / Evidence / Knowledge Layer.

## Purpose

Make data onboarding, evidence usability, knowledge fabric health, and claim-to-source readiness visible across the platform.

## Primary User Question

Which data is usable evidence, which data is missing or stale, and what can agents safely rely on?

## Agent Anchor

Steward anchors readiness and governance. Sentinel flags low-confidence or contradictory evidence. Nexus and Atlas consume the readiness state for work-specific responses.

## Journey / Workflow State

Data readiness: missing, requested, uploaded, connected, loaded, parsed, available, usable evidence, low confidence, stale, access restricted, not applicable, or waived.

## UI Zones

- Dataset inventory.
- Evidence readiness table.
- Parsing and enrichment state.
- Access and permissions.
- Claim-to-source coverage.
- Knowledge fabric health.

## Data Required

Datasets, files, connectors, parse jobs, embeddings, graph records, relational records, evidence ledger entries, access permissions, and freshness metadata.

## Seed Data Today

Seeded dataset records, seeded evidence placeholders, seeded readiness states, and deterministic source labels.

## Real Data Tomorrow

Connected systems, uploaded files, parse and normalize jobs, embeddings, graph extraction, relational records, object storage, and evidence ledger.

## Actions Supported

Request data, connect source, inspect readiness, resolve access, mark waiver, view evidence coverage, and route to affected work.

## Missing-Data Behavior

Show explicit readiness state and explain which work surfaces cannot rely on the missing or low-confidence data.

## MVP / V1 / V2 Classification

MVP: dataset inventory and evidence readiness. V1: parsing pipeline and claim-to-source ledger. V2: automated enrichment, graph reasoning, and feedback loop.

## Dependencies

Admin/Setup, ingestion pipeline, knowledge fabric, evidence ledger, permissions, and agent context builder.

## Wireframe Required

Yes.

## What Not To Show If Data Is Missing

Do not show usable evidence, confidence, parsed values, or source-backed claims without readiness and ledger records.
