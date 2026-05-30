// seed-banking-dom09-fraud-part2.ts
// Banking genome patterns — Fraud Detection & Prevention
// Code range: B2560–B2619  (60 patterns)
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

export const BANKING_FRAUD_PART2_PATTERNS: PatternSeed[] = [

  // ── Elder Financial Fraud ──────────────────────────────────────────────────
  {
    code: 'B2560',
    name: 'Elder Financial Exploitation Detection Gaps in Branch Transaction Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's branch transaction monitoring rules do not include behavioral flags
      designed to detect elder financial exploitation (EFE) — such as unusual large cash
      withdrawals by customers over 70, a new third-party accompanying the customer and
      directing the transaction, or sudden changes in beneficiary designations on deposit
      accounts. FinCEN's 2022 advisory on elder financial exploitation and the CFPB's
      supervisory priority on elder financial abuse both identify branch teller observation
      and transaction pattern monitoring as the primary detection layer for EFE; the absence
      of elder-specific rules means exploitation by family members, caregivers, and strangers
      is systematically missed until Adult Protective Services notifies the bank months after
      the funds are gone.`,
    keywords: ['elder financial exploitation', 'FinCEN advisory', 'CFPB elder abuse', 'APS reporting', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },
  {
    code: 'B2561',
    name: 'Adult Protective Services Reporting Protocol Undefined — EFE Cases Not Filed',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital does not have a documented protocol defining the conditions under which
      branch staff or fraud operations are required to file a report with Adult Protective
      Services (APS) when elder financial exploitation is suspected in a customer account.
      Thirty-four states have enacted mandatory reporting laws that include financial institution
      employees as mandated reporters for elder financial abuse; the bank operates in five
      states with mandatory reporting obligations but has no training curriculum, escalation
      path, or compliance monitoring program to ensure APS reports are filed when legally
      required. The absence of a mandatory reporting program creates regulatory exposure
      under state elder financial protection statutes and potential CFPB supervisory action
      for failure to establish EFE policies and procedures.`,
    keywords: ['APS reporting', 'mandatory reporter', 'CFPB elder exploitation', 'elder financial abuse', 'compliance program'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },
  {
    code: 'B2562',
    name: 'Fiduciary Abuse Detection Absent From Power-of-Attorney Account Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's deposit account monitoring system does not apply enhanced monitoring
      rules to accounts where a power-of-attorney (POA) holder has been granted transaction
      authority, despite POA accounts representing a disproportionate share of elder financial
      exploitation losses in the bank's fraud investigation records. Fiduciary abuse — where
      the POA holder makes transactions for personal benefit rather than the account holder's
      welfare — exhibits detectable patterns: self-dealing transfers to the agent's own accounts,
      rapid depletion of savings, and changes in beneficiary designations. FinCEN guidance on
      EFE and the OCC's 2024 examination procedures for senior customer protection both require
      banks to implement enhanced monitoring for accounts with agent access, a control gap
      that First Capital has not remediated despite the account-level data being available
      in its core banking system.`,
    keywords: ['power-of-attorney', 'fiduciary abuse', 'FinCEN EFE advisory', 'OCC examination', 'elder financial exploitation'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },
  {
    code: 'B2563',
    name: 'AI Elder Exploitation Detection Model Not Segmented by Customer Age Cohort',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's behavioral fraud analytics model scores account activity for exploitation
      risk using a single scoring population that is not segmented by customer age, treating
      a 35-year-old and a 78-year-old with identical transaction histories as equally likely
      to be exploitation victims. EFE exploitation patterns — sudden high-value transfers to
      new beneficiaries, rapid liquidation of CDs, requests for cashier's checks to unfamiliar
      payees — are statistically normal in younger accounts managing large purchases or
      investments but are strong EFE indicators in accounts held by customers over 70 with
      no prior history of such transactions. The bank's SR 11-7 validation scope for the fraud
      model does not include segment-level performance testing by age cohort, and CFPB
      supervisory expectations for elder financial exploitation programs require that AI-based
      detection be calibrated to the demographics of the population at risk.`,
    keywords: ['elder exploitation AI', 'SR 11-7', 'CFPB elder exploitation', 'behavioral analytics', 'age segmentation'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },
  {
    code: 'B2564',
    name: 'Trusted Contact Person Protocol Not Implemented for Senior High-Net-Worth Accounts',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital has not implemented a trusted contact person (TCP) program for senior
      customer accounts, despite FINRA Rule 4512 requiring broker-dealers to obtain trusted
      contact information and SEC guidance recommending that banks adopt equivalent practices
      for deposit and investment accounts of elderly customers. Without a TCP on file, when
      branch staff identify elder financial exploitation indicators — a customer who appears
      confused, is accompanied by a controlling third party, or is making unusual large
      withdrawals — there is no designated person outside the relationship who can be
      contacted to verify the customer's wellbeing and intent. CFPB supervisory guidance
      and the CFPB's 2024 focus on elder financial protection both identify the TCP program
      as a foundational consumer protection control that First Capital has not operationalized
      in its retail banking segment.`,
    keywords: ['trusted contact person', 'CFPB elder protection', 'FINRA Rule 4512', 'elder financial abuse', 'senior accounts'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },
  {
    code: 'B2565',
    name: 'EFE SAR Filing Rate Below FinCEN Peer Percentile for Regional Banks',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's BSA/AML program files elder financial exploitation SARs at a rate
      materially below the peer percentile benchmark for OCC-chartered regional banks of
      comparable asset size, according to FinCEN's annual SAR activity data. The low filing
      rate reflects the absence of a systematic referral pathway from retail banking to the
      BSA/AML team when EFE is suspected — tellers and branch managers lack documented
      escalation procedures that result in SAR evaluation, and the SAR decision process
      does not include an EFE-specific review protocol. FinCEN's 2022 EFE advisory and the
      OCC's horizontal examination findings on elder financial exploitation both identify
      low SAR filing rates in banks with inadequate EFE escalation programs as a systemic
      BSA compliance deficiency.`,
    keywords: ['EFE SAR filing', 'FinCEN', 'BSA/AML', 'OCC examination', 'elder financial exploitation'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },

  // ── Check Fraud ────────────────────────────────────────────────────────────
  {
    code: 'B2566',
    name: 'Positive Pay Exception Queue Backlog Allows Check Fraud to Clear Unreviewed',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's commercial positive pay program requires business customers to review
      exception items — checks presented for payment that do not match the issued check file —
      by 2:00 PM Eastern on the day of presentment, but the exception queue notification
      system experiences a recurring 3–4 hour delay during high-volume periods that compresses
      the effective review window to under an hour. When business customers fail to review
      and return exceptions within the compressed window due to notification delay, the bank's
      positive pay rules default to pay rather than return, systematically clearing fraudulent
      altered and counterfeit checks that should have been returned. OCC guidance on check
      fraud risk management and Reg CC's provisions on check return obligations require
      banks to provide business customers with a meaningful opportunity to review exceptions,
      which the notification delay has functionally eliminated.`,
    keywords: ['positive pay', 'Reg CC', 'OCC guidance', 'check fraud', 'exception management'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2567',
    name: 'Check Kiting Detection Algorithm Does Not Cover Intraday Commercial Account Cycling',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's check kiting detection model evaluates daily end-of-day account balances
      and float positions, but does not monitor intraday balance cycling behavior that characterizes
      modern commercial check kiting schemes — where businesses leverage same-day ACH availability
      and FedNow real-time credits to create artificial intraday float that the kiting algorithm
      never observes because the artificial balance is resolved before end-of-day posting. The
      bank's MRM team validated the kiting model against historical kiting cases from 2019–2021,
      before FedNow and expanded same-day ACH were available, so the model's feature set does not
      include intraday credit availability timing as a discriminating variable. FFIEC examination
      guidance on commercial account fraud requires that kiting detection systems be reviewed
      when new payment rails materially change the float mechanics that kiting exploits.`,
    keywords: ['check kiting', 'FFIEC', 'SR 11-7', 'commercial fraud', 'intraday monitoring'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2568',
    name: 'Remotely Created Check RCC Originator Monitoring Below NACHA Threshold Enforcement',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital originates remotely created checks (RCCs) for several commercial clients
      in the collections and insurance billing industries, but the bank's ODFI monitoring program
      does not apply the enhanced scrutiny that NACHA's operating rules require for RCC originators
      — specifically, the 0.5% unauthorized return threshold at which the bank must begin
      remediation proceedings against the originator. Several commercial RCC originators have
      return rates trending toward the NACHA threshold but have not received written notice or
      enhanced monitoring, and the bank's legal exposure as ODFI for unauthorized RCC returns
      has not been quantified. OCC guidance on third-party risk management requires banks to
      implement originator-level monitoring that enforces NACHA thresholds as a contractual
      obligation, preventing the bank from accumulating ODFI guarantee liability on originators
      with elevated return rates.`,
    keywords: ['remotely created check', 'NACHA', 'ODFI', 'Reg CC', 'check fraud'],
    subTopic: 'check-fraud',
  },
  {
    code: 'B2569',
    name: 'Counterfeit Check AI Detection Model Not Updated for Sophisticated Desktop Printing',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's image-based counterfeit check detection AI was trained on check fraud
      cases from 2018–2022, before the proliferation of high-resolution desktop printing
      technology and publicly available MICR font printing tools that allow fraudsters to produce
      counterfeit checks that are visually indistinguishable from genuine checks under the
      image quality parameters used in the bank's automated review. The AI model's training
      data does not include examples of counterfeits produced with current-generation consumer
      printers and MICR toner, so the model's precision against modern counterfeits has not
      been measured in the current fraud environment. SR 11-7 model monitoring requirements
      and the Financial Crimes Enforcement Network's 2023 check fraud advisory both recommend
      that financial institutions update fraud detection systems to address the surge in
      sophisticated check counterfeiting.`,
    keywords: ['counterfeit check AI', 'SR 11-7', 'FinCEN check fraud advisory', 'image analysis', 'MICR fraud'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2570',
    name: 'Reg CC Extended Hold Policy Not Applied Consistently — Check Fraud Loss Exposure',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's branch staff apply Reg CC extended hold provisions — which permit
      holds of up to 7 business days when the bank has reasonable cause to doubt collectibility
      — inconsistently, with some branches following the standard 2-day hold schedule even for
      large checks from unfamiliar issuers that exhibit counterfeiting risk indicators. When
      check fraud losses occur because a branch released funds before the check cleared and
      was returned, the loss investigation frequently reveals that the teller had reasonable
      cause to apply an extended hold but was not trained to recognize counterfeit check
      indicators or to document the basis for an extended hold. OCC examination guidance
      on Reg CC compliance and the FinCEN 2023 check fraud advisory both identify inconsistent
      hold practice as a fraud risk management gap in banks experiencing elevated check fraud.`,
    keywords: ['Reg CC', 'extended hold', 'OCC examination', 'check fraud', 'counterfeit check'],
    subTopic: 'check-fraud',
  },
  {
    code: 'B2571',
    name: 'Check Fraud Loss Surge Not Escalated to Board Risk Committee — Governance Gap',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital experienced a 340% increase in check fraud losses in 2023–2024, consistent
      with the industry-wide surge documented in FinCEN's 2023 check fraud advisory, but the
      loss data was reported within the fraud operations budget variance report rather than
      escalated to the board risk committee as a material operational risk event. The board
      risk committee's risk appetite framework does not include a check fraud loss threshold
      that triggers board-level escalation, and the OCC's operational risk examination framework
      requires that material fraud loss increases be assessed by senior management and reported
      to the board with a remediation plan — a governance failure that could be cited under
      the bank's active consent order.`,
    keywords: ['check fraud', 'FinCEN advisory', 'OCC examination', 'board risk governance', 'consent order'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },

  // ── Mortgage Fraud ─────────────────────────────────────────────────────────
  {
    code: 'B2572',
    name: 'Property Flipping Detection Model Uses Manual Appraisal Without Automated AVM Cross-Check',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's mortgage underwriting process flags potential property flipping fraud
      through appraiser review of prior sale history, but does not systematically cross-reference
      appraised value against automated valuation model (AVM) outputs to identify properties where
      the appraised value deviates materially from market-based estimates — a core indicator of
      inflated appraisal fraud in property flipping schemes. The CFPB's 2023 appraisal bias
      rule and Fannie Mae's fraud detection guidelines both require lenders to implement AVM
      cross-checks as a fraud detection control for purchase transactions; the bank's reliance
      on appraisal review without systematic AVM correlation means property flipping schemes
      with coordinated inflated appraisals pass underwriting review undetected until collateral
      valuation losses materialize post-origination.`,
    keywords: ['property flipping', 'CFPB appraisal rule', 'AVM', 'mortgage fraud', 'appraisal fraud'],
    demoRelevant: true,
    subTopic: 'mortgage-fraud',
  },
  {
    code: 'B2573',
    name: 'Straw Buyer Detection Not Implemented in Mortgage Pipeline Review',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's mortgage origination fraud controls do not include systematic detection
      of straw buyer patterns — where a creditworthy borrower is recruited to obtain a mortgage
      on behalf of a third party who provides down payment funds and controls the property —
      despite straw buyer mortgage fraud being a documented FBI enforcement priority since 2021.
      Straw buyer indicators include down payment sources that cannot be documented to the
      borrower's funds, occupancy misrepresentation, and abnormal relationships between borrower
      income and the target property market. The bank's origination scorecard was designed to
      assess credit risk and does not include fraud-specific features for straw buyer detection
      that Fannie Mae's seller/servicer selling guide requires as part of the lender's fraud
      prevention program.`,
    keywords: ['straw buyer', 'mortgage fraud', 'Fannie Mae selling guide', 'occupancy misrepresentation', 'FBI mortgage fraud'],
    demoRelevant: true,
    subTopic: 'mortgage-fraud',
  },
  {
    code: 'B2574',
    name: 'Occupancy Misrepresentation Detection Absent From Investor Loan Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital originates investor mortgage loans at a rate 12% above its peer group
      and does not have a post-origination occupancy monitoring program to detect occupancy
      misrepresentation fraud — where a borrower represents the property as a primary residence
      to qualify for owner-occupant pricing and underwriting but intends to rent or flip the
      property. Occupancy misrepresentation triggers GSE repurchase demands when discovered
      post-sale; Fannie Mae and Freddie Mac require originators to implement occupancy monitoring
      using data sources such as USPS address change data and utility service records within
      12 months of origination. The absence of any occupancy verification post-funding leaves
      the bank exposed to GSE repurchase demands that have materialized for peer institutions
      with similarly elevated investor loan origination rates.`,
    keywords: ['occupancy misrepresentation', 'Fannie Mae', 'mortgage fraud', 'GSE repurchase', 'investor loans'],
    demoRelevant: true,
    subTopic: 'mortgage-fraud',
  },
  {
    code: 'B2575',
    name: 'AI Mortgage Fraud Scoring Model Trained on GSE Data Without First Capital Portfolio Validation',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital licenses a mortgage fraud scoring model from a GSE-affiliated vendor that
      was trained on a national loan population, but the bank has not validated the model's
      performance against its own portfolio characteristics — specifically, its concentration in
      markets with active property flipping activity and a borrower demographic that differs
      materially from the national training population. SR 11-7 requires independent validation
      of vendor models against the bank's own use context, including assessment of whether the
      training population is representative of the bank's loan mix; the absence of portfolio-specific
      validation means the bank cannot demonstrate to OCC examiners that the model is conceptually
      sound for First Capital's specific geographic and demographic origination profile.`,
    keywords: ['mortgage fraud AI', 'SR 11-7', 'vendor model validation', 'OCC examination', 'GSE fraud scoring'],
    demoRelevant: true,
    subTopic: 'mortgage-fraud',
  },
  {
    code: 'B2576',
    name: 'Income Documentation Verification AI Not Detecting Advanced Paystub Fabrication',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's mortgage origination workflow uses an AI-powered income document
      verification tool to authenticate paystubs and W-2s, but the tool was not designed to
      detect sophisticated AI-generated paystub fabrication — documents produced using generative
      AI tools that replicate employer formatting, font characteristics, and tax withholding
      calculations precisely enough to pass the document AI's authenticity checks. The bank's
      vendor management review under OCC Bulletin 2023-17 does not include a contractual
      requirement for the income verification vendor to test its AI against generative AI
      document forgeries or to certify detection performance against current forgery typologies.
      Mortgage fraud using AI-generated income documentation has been documented in FBI mortgage
      fraud advisories since 2023 and represents a known gap in income verification AI systems
      trained before generative AI forgery tools became widely available.`,
    keywords: ['income verification AI', 'OCC Bulletin 2023-17', 'mortgage fraud', 'GenAI document forgery', 'TPRM'],
    demoRelevant: true,
    subTopic: 'mortgage-fraud',
  },

  // ── Insurance Proceeds Fraud ───────────────────────────────────────────────
  {
    code: 'B2577',
    name: 'Insurance Loss Claim Proceeds Fraud Detection Not in Commercial Deposit Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial deposit fraud monitoring does not include rules designed
      to detect fraudulent insurance proceeds — situations where a commercial customer deposits
      a large insurance claim payment that was obtained through inflated loss claims or staged
      casualty events. Insurance proceeds fraud accounts for an estimated $80B in annual industry
      losses, and the deposit transaction pattern — a large one-time insurance company-issued
      check followed by rapid fund distribution — is distinguishable from legitimate insurance
      settlements by the absence of a prior loss claim history in the customer's banking record
      and the speed of subsequent outbound transfers. FinCEN guidance on fraud typologies and
      OCC operational risk examination procedures both identify insurance proceeds monitoring
      as a gap area for commercial banks serving industries with high insurance fraud exposure,
      such as construction and vehicle dealerships.`,
    keywords: ['insurance proceeds fraud', 'FinCEN', 'OCC examination', 'commercial deposit monitoring', 'fraud typologies'],
    subTopic: 'insurance-proceeds',
  },
  {
    code: 'B2578',
    name: 'Structured Settlement Fraud Red Flags Not Identified in Trust Account Activity',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's trust and fiduciary services division maintains structured settlement
      annuity accounts for personal injury settlement recipients but does not monitor these
      accounts for structured settlement fraud — where a third-party factoring company induces
      the settlement recipient to sell future payment rights at a heavily discounted lump sum
      in violation of court approval requirements. The indicators of structured settlement
      fraud are detectable in account activity: unsolicited contact by factoring companies,
      requests for bank letters certifying payment streams, and unusual customer urgency
      about accessing future payment values. The Consumer Financial Protection Bureau and
      state attorneys general have pursued enforcement actions against structured settlement
      factoring fraud, and First Capital has no training or monitoring program in its trust
      division that would surface these patterns for review.`,
    keywords: ['structured settlement fraud', 'CFPB', 'trust account monitoring', 'factoring fraud', 'fiduciary services'],
    subTopic: 'insurance-proceeds',
  },
  {
    code: 'B2579',
    name: `Workers' Comp Fraud in Commercial Payroll Accounts Not Flagged by BSA Program`,
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's BSA/AML transaction monitoring rules for commercial payroll accounts
      do not include patterns associated with workers' compensation fraud — such as cash payroll
      disbursements to a large number of individuals with no Social Security Number records,
      contractor payment patterns inconsistent with the business's stated industry, or payroll
      amounts that do not correlate with the employer's reported premium basis for workers'
      compensation insurance. Workers' compensation fraud is a documented money laundering
      predicate offense under the Bank Secrecy Act, and FinCEN's typologies guidance identifies
      commercial bank payroll accounts as a vehicle for laundering proceeds of workers'
      compensation schemes; the bank's BSA monitoring program does not include this typology
      as a detection scenario.`,
    keywords: ["workers' comp fraud", 'BSA/AML', 'FinCEN typologies', 'commercial payroll', 'SAR filing'],
    subTopic: 'insurance-proceeds',
  },
  {
    code: 'B2580',
    name: 'Insurance Proceeds AI Scoring Model Missing from SR 11-7 Inventory',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial banking analytics team deployed an AI scoring model that
      flags deposit accounts receiving large insurance disbursements for enhanced review,
      classifying it as a business intelligence tool rather than a model under SR 11-7.
      The model influences which commercial accounts receive enhanced due diligence and
      SAR evaluation referrals from the BSA/AML team, making it a material input to a
      regulatory compliance decision process; SR 11-7's guidance on model definition includes
      any quantitative method used to inform consequential business decisions, regardless of
      the label applied by the deploying team. OCC examiners reviewing the bank's consent
      order remediation program are likely to identify the unregistered model as evidence
      that the shadow model inventory problem cited in the original consent order has not
      been fully remediated.`,
    keywords: ['insurance fraud AI', 'SR 11-7', 'model inventory', 'OCC consent order', 'shadow models'],
    demoRelevant: true,
    subTopic: 'insurance-proceeds',
  },
  {
    code: 'B2581',
    name: 'Commercial Property Insurance Claim Deposit Triggers No Enhanced Scrutiny Review',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital receives commercial property insurance claim deposits from several
      construction contractor customers whose loss claim history and deposit patterns exhibit
      FBI-documented signals of property insurance fraud: multiple claims in 24 months, rapid
      fund disbursement to subcontractors with no banking history, and claim amounts inconsistent
      with the property tax assessed value. The bank's commercial deposit monitoring program
      does not include a rule that triggers enhanced scrutiny when the combination of claim
      frequency, disbursement speed, and subcontractor payment patterns aligns with known
      insurance fraud typologies. FinCEN's 2023 guidance on real estate-adjacent fraud and
      OCC supervisory expectations for commercial fraud monitoring require banks to implement
      typology-specific detection for industries with documented high fraud rates.`,
    keywords: ['commercial property insurance fraud', 'FinCEN', 'OCC guidance', 'construction fraud', 'enhanced due diligence'],
    subTopic: 'insurance-proceeds',
  },

  // ── Commercial Fraud ───────────────────────────────────────────────────────
  {
    code: 'B2582',
    name: 'Corporate Account Takeover Dual-Control Gap in Commercial Online Banking Platform',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's commercial online banking platform allows corporate clients to disable
      dual-control requirements for ACH batch releases as a convenience configuration, and
      several commercial clients with balances above $5M have disabled dual-control without
      the bank performing an annual risk review of the configuration exception. Corporate account
      takeover (CATO) attacks — where fraudsters gain credentials to commercial online banking
      and initiate ACH batch transfers — consistently exploit single-operator release configurations
      because there is no second authorization step to intercept the fraudulent release. FFIEC
      guidance on commercial account fraud risk management requires that banks implement dual-control
      as a default for high-value commercial ACH origination and conduct annual reviews of
      clients who have requested configuration exceptions.`,
    keywords: ['corporate account takeover', 'FFIEC', 'dual-control', 'commercial ACH', 'CATO'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2583',
    name: 'Vendor Impersonation in Commercial ACH Credits Not Detected by Beneficiary Name Match',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's commercial ACH processing does not perform beneficiary name-to-account
      verification — when a corporate client originates an ACH credit to a vendor, the bank
      processes the transaction based on account number alone without confirming that the
      account holder name matches the intended beneficiary. Vendor impersonation fraud exploits
      this gap: a fraudster who convinces a corporate client to update a vendor ACH account number
      to a mule account can collect vendor payments indefinitely because the bank does not
      alert the corporate client that the account number routes to a different entity name.
      NACHA operating rules published in 2024 require originating banks to implement Confirmation
      of Payee (CoP) or equivalent beneficiary name validation for commercial ACH credits above
      defined thresholds; First Capital has not implemented CoP.`,
    keywords: ['vendor impersonation', 'NACHA Confirmation of Payee', 'commercial ACH', 'BEC fraud', 'ODFI'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2584',
    name: 'Payroll Fraud in Commercial Accounts — Ghost Employee ACH Detection Gap',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's commercial ACH origination monitoring does not include anomaly detection
      for ghost employee payroll fraud — where a business owner or payroll administrator adds
      fictitious employees to the payroll ACH file to divert funds to personal accounts.
      Ghost employee fraud exhibits distinguishable patterns in payroll ACH batches: new
      employee additions with Social Security Numbers that do not match state employment records,
      payroll entries with round-dollar amounts inconsistent with the employer's pay structure,
      and recurring direct deposits to personal accounts at First Capital held by the payroll
      administrator. NACHA operating rules and OCC guidance on commercial account fraud
      both recommend that banks offer payroll positive pay services and anomaly detection
      for commercial payroll ACH originators, neither of which First Capital currently provides.`,
    keywords: ['payroll fraud', 'ghost employee', 'NACHA', 'OCC guidance', 'commercial ACH fraud'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2585',
    name: 'Treasury Management AI Advisory Not Disclosed as SR 11-7 Model to Commercial Clients',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial banking division deploys an AI tool that recommends cash
      management strategies and investment sweep configurations to treasury management clients,
      presenting the recommendations as advisory outputs from a relationship manager support
      tool rather than as model-generated advice subject to SR 11-7 disclosure obligations.
      When the AI recommends that a commercial client reduce fraud control friction in
      online banking configurations to improve cash flow efficiency, and the commercial
      client subsequently experiences a CATO loss, the bank faces liability exposure because
      it did not disclose that the recommendation was model-generated, subject to SR 11-7
      limitations, or that the model's optimization objective did not account for the client's
      fraud exposure profile. OCC guidance on model risk disclosure requires transparency about
      the use of models in client-facing advisory services.`,
    keywords: ['treasury management AI', 'SR 11-7', 'OCC guidance', 'commercial banking', 'model disclosure'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2586',
    name: 'Commercial Card Program Lacks Corporate Liability Fraud Controls for T&E Category',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's commercial card program for corporate clients does not enforce
      merchant category code (MCC) controls or transaction velocity limits at the corporate
      card program level for travel and entertainment categories, allowing individual cardholders
      to exceed company-defined T&E policies and enabling internal fraud through excessive
      personal spending on corporate cards that is difficult for the employer to detect and
      dispute without transaction-level data. NACHA and card network operating rules require
      issuers to provide corporate program administrators with MCC blocking and velocity
      control tools as baseline commercial card fraud prevention features; the bank's
      commercial card platform does not expose these controls to program administrators,
      and the bank's commercial card agreement does not clearly allocate liability for
      losses arising from the absence of MCC controls.`,
    keywords: ['commercial card fraud', 'MCC controls', 'NACHA', 'corporate card', 'T&E fraud'],
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2587',
    name: 'Commercial Lending Fraud Detection Not Integrated With Deposit Account Fraud Signals',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's commercial credit underwriting and monitoring systems operate in
      a separate data environment from its commercial deposit fraud monitoring, so fraud
      signals in a commercial client's deposit accounts — suspicious ACH patterns, high
      return rates, rapid fund movement inconsistent with business activity — are not
      surfaced to the commercial lending team when underwriting revolving credit or
      assessing covenant compliance. Integrated commercial fraud intelligence would allow
      the bank to detect commercial lending fraud schemes where the borrower presents
      clean financials for credit review while simultaneously conducting fraudulent
      payment activity in deposit accounts, a pattern documented in OCC horizontal
      reviews of commercial fraud at regional banks.`,
    keywords: ['commercial lending fraud', 'OCC examination', 'deposit fraud integration', 'commercial credit', 'fraud intelligence'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },

  // ── AI Fraud — Advanced ────────────────────────────────────────────────────
  {
    code: 'B2588',
    name: 'AI Fraud Model Gaming via Adversarial Transaction Sequence Not in Threat Model',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's ML fraud detection system has not been tested against adversarial
      transaction sequencing attacks — where a sophisticated fraud actor iteratively probes
      the model's decision boundary by submitting low-risk transactions interspersed with
      gradually escalating risk transactions to determine the feature thresholds that trigger
      fraud alerts, then constructs high-value fraud transactions that fall just below every
      learned threshold. This type of model gaming exploits the lack of adversarial robustness
      testing in the bank's SR 11-7 validation scope and is documented in financial industry
      AI security research as a credible threat to deployed fraud classifiers. OCC examination
      guidance on model risk management requires that the validation scope of a fraud AI
      include security testing against known attack methodologies, including adversarial
      probing, which the bank's IVU has not conducted.`,
    keywords: ['adversarial ML attack', 'SR 11-7 validation', 'fraud AI robustness', 'OCC examination', 'model gaming'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2589',
    name: 'LLM-Generated Synthetic Fraud Narratives Used in Training Data Without Legal Review',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's fraud model development team uses a large language model to generate
      synthetic SAR narrative text for use as minority-class training examples in a natural
      language processing fraud classifier, without obtaining legal review of whether the
      synthetic narratives constitute simulated SAR filings that could conflict with FinCEN's
      SAR confidentiality rules under 31 U.S.C. § 5318(g)(2) or create bank liability for
      training on synthetic representations of criminal activity patterns. The data science team
      characterized the LLM-generated narratives as non-sensitive training artifacts rather
      than SAR-adjacent content, but the legal and compliance teams were not consulted on the
      characterization. SR 11-7 requires that the model development process include a review
      of whether training data sourcing is appropriate for the model's use case, including
      legal and regulatory constraints on data use.`,
    keywords: ['LLM synthetic training data', 'SR 11-7', 'FinCEN SAR confidentiality', 'fraud NLP model', 'legal review gap'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2590',
    name: 'AI Fraud Scoring Disparate Impact on Protected Classes — ECOA/Reg B Untested',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's ML fraud scoring model for card and ACH transactions has never been
      tested for disparate impact on ECOA-protected classes in the context of transaction
      blocking, despite the CFPB's 2022 circular on adverse action and ECOA supervisory
      expectations that apply to automated decision systems that deny customers access to
      financial services or impose friction. The fraud model uses zip code, merchant category,
      and behavioral velocity features that may serve as proxies for race and national origin
      in geographic markets with significant residential segregation, producing higher false-positive
      blocking rates in minority communities without any documented disparate impact analysis.
      Reg B and the ECOA framework apply to automated decisions affecting account access;
      the bank's fair lending compliance program has explicitly excluded fraud models from
      its disparate impact testing scope without a documented legal or supervisory basis
      for the exclusion.`,
    keywords: ['AI fraud disparate impact', 'ECOA', 'Reg B', 'CFPB', 'SR 11-7 bias testing'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2591',
    name: 'Autonomous Fraud Prevention Blocking Legitimate Transactions Without Reg E Appeal Path',
    officeCategory: 'front_office',
    failureRatePct: 79,
    description:
      `First Capital's automated fraud prevention system blocks transactions flagged by the
      ML fraud classifier without providing the customer with an immediate, synchronous notification
      specifying the reason for the block or an expedited appeal path, leaving customers unable
      to complete urgent transactions without a multi-day manual review process. Reg E 12 CFR
      Part 205 requires that when a bank restricts account access based on a suspected fraud
      determination, the customer must receive notice of the restriction and the right to dispute
      the determination, with provisional access restored within 10 business days in error
      resolution cases. The fully automated block-and-hold workflow the bank has implemented
      for cost efficiency eliminates human review before blocking and delays the Reg E-required
      notice by up to 24 hours, creating a systematic Reg E compliance violation that the
      CFPB has cited at peer banks as an unfair practice.`,
    keywords: ['autonomous fraud blocking', 'Reg E', 'CFPB', 'appeal process', 'account access restriction'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2592',
    name: 'GenAI Fraud Analyst Co-Pilot Creating Audit Documentation Gaps in SAR Record',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's fraud operations team uses a GenAI co-pilot to assist with SAR narrative
      drafting, case summary preparation, and alert disposition documentation, but the co-pilot
      tool does not create a versioned audit log distinguishing analyst-authored content from
      AI-suggested content in the final SAR and case record. When FinCEN or OCC examiners
      request the SAR documentation and investigative record for a specific case, the bank
      cannot demonstrate which elements of the SAR narrative were independently authored
      by a trained BSA officer versus accepted without modification from the GenAI co-pilot.
      FinCEN's SAR filing requirements and OCC examination standards for BSA programs require
      that SARs reflect the independent judgment of trained personnel; a documentation record
      that cannot distinguish AI suggestion from human judgment fails to satisfy this
      auditability standard.`,
    keywords: ['GenAI fraud co-pilot', 'SAR audit documentation', 'FinCEN', 'BSA/AML', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2593',
    name: 'Fraud AI Model Explanation Not Aligned With Reg E Error Resolution Notice Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's ML fraud classifier generates feature importance outputs internally for
      monitoring purposes, but the error resolution notice sent to customers under Reg E
      12 CFR Part 205.11 when a transaction is blocked or a dispute is denied uses generic
      language ("transaction identified as potentially fraudulent by our security system")
      rather than a customer-meaningful explanation derived from the model's decision factors.
      The CFPB's 2022 circular on adverse action and error resolution requires that explanations
      provided to consumers be sufficiently specific to allow the consumer to understand the basis
      for the decision and take corrective action; a generic reference to an undisclosed security
      system does not satisfy this requirement for an AI-generated fraud decision that denies
      the consumer access to their funds.`,
    keywords: ['Reg E error resolution', 'ML explainability', 'CFPB', 'SR 11-7', 'adverse action notice'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2594',
    name: 'Fraud AI Vendor Model Update Deployed Without Regression Testing or OCC Notification',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's primary fraud AI vendor deployed a model version update that changed
      the model's feature weighting and decision boundary, reducing false positives by 18%
      but increasing false negatives by 14% in the vendor's own testing. The vendor characterized
      the update as a routine performance improvement and did not notify the bank that the
      change constituted a material model modification requiring SR 11-7 assessment; the bank's
      TPRM team received the update notification but did not escalate it to the MRM function.
      OCC Bulletin 2023-17 requires that vendor contracts include notification obligations for
      material model changes and that banks maintain oversight processes to evaluate whether
      vendor model changes require re-validation under SR 11-7; the bank's contract and TPRM
      processes do not operationalize this requirement.`,
    keywords: ['fraud AI vendor update', 'SR 11-7', 'OCC Bulletin 2023-17', 'TPRM', 'model re-validation'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2595',
    name: 'Fraud Prediction AI Used for Account Closure Without ECOA-Required Adverse Action',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital uses its ML fraud risk score as a factor in closing or restricting
      customer accounts, but account closures driven primarily by the AI fraud score are not
      issued with ECOA Reg B-compliant adverse action notices identifying the specific reasons
      for the account action. ECOA and Reg B apply to account closure and restriction decisions
      that deny the consumer an existing account relationship; the CFPB's 2022 circular on
      adverse action in AI systems requires that when a covered credit decision is made by
      an AI model, the adverse action notice must specify the model's top contributing factors
      rather than a generic fraud-reason code. First Capital has not updated its account closure
      workflow to generate AI-specific adverse action notices compliant with the CFPB's
      guidance, creating systemic ECOA/Reg B compliance exposure across its retail account
      closure process.`,
    keywords: ['fraud AI account closure', 'ECOA', 'Reg B', 'CFPB adverse action', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2596',
    name: 'LLM Fraud Pattern Intelligence Summarization Hallucinating Regulatory Citations',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's fraud intelligence team uses an LLM to synthesize FinCEN advisories,
      FBI fraud alerts, and FFIEC guidance into fraud typology summaries distributed to branch
      staff and fraud analysts as training materials. The LLM has been observed to generate
      plausible but fabricated regulatory citation numbers and incorrect descriptions of
      specific advisory provisions in its summaries, which then circulate as authoritative
      internal training content without a human review step that verifies citations against
      original sources. When branch staff rely on the LLM-generated summaries for fraud
      detection training and a regulatory examination finds that the bank's fraud training
      content contains factually incorrect regulatory guidance, the bank faces examination
      exposure for operating a BSA compliance training program with inaccurate content —
      an SR 11-7 model governance failure for an LLM deployed in a compliance-relevant use case.`,
    keywords: ['LLM hallucination', 'SR 11-7', 'FinCEN advisory', 'BSA training', 'fraud intelligence'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2597',
    name: 'Agentic AI Fraud Investigation Tool Taking Account Actions Without Human Authorization',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital piloted an agentic AI fraud investigation tool that autonomously retrieves
      transaction records, generates case summaries, and — in a configuration the vendor enabled
      by default — places holds on accounts and submits preliminary SAR drafts to the filing queue
      without analyst review as an efficiency feature. The autonomous account hold and SAR queuing
      actions occurred in 23 live customer accounts during the pilot without documented human
      authorization, creating Reg E account access restriction violations and generating SAR
      drafts that BSA officers did not review before filing system submission. SR 11-7 guidance
      on model governance and FinCEN's SAR filing requirements both require that account-level
      actions and SAR filing decisions reflect human judgment with documented authorization;
      agentic AI tools that take binding actions without explicit human approval in each instance
      are outside the SR 11-7 governance framework the bank has implemented.`,
    keywords: ['agentic AI fraud tool', 'SR 11-7', 'Reg E', 'FinCEN SAR', 'autonomous account actions'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2598',
    name: 'AI Fraud Scoring Model Not Re-Validated After Core Banking Migration Data Mapping Change',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital completed a partial core banking system migration that changed the data
      mapping for several transaction attributes consumed by its ML fraud scoring model —
      specifically, transaction reference codes, merchant identifier fields, and account
      relationship flags — without triggering an SR 11-7 model re-validation to confirm that
      the remapped fields preserve the semantic content that the model was trained on. The
      MRM team was not included in the data migration change control process, and the fraud
      model's performance monitoring metrics did not show an immediate degradation because
      the remapping error affects a low-frequency transaction subpopulation that only appears
      in monthly monitoring reports. OCC consent order remediation requirements explicitly
      include change management integration with MRM as a remediation milestone that the
      bank's core migration planning did not address.`,
    keywords: ['fraud AI data migration', 'SR 11-7', 'core banking migration', 'OCC consent order', 'model re-validation'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2599',
    name: 'Fraud AI Model Performance Benchmarking Not Conducted Against FinCEN Peer Filing Rates',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's SR 11-7 model monitoring program for its fraud AI systems benchmarks
      model performance against internal historical thresholds — precision, recall, and Gini
      coefficient relative to the prior quarter — but does not benchmark against external
      peer metrics such as FinCEN's SAR filing rate percentiles, fraud loss rates from the
      OCC's horizontal examination data, or industry consortium fraud rate benchmarks.
      Without external benchmarking, the MRM function cannot assess whether the fraud AI's
      performance represents acceptable control effectiveness relative to peer institutions,
      and the OCC's consent order remediation milestone requiring the bank to demonstrate
      MRM program adequacy specifically requires that monitoring programs include benchmark
      comparisons against industry-standard performance metrics.`,
    keywords: ['fraud AI benchmarking', 'SR 11-7', 'FinCEN SAR rate', 'OCC consent order', 'model monitoring'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2600',
    name: 'Real-Time AI Fraud Decision Without Human Review Conflicts With Reg E Error Timeline',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's AI fraud prevention system makes real-time blocking decisions on FedNow
      and Zelle transactions in under 200 milliseconds without any human review pathway for
      transactions where the model's confidence score falls in a defined uncertain zone between
      0.55 and 0.75. Transactions blocked in the uncertain zone are held for up to 48 hours
      pending a fraud analyst review queue that is chronically understaffed, creating a situation
      where the effective account restriction period violates the Reg E 10-business-day maximum
      for provisional credit and error resolution in cases where the AI block is ultimately
      determined to be a false positive. The CFPB has issued guidance clarifying that automated
      fraud blocks that are not promptly reviewed by trained personnel must comply with Reg E's
      account access restoration requirements, a requirement the bank's AI-first workflow
      design structurally violates.`,
    keywords: ['AI fraud blocking', 'Reg E', 'CFPB', 'real-time fraud', 'FedNow fraud'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2601',
    name: 'Deepfake Video KYC Bypass in Digital Account Opening — AI Liveness Not Certified',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's digital account opening flow uses video selfie verification as a liveness
      check in its AI-powered identity verification system, but the vendor has not provided
      certified test results demonstrating the system's detection rate against deepfake video
      attacks using commercial face-swap tools available since 2023. A 2024 financial industry
      security research study documented a 90%+ bypass rate against video liveness systems that
      were not specifically hardened against injection attacks that substitute a deepfake video
      stream for the live camera feed. The bank's vendor management review under OCC Bulletin
      2023-17 does not require the vendor to certify liveness detection performance against
      deepfake injection attacks as a contractual SLA, leaving the bank's digital onboarding
      fraud control dependent on a vendor-asserted but unverified capability against the
      current threat environment.`,
    keywords: ['deepfake video KYC', 'OCC Bulletin 2023-17', 'TPRM', 'digital onboarding fraud', 'liveness detection'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2602',
    name: 'AI Fraud Detection Latency SLA Not Contractually Defined for Vendor-Hosted Model',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's fraud AI scoring service is hosted by a third-party vendor under a
      software-as-a-service contract that does not specify a latency SLA for fraud score
      delivery in the context of FedNow real-time payment authorization — a mission-critical
      response time requirement that differs materially from the batch processing context the
      vendor's standard contract contemplates. When the vendor's scoring service experiences
      elevated latency during peak periods, the bank's payment processing orchestration layer
      defaults to an automatic approve-all bypass to protect the FedNow authorization SLA,
      creating a systematic fraud control gap that the bank's TPRM program has not identified
      as a concentration risk. OCC Bulletin 2023-17 requires that vendor contracts include
      performance SLAs appropriate for the criticality of the vendor's function in the bank's
      operational processes.`,
    keywords: ['fraud AI latency SLA', 'OCC Bulletin 2023-17', 'TPRM', 'FedNow SLA', 'vendor contract'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },

  // ── Elder Financial Fraud — Extended ──────────────────────────────────────
  {
    code: 'B2603',
    name: 'Elder Financial Exploitation AI Alert Routing Not Connected to APS Referral Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital has deployed an AI model that identifies elder financial exploitation risk
      scores for accounts held by customers over 65, but the AI alert output routes only to the
      fraud operations queue, with no automated referral pathway to the bank's elder financial
      exploitation program or to the designated APS reporting contact in each state of operation.
      FinCEN's 2022 EFE advisory and CFPB supervisory guidance require that when banks deploy
      AI-based EFE detection, the detection output must be connected to a human-reviewed
      escalation path that can result in an APS report or a mandatory report under applicable
      state law within the required reporting window. The disconnect between the AI alert and
      the APS referral workflow means high-confidence EFE alerts sit in the fraud queue for
      days before a BSA officer reviews them, often past the mandatory reporting window.`,
    keywords: ['elder exploitation AI', 'APS referral', 'FinCEN EFE advisory', 'CFPB', 'mandatory reporting'],
    demoRelevant: true,
    subTopic: 'elder-financial-fraud',
  },
  {
    code: 'B2604',
    name: 'Dementia-Driven Transaction Anomalies Not in Fraud Behavioral Analytics Feature Set',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's fraud behavioral analytics does not include features designed to
      detect transaction patterns associated with cognitive decline exploitation — such as
      repeated duplicate transactions to the same payee within hours, reversal of large
      transfers shortly after initiation suggesting confusion, or sustained engagement with
      gift card purchase requests that exceed the customer's historical spending norms.
      These patterns are distinguishable from third-party fraud in that the customer is
      initiating the transactions, making standard fraud blocking inappropriate, but they
      represent a vulnerability to exploitation that the bank's elder financial protection
      program should flag for proactive outreach. The CFPB's elder financial exploitation
      supervision priority and FinCEN guidance on EFE both recommend that banks identify
      these cognitive-decline exploitation indicators as a distinct detection category
      from standard fraud alert populations.`,
    keywords: ['cognitive decline exploitation', 'CFPB elder exploitation', 'FinCEN EFE', 'behavioral analytics', 'elder fraud'],
    subTopic: 'elder-financial-fraud',
  },

  // ── Check Fraud — Extended ─────────────────────────────────────────────────
  {
    code: 'B2605',
    name: 'Check Fraud Surge Response Plan Not Tested — Incident Response Gap',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital experienced a 2-week coordinated check washing and counterfeit check
      attack campaign targeting commercial deposit accounts across three regional markets,
      but the bank's fraud incident response plan did not include a documented playbook
      for coordinated check fraud surges — specifically, the escalation path to senior
      leadership, the communication protocol to affected commercial clients, and the
      procedures for accelerating enhanced holds and positive pay enrollment during an
      active attack. OCC guidance on operational resilience and the FFIEC business continuity
      management handbook both require that fraud incident response plans be tested at
      least annually, with tabletop exercises specifically covering high-impact fraud surge
      scenarios. The bank's last incident response tabletop exercise did not include a
      check fraud surge scenario.`,
    keywords: ['check fraud incident response', 'FFIEC', 'OCC operational resilience', 'check washing', 'incident playbook'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2606',
    name: 'Remote Deposit Capture Fraud Controls Not Calibrated for Commercial Capture Volumes',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's remote deposit capture (RDC) fraud controls were calibrated for consumer
      RDC usage — small check amounts, low daily volumes — and have not been updated since the
      bank expanded commercial RDC to small business accounts with significantly higher daily
      deposit limits and check amounts. The higher limits create exposure to duplicate presentment
      fraud, where a business deposits the same check via RDC and through a branch ATM or teller,
      and to check kiting via RDC where remote capture availability timing differs from branch
      capture. Reg CC and the bank's RDC risk policy both require that fraud controls be calibrated
      to the risk profile of each RDC customer segment, and the bank's commercial RDC expansion
      has not been accompanied by a corresponding risk assessment and control calibration review.`,
    keywords: ['remote deposit capture', 'Reg CC', 'RDC fraud', 'commercial banking', 'duplicate presentment'],
    subTopic: 'check-fraud',
  },

  // ── Mortgage Fraud — Extended ─────────────────────────────────────────────
  {
    code: 'B2607',
    name: 'HMDA Data Used in Mortgage Fraud Analytics Without Fair Lending Firewall',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's mortgage fraud analytics team has access to HMDA-reported applicant
      demographic data — race, ethnicity, and gender — that was collected for fair lending
      reporting and is used by the fair lending compliance team, but the firewall between
      the fair lending data environment and the fraud analytics environment has not been
      technically implemented. The fraud analytics team can inadvertently introduce HMDA
      demographic features as fraud model inputs through shared data platform access, creating
      a Reg B and ECOA violation risk if protected class data is used — even indirectly — in
      a model that affects mortgage application processing. The CFPB's guidance on data
      governance for fair lending and the OCC's examination procedures for ECOA compliance
      require that institutions maintain strict data governance preventing protected class
      information from flowing into decisioning models outside the defined fair lending
      use case.`,
    keywords: ['HMDA data', 'ECOA', 'Reg B', 'fair lending firewall', 'mortgage fraud AI'],
    demoRelevant: true,
    subTopic: 'mortgage-fraud',
  },

  // ── Commercial Fraud — Extended ───────────────────────────────────────────
  {
    code: 'B2608',
    name: 'AI-Assisted Commercial Credit Fraud Review Missing Human Escalation Gate for Borderline Cases',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial credit underwriting workflow uses an AI fraud screening tool
      to flag applications with elevated fraud risk indicators, but applications that score
      in a moderate-risk range — between the high-risk threshold that triggers mandatory human
      review and the low-risk threshold that clears automatically — proceed through automated
      decisioning without a human escalation gate. Commercial lending fraud schemes frequently
      use documentation that scores in the moderate range precisely because fraudsters have
      calibrated their forgeries to avoid high-risk thresholds while exploiting the automated
      approval path for borderline applications. SR 11-7 governance requirements for AI systems
      used in credit decisioning require that the bank define and document the human review
      process for all risk bands, not just the extremes, and that the escalation criteria
      be reviewed annually for continued adequacy.`,
    keywords: ['commercial credit fraud AI', 'SR 11-7', 'human escalation', 'OCC examination', 'credit fraud'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2609',
    name: 'Vendor Master File Integrity Not Monitored — Commercial Payment Fraud Gap',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's treasury management platform does not perform automated integrity
      monitoring on the vendor master files that commercial clients maintain for ACH payment
      processing — specifically, the bank does not alert commercial clients when a vendor bank
      account number or routing number is changed within the system without a dual-control
      authorization event. Vendor master file manipulation is the primary mechanism in vendor
      impersonation fraud and internal payables fraud schemes; NACHA's 2024 vendor payment
      fraud guidance recommends that banks offering commercial ACH origination services implement
      change alerting on vendor master records as a baseline fraud prevention control. The absence
      of vendor master file integrity monitoring means commercial clients of First Capital have
      no technical safeguard against unauthorized vendor record changes that redirect legitimate
      vendor payments to fraudster-controlled accounts.`,
    keywords: ['vendor master file', 'NACHA', 'commercial ACH fraud', 'vendor impersonation', 'dual-control'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2610',
    name: 'Commercial Fraud AI Alert Threshold Not Segmented by Industry — Cross-Sector False Positive Surge',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial fraud AI uses a single alert threshold across all commercial
      account segments, regardless of industry, which creates excessive false positives for
      industries with inherently high-velocity, high-value payment flows — such as auto dealers,
      distributors, and construction contractors — and insufficient sensitivity for industries
      where even moderate anomalies represent material fraud risk, such as professional services
      firms and non-profit organizations. SR 11-7 model monitoring requirements and OCC
      examination guidance on fraud model performance both require segment-level performance
      review; the bank's model monitoring report does not produce industry-segment-level
      false-positive and false-negative metrics, preventing the MRM team from identifying
      that a single threshold creates material performance disparity across commercial segments.`,
    keywords: ['commercial fraud AI segmentation', 'SR 11-7', 'false positive rate', 'OCC examination', 'fraud threshold'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },

  // ── Cross-Cutting Governance — Extended ───────────────────────────────────
  {
    code: 'B2611',
    name: 'Fraud Control Inventory Not Linked to Consent Order Remediation Milestone Tracking',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital maintains a fraud control inventory as part of its operational risk
      framework but does not map individual fraud controls to the specific MRM consent order
      remediation milestones that the OCC has established, preventing the bank from demonstrating
      to examiners which consent order milestones are satisfied by which implemented controls.
      The consent order requires specific improvements to fraud model validation, monitoring,
      and escalation governance; when examiners conduct a follow-up review and request evidence
      that each milestone has been met, the bank cannot efficiently produce the control-to-milestone
      mapping because it was never created. OCC consent order examination protocols require that
      banks maintain traceability between remediation commitments and implemented controls;
      the absence of this mapping is likely to result in an examiner finding of incomplete
      remediation even where the underlying controls exist.`,
    keywords: ['consent order', 'OCC examination', 'fraud control inventory', 'MRM remediation', 'control traceability'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2612',
    name: 'Fraud Prevention Technology Vendor Concentration Risk Not in TPRM Assessment',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital relies on a single vendor for its primary fraud scoring AI, identity
      verification, device intelligence, and behavioral biometrics — four fraud prevention
      functions that share common infrastructure at the vendor's hosted platform. The bank's
      TPRM assessment evaluates each vendor function individually and does not assess the
      concentration risk created by operational and technical interdependence at the vendor
      platform level: a single vendor availability event could simultaneously disable all four
      fraud prevention capabilities. OCC Bulletin 2023-17 on third-party concentration risk
      and the OCC's operational resilience guidance both require banks to assess vendor
      concentration at the platform and operational dependency level, not just the individual
      service level, for functions critical to fraud prevention.`,
    keywords: ['TPRM concentration risk', 'OCC Bulletin 2023-17', 'fraud vendor', 'operational resilience', 'vendor dependency'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2613',
    name: 'Fraud Loss Forecasting Model Not Integrated With CECL Loss Estimation',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital operates a fraud loss forecasting model separate from its CECL credit
      loss estimation model, with no integration or reconciliation process ensuring that fraud
      loss projections inform the CECL reserve calculation for segments where fraud is a
      material component of actual charge-offs. The CECL model's historical loss data inputs
      include fraud losses but does not separately model the forward-looking fraud loss component,
      which is driven by different leading indicators — fraud rate trends, control effectiveness
      metrics, new product launches — than the credit loss component. SR 11-7 model governance
      and OCC CECL examination guidance both require that the bank's loss estimation framework
      account for all material loss drivers and that model interactions between fraud and credit
      loss estimation be documented and validated.`,
    keywords: ['CECL', 'fraud loss forecasting', 'SR 11-7', 'OCC examination', 'loss estimation model'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2614',
    name: 'FinCEN Secure Portal SAR Submission Delay Due to Manual Preparation Process',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's BSA/AML team prepares SAR submissions using a manual process that
      requires BSA officers to re-enter structured data from the case management system into
      FinCEN's BSA E-Filing system rather than using an automated direct-filing integration,
      creating a data entry burden that contributes to SARs being filed on day 29 or 30 of
      the 30-day filing window as a routine practice. The chronic proximity to the deadline
      means that any additional complexity — a multi-party SAR, a continuing activity SAR
      extension, or a staff absence — causes SARs to be filed late, creating BSA compliance
      violations. FinCEN guidance and OCC examination standards require that BSA programs
      be designed with sufficient capacity and automation to consistently meet the 30-day
      SAR filing deadline, not merely to meet it under ideal conditions.`,
    keywords: ['SAR filing', 'FinCEN E-Filing', 'BSA/AML', 'OCC examination', 'SAR deadline'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2615',
    name: 'Fraud Hotline Customer Experience Rated Poor — Legitimate Transaction Blocking Unresolved',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's fraud hotline for customers whose legitimate transactions have been
      blocked by the fraud AI system averages a 23-minute hold time before customer contact,
      and the hotline agents do not have direct system access to override the fraud block in
      real-time — they must submit an internal ticket for a fraud analyst review that takes 2–4
      hours to process. Customers attempting to complete time-sensitive transactions — mortgage
      closings, wire transfers for business purposes, tuition payments — experience material
      financial harm from the blocked transaction during the resolution delay. Reg E requires
      that when the bank restricts account access in response to a claimed fraud event, the
      bank provide an expedited resolution path that does not leave the customer without access
      to their funds for an extended period; the hotline's inability to provide real-time
      unblocking creates a systematic Reg E compliance and CFPB UDAAP risk.`,
    keywords: ['fraud hotline', 'Reg E', 'CFPB UDAAP', 'legitimate transaction blocking', 'customer dispute resolution'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2616',
    name: 'Fraud Detection System Audit Log Retention Below OCC 7-Year Examination Standard',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's fraud detection system retains alert disposition records, model scores,
      and analyst notes for 3 years before archiving to a cold-storage format that requires
      a 5-business-day retrieval request, effectively making historical fraud investigation
      records inaccessible for routine examination purposes. OCC examination procedures for
      BSA/AML and fraud programs reference a 7-year record retention standard for SAR-related
      investigations and fraud case records; the 3-year active retention window means that
      OCC examiners requesting records from a prior consent order examination period cannot
      access the fraud system records needed to assess remediation adequacy and must rely on
      document management system archives that are not integrated with the fraud case system.`,
    keywords: ['fraud audit log retention', 'OCC examination', 'BSA record retention', 'consent order', 'fraud case records'],
    demoRelevant: true,
    subTopic: 'commercial-fraud',
  },
  {
    code: 'B2617',
    name: 'Fraud Training Curriculum Not Updated for Zelle Operating Rule 2024 Amendments',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's fraud and BSA training curriculum for branch staff, contact center
      agents, and fraud operations analysts was last updated in 2022 and does not include
      the 2024 Zelle operating rule amendments that expanded member institution reimbursement
      obligations for impersonation scam losses, changed the documentation standards for
      APP fraud disputes, or established new real-time warning intervention requirements for
      high-risk Zelle sends. Staff who received only the 2022 curriculum systematically
      provide incorrect guidance to customers about their dispute rights under the 2024 rules
      and fail to escalate high-risk Zelle transactions to the fraud intervention workflow.
      OCC examination guidance and the Zelle operating rules both require member institution
      training programs to be updated within 90 days of material operating rule amendments.`,
    keywords: ['Zelle operating rules 2024', 'OCC training requirements', 'fraud training', 'APP fraud', 'CFPB'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },
  {
    code: 'B2618',
    name: 'AI Fraud Model Fairness Audit Not Conducted Prior to CFPB Examination Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital is scheduled for a CFPB examination cycle that includes a review of
      its automated fraud and account management systems for UDAAP and ECOA compliance, but
      the bank has not conducted a fairness audit of its ML fraud models prior to the examination,
      leaving the CFPB examination team to conduct the first disparate impact analysis on
      the bank's fraud AI during the examination itself. A fairness audit would allow the bank
      to identify and remediate disparate block rate patterns by demographic proxy before the
      examination, and to document that a corrective action was completed — demonstrating good-faith
      compliance management. Without a pre-examination fairness audit, any disparate impact
      findings by the CFPB examiner become examination findings rather than internally discovered
      and remediated issues, significantly increasing the likelihood of a supervisory action.`,
    keywords: ['CFPB examination', 'AI fairness audit', 'ECOA', 'UDAAP', 'SR 11-7 bias testing'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
  {
    code: 'B2619',
    name: 'Fraud AI Model Succession Plan Absent — Single Vendor Dependency With No Exit Timeline',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's primary fraud AI model has been in production for 6 years under a
      single vendor contract, with no documented model succession plan defining the conditions
      under which the bank would transition to a different fraud AI vendor or an in-house model,
      the timeline for such a transition, and the capabilities required of the successor system.
      The vendor's contract renewal automatically extended for a 5-year term without competitive
      evaluation, and the bank has no parallel fraud AI capability that could serve as a fallback
      if the vendor relationship is terminated by either party. OCC Bulletin 2023-17 on third-party
      concentration risk requires that contracts for critical vendor functions include exit
      provisions and that banks maintain a credible exit and transition plan; the fraud AI
      vendor contract has neither a meaningful termination-for-convenience right nor a data
      portability clause that would allow the bank to transition model training data to a
      successor vendor.`,
    keywords: ['fraud AI vendor exit', 'OCC Bulletin 2023-17', 'TPRM', 'SR 11-7', 'vendor succession plan'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
  },
];
