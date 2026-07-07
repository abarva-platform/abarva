# Parser Fallback Decision Tree

## Purpose

This runbook defines when AbarVa may use a fallback parser after the primary
document parser fails, returns low confidence, or produces visibly garbled
output. It covers backlog row T186: Marker as the private fallback and
LlamaParse as a consent-gated third-party fallback for non-sensitive documents.

## Default Path

1. Upload lands in the single-client data plane.
2. Malware scan and sensitive-data screening run before parsing.
3. Template metadata is validated or mapped.
4. Azure Document Intelligence remains the preferred layout parser for PDFs,
   tables, forms, and page-level provenance.
5. Parsed output is normalized, chunked, indexed, and linked to the evidence
   ledger only after quality and policy checks pass.

## Fallback Entry Criteria

Fallback parsing is eligible only when the primary parser outcome is one of:

- `failed`
- `garbled`
- `low_confidence`
- `unsupported_layout`

Fallback parsing is not eligible when the primary parser succeeded.

## Blocking Gates

Do not use any fallback parser when:

- malware scan is `pending` or `failed`;
- template state is `missing` or `needs_mapping`;
- the document kind is not supported by the fallback policy;
- an operator has not explicitly approved fallback for this file and run.

These states move the item to manual review. They do not commit parsed output to
the corpus, search index, graph, deliverables, or evidence ledger.

## Marker Self-Hosted Fallback

Use Marker as the first fallback when any of these are true:

- sensitivity is `unknown`, `suspected_sensitive`, or `confirmed_sensitive`;
- data class is `restricted` or `regulated`;
- customer third-party processing consent is absent;
- the operator wants a private fallback path before considering a third party.

Marker must run inside the controlled environment for the client processing
run. Its output is still uncommitted until an operator reviews parser quality,
provenance, and extracted facts.

## LlamaParse Third-Party Fallback

LlamaParse may be used only when all of these are true:

- malware scan has passed;
- template metadata is validated or not required;
- sensitivity is `none_detected`;
- data class is not `restricted` or `regulated`;
- the operator approved fallback for this file and run;
- the customer explicitly approved third-party processing for this file class
  or processing event.

LlamaParse output is uncommitted extraction evidence. It must not populate the
retrieval corpus, search index, graph, client deliverables, or generated
recommendations until a human approves the result.

## Ledger Events

Every fallback decision should record:

- artifact id and client scope;
- primary parser id and outcome;
- fallback route;
- sensitivity and data-class state;
- malware scan state;
- template state;
- operator approval;
- customer third-party consent state;
- commit status.

The repo-native policy helper emits deterministic decision metadata in
`src/lib/ingestion/parser-fallback-policy.ts`. The runtime orchestrator in
`src/lib/ingestion/parser-fallback-runtime.ts` uses that policy before invoking
any fallback adapter. It records decision, invocation, result, and failure
events and keeps every fallback parse result uncommitted until human review.

## Out Of Scope

This runbook, policy helper, and runtime orchestrator do not install Marker,
provision LlamaParse, configure external parser credentials, or prove a live
end-to-end parser run. The runtime uses injected adapters so the governance
boundary is enforceable and testable before live service wiring.
