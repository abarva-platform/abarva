# PDEL · Program Deliverables / Artifacts Read Model

Slice ID: PDEL
Slice name: Program Deliverables / Artifacts Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a deterministic read model that projects a tenant + program seed
into the per-program artifact inventory the future Program detail
canvas will render. Covers generated deliverables, uploaded
documents, workshop notes, spreadsheets, presentations, evidence
artifacts, decision records, datasets. **No live runtime, no upload
pipeline, no parse engine, no model calls, no migrations, no UI.**

## What changed

- New module
  [src/lib/programs/program-artifact-inventory.ts](../../../src/lib/programs/program-artifact-inventory.ts):
  - Public types: `ProgramArtifactType`, `ProgramArtifactStatus`,
    `ProgramArtifactPhaseBucket`, `ProgramDeliverableRenderMode`,
    `ProgramArtifactFileChip`, `ProgramArtifactEvidenceUsability`,
    `ProgramArtifact`, `ProgramArtifactInventorySummary`,
    `ProgramArtifactInventory`.
  - Public helpers:
    - `buildProgramArtifactInventory(tenant, program)` — deterministic
      tenant + program → inventory + summary.
    - `groupArtifactsByPhase(artifacts)` — phase-bucket grouping.
    - `summarizeProgramArtifacts(artifacts, programCode)` — aggregate
      counts.
    - `getRenderableDeliverables(artifacts)` — filter to canvas-
      renderable artifacts.
  - Re-exports: `PROGRAM_ARTIFACT_TYPES_IN_ORDER`,
    `PROGRAM_ARTIFACT_PHASE_BUCKETS`,
    `PROGRAM_ARTIFACT_FILE_CHIPS`.

- New tests
  [src/__tests__/integration/programs/program-artifact-inventory.test.ts](../../../src/__tests__/integration/programs/program-artifact-inventory.test.ts):
  21 deterministic tests across 8 describe blocks covering:
  determinism per tenant + program; full required field set per
  artifact; unique ids within an inventory; phase-bucket grouping;
  renderable / downloadable invariants; summary reconciliation;
  no-fabrication invariants (no dollar amounts, no real `E-###`
  citations, every artifact carries an honest-fallback caption);
  module hygiene (no Source UI, Sentinel / Atlas / Nexus / Agent
  runtime, legacy `/programs`, mock.ts, auth, supabase imports).

## Artifact types and chips

- **Types**: `generated_deliverable`, `uploaded_document`,
  `workshop_notes`, `spreadsheet`, `presentation`,
  `evidence_artifact`, `decision_record`, `dataset`,
  `html_deliverable`.
- **File chips**: `DOC`, `PDF`, `XLS`, `PPT`, `NOTE`, `HTML`,
  `DATA`.

## How the inventory is composed deterministically

For each tenant + program:

1. **Generated deliverables** — one `generated_deliverable` per
   seeded `DeliverableSeedPlan`. Render mode is `html_render` for
   non-stub tier; `no_render` (and `renderableInCanvas: false`) for
   Stub tier. Honest fallback names the limit.
2. **Workshop notes** — one `workshop_notes` artifact per phase
   bucket present in the program's deliverables.
3. **Uploaded charter document** — one `uploaded_document` per
   program (charter PDF placeholder); `renderableInCanvas: false`,
   honest fallback names that the upload pipeline is deferred.
4. **Decision records** — one `decision_record` per `signed_off`
   deliverable; renderable as markdown.
5. **Evidence artifact** — one bundle when the program is at or
   beyond Diagnose; `evidenceUsability: 'partial'` until the
   evidence registry slice lands.
6. **Dataset snapshot** — one `dataset` row when the program is at
   or beyond Diagnose; `renderableInCanvas: false` (data inspector
   deferred).
7. **Spreadsheet (value ledger working sheet)** — one `XLS` row when
   the program is at or beyond Design.
8. **Presentation (steering deck)** — one `PPT` row when the
   program is at or beyond Design.

Sorting: phase bucket asc (Origination → Verify → Cross-phase),
then artifact type alphabetical, then id asc. Pure: same input →
identical output.

## What is deterministic today

- Inventory and summary are byte-equal across repeated calls per
  tenant + program.
- Artifact ids are unique within a single inventory (test enforced).
- Sums of `byType`, `byPhase`, `byStatus` reconcile to
  `totalArtifacts` (test enforced).
- `renderableCount` matches `getRenderableDeliverables(...)` (test
  enforced).
- `downloadable` is **always `false`** today; download / export
  pipeline is deferred (test enforced).
- No artifact invents a dollar amount or claims a real `E-###`
  citation (test enforced).
- Every artifact carries a non-empty `honestFallback` caption naming
  its limit (test enforced).

## What is NOT yet wired

- No upload pipeline; uploaded-document rows are placeholders.
- No parse engine; dataset / spreadsheet / presentation rows are not
  inspectable today.
- No download / export; every artifact reports `downloadable: false`.
- No deliverable canvas component; this slice only ships the read
  model.
- No live evidence registry binding; every evidence-artifact row
  reports `evidenceUsability: 'partial'` until ADM4 / registry
  slices land.

## What is deferred

- **Deliverable canvas component** — renders `getRenderableDeliverables`
  with HTML preview.
- **Upload pipeline** — flips uploaded_document rows from placeholder
  to real parsed state without contract changes here.
- **Export pipeline** — flips `downloadable: false` to `true` and
  binds a presigned URL when the export slice lands.
- **Evidence registry binding** — promotes `evidenceUsability:
  'partial'` to `'usable'` when E-id citations are wired.
- **Dataset inspector** — renders dataset rows when ADM4 / data
  inspector slices land.

## Honest fallbacks used

- Stub-tier deliverables report `renderableInCanvas: false` and
  honestly name the promote-to-Outline next step.
- Uploaded charter PDF row honestly states the upload pipeline is
  deferred (no real parse occurred).
- Spreadsheet, presentation, dataset rows are non-renderable today
  with honest fallbacks naming the deferred renderer.
- Module imports nothing from Source UI, Sentinel / Atlas / Nexus /
  Agent runtime, legacy `/programs`, `mock.ts`, auth, or supabase
  (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/program-artifact-inventory.test.ts` — 21 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
