# Admin Data Layer Explorer Proof

## Purpose

A read-only map of how client files become evidence-backed facts, relationships, insights, candidate previews, and eventually active module context.

## Truth Split

Implemented:

- Read-only Admin page.
- Left-rail data journey navigation.
- Input category catalogue.
- Input-to-layer flow explanation.
- Page-to-layer mapping.
- Quality check catalogue.
- Guardrail catalogue.
- Current status and caveats where runtime wiring is not available.
- Generated proof artifacts for section, page, quality, guardrail, and summary review.

Not implemented:

- No upload execution.
- No validation execution.
- No candidate creation.
- No candidate promotion.
- No production tenant data writes.
- No Active Tenant Access update.
- No module runtime behavior change.
- No chat-led Admin flow.

## Inventory

- Sections: 18
- Input categories: 19
- Pipeline steps: 16
- Page mappings: 9
- Quality checks: 14
- Guardrails: 9

## Section Status

- Overview: Read-only explorer implemented; live data execution is intentionally out of scope.
- Input Files: Catalogue implemented; upload and validation execution are not implemented on this page.
- Tenant Packet: Contract exists in the data runway; this Admin page explains it and does not create packets.
- Evidence: Existing read models can expose evidence summaries where wired; missing fields should show Not available yet.
- Parsing & Extraction: Explained here; execution belongs to ingestion dry-run and future Admin validation flows.
- Validation: Quality catalogue implemented; validation execution is intentionally out of scope for this page.
- Known Facts: Summaries are available where read models are wired; absent fields should be reported as Not wired yet.
- Relationships: Graph plans and summaries are part of the data runway; this page exposes the business meaning.
- Insights: Insight types are catalogued; live insight generation remains governed by the existing module paths.
- Candidate Preview: Preview runway exists; this page documents it and does not open preview sessions.
- Promotion Readiness: Promotion gate proof exists in the data runway; this page is read-only and never promotes.
- Active Access: Show Not wired yet where active pointer evidence is not available.
- Module Usage: Mapped in this page; module runtime behavior is unchanged.
- Outcome Ledger: Ledger concept is mapped; module-specific measured data must come from Tower/read models where wired.
- Benchmarks: Benchmark inputs are catalogued; live benchmark rendering depends on module wiring.
- Page Mapping: Implemented as a static read-only map on this page.
- Quality Checks: Catalogue implemented; this page does not execute validations.
- Guardrails: Guardrail catalogue implemented for read-only visibility.

## Page Wiring Status

- Admin Overview: Partially wired; caveats should show when active pointer is unavailable.
- Data Intake Library: Templates and guidance available; validation execution is out of scope.
- Tenant Packet Builder: Contract described; packet creation controls remain separate.
- Candidate Preview: Preview path exists; this explorer does not create preview sessions.
- Home: Home can show context; active truth status must remain caveated unless proven.
- Intelligence: Runtime path unchanged by this PR.
- Moves: Runtime path unchanged by this PR.
- Source: Runtime path unchanged by this PR.
- Tower: Runtime path unchanged by this PR.

## Runtime Guardrails

- productionTenantDataWritten: false
- candidateCreated: false
- candidatePromoted: false
- activeTenantAccessLayerUpdated: false
- moduleRuntimeConsumptionChanged: false
- moduleReadsCandidateByDefault: false
