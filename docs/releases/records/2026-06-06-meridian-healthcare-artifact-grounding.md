# 2026-06-06-meridian-healthcare-artifact-grounding — Ask Healthcare And Artifact Grounding

## Release ID

`2026-06-06-meridian-healthcare-artifact-grounding`

## Status

`candidate`

## Plain-English Summary

Sentinel Ask now has stronger response discipline for healthcare modernization, payer-provider analytics, and pilot artifact questions. When a CXO asks about Meridian-style clinical, plan, Databricks, approval, board, Move, Source, or go/no-go topics, the agent is instructed to name the concrete evidence terms, artifacts, owners, and gates instead of giving a vague strategic paragraph.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence Ask system prompt and guardrail tests. The change applies to all clients but is tenant-scoped by the existing identity and isolation rules.

## Client Applicability

- All clients: Yes, for Intelligence Ask answer discipline.
- Specific clients: Meridian Health System is the motivating pilot QA case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: Adds healthcare modernization and artifact approval response discipline.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: Locks the new prompt terms so future edits cannot remove them silently.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed with 2 suites and 31 tests.
- Pass: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts` completed with exit code 0.
- Pass: `git diff --check` completed with exit code 0.
- Pass: `npm run release:check -- --base origin/main --head HEAD` passed; Release Control Gate and Pilot Data Loader Gate passed.
- Pending post-deploy validation: rerun the Meridian hard-question QA crawl against the live production deployment and compare watch flags.

## Rollout Plan

Merge to `main` and deploy the Vercel production app. The prompt change becomes active on the next Intelligence Ask request after deployment.

## Rollback Plan

Revert the PR and redeploy production. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production deployment: pending.
- QA crawl report: planned under `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/`.

## Known Gaps

This change does not load new Meridian data or alter retrieval. It improves how Sentinel uses and presents already-loaded evidence.
