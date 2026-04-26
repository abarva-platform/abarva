# PDEL9 · Download / Export Contract

Slice ID: PDEL9
Slice name: Download / Export Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)
Depends on: PDEL, PDEL5, PDEL6, PDEL7, PDEL8

PDEL9 lands the deterministic export-readiness contract for program
deliverables. It defines the canonical `ExportMode`, `ExportReadiness`,
`ExportAuditRequirement`, `DeliverableExportIntent`, and
`DeliverableExportManifest` types, and a single public function
`buildDeliverableExportManifest` that returns a hardcoded seed manifest
covering the five canonical deliverable types.

PDEL9 is a read-model contract only. **No file generation, no download
URLs, no PDF/DOCX/PPTX libraries, no model calls, no DB writes, no live
export pipeline.** The `isLiveExportEnabled` and `liveExportEnabled`
fields are typed as the literal `false` and are never `true`.

## What changed

- New module
  [src/lib/programs/deliverable-export-contract.ts](../../../src/lib/programs/deliverable-export-contract.ts):
  - Export type `ExportMode`: `'html_static' | 'pdf_later' | 'docx_later' | 'pptx_later'`.
  - Export type `ExportReadiness`: `'ready' | 'not_ready' | 'deferred' | 'blocked'`.
  - Export type `ExportAuditRequirement`: `'required' | 'recommended' | 'not_applicable'`.
  - Interface `DeliverableExportIntent` — full intent contract per
    (deliverable, requestedMode) pair with `isLiveExportEnabled: false`
    as a literal-typed field.
  - Interface `DeliverableExportManifest` — point-in-time manifest
    with aggregate counts and `liveExportEnabled: false` literal.
  - Function `buildDeliverableExportManifest()` — returns a hardcoded
    seed manifest with five intents covering:
    1. Program Charter (html_static, approved, ready)
    2. Assessment Report (html_static, not_required, ready)
    3. Roadmap (html_static, pending approval, not_ready)
    4. Decision Memo (pdf_later, deferred)
    5. Executive Summary (pptx_later, deferred)

- New tests
  [src/__tests__/integration/programs/deliverable-export-contract.test.ts](../../../src/__tests__/integration/programs/deliverable-export-contract.test.ts):
  - Manifest structure — intents array exists and has length >= 5.
  - `totalIntents === intents.length`.
  - `generatedAt === '2026-04-26'`.
  - `liveExportEnabled` is always `false`.
  - Every intent has `isLiveExportEnabled === false`.
  - `pdf_later`/`docx_later`/`pptx_later` intents are never `ready`.
  - `pdf_later`/`docx_later`/`pptx_later` intents always have
    `exportReadiness === 'deferred'`.
  - `ready` intents only use `html_static` mode.
  - Every intent has a non-empty `caveat`.
  - Deferred-mode intents mention "future version" in their caveat.
  - Intents with `requiresApproval: true` and
    `approvalState !== 'approved'` are never in `ready` state.
  - `evidenceTraceRequired` is always a boolean.
  - Aggregate count fields match the actual intent arrays.
  - Determinism — byte-equal output across repeated calls.
  - Field completeness and type validity per intent.
  - `ready` intents have `null` exportBlocker.
  - Non-ready intents have a non-empty `exportBlocker` string.
  - Serialized manifest contains no `https://` URLs.
  - Serialized manifest contains no "generated file" / "download url"
    / "blob:" / "data:application" strings.

- Updated `docs/build/build-slices.json` with PDEL9 entry at
  `code_complete`, `risk: low`, pointing to the source file, test
  file, and this slice doc.

- Updated `docs/build/production-readiness.json` — appended a note
  to the `deliverables_artifacts` component. No status fields changed.

- Added `wave-12` to `docs/build/build-waves.json` with PDEL9 as the
  first completed slice in wave-12.

## Export honesty rules

1. Only `html_static` mode can ever be `ready` in this version.
2. `pdf_later`, `docx_later`, and `pptx_later` are always `deferred`.
3. Intents with `requiresApproval: true` must not be `ready` unless
   `approvalState === 'approved'`.
4. Every intent must carry a non-empty `caveat`.
5. `isLiveExportEnabled` is typed as `false` (literal) on every intent.
6. `liveExportEnabled` is typed as `false` (literal) on the manifest.

## What is NOT yet wired

- No live HTML static snapshot generation pipeline.
- No PDF rendering engine — deferred to a future slice.
- No DOCX/Word rendering engine — deferred to a future slice.
- No PPTX/PowerPoint rendering engine — deferred to a future slice.
- No download URL generation or blob storage integration.
- No approval gate integration with the Steward workflow.
- No audit record persistence when an export is triggered.
- No live evidence trace citation binding (PDEL8 `evid-seed-` ids
  remain as-is until the evidence registry is wired).

## What is deferred

- **PDEL10 · Export approval workflow** — wires the Steward gate so
  that `approvalState` can transition from `pending` to `approved`
  before an export is permitted.
- **Future PDF/DOCX/PPTX slice** — when the rendering pipeline lands,
  the `pdf_later`/`docx_later`/`pptx_later` modes will be upgraded
  from `deferred` to `ready` for eligible deliverables.
- **Live html_static generation** — the current contract returns a
  seed manifest; the first production html_static export will replace
  `staticHtmlAvailable: false` with `true` only after the renderer is
  wired.

## Validation

- `node_modules/.bin/tsc --noEmit --pretty false` — pass
- `node_modules/.bin/jest src/__tests__/integration/programs/deliverable-export-contract.test.ts --no-coverage` — pass

## Status

Code complete. Pending founder review.
