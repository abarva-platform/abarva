# 2026-09-25-c522-answer-mode-fallback-disclosure — Tell the Source assistant when nothing matched

## Release ID

`2026-09-25-c522-answer-mode-fallback-disclosure`

## Status

`candidate`

## Plain-English Summary

When a user asks the Source assistant a question, a small deterministic classifier runs first and
decides what kind of question it is. That classifier returns three things: the mode it chose, the
rule that fired, and a flag saying whether anything matched at all. The chat route kept the first
and discarded the other two.

That mattered because the catch-all mode is only ever reachable by falling through. So "a rule
recognised this and chose the general advisory mode" and "no rule recognised anything in this
sentence" arrived at the route looking identical, and the route then assembled its grounding for a
targeted answer it had no basis to believe was targeted. A companion measurement found every one of
the 48 questions in one acceptance set arriving as a fall-through, which means this was the entire
path for that class of question rather than a rare residue.

A sibling caller of the same classifier already carried all three fields and already showed the rule
to the model. This change brings the chat route up to that: the classifier's verdict is now written
into the prompt in plain language, and the wording differs depending on whether a rule matched. On a
fall-through the assistant is told that nothing was recognised, told not to present the grounding
above as a targeted answer, and told to name the part of the question it cannot address rather than
quietly narrowing the question to one it can.

No routing rule was added, removed or reordered. No question routes anywhere different than it did
before; what changed is only what the model is told about the routing.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared control-plane behaviour for every client on
the Source assistant path, not gated behind a flag and not scoped to any tenant.

- **Layer 4 — Products (Source).** The system prompt for a Source assistant turn gains one block
  when an answer mode is classified. Turns that do not classify a mode are byte-identical: the block
  is the empty string and the prompt assembly already strips empty entries.
- **Layers 1–3 unchanged.** No intake tab, adapter, canonical object, schema, migration, read model
  or tenant dataset is touched. Nothing is read from or written to the data plane by this change.

## Client Applicability

- All clients: yes, on Source assistant turns that classify an answer mode.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The block is produced inside the existing Source answer-mode path, which
  is already gated by the same conditions as the grounding it sits beside; outside that path the
  value is the empty string.

## Changes Included

- `src/lib/source/ava/answer-mode.ts` — new exported `buildSourceAnswerModeDisclosureBlock`. Pure and
  deterministic: a classification in, a string out, no I/O. Two branches, one for a matched rule and
  one for a fall-through.
- `src/app/api/chat/agent/route.ts` — the route now hands the **whole** classification to that
  builder rather than reading `.mode` off it, holds the result in
  `sourceAvaAnswerModeDisclosureBlock`, clears it on the existing grounding-failure path, and places
  it in the system prompt immediately after the mode grounding it qualifies.
- `src/__tests__/behaviors/c403-answer-mode-routing.test.ts` — the assertion that recorded the defect
  is inverted rather than deleted, so the defect cannot return silently, and two new sections are
  added: the behavioural proof and the wiring proof.

No generated record needed regenerating: no rule text, rule order or classification outcome moved,
so `docs/architecture/c403-answer-mode-routing.json` is unchanged and the suite's equality assertion
against it still holds.

## QA / Validation

Baseline and result measured over the same scope — the one behaviour suite that owns this subject.

| stage | command | result |
|---|---|---|
| baseline, before any edit | `npx jest --runTestsByPath src/__tests__/behaviors/c403-answer-mode-routing.test.ts` | 15 passed, **0 failing** |
| red, tests written before the route was wired | same | 20 passed, **3 failing** |
| green, after the fix | same | 23 passed, **0 failing** |

The three red tests were the two wiring assertions and the inverted defect assertion. The behavioural
assertions were green from the moment the builder existed, which is correct — they test the builder's
output, and the builder was the new code.

**The fix was then broken deliberately, four ways, and the suite was re-run each time.** All four are
caught; each was reverted immediately afterwards and the suite confirmed green again.

| mutation | failing |
|---|---|
| the builder ignores the flag (`if (false)`) so every question gets the matched wording | 1 |
| the builder collapses to one string for both branches | 4 |
| the block is built but removed from the system-prompt array | 2 |
| the route stops calling the builder and assigns `""` | 3 |

Two things about the assertions are worth stating plainly, because they are the difference between
this proving something and merely looking like it does.

**The behavioural assertions run at the destination, not the departure.** Nothing asserts that a
field is now assigned — a route that assigns `isFallback` and then throws it away would pass such a
test, and that is exactly the defect's shape. What is asserted is the *text handed to the model*, for
real questions put through the real classifier: all 48 acceptance questions carry an explicit
no-pattern-matched marker naming their fall-through rule, the ~100 questions the rules genuinely
match never carry it and each names the rule that fired, and the two sets of strings are disjoint.
Both branches carry a non-trivial corpus, asserted explicitly, so neither is vacuous. The two
fall-through rules — an empty question and an unmatched one — produce different text, which the mode
alone cannot express, since the catch-all mode is reachable only by falling through.

**The wiring assertions are read off the TypeScript AST, not grepped.** Whether the builder's result
is an element of the system-prompt array, and whether its argument is the whole classification rather
than one field of it, are syntax questions, and a text scan cannot answer one. Writing that check is
what caught a real mistake during this change: the first version assumed the `systemPrompt`
declaration's initializer *was* the array literal. It is a call chain (`[...].filter().join()`), so
the check found nothing and reported a wiring failure against correctly wired code. The helper now
descends to the array literal. A structural check that silently reads the wrong node is the failure
mode this file already warns about in another context, and it very nearly recurred here.

Other validation, all from an isolated worktree branched from the exact `origin/main` under test:

- Neighbouring suites over the same subject — the classifier's own tests, its fixture suite, the
  Phase C grounding tests and three agent-route Source gates: **6 suites, 129 tests, all passing.**
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0, no
  diagnostics.** The exit code is judged, not the grep: a bare `tsc --noEmit` exits 134 on this
  machine with a V8 out-of-memory crash and emits nothing, which reads as a false clean.
- `npx eslint` over the three changed files — **exit 0, clean.**

Not verified, and named as not verified: no signed-in check against a deployed build has been run
for this change. That proof is owed, not claimed. The assertions above are local and CI-run only.

## Known Gaps

- **No signed-in acceptance has been run, and none is claimed.** The wording change is user-visible,
  so a signed-in check on the deployed SHA is the only evidence that it renders as intended in a real
  turn. That check is owed.
- **The wiring proof is structural, not executed.** It reads the route's AST and proves the builder's
  result is an element of the system-prompt array with the whole classification as its argument. It
  does not execute the route's `POST` handler and read the assembled prompt back, because that
  handler is a ~2,400-line Next.js route with no seam for it. A refactor that gave prompt assembly its
  own testable function would let the end-to-end claim be made properly, and is worth filing.
- **The effect on answers is unmeasured.** This change tells the model something true that it was not
  being told. Whether the resulting answers are better — whether the assistant actually says what it
  cannot address instead of narrowing the question — is a question about generated text, and nothing
  here measures it. The prompt is the control boundary, so the block reaching the prompt is what was
  proven; the behavioural improvement is a hypothesis.
- **The catch-all's grounding is still the catch-all's grounding.** This item deliberately did not
  widen the rule table and did not change what the fall-through mode is grounded with. The open
  question of whether contract questions should route somewhere else, or whether the catch-all should
  be grounded with contract facts, is a product decision recorded separately and is not answered here.

## Rollout Plan

Merge to `main` by squash. Deployment is the repo-owned ACA main deploy workflow on merge; nothing
here is deployed by hand. No migration, no data build, no job run, no flag or environment change, and
no ACA template mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. This change runs no Azure command.
- Approved image digest: whatever digest the main deploy workflow builds from the merge commit.
- ACA runtime invariant: to be proven after merge — Container App template image, the 100%-traffic
  revision image and the required worker job images must all equal that digest. Until that check is
  captured this release is `merged`, not `deployed`, and not `live-proven`.
- Worker image invariant: unaffected; no worker code changed.
- Feature/env flag update path: not applicable, no flag added or changed.
- Live signed-in proof required: yes for the user-visible wording, and it is **owed**. An agent must
  not attempt a signed-in acceptance.

## Rollback Plan

Revert the squash commit and let the main deploy workflow rebuild. There is no state to unwind: no
migration, no persisted record, no flag. A reverted build returns the prompt to its previous form on
the next deploy, and every turn that does not classify a Source answer mode is unchanged either way.

## Audit Evidence

- The pull request for this record, and its CI run.
- `src/__tests__/behaviors/c403-answer-mode-routing.test.ts` — the suite carries both the measurement
  that found the defect and the proof that it is closed, including the inverted assertion.
- `docs/architecture/c403-answer-mode-routing.json` — unchanged, and the suite asserts it still equals
  what it recomputes, which is the evidence that no routing moved.
- The merge SHA, the deploy workflow run keyed at or after it, and the digest comparison, once those
  exist.
