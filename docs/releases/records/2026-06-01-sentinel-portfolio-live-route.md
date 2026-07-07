# 2026-06-01-sentinel-portfolio-live-route — Sentinel Portfolio Live Route

## Release ID

`2026-06-01-sentinel-portfolio-live-route`

## Status

`candidate`

## Plain-English Summary

This release wires Wave 4 portfolio sequencing answers into the live Sentinel query path. Sentinel can now answer practical CXO questions like what to sequence next, where value claims overlap, and where capacity is constrained from the Tower portfolio sequence packet.

## Layer Impact

- global-control-lane: Updates shared Sentinel answer composition for all clients with portfolio sequencing substrate.
- internal-admin: Improves the live QA path for pilot-readiness checks by removing the gap where only the broker helper knew the answer.

## Client Applicability

- All clients: Sentinel still falls back to existing pattern reasoning for non-portfolio questions.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air receive portfolio-sequencing answers from the current Wave 4 sequence packet.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds portfolio-intent detection inside `runSentinelTurn`.
- Adapts the Tower portfolio sequence view model into the Sentinel portfolio-answer helper.
- Adds a grounded citation and disclosure for Tower-sequence-packet answers.
- Adds tests for sequence-next, capacity-blocker, and normal pattern fallback behavior.

## QA / Validation

- Pass: `npx jest src/lib/sentinel/__tests__/orchestrator.test.ts src/lib/admin/broker/sentinel/__tests__/portfolio-intents.test.ts --runInBand`
- Pass: `npx eslint src/lib/sentinel/orchestrator.ts src/lib/sentinel/__tests__/orchestrator.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The change is active immediately on the existing `/api/v1/sentinel/query` route and does not require a migration.

## Rollback Plan

Revert this PR. The route will return to the existing pattern-manifest Sentinel behavior.

## Audit Evidence

- PR URL: pending.
- Local validation output: pending.
- Related evidence packet: `docs/build/WAVE-4-QA-EVIDENCE-2026-05-31.md`.

## Known Gaps

- Portfolio answers use signature planning fixtures for Meridian and SkyHarbor until their full program-instance substrate is loaded.
