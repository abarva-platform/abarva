# Demo Pack Final Report Standard — OPS13

**Status:** code_complete
**Slice:** OPS13
**Created:** 2026-04-26
**Owner:** Lane H

---

## Purpose

Every build pack (wave-level integration run) must conclude with a **final report** that gives the integration agent and founder a complete, auditable record of what was built, merged, and validated. This document defines the required shape, required sections, pass/fail criteria, and the template all future agents must use.

The validator at `scripts/integration/validate_demo_pack_report.py` mechanically enforces this standard. All packs targeting Wave 13 and beyond must pass that validator before the pack is considered complete.

---

## Required Sections

The following fields/sections **must** appear verbatim (case-insensitive) in every final report. A report that omits any of these is **INVALID**.

| # | Required Field / Section | What It Must Contain | Pass Criteria |
|---|--------------------------|----------------------|---------------|
| 1 | **PR number** | The merged PR number in `#NNN` or `PR NNN` form | Regex match `#\d+` or `PR\s*\d+` present |
| 2 | **merge commit** | The full or abbreviated commit SHA of the integration merge | Any non-empty value following the label |
| 3 | **lanes completed** | A comma-separated list of lane IDs (e.g. `LIVE1, LIVE2, LIVE3`) | At least one lane identifier present |
| 4 | **route** | Route coverage summary — count of routes verified and their status | Text present anywhere in the report |
| 5 | **readiness** | Production Readiness Tracker update status — did it change? | Text present anywhere in the report |
| 6 | **hygiene gate** | Summary of hygiene gate results | Text present anywhere in the report |
| 7 | **CI** | CI pipeline result (green / failing / partial) | Text present anywhere in the report |
| 8 | **Vercel** | Vercel deployment result | Text present anywhere in the report |
| 9 | **build** | `npm run build` / `tsc` result | Text present anywhere in the report |
| 10 | **Run Metrics** | Elapsed time, subagent count, test count | Section header present anywhere in the report |
| 11 | **next** | Recommended next pack or wave | Text present anywhere in the report |

### Hygiene Gate Detail Fields (warnings if absent)

The following fields are expected within the hygiene gate section. Their absence produces **warnings**, not errors.

| Field | Description |
|-------|-------------|
| `git diff --check` | Whitespace / trailing-whitespace scan result |
| `conflict marker` | Conflict-marker grep result |
| `JSON` | JSON manifest parse result |
| `tsc` | TypeScript compiler result |
| `eslint` | ESLint result |

### Run Metrics Detail Fields (warnings if absent)

| Field | Description |
|-------|-------------|
| `elapsed` | Wall-clock time for the pack run |
| `subagent` | Number of lane subagents dispatched |
| `test` | Total test count at close |

---

## What Constitutes a Valid Report

A report is **VALID** when:

1. All 11 required sections are present (case-insensitive keyword match).
2. A PR number pattern (`#NNN` or `PR NNN`) is present.
3. The report contains at least **200 words** (enforced as a warning, not a hard error, to allow compact summary formats).

A report is **INVALID** when any required section is absent OR no PR number pattern is detected. The validator exits with code `1` on invalid, `0` on valid.

---

## How to Run the Validator

```sh
# Human-readable output
python3 scripts/integration/validate_demo_pack_report.py <report_file.md>

# Machine-readable JSON output
python3 scripts/integration/validate_demo_pack_report.py <report_file.md> --json

# Show help and required sections list
python3 scripts/integration/validate_demo_pack_report.py --help
```

### JSON Output Shape

```json
{
  "valid": true,
  "errorCount": 0,
  "warningCount": 2,
  "errors": [],
  "warnings": ["Hygiene gate field may be missing: 'eslint'"],
  "wordCount": 312,
  "checkedSections": ["PR number", "merge commit", ...],
  "file": "reports/wave-13-final.md"
}
```

Exit codes: `0` = valid, `1` = invalid (one or more required sections missing).

---

## Final Report Template

Copy and fill in this template for every build pack final report. Remove placeholder text (angle-bracket labels) before committing.

```markdown
# Build Pack Final Report — Wave <N>

**PR number:** #<NNN>
**merge commit:** <full-or-abbreviated SHA>
**Date:** <YYYY-MM-DD>

---

## Lanes Completed

lanes completed: <LANE1, LANE2, ...>

| Lane | Slice | Branch | Commit |
|------|-------|--------|--------|
| Lane A | <SLICE_ID> | <branch> | <sha> |
| Lane B | <SLICE_ID> | <branch> | <sha> |
...

---

## Route Coverage

route coverage: <N> of <M> routes verified green

| Route | Status | Notes |
|-------|--------|-------|
| /tenant/... | green | ... |
...

---

## Production Readiness Tracker

readiness: <updated / no change>

- Components promoted: <list or "none">
- Notes appended: <list or "none">

---

## Hygiene Gate

hygiene gate: <PASS / FAIL>

| Check | Result |
|-------|--------|
| git diff --check | <clean / issues found> |
| conflict marker scan | <clean / found in N files> |
| JSON manifests | <valid / N parse errors> |
| tsc | <clean / N errors> |
| eslint | <0 warnings / N warnings> |

---

## CI

CI: <green / partial / failing>

- Last CI run: <link or "local only">
- Test count: <N>
- Failing suites: <list or "none">

---

## Vercel

Vercel: <deployed / not deployed / skipped>

- Preview URL: <url or "N/A">
- Production URL: <url or "N/A">

---

## Build

build: <pass / fail / skipped>

- `npx tsc --noEmit --pretty false`: <clean / N errors>
- `npm run build`: <pass / skipped — reason>

---

## Run Metrics

elapsed: <HH:MM or Nmin>
subagent count: <N>
test count at close: <N>
tool calls: <N>
files read: <N>
files written: <N>

---

## Blockers / Deferred

- <list any blockers or "none">

---

## next

next recommended pack: Wave <N+1>
Suggested priority slices: <list>
```

---

## Compliance Note

Starting with Wave 13, the integration agent **must** run the validator before marking a pack complete:

```sh
python3 scripts/integration/validate_demo_pack_report.py reports/<wave-N>-final.md --json
```

If the validator exits non-zero, the pack is **not** complete until the report is amended to include all required sections.
