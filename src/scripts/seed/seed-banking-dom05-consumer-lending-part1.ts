// seed-banking-dom05-consumer-lending-part1.ts
// Banking genome patterns — Consumer Lending & Digital Origination
// Code range: B1300–B1359  (60 patterns)
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

export const BANKING_CONSUMER_LENDING_PART1_PATTERNS: PatternSeed[] = [

  // ── Origination Platform ────────────────────────────────────────────────────
  {
    code: 'B1300',
    name: 'LOS Integration With Core Banking Breaks on Real-Time Account Opening',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's loan origination system (LOS) sends approved consumer loan packages to the
      core banking system via a nightly batch interface rather than a real-time API, creating a
      12–18 hour window where an approved borrower cannot access funded loan proceeds the same day.
      The synchronization gap violates customer SLAs promised in the digital origination flow and
      forces manual workarounds by operations staff — a direct integration deficiency that OCC
      examiners cite when reviewing the bank's digital transformation program under its technology
      risk framework, and that CFPB complaint data flags as a recurrent customer service failure
      in first-draw funding delays.`,
    keywords: ['loan origination system', 'core banking integration', 'digital origination', 'CFPB', 'LOS'],
    demoRelevant: true,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1301',
    name: 'E-Signature Workflow Does Not Comply With ESIGN Act Disclosure Requirements',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's digital mortgage and personal loan origination flows deploy an e-signature
      provider without implementing the ESIGN Act's required consumer consent disclosure — the
      pre-signature notice that informs the borrower of their right to receive a paper copy and the
      method for withdrawing electronic consent. When the CFPB's digital lending examination team
      reviews loan file samples, it finds that 40% of closed loans lack a documented ESIGN consent
      record in the LOS, exposing the bank to a pattern-of-practice finding under the Electronic
      Signatures in Global and National Commerce Act and TILA-RESPA Integrated Disclosure delivery
      requirements.`,
    keywords: ['ESIGN Act', 'e-signature', 'TILA-RESPA Integrated Disclosure', 'CFPB examination', 'digital origination'],
    demoRelevant: true,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1302',
    name: 'Decision Engine Waterfall Fails to Cascade to Human Underwriting on AI Decline',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's digital consumer lending decision engine is configured as a three-tier
      waterfall — auto-approve, refer to underwriter, or auto-decline — but a misconfigured
      routing rule causes applications that score in the "refer" band to route directly to auto-decline
      when the applicant's bureau pull returns a thin-file flag, bypassing human underwriting review
      entirely. The CFPB's Reg B and ECOA requirements mandate that credit decisions be based on
      an individualized review of the applicant's complete creditworthiness; systematically bypassing
      manual review for a protected-class-correlated population characteristic (thin credit files,
      disproportionately affecting younger borrowers and first-generation immigrants) creates disparate
      impact exposure that the bank's fair lending monitoring program does not detect.`,
    keywords: ['decision engine', 'ECOA', 'Reg B', 'disparate impact', 'digital origination'],
    demoRelevant: true,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1303',
    name: 'LOS Vendor Upgrade Breaks TRID Fee Tolerance Calculations',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's LOS vendor deploys a mid-cycle software update that silently changes the
      logic for calculating TILA-RESPA Integrated Disclosure fee tolerance buckets — reclassifying
      certain third-party settlement charges from the zero-tolerance bucket to the 10% tolerance
      bucket without notifying the bank or updating release notes. Post-close quality control
      sampling detects a 12% error rate in Closing Disclosure fee tolerance calculations across
      two months of mortgage closings, triggering a mandatory cure payment program to affected
      borrowers and a self-report to the OCC under the bank's consumer compliance risk management
      framework.`,
    keywords: ['TILA-RESPA Integrated Disclosure', 'TRID', 'LOS', 'fee tolerance', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1304',
    name: 'Digital Application Session Timeout Too Short for Mortgage Document Assembly',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital's digital mortgage application portal enforces a 10-minute inactivity session
      timeout in compliance with its web application security policy, but the income and asset
      documentation upload step requires applicants to retrieve and attach PDF statements from a
      separate financial institution — a process that routinely exceeds 10 minutes. Application data
      is lost at session expiration with no auto-save, and CFPB supervisory guidance on digital
      mortgage origination UX flags session-timeout-induced application abandonment as a potential
      barrier to credit access when it disproportionately affects applicants with lower digital
      literacy or slower internet connections.`,
    keywords: ['CFPB', 'digital origination', 'session timeout', 'mortgage application', 'consumer access'],
    demoRelevant: false,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1305',
    name: 'LOS Data Quality Errors Propagate to HMDA LAR Without Validation Gate',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's LOS does not perform field-level validation before populating the HMDA
      loan application register (LAR) export file; invalid action taken codes, missing census tract
      assignments for rural properties, and incorrectly mapped ethnicity collection fields are written
      directly to the LAR staging table. The CFPB's HMDA data quality examination process applies
      a 5% material error threshold to LAR filings; when annual LAR validation reveals a 9% error rate
      across 14,000 applications, the bank is required to refile its LAR and faces a reputational
      disclosure in the CFPB's public enforcement database that HMDA peer analysis firms will flag
      for mortgage lending regulators.`,
    keywords: ['HMDA', 'LAR', 'CFPB examination', 'data quality', 'digital origination'],
    demoRelevant: true,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1306',
    name: 'Pre-Qualification Flow Bypasses TILA Reg Z Disclosure Requirements',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's digital pre-qualification flow presents personalized rate and APR estimates
      to consumers who answer six income and credit questions, but the flow was designed as a
      marketing funnel rather than a regulated disclosure and does not comply with TILA Reg Z
      requirements for triggering disclosures when specific rate, term, and payment information is
      advertised. The CFPB's Reg Z examination guidance treats digital pre-qualification flows that
      quote specific APRs and monthly payments as triggering the full TILA disclosure and adverse
      action notice requirements; First Capital's flow omits the triggering term disclosures and
      adverse action process for declined pre-qualifications, creating dual exam risk.`,
    keywords: ['TILA', 'Reg Z', 'CFPB', 'adverse action', 'digital origination'],
    demoRelevant: true,
    subTopic: 'origination-platform',
  },

  // ── Fair Lending ─────────────────────────────────────────────────────────
  {
    code: 'B1307',
    name: 'HMDA LAR Filing Contains Systematic Census Tract Assignment Errors',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's HMDA LAR census tract assignments are derived from a geocoding vendor that
      uses a 2020 census boundary file updated annually, but the bank's LOS feeds the geocoder
      with address strings that include formatting inconsistencies — missing unit numbers, abbreviated
      street type suffixes — causing a 15% geocoding failure rate that defaults to county-level
      rather than tract-level assignment. HMDA data requires census tract accuracy for the CFPB
      and other regulators to perform fair lending geographic analysis; systematic tract-level
      errors mask potential redlining patterns in First Capital's rural and peri-urban assessment
      areas and prevent the bank from accurately monitoring its own CRA assessment area activity.`,
    keywords: ['HMDA', 'LAR', 'census tract', 'CFPB examination', 'CRA'],
    demoRelevant: true,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1308',
    name: 'Disparate Impact Testing Run Annually Rather Than at Policy Change Points',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital conducts its ECOA and HMDA disparate impact analysis on an annual calendar
      cycle, but the bank's credit policy introduces pricing exceptions, debt-to-income limit
      adjustments, and geographic risk overlays mid-year in response to market conditions. When a
      mid-year DTI tightening disproportionately affects Hispanic borrowers in two assessment areas,
      the disparate impact test does not run until the annual cycle — 9 months after the policy
      change — allowing the effect to accumulate across thousands of applications before detection.
      The CFPB's fair lending supervisory expectations require disparate impact testing to be
      linked to material policy changes, not only to annual cycles.`,
    keywords: ['ECOA', 'disparate impact', 'HMDA', 'CFPB examination', 'fair lending'],
    demoRelevant: true,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1309',
    name: 'Pricing Exception Approval Lacks Demographic Analysis Before Grant',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's mortgage and auto loan pricing exception process allows loan officers to
      grant below-matrix rate exceptions when a borrower presents competing offers, but the
      exception approval workflow does not capture the reason for the exception or require a
      review of whether exception rates are granted at different rates across demographic groups.
      CFPB and DOJ fair lending examination guidance identifies pricing exception monitoring as a
      Tier 1 examination priority; First Capital's exception data shows a statistically significant
      25% lower exception grant rate for Black and Hispanic borrowers compared to similarly
      qualified white borrowers, a pattern visible in the HMDA data that the bank's internal
      monitoring had not detected due to the absence of demographic linking.`,
    keywords: ['ECOA', 'pricing exception', 'HMDA', 'disparate impact', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1310',
    name: 'HMDA Reportable Action Date Field Captures Decision Date, Not Application Date',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      `First Capital's LOS populates the HMDA LAR action taken date field with the loan decision
      date rather than the application completion date, which is required under HMDA Regulation C
      for applications that are denied or withdrawn. The error affects 18% of denied applications
      and causes the bank's reported denial timeline to appear systematically faster than peer
      institutions, masking potential application-processing disparities that the CFPB would
      otherwise flag in its comparative file review. The error also corrupts the bank's internal
      fair lending analysis, which uses action taken date to calculate time-to-decision metrics
      across demographic groups.`,
    keywords: ['HMDA', 'Regulation C', 'LAR', 'CFPB examination', 'data quality'],
    demoRelevant: false,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1311',
    name: 'Redlining Risk Undetected Because CRA Assessment Area Excludes Growth MSAs',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's CRA assessment area boundaries were drawn in 2018 and reflect the bank's
      branch footprint at that time; digital lending has since extended the bank's geographic reach
      into three metropolitan statistical areas where the bank originates more than 50 loans per
      year but which fall outside the assessment area. The CFPB's 2024 CRA final rule and HMDA
      fair lending analysis both require assessment areas to reflect where a bank's lending
      activity actually occurs; the outdated assessment area boundaries mean the bank's redlining
      analysis does not test for peer-lending shortfalls in the MSAs where its digital origination
      is concentrated among higher-income, lower-minority-share zip codes.`,
    keywords: ['CRA', 'HMDA', 'redlining', 'CFPB examination', 'assessment area'],
    demoRelevant: false,
    subTopic: 'fair-lending',
  },

  // ── Auto-Underwriting ────────────────────────────────────────────────────
  {
    code: 'B1312',
    name: 'Credit Policy Override Rate Drifts Above Supervisory Alert Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's consumer lending credit policy defines automated underwriting approval
      criteria for personal loans and auto loans, but loan officers can request manual overrides
      from senior credit when applications fall outside policy. Over 18 months, the override
      approval rate climbs from 8% to 22% of referred applications as senior credit approvers
      accommodate sales pressure, without any compensating increase in post-origination monitoring
      for override portfolios. OCC Consumer Compliance examinations review override exception
      tracking as a fair lending indicator; a 22% override rate that concentrates approvals in
      specific geographic markets is treated as a pricing and underwriting exception management
      deficiency under the bank's consent order remediation scope.`,
    keywords: ['credit policy override', 'ECOA', 'OCC examination', 'consumer lending', 'exception management'],
    demoRelevant: true,
    subTopic: 'auto-underwriting',
  },
  {
    code: 'B1313',
    name: 'Exception Approval Authority Limits Not Enforced in Digital Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's credit policy matrix defines tiered exception approval authority — loan
      officers can approve up to $25,000 DTI exceptions, area managers up to $75,000, and
      regional credit up to $150,000 — but the LOS workflow system does not enforce these limits
      programmatically. Loan officers submit exceptions directly to regional credit for loan
      amounts below $25,000, bypassing the matrix, and the audit trail in the LOS does not
      distinguish between exceptions decided at the appropriate authority level versus those
      escalated incorrectly. OCC examination of the exception management program reveals systemic
      workflow bypass affecting 31% of documented exceptions, violating the bank's own policy
      and creating a governance gap in the credit risk framework.`,
    keywords: ['credit policy override', 'OCC examination', 'loan origination system', 'exception management', 'consumer credit'],
    demoRelevant: true,
    subTopic: 'auto-underwriting',
  },
  {
    code: 'B1314',
    name: 'Credit Bureau Integration Refresh Rate Creates Stale Score at Funding',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's digital auto loan origination flow pulls a credit bureau report at
      application but does not refresh the report before funding, which can be delayed 10–21
      days after the initial approval when vehicle inventory is unavailable. CFPB supervisory
      examination guidance on digital auto lending identifies pre-funding bureau refresh as a
      best practice; when a borrower accumulates significant new debt between application and
      funding — a pattern that increased after BNPL adoption accelerated in 2023–2024 — the
      funded loan's actual DTI can exceed the policy threshold by 15–20 points, inflating the
      portfolio's credit risk above the approved underwriting standard.`,
    keywords: ['credit bureau', 'auto lending', 'CFPB', 'DTI', 'digital origination'],
    demoRelevant: false,
    subTopic: 'auto-underwriting',
  },
  {
    code: 'B1315',
    name: 'Automated Underwriting Scorecard Not Recalibrated After Portfolio Shift',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's automated consumer loan scorecard was calibrated in 2020 on a portfolio
      concentrated in prime borrowers with FICO scores above 720; the bank's 2023–2024 digital
      lending growth pushed originations into the near-prime segment (FICO 620–720) without
      recalibrating the score-to-default relationship for this segment's different behavioral
      dynamics. The scorecard continues to rank-order applications effectively within the prime
      segment but systematically underestimates default probability in the near-prime segment
      by 18–22%, producing approval cutoffs that approve a materially higher percentage of
      near-prime applicants than the bank's credit risk appetite permits.`,
    keywords: ['credit scorecard', 'SR 11-7', 'auto-underwriting', 'consumer lending', 'model validation'],
    demoRelevant: false,
    subTopic: 'auto-underwriting',
  },
  {
    code: 'B1316',
    name: 'Debt-to-Income Calculation Excludes BNPL Obligations Not on Bureau',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's automated underwriting DTI calculation relies exclusively on tradeline
      obligations reported to the three major credit bureaus; buy-now-pay-later obligations,
      which were held by approximately 30% of applicants in the 25–40 age cohort in 2024,
      are not reported to bureaus by major BNPL providers and are therefore invisible to the
      DTI calculation. The CFPB's 2024 BNPL market report identifies the bureau reporting gap
      as a systemic underwriting risk; First Capital's consumer loan portfolio shows a 40%
      higher 90-day delinquency rate for borrowers aged 25–35 with thin-file bureau profiles,
      a cohort that is disproportionately likely to carry off-bureau BNPL obligations.`,
    keywords: ['CFPB', 'BNPL', 'debt-to-income', 'auto-underwriting', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'auto-underwriting',
  },

  // ── Servicing Compliance ─────────────────────────────────────────────────
  {
    code: 'B1317',
    name: 'RESPA Reg X Annual Escrow Analysis Sent After Statutory Deadline',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's mortgage servicing operation is required under RESPA Regulation X to
      deliver annual escrow account disclosure statements within 30 days of completing the
      escrow analysis computation. A servicing system integration defect causes the escrow
      analysis completion date to be incorrectly written to the output record for 8% of
      the portfolio, pushing the notification date past the 30-day statutory window. The
      CFPB's mortgage servicing examination manual treats escrow disclosure timing failures
      as a Tier 1 compliance deficiency; repeated late disclosures across a portfolio
      segment trigger a pattern-of-practice finding and require a remediation program
      with individual borrower notification.`,
    keywords: ['RESPA', 'Regulation X', 'escrow analysis', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1318',
    name: 'Mortgage Servicing Rights Valuation Uses Stale Prepayment Speed Assumptions',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's mortgage servicing rights (MSR) valuation model uses prepayment speed
      assumptions calibrated on the 2015–2021 low-rate refinance boom; following the 2022
      rate reset, borrowers with sub-4% mortgages exhibit near-zero voluntary prepayment
      propensity, but the MSR model has not been recalibrated to reflect post-shock borrower
      lock-in. The model produces MSR fair values that overstate prepayment risk by
      30–40%, systematically depressing the reported MSR carrying value relative to
      secondary market dealer quotes. OCC and FASB ASC 860 require MSR fair value disclosures
      to be based on current market assumptions; the stale-assumption gap creates a financial
      reporting risk that the bank's external auditors have flagged as a significant estimate.`,
    keywords: ['mortgage servicing rights', 'MSR', 'prepayment model', 'SR 11-7', 'FASB ASC 860'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1319',
    name: 'Loss Mitigation Waterfall Documentation Insufficient for CFPB Examination',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's mortgage servicing operation processes loss mitigation applications under
      RESPA Regulation X's Subpart C requirements but does not maintain a document-level audit
      trail showing the sequential evaluation of each option in the loss mitigation waterfall —
      forbearance, repayment plan, loan modification, short sale — with the reason for rejection
      at each option level before advancing to the next. CFPB mortgage servicing examinations
      consistently require this waterfall documentation as evidence that servicers evaluated all
      available options before proceeding to foreclosure referral; the absence of per-option
      rejection documentation for 62% of completed loss mitigation evaluations creates a per-se
      RESPA Reg X compliance deficiency independent of outcomes.`,
    keywords: ['RESPA', 'Regulation X', 'loss mitigation', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1320',
    name: 'Force-Placed Insurance Notifications Sent Without Required RESPA Timing',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's mortgage servicing platform generates force-placed insurance notifications
      automatically when a borrower's hazard insurance lapses, but the notification timing logic
      does not implement the 45-day and 15-day advance notice requirements mandated by RESPA
      Regulation X Section 1024.37. The system sends a combined notice that condenses the
      two-notice requirement into a single communication sent 18 days before force-placement,
      violating the sequential and minimum-gap notification requirements. CFPB examination
      findings on force-placed insurance practices have resulted in civil money penalties against
      multiple servicers; First Capital's procedural deficiency affects an estimated 1,200
      borrowers per year.`,
    keywords: ['RESPA', 'Regulation X', 'force-placed insurance', 'CFPB', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1321',
    name: 'Mortgage Transfer Servicing Notice Does Not Meet RESPA 15-Day Window',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's process for notifying borrowers when mortgage servicing is transferred
      to a subservicer relies on a manual workflow that is initiated when the transfer
      effective date is confirmed; the workflow does not programmatically enforce the RESPA
      Regulation X requirement that the transferor and transferee each provide written notice
      to the borrower at least 15 days before the effective date of transfer. Transfer date
      confirmation delays caused by subservicer boarding timelines result in 23% of transfer
      notices being sent within 10 days of the effective date, a statutory violation that the
      CFPB's mortgage servicing examination team has identified through complaint data as a
      recurring industry pattern.`,
    keywords: ['RESPA', 'Regulation X', 'mortgage servicing transfer', 'CFPB', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },

  // ── Digital Experience ────────────────────────────────────────────────────
  {
    code: 'B1322',
    name: 'PII Transmitted in URL Query Parameters in Mobile App Loan Status Page',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's mobile banking app loan status page passes the borrower's full Social
      Security Number as a URL query parameter to the loan status API endpoint, a practice
      that causes the SSN to be logged in web server access logs, cached in mobile browser
      history, and transmitted to third-party analytics SDKs embedded in the app that capture
      outbound URL strings. The CFPB's consumer data privacy expectations under its Dodd-Frank
      Section 1033 supervisory authority and California CCPA obligations treat SSN transmission
      in URLs as a per-se data handling deficiency; mobile application security standards
      (OWASP Mobile Top 10) have flagged PII-in-URL as a documented vulnerability class since
      2016.`,
    keywords: ['CFPB', 'CCPA', 'PII', 'mobile app security', 'digital lending'],
    demoRelevant: true,
    subTopic: 'digital-experience',
  },
  {
    code: 'B1323',
    name: 'Mobile App Session Timeout Below FFIEC Authentication Guidance Minimum',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      `First Capital's mobile banking application maintains authenticated sessions for up to
      60 minutes of inactivity to improve borrower experience during multi-document loan
      application flows, a design choice that exceeds the FFIEC's Authentication in an Internet
      Banking Environment guidance recommendation of no more than 15 minutes of inactivity for
      high-risk transactions including loan applications and account funding. The OCC's
      cybersecurity examination framework and the bank's own information security policy specify
      a 15-minute timeout, creating an internal policy conflict; the 60-minute implementation
      was approved through digital product management without a security risk waiver, a governance
      gap documented in the bank's IT audit findings.`,
    keywords: ['FFIEC', 'session timeout', 'mobile app', 'OCC cybersecurity', 'digital origination'],
    demoRelevant: false,
    subTopic: 'digital-experience',
  },
  {
    code: 'B1324',
    name: 'Opt-Out Flow Uses Dark Pattern That Increases Default Marketing Enrollment',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's digital loan application flow presents marketing communication preferences
      using pre-checked opt-in boxes and a gray-text opt-out link placed below the primary
      call-to-action button — a UX design pattern that systematically inflates marketing consent
      rates by exploiting cognitive default bias. The CFPB's 2022 circular on dark patterns in
      financial services explicitly identifies pre-checked consent boxes and visually suppressed
      opt-out links as deceptive acts or practices under Dodd-Frank Section 1031; the bank's
      digital lending product was designed by a third-party UX agency without consumer compliance
      review, and the pattern has been live for 18 months across 85,000 loan applications.`,
    keywords: ['CFPB', 'dark patterns', 'opt-out', 'Dodd-Frank Section 1031', 'digital origination'],
    demoRelevant: true,
    subTopic: 'digital-experience',
  },
  {
    code: 'B1325',
    name: 'Loan Rate Comparison Tool Displays Misleading APR on Promoted Products',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's digital lending rate comparison tool displays introductory APRs for
      promotional balance transfer products without displaying the post-promotional rate in
      the same visual context, and without including the origination fee in the APR calculation
      as required by TILA Reg Z for open-end credit disclosures. The CFPB's Reg Z examination
      guidance requires that APR be calculated to include all required fees when advertised;
      the comparison tool's rate display inflates the apparent cost advantage of First Capital's
      product over competitors by 180–240 basis points in post-promotional total cost, constituting
      a material misleading representation under Regulation Z and UDAP principles.`,
    keywords: ['TILA', 'Reg Z', 'CFPB', 'APR disclosure', 'digital origination'],
    demoRelevant: false,
    subTopic: 'digital-experience',
  },
  {
    code: 'B1326',
    name: 'Digital Loan Documents Stored in Unencrypted Customer-Accessible Cloud Folder',
    officeCategory: 'front_office',
    failureRatePct: 54,
    description:
      `First Capital's digital origination platform stores executed loan agreements, credit
      authorization forms, and income documentation in a shared-link cloud folder accessible
      via an unauthenticated URL that is embedded in the application confirmation email. The
      link provides access to all documents in the application folder without requiring customer
      authentication, meaning that anyone who intercepts or forwards the confirmation email
      can access the full loan file including SSN, income, and employment data. The CFPB's
      data security supervisory authority under Dodd-Frank Section 1034 and the Gramm-Leach-Bliley
      Act's Safeguards Rule require financial institutions to implement access controls
      commensurate with the sensitivity of customer financial records.`,
    keywords: ['CFPB', 'Gramm-Leach-Bliley Act', 'Safeguards Rule', 'data security', 'digital lending'],
    demoRelevant: false,
    subTopic: 'digital-experience',
  },

  // ── AI Lending — Core AI-Insertion Patterns ──────────────────────────────
  {
    code: 'B1327',
    name: 'AI Underwriting Model Generates Adverse Action Codes Not Tied to Model Logic',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital deploys an ML gradient-boosted credit decisioning model for personal loans
      that generates Reg B-compliant adverse action reason codes using a post-hoc SHAP explanation
      layer; the SHAP values are computed on a surrogate logistic regression rather than the
      production gradient-boost model, causing the top adverse action factors to diverge from
      the model's actual top feature importances for 25% of adverse action notices. The CFPB's
      2022 guidance on AI credit models and Reg B ECOA require that adverse action explanations
      reflect the specific and accurate reasons for the credit decision; a surrogate-derived
      explanation that misidentifies the dominant adverse factors is a per-se Reg B violation
      that survives even if the underlying credit decision is otherwise defensible.`,
    keywords: ['Reg B', 'ECOA', 'adverse action', 'AI underwriting model', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1328',
    name: 'LLM Customer Service Bot Provides Loan Terms Without Reg Z Disclosure Script',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital deploys a large language model-based customer service bot on its digital
      lending portal that answers questions about loan products, rates, and terms without
      routing through a compliance-approved disclosure script. When a borrower asks the LLM
      "what rate will I get on a $15,000 personal loan?", the model provides a specific rate
      estimate that constitutes an advertisement triggering TILA Reg Z disclosure requirements,
      but the LLM response does not include the required APR, repayment term, or total cost
      disclosures. The CFPB's LLM examination guidance under its Dodd-Frank supervisory authority
      treats LLM financial product responses as advertisements subject to the same disclosure
      requirements as human agent responses, and a pattern of non-compliant rate quotations
      across 5,000+ monthly interactions is a systemic TILA deficiency.`,
    keywords: ['LLM', 'TILA', 'Reg Z', 'CFPB', 'AI customer service'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1329',
    name: 'Automated Income Verification AI Without Fraud Detection Governance',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital integrates an AI-powered automated income verification vendor that uses
      bank account transaction data and payroll provider APIs to estimate borrower income without
      a paystub; the vendor's AI model has a 92% accuracy rate for salaried employees but has
      no fraud model layer to detect synthetic income patterns, payroll account stuffing, or
      short-window account funding that misrepresents average income. When a coordinated synthetic
      identity fraud ring exploits the income verification gap across 340 personal loan applications,
      the bank's OCC examination cites the absence of a fraud governance overlay on the income
      verification AI as a model risk management deficiency requiring SR 11-7 validation
      of the vendor's fraud detection capability.`,
    keywords: ['automated income verification', 'SR 11-7', 'fraud model', 'CFPB', 'AI underwriting model'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1330',
    name: 'AI Underwriting Model Disparate Impact Not Tested Before Production Deployment',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital deploys an AI personal loan underwriting model trained on five years of
      internal origination data without conducting pre-deployment disparate impact testing
      across race, national origin, sex, and age as proxy variables under ECOA and the
      CFPB's Reg B examination requirements. Post-deployment HMDA analysis reveals that
      the model's denial rate for Black applicants is 2.3 times higher than for white
      applicants with equivalent FICO scores, income, and DTI — a disparate impact that
      the pre-deployment validation report would have detected if it had included
      a demographic regression analysis. The CFPB's 2024 AI fair lending examination
      guidance requires pre-deployment bias testing as a mandatory validation element for
      AI credit decision models.`,
    keywords: ['AI underwriting model', 'ECOA', 'disparate impact', 'CFPB examination', 'Reg B'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1331',
    name: 'AI Lending Bot Collects Protected Class Data Indirectly Through Conversational Flow',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's AI-powered mortgage pre-qualification chatbot is designed to ask
      conversational questions about household composition, citizenship status, and primary
      language preference to route borrowers to appropriate product specialists; these
      questions are not HMDA-required demographic collection prompts and are asked before
      the formal application, allowing the model to use inferred protected class data
      as an implicit feature in subsequent routing and rate presentation decisions.
      The CFPB's Reg B commentary prohibits the use of information about protected class
      characteristics in credit decisions, even when collected through indirect conversational
      means; the chatbot's conversational feature collection creates a per-se ECOA exposure
      that the compliance team did not identify during product approval.`,
    keywords: ['ECOA', 'Reg B', 'CFPB', 'AI lending bot', 'protected class'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1332',
    name: 'CFPB AI Examination Readiness — Model Documentation Insufficient for Supervisory Review',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital has deployed three AI models in consumer lending origination — a credit
      decisioning model, an income verification model, and a fraud pre-screening model — but
      none of the model documentation packages include the explainability documentation,
      training data demographic composition analysis, fairness metric results, or adverse
      action explanation methodology that the CFPB's AI examination framework requires
      for models used in consumer credit decisions. When the CFPB initiates an AI-focused
      examination under its supervisory authority, First Capital's inability to produce
      this documentation within the examination's 30-day evidence request window is
      treated as a failure to maintain adequate records under Dodd-Frank Section 1024
      and triggers a separate OCC model risk finding on SR 11-7 documentation deficiency.`,
    keywords: ['CFPB examination', 'AI underwriting model', 'SR 11-7', 'Reg B', 'model documentation'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1333',
    name: 'Income Verification AI Vendor Retrained Without Bank Validation or Notification',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's automated income verification AI vendor deploys a major model retraining
      quarterly to improve accuracy on gig economy and multi-income borrowers, but the vendor
      SLA does not require advance notification to the bank before model changes are deployed
      to production. After a November 2024 retraining, the model's income estimate for
      self-employed borrowers increases by an average of 18%, inflating approved DTI ratios
      for this segment beyond the bank's policy limits without any monitoring alert firing.
      SR 11-7 and OCC TPRM guidance require the bank to treat material vendor model changes
      as model changes subject to the bank's own validation governance, a requirement that
      the bank's third-party contract with the income verification vendor does not address.`,
    keywords: ['automated income verification', 'SR 11-7', 'TPRM', 'vendor AI', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1334',
    name: 'AI Pricing Model Generates Rate Disparities Undetected by Quarterly Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AI loan pricing model uses a gradient-boost algorithm that combines
      FICO score, LTV, DTI, employment tenure, and 23 additional behavioral and transactional
      features to generate individualized rate offers for personal and auto loans. Quarterly
      disparate impact monitoring focuses on denial rates and does not analyze the AI-generated
      rate distribution across demographic groups; an OCC fair lending examination discovers
      that Black and Hispanic borrowers with equivalent risk profiles receive rates averaging
      85 basis points higher than white borrowers — a pricing disparity generated by the AI
      model's use of geographic and behavioral proxy features that correlate with race.
      ECOA and the CFPB's AI pricing examination guidance require pricing disparity analysis
      as part of model monitoring for AI rate-setting tools.`,
    keywords: ['AI pricing model', 'ECOA', 'CFPB examination', 'disparate impact', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1335',
    name: 'Generative AI Loan Modification Letter Template Generates Inaccurate Reg X Disclosures',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's mortgage servicing operation adopts a generative AI tool to draft
      individualized loan modification approval letters, repayment plan agreements, and
      RESPA Reg X required notices, with a human compliance reviewer approving each letter
      before mailing. When servicing volume spikes following a regional natural disaster,
      the review workflow is compressed to maintain 3-day response SLAs, and compliance
      reviewers are instructed to approve letters that contain minor discrepancies; post-audit
      review finds that 8% of mailed loss mitigation notices contain incorrect payment
      amounts, wrong trial period dates, or missing Reg X Section 1024.41 required
      disclosures, each of which constitutes a per-se RESPA violation.`,
    keywords: ['RESPA', 'Regulation X', 'generative AI', 'loss mitigation', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1336',
    name: 'Fraud Prediction AI Blocks Credit Access for Legitimate Thin-File Applicants',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's fraud pre-screening AI model scores loan applications for synthetic
      identity risk using features including application velocity, device fingerprinting,
      and credit bureau inquiry patterns; thin-file applicants — those with fewer than 5
      tradelines — receive high fraud risk scores due to feature overlap with synthetic
      identity profiles, causing 35% of legitimate first-time borrowers to be flagged
      for additional verification delays or outright declines. The CFPB's 2024 report on
      AI in consumer finance identifies fraud model false positives as a significant credit
      access barrier disproportionately affecting young, immigrant, and credit-rebuilding
      populations, and recommends that banks separately validate fraud model false-positive
      rates by demographic group as part of fair lending model governance.`,
    keywords: ['fraud AI', 'CFPB', 'ECOA', 'thin file', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1337',
    name: 'LLM Servicing Chatbot Provides Foreclosure Timeline Advice Without Legal Disclaimer',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's LLM-based mortgage servicing chatbot responds to borrower inquiries
      about foreclosure timelines, rights of redemption, and foreclosure alternatives by
      generating state-specific legal timeline summaries drawn from training data that may
      not reflect current state law amendments. The chatbot does not include a disclaimer
      that borrowers should seek legal counsel, does not verify the accuracy of state-law
      details against a maintained legal reference database, and has produced at least 14
      confirmed instances where borrowers relied on incorrect timeline information and
      missed loss mitigation application deadlines. CFPB Regulation X and state-level
      foreclosure counseling requirements impose specific obligations on servicers regarding
      the accuracy of foreclosure process information provided to borrowers.`,
    keywords: ['LLM', 'RESPA', 'Regulation X', 'mortgage servicing', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1338',
    name: 'AI Collection Scoring Model Generates Contact Prioritization Without FDCPA Review',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's consumer collections operation deploys an AI model that scores
      delinquent accounts by contact propensity and payment probability to prioritize
      outbound call and text campaigns, but the scoring model was developed by the
      collections technology team without review by compliance for Fair Debt Collection
      Practices Act (FDCPA) and CFPB Regulation F implications. The AI model optimizes for
      contact frequency to maximize promise-to-pay rates, but its scoring approach has not
      been reviewed against CFPB Reg F's 7-in-7 rule limiting contact attempts,
      the safe harbor conditions for text message contacts, or state-level collection
      harassment statutes — creating regulatory exposure across the consumer collections
      portfolio.`,
    keywords: ['FDCPA', 'CFPB', 'AI collection model', 'Regulation F', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'ai-lending',
  },

  // ── Extended Origination Platform Patterns ─────────────────────────────
  {
    code: 'B1339',
    name: 'Joint Application Income Aggregation Logic Produces Incorrect DTI',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's LOS income aggregation logic for joint mortgage applications combines
      primary and co-borrower income by summing gross monthly income from each borrower's
      income section without verifying whether overtime and bonus income exceeds the 24-month
      average requirement under TILA-RESPA Integrated Disclosure underwriting guidelines.
      For applications where one borrower's income includes variable compensation, the LOS
      over-counts qualifying income by up to 30%, producing DTI calculations that approve
      joint applications at DTI levels that the manually underwritten equivalent would reject.
      Post-close QC sampling identifies this as a systematic underwriting calculation error
      affecting 7% of joint applications.`,
    keywords: ['TILA-RESPA Integrated Disclosure', 'LOS', 'income verification', 'DTI', 'mortgage underwriting'],
    demoRelevant: false,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1340',
    name: 'Digital Mortgage Application Does Not Collect Required HMDA Race and Ethnicity Data',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's digital mortgage application skips the HMDA-required race, ethnicity,
      and sex collection fields when the borrower completes the application on a mobile device,
      due to a responsive design bug that hides the government monitoring information section
      on screens below 768 pixels wide. HMDA Regulation C requires that government monitoring
      information be collected for all mortgage applications regardless of the application channel;
      the mobile application path accounts for 42% of applications in First Capital's digital
      mortgage channel, producing a significant HMDA data quality gap that the CFPB's LAR
      review would flag as a systemic collection failure.`,
    keywords: ['HMDA', 'Regulation C', 'digital origination', 'CFPB examination', 'mobile app'],
    demoRelevant: true,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1341',
    name: 'Three-Day Waiting Period for TRID Disclosures Bypassed in Digital Fast-Track',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's digital mortgage product team designs a "fast-track" application flow
      that allows borrowers to proceed to income and asset documentation within 24 hours of
      receiving the Loan Estimate; the fast-track routing logic bypasses a system control
      that enforces the TRID three-business-day waiting period before the bank may require
      a fee other than a bona fide credit report fee. When fast-tracked borrowers submit
      appraisal fees within 48 hours of receiving the Loan Estimate, the bank has collected
      a fee before the TILA-RESPA waiting period expires — a per-se TRID violation documented
      across 2,300 applications in the fast-track cohort.`,
    keywords: ['TILA-RESPA Integrated Disclosure', 'TRID', 'CFPB', 'mortgage origination', 'digital origination'],
    demoRelevant: true,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1342',
    name: 'LOS Rate Lock Confirmation Does Not Capture All Reg Z Required Change Circumstances',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      `First Capital's LOS workflow for rate lock extensions and re-locks does not
      automatically generate a revised Loan Estimate when the rate lock change also
      changes the APR by more than 0.125%, triggers a product change, or involves
      a change in the loan program — all of which constitute a "change in circumstance"
      requiring a revised TRID Loan Estimate under TILA-RESPA rules. Loan officers
      processing rate lock changes in the LOS use a simplified rate lock form that
      does not check whether the change meets the TRID change-of-circumstance criteria,
      leaving a compliance gap that post-close QC identifies in 11% of rate lock transactions.`,
    keywords: ['TILA-RESPA Integrated Disclosure', 'TRID', 'Reg Z', 'LOS', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1343',
    name: 'Appraisal Independence Requirements Not Enforced in Digital AMC Ordering Flow',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's digital mortgage origination platform integrates directly with an
      appraisal management company API to allow loan officers to select from a list of
      preferred AMC appraisers when ordering appraisals. The integration bypasses the
      bank's appraisal independence policy by allowing loan officers to influence appraiser
      selection through a "preferred panelist" sorting mechanism, violating the Dodd-Frank
      Act's appraisal independence requirements and FIRREA provisions that prohibit loan
      production staff from influencing appraiser selection. The CFPB's ECOA Appraisal
      Rule and OCC appraisal guidelines require complete separation of loan production
      from appraiser ordering for federally related transactions.`,
    keywords: ['appraisal independence', 'FIRREA', 'ECOA', 'CFPB', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'origination-platform',
  },

  // ── Extended Auto-Underwriting Patterns ───────────────────────────────
  {
    code: 'B1344',
    name: 'Dealer Reserve Markup Program Lacks Fair Lending Monitoring for Auto Loans',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's indirect auto lending program allows dealers to mark up the bank's
      buy rate by up to 200 basis points as a dealer participation reserve, without monitoring
      the distribution of dealer markups across borrower race, national origin, or sex as
      proxy variables. The CFPB's 2013 guidance on dealer markup programs and the DOJ's
      enforcement actions against multiple auto lenders establish that dealer markup programs
      that produce systematic pricing disparities across demographic groups constitute ECOA
      and Equal Credit Opportunity violations even when the bank does not originate the markup
      directly; First Capital's indirect auto portfolio shows a statistically significant
      93 basis point markup disparity for Black borrowers compared to similarly qualified
      white borrowers that has not been detected by the bank's monitoring program.`,
    keywords: ['ECOA', 'dealer markup', 'auto lending', 'disparate impact', 'CFPB examination'],
    demoRelevant: false,
    subTopic: 'fair-lending',
  },
  {
    code: 'B1345',
    name: 'Student Loan Refinance Product DTI Underestimates Income-Driven Repayment Obligations',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's student loan refinance underwriting uses the borrower's current
      income-driven repayment plan monthly payment as the student loan obligation in the
      DTI calculation, rather than the fully amortizing payment that would apply if the
      borrower's income increases and disqualifies them from IDR. When borrowers transition
      out of income-driven repayment 2–3 years after refinancing, their fully amortizing
      payment can be 3–5 times higher than the IDR payment used at origination, producing
      a repayment burden that the DTI calculation at underwriting did not anticipate.
      The CFPB's ability-to-repay framework for private student loans requires assessment
      of the borrower's realistic long-term repayment burden, not the minimum current payment.`,
    keywords: ['CFPB', 'ability-to-repay', 'student loan', 'DTI', 'digital origination'],
    demoRelevant: false,
    subTopic: 'auto-underwriting',
  },
  {
    code: 'B1346',
    name: 'Automated Flood Zone Determination Not Refreshed Before Closing',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      `First Capital's mortgage origination process orders a flood zone determination at
      application but does not refresh the determination before closing for transactions
      where the FEMA flood map has been revised during the application pipeline period.
      The National Flood Insurance Reform Act requires that flood zone determinations
      reflect the current map at the time of loan consummation; in two assessment areas
      where FEMA issued Preliminary Flood Insurance Rate Map revisions in 2024, First
      Capital closed 340 loans without refreshed determinations, resulting in post-close
      notices to borrowers of mandatory flood insurance requirements they had not budgeted
      for at closing — a consumer harm that the CFPB records as a consumer complaint pattern.`,
    keywords: ['NFIP', 'flood zone determination', 'CFPB', 'mortgage origination', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'origination-platform',
  },
  {
    code: 'B1347',
    name: 'PMI Cancellation Notifications Not Automated for Borrower-Requested Reviews',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's mortgage servicing platform tracks LTV-based automatic PMI termination
      milestones as required by the Homeowners Protection Act (HPA) of 1998, but does not
      have a system workflow for processing borrower-initiated PMI cancellation requests
      when the borrower submits evidence of property value appreciation. Borrower-initiated
      cancellation requests arrive via the online servicing portal and are routed to a
      general servicing inbox, where average response time is 45 days against the HPA's
      implied 30-day review period. The CFPB's examination manual for mortgage servicers
      includes HPA compliance as a Tier 2 examination area, and a pattern of delayed
      responses to borrower cancellation requests is citable as an unfair practice.`,
    keywords: ['Homeowners Protection Act', 'PMI', 'CFPB', 'mortgage servicing', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1348',
    name: 'Bi-Weekly Payment Program Misapplied — Extra Payments Not Reducing Principal',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's bi-weekly mortgage payment program collects half-payments every two
      weeks, resulting in 26 half-payments — effectively one extra monthly payment — per year;
      however, the servicing platform's payment application logic holds the second bi-weekly
      half-payment in a suspense account until the end of the month and then applies both
      payments as a single monthly installment without the extra payment being credited to
      principal reduction. Borrowers enrolled in the bi-weekly program to accelerate payoff
      receive monthly statements showing no accelerated payoff schedule, and the RESPA
      Regulation X payment crediting requirements require that payments be applied to the
      loan balance in the manner consistent with the borrower's payment plan agreement.`,
    keywords: ['RESPA', 'Regulation X', 'payment crediting', 'mortgage servicing', 'CFPB'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1349',
    name: 'HELOC Draw Period Expiration Notices Not Sent Within Regulatory Window',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's HELOC servicing system does not generate advance notices to borrowers
      approaching the end of their draw period — when revolving access expires and the loan
      transitions to principal-and-interest repayment — as required by TILA Regulation Z
      HELOC rules that specify notice 3 months and 1 month before conversion. When HELOC
      borrowers transition unexpectedly from interest-only draws to full P&I payments without
      adequate advance notice, CFPB complaint data shows that payment shock complaints
      concentrate in the months immediately following draw period expiration for servicers
      without an automated notification workflow, a pattern the CFPB has cited in supervisory
      letters as an unfair or deceptive practice.`,
    keywords: ['TILA', 'Reg Z', 'HELOC', 'CFPB', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1350',
    name: 'Consumer Loan Payoff Quote Accuracy Fails on Variable-Rate Products',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's digital banking payoff quote feature calculates consumer loan payoff
      amounts using a fixed 10-business-day horizon but applies the current daily interest
      rate for all 10 days, failing to adjust for variable-rate reset dates that may occur
      within the payoff window. When variable-rate personal loan borrowers receive inaccurate
      low payoff quotes and submit the quoted amount, the shortfall after the rate reset
      triggers a payment dispute and a post-payoff balance notification — a customer service
      failure that the CFPB's complaint database shows as a recurrent issue in digital
      consumer lending payoff management, with implications for Regulation Z payoff statement
      accuracy requirements.`,
    keywords: ['TILA', 'Reg Z', 'payoff quote', 'digital banking', 'consumer lending'],
    demoRelevant: false,
    subTopic: 'digital-experience',
  },
  {
    code: 'B1351',
    name: 'SCRA Rate Reduction Not Applied Automatically for Active Duty Borrowers',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's consumer lending servicing platform does not integrate with the
      Department of Defense's Servicemembers Civil Relief Act (SCRA) database for automatic
      rate reduction verification; instead, rate reduction requests are processed manually
      when borrowers self-report active duty status. The bank's manual SCRA process misses
      approximately 18% of borrowers who go on active duty during the loan term without
      notifying the bank, as confirmed by periodic SCRA database reconciliation audits.
      The DOJ and CFPB have brought enforcement actions against multiple lenders for
      systematic SCRA non-compliance, and OCC examinations include SCRA compliance as a
      mandatory consumer compliance examination area for all depository institutions.`,
    keywords: ['SCRA', 'CFPB', 'OCC examination', 'consumer compliance', 'consumer lending'],
    demoRelevant: false,
    subTopic: 'servicing-compliance',
  },
  {
    code: 'B1352',
    name: 'AI Chatbot Loan Modification Intake Fails for Non-English Speakers',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's LLM-powered mortgage servicing chatbot provides loss mitigation
      intake, document collection instructions, and trial modification guidance in English
      only; when non-English-speaking borrowers attempt to use the chatbot, the system
      either returns generic error messages or provides inaccurate instructions generated
      by the LLM attempting to translate without a verified bilingual training dataset.
      The CFPB's 2023 Language Access Guidance for mortgage servicers and the LEP (limited
      English proficiency) provisions of RESPA Regulation X require that servicers provide
      meaningful access to loss mitigation programs for LEP borrowers; routing LEP borrowers
      to a nonfunctional AI chatbot without a human escalation path for all CFPB-designated
      languages creates a systemic servicing access disparity.`,
    keywords: ['LLM', 'RESPA', 'CFPB', 'language access', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1353',
    name: 'AI Pre-Approval Letters Generated Without Verified Income Documentation',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's digital mortgage application flow uses an AI income estimation model
      to issue digital pre-approval letters within minutes of application submission, before
      income documentation is collected or verified; the pre-approval letter states a
      maximum loan amount based on the AI-estimated income without disclosing that the
      estimate has not been verified against tax returns or paystubs. When borrowers act
      on these letters to enter purchase agreements and the subsequent income verification
      reveals significant discrepancies, loan denials after contract execution result in
      CFPB complaints and potential Reg B adverse action timeline issues. The CFPB's
      mortgage origination supervision program distinguishes pre-qualification letters
      (estimate-based) from pre-approval letters (documentation-verified) and requires
      clear disclosure of which type has been issued.`,
    keywords: ['AI underwriting model', 'CFPB', 'Reg B', 'mortgage origination', 'income verification'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1354',
    name: 'Auto Lending AI Model Uses ZIP Code as Feature — Fair Lending Proxy Concern',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's AI auto loan approval model includes applicant ZIP code and
      "distance to dealership" as direct features in the gradient-boost model, arguing
      these are operationally relevant predictors of loan performance. CFPB and DOJ
      fair lending analysis establishes that ZIP code is a well-documented proxy for
      race and national origin in U.S. metropolitan areas, particularly when included as
      a direct model feature rather than as a geographic risk adjustment with documented
      business necessity; the bank's model validation report acknowledges the proxy risk
      but concludes that the business necessity defense is available without conducting
      the required least-discriminatory alternative analysis that the CFPB's 2023 fair
      lending guidance requires before relying on the business necessity justification.`,
    keywords: ['ECOA', 'disparate impact', 'AI underwriting model', 'CFPB examination', 'auto lending'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1355',
    name: 'LLM Adverse Action Letter Generator Creates Non-Specific Denial Reasons',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital adopts a generative AI tool to produce individualized adverse action
      letters for consumer loan denials, with the intent of generating more readable,
      borrower-friendly denial explanations than the standard Reg B factor code list.
      The LLM generates explanations at a general level — "your income was insufficient
      for the requested loan amount" — rather than the specific, principal-reason basis
      required by Reg B ECOA, which must identify the specific factors that most
      influenced the credit decision in rank order. The CFPB's Reg B adverse action
      guidance requires principal-reason specificity that the LLM's general language
      generation architecture cannot reliably produce without constraining the output
      to pre-validated factor code mappings.`,
    keywords: ['Reg B', 'ECOA', 'adverse action', 'LLM', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1356',
    name: 'Digital Origination Satisfaction Survey Deployed With Dark Pattern Incentive Structure',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `First Capital's digital mortgage origination closing workflow presents a satisfaction
      survey to borrowers immediately after closing documents are signed, with a "submit and
      complete your loan" button that suggests survey completion is required to finalize
      the loan — a dark pattern that induces survey completion at a stage when borrowers
      are under closing pressure. The CFPB's supervisory guidance on UX patterns in
      financial services identifies pseudo-mandatory survey designs as a deceptive act
      or practice when the survey measures outcomes that the bank uses for regulatory
      compliance reporting, such as HMDA-adjacent experience metrics or fair lending
      customer experience surveys; the inflated survey response rate distorts the bank's
      consumer experience compliance monitoring.`,
    keywords: ['CFPB', 'dark patterns', 'digital origination', 'Dodd-Frank Section 1031', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'digital-experience',
  },
  {
    code: 'B1357',
    name: 'Home Equity AI Valuation Model Not Validated for Rural Property Types',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an automated valuation model (AVM) from a third-party vendor
      to support home equity loan origination in lieu of traditional appraisals for
      loans below $400,000; the AVM vendor's model is validated on metropolitan-area
      comparable sales data and has a stated confidence score threshold of 80%, but
      the bank does not separately validate the model's performance on rural property
      types that make up 35% of First Capital's assessment area. OCC Bulletin 2019-13
      and the bank regulators' 2021 joint AVM guidance require that banks validate
      vendor AVMs against their own portfolio composition, including property type
      subpopulations; the AVM's rural property error rate exceeds the urban rate
      by 340 basis points, creating LTV miscalculation risk on rural equity loans.`,
    keywords: ['AVM', 'SR 11-7', 'OCC', 'ECOA', 'home equity'],
    demoRelevant: false,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1358',
    name: 'Fair Lending Model Risk Controls Not Integrated Into AI Model Governance Policy',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital's AI model governance policy is maintained by the Model Risk Management
      function and addresses SR 11-7 validation, monitoring, and documentation requirements,
      but the policy does not integrate fair lending controls — disparate impact testing
      cadence, proxy variable restrictions, adverse action explanation requirements, and
      pre-deployment demographic analysis — as a mandatory element of the model validation
      lifecycle for consumer credit AI. The CFPB's 2024 AI supervision circular explicitly
      requires that banks operating AI credit models maintain an integrated governance
      framework that links SR 11-7 model risk and ECOA fair lending requirements; First
      Capital's bifurcated governance — MRM owns model quality, compliance owns fair lending —
      means that AI models can receive SR 11-7 validation sign-off without ever undergoing
      fair lending review, a gap that OCC and CFPB examinations are structured to detect.`,
    keywords: ['SR 11-7', 'ECOA', 'CFPB examination', 'AI underwriting model', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
  {
    code: 'B1359',
    name: 'CFPB AI Examination Readiness — No Playbook for Supervisory Information Request',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital has no documented examination playbook for responding to CFPB supervisory
      information requests focused on AI lending models — including model card documentation,
      training data provenance, fairness metric methodology, adverse action explanation
      validation, and third-party AI vendor contracts with model governance rights. When
      the CFPB initiates a targeted AI review as part of its 2025–2026 AI supervision
      initiative, First Capital's compliance team discovers that the AI vendor contracts
      do not grant the bank rights to audit vendor model training data, that model cards
      for two of the three AI credit models have not been maintained post-deployment,
      and that fairness testing results have not been documented in any system of record.
      The CFPB treats failure to produce requested model documentation within the examination
      window as an independent compliance deficiency under Dodd-Frank Section 1024.`,
    keywords: ['CFPB examination', 'AI underwriting model', 'SR 11-7', 'Reg B', 'ECOA'],
    demoRelevant: true,
    subTopic: 'ai-lending',
  },
];
