# 2026-06-10-deliverable-grounding-quality — Credit committed document evidence in grounded deliverables

## Release ID

`2026-06-10-deliverable-grounding-quality`

## Status

`candidate`

## Plain-English Summary

The Charter (and every grounded Move deliverable) was **under-representing the
evidence**: it only credited committed families that had a backing `tower_*`
table, so committed **document** families (stakeholder map, KPI baseline) were
silently skipped and shown as `[MISSING EVIDENCE]` even though they were
committed. The deliverable also read as a status checklist ("DORA: baseline
committed") because the generator only had readiness _status_, not the real
extracted content.

This fix (generic — applies to every archetype, client, and use case):

1. The deliverable claim pool now credits **every committed family** —
   structured _and_ document. Document families cite to `document_extract:<key>`.
2. The readiness resolver carries an **evidence digest** of the real committed
   content forward — for document families the approved **decisions / risks /
   baselines** extracted from the document; for structured families a
   committed-record summary — so deliverables cite **actual facts**, not "committed".
3. `review_required` evidence is honestly flagged not-yet-committed (not silently
   dropped, not falsely credited).
4. "Value not yet ratified" is retagged `value_ratification` (a distinct P1 step)
   so it no longer marks the committed KPI-baseline evidence as missing.

No fabrication path is introduced: every claim is still cited XOR flagged missing;
`unsupportedClaims` stays empty by construction.

## Layer Impact

- `global-control-lane`: the shared grounded-deliverable generator + the
  current-state readiness resolver. Additive/behavioral; no schema change.

## Client Applicability

- All clients / all archetypes (the fix is data-driven off readiness instruments).
- Feature flag: none.

## Changes Included

- `src/lib/programs/deliverable-refinement.ts` — `buildClaimPool` credits all
  committed families + emits real digest content; `review_required` flagged;
  value-ratification retagged.
- `src/lib/programs/current-state-readiness.ts` — `InstrumentReadiness.evidenceDigest`
  populated per committed instrument.
- `src/lib/programs/current-state-doc-ingest.ts` — `resolveDocFamilyReviews`
  returns `committedSignals` (real approved content) via a bounded
  `buildCommittedSignals` over `program_evidence_items.extracted_structured`.
- Tests: +2 (committed document family credited with real cited content;
  review_required honestly not committed). Suite 41/41.

## QA / Validation

- `npx tsc --noEmit` — **pass** (clean).
- `npx jest` deliverable/readiness/doc-ingest/bundle suites — **pass** (41/41).
- `npx eslint` changed files — **pass** (clean).
- Live ACA regeneration of the Charter on move `358233e6` — **not-run** (pending
  deploy; will confirm the committed stakeholder-map + KPI-baseline content
  appears cited, no longer `[MISSING EVIDENCE]`).

## Rollout Plan

1. Merge to main (after surfacing). 2. Build + deploy app image from main; shift
   traffic after Healthy. No migration.

## Rollback Plan

- Redeploy the prior revision (`--main-0375fd920`). Code-only; no schema/data.

## Audit Evidence

- The envelope still emits `citations` / `missingEvidence` / `unsupportedClaims`;
  document-family content is cited to `document_extract:<key>` traceable to the
  approved `program_evidence_items` + `program_evidence_reviews` rows.

## Known Gaps

- Structured (tower) families still surface a committed-record summary, not
  per-metric values (e.g. the literal DORA numbers). Pulling per-table metric
  digests is a follow-up (needs per-family digest descriptors); the document
  path now carries full extracted content.
- Overall confidence is still driven by the maturity recommendation; richer
  evidence does not yet automatically raise it.
