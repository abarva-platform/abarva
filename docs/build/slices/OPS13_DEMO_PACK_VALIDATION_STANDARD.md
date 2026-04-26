# OPS13 — Demo Pack Validation / Final Report Standard

**Status:** code_complete
**Category:** ops
**Wave:** wave-13
**Created:** 2026-04-26
**Lane:** H

---

## Purpose

OPS13 lands a deterministic, read-only validator that confirms every build pack's
final report carries all metadata required for audit, continuity, and integration
agent consumption. The validator is invoked over a single markdown report file and
emits either a human-friendly summary or a stable JSON payload.

This slice is a tooling addition. It does not run lanes, does not promote PRT
status, does not call any model provider, and does not write to any file.

---

## What Changed

- `scripts/integration/validate_demo_pack_report.py` (new)
  - Python 3 CLI: `validate_demo_pack_report.py [--json] <PATH>`; supports `--help`.
  - 11 required sections checked via case-insensitive keyword match:
    `PR number`, `merge commit`, `lanes completed`, `route`, `readiness`,
    `hygiene gate`, `CI`, `Vercel`, `build`, `Run Metrics`, `next`.
  - PR number regex: `#\d+` or `PR\s*\d+` or `pull request\s*\d+`.
  - Hygiene gate sub-fields (warnings): `git diff --check`, `conflict marker`,
    `JSON`, `tsc`, `eslint`.
  - Run Metrics sub-fields (warnings): `elapsed`, `subagent`, `test`.
  - Word-count advisory: reports under 200 words get a warning.
  - Exit codes: `0` = valid, `1` = invalid.
  - `--json` payload: `{ valid, errorCount, warningCount, errors[], warnings[],
    wordCount, checkedSections[], file }`.
  - Read-only: opens with `open(..., "r")` only. No subprocess, no network,
    no filesystem mutation.
  - stdlib only: `sys`, `json`, `re`, `os`.

- `src/__tests__/integration/ops/demo-pack-report-validator.test.ts` (new)
  - Contract group: file exists, non-empty, `--help`/`--json` flags present,
    checks for PR number / Run Metrics / hygiene gate, no write-mode opens,
    no network imports.
  - `--help` invocation: `execSync` verifies exit 0 and output contains
    `PR number` and `Usage`.
  - TypeScript mirror group: inline `mirrorValidate` replicates the 11-section
    check; cases: valid report passes, missing PR number fails, missing
    Run Metrics fails, empty report fails all checks.

- `docs/build/DEMO_PACK_FINAL_REPORT_STANDARD.md` (new)
  - Required sections table with pass/fail criteria.
  - Fill-in-the-blank final report template.
  - Validator usage examples.
  - Compliance note for Wave 13+.

- `docs/build/slices/OPS13_DEMO_PACK_VALIDATION_STANDARD.md` (this file).

- `docs/build/build-slices.json` — appends OPS13 entry with status
  `code_complete`; bumps `lastUpdated` to `2026-04-26`.

- `docs/build/production-readiness.json` — union-appends note on
  `validation_qa` component; conservatively preserves all statuses.

- `docs/build/build-waves.json` — adds OPS13 to wave-13.

---

## What Is Explicitly Out of Scope

- No live agent spawning or pack execution.
- No automatic PRT promotion.
- No CI wiring (a follow-up slice can hook this into GitHub Actions).
- No mutation of any report file; the validator is a pure linter.
- No GitHub / Vercel API calls.

---

## Why It Is Safe

- The Python script imports only `sys`, `json`, `re`, `os` from the standard library.
- The script uses `open(..., "r")` only — no subprocess, no shell, no network,
  no filesystem mutation.
- Identical inputs produce byte-equal outputs (regex-based, no clocks, no random).
- The TypeScript tests are file-pure except for the single `--help` execSync call.

---

## Validation Commands

```sh
python3 scripts/integration/validate_demo_pack_report.py --help
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/ops/demo-pack-report-validator.test.ts --no-coverage
```
