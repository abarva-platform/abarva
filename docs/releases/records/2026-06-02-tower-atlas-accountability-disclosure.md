# 2026-06-02-tower-atlas-accountability-disclosure — Tower Atlas Accountability Disclosure

## Release ID

`2026-06-02-tower-atlas-accountability-disclosure`

## Status

`candidate`

## Plain-English Summary

Tower and Atlas executive-facing surfaces now disclose that Atlas output is AI-assisted decision support, not an autonomous decision. The executive brief, Tower page, and Atlas chat adapter surface human-review boundaries, citation posture, assumptions, confidence/missing-data limits, and deterministic-seed caveats.

## Layer Impact

`global-control-lane` — shared Tower/Atlas control-plane presentation and deterministic view-model behavior. No private data-plane, schema, ingestion, Source, Moves, admin setup/data-load, or shared AI label primitive changes.

## Client Applicability

- All clients: Tower users who can access the Tower page, executive brief tab, Atlas chat rail, or Atlas executive brief canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/tower/atlas-executive-brief-canvas.ts` adds structured accountability disclosure metadata to the Atlas executive brief view.
- `src/components/tower/AtlasExecutiveBriefCanvas.tsx` renders the decision-support label, human review boundary, citation summary, assumptions, and cited signal bases.
- `src/lib/tower/atlas-interpretation-view.ts` adds disclosure metadata for Tower Atlas interpretations.
- `src/components/tower/TowerIndexPage.tsx` renders Tower-level Atlas decision-support disclosure in the masthead and executive brief tab.
- `src/components/atlas/AtlasChatPanel.tsx` defaults the Atlas chat dock quote to an AI-assisted decision-support disclosure.
- Focused tests cover the new view-model and rendered/static disclosure contracts.

## QA / Validation

- Pass — `npx jest src/__tests__/integration/tower/atlas-executive-brief-canvas.test.ts --runInBand`
- Pass — `npx jest src/__tests__/integration/tower/tower-atlas-reasoning-trace.test.ts --runInBand`
- Pass — `npx jest src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand`
- Pass — `npx eslint src/lib/tower/atlas-executive-brief-canvas.ts src/components/tower/AtlasExecutiveBriefCanvas.tsx src/lib/tower/atlas-interpretation-view.ts src/components/tower/TowerIndexPage.tsx src/components/atlas/AtlasChatPanel.tsx src/__tests__/integration/tower/atlas-executive-brief-canvas.test.ts src/__tests__/integration/tower/tower-atlas-reasoning-trace.test.ts src/components/atlas/__tests__/AtlasChatPanel.test.tsx`
- Pass — `git diff --check`
- Pass — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge the PR to `main`. The disclosure becomes active through the normal Vercel app deployment for the shared control plane. No feature flag or migration rollout is required.

## Rollback Plan

Revert the PR to remove the disclosure metadata, UI copy, tests, and release record. No migration or private-data rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2787
- Local validation output: focused Jest suites, scoped ESLint, diff check, and release check passed locally.
- CI checks: pending after PR creation.

## Known Gaps

This is the T241/T242-light disclosure slice for Tower/Atlas executive surfaces only. It does not modify Source, Moves, private data-plane records, admin setup/data-load, or shared AI label primitives.
