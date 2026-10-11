# 2026-10-11 — Moves deck notes lineage

## Release ID

`2026-10-11-moves-deck-notes-lineage`

## Status

`candidate — signed-in proof pending`

## Plain-English Summary

The reference-deck preview checks a governed figure where it was rendered. A
figure used only in speaker notes must appear in the notes; a figure used in a
title, answer or exhibit must appear on the slide. Every figure still needs its
governed source line and source ID. The signed-in walk now records request
timeouts as safe, explicit failures and continues to the remaining formats.

## Layer Impact

- Release lane: `experimental`, under the existing reference-deck flag.
- Layers 1–3: no intake, adapter, canonical data, schema or calculation change.
- Layer 4: read-only deck inspection and proof collection only.

## Client Applicability

- Specific clients: the existing synthetic demo tenant receives this preview change under its
  reference-deck flag. Other tenants remain refused.
- No client data is loaded or changed.

## Changes Included

- Track title and answer figures separately from figures used only in notes.
- Check visible figures against rendered slide text and notes-only figures
  against rendered speaker notes. Retain source-line and source-ID checks for
  all figures; a missing notes figure remains a blocking source refusal.
- Record a safe timeout or transport-failure class for each failed preview or
  workbook request, then upload the full deck-fidelity proof before the walk
  fails. Raw request exceptions are not placed in that proof.

## QA / Validation

- Local synthetic notes-only reproduction and render test: pass. Removing its
  figure from the notes produces the blocking `notes_figure_missing` subtype.
- Two one-at-a-time mutations were killed: treating notes figures as visible
  and skipping the notes figure presence check. Original code was restored.
- Seven focused deck and route suites: pass, 52 tests.
- TypeScript (8 GB local Node heap) and changed-file ESLint: pass.
- Release gates: pass, 11 of 11. Library orphan, route/export reachability,
  coverage census and tenancy-fence checks: pass with no baseline drift.
- Read-only walk discovery: pass, all five tests listed.
- Signed-in read-only proof of both editions: pending deployment.

## Rollout Plan

Merge through a pull request after current-head CI and the open Moves PR
coverage-count collision check. The repository-owned main workflow builds and
deploys the image. Its automatic signed-in walk must fetch both editions in
PPTX and PDF plus their figure workbooks, and report each format's actual
fidelity score and any refusal or timeout.

## Deployment Authority

This change does not deploy itself, dispatch jobs, shift traffic, modify tenant
data, persist deck artifacts or approve an estimate. Only the repository-owned
ACA main deploy workflow may update the shared web runtime.

## Rollback Plan

Revert this release through a pull request or disable the existing synthetic
demo reference-deck flag through the normal release lane.

## Audit Evidence

The prior deployed signed-in walk found `bound_figure_missing` on one
validation slide and timed out while requesting the investment PDF. A local
synthetic fixture reproduces the notes-only inspection mechanism, but the
failed PPTX response contains no rendered file for confirming the live cause.
The new pull request, local gates, deploy evidence and subsequent signed-in
deck-fidelity artifact provide the proof for this candidate.

## Known Gaps

- A previous investment PDF request exceeded 120 seconds; its underlying
  latency cause is not yet established. The new walk will expose a repeat as
  an explicit failure.
- No approved model-ready context bundle is supplied to the words route, so
  model prose cannot state case-specific facts.
- A missing approved estimate remains a visible investment-deck gap. No
  estimate is synthesized or promoted here.
- The current P3 read does not expose two persisted delivery options and an
  owner-selected option for an edition comparison.
