# OPS12 — Integration Stash Safety Check

## Slice Contract

| Field | Value |
|---|---|
| **ID** | OPS12 |
| **Name** | Integration Stash Safety Check |
| **Category** | ops |
| **Status** | code_complete |
| **Risk** | low |
| **Date** | 2026-04-26 |

## Goal

Prevent accidental `git stash pop` from a different branch from injecting
conflict markers into source files during integration. In a prior build
session, this exact failure mode inserted conflict markers into 5 files and
broke a `tsc --noEmit` run after 40 minutes of integration work.

OPS12 introduces a preflight check that must be run before any integration
session begins. It:

1. Lists all stash entries via `git stash list` (read-only)
2. Parses entries into structured records with branch context
3. Flags stashes from branches other than the current branch as HIGH RISK
4. Recommends a specific remediation action per stash
5. Provides a `--fail-if-stashes` CI flag (exit 1) for automated gating
6. Provides a `--json` flag for lane report integration
7. Never performs any destructive git operation (no pop, apply, or drop)

## Files

### Source

| File | Description |
|---|---|
| `scripts/integration/stash_safety_check.py` | Python 3 CLI — stdlib only (subprocess, json, sys, argparse, pathlib, datetime). Run before integration. |
| `src/lib/ops/stash-safety-check.ts` | TypeScript read model — fixture-based, no subprocess. Mirrors Python output schema. |

### Tests

| File | Description |
|---|---|
| `src/__tests__/integration/ops/stash-safety-check.test.ts` | Jest suite — 8 describe blocks, fixture-driven, no subprocess. |

### Documentation

| File | Description |
|---|---|
| `docs/build/INTEGRATION_STASH_SAFETY_RUNBOOK.md` | Full runbook with root-cause narrative, usage, interpretation, and recovery procedure. |

## TypeScript Interface

```typescript
export interface StashRecord {
  index: number;
  branch: string;
  description: string;
  isCurrentBranch: boolean;
  recommendedAction: 'inspect' | 'create-recovery-branch' | 'drop-after-confirmation';
}

export interface StashSafetyReport {
  generatedAt: string;
  currentBranch: string;
  totalStashes: number;
  stashesFromOtherBranches: number;
  isSafeToIntegrate: boolean;
  safetyWarning: string | null;
  stashes: StashRecord[];
  recommendedPreflightActions: string[];
}

export function buildStashSafetyReportFromFixture(
  stashes: StashRecord[],
  currentBranch: string,
  generatedAt?: string
): StashSafetyReport
```

## Invariants

- `isSafeToIntegrate === true` only when `totalStashes === 0`
- `stashesFromOtherBranches` counts only entries where `branch` is set and
  differs from `currentBranch`
- `safetyWarning` is `null` when `totalStashes === 0`
- `recommendedPreflightActions` is empty when `totalStashes === 0`
- No destructive git operation is ever performed by the check script
- Python imports: stdlib only (`subprocess`, `json`, `sys`, `argparse`,
  `pathlib`, `datetime`, `re`, `os`)
- TypeScript: no imports from `child_process`, `fs`, `anthropic`, `openai`,
  `@supabase`, `@clerk`, or any agent module

## Usage

```bash
# Human-readable preflight check
python3 scripts/integration/stash_safety_check.py

# JSON output
python3 scripts/integration/stash_safety_check.py --json

# CI gate — exit 1 if any stashes present
python3 scripts/integration/stash_safety_check.py --fail-if-stashes
```

## Production Readiness Impact

Updates `validation_qa` component notes in `docs/build/production-readiness.json`:
> OPS12: Integration stash safety check added; prevents accidental stash pop
> during cherry-pick integration.
