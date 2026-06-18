# 2026-06-18-context-insight-materializer — Context Insight Materializer

## Release ID

`2026-06-18-context-insight-materializer`

## Status

`deployed-private-data-plane`

## Plain-English Summary

Adds the missing backend layer that turns loaded tenant context records and facts into traceable Intelligence insights. Meridian and Lakeshore already had rich context rows, facts, chunks, private patterns, and Tower data loaded; this release adds the table substrate and job that derives L2 insight rows from that context, with every insight carrying the record IDs and fact IDs that caused it to fire.

## Layer Impact

- `client-data-lane`: Adds tenant-scoped `context_insights` and `significance_rules` schema plus a private job for materializing insight rows from committed context facts.
- `internal-admin`: Adds an operator-run script for plan/apply/verify after context refreshes.

## Client Applicability

- All clients: The schema and deterministic materializer are generic and tenant-scoped.
- Specific clients: Initial run target is Meridian Health and Lakeshore Industries.
- Internal only: The job is intended for ACA/private operator execution.
- Public/demo only: Not applicable.
- Feature flag: Does not change the signed-in Intelligence UI or enable a new UI route.

## Changes Included

- `supabase/migrations/20260618080500_context_insights_materializer.sql`
- `scripts/jobs/materialize-context-insights.cjs`
- `scripts/jobs/__tests__/materialize-context-insights.test.cjs`

## QA / Validation

- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest scripts/jobs/__tests__/materialize-context-insights.test.cjs --runInBand`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint scripts/jobs/materialize-context-insights.cjs scripts/jobs/__tests__/materialize-context-insights.test.cjs`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `node --check scripts/jobs/materialize-context-insights.cjs`
- PASS: `git diff --check`
- PASS: `node scripts/release-check.mjs --base origin/codex/ai-control-tower-substrate --head HEAD`
- FAIL/BLOCKED: ACA migration execution `job-abarva-private-operator-eus-2j5lnep` failed on the live lab database because an existing drifted `significance_rules` table did not have `rule_id`. The migration was updated to add missing columns and unique indexes for existing-table upgrade paths.
- FAIL/BLOCKED: ACA migration execution `job-abarva-private-operator-eus-tl2s8qo` then exposed a second live drift: the existing table has a not-null `rule_key` column. The migration now treats `rule_key` as a compatibility alias, backfills `rule_id` from it where needed, and seeds both columns.
- FAIL/BLOCKED: ACA migration execution `job-abarva-private-operator-eus-jtyi8fr` exposed the original S1/S3 rule registry shape: `name` is also not-null, with legacy rule metadata columns. The migration now seeds and updates both the legacy rule registry fields and the new materializer fields.
- PASS: PR #3661 CI passed: ESLint, Fresh Postgres migration replay, New migration drift surface, Routes and disclaimers, Typecheck + reasoning-layer tests.
- PASS: ACR build `cadn` produced `acrabarvalab001.azurecr.io/abarva/web:context-insights-37555e82` with digest `sha256:89f1d9142784138e52383d9996ac5df062ee65021b67922eb15b2492aa9a16b6`.
- PASS: Web revision `ca-abarva-web-lab-eastus--0000103` was shifted to 100% traffic and `/api/health` returned `ok:true`, `postgres:true`, `direct_postgres:true`, `azure_graph:"postgres"`.
- PASS: ACA migration execution `job-abarva-private-operator-eus-3l41r5f` applied `20260618080500_context_insights_materializer.sql`.
- PASS: ACA materializer apply execution `job-abarva-private-operator-eus-1ifed76` wrote 24 `context_insights` rows for `meridian-health` and 24 for `lakeshore`.
- PASS: ACA materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 total, 24 with record citations, 24 with fact citations, across 6 rules for each tenant.
- PASS: Private operator restored to idle image `acrabarvalab001.azurecr.io/abarva/web@sha256:e7668ebbb670bc014893fcc3265341cc56810c98a73b104d05ef3a079c430b3c` with command `/bin/true`.

## Rollout Plan

Completed in lab. The executed sequence was: merge, build/deploy ACA image, shift web traffic, apply migration in the private data plane, then run:

`node scripts/jobs/materialize-context-insights.cjs apply --client meridian-health,lakeshore`

After apply, run:

`node scripts/jobs/materialize-context-insights.cjs verify --client meridian-health,lakeshore`

## Rollback Plan

Code rollback is a Git revert. Data rollback is tenant-scoped: delete `context_insights` rows where `tenant_key in ('meridian-health','lakeshore')` and `rule_id` is one of the materializer rule IDs. Leave `significance_rules` in place unless a schema rollback is explicitly required.

## Audit Evidence

- Initial PR: #3658
- Failed ACA migration attempt before drift fix: `job-abarva-private-operator-eus-2j5lnep`
- Follow-up drift fix PR: #3659
- Failed ACA migration attempt before rule-key compatibility fix: `job-abarva-private-operator-eus-tl2s8qo`
- Rule-key compatibility fix PR: #3660
- Failed ACA migration attempt before full legacy rule registry compatibility fix: `job-abarva-private-operator-eus-jtyi8fr`
- Full legacy rule registry compatibility PR: #3661
- ACR build: `cadn`
- Deployed image: `acrabarvalab001.azurecr.io/abarva/web:context-insights-37555e82@sha256:89f1d9142784138e52383d9996ac5df062ee65021b67922eb15b2492aa9a16b6`
- Web revision: `ca-abarva-web-lab-eastus--0000103`, 100% traffic
- Health check: `/api/health` returned `ok:true`, `postgres:true`, `direct_postgres:true`, `azure_graph:"postgres"`
- Successful migration execution: `job-abarva-private-operator-eus-3l41r5f`
- Successful materializer apply execution: `job-abarva-private-operator-eus-1ifed76`
- Successful materializer verify execution: `job-abarva-private-operator-eus-en2ye2q`
- Verified rows: `meridian-health` has 24 materialized insights, all 24 with record and fact citations; `lakeshore` has 24 materialized insights, all 24 with record and fact citations.
- Private operator idle restore verified after execution.

## Known Gaps

- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not wire the new Intelligence Explorer UI.
- Does not implement document Blob staging or rich PDF/DOCX/PPTX/XLSX parser review queues.
