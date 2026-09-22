# 2026-09-22-execution-claim-subject-grammar — Read the subject of a claim-log release line

## Release ID

`2026-09-22-execution-claim-subject-grammar`

## Status

`candidate`

## Plain-English Summary

The internal two-lane execution register is an append-only log. Each line names the
work item it is about, and a generator reads the log to decide which items are held
by an agent, which have expired, and which have been released. It recognised two ways
of naming the subject: `item <id>` and `CLAIM(ED) <id>`.

The log also writes a third form, where the subject leads the sentence beside the
verdict and carries no `item` prefix — `RELEASED T-005 | MERGED PR #8013 | …` or
`T-503 MERGED+CLOSED b1a7db782 (PR #8049) | …`. The generator could not see that form
at all. When such a line also mentioned a different id later under the recognised
grammar, the whole line was attributed to the mention; when it did not, the line
resolved to nothing and the release it announced was never recorded.

Measured over the 1,188 timestamped lines in the log: 928 resolve under the two
established grammars, 76 of the remaining lines carry a `RELEASED` or `MERGED` token,
and on 53 of those a subject id sits directly beside the verdict. Those 53 are 53
distinct items whose release or merge the register wrote and the generator could not
read. The other 23 name no subject at all — wave announcements carrying only PR
numbers and commit SHAs — and are deliberately left unresolved, because inventing a
subject for a line that names none is how a release gets attributed to an item nobody
released.

This change adds the third grammar as a candidate in the contest the parser already
runs, and changes nothing else. The subject is still whichever grammar is written
**first** on the line. That matters: a claim line routinely narrates another lane's
release in a parenthetical, and there the claimed item — written first — is the
subject. Giving the new form outright precedence would make such a line release work
another lane is still holding, which is the exact collision the register exists to
prevent.

The change is confined to an internal operator tool. No product surface, route,
tenant dataset, schema, or runtime behaviour is touched.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operational tooling — the
generator that renders the internal execution queue from the operator register. It is
not a shared product behaviour, so it is not `global-control-lane`; it reads no tenant
data, so it is not `client-data-lane`; it ships no route or demo artifact, so it is
neither `public-demo` nor `experimental`.

- **Layer 1 (Client intake)** — not touched.
- **Layer 2 (Source adapters)** — not touched.
- **Layer 3 (Canonical model)** — not touched.
- **Layer 4 (Products)** — not touched. No Home, Tower, Moves, Source, Intelligence,
  Learn or Pricing surface reads this script.

The change is entirely inside `scripts/exec/`, an internal build-time operator
toolchain that renders a work queue from operator documents. It runs in CI and on an
operator's machine; nothing in the deployed image imports it.

## Client Applicability

- All clients: none — no client-visible behaviour changes.
- Specific clients: none.
- Internal only: yes. Internal execution-register tooling only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — `parseClaimRecord()` now runs a
  first-written-wins contest across three named grammars (`RELEASE_SUBJECT`,
  `ITEM_SUBJECT`, `CLAIM_SUBJECT`) instead of a two-grammar `??` chain. The new
  `RELEASE_SUBJECT` is anchored to the verdict token, matches `[A-Z]-\d{3}` only, and
  is not a scan for an id anywhere on the line — that looser move is what produced
  the defect item T-545 repaired, where every id mentioned in passing became a
  candidate subject. Bare digits are excluded because a merge line is full of numbers
  (`MERGED PR #8013 SHA 57331dc6c`) and none of them is an item.
- `scripts/exec/build-execution-queue.test.mjs` — four behavioural cases (21a–21d).

## QA / Validation

All counts are from the same command over the same scope, `node
scripts/exec/build-execution-queue.test.mjs`, judged by exit code.

**Red first, on unmodified product code.** The four new cases were added with
`build-execution-queue.mjs` restored from `HEAD`: **105 passed, 2 failed**, exit 1.
Both failures show the defect directly — the subject id renders in the held list and
the released list is empty.

**After the change:** **107 passed, 0 failed**, exit 0.

**Four deliberate mutations, four caught, zero escapes:**

| Mutation | Result |
|---|---|
| Delete the verdict-leads alternative from `RELEASE_SUBJECT` | 106 passed, 1 failed (21a) |
| Delete the id-leads alternative from `RELEASE_SUBJECT` | 106 passed, 1 failed (21b) |
| First-written-wins becomes last-written-wins (`<` → `>`) | 103 passed, 4 failed (20a, 21a, 21b, 21c) |
| Give `RELEASE_SUBJECT` outright precedence (`??` chain) | 105 passed, 2 failed (20a, 21c) |

The fourth is the one worth reading: it proves the precedence choice is load-bearing
rather than incidental, and that a pre-existing case (20a) as well as a new one
guards it.

**Blast radius, measured against the live register rather than estimated.** Over the
same 1,188 timestamped lines, comparing the shipped parser with the new one:

- 1,134 lines resolve to the same id,
- 53 newly resolve (the 53 unreadable releases above),
- 0 stop resolving,
- exactly 1 resolves to a **different** id — `RELEASED T-005 | MERGED PR #8013 SHA
  57331dc6c | … item 126 …`, which now reads as `T-005` rather than as `126`. That is
  the single line the item was filed over, and `T-005` is its subject.

**Neighbouring suite, unchanged and still green:** `node
scripts/exec/register-time-authority.test.mjs` — 27 passed, 0 failed, exit 0.

**Lint:** `npx eslint scripts/exec/build-execution-queue.mjs
scripts/exec/build-execution-queue.test.mjs` — exit 0, no findings.

**CI wiring:** the suite is already named by exact path in
`.github/workflows/execution-queue-toolchain.yml`, so these cases run on every pull
request without new wiring.

**Fixture construction.** Each of 21a–21c puts **two** ids on the line, because a
fixture with one id cannot distinguish a parser that reads the subject from one that
takes whatever id it finds near a verdict. Both ids are asserted in both directions:
the subject moves bucket and the mention does not.

**A correction to the item's own premise, recorded rather than smoothed over.** T-510
filed the scope as one line of 817. That count came from the other bucket — lines
that parse, where the verdict's nearest id is not the parsed one — and T-545's reach
plus intervening-id rule already resolves all 12 of those correctly. The real
population is the lines that parse to nothing, and it is 53, not 1.

**Not claimed:** no signed-in acceptance is owed or performed. No product surface is
reachable from this script, so there is nothing a signed-in session could exercise.

## Rollout Plan

Merge to `main`. No runtime rollout: this script is not imported by the application
and is not part of the container image's serving path. It takes effect the next time
an operator or CI regenerates the execution queue.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as
  it does for every commit to `main`. This change contributes nothing to the image's
  behaviour.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: unchanged by this release; whatever digest the repo-owned
  workflow publishes for the merge commit.
- ACA runtime invariant: to be read back after merge from the deploy run keyed at or
  after the merge SHA — template image digest equal to the 100%-traffic revision
  digest.
- Worker image invariant: not affected. No job image changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is structural rather than a
  judgement call — no route, component or server action imports `scripts/exec/`, so
  no signed-in session can reach the changed code.

## Rollback Plan

Revert the single commit. The change is two files in an internal script directory
with no migration, no data write, no stored state and no flag, so a revert restores
the previous behaviour exactly. The observable consequence of a revert is that the
53 releases become unreadable again — which is the state on `main` today, so a revert
is strictly no worse than not merging.

## Audit Evidence

- Pull request: recorded on merge.
- CI: `execution-queue-toolchain` workflow, step running
  `scripts/exec/build-execution-queue.test.mjs`, expected `107 passed, 0 failed`.
- Red-first evidence: `105 passed, 2 failed` with the parser restored from `HEAD`,
  quoted above with the failing assertion output.
- Mutation evidence: the four-row table above, each row a separate run.
- Blast-radius evidence: the 1,134 / 53 / 0 / 1 split over the live register, quoted
  above.

## Known Gaps

- **23 verdict lines still resolve to no subject, on purpose.** They are wave
  announcements naming only PR numbers and commit SHAs (`RELEASED parallel wave · PR
  #7855 …`) plus two lines using id shapes the register does not otherwise write
  (`item 48a`, `item D2/D5`). No grammar can attribute those without guessing, and a
  guess here attributes a release to an item nobody released. Case 21d pins that they
  stay unresolved.
- **The 53 newly-readable releases are historical.** This change makes the register's
  own past words readable; it does not retroactively verify that each of those 53
  items was in fact finished. An id moving into the released list means the register
  says it was released, which is what the list has always meant.
- **The letter-prefixed id shape only.** The new grammar matches `[A-Z]-\d{3}`. The
  older bare-numeric ids (`item 126`) are still read only through the `item` and
  `CLAIM` grammars. No live line writes a bare numeric id in the subject-leading form,
  so widening it would add risk against no measured case.
