# Board-Grade Deliverable Standard (AbarVa Moves & Source)

Every client-facing deliverable AbarVa generates must read as though produced by a
senior McKinsey/BCG team plus a CIO advisory partner: executive-readable,
structured, evidence-grounded, citation-backed, visually polished, editable
(DOCX/PPTX/XLSX), explicit about open items and client-to-complete items, free of
unsupported claims, and free of internal technical tags.

This is enforced by the **deliverable factory** (`src/lib/programs/deliverables/`),
not by trusting the model.

## The spine

1. **Section contract** (`contracts.ts`) — each deliverable type declares ordered
   sections, each with a MODE (auto-governed / auto-template / elicit /
   client-complete), required tables + columns, and quality criteria.
2. **Source-label mapping** (`source-labels.ts`) — internal evidence ids
   (`tower_*`, `document_extract:*`, …) are converted to human-readable citation
   titles and a numbered Source Register; the body uses `[n]` only.
3. **Generator** (`board-deliverable.ts`) — builds a clean evidence bundle with
   `[n]` citations, prompts Claude with the contract + register + placeholders +
   formatting + citation rules, then **scrubs** the output so no internal id can
   leak.
4. **Quality gate** (`quality-validator.ts`) — runs before export. Hard-FAILS on
   tag leakage, missing register, unsupported claims, missing sections/tables,
   missing title/version/date, or missing client-to-complete items.
5. **Renderers** (`render.ts`) — professional DOCX (title page, revision history,
   TOC, headers/footers, page numbers, real tables, 11pt body, Source Register
   appendix) and an HTML preview (document-style, `[n]` citations, no tags).

## Hard rules (export blocked if violated)

- No internal identifiers in client output: `document_extract:*`, `tower_*`,
  `enterprise_context_*`, `chunk_id`, `fact_key`, `source_segment_id`, raw table
  names, raw retrieval/context tags.
- Numeric `[n]` citations tied to a Source Register appendix — no inline tech pills.
- Zero unsupported claims (cited XOR flagged).
- All required sections + required tables present.
- Title / version / date block present; body font ≥ 10.5pt.
- Client-to-complete placeholders present when evidence is missing
  (`[CLIENT TO COMPLETE: …]`, `[CLIENT TO CONFIRM: …]`, `[VALUE TEAM TO CONFIRM: …]`,
  `[LEGAL/PROCUREMENT REVIEW REQUIRED: …]`). Gaps are never hidden in prose.
- Tenant name cased correctly (e.g. `skyharbor` → **SkyHarbor Air**).

## Warnings (quality, non-blocking)

Too few tables; missing RACI / risk / value / phase-gate table; low-confidence
sources; missing evidence that blocks a scale-up recommendation.

## Section modes

- **auto_governed** — generated from governed facts, cited.
- **auto_template** — standard advisory boilerplate, review-required.
- **elicit** — missing info; Nexus should ask.
- **client_complete** — client/legal/procurement must confirm; do not invent.

## Program Charter sections

Cover · Revision History · Contents · Executive Summary · Charter At-a-Glance ·
Problem Statement & Opportunity · Strategic Objectives · Current-State Evidence
Summary · Sponsor Commitment & Decision Rights · Stakeholder & RACI · Scope
Definition · Value Hypothesis · Delivery Approach & Phase Gates · Risks/Issues/
Dependencies · Open Items / Client-to-Complete Checklist · Recommendation & Next
Step · Source Register Appendix · (Internal Trace Appendix — internal mode only).

## Generalization

The same spine drives Discovery Report, Business Case, Roadmap, Mobilization Plan,
Handoff Pack (Moves) and RFP, Strategy Memo, Vendor Guide, Pricing Memo, Executive
Recommendation (Source) — each is a new `DeliverableContract` plus any source-label
additions. The generator, quality gate, and renderers are shared.

## Non-negotiable

Do not call a deliverable "gold standard" unless it passes the quality validator
and reads like a real executive consulting artifact.
