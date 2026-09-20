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

An explicit `--operator-root <dir>` takes precedence over the environment variable. Use `--map <file>` only for a controlled alternate structure map, such as the synthetic CI fixture.

## Verify

```bash
node scripts/exec/build-execution-queue.test.mjs
```

The suite runs both generators as child processes against synthetic operator documents. CI never reads a local execution backlog.
