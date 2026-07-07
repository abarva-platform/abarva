# 2026-06-01-intelligence-tenant-corpus-rendering — Intelligence Tenant Corpus Rendering

## Release ID

`2026-06-01-intelligence-tenant-corpus-rendering`

## Status

`candidate`

## Plain-English Summary

Fixes the Intelligence Brief / Map surface so seeded non-Apex tenant corpus data renders instead of an incorrect "corpus not yet seeded" empty state. Meridian Health and First Capital Financial now use their existing seeded corpus fixtures when the server resolves those tenants.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence page data binding and brief export binding.
- `global-control-lane`: Adds regression coverage for tenant corpus resolution and Meridian Brief rendering.

## Client Applicability

- All clients: The no-fabrication rule still applies to every tenant.
- Specific clients: Meridian Health and First Capital Financial now render their seeded corpus fixtures on Intelligence Brief / Map.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a tenant-neutral Intelligence corpus payload type.
- Adds a server-side tenant corpus resolver for Apex Retail, Meridian Health, and First Capital Financial.
- Updates `/intelligence` to pass tenant corpus data into the page instead of an Apex-only prop.
- Updates Intelligence DOCX/PDF export loading to use the same tenant corpus resolver.
- Updates stale comments that described Meridian and First Capital as unseeded.
- Adds regression tests for tenant corpus resolution and Meridian Brief rendering.

## QA / Validation

- PASS: `npx jest src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts --runInBand`
- PASS: `npx eslint src/app/intelligence/page.tsx src/components/intelligence-v3/IntelligenceV3Page.tsx src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx src/lib/intelligence-v3/tenant-corpus-loader.ts src/lib/intelligence-v3/corpus-types.ts src/lib/intelligence-v3/sentinel-intel-context.ts src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/lib/intelligence/exports/index.ts src/lib/intelligence/exports/brief-payload.ts src/components/intelligence-v4/CorpusNotSeededState.tsx`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to main and deploy through the normal Vercel production control-plane release. No migration or feature flag is required.

## Rollback Plan

Revert this PR. The rollback restores the prior Apex-only corpus binding and the prior export behavior. No data migration is involved.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Local validation: pending.
- Visual cue: `/intelligence` for Meridian Health should render the seeded Intelligence Brief instead of "Meridian Health's Intelligence corpus is not yet seeded."

## Known Gaps

SkyHarbor has no dedicated `knowledge-corpus/fixtures` file in this slice, so this fix does not create new SkyHarbor Brief / Map corpus content. It only renders corpus payloads that already exist.
