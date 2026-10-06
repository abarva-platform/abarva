# 2026-09-23-t738-escaped-pipe-cell-split — Read a backlog row the way GitHub reads it

## Release ID

`2026-09-23-t738-escaped-pipe-cell-split`

## Status

`candidate`

## Plain-English Summary

The execution board reads its inputs out of markdown tables. It split each row on
every `|` it found, which is wrong: in GitHub-flavoured markdown a backslash-escaped
pipe (`\|`) is ordinary text, not a cell boundary. Any row that quoted a regex, a
shell pipeline or a union type therefore ended its cell early, and every cell after
it landed one or more columns to the left.

Eleven items were affected on the live backlog. The visible symptom was the `Lane`
column, because that is the routing field — those eleven printed a regex fragment or
a shell snippet where a lane letter belongs. The quieter half is that the same rows'
acceptance text was wrong too, and the acceptance is what decides whether an item is
offered as claimable work or held back as blocked on an owner.

This change splits rows the way GitHub does, so the board and a person reading the
same document on GitHub now agree.

It deliberately does **not** implement the rule the item was filed asking for —
"split on pipes that are not inside a backtick span". That rule is not GFM: an
*unescaped* pipe is a cell boundary even inside backticks, which is why GitHub itself
renders four rows of this backlog shifted. Adopting it would have made the board
parse four rows that no other reader parses, and a reader that quietly disagrees with
the document its users see is the failure this generator exists to prevent. Those
rows are malformed at source, so the generator now names them and the repair belongs
in the backlog.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operator tooling. It ships
no client-visible capability and is not feature-gated, because there is no product
surface to gate.

- **Layer 4 — Products:** none. No file under `src/` is touched and no product
  surface can observe this change.
- **Platform tooling:** `scripts/exec/build-source-board.mjs`, the generator behind
  the execution board and the claimable queue. Both of its table parsers now share
  one escape-aware row splitter.

No canonical model, adapter, intake or tenant data is involved.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs`
  - `splitTableRow(line)` — a GFM-conformant row splitter. `\|` is content; a bare
    `|` delimits; backslashes are counted rather than pattern-replaced, so `\\|` is
    an escaped backslash followed by a real delimiter.
  - `hasBarePipeInCodeSpan(line)` — flags the malformed shape, with an explicit
    verdict for an unbalanced span (see below).
  - Both call sites (`tablesUnderHeading`, `backlogTableItems`) now use the splitter.
  - New report line: `bare pipe in a code span: N -> <ids>`.
- `scripts/exec/build-source-board.test.mjs` — cases 28-34.
- `scripts/exec/t738-real-rows.md` — thirteen live backlog rows frozen verbatim.
- This record.

### The unbalanced-backtick verdict, which the acceptance asked to be decided

**A row whose backtick spans are unbalanced is split by the ordinary rule and is not
named as a shifted row.** With an odd number of backticks there is no span to be
inside of, and guessing where the author meant it to close would be inventing
content. The splitter never inspects backticks at all, so this question only reaches
the *report*, not the parse.

Measured over every id-bearing row of the live backlog: **zero** rows are unbalanced.
The branch therefore has no data to hold it and is held by a fixture instead — case
33, which was rewritten once after mutation 6 showed the first version of it could
not fail.

## QA / Validation

All numbers below are over the same scope, with the final test code on both sides.

**Red first, then green.** `node scripts/exec/build-source-board.test.mjs`

| | passed | failed |
|---|---|---|
| final cases against the unfixed generator | 29 | **4** |
| final cases against the shipped generator | 35 | 0 |

**Mutations: six applied, six caught.** Each edits the shipped file, runs the suite
and restores; the harness refuses to score a mutation whose file is byte-identical to
the shipped one, so a no-op cannot be counted as caught.

| # | mutation | result |
|---|---|---|
| 1 | revert both call sites to split-on-every-pipe | 31 / **4** |
| 2 | revert only `tablesUnderHeading` | 34 / **1** |
| 3 | drop the escaped-backslash branch | 34 / **1** |
| 4 | adopt the filed not-inside-a-backtick-span rule | 33 / **2** |
| 5 | never flag a bare pipe in a code span | 34 / **1** |
| 6 | drop the unbalanced-backtick guard | 34 / **1** |

**Three of those six survived the first pass**, and that is recorded rather than
tidied away, because each survival was a case that could not fail:

- **2** survived because the second call site had no case at all — it was being
  changed on faith. Case 34 was written for it. Its first version *also* passed under
  the mutation: the shifted sentence is still on the page, one field to the left,
  rendered as the stage's Owner, so "the board contains it" is satisfied by the
  defect. The case now asserts the destination.
- **3** survived because case 32's fixture put a backtick between the escaped
  backslash and the pipe, so the row never exercised the branch it was written for.
- **6** survived because case 33's fixture had one backtick, and the regex the guard
  protects finds nothing in a string with one backtick either. It now uses three.

**Live re-measurement, isolated.** Both generators run against one frozen copy of the
same four operator documents, so nothing below is confounded by the register moving
under the measurement.

| report | before | after |
|---|---|---|
| `lane cell is not a lane` | **14** | **3** — `#59`, `C-009`, `T-545` |
| `lane contradicts its id` | 33 | **38** |
| `bare pipe in a code span` | (no such report) | **4** — `#22`, `#59`, `C-009`, `T-545` |

The eleven that recover are `T-066` `T-071` `T-423` `T-429` `T-431` `T-455` `T-468`
`T-510` `T-591` `T-705` `U-512`.

**The contradiction count rises by five, and that is the change working, not a
regression.** `T-423` `T-429` `T-431` `T-455` `T-468` all declare lane `C` under a
`T-` prefix. They could not be reported as contradictions before, because their lane
cell held a regex fragment rather than a lane; recovering the letter is what makes
the disagreement visible. Which side of each is authoritative is a per-row filing
call, so the generator reports and does not resolve.

**No routing movement is claimed.** Over the same frozen copy the queue is identical
on both sides: 7 claimable, 195 blocked on Anand, 2 held, 89 expired-idle, 119
expired-in-flight, 6 lapsed, 165 released. Every recovered row sits above rung 0 and
so is outside the claimable funnel.

**Sibling suites — all ten, identical to `origin/main` over the same documents.**

| suite | `origin/main` | this branch |
|---|---|---|
| `append-claim` | 50 / 0 | 50 / 0 |
| `build-execution-queue` | 167 / **2** | 167 / **2** |
| `build-source-board` | 28 / 0 | **35 / 0** |
| `cli-entry` | 19 / 0 | 19 / 0 |
| `fossil-claims` | 70 / **1** | 70 / **1** |
| `id-collision` | 70 / 0 | 70 / 0 |
| `queue-provenance` | 30 / 0 | 30 / 0 |
| `register-time-authority` | 258 / 0 | 258 / 0 |
| `toolchain-manifest` | 16 / **1** | 16 / **1** |
| `worktree-retention` | 22 / 0 | 22 / 0 |

The four pre-existing failures are `T-739`, filed this morning and untouched here:
those cases require the live register to contain a suppressed candidate, it contains
none, and they skip on the runner. Neither caused nor repaired by this change.

`toolchain-manifest` reached 15 / 2 mid-change and the extra failure was mine — see
Known Gaps.

**Typecheck.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` — **exit 0**, zero diagnostics. Judged on the exit code, not on a grep.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA workflow ships every merge; this change
alters no runtime behaviour, so the deploy is incidental to it rather than the point
of it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no Azure command is run by this change
- Approved image digest: whatever that workflow builds from the merge SHA
- ACA runtime invariant: to be proven from the run keyed to the merge SHA, in a
  register addendum. Not asserted here.
- Worker image invariant: unchanged by this release
- Feature/env flag update path: none
- Live signed-in proof required: **no**, as a property of the change — nothing under
  `src/` is touched, so no product surface can differ and a signed-in session would
  have nothing to look at.

## Rollback Plan

Revert the single commit. The generator writes only regenerated artifacts
(`source-board.html`, `source-board-summary.json`, `EXECUTION_QUEUE.md`), none of
which is committed, so a revert followed by one regeneration restores the previous
board exactly. No migration, no data, no runtime state.

## Audit Evidence

- The PR and its CI run
- `scripts/exec/t738-real-rows.md` — the thirteen rows under test, each carrying the
  backlog line number it was frozen from
- The red/green and mutation tables above, reproducible from the suite
- The generator's own report lines, which now name every malformed row

## Known Gaps

- **Two rows stay shifted, by decision:** `C-009` and `T-545` carry a bare pipe
  inside a code span and are malformed in the backlog itself. GitHub renders them
  shifted too. The repair is to escape those pipes in the operator document, which is
  an operator edit and is not made here.
- **`#22` and `#59` are newly named** by the same report. `#22`'s lane cell happens to
  survive, so it was invisible before; its acceptance is shifted.
- **The fixture-copy rule does not see subdirectories.** `copyToolchainInto` takes
  every non-suite *file* beside it and no directory, and `toolchain-manifest.test.mjs`
  runs four suites from such a copy. A fixture placed under `scripts/exec/__fixtures__/`
  therefore crashed `ENOENT` when the suite ran from a copy — measured, 16/1 to 15/2,
  and found by running the siblings rather than by reading. Resolved here by placing
  the file beside the module, which is what that module's own rule already describes.
  **The blind spot itself is not fixed** and is one level down from the defect T-726
  was built to close: the rule that decides what a fixture can see still does not see
  everything the directory holds. Not filed as an item because the Claude Code `T-500`
  to `T-599` band reports 0 of 100 free, which the queue itself calls a range decision
  rather than something to work around.
- **No signed-in acceptance**, and none is owed. See Deployment Authority.
