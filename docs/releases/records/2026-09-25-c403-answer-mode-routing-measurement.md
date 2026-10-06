# 2026-09-25-c403-answer-mode-routing-measurement — measure the Source answer router before anyone changes it

## Release ID

`2026-09-25-c403-answer-mode-routing-measurement`

## Status

`candidate`

## Plain-English Summary

The Source assistant decides what *kind* of question it has been asked before it
answers, using a table of 19 patterns tried in order — the first one that matches
wins. That decision picks which grounded facts get assembled for the model, so it
matters. Nothing measured what the table actually does.

This change measures it and changes nothing about it. No pattern was added,
removed, reordered or edited, and no route changed. Three facts are now recorded
as data and re-derived by a test on every run, so a later change to the table has
to keep them true or say why:

1. **The catch-all bucket is reachable only by falling through.** One of the 18
   declared question kinds is emitted by no pattern at all. It is what the
   classifier returns when it understood nothing — which means, downstream, a
   question it understood and a question it did not are currently the same value.
   The test proves this by comparing the full declared list against the list the
   patterns can produce, rather than by pointing at two lines of source.

2. **Order costs almost nothing here.** For every pair of patterns, the later
   one's own vocabulary was expanded into probe phrases and run through the
   classifier to see whether an earlier pattern eats them. Of 171 ordered pairs
   and 428 probes, exactly **one** pair overlaps: a phrase belonging to the
   stage-gate confirmation pattern is consumed by the stage-gate blockers pattern
   directly above it. Both produce the same question kind, so nothing downstream
   sees a different answer — only the recorded rule id differs. This is a
   *negative* result and is reported as one: the ordering is far less fragile
   than the item that commissioned this measurement assumed.

3. **The contract acceptance set the specification defines is invisible to this
   table.** All 16 acceptance rows of the lever-basis specification §12.11, plus
   32 authored paraphrases — **48 of 48** — fall through to the catch-all. Not
   one matches any of the 19 patterns. That is the number the "general contract
   question path" needed, and it was previously an impression.

Finding 3 is the material one. The router's vocabulary is sourcing-event
vocabulary — stages, gates, evidence, uploads, BAFO — and the questions the
specification says a user will ask about a *contract* use none of it. This
release does not fix that, deliberately: the fix is a routing change, and a
routing change without a measured baseline is not reviewable. The baseline now
exists.

## Layer Impact

Release lane: `global-control-lane` — the suite and its record are shared
repository control surface, not client-scoped data and not feature-gated. It is
a measurement lane change: no client receives different behavior.

- **Layer 4 — Products (Source).** Measurement only. No product surface, route,
  API or rendered output changes. Nothing under `src/` imports the new suite.
- Layers 1–3 untouched. No tenant data, no adapter, no canonical object.

## Client Applicability

- All clients: no behavioral change.
- Specific clients: none.
- Internal only: yes — a test suite and a committed measurement record.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/c403-answer-mode-routing.test.ts` — new. Extracts the
  rule table and the question-kind union through the TypeScript AST (not a regex
  over the file: the subject *is* syntax — regex literals nested in arrow
  functions in object literals), expands each rule's own alternations into
  probes, and asserts the three measurements plus the two call sites.
- `docs/architecture/c403-answer-mode-routing.json` — new. The committed
  measurement, regenerated with
  `ABARVA_UPDATE_C403_ROUTING=1 npx jest --runTestsByPath src/__tests__/behaviors/c403-answer-mode-routing.test.ts`.
  It pins rule order and each rule's regex text, so a reorder or an edit to the
  table fails the suite rather than passing silently.
- No change to `src/lib/source/ava/answer-mode.ts` or to any route.

## A correction to the backlog item this serves

The item states that the classifier has **one** caller in `src/`, which discards
`.matchedRule` and `.isFallback`, and that a repo-wide search finds those fields
on no consumer of this classifier's result.

There are **two** non-test callers, and they disagree:

- `src/app/api/chat/agent/route.ts` assigns `.mode` and drops both fields —
  exactly as filed. That caller is why the defect is real.
- `src/lib/source/ava/module-expert.ts` does **not** drop them: it carries both
  into the chat packet and renders the matched rule id into the text handed to
  the model.

Both call sites are asserted in the suite from their own bytes, so the correction
cannot rot back into the filing's version. The three measurement clauses are
unaffected by the error — what the router does is the same either way — so the
work was completed rather than abandoned, and the backlog row is corrected in
place.

Two smaller discrepancies, recorded and not fixed here: the module's own header
comment says the classifier "returns one of 16 modes" while the declared union
has **18** members; and the item's description of the table is otherwise accurate
(19 rules, 23 regex literals, both `general_advisory` return sites flagged as
fallback).

## QA / Validation

Baseline and after, same scope, same machine, run serially:

- `npx jest src/__tests__/behaviors --runInBand` at `origin/main` `a0289e44b`
  (clean worktree, suite absent) vs. the same scope with the suite present.
  Numbers in the pull request.
- New suite: **15 tests, 15 passing**, 0.35 s.

**Six deliberate mutations, each reverted, each reddening a named test:**

| # | Mutation | Tests that failed |
|---|---|---|
| 1 | Both catch-all return sites claim `isFallback: false` (blind the classifier) | 4, incl. *never returns `general_advisory` with `isFallback: false`* |
| 2 | Swap the identities of the two stage-gate rules (a reorder) | 3, incl. *pins rule order and regex text* |
| 3 | Inject a 20th rule that emits the catch-all kind | 4, incl. *is the only declared mode no rule emits* |
| 4 | Widen rule 0 so it swallows rule 14's only keyword (inject real shadowing) | 3, incl. *matches the committed pair list exactly* |
| 5 | The packet caller stops carrying `matchedRule` | 1 — *the module-expert packet keeps BOTH fields* |
| 6 | Invert the fallback assertion inside the suite itself | 1 — the inverted assertion fails, as the acceptance requires |

Mutation 4 is the one that matters for honesty: a clean corpus hides a blind
detector, so the shadowing measurement was re-run under an injected overlap and
**named the injected pair** (`event_status.where_are_we -> bafo_strategy.core`,
probe `"bafo"`) alongside the real one, rather than merely noticing that
something had changed.

Generator self-check: every one of the 428 probes is re-tested against its own
originating rule's regex, and the suite fails if any probe its own rule does not
match is generated. A mis-expanded probe would otherwise turn a shadowing verdict
into a test of the expander.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit code judged, not grepped.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` by squash. No runtime rollout: this adds a test and a JSON record
and changes no shipped code path. The repo-owned ACA deploy workflow will build
and deploy the merge commit as it does for every merge; no image, flag,
environment variable, worker job or traffic weight is affected by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: unchanged by this release; the deploy run keyed to the
  merge SHA carries it.
- ACA runtime invariant: verified after merge against the merge SHA's own deploy
  run — template image, 100%-traffic revision image and worker images equal.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. This release ships no user-visible
  behavior; there is nothing a signed-in session could observe that a passing
  test does not already establish.

## Rollback Plan

Revert the single squash commit. No migration, no data change, no flag, no
runtime state. Reverting restores the previous state exactly: the measurement
record and the suite disappear together, and the classifier is untouched either
way.

## Audit Evidence

- The pull request and its checks.
- `docs/architecture/c403-answer-mode-routing.json` — the measurement, in full,
  including all 48 §12.11 routings and every shadowed pair.
- The mutation table above; each row is reproducible from the described edit.
- `npx jest --runTestsByPath src/__tests__/behaviors/c403-answer-mode-routing.test.ts`.

## Known Gaps

- **The 48-of-48 fall-through is measured, not fixed.** Whether the contract
  question path gets its own rules, a second classifier, or a deliberate decision
  that the catch-all is the right home for it, is a product call and is filed as
  a follow-on item rather than guessed at here.
- **Downstream cannot yet tell "understood" from "did not understand".** The
  chat route drops `isFallback`. Making it act on that flag is a routing/consumer
  change and is out of scope for a measurement.
- The paraphrases for the 5 specification rows that describe an action rather
  than quote a question are authored by this suite and labelled as such in the
  record. They are not the specification's sentences and are not presented as
  such.
- The module header's "16 modes" against a declared union of 18 is recorded here
  and left alone; correcting a comment inside the subject file would have meant
  touching the file this item exists to leave untouched.
