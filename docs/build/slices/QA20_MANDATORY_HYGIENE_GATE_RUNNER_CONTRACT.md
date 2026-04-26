# QA20 — Mandatory Hygiene Gate Runner Contract

**Slice ID:** QA20  
**Category:** qa  
**Status:** code_complete  
**Wave:** wave-13  
**Date:** 2026-04-26  

## Goal

Provide a single-command mandatory hygiene gate that every lane agent and integration reviewer runs before any branch is pushed or merged. The gate is non-destructive, deterministic, and covers all critical pre-merge checks: git hygiene, JSON manifest validity, duplicate slice detection, secret hygiene, TypeScript compilation, build health, and stash safety.

## Files Created

- `scripts/integration/hygiene_gate.sh` — executable bash runner (non-destructive)
- `src/__tests__/integration/ops/hygiene-gate-contract.test.ts` — Jest contract suite
- `docs/build/MANDATORY_HYGIENE_GATE.md` — operator spec and runbook
- `docs/build/slices/QA20_MANDATORY_HYGIENE_GATE_RUNNER_CONTRACT.md` — this slice doc

## Files Updated

- `docs/build/build-slices.json` — QA20 appended (status: code_complete, wave: wave-13)
- `docs/build/production-readiness.json` — validation_qa notes updated with QA20 entry
- `docs/build/build-waves.json` — QA20 added to wave-13

## Validation

- `bash scripts/integration/hygiene_gate.sh --help` — exits 0, prints usage
- `npx tsc --noEmit --pretty false` — clean
- `npx jest src/__tests__/integration/ops/hygiene-gate-contract.test.ts --no-coverage` — all pass
- Build not run in lane (--skip-build convention)

## Non-Destructive Contract

The script **never**:
- Pops, applies, or drops stashes
- Pushes to any remote
- Deletes files
- Resets the working tree
- Makes network calls

## Sections Covered

1. Git hygiene (uncommitted changes, whitespace, conflict markers)
2. JSON manifest hygiene (build-slices, production-readiness, build-waves, duplicate IDs)
3. Secret hygiene (delegates to existing QA13 test suite)
4. TypeScript (`npx tsc --noEmit`)
5. Build (`npm run build`, skippable with `--skip-build`)
6. Stash hygiene (delegates to existing OPS12 stash_safety_check.py)
