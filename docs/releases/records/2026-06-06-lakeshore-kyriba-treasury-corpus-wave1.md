# 2026-06-06-lakeshore-kyriba-treasury-corpus-wave1 — Lakeshore Kyriba treasury corpus wave 1

## Release ID

`2026-06-06-lakeshore-kyriba-treasury-corpus-wave1`

## Status

`candidate`

## Plain-English Summary

Adds the first import-ready Lakeshore corpus pack for Kyriba and treasury rollout success. The pack converts the modeled Lakeshore treasury doctrine into 12 governed JSONL patterns with owners, triggers, evidence, anti-patterns, failure modes, decision artifacts, and graph relationships. This is corpus-last content preparation; it does not claim the rows are already live-loaded.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific, synthetic/illustrative corpus content intended for the governed admin corpus import lane.
- `public-demo`: Improves the buyer-proof story by making the Kyriba/treasury corpus material concrete and reviewable before loading.

## Client Applicability

- All clients: none.
- Specific clients: Lakeshore only.
- Internal only: corpus authoring and validation workflow.
- Public/demo only: buyer-facing claims may cite this as import-ready content, not live-loaded content, until the governed loader commit is completed.
- Feature flag: none.

## Changes Included

- `scripts/corpus/generated/lakeshore-kyriba-treasury-wave1/lakeshore-kyriba-treasury-wave1.jsonl`
- `scripts/corpus/generated/lakeshore-kyriba-treasury-wave1/README.md`

## QA / Validation

- JSONL parse validation passed: 12 rows.
- Governed loader preparation passed: 12 patterns prepared, 26 graph edges prepared, vertical `diversified_holdco`, 0 warnings, 0 errors.
- `git diff --check` is required before merge.
- `npm run release:check -- --base origin/main --head HEAD` is required before merge.

## Rollout Plan

Merge to `main` as an import-ready corpus artifact. The follow-on operational step is to load the JSONL through `/admin/context-layer/uploads` or `/api/admin/context-layer/corpus-import` with operator attestation, then verify ingestion run, pattern count, graph edges, retrieval, and agent QA.

## Rollback Plan

Revert the PR to remove the import-ready corpus files. If the pack has already been committed through the loader, retire or supersede the affected corpus rows through the governed corpus process.

## Audit Evidence

- JSONL file with 12 Lakeshore Kyriba/treasury patterns.
- README validation commands and latest validation result.
- CI Release Control Gate result on the PR.

## Known Gaps

The pack is not yet live-loaded. It is the first slice only; additional corpus packs are still needed for broader holding-company AI strategy, IT/data modernization, vendor optimization, and the 100-question agent QA report.
