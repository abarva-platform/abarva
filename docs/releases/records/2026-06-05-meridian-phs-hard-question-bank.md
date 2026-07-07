# 2026-06-05-meridian-phs-hard-question-bank - Meridian PHS Hard Question Bank

## Release ID

`2026-06-05-meridian-phs-hard-question-bank`

## Status

`candidate`

## Plain-English Summary

Adds a Meridian/PHS-specific hard-question bank for agent QA. The broad
post-deploy crawl still tests general tenant safety, but this new question set
tests the actual Meridian pilot storyline: integrated health-system identity,
Epic and ERP ingestion, Databricks modernization, plan/provider analytics,
population-health use cases, external datasets, KPI design, data modeling,
value evidence, and tenant-safety discipline.

## Layer Impact

`global-control-lane`: Extends the internal crawl harness with a named
question set. This does not change product runtime behavior for end users.

`client-data-lane`: The questions are Meridian/PHS-focused, but no Meridian
data is created, loaded, deleted, or side-loaded.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: Meridian/PHS QA can run with `--question-set phs-meridian`.
- Internal only: Yes, this is an internal QA/reporting capability.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `PHS_MERIDIAN_HARD_QUESTIONS` with 50 distinct Meridian/PHS questions.
- Added `resolveCrawlQuestions()` to select the default or Meridian-specific
  question bank.
- Added `--question-set phs-meridian` support to
  `scripts/crawl/post-deploy-harness.ts`.
- Added manual `persona`, `surface`, and `question_set` inputs to the
  post-deploy crawl workflow so Meridian/PHS runs can be dispatched from
  GitHub Actions.
- Updated the post-deploy crawl smoke test to pin question-bank behavior.

## QA / Validation

- PASS: `npx eslint src/lib/crawl/persona-switcher.ts scripts/crawl/post-deploy-harness.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main. Run the Meridian-focused crawl with:

`npm run crawl:post-deploy -- --persona meridian-cdio,meridian-cdao --surface intelligence-ask --question-set phs-meridian --output-dir audit-artifacts/meridian-phs-agent-response-crawl`

Or dispatch the `Post-deploy crawl` workflow with:

- `persona`: `meridian-cdio,meridian-cdao`
- `surface`: `intelligence-ask`
- `question_set`: `phs-meridian`

## Rollback Plan

Revert the PR. The broad post-deploy crawl question set remains unchanged.

## Audit Evidence

- Question bank: `src/lib/crawl/persona-switcher.ts`.
- Harness selector: `scripts/crawl/post-deploy-harness.ts`.
- Smoke coverage: `scripts/smoke/p21-post-deploy-crawl.spec.ts`.

## Known Gaps

The current production OpenAI call returned usage-limit errors during the broad
post-deploy crawl. The Meridian question bank can run once production OpenAI
quota/key access is restored.
