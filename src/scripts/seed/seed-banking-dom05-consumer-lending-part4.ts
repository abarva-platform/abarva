// seed-banking-dom05-consumer-lending-part4.ts
// Banking genome patterns — Consumer Lending & Digital Origination
// Code range: B1480–B1539  (60 patterns)
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

export const BANKING_DOM05_CONSUMER_LENDING_PART4_PATTERNS: PatternSeed[] = [

  // ── Mortgage Origination ─────────────────────────────────────────────────
  {
    code: 'B1480',
    name: 'Loan Estimate Delivery Clock Starts on Wrong Date When Application Taken by Phone',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's mortgage origination system starts the Regulation Z Section 1026.19(e)
      three-business-day Loan Estimate delivery clock from the date the loan officer enters
      the application into the LOS rather than the date on which all six TRID application
      elements were received — meaning the clock starts one to three days late when telephone
      applications are taken and documented in batch the following business day. CFPB TRID
      examination guidance is explicit that receipt of the six application elements, not
      LOS entry, triggers the delivery clock; First Capital's 2024 TRID compliance audit
      identifies 1,900 Loan Estimates delivered within the legal window by LOS date but
      outside the window by actual receipt date, each constituting a Regulation Z technical
      violation that OCC examiners classify under the mortgage origination compliance pillar.`,
    keywords: ['TRID', 'Regulation Z', 'Loan Estimate', 'CFPB examination', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1481',
    name: 'Closing Disclosure Issued Before Three-Business-Day Waiting Period Expires After Loan Estimate',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's mortgage closing scheduling system books closings seven calendar days
      after Loan Estimate delivery to satisfy the TRID waiting period, but does not adjust
      the closing date when revised Loan Estimates are issued for rate-lock extensions or
      appraisal fee changes — events that require a new three-business-day waiting period
      under Regulation Z Section 1026.19(e)(2)(ii). Post-close loan file audits find that
      12% of loans closed in 2024 had a revised Loan Estimate issued fewer than three
      business days before closing, constituting TRID violations that make the loans
      ineligible for sale to secondary market investors whose purchase agreements require
      TRID compliance certification, forcing the bank to hold the loans on balance sheet.`,
    keywords: ['TRID', 'Regulation Z', 'Closing Disclosure', 'CFPB examination', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1482',
    name: 'Intent to Proceed Documentation Missing for Online Mortgage Applications',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `Regulation Z's TRID rules require that creditors document the borrower's intent to
      proceed before charging any fees beyond the credit report fee; First Capital's digital
      mortgage origination platform collects the borrower's authorization to pull credit at
      application but does not separately capture a click-through acknowledgment of intent
      to proceed after the Loan Estimate is delivered. The bank's compliance team relies on
      an implicit intent standard — the borrower's continued engagement with the application
      portal — but the CFPB's 2022 supervisory findings at peer institutions reject implicit
      intent as insufficient and require an explicit documented borrower acknowledgment;
      the absence of explicit intent-to-proceed documentation prevents the bank from charging
      appraisal fees during the waiting period and creates a systematic TRID deficiency
      in every digital origination in the prior 18 months.`,
    keywords: ['TRID', 'Regulation Z', 'intent to proceed', 'CFPB examination', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1483',
    name: 'Appraisal Copy Not Provided to Borrower Three Days Before Closing',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `ECOA Regulation B Section 1002.14 requires that creditors provide applicants with a
      copy of each appraisal and written valuation used in connection with an application no
      later than three business days before consummation; First Capital's mortgage operations
      team delivers appraisal copies through the borrower portal at the time of clear-to-close,
      which in 22% of closings occurs fewer than three business days before the closing date.
      The three-day appraisal delivery requirement is a standalone ECOA obligation independent
      of TRID, and OCC examiners during First Capital's 2023 mortgage examination specifically
      cited same-day appraisal delivery at clear-to-close as a systemic Regulation B deficiency
      requiring an enterprise-wide remediation plan and retrospective borrower notification.`,
    keywords: ['ECOA', 'Regulation B', 'appraisal delivery', 'CFPB examination', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1484',
    name: 'Mortgage Rate Lock Confirmation Does Not Disclose Extension Fee Schedule',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's mortgage rate lock confirmation documents disclose the lock period and
      locked rate but do not disclose the fee schedule for lock extensions — typically 0.125%
      to 0.25% per 15-day extension — leaving borrowers unaware of the cost of construction
      delays or closing pushbacks until the extension fee is charged. The CFPB's TRID
      examination guidance and Regulation Z Section 1026.19(e)(3) require that rate lock
      extension fees be disclosed before they are incurred; the bank's practice of charging
      extension fees disclosed only in a generic fee schedule embedded in the loan application
      packet — rather than in the rate lock confirmation itself — constitutes a TILA
      material fee omission at the time the rate lock is executed.`,
    keywords: ['TILA', 'Regulation Z', 'rate lock', 'CFPB examination', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1485',
    name: 'HMDA Loan Purpose Coding Error Misclassifies Cash-Out Refinances as Rate-Term',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's mortgage LOS automatically assigns HMDA loan purpose codes based on
      the loan program code entered by the loan officer, but the mapping table does not
      distinguish between rate-term and cash-out refinances when the loan program code is
      "Conventional Refinance" — coding all conventional refinances as rate-term refinances
      regardless of whether proceeds exceed the payoff plus closing costs. HMDA Regulation C
      requires accurate loan purpose coding to enable CFPB fair lending analysis of cash-out
      refinance access by race and ethnicity; First Capital's systematic miscoding of cash-out
      refinances has been identified in the bank's annual HMDA LAR self-assessment, and the
      OCC's 2023 HMDA examination cites the miscoding as a data integrity finding that
      requires correction of the prior three years' LAR submissions.`,
    keywords: ['HMDA', 'Regulation C', 'CFPB examination', 'OCC', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1486',
    name: 'Non-QM Mortgage Ability-to-Repay Documentation Uses Stale Income for Self-Employed Borrowers',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital originates non-QM mortgages for self-employed borrowers using a
      12-month bank statement income methodology; the bank's underwriting guidelines allow
      the 12-month averaging period to end up to six months before the application date,
      meaning some borrowers' income is calculated from a period 6–18 months before closing.
      The CFPB's ability-to-repay rule under Regulation Z Section 1026.43(c) requires
      consideration of current or reasonably expected income, and using income data that
      is 12–18 months stale for self-employed borrowers in cyclical industries — where
      income can vary 30–40% year over year — does not represent reasonably expected income
      at loan origination. The bank's 2024 non-QM vintage performance shows that loans with
      greater than six months of income staleness have an 18-month default rate 2.8 times
      higher than loans with income documentation current within 90 days of closing.`,
    keywords: ['ability-to-repay', 'Regulation Z', 'non-QM', 'CFPB examination', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1487',
    name: 'Condo Project Approval Status Not Verified at Loan Submission Creating Secondary Market Risk',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's mortgage origination workflow does not verify Fannie Mae or Freddie Mac
      condo project approval status at the time of loan submission, relying instead on a
      loan officer attestation that the project meets agency guidelines; when the loan is
      delivered to the GSE at closing, the project is identified as unapproved or on the
      ineligible list, requiring the bank to repurchase the loan at a 5–15% premium to par
      value. The bank's 2024 loan repurchase log identifies 34 condo repurchase demands
      totaling $18.7M in unpurchased loan exposure, and the GSEs' automated project
      approval systems are accessible at origination — making the failure to verify at
      submission an avoidable operational gap that the OCC's mortgage production quality
      examination criteria classify as a systematic risk management deficiency.`,
    keywords: ['Fannie Mae', 'condo approval', 'OCC', 'mortgage origination', 'GSE repurchase'],
    demoRelevant: false,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1488',
    name: 'Construction-to-Permanent Loan TRID Disclosure Does Not Cover Both Phases',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital originates construction-to-permanent loans that convert to permanent
      mortgage financing upon construction completion; the bank issues TRID Loan Estimates
      that disclose only the permanent loan terms, without disclosing the construction phase
      interest rates, draw schedule fees, and inspection fees that apply during the
      construction period. CFPB guidance on construction-to-permanent loan TRID disclosures
      requires that all phases of the loan be disclosed in the initial Loan Estimate, and
      the OCC's 2022 mortgage examination procedures require lenders to demonstrate that
      construction phase costs are included in the disclosed APR and total loan cost;
      First Capital's practice of disclosing only permanent phase terms understates the
      total cost of credit disclosed at origination and creates a systematic TILA APR
      underdisclosure in every construction-to-permanent origination.`,
    keywords: ['TRID', 'Regulation Z', 'construction loan', 'CFPB examination', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1489',
    name: 'Mortgage Adverse Action Notice Time Clock Runs From Decision Not From Application Receipt',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `ECOA Regulation B Section 1002.9(a)(1) requires that adverse action notices on
      mortgage applications be provided within 30 days of receiving a completed application;
      First Capital's mortgage adverse action workflow starts the 30-day clock from the date
      the underwriter renders a decision rather than from the date the application was complete,
      causing a systematic delay of 8–14 days between application completeness and the
      underwriter's action that extends the actual elapsed time well beyond 30 days. The
      bank's 2024 Regulation B self-assessment identifies 2,400 mortgage adverse action
      notices that exceeded the 30-day limit when measured from application completeness
      date, each constituting an independent ECOA violation subject to CFPB civil money
      penalty and individual borrower actual damages under Regulation B Section 1002.16.`,
    keywords: ['ECOA', 'Regulation B', 'adverse action', 'CFPB examination', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1490',
    name: 'Mortgage Pre-Approval Letter Issued Without Reviewing Asset Documentation',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's retail mortgage sales team issues pre-approval letters based on
      credit pull and stated income without collecting or reviewing asset documentation
      to verify that the borrower has sufficient funds for down payment and closing costs;
      when full underwriting is completed at the time of purchase contract execution,
      22% of pre-approved borrowers are unable to document the assets represented in the
      pre-approval, causing contract failures that harm both the borrower and the property
      seller. The CFPB's UDAP supervisory framework and state mortgage licensing laws in
      eight of First Capital's operating states treat pre-approval letters as material
      representations of creditworthiness, and issuing pre-approvals without verifying
      assets constitutes a misrepresentation of approval certainty that falls within
      the CFPB's unfair acts or practices authority.`,
    keywords: ['CFPB', 'UDAP', 'mortgage pre-approval', 'OCC', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'mortgage-origination',
  },
  {
    code: 'B1491',
    name: 'HMDA Geocoding Errors Concentrate in Rural Census Tracts Below 50% Match Rate',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's HMDA geocoding vendor achieves a 97% match rate for suburban and
      urban addresses but falls to a 48% automated match rate for rural addresses in the
      bank's five-state footprint, with unmatched records coded to the county centroid
      census tract rather than the actual census tract of the property. The CFPB's HMDA
      data quality examination standards and OCC's HMDA examination procedures require
      that census tract data be accurate at the property level, not county level, because
      county centroid coding distorts fair lending analysis of rural lending patterns;
      the bank's rural census tract coding errors affect approximately 3,200 LAR records
      annually and have been identified in the OCC's prior two HMDA examinations without
      a sustained vendor remediation.`,
    keywords: ['HMDA', 'Regulation C', 'geocoding', 'OCC', 'fair lending'],
    demoRelevant: false,
    subTopic: 'mortgage-origination',
  },

  // ── Loss Mitigation ───────────────────────────────────────────────────────
  {
    code: 'B1492',
    name: 'Loss Mitigation Application Complete Date Not Logged Preventing Reg X Clock Compliance',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `CFPB RESPA Regulation X Section 1024.41 imposes strict timelines on servicers from
      the date a loss mitigation application is complete — 30 days to evaluate and notify
      on a short sale or deed-in-lieu, 30 days to evaluate any loss mitigation option, and
      5 days to acknowledge receipt of a complete application; First Capital's loss mitigation
      platform does not generate an automated timestamp when the last missing document is
      received and the application becomes complete, making it impossible to audit compliance
      with the 5-day, 30-day, and evaluation timelines. The OCC's 2023 mortgage servicing
      examination found that the absence of application completeness timestamps is a
      systemic control failure that makes the bank structurally incapable of demonstrating
      Regulation X compliance, regardless of whether its actual processing times were within
      the required windows.`,
    keywords: ['RESPA', 'Regulation X', 'loss mitigation', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1493',
    name: 'Dual Tracking Continues During Active Loss Mitigation Review on Pre-2014 Loans',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `Regulation X's anti-dual-tracking provisions prohibit servicers from proceeding to
      foreclosure while a complete loss mitigation application is under review; First Capital's
      loss mitigation and default servicing systems share data through a nightly batch feed
      with a 24-hour processing lag, creating a window during which the foreclosure team may
      issue a Notice of Default or Schedule a Sale on accounts where a complete loss
      mitigation application is actively being evaluated. In 2024, the bank's internal audit
      identified 47 accounts where a Notice of Default was issued within 24 hours of a
      loss mitigation application being marked complete — the precise dual-tracking scenario
      the CFPB's Regulation X rules were designed to prevent — and the bank's breach
      notification to the CFPB generated a supervisory matter requiring remediation and
      enhanced system controls.`,
    keywords: ['RESPA', 'Regulation X', 'dual tracking', 'CFPB examination', 'loss mitigation'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1494',
    name: 'Trial Payment Plan Completion Not Automatically Converted to Permanent Modification',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital offers trial payment plans (TPPs) as the first step in a permanent
      loan modification, requiring three on-time trial payments before the permanent
      modification documents are prepared; the bank's servicing platform does not
      automatically generate the permanent modification offer when the third trial payment
      clears, instead routing the account to a manual review queue with an average 28-day
      processing time. CFPB supervisory guidance on trial payment plans requires that
      servicers offer a permanent modification within a reasonable time after TPP completion,
      and the bank's 28-day delay results in a fourth month of trial payment before
      permanent modification execution — a period during which the borrower's credit
      continues to report derogatory and any foreclosure referral prohibition lapses
      under Regulation X's timeline provisions.`,
    keywords: ['RESPA', 'Regulation X', 'loan modification', 'CFPB examination', 'loss mitigation'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1495',
    name: 'Short Sale Approval Issued After Listing Price Exclusion Causes RESPA Kickback Risk',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `When First Capital approves short sales, the approval letters specify a minimum net
      proceeds amount but also name a preferred title company and suggest a preferred listing
      agent without disclosing any compensation arrangement between the bank and those third
      parties. RESPA Section 8(a) prohibits giving or accepting fees or other things of value
      in connection with a referral of settlement service business; if the bank's preferred
      title company and preferred agent referrals are accompanied by any compensation —
      including marketing fees, desk rental, or administrative fee arrangements — the
      short sale approval letter referrals constitute RESPA Section 8 kickback violations.
      The CFPB's 2023 RESPA Section 8 supervisory sweep found that 6 of 15 servicers examined
      had undisclosed compensation arrangements with third-party service providers named in
      loss mitigation approval letters.`,
    keywords: ['RESPA', 'CFPB examination', 'kickback', 'short sale', 'loss mitigation'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1496',
    name: 'Borrower Denial for Loss Mitigation Not Accompanied by Non-Foreclosure Appeal Right Notice',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `CFPB Regulation X Section 1024.41(h) requires that when a servicer denies a borrower
      for all available loss mitigation options, the denial notice must inform the borrower
      of their right to appeal the denial and the specific appeal process within 30 days;
      First Capital's loss mitigation denial letter template provides the denial reason
      but does not include the appeal rights disclosure, because the template was drafted
      before the CFPB's 2016 Regulation X amendments added the appeal right requirement.
      The bank's 2024 RESPA compliance audit identifies 890 loss mitigation denial letters
      issued without appeal rights disclosures in the prior 12 months, and the OCC's
      2023 mortgage servicing pillar examination finding cites the template deficiency as
      a systemic Regulation X violation requiring template correction and retroactive
      borrower notification.`,
    keywords: ['RESPA', 'Regulation X', 'loss mitigation denial', 'CFPB examination', 'appeal rights'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1497',
    name: 'Forbearance End Outreach Does Not Offer Full Suite of CARES Act Successor Options',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `When COVID-19 forbearance agreements near their end date, First Capital's outreach
      workflow contacts borrowers by automated call and offers a reinstatement-or-repayment-plan
      menu without mentioning payment deferral, loan modification, or streamlined modification
      options that are available under the bank's GSE and FHA/VA servicing guidelines.
      The CFPB's COVID-19 mortgage servicing guidance and its 2021 mortgage servicing rules
      require that servicers proactively offer all available loss mitigation options to
      borrowers exiting forbearance; offering only the two most operationally convenient
      options constitutes a failure to comply with Regulation X's loss mitigation evaluation
      requirements, and the bank's post-forbearance delinquency rate is 18% higher than
      the GSE servicer benchmark for comparable portfolios — suggesting that borrowers who
      should have received deferral or modification offers instead defaulted.`,
    keywords: ['RESPA', 'Regulation X', 'forbearance', 'CFPB examination', 'loss mitigation'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1498',
    name: 'Loan Modification Agreement Signed by Borrower Not Countersigned Within Servicer Commitment Period',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's permanent loan modification agreements require the borrower to sign
      and return the modification agreement within 14 days of receipt; however, the bank's
      modification execution process takes an average of 31 days to countersign and record
      the executed modification, often after the borrower's acceptance period expires.
      In states requiring recorded loan modifications to be enforceable against a bona fide
      purchaser, the recording delay creates a chain-of-title gap; the CFPB's mortgage
      servicing examination manual requires that servicers demonstrate that modification
      execution timelines are operationally sufficient to complete the agreement before
      the borrower's commitment window closes, and the bank's current 31-day countersign
      cycle makes compliance with 14-day borrower commitment windows structurally impossible.`,
    keywords: ['CFPB', 'Regulation X', 'loan modification', 'mortgage servicing', 'RESPA'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1499',
    name: 'Veterans Affairs Refund Refusal After Cash-Out Refinance Under Interest Rate Reduction',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital originates VA Interest Rate Reduction Refinance Loans (IRRRLs) for
      veteran borrowers; the bank's IRRRL disclosure process does not correctly explain the
      VA Net Tangible Benefit Test — requiring the new loan to produce a measurable payment
      reduction — and originates IRRRLs where the net tangible benefit is marginal or
      absent due to closing cost financing. The VA's 2023 IRRRL audit requirements and
      Regulation Z's net tangible benefit disclosure rules for VA refinances require lenders
      to document that the refinance produces a net tangible benefit and provide veterans with
      a plain-language comparison of old and new loan costs; the bank's IRRRL disclosures
      provide a payment comparison but do not include the break-even analysis or total
      cost comparison that the VA's Lender's Handbook requires as a predatory lending
      safeguard.`,
    keywords: ['VA loan', 'IRRRL', 'Regulation Z', 'CFPB', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1500',
    name: 'Successors in Interest Not Identified and Communicated to After Borrower Death',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `CFPB Regulation X Section 1024.38 requires mortgage servicers to have policies and
      procedures reasonably designed to identify and communicate with confirmed successors in
      interest — heirs and surviving spouses — who have the right to assume the mortgage after
      a borrower's death; First Capital's servicing platform requires a probate-certified
      heir appointment before an heir is added to the account communication record, blocking
      loss mitigation communications with heirs who have inherited the property but have not
      yet completed probate. The CFPB's 2022 successor-in-interest supervisory action found
      that requiring probate completion before recognizing an heir for communication purposes
      violates Regulation X because it denies heirs access to loss mitigation programs they
      are entitled to pursue before foreclosure, causing unnecessary property losses.`,
    keywords: ['RESPA', 'Regulation X', 'successor in interest', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1501',
    name: 'Mortgage Delinquency Reporting to Credit Bureaus Not Suppressed During Active Loss Mitigation',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's monthly credit bureau reporting process does not suppress derogatory
      mortgage delinquency furnishing for accounts that are in an active loss mitigation
      evaluation under Regulation X Section 1024.41, allowing negative tradeline information
      to be furnished for accounts where the servicer is required to pause other adverse actions.
      The CFPB's 2021 FCRA and Regulation X joint supervisory guidance states that servicers
      furnishing derogatory information on accounts in active loss mitigation review may create
      an unfair act because the reporting penalizes borrowers seeking help that the servicer
      is obligated to offer; the bank's credit furnishing suppression logic only triggers
      for accounts in active trial payment plans, not for accounts in the broader loss
      mitigation evaluation window.`,
    keywords: ['FCRA', 'Regulation X', 'credit reporting', 'CFPB examination', 'loss mitigation'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },

  // ── Consumer Protection & Lending ─────────────────────────────────────────
  {
    code: 'B1502',
    name: 'Fee Waiver Offered Verbally by Call Center Agent Not Honored by Back-Office Processor',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's consumer lending call center agents offer fee waivers — late fees,
      NSF fees, and origination fee refunds — to retain borrowers expressing intent to
      close accounts or refinance elsewhere, but the agent's verbal commitment is recorded
      only as a CRM note and is not automatically transmitted to the payment processing
      or fee posting system; the back-office processor applies the fee as scheduled unless
      the CRM note is manually reviewed and actioned within 24 hours. The CFPB's UDAP
      supervisory guidance and Reg E's error resolution procedures both treat written or
      verbal representations by authorized bank personnel as binding commitments; the
      bank's 2024 borrower complaint log contains 610 complaints from borrowers charged
      fees after receiving agent fee-waiver commitments, a pattern the CFPB characterizes
      as a deceptive act.`,
    keywords: ['CFPB', 'UDAP', 'Reg E', 'consumer lending', 'fee waiver'],
    demoRelevant: false,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1503',
    name: 'MLA Military APR Calculation Omits Add-On Product Fees Purchased at Origination',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `The Military Lending Act's 36% Military Annual Percentage Rate (MAPR) cap requires that
      the MAPR calculation include all fees for ancillary credit products purchased at
      origination, including credit insurance, debt cancellation products, and prepaid
      card fees added to the loan; First Capital's MAPR calculator excludes optional add-on
      product fees from the MAPR on the grounds that they are voluntary, a position the
      DoD's 2016 MLA final rule and the CFPB's 2017 MLA examination procedures directly
      reject. For any covered borrower — active duty servicemembers, dependents, and recently
      separated veterans within the MLA's lookback period — inclusion of add-on fees causes
      the MAPR to exceed 36% on approximately 14% of consumer loan originations that
      currently pass the MAPR ceiling, making those originations void and unenforceable
      under MLA Section 232.8.`,
    keywords: ['MLA', 'MAPR', 'DoD', 'consumer lending', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1504',
    name: 'Reg E Provisional Credit Not Granted Within 5 Business Days for Disputed Consumer Transactions',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `Federal Reserve Regulation E Section 1005.11(c) requires that financial institutions
      provisionally credit disputed EFT transaction amounts within 5 business days of receiving
      an error notice when the institution's investigation will take longer than 5 days;
      First Capital's consumer banking dispute system routes EFT disputes through a fraud
      investigation queue with a standard 10-business-day SLA before provisional credit is
      granted, bypassing the 5-day provisional credit requirement. The CFPB's 2023 Reg E
      examination findings at peer institutions identified the substitution of a fraud
      investigation SLA for the provisional credit obligation as a systematic Regulation E
      violation subject to per-occurrence civil money penalties, and the CFPB requires
      both retrospective provisional credit remediation and SLA redesign as components
      of any consent order resolution.`,
    keywords: ['Regulation E', 'CFPB examination', 'provisional credit', 'EFT dispute', 'consumer compliance'],
    demoRelevant: true,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1505',
    name: 'Credit Card Overlimit Fee Charged Despite Opt-In Program Not Being Offered at Origination',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `Regulation Z Section 1026.56 requires that credit card issuers obtain affirmative
      opt-in consent before charging an overlimit fee; First Capital's credit card origination
      channel on its banking app presents the overlimit fee option as a pre-selected checkbox
      in the card agreement summary screen rather than as an affirmative opt-in prompt,
      resulting in automatic enrollment in the overlimit fee program for all digital
      origination cardholders. The CFPB's 2022 supervisory action on pre-checked opt-in
      checkboxes for credit card fees concluded that pre-checked consent is not valid
      affirmative consent under Regulation Z Section 1026.56(b); First Capital's digital
      card origination channel has enrolled approximately 28,000 cardholders in the
      overlimit program without valid opt-in, requiring individual consent re-solicitation
      and fee refund remediation.`,
    keywords: ['Regulation Z', 'CFPB examination', 'overlimit fee', 'credit card', 'opt-in consent'],
    demoRelevant: false,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1506',
    name: 'CRA Credit Not Claimed for Community Development Loans in Assessment Area',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's CRA management system does not automatically flag community development
      loans — loans to affordable housing projects, CDFIs, and SBA Section 7(a) small
      business loans in low-to-moderate income census tracts — for CRA credit calculation
      in the bank's Community Reinvestment Act performance evaluation; the classification
      depends on a manual review by the CRA officer, and 23% of eligible loans in the
      prior CRA examination period were not claimed. The OCC's CRA examination procedures
      require that banks maintain complete and accurate records of all CRA-qualifying activity
      to support the examiners' CRA rating assessment; unclaimed CRA credit caused First
      Capital to receive a "Needs to Improve" rating component in its 2023 CRA examination,
      triggering enhanced regulatory scrutiny and potential restriction on future M&A
      and branch applications under the OCC's CRA rating linkage requirements.`,
    keywords: ['CRA', 'OCC', 'community development', 'LMI', 'consumer compliance'],
    demoRelevant: true,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1507',
    name: 'UDAP Abusive Standard Not Applied to Consumer Loan Product Features by Compliance Team',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's compliance management system evaluates consumer loan product features
      for unfair and deceptive acts under UDAP but does not separately analyze whether
      product features meet the "abusive" standard under Dodd-Frank Section 1031, which
      prohibits acts that take unreasonable advantage of consumers' lack of understanding
      or inability to protect their interests. Products such as mandatory arbitration clauses
      bundled with penalty interest rates, loyalty reward structures that expire before
      the average redemption cycle, and credit line reduction notices with 5-day response
      windows have not been evaluated for abusiveness — leaving a gap between the bank's
      UDAP compliance framework and the full scope of the CFPB's Section 1031 examination
      authority that the CFPB's 2023 abusiveness policy statement restored as a primary
      enforcement lens.`,
    keywords: ['CFPB', 'UDAP', 'abusive standard', 'Dodd-Frank Section 1031', 'consumer compliance'],
    demoRelevant: true,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1508',
    name: 'Debt Collection Communication Frequency Exceeds FDCPA Harassment Standard',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's collections dialer system initiates up to seven consumer contact
      attempts per day per delinquent consumer lending account across multiple channels
      — cell phone, home phone, and email — counting multi-channel contacts as separate
      events rather than as total contact attempts for the day. The CFPB's 2021 Debt
      Collection Rule under the FDCPA establishes a rebuttable presumption that more than
      seven calls within seven days constitutes harassment; First Capital's multi-channel
      counting method generates contact frequencies that exceed the seven-call presumption
      threshold in 31% of delinquent accounts and has already generated 480 FDCPA
      harassment complaints in 2024 alone — each a per-occurrence violation subject to
      statutory damages under FDCPA Section 813.`,
    keywords: ['FDCPA', 'CFPB', 'debt collection', 'consumer lending', 'harassment standard'],
    demoRelevant: false,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1509',
    name: 'Electronic Signature Consent Process Does Not Comply With E-SIGN Act Disclosure Requirements',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's digital consumer loan origination platform uses a single-click
      electronic signature consent that does not provide the E-SIGN Act's required prior
      disclosure that the consumer has the right to receive paper copies and the right
      to withdraw E-SIGN consent, along with instructions for how to exercise those rights.
      The E-SIGN Act Section 101(c) requires that these disclosures be provided prior to
      obtaining consent, and the CFPB's TILA and Regulation Z examination procedures require
      that electronic signatures on consumer loan agreements be preceded by compliant E-SIGN
      consent; the bank's e-signature vendor implemented the consent process without a legal
      review of E-SIGN requirements, and the absence of the required prior disclosure makes
      every electronically-signed consumer loan agreement potentially unenforceable in
      states that apply E-SIGN Act technical compliance strictly.`,
    keywords: ['E-SIGN Act', 'CFPB', 'electronic signature', 'consumer lending', 'Regulation Z'],
    demoRelevant: false,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1510',
    name: 'Reg CC Funds Availability Hold Exceeds Statutory Maximum Without Exception Conditions',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's deposit operations system applies a standard 5-business-day hold to
      all mobile check deposits above $2,500, citing general exception hold authority under
      Regulation CC Section 229.13; Regulation CC permits extended holds only when the
      bank has a reasonable cause to believe the check will not be paid — a case-specific
      determination requiring documented exception criteria — not as a blanket policy for
      all large mobile deposits. The Federal Reserve's Regulation CC examination procedures
      require that extended holds be individually justified and that consumers be provided
      a notice stating the reason for the hold and the specific funds availability date;
      First Capital's blanket 5-day hold policy without documented exception justification
      is a systematic Regulation CC violation affecting approximately 12,000 consumer
      accounts monthly.`,
    keywords: ['Regulation CC', 'CFPB', 'funds availability', 'mobile deposit', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'consumer-protection-lending',
  },
  {
    code: 'B1511',
    name: 'Credit Insurance Solicitation at Loan Closing Does Not Comply With CFPB Bundling Rules',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's consumer loan closing process requires loan officers to present
      a credit life and disability insurance enrollment packet at the same time as the
      loan closing documents — without allowing a meaningful pause for borrowers to
      consider the optional insurance separate from the loan closing decision. The CFPB's
      2012 supervisory guidance on credit insurance products and subsequent UDAP enforcement
      actions establish that soliciting credit insurance as part of the loan closing process,
      where social pressure to complete the loan is highest, constitutes an abusive practice
      when the insurance is presented in a manner that blurs its optional nature;
      the bank's 2024 credit insurance complaint data includes 280 complaints from borrowers
      who believed insurance was required to obtain the loan, a pattern consistent with
      prior CFPB consent orders against institutions with identical closing-time solicitation
      practices.`,
    keywords: ['CFPB', 'UDAP', 'credit insurance', 'consumer compliance', 'Dodd-Frank Section 1031'],
    demoRelevant: true,
    subTopic: 'consumer-protection-lending',
  },

  // ── AI Consumer Lending Part 4 ────────────────────────────────────────────
  {
    code: 'B1512',
    name: 'AI Mortgage Underwriting System Drift Undetected for Eight Months After Training Data Cutoff',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's AI mortgage underwriting model has a January 2023 training data
      cutoff; post-2023 home price appreciation and employment market shifts have caused
      the model's property value and income stability feature distributions to drift
      from the training distribution, yet the bank's model monitoring program only
      reports aggregate approval rate statistics rather than PSI (population stability
      index) or feature-level drift metrics. SR 11-7 requires that production models
      have ongoing monitoring sufficient to detect performance degradation before it
      materializes in default rates; the OCC's 2024 AI model supervision guidance
      specifically requires drift telemetry with alert thresholds for mortgage AI models,
      and the bank's absence of feature-level monitoring constitutes a model risk management
      deficiency that will be cited in the upcoming consent order progress examination.`,
    keywords: ['SR 11-7', 'AI mortgage underwriting', 'model drift', 'OCC', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1513',
    name: 'AI Document Classification Tool Misroutes Loan Files Causing Compliance Clock Failures',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital implemented an AI document classification tool to automatically route
      incoming mortgage and consumer loan documents to the correct processing queue —
      loss mitigation, escrow, payoff, or dispute resolution — using a fine-tuned
      classification model trained on six months of historical routing data. The model
      achieves 89% routing accuracy in testing but produces a 14% misroute rate on
      handwritten or mixed-format borrower correspondence, sending QWRs to the escrow
      queue and loss mitigation applications to the payoff queue, where they age without
      triggering the applicable RESPA regulatory response clocks. The CFPB's 2023
      supervisory update on AI in mortgage servicing operations states that servicers
      relying on AI document routing must implement human review checkpoints for low-confidence
      classifications, and the absence of such checkpoints means the bank cannot demonstrate
      Regulation X clock compliance for any document processed by the AI router.`,
    keywords: ['AI document routing', 'RESPA', 'Regulation X', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1514',
    name: 'LLM Consumer Complaint Categorization Underreports HMDA-Relevant Denial Reasons',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an LLM-based system to categorize inbound consumer complaints
      and route them to the appropriate regulatory response team; the LLM's taxonomy
      does not include HMDA denial reason codes as a complaint category, so mortgage denial
      complaints that allege discriminatory or ECOA-related denial reasons are routed to
      general customer service rather than to the fair lending compliance team. The CFPB's
      fair lending examination procedures require that any consumer complaint alleging
      discriminatory treatment in credit be escalated to the bank's fair lending compliance
      function for review and potential HMDA LAR correction; the bank's LLM-driven routing
      failure means 340 denial-related complaints in 2024 were resolved as customer service
      issues without fair lending review, constituting a systemic failure of the bank's
      complaint management program under OCC Bulletin 2012-28.`,
    keywords: ['LLM complaint routing', 'HMDA', 'ECOA', 'OCC', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1515',
    name: 'AI Prepayment Speed Model Used for Mortgage Hedge Without SR 11-7 Tier Assignment',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's secondary market mortgage operations team uses an AI prepayment
      speed model to estimate mortgage-backed security convexity and hedge the bank's
      mortgage servicing rights portfolio; the model was developed by the capital markets
      desk and has never been registered in the bank's enterprise model inventory or
      assigned an SR 11-7 tier — meaning it has not been validated, does not have a
      documented performance benchmark, and is not subject to annual review. The FRB's
      SR 11-7 guidance and the OCC's model risk examination criteria require that all
      models influencing financial exposure be inventoried and risk-tiered regardless of
      the originating business unit; an AI model directly influencing hedge ratios for
      a $2.4B MSR portfolio without MRM oversight is a high-severity model risk finding
      that will require emergency validation and potential hedging strategy restatement.`,
    keywords: ['SR 11-7', 'AI prepayment model', 'MSR', 'OCC', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1516',
    name: 'AI Conversational Loan Advisor Provides Debt Consolidation Recommendations Without FINRA Supervision',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's AI conversational banking assistant is programmed to recommend
      debt consolidation personal loans as a solution when customers ask about credit
      card payoff strategies, analyzing the customer's balance and rate data to compute
      an estimated savings figure and recommending the consolidation loan by amount and
      term. When the recommendation involves rolling investment account-backed credit
      lines or brokerage margin lending into a personal loan, the AI's output may
      constitute investment advice under FINRA Rule 2111 suitability requirements,
      and the bank's legal review has not analyzed whether the AI's automated loan
      recommendations constitute broker-dealer activity requiring FINRA supervision.
      The CFPB's 2024 AI consumer interaction supervisory guidance requires that banks
      map all AI consumer-facing financial recommendations against applicable securities
      and investment advice regulatory perimeters before deployment.`,
    keywords: ['AI loan advisor', 'FINRA', 'CFPB', 'consumer lending', 'suitability'],
    demoRelevant: false,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1517',
    name: 'GenAI Customer Communication Tool Produces Rate Quotes That Constitute Commitment Letters',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's generative AI customer service tool can access the rate pricing
      engine and provides borrowers with personalized rate quotes in response to customer
      service inquiries — including the phrase "your rate today would be X.XX% for a Y-year
      term" — which customers reasonably interpret as binding commitment letters rather
      than illustrative estimates. When customers reference the AI-generated rate in
      loan applications submitted hours or days later and receive higher rates, they file
      complaints citing the AI's output as a broken promise; the OCC's 2024 guidance on
      AI consumer communications and TILA's rate quote accuracy requirements both require
      that automated systems generating personalized rate information include prominent
      disclaimers distinguishing estimates from binding commitments, and the bank's AI tool
      currently lacks any such disclaimer.`,
    keywords: ['GenAI', 'TILA', 'OCC', 'rate commitment', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1518',
    name: 'AI Income Estimation Model Uses Social Media Data Without CRA Registration',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital licenses a fintech AI income estimation service that supplements
      stated income with signals derived from social media activity, online presence
      analysis, and e-commerce transaction history to estimate borrower income for
      thin-file personal loan applicants; the service has not been registered as a
      consumer reporting agency with the FTC under FCRA Section 603(f), and the bank
      does not include the service's name in adverse action notices when income estimation
      is a factor in a denial. FCRA Section 607(b) requires creditors to have a
      permissible purpose and to identify all consumer reporting sources in adverse
      action notices; use of an unregistered CRA for credit decisions violates FCRA
      Section 604 for every application where the service's data is accessed, a systemic
      violation affecting 15,000 applications annually.`,
    keywords: ['FCRA', 'CRA registration', 'AI income model', 'CFPB examination', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1519',
    name: 'AI Pricing Personalization Engine Charges Higher Rates in Markets With Lender Concentration',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's AI loan pricing personalization engine includes a lender concentration
      feature — representing the number of competing lenders actively offering the same product
      in the borrower's market — as a pricing input, resulting in systematically higher rates
      for borrowers in rural and exurban markets where First Capital has near-monopoly market
      presence. The CFPB's 2023 AI pricing supervisory circular and ECOA require that pricing
      model features that produce disparate pricing by geography be subjected to fair lending
      disparate impact analysis; lender concentration is strongly correlated with
      majority-minority rural market demographics in First Capital's footprint, making the
      feature a proxy for protected class characteristics without a documented business
      necessity justification that withstands scrutiny under the CFPB's ECOA examination
      framework.`,
    keywords: ['ECOA', 'AI pricing model', 'CFPB examination', 'disparate impact', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1520',
    name: 'Automated Mortgage Fraud Scoring Model Outputs Not Explainable for Denial Basis',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI mortgage fraud pre-screen model produces a composite fraud risk
      score that triggers manual review for applications above a threshold, and the bank
      uses a high fraud score as an adverse action reason code in denial letters when the
      manual review confirms fraud indicators. ECOA Regulation B Section 1002.9(b)(2)
      requires that adverse action notices state specific reasons for denial; "fraud risk
      score" is not a specific reason under ECOA — the bank must disclose the specific
      application characteristic that generated the high fraud score, such as income
      document inconsistency or identity verification mismatch. The CFPB's 2023 AI
      explainability supervisory guidance requires that AI-assisted denial reasons
      be traceable to specific applicant characteristics, and the use of a black-box
      fraud score as the sole adverse action reason code is an ECOA violation at scale
      across every AI-assisted fraud denial.`,
    keywords: ['ECOA', 'Regulation B', 'AI fraud model', 'CFPB examination', 'adverse action'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1521',
    name: 'AI Collection Interaction Model Uses Emotion Detection Without State Biometric Law Compliance',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's collections contact center deploys an AI voice analytics model that
      analyzes caller tone, speech rate, and vocal stress indicators to infer emotional state
      and adjust call escalation logic in real time; the system processes voice biometric
      data — vocal prints used for identity features — as part of its emotion detection
      feature set, and the bank has not obtained the Illinois Biometric Information Privacy
      Act (BIPA) consent required for voice biometric data collection in Illinois, where
      23% of the bank's delinquent borrowers reside. BIPA Section 15(b) requires informed
      written consent before collecting biometric identifiers; each non-consented voice
      biometric collection in Illinois is an independent BIPA violation subject to $1,000
      to $5,000 statutory damages per occurrence — a class action exposure that the bank's
      legal department has not quantified or disclosed in its risk register.`,
    keywords: ['BIPA', 'AI voice analytics', 'collections', 'biometric data', 'CFPB'],
    demoRelevant: false,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1522',
    name: 'AI Mortgage Origination Pipeline Optimizer Creates Disparate Processing Times by Market',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI pipeline management system prioritizes mortgage loan files for
      underwriting resources based on predicted loan profitability and lock expiration
      urgency; the model's profitability prediction assigns lower priority to lower loan
      balance applications in markets with higher appraisal variance — markets that
      correlate strongly with majority-minority demographics in First Capital's footprint.
      The CFPB's 2022 fair lending examination guidance and ECOA extend disparate treatment
      analysis to processing time disparities, requiring that AI workflow prioritization
      tools be tested for systematic processing time differences by race, color, and national
      origin proxies; the bank's pipeline AI has not been subjected to a processing time
      disparate impact analysis and produces statistically significant differences in time-to-close
      that benefit majority-white market applications.`,
    keywords: ['ECOA', 'AI pipeline optimizer', 'CFPB examination', 'disparate impact', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1523',
    name: 'AI Credit Line Increase Offer Engine Excludes Borrowers in Forbearance Without Policy Basis',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's ML credit line increase offer engine automatically excludes consumer
      lending accounts in active forbearance agreements from proactive credit line increase
      offers, on the basis that forbearance status is a model-derived risk signal; the
      exclusion has not been reviewed for ECOA compliance because it was implemented as
      a model governance decision rather than a credit policy decision. The CFPB's 2023
      ECOA examination guidance treats AI-driven eligibility exclusions for credit
      enhancement products — including proactive credit line increases — as credit
      decisions subject to the same disparate impact and disparate treatment analysis
      as initial underwriting decisions; the bank's forbearance exclusion may have
      disparate impact on minority borrowers who entered forbearance at higher rates
      during the COVID-19 period, creating a post-forbearance credit access disparity
      that ECOA would prohibit absent business necessity justification.`,
    keywords: ['ECOA', 'ML credit line model', 'CFPB examination', 'SR 11-7', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1524',
    name: 'AI Natural Language Processing Tool Extracts PII From Loan Documents Without Data Governance',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital deployed an AI NLP tool to extract income, employment, and asset data
      from loan application documents — tax returns, pay stubs, and bank statements — for
      automated entry into the LOS, storing all extracted data including SSNs, full birth
      dates, and bank account numbers in a document processing intermediate database that
      is not governed by the bank's data classification and retention policies. The OCC's
      data governance examination standards and GLBA Safeguards Rule amendments require
      that all personally identifiable financial information collected during origination
      be classified, retained per policy, and access-controlled; the AI extraction tool's
      intermediate database has no access controls beyond the tool's service account,
      no retention policy, and retains full PII for all processed documents indefinitely
      — creating GLBA and state data breach notification exposure across every document
      processed since deployment.`,
    keywords: ['GLBA', 'OCC', 'AI NLP', 'PII governance', 'consumer lending'],
    demoRelevant: false,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1525',
    name: 'AI Loan Pricing Shadow Model Running in Production Without Model Risk Management Approval',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's consumer lending pricing team built an AI loan pricing shadow model
      using gradient boosting to shadow the approved production pricing model, with the
      intent of demonstrating its superiority for a future model swap; the shadow model
      was connected to the pricing API as a passive observer but was subsequently used
      as a tiebreaker for borderline pricing decisions through an informal agreement
      between the pricing team and loan originators — constituting production use without
      SR 11-7 model risk management approval, validation, or inventory registration.
      OCC examiners during the bank's 2024 MRM consent order progress examination
      identified three shadow models in informal production use, each constituting
      an independent consent order violation and requiring immediate removal from
      the production environment pending formal MRM validation and approval.`,
    keywords: ['SR 11-7', 'shadow model', 'OCC', 'consent order', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1526',
    name: 'GenAI Borrower Hardship Evaluation Assistant Hallucinates Eligibility Criteria',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's loss mitigation team uses a GenAI assistant to help borrower-facing
      staff evaluate whether borrowers are likely eligible for hardship programs before
      escalating to a full loss mitigation evaluation; the LLM has been observed
      hallucinating eligibility criteria — including inventing a "36-month payment
      history" requirement and a "no prior modification" restriction that do not exist
      in the bank's actual loss mitigation guidelines — causing staff to incorrectly
      advise borrowers that they do not qualify and to not escalate their applications.
      The CFPB's 2024 AI in servicing supervisory guidance requires that AI tools
      used to screen or advise borrowers on loss mitigation eligibility be validated
      against the bank's actual program guidelines before deployment, and that any
      AI eligibility screening error that results in a borrower not receiving an
      application evaluation constitute a Regulation X violation.`,
    keywords: ['GenAI hallucination', 'RESPA', 'Regulation X', 'CFPB examination', 'loss mitigation'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1527',
    name: 'AI Debt-to-Income Calculation Automation Misclassifies Income Stream Types',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's AI-automated DTI calculation engine classifies income streams
      from bank statement deposits into qualifying income categories — base pay, overtime,
      self-employment, rental, and investment income — using a pattern-recognition model
      that achieves 91% accuracy in testing but systematically misclassifies freelance
      gig economy deposits as salaried base pay, inflating qualifying income for
      thin-file gig workers by 18–40% above what manual underwriting guidelines would
      allow. The CFPB's ability-to-repay examination procedures require that income
      classification in automated underwriting be tested for systematic classification
      errors that produce inflated DTI approvals; the bank's 2024 AI DTI review finds
      that gig economy borrowers approved through the AI engine have a 24-month
      default rate 3.1 times higher than salaried borrowers at equivalent DTI ratios,
      directly implicating the income misclassification as the causal failure.`,
    keywords: ['ability-to-repay', 'CFPB', 'AI DTI model', 'SR 11-7', 'mortgage origination'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1528',
    name: 'AI Appraisal Automated Ordering System Bypasses Independent Appraiser Selection Requirements',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's AI appraisal management platform uses a ranking algorithm to order
      appraisers from its approved AMC panel, weighting appraiser selection by prior
      turnaround time, prior value accuracy vs. AVM, and historical approval-to-value
      alignment — a weighting that systematically deprioritizes appraisers whose valuations
      have previously come in below the bank's AVM estimate. The OCC's Interagency
      Appraisal and Evaluation Guidelines require that appraisers be selected on the
      basis of competency and independence, and an AI selection algorithm that rewards
      appraisers whose prior valuations aligned with the bank's preferred value outcome
      creates an appraiser selection process that undermines appraiser independence under
      the Dodd-Frank anti-coercion provisions of TILA Section 129E, which the CFPB enforces
      through its supervisory authority over mortgage origination.`,
    keywords: ['AI appraisal ordering', 'OCC', 'TILA', 'CFPB examination', 'appraiser independence'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },
  {
    code: 'B1529',
    name: 'AI Servicer Chatbot Fails to Provide Reg X-Required Loss Mitigation Information',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's AI chatbot for mortgage servicing can answer general loan balance
      and payment inquiries but is not programmed to present the full loss mitigation
      option menu required by Regulation X Section 1024.39, which requires that servicers
      provide written notice of loss mitigation options to borrowers who are 45 days
      delinquent. When delinquent borrowers contact the chatbot seeking help, the AI
      directs them to call the default servicing department without providing the
      written early intervention notice or explaining available loss mitigation options
      — deferring the mandatory disclosure to a call that 38% of delinquent borrowers
      never make. The CFPB's 2023 mortgage servicer AI guidance requires that AI customer
      contact channels used for delinquent borrower interactions satisfy the same Regulation X
      disclosure obligations as human-agent contacts.`,
    keywords: ['AI chatbot', 'Regulation X', 'RESPA', 'CFPB examination', 'loss mitigation'],
    demoRelevant: true,
    subTopic: 'ai-consumer-part4',
  },

  // ── Fair Lending Examination ───────────────────────────────────────────────
  {
    code: 'B1530',
    name: 'Fair Lending Statistical Analysis Uses MSA-Level Comparison Rather Than Census Tract Peer Group',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's internal fair lending statistical analysis compares loan approval rates
      and pricing across racial and ethnic groups at the MSA level, which masks within-MSA
      disparities in LMI and majority-minority census tracts that the CFPB's HMDA peer
      analysis and OCC fair lending examination procedures use as the primary unit of analysis.
      The CFPB's 2023 fair lending examination manual requires that statistical comparisons
      for approval rate and pricing disparities be conducted at the census tract level or
      branch geography level to detect redlining and reverse redlining patterns invisible
      at MSA aggregation; the bank's MSA-level analysis has passed its self-assessment
      threshold for three consecutive years while census-tract-level analysis — prepared
      only in response to the 2023 OCC examination request — shows approval rate disparities
      exceeding the CFPB's 10-percentage-point trigger in 14 majority-minority tracts.`,
    keywords: ['ECOA', 'HMDA', 'fair lending', 'CFPB examination', 'OCC'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1531',
    name: 'Redlining Assessment Does Not Cover Digital Origination Channel Geography',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's CRA and fair lending redlining assessment evaluates mortgage
      application density by census tract only for applications received through branch
      channels, excluding digital origination applications from the geographic distribution
      analysis because they lack a branch geography assignment. The CFPB's 2022 redlining
      examination framework — applied in its enforcement actions against mortgage lenders
      — evaluates application density and loan officer activity across all origination
      channels combined; the bank's digital channel exclusion causes its redlining assessment
      to miss a systematic pattern of lower digital marketing investment in majority-minority
      tracts that produces application density gaps in those tracts equivalent to traditional
      physical redlining, a pattern that the CFPB's data-driven examination approach would
      identify if all channel data were included.`,
    keywords: ['ECOA', 'CFPB', 'redlining', 'HMDA', 'fair lending exam'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1532',
    name: 'Loan Officer Discretion Exceptions Not Monitored for Disparate Application by Race',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's consumer and mortgage underwriting guidelines allow loan officers
      to grant discretionary exceptions to standard underwriting criteria — DTI exceptions,
      minimum FICO exceptions, and reserve requirement waivers — subject to manager
      approval; the bank's fair lending monitoring program tracks exception rates overall
      but does not analyze whether exception approvals are granted at statistically different
      rates for minority versus non-minority applicants at equivalent risk profiles.
      The CFPB's disparate treatment examination framework and ECOA require that underwriting
      exception programs be monitored for disparate application by race, national origin,
      and other protected classes; the OCC's 2023 fair lending examination found that peer
      banks with unmonitored exception programs had minority applicant exception approval
      rates 28–34 percentage points below non-minority approval rates at equivalent
      credit risk tiers.`,
    keywords: ['ECOA', 'CFPB fair lending', 'underwriting exception', 'OCC', 'disparate treatment'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1533',
    name: 'HMDA LAR Ethnicity Self-Identification Not Offered for Telephone Applications',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `HMDA Regulation C requires that creditors collect and report race and ethnicity
      information using the government monitoring information (GMI) format, with applicants
      offered the option to self-identify disaggregated ethnicity categories; First Capital's
      telephone mortgage application intake script uses only the legacy "Hispanic or Latino /
      Not Hispanic or Latino" binary and does not present the disaggregated subcategories
      (Mexican, Puerto Rican, Cuban, Other Hispanic) required by the 2018 HMDA rule. The
      CFPB's HMDA data quality examination procedures require that telephone GMI collection
      match the disaggregated format available in written applications; the bank's telephone
      GMI collection script was never updated for the 2018 HMDA rule requirements, and the
      OCC's HMDA examination will cite the incomplete GMI collection as a systemic data
      integrity deficiency in the bank's next LAR submission.`,
    keywords: ['HMDA', 'Regulation C', 'GMI', 'OCC', 'fair lending exam'],
    demoRelevant: false,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1534',
    name: 'Special Purpose Credit Program Not Documented to Withstand ECOA Scrutiny',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital operates a first-time homebuyer assistance program with reduced
      underwriting standards for LMI borrowers in the bank's assessment area; the
      program was implemented as a product feature rather than as a formal Special Purpose
      Credit Program (SPCP) under ECOA Section 703(c), meaning it lacks the required
      written program and self-testing documentation that would make its favorable treatment
      of protected class members explicitly permissible under ECOA. The CFPB's 2022 SPCP
      guidance and its 2022 advisory opinion on SPCPs clarify that race-conscious credit
      assistance programs must be structured as formal SPCPs with written program plans
      to provide a clear ECOA safe harbor; First Capital's undocumented program may provide
      ECOA-favorable outcomes but does not enjoy the safe harbor, making it
      vulnerable to challenge as an impermissible race-conscious credit policy.`,
    keywords: ['ECOA', 'SPCP', 'CFPB', 'fair lending exam', 'OCC'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1535',
    name: 'Pricing Concession Tracking Does Not Capture Borrower-Initiated Versus Bank-Initiated Discounts',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's mortgage and consumer loan pricing records capture all pricing
      concessions — rate reductions below the standard risk-based price — as a single
      concession category without distinguishing between bank-initiated retention discounts
      and borrower-initiated negotiated discounts. The CFPB's fair lending examination
      pricing analysis requires that concession source be tracked separately because
      bank-initiated and borrower-initiated discounts have different fair lending risk
      profiles: bank-initiated concessions offered disproportionately to non-minority
      borrowers constitute disparate treatment, while borrower-initiated concessions
      available only to informed negotiators may have disparate impact. The OCC's 2023
      fair lending examination found that First Capital's undifferentiated concession
      tracking made it impossible to conduct the bank-initiated discount analysis that
      is a required element of the pricing ECOA exam.`,
    keywords: ['ECOA', 'pricing concession', 'CFPB fair lending', 'OCC examination', 'disparate treatment'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1536',
    name: 'Supervisory Fair Lending Findings Not Integrated Into Enterprise Risk Register',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's OCC and CFPB fair lending examination findings are tracked in the
      bank's mortgage compliance system as standalone examination findings but are not
      integrated into the enterprise operational risk register or disclosed in the bank's
      risk appetite statement disclosures to the board — meaning the board of directors
      does not receive consolidated visibility into the bank's fair lending compliance
      posture as a distinct risk category. OCC Bulletin 2017-43 and the OCC's Corporate
      Governance guidelines require that material supervisory findings be incorporated
      into the bank's enterprise risk framework with defined remediation timelines and
      board-level reporting; the absence of fair lending risk register integration means
      the board cannot provide informed oversight of the bank's ECOA compliance posture,
      constituting a governance control failure independent of the underlying compliance
      findings.`,
    keywords: ['OCC', 'ECOA', 'fair lending', 'enterprise risk', 'board governance'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1537',
    name: 'Equal Credit Opportunity Act Self-Testing Privilege Waived by Disclosure to Third Party',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `ECOA Regulation B Section 1002.15 provides a self-testing privilege that protects
      the results of self-tests — including statistical analyses comparing approval and
      pricing outcomes by race — from mandatory disclosure in civil litigation; First
      Capital's fair lending compliance team shared the results of a 2023 pricing
      self-test with its outside CRA consultant for validation purposes, without first
      confirming that the consultant's engagement letter preserved the self-testing
      privilege by establishing attorney-client or work-product protection for the
      disclosed results. The CFPB's Regulation B examination guidance and case law under
      ECOA Section 706(c) are clear that self-test privilege is waived when results are
      voluntarily disclosed to third parties outside the privilege scope; the waiver means
      the 2023 pricing self-test results — which identified disparity — are discoverable
      in any civil ECOA litigation and can be used as an admission in CFPB enforcement
      proceedings.`,
    keywords: ['ECOA', 'Regulation B', 'self-testing privilege', 'CFPB', 'fair lending exam'],
    demoRelevant: false,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1538',
    name: 'Marketing Geographic Footprint Analysis Excludes Digital Advertising Impressions',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's marketing fair lending analysis evaluates the geographic distribution
      of mortgage and consumer lending marketing based on direct mail and branch-area print
      advertising spend, but does not include digital advertising impression data by census
      tract — which the CFPB's 2022 redlining enforcement framework treats as equally
      relevant to the geographic targeting analysis as physical marketing. The bank's
      programmatic digital advertising platform targets loan product ads using income,
      homeownership intent, and life event signals that systematically produce lower
      impression rates in majority-minority tracts within the bank's assessment area,
      constituting an algorithmic redlining pattern under the CFPB's 2022 guidance that
      extends redlining analysis to digital channel marketing targeting without requiring
      proof of intentional discrimination.`,
    keywords: ['ECOA', 'CFPB', 'redlining', 'digital marketing', 'fair lending exam'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
  {
    code: 'B1539',
    name: 'Fair Lending Comparative File Review Not Conducted on AI-Decisioned Loan Population',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's fair lending comparative file review methodology selects matched
      pairs of approved and denied applications for manual file review by the fair lending
      compliance team — a methodology designed for human underwriter disparity analysis
      that has not been adapted for the 62% of consumer loan decisions now made entirely
      by AI models without human underwriter involvement. The CFPB's 2023 AI fair lending
      supervisory guidance and OCC fair lending examination guidance both require that
      institutions with significant AI-decisioned loan volumes develop AI-specific fair
      lending testing methodologies — including outcome testing, counterfactual analysis,
      and less discriminatory alternative testing — rather than relying solely on matched-pair
      comparative file review designed for human decision-maker analysis; the bank's
      continued use of the legacy methodology for AI-decisioned applications provides no
      meaningful fair lending assurance for its AI loan population.`,
    keywords: ['ECOA', 'CFPB fair lending', 'AI underwriting', 'OCC examination', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'fair-lending-exam',
  },
];
