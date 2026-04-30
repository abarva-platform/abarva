# Meridian Health System — Enterprise Profile

**Tenant key:** `meridian-health`  
**Last updated:** 2026-04-25  
**Reviewed by:** Dr. Anita Krishnamurthy, CDIO; Rebecca Hollings, General Counsel  
**Data classification:** Internal

## At-a-glance

| Field | Value |
|---|---|
| Legal name | Meridian Health System |
| Ownership type | Not-for-profit 501(c)(3) integrated delivery network with for-profit subsidiaries |
| Headquarters | Sacramento, California |
| Founded | 1968; current holding-company structure formed 2011 |
| Annual revenue | $16.8B FY2025 |
| Employees | 58,000 |
| Employed physicians | 7,400 |
| Staffed beds | 5,800 |
| Hospitals | 30 across California, Nevada, Oregon, Hawaii |
| Ambulatory footprint | 280 clinics, urgent care centers, ASCs, and specialty sites |
| Annual ambulatory visits | 14.0M |
| Covered lives | 1.4M in Meridian Health Plans |
| Fiscal year | July 1 - June 30 |
| Current dataset date | April 2026 |

## Legal entity structure

Meridian Health System is the parent not-for-profit corporation. The system includes a network of hospital operating entities, Meridian Medical Foundation for employed physicians and ambulatory clinics, Meridian Health Plans LLC for plan operations, and Meridian Properties LLC for owned real estate and medical-office assets. The plan subsidiary operates Medicare Advantage, Medicaid managed care, and commercial products under state insurance and CMS oversight.

Recent M&A activity matters operationally. Meridian acquired Pacific Queens Medical Center in Honolulu and Kona Coast Hospital on Hawaii Island during the 2022-2023 expansion cycle. Pacific Queens migrated to Epic in 2024; Kona Coast remains on Cerner Millennium after capital allocation pressure and local clinical leadership resistance paused the second-wave migration.

## Industry classification

| Area | NAICS / regulatory frame |
|---|---|
| General medical and surgical hospitals | NAICS 622110 |
| Ambulatory health care services | NAICS 621498 / 621111 |
| Health and medical insurance carriers | NAICS 524114 |
| Pharmacy and outpatient dispensing | NAICS 446110 / 621399 |
| Medicare Advantage plan operations | CMS Medicare Advantage Program, 42 CFR Part 422 |
| HIPAA covered entity operations | 45 CFR Parts 160, 162, and 164 |

## FY2025 financial snapshot

| Metric | FY2025 actual | Commentary |
|---|---:|---|
| Total revenue | $16.8B | Provider operations plus plan premiums |
| Provider operations revenue | $11.8B | Hospital, ambulatory, employed physician, pharmacy, ancillary |
| Health plan premium revenue | $5.0B | Medicare Advantage, Medicaid managed care, commercial |
| Risk-based / value-based revenue | ~$5.0B | Roughly 30% of total system revenue |
| Operating margin | 2.4% | Compressed 80bp YoY from labor and MA rate pressure |
| Capital plan | $1.1B | Epic optimization, facilities, cybersecurity, selective AI |
| IT operating + capital budget | $384M | Approximately 2.3% of revenue |

The system is not distressed, but the margin story is tight enough that every transformation program now has an explicit attribution burden. The CFO's office is applying a sharper lens than it did before DENIALS-2024.

## Strategic priorities — FY2026

1. **Operating margin recovery.** Labor cost reduction, denial recovery, throughput improvement, and service-line margin discipline.
2. **Health plan growth.** Medicare Advantage retention and acquisition, with close attention to quality bonus performance and network adequacy.
3. **Value-based care performance.** Quality measures, total cost of care, gap closure, and population health execution.
4. **AI governance and capability formalization.** Board-mandated governance after Q3 FY2025 AI risk policy.
5. **Hawaii market integration completion.** Still listed as a strategic priority, but current funding is deferred to FY2027.

## Active transformation portfolio

- `meridian-ambient-2026` — Ambient Clinical Documentation Rollout
- `meridian-prior-auth-2026` — Prior Authorization Automation
- `meridian-ai-governance-2026` — Clinical AI Governance Uplift
- `meridian-rcm-modernization-2026` — RCM Modernization

## Regulatory posture

Meridian's compliance environment spans provider, plan, clinical AI, data privacy, accreditation, and state licensing. Core frameworks include HIPAA Privacy, Security, Breach Notification, and Administrative Simplification under 45 CFR Parts 160, 162, and 164; HITECH Act obligations; CMS Conditions of Participation; Joint Commission hospital accreditation; FDA oversight considerations for software as a medical device and clinical decision support; CMS Medicare Advantage oversight under 42 CFR Part 422; state DOI oversight in California, Nevada, Oregon, and Hawaii; HEDIS / NCQA reporting; MA STAR ratings; ACA marketplace certification; PCI-DSS for payment flows; and CCPA/CPRA for California patient/member data subject rights.

## Data classification policy

| Classification | Healthcare examples | Sharing posture |
|---|---|---|
| Public | Community benefit report, accreditation status, public regulatory filings | External use permitted |
| Internal | Operational dashboards, de-identified aggregate performance | Internal use permitted |
| Confidential | Vendor contracts, plan-provider data-sharing artifacts, quality workpapers | Need-to-know; provider/plan boundary noted |
| Restricted | PHI, clinical notes, member claims with identifiers, model input/output containing patient facts | Minimum necessary; BAA and audit controls required |

## Risk appetite statement

Meridian is conservative on patient safety, clinical AI, regulated plan operations, and PHI handling. It is moderate on operational AI in revenue cycle and workforce workflows when human review remains in place. It is comparatively aggressive on population health analytics because provider-plan integration is one of the system's strategic advantages.

## ESG and community posture

Meridian reports annual community benefit, charity care, behavioral-health access investments, and environmental sustainability commitments. Workforce diversity goals are board-visible, but nursing vacancy and traveler reliance make workforce outcomes more complicated than the annual report suggests.

## Recent context — April 2026

Dr. Anita Krishnamurthy joined as CDIO in October 2025 from Optum Care, replacing the post-DENIALS-2024 leadership gap left by Dr. Aiden Walsh. FY2025 operating margin compressed by 80bp due to nursing wage inflation, traveler dependence, and Medicare Advantage rate pressure. The board issued a Q3 FY2025 AI risk policy requiring clinical AI governance attestation. Q4 FY2025 denial rates spiked, making RCM modernization politically unavoidable. Hawaii integration remains paused despite being named as a strategic priority. This is the tension that defines Meridian's current data room: the organization has mature clinical data, an unusually strategic plan business, and enough scar tissue to make every new AI claim earn its right to proceed.
