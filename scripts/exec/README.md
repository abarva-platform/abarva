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

New claim records should use the canonical, non-bulleted form:

```text
YYYY-MM-DDTHH:MMZ <agent> item <id> <branch> — claimed
```

The queue remains backward-compatible with the established timestamped `item`, `CLAIM`, and `CLAIMED` forms already present in the append-only claim log. Text above the `## Claim log` marker is never authoritative.

## Verify

```bash
node scripts/exec/build-execution-queue.test.mjs
node scripts/exec/build-source-board.test.mjs
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
