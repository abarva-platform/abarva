# 2026-09-18-truncation-artifact-false-positives — Stop deleting the last word of a finished sentence

## Release ID

`2026-09-18-truncation-artifact-false-positives`

## Status

`candidate`

## Plain-English Summary

Every advisor answer passes through a shared text cleaner. One of its rules was
meant to tidy up sentences that had been cut off mid-clause: if a line ended in
a connecting word followed by a full stop, the rule deleted that word and the
stop.

The rule's list of connecting words included ordinary prepositions. English
routinely ends a sentence with one, so the rule was firing on correct prose and
delivering it with its last word missing:

| What the answer said | What the user was shown |
|---|---|
| Here is the renewal comparison you asked for. | Here is the renewal comparison you asked |
| That is the number the board signed off on. | That is the number the board signed off |
| This is the contract we already paid for. | This is the contract we already paid |
| Two renewals were paused for a while. | Two renewals were paused for a |
| Nobody has raised this before. | Nobody has raised this |

All five were reproduced through the real surface shaper before any code
changed. The rule ran on every advisor surface, whether or not the answer's
structure was being preserved, so nothing about the surface or the answer
shielded a user from it.

The rule now covers only the three coordinating conjunctions — `and`, `or`,
`but`. A finished English sentence never ends in one of those, so removing them
cannot damage correct prose. Every other word on the old list can legitimately
end a sentence, either as a stranded preposition ("the baseline we measured
against") or as an adverb ("paused for a while", "raised this before"), and
none of them is evidence that anything was cut. A cut sentence is now also
closed with a full stop instead of being left hanging on a comma:
"Three vendors remain in scope, and." becomes "Three vendors remain in scope."

**The cost, stated rather than hidden.** A genuinely truncated sentence that
ends in a preposition or a subordinator now reaches the user still truncated.
That is the deliberate trade: text that is visibly cut is honest, and the
reader can tell something went wrong; text that was silently shortened reads as
finished and is not. The pre-existing test that pinned the wide behaviour was
updated in place with that reasoning written next to it, not deleted.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

- **Layer 4 (Products):** presentation only. This is the shared advisor
  response shaper that Tower, Intelligence, Source, Moves and the setup
  surfaces all render through.
- **Layers 1–3 unchanged.** No intake, adapter, canonical model, schema,
  migration, dataset, retrieval or prompt behaviour is touched. No number, no
  citation and no governance decision changes; only the characters at the end
  of a rendered sentence.

## Client Applicability

- All clients: yes — the shaper is shared by every advisor surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The repair is unconditional, as the rule it narrows was.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — the connector list inside
  `normalizeAssemblyArtifacts` narrows to `and|or|but`; the replacement closes
  the sentence with a full stop and absorbs a preceding comma; the reasoning is
  recorded at the call site.
- `src/lib/agent/__tests__/response-shape-truncation-artifacts.test.ts` — new
  behavioural suite (19 tests) driving `shapeAgentResponseForSurface`,
  `shapeStreamingAgentTextForSurface` and `shapeSharedAdvisorResponse`.
- `src/lib/answer/__tests__/shared-response-shaper.test.ts` — the assertion
  that pinned the wide list is replaced with one that pins the narrowed rule,
  plus an assertion that states the accepted cost out loud.

No migration, no route, no script, no workflow.

## QA / Validation

Commands run in a dedicated worktree off `origin/main` (`c527241f6`). Exit
statuses captured, not grepped.

**Before / after over the same scope.**

| Measurement | Before | After |
|---|---|---|
| New behavioural suite | 14 failed, 5 passed | **0 failed, 19 passed** |
| `npx jest src/lib/answer src/lib/agent` | 21 failed, 857 passed (8 suites failing) | 21 failed, 876 passed (8 suites failing) |

The 21 failures are pre-existing and unrelated. The failing-suite name lists
from a clean checkout and from the patched tree were diffed and are byte
identical, so the count is not a coincidence of arithmetic.

**Mutation check — the guard can fail.** Each mutation was applied, the two
suites (24 tests) were run, and the tree was restored.

| Mutation | Result |
|---|---|
| Restore the original wide connector list | caught — 15 failed |
| Add just `for` back to the narrowed list | caught — 4 failed |
| Delete the rule entirely | caught — 2 failed (the rule's remaining job is enforced, not merely removed) |
| Remove the word boundary, so `vendor.` matches `or.` | caught — 5 failed |
| Replace the cut connector with nothing, leaving the sentence unterminated | caught — 2 failed |
| No mutation | 24 passed |

**Other checks.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` after removing `tsconfig.tsbuildinfo` — **exit 0**. `npx eslint`
over the three changed files — **exit 0**. `node scripts/release-check.mjs
--base origin/main --head HEAD` — recorded below.

**Not verified.** No signed-in check on a deployed build has been run; the text
change is proven at the shaper, not on a rendered screen.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and
deploys on merge. No migration, no flag, no data build, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No deploy is run by hand for this change.
- Shared runtime mutators: none. This change adds no Azure command, job, flag or
  environment variable.
- Approved image digest: produced by the merge deploy run; recorded against the
  merge SHA after the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template
  image must equal the 100%-traffic revision image, digest-pinned and Healthy.
- Worker image invariant: unchanged; no worker job code is touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, and **owed** — the acceptance is that an
  advisor answer ending in a preposition renders with its final word intact.

## Rollback Plan

Revert the single commit. The change is three files, one of them a new test,
and it carries no state: the previous behaviour returns on the next deploy with
no data or migration consequence.

## Known Gaps

- **No signed-in proof.** The behaviour is proven at the shaper, not on a
  rendered screen on the deployed build. Status after merge is `deployed`, not
  `live-proven`.
- **A real truncation ending in a preposition is no longer repaired.** Accepted
  deliberately, and pinned by a test so the choice is visible rather than
  forgotten. If the upstream assembler is the thing producing cut sentences,
  the repair belongs there, where the cut is known to have happened, not in a
  cleaner guessing from the final characters.
- **Coordinators are handled positionally, not grammatically.** The rule still
  cannot tell a truncated clause from a deliberate fragment; it relies on the
  fact that `and`, `or` and `but` do not end finished English sentences. A
  quoted fragment ending in one of those three — for example a verbatim quote
  of a cut sentence inside an answer — would still be edited.
- **The release-record template is missing a section this gate requires.**
  `docs/releases/templates/release-record-template.md` has no `## Known Gaps`
  heading, but `scripts/release-control/check-release-record.mjs` lists it in
  `REQUIRED_SECTIONS`. Anyone copying the template gets a failing gate. Not
  fixed here — it is a different file and a different owner — and filed to the
  backlog instead.

## Audit Evidence

- PR and CI run for this branch.
- The before/after and mutation tables above, each reproducible by running the
  two named suites at the commit before and after.
- `docs/releases/records/2026-06-27-tower-chat-quality-spine.md` — the record
  for #4033, which introduced the rule being narrowed, and whose test case is
  the truncated sentence now deliberately left visible.
