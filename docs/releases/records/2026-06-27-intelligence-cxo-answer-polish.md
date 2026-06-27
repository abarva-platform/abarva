# 2026-06-27-intelligence-cxo-answer-polish — Intelligence aVa CXO answer polish

## Release ID

`2026-06-27-intelligence-cxo-answer-polish`

## Status

`candidate`

## Plain-English Summary

SkyHarbor live testing showed aVa repeatedly ended answers with the same generic follow-up question and exposed internal wording such as loaded evidence, loaded portfolio, tenant evidence, and referenced evidence. It also showed that post-model shaping was making answers less natural than the underlying Claude-style advisor response. This change moves answer ownership to Claude across Intelligence, Home, and Tower: Claude receives a shared visible-answer contract and the app stops appending endings or rewriting Intelligence prose after the model response.

## Layer Impact

- `global-control-lane`: Updates shared aVa response shaping, Intelligence answer policy, and public answer scrub rules used by client-facing advisor surfaces.
- No data-plane changes: Retrieval, tenant data, embeddings, and client corpus content are unchanged.

## Client Applicability

- All clients: Intelligence visible answer shaping and internal-language scrubbing apply globally.
- Specific clients: SkyHarbor Air is the live proof tenant for this release candidate.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/ava-answer/visible-answer-contract.ts`: adds the shared aVa visible-answer contract used by Intelligence, Home, and Tower prompts.
- `src/lib/intelligence/ask/synthesizer.ts`: removes the prompt mandate to use the same generic depth question, adds the shared visible-answer contract, and stops appending app-authored depth-choice questions.
- `src/lib/intelligence/ask/response-policy.ts`: removes the fallback generic closer and post-model prose rewrite path; the Intelligence answer policy now preserves Claude output.
- `src/lib/home/know/home-know-synthesis.ts`: adds the shared visible-answer contract to the Home Claude prompt while preserving Home's source-bound scope.
- `src/lib/atlas/prompt.ts`: adds the shared visible-answer contract to the Tower Claude prompt.
- `src/lib/atlas/orchestrator.ts`: stops forcing an app-authored Tower next-step fallback.
- `src/lib/answer/shared-response-shaper.ts`: prevents the shared shaper from reintroducing the generic closer and uses context-aware drill-down choices.
- `src/lib/ava-answer/public-answer-scrub.ts`: flags and scrubs additional internal answer language.
- `src/lib/intelligence/answer/structured-exhibits.ts`: suppresses model-authored markdown table rendering for plain advisory questions, removes renderer/debug notes, and keeps explicit table/chart/graph rendering for explicit artifact requests.
- `src/components/agent-answer/AgentAnswerRenderer.tsx`: stops appending visible source/citation chips inside the conversational aVa answer renderer.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: makes the `AVA · LATEST ANSWER` canvas prefer the cleaned `agent-answer` prose over the raw streamed body, so the canvas cannot retain a raw markdown table after the chat bubble is cleaned.
- `src/lib/ava-answer/renderable-artifacts.ts`: adds the shared visible-artifact gate so source-support/evidence tables stay in the evidence payload but do not render as executive answer content.
- `src/components/agent/AgentDock.tsx`: suppresses the compact evidence-basis panel on Intelligence chat turns and uses the shared visible-artifact gate before rendering structured packets.
- `src/components/agent/AgentDock.tsx`: keeps Intelligence chat turns prose-only even when the aVa dock is expanded; tables, charts, graphs, and other advanced visuals belong in the right-side Intelligence canvas.
- `src/lib/intelligence/ask/response-policy.ts`: removes the remaining app-authored generic fallback closer that told users to route the answer to Source, Tower, or Moves.
- `src/lib/intelligence/ask/synthesizer.ts`: changes explicit visual/table instructions so Claude emits compact Markdown rows that the runtime can lift into the right-side Intelligence canvas.
- `src/lib/intelligence/ask/synthesizer.ts`: tightens the explicit visual contract so direct user requests for a table, chart, graph, visual, comparison grid, ranking, breakdown, or "show me" structure must produce one compact decision table unless the necessary values or rows are genuinely unavailable.
- `src/lib/intelligence/ask/synthesizer.ts`: adds a runtime visual-contract repair pass for rich-text Intelligence answers: when the user explicitly asks for a visual/table and the first Claude draft has no renderable Markdown table, the runtime asks Claude to repair the same evidence-backed answer with exactly one compact decision table.
- Follow-up regression coverage now uses the eight 50-question SkyHarbor crawl failures that exposed raw `Supporting Material` / `How it supports the answer` tables.
- Focused regression tests updated to forbid the generic closer and assert context-specific alternatives.

## QA / Validation

- Pre-fix live SkyHarbor Chrome crawl captured in `/Users/anand/Downloads/skyharbor-intelligence-cxo-crawl-20260627`.
- Pre-fix crawl summary: 14 captured turns, 9 repeated generic closers, 12 internal evidence-language leaks, 2 weak-impact answers.
- `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/home/know/__tests__/home-know-synthesis.test.ts src/lib/atlas/__tests__/prompt-client-naming.test.ts --runInBand` passed, 36 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/synthesizer.ts src/lib/home/know/home-know-synthesis.ts src/lib/atlas/prompt.ts src/lib/atlas/orchestrator.ts src/lib/ava-answer/visible-answer-contract.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` passed.
- ACA deployment proof for the first candidate: ACR build `cawk`, image digest `sha256:6765cd1489a6ba4618a4a3943cfadb4914d1074d5f96c4c505695afd456c8576`, ACA revision `ca-abarva-web-lab-eastus--0000170`, 100% traffic.
- Partial signed-in SkyHarbor browser proof on `0000170`: answer ownership improved, but a plain advisory question still rendered an app-authored table/source metadata block (`Rendered from a Markdown table...`, `Tenant evidence`). This triggered the renderer-leak follow-up fix.
- `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` passed after the renderer-leak fix.
- `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` passed, 23 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- Partial signed-in SkyHarbor browser proof on `0000171`: chat bubble no longer showed `Tables`, `Answer Table`, `Rendered from`, `Tenant evidence`, or `source signals`, but the `AVA · LATEST ANSWER` canvas still showed the raw streamed markdown table from the model/API stream. This triggered the canvas preference fix.
- `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/answer/structured-exhibits.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` passed after the canvas fix.
- `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` passed, 27 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- 50-question SkyHarbor crawl follow-up received from Anand: 42/50 answer panels were clean, but Q2, Q3, Q8, Q10, Q21, Q27, Q35, and Q48 failed because raw evidence/source-support tables leaked into the visible answer experience. This is not demo-green until the follow-up fix is deployed and browser-proven.
- Main-based follow-up was initially rebased onto production/main `d9f5d72ad`; before final deployment it was rebased again onto current `origin/main` `fcddde4dc` so the fix does not overwrite the newer crown-jewel dossier runtime revision.
- `npx eslint src/lib/ava-answer/renderable-artifacts.ts src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/answer/structured-exhibits.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts` passed after the source-support-table follow-up fix.
- `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/agent/__tests__/AgentDock.test.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed, 90 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- New regression coverage asserts the right-side Intelligence canvas can render a decision table while the left aVa dock remains prose-only, with no `Tables` label or table markup in the dock turn.
- ACA proof for candidate `add51e40`: ACR build `caws`, image digest `sha256:4017dfb821a71aa1770412ae2fc10ba9e78649d040793847b3de49b7b057ed22`, ACA revision `ca-abarva-web-lab-eastus--madd51e40`, 100% traffic, runtime invariant passed.
- Signed-in browser proof on `madd51e40`: Lakeshore session correctly blocked SkyHarbor URL with `403 This tenant is not yours`, proving no tenant bleed; the signed-in Lakeshore Intelligence page opened on the new revision.
- Partial signed-in Lakeshore proof on `madd51e40`: left aVa dock stayed prose-only, but an explicit table request did not render a right-canvas table and still surfaced the old generic Source/Tower/Moves closer. This triggered the visual-prompt and fallback-closer follow-up fix.
- `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx` passed after the visual-prompt and fallback-closer follow-up fix.
- `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/agent/__tests__/AgentDock.test.tsx --runInBand` passed, 90 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- Live post-`a05440f3` Lakeshore proof confirmed the label/evidence cleanup held (`aVa · intelligence`, `answered`, `high confidence`, `Tenant evidence`, `How IT Supports The Answer`, and the generic Source/Tower/Moves closer were absent), but the explicit table prompt still returned prose-only. This follow-up strengthens the visual emission contract before final deploy proof.
- `npx eslint src/lib/intelligence/ask/synthesizer.ts` passed after the explicit visual contract tightening.
- Post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--m9c2918e9` confirmed the label/evidence cleanup still held, but the same explicit table prompt again returned prose-only (`tableCount: 0`). This proved prompt-only enforcement is insufficient and triggered the runtime visual-contract repair pass.
- `npx eslint src/lib/intelligence/ask/synthesizer.ts` passed after the runtime visual-contract repair pass.
- Final post-fix deployment and signed-in browser proof pending.

## Rollout Plan

Build an Azure Container Apps image from the exact git SHA, deploy to `ca-abarva-web-lab-eastus`, assign 100% ingress traffic to the healthy revision, then rerun signed-in SkyHarbor Intelligence prompts in Chrome.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps release path in `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: `az acr build`, `az containerapp update`, and ACA ingress traffic assignment.
- Approved image digest: first candidate `sha256:6765cd1489a6ba4618a4a3943cfadb4914d1074d5f96c4c505695afd456c8576`; latest proven-but-incomplete candidate `sha256:4017dfb821a71aa1770412ae2fc10ba9e78649d040793847b3de49b7b057ed22`; visual-prompt follow-up digest pending.
- ACA runtime invariant: `app.abarva.ai` is ACA-only; Vercel is not used as release evidence.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, SkyHarbor Chrome session plus no generic closer/internal-language crawl checks.

## Rollback Plan

Rollback by assigning 100% ACA ingress traffic to the previous healthy revision or redeploying the prior digest. No migration rollback is required.

## Audit Evidence

- Pre-fix crawl report: `/Users/anand/Downloads/skyharbor-intelligence-cxo-crawl-20260627/crawl-results.md`
- Focused Jest and ESLint output in the Codex execution log.
- First-candidate ACA proof: revision `ca-abarva-web-lab-eastus--0000170`, digest `sha256:6765cd1489a6ba4618a4a3943cfadb4914d1074d5f96c4c505695afd456c8576`, 100% traffic.
- Renderer-leak follow-up ACA proof: revision `ca-abarva-web-lab-eastus--0000171`, digest `sha256:5ccda7b17bfc92f1ab42459b24a9b8a62f0f98bbc2b1f1db2eed07b3b1b0be36`, 100% traffic; partial proof showed canvas still needed cleanup.
- Canvas-cleanup ACA proof: revision `ca-abarva-web-lab-eastus--0000172`, digest `sha256:8e4838111877d8413917f8fb57ab8689398bd6384305bff645292c65fdd69644`, 100% traffic; one-prompt signed-in proof passed for `Which AI initiatives should we kill?`, but Anand's later 50-question crawl still found eight evidence-table leak cases.
- Left-dock/right-canvas candidate ACA proof: revision `ca-abarva-web-lab-eastus--madd51e40`, digest `sha256:4017dfb821a71aa1770412ae2fc10ba9e78649d040793847b3de49b7b057ed22`, 100% traffic; runtime invariant passed; signed-in Lakeshore proof found the remaining explicit-table and generic-closer issues fixed by the next candidate.
- Post-deploy revision, digest, screenshots, and crawl output for the final visual-prompt fix to be added after production proof.

## Known Gaps

Post-deploy signed-in browser proof is pending until this candidate is built and released through ACA.
