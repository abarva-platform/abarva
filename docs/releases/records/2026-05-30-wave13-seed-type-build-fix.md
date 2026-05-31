# 2026-05-30-wave13-seed-type-build-fix — Wave 13 Seed Type Build Fix

## Release ID

`2026-05-30-wave13-seed-type-build-fix`

## Status

`candidate`

## Plain-English Summary

This release unblocks the production build after Wave 13 authored genome seed files merged with three generated banking files referencing `PatternSeed` without declaring it locally. The fix adds local type declarations only and does not change seed pattern content.

## Layer Impact

- `client-data-lane`: restores build correctness for authored corpus seed scripts added in Wave 13.

## Client Applicability

- All clients: production build stability for the shared corpus seed codebase.
- Specific clients: none.
- Internal only: seed authors, release operators, and build maintainers.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/seed/seed-banking-dom01-model-risk-part6.ts`
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part6.ts`
- `src/scripts/seed/seed-banking-dom12-data-governance-part5.ts`
- Adds local `PatternSeed` declarations to generated Wave 13 seed files that lacked them.

## QA / Validation

- FAIL before fix: Vercel production build for commit `e3f584567f67a19772fdcdca57b5856bcec41c80` failed on `seed-banking-dom01-model-risk-part6.ts` with `Cannot find name 'PatternSeed'`.
- PASS expected: targeted TypeScript validation across the Wave 13 seed files.
- PASS expected: targeted ESLint on changed seed files.
- PASS expected: `npm run release:check`.
- PASS expected: Vercel production build after merge.

## Rollout Plan

Merge to `main`; Vercel production rebuild should complete successfully because the missing TypeScript identifiers are declared locally.

## Rollback Plan

Revert this release commit if needed. Since the change is type-only and does not modify seed values or migrations, rollback does not require data repair.

## Audit Evidence

- Vercel production build log showing `Cannot find name 'PatternSeed'` on `seed-banking-dom01-model-risk-part6.ts`.
- Pull request and CI checks for this release.
- Post-merge Vercel production deployment status.

## Known Gaps

This release does not audit the semantic quality or regulatory wording of the generated Wave 13 seed content. It only restores TypeScript build correctness for files already merged to `main`.
