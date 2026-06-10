# 2026-06-10-current-state-doc-path — Review-required document path for qualitative current-state evidence

## Release ID

`2026-06-10-current-state-doc-path`

## Status

`candidate`

## Plain-English Summary

A Strategic Move's current-state readiness needs several kinds of evidence. Some
are structured tables (DORA, CMDB, workforce) that already auto-commit from CSV
into canonical `tower_*` stores. But three qualitative families — the stakeholder
/ decision-rights map, the product/platform operating model, and the value & KPI
baseline — have no canonical table and could only be "captured with Nexus." This
change lets a client satisfy those families by uploading real documents
(PDF / PPTX / DOCX / XLSX / CSV).

Crucially, document-extracted facts are **NOT** silently trusted. They follow an
honest, governed ladder: the upload is parsed, the extracted facts are recorded
append-only with their source citation, and a **review record** is opened. The
family shows **"review required"** (amber) — it does **not** count as committed
evidence — until a human approves it. Approval is the governed promotion that
flips it to committed. Free-form PDF/PPTX/DOCX never auto-commit. The single
sanctioned exception is a schema-validated structured KPI table (XLSX/CSV), which
may auto-promote on ingest — mirroring the existing CSV→tower behaviour.

This makes the engine honest about the difference between "a document was
uploaded" and "a fact from it is committed current-state evidence."

## Layer Impact

- `global-control-lane`: shared Moves current-state readiness engine, resolver,
  routes, and panel. New behavior is additive — structured CSV families are
  unchanged; document families gain a governed path. Applies to all clients/all
  archetypes that declare a family with no backing table.
- `client-data-lane`: new `program_evidence_reviews` table (the governed
  promotion ledger) on the private client data plane; `program_evidence_items`
  is unchanged and remains append-only.

## Client Applicability

- All clients: yes (additive; document families resolve via review ledger).
- Specific clients: n/a.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — behavior is gated by whether a required family has a
  backing table, not by a flag.

## Changes Included

- Migration `supabase/migrations/20260610120000_program_evidence_reviews.sql` —
  governed promotion ledger (one review row per evidence item; RLS service_role
  ALL + authenticated read; CHECK decision IN pending/approved/rejected).
- `src/lib/programs/current-state-doc-ingest.ts` — `ingestCurrentStateDoc`,
  `decideEvidenceReview`, `resolveDocFamilyReviews`, `validateKpiTable`,
  `isDocumentFamily`, `documentFamilyKeys`.
- `src/lib/programs/current-state-readiness.ts` — `review_required` state;
  optional `moveId`; document-family resolution (approved→committed,
  pending→review_required, none→missing); `documentFamily` + `pendingReviews` on
  `InstrumentReadiness`. `moveId` threaded through all 5 callers.
- Routes: `current-state/ingest-doc` (multipart parse → review) and
  `current-state/evidence/[evidenceId]/approve` (governed promotion).
- `src/components/strategic-moves/CurrentStateReadinessPanel.tsx` — amber review
  chip, ladder mapping for review_required, document upload, approve/reject.
- Tests: `current-state-doc-ingest.test.ts` (7 governance assertions);
  existing readiness/bundle/refinement suites updated for new fields.
- Reuses the existing parser (`evidence-ingestion.ts`: pdf-parse / mammoth /
  exceljs / Azure Document Intelligence) and `program_evidence_items`.

## QA / Validation

- `npx tsc --noEmit` — clean (no src errors).
- `npx jest` doc-ingest + readiness + bundle + refinement suites — 31/31 pass.
- `npx eslint` on changed files — clean.
- Pending (next cycle): private-DB migration apply via the in-VNet migrate job;
  ACA image build/deploy from this branch (rollback anchor
  `--main-28493f0cb3`); live proof on real move `358233e6` — upload a document
  for `stakeholder_map` → review_required → approve → committed (coverage rises
  past 50%); synthetic doc set (KPI XLSX, stakeholder DOCX, operating-model PPTX)
  generated and run through the path. This record will be updated with receipts.

## Rollout Plan

1. Merge to main (after surfacing for approval — not auto-merged).
2. Apply `20260610120000_program_evidence_reviews.sql` to the private client data
   plane via the in-VNet `job-abarva-db-migrate-lab-eastus` (localhost cannot
   reach the private Postgres).
3. Build + deploy the app image to `ca-abarva-web-lab-eastus` from main; shift
   traffic after Healthy.

## Rollback Plan

- Code: redeploy/shift traffic to revision `--main-28493f0cb3` (pre-change).
- Data: `program_evidence_reviews` is additive and isolated; if needed,
  `DROP TABLE program_evidence_reviews` removes the ledger with no effect on
  `program_evidence_items` or `tower_*`. Document families simply revert to
  "missing/capture-with-Nexus." No structured-family or CSV-path behavior changes.

## Audit Evidence

- `program_evidence_items` rows carry source citation, parse_method, confidence
  (append-only). `program_evidence_reviews` records submitter, reviewer,
  decision, rationale, timestamps, and `source_ref`. Both ingest and approve
  write `program_audit_log` entries (`current_state_doc_review_opened`,
  `current_state_doc_committed`, `current_state_doc_auto_committed`,
  `current_state_doc_rejected`) with from/to state and evidence refs.

## Known Gaps

- PPTX text extraction is not yet a dedicated parser: a `.pptx` upload currently
  lands as review-required metadata-only (honest `parse_method: metadata-only`)
  unless the platform's document parser handles it — operating-model content from
  slides should be reviewed manually until a PPTX parser is wired. PDF/DOCX/XLSX
  use the existing pdf-parse / mammoth / exceljs parsers.
- Auto-promotion is limited to a single conservative KPI-table schema check on a
  `financial`-kind family from XLSX/CSV. Other structured spreadsheets are
  review-required by design.
- Live private-DB migration apply, ACA deploy, and end-to-end live proof on move
  `358233e6` (plus synthetic doc set) are pending the next cycle; this record is
  the candidate and will be updated with receipts before it is marked released.
- Document evidence resolves only when a `moveId` is in scope (move-scoped). A
  purely tenant-scoped render reports these families as "missing" — intentional,
  since review state is per-move.
