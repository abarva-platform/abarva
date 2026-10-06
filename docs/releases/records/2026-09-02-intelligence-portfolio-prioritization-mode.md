# 2026-09-02-intelligence-portfolio-prioritization-mode — Portfolio prioritization answer mode

## Release ID

`2026-09-02-intelligence-portfolio-prioritization-mode`

## Status

`candidate`

## Plain-English Summary

The answer-mode registry declared a portfolio prioritization mode, with required sections and a scorecard and priority matrix listed against it. None of it ran. The registry's `active` flag was never read by any code, and the real gate is the answer-mode union, which did not carry the mode — so the entry was unreachable, and it had no contract text or prompt directive behind it either. It was a specification someone wrote down, not a capability someone had switched off.

The mode is now real. Asking to prioritise, rank, sequence, or triage a set the enterprise already holds routes to a contract that opens with the portfolio read, states the ranking logic before the ranking, keeps value separate from readiness, names the dependencies that force sequence, and closes on stop/go gates. Each item gets a recommendation an executive can act on: invest now, validate next, sequence, or hold.

Ranking answers fail in a specific way — they invent precision. The contract bars manufactured ROI figures, savings percentages, payback periods, and composite scores, and requires an unevidenced item to be named as a validation gate rather than given a guessed position.

The mode is deliberately separated from the existing industry-trend mode by whether the question is about a set the enterprise already holds. "Prioritise our initiatives" is a portfolio question; "rank five AI use cases for financial services" is an industry discovery question and continues to route as it did. That boundary is pinned by tests in both directions.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): answer-mode classification and response contracts only.
- Layer 3 (Canonical model): unchanged. No metric, ranking, or score is computed by this change; the contract explicitly forbids inventing them.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — the contract is tenant-agnostic.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts` — added `portfolio_prioritization` to the answer-mode union, added `isPortfolioPrioritizationAsk` and its patterns, added the classifier branch ahead of the industry-trend branch, added `PORTFOLIO_PRIORITIZATION_CONTRACT`, and included the mode in `needsAbarvaSolutionGuidance` so these asks keep surface guidance.
- `src/lib/intelligence/ask/answer-mode-registry.ts` — set the entry active and wired its system contract and prompt directive.
- `src/lib/intelligence/ask/__tests__/portfolio-prioritization-mode.test.ts` — new coverage for reachability, the discovery boundary, and the contract content.

## QA / Validation

- `npx jest src/lib/intelligence/ask/__tests__/portfolio-prioritization-mode.test.ts` — 6 passed, including four industry-discovery asks that must NOT be captured by the new mode.
- `npx jest src/lib/intelligence` — 543 passed, 29 failed. All 29 failures are pre-existing on the base commit; verified by stashing the change and re-running (537 passed, identical failing suites). No suite regressed. The existing response-policy suite, which pins the industry-trend classifications this change sits next to, passes.
- `npx tsc --noEmit --pretty false` — 0 errors repo-wide, re-run after the test file was added.
- `npx eslint` on all changed and added files — clean.

## Rollout Plan

Merge to main via PR (squash). The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100% traffic revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — a portfolio prioritisation ask answered on a signed-in session, checked for invented scores.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. The change is confined to classification and contract construction with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven. Whether the model honours the no-invented-precision rule under a ranking ask is exactly the kind of thing that only shows up live; the contract states the rule but nothing enforces it deterministically after generation.
- The classifier is lexical. A portfolio ask phrased without a possession signal — "rank the initiatives" with no "our" or "these" — routes to the industry-trend mode instead. That mode still answers sensibly, so the failure is a less-specific answer rather than a wrong one.
- The registry's `active` flag remains decorative. It is now consistent with reality for this entry, but it is still not read by any code, and six other entries remain unreachable with no contract text. They are untouched here and remain inert.
- The typed artifacts named against the mode, `portfolio_scorecard` and `priority_matrix`, are declarative registry metadata. Emission depends on the structured visual contract in the synthesizer, which is unchanged by this release.
- No deterministic fallback is registered for this mode, so a malformed answer is not repaired after generation the way the Moves phase table is.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and the live signed-in prioritisation proof.
