# Packet 30 Phase 2B — Programs Queries Read Slice

## Scope

- Branch: `codex/packet-30-phase-2b-programs-queries`
- Runtime module: `src/lib/programs/queries.ts`
- Customer-facing surfaces: Moves/program details, Tower portfolio/value surfaces that consume program modules, work items, milestones, risks, Maestro flags, approvals, and phase snapshots.

## Local Validation

```text
npx jest src/lib/programs/queries.azure-read.test.ts --runInBand
npx eslint src/lib/programs/queries.ts src/lib/programs/queries.azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 5 tests.
- Focused ESLint: pass.
- Runtime Supabase census: `176 files / 727 import-helper matches`; broad matches `325 files / 1651`.
- Diff whitespace check: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations only; no Programs query errors after the local thenable-type fix.

## Post-Merge Evidence

To be completed after PR merge and production verification:

- PR:
- Merge commit:
- Production deployment:
- Production alias:
- Production smoke:
- Post-deploy crawl run:
- Post-deploy crawl artifact:
- P0/P1/P2 counts:
