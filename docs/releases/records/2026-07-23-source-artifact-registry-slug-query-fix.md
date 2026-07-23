# 2026-07-23-source-artifact-registry-slug-query-fix — Source Artifact Registry Slug Query Fix

## Release ID

`2026-07-23-source-artifact-registry-slug-query-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Source artifact registry read path used by the Files workspace and aVa artifact-quality answers when a Source event is opened through a stable URL slug such as `apex-retail-ams-outsourcing-2026`. The registry previously queried both the legacy `source_event_id` field and the UUID-only `source_event_row_id` field with the same slug, causing Azure/Postgres to reject the read before aVa could render the artifact quality chart/table.

## Layer Impact

- `global-control-lane`: shared Source registry read behavior changes for all clients while preserving tenant-scoped query filters and existing event-id semantics.
- Source artifact registry read path: stable slug reads now query only `source_event_id`; UUID reads still query both `source_event_id` and `source_event_row_id`.
- Source aVa artifact-quality answer: removes the query failure that caused the live NDJSON response to include only a prose summary after `SOURCE-ANALYTICS-CHAT-002`.
- Source Files workspace: avoids the same slug-as-UUID failure path for artifact registry-backed reads.

## Client Applicability

- All clients: any Source event route using a non-UUID stable slug benefits from the safer registry query.
- Specific clients: Apex Retail proof route `apex-retail-ams-outsourcing-2026` is the validation target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/artifact-registry/index.ts` now builds the PostgREST OR filter based on whether the event id is a UUID.
- `src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts` adds regressions for slug and UUID event ids.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts --runInBand` passed: 27 tests.
- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand` passed: 10 tests.
- `npx eslint src/lib/source/artifact-registry/index.ts src/lib/source/artifact-registry/__tests__/artifact-registry.test.ts` passed.
- Live proof before this fix failed honestly: `app.abarva.ai` returned HTTP 200 and a signed-in Source page, but the NDJSON chat response contained only `summary`; ACA logs showed `invalid input syntax for type uuid: "apex-retail-ams-outsourcing-2026"` from the artifact registry read.
- `npm run release:check -- --base origin/main --head HEAD` pending before PR.

## Rollout Plan

Merge through a governed PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. After deploy, run an independent ACA runtime invariant check and repeat signed-in proof against `https://app.abarva.ai/source/events/apex-retail-ams-outsourcing-2026?stage=scope&workspace=files` plus the NDJSON `nexus/ask` artifact-quality prompt.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned ACA deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the deploy workflow when worker images are updated.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow publish the rollback image. No schema, migration, or data backfill rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5445.
- Failed pre-fix live proof: `/private/tmp/source-artifact-quality-chat-event-id-fix-live-proof-202607230701`.
- ACA log marker: `[source.nexus-ask.artifact-quality-governed-answer.failed]` with slug-as-UUID error.
- Post-deploy invariant and signed-in proof: pending after merge/deploy.

## Known Gaps

This does not add OCR, transcription, vector indexing, or enterprise-context promotion. It only repairs the registry read path so existing persisted artifact rows can be read safely from slug-based Source routes.
