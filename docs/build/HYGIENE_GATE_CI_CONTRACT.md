# Hygiene Gate CI Contract

**Slice:** OPS14  
**Wave:** Wave-14  
**Date:** 2026-04-26

## Overview

The hygiene gate CI contract formalizes how `scripts/integration/hygiene_gate.sh` (QA20) integrates with GitHub Actions CI. Every PR to `main` runs the full hygiene gate before merge.

## Workflow File

`.github/workflows/hygiene-gate.yml`

## What the Gate Checks

1. **Git hygiene** — No conflict markers (`<<<<<<<`, `>>>>>>>`, `=======`) in tracked files
2. **JSON manifests** — `build-slices.json` and `production-readiness.json` parse as valid JSON
3. **Duplicate slices** — No duplicate slice IDs in `build-slices.json`
4. **Secret hygiene** — No obvious secret patterns in staged files
5. **TypeScript** — `tsc --noEmit` exits clean
6. **Build** — `npm run build` succeeds (skippable with `--skip-build`)
7. **Stash hygiene** — No stash pop, drop, push, or reset operations

## Contract Guarantees

- **Non-destructive**: never modifies the working tree, never pushes, never pops stashes
- **Idempotent**: running multiple times produces the same result
- **Exit codes**: exits 0 on PASS, 1 on any FAIL
- **Output**: prints `HYGIENE GATE: PASS` or `HYGIENE GATE: FAIL` summary line

## Manual Trigger

The workflow supports `workflow_dispatch` with `skip_build: true` for faster iteration during development.

## Artifacts

On every run (including failures), the workflow uploads the current state of the 3 manifest files as artifacts retained for 7 days. This provides an audit trail for gate failures.

## Relationship to Other CI Workflows

| Workflow | Scope |
|---|---|
| `integrity.yml` | Full TypeScript build + test suite |
| `lint.yml` | ESLint + Prettier |
| `hygiene-gate.yml` | Integration hygiene: manifests, conflicts, secrets, TSC |
| `migration-drift-pr.yml` | Database migration drift detection |

The hygiene gate is a fast (~2 min) pre-check. It complements but does not replace `integrity.yml`.

## Failure Recovery

If the hygiene gate fails on a PR:
1. Read the `HYGIENE GATE: FAIL` summary in CI output
2. Fix the specific check that failed
3. Push a new commit — the gate runs automatically on the new commit
4. Do NOT merge until the gate passes
