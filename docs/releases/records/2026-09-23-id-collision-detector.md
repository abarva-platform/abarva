# 2026-09-23-id-collision-detector — item id collision detector for the execution toolchain

## Release ID

`2026-09-23-id-collision-detector`

## Status

`candidate`

## Plain-English Summary

Work items in the execution toolchain are identified by a short id. Two automated
runs working at the same time can each reach for "the next free number" and each
get the same one, and the backlog then carries one id introduced by two unrelated
findings. Anyone citing that id afterwards cannot be understood without also
naming which of the two they meant.

This adds `scripts/exec/id-collision.mjs`: a local command that reads the backlog
and reports every id introduced more than once, with both line numbers and both
subjects, and — reading the claim register as well — whether anyone is holding
such an id right now. An agent runs it before filing or claiming, the way it
already runs the pre-claim ownership check.

**It is a detector, not an allocator, and the split is deliberate.** Handing out
ids safely across runs that overlap is a coordination problem. Noticing that one
id carries two findings is a file read, and the file is already on disk by the
time it matters.

**Two corrections to the item this closes, both measured before any code.**

1. The item was filed as "nothing detects a duplicate item id". That is false.
   `build-source-board.mjs` has carried a collision detector for longer than the
   item has existed; it is not quiet, printing a count, a percentage and a trend
   line on every run, and on the live backlog it reports 59 collisions among 434
   ids. It names none of the ones that actually happened. Probed against its own
   parser, two of the three ids have **zero** definitions in it — invisible, not
   misclassified. Two structural causes: it accepts a table only when the first
   header cell is literally `#`, and 22 headers on disk are written
   `id | finding | lane | status`; and it requires a level-three heading, where
   those filings are level-two. A report loud enough that nobody notices what it
   cannot see is the failure mode this toolchain exists against, reached from a
   new direction. That is why this is a second reader rather than a patch to a
   parser whose other consumers depend on its current behaviour.

2. The item says to prove the work on three real collisions on disk. **Only two
   are on disk.** The third id's second filing was renumbered away before the
   file ever recorded it, so a detector reporting it would be reporting history
   it cannot see. The behavioural suite asserts that absence explicitly rather
   than leaving it in a comment.

A third live collision the existing detector also misses was found while
measuring, and is covered by the suite.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only execution tooling. No
product layer is touched.

- **Layer 1 — client intake:** unchanged.
- **Layer 2 — source adapters:** unchanged.
- **Layer 3 — canonical model:** unchanged. No schema, migration, read model,
  tenant registry, RLS policy or governed dataset is touched.
- **Layer 4 — products:** unchanged. No route, component, API handler or prompt
  is touched.

Files changed are `scripts/exec/*` and one CI workflow that runs a behavioural
suite. Nothing this release adds runs in any request path.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — repository execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/id-collision.mjs` — new. Reads the backlog and, optionally, the
  claim register; reports duplicate filings and live holds on ambiguous ids.
  Exits 1 when it reports anything, 0 when it does not, 2 when an input is
  missing. Entry-guarded through the shared `isDirectInvocation` predicate.
- `scripts/exec/id-collision.test.mjs` — new. 69 behavioural cases.
- `.github/workflows/execution-queue-toolchain.yml` — one appended step running
  that suite. The detector itself is **not** wired into CI; see Known Gaps.
- `scripts/exec/README.md` — how to run it, what it is not a replacement for,
  and how a reported collision is resolved.

No repository file outside `scripts/exec/` and that one workflow is modified.

## QA / Validation

Baseline and result are measured over the same scope, against
`origin/main` `d2dce9f805e67292026bdb1312ccaaae7c23748d`.

**Red first, against a reader stripped back to the status quo.** The module was
copied and reduced to the sibling reader's behaviour — level-three headings
only, `#` header cells only, no section governance, prefix-only status
vocabulary — and the suite run against it unchanged: **43 passed, 20 failed.**
The twenty include both real-corpus cases, which is the item's own acceptance
replayed rather than described. Against the shipped reader: **69 passed, 0
failed, 0 skipped.**

**On a runner, where the operator documents do not exist: 59 passed, 0 failed,
3 skipped.** Skips are counted and printed separately, so a skipped case can
never be mistaken for a passing one.

**Sibling suites in the same directory, before and after, all green both sides:**

| suite | before | after |
|---|---|---|
| `append-claim` | 50 / 0 | 50 / 0 |
| `build-execution-queue` | 140 / 0 | 140 / 0 |
| `build-source-board` | 23 / 0 | 23 / 0 |
| `cli-entry` | 20 / 0 | 20 / 0 |
| `queue-provenance` | 30 / 0 | 30 / 0 |
| `register-time-authority` | 258 / 0 | 258 / 0 |
| `toolchain-manifest` | 17 / 0 | 17 / 0 |
| `worktree-retention` | 22 / 0 | 22 / 0 |

560 passed / 0 failed before, 629 / 0 after.

**Seventeen mutations, seventeen caught**, each one first checked to have
actually changed behaviour — a no-op mutation reads exactly like a coverage gap.
Three survived a first measurement and are the part worth recording:

- Removing the rule that resets section state at each heading survived because
  the fixture written for it gave the later filing a heading of its own, which
  keeps it visible by a different route. The shape that distinguishes it is a
  **row-only** filing after a closure; on the live backlog, leaving that state
  set loses five real collisions.
- Reading the id by text rather than by position survived because every fixture
  put the id where both readers agree. On the live backlog that mutation invents
  27 filings and three collisions, one of them on the number `2026` — lifted out
  of a date in a heading.
- Removing the rule that a blank line ends a table survived because the case
  asserted on grouped filings, and the grouping collapsed the difference. A
  second guard absorbing the first is how a survivor reads as coverage; the case
  now asserts on occurrences.

**One guard was deleted rather than covered.** A filter for a table's `|---|`
rule row changed nothing under mutation, on the corpus or in the suite, because
that row is neither an id nor a header cell and the two checks after it already
reject it. A guard that cannot fail is removed here, not kept for comfort.

**Cross-checked against an independent reader**, on the operator backlog as it
stood at 2026-09-23T11:20Z. **39 of the 42** collisions this detector reports are
also reported by `build-source-board.mjs`, which parses the same file by an
entirely different route — strong corroboration, since neither reader was written
from the other. The remaining three are the two live collisions that reader cannot
see, plus a third found while measuring. Twenty of the 59 ids it reports and this
one does not were sampled seven at a time: all seven inspected are status-update
chains, not competing findings.

These counts are of a document that other runs append to, so they are a
measurement at an instant, not an invariant. The suite asserts on the specific
ids, which do not move.

**Also measured and reported honestly:** pinned to the instant a claim was
actually held, the register replays a live hold on an ambiguous id; run against
the present moment, that hold is correctly cleared by the release line that
followed it. The first cut of that check reported the hold as still live because
a release was skipped rather than treated as clearing it — found by measurement,
repaired, and covered by a case.

- `npx eslint scripts/exec/id-collision.mjs scripts/exec/id-collision.test.mjs`
  — exit 0, no findings.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit 0, zero diagnostics.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

## Rollout Plan

Merge to `main`. No runtime rollout. No image build is required by this change
and no Azure Container App template, revision, traffic weight, environment
variable, secret, scale rule or worker job is touched. The repo-owned main
deploy workflow will run on merge as it does for every commit; this release does
not depend on it and asserts nothing about it.

## Deployment Authority

- Repo-owned deploy workflow: not exercised by this change.
- Shared runtime mutators: **none**. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: not applicable; nothing here reaches a container.
- Worker image invariant: not applicable.
- Feature/env flag update path: none; this change introduces no flag.
- Live signed-in proof required: **no**, and none is claimed. Nothing in this
  change is reachable from any signed-in surface.

## Rollback Plan

Revert the merge commit. The change adds two files and appends one CI step and
one README section; nothing reads the new module at run time and no state is
written anywhere by it, so a revert restores the previous behaviour completely
and immediately. No migration, no data, no cache, no flag to unwind.

## Audit Evidence

- PR URL: recorded on the pull request for this branch.
- CI: the `execution-queue-toolchain` workflow, step
  `Run the item id collision detector contract`.
- Red-first evidence: 43 passed / 20 failed against the stripped reader, 69 / 0
  after, both reproducible by reducing the module as described above.
- Mutation evidence: 17 mutations and their per-mutation suite results, in the
  QA section and the PR body.
- Local reproduction of the two real positives:
  `node scripts/exec/id-collision.mjs --operator-root "$HOME/Downloads"`, which
  exits 1 and prints both filings of each colliding id with line numbers and
  subjects. The operator documents themselves are not in this repository and are
  not quoted here.

## Known Gaps

- **The detector is not a CI gate, deliberately.** Its subject is an operator
  document outside this repository. A control taking its truth from a file the
  pull request never saw cannot fail, which is the exact shape this toolchain
  keeps removing. It is agent-invoked and its refusal is advisory. Only its own
  behavioural suite runs in CI.
- **Nothing allocates ids.** This reports a collision after it exists; it does
  not prevent one. Preventing it needs coordination between overlapping runs and
  is a larger change than this item.
- **One half of the item's cross-document ask is not built, and was removed
  after measurement rather than left half-working.** "Every id appearing in the
  backlog under one subject and in the register under another" was implemented
  as "claimed but never filed" and produced 48 entries, essentially none of them
  a defect: the register names items from the Source board and the scope document
  as well, so an id filed elsewhere reads as unfiled here. Deciding it properly
  needs those two documents; deciding it by comparing free-text subjects needs a
  similarity threshold whose error rate cannot be measured against anything.
- **The two readers of this backlog now both exist and disagree by 20 ids.** All
  20 appear to be the older reader reporting a status-update chain as a collision; seven
  were inspected individually and none was a competing finding. Reconciling them
  was deliberately not attempted here, because changing the older reader changes
  what promotes a lifecycle stage.
- **The status vocabulary is a list, and a list can go stale.** It was censused
  from the corpus rather than guessed, and it is bounded by being anchored to the
  start of a title, to a date, or to a position behind a semicolon. A filing
  whose heading opens with a status word it does not know would still be read as
  a filing, which is the safe direction; a filing whose heading opens with one it
  does know would be missed, which is not. No such heading exists on the corpus
  today.
