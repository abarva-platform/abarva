# 2026-06-10-moves-file-cabinet-artifact-vault — Moves File Cabinet, Artifact Vault &amp; Phase Gate Flexibility

## Release ID

`2026-06-10-moves-file-cabinet-artifact-vault`

## Status

`candidate`

## Plain-English Summary

Every Strategic Move now has a durable File Cabinet. When a Move produces an
artifact — a generated deliverable, an approval record, and (by family) uploads
and session outputs — the bytes are stored in Azure Blob, a metadata row is
written to Postgres, the artifact is versioned, and it shows up in a File
Cabinet tab on the Move where it can be opened or downloaded. Nothing a Move
produces lives only in a browser download or a temporary file anymore.

Phase advancement also became flexible without becoming dishonest: hard gate
criteria still block advancement, but a Maestro/Admin can advance with unmet
soft criteria, and those carried-forward gaps are written into a durable Phase
Gate Decision Record that stays visible in the File Cabinet instead of
disappearing when the gate is crossed.

## Layer Impact

- `global-control-lane`: New artifact registry table, registry/list/download
  API routes, File Cabinet UI tab, and a Phase Gate Decision Record written on
  every advance. Shared Moves behavior; no feature flag.
- `client-data-lane`: New `move_artifacts` table on the private Postgres data
  plane with tenant-key RLS; artifacts staged into the tenant's Azure Blob
  container. Tenant-scoped reads and downloads only.

## Client Applicability

- All clients: yes (all Strategic Moves gain the File Cabinet and gate-decision
  record).
- Specific clients: live-proven on SkyHarbor Air.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Migration `supabase/migrations/20260610170000_move_artifacts_v1.sql` (applied
  in-VNet via `job-abarva-db-migrate-lab-eastus`).
- `src/lib/programs/deliverables/move-artifacts.ts` — `saveMoveArtifact`,
  `listMoveArtifacts`, `downloadArtifactBytes`, `getArtifactSignedUrl`.
- `src/lib/programs/deliverables/gate-override-artifact.ts` —
  `saveGateDecisionArtifact` (Phase Gate Decision Record).
- Routes: `…/artifacts/route.ts` (list), `…/artifacts/[artifactId]/download/
route.ts` (byte stream), `…/current-state/deliverable/orchestrate/route.ts`
  (persist-on-generate to vault), `…/advance/route.ts` (gate decision record).
- UI: `src/components/strategic-moves/FileCabinetPanel.tsx` + File Cabinet tab in
  `StrategicMoveDetailView.tsx`; tab routing in the Move page.
- Backfill: `src/lib/programs/deliverables/move-artifacts-backfill.ts` +
  `…/artifacts/backfill/route.ts` — registers pre-existing `deliverables_v2`
  records into the vault (idempotent).
- PR-5 MovePhasePlaybook: `src/lib/programs/playbook/move-phase-playbook.ts`
  (facilitated-session framework, P1–P5) + `…/playbook/route.ts`.
- PR-6 AI-PDLC P3 Solution Design Workbench:
  `src/lib/programs/playbook/ai-pdlc-design-sessions.ts` (8 sessions),
  `…/design-session-pack.ts` (renders + stores the pack as a session_artifact),
  `SessionPlaybookPanel.tsx` + Sessions tab.
- PR-8 MoveContextBundleTrace:
  `src/lib/programs/deliverables/move-context-bundle-trace.ts`, emitted in the
  orchestrate route into artifact metadata, read by
  `…/artifacts/[artifactId]/trace/route.ts`.
- Reports under `docs/moves/` (File Cabinet/Vault, Phase Gate Flexibility,
  Board-Grade Deliverable, SkyHarbor live proof).

## QA / Validation

- `npx tsc --noEmit` — clean for all changed files (one pre-existing unrelated
  `.next` validator error only).
- `npx eslint` — clean on all changed files.
- `npx jest …/advance/__tests__/route.test.ts` — 5 passed, 5 total.
- Live end-to-end on ACA revision `vault-c9a133153` (Healthy, 100% traffic)
  against the private data plane, SkyHarbor Move
  `358233e6-723d-492d-9e6b-6d8541b91207`:
  - Charter generated (quality 84/100), DOCX rendered (21,607 bytes).
  - Staged to Azure Blob (`storage: azure_blob`), registered in `move_artifacts`
    (v1, status `review_required`).
  - Listed by `GET …/artifacts` (count 1); rendered in the File Cabinet UI.
  - `GET …/download` returned HTTP 200, DOCX mime, exactly 21,607 bytes
    (byte-accurate stream from Blob).

## Rollout Plan

Migration applied in-VNet (done). Image `abarva/web:vault-c9a133153` built via
ACR, deployed to `ca-abarva-web-lab-eastus`, 100% traffic shifted to the new
revision. No further runtime steps; no feature flag.

## Rollback Plan

Shift ACA ingress traffic back to the prior healthy revision
(`vault-44ec5983f`) — instant. The `move_artifacts` table is additive (no
destructive change to existing tables); it can be left in place on rollback with
no effect on prior behavior. Download/list routes and the File Cabinet tab are
new surfaces; reverting the image removes them cleanly.

## Audit Evidence

- PR: `feat/deliverables-drawer` (#3389).
- Deployment: ACA revision `ca-abarva-web-lab-eastus--vault-c9a133153`.
- Live proof: `docs/moves/SKYHARBOR_MOVE_LIVE_PROOF_REPORT.html`.
- Registry row: artifact `c7c980d6-8ae1-40aa-8fd0-c9d0a29ff246`.

## Known Gaps

- PR-4 live advance (P1→P2) is pending sponsor/founder approval — the Phase Gate
  Decision Record code is deployed but not yet exercised by a real advance
  (correct governance, not a defect).
- Uploaded-evidence and session-artifact families are supported by the registry
  but not yet exercised end-to-end on live data.
- PR-5 (MovePhasePlaybook), PR-6 (AI-PDLC P3 Solution Design Workbench), and
  PR-8 (MoveContextBundleTrace emission) remain to build.
