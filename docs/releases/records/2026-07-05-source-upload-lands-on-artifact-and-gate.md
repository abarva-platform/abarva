# 2026-07-05-source-upload-lands-on-artifact-and-gate — Uploads land on the canvas artifact and satisfy its gate

## Release ID

`2026-07-05-source-upload-lands-on-artifact-and-gate`

## Status

`candidate`

## Plain-English Summary

Friction-audit item #3 (backend slice). Today, uploading a document to a Source
event creates a registry row that the canvas and the gate can't see: the file
doesn't land on the artifact it's meant to fill, and the "flip the gate" attempt
targets a dead legacy ID namespace via an in-process memory store that never
reaches the database. So a user could upload the actual signed contract and the
gate still shows unmet.

This fixes the connection. When an upload targets a specific canvas artifact, the
extracted text now lands on that artifact's body (`source_event_artifact_states.body`)
and every gate criterion linked to that artifact is marked met — the chosen product
semantics (an uploaded document satisfies its gate). The dead legacy gate-map +
in-memory-store path is removed. Text, Markdown, CSV, HTML, and DOCX (via mammoth)
extract to a body; PDF and other binaries still store as a registry document only
(no fabricated body).

Note: this is the server capability. The paperclip UI does not yet send a target
artifact code — that UI slice (making uploads artifact-scoped) is the follow-up, so
this is not yet user-visible on its own.

## Layer Impact

- `global-control-lane`: shared Source upload behavior for all clients. Changes what
  an upload does — it can now write an artifact body and flip linked gate-criterion
  states (`source_event_gate_criterion_states`) to `met`. All writes go through the
  existing data-plane write seam (`selectSourceWriteAdapter`) and are tenant-scoped by
  the resolved event. No new schema, seed, or migration.

## Client Applicability

- All clients: yes (once the UI slice sends an artifact code)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/artifact-registry/upload-text-extraction.ts` (new) — pure-ish
  `extractSourceUploadText`: text/markdown/csv/html/json → utf8; DOCX → mammoth;
  PDF/other → unsupported (null body, warning). Char-capped; never throws.
- `src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts` (new) —
  6 unit tests.
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts` — accepts an optional
  `artifactCode`; on match, `landUploadOnArtifact` writes the extracted body (tier
  stub→outline bump) and marks `criteriaByArtifactCode(artifactCode)` met via the write
  seam. **Removed** the dead `getCriterionIdsForArtifactFamily` + in-memory `addEvidence`
  block (legacy `ART-AMS-*` namespace that never reached the DB). Response now returns a
  `landing` summary (`bodyLanded`, `satisfiedCriteria`, `warnings`).

## QA / Validation

- `npx jest .../upload-text-extraction.test.ts` → **6/6 pass**.
- `npx tsc -p tsconfig.json --noEmit` → no errors in changed files. **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Source unit sweep → no new regressions; the 4 pre-existing failing suites
  (`create-sourcing-event-scaffold`, 3 `exports/*`) fail identically on clean HEAD.
- Not live-proven: the body-land + gate-flip DB writes need an ACA deploy (localhost
  cannot reach the private DB). **not-run** (blocked on environment).

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook. No
migration, no feature flag. Record the ACA revision/image when deployed.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. No schema/migration to unwind. The
change only adds writes on upload; reverting returns uploads to registry-only with the
(previously dead) gate-map path. Already-flipped criteria remain met (harmless; they can
be reopened via the gate route).

## Audit Evidence

- PR URL (to be added on open).
- CI: `release:check`, jest, tsc, eslint.
- Gate-criterion writes stamp `reviewer_user_id` (uploader person id) + `reviewed_at`;
  the response `landing.satisfiedCriteria` lists exactly which gates an upload moved.

## Known Gaps

- **UI slice pending:** the paperclip (`AtlasDrawer` / `SourceEventAgentCanvas`) still
  posts only `stageKey`, not `artifactCode`, so this is latent until uploads are made
  artifact-scoped (next slice — either per-artifact upload buttons in the Document tab or
  an artifact picker on the paperclip).
- **Auto-satisfy is unconditional** for anyone who can upload; it does not yet gate on
  `canApproveSourceStages` / `GATE_APPROVAL_STRICT_MODE`. Acceptable under the pilot
  self-approve model; strict-mode gating is a follow-up.
- **PDF has no text extraction** anywhere in the repo (no `pdf-parse`/`pdfjs`); PDFs land
  as registry documents only.
- The now-orphaned `src/lib/source/artifact-gate-map.ts` is left in place (referenced only
  in comments) rather than deleted in this slice.
