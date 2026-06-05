# 2026-06-05-lakeshore-openai-corpus-execution — Lakeshore OpenAI-Only Corpus Execution

## Release ID

`2026-06-05-lakeshore-openai-corpus-execution`

## Status

`candidate`

## Plain-English Summary

The Lakeshore corpus autonomous execution brief now matches the current operating instruction: complete the remaining corpus work with OpenAI only. The brief records the current live corpus baseline, keeps Azure AI Search as the native vector store, and removes Anthropic-specific generation, critique, and grading instructions from the execution lane.

## Layer Impact

- Release lane `internal-admin`: Updates Codex/operator execution guidance for corpus generation, QA, loading, and evaluation.
- Release lane `client-data-lane`: Applies to Lakeshore corpus completion because the output controls what may be loaded into Postgres and Azure AI Search for the Lakeshore tenant.

## Client Applicability

- All clients: None.
- Specific clients: Lakeshore only.
- Internal only: Execution guidance for Codex/operators.
- Public/demo only: None directly.
- Feature flag: None.

## Changes Included

- `docs/build/codex-handoff/2026-06-04-LAKESHORE_CORPUS_AUTONOMOUS_EXECUTION.md`
  - Adds the 2026-06-05 OpenAI-only execution override.
  - Records current corpus continuation state: 8,987 published Lakeshore patterns and an approximately 1,013-pattern gap to 10,000.
  - Replaces Anthropic-specific generation, critique, retry, gap-audit, high-ground, grading, and credential instructions with OpenAI-only instructions.

## QA / Validation

- Verified `OPENAI_API_KEY` works locally with `GET https://api.openai.com/v1/models` returning HTTP 200.
- Verified live Postgres corpus baseline: 8,987 published Lakeshore corpus rows, 8,987 with `search_doc_id`.
- Verified PR #3135 merged with all checks passing before this update, leaving non-corpus demo readiness complete.

## Rollout Plan

Merge to `main`. No application deploy is required because this is a docs/execution-brief change. Future corpus-generation jobs should use this updated brief before making model calls or loading data.

## Rollback Plan

Revert this release record and the execution-brief update. No database or runtime rollback is required.

## Audit Evidence

- Postgres corpus baseline command output from 2026-06-05 heartbeat run: 8,987 published Lakeshore rows and 8,987 search doc IDs.
- OpenAI key preflight from 2026-06-05 heartbeat run: HTTP 200 from `/v1/models`.
- PR #3135 merge proof: `da6b5ad311cf2a57ff2a0f515510723865e6f4c3`.

## Known Gaps

- Fresh Azure AI Search document count refresh was blocked in the local execution context because Azure Search env vars were not present.
- The remaining approximately 1,013 corpus patterns still need generation, critique, gap audit, load, and eval before the corpus can be called complete.
