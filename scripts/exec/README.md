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

## Verify

```bash
node scripts/exec/build-execution-queue.test.mjs
node scripts/exec/build-source-board.test.mjs
node scripts/exec/register-time-authority.test.mjs
node scripts/exec/append-claim.test.mjs
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
