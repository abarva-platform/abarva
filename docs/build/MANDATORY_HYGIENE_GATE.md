# Mandatory Hygiene Gate — QA20

**Status:** Active  
**Script:** `scripts/integration/hygiene_gate.sh`  
**Applies to:** Every PR before push or merge

---

## Purpose

The mandatory hygiene gate is a single-command pre-merge verification that every lane agent and integration reviewer must run before any branch is pushed or merged. It catches the most common integration failures—uncommitted drift, JSON corruption, duplicate slice IDs, TypeScript regressions, and secret exposure—before they land in main.

Every PR merge must produce a gate result of `HYGIENE GATE: PASS`.

---

## How to Run

```bash
# Full gate (includes npm run build)
bash scripts/integration/hygiene_gate.sh

# Skip build (use in lane agents — build is deferred to integration)
bash scripts/integration/hygiene_gate.sh --skip-build

# Show usage
bash scripts/integration/hygiene_gate.sh --help
```

---

## Sections Checked

### 1. Git Hygiene
- No uncommitted changes (`git status --short`)
- No trailing whitespace errors (`git diff --check`)
- No conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) anywhere in the tree

### 2. JSON Manifest Hygiene
- `docs/build/build-slices.json` is valid JSON
- `docs/build/production-readiness.json` is valid JSON
- `docs/build/build-waves.json` is valid JSON (if present)
- No duplicate slice IDs in `build-slices.json`

### 3. Secret Hygiene
- Runs `src/__tests__/integration/qa/secret-hygiene-patterns.test.ts` if present
- Confirms no likely-secret value patterns appear in test-observable surfaces

### 4. TypeScript
- `npx tsc --noEmit --pretty false` — zero `error TS` lines

### 5. Build
- `npm run build` — `Compiled successfully` in output
- Skipped when `--skip-build` is passed (lane agents always use this flag)

### 6. Stash Hygiene
- Runs `scripts/integration/stash_safety_check.py --json` if present
- Reports risky stashes but does not pop, drop, or apply any stash

---

## What Constitutes a PASS

The gate prints:

```
HYGIENE GATE: PASS
```

and exits with code `0` when every section produces `[PASS]` with zero `[FAIL]` lines.

All checks must pass. There is no partial-pass state.

---

## What to Do on FAIL

1. Read the `[FAIL]` lines — they identify the failing section and root cause.
2. Fix the underlying issue (resolve conflicts, fix TypeScript, repair JSON, clean uncommitted files).
3. Re-run the gate: `bash scripts/integration/hygiene_gate.sh --skip-build`
4. Do **not** bypass the gate. Do not push a branch that fails the gate.
5. If a section is persistently failing due to environment (e.g., build tooling misconfigured), escalate to the integration agent — do not skip or comment out the section.

---

## Destructive Actions — Never Performed

The script is strictly non-destructive. It will **never**:

- Pop, apply, or drop any git stash (`git stash pop`, `git stash apply`, `git stash drop`)
- Push to any remote (`git push`)
- Delete files (`rm -rf`)
- Reset the working tree (`git reset --hard`)
- Modify any tracked file
- Make network calls

If a proposed change to this script adds any of the above, reject it.

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0`  | All checks passed — `HYGIENE GATE: PASS` |
| `1`  | One or more checks failed — `HYGIENE GATE: FAIL` |

---

## Flags

| Flag | Effect |
|------|--------|
| `--skip-build` | Skip `npm run build` (use in lane agents) |
| `--help` | Print usage and exit 0 |
