# 2026-06-03-intelligence-pattern-governance - Intelligence Pattern Governance

## Release ID

`2026-06-03-intelligence-pattern-governance`

## Status

`candidate`

## Plain-English Summary

Adds visible responsible-AI controls to Sentinel active pattern recommendations
and adds a required promotion-gate contract to the Intelligence-to-Moves
handoff API. Pattern recommendations now show that they are AI-assisted
decision support, include confidence and evidence refs, and state that Sentinel
does not create or advance Moves autonomously.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer impact: Intelligence UI, Programs origination handoff contract, and AI
  liability governance catalogs.
- Runtime impact: no new database writes, migrations, or live Sentinel runtime.

## Client Applicability

- All clients: shared Intelligence and Programs control-plane behavior.
- Specific clients: none.
- Internal only: release evidence and verifier.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/intelligence/SentinelActivePatterns.tsx`
- `src/app/api/v1/programs/originate/from-thread/route.ts`
- `src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts`
- `src/__tests__/integration/programs/programs-origination-routes-guards.test.ts`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/build/INTELLIGENCE_PATTERN_GOVERNANCE_2026-06-03.md`
- `scripts/ai-liability/verify-intelligence-pattern-governance.mjs`

## QA / Validation

- Pass: `node scripts/ai-liability/verify-intelligence-pattern-governance.mjs`
- Pass: `npx jest src/__tests__/integration/programs/programs-origination-routes-guards.test.ts --runInBand`
- Pass: `npx jest src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts --runInBand`
- Pass: focused ESLint for changed source, tests, and verifier.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The visible Intelligence controls and API promotion-gate
contract become active for all clients.

## Rollback Plan

Revert this PR. No data rollback is required.

## Audit Evidence

- This release record.
- Build manifest.
- Verifier output.
- Jest output.
- Pull request and CI checks.

## Known Gaps

T233 can be treated as implemented for the audited Sentinel active-pattern
surface after merge and green CI. T234 remains `In progress` until a consuming
promotion dialog persists the human rationale and evidence packet before Move
creation.
