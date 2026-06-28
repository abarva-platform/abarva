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
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: moves the visual-contract repair into the active consultant-synthesis lane used in production and adds a conservative grounded fallback table from the existing decision-option packet if Claude still returns prose-only for an explicit visual/table ask.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: tightens the active consultant-lane visual gate so one-row repaired tables are not accepted for comparison/table prompts; undersized model tables are stripped and replaced by the multi-row metric/decision fallback.
- `src/lib/intelligence/answer/structured-exhibits.ts`: removes renderer/provenance notes from user-visible extracted tables so the right-side canvas shows the decision artifact without implementation/debug language.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: adds a final narrative-grounded visual fallback so explicit comparison/table asks can be rendered from the already-grounded advisor answer when normalized decision/metric packet rows are sparse.
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
- ACA proof for candidate `c2517f4c`: revision `ca-abarva-web-lab-eastus--mc2517f4c`, digest `sha256:81790f937cf6fa077ac392722e2dc58caab2ca54bc692c591809634465f4bdf2`, 100% traffic, runtime invariant passed.
- Post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--mc2517f4c` confirmed the label/evidence cleanup still held in the likely answer surface, but the same explicit table prompt still returned prose-only (`tableCount: 0`). Root cause: production used the newer consultant-text synthesis lane before reaching the older synthesizer repair pass.
- `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` passed after moving visual repair into the active consultant-synthesis lane.
- `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` passed, 5 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for current-main candidate `48648ac3`: revision `ca-abarva-web-lab-eastus--m48648ac3`, digest `sha256:3828f676e4c5bc700aa40700dd3205bc260a5feee26b23036208d3393c7dc6d1`, 100% traffic, runtime invariant passed.
- Post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--m48648ac3` confirmed the label/evidence cleanup still held and no generic closer returned, but the explicit table prompt still returned prose-only (`tableCount: 0`). Root cause: the deterministic consultant-lane fallback only rendered from formal decision-option rows; this Lakeshore finance/treasury question had metric/initiative evidence but insufficient option rows for the fallback table.
- `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` passed after adding metric-evidence fallback table rendering.
- `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` passed, 6 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for metric-fallback candidate `230c0bfa`: revision `ca-abarva-web-lab-eastus--m230c0bfa`, digest `sha256:9bf1586f59e97ac123b447e20e1fa3b8b3f70e021056ab6507281f2c8c948bb1`, 100% traffic, runtime invariant passed, production health endpoint returned OK.
- Partial post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--m230c0bfa`: the explicit table prompt rendered a real right-canvas table (`tableCount: 1`) and label/evidence cleanup still held, but the table was only one row and showed renderer/provenance text (`Rendered from a Markdown table...`). This triggered the undersized-table and renderer-note follow-up fix.
- `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` passed after the undersized-table and renderer-note follow-up fix.
- `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` passed, 32 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for undersized-table candidate `9c30dc7c`: revision `ca-abarva-web-lab-eastus--m9c30dc7c`, digest `sha256:91e480c83c65edf1131ac2f93dcbb98c4ff8a87cc42b8309a3d6208dd4216aa8`, 100% traffic, runtime invariant passed, production health endpoint returned OK.
- Partial post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--m9c30dc7c`: label/evidence/generic-closer cleanup held and renderer captions were absent, but the explicit table prompt returned prose-only (`tableCount: 0`). Root cause: after rejecting the one-row model table, normalized decision/metric packet rows were still sparse for this live Lakeshore narrative. This triggered the final narrative-grounded fallback.
- `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` passed after the narrative-grounded fallback.
- `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` passed, 8 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for narrative-fallback candidate `b348f581`: revision `ca-abarva-web-lab-eastus--mb348f581`, digest `sha256:bc7d92259e5248908db8e1bfd3254e84fdccb6a8319f6fd5eade6a8a2c7ebb8a`, 100% traffic, production health endpoint returned OK.
- Partial post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--mb348f581`: label/evidence/generic-closer cleanup held and a right-canvas table rendered (`tableCount: 1`), but the table contained only one data row for a "top finance and treasury AI initiatives" comparison. Root cause: the active lane still accepted undersized repaired model tables before falling through to richer metric/narrative fallback generation. This triggered the row-count quality gate follow-up.
- `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts` passed after the row-count quality gate follow-up.
- `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand` passed, 8 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for row-count-gate candidate `ccf82aaf`: revision `ca-abarva-web-lab-eastus--mccf82aaf`, digest `sha256:5e9281246419c358ea3503fdc6b2268aa813fe474f25fd69efc275769deb6238`, 100% traffic, production health endpoint returned OK.
- Post-deploy signed-in Lakeshore proof on revision `ca-abarva-web-lab-eastus--mccf82aaf`: label/evidence/generic-closer cleanup held and the explicit comparison prompt rendered a right-canvas table with 3 data rows / 4 total rows.
- Post-deploy signed-in SkyHarbor Chrome proof on revision `ca-abarva-web-lab-eastus--mccf82aaf`: the generic Source/Tower/Moves closer was absent and no evidence/support table rendered for `What is the single best AI investment SkyHarbor should make next?`; however the answer still included internal-ish phrase `supporting material ledger`, which triggered this final public wording scrub follow-up.
- `npx eslint src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/render-layer-shaper.ts src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx` passed after the SkyHarbor wording scrub follow-up.
- `npx jest src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` passed, 8 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for the SkyHarbor wording scrub carried forward by main candidate `c21ec379`: revision `ca-abarva-web-lab-eastus--mc21ec379`, digest `sha256:5be3844df2e2f1b80fd842a959d138209b33b0e96cf201deccabb5e87d839ce4`, 100% traffic, production health endpoint returned OK.
- Post-deploy signed-in SkyHarbor Chrome proof on revision `ca-abarva-web-lab-eastus--mc21ec379`: the old `supporting material ledger` phrase, generic Source/Tower/Moves closer, `answered high confidence` label, and evidence/support table were absent on a fresh ask. However the answer still contained a stray leading quote before `Here's why` and an orphan fragment `6 vs.`. This failed the CXO-quality bar and triggered the deeper post-model shaper simplification.
- `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/__tests__/public-answer-scrub.test.ts` passed after the deeper shaper simplification.
- `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/ava-answer/__tests__/public-answer-scrub.test.ts --runInBand` passed, 20 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for deeper shaper candidate `40ecdce0`: revision `ca-abarva-web-lab-eastus--m40ecdce0`, digest `sha256:906b8ac832763a5268066eb63ac49ced3b7b5ff505c1f4914840491495da2ccb`, 100% traffic, production health endpoint returned OK.
- Post-deploy signed-in SkyHarbor Chrome proof on revision `ca-abarva-web-lab-eastus--m40ecdce0`: the stray leading quote and `6 vs.` fragment were absent, but the right canvas still included `Here's the logic` / `loaded tenant evidence`, and the left aVa dock showed a duplicated/truncated compact summary instead of the full advisor answer. Root cause: Intelligence dock rendering still flowed through the shared chat compactor and streaming deltas could overwrite the structured answer body.
- `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/__tests__/public-answer-scrub.test.ts` passed after the left-dock/right-canvas follow-up fix.
- `npx jest src/components/agent/__tests__/AgentDock.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/lib/ava-answer/__tests__/public-answer-scrub.test.ts --runInBand` passed, 51 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for left-dock/right-canvas candidate `6afb0744`: revision `ca-abarva-web-lab-eastus--m6afb0744`, digest `sha256:5e44138eafba2a74aa04340fbafb4b34a494986499e9dd0609e69b35cdc53f5e`, 100% traffic; production health endpoint returned OK.
- Post-deploy signed-in SkyHarbor Chrome proof on revision `ca-abarva-web-lab-eastus--m6afb0744`: the compact truncation and earlier `Here's the logic` leak were improved, but the answer still exposed session-history and implementation wording: `last three times this session`, `tenant evidence`, `loaded evidence`, plus a dangling conditional closer. This failed the CXO-quality bar and triggered the session/evidence-language scrub and visible-answer contract follow-up.
- `npx eslint src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/visible-answer-contract.test.ts` passed after the session/evidence-language follow-up.
- `npx jest src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/lib/agent/__tests__/visible-answer-contract.test.ts --runInBand` passed, 14 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- ACA proof for session/evidence-language candidate `d9237a77`: revision `ca-abarva-web-lab-eastus--md9237a77`, digest `sha256:de27d069fe1f1f921f9813909855206835f40806fd485b54c8a508536f7200e6`, 100% traffic; production health endpoint returned OK.
- Post-deploy signed-in SkyHarbor Chrome proof on revision `ca-abarva-web-lab-eastus--md9237a77`: `tenant evidence`, `loaded evidence`, `evidence base gap`, evidence tables, and generic closers were absent, but the answer still exposed a different session-history variant: `Same answer as the last four turns`, plus CXO-unfriendly `substrate` wording and `priority table` prose without a rendered table. This failed the CXO-quality bar and triggered the broader session-history/substrate scrub follow-up.
- ACA proof for session-history/substrate candidate `cf80e72d`: revision `ca-abarva-web-lab-eastus--mcf80e72d`, digest `sha256:18a6974040a123a428e6dee24f4a0002ad2c21a08c3a6d9db58df7f742cd286c`, 100% traffic; production health endpoint returned OK.
- Post-deploy signed-in SkyHarbor Chrome proof on revision `ca-abarva-web-lab-eastus--mcf80e72d`: `same answer as`, `tenant evidence`, `loaded evidence`, `substrate`, `priority table`, evidence tables, and generic closers were absent, but the answer still exposed another session-history variant, `The answer hasn't changed across this session`, plus a mid-answer dangling conditional closer and a clipped `5M events daily...` sentence. This failed the CXO-quality bar and triggered the broader session-history/dangling-closer follow-up.
- `npx eslint src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/visible-answer-contract.test.ts` passed after the session-history/dangling-closer follow-up.
- `npx jest src/lib/ava-answer/__tests__/public-answer-scrub.test.ts src/lib/agent/__tests__/visible-answer-contract.test.ts --runInBand` passed, 16 tests. Jest still prints pre-existing duplicate manual-mock warnings.
- Final post-session-history/dangling-closer deployment and signed-in SkyHarbor browser proof pending.

## Rollout Plan

Build an Azure Container Apps image from the exact git SHA, deploy to `ca-abarva-web-lab-eastus`, assign 100% ingress traffic to the healthy revision, then rerun signed-in SkyHarbor Intelligence prompts in Chrome.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps release path in `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: `az acr build`, `az containerapp update`, and ACA ingress traffic assignment.
- Approved image digest: first candidate `sha256:6765cd1489a6ba4618a4a3943cfadb4914d1074d5f96c4c505695afd456c8576`; latest proven-but-wording-incomplete row-count candidate `sha256:5e9281246419c358ea3503fdc6b2268aa813fe474f25fd69efc275769deb6238`; SkyHarbor wording scrub carried forward on main digest `sha256:5be3844df2e2f1b80fd842a959d138209b33b0e96cf201deccabb5e87d839ce4`; deeper shaper digest `sha256:906b8ac832763a5268066eb63ac49ced3b7b5ff505c1f4914840491495da2ccb`; left-dock/right-canvas digest `sha256:5e44138eafba2a74aa04340fbafb4b34a494986499e9dd0609e69b35cdc53f5e`; session/evidence-language digest `sha256:de27d069fe1f1f921f9813909855206835f40806fd485b54c8a508536f7200e6`; session-history/substrate digest `sha256:18a6974040a123a428e6dee24f4a0002ad2c21a08c3a6d9db58df7f742cd286c`; session-history/dangling-closer digest pending.
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
- Runtime-repair candidate ACA proof: revision `ca-abarva-web-lab-eastus--mc2517f4c`, digest `sha256:81790f937cf6fa077ac392722e2dc58caab2ca54bc692c591809634465f4bdf2`, 100% traffic; runtime invariant passed; signed-in Lakeshore proof found the remaining active-lane visual issue fixed by the consultant-synthesis follow-up.
- Consultant-lane candidate ACA proof: revision `ca-abarva-web-lab-eastus--m48648ac3`, digest `sha256:3828f676e4c5bc700aa40700dd3205bc260a5feee26b23036208d3393c7dc6d1`, 100% traffic; runtime invariant passed; signed-in Lakeshore proof found the remaining metric-fallback issue fixed by the next candidate.
- Metric-fallback candidate ACA proof: revision `ca-abarva-web-lab-eastus--m230c0bfa`, digest `sha256:9bf1586f59e97ac123b447e20e1fa3b8b3f70e021056ab6507281f2c8c948bb1`, 100% traffic; runtime invariant passed; signed-in Lakeshore proof found the remaining undersized-table and renderer-note issues fixed by the next candidate.
- Undersized-table candidate ACA proof: revision `ca-abarva-web-lab-eastus--m9c30dc7c`, digest `sha256:91e480c83c65edf1131ac2f93dcbb98c4ff8a87cc42b8309a3d6208dd4216aa8`, 100% traffic; runtime invariant passed; signed-in Lakeshore proof found the remaining sparse-packet fallback issue fixed by the next candidate.
- Narrative-fallback candidate ACA proof: revision `ca-abarva-web-lab-eastus--mb348f581`, digest `sha256:bc7d92259e5248908db8e1bfd3254e84fdccb6a8319f6fd5eade6a8a2c7ebb8a`, 100% traffic; production health endpoint returned OK; signed-in Lakeshore proof found the remaining one-row comparison-table quality issue fixed by the row-count gate candidate.
- Row-count-gate candidate ACA proof: revision `ca-abarva-web-lab-eastus--mccf82aaf`, digest `sha256:5e9281246419c358ea3503fdc6b2268aa813fe474f25fd69efc275769deb6238`, 100% traffic; signed-in Lakeshore proof passed the explicit comparison-table quality check; signed-in SkyHarbor Chrome proof found the remaining `supporting material ledger` wording issue fixed by the next candidate.
- SkyHarbor wording-scrub main candidate ACA proof: revision `ca-abarva-web-lab-eastus--mc21ec379`, digest `sha256:5be3844df2e2f1b80fd842a959d138209b33b0e96cf201deccabb5e87d839ce4`, 100% traffic; signed-in SkyHarbor proof found the remaining stray quote and `6 vs.` fragment issue fixed by the deeper shaper candidate.
- Deeper shaper candidate ACA proof: revision `ca-abarva-web-lab-eastus--m40ecdce0`, digest `sha256:906b8ac832763a5268066eb63ac49ced3b7b5ff505c1f4914840491495da2ccb`, 100% traffic; signed-in SkyHarbor proof found the remaining `Here's the logic` / compact left-dock issue fixed by the left-dock/right-canvas candidate.
- Left-dock/right-canvas candidate ACA proof: revision `ca-abarva-web-lab-eastus--m6afb0744`, digest `sha256:5e44138eafba2a74aa04340fbafb4b34a494986499e9dd0609e69b35cdc53f5e`, 100% traffic; signed-in SkyHarbor proof found the remaining `last three times this session` / `tenant evidence` / `loaded evidence` issue fixed by the session/evidence-language candidate.
- Session/evidence-language candidate ACA proof: revision `ca-abarva-web-lab-eastus--md9237a77`, digest `sha256:de27d069fe1f1f921f9813909855206835f40806fd485b54c8a508536f7200e6`, 100% traffic; signed-in SkyHarbor proof found the remaining `Same answer as the last four turns` and `substrate` issue fixed by the session-history/substrate candidate.
- Session-history/substrate candidate ACA proof: revision `ca-abarva-web-lab-eastus--mcf80e72d`, digest `sha256:18a6974040a123a428e6dee24f4a0002ad2c21a08c3a6d9db58df7f742cd286c`, 100% traffic; signed-in SkyHarbor proof found the remaining `The answer hasn't changed across this session` / dangling conditional closer issue fixed by the session-history/dangling-closer candidate.
- Post-deploy revision, digest, screenshots, and crawl output for the final session-history/dangling-closer fix to be added after production proof.

## Known Gaps

Post-deploy signed-in browser proof is pending until the session-history/dangling-closer candidate is built and released through ACA.
