# 2026-06-18-context-insight-materializer — Context Insight Materializer

## Release ID

`2026-06-18-context-insight-materializer`

## Status

`candidate`

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
- NOT RUN: ACA private operator plan/apply/verify. This must run after merge, image build/deploy, and migration apply.

## Rollout Plan

Merge, build/deploy the ACA image, apply the migration in the private data plane, then run:

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
- Pending follow-up PR/CI, deployment, migration, and ACA execution IDs for the full legacy rule registry compatibility fix.

## Known Gaps

- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not wire the new Intelligence Explorer UI.
- Does not implement document Blob staging or rich PDF/DOCX/PPTX/XLSX parser review queues.
