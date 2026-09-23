# 2026-09-23-t724-narrated-item-subject — An item a line talks about is not an item a line takes

## Release ID

`2026-09-23-t724-narrated-item-subject`

## Status

`candidate`

## Plain-English Summary

The execution register is an append-only log in which agents record which backlog item they
are working on, so two agents never take the same item at once. A repo-owned control reads
that log and answers whether an item is free. It decides by finding the words `item <id>`
in a line and treating that as a claim.

Agents write long records. A record about one item routinely mentions others — what merged
while it was in flight, whose fix it depends on, which id a gate refused. The control had
no way to tell those mentions apart from a claim, so a run that cited another item was
recorded as having taken it.

Two earlier repairs closed two shapes of this: a mention introduced by somebody else's name
(`Sibling run ... merged item 34`), and a mention with a negation in front of it (`I touch
none of item 26's files`). The register also writes mentions with neither, and two of them
are on it right now:

- `Item 26 MERGED mid-flight - PR #8318 squashed to a292fc656` — an affirmative report of
  another run's merge, with no third-party word in front of it.
- `refused item 26's genuine owner` — the id as the object of a verb whose subject is the
  gate itself.

Both sit inside records that had *already* declared a different subject at their head. Both
refused item 26 to a run that came for it — the second of them to the author of this change,
mid-claim, which is how it was found.

This change teaches the control what the register already says: every record declares its
subject once, at a fixed place, in one of two grammars. An id appearing anywhere else on a
line that has already declared its subject is being talked about, not taken.

**The cue is position, and deliberately not the verb.** The verb cannot be the cue, and that
was measured rather than assumed: `merged item <id>` occurs five times on the register and
four of them are a run announcing its *own* merge at the head of its message. A rule keyed
to the verb would free four genuine records while their authors were still proving the
deploy — a false pass, which is the worse direction.

## Layer Impact

Release lane: `internal-admin`.

- **Platform tooling / execution control plane.** `scripts/exec/register-time-authority.mjs`
  only. No product layer is touched: not client intake, not the source adapters, not the
  canonical model, and no product surface. The control reads an operator-owned file and
  writes nothing.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: **yes** — agent execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - New `declaredItemSubject`, `DECLARED_SUBJECT_HEAD`, `LEGACY_DECLARED_SUBJECT`,
    `ITEM_CO_CLAIM` and `subordinateToDeclaredSubject`: the id a record declares as its own
    subject, and a veto for every other id on that line.
  - `itemSubjects` consults the veto after its four existing ones.
  - `ITEM_SUBJECT` is untouched, as in the five sibling repairs, so every verdict that moves
    is attributable to this veto alone.
- `scripts/exec/register-time-authority.test.mjs` — 20 new behavioural cases.

## QA / Validation

Measured over the same scope on both sides; no number here is absolute.

| measurement | before | after |
|---|---|---|
| `scripts/exec/register-time-authority.test.mjs` on clean `origin/main` `1a9a51fe4` | 213 passed, 0 failed | — |
| the same suite with the 20 new cases and **no** fix | 222 passed, **8 failed** | — |
| the same suite with the fix | — | **233 passed, 0 failed** |
| `scripts/exec/append-claim.test.mjs` | 50 passed, 0 failed | 50 passed, 0 failed |
| `scripts/exec/build-execution-queue.test.mjs` | 140 passed, 0 failed | 140 passed, 0 failed |
| `scripts/exec/build-source-board.test.mjs` | 23 passed, 0 failed | 23 passed, 0 failed |
| `scripts/exec/queue-provenance.test.mjs` | 30 passed, 0 failed | 30 passed, 0 failed |
| `scripts/exec/worktree-retention.test.mjs` | 22 passed, 0 failed | 22 passed, 0 failed |
| `scripts/exec/cli-entry.test.mjs` | 17 passed, 0 failed | 17 passed, 0 failed |

**The suite is confirmed executing on a real runner, and the runner's number is not the
local one.** Run `35834667303`, job `Execution queue behavioral contract`, logs
`-- T-724: a narrated id is not a claimed id --` and `230 passed, 0 failed`. The gap to the
local 233 is **three pre-existing cases that read the operator register**, which is not in
this repository and does not exist on a runner, so they are skipped there. Measured on
clean `origin/main` rather than assumed: the same suite reads **210** with the register
absent and **213** with it present, the identical gap of three. None of the 20 cases added
here is among them — every one runs from a fixture, and all 20 executed in CI.

**Red first, then the fix, then the fix broken on purpose.** 8 of the 20 new cases failed
before any product edit; the other 12 are the guardrails an over-broad fix would break, and
they pass on unfixed code by design.

**Eleven mutations, ten killed, one survivor that is the reason a branch is absent.**

| # | mutation | result |
|---|---|---|
| M1 | delete the veto call in `itemSubjects` | **caught** (10 fail) |
| M2 | drop the same-item guard, so the head subject is subordinated too | **caught** (30 fail) |
| M3 | drop the `also` co-claim exemption | **caught** (1 fail) |
| M4 | widen the exemption to `and` | **caught** (1 fail) |
| M5 | accept a plural head (`item` → `items?`) | **caught** (1 fail) |
| M6 | drop the legacy field-one branch | **caught** (1 fail) |
| M7 | drop the `parts.length < 3` guard | **caught** (crash, non-zero exit) |
| M8 | drop `RELEASED` from the head alternation | **caught** (2 fail) |
| M9 | drop `TAKING` from the head alternation | **caught** (1 fail) |
| M10 | drop the `**` emphasis prefix | **caught** (1 fail) |
| M11 | re-add `RELEASING` to the alternation | **SURVIVED — reported, and it is why `RELEASING` is not in the code** |

**M11 is the point of the table, not an embarrassment in it.** `RELEASING` opens zero
declarations on the real register, so nothing can constrain it; a mutation adding it changes
no verdict. An alternative no test on this register can constrain is one a mutation deletes
and survives, which is the tell an earlier item recorded for `no longer claimed`. The three
alternatives that *are* in the pattern each earn their place by measurement: `RELEASED`
opens 142 declarations and frees 46 of the 115, `TAKING` opens 3 and frees 1, and the `**`
emphasis is worth 2. Each is pinned by a case built from a real register line.

**M5 survived a first draft and the FIXTURE was replaced, not the code.** The plural-head
case originally stopped at the head (`items 60, 85, and 91 · DEPLOY VERIFIED`), and with no
later `item <id>` on the line there was nothing for the rule to subordinate — the case
asserted nothing and survived every mutation of the restriction it was named for. The real
line 317 *does* carry one: it names `item 85` again 1.5kB later, and under the widened
pattern the head declares 60 and 85 is freed — a false pass on an id the line genuinely
holds. The fixture now carries that tail and the mutation is caught by real text.

**One assertion was wrong about existing behaviour and was corrected rather than forced.**
A draft asserted that the plural line holds all three of 60, 85 and 91. It does not, and
never did: `ITEM_SUBJECT` keys on the literal word `item`, which sits in front of `60` and
nowhere else on that line. That is a real gap, it is **not** this item's, and closing it
would *add* held ids — the false-pass direction. It is recorded in the suite and in Known
Gaps rather than fixed here.

**The exemption is counted, not invented.** Over 2,079 register lines, `also item <id>`
occurs **exactly once** — `· also item 25 · CLAIMED`, the one line in the whole register
that declares one subject at its head and genuinely takes a second id — while `and item
<id>` occurs four times and is narration in all four. So the exemption is the single
adjacent word `also`, and deliberately not the claim verb beside it, because the register
writes affirmative `claimed` inside narration too (`in the live file list of item 883
(claimed 2026-09-23T04:04:23Z, PR #8318 still OPEN)`).

**Movement on the real operator register, in both directions.** 81 lines change hands:
**115 occurrences held → free, and 0 free → held.** The direction is structural rather than
lucky — this veto only ever removes an id from a line's subjects. Every one of the 110
foreign occurrences under a singular head was read individually: 109 are narration and 1 is
the genuine second claim above, which is preserved.

The gate's verdict on the live reproduction moves from `held-by-another` to `take` for
items **26, 1 and 76** — the three items that were held by narration alone, so that no run
was working on them and no run could take them. Item `T-724` itself, genuinely claimed,
still returns `held-by-another` on the same register in the same run: the negative control.

Gates: `npx eslint` on both changed files exit **0**. `NODE_OPTIONS=--max-old-space-size=6144
npx tsc --noEmit --pretty false` exit **0** with zero diagnostics, judged by exit code rather
than by grepping its output, and with `tsconfig.tsbuildinfo` removed first.

## Rollout Plan

Merge to `main` via squash. The change is a Node script used by agents from a checkout; it
has no runtime surface, no image, no migration and no flag. The repo-owned ACA deploy
workflow will build and deploy the merge commit as it does for every merge, and the runtime
invariant will be proven for that run, but no product behaviour changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`
- Shared runtime mutators: **none** — this change makes no Azure call
- Approved image digest: whatever the repo-owned workflow produces for the merge commit
- ACA runtime invariant: proven for the merge run as usual; unchanged by this diff
- Worker image invariant: unchanged
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — no product surface is touched

## Rollback Plan

Revert the single commit. No migration, no data, no flag, no image pin to unwind. The
control returns to its previous verdicts immediately for any agent that pulls the revert.

## Audit Evidence

- The PR and its checks.
- The red/green/mutation numbers in the QA table above, each reproducible with
  `node scripts/exec/register-time-authority.test.mjs`.
- The before/after verdicts of
  `node scripts/exec/register-time-authority.mjs --preclaim --item <id> --file <register>`
  on the operator register, which is not in this repository.

## Known Gaps

- **A line that declares a subject and then genuinely takes a second id without writing
  `also` now reads the second as narration.** One line in 2,079 has ever taken a second id
  and it writes `also`; the sanctioned helper composes one item per line and cannot produce
  the shape at all. Stated rather than left implicit.
- **Ids not adjacent to the literal word `item` have never been subjects and still are
  not.** On `items 60, 85, and 91` only `60` is read. That is a separate gap in the opposite
  direction — closing it adds held ids — and it needs its own measurement. Not filed for an
  id here because the band rule needs an owner decision (below).
- **The path dimension is untouched.** The file half of the gate has its own reader with its
  own measurement; widening two dimensions in one change would make neither movement
  attributable. It is already filed as **T-725** and is not claimed by this run.
- No signed-in acceptance is claimed, and none is owed — this change has no product surface.
