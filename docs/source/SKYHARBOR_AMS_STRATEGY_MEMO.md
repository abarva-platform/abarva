# SkyHarbor Air — AMS Sourcing Strategy Memo

## 1. Executive thesis

SkyHarbor's $765.8M AMS-anchor estate is concentrated in two incumbents (IBM $280M, Accenture $120M) whose contracts co-terminate in 2027, creating a once-in-a-cycle leverage window to restructure the operating model rather than re-paper the status quo [1][2]. Availability SLAs are failing across every infrastructure tower (Telecom 91.6%, Network 90.5%, Compute 93.0%, Security 95.4%, Storage 95.7%, Mainframe 96.3% vs. 99.9% target) with only $40.6M credit-at-risk against $1,910.9M of spend — a governance failure, not a pricing problem [7][8][9][10][11][12]. We recommend a **competed tower-based recompete for AMS + selective infrastructure**, anchored on a March 2027 Accenture event and a December 2027 IBM event, targeting an assumed 8–15% run-rate reduction on AMS-anchor scope while inserting AI/gen-AI productivity clauses absent from every current contract [1][2].

## 2. Situation

- **Spend base:** $1,910.9M contracted across 122 vendors; AMS-anchor scope is $765.8M (40%), making AMS the single largest addressable lever [1][2].
- **Concentration:** Top 8 vendors represent $908M/yr; IBM ($280M) and Accenture ($120M) alone are $400M and both co-terminate within nine months in 2027 [1][2].
- **AMS cost stack (FY26 budget):** Internal labor $83.0M, MSP/vendor $95.5M, software/license $57.0M, depreciation $64.0M, hardware $39.3M, telecom $37.9M — total ~$376.7M of in-year AMS run [19][20][21][22][23][24].
- **Estate scale:** 660 applications, $2,764.3M annual run cost; tier-1 apps span mainframe COBOL (Flight Ops, Customer Ledger), SAP S/4HANA (Cargo, MRO) and Workday (Crew), with AMS split across IBM, Infosys, and internal teams [16][17][18][15].
- **Mainframe footprint** remains material: multiple IBM z16 LPARs across DC-East, DC-West and Colo-Hub-A, most flagged "aging" — locks in IBM leverage on the mainframe tower [25][26][27][28][29][30].

## 3. Complication

- **SLA regime is not protecting the business.** All six infrastructure towers measured are below the 99.9% availability target, yet aggregate credit-at-risk is only $40.6M (~2.1% of spend). Telecom credits-at-risk are $0.77M against 91.6% actual; Network reports 90.5% with **zero breach count recorded** — the measurement framework itself is broken [7][8][9][10][11][12].
- **No AI/gen-AI clauses** exist in IBM, Accenture, or other strategic contracts; data rights on Accenture and several AMS specialists are "vendor-hosted," limiting SkyHarbor's ability to redirect productivity gains [1][2][3][4].
- **Exit terms are weak** (6-month notice standard across strategic deals), reducing credible threat-of-switch unless transition planning starts 12+ months pre-renewal [1][2].
- **Org span:** 119 Directors and 99 Sr Managers across towers indicates fragmented demand-side ownership; only 9 SVPs and 7 C-level — vendor management lacks a single accountable executive layer [31][32][33][34].

## 4. Value at stake

Sizing is anchored on the $765.8M AMS scope plus adjacent infrastructure towers; **all percentages below are assumptions to validate in due diligence, not market benchmarks.**

| Lever | Scope base | Assumption (to validate) | Annual value |
|---|---|---|---|
| AMS recompete (IBM AMS + Accenture + TCS) | ~$495M | Assume 8–15% net run-rate reduction post-recompete | **$40–74M** |
| Infrastructure SLA enforcement & credit-regime reset | $40.6M credit-at-risk | Assume 40–70% currently un-claimed due to measurement gaps | **$16–28M** |
| Gen-AI productivity clauses (ticket deflection, code gen) on AMS labor | $178.5M AMS labor + MSP [19][20] | Assume 5–10% productivity share-back to buyer | **$9–18M** |
| Mainframe rationalization (aging LPARs) | IBM mainframe portion of $280M | Assume 10–20% via capacity right-sizing on aging z16 estate [25][27][28][29][30] | **$10–25M** |
| **Total annual value at stake** | | | **$75–145M/yr** |

This equates to **~4–8% of total $1,910.9M contracted spend** — material but disciplined. Floor case ($75M) covers transformation costs within 12 months; ceiling ($145M) requires operating-model change, not just price.

## 5. Strategic options

### By tower — retain vs. outsource vs. recompete

| Tower | Current posture | Recommended move |
|---|---|---|
| **Mainframe** | IBM-anchored, aging z16 LPARs, 96.3% availability [7][25] | **Retain + recompete capacity**; modernization business case for tier-1 COBOL apps (Flight Ops, Customer Ledger) [16][18] |
| **Application Mgmt** | Split IBM / Accenture / TCS / Infosys / Internal | **Recompete as 2–3 tower-pods** (SAP, mainframe-adjacent, cloud-native) |
| **Cloud** | AWS $180M EDP, Azure $70M [contracts] | **Renegotiate EDP** ahead of 2027-12-31; dual-cloud leverage |
| **Network / Telecom** | 90.5% / 91.6% availability — worst performers [10][12] | **Outsource with hard SLAs + earn-back**; consider managed-network single-tower deal |
| **Security** | 95.4% availability, $0.66M credit-at-risk [11] | **Retain leadership, outsource SOC tier-1/2**; insource control plane |
| **Service Desk / EUC** | Commodity | **Outsource, single global tower, AI-first deflection** |
| **Data & Analytics** | Databricks-anchored (MRO Ledger) [13] | **Retain product ownership**, competed specialist AMS |
| **Storage / Compute** | 95.7% / 93.0% availability [8][9] | **Bundle into infra recompete** with cloud exit ramps |
| **Integration** | Fragmented | **Consolidate** under one strategic SI |

### Compete vs. renegotiate — major incumbents

| Vendor | Annual | Renewal | Posture | Rationale |
|---|---|---|---|---|
| **IBM Global Services** | $280M | 2027-12-31 [1] | **Compete (AMS) + renegotiate (mainframe)** | AMS scope contestable; mainframe lock-in real but aging-asset leverage available [25][27][28][29][30] |
| **Accenture** | $120M | 2027-03-31 [2] | **Compete — first event** | Vendor-hosted data rights problematic; modernization scope attractive to challengers |
| **AWS** | $180M | 2027-12-31 | **Renegotiate EDP** | Consumption model; threat-of-switch limited but commitment terms reshapable |
| **TCS** | $95M | 2027-12-31 | **Renegotiate + expand** | Offshore unit economics; candidate for AMS pod consolidation |
| **Microsoft Azure** | $70M | 2026-09-30 | **Renegotiate early** — pacing event | Use as 2026 pilot for new SLA/AI clause template |
| **Oracle / SAP** | $115M | 2026–27 | **Renegotiate licenses**; couple to S/4 roadmap | |
| **Sabre** | $48M | 2027-03-31 | **Retain, harden SLAs** | Mission-critical PSS; switching cost prohibitive |

## 6. Recommended path & buying motion

**Path: Competed tower-pod recompete, Accenture-first (Mar-2027), IBM-second (Dec-2027), with a 2026 Azure/SAP pacing event to prove the new contract template.**

Buying motion:
1. **Pod-based RFP** — bundle ~$495M AMS into 2–3 outcome-priced pods (SAP/ERP, mainframe-adjacent, cloud-native + integration); avoid single-tower commodity bidding.
2. **New contract template** mandatory across all 2026+ renewals: 99.9% availability with **meaningful credit-at-risk floors (assume 8–12% of annual fees, to validate)**, gen-AI productivity share-back, buyer-owned data, 90-day exit with reverse-transition obligations.
3. **Threat-of-switch credibility** — qualify 2 challengers per pod (Indian majors, hyperscaler PS arms, mid-tier specialists); run parallel reverse-auction on commodity towers.
4. **Mainframe carve-out** — separate IBM mainframe managed service from IBM AMS; price each on standalone economics.

## 7. Approach & sequencing

**Q1–Q2 2026 — Foundation**
- Stand up VMO under a single SVP owner (currently no dedicated role across 9 SVPs) [31][32][33][34].
- Rebuild SLA measurement: fix Network zero-breach-count anomaly [10]; recompute credit-at-risk on true availability.
- Finalize new contract template; pilot on Azure (Sep-2026) and SAP (Sep-2026) renewals.

**Q3 2026 — Market engagement**
- Issue Accenture-replacement RFP (Mar-2027 event); 6-month runway.
- Begin IBM mainframe assessment and z16 capacity rationalization business case [25][27][28][29][30].

**Q4 2026 – Q1 2027 — Accenture event**
- Award Mar-2027; transition under 6-month notice clause [2].

**Q2–Q3 2027 — IBM event prep**
- Issue IBM AMS + mainframe RFP separately.
- Lock challenger commitments; finalize transition runbook.

**Q4 2027 — IBM event**
- Award Dec-2027; co-terminus AWS EDP renegotiation [1].

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Transition risk on tier-1 apps** (Flight Ops mainframe, Customer Ledger, Crew Portal) [16][17][18] | Phased cutover; reverse-transition obligations; retain incumbent for 6-month parallel run |
| **IBM mainframe lock-in** — aging z16 estate [25][27][28][29][30] | Decouple mainframe-ops from AMS; price separately; preserve modernization optionality |
| **6-month notice insufficient** to mobilize challenger [1][2] | Start RFP 12+ months pre-renewal; pre-negotiate transition services |
| **SLA measurement integrity** (Network 0 breaches at 90.5% actual) [10] | Independent SLA audit before RFP; build measurement clauses into new template |
| **Savings assumptions don't hold** | Stage-gate value: validate 8–15% AMS assumption via market RFI before committing to recompete depth |
| **Org bandwidth** — 119 Directors, fragmented ownership [31][32][33][34] | Named SVP accountable owner per pod; backfill VMO with 8–10 FTE |

## 9. Next steps (next 60 days)

1. **CIO + CFO endorse** the $75–145M value-at-stake range and the Accenture-first sequencing.
2. **Appoint SVP-level Vendor Management lead** with C-suite reporting line.
3. **Commission independent SLA audit** across all 12 towers — close the Network/Telecom measurement gap before any vendor conversation [10][12].
4. **Draft new contract template** (SLA, gen-AI, data rights, exit) and socialize with Legal/Procurement.
5. **Issue market RFI** for Accenture-replacement pods to test the 8–15% AMS assumption.
6. **Mainframe modernization business case** — quantify z16 aging-asset capacity savings [25][27][28][29][30] and inform IBM negotiation posture.

---
*Sources: [1] IBM contract; [2] Accenture contract; [3]–[6] specialist AMS contracts; [7]–[12] SLA register; [13]–[18] application portfolio; [19]–[24] FY26 IT financials; [25]–[30] mainframe estate; [31]–[36] org roles.*

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
- [13] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0016:c0)
- [14] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0062:c0)
- [15] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0097:c0)
- [16] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0227:c0)
- [17] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0357:c0)
- [18] cmdb_application — application-portfolio.csv (chunk ctx:skyharbor-air:it_landscape:application-portfolio-csv-app-0458:c0)
- [19] kpi_metric — it-financials.csv (chunk ctx:skyharbor-air:it_financials:it-financials-csv-fin-0113:c0)
- [20] kpi_metric — it-financials.csv (chunk ctx:skyharbor-air:it_financials:it-financials-csv-fin-0114:c0)
- [21] kpi_metric — it-financials.csv (chunk ctx:skyharbor-air:it_financials:it-financials-csv-fin-0115:c0)
- [22] kpi_metric — it-financials.csv (chunk ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0)
- [23] kpi_metric — it-financials.csv (chunk ctx:skyharbor-air:it_financials:it-financials-csv-fin-0118:c0)
- [24] kpi_metric — it-financials.csv (chunk ctx:skyharbor-air:it_financials:it-financials-csv-fin-0119:c0)
- [25] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-ibm-0007:c0)
- [26] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-ibm-0016:c0)
- [27] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-ibm-0020:c0)
- [28] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-ibm-0034:c0)
- [29] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-ibm-0035:c0)
- [30] configuration_item — infrastructure-estate.csv (chunk ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-ibm-0041:c0)
- [31] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0009:c0)
- [32] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0011:c0)
- [33] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0013:c0)
- [34] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0015:c0)
- [35] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0023:c0)
- [36] org_role — org-roles.csv (chunk ctx:skyharbor-air:org_structure:org-roles-csv-org-0053:c0)