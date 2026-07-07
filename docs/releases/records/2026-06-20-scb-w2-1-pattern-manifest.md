# 2026-06-20-scb-w2-1-pattern-manifest — SCB W2.1 Pattern Manifest Expansion

## Release ID

`2026-06-20-scb-w2-1-pattern-manifest`

## Status

`candidate`

## Plain-English Summary

The generated intelligence pattern manifest no longer reflects only the old 17-pattern design pack. It is regenerated from the repo-authored corpus: TypeScript pattern seeds, Source lifecycle patterns, and governed genome JSONL seed rows. This makes the authored corpus visible to runtime manifest readers and closes the Shared Context Brain W2.1 retrievability gap at the generated-manifest layer.

## Layer Impact

- `client-data-lane`: Expands the global corpus manifest that all client intelligence surfaces can use for pattern lookup and proof/audit views. No tenant-private data rows are changed.
- `global-control-lane`: Updates the deterministic generator and graph integrity validation used by repo checks.

## Client Applicability

- All clients: Yes, after merge/deploy, manifest readers see the expanded global pattern corpus.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/intelligence/generate-pattern-manifest.ts`
- `src/lib/intelligence/generated/pattern-manifest.json`
- `src/lib/intelligence/pattern-manifest.ts`
- `src/lib/intelligence/pattern-graph-validation.ts`
- `reports/pattern-graph-integrity-2026-06-20T17-24-43-122Z.json`
- `docs/build/SCB_EXECUTION_TRACKER.md`

## QA / Validation

- `npm run intel:patterns:generate` — `before=3568 after=3569 patternSeed=510 sourceLifecycle=19 genomeSeedJsonl=3051 legacyCompat=1 deduped=12`.
- Initial baseline before this work was `patternCount=17`.
- `npx eslint src/scripts/intelligence/generate-pattern-manifest.ts src/lib/intelligence/pattern-manifest.ts src/lib/intelligence/pattern-graph-validation.ts` — passed.
- `npx tsx src/scripts/integrity/check-pattern-graph.ts` — passed; report has `patternCount=3569`, `errors=[]`, `warnings=[]`.
- `npx tsx src/scripts/intelligence/corpus-status-report.ts` — manifest declared and actual counts both `3569`.

## Rollout Plan

Merge to main through the repo-owned PR flow. The generated manifest ships with the web image on the next normal app deploy. No database migration, feature flag, worker job, or manual data load is required for W2.1.

## Deployment Authority

- Repo-owned deploy workflow: Required for normal app rollout only.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Not affected by this PR.
- Worker image invariant: Not affected by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for W2.1. Later W2.2/W2.3/W2.4 require DB/index/retrieval proof separately.

## Rollback Plan

Revert the PR to restore the prior generator and 17-pattern manifest. No database rollback is required.

## Audit Evidence

- Generated manifest source counts are embedded in `src/lib/intelligence/generated/pattern-manifest.json` under `authoredCounts`.
- Graph proof file: `reports/pattern-graph-integrity-2026-06-20T17-24-43-122Z.json`.
- Shared tracker row: `docs/build/SCB_EXECUTION_TRACKER.md` W2.1.

## Known Gaps

- This proves authored-to-generated-manifest indexing only. It does not prove DB load, pgvector indexing, or signed-in retrieval.
- `corpus-status-report` still reports one pre-existing missing `sourceDocuments` path: `docs/build/SOURCING_CORPUS_BUILD_KICKOFF_V1.md`.
