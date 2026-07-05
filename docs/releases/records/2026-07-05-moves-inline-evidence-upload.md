# 2026-07-05-moves-inline-evidence-upload — Inline evidence upload in the Evidence Workbench

## Release ID

`2026-07-05-moves-inline-evidence-upload`

## Status

`candidate` — verified live on the Lakeshore Move before merge.

## Plain-English Summary

Closes the evidence loop in the workbench. "+ Add evidence" (and the gate steps'
"Add evidence") now open a **file picker in the workbench** and upload the file to
the Move evidence route — instead of bouncing the operator out to the File Cabinet.
The upload posts to `/api/programs/workspace/{moveId}/upload` (the route that
records `program_evidence_items` with phase-aware classification — the same one
that clears the discovery-notes gate), scoped to the currently selected need via
`artifactType`. On success it refreshes the route so the explorer statuses and the
live **% complete** update in place. "Open in File Cabinet" still links out to view
stored files.

## Layer Impact

- `global-control-lane`: the Evidence Workbench (`EvidenceWorkbench` +
  `CharterWorkflow` mapping), P2–P5 current phase, all clients. Client-side upload
  wiring to an existing, proven route; the server route/classification is unchanged.

## Client Applicability

- All clients: yes — every tenant using the Moves workbench at P2–P5.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — a hidden file
  input + upload handler (POST to `workspace/{id}/upload`, then `router.refresh()`),
  wired to `onAddEvidence`; upload status surfaced to the workbench.
- `src/components/strategic-moves/EvidenceWorkbench.tsx` — `evidenceUploadNote` /
  `evidenceUploadState` props; the Add-evidence button disables while uploading and
  shows the status note.
- `src/components/strategic-moves/EvidenceWorkbench.module.css` — upload-note styles.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `tsc --noEmit` (8GB heap) → **PASS** (0 errors); `eslint` → **PASS**.
- Live proof before merge: clicking "+ Add evidence" opens the picker (does not
  navigate away); an ingested file flips the need's status + advances the % after
  refresh (the upload route + record path were already proven live this session).

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy".
- Shared runtime mutators: none — reuses the existing evidence-upload route.
- Live signed-in proof required: yes — picker opens; ingested evidence updates the
  explorer + %.

## Rollback Plan

Revert the PR. Client wiring only; reverting restores the cabinet-redirect
behavior. No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.
- Route proven this session: `/api/programs/workspace/{moveId}/upload` recorded
  `program_evidence_items` and flipped the P2 discovery-notes gate to met.

## Known Gaps

- The native file-picker step is a real-user action (not automatable); the data
  loop (ingest → status/% update via refresh) is what's verified.
- Upload targets the *selected* need via `artifactType`, but the server classifier
  may reassign by filename/content — the status reflects the true classification.
