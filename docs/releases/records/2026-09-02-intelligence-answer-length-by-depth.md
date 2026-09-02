# 2026-09-02-intelligence-answer-length-by-depth — Answer length follows question depth

## Release ID

`2026-09-02-intelligence-answer-length-by-depth`

## Status

`candidate`

## Plain-English Summary

The answer path did not have one length budget. It had five, and they disagreed with each other: a 90-160 word target in the base policy, a 120-word limit before a table or chart, a 190-word threshold in the brief compactor, a reference to a "generic 200-word target" that was stated nowhere else, and an allowance of roughly 400 words for deep dives that existed on one path only.

Three problems came out of that.

The stated target read as a minimum. Asked something simple — a budget figure, a name, a date, a yes or no — the model was pointed at 90 words it did not need, which produces padding. The rest of the answer policy already treats padding as a defect, so the length instruction was pulling against it.

The live chat path was missing the deep-dive allowance. The non-streaming prompt explicitly permits about 400 words for vendor comparisons, ranked lists, and portfolio reviews. The answer-only streaming mode, which is the path the conversational surface actually uses, restated the 90-160 target flat with no exception. A genuinely analytical question was capped at 160 words with no way out, on the one path where it mattered most.

The orphaned reference to a 200-word target overrode a number that did not exist anywhere in the policy.

Length now follows the depth of the question on every path: no minimum, so a simple ask is answered directly and stops; 90-160 words for an ordinary analytical answer, which is the tuned default and is unchanged; under 120 words of prose before an exhibit; and up to roughly 400 words for an explicit deep dive, comparison, plan, ranked list, or portfolio review, with an explicit instruction never to pad to reach it.

The analytical default was deliberately left where it was. Answers being too long was raised as a concern alongside this work, and raising the default would have made that worse rather than better.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): answer-length instructions in the response policy and the synthesis prompts only.
- Layer 3 (Canonical model): unchanged. No value, metric, or read model is affected.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — the length policy is tenant-agnostic.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts` — made the base length statement depth-conditional, removed the implied minimum, added the deep-dive allowance, and scoped the Pyramid Brief shape to analytical questions so a simple lookup is not forced into it.
- `src/lib/intelligence/ask/synthesizer.ts` — carried the deep-dive allowance and the no-minimum rule onto the answer-only streaming path, aligned the two other restatements of the target, and removed the reference to a length target stated nowhere.
- `src/lib/intelligence/ask/__tests__/answer-length-depth.test.ts` — new coverage, including a consistency check that every length statement in the answer path carries the same allowance.

## QA / Validation

- `npx jest src/lib/intelligence/ask/__tests__/answer-length-depth.test.ts` — 5 passed.
- `npx jest src/lib/intelligence` — 548 passed, 29 failed. All 29 failures are pre-existing on the base commit; verified against the same suite list captured before this change (543 passed, identical failing suites). No suite regressed. The existing response-policy suite, which pins the `Target 90-160 words` phrase, passes unchanged.
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
- Live signed-in proof required: yes — a simple factual ask answered short, and a portfolio or comparison ask allowed to run long, on a signed-in session.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. Prompt-text change only, with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven. Length is a prompt instruction, not an enforced limit, so whether the model actually stops short on a simple ask can only be confirmed by reading live answers.
- The deterministic enforcement in code still does not match the stated targets. Paragraphs over 70 words are split into roughly 55-word groups, and the brief compactor accepts up to 190 words before rewriting. Those thresholds were left alone deliberately, because changing enforcement is a behaviour change rather than a prompt change, but the numbers still do not line up with the prompt and that reconciliation is open.
- Depth classification is done by the model from the contract wording, not by the router. A question the model misreads as analytical will still get an analytical-length answer.
- The roughly 400-word allowance is inherited from the existing non-streaming instruction and has not itself been tuned; it is now merely consistent across paths.
- Whether answers are too long in practice was the original concern and is not settled by this change. It needs a live read before any further adjustment.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and the live signed-in length proof.
