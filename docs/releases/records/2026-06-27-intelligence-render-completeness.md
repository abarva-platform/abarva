# 2026-06-27-intelligence-render-completeness — Intelligence Render Completeness Guard

## Release ID

`2026-06-27-intelligence-render-completeness`

## Status

`candidate`

## Plain-English Summary

This release candidate hardens the Intelligence/aVa response path after the Lakeshore quality crawl found strong reasoning rendered poorly. It routes visible response cleanup through the shared agent response shaper and adds a fixed-count completeness validator so prompts that ask for three moves, five priorities, or similar multi-part answers do not silently render only the first item.

2026-06-27 follow-up: a live user review found that the answer bubble still exposed evidence/scaffold labels such as `Evidence trail`, `Evidence drill-down`, `supporting material`, and `Next: ask aVa...`. This record now also covers the scoped answer-bubble cleanup that keeps evidence available in the evidence UI while removing evidence/debug labels from the advisor prose.

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
- `src/lib/ava-answer/public-answer-scrub.ts`: stops converting ordinary evidence language into `supporting material` and preserves natural advisor wording.
- `src/lib/answer/shared-response-shaper.ts`: normalizes canned `Next: ask aVa...` instructions into a plain next step.
- `src/lib/agent/multipart-completeness.ts`: adds fixed-count request detection, observed/missing part validation, and repair-instruction formatting.
- `src/lib/intelligence/ask/synthesizer.ts`: increases token/word budgets for fixed-count asks, adds a fixed-count system instruction, validates the final draft, and performs one repair pass before streaming.
- `src/lib/agent/__tests__/multipart-completeness.test.ts`: regression tests for missing multi-part answers.
- `src/lib/agent/__tests__/response-shape.test.ts`: regression tests for raw evidence dump cleanup and currency preservation.
- `src/lib/answer/__tests__/shared-response-shaper.test.ts`: regression test that the answer bubble does not tell the user to `ask aVa`.
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`: regression test that public prose does not expose `supporting material`.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: budget guardrails for fixed-count requests.

## QA / Validation

- Pass: focused eslint for touched implementation and test files.
- Pass: multipart completeness Jest regression test.
- Pass: response-shape Jest regressions for raw evidence dump cleanup and currency preservation.
- Pass: shared response shaper Jest regressions for answer-bubble cleanup.
- Pass: AgentAnswerRenderer public prose scrub regression.
- Pass: Ask guardrail Jest regressions for concise and fixed-count budgets.
- Pass: ACR Docker/Next production build for the base completeness fix.
- Pass: ACA deployment of the base completeness fix to `ca-abarva-web-lab-eastus--0000163`.
- Pass: signed-in browser proof for the fixed-count 3-step Kyriba answer on revision `0000163`.
- Pending: ACA image build/deploy and signed-in browser proof for the follow-up answer-bubble evidence-label cleanup.
- Known unrelated current-main gap: the full `response-shape.test.ts` file has two pre-existing Tower expectation failures against current `origin/main`; they are not introduced by this Intelligence slice.

## Rollout Plan

Merge or deploy this release candidate through the approved Azure Container Apps lane. Production proof must capture the active ACA revision/image digest and a signed-in Intelligence crawl before the follow-up answer-bubble cleanup is marked released.

## Rollback Plan

Revert this release candidate's code/test changes and redeploy the prior healthy Azure Container Apps image. No migration or data rollback is required.

## Audit Evidence

- Base deployment proof: ACR build `caw7`, image digest `sha256:2313578a36ce8483f36c5e8f70a5815a9c87271523e36fb032b42adb37239a89`, ACA revision `ca-abarva-web-lab-eastus--0000163`, 100% traffic.
- Base signed-in proof: Lakeshore Intelligence rendered `aVa`, not Sentinel, and a 3-step Kyriba answer contained Step 1, Step 2, and Step 3.
- Pending: signed-in browser re-crawl on `https://app.abarva.ai/intelligence` after the follow-up answer-bubble cleanup ACA deployment.
- Pending: proof artifact showing answers render without raw evidence labels/scaffolding in the main response bubble.

## Context Ingestion Evidence

Not applicable. This release does not touch Admin Data Loads, setup/admin loaders, Azure Blob staging, private worker queues, document parsing, client context/corpus loading, embeddings, or retrieval.

## Known Gaps

- Follow-up answer-bubble evidence-label cleanup is locally validated but not yet deployed to ACA.
