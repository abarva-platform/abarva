# 2026-06-29-tower-right-answer-contract-pilot — Tower right-answer validation pilot

## Release ID

`2026-06-29-tower-right-answer-contract-pilot`

## Status

`candidate`

## Plain-English Summary

Adds a small but concrete Tower right-answer contract pilot plus a server-side runner. The Tower question bank already defines thousands of possible CIO/CXO questions and their intended route/read models; this change adds the missing validation layer that checks whether a visible answer actually contains the expected metric values, avoids contradictory values, returns the required artifact shape, and avoids raw/internal language.

## Layer Impact

- `global-control-lane`: Adds shared Tower answer validation utilities, contract generation from governed metric packets, and QA report generators. It does not change the live user path.
- `internal-admin`: Adds a local QA script that produces an HTML report for operator review.

## Client Applicability

- All clients: The contract/scorer is tenant-keyed and intended to scale across all Tower tenants.
- Specific clients: The first pilot examples use SkyHarbor-style Tower questions and metric expectations.
- Internal only: Yes, this PR is a QA/control-plane pilot only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer-contract.ts`: Right-answer contract types, metric-packet-backed contract generation, and scoring function.
- `src/lib/cio-tower/__tests__/answer-contract.test.ts`: Unit tests for pass/fail cases.
- `scripts/qa/tower-answer-contract-pilot.ts`: Generates a Downloads HTML report that shows question, right-answer contract, observed answer, and score.
- `scripts/qa/tower-answer-contract-server-runner.ts`: Generates right-answer contracts from live `cio_tower` metric packets and scores latest persisted answer traces without browser crawling.
- `package.json`: Adds `npm run tower:cio:answer-contracts`.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand` passed, 1 suite / 5 tests.
- Pass: `npx eslint src/lib/cio-tower/answer-contract.ts src/lib/cio-tower/__tests__/answer-contract.test.ts scripts/qa/tower-answer-contract-pilot.ts` passed.
- Pass: `TOWER_ANSWER_CONTRACT_OUT_DIR=/Users/anand/Downloads/tower-answer-contract-pilot-latest npx tsx scripts/qa/tower-answer-contract-pilot.ts` generated the pilot report.
- Blocked locally: `TOWER_CONTRACT_LIMIT=20 TOWER_ANSWER_CONTRACT_SERVER_OUT_DIR=/Users/anand/Downloads/tower-answer-contract-server-latest npm run tower:cio:answer-contracts` stopped before DB access because neither the shell nor `/Users/anand/Projects/nexus/.env.local` contains `DATABASE_URL`. The command is ready for an env-injected VNet/ACA operator run.
- Pass: `npm run release:check` passed after this release record was updated.

## Rollout Plan

Merge to main. No ACA deployment is required for the pilot because it is not yet wired into the live route. The next release can connect this scorer to the browser/live trace runner.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this QA-only pilot.
- Shared runtime mutators: None.
- Approved image digest: N/A.
- ACA runtime invariant: N/A.
- Worker image invariant: N/A.
- Feature/env flag update path: N/A.
- Live signed-in proof required: Not for this pilot; required when connected to the live Tower route/scorer.

## Rollback Plan

Revert the QA utility, tests, and script. No schema, runtime, or data changes.

## Audit Evidence

- `npm test -- --runTestsByPath src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`
- `npx tsx scripts/qa/tower-answer-contract-pilot.ts`
- `npm run release:check`
- Generated report: `/Users/anand/Downloads/tower-answer-contract-pilot-*/report.html`

## Known Gaps

This pilot does not run the live signed-in browser route. The server-side runner can generate contracts for the full question bank, but trace coverage depends on persisted `cio_tower.answer_traces` from actual/server answer executions.
