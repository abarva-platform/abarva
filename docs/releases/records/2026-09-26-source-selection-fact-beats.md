# Source Selection Stage Fact-Derived Beats

## Release ID

`2026-09-26-source-selection-fact-beats`

## Status

`candidate`

## Plain-English Summary

The Selection-stage task list and gate now report what this event's own award record
commits, lever by lever, instead of showing a sample stage's fixed checklist and
fixed attestations. Three states are kept apart deliberately: an award nobody has
read yet, an award that was read and committed nothing, and an award that committed
some levers while the rest are still awaiting award. A lever with no commitment is
never shown as committed at zero, and the gate's approver is the role the resolved
archetype declares rather than a fixed string.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema, migration or data change. The per-lever
  committed-value signal already exists and is already read on this stage.
- Layer 4 Source: derives the Selection task and gate presentation from that signal,
  the evaluator's per-lever results, the caller's citations and the resolved
  archetype's declarations. Approval policy, stage progression and the governed
  stage action are unchanged.

## Client Applicability

- All clients using the Source event analytics canvas, on the Selection stage only.
- No client-specific data, migration, feature flag or external delivery change.

## Changes Included

- Pass the existing tenant-scoped committed-value-at-award signal from the mounted
  event page to the live stage builder. It was already fetched on this stage and
  already handed to the step-insight builder; it stopped one function short.
- Add a Selection beats module deriving the task list and the three gate
  confirmations from the award read, the evaluator results, the citations and the
  archetype. It reads nothing from the sample stage.
- Keep the `COMMITTED_VALUE_V1` upload template, because that code names a real
  parser rather than sample copy; drop the sample gate's internal artifact code,
  which should not reach a client surface.
- Give the per-stage provenance measurement harness the same base/richer fixture
  pair every other tenant signal there already has, and regenerate the committed
  measurement artifact with its own generator.
- Correct the two hardcoded scaffold/derived population counts the flip moved.

## QA / Validation

Measured in a separate clean worktree at the same base commit, not by stashing.

- **Red first, final suite on clean base:** 7 failed / 3 passed of 10. The 3 are
  negative controls that pass on unfixed code by design — a fixture-population
  guard, the undeclared-lever-key guard (the un-flipped stage ignores the signal
  entirely, so it cannot miscount it), and the canonical-next-stage guard. An
  over-broad fix breaks them. After: 10 passed / 0 failed.
- **Nine mutations, nine caught, zero no-op.** Each edit's effect on the file was
  confirmed by comparing the file's sha256 before and after, so an edit that
  changed nothing could not be read as a caught mutation. Killed case counts:
  collapsing the three-way signal split 5; fabricating zero for an awaiting-award
  lever 4; dropping the declared-lever fence 1; reverting the approver to the fixed
  string 3; carrying the sample deliverable and its internal code 4; dropping the
  next-stage name 1; the builder withholding the signal from the module 6; the
  stage leaving the derived table 10; the mounted page withholding the signal 1.
- **The regeneration caught a harness defect before it was committed, and this is
  the finding worth reading.** The first regenerated artifact recorded this stage's
  `gate.confirms` as `derived_from_neither` and `movesWithFacts` as `false` while
  the boundary declared it derived — and the measurement was right. The harness
  perturbs the other tenant signals in a base/richer pair and had no such pair for
  this one, so a derivation of the award read had nothing to move with. The pair was
  added, committing a *second* lever rather than a larger amount on the first, so
  both the coverage count and the committed total move; a larger amount alone would
  move the total and leave the count identical, and the count is the marker the gate
  leads with. `derivedFromNeitherFields` is empty again.
- **Baseline over the same scope, both sides, same commit:** `src/lib/source` +
  `src/components/source` — 399 suites / 4034 tests / **4 failing** before, 400 /
  4042 / **4 failing** after. Same two suites both times
  (`pricing-submissions/parser`, `vendor-proposals/governed-vendor-proposal-facts`);
  pre-existing and untouched here.
- **The +8 is reconciled per suite rather than asserted:** +10 new cases, +1 and +1
  in the two provenance suites whose `it.each` runs over the derived set, and −2 and
  −2 in two sibling suites whose `it.each` runs over the still-carrying set. Those
  four are per-stage carriage and disclosure assertions that correctly no longer
  apply to this stage; both sibling suites read that set off the builder, so neither
  needed editing.
- Pass: behaviour gate 143 suites / 1456 tests / 0 failing.
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  judged on the exit code, with `tsconfig.tsbuildinfo` deleted first — exit 0 and
  zero `error TS` lines.
- Pass: scoped ESLint, exit 0.
- CI: pending PR creation.

## Rollout Plan

Merge through a PR once every required check has finished and passed. Only the
repo-owned ACA main workflow may deploy the merge. After it completes, prove the
runtime invariant by reading Azure directly: the web Container App template image,
the 100%-traffic revision image and both required worker job images must equal one
digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deploy.
- ACA runtime invariant: verify template, traffic revision and workers after deploy.
- Live signed-in proof required: **yes, and it is owed, not performed.** This change
  alters what a mounted client surface renders. The proof is a signed-in read of the
  Selection view for an authorized tenant whose event is legitimately at that stage,
  recording which state the gate reports and that no awaiting-award lever is shown as
  committed at zero. It was not attempted in this change and is not claimed.

## Rollback Plan

Revert through a PR. No data or schema rollback is involved; no migration, no write
path and no approval policy changed.

## Audit Evidence

The focused behaviour suite, the regenerated provenance JSON as one committed diff,
the nine mutation results with their hash guard, the per-suite reconciliation of the
test-count delta, the local check exit codes, PR/CI, and the post-deploy runtime and
signed-in records once they exist.

## Known Gaps

- The award reader keeps only levers that carry a committed-value fact, so it cannot
  distinguish a deliberate zero commitment from a missing row. This view therefore
  says "awaiting award" for both, and says so in the task prose rather than implying
  a commitment of nothing.
- `generates` on this gate is empty, because no rule-bearing archetype declares a
  deliverable at this stage. That is the honest reading of the declarations, not a
  claim that nothing should generate; declaring one is a separate content decision.
- The chat grounding path builds its stage view without any of the tenant signals,
  so on that path this stage derives its un-observed state. That is pre-existing and
  identical for all four previously derived stages; it is not narrowed or widened
  here.
- Four of the five remaining stages still carry sample task and gate content. One of
  them still exposes a person-named approver from the sample module, which is a
  distinct liability from carriage and is filed separately rather than folded in.
