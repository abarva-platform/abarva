// seed-banking-dom08-payments-part3.ts
// Banking genome patterns — Payments & Transaction Processing
// Code range: B2320–B2379  (60 patterns)
// Sub-topics: wire-transfer-ops (10), ach-nacha-compliance (10),
//             digital-wallet-pay (8), ai-payments-part3 (18),
//             payment-fraud-ops (8), correspondent-banking (6)
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

export const BANKING_DOM08_PAYMENTS_PART3_PATTERNS: PatternSeed[] = [

  // ── Wire Transfer Operations ──────────────────────────────────────────────

  {
    code: 'B2320',
    name: 'Fedwire Funds SWIFT MT103 Cut-Off Misalignment Causes Same-Day Settlement Failures',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's wire operations team processes inbound SWIFT MT103 instructions and
      manually re-keys them into the Fedwire Funds Service submission queue without automated
      cut-off time monitoring. The bank's operational cut-off for same-day Fedwire credit is
      4:30 PM ET, but SWIFT's European correspondent messages frequently arrive between 4:15
      and 4:45 PM ET due to time-zone conversion errors in the corporate client's treasury
      workstation; the manual queue lacks an automated rejection and notification workflow,
      so late-arriving wires are queued for next-day processing without notifying the
      originating client, generating Reg J same-day funds availability disputes and corporate
      client escalations.`,
    keywords: ['Fedwire', 'SWIFT MT103', 'Reg J', 'same-day settlement', 'wire cut-off'],
    demoRelevant: true,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2321',
    name: 'Fedwire Offset Account Reconciliation Runs End-of-Day Instead of Intraday',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's wire transfer settlement reconciliation process compares the Fedwire
      Statement of Account against internal GL entries only at end-of-day, rather than
      continuously throughout the wire settlement window as required by BCBS 239 intraday
      data accuracy standards. Unmatched wire entries resulting from routing number typos,
      beneficiary name mismatches, or return reversals accumulate undetected during the day;
      the end-of-day reconciliation identifies the breaks too late for same-day correction,
      resulting in an aged breaks queue that the OCC's transaction operations examination
      team cites as a financial reporting control weakness under 12 CFR Part 30.`,
    keywords: ['Fedwire', 'BCBS 239', 'GL reconciliation', 'intraday settlement', 'OCC'],
    demoRelevant: true,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2322',
    name: 'Repetitive Wire Standing Instructions Not Re-Verified After Beneficiary Account Changes',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's corporate online banking platform allows commercial clients to establish
      repetitive wire standing instructions that are pre-approved and executed without per-transaction
      review once set up. The bank's controls do not trigger a re-verification workflow when a
      beneficiary account number changes on an existing standing instruction, relying instead on
      the client's own approval of the change. When a business email compromise attack manipulates
      a corporate client into changing the beneficiary account on a standing instruction, the
      wire operations system processes subsequent repetitive wires to the fraudulent account
      without any friction; FFIEC authentication guidance requires that high-risk transaction
      changes such as beneficiary substitution trigger out-of-band verification regardless of
      the channel through which the change is submitted.`,
    keywords: ['Fedwire', 'BEC fraud', 'FFIEC', 'standing wire instructions', 'beneficiary verification'],
    demoRelevant: true,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2323',
    name: 'OFAC SDN Screening on Outbound Wires Fails to Check Intermediary Bank Chains',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's OFAC screening engine on outbound Fedwire and SWIFT wire instructions
      screens the named beneficiary and originator fields but does not parse the full instruction
      chain to screen all intermediary and correspondent bank identifiers embedded in the message.
      OFAC's December 2023 compliance framework guidance requires that wire processors screen all
      parties to a transaction, including correspondent institutions routing the payment through
      jurisdictions with active OFAC sanctions programs; First Capital's partial screening approach
      allows wire instructions that route through sanctioned intermediary banks to pass the
      compliance gate, creating a systematic OFAC violation exposure that the bank's model risk
      team has not catalogued in the compliance risk inventory.`,
    keywords: ['OFAC', 'Fedwire', 'SWIFT', 'sanctions screening', 'intermediary bank'],
    demoRelevant: true,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2324',
    name: 'High-Value Wire Callback Authentication Bypassed for Existing Client Relationships',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's wire operations procedure requires a callback verification call for all
      outbound wires exceeding $500,000, but an undocumented operational exception waives the
      callback for established commercial clients with a multi-year relationship and no prior
      fraud history. The waiver is applied at the discretion of individual wire operations
      staff without documented approval authority, and is not captured in the bank's wire
      fraud control exception register. When a BEC-compromised commercial client submits a
      $2.3 million fraudulent wire instruction, the relationship-based callback waiver
      allows the wire to process without verification; the FinCEN 2024 advisory on BEC-driven
      wire fraud losses specifically calls out callback exemptions for known clients as the
      primary enabler of high-value wire fraud at community and regional banks.`,
    keywords: ['Fedwire', 'BEC fraud', 'FinCEN', 'callback authentication', 'wire operations'],
    demoRelevant: true,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2325',
    name: 'Fedwire Funds Return Message Handling Lacks Automated Credit Reinstatement',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      `When First Capital receives a Fedwire Funds Service return message for a previously
      sent wire — typically due to a beneficiary account closed or routing number error — the
      operations team processes the return credit manually by entering it into the core banking
      system as a separate transaction rather than automatically reversing the original debit
      entry. The manual process introduces a same-day or next-day lag before the originating
      client's account is recredited; under Reg J's federal funds transfer provisions, the
      bank must provide same-business-day credit for returned funds, and the processing lag
      constitutes a systematic Reg J violation that the bank's legal department has not
      escalated to compliance.`,
    keywords: ['Fedwire', 'Reg J', 'return message', 'wire operations', 'credit reinstatement'],
    demoRelevant: false,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2326',
    name: 'Drawdown Wire Authorization Controls Not Segregated From Initiation in Treasury Workstation',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's treasury workstation implementation allows the same user role to both
      initiate and authorize drawdown wire requests — pull wire transfers initiated by the
      bank on behalf of a commercial client — without dual-control separation. The OCC's
      internal control guidance and SOX Section 302 equivalents for bank treasury operations
      require that payment initiation and payment authorization be performed by different
      individuals for high-value transactions; the missing segregation of duties is identified
      during First Capital's annual internal audit as a material weakness that exposes the bank
      to insider-initiated unauthorized drawdown transfers on commercial accounts.`,
    keywords: ['Fedwire', 'drawdown wire', 'segregation of duties', 'OCC', 'treasury workstation'],
    demoRelevant: false,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2327',
    name: 'SWIFT MX Migration Breaks Legacy Wire Archive Retrieval for Regulatory Inquiries',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital migrates its SWIFT messaging infrastructure to the ISO 20022 MX message
      format as required by the SWIFT MX migration mandate, but the bank's wire archive
      and retrieval system remains indexed against the legacy MT message field structure.
      When law enforcement or the OCC issues a subpoena or examination request for archived
      wire transaction details, the retrieval system fails to return MX-format messages
      because the search index does not map ISO 20022 field names to the archive query
      parameters; operations staff must manually search the SWIFT messaging platform directly,
      extending response times from hours to days and creating a compliance documentation
      gap that the OCC's BSA examination team characterizes as a records management
      deficiency under 31 CFR Part 1020.`,
    keywords: ['SWIFT', 'ISO 20022', 'MX migration', 'wire archive', 'BSA'],
    demoRelevant: true,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2328',
    name: 'Wire Transfer Limit Override Log Not Reviewed by Compliance Within Required Timeframe',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's wire operations platform logs every instance where a manager overrides
      the system-enforced per-transaction wire limit to process a higher-value transfer, but
      the compliance team's review of the override log is performed monthly rather than within
      the 5-business-day review cycle required by the bank's own wire transfer policy. The
      monthly review cycle means that a pattern of suspicious high-value wire overrides
      coordinated by an insider can accumulate for up to 30 days before detection; the FFIEC
      BSA/AML examination manual cites timely review of exception logs as a key preventive
      control for insider wire fraud and unauthorized disbursements.`,
    keywords: ['Fedwire', 'FFIEC', 'BSA/AML', 'override audit log', 'wire fraud controls'],
    demoRelevant: false,
    subTopic: 'wire-transfer-ops',
  },
  {
    code: 'B2329',
    name: 'Payroll Wire File Upload Validation Does Not Detect Duplicate Batch Submissions',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      `First Capital's commercial online banking portal accepts payroll wire batch files
      uploaded in NACHA CCD+ format and converts them to Fedwire instructions for individual
      employee disbursements. The file upload validation layer checks file format and
      field-level completeness but does not compare incoming file hashes or batch identifiers
      against previously processed submissions within a rolling 24-hour window, allowing
      a duplicate payroll file to be processed in full before the operations team detects
      the repeat. When a corporate client's payroll administrator re-submits a file after
      a system timeout error without confirming the first submission failed, both batches
      process simultaneously, creating overpayment losses and generating Reg J consumer
      credit obligations for the duplicate transfers.`,
    keywords: ['Fedwire', 'payroll wire', 'duplicate detection', 'NACHA', 'Reg J'],
    demoRelevant: false,
    subTopic: 'wire-transfer-ops',
  },

  // ── ACH / NACHA Compliance ────────────────────────────────────────────────

  {
    code: 'B2330',
    name: 'Same-Day ACH Origination Limits Not Enforced at Client Level Per NACHA Rule Update',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `NACHA's 2023 operating rules increase the same-day ACH per-entry dollar limit to
      $1 million, but First Capital's ACH origination platform enforces the legacy $100,000
      limit at the system level without providing a mechanism for the bank to establish
      differentiated per-client limits based on credit underwriting and fraud risk assessment.
      Corporate clients with legitimate need for same-day ACH debits above the old limit
      are unable to use the higher limit, losing competitive ground to peer institutions
      that have implemented risk-stratified client limits; simultaneously, the uniform
      system limit is set by IT rather than risk-based underwriting, creating a governance
      gap that NACHA's ODFI audit process identifies as a rules implementation deficiency.`,
    keywords: ['NACHA', 'same-day ACH', 'ODFI', 'ACH limit', 'origination controls'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2331',
    name: 'ACH Return Rate Threshold Monitoring Not Aligned With NACHA Risk Thresholds by Entry Class',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital monitors aggregate ACH return rates across all entry class codes
      as a single blended metric, rather than separately tracking return rates for WEB,
      TEL, PPD, CCD, and other entry classes as required by NACHA's risk threshold framework.
      NACHA's operating rules establish different return rate risk thresholds by entry class —
      the overall unauthorized return rate threshold is 0.5% but the threshold for WEB
      debits is separately evaluated — and First Capital's blended monitoring obscures
      entry classes that are individually breaching the threshold while appearing compliant
      in aggregate. The NACHA compliance audit identifies the blended monitoring approach
      as a rules violation that requires immediate remediation and may result in an ODFI
      remediation plan under NACHA's risk management framework.`,
    keywords: ['NACHA', 'ACH return rate', 'ODFI', 'WEB entries', 'compliance monitoring'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2332',
    name: 'ACH Originator Due Diligence Program Does Not Include Annual Re-Vetting of Existing Clients',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital performs ACH originator due diligence at onboarding but does not conduct
      annual re-vetting of established originator clients as required by NACHA's ODFI due
      diligence standards and the FFIEC BSA/AML examination manual's third-party originator
      risk framework. When a commercial client whose ACH origination profile was approved
      three years ago pivots to high-velocity WEB debit origination for a new subscription
      product — a transaction type and volume profile not evaluated in the original diligence —
      the bank continues to process the originator's batches without a risk re-assessment,
      accumulating return rate exposure that triggers a NACHA compliance warning before
      First Capital identifies the client's changed business model.`,
    keywords: ['NACHA', 'ODFI', 'originator due diligence', 'FFIEC', 'ACH compliance'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2333',
    name: 'ACH Written Agreement With TPSP Lacks NACHA-Required Data Security Provisions',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital uses a third-party service provider (TPSP) for ACH batch processing and
      file transmission to the Federal Reserve ACH network, but the written agreement with
      the TPSP does not include the data security, audit rights, and NACHA rules flow-down
      provisions required by NACHA operating rules for ODFI-TPSP relationships. NACHA's
      2024 operating rule update requires ODFI written agreements with TPSPs to specifically
      address ACH data security controls aligned with NACHA's data security requirements;
      First Capital's legacy agreement, drafted before the 2024 update, does not contain
      these provisions and has not been amended, creating a contractual compliance gap that
      the NACHA audit identifies as an ODFI rules obligation breach.`,
    keywords: ['NACHA', 'TPSP', 'ODFI', 'data security', 'ACH agreement'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2334',
    name: 'ACH Prenote Validation Bypassed for Expedited Originator Onboarding',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's commercial banking team expedites ACH originator onboarding for
      high-value commercial clients by waiving the standard prenote process — a zero-dollar
      test transaction that verifies account and routing number validity before live entries
      are originated. NACHA operating rules permit but do not require prenotes; however,
      First Capital's own credit risk policy requires prenotes for new originators above
      a defined monthly volume threshold. The waiver is applied without the credit risk
      team's formal approval, and when the expedited originator's first live batch includes
      a significant proportion of closed-account R02 and invalid-routing R03 return codes,
      the return rate exposure is not attributed to the onboarding control failure in
      the bank's ACH risk reporting.`,
    keywords: ['NACHA', 'prenote', 'ACH originator', 'ODFI', 'return codes'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2335',
    name: 'Micro-Deposit Verification for ACH WEB Debit Authorization Lacks Velocity Controls',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's consumer online banking platform uses a micro-deposit verification
      flow to authorize external account ACH WEB debits — the consumer adds an external
      account, the bank sends two small test deposits, and the consumer confirms the amounts.
      The micro-deposit verification system has no rate limit on the number of external
      accounts a single consumer can attempt to verify per day, and no velocity check on
      the number of failed verification attempts before the account is locked. Fraud actors
      exploit the open enrollment to probe stolen account credentials by initiating and
      abandoning micro-deposit verifications, and NACHA's WEB debit rules require ODFIs
      to implement account validation controls that detect and block this probing pattern
      as part of the NACHA account validation rule effective 2021.`,
    keywords: ['NACHA', 'WEB debit', 'micro-deposit', 'account validation', 'ACH fraud'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2336',
    name: 'ACH Debit Reversal Window Procedures Not Communicated to Commercial Clients',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital's ACH originator agreement and online banking help documentation do not
      clearly communicate to commercial clients that NACHA operating rules allow ACH debit
      reversals only within five business days of the settlement date and only for specific
      reversal reason codes — duplicate, incorrect dollar amount, or incorrect account
      information. Commercial clients routinely request ACH reversals outside the five-day
      window or for business reasons not covered by NACHA's permissible reversal codes;
      First Capital's operations team accepts and processes these out-of-scope reversal
      requests as operational accommodations without disclosing that the transactions are
      being handled as manual credits rather than NACHA-compliant reversals, creating a
      systematic Regulation E disclosure gap for consumer-facing ACH returns.`,
    keywords: ['NACHA', 'ACH reversal', 'ODFI', 'Reg E', 'commercial ACH'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2337',
    name: 'Corporate Expense Reimbursement ACH PPD File Contains Mixed Consumer and Corporate Entries',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      `A large commercial client of First Capital originates employee expense reimbursement
      ACH payments using the PPD entry class code for personal accounts but also includes
      payments to corporate vendors in the same batch, which NACHA classifies as CCD entries
      requiring different authorization and return-code handling. The mixed entry class batch
      is accepted and processed by First Capital's ACH origination platform without a file
      validation rule that detects and rejects batches combining PPD consumer credits with
      payments to business accounts. When a vendor recipient initiates an ACH return under
      the wrong entry class return reason code, the return processing engine misroutes the
      return, creating a settlement break that requires manual resolution and an ODFI
      compliance notation.`,
    keywords: ['NACHA', 'PPD', 'CCD', 'ACH entry class', 'ODFI compliance'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2338',
    name: 'ACH RDFI Return Time Extension Request Process Not Documented in Operations Runbook',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital in its role as RDFI (Receiving Depository Financial Institution) occasionally
      receives ACH debit entries that the bank's fraud team believes are unauthorized, but the
      standard NACHA return window of two banking days has elapsed before the fraud determination
      is complete. NACHA operating rules provide a mechanism for RDFIs to request a return time
      extension from the ODFI in cases of late-identified unauthorized transactions, but First
      Capital's ACH operations runbook does not document this process, and the fraud operations
      team is unaware of the extension mechanism, resulting in avoidable unauthorized-debit losses
      on consumer accounts where an extension request would have preserved the bank's return rights.`,
    keywords: ['NACHA', 'RDFI', 'ACH return', 'unauthorized debit', 'Reg E'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2339',
    name: 'ACH CIE Credit Entry Disclosure Requirements Not Met for P2P Transfer Platform',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's peer-to-peer payment feature sends consumer-initiated ACH credits
      using the CIE (Customer Initiated Entry) entry class code, but the consumer-facing
      disclosure at the time of transaction initiation does not include the NACHA-required
      elements for CIE authorization: the recurring or single-entry nature of the transfer,
      the settlement timing, and the consumer's right to revoke authorization. The CFPB's
      examination of First Capital's P2P transfer disclosures finds the CIE authorization
      language insufficient under NACHA rules, which the CFPB treats as a Reg E disclosure
      failure because the ACH network rules form part of the regulatory framework governing
      electronic fund transfer authorization disclosures.`,
    keywords: ['NACHA', 'CIE', 'P2P payments', 'Reg E', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },

  // ── Digital Wallet Payments ───────────────────────────────────────────────

  {
    code: 'B2340',
    name: 'Apple Pay Provisioning Fraud Velocity Controls Not Tuned for Burst Enrollment Attacks',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's Apple Pay card provisioning flow uses a yellow-path (bank-verified)
      activation for new cardholders, requiring the customer to call the bank's automated
      voice response system to confirm the provisioning request. The IVR confirmation system
      does not implement a velocity control that detects when more than three provisioning
      requests are initiated for the same card number within a 24-hour window — a pattern
      that characterizes stolen card credential provisioning to fraud actor devices. When
      an organized fraud ring obtains First Capital card numbers through a data breach and
      initiates burst provisioning attempts across hundreds of cards, the absence of
      velocity controls allows dozens of fraudulent Apple Pay tokens to be issued before
      the bank's fraud operations team identifies the pattern from contactless POS transaction
      alerts the following day.`,
    keywords: ['Apple Pay', 'card tokenization', 'provisioning fraud', 'EMV tokenization', 'digital wallet'],
    demoRelevant: true,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2341',
    name: 'Google Pay Token Lifecycle Management Lacks Automated Suspend-on-Account-Freeze Integration',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's debit card management system triggers an account freeze when fraud
      indicators are detected, but the token lifecycle management integration with Google
      Pay's token requestor infrastructure does not automatically suspend the active
      Google Pay token associated with the frozen account. The technical integration relies
      on a batch process that sends token suspension requests to Google's token requestor
      every four hours, leaving an average two-hour window during which a fraudster in
      possession of the victim's Google Pay-enabled device can continue to make contactless
      payments on a frozen account. The EMV payment tokenization specification requires
      that token lifecycle events — including suspension — be transmitted to the token
      requestor within the token requestor's specified SLA, which for Google Pay is
      under 30 minutes.`,
    keywords: ['Google Pay', 'EMV tokenization', 'token lifecycle', 'account freeze', 'digital wallet'],
    demoRelevant: true,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2342',
    name: 'Digital Wallet Dispute Chargeback Reason Code Mapping Misclassifies Fraud Liability',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's dispute management system maps digital wallet contactless fraud disputes
      to Visa/Mastercard chargeback reason codes that reflect magnetic stripe fraud liability
      rules rather than the EMV chip-and-device authentication liability shift applicable to
      tokenized transactions. Because Apple Pay and Google Pay transactions carry a device-based
      authentication signal that shifts liability to the merchant under the payment network's
      tokenization liability framework, disputes incorrectly coded under legacy fraud reason
      codes result in the bank absorbing losses that should be recharged to the merchant's
      acquirer. The annual loss from misclassified digital wallet chargebacks is estimated at
      $1.2 million annually across First Capital's card portfolio, undetected because the
      chargeback coding review is performed only for disputes above $5,000.`,
    keywords: ['chargeback', 'EMV tokenization', 'Apple Pay', 'Visa', 'dispute management'],
    demoRelevant: true,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2343',
    name: 'Zelle RfP Integration Requires Manual Operations Step to Credit Consumer Accounts',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's Zelle integration routes incoming Zelle credit transfers to a bank-owned
      suspense account and requires an operations analyst to manually post the credit to the
      consumer's checking or savings account, rather than auto-posting the Zelle credit directly
      via the bank's API integration with the Early Warning Services token directory. The manual
      posting step introduces a 30–120 minute delay between the Zelle credit being irrevocably
      settled in the Early Warning Services network and the consumer seeing the funds in their
      account; Zelle's participation agreement requires member banks to make Zelle credits
      available to recipients within the network's SLA, and First Capital's manual posting
      workflow systematically violates that SLA during peak hours.`,
    keywords: ['Zelle', 'Early Warning Services', 'P2P payments', 'digital wallet', 'instant credit'],
    demoRelevant: true,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2344',
    name: 'PayPal and Venmo ACH Pull Limits Not Calibrated to Consumer Account Balance Profiles',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital processes ACH debit pulls initiated by PayPal and Venmo on behalf of
      consumer account holders who have linked their First Capital checking account as a
      funding source, applying a blanket $2,500 per-transaction limit that is not individually
      calibrated to the consumer's balance history, overdraft utilization, or payment
      history with the specific digital wallet provider. Consumers with consistent high-balance
      accounts and clean payment history are unnecessarily declined on legitimate PayPal and
      Venmo transactions above $2,500 — creating friction and competitor attrition — while
      consumers with thin balances and high overdraft utilization are approved up to the same
      limit, generating NSF returns that feed NACHA return rate exposure without differentiated
      risk mitigation.`,
    keywords: ['PayPal', 'Venmo', 'ACH debit', 'NACHA', 'digital wallet'],
    demoRelevant: true,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2345',
    name: 'Consumer CFPB Reg E Rights Not Disclosed for Unauthorized Digital Wallet Transactions',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's consumer mobile banking app displays a simplified dispute submission
      flow for digital wallet transaction disputes that directs the consumer to contact
      the digital wallet provider (Apple, Google, Zelle) as the first step, without informing
      the consumer that Reg E's error resolution rights apply directly to the bank as the
      account-holding institution regardless of the payment channel used. The CFPB's 2024
      supervisory highlights identify this "contact the app provider" deflection as a
      systematic Reg E disclosure failure at institutions where digital wallet disputes
      represent a growing share of consumer complaint volume, and cite it as a UDAP practice
      when it effectively discourages consumers from exercising their right to file a bank-level
      error resolution claim.`,
    keywords: ['Reg E', 'CFPB', 'digital wallet', 'UDAP', 'dispute rights'],
    demoRelevant: true,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2346',
    name: 'Buy Now Pay Later Digital Wallet Integration Lacks Truth-in-Lending Disclosure Trigger',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's debit card program participates in a BNPL (Buy Now Pay Later) integration
      where partner merchants offer BNPL installment terms at checkout via the bank's digital
      wallet infrastructure. The integration flow passes the BNPL selection to the merchant
      processor without First Capital presenting TILA-compliant credit disclosures to the
      consumer at the point of digital wallet selection, on the grounds that the BNPL product
      is underwritten by the BNPL partner rather than the bank. The CFPB's 2024 BNPL
      supervisory guidance clarifies that card issuers who facilitate BNPL through their
      payment credentials share TILA disclosure obligations with the BNPL provider, creating
      an untriggered Reg Z liability in First Capital's digital wallet checkout flow.`,
    keywords: ['BNPL', 'TILA', 'Reg Z', 'CFPB', 'digital wallet'],
    demoRelevant: false,
    subTopic: 'digital-wallet-pay',
  },
  {
    code: 'B2347',
    name: 'Digital Wallet Biometric Authentication Log Not Retained to Meet FFIEC Exam Standards',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      `First Capital's mobile banking platform supports biometric authentication (Face ID,
      fingerprint) for digital wallet payment approval but retains biometric authentication
      log records for only 30 days, which is insufficient for the 12-month log retention
      period required by FFIEC authentication guidance for high-risk transactions. When a
      digital wallet fraud dispute requires the bank to reconstruct the authentication
      event chain to determine whether the customer's device biometric was used for a
      disputed transaction, the 30-day log retention prevents the bank from producing
      authentication records beyond one month, weakening its regulatory examination response
      and internal fraud investigation capability for disputes filed within the 60-day
      Reg E window.`,
    keywords: ['FFIEC', 'biometric authentication', 'digital wallet', 'Reg E', 'mobile banking'],
    demoRelevant: false,
    subTopic: 'digital-wallet-pay',
  },

  // ── AI Payments Part 3 ────────────────────────────────────────────────────

  {
    code: 'B2348',
    name: 'AI Transaction Anomaly Model Flags Disproportionate Share of Minority-Zip ACH Debits',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital deploys a machine learning ACH debit anomaly detection model that flags
      transactions for manual review based on behavioral features including geographic
      payment corridor, account holder demographic proxy variables derived from census tract
      data, and payment velocity patterns. A post-deployment fairness analysis — conducted
      only after the CFPB opens an inquiry — finds that the model generates a 34% higher
      false-positive flag rate for ACH debits originating from census tracts with majority
      Black and Hispanic populations, an outcome that CFPB characterizes as a proxy
      discrimination violation under ECOA and the Fair Housing Act even though
      the model does not use race as an explicit feature.`,
    keywords: ['AI fraud model', 'ECOA', 'CFPB', 'proxy discrimination', 'ACH anomaly detection'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2349',
    name: 'AI-Generated Wire Transfer Confirmation Emails Not Reviewed for Reg E Disclosure Accuracy',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital deploys a generative AI system to draft personalized wire transfer
      confirmation emails sent to consumer senders after a Fedwire or RTP transaction settles.
      The generative AI confirmation template includes a disclaimer that "wire transfers cannot
      be reversed" without the qualifying language required by Reg E's error resolution provisions
      for unauthorized electronic fund transfers; the AI model was fine-tuned on historical
      confirmation templates that pre-date the CFPB's 2023 updated guidance on wire transfer
      disclosures, and the compliance team did not include a Reg E disclosure accuracy gate
      in the AI model review workflow. A CFPB examination finds that the AI-generated
      disclaimers systematically discourage consumers from asserting Reg E rights.`,
    keywords: ['GenAI', 'Reg E', 'CFPB', 'wire transfer disclosure', 'AI compliance review'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2350',
    name: 'AI Payment Rail Routing Optimization Model Creates Disparate RTP Access for Small Business',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's AI payment rail routing model selects Fedwire, RTP, same-day ACH, or
      next-day ACH for outbound payments based on a cost-optimization objective that minimizes
      per-transaction fee expense for the bank. The model systematically routes small business
      disbursements below $10,000 to next-day ACH because it has the lowest unit cost for
      the bank, while routing large commercial disbursements to RTP because the commercial
      banking relationship revenue justifies the RTP network fee. Small business customers
      pay the same treasury fee as commercial clients but receive materially slower settlement,
      a differentially adverse outcome that the bank's UDAP compliance team has not reviewed
      under the OCC's unfair practices standard despite repeated small business complaints
      about disbursement timing.`,
    keywords: ['AI payment routing', 'UDAP', 'OCC', 'RTP', 'small business payments'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2351',
    name: 'AI ACH Originator Risk Scoring Model Not Registered in SR 11-7 Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI model that scores the risk profile of ACH originators
      during the onboarding review and ongoing monitoring process, producing a risk tier
      assignment that determines the originator's transaction limits, monitoring frequency,
      and collateral requirements. The AI originator risk scoring model is built by the
      payments operations team using a commercial AutoML platform and is not registered
      in the bank's model inventory as required by SR 11-7 because it was classified as an
      "operational tool" rather than a model at inception. The OCC's 2025 examination of
      First Capital's ODFI risk management identifies the unregistered AI scoring model as
      a model governance gap under SR 11-7 that requires immediate inventory registration,
      model documentation, and independent validation within 90 days.`,
    keywords: ['SR 11-7', 'AI model governance', 'NACHA', 'ODFI', 'model inventory'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2352',
    name: 'LLM-Powered Payment Dispute Resolution Bot Misapplies NACHA Return Code Eligibility',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an LLM-based virtual agent to handle consumer ACH dispute inquiries,
      configured to determine whether a transaction qualifies for an R10 (Customer Advises Not
      Authorized) return based on the customer's natural-language description of the dispute.
      The LLM makes return code eligibility determinations without access to the bank's
      structured authorization database, and its training data does not include the nuanced
      NACHA rules that distinguish unauthorized debits from stop-payment situations (R08),
      amount disputes (R19), or disputes where the consumer previously authorized the originator.
      The LLM incorrectly advises consumers to dispute authorized debits as unauthorized,
      inflating the bank's R10 return rate to levels that breach NACHA's 0.5% unauthorized
      return threshold and generate an ODFI remediation obligation.`,
    keywords: ['LLM', 'NACHA', 'R10 return', 'ODFI', 'ACH dispute automation'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2353',
    name: 'AI Anti-Money-Laundering Typology Model Misses Structuring Patterns in ACH Batch Files',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI-driven transaction monitoring system for BSA/AML uses a graph neural
      network trained on individual transaction records to detect structuring and layering
      patterns. The model is not trained to analyze ACH batch file-level features — specifically,
      the pattern of submitting multiple PPD or CCD batches with individual entries just below
      the $10,000 CTR threshold across multiple consecutive banking days, a structuring
      technique that FinCEN's 2024 SAR trends report identifies as increasingly common in
      commercial ACH originator portfolios. The AI model's transaction-level granularity
      misses the batch-level structuring signature, generating a BSA/AML blind spot that a
      manual examiner review later identifies as a SAR-filing failure for three commercial
      originators.`,
    keywords: ['AI AML', 'BSA', 'FinCEN', 'structuring', 'ACH batch monitoring'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2354',
    name: 'AI-Powered Real-Time Fraud Scoring for ACH Debits Overrides Human Escalation Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital configures its AI real-time ACH debit fraud scoring model to automatically
      decline transactions that exceed a 0.82 confidence fraud score threshold without routing
      them to a fraud analyst for review, to maintain the sub-250ms response time required for
      same-day ACH processing. The model was validated on a dataset that underrepresents
      the bank's small business ACH originator population, producing a higher false positive
      rate for legitimate small business payroll debits that score near the threshold due
      to transaction velocity patterns that superficially resemble fraud sequences. The
      OCC's 2025 model risk guidance for AI systems in payment decisioning requires that
      automated decline thresholds be validated against population segments most likely to
      be disproportionately affected, a validation step that First Capital's independent
      model review did not perform.`,
    keywords: ['AI fraud scoring', 'SR 11-7', 'OCC', 'ACH decisioning', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2355',
    name: 'GenAI Payment Instruction Parser Hallucinates Beneficiary Account Numbers in Edge Cases',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital pilots a generative AI parser that extracts structured payment fields —
      beneficiary name, account number, routing number, and amount — from unstructured payment
      instruction documents submitted by commercial clients via email or PDF upload. In structured
      testing against a production dataset of 10,000 historical payment instructions, the GenAI
      parser hallucinates — generates plausible but incorrect — beneficiary account numbers in
      0.8% of instructions where the source document contains handwritten annotations or
      partially visible account fields. Although 0.8% seems small, applied to First Capital's
      commercial wire volume of 4,000 monthly instructions, the hallucination rate produces
      an expected 32 misdirected wire instructions per month, each requiring a Fedwire recall
      attempt and potential Reg J liability for same-day credit failure.`,
    keywords: ['GenAI', 'Fedwire', 'Reg J', 'payment instruction parsing', 'AI hallucination'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2356',
    name: 'AI Liquidity Forecasting Model for Instant Payments Does Not Incorporate FedNow Queue Depth',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI-based intraday liquidity forecasting model to predict
      master account balance requirements for FedNow settlement, using historical transaction
      volume, time-of-day patterns, and economic calendar inputs as features. The model does
      not ingest real-time FedNow queue depth data from the Federal Reserve's FedNow service
      API — the running count of pending credit transfers awaiting settlement — which is the
      primary leading indicator of imminent liquidity draw. During a quarterly commercial
      payroll concentration event, the queue depth spike precedes the balance depletion by
      only eight minutes; the AI forecast, which does not see the queue depth signal, fails
      to generate a prefunding alert in time, causing 23 payment deferrals before the
      treasury operations analyst manually prefunds the account.`,
    keywords: ['AI liquidity forecasting', 'FedNow', 'BCBS 248', 'intraday liquidity', 'instant payments'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2357',
    name: 'AI-Assisted SWIFT Message Screening Bypasses Mandatory Human Review for Amber-Rated Hits',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI model to pre-screen SWIFT wire messages for OFAC,
      PEP, and adverse media hits, using a three-tier classification: clear, amber (review
      warranted), and red (block). The bank's operations team configures the workflow to
      auto-release amber-rated messages during overnight hours when compliance staff are
      not available, replacing the mandatory human review with an AI confidence score above
      0.75. OFAC's 2024 compliance framework guidance requires that any transaction with
      a potential sanctions match must receive a human compliance determination before
      release regardless of AI confidence, and the overnight auto-release workflow constitutes
      a systematic OFAC compliance program deficiency that the bank's compliance officer
      is unaware of because the configuration was made by the payments operations team.`,
    keywords: ['AI OFAC screening', 'SWIFT', 'OFAC', 'sanctions compliance', 'AI compliance automation'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2358',
    name: 'AI Payment Behavioral Biometrics Model Penalizes Elderly Customers for Atypical Device Use',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital integrates a third-party behavioral biometrics AI platform that builds
      device interaction profiles — typing cadence, touchscreen pressure, and navigation
      patterns — to authenticate consumers during digital wallet payment initiation.
      The behavioral biometrics model's baseline profiles are calibrated on a training
      population skewed toward 25–45 year-old device users; elderly consumers, who tend
      to interact with touchscreen devices more slowly and with more navigation errors,
      generate behavioral biometrics scores that the AI classifies as suspicious, triggering
      step-up authentication challenges at a rate 2.8 times higher than the general population.
      The CFPB's supervisory focus on AI-based customer authentication flags this age-correlated
      disparity as a potential ECOA pattern when it results in degraded service access for
      protected-class consumers.`,
    keywords: ['behavioral biometrics', 'AI authentication', 'ECOA', 'CFPB', 'digital payments'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2359',
    name: 'AI Model Used for FedNow Instant Credit Decision Not Subject to Adverse Action Notice',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's FedNow receive eligibility system uses an AI credit risk model to
      determine in real time whether an inbound FedNow credit should be held for review
      rather than made immediately available, based on the recipient account's behavioral
      features and the sending institution's risk profile. When the AI model triggers a
      hold on an inbound consumer credit, the bank provides no notification to the account
      holder explaining why the funds are not immediately available, on the grounds that
      FedNow holds are a fraud prevention measure rather than an adverse action. The CFPB's
      2024 guidance on AI decision systems in consumer banking clarifies that AI-triggered
      holds that delay fund availability must include a plain-language explanation of the
      hold reason to comply with Reg CC's hold disclosure requirements.`,
    keywords: ['AI credit decisioning', 'Reg CC', 'CFPB', 'FedNow', 'adverse action'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2360',
    name: 'AI-Driven ACH Originator Monitoring Generates Alert Volume That Overwhelms Compliance Team',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's AI ACH originator monitoring system is configured with alert thresholds
      that were set during vendor implementation without calibration to the bank's originator
      portfolio composition, generating 340 daily alerts across its 2,100 ACH originator
      relationships — a volume that the bank's three-person ACH compliance team cannot
      fully review within a single business day. The alert backlog grows to a four-day
      queue within six weeks of deployment, causing legitimate high-risk originator
      behaviors to be reviewed days after the suspicious transaction window has closed and
      funds have already settled. The FFIEC's BSA/AML examination manual requires that
      alert review processes be resourced to clear queues within defined SLAs, and
      an under-resourced AI alert program is treated as a more serious compliance failure
      than a manually-generated alert backlog due to the false assurance of automation.`,
    keywords: ['AI monitoring', 'NACHA', 'FFIEC', 'BSA/AML', 'ACH compliance alert fatigue'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2361',
    name: 'AI Correspondent Bank Risk Scoring Model Encoded on Outdated FATF Grey-List Data',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital uses an AI model to score the AML risk profile of its correspondent
      banking relationships, incorporating FATF grey-list and black-list status as a
      feature. The AI model's training dataset was fixed at a FATF listing snapshot from
      18 months prior; two correspondent bank jurisdictions have been added to the FATF
      grey list since the training cutoff, but the model's feature pipeline does not
      pull live FATF list updates, causing the AI to score these correspondent relationships
      as lower risk than the current FATF status warrants. The OCC's 2025 examination of
      First Capital's correspondent banking AML program identifies the stale FATF feature
      as a model maintenance failure under SR 11-7's data governance requirements for
      models with regulatory inputs.`,
    keywords: ['AI AML', 'FATF', 'correspondent banking', 'SR 11-7', 'model data governance'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2362',
    name: 'Generative AI Payment Operations Knowledge Base Produces Outdated NACHA Rule Guidance',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital deploys a generative AI knowledge base assistant for its ACH and wire
      operations teams, trained on the bank's internal procedures manuals and indexed NACHA
      operating rule documents as of the implementation date. NACHA updates its operating
      rules annually, and two material rule changes — the 2024 updates to same-day ACH
      credit settlement timelines and the 2025 update to WEB debit account validation
      requirements — are not reflected in the AI knowledge base because the document
      ingestion pipeline has not been re-run since initial deployment. Operations staff
      relying on the AI assistant for rule-specific questions receive answers based on
      superseded NACHA rules, leading to operational procedure errors that NACHA's
      annual ODFI audit identifies as a compliance implementation failure.`,
    keywords: ['GenAI', 'NACHA', 'ODFI', 'knowledge management', 'AI operations tooling'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2363',
    name: 'AI-Based Zelle Fraud Claim Triage Systematically Under-Reimburses Scam Victims',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital uses an AI triage model to classify Zelle dispute claims as fraudulent
      (unauthorized transfer) or non-fraudulent (authorized but regretted transfer) before
      routing them to a human analyst. The AI model is trained on historical dispute dispositions
      in which the bank denied reimbursement for APP scam payments on the grounds that the
      customer authorized the transfer, but the model's training labels predate the CFPB's
      2023 guidance clarifying that Reg E error resolution standards apply to certain APP
      scam scenarios where fraud-induced authorization is present. The AI model continues to
      classify APP scam Zelle claims as non-reimbursable at a rate of 91%, a figure that
      the CFPB's supervisory examination identifies as systematically inconsistent with
      updated Reg E interpretations and characteristic of an AI model perpetuating a
      pre-guidance denial posture.`,
    keywords: ['Zelle', 'APP scam', 'Reg E', 'CFPB', 'AI dispute triage'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2364',
    name: 'AI Payment Pattern Recognition for ISO 20022 Enriched Data Not Covered by SR 11-7 Review',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital deploys an AI model that analyzes the enriched structured data in ISO 20022
      pacs.008 payment messages — including LEI codes, purpose codes, and creditor references —
      to generate commercial client payment behavioral profiles for relationship pricing and
      cross-sell targeting. The AI model processes payment data that includes counterparty
      identifiers and transaction purpose codes that, combined with the bank's account holder
      data, create an enriched profile that goes beyond what the bank's privacy policy discloses
      to commercial clients. The model is classified as a marketing analytics tool by the
      business line and excluded from the SR 11-7 model inventory; the bank's model risk
      management function has not evaluated the regulatory implications of using ISO 20022
      payment enrichment data for commercial profiling under Gramm-Leach-Bliley Section 502.`,
    keywords: ['ISO 20022', 'AI profiling', 'SR 11-7', 'GLBA', 'commercial payments'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },
  {
    code: 'B2365',
    name: 'AI FedNow Prefunding Agent Executes Federal Reserve Account Transfers Without Dual Control',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an AI-driven treasury agent that autonomously initiates prefunding
      transfers from the bank's investment portfolio to its Federal Reserve master account when
      the AI's intraday liquidity forecast predicts a FedNow settlement shortfall. The AI agent
      is authorized to execute Fedwire transfers from investment accounts to the master account
      in amounts up to $50 million without human approval, on the grounds that speed is critical
      for intraday liquidity management. The bank's internal audit finds that the AI agent's
      autonomous transfer execution bypasses the dual-control requirement for Federal Reserve
      account transactions mandated by the bank's own treasury operations policy and FFIEC
      information security guidelines, creating an insider threat exposure and a governance
      gap in the bank's SR 11-7 model risk framework for agentic AI systems.`,
    keywords: ['AI treasury agent', 'FedNow', 'FFIEC', 'SR 11-7', 'dual control payments'],
    demoRelevant: true,
    subTopic: 'ai-payments-part3',
  },

  // ── Payment Fraud Operations ──────────────────────────────────────────────

  {
    code: 'B2366',
    name: 'Check Fraud Positive Pay Exception Decision Window Expires Before Client Reviews Items',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial positive pay service presents check exceptions to the client
      for pay-or-return decisions via a web portal, with a 10:00 AM cutoff for decisions on
      items presented the prior night. Commercial clients with international operations or
      decentralized treasury functions frequently miss the 10:00 AM cutoff because the
      notification email is sent to a single accounts payable contact who is unavailable;
      items where no decision is received default to "pay" under First Capital's positive
      pay settings, which is the industry's riskier default compared to the "return" default
      that fraud-focused banks use. The resulting check fraud losses on defaulted items are
      disputed by commercial clients who argue they were not given adequate opportunity to
      review the exception, generating UCC Article 4 liability disputes.`,
    keywords: ['positive pay', 'check fraud', 'UCC Article 4', 'commercial banking', 'fraud controls'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2367',
    name: 'Synthetic Identity Fraud in ACH New Account Credits Not Detected by Existing KYC Controls',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `Synthetic identity fraudsters open deposit accounts at First Capital using fabricated
      SSNs that pass standard ChexSystems and credit bureau checks because the SSN has no
      derogatory history — it was recently created rather than stolen. After building a
      12-month account history with small ACH credits and debits, the synthetic identity
      holder receives a high-volume ACH batch credit from a co-conspirator originator
      account and immediately initiates outbound transfers before the RDFI hold period.
      First Capital's existing KYC controls focus on document verification at onboarding
      and do not include the behavioral account maturity analysis — mapping ACH credit
      velocity versus account age — that FinCEN's 2024 synthetic identity fraud advisory
      identifies as the primary detection signal for this fraud typology.`,
    keywords: ['synthetic identity fraud', 'FinCEN', 'KYC', 'ACH fraud', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2368',
    name: 'Push Payment Fraud Case Management System Does Not Track APP Scam Typology for SAR Filing',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's fraud case management system tracks dispute outcomes and loss recovery
      for Zelle and FedNow consumer fraud claims, but the case classification taxonomy does not
      include a distinct Authorized Push Payment (APP) scam category. Without APP scam as a
      discrete case type, the bank cannot identify the population of APP scam losses for the
      purpose of SAR filing under FinCEN's 2023 guidance that requires banks to file SARs
      for APP fraud patterns involving transaction amounts above defined thresholds and specific
      fraud typologies. The missing classification results in an estimated 60% of First Capital's
      APP fraud cases going unreported to FinCEN, a BSA/AML reporting gap that the OCC's
      examination team identifies during a targeted review of the bank's instant payment
      fraud reporting.`,
    keywords: ['APP fraud', 'FinCEN SAR', 'BSA/AML', 'FedNow', 'Zelle fraud'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2369',
    name: 'Business Email Compromise Recovery Recall Coordination Process Lacks SLA Tracking',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `When First Capital identifies a business email compromise-driven fraudulent wire transfer
      after settlement, the bank initiates a voluntary recall request through the Fedwire Funds
      Service or SWIFT's gpi return mechanism to attempt recovery. The bank's BEC response
      procedures do not include a time-stamped SLA tracking system for recall requests — critical
      because the probability of recovery drops from approximately 70% within two hours to under
      15% after 24 hours per FinCEN's 2022 fraud recovery analysis. Without SLA tracking, recall
      requests are processed through the same operations queue as routine inquiries, introducing
      multi-hour delays that significantly reduce recovery rates; First Capital's annual BEC
      loss recovery rate of 22% is below the peer median of 38% reported by the American Bankers
      Association's fraud survey, a gap attributable to recall process delays.`,
    keywords: ['BEC fraud', 'Fedwire recall', 'SWIFT gpi', 'FinCEN', 'fraud recovery'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2370',
    name: 'Mule Account Detection Model Generates False Positives That Block Legitimate Gig Workers',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's mule account detection model flags accounts as potential money mule
      conduits based on features including frequency of inbound-then-outbound same-day
      transfer sequences and low ending balance retention after large credits. Gig economy
      workers — rideshare drivers, freelancers, and delivery couriers — who receive daily
      ACH disbursements from gig platforms and immediately transfer funds to cover daily
      expenses generate behavioral profiles that closely match the mule account detection
      features, resulting in legitimate consumer accounts being flagged at a false positive
      rate of approximately 18% within the gig worker account segment. The OCC's 2025
      guidance on AI in fraud management requires that mule detection models be validated
      against the full population of behavioral look-alikes to quantify and mitigate
      false positive disparities affecting economically marginalized consumer segments.`,
    keywords: ['mule account detection', 'AI fraud model', 'OCC', 'gig economy', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2371',
    name: 'Debit Card CNP Fraud Controls Not Tightened After Card-Present Counterfeit Mitigation',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital completes its EMV chip debit card migration, effectively eliminating
      counterfeit card-present fraud, but does not compensate by tightening card-not-present
      (CNP) transaction controls on its debit card program. Industry data from Javelin Strategy
      & Research confirms a predictable fraud migration pattern: as card-present losses decline
      post-EMV, CNP fraud rises proportionally as fraudsters shift to e-commerce and digital
      channels where the chip provides no protection. First Capital's CNP fraud losses increase
      43% in the two years post-EMV migration while card-present losses drop 78%, a net loss
      increase that the bank's fraud strategy team attributes to the market rather than to the
      predictable and foreseeable CNP migration pattern that peer institutions mitigated through
      3-D Secure 2.0 deployment and behavioral analytics upgrades.`,
    keywords: ['EMV', 'CNP fraud', '3-D Secure', 'debit card', 'Reg E'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2372',
    name: 'First-Party ACH Fraud Detection Does Not Distinguish Bust-Out From NSF Patterns',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's first-party ACH fraud detection relies on NSF (non-sufficient funds)
      return rate monitoring as its primary signal, but bust-out fraud — where a fraudster
      builds apparent account legitimacy over months before initiating a large outbound ACH
      just before closing the account — generates an NSF pattern only at the very end of
      the scheme when the final large debit is returned. The bank's detection model is
      calibrated to flag accounts with recurring NSF patterns over a 30-day window, which
      misses the bust-out lifecycle that typically operates in a slow-build phase for
      60–180 days before the final fraud event. TransUnion's 2024 first-party fraud
      report identifies bust-out behavior detection as a distinct model requirement
      separate from NSF monitoring that requires 180-day account behavioral trajectory
      features rather than 30-day return rate snapshots.`,
    keywords: ['first-party fraud', 'ACH fraud', 'bust-out detection', 'NACHA', 'BSA/AML'],
    demoRelevant: false,
    subTopic: 'payment-fraud-ops',
  },
  {
    code: 'B2373',
    name: 'Elder Financial Exploitation Wire Transfer Red Flags Not Captured in Teller System',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's teller system and wire initiation workflow do not include structured
      prompts for branch staff to document elder financial exploitation (EFE) red flags
      identified during wire transfer initiation — such as customer confusion about
      transaction purpose, presence of an unknown companion, or a stated wire purpose
      consistent with known grandparent scam or IRS impersonation typologies. Without
      structured EFE documentation prompts, branch staff observations are not captured
      in the transaction record, and potentially exploited transactions are not escalated
      to the bank's financial crimes team for review before settlement. FinCEN's 2022
      EFE advisory and the bank's own BSA/AML program require that documented EFE
      indicators trigger a mandatory supervisory review before wire release for
      vulnerable adult customers.`,
    keywords: ['elder financial exploitation', 'FinCEN', 'wire transfer', 'BSA/AML', 'Fedwire'],
    demoRelevant: true,
    subTopic: 'payment-fraud-ops',
  },

  // ── Correspondent Banking ─────────────────────────────────────────────────

  {
    code: 'B2374',
    name: 'SWIFT gpi Universal Confirmation Compliance Not Achieved for All Outbound Corridors',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `SWIFT's 2024 universal confirmation mandate requires all gpi member banks to send a
      SWIFT gCON (confirmation) message for every cross-border payment they receive and
      confirm, covering the full correspondent chain. First Capital sends gCON confirmations
      for payments routed through its primary SWIFT correspondent but does not generate
      confirmations for payments processed through its secondary sub-custodian arrangements
      in three currency corridors, because the sub-custodian's SWIFT connectivity does not
      support the gpi tracker API. SWIFT's gpi compliance review identifies the three
      non-confirmed corridors as a universal confirmation program gap; SWIFT's escalation
      path for persistent non-compliance is suspension from the gpi service, which would
      remove First Capital from the SWIFT gpi SLA commitment to its corporate clients.`,
    keywords: ['SWIFT gpi', 'gCON', 'correspondent banking', 'cross-border payments', 'ISO 20022'],
    demoRelevant: true,
    subTopic: 'correspondent-banking',
  },
  {
    code: 'B2375',
    name: 'Nostro Account Reconciliation in Correspondent Network Settled Weekly Instead of Daily',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital maintains nostro accounts at seven correspondent banks for cross-border
      payment settlement but reconciles these accounts weekly rather than daily, arguing that
      the low transaction volume in several corridors does not justify daily reconciliation
      resources. The weekly reconciliation cadence means that failed or delayed correspondent
      credits — which generate nostro breaks — accumulate for up to five business days before
      detection, during which First Capital's internal position reflects settled transactions
      that have not actually funded in the nostro account. BCBS 239 requires that banks with
      cross-currency nostro exposure reconcile daily to support accurate intraday liquidity
      risk reporting; First Capital's weekly cadence is cited by the OCC as a liquidity
      risk data governance deficiency in the bank's annual examination.`,
    keywords: ['nostro reconciliation', 'correspondent banking', 'BCBS 239', 'OCC', 'cross-border payments'],
    demoRelevant: true,
    subTopic: 'correspondent-banking',
  },
  {
    code: 'B2376',
    name: 'Correspondent Bank FATF High-Risk Jurisdiction Review Not Triggered by FATF List Updates',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's TPRM policy requires enhanced due diligence review of correspondent
      banks operating in FATF-designated high-risk jurisdictions, but the trigger for initiating
      a FATF-related correspondent review is the annual AML program review rather than the
      event-driven FATF list update. When FATF adds or removes a jurisdiction from its
      high-risk list — which occurs three times annually — First Capital's correspondent
      bank risk assessments for affected jurisdictions are not updated until the next annual
      cycle, creating a gap of up to 12 months during which the bank's AML risk posture
      for the affected correspondent relationships does not reflect the current FATF
      designation. The OCC's BSA/AML examination identifies the annual-only FATF review
      trigger as a risk management deficiency requiring an event-driven review protocol.`,
    keywords: ['FATF', 'correspondent banking', 'OCC', 'BSA/AML', 'TPRM'],
    demoRelevant: true,
    subTopic: 'correspondent-banking',
  },
  {
    code: 'B2377',
    name: 'Cross-Border Wire FX Markup Disclosure Not Provided at Point of Initiation Under CFPB Remittance Rule',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital offers cross-border wire transfer services to consumer clients with an
      FX markup embedded in the exchange rate applied at settlement, generating revenue on
      the currency conversion without disclosing the markup amount in the pre-transfer
      disclosure. The CFPB's Remittance Transfer Rule (Reg E Subpart B) requires that
      disclosures for consumer international wire transfers include the exchange rate applied
      and any FX fees or spreads charged by the bank; First Capital's wire initiation flow
      discloses a "competitive exchange rate" without quantifying the spread, which the CFPB's
      2024 Remittance Transfer Rule examination sweep identifies as a systematic disclosure
      failure affecting an estimated 4,200 annual cross-border consumer wire transactions
      at First Capital.`,
    keywords: ['Reg E', 'CFPB Remittance Rule', 'FX disclosure', 'cross-border wire', 'correspondent banking'],
    demoRelevant: true,
    subTopic: 'correspondent-banking',
  },
  {
    code: 'B2378',
    name: 'De-Risking Exit of Emerging Market Correspondent Relationships Creates Sanctions Gap',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital exits three correspondent banking relationships in emerging market
      jurisdictions as part of an AML de-risking initiative, but does not implement an
      orderly wind-down that ensures in-flight cross-border transactions for existing commercial
      clients are completed before the nostro accounts are closed. Several commercial clients
      have standing cross-border vendor payment instructions routed through the exited
      correspondents; after the exit, these instructions fail silently at the first hop with
      no automated notification to the client or to First Capital's operations team.
      The failed transactions sit in a suspended state in the correspondent network while the
      commercial client's vendors go unpaid; the OCC's 2023 guidance on correspondent banking
      de-risking requires that client impact assessments and communication plans precede
      any correspondent relationship exit.`,
    keywords: ['correspondent banking', 'de-risking', 'OCC', 'SWIFT', 'cross-border payments'],
    demoRelevant: false,
    subTopic: 'correspondent-banking',
  },
  {
    code: 'B2379',
    name: 'CBPR+ ISO 20022 Correspondent Data Truncation Introduces AML Screening Gaps',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's SWIFT CBPR+ (Cross-Border Payments and Reporting Plus) ISO 20022
      implementation receives enriched pacs.008 messages from sending banks with structured
      originator and beneficiary LEI codes, legal entity names, and address data. The bank's
      SWIFT-to-core translation layer truncates enriched structured fields to the legacy MT103
      field lengths when persisting transaction data in the core banking system — discarding
      LEI codes and structured legal entity identifiers that OFAC's Specially Designated
      Nationals screening engine requires to resolve ambiguous name matches. The truncation
      means that enriched CBPR+ data — which is specifically designed to improve sanctions
      screening precision under the SWIFT MX migration mandate — is destroyed before reaching
      the screening engine, and First Capital's AML screening operates as if it had received
      an MT103 message rather than the richer MX format.`,
    keywords: ['SWIFT CBPR+', 'ISO 20022', 'OFAC screening', 'AML', 'correspondent banking'],
    demoRelevant: true,
    subTopic: 'correspondent-banking',
  },

];
