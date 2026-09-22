# 2026-09-22-t705-rung7-veto-negation-forms

## Release ID

`2026-09-22-t705-rung7-veto-negation-forms`

## Status

`candidate`

## Plain-English Summary

The execution board reads how far an item is proven from the operator register.
The top rung means a signed-in check passed, and it has a veto so that a
sentence *denying* proof cannot be read as asserting it.

That veto demanded the word `not` and the term **adjacent**. The register does
not write that way, so **six rows took the top rung from sentences that deny
it** — including four written in the register's habitual form:

> Status `deployed`, **NOT** `live-proven`.

A single backtick between the two words defeated the pattern.

This is not cosmetic. The top rung is the queue's "finished" test, so every one
of those rows was excluded from every bucket the queue renders — filed as
finished work that had not finished.

## What changed

**Only the veto.** The rung-7 test is untouched, so the movement is
attributable to this change alone.

The reach is **measured, not chosen**. Sweeping 20 / 40 / 60 / 80 over the live
register:

| reach | rows leaving rung 7 | known positives move | rows *entering* rung 7 |
|---|---|---|---|
| 20 | 5 | yes | **0** |
| 40 | 6 | yes | **0** |
| 60 | 6 | yes | **0** |
| 80 | 6 | yes | **0** |

40, 60 and 80 are **identical** — the band is flat above 40. 80 is taken because
it is already what the rung-5 and rung-6 vetoes beside it use, so the three now
read the same and the choice costs nothing the measurement can see.

## The second change, and why it is not a separate release

Correcting the veto drops one row to rung 0. That is **correct** — its own text
reads "not merged, not deployed, not applied" — but that row carries **no
blocker at all**, so a *false* top rung was the only thing keeping owner-gated
work out of the claimable bucket. Its acceptance says its work "remains out of
scope until separately approved", a phrase the approval rule did not recognise.

Shipping the veto alone would have offered that row to the next agent as free
work. So the approval rule gains that one phrase. **Measured, it changes the
blocker of exactly one item — that one.** The two changes sit on different axes
and are measured separately below.

## Layer Impact

- `internal-admin`. Operator tooling only. No product surface, tenant data,
  schema, migration, projection, flag, route or runtime behaviour. Nothing under
  `src/` imports `scripts/exec/*`, it is in no image, and no Container App reads
  it.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs`
- `scripts/exec/build-source-board.test.mjs`

## QA / Validation

### The rung axis, on frozen inputs

| | count |
|---|---|
| ids compared | **411** |
| unchanged rung | **405** |
| rung moved **down** | **6** |
| rung moved **up** | **0** |
| ids lost / newly present | **0 / 0** |

Top rung falls **37 → 31**. **All six movers were read individually**, and every
one takes its old rung from a sentence that denies proof. Four are the
backtick form above; one reads "Recorded as `deployed`, deliberately NOT
`live-proven`"; one reads "This line does not claim deployed or live-proven."
Five now read `Deployed`, which is exactly what those same lines state.

The sixth is the row discussed above: its register lines say only "implemented
locally on branch", so rung 0 is the truthful reading.

### The blocker axis

| | count |
|---|---|
| items whose blocker changed | **1** |

### Buckets

| bucket | before | veto only | shipped |
|---|---|---|---|
| **claimable** | 2 | **3** | **2** |
| blocked on the owner | 189 | 194 | **195** |
| held · expired-idle · expired-in-flight · released | unchanged | unchanged | unchanged |

The middle column is why both changes ship together: the veto alone puts an
owner-gated row into the claimable bucket.

### Red first, then five mutations

Same suite both sides: **12 passed / 3 failed** before, **16 / 0** after. Two of
the new cases pass on unfixed code **by design** — they are the guardrails
against a veto widened until nothing can claim proof.

| deliberate break | result |
|---|---|
| veto reverted to the adjacent-only form | **2 failed** |
| the per-sentence split removed | **1 failed** |
| veto reach cut to 4 characters | **1 failed** |
| veto widened to fire on any `not` | **1 failed** |
| approval term removed | **1 failed** |

**Zero survivors.** Each mutation's file hash was confirmed changed before its
suite ran; a mutation that leaves the file identical is worth nothing.

### Two defects in this change's own tests, found by that mutation round

Reported because the numbers above would otherwise be overstated:

- **A guardrail that could not bite.** The "still reaches rung 7" case used a
  proof sentence containing no negative at all, so a veto widened to fire on any
  `not` passed it untouched. Real proof lines do carry a negative — the ladder's
  own top rung is "signed-in acceptance, **and opposite-tenant refusal**". A case
  was added where the denial sits *after* the proof term; it is what now catches
  that mutation.
- **A case whose stated reason was wrong.** One case claimed the veto's own span
  stops at sentence punctuation. It does not matter: evaluation is already
  per sentence, so widening the span across a full stop changes nothing, and that
  mutation passed every case. The comment now says what actually holds the
  behaviour — the split — and the mutation set removes the split instead.

### Other gates

| What | Result |
|---|---|
| board toolchain suite | **16 passed, 0 failed** |
| queue toolchain suite | **133 passed, 0 failed**, unchanged both sides |
| `eslint` on both changed files | exit code **0** |
| `tsc` | not applicable — `.mjs` is absent from the tsconfig `include`, so neither file enters the program; CI's typecheck job is the authority |

## Rollout Plan

Merge to `main`. Operator tooling only: no image build, migration, flag, traffic
shift or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: **no**, and
  structurally — nothing under `src/` imports these scripts, they are in no
  image, and no Container App reads them

## Known Gaps

- **A denial before the proof term in the same sentence now vetoes it, whatever
  it means.** "This is not a rollback and signed-in acceptance passed" would be
  read as unproven. Measured, no such row exists in the register today, and the
  error is on the understating side, but the rule cannot tell that form from a
  real denial.
- **Only the top rung's veto is widened.** The rung-5 and rung-6 vetoes already
  had the wider shape; no other rule is touched, and none is re-ranked.
- **The approval phrase is one literal.** Other ways of writing the same gate
  are still unrecognised; this adds the one form the register was measured to
  use, not a general vocabulary.
- **What this does not move:** no test, no attribution, no blocked rule, no map,
  no product behaviour. Claimable is unchanged end to end, so this offers no new
  work.

## Rollback Plan

Revert the PR. Six rows return to reading signed-in proven from sentences that
deny it, and one owner-gated row returns to having no blocker.

## Audit Evidence

- The reach sweep at four values, with the entering-rung-7 column zero throughout.
- All six movers with the sentence each had taken its rung from.
- The three-column bucket table, including the veto-only middle column.
- The mutation table with zero survivors, and the two test defects it exposed.
