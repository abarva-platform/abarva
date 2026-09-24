# 2026-09-24-c515-unplaced-track-offers-filed-work — a filed backlog item is offered before its map entry exists

## Release ID

`2026-09-24-c515-unplaced-track-offers-filed-work`

## Status

`candidate`

## Plain-English Summary

The execution board and the claimable queue are generated from two inputs: a set of operator-owned
planning documents, and a repo-owned structure map that says which part of the product each item
belongs to. An item with no entry in that map was **dropped before the queue's pool existed**. It
appeared in no bucket of the generated queue — not as claimable, not as blocked, not as held — so an
agent reading the queue to decide what to work on could not see it at all.

That is not a hypothetical. The board already fails the run and names the ids when this happens, and
the comment above that gate calls the harm by its name: *"An unmapped id is invisible to the queue:
it is not offered to any agent."* Failing the run has not fixed it and structurally cannot, because
**filing an item is a local edit to an operator document while mapping it is a pull request against
this repository** — the two steps come apart the moment an item is filed, and the gate is therefore
red by construction. The queue generator records exactly that in its own notes.

Measured twice on the live corpus on the same day: 17 unplaced ids at 15:50Z (cleared by item
`C-509`), and 12 more eight hours later. On **both** occasions the generated queue offered rows in
one lane only, with zero in the other three, while filed, unclaimed, executable work sat behind the
drop.

This change stops the hiding and nothing else. The board now builds those ids onto a track of its
own — *"Unplaced — filed, not yet on the structure map"* — so they are offered or blocked by exactly
the same rules as every other row, and the queue's census stops counting an id it still offers as an
id it removed.

**What is deliberately not changed.** Whether an unmapped id should *fail* the board is reserved to
the operator, and the queue generator says so in as many words. So the exit code, the stderr line and
the `unmapped` field in the summary are all asserted **unchanged** by the test suite. Mapping is
still owed; the generated queue now says so on its own face, next to the ids, in a paragraph that
also says the work is takeable now. Nothing is placed on a stage or a capability, so no vision or
completion figure moves — measured in both directions rather than argued.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only delivery tooling. It changes no client-facing
behaviour, ships behind no flag, and reaches no tenant.

- **Layer 4 (Products):** none. No byte under `src/`, no route, no component, no rendered product
  surface, no API behaviour.
- **Layer 3 (Canonical model):** none. No tenant data is read or written.
- **Delivery tooling:** `scripts/exec/build-source-board.mjs` and
  `scripts/exec/build-execution-queue.mjs`, the two repo-owned generators that derive the internal
  execution board and claimable queue from operator-owned planning documents.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — internal delivery tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — builds a generator-side `unplacedTrack` from the existing
  `unmapped` set, so defined-but-unplaced ids become items. `mappedNums` is **not** extended, so the
  track cannot make an id read as placed; the track carries no capability and belongs to no stage;
  it exists only when something is unplaced.
- `scripts/exec/build-execution-queue.mjs` — splits the summary's `unmapped` ids by intersection
  with the pool the summary actually carries. The census's removal row, its opening population, its
  `derivedTotal` and its reconciliation now count only the ids the pool does **not** carry. The
  "offered to nobody" sentence is now rendered only for ids that really were dropped; a second
  sentence names the offered ones and states that the map entry is still owed.
- `scripts/exec/build-source-board.test.mjs` — 10 new cases.
- `scripts/exec/build-execution-queue.test.mjs` — 8 new cases, and two `T-745` assertions updated
  (see below).

### Two existing assertions updated, with the reason

Two `T-745` cases read `unmapped.length` as "the number of ids removed from the pool". That was true
only while the board dropped every unmapped id. They now read an intersection with the pool the
board actually wrote.

**This is a strengthening, not a relaxation, and the distinction is load-bearing because a weakening
has the same shape.** The old form used a constant handed over by the board and could not tell a
dropped id from an offered one. The new form fails if the queue counts an offered id as removed
**and** fails if it stops counting a genuinely dropped one — the direction the original case was
written to hold. That direction is proven still reachable by a dedicated compatibility case, which
hand-builds a summary whose pool does not carry the unmapped id and asserts the full original
arithmetic returns.

## QA / Validation

**Clean baseline, same command and same scope on both sides,** taken on a pristine checkout of
`origin/main` `71e1d2cc8` in this worktree before any edit (`git status --porcelain` empty), never
from a stash:

| suite | before | after |
|---|---|---|
| `scripts/exec/build-source-board.test.mjs` | 72 passed, 0 failed | 82 passed, 0 failed |
| `scripts/exec/build-execution-queue.test.mjs` | 184 passed, 0 failed, 2 skipped | 192 passed, 0 failed, 2 skipped |

All 12 `scripts/exec` suites: **979 passed, 0 failed, 4 skipped.**

**Red first, both halves.** Board: 3 failed / 79 passed with the cases added and the generator
unchanged — the three that name the defect, with the seven guardrails already green. Queue: 4 failed
/ 188 passed, being the 3 new census cases plus the one pre-existing `T-745` case whose arithmetic
the board change had already invalidated.

**Eight mutations, eight caught, each by the case written for it.** Every mutation's effect on the
file was confirmed by sha256 before the suite ran, so none is a no-op reading as coverage:

| # | mutation | cases that failed |
|---|---|---|
| 1 | revert the unplaced track entirely | 3 |
| 2 | render the track even when nothing is unplaced | 1 |
| 3 | let the track suppress the `unmapped` report | 6 |
| 4 | stop failing the run once the id is offered | 2 |
| 5 | count every unplaceable id as a removal again (`derivedTotal`) | 1 |
| 6 | drop row counts every unplaceable id again | 2 |
| 7 | stop naming the offered ids | 1 |
| 8 | treat the pool as empty, so nothing is ever "offered" | 4 |

Mutations 1 and 8 are the two that matter most: 1 unwires the production path, because a correct
track the generator never builds is from outside the same as no track; 8 inverts the compatibility
property, and the compatibility case stays green under it while every offered-side case fails, which
is what proves the two are measuring different things.

**Live-corpus measurement, both directions, against one frozen copy of the four operator documents
used for every run on both sides** (`sha256` prefixes `48b614c5`, `a258659e`, `8d833d8b`,
`faa2685e`):

| | before | after |
|---|---|---|
| claimable rows | 3 | 9 |
| lane D | 3 | 3 |
| lane C | **0** | 2 (`C-401`, `C-513`) |
| lane U | **0** | 1 (`U-507`) |
| lane T | **0** | 2 (`T-477`, `T-478`) |
| lane ? (no parseable lane cell) | 0 | 1 (`C-511`) |
| ids dropped before the census table | 12 | 0 |
| census verdict | Reconciled at 513 | Reconciled at 513 |
| board exit code | 1 | 1 |
| ids named unmapped by the board | 12 | 12 |
| vision capabilities covered | 59/59 | 59/59 |
| proof-weighted vision completion | 42.4% | 42.4% |

The 12 newly visible ids reconcile set-wise rather than by total: 4 reach *already has proof*,
2 reach *blocked on Anand*, 6 reach a claimable lane. The census closes in both directions — the same
513 ids the board scanned independently in item position.

`tsc --noEmit` exit **0** with `tsconfig.tsbuildinfo` removed first, judged by exit code, zero
diagnostics. `eslint` exit 0 on all four changed files, zero warnings. `release-check` exit 0.

**No signed-in proof is owed and none is claimed.** The diff has no byte under `src/`, nothing
rendered by the product differs, and a signed-in lane here would be a proof with no subject.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow runs on merge as it does for any
commit; these two scripts are developer tooling and are not part of the served application, so the
deploy carries no behavioural change from this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: recorded against the merge commit after the workflow completes.
- ACA runtime invariant: verified after merge — Container App template image equals the image of the
  sole 100%-traffic revision.
- Worker image invariant: unaffected; no worker job code changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — no rendered byte differs.

## Rollback Plan

Revert the single squash commit. There is no migration, no data write and no runtime state, so the
revert is complete on merge. The two generators are idempotent over their inputs: regenerating the
board and queue after a revert restores the previous output exactly.

## Audit Evidence

- The pull request and its check runs.
- The red-first and post-fix suite counts above, reproducible with
  `node scripts/exec/build-source-board.test.mjs` and
  `node scripts/exec/build-execution-queue.test.mjs`.
- The live-corpus before/after table, reproducible against a frozen copy of the operator documents
  with `--operator-root`.
- The mutation table; each mutation is a one-line edit named in the row.

## Known Gaps

1. **Mapping is still owed for all 12 ids, and nothing in this change reduces that.** The board still
   exits 1. What changed is only that owing it no longer hides the work.
2. **One newly offered row has no parseable lane** (`C-511`, rendered under *Lane ?*). That is the
   board's pre-existing `lane cell is not a lane` condition, which it already reports for four ids;
   this change makes one instance of it visible in the queue rather than invisible in the backlog. It
   is not introduced here and is not repaired here.
3. **The `T-500`–`T-599` band is exhausted at 0 of 100 free**, which the queue prints on its own
   face, so a T-lane finding cannot be numbered from the Claude band. `C-508` already records that as
   a range decision for the owner. This item was therefore filed in the C band, following `C-509`,
   which is the precedent for structure-map and queue-visibility work.
