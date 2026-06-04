# Client Paper Review Playbook

Status: draft for counsel review
Owner: AbarVa platform owner
Last updated: 2026-06-03
Backlog rows: T019, T020, T021

## Purpose

This playbook turns the general contract redline posture into a repeatable
intake process for client-provided NDA, MSA, and SOW paper. It is not legal
advice and must not be sent to a customer as approved contract language without
counsel review.

Use this when a buyer sends its own document set. The goal is speed with
discipline: identify company-ending risk, keep the pilot scope honest, preserve
AbarVa IP, and avoid accepting obligations that the product or operations model
does not yet support.

## Review Sequence

Do not review client paper as isolated files. Read them in this order because
later documents often incorporate earlier terms by reference:

1. NDA or confidentiality agreement.
2. MSA or master services agreement.
3. Security, privacy, AI, data-processing, or procurement exhibits.
4. SOW, order form, purchase order, or pilot addendum.
5. Any buyer policies incorporated by URL or "as updated from time to time."

If the client says the SOW controls over the MSA, confirm the precedence clause
explicitly. If the client says the PO controls, escalate to counsel before
signature.

## Intake Checklist

| Step | Owner | Evidence to capture |
| --- | --- | --- |
| Save original files | AbarVa owner | Original PDF/DOCX filenames, received date, sender, and version. |
| Identify document hierarchy | AbarVa owner | Precedence clause, incorporated exhibits, policy URLs, and PO references. |
| Classify risk | AbarVa owner + counsel | NDA only, pilot SOW, production MSA, regulated data, security exhibit, or AI-specific terms. |
| Apply redline brief | AbarVa owner | Issue log referencing `docs/legal/contract-redline-brief.md`. |
| Apply AI SOW clauses | AbarVa owner | Issue log referencing `docs/legal/ai-sow-clause-playbook.md`. |
| Counsel review | Lawyer | Redline file, comment summary, and approval or open issues. |
| Founder decision | Anand | Accept, counter, escalate, or walk-away decision. |

## T019 - NDA Review

The NDA is often presented as "standard" but can quietly transfer product
rights or block later customers. Review before sharing non-public roadmap,
security, pricing, architecture, or customer-specific material.

| Clause | Redline target | Fallback |
| --- | --- | --- |
| IP assignment | Strike any assignment of evaluation work, prototypes, feedback, ideas, derivatives, product improvements, or platform learnings. | Client owns its confidential information only; AbarVa retains background IP and generalized know-how. |
| Residual knowledge | Add right to use unaided memory, general ideas, skills, and know-how. | Limit to non-confidential generalized know-how. |
| Non-solicit | Strike broad employee, contractor, advisor, customer, or prospect restrictions. | Narrow to named personnel directly involved in the evaluation for 12 months. |
| Publicity | No logo, press release, or case study without written approval. | Keep mutual written approval; do not grant blanket publicity in the NDA. |
| Confidentiality term | Two to three years, except trade secrets while protected by law. | Five years for highly sensitive enterprise buyers; trade secrets remain protected. |
| Return/deletion | Reasonable return/deletion with archival, backup, audit, and legal-retention carveouts. | Certification on request, subject to backup rotation and legal holds. |
| Injunctive relief | Avoid automatic admission of irreparable harm. | Relief only as available under applicable law. |
| Evaluation restrictions | Strike language preventing AbarVa from building similar products or serving similar customers. | Restrict use of the client's confidential information, not independent development. |

NDA escalation triggers:

- Any assignment of AbarVa IP or product improvements.
- Any restriction on working with the client's competitors, prospects, or
  industry peers.
- Any requirement to submit inventions, feedback, or product ideas to the
  client.
- Any security obligation that belongs in the MSA or data-processing addendum.

## T020 - MSA Review

The MSA is where pilot economics can become company-level risk. Apply the
eight-clause redline brief before discussing implementation dates or pricing.

| Issue | Must-hold position | Escalate if client insists |
| --- | --- | --- |
| Liability cap | Mutual cap at 12 months of fees paid, with counsel-approved exceptions only. | Unlimited liability, uncapped confidentiality breach, uncapped AI-output reliance, or cap above 2x annual fees. |
| Indemnity | Third-party IP infringement, breach of confidentiality, gross negligence, or willful misconduct; mutual where appropriate. | Broad "arising from services" indemnity or client reliance indemnity pushed onto AbarVa. |
| IP ownership | AbarVa retains platform, models, methods, improvements, know-how, and generalized learnings. Client owns client data and client-specific content. | Client ownership of work product, derivatives, product improvements, or feedback. |
| Data rights | Client data remains client-owned; AbarVa may process only for agreed services, support, security, and legal compliance. | Training rights, broad analytics reuse, cross-client data use, or unsupported retention promises. |
| Security obligations | Match actual security posture, private data-plane model, subcontractors, and evidence package. | Requirements for certifications, audit rights, insurance limits, or controls not yet implemented. |
| SLA and credits | Pilot target only unless production operations are contractually ready; credits capped and exclusive remedy. | Strict 99.9%+ SLA, uncapped credits, termination for single incident, or customer-system/provider outages counted against AbarVa. |
| Audit rights | Scoped, scheduled, annual, third-party, security/contract compliance only. | Open-ended system access, broad books/records access, or audit of other customer environments. |
| Assignment | Carve out merger, acquisition, financing, reorganization, or sale of substantially all assets. | Client consent required for change of control with no deemed-consent fallback. |

MSA escalation triggers:

- Any term that could block financing, acquisition, or future product reuse.
- Any obligation that requires multi-client production maturity when the deal is
  only a single-client pilot.
- Any commitment to real-time integrations, private data-plane features,
  certifications, or support coverage not yet delivered.
- Any clause that treats AbarVa AI output as an autonomous decision or legal,
  financial, employment, healthcare, credit, safety, or regulated determination.

## T021 - SOW Review

The SOW should be narrower than the sales story. It must state exactly what the
pilot includes, what it excludes, how change orders work, and who approves
deliverables.

| SOW area | Required posture |
| --- | --- |
| Scope | Name the modules, users, client, data scope, environments, and pilot duration. Avoid "all enterprise systems" or open-ended transformation language. |
| Deliverables | Define tangible outputs: configuration, dashboards, board packs, data-load reports, training, support cadence, and pilot readout. |
| Data loading | Attach the approved data-use policy, attestation, quarantine, and load-ledger process. Do not allow cross-client or cross-tenant loading. |
| AI output | State AI-assisted decision support only. Client remains responsible for human review, validation, approval, and external action. |
| Acceptance | Time-box review windows. Acceptance should not depend on business outcomes outside AbarVa control. |
| SLAs | Use pilot support targets unless production SLA evidence exists. Exclude third-party outages and client systems. |
| Change orders | Pre-agree hourly rate, preferably `$400/hr` or at least `$375/hr`, and require written approval before work begins. |
| Out-of-scope | List integrations, custom models, unsupported file cleanup, legal/regulatory determinations, live external actions, and production obligations not included. |
| Renewal/conversion | State what happens after pilot end: convert, extend by written amendment, or wind down/export/delete according to policy. |

SOW escalation triggers:

- Scope or deliverables cannot be proven with current product, staffing, or
  environment evidence.
- Buyer asks for production support, external actions, or live integrations not
  included in the pricing.
- Buyer refuses a change-order mechanism.
- Buyer wants success criteria based on guaranteed cost savings, revenue,
  productivity, AI accuracy, or adoption outcomes.

## Issue Log Template

Use one row per issue. Keep the log separate from the redline so Anand and
counsel can make fast decisions.

| Field | Required content |
| --- | --- |
| Document | NDA, MSA, SOW, exhibit, PO, or policy URL. |
| Section | Clause number and heading. |
| Risk class | IP, liability, security, AI, data, scope, payment, SLA, audit, assignment, or other. |
| Current language | Short excerpt or summary, not full copied clause text. |
| Requested redline | Plain-English change request. |
| Fallback | Acceptable fallback if buyer resists. |
| Owner | AbarVa owner, counsel, buyer counsel, or founder decision. |
| Decision | Accept, counter, escalate, walk away, or counsel pending. |

## Evidence Packet for Counsel

Attach these repo artifacts when sending a client-paper packet to counsel:

- `docs/legal/contract-redline-brief.md`
- `docs/legal/ai-sow-clause-playbook.md`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`
- `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`
- `docs/pilot/OUT_OF_SCOPE_CATALOG.md`
- `docs/runbooks/release-environments-and-promotion.md`
- `docs/runbooks/data-return-deletion.md`
- `docs/runbooks/vendor-management.md`

## Status Rules

- Mark T019, T020, or T021 `In progress` when this playbook and the issue log
  are prepared for that document type.
- Mark a row `Done` only after counsel has reviewed the actual client paper or
  approved the reusable redline position for that document type.
- Do not mark T016 `Done` until counsel pre-blesses the reusable redline brief.

## Known Gaps

This is a draft operating playbook, not final legal advice. It does not replace
lawyer review, client-specific redlines, or founder approval of commercial
fallbacks.
