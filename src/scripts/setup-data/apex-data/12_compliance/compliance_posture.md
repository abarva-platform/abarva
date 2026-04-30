# Apex Retail — Compliance and Regulatory Posture

**Tenant key:** `apex-retail`
**Last updated:** 2026-04-22
**Owner:** Rebecca Singh (General Counsel) + Sarah Whitfield (CISO)
**Data classification:** Confidential

## 1. Applicable regulations — current posture

| Framework | Scope | Posture | Last assessment | Next assessment |
|---|---|---|---|---|
| SOX (Sarbanes-Oxley) | Public company; full ICFR | Compliant; clean 10-K | Q1 FY2026 (annual) | Q1 FY2027 |
| PCI-DSS | Level 1 merchant | Compliant; no material findings | November 2025 | November 2026 |
| GDPR | UK customers (~2% revenue) | Compliant via standardized DSR program | Q4 FY2025 | Q4 FY2026 |
| CCPA / CPRA | California operations | Full compliance program | Q1 FY2026 | Quarterly review |
| State privacy patchwork (16 states) | Multi-state | Managed via OneTrust | Quarterly | Quarterly |
| State sales tax | 41 states + remote-seller | Compliant via Avalara | Real-time | Quarterly review |
| FCRA | Apex co-branded credit card | Synchrony compliance (issuer) | Annual | Annual |
| CAN-SPAM / CASL / Canadian provincial | Marketing | Compliant via Klaviyo + manual review | Quarterly | Quarterly |
| California Prop 65 | Home/lifestyle product labeling | Compliant | Annual | Annual |
| ESG / Sustainability | Public reporting | TCFD-aligned reporting | Annual (April 2026 published) | Annual |

## 2. Audit findings — last 24 months

### Annual external audit (Deloitte) — March 2026

- 10-K filed clean
- ICFR effective; no material weaknesses
- Two SOX deficiencies noted as remediated from prior year (segregation of duties in T&E approval workflow; period-end revenue cutoff for in-store transactions)

### PCI-DSS Assessment (BBE Coalfire) — November 2025

- Level 1 merchant assessment completed
- No material findings within PCI scope
- Out-of-PCI-scope finding: **Klaviyo handles email Confidential data but is not on the approved-systems list for Confidential data**. This is a general policy compliance gap, not a PCI breach. Remediation plan in flight (target Q2 FY2026 close).
- ASV scans clean

### Internal audit — Q3 FY2025

- Reviewed: vendor management, third-party risk
- 3 findings, all rated medium:
  1. Vendor risk reassessment cadence inconsistent across vendor portfolio (remediation: VRM platform rollout — completed Q4 FY2025)
  2. Documentation gap on offboarded employees' system access reviews (remediation: Workday-Okta workflow improvement — completed Q4 FY2025)
  3. Shadow IT inventory incomplete (remediation: in flight — see shadow_it.csv)

### Regulatory inquiries

- February 2026: state attorney general inquiry on a single CCPA DSR fulfillment case. Resolved with documented response; no enforcement action.
- November 2025: FTC inquiry on dark-pattern claims in retail subscriptions (industry-wide letter; not Apex-specific). Apex provided documentation; no follow-up.

## 3. Privacy program artifacts

### Customer data inventory

- Customer data inventory documented and reviewed quarterly
- Data classification map published; 92% of in-scope systems classified
- Klaviyo classification gap (see above) is the active issue

### Consent management

- OneTrust handles consent at customer point
- 340K Do-Not-Sell requests processed FY2025
- DSR fulfillment SLA: 30 days; current performance 98%

### Data Processing Agreements (DPAs)

- DPAs in place with all top 25 vendors handling customer PII
- DPA template updated 2025 with state privacy law requirements
- Gap: 4 smaller vendors with stale DPAs; remediation in vendor risk program

### International data transfers

- UK transfers: SCCs in place
- No EU operations beyond UK
- No data transfer to high-risk jurisdictions

## 4. Security program artifacts

### Control framework

- NIST CSF aligned
- ISO 27001 not certified (cost-benefit deferred); aligned in practice
- SOC 2 Type II — not Apex's; Apex requires of vendors

### Critical control attestations

- Privileged access reviews: 94% completed within 90 days (target 98%)
- Vulnerability patching: 87% of critical vulns within 14 days (target 95%)
- Backup and recovery: tested quarterly; last test passed February 2026
- Incident response: tabletop exercises quarterly; last exercise February 2026

### Penetration testing

- External pen test — annual; last completed October 2025; no critical findings
- Internal pen test — annual; last completed November 2025; 3 medium findings, all remediated

### Third-party risk maturity

- Vendor risk questionnaire required for all new vendors
- Annual reassessment for tier-1 vendors (top 50 by spend)
- VRM platform deployed Q4 FY2025
- Concentration risk monitoring in place; no single vendor >10% of total IT spend

## 5. AI-specific governance

### AI Governance Council

- Established September 2025
- Chaired by GC; secretariat in AI/ET function
- Monthly meeting cadence
- Decision authority: tier-2 AI use cases (pre-deployment review)
- Escalation path: Risk Committee of the Board

### AI policy framework

- AI Acceptable Use Policy published October 2025
- AI Tool Approval Process: required before any new AI tool use
- AI Vendor Evaluation Criteria: explicit data-use restrictions, model evaluation requirements
- AI in Employment (NY Local Law 144): assessment in progress; current position is no AI use in hiring/screening/evaluation

### AI use case inventory

- 7 AI use cases in production
- 11 AI use cases in pilot
- 4 AI use cases reviewed and rejected (including 2 vendor demos in 2025)
- Quarterly review with AI Governance Council

## 6. Pending regulatory developments

### Federal AI legislation (APRA / federal AI rule)

- Monitoring; preparation for potential federal preemption
- Currently no specific Apex action required
- Watch-list

### FTC AI rulemaking

- Potential applicability to recommendation systems and pricing AI
- Apex currently does not deploy pricing AI (explicit Council policy)
- Recommendation AI deferred since PERS-2024 kill
- Watch-list

### New York Local Law 144 (AI in employment)

- Applies to AI used in hiring decisions
- Apex assessment: not currently using such AI; if any HR vendor introduces AI features (Workday AI), pre-deployment review required
- Active monitoring

### Connecticut, Colorado, Delaware AI laws

- Watching state-level AI legislation
- OneTrust monitoring updates

## 7. Known compliance gaps and remediation status

| Gap | Severity | Owner | Remediation target | Status |
|---|---|---|---|---|
| Klaviyo classification gap | High | Sarah Whitfield + Priya Iyer | 2026-06-30 | In flight |
| Otter.ai DPA gap | Medium | Sarah Whitfield | 2026-06-30 | In flight |
| Stale DPAs (4 small vendors) | Low | Nathan Kohl | 2026-09-30 | Scheduled |
| Documentation gap on AI tool inventory (formal completeness) | Low | Elena Fischer | 2026-06-30 | In flight |
| NY Local Law 144 readiness assessment | Low | Rebecca Singh + Thomas Brennan | 2026-06-30 | In flight |

## 8. Compliance KPIs

| Metric | Current | Target | Trend |
|---|---|---|---|
| DSR response within 30 days | 98% | 99% | Stable |
| MTTR security incidents | 42 min | 30 min | Stable |
| Vendor risk reassessments completed on schedule | 91% | 100% | Improving |
| Privileged access reviews on schedule | 94% | 98% | Improving |
| Vulnerability patching within SLA | 87% | 95% | Improving |
| AI use case inventory accuracy | Estimate 90% | 100% | In progress |

---

**Document metadata:**

- Source basis: `tenant_authored`
- Confidence: 0.94
- Last reviewed: 2026-04-22 (Rebecca Singh + Sarah Whitfield)
- Next review: Quarterly (2026-07-22)
- Access: GC office + CISO + senior IT + Audit Committee
