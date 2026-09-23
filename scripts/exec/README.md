# Execution Board Toolchain

This directory owns the code that derives the Source execution board and claimable queue. The repository reviews and tests the generators; it does not own private operator state.

## Boundaries

- Repo-owned: `build-source-board.mjs`, `build-execution-queue.mjs`, their behavioral suite, and `source-stage-map.json`.
- Operator-owned: the execution board, backlog, append-only claims log, and scope document supplied through `--operator-root` or `SOURCE_EXECUTION_HOME`.
- Generated, never committed: `source-board.html`, `source-board-summary.json`, `EXECUTION_QUEUE.md`, and `id-collision-history.json`.

The structure map contains no status. The board generator rejects status-like keys, and the queue refuses a summary when any stamped source has changed.

## Run

From the repository root:

```bash
SOURCE_EXECUTION_HOME="$HOME/Downloads" \
  node scripts/exec/build-source-board.mjs --json

SOURCE_EXECUTION_HOME="$HOME/Downloads" \
  node scripts/exec/build-execution-queue.mjs
```

## Superseded copies in the operator root

Before this toolchain moved here, `build-source-board.mjs`, `build-execution-queue.mjs`
and `source-stage-map.json` lived in the operator directory. Those files were not deleted
by the move and **they still run**.

That is a quiet hazard, and it has already cost time:

- The local generator has **drifted** from this one. Running it produces a different board
  from the same inputs, with no warning that a stale reader produced it.
- The structure map is now repo-owned. Adding an id to the copy in the operator root is a
  **silent no-op** — the generator never reads that file, so the item stays invisible to the
  queue and the agent that mapped it has no way to tell. An id added there is not mapped.

So: run the copies in this directory, and map ids in `scripts/exec/source-stage-map.json`,
which means mapping is now a pull request rather than a local edit. Delete or rename the
copies in the operator root when convenient; nothing here depends on them.

That last sentence was, for a day, the whole of the defence — and it is an
instruction, which is the shape this directory exists against. What closes it is
below.

## Which generator wrote the queue you took your item from

`build-execution-queue.mjs` writes the sha256 of its **own file**, read at run
time, into the queue it generates:

```text
<!-- queue-provenance v1 sha256=<64 hex> script=<the generator that wrote it> -->
```

A superseded copy cannot produce that stamp without being byte-identical to the
repo-owned generator, and then it is not superseded. **Hash, not path**, for
T-711's reason: the same generator legitimately runs from a worktree, from a
fixture directory a suite copied it into, and from a CI checkout, and a path
comparison would refuse all three.

```bash
node scripts/exec/queue-provenance.mjs --register ~/Downloads/EXECUTION_CLAIMS.md
node scripts/exec/queue-provenance.mjs --queue <file> --json
```

Exit `0` only for `repo_owned`. Every other verdict — `superseded`, `unstamped`,
`absent`, `unreadable`, `generator_missing` — fails closed, **including the ones
that mean "could not tell"**, because a guard whose unknown case passes is
opt-in and the first file to reach it is by definition the one that predates it.
Every refusal prints the one-line regenerate command, because a control this
cheap to satisfy should not send anyone looking it up.

**This one is wired, not merely available.** `append-claim.mjs` runs it before
the ownership gate and refuses a claim whose queue does not match — T-706 and
T-711 both shipped correct controls that nothing invoked, and from outside the
register that is the same as not having them.

**Only a claim is gated.** A release and an abstention take nothing, and the
moment a queue is stale is the moment a holder most needs to hand work back;
refusing that would strand a live claim behind a regeneration and push the
correction into a hand-written line. Same asymmetry as an abstention past a
refused pre-claim gate.

Why it exists, measured rather than argued (item T-720). On 2026-09-23 the live
queue had been written by the superseded pair. On byte-identical inputs that pair
offered **61** claimable rows where this one offers **1**, reported *"None held.
Every claim in the log is released or expired"* while **three** claims were live,
and counted **110** rows whose only remaining work needs an operator as
claimable. The regenerate block it printed names the generators by bare
filename, which resolves back to the superseded copies — so following the
artifact's own instructions reproduces the fault. A run that did exactly that
re-verified three long-closed items in lane order before noticing, and they were
the same three ids T-711 had already recorded as its evidence.

An explicit `--operator-root <dir>` takes precedence over the environment variable. Use `--map <file>` only for a controlled alternate structure map, such as the synthetic CI fixture.

## Appending a claim — run the helper, do not hand-write the line

`register-time-authority.mjs --preclaim` (item T-706) answers whether a run may
claim an item, and exits non-zero when it may not. For its first day it was
**available and invoked by nobody**: the claim step was an agent choosing to run
a control. From outside the register that is indistinguishable from not having
the control, and it is the same shape as the gate that proved a control existed
by finding its name in a file.

So the claim step is now the helper, and it is the only sanctioned way to append:

```bash
node scripts/exec/append-claim.mjs \
  --file ~/Downloads/EXECUTION_CLAIMS.md \
  --item T-708 --identity '<base-agent>#<run-id>' \
  --branch exec/t-708-claim-append-gate \
  --files 'scripts/exec/append-claim.mjs,scripts/exec/append-claim.test.mjs' \
  --message 'what is being taken and why'
```

The gate decides and **a refusal means nothing is written** — not a warning, not
a line with a caveat. The helper adds no rules of its own: the verdict is the
gate's exit status, so a rule that lands in the gate governs the claim step the
day it merges.

Three behaviours are worth knowing before you reach for `--force` (there isn't
one):

- **It fails closed.** A gate it cannot find, cannot spawn, or whose exit code
  it does not interpret refuses the claim. Appending because the check errored
  is, from the register's side, the same as never running it.
- **It refuses a check it cannot prove ran.** Node ignores flags it does not
  recognise, so asking a gate for a check it does not implement is a silent
  pass. Any forwarded argument — `--files`, anything under `--gate-arg` — must
  appear in the installed gate's own usage text, or the claim stops. This is how
  `--files` behaves correctly both before and after the file-overlap half lands.
- **The stamp is read at the instant of writing** (T-457), after the gate has
  run, never earlier in the run where it becomes an estimate.

`--dry-run` prints the record without writing it. Exit codes: `0` appended,
`1` the gate refused, `2` usage — including an unadvertised flag, an empty
`--message` or an empty `--files` — and `3` the gate could not be run.

Nothing here restamps or rewrites an existing line. The register is audit
history; a correction is another line.

New claim records should use the canonical, non-bulleted form:

```text
YYYY-MM-DDTHH:MMZ <agent> item <id> <branch> — claimed
```

The queue remains backward-compatible with the established timestamped `item`, `CLAIM`, and `CLAIMED` forms already present in the append-only claim log. Text above the `## Claim log` marker is never authoritative.

## Worktree retention — check before you create one, not after ENOSPC

"Remove it when the item is merged" has been in the operator task file since
18 Sep. Two runs of that same task did not follow it. At `2026-09-23T03:57Z` a
run could not start at all: 580 MiB free of 926 GiB and `git worktree add`
dying `ENOSPC` mid-checkout, with **798** registered worktrees on disk and
`git worktree prune` removing **none** of them, because every one still exists.
A rule nothing can fail is the shape this directory exists against, so the rule
now has a control.

```bash
node scripts/exec/worktree-retention.mjs --claims ~/Downloads/EXECUTION_CLAIMS.md
node scripts/exec/worktree-retention.mjs --check --free-floor-gib 10
node scripts/exec/worktree-retention.mjs --emit-removals /tmp/removals.sh
```

**It never removes anything**, and that is deliberate rather than cautious.
Removing another agent's checkout is the destructive version of the collision
the claim protocol exists to prevent, so the burden is on proof and the
asymmetry is explicit:

> a worktree wrongly called `keep` costs one item's disk.
> a worktree wrongly called `removable` costs someone's uncommitted work.

`removable` therefore needs **three independent proofs**, and anything short of
all three is `unknown`, never `removable`:

1. **the branch is merged by PR `mergedAt`** — not by ancestry. A squash merge
   is not an ancestor of the branch it closed, so `merge-base --is-ancestor`
   would call every squash-merged branch unmerged and leave the disk full.
2. **`git status --porcelain` is empty.** Read with `--no-optional-locks`, so
   measuring a checkout never takes the index lock of the run working in it.
3. **no live claim names the branch or the path.** A claim states its branch in
   prose and lists source files, never its checkout — so this reads the whole
   line, not the `files:` list. A claim stamped *ahead* of the clock still
   holds: T-457 measured six such lines in one day, they are real claims with a
   wrong stamp, and skipping them would free exactly the checkouts in use.

`--check` exits `1` when free space is below the floor, `0` above it, and `2`
when free space cannot be read — failing closed, since a control that cannot
measure its subject must not report success. The floor alone decides it: a disk
that cannot hold the next checkout is the hazard, and `removable: 0` below the
floor is the case that needs a person, not the case that needs silence.

**Where the wiring stops, stated rather than implied.** CI runs the behavioural
suite; it cannot run `--check`, because a GitHub runner's free space and
worktree list are not the operator's, and a gate asserting on a subject it
cannot see is the unfailable kind. So `--check` is an operator control in the
shape of `--preclaim`: available, and only as good as its being invoked.

## Verify

```bash
node scripts/exec/build-execution-queue.test.mjs
node scripts/exec/build-source-board.test.mjs
node scripts/exec/register-time-authority.test.mjs
node scripts/exec/append-claim.test.mjs
node scripts/exec/worktree-retention.test.mjs
node scripts/exec/queue-provenance.test.mjs
```

The suites run the generators as child processes against synthetic operator documents. CI never reads a local execution backlog.

`build-source-board.test.mjs` owns the board's claim-record boundary. The claim
log is written in three grammars — `<stamp> | <agent> | ...` at minute
precision, the same at seconds precision, and the pipe-less
`<stamp> <agent> item <id> <branch> — claimed` form documented above. A line the
board does not recognise as a record start is appended to the record above it,
which is right for a wrapped continuation and wrong for all three grammars it
used to miss. Both directions are covered, because a boundary that starts a new
record on every line truncates the register just as badly as one that starts too
few.
