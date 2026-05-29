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

- PR: https://github.com/anandsundaram-hash/abarva/pull/2403
- Merge commit: `a1f23875e0bdb932ac4a50c9f487b165cf571212`
- Production deployment: `dpl_2zQ8LuZhmvzmwGKkAwZQwDKfvptU`
- Production alias: `https://app.abarva.ai`
- Production smoke: `/` and `/product` returned HTTP 200 with `data-dpl-id="dpl_2zQ8LuZhmvzmwGKkAwZQwDKfvptU"`
- Post-deploy crawl run: `26613027124`
- Post-deploy crawl artifact: https://github.com/anandsundaram-hash/abarva/actions/runs/26613027124/artifacts/7281520621
- P0/P1/P2 counts: `0 P0 / 82 P1 / 0 P2`
