# Source Deliverable Standard (gold standard) — APPROVED 2026-06-10

**Sign-off (locked):**
- **Formats:** approved as proposed (matrix in §2). RFP = DOCX-primary + XLSX companions + PDF; Exec recommendation = PPTX; Strategy = DOCX + PPTX; Readiness = HTML; Pricing = DOCX + XLSX. Every deliverable renders to its allowed alternates on request.
- **AI imagery:** **decorative + AI-assisted concept diagrams** allowed (covers, dividers, target-operating-model / tower maps), clearly flagged — **all data exhibits (charts/tables) come strictly from real computed facts, never AI-imagined.**
- **Refinement:** **full living-artifact model** — after generation the client can raise quality, add data exhibits, add decorative imagery/concept diagrams, reshape sections, request alternate formats, and escalate ("not good enough → redo to gold standard"). Every refinement re-runs through the governed bundle (no fabrication), versioned + diffable.


The bar every Source/AMS deliverable must clear, the canonical outline (table of
contents) for each, the canonical format + allowed alternates, the multi-format
flexibility model, and the post-generation refinement model. Nothing ships below
this bar. (Set before generation — 2026-06-10.)

## 0 · Universal quality bar (every deliverable)
1. **Thesis-first** (pyramid principle): the answer/recommendation in the first 5 lines, then support.
2. **Quantified value case**: $ ranges, % of addressable spend, with **stated assumptions** — never a fabricated market benchmark. Numbers computed from governed facts.
3. **Mandatory exhibits**: each deliverable lists required exhibits (charts/tables built from real computed data, not AI-imagined).
4. **MECE structure**, audience-correct altitude (board ≠ working team).
5. **Citation discipline**: clean executive prose; sources in a **numbered appendix / source register**, never inline `[chunk_id]` plumbing.
6. **Missing-evidence visible**: an explicit "what we do not yet know / cannot answer" section; weak sections labeled.
7. **No fabrication**: vendor rates, SLAs, benchmarks only if in evidence; else "EVIDENCE MISSING — to validate."
8. **Tenant-safe**: SkyHarbor-only evidence; governed bundle; trace exists.
9. Passes the deliverable's structural checklist + wisdom rubric (≥ target) before "ready."

## 1 · Deliverable catalogue — outline, format, exhibits

### A. AMS Sourcing Event Brief
- **Purpose / audience:** align sponsors before work starts · CIO/CPO/sponsors.
- **TOC:** Mandate & objective · In-scope/out-of-scope (towers, estate) · Why now (burning platform) · Decision rights & governance · Timeline & milestones · Evidence-readiness verdict · Top risks/dependencies.
- **Exhibits:** scope map; milestone timeline.
- **Canonical: PPTX (1–3 slides)** · Alt: PDF, DOCX.

### B. Evidence Readiness Report
- **Purpose / audience:** gate the RFP; show evidence posture · deal team/sponsor.
- **TOC:** Readiness scorecard by evidence family (committed→indexed→retrievable→citation-ready→agent_ready) · Coverage by AMS family · Gaps + owners + remediation · Risk of proceeding now.
- **Exhibits:** readiness heatmap; family coverage bar.
- **Canonical: HTML (live/interactive)** · Alt: PDF snapshot.

### C. Sourcing Strategy Memo
- **Purpose / audience:** the POV — how to go to market & why · CIO/CFO/CPO.
- **TOC:** Executive thesis · Situation (estate, spend, SLA, incumbents) · Complication (why current state fails) · **Value at stake** ($ range + assumptions) · Strategic options (retain/outsource/hybrid by tower; single- vs multi-tower; compete vs renegotiate) · Recommended path + buying motion · Approach & sequencing · Risks & mitigations · Next steps.
- **Exhibits:** spend-by-tower waterfall; retain-vs-outsource 2×2; value bridge; SLA-gap chart.
- **Canonical: DOCX (narrative)** + **PPTX (exec readout)** · Alt: PDF.

### D. AMS RFP  ← centerpiece
- **Purpose / audience:** the solicitation issued to vendors (external).
- **TOC:** Cover + instructions to bidders · Executive overview & objectives · **Scope of services by tower** · Current-state context (volumes, cost, SLA) · SLA/KPI schedule + credits · **Resource-unit & pricing schedule** · Productivity & automation commitments · Transition & knowledge transfer · Retained-org & governance · Security/compliance · Commercial terms (rate card, COLA, audit, exit) · Response instructions & **evaluation criteria** · Appendices: application/CMDB inventory, SLA schedule, pricing template, requirements traceability, glossary.
- **Exhibits / companions:** tower scope matrix; SLA schedule; pricing template.
- **Canonical: DOCX (always)** — vendors edit/respond, section-numbered, formal. **Companions: XLSX** (pricing template, SLA schedule, requirements traceability matrix), **PDF** (locked issue version).

### E. Vendor Discussion Guide
- **Purpose / audience:** deal-team playbook for vendor sessions · internal.
- **TOC (by topic):** delivery model · resource units & shift coverage · automation/productivity · SLA & credits · transition & KT · termination assistance — each with: questions to ask, what to probe, what NOT to reveal yet, likely pushback, red flags.
- **Canonical: DOCX** · Alt: PDF.

### F. Pricing & Negotiation Intelligence Memo
- **Purpose / audience:** should-cost, lever plan, BAFO posture · CIO/CFO/Procurement.
- **TOC:** Current baseline (cited) · **Should-cost model** (bottom-up) · **TCO normalization** across bids · Pricing model to demand · Negotiation levers sequenced by timing · Walk-away/BATNA · BAFO asks by vendor.
- **Exhibits:** should-cost waterfall; TCO-normalized comparison; savings bridge; lever timeline.
- **Canonical: DOCX + XLSX (the should-cost / TCO model workbook)** · Alt: PDF.

### G. Executive Recommendation / Board Paper
- **Purpose / audience:** the decision ask · CIO/CFO/board.
- **TOC:** Recommendation (the ask) · Value case ($, risk-adjusted) · Options considered & rationale · Risks & contract protections · Evidence basis & confidence · **What is NOT yet decidable** (missing evidence) · Decision & next steps.
- **Exhibits:** value case; options comparison; risk matrix.
- **Canonical: PPTX (board deck)** + PDF · Alt: DOCX 2-pager.

### (Optional) H. Evaluation Scorecard — **XLSX** (weighted criteria + disqualifiers) + PPTX summary.
### (Optional) I. Transition & Risk Plan — DOCX/PPTX.

## 2 · Format standard & flexibility
- **One content object → many renders.** Each deliverable is a format-agnostic `SourceDeliverable` content model rendered to any **allowed** format on demand (reuses the repo HTML/DOCX/PDF/XLSX/PPTX renderers).
- **Canonical = the default** the client gets. The client can request alternates ("also as PPTX", "export PDF", "pricing as XLSX") **within the allowed-format matrix** — not every format for every deliverable (e.g., an RFP is never a PPTX).

| Deliverable | Canonical | Allowed alternates |
|---|---|---|
| Event brief | PPTX | PDF, DOCX |
| Readiness report | HTML | PDF |
| Strategy memo | DOCX + PPTX | PDF |
| **RFP** | **DOCX** | **XLSX (companions), PDF** |
| Vendor guide | DOCX | PDF |
| Pricing memo | DOCX + XLSX | PDF |
| Exec recommendation | PPTX | PDF, DOCX |
| Eval scorecard | XLSX | PPTX |

## 3 · Post-generation refinement (the deliverable is a living artifact)
After generation the client can iterate — each refinement re-runs through the governed bundle (no fabrication), is versioned and diffable:
- **Raise quality:** "make it board-grade", "tighten the exec summary", "go deeper on tower economics" → refinement loop against the quality bar until it passes.
- **Add exhibits:** "add a should-cost waterfall / spend-by-tower chart" → **data exhibits generated from real computed facts** (never invented).
- **Add imagery:** "add a cover / section art" → **AI-generated images allowed for DECORATION ONLY** (covers, dividers, conceptual art), clearly never for data visualization; data charts always come from real numbers.
- **Reshape:** "regenerate section X with more evidence / a different angle", "give me this as a board deck too".
- **Quality escalation:** if a draft is below the gold standard, the client can demand a higher-quality pass; the system must re-attempt to standard, not return the same draft.

## 4 · Definition of done (per deliverable)
Ready ⇔ matches the canonical TOC · includes all mandatory exhibits (from real data) · clears the universal quality bar · citations in appendix · missing-evidence section present · rendered to canonical format(s) · wisdom rubric ≥ target. Anything short is labeled DRAFT/WEAK, never passed off as final.

---
**Open decisions for sign-off:** canonical formats (esp. RFP=DOCX, exec=PPTX, pricing=DOCX+XLSX); whether AI-generated imagery is allowed (decorative-only proposed); the refinement/quality-escalation model.
