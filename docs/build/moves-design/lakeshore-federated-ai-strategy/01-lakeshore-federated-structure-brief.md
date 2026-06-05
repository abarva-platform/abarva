# Lakeshore Federated Structure Brief

**Purpose:** Set the vocabulary every other file in this package uses. Define the L0/L1 entities, the CXO bench per HoldCo, the IT estate posture per HoldCo, and the benchmark anchors that ground every claim downstream.

**Honest disclosure:** "Lakeshore" and its three L1 HoldCos are **fictionalized** — inspired by real PE-style holding structures, sized and shaped to make the demo CXO-credible, but no specific real fund is being represented. Every quantitative anchor (IT spend ratios, vendor benchmarks, fee compression ranges, AI use case ROI ranges) is sourced from public industry data or cited corpus patterns; those citations are flagged in the right margin throughout this document.

---

## L0 · Lakeshore

| Attribute | Value | Source |
|---|---|---|
| Type | Permanent capital vehicle / fund-of-HoldCos | (fictional) |
| HQ | Chicago, IL | (fictional) |
| Portfolio | 3 active L1 HoldCos · 24 underlying PortCos · $4.8B AUM | (fictional, sized to mid-market PE benchmark) |
| L0 team | 18 FTE: Investment (8) · Portfolio Ops (5) · Finance (3) · Compliance (2) | (fictional, sized per ILPA mid-fund template) |
| Tech posture | Lean L0 stack: NetSuite OneWorld (financial roll-up) · Anaplan (portfolio planning) · DealCloud (deal flow) · Box (data room) · MS 365 | (typical mid-market PE stack) |
| Sponsor primary asks | Portfolio-wide IT/AI optimization · cross-HoldCo cost reduction · federated risk visibility · platform rollout standardization | (typical PE Op-Partner mandate) |

**L0 CXO bench:**

| Role | Name (fictional) | Mandate |
|---|---|---|
| Managing Partner | Anya Korchnoi | Sponsor-level governance · IC chair |
| Operating Partner — Technology | Marcus Rhee | Cross-HoldCo IT/AI optimization · platform rollout governance |
| Operating Partner — Finance | Devon Sterling | Cross-HoldCo cost reduction · treasury federation |
| Chief Compliance Officer | Priya Anand | Federated risk · regulatory inventory |
| Portfolio Ops Director | Kenji Brooks | HoldCo CXO relationship management · operating reviews |

---

## L1 · Morgan Street Holdings Chicago (the primary demo HoldCo)

| Attribute | Value | Source |
|---|---|---|
| Type | Diversified mid-market holding company | (fictional) |
| HQ | Chicago, IL | (fictional) |
| Industries | Specialty manufacturing (3 PortCos) · industrial distribution (2 PortCos) · facility services (3 PortCos) | (fictional, sized to typical $2-3B HoldCo) |
| Revenue (consolidated) | $2.1B | (fictional) |
| EBITDA | $295M (14.1% margin) | (fictional, typical for diversified mid-market) |
| Employees | 4,800 | (fictional) |
| IT spend | $52M (2.5% of revenue) | (in range — finserv knowledge file 13 benchmarks IT spend 1.8-3.2% mid-market) |
| Treasury posture | **Kyriba rollout in flight — Wave 1 live (HoldCo + 3 PortCos); Wave 2 (remaining 5 PortCos) planned Q3 2026** | (the demo anchor) |

**Morgan Street CXO bench:**

| Role | Name (fictional) | Tenure | Primary stack |
|---|---|---|---|
| CEO | William Tanaka | 6 yrs | — |
| CFO | Sarah Lindqvist | 3 yrs | NetSuite OneWorld · Adaptive Insights · Kyriba (in rollout) · Concur |
| CIO | Daniel Okonkwo | 2 yrs (came from F500 CPG IT) | Microsoft 365 · Azure (primary cloud) · Snowflake (small footprint) · Workday · ServiceNow · Salesforce per PortCo |
| COO | Maya Patel | 4 yrs | Per-PortCo ERPs (mostly NetSuite, two on Sage Intacct) · MES varies |
| CHRO | Jonathan Reese | 5 yrs | Workday (HoldCo level) · ADP (legacy at 2 PortCos) · 15Five · Lever |
| Group Treasurer | Aisha Vargas | 1 yr (hired specifically for Kyriba rollout) | Kyriba (target) · Excel + bank portals (current) |
| General Counsel | Robert Mei | 8 yrs | Ironclad (CLM) · Diligent (board) · LogicGate (GRC) |
| Chief Information Security Officer | Lena Hoffman | 2 yrs | CrowdStrike · Okta · Microsoft Sentinel · Rapid7 |

**Morgan Street IT estate posture:**

- **Cloud:** ~70% Azure, ~20% AWS (inherited from one PortCo), ~10% on-prem (one specialty manufacturing PortCo on legacy)
- **Data plane:** Snowflake adopted at HoldCo level 18 months ago; PortCo-level ingestion uneven (3 PortCos integrated, 5 in flight or not started)
- **AI maturity:** Early — 2 active POCs (procurement spend analytics, customer service ticket triage); no production AI workloads; no formal AI governance committee yet
- **Major vendor contracts > $1M annual:** Microsoft EA ($4.2M) · Workday ($3.1M) · Snowflake ($2.4M) · ServiceNow ($1.8M) · CrowdStrike ($1.4M) · Salesforce (across PortCos, $1.9M consolidated) · NetSuite ($1.6M)
- **Banking relationships:** **14 banks** — JPMorgan (primary), Citi, BofA (primary cash mgmt for 2 PortCos), PNC, Wintrust, BMO Harris, plus 8 regional/specialty banks. **H2H-ready: 4** (JPMorgan, Citi, BofA, PNC). **Fee compression target if rationalized to 6: $2.8M annual** *(in range — finserv file 08 banking cost-to-income benchmarks)*

**Kyriba rollout status (the Move 0 anchor):**

| Gate | Status | Risk |
|---|---|---|
| Banking H2H connectivity | 4 of 14 banks live H2H · 10 still on bank-portal scraping or manual | **P0** — Kyriba forecasting accuracy capped by manual feeds |
| ERP feed quality (HoldCo NetSuite → Kyriba) | Live but reconciliation variance averages 0.4% (target <0.05%) | **P1** — GL/cash variance daily |
| Entity hierarchy load | Loaded; IC mapping for 2 PortCos still under reconciliation | **P1** — IC eliminations manual at month-end |
| Cash forecasting model | Not live; <90 days of clean position data available | **P0** — Predictive forecasting deferred to Wave 2 |
| User adoption | 32 of expected 48 users logging in weekly (67%) | **P1** — Treasury team partially in Excel |
| IC auto-reconciliation | Not implemented; month-end IC posting still manual (4-day cycle) | **P1** — Close acceleration deferred |

This is what Move 0 attacks.

---

## L1 · Roosevelt Holdings Atlanta (fictional sibling)

| Attribute | Value |
|---|---|
| Industries | Healthcare services (4 PortCos: physical therapy, home health, dental MSO, urgent care) |
| Revenue (consolidated) | $1.4B |
| EBITDA | $182M (13.0% margin) |
| Employees | 6,200 |
| IT spend | $39M (2.8% of revenue) |
| Treasury posture | **Pre-Kyriba — currently on Excel + bank portals across 9 banks; Kyriba evaluation in flight** |

**Roosevelt CXO bench (compact):**

| Role | Name | Stack notes |
|---|---|---|
| CFO | Priya Naidu | Sage Intacct (HoldCo) · per-PortCo PMS systems |
| CIO | Edward Park | Mixed Azure / AWS · no central data plane yet (clinical data PHI/HIPAA constraints) |
| Group Treasurer | (open role) | — |
| CHRO | Rachel Donovan | Workday in flight (2 PortCos live) · BambooHR (legacy at 2 PortCos) |

**Roosevelt vendor overlap with Morgan Street (cross-HoldCo lens):**

- Workday: both have it → consolidated negotiation leverage
- Microsoft EA: separate contracts → enterprise-rate consolidation opportunity
- ADP: Roosevelt has it as PortCo legacy; Morgan Street has it at 2 PortCos → consolidate to Workday cleanup
- Salesforce: both have small footprints → minor consolidation
- **Same Big-4 auditor** (KPMG) → federated audit RFP opportunity

---

## L1 · Lakefront Capital Boston (fictional sibling)

| Attribute | Value |
|---|---|
| Industries | B2B SaaS / tech-enabled services (3 PortCos: vertical SaaS for legal, marketing-tech, fintech infrastructure) |
| Revenue (consolidated) | $620M |
| EBITDA | $97M (15.6% margin) |
| Employees | 1,400 |
| IT spend | $34M (5.5% of revenue — higher because PortCos are tech companies) |
| Treasury posture | **Kyriba live since 2024 — mature operating model; could share its playbook with Morgan Street** |

**Lakefront CXO bench (compact):**

| Role | Name | Stack notes |
|---|---|---|
| CFO | Marcus Andersen | NetSuite OneWorld · Kyriba (mature) · Adaptive Insights |
| CIO | Yuki Ono | Heavy AWS · Snowflake mature · Production AI workloads (3) |
| Group Treasurer | Anil Kapoor | Kyriba power user · post-rollout AI extensions in flight |
| CHRO | Sophia Mendel | Workday (HoldCo + all PortCos) |

**Lakefront's unique role in the demo:** the **proof point that Kyriba + AI on top works**. Move 1 references Lakefront's already-live anomaly detection + forecast accuracy improvements as the case-study evidence Morgan Street is being asked to follow. Cross-HoldCo learning surfaced through Tower's "Federated" tab.

---

## Cross-HoldCo opportunity surface (the L0 view)

When all three HoldCos' CXO intel bundles are loaded, AbarVa surfaces these to Lakeshore L0:

### Vendor consolidation opportunities

| Vendor | Morgan Street spend | Roosevelt spend | Lakefront spend | Total | Consolidation savings est. | Notes |
|---|---|---|---|---|---|---|
| Microsoft EA | $4.2M | $2.1M | $2.8M | $9.1M | $1.0–1.4M (11–15%) | All on separate EAs; enterprise-rate at $9M+ |
| Workday | $3.1M | $1.4M (in flight) | $1.6M | $6.1M | $0.6–0.9M (10–15%) | All on separate contracts |
| Salesforce | $1.9M | $0.8M | $0.4M | $3.1M | $0.3–0.5M (10–16%) | Small footprints, consolidation modest |
| KPMG (audit) | $2.4M | $1.8M | $1.2M | $5.4M | $0.5–0.8M (10–15%) | Federated RFP opportunity |
| CrowdStrike | $1.4M | $0.9M | $0.7M | $3.0M | $0.3–0.5M (10–17%) | All separate; cyber concentration risk also flagged |
| Snowflake | $2.4M | — | $1.9M | $4.3M | $0.4–0.6M (10–14%) | Roosevelt evaluating; opportunity to standardize |
| Okta | $0.8M | $0.5M | $0.6M | $1.9M | $0.2–0.3M (10–16%) | Modest |
| **Estimated total cross-HoldCo savings opportunity** | | | | **$32.9M consolidated spend** | **$3.3–5.0M annual** | First-pass; modeled vs benchmarks |

*Benchmark anchor for 10–17% consolidation savings on enterprise software: finserv file 13 (IT spend benchmarks) + file 20 (vendor landscape) + Gartner enterprise-rate negotiation patterns. Range is honest — actuals depend on contract structure, renewal timing, vendor competitive pressure.*

### Federated platform rollout opportunities

| Platform | Coverage | Federated rollout savings |
|---|---|---|
| Kyriba | Lakefront live · Morgan Street Wave 1 live · Roosevelt evaluating | If Roosevelt rolls out using shared playbook + same SI: **30-40% implementation cost reduction vs solo rollout** *(in range per Gartner platform-rollout standardization patterns)* |
| Workday | Lakefront full · Morgan Street HoldCo + 2 PortCos · Roosevelt in flight | Shared change methodology + shared Workday SI relationship: **20-30% implementation cost reduction** |

### Risk concentration flags

| Risk | Exposure | L0 view |
|---|---|---|
| Single audit firm (KPMG) | All 3 HoldCos | Concentration acceptable for now; flagged for audit cmte annual review |
| Single cyber insurance carrier | Currently 2 of 3 on same carrier | **Concentration risk — recommend split or federated negotiation with two-carrier program** |
| CrowdStrike single-vendor cyber | All 3 HoldCos | Single-point-of-failure flagged; reviewing 2025 CrowdStrike incident impact retroactively |
| Banking concentration | Morgan Street 14 banks (fragmented); Roosevelt 9 banks; Lakefront 5 (rationalized) | Morgan Street and Roosevelt should follow Lakefront's pattern |

### Talent + comp benchmarking

| Role | Morgan Street | Roosevelt | Lakefront | Industry P50 (mid-market) | Notes |
|---|---|---|---|---|---|
| CIO cash comp | $385K | $340K | $410K | $360K | All in range |
| IT FTE ratio | 1 IT per 87 employees | 1 per 142 | 1 per 33 | 1 per 75 | Lakefront higher (tech PortCos); Roosevelt low (concerning) |
| AI/ML eng team size | 0 | 0 | 12 | varies | Federated AI capability sharing critical |

---

## How the structure brief is used downstream

Every other file in the package treats these entities, CXOs, vendors, spend numbers, and Kyriba status as **canonical**. Any artifact that references Morgan Street's CFO refers to Sarah Lindqvist. Any artifact that references Kyriba rollout status uses the 6-gate table above. Any cross-HoldCo opportunity claim references this table or extends it with new categories.

When the loader UI ships in Wave 1, the demo seed data populates **exactly these values** so that the demo is internally consistent.

When the loader UI ingests **real customer data**, these fictional values are overwritten — the demo seed is replaced with the customer's actual CXO bench, vendors, spend, contracts.

---

## Sources cited

- **finserv knowledge files 03, 07, 08, 13, 14, 16, 17, 20** — `scripts/knowledge-data/finserv/*.txt` (loaded benchmarks)
- **Modernization pattern pack** — `docs/build/MODERNIZATION_PATTERN_PACK_INDUSTRY_PROFILES_2026-06-03.md`
- **Lakeshore corpus brief** — `docs/build/codex-handoff/2026-06-04-LAKESHORE_CORPUS_MASTER_PROMPT.md` (in flight)
- **Gartner platform-rollout standardization patterns** (public)
- **ILPA mid-fund operating partner templates** (public)
