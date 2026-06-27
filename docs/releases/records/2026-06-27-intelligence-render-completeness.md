# 2026-06-27-intelligence-render-completeness — Intelligence Render Completeness Guard

## Release ID

`2026-06-27-intelligence-render-completeness`

## Status

`candidate`

## Plain-English Summary

This release candidate hardens the Intelligence/aVa response path after the Lakeshore quality crawl found strong reasoning rendered poorly. It routes visible response cleanup through the shared agent response shaper and adds a fixed-count completeness validator so prompts that ask for three moves, five priorities, or similar multi-part answers do not silently render only the first item.

2026-06-27 follow-up: a live user review found that the answer bubble still exposed evidence/scaffold labels such as `Evidence trail`, `Evidence drill-down`, `supporting material`, and `Next: ask aVa...`. This record now also covers the scoped answer-bubble cleanup that keeps evidence available in the evidence UI while removing evidence/debug labels from the advisor prose.

2026-06-27 follow-up 2: live demo review found that aVa answers were still too long for executive demo flow. This record now also covers concise-by-default answer caps plus a short choice question for optional drill-down instead of dumping the full explanation in the first response.

2026-06-27 follow-up 3: signed-in production proof on ACA revision `0000164` found the first Lakeshore answer still appended a visible `TABLES evidence` source-register block under the concise prose. This record now also covers suppressing evidence-only aVa packets in visible chat/canvas rendering while preserving structured tables/charts/graphs when explicitly requested.

2026-06-27 follow-up 4: signed-in production proof on ACA revision `0000165` confirmed the `TABLES evidence` source-register block was removed, but the same plain advisory prompt still rendered a markdown table in the answer bubble. This record now also covers forcing markdown-table prose through the chat compactor unless the UI is rendering an explicit structured artifact.

2026-06-27 follow-up 5: signed-in production proof on ACA revision `0000166` confirmed the visible evidence block and markdown table were removed, but the answer ended with an internal routing-style next step and split an "honest answer" lead-in awkwardly. This record now also covers a cleaner choice-style close, such as `Want the deeper path: evidence, risks, or next actions?`, and stripping canned lead-in wording.

2026-06-27 follow-up 6: signed-in production proof on ACA revision `0000167` confirmed concise output, no visible evidence table, no markdown table, and the choice-style close, but still exposed the internal product-routing phrase `belongs in Source, Tower, or Moves`. This record now also covers removing internal product-routing next steps from executive-facing answers.

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
- `src/lib/answer/shared-response-shaper.ts`: normalizes canned `Next: ask aVa...` instructions into a plain next step, tightens default chat-bubble compaction, compacts inline markdown tables in plain advisory answers, prefers a choice-style close for deeper drill-down, and removes internal Source/Tower/Moves routing language.
- `src/lib/agent/multipart-completeness.ts`: adds fixed-count request detection, observed/missing part validation, and repair-instruction formatting.
- `src/lib/intelligence/ask/advisor-composer.ts`: reduces special advisor-route token and word caps so demo answers do not become mini-memos.
- `src/lib/intelligence/ask/synthesizer.ts`: changes aVa's default answer contract to 60-100 words for simple answers and 120-160 words for decision answers, then appends a short choice question when more depth is available.
- `src/lib/intelligence/ask/synthesizer.ts`: increases token/word budgets for fixed-count asks, adds a fixed-count system instruction, validates the final draft, and performs one repair pass before streaming.
- `src/lib/intelligence/answer/structured-exhibits.ts`: gates source-owned evidence tables so they render only for explicit table/chart/graph requests.
- `src/components/agent/AgentDock.tsx`: renders evidence-only aVa packets as concise shaped prose instead of exposing Sources/evidence sections in the chat bubble.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: applies the same visual-artifact guard to the Intelligence latest-answer canvas.
- `src/lib/agent/__tests__/multipart-completeness.test.ts`: regression tests for missing multi-part answers.
- `src/lib/agent/__tests__/response-shape.test.ts`: regression tests for raw evidence dump cleanup and currency preservation.
- `src/lib/answer/__tests__/shared-response-shaper.test.ts`: regression tests that the answer bubble does not tell the user to `ask aVa`, does not show inline markdown tables for plain advisory answers, closes with evidence/risk/action choices, and strips internal product-routing next steps.
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`: regression test that public prose does not expose `supporting material`.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: budget guardrails for fixed-count requests.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: regression for shorter default budgets and the optional depth-choice question.

## QA / Validation

- Pass: focused eslint for touched implementation and test files.
- Pass: multipart completeness Jest regression test.
- Pass: response-shape Jest regressions for raw evidence dump cleanup and currency preservation.
- Pass: shared response shaper Jest regressions for answer-bubble cleanup.
- Pass: AgentAnswerRenderer public prose scrub regression.
- Pass: Ask guardrail Jest regressions for concise and fixed-count budgets.
- Pass: Ask guardrail Jest regression for concise depth-choice prompt.
- Pass: Intelligence route focused regression proving plain advisory answers can carry citations without visible evidence-table artifacts.
- Pass: AgentDock focused regression proving evidence-only aVa packets render as concise prose while explicit structured response parts still render.
- Pass: shared response shaper regression proving a plain advisory answer with a markdown initiative table compacts into concise prose.
- Pass: shared response shaper regression proving choice-style close replaces generic next-step scaffolding.
- Pass: shared response shaper regression proving internal Source/Tower/Moves routing language is removed from executive answers.
- Pass: release control check after the evidence-exhaust fix.
- Pass: ACR Docker/Next production build for the base completeness fix.
- Pass: ACA deployment of the base completeness fix to `ca-abarva-web-lab-eastus--0000163`.
- Pass: signed-in browser proof for the fixed-count 3-step Kyriba answer on revision `0000163`.
- Pass: ACA deployment of concise render fix to `ca-abarva-web-lab-eastus--0000164`.
- Fail: signed-in browser proof on `0000164` found a visible `TABLES evidence` block after the concise answer; this triggered the evidence-exhaust follow-up fix.
- Pass: ACA deployment of evidence-exhaust fix to `ca-abarva-web-lab-eastus--0000165`.
- Partial: signed-in browser proof on `0000165` confirmed no visible `TABLES`, `HOW IT SUPPORTS THE ANSWER`, or `SOURCE TYPE CONFIDENCE` block, but found inline markdown-table overload for the same plain advisory question.
- Pass: ACA deployment of markdown-table compaction fix to `ca-abarva-web-lab-eastus--0000166`.
- Partial: signed-in browser proof on `0000166` confirmed no visible `TABLES`, `HOW IT SUPPORTS THE ANSWER`, `SOURCE TYPE CONFIDENCE`, or markdown table rows, but found a generic routing-style close instead of the intended choice-style drill-down close.
- Pass: ACA deployment of choice-close fix to `ca-abarva-web-lab-eastus--0000167`.
- Partial: signed-in browser proof on `0000167` confirmed no visible evidence table, no markdown table, and the choice-style close, but found internal `Source, Tower, or Moves` product-routing language.
- Pending: ACA image build/deploy and signed-in browser proof for the internal-language cleanup follow-up fix.
- Known unrelated current-main gap: the full `response-shape.test.ts` file has two pre-existing Tower expectation failures against current `origin/main`; they are not introduced by this Intelligence slice.
- Known unrelated route-test gap: the full Intelligence Ask route telemetry file currently has older broad-suite expectation failures around mocked request headers/tenantId and expert-chip routing. Focused regressions for this render fix pass.

## Rollout Plan

Merge or deploy this release candidate through the approved Azure Container Apps lane. Production proof must capture the active ACA revision/image digest and a signed-in Intelligence crawl before the follow-up answer-bubble cleanup is marked released.

## Rollback Plan

Revert this release candidate's code/test changes and redeploy the prior healthy Azure Container Apps image. No migration or data rollback is required.

## Audit Evidence

- Base deployment proof: ACR build `caw7`, image digest `sha256:2313578a36ce8483f36c5e8f70a5815a9c87271523e36fb032b42adb37239a89`, ACA revision `ca-abarva-web-lab-eastus--0000163`, 100% traffic.
- Base signed-in proof: Lakeshore Intelligence rendered `aVa`, not Sentinel, and a 3-step Kyriba answer contained Step 1, Step 2, and Step 3.
- Concise render deployment proof: ACR build `cawa`, image digest `sha256:48fd914c22cdd2b80c1749ebd1207f7850c414ab161db1eec0da7ae941fb8136`, ACA revision `ca-abarva-web-lab-eastus--0000164`, 100% traffic.
- Concise render signed-in proof: Lakeshore Intelligence rendered `aVa` and flexible dock modes; same proof found the visible `TABLES evidence` defect.
- Evidence-exhaust deployment proof: ACR build `cawc`, image digest `sha256:1a871780a69077a987afc7ae566dea71ee43c091efb0c537982112b40b7d43de`, ACA revision `ca-abarva-web-lab-eastus--0000165`, 100% traffic.
- Evidence-exhaust signed-in proof: Lakeshore Intelligence rendered `aVa`; the same finance/treasury advisory prompt no longer showed visible `TABLES`, `HOW IT SUPPORTS THE ANSWER`, or `SOURCE TYPE CONFIDENCE`, but still showed an inline markdown table and therefore required follow-up.
- Markdown-table compaction deployment proof: ACR build `cawd`, image digest `sha256:5d30b633de3010e42ec862c6304d7398a509d45bbff09231a74e2b25c2886348`, ACA revision `ca-abarva-web-lab-eastus--0000166`, 100% traffic.
- Markdown-table compaction signed-in proof: Lakeshore Intelligence rendered `aVa`; the same finance/treasury advisory prompt no longer showed visible evidence blocks or markdown table rows, but still used a generic routing-style close and therefore required follow-up.
- Choice-close deployment proof: ACR build `cawf`, image digest `sha256:cbd3cdcbad0dad8a166fb62e8a764a617f8a1796ebfec573a601d2e0c900c6e3`, ACA revision `ca-abarva-web-lab-eastus--0000167`, 100% traffic.
- Choice-close signed-in proof: Lakeshore Intelligence rendered `aVa`; the same finance/treasury advisory prompt no longer showed visible evidence blocks, markdown table rows, or generic non-choice close, but still exposed internal `Source, Tower, or Moves` routing language and therefore required follow-up.
- Pending: signed-in browser re-crawl on `https://app.abarva.ai/intelligence` after the internal-language cleanup follow-up deployment.
- Pending: proof artifact showing answers render without raw evidence labels/scaffolding in the main response bubble.

## Context Ingestion Evidence

Not applicable. This release does not touch Admin Data Loads, setup/admin loaders, Azure Blob staging, private worker queues, document parsing, client context/corpus loading, embeddings, or retrieval.

## Known Gaps

- Internal-language cleanup follow-up fix is locally validated but not yet deployed to ACA.
