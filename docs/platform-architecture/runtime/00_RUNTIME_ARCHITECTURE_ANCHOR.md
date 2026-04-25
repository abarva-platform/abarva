# AbarVa Runtime Architecture Anchor

## Purpose

This pack defines the AbarVa platform runtime architecture under Programs, Source, Intelligence, Control Tower, and Admin/Setup. It is documentation only and does not implement runtime code.

## Product Surfaces

AbarVa product surfaces sit above shared platform services:

- Home and executive entry.
- Programs and Program Journey.
- Source outsourcing.
- Intelligence.
- Control Tower.
- Admin/Setup.

Product-specific APIs can shape work for each surface, but shared services own context, model access, knowledge, tools, evidence, and governance.

## Core Principles

- Agents do not call models directly.
- UI does not assemble prompts.
- Model calls go through the Model Gateway.
- Context Builder is required for event-specific and program-specific responses.
- Knowledge Fabric separates vector, graph, relational state, object/raw files, and evidence ledger.
- The ingestion pipeline is parse -> normalize -> chunk -> enrich -> extract -> embed -> persist -> evidence ledger.
- Models are not primary parsers.
- Evidence ledger tracks claim-to-source.
- Runtime APIs are product-specific above shared platform services.

## Read Order

1. `00_RUNTIME_ARCHITECTURE_ANCHOR.md`
2. `01_PLATFORM_LAYERED_ARCHITECTURE.md`
3. `02_MODEL_GATEWAY.md`
4. `03_CONTEXT_BUILDER.md`
5. `04_KNOWLEDGE_FABRIC.md`
6. `05_INGESTION_AND_PARSING_PIPELINE.md`
7. `06_TOOL_LAYER.md`
8. `07_EVIDENCE_LEDGER_AND_GOVERNANCE.md`
9. `08_AGENT_RUNTIME_AND_HANDOFFS.md`
10. `09_RUNTIME_API_BOUNDARIES.md`
11. `10_MVP_V1_V2_ROADMAP.md`
12. `11_NEXUS_END_TO_END_EXECUTION_FLOW.md`
13. `12_RUNTIME_ACCEPTANCE_CRITERIA.md`
14. `RUNTIME_ARCHITECTURE_REVIEW_PACKET.md`

## Build Gate

Do not implement runtime code from this pack unless a slice explicitly allows it. Runtime work must name the service boundary, data contract, evidence contract, validation command, and rollback plan.
