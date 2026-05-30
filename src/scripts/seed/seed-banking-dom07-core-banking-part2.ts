// seed-banking-dom07-core-banking-part2.ts
// Banking genome patterns — Core Banking Modernisation (Part 2)
// Code range: B1960–B2019  (60 patterns)
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

export const BANKING_CORE_BANKING_PART2_PATTERNS: PatternSeed[] = [

  // ── testing-validation ─────────────────────────────────────────────────────
  {
    code: 'B1960',
    name: 'UAT Scope Excludes Regulatory Report Validation for Call Report Fields',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's user acceptance testing scope for its core banking migration focuses on deposit and loan transaction workflows but does not include structured UAT scenarios validating Call Report Schedule RC and RC-C field extraction from the new core platform's data model. When the bank's first post-migration Call Report is due, the finance and regulatory reporting team discovers that 8 data elements used to populate Schedule RC-C commercial real estate loan classifications do not map correctly from the new core's loan category schema, requiring 11 days of manual reconciliation after the original filing deadline. OCC examination guidance expects banks to validate all regulatory reporting data extracts as part of go-live acceptance criteria; treating regulatory report validation as a post-launch activity creates a compliance continuity gap.`,
    keywords: ['OCC', 'Call Report', 'UAT scope', 'FFIEC IT Handbook', 'regulatory reporting validation'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },
  {
    code: 'B1961',
    name: 'Regression Test Coverage Gap for HMDA Data Extraction Logic',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's regression test suite for its new core banking platform covers 89% of deposit and payment processing functions but omits regression coverage for the HMDA Loan Application Register data extraction logic — which maps loan origination, denial, and withdrawal dispositions from the core to the HMDA LAR file format. A platform patch applied three months post-go-live alters the loan status field encoding, breaking HMDA disposition mapping without triggering a test failure because no regression test validates HMDA extraction outcomes. The bank submits an HMDA LAR with systematic misclassification of incomplete application dispositions that the CFPB identifies in its annual HMDA filing review, generating a supervisory finding and a corrected resubmission requirement.`,
    keywords: ['FFIEC IT Handbook', 'HMDA', 'regression testing', 'core banking', 'CFPB'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },
  {
    code: 'B1962',
    name: 'Performance Testing Peak Load Scenario Excludes Month-End Batch Concurrency',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's core banking performance testing simulates intraday peak debit authorization volumes but does not model the concurrent execution of month-end batch processing — interest posting, statement generation, and GL extract jobs — running simultaneously with real-time transaction processing. During the first month-end close on the new platform, batch job CPU and I/O contention with live debit authorization processing causes authorization response times to degrade to 8 seconds, resulting in merchant timeout-triggered declines for 14,000 customers. The FFIEC IT Handbook's Development and Acquisition booklet requires performance testing to reflect realistic production load combinations, including concurrent batch and online transaction processing; testing only peak online volumes without batch concurrency is a structural gap in the testing programme.`,
    keywords: ['FFIEC IT Handbook', 'performance testing', 'batch concurrency', 'core banking', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },
  {
    code: 'B1963',
    name: 'User Acceptance Criteria Misaligned with Commercial Treasury Business Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking UAT acceptance criteria are written by the programme's IT workstream leads in collaboration with the core banking vendor, producing test pass/fail criteria grounded in platform functionality specification rather than commercial banking business requirements. The treasury management business unit's requirements — including intraday liquidity position reporting, controlled disbursement cut-off processing, and zero-balance account sweeping — are not translated into UAT acceptance criteria because the treasury product managers are not included in the acceptance criteria development process. When the platform goes live, commercial treasury clients identify 12 functional gaps in the first 30 days that the UAT had accepted as passed, triggering a post-go-live remediation programme that the programme's business case did not fund.`,
    keywords: ['FFIEC IT Handbook', 'UAT acceptance criteria', 'treasury management', 'core banking', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },
  {
    code: 'B1964',
    name: 'End-to-End Payment Rail Testing Does Not Cover NACHA Return Reason Codes',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's integration testing for ACH processing on the new core banking platform validates origination and receipt of standard ACH credit and debit transactions but does not include test scenarios for ACH return reason codes R02 (account closed), R06 (returned per ODFI request), R29 (corporate customer advises not authorized), and R51 (item related to RCK entry not eligible) — return codes that require specific system actions under NACHA Operating Rules. When the bank's ACH return processing encounters these codes in production, incorrect automated handling generates rule violations flagged by the bank's ACH operator, requiring a Regulation E analysis and NACHA self-audit submission within 90 days. FFIEC examination guidance and NACHA Operating Rules require financial institutions to test return processing for all applicable reason codes before activating ACH origination on a new platform.`,
    keywords: ['NACHA', 'ACH returns', 'FFIEC IT Handbook', 'core banking testing', 'Reg E'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },
  {
    code: 'B1965',
    name: 'Penetration Testing Excludes New Core API Gateway Before Production Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's pre-go-live security testing programme includes penetration testing for the digital banking mobile application and the legacy corporate intranet but does not extend the penetration test scope to the new core banking API gateway — the component that mediates all channel access to customer account data, balance inquiry, and payment origination. The programme team treats the API gateway as a vendor-managed component covered by the vendor's SOC 2 Type II report, which does not include bank-specific penetration test findings. The FFIEC Cybersecurity Assessment Tool and FFIEC IT Handbook's Information Security booklet require banks to test the security of all production-bound systems before activation; omitting the API gateway from penetration testing leaves the bank unable to attest to the security of its primary customer data exposure point.`,
    keywords: ['FFIEC IT Handbook', 'penetration testing', 'API gateway security', 'core banking', 'OCC'],
    subTopic: 'testing-validation',
  },
  {
    code: 'B1966',
    name: 'CRA Examination Readiness Testing Not Included in Migration Acceptance Criteria',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's core banking migration acceptance criteria do not include a CRA examination readiness test — a structured validation that the new core can produce the loan, deposit, and community development activity data required for OCC CRA examination preparation. The absence of CRA readiness testing is treated as post-go-live housekeeping; when First Capital's scheduled CRA examination begins 14 months after go-live, the CRA data team discovers that the new core's community development loan coding schema does not support the OCC's CRA examination data request format, requiring 7 weeks of data engineering work to produce the examination file. CRA examination readiness is an ongoing obligation under 12 CFR 25; a migration that interrupts the bank's ability to produce accurate CRA examination data is a regulatory compliance gap that the OCC examines under its CRA supervisory programme.`,
    keywords: ['CRA', 'OCC', 'FFIEC IT Handbook', 'core banking migration', 'examination readiness'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },
  {
    code: 'B1967',
    name: 'Stress Testing Under Simulated Core Outage Not Performed Before Cutover',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's pre-go-live testing validates functional correctness and performance under normal operating conditions but does not execute a structured stress test that simulates partial core platform failure — such as loss of one node in a clustered database configuration — while transaction processing continues. The bank does not discover until a production incident eight months post-migration that a single database node failure causes the remaining cluster to degrade to 18% of normal throughput due to a query routing misconfiguration, rather than the expected 50% graceful degradation. The FFIEC IT Handbook's Business Continuity Management booklet requires that resilience testing include degraded-mode scenarios that validate whether the system behaves as designed under partial failure conditions; omitting stress failure testing gives the bank unwarranted confidence in its resilience posture.`,
    keywords: ['FFIEC IT Handbook', 'stress testing', 'resilience testing', 'core banking', 'OCC Bulletin 2013-29'],
    subTopic: 'testing-validation',
  },
  {
    code: 'B1968',
    name: 'Accessibility Testing for New Core UI Excludes ADA Compliance Validation',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital's core banking platform introduces a new teller and customer service representative workstation UI that the programme team tests for functional completeness but does not subject to ADA Section 508 or WCAG 2.1 accessibility validation. Branch staff with visual impairments who rely on screen reader software cannot navigate the new UI's account inquiry and transaction posting workflows, creating a workforce accommodation issue under the Americans with Disabilities Act and a customer service continuity gap for branches using assistive technology. The FFIEC's consumer compliance examination programme and OCC workplace accommodation expectations require banks to validate that technology changes do not reduce accessibility for staff or customers; deferring accessibility testing creates both legal exposure and operational risk.`,
    keywords: ['FFIEC IT Handbook', 'ADA Section 508', 'accessibility testing', 'core banking UI', 'OCC'],
    subTopic: 'testing-validation',
  },
  {
    code: 'B1969',
    name: 'Automated Test Environment Not Refreshed With Production Data Volumes Before UAT',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's UAT environment for its core banking platform is populated with a 2% sample of production data — approximately 45,000 accounts — rather than a full production data volume replica, because the team wants to avoid the time and cost of a full data load before UAT. UAT defects relating to account summary aggregation performance, bulk statement generation timing, and GL period-end extract completeness are not detected because the UAT data volume is too small to exhibit the performance and completeness behaviors that emerge at full production scale. The FFIEC IT Handbook's Development and Acquisition booklet requires that test environments be representative of production conditions; a 2% data volume sample is not representative for a core banking system where batch processing behavior is a function of total account volume.`,
    keywords: ['FFIEC IT Handbook', 'UAT environment', 'production data volume', 'core banking testing', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'testing-validation',
  },

  // ── data-cutover ───────────────────────────────────────────────────────────
  {
    code: 'B1970',
    name: 'Balance Sheet Reconciliation at Cutover Not Completed Before Go-Live Commit',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital initiates its core banking cutover without completing a certified balance sheet reconciliation between the legacy core extract and the new platform's loaded balances — accepting a $3.1M unresolved variance as a post-go-live adjustment item rather than a cutover gate. The programme team estimates the variance will resolve within 5 business days; it takes 31 days, during which the new core's GL is carrying an unadjusted balance that flows into the bank's daily Federal Reserve balance reporting. SOX 404 internal control requirements and the FFIEC IT Handbook's Development and Acquisition booklet establish that balance sheet reconciliation completion is a prerequisite — not a follow-on activity — for core banking go-live; accepting a material GL variance as a post-migration adjustment item is a control deficiency that external auditors examine during their IT general controls review.`,
    keywords: ['SOX 404', 'FFIEC IT Handbook', 'balance sheet reconciliation', 'core banking cutover', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1971',
    name: 'Interest Accrual Cutover Calculation Gap Produces Incorrect Loan Payment Notices',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's cutover accrual calculation for fixed-rate mortgage loans uses a mid-period accrual snapshot that captures only the interest accrued from the last statement date to cutover midnight — without including the partial accrual for the current billing cycle that the legacy system tracked in a separate accrual register. The result is that 4,800 mortgage customers receive incorrect next-payment notices showing amounts $18–$45 lower than their actual contractual obligations, creating Reg Z disclosure accuracy violations and requiring a customer communication programme to issue corrected notices. FFIEC examination guidance for loan data migration requires banks to validate accrual continuity across the cutover boundary as a migration acceptance criterion, not a post-migration cleanup item.`,
    keywords: ['Reg Z', 'FFIEC IT Handbook', 'interest accrual', 'core banking cutover', 'data migration integrity'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1972',
    name: 'Loan Covenant Data Migration Completeness Not Independently Verified at Cutover',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's cutover readiness checklist includes a self-certification by the migration team that covenant data has been fully migrated for the commercial loan portfolio, but does not require an independent verification — such as a sample-based audit by the credit risk team comparing migrated covenant structures against the original credit approval documentation. Post-cutover, credit officers identify that 180 commercial credit facilities are missing one or more covenant conditions in the new core's covenant management module because the legacy system stored covenant sub-conditions in a relationship table not included in the migration extract specification. The bank's OCC-examined credit risk management programme requires complete covenant tracking for all commercial credit exposures above $1M; gaps in covenant data completeness create examination findings under the OCC's Loan Portfolio Management handbook.`,
    keywords: ['OCC', 'loan covenant', 'data migration integrity', 'FFIEC IT Handbook', 'commercial credit risk'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1973',
    name: 'Historical Transaction Archive Accessibility Not Tested Before Legacy Decommission Gate',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking migration programme gates legacy decommission on completion of the data archival project — which migrates pre-migration transaction history to an archive storage environment — but does not include a test requirement that the archived data be retrievable using the bank's fraud investigation and regulatory examination tools before granting decommission approval. The programme approves decommission based on archival completion metrics (GB transferred, record counts matched) rather than on demonstrated retrieval functionality. When the OCC requests a 6-year transaction history for 14 commercial accounts during an examination 18 months post-migration, the bank's compliance team cannot produce the records from the archive because the retrieval interface was never built — the data exists in storage but is inaccessible without a data engineering engagement.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'data archival', 'records retention', 'core banking decommission'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1974',
    name: 'Cutover Day Reconciliation Window Insufficient for Large Commercial Portfolio',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's cutover plan allocates an 8-hour reconciliation window between end-of-day legacy processing close and the new core platform's opening validation before branch and digital channel go-live at 6 AM. For the bank's commercial portfolio — including 1,200 commercial real estate loans with complex interest calculation and fee billing structures — an 8-hour reconciliation window is insufficient; the migration team identifies 240 accounts requiring manual reconciliation review at the 6-hour mark and opts to go live with 20% of the commercial portfolio still in review status. The FFIEC IT Handbook's Development and Acquisition booklet requires banks to validate reconciliation completion before accepting a cutover; proceeding to go-live with unresolved commercial account discrepancies introduces intraday risk that regulators examine under the bank's IT change management programme.`,
    keywords: ['FFIEC IT Handbook', 'cutover reconciliation', 'core banking migration', 'OCC Bulletin 2013-29', 'SOX 404'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1975',
    name: 'Charge-Off and Classified Loan Status Not Migrated With Regulatory Flag Integrity',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's data migration maps general ledger charge-off status for consumer loans correctly but fails to carry forward the OCC loan classification codes — substandard, doubtful, loss — for commercial loans marked by the most recent credit review, because these classification codes are stored in the legacy credit review system rather than the core banking platform's loan record. Post-migration, the bank's credit risk reports generated from the new core show a materially lower classified loan balance than the actual portfolio, and the DFAST stress testing model fed from the new core understates credit impairment in the severely adverse scenario. The OCC's Loan Portfolio Management handbook and the bank's DFAST programme require accurate loan classification data in the core banking system as a foundation for regulatory capital adequacy and stress testing accuracy.`,
    keywords: ['OCC', 'DFAST', 'loan classification', 'data migration integrity', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1976',
    name: 'Pledge and Collateral Linkages Lost in Core Migration — Credit Exposure Understated',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's legacy core banking platform maintains collateral pledge linkages — connecting specific real estate and securities collateral records to individual loan facilities — in a custom relationship table that the vendor's migration tooling does not support. The migration team migrates collateral records and loan records independently, losing the linkage relationships for 3,400 commercial loans, which means the new core's collateral management module cannot calculate collateral coverage ratios or trigger margin call alerts when collateral values change. The bank's credit risk management programme under OCC examination standards requires accurate collateral tracking for secured lending facilities; losing pledge linkages creates an examination finding on credit risk data integrity and inflates reported unsecured credit exposure in DFAST stress test inputs.`,
    keywords: ['OCC', 'collateral management', 'data migration integrity', 'DFAST', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },
  {
    code: 'B1977',
    name: 'BSA/AML Watch List Data Not Refreshed Simultaneously With Core Go-Live',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's core banking go-live is executed at 2 AM on a Saturday, but the synchronized refresh of its OFAC SDN list and FinCEN watch list data feeds to the new core's transaction screening module is not scheduled until the following Monday's batch cycle — a 48-hour window during which the new core's transaction screening is running against a watch list that has not been refreshed since the Thursday prior to cutover. During this window, the bank processes 12,400 transactions against a stale watch list, a gap that the bank's BSA officer identifies during post-go-live review as a potential compliance deficiency under OFAC regulations and FinCEN's BSA/AML programme requirements, requiring a lookback analysis across the affected transaction population.`,
    keywords: ['BSA/AML', 'OFAC', 'FinCEN', 'core banking cutover', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'data-cutover',
  },

  // ── training-adoption ──────────────────────────────────────────────────────
  {
    code: 'B1978',
    name: 'Branch Staff Core Banking UI Training Completed Too Far Before Go-Live',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's branch staff training programme for the new core banking platform concludes 8 weeks before the go-live date — a scheduling decision made to accommodate branch operating schedules — leaving no reinforcement training or refresher practice in the interval before the system goes live. On go-live day, branch tellers who completed training 8 weeks earlier average 4.2 minutes per transaction compared to the 1.8-minute target, producing customer queue depths and wait times that trigger 2,800 customer complaints in the first week. The FFIEC IT Handbook's Development and Acquisition booklet recommends training timing that allows staff to apply skills within days of training completion; scheduling training 8 weeks before go-live with no refresher mechanism is a programme execution failure that predictably degrades branch service quality at launch.`,
    keywords: ['FFIEC IT Handbook', 'staff training', 'core banking UI', 'branch operations', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },
  {
    code: 'B1979',
    name: 'Go-Live Branch Readiness Assessment Not Completed for All Locations',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's core banking transformation programme conducts branch readiness assessments — structured evaluations of teller task completion times and knowledge test scores — for its 12 highest-volume branches but does not complete readiness assessments for 31 of its 43 branch locations, relying instead on training attendance records as a proxy for go-live readiness. Three branches in the lower-volume tier that did not receive readiness assessments have teller staff with less than 70% first-attempt task completion on core banking workflows; on go-live day, these branches cannot process account openings, wire transfer requests, or mortgage loan payoffs without supervisor intervention, causing local service disruptions and customer attrition. The FFIEC IT Handbook's Development and Acquisition booklet requires banks to validate operational readiness across all affected locations before initiating a go-live that changes staff workflows.`,
    keywords: ['FFIEC IT Handbook', 'branch readiness', 'core banking go-live', 'staff training', 'OCC'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },
  {
    code: 'B1980',
    name: 'Digital Channel Self-Service Training for Customers Not Provided Before Core Migration',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking migration changes the digital banking user interface for account management, bill pay, and electronic statement access — because the new core's digital banking integration presents account data in a different structure than the legacy system. The bank's customer communication plan informs customers of the system change date but does not provide advance training resources — tutorial videos, guided walkthroughs, or FAQ content — to prepare customers for the new experience. Customer service call volume increases 340% in the first 5 days post-migration, driven primarily by customers who cannot locate their accounts, transaction history, or statement archives in the new UI; the resulting call centre capacity failure generates an OCC consumer complaint inquiry into the adequacy of the bank's customer transition communication programme.`,
    keywords: ['OCC', 'CFPB', 'digital banking', 'customer training', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },
  {
    code: 'B1981',
    name: 'Relationship Manager Workflow Retraining Skipped in Migration Programme Scope',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's core banking transformation training programme scopes commercial banking relationship manager training as a business-as-usual activity to be managed by the commercial banking division rather than a programme deliverable — assuming that RMs will self-learn the new platform through daily use. Post-go-live, commercial RMs cannot generate relationship profitability reports, cannot access pipeline management workflows, and cannot execute covenant waiver requests in the new platform without calling the IT helpdesk for assistance on each transaction type. The programme's commercial banking productivity metrics decline 42% in the first 60 days, contributing to 14 commercial client service escalations that threaten relationship retention; the FFIEC IT Handbook's Management booklet requires banks to plan change management comprehensively for all affected staff populations, not just operational roles.`,
    keywords: ['FFIEC IT Handbook', 'relationship manager', 'commercial banking', 'core banking', 'change management'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },
  {
    code: 'B1982',
    name: 'Super-User Network Insufficient to Support First 90 Days Post-Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's core banking programme designates 15 super-users — one per major functional area — to provide peer-level support in the first 90 days post-go-live, supplementing the vendor's hypercare support team. The 15-person super-user network is structurally insufficient to support 1,400 staff across 43 branches and 7 operational centers; super-users receive an average of 22 support requests per day in the first month, cannot respond within the 4-hour target, and experience burnout that causes 6 of the 15 to disengage from their super-user role by week 6. The programme transitions to full vendor support earlier than planned, paying penalty charges for extended vendor hypercare that were not budgeted because the programme's change management workstream underestimated the staff-to-super-user ratio required for a core banking platform transition.`,
    keywords: ['FFIEC IT Handbook', 'super-user network', 'core banking go-live', 'OCC Bulletin 2013-29', 'change management'],
    subTopic: 'training-adoption',
  },
  {
    code: 'B1983',
    name: 'Operations Center ACH Processing Team Not Trained on New Return Handling Workflows',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's ACH operations team receives training on the new core banking platform's ACH origination workflow but is not trained on the changed return handling and exception processing workflows — which require a different sequence of system actions in the new platform compared to the legacy core. In the first week post-go-live, the ACH operations team processes 340 ACH returns incorrectly, missing the NACHA 2-day return window for R02 and R29 return codes because the new system's return queue requires a manual acknowledgment step that the team did not know existed. NACHA Operating Rules require financial institutions to process returns within defined time frames; missed return windows create NACHA compliance exposure and require notification to originating depository financial institutions.`,
    keywords: ['NACHA', 'ACH returns', 'core banking', 'operations training', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },
  {
    code: 'B1984',
    name: 'Training Completion Rate Metric Masks Proficiency Gap at Go-Live Certification',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's core banking programme reports go-live training readiness based on training completion rates — the percentage of staff who have completed the required training modules — rather than proficiency assessment scores that measure actual competency on key workflows. The programme reports 96% training completion at go-live authorization, but proficiency assessments administered independently by the operations division find that only 61% of staff pass the minimum competency threshold for the five core transaction types required in their role. The gap between completion rate and proficiency rate is not surfaced to the programme steering committee because proficiency testing was not in scope for the programme's training workstream, resulting in a go-live authorization based on misleading readiness metrics.`,
    keywords: ['FFIEC IT Handbook', 'training proficiency', 'core banking go-live', 'OCC Bulletin 2013-29', 'programme governance'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },
  {
    code: 'B1985',
    name: 'BSA/AML Alert Triage Training Omitted From Operations Staff Readiness Plan',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's new core banking platform integrates directly with the bank's transaction monitoring system in a new data flow that changes the alert triage workflow for BSA/AML analysts — requiring analysts to navigate from the new core's transaction detail screen to link context for suspicious activity investigations. The BSA/AML team's training programme is managed by the Compliance division independently of the core banking migration programme, and the new triage workflow is not incorporated into analyst training before go-live. In the first 30 days post-migration, alert resolution times increase 67% because analysts cannot efficiently link core transaction detail to the monitoring system's alert interface; FinCEN's SAR filing timeliness requirement under 31 CFR 1020.320 requires banks to file SARs within 30 days of detection, and the triage delay places 14 SAR filings at risk of missing the deadline.`,
    keywords: ['FinCEN', 'BSA/AML', 'SAR filing', 'core banking', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'training-adoption',
  },

  // ── post-go-live ───────────────────────────────────────────────────────────
  {
    code: 'B1986',
    name: 'Hypercare Period Incident Escalation Path Not Defined Before Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's core banking go-live hypercare plan specifies a 90-day period of enhanced vendor support but does not define an escalation path — including severity classification criteria, vendor executive contacts, OCC notification thresholds, and board reporting triggers — for incidents occurring during hypercare. When a hypercare-period incident causes a 3-hour digital banking outage on the second business day post-migration, the programme team and vendor support team spend 45 minutes determining who has authority to invoke emergency vendor executive escalation before the escalation pathway is agreed ad hoc in a conference call. OCC Bulletin 2013-29 requires banks to have pre-defined incident escalation procedures for critical third-party technology services; the absence of a hypercare-specific escalation matrix is a governance gap that extends incident resolution time and delays the bank's regulatory notification obligations under OCC incident reporting requirements.`,
    keywords: ['OCC Bulletin 2013-29', 'hypercare', 'incident escalation', 'core banking', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'post-go-live',
  },
  {
    code: 'B1987',
    name: 'Post-Go-Live Defect Prioritization Allows Regulatory-Impact Bugs to Age in Backlog',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's post-go-live defect management process prioritizes bugs using a severity scoring model that weights customer-facing impact and transaction volume affected — a model designed for digital experience defects that does not include a regulatory compliance impact dimension. A defect affecting the bank's Reg CC funds availability hold calculation — which under-holds funds on mobile deposit items — is scored as low-severity because it affects a low transaction volume and does not generate customer-visible errors; the defect ages in the backlog for 4 months while higher-severity UX defects are remediated. The CFPB identifies the systematic under-holding as a Reg CC violation in a consumer complaint review, requiring a 14-month remediation and a fee restitution programme for affected customers that the bank did not anticipate because the compliance dimension was invisible in its defect triage model.`,
    keywords: ['FFIEC IT Handbook', 'defect management', 'Reg CC', 'core banking post-go-live', 'CFPB'],
    demoRelevant: true,
    subTopic: 'post-go-live',
  },
  {
    code: 'B1988',
    name: 'Benefit Realization Tracking Not Established at Go-Live — Business Case Accountability Absent',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's core banking transformation business case projects $18M in annual operating cost savings from mainframe decommission, reduced third-party integration costs, and digital channel efficiency gains — but the programme does not establish a benefit realization tracking framework or assign accountability for post-go-live benefit measurement before the programme governance structure is disbanded 6 months post-migration. Two years after go-live, the CFO commissions a post-implementation review and finds that only $5.2M of the projected $18M in savings has been realized, with mainframe decommission delayed, integration cost savings offset by new middleware licensing, and digital channel productivity gains not tracked. The OCC's supervisory principles for technology investment governance expect banks to hold technology programmes accountable for the financial outcomes presented in the board-approved business case.`,
    keywords: ['OCC Bulletin 2013-29', 'benefit realization', 'core banking', 'programme governance', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'post-go-live',
  },
  {
    code: 'B1989',
    name: 'Vendor Stabilization SLA for Hypercare Not Contractually Defined Before Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking vendor contract defines standard production SLAs for steady-state operations but does not include a hypercare-specific SLA defining enhanced response times, minimum dedicated vendor staffing levels, and maximum acceptable defect backlog aging during the 90-day post-go-live stabilization period. When First Capital experiences 34 production defects in the first 30 days post-migration, the vendor's hypercare team triages them under standard production SLA timelines rather than accelerated hypercare commitments — resulting in 8 regulatory-compliance-impacting defects remaining open for more than 3 weeks. OCC Bulletin 2013-29 requires banks to ensure that contracts with critical technology service providers include performance standards appropriate for each operational phase, including post-implementation stabilization periods where heightened support intensity is required.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'vendor SLA', 'hypercare', 'core banking stabilization'],
    demoRelevant: true,
    subTopic: 'post-go-live',
  },
  {
    code: 'B1990',
    name: 'Post-Migration Customer Complaint Surge Not Included in Reg E Response Capacity Plan',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's operational readiness plan for the core banking go-live includes a customer service staffing uplift of 25% to handle anticipated migration-related inquiries, but does not plan for the Regulation E electronic fund transfer dispute resolution workload generated by the surge of account access issues, incorrect balance displays, and failed debit authorizations. In the first 30 days post-migration, 3,400 Reg E disputes are filed — 12× the bank's normal monthly volume — and the bank's dispute resolution team cannot meet the 10-business-day provisional credit requirement under Reg E Section 1005.11 for 840 disputes, generating CFPB complaint filings and a subsequent OCC consumer compliance examination finding on dispute resolution timeliness.`,
    keywords: ['Reg E', 'OCC', 'CFPB', 'core banking migration', 'customer complaint capacity'],
    demoRelevant: true,
    subTopic: 'post-go-live',
  },
  {
    code: 'B1991',
    name: 'Post-Go-Live Performance Monitoring Dashboard Not Built for First 90 Days',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's production operations team does not have a monitoring dashboard specific to the new core banking platform's performance metrics — including transaction authorization response times, batch job completion status, and API gateway throughput — at go-live, relying instead on the legacy operations center monitoring tools that cannot query the new platform's telemetry endpoints. In the first 14 days post-migration, three gradual performance degradation events that would have been visible in proactive monitoring data are detected only after customers report issues, extending the bank's incident response initiation time by an average of 4.5 hours. The FFIEC IT Handbook's Operations booklet requires banks to have adequate monitoring capabilities for all production systems before activation; deploying a new core banking platform without corresponding monitoring tooling is an operational risk management gap.`,
    keywords: ['FFIEC IT Handbook', 'performance monitoring', 'core banking operations', 'OCC', 'incident detection'],
    subTopic: 'post-go-live',
  },
  {
    code: 'B1992',
    name: 'OCC Notification of Material Technology Change Not Filed Timely at Migration',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital does not provide advance notification to the OCC of its core banking platform replacement — which the OCC's examination framework classifies as a material technology change for an OCC-chartered bank — until the month of go-live, rather than the 90-day advance notification window that the OCC's supervisory relationship guidelines expect for technology changes of this materiality. The OCC's examination team learns of the migration when reviewing First Capital's quarterly report and schedules an unplanned technology examination 4 months post-go-live, discovering that the rollback plan, DR testing, and change management programmes do not meet OCC examination standards — a finding that would have been addressable during the pre-migration planning phase if the bank had engaged its OCC supervisory team in advance.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC', 'supervisory notification', 'core banking', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'post-go-live',
  },
  {
    code: 'B1993',
    name: 'Post-Migration Reconciliation Programme Disbanded Before Full Account Remediation',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital disbands its post-migration reconciliation programme team at the 90-day mark — consistent with the programme timeline — despite having 1,200 open reconciliation items including 340 items with potential customer financial impact. The remaining items are transitioned to the finance operations team as ongoing BAU work, but the BAU team lacks the core banking migration context to trace and resolve the items efficiently; 180 of the transferred items remain unresolved at the 12-month mark, when an internal audit review elevates them as aged reconciliation exceptions with SOX 404 implications. SOX 404 requires material reconciliation exceptions to be resolved within a timeframe consistent with the bank's internal control framework; migrating unresolved post-conversion items into the BAU environment without a defined resolution deadline creates a persistent IT general control deficiency.`,
    keywords: ['SOX 404', 'FFIEC IT Handbook', 'reconciliation programme', 'core banking post-go-live', 'OCC Bulletin 2013-29'],
    subTopic: 'post-go-live',
  },

  // ── regulatory-change ──────────────────────────────────────────────────────
  {
    code: 'B1994',
    name: 'Basel III Endgame Capital Calculation Not Designed Into New Core Banking Architecture',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's core banking transformation is designed against the capital adequacy framework in effect at contract inception, and the bank's regulatory capital calculation architecture — built into the new core platform's reporting module — does not accommodate the Basel III endgame requirements published by the Federal Reserve, OCC, and FDIC in July 2023, which will require expanded operational risk capital models and revised credit risk-weighting for commercial real estate and retail exposures. The bank's regulatory reporting team identifies the gap when the Basel III endgame implementation timeline is finalized, requiring custom development of capital reporting adjustments on top of the new core platform that the vendor cannot deliver within the compliance deadline under its standard roadmap. Basel III endgame and the agencies' final rule under 12 CFR 3 require covered banks to begin compliance reporting by the implementation date; a core platform with insufficient capital calculation flexibility creates both a regulatory compliance risk and a programme cost overrun.`,
    keywords: ['Basel III', 'OCC', 'FDIC', 'capital adequacy', 'core banking regulatory change'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },
  {
    code: 'B1995',
    name: 'CECL Model Integration With New Core Data Model Not Validated Before DFAST Submission',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's CECL allowance for credit losses model — which the bank's model risk management team has validated and registered under SR 11-7 — draws loan-level origination, maturity, and loss history data from the legacy core banking system via a defined data pipeline. The core banking migration changes the data model for loan origination attributes, maturity date storage, and historical charge-off linkage, but the CECL model team is not included in the migration architecture review and does not validate the data pipeline against the new core schema before go-live. The first DFAST submission after migration uses CECL model outputs drawn from an unvalidated data pipeline — a model governance failure under SR 11-7 that the OCC identifies when the bank's model inventory shows the CECL model input pipeline has not been validated against the new core's data model.`,
    keywords: ['SR 11-7', 'CECL', 'DFAST', 'OCC', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },
  {
    code: 'B1996',
    name: 'FedNow Connectivity Certification Not Renewed After Core Platform Migration',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's FedNow instant payment service participation requires the bank to maintain a certified integration between its core banking platform and the Federal Reserve's FedNow gateway — a certification that is granted per platform instance, not per institution. When the bank migrates to a new core banking platform, the original FedNow certification becomes invalid for the new platform instance, but the programme team does not initiate a new FedNow connectivity certification with the Federal Reserve until 3 weeks after go-live, when the FedNow gateway rejects authentication attempts from the new core. The 3-week lapse in FedNow connectivity suspends First Capital's ability to receive or originate instant payments for commercial treasury clients who use FedNow for same-day vendor payment processing, generating commercial client service failures and contract SLA exposure.`,
    keywords: ['FedNow', 'FFIEC IT Handbook', 'OCC Bulletin 2013-29', 'instant payments', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },
  {
    code: 'B1997',
    name: 'CFPB 1033 Open Banking Data Access Requirements Not Incorporated in Core API Design',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital designs its core banking API architecture without incorporating CFPB Personal Financial Data Rights Rule (12 CFR 1033) data access requirements — which require depository institutions to make consumer transaction data available to third-party financial applications via standardized API access within 12 months of the rule's compliance date. The new core platform's API gateway is designed for bank-controlled third-party integrations and does not include a customer-authorized data sharing model, meaning that when First Capital's compliance team assesses 1033 readiness 18 months before the compliance date, the entire API authorization layer must be redesigned — a 14-month development effort at a cost not included in the original transformation business case.`,
    keywords: ['CFPB 1033', 'OCC', 'open banking', 'core banking API', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },
  {
    code: 'B1998',
    name: 'CRA Modernization Rule Assessment Area Mapping Not Built Into New Core Reporting',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's new core banking platform is configured with CRA reporting fields designed for the legacy CRA regulations, and the bank's implementation team does not update the CRA data model to accommodate the OCC, Fed, and FDIC's CRA Modernization Rule — which expands assessment area definitions, introduces new data collection requirements for retail lending test and community development metrics, and requires geocoding at finer geographic granularity. When the CRA Modernization Rule's data collection requirements take effect, First Capital cannot produce compliant CRA data from the new core without a custom data engineering engagement, placing the bank's CRA examination preparation and potential CRA rating at risk. Under 12 CFR 25, banks must maintain data collection and reporting capabilities aligned to the current CRA regulatory framework regardless of migration status.`,
    keywords: ['CRA', 'OCC', 'FDIC', 'FFIEC IT Handbook', 'regulatory reporting'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },
  {
    code: 'B1999',
    name: 'DORA-Aligned Operational Resilience Requirements Not Incorporated in Core Vendor Contract',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's EU correspondent banking relationships require the bank to satisfy emerging Digital Operational Resilience Act (DORA) third-party risk management standards for ICT service providers, including enhanced contractual provisions for incident reporting, access rights, and exit strategies. The bank's core banking vendor contract — negotiated before DORA's alignment with US OCC guidance on third-party concentration risk — does not include the incident notification timelines, sub-outsourcer disclosure requirements, or exit portability provisions that DORA-aligned oversight frameworks require. As OCC examinations increasingly reference DORA-equivalent resilience principles in their assessment of US bank third-party technology contracts, First Capital's contract gaps create a prospective examination finding that will require contract renegotiation under unfavorable terms.`,
    keywords: ['OCC 2023-17', 'DORA', 'TPRM', 'core banking vendor contract', 'operational resilience'],
    subTopic: 'regulatory-change',
  },
  {
    code: 'B2000',
    name: 'Reg II Interchange Cap Compliance Logic Not Migrated Correctly to New Core',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's core banking migration includes a data migration of its debit card interchange fee configuration, but the migration does not include a validation that the new core's interchange calculation engine correctly enforces Regulation II's interchange fee cap for covered issuers — a cap that applies per-transaction with specific exemptions for fraud prevention adjustment components. Post-migration, the new core's interchange calculation module applies the cap incorrectly for a subset of card-present transactions where the fraud prevention adjustment is applied before rather than after the base cap, generating $340K in excess interchange income over 6 months that the bank's auditors identify as a Reg II compliance failure requiring restitution to merchant processors.`,
    keywords: ['Reg II', 'FFIEC IT Handbook', 'interchange', 'core banking migration', 'CFPB'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },
  {
    code: 'B2001',
    name: 'ISO 20022 Mandatory Migration Requires Core Platform Upgrade Not Budgeted',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's new core banking platform is deployed on a version that supports ISO 20022 structured remittance data as an optional capability, not as a native processing model — because the mandatory ISO 20022 adoption timeline for Fedwire and CHIPS was delayed at the time of contract negotiation. When SWIFT and the Federal Reserve confirm the mandatory ISO 20022 migration timeline for cross-border and domestic wire rails, First Capital's core banking vendor requires a paid platform version upgrade to support ISO 20022 native processing — a cost and platform migration not included in the original transformation business case. FFIEC examination guidance on payments modernisation requires banks to maintain payment processing capabilities consistent with the current and published-future regulatory standard for each payment rail they operate; deploying a core platform that requires paid upgrades to meet mandatory regulatory timelines is a budgeting and vendor management failure under OCC Bulletin 2013-29.`,
    keywords: ['ISO 20022', 'OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'SWIFT', 'Fedwire'],
    demoRelevant: true,
    subTopic: 'regulatory-change',
  },

  // ── ai-modernisation-p2 ────────────────────────────────────────────────────
  {
    code: 'B2002',
    name: 'AI Code Generation for Core Banking Integration Lacks Financial Services Regulatory Review',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital's integration development team uses a general-purpose AI code generation assistant to produce the API connector between the new core banking platform and the bank's commercial lending origination system — generating functional integration code in 6 weeks rather than the estimated 6 months for manual development. The AI-generated code correctly implements the data exchange protocol but does not incorporate financial-services-specific requirements — such as field-level encryption for consumer PII transmitted between systems, audit logging for all data access events, and input validation for financial amounts consistent with FFIEC data integrity standards — because the AI tool was trained on general software engineering patterns and the prompts did not specify regulatory context. The resulting code passes functional testing but fails the bank's financial services security code review, requiring 4 months of remediation that eliminates the original schedule benefit of using the AI tool.`,
    keywords: ['FFIEC IT Handbook', 'AI code generation', 'OCC Bulletin 2013-29', 'security code review', 'core banking integration'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2003',
    name: 'LLM Test Script Generation Missing Reg CC and Reg E Regulatory Test Cases',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's testing team deploys an LLM-based test script generation tool to accelerate UAT coverage for the new core banking platform's deposit product configurations, using the vendor's product specification documents as the primary knowledge source. The LLM generates comprehensive test scripts for standard deposit product configurations but produces no test cases for Regulation CC next-day availability requirements for government checks, Regulation E dispute trigger scenarios for preauthorized electronic fund transfers, or Truth in Savings disclosure accuracy for tiered savings products — because these regulatory requirements are documented in federal regulatory publications outside the LLM's prompt context. The coverage gaps allow configuration defects in Reg CC hold logic and Reg E dispute processing to pass UAT and reach production, generating systematic consumer violations that the CFPB identifies in a focused supervisory review.`,
    keywords: ['FFIEC IT Handbook', 'LLM test generation', 'Reg CC', 'Reg E', 'core banking testing'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2004',
    name: 'GenAI Change Impact Analysis Omits Regulatory Impact Assessment for Core Modifications',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's post-go-live change management process uses a GenAI tool to generate change impact analyses for core banking platform modifications — providing the tool with a natural language description of the proposed change and receiving a risk-ranked impact report covering functional areas, integration dependencies, and operational risk dimensions. The GenAI change impact tool consistently rates changes to deposit rate configuration as low-risk because the tool's training data emphasizes operational and availability risk; it does not identify Regulation DD Truth in Savings disclosure obligations that require specific advance disclosure periods and formatted disclosure updates whenever interest rate structures change. When the bank's deposit pricing team implements a rate structure change using the GenAI change impact assessment as the risk clearance, the missing Reg DD disclosure triggers a CFPB consumer finance examination finding.`,
    keywords: ['FFIEC IT Handbook', 'GenAI change impact', 'Reg DD', 'core banking', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2005',
    name: 'AI Project Health Monitoring Without OCC Bulletin 2013-29 Compliance Tracking',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's core banking programme uses an AI-powered project health monitoring platform that aggregates milestone completion, resource utilization, risk register updates, and vendor performance data into a real-time programme health dashboard for the executive steering committee. The AI health monitoring tool does not include a compliance dimension that tracks the programme's adherence to OCC Bulletin 2013-29's requirements for critical technology change governance — such as independent programme assurance reporting frequency, rollback plan readiness assessment dates, and regulatory notification milestone completion. The steering committee approves a go-live authorization based on the AI programme health dashboard showing 94% health, unaware that 7 of the 12 OCC Bulletin 2013-29 compliance milestones are overdue; the OCC's post-go-live technology examination identifies the compliance gaps that the AI health tool rendered invisible.`,
    keywords: ['OCC Bulletin 2013-29', 'AI project monitoring', 'FFIEC IT Handbook', 'programme governance', 'core banking'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2006',
    name: 'Automated Deployment Pipeline Bypasses SOX 404 Change Approval Controls',
    officeCategory: 'back_office',
    failureRatePct: 80,
    description:
      `First Capital's new core banking platform is deployed with a CI/CD pipeline that automates deployment of platform updates from staging to production once automated test suites pass, without requiring the change advisory board approval and dual-control deployment authorization that the bank's SOX 404 IT general control framework mandates for changes to financially significant systems. The programme team configures the automated pipeline to accelerate hypercare-period defect remediation velocity, treating the core banking platform as an agile software product rather than a SOX-in-scope financial reporting system. External auditors reviewing the bank's SOX 404 IT general controls identify the automated deployment pipeline as a change management control deficiency — a production deployment capability that allows code changes to reach the financial reporting environment without the required human approval controls — and issue an adverse finding that requires the bank to retrofit manual approval gates into the pipeline before the fiscal year-end audit sign-off.`,
    keywords: ['SOX 404', 'OCC Bulletin 2013-29', 'automated deployment', 'change management controls', 'core banking SDLC'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2007',
    name: 'AI-Powered RFP Scoring Overweights Vendor AI Features Over Regulatory Compliance Capability',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital uses an AI procurement platform to evaluate core banking vendor proposals, and the platform's AI scoring model allocates capability weights based on the frequency of RFP requirement mentions — which reflects the bank's digital transformation priorities (AI features, API-first architecture, cloud-native deployment) rather than regulatory compliance capability depth. Vendor A, which scores highest on AI-powered account management and self-service features, is selected; Vendor B — which demonstrates superior OCC examination support features, HMDA data extraction accuracy, and Call Report field granularity — scores fourth because regulatory compliance capability receives lower weight in the AI scoring model. First Capital spends $4.2M in post-go-live custom development to build regulatory reporting capabilities that Vendor B offered natively, a cost that the board-approved business case did not include because the AI vendor selection tool did not surface regulatory capability depth as a differentiating dimension.`,
    keywords: ['OCC Bulletin 2013-29', 'TPRM', 'AI vendor selection', 'core banking procurement', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2008',
    name: 'GenAI User Story Creation for Core Banking Misses Accessibility and Fair Lending Requirements',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's systems integrator uses a GenAI user story generation tool to accelerate the requirements phase of the core banking implementation, producing 1,400 user stories from business process descriptions provided by bank stakeholders. The GenAI tool generates stories covering functionality, performance, and integration requirements but does not produce user stories for accessibility requirements under ADA Section 508, fair lending data accuracy requirements under HMDA and CRA, or language access requirements for LEP customers under the OCC's fair access principles. The missing accessibility and fair lending stories result in a core banking UI and data capture design that the bank's compliance team identifies as deficient during a pre-go-live compliance review — requiring a 9-week delay to redesign affected workflows and add the missing requirements to the acceptance test scope.`,
    keywords: ['FFIEC IT Handbook', 'GenAI user stories', 'HMDA', 'ADA Section 508', 'core banking requirements'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2009',
    name: 'AI Document Extraction for Legacy Policy Migration Generates Inaccurate Business Rules',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's programme team uses an AI document extraction tool to convert 22 years of legacy core banking policy documents, product specifications, and operational manuals into structured business rules for configuration of the new platform — reducing an estimated 18-month manual business analysis effort to 4 months. The AI extraction tool achieves 91% accuracy on standard deposit product rules but generates incorrect business rules for exception processing scenarios — late payment grace period calculations for consumer loans, NSF fee assessment sequences for accounts with overdraft protection, and minimum balance averaging periods for money market accounts — because these scenarios are described inconsistently across legacy documents created by different teams over different policy periods. The incorrectly extracted rules are implemented in the new core without independent validation by subject matter experts, generating systematic consumer compliance errors that the CFPB identifies within 18 months of go-live.`,
    keywords: ['FFIEC IT Handbook', 'AI document extraction', 'business rules migration', 'Reg E', 'core banking'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2010',
    name: 'AI-Assisted Parallel Run Analysis Fails to Detect Systematic Rounding Variance in Interest',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital uses an AI comparison platform to run its core banking parallel validation — comparing daily transaction output between the legacy core and the new platform across 480,000 accounts. The AI comparison tool is configured to suppress variances below $1.00 per account per day as rounding noise, a threshold set by the vendor's implementation team based on general financial services implementation experience rather than First Capital's specific interest calculation accuracy requirements. The threshold suppresses a systematic 3-cent-per-day rounding difference in daily interest accrual for adjustable-rate home equity lines of credit — a difference caused by a day-count convention discrepancy — which accumulates to $2.3M in under-accrued interest liability over the 180-day parallel run period before a manual sample review outside the AI tool identifies the systematic pattern.`,
    keywords: ['FFIEC IT Handbook', 'AI parallel run', 'interest accrual', 'SOX 404', 'core banking validation'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2011',
    name: 'LLM Incident Root Cause Analysis Misattributes Core Banking Outages to External Factors',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's operations team uses an LLM-based incident analysis tool to accelerate post-incident root cause analysis for core banking platform incidents, feeding the tool incident timeline data, system logs, and vendor support notes to generate RCA reports. The LLM tool consistently attributes performance degradation incidents to external factors — FedNow gateway latency, digital banking client request patterns — when the actual root cause is an internal database query optimization issue introduced by a recent platform patch; the LLM misattributes the cause because the vendor support notes provided as context describe network-layer symptoms rather than database-layer root causes. The OCC's operational risk management expectations require banks to identify the correct root causes of technology incidents to ensure remediation addresses the actual failure point; repeated misattributed RCAs allow a recurring database performance defect to persist for 7 months without remediation.`,
    keywords: ['OCC Bulletin 2013-29', 'FFIEC IT Handbook', 'LLM root cause analysis', 'incident management', 'core banking operations'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2012',
    name: 'AI-Generated BSA/AML Alert Summaries Introduce Narrative Inaccuracies in SAR Filings',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's compliance team deploys a GenAI alert summarization tool in its BSA/AML investigation workflow to accelerate SAR narrative drafting — generating draft SAR narratives from transaction data and investigator notes that analysts review and submit. The GenAI tool generates narratives that sound authoritative and complete but occasionally introduces factual inaccuracies by inferring transaction details not present in the source data, and consistently understates the complexity of structuring patterns because the tool's summarization approach favors concise narratives over complete enumeration of all suspicious transactions. FinCEN's SAR form instructions require that narratives accurately and completely describe the suspicious activity; an AI-generated narrative that introduces inaccuracies or omits material transaction patterns constitutes a BSA/AML programme deficiency that FinCEN examiners identify through SAR quality review under 31 CFR 1020.320.`,
    keywords: ['FinCEN', 'BSA/AML', 'SAR filing', 'GenAI summarization', 'FFIEC IT Handbook'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2013',
    name: 'AI Fraud Detection Model Deployed Without SR 11-7 Validation Against New Core Data Schema',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's real-time fraud detection model — validated and registered under SR 11-7 with defined input data specifications — is connected to the new core banking platform's transaction feed post-migration without a formal model re-validation to confirm that the core migration has not altered the input data schema, variable distributions, or data latency characteristics that the model's validation was based on. The new core's transaction timestamp format changes from UTC to local time without documentation, causing the fraud model's time-of-day behavioral features to be systematically miscalculated for all Eastern Time Zone transactions. The model's false positive rate increases 34% before the model risk team identifies the input schema change as the root cause; SR 11-7 requires banks to re-validate models when their operating environment changes materially, including when the data systems feeding model inputs are replaced.`,
    keywords: ['SR 11-7', 'OCC', 'fraud detection model', 'model validation', 'core banking migration'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2014',
    name: 'GenAI Contract Analysis Tool Misses Critical Subcontractor Disclosure Clauses in Core Vendor RFP',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's procurement team uses a GenAI contract analysis tool to review the core banking vendor's proposed contract terms, producing a risk-ranked summary of contract provisions with recommended negotiation positions. The GenAI tool identifies price, SLA, and termination provisions accurately but misses the subcontractor disclosure clause buried in a schedule attachment — a clause that grants the vendor the right to use unnamed subcontractors for all infrastructure and database management services without notifying the bank. OCC Bulletin 2013-29 and OCC 2023-17 require banks to obtain disclosure of material subcontractors in critical technology vendor contracts; the missed clause is not identified until an OCC examination 2 years post-go-live, when the bank discovers it has no visibility into the vendor's infrastructure subcontractor chain and must renegotiate the contract under unfavorable terms.`,
    keywords: ['OCC Bulletin 2013-29', 'OCC 2023-17', 'GenAI contract analysis', 'TPRM', 'subcontractor disclosure'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2015',
    name: 'AI Workload Scheduling Optimization Conflicts With Core Banking Batch Window Requirements',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital deploys an AI-powered IT workload scheduling tool to optimize resource utilization across its cloud-hosted core banking platform, dynamically scaling compute and scheduling batch jobs to minimize cloud operating costs. The AI scheduling tool reschedules interest posting and statement generation batch jobs to off-peak cloud pricing windows — 2 AM to 4 AM — which conflicts with the bank's Reg CC next-business-day availability requirement that requires interest posting to complete before 9 AM to ensure accuracy in same-day balance availability calculations. When interest posting completes at 6:12 AM instead of 3:00 AM on multiple occasions due to AI-optimized scheduling, the bank's funds availability calculation for mobile deposits made after 6 AM shows incorrect same-day available balances, generating Reg CC violations documented by the CFPB in a consumer complaint review.`,
    keywords: ['FFIEC IT Handbook', 'AI workload scheduling', 'Reg CC', 'core banking batch', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2016',
    name: 'GenAI Architecture Assessment Recommends Microservices Decomposition Inconsistent With Core Banking Resilience Requirements',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's enterprise architecture team uses a GenAI architecture assessment tool to evaluate modernisation options for its legacy core banking system, and the tool recommends a microservices decomposition approach based on software engineering best practices for scalability and team autonomy — without incorporating the OCC's operational resilience requirements for critical banking systems or the FFIEC's BCM standards for core banking recovery. The GenAI recommendation does not account for the network latency, distributed transaction coordination complexity, and atomic consistency requirements of core banking processing, where a failed distributed transaction for a wire transfer origination that is partially executed creates a regulatory liability. The board approves the microservices architecture based on the AI assessment before an independent banking architecture review identifies that the recommended approach cannot meet the bank's Fedwire settlement finality and Reg E provisional credit reversal timing requirements.`,
    keywords: ['OCC', 'FFIEC IT Handbook', 'GenAI architecture', 'core banking resilience', 'OCC Bulletin 2013-29'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2017',
    name: 'AI-Powered Model Documentation Generator Produces SR 11-7 Noncompliant Model Cards',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's model risk management team adopts an AI model documentation generation tool to accelerate production of SR 11-7-compliant model documentation for new analytical models deployed on the core banking platform — including credit scoring, deposit repricing sensitivity, and customer attrition prediction models. The AI documentation tool generates structured model cards that cover intended use, inputs, outputs, and performance metrics, but does not produce the conceptual soundness assessment, ongoing monitoring plan, or change management procedures that SR 11-7 requires as mandatory components of model documentation for models used in risk management and financial reporting. The OCC examines First Capital's model inventory and finds that 14 of 22 models deployed post-migration have AI-generated documentation that is structurally deficient under SR 11-7, constituting a model risk management programme violation under the bank's existing MRM consent order.`,
    keywords: ['SR 11-7', 'OCC', 'model documentation', 'AI model cards', 'MRM consent order'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2018',
    name: 'AI Anomaly Detection for Core Banking Transactions Generates Reg E False Positive Holds',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an AI anomaly detection model on its new core banking platform to identify potentially erroneous debit transactions for consumer review — placing a pre-authorization hold on transactions classified as anomalous by the model. The model's anomaly threshold is calibrated on a training dataset from the legacy core that does not reflect the changed transaction volume distribution on the new platform, causing the model to over-flag normal transactions in the first 90 days post-deployment — placing holds on 2,400 legitimate debit transactions per week. Regulation E Section 1005.10 governs the conditions under which financial institutions may stop payment on preauthorized electronic fund transfers; an AI-generated hold on a non-preauthorized debit transaction that the customer did not request constitutes an unauthorized reversal of an authorized transfer, creating both a Reg E compliance violation and customer trust damage.`,
    keywords: ['Reg E', 'FFIEC IT Handbook', 'AI anomaly detection', 'core banking', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
  {
    code: 'B2019',
    name: 'LLM-Assisted Regulatory Change Management Misclassifies Compliance Urgency for Core Updates',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's compliance team deploys an LLM regulatory change management tool to monitor regulatory publications and classify required changes to the core banking platform by urgency and implementation timeline. The LLM tool classifies the CFPB's Reg E amendment expanding electronic fund transfer coverage to payroll card accounts as medium-urgency with a 12-month recommended implementation window, based on the agency's stated effective date — without identifying that the bank's existing payroll card programme requires immediate core platform configuration updates to avoid retroactive compliance violations for cards already issued under the new coverage definition. The misclassification delays First Capital's core platform configuration update by 8 months past the actual compliance deadline, generating a CFPB examination finding for violations during the delay period that the bank's compliance programme failed to prevent because the AI regulatory monitoring tool incorrectly assessed implementation urgency.`,
    keywords: ['FFIEC IT Handbook', 'LLM regulatory change', 'Reg E', 'core banking compliance', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-modernisation-p2',
  },
];
