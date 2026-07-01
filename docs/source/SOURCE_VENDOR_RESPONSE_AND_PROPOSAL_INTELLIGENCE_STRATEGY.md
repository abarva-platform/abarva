# Source — Vendor Response & Proposal Intelligence Strategy

_Master Source thought-leadership document. Written from the standpoint of a 25-year IT
sourcing advisor and an AI systems architect. Source-only; grounded in a full audit of
what already exists in the codebase (paths cited throughout)._

---

## 1 · What should AbarVa build vs. not build?

**Do not build a procurement portal.** Coupa/Ariba/Ivalua/Zip/Jaggaer own submission
logistics, supplier identity, and the compliance channel — replicating them creates audit
burden and zero differentiation. **Build the intelligence layer**: what proposals mean,
how they compare, where they're weak, and how to negotiate better.

**Build-vs-reuse, grounded in the actual codebase** (audited 2026-06-11):

| Capability                                                                                                                                         | Status                                                               | Action                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| Pricing submission intake (xlsx, parse, supersede chain)                                                                                           | EXISTS — `vendor-submission/route.ts`, `pricing-submissions/`        | Reuse                                   |
| Pricing comparison + TCO workbooks                                                                                                                 | EXISTS — `exports/renderers/pricing-comparison.ts`, `tco-iceberg.ts` | Reuse                                   |
| Proposal normalization (8-dimension matrix)                                                                                                        | EXISTS — `proposal-normalization/`                                   | Extend to the AMS comparable-fields set |
| Risk/exception capture                                                                                                                             | EXISTS — `trap-log.ts` (P0/P1/P2) + `source_commercial_exceptions`   | Reuse                                   |
| BAFO question pack                                                                                                                                 | EXISTS — `bafo-question-pack.ts`                                     | Reuse; feed from levers engine          |
| Scorecard workbook                                                                                                                                 | EXISTS — `scorecard.ts` + payload binder                             | Reuse as the export                     |
| Parsed-extraction tables (`source_pricing_components`, `source_vendor_commitments`, `source_commercial_exceptions` — all with `vendor_id` columns) | EXIST, vendor_id unused                                              | Activate vendor linkage                 |
| **Proposal package intake** (full response, multi-file, versioned, vendor-isolated)                                                                | MISSING                                                              | **Build**                               |
| **Proposal Health Assessment**                                                                                                                     | MISSING                                                              | **Build (flagship)**                    |
| **Evaluator scoring workflow** (AI-suggest → evaluator edit/override → lock)                                                                       | MISSING (workbook exists, workflow doesn't)                          | **Build**                               |
| **Negotiation levers engine** (Top-10, evidence-cited, no fabricated savings)                                                                      | MISSING                                                              | **Build**                               |
| **Vendor-isolation context trace**                                                                                                                 | MISSING                                                              | **Build**                               |

## 2 · Own vendor upload, or integrate?

**Recommended posture: Option B first** (client/procurement uploads vendor packages),
with a thin **secure per-vendor upload link** only when a client explicitly needs it, and
**connectors** (SharePoint/OneDrive, mailbox, Coupa/Ariba exports) as the enterprise
fast-follow.

The sourcing-advisor reasoning: the submission of record lives in the client's compliant
channel — sealed-bid discipline, timestamp integrity, and protest defense depend on it.
Procurement will not (and should not) move it. The AI reasoning: owning intake only buys
marginal metadata; the hard problem is making _inconsistent received packages_
comparable — which a structured client-upload form (vendor, version, date, file roles)
solves at 5% of the cost of a portal. **The value is not "vendors can upload files." The
value is "AbarVa tells you what the proposals mean."**

## 3 · MVP (and 4 · future state)

**MVP** — exactly the ten steps, mapped to assets:

1. Client/procurement uploads vendor response packages → _new intake route extending the
   existing registry pattern; canonical Blob path
   `source-events/{tenant}/{event}/vendor-responses/{vendor}/{version}/{file}`_.
2. Parse each response → _existing `text-parser.ts` + extraction tables, vendor_id activated_.
3. Proposal Health Summaries → **new** governed generator (per-vendor, isolated bundle).
4. Normalize into the comparison model → _extend `proposal-normalization/` with the AMS
   comparable-fields set; non-comparable answers auto-generate clarification questions_.
5. Client-approved scoring criteria → **new** criteria model (import / archetype-generate /
   AbarVa-propose + client approve).
6. Client edits scores/comments → **new** evaluator workflow (AI-suggested score +
   rationale + evidence; evaluator score/comment/override; lock; consensus).
7. Pricing/commercial comparison → _existing d19 pipeline + TCO_.
8. Top negotiation/BAFO levers → **new** engine feeding the existing BAFO pack.
9. Evaluation committee pack → governed deliverable orchestrator (multi-pass, cited).
10. All artifacts in the File Cabinet (registry + Blob, versioned).

**Future state**: secure vendor upload links (identity, deadline, immutable submission,
late flags); connectors; clarification release workflow with procurement approval; BAFO
response intake and re-scoring; award-pack automation into contracting handoff.

## 5 · What differentiates AbarVa from procurement tools

Procurement suites manage _process_; AbarVa produces _judgment with evidence_:

- **Proposal Health Assessment** — a senior reviewer's read of each proposal (gaps,
  ambiguous commitments, risk-transfer positions, weak answers) before scoring starts.
- **Normalization with honesty** — when answers aren't comparable, AbarVa says so and
  drafts the clarification question ("Vendor A bundled infrastructure as fixed fee;
  Vendor B priced by tower/volume band — request tower-level breakout before scoring").
- **Governed scoring** — AI suggests with citations; the human decides; overrides are
  recorded; nothing locks without a named evaluator.
- **Levers, not vibes** — every optimization opportunity carries evidence, value range
  _only when supported_, otherwise labelled **"opportunity to test"**. No fabricated savings.
- **Provable isolation** — vendor-scoped context bundles with a trace asserting
  `vendor_isolation_status` per output.

## 6 · Proposal Health Assessment model

Per vendor/version, across: completeness vs RFP sections · instruction compliance ·
unanswered/weak/ambiguous answers · exceptions & assumptions · pricing/SLA/transition/
staffing/security gaps · delivery-model & offshore assumptions · automation claims
(committed vs marketing) · subcontractor dependencies · risk-transfer positions · evidence
quality. Output: executive summary, what they proposed, strengths, weaknesses, missing
info, risks, commercial concerns, exceptions, clarification questions, evaluator focus
areas, score-readiness. Generated through the governed orchestrator from a
**vendor-isolated** bundle; every claim cited to that vendor's documents or flagged.

## 6.1 · Minimum viable sourcing extraction

Source should not become a generic vendor-document Q&A system. Vendor responses can be
long, narrative-heavy packages, but the product value is not "read a 100-page response."
The product value is turning the response into the minimum sourcing-critical record needed
to compare, challenge, price, negotiate, and decide.

The required extraction flow is:

```text
sectioned vendor response package
  -> section map
  -> minimum viable sourcing record
  -> exhibit cross-checks
  -> challenge log
  -> BAFO asks
  -> executive decision support
```

Each vendor package must be processed section by section, extracting only:

1. response completeness by RFP section;
2. major vendor claims;
3. evidence supporting each claim;
4. pricing summary: run cost, transition cost, one-time cost, optional cost, 5-year TCO;
5. productivity / automation commitments and whether they are priced back;
6. staffing and location model;
7. SLA targets, credits, caps, exclusions, and reporting;
8. assumptions and exclusions that create buyer risk;
9. commercial, legal, and RFP exceptions;
10. transition plan, KT obligations, dependencies, exit criteria, and milestone linkage.

The normalized output is a **Vendor Response Profile**: vendor name, response
completeness, 5-year TCO, year-one run cost, transition cost, productivity commitment,
SLA commitment, staffing model, major assumptions, major exclusions, commercial
exceptions, unsupported claims, clarification questions, negotiation levers, and a
ready-for-evaluation verdict.

Every extraction should be represented as a card with the vendor, claim or commitment,
evidence reference, structured-exhibit status, missing fields, confidence, sourcing
finding, and recommended action. A productivity claim in a narrative section is not
commercially evaluable unless it is also registered in the claim register and reflected
in the pricing/productivity exhibits.

## 7 · Normalization

`ProposalNormalizationModel` rows: (event, vendor, version, rfp_section,
normalized_category, vendor_response_summary, evidence_reference, normalized_answer,
confidence, completeness, deviations, assumptions, evaluator_notes) — across the 16
categories (scope, towers, SLA, transition, staffing, locations, automation, governance,
tooling, security, commercial model, pricing structure, assumptions, exceptions,
innovation, risk). For AMS, a fixed comparable-fields set (tower coverage, run cost by
tower, transition cost, FTEs, on/offshore mix, SLA targets, credits, volume assumptions,
productivity, automation savings, governance cadence, timeline, termination assistance,
rate cards, volume bands, COLA, pass-throughs, exclusions, assumptions). Non-comparable →
`deviations` + an auto-drafted clarification question.

## 8 · Scoring

`EvaluationCriteria` (id, category, description, weight, scale, evaluator_role,
required_evidence, guidance, red_flags) — importable, archetype-generated, or
AbarVa-proposed with client approval. `VendorScore` (ai_suggested_score, ai_rationale,
evidence_reference, confidence, evaluator_score, evaluator_comment, final_score,
override_reason, locked_by/at). **AI score is never final.** Evaluators edit, comment,
override (reason required), mark disagreement, lock; consensus + committee notes; export
through the existing scorecard renderer.

## 9 · Pricing optimization

Normalize each vendor to the full commercial envelope (base fee, transition,
transformation, tooling, pass-throughs, T&E, one-time vs recurring, term, COLA, volumes,
productivity, automation, credits, gainshare, termination assistance, exit, exclusions,
options, rate cards, location mix, pyramid, subcontractor) → normalized TCO Y1–Y5, total
contract value, one-time vs run-rate, risk-adjusted and scope-adjusted views (existing
d19c + iceberg). Then the **levers engine** emits Top-10 opportunities — each with vendor,
lever type, current-proposal issue, the ask, value range _only when evidenced_ (else
"opportunity to test"), confidence, evidence basis, owner, BAFO priority — feeding the
BAFO Ask Sheet (vendor, issue, current language, requested change, rationale, impact,
fallback, owner, status).

## 10 · Deliverables

Per vendor: response summary · health assessment. Cross-vendor: normalization workbook ·
scorecard · commercial comparison (existing) · risk/exception matrix (trap log) ·
clarification log · committee review pack · down-select recommendation · BAFO readiness
memo + ask sheet · executive recommendation. All rendered professionally (existing
DOCX/XLSX standards), all registered in the File Cabinet with versions.

## 11 · UI workflow

Event tabs: **Vendor Submissions** (status, files, versions, late flags) → **Proposal
Health** (per-vendor health cards) → **Normalization** (category matrix + deviations) →
**Scoring** (criteria, AI-suggested vs evaluator, lock state) → **Commercial Comparison**
→ **Risk/Exceptions** → **Clarifications** (drafted; procurement releases) →
**BAFO/Negotiation** → **Recommendation** → **File Cabinet**. Per-vendor row: response
status, completeness, health score, normalized score, commercial position, key risks,
open clarifications, BAFO asks.

## 12 · Context-bundle proof

`SourceProposalContextBundleTrace` per analysis/scoring output: event, vendor, version,
tenant, archetype, stage, RFP requirements retrieved, vendor files retrieved, normalized
categories, evidence used, pricing inputs, exclusions-by-reason, criteria used,
assumptions, missing inputs, model-input hash, claims detected/supported/unsupported,
citations, `tenant_leakage_status`, **`vendor_isolation_status`** — asserting that no
other vendor's objects entered the bundle. **Hard rule enforced structurally**: bundles
are built per (event, vendor, version); cross-vendor analysis consumes only _normalized
outputs_, never raw rival documents.

## Naming note (governance)

Synthetic proof vendors use **cover names** consistent with the SkyHarbor synthetic
estate — Meridian Systems (incumbent), plus two challengers — not real-firm names.

## Execution sequence

PR-1 this document · PR-2 proposal-intelligence core models (intake, health, scoring,
levers, trace; vendor_id activation) · PR-3 analysis engines via the governed orchestrator
· PR-4 workbooks + UI tabs + routes · PR-5 SkyHarbor live proof (3 synthetic vendor
responses end-to-end, artifacts in File Cabinet, traces emitted).
