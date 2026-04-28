# OPS11 - Build Waves Merge Support

Slice ID: OPS11
Slice name: Build Waves Merge Support
Status: code_complete
Authored: 2026-04-26
Wave: Wave 12 (Product Polish + Azure Private Data Plane Prep)
Primary agent: Lane A (dual/ops11-build-waves-merge-support)
Depends on: OPS5, WAVE1

## Purpose

OPS11 extends the integration cherry-pick helper
(`scripts/integration/cherry_resolve.py`) with full `build-waves.json` merge
support. It fixes a key field-name bug and adds four new merge features to
ensure wave documents are correctly unified during cherry-pick resolution.

## Bug Fixed

The `merge_build_waves` function was keying wave objects by `w.get("id")`,
but the actual wave entries use `"waveId"` not `"id"`. This meant every wave
in a cherry-picked `build-waves.json` was incorrectly treated as a new entry
rather than merged with the HEAD wave, silently duplicating wave records.

The fix renames all lookups, insertions, and summary entries to use `"waveId"`
throughout `merge_build_waves`.

## Features Added

### 1. `mergedPrs` integer-array union
The `mergedPrs` integer arrays from HEAD and src are unioned with
deduplication. PR numbers already in HEAD are preserved in order; novel src
PR numbers are appended. This prevents duplicate PR entries when a wave has
been merged in both the HEAD and cherry-pick source.

### 2. `validationStatus` conservative merge
A rank-ordered conservative merge is applied:

```
not_run < tsc_clean < tests_green < build_green < ci_green < partial < full_pass
```

Rules:
- HEAD's `validationStatus` is never upgraded to a higher rank from src.
- If HEAD is `"failing"` (a special sentinel), it is preserved unconditionally.
- If src is `"failing"`, HEAD's status is preserved (failing is never
  propagated inward).
- Only a lower-rank src may replace HEAD (conservative demotion is allowed).

### 3. `nextAction` append-distinct handling
If src's `nextAction` is non-empty, different from HEAD's, and not already a
substring of HEAD's `nextAction`, it is appended to HEAD's value with a single
space join. This preserves both lanes' progress notes without duplication.

### 4. `status` conservative merge
Wave `status` is never downgraded. Rank order (ascending):

```
planned < in_progress < blocked < deferred < merged
```

If src has a higher status rank than HEAD, HEAD is promoted. HEAD is never
demoted.

## Files Changed

- `scripts/integration/cherry_resolve.py` — fixed `waveId` key bug;
  added `mergedPrs` union, `validationStatus` conservative merge,
  `nextAction` append-distinct, and `status` conservative merge.
- `src/lib/ops/waves-merge-utils.ts` — new TypeScript mirror of the
  `merge_build_waves` logic for deterministic unit testing.
- `src/__tests__/integration/ops/cherry-resolve-build-waves.test.ts` —
  new Jest suite covering all four new features plus the waveId bug fix.
- `docs/build/build-slices.json` — OPS11 appended.
- `docs/build/production-readiness.json` — validation_qa notes updated.
- `docs/build/build-waves.json` — wave-12 appended.
- `docs/build/slices/OPS11_BUILD_WAVES_MERGE_SUPPORT.md` — this file.

## Validation Commands

```
python3 scripts/integration/cherry_resolve.py --help
node_modules/.bin/tsc --noEmit --pretty false
node_modules/.bin/jest src/__tests__/integration/ops/cherry-resolve-build-waves.test.ts --no-coverage
```

## Acceptance Criteria

- `cherry_resolve.py --help` exits 0.
- `tsc --noEmit` exits 0 with no errors.
- All Jest tests in `cherry-resolve-build-waves.test.ts` pass.
- `merge_build_waves` correctly looks up waves by `waveId` field.
- `mergedPrs` arrays are unioned without duplicates.
- `validationStatus` is never upgraded by a lower-rank src value.
- HEAD `validationStatus = "failing"` is never replaced.
- Src `validationStatus = "failing"` never overwrites HEAD's status.
- `nextAction` from src is appended when different and not already a
  substring of HEAD's value.
- `status` is never downgraded from a higher rank to a lower rank.

## What This Slice Does NOT Do

- Does not deploy.
- Does not push to remote.
- Does not open pull requests.
- Does not run migrations.
- Does not call any model provider.
- Does not modify auth, supabase, or runtime code.
- Does not change build configuration.
- Does not claim `ci_green` for any wave.

## Cross-References

- OPS5 — Integration cherry-pick field-merge helper (the script being extended).
- WAVE1 — Build Wave Progress Tracker (the `build-waves.json` format this
  slice operates on).
- OPS1 — Agent Dispatch Operating Model (conflict policy this extends).
