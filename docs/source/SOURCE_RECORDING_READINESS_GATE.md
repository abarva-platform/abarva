# Source Recording Readiness Gate

## Purpose

Source recording readiness is a buyer-journey proof, not an API smoke, widget smoke, or isolated artifact-generation test.

The minimum proof must show that a real signed-in user can start from a fresh Source event, move through the live workflow, reload the page without losing state, generate and download artifacts, upload client-final versions, approve final outputs, and advance stages without contradiction between aVa, the right-side canvas, File Cabinet, and database-backed workflow state.

## What This Gate Prevents

A narrow smoke can prove upload/download/generation plumbing, but it must not be treated as proof that Source is recording-ready.

Do not claim Source is end-to-end recording-ready from:

- API-only tests.
- isolated File Cabinet checks.
- isolated upload route checks.
- artifact download endpoint checks.
- local smoke scripts.
- screenshots from an already-populated event without reload checks.
- aVa answers that are not reconciled to workflow state.

## Buyer Journey Proof

Run this gate from the deployed app with a valid signed-in user and a fresh Source event.

1. Create a fresh sourcing event.
2. Fill intake through the live aVa panel.
3. Confirm the right-side canvas updates with the same captured intake.
4. Reload the browser and confirm captured state persists.
5. Upload source files across supported formats:
   - PDF
   - DOCX
   - XLSX
   - CSV
6. Confirm no false quarantine for valid files.
7. Confirm evidence appears in the workspace and File Cabinet.
8. Generate each required artifact for the stage.
9. Download each generated artifact.
10. Upload the reviewed client-final version.
11. Confirm the product shows what changed from generated draft to client-final.
12. Approve the final artifact.
13. Advance the stage.
14. Confirm prior-stage context is visible in the next stage.
15. Repeat through the full demo path selected for the recording.

## Required Invariant

If aVa says something is captured, locked, reviewed, approved, or ready, the structured workflow state must show the same thing after reload.

Any contradiction is a failed recording-readiness gate.

Examples of failures:

- aVa says intake is captured, but the canvas is blank after reload.
- aVa says an artifact is final, but File Cabinet still marks the generated draft as current.
- aVa says a stage is ready, but gate criteria are unmet.
- File Cabinet shows an artifact, but download fails.
- A valid PDF, DOCX, XLSX, or CSV upload is quarantined without a specific safety reason.
- The next stage does not display prior-stage context that the workflow depends on.

## Evidence Bundle

The proof bundle must include:

- signed-in tenant and user identity evidence.
- event id and event code.
- SHA, ACA revision, and image digest.
- screenshots for every major step.
- at least one reload screenshot for each state transition.
- upload receipts for PDF, DOCX, XLSX, and CSV.
- artifact IDs and download results.
- client-final upload receipt.
- approval evidence.
- stage advancement proof.
- aVa answer transcript.
- canvas/File Cabinet/database-backed state comparison.
- explicit failures and defects, if any.

## Allowed Claim

Allowed:

> Source recording readiness passed for event `<event_code>` in the deployed app. A signed-in user completed the buyer journey from fresh event through intake, evidence upload, artifact generation/download, client-final upload, approval, stage advancement, reload checks, and state reconciliation.

Not allowed:

> Source is recording-ready because upload/download/generation APIs passed.

## Relationship To Existing Smokes

Local and service smokes remain useful. They should be named according to the narrow thing they prove:

- upload plumbing smoke.
- download plumbing smoke.
- generation plumbing smoke.
- File Cabinet rendering smoke.
- aVa routing smoke.
- structured evidence persistence smoke.

They are prerequisites for confidence, not substitutes for the buyer-journey proof.
