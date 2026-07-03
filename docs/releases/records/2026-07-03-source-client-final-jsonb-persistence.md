# 2026-07-03-source-client-final-jsonb-persistence — Source Client-Final JSONB Persistence

## Release ID

`2026-07-03-source-client-final-jsonb-persistence`

## Status

`candidate`

## Plain-English Summary

This release fixes the Source client-final acceptance path after live proof found that the uploaded client-final artifact reached the API route and Blob storage, but failed while writing JSONB artifact metadata rows. The change serializes and casts JSONB metadata at the shared source-artifacts registry, File Cabinet insert, source-artifacts Azure write adapter, and artifact-state update boundaries, and keeps reads tolerant of either parsed JSON or serialized JSON. It also hardens Source artifact download headers so client-final filenames with punctuation or non-ASCII characters can be streamed from Blob without response-header failures, and teaches Source aVa to answer client-final authority, final-version, vendor-issuance, and lineage questions from the File Cabinet artifact authority chain.

## Layer Impact

- `global-control-lane`: Updates shared Source File Cabinet persistence used by Source artifacts.

## Client Applicability

- All clients: Yes, for Source artifact metadata persistence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-registry/index.ts`: serializes `client_final_change_summary` for source-artifacts registry inserts and parses it defensively when rows are read back.
- `src/lib/data-plane/write-adapters/sourceArtifactsWriteAdapter.ts`: serializes and casts JSONB `source_artifacts` metadata columns for Azure/Postgres inserts, including disclosure flags, evidence families, missing inputs, client-complete items, assumptions, and client-final change summaries.
- `src/lib/data-plane/write-adapters/__tests__/slice-3f-shared-helper-write-adapters.test.ts`: adds a regression proving Azure/Postgres `source_artifacts` inserts use JSONB casts and serialized JSON metadata.
- `src/lib/source/file-cabinet/content-disposition.ts`: adds a shared Source File Cabinet `Content-Disposition` helper with an ASCII fallback plus UTF-8 `filename*`.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts`: uses the shared header helper when streaming authoritative client-final File Cabinet artifacts.
- `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts`: uses the shared header helper for direct artifact downloads, markdown source downloads, and registry fallback downloads.
- `src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts`: adds a regression proving a client-final filename containing an em dash is byte-safe in response headers and preserves the UTF-8 filename.
- `src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts`: adds a regression proving registry inserts serialize client-final JSONB metadata.
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`: serializes artifact-state `body_generation_metadata` for Azure/Postgres JSONB updates.
- `src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts`: adds a regression proving artifact-state JSONB metadata updates are cast and serialized.
- `src/lib/source/file-cabinet/repository.ts`: serializes `client_final_change_summary` for File Cabinet inserts and parses it defensively when rows are read back.
- `src/lib/source/file-cabinet/__tests__/repository.test.ts`: adds a regression proving File Cabinet insert payloads remain valid and the returned record maps the summary back into an object.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: binds File Cabinet authority metadata into Source aVa context, including client-final, current-authoritative, Blob-backed, version, lifecycle, and lineage fields.
- `src/lib/source/source-answer-engine.ts`: adds a deterministic artifact-governance answer path for final RFP version, vendor issuance, generated-draft lineage, and stage-advance questions.
- `src/lib/source/__tests__/nexus-api-live-context.test.ts`: adds a regression proving aVa answers `Which RFP version is final?` from client-final File Cabinet lineage instead of generic vendor-evaluation advice.

## QA / Validation

- Pass: focused Jest for Source File Cabinet, Source artifact registry, source-artifacts write adapter, Source write adapter JSONB handling, and Source artifact download headers.
- Pass: focused Jest for Source Nexus/aVa live context artifact-governance answer routing.
- Pass: focused ESLint on changed files.
- Pass: full TypeScript compile with `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- Pass: `npm run release:check`.
- Pending deploy: live signed-in SkyHarbor client-final proof and aVa governance proof will run after deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, and rerun the live signed-in client-final proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Source File Cabinet persistence.
- Approved image digest: Pending deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic after health.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback the ACA web app to the prior healthy revision or revert the File Cabinet repository change. No schema changes are included in this follow-up release.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live proof bundle: Pending.

## Known Gaps

This release does not change Source UI layout or gate semantics. It changes persistence, download safety, export resolution, and the aVa answer path for artifact-authority questions.
