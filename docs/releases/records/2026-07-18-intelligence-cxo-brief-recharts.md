# 2026-07-18-intelligence-cxo-brief-recharts — Intelligence CXO Brief And Recharts Rendering

## Release ID

`2026-07-18-intelligence-cxo-brief-recharts`

## Status

`candidate`

## Plain-English Summary

This release makes default Intelligence aVa answers read like a concise CXO advisory brief instead of a mini deck. It also makes the final governed answer packet authoritative in chat display, so the UI and exports use the same cleaned answer, and it renders common typed chart artifacts with Recharts instead of the older inline SVG path.

Post-deploy proof of the first candidate found one polish defect: nested model labels could survive as `Answer: Proof.`, `Proof: Proof.`, or `Move: Move.` in the compact brief. This record also covers the follow-up cleanup that strips those labels before sentence selection, in the already-short answer path, and in the visible chat stream path.

## Layer Impact

- `global-control-lane`: changes shared Intelligence answer shaping and shared aVa answer rendering for all tenants.
- `public/demo`: improves investor and pilot-demo visible answer quality, chart polish, and export consistency.

## Client Applicability

- All clients: yes, for Intelligence aVa answer rendering and common typed chart artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: narrows the default strategy-to-AbarVa answer contract to the Answer / Proof / Move Pyramid Brief.
- `src/lib/intelligence/ask/answer-mode-registry.ts`: adds deterministic CXO brief fallback while leaving the detailed Moves P0-P5 mode intact.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: makes the final `AvaAnswerPacket` body authoritative over earlier raw streamed text.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: strips nested CXO labels from the visible streamed chat accumulator and packet replacement path.
- `src/components/agent-answer/AgentAnswerRenderer.tsx`: renders supported bar, horizontal bar, line, cost-stack, range-bar, and quadrant/2x2 charts with Recharts, while retaining SVG as fallback.
- `src/lib/intelligence/ask/answer-mode-registry.ts`: strips nested model labels such as `Proof.` and `Move.` before compact sentence selection and before returning already-short answers, and avoids selecting `first-call resolution` as the executive recommendation.
- Focused tests for packet preference, CXO brief compaction, and Recharts chart rendering.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` passed 24 tests. Jest printed the repo's existing duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`; the suites passed.
- PASS: `npx eslint src/lib/intelligence/ask/answer-mode-registry.ts src/lib/intelligence/ask/response-policy.ts src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc --noEmit`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: Post-deploy signed-in proof for PR #4998 reached live ACA revision `ca-abarva-web-lab-eastus--m87b20ce0` and confirmed the answer was compact, but found the nested-label polish defect.
- PASS: Post-deploy signed-in proof for PR #5001 reached live ACA revision `ca-abarva-web-lab-eastus--ma4fb6e22` and confirmed `Answer: Proof.` / `Move: Move.` were removed in one path, but found `Proof: Proof.` and `Move: Move.` could still appear from the visible streamed text. Final cleanup added focused regression coverage for the client stream path.
- PASS: Follow-up focused cleanup validation: `npx jest src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`, focused ESLint, and `tsc --noEmit`.
- NOT RUN: Final post-cleanup signed-in proof on `https://app.abarva.ai/intelligence` pending follow-up merge and ACA deployment.

## Rollout Plan

Merge through the protected GitHub PR lane, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged SHA to the shared lab/product runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: PR #4998 deployed `acrabarvalab001.azurecr.io/abarva/web@sha256:051c087af7408827b5c858eee4e23b28cfa19926ef700870eb408a36d194fb8d`; follow-up cleanup digest pending.
- ACA runtime invariant: PR #4998 passed; follow-up cleanup pending.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR to restore the previous answer-mode prompt/fallback, packet-display heuristic, and SVG-first chart rendering. No migration, data rollback, or tenant data cleanup is required.

## Audit Evidence

Pending:

- PR URL.
- Focused test output.
- ACA deploy workflow run `29628872049` for PR #4998.
- Live signed-in proof screenshot bundle: `/Users/anand/Downloads/intelligence-cxo-brief-recharts-proof-2026-07-18`.

## Known Gaps

Relationship graphs remain on the existing SVG graph renderer. That is intentional: Recharts handles charts, not network/relationship graph layout.
