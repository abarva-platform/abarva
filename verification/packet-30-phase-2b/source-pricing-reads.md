# Packet 30 Phase 2B — Source Pricing Reads Slice

## Scope

- Branch: `codex/packet-30-phase-2b-source-reads`
- Runtime module: `src/lib/source/pricing-submissions/dao.ts`
- Customer-facing surfaces: Source vendor response / pricing submission views that list active vendor pricing submissions and full submission history.

## Local Validation

```text
npx jest src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts --runInBand
npx eslint src/lib/source/pricing-submissions/dao.ts src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npm run release:check -- --base a1f23875e0bdb932ac4a50c9f487b165cf571212 --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 3 tests.
- Focused ESLint: pass.
- Runtime Supabase census: `176 files / 725 import-helper matches`; broad matches `325 files / 1647`.
- Diff whitespace check: pass.
- Release control: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations only (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no Source pricing DAO or touched-file errors.

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
