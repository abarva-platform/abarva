# 2026-05-31-tower-ai-cost-ledger — Tower AI Ops Cost Ledger

## Release ID

`2026-05-31-tower-ai-cost-ledger`

## Status

`candidate`

## Plain-English Summary

Tower value detail now carries a parallel AI Ops Cost Ledger beside the value ledger. The ledger tracks projected three-year AI operating cost, realized cost to date, variance reason code, pricing-tier pressure, and model-tier drift, then raises a warning when realized cost is more than 10% above the locked projection with no reason code on file.

## Layer Impact

- `global-control-lane`: Adds the shared Tower AI ops cost ledger contract and variance-alert helper.
- `global-control-lane`: Extends the Tower value detail read model and Tower value page so run-cost pressure appears beside value attainment.

## Client Applicability

- All clients: Tower program value pages receive the parallel AI ops cost panel.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `src/lib/tower/ai-ops-cost-ledger.ts`.
- Adds `src/lib/tower/__tests__/ai-ops-cost-ledger.test.ts`.
- Extends `TowerMoveValueDetail` with `aiOpsCost`.
- Renders the AI Ops Cost Ledger on `/tower/programs/[programId]/value`.

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/ai-ops-cost-ledger.test.ts --runInBand`
- Pass: `npx eslint src/lib/tower/ai-ops-cost-ledger.ts src/lib/tower/__tests__/ai-ops-cost-ledger.test.ts src/lib/tower/value-states/index.ts src/lib/tower/value-states/types.ts src/lib/tower/value-states/repository.ts 'src/app/(maestro)/tower/programs/[programId]/value/page.tsx'`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run test:behaviors`
- Pass: `git diff --check`
- Pass after record fix: `npm run release:check -- --base origin/main --head HEAD` initially rejected pending QA labels in this record; record updated to explicit statuses and the gate was rerun.

## Rollout Plan

Merge to main and allow the normal Vercel production deploy. No migration is required; the ledger is optional and computed from Tower value-state detail until a live inference, embedding, and eval cost table lands.

## Rollback Plan

Revert the PR. Tower value detail returns to the prior value-only view.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2673
- CI checks on the PR.
- Local validation commands listed above.

## Known Gaps

The first ledger is estimated from the Tower license-dollar layer because there is not yet a live run-cost table for inference, embedding, and eval realized spend. The panel labels this source explicitly so operators do not confuse it with audited model-gateway billing.
