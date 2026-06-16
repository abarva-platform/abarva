# 2026-06-16-source-aq1b-docx-html-rendering — Source Generated Artifacts Render to DOCX + HTML

## Release ID

`2026-06-16-source-aq1b-docx-html-rendering`

## Status

`candidate`

## Plain-English Summary

Generated Source documents no longer surface raw Markdown as the normal user-facing download. When a Source strategy memo or scope memo is generated, AbarVa now renders a formatted DOCX as the primary downloadable artifact, renders an HTML preview companion, and keeps the Markdown body as internal source for re-rendering and lineage.

## Layer Impact

- `global-control-lane`: updates shared Source artifact generation and download behavior for generated Source deliverables.
- `internal-admin`: improves File Cabinet operator behavior by labeling HTML rows as previews while keeping DOCX as the normal download.

## Client Applicability

- All clients: applies to generated Source artifacts that use the shared generation route and have DOCX/HTML renderers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a generated-artifact rendering helper that renders DOCX primary, HTML preview, and Markdown source.
- Updates `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` to persist rendered artifacts to the existing `source-artifacts` Blob path and File Cabinet metadata.
- Updates `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts` so File Cabinet downloads return the stored DOCX by default and honor `?format=html` / `?format=md`.
- Updates `src/components/source/FileCabinetPanel.tsx` so HTML artifacts display as `Preview`.
- Adds focused tests for rendered generated artifacts and download format behavior.

## QA / Validation

- PASS — Focused Jest: `npx jest src/lib/source/__tests__/generated-artifact-rendering.test.ts 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts --runInBand`
- PASS — ESLint: `npx eslint src/app/api/v1/source/ src/lib/source/ src/components/source/FileCabinetPanel.tsx` completed with no errors; warnings are pre-existing in unrelated Source files.
- BLOCKED locally — Full `npx tsc --noEmit --pretty false` is blocked in the local symlinked dependency tree by missing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; CI must provide final typecheck.
- PASS — Behavior tests: `npm run test:behaviors` passed 15 suites / 195 tests.
- PASS — Release check: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- NOT RUN YET — CI and live browser/download proof are required before release.

## Rollout Plan

Merge to main after green CI, deploy the Azure Container Apps main image, then generate disposable SkyHarbor Source artifacts to prove DOCX and HTML are stored in Blob and retrieved through the live File Cabinet/download route.

## Rollback Plan

Revert the PR. Postgres artifact bodies remain canonical Markdown, so rollback restores the AQ1 behavior where generated artifacts can still be downloaded from Blob/File Cabinet as Markdown. No migration rollback is required.

## Audit Evidence

- PR: to be added when opened.
- Live proof required: disposable SkyHarbor event, DOCX files downloaded to `~/Downloads`, File Cabinet screenshot, opened DOCX screenshot, and archived event response.

## Known Gaps

- This slice does not add AQ2 section-conformance badges.
- This slice does not add AQ3 async quality orchestration.
- Markdown remains the internal canonical body and can be explicitly requested for lineage/debugging, but it is no longer the default user-facing download when DOCX rendering succeeds.
