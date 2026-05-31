# 2026-05-30-wave14-seed-type-build-fix — Wave 14 Seed Type Build Fix

## Release ID

`2026-05-30-wave14-seed-type-build-fix`

## Status

`candidate`

## Plain-English Summary

This release preempts the next production build failure from the Wave 14 seed drop by adding the missing local `PatternSeed` declaration to the generated banking TPRM part 5 seed file. Seed pattern content is unchanged.

## Layer Impact

- `client-data-lane`: restores TypeScript build correctness for a generated corpus seed script added in Wave 14.

## Client Applicability

- All clients: production build stability for the shared corpus seed codebase.
- Specific clients: none.
- Internal only: seed authors, release operators, and build maintainers.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/seed/seed-banking-dom11-tprm-part5.ts`
- Adds a local `PatternSeed` declaration to the generated Wave 14 seed file that lacked it.

## QA / Validation

- PASS expected: targeted TypeScript validation across Wave 14 seed files.
- PASS expected: targeted ESLint on the changed seed file.
- PASS expected: `npm run release:check`.
- PASS expected: Vercel production build after merge.

## Rollout Plan

Merge to `main`; Vercel production rebuild should complete successfully because the missing TypeScript identifier is declared locally.

## Rollback Plan

Revert this release commit if needed. Since the change is type-only and does not modify seed values or migrations, rollback does not require data repair.

## Audit Evidence

- PR #2639 Wave 14 file list showing the added TPRM part 5 seed file.
- Pull request and CI checks for this release.
- Post-merge Vercel production deployment status.

## Known Gaps

This release does not audit the semantic quality or regulatory wording of the generated Wave 14 seed content. It only restores TypeScript build correctness for files already merged to `main`.
