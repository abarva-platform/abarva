# 2026-06-01-tower-atlas-accountability — Tower Atlas Accountability Controls

## Release ID

`2026-06-01-tower-atlas-accountability`

## Status

`candidate`

## Plain-English Summary

Tower's Atlas program pressure executive brief now shows that the recommendation is AI-assisted decision support, cites the deterministic signal evidence behind it, and exposes the missing-data and assumption limits before an executive can treat it as an action.

## Layer Impact

`global-control-lane` — shared Tower/Atlas user-facing decision-support controls. No schema, ingestion, private data-plane, or tenant data changes.

## Client Applicability

- All clients: Tower users who can see the program pressure executive brief.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/tower/program-pressure-view.ts` adds an Atlas brief accountability packet using the shared human decision-control spine.
- `src/components/tower/ProgramPressureCards.tsx` renders the AI-assisted decision-support label, human approval boundary, missing-data banner, and evidence basis.
- `docs/security/ai-surface-control-catalog.json` adds the Tower Atlas program pressure brief to the CI-enforced AI surface catalog.
- `src/__tests__/integration/tower/program-pressure-cards.test.ts` covers the accountability packet and deterministic seed fallback.

## QA / Validation

- Pass — `npx jest src/__tests__/integration/tower/program-pressure-cards.test.ts --runInBand`
- Pass — `npx eslint src/lib/tower/program-pressure-view.ts src/components/tower/ProgramPressureCards.tsx src/__tests__/integration/tower/program-pressure-cards.test.ts`
- Pass — `npm run audit:ai-surface-controls`
- Pass — `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass — `npm run release:check -- --base origin/main --head HEAD`
- Pass — `git diff --check`

## Rollout Plan

Merge to `main`. The change becomes active with the normal Vercel deployment for the shared app/control plane.

## Rollback Plan

Revert the PR to remove the new Tower brief accountability packet, rendered disclosure, catalog row, tests, and this release record. No data migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2753
- CI checks: pending.
- Local validation output: focused Jest, ESLint, AI surface catalog audit, TypeScript, release check, and diff check passed.

## Known Gaps

This slice covers the Tower Atlas program pressure executive brief. Broader Tower surfaces, including the older Atlas executive brief canvas and projection/forecast panels, still need their own accountability retrofit.
