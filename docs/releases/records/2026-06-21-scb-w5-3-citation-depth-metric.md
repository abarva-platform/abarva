# 2026-06-21-scb-w5-3-citation-depth-metric — SCB W5.3 Citation-Depth Metric

## Release ID

`2026-06-21-scb-w5-3-citation-depth-metric`

## Status

`candidate`

## Plain-English Summary

This change fixes a false post-deploy crawl warning for Intelligence hard-question
answers. The old metric only counted internal dotted field names such as
`source_events.x`, even though the Intelligence answer contract streams
structured `sources` events and uses prose evidence instead of exposing internal
field paths. The crawl guard now counts grounded evidence the product actually
emits: structured source events, exact field citations when present, and concrete
facts such as money, percentages, dates, and file/source names.

## Layer Impact

- global-control-lane: updates post-deploy crawl evidence scoring and reporting.
  This changes CI/crawl classification only; it does not change the answer
  engine, prompts, retrieval, or client data.

## Client Applicability

- All clients: yes, whenever their Intelligence ask surfaces are evaluated by
  the post-deploy crawl.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts`
- `scripts/crawl/render-agent-response-report.ts`
- `src/lib/crawl/baseline-compare.ts`
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- `docs/build/SCB_EXECUTION_TRACKER.md`

## QA / Validation

- PASS: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
  - Result: 1 suite passed, 7 tests passed.
  - Note: Jest emitted pre-existing duplicate manual mock warnings; they did
    not fail the run.
- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts scripts/crawl/render-agent-response-report.ts src/lib/crawl/baseline-compare.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT RUN CLEAN LOCALLY: full `NODE_OPTIONS=--max-old-space-size=8192 npx tsc
  --noEmit --pretty false` is blocked in this checkout by unrelated missing
  local dependencies/types for `js-yaml`, Azure Document Intelligence, and axe
  Playwright. CI typecheck remains the broad gate after PR creation.

## Rollout Plan

Merge to main through the normal PR path. The repo-owned ACA deploy workflow will
build and deploy the updated crawl/report scripts with the application image, but
this change only affects post-deploy crawl scoring and generated reports.

## Deployment Authority

- Repo-owned deploy workflow: required for normal main deploy.
- Shared runtime mutators: none.
- Approved image digest: captured by deploy workflow after merge.
- ACA runtime invariant: verified by deploy workflow after merge.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; run the post-deploy crawl after merge to
  confirm the false-P1 metric is gone without changing answer output.

## Rollback Plan

Revert the PR to restore the previous exact-field-only citation-depth metric.
No database, feature flag, or data-plane rollback is required.

## Audit Evidence

- PR URL and CI run after PR creation.
- Focused Jest/ESLint output listed above.
- Post-merge post-deploy crawl comparison showing no false
  `hard-question-citation-depth` P1 for answers that provide structured sources
  or concrete prose evidence.

## Known Gaps

This does not improve answer quality. It only fixes a metric that was counting
the wrong evidence shape.
