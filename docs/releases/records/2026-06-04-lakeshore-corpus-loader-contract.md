# 2026-06-04-lakeshore-corpus-loader-contract — Lakeshore Corpus Loader Contract

## Release ID

`2026-06-04-lakeshore-corpus-loader-contract`

## Status

`candidate`

## Plain-English Summary

Adds the controlled loader path for the Lakeshore Capital decision-pattern
corpus. The loader accepts the JSONL pattern schema from the autonomous
execution prompt, validates it, maps it into the repo's canonical
`corpus_patterns` storage family, writes graph relationships into
`corpus_pattern_relationships`, and can upload embedded documents into the
dedicated Azure AI Search index `lakeshore-patterns-v1`.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific corpus ingestion capability and
  an Azure AI Search index contract for Lakeshore pattern retrieval.
- `internal-admin`: Adds an operator script and preflight/contract evidence for
  controlled wave loading.

## Client Applicability

- All clients: No runtime behavior change by default.
- Specific clients: Lakeshore Holdings / Lakeshore Capital corpus lane.
- Internal only: Loader operation and preflight evidence.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/load-genome-wave.ts`
- `docs/build/codex-handoff/2026-06-04-LAKESHORE_CORPUS_MASTER_PROMPT.md`
- `docs/build/codex-handoff/2026-06-04-LAKESHORE_CORPUS_AUTONOMOUS_EXECUTION.md`
- `docs/build/lakeshore-corpus/LOADER_CONTRACT_2026-06-04.md`
- `docs/build/lakeshore-corpus/BLOCKED_PRECONDITION_2026-06-04.md`
- `docs/releases/records/2026-06-04-lakeshore-corpus-loader-contract.md`

## QA / Validation

- PASS: Clean worktree created at `/private/tmp/lakeshore-corpus-build`.
- PASS: Master prompt and autonomous execution files copied into the clean
  worktree with 612 and 368 lines respectively.
- PASS: Anthropic `/v1/messages` probe returned HTTP 200 for
  `claude-sonnet-4-5-20250929`.
- PASS: Live Postgres connection succeeded and found the canonical
  `corpus_patterns`, `corpus_pattern_content`, `corpus_pattern_versions`, and
  `corpus_pattern_relationships` tables.
- PASS: Lakeshore client row resolved to
  `f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61` with
  `tenant_key='lakeshore-holdings'`.
- PASS: Loader dry-run accepted the master prompt exemplar JSONL and performed
  zero writes.
- PASS: Azure AI Search index `lakeshore-patterns-v1` created/verified on
  `srchlakeshorepilotlsh001` with 17 fields, one vector profile, and one
  semantic configuration.
- Pending: `npm run release:check`.

## Rollout Plan

Merge to `main` through PR. The loader is inert until an operator runs it. Wave
loads should run in dry-run mode first, then with `--commit` after the
generator and critic gates approve the JSONL.

## Rollback Plan

Revert the PR to remove the loader and docs. If a future operator has already
loaded corpus rows, rollback requires a separate data cleanup keyed by
`corpus_patterns.primary_author_id='lakeshore-corpus-loader'` or pattern slug
prefix `pat-lsh-`, plus deletion from `lakeshore-patterns-v1`.

## Audit Evidence

- Loader dry-run output.
- Azure AI Search index verification output.
- Live Postgres table and Lakeshore client-row probes.
- This release record.

## Known Gaps

- This release does not generate or load a full wave.
- The autonomous brief's `pattern_corpus` wording is intentionally mapped to
  the accepted ADR-0001 `corpus_patterns` family rather than creating a second
  pattern store.

