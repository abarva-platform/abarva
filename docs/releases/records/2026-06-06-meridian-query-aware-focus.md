# 2026-06-06-meridian-query-aware-focus — Query-Aware Ask Focus Checklist

## Release ID

`2026-06-06-meridian-query-aware-focus`

## Status

`candidate`

## Plain-English Summary

Sentinel Ask now adds a short, hidden query-specific checklist when a CXO asks about healthcare analytics, Databricks modernization, artifacts, approvals, partner triggers, or go/no-go gates. This makes the answer less likely to omit concrete terms such as HCUP, readmissions, length of stay, MLR, Stars measures, data products, report rationalization, lift-and-shift, CFO/CIO approvals, Move registration, Source partner triggers, and no-go conditions.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence Ask synthesis prompt construction. It does not change tenant data, retrieval, schemas, or loaders.

## Client Applicability

- All clients: Yes, when Intelligence Ask receives matching healthcare, modernization, artifact, approval, or go/no-go questions.
- Specific clients: Meridian Health System is the motivating QA case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: Adds `buildCxoQueryFocusChecklist` and injects it into the synthesis prompt when relevant.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: Adds checklist tests for healthcare analytics, modernization estate, and artifact / approval / no-go questions.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed with 2 suites and 34 tests.
- Pass: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts` completed with exit code 0.
- Pass: `npm run release:check -- --base origin/main --head HEAD` passed; Release Control Gate and Pilot Data Loader Gate passed.
- Pass: `git diff --check` completed with exit code 0.
- Planned post-deploy validation: rerun Meridian hard-question QA against production and compare the watch flags against the `25 pass / 25 watch / 0 fail` baseline from deployment `dpl_vKBVjSiuK4yoRysn7njHkvJ91TH9`.

## Rollout Plan

Merge to `main` and deploy to Vercel production. The checklist becomes active on the next Intelligence Ask request after deployment.

## Rollback Plan

Revert the PR and redeploy production. No database or data-plane rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production deployment: pending.
- QA crawl report: planned under `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/`.

## Known Gaps

This change improves answer focus. It does not add new Meridian data, generate new Move artifacts, or alter the admin loader.
