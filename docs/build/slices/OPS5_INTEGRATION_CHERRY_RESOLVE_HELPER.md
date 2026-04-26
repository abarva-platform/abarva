# OPS5 - Integration Cherry-Pick Field Merge Helper

## Purpose

OPS5 productizes the `/tmp/cherry_resolve_v2.py` logic that has been used
manually across multiple integration packs into a repo-supported, tested,
dry-run-capable Python script under `scripts/integration/cherry_resolve.py`,
with a Jest integration test suite that locks the contract.

The helper resolves the canonical build trackers after a `git cherry-pick`
produces conflicts in any of:

- `docs/build/build-slices.json`
- `docs/build/production-readiness.json`
- `docs/build/build-waves.json` (optional)

It encodes the OPS1 conflict policies (operating model sections G and H) in a
deterministic, file-pure script so integrators do not have to retype the merge
each pack.

## What changed

- `scripts/integration/cherry_resolve.py` (new, executable)
  - CLI: `cherry_resolve.py [--dry-run] [--summary-json] CHERRY_SHA SLICE_ID`
  - `--help` / `-h` print usage with exit 0.
  - `--date YYYY-MM-DD` overrides today's date for deterministic tests.
  - `--repo-root` selects the working repo (default cwd).
  - Hidden fixture flags `--src-build-slices`, `--src-readiness`,
    `--src-waves`, `--main-readiness` accept file paths in lieu of `git show`,
    so the Jest suite can run the real script against synthetic fixtures
    without a real git repo.
  - **Resolution scope (per file):**
    - `build-slices.json`: preserve existing entries, append the cherry
      source's slice if `SLICE_ID` is not already present, never duplicate
      ids, bump top-level `lastUpdated`, JSON-parse-validate before and after.
    - `production-readiness.json`: preserve all existing components; status
      conservative-merges (never replaces HEAD with a higher rank from src;
      rank order `not_started < scaffolded < code_complete < tested <
      full_flow_ready < pilot_ready < production_ready`); notes UNION (dedupe
      by string); blockers UNION (dedupe by id then description); nextAction
      takes src when HEAD == main and src diverged, else append-distinct;
      bump `lastUpdated`.
    - `build-waves.json`: optional. Preserve waves; UNION
      `completedSlices` / `skippedSlices` / `blockedSlices`; recalculate
      `percentComplete = round(len(completed) / len(planned) * 100)`.
  - **Defensive behaviors:**
    - Detect actual `<<<<<<< HEAD` / `=======` markers before running
      `git checkout --ours`; never destroys auto-merged content.
    - Exit 3 with a clear message if any JSON is malformed.
    - Print a concrete summary of changed components / appended slices /
      merged waves on stdout.
    - `--dry-run` prints what WOULD change but writes nothing.
    - `--summary-json` emits a structured JSON summary instead of human text.
  - **Constraints honored by code:**
    - Only stdlib imports: `argparse`, `json`, `subprocess`, `sys`,
      `pathlib`, `datetime`.
    - No destructive git commands; only `git show <sha>:<path>` (read-only)
      and `git checkout --ours <path>` (only when conflict markers detected).
    - No network calls, no model providers, no shell pipelines.
- `src/__tests__/integration/ops/cherry-resolve-helper.test.ts` (new)
  - Spawns the Python script via `child_process.execFileSync` against
    fixtures written into a per-test `os.tmpdir()` directory.
  - Covers:
    - `--help` and `-h` print usage and exit 0.
    - `build-slices.json` duplicate prevention (slice already in HEAD => no
      append, single occurrence).
    - `build-slices.json` append on a fresh slice id.
    - `production-readiness.json` conservative status merge (HEAD `tested` +
      src `full_flow_ready` => result keeps `tested`).
    - `production-readiness.json` conservative status demotion (HEAD `tested`
      + src `code_complete` => result `code_complete`).
    - Blockers UNION (HEAD has `BLK-A`, src has `BLK-A` + `BLK-B` => result
      has both, deduped).
    - Notes UNION without dupes.
    - `nextAction` append-distinct when both HEAD and src diverged from main.
    - Malformed JSON in HEAD readiness -> exit 3.
    - `--dry-run` does not mutate either file on disk.
    - `--summary-json` emits valid JSON with the expected shape.
- `docs/build/slices/OPS5_INTEGRATION_CHERRY_RESOLVE_HELPER.md` (this file).
- `docs/build/build-slices.json` - appends the OPS5 entry with status
  `code_complete` and bumps top-level `lastUpdated` to `2026-04-26`.
- `docs/build/production-readiness.json` - UNIONs notes and conservatively
  appends `nextAction` for the `validation_qa` and `production_deployment`
  components, bumps top-level `lastUpdated` to `2026-04-26`, and preserves
  all existing statuses (no promotions).

## What is explicitly out of scope

- No automatic invocation from CI; the helper is a hand-run integrator tool
  for now.
- No mutation of cherry-source content; the helper only reads from
  `git show <sha>:<path>`.
- No edits outside `docs/build/build-slices.json`,
  `docs/build/production-readiness.json`, and (optionally)
  `docs/build/build-waves.json`.
- No agent runtime spawning, model providers, or network calls.
- No replacement for the OPS1 morning review or the integrator's pre-push
  validator pass; this helper is one step inside that flow, not a substitute.

## Why it is safe

- The script imports only Python's standard library.
- Outputs are deterministic functions of inputs at a given `--date`; identical
  inputs produce byte-equal JSON files.
- File writes are skipped entirely under `--dry-run`.
- Conflict-marker detection happens before any `git checkout --ours`, so the
  script never destroys auto-merged content.
- The Jest companion suite spawns the real script in fixture mode, so the
  contract under test is exactly what production integrators run.

## How to re-run

```sh
cd /Users/anand/Projects/nexus-ops5

# Smoke-check the CLI surface
python3 scripts/integration/cherry_resolve.py --help

# Run the integration test suite
npx jest src/__tests__/integration/ops/cherry-resolve-helper.test.ts

# Typecheck the workspace (test file lives under src/)
npx tsc --noEmit --pretty false
```

Real-world usage during integration:

```sh
# After a `git cherry-pick <SHA>` reports conflicts in docs/build/*.json:
python3 scripts/integration/cherry_resolve.py <SHA> <SLICE_ID>

# Inspect the resolution plan without writing:
python3 scripts/integration/cherry_resolve.py --dry-run --summary-json \
    <SHA> <SLICE_ID>
```

## Production readiness impact

- `validation_qa`: notes UNIONed with an entry acknowledging that the OPS5
  integration cherry-resolve helper is now repo-supported, tested, and
  dry-run-capable. Status is preserved (no promotion); `nextAction` is
  conservatively appended without overwriting prior wording.
- `production_deployment`: notes UNIONed with an entry acknowledging that
  the helper is a manual integrator tool (no CI / Vercel / observability
  hookup). Status is preserved (still `blocked`).
- No status promotions. The OPS1 conservative-status / union-notes /
  no-false-promotion policy is preserved.
