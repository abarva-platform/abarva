# Runtime Supabase Import Baseline

Date: 2026-05-28
Packet: 30 Phase 2A
Mode: warn-only

## Baseline Command

```text
node scripts/audit/runtime-supabase-import-census.mjs
```

## Baseline Counts

- Runtime directories scanned: `src/app`, `src/lib`
- Test files excluded: yes
- Files with Supabase import/helper matches: 182
- Supabase import/helper matches: 762
- Files with broad matches including `.from(` query-builder calls: 330
- Broad runtime matches including `.from(` query-builder calls: 1,705

## Interpretation

This is a baseline for Phase 2B/2C burn-down tracking. It is not a pass/fail gate yet. Packet 30 invariant I2 remains the target: zero `@supabase/*` runtime imports. Phase 2D will convert the warn-only census into a blocking CI guard after the runtime migration is complete.
