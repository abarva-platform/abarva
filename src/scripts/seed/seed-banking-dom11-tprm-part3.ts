// seed-banking-dom11-tprm-part3.ts
// Banking genome patterns — Third-Party & Vendor Risk Management (TPRM) Part 3
// Code range: B3220–B3279  (60 patterns)
// Loaded by: scripts/corpus/load-authored-genome-seeds.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface PatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
  subTopic?: string;
}

export const BANKING_DOM11_TPRM_PART3_PATTERNS: PatternSeed[] = [

  // ── Ongoing Monitoring ────────────────────────────────────────────────────
  {
    code: 'B3220',
    name: 'Continuous Vendor Risk Monitoring Relies Solely on Annual Questionnaire Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's ongoing monitoring programme for Tier-1 critical vendors depends entirely on an annual security questionnaire and a point-in-time SOC 2 report review, with no interim automated monitoring of vendor financial health signals, adverse news feeds, or cybersecurity incident disclosures between annual review cycles. OCC Bulletin 2023-17 requires ongoing monitoring that is proportional to risk tier and responsive to material changes in a vendor's risk profile — not merely periodic reviews conducted on a calendar schedule; a vendor financial distress event or material breach occurring between annual questionnaire cycles would not trigger any escalation or enhanced oversight under the current programme design. The 12-month gap between monitoring touchpoints is structurally inconsistent with the bank's own consent order commitments and exposes First Capital to OCC Matter Requiring Attention citation during examination.`,
    keywords: ['OCC Bulletin 2023-17', 'ongoing monitoring', 'vendor risk questionnaire', 'TPRM', 'critical vendor'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3221',
    name: 'Vendor Financial Health Monitoring Absent — No Triggers Defined for Distress Signals',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital does not monitor the financial condition of critical-activity vendors between contract renewal cycles; there are no defined early-warning triggers — such as credit rating downgrades, missed earnings guidance, executive departures, or regulatory enforcement disclosures — that would escalate a vendor relationship to enhanced oversight status under the TPRM programme. OCC Bulletin 2023-17 requires that banks assess the ongoing viability of critical vendors throughout the contract lifecycle, not only at origination; a core banking platform vendor experiencing financial distress may reduce R&D investment, delay security patches, or enter insolvency without triggering any change in First Capital's oversight posture under the current monitoring design.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor financial health', 'ongoing monitoring', 'TPRM', 'early warning'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3222',
    name: 'Adverse News Monitoring Not Integrated Into Vendor Risk Tier Review Process',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's vendor risk management system does not ingest adverse news feeds, regulatory enforcement actions, or material litigation disclosures for critical vendors; a vendor receiving an OCC enforcement action, FTC consent order, or material class-action settlement would not automatically trigger a risk tier re-assessment or enhanced oversight activation under the current TPRM programme. OCC Bulletin 2023-17 and the FFIEC IT Examination Handbook require banks to monitor publicly available information about vendors as a component of ongoing risk management; the absence of automated adverse news screening means the TPRM committee reviews annual questionnaire responses while remaining operationally blind to material vendor risk events disclosed publicly in the interim period.`,
    keywords: ['OCC Bulletin 2023-17', 'adverse news monitoring', 'vendor risk tier', 'FFIEC IT Handbook', 'TPRM'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3223',
    name: 'SLA Performance Monitoring Data Not Reviewed by TPRM Committee — Ops and Risk Siloed',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's vendor operations teams collect SLA performance data from critical vendors monthly but do not route that data to the TPRM committee or risk function; persistent SLA misses that indicate operational degradation — elevated error rates, increasing API latency, or growing support ticket backlogs — are addressed by the sourcing team through bilateral vendor communications without triggering the risk escalation pathway defined in the bank's TPRM policy. OCC Bulletin 2023-17 requires that ongoing monitoring results feed directly into the bank's risk management decision-making; the silo between operational performance data and the TPRM oversight function means the committee cannot assess whether pattern-of-miss SLA performance constitutes a material change in the vendor's risk profile warranting a tier escalation or enhanced oversight activation.`,
    keywords: ['OCC Bulletin 2023-17', 'SLA monitoring', 'TPRM committee', 'vendor performance', 'ongoing monitoring'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3224',
    name: 'Cybersecurity Incident Disclosure Monitoring Not Linked to Contractual Notification Obligations',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's vendor contracts require critical vendors to notify the bank of material cybersecurity incidents within 72 hours, but the TPRM programme does not monitor CISA Known Exploited Vulnerabilities, vendor public incident disclosures, or FS-ISAC threat intelligence feeds to detect incidents that vendors may delay or fail to report within the contractual notification window. OCC Bulletin 2023-17 and the OCC's cybersecurity incident notification rule require banks to maintain awareness of vendor security incidents; relying exclusively on vendor self-reporting means First Capital may remain unaware of a material compromise affecting bank customer data or critical processing functions for days or weeks after public disclosure, violating both the contractual SLA and the bank's own incident response obligations.`,
    keywords: ['OCC Bulletin 2023-17', 'incident notification', 'CISA KEV', 'FS-ISAC', 'cybersecurity monitoring'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3225',
    name: 'Periodic Re-Scoping of Vendor Risk Tier Not Triggered by Material Contract Changes',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM programme assigns risk tiers to vendors at contract origination and does not automatically re-scope tier assignments when contract amendments add new services, expand data access, or extend a vendor's scope into critical-activity functions that were not in scope at initial assessment. OCC Bulletin 2023-17 requires that material changes to a third-party relationship trigger a re-assessment proportional to the change in risk profile; a vendor initially assessed as Tier 2 (significant) that subsequently receives a contract amendment granting it access to customer PII, BSA/AML transaction data, or model infrastructure remains classified as Tier 2 indefinitely under the bank's current re-tiering policy, creating a systematic under-oversight gap for scope-expanded vendor relationships.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor risk tier', 'contract amendment', 'TPRM', 'scope expansion'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3226',
    name: 'Penetration Testing Results From Critical Vendors Not Reviewed as Part of Ongoing Oversight',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's critical-activity vendor contracts require annual penetration tests and vulnerability assessments but do not include a provision requiring vendors to share test results or remediation status with the bank; the TPRM programme treats the existence of a contractual penetration testing requirement as sufficient oversight without obtaining evidence that the tests are performed, the scope covers bank-relevant environments, or material findings are remediated on schedule. OCC Bulletin 2023-17 requires that ongoing monitoring for critical vendors include review of relevant security assessment results; a vendor with persistent unpatched critical-severity findings from its penetration test programme represents a materially elevated risk that remains invisible to First Capital's oversight function under the current monitoring design.`,
    keywords: ['OCC Bulletin 2023-17', 'penetration testing', 'vendor security assessment', 'TPRM', 'ongoing monitoring'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3227',
    name: 'Vendor Subcontractor Change Notifications Not Monitored — Fourth-Party Profile Becomes Stale',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's critical vendor contracts require advance notification of material subcontractor changes but the TPRM programme has no process for tracking whether notifications are received, reviewing the risk profile of newly introduced subcontractors, or updating the fourth-party risk map when changes occur. OCC Bulletin 2023-17 requires ongoing monitoring of significant fourth-party relationships; without a process to receive, review, and respond to subcontractor change notifications, the bank's fourth-party risk map becomes stale within months of a vendor's routine subcontractor rotation, and the TPRM committee's fourth-party risk assessment is based on an inventory that may not reflect the actual subcontractor ecosystem serving First Capital's processing environment.`,
    keywords: ['OCC Bulletin 2023-17', 'subcontractor change', 'fourth-party risk', 'TPRM', 'ongoing monitoring'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3228',
    name: 'Regulatory Examination Findings at Critical Vendors Not Incorporated Into Oversight Posture',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital does not monitor regulatory examination outcomes or consent orders issued to critical banking technology vendors; a vendor receiving an OCC or FDIC enforcement action related to security controls, operational resilience, or BSA/AML compliance would not automatically prompt a TPRM escalation or enhanced oversight review under the bank's current monitoring procedures. OCC Bulletin 2023-17 requires that banks consider publicly available information about vendor regulatory standing as an input to ongoing risk management; a fintech or core banking vendor subject to a regulatory consent order continues to be treated as a standard oversight relationship, creating a systematic blind spot for the precise category of vendor risk that the bank is most exposed to through its reliance on that vendor's regulated activities.`,
    keywords: ['OCC Bulletin 2023-17', 'regulatory enforcement', 'consent order', 'TPRM', 'vendor oversight'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3229',
    name: 'Vendor Concentration Dashboard Not Refreshed After Core System Migrations — Stale Risk View',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      `First Capital's TPRM concentration risk dashboard, which the TPRM committee uses for quarterly risk reviews, has not been updated since the bank migrated its payment processing and fraud detection functions to new vendors 11 months ago; the dashboard still reflects the pre-migration vendor inventory and understates the concentration in the bank's new primary payment processor by approximately 30 percentage points. OCC Bulletin 2023-17 requires that ongoing monitoring reflect the current state of third-party relationships; presenting the TPRM committee with a concentration risk view that is materially inconsistent with the bank's actual vendor portfolio renders the quarterly oversight review structurally ineffective and creates a documentation record that contradicts the bank's real risk posture.`,
    keywords: ['OCC Bulletin 2023-17', 'concentration risk dashboard', 'vendor inventory', 'TPRM', 'ongoing monitoring'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3230',
    name: 'Key Person Dependency at Critical Vendor Not Tracked — TPRM Programme Misses Talent Risk',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      `First Capital's TPRM ongoing monitoring framework does not track key person dependencies at critical vendors — specifically, whether the vendor's service delivery capability depends on a small number of named engineers, architects, or compliance officers whose departure could materially impair the vendor's performance of critical bank functions. OCC Bulletin 2023-17 requires banks to assess operational risk factors that affect a vendor's ability to continue performing contractual obligations; several of First Capital's smaller fintech and analytics vendor relationships are effectively staffed by teams of fewer than five specialists where a single departure could delay project delivery, security patching, or regulatory reporting support, but this concentration of talent risk is not captured or monitored in the TPRM programme.`,
    keywords: ['OCC Bulletin 2023-17', 'key person risk', 'vendor talent concentration', 'TPRM', 'ongoing monitoring'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3231',
    name: 'Automated Monitoring Tooling Not Deployed for High-Volume Transaction Processor Relationships',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's TPRM programme relies on manual monitoring processes for its highest-volume transaction processor relationships — ACH origination, card network connectivity, and FedNow gateway — despite the real-time nature of payment processing risks that these vendors present; there is no automated monitoring of transaction error rates, settlement timing anomalies, or API availability metrics that would provide an intraday signal of vendor service degradation. OCC Bulletin 2023-17 requires ongoing monitoring proportional to risk; for critical-activity vendors processing millions of daily transactions, manual quarterly review cycles are structurally inadequate and OCC examiners have noted that banks with real-time payment exposures are expected to implement automated monitoring commensurate with the transaction velocity of the relationship.`,
    keywords: ['OCC Bulletin 2023-17', 'automated monitoring', 'transaction processor', 'FedNow', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },

  // ── Exit and Termination Management ──────────────────────────────────────
  {
    code: 'B3232',
    name: 'Vendor Exit Plans Documented but Never Tested — No Simulation or Tabletop Exercise Performed',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital has documented exit plans for six critical-activity vendors as required by OCC Bulletin 2023-17, but none of these plans have been tested through tabletop exercises, partial simulations, or data portability dry runs; the exit plans describe a sequential transition process premised on a 12-month orderly wind-down that has never been stress-tested against scenarios involving involuntary termination, vendor insolvency, or a regulatory-ordered exit within a compressed timeframe. OCC examiners reviewing the bank's TPRM programme under the consent order have flagged untested exit plans as a Matters Requiring Attention item, noting that an exit plan that has never been exercised cannot be relied upon as evidence of operational resilience for critical vendor relationships.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor exit plan', 'tabletop exercise', 'TPRM', 'operational resilience'],
    demoRelevant: true,
    subTopic: 'exit-termination',
  },
  {
    code: 'B3233',
    name: 'Data Return Obligations Not Defined in Vendor Contracts — Exit Creates Data Recovery Gap',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's critical vendor contracts do not specify the format, timeline, or completeness standards for data return obligations at contract termination; when a data analytics vendor was offboarded in the prior fiscal year, the bank recovered only 62% of the historical analytical dataset because there was no contractual requirement for the vendor to return data in a machine-readable format within a defined timeframe. OCC Bulletin 2023-17 requires that termination and exit provisions address data ownership and return obligations proportional to the data the vendor holds; without contractual data return specifications, the bank's exit from a data-intensive vendor relationship is structurally dependent on the vendor's cooperation and technical capacity, neither of which can be enforced without a binding contractual obligation.`,
    keywords: ['OCC Bulletin 2023-17', 'data return obligations', 'vendor termination', 'TPRM', 'exit strategy'],
    demoRelevant: true,
    subTopic: 'exit-termination',
  },
  {
    code: 'B3234',
    name: 'Parallel Processing Capacity Not Reserved for Vendor Transition Period — Exit Blackout Risk',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's vendor exit plans for core processing relationships assume a sequential cutover from the incumbent vendor to the replacement, without reserving parallel processing capacity to run both vendors simultaneously during the transition validation period; this design means any data integrity or performance discrepancy discovered during transition cutover cannot be resolved by reverting to the incumbent without a service disruption gap. OCC Bulletin 2023-17 and FFIEC business continuity guidance require that exit strategies include mechanisms to maintain continuity of critical services during transitions; the sequential cutover design creates a window during which core banking, payments, or fraud detection functions cannot be reversed if the replacement vendor's performance is inadequate, exposing the bank to a period of potential regulatory non-compliance.`,
    keywords: ['OCC Bulletin 2023-17', 'parallel processing', 'vendor transition', 'FFIEC Business Continuity Handbook', 'TPRM'],
    subTopic: 'exit-termination',
  },
  {
    code: 'B3235',
    name: 'Involuntary Termination Trigger Criteria Not Defined in Critical Vendor Contracts',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's critical vendor contracts define standard termination-for-breach provisions but do not define specific involuntary termination triggers for the failure scenarios that OCC Bulletin 2023-17 identifies as requiring immediate exit capability — including vendor insolvency, criminal investigation, regulatory licence revocation, or a material cybersecurity breach affecting bank data. Without defined involuntary termination triggers linked to specific evidence standards, the bank's ability to terminate a critical vendor relationship in a crisis scenario depends on legal interpretation of general breach clauses rather than pre-negotiated, operationally actionable termination rights that the TPRM programme can execute without extensive legal review under time pressure.`,
    keywords: ['OCC Bulletin 2023-17', 'involuntary termination', 'vendor contract', 'TPRM', 'exit rights'],
    subTopic: 'exit-termination',
  },
  {
    code: 'B3236',
    name: 'Replacement Vendor Not Identified for Core Banking Platform — Exit Plan Is Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's documented exit plan for its core banking platform vendor names "alternative provider identification" as the first step of the exit process rather than a pre-identified replacement, meaning the plan is actually a placeholder that defers the most critical and time-consuming element of the exit to the crisis period when the need arises. OCC Bulletin 2023-17 requires that exit plans for critical-activity vendors be operationally credible and not merely aspirational; an exit plan that begins with identifying a replacement after the crisis event has occurred does not satisfy the OCC's requirement for a tested exit capability, and OCC examiners have characterised this design pattern as a documentation exercise rather than genuine exit readiness.`,
    keywords: ['OCC Bulletin 2023-17', 'exit readiness', 'core banking replacement', 'TPRM', 'vendor continuity'],
    demoRelevant: true,
    subTopic: 'exit-termination',
  },
  {
    code: 'B3237',
    name: 'Regulatory Notification Requirements for Material Vendor Exits Not Mapped in Exit Plan',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's vendor exit plans address operational transition steps but do not map the regulatory notification obligations that apply when a critical-activity vendor relationship is terminated — including OCC advance notice requirements for changes in significant third-party relationships and FFIEC guidance on reporting material operational disruptions. An unplanned exit from a core banking or payment processing vendor that triggers customer-impacting disruption could simultaneously require OCC notification, BSA/AML function continuity attestation, and Reg E compliance maintenance — obligations that are not addressed in the exit plan and would need to be identified and executed under crisis conditions without prior preparation.`,
    keywords: ['OCC Bulletin 2023-17', 'regulatory notification', 'vendor exit', 'TPRM', 'FFIEC'],
    subTopic: 'exit-termination',
  },
  {
    code: 'B3238',
    name: 'Intellectual Property Repatriation Rights Not Negotiated at Contract Origination',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's contracts with technology implementation vendors do not include explicit intellectual property repatriation rights for custom integrations, configuration scripts, and proprietary data models developed during the vendor engagement; at the conclusion of two recent vendor relationships, the bank was unable to recover the implementation artefacts needed to operate or extend the deployed systems with a replacement vendor. OCC Bulletin 2023-17 requires exit provisions to address the bank's ability to continue operations after a vendor relationship ends; failure to negotiate IP repatriation rights at contract origination systematically increases the bank's switching cost and operational dependency, undermining the credibility of exit plans that assume the bank can seamlessly migrate to a replacement vendor.`,
    keywords: ['OCC Bulletin 2023-17', 'intellectual property', 'vendor exit', 'TPRM', 'switching cost'],
    subTopic: 'exit-termination',
  },
  {
    code: 'B3239',
    name: 'Staff Knowledge Transfer Requirements Absent From Vendor Transition Plans',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's exit and transition plans for critical processing vendors do not include requirements for the incumbent vendor to provide structured knowledge transfer to the bank's internal team or the replacement vendor during the transition period; previous vendor offboarding exercises revealed that undocumented operational procedures, tribal knowledge about edge-case transaction processing, and vendor-specific troubleshooting methods were lost when vendor staff disengaged, creating a post-transition operational gap. OCC Bulletin 2023-17 requires exit plans to address the bank's ability to maintain service continuity; without contractual knowledge transfer obligations, the bank's operational capability post-transition depends on institutional memory that the incumbent vendor's team holds and has no obligation to transfer.`,
    keywords: ['OCC Bulletin 2023-17', 'knowledge transfer', 'vendor transition', 'TPRM', 'exit readiness'],
    subTopic: 'exit-termination',
  },
  {
    code: 'B3240',
    name: 'Post-Termination Data Destruction Verification Not Required — Orphaned Data Risk',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's vendor contracts require data deletion after termination but do not require vendors to provide a certification of destruction with evidence — such as a witness-signed deletion log, a third-party attestation, or a NIST SP 800-88 sanitisation report — confirming that all bank customer data, transaction records, and model artefacts have been securely destroyed across all vendor storage environments including backups and archival copies. GLBA Safeguards Rule and OCC Bulletin 2023-17 require that data handling obligations extend through and beyond contract termination; without a destruction certification requirement, First Capital cannot confirm that customer data held by offboarded vendors has been disposed of in compliance with GLBA's data disposal requirements, creating a latent regulatory exposure that grows with each vendor offboarding.`,
    keywords: ['OCC Bulletin 2023-17', 'data destruction', 'GLBA Safeguards Rule', 'TPRM', 'vendor termination'],
    subTopic: 'exit-termination',
  },
  {
    code: 'B3241',
    name: 'Exit Cost Estimates in Board Risk Reporting Significantly Below Actual Transition Costs',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's TPRM board reporting includes illustrative exit cost estimates for critical vendors that are based on initial implementation project costs from the original vendor procurement, rather than current market replacement costs that account for data migration complexity, parallel running periods, staff training, and system integration re-work; when compared against actual exit costs incurred during a recent Tier-2 vendor offboarding, the board's reported estimates understated true exit costs by approximately 220%. OCC Bulletin 2023-17 requires that exit planning include a realistic assessment of transition costs; board risk reporting that systematically understates exit costs creates a false impression of exit feasibility that may distort the board's risk appetite assessments and investment decisions for vendor relationship management.`,
    keywords: ['OCC Bulletin 2023-17', 'exit cost estimate', 'board risk reporting', 'TPRM', 'vendor transition'],
    demoRelevant: true,
    subTopic: 'exit-termination',
  },

  // ── Fourth-Party Risk ─────────────────────────────────────────────────────
  {
    code: 'B3242',
    name: 'Fourth-Party Inventory Incomplete — Critical Vendor Subcontractor Map Never Compiled',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital has not compiled a comprehensive inventory of the subcontractors used by its critical-activity vendors to perform the services contracted with the bank; the bank's TPRM programme tracks direct vendor relationships but has no fourth-party visibility into the cloud infrastructure providers, security operations centre vendors, data center operators, or software component suppliers that underpin the critical vendors' service delivery capability. OCC Bulletin 2023-17 requires banks to understand the significant subcontractor relationships that support critical vendor services; without a fourth-party inventory, the TPRM committee cannot assess whether the bank's concentration risk analysis is capturing the true distribution of risk across the vendor ecosystem or whether multiple critical vendors share a common subcontractor dependency that creates a hidden single point of failure.`,
    keywords: ['OCC Bulletin 2023-17', 'fourth-party risk', 'subcontractor inventory', 'TPRM', 'concentration risk'],
    demoRelevant: true,
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3243',
    name: 'Nth-Party Risk Cascade Not Modelled — Shared Subcontractor Between Two Critical Vendors Identified',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's risk analysis has identified that two of its critical-activity vendors — the core banking platform provider and the primary fraud detection vendor — both rely on the same managed SOC service provider as a subcontractor, creating an nth-party concentration risk that would impair both critical services simultaneously in the event of that shared subcontractor experiencing a disruption; this correlated failure risk has been documented but not incorporated into the bank's concentration risk assessment or business continuity planning. OCC Bulletin 2023-17 requires that banks assess fourth-party risk with sufficient depth to identify correlated failure scenarios; a shared subcontractor between two simultaneously critical vendors represents exactly the type of concentration scenario the guidance is designed to surface, and the bank's failure to model the cascade scenario leaves the TPRM committee's risk quantification structurally incomplete.`,
    keywords: ['OCC Bulletin 2023-17', 'nth-party risk', 'shared subcontractor', 'TPRM', 'correlated failure'],
    demoRelevant: true,
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3244',
    name: 'BSA/AML Transaction Monitoring Vendor Uses Offshore Data Sub-Processor Not Disclosed to OCC',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's BSA/AML transaction monitoring vendor processes suspicious activity pattern analysis using an offshore data science subcontractor whose access to Bank Secrecy Act-sensitive transaction data was not disclosed to the OCC as a material change in the bank's BSA/AML programme. FinCEN's BSA/AML examination manual and OCC Bulletin 2023-17's fourth-party guidance require banks to understand and manage the data handling practices of subcontractors involved in AML-sensitive workflows; an undisclosed offshore subcontractor with access to SAR-adjacent transaction data represents a potential BSA programme integrity issue and a fourth-party risk disclosure gap that OCC examiners have specifically cited in recent compliance examinations of banks using AI-powered AML vendors.`,
    keywords: ['OCC Bulletin 2023-17', 'BSA/AML', 'offshore sub-processor', 'FinCEN', 'fourth-party risk'],
    demoRelevant: true,
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3245',
    name: 'Critical Vendor Uses Open-Source Components With Unpatched CVEs — Fourth-Party Software Supply Chain',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking platform vendor incorporates open-source software components — including cryptographic libraries, API frameworks, and data serialisation utilities — for which the vendor has not provided a software bill of materials or evidence that known critical-severity CVEs are patched within the bank's contractually required remediation timeframe. OCC Bulletin 2023-17 and FFIEC cybersecurity guidance require banks to manage supply chain risk in critical vendor software; the bank cannot assess whether its core processing environment contains unpatched critical vulnerabilities without a vendor-provided SBOM, and the absence of an SBOM requirement in the contract means the bank has no contractual mechanism to compel vendor remediation of open-source CVEs that may affect bank processing functions.`,
    keywords: ['OCC Bulletin 2023-17', 'software supply chain', 'SBOM', 'CVE', 'fourth-party risk'],
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3246',
    name: 'Payment Network Operator as Implicit Fourth Party — NACHA Rules Compliance Not Verified',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's ACH origination vendor connects to the Federal Reserve's ACH operator and The Clearing House as network operators that function as fourth parties in the bank's ACH processing chain; the TPRM programme does not include these network operators in the fourth-party risk inventory and the bank has not verified whether its ACH origination vendor's connection to these operators complies with NACHA Operating Rules' technical specifications and security requirements for Receiving Depository Financial Institutions. A NACHA Rules compliance gap at the network connectivity layer — such as an insecure file transmission protocol or non-compliant return processing workflow — would expose First Capital to NACHA sanction as the Originating Depository Financial Institution regardless of where in the processing chain the non-compliance originates.`,
    keywords: ['NACHA Operating Rules', 'ACH operator', 'fourth-party risk', 'OCC Bulletin 2023-17', 'TPRM'],
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3247',
    name: 'Fourth-Party Concentration in a Single Data Center Operator Not Captured in BCP',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's three most critical vendors — core banking, card processing, and document management — all use the same third-party data center colocation operator for their primary production environments, creating a fourth-party geographic and operational concentration that is not captured in the bank's business continuity plan or TPRM concentration risk assessment. FFIEC Business Continuity Management Handbook and OCC Bulletin 2023-17 require that banks assess fourth-party dependencies in continuity planning; a single prolonged data center disruption — fire suppression activation, power failure, or physical security incident — would simultaneously impair all three critical vendor services, a scenario that the bank's BCP does not address because it was designed without fourth-party visibility into the vendor hosting infrastructure.`,
    keywords: ['OCC Bulletin 2023-17', 'data center concentration', 'FFIEC Business Continuity Handbook', 'fourth-party risk', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3248',
    name: 'Vendor API Dependency on Third-Party Data Aggregator Introduces Unassessed Fourth-Party Risk',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's credit decisioning vendor uses a third-party data aggregation service to enrich its underwriting models with alternative data signals; this aggregation service processes bank customer financial data and credit bureau outputs and functions as a fourth party in the bank's credit decisioning chain but has never been assessed by the TPRM programme. OCC Bulletin 2023-17 requires banks to understand significant subcontractor relationships in critical vendor chains; a data aggregator with access to bank customer alternative data is subject to FCRA, GLBA, and CFPB data broker oversight, and the vendor's use of this service without disclosure to First Capital means the bank cannot verify whether the data aggregator's practices comply with applicable consumer data regulations that the bank, as the credit decision-maker, is responsible for ensuring are met.`,
    keywords: ['OCC Bulletin 2023-17', 'data aggregator', 'FCRA', 'CFPB', 'fourth-party risk'],
    subTopic: 'fourth-party-risk',
  },
  {
    code: 'B3249',
    name: 'Foreign Jurisdiction Data Transfer by Fourth-Party Subcontractor Not Assessed Against GLBA',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's primary document management vendor uses an offshore document processing subcontractor in a jurisdiction without an adequacy decision from U.S. regulatory bodies, and this fourth-party data transfer has not been assessed by the TPRM programme against GLBA Safeguards Rule data handling requirements or the OCC's expectations for cross-border data transfers in third-party arrangements. OCC Bulletin 2023-17 requires banks to manage data privacy and security risks in fourth-party relationships; customer mortgage application documents, account statements, and tax records processed by an offshore subcontractor without contractual GLBA-equivalent data protection obligations represent a material data governance risk that the bank's TPRM programme has not identified because the fourth-party inventory does not extend to the document management vendor's subcontractor chain.`,
    keywords: ['OCC Bulletin 2023-17', 'GLBA Safeguards Rule', 'cross-border data transfer', 'fourth-party risk', 'TPRM'],
    subTopic: 'fourth-party-risk',
  },

  // ── AI in TPRM ────────────────────────────────────────────────────────────
  {
    code: 'B3250',
    name: 'AI-Powered Vendor Risk Scoring Tool Not Validated Under SR 11-7 — Model Risk Blind Spot',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital has deployed an AI vendor risk scoring platform that uses machine learning to assign risk scores to third-party relationships based on financial health signals, cybersecurity incident data, and adverse news feeds; the model drives tiering decisions that determine oversight frequency and resource allocation for 340 vendor relationships but has never been subject to model validation under SR 11-7's requirements for conceptual soundness, outcome analysis, and ongoing performance monitoring. SR 11-7 requires model validation for any quantitative tool that materially influences business decisions, and the OCC's TPRM examination guidance has specifically flagged AI-powered vendor scoring tools as subject to model risk management requirements; using an unvalidated AI model to make risk-tiering decisions that affect the intensity of third-party oversight exposes the bank to a systematic model error that could simultaneously under-tier or over-tier large cohorts of vendor relationships.`,
    keywords: ['SR 11-7', 'AI vendor risk scoring', 'model validation', 'OCC Bulletin 2023-17', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3251',
    name: 'Generative AI Contract Review Tool Used in TPRM Due Diligence Without Hallucination Controls',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's legal and procurement teams use a commercial generative AI contract review tool to identify gaps in vendor agreement language against OCC Bulletin 2023-17's required contractual provisions, but the tool has not been validated for accuracy on banking regulatory contract requirements and produces outputs that the TPRM team treats as definitive without attorney review. OCC Bulletin 2023-17 and OCC guidance on AI governance require that AI tools used in material risk management processes be subject to appropriate controls; a generative AI tool that produces legally actionable contract gap analyses without validated accuracy on banking-specific regulatory language creates a systematic risk that missing OCC 2023-17-required contract provisions are incorrectly flagged as present, or present provisions are incorrectly flagged as missing, resulting in miscalibrated TPRM oversight coverage.`,
    keywords: ['OCC Bulletin 2023-17', 'generative AI contract review', 'hallucination risk', 'AI governance', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3252',
    name: 'AI-Augmented Vendor Questionnaire Analysis Tool Introduces Systematic Bias in Risk Tier Assignment',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital uses an AI natural language processing tool to summarise and score vendor security questionnaire responses, reducing the analyst review time per questionnaire from four hours to 45 minutes; the tool was trained on a dataset that over-represents large enterprise vendors and systematically assigns lower risk scores to vendors whose questionnaire language matches the training set's enterprise security terminology, regardless of the actual control effectiveness described. SR 11-7's requirements for model conceptual soundness apply to NLP tools used in risk management decisions; the systematic scoring bias favours large vendor responses while potentially under-scoring smaller fintech vendors with equally strong controls but different terminology, creating a risk tier assignment pattern that does not reflect actual vendor risk and has never been validated for bias by the bank's model risk function.`,
    keywords: ['SR 11-7', 'NLP questionnaire analysis', 'AI bias', 'vendor risk scoring', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3253',
    name: 'Vendor AI Model Procurement Due Diligence Lacks OCC-Required Model Risk Provisions',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital procures AI-powered solutions from fintech vendors for credit decisioning, fraud detection, and customer communication personalisation without requiring vendors to disclose the model architecture, training data governance, and model drift monitoring practices that SR 11-7 and OCC guidance on AI governance require the bank to understand for models that materially affect bank decisions or customer outcomes. OCC Bulletin 2023-17's requirements for critical-activity vendor contracts must be read in conjunction with SR 11-7 when the vendor delivers AI model-based services; without contractual provisions requiring model documentation disclosure, ongoing drift monitoring reports, and model change notification, the bank cannot fulfil its model risk management obligations for AI capabilities it has outsourced to vendors.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI model procurement', 'model risk management', 'vendor AI governance'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3254',
    name: 'AML Graph AI Vendor Subcontractor Uses Unlicensed Transaction Data for Model Training',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's AML graph AI vendor, which analyses transaction networks to surface suspicious activity patterns for SAR filing review, uses a data science subcontractor that trains model updates on a pooled dataset combining transaction data from multiple bank clients without obtaining explicit contractual consent from each client bank or conducting an assessment of whether the pooled training data creates BSA/AML confidentiality obligations. FinCEN's SAR confidentiality requirements and GLBA restrict the sharing and use of transaction data that could reveal BSA/AML enforcement interest; the AML graph AI vendor's use of First Capital's transaction data in a multi-bank pooled training dataset represents both a fourth-party data governance risk and a potential BSA confidentiality violation that the bank's TPRM programme has not assessed because the training data practices are not disclosed in the vendor's standard contractual documentation.`,
    keywords: ['FinCEN', 'BSA/AML', 'AML graph AI', 'model training data', 'fourth-party risk'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3255',
    name: 'AI-Powered Customer Communication Vendor Lacks CFPB Fair Communication Oversight Provisions',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital uses a generative AI vendor to personalise collection communications, deposit product cross-sell messaging, and delinquency outreach to customers; the vendor's AI model autonomously generates customer-facing language without a mechanism for First Capital to review, approve, or audit the generated content for compliance with UDAP, FDCPA, and CFPB fair communication standards. OCC Bulletin 2023-17 requires that banks retain oversight and control over all customer-facing functions performed by vendors, including AI-generated communications; a generative AI vendor that creates regulatory-risk communications without bank content oversight and approval creates a systematic UDAP and CFPB examination risk that the bank cannot detect or remediate without embedding AI output review controls into the vendor oversight programme.`,
    keywords: ['OCC Bulletin 2023-17', 'generative AI communications', 'UDAP', 'CFPB', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3256',
    name: 'Fraud Detection AI Vendor Model Drift Not Monitored — Increasing False Positive Rate Undetected',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's fraud detection AI vendor provides a SaaS model that analyses real-time card and ACH transactions; the bank's TPRM programme monitors the vendor's SLA uptime metrics but does not track model performance metrics — specifically the false positive rate for fraud alerts, which has increased from 4.2% to 9.8% over the past 18 months as the vendor's model has drifted from its training distribution without a disclosed retraining event. SR 11-7's requirements for ongoing model performance monitoring apply to outsourced AI models that materially affect bank decisions; the TPRM programme's absence of model drift monitoring means a systematic deterioration in fraud detection accuracy — generating excess customer friction, declining genuine fraud capture rates, and increasing Reg E provisional credit costs — is invisible to the bank's risk oversight function.`,
    keywords: ['SR 11-7', 'fraud detection AI', 'model drift', 'OCC Bulletin 2023-17', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3257',
    name: 'Credit Scoring AI Vendor Does Not Provide Adverse Action Explainability — ECOA Risk',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's consumer credit origination platform uses an AI credit scoring vendor whose model produces a numerical credit score but does not generate the specific adverse action reason codes required by ECOA and Regulation B when a credit application is declined or offered on less favourable terms; the bank's compliance team has implemented a post-hoc reason code assignment process that maps score ranges to generic reason codes, but this mapping was not validated against the actual model output and CFPB examiners have flagged it as inconsistent with Regulation B's requirement that adverse action notices accurately describe the principal reasons for the action taken. OCC Bulletin 2023-17 requires that vendor-delivered AI capabilities meet the bank's full regulatory compliance obligations; an AI credit scoring model that cannot generate Regulation B-compliant adverse action reasons represents a systemic ECOA enforcement risk.`,
    keywords: ['OCC Bulletin 2023-17', 'AI credit scoring', 'ECOA', 'Regulation B', 'adverse action'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3258',
    name: 'AI Underwriting Vendor Demographic Proxy Detection Not Performed — HMDA Fair Lending Risk',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's mortgage AI underwriting vendor uses alternative data features — rental payment history, utility payment regularity, and device usage patterns — that have not been subjected to demographic proxy detection analysis to confirm they do not serve as proxies for race, national origin, or other ECOA-protected characteristics under the disparate impact theory the CFPB applies in fair lending examinations. OCC Bulletin 2023-17 requires banks to maintain fair lending compliance oversight over vendor-delivered AI capabilities; CFPB and DOJ have pursued fair lending enforcement actions against banks using AI models with unvalidated alternative data features, and the TPRM programme's failure to require demographic proxy analysis as a vendor contract condition leaves First Capital exposed to an HMDA examination finding that the bank cannot remediate without vendor cooperation.`,
    keywords: ['OCC Bulletin 2023-17', 'AI underwriting', 'HMDA', 'fair lending', 'CFPB disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3259',
    name: 'AI Deposit Retention Model Vendor Lacks SR 11-7 Documentation — MRM Inventory Gap',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's deposit retention AI model, which predicts customer attrition risk and triggers personalised outreach campaigns, was procured from a vendor and deployed into production without being added to the bank's SR 11-7 model inventory or receiving the model validation review required for models that materially influence customer relationship management decisions. SR 11-7 requires that all models meeting the regulatory definition — quantitative methods that apply statistical, economic, or mathematical techniques to produce outputs that guide business decisions — be inventoried and validated, regardless of whether they are developed internally or procured from a vendor; the TPRM programme has not established a process for identifying and inventorying vendor-delivered AI models, creating a growing backlog of unvalidated vendor models operating in the bank's production environment.`,
    keywords: ['SR 11-7', 'model inventory', 'deposit retention AI', 'OCC Bulletin 2023-17', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3260',
    name: 'Vendor AI Tool Accessing Customer Data for Model Improvement Without Explicit Opt-Out Mechanism',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's contract with a customer analytics AI vendor includes a standard clause permitting the vendor to use anonymised customer interaction data to improve its AI models; the bank has not assessed whether this clause is consistent with GLBA's data sharing restrictions, the bank's privacy policy disclosures, or the vendor's characterisation of the data as "anonymised" — which relies on the vendor's own re-identification risk assessment that has never been reviewed by the bank's privacy officer. OCC Bulletin 2023-17 requires banks to understand how vendors use bank data; CFPB supervisory guidance and state privacy laws increasingly require explicit opt-out mechanisms for commercial use of customer data, and the standard vendor AI improvement clause may represent a GLBA and state privacy compliance gap that the TPRM programme has not assessed.`,
    keywords: ['OCC Bulletin 2023-17', 'GLBA', 'AI model improvement', 'customer data use', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3261',
    name: 'AI Chatbot Vendor Deployed in Customer Service Without Reg E Compliance Review',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital deployed a vendor-provided generative AI chatbot to handle customer inquiries about account balances, transaction disputes, and debit card error resolution; the chatbot was deployed without a legal and compliance review of whether its dispute intake workflow meets Reg E's substantive requirements for error resolution investigations, particularly the requirement to conduct a good-faith investigation of each reported error and not rely on automated responses that dismiss disputes without the required investigation steps. OCC Bulletin 2023-17 requires banks to maintain oversight of consumer-facing vendor-delivered capabilities; a generative AI chatbot that handles Reg E-triggering dispute inquiries without validated compliance with the error resolution requirements creates systemic Reg E enforcement risk that scales with the volume of disputes the chatbot handles.`,
    keywords: ['OCC Bulletin 2023-17', 'AI chatbot', 'Reg E', 'dispute resolution', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3262',
    name: 'AI Loan Modification Recommendation Vendor Not Mapped to Consumer Financial Protection Obligations',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital uses an AI-powered loan modification recommendation tool from a vendor to generate workout plan options for delinquent borrowers; the vendor's model has not been assessed for consistency with the bank's obligations under the CFPB's Loss Mitigation Rules, RESPA servicing requirements, and OCC guidance on distressed borrower treatment, and there is no process for the bank's default servicing team to override AI-generated recommendations that may not reflect the bank's regulatory obligations to explore all available loss mitigation options before proceeding to foreclosure. OCC Bulletin 2023-17 requires vendor-delivered AI capabilities to be subject to the bank's full regulatory compliance programme; a loan modification AI that does not reflect the regulatory obligation to evaluate all available loss mitigation options creates a systematic RESPA and CFPB enforcement exposure.`,
    keywords: ['OCC Bulletin 2023-17', 'AI loan modification', 'RESPA', 'CFPB Loss Mitigation Rules', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3263',
    name: 'AI Pricing Personalisation Vendor Not Assessed for Price Discrimination Risk Under ECOA',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital uses an AI personalised pricing vendor to dynamically set deposit interest rates, overdraft fee structures, and loan pricing offers based on individual customer behavioural and financial profiles; the pricing model has not been assessed for whether its personalisation features — which include purchase category data, digital engagement scores, and relationship tenure — function as ECOA-protected characteristic proxies and generate pricing disparities across demographic groups. OCC Bulletin 2023-17 requires banks to maintain fair lending oversight for vendor-delivered capabilities; CFPB has explicitly identified AI-powered personalised pricing as a fair lending examination priority for 2025–2026, and the bank's TPRM programme does not require vendors delivering pricing AI to submit to demographic proxy testing or disparate impact analysis before deployment.`,
    keywords: ['OCC Bulletin 2023-17', 'AI personalised pricing', 'ECOA', 'CFPB', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3264',
    name: 'AI Identity Verification Vendor Demographic Accuracy Disparity — CRA and Fair Access Risk',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital uses an AI biometric identity verification vendor in its digital account opening workflow; the vendor's identity verification model has a documented 12 percentage point higher false rejection rate for customers with darker skin tones compared to lighter skin tones — a disparity published in the vendor's own bias audit report that First Capital's TPRM programme has not incorporated into the vendor risk assessment. OCC Bulletin 2023-17 requires banks to understand the risk characteristics of vendor-delivered capabilities; a biometric AI with documented demographic accuracy disparity creates CRA, fair access, and CFPB risk when applied to account opening decisions — the higher rejection rate for minority applicants may constitute a discriminatory barrier to bank access that triggers examination scrutiny under OCC's fair access guidance.`,
    keywords: ['OCC Bulletin 2023-17', 'AI biometric identity', 'CRA', 'fair access', 'algorithmic bias'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3265',
    name: 'Large Language Model Vendor Contract Lacks AI Output Accuracy and Indemnification Provisions',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital has deployed a large language model API from a commercial AI vendor for internal compliance policy summarisation, regulatory change impact analysis, and exam preparation support; the vendor agreement does not include representations about output accuracy, hallucination rates, or indemnification provisions for regulatory or legal harm caused by reliance on AI-generated compliance summaries. OCC Bulletin 2023-17 requires that vendor contracts allocate risk appropriately for the services delivered; LLM output hallucinations in regulatory compliance contexts — where an AI-generated summary incorrectly characterises an OCC examination requirement — creates a direct risk that compliance staff act on inaccurate regulatory guidance, and the absence of contractual accuracy representations or indemnification means the bank bears this risk without contractual recourse.`,
    keywords: ['OCC Bulletin 2023-17', 'large language model', 'AI hallucination', 'compliance risk', 'vendor indemnification'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3266',
    name: 'AI Vendor Explainability Gap — Regulatory Examiner Cannot Reconstruct Decision Rationale',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AI credit risk, fraud detection, and AML surveillance vendors produce model outputs — scores, alerts, and risk classifications — that are not accompanied by feature-level explanations allowing OCC examiners to understand the primary factors driving individual decisions; during the most recent OCC examination, examiners requested decision audit trails for 12 flagged credit and fraud decisions and the bank could not produce vendor-supplied explanations that would allow the examiner to evaluate whether the model's decision rationale was consistent with ECOA, BSA/AML, and fair lending requirements. OCC guidance on AI governance and SR 11-7 require that models used in regulatory-sensitive decisions produce outputs that regulators can audit; vendors that do not provide explainability at the individual decision level create a systematic regulatory auditability gap for the bank's most consequential AI-assisted decisions.`,
    keywords: ['SR 11-7', 'AI explainability', 'OCC examination', 'model auditability', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },
  {
    code: 'B3267',
    name: 'AI TPRM Platform Vendor Itself Not Subject to TPRM Oversight — Governance Circular Gap',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital uses a SaaS AI-powered TPRM platform as the primary system of record for its entire third-party risk management programme — the platform manages vendor inventory, risk tier assignments, contract tracking, and monitoring workflows; this vendor has never been subjected to the same TPRM due diligence, risk tier assessment, or ongoing monitoring that it is used to manage for all other vendors. OCC Bulletin 2023-17 requires that all critical-activity vendors be subject to appropriate risk management; a TPRM platform that functions as the operational backbone of the bank's entire vendor oversight programme is itself a critical-activity vendor whose compromise, outage, or service failure would impair the bank's ability to demonstrate an effective TPRM programme to OCC examiners — the circular absence of oversight for the TPRM platform itself is a structural governance gap.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM platform', 'AI vendor oversight', 'circular governance gap', 'critical vendor'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part3',
  },

  // ── Critical Vendor Governance ─────────────────────────────────────────────
  {
    code: 'B3268',
    name: 'Critical Vendor Board Reporting Lacks Aggregated Risk Exposure View — Siloed Relationship Reports',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's board-level TPRM reporting presents individual vendor relationship status updates rather than an aggregated risk exposure view that would allow the board to assess whether the bank's total critical vendor risk profile is within risk appetite; the absence of an aggregated view means the board cannot evaluate whether multiple concurrent vendor risk elevations — for example, three critical vendors simultaneously showing financial stress indicators — collectively represent a material enterprise risk event. OCC Bulletin 2023-17 requires that boards and senior management receive TPRM reporting that enables risk-based oversight decisions; board reporting that presents individual vendor status without aggregation or portfolio-level risk quantification does not satisfy this requirement and was specifically cited as a deficiency in the bank's most recent OCC examination.`,
    keywords: ['OCC Bulletin 2023-17', 'board TPRM reporting', 'aggregated risk exposure', 'critical vendor', 'TPRM'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3269',
    name: 'TPRM Governance Charter Not Updated Since Consent Order — Roles and Responsibilities Stale',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's TPRM governance charter, which defines the roles and responsibilities of the TPRM committee, business line risk owners, vendor owners, and the independent risk function, was last updated 27 months ago and does not reflect the new structures, reporting lines, and oversight requirements established in the bank's consent order with the OCC; the charter continues to assign TPRM ownership responsibilities to positions that no longer exist in the bank's current organisational structure and omits the enhanced documentation and escalation requirements that the consent order requires. Operating a TPRM programme against a governance charter that is inconsistent with the bank's current organisational structure and regulatory commitments creates a systematic accountability gap where no defined party owns the monitoring, escalation, and reporting obligations the consent order requires.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM governance charter', 'consent order', 'accountability', 'TPRM'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3270',
    name: 'Business Line Vendor Owners Lack TPRM Training — Risk Decisions Made Without Policy Knowledge',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's TPRM policy designates business line relationship managers as vendor owners responsible for day-to-day oversight of critical vendor relationships, but these individuals have not received formal TPRM training and are not familiar with the bank's escalation triggers, monitoring requirements, or documentation standards that OCC Bulletin 2023-17 and the consent order require to be maintained at the vendor relationship level. OCC Bulletin 2023-17 requires banks to ensure that personnel responsible for third-party risk management have the knowledge and skills to execute oversight responsibilities effectively; business line vendor owners who make risk decisions — such as accepting a vendor's SLA miss or approving a contract amendment without TPRM committee review — without understanding the regulatory standards for those decisions create a systematic documentation and process compliance gap across the bank's entire critical vendor portfolio.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM training', 'vendor owner', 'consent order', 'TPRM'],
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3271',
    name: 'Critical Vendor Contract Renewal Automated Without Risk Re-Assessment — Rolling Renewals Bypass TPRM',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's vendor contract management system automatically renews vendor contracts on their anniversary date for agreements with auto-renewal clauses; 14 critical-activity vendor contracts have renewed automatically over the past three years without triggering a TPRM risk re-assessment, updated due diligence review, or contract terms refresh against OCC Bulletin 2023-17's required contractual provisions. OCC Bulletin 2023-17 requires that contract renewals be treated as new or updated third-party arrangements that trigger appropriate pre-contract due diligence; automatic renewal of critical vendor contracts without TPRM committee review allows outdated risk assessments and contract terms to persist indefinitely, systematically degrading the quality of the bank's TPRM programme for its most important vendor relationships.`,
    keywords: ['OCC Bulletin 2023-17', 'contract auto-renewal', 'vendor due diligence', 'TPRM', 'critical vendor'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3272',
    name: 'Vendor Relationship Escalation Matrix Not Defined — Risk Events Have No Defined Response Path',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's TPRM programme identifies risk events that require escalation — including vendor SLA breaches, cybersecurity incidents, financial distress signals, and regulatory enforcement actions — but does not define an escalation matrix specifying who is notified, within what timeframe, and what actions are required at each escalation level; risk events that are identified by vendor owners are therefore resolved bilaterally with the vendor without formal TPRM programme documentation, review, or oversight committee awareness. OCC Bulletin 2023-17 requires that third-party risk management programmes include defined escalation procedures that ensure material risk events reach the appropriate governance levels; the absence of a defined escalation matrix means the TPRM committee is structurally unaware of material vendor risk events that are handled at the business line level without documentation.`,
    keywords: ['OCC Bulletin 2023-17', 'escalation matrix', 'vendor risk event', 'TPRM', 'governance'],
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3273',
    name: 'Critical Vendor Resilience Testing Not Coordinated With Bank BCP — Untested Joint Recovery',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital conducts annual business continuity testing that assumes critical vendors will be available to support recovery, and its critical vendors conduct their own continuity tests independently; there has been no joint continuity exercise where First Capital and its critical vendors simultaneously simulate a disruption scenario, test the coordination and communication procedures in the vendor agreements, and validate that the bank's recovery procedures can be successfully executed with the vendor's recovery timeline. FFIEC Business Continuity Management Handbook and OCC Bulletin 2023-17 both recommend joint testing with critical service providers; the absence of any joint testing means neither the bank nor its critical vendors has validated their joint recovery capability, and the bank's BCP relies on vendor recovery assumptions that have never been tested in a coordinated exercise.`,
    keywords: ['OCC Bulletin 2023-17', 'joint BCP testing', 'FFIEC Business Continuity Handbook', 'vendor resilience', 'TPRM'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3274',
    name: 'Independent Risk Function Does Not Independently Validate TPRM Programme — First Line Self-Assessment Only',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's TPRM programme operates within the first line of defense — the risk team reports to the Chief Operating Officer rather than the Chief Risk Officer — and the independent risk function does not conduct independent validation or challenge of the TPRM programme's risk assessments, vendor tier assignments, or monitoring results; all quality assurance over the TPRM programme is performed by the same team responsible for executing it. OCC Bulletin 2023-17 requires banks to establish independent oversight of third-party risk management as part of a sound three-lines-of-defense model; a TPRM programme that reviews and validates its own risk assessments without independent challenge creates a structural conflict of interest where the incentive to classify vendors at lower risk tiers — reducing workload for the TPRM team — is not independently checked.`,
    keywords: ['OCC Bulletin 2023-17', 'three lines of defense', 'TPRM independence', 'independent risk function', 'governance'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3275',
    name: 'Vendor Concentration Limits Not Set in Risk Appetite Statement — No Quantitative Governance Boundary',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's risk appetite statement defines qualitative principles for vendor concentration — the bank should avoid "over-reliance on any single vendor" — but does not define quantitative limits on the percentage of critical processing volume, revenue, or data exposure that any single vendor is permitted to represent; without quantitative concentration limits, the TPRM committee has no governance mechanism to prevent progressive concentration accumulation as business lines route incrementally more volume to preferred vendors. OCC Bulletin 2023-17 requires that vendor risk governance be integrated into the bank's risk appetite framework; quantitative vendor concentration limits are a standard governance practice in large banks and their absence from First Capital's risk appetite statement means no committee member has authority to reject a business proposal that would increase critical vendor concentration beyond any defined threshold.`,
    keywords: ['OCC Bulletin 2023-17', 'risk appetite', 'vendor concentration limits', 'TPRM', 'governance'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3276',
    name: 'TPRM Audit Frequency Does Not Reflect Risk Tier Differentiation — Flat Review Cadence',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM audit programme reviews all vendor relationships on the same 18-month cycle regardless of risk tier, meaning critical-activity Tier-1 vendors that process core banking transactions receive the same audit frequency as Tier-3 general vendors that provide office supplies; OCC Bulletin 2023-17 explicitly requires that oversight activities be commensurate with the level of risk and complexity of the third-party relationship, with critical-activity vendors receiving more frequent and intensive oversight. An 18-month audit cycle for critical-activity vendors — particularly those involved in payment processing, BSA/AML, and model risk infrastructure — is inconsistent with the ongoing monitoring requirements of OCC 2023-17 and has been cited as a TPRM programme weakness in peer bank examinations where the OCC has specified that critical-activity vendors should receive quarterly or more frequent structured oversight touchpoints.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM audit frequency', 'risk-tiered oversight', 'critical vendor', 'TPRM'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3277',
    name: 'Vendor Contract Inventory Not Reconciled Against Active Processing Relationships — Shadow Vendors',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's TPRM vendor inventory lists 127 active vendor contracts under management, but a network traffic analysis conducted during a recent security assessment identified 19 external technology service connections — including SaaS productivity tools, analytics platforms, and developer API services — that are not in the TPRM inventory and have never been subject to vendor due diligence, risk tier assignment, or contract review. OCC Bulletin 2023-17 requires that banks maintain a comprehensive inventory of all significant third-party relationships; shadow vendor relationships that are absent from the TPRM programme bypass all the oversight, data protection review, and concentration risk assessment processes that OCC 2023-17 requires, and may include relationships that would be classified as critical-activity if they were assessed.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor inventory', 'shadow vendors', 'TPRM', 'vendor governance'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3278',
    name: 'TPRM Policy Ownership Gap — No Accountable Senior Officer for Cross-Business TPRM Programme',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's TPRM policy names the TPRM Committee as the governance body accountable for the bank's third-party risk management programme but does not designate a named senior officer — such as a Chief Risk Officer, Chief Procurement Officer, or designated Third-Party Risk Officer — as the individual accountable for the programme's overall effectiveness and regulatory compliance. OCC Bulletin 2023-17 and Federal Reserve SR 13-19 require clearly defined accountability for TPRM programme governance at the senior management level; committee-level accountability diffuses responsibility so that no individual is accountable when OCC examiners identify programme deficiencies, and the bank's consent order commitments on TPRM enhancement cannot be tracked to a named individual who bears accountability for their completion.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM accountability', 'senior officer', 'programme ownership', 'governance'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },
  {
    code: 'B3279',
    name: 'Critical Vendor Inventory Excludes Intragroup Entities — Affiliate Relationships Outside TPRM Scope',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital receives core technology services — data center hosting, network management, and information security operations — from affiliated entities within its bank holding company structure; these intragroup service relationships are excluded from the TPRM programme on the basis that they are "internal" to the corporate group, despite OCC Bulletin 2023-17 and Federal Reserve supervisory guidance explicitly stating that affiliate service relationships are subject to the same third-party risk management standards as external vendor relationships when they involve the delivery of critical-activity functions to the bank. The exclusion of affiliate service relationships from TPRM oversight means that the bank's most operationally significant infrastructure dependencies — which present the same operational resilience, exit planning, and oversight requirements as external vendors — are governed by intragroup service agreements that have never been reviewed against OCC 2023-17's required contractual provisions.`,
    keywords: ['OCC Bulletin 2023-17', 'affiliate services', 'intragroup TPRM', 'Federal Reserve SR 13-19', 'vendor governance'],
    demoRelevant: true,
    subTopic: 'critical-vendor-governance',
  },

];
