# Runtime Acceptance Criteria

## Platform Criteria

- Agents do not call models directly.
- UI does not assemble prompts.
- Model calls go through Model Gateway.
- Context Builder is required for event-specific and program-specific responses.
- Product APIs sit above shared services.
- Knowledge Fabric separates vector, graph, relational state, object/raw files, and evidence ledger.
- Ingestion follows parse -> normalize -> chunk -> enrich -> extract -> embed -> persist -> evidence ledger.
- Models are not primary parsers.
- Evidence ledger tracks claim-to-source.
- Runtime trace records work object, context, tool use, model metadata when present, and response contract.

## Product Criteria

- Programs, Source, Intelligence, Control Tower, and Admin/Setup each declare work objects and context contracts.
- Missing data creates clear blocked, deferred, or low-confidence behavior.
- Agents expose context used and next action.
- Readiness states are consistent across product surfaces.
- Unsupported actions fail explicitly.

## Review Criteria

A runtime slice is acceptable only when validation proves the boundary. Documentation is not approval to implement runtime code.
