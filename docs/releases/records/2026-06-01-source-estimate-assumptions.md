# 2026-06-01-source-estimate-assumptions — Source Estimate Assumption Disclosures

## Release ID

`2026-06-01-source-estimate-assumptions`

## Status

`candidate`

## Plain-English Summary

Source savings, cost, and award economics shown in the BAFO and award decision areas now carry an explicit estimate-basis disclosure. Users can see that the values are directional and which assumptions must hold before relying on them.

## Layer Impact

Global control lane. This changes shared Source UI behavior for estimate and award economics, without changing data-plane schema or persistence.

## Client Applicability

- All clients: Applies to shared Source event detail views using the BAFO scenario and award decision surfaces.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/EstimateAssumptionDisclosure.tsx` adds a reusable estimate-basis and assumptions disclosure.
- `src/components/source/SourceEventDetailPage.tsx` displays estimate assumptions in BAFO scenario comparison and award decision sections.
- `src/components/source/__tests__/EstimateAssumptionDisclosure.test.tsx` verifies directional estimate labeling and assumption visibility.

## QA / Validation

- Pass: `npx jest src/components/source/__tests__/EstimateAssumptionDisclosure.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/EstimateAssumptionDisclosure.tsx src/components/source/SourceEventDetailPage.tsx src/components/source/__tests__/EstimateAssumptionDisclosure.test.tsx`
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. The disclosure becomes visible on the next Vercel deployment for Source event detail pages.

## Rollback Plan

Revert this PR to remove the disclosure component and the two Source event detail placements.

## Audit Evidence

- PR URL: pending.
- Local validation output: focused Jest, focused ESLint, TypeScript, release check, and diff whitespace check passed locally on 2026-06-01.
- CI evidence: pending.

## Known Gaps

This covers visible BAFO and award-decision estimate surfaces. Other Source exports and workbook/PDF renderers already carry some assumption language, but should still be cataloged row by row before T240 is marked fully done.
