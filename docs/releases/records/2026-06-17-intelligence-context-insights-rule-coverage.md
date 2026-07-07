# Intelligence Context Insights Rule Coverage

## Release ID

`2026-06-17-intelligence-context-insights-rule-coverage`

## Status

`candidate`

## Plain-English Summary

Turns the S3 context-insight evaluator from mostly stubbed logic into live rules that can derive SkyHarbor insight cards from the loaded enterprise context records.

## Layer Impact

- **Lane:** `global-control-lane`
- **Data layer:** Reads existing `enterprise_context_records` payloads for contracts, AI tools, service levels, applications, and initiatives. No new schema.
- **Insight layer:** Replaces no-op significance-rule evaluators with payload-based rules aligned to the SkyHarbor v2 loader shape.
- **UI layer:** No direct UI change; the Insights tab now has live `context_insights` rows to render after evaluation.
- **QA layer:** Adds focused rule tests proving the non-renewal rules fire against representative SkyHarbor v2 payload rows.

## Client Applicability

- **All clients:** Applies to tenants that have compatible enterprise context records and the context explorer/evaluator enabled.
- **Specific clients:** Needed immediately for SkyHarbor.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** `context_corpus_explorer_enabled` controls the explorer surface; evaluator remains operator/API driven.

## Changes Included

- `src/lib/intelligence/insight-engine/rules/context-records.ts` — shared helpers for reading active context records and formatting evidence.
- Replaces five no-op rule modules with live evaluators for AI value gaps, SLA breaches, material initiative review, ownership reconciliation, and value coverage gaps.
- Updates renewal evaluation to read `contract` records with `renewal_date`/`annual_value_usd`, matching the SkyHarbor v2 loader.
- Adds `src/lib/intelligence/insight-engine/rules/__tests__/context-record-rules.test.ts`.

## QA / Validation

- `npx jest src/lib/intelligence/insight-engine/rules/__tests__/context-record-rules.test.ts --runInBand` — passed: 1 suite, 2 tests.
- `npx eslint src/lib/intelligence/insight-engine/rules src/lib/intelligence/insight-engine/index.ts src/scripts/intelligence/evaluate-context-insights.ts` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed.
- After deploy, run `npm run intel:context-insights:evaluate -- --tenant=skyharbor-air` from the private operator job and confirm nonzero `afterInsightCount`.

## Rollout Plan

Merge to `main`, deploy the web image to Azure Container Apps, update the private operator job to that image, and rerun the SkyHarbor evaluator. Existing explorer gating remains unchanged.

## Rollback Plan

Disable `context_corpus_explorer_enabled` for affected tenants or revert this rule-only change. No schema rollback is required.

## Audit Evidence

- Branch: `codex/context-insights-rule-coverage`.
- Private evaluator before this hotfix reached SkyHarbor live data but returned `evaluated: 6`, `fired: 0`, `written: 0` against 24,655 facts.
- Post-deploy evaluator receipt will be attached after merge/deploy.

## Known Gaps

- These rules are practical S3 coverage for current SkyHarbor v2 payloads; they do not exhaust every possible significance rule definition.
