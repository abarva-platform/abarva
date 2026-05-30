// seed-banking-dom08-payments-part1.ts
// Banking genome patterns — Payments Modernisation (FedNow / RTP / SWIFT)
// Code range: B2200–B2259  (60 patterns)
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

export const BANKING_PAYMENTS_PART1_PATTERNS: PatternSeed[] = [

  // ── FedNow / RTP Liquidity Management ──────────────────────────────────────
  {
    code: 'B2200',
    name: 'FedNow Liquidity Prefunding Gaps Cause Settlement Failures at Peak',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital Bank launches FedNow instant payment capability without a real-time liquidity
      prefunding model, relying instead on static Federal Reserve master account balances sized for
      ACH settlement cycles rather than 24/7 instant finality. Under FedNow operating procedures,
      each credit transfer must settle in the sender's master account within the transaction window;
      when commercial payroll disbursements and vendor payment batches converge on Monday mornings,
      the master account balance falls below the prefunding threshold, triggering automatic payment
      deferrals that the corporate treasury clients interpret as outages and escalate to the
      relationship manager.`,
    keywords: ['FedNow', 'intraday liquidity', 'instant payments', 'Federal Reserve master account', 'prefunding'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2201',
    name: 'RTP Irrevocable Settlement Risk Enabled Before Fraud Decisioning Reaches Real-Time',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital enables The Clearing House RTP network for consumer and small business
      disbursements before the bank's fraud decisioning engine is upgraded to return a credit or
      decline in under 250 milliseconds, the maximum processing window permitted by RTP operating
      rules. The bank's legacy fraud model takes 800–1,200 milliseconds on average, so the
      compliance team disables the real-time fraud check and permits all RTP transactions to settle,
      relying on post-settlement review to identify fraud. Because RTP credits are irrevocable under
      NACHA's framework, losses on fraudulent disbursements identified post-settlement cannot be
      recovered from the counterparty institution, creating an unhedged fraud exposure that grows
      proportionally with RTP transaction volume.`,
    keywords: ['RTP', 'irrevocable settlement', 'NACHA', 'fraud controls', 'instant payments'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2202',
    name: 'FedNow Participant Directory Synchronisation Failures Create Payment Misdirection',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's integration with the FedNow Service participant directory relies on a
      batch synchronisation job that updates routing number and account validity records every
      four hours, rather than the near-real-time pull recommended in FedNow operating procedures.
      When a commercial customer closes an account mid-day, the stale directory entry allows
      subsequent FedNow credits to route to the closed account number, generating a settlement
      exception that requires manual intervention and delays the payment by hours rather than
      seconds — eliminating the core value proposition of instant payments for the affected
      transactions and generating Reg E inquiry volume from consumer senders.`,
    keywords: ['FedNow', 'participant directory', 'routing number', 'Reg E', 'instant payments'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2203',
    name: 'Intraday Liquidity Monitoring Not Granular Enough for FedNow 24/7 Obligations',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's treasury intraday liquidity monitoring system reports master account
      balances at 15-minute intervals, a cadence designed for ACH and wire settlement windows
      that operate within business hours. FedNow's 24/7 continuous settlement window requires
      sub-minute balance visibility to prevent deferral events during off-hours when the
      treasury operations desk is minimally staffed; the 15-minute lag means that a balance
      deterioration at 2:00 AM can trigger 12–15 deferred payments before the next monitoring
      cycle fires an alert, creating both a customer experience failure and a BCBS 239
      intraday liquidity reporting gap.`,
    keywords: ['FedNow', 'BCBS 239', 'intraday liquidity', 'instant payments', 'treasury operations'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2204',
    name: 'ISO 20022 Remittance Fields Truncated to Legacy Field Lengths at FedNow Middleware',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's FedNow middleware translates ISO 20022 pacs.008 credit transfer messages
      into its core banking system's internal format, but the translation layer silently truncates
      remittance information fields — Ustrd (unstructured remittance) and structured invoice
      references — to the legacy 140-character limit used by the predecessor ACH system. Corporate
      treasury clients who embed invoice numbers, purchase order references, and contract identifiers
      in the ISO 20022 remittance fields find that recipients receive truncated or missing data,
      making automated three-way matching impossible and causing the receivables reconciliation
      failure that the FedNow pilot was intended to solve for commercial banking clients.`,
    keywords: ['FedNow', 'ISO 20022', 'remittance data', 'NACHA', 'commercial payments'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2205',
    name: 'RTP Network Credit Limit Not Aligned With Commercial Client Payment Volumes',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's initial RTP network participation sets a per-transaction credit limit of
      $1 million per the default RTP operating rules without seeking the higher-limit approval
      available under The Clearing House's commercial payment expansion program. Several commercial
      banking clients running vendor disbursements, insurance claims payments, and real estate
      closings require transactions in the $1.5–5 million range that fall outside the default RTP
      limit; those clients revert to same-day ACH or Fedwire for qualifying transactions, reducing
      RTP adoption metrics and undermining the commercial banking team's pitch for instant payment
      treasury management services.`,
    keywords: ['RTP', 'The Clearing House', 'commercial payments', 'instant payments', 'treasury management'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2206',
    name: 'FedNow Request for Payment Not Implemented — Receivables Use Case Blocked',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital implements FedNow send capability for outbound credit transfers but defers
      the FedNow Request for Payment (RFP) message type, which enables billers and commercial
      clients to initiate payment requests that customers can approve and settle instantly. Without
      RFP support, the bank's commercial clients cannot migrate accounts receivable workflows to
      FedNow-based instant collection, the highest-value commercial use case in the FedNow
      operating procedures roadmap; competing community banks that launch RFP capability first
      capture the treasury management mandates that First Capital's commercial banking team
      targeted in its FedNow business case.`,
    keywords: ['FedNow', 'Request for Payment', 'accounts receivable', 'commercial banking', 'treasury management'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2207',
    name: 'Instant Payment Velocity Limits Not Risk-Stratified by Customer Segment',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital applies a flat daily velocity limit for FedNow and RTP outbound transactions
      that does not differentiate between consumer retail accounts, small business accounts, and
      commercial treasury accounts. The flat limit is calibrated to the risk tolerance for consumer
      accounts, creating a ceiling that blocks legitimate commercial disbursement volumes and forces
      relationship managers to manually approve limit exceptions for corporate clients; simultaneously,
      the limit is too high to meaningfully constrain social engineering fraud on consumer accounts
      where the CFPB's 2024 guidance on real-time payment scam liability recommends risk-based
      velocity controls tiered by customer profile and payment pattern.`,
    keywords: ['FedNow', 'RTP', 'velocity limits', 'CFPB', 'fraud controls'],
    demoRelevant: false,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2208',
    name: 'Core Banking System Not Updated to Post Real-Time Debit Before FedNow Credit Settles',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's core banking system processes account debits in batch cycles synchronized
      with its legacy ACH posting schedule, which conflicts with FedNow's requirement that the
      sending account balance be verified and debited in real time before the credit is sent to
      the Federal Reserve. The bank implements a workaround that places a temporary hold on the
      sender's account, but the hold logic has a race condition that fails for approximately 0.3%
      of transactions during high-volume periods — the rate is low enough to avoid automated alerts
      but accumulates into significant overdraft exposure and Reg E dispute volume over a quarter
      of FedNow operation at commercial payment scale.`,
    keywords: ['FedNow', 'core banking', 'Reg E', 'instant payments', 'overdraft risk'],
    demoRelevant: false,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2209',
    name: 'FedNow Error Handling Returns Generic Reject Codes Without R-Code Detail',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's FedNow integration surface presents a single generic payment failure
      message to consumers and commercial clients when transactions are rejected, obscuring the
      specific ISO 20022 status reason codes (AcntClosed, InsufficientFunds, DirectoryMismatch)
      that would allow the sender to take immediate corrective action. Without actionable
      error codes exposed in online banking and the commercial banking API, corporate treasury
      clients must contact the bank's operations center to diagnose rejected payments, increasing
      operational support cost and undermining the straight-through-processing efficiency that is
      the FedNow operating procedure's design premise for commercial clients.`,
    keywords: ['FedNow', 'ISO 20022', 'error handling', 'commercial payments', 'straight-through processing'],
    demoRelevant: false,
    subTopic: 'fednow-rtp',
  },

  // ── SWIFT ISO 20022 Migration ──────────────────────────────────────────────
  {
    code: 'B2210',
    name: 'SWIFT ISO 20022 Migration Without Field Mapping Validation Causes Truncation Errors',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital migrates to SWIFT ISO 20022 message formats (MT → MX) for correspondent
      banking traffic without conducting a field-level equivalence test between legacy MT 103
      structured fields and the new pacs.008 schema. Structured address fields in MT 103 — which
      SWIFT's migration guidelines require mapping to ISO 20022's postal address arrays — are
      truncated or dropped by the middleware translator; correspondent banks on the receiving end
      fail sanctions screening on the truncated sender addresses, delaying cross-border payments
      by 24–72 hours and causing First Capital's SWIFT gpi tracker to show an elevated
      payment-returned rate that the SWIFT oversight team flags for remediation.`,
    keywords: ['SWIFT ISO 20022', 'gpi', 'correspondent banking', 'OFAC', 'field mapping'],
    demoRelevant: true,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2211',
    name: 'SWIFT gpi Tracker Integration Gap Leaves Cross-Border Payment Status Opaque',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital completes SWIFT ISO 20022 migration for outbound message formatting but does
      not integrate the SWIFT gpi tracker status API into its commercial online banking portal.
      Corporate clients using First Capital for cross-border vendor payments cannot self-serve
      payment status, routing chain, and confirmation of credit — capabilities that SWIFT gpi's
      universal confirmation standard requires member banks to support by 2025. Commercial clients
      with frequent international supply chain payments escalate to the wire operations desk for
      status queries that gpi is designed to eliminate, creating a support cost that partially
      offsets the FX revenue from international payment corridors.`,
    keywords: ['SWIFT gpi', 'ISO 20022', 'cross-border payments', 'correspondent banking', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2212',
    name: 'Correspondent Bank SLA Degradation After ISO 20022 Transition Not Monitored',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital tracks correspondent bank SLA compliance based on SWIFT MT acknowledgement
      timestamps that reflected the legacy message format; after the ISO 20022 transition, the
      SLA measurement system is not reconfigured to capture MX message delivery and confirmation
      events from the gpi tracker. Correspondent banks that have degraded their same-day credit
      SLA during the MX migration period are not identified through the broken measurement system;
      corporate treasury clients experiencing delayed crediting on their international payment
      corridors file CFPB complaints about payment availability delays that First Capital cannot
      investigate without reconstructing the payment chain manually from SWIFT message logs.`,
    keywords: ['SWIFT gpi', 'ISO 20022', 'correspondent banking', 'CFPB', 'payment SLA'],
    demoRelevant: false,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2213',
    name: 'SWIFT MX Migration Coexistence Period Allows Duplicate Payment Risk',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `During the SWIFT coexistence period, First Capital's payment gateway accepts both MT 103
      and ISO 20022 pacs.008 formats for the same transaction corridors, with conversion handled
      at the gateway. A gap in the duplicate-payment detection logic fails to match an MT 103
      transaction with its pacs.008 retransmission when the reference number format differs
      between legacy and new schemas — a scenario documented in SWIFT's ISO 20022 migration guide
      as a common implementation risk. Three duplicate international wires totaling $2.8 million
      reach correspondent banks before the error is detected, requiring bilateral recovery
      negotiations and triggering an OCC operational risk incident report.`,
    keywords: ['SWIFT ISO 20022', 'duplicate payment', 'OCC operational risk', 'correspondent banking', 'NACHA'],
    demoRelevant: false,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2214',
    name: 'SWIFT Alliance Upgrade Delayed Past SWIFT-Mandated Deadline',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital defers the SWIFT Alliance Access software upgrade required to support ISO
      20022 native MX messaging, relying on a translation service through the coexistence period
      beyond the SWIFT-mandated cutover deadline for Tier 1 traffic. After the cutover deadline,
      SWIFT's oversight framework begins generating compliance flags for banks still operating
      on legacy MT-only infrastructure; the flags appear in correspondent bank due diligence
      profiles and delay First Capital's correspondent banking relationship renewals with two
      European banks that have internal policies requiring ISO 20022 native capability from
      US correspondent partners.`,
    keywords: ['SWIFT ISO 20022', 'Alliance Access', 'correspondent banking', 'ISO 20022 migration', 'compliance'],
    demoRelevant: false,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2215',
    name: 'LEI Validation Not Embedded in SWIFT ISO 20022 Payment Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's ISO 20022 payment processing workflow for SWIFT cross-border transactions
      does not include Legal Entity Identifier (LEI) validation for corporate originators,
      even though the ISO 20022 pacs.008 schema requires a valid LEI for institutional
      counterparties and SWIFT's migration standards expect LEI population for qualifying transactions.
      When corporate client LEIs expire without renewal, the field is populated with the expired
      identifier; receiving correspondent banks that validate LEI status via the Global LEI Foundation
      registry reject or delay payments, and First Capital's operations team lacks a proactive
      LEI expiry monitoring process to prevent the rejection before it reaches the correspondent.`,
    keywords: ['SWIFT ISO 20022', 'LEI', 'correspondent banking', 'cross-border payments', 'GLEI'],
    demoRelevant: false,
    subTopic: 'swift-migration',
  },

  // ── Fraud Controls ──────────────────────────────────────────────────────────
  {
    code: 'B2216',
    name: 'AI Fraud Model Calibration Lag Allows APP Fraud Surge on FedNow Channel',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's AI fraud detection model for instant payments is trained on a dataset that
      predates FedNow channel activation; the model's feature engineering reflects ACH and debit
      card behavioral patterns rather than the push-payment transaction topology that characterizes
      FedNow usage. Authorized push payment (APP) fraud — where a social engineering victim
      initiates the FedNow transfer themselves — presents as a normal customer-initiated transaction
      to the model, producing near-zero fraud scores for transactions that are systematically
      fraudulent. The OCC's 2024 Semiannual Risk Perspective identifies APP fraud model calibration
      lag as a systemic risk for FedNow early adopters, recommending that banks retrain fraud models
      on post-launch transaction data within 90 days of reaching sufficient volume.`,
    keywords: ['FedNow', 'APP fraud', 'AI fraud model', 'OCC Semiannual Risk Perspective', 'instant payments'],
    demoRelevant: true,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2217',
    name: 'Zelle APP Fraud Liability Exposure Without Written Error Resolution Procedures',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital participates in the Zelle Network and faces APP fraud liability under the
      CFPB's 2022 guidance that banks participating in peer-to-peer payment networks cannot
      categorically deny Reg E error resolution rights to consumers who are induced by fraud to
      initiate payments. The bank's Reg E written error resolution procedures do not address APP
      fraud on Zelle, classifying all customer-initiated Zelle transfers as authorized transactions
      categorically exempt from EFTA error resolution; when CFPB examiners review First Capital's
      Reg E procedures in 2024, the gap generates a supervisory finding requiring policy update and
      back-book remediation of denied APP fraud claims.`,
    keywords: ['Zelle', 'Reg E', 'APP fraud', 'CFPB', 'EFTA'],
    demoRelevant: true,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2218',
    name: 'First-Party Fraud Detection AI Not Tuned for Instant Payment Bust-Out Pattern',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's AI first-party fraud detection model is optimized to identify credit
      card bust-out schemes and deposit account kiting, but is not calibrated for the FedNow
      and RTP bust-out pattern where fraudsters establish small business accounts, build a
      three-to-six month transaction history to defeat onboarding models, and then initiate
      high-value instant payment withdrawals in a single session before account closure.
      The instant payment bust-out pattern exploits the irrevocability of FedNow credits —
      by the time the first-party fraud model fires a post-event alert, the funds have settled
      to an external institution and cannot be recalled, a loss topology that the OCC's 2024
      bank fraud guidance specifically calls out as an emerging risk for FedNow early adopters.`,
    keywords: ['FedNow', 'first-party fraud', 'AI fraud model', 'OCC', 'bust-out fraud'],
    demoRelevant: true,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2219',
    name: 'Scam Awareness Friction Not Inserted Into Instant Payment Confirmation Flow',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's FedNow and Zelle payment flows present a single-screen confirmation
      before irrevocable payment execution, without inserting the behavioral friction
      checkpoints — "Is anyone asking you to send this money?" — that the CFPB's 2023
      consumer protection guidance and the UK's Payment Systems Regulator's mandatory
      reimbursement model identify as effective APP fraud countermeasures. Banks that implement
      friction-based scam awareness prompts calibrated to transaction risk signals report a
      12–20% reduction in APP fraud losses without a statistically significant decline in
      legitimate payment completion rates; First Capital's flat confirmation screen leaves
      consumer protection solely to the pre-transaction AI fraud score.`,
    keywords: ['APP fraud', 'CFPB', 'Reg E', 'instant payments', 'FedNow'],
    demoRelevant: false,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2220',
    name: 'AI Fraud ML Model Drift Not Detected Without OCC MRM-Compliant Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital deploys an AI machine learning fraud detection model for real-time payment
      authorization without enrolling it in the SR 11-7 model monitoring program, treating the
      fraud vendor's internal monitoring reports as sufficient. The vendor monitors aggregate
      precision and recall at the portfolio level but does not provide First Capital with
      segment-level performance metrics for FedNow, Zelle, and RTP separately; when the FedNow
      channel's fraud pattern shifts seasonally, the aggregate portfolio metrics remain stable
      because the channel mix obscures segment-level drift. OCC examiners reviewing the bank's
      MRM program during the consent order follow-up find that the fraud AI model lacks any
      bank-supervised monitoring under SR 11-7, compounding the existing model governance deficiency.`,
    keywords: ['SR 11-7', 'AI fraud model', 'model monitoring', 'OCC examination', 'FedNow'],
    demoRelevant: true,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2221',
    name: 'Mule Account Detection AI Produces False Positive Surge on Legitimate SMB Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital deploys an AI mule account detection model to identify accounts receiving
      and forwarding instant payments in patterns consistent with money mule activity, but the
      model is trained on retail consumer data and misfires at a high rate on small business
      accounts with legitimate high-velocity inbound disbursements — payroll services, insurance
      claims administrators, and real estate settlement agents. The false positive rate among
      small business accounts is 18 times the rate among consumer accounts; when the model
      triggers account restrictions on a payroll service provider's FedNow-enabled disbursement
      account, First Capital faces both a Reg E dispute and a CFPB complaint from the
      downstream employees who did not receive their direct deposits on time.`,
    keywords: ['AI fraud model', 'mule accounts', 'FedNow', 'Reg E', 'CFPB'],
    demoRelevant: false,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2222',
    name: 'Real-Time Payment Fraud Chargeback Waterfall Not Mapped to Reg E Timeline',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital has not updated its Reg E error resolution procedures to reflect the
      irrevocability of FedNow and RTP transactions, leaving the error resolution team
      applying the legacy 45-business-day investigation window from the ACH Reg E framework
      to instant payment disputes. For irrevocable instant payment fraud, the bank has no
      recovery mechanism after the first 10–15 minutes post-settlement; the 45-day investigation
      period merely delays the recognition of a definitive loss rather than enabling recovery,
      and the CFPB's examination of First Capital's error resolution practices finds a systemic
      gap between the bank's Reg E procedures and the operational reality of instant payment
      finality.`,
    keywords: ['Reg E', 'FedNow', 'RTP', 'CFPB', 'error resolution'],
    demoRelevant: true,
    subTopic: 'fraud-controls',
  },

  // ── Cross-Border Payments ───────────────────────────────────────────────────
  {
    code: 'B2223',
    name: 'FX Settlement Without Intraday Liquidity Monitoring Creates Nostro Overdraft Risk',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's cross-border FX settlement relies on nostro account balances at
      correspondent banks denominated in EUR, GBP, and CAD, but the bank's treasury system
      monitors nostro positions at the end-of-day settlement cycle rather than on an intraday
      basis. As FedNow and RTP increase the volume of same-day international settlements routed
      through correspondent accounts, intraday nostro overdrafts occur when inbound FX receipts
      arrive after outbound disbursements have been executed; BCBS 239's Principle 6 on intraday
      liquidity monitoring requires that banks with material cross-currency settlement activity
      maintain intraday visibility into nostro balances, which First Capital's treasury platform
      does not support.`,
    keywords: ['FX settlement', 'BCBS 239', 'nostro', 'intraday liquidity', 'correspondent banking'],
    demoRelevant: false,
    subTopic: 'cross-border',
  },
  {
    code: 'B2224',
    name: 'OFAC Sanctions Screening Latency Incompatible With Instant Payment SLA',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's OFAC sanctions screening system for cross-border payments processes
      checks against the SDN list and consolidated sanctions lists in 1.2–2.4 seconds per
      transaction on average, which fits within Fedwire's near-real-time settlement window
      but consistently exceeds the FedNow 250-millisecond payment processing requirement.
      The compliance team's response — to run sanctions screening asynchronously after
      payment acceptance — creates a gap where funds may settle before a sanctions match
      is identified, requiring recall from the receiving institution under OFAC's remediation
      guidance and potentially triggering an OFAC self-disclosure for the interval during
      which sanctioned funds transited the bank's platform.`,
    keywords: ['OFAC', 'sanctions screening', 'FedNow', 'instant payments', 'SDN'],
    demoRelevant: true,
    subTopic: 'cross-border',
  },
  {
    code: 'B2225',
    name: 'Correspondent Banking De-Risking Narrows Cross-Border Coverage Without Contingency',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital loses two correspondent banking relationships in Southeast Asia as global
      banks continue de-risking their correspondent portfolios in regions with perceived elevated
      AML risk, leaving the bank with a single-corridor dependency for USD-to-PHP and USD-to-VND
      settlements that serve its mid-market commercial manufacturing clients. When the remaining
      correspondent bank raises its FX spread and minimum balance requirements, First Capital has
      no competitive fallback; the OCC's 2023 correspondent banking guidance on concentration risk
      flags single-correspondent exposure in material payment corridors as a third-party risk
      management deficiency requiring contingency planning under OCC Bulletin 2013-29.`,
    keywords: ['correspondent banking', 'OCC Bulletin 2013-29', 'de-risking', 'TPRM', 'FX settlement'],
    demoRelevant: false,
    subTopic: 'cross-border',
  },
  {
    code: 'B2226',
    name: 'CBUAE Real-Time Payment Reporting Requirement Missed in UAE Corridor Expansion',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital expands its commercial payment corridor to the UAE to serve fintech and
      investment clients, but the bank's compliance team does not discover the Central Bank of
      the UAE's (CBUAE) requirement for real-time transaction reporting to the national payment
      surveillance infrastructure for same-day USD/AED transfers. The reporting gap is identified
      during a CBUAE correspondent bank examination of First Capital's UAE-based correspondent
      partner; the correspondent bank is required to suspend transaction processing for First
      Capital until the reporting integration is implemented, creating a 23-day service interruption
      for clients dependent on the UAE corridor.`,
    keywords: ['CBUAE', 'cross-border payments', 'real-time reporting', 'correspondent banking', 'FX settlement'],
    demoRelevant: false,
    subTopic: 'cross-border',
  },
  {
    code: 'B2227',
    name: 'HKMA Real-Time Gross Settlement Reporting Gap in Hong Kong Dollar Corridor',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital processes HKD cross-border settlements for its commercial banking clients
      with Hong Kong-based trade finance counterparties through a correspondent banking
      arrangement, but does not file the Hong Kong Monetary Authority's (HKMA) required
      large-value payment reports for transactions above the HKD equivalent of USD 500,000.
      The HKMA's real-time gross settlement system reporting requirements apply to all USD-HKD
      transactions routed through the linked exchange rate system; the correspondent bank's
      compliance team notifies First Capital of the reporting deficiency after the HKMA's
      annual examination, and the retroactive report filing triggers a HKMA inquiry into the
      bank's correspondent governance framework.`,
    keywords: ['HKMA', 'cross-border payments', 'real-time gross settlement', 'correspondent banking', 'regulatory reporting'],
    demoRelevant: false,
    subTopic: 'cross-border',
  },
  {
    code: 'B2228',
    name: 'FX Netting Algorithm Not Updated for Intraday Settlement Windows',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's FX netting algorithm consolidates outgoing and incoming cross-border
      payments into end-of-day net settlement positions designed for the prior ACH settlement
      cycle, but FedNow and RTP instant credits to USD accounts generate funding needs in
      real time throughout the business day that the netting algorithm does not recognize.
      The treasury operations team manages intraday FX funding manually when the netting
      algorithm's end-of-day net position differs materially from the actual intraday funding
      requirement, introducing timing differences that amplify nostro overdraft exposure and
      create BCBS 239 intraday liquidity reporting inaccuracies.`,
    keywords: ['FX netting', 'BCBS 239', 'intraday liquidity', 'FedNow', 'treasury operations'],
    demoRelevant: false,
    subTopic: 'cross-border',
  },
  {
    code: 'B2229',
    name: 'LLM Sanctions Screening Without OFAC Legal Review Introduces Classification Risk',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's compliance team pilots a large language model (LLM) to reduce sanctions
      screening false positives by reasoning over name-matching alerts and contextual entity
      information to recommend "clear" or "review" dispositions without human analyst review.
      The LLM sanctions screening tool is deployed to production for transactions below $10,000
      without obtaining an OFAC legal review confirming that LLM-automated disposition of
      sanctions alerts is permissible under OFAC's enforcement program; OFAC's 2023 enforcement
      guidance requires that banks maintain a compliance program with human oversight for
      sanctions screening decisions, and automated LLM disposition without human verification
      constitutes a sanctions compliance control failure that OFAC can treat as a strict
      liability violation.`,
    keywords: ['OFAC', 'LLM', 'sanctions screening', 'SR 11-7', 'AI compliance'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },

  // ── Open Banking ────────────────────────────────────────────────────────────
  {
    code: 'B2230',
    name: 'CFPB 1033 Open Banking API Not Ready for October 2026 Large-Bank Deadline',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital has not begun the technical implementation of CFPB Rule 1033 open banking
      API infrastructure required for covered institutions by the October 2026 deadline for
      banks with total assets above $850 million. The bank's core banking vendor has not released
      a certified 1033-compliant API gateway, and the bank is treating the vendor's delivery
      timeline as authoritative without contingency; given that CFPB 1033 requires data providers
      to support authorized third-party access to account, transaction, and payment initiation
      data in standardized format, First Capital faces regulatory enforcement exposure if it
      misses the deadline and its commercial clients cannot leverage account aggregation and
      payment initiation for treasury management platforms.`,
    keywords: ['CFPB 1033', 'open banking', 'API', 'consumer data rights', 'third-party access'],
    demoRelevant: true,
    subTopic: 'open-banking',
  },
  {
    code: 'B2231',
    name: 'PSD2-Equivalent Open Banking API Tokenization Not Implemented for Commercial Clients',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's open banking API program for commercial clients uses static API keys for
      third-party provider (TPP) authentication rather than OAuth 2.0 token-based authorization
      with granular permission scopes required by CFPB 1033 and PSD2's Strong Customer
      Authentication framework. Static API keys cannot be revoked granularly when a TPP's
      authorization scope changes or when a commercial client terminates a treasury management
      application relationship; a revoked key disables all TPP access simultaneously, causing
      collateral disruption to other authorized integrations and creating an all-or-nothing access
      model that CFPB 1033 rulemaking explicitly disallows.`,
    keywords: ['CFPB 1033', 'PSD2', 'open banking', 'OAuth 2.0', 'third-party provider'],
    demoRelevant: false,
    subTopic: 'open-banking',
  },
  {
    code: 'B2232',
    name: 'TPP Authorisation Registry Not Maintained — Zombie API Access Persists',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's open banking API access management system grants TPP authorization tokens
      to fintech partners upon initial onboarding but does not maintain an active registry of
      current authorizations, authorized scopes, or last-use timestamps. When commercial clients
      terminate their fintech app subscriptions, the underlying API access tokens remain active
      in First Capital's authorization server indefinitely; CFPB 1033 requires data providers
      to support customer-directed revocation of TPP access within a defined timeframe, and
      the bank's inability to demonstrate that customer revocation requests terminate API
      access within 24 hours is a compliance gap identified during a CFPB supervisory examination.`,
    keywords: ['CFPB 1033', 'open banking', 'TPP authorisation', 'API governance', 'consumer data rights'],
    demoRelevant: true,
    subTopic: 'open-banking',
  },
  {
    code: 'B2233',
    name: 'Consent Management Platform Does Not Enforce Data Minimization at API Layer',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's open banking consent management platform captures customer authorization
      for "account and transaction data access" but does not enforce field-level data minimization
      at the API response layer — all data fields available for the authorized account types are
      returned regardless of the specific scope the customer authorized. CFPB 1033's data
      minimization principle requires that data providers return only the data elements necessary
      for the authorized purpose; when a CFPB examination reviews First Capital's 1033 consent
      implementation, the absence of field-level scope enforcement is cited as a failure to
      meet the rule's data protection standards, requiring a platform remediation that delays
      the bank's commercial open banking launch by six months.`,
    keywords: ['CFPB 1033', 'open banking', 'data minimization', 'consent management', 'API governance'],
    demoRelevant: false,
    subTopic: 'open-banking',
  },
  {
    code: 'B2234',
    name: 'Screen Scraping Prohibition Not Enforced as CFPB 1033 Transition Begins',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital does not block fintech aggregators from screen scraping its online banking
      portal during the CFPB 1033 transition period, citing competitive concerns about disrupting
      customers' existing budgeting app connections. Under CFPB 1033, data providers are
      prohibited from blocking covered third-party access through APIs while simultaneously
      permitted to block screen scraping that violates their terms of service; First Capital's
      decision to allow continued screen scraping exposes customer credentials to aggregators'
      credential storage practices, creating a cybersecurity risk that the OCC's IT examination
      framework flags as inconsistent with the bank's own information security policy.`,
    keywords: ['CFPB 1033', 'open banking', 'screen scraping', 'OCC IT examination', 'credential security'],
    demoRelevant: false,
    subTopic: 'open-banking',
  },
  {
    code: 'B2235',
    name: 'Open Banking API Rate Limits Cause Treasury Management Platform Failures',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's CFPB 1033-compliant open banking API applies a rate limit of 100 requests
      per minute per TPP connection, which is sufficient for consumer account aggregation but
      insufficient for commercial treasury management platforms that poll account balances and
      transaction data at high frequency for cash positioning. When a commercial treasury software
      provider's integration hits the rate limit during the end-of-day cash concentration window,
      the cash positioning report fails to update, causing manual treasury operations interventions
      that eliminate the efficiency gain the open banking integration was intended to deliver and
      prompting the treasury client to evaluate moving the account relationship to a bank with
      higher API rate limits.`,
    keywords: ['CFPB 1033', 'open banking', 'API', 'treasury management', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'open-banking',
  },

  // ── AI in Payments ──────────────────────────────────────────────────────────
  {
    code: 'B2236',
    name: 'AI Fraud Detection Model Drift Undetected Without SR 11-7 OCC MRM Compliance',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's AI real-time payments fraud detection model experiences gradual concept
      drift as FedNow and RTP transaction mix shifts from consumer disbursements to commercial
      payroll and vendor payments, but the vendor's monitoring reports use aggregate metrics
      that mask segment-level drift. The bank's SR 11-7 model monitoring program does not
      include this vendor AI model in its formal monitoring scope because it is classified as
      an operational tool rather than a decision model; OCC examiners reviewing the bank's
      model risk governance under the consent order find that an AI model directly controlling
      whether customer payments are processed or blocked — a material decision — is outside
      the SR 11-7 monitoring perimeter, requiring immediate remediation.`,
    keywords: ['SR 11-7', 'AI fraud model', 'model drift', 'OCC MRM', 'instant payments'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2237',
    name: 'GenAI Dispute Resolution Automation Without Reg E Compliance Review',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's digital banking team deploys a GenAI-powered dispute resolution workflow
      that automatically classifies incoming customer disputes for FedNow, Zelle, and debit card
      transactions and generates preliminary resolution letters without human analyst review.
      The GenAI system is not reviewed by the bank's compliance team for Reg E accuracy before
      deployment; within 90 days of launch, the system systematically misclassifies APP fraud
      disputes as unauthorized transfer claims — qualifying for Reg E protection — versus
      authorized transfer disputes that do not, reversing the correct legal distinction and
      generating $340,000 in remediation liability before the classification error is identified
      through a CFPB complaint sample review.`,
    keywords: ['Reg E', 'GenAI', 'dispute resolution', 'CFPB', 'APP fraud'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2238',
    name: 'AI-Powered Payment Routing Optimization Not Validated Under SR 11-7',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's treasury operations team deploys an AI payment routing optimization
      model that dynamically selects between FedNow, same-day ACH, RTP, and Fedwire for
      outbound commercial payments based on cost, speed, and liquidity optimization signals.
      The AI routing model influences which payment rail is used for time-sensitive commercial
      transactions and is therefore a decision model under SR 11-7's definition; it is not
      registered in the model inventory, not validated, and not monitored, creating an OCC
      model governance gap that is compounded when the model misroutes a time-critical
      real estate closing payment to same-day ACH rather than FedNow, causing a settlement
      delay that the client's counsel cites in a contract dispute.`,
    keywords: ['SR 11-7', 'AI payment routing', 'FedNow', 'model inventory', 'commercial payments'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2239',
    name: 'LLM-Based AML Narrative Generation Not Validated for FinCEN SAR Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AML operations team uses a large language model (LLM) to draft Suspicious
      Activity Report (SAR) narratives from structured alert data, reducing analyst drafting
      time by 60% without reducing the review step. The LLM tool is not validated under SR 11-7
      because it is classified as a writing assistant rather than a decision model; however,
      FinCEN's SAR filing requirements mandate that narratives describe the 5W elements of
      suspicious activity with specificity, and the LLM consistently produces generic narratives
      that pass analyst review but lack the transaction-specific detail that FinCEN's examination
      team expects in quality SAR filings, resulting in a FinCEN feedback letter requesting
      SAR quality remediation.`,
    keywords: ['LLM', 'SAR', 'FinCEN', 'AML', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2240',
    name: 'AI Payment Anomaly Detection Generates False Positive Holds on Commercial Payroll',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's AI payment anomaly detection system flags unusual transaction patterns
      by comparing current payment behavior against a 90-day rolling baseline; when a commercial
      payroll processing client switches from biweekly ACH payroll to weekly FedNow disbursements,
      the change in payment velocity and timing triggers automated account holds that block
      payroll payments for 1,200 of the client's employees. The AI model's anomaly threshold
      is not risk-stratified by client type — commercial payroll processors have legitimately
      high-velocity, predictable payment patterns that differ structurally from retail account
      baselines — and the false positive hold creates a Reg E escalation and relationship
      management incident that is escalated to the bank's COO.`,
    keywords: ['AI fraud model', 'FedNow', 'Reg E', 'commercial payments', 'payroll'],
    demoRelevant: false,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2241',
    name: 'ML Transaction Monitoring Model Retrained on Incomplete Post-FedNow Data',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital retrains its ML-based AML transaction monitoring model on six months of
      post-FedNow launch data, but the training dataset is skewed toward the bank's early
      FedNow adopter population — predominantly small business clients — and does not represent
      the consumer segment that onboards to FedNow in the following two quarters. The retrained
      model produces a high false-negative rate for money mule typologies in the consumer FedNow
      segment because the training data lacked sufficient examples; SR 11-7's conceptual soundness
      requirements demand that the training data's representativeness of the deployment population
      be documented and validated by the IVU, which did not occur before retraining deployment.`,
    keywords: ['SR 11-7', 'AML', 'ML transaction monitoring', 'FedNow', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2242',
    name: 'AI-Based Payment Scheduling Optimizer Creates Liquidity Concentration on Settlement Dates',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital deploys an AI-based commercial payment scheduling optimizer that recommends
      optimal payment timing for corporate treasury clients based on intraday liquidity cost
      signals and FedNow capacity utilization data. The optimizer learns that recommending
      payments in the 9:00–10:00 AM settlement window minimizes cost, but the aggregate effect
      of all clients following the AI recommendation creates a liquidity concentration that
      strains the bank's master account balance during that window — a correlated behavior
      that the model does not account for because it optimizes for individual client outcomes
      without modeling the portfolio-level liquidity externality.`,
    keywords: ['FedNow', 'AI payment scheduling', 'intraday liquidity', 'BCBS 239', 'treasury management'],
    demoRelevant: false,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2243',
    name: 'AI-Assisted FX Rate Lock for Instant Payments Not Validated for Reg E Accuracy',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's mobile banking platform uses an AI model to display a predictive FX rate
      lock for international instant payments, pre-populating the expected converted amount in
      the consumer payment confirmation screen before the actual FX quote is obtained from the
      correspondent bank. The AI-predicted rate occasionally diverges from the actual executed
      rate by more than 0.5%, leading to disclosures on Reg E payment confirmations that differ
      from the actual executed amount; the CFPB's 2019 international money transfer rule under
      EFTA requires that pre-payment disclosures state the actual exchange rate, and AI-predicted
      rates that are not the actual executed rate create a systematic disclosure accuracy
      deficiency.`,
    keywords: ['Reg E', 'EFTA', 'AI', 'FX rate', 'CFPB'],
    demoRelevant: false,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2244',
    name: 'GenAI Payment Instruction Parsing Introduces Misdirection Risk for Wire Transfers',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial banking digital platform uses a GenAI model to parse
      unstructured payment instructions submitted by corporate clients via secure message —
      extracting beneficiary account numbers, routing numbers, and amounts from natural
      language wire instructions without a human review step for transactions under $50,000.
      When a corporate client submits a wire instruction that contains a typographical error
      in the beneficiary account number, the GenAI parser applies a best-guess correction
      that routes the payment to an incorrect account at the same routing number; under
      Reg J and OCC wire transfer guidelines, the bank bears liability for misdirected
      wires where the bank's processing — not the customer's instruction — caused the error.`,
    keywords: ['GenAI', 'wire transfer', 'Reg J', 'OCC', 'payment instruction parsing'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },

  // ── Additional Cross-Cutting Payments Patterns ─────────────────────────────
  {
    code: 'B2245',
    name: 'NACHA Same-Day ACH Return Rate Exceeds Threshold Without Originator Controls',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's same-day ACH origination volume grows significantly as commercial clients
      migrate from next-day ACH to same-day for time-sensitive vendor payments, but the bank's
      originator screening and return rate monitoring are calibrated for the legacy next-day
      ACH population. When a commercial client's same-day ACH payroll file generates a return
      rate above the NACHA Operating Rules' 15% administrative return threshold, NACHA's
      compliance team notifies First Capital and requires a return rate remediation plan; First
      Capital's ODFI (originating depository financial institution) obligations under NACHA rules
      require the bank to monitor originator return rates and terminate access for persistent
      violators, a process the bank has not formalized for the same-day ACH channel.`,
    keywords: ['NACHA', 'same-day ACH', 'return rate', 'ODFI', 'commercial payments'],
    demoRelevant: false,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2246',
    name: 'Reg CC Funds Availability Rules Not Updated for Instant Payment Credits',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's Reg CC funds availability disclosures describe next-business-day
      availability for ACH credits and continue to apply the Reg CC standard holds to
      FedNow and RTP credits even though instant payment credits settle with immediate
      finality and CFPB's Reg CC staff commentary confirms that banks must make instantly
      settled funds available without imposing standard hold schedules. The bank's core
      banking system applies a four-hour availability hold to FedNow credits as a
      conservative default inherited from the ACH configuration; affected consumers file
      CFPB complaints when they cannot access FedNow-received funds that the bank has
      confirmed in the transaction history as settled.`,
    keywords: ['Reg CC', 'FedNow', 'CFPB', 'funds availability', 'instant payments'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2247',
    name: 'Wire Transfer Anti-Fraud Callback Procedure Not Applied to Instant Payment Channels',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital maintains a callback verification procedure for wire transfers above $25,000
      where a banker calls the instructing customer on a known phone number to confirm the
      payment before release, a social engineering fraud countermeasure required by the bank's
      own commercial banking policy. The callback procedure is not extended to FedNow and RTP
      commercial payments, which are treated as digital-channel self-service transactions not
      subject to the same controls; when a business email compromise (BEC) attack induces a
      controller to initiate a $180,000 FedNow payment to a fraudulent vendor account, the
      absence of the callback control that would have applied to a wire of the same amount
      results in an irrecoverable loss.`,
    keywords: ['FedNow', 'BEC fraud', 'wire transfer', 'commercial payments', 'NACHA'],
    demoRelevant: true,
    subTopic: 'fraud-controls',
  },
  {
    code: 'B2248',
    name: 'Overlay Service Integration Delays FedNow Adoption by Commercial Clients',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      `First Capital launches FedNow as a raw payment rail capability without integrating
      the overlay services — Request for Payment, payment status notifications, and remittance
      data pass-through — that commercial treasury management platforms require to migrate
      from ACH workflows. The FedNow operating procedures define overlay services as optional
      but enterprise treasury platforms treat them as prerequisites for commercial adoption;
      First Capital's commercial banking team has 11 commercial clients on FedNow pilot
      waiting lists that cannot migrate because their ERP systems require the remittance
      data overlay to achieve automatic invoice matching, delaying the bank's commercial
      FedNow revenue by two quarters.`,
    keywords: ['FedNow', 'overlay services', 'commercial payments', 'treasury management', 'instant payments'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2249',
    name: 'Cross-Border ISO 20022 Structured Address Requirements Not Met for US Correspondent',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's cross-border payment messages submitted through SWIFT for USD correspondent
      clearing continue to use unstructured address fields in the debtor and creditor address
      elements, even after the SWIFT ISO 20022 migration mandate requires structured address
      formatting for US dollar corridor transactions. Receiving correspondent banks in the EU
      that are compliant with the European Payments Council's structured address requirements
      under SEPA Credit Transfer are unable to auto-process First Capital's messages, generating
      manual intervention queues and correspondent SLA breaches on payment corridors where
      First Capital competes on speed as a differentiator for commercial clients.`,
    keywords: ['SWIFT ISO 20022', 'structured address', 'correspondent banking', 'SEPA', 'cross-border payments'],
    demoRelevant: false,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2250',
    name: 'Payment Hub Vendor Lock-In Blocks FedNow Feature Upgrades',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deployed FedNow through a payment hub vendor under a five-year software
      contract that grants the vendor exclusive authority over interface changes and network
      feature configurations. When the FedNow Service releases new overlay service capabilities
      and updated ISO 20022 message versions, First Capital cannot implement them independently
      — each change requires a paid change order from the payment hub vendor, and the vendor's
      delivery backlog extends 8–12 months. OCC Bulletin 2023-17 on technology service provider
      risk requires banks to assess vendor concentration risk and exit feasibility for critical
      payment infrastructure; the payment hub contract lacks a data portability clause and a
      source code escrow arrangement, making exit prohibitively expensive.`,
    keywords: ['FedNow', 'OCC Bulletin 2013-29', 'vendor lock-in', 'TPRM', 'payment hub'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2251',
    name: 'SWIFT gpi Stop and Recall Feature Not Tested Before Cross-Border Launch',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital enables SWIFT gpi for cross-border payments without completing
      end-to-end testing of the gpi Stop and Recall (gSRP) workflow, which allows
      originators to halt in-flight payments after transmission but before final credit
      at the beneficiary bank. When a corporate client requests cancellation of a
      $750,000 international vendor payment within 30 minutes of instruction due to
      a contract dispute, First Capital's operations team discovers that the gSRP
      request is successfully transmitted on the SWIFT network but the receiving
      correspondent bank does not respond within the gpi SLA because the bank has not
      activated its own gSRP processing, leaving the payment to settle despite the recall
      request.`,
    keywords: ['SWIFT gpi', 'Stop and Recall', 'cross-border payments', 'correspondent banking', 'ISO 20022'],
    demoRelevant: false,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2252',
    name: 'Real-Time Payment Customer Notification Latency Breaches Reg E Disclosure Requirements',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's push notification system for FedNow and RTP transaction alerts
      uses a batch notification queue that fires every 5 minutes, creating a lag between
      instant payment settlement and the customer notification that Reg E §205.10 requires
      banks to provide at the time of the electronic fund transfer when using electronic
      means of disclosure. CFPB's Reg E examination guidance expects that transaction notifications
      accompanying instant payment credits and debits be delivered within the same approximate
      timeframe as the transaction itself; the 5-minute batch queue is identified in a CFPB
      supervisory examination as inconsistent with the contemporaneous disclosure standard
      that real-time payments create.`,
    keywords: ['Reg E', 'FedNow', 'CFPB', 'customer notification', 'instant payments'],
    demoRelevant: false,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2253',
    name: 'AI-Based Beneficiary Name Matching Produces Disparate Error Rate Across Name Origins',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI beneficiary name matching model for instant payment fraud
      detection that compares the payment instruction name against the beneficiary account
      holder name on file, flagging mismatches for manual review. The AI model is trained
      on a dataset dominated by Western European name formats and produces a false positive
      rate 3.8 times higher for beneficiary names of South and Southeast Asian origin than
      for European-origin names due to transliteration variation in the training data.
      The CFPB's fair lending and UDAP examination framework covers payment service discrimination;
      a beneficiary name matching model that imposes disparate operational friction on
      customers by name origin is a potential ECOA and UDAP exposure that the bank has
      not assessed through a disparate impact analysis.`,
    keywords: ['AI fraud model', 'CFPB', 'ECOA', 'UDAP', 'instant payments'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2254',
    name: 'Instant Payment API Rate Limiting Creates Timeout Failures During Payroll Peaks',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's FedNow API gateway applies global rate limits that are sized for
      average daily volume rather than peak disbursement windows, causing API timeout errors
      during the first three business days of each month when commercial clients initiate
      large payroll and vendor payment batches simultaneously. The timeout errors cause
      the bank's payment orchestration layer to re-queue failed payment initiation attempts
      with exponential backoff, which further compounds the API queue depth during peak
      windows and creates a self-reinforcing congestion pattern. FedNow operating procedures
      require participants to maintain sufficient technical capacity to process their contracted
      transaction volumes without degradation; the recurring peak timeouts are documented as
      a FedNow participant certification compliance gap in the bank's annual self-assessment.`,
    keywords: ['FedNow', 'API', 'instant payments', 'commercial payments', 'payment orchestration'],
    demoRelevant: false,
    subTopic: 'fednow-rtp',
  },
  {
    code: 'B2255',
    name: 'SWIFT MT 202 Cover Payments Not Converted to ISO 20022 for Sanctions Visibility',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital continues to originate SWIFT MT 202 cover payments for certain commercial
      FX transactions even after the ISO 20022 migration mandate, because the bank's treasury
      system does not yet support pacs.009 cover payment messages natively. SWIFT's Financial
      Crimes Compliance team and OFAC's guidance both note that MT 202 cover messages
      lack originator and beneficiary information in the message itself, making sanctions
      screening at intermediate correspondent banks impossible and creating an OFAC compliance
      gap that the ISO 20022 pacs.009 format addresses by carrying full counterparty data
      throughout the payment chain. The bank's continued reliance on MT 202 for cover payments
      is a known OFAC examination risk that the compliance team has documented but not remediated.`,
    keywords: ['SWIFT ISO 20022', 'OFAC', 'MT 202', 'correspondent banking', 'sanctions screening'],
    demoRelevant: true,
    subTopic: 'swift-migration',
  },
  {
    code: 'B2256',
    name: 'Open Banking Payment Initiation API Exposes Unintended Overdraft Capability',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's CFPB 1033-compliant payment initiation API for authorized TPPs does
      not enforce the bank's standard overdraft limit policy at the API layer, instead relying
      on the core banking system to apply overdraft controls post-authorization. A fintech
      payment application's integration exploits a timing gap between the API authorization
      response and the core banking debit posting, initiating two concurrent FedNow payments
      that together exceed the account balance but each individually pass the overdraft check;
      the concurrent payment execution creates unauthorized overdraft exposure and a
      Reg E dispute from the account holder who did not understand that the fintech app
      could initiate multiple simultaneous instant payments.`,
    keywords: ['CFPB 1033', 'open banking', 'FedNow', 'Reg E', 'overdraft'],
    demoRelevant: false,
    subTopic: 'open-banking',
  },
  {
    code: 'B2257',
    name: 'AI Chargeback Prediction Model Used in Instant Payment Dispute Triage Without Validation',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an AI chargeback prediction model originally trained on debit
      card dispute data to triage incoming FedNow and RTP transaction disputes, prioritizing
      high-confidence reimbursement cases for fast-track resolution and deprioritizing cases
      with low predicted reimbursement probability. The AI model is not validated for the
      instant payment channel under SR 11-7, and its training data predates FedNow launch;
      when the model systematically assigns low reimbursement probability to APP fraud disputes
      on the FedNow channel — because APP fraud has no equivalent in the debit card training
      dataset — high-value APP fraud victims receive delayed resolutions that exceed Reg E's
      10-business-day provisional credit timeline, triggering CFPB complaints.`,
    keywords: ['SR 11-7', 'AI chargeback model', 'Reg E', 'APP fraud', 'FedNow'],
    demoRelevant: true,
    subTopic: 'ai-payments',
  },
  {
    code: 'B2258',
    name: 'Payment Tokenization for Commercial API Clients Not PCI DSS Compliant',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial open banking API transmits account numbers as plaintext in
      the payment initiation payload rather than using tokenized account references as required
      by PCI DSS 4.0 for systems that transmit payment account data across network boundaries.
      The API was designed before the bank's PCI scope assessment was extended to cover CFPB
      1033 payment initiation endpoints; a third-party penetration test commissioned as part
      of the bank's OCC IT examination preparation identifies the plaintext account transmission
      as a PCI DSS 4.0 Requirement 4.2.1 violation, requiring an emergency API update and
      re-issuance of all active TPP integration credentials.`,
    keywords: ['PCI DSS 4.0', 'open banking', 'CFPB 1033', 'API security', 'OCC IT examination'],
    demoRelevant: false,
    subTopic: 'open-banking',
  },
  {
    code: 'B2259',
    name: 'Instant Payment Liquidity Stress Test Not Incorporated Into DFAST Scenario',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's DFAST liquidity stress scenario does not include a scenario in which
      FedNow and RTP instant payment volumes surge by 5–10× during a market stress event
      as commercial depositors accelerate outbound payments before expected bank strain —
      a behavioral channel that the FDIC's 2023 bank run analysis identified as amplified by
      instant payment infrastructure in the Silicon Valley Bank and Signature Bank failures.
      The bank's DFAST stress model treats payment system volumes as stable in the adverse
      scenario; the OCC's updated DFAST guidance following the 2023 bank stress events
      expects covered institutions to model the liquidity acceleration effect of instant payment
      infrastructure in their adverse scenarios, a gap in First Capital's 2025 DFAST submission.`,
    keywords: ['DFAST', 'FedNow', 'intraday liquidity', 'OCC', 'liquidity stress'],
    demoRelevant: true,
    subTopic: 'fednow-rtp',
  },
];
