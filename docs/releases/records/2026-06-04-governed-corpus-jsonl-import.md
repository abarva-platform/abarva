# 2026-06-04-governed-corpus-jsonl-import — Governed Corpus JSONL Import

## Release ID

`2026-06-04-governed-corpus-jsonl-import`

## Status

`candidate`

## Plain-English Summary

Admin operators can now validate and commit authored corpus JSONL files through the governed Context Uploads surface instead of loading new corpus data through one-off scripts. The lane preserves rich doctrine fields in `genome_patterns.doctrine_context`, writes optional graph edges, and records the import in `data_ingestion_runs` with operator attestation evidence.

## Layer Impact

- `internal-admin`: Adds a new admin-only corpus import card and API route under the existing Context Uploads module.
- `global-control-lane`: Adds a shared global corpus ingestion path for `genome_patterns` and `intelligence_graph_edges`.
- `client-data-lane`: Records tenant-scoped operator audit evidence for who performed the global corpus import, but does not write private tenant facts into the global corpus.

## Client Applicability

- All clients: Benefit from newly imported global corpus patterns after an authorized admin commits them.
- Specific clients: None.
- Internal only: The upload surface is admin/operator-facing.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- New API route: `/api/admin/context-layer/corpus-import`.
- New admin component: `CorpusJsonlImportConnector`.
- New server importer: `src/lib/context-ingestion/corpus-jsonl-import.ts`.
- Existing page update: `/admin/context-layer/uploads` renders the corpus JSONL lane next to the tenant CSV lane.
- Tests for validation-only behavior, commit behavior, cross-tenant rejection, doctrine context preservation, and ingestion-run audit recording.

## QA / Validation

- Pass: `npx jest src/lib/context-ingestion/__tests__/corpus-jsonl-import.test.ts src/app/api/admin/context-layer/corpus-import/__tests__/route.test.ts --runInBand` passed 6 tests. Jest emitted existing duplicate manual mock warnings unrelated to this change.
- Pass: Focused ESLint passed for the new importer, route, tests, component, and updated uploads page.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Not run yet: CI standard release, typecheck, hygiene, browser, and readiness gates after PR creation.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production pipeline. No schema migration is included in this PR; it depends on `genome_patterns.doctrine_context` from `2026-06-04-genome-patterns-doctrine-context`.

## Rollback Plan

Use `gh pr revert <PR>` to remove the UI, route, and importer. Any corpus rows committed before rollback remain auditable via `data_ingestion_runs` and can be reverted with a controlled data-plane cleanup using the recorded `import_id`.

## Audit Evidence

- PR URL and merge SHA after PR creation.
- Local Jest output for importer and API route tests.
- CI release-control output.
- `data_ingestion_runs.summary.import_id` for every committed corpus import.

## Known Gaps

This PR adds the governed import lane. It does not itself generate or load the healthcare modernization Wave 1 corpus file, and it does not apply the already-merged doctrine-context migration to a live database.
