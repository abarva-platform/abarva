# 2026-09-22-place-u502-and-recognise-a-noun-phrase-decision

## Release ID

`2026-09-22-place-u502-and-recognise-a-noun-phrase-decision`

## Status

`candidate`

## Plain-English Summary

One backlog id was filed after the previous placement change was already in
CI, so it merged knowingly one id short and the board went back to exiting
non-zero. This places that id.

It is one string. The second change beside it is the reason this record is
longer than that.

| | before | after |
|---|---|---|
| ids the board cannot place | **1** | **0** |
| board exit code | **1** | **0** |

**That half shipped from a parallel lane, not from here.** A duplicate change
placed the id first. What remains in this release is the gate described below —
the part that keeps the placed row from being offered as free work.

## The second change, and why it is not a separate release

Placing the id made it **rung 0 with no blocker**, which is *claimable* — and
its acceptance opens:

> **A decision**, then the work that follows from it: mount or retire.

That is an owner gate stated as plainly as any form the decision rule already
recognises. But the rule matches `decision needed`, `decision required` and the
imperative `Decide`, and this row uses none of them. **Shipping the placement
alone would have offered an owner decision to the next agent as free work.**

So the rule gains that one phrase, anchored exactly as `Decide` already is: it
must **open a sentence or follow bold markup**. "A decision was taken", "the
decision belongs to the owner" and any mid-sentence mention stay out.

This is the same shape as a bundle earlier today, where correcting a rung
exposed a row with no blocker, and it is bundled for the same reason: the two
axes are measured separately below, and shipping half would ship a hazard.

## Layer Impact

- `internal-admin`. Operator tooling only. No product surface, tenant data,
  schema, migration, projection, flag, route or runtime behaviour. Nothing under
  `src/` imports `scripts/exec/*`, it is in no image, and no Container App reads
  it.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/source-stage-map.json` — one id appended to the
  platform-integrity track.
- `scripts/exec/build-source-board.mjs` — one anchored phrase added to the
  decision rule.
- `scripts/exec/build-source-board.test.mjs` — two cases.

## QA / Validation

### The placement axis

| | before | after |
|---|---|---|
| unplaced ids | 1 | **0** |
| board exit code | 1 | **0** |

Measured against the map as merged, extracted from `origin/main` and passed
explicitly — the generator reads the map from the working tree, so a run that
does not pass it compares an edited file with itself.

### The blocker axis

| | count |
|---|---|
| items whose blocker changed | **1** |

That one is the id being placed: no blocker → `Decision needed`.

### Buckets

**Superseded a second time — the placement shipped from another lane.** A
parallel change placed the id first, so this record's placement half is already
on `main` and this change now carries only the gate. Re-measured against that
merged state:

| bucket | main today | with this gate |
|---|---|---|
| claimable | 2 | **2 — unchanged** |
| blocked on the owner | 191 | **192** |
| held · expired-idle · expired-in-flight · released | 8 · 90 · 120 · 134 | unchanged |

**The claimable column no longer moves, and that is not the gate becoming
unnecessary — it is the hazard being masked.** On merged `main` the placed row
reads **rung 0 with no blocker**, which is the claimable shape; it is out of the
bucket today only because a claim line in the register currently holds it. When
that claim lapses the row is offered, because nothing about it is gated. The
gate changes the blocker of exactly one item, that one, so it cannot be offered
at all.

Two earlier versions of this table read 4 / 5 / 4 with 203 and then 191. Each
was correct when measured and each was overtaken: the first by a neighbouring
change that moved 17 rows out of the blocked bucket, the second by the
placement landing from another lane. The measurement was never wrong; the base
moved under it twice.

### Red first, then four mutations

**17 passed / 1 failed** before, **18 / 0** after. One of the two new cases
passes on unfixed code **by design** — it is the anchor guardrail, and a rule
that read an ordinary mention as a gate would move finished work into the
never-claim bucket.

| deliberate break | result |
|---|---|
| the new term removed entirely | **1 failed** |
| the anchor dropped, matching the phrase anywhere | **1 failed** |
| anchor narrowed to start-of-corpus only | **1 failed** |
| the phrase changed so the live wording no longer matches | **1 failed** |

**Zero survivors.** Each mutation's file hash was confirmed changed before its
suite ran.

### A no-op mutation found and replaced

The first mutation set included "make the term case-sensitive to the wrong
casing". It survived everything — correctly, because the pattern carries the
case-insensitive flag, so that edit changes no behaviour at all. A mutation that
cannot fail proves nothing about the tests; it was replaced with two that do.

### A fixture that failed for the wrong reason

The first version of the positive case gave its row a title ending `.**`. The
anchor accepts `**` only immediately before the phrase, so bold between the full
stop and the words defeated it, and the case failed against the *fixed* code.
The live row ends its title with a plain full stop. The fixture now matches the
live shape, and the limitation is recorded under Known Gaps rather than papered
over by widening the anchor beyond what was measured.

### Other gates

| What | Result |
|---|---|
| board toolchain suite | **18 passed, 0 failed** |
| queue toolchain suite | **133 passed, 0 failed** |
| map still parses as JSON | yes |
| map diff size | **2 insertions, 1 deletion** — no reserialisation |
| `eslint` | exit code **0** |
| `tsc` | not applicable — `.mjs` is absent from the tsconfig `include` |

## Rollout Plan

Merge to `main`. Operator tooling only: no image build, migration, flag, traffic
shift or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: **no**, and
  structurally — nothing under `src/` imports these scripts

## Known Gaps

- **This will go stale again, and no merge closes it.** The backlog is
  append-only and lives outside the repository, so nothing in CI can assert that
  every filed id is placed. Placement went stale **three times inside one
  session** — that is the measurement of the limit, not bad luck. The durable
  fix is the backlog inside the repo or a scheduled job with access to it;
  neither is attempted here.
- **The anchor cannot see through bold.** A row whose title ends `.**` puts
  markup between the full stop and the phrase and will be missed. That limit is
  shared with the imperative form beside it and is not widened here, because
  widening it was not measured.
- **One phrase, not a vocabulary.** Other ways of writing the same gate remain
  unrecognised; this adds the one form the register was measured to use.
- **What this does not move:** no rung, no attribution, no blocked rule, no
  other blocker rule, no product behaviour. Claimable is unchanged end to end.

## Rollback Plan

Revert the PR. The board returns to exiting non-zero on one id, and that row
returns to being offered as free work.

## Audit Evidence

- Both exit codes, measured with the map passed explicitly on each side.
- The three-column bucket table, including the placement-only middle column.
- The mutation table with zero survivors, plus the no-op mutation and the
  wrong-reason fixture that the round exposed.
