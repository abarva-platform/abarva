# Presbyterian Healthcare Services × AbarVa — Private Healthcare Decision-Intelligence Pilot
## Statement of Work, Draft v2

**Date:** 2026-05-26
**Pilot fee:** $300,000 (one-time, 90 days)
**Year-1 conversion target:** $750,000 ARR if success criteria met
**Data posture:** Start synthetic/deidentified during InfoSec review; graduate to approved limited real data as controls clear. No PHI required to land Day-75 value.
**Deployment:** AbarVa Azure private data lane (primary); 1-week AWS portability lab as parallel confidence-building track.

---

## 1. What this pilot is — for the cover memo

This is a **private healthcare decision-intelligence pilot**, not a software license. AbarVa builds a secure context layer over Presbyterian's enterprise technology, sourcing, and transformation data — then uses **Intelligence**, **Moves**, and **Source** to help leadership make better decisions faster.

The 90-day pilot proves whether that context layer can surface real savings, de-risk initiatives, and create board-ready decision artifacts quickly enough to justify a 12-month enterprise contract.

The pilot does NOT require PHI to land Day-75 value. Synthetic and de-identified data carries the pilot while InfoSec completes its review on a parallel track. Limited real-data graduation happens only after PHS controls clear.

---

## 2. The four phases

### Phase 0 — Security + Warmup (Weeks 0-2)

Parallel security review and team warmup. No real data flow.

- Stand up a dedicated AbarVa tenant in the **Azure private data lane**
- Run synthetic / de-identified Presbyterian-like healthcare datasets
- Train CDAO, CIO/IT, procurement, and transformation users on workflows
- **InfoSec review begins immediately and runs in parallel** — architecture diagram, HIPAA posture, data flow, BAA/DPA, encryption at rest and in transit, access model, audit logs, AI egress controls, tenant isolation

**Phase 0 success gate:** synthetic data loaded; 5 named users signed in; InfoSec review packet delivered to PHS within 5 business days of kickoff.

### Phase 1 — Context Layer (Weeks 2-5)

Broad context ingestion across 8-10 enterprise domains. We ask for context broadly, not narrowly for one use case.

Context domains in scope (mix synthetic + de-identified to start; real as cleared):

1. Application portfolio / CMDB extract
2. Cloud and infrastructure inventory
3. Active initiatives / in-flight programs
4. Vendor / contracts / renewal calendar
5. IT spend categories
6. Data governance / AI policy documents
7. Strategic plans / board priorities (where shareable)
8. Procurement pipeline
9. De-identified operational metrics
10. (Optional) recent IT incidents and dependency telemetry

**Outcome:** "What AbarVa knows about Presbyterian" becomes visible, reviewable, approved, and continuously improvable. PHS leadership can SEE their context layer maturing in real time through the `/admin/context-layer` provenance UI.

**Phase 1 success gate:** at least 8 context domains ingested; data-trust scorecard delivered; first Sentinel session against PHS substrate runs cleanly with PHS-specific (not generic-medtech-pattern) responses.

### Phase 2 — Decision Workflows (Weeks 5-10)

Run 3-4 high-value workflows that test all three modules against PHS-specific decisions.

- **Intelligence (1 workflow):** Sentinel-grounded synthesis on a real strategic question. Suggested: *"Where should we focus AI/data modernization in the next 2 quarters?"* — produces evidence-cited recommendations tied to PHS's actual context, regulatory deadlines (CMS-0057-F, Turquoise re-procurement), and strategic priorities.
- **Moves (1-2 workflows):** shape 1-2 strategic moves end-to-end. Sponsor, value model, risk register, gate criteria, pre-mortem. Surface for Governance Committee submission.
- **Source (1 workflow):** run one sourcing/procurement event through the platform. Candidates: cloud/data platform decision, analytics modernization, staff augmentation rebid, AMS renegotiation, ambient documentation vendor evaluation, or AI governance tooling selection.
- **Optional 4th workflow:** produce board / CDAO-ready artifacts showing evidence, assumptions, value, and next actions.

**Phase 2 success gate:** all 3-4 workflows produce decision-grade artifacts with PHS-specific evidence citations; 5-8 named PHS leaders have engaged with workflow outputs.

### Phase 3 — Conversion Case (Weeks 10-13)

Deliver the executive readout that drives the $750K Year-1 conversion decision.

- Quantified **value surfaced** — savings identified, waste avoided, vendor leverage created, initiative risk reduced (target: $1.5M-$3M)
- **Risks avoided** — initiatives where the pilot surfaced a defensible "stop or pivot" recommendation before sunk cost
- **Sourcing leverage** — RFP, renegotiation, or rebid outcomes (or strong rationale)
- **Context layer maturity score** — domain coverage × evidence density × user adoption
- **12-month operating model** — proposed user count, data refresh cadence, governance touchpoints, named priority use cases
- **Commercial proposal** for the $750K Year-1 contract

**Phase 3 success gate:** executive readout delivered to sponsor + CDAO; commercial proposal reviewed; Year-1 decision made.

---

## 3. Success criteria for the $750K conversion

The Year-1 conversion is triggered if **all seven** are demonstrably true at Day 75:

| # | Criterion | Threshold |
|---|---|---|
| 1 | **Context depth** | AbarVa has ingested and mapped at least 8-10 major context domains |
| 2 | **Decision quality** | At least 3 leadership-grade recommendations cite approved PHS-specific evidence (not generic medtech/healthcare patterns) |
| 3 | **Value surfaced** | Identified at least $1.5M-$3M in potential savings, avoided waste, vendor leverage, or initiative risk reduction |
| 4 | **Speed** | Time to frame a major technology / procurement decision reduced from weeks to days |
| 5 | **Security** | PHS InfoSec approves production use for agreed data classes |
| 6 | **Adoption** | 5-8 named PHS leaders use the workflows and rate output as "decision-useful" |
| 7 | **Renewal path** | One 12-month operating model is agreed — users, data refresh cadence, governance, top use cases |

If criteria 1, 2, 3, AND 6 are met but 5 is still in flight (InfoSec review running longer than the pilot window), the Year-1 contract can begin on synthetic+approved-class data only, with PHI scope added after InfoSec clears.

---

## 4. Deployment model

### Primary: AbarVa Azure private data lane

For the 90-day pilot, the primary path is the AbarVa-managed Azure private data lane:

- Dedicated tenant boundary in AbarVa's Azure deployment
- Azure Postgres / private data store
- Encrypted at rest (Azure-managed keys) and in transit (TLS 1.2+)
- Private networking where applicable
- Tenant-scoped access controls (RLS on every Supabase table; `client_id = current_tenant()`)
- Full audit logging for every model + data action (`ai_egress_audit` table)
- No PHI required for the first 90 days unless explicitly approved
- AI egress controls and "no training on customer data" posture
- BAA / DPA path available when production data expands

This avoids a slow cloud migration conversation during the pilot window.

### Parallel: 1-week AWS portability lab (optional, confidence-building)

In parallel to the Azure pilot, AbarVa stands up an AWS lab within Week 1 of kickoff to demonstrate cloud portability and give PHS's architecture team comfort about AWS-residency optionality for Year-1 production.

| Day | Workstream | Deliverable |
|---|---|---|
| 1 | Architecture + account setup | VPC, subnets, security groups, IAM roles, KMS, Secrets Manager, logging baseline |
| 2 | Runtime deployment | Containerized Next.js app on ECS Fargate behind ALB (or App Runner for lab simplicity) |
| 3 | Data layer | RDS / Aurora Postgres, S3 for uploaded artifacts, seed one synthetic / de-identified tenant |
| 4 | AI / data controls | AI egress config, audit logging, tenant isolation smoke, no-PHI guardrails |
| 5 | Functional smoke | Login, Intelligence, Moves, Source, context upload, agent response, audit trace, report export |
| 6-7 | Hardening + handoff | Terraform / IaC cleanup, architecture diagram, security notes, cost estimate, demo script |

**What we explicitly do NOT promise from the 1-week AWS lab:**
- Full HIPAA production approval
- Native Epic / ServiceNow / Coupa integrations
- Enterprise SSO with PHS IdP (unless they move fast)
- Full observability, DR, backups, retention, incident workflow
- AWS Bedrock / private model routing (unless specifically required)

**Production-grade AWS healthcare deployment** (HIPAA controls, BAA review, SSO, logging retention, DR, pen-testing, change control, AWS architecture approval) is a **3-6+ week Year-1 work stream**, not pilot-window. The 1-week lab proves the path; full production AWS lands during Year-1 enterprise rollout if PHS chooses AWS residency.

### How to position this in the CDAO meeting

> *"We do not need AWS deployment to start proving value in 90 days. We begin in AbarVa's Azure private data lane with synthetic and de-identified data while InfoSec reviews the model. In parallel, we stand up an AWS lab in your preferred cloud pattern within a week to prove portability and give your architecture team comfort. If AWS residency becomes a hard requirement for Year-1 production, we already have the deployment path validated."*

---

## 5. Pricing + payment terms

### Pilot fee
- **Total: $300,000** (one-time, 90 days)
- **Schedule:**
  - $100,000 at SOW execution
  - $100,000 at Day 30 (Phase 0 + Phase 1 success gates met)
  - $100,000 at Day 75 (Phase 2 + Phase 3 executive readout delivered)
- Wire transfer, net-30 invoicing
- Travel waived for Albuquerque on-site visits

### Year-1 ARR
- **$750,000 / year** for production access through end of FY27
- Includes:
  - Unlimited Sentinel agent calls within reasonable rate limits
  - Production tenant with full RLS isolation
  - Up to 20 PHS user seats (additional seats $25K/yr per 10-seat block)
  - Monthly governance-committee submission packet generation
  - Quarterly Maestro board-pack auto-refresh
  - 24/7 production support (1-business-day SLA platform; 4-hour SLA tenant-isolation)
  - **Deployment model:** Azure private data lane primary; AWS production deployment available as Year-1 add-on (separately scoped if AWS residency required)

### What's NOT in the pilot fee
- PHS-side data preparation / cleansing
- PHS legal BAA / DPA review
- Custom development beyond named workflows
- Native Epic / Workday / Coupa / ServiceNow integrations (proof-of-portability via flat exports during pilot; native integrations are Year-1 work)
- AWS production deployment (1-week lab is in scope; production AWS is Year-1)

---

## 6. Data + security posture

### Tenant isolation (production-grade)
- Dedicated AbarVa Azure tenant: `tenant_key = 'presbyterian-health'`
- RLS on every data table — PHS data invisible to any other AbarVa tenant
- AbarVa staff access requires tenant-scoped service role with full audit trail
- All AI calls write to `ai_egress_audit` with PHS tenant_id, request metadata, provider/model/decision

### Data class graduation (matches InfoSec cadence)
| Phase | Data classes permitted |
|---|---|
| Phase 0 (Weeks 0-2) | Synthetic + Presbyterian-like deidentified datasets only |
| Phase 1 (Weeks 2-5) | Add: PHS-supplied flat metadata (CMDB extract, vendor contract metadata, public IT spend categories, governance committee minutes after PHS redaction) |
| Phase 2 (Weeks 5-10) | Add: de-identified operational metrics, deidentified initiative artifacts |
| Phase 3 (Weeks 10-13) | Add: limited real data classes that have cleared InfoSec review (specific data classes named in BAA/DPA addendum) |

**No PHI during the pilot window unless explicitly approved by the AI Governance Committee + Legal + InfoSec, gated behind a specific milestone.**

### Production-grade RLS audit
- AbarVa delivers third-party RLS / tenant-isolation audit report within 5 business days of pilot kickoff
- No PHS data ingestion begins before this report is in PHS hands
- Audit covers: tenant boundary enforcement, row-level security policies, service-role access controls, ai_egress_audit completeness

### "No training on customer data" posture
- AbarVa contractually commits to NOT use any PHS-supplied data (synthetic, de-identified, or real) for training or fine-tuning of foundation models
- Vector embeddings derived from PHS data are tenant-scoped and PHS-deletable on termination
- The AbarVa industry-pattern corpus (used to ground Sentinel on generic patterns) is built from public sources and other tenants' explicitly-approved patterns — never from PHS data

### Data return + deletion
- 30 days post-termination: AbarVa exports all PHS-supplied data + derived analyses in machine-readable format
- 60 days post-termination: complete purge with attested deletion certificate (chunks, embeddings, audit metadata except minimal required retention)

---

## 7. Roles + governance

### Required from PHS (the CDAO "ask" — see Section 11)
- **Sponsor** (Year-1 commit authority)
- **Day-to-day pilot owner** (weekly working session attendance)
- **5 named users** for Phases 0-2
- **InfoSec contact** for parallel review
- **Procurement / contract lead**
- **3 priority use cases / decisions** PHS wants the pilot to address
- **Phased data access list** matching the Phase 0-3 graduation table

### AbarVa team
- **Pilot owner** (single point of contact)
- **Solution architect** (Azure tenant + AWS lab + InfoSec packet)
- **Domain advisor** (healthcare AI / payvider economics; named advisor with payvider experience to be confirmed)
- **Maestro / synthesis lead** (board pack + conversion case)

### Cadence
- Weekly 60-min working session (sponsor + AbarVa pilot owner + day-to-day owner)
- Bi-weekly 30-min InfoSec checkpoint (Phase 0)
- Day-30, Day-60, Day-75 written checkpoint memos
- All Sentinel sessions recorded (with consent); transcripts in PHS tenant for audit replay

---

## 8. Risks + mitigations

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | InfoSec review cycle exceeds 12 weeks | HIGH | Phase 0 designed for parallel review; pilot delivers Day-75 value on synthetic + Phase 1 data classes alone |
| 2 | CMO seat in transition (post-Mitchell departure March 2025) makes clinical AI ownership unclear | MEDIUM | SOW names CDAO + CEO Sikka as executive sponsors; clinical workflows scoped to Move types not requiring CMO sign-off |
| 3 | Existing PHS analytics relationships (MedeAnalytics et al.) push back on AbarVa scope | LOW-MED | SOW positions AbarVa as synthesis layer ABOVE existing analytics/SI, not substitute. No displacement scope in pilot. |
| 4 | Sentinel hallucinates on PHS-specific named entities before substrate is fully loaded | LOW | Fact-fingerprint guardrail (shipped in Packet 27) prevents fabrication. Demo-readiness audit at Day 30 confirms zero hallucinations before client-visible sessions. |
| 5 | PHS data prep effort exceeds expectation | MEDIUM | Day-7 data-readiness scorecard surfaces specific cleansing needs. PHS commits to a named data-prep owner. Mutually-defined cleansing scope. |
| 6 | AWS-residency requirement emerges mid-pilot as hard blocker | LOW | 1-week AWS portability lab proves the path; pilot continues on Azure; full AWS production deployment scoped as Year-1 work stream |

---

## 9. Term + termination + IP

### Term
- Pilot effective at SOW execution; expires Day 90 unless converted to Year-1 ARR
- Year-1 ARR effective Day 90; one-year initial term; auto-renews unless terminated

### Termination
- PHS may terminate the pilot with 14 days written notice; pro-rated refund of unused pilot fee
- AbarVa may terminate for non-payment with 30 days notice and cure
- Either party may terminate Year-1 with 60 days written notice before anniversary
- Termination for cause (data breach, material BAA violation, fraud): immediate

### IP
- AbarVa retains platform, code, models, AbarVa-authored corpus
- PHS retains all PHS-supplied data + derived PHS-specific analyses
- Aggregated, de-identified insights derived from PHS data may inform AbarVa industry patterns **only after explicit PHS approval per insight class**
- AbarVa receives a non-exclusive perpetual license to reference PHS as a customer in marketing AFTER PHS PR review

### Confidentiality
- Mutual NDA for SOW term plus 3 years
- PHS-specific findings (vendor evaluations, sourcing recommendations, board pack content) are PHS-confidential

---

## 10. What McKinsey / Deloitte / Accenture would charge for the equivalent

(Quote-ready for the "why not just hire Deloitte?" moment.)

| Comparator | What they deliver | What AbarVa delivers different |
|---|---|---|
| McKinsey AI strategy engagement | 12-16-week study, named team on-site, board deck with their logo, political work, narrative cover | Same deliverables (vendor matrices, business cases, board pack) — but auto-refreshable, evidence-traceable to PHS source documents, PHS-owned. We do NOT displace McKinsey for political work or narrative cover. We displace them for the synthesis work that should have been built on PHS's own data. |
| Deloitte / Accenture SI execution | Implementation muscle, change management, billable-hour pyramid | AbarVa is NOT an SI. We sit ABOVE the SI layer, sharpening scope and surfacing lock-in clauses BEFORE the SI's SOW is signed. PHS still hires an SI for implementation. |
| KPMG / EY governance advisory | Governance framework templates, risk libraries, audit advisory | Atlas module produces comparable governance-committee submission packets — but tied to PHS's actual Moves with auto-refresh, not deliverable PDFs that go stale. |
| Internal team building this | Full ownership, no ongoing fees | Time-to-value: building AbarVa-equivalent internally takes ~18 months and $4M+. We deliver Day-30 grounded Sentinel against PHS data. |

---

## 11. The CDAO meeting ask — bring this to the meeting

For the meeting with PHS CDAO, ask explicitly for:

1. **90-day pilot sponsor** (Year-1 commit authority — confirm sponsor is CDAO and/or CEO Sikka)
2. **5 named users** to participate in Phases 0-2 (CDAO + CIO/IT + procurement + transformation + clinical leadership representative)
3. **3 priority decisions / use cases** PHS wants the pilot to address — these become the Phase 2 workflows
4. **InfoSec contact** for the parallel review track (Phase 0)
5. **Procurement / contract lead** for SOW + BAA execution
6. **Permission to use synthetic / deidentified warmup data** during Phase 0 (no PHI required)
7. **Phased data access list** matching the Phase 0-3 graduation table in Section 6
8. **Agreement that conversion is based on the seven success criteria** in Section 3

This gives PHS a clean story: fast value now, secure path to production, no unnecessary AWS deployment drag before they believe in the product.

---

## 12. Open items requiring PHS input before SOW execution

1. Sponsor confirmation (CDAO and/or CEO Sikka)
2. Day-to-day pilot owner
3. PHP leadership representative (if Move B / Turquoise workflow becomes a priority use case)
4. Legal / compliance lead for BAA + SOW execution
5. Data-prep owner for Phase 1 connectors
6. Existing analytics / SI engagements that need scope-fencing
7. PHS W-9 + ACH wire details
8. Insurance certificates (E&O, cyber, general liability if PHS requires)
9. AWS lab go/no-go decision — proceed with parallel lab or defer to Year-1?

---

## 13. Companion artifacts (separate documents)

- `PHS_CDAO_MEETING_ONE_PAGER.md` — executive briefing for the CDAO conversation (this packet's Section 1 + 11 distilled)
- `PHS_DISCOVERY_NOTES_TEMPLATE.md` — paste-in template for discovery findings
- `PHS_BAA_DPA_v1.md` — BAA + DPA redlines (authored after PHS legal supplies their template)
- `PHS_INFOSEC_REVIEW_PACKET.md` — architecture diagram, HIPAA posture, data flow, encryption, access model, audit logs, AI egress controls (delivered Day 5 of Phase 0)
- `PHS_AWS_PORTABILITY_LAB_PLAN.md` — the 1-week AWS lab day-by-day plan with Terraform / IaC scaffolding
- `PHS_KICKOFF_PLAN.md` — Week-1 detailed plan post-signature
- `PHS_RLS_AUDIT_REPORT.md` — third-party tenant-isolation audit (delivered Day 5)

---

## 14. Signature block

```
PRESBYTERIAN HEALTHCARE SERVICES
By: ________________________________
Name:
Title:
Date:


ABARVA, INC.
By: ________________________________
Name: Anand Sundaram (or executive signatory)
Title:
Date:
```

---

**Version history**
- v1 (2026-05-26 earlier) — Initial draft with three named Anchor Moves; superseded
- **v2 (2026-05-26 current)** — Repositioned as private healthcare decision-intelligence pilot; added Phase 0; price $225K → $300K; success criteria sharpened to 7; AWS portability lab added; data posture inverted (synthetic-first, real-as-cleared)
- v3 (planned post-discovery-paste-in) — All `[FILL IN]` resolved; legal review
