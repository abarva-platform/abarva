# 2026-06-02-decision-data-trust-admin-links - Decision Data Trust Admin Links

## Release ID

`2026-06-02-decision-data-trust-admin-links`

## Status

`candidate`

## Plain-English Summary

Decision-domain evidence-gap cards now send users to Admin Data Trust instead of the retired Home Data Trust alias. This keeps setup and evidence-governance work under Admin while preserving the decision-surface gestures.

## Layer Impact

- `global-control-lane`: updates shared tenant decision-home domain copy and gesture targets.
- `internal-admin`: reinforces Admin as the home for Data Trust remediation.

## Client Applicability

- All clients: receive the canonical Admin Data Trust links.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/programs/expert-kernel/domain/apex-decision-home.ts`
- `src/lib/programs/expert-kernel/domain/firstcapital-decision-home.ts`
- `src/lib/programs/expert-kernel/domain/meridian-vbc-bet-selection.ts`
- `src/lib/programs/expert-kernel/domain/meridian-vbc-decision-home.ts`
- `src/lib/programs/expert-kernel/domain/__tests__/admin-data-trust-links.test.ts`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/expert-kernel/domain/__tests__/admin-data-trust-links.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/expert-kernel/domain/apex-decision-home.ts src/lib/programs/expert-kernel/domain/firstcapital-decision-home.ts src/lib/programs/expert-kernel/domain/meridian-vbc-bet-selection.ts src/lib/programs/expert-kernel/domain/meridian-vbc-decision-home.ts src/lib/programs/expert-kernel/domain/__tests__/admin-data-trust-links.test.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. Vercel deploy updates the domain-card gesture targets immediately.

## Rollback Plan

Revert the PR. No migrations or durable data changes are included.

## Audit Evidence

- PR URL: pending
- Local validation: focused Jest, ESLint, whitespace check, and release control passed.
- CI: pending

## Known Gaps

This PR does not remove Home panel taxonomy or private data-plane implementation backlog. It only retargets decision-domain Data Trust gestures.
