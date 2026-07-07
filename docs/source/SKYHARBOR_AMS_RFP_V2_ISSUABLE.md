# SkyHarbor AMS RFP v2 (issuable, mode-aware) — claude-opus-4-8

**Completeness scorecard:** AUTO-GOVERNED 5 · AUTO-TEMPLATE 6 · ELICIT 9 · CLIENT-COMPLETE 6  |  9 intake sections · 6 client decisions

# SkyHarbor Air — Application Management Services (AMS) RFP

**Confidential — Issued by SkyHarbor Air Sourcing & Vendor Management**
*Prepared with AbarVa Sentinel + Nexus. Governed facts cited [n]; template and elicitation content flagged per section.*

---

## 1. Instructions to Bidders & Submission
*So-what: This section sets the rules of engagement; an incomplete timeline or unclear submission channel invalidates bids and triggers protests.*

_(Standard template — client to review.)_

**1.1 Purpose.** SkyHarbor Air ("SkyHarbor," "the Company") invites qualified bidders ("Bidders") to respond to this Request for Proposal ("RFP") for Application Management Services across the towers defined in Section 3. This RFP is an invitation to propose and does not constitute an offer or commitment to contract.

**1.2 Communications & Confidentiality.** All communications must route exclusively through the designated Sourcing Lead via the submission portal. Contact with any other SkyHarbor employee regarding this RFP may result in disqualification. This RFP and all attachments are confidential and subject to the mutual NDA executed as a condition of receipt.

**1.3 Q&A Process.** Bidders may submit written questions through the portal until the Q&A close date. Consolidated, anonymized responses will be issued to all participants as an addendum.

**1.4 Response Format.**
- PDF technical proposal (max 60 pages ex. exhibits), 11pt minimum.
- Separate, sealed commercial proposal (Section 6 schedules) in the prescribed workbook.
- All mandatory forms (Section 13) signed by an authorized officer.
- Submissions after the deadline are rejected without exception.

**1.5 Bid Validity.** Proposals must remain valid for 180 days from the response due date.

**1.6 Reservation of Rights.** SkyHarbor may amend, suspend, or cancel this RFP; request clarifications; conduct orals; and award by tower, multi-tower, or single-prime at its sole discretion.

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - RFP timeline: issue date, Q&A close date, response due date, orals window, award date, transition start date?
> - Named Sourcing Lead (contact + email/phone) and submission portal URL/credentials process?
>
> *These answers populate the binding milestone table and the single channel of record; without firm dates the procurement calendar and protest window cannot be fixed.*

**(draft pending intake) — Procurement Timeline**

| Milestone | Date |
|---|---|
| RFP Issue | _TBD_ |
| Q&A Close | _TBD_ |
| Response Due | _TBD_ |
| Orals / Demos | _TBD_ |
| Award Notification | _TBD_ |
| Transition Start | _TBD_ |

---

## 2. Executive Overview & Objectives
*So-what: SkyHarbor manages a 660-application estate with $40.6M of SLA credit-at-risk against an underperforming incumbent base — the AMS event is a margin and resilience play, not a routine renewal.*

**2.1 Context (governed).** SkyHarbor operates a 660-application portfolio with an annual run cost of $2,764.3M, spanning 12 service towers (Storage, Data & Analytics, Telecom, Compute, Application Mgmt, Mainframe, Network, Integration, End User Compute, Cloud, Service Desk, Security). Application criticality skews to mission-critical: 236 Tier-1 and 249 Tier-2 applications (115 Tier-3; 60 undefined).

**2.2 Vendor concentration (governed).** Total third-party IT vendor spend is $1,910.9M across 122 vendors, with $765.8M anchored to AMS. The largest exposures and their renewal cliffs:

| Vendor | Annual | Renewal | Scope |
|---|---|---|---|
| IBM Global Services | $280.0M | 2027-12-31 | AMS + mainframe managed services [1] |
| Amazon Web Services | $180.0M | 2027-12-31 | Cloud consumption + EDP |
| Accenture | $120.0M | 2027-03-31 | Application modernization + AMS [2] |
| TCS | $95.0M | 2027-12-31 | Offshore AMS + testing |
| Microsoft Azure | $70.0M | 2026-09-30 | Cloud + M365 |
| Oracle | $60.0M | 2027-12-31 | ERP + database |
| SAP | $55.0M | 2026-09-30 | S/4HANA + licenses |
| Sabre | $48.0M | 2027-03-31 | PSS platform |

**2.3 Performance signal (governed).** 72 SLAs carry $40.6M in credit-at-risk; current actuals trail target across critical metrics (e.g., Mainframe change success 89% vs 98% target; Data & Analytics availability 94.96% vs 99.9%). Incumbent strategic vendors (IBM, Accenture) carry 6-month exit terms and buyer-owned or vendor-hosted data rights [1][2].

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - What are the top 3 strategic objectives for this AMS event (e.g., cost-out %, SLA recovery, modernization, de-risking vendor concentration)?
> - What is the burning-platform driver and timing forcing this event now (renewal cliffs, board mandate, incident exposure)?
>
> *The objectives become the evaluation north-star (Section 12) and frame how aggressively transformation vs. steady-state is weighted.*

---

## 3. Scope of Services by Tower
*So-what: Award shape and tower boundaries dictate the entire commercial model — single-prime simplifies governance but concentrates risk against the same incumbents SkyHarbor is trying to de-risk.*

**3.1 Tower universe (governed).** The 12 towers in scope of consideration: Storage, Data & Analytics, Telecom, Compute, Application Mgmt, Mainframe, Network, Integration, End User Compute, Cloud, Service Desk, Security.

**3.2 Representative application mapping (governed).** Examples of the estate and current AMS assignment to be transitioned/managed:

| Application | Tier | Business Fn | System of Record | Current AMS | Time Class |
|---|---|---|---|---|---|
| MRO Ledger 16 | tier1 | MRO | Databricks | IBM Global Services | run [11] |
| Flight Ops Gateway 227 | tier1 | Flight Ops | Mainframe COBOL | Internal | run [14] |
| Crew Portal 357 | tier1 | Crew | Workday | Infosys | run [15] |
| Customer Manager 108 | tier1 | Customer | Databricks | TCS | grow [16] |
| Cargo Ledger 97 | tier2 | Cargo | SAP S/4HANA | IBM Global Services | run [13] |
| MRO Manager 62 | tier2 | MRO | SAP S/4HANA | Infosys | run [12] |
| Procurement Manager 152 | tier2 | Procurement | Salesforce | IBM Global Services | transform [18] |
| Finance Manager 212 | tier2 | Finance | Amadeus | Accenture | transform [19] |
| Catering Manager 141 | tier2 | Catering | Workday | TCS | grow [17] |

*Note: Flight Ops Gateway 227 is currently Internal/Mainframe COBOL [14] — likely a retained or specially-handled candidate pending intake.*

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - Per tower: what is in-scope, out-of-scope, and retained in-house?
> - Award intent: single-tower (best-of-breed), multi-tower bundles, or single-prime integrator?
>
> *Scope boundaries and award shape determine bid lot structure, SLA aggregation, and whether SI integration responsibilities are priced in.*

**(draft pending intake) — Per-Tower Scope Matrix**

| Tower | In-Scope | Out-of-Scope | Retained |
|---|---|---|---|
| Application Mgmt | _TBD_ | _TBD_ | _TBD_ |
| Mainframe | _TBD_ | _TBD_ | _TBD_ |
| Data & Analytics | _TBD_ | _TBD_ | _TBD_ |
| Integration | _TBD_ | _TBD_ | _TBD_ |
| (remaining 8 towers) | _TBD_ | _TBD_ | _TBD_ |

---

## 4. Current-State Context (Volumes, Cost, SLA)
*So-what: Bidders cannot size teams or commit to SLAs without ticket volumes; the governed data confirms scale and stress but lacks the granular demand baseline.*

**4.1 Cost & estate scale (governed).** Application run cost $2,764.3M across 660 apps. Criticality distribution: Tier-1 236, Tier-2 249, Tier-3 115, undefined 60.

**4.2 Availability/SLA stress by tower (governed).**

| Tower | Metric | Target | Actual | Breaches | Credit-at-Risk |
|---|---|---|---|---|---|
| Mainframe | Availability | 99.9% | 96.33% | 1 | $311,852 [6] |
| Compute | Availability | 99.9% | 92.97% | 6 | $158,158 [7] |
| Storage | Availability | 99.9% | 95.72% | 2 | $574,585 [8] |
| Network | Availability | 99.9% | 90.47% | 0 | $554,370 [9] |
| Security | Availability | 99.9% | 95.44% | 0 | $663,465 [10] |

**4.3 Incident signal (governed).** Sampled incidents show change as a recurring root cause across severities, including P1 events (e.g., INC-00065, INC-00075) [31][32], consistent with the Mainframe 89% change-success shortfall.

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - Trailing 12-month ticket/incident/change volumes by tower and by priority (L1/L2/L3 support tiers; P1–P4 severities)?
> - First-contact-resolution rate by tower (Application Mgmt FCR currently flagged 75% target)?
>
> *Volumes drive resource-unit baselines (Section 6) and the credibility of staffing/productivity commitments; without them bids are unpriceable.*

**(draft pending intake) — Volume Baseline**

| Tower | P1 | P2 | P3 | P4 | Changes | FCR % |
|---|---|---|---|---|---|---|
| _per tower_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

---

## 5. SLA / KPI Schedule & Credits
*So-what: The incumbent baseline already lost $40.6M to credit-at-risk; the new schedule must set recovery targets and a credit regime that bites without being gamed.*

**5.1 Baseline (governed).** 72 SLAs with $40.6M aggregate credit-at-risk. Notable shortfalls vs. target:

| Tower | Metric | Target | Actual | Credit |
|---|---|---|---|---|
| Storage | P2 resolution | 8h | 9.0h | $1.2M |
| Data & Analytics | P1 resolution | 4h | 4.6h | $1.2M |
| Telecom | Batch completion | 06:00 local | 89% | $1.2M |
| Compute | Batch completion | 06:00 local | 92% | $1.1M |
| Application Mgmt | First-contact resolution | 75% | 73.2% | $1.1M |
| Mainframe | Change success rate | 98% | 89% | $1.1M |
| Network | Batch completion | 06:00 local | 97% | $1.1M |
| Data & Analytics | Availability | 99.9% | 94.96% | $1.1M |
| Mainframe | Batch completion | 06:00 local | 96% | $1.1M |
| Integration | Batch completion | 06:00 local | 89% | $1.0M |

> ✍️ **CLIENT TO COMPLETE:**
> Define the binding SLA regime — these are SkyHarbor / Legal policy decisions Nexus must not invent:
> - Target SLA level per critical service (availability, P1/P2 resolution, batch completion, change success, FCR).
> - At-risk credit % of monthly charges per SLA.
> - Earn-back mechanism (if any) and chronic-breach / repeated-default policy (escalation, step-in, termination trigger).
>
> **Skeleton to complete:**

| Service / Metric | Target | Measurement Window | Credit-at-Risk % | Earn-Back | Chronic-Breach Trigger |
|---|---|---|---|---|---|
| Mainframe change success | ≥ ___% | monthly | ___% | Y/N | ___ breaches / ___ months |
| Data & Analytics availability | ≥ ___% | monthly | ___% | Y/N | ___ |
| P1 resolution | ≤ ___h | per incident | ___% | Y/N | ___ |
| Batch completion (06:00 local) | ≥ ___% | daily/monthly | ___% | Y/N | ___ |
| Application Mgmt FCR | ≥ ___% | monthly | ___% | Y/N | ___ |

---

## 6. Resource-Unit & Pricing Schedule
*So-what: A resource-unit (RU) model converts SkyHarbor's volume demand into unit prices, enabling apples-to-apples bid comparison and consumption-based scaling.*

_(Standard template — client to review.)_

**6.1 Pricing constructs required.** Bidders must price using:
- **Fixed/managed-service charge** per tower (steady-state run).
- **Resource Units (RUs)** — defined per tower (e.g., per managed application, per ticket band, per environment).
- **Time-&-materials rate card** by role/level and onshore/nearshore/offshore.
- **ARC/RRC mechanism** (additional/reduced resource charge) with banded thresholds.

**6.2 Workbook structure (template).**

| Element | Unit | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---|---|---|---|---|---|
| Tower managed-service fee | $/yr | | | | | |
| RU rate | $/RU | | | | | |
| Onshore blended rate | $/hr | | | | | |
| Offshore blended rate | $/hr | | | | | |
| ARC/RRC band | $/unit | | | | | |

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - Current staffing baseline: FTE by tower and onshore/offshore mix?
> - Resource-unit volumes per tower (managed apps, environments, tickets)?
> - Budget ceiling / not-to-exceed (optional)?
>
> *The baseline FTE and RU volumes anchor the should-cost model and let SkyHarbor normalize bids against the $765.8M AMS-anchored spend.*

---

## 7. Productivity & Automation Commitments
*So-what: With $2,764.3M run cost, even a single-digit productivity glide-path returns tens of millions annually — but the target and gainshare split are SkyHarbor's to set.*

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - Required productivity glide-path Year 1 / Year 2 / Year 3 (% reduction in RU cost or effort)?
> - Gainshare stance — does SkyHarbor want shared-savings on automation/AI beyond the committed glide-path, and at what split?
>
> *These shape whether bidders are scored on committed efficiency (year-on-year price decline) vs. upside-sharing innovation, and set the automation/AI clause expectations (note: current strategic contracts carry no AI clauses [1][2]).*

**(draft pending intake) — Productivity Commitment Table**

| Commitment | Y1 | Y2 | Y3 |
|---|---|---|---|
| Productivity reduction (%) | _TBD_ | _TBD_ | _TBD_ |
| Automation/ticket-deflection target | _TBD_ | _TBD_ | _TBD_ |
| Gainshare split (Client/Vendor) | _TBD_ | _TBD_ | _TBD_ |

---

## 8. Transition & Knowledge Transfer
*So-what: Transitioning Tier-1 applications (236) off incumbents with 6-month exit terms [1][2] demands tight blackout, parallel-run, and KT discipline to avoid an availability cliff.*

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - Transition constraints: operational blackout windows (e.g., peak travel periods, hub cutover freezes)?
> - Parallel-run requirement and duration by tower/criticality?
> - KT expectations (shadow/reverse-shadow durations, artifact handover, runbook standards)?
> - Incumbent-cooperation terms available (note: IBM & Accenture carry 6-month exit notice [1][2])?
> - Target go-live / steady-state date?
>
> *These determine the transition plan structure, at-risk transition milestones, and the parallel-run cost SkyHarbor absorbs vs. expects bundled.*

**(draft pending intake) — Transition Phases**

| Phase | Activities | Duration | Exit Criteria |
|---|---|---|---|
| Mobilization | _TBD_ | _TBD_ | _TBD_ |
| KT / Shadow | _TBD_ | _TBD_ | _TBD_ |
| Parallel Run | _TBD_ | _TBD_ | _TBD_ |
| Steady-State Cutover | _TBD_ | _TBD_ | _TBD_ |

---

## 9. Retained Organization & Governance
*So-what: SkyHarbor's leadership bench (7 C-Level, 9 SVP, 37 VP, 119 Director, 99 Sr Manager) must define a lean retained core that governs vendors without re-creating the work it outsources.*

**9.1 Leadership context (governed).** Current org leadership distribution: C-Level 7, SVP 9, VP 37, Director 119, Sr Manager 99, CEO 1. SVPs span DIGITAL, DATA, and IT-CHANGE cost centers across DC-East and GCC-Bangalore [25][26][27][28].

> 📋 **NEXUS INTAKE — required to finalize this section:**
> - Which functions are retained in-house (IT governance, enterprise architecture, vendor/SIAM management, security, demand management)?
> - Target retained headcount and structure?
>
> *Retained functions define the SkyHarbor↔vendor RACI and what the vendor is — and is not — accountable for.*

> ✍️ **CLIENT TO COMPLETE:**
> Define the governance operating model and cadence — a SkyHarbor decision Nexus will not assume:
> - Governance tiers (operational / service-management / strategic-executive) and forum membership.
> - Meeting cadence and decision rights per tier.
> - SIAM / multi-vendor integration ownership (especially if multi-tower award per Section 3).
>
> **Skeleton to complete:**

| Governance Tier | Forum | Cadence | SkyHarbor Chair | Vendor Attendee | Decision Rights |
|---|---|---|---|---|---|
| Operational | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| Service Management | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| Strategic / Executive | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

---

## 10. Security & Compliance
*So-what: As an airline managing Tier-1 operational and customer systems, SkyHarbor's security floor (frameworks, residency, vetting) is a gating qualifier, not a scored nicety.*

> ✍️ **CLIENT TO COMPLETE:**
> Specify mandatory security/compliance requirements — a SkyHarbor Security/Legal decision:
> - Required frameworks (e.g., SOC 2 Type II, ISO 27001, PCI-DSS for payment systems, and any airline/aviation-specific obligations such as TSA/FAA-related controls).
> - Data residency / sovereignty requirements (note: current strategic data rights vary — IBM buyer-owned vs. Accenture vendor-hosted [1][2]).
> - Personnel background-check standard and offshore access controls (GCC-Bangalore relevance [28]).
>
> **Skeleton to complete:**

| Requirement | Standard / Level | Mandatory? | Evidence Required |
|---|---|---|---|
| Certification framework | _TBD_ | _TBD_ | _TBD_ |
| Data residency | _TBD_ | _TBD_ | _TBD_ |
| Background checks | _TBD_ | _TBD_ | _TBD_ |
| Offshore access controls | _TBD_ | _TBD_ | _TBD_ |

_(Standard template — client to review.)_

**10.1 Baseline security obligations (template).** Supplier shall: maintain an ISMS aligned to the frameworks above; encrypt data in transit and at rest; segregate SkyHarbor data in multi-tenant environments; report security incidents within agreed timeframes; support SkyHarbor's right to audit and penetration testing; and ensure subcontractors meet equivalent controls. Data rights default to **buyer-owned** unless expressly varied, consistent with SkyHarbor's preferred posture [1].

---

## 11. Commercial Terms / Sample Agreement
*So-what: The sample agreement de-risks negotiation cycle time; but the teeth — LDs, audit, exit assistance, data protection — require SkyHarbor Legal sign-off, not template defaults.*

_(Standard template — client to review.)_

**11.1 Structure.** The Master Services Agreement comprises: General Terms; Schedules (Services, SLAs, Charges, Transition, Governance, Security, Exit); and Statements of Work per tower. Term: 5 years with SkyHarbor renewal options. Incumbent strategic contracts carry 6-month exit notice and should be matched or improved [1][2].

**11.2 Standard scaffolding (template).** Includes representations & warranties, IP ownership (deliverables and SkyHarbor data buyer-owned), confidentiality, insurance minimums, subcontracting consent, change control, and governing law.

> ✍️ **CLIENT TO COMPLETE:**
> The following require SkyHarbor Legal sign-off — Nexus will not draft binding terms:
> - Liquidated damages (caps, triggers, relationship to SLA credits).
> - Audit rights (frequency, scope,

## Appendix A — Nexus Intake Pack (open items)

### 1. Instructions to Bidders & Submission
- RFP timeline: issue date, Q&A close, response due, orals, award, transition start
- Sourcing lead contact + submission portal
### 2. Executive Overview & Objectives
- Top 3 strategic objectives for this AMS event and the burning-platform driver
### 3. Scope of Services by Tower
- Per tower: in-scope / out-of-scope / retained in-house
- Single-tower vs multi-tower vs single-prime award intent
### 4. Current-State Context (Volumes, Cost, SLA)
- 12-month ticket/incident/change volumes by tower and priority (L1/L2/L3; P1-P4)
- First-contact-resolution rate by tower
### 6. Resource-Unit & Pricing Schedule
- Staffing baseline (FTE by tower, onshore/offshore mix)
- Resource-unit volumes per tower
- Budget ceiling / not-to-exceed (optional)
### 7. Productivity & Automation Commitments
- Required productivity glide-path Y1-Y3 (%) and gainshare stance
### 8. Transition & Knowledge Transfer
- Transition constraints: blackout windows, parallel-run requirement, KT expectations, incumbent-cooperation terms, target go-live
### 9. Retained Organization & Governance
- Functions retained in-house (governance, architecture, vendor mgmt) + target retained headcount
### 14. Current-State Exhibits (Inventory, Software, Volumes)
- Transaction/utilization volume summaries per platform (if available)

## Appendix B — Client-to-Complete decisions

- **5. SLA / KPI Schedule & Credits** — Target SLA levels per critical service + at-risk credit % + earn-back and chronic-breach policy (client/legal decision)
- **9. Retained Organization & Governance** — Governance operating model & cadence (client decision)
- **10. Security & Compliance** — Required frameworks (SOC2/ISO/airline-specific), data residency, background-check standard (client/security decision)
- **11. Commercial Terms / Sample Agreement** — Liquidated damages, audit rights, exit/termination-assistance, data-protection terms — legal sign-off required
- **12. Response Instructions & Evaluation Criteria** — Final evaluation criteria weights, disqualifiers, and minimum qualifications (client decision)
- **13. Mandatory Forms & Exhibits** — Diversity/subcontracting policy (HUB/MBE/WBE) and required certifications

## Appendix C — Source Register

- [1] contract — vendor-contracts.csv
- [2] contract — vendor-contracts.csv
- [3] contract — vendor-contracts.csv
- [4] contract — vendor-contracts.csv
- [5] contract — vendor-contracts.csv
- [6] service_level — sla-register.csv
- [7] service_level — sla-register.csv
- [8] service_level — sla-register.csv
- [9] service_level — sla-register.csv
- [10] service_level — sla-register.csv
- [11] cmdb_application — application-portfolio.csv
- [12] cmdb_application — application-portfolio.csv
- [13] cmdb_application — application-portfolio.csv
- [14] cmdb_application — application-portfolio.csv
- [15] cmdb_application — application-portfolio.csv
- [16] cmdb_application — application-portfolio.csv
- [17] cmdb_application — application-portfolio.csv
- [18] cmdb_application — application-portfolio.csv
- [19] cmdb_application — application-portfolio.csv
- [20] configuration_item — infrastructure-estate.csv
- [21] configuration_item — infrastructure-estate.csv
- [22] configuration_item — infrastructure-estate.csv
- [23] configuration_item — infrastructure-estate.csv
- [24] configuration_item — infrastructure-estate.csv
- [25] org_role — org-roles.csv
- [26] org_role — org-roles.csv
- [27] org_role — org-roles.csv
- [28] org_role — org-roles.csv
- [29] incidents_ops_telemetry — incidents.csv
- [30] incidents_ops_telemetry — incidents.csv
- [31] incidents_ops_telemetry — incidents.csv
- [32] incidents_ops_telemetry — incidents.csv
- [33] incidents_ops_telemetry — incidents.csv