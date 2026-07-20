# 2026-07-19-intelligence-ava-label-override-fix — Close the remaining Pyramid-Brief label leaks in aVa's answer prompt

## Release ID

`2026-07-19-intelligence-ava-label-override-fix`

## Status

`candidate`

## Plain-English Summary

Fast-follow to `2026-07-19-intelligence-ava-executive-narrative-prompt` (PR #5086, merged and deployed earlier today). That PR rewrote `SYSTEM_PROMPT`/`CONCISE_SYSTEM_PROMPT` in `src/lib/intelligence/ask/synthesizer.ts` to stop instructing aVa to label answers "Answer / Proof / Move." Live testing immediately after deploy (10 hand-run questions against the Meridian Health / Healthcare Demo tenant on `/intelligence`) found that 3 of 10 answers — the ones that hit the deep-dive, funding-approval, and vendor-evaluation answer paths — still printed literal "Answer." "Proof." "Move." headers.

Root cause: three OTHER always-on prompt fragments in the same file, which the original PR did not touch because they live outside the `SYSTEM_PROMPT`/`CONCISE_SYSTEM_PROMPT` constants, independently instructed the model to "Default to the AbarVa Pyramid Brief: Answer, Proof, Move" and one of them explicitly said the "do not print visible section labels" rule "is CANCELLED for this surface." These fragments (`buildUniversalAnswerVisualContract()`, the `richTextAddendum` block, and the `answerOnlyDirective` block) are concatenated into the final system prompt for every rich-text/answer-only Intelligence Ask call — i.e. most real usage, not an edge case. This PR removes the literal "Pyramid Brief: Answer, Proof, Move" phrasing from all three, replaces it with the same narrative-prose instruction used in `SYSTEM_PROMPT`, and adds an explicit "never print these labels" clause to the fragment that was actively cancelling the prohibition. A matching small fix in `answer-mode-registry.ts`'s CXO answer-mode format override closes a fourth, weaker reinforcement of the same pattern.

Also adds a regression test (`ask-guardrails.test.ts`) that scans `synthesizer.ts`'s raw source for the literal string "Pyramid Brief" and the "Default to the AbarVa ... Answer, Proof, Move" pattern, so this can't silently reappear in a fragment outside the exported prompt constants again.

## Layer Impact

- `global-control-lane`: prompt-fragment text in `src/lib/intelligence/ask/synthesizer.ts` (`buildUniversalAnswerVisualContract`, `richTextAddendum`, `answerOnlyDirective`) and `src/lib/intelligence/ask/answer-mode-registry.ts` (`buildCxoAnswerModeSystemAddendum`'s format-override line). No schema, route, or config changes. One new test file addition, no test infrastructure changes.

## Client Applicability

- All clients: yes — same as the parent PR, these fragments apply to every tenant's Intelligence Ask answers on rich-text/answer-only surfaces (the majority of real traffic).
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`:
  - `buildUniversalAnswerVisualContract()` — removed "Default to the AbarVa Pyramid Brief: Answer, Proof, Move" (two occurrences), replaced with narrative-prose instruction; explicitly forbids literal Answer/Proof/Move/Tension/Evidence/Implication headers.
  - `richTextAddendum` — the "do not print visible section labels ... is CANCELLED" clause now scopes the cancellation to topic-specific headers only (e.g. naming the actual subject) and explicitly restates the prohibition on narrative-stage labels; rule 1 no longer says "Default answer shape is the AbarVa Pyramid Brief."
  - `answerOnlyDirective` — same "Default to the AbarVa Pyramid Brief" phrase removed and replaced with the same narrative-prose + explicit-label-prohibition instruction.
- `src/lib/intelligence/ask/answer-mode-registry.ts` — `buildCxoAnswerModeSystemAddendum`'s `FORMAT OVERRIDE FOR THIS MODE` block's "use compact bold section headers" line now explicitly excludes narrative-stage labels.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` — new regression test scanning `synthesizer.ts`'s raw source for "Pyramid Brief" and the "Default to the AbarVa ... Answer, Proof, Move" pattern.

## QA / Validation

- `npx eslint` on all four touched files — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` — no errors on any touched file.
- `npx jest src/lib/intelligence/ask` in the isolated worktree: 11 failed / 146 passed / 3 suites failed (one more passing test than the pre-existing 145-pass baseline — the new regression test — same 11 pre-existing, unrelated failures as both this PR's own baseline and the parent PR's baseline).
- Live signed-in browser re-test on the same three answer paths that showed the bug (deep-dive follow-up, funding-approval question, vendor-evaluation question) queued as a post-deploy verification step — see Known Gaps.

## Rollout Plan

Merge to `main` via PR (squash merge). The repo-owned `.github/workflows/aca-main-deploy.yml` workflow auto-deploys on merge, same as the parent PR. No migration, no feature flag, no env var change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto-triggers on merge to `main`).
- Shared runtime mutators: none.
- ACA runtime invariant: to be confirmed post-deploy, same as the parent release.
- Live signed-in proof required: yes — re-run the same 3 previously-broken question types (deep-dive follow-up, $-amount approval-authority question, named-vendor evaluation question) against a signed-in Intelligence session and confirm no literal "Answer."/"Proof."/"Move." headers appear.

## Rollback Plan

Revert the merge commit (prompt-text-only change) and let `aca-main-deploy` redeploy from the reverted `main`.

## Audit Evidence

- Parent PR: [#5086](https://github.com/abarva-platform/abarva/pull/5086) — merged, deployed, live-tested (10 questions against Meridian Health tenant); this PR's release record documents the finding that triggered this fast-follow.
- This PR: (added once opened)
- Isolated-worktree test run: `npx jest src/lib/intelligence/ask` (11 failed / 146 passed / 3 suites failed).

## Known Gaps

- This repo has very high concurrent-commit velocity on `src/lib/intelligence/ask/synthesizer.ts` (multiple parallel automated sessions shipping PRs against the same file within minutes of each other, confirmed via `git log`/pickaxe search during this investigation). There is a real risk that another concurrent PR reintroduces mechanical labeling language before or after this one merges. The new regression test in `ask-guardrails.test.ts` is the durable guard against that; it should be treated as load-bearing, not incidental.
- Live signed-in browser re-verification of the fix (not just the code diff) is queued as the immediate next step after this PR deploys.
