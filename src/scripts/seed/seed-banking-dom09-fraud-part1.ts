// seed-banking-dom09-fraud-part1.ts
// Banking genome patterns — Fraud Detection & Prevention
// Code range: B2500–B2559  (60 patterns)
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

export const BANKING_FRAUD_PART1_PATTERNS: PatternSeed[] = [

  // ── Transaction Fraud ──────────────────────────────────────────────────────
  {
    code: 'B2500',
    name: 'Card-Not-Present ML Model Recalibration Lag After Merchant Mix Shift',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's card-not-present fraud ML classifier is recalibrated annually, but the bank's
      retail payment merchant mix shifted materially when FedNow-linked merchant onboarding accelerated
      in 2024, introducing transaction patterns the training data does not represent. The model's
      precision-recall curve degrades on e-commerce and gig-economy CNP segments without triggering
      any SR 11-7 model monitoring alert, because threshold bands were calibrated against the prior
      merchant mix distribution. Chargeback volumes in the new merchant segments run 2.3× the model's
      predicted false-negative rate before the first quarterly monitoring review surfaces the gap,
      producing Reg E 12 CFR Part 205.6 provisional credit liability that exceeds the fraud budget.`,
    keywords: ['card-not-present fraud', 'ML classifier', 'SR 11-7', 'Reg E', 'model monitoring'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2501',
    name: 'BIN Attack Detection Gap in Real-Time Authorization Path',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's fraud detection rules engine does not have a dedicated BIN attack detection
      module — distributed low-value enumeration attempts across a stolen BIN range are filtered
      individually below the velocity threshold and never aggregated into a cross-account pattern
      alert. NACHA's 2023 operating rules updates and network-level guidance from Visa/Mastercard
      require issuers to implement BIN-range velocity monitoring as a baseline control; the bank's
      failure to aggregate enumeration signals allows a BIN attack to compromise 1,200 card accounts
      over 72 hours before the fraud operations team identifies the pattern through chargeback
      clustering.`,
    keywords: ['BIN attack', 'velocity rules', 'NACHA', 'card fraud', 'enumeration detection'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2502',
    name: 'Velocity Rule Staleness After FedNow Instant Payment Launch',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital launched FedNow receive capability in 2023 but did not update its fraud
      velocity rules to account for the new payment rail's irrevocability and settlement immediacy.
      Legacy velocity rules were designed for ACH's two-day settlement window, which allowed a
      reversal period; FedNow transactions are final within seconds, so velocity limits calibrated
      for ACH risk tolerance systematically under-block high-risk instant payment sequences. OCC
      guidance on instant payment fraud risk and FinCEN's 2024 alert on mule account exploitation
      of real-time rails both flag velocity rule alignment as a supervisory expectation, which
      First Capital has not operationalized.`,
    keywords: ['FedNow', 'velocity rules', 'instant payments', 'FinCEN', 'real-time fraud'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2503',
    name: 'Cross-Channel Transaction Aggregation Absent — Fraud Splits Across Debit and ACH',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's fraud detection operates in separate silos for debit card, ACH, and Zelle
      transactions, with no cross-channel aggregation layer to detect a single fraudster splitting
      activity below thresholds on each rail simultaneously. A coordinated account takeover
      campaign exploits this gap by initiating a $490 Zelle push, a $490 ACH pull, and a $480 debit
      POS transaction against the same victim account in a 20-minute window — each transaction
      individually passes fraud scoring, but the combined $1,460 drain in one session would have
      triggered the customer's daily limit. Zelle operating rules published by Early Warning Services
      and NACHA ACH operating rules both contemplate cross-rail monitoring as a best-practice
      control that the bank has not implemented.`,
    keywords: ['cross-channel fraud', 'Zelle operating rules', 'NACHA', 'ACH fraud', 'account takeover'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2504',
    name: 'Fraud ML Model Deployed Without SR 11-7 Validation — Card Transaction Classifier',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's digital banking team deploys an updated ML fraud classifier for card
      transactions as a system configuration change rather than a model change, bypassing the SR
      11-7 model validation cycle on the basis that the underlying algorithm architecture is
      unchanged. The reconfiguration materially shifts the model's decision boundary — false-positive
      rates drop 15% and false-negative rates rise 22% — but no independent validation unit review
      was conducted. OCC examiners reviewing the bank's MRM consent order remediation plan find the
      deployment as a consent order breach, because SR 11-7 requires validation of material model
      changes regardless of how the change is classified by the deploying team.`,
    keywords: ['SR 11-7', 'fraud ML model', 'model validation', 'consent order', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2505',
    name: 'Debit Interchange Fraud Loss Misallocated — Reg E Provisional Credit Not Recovered',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's fraud loss accounting framework allocates debit card fraud losses to the
      fraud operations cost center, but provisional credits issued under Reg E 12 CFR Part 205.11
      are booked in a separate liability account that is not systematically reconciled against
      chargeback recoveries. When a customer files an unauthorized transaction dispute, the bank
      issues provisional credit within the 10-business-day statutory window but frequently fails
      to initiate the network chargeback within the Visa/Mastercard dispute resolution timeframe,
      forfeiting interchange-funded recovery rights and leaving the provisional credit as a
      permanent loss — a recoverable amount that accumulates to material levels across the retail
      debit portfolio without triggering any financial control alert.`,
    keywords: ['Reg E', 'provisional credit', 'chargeback', 'debit fraud', 'Visa dispute rules'],
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2506',
    name: 'Real-Time Fraud Score Not Surfaced at Zelle Authorization Point',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's real-time fraud scoring engine produces a transaction risk score within 120
      milliseconds, but the Zelle integration layer at the mobile banking API does not pass the fraud
      score to the authorization decision engine — the score is written to a fraud operations log
      for post-hoc review only. Zelle operating rules require member financial institutions to
      implement real-time risk scoring in the authorization path for consumer-initiated Zelle sends;
      the bank's architecture decouples scoring from blocking, meaning high-risk transactions are
      logged and flagged after the payment is irrevocably settled, producing liability that the Zelle
      operating rules assign to the sending institution when the bank lacks documented pre-authorization
      controls.`,
    keywords: ['Zelle operating rules', 'real-time fraud scoring', 'authorization path', 'APP fraud', 'instant payments'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },

  // ── Identity Fraud ─────────────────────────────────────────────────────────
  {
    code: 'B2507',
    name: 'Synthetic Identity Detection Failure in Digital Account Opening',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's digital account opening flow uses a traditional identity verification
      approach — SSN validation against credit bureau thin-file records and document verification
      — that is structurally unable to detect synthetic identities that have been credit-seasoned
      over 18–24 months with multiple tradelines. The Federal Reserve's 2019 synthetic identity
      fraud white paper and subsequent OCC supervisory guidance both identify the credit-seasoning
      loop as the primary mechanism by which SID passes standard verification, requiring additional
      controls such as velocity checks on SSN issuance dates, address consistency scoring, and
      behavioral biometrics that the bank has not implemented. SID charge-off losses are
      systematically mis-categorized as credit losses rather than fraud losses, understating the
      bank's fraud exposure in regulatory reporting.`,
    keywords: ['synthetic identity fraud', 'SID detection', 'OCC guidance', 'digital account opening', 'credit seasoning'],
    demoRelevant: true,
    subTopic: 'identity-fraud',
  },
  {
    code: 'B2508',
    name: 'Device Fingerprint Evasion via VPN and Emulator Not Detected',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's device intelligence layer relies on device fingerprint matching to flag
      account access from new or suspicious devices, but the fingerprint signals are derived from
      browser-level attributes that are trivially spoofed by commercial mobile device emulators
      and residential proxy VPN services used in account takeover campaigns. The bank has not
      implemented network-level signals such as residential proxy detection, geolocation velocity
      anomaly, or behavioral biometric divergence that are resistant to device spoofing and are
      referenced in FFIEC Authentication Guidance (2011, updated 2021 supplement) as layered
      authentication controls required when device fingerprinting alone is the primary non-password
      factor.`,
    keywords: ['device fingerprinting', 'FFIEC authentication guidance', 'account takeover', 'VPN detection', 'behavioral biometrics'],
    subTopic: 'identity-fraud',
  },
  {
    code: 'B2509',
    name: 'Account Takeover Challenge Inadequate — Static KBA Bypassed at Scale',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's account recovery and high-risk transaction challenge flow uses static
      knowledge-based authentication questions — mother's maiden name, prior address, first car —
      that are widely available in data breach compilations accessible through criminal marketplaces.
      FFIEC 2021 authentication supplement guidance explicitly deprecates static KBA as a sufficient
      second factor and requires financial institutions to use dynamic, out-of-wallet challenge
      methods or phishing-resistant MFA for step-up authentication; the bank's continued reliance
      on static KBA leaves it exposed to credential-stuffing campaigns that convert purchased breach
      data into successful account takeovers at scale, generating Reg E unauthorized transaction
      liability.`,
    keywords: ['account takeover', 'KBA', 'FFIEC authentication guidance', 'Reg E', 'MFA'],
    demoRelevant: true,
    subTopic: 'identity-fraud',
  },
  {
    code: 'B2510',
    name: 'ML Identity Fraud Model Trained on Pre-FedNow Synthetic Identity Population',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's ML synthetic identity detection model was trained on account opening and
      early delinquency data from 2019–2022, before the bank enabled FedNow and Zelle real-time
      payment capabilities. The post-activation SID bust-out pattern exploits real-time rails to
      drain credit limits within hours of credit line graduation, a behavioral sequence absent from
      the training data; the model's feature set was not updated to include payment rail velocity
      indicators, so the new bust-out pattern scores below the alert threshold. SR 11-7 model
      monitoring requirements and FinCEN's 2024 alert on SID exploitation of instant payments
      both require the bank to assess whether model training populations remain representative of
      current fraud typologies.`,
    keywords: ['synthetic identity fraud', 'ML fraud model', 'SR 11-7', 'FinCEN', 'FedNow'],
    demoRelevant: true,
    subTopic: 'identity-fraud',
  },
  {
    code: 'B2511',
    name: 'New Account Fraud Early Indicator Features Absent From Origination Scorecard',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's consumer credit origination scorecard does not include new-account fraud
      early indicators — such as SSN velocity (number of inquiries in 90 days), email age, phone
      porting recency, or device-to-bureau address mismatch — that are standard features in
      purpose-built identity fraud models. The origination scorecard was designed for credit risk
      and is validated under SR 11-7 for credit purposes, but fraud risk at origination is not
      within the validation scope, meaning synthetic and assumed-identity applications that pass
      the credit scorecard accumulate as fraud losses attributed to credit risk without triggering
      any fraud model refinement cycle.`,
    keywords: ['origination fraud', 'SSN velocity', 'SR 11-7', 'synthetic identity', 'identity verification'],
    subTopic: 'identity-fraud',
  },
  {
    code: 'B2512',
    name: 'Deep-Fake Voice Authentication Bypass in Telephone Banking Channel',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      `First Capital's telephone banking channel uses a voice biometric authentication system
      that was trained and certified on natural human voice recordings; the system's liveness
      detection layer was not designed to detect real-time deep-fake voice synthesis tools
      commercially available since 2023. A fraud actor using a deep-fake voice cloning service
      can authenticate as the target customer with greater than 90% acceptance rate against the
      bank's voice biometric system, bypassing the authentication step without triggering any
      anomaly flag. OCC guidance on emerging authentication risks and FFIEC 2021 authentication
      supplement both require institutions to assess new technology threats to authentication
      controls; the bank has not conducted a deep-fake risk assessment or updated vendor contracts
      to require liveness detection certification as a contractual SLA.`,
    keywords: ['deep-fake voice', 'voice biometrics', 'FFIEC authentication guidance', 'liveness detection', 'account takeover'],
    demoRelevant: true,
    subTopic: 'identity-fraud',
  },

  // ── APP Fraud (Authorised Push Payment) ───────────────────────────────────
  {
    code: 'B2513',
    name: 'Zelle APP Fraud Liability Unresolved After CFPB Supervisory Focus',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital has not established a formal policy defining the conditions under which it
      will voluntarily reimburse customers who authorized a Zelle payment under social engineering
      — a liability question that became acute after the CFPB's 2022–2023 supervisory focus on
      bank Zelle dispute handling and the subsequent 2024 Zelle operating rule amendments that
      shift reimbursement obligations for impersonation scams to the receiving institution. The
      bank processes hundreds of consumer Zelle APP fraud complaints per month using a case-by-case
      discretionary review that has no documented criteria, creating inconsistent customer outcomes
      and a UDAAP examination exposure that the CFPB has explicitly cited as an unfair practice
      when banks systematically deny reimbursement for scam-induced authorized transfers.`,
    keywords: ['Zelle APP fraud', 'CFPB', 'UDAAP', 'authorized push payment', 'scam reimbursement'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },
  {
    code: 'B2514',
    name: 'Social Engineering Detection Limits — Warm Transfer to Fraud Not Offered',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's contact center does not have a warm-transfer protocol to a fraud
      specialist when a customer service representative identifies indicators of social engineering
      — such as a customer expressing urgency about moving funds to a "safe account" or referencing
      an impersonator claiming to be from the bank's fraud team. Without a warm-transfer protocol,
      the CSR lacks authority to intervene in a customer-authorized Zelle or wire transfer even
      when social engineering indicators are present; the interaction ends, the customer completes
      the transfer via digital banking, and the bank faces Zelle operating rule reimbursement
      liability and CFPB scrutiny of its fraud prevention procedures for social engineering scams.`,
    keywords: ['social engineering', 'CFPB', 'Zelle operating rules', 'contact center', 'warm transfer protocol'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },
  {
    code: 'B2515',
    name: 'Mule Account Network Identification Absent From AML-Fraud Integration',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AML transaction monitoring system and fraud detection platform operate
      on separate data warehouses with no integration layer to share mule account signals. Accounts
      flagged by AML as potential money mules are not surfaced in the fraud system as high-risk
      receiving endpoints for Zelle and ACH transfers, meaning APP fraud proceeds flow through
      mule accounts that are known to compliance but transparent to the fraud authorization layer.
      FinCEN's 2024 alert on mule account networks and Zelle operating rule amendments both
      require member institutions to implement cross-functional mule detection that bridges fraud
      and AML systems — a technical integration gap that First Capital has not addressed in its
      FedNow/Zelle fraud control roadmap.`,
    keywords: ['mule accounts', 'AML-fraud integration', 'FinCEN', 'Zelle operating rules', 'APP fraud'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },
  {
    code: 'B2516',
    name: 'AI-Powered Fraud Analyst Chatbot Gives Incorrect Dispute Guidance Under Reg E',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital deploys an LLM-based fraud analyst chatbot to handle initial customer
      dispute intake for debit card and Zelle transactions, reducing contact center volume. The
      LLM is not grounded against current Reg E 12 CFR Part 205 dispute timelines and provisional
      credit rules, and gives inconsistent guidance to customers about the 10-business-day
      investigation window and their right to provisional credit, in some cases advising customers
      that authorized Zelle transfers are ineligible for dispute without surfacing the social
      engineering exception. Without SR 11-7 model governance and a documented scope review, the
      chatbot creates regulatory examination risk because incorrect Reg E dispute guidance
      delivered at scale constitutes a potential UDAP violation that the CFPB could characterize
      as a systematic consumer harm.`,
    keywords: ['LLM fraud analyst', 'Reg E', 'SR 11-7', 'CFPB', 'dispute guidance'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },
  {
    code: 'B2517',
    name: 'Real-Time Warning Intervention Not Implemented for High-Risk Zelle Sends',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital does not display real-time scam warning prompts in the mobile banking
      Zelle send flow for transactions exhibiting high APP fraud risk signals — such as first-time
      recipient, large amount, and preceding contact center call flagged for social engineering
      indicators. Zelle operating rule amendments effective 2024 require participating financial
      institutions to implement friction-based intervention workflows for high-risk APP fraud
      scenarios; the bank's mobile app passes the Zelle transaction through without a warning
      prompt, confirmation delay, or fraud specialist escalation path, making it structurally
      non-compliant with the updated operating rule and exposing the bank to reimbursement
      liability under the impersonation scam provision.`,
    keywords: ['Zelle operating rules', 'APP fraud intervention', 'mobile banking', 'social engineering', 'impersonation scam'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },

  // ── Wire Fraud ─────────────────────────────────────────────────────────────
  {
    code: 'B2518',
    name: 'Commercial Wire Callback Procedure Gap for BEC-Initiated Wire Changes',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital's commercial wire operations team requires a callback to a pre-registered
      customer phone number only for new beneficiaries exceeding $100,000, but the callback
      protocol is not applied to wire instructions that change the beneficiary account number on
      an existing recurring wire relationship — the exact scenario exploited in business email
      compromise schemes where a fraudster intercepts corporate email and redirects a standing
      wire to a mule account. OCC guidance on wire fraud and the FBI's 2023 BEC advisory both
      identify beneficiary account number changes on established wires as the highest-risk scenario
      requiring out-of-band verification; the bank's threshold-based callback policy creates a
      systematic gap in BEC defense for the commercial banking segment.`,
    keywords: ['BEC fraud', 'wire callback', 'OCC guidance', 'commercial wire', 'Fedwire'],
    demoRelevant: true,
    subTopic: 'wire-fraud',
  },
  {
    code: 'B2519',
    name: 'Fedwire STP Processing Without Dual-Control for Large Commercial Wires',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's treasury management system processes Fedwire transactions above $500,000
      through a straight-through processing path with no mandatory dual-control review step for
      corporate clients who have opted for STP to reduce processing time. The STP configuration
      was approved as a customer service enhancement without a risk assessment documenting the
      reduction in fraud controls for large-value payments. OCC guidance on payment fraud risk
      management and Fedwire operating rules both contemplate dual-authorization as a baseline
      control for high-value wire transfers; when a BEC-induced $1.8M wire is processed STP and
      settled within two hours, the bank's ability to recall the payment via Fedwire Funds Service
      reversal procedures is limited to a goodwill request to the receiving bank.`,
    keywords: ['Fedwire', 'dual-control', 'BEC fraud', 'STP processing', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'wire-fraud',
  },
  {
    code: 'B2520',
    name: 'BEC Detection Model Has No Corporate Email Compromise Signal Input',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's commercial wire fraud scoring model uses internal transaction history
      features — beneficiary recurrence, amount deviation, time-of-day — but does not consume
      any external threat intelligence signals such as newly registered domains mimicking client
      email domains, corporate email spoofing patterns, or vendor compromise alerts that are
      available through commercial threat intelligence feeds and the FS-ISAC sharing network.
      Without email-domain threat intelligence as an input feature, the fraud model cannot
      distinguish a legitimate change-of-beneficiary request from a BEC-initiated redirect even
      when the requesting email domain is a one-day-old lookalike domain — the single strongest
      BEC signal available.`,
    keywords: ['BEC fraud', 'FS-ISAC', 'wire fraud model', 'threat intelligence', 'commercial wire'],
    demoRelevant: true,
    subTopic: 'wire-fraud',
  },
  {
    code: 'B2521',
    name: 'International Wire Screening Delay Creates OFAC False-Clear Risk',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's international wire screening against OFAC SDN lists introduces a 4–6 hour
      processing delay for complex correspondent bank chains, creating a business pressure to
      batch-release wires at the end of the screening window rather than resolving each alert
      individually. The batch-release practice means that wires cleared at the end-of-day release
      cycle receive a less rigorous alert disposition review than individually processed wires,
      creating a systematic gap between the bank's OFAC screening policy and its operational
      practice. OFAC's BSA/AML examination manual and FinCEN guidance require financial
      institutions to implement screening procedures with sufficient rigor to detect true matches,
      and batch-release practices that undercut alert quality represent a documented compliance
      weakness.`,
    keywords: ['OFAC screening', 'FinCEN', 'international wire', 'BSA/AML', 'SDN list'],
    subTopic: 'wire-fraud',
  },
  {
    code: 'B2522',
    name: 'Wire Recall Procedure Not Integrated Into Fraud Operations Response Playbook',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's fraud operations team does not have a documented, timed wire recall
      procedure linked to the Fedwire Funds Service recall request process and SWIFT gpi recall
      timeline for international wires. When a BEC fraud case is confirmed, the fraud analyst
      escalates to a manager for approval before initiating recall, introducing a 60–90 minute
      delay that reduces recall success rates materially — Fedwire recall effectiveness declines
      sharply after the receiving bank processes the credit, typically within 30–45 minutes of
      settlement. OCC supervisory guidance on payment fraud response requires institutions to
      have documented, rehearsed fraud response procedures with defined escalation timelines
      for high-value wire fraud scenarios.`,
    keywords: ['wire recall', 'Fedwire', 'SWIFT gpi', 'OCC guidance', 'fraud response playbook'],
    subTopic: 'wire-fraud',
  },

  // ── First-Party Fraud ──────────────────────────────────────────────────────
  {
    code: 'B2523',
    name: 'Bust-Out Pattern Detection Lag in Revolving Credit Portfolio',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's consumer revolving credit portfolio experiences bust-out fraud — where
      an account holder maximizes available credit across multiple products and then stops paying
      — at a rate 35% above the bank's peer group, according to its most recent OCC horizontal
      examination benchmarking. The fraud detection model scores bust-out risk at origination and
      account opening but does not monitor for the behavioral precursors of bust-out in the
      months before default: accelerating utilization, balance transfers to new accounts,
      suspension of autopay, and simultaneous credit limit increase requests across multiple
      First Capital products. SR 11-7 model monitoring requirements and the bank's own loss
      forecasting model both treat bust-out losses as credit losses, masking the actual first-party
      fraud exposure in the CECL allowance.`,
    keywords: ['bust-out fraud', 'first-party fraud', 'SR 11-7', 'revolving credit', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2524',
    name: 'Credit Washing Indicator Detection Not Implemented in Underwriting',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's underwriting scorecard does not include credit washing detection signals
      — such as a high density of recent dispute-driven tradeline deletions, sudden credit score
      improvement coinciding with dispute filings against all derogatory tradelines, or re-aged
      accounts appearing on the credit report within 90 days of application. Credit washing exploits
      consumer credit dispute rights under the Fair Credit Reporting Act to artificially inflate
      credit scores before a credit application; CFPB examination guidance and FCRA enforcement
      actions have flagged the interplay between dispute rights and fraud as a systemic issue
      in consumer lending, and banks that do not screen for credit washing indicators experience
      elevated first-payment-default rates in origination cohorts following credit cleaning
      activity.`,
    keywords: ['credit washing', 'FCRA', 'CFPB', 'underwriting fraud', 'first-party fraud'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2525',
    name: 'Friendly Fraud Chargeback Volume Exceeds Network Threshold Without Dispute Monitoring',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's debit card portfolio has friendly fraud chargeback rates on e-commerce
      transactions — where legitimate cardholders dispute valid charges to avoid payment — that
      are approaching the Visa excessive chargeback program threshold of 1.5% monthly chargeback
      ratio. The bank does not have a systematic process to identify serial friendly fraud
      claimants, cross-reference dispute history at account level, or share confirmed friendly
      fraud data with the card network's Early Fraud Warning reporting system. Exceeding Visa's
      excessive chargeback threshold triggers fines of $50–$100 per chargeback and potential
      enrollment in the fraud monitoring program, representing both direct financial and
      reputational risk that the bank's dispute management team has not quantified or escalated
      to senior management.`,
    keywords: ['friendly fraud', 'Visa chargeback program', 'dispute monitoring', 'Reg E', 'first-party fraud'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2526',
    name: 'First-Party Fraud Losses Misclassified as Credit Losses in CECL Model',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's charge-off classification process does not systematically distinguish
      first-party fraud losses — bust-out, credit washing defaults, and intentional non-payment
      schemes — from genuine credit losses resulting from borrower financial distress, causing
      both to flow into the CECL historical loss data used to calibrate PD and LGD. The CECL
      allowance model is therefore miscalibrated in segments with elevated first-party fraud rates,
      systematically overstating credit risk where fraud is the primary driver of loss and
      understating it where fraud is masking underlying credit quality; OCC examination guidance
      on CECL governance requires that loss data used in model training be categorized with
      sufficient granularity to support the model's use case.`,
    keywords: ['CECL', 'first-party fraud', 'SR 11-7', 'charge-off classification', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2527',
    name: 'PPP Loan Fraud Losses Not Incorporated Into First-Party Fraud Model Training',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital originated $340M in SBA PPP loans in 2020–2021, approximately 4–6% of which
      the SBA's OIG and DOJ enforcement actions indicate were fraudulent based on federal program
      criteria. The charge-off losses from confirmed PPP fraud were booked as government-guaranteed
      loan losses rather than fraud losses and were not incorporated into the bank's first-party
      fraud model training data or loss reporting. As a result, the bank's fraud analytics
      infrastructure has no enriched historical record of the behavioral precursors — business
      formation date anomalies, payroll documentation inconsistencies, identity mismatches — that
      distinguish PPP fraud applications and could be generalized to other SBA and government
      lending programs.`,
    keywords: ['PPP fraud', 'SBA lending', 'first-party fraud', 'fraud model training', 'OCC guidance'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2528',
    name: 'Authorised Push Payment Consumer Scam Not Reimbursed — Reg E Interpretation Gap',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's fraud dispute resolution process treats all customer-authorized ACH and
      Zelle transfers as outside the scope of Reg E 12 CFR Part 205.6 unauthorized transaction
      protections, denying reimbursement for confirmed social engineering scams on the legal basis
      that the customer provided authorization. The CFPB's 2023 interpretive guidance clarifies
      that when a customer is deceived into authorizing a transfer through a bank-impersonation
      scam, the authorization obtained by deception may not satisfy the Reg E definition of
      consumer authorization, creating a regulatory ambiguity that the bank has resolved entirely
      in its own favor without documented legal analysis. CFPB supervisory findings against peer
      banks for systematic denial of scam reimbursement create precedential risk for First Capital's
      blanket denial policy.`,
    keywords: ['Reg E', 'CFPB', 'authorized push payment', 'social engineering', 'Zelle scam'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },

  // ── AI Fraud ───────────────────────────────────────────────────────────────
  {
    code: 'B2529',
    name: 'ML Fraud Model Drift Without SR 11-7 MRM Oversight — FedNow Population Shift',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's ML fraud detection model for retail payments was validated under SR 11-7
      on a transaction population that predates the bank's FedNow and expanded Zelle volumes by
      18 months; post-launch, the transaction population includes a materially different mix of
      speed, amount, and channel attributes that the model was not trained to discriminate. The
      model's SR 11-7 monitoring program tracks Gini coefficient stability but does not include
      population stability index (PSI) metrics that would surface distributional shift in the
      FedNow transaction subpopulation; consent order remediation milestones require the bank
      to demonstrate model monitoring adequacy, but the monitoring report does not acknowledge
      the FedNow population as a distinct monitoring segment.`,
    keywords: ['ML fraud model', 'SR 11-7', 'model drift', 'FedNow', 'population stability index'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2530',
    name: 'Adversarial Attack on Fraud Classifier — Feature Manipulation Not in Threat Model',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's ML fraud classifier for card-not-present transactions does not include
      adversarial robustness testing in its SR 11-7 validation scope — specifically, the
      independent validation unit has not assessed whether a sophisticated fraud actor with
      knowledge of the model's feature space can systematically construct transactions that
      score below the alert threshold by manipulating observable features such as merchant
      category, transaction timing, and incremental amount patterns. Academic research and
      financial industry security literature both document feature-space adversarial attacks
      against fraud classifiers as a credible threat vector; the absence of adversarial testing
      in the validation report leaves the bank unable to demonstrate to OCC examiners that its
      fraud AI is robust against a motivated adversary.`,
    keywords: ['adversarial ML', 'fraud classifier', 'SR 11-7 validation', 'ML robustness', 'card-not-present fraud'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2531',
    name: 'LLM Fraud Analyst Co-Pilot Deployed Without Supervision Policy or SR 11-7 Scope',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's fraud operations team adopted an LLM-based co-pilot tool that assists
      fraud analysts in reviewing transaction alert narratives, summarizing account history, and
      suggesting SAR filing decisions. The tool was deployed as a productivity application without
      a supervision policy defining when analysts must override LLM recommendations, how LLM
      errors are detected and corrected, or what escalation path exists when the LLM suggests
      a disposition that conflicts with analyst judgment. SR 11-7's extension guidance covers
      models used to inform SAR filing decisions; without an SR 11-7 registration, validation,
      or monitoring program for the LLM co-pilot, the bank cannot demonstrate to FinCEN and the
      OCC that its SAR filing program maintains human oversight of AI-assisted determinations.`,
    keywords: ['LLM fraud analyst', 'SAR filing', 'SR 11-7', 'FinCEN', 'supervision policy'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2532',
    name: 'Deep-Fake Voice Bypass of Telephone Wire Authorization Not in Fraud Threat Model',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital's telephone-channel wire authorization process requires verbal confirmation
      of wire instructions using voice biometric authentication, but the bank's voice biometric
      vendor has not delivered a liveness detection upgrade that distinguishes real-time deep-fake
      voice synthesis from live human speech. A proof-of-concept fraud attempt using a commercially
      available voice cloning tool trained on publicly available recordings of a corporate treasurer
      successfully authenticated against the bank's voice biometric system in vendor testing.
      The bank's vendor management program under OCC Bulletin 2023-17 does not include a
      contractual requirement for the voice biometric vendor to deliver liveness detection on a
      defined timeline, leaving the authentication gap open until the vendor's product roadmap
      addresses it.`,
    keywords: ['deep-fake voice', 'voice biometrics', 'OCC Bulletin 2023-17', 'wire fraud', 'liveness detection'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2533',
    name: 'Fraud Denial Explainability Gap — ML Decision Indefensible Under Reg E Dispute',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's ML fraud classifier blocks certain card-not-present transactions and
      issues automatic declines without generating a human-interpretable explanation of why
      the transaction was declined; when customers file a Reg E 12 CFR Part 205 error resolution
      complaint and request the reason for the decline, fraud operations staff cannot provide
      a specific explanation because the ML model's decision logic is not exposed to the operations
      team. The CFPB's guidance on adverse action and error resolution under Reg E requires that
      institutions be able to explain transaction denial decisions to consumers upon request;
      an ML model that produces unexplainable declines violates this requirement and creates
      examination exposure that is compounded by the bank's SR 11-7 model explainability gap.`,
    keywords: ['Reg E', 'ML explainability', 'SR 11-7', 'CFPB', 'fraud decline explanation'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2534',
    name: 'AI Fraud Model Vendor Contract Lacks SR 11-7 Documentation Access Rights',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's contract with its primary fraud AI vendor does not include a provision
      granting the bank access to model documentation, training data descriptions, validation
      reports, or the right to conduct independent performance testing on the bank's own customer
      population. SR 11-7 requires banks to be able to validate and monitor all models in use,
      including vendor models; without contractual access to documentation, the bank cannot
      satisfy SR 11-7's conceptual soundness and independent validation requirements for a model
      that makes real-time fraud decisions on millions of transactions annually. OCC Bulletin
      2023-17 on third-party relationships requires that vendor contracts provide sufficient
      access rights for regulatory examination purposes, making the contract gap a dual
      consent-order finding.`,
    keywords: ['SR 11-7', 'vendor AI', 'OCC Bulletin 2023-17', 'TPRM', 'fraud AI contract'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2535',
    name: 'Fraud AI Champion-Challenger Promotion Blocked by SR 11-7 Full Validation Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital operates a challenger fraud AI model that outperforms the champion on
      both precision and recall across all transaction segments in 6-month parallel testing,
      but MRM policy requires a full independent validation cycle before the challenger can be
      promoted to production. The full validation cycle takes 5 months due to IVU resource
      constraints stemming from the consent order validation backlog; by the time the validation
      is completed, the challenger's performance advantage is partially eroded by further model
      drift in the champion. SR 11-7 guidance permits tiered validation for model changes where
      the degree of change is limited and ongoing monitoring data serves as validation evidence,
      but the bank's policy does not incorporate the tiered validation option, creating a structural
      delay between fraud model improvement and deployment.`,
    keywords: ['SR 11-7', 'fraud AI champion-challenger', 'model validation', 'IVU', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2536',
    name: 'Graph AI Network Fraud Detection Outside SR 11-7 Inventory — Treated as Analytics',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys a graph neural network model that analyzes the network topology of
      account relationships, device sharing, and IP address clustering to identify organized fraud
      rings. The model was deployed by the fraud analytics team as a visual analytics tool and
      classified outside the SR 11-7 model inventory because the output is described as an
      "investigation prioritization signal" rather than a fraud decision. When the graph AI model
      suppresses a ring that subsequently perpetrates a $2.1M ACH fraud scheme, OCC examiners
      reviewing the fraud investigation record find no SR 11-7 governance documentation for the
      model — no validation, no monitoring program, and no documented performance testing — a
      finding that directly parallels the AML graph AI inventory gap cited in the bank's existing
      consent order.`,
    keywords: ['graph AI', 'SR 11-7', 'model inventory', 'fraud ring detection', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2537',
    name: 'Fraud ML Model Bias Testing Absent — Disparate Block Rate Across Demographics',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's ML card fraud model has never been tested for disparate transaction block
      rates across demographic proxies — specifically, whether certain zip code clusters, merchant
      category combinations, or behavioral patterns that correlate with protected class status
      are blocked at materially higher rates than statistically equivalent transactions from
      non-protected-class proxies. The CFPB's 2022 circular on adverse action explainability
      and ECOA-related supervisory expectations require that models used in credit and payment
      decisions be tested for disparate impact; fraud blocking is not a credit decision per se,
      but systematic over-blocking of legitimate transactions on a demographic basis constitutes
      a UDAP/UDAAP risk that the bank's fair lending compliance program has not assessed.`,
    keywords: ['ML fraud model', 'disparate impact', 'ECOA', 'CFPB', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2538',
    name: 'Real-Time AI Fraud Scoring Latency Exceeds FedNow Authorization Window',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's AI fraud scoring engine for FedNow transactions was designed for
      the ACH batch-processing latency budget and produces a fraud score in 800–1,200 milliseconds
      under peak load. FedNow's technical specifications require that receiving institutions respond
      to payment requests within 20 seconds, but the bank's overall payment processing chain
      — fraud scoring plus compliance screening plus account verification — consumes 18–19 seconds
      under peak afternoon transaction volumes. When the fraud engine exceeds its latency budget,
      the payment processing timeout triggers an automatic approval to preserve the FedNow SLA,
      creating a systematic bypass of the AI fraud control during peak hours that the operations
      team has identified but not escalated to risk management or addressed in the FedNow
      risk assessment.`,
    keywords: ['FedNow', 'AI fraud scoring', 'latency', 'real-time payments', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2539',
    name: 'Generative AI Used for Synthetic Training Data Creation Without Validation',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's fraud model development team uses a generative AI tool to augment its
      fraud training dataset with synthetic minority-class examples — artificially generated
      fraud transaction patterns designed to improve the model's recall on rare fraud typologies.
      The synthetic data generation methodology is not documented as a model under SR 11-7,
      and the conceptual soundness of the synthetic samples — whether they accurately represent
      real fraud patterns rather than artifacts of the generative model's own biases — has not
      been independently validated. An SR 11-7 validation of the fraud classifier that consumes
      synthetic training data is incomplete without a validation of the data generation process
      itself, a gap that OCC model risk guidance has addressed in the context of ML model
      development best practices.`,
    keywords: ['generative AI', 'synthetic training data', 'SR 11-7', 'fraud model development', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2540',
    name: 'Fraud AI Vendor Model Scope Expanded Post-Deployment Without Re-Validation',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's fraud AI vendor expanded the model's coverage from debit card transactions
      to include ACH and FedNow transactions through a configuration change that the vendor
      characterized as a feature activation rather than a model scope change. The bank's TPRM
      team was notified of the configuration change but did not escalate it to the MRM function
      for an SR 11-7 scope assessment; the expanded fraud AI model was not re-validated against
      First Capital's ACH and FedNow transaction populations, which have different risk profiles,
      amount distributions, and fraud typologies than the debit card population on which the
      model was originally validated. OCC Bulletin 2023-17 requires banks to monitor vendor model
      changes that affect the model's use scope and trigger re-validation when the change is
      material.`,
    keywords: ['fraud AI vendor', 'SR 11-7', 'OCC Bulletin 2023-17', 'TPRM', 'model scope'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2541',
    name: 'Fraud Prediction AI Confidence Score Misused as Threshold — No Calibration Test',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's fraud operations team uses the raw probability output of an ML classifier
      as a directly interpretable confidence score — treating a model output of 0.73 as meaning
      "73% probability of fraud" — but the model has never undergone probability calibration
      testing under SR 11-7. Uncalibrated ML classifiers frequently produce probability outputs
      that are systematically high or low relative to the true fraud rate, making raw probability
      thresholds unreliable; when the fraud operations team sets a manual review threshold at
      0.65, the actual false-negative rate in that decision zone is materially different from
      the implied 35% that drives the threshold choice. SR 11-7 validation standards require
      that model outputs used for business decisions be validated for the specific interpretation
      placed on those outputs by decision-makers.`,
    keywords: ['ML fraud model', 'probability calibration', 'SR 11-7', 'model validation', 'fraud threshold'],
    subTopic: 'ai-fraud',
  },
  {
    code: 'B2542',
    name: 'AI-Assisted SAR Narrative Drafting Without FinCEN Supervisory Scope Assessment',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's BSA/AML team uses an LLM tool to draft Suspicious Activity Report
      narratives from structured alert data, reducing the time to file from 4 hours to 45 minutes
      per SAR. The LLM tool is deployed without a documented scope assessment addressing whether
      LLM-drafted SAR narratives meet FinCEN's SAR filing requirements for factual accuracy,
      completeness, and description of the specific suspicious activity pattern, and without
      a quality control process that requires a trained BSA officer to substantively review and
      certify the LLM draft before filing. FinCEN guidance requires that SARs describe the
      suspicious activity in sufficient detail for law enforcement use; a quality-control process
      that rubber-stamps LLM drafts without substantive review creates BSA compliance risk and
      SR 11-7 model governance exposure.`,
    keywords: ['LLM SAR drafting', 'FinCEN', 'BSA/AML', 'SR 11-7', 'SAR quality control'],
    demoRelevant: true,
    subTopic: 'ai-fraud',
  },

  // ── Additional Transaction Fraud ───────────────────────────────────────────
  {
    code: 'B2543',
    name: 'Fraud Rule Governance Gap — Business Overrides Not Subject to Risk Review',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital allows business unit product managers to override fraud rules on a
      temporary basis to reduce false positives during product promotions and new customer
      onboarding campaigns, without a risk governance process requiring fraud risk sign-off,
      a defined duration limit, or post-override fraud loss monitoring. A 30-day override on
      card-not-present velocity rules introduced during a digital onboarding promotion was
      extended indefinitely when marketing objected to restoring the original rules, and the
      fraud exposure from the override was never quantified. OCC supervisory guidance on
      operational risk governance requires that controls can only be modified through a
      documented change management process with risk management approval, which the bank's
      informal business-override practice does not satisfy.`,
    keywords: ['fraud rule governance', 'OCC guidance', 'fraud controls', 'operational risk', 'change management'],
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2544',
    name: 'ACH Return Rate Rising Above NACHA Monitoring Threshold Without Remediation Plan',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's ACH originator monitoring program identifies several commercial originators
      whose unauthorized return rates (Return Reason Code R10) are approaching NACHA's 0.5%
      administrative threshold for unauthorized returns, but the bank's ODFI risk management
      team has not issued any originator remediation notices or suspended origination access for
      at-risk originators. NACHA operating rules require ODFIs to monitor originator return rates
      and impose remediation obligations — including suspended origination access — when
      thresholds are exceeded; the bank's failure to act on rising return rates before threshold
      breach creates NACHA audit risk and potential liability for the ODFI as the guaranteeing
      party for fraudulent originations.`,
    keywords: ['NACHA', 'ACH return rate', 'ODFI', 'unauthorized returns', 'originator monitoring'],
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2545',
    name: 'P2P Payment Fraud Detection Not Tuned for Student and Young-Adult Account Behavior',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's fraud scoring model for Zelle and debit P2P payments was calibrated
      on the bank's general adult account population but generates disproportionate false-positive
      blocks on student and young-adult accounts, whose P2P payment behavior — high frequency,
      small amounts, non-recurring recipients — differs structurally from the training population.
      The elevated false-positive rate creates customer friction that drives account closure among
      the bank's strategic growth demographic, while the fraud team's manual review queue is
      clogged with legitimate student transactions. SR 11-7 model monitoring requirements and
      Zelle operating rule performance standards both contemplate segment-level performance
      review; the bank's model monitoring program does not produce segment-level false-positive
      metrics.`,
    keywords: ['Zelle fraud scoring', 'SR 11-7', 'false positive rate', 'Zelle operating rules', 'P2P fraud'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2546',
    name: 'Fraud Liability Allocation Between Bank and Fintech Partner Undefined for Embedded Payments',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's banking-as-a-service arrangement with a fintech partner embeds First Capital
      account infrastructure in the partner's consumer app, where Zelle payments and ACH transfers
      are initiated. The fraud liability allocation between First Capital as the bank sponsor and
      the fintech as the program manager is not clearly defined in the partnership agreement for
      APP fraud scenarios — specifically, whether the fintech's failure to implement Zelle operating
      rule-required fraud controls transfers Reg E liability back to the bank. OCC guidance on
      bank-fintech arrangements and the FDIC's 2024 proposed rule on sponsor bank oversight both
      require that fraud risk allocation be explicitly contracted and that the bank maintain oversight
      of the fintech's fraud controls as a TPRM obligation.`,
    keywords: ['banking-as-a-service', 'OCC guidance', 'TPRM', 'Zelle operating rules', 'Reg E'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2547',
    name: 'Instant Payment Fraud Dispute Resolution Timeline Exceeds Reg E Statutory Requirement',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's fraud dispute resolution queue averages 18 business days to complete
      investigation and issue a final determination for FedNow and Zelle disputes, materially
      exceeding the 10-business-day provisional credit window under Reg E 12 CFR Part 205.11.
      The investigation delay is driven by the manual review process for instant payment disputes,
      which requires fraud operations staff to request records from the receiving institution via
      a non-automated channel. The bank's failure to issue provisional credit within the statutory
      window — or to complete investigation within 10 days — constitutes a Reg E compliance
      violation that the CFPB has cited in peer examinations as a pattern of consumer harm in
      instant payment dispute handling.`,
    keywords: ['Reg E', 'CFPB', 'FedNow dispute', 'provisional credit', 'instant payment fraud'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },

  // ── Additional Identity Fraud ──────────────────────────────────────────────
  {
    code: 'B2548',
    name: 'Identity Document Verification AI Not Tested for Adversarial Document Forgery',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's digital account opening flow uses an AI-powered identity document
      verification service to authenticate government-issued IDs at onboarding. The vendor's
      document AI has not been tested against high-quality commercially produced forgeries that
      use modern printing techniques to replicate holographic overlays and microprint — a category
      of document fraud that exploits the training data gap in AI systems trained predominantly
      on genuine documents. The bank's vendor management review under OCC Bulletin 2023-17 does
      not include a contractual requirement for the vendor to provide adversarial testing results
      or to maintain performance standards against contemporary forgery techniques, leaving
      the bank dependent on the vendor's internal quality assurance with no external validation.`,
    keywords: ['identity document AI', 'OCC Bulletin 2023-17', 'digital onboarding', 'TPRM', 'document forgery'],
    subTopic: 'identity-fraud',
  },
  {
    code: 'B2549',
    name: 'SIM Swap Attack Bypasses SMS OTP for Account Recovery — No Alternative Channel',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's account recovery flow uses SMS one-time passwords as the primary
      secondary authentication factor, making the flow vulnerable to SIM swap attacks where
      a fraudster persuades the customer's mobile carrier to transfer the customer's phone
      number to a fraudster-controlled SIM. Following a successful SIM swap, the fraudster
      receives the OTP SMS and completes account recovery, gains access to online banking,
      and initiates Zelle and ACH transfers before the legitimate customer discovers the
      account access. FFIEC 2021 authentication supplement guidance explicitly identifies
      SIM swap as a known attack vector against SMS OTP and recommends that banks offer
      phishing-resistant MFA alternatives such as FIDO2/WebAuthn; First Capital has not
      implemented an alternative authentication path for customers who prefer non-SMS factors.`,
    keywords: ['SIM swap', 'SMS OTP', 'FFIEC authentication guidance', 'account takeover', 'MFA'],
    demoRelevant: true,
    subTopic: 'identity-fraud',
  },

  // ── Additional Wire Fraud ──────────────────────────────────────────────────
  {
    code: 'B2550',
    name: 'Commercial Client Wire Limit Not Reviewed After BEC Advisory — Static Thresholds',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking clients have wire transfer limits set at account
      opening that are reviewed only upon client request rather than on a risk-based review
      cycle. Following the FBI's 2023 BEC advisory identifying commercial real estate closing
      fraud as the highest-loss BEC typology, the bank did not conduct a review of wire limits
      for real estate attorney, title company, and property management accounts — precisely
      the account types where BEC-induced misdirected wires concentrate. OCC guidance on
      commercial wire fraud risk management recommends that banks review wire limits for
      BEC-exposed customer segments on at least an annual basis following material threat
      intelligence updates.`,
    keywords: ['BEC fraud', 'OCC guidance', 'commercial wire limits', 'real estate fraud', 'FBI advisory'],
    subTopic: 'wire-fraud',
  },
  {
    code: 'B2551',
    name: 'AI-Flagged High-Risk Wire Not Escalated Due to Undefined Escalation Path',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI fraud scoring system assigns a high-risk score to a $780,000
      commercial wire initiated via the online banking corporate portal, flagging beneficiary
      account mismatch, IP geolocation anomaly, and out-of-pattern amount. The AI alert is
      routed to the fraud operations queue but no escalation path is defined that would
      automatically hold the wire pending human review when the AI score exceeds a defined
      threshold; the wire is released by the treasury management system before the fraud analyst
      reaches the alert in the queue. SR 11-7 model governance requires that the bank define
      how AI model outputs are used in business processes, including the decision rights and
      escalation procedures that translate a model score into a control action.`,
    keywords: ['wire fraud AI', 'SR 11-7', 'escalation procedure', 'fraud alert', 'commercial wire'],
    demoRelevant: true,
    subTopic: 'wire-fraud',
  },

  // ── Additional APP Fraud ───────────────────────────────────────────────────
  {
    code: 'B2552',
    name: 'Zelle Impersonation Scam Reimbursement Rate Below Zelle Operating Rule Expectation',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's reimbursement rate for confirmed Zelle impersonation scams — where the
      fraudster impersonated a First Capital fraud representative and induced the customer to
      move funds — falls below the reimbursement rate floor established by Zelle operating rule
      amendments effective 2024, which require member institutions to reimburse consumers for
      qualifying impersonation scam losses. The bank's dispute adjudication process requires
      customers to provide documentation that a court or regulatory standard would not require
      as a prerequisite to reimbursement under the scam provision, creating a documentation
      burden that systematically denies eligible claims. CFPB supervisory examination of Zelle
      dispute handling has cited documentation requirements that functionally deny eligible
      reimbursement as a UDAAP violation.`,
    keywords: ['Zelle operating rules', 'CFPB', 'UDAAP', 'impersonation scam', 'APP fraud reimbursement'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },
  {
    code: 'B2553',
    name: 'Romance Scam Detection Not in Fraud Model Feature Set — Senior Account Risk',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's fraud detection model does not include behavioral features designed to
      detect romance scam and investment fraud patterns — such as sustained high-value Zelle
      transfers to a single new recipient over weeks, combined with customer service calls
      expressing urgency about an international relationship or investment opportunity. FinCEN's
      2023 alert on romance scam and elder financial exploitation and the CFPB's Elder Financial
      Exploitation supervision priority both identify senior account holders as the highest-risk
      demographic and recommend that financial institutions implement behavioral analytics
      specifically designed to identify exploitation patterns. First Capital's fraud model was
      not designed with elder exploitation as an explicit use case, and the fraud operations team
      has no escalation protocol to the bank's elder financial exploitation program.`,
    keywords: ['romance scam', 'FinCEN', 'CFPB elder exploitation', 'Zelle fraud', 'behavioral analytics'],
    demoRelevant: true,
    subTopic: 'app-fraud',
  },

  // ── Additional First-Party Fraud ───────────────────────────────────────────
  {
    code: 'B2554',
    name: 'Friendly Fraud Detection Model Trained Only on Third-Party Fraud Labels',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's chargeback dispute management system uses an ML model trained exclusively
      on confirmed third-party fraud outcomes — unauthorized transactions where a card was
      stolen or compromised — and applies this model to screen friendly fraud disputes where
      the cardholder made the purchase and is disputing it falsely. The training data mismatch
      means the model has no exposure to the behavioral patterns that distinguish friendly fraud
      from genuine unauthorized transactions: high dispute frequency, prior dispute resolution
      in the customer's favor, merchandise category clustering, and merchant dispute history.
      SR 11-7 model validation requirements apply to the friendly fraud detection use case as
      a distinct decisioning context from the third-party fraud use case, and using a model
      outside its validated scope is a model governance deficiency.`,
    keywords: ['friendly fraud ML model', 'SR 11-7', 'chargeback fraud', 'model scope', 'dispute management'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2555',
    name: 'Bust-Out Fraud ML Model Does Not Flag Cross-Institutional Bust-Out Signals',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's bust-out fraud detection relies exclusively on in-house account behavior
      features and does not consume consortium data that would reveal when a customer is
      simultaneously maxing credit at other financial institutions — the cross-institutional
      signal that distinguishes coordinated bust-out from single-institution over-extension.
      Industry consortium fraud data services, including the Early Warning consortium and
      credit bureau specialty fraud scores, provide cross-institutional bust-out signals that
      are not integrated into First Capital's fraud scoring pipeline. The absence of consortium
      signals means the bank detects bust-out only after charge-off, rather than 30–60 days
      earlier when account suspension could reduce loss, a detection lag that SR 11-7 model
      performance benchmarking against peer institutions would reveal as a material gap.`,
    keywords: ['bust-out fraud', 'consortium fraud data', 'SR 11-7', 'first-party fraud', 'credit fraud ML'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },

  // ── Cross-Cutting Governance ───────────────────────────────────────────────
  {
    code: 'B2556',
    name: 'Fraud Risk Assessment Not Updated After FedNow Go-Live — FFIEC Gap',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital conducted its most recent enterprise fraud risk assessment 14 months before
      its FedNow go-live date and has not performed a refreshed assessment that incorporates
      the new fraud threat landscape specific to real-time payment irrevocability, instant payment
      mule account exploitation, and APP fraud liability under the Zelle operating rule amendments.
      FFIEC guidance on payment fraud risk management requires financial institutions to conduct
      risk assessments when new payment products or rails are introduced; the absence of a
      post-FedNow fraud risk assessment means the bank cannot demonstrate to OCC examiners that
      its fraud controls are calibrated to the current risk environment, a finding that is likely
      under the bank's ongoing consent order examination cycle.`,
    keywords: ['FedNow', 'FFIEC', 'fraud risk assessment', 'OCC examination', 'instant payments'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2557',
    name: 'Fraud Losses Not Disaggregated by Payment Rail in Management Reporting',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's monthly fraud loss management report aggregates all payment fraud losses
      into a single total without disaggregating by payment rail — card, ACH, Zelle, FedNow,
      wire — making it impossible for senior management to assess whether fraud controls on
      the instant payment rails are performing adequately relative to legacy rails. Rail-level
      disaggregation is a supervisory expectation under OCC guidance on payment fraud risk
      governance and is explicitly required for institutions with FedNow and Zelle volumes
      above internal thresholds; without rail-level visibility, the fraud operations budget
      and control investment cannot be allocated based on where the fraud exposure is actually
      concentrated.`,
    keywords: ['fraud loss reporting', 'OCC guidance', 'FedNow', 'Zelle', 'management reporting'],
    demoRelevant: true,
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2558',
    name: 'Fraud Control Self-Assessment Not Mapped to FFIEC Cybersecurity Framework',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's annual fraud control self-assessment uses an internal scoring rubric
      that is not mapped to the FFIEC Cybersecurity Assessment Tool or the FFIEC's Authentication
      and Online Banking Guidance, preventing the bank from demonstrating to OCC examiners that
      its fraud controls satisfy the layered security architecture requirements described in the
      FFIEC framework. The self-assessment is used to set the fraud operations improvement
      roadmap and budget, but without alignment to the FFIEC framework, the bank cannot identify
      which control gaps represent regulatory expectations versus internal best practices, and
      cannot benchmark its control maturity against the FFIEC's inherent risk and maturity
      profile methodology.`,
    keywords: ['FFIEC', 'fraud control assessment', 'OCC examination', 'cybersecurity framework', 'layered security'],
    subTopic: 'transaction-fraud',
  },
  {
    code: 'B2559',
    name: 'Fraud and AML Silos Prevent Joint Case Management for Organized Financial Crime',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's fraud investigations and BSA/AML compliance functions operate independently
      with separate case management systems, separate alert queues, and no formal protocol for
      joint investigation when fraud and AML indicators co-occur in the same account cluster.
      FinCEN guidance on coordinating fraud and AML investigations and the OCC's horizontal review
      of financial crime program effectiveness both identify the fraud-AML silo as a systemic
      weakness that allows sophisticated organized crime networks to exploit the gap between the
      two programs; fraud teams suppress alerts that AML teams would escalate as suspicious, and
      AML teams file SARs on accounts that fraud teams have separately closed without a SAR.
      The joint investigation gap is a consent order finding risk given the bank's existing
      MRM and financial crime examination history.`,
    keywords: ['fraud-AML integration', 'FinCEN', 'OCC examination', 'joint case management', 'organized financial crime'],
    demoRelevant: true,
    subTopic: 'wire-fraud',
  },
];
