# 2026-06-21-scb-w5-3-citation-depth-metric — SCB W5.3 Citation-Depth Metric

## Release ID

`2026-06-21-scb-w5-3-citation-depth-metric`

## Status

`live-proven`

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
- PASS: GitHub PR checks for #3780, including Typecheck + reasoning-layer tests,
  ESLint, browser matrix, Lighthouse, bundle budget, production readiness,
  release control, and hygiene.
- PASS: Post-merge deploy run 27900778392.
- PASS: Focused signed-in post-deploy crawl run 27901071378 on
  `skyharbor-cto` / `intelligence-ask` returned 0 P0 / 0 P1 / 0 P2 and proved
  the metric shape: `hardQuestionExactFieldCitations=0`,
  `hardQuestionGroundingEvidence=42`.

## Rollout Plan

Merged to main through PR #3780 and deployed through the repo-owned ACA main
deploy workflow. This change affects post-deploy crawl scoring and generated
reports; it does not change answer generation.

## Deployment Authority

- Repo-owned deploy workflow: run 27900778392 succeeded for merge commit
  `bf355be305275d819596c41715e6f00d59955ba1`.
- Shared runtime mutators: none.
- Approved image digest:
  `sha256:521fa98364c3ce3396a9b9d308791ae93dbec035d49e4d3ba8818cf3ef6c03f8`.
- ACA runtime invariant: revision `mbf355be3` healthy at 100% traffic; health
  endpoint OK.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: complete via post-deploy crawl run 27901071378.

## Rollback Plan

Revert the PR to restore the previous exact-field-only citation-depth metric.
No database, feature flag, or data-plane rollback is required.

## Audit Evidence

- PR #3780 and CI checks.
- Deploy run 27900778392.
- Signed-in post-deploy crawl run 27901071378.
- Focused Jest/ESLint output listed above.
- Crawl artifact:
  `transcripts/skyharbor-cto__intelligence-ask.json`, with
  `hardQuestionExactFieldCitations=0` and `hardQuestionGroundingEvidence=42` in
  `crawl-run.json`.

## Known Gaps

None for W5.3 acceptance. This does not improve answer quality; it only fixes a
metric that was counting the wrong evidence shape.
