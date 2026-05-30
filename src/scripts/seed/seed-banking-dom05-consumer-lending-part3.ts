// seed-banking-dom05-consumer-lending-part3.ts
// Banking genome patterns — Consumer Lending & Digital Origination
// Code range: B1420–B1479  (60 patterns)
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

export const BANKING_DOM05_CONSUMER_LENDING_PART3_PATTERNS: PatternSeed[] = [

  // ── Mortgage Servicing ──────────────────────────────────────────────────────
  {
    code: 'B1420',
    name: 'Mortgage Servicer Force-Placed Insurance Escrow Analysis Omits Prior Coverage Overlap',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's mortgage servicing platform initiates force-placed insurance coverage
      on loans where hazard insurance lapses, but the escrow analysis run at the time of
      force-placement does not credit prior coverage overlap periods during which the borrower
      held continuous coverage, resulting in retroactive premium charges that exceed CFPB
      RESPA Regulation X Section 1024.37 limits on force-placed insurance. The bank's escrow
      analysis engine applies the force-placed premium from the lapse detection date rather
      than the actual coverage gap start date, overbilling affected borrowers an average of
      $1,340 per account when the borrower's prior insurer confirms coverage through a date
      after the lapse detection; CFPB examination guidance treats premium overbilling as a
      per-se Regulation X violation requiring individual remediation and escrow account
      correction for all affected accounts.`,
    keywords: ['RESPA', 'Regulation X', 'force-placed insurance', 'CFPB examination', 'mortgage servicing', 'escrow analysis'],
    demoRelevant: true,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1421',
    name: 'Mortgage Annual Escrow Statement Delivery Exceeds 30-Day Regulation X Window',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital delivers annual escrow account statements to mortgage borrowers through
      a third-party servicing platform provider that runs the annual analysis cycle on a
      rolling 12-month basis; platform processing queues cause 18% of annual statements
      to be delivered more than 30 days after the analysis period ends, exceeding the
      CFPB RESPA Regulation X Section 1024.17(i) requirement that annual escrow statements
      be delivered within 30 days of the end of the escrow account computation year.
      Late escrow statement delivery is a compliance deficiency that OCC examiners score
      under the mortgage servicing pillar of the bank's consumer compliance rating; the
      bank's 2024 RESPA audit identifies 9,700 late deliveries in the prior 12 months
      and the third-party servicer has not committed to a remediation timeline.`,
    keywords: ['RESPA', 'Regulation X', 'escrow statement', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1422',
    name: 'Borrower Qualified Written Request Tracking System Does Not Log Receipt Timestamp',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's mortgage servicing inquiry handling system does not stamp the receipt
      timestamp for Qualified Written Requests (QWRs) received by email, portal message, or
      fax, making it impossible to verify compliance with RESPA Section 6's requirements to
      acknowledge QWRs within 5 business days and substantively respond within 30 business days.
      The CFPB's 2023 mortgage servicing examination finding at a peer institution cited the
      absence of automated QWR receipt logging as an independent Regulation X deficiency
      separate from response timeliness, because the absence of logging makes it structurally
      impossible to audit compliance; First Capital's internal RESPA QWR audit relies entirely
      on email thread timestamps rather than a system-of-record receipt log, a gap that
      OCC examiners have cited in three consecutive servicing exams.`,
    keywords: ['RESPA', 'Regulation X', 'QWR', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1423',
    name: 'Post-Forbearance Payment Deferral Notice Does Not Disclose Balloon Payment Risk',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's mortgage servicing payment deferral program offers post-forbearance
      borrowers the option to defer missed payments to the end of the loan term as a lump
      sum balloon payment; the deferral offer letter does not contain a plain-language
      disclosure that the deferred amount will be due as a balloon payment at loan maturity,
      the approximate dollar amount of the balloon, or the date by which the balloon must
      be paid. CFPB RESPA Regulation X post-forbearance workout option disclosure standards
      require that deferral offer communications clearly describe the repayment structure
      and material risks; the bank's 2024 borrower complaint data shows that 31% of
      post-deferral defaults in the 24 months following deferral acceptance were preceded
      by borrower calls expressing surprise at the balloon payment obligation, supporting a
      CFPB UDAP deceptive-omission finding.`,
    keywords: ['RESPA', 'Regulation X', 'CFPB', 'forbearance', 'mortgage servicing', 'UDAP'],
    demoRelevant: true,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1424',
    name: 'Mortgage Transfer of Servicing Notice Does Not Reach Borrower 15 Days Before Transfer',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `When First Capital transfers mortgage servicing rights to a sub-servicer or sells
      servicing to another institution, the transferring servicer's notice to affected
      borrowers is generated by the acquiring servicer's onboarding system on transfer
      day rather than 15 calendar days before the effective transfer date, as required by
      RESPA Section 6(b)(1). Borrowers who make payments to the transferring servicer
      during the post-notice window are protected by a 60-day grace period, but borrowers
      who were not notified in advance sometimes miss the effective transfer date entirely
      and receive late payment notices; the CFPB's 2024 supervisory highlights identify
      late transfer-of-servicing notices as one of the top-five mortgage servicing
      compliance deficiencies across the supervised population and impose per-occurrence
      penalties ranging from $100 to $1,000 per borrower depending on examiner severity.`,
    keywords: ['RESPA', 'mortgage servicing', 'CFPB examination', 'Regulation X', 'servicing transfer'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1425',
    name: 'ARM Rate Adjustment Notice Not Delivered 210 Days Before First Rate Change',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's adjustable-rate mortgage servicing system sends the initial rate
      adjustment notice required by Regulation Z Section 1026.20(d) 180 days before the
      first rate change date — the minimum required — rather than the 210–240 day advance
      notice window that the CFPB's ARM servicing examination guidance expects for loans
      where the first adjustment triggers a materially higher payment and the borrower
      may need time to pursue refinance alternatives. When the rate environment results
      in first adjustments that increase monthly payments by more than 20%, borrower
      delinquency in the 90 days post-adjustment is statistically higher for First Capital's
      ARM portfolio than peer benchmarks, a pattern that CFPB examiners link directly to
      insufficient advance notice that prevents meaningful financial planning by borrowers
      whose only alternative to delinquency is timely refinance.`,
    keywords: ['Regulation Z', 'ARM', 'CFPB examination', 'mortgage servicing', 'TILA'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1426',
    name: 'Mortgage Default Servicing SPOC Assignment Breaks on Servicer Portfolio Acquisition',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `CFPB RESPA Regulation X Section 1024.40 requires mortgage servicers to assign a
      Single Point of Contact (SPOC) to any borrower who requests a loss mitigation evaluation;
      when First Capital acquires a servicing portfolio through a bulk purchase, the acquired
      borrowers who are already in active loss mitigation evaluation at the transferring servicer
      have no SPOC assigned in First Capital's servicing system for a median of 38 days
      post-transfer while system onboarding is completed. During this gap, borrowers who
      call for loss mitigation status receive inconsistent guidance from general-pool call
      center agents who lack full visibility into the pending evaluation, and some evaluations
      are restarted from scratch rather than continued — causing borrowers to miss the
      Regulation X 37-day and 45-day evaluation clock deadlines.`,
    keywords: ['RESPA', 'Regulation X', 'SPOC', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1427',
    name: 'MERS Deregistration Failure Clouds Title on Paid-Off Mortgage Loans',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's mortgage payoff process does not trigger an automated MERS
      (Mortgage Electronic Registration Systems) deregistration workflow when loans pay
      off in full, leaving a non-trivial percentage of fully discharged mortgages registered
      as active liens in MERS even after discharge. When borrowers attempt to sell or
      refinance within 6 months of payoff, title searches identify the MERS lien as
      active and title companies require lien releases before closing — a process that
      takes 30–45 days and kills time-sensitive transactions. The OCC's 2023 mortgage
      operational risk guidance identifies MERS deregistration backlogs as an operational
      risk indicator that contributes to title defect exposure and can constitute a
      consumer harm when borrowers lose transaction opportunities due to the servicer's
      MERS maintenance failure.`,
    keywords: ['MERS', 'mortgage servicing', 'OCC', 'lien release', 'title defect'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1428',
    name: 'Private Mortgage Insurance Cancellation Not Processed at 80% LTV Automatically',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `The Homeowners Protection Act (HPA) requires automatic cancellation of private mortgage
      insurance (PMI) when a loan's LTV ratio reaches 78% based on the original amortization
      schedule, and provides borrowers the right to request cancellation at 80% LTV based
      on current property value; First Capital's mortgage servicing platform does not
      automatically evaluate borrower-requested PMI cancellations using current AVM-based
      property values, relying instead on static amortization schedule tracking that ignores
      home appreciation. The bank's 2024 PMI compliance review identifies 2,800 active
      PMI charges on loans whose current LTV — based on recent AVM — is below 80%, meaning
      borrowers are paying for PMI they are legally entitled to cancel; the CFPB treats
      each month of improperly charged PMI as a separate HPA violation subject to civil
      money penalty.`,
    keywords: ['HPA', 'PMI cancellation', 'CFPB examination', 'mortgage servicing', 'LTV'],
    demoRelevant: true,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1429',
    name: 'Deed-in-Lieu Agreement Does Not Release Deficiency Claim in All States',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's standard deed-in-lieu agreement template states that the transfer
      of the property satisfies "the mortgage debt" without explicitly releasing any
      deficiency claim against the borrower; in the 8 states in First Capital's footprint
      that permit deficiency judgments on residential purchase money mortgages, this
      ambiguous template language allows the bank's collections team to pursue deficiency
      claims against borrowers who believed the deed-in-lieu fully resolved their
      obligation. The CFPB's 2023 supervisory guidance on deed-in-lieu documentation
      requires that loss mitigation agreement templates explicitly specify whether a
      deficiency claim is waived, and the use of ambiguous "satisfies the debt" language
      constitutes a potential UDAP deception when borrowers reasonably interpret it
      as a full release but the bank later seeks deficiency recovery.`,
    keywords: ['CFPB', 'UDAP', 'deed-in-lieu', 'mortgage servicing', 'RESPA'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1430',
    name: 'Mortgage Assumption Request Processing Exceeds 30-Day Garn-St Germain Response Window',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `The Garn-St Germain Depository Institutions Act prohibits mortgage servicers from
      calling a due-on-sale clause when a property is transferred between family members
      under specific qualifying conditions, and requires servicers to evaluate assumption
      requests and respond within a reasonable time; First Capital's mortgage assumption
      processing workflow routes requests through three separate teams — title, underwriting,
      and servicing operations — with no consolidated tracking system, causing median
      response times of 47 days versus the 30-day benchmark that the CFPB's mortgage
      servicing examination guidance applies for due-on-sale clause response. Borrowers
      attempting estate-related property transfers under Garn-St Germain qualify for
      assumption rights that the bank's slow processing effectively denies, constituting
      a potential obstruction of statutory rights that OCC examiners have flagged in
      peer bank examinations.`,
    keywords: ['Garn-St Germain', 'mortgage assumption', 'OCC', 'mortgage servicing', 'CFPB'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },
  {
    code: 'B1431',
    name: 'Escrow Shortage Repayment Spread Exceeds 12 Months Without Borrower Election',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `When First Capital's annual escrow analysis identifies a projected shortage,
      RESPA Regulation X Section 1024.17(f) requires the bank to offer borrowers
      the option to pay the shortage in a single lump sum or spread it over no more
      than 12 months in the adjusted monthly payment; the bank's escrow analysis
      platform defaults to spreading shortages over 24 months without offering the
      12-month or lump-sum alternatives, violating the Regulation X requirement that
      the borrower be offered a choice. The bank's 2024 RESPA internal audit identifies
      the 24-month default as a systematic platform configuration error affecting
      approximately 14,000 annual escrow adjustment notifications, and prior OCC
      examination findings in 2022 cited the same deficiency with a commitment to
      remediation that has not been fully implemented.`,
    keywords: ['RESPA', 'Regulation X', 'escrow shortage', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'mortgage-servicing',
  },

  // ── Auto Lending ──────────────────────────────────────────────────────────
  {
    code: 'B1432',
    name: 'Indirect Auto Dealer Reserve Markup Policy Lacks ECOA Disparate Impact Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's indirect auto lending program allows dealer partners to mark up
      the buy rate by up to 2.5% as a dealer participation fee, without any automated
      monitoring of the distribution of markup rates across protected class proxies
      derived from applicant name, zip code, and dealership geography. The CFPB's 2013
      indirect auto lending guidance and ECOA require that creditors monitor dealer
      markup policies for disparate impact; First Capital's most recent fair lending
      analysis covers only direct auto loans and excludes the indirect channel, leaving
      the dealer markup program outside any systematic disparate impact analysis for
      three consecutive years. OCC large-bank fair lending exam protocols specifically
      test indirect auto dealer compensation policies and have resulted in consent orders
      at peer institutions requiring retroactive remediation and ongoing monitoring programs.`,
    keywords: ['ECOA', 'dealer markup', 'CFPB', 'disparate impact', 'indirect auto lending'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1433',
    name: 'Auto Loan Deficiency Calculation Errors After Repossession Sale',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `When First Capital repossesses and sells collateral vehicles at dealer auction,
      the deficiency balance calculation transmitted to the collections system does not
      deduct all commercially reasonable sale costs as required by UCC Article 9 before
      computing the deficiency — specifically excluding transport and storage costs that
      UCC 9-615(a) designates as reasonable expenses. Borrowers who dispute deficiency
      balances identify systematic overstatement of the deficiency by $800–$2,200 per
      account in post-sale reconciliations; the CFPB's Fair Debt Collection Practices
      Act examination procedures require that deficiency balances be accurately calculated
      before collection commences, and collection of an overcalculated deficiency
      constitutes collecting amounts not permitted by law under FDCPA Section 807.`,
    keywords: ['UCC Article 9', 'deficiency balance', 'FDCPA', 'auto lending', 'CFPB'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1434',
    name: 'Guaranteed Auto Protection Waiver Refund Not Processed on Early Payoff',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital finances Guaranteed Auto Protection (GAP) waiver products as part of
      its indirect auto lending program; when borrowers pay off their auto loans early
      — through refinance, sale, or total loss settlement — the GAP waiver provider is
      not automatically notified by the servicing platform to issue a prorated premium
      refund for the unused coverage period. Post-payoff GAP refund processing depends
      on manual notification workflows that fail to trigger in 27% of early payoff
      scenarios, leaving borrowers without the refund they are contractually owed;
      the CFPB's auto finance examination manual treats systematic GAP refund processing
      failures as unfair acts or practices under Dodd-Frank Section 1031, and state
      insurance regulators in 14 states have filed actions against banks whose
      GAP programs systematically fail to issue refunds.`,
    keywords: ['GAP waiver', 'auto lending', 'CFPB', 'UDAP', 'Dodd-Frank Section 1031'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1435',
    name: 'Auto Loan Voluntary Surrender Not Treated as Repossession for Deficiency Notice',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `When First Capital borrowers voluntarily surrender their vehicles in lieu of
      repossession, the bank's collections platform classifies the transaction as a
      voluntary surrender and does not generate the post-sale deficiency notice required
      by UCC Article 9 Section 9-616 within 20 days of the collateral sale, on the
      theory that voluntary surrender waives the notice requirement. Under UCC 9-616,
      the post-sale deficiency notice requirement applies to all consumer transactions
      regardless of whether the collateral was repossessed or surrendered, and 9
      states in First Capital's footprint have enacted stricter state UCC deficiency
      notice requirements; failure to provide the required notice can extinguish the
      bank's right to collect the deficiency under applicable state law.`,
    keywords: ['UCC Article 9', 'deficiency notice', 'auto lending', 'CFPB', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1436',
    name: 'Auto Loan Payment Processing Applies Excess Payments to Fees Before Principal',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's auto loan servicing payment application hierarchy applies borrower
      payments to fees and interest before principal — a standard waterfall — but also
      applies excess payments (amounts above the scheduled monthly payment) to future
      interest accrual rather than principal reduction, contrary to how the application
      hierarchy is disclosed in the auto loan agreement. When borrowers make double
      payments expecting to reduce principal and shorten loan term, the servicing platform
      instead credits the excess to a "pre-paid interest" account, and borrowers who
      review their principal balance discover it has not decreased proportionally to their
      payments. Regulation Z and CFPB auto lending examination guidance require that
      payment application policies be accurately disclosed, and the mismatch between
      disclosure and actual application constitutes a TILA material disclosure violation.`,
    keywords: ['Regulation Z', 'TILA', 'payment application', 'auto lending', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1437',
    name: 'OFAC Screening Not Re-Run at Auto Loan Drawdown When Origination Was Weeks Prior',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital runs OFAC SDN screening on auto loan applicants at origination but does
      not re-screen at the time of loan drawdown when there is a gap of 15 or more days
      between application approval and loan funding — a gap that occurs for 23% of indirect
      auto loans awaiting dealer document delivery. OFAC enforcement guidance and OCC
      Bulletin 2020-29 require that OFAC screening be conducted at or near the time of a
      financial transaction, not only at origination; the bank's failure to re-screen at
      drawdown means that applicants added to the SDN list between origination and funding
      receive funded loans in violation of the OFAC prohibition on providing financial
      services to designated nationals.`,
    keywords: ['OFAC', 'SDN screening', 'OCC', 'BSA/AML', 'auto lending'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1438',
    name: 'Auto Title Perfection Delay Leaves Collateral Unperfected During PMSI Window',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's indirect auto lending operation depends on dealer partners to
      submit title perfection documentation to state DMVs within the 20-day Purchase
      Money Security Interest (PMSI) window required under UCC Article 9 to maintain
      purchase money priority over other creditors; the bank's dealer monitoring program
      does not track per-dealer title submission timelines, and 31% of auto titles are
      submitted outside the PMSI window based on state DMV confirmation records.
      Late title perfection means the bank's lien is not protected from intervening
      bankruptcy trustee avoidance under 11 U.S.C. § 547(c)(3), creating credit risk
      on every auto loan where the title was perfected late — a gap that the OCC's
      auto lending credit risk examination guidance identifies as a systemic
      operational control deficiency requiring remediation and enhanced dealer
      accountability frameworks.`,
    keywords: ['UCC Article 9', 'PMSI', 'title perfection', 'OCC', 'auto lending'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1439',
    name: 'Auto Repossession GPS Tracking Data Retained Beyond Borrower Privacy Policy Limit',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital's GPS-equipped auto repossession tracking service collects real-time
      vehicle location data on all financed vehicles with GPS-enabled telematics as a
      standard repossession management tool; the service retains location data for 24
      months after loan payoff, well beyond the 90-day retention limit stated in the
      bank's consumer privacy notice. The CFPB's 2024 supervisory highlights and the
      FTC's GLBA Safeguards Rule amendments require that institutions' data retention
      practices align with their privacy notice disclosures; retaining GPS location
      data for paid-off borrowers for 24 months without disclosure constitutes a
      material deviation from the bank's stated privacy practices and exposes the bank
      to CFPB UDAP unfair-omission findings and state privacy law liability in California
      under CCPA.`,
    keywords: ['CFPB', 'GLBA', 'CCPA', 'auto lending', 'data retention'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1440',
    name: 'Military Allotment Auto Loan Program Not SCRA-Compliant at Origination',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital markets a military allotment auto loan program through Army and
      Air Force Exchange Service (AAFES) channels, collecting loan payments by direct
      payroll allotment from active duty servicemember pay; the program does not apply
      the SCRA 6% interest rate cap at origination for borrowers whose current duty
      status as active duty servicemembers at the time of loan origination clearly
      triggers the SCRA rate cap under 50 U.S.C. § 3937. The DOJ's 2024 joint
      enforcement action with the CFPB targeting military auto lending abuses cited
      origination-time SCRA violations — where the 6% cap applies from the first
      payment — as the primary violation pattern; the bank has not evaluated whether
      any of its AAFES channel originations between 2020 and 2024 involved active
      duty borrowers who were entitled to the SCRA rate cap from origination.`,
    keywords: ['SCRA', 'CFPB', 'military lending', 'auto lending', 'DOJ enforcement'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1441',
    name: 'AI Auto Loan Decisioning Model Trained on Pre-2020 Data Misscores Post-Pandemic Credit',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's AI auto loan underwriting model was trained on a 2015–2019 credit
      performance dataset that predates the COVID-19 forbearance era, which produced
      atypical payment behavior patterns — high forbearance rates, deferred defaults,
      and artificial score preservation — that are not representative of post-2021
      repayment performance. The model's credit score, payment history, and employment
      duration features generate systematically inflated approval rates for borrowers
      whose credit profiles reflect forbearance-era anomalies, and the bank's post-2022
      auto loan vintages exhibit default rates 42% higher than the model's predicted
      loss rates for equivalent FICO bands. SR 11-7 model validation requirements mandate
      out-of-time sample validation on a representative recent performance period before
      production deployment; the model has not been re-validated on post-2021 data
      despite three years of observed performance divergence.`,
    keywords: ['SR 11-7', 'AI underwriting model', 'auto lending', 'OCC', 'model risk management'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },

  // ── Personal Unsecured ────────────────────────────────────────────────────
  {
    code: 'B1442',
    name: 'Personal Loan TILA Rate Disclosure Omits Prepaid Finance Charges From APR',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's personal unsecured loan origination platform calculates the Annual
      Percentage Rate disclosed under TILA using only contractual interest but does not
      include origination fees and optional credit insurance premiums that the borrower
      purchases at closing — prepaid finance charges that Regulation Z Section 1026.18(d)
      requires to be included in the APR calculation. The CFPB's 2023 TILA examination
      procedure review requires that APR calculations include all prepaid finance charges,
      regardless of whether they are characterized as optional; First Capital's TILA
      disclosures understate the APR for 34% of personal loan originations where
      borrowers purchase optional credit insurance, generating material TILA
      APR disclosure violations subject to TILA Section 130 civil liability and
      CFPB examination findings.`,
    keywords: ['TILA', 'Regulation Z', 'APR disclosure', 'CFPB examination', 'personal loan'],
    demoRelevant: true,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1443',
    name: 'Personal Loan Payoff Quote Expires Before Borrower Can Fund Paying Institution',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital issues personal loan payoff quotes valid for only 3 business days,
      consistent with its standard payoff quote policy for secured mortgages, but digital
      personal loan refinance borrowers who receive quotes from fintech refinance platforms
      frequently encounter a mismatch between quote validity and the 5–7 business day
      ACH settlement window at the receiving institution. Borrowers who fund after the
      3-day quote window receive a final payoff demand that includes additional interest
      for the quote lag days without receiving prior notice that the quote would expire,
      and are sometimes assessed a short-pay fee when the ACH disbursement underpays the
      per-diem amount. The CFPB's consumer lending examination guidance requires that
      payoff procedures be disclosed clearly and consistently, and the 3-day quote combined
      with no digital extension mechanism constitutes an unfair practice for online
      refinance borrowers.`,
    keywords: ['CFPB', 'payoff quote', 'Regulation Z', 'personal loan', 'UDAP'],
    demoRelevant: false,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1444',
    name: 'Personal Loan Cross-Sell Insert at Origination Not Disclosed as Marketing',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      `First Capital's personal loan digital origination closing document package includes
      a one-page insert for companion checking account and credit card products that is
      visually formatted to resemble a loan disclosure document — same header font, same
      logo placement, same regulatory disclosure footer — without a clear label identifying
      it as a marketing solicitation rather than a required disclosure. The CFPB's UDAP
      examination guidance requires that marketing materials intermingled with required
      disclosures be clearly and prominently labeled as advertisements; the bank's 2024
      borrower complaint log includes 140 complaints from borrowers who believed they were
      required to open a checking account as a loan condition because the insert was not
      distinguishable from the required loan closing package.`,
    keywords: ['UDAP', 'CFPB', 'personal loan', 'marketing disclosure', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1445',
    name: 'Pre-Qualified Offer Rate Discrepancy With Final Approval Rate Lacks Adverse Action Notice',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's personal loan pre-qualification tool uses a soft-pull credit inquiry
      to generate rate estimates; when the borrower proceeds through full application and
      the hard-pull credit and income verification results in a final offered rate materially
      higher than the pre-qualification estimate, the bank does not provide an adverse action
      notice identifying the reason for the rate increase, characterizing the outcome as a
      counter-offer rather than an adverse action. ECOA Regulation B requires that a
      counter-offer at materially worse terms constitute an adverse action requiring notice
      if the applicant does not accept; the CFPB's 2022 supervisory highlights cited peer
      banks for the identical practice of treating pre-qual-to-final-rate discrepancies as
      counter-offers without adverse action notices, resulting in consent orders with
      mandatory notification remediation programs.`,
    keywords: ['ECOA', 'Reg B', 'adverse action', 'CFPB examination', 'personal loan'],
    demoRelevant: true,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1446',
    name: 'Personal Loan Income Verification Gap Exposes Portfolio to Ability-to-Repay Challenge',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's personal loan underwriting program uses stated income for applications
      below $15,000 without requiring income documentation, relying on a proprietary income
      estimation model calibrated against bank account deposit patterns. When the CFPB's
      ability-to-repay supervisory examination analyzes the bank's personal lending portfolio,
      the examiner finds that stated-income applications that went through the estimation
      model have an 18-month default rate 2.1 times higher than the rate for documented-income
      loans at equivalent FICO scores, establishing a prima facie pattern of inadequate
      ability-to-repay verification under Dodd-Frank Section 1412's residual ATR standard
      applicable to non-QM personal loans.`,
    keywords: ['ability-to-repay', 'CFPB', 'personal loan', 'Dodd-Frank', 'income verification'],
    demoRelevant: true,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1447',
    name: 'Personal Loan Risk-Based Pricing Notice Does Not Reference Credit Score Used',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `The Fair Credit Reporting Act's risk-based pricing notice rules (FCRA Section 615(h)
      and Regulation V) require creditors that use consumer credit reports in setting
      credit terms to provide risk-based pricing notices identifying the credit bureau,
      the credit score used, and the score range; First Capital's personal loan risk-based
      pricing notice template provides the bureau name and score range but does not include
      the actual score used to price the loan — a required disclosure element under
      Regulation V Section 1022.73(a)(1). The CFPB's risk-based pricing rule examination
      procedures cite the omission of the actual credit score from the risk-based pricing
      notice as one of the most frequently found FCRA technical violations in consumer
      lending examinations.`,
    keywords: ['FCRA', 'risk-based pricing notice', 'CFPB examination', 'personal loan', 'Regulation V'],
    demoRelevant: false,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1448',
    name: 'Personal Loan Debt Cancellation Product Fee Not Included in Finance Charge',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's personal loan origination platform offers a debt cancellation contract
      product that waives loan payments upon covered life events (death, disability, involuntary
      unemployment) for a monthly fee added to the loan payment; the debt cancellation product
      fee is disclosed separately as an optional add-on and is not included in the finance
      charge for TILA APR purposes. OCC Bulletin 2004-20 and the CFPB's 2014 supervisory
      guidance on debt cancellation products require that debt cancellation fees be included
      in the finance charge calculation when the product is a condition of credit or when
      the borrower is not informed in writing of the right to cancel within 30 days;
      First Capital's product does not provide a 30-day cancellation right, making the
      fee a finance charge whose omission from APR constitutes a systematic TILA
      material disclosure violation.`,
    keywords: ['TILA', 'Regulation Z', 'debt cancellation', 'OCC', 'personal loan'],
    demoRelevant: false,
    subTopic: 'personal-unsecured',
  },
  {
    code: 'B1449',
    name: 'Personal Loan Rescission Right Not Triggered for Credit Agreements Secured by Principal Dwelling',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `When First Capital approves personal loans that borrowers request with their principal
      dwelling named as collateral — even informally, through cross-collateralization clauses
      in blanket security agreements — Regulation Z's three-day right of rescission under
      Section 1026.23 applies; the bank's personal loan origination system does not identify
      cross-collateral references to principal dwelling security interests and does not generate
      the required Notice of Right to Rescind for these loans. The bank's 2024 loan file review
      identifies 340 personal loans where cross-collateral agreement language created a dwelling
      security interest without a rescission notice, making each loan subject to an extended
      three-year rescission right under TILA Section 125(f) — a material TILA exposure that
      the bank has not quantified or remediated.`,
    keywords: ['TILA', 'Regulation Z', 'rescission right', 'CFPB examination', 'personal loan'],
    demoRelevant: false,
    subTopic: 'personal-unsecured',
  },

  // ── AI Consumer Lending ──────────────────────────────────────────────────
  {
    code: 'B1450',
    name: 'AI Mortgage Pre-Qualification Chatbot Provides Rate Lock Commitment Without LO License',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's AI-powered mortgage pre-qualification chatbot generates personalized
      rate estimates and communicates lock eligibility language — "you qualify to lock a rate
      today" — in response to borrower interest rate inquiries, constituting mortgage loan
      originator activity under Regulation Z Section 1026.36 and the SAFE Act without the
      required state MLO license or federal registration for the AI system or its human
      supervisors. The CFPB's 2023 guidance on AI chatbots in mortgage origination states
      that automated systems providing individualized rate commitments, lock offers, or
      loan product recommendations are engaging in originator activity regardless of whether
      a human MLO subsequently reviews the recommendation; the bank has not registered the
      chatbot under the NMLS or obtained a legal opinion on whether the chatbot's outputs
      constitute originator activity in each of its 23 operating states.`,
    keywords: ['AI mortgage chatbot', 'SAFE Act', 'Regulation Z', 'CFPB examination', 'MLO licensing'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1451',
    name: 'AI Credit Scoring Alternative Data Model Uses Rental Payment Data Without FCRA Safeguards',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital integrates a fintech alternative credit data provider that supplements
      traditional bureau data with rental payment, utility, and subscription payment histories
      to improve thin-file consumer loan approval rates; the alternative data provider is not
      registered as a consumer reporting agency under FCRA, and First Capital does not provide
      adverse action notices that include the alternative data provider's name and contact
      information when the alternative data contributes to a denial. The CFPB's 2022 circular
      on the use of alternative data in credit decisions and FCRA Section 607(b) require that
      creditors using consumer report information ensure the furnisher is a registered CRA and
      that adverse action notices reflect all consumer reporting sources used; the bank's
      alternative data integration creates an FCRA compliance gap for every adverse action
      where the alternative data was a factor in the decision.`,
    keywords: ['FCRA', 'alternative data', 'CFPB', 'AI credit scoring', 'Regulation B'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1452',
    name: 'ML Personal Loan Pricing Model Embeds Zip Code as Proxy for Race Without Fair Lending Review',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's ML personal loan pricing model includes borrower zip code as a direct
      model feature for pricing risk adjustment, treating zip code as a proxy for local
      economic conditions and default probability; the model has not undergone a disparate
      impact analysis to test whether zip code — which correlates with race, national origin,
      and color at rates above 0.7 correlation in First Capital's operating markets — results
      in systematically higher pricing for borrowers in majority-minority zip codes at
      equivalent credit risk levels. The CFPB's 2023 fair lending examination guidance and
      ECOA explicitly identify zip code as a high-risk proxy variable for race that requires
      affirmative disparate impact testing before deployment in any credit pricing model;
      the bank's model risk management team approved the model under SR 11-7 without a
      fair lending disparate impact test.`,
    keywords: ['ECOA', 'disparate impact', 'ML pricing model', 'SR 11-7', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1453',
    name: 'AI Hardship Detection Model Triggers Collections Without Borrower Outreach Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an AI model that analyzes real-time checking account deposit
      patterns, payroll frequency changes, and overdraft behavior to detect early borrower
      financial hardship signals and automatically escalates accounts to the active delinquency
      management queue 30–45 days before first missed payment; the escalation triggers
      collections-oriented outreach without offering the proactive hardship forbearance program
      that CFPB supervisory guidance recommends servicers make available to distressed borrowers
      before account deterioration. The model's early escalation — framed as collections
      pre-screening rather than borrower assistance outreach — increases borrower stress and
      reduces subsequent engagement with forbearance options, and the CFPB's UDAP
      supervisory authority treats AI-driven early collections escalation without
      corresponding hardship assistance offers as an unfair act toward financially
      distressed consumers.`,
    keywords: ['AI hardship model', 'CFPB', 'UDAP', 'consumer lending', 'forbearance'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1454',
    name: 'Generative AI Loan Disclosure Package Generator Produces State-Wrong Disclosure Versions',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital implements a generative AI tool to assemble consumer loan closing document
      packages by selecting and populating required disclosures based on loan type, amount, and
      borrower residence; the LLM's document selection logic uses state of application — determined
      by the origination branch or portal — rather than state of borrower residence when the
      two differ, generating state-specific addenda required by the borrower's state of residence
      that are missing from the closing package. For military borrowers who apply at an on-base
      financial center in one state while residing in another, or for digital origination borrowers
      whose browser location differs from their legal residence, the LLM selects the wrong
      state-specific disclosure set, creating TILA state supplement violations in the 18
      states that require disclosures beyond the federal minimum.`,
    keywords: ['GenAI', 'TILA', 'Regulation Z', 'CFPB examination', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1455',
    name: 'AI Behavioral Scoring Model Uses Browser Session Data Without Reg B Permissible Purpose',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital licenses a behavioral analytics scoring model that ingests borrower
      browser session data — time on page, scroll depth, application form hesitation events,
      and device switching patterns — as predictive features for consumer loan default
      probability and approves the model as a supplemental scoring tool for thin-file
      applicants; the bank has not analyzed whether the browser behavioral features constitute
      consumer report information under FCRA or whether the use of behavioral data in credit
      decisions requires disclosure under ECOA Regulation B's adverse action notice rules.
      The CFPB's 2024 AI in credit decisions supervisory circular explicitly identifies
      behavioral session data used in automated credit decisions as potential consumer
      report data requiring CRA registration and adverse action disclosure, making the
      bank's unlabeled behavioral data integration a systemic FCRA compliance gap.`,
    keywords: ['FCRA', 'ECOA', 'behavioral scoring', 'CFPB', 'AI credit model'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1456',
    name: 'AI Loan Servicing Assistant Fails to Escalate Complaints to CFPB-Reportable Threshold',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's AI loan servicing virtual assistant handles first-line borrower
      inquiries and complaint intake through the bank's mobile app and website, but the
      AI's intent classification model does not reliably distinguish between general
      account inquiries and formal complaints that trigger the bank's CFPB complaint
      reporting obligations under 12 C.F.R. Part 1070. Formal complaints resolved by
      the AI assistant are logged as resolved inquiries rather than as complaints, causing
      the bank's CFPB complaint submission count to understate actual complaint volume by
      an estimated 34%; the CFPB's examination supervision team has flagged complaint
      data suppression — whether intentional or AI-driven — as a supervisory priority,
      and the bank's next CFPB examination will include a data reconciliation comparing
      AI interaction logs against reported complaint counts.`,
    keywords: ['CFPB', 'complaint reporting', 'AI servicing assistant', 'consumer lending', 'supervisory priority'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1457',
    name: 'AI Appraisal Review Model Overrides Low AMC Appraisals Without Documented Basis',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an AI model that compares AMC-delivered appraisal values against
      an AVM benchmark and flags appraisals more than 8% below the AVM as potential underestimates;
      when the AI flags an appraisal, the bank's underwriting team can override the appraisal
      with the AVM value without ordering a second appraisal or documenting a case-specific
      basis for the override, contrary to Interagency Appraisal and Evaluation Guidelines (2010)
      and the OCC's Bulletin 2021-15 on collateral valuation risk. The AI-enabled override
      practice systematically raises collateral values in markets with rapid appreciation —
      markets that also have higher concentrations of minority borrowers — and the bank's
      2024 model performance review finds that AI-overridden appraisals have a 23% higher
      subsequent default rate, suggesting the AVM was the less accurate valuation source
      in those markets.`,
    keywords: ['AI appraisal model', 'OCC', 'Interagency Appraisal Guidelines', 'AVM', 'mortgage'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1458',
    name: 'LLM Marketing Copy Generator Produces Consumer Lending Ads Without Reg Z Trigger Term Controls',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's marketing team uses a generative AI copy tool to produce consumer loan
      advertisement text for digital channels, social media, and email campaigns; the LLM
      generates compelling ad copy that includes specific APR figures and monthly payment
      amounts as hooks — both of which are Regulation Z trigger terms requiring disclosure
      of the full standardized credit terms (APR, repayment schedule, total cost) in the
      same communication. The LLM's output does not include Reg Z trigger term follow-on
      disclosures because the compliance disclosure logic is not integrated into the content
      generation workflow; the bank's legal review gate catches only 60% of AI-generated
      ads before publication because review throughput has not scaled with AI content volume,
      resulting in Regulation Z non-compliant advertisements that the CFPB monitors via
      web scraping and automated compliance scanning.`,
    keywords: ['Regulation Z', 'TILA', 'CFPB', 'trigger terms', 'GenAI marketing'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1459',
    name: 'AI Income Verification Orchestrator Accepts Synthetic Paystubs Without Spoofing Detection',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AI-powered income verification orchestration tool accepts uploaded
      paystub images and automatically extracts income figures for entry into the underwriting
      system, but the tool does not include document authenticity detection for synthetic or
      AI-generated paystubs that fraudsters produce using widely available generative AI
      tools. Post-origination fraud analytics finds that 4.2% of personal loan originations
      funded in 2024 used synthetic AI-generated income documents that the verification
      orchestrator processed without generating a fraud flag; the OCC's operational risk
      guidance and the CFPB's ability-to-repay supervisory expectations both require that
      income verification tools include anti-spoofing controls when document images are
      accepted, and the bank's current tool has no authenticity detection capability
      despite handling 40,000 paystub submissions monthly.`,
    keywords: ['AI income verification', 'OCC', 'ability-to-repay', 'fraud detection', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1460',
    name: 'ML Retention Pricing Model Offers Lowest Rate Only to At-Risk High-Value Customers',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deploys an ML retention pricing model that identifies existing personal
      loan customers likely to prepay or refinance and proactively offers them a rate reduction
      to retain the account; the model reserves its lowest retention rates for high-balance,
      low-risk customers who are likely refinancing competitors, systematically excluding
      lower-balance borrowers from retention offers even when those borrowers are equally
      at risk of refinancing. ECOA and CFPB fair lending examination guidance require that
      proactive rate-reduction programs be evaluated for disparate impact when customer
      eligibility or offered rate correlates with protected class characteristics; the bank's
      model has not been tested for disparate impact and the CFPB's 2023 AI pricing supervisory
      note identifies AI retention pricing disparities as an emerging fair lending examination
      area.`,
    keywords: ['ECOA', 'ML retention pricing', 'CFPB', 'SR 11-7', 'personal loan'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1461',
    name: 'AI Consumer Loan Portfolio Stress Test Model Not Reviewed Under SR 11-7 Challenger Framework',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital uses an AI-based consumer credit stress testing model to project loss
      rates under DFAST-inspired adverse macroeconomic scenarios for its personal loan and
      auto loan portfolios; the model has been in production for 22 months without a
      challenger model being developed and compared against the production model's
      projections, as required by SR 11-7's principle that all high-risk models maintain
      ongoing model performance benchmarking through challenger or shadow models.
      The absence of a challenger model means the bank cannot demonstrate that its
      AI stress test model produces reliable projections relative to alternative approaches,
      a gap that the FRB's DFAST supervisory review framework treats as evidence of
      insufficient model risk management for a model that directly informs regulatory
      capital planning submissions.`,
    keywords: ['SR 11-7', 'DFAST', 'AI stress test model', 'OCC', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1462',
    name: 'GenAI Credit Agreement Summarizer Omits Material Default and Acceleration Clause Terms',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital implements a GenAI tool that summarizes consumer loan agreements into
      a plain-language "key terms" document presented to borrowers at origination as a
      supplement to the full agreement; quality review of 500 GenAI summaries finds that
      the tool omits default and acceleration clause disclosures in 28% of summaries,
      specifically the conditions under which the bank can declare the full loan amount
      immediately due and the fees associated with acceleration. The CFPB's UDAP supervisory
      framework requires that AI-generated consumer disclosures not create a misleading
      impression of loan terms through selective omission, and a GenAI summary that omits
      material adverse terms while presenting itself as a complete plain-language summary
      constitutes a deceptive act at the point of loan closing.`,
    keywords: ['GenAI', 'CFPB', 'UDAP', 'consumer lending', 'Regulation Z'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1463',
    name: 'AI Loan Application Abandonment Retargeting Model Uses Credit Intent Data Without Consent',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's AI-powered digital marketing platform ingests incomplete loan application
      data from borrowers who abandon the application before submission — including requested
      loan amount, purpose, income, and employment status entered into the multi-step application
      form — to build behavioral retargeting audiences for loan advertising; the bank's
      privacy notice does not disclose that partial application data is retained and used for
      retargeting purposes when the application is not submitted. The CFPB's 2024 data privacy
      supervisory guidance and GLBA's Notice and Opt-Out provisions require that the collection
      and use of consumer financial application data for marketing purposes be disclosed;
      using abandoned application data containing credit-relevant financial information for
      retargeting without disclosure constitutes a material GLBA Notice violation and a
      CFPB UDAP unfair data use finding.`,
    keywords: ['GLBA', 'CFPB', 'AI retargeting', 'consumer lending', 'data privacy'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },

  // ── Student Loan (continued) ──────────────────────────────────────────────
  {
    code: 'B1464',
    name: 'Student Loan Auto-Default on Co-Signer Death Not Addressed in Servicing Policy',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's private student loan agreements contain auto-default clauses that
      allow the bank to accelerate the full loan balance when a co-signer dies or files
      for bankruptcy, even when the primary borrower is current on all payments; the bank's
      servicing operations team enforces the auto-default clause without evaluating whether
      invoking it is consistent with the CFPB's UDAP supervisory guidance on auto-default
      triggers, which the CFPB has characterized as an unfair act when applied to current
      borrowers without any prior notice or opportunity to obtain a replacement co-signer.
      The CFPB's 2015 supervisory action on auto-default clauses and its 2022 follow-up
      study on private student loan co-signer release both conclude that bank-initiated
      acceleration of current-paying student loans solely due to co-signer life events
      causes substantial borrower harm that is not outweighed by the bank's credit risk
      management benefit.`,
    keywords: ['CFPB', 'UDAP', 'student loan servicing', 'auto-default clause', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loan',
  },
  {
    code: 'B1465',
    name: 'Private Student Loan Promissory Note Ambiguous on Variable Rate Cap Calculation Method',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's private student loan promissory notes disclose a variable rate cap
      as a maximum APR of 18%, but the notes do not specify whether the cap applies to the
      contractual interest rate, the margin, or the total APR including fees — an ambiguity
      that creates three different interpretations of the maximum rate and that First Capital's
      servicing team has applied inconsistently across different loan cohorts. The CFPB's
      private student loan examination guidance and TILA Regulation Z Section 1026.18(s)
      require that variable rate disclosures specify the cap calculation methodology with
      sufficient precision to allow the borrower to understand the maximum amount they
      may owe; the note's ambiguity on cap calculation method has been cited in borrower
      complaints and creates potential contract reformation exposure in states with
      consumer lending good faith interpretation statutes.`,
    keywords: ['TILA', 'Regulation Z', 'variable rate cap', 'CFPB', 'student loan servicing'],
    demoRelevant: false,
    subTopic: 'student-loan',
  },
  {
    code: 'B1466',
    name: 'Student Loan Deferment Period Interest Capitalization Not Disclosed at Origination',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's private student loan origination disclosures state that interest
      accrues during the in-school deferment period but do not clearly disclose that
      the accrued interest will be capitalized — added to principal — at the end of the
      deferment period, increasing the principal balance on which future interest accrues.
      Regulation Z's private student loan disclosure requirements under Section 1026.17(e)
      require that the total repayment amount disclosed include the effect of interest
      capitalization; First Capital's disclosures compute total repayment cost on the
      original principal without capitalization, systematically understating the total
      cost to the borrower. The CFPB's 2022 private student loan report found that
      capitalization disclosure gaps were present at 7 of the 10 largest private
      student loan originators examined.`,
    keywords: ['TILA', 'Regulation Z', 'interest capitalization', 'CFPB', 'student loan'],
    demoRelevant: false,
    subTopic: 'student-loan',
  },
  {
    code: 'B1467',
    name: 'Student Loan Refinance Solicitation Uses Federal Loan Branding Without Safe Harbor Disclosures',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's student loan refinance marketing uses the phrase "consolidate your
      student loans" in digital advertising without prominently disclosing that refinancing
      federal student loans with a private lender permanently eliminates the borrower's
      access to federal income-driven repayment, Public Service Loan Forgiveness, and federal
      deferment and forbearance programs. The CFPB's 2023 student loan advertising examination
      guidance requires that any advertisement for private student loan refinance that
      references consolidation of federal loans include a specific safe harbor statement
      on the loss of federal benefits; the bank's marketing compliance review process
      flags the absence of the safe harbor disclosure in the digital ad copy, but the
      marketing team has not updated the campaign because the disclosure is considered
      "conversion-killing" by the growth team.`,
    keywords: ['CFPB', 'UDAP', 'student loan refinance', 'income-driven repayment', 'advertising compliance'],
    demoRelevant: true,
    subTopic: 'student-loan',
  },
  {
    code: 'B1468',
    name: 'Private Student Loan Forbearance Granted via AI Chatbot Without Written Agreement',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's AI servicing chatbot can approve and activate forbearance periods
      for private student loan borrowers experiencing temporary hardship, generating an
      automated confirmation message that states the forbearance terms — duration, whether
      interest accrues, and the resume-payment date — in the chat interface without generating
      or transmitting a written forbearance agreement signed by the servicer. Regulation Z's
      requirements for modifications to credit agreement terms and CFPB private student loan
      servicing guidance both require that forbearance agreements be documented in writing,
      include all material terms, and be retained in the servicing record; AI-generated chat
      confirmations that are not stored in the servicing system do not satisfy the written
      agreement requirement, and borrowers who cannot retrieve their forbearance terms later
      file higher rates of servicing error complaints.`,
    keywords: ['CFPB', 'Regulation Z', 'AI chatbot', 'student loan servicing', 'forbearance'],
    demoRelevant: true,
    subTopic: 'student-loan',
  },
  {
    code: 'B1469',
    name: 'Tax Form 1098-E Student Loan Interest Statement Reports Incorrect Interest for Capitalized Periods',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's student loan tax reporting system generates Form 1098-E (Student Loan
      Interest Statement) reporting only cash-basis interest payments received during the tax
      year, without including capitalized interest that was added to principal during an
      in-school or grace period deferment — a portion of interest that is deductible under
      IRC Section 221 when it was paid through capitalization into principal. IRS guidance
      on Form 1098-E requires that interest reportable to borrowers include capitalized
      interest amounts; the bank's incorrect 1098-E reporting causes students to underreport
      deductible student loan interest on their tax returns, a harm that the CFPB characterizes
      as a consumer injury within its UDAP supervisory authority because the incorrect
      form is issued by the bank rather than caused by borrower error.`,
    keywords: ['1098-E', 'student loan servicing', 'CFPB', 'interest capitalization', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loan',
  },

  // ── HELOC & Home Equity ──────────────────────────────────────────────────
  {
    code: 'B1470',
    name: 'HELOC Draw Period End Notice Delivered Less Than 30 Days Before Repayment Phase',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's HELOC servicing platform delivers the required change-in-terms notice
      that alerts borrowers to the transition from the draw period to the repayment period
      only 14 days before the transition date, relying on the Regulation Z 15-day advance
      notice minimum for variable-rate open-end credit terms changes; CFPB supervisory
      guidance for HELOC servicing recommends 30-day advance notice as a best practice
      for the draw-to-repayment transition, because borrowers need time to plan for a
      shift from interest-only to fully amortizing payments that can double or triple the
      monthly payment amount. The bank's 2024 HELOC complaint data shows that 43% of
      repayment-phase delinquencies occur in the first 90 days post-transition among
      borrowers who received 14-day notices, versus 12% for borrowers who received longer
      advance notice — a direct causal link between inadequate notice and consumer harm.`,
    keywords: ['Regulation Z', 'HELOC', 'CFPB examination', 'change-in-terms notice', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'heloc-home-equity',
  },
  {
    code: 'B1471',
    name: 'HELOC Credit Line Reduction AVM Not Validated for Accuracy in Subject Market',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital uses an automated valuation model (AVM) to support credit line reductions
      on existing HELOC accounts when property values decline; Regulation Z Section 1026.40(f)(3)(vi)
      permits HELOC credit line reductions when property value significantly declines, but requires
      that the reduction be based on a credible valuation. The bank's AVM vendor has not been
      tested for accuracy in rural portions of First Capital's HELOC portfolio footprint where
      comparable sales are sparse, and AVM estimates in those markets diverge from subsequent
      full appraisals by more than 25% in 41% of test cases. HELOC credit line reductions
      based on inaccurate AVMs that overstate value decline constitute adverse actions
      requiring Regulation B adverse action notices with specific reasons, and the bank
      has been generating generic "property value decline" notices that do not identify
      the AVM as the valuation basis.`,
    keywords: ['HELOC', 'AVM', 'Regulation Z', 'Reg B adverse action', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'heloc-home-equity',
  },
  {
    code: 'B1472',
    name: 'Home Equity Loan TILA Three-Day Rescission Not Extended for Late Disclosure Correction',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `When First Capital issues a corrected Truth-in-Lending disclosure on a closed-end home
      equity loan after the original closing — to correct an error in the disclosed finance
      charge or APR — the bank does not restart the three-business-day rescission period
      required by Regulation Z Section 1026.23(h), which provides that a corrected disclosure
      restarts the rescission period if the correction discloses terms more unfavorable to the
      borrower. The bank's policy treats post-closing TILA corrections as administrative
      corrections that do not trigger rescission rights, but the CFPB's examination guidance
      and case law under TILA Section 125 are clear that any corrected disclosure showing
      a higher APR or finance charge restarts the rescission period; affected borrowers who
      were entitled to rescind after receiving a corrected disclosure retained an extended
      three-year rescission right under TILA Section 125(f).`,
    keywords: ['TILA', 'Regulation Z', 'rescission', 'home equity loan', 'CFPB examination'],
    demoRelevant: false,
    subTopic: 'heloc-home-equity',
  },
  {
    code: 'B1473',
    name: 'HELOC Inactivity Fee Charged Without Disclosure in Account Opening Agreement',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `First Capital assesses an annual inactivity fee on HELOC accounts with no draw activity
      for 12 consecutive months; the fee was introduced in a 2023 product repricing, and the
      change-in-terms notice sent to existing HELOC customers 45 days before imposition did not
      include a prominent disclosure that the fee constitutes a new fee not present at account
      opening. The CFPB's open-end credit change-in-terms requirements under Regulation Z
      Section 1026.9(c) require that notices of new fee types be more prominently disclosed
      than routine interest rate change notices; the bank's standard change-in-terms template
      uses identical formatting for all changes, making the introduction of a new inactivity
      fee structurally indistinguishable from a routine rate change.`,
    keywords: ['Regulation Z', 'HELOC', 'change-in-terms', 'CFPB examination', 'inactivity fee'],
    demoRelevant: false,
    subTopic: 'heloc-home-equity',
  },
  {
    code: 'B1474',
    name: 'Home Equity Conversion Mortgage Counseling Referral List Not Updated Within 180 Days',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `HUD regulations require that reverse mortgage originators provide HECM counselor
      referral lists that are updated within the prior 180 days; First Capital's mortgage
      operations team maintains a static HECM counselor list that was last verified 14 months
      ago, and three of the eight counseling agencies on the list have since withdrawn their
      HUD approval, meaning the list directs borrowers to inactive or unlicensed counselors.
      The FHA's HECM origination requirements and Mortgagee Letter 2016-07 require that
      referral lists be current; originating a HECM after providing a referral list with
      inactive counselors constitutes a violation of HECM origination requirements that
      can result in FHA insurance claim denial if the deficiency is discovered post-close,
      and FHA audit findings on HECM origination quality consistently cite stale
      counselor referral lists as a top violation category.`,
    keywords: ['HECM', 'HUD', 'reverse mortgage', 'FHA', 'mortgage origination'],
    demoRelevant: false,
    subTopic: 'heloc-home-equity',
  },
  {
    code: 'B1475',
    name: 'HELOC Flood Insurance Requirement Not Reassessed When FEMA Map Revision Reclassifies Property',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `The National Flood Insurance Reform Act and OCC flood insurance guidance require that
      banks monitor flood map revisions and notify HELOC borrowers within 45 days when a
      Federal Emergency Management Agency map revision reclassifies their property into a
      Special Flood Hazard Area (SFHA), requiring the borrower to purchase flood insurance.
      First Capital's HELOC servicing platform does not receive FEMA flood map revision
      alerts and does not run automated portfolio re-screening when FEMA releases Community
      Level Map Service Changes (CLOMSCs); the bank's 2024 flood insurance audit identifies
      230 active HELOC accounts on properties reclassified into SFHA zones in the prior
      18 months that have never received flood insurance notification, exposing the bank
      to regulatory penalties of up to $2,000 per uninsured loan per day under 42 U.S.C. § 4012a.`,
    keywords: ['FEMA', 'flood insurance', 'HELOC', 'OCC', 'NFIA'],
    demoRelevant: true,
    subTopic: 'heloc-home-equity',
  },

  // ── AI Consumer Lending (continued) ──────────────────────────────────────
  {
    code: 'B1476',
    name: 'AI Automated Valuation Model Deployed for HELOC Without Model Risk Management Approval',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital integrated a new third-party AVM into its HELOC origination workflow to
      replace full appraisals on lines below $150,000, reducing origination cycle time by
      12 days; the AVM was implemented as a vendor data feed rather than as a model, bypassing
      the bank's SR 11-7 model risk management inventory and validation process. The OCC's
      Interagency Appraisal and Evaluation Guidelines (2010) and OCC Bulletin 2021-15 require
      that AVMs used in credit decisions be treated as models subject to model risk management
      governance including initial validation, ongoing monitoring, and annual model performance
      review; the bank's failure to register the AVM in its model inventory means it has
      operated for 16 months without a documented validation, a model performance benchmark,
      or a challenge process — all required by SR 11-7 for any model affecting credit decisions.`,
    keywords: ['SR 11-7', 'AVM', 'OCC', 'HELOC', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1477',
    name: 'AI Chatbot Home Equity Pre-Qualification Provides Binding Commitment Language',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's AI chatbot for home equity products responds to borrower inquiries
      with language such as "based on what you've told me, you're likely approved for a
      home equity line of up to $80,000 at 7.25% APR" — language that borrowers reasonably
      interpret as a conditional commitment rather than a non-binding pre-qualification estimate.
      When the subsequent full application results in a lower approval or a denial, borrowers
      file complaints citing the AI chatbot's language as a commitment; the CFPB's 2023
      guidance on AI chatbot output in mortgage and home equity origination requires that
      automated pre-qualification tools include clear disclaimers distinguishing estimates
      from commitments, and the bank's chatbot lacks any such disclaimer, making its
      outputs actionable as misleading representations under Dodd-Frank Section 1031 UDAP.`,
    keywords: ['AI chatbot', 'CFPB', 'UDAP', 'HELOC', 'Regulation Z'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1478',
    name: 'ML Consumer Loan Fraud Model Generates Disparate Freeze Rates for Minority Applicants',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's ML fraud pre-screen model for consumer loans uses features including
      IP geolocation mismatch, device fingerprint age, and payment-to-income ratio quartile
      to flag applications for manual fraud review — a review that delays funding by 3–5
      business days. Post-deployment analysis finds that the model's fraud flag rate is
      2.4 times higher for applicants in majority-minority zip codes at equivalent FICO scores,
      and 68% of manual review outcomes for these flagged applications result in approval with
      no fraud evidence found. ECOA and CFPB fair lending examination guidance require that
      AI fraud screening tools that produce statistically significant disparate impact on
      protected class groups be subjected to less discriminatory alternative analysis and
      business necessity review; the bank's SR 11-7 validation did not include a fair
      lending disparate impact assessment.`,
    keywords: ['ECOA', 'ML fraud model', 'SR 11-7', 'CFPB examination', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
  {
    code: 'B1479',
    name: 'AI Consumer Credit Line Management System Not Inventoried Under OCC Model Risk Framework',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital operates an AI-driven consumer credit line management system that
      autonomously adjusts credit limits on personal loan revolving accounts, personal
      lines of credit, and HELOCs on a monthly cycle using gradient-boost models trained
      on behavioral, bureau, and internal relationship data; three of the five component
      models within this system are classified as business analytics tools in the bank's
      enterprise model inventory rather than as credit decision models, exempting them
      from the full SR 11-7 model validation and annual review requirements. OCC Bulletin
      2011-12 and SR 11-7 guidance define models broadly to include any quantitative
      method used to support financial decisions, and the CFPB's 2024 model risk supervisory
      circular extends this definition explicitly to AI systems that make or significantly
      influence consumer credit decisions; the bank's misclassification leaves three
      production AI models operating without required validation, performance monitoring,
      or challenge model comparison.`,
    keywords: ['SR 11-7', 'OCC', 'AI credit model', 'model risk management', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-consumer-lending',
  },
];
