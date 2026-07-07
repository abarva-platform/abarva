# 2026-06-02-source-internal-label-humanization — Remove internal scaffolding language from Source UI artifacts

## Release ID

`2026-06-02-source-internal-label-humanization`

## Status

`candidate`

## Plain-English Summary

This release removes several internal or developer-facing labels from the Source experience and replaces them with language a sourcing executive can understand. Artifact rows show human tier labels instead of raw internal tiers, empty-stage states point users to their AbarVa lead instead of a CLI command, pattern chips emphasize the human title before the internal pattern ID, and generated reports use calmer system-language instead of scaffold jargon.

## Layer Impact

- `global-control-lane`: Source UI copy, artifact labels, and export wording are shared application behavior for all clients.

## Client Applicability

- All clients: receive the humanized Source labels and copy updates.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: humanizes artifact tiers and empty-stage copy.
- `src/components/source/PatternDoctrineLink.tsx`: shows the human title first and demotes the internal pattern ID.
- `src/components/source/SourceProvenanceRibbon.tsx`: mirrors the pattern-chip humanization.
- `src/app/(maestro)/source/events/page.tsx`: replaces `seeded projected exposure` with `system-projected`.
- `src/components/source/SourceEventsPortfolio.tsx`: hides the internal `What is missing` note in production.
- `src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts`: replaces `Deterministic event report` with `System-generated report`.
- `src/lib/source/exports/renderers/narrative-docx.ts`: replaces scaffold-language cover copy with humanized authoring guidance.
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: regression coverage for the user-facing empty-state and authoring labels.

## QA / Validation

- PASS: `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx`
- PASS: `git diff --check`
- INFO: `npx tsc --noEmit --pretty false` is currently blocked by a repo-baseline missing module error in `tests/accessibility/public-axe.spec.ts` for `@axe-core/playwright`; unrelated to this slice.

## Rollout Plan

Merge to `main`, then deploy the Next.js app to production through the standard Vercel production deployment path. No database migration is required.

## Rollback Plan

Revert the application commit. No stored data changes are introduced by this slice.

## Audit Evidence

After merge, inspect the PR diff, CI output, Vercel deployment, and a signed-in Source session confirming the document empty state no longer exposes the backfill CLI command.

## Known Gaps

API route error details for missing scaffold rows still contain internal backfill wording and can be humanized in a later slice.
