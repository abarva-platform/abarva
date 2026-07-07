# 2026-05-31-cxo-quality-gates — CXO Answer Quality Gates

## Release ID

`2026-05-31-cxo-quality-gates`

## Status

`candidate`

## Plain-English Summary

Adds a shared CXO answer-quality gate so live and golden agent tests catch the failures a customer would notice first: raw internal IDs, tenant leakage, fallback/timeouts, implementation details, vague next steps, and long unreadable answers. The agent-quality corpus now covers SkyHarbor in addition to Apex, Meridian, and First Capital.

## Layer Impact

- `global-control-lane`: Adds shared QA logic used by agent-quality and Atlas live-smoke harnesses.
- `internal-admin`: Improves internal validation of production-readiness and pilot-readiness before a CXO sees the product.

## Client Applicability

- All clients: The quality gate is tenant-neutral.
- Specific clients: Apex Retail, Meridian Health, First Capital, and SkyHarbor are covered by corpus fixtures.
- Internal only: QA harness execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- New `src/lib/agent/quality/cxo-answer-quality.ts` validator and unit tests.
- Atlas live-prod smoke now records CXO answer-quality failures in its per-turn scorecard.
- Agent-quality live runner now applies the shared validator and can run SkyHarbor demo personas.
- New SkyHarbor golden-answer fixture set.

## QA / Validation

- Pass: `npx jest src/lib/agent/quality/__tests__/cxo-answer-quality.test.ts --runInBand` (7 tests).
- Pass: `npm run qa:agent-quality:corpus` (60 cases; SkyHarbor included).
- Pass: `npm run qa:agent-quality:runner -- --mode dry-run --tenant skyharbor-air` (10 SkyHarbor cases selected).
- Pass: `npx eslint src/lib/agent/quality src/scripts/qa/agent-quality-corpus-validate.ts src/scripts/qa/agent-quality-live-runner.ts scripts/qa/atlas-live-prod-smoke.ts`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` and deploy. This PR adds validation/harness coverage only; it does not change user-facing product runtime behavior.

## Rollback Plan

`gh pr revert <PR number>` removes the additional QA gates and SkyHarbor fixtures. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local validation: pending.

## Known Gaps

This is the first Wave 0 gate. A later slice should extend the Playwright tenant matrix to include SkyHarbor login/logout surface smoke and should persist HTML reports for the full three-tenant live run.
