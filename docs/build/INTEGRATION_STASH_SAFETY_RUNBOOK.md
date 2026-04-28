# Integration Stash Safety Check Runbook

## Why This Matters — The Bug That Happened

During a previous build session, a `git stash pop` was executed to restore
work-in-progress changes before beginning an integration cherry-pick run.
The stash that was popped had been created on a **different branch** (a
feature lane working on the Tower vendor portfolio surface). Because the
current branch had diverged from that feature lane, git could not cleanly
apply the stash and inserted conflict markers into 5 files:

- `docs/build/build-slices.json`
- `docs/build/production-readiness.json`
- `docs/build/build-waves.json`
- `src/lib/ops/agent-dispatch-queue.ts`
- `src/components/admin/ProductionReadinessLivePanel.tsx`

The conflict markers were not immediately visible in the terminal (the `pop`
printed "Auto-merging" for each file without a fatal error), and integration
proceeded. The cherry-pick helper (`cherry_resolve.py`) detected the markers
in the JSON files and resolved them correctly via `git checkout --ours`, but
the TypeScript source files were left with raw `<<<<<<< HEAD` blocks that
caused the subsequent `tsc --noEmit` run to fail after 40 minutes of work.

**Root cause**: no preflight check existed to warn that stashes from other
branches were present before integration began.

---

## Pre-Integration Checklist Position

Run the stash safety check as **the first step** before any of:

- `git cherry-pick <sha>`
- `python3 scripts/integration/cherry_resolve.py`
- Any integration pack batch execution

---

## How to Run the Check

### Human-readable output (default)

```bash
python3 scripts/integration/stash_safety_check.py
```

### JSON output (for scripting or lane reports)

```bash
python3 scripts/integration/stash_safety_check.py --json
```

### CI / automated gate (exit 1 if any stashes found)

```bash
python3 scripts/integration/stash_safety_check.py --fail-if-stashes
```

### From a different working directory

```bash
python3 scripts/integration/stash_safety_check.py --repo-root /path/to/repo
```

### Help

```bash
python3 scripts/integration/stash_safety_check.py --help
```

---

## Interpreting Results

### Safe — no stashes

```
Integration Stash Safety Check
------------------------------------------------------------
Generated at : 2026-04-26T12:00:00+00:00
Current branch: dual/ops12-integration-stash-safety
Total stashes : 0
From other branches: 0
Safe to integrate  : YES

Result: SAFE — no stashes found, integration may proceed.
```

Proceed with integration normally.

---

### Stash(es) from the current branch

```
Integration Stash Safety Check
------------------------------------------------------------
...
Total stashes : 1
From other branches: 0
Safe to integrate  : NO

WARNING: 1 stash(es) detected on the current branch. Inspect them before
running integration steps.

Stash entries:
  stash@{0}: [INSPECT] (current branch)
    branch     : dual/ops12-integration-stash-safety
    description: WIP: auth flow refactor

Recommended preflight actions:
  1. Run `git stash list` to review all stash entries.
  2. stash@{0}: Inspect with `git stash show -p stash@{0}` and drop only
     after confirming it is safe: `git stash drop stash@{0}`
```

**Action**: Inspect the stash. If the changes are already committed or no
longer needed, drop it. If the changes are still needed, decide whether to
apply them now or leave them until after integration completes.

---

### Stash(es) from a different branch (HIGH RISK)

```
Integration Stash Safety Check
------------------------------------------------------------
...
Total stashes : 1
From other branches: 1
Safe to integrate  : NO

WARNING: 1 stash(es) from OTHER branches detected. A stash pop from a
different branch can inject conflict markers into the working tree.
DO NOT run `git stash pop` until these are resolved.

Stash entries:
  stash@{0}: [CREATE RECOVERY BRANCH] (OTHER branch)
    branch     : feat/tower-vendor-portfolio
    description: WIP: vendor portfolio card

Recommended preflight actions:
  1. Run `git stash list` to review all stash entries.
  2. stash@{0}: Create a recovery branch from this stash (branch
     'feat/tower-vendor-portfolio') before integration:
     `git stash branch recovery/feat/tower-vendor-portfolio-stash-0 stash@{0}`
```

**Action**: Follow the recovery procedure below.

---

## Recommended Actions per Scenario

| Scenario | `isSafeToIntegrate` | Recommended action |
|---|---|---|
| No stashes | `true` | Proceed with integration |
| Stash from current branch | `false` | Inspect, confirm safe, then drop or apply |
| Stash from another branch | `false` | Create recovery branch, then drop |
| Multiple stashes, mixed branches | `false` | Handle other-branch stashes first, then current-branch stashes |

---

## Recovery Procedure for Other-Branch Stashes

These steps resolve the situation **without losing any work**:

### Step 1: Create a recovery branch from the stash

```bash
# Replaces the stash with a proper branch and working tree
git stash branch recovery/<original-branch>-stash-<index> stash@{<index>}
```

This command:
1. Creates a new branch from the commit the stash was based on
2. Applies the stash changes as unstaged modifications
3. Removes the stash entry automatically on success

### Step 2: Commit the recovered changes on the recovery branch

```bash
git add -p   # review each hunk
git commit -m "chore(recovery): preserve stashed WIP from <original-branch>"
```

### Step 3: Return to the integration branch

```bash
git checkout <integration-branch>
```

### Step 4: Confirm stash list is clear

```bash
python3 scripts/integration/stash_safety_check.py
# Expected: Total stashes: 0 / Safe to integrate: YES
```

### Step 5: Proceed with integration

---

## Dropping a Current-Branch Stash Safely

Only drop a stash after you have confirmed its contents are either:
- Already committed (verify with `git log --oneline -5`)
- Genuinely no longer needed

```bash
# Inspect contents first
git stash show -p stash@{0}

# Drop if safe
git stash drop stash@{0}
```

**Never use `git stash pop` without first running this safety check.**

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Safe (no stashes) or `--fail-if-stashes` not set |
| `1` | Stashes found and `--fail-if-stashes` is set |
| `4` | git executable error |

---

## TypeScript Read Model

A TypeScript read model that mirrors the Python script's output schema is
available at `src/lib/ops/stash-safety-check.ts`. It accepts fixture data
(no subprocess) and returns a `StashSafetyReport`. Use it for:

- UI surfaces showing stash state
- Build-time checks in Next.js API routes
- Jest tests exercising the schema

```typescript
import { buildStashSafetyReportFromFixture } from '@/lib/ops/stash-safety-check';

const report = buildStashSafetyReportFromFixture(
  stashFixtures,
  currentBranch,
  new Date().toISOString()
);
```

---

## Files

| File | Purpose |
|---|---|
| `scripts/integration/stash_safety_check.py` | Python CLI — run before integration |
| `src/lib/ops/stash-safety-check.ts` | TypeScript read model — fixture-based |
| `src/__tests__/integration/ops/stash-safety-check.test.ts` | Jest test suite |
| `docs/build/slices/OPS12_INTEGRATION_STASH_SAFETY_CHECK.md` | Slice contract |
