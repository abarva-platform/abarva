# 2026-06-05-lakeshore-cxo-hard-question-qa — Lakeshore CXO Hard-Question QA Pack

## Release ID

`2026-06-05-lakeshore-cxo-hard-question-qa`

## Status

`candidate`

## Plain-English Summary

Adds a concrete Lakeshore QA evidence package with 100 finance, treasury, Kyriba, Source, Moves, Tower, tenancy, and AI success-platform questions. The package includes captured OpenAI-only agent answers, per-question critic scores, issue tags, a summary file, and an HTML report.

## Layer Impact

- `public-demo`: Adds demo-readiness QA evidence that can be reviewed before presenting Lakeshore to a buyer or internal executive audience.
- `internal-admin`: Supports internal quality review by preserving scored answer evidence and known watch items.

## Client Applicability

- All clients: None.
- Specific clients: Lakeshore Holdings only.
- Internal only: The report is an internal QA deliverable.
- Public/demo only: The report supports Lakeshore demo readiness.
- Feature flag: None.

## Changes Included

- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/README.md`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/questions.json`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/answers.jsonl`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/scores.jsonl`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/summary.json`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/report.html`

## QA / Validation

- Ran `node --check scripts/lakeshore/cxo-hard-question-qa.mjs`.
- Ran smoke capture with `node scripts/lakeshore/cxo-hard-question-qa.mjs --limit 3 --batch-size 3`; result: 3 pass, 0 watch, 0 fail, average 4.60 / 5.
- Ran full capture with `node scripts/lakeshore/cxo-hard-question-qa.mjs --batch-size 5`; result: 100 questions, 60 pass, 40 watch, 0 fail, average 4.53 / 5.

## Rollout Plan

Merge to main as a report-only evidence package. No runtime deployment, schema migration, feature flag, or data-plane change is required.

## Rollback Plan

Revert the report package and release record. No runtime rollback is required.

## Audit Evidence

- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/summary.json`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/report.html`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/answers.jsonl`
- `reports/2026-06-05-lakeshore-cxo-hard-question-qa/scores.jsonl`

## Known Gaps

This run is OpenAI-only against the shipped Lakeshore evidence bundle. It does not claim to be a live browser capture through `/api/intelligence/ask`, does not use Anthropic, and does not expand the Lakeshore corpus.
