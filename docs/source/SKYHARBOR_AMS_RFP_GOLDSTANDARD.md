<!-- SkyHarbor AMS RFP — gold-standard draft. Governed evidence only; exhibits from real computed facts; [n] cite the source register appendix. Synthetic tenant. -->

# SkyHarbor Air — Request for Proposal
## Application Management Services (AMS) & Adjacent Infrastructure Towers
### Issued by SkyHarbor Air Global Sourcing | FY26

---

## 1. Instructions to Bidders

**So-what:** SkyHarbor is consolidating a fragmented 122-vendor AMS landscape ($1,910.9M contracted; $545.6M AMS-anchor scope) into a tower-aligned operating model. Bidders must respond by tower with binding pricing, SLAs, and productivity commitments — partial responses will be disqualified.

**Submission rules:**
1. **Eligibility:** Bidders must demonstrate ≥5 active AMS engagements at airline, travel, or transport clients of comparable scale ($50B+ revenue). Incumbents [1][2] are eligible to rebid but must disclose all existing SkyHarbor contracts.
2. **Lots:** Bidders may bid on one, several, or all 12 towers (Storage, Data & Analytics, Telecom, Compute, Application Mgmt, Mainframe, Network, Integration, End User Compute, Cloud, Service Desk, Security). SkyHarbor reserves the right to award by tower or in bundles.
3. **Format:** Responses in the supplied template (Appendix C pricing workbook + narrative). Any deviation flagged in a separate "Exceptions" log.
4. **Timeline:** RFP issued Day 0; clarification window closes Day 14; bidder conference Day 21; responses due Day 45; shortlist Day 60; orals Day 75; award Day 100.
5. **Confidentiality:** NDA executed prior to data-room access. No subcontracting of response drafting to third parties.
6. **Communication:** All Q&A via the e-sourcing portal; direct contact with SkyHarbor staff outside designated channels = disqualification.
7. **Validity:** Pricing valid 180 days from submission.

---

## 2. Executive Overview & Objectives

**So-what:** SkyHarbor runs a 660-application estate at **$2,764.3M annual run cost** across 122 vendors, with **$40.6M in SLA credits at risk** across 72 measured SLAs and availability persistently below the 99.9% target in every infrastructure tower [7][8][9][10][11][12]. The current operating model is not delivering reliability commensurate with spend. This RFP procures a tower-structured AMS partner ecosystem to (a) restore SLA performance, (b) compress run cost via productivity, and (c) free capital for the modernization roadmap.

**Strategic objectives:**
1. **Reliability:** Lift availability to ≥99.9% in every infrastructure tower; eliminate the 6 monthly availability breaches in Compute [8] and 6 in Telecom [12].
2. **Cost-out:** Deliver year-on-year productivity (Section 7) against the $545.6M AMS-anchor baseline.
3. **Consolidation:** Reduce active AMS vendors from 122 toward a target tower-aligned panel (final count subject to award).
4. **Modernization enablement:** Free FTE capacity from run-the-business toward the transform portfolio (e.g., S/4HANA-anchored apps such as APP-0062 [16], modernization candidates such as APP-0212 [20]).
5. **Risk reduction:** Replace 12 aging x86 assets in DC-East/DC-West [24][25][26] under managed-services accountability rather than time-and-materials remediation.

**Renewal leverage:** Three anchor contracts expire inside the contemplated contract start window — Accenture (2027-03-31, $120.0M) [2], TCS (2027-12-31, $95.0M), and IBM Global Services (2027-12-31, $280.0M) [1] — giving SkyHarbor commercial leverage to re-shape towers without exit-fee penalty (6mo notice [1][2]).

---

## 3. Scope of Services by Tower

**So-what:** Scope is defined by 12 towers. Bidders must propose an end-to-end service for each tower bid, covering L1–L3 support, incident/problem/change, release, capacity, and continuous improvement. Application Mgmt and Service Desk are the highest-volume towers; Mainframe and Integration carry the highest change-risk.

| Tower | In-scope services | Reference baseline |
|---|---|---|
| **Storage** | Block/object/file storage ops, capacity, backup, DR | SLA-0013 availability 95.72% vs 99.9% [9] |
| **Data & Analytics** | Databricks-anchored platforms (e.g., APP-0108 [17]), pipelines, BI ops | 5 P1-resolution breaches, $1.2M credit-at-risk |
| **Telecom** | Voice, contact-center telephony, WAN voice | SLA-0061 availability 91.63% [12] |
| **Compute** | x86 estate ([22]–[27]), virtualization, OS patching | SLA-0007 availability 92.97% [8] |
| **Application Mgmt** | L2/L3 app support across 660 apps (tier1 236, tier2 249, tier3 115, untagged 60) | FCR 73.2% vs 75% target |
| **Mainframe** | Mainframe ops + managed services (currently IBM [1]); batch, change, availability | SLA-0001 availability 96.33% [7]; change success 89% vs 98% |
| **Network** | LAN/WAN/SD-WAN, DNS, load-balancers | SLA-0019 availability 90.47% [10] |
| **Integration** | ESB, API gateway, B2B EDI (PSS/Sabre integration [21]) | Availability 99.43%, batch 89% |
| **End User Compute** | Endpoint, MDM, collaboration ops | Scope per Appendix A |
| **Cloud** | AWS + Azure managed services (FinOps, landing zones) | AWS $180M, Azure $70M baselines |
| **Service Desk** | 24×7 multilingual L1, ITSM tooling ops | FCR + first-response SLAs |
| **Security** | SecOps L1/L2, IAM ops, vulnerability mgmt | SLA-0037 availability 95.44% [11] |

Bidders must explicitly identify any in-scope item proposed for exclusion.

---

## 4. Current-State Context (Volumes, Cost, SLA)

**So-what:** SkyHarbor's baseline is a $2,764.3M run estate with concentrated SLA failures in infrastructure availability and batch completion. Five anchor vendors hold ~$725M of the $1,910.9M contracted spend; productivity and consolidation upside is therefore concentrated.

**Estate:**
- **Applications:** 660 total — tier1 236, tier2 249, tier3 115, untagged 60. Total annual run cost **$2,764.3M**.
- **FY26 Application-Mgmt budget lines:** $465.9M (software/license + run). **EVIDENCE MISSING:** AMS labor line is not separately tagged in the FY26 budget; bidders to assume Appendix C resource-unit volumes as authoritative.
- **Infrastructure sample:** Dell PowerEdge R760 fleet split across DC-East (primary), DC-West (DR), and Colo-Hub-A; mix of `current` and `aging` lifecycle [22]–[27].
- **Application examples in scope:** APP-0062 MRO Manager (Infosys) [16], APP-0108 Customer Manager (TCS) [17], APP-0141 Catering Manager (TCS) [18], APP-0212 Finance Manager (Accenture) [20], APP-0257 Crew Manager (IBM) [21].

**Top-10 incumbent baseline:**

| Vendor | Annual | Renewal | Scope |
|---|---|---|---|
| IBM Global Services | $280.0M | 2027-12-31 | AMS + mainframe managed services [1] |
| Amazon Web Services | $180.0M | 2027-12-31 | Cloud consumption + EDP |
| Accenture | $120.0M | 2027-03-31 | Application modernization + AMS [2] |
| TCS | $95.0M | 2027-12-31 | Offshore AMS + testing |
| Microsoft Azure | $70.0M | 2026-09-30 | Cloud + M365 |
| Oracle | $60.0M | 2027-12-31 | ERP + database [13] |
| SAP | $55.0M | 2026-09-30 | S/4HANA + licenses |
| Sabre | $48.0M | 2027-03-31 | PSS platform |
| Salesforce | $22.0M | 2027-03-31 | CRM + loyalty |
| Workday | $18.0M | 2026-12-31 | HCM + finance |

**Change-induced incident pattern:** A material share of recent P1/P3/P4 incidents trace to `root_cause: change` [33][34][35][36][37][38], including P1 events on APP-0422, APP-0260, and APP-0041 — driving the mainframe change-success-rate gap (89% vs 98%).

**EVIDENCE MISSING:** Annual ticket volume by tower/priority and FCR ticket counts are not provided in the data room; bidders to request via clarification.

---

## 5. Service-Level (SLA/KPI) Schedule & Credits

**So-what:** The current 72-SLA regime is generating **$40.6M in credits at risk** but is clearly not changing behavior — infrastructure availability misses target every month in 5 of 6 measured towers. The new regime tightens definitions, introduces earn-back only after two consecutive green months, and concentrates credits on the metrics that hurt the airline operation (batch completion, P1 resolution, availability).

**Top breach economics (incumbent baseline):**

| Tower | Metric | Target | Actual | Breaches | Credit-at-risk |
|---|---|---|---|---|---|
| Storage | P2 resolution | 8h | 9.0h | 2 | $1.2M |
| Data & Analytics | P1 resolution | 4h | 4.6h | 5 | $1.2M |
| Telecom | Batch completion | 06:00 local | 89% | 2 | $1.2M |
| Compute | Batch completion | 06:00 local | 92% | 6 | $1.1M |
| Application Mgmt | First-contact resolution | 75% | 73.2% | 4 | $1.1M |
| Mainframe | Change success rate | 98% | 89% | 5 | $1.1M |
| Network | Batch completion | 06:00 local | 97% | 2 | $1.1M |
| Data & Analytics | Availability | 99.9% | 94.96% | 6 | $1.1M |
| Mainframe | Batch completion | 06:00 local | 96% | 3 | $1.1M |
| Integration | Batch completion | 06:00 local | 89% | 6 | $1.0M |
| Integration | Availability | 99.9% | 99.43% | 1 | $1.0M |
| Integration | First-contact resolution | 75% | 91.6% | 0 | $1.0M |

**Credit framework (bidders to confirm acceptance):**
- **At-risk pool:** 15% of monthly tower charge.
- **Critical SLAs (super-credit, 2×):** P1 resolution; Batch completion by 06:00 local; Mainframe availability [7]; Mainframe change success.
- **Earn-back:** Permitted only after two consecutive months at or above target; capped at 50% of credit forfeited.
- **Chronic breach:** Three consecutive misses on a critical SLA = step-in / termination-for-cause trigger.
- **Measurement:** Monthly; tooling provided by SkyHarbor ITSM; bidder may not self-report.

**EVIDENCE MISSING:** Full 72-SLA register with current credit weights — to be supplied in Appendix B at issue.

---

## 6. Resource-Unit & Pricing Schedule

**So-what:** Pricing is resource-unit (RU) based per tower to drive transparency and enable volume flex. Bidders must price every RU; T&M will not be accepted for steady-state.

**RU model by tower (bidders complete Appendix C):**

| Tower | Primary RU | Secondary RU |
|---|---|---|
| Application Mgmt | Per supported app per tier (tier1/2/3) | Per enhancement point |
| Service Desk | Per contact (voice/chat/email) | Per seat-supported |
| Compute | Per OS instance per month | Per vCPU |
| Storage | Per TB managed | Per backup job |
| Network | Per managed port | Per site |
| Telecom | Per voice seat | Per SBC channel |
| Mainframe | Per MIPS managed | Per batch job stream |
| Integration | Per interface managed | Per million transactions |
| Data & Analytics | Per pipeline managed | Per Databricks workspace |
| Cloud | Per managed account | % of cloud consumption (capped) |
| End User Compute | Per endpoint | Per VIP seat |
| Security | Per monitored asset | Per IAM identity |

**Commercial constructs:**
- **ARC/RRC bands:** ±15% dead-band; symmetric unit rates outside band.
- **Onshore/offshore mix:** Bidders propose target mix per tower; SkyHarbor pre-approval required for any onshore <20% in customer-facing towers.
- **Rate card:** Discrete rate card by role/level/geo for project work (non-RU).
- **FX & inflation:** Fixed USD for 36 months; CPI-linked thereafter, capped at 3%.

**EVIDENCE MISSING:** Current RU volumes (apps-per-tier, MIPS, TB, endpoints) — bidders to receive at clarification stage.

---

## 7. Productivity & Automation Commitments

**So-what:** Against a $545.6M AMS-anchor baseline, SkyHarbor expects compounding productivity. Bidders must commit hard percentages, not "best efforts."

**Mandatory commitments:**
1. **Annual productivity:** Minimum 4% / 5% / 6% gross reduction in tower charges in years 2 / 3 / 4, applied to in-scope baseline.
2. **Automation runbook coverage:** ≥60% of P3/P4 incidents auto-remediated by end of year 2; bidder funds the automation build.
3. **Shift-left:** Lift Service Desk FCR from baseline 73.2% to ≥80% by month 18; closing the Application Mgmt FCR gap is a critical SLA (Section 5).
4. **Change-failure reduction:** Halve change-induced incidents (current pattern visible in [33]–[38]); raise mainframe change-success from 89% to ≥98% within 12 months.
5. **AI/GenAI:** Bidders disclose proposed GenAI use in support workflows, with `no-train-on-our-data` clause mandatory (precedent set in [6][15]).
6. **Gain-share:** Optional gain-share on cloud FinOps savings (AWS $180M, Azure $70M baselines) — 70/30 in SkyHarbor's favor.

Bidders must provide a year-by-year savings curve in Appendix C, tower by tower.

---

## 8. Transition & Knowledge Transfer

**So-what:** Transition risk is concentrated where incumbent contracts expire first (Accenture 2027-03-31 [2], SAP 2026-09-30, Azure 2026-09-30) and where mainframe-IBM holds deep tacit knowledge [1]. Bidders must propose a tower-sequenced transition that protects the airline operation.

**Transition framework:**
- **Duration:** Max 6 months per tower; parallel-run mandatory for tier1 apps (236 apps).
- **Phases:** (1) Due diligence (4 wks), (2) Shadow (8 wks), (3) Primary with safety net (8 wks), (4) Steady state.
- **At-risk transition fee:** 30% of transition charges held against KT exit criteria.
- **KT artifacts:** Runbooks, architecture-as-code, ticket-trend baselines, named-SME interview log.
- **Reverse-transition rights:** Bidder commits to 12-month reverse-transition support at pre-agreed rates.
- **Resource lift-and-shift:** SkyHarbor reserves right to TUPE/rebadge designated retained staff; bidders confirm geographies supported.

**Sequencing principle:** Service Desk + End User Compute first (lowest airline-operational risk); Mainframe last (highest tacit-knowledge risk, IBM incumbency [1]).

---

## 9. Retained Organization & Governance

**So-what:** SkyHarbor will retain architecture, demand, vendor management, and SRE leadership. Current senior bench includes 9 SVPs, 37 VPs, 99 Sr Managers, 119 Directors — concentrated in DATA, DIGITAL, and IT-CHANGE cost centers [28]–[32]. The retained org will compress as towers stabilize.

**Governance cadence:**
| Forum | Frequency | SkyHarbor chair | Bidder lead |
|---|---|---|---|
| Executive Steering | Quarterly | CIO | Bidder Account Exec |
| Service Mgmt Review | Monthly | VP IT Service Management [7]–[12] | Tower Service Owner |
| Change Advisory | Weekly | Director Change | Bidder Change Lead |
| Architecture Council | Bi-weekly | VP Architecture | Bidder Solution Lead |
| Innovation Council | Quarterly | SVP Digital [29] | Bidder Innovation Lead |

**Retained role examples:** SVP Data ([28][30][31]), SVP Digital ([29]), SVP IT-Change ([32]). Application-owner Directors (e.g., Director MRO [16], Director Crew [21], Director Finance [20]) remain accountable for business outcomes; bidder accountable for service delivery.

---

## 10. Security & Compliance

**So-what:** SkyHarbor operates under PCI-DSS (payments), GDPR (EU passenger data), and aviation-cyber regimes (TSA SD 1580/82, EASA Part-IS). Bidders inherit these obligations and must close the existing data-rights inconsistency where 4 of the top-10 strategic vendors are vendor-hosted [2][13] vs buyer-owned at IBM [1].

**Mandatory clauses:**
1. **Data rights:** SkyHarbor-owned for all operational, customer, and crew data — no exceptions. Current gap: Accenture [2], Oracle [13], Helios [3], Summit Software [4] are all `vendor-hosted`.
2. **AI/training:** `no-train-on-our-data` mandatory in every agreement (precedent: VEN-0086 [6], VEN-0103 [15]); current absence at IBM/Accenture/Oracle [1][2][13] must be remediated.
3. **Right-to-audit:** Annual + for-cause; SOC 2 Type II + ISO 27001 evidence required.
4. **Sub-processor disclosure:** 30-day prior notice; SkyHarbor veto right.
5. **Incident notification:** ≤24h for confirmed security incidents; ≤4h for category 1.
6. **Exit:** ≤6-month notice exit (current IBM/Accenture baseline [1][2]); data egress in open formats; certified destruction.
7. **Personnel:** Background checks per role tier; airport-badged staff per SkyHarbor security policy.

---

## 11. Commercial Terms

**So-what:** The contract structure mirrors the renewal timing of incumbent anchors so SkyHarbor preserves leverage at each natural break point.

| Term | Position |
|---|---|
| Term length | 5 years + 2×1-year extensions at SkyHarbor option |
| Termination for convenience | Any time after month 12; 6-month notice; sliding wind-down fee |
| Termination for cause | Chronic SLA breach (Section 5) or material security incident |
| Benchmarking | Mid-term (month 30) by independent third party; ±10% true-up |
| Most-favored-customer | Required for like-for-like airline / travel scope |
| Liability cap | 2× ann

## Appendix — Source Register (governed evidence)

- [1] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0)
- [2] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0)
- [3] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0)
- [4] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0048:c0)
- [5] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0065:c0)
- [6] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0086:c0)
- [7] service_level — sla-register.csv (chunk ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0)
- [8] service_level — sla-register.csv (chunk ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0)
- [9] service_level — sla-register.csv (chunk ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0)
- [10] service_level — sla-register.csv (chunk ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0)
- [11] service_level — sla-register.csv (chunk ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0037:c0)
- [12] service_level — sla-register.csv (chunk ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0061:c0)
- [13] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0006:c0)
- [14] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0018:c0)
- [15] contract — vendor-contracts.csv (chunk ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0103:c0)
- [16] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0062:c0)
- [17] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0108:c0)
- [18] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0141:c0)
- [19] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0152:c0)
- [20] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0212:c0)
- [21] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0257:c0)
- [22] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-x86-0103:c0)
- [23] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-x86-0122:c0)
- [24] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-x86-0193:c0)
- [25] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-x86-0197:c0)
- [26] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-x86-0209:c0)
- [27] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-x86-0221:c0)
- [28] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0009:c0)
- [29] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0011:c0)
- [30] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0013:c0)
- [31] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0014:c0)
- [32] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0015:c0)
- [33] incidents_ops_telemetry — incidents.csv (chunk ctx:skyharbor-air:it_landscape:incidents-csv-inc-00007:c0)
- [34] incidents_ops_telemetry — incidents.csv (chunk ctx:skyharbor-air:it_landscape:incidents-csv-inc-00038:c0)
- [35] incidents_ops_telemetry — incidents.csv (chunk ctx:skyharbor-air:it_landscape:incidents-csv-inc-00065:c0)
- [36] incidents_ops_telemetry — incidents.csv (chunk ctx:skyharbor-air:it_landscape:incidents-csv-inc-00075:c0)
- [37] incidents_ops_telemetry — incidents.csv (chunk ctx:skyharbor-air:it_landscape:incidents-csv-inc-00154:c0)
- [38] incidents_ops_telemetry — incidents.csv (chunk ctx:skyharbor-air:it_landscape:incidents-csv-inc-00202:c0)