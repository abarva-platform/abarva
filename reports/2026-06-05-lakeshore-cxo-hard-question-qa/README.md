# Lakeshore CXO Hard-Question QA

Run: `lakeshore-cxo-hard-question-qa-2026-06-05T16-03-23-288Z-9d3cbaa6`
Model: `gpt-4o-mini`
Questions: 100
Pass / watch / fail: 60 / 40 / 0
Average overall score: 4.53 / 5

## Truth Boundary

This is a concrete captured-answer QA pack for the Lakeshore AI success-platform story. It uses OpenAI only and retrieves from the shipped Lakeshore evidence bundle in this repo. It does not call Anthropic, does not use Pinecone, and does not claim to be a live browser capture through `/api/intelligence/ask`.

The 40 watch items are retained intentionally as QA evidence. The main watch pattern is sharper owner/action specificity, with smaller counts for finance-depth and evidence-reference gaps. There were 0 hard failures, 0 provider/runtime failures, and no tenant-bleed failures in this run.

Artifacts:
- `questions.json`
- `answers.jsonl`
- `scores.jsonl`
- `summary.json`
- `report.html`

This harness is OpenAI-only. It uses the shipped Lakeshore source bundle as retrieval context and does not call Anthropic or Pinecone.
