# 2026-06-05-lakeshore-cxo-hard-question-qa — Lakeshore CXO Hard-Question QA Harness

## Release ID

`2026-06-05-lakeshore-cxo-hard-question-qa`

## Status

`candidate`

## Plain-English Summary

Adds a reusable Lakeshore QA harness that captures at least 100 CXO-grade finance, treasury, Kyriba, Source, Moves, Tower, corpus, and federated-tenancy answers through an OpenAI-only agent and scores them with a cold critic. The run produces JSONL evidence and an HTML report suitable for founder, product, and buyer-facing QA review.

## Layer Impact

`client-data-lane`: Lakeshore-only QA evidence generation for client-scoped corpus, context, Source artifacts, and Move success proof.

`internal-admin`: Adds an internal audit script and report artifact path; it does not change runtime product behavior.

## Client Applicability

- All clients: No runtime effect.
- Specific clients: Lakeshore Holdings QA and demo-readiness evidence.
- Internal only: Script and generated audit report are for AbarVa execution/QA.
- Public/demo only: Report may be used as demo-readiness evidence when sanitized.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/cxo-hard-question-qa.mjs`
- Generated audit artifacts under `audit-artifacts/lakeshore-cxo-hard-question-qa/` when the harness is run.

## QA / Validation

- PASS: `node --check scripts/lakeshore/cxo-hard-question-qa.mjs`.
- PASS: Harness executed with `OPENAI_API_KEY` from `.env.local` using `gpt-4o-mini`.
- PASS: Final run `lakeshore-cxo-hard-question-qa-2026-06-05T14-17-21-855Z-ee8f1131` produced 100 questions, 100 captured answers, 100 score rows, `summary.json`, and `report.html`.
- PASS: Final scoring result was 63 pass, 37 watch, 0 fail, average overall score 4.49 / 5.
- PASS: `answers.jsonl` has 100 lines and `scores.jsonl` has 100 lines.
- PENDING: `git diff --check` and `npm run release:check -- --base origin/main --head HEAD` are run before PR update/merge.

## Rollout Plan

Merge to main as an internal QA tool. No Vercel, Azure, or database rollout is required. Operators run the script locally or in CI with `OPENAI_API_KEY` when a fresh Lakeshore intelligence proof packet is needed.

## Rollback Plan

Revert the script and generated audit artifacts. No schema, runtime route, or data-plane rollback is required.

## Audit Evidence

- PR URL after creation.
- Harness output under `audit-artifacts/lakeshore-cxo-hard-question-qa/<run-id>/`.
- `report.html` for human review.
- `summary.json`, `answers.jsonl`, and `scores.jsonl` for machine review.

## Known Gaps

The harness uses the shipped Lakeshore bundle as retrieval context and OpenAI as the answer/judge runtime. It does not yet exercise the live authenticated product Ask route because the current QA requirement explicitly requested OpenAI-only execution.
