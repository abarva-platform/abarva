# OPS6 - Duplicate Slice Preflight Script

## Purpose

OPS6 lands a deterministic, read-only Python 3 preflight script that classifies
one or more candidate slice ids against the canonical build manifest at
`docs/build/build-slices.json`. The script is the on-disk twin of the
"refuse to rebuild already-landed slices" rule from the OPS1 dispatch
operating model: a lane agent (or the integration agent) can scan candidate
ids before opening a worktree and bail out with a non-zero exit code when a
target is already `code_complete` / `verified` (BLOCKING) or in a `blocked` /
`in_progress` state (caution unless `--allow-blocked`).

This slice is read-only. The script imports only Python standard library
modules (`json`, `sys`, `argparse`, `pathlib`), makes no network calls, and
does not modify any file on disk.

## What changed

- `scripts/integration/check_duplicate_slices.py` (new, executable)
  - Shebang `#!/usr/bin/env python3`.
  - CLI:
    `check_duplicate_slices.py [--json] [--manifest=PATH] [--allow-blocked] <SLICE_ID> [<SLICE_ID> ...]`
  - `--help` / `-h` exits 0 and prints usage.
  - Reads `docs/build/build-slices.json` by default (relative to
    `Path.cwd()`); `--manifest=PATH` overrides.
  - Classifies each input id into:
    - `readyToRun`: not present in the manifest.
    - `duplicates`: present with status `code_complete` or `verified`
      (BLOCKING).
    - `missing`: alias for `readyToRun` (kept for caller convenience).
    - `blocked`: present with status `blocked` or `in_progress` (caution
      unless `--allow-blocked`).
    - `recommendedAction`: single-line operator-facing summary.
  - Default output is human-readable text. `--json` emits a structured JSON
    payload with the keys above plus `manifest`, `recommendedAction`, and
    `exitCode`.
  - Exit codes:
    - `0` - all targets ready / not-found, no duplicates.
    - `2` - one or more duplicates (`code_complete` / `verified`).
    - `3` - manifest missing, unreadable, or malformed JSON.
    - `4` - one or more blocked / `in_progress` and `--allow-blocked` not set.
  - Imports only `argparse`, `json`, `sys`, `pathlib`, `typing`, and
    `__future__`. No shell, no subprocess, no network, no file writes.
- `src/__tests__/integration/ops/duplicate-slice-preflight.test.ts` (new)
  - Drives the script through `child_process.spawnSync` against fixture
    manifests written into `os.tmpdir()` per test (no shared state with the
    real `docs/build/build-slices.json`).
  - Covers:
    - duplicate detection (`code_complete` -> exit 2);
    - duplicate detection (`verified` -> exit 2);
    - blocked detection (`blocked` and `in_progress` -> exit 4);
    - `--allow-blocked` flips the blocked-only path back to exit 0;
    - `--json` payload shape, keys, and `exitCode` value;
    - malformed JSON manifest -> exit 3 (text and JSON modes);
    - missing manifest path -> exit 3;
    - non-mutating: sha256 of fixture manifest is identical before and after
      multiple invocations;
    - `--help` exits 0 and prints usage;
    - static hygiene: shebang present, only stdlib imports, no
      `urllib` / `requests` / `http.client` / `socket` / `subprocess` /
      `os.system` / write-mode `open()` patterns.
- `docs/build/slices/OPS6_DUPLICATE_SLICE_PREFLIGHT_SCRIPT.md` (this file).
- `docs/build/build-slices.json` - appends the OPS6 entry with status
  `code_complete`, `lastUpdated 2026-04-26`; manifest top-level
  `lastUpdated` remains `2026-04-26`.
- `docs/build/production-readiness.json` - UNION-updates the
  `validation_qa` `notes` and `nextAction` with a conservative entry
  acknowledging the OPS6 preflight; manifest top-level `lastUpdated` is
  set to `2026-04-26`. No status promotions.

## What is explicitly out of scope

- No `git` integration, no branch-state inspection, no remote-state polling.
- No mutation of `docs/build/build-slices.json` or any other manifest.
- No agent runtime, model gateway call, or persona crawler invocation.
- No CI / GitHub / Vercel / observability ingestion.
- No web service, no daemon, no scheduler.
- No package.json change; the script is invoked directly via `python3` and
  is not registered as an `npm run` target in this slice.
- No coupling to the OPS1 dispatch queue manifest
  (`docs/build/agent-dispatch-queue.json`); OPS6 reasons strictly off the
  authoritative `build-slices.json` lifecycle.

## Why it is safe

- Imports are limited to Python's standard library (`argparse`, `json`,
  `sys`, `pathlib`, `typing`, `__future__`); the integration test enforces
  this with a static check on the script source.
- The script never opens a file in write mode and never invokes
  `subprocess`, `os.system`, `urllib`, `requests`, `http.client`, or
  `socket`; the integration test enforces this with grep-style assertions.
- All outputs are derived synchronously from the manifest text. Identical
  manifests produce byte-equal stdout (modulo Python's stable stdlib
  ordering, which we use directly).
- Manifest read failures collapse to exit code `3` with a single error line
  on stderr (or a JSON error payload when `--json` is set). The script
  never silently swallows malformed manifests.
- The integration suite asserts a sha256 round-trip on the fixture manifest
  to lock in the no-mutation invariant.

## How to re-run

```sh
cd /Users/anand/Projects/nexus-ops6
python3 scripts/integration/check_duplicate_slices.py --help
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/ops/duplicate-slice-preflight.test.ts
npm run build
```

Operator examples:

```sh
# Scan a candidate before opening a worktree
python3 scripts/integration/check_duplicate_slices.py OPS6 PROD5 ACT8

# Machine-friendly output for the integration agent
python3 scripts/integration/check_duplicate_slices.py --json OPS6 PROD5

# Permit a known in-flight slice for a parallel-lane batch
python3 scripts/integration/check_duplicate_slices.py --allow-blocked S0
```

## Production readiness impact

- `validation_qa`: notes UNIONed with an entry acknowledging that OPS6
  lands a deterministic duplicate-slice preflight script (Python 3 stdlib
  only) plus an integration suite covering duplicate detection,
  blocked-state handling, `--json` shape, malformed-manifest exit code,
  and a non-mutating sha256 round-trip. Status is preserved (no
  promotion); `nextAction` is conservatively appended without overwriting
  prior wording.
- No status promotions. The conservative-status / union-notes /
  no-false-promotion policy from the OPS1 operating model is preserved.
- No `production_deployment` change is asserted by this slice; CI / Vercel
  / observability ingestion remains deferred.
