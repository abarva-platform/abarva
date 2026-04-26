# OPS7 — Lane SHA / Final Report Validator

## Purpose

OPS7 lands a deterministic, read-only validator that confirms every lane's
final report carries the metadata the integration agent needs to mechanically
collect the lane's commit. The validator is invoked over a single report file
and emits either a human-friendly summary or a stable JSON payload describing
which fields are present, which are missing, and the abbreviated `LANE-SHA`
the lane committed at.

This slice is a tooling addition. It does not run lanes, does not move PRT
status, does not call any model provider, and does not write to any file.

## What changed

- `scripts/integration/validate_lane_report.py` (new)
  - Python 3 CLI: `validate_lane_report.py [--json] <PATH>`; supports
    `--help` / `-h`.
  - Required fields detected via regex / keyword:
    - `LANE-SHA` (case-insensitive label, 7+ hex characters, taken from
      the *last* match — the canonical position is at the bottom of the
      report).
    - Slice id (`[A-Z]+\d+`; prefers an explicit `Slice:` / `Slice id:`
      label, falls back to the first standalone match).
    - Branch line (`branch:` / `Branch:` followed by a branch
      identifier).
    - Files staged / Files changed list (header + at least one numbered
      or bulleted entry that looks like a real path).
    - Tests run (Jest test count, "docs only", or "N/A docs only").
    - Build result (`npm run build` line with pass / fail / skip token,
      or a top-level `Build:` line; tolerates `tsc` / `build` outcome
      lines for skip notes).
    - Tracker updated (`Tracker updated:` or
      `production-readiness.json updated:` with yes / no / true /
      false).
    - Run Metrics section header.
    - Guardrails confirmation (any of "no push", "no PR",
      "local commit only", or equivalent).
  - **Docs-only waiver**: if the report contains "docs only"
    (case-insensitive) AND stages zero `.ts` / `.tsx` source files, the
    Jest test count requirement is satisfied by the docs-only marker
    alone.
  - **Exit codes**: `0` valid, `2` invalid (one or more required fields
    missing), `3` unable to read the report file.
  - **`--json` payload**:
    `{ ok, missing[], present[], laneSha, sliceId }`. On a read failure
    the same shape is emitted with `missing: ["report_unreadable"]` and
    an `error` string.
  - Read-only: opens the report with `open(..., "r")`, never writes,
    never spawns a subprocess.
- `docs/build/AGENT_SLICE_REPORT_TEMPLATE.md` (updated)
  - Adds a `Lane` row and `Commit message` row to §A header.
  - Adds explicit `Tests run:` and `TSC + Build:` lines to §D plus a
    note documenting the docs-only Jest waiver.
  - Adds §K **Run Metrics** with wall time / tool calls / files read /
    files written / tokens / bash commands / retries.
  - Adds §L **Blockers** and §M **Final SHA line**, the latter
    documenting the literal `LANE-SHA: <abbrev>` line the validator
    matches on.
- `src/__tests__/integration/ops/lane-report-validator.test.ts` (new)
  - Drives the Python validator via `child_process.execFileSync`.
  - Writes test reports into a temp directory created with
    `fs.mkdtempSync`.
  - Cases:
    - valid report → exit 0, summary contains slice id and lane sha;
    - missing `LANE-SHA` → exit 2, `missing` contains `lane_sha`;
    - missing tracker update line → exit 2, `missing` contains
      `tracker_updated`;
    - docs-only lane (no `.ts` / `.tsx` staged, "N/A docs only") →
      exit 0;
    - `--json` emits a single-line JSON with the documented shape;
    - non-mutating: sha256 of the report is byte-equal before / after
      two invocations;
    - `--help` exits 0;
    - unreadable file path → exit 3 with structured JSON.
- `docs/build/slices/OPS7_LANE_REPORT_VALIDATOR.md` (this file).
- `docs/build/build-slices.json` — appends the OPS7 entry with status
  `code_complete`; bumps top-level `lastUpdated` to `2026-04-26`.
- `docs/build/production-readiness.json` — union-appends notes on the
  `validation_qa` component, conservatively preserves all statuses (no
  promotions), and bumps top-level `lastUpdated` to `2026-04-26`.

## What is explicitly out of scope

- No live agent spawning, no live commit collection, no GitHub / Vercel
  API calls.
- No mutation of any lane report; the validator is a pure linter.
- No automatic PRT promotion; the validator only inspects the
  `Tracker updated:` line in the report itself, it does not read the
  manifest.
- No CI wiring. A follow-up slice can hook this validator into a GitHub
  Actions step that runs over collected lane reports.

## Why it is safe

- The Python script imports only `argparse`, `json`, `re`, and `sys`
  from the standard library.
- The script uses `open(..., "r")` only — no subprocess, no shell,
  no network, no filesystem mutation.
- Identical inputs produce byte-equal outputs (regex-based, no clocks,
  no random).
- The Jest suite isolates test reports inside `os.tmpdir()` so it
  cannot collide with real lane reports or pollute the worktree.

## Validation commands

```
cd /Users/anand/Projects/nexus-ops7 && python3 scripts/integration/validate_lane_report.py --help
cd /Users/anand/Projects/nexus-ops7 && npx tsc --noEmit --pretty false
cd /Users/anand/Projects/nexus-ops7 && npx jest src/__tests__/integration/ops/lane-report-validator.test.ts
cd /Users/anand/Projects/nexus-ops7 && npm run build  # symlink panic OK to skip
```
