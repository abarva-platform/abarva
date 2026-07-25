# 2026-07-25-moves-evidence-attachment-fk-hotfix — Fix FK mismatch breaking evidence ingestion

## Release ID

`2026-07-25-moves-evidence-attachment-fk-hotfix`

## Status

`candidate`

## Plain-English Summary

The live proof of `2026-07-24-moves-evidence-generation-context` (Workstream 1) caught a real bug
within minutes of deploying: uploading evidence through the Files & Evidence vault
(`artifacts/upload/route.ts`) returned `evidence: { status: "not_captured", warning: "[object
Object]" }` — the new evidence pipeline was silently failing on every upload from that route.

Root cause: `program_evidence_items.attachment_id` is a foreign key into `program_attachments`
(`supabase/migrations/20260501120000_program_evidence_items.sql:11`). The vault upload route writes
to a *different* table, `move_artifacts` (via `saveMoveArtifact`), and the previous commit passed
that table's row id as `attachmentId` — violating the foreign key on every insert. The workspace
chat upload route was unaffected; it correctly writes to `program_attachments` first via
`recordAttachmentUpload`.

Fix: the vault route no longer passes its `move_artifacts` id as `attachmentId`. It's carried
instead as `moveArtifactId`, stored in `source_ref` metadata (informational, not an FK), consistent
with how the two upload surfaces write to genuinely different tables. Also fixed the error
stringification in both routes' catch blocks (`err instanceof Error ? err.message : String(err)`
produces `"[object Object]"` for a raw Postgrest error — now `JSON.stringify`s non-Error objects so
this class of failure is diagnosable from logs without a live debugging session next time.

## Layer Impact

- **global-control-lane**: same evidence-ingestion pipeline as Workstream 1; this is a bug fix to
  that change, not new surface area.

## Client Applicability

- All clients: yes — the broken vault upload path affected every tenant since the Workstream 1
  deploy (approximately 20 minutes prior to this fix).

## Changes Included

- `src/lib/programs/current-state-doc-ingest.ts` — `IngestUploadedMoveEvidenceArgs` gains
  `moveArtifactId` (informational, written to `source_ref`) and documents that `attachmentId` is
  strictly a `program_attachments` FK. `ensureEvidenceReviewForUploadedEvidence`'s `sourceRef` now
  carries `move_artifact_id`.
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts` — passes `moveArtifactId:
  saved.artifactId` instead of the incorrect `attachmentId: saved.artifactId`. Error catch now
  JSON-stringifies non-Error thrown values.
- `src/app/api/programs/workspace/[moveId]/upload/route.ts` — same error-stringification fix for
  future diagnosability (its `attachmentId` usage was already correct).

## QA / Validation

- `npx eslint` — pass (clean on all changed files).
- `npx tsc --noEmit` — pass (clean).
- Automated regression test for this exact FK-mismatch shape — **not run** (blocked): the
  DB-fluent-client mocking needed to exercise `ensureEvidenceReviewForUploadedEvidence`/
  `recordProgramEvidence` end-to-end doesn't exist yet in this test suite (noted as a gap in the
  Workstream 1 release record too).
- Live signed-in proof — not yet run; planned immediately after deploy (re-upload the same file
  that failed and confirm `evidence.id` is populated).

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — re-run the exact upload that failed
  (`P2_call_reason_intent_taxonomy_proof.csv` against MEMBER AI ASSIST) and confirm `evidence.id` is
  populated instead of `not_captured`.

## Rollback Plan

Revert the merge commit. No schema/data changes to roll back.

## Audit Evidence

- PR: to be opened
- Failing request (pre-fix): `POST /api/v1/programs/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/artifacts/upload`
  → `{"evidence":{"id":null,"status":"not_captured","warning":"[object Object]"}}`, confirmed via
  ACA container logs (`[artifacts/upload] evidence_ingestion_failed`) at 2026-07-25T01:36:49Z.
- Post-deploy: live re-upload result to be added once captured.

## Known Gaps

- Same as Workstream 1's release record — citations not yet wired into the rendered Source
  Register; "Approve evidence" not yet surfaced in `FileCabinetPanel.tsx`.
