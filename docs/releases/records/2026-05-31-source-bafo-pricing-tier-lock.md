# 2026-05-31-source-bafo-pricing-tier-lock — Source BAFO Pricing-Tier Lock

## Release ID

`2026-05-31-source-bafo-pricing-tier-lock`

## Status

`candidate`

## Plain-English Summary

Source BAFO plans can now add a pricing-tier lock clause when projected AI usage is likely to breach a vendor pricing tier within 24 months. The clause asks vendors to hold the current per-call pricing tier until a stated date or call threshold, and requires advance notice plus a renegotiation window before repricing.

## Layer Impact

- `global-control-lane`: Adds a shared BAFO counter-template helper for AI pricing-tier lock clauses.
- `global-control-lane`: Extends Source BAFO negotiation plans and markdown rendering with counter clauses, including anonymized peer provenance.

## Client Applicability

- All clients: The clause engine is available to any Source BAFO plan with projected inference usage and a vendor pricing ladder.
- Specific clients: The regression fixture covers an Apex Retail Adobe CDP BAFO scenario.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `src/lib/source/sourcing/bafo-counter-templates.ts`.
- Extends `src/lib/source/bafo-negotiation-types.ts` with optional vendor inference pricing inputs and rendered counter clauses.
- Updates `src/lib/source/bafo-negotiation.ts` so BAFO plans and markdown include pricing-tier lock clauses when triggered.
- Adds focused tests for the pricing-tier trigger and the rendered BAFO plan.

## QA / Validation

- Pass: `npx jest src/lib/source/sourcing/__tests__/bafo-counter-templates.test.ts src/lib/source/__tests__/bafo-negotiation-pricing-tier-lock.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/sourcing/bafo-counter-templates.ts src/lib/source/sourcing/__tests__/bafo-counter-templates.test.ts src/lib/source/__tests__/bafo-negotiation-pricing-tier-lock.test.ts src/lib/source/bafo-negotiation.ts src/lib/source/bafo-negotiation-types.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run qa:agent-quality:corpus`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main. No migration is required; the new inputs are optional and only affect BAFO plans that provide inference pricing projections.

## Rollback Plan

Revert the PR. Existing BAFO plans remain compatible because the new counter-clause arrays are additive and computed from optional input.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI checks on the PR.
- Local validation commands listed above.

## Known Gaps

The clause only renders when projected call volume and pricing ladder data are present. Vendor scorecards without real inference pricing remain explicit gaps rather than guessed economics.
