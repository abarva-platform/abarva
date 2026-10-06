# 2026-09-22-t703-anchor-the-blocked-rule

## Release ID

`2026-09-22-t703-anchor-the-blocked-rule`

## Status

`candidate`

## Plain-English Summary

The board decides whether an item is waiting on its owner by matching words in
the item's own text. One of those rules matched a single bare word anywhere it
appeared — no anchoring, no veto — while the rule directly above it has both,
added after raw prose turned every descriptive use of a word into an owner gate.

A previous change gave this rule more reach, by letting a row be labelled from
its own body. That made the gap load-bearing.

**Measured on the live register, the bare word was filing as "the owner owes a
decision here":**

- a **filename** among a generator's outputs;
- a contract status **enum value**, in a list of what a field may hold;
- an assertion that a test *"must show an infected file blocked at each of
  those three"*;
- a description of a panel that *"goes blocked rather than available"*;
- a paragraph **explaining what the blocker mechanism itself does**.

None of those is a gate on anybody. **37 rows carried the label; 17 of them for
reasons like these.**

## The distinction the register actually writes

**Predicate versus modifier.** A gate is *stated* — "blocked on", "blocked by",
"blocked until", "is/remains blocked", or a shouted heading. A description uses
the word as an adjective in front of a noun — a blocked path, a blocked bucket,
a blocked read.

Anchoring on the predicate forms keeps every genuine gate and drops the
descriptions. The veto covers what anchoring cannot: a sentence saying the
blockage is **over**, which is written in the same predicate form.

**The pattern is not widened.** Nothing that failed to match before matches now.
This change only removes matches, so an item can only leave the bucket, never
enter it — asserted below rather than assumed.

## Layer Impact

- `internal-admin`. Operator tooling only. No product surface, tenant data,
  schema, migration, projection, flag, route or runtime behaviour. Nothing under
  `src/` imports `scripts/exec/*`, it is in no image, and no Container App reads
  it.
- One small structural addition: the blocker rules gain optional veto support,
  which the rung rules already had. A rule without a veto behaves exactly as
  before.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs`
- `scripts/exec/build-source-board.test.mjs`

## QA / Validation

### Blast radius, on frozen inputs

| | count |
|---|---|
| rows carrying the label | **37 → 20** |
| left the label | **17** |
| **entered** the label | **0** |
| **any other blocker label changed** | **0** |
| ids lost / newly present | 0 / 0 |

The zero in the third row is what proves the pattern was not widened; the zero
in the fourth is what proves no neighbouring rule was disturbed.

### Where the 17 went, and the number that matters

| bucket | before | after |
|---|---|---|
| **claimable** | 2 | **2 — unchanged** |
| blocked on the owner | 189 | **177** |
| held · expired-idle · expired-in-flight · released | unchanged | unchanged |

**Not one of the 17 became claimable.** Every one sits at a rung above zero, so
none drops into the bucket an agent takes from. Twelve leave the owner's bucket
entirely — they stop claiming the owner owes something — and five move to a
different owner gate they genuinely carry.

### The regression set kept its label

Checked by name rather than by count. Every genuine gate survives, including
the shouted heading form, *"remains blocked until \[the owner] supplies the
owner/threshold policy"*, *"wiring blocked on the unapplied migration"*, *"is
blocked by newly filed item \[id]"*, and a *"Blocked-on-\[owner] half"* heading.

### Red first, then five mutations

Same suite both sides: **12 passed / 3 failed** before, **15 / 0** after. Two of
the new cases pass on unfixed code **by design** — they are the regression
guards, and a change that drops them takes an item *out* of the never-claim
bucket, which is worse than the defect being fixed.

| deliberate break | result |
|---|---|
| anchoring reverted to the bare word | **2 failed** |
| the veto removed | **1 failed** |
| scan stops at the first match, not the first unvetoed one | **1 failed** |
| the veto applied to the whole row rather than the sentence | **1 failed** |
| anchoring tightened until only the shouted heading matches | **2 failed** |

**Zero survivors.** Each mutation's file hash was confirmed changed before its
suite ran.

### Three defects in this change's own tests, found while measuring

Reported because the table above would otherwise be overstated. All three were
caught by running the mutations on a green suite:

- **A regression guard that failed for the wrong reason.** Its fixture wrote
  "Decide whether to restore or retire it" in the acceptance, which the decision
  rule above claims first — so the case read `Decision needed` on unfixed code
  and tested a rule this item does not touch. The acceptance was rewritten
  without that vocabulary.
- **A veto case the veto never saw.** It used "is no longer blocked", which the
  *anchoring* already rejects, so deleting the veto entirely left the case
  passing. It now uses a negated form the anchor does match.
- **A scan case that never had to scan.** Its first anchored match was already
  the genuine gate, so a stop-at-first-match implementation passed it. The
  vetoed sentence now comes first.

### Other gates

| What | Result |
|---|---|
| board toolchain suite | **15 passed, 0 failed** |
| queue toolchain suite | **133 passed, 0 failed**, unchanged both sides |
| `eslint` on both changed files | exit code **0** |
| `tsc` | not applicable — `.mjs` is absent from the tsconfig `include`; CI's typecheck job is the authority |

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

- **Two rows keep the label and should not.** One explains the blocker
  mechanism using the genuine preposition form — *"is filed as blocked on the
  owner"* — and the other describes a blockage that is over in a tense the veto
  does not cover — *"the previous two draws were blocked on"*. Both are
  indistinguishable from a real gate without reading for meaning. Both errors
  are on the conservative side: the item stays in the never-claim bucket rather
  than being offered.
- **Anchoring is a word list, not grammar.** A gate written in a form not in
  that list will be missed. The forms here are the ones the register was
  measured to use, not a general vocabulary.
- **The three rows that motivated this item are not in the measurement.** They
  are unplaced on the structure map on this branch, so the board does not render
  them; their placement is a separate change. They will pick this up once both
  land.
- **What this does not move:** no rung, no attribution, no rung-7 veto, no map,
  no other blocker rule, no product behaviour. **Claimable is unchanged**, so
  this offers no new work.

## Rollback Plan

Revert the PR. Seventeen rows return to being filed as owner-blocked, including
one on the strength of a filename.

## Audit Evidence

- The 37 → 20 table with the entering and other-label columns both zero.
- The named regression set, checked individually rather than counted.
- The mutation table with zero survivors, and the three test defects it exposed.
