# Source Artifact Binding Matrix

Generated: 2026-06-05T00:00:00.000Z

This report is the control surface for Source artifact reality. It separates upload intake, export/download rendering, and the gold-standard artifact expectations so the product cannot call an artifact finished unless the binding is actually wired.

## Summary

| Metric | Count |
|---|---:|
| Canonical artifacts | 33 |
| Upload intake ready | 33 |
| Declared downloads fully renderer-backed | 11 |
| Wired end-to-end | 4 |
| Partial | 25 |
| Planned | 4 |
| Blocked | 0 |

## Matrix

| Stage | Artifact | Status | Uploads | Downloads | Renderer-backed | Current gap |
|---|---|---|---|---|---|---|
| Strategy | Sourcing Strategy Memo (d01_strategy_memo) | wired | pdf, docx, pptx, markdown, txt | html, docx, pdf | docx, html, pdf | Add formal sponsor approval and value/evidence checklist before stage advancement. |
| Strategy | Value Target Brief (d02_value_target) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Add review/approval workflow and richer strategy evidence checklist. |
| Strategy | Archetype Decision Record (d03_archetype_decision) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Add review/approval workflow and richer strategy evidence checklist. |
| Scope | Application Inventory & Tiering (d04_app_inv) | partial | xlsx, csv, pdf, docx | xlsx, docx, pdf | docx, pdf, xlsx | Add dedicated inventory/ticket parsers and field-level completeness checks. |
| Scope | Scope Memo with Boundaries (d05_scope_memo) | wired | pdf, docx, pptx, markdown, txt | html, docx, pdf | docx, html, pdf | Add scope-owner approval and exclusion-log reconciliation. |
| Scope | Exclusion Log (d06_excl_log) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Add explicit scope signoff and exclusion approval flow. |
| Scope | Ticket History Synthesis (d07_ticket_synth) | partial | xlsx, csv, pdf, docx | xlsx (gap), docx (gap) | none | Add dedicated inventory/ticket parsers and field-level completeness checks. |
| Scope | Pre-mortem on Scope Risk (d08_premortem) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap) | none | Add structured workshop capture templates and participant signoff. |
| RFP | RFP Package (d09_rfp_pack) | wired | pdf, docx, pptx, markdown, txt | html, docx, pdf | docx, html, pdf | Add issued-to-vendors tracking and addendum history. |
| RFP | RFI Summary (if pre-RFI was run) (d10_rfi_summary) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Add vendor qualification checklist, conflicts, and disqualification approvals. |
| RFP | Response Checklist (d11_response_checklist) | partial | xlsx, csv, pdf, docx | xlsx, docx, pdf | docx, pdf, xlsx | Connect d13 uploads to d15 completeness and make gaps visible in the event log. |
| RFP | Vendor Shortlist (d12_vendor_shortlist) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Add vendor qualification checklist, conflicts, and disqualification approvals. |
| Responses | Vendor Response Pack (d13_vendor_responses) | partial | pdf, docx, xlsx, csv, pptx, txt | html (gap) | none | Build vendor picker, bulk upload, response versioning, parse status, and mapping to required RFP sections. |
| Responses | Q&A Log (d14_qa_log) | planned | xlsx, csv, docx, pdf, txt | xlsx (gap), docx (gap) | none | Add question intake, answer drafting, official-answer approval, and manual-send/export support. |
| Responses | Response Completeness Report (d15_response_completeness) | partial | xlsx, csv, pdf, docx | xlsx (gap), docx (gap) | none | Connect uploaded response sections to completeness rules and gate blockers. |
| Evaluation | Evaluation Scorecard (d16_scorecard) | partial | xlsx, csv, docx, pdf | xlsx, docx, pdf | docx, pdf, xlsx | Add scorer assignments, rationale capture, and lock/approve semantics. |
| Evaluation | Weight Set Governance Log (d17_weight_log) | partial | xlsx, csv, docx, pdf | xlsx (gap), docx (gap) | none | Add evaluator assignment, rationale capture, dispute handling, and lock/approve state. |
| Evaluation | Disqualification Rationale (d18_disqualification_log) | partial | xlsx, csv, docx, pdf | xlsx (gap), docx (gap), pdf (gap) | none | Add evaluator assignment, rationale capture, dispute handling, and lock/approve state. |
| Pricing | Pricing Normalization Workbook (d19_pricing_workbook) | wired | xlsx, csv, pdf, docx | xlsx, docx, pdf | docx, pdf, xlsx | Extend parser linkage to d20 trap log and d21 locked assumptions with approval state. |
| Pricing | Pricing Trap Log (d20_trap_log) | partial | xlsx, csv, pdf, docx | xlsx, docx, pdf | docx, pdf, xlsx | Populate traps from pricing submissions, assumptions, exclusions, and BAFO deltas. |
| Pricing | Locked Assumption Set (d21_assumption_set) | partial | xlsx, csv, pdf, docx | xlsx (gap), docx (gap), pdf (gap) | none | Add sponsor/CFO assumption lock with version history. |
| BAFO | BAFO Question Pack (d22_bafo_question_pack) | partial | pdf, docx, xlsx, csv, pptx, txt | xlsx, docx, pdf | docx, pdf, xlsx | Add per-round finalist response upload, delta extraction, and acceptance tracking. |
| BAFO | BAFO Round Log (d23_bafo_round_log) | partial | pdf, docx, xlsx, csv, pptx, txt | docx (gap), pdf (gap) | none | Add per-round finalist response upload, delta extraction, and acceptance tracking. |
| Executive Decision | Atlas Decision Brief (d24_decision_brief) | partial | pdf, docx, pptx, markdown, txt | html, docx, pdf | docx, html, pdf | Wire d24 prompt template to scorecard, pricing, risk, BAFO, and dissent context. |
| Executive Decision | Sentinel Risk Attestation (d25_risk_attestation) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Wire d24/d25/d26 generation and approval record as first-class workflow. |
| Executive Decision | Steward Sign-off Record (d26_steward_signoff) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Wire d24/d25/d26 generation and approval record as first-class workflow. |
| Selection | Selection Memo (d27_selection_memo) | partial | pdf, docx, pptx, markdown, txt | html, docx, pdf | docx, html, pdf | Add award notification draft, contract metadata capture, and legal/procurement handoff. |
| Selection | Contract Record (d28_contract_record) | partial | pdf, docx, pptx, markdown, txt | html (gap), docx (gap), pdf (gap) | none | Add award notification draft, contract metadata capture, and legal/procurement handoff. |
| Transition | Transition Plan (d29_transition_plan) | planned | pdf, docx, xlsx, csv, pptx, txt | docx (gap), pdf (gap) | none | Add checkpoint state, KT acceptance, and cutover go/no-go logging. |
| Transition | Checkpoint Log (d30_checkpoint_log) | planned | pdf, docx, xlsx, csv, pptx, txt | docx (gap), pdf (gap) | none | Add checkpoint state, KT acceptance, and cutover go/no-go logging. |
| Transition | Knowledge-Transfer Evidence (d31_kt_evidence) | planned | pdf, docx, xlsx, csv, pptx, txt | docx (gap), pdf (gap) | none | Add checkpoint state, KT acceptance, and cutover go/no-go logging. |
| Value | Value Ledger (d32_value_ledger) | partial | xlsx, csv, pdf, docx | xlsx (gap), docx (gap), pdf (gap) | none | Tie awarded contract terms and realized performance evidence into value states. |
| Value | Governance Review Note (d33_governance_review) | partial | xlsx, csv, pdf, docx | xlsx (gap), docx (gap), pdf (gap) | none | Add CFO attestation, measurement cadence, and renewal/SRM feedback loop. |

## Acceptance Rule

A user-visible upload/download control may ship only when its artifact row is `wired`, or when the UI clearly marks the action as a governed draft/planned state and does not initiate a silent or phantom action. Partial artifacts may still accept uploads, but downstream use must show parser, evidence, and approval status before the artifact influences a recommendation.

