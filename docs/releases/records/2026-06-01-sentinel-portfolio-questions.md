# 2026-06-01-sentinel-portfolio-questions — Sentinel Portfolio Questions

## Release ID

`2026-06-01-sentinel-portfolio-questions`

## Status

`candidate`

## Plain-English Summary

Sentinel can now classify and answer portfolio-level questions about sequencing, value overlap, and capacity blockers from a portfolio sequence packet. The answer names the relevant programs in plain language and gives an executive action instead of returning raw IDs or backend terminology.

## Layer Impact

- `global-control-lane`: adds a deterministic Sentinel broker helper for Wave 4 portfolio sequencing questions.

## Client Applicability

- All clients: available wherever a caller passes a client-scoped portfolio sequence packet.
- Specific clients: tested with a SkyHarbor Air synthetic portfolio.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/admin/broker/sentinel/portfolio-intents.ts` adds intent classification plus deterministic answer composition for:
  - what should I sequence next?
  - are any Moves cannibalizing value?
  - where are we capacity-blocked?
- `src/lib/admin/broker/sentinel/__tests__/portfolio-intents.test.ts` covers the three question types, named-entity output, no raw move IDs, and no cross-client leakage.

## QA / Validation

- PASS — `npx jest src/lib/admin/broker/sentinel/__tests__/portfolio-intents.test.ts --runInBand`
- PASS — `npx eslint src/lib/admin/broker/sentinel/portfolio-intents.ts src/lib/admin/broker/sentinel/__tests__/portfolio-intents.test.ts`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; Vercel production deploy picks up the new deterministic broker helper. No database migration is required.

## Rollback Plan

Use `gh pr revert <PR_NUMBER>` to remove the Sentinel portfolio intent helper and tests. The rollback has no schema impact.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production deploy: pending.
- Local validation output: pending.

## Known Gaps

This PR adds the deterministic broker helper only. Wiring it into the live Sentinel chat route is a follow-on integration slice.
