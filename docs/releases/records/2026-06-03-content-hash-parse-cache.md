# 2026-06-03-content-hash-parse-cache — Content-Hash Parse Cache

## Release ID

`2026-06-03-content-hash-parse-cache`

## Status

`candidate`

## Plain-English Summary

Repeated uploads of the same PDF, DOCX, or XLSX bytes now reuse parser output during the active server runtime instead of re-running the expensive document parser. The cache key includes client scope, MIME type, parser identity, parser version, and SHA-256 content hash so a re-upload can save parser cost without crossing client boundaries.

## Layer Impact

- `client-data-lane`: improves client-scoped ingestion and attachment parsing behavior for program evidence uploads and agent chat attachments.
- `global-control-lane`: adds shared parse-cache infrastructure used by multiple upload surfaces.

## Client Applicability

- All clients: yes, for supported upload formats processed by the shared parser paths.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/lib/ingestion/content-hash-parse-cache.ts` with process-local SHA-256 parse caching and test reset/stats helpers.
- Wraps program evidence PDF/DOCX/XLSX extraction in the content-hash cache with the active tenant/client key as cache scope.
- Wraps agent attachment PDF/DOCX/XLSX extraction in the content-hash cache with the active client ID as cache scope.
- Adds focused unit coverage for cache hit/miss behavior, parser-version boundaries, and tenant-scope isolation.
- Adds program evidence coverage proving identical scoped PDF bytes call the PDF parser once while different scopes parse independently.

## QA / Validation

- `npx jest src/lib/ingestion/__tests__/content-hash-parse-cache.test.ts src/lib/programs/__tests__/evidence-ingestion.test.ts --runInBand` — passed locally, 13/13 tests.
- `npx jest src/app/api/programs/__tests__/attachments-upload.smoke.test.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts --runInBand` — passed locally, 33/33 tests.
- `npx eslint src/lib/ingestion/content-hash-parse-cache.ts src/lib/ingestion/__tests__/content-hash-parse-cache.test.ts src/lib/programs/evidence-ingestion.ts src/lib/programs/__tests__/evidence-ingestion.test.ts src/lib/programs/doc-parser.ts src/lib/agent/attachments.ts 'src/app/api/programs/[id]/attachments/upload/route.ts' src/app/api/v1/agent/attachments/route.ts` — passed locally.
- `npx tsc --noEmit --pretty false` — passed locally.
- `npm run release:check -- --base origin/main --head HEAD` — passed locally.
- `git diff --check origin/main...HEAD` — passed locally.

## Rollout Plan

Merge through the protected GitHub merge queue. The cache becomes active when the application deployment picks up the merged commit; no database migration, Azure change, or operator action is required.

## Rollback Plan

Revert the PR to remove the shared cache helper and return PDF/DOCX/XLSX parsing to one parser execution per upload. Because this change does not add persistence or schema state, rollback is code-only.

## Audit Evidence

- Pull request and merge evidence will be added by GitHub once this candidate is opened and merged.
- Local focused test output proving scoped cache behavior.
- Release check output for this release record.

## Known Gaps

- This is an active-runtime cache, not a durable cache across server restarts or regions; the persistent parse-cache backlog remains separate.
- Azure AI Document Intelligence primary parsing remains a separate backlog item.
- No live Azure/Vercel validation is included in this candidate.
