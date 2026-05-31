# 2026-05-30-seed-patternseed-dedupe-build-fix — Seed PatternSeed Dedupe Build Fix

## Release ID

`2026-05-30-seed-patternseed-dedupe-build-fix`

## Status

`candidate`

## Plain-English Summary

This release removes duplicate `PatternSeed` declarations from three Wave 11/12 seed files after the production build advanced past the missing Wave 13 declarations and then failed on duplicate identifiers. The seed data itself is unchanged.

## Layer Impact

- `client-data-lane`: restores TypeScript build correctness for generated corpus seed scripts.

## Client Applicability

- All clients: production build stability for shared corpus seed scripts.
- Specific clients: none.
- Internal only: seed authors and release operators.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/seed/seed-banking-dom01-model-risk-part5.ts`
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part5.ts`
- `src/scripts/seed/seed-banking-dom12-data-governance-part4.ts`
- Removes duplicate top-level `PatternSeed` interfaces where bottom-of-file `type PatternSeed` declarations already exist.

## QA / Validation

- FAIL before fix: Vercel production build for commit `f831338d013e131bb0e9e469332a9094fec62461` failed with `Duplicate identifier 'PatternSeed'`.
- PASS expected: targeted TypeScript validation across the affected part5 and part6 seed files.
- PASS expected: targeted ESLint on changed seed files.
- PASS expected: `npm run release:check`.
- PASS expected: Vercel production build after merge.

## Rollout Plan

Merge to `main`; Vercel production rebuild should complete successfully once duplicate declarations are removed.

## Rollback Plan

Revert this release commit if needed. Rollback would restore the duplicate type declarations and re-break production build, so use only if a broader seed typing fix supersedes it.

## Audit Evidence

- Vercel production build log showing `Duplicate identifier 'PatternSeed'`.
- Pull request and CI checks for this release.
- Post-merge Vercel production deployment status.

## Known Gaps

This release does not introduce a shared seed typing abstraction. It keeps the current generated-file pattern and removes only the duplicate declarations that block the build.
