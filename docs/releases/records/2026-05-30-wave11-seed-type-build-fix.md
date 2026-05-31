# 2026-05-30-wave11-seed-type-build-fix — Wave 11 Seed Type Build Fix

## Release ID

`2026-05-30-wave11-seed-type-build-fix`

## Status

`candidate`

## Plain-English Summary

This release unblocks the production build after the Wave 11 authored genome seed files landed with three generated files referencing `PatternSeed` without declaring it locally. The fix adds the missing local type declarations only; it does not change seeded pattern content or tenant-facing runtime behavior.

## Layer Impact

`client-data-lane`: seed-script type safety for authored corpus data. The affected files are build-time corpus seed artifacts and do not alter runtime query paths, routing, authentication, or tenant resolution.

## Client Applicability

- All clients: production build stability for the shared authored corpus seed scripts.
- Specific clients: none.
- Internal only: release/build pipeline maintainers.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/seed/seed-banking-dom01-model-risk-part5.ts`
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part5.ts`
- `src/scripts/seed/seed-banking-dom12-data-governance-part4.ts`
- Adds local `PatternSeed` declarations to generated Wave 11 seed files that lacked them.

## QA / Validation

- Pass expected: targeted TypeScript validation for the Wave 11 seed files with `npx tsc --noEmit --pretty false --target ES2022 --module NodeNext --moduleResolution NodeNext ...`.
- Pass expected: `npx eslint` on changed seed files.
- Pass expected: `npm run release:check`.
- Pass expected: `git diff --check`.
- Pending until PR creation: GitHub CI and Vercel production build.

## Rollout Plan

Merge to `main`; Vercel production rebuild should complete successfully because the missing TypeScript identifiers are declared locally.

## Rollback Plan

Revert this release commit if needed. Since the change is type-only and does not modify seed data values or migrations, rollback does not require data repair.

## Audit Evidence

- Pull request for this release.
- Vercel production deployment logs showing the build no longer fails on missing `PatternSeed`.
- Local and CI validation output listed in the PR.

## Known Gaps

This release does not audit the semantic quality or regulatory wording of the generated Wave 11 seed content. It only restores TypeScript build correctness for files already merged to `main`.
