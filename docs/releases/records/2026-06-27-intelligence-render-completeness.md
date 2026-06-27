# 2026-06-27-intelligence-render-completeness — Intelligence Render Completeness Guard

## Release ID

`2026-06-27-intelligence-render-completeness`

## Status

`candidate`

## Plain-English Summary

This release candidate hardens the Intelligence/aVa response path after the Lakeshore quality crawl found strong reasoning rendered poorly. It routes visible response cleanup through the shared agent response shaper and adds a fixed-count completeness validator so prompts that ask for three moves, five priorities, or similar multi-part answers do not silently render only the first item.

## Layer Impact

- `global-control-lane`: Shared agent response rendering and Intelligence Ask synthesis behavior change for all clients using the shared AgentDock/Ask path.
- `client-data-lane`: No client data, ingestion, embedding, retrieval, schema, or corpus changes.

## Deployment Authority

Approved by Anand in-thread on 2026-06-27 with the explicit instruction: `deploy`.

## Client Applicability

- All clients: Applies to shared Intelligence/aVa rendering and Ask synthesis.
- Specific clients: Validated against Lakeshore-style defects from the signed-in audit prompt.
- Internal only: Not applicable.
- Public/demo only: Not applicable.
- Feature flag: Not feature-gated.

## Changes Included

- `src/lib/agent/response-shape.ts`: cleans generic routing footers, raw evidence labels, raw evidence table dumps, and high-confidence currency shorthand in shared streamed/final response shaping.
- `src/lib/agent/multipart-completeness.ts`: adds fixed-count request detection, observed/missing part validation, and repair-instruction formatting.
- `src/lib/intelligence/ask/synthesizer.ts`: increases token/word budgets for fixed-count asks, adds a fixed-count system instruction, validates the final draft, and performs one repair pass before streaming.
- `src/lib/agent/__tests__/multipart-completeness.test.ts`: regression tests for missing multi-part answers.
- `src/lib/agent/__tests__/response-shape.test.ts`: regression tests for raw evidence dump cleanup and currency preservation.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: budget guardrails for fixed-count requests.

## QA / Validation

- Pass: focused eslint for touched implementation and test files.
- Pass: multipart completeness Jest regression test.
- Pass: response-shape Jest regressions for raw evidence dump cleanup and currency preservation.
- Pass: Ask guardrail Jest regressions for concise and fixed-count budgets.
- Pending: TypeScript compile with larger Node heap after default-heap local OOM.
- Pending: release gate after this release-record update.
- Pending: ACA image build/deploy and signed-in browser proof.
- Known unrelated current-main gap: the full `response-shape.test.ts` file has two pre-existing Tower expectation failures against current `origin/main`; they are not introduced by this Intelligence slice.

## Rollout Plan

Merge or deploy this release candidate through the approved Azure Container Apps lane. Production proof must capture the active ACA revision/image digest and a signed-in Intelligence crawl before this candidate is marked released.

## Rollback Plan

Revert this release candidate's code/test changes and redeploy the prior healthy Azure Container Apps image. No migration or data rollback is required.

## Audit Evidence

- Pending: clean-branch validation output.
- Pending: signed-in browser re-crawl on `https://app.abarva.ai/intelligence` after ACA deployment.
- Pending: screenshot/proof artifact showing fixed Lakeshore-style answers rendered without raw table dumps and with complete multi-part responses.

## Context Ingestion Evidence

Not applicable. This release does not touch Admin Data Loads, setup/admin loaders, Azure Blob staging, private worker queues, document parsing, client context/corpus loading, embeddings, or retrieval.

## Known Gaps

- Production deployment and signed-in browser proof are pending until this record is updated after ACA deployment.
