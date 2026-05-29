# 2026-05-28-packet-30-phase-2b-tower-value-reads — Packet 30 Phase 2B Tower Value Reads

## Release ID

`2026-05-28-packet-30-phase-2b-tower-value-reads`

## Status

`candidate`

## Plain-English Summary

This release moves the Tower portfolio value rollup read path onto the Phase 2A Azure read boundary. The Move value detail and CFO attestation flows remain on the existing value-state transaction path because they compute and write value-state rows.

## Layer Impact

- data-plane-lane: uses `azureRead.query` for Tower portfolio value rollup reads.
- tower-lane: affects `/tower/portfolio` and the portfolio form of `/api/tower/value-states`.
- runtime-app-lane: no UI behavior change intended.
- client-data-lane: no data changes.

## Client Applicability

- All clients using Tower portfolio/value surfaces.
- No tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- `getPortfolioValueRollup` now reads portfolio moves, Source projected value, and P10 dependency arrows through `azureRead`.
- Existing value detail and attestation paths are intentionally unchanged because they write computed and verified value-state rows.
- Added focused tests covering Azure read SQL usage, rollup totals, dependency arrows, and Source projected value fail-soft behavior.

## QA / Validation

Validation performed:

```text
npx jest src/lib/tower/value-states/__tests__/repository.azure-read.test.ts --runInBand
npx eslint src/lib/tower/value-states/repository.ts src/lib/tower/value-states/__tests__/repository.azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npm run release:check -- --base b2a68fd97d20908a5c60c08ef5f4817a297413d1 --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 2 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/warn, unchanged at `176 files / 725 import-helper matches`; broad matches unchanged at `325 files / 1647` because this slice moves a direct Postgres value read, not a Supabase helper import.
- Diff whitespace check: pass.
- Release control: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no Tower value-state errors.

Additional release-gate validation is recorded in `verification/packet-30-phase-2b/tower-value-reads.md`.

## Rollout Plan

Merge after focused validation, release gate, CI, and post-merge production verification. Runtime behavior changed in Tower value read helpers, so production alias smoke and post-deploy crawl are required after merge.

## Rollback Plan

Revert this PR to restore the previous value-state pool read path for Tower portfolio value rollups.

## Audit Evidence

- Packet 30 Phase 2A established `azureRead`.
- Tower aggregate/page read adapters already cover the older Tower page reads; this slice closes the high-value portfolio rollup read path.
- Prior Source pricing slice landed with `0 P0 / 83 P1 / 0 P2` post-deploy crawl.

## Known Gaps

- This does not migrate value detail reads because that path currently computes and writes projected/tracked value-state rows.
- This does not migrate CFO attestation mutation paths.
- This does not fix standing Packet 32 C8 P1 route/backlog issues.
