# 2026-06-16-source-aq3-generation-queue — Source Async Draft Queue Foundation

## Release ID

`2026-06-16-source-aq3-generation-queue`

## Status

`candidate`

## Plain-English Summary

Source stage entry now has a durable place to record generated-document work before the document is produced. When a sourcing event enters Strategy, Scope, or RFP, AbarVa can mark the target artifact as drafting, create a queue job, and process it through the existing governed generator. If the new queue table has not been migrated yet, the system falls back to the current direct generation path so the user experience does not regress.

## Layer Impact

- `client-data-lane`: Adds the additive `source_artifact_generation_jobs` table, scoped by `client_key`, to track Source generated-document jobs.
- `global-control-lane`: Routes Source stage-entry auto-draft through the queue seam while preserving the existing manual generation endpoint, Blob/File Cabinet persistence, DOCX/HTML rendering, and section verification.

## Client Applicability

- All clients: Source events that use stage-entry auto-draft.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this foundation slice.

## Changes Included

- New migration `20260616234000_source_artifact_generation_jobs.sql`.
- New queue helper `src/lib/source/artifact-generation-queue.ts`.
- Updated `src/lib/source/stage-entry-autodraft.ts` to mark artifacts `drafting`, enqueue jobs, process through the existing generator when a request context is available, and fall back safely if the queue table is not present.
- Added focused unit/integration coverage for stage-entry queue behavior and migration shape.

## QA / Validation

- `npx jest src/lib/source/__tests__/stage-entry-autodraft.test.ts src/__tests__/integration/source/source-artifact-generation-jobs-migration.test.ts --runInBand` passed: 11 tests.
- `npx eslint src/lib/source/stage-entry-autodraft.ts src/lib/source/artifact-generation-queue.ts src/lib/source/__tests__/stage-entry-autodraft.test.ts src/__tests__/integration/source/source-artifact-generation-jobs-migration.test.ts` passed.
- Full `npx tsc --noEmit --pretty false` was attempted and is blocked by pre-existing missing optional dependency declarations outside this slice: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, apply the migration through the normal Azure database migration path, then let the Azure Container Apps image build/deploy. Stage-entry auto-draft will immediately use the queue table once present; before migration application it falls back to direct generation.

## Rollback Plan

Revert the application commit to restore direct stage-entry generation. The additive queue table can remain harmlessly in the database. If a hard rollback is required before any jobs are retained, drop `source_artifact_generation_jobs` after confirming no queued/running jobs need audit retention.

## Audit Evidence

- PR, CI checks, and release gate output.
- Migration file and migration structure test.
- Stage-entry auto-draft tests showing queue creation, drafting status, processing, failure handling, and fallback when the table is absent.

## Known Gaps

- This is the AQ3 queue foundation, not the final service-context worker. The current in-request processor can execute queued work when a request context exists; a follow-on slice must add the ACA worker/service context so queued jobs can be processed independently of a browser session.
- This slice does not yet route Source d01/d05 through the six-pass Deliverable Intelligence Orchestrator.
