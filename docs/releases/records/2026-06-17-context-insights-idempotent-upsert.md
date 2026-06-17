# 2026-06-17-context-insights-idempotent-upsert — Context Insights Idempotent Upsert

## Release ID

`2026-06-17-context-insights-idempotent-upsert`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor insight evaluator can now safely rerun when a rule finds more than one signal for the same entity. Duplicate rule/entity findings are merged before the database upsert, so the evaluator writes live insights without tripping Postgres' duplicate-row protection.

## Layer Impact

Internal admin: improves the private context-insight evaluator used by operators to refresh governed insight cards.

Client data lane: affects how derived `context_insights` rows are written for a client, without changing source facts, records, chunks, or client identifiers.

## Client Applicability

- All clients: Applies to any tenant using the context insight evaluator.
- Specific clients: Validated for SkyHarbor Air.
- Internal only: Operator evaluator execution and release evidence.
- Public/demo only: None.
- Feature flag: Existing intelligence feature flag behavior is unchanged.

## Changes Included

- `src/lib/intelligence/insight-engine/index.ts` deduplicates and merges duplicate tenant/rule/entity insights before `context_insights` upsert.
- `src/lib/intelligence/insight-engine/__tests__/index.test.ts` covers duplicate merge behavior and preserves anonymous insights.

## QA / Validation

Branch validation:

- Pass: `npx jest src/lib/intelligence/insight-engine/__tests__/index.test.ts src/lib/intelligence/insight-engine/rules/__tests__/context-record-rules.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/insight-engine/index.ts src/lib/intelligence/insight-engine/__tests__/index.test.ts`
- Pass: `git diff --check`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pending: SkyHarbor evaluator rerun against the deployed lab image after merge/deploy.

## Rollout Plan

Merge to `main`, let ACA main deploy build and shift traffic, then rerun the private operator evaluator for `skyharbor-air`.

## Rollback Plan

Revert the code commit and redeploy the previous ACA image. Existing live `context_insights` rows remain auditable derived rows; they can be superseded by a subsequent evaluator run if needed.

## Audit Evidence

- PR and CI for this release branch.
- ACA deployment evidence for the merged main SHA.
- Private operator evaluator log showing nonzero live `context_insights` and no evaluator errors.

## Known Gaps

This change fixes duplicate insight writes inside one rule/entity batch. It does not add new insight rules, alter source facts, or change the signed-in Intelligence UI beyond making the live `context_insights` refresh path rerunnable.
