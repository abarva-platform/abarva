# 2026-06-16-source-aq1-blob-retrieval — Source AQ1 Blob Retrieval

## Release ID

`2026-06-16-source-aq1-blob-retrieval`

## Status

`candidate`

## Plain-English Summary

Generated Source drafts now persist a real Blob-backed copy into the Source artifact registry / File Cabinet path after the canonical Postgres body is saved. This replaces the prior generated-artifact registry behavior that used an `inline://` pointer and made downloads depend on reading the body column instead of a durable file.

## Layer Impact

- `global-control-lane`: Shared Source artifact generation persistence changes for all clients using generated Source deliverables.
- Data plane: No migration. The existing `source_artifacts` table is reused with existing registry and File Cabinet columns.
- Storage: Generated markdown is uploaded through the existing object-storage adapter to the `source-artifacts` logical bucket.

## Client Applicability

- All clients: Source generated artifacts use the new Blob-backed registry path when generation runs with an active client.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; this is the default persistence path for the existing generation route.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: uploads generated markdown to object storage and registers a real Blob URI after the canonical body write.
- `src/lib/source/artifact-registry/index.ts`: allows generated artifacts to populate File Cabinet metadata on the same `source_artifacts` row.
- `src/lib/data-plane/write-adapters/sourceArtifactsWriteAdapter.ts`: allows optional File Cabinet columns on source artifact inserts.
- `src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts`: proves generated artifacts can write registry and File Cabinet fields together.

## QA / Validation

- `npx eslint src/lib/source/artifact-registry/index.ts src/lib/data-plane/write-adapters/sourceArtifactsWriteAdapter.ts 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts'` passed.
- `npx jest src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts src/lib/source/file-cabinet/__tests__/repository.test.ts src/lib/source/file-cabinet/__tests__/file-cabinet.test.ts --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' --runInBand` passed.
- `npx tsc --noEmit --pretty false` was run locally; AQ1-owned files typecheck clean, while the linked local dependency tree is missing pre-existing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge via PR, build the main Azure Container Apps image, and deploy to the live app. No migration or manual data backfill is required. Existing generated artifacts with `inline://` registry rows are unchanged; newly generated artifacts receive real Blob-backed rows.

## Rollback Plan

Revert the PR. Postgres artifact bodies remain canonical, so generated drafts continue to exist even if Blob registration is disabled. Any Blob-backed rows created by this release remain downloadable and do not need destructive cleanup.

## Audit Evidence

- PR and CI evidence for this release candidate.
- Live AQ1 download-to-disk proof under `docs/build/source-aq1-blob-retrieval/` after deployment verification.
- File Cabinet screenshot showing generated artifacts with download links.
- Downloaded generated markdown files saved under `~/Downloads/` during live proof.

## Known Gaps

- AQ1 does not add section-conformance verification; that is AQ2.
- AQ1 does not route generation through the async orchestrator; that is AQ3.
- Blob registration is best-effort and non-fatal by design; the Postgres body remains canonical if object storage has a transient failure.
