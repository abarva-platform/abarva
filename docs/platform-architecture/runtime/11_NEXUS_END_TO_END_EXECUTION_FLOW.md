# Nexus End-To-End Execution Flow

## Purpose

Define how Nexus should execute a work-specific response from user action to governed output.

## Flow

1. User acts on a product surface.
2. Product API identifies the work object and requested action.
3. Permissions and tenancy are checked.
4. Context Builder assembles work-object context.
5. Context quality is scored.
6. Missing inputs and evidence readiness are identified.
7. Nexus response contract is selected.
8. Deterministic tools run if needed and allowed.
9. Model Gateway is invoked only if model use is approved for the slice.
10. Evidence ledger links claims to sources.
11. Audit trace records context, tools, model metadata when present, and response contract.
12. Product API returns typed response and next action.

## Response Requirements

Nexus responses must show context used, confidence or readiness, missing context when relevant, and a next useful action. If the answer is blocked, Nexus should say what is blocking it.

## Failure States

Nexus must handle missing work object, missing evidence, access restriction, stale context, unsupported action, validation failure, model unavailable, and tool denied.

## Non-Goals

This flow does not implement chat UI, model calls, upload/parsing, workflow engine, approval engine, or product-specific UI.
