## Recommendation: Re-compete the AMS-Anchor Tower at IBM/Accenture 2027 Renewal
- Launch a 2025–2026 AMS re-compete covering the $765.8M AMS-anchor scope, anchored on IBM ($280M) and Accenture ($120M) which together carry 52% of that scope and co-terminate in 2027 [1][2]
- Target a multi-vendor outcome (tower prime + challenger + GCC) rather than single-prime renewal; preserve mainframe continuity given aging IBM z16 estate [25][27][28][29][30]
- Bundle SLA regime reset: rebase 72 SLAs against the $40.6M credit-at-risk pool, with infra availability gaps spanning Telecom, Network, Security, Storage, Compute, Mainframe [7][8][9][10][11][12]
- Decision needed now: charter, budget for advisory, and exec sponsor — not vendor selection
- Ask: approve Phase 0 (sourcing readiness, 6 months, ~$3–5M) and a Board checkpoint at down-select

## Value Case (Risk-Adjusted)
- In-scope re-compete envelope: ~$400M/yr across IBM + Accenture; broader AMS-anchor reference $765.8M [1][2]
- **ASSUMPTION to validate, not a benchmark:** 8–15% unit-rate compression on re-competed AMS-anchor scope → **$32M–$60M/yr** run-rate on the $400M anchor; upside $60M–$115M/yr if full $765.8M scope is included
- Additional recoverable: SLA credit capture and rebaselining against $40.6M credit-at-risk pool — current breaches in 6 of 7 infra towers indicate material under-collection [7][8][9][10][11][12]
- AMS internal labor line ($83.0M) and AMS vendor/MSP line ($95.5M) are the bridge accounts where savings must land and be tracked [19][20]
- One-time transition cost (assume 0.5–1.0x annual savings) and 18–24mo realization must be modeled before committing a number to plan

## Options Considered
- **A. Renew incumbents flat (IBM, Accenture):** lowest disruption, forfeits 2027 leverage window; rejected — no price tension, AI/data-rights clauses absent in current papers [1][2]
- **B. Single-prime consolidation:** maximum simplicity, concentrates risk on one vendor across mainframe + modernization; rejected given Mainframe/Compute/Storage SLA misses already in IBM-adjacent towers [7][8][9]
- **C. Multi-tower re-compete with GCC lift (RECOMMENDED):** preserves competition, enables offshore/GCC arbitrage (TCS $95M reference point), aligns to 2027-03/2027-12 co-term [1][2]
- **D. Insource via retained org:** not viable at current org shape (119 Directors, 99 Sr Mgrs, 37 VPs) without a defined target operating model [org data]

## Risks & Contract Protections
- **Transition risk on mainframe:** aging IBM z16 LPARs in primary and DR — require knowledge-transfer escrow and parallel-run clauses [25][27][28][29][30]
- **AI / data rights gap:** IBM contract has no AI clauses, Accenture is vendor-hosted with no AI clauses — mandate no-train, buyer-owned outputs, model portability in re-compete [1][2]
- **Exit terms thin:** 6-month notice across strategic contracts — negotiate step-in, reverse-transition assistance (min 12mo), and source-code/runbook escrow [1][2]
- **SLA regime weak:** targets at 99.9% but actuals 90–96% with low/zero breach counts logged — fix measurement, earn-back, and service-credit caps in new MSA [7][8][10][12]
- **Concentration:** IBM+AWS+Accenture+TCS = $675M/yr; enforce portability and second-source for AMS towers

## Evidence Basis & Confidence
- **High confidence:** contract values, renewal dates, SLA targets/actuals, FY26 AMS budget lines — all from governed registers [1][2][7]–[12][19]–[24]
- **Medium confidence:** scope boundary of "AMS-anchor $765.8M" — derived from contract scope tags; needs line-item validation against app portfolio (660 apps) [13]–[18]
- **Low confidence / directional:** savings range — stated as assumption, not benchmark; depends on ticket volumes, FTE mix, and tower unit rates not yet in evidence
- Org data sufficient to identify sponsors (SVP/VP layer) but not to size retained org [31]–[36]

## What Is NOT Yet Decidable
- **Final savings commit:** requires AMS ticket volumes, incident/request mix, and per-app run hours — not in current evidence base
- **AMS internal labor disposition:** $83.0M labor line [19] cannot be split into retain / transition / release without role-level mapping beyond the 7 org records sampled [31]–[36]
- **Transition feasibility windows:** mainframe cutover risk requires DR test results and COBOL app inventory depth (e.g., APP-0227, APP-0458) [16][18]
- **Retained-org target operating model:** current span (119 Directors, 99 Sr Mgrs) needs design before we can quote net savings vs. gross
- **Sabre, Oracle, SAP interlocks:** PSS and ERP renewals (2026–2027) may constrain AMS scope boundaries

## Decision & Next Steps
- **Approve today:** Phase 0 charter, sourcing advisor RFP, exec sponsor (SVP-level) [31]–[34]
- **Next 90 days:** baseline ticket volumes, unit rates, and AMS labor disposition; lock scope boundary against 660-app portfolio
- **Months 4–6:** issue RFP to incumbents + 2 challengers + 1 GCC; SLA regime redesign in parallel
- **Board checkpoint Q3 2026:** down-select with validated savings range, transition plan, and retained-org design
- **Signature window:** Accenture 2027-03-31, IBM 2027-12-31 — must be in market by Q2 2026 to preserve leverage [1][2]

---
**Source register:** [1] IBM contract; [2] Accenture contract; [3]–[6] specialist AMS contracts; [7]–[12] SLA register (Mainframe, Compute, Storage, Network, Security, Telecom); [13]–[18] application portfolio; [19]–[24] FY26 IT financials (AMS lines); [25]–[30] mainframe estate; [31]–[36] org roles.

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