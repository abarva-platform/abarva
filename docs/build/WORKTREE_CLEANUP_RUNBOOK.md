# Worktree Cleanup Runbook (OPS8)

The parallel-build operating model (OPS1) creates a fresh git worktree per
slice (e.g. `nexus-pack-foo`, `nexus-night-bar`, `nexus-loop-baz`,
`nexus-enterprise-qux`, `nexus-ops8`). Over the course of a build cycle this
accumulates dozens of worktrees and matching local branches. OPS8 lands a
read-only assistant that lists those worktrees, classifies each one, and
prints recommended cleanup commands - the human operator is the only one
who actually runs the destructive commands.

## When to run

- Before opening a new build cycle.
- After integration agent has merged a batch of `pack/` / `night/` /
  `loop/` / `enterprise/` / `ops/` lanes to `main`.
- Before a hand-off to a steward or a long pause - so the next operator
  inherits a clean tree.
- Whenever `git worktree list` returns more than ~20 entries.

The script is safe to run at any time: it only reads.

## How to invoke

```sh
# Human-readable text report (default).
python3 scripts/integration/worktree_cleanup_report.py

# Structured JSON envelope (for piping into jq, dashboards, or audits).
python3 scripts/integration/worktree_cleanup_report.py --json

# Self-test mode against a hand-crafted porcelain fixture.
python3 scripts/integration/worktree_cleanup_report.py \
  --fixture=path/to/fixture.porcelain
```

The script must be run inside a real git repository in default mode. It
shells out exactly twice per worktree:

1. `git log -1 --format=%ct <branch>` - resolve the last-commit timestamp.
2. `git status --short` (executed via `git -C <path>`) - detect dirtiness.
3. `git ls-remote --heads origin <branch>` - check whether the branch
   exists on origin.

It will never run `git worktree remove`, `git branch -D`, `git push`,
`git reset`, or any other state-mutating verb.

## Classifications

| Classification        | Meaning                                                          | Recommended action                                                                  |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `active-main`         | Branch is `main`.                                                | Do not remove.                                                                      |
| `active-integration`  | Branch starts with `codex/` (live integration branch).           | Do not remove.                                                                      |
| `lane-worktree`       | Branch starts with `pack/`, `night/`, `loop/`, `enterprise/`, `ops/`, or `big/` and last commit <= 14 days. | Leave in place; lane is presumed active.                                            |
| `stale-lane`          | Lane branch above whose last commit is more than 14 days old.    | Recommended for removal once the lane has been merged or abandoned.                 |
| `unknown`             | Branch does not match any of the above patterns.                 | Manual review - decide whether to keep, rename, or delete out of band.              |

## Modifiers (orthogonal flags)

- **`isDirty: true`** - the worktree has uncommitted changes (`git status
  --short` returned non-empty). The script refuses to emit a removal
  command and instead instructs the operator to stash or commit first.
- **`onOrigin: false`** - the branch is not present on origin. For stale
  lanes the script appends a "would lose work" warning to the recommended
  command and tells the operator to push first.

## Manual cleanup steps

1. Run the script. Read the report end-to-end.
2. For every `stale-lane` row whose `recommendedCommand` starts with
   `git worktree remove`:
   1. Verify the work is either merged to `main` or intentionally
      abandoned (see `git log <branch>` and PR history).
   2. If the row also says "not on origin", push first: `git push -u
      origin <branch>` from inside the worktree (or accept the loss).
   3. Copy the recommended command and run it manually:
      ```sh
      git worktree remove --force <path>
      git branch -D <branch>
      ```
3. For every `lane-worktree` row (within 14 days), leave it alone unless
   you have explicit knowledge that the lane is finished.
4. For every `active-main` / `active-integration` row, do nothing.
5. For every `unknown` row, open a ticket, ask the lane owner, or rename
   the branch into one of the canonical prefixes; never auto-delete.

## Safety contract

- The script is read-only. The integration test suite at
  `src/__tests__/integration/ops/worktree-cleanup-report.test.ts` asserts
  that no destructive verbs are ever invoked from within the script.
- The script prints recommended commands; humans run them.
- Dirty worktrees never receive a removal recommendation.
- Lanes missing from origin receive an explicit "would lose work" warning.
- The script does not call any non-stdlib Python module, does not touch
  the network beyond the standard git probes, and does not write to the
  filesystem at all.

## Out of scope (deferred)

- Automatic deletion of stale lanes (will require explicit operator
  approval and an audit trail; not part of OPS8).
- Cross-machine reconciliation of worktrees (operators may have stale
  worktrees on multiple laptops; OPS8 reports the local state only).
- Integration with CI / Vercel / GitHub - this is a local developer
  utility, not a deployment gate.
