# 2026-06-10-board-grade-deliverable-factory — Board-grade deliverable generation framework

## Release ID

`2026-06-10-board-grade-deliverable-factory`

## Status

`candidate`

## Plain-English Summary

AbarVa's generated Program Charter was not board-grade: it exposed internal source
tags (`document_extract:stakeholder_map`, `tower_dora_metrics`), used inline
technical citation pills, lacked professional structure/tables, and did not render
as a client-ready DOCX. This builds a **reusable deliverable factory** so every
generated artifact is professional, evidence-grounded, citation-backed, editable,
and free of internal tags — enforced by the product, not by trusting the model.

The factory: a **section contract** per deliverable type; a **source-label mapper**
that converts internal ids into human-readable citations + a numbered Source
Register (`[n]`); a **Claude generator** prompted with the contract + clean
evidence + placeholders + citation rules, whose output is scrubbed so no internal
id can leak; a **quality gate** that hard-blocks tag leakage / missing register /
unsupported claims / missing sections, tables, or client-to-complete items; and
**professional DOCX + HTML renderers** (title page, revision history, TOC,
headers/footers, page numbers, real tables, Source Register appendix). Applied
first to the SkyHarbor Program Charter and generalizable to all Moves/Source
deliverables.

## Layer Impact

- `global-control-lane`: new shared deliverable-generation framework
  (`src/lib/programs/deliverables/`) + a board route. Additive — the existing
  deliverable endpoints are unchanged; this is a new, governed path. No schema
  change.

## Client Applicability

- All clients / all archetypes (contract + label-map driven). Feature flag: none.

## Changes Included

- `src/lib/programs/deliverables/source-labels.ts` — id→citation mapping, Source
  Register builder, forbidden-tag detector, body scrubber.
- `…/contracts.ts` — Program Charter section contract (17 sections, mandatory
  tables, 4 section modes); contract registry.
- `…/quality-validator.ts` — `validateDeliverableQuality` (errors + warnings +
  score).
- `…/board-deliverable.ts` — clean evidence bundle, upgraded Claude prompt,
  scrub, quality gate, tenant display-name casing.
- `…/render.ts` — professional DOCX (docx lib) + HTML preview renderers.
- `src/app/api/v1/programs/[programId]/current-state/deliverable/board/route.ts`
  — `format=json|docx|html`, export gated on quality.
- `docs/build/BOARD_GRADE_DELIVERABLE_STANDARD.md`.
- 10 unit tests (label mapping, tag detection, scrub, quality gate).
- Includes the prior unmerged grounding + narrative-generator commits this branch
  builds on.

## QA / Validation

- `npx tsc --noEmit` — **pass** (clean).
- `npx jest` deliverables suite — **pass** (10/10).
- `npx eslint` changed files — **pass**.
- Live ACA generation of the SkyHarbor Program Charter (DOCX + HTML, quality gate
  pass, zero internal tags, required tables, Source Register, placeholders) —
  **not-run** (pending deploy; PR-6 acceptance).

## Rollout Plan

1. Merge to main after CI green + surfacing. 2. Build + deploy app image from
   main; shift traffic after Healthy. No migration.

## Rollback Plan

- Redeploy the prior healthy revision. Code-only, additive route + libs; no schema
  or data impact.

## Audit Evidence

- The Claude call goes through the audited egress path (`getAuditedAnthropicClient`,
  `dataClass: confidential`). The quality gate result (`pass`, `errors`,
  `qualityScore`, `checks`) is returned with every generation and surfaced as
  `x-quality-*` headers on artifact responses. Internal source ids are retained
  only in `internalTrace` (never rendered in client output).

## Known Gaps

- PR-7 generalization (Discovery Report, Business Case, Roadmap, Mobilization,
  Handoff; Source RFP/Strategy/Vendor/Pricing/Exec-Rec) is contract work on top of
  this spine — only the Program Charter contract ships here.
- PPTX/XLSX deliverable rendering not yet wired (DOCX + HTML only).
- DOCX TOC populates on first open-and-update in Word (field-based), per the docx
  library's TableOfContents behavior.
- Confidence is carried from the evidence/recommendation; richer evidence does not
  yet auto-raise it.
