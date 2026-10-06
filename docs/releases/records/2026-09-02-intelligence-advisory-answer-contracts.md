# 2026-09-02-intelligence-advisory-answer-contracts — Intelligence advisory answer contracts

## Release ID

`2026-09-02-intelligence-advisory-answer-contracts`

## Status

`candidate`

## Plain-English Summary

The Intelligence surface is meant to answer executive questions like an advisory board: what is true about the enterprise, what is changing in the industry, and what to do about both. Two gaps in the answer-routing layer meant many questions never reached a contract that asked for that.

One gap was in routing. Industry-outlook questions ("what trends matter in our industry", "where is the market heading") were only recognised when the wording also contained an AI term or a top-N/ranking phrase. A plain question about industry direction fell through to the default answer mode.

The other gap was in the default mode itself, which carried no response contract at all — no system contract, no prompt directive, no required shape. Anything that fell through was answered without the advisory framing that defines the surface.

This change widens outlook detection so those questions reach the existing industry contract, extends that contract to state where the enterprise stands against a trend (ahead, aligned, behind, or not yet evidenced) and to label external claims as industry pattern, benchmark, peer example, or market signal, and gives the default mode a real advisory contract that classifies question depth before writing — so a simple factual lookup is answered directly instead of being wrapped in an executive framework it did not need.

Tenant-metric time-series questions (spend, cost, headcount, adoption over time) are explicitly excluded from the industry contract and continue to route to the deterministic data surfaces, which own those numbers.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): answer-mode classification and response contracts only. No change to how questions are answered numerically.
- Layer 3 (Canonical model): unchanged. No metric, fact, or read model is computed, altered, or newly quoted by this change.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — the contracts are tenant-agnostic and apply to every tenant's Intelligence answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is in the prompt/contract layer and takes effect on merge and deploy.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts` — added `isIndustryOutlookAsk` and its supporting patterns; folded it into `isIndustryTrendToAiBetsAsk`; added `GENERAL_ADVISORY_CONTRACT`; extended `INDUSTRY_TREND_TO_AI_BETS_CONTRACT` with the pure-outlook answer order and evidence-class labels.
- `src/lib/intelligence/ask/answer-mode-registry.ts` — wired the general advisory contract and prompt directive onto the `general` mode; added `suppressSurfaceHandoffOverride` so the default mode does not inherit the Moves surface-handoff format override that suits the strategy modes.
- `src/lib/intelligence/ask/__tests__/industry-outlook-classification.test.ts` — new coverage for the routing change and the contract wiring.

## QA / Validation

- `npx jest src/lib/intelligence/ask/__tests__/industry-outlook-classification.test.ts` — 8 passed.
- `npx jest src/lib/intelligence` — 508 passed, 28 failed. The 28 failures are pre-existing on the base branch; verified by reverting the change and re-running: identical failing suites, 500 passed. No suite regressed and no new failure was introduced.
- `npx tsc -p tsconfig.json --noEmit` — 0 errors repo-wide.
- `npx eslint` on all three changed files — clean.
- Regression guard included in the new suite: tenant metric time-series asks must not classify into the industry contract, and the two previously-asserted strategy-mode classifications must keep their existing mode.

Not yet done: live signed-in proof on a deployed revision. This is a prompt-contract change whose observable effect is answer shape, so it needs a live read before it can be called live-proven.

## Rollout Plan

Merge to main via PR (squash). The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100% traffic revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — an Intelligence answer to a pure industry-outlook question and to a simple factual lookup, on a signed-in session, before this record moves to `released`.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. The change is confined to prompt/contract construction with no schema, data, or stored-state effect, so revert is complete and immediate — no migration rollback and no data repair.

## Known Gaps

- Not live-proven. The observable effect of this change is answer shape, so it needs a signed-in read on a deployed revision before the record moves to `released`. Local validation only so far.
- The depth budget for analytical answers is inherited from the existing base answer policy (roughly 90-160 words, Answer/Proof/Move). A longer budget has been discussed for analytical asks; this change deliberately does not alter the tuned global budget, so that question is still open.
- The classifier is lexical, not semantic. An outlook question phrased without any of the matched signals will still fall through to the default mode — which now at least carries an advisory contract, so the failure mode is a less-specific answer rather than an uncontracted one.
- Seven entries in the answer-mode registry remain unreachable from the mode union and carry no contract text. They are unchanged by this release and remain inert.
- Freshness of external market claims is bounded by whatever the loaded corpus already contains. No dated industry-intelligence feed is introduced here.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and the live signed-in answer proof.
