# OPS8 - Worktree Cleanup Assistant

## Purpose

OPS8 lands a safe, read-only worktree cleanup assistant. The parallel-build
operating model spins up dozens of `pack/` / `night/` / `loop/` /
`enterprise/` / `ops/` / `big/` worktrees over a build cycle. OPS8 gives the
founder and integration agent a single deterministic tool that lists those
worktrees, classifies each one by branch pattern and last-commit age, flags
dirty trees, warns about branches missing from origin, and prints
recommended cleanup commands for human execution. It NEVER deletes
anything.

## What changed

- `scripts/integration/worktree_cleanup_report.py` (new, executable)
  - Shebang `#!/usr/bin/env python3`. Stdlib-only imports
    (`argparse`, `json`, `subprocess`, `sys`, `pathlib`, `datetime`).
  - CLI: `worktree_cleanup_report.py [--json] [--fixture=PATH]`. Both
    `--help` and `-h` exit 0.
  - Default mode runs `git worktree list --porcelain` via `subprocess` and
    probes each worktree with three read-only git verbs:
    `git log -1 --format=%ct <branch>`, `git -C <path> status --short`, and
    `git ls-remote --heads origin <branch>`.
  - `--fixture=PATH` mode parses porcelain text from a file plus optional
    `last_commit_ts` / `dirty` / `on_origin` metadata so the integration
    suite can drive the classifier deterministically.
  - Classifications: `active-main`, `active-integration`, `lane-worktree`,
    `stale-lane`, `unknown`. `stale-lane` requires a lane prefix AND
    `lastCommitDays > 14`.
  - Recommended commands are PRINTED ONLY. For `stale-lane` clean trees
    the script emits
    `git worktree remove --force <path> && git branch -D <branch>`. For
    dirty trees it instead emits a "stash or commit first" warning. For
    `active-main` / `active-integration` it emits "do not remove (active
    branch)". For lanes missing from origin it appends an explicit
    "would lose work" warning.
  - JSON envelope shape:
    `{ schemaVersion: 1, createdFrom: "ops8_worktree_cleanup_report",
       destructive: false, rows: [...] }`. Every row carries the same
    `createdFrom` provenance tag.
- `docs/build/WORKTREE_CLEANUP_RUNBOOK.md` (new) - documents when to run,
  how to interpret each classification, manual cleanup steps, and the
  safety contract.
- `src/__tests__/integration/ops/worktree-cleanup-report.test.ts` (new) -
  deterministic Jest suite that drives the Python script via
  `child_process.execFileSync`. Covers porcelain parsing, classification
  by branch prefix, the 14-day stale threshold, dirty-worktree warning,
  origin-missing warning, JSON envelope shape, text-mode rendering,
  `--help` exit code, and a static assertion that the script source
  never invokes destructive git verbs.
- `docs/build/slices/OPS8_WORKTREE_CLEANUP_ASSISTANT.md` (this file).
- `docs/build/build-slices.json` - appends an OPS8 entry with status
  `code_complete` and bumps top-level `lastUpdated` to `2026-04-26`.
- `docs/build/production-readiness.json` - UNION-updates `validation_qa`
  and `production_deployment` notes / nextAction conservatively; bumps
  top-level `lastUpdated` to `2026-04-26`. No status promotions.

## What is explicitly out of scope

- No automatic deletion of stale lanes. The script prints commands; a
  human runs them.
- No cross-machine reconciliation. Local state only.
- No CI / Vercel / GitHub integration. This is a developer utility, not
  a deployment gate.
- No mutation of `agent-dispatch-queue.json`, `build-slices.json`, or
  any other manifest beyond appending the OPS8 entry and bumping
  timestamps.
- No reliance on any non-stdlib Python module (`requests`, `pygit2`, etc.
  are explicitly forbidden).

## Why it is safe

- The script's only side effect is `print` to stdout (and stderr on
  fixture-not-found / git-failure). It never writes files, never opens
  network sockets beyond the git probes, never spawns long-running
  processes.
- It only invokes read-only git verbs: `worktree list`, `log`, `status`,
  `ls-remote`. The integration suite asserts statically that the script
  source never names `worktree remove`, `branch -D`, `push`, `reset`, or
  `rm` as a subprocess argument.
- Dirty worktrees never receive a removal recommendation, regardless of
  how stale they are.
- Branches missing from origin receive an explicit "would lose work"
  warning.
- The fixture mode is the only way the test suite drives the script,
  which means the tests themselves never touch real worktrees.

## How to re-run

```sh
cd /Users/anand/Projects/nexus-ops8
python3 scripts/integration/worktree_cleanup_report.py --help
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/ops/worktree-cleanup-report.test.ts
npm run build
```

## Production readiness impact

- `validation_qa`: notes UNIONed with an entry acknowledging that OPS8
  lands a safe, read-only worktree cleanup assistant and an integration
  suite covering porcelain parsing, stale classification, dirty-tree
  warning, origin-missing warning, JSON envelope shape, `--help` exit
  code, and the static no-destructive-verb assertion. Status is
  preserved (no promotion); `nextAction` is conservatively appended.
- `production_deployment`: notes UNIONed with an entry acknowledging
  that OPS8 is a local developer utility - it does not poll Vercel,
  deploy, or invoke any production runtime. Status is preserved
  (still `blocked` until live deploy / CI / observability lands).
- No status promotions. Conservative-status policy from the OPS1
  operating model is preserved.
