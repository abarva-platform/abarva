// seed-banking-dom11-tprm-part1.ts
// Banking genome patterns — Third-Party & Vendor Risk Management (TPRM)
// Code range: B3100–B3159  (60 patterns)
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

export const BANKING_TPRM_PART1_PATTERNS: PatternSeed[] = [

  // ── Vendor Concentration ──────────────────────────────────────────────────
  {
    code: 'B3100',
    name: 'Core Banking Vendor Single-Source Dependency Without OCC 2023-17 Exit Plan',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's entire deposit, loan, and general ledger processing runs on a single core banking platform vendor without a documented exit strategy, tested data portability procedure, or alternative provider identified — a configuration that OCC Bulletin 2023-17 explicitly classifies as a critical-activity third-party relationship requiring enhanced oversight. The absence of a tested exit plan means that any disruption to the vendor's financial stability, service capacity, or contractual relationship would leave the bank without a transition pathway, and OCC examiners reviewing the bank's third-party risk management program under the consent order have cited the core platform concentration as a Matters Requiring Attention item. OCC 2023-17 requires ongoing monitoring of the vendor's financial health, operational resilience, and subcontractor dependency map, none of which are documented in First Capital's current TPRM governance structure.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor concentration', 'core banking', 'exit strategy', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3101',
    name: 'Cloud Provider Geographic Concentration Unassessed Against OCC 2023-17 Thresholds',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital hosts its digital banking platform, fraud detection system, and model risk infrastructure exclusively in a single hyperscaler's US-East availability zones without a multi-region failover configuration or a documented geographic concentration risk assessment as required by OCC Bulletin 2023-17's guidance on cloud-based third-party concentration risk. OCC 2023-17 specifies that banks must assess whether concentration in a single cloud provider creates operational resilience gaps that would prevent the bank from meeting its obligations to customers and regulators under a prolonged regional cloud outage; the bank has performed no formal assessment and the digital banking SLA does not include contractual remedies for availability failures caused by the cloud provider's own infrastructure events. A US-East regional outage during a peak transaction period could impair online account access, real-time payments processing, and fraud alert workflows simultaneously.`,
    keywords: ['OCC Bulletin 2023-17', 'cloud concentration', 'geographic concentration', 'operational resilience', 'TPRM'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3102',
    name: 'Fintech Payment Processing Vendor Provides 80% of ACH Origination Capacity',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital routes 80% of its ACH origination volume through a single fintech payment processor following a vendor consolidation initiative that achieved per-transaction cost savings but created a concentration in a critical payment function that OCC Bulletin 2023-17 classifies as requiring heightened third-party oversight. The concentration exposes First Capital to Reg E and NACHA compliance liability if the vendor's processing outage causes ACH returns to miss the NACHA return timeframe window, with the bank bearing the regulatory and customer remediation cost. The vendor has not provided evidence of NACHA Operating Rules compliance certification in the current contract cycle, and the bank's TPRM committee has not reviewed the relationship's risk tier since the consolidation was completed.`,
    keywords: ['OCC Bulletin 2023-17', 'ACH origination', 'NACHA', 'vendor concentration', 'Reg E'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3103',
    name: 'Core Banking Vendor Financial Stability Not Monitored — No Early Warning Triggers Defined',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's TPRM program does not include defined financial health monitoring triggers for its core banking platform vendor — no credit rating downgrade threshold, no annual report review cadence, and no escalation protocol if the vendor reports material losses or restructuring activity. OCC Bulletin 2023-17 and OCC Bulletin 2013-29 require banks to conduct ongoing monitoring of critical third parties' financial condition, including reviewing annual financial statements, monitoring for ratings downgrades, and incorporating financial stability indicators into the TPRM committee's periodic review. The vendor was acquired by a private equity firm 18 months ago, and the leveraged buyout has materially increased its debt load, but First Capital's TPRM team has not updated the vendor's risk assessment or escalated the ownership change to the board's risk committee.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'vendor financial stability', 'TPRM', 'concentration risk'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3104',
    name: 'Fourth-Party Subcontractor to Core Vendor Operating in Sanctioned Jurisdiction',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's core banking platform vendor subcontracts data center management and 24/7 operations support to a managed services firm with offshore support centers, one of which is located in a jurisdiction subject to OFAC sectoral sanctions; First Capital's TPRM program does not require the vendor to disclose fourth-party subcontractors at the data center operations level. OCC Bulletin 2023-17 explicitly addresses fourth-party risk and requires banks to ensure that their critical third-party vendors have adequate controls over their own subcontractors, including geographic and jurisdictional risk screening; the undisclosed offshore support presence creates a potential OFAC compliance gap that the bank cannot detect because its fourth-party review framework does not extend below the direct vendor tier.`,
    keywords: ['OCC Bulletin 2023-17', 'fourth-party risk', 'OFAC', 'TPRM', 'subcontractor'],
    demoRelevant: true,
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3105',
    name: 'Vendor Portfolio Concentration Assessment Not Aggregated Across Business Lines',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's three major business lines — retail banking, commercial banking, and trust and wealth management — each manage vendor relationships independently with separate TPRM registers, creating a situation where the same underlying technology vendor provides critical services to all three lines without the concentration being visible at the enterprise level. OCC Bulletin 2023-17 requires that banks assess concentration across all third-party relationships at the enterprise level to identify situations where a single vendor failure could simultaneously impair multiple critical functions; the siloed TPRM structure prevents the enterprise risk committee from understanding that a single data services vendor processes loan decisions, wealth management analytics, and trust accounting for 35% of First Capital's revenue-generating activities.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor concentration', 'TPRM', 'enterprise risk', 'OCC Bulletin 2013-29'],
    subTopic: 'vendor-concentration',
  },

  // ── Due Diligence ─────────────────────────────────────────────────────────
  {
    code: 'B3106',
    name: 'Pre-Contract TPRM Questionnaire Depth Insufficient for Critical Activity Classification',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital uses a tiered TPRM questionnaire framework where vendors classified as "Tier 2 — significant" receive a 40-question due diligence questionnaire covering basic cybersecurity, data handling, and business continuity, but the questionnaire does not address subcontractor dependencies, geographic risk, financial stability indicators, or regulatory compliance certifications at the depth required by OCC Bulletin 2023-17 for relationships that could materially impact the bank's operations. Several fintech vendors recently reclassified from Tier 2 to critical-activity status under the bank's annual risk-tiering review had never received a questionnaire appropriate for their actual risk profile, meaning the due diligence record supporting these relationships is structurally inadequate for OCC examination purposes.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM questionnaire', 'due diligence', 'OCC Bulletin 2013-29', 'critical activity'],
    demoRelevant: true,
    subTopic: 'due-diligence',
  },
  {
    code: 'B3107',
    name: 'SOC 2 Type II Gap Analysis Not Performed — User Entity Controls Assumed Without Review',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital collects SOC 2 Type II reports from its technology vendors as part of annual due diligence but does not perform a formal gap analysis to confirm that the user entity controls documented in each report are actually implemented by First Capital's own IT and operations teams. OCC Bulletin 2013-29 and OCC Bulletin 2023-17 require that banks not only obtain SOC reports but also assess whether the bank's complementary user entity controls are in place; when the OCC's examination team reviews three vendors' SOC 2 Type II reports against First Capital's internal control documentation, it finds that user entity controls related to privileged access management and change management are documented in the SOC report as required bank-side controls but are absent from the bank's internal control framework.`,
    keywords: ['SOC 2 Type II', 'OCC Bulletin 2013-29', 'user entity controls', 'TPRM', 'due diligence'],
    demoRelevant: true,
    subTopic: 'due-diligence',
  },
  {
    code: 'B3108',
    name: 'Cybersecurity Maturity Assessment Limited to Questionnaire — No Independent Validation',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's TPRM program assesses vendor cybersecurity maturity through self-reported questionnaire responses aligned with the FFIEC Cybersecurity Assessment Tool, but does not supplement self-reported data with independent validation such as pen test results, third-party security ratings, or point-in-time technical assessments for critical-activity vendors. OCC Bulletin 2023-17 and the FFIEC IT Examination Handbook on third-party risk require that due diligence for critical activity vendors include independent verification of cybersecurity controls rather than reliance on vendor self-attestation alone; two vendors who self-reported "mature" cybersecurity posture subsequently disclosed breach events that internal security ratings services had flagged in their risk intelligence data six months before the vendor's self-reported annual questionnaire response.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'cybersecurity maturity', 'TPRM', 'independent validation'],
    demoRelevant: true,
    subTopic: 'due-diligence',
  },
  {
    code: 'B3109',
    name: 'Subcontractor (Fourth-Party) Visibility Gap — Vendor Refuses to Disclose Full Supply Chain',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's payment technology vendor refuses to disclose its full subcontractor chain beyond the first tier, citing competitive confidentiality, and the bank's contract does not include a provision requiring fourth-party disclosure or a right to request the vendor's own TPRM assessment of its material subcontractors. OCC Bulletin 2023-17 requires banks to obtain sufficient information about subcontracting arrangements to understand and manage the risks they introduce, and FFIEC IT Handbook guidance on third-party risk emphasizes that contracts with critical vendors should include disclosure rights for subcontractors who handle bank data or process transactions. Without this visibility, First Capital cannot assess whether the payment vendor's subcontractors meet BSA/AML, GLBA data security, or data residency requirements applicable to First Capital's customer data.`,
    keywords: ['OCC Bulletin 2023-17', 'fourth-party risk', 'FFIEC IT Handbook', 'GLBA', 'TPRM'],
    subTopic: 'due-diligence',
  },
  {
    code: 'B3110',
    name: 'Fintech Vendor BSA/AML Program Not Assessed Before Digital Lending Partnership',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital enters a digital lending partnership with a fintech firm that originates consumer loans on First Capital's behalf using the bank's charter; the due diligence process does not assess the fintech partner's BSA/AML program, customer identification procedures, or CDD compliance capability, relying instead on the partner's self-attestation that it complies with applicable law. OCC Bulletin 2023-17 and FinCEN's CDD rule require that banks performing BSA/AML activities through third-party partners ensure that the partner's compliance program meets the same standards as the bank's own program; when the OCC examines the digital lending portfolio, it finds that the fintech's CIP process does not meet 31 CFR 1020.220 customer identification requirements, and the bank — as the chartered entity — bears full BSA/AML liability for the deficiency.`,
    keywords: ['OCC Bulletin 2023-17', 'BSA/AML', 'CDD rule', 'fintech partnership', 'TPRM'],
    demoRelevant: true,
    subTopic: 'due-diligence',
  },
  {
    code: 'B3111',
    name: 'GLBA Vendor Data Security Assessment Relies on Expired Certification',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's TPRM program accepts SOC 2 Type II reports and GLBA compliance attestations from vendors without tracking the certification expiration dates or requiring vendors to provide updated certifications when the prior-year report is more than 12 months old; three vendors currently holding Tier 1 critical-activity status have GLBA compliance attestations that are 18–24 months old and have not provided evidence of a current annual assessment. GLBA's Safeguards Rule under 16 CFR Part 314 requires financial institutions to ensure that service providers maintain appropriate safeguards; accepting stale compliance attestations without triggering a renewal request is an FFIEC IT Handbook gap that OCC examiners flag as inadequate ongoing monitoring of third-party GLBA compliance.`,
    keywords: ['GLBA Safeguards Rule', 'SOC 2 Type II', 'FFIEC IT Handbook', 'TPRM', 'data security'],
    demoRelevant: true,
    subTopic: 'due-diligence',
  },

  // ── Contract Management ───────────────────────────────────────────────────
  {
    code: 'B3112',
    name: 'SLA Enforcement Gap — Vendor Performance Breaches Not Triggering Contractual Remedies',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking platform vendor has missed the contractual 99.9% monthly uptime SLA in four of the last six quarters, triggering service credit provisions in the contract, but the bank's vendor management team has not tracked cumulative SLA performance against contract thresholds or claimed the applicable service credits. OCC Bulletin 2023-17 requires that banks actively enforce contract terms and monitor vendor performance against defined SLAs as part of ongoing oversight; the unclaimed credits represent a governance failure that signals to the vendor that SLA misses have no financial consequence, reducing the vendor's incentive to prioritize reliability improvements for First Capital's environment.`,
    keywords: ['OCC Bulletin 2023-17', 'SLA enforcement', 'TPRM', 'contract management', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'contract-management',
  },
  {
    code: 'B3113',
    name: 'Data Portability Exit Clause Absent — Customer Data Trapped at Departing Vendor',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's contract with its digital banking platform vendor does not include a data portability clause specifying the format, timeline, and completeness of customer data delivery at contract termination; when the bank initiates contract renegotiation, the vendor demands a $2.5M data extraction fee and proposes a 14-month data delivery timeline that would prevent any practical transition to an alternative provider. OCC Bulletin 2023-17 requires that contracts for critical-activity vendors include data portability provisions ensuring the bank can recover its data in a usable format within a timeframe consistent with the bank's exit strategy; the absence of this clause is specifically cited in OCC 2023-17 as a gap that creates vendor dependency and impairs the bank's ability to exit.`,
    keywords: ['OCC Bulletin 2023-17', 'data portability', 'exit clause', 'TPRM', 'contract management'],
    demoRelevant: true,
    subTopic: 'contract-management',
  },
  {
    code: 'B3114',
    name: 'Regulatory Audit Rights Clause Insufficient — Vendor Limits Scope to Quarterly Reports Only',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's contract with a critical data analytics vendor grants the bank "access to quarterly performance reports" as the audit rights provision, rather than a right to conduct or commission independent audits of the vendor's controls, data handling practices, and compliance posture. OCC Bulletin 2023-17 requires that contracts with critical third parties include rights for the bank, its regulators, and the OCC itself to examine the vendor's records and controls relevant to the bank's regulated activities; when the OCC notifies First Capital that it intends to review the analytics vendor's operations as part of the bank's safety and soundness examination, the contract does not provide the necessary access authority.`,
    keywords: ['OCC Bulletin 2023-17', 'audit rights', 'TPRM', 'FFIEC IT Handbook', 'contract management'],
    demoRelevant: true,
    subTopic: 'contract-management',
  },
  {
    code: 'B3115',
    name: 'Incident Notification SLA Too Broad — Vendor Has 72 Hours to Report Cyber Incident',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital's vendor contracts specify that vendors must notify the bank of a cybersecurity incident within 72 business hours of discovery, a timeline that is materially inconsistent with the OCC's Computer Security Incident Notification rule (12 CFR Part 53) requiring notification to the OCC within 36 hours of a bank noticing a notification incident. If a critical vendor discovers a breach affecting First Capital's customer data and notifies the bank at the 72-hour contract deadline, the bank will have at most 36 hours to assess the incident, determine OCC notification is required, and file the notification — a sequential process that routinely cannot complete within the remaining window given the bank's current incident response capabilities. OCC Bulletin 2023-17 requires that vendor incident notification timelines be aligned with the bank's regulatory reporting obligations.`,
    keywords: ['OCC Bulletin 2023-17', 'incident notification', '12 CFR Part 53', 'TPRM', 'cybersecurity'],
    demoRelevant: true,
    subTopic: 'contract-management',
  },
  {
    code: 'B3116',
    name: 'Data Residency Compliance Clause Missing — Vendor Processes Data Across Jurisdictions',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's contract with a cloud-based document management vendor does not specify data residency requirements, and the vendor's global infrastructure processes and temporarily stores document data in EU data centers for load-balancing purposes during peak periods. GLBA's Safeguards Rule and OCC Bulletin 2023-17 require that banks ensure service providers maintain data in locations and under conditions consistent with the bank's obligations to customers and regulators; the cross-border processing of NPI without a contractual data residency restriction creates a GLBA Safeguards Rule compliance gap and potential GDPR exposure for EU-resident customers whose data transits EU infrastructure without appropriate data transfer mechanisms.`,
    keywords: ['GLBA Safeguards Rule', 'GDPR', 'OCC Bulletin 2023-17', 'data residency', 'TPRM'],
    subTopic: 'contract-management',
  },
  {
    code: 'B3117',
    name: 'Auto-Renewal Clause in Core System Contract Without TPRM Re-Review Trigger',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's core banking system contract includes an annual auto-renewal clause that activates 180 days before the contract anniversary unless either party provides written notice of non-renewal; the TPRM program does not include a workflow that triggers a formal re-review of the vendor relationship 9–12 months before the renewal decision window, meaning the bank routinely auto-renews contracts for critical vendors without reassessing whether the current terms, pricing, and SLA provisions reflect the bank's current risk appetite and OCC Bulletin 2023-17 requirements. Three critical vendor contracts have auto-renewed in the past 24 months without any documented TPRM review, leaving the bank bound to terms that predate the OCC 2023-17 guidance.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC Bulletin 2023-17', 'auto-renewal', 'TPRM', 'contract management'],
    subTopic: 'contract-management',
  },
  {
    code: 'B3118',
    name: 'Subcontractor Change Notification Clause Not Enforced — Vendor Replaced Key Sub Without Notice',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's contract with its payment processing vendor requires the vendor to notify the bank of material subcontractor changes within 30 days, but the vendor replaced its primary data center operations subcontractor six months ago without notification, and the bank discovered the change only when reviewing the vendor's updated SOC 2 Type II report. OCC Bulletin 2023-17 requires that banks proactively monitor for subcontractor changes that could alter the risk profile of critical-activity relationships, including validating that new subcontractors have been assessed against the same standards as the original; the undisclosed subcontractor change means the bank has no due diligence record for the current data center operator processing its customers' financial transactions.`,
    keywords: ['OCC Bulletin 2023-17', 'subcontractor change', 'SOC 2 Type II', 'TPRM', 'fourth-party risk'],
    demoRelevant: true,
    subTopic: 'contract-management',
  },

  // ── Ongoing Monitoring ────────────────────────────────────────────────────
  {
    code: 'B3119',
    name: 'Annual Review Cadence Applied to All Vendors Regardless of Risk Tier',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's TPRM program applies a uniform annual review cycle to all vendor relationships regardless of risk tier, meaning that critical-activity vendors processing millions of customer transactions daily receive the same monitoring frequency as Tier 3 low-risk vendors providing office supplies or cleaning services. OCC Bulletin 2023-17 requires that monitoring frequency be commensurate with the risk and criticality of the vendor relationship, with critical-activity vendors typically requiring quarterly review of performance metrics and more frequent monitoring of financial health and cybersecurity indicators; the uniform annual cadence leaves the bank without timely information about deteriorating performance or control gaps at its highest-risk vendors between annual review cycles.`,
    keywords: ['OCC Bulletin 2023-17', 'risk tiering', 'TPRM', 'monitoring cadence', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3120',
    name: 'KPI/KRI Dashboard for Vendor Performance Not Updated for 8 Months — Stale Risk Signal',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's vendor risk management platform includes a KPI/KRI dashboard for the top 25 critical vendors that tracks uptime, incident response times, audit finding remediation rates, and financial health indicators; the dashboard has not been refreshed with current vendor data for eight months due to a data integration issue with the vendor management system, meaning the TPRM committee is reviewing stale metrics at its quarterly meetings. OCC Bulletin 2023-17 and OCC Bulletin 2013-29 require ongoing monitoring of third-party performance against defined metrics; a TPRM committee that has approved three quarterly reviews based on an eight-month-old KPI snapshot has not met the ongoing monitoring requirement, and the OCC's examination team notes the data staleness as a systemic TPRM process deficiency.`,
    keywords: ['OCC Bulletin 2013-29', 'KPI/KRI', 'TPRM', 'ongoing monitoring', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3121',
    name: 'TPRM Committee Escalation Thresholds Not Defined — Risk Findings Queue Without Resolution',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's TPRM program documents a process for escalating vendor risk findings to the TPRM committee but does not define quantitative escalation thresholds — no criterion specifying when a vendor finding must be escalated within 5 days versus 30 days versus the next quarterly meeting cycle. OCC Bulletin 2023-17 requires that third-party risk governance include defined escalation triggers that ensure material vendor risk events receive timely management attention; without thresholds, 14 vendor findings categorized as "high" severity have sat in the TPRM issue log for 45–90 days without committee review, including two cybersecurity findings at a critical data vendor that should have been escalated to the CRO within the bank's 10-day SLA.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM committee', 'escalation threshold', 'FFIEC IT Handbook', 'ongoing monitoring'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3122',
    name: 'Vendor Business Continuity Plan Not Tested in Two Years — OCC 2023-17 Requirement Missed',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital collects business continuity plans from its critical-activity vendors annually but has not required vendors to provide evidence of actual BCP testing results — table-top exercises, failover tests, or disaster recovery simulations — in over two years. OCC Bulletin 2023-17 requires that banks assess whether critical vendors can maintain operations and recover from disruptions, which requires evidence of tested recovery capabilities rather than the existence of a documented plan; several critical vendors' BCPs reference recovery time objectives that have never been validated through actual testing, meaning First Capital cannot confirm that the vendor can meet its contractual RTO commitments in a genuine disruption.`,
    keywords: ['OCC Bulletin 2023-17', 'business continuity', 'BCP testing', 'TPRM', 'operational resilience'],
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3123',
    name: 'Vendor Risk Re-Tiering Not Triggered by Business Model or Ownership Change',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM program re-tiers vendors annually through a scheduled risk assessment cycle but does not include event-based re-tiering triggers for material changes such as vendor acquisition, ownership change, core business model pivot, or geographic expansion into new jurisdictions. OCC Bulletin 2023-17 requires that banks' third-party risk management programs be dynamic and responsive to changes in the risk profile of vendor relationships; two critical data vendors have been acquired by private equity firms in the past 18 months without triggering any TPRM re-assessment, meaning the bank continues to manage these relationships under risk profiles that predate the ownership changes that materially altered each vendor's financial leverage and operational priorities.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor risk tiering', 'TPRM', 'OCC Bulletin 2013-29', 'ownership change'],
    subTopic: 'ongoing-monitoring',
  },

  // ── Fintech/AI Vendor ─────────────────────────────────────────────────────
  {
    code: 'B3124',
    name: 'AI/ML Vendor Model Inventory Not Covered by SR 11-7 Governance — OCC Consent Order Gap',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital procures a credit decisioning AI from a fintech vendor whose model specifications, training data, and validation records are proprietary black boxes not subject to independent validation by First Capital's IVU; the vendor's AI model is integrated into the bank's consumer lending origination workflow but is classified as a "vendor tool" rather than a model under SR 11-7, excluding it from the model inventory that the bank's MRM consent order requires to be complete and current. OCC 2011-12 and the SR 11-7 guidance are explicit that the governance framework applies to models regardless of whether they are internally developed or externally provided; a vendor AI that generates quantitative outputs used in credit decisions requires the bank to obtain model documentation, challenge the methodology, and ensure ongoing monitoring of model performance — none of which is possible without contractual access to model internals.`,
    keywords: ['SR 11-7', 'AI vendor model', 'OCC Bulletin 2023-17', 'consent order', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3125',
    name: 'LLM Vendor Data Retention Policy Conflicts With GLBA — Customer NPI in Training Pipeline',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an LLM-powered document summarization tool from a technology vendor that processes customer financial documents including tax returns, bank statements, and credit applications as part of the summarization workflow; the vendor's standard terms permit retention of processed documents for model improvement for up to 24 months and do not exclude customer NPI from the training data pipeline. GLBA's Safeguards Rule under 16 CFR Part 314 and the OCC's data security guidance require banks to ensure that service providers maintain adequate safeguards for NPI; permitting a vendor to retain and potentially use NPI in model training without a GLBA-compliant data processing agreement and explicit NPI exclusion from training pipelines constitutes a Safeguards Rule violation that the bank has not detected because the vendor's data handling terms are embedded in the click-through SaaS agreement rather than the bank's negotiated vendor contract.`,
    keywords: ['GLBA Safeguards Rule', 'LLM vendor', 'OCC Bulletin 2023-17', 'NPI', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3126',
    name: 'Fintech Partner BSA/AML Certification Gap in Digital Banking Partnership Agreement',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's digital banking partnership with a fintech firm providing white-label savings accounts does not require the fintech to maintain or certify to a BSA/AML program meeting 31 CFR 1010.210 requirements, relying instead on the bank's own BSA/AML program to cover all customers acquired through the fintech channel. FinCEN's CDD rule and OCC Bulletin 2023-17 require that banks operating through third-party channels ensure customer-facing activities comply with BSA/AML requirements regardless of the distribution channel; when the OCC examines the fintech channel's CIP and CDD practices, it finds that 12% of accounts opened through the fintech's onboarding API do not include the minimum required identity verification fields under 31 CFR 1020.220, creating a BSA/AML deficiency for which the bank bears full liability.`,
    keywords: ['OCC Bulletin 2023-17', 'BSA/AML', 'CDD rule', 'fintech partnership', 'CIP'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3127',
    name: 'AI Fraud Detection Vendor Deployed Without SOC 2 Type II Audit in Scope',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital deploys a real-time AI fraud detection system from a vendor that processes transaction data for all debit card, ACH, and wire transfers; the vendor has a SOC 2 Type I report confirming that controls are designed appropriately, but has not completed a SOC 2 Type II audit confirming that controls operate effectively over a period of time. OCC Bulletin 2013-29 and OCC Bulletin 2023-17 require that vendors processing material transaction volumes for banks demonstrate operating effectiveness of their controls — not just design adequacy — through Type II attestation; relying on a Type I report for a vendor processing over $2B in daily transaction volume leaves the bank without evidence that the vendor's security, availability, and confidentiality controls are operating effectively in practice.`,
    keywords: ['SOC 2 Type II', 'OCC Bulletin 2013-29', 'AI fraud detection', 'TPRM', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3128',
    name: 'Generative AI Code Assistant Vendor Accesses Production Codebase Without TPRM Review',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's software development teams have adopted a generative AI code assistant that integrates directly with the bank's production code repositories, with the vendor's cloud infrastructure accessing code that includes configuration files containing non-production database connection strings and internal API endpoint patterns; the tool was adopted through a departmental software procurement process that bypassed the TPRM review because the annual license cost was below the $50K TPRM review threshold. OCC Bulletin 2023-17 requires that the risk-based threshold for TPRM review be set based on risk, not contract value — a vendor with access to production code repositories and the potential to inadvertently expose infrastructure information presents a critical cybersecurity risk regardless of the license cost, and the FFIEC Cybersecurity Assessment Tool's domain 3 controls require assessment of any tool with this access pattern.`,
    keywords: ['OCC Bulletin 2023-17', 'generative AI code assistant', 'FFIEC Cybersecurity Assessment Tool', 'TPRM', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3129',
    name: 'AI Vendor Model Drift Not Monitored — SR 11-7 Extension Requires Bank Oversight',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital licenses an AI-powered credit risk scoring model from a fintech vendor and relies on the vendor's own performance monitoring reports to detect model drift; the bank has no independent mechanism to assess whether the vendor's model is performing as expected on First Capital's specific customer population, and the contract does not require the vendor to provide raw model output data that would allow the bank's IVU to conduct its own performance monitoring. SR 11-7 guidance on model risk management and OCC Bulletin 2023-17 both establish that banks are responsible for ongoing monitoring of vendor-provided models when those models drive material business decisions — the bank cannot outsource model risk oversight to the vendor's own self-monitoring; when the vendor's model degrades due to post-pandemic behavioral shifts and the bank's approval rates for creditworthy borrowers drop 15% before the issue is detected, the gap in independent monitoring is a consent order finding.`,
    keywords: ['SR 11-7', 'AI vendor model drift', 'OCC Bulletin 2023-17', 'model monitoring', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3130',
    name: 'Fintech Embedded Finance Partner Processes Reg E Transactions Without Bank Oversight Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's embedded finance partnership allows a fintech firm to offer First Capital-branded prepaid debit cards through a consumer marketplace app; the fintech processes debit transactions, manages the customer error resolution workflow, and files Reg E dispute responses under the bank's routing number without a documented oversight protocol ensuring the fintech's dispute resolution practices meet Regulation E's timeframe and substantiation requirements. OCC Bulletin 2023-17 requires that the bank maintain oversight over all regulated activities conducted by third parties using the bank's charter; when a class of Reg E disputes is resolved by the fintech outside the 10-business-day provisional credit requirement, the bank — not the fintech — faces CFPB enforcement exposure.`,
    keywords: ['OCC Bulletin 2023-17', 'Reg E', 'fintech partnership', 'TPRM', 'embedded finance'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3131',
    name: 'AI AML Transaction Monitoring Vendor — GLBA Training Data Disclosure Gap',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital deploys an AI-powered AML transaction monitoring system from a vendor that trained its behavioral pattern models on a consortium dataset drawn from multiple bank customers' transaction histories; the vendor's privacy policy does not include a GLBA-compliant disclosure about the use of customer transaction data in a multi-bank training consortium, and First Capital's privacy notice does not reference third-party AI training as a data use purpose. GLBA's Privacy Rule under 16 CFR Part 313 requires that financial institutions provide customers with notice of all material non-public information sharing arrangements; using customer transaction data to train a vendor's consortium AI model without a GLBA-compliant disclosure constitutes a Privacy Rule deficiency that the CFPB can enforce regardless of the indirect nature of the data sharing arrangement.`,
    keywords: ['GLBA Privacy Rule', 'AI AML vendor', 'OCC Bulletin 2023-17', 'TPRM', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3132',
    name: 'Robo-Advisory Fintech Partner Lacks Reg BI Compliance Documentation in TPRM Record',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's wealth management division offers a robo-advisory investment platform through a fintech partner that provides algorithm-driven portfolio recommendations to retail customers; the TPRM due diligence record for the fintech partner does not include an assessment of the partner's compliance with Regulation Best Interest (Reg BI) and Form CRS requirements under the SEC's June 2019 guidance, which applies to algorithm-driven investment recommendations made to retail customers. OCC Bulletin 2023-17 requires that banks assess regulatory compliance across all customer-facing activities of critical third parties; First Capital, as the bank sponsoring the robo-advisory offering to its customers, bears supervisory exposure if the fintech's algorithm does not meet Reg BI's best interest standard for investment recommendations.`,
    keywords: ['OCC Bulletin 2023-17', 'Reg BI', 'robo-advisory fintech', 'TPRM', 'SEC compliance'],
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3133',
    name: 'Predictive Analytics Vendor for CRA Assessment Uses Proxy Variables Without Fair Lending Review',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital uses a third-party analytics vendor to generate Community Reinvestment Act assessment area maps and lending opportunity scores that incorporate census tract socioeconomic data as proxy variables for credit demand; the analytics outputs inform branch siting decisions and CRA lending targets, but the bank's TPRM due diligence has not assessed whether the vendor's proxy variable methodology creates disparate impact risk under ECOA or the Fair Housing Act. OCC Bulletin 2023-17 and the interagency CRA final rule require that CRA assessment tools meet fair lending standards; a vendor-generated opportunity score that systematically underestimates credit demand in majority-minority census tracts would cause First Capital to under-invest in CRA lending in exactly the communities the CRA is designed to serve, creating both a regulatory compliance gap and a reputational risk for the bank.`,
    keywords: ['OCC Bulletin 2023-17', 'CRA', 'ECOA', 'predictive analytics vendor', 'TPRM'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },

  // ── Exit Management ───────────────────────────────────────────────────────
  {
    code: 'B3134',
    name: 'Vendor Exit Strategy Not Documented for Core Banking Platform',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital has never developed a documented vendor exit strategy for its core banking platform, meaning there is no playbook covering alternative provider selection, data migration sequencing, customer communication protocols, regulatory notification requirements, or employee transition planning in the event the current vendor relationship is terminated for cause or becomes untenable. OCC Bulletin 2023-17 requires banks to develop and maintain exit strategies for all critical-activity vendor relationships, specifying that the strategy must be tested to confirm that the bank can actually execute the transition within a timeframe that does not impair the bank's safety and soundness; the absence of any exit documentation for the bank's most critical vendor is the single highest-priority TPRM finding in the OCC's current examination.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor exit strategy', 'TPRM', 'OCC Bulletin 2013-29', 'critical activity'],
    demoRelevant: true,
    subTopic: 'exit-management',
  },
  {
    code: 'B3135',
    name: 'Data Recovery Plan Absent in Exit Scenario — Customer Records Non-Portable at Termination',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's digital lending platform vendor holds six years of customer loan origination data, payment history, and credit decision audit trail records in a proprietary database schema with no documented data extraction API or standard-format export capability; the vendor's contract does not specify a data recovery plan, format specification, or timeline for data delivery upon contract termination. OCC Bulletin 2023-17 requires that exit strategies include explicit plans for recovering data needed to meet the bank's ongoing regulatory, operational, and customer service obligations; without a tested data recovery plan, First Capital cannot confirm it could reconstruct the complete credit decision audit trail required for OCC, CFPB, and ECOA compliance examinations if the lending platform relationship is terminated on short notice.`,
    keywords: ['OCC Bulletin 2023-17', 'data recovery plan', 'TPRM', 'ECOA', 'exit management'],
    demoRelevant: true,
    subTopic: 'exit-management',
  },
  {
    code: 'B3136',
    name: 'Business Continuity During Core Banking Transition Not Stress-Tested',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's TPRM program includes a high-level exit strategy narrative for the core banking platform that assumes a 24-month transition timeline, but the strategy has never been stress-tested against a scenario where the bank must execute the transition in 12 months due to an unplanned vendor event — regulatory action against the vendor, insolvency, or a material service failure. OCC Bulletin 2023-17 requires that exit strategies be tested to confirm they are executable under adverse conditions, not only under planned transition timelines; without a stress scenario for accelerated exit, the bank cannot confirm that the business continuity plan, customer communication protocols, and regulatory notification processes work at the compressed pace that an involuntary vendor exit would require.`,
    keywords: ['OCC Bulletin 2023-17', 'business continuity', 'exit strategy', 'TPRM', 'stress testing'],
    demoRelevant: true,
    subTopic: 'exit-management',
  },
  {
    code: 'B3137',
    name: 'Regulatory Notification for Critical Function Exit Not Planned — OCC 2023-17 Requirement',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's vendor exit strategy documentation does not include a regulatory notification plan specifying when the bank must notify the OCC of a pending or completed vendor exit for a critical function and what information the bank must provide; the bank's general assumption is that notification is required only for mergers and acquisitions, not for vendor transitions. OCC Bulletin 2023-17 requires that banks notify their supervisory office before exiting a critical-activity vendor relationship when the transition could affect the bank's safety and soundness or customers' access to services; without a pre-planned notification protocol, an unplanned core banking vendor exit could result in the OCC being notified after the fact — compounding the supervisory concern about the bank's risk governance.`,
    keywords: ['OCC Bulletin 2023-17', 'regulatory notification', 'exit management', 'TPRM', 'critical activity'],
    demoRelevant: true,
    subTopic: 'exit-management',
  },
  {
    code: 'B3138',
    name: 'Vendor Lock-In Compounds Exit Cost — Proprietary Data Format Requires $3M Migration',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking vendor uses a proprietary data model and API structure that is incompatible with alternative core banking platforms; the bank has received migration cost estimates of $2.5–3.5M purely for data format conversion and integration re-engineering, before accounting for parallel run costs, staff retraining, and customer communication. OCC Bulletin 2023-17's cloud exit guidance and the broader TPRM framework warn that proprietary data formats represent a structural concentration risk that inflates exit costs and reduces the credibility of the bank's exit strategy; the $3M migration cost acts as a de facto switching barrier that the bank has not quantified in its risk appetite statement or included in the TPRM committee's concentration risk assessment.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor lock-in', 'exit strategy', 'TPRM', 'concentration risk'],
    subTopic: 'exit-management',
  },
  {
    code: 'B3139',
    name: 'Fintech Channel Exit — Customer Migration Protocol Not Compliant With Reg E Notice Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's exit strategy for terminating its fintech digital account partnership does not include a Regulation E-compliant customer notification plan specifying the required notice period and content for changes to account terms that would accompany a channel migration; the bank's assumption is that customers will simply be migrated to a direct bank account without a separate notification. Reg E's Regulation E (12 CFR Part 1005.8) requires that banks provide at least 21 days advance written notice before making a change that would adversely affect account holders' rights or fees; migrating fintech channel customers to a different account product with different fee structures without advance notice creates an enumerated violation of Reg E's change-in-terms requirement.`,
    keywords: ['Reg E', 'OCC Bulletin 2023-17', 'exit management', 'fintech partnership', 'TPRM'],
    subTopic: 'exit-management',
  },

  // ── Additional Vendor Concentration ──────────────────────────────────────
  {
    code: 'B3140',
    name: 'Single Cybersecurity Vendor Provides SIEM, EDR, and WAF — Monoculture Risk',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's cybersecurity operations consolidate SIEM, endpoint detection and response, and web application firewall functions into a single vendor's integrated security platform, creating a security monoculture where a single vendor vulnerability, outage, or compromise could simultaneously blind the bank's threat detection, endpoint protection, and perimeter defense capabilities. OCC Bulletin 2023-17 and the FFIEC Cybersecurity Assessment Tool's maturity domains require that banks assess whether third-party concentration in security tooling creates correlated failure risk in the bank's security control framework; a vendor-neutral security architecture review would reveal that the bank's effective security posture is fully dependent on a single vendor's availability and integrity.`,
    keywords: ['OCC Bulletin 2023-17', 'FFIEC Cybersecurity Assessment Tool', 'vendor concentration', 'TPRM', 'cybersecurity'],
    subTopic: 'vendor-concentration',
  },
  {
    code: 'B3141',
    name: 'Third-Party Payroll Processor Handles HR Data for 95% of Bank Staff Without BCP Validation',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital processes payroll for 95% of its 2,400 employees through a single third-party payroll vendor; the vendor's business continuity plan has not been validated against the bank's payroll processing requirements, and the bank has no documented fallback payroll processing capability if the vendor experiences a multi-day outage during a payroll processing window. OCC Bulletin 2023-17 requires that critical vendor BCPs be tested and reviewed for compatibility with the bank's operational requirements; a payroll outage affecting 95% of bank staff during a critical examination period — when examiner interviews, data production, and regulatory responsiveness require full workforce availability — creates both an operational resilience gap and a potential labor law compliance issue if payroll is delayed beyond state wage payment deadlines.`,
    keywords: ['OCC Bulletin 2023-17', 'payroll vendor', 'BCP', 'TPRM', 'OCC Bulletin 2013-29'],
    subTopic: 'vendor-concentration',
  },

  // ── Additional Due Diligence ──────────────────────────────────────────────
  {
    code: 'B3142',
    name: 'ISO 27001 Certification Accepted as Substitute for SOC 2 — Control Framework Mismatch',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's TPRM program accepts ISO 27001 certification as an equivalent substitute for SOC 2 Type II attestation for non-US technology vendors, but ISO 27001 certification covers the existence of an information security management system without the trust services criteria-aligned control testing that SOC 2 Type II provides; the two frameworks address overlapping but not equivalent control domains. FFIEC IT Handbook guidance on service provider oversight and OCC Bulletin 2013-29 specifically reference SOC 2 reporting as the appropriate attestation framework for technology service providers serving US banks; accepting ISO 27001 as a full substitute results in critical-activity vendors lacking evidence that the specific availability, confidentiality, and processing integrity controls relevant to bank services are operating effectively.`,
    keywords: ['SOC 2 Type II', 'ISO 27001', 'FFIEC IT Handbook', 'OCC Bulletin 2013-29', 'TPRM'],
    subTopic: 'due-diligence',
  },
  {
    code: 'B3143',
    name: 'Vendor Concentration Interview Not Performed Before Contract Award — OCC 2023-17 Pre-Contract Phase',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital awards a multi-year contract to a new critical-activity vendor after reviewing the vendor's security questionnaire and SOC 2 report but without conducting a structured interview with the vendor's senior management to assess the organization's culture, operational depth, subcontractor risk posture, and incident response maturity. OCC Bulletin 2023-17 specifies a pre-contract due diligence phase that includes qualitative as well as quantitative assessment of a vendor's ability to perform; the absence of management interviews means the bank has no direct assessment of whether the vendor's stated controls and capabilities reflect actual organizational maturity or documentation produced for due diligence purposes only.`,
    keywords: ['OCC Bulletin 2023-17', 'pre-contract due diligence', 'TPRM', 'OCC Bulletin 2013-29', 'vendor assessment'],
    subTopic: 'due-diligence',
  },

  // ── Additional Contract Management ───────────────────────────────────────
  {
    code: 'B3144',
    name: 'GDPR Data Processing Agreement Missing for EU Customer Data Vendor',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's technology vendor that provides customer analytics services processes personal data of EU-resident customers who hold accounts through the bank's international correspondent banking relationships; the vendor is operating without a GDPR-compliant data processing agreement specifying roles, data retention limits, sub-processor disclosure, and data transfer mechanisms, meaning any cross-border transfer of EU customer data through the vendor relationship is conducted without the Standard Contractual Clauses required under GDPR Article 46. Although First Capital is primarily a US institution, GDPR Article 3's extraterritorial scope applies when EU residents' data is processed, and the OCC's increasing attention to cross-border data governance under OCC Bulletin 2023-17 means the absence of a GDPR DPA for an EU data vendor creates both privacy law exposure and TPRM governance deficiency.`,
    keywords: ['GDPR', 'OCC Bulletin 2023-17', 'data processing agreement', 'TPRM', 'GLBA'],
    subTopic: 'contract-management',
  },
  {
    code: 'B3145',
    name: 'Force Majeure Clause Too Broad — Vendor Can Excuse Performance for 90 Days Without SLA Credits',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's core banking vendor contract includes a force majeure clause that excuses performance for any event "beyond the vendor's reasonable control," with a 90-day suspension of SLA obligations during which the bank has no contractual remedies including termination rights or service credits. OCC Bulletin 2023-17 requires that contracts for critical-activity vendors include meaningful continuity and remediation provisions; an overly broad force majeure clause that suspends all SLA obligations for 90 days — covering scenarios as broad as pandemic conditions, supply chain disruption, or cybersecurity incidents attributed to a third party — effectively eliminates the bank's contractual leverage during precisely the scenarios where vendor performance is most critical to the bank's operational resilience.`,
    keywords: ['OCC Bulletin 2023-17', 'force majeure', 'SLA', 'TPRM', 'contract management'],
    subTopic: 'contract-management',
  },

  // ── Additional Ongoing Monitoring ─────────────────────────────────────────
  {
    code: 'B3146',
    name: 'AI Vendor Performance Reporting Self-Certified by Vendor — No Independent Validation',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital receives monthly AI model performance reports from its fintech credit scoring vendor that show stable accuracy, approval rates, and demographic parity metrics; these reports are produced entirely by the vendor using the vendor's own evaluation methodology, with no provision for First Capital to independently validate the reported metrics against the bank's own realized loan performance data. SR 11-7 model monitoring requirements and OCC Bulletin 2023-17 both require that banks implement independent monitoring of vendor-provided models — either through contractual data access rights that allow the bank's own IVU to replicate the analysis, or through a third-party model auditor whose work is not commissioned by the vendor; the current arrangement provides First Capital with no independent verification that the vendor's performance reports accurately reflect model behavior on the bank's specific customer population.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI vendor monitoring', 'TPRM', 'model validation'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3147',
    name: 'TPRM Issue Remediation Tracking Not Linked to Consent Order Milestones',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's TPRM issue log tracks open vendor findings and remediation commitments in a separate system that is not integrated with the consent order milestone tracking system managed by the Chief Risk Officer's office; vendor-related findings that are direct contributors to consent order MRM remediation items are tracked as standalone TPRM issues without being mapped to the consent order milestone they affect. OCC Bulletin 2023-17 and the bank's consent order both require that MRM remediation evidence be comprehensive and traceable; when OCC examiners assess consent order progress, vendor-related control gaps that have not been linked to the relevant consent order milestones create an incomplete remediation narrative that undermines the bank's progress claims.`,
    keywords: ['OCC Bulletin 2023-17', 'consent order', 'TPRM', 'issue tracking', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3148',
    name: 'Penetration Test Results for Critical Vendor Not Reviewed by Bank Security Team',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's TPRM program requires critical-activity vendors to provide annual penetration test results, but the vendor-supplied pen test reports are filed in the TPRM document repository without review by the bank's information security team; three vendors' pen test reports from the prior year show high-severity findings that remain open six months after the test, but the bank's security team is unaware of the findings because no process exists to route vendor pen test reports to the security team for review and follow-up. FFIEC IT Handbook guidance and OCC Bulletin 2023-17 require that banks review vendors' penetration testing results and track remediation of material findings — accepting a document without reviewing it does not satisfy the ongoing monitoring requirement.`,
    keywords: ['FFIEC IT Handbook', 'OCC Bulletin 2023-17', 'penetration testing', 'TPRM', 'cybersecurity'],
    subTopic: 'ongoing-monitoring',
  },

  // ── Additional Fintech/AI Vendor ──────────────────────────────────────────
  {
    code: 'B3149',
    name: 'Conversational AI Customer Service Vendor Lacks UDAP Compliance Review in TPRM',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital deploys a conversational AI chatbot from a technology vendor to handle tier-1 customer service interactions including account balance inquiries, payment confirmations, and product information; the TPRM due diligence for the chatbot vendor does not include an assessment of whether the AI's response generation could produce inaccurate or misleading product disclosures that would constitute unfair, deceptive, or abusive acts or practices under the Dodd-Frank Act. OCC Bulletin 2023-17 requires banks to assess regulatory compliance risk associated with customer-facing third-party technologies; a conversational AI that generates product disclosures without human review creates UDAP exposure because the AI's hallucinated or outdated fee disclosures may contradict the bank's current terms, and First Capital — not the vendor — bears CFPB enforcement liability.`,
    keywords: ['OCC Bulletin 2023-17', 'conversational AI', 'UDAP', 'TPRM', 'CFPB'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3150',
    name: 'Open Banking API Vendor Not Assessed for GLBA Affiliate Data Sharing Compliance',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital partners with an open banking platform vendor to provide third-party data aggregators access to customer account data through an API; the TPRM due diligence for the open banking vendor does not assess whether the data aggregation and sharing facilitated by the platform complies with GLBA's opt-out and affiliate information sharing provisions, or whether the aggregators downstream of the platform have appropriate data use agreements. CFPB's Section 1033 data access rule and GLBA's Privacy Rule require that financial institutions control how customer financial data shared through open banking arrangements is used by downstream parties; the bank's TPRM framework does not extend to the aggregators and fintechs consuming data through the open banking vendor's network, creating a regulatory compliance visibility gap.`,
    keywords: ['GLBA Privacy Rule', 'OCC Bulletin 2023-17', 'open banking', 'TPRM', 'CFPB Section 1033'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3151',
    name: 'AI Document Intelligence Vendor Processes Loan Files Without Data Processing Agreement',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial banking operations team uses an AI document intelligence platform to extract and validate financial data from borrower-submitted tax returns, financial statements, and entity documents; the platform is accessed through a SaaS subscription agreement that has not been reviewed by the bank's legal or TPRM team, and does not include the data processing agreement, NPI protection clauses, subcontractor disclosure requirements, or data deletion provisions required by GLBA's Safeguards Rule. OCC Bulletin 2023-17 requires that vendor contracts for any service involving customer NPI meet the full TPRM contracting standard regardless of how the relationship is commercially structured; a SaaS subscription accessing loan file NPI without a TPRM-compliant contract is a Safeguards Rule gap.`,
    keywords: ['GLBA Safeguards Rule', 'OCC Bulletin 2023-17', 'AI document intelligence', 'TPRM', 'NPI'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },

  // ── Additional Exit Management ────────────────────────────────────────────
  {
    code: 'B3152',
    name: 'Exit Cost Estimate Not Included in Vendor Risk Assessment — Hidden Switching Barrier',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's TPRM risk assessments for critical vendors quantify the probability and impact of vendor performance failures but do not include an estimate of the bank's exit cost — data migration, retraining, parallel run, and integration re-engineering costs — as a component of the concentration risk assessment. OCC Bulletin 2023-17 requires that exit strategy documentation be grounded in realistic assessments of transition complexity and cost; without a documented exit cost estimate, the TPRM committee and board risk committee cannot make an informed judgment about whether the bank's current vendor concentration is within its risk appetite given the switching barriers embedded in each critical relationship.`,
    keywords: ['OCC Bulletin 2023-17', 'exit cost', 'vendor concentration', 'TPRM', 'risk appetite'],
    subTopic: 'exit-management',
  },
  {
    code: 'B3153',
    name: 'Parallel Run Budget Not Reserved in Exit Strategy — Transition Assumes Sequential Cutover',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's documented exit strategy for the core banking platform assumes a sequential cutover where the old platform is decommissioned within 30 days of the new platform going live, without budgeting for a parallel run period where both platforms operate simultaneously to allow reconciliation, exception handling, and rollback capability. OCC Bulletin 2023-17 requires that exit strategies be executable in a manner that protects customers and the bank's operational continuity; a sequential cutover with no parallel run capability means the bank has no fallback if critical issues are discovered post-cutover, and the 30-day decommission assumption is operationally unrealistic for a core banking migration involving the bank's $14B deposit book.`,
    keywords: ['OCC Bulletin 2023-17', 'exit strategy', 'parallel run', 'TPRM', 'core banking'],
    demoRelevant: true,
    subTopic: 'exit-management',
  },

  // ── Cross-Topic TPRM Governance ───────────────────────────────────────────
  {
    code: 'B3154',
    name: 'TPRM Governance Structure Lacks Independent Second-Line Oversight Over First-Line Assessments',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's TPRM program assigns the first-line business units to conduct vendor risk assessments for their own vendor relationships, with no independent second-line review by the risk management function before assessments are submitted to the TPRM committee. OCC Bulletin 2023-17 and the FFIEC IT Handbook on third-party risk both emphasize that effective third-party risk governance requires independent challenge of first-line assessments — business units have commercial incentives to rate vendor risk as lower than it objectively is, and without second-line review, the TPRM committee receives a risk picture that systematically understates the severity of vendor-related risks identified by business units who depend on and advocate for their vendors.`,
    keywords: ['OCC Bulletin 2023-17', 'FFIEC IT Handbook', 'TPRM governance', 'three lines of defense', 'second-line oversight'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3155',
    name: 'TPRM Policy Not Updated for OCC 2023-17 Superseding OCC 2013-29 Guidance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's TPRM policy document references OCC Bulletin 2013-29 as the primary regulatory guidance framework and has not been updated to incorporate the enhanced requirements of OCC Bulletin 2023-17, which supersedes 2013-29 and introduces additional requirements around critical activity classification, AI/ML vendor governance, exit strategy documentation, and cloud concentration risk assessment. OCC examiners reviewing First Capital's TPRM framework during the consent order examination find that the bank's written policies are structurally misaligned with current supervisory expectations, and that the enhanced due diligence requirements for critical-activity vendors introduced in OCC 2023-17 are absent from the bank's documented procedures — creating a gap between the examination standard and the bank's formal governance framework.`,
    keywords: ['OCC Bulletin 2023-17', 'OCC Bulletin 2013-29', 'TPRM policy', 'consent order', 'supervisory expectations'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3156',
    name: 'Board Risk Committee Vendor Concentration Report Omits AI and Fintech Vendors',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's quarterly board risk committee report on vendor concentration focuses on traditional infrastructure and services vendors — core banking, network, data center — and does not include AI and fintech vendors whose data access, model influence, and customer interaction scope has grown materially in the past 18 months. OCC Bulletin 2023-17 requires board-level visibility into third-party concentration risk across all critical-activity relationships; a board risk report that excludes the bank's growing portfolio of fintech lending partners, AI decisioning vendors, and embedded finance providers gives the board an incomplete picture of the bank's overall third-party risk exposure and an inaccurate view of where critical functions are concentrated.`,
    keywords: ['OCC Bulletin 2023-17', 'board risk committee', 'AI vendor', 'TPRM', 'concentration risk'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B3157',
    name: 'New Fintech Vendor Onboarding Bypasses TPRM Due to Budget Code Classification',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's TPRM trigger is based on procurement budget codes, with relationships coded as "software subscription" or "professional services" under $100K not routed through the TPRM intake process; multiple fintech AI tools and data analytics services have been adopted by business units using departmental discretionary budgets coded as software subscriptions, bypassing TPRM review entirely despite processing customer data, generating credit outputs, or accessing internal systems. OCC Bulletin 2023-17 requires that the TPRM intake process be risk-based rather than cost-based, ensuring that all relationships involving access to customer data, execution of critical functions, or use in regulated decisions are subject to appropriate due diligence regardless of contract value.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM intake', 'fintech vendor', 'due diligence', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'due-diligence',
  },
  {
    code: 'B3158',
    name: 'AI Model Risk Tool Vendor Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's model risk management function uses a vendor-provided AI platform to automate model documentation, validation workflow management, and ongoing performance monitoring for models in the SR 11-7 model inventory; this AI MRM tool itself is not registered in the model inventory it manages, despite using ML to prioritize validation resources, classify model risk tiers, and generate draft validation findings. SR 11-7 and OCC 2011-12 require that all tools generating quantitative or qualitative outputs that inform risk management decisions be subject to model governance — including the tools used to govern other models; an unvalidated AI MRM platform that miscategorizes model risk tiers could systematically deprioritize high-risk models for validation, compounding the consent order remediation gap.`,
    keywords: ['SR 11-7', 'OCC Bulletin 2023-17', 'AI MRM tool', 'model inventory', 'consent order'],
    demoRelevant: true,
    subTopic: 'fintech-ai-vendor',
  },
  {
    code: 'B3159',
    name: 'TPRM Program Maturity Assessment Not Benchmarked — No Peer Comparison or Gap Analysis',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital has not conducted a formal maturity assessment of its TPRM program against the OCC 2023-17 framework or the FFIEC IT Handbook's third-party risk management maturity model, meaning the TPRM committee has no external benchmark against which to measure the program's completeness, rigor, or adherence to supervisory expectations. OCC Bulletin 2023-17 implicitly establishes a maturity standard for third-party risk governance that banks are expected to assess themselves against; without a documented gap analysis comparing First Capital's current TPRM program to the OCC 2023-17 requirements, the bank cannot demonstrate to OCC examiners that it has identified and prioritized the highest-risk gaps in its third-party risk framework — a showing that is particularly important given the consent order's TPRM-related MRA items.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM maturity', 'FFIEC IT Handbook', 'OCC Bulletin 2013-29', 'consent order'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },

];
