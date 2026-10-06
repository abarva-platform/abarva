# 2026-09-23-t737-lane-read-from-the-named-column — The lane comes from the named column

## Release ID

`2026-09-23-t737-lane-read-from-the-named-column`

## Status

`candidate`

## Plain-English Summary

The execution queue partitions claimable work by lane and every agent is told to
take the first unclaimed row in its own lane. That lane was read from the
**third cell** of whatever table the row sat in.

The backlog carries two item conventions and they do not agree about what sits
in the third cell. `# | Item | Lane | Acceptance` puts the lane letter there.
`# | Verdict | Proof` — the outcome convention, which has no lane column at all
— puts the **proof sentence** there. Measured on the live corpus at
`origin/main` `7c321a682`: **454 rows** are the first shape and **236** the
second, and **35 of the 422 items** on the board therefore carried a "lane"
that was a merge SHA, a regex fragment, `...`, or a whole paragraph.

The queue sends a lane it does not recognise to `Lane ? — unassigned lane`. No
lane's "take the first unclaimed row in your lane" reaches that section, so an
item in it is offered to nobody.

The lane is now resolved from the column the header **names**. A verdict row
contributes no lane, and the next definition of that id supplies it. Absent
beats wrong: an item with no lane is visibly unassigned, an item whose lane is a
sentence is invisibly unassignable.

Separately, and deliberately **not** resolved: **33 items declare a lane letter
that contradicts their own id prefix**, which under the forward-only identifier
rule is the lane. Which side is wrong is a per-row filing call and the live rows
go both ways — one filing of a twice-filed id is a UI surface carrying a `T-`
number, another is register work carrying a `D` cell. Picking one silently is
what produced the state being reported, so the generator now **reports every
contradiction by name** and changes no routing on that half.

## Layer Impact

Release lane: `internal-admin` — an AbarVa-only operations capability. Platform
tooling only. No product layer is touched: not client intake, not the source
adapters, not the canonical model, not any of the seven products. Nothing under
`src/` changes, and no runtime, route, schema, migration, job, prompt, flag or
env var is affected.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — an operator generator and its behavioural suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-source-board.mjs` — **modified.**
  - `laneCell(header, cells)` — new. The declared lane of a row, read from the
    column its own header names `Lane`; `""` when the table has no lane column,
    which is the whole of the `# | Verdict | Proof` convention.
  - `lanePrefixOf(num)` — new. The lane a lane-prefixed id declares about
    itself; `""` for a historical bare number, which declares nothing.
  - `laneContradictions` / `laneUnusable` — new report fields, printed on stdout
    and written into `source-board-summary.json`. Computed over **every** id,
    mapped or not, so an id the queue cannot offer yet still shows its state.
- `scripts/exec/build-source-board.test.mjs` — **modified.** Five new
  behavioural cases and two fixture helpers (`addVerdictRow`,
  `addBacklogItemInLane`). Every assertion is on a real child process and on
  what the generator wrote into the summary or printed, for a fixture id.

### What moved on the live corpus

Same walk over `source-board-summary.json`, before and after, 422 items both
sides:

| lane field | before | after |
|---|---|---|
| a lane letter | 382 | 387 |
| empty | 5 | 22 |
| **not a lane at all** | **35** | **13** |

Seventeen items moved from a proof sentence to no lane; five recovered the lane
they had actually declared. The 13 that remain are rows whose `Lane` cell
genuinely holds something else, because an unescaped `|` inside a code span
shifts the row's cells — a separate defect, reported now rather than routed on,
and **not** fixed here.

**The claimable set is unchanged: 9 before, 9 after.** `T-458` still prints
under `### Lane D`; its `D` comes from a real four-column row, not from a proof
cell, so this change does not move it and no such claim is made. What changed is
that it is now named in the contradiction report instead of being routed on in
silence.

## QA / Validation

**Red first, over the same scope.** `scripts/exec/build-source-board.test.mjs`
on the generator at `origin/main` `7c321a682`: **24 passed, 3 failed** — the
three new defect cases fail and the new guardrail case passes, which is the
point of including it. With the fix: **28 passed, 0 failed**.

**Mutation check: five deliberate breakages, five caught.**

| # | mutation | caught by |
|---|---|---|
| M1 | `laneCell` reads position 2 again | "a verdict row's Proof cell is not read as the item's lane" + "a declared lane is not shadowed by a verdict row that precedes it" |
| M2 | `laneCell` always returns `""` | "a four-column item row still yields its declared lane" + 2 more |
| M3 | `lanePrefixOf` never recognises a prefix | "an id whose declared lane contradicts its own prefix is reported by name" |
| M4 | the contradiction filter reports every lane, agreeing or not | the same case, on the half that asserts the agreeing id is **not** named |
| M5 | the `KNOWN_LANES` guard is dropped from the contradiction filter | "a lane cell that is not a lane is reported as unusable and not as a contradiction" |

M5 **survived** the first four cases — 28 passed, 0 failed under the mutation —
and case 27 was written for it. That is recorded rather than tidied away: a
guard no case can fail is the shape this directory exists against, and the only
reason it was found is that every guard was broken on purpose.

**The rest of the directory's contract, same scope, both sides.** Nine
pre-existing suites in `scripts/exec/`, on `origin/main` `7c321a682` and again
on this branch:

| suite | on `origin/main` | on this branch |
|---|---|---|
| `append-claim` | 50 / 0 | 50 / 0 |
| `build-execution-queue` | 167 / **2** | 167 / **2** |
| `cli-entry` | 19 / 0 | 19 / 0 |
| `fossil-claims` | 70 / **1** | 70 / **1** |
| `id-collision` | 70 / 0 | 70 / 0 |
| `queue-provenance` | 30 / 0 | 30 / 0 |
| `register-time-authority` | 258 / 0 | 258 / 0 |
| `toolchain-manifest` | 16 / **1** | 16 / **1** |
| `worktree-retention` | 22 / 0 | 22 / 0 |

The four failures are **identical on both sides and pre-existing on `main`** —
they are not caused by this change and are not repaired by it. They appear only
against the live operator documents; on this PR's own runner the same suites
report `166 / 0 / 1 skipped` and `68 / 0 / 3 skipped`. All four have one cause
and it is named under Known Gaps.

- `node scripts/exec/build-source-board.test.mjs` → `28 passed, 0 failed`
- `npx eslint scripts/exec/` → exit 0
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → judged by exit code
- `node scripts/release-check.mjs --base origin/main --head HEAD` → exit 0
- The real board and queue regenerated from the live operator documents on both
  generators, and the operator root left carrying a **repo-owned** provenance
  stamp (`sha256 773b13369784`) so no sibling run is stranded by a queue this
  branch wrote.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` changes, so the
deployed image's behaviour is unchanged. The repo-owned ACA workflow builds and
deploys the merge commit as it does for every merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` mutation of any kind.
- Approved image digest: n/a — no runtime behaviour changes.
- ACA runtime invariant: proven post-merge from the deploy run at or after the merge SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, structurally — no file under `src/`
  changes, so no signed-in surface can differ.

## Rollback Plan

Revert the PR. The generator returns to reading position 2 and the two report
fields disappear from stdout and from the summary. Nothing consumes those fields
yet, so nothing else breaks; the queue's lane partition returns to its previous
answers, which for today's nine claimable rows are the same answers.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `exec/t-737-lane-column-authority`.
- The `Execution queue toolchain` check, which runs this suite.
- The before/after tables above, both reproducible: the row-shape census by
  re-parsing the live backlog, the lane distribution by the same walk over
  `source-board-summary.json` on each generator.
- The mutation table above; each row reproducible by applying the named
  breakage to `scripts/exec/build-source-board.mjs` and re-running the suite.
- The operator claim register line for item `T-737`, appended through the T-708
  gate wiring, pre-claim verdict `take`.

## Known Gaps

- **The 13 remaining unusable lanes are not repaired.** Their `Lane` cell holds
  a regex fragment or a sentence because an unescaped `|` inside a code span
  shifts the row's cells — a markdown-table parsing defect in its own right.
  This change makes them visible and stops routing on them; it does not fix the
  cell splitting. Filed separately rather than absorbed here.
- **The 33 lane/prefix contradictions are reported, not resolved.** That is the
  deliberate half. Resolving them means deciding, per row, whether the id or the
  cell is wrong, and that is an owner call — the live rows go both ways.
- **The report is not a gate.** It prints and it writes a summary field; nothing
  fails on it. Making it fail would break the board for everyone over 46
  pre-existing rows, which is the pattern of a gate that arrives already
  failing. What a gate could honestly hold is the *rate*, and that decision is
  not taken here.
- **Four suites in `scripts/exec/` fail against the live operator documents
  right now, for one cause, and this change neither causes nor fixes them.**
  `build-execution-queue` (2), `fossil-claims` (1) and `toolchain-manifest` (1,
  which runs the queue suite as its acceptance) all assert that the **live**
  operator register still contains at least one suppressed candidate to replay —
  "the live corpus has suppressed candidates to replay, so this case is not
  vacuous". It no longer does: the bucket was emptied earlier the same day by
  the work those suites exist to prove.

  **The runner's own result, quoted rather than inferred** — this PR's
  `Execution queue behavioral contract` job, run `35886749393`:
  `build-execution-queue` **166 / 0 / 1 skipped** against **167 / 2** locally,
  and `fossil-claims` **68 / 0 / 3 skipped** against **70 / 1**. So the cases do
  not fail where they run; they skip, and the suite is green on a machine that
  cannot see the corpus. That is the more serious half: a case that cannot fail
  where it runs, and fails only where nothing gates it. Filed as its own item,
  with the verdict left to its owner.
