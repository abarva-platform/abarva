# AbarVa Sourcing Corpus Build · Comprehensive Autonomous Loop

**Mandate:** Build the deepest sourcing knowledge corpus available anywhere. Author ~500 typed patterns across 8 domains. Consolidate freestanding playbooks into the corpus. Wire retrieval so every Sentinel synthesis on the Source surface pulls from corpus, not from parallel files. Run end-to-end with auto-merge on every PR that meets criteria.

**This is the ambitious build.** AbarVa's stated position is to be the next best thing in sourcing. That requires corpus depth. Today we have 12 source patterns. The credible threshold is 400-500. This loop closes that gap.

**Read this entire prompt before starting. Read the companion specs. Then begin authoring.**

---

## §0 · Companion specs (read before starting)

These are authoritative. Read in order:

1. `docs/build/BRAND_VOICE_SPEC_V1.md` — voice rules for every word of corpus content
2. `docs/build/PUBLIC_SITE_SPEC_V1.md` §6 — pattern body editorial rules
3. `src/lib/intelligence/seed-types.ts` — the `PatternSeed` type that every authored pattern conforms to
4. `src/lib/intelligence/seed-patterns-sourcing.ts` — the 12 existing source patterns (read each one to understand current depth and tone; new patterns match or exceed)
5. `src/lib/agent/stage-playbooks.ts` and `src/lib/agent/service-category-playbooks.ts` — freestanding playbooks to be consolidated into corpus
6. `src/app/api/chat/agent/route.ts` — current playbook injection points (these get refactored)

---

## §1 · The eight domains and their target pattern counts

The corpus is organized into eight domains. Each domain has a target count and a domain-specific authoring guide below in §3.

| Domain | Code prefix | Target patterns | Status today |
|---|---|---|---|
| 1 · Category-specific sourcing playbooks | `PAT-SRC-CAT-*` | ~50 | 0 |
| 2 · Vendor intelligence profiles | `PAT-SRC-VEN-*` | ~200 | 0 |
| 3 · Contract intelligence | `PAT-SRC-CON-*` | ~30 | 0 |
| 4 · Pricing intelligence | `PAT-SRC-PRC-*` | ~25 | 0 |
| 5 · Process and methodology | `PAT-SRC-PROC-*` | ~20 | partial (in PAT-SRC-001 through PAT-SRC-012) |
| 6 · Industry-specific overlays | `PAT-SRC-IND-*` | ~50 | partial (8 in PAT-IND-* but not sourcing-overlay-specific) |
| 7 · Regulatory and compliance | `PAT-SRC-REG-*` | ~15 | 0 |
| 8 · Risk patterns | `PAT-SRC-RSK-*` | ~25 | 0 |
| **TOTAL** | | **~415** | **~12** |

The numbers are aspirational targets, not strict quotas. Author quality patterns; if a domain only warrants 30 patterns rather than 50, ship 30. If it warrants 70, ship 70. The autonomous loop authors until coverage is judged adequate per the §4 quality gates.

---

## §2 · Pattern type extension (REQUIRED FIRST WAVE)

The existing `PatternSeed` type in `seed-types.ts` is general-purpose. Sourcing patterns need additional structured fields. Extend the type with optional sourcing-specific extensions:

```ts
// Add to seed-types.ts (NEW — sourcing extensions, all optional, backward-compatible)

export interface SourcingPatternExtensions {
  // Category metadata
  category?: SourcingCategory;
  vendorClass?: VendorClass;  // 'direct-tech' | 'service' | 'hardware' | 'professional-services'

  // Lifecycle (when pattern defines a lifecycle)
  lifecycleStages?: LifecycleStage[];
  perStageGateCriteria?: PerStageGates;
  perStageExpectedArtifacts?: PerStageArtifacts;

  // Vendor knowledge
  vendorLandscape?: VendorLandscapeEntry[];
  pricingBenchmarks?: PricingBenchmark[];

  // Contract knowledge
  standardClauses?: ContractClauseTemplate[];
  negotiationLevers?: NegotiationLever[];

  // Risk knowledge
  riskFactors?: RiskFactor[];

  // Industry overlays (which industries this pattern modifies)
  industryVariants?: IndustryVariant[];
}

export interface PatternSeed extends SourcingPatternExtensions {
  // ... existing fields unchanged
}
```

Define each sub-type. They're all optional. Existing 109 primitives validate unchanged. New sourcing patterns populate the relevant fields.

**This is the prerequisite for everything below.** Author this type extension first as a single PR. Land it. Then proceed with corpus authoring.

---

## §3 · Per-domain authoring guides

For each of the 8 domains, this section defines what patterns to author and what their bodies must cover. **The autonomous loop iterates each domain in order.** Within a domain, patterns can be authored in parallel by multiple sub-agents.

### §3.1 · Domain 1 · Category-specific sourcing playbooks (`PAT-SRC-CAT-*`)

**Target: ~50 patterns**

Each pattern is one sourceable category. Pattern body must cover:

1. **Category definition** — what falls in scope, what doesn't (200-400 words)
2. **Vendor landscape** — top 5-10 vendors per tier (enterprise / mid-market / specialist), with positioning summary each
3. **Lifecycle** — which procurement stages apply, custom-named gate criteria per stage
4. **Evaluation rubric** — typical scoring dimensions with weights (functional fit, TCO, security, scalability, vendor stability, ecosystem, exit risk, etc.)
5. **Pricing benchmarks** — observed median, range, common pricing structures (subscription, usage-based, perpetual, hybrid)
6. **Common contradictions** — vendor claims vs measured reality (with detection rules where possible)
7. **Standard contract considerations** — top 5 clauses to negotiate per category
8. **Common failure modes** — what goes wrong when this category is sourced poorly
9. **Industry overlays** — how the pattern modifies for healthcare / financial services / retail / etc.
10. **Cited primary sources** — analyst reports, vendor docs, regulatory references (real ones, not invented)

Length per pattern: **800-1500 words** of body prose plus structured fields.

**The 50 categories to author** (group them; some sub-divide):

**Enterprise SaaS — application categories:**
- `PAT-SRC-CAT-CRM-001` — Enterprise CRM platforms
- `PAT-SRC-CAT-ERP-001` — ERP / financial systems (cloud)
- `PAT-SRC-CAT-ERP-002` — ERP / financial systems (legacy on-prem migration)
- `PAT-SRC-CAT-HCM-001` — Human capital management
- `PAT-SRC-CAT-ITSM-001` — IT service management
- `PAT-SRC-CAT-EPM-001` — Enterprise performance management / FP&A
- `PAT-SRC-CAT-CMS-001` — Content management systems
- `PAT-SRC-CAT-COMM-001` — Collaboration / productivity suites
- `PAT-SRC-CAT-COMM-002` — Video conferencing
- `PAT-SRC-CAT-COMM-003` — Enterprise messaging

**Data and analytics:**
- `PAT-SRC-CAT-CDP-001` — Customer data platforms
- `PAT-SRC-CAT-CDW-001` — Cloud data warehouses
- `PAT-SRC-CAT-LAKE-001` — Data lakehouse platforms
- `PAT-SRC-CAT-MDM-001` — Master data management
- `PAT-SRC-CAT-FAB-001` — Data fabric / data virtualization
- `PAT-SRC-CAT-ETL-001` — ETL / ELT platforms
- `PAT-SRC-CAT-REV-001` — Reverse ETL
- `PAT-SRC-CAT-BI-001` — Business intelligence platforms

**AI / ML:**
- `PAT-SRC-CAT-LLM-001` — Foundation model / LLM access
- `PAT-SRC-CAT-AGENT-001` — AI agent frameworks and platforms
- `PAT-SRC-CAT-VEC-001` — Vector databases
- `PAT-SRC-CAT-MLOPS-001` — MLOps platforms
- `PAT-SRC-CAT-CODE-001` — AI coding assistants

**Security and identity:**
- `PAT-SRC-CAT-IAM-001` — Identity and access management
- `PAT-SRC-CAT-IGA-001` — Identity governance
- `PAT-SRC-CAT-PAM-001` — Privileged access management
- `PAT-SRC-CAT-EDR-001` — Endpoint detection and response
- `PAT-SRC-CAT-SIEM-001` — SIEM / security analytics
- `PAT-SRC-CAT-SASE-001` — SASE / SSE platforms
- `PAT-SRC-CAT-SEC-CASB-001` — CASB
- `PAT-SRC-CAT-SEC-DSPM-001` — Data security posture management

**Infrastructure:**
- `PAT-SRC-CAT-IAAS-001` — IaaS (hyperscaler primary)
- `PAT-SRC-CAT-CONT-001` — Container platforms / Kubernetes
- `PAT-SRC-CAT-OBS-001` — Observability platforms
- `PAT-SRC-CAT-CDN-001` — CDN / edge
- `PAT-SRC-CAT-NET-001` — Network equipment

**Customer-facing:**
- `PAT-SRC-CAT-COM-001` — Headless commerce
- `PAT-SRC-CAT-MA-001` — Marketing automation
- `PAT-SRC-CAT-CSP-001` — Customer support platforms

**Services categories:**
- `PAT-SRC-CAT-SVC-AMS-001` — Application managed services (the one we already partially have)
- `PAT-SRC-CAT-SVC-MCS-001` — Cloud managed services
- `PAT-SRC-CAT-SVC-MSSP-001` — Managed security services
- `PAT-SRC-CAT-SVC-SI-001` — Systems integration
- `PAT-SRC-CAT-SVC-CON-001` — Strategic consulting (deliverable-based)
- `PAT-SRC-CAT-SVC-CON-002` — Strategic consulting (advisory retainer)
- `PAT-SRC-CAT-SVC-STAFF-001` — Staff augmentation
- `PAT-SRC-CAT-SVC-LEGAL-001` — Legal services panel

**Hardware and capital:**
- `PAT-SRC-CAT-HW-DC-001` — Data center hardware
- `PAT-SRC-CAT-HW-EP-001` — Endpoint fleet
- `PAT-SRC-CAT-FAC-001` — Office facilities

That's 50. Each gets a full pattern body.

### §3.2 · Domain 2 · Vendor intelligence profiles (`PAT-SRC-VEN-*`)

**Target: ~200 patterns**

Each pattern is one vendor. Pattern body must cover:

1. **Company snapshot** — founding, current size, financial summary (public if public company; analyst-estimate if private)
2. **Product portfolio** — what they sell, organized by category
3. **Recent strategic moves** — M&A, leadership changes, product launches, restructurings (last 24 months)
4. **Customer concentration** — known customer profile, anchor customer dependencies if any
5. **Pricing pattern** — observed pricing model (per seat, per usage, per workload), typical enterprise discount levels, escalator patterns
6. **Contract patterns** — common terms, known weak points to negotiate, escalation paths
7. **Common contradictions** — public claims vs measured reality (deployment timelines, ROI claims, performance benchmarks)
8. **Known weak points** — where this vendor underperforms vs alternatives
9. **Named alternatives** — top 3-5 alternatives by use case
10. **Regulatory exposure** — open litigation, data breach history, regulatory fines
11. **Security posture** — certifications held (SOC-2, ISO 27001, FedRAMP, etc.), known incidents

Length per pattern: **600-1200 words** plus structured fields.

**The 200 vendors:** prioritize by frequency of appearance in enterprise procurement. Tier 1 (the must-haves) and tier 2 (next-30) listed below; loop authors top 200 in priority order.

**Tier 1 — top 50 (must-cover for v1 launch):**

Hyperscale and platform: AWS, Microsoft (Azure + M365 + Dynamics), Google Cloud, Oracle (Cloud + apps + DB), IBM, Salesforce (CRM + Slack + Tableau + MuleSoft + Data Cloud), SAP (ECC + S/4HANA + SuccessFactors + Ariba + Concur), ServiceNow, Workday, Adobe, Snowflake, Databricks, Atlassian.

AI: OpenAI, Anthropic, Google DeepMind, Cohere, Mistral AI, Meta (open weights), Hugging Face.

Data and analytics: Confluent, MongoDB, Elastic, Cloudera, Informatica, Tableau (under SF), Looker (under Google), Power BI (under MS), ThoughtSpot, dbt Labs, Fivetran, Striim.

Security: Palo Alto Networks, CrowdStrike, Okta, Zscaler, SentinelOne, Cisco (security), Fortinet, Splunk (now Cisco).

Collaboration: Zoom, Box, Dropbox, Slack (under SF), Asana, Monday.com.

Mid-market enterprise applications: HubSpot, Zendesk, Intercom, NetSuite (under Oracle), Sage.

CDP/MarTech: Twilio (Segment), Adobe Experience Platform, Salesforce Data Cloud, mParticle, Tealium, Treasure Data, ActionIQ.

ITSM/ITOM: ServiceNow (already), BMC, Atlassian (Jira Service Management), Freshworks.

**Tier 2 — next 50 (cover after tier 1):** UiPath, Automation Anywhere, Pegasystems, Appian, OutSystems, Mendix, Coupa, Procurify, GEP, Jaggaer, Ivalua, Workiva, AuditBoard, OneTrust, Securiti, BigID, Drata, Vanta, Sumsub, Persona, Stripe, Marqeta, Plaid, Adyen, Block, Toast, Square (under Block), Lightspeed, Shopify, BigCommerce, commercetools, Algolia, Segment (under Twilio), Heap, Mixpanel, Amplitude, Pendo, Intercom (already), Fullstory, LogRocket, Datadog, New Relic, Dynatrace, AppDynamics, Honeycomb, PagerDuty, Sumo Logic, GitLab, GitHub (under MS), Atlassian (already), CircleCI.

**Tier 3 — next 100:** specialty vendors per category, regional vendors (European, APAC), emerging AI-native vendors, vertical-specific vendors (Veeva for life sciences, nCino for banking, Guidewire for insurance, Cerner/Epic for healthcare, Workday Student for higher ed, Tyler Tech for public sector, etc.).

The loop drafts; founder reviews; merge.

### §3.3 · Domain 3 · Contract intelligence (`PAT-SRC-CON-*`)

**Target: ~30 patterns**

Each pattern is one contract domain or one negotiable area. Body covers:

1. **What this clause/area governs** (200-400 words)
2. **Common vendor positions** — what vendors typically offer
3. **Buyer leverage points** — where buyers can push back, with conditions
4. **Walkaway scenarios** — when a buyer should walk
5. **Industry-specific variations** — healthcare, financial services, etc.
6. **Cited contract templates and analyst guidance**

**The 30 patterns:**

- `PAT-SRC-CON-DATA-OWN-001` — Data ownership clauses (SaaS)
- `PAT-SRC-CON-DATA-PORT-001` — Data portability and exit assistance
- `PAT-SRC-CON-DATA-RES-001` — Data residency and sovereignty
- `PAT-SRC-CON-AUDIT-001` — Audit rights and right-to-audit
- `PAT-SRC-CON-SLA-001` — SLA design (uptime, performance, response time)
- `PAT-SRC-CON-SLA-002` — SLA credit structures and caps
- `PAT-SRC-CON-IP-001` — IP ownership for custom development
- `PAT-SRC-CON-IP-002` — IP indemnification
- `PAT-SRC-CON-IP-003` — Source code escrow
- `PAT-SRC-CON-LIAB-001` — Liability caps and exclusions
- `PAT-SRC-CON-LIAB-002` — Indirect / consequential damages
- `PAT-SRC-CON-INDEM-001` — Indemnification scope
- `PAT-SRC-CON-INDEM-002` — Mutual vs unilateral indemnification
- `PAT-SRC-CON-WARRANTY-001` — Warranty periods and remedies
- `PAT-SRC-CON-CHANGE-001` — Change of control provisions
- `PAT-SRC-CON-RENEW-001` — Auto-renewal and notice requirements
- `PAT-SRC-CON-RENEW-002` — Price escalator caps
- `PAT-SRC-CON-RENEW-003` — Most favored nation clauses
- `PAT-SRC-CON-EXIT-001` — Termination for convenience
- `PAT-SRC-CON-EXIT-002` — Exit transition assistance
- `PAT-SRC-CON-FORCE-001` — Force majeure (post-COVID)
- `PAT-SRC-CON-CONFID-001` — Confidentiality and NDA scope
- `PAT-SRC-CON-DPA-001` — Data processing agreements (GDPR, CCPA)
- `PAT-SRC-CON-DPA-002` — Subprocessor approval rights
- `PAT-SRC-CON-DPA-003` — Cross-border transfer mechanisms (SCCs, BCRs)
- `PAT-SRC-CON-SEC-001` — Security obligations and incident notification
- `PAT-SRC-CON-SEC-002` — Vulnerability remediation SLAs
- `PAT-SRC-CON-MS-001` — Managed services resource substitution rights
- `PAT-SRC-CON-MS-002` — Managed services benchmarking rights
- `PAT-SRC-CON-MS-003` — Open-book pricing in managed services

### §3.4 · Domain 4 · Pricing intelligence (`PAT-SRC-PRC-*`)

**Target: ~25 patterns**

Each pattern is one pricing dimension or benchmark area. Body covers:

1. **What the pricing pattern is** — model, structure, observed practice
2. **Benchmark numbers** — observed medians, ranges, quartile breaks (cite source: "n=N enterprise programs," analyst report, vendor disclosure)
3. **Negotiation leverage at each price tier** — where vendors flex
4. **Switching cost analysis** — what makes the pricing sticky
5. **Industry/scale variations**

**The 25:**

- `PAT-SRC-PRC-SAAS-001` — Per-seat SaaS pricing benchmarks (CRM, HCM, ITSM)
- `PAT-SRC-PRC-SAAS-002` — Usage-based SaaS pricing (LLM access, infrastructure-adjacent)
- `PAT-SRC-PRC-SAAS-003` — Hybrid pricing (platform fee + usage)
- `PAT-SRC-PRC-AMS-001` — AMS pricing as % of dev cost
- `PAT-SRC-PRC-CDW-001` — Cloud data warehouse per-TB-month
- `PAT-SRC-PRC-LLM-001` — LLM inference cost per million tokens by model class
- `PAT-SRC-PRC-CDN-001` — CDN egress pricing
- `PAT-SRC-PRC-SEC-001` — Endpoint security per-seat / per-endpoint
- `PAT-SRC-PRC-IAM-001` — IAM per-user pricing
- `PAT-SRC-PRC-ESC-001` — Annual price escalator patterns by category
- `PAT-SRC-PRC-VOL-001` — Volume discount breakpoints
- `PAT-SRC-PRC-VOL-002` — Multi-product bundling discounts
- `PAT-SRC-PRC-COMMIT-001` — Multi-year commitment discount tiers
- `PAT-SRC-PRC-PREPAY-001` — Prepayment discount patterns
- `PAT-SRC-PRC-RAMP-001` — Ramp deals (low year 1, escalating)
- `PAT-SRC-PRC-TCO-001` — 3-year TCO normalization (SaaS)
- `PAT-SRC-PRC-TCO-002` — 5-year TCO with switching cost (SaaS)
- `PAT-SRC-PRC-TCO-003` — TCO including hidden costs (egress, support tier, training)
- `PAT-SRC-PRC-TCO-004` — Cloud TCO including egress and reserved-instance accounting
- `PAT-SRC-PRC-FX-001` — Currency exposure in multi-region deals
- `PAT-SRC-PRC-Q4-001` — Quarter-end vendor pricing patterns
- `PAT-SRC-PRC-EOY-001` — End-of-year deal patterns
- `PAT-SRC-PRC-RFP-001` — RFP-to-BAFO price compression patterns
- `PAT-SRC-PRC-RENEW-001` — Renewal discount patterns
- `PAT-SRC-PRC-MIDTERM-001` — Mid-term repricing leverage

### §3.5 · Domain 5 · Process and methodology (`PAT-SRC-PROC-*`)

**Target: ~20 patterns**

Each pattern is one procurement methodology or process. Body covers what the pattern is, when to use it, common pitfalls, expected outputs.

**The 20:**

- `PAT-SRC-PROC-RFP-DESIGN-001` — Functional vs outcome-based RFPs
- `PAT-SRC-PROC-RFP-DESIGN-002` — RFP question architecture
- `PAT-SRC-PROC-RFP-DESIGN-003` — Response evaluation rubric design
- `PAT-SRC-PROC-RFP-DESIGN-004` — Mandatory vs scored vs informational criteria
- `PAT-SRC-PROC-QA-001` — Q&A management and ambiguity resolution
- `PAT-SRC-PROC-EVAL-001` — Evaluation panel design and scoring
- `PAT-SRC-PROC-EVAL-002` — Multi-stakeholder evaluation alignment
- `PAT-SRC-PROC-BAFO-001` — BAFO orchestration
- `PAT-SRC-PROC-BAFO-002` — Price-only vs commercial-terms BAFO
- `PAT-SRC-PROC-WALKAWAY-001` — Walkaway leverage and signaling
- `PAT-SRC-PROC-NEG-001` — Heads of terms vs full contract sequencing
- `PAT-SRC-PROC-NEG-002` — Concession trading patterns
- `PAT-SRC-PROC-STAKE-001` — Stakeholder mapping for sourcing decisions
- `PAT-SRC-PROC-SPONSOR-001` — Sponsor sign-off cadence by deal size
- `PAT-SRC-PROC-LEGAL-001` — Procurement / legal triangulation patterns
- `PAT-SRC-PROC-INCUMBENT-001` — Incumbent vs challenger dynamics
- `PAT-SRC-PROC-RFI-001` — RFI design for capability research
- `PAT-SRC-PROC-SHORTLIST-001` — Shortlisting criteria and pitfalls
- `PAT-SRC-PROC-DD-001` — Vendor due diligence (financial, security, compliance)
- `PAT-SRC-PROC-REF-001` — Reference customer interviews

These overlap with the existing PAT-SRC-001 through PAT-SRC-012 — the loop should consolidate where appropriate (move existing content into new pattern IDs if cleaner) or leave existing in place if depth is adequate.

### §3.6 · Domain 6 · Industry overlays (`PAT-SRC-IND-*`)

**Target: ~50 patterns**

Each pattern is one industry × one major procurement area. Body covers how the procurement pattern modifies for the specific industry.

**The 50** (industry × focus area matrix):

**Healthcare (8):** EHR procurement, BAA requirements, FDA-regulated software procurement, HIPAA-driven contract clauses, payer-specific procurement, clinical trial vendor sourcing, medical device procurement, telehealth platform procurement.

**Financial services (8):** Model risk management vendor sourcing, third-party risk (SR 11-7 application), FFIEC requirements, OCC heightened standards, core banking platform procurement, payment processor procurement, fraud/AML vendor sourcing, capital markets technology procurement.

**Retail and CPG (6):** Omnichannel platform procurement, peak-season SLA requirements, payment processing in retail, supply chain visibility platforms, in-store technology, CDP-for-retail procurement.

**Manufacturing (6):** OT/IT convergence sourcing, ICS security procurement, MES/MOM procurement, supplier collaboration platforms, quality management systems, predictive maintenance platforms.

**Energy and utilities (5):** NERC CIP compliance in procurement, OT cybersecurity, asset management platforms, smart grid technology procurement, trading and risk management.

**Public sector (5):** FedRAMP-required procurement, StateRAMP, GSA schedule procurement, FAR-driven processes, FedRAMP High vs Moderate decisions.

**Higher education (4):** Research computing procurement, student information systems, learning management systems, identity systems for ed.

**Telecommunications (4):** Carrier-grade procurement, peering and transit, OSS/BSS systems, 5G infrastructure procurement.

**Insurance (4):** Policy administration system procurement, claims systems, actuarial platforms, insurtech vendor evaluation.

### §3.7 · Domain 7 · Regulatory and compliance (`PAT-SRC-REG-*`)

**Target: ~15 patterns**

Each pattern is one regulatory regime as it affects sourcing decisions. Body covers what the regulation requires of vendor contracts, contractual obligations, audit trail requirements.

**The 15:**

- `PAT-SRC-REG-DORA-001` — DORA (EU operational resilience for financial services)
- `PAT-SRC-REG-EU-AI-001` — EU AI Act vendor obligations
- `PAT-SRC-REG-NIS2-001` — NIS2 cybersecurity vendor management
- `PAT-SRC-REG-DPDPA-001` — DPDPA (India) data protection in vendor contracts
- `PAT-SRC-REG-CCPA-001` — California privacy laws in vendor contracts
- `PAT-SRC-REG-GDPR-001` — GDPR vendor contract requirements
- `PAT-SRC-REG-HIPAA-001` — HIPAA BAA requirements
- `PAT-SRC-REG-GLBA-001` — GLBA in financial services vendor contracts
- `PAT-SRC-REG-PCI-001` — PCI-DSS scope and vendor obligations
- `PAT-SRC-REG-SOX-001` — SOX 404 in vendor contracts
- `PAT-SRC-REG-EXP-001` — Export controls in vendor contracts
- `PAT-SRC-REG-OFAC-001` — OFAC and sanctions screening
- `PAT-SRC-REG-ESG-001` — ESG and supplier diversity reporting
- `PAT-SRC-REG-FED-001` — Federal procurement regulations (FAR/DFARS)
- `PAT-SRC-REG-PCI-002` — PCI-DSS scope reduction strategies in vendor selection

### §3.8 · Domain 8 · Risk patterns (`PAT-SRC-RSK-*`)

**Target: ~25 patterns**

Each pattern is one sourcing-related risk class. Body covers detection, mitigation, contractual remedies.

**The 25:**

- `PAT-SRC-RSK-CONC-001` — Single-vendor concentration risk
- `PAT-SRC-RSK-CONC-002` — Hyperscaler concentration risk
- `PAT-SRC-RSK-CONC-003` — Multi-vendor coordination cost
- `PAT-SRC-RSK-FIN-001` — Vendor financial distress detection
- `PAT-SRC-RSK-FIN-002` — Vendor M&A exposure
- `PAT-SRC-RSK-FIN-003` — Private vendor going-public risk
- `PAT-SRC-RSK-GEO-001` — Geopolitical exposure in vendor relationships
- `PAT-SRC-RSK-GEO-002` — Cross-border data transfer risk
- `PAT-SRC-RSK-GEO-003` — China-based vendor exposure
- `PAT-SRC-RSK-SUP-001` — Sub-tier supplier risk
- `PAT-SRC-RSK-SUP-002` — Supply chain dependency mapping
- `PAT-SRC-RSK-CYB-001` — Cyber risk in vendor selection
- `PAT-SRC-RSK-CYB-002` — Vendor security incident exposure
- `PAT-SRC-RSK-CYB-003` — Open source dependency risk in vendor products
- `PAT-SRC-RSK-INSOL-001` — Vendor insolvency exposure
- `PAT-SRC-RSK-INSOL-002` — Source code escrow as insolvency hedge
- `PAT-SRC-RSK-LOCK-001` — Vendor lock-in patterns
- `PAT-SRC-RSK-LOCK-002` — Switching cost analysis
- `PAT-SRC-RSK-LOCK-003` — Data portability as lock-in defense
- `PAT-SRC-RSK-PERF-001` — Vendor performance failure patterns
- `PAT-SRC-RSK-PERF-002` — SLA breach to material breach escalation
- `PAT-SRC-RSK-CONFL-001` — Vendor conflict of interest
- `PAT-SRC-RSK-REPUT-001` — Vendor reputational risk transfer
- `PAT-SRC-RSK-REGUL-001` — Vendor regulatory exposure exposure
- `PAT-SRC-RSK-CHANGE-001` — Vendor product roadmap change risk

---

## §4 · Quality gates · what makes a pattern shippable

Every pattern body must pass these checks before its PR auto-merges. The autonomous loop self-checks each pattern against these.

### §4.1 · Required structural completeness

- [ ] All required `PatternSeed` fields populated (id, slug, title, domain, tier, vertical, thesis, applicability, status, version, confidence, body)
- [ ] Sourcing extension fields populated where applicable to the pattern's domain
- [ ] Body length: 400-1500 words depending on pattern type
- [ ] Body contains all required sections per §3 domain guides

### §4.2 · Voice and tone

- [ ] Passes brand voice spec §13 review checklist
  - State don't sell — no marketing adjectives
  - Specific over abstract — numbers, named entities, cited sources
  - Uncertainty honestly — claims hedged where evidence is thin
  - No throat-clearing — first sentence does work
  - Same voice as other patterns
- [ ] Operational + technical register per §4 of brand voice spec
- [ ] No promotional content about AbarVa itself in pattern bodies

### §4.3 · Citation density

- [ ] Every quantitative claim has a source: analyst report (named), vendor disclosure (cited), regulatory document (cited), or "n=N enterprise programs observed" with N specified
- [ ] Hedge unsourced claims with "estimated" or "varies"
- [ ] No invented numbers, no invented vendor pricing, no invented analyst quotes
- [ ] Where data is unavailable, the body says so plainly

### §4.4 · Cross-references

- [ ] Pattern declares its `relatedPatternIds` honestly — at least 2-3 related patterns from the corpus
- [ ] Pattern declares its `taggedContradictionIds` if any active contradictions apply
- [ ] Pattern's `derivedFromPatternIds` set if it specializes a parent pattern

### §4.5 · Determinism

- [ ] No `Date.now()`, `Math.random()`, or runtime calls in the seed file
- [ ] All field values are static literals
- [ ] `confidence` field set thoughtfully (0.70-0.85 for solid; 0.85-1.00 for high-evidence; 0.50-0.70 for speculative)

### §4.6 · TypeScript validation

- [ ] `npx tsc --noEmit` passes
- [ ] Pattern validates against `PatternSeed` type

---

## §5 · Authoring loop mechanics

### §5.1 · Wave structure

The work runs as a sustained autonomous loop with no hard halt point. Waves are organized as:

**Wave 0 · Type extension** (one PR)
- Extend `seed-types.ts` with `SourcingPatternExtensions` from §2
- Land before any other wave starts

**Wave 1-N · Per-pattern authoring** (one PR per pattern, parallelized)
- Each PR authors 1-5 patterns from a single domain
- Branch naming: `corpus/<domain>/<pattern-id-list>` (e.g., `corpus/cat/saas-batch-1`)
- File naming: extend `seed-patterns-sourcing.ts` for sourcing-process patterns; create new files for new domains:
  - `seed-patterns-vendor-profiles.ts` for `PAT-SRC-VEN-*`
  - `seed-patterns-contracts.ts` for `PAT-SRC-CON-*`
  - `seed-patterns-pricing.ts` for `PAT-SRC-PRC-*`
  - `seed-patterns-categories.ts` for `PAT-SRC-CAT-*`
  - `seed-patterns-industry-overlays.ts` for `PAT-SRC-IND-*`
  - `seed-patterns-regulatory.ts` for `PAT-SRC-REG-*`
  - `seed-patterns-risk.ts` for `PAT-SRC-RSK-*`
- Update `seed-patterns-sourcing.ts` exports / imports
- Update `pattern-manifest.json` if used for indexing

**Wave Final · Consolidation** (one PR)
- Migrate freestanding `src/lib/agent/stage-playbooks.ts` and `src/lib/agent/service-category-playbooks.ts` content INTO the corpus where corpus equivalents exist
- Delete the freestanding files after migration verified
- Refactor `src/app/api/chat/agent/route.ts` to retrieve from corpus via existing retrieval infrastructure rather than from freestanding playbook files
- Cross-reference health: verify `src/lib/agent/*` imports from `src/lib/intelligence/*`

### §5.2 · Auto-approval criteria per PR

A PR auto-merges when **all** of:
1. `pnpm typecheck` passes
2. `pnpm test` passes
3. Pattern body passes the §4 quality gates (self-checked by the agent against the checklist)
4. PR title format: `[corpus][<domain>] Author <pattern-id-list> · <count> patterns`
5. PR description lists each pattern ID, its title, its body word count, and its confidence value
6. No file outside `src/lib/intelligence/` or `seed-types.ts` is modified (except in Wave Final consolidation)
7. No regression in existing test suites

### §5.3 · Holds and escalations

A PR holds for founder review (does NOT auto-merge) if:
- Any pattern body claims a specific vendor's recent M&A or financial distress that the agent can't cite to a public source
- Any pattern body makes a claim about a named regulator's specific enforcement that the agent can't cite to public guidance
- Pattern body falls below 400 words despite genuine effort
- Confidence value is set ≥0.85 but citations are thin

Holds use `[NEEDS REVIEW]` PR label. Loop continues with other patterns; held PRs accumulate for founder review.

### §5.4 · Parallelization

Up to 8 simultaneous open branches across non-conflicting file globs. Domains 1-8 are mostly independent (different files for `PAT-SRC-CAT-*` vs `PAT-SRC-VEN-*` etc.) so most patterns can author in parallel.

---

## §6 · Source material guidance

The agent doesn't make things up. Where the agent needs source material to author a pattern body, it draws from:

### §6.1 · Acceptable source types

- Public analyst reports (Gartner, Forrester, IDC, 451 Research, etc.) — cite the report by name and year
- Vendor public disclosures (10-K, 10-Q, proxy statements, public pricing pages, customer case studies)
- Regulatory documents (DORA, GDPR, HIPAA, etc.)
- Reputable trade publications (Bloomberg, Reuters, FT, WSJ, The Information, Stratechery)
- Industry consortium publications (Cloud Security Alliance, CIS, NIST)
- "n=N enterprise programs observed" — when AbarVa has actual aggregated data; otherwise honestly say "estimated"

### §6.2 · Unacceptable

- Citing a source the agent didn't actually verify
- Inventing vendor pricing
- Inventing analyst quotes
- Speculating about private company financials
- Using marketing copy verbatim (paraphrase)

### §6.3 · When source is unavailable

If a pattern body legitimately requires data the agent can't source:
- Hedge with "estimated" or "varies"
- Set confidence to 0.50-0.70 range
- Note the data gap in the body
- Add a TODO marker for founder to provide proprietary data

---

## §7 · Sourcing for the autonomous loop · how the agent finds source material

The agent has these tools available during pattern authoring:

1. **Web search** — for analyst reports, vendor public disclosures, regulatory documents
2. **Web fetch** — for retrieving full content of known URLs
3. **Repo search** — for finding existing pattern bodies that establish style and citation patterns
4. **Existing corpus** — for cross-references, related patterns, citation reuse

Use them aggressively. A 1000-word pattern body authored without web search is almost certainly speculation.

---

## §8 · Estimated PR count and merge cadence

The full corpus expansion is approximately:

- 1 type extension PR (Wave 0)
- ~150-200 pattern authoring PRs (Waves 1-N, batched 1-5 patterns each)
- 1 consolidation PR (Wave Final)

Total: ~150-200 PRs.

The loop runs until the §1 target counts are approximately met or until source material becomes systematically unavailable for a domain. The loop does not stop because of slow CI or transient failures.

---

## §9 · After the corpus expansion

Once the corpus is at depth, downstream work becomes available:

1. **Vendor profile pages on the public site** — `abarva.ai/vendors/{slug}` rendering the 200+ vendor profiles. Massive SEO surface.
2. **Category sourcing playbook pages** — `abarva.ai/categories/{slug}` rendering each category pattern. Buyer-discoverable content.
3. **Pricing benchmark public surface** — `abarva.ai/benchmarks/` rendering pricing patterns. Most viral surface — every CIO wants to compare their deal.
4. **Contract clause library** — `abarva.ai/contracts/{clause}` — every clause becomes shareable, citable.
5. **Public Atlas scope expansion** — Atlas now answers from 500+ patterns instead of 30.

These downstream surfaces are out of scope for this loop but are unblocked by it.

---

## §10 · Halt conditions (rare)

The loop only halts on:

1. `seed-types.ts` extension PR fails to merge (foundational)
2. The autonomous agent runs out of credit (operational)
3. Founder explicitly halts via `docs/build/CORPUS_PAUSE.md`
4. Master orchestration's KF-* waves are still active and would conflict with Wave Final consolidation

For everything else (slow merges, transient CI failures, individual patterns failing voice review): continue. The loop should have ~150 PRs in flight over its full lifecycle.

---

## §11 · Final note

This is the corpus that makes AbarVa's positioning credible. Today the Source surface looks like a beautiful demo. After this loop, it's a genuine sourcing knowledge product.

The depth is the moat. Every pattern authored is a piece of the moat. The autonomous loop's job is to keep authoring, never stop, never settle for a shallow body, never invent data.

Read every spec file referenced. Begin Wave 0. Don't ask for permission between waves.

**Do not respond to this prompt with a plan. Do not summarize. Start with Wave 0 — the type extension PR.**

---

**End of sourcing corpus build kickoff v1.**
