// seed-banking-dom12-data-governance-part1.ts
// Banking genome patterns — Data Governance & BCBS 239
// Code range: B3400–B3459  (60 patterns)
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

export const BANKING_DATA_GOVERNANCE_PART1_PATTERNS: PatternSeed[] = [

  // ── BCBS 239: Risk Data Aggregation Principles 1–4 ────────────────────────
  {
    code: 'B3400',
    name: 'BCBS 239 Principle 1 Governance Framework Not Formally Adopted',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital has not formally adopted a board-level data governance policy that maps to BCBS 239 Principle 1, which requires a governing body to own the risk data aggregation framework and approve the taxonomy of critical data elements used in regulatory capital and risk reporting. Without a board-ratified BCBS 239 governance charter, the data stewardship function operates as an IT project rather than an enterprise risk program, and ownership of risk data quality is diffuse across business lines with no single accountable executive. OCC and Federal Reserve examiners reviewing the bank's model risk and data governance programs flag the absence of a board-level BCBS 239 adoption document as a Tier 1 governance gap that undermines the credibility of DFAST and CCAR data sourcing certifications.`,
    keywords: ['BCBS 239', 'data governance', 'OCC guidance', 'CCAR', 'risk data aggregation'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3401',
    name: 'BCBS 239 Principle 2 Data Architecture Gap — Risk Systems Not on Single Authoritative Source',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's credit risk, market risk, and operational risk reporting systems each source exposure data from separate data marts that are populated from the core banking system through three independent ETL pipelines with different extraction schedules, field-level transformations, and tolerance rules. BCBS 239 Principle 2 requires that risk data be sourced from a single authoritative data source with documented lineage to prevent divergence across risk dimensions; when regulators request reconciliation of risk-weighted assets across the three frameworks, the bank requires a six-week manual sprint to produce a consistent view — exactly the condition the BCBS 239 risk aggregation gap archetype describes — which the Federal Reserve cites as a data infrastructure deficiency in the annual examination.`,
    keywords: ['BCBS 239', 'data lineage', 'risk data aggregation', 'DFAST', 'data architecture'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3402',
    name: 'BCBS 239 Principle 3 Completeness Gap — Subsidiaries Excluded From Consolidated Risk View',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital operates two non-bank subsidiaries — a leasing entity and a trust company — whose exposures are not included in the consolidated risk aggregation framework that feeds DFAST and CCAR submissions, on the basis that they are not OCC-regulated entities subject to the bank's core risk reporting infrastructure. BCBS 239 Principle 3 requires that risk data aggregation cover all material legal entities and risk types on a consolidated basis; the Federal Reserve's CCAR guidance requires that stress scenarios be applied to the consolidated holding company including non-bank affiliates, meaning First Capital's stress test submissions systematically understate consolidated exposure by the $2.3B in leasing and trust assets held outside the risk aggregation perimeter.`,
    keywords: ['BCBS 239', 'CCAR', 'data completeness', 'consolidated reporting', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3403',
    name: 'BCBS 239 Principle 4 Timeliness Failure — Intraday Aggregation Not Achievable for Limit Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's risk data aggregation infrastructure produces a consolidated risk exposure view on a T+1 overnight batch cycle, which satisfies BCBS 239 Principle 4 minimum standards for non-systemically important banks under normal conditions; however, the bank cannot produce an intraday aggregated risk view when examiners or the board requests on-demand reporting during periods of market stress. BCBS 239 Principle 4 requires that G-SIBs and banks with significant trading activities be capable of generating aggregated risk data on an intraday basis to support limit monitoring and management decision-making; First Capital's inability to produce a real-time or near-real-time risk position during the March 2023 regional bank stress event — when the board needed an updated liquidity and credit risk view within hours — exposes the gap between BCBS 239 aspirational compliance and operational capability.`,
    keywords: ['BCBS 239', 'intraday aggregation', 'risk data aggregation', 'OCC guidance', 'liquidity risk'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3404',
    name: 'BCBS 239 Stress Testing Data Completeness Below Regulatory Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's DFAST stress testing submission includes a data completeness attestation representing that 95% of in-scope exposures have complete critical data elements, but internal data quality measurement finds that 22% of commercial loan records lack current financial statements, 15% have stale collateral valuations, and 8% have incomplete obligor risk rating dates — all of which are BCBS 239-defined critical data elements for credit risk stress testing. The gap between the attested completeness rate and the measured completeness rate creates regulatory reporting integrity risk under the Federal Reserve's DFAST supervisory guidance, which requires that data completeness attestations be grounded in measured, validated data quality metrics rather than system record counts; OCC examiners reviewing the data completeness certification process find the measurement methodology does not capture field-level gaps.`,
    keywords: ['BCBS 239', 'DFAST', 'data completeness', 'stress testing', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3405',
    name: 'BCBS 239 On-Demand Reporting Capability Not Tested Beyond Annual DFAST Production',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's BCBS 239 compliance program documents the ability to produce consolidated risk reports on demand, but the on-demand capability has only ever been tested in the context of the annual DFAST production cycle — where the reporting team has six months of preparation time and dedicated data quality remediation sprints. BCBS 239 Principle 4 contemplates on-demand reporting under stress conditions with little or no advance preparation; when the OCC requests an ad-hoc consolidated exposure report during an interim supervisory visit with 48 hours' notice, the bank requires eight business days to produce the report due to manual reconciliation requirements, data quality remediation for the non-standard reporting period, and coordination across four data teams — a response time that the OCC cites as a material BCBS 239 implementation gap.`,
    keywords: ['BCBS 239', 'on-demand reporting', 'OCC guidance', 'data governance', 'risk data aggregation'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3406',
    name: 'BCBS 239 Critical Data Element Inventory Incomplete — Trading Book Exposure Excluded',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's BCBS 239 critical data element registry covers the banking book credit exposures and operational risk data elements required for DFAST, but does not include the market risk CDEs — sensitivity measures, VaR inputs, P&L attribution data — for the bank's trading book, which represents $1.8B in notional exposure. BCBS 239 Principle 2 requires that the CDE inventory cover all risk types for which the bank is required to produce regulatory capital and risk reporting; the exclusion of trading book CDEs from governance means that the market risk data used in CCAR capital planning lacks the completeness verification, ownership assignment, and quality measurement that BCBS 239 and the Federal Reserve's data governance examination framework require.`,
    keywords: ['BCBS 239', 'critical data element', 'CCAR', 'market risk', 'data governance'],
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3407',
    name: 'BCBS 239 Remediation Plan Overdue — Board-Reported Milestones Not Met in Three Consecutive Quarters',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's BCBS 239 implementation roadmap, submitted to the Federal Reserve as part of the annual capital planning process, committed to completing a data lineage tracing system for the top 50 critical data elements by Q2 of the prior year; three consecutive quarters have passed with the lineage system still in design phase, and the board's quarterly data governance report shows the milestone as "in progress" without explanation of the delay or a revised timeline. Federal Reserve examination guidance on capital planning data governance and OCC horizontal examination of data governance programs treat repeated milestone slippage as an indicator of weak program sponsorship and insufficient resource commitment; the gap between committed and actual BCBS 239 remediation progress compounds the bank's existing consent order obligations.`,
    keywords: ['BCBS 239', 'data governance', 'OCC guidance', 'Federal Reserve', 'CCAR'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },

  // ── Data Architecture: CDE Ownership & Enterprise Data Model ─────────────
  {
    code: 'B3408',
    name: 'Critical Data Element Ownership Assigned to IT Not Business — Accountability Gap',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's critical data element registry designates IT data engineers as the data owners for 80% of the CDEs covering credit risk, regulatory capital, and liquidity metrics, rather than assigning business domain ownership to the credit risk, treasury, or finance teams responsible for the accuracy of these metrics. DAMA-DMBOK and BCBS 239 governance frameworks distinguish between technical data custodians (IT) and business data owners who are accountable for the accuracy, completeness, and fitness of data for its intended business and regulatory use; when CDEs are assigned to IT owners, business accountability for data quality disappears, and regulatory reporting errors are attributed to "data issues" rather than business domain failures that can be governed and measured.`,
    keywords: ['DAMA-DMBOK', 'critical data element', 'data ownership', 'BCBS 239', 'data governance'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3409',
    name: 'Enterprise Data Model Staleness — Financial Product Taxonomy Not Updated for New Instruments',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's enterprise data model defines the canonical financial product taxonomy used across core banking, risk reporting, and regulatory capital systems, but the model has not been updated in three years, predating the bank's entry into equipment finance, solar energy lending, and subscription-based commercial credit products — none of which have approved data model representations. DAMA-DMBOK and DCAM data architecture standards require that enterprise data models be maintained as living artifacts that evolve with product portfolios; when the bank attempts to include solar energy lending in the CCAR severely adverse scenario, the data model gap requires a six-week tactical mapping exercise that produces non-standard data fields not included in the BCBS 239 CDE governance framework.`,
    keywords: ['DAMA-DMBOK', 'enterprise data model', 'CCAR', 'data architecture', 'DCAM'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3410',
    name: 'Data Domain Accountability Without Federated Governance Model — Single-Point Bottleneck',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's data governance program assigns accountability for each data domain to a central data governance office rather than establishing a federated model where domain-level data stewards in each business line own data quality for their respective domains. DAMA-DMBOK Volume 2 and the DCAM capability maturity model both identify federated domain accountability as a prerequisite for scaling data governance beyond a centralized compliance function; a central office model creates a bottleneck where 140 CDEs are governed by a team of four analysts, producing a data quality certification backlog of 6–9 months that OCC examiners interpret as evidence that the bank's data governance program lacks the operational depth required by BCBS 239.`,
    keywords: ['DAMA-DMBOK', 'DCAM', 'data governance', 'federated governance', 'BCBS 239'],
    subTopic: 'data-architecture',
  },
  {
    code: 'B3411',
    name: 'Reference Data Management Gap — Legal Entity Hierarchy Not Synchronized Across Risk Systems',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital maintains legal entity hierarchy data in three separate systems — the core banking system, the credit risk aggregation platform, and the CCAR capital planning tool — that are synchronized monthly through a manual reconciliation process; when the bank completes an acquisition or changes a legal entity structure, the hierarchy update propagates through the three systems with lags of one to six weeks. BCBS 239 Principle 2 requires that legal entity hierarchies used in risk aggregation be consistent and current; entity hierarchy mismatches cause consolidated exposure reports to exclude or double-count exposures for recently modified entities, creating risk aggregation errors that are discovered only during the DFAST examination cycle when the Federal Reserve's examiners compare entity-level reports against the consolidated submission.`,
    keywords: ['BCBS 239', 'legal entity hierarchy', 'data governance', 'CCAR', 'reference data'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3412',
    name: 'Data Governance Council Lacks Executive Sponsorship — Decisions Not Binding on Business Lines',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's data governance council is chaired by the data management director and draws membership from data analysts and IT representatives, but does not include C-suite or senior risk executive membership; without executive sponsorship, the council's data quality rulings and CDE ownership decisions are treated as advisory by business line leaders who refuse to reallocate resources to data remediation without direction from the CRO or CFO. DAMA-DMBOK and the DCAM governance maturity model both emphasize executive sponsorship as a predictor of data governance program effectiveness; a governance council that lacks binding authority over business lines cannot enforce the BCBS 239 data quality standards that OCC and Federal Reserve examiners expect to find embedded in the bank's operating model.`,
    keywords: ['DAMA-DMBOK', 'data governance', 'BCBS 239', 'DCAM', 'executive sponsorship'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },

  // ── Data Quality: Reconciliation, SLAs, MDM ──────────────────────────────
  {
    code: 'B3413',
    name: 'Reconciliation Break Rate Between Source and Risk Systems Exceeds Regulatory Tolerance',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital measures reconciliation breaks between the core banking system of record and the credit risk aggregation platform as part of its monthly data quality reporting, with a documented tolerance threshold of 0.1% of total exposure count; current month reconciliation break rates are running at 1.8% for commercial loans and 3.4% for participations and off-balance-sheet commitments, but the data quality team continues to use the tolerance without escalating the sustained breach. BCBS 239 data accuracy principles and OCC data governance examination guidance require that reconciliation tolerance thresholds be associated with escalation triggers when they are systematically exceeded; a tolerance threshold that is being breached by 18× without escalation signals that the data quality governance process is not functioning as designed and that the risk reporting built on this data may not be reliable.`,
    keywords: ['BCBS 239', 'reconciliation', 'data quality', 'OCC guidance', 'risk data aggregation'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3414',
    name: 'Data Quality SLA for Regulatory Reporting Not Defined — No Contractual Commitment From Upstream Systems',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's regulatory reporting team produces FR Y-9C, Call Report, and CCAR submissions from data sourced from seven upstream systems including the loan origination system, core banking platform, and treasury management system; none of these data dependencies are governed by formal data quality SLAs specifying completeness thresholds, delivery timeliness, and acceptable error rates for each data feed. DAMA-DMBOK and BCBS 239 data accuracy standards require that material data dependencies for regulatory reporting be governed by documented quality service agreements that create accountability in upstream data producers; without SLAs, regulatory reporting data quality failures are treated as one-off incidents rather than SLA breaches that trigger root-cause analysis and producer accountability under a formal data contract framework.`,
    keywords: ['DAMA-DMBOK', 'data quality SLA', 'FR Y-9C', 'BCBS 239', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3415',
    name: 'Duplicate Entity Resolution Failure in MDM — Single Borrower Treated as Multiple Obligors',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's master data management platform maintains the canonical customer and obligor entity registry, but has a duplicate entity rate of 4.2% for commercial borrowers where the same legal entity appears under different name variations, tax identification numbers, or address formats in the system of record. BCBS 239 Principle 2 requires that risk aggregation be performed at the consolidated obligor level to prevent double-counting and to enable single-counterparty exposure concentration measurement; when the bank's credit risk aggregation platform calculates single-borrower exposure limits, the 4.2% duplicate rate causes fragmented exposure views for the affected obligors, understating concentration for 22 borrowers who would individually breach the single-borrower limit if their fragmented records were consolidated.`,
    keywords: ['BCBS 239', 'MDM', 'entity resolution', 'concentration risk', 'data quality'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3416',
    name: 'Data Quality Remediation Backlog Not Prioritized by Regulatory Impact — Low-Priority Fixes Addressed First',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's data quality team maintains a remediation backlog of 340 data quality issues identified through the BCBS 239 CDE measurement program, but prioritizes resolution based on issue age rather than regulatory impact — with the result that 85 data quality issues affecting CCAR and DFAST CDEs have remained open for 12–18 months while older lower-priority issues are resolved. BCBS 239 and OCC data governance guidance require that data quality issues affecting regulatory reporting be treated with the highest priority and subject to defined remediation timelines with executive escalation if milestones are not met; a backlog management approach that ages low-priority issues ahead of high-regulatory-impact CDEs represents a data governance program design failure that OCC examiners identify by comparing the backlog registry against the regulatory reporting data quality measurement results.`,
    keywords: ['BCBS 239', 'data quality', 'OCC guidance', 'CCAR', 'DAMA-DMBOK'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3417',
    name: 'Data Quality Measurement Methodology Not Consistent Across Business Lines — Incomparable Results',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's business lines measure critical data element quality using different methodologies — the retail banking line measures completeness as a percentage of non-null fields while the commercial banking line measures completeness as a percentage of fields passing business rule validation — producing data quality scores that cannot be compared or aggregated at the enterprise level. DAMA-DMBOK and the BCBS 239 data governance implementation guidance recommend a standardized data quality measurement framework applied consistently across all business lines to enable meaningful enterprise-level quality reporting; without a consistent methodology, the board's enterprise data quality dashboard shows artificially comparable quality scores that mask structural differences in how business lines define and measure data completeness, accuracy, and timeliness.`,
    keywords: ['DAMA-DMBOK', 'BCBS 239', 'data quality', 'data governance', 'DCAM'],
    subTopic: 'data-quality',
  },
  {
    code: 'B3418',
    name: 'Source-System Data Quality Defects Not Traced to Root Cause — Repeat Breaks Unresolved',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's data operations team resolves monthly reconciliation breaks between the loan origination system and the credit risk platform by applying manual corrections to the risk platform, without tracing the breaks to their root cause in the upstream source system data entry, business logic, or ETL transformation rules. BCBS 239 data accuracy requirements and DAMA-DMBOK root cause analysis practices require that recurring data quality defects be addressed at their source rather than patched downstream; the manual correction approach means that the same 15–20 break categories recur every month, consuming 80 analyst-hours of reconciliation effort monthly while the underlying data entry and system integration issues that generate the breaks remain permanently unaddressed.`,
    keywords: ['BCBS 239', 'data quality', 'reconciliation', 'DAMA-DMBOK', 'root cause analysis'],
    subTopic: 'data-quality',
  },

  // ── Regulatory Reporting: FR Y-9C, CCAR, XBRL ──────────────────────────
  {
    code: 'B3419',
    name: 'FR Y-9C Data Lineage Not Documented to Source System Field Level',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital produces quarterly FR Y-9C holding company financial data reports but cannot produce field-level data lineage documentation for 40% of the schedules — tracing each reported value from the FR Y-9C line item back to the source system field, transformation logic, and business rule applied. Federal Reserve SR guidance on data governance for bank holding companies and BCBS 239 lineage requirements demand that regulatory report producers maintain documented lineage to source systems for all material schedules; without field-level lineage, the Federal Reserve examiners cannot verify that reported values are consistent with source data, and internal audit cannot independently reproduce the FR Y-9C figures to confirm their accuracy — creating a regulatory reporting integrity risk that compounds the bank's consent order obligations.`,
    keywords: ['FR Y-9C', 'data lineage', 'BCBS 239', 'Federal Reserve', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3420',
    name: 'Call Report Data Sourcing Documentation Insufficient for OCC Horizontal Examination',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's Call Report preparation process relies on a team of three analysts who produce quarterly regulatory schedules from consolidated internal reports, but the data sourcing documentation for each Call Report schedule — specifying which general ledger accounts, loan sub-system extracts, and off-balance-sheet system queries feed each line item — exists only in informal email threads and individual analyst knowledge rather than a documented, auditable data lineage record. OCC horizontal examination of Call Report data governance expects to see formal data sourcing documentation for each schedule that can be reviewed by examiners without requiring analyst interviews; the absence of documented sourcing creates a key-person dependency risk where a single analyst departure could disrupt the bank's ability to demonstrate regulatory reporting accuracy.`,
    keywords: ['FR Y-9C', 'OCC guidance', 'data lineage', 'BCBS 239', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3421',
    name: 'CCAR Data Sourcing Documentation Does Not Meet Federal Reserve Sufficiency Threshold',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's CCAR data sourcing documentation identifies the primary source system for each data element in the capital planning submission but does not document the specific extract query, transformation logic, or reconciliation control that translates source system data into the CCAR submission format. The Federal Reserve's CCAR supervisory guidance and the LISCC data governance examination framework require that data sourcing documentation be sufficiently detailed for an independent party to reproduce the reported figures without querying the source systems directly; when Federal Reserve examiners request a data sourcing walkthrough for the severely adverse credit loss schedule, the bank's team requires 10 business days to reconstruct the documentation — a delay that the Federal Reserve cites as a capital planning data governance deficiency.`,
    keywords: ['CCAR', 'data lineage', 'BCBS 239', 'Federal Reserve', 'data governance'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3422',
    name: 'XBRL Tagging Accuracy Below SEC Acceptable Error Rate for Call Report Submissions',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital submits XBRL-tagged Call Report data to the Federal Reserve and FDIC using an automated XBRL tagging tool, but the bank does not perform a post-submission validation to verify that the XBRL tags applied by the automation tool match the underlying reported values and the applicable taxonomy definitions. SEC and banking regulatory guidance on XBRL filing accuracy expect submitters to validate XBRL tags against the reported financial data before submission; the bank's post-submission analysis — conducted after the Federal Reserve flags XBRL errors in a routine data quality review — finds that 3.2% of XBRL tags are incorrectly mapped, causing the Call Report data to feed the Federal Reserve's supervisory data systems with inaccurate values for metrics that examiners use in off-site surveillance.`,
    keywords: ['XBRL', 'FR Y-9C', 'BCBS 239', 'OCC guidance', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3423',
    name: 'Regulatory Reporting Control Environment Not Tested in Business Continuity Scenario',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's business continuity plan documents alternative procedures for core banking operations but does not include a tested procedure for producing regulatory reports — FR Y-9C, Call Report, and CCAR data — if the primary data systems are unavailable or if the regulatory reporting team is inaccessible during a business disruption. BCBS 239 Principle 4 and OCC operational resilience guidance require that critical reporting capabilities, including regulatory data production, be covered by business continuity arrangements that have been tested; the absence of a regulatory reporting business continuity test means the bank cannot demonstrate to the OCC or Federal Reserve that it can fulfill its regulatory reporting obligations under the scenarios contemplated by SR 11-16 operational resilience guidance.`,
    keywords: ['BCBS 239', 'regulatory reporting', 'OCC guidance', 'operational resilience', 'business continuity'],
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3424',
    name: 'DFAST Data Production Timeline Requires Manual Overrides Not Documentable in Examination',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital produces its DFAST stress test submission through a data production process that requires 12–15 manual override decisions in each cycle, where data quality issues are resolved by subject matter expert judgment rather than automated rules with documented audit trails. BCBS 239 and Federal Reserve DFAST data governance standards require that data adjustments in regulatory submissions be documented with the rationale, approver, and alternative considered; when examiners request documentation for the manual overrides applied in the current DFAST cycle, the bank's team can provide email records and analyst memos for some decisions but not others, creating a data governance documentation gap for a regulatory submission with material capital adequacy implications.`,
    keywords: ['DFAST', 'BCBS 239', 'data governance', 'Federal Reserve', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },

  // ── Metadata & Lineage: Catalog, Glossary, DCAT/DCAM ────────────────────
  {
    code: 'B3425',
    name: 'Data Catalog Coverage Below BCBS 239 Minimum for Regulatory Datasets',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deployed an enterprise data catalog three years ago that covers 35% of the bank's total data assets, but only 18% of the datasets directly feeding regulatory reports — FR Y-9C, CCAR, and DFAST — have catalog entries with documented metadata, data owners, quality rules, and lineage information. BCBS 239 and DCAM maturity standards require that the data governance program maintain a complete and current catalog of all critical data elements and their source systems, with lineage documentation sufficient for independent verification; the gap between overall catalog coverage (35%) and regulatory dataset coverage (18%) signals that the catalog investment was directed toward business intelligence data rather than the regulatory reporting data that matters most to supervisory examiners.`,
    keywords: ['DCAM', 'BCBS 239', 'data catalog', 'data lineage', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'metadata-lineage',
  },
  {
    code: 'B3426',
    name: 'Business Glossary Divergence — Risk and Finance Use Different Definitions for Core Metrics',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's risk management function and finance function operate with different definitions of fundamental credit risk metrics — "outstanding balance," "committed exposure," and "classified asset" — with the risk team using definitions based on regulatory examination guidance and the finance team using definitions aligned with GAAP reporting standards, resulting in persistent metric divergence when DFAST outputs are compared against financial statement balances. DAMA-DMBOK and DCAM governance frameworks identify business glossary management as a foundational data governance capability that prevents metric divergence; without a governed business glossary that resolves definitional conflicts between the risk and finance domains, reconciliation between DFAST stress test outputs and audited financial statements requires manual analyst intervention in each reporting cycle.`,
    keywords: ['DAMA-DMBOK', 'DCAM', 'business glossary', 'BCBS 239', 'data governance'],
    demoRelevant: true,
    subTopic: 'metadata-lineage',
  },
  {
    code: 'B3427',
    name: 'Lineage Tracing Gap for CCAR Model Inputs — Upstream Data Sources Not Catalogued',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's CCAR capital planning models use approximately 200 input data variables sourced from eight internal systems and three external data providers, but only 60% of these inputs have documented lineage in the data catalog tracing their path from source system through transformation to model input. BCBS 239 and the DCAM data lineage capability domain require that model input data have complete, verified lineage to enable regulatory scrutiny of model assumptions and input data quality; when Federal Reserve examiners request lineage documentation for the six most material CCAR model inputs during examination, the bank can produce complete documentation for four and partial documentation for two, generating a CCAR model governance finding that is linked to the bank's broader BCBS 239 compliance gap.`,
    keywords: ['DCAM', 'data lineage', 'CCAR', 'BCBS 239', 'model governance'],
    demoRelevant: true,
    subTopic: 'metadata-lineage',
  },
  {
    code: 'B3428',
    name: 'Metadata Rot — Data Catalog Entries Not Refreshed After System Migrations',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's data catalog contains metadata entries for 800 datasets that were catalogued at program inception, but 34% of these entries have not been updated since the bank completed a loan origination system migration 18 months ago — meaning the catalog describes source system field names, data types, and quality rules that no longer correspond to the migrated system's schema. DAMA-DMBOK data stewardship requirements and DCAM governance standards require that metadata be maintained as a current, accurate description of the data assets it catalogs; stale metadata for regulatory reporting datasets creates a risk that data quality rules in the catalog no longer correspond to the actual data, causing automated data quality checks to produce false-positive quality scores for data that has not been validated against the new system schema.`,
    keywords: ['DAMA-DMBOK', 'DCAM', 'data catalog', 'metadata', 'data governance'],
    subTopic: 'metadata-lineage',
  },
  {
    code: 'B3429',
    name: 'BCBS 239 Lineage Verification Not Performed After Each Regulatory Report Production Cycle',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's BCBS 239 compliance program verified data lineage for the top 50 critical data elements at program launch but does not perform periodic re-verification of lineage after each regulatory report production cycle to confirm that system changes, ETL modifications, or data model updates have not broken the documented lineage paths. BCBS 239 governance principles and DCAM maturity standards require lineage to be maintained as a living, verified record rather than a point-in-time documentation artifact; a bank that verified lineage at program inception but has not re-verified it through three subsequent regulatory reporting cycles cannot assert with confidence that the lineage documentation reflects the current data production environment.`,
    keywords: ['BCBS 239', 'data lineage', 'DCAM', 'OCC guidance', 'data governance'],
    subTopic: 'metadata-lineage',
  },

  // ── AI Data Governance: LLM Cataloging, Scoring, Regulatory Drafting ────
  {
    code: 'B3430',
    name: 'LLM Data Catalog Enrichment Without Data Steward Sign-Off — Inaccurate Metadata Published',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an LLM-based data catalog enrichment tool that automatically generates dataset descriptions, business term mappings, and data quality rule suggestions by analyzing data samples and schema definitions; the enrichment output is published directly to the enterprise data catalog without requiring a data steward review and sign-off before publication. DAMA-DMBOK stewardship standards and BCBS 239 data accuracy requirements expect that metadata describing regulatory reporting datasets be reviewed by an accountable human data steward before it is treated as authoritative; when OCC examiners review the data catalog entries for FR Y-9C source datasets, they find LLM-generated descriptions that contain inaccurate field definitions, incorrect data type classifications, and business term mappings that conflict with the bank's governed business glossary — all published without data steward attestation.`,
    keywords: ['LLM data cataloging', 'DAMA-DMBOK', 'BCBS 239', 'data steward sign-off', 'data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3431',
    name: 'AI Data Quality Scoring Without Reconciliation Validation — Overconfident Quality Reports',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital uses an AI-powered data quality scoring tool that profiles datasets and assigns quality scores based on completeness, uniqueness, and format conformance checks against learned data patterns; the AI-generated quality scores for regulatory reporting datasets are used in board data quality dashboards without reconciling them against the independently measured reconciliation break rates between source systems. BCBS 239 data accuracy requirements and DAMA-DMBOK quality measurement standards require that data quality scores for regulatory reporting be grounded in independently verified reconciliation results rather than AI profiling algorithms that cannot detect semantic errors — values that are correctly formatted and complete but represent wrong business concepts; the AI quality scores for the CCAR source datasets show 98% quality while reconciliation breaks indicate 4% data discrepancies in the same datasets.`,
    keywords: ['BCBS 239', 'AI data quality scoring', 'DAMA-DMBOK', 'reconciliation', 'data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3432',
    name: 'GenAI Metadata Generation Without Golden Record Verification — Regulatory Dataset Contaminated',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's data engineering team uses a GenAI metadata generation tool to automatically create technical metadata — column descriptions, value domain definitions, and referential integrity rules — for new datasets loaded into the regulatory reporting data mart; the AI-generated metadata is applied to the datasets without comparing it against the bank's approved golden record definitions in the master data management system. DCAM data architecture standards and BCBS 239 governance principles require that metadata for regulatory reporting datasets be consistent with the enterprise master data definitions to prevent definitional divergence between reporting systems; GenAI-generated metadata that contradicts golden record definitions introduces semantic inconsistency into the regulatory reporting data mart that causes automated data quality rules to pass invalid data.`,
    keywords: ['GenAI metadata generation', 'DCAM', 'BCBS 239', 'golden record', 'data governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3433',
    name: 'AI Regulatory Report Drafting Without Data Lineage Audit — OCC Submission Risk',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's regulatory reporting team uses an AI drafting tool to generate narrative sections of the quarterly Call Report and the CCAR capital plan, with the tool automatically populating numerical disclosures by extracting figures from the bank's internal risk reports; the AI-generated regulatory draft is reviewed and submitted without a mandatory data lineage audit confirming that each figure in the AI output is traced to its authorized source system and has passed data quality validation. OCC guidance on regulatory reporting accuracy and BCBS 239 data governance standards require that submitted regulatory figures be traceable to their source; an AI drafting workflow without a lineage audit creates a risk that the tool extracts figures from preliminary or unvalidated data versions, producing regulatory submissions that do not reflect the bank's audited financial data — a regulatory reporting accuracy violation.`,
    keywords: ['AI regulatory drafting', 'FR Y-9C', 'BCBS 239', 'OCC guidance', 'data lineage audit'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3434',
    name: 'Automated CDE Classification AI Without Legal Data Classification Review',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital deploys an ML-based critical data element classification tool that automatically assigns sensitivity, regulatory scope, and retention classification to newly ingested datasets by analyzing field names, sample values, and context signals; the classification decisions are applied without routing regulatory datasets through the bank's legal and compliance team for data classification review as required by the bank's data governance policy. DAMA-DMBOK data security and privacy governance frameworks require that data classification for regulatory and sensitive datasets involve legal review to confirm that privacy, confidentiality, and regulatory retention obligations are correctly applied; automated CDE classification without legal review creates a risk that personally identifiable information in CCAR stress test datasets is under-classified and subject to insufficient access controls under SR 11-7 model governance requirements.`,
    keywords: ['automated CDE classification', 'DAMA-DMBOK', 'BCBS 239', 'SR 11-7', 'data classification'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3435',
    name: 'LLM Business Glossary Alignment Tool Introduces Definitional Drift Without Governance Review',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital uses an LLM-based tool to suggest updates to the enterprise business glossary by analyzing usage patterns in internal reports and data catalogs and identifying terms whose definitions appear to have evolved from the approved glossary definitions; the tool automatically publishes suggested glossary updates to a staging environment where a data analyst approves them without requiring sign-off from the business domain owner or a data governance committee review. DAMA-DMBOK and DCAM governance standards require that business glossary updates for regulatory metric definitions be reviewed and approved through the formal governance process before publication, as glossary changes for terms used in BCBS 239 CDEs can propagate into data quality rules, reconciliation logic, and regulatory report preparation with unintended downstream effects.`,
    keywords: ['LLM glossary alignment', 'DAMA-DMBOK', 'DCAM', 'BCBS 239', 'business glossary'],
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3436',
    name: 'AI Data Lineage Mapping Tool Not Validated Against Manual Tracing — Lineage Gaps Undetected',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital acquires an AI-powered data lineage mapping tool that automatically discovers and documents data flows between source systems, ETL pipelines, and reporting datasets by scanning database logs and SQL query history; the tool's lineage maps are adopted as the bank's BCBS 239 lineage documentation without performing a validation exercise comparing the AI-discovered lineage against manually traced lineage for a sample of critical data elements. BCBS 239 Principle 2 and DCAM lineage capability standards require that lineage documentation be verified for accuracy, not merely generated; validation of the AI tool on a sample of 20 CDEs reveals that the automated discovery missed 30% of lineage hops where data flowed through unstructured file transfers and email-based manual processes — gaps that would leave the bank's BCBS 239 lineage documentation materially incomplete.`,
    keywords: ['BCBS 239', 'AI data lineage', 'DCAM', 'data governance', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3437',
    name: 'GenAI Data Quality Rule Generation Produces Rules Inconsistent With Regulatory Validation Standards',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses a GenAI tool to automatically generate data quality validation rules for new datasets added to the regulatory reporting data mart, with the tool producing SQL-based quality checks based on field definitions and sample data analysis; the AI-generated rules are deployed to the production data quality engine without having been reviewed by the regulatory reporting team to confirm that the rules align with the regulatory validation standards specified in the FR Y-9C and CCAR data definitions. DAMA-DMBOK quality rule governance and BCBS 239 data accuracy standards require that quality rules for regulatory reporting datasets reflect the regulatory definitions rather than statistical patterns in the data; GenAI-generated rules optimized for statistical consistency pass records that violate regulatory field definitions, producing false-positive quality certifications for data that does not meet OCC reporting standards.`,
    keywords: ['GenAI quality rules', 'DAMA-DMBOK', 'BCBS 239', 'FR Y-9C', 'data governance'],
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3438',
    name: 'AI NLP Data Contract Extraction Not Reviewed by Legal Before Populating Data Catalog',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital deploys an AI NLP tool to extract data sharing terms, permitted use clauses, and retention requirements from third-party data vendor contracts and populate the enterprise data catalog with the extracted terms to govern how external data is used in regulatory reporting models; the AI-extracted contractual terms are applied as data governance constraints without a legal review to confirm that the extraction is accurate and that the permitted use determinations are legally defensible. DAMA-DMBOK data governance standards and OCC third-party risk management guidance (OCC 2013-29) require that contractual data use restrictions be reviewed and applied by legal counsel, not automated extraction tools; when an AI-extracted "unrestricted use" term from a credit bureau data contract conflicts with the contract's actual terms — which exclude use in model training — the bank faces a data vendor contract breach and potential CFPB examination exposure.`,
    keywords: ['AI NLP data contracts', 'DAMA-DMBOK', 'OCC 2013-29', 'data governance', 'third-party data'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3439',
    name: 'AI CCAR Narrative Drafting Without Senior Finance Sign-Off — Regulatory Submission Integrity Risk',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital uses an AI drafting tool to generate the qualitative narrative sections of the CCAR capital plan, including the capital adequacy assessment narrative and the description of the bank's internal capital adequacy assessment process; the AI-generated narratives are reviewed by a junior finance analyst and submitted to the Federal Reserve without a senior finance or CRO sign-off attestation confirming that the narrative accurately represents the bank's actual risk management practices and capital planning processes. Federal Reserve CCAR submission requirements and BCBS 239 reporting governance standards require that the qualitative narrative be attested by senior management with direct knowledge of the described processes; an AI-generated narrative submitted without senior attestation creates a risk that the Federal Reserve's qualitative CCAR assessment finds the narrative inconsistent with examination findings, resulting in a CCAR objection grounded in narrative inaccuracy.`,
    keywords: ['CCAR', 'AI regulatory drafting', 'BCBS 239', 'Federal Reserve', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3440',
    name: 'AI Data Governance Maturity Assessment Not Benchmarked Against DCAM Standards',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital uses an AI-powered data governance maturity assessment tool that evaluates the bank's data governance capabilities across policy, stewardship, quality, and lineage dimensions and produces a maturity score; the assessment results are reported to the board as the bank's data governance maturity level without benchmarking the AI tool's scoring methodology against the DCAM (Data Management Capability Assessment Model) or DAMA-DMBOK capability frameworks that OCC and Federal Reserve examiners reference. BCBS 239 governance and OCC data governance examination practice use DCAM as a reference framework for assessing bank data governance capability; an AI-derived maturity score that is not calibrated to DCAM standards may present a favorable maturity picture that does not correspond to the DCAM-equivalent maturity level that examiners would assign during an examination.`,
    keywords: ['DCAM', 'AI maturity assessment', 'BCBS 239', 'DAMA-DMBOK', 'OCC guidance'],
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3441',
    name: 'LLM Model Input Data Cataloging Generates Incomplete Lineage for SR 11-7 Validation',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's model risk management team uses an LLM tool to automatically document the input data requirements for newly registered models in the SR 11-7 model inventory, generating catalog entries describing each model's data inputs, source systems, and data quality requirements by analyzing model code and validation documentation; the LLM-generated catalog entries are accepted as complete model input documentation without a validation step confirming that the LLM has correctly identified all upstream data dependencies. SR 11-7 model documentation standards and BCBS 239 lineage requirements for model inputs demand that model input data documentation be verified against the actual data flows feeding the model; the LLM misses several indirect data dependencies — particularly intermediate aggregation tables and manual override inputs — causing SR 11-7 validation to proceed without complete input data lineage, leaving a model governance gap that the MRM consent order's validation milestone remediation is designed to close.`,
    keywords: ['LLM model input cataloging', 'SR 11-7', 'BCBS 239', 'data lineage', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3442',
    name: 'AI Automated Data Steward Assignment Without Domain Expert Review — Accountability Gaps',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital deploys an AI tool that analyzes dataset access patterns, query histories, and organizational charts to automatically assign data steward roles to employees for newly catalogued datasets; the AI-assigned stewardships are activated without requiring the assigned employee's acceptance or a review by the business domain head confirming that the assignment reflects the employee's actual domain knowledge and accountability for the data. DAMA-DMBOK stewardship governance and BCBS 239 accountability requirements specify that data steward assignments reflect genuine business domain accountability rather than technical data access patterns; AI-assigned stewards who lack the domain knowledge to make governance decisions on regulatory reporting datasets create an accountability gap where the data governance framework assigns responsibility but does not create the subject matter expertise needed to exercise it.`,
    keywords: ['DAMA-DMBOK', 'BCBS 239', 'data steward assignment', 'DCAM', 'data governance'],
    subTopic: 'ai-data-governance',
  },

  // ── Additional BCBS 239 Patterns ──────────────────────────────────────────
  {
    code: 'B3443',
    name: 'BCBS 239 Self-Assessment Not Validated by Independent Review Function',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital completes an annual BCBS 239 self-assessment that is prepared by the data governance office and reports compliance levels for each of the 11 principles to the board; the self-assessment is not subject to independent validation by internal audit or an external third party, creating a risk that the reported compliance levels reflect the data governance team's aspirational assessment rather than an objectively measured capability level. BCBS 239 implementation guidance from the Basel Committee and OCC horizontal examination practice require that banks' BCBS 239 self-assessments be supported by evidence testing — sampling actual data quality measurements, lineage verification, and reporting timeliness records against the claimed compliance levels; when OCC examiners conduct evidence testing against the self-assessment, they find that three principles reported as "compliant" fail basic evidence checks.`,
    keywords: ['BCBS 239', 'OCC guidance', 'data governance', 'independent review', 'self-assessment'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3444',
    name: 'Risk Data Aggregation Reporting Frequency Not Aligned With Board Risk Appetite Statement',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's board risk appetite statement establishes that the board will receive aggregated credit risk and liquidity risk reporting on a monthly basis with the capability for weekly reporting when risk appetite thresholds are approached; the bank's actual aggregated risk reporting infrastructure can only produce consolidated reports on the monthly batch cycle with no capability to accelerate to weekly frequency without a manual data production process. BCBS 239 Principles 5 and 6 require that risk aggregation be capable of meeting the reporting frequency specified in the board's risk appetite framework and that on-demand reporting be achievable under stress scenarios; a gap between the stated reporting capability in the risk appetite statement and the bank's operational reporting capability means the board's oversight framework is built on a frequency commitment that cannot be operationally fulfilled.`,
    keywords: ['BCBS 239', 'risk data aggregation', 'board reporting', 'Federal Reserve', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3445',
    name: 'BCBS 239 Taxonomy of Risk Types Not Consistently Applied Across Risk Reporting Systems',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's credit risk, market risk, and liquidity risk reporting systems use different taxonomies for categorizing exposure types, business lines, and geographic regions — with the credit risk system using the bank's commercial product taxonomy, the market risk system using a trading desk taxonomy, and the liquidity risk system using a regulatory reporting taxonomy. BCBS 239 Principle 2 requires a consistent taxonomy across risk types to enable cross-risk aggregation and consolidated enterprise risk views; the taxonomy inconsistency means that producing a consolidated enterprise risk report — required for CCAR and DFAST submissions — requires a manual mapping layer that the Federal Reserve identifies as a data governance deficiency because the bank cannot demonstrate automated, consistent risk aggregation across all material risk dimensions.`,
    keywords: ['BCBS 239', 'risk taxonomy', 'data governance', 'CCAR', 'Federal Reserve'],
    subTopic: 'bcbs-239',
  },
  {
    code: 'B3446',
    name: 'Data Governance Program Funding Tied to IT Budget — Not Independent Risk Oversight Function',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's enterprise data governance program is funded from the IT department budget and the data governance office reports to the Chief Information Officer, creating a structural dependency where data governance investment decisions are made by the technology function rather than the risk oversight function accountable for regulatory data quality. DAMA-DMBOK and DCAM program governance frameworks recommend that data governance for regulatory reporting be funded and positioned as a risk function with reporting relationships to the CRO or CFO, ensuring that investment priorities reflect regulatory risk rather than IT project economics; an IT-funded data governance program is subject to IT budget cycles and technology prioritization tradeoffs that can deprioritize BCBS 239 data quality remediation in favor of infrastructure and security projects.`,
    keywords: ['DAMA-DMBOK', 'DCAM', 'data governance', 'BCBS 239', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'data-architecture',
  },
  {
    code: 'B3447',
    name: 'Critical Data Element Quality Thresholds Not Recalibrated After Regulatory Guidance Update',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital established BCBS 239 data quality thresholds for each critical data element in 2021 based on then-current regulatory guidance and peer benchmarking; the thresholds have not been recalibrated following the Federal Reserve's 2023 CCAR data governance guidance update, the OCC's 2024 horizontal examination findings on data quality, or the Basel Committee's 2024 BCBS 239 implementation review findings, all of which raised the expected quality standards for credit risk and liquidity CDEs. BCBS 239 governance requirements and DCAM maturity standards expect that data quality thresholds evolve with regulatory expectations and examination findings; outdated thresholds calibrated to 2021 standards cause the bank to report BCBS 239 compliance against a lower quality bar than current regulatory expectations require.`,
    keywords: ['BCBS 239', 'critical data element', 'DCAM', 'OCC guidance', 'Federal Reserve'],
    subTopic: 'data-architecture',
  },

  // ── Additional Regulatory Reporting Patterns ──────────────────────────────
  {
    code: 'B3448',
    name: 'FR Y-9C Schedule HC-C Reconciliation Not Automated — Manual Process With No Audit Trail',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital reconciles the loan and lease schedules in the FR Y-9C (Schedule HC-C) against the general ledger and loan system through a quarterly manual process that produces a reconciliation workpaper signed off by the reporting analyst; the reconciliation is performed in Excel without an automated workflow or audit trail documenting the source of reconciliation differences, the resolution applied, and the approver who accepted the resolution. BCBS 239 data accuracy requirements and OCC regulatory reporting governance standards expect that reconciliation controls for material regulatory schedules be automated, reproducible, and subject to documented approval; a manual Excel reconciliation without a systematic audit trail cannot satisfy OCC examination scrutiny of the bank's regulatory reporting control environment, particularly for a bank under a consent order with heightened supervisory expectations.`,
    keywords: ['FR Y-9C', 'reconciliation', 'BCBS 239', 'OCC guidance', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3449',
    name: 'CCAR Capital Plan Data Submission Late Due to Data Quality Remediation Sprint Length',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital has required a 6–8 week data quality remediation sprint in each of the last three CCAR submission cycles to bring data completeness and accuracy to the threshold required for submission, consuming 40% of the 12-week CCAR production timeline for data remediation rather than analytical model production and narrative development. BCBS 239 governance and the Federal Reserve's CCAR submission requirements expect that data production for capital planning submissions be automated and reliable, not dependent on recurring large-scale remediation sprints; the recurring remediation sprint pattern is evidence that BCBS 239 data quality investments have not achieved durable improvement in the regulatory reporting data infrastructure, and the Federal Reserve's CCAR examination uses the sprint length as a proxy indicator for the maturity of the bank's data governance program.`,
    keywords: ['CCAR', 'BCBS 239', 'data quality', 'Federal Reserve', 'data governance'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3450',
    name: 'XBRL Taxonomy Version Mismatch in Call Report Filing — Automated Validation Not Configured',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's XBRL filing tool is configured to use a prior-year XBRL taxonomy version for Call Report submissions, and the bank does not run an automated pre-submission check verifying that the taxonomy version applied matches the current reporting period's required taxonomy version published by the Federal Financial Institutions Examination Council. FFIEC XBRL reporting requirements and OCC data quality standards expect that banks apply the current taxonomy and validate their XBRL output before submission; when the FFIEC updates taxonomy definitions for new capital measures and First Capital submits reports using the old taxonomy, the FFIEC's automated validation system rejects the submission and requires a resubmission, creating a 10-day delay and an examiner inquiry into the bank's regulatory reporting quality controls.`,
    keywords: ['XBRL', 'FR Y-9C', 'BCBS 239', 'OCC guidance', 'FFIEC'],
    subTopic: 'regulatory-reporting',
  },
  {
    code: 'B3451',
    name: 'Basel III RWA Reporting Inputs Not Reconciled to Balance Sheet Before Submission',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's regulatory capital reporting team calculates risk-weighted assets under Basel III standardized approach using inputs drawn from the risk data aggregation platform, but does not perform a pre-submission reconciliation confirming that the total Basel III exposure measure reconciles to the balance sheet total reported in the FR Y-9C. Basel III Pillar 3 disclosure requirements and OCC capital adequacy reporting standards require that RWA submissions be reconcilable to audited financial statements; the absence of a balance sheet reconciliation step means that a $340M discrepancy between the risk platform's exposure aggregate and the general ledger balance — caused by a timing difference in the recognition of one large syndicated credit — is submitted to the Federal Reserve without detection, creating a regulatory capital misstatement.`,
    keywords: ['Basel III', 'RWA', 'FR Y-9C', 'BCBS 239', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'regulatory-reporting',
  },

  // ── Additional Data Quality Patterns ─────────────────────────────────────
  {
    code: 'B3452',
    name: 'Data Quality Issue Escalation Path Not Defined — Unresolved Issues Accumulate Without Owner',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's data quality management process identifies and logs data quality issues through automated monitoring, but the escalation path for unresolved issues — when a data quality owner fails to remediate an issue within the defined SLA — is not defined, resulting in a backlog of 200+ open data quality issues in the governance tracking system with no assigned escalation owner. DAMA-DMBOK governance frameworks and BCBS 239 data quality accountability standards require that data quality issue escalation paths be explicit, with defined timelines and executive escalation triggers to ensure that issues affecting regulatory reporting are resolved with appropriate urgency; an issue backlog without a defined escalation path signals a data governance operating model gap that OCC examiners identify when reviewing the bank's data quality control environment.`,
    keywords: ['DAMA-DMBOK', 'BCBS 239', 'data quality', 'OCC guidance', 'data governance'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3453',
    name: 'MDM Golden Record Rules Not Applied Consistently Across All Consuming Systems',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's master data management system maintains golden record rules that define the authoritative value for shared reference data — customer legal name, tax identification number, industry classification — but three downstream systems that consume MDM data apply their own local overrides that supersede the golden record values when local data differs. BCBS 239 data accuracy requirements and DAMA-DMBOK MDM governance standards require that golden record values be applied consistently across all consuming systems to prevent definitional drift that undermines consolidated risk reporting; when the CCAR credit risk aggregation platform applies the MDM golden record industry classification while the DFAST model applies a local override, the two submissions may produce different sector concentration figures from the same underlying portfolio.`,
    keywords: ['MDM', 'BCBS 239', 'DAMA-DMBOK', 'golden record', 'data governance'],
    subTopic: 'data-quality',
  },
  {
    code: 'B3454',
    name: 'Data Quality Exception Reporting Not Included in Board Risk Committee Materials',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's data quality exception reports — which track the number, severity, and resolution status of data quality issues in the regulatory reporting data environment — are produced monthly by the data governance team but are not included in the board risk committee's quarterly information package, meaning board oversight of data quality is limited to the CIO's semi-annual technology update. BCBS 239 board governance requirements and DAMA-DMBOK executive reporting standards require that material data quality exceptions — particularly those affecting CCAR, DFAST, and regulatory capital reporting — be visible to the board through formal risk committee reporting; without board-level visibility, data quality deterioration in the regulatory reporting environment can persist for multiple reporting cycles without triggering the governance escalation and resource allocation needed to address systemic issues.`,
    keywords: ['BCBS 239', 'data quality', 'DAMA-DMBOK', 'board reporting', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },
  {
    code: 'B3455',
    name: 'Third-Party Data Quality Monitoring Not Performed for Vendor-Sourced Regulatory Inputs',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital uses three external data vendors — a credit bureau, a property valuation service, and a macroeconomic data provider — whose data feeds directly into CCAR capital planning models and CECL macroeconomic scenario development; the bank applies data quality monitoring to internal data sources but does not monitor the quality of the vendor-sourced data feeds or establish contractual data quality SLAs with the vendors. DAMA-DMBOK third-party data governance standards and OCC 2013-29 third-party risk management guidance require that data quality monitoring extend to external data dependencies, particularly those used in regulatory capital and stress testing models; an external data quality failure — such as the macroeconomic vendor providing a revised dataset mid-CCAR cycle without notification — can propagate into the capital plan submission without detection by the bank's internal quality controls.`,
    keywords: ['DAMA-DMBOK', 'OCC 2013-29', 'third-party data', 'CCAR', 'BCBS 239'],
    demoRelevant: true,
    subTopic: 'data-quality',
  },

  // ── Additional Metadata & Lineage Patterns ────────────────────────────────
  {
    code: 'B3456',
    name: 'Impact Analysis Capability Not Operational — System Changes Deployed Without Downstream Lineage Review',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's data governance program documents BCBS 239 data lineage for critical data elements but does not operationalize an impact analysis capability that identifies which downstream regulatory reports and models are affected before a source system change is deployed. BCBS 239 and DCAM lineage governance standards require that lineage documentation be operational — usable by IT change management to assess the downstream impact of proposed data changes before deployment; without impact analysis, core banking system field-level changes are deployed through the standard IT change process without alerting the regulatory reporting team, resulting in three instances in the past 18 months where a core system change broke a CCAR model input without immediate detection.`,
    keywords: ['BCBS 239', 'DCAM', 'data lineage', 'impact analysis', 'data governance'],
    demoRelevant: true,
    subTopic: 'metadata-lineage',
  },
  {
    code: 'B3457',
    name: 'Data Dictionary Not Maintained as Single Source of Truth — Multiple Competing Versions',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital maintains three separate data dictionaries — a technical data dictionary in the IT department, a regulatory reporting data dictionary maintained by the finance team, and a risk model data dictionary maintained by the MRM team — that describe the same underlying data fields with different names, definitions, and data type specifications, and are not synchronized with each other or with the enterprise data catalog. DAMA-DMBOK and DCAM data architecture standards require a single governed source of truth for data definitions that all teams reference; when OCC examiners reviewing the bank's BCBS 239 compliance ask for a data dictionary for the CCAR submission data, the bank produces three documents with conflicting definitions for 40 shared data elements, creating an examination finding that the bank's data governance program lacks the foundational architecture required for BCBS 239 compliance.`,
    keywords: ['DAMA-DMBOK', 'DCAM', 'data dictionary', 'BCBS 239', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'metadata-lineage',
  },
  {
    code: 'B3458',
    name: 'AI-Powered Sensitive Data Discovery Tool Misclassifies Regulatory Report Fields',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital uses an AI-powered sensitive data discovery tool to scan datasets for personally identifiable information and assign access control classifications; the tool misclassifies several FR Y-9C preparation tables — which contain aggregated financial data with no PII — as highly sensitive based on pattern matching that incorrectly identifies account balance fields as personal financial data. DAMA-DMBOK data security governance and BCBS 239 data governance standards require that data classification be accurate to enable appropriate access controls; the AI-driven misclassification causes the bank's regulatory reporting team to be assigned restricted access to their own CCAR preparation tables, delaying report production by three days per cycle as access permissions are manually reviewed and corrected — with no automated feedback loop to improve the AI classifier's accuracy on regulatory datasets.`,
    keywords: ['AI data discovery', 'DAMA-DMBOK', 'BCBS 239', 'FR Y-9C', 'data governance'],
    subTopic: 'ai-data-governance',
  },
  {
    code: 'B3459',
    name: 'Data Governance Maturity Not Sufficient to Support Basel III Pillar 3 Disclosure Quality',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's Basel III Pillar 3 public disclosures — which include quantitative RWA, capital, and leverage ratio tables and qualitative risk management descriptions — are produced from the same data infrastructure that supports DFAST and CCAR, but the data governance controls applied to Pillar 3 production are less rigorous than for supervisory filings, resulting in disclosures that do not reconcile to the contemporaneous FR Y-9C and Call Report filings. Basel III Pillar 3 disclosure requirements and OCC capital adequacy guidance require that Pillar 3 disclosures be consistent with and reconcilable to supervisory submissions; when investors and analysts identify Pillar 3 RWA figures that diverge from the Federal Reserve's public capital planning data, the bank's investor relations team cannot immediately explain the discrepancy, creating market confidence risk that compounds the reputational impact of the bank's existing consent order.`,
    keywords: ['Basel III', 'Pillar 3', 'BCBS 239', 'OCC guidance', 'data governance'],
    demoRelevant: true,
    subTopic: 'bcbs-239',
  },
];
