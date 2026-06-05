# 2026-06-05-crawl-report-synthesis-error-classifier - Crawl Report Synthesis Error Classifier

## Release ID

`2026-06-05-crawl-report-synthesis-error-classifier`

## Status

`candidate`

## Plain-English Summary

Hardens the agent-response HTML report so model/API failures are counted as
failed turns, not valid answers. This matters for the Meridian/PHS crawl because
production captured the right 100 hard questions, but every answer body returned
an OpenAI usage-limit error.

## Layer Impact

- `internal-admin` lane: Improves internal QA evidence reporting only. No
  product runtime behavior changes.

## Client Applicability

- All clients: Future crawl reports classify synthesis/model/quota errors
  honestly.
- Specific clients: Adds the captured Meridian/PHS crawl report from the
  `phs-meridian` run.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added synthesis/API error detection to
  `scripts/crawl/render-agent-response-report.ts`.
- Regenerated `reports/2026-06-05-meridian-phs-crawl/index.html` from GitHub
  Actions run `27019977867`.

## QA / Validation

- PASS: `npx tsx scripts/crawl/render-agent-response-report.ts --input-dir /tmp/meridian-phs-crawl-27019977867/post-deploy-crawl --output reports/2026-06-05-meridian-phs-crawl/index.html --title "Meridian PHS Agent Response Crawl - 100 Hard Turns"`.
- PASS: HTML report shows 100 turns captured, 0 answered turns, 100 error/empty
  turns, and 100 synthesis error turns.

## Rollout Plan

Merge to main. Future agent response reports will not mistake quota/model errors
for successful answers.

## Rollback Plan

Revert the PR. The crawl harness remains unchanged; only report
classification/report artifact generation is affected.

## Audit Evidence

- Renderer: `scripts/crawl/render-agent-response-report.ts`.
- HTML evidence: `reports/2026-06-05-meridian-phs-crawl/index.html`.
- Source GitHub Actions run:
  `https://github.com/abarva-platform/abarva/actions/runs/27019977867`.

## Known Gaps

The Meridian/PHS answer-quality score remains blocked until production OpenAI
quota/key access is restored. The report now makes that blocker visible instead
of hiding it in "answered" counts.
