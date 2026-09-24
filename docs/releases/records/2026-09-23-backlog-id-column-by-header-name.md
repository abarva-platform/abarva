# 2026-09-23-backlog-id-column-by-header-name — read the operator backlog's id column by its header name

## Release ID

`2026-09-23-backlog-id-column-by-header-name`

## Status

`candidate`

## Plain-English Summary

The generator that builds the execution board and the claimable work queue reads work items out of
markdown tables in the operator's backlog document. It decided whether a table row was an item by
testing whether the first header cell was the literal character `#`. The backlog does not use one
header shape: rows also sit under `Id | Finding | Lane | What it needs`, `Id | Finding | Lane |
Status`, `Item | What | Lane | Acceptance` and `Id | What is wrong | Lane | Acceptance`. Every row
under one of those shapes was discarded before anything counted it.

Two consequences, both measured rather than argued:

1. **Work nobody could see.** The generated queue is the file an agent is told to read to find its
   next item. Twenty-nine real items never reached it, so four of them were open, unclaimed work in
   a lane whose agents were reading "your lane has nothing claimable" and falling back to
   lower-value work. After this change that lane is offered four items it could not see before.
2. **A completeness claim over the wrong population.** The generator already reported ids it could
   not place on its structure map, and that report was computed from the ids it had parsed — so
   "could not place: 0" was true over exactly the population that was not missing. The census in
   the generated queue opened at a number that had already been reduced, with no row saying so.

So the reader now takes the id from the column whose header names it (`#`, `Id`, `Item`) and the
kind from a list of the conventions the document actually uses. It also counts the ids sitting in
item position **independently of that reader** and reports the difference: four ids remain in a
heading shape it does not parse, and they are now named on the generator's output, in its summary
and in the generated queue, instead of being absent from every count. A header shape whose kind
nobody has listed is likewise named rather than silently read or silently dropped, so the next new
convention costs a line of output instead of another twenty-nine items.

Widening which column holds the id deliberately did **not** widen which tables are items. A
numbered `# | Mutation | Failing cases` table is not a backlog table; read as one it previously
collided with four of the oldest item ids and suppressed three lifecycle stages. That protection is
now an explicit whitelist of conventions with a test of its own.

Twenty ids newly visible to the reader are also placed on the platform track of the repo-owned
structure map, because every already-placed sibling in their series sits there. Seven are left
unplaced on purpose: their placement is a stage-or-capability judgment, they are named in the
generated queue, and the generator's existing unplaced-id status continues to report them.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operations tooling. No client-facing surface.

- **Layer 4 (products):** none. No product surface, route, component, tenant dataset, migration or
  runtime path changes. Nothing here runs in the application.
- **Operator tooling only:** `scripts/exec/build-source-board.mjs`,
  `scripts/exec/build-execution-queue.mjs` and the repo-owned structure map they read. These
  generate two local operator documents from local operator documents.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — the execution board and claimable queue used to schedule work
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — id column by header name; kind by a whitelist of item
  conventions; unrecognised kinds named; an independent scan of ids in item position and the
  residual it implies, emitted to stdout and to `source-board-summary.json`.
- `scripts/exec/build-execution-queue.mjs` — the residual rendered as the first row of the census,
  named in prose, with an absent field rendering as `not recorded` rather than as zero.
- `scripts/exec/source-stage-map.json` — 20 ids placed on the platform track.
- `scripts/exec/build-source-board.test.mjs` — 7 new behavioural checks.
- `scripts/exec/build-execution-queue.test.mjs` — 4 new behavioural checks; two existing checks
  updated to locate a census row by its label rather than by its index, which is what their own
  comment already required.

## QA / Validation

Measured against a clean baseline over the same scope, both suites run as child processes against
real fixture documents.

| suite | before | after |
|---|---|---|
| `node scripts/exec/build-source-board.test.mjs` | 35 passed, 0 failed | 42 passed, 0 failed |
| `node scripts/exec/build-execution-queue.test.mjs` | 171 passed, 0 failed, 2 skipped | 175 passed, 0 failed, 2 skipped |

Red first: the three shape checks, both residual checks and the population-agreement check failed
before the change (6 failing, reported as "on the board=false" and "residual=null"), which is the
defect and not a fixture artefact.

**Six mutations, each reverting one half of the fix, each caught:**

| mutation | failing checks |
|---|---|
| id column back to the literal `#` | 4 |
| accept every table kind (drop the mutation-table protection) | 1 |
| measure the residual from the reader's own output instead of independently | 3 |
| render the residual row only when it is non-zero | 2 |
| read an absent `unparsedItemIds` field as zero | 1 |
| count the residual ids without naming them | 1 |

Rest of the toolchain, unchanged and green: `queue-provenance` 30, `append-claim` 61, `cli-entry`
34, `toolchain-manifest` 17, `id-collision` 70, `fossil-claims` 78, `worktree-retention` 22,
`register-time-authority` 290 — all 0 failed.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
diagnostics.

**Live corpus, both generators executed over a copy of the operator documents:**

| measurement | before | after |
|---|---|---|
| ids in item position, scanned independently | 474 | 474 |
| ids the reader parsed | 441 | 470 |
| dropped with no report of any kind | 33 | 0 |
| named as a shape the reader cannot parse | 0 | 4 |
| unplaced on the structure map, named | 3 | 7 |
| rows the queue offers | 4 (one lane) | 8 (two lanes) |

The four rows a whole lane could not previously be offered are `T-555`, `T-717`, `T-718` and
`T-732`. The board's population is a strict subset of the independent scan in both directions
before and after — zero ids on the board that the scan does not find.

## Rollout Plan

Merge to `main`. No runtime rollout: these scripts are run by hand from a checkout and write two
local operator documents. No image build, no Container App revision, no migration, no flag.

## Deployment Authority

Not applicable — no Azure Container Apps, image, flag, env var, worker job, traffic or DNS surface
is touched by this change.

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image changes
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no signed-in surface changes

## Known Gaps

- **Four ids are still in a shape the reader does not parse** — `49`, `T-742`, `T-743`, `T-745`. The
  `## Item <id>` heading-with-no-item-table shape is a separate open backlog item, deliberately not
  fixed here. This change makes those ids visible in three places instead of absent from every
  count; it does not parse them. `49` is a different thing again: it is the upper endpoint of an
  `## Items 47–49` range heading whose third member was never written, so the honest answer is to
  name it rather than to invent an item for it.
- **Seven ids remain unplaced on the structure map** — `C-501`–`C-506` and `D-511`. Their sibling
  ids sit on lifecycle stages rather than on the platform track, so placing them is a
  stage-or-capability judgment this change does not make. They are named in the generated queue and
  in the generator's own unplaced-id status. The generator's pre-existing non-zero exit on unplaced
  ids is unchanged in kind: it already exited non-zero for three ids before this change.
- **The independent scan shares the table-shape rule with the reader.** It is independent of the
  reader for heading shapes, which is where the residual comes from today, and it is not an
  independent reimplementation of the table rule. A table convention nobody has listed is therefore
  reported through `unrecognisedItemTableKinds` rather than through the residual — a named shape,
  not a silent drop, but a human still has to read it.
- **Not verified:** nothing about a deployed runtime, because nothing here reaches one.

## Rollback Plan

Revert the commit. The generators are regenerate-on-demand, so the next run of the previous version
rewrites both documents; nothing persists between runs and no state migrates.

## Audit Evidence

- The PR, its diff and the CI run for `execution-queue-toolchain`, which runs both suites.
- The before/after census rendered in the generated queue, quoted in the table above.
- The six mutation results above, reproducible by applying each mutation and running the suite.
