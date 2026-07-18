# 2026-07-18-moves-evidence3-live-inline-upload-list — Moves: Inline Upload Widget Reads Real Artifact Lifecycle

## Release ID

`2026-07-18-moves-evidence3-live-inline-upload-list`

## Status

`candidate`

## Plain-English Summary

`MOVES-EVIDENCE-3` from the Moves UX backlog. The Moves phase workspace has three file surfaces: the inline "Upload Evidence" widget in the phase flow, the sidebar "Files & Evidence" view (`FileCabinetPanel`, backed by `move_artifacts`), and a separate `/strategic-moves/[moveId]/evidence` deliverable-registry page. Investigation confirmed the inline widget's upload was already real (posting to the same `/api/v1/programs/:id/artifacts/upload` endpoint as the File Cabinet), but the list it displayed underneath was **not** — it was local React state populated only from what was just picked in that render, with a hardcoded `"needs review"` label. Reload the page, revisit the substep, or have a teammate upload from another session, and the list showed nothing even though the files were sitting in the real vault with real version/status/quality data.

This release replaces that ephemeral list with a live read of `GET /api/v1/programs/:id/artifacts?family=uploaded_evidence`, filtered to the current phase and to non-superseded artifacts, re-fetched on mount and after every upload. Each row now shows the artifact's real version, real status (via `FileCabinetPanel`'s own `artifactStatusLabel`, reused rather than reimplemented), and quality score when scored — the same values a user would see if they clicked through to the full File Cabinet.

The third surface, `/strategic-moves/[moveId]/evidence` (`PhaseDocumentsPanel.tsx`), was investigated and found to be a genuinely different concept — a canonical per-phase deliverable checklist backed by `program_attachments` and the deliverable registry, not `move_artifacts`. It was deliberately left untouched; see Known Gaps.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the shared Strategic Moves phase workspace for every tenant.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`:
  - `UploadedFilePreview` (ephemeral, client-only) replaced with `PhaseEvidenceArtifact` (shape matching the real `/artifacts` API response).
  - `EvidenceUploadControl` now calls `GET /api/v1/programs/:moveId/artifacts?family=uploaded_evidence` on mount and after every successful upload, filters to the current `phase` and `lifecycleState !== "superseded"`, and renders real `version`/`status`/`qualityScore` per file instead of a client-echoed filename list.
  - Imports `artifactStatusLabel` from `FileCabinetPanel.tsx` to keep status wording identical across both surfaces rather than inventing a second copy.
  - `.mxw-uploaded-files em` color changed from a hardcoded green (which read as "approved" regardless of real status) to the existing `--muted` token, since the text now reflects genuinely varying real statuses (draft, review_required, etc.).
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: the shared `beforeEach` fetch mock now tracks uploaded artifacts in memory and serves them back on the `GET .../artifacts?family=uploaded_evidence` call, so `"uses P1 step 2 for uploading evidence..."` exercises the real upload-then-reload path instead of asserting on client-only echo; added an assertion that the displayed rows carry real `v1 · draft` lifecycle text.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 20/20
- Not run: live signed-in browser proof (no valid local Clerk session in this environment).

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job — the read path already existed and is exercised today by `FileCabinetPanel`; this only adds a second, phase-scoped caller of the same endpoint.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — upload a file from the inline "Upload Evidence" step on a real Move, reload the page, confirm the file still shows with its real version/status (not gone, not the old "needs review" placeholder), and cross-check the same file/status appears in the sidebar Files & Evidence view.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- `MovesPhaseStandaloneClient.test.tsx` full pass (20/20).
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **The third surface, `/strategic-moves/[moveId]/evidence` (`PhaseDocumentsPanel.tsx`), is untouched.** It's backed by `program_attachments` and the deliverable registry — a genuinely different concept (canonical per-phase deliverable checklist) from `move_artifacts`, not pure duplication. A user who lands there via nav may still reasonably expect to see the same file they uploaded inline; unifying that is a separate, larger data-model decision outside this release's scope.
- **No client-side dedup/merge across the two `move_artifacts` upload paths** (inline widget vs. sidebar File Cabinet) beyond what the API already returns — both already write to the same table via the same endpoint, so there is nothing to reconcile; this release only changes what's *read* inline.
- The inline list still does not expose the File Cabinet's review/regenerate/decision actions — it is read-plus-status only, by design; "Open Files & Evidence" remains the path to act on an artifact.
