# 2026-06-05-source-artifact-binding-matrix - Source Artifact Binding Matrix

## Release ID

`2026-06-05-source-artifact-binding-matrix`

## Status

`candidate`

## Plain-English Summary

Adds a Source artifact binding matrix that checks every canonical artifact against its upload formats, declared download formats, renderer coverage, and gold-standard quality contract. This makes the Source redesign more honest: an artifact can be called wired only when its declared upload/download path is actually backed by intake or rendering support.

## Layer Impact

- `global-control-lane`: Adds shared Source QA/reporting code and a readiness report for all Source clients. No tenant data, route behavior, or database schema changes.

## Client Applicability

- All clients: The Source artifact readiness contract applies to every tenant using Source.
- Specific clients: None.
- Internal only: The generated report and tests are internal QA/audit artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-binding-matrix.ts`: new contract matrix for upload/download binding.
- `src/lib/source/artifact-operations.ts`: aligns gold-standard download declarations with actual renderer coverage for application inventory, response checklist, and BAFO question pack.
- `src/lib/source/__tests__/artifact-binding-matrix.test.ts`: focused coverage for upload allowlist binding, wired-download renderers, and honest partial status.
- `scripts/source/generate-artifact-binding-matrix.ts`: deterministic report generator.
- `reports/source-redesign/SOURCE_ARTIFACT_BINDING_MATRIX.md`: generated readiness matrix.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-operations.test.ts src/lib/source/__tests__/artifact-binding-matrix.test.ts --runInBand`
- PASS: `REPORT_TIMESTAMP=2026-06-05T00:00:00.000Z npx tsx scripts/source/generate-artifact-binding-matrix.ts`
- PASS: `npx eslint src/lib/source/artifact-binding-matrix.ts src/lib/source/artifact-operations.ts src/lib/source/index.ts src/lib/source/__tests__/artifact-binding-matrix.test.ts src/lib/source/__tests__/artifact-operations.test.ts scripts/source/generate-artifact-binding-matrix.ts`
- BLOCKED: `npx tsc --noEmit --pretty false` in this temporary worktree because the local dependency install is missing unrelated packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to main and deploy with the normal Vercel production flow. This change is pure QA/reporting and does not require a migration or feature flag.

## Rollback Plan

Revert this commit to remove the matrix/report and restore the prior artifact operations contract. No data rollback is required.

## Audit Evidence

- `reports/source-redesign/SOURCE_ARTIFACT_BINDING_MATRIX.md`
- `src/lib/source/__tests__/artifact-binding-matrix.test.ts`
- Future PR and CI checks once opened.

## Known Gaps

- This matrix does not make partial/planned artifacts fully wired. It exposes that current state: upload intake is ready for 33/33 artifacts, declared downloads are fully renderer-backed for 11/33, and 4/33 are wired end-to-end.
- Browser E2E upload/download proof against production remains a follow-up slice; this release adds the contract and report that define what the E2E must prove.
