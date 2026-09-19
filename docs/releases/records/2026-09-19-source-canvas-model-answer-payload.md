# 2026-09-19-source-canvas-model-answer-payload — The Source canvas payload now describes the answer it shows

## Release ID

`2026-09-19-source-canvas-model-answer-payload`

## Status

`candidate`

## Plain-English Summary

When a user asks a question on the Source canvas, the app builds a deterministic
briefing from the event's own read model and then asks Claude the same question.
If Claude answers, its prose replaced the briefing prose — but only the prose.

The canvas does not render prose when structured response parts are present: the
response renderer draws the parts **instead of** the text. So the part titled
"Advisor answer" still carried the deterministic wording, the "Evidence used"
card still listed the citations the deterministic composer had chosen, and the
"Support" metric still counted those citations — all sitting under an answer that
had used none of them. A reader had no way to tell the two apart.

Every field that states *the answer* is now re-derived from the answer being
shown: the prose, the advisor-answer part, the citations the model actually
cited, and the count of them. When the model cites nothing, the evidence card is
removed rather than left in place under an answer that did not use it. The parts
that describe the **event** rather than the answer — the decision-signal table,
the open inputs, the recommended next action — are read off the same context
either way and are kept.

The canvas route and the Sentinel chat helper both now go through one function,
so the two cannot answer this question differently again.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (products) only — the Source canvas answer
surface. No data plane: no schema, migration, loader, adapter or projection
changed, and no canonical-model object was written or read differently.

## Client Applicability

- All clients: yes — the Source canvas answer surface behaves this way for every
  tenant. No behaviour is tenant-conditional.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional on the path that already
  substitutes a model answer.

## Changes Included

- `src/lib/source/sentinel-chat-llm.ts` — new `applySourceSentinelModelAnswer`
  and `rewriteSourceAnswerPartsForModelAnswer`; the existing
  `buildLlmBackedResponse` now delegates to them rather than carrying its own
  copy of the substitution.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — the live canvas route
  keeps the citations the model returned and applies them through that helper,
  instead of discarding them and overwriting the summary alone.
- `src/lib/source/source-answer-engine.ts` — the three part titles that identify
  answer-describing parts are exported as constants rather than matched by a
  copied string literal on the other side.
- `src/__tests__/behaviors/source-canvas-model-answer-citations.test.ts` — new
  behavioural suite driving the real route handler.

## QA / Validation

Measured before any edit, on a tree byte-identical to `origin/main` at
`43aee7361`.

**The defect reproduced, not read.** The new suite drives the real `POST`
handler and reads the payload it returns; only the route's collaborators are
mocked. Identical seven cases: **5 failed / 2 passed before → 0 failed / 7
passed after.**

The two that pass on unfixed code are deliberate guardrails, and both are
load-bearing: one asserts the event-describing parts survive, the other that a
turn where no model answer was produced keeps the deterministic payload
untouched. Without them the cheapest repair — drop the parts whenever a model
answers — would satisfy every other case.

**Six mutations, each caught** (failing cases of seven):

| mutation | result |
|---|---|
| route reverted to substituting `summary` alone | 5 failed |
| evidence card kept as-is instead of rewritten | 2 failed |
| advisor-answer part left with the deterministic wording | 1 failed |
| support metric left counting the replaced citations | 2 failed |
| every part dropped when a model answers (the over-broad repair) | 5 failed |
| rewrite applied to the no-model fallback turn as well | 1 failed |

The last two are what the guardrail cases exist for, and they fail on the
guardrails.

**Baselines, same command either side.** `npx jest src/lib/source
src/__tests__/behaviors`: **9 suites / 20 tests failing before → 9 / 20 after**,
byte-identical failing-suite list, every one pre-existing and unrelated; passing
3222 → 3229. `src/lib/source/__tests__/sentinel-chat-llm.test.ts` 6/6 passing
before and after, which is what proves the delegation did not change the helper
path's behaviour.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit 0
with `tsconfig.tsbuildinfo` removed beforehand; `eslint` over the four changed
files exit 0 with no output; `release:check` exit 0. All judged by exit code.

The suite lives in `src/__tests__/behaviors`, so it runs in the `Behavior
coverage floor` CI job and inside `test:before-commit`. Both existing tests over
this route read it as source text; neither could have observed this.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and
shifts traffic. No migration, no flag, no data build, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No branch or ad-hoc Azure command touches the shared runtime.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded below once the deploy run completes.
- ACA runtime invariant: to be proven after deploy — Container App template
  image == 100%-traffic revision image, digest-pinned.
- Worker image invariant: to be proven for both non-manual delivery worker jobs.
- Feature/env flag update path: not applicable; nothing is flagged.
- Live signed-in proof required: **yes.** This changes what a reader sees on the
  Source canvas, so a signed-in session asking a canvas question is the proof
  that matters and it is owed.

## Rollback Plan

Revert the merge commit and let the repo-owned workflow deploy the prior digest.
No migration to unwind and no persisted state is written by this path, so a
revert restores the previous behaviour completely.

## Audit Evidence

- The pull request and its CI run, including the `Behavior coverage floor` job
  log showing `PASS
  src/__tests__/behaviors/source-canvas-model-answer-citations.test.ts`.
- The before/after and mutation numbers in QA / Validation above, each measured
  by running the suite rather than by reading the source.
- The ACA deploy run and the digest readback, once recorded.

## Known Gaps

- **Signed-in acceptance is owed.** Not attempted here: reaching the substituted
  answer means asking a live canvas question against a shared lab tenant with no
  human present to authorize it.
- The deterministic composer's remaining parts are the event's own read and are
  kept under a model answer by design. Whether a model answer should be allowed
  to carry event-derived parts it did not produce is a broader product question
  and is not settled by this change.
- `maybeCreateSourceSentinelChatLlmResponse` in the same module is still reached
  by no route. It is now consistent with the live path rather than divergent
  from it, but whether it should exist at all is untouched.
