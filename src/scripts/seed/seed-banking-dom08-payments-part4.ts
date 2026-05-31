// seed-banking-dom08-payments-part4.ts
// Banking genome patterns — Payments & Transaction Processing
// Code range: B2380–B2439  (60 patterns)
// Sub-topics: iso20022-migration (12), cbdc-digital-currency (8),
//             payment-resilience (10), ai-payments-part4 (18, all aiInsertionRisk: true),
//             payment-regulation (12)
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

export const BANKING_DOM08_PAYMENTS_PART4_PATTERNS: PatternSeed[] = [

  // ── ISO 20022 Migration ───────────────────────────────────────────────────

  {
    code: 'B2380',
    name: 'ISO 20022 Structured Address Fields Mapped to Unstructured Legacy Core Fields',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's ISO 20022 CBPR+ migration maps the structured postal address block
      in pacs.008 messages — which contains discrete street, building, city, and country
      subfields — to a single free-text address field in the core banking system, collapsing
      the structured data into an unstructured concatenated string. The collapsed address
      data cannot be parsed back into structured components for outbound ISO 20022 messages
      on the return leg, forcing the bank to send pacs.008 messages with unstructured address
      blocks that fail the ISO 20022 schema validation checks of receiving banks that have
      implemented strict structured-field enforcement, generating a payment rejection rate of
      6–8% on return-leg cross-border messages that was not present in the legacy MT103 flow.`,
    keywords: ['ISO 20022', 'SWIFT CBPR+', 'pacs.008', 'address mapping', 'core banking'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2381',
    name: 'ISO 20022 Purpose Code Population Not Mandated for Corporate Originator Submissions',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `The ISO 20022 pacs.003 and pacs.008 message schemas include a structured purpose code
      field that identifies the economic purpose of the payment — payroll, trade settlement,
      securities purchase, or tax payment — which regulators in receiving jurisdictions use for
      AML transaction categorization and capital flow monitoring. First Capital's commercial
      online banking platform does not require corporate originators to populate the purpose
      code field, because the legacy NACHA and SWIFT MT103 formats did not carry equivalent
      structured codes, and the bank's implementation team treats the field as optional. Receiving
      central banks in the European Economic Area and Southeast Asia are beginning to reject
      inbound ISO 20022 payments without populated purpose codes for transactions above defined
      thresholds, causing First Capital's corporate clients to experience unexpected payment
      rejections in corridors where purpose code is now mandatory.`,
    keywords: ['ISO 20022', 'purpose code', 'SWIFT CBPR+', 'AML', 'cross-border payments'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2382',
    name: 'ISO 20022 LEI Validation Not Enforced for Non-Financial Corporate Counterparties',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `The SWIFT CBPR+ ISO 20022 migration requires that Legal Entity Identifier codes be
      included in pacs.008 payment messages for financial institution counterparties, but
      the mandate does not yet extend to non-financial corporate originators in all corridors.
      First Capital's middleware layer applies LEI validation only to pacs.009 financial
      institution credit transfers and bypasses LEI validation entirely for corporate-originated
      pacs.008 messages, allowing payments with blank or syntactically invalid LEI fields to
      enter the SWIFT network. When the BIS CPMI's expected 2026 extension of LEI requirements
      to high-value corporate payments takes effect, First Capital's middleware will reject or
      hold a significant proportion of corporate payment volume that was previously passing
      without LEI validation, creating an operational stoppage that requires an emergency
      middleware update.`,
    keywords: ['ISO 20022', 'LEI', 'SWIFT CBPR+', 'pacs.008', 'BIS CPMI'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2383',
    name: 'Fedwire Funds ISO 20022 Cutover Testing Window Not Allocated in Change Management Calendar',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `The Federal Reserve's Fedwire Funds Service ISO 20022 migration requires all participant
      banks to complete mandatory industry testing in the FedLine testing environment before
      the production cutover date. First Capital's project management office has not allocated
      a dedicated testing window in the bank's change management calendar, scheduling the
      Fedwire ISO 20022 testing to share infrastructure with the bank's concurrent core
      banking upgrade project. The resource conflict means that First Capital's payments
      technology team has not completed the required FedLine test scenarios as of the
      Federal Reserve's published testing deadline, placing the bank at risk of being placed
      in a contingency operating mode on the Fedwire production cutover date that restricts
      outbound same-day wire capacity to legacy XML message formats.`,
    keywords: ['Fedwire', 'ISO 20022', 'Federal Reserve', 'change management', 'payments modernisation'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2384',
    name: 'SWIFT MX Migration Coexistence Period MT-MX Translation Introduces Character Set Errors',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `During the SWIFT MX coexistence period, First Capital's SWIFT service bureau translates
      inbound ISO 20022 MX messages to legacy MT format for delivery to the bank's core banking
      system, which has not yet been upgraded to process MX natively. The translation layer
      does not correctly handle non-ASCII characters in beneficiary names — particularly
      accented Latin characters used in French, German, and Spanish legal entity names — converting
      them to question marks or ASCII substitutions in the MT output. The character substitution
      corrupts beneficiary name fields in the core system, causing OFAC screening false positives
      when the corrupted name no longer exactly matches the beneficiary name on file, and
      generating downstream compliance documentation errors in the bank's AML transaction
      narrative records.`,
    keywords: ['SWIFT', 'ISO 20022', 'MX migration', 'character encoding', 'OFAC screening'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2385',
    name: 'RTP ISO 20022 Reject Message Reason Codes Not Surfaced to Commercial Online Banking Users',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `The RTP network's ISO 20022 messaging infrastructure returns structured reject reason codes
      in pacs.002 negative acknowledgment messages when a payment cannot be processed — including
      codes for account closed, routing number invalid, and receiver's credit transfer limit exceeded.
      First Capital's commercial online banking platform receives these pacs.002 messages and logs
      the structured reason code in the bank's payment operations system, but the commercial
      banking user interface displays only a generic "payment could not be processed" message
      without translating the ISO 20022 reason code into actionable plain-language guidance.
      Commercial clients receiving generic rejection messages must call the bank's treasury
      services team to determine the correction required, a friction point that drives RTP
      adoption abandonment in the commercial segment compared to peer institutions that surface
      structured reject reasons in their portals.`,
    keywords: ['RTP', 'ISO 20022', 'pacs.002', 'commercial banking', 'The Clearing House'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2386',
    name: 'ISO 20022 Remittance Information Field Character Limit Not Communicated to Corporate Clients',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `ISO 20022 pacs.008 messages support up to 140 characters of unstructured remittance
      information in the RmtInf field, but the Fedwire Funds Service ISO 20022 implementation
      truncates this field to 140 characters at the network level, while some European
      correspondent banks enforce a tighter 70-character limit for interoperability with
      legacy systems. First Capital's commercial treasury portal does not display a character
      counter or enforce the effective limit in the remittance information entry field, allowing
      corporate clients to submit payment instructions with remittance narratives that are
      silently truncated at the network or correspondent level. Corporate treasurers discover
      the truncation only when their accounts payable reconciliation systems flag missing
      invoice references, typically days after settlement, triggering reconciliation escalations
      against the bank's treasury services team.`,
    keywords: ['ISO 20022', 'Fedwire', 'remittance information', 'corporate treasury', 'RmtInf'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2387',
    name: 'ISO 20022 Financial Institution Credit Transfer pacs.009 Routing Breaks Intragroup Treasury',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital processes intragroup treasury sweeps for its commercial clients using
      Fedwire Funds pacs.009 financial institution credit transfer messages after the ISO 20022
      migration, but the bank's middleware does not correctly populate the InstrForCdtrAgt
      (instruction for creditor agent) field that intragroup treasury systems use to route
      funds to the correct subsidiary account in multi-entity corporate structures.
      The missing routing instruction causes intragroup sweeps to credit the parent entity's
      master account rather than the designated subsidiary, requiring daily manual correction
      by the bank's treasury services operations team. The error affects 14 corporate clients
      and has persisted for three months post-migration because the pacs.009 issue was not
      included in the bank's pre-migration ISO 20022 test scenario library.`,
    keywords: ['ISO 20022', 'pacs.009', 'Fedwire', 'intragroup treasury', 'corporate payments'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2388',
    name: 'ISO 20022 Migration Project Scope Excludes Payment Sanctions Screening Engine Upgrade',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's ISO 20022 migration project scope is defined by the payments technology
      team and focuses on message format translation and core system field mapping, but explicitly
      excludes the upgrade of the bank's payment sanctions screening engine because it is
      managed by a separate compliance technology team on a different budget cycle. The
      sanctions screening engine remains calibrated to parse SWIFT MT field positions for
      name and address extraction; when fed ISO 20022 MX-sourced transaction records where
      the same data is in XML element tags rather than positional fields, the engine extracts
      names and addresses from incorrect XML elements, producing both false positive and false
      negative screening results. OFAC's 2024 compliance framework guidance holds banks
      responsible for screening accuracy regardless of message format migration schedules.`,
    keywords: ['ISO 20022', 'OFAC screening', 'sanctions compliance', 'SWIFT MX', 'payments modernisation'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2389',
    name: 'ISO 20022 Adoption Reporting to Federal Reserve Not Completed Within Required Timeframe',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `The Federal Reserve requires Fedwire Funds Service participants to submit implementation
      readiness attestations and progress reporting at defined milestones before the ISO 20022
      production cutover. First Capital's project management office tracks the ISO 20022
      migration internally but does not have a dedicated Federal Reserve reporting workflow;
      the milestone attestation submissions are assigned to the bank's regulatory reporting
      team as a secondary task, resulting in two milestone attestations being submitted after
      the Federal Reserve's required submission window. Late attestation submissions are flagged
      by the Federal Reserve's Fedwire participation monitoring team, which treats late reporting
      as an indicator of insufficient migration readiness and places the bank on an enhanced
      monitoring track that requires bi-weekly status calls with Federal Reserve operations staff.`,
    keywords: ['Fedwire', 'ISO 20022', 'Federal Reserve', 'regulatory reporting', 'payments modernisation'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2390',
    name: 'ISO 20022 Data Archival Strategy Retains Only Translated MT Records Not Original MX Messages',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's payment records archival system stores the MT-translated version of
      inbound ISO 20022 MX messages rather than the original MX-format record, because the
      core banking system's archival module was not updated to handle XML-structured content
      before the migration go-live. When law enforcement issues a subpoena requiring production
      of the original payment instruction as received — including all enriched ISO 20022
      structured fields — First Capital can only produce the MT-translated record, which has
      discarded LEI codes, structured address elements, and purpose codes present in the
      original MX message. The OCC's records retention examination team cites the translated-only
      archival as a deficiency under 12 CFR Part 12, which requires retention of the original
      transaction record in the form received.`,
    keywords: ['ISO 20022', 'SWIFT MX', 'records retention', 'OCC', 'payment archival'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2391',
    name: 'ISO 20022 Training for Operations Staff Limited to Vendor Slides With No Hands-On Testing',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's ISO 20022 migration change management program delivers ISO 20022 awareness
      training to payments operations staff through vendor-provided slide decks and a 90-minute
      webinar, but does not include hands-on simulation exercises using the new message format
      in the bank's test environment. When the production cutover occurs, operations staff
      attempting to manually investigate payment exceptions encounter ISO 20022 XML message
      structures they have only seen in slides, causing significantly longer exception resolution
      times in the first 60 days post-cutover. The McKinsey 2024 payments modernization report
      identifies hands-on operator training as the single most important determinant of
      post-cutover operational error rates in ISO 20022 migrations, with banks that omit
      simulation training experiencing 3–5 times higher manual intervention rates in the
      first quarter after cutover.`,
    keywords: ['ISO 20022', 'payments modernisation', 'change management', 'operations training', 'SWIFT'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },

  // ── CBDC & Digital Currency ───────────────────────────────────────────────

  {
    code: 'B2392',
    name: 'FedNow Positioned as CBDC Substitute Without Addressing Programmability Demand',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's payments strategy positions FedNow instant payment adoption as its
      complete response to commercial client demand for programmable payment capabilities,
      without acknowledging that FedNow's credit-push architecture does not support the
      smart-contract-triggered conditional payment execution that enterprise treasury clients
      are evaluating through wholesale CBDC pilots. Commercial clients in the bank's treasury
      management segment who are participating in BIS Innovation Hub and Federal Reserve
      FedNow programmability pilots are receiving conflicting messages from First Capital's
      treasury sales team — which conflates instant settlement with programmable settlement —
      and from the clients' own treasury technologists who understand the architectural
      distinction. The misalignment causes First Capital to lose three marquee treasury
      management mandates to a peer bank that accurately represents its CBDC engagement roadmap.`,
    keywords: ['CBDC', 'FedNow', 'programmable payments', 'BIS Innovation Hub', 'treasury management'],
    demoRelevant: true,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2393',
    name: 'Wholesale CBDC Pilot Participation Requires SR 11-7 Model Registration Not Yet Completed',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital joins the Federal Reserve's Project Hamilton successor wholesale CBDC
      pilot, which requires the bank to deploy a distributed ledger node that executes
      settlement logic defined in the pilot's smart contract framework. The bank's model
      risk management function determines that the smart contract settlement logic constitutes
      a model under SR 11-7 — it makes automated financial decisions with material consequences —
      but the bank's participation in the pilot has already begun before the smart contract
      model is registered in the model inventory, documented, and independently validated.
      The OCC's examination team, reviewing First Capital's CBDC pilot participation,
      identifies the unregistered smart contract model as a consent order remediation regression
      because the bank committed to zero shadow model deployments as part of its MRM
      consent order remediation plan.`,
    keywords: ['CBDC', 'SR 11-7', 'smart contract', 'OCC', 'model inventory'],
    demoRelevant: true,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2394',
    name: 'Stablecoin Settlement Accepted as Collateral Without Federal Reserve Guidance Compliance Review',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `A commercial client of First Capital proposes to use a regulated stablecoin balance
      as collateral for a revolving credit facility, citing the stablecoin issuer's state
      money transmitter license and reserve attestation. First Capital's commercial lending
      team structures and approves the credit facility without engaging the bank's compliance
      and legal teams to assess whether accepting stablecoin as collateral is consistent with
      the OCC's interpretive letter framework for bank crypto activities or the Federal Reserve's
      supervisory letter on digital asset risk management. The OCC's 2025 examination finds
      that First Capital extended a credit facility using crypto asset collateral without
      completing the required safety-and-soundness risk assessment and without notifying the
      OCC in advance as required for novel bank activities under 12 CFR Part 5.`,
    keywords: ['stablecoin', 'OCC', 'digital assets', 'Federal Reserve', 'credit risk'],
    demoRelevant: true,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2395',
    name: 'Tokenized Deposit Product Lacks Reg E Consumer Protection Framework',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital pilots a tokenized deposit product that represents consumer checking
      account balances as blockchain tokens on a permissioned distributed ledger, enabling
      peer-to-peer transfer of tokenized deposit value outside the ACH and RTP networks.
      The product is launched without a legal opinion determining whether Regulation E's
      electronic fund transfer provisions — error resolution rights, unauthorized transaction
      liability caps, and disclosure requirements — apply to tokenized deposit transfers,
      which the bank's product team argues are not "electronic fund transfers" under Reg E
      because they are token transfers rather than account debits. The CFPB's 2024 fintech
      supervisory guidance clarifies that tokenized deposits remain subject to Reg E consumer
      protections regardless of the technical mechanism, creating an unresolved compliance
      gap in First Capital's tokenized deposit product at the time of its pilot launch.`,
    keywords: ['tokenized deposits', 'Reg E', 'CFPB', 'blockchain', 'digital assets'],
    demoRelevant: false,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2396',
    name: 'Crypto Asset Custody Service Launched Without BSA/AML Program Extension',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital launches a cryptocurrency custody service for institutional clients
      following the OCC's interpretive letter permitting nationally chartered banks to
      provide crypto custody, but does not formally extend the bank's BSA/AML compliance
      program to cover the new crypto custody activity before accepting the first custodied
      assets. The bank's existing BSA/AML program risk assessment and transaction monitoring
      rules are designed for fiat payment flows and do not address the blockchain analytics
      monitoring required for on-chain crypto transactions under FinCEN's 2019 guidance on
      convertible virtual currency and the 2021 proposed rule on crypto wallet owner identification.
      FinCEN's targeted examination of First Capital's crypto custody program identifies the
      BSA/AML program extension gap as a willful compliance failure because the bank launched
      the service with legal knowledge of the FinCEN guidance requirements.`,
    keywords: ['crypto custody', 'BSA/AML', 'FinCEN', 'OCC', 'digital assets'],
    demoRelevant: false,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2397',
    name: 'Retail CBDC Readiness Planning Not Initiated Despite Federal Reserve Public Consultation',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `The Federal Reserve's January 2022 discussion paper on a potential U.S. retail CBDC
      invited banks to engage in internal readiness planning for CBDC integration scenarios,
      including potential changes to reserve requirements, deposit displacement modeling, and
      payments infrastructure connectivity. First Capital has not initiated any internal CBDC
      readiness analysis as of 2026, citing the absence of a Federal Reserve CBDC decision
      as justification for deferring planning. The bank's strategic planning office lacks a
      scenario model for the deposit funding impact of a retail CBDC that offers consumers
      a direct Federal Reserve account, a gap that the OCC's horizontal review of regional bank
      strategic planning identifies as a contingency planning deficiency given the pace of
      CBDC development in G10 central banks and the potential for rapid deployment timelines.`,
    keywords: ['CBDC', 'Federal Reserve', 'deposit displacement', 'OCC', 'strategic planning'],
    demoRelevant: true,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2398',
    name: 'DeFi Protocol Integration Pilot Treats On-Chain Counterparties as Exempt From KYC Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's innovation lab pilots an integration between the bank's treasury
      management platform and a permissioned DeFi liquidity protocol for intraday repo
      transactions, executing collateralized lending transactions with on-chain smart contracts
      as counterparties. The pilot's legal framework classifies the smart contract as the
      counterparty rather than the beneficial owners behind the wallet addresses that fund
      the protocol's liquidity pools, treating on-chain transactions as exempt from the bank's
      KYC and counterparty risk assessment requirements. FinCEN's 2021 guidance on decentralized
      finance and the FATF's 2021 updated guidance on virtual assets establish that the
      beneficial owners of DeFi liquidity pools are counterparties subject to CDD requirements;
      First Capital's KYC exemption interpretation creates a systematic BSA/AML compliance gap
      in the DeFi pilot that the OCC examination team identifies as inconsistent with the
      bank's own CDD rule implementation.`,
    keywords: ['DeFi', 'KYC', 'FinCEN', 'BSA/AML', 'digital assets'],
    demoRelevant: false,
    subTopic: 'cbdc-digital-currency',
  },
  {
    code: 'B2399',
    name: 'Central Bank Digital Currency Interoperability With Legacy RTGS Not Tested Before Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital participates in a multilateral CBDC interoperability pilot coordinated
      by the BIS Innovation Hub, which tests atomic swap settlement between participating
      central banks' CBDC platforms and commercial bank accounts in the legacy Real-Time
      Gross Settlement system. First Capital's participation requires the bank's RTGS
      interface to receive and send CBDC-to-fiat settlement confirmation messages in a new
      message format, but the bank does not complete end-to-end interoperability testing
      with the RTGS operator before the pilot go-live date, relying instead on the CBDC
      platform vendor's assurance that the interface is compatible. The first live pilot
      transaction fails to complete the atomic swap because the bank's RTGS interface
      does not send the required settlement confirmation in the expected sequence, blocking
      the CBDC platform's finality trigger and freezing the pilot transaction in a
      pending state for four hours.`,
    keywords: ['CBDC', 'RTGS', 'BIS Innovation Hub', 'interoperability', 'atomic swap'],
    demoRelevant: false,
    subTopic: 'cbdc-digital-currency',
  },

  // ── Payment Resilience ────────────────────────────────────────────────────

  {
    code: 'B2400',
    name: 'FedNow Contingency Operating Mode Not Included in Business Continuity Plan',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's business continuity plan documents recovery procedures for ACH,
      Fedwire, and SWIFT payment channel outages, but does not include a contingency
      operating mode for FedNow service degradation or outage, because FedNow was added
      to the bank's payment channel portfolio after the last BCP update cycle. When the
      Federal Reserve's FedNow service experiences a one-hour service interruption during
      a quarterly payroll disbursement event, First Capital has no documented procedure
      for redirecting time-sensitive FedNow credit transfers to the RTP network or same-day
      ACH as an alternative, causing commercial clients to miss payroll funding windows.
      The OCC's operational resilience guidance requires that all systemically important
      payment channels be covered by tested contingency operating procedures within 12
      months of the bank's initial channel participation.`,
    keywords: ['FedNow', 'business continuity', 'OCC', 'payment resilience', 'contingency operations'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2401',
    name: 'Single Cloud Provider Dependency for Payment Processing Creates Reg Cat II Concentration Risk',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital migrates its ACH origination, FedNow receive, and RTP payment processing
      infrastructure to a single hyperscale cloud provider, rationalizing that the cloud
      provider's multi-region architecture provides sufficient resilience. The bank does not
      maintain a secondary cloud or on-premises fallback capable of processing payment
      transactions in the event of a cloud provider region outage, and the bank's third-party
      risk assessment does not classify the cloud provider as a critical fourth-party concentration
      risk under OCC Bulletin 2023-17. When the cloud provider's US-East region experiences
      a 90-minute availability event, First Capital's payment processing for all three channels
      is simultaneously impaired, a single-point-of-failure outcome that OCC examiners
      characterize as a failure to implement the payment resilience controls required for
      Category II bank operational risk management.`,
    keywords: ['cloud concentration risk', 'OCC', 'payment resilience', 'TPRM', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2402',
    name: 'Payment System Recovery Time Objective Not Tested Under Realistic Transaction Load',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's disaster recovery tests for its payment processing infrastructure
      are conducted at 10% of peak transaction volume, because the bank's DR environment
      is provisioned at one-tenth of production capacity to reduce infrastructure costs.
      The bank's documented RTO for payment system recovery is four hours, validated
      against the low-volume DR tests, but the four-hour RTO assumes the DR environment
      will clear the backlog of transactions queued during the outage — a backlog that
      at peak volume could represent 6–8 hours of transaction processing at DR capacity.
      The Federal Reserve's operational resilience guidance and the Bank of England-inspired
      DORA-equivalent framework that OCC is developing both require that RTO testing
      be performed at peak load conditions to ensure recovery objectives are achievable
      under realistic stress scenarios rather than test-optimized conditions.`,
    keywords: ['recovery time objective', 'disaster recovery', 'OCC', 'payment resilience', 'DORA'],
    demoRelevant: false,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2403',
    name: 'Intraday Liquidity Stress Test Does Not Model Simultaneous RTP and FedNow Settlement Demand',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's intraday liquidity stress testing models — required under Basel III
      intraday liquidity monitoring guidance — were designed when the bank operated only
      Fedwire and ACH, and model intraday liquidity demand for each payment channel
      independently. The bank has not updated its stress scenarios to model a combined
      peak demand event in which RTP, FedNow, and same-day ACH all reach settlement
      peaks simultaneously — a scenario that can occur when a quarterly commercial
      payroll cycle aligns with a federal tax payment deadline. The combined peak demand
      scenario would consume 40% more intraday liquidity than any single-channel peak,
      a gap identified in a pro forma scenario analysis but not yet incorporated into
      the bank's formal BCBS 248 intraday liquidity monitoring framework.`,
    keywords: ['intraday liquidity', 'BCBS 248', 'RTP', 'FedNow', 'Basel III'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2404',
    name: 'SWIFT Network Outage Runbook Does Not Address Cross-Channel Payment Rerouting Sequence',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's SWIFT network outage runbook documents the procedure for reconnecting
      to SWIFT after a network disruption but does not define a priority rerouting sequence
      for in-flight cross-border payments that cannot wait for SWIFT restoration. The bank
      has access to the FedNow network for domestic USD settlement and a bilateral correspondent
      arrangement for urgent cross-border USD payments via CHIPS, but the runbook does not
      specify which payment types should be rerouted to which alternative channel, leaving
      the decision to the discretion of whichever operations manager is on duty during the
      outage. During a 2025 SWIFT network disruption, inconsistent rerouting decisions result
      in duplicate payments for three corporate clients whose SWIFT instructions were rerouted
      and then processed again when SWIFT service was restored.`,
    keywords: ['SWIFT', 'payment resilience', 'CHIPS', 'FedNow', 'business continuity'],
    demoRelevant: false,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2405',
    name: 'Third-Party Payment Processor SLA Does Not Include Regulatory Incident Notification Requirement',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital outsources debit card transaction processing to a third-party processor
      under a service agreement that includes uptime SLAs and penalty provisions for extended
      outages, but does not include a contractual obligation for the processor to notify
      the bank within four hours of a cybersecurity incident or service disruption that
      could affect the bank's ability to meet its regulatory obligations for transaction
      processing availability. The OCC's third-party risk management guidance and OCC
      Bulletin 2023-17 both require that contracts with critical service providers include
      explicit incident notification timelines aligned with the bank's own regulatory
      reporting obligations; when the processor experiences a data breach affecting card
      transaction records, First Capital learns of the incident 36 hours after the processor's
      internal discovery, missing the OCC's 36-hour notification window for computer security
      incidents under 12 CFR Part 53.`,
    keywords: ['TPRM', 'OCC Bulletin 2023-17', 'incident notification', 'payment processor', '12 CFR Part 53'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2406',
    name: 'Payment Channel Failover Sequence Not Validated With Receiving Banks Before Activation',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's payment resilience framework includes a documented channel failover
      sequence — if Fedwire is unavailable, route high-value payments to CHIPS; if RTP is
      unavailable, route to FedNow — but the bank has never tested this failover sequence
      with the receiving banks or correspondents in a coordinated simulation exercise.
      The failover sequence assumes that receiving banks will accept payments on alternative
      channels with identical account identifiers and routing numbers; in practice, several
      correspondent banks require advance notification before accepting high-volume failover
      traffic on alternate rails, and CHIPS requires specific membership eligibility for
      direct settlement that First Capital's regional bank structure does not satisfy.
      The untested failover sequence is an inoperable plan that would fail at execution
      during an actual Fedwire disruption.`,
    keywords: ['payment resilience', 'Fedwire', 'CHIPS', 'RTP', 'FedNow'],
    demoRelevant: false,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2407',
    name: 'Ransomware Incident Response Plan Does Not Include Payment Operations Isolation Protocol',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's cyber incident response plan for ransomware events defines network
      isolation procedures for corporate IT systems but does not include a specific protocol
      for isolating the bank's payment operations infrastructure — ACH origination servers,
      Fedwire gateway, and FedNow connectivity endpoints — from the broader network during
      a ransomware event. The absence of a payment-specific isolation protocol means that
      during a ransomware containment exercise, the incident response team disconnects
      the payment gateway servers as part of the blanket network isolation, unnecessarily
      disabling payment operations for six hours when the ransomware had not yet reached
      the payment infrastructure. The OCC's 2025 cyber resilience guidance requires that
      financial institutions define graduated isolation procedures that protect critical
      payment infrastructure availability during cyber incidents rather than treating all
      infrastructure as equally isolatable.`,
    keywords: ['ransomware', 'OCC', 'payment resilience', 'cyber incident response', 'FFIEC'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2408',
    name: 'Operational Resilience Self-Assessment for Payments Relies on Vendor Attestations Not Test Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's annual operational resilience self-assessment for payment operations,
      submitted to the OCC as part of the bank's safety-and-soundness program, documents
      resilience controls for each payment channel by referencing vendor SOC 2 Type II
      attestation reports rather than the bank's own end-to-end resilience testing evidence.
      The OCC's operational resilience guidelines, aligned with the Basel Committee's
      2021 operational resilience principles, require that banks demonstrate — through
      their own testing — the ability to deliver critical operations within defined impact
      tolerances, not merely attest that vendors meet their own control standards. The
      OCC examination team rejects the vendor-attestation-based self-assessment and issues
      a Matters Requiring Attention requiring First Capital to conduct and document
      end-to-end payment resilience testing within 180 days.`,
    keywords: ['operational resilience', 'OCC', 'SOC 2', 'Basel Committee', 'payment operations'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },
  {
    code: 'B2409',
    name: 'Impact Tolerance for Instant Payments Not Defined Before FedNow Production Go-Live',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital activates FedNow receive and send capabilities in production before
      defining an explicit impact tolerance statement for the instant payment channel —
      a quantitative threshold that specifies the maximum duration and proportion of
      FedNow payment volume disruption the bank can sustain before consumer and commercial
      client harm becomes unacceptable. The absence of a defined impact tolerance means
      the bank cannot assess whether its current resilience architecture meets regulatory
      expectations, cannot communicate a meaningful recovery commitment to commercial
      clients in service agreements, and cannot scope its resilience testing to a defined
      acceptable failure envelope. The Basel Committee's 2021 operational resilience
      principles and the OCC's implementing guidance both require impact tolerance
      statements to precede production activation of critical payment services.`,
    keywords: ['impact tolerance', 'FedNow', 'OCC', 'operational resilience', 'Basel Committee'],
    demoRelevant: true,
    subTopic: 'payment-resilience',
  },

  // ── AI Payments Part 4 ────────────────────────────────────────────────────

  {
    code: 'B2410',
    name: 'AI Cross-Sell Recommendation Engine Uses Payment Transaction Data Without GLBA Disclosure',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deploys an AI recommendation engine that analyzes consumer payment
      transaction history — including payee categories, payment timing, and transaction
      amounts derived from ACH and debit card data — to generate personalized product
      cross-sell offers displayed in the mobile banking app. The AI model's use of payment
      transaction data for marketing purposes constitutes a "sharing of nonpublic personal
      information" with an affiliated business line under Gramm-Leach-Bliley Section 502,
      requiring an opt-out opportunity to be offered to consumers before the data is used
      for cross-sell targeting. First Capital's mobile banking privacy disclosure does not
      describe the AI-driven payment data analysis or offer a cross-sell data opt-out,
      a GLBA disclosure failure that the CFPB's 2025 supervisory examination of the bank's
      AI marketing practices identifies as a systemic consumer protection gap.`,
    keywords: ['AI cross-sell', 'GLBA', 'CFPB', 'payment data', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2411',
    name: 'AI Instant Payment Credit Risk Model Produces Disparate Hold Rates for Low-Income Consumers',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI model for determining hold periods on inbound FedNow and RTP
      consumer credits uses account behavioral features that correlate with income level —
      including average account balance, overdraft utilization, and payroll direct deposit
      frequency — to score the credit risk of making funds immediately available. A disparate
      impact analysis conducted by First Capital's fair lending team finds that the AI model
      places holds on inbound instant payments for low-income consumers at a rate 2.4 times
      higher than for higher-income consumers, even when controlling for account tenure and
      credit history. Regulation CC's Expedited Funds Availability Act provisions limit hold
      periods for most consumer deposits, and the CFPB's 2024 guidance on AI-based hold
      decisions requires that hold rate disparities correlated with protected class proxies
      be remediated through model retraining or threshold adjustment.`,
    keywords: ['AI credit model', 'Reg CC', 'CFPB', 'FedNow', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2412',
    name: 'Agentic AI Treasury Bot Initiates Unauthorized ACH Debits During Autonomous Reconciliation',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an agentic AI treasury management bot for a commercial client
      that autonomously initiates ACH debit collection entries against the client's accounts
      receivable when the AI determines that outstanding invoices match received payment
      confirmations and a balance shortfall exists. During a software update, the AI agent's
      reconciliation logic encounters an edge case in which partially-matched invoices are
      incorrectly classified as unmatched, causing the agent to initiate duplicate ACH
      debit collection entries against 47 counterparty accounts that had already paid. The
      AI agent's ACH origination authority is not subject to dual-control or pre-execution
      human review for debit entries below $50,000, a governance gap that NACHA's ODFI
      rules framework does not explicitly address for autonomous AI origination agents but
      that the OCC's 2025 AI governance guidance requires be covered by an explicit
      agentic AI authorization policy.`,
    keywords: ['agentic AI', 'ACH origination', 'NACHA', 'OCC', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2413',
    name: 'AI Fraud Model Confidence Intervals Not Disclosed in Adverse Action Notices for Declined Payments',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's AI-based real-time fraud scoring model declines consumer debit card
      and ACH transactions that exceed the model's fraud probability threshold, triggering
      an adverse action that prevents the consumer from completing a payment. The CFPB's
      2024 guidance on AI decisioning in consumer financial services clarifies that adverse
      action notices for AI-declined payment transactions must include a specific reason for
      the decline — not a generic "fraud prevention" catch-all — when the AI model's decision
      can be attributed to identifiable behavioral features. First Capital's declined payment
      notices state only that the transaction "could not be processed for security reasons,"
      a disclosure that the CFPB characterizes as insufficient to meet the adverse action
      specificity requirements when AI model features are the operative decision factors.`,
    keywords: ['AI fraud model', 'adverse action', 'CFPB', 'Reg E', 'debit card'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2414',
    name: 'AI Payment Reconciliation Tool Trained on Pre-ISO-20022 Data Misclassifies MX Fields',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI-powered payment reconciliation tool that uses natural
      language processing to extract transaction identifiers, amounts, and counterparty
      names from payment confirmation records and match them to the bank's internal
      accounting ledger entries. The NLP model is trained on a corpus of legacy SWIFT
      MT103 and NACHA ACH record formats; after the bank's ISO 20022 migration, the
      reconciliation tool receives pacs.008 XML-structured confirmation messages and
      misidentifies ISO 20022 XML element tags as transaction content, extracting
      element attribute names rather than element values as counterparty identifiers.
      The misclassification produces a 12% reconciliation match failure rate in the
      first month post-migration, compared to the tool's pre-migration 1.2% failure rate,
      and the model vendor does not have an ISO 20022 retraining release available
      for six months.`,
    keywords: ['AI reconciliation', 'ISO 20022', 'NLP', 'SWIFT', 'payments modernisation'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2415',
    name: 'Generative AI Payment Instruction Summarizer Omits Material Terms in Corporate Wire Confirmations',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital deploys a generative AI assistant that summarizes outbound wire payment
      instructions into plain-language confirmation emails sent to corporate client treasury
      staff before final authorization. The GenAI summarizer is instructed to produce concise,
      readable summaries and omits fields it classifies as technical metadata — including the
      value date, the instruction priority code, and the beneficiary bank's SWIFT BIC. When
      a corporate client authorizes a wire based on the GenAI summary and the underlying
      instruction contains an incorrect value date that causes a next-day rather than
      same-day settlement, the client argues that the bank's AI summary confirmation did
      not disclose the settlement timing, a dispute that First Capital's legal team
      determines constitutes a material omission in a payment authorization document
      that creates UCC Article 4A liability exposure.`,
    keywords: ['GenAI', 'wire transfer', 'UCC Article 4A', 'corporate payments', 'AI compliance'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2416',
    name: 'AI Model for Predicting FedNow Same-Day Volume Not Retrained After Commercial Payroll Onboarding',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital uses an AI model to forecast intraday FedNow transaction volume for
      prefunding and staffing planning, trained on the first six months of FedNow consumer
      transaction history after the bank's 2024 activation. When the bank onboards three
      large commercial clients whose employees receive payroll disbursements via FedNow —
      a transaction type with a radically different volume and timing profile than consumer
      P2P transfers — the AI forecast model does not capture the new volume regime because
      it has not been retrained on the commercial payroll data. The first commercial payroll
      cycle creates a FedNow inbound volume 4.7 times higher than the AI forecast, causing
      the bank's FedNow receive buffer to queue transactions for manual release and generating
      settlement delays that trigger commercial client SLA penalties under their treasury
      management agreements.`,
    keywords: ['AI forecasting', 'FedNow', 'model drift', 'SR 11-7', 'intraday liquidity'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2417',
    name: 'AI Payments Fraud Network Graph Model Not Subject to Annual Independent Validation',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys a graph neural network fraud detection model that maps transaction
      relationships between accounts to identify fraud rings operating across multiple customer
      accounts in the bank's ACH and wire payment channels. The model was validated at deployment
      under SR 11-7 but has not undergone the annual independent model validation required
      by the bank's model risk management policy for Tier 1 models — a category that includes
      models that produce automated payment decisions. The bank's model risk team deferred
      the annual validation because the fraud team argued the model's performance metrics
      had not degraded; SR 11-7 requires that validation periodicity be driven by a schedule
      established in the model governance framework, not by performance trend assessment
      alone, because model risk includes structural changes in the fraud environment that
      performance metrics may not immediately reflect.`,
    keywords: ['AI fraud model', 'SR 11-7', 'model validation', 'graph neural network', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2418',
    name: 'AI-Powered SWIFT Message Repair Tool Introduces Errors When Correcting Beneficiary Data',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital deploys an AI-powered SWIFT message repair tool that automatically
      corrects common errors in outbound SWIFT MT103 and pacs.008 messages — including
      beneficiary IBAN format errors, BIC code typos, and missing mandatory fields —
      before submitting them to the SWIFT network. The AI repair tool's BIC code correction
      logic uses a fuzzy-match algorithm trained on SWIFT's BIC directory, which occasionally
      corrects a mistyped BIC to the wrong financial institution when two BIC codes have
      similar character sequences. The incorrect BIC substitution routes the wire to the
      wrong correspondent bank, requiring a manual recall and resubmission; three instances
      of BIC repair errors result in Fedwire recall attempts that fail because the funds
      have already been credited to the wrong beneficiary institution's account.`,
    keywords: ['AI message repair', 'SWIFT', 'BIC', 'Fedwire recall', 'payment operations'],
    demoRelevant: false,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2419',
    name: 'AI Payment Monitoring System Vendor Contract Lacks Model Explainability Audit Right',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital purchases an AI-powered payment transaction monitoring platform from
      a fintech vendor, under a SaaS contract that grants the bank access to the monitoring
      dashboard and alert outputs but does not include an explicit contractual right for
      First Capital to audit the underlying model's feature weights, training data characteristics,
      or explainability methodology. When the OCC's model risk examination team requests
      documentation of the vendor AI model's SR 11-7 model documentation package, First
      Capital cannot produce model design documentation, validation evidence, or feature
      explainability materials because the vendor treats these as proprietary. The OCC
      examiner identifies the missing audit right as a vendor model risk governance failure
      under SR 11-7 Section 3, which requires banks to ensure that vendor models used in
      material decision processes are subject to the same model governance standards as
      internally-built models.`,
    keywords: ['AI vendor model', 'SR 11-7', 'OCC', 'model explainability', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2420',
    name: 'AI Sanctions Screening Confidence Score Threshold Set by Vendor Without Bank Risk Calibration',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital implements an AI-enhanced OFAC sanctions screening platform that uses
      a machine learning confidence score to classify potential matches as hits requiring
      human review or false positives eligible for auto-clear. The screening confidence
      threshold — the score above which a potential match is routed to a compliance analyst
      rather than auto-cleared — is set at the vendor's default value of 0.65, which was
      calibrated on a generic banking portfolio rather than First Capital's specific
      payment corridor mix, counterparty concentration, and sanctions risk profile.
      OFAC's compliance framework guidance requires that screening thresholds be calibrated
      by the bank's own compliance function based on the institution's specific risk
      assessment; First Capital's use of the vendor default threshold without bank-specific
      calibration is characterized by the OCC as a delegation of a core compliance judgment
      to a third party, which is impermissible under OCC Bulletin 2013-29.`,
    keywords: ['AI OFAC screening', 'OFAC', 'OCC Bulletin 2013-29', 'sanctions compliance', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2421',
    name: 'AI-Generated SAR Narrative Drafts Contain Hallucinated Transaction Details',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deploys a generative AI tool to draft Suspicious Activity Report narratives
      for payment-related AML alerts, using the alert data and associated transaction records as
      input context. In a post-deployment review of 300 AI-drafted SAR narratives, the bank's
      BSA compliance team finds that 7% contain factual errors — specifically, hallucinated
      transaction dates, amounts, or counterparty names that are plausible but not present in
      the underlying alert data — that were incorporated into final filed SARs without adequate
      human review. FinCEN's SAR filing guidance requires that all SAR narrative content be
      factually accurate and based on documented evidence; filing a SAR with hallucinated
      content constitutes a materially false SAR submission that exposes First Capital to
      civil money penalties under the Bank Secrecy Act.`,
    keywords: ['GenAI', 'SAR filing', 'FinCEN', 'BSA/AML', 'AI hallucination'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2422',
    name: 'AI Payment Personalization Engine Uses Race-Correlated Zip Code Features Without Fair Lending Review',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's AI payment product personalization engine — which determines which
      payment product features, fee waivers, and digital wallet integrations are displayed
      to different consumer segments — uses zip code as a segmentation feature alongside
      account balance and transaction behavior. Zip code in US metropolitan areas is a known
      proxy for race and ethnicity; the bank's fair lending function has not reviewed the
      AI personalization engine under the CFPB's proxy discrimination framework because
      the product team classified it as a UX optimization tool rather than a credit or
      pricing decision. A post-deployment analysis finds that consumers in majority-minority
      zip codes are shown fewer premium payment product features and more basic service tiers,
      a differential treatment pattern that the CFPB characterizes as proxy discrimination
      under ECOA's disparate treatment theory.`,
    keywords: ['AI personalization', 'ECOA', 'CFPB', 'proxy discrimination', 'payment products'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2423',
    name: 'AI Model for ACH Return Reason Code Prediction Not Disclosed in ODFI Due Diligence',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital deploys an AI model that predicts the likely return reason code for
      ACH entries that the bank expects may be returned — used internally to prioritize
      operations staff review of high-risk batches — but does not disclose the AI model's
      existence or its role in originator risk management to ACH originators during the
      ODFI due diligence process. When the AI model predicts elevated R10 unauthorized
      return risk for a specific originator's batch and flags the batch for enhanced
      review, the originator is not informed that an AI assessment influenced the review
      decision, and the originator cannot challenge the AI-based risk assessment through
      the NACHA dispute process. The OCC's 2025 AI transparency guidance requires that
      banks disclose the use of AI models in consequential risk decisions affecting
      third parties who have a right to contest the outcome.`,
    keywords: ['AI model disclosure', 'NACHA', 'ODFI', 'OCC', 'ACH risk management'],
    demoRelevant: false,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2424',
    name: 'AI Treasury Management Platform Vendor Retains Payment Behavioral Data for Model Training Without Consent',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI-powered treasury management platform vendor retains commercial
      client payment behavioral data — transaction volumes, counterparty patterns, and
      settlement timing — to retrain and improve the AI platform's cash flow forecasting
      models, a data use right buried in the platform's enterprise license agreement
      terms that the bank's treasury services team did not surface during contract review.
      First Capital's commercial clients' payment behavioral data is being used to train
      AI models that may be deployed for competing institutions, a data use that violates
      the bank's client data confidentiality obligations under the commercial banking
      master agreement and potentially GLBA Section 502 restrictions on sharing nonpublic
      financial information with third parties for purposes other than providing financial
      services to the customer.`,
    keywords: ['AI vendor data', 'GLBA', 'TPRM', 'treasury management', 'OCC Bulletin 2023-17'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2425',
    name: 'AI Debit Card Authorization Model Performance Degrades After Core Banking System Upgrade',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's AI-based real-time debit card authorization model is retrained quarterly
      on transaction features extracted from the bank's core banking system, including account
      balance at the time of transaction, overdraft history, and card usage frequency. After
      a core banking system upgrade changes the field naming and timestamp format of several
      feature extraction queries, the model's feature pipeline silently extracts null or
      incorrectly-typed values for three features — causing the model to revert to a
      degraded operating mode that classifies all transactions near the balance threshold
      as high-fraud-risk. The degraded model increases the false-decline rate for legitimate
      debit card transactions by 22% over a two-week period before the feature extraction
      failure is identified, generating customer complaints and Reg E error resolution claims
      from consumers whose legitimate transactions were declined.`,
    keywords: ['AI authorization model', 'model drift', 'SR 11-7', 'Reg E', 'debit card'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2426',
    name: 'AI-Powered FX Rate Optimization for Consumer Remittances Lacks CFPB Remittance Rule Disclosure',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital deploys an AI model that dynamically selects the FX conversion rate
      and correspondent bank routing for consumer international wire remittances, optimizing
      across a real-time feed of correspondent bank rate quotes to minimize cost while
      meeting settlement timing requirements. The AI routing decision determines the
      exchange rate the consumer will receive, but the consumer-facing disclosure shows
      only the AI-selected final rate rather than the range of rates the AI considered
      and the bank's margin over the mid-market rate. The CFPB's Remittance Transfer Rule
      under Reg E Subpart B requires that the disclosed exchange rate be the rate that
      will actually apply to the transfer and that the bank's fee structure be fully
      disclosed; the AI's dynamic rate selection creates a disclosure timing problem
      when the rate displayed at initiation differs from the rate applied at execution
      due to the AI's real-time optimization.`,
    keywords: ['AI FX optimization', 'CFPB Remittance Rule', 'Reg E', 'cross-border payments', 'consumer remittance'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },
  {
    code: 'B2427',
    name: 'AI Payment Exception Routing System Creates Undocumented Manual Override Pathway',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's AI payment exception management system automatically routes payment
      exceptions — rejected, held, or flagged transactions — to the appropriate operations
      team queue based on exception type, payment amount, and channel. The AI routing
      system includes an undocumented override capability that allows senior operations
      staff to manually reclassify an exception and route it to a lower-tier review queue,
      effectively bypassing the AI-assigned escalation level without creating an audit trail
      of the override or the staff member who invoked it. The OCC's model risk management
      examination team identifies the undocumented override pathway as a model integrity
      control failure — human overrides of AI decisions in consequential financial processes
      must be logged, attributed, and reviewed under SR 11-7's model use and change control
      requirements.`,
    keywords: ['AI exception routing', 'SR 11-7', 'OCC', 'model override', 'payment operations'],
    demoRelevant: true,
    subTopic: 'ai-payments-part4',
  },

  // ── Payment Regulation ────────────────────────────────────────────────────

  {
    code: 'B2428',
    name: 'Reg E Error Resolution Clock Starts From Bank Discovery Rather Than Customer Report Date',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's dispute operations system starts the 10-business-day Regulation E
      provisional credit clock from the date the bank's fraud operations team internally
      classifies a dispute as an error resolution case, rather than from the date the
      consumer first reported the unauthorized transaction. The distinction is material
      when a consumer reports a dispute to the bank's mobile app chat assistant but the
      AI triage bot classifies it as a service inquiry rather than a dispute, delaying
      the case's entry into the error resolution workflow by 3–5 days. The CFPB's Reg E
      examination guidance is explicit that the 10-business-day provisional credit
      requirement begins when the consumer provides notice of the error — regardless of
      the bank's internal classification workflow — and First Capital's policy of starting
      the clock at internal classification constitutes a systematic Reg E timing violation.`,
    keywords: ['Reg E', 'CFPB', 'error resolution', 'provisional credit', 'dispute management'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2429',
    name: 'Same-Day ACH Credit Funds Availability Not Provided by Required NACHA Deadline',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `NACHA's operating rules require RDFIs to make same-day ACH credit funds available
      to consumer recipients by 5:00 PM local time on the settlement day. First Capital's
      core banking system posts same-day ACH credits received in the afternoon settlement
      window during an end-of-day batch processing cycle that completes at 7:30 PM, making
      funds available approximately 2.5 hours after the NACHA deadline. The delay is caused
      by the core banking system's inability to post ACH credits in real time outside of
      its scheduled batch windows, a limitation that the bank's technology team has
      flagged but that has not been remediated. Reg CC and NACHA operating rules both
      treat the 5:00 PM same-day availability deadline as a binding obligation, and
      First Capital's systematic late posting creates RDFI rules compliance exposure
      with the NACHA compliance review program.`,
    keywords: ['NACHA', 'Reg CC', 'same-day ACH', 'RDFI', 'funds availability'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2430',
    name: 'Prepaid Card Reg E Disclosure Provided After Card Activation Rather Than Before Purchase',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's prepaid debit card program distributes Reg E disclosures in a paper
      insert inside the card packaging that consumers receive after purchasing the card at
      retail locations, rather than displaying the material fee disclosure required by the
      CFPB's Prepaid Account Rule at the point of sale before the purchase decision.
      The CFPB's 2016 Prepaid Account Rule, effective 2019, requires that a "short form"
      fee disclosure be provided on or with the packaging before the consumer is required
      to pay, enabling consumers to make an informed purchase decision. First Capital's
      post-purchase packaging insert constitutes a Reg E Prepaid Account Rule disclosure
      timing failure that the CFPB's 2024 prepaid card supervisory sweep identifies at
      three banks including First Capital, resulting in a public supervisory guidance
      letter and a 12-month remediation deadline.`,
    keywords: ['Reg E', 'prepaid card', 'CFPB', 'Prepaid Account Rule', 'fee disclosure'],
    demoRelevant: false,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2431',
    name: 'Durbin Amendment Interchange Fee Compliance Not Monitored After Debit Card Network Change',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `The Durbin Amendment to the Dodd-Frank Act requires that debit card issuers with
      assets above $10 billion offer merchants routing choice over at least two unaffiliated
      debit networks, and caps interchange fees at a rate set by the Federal Reserve.
      First Capital crosses the $10 billion asset threshold following an acquisition and
      becomes subject to Durbin constraints, but the bank's debit card program manager
      does not update the bank's debit card network routing agreements with Visa and
      Mastercard to add a Durbin-compliant second routing option within the required
      12-month implementation window. The Federal Reserve's Regulation II examination
      team identifies First Capital's non-compliant single-network routing as a Durbin
      Amendment violation, with civil money penalty exposure for each month of
      non-compliance after the asset threshold crossing date.`,
    keywords: ['Durbin Amendment', 'Reg II', 'Federal Reserve', 'debit card', 'interchange'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2432',
    name: 'Paycheck Protection Program ACH Disbursements Not Documented as Government Benefits Under Reg CC',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital originates ACH credit disbursements for a state government agency's
      emergency rental assistance program, using a CCD entry class code without identifying
      the payments as government benefit disbursements in the transaction description field.
      Reg CC's Expedited Funds Availability Act grants next-business-day availability to
      government benefit payments, a more favorable treatment than the standard ACH
      availability schedule; because First Capital does not flag the CCD entries as
      government benefit credits, the bank's core system applies the standard two-day
      ACH availability hold, delaying emergency rental assistance funds from reaching
      low-income consumers who are at risk of eviction. The CFPB's examination of First
      Capital's Reg CC implementation finds the government benefit availability error
      affecting approximately 3,400 beneficiaries per disbursement cycle.`,
    keywords: ['Reg CC', 'government benefits', 'CFPB', 'ACH', 'funds availability'],
    demoRelevant: false,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2433',
    name: 'CFPB Section 1033 Open Banking Rule Implementation Not Incorporated in Payments API Roadmap',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `The CFPB's Section 1033 Personal Financial Data Rights rule, finalized in 2024,
      requires depository institutions to provide consumers and authorized third parties
      with standardized API access to payment transaction history — including ACH, wire,
      debit card, and bill payment data — in a machine-readable format. First Capital's
      payments technology roadmap does not include an implementation workstream for
      Section 1033 API compliance, because the bank's digital banking team classified
      the rule's implementation as a data governance project rather than a payments
      project, creating an ownership gap between the two teams. The compliance deadline
      for First Capital's asset tier requires API readiness by 2027, and the bank's
      current payments API architecture does not support the standardized FDX data
      schema required for Section 1033 compliance without a significant data pipeline
      rebuild that has not been scoped or funded.`,
    keywords: ['CFPB Section 1033', 'open banking', 'FDX', 'payments API', 'consumer data rights'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2434',
    name: 'Commercial ACH Origination Agreement Lacks Required Reg E Consumer Authorization Clause for Mixed-Use Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's standard commercial ACH origination agreement for business clients
      does not include a clause requiring the originator to obtain separate written
      authorization from consumers before initiating ACH debits against accounts that
      are used for both business and personal purposes — a common scenario for sole
      proprietors and small business owners who use a single checking account for
      personal and business payments. When a commercial originator initiates an
      ACH debit against a mixed-use account without a separate consumer authorization,
      the account holder disputes the debit as unauthorized under Reg E's consumer
      protection provisions, and First Capital as ODFI has no contractual flow-down
      of the consumer authorization requirement to invoke against the originator in
      the R10 return dispute resolution process.`,
    keywords: ['NACHA', 'Reg E', 'ACH authorization', 'ODFI', 'consumer protection'],
    demoRelevant: false,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2435',
    name: 'Faster Payment Scheme Participation Agreement Creates Unreviewed Liability Shift for APP Fraud',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital joins The Clearing House's RTP network under a participation agreement
      that contains liability allocation provisions for Authorized Push Payment fraud — specifically,
      a clause that shifts liability to the sending bank when the bank fails to implement
      the network's recommended fraud deterrence controls within the required timeframe.
      First Capital's legal team reviews the RTP participation agreement for payment
      mechanics and operational obligations but does not route the fraud liability provisions
      to the bank's consumer compliance team or general counsel for analysis of the
      liability shift's interaction with Reg E's consumer protection framework.
      When the RTP network activates the APP fraud liability provisions and three consumer
      APP fraud claims are filed, First Capital faces a liability that its consumer
      compliance reserves do not anticipate, and the bank has no contractual basis to
      challenge the liability attribution.`,
    keywords: ['RTP', 'APP fraud', 'Reg E', 'The Clearing House', 'payment liability'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2436',
    name: 'Wire Transfer Regulation J Subpart B Compliance Review Not Updated for FedNow Transactions',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `Regulation J Subpart B governs funds transfer obligations for Fedwire participants,
      specifying sender and receiver liability, error resolution procedures, and notice
      requirements. First Capital's Reg J compliance review program, last updated in 2022,
      does not address FedNow instant payment transactions, which were added to the bank's
      payment channel mix in 2024 and carry different settlement finality, error resolution,
      and return processing characteristics than Fedwire. The bank's payments compliance
      team has not determined which Reg J provisions extend to FedNow transactions and
      which are specific to Fedwire, creating unresolved compliance questions around
      FedNow error resolution timing and consumer liability that the CFPB has indicated
      it will address in forthcoming supervisory guidance on instant payment consumer
      protections.`,
    keywords: ['Reg J', 'FedNow', 'Federal Reserve', 'wire transfer', 'consumer protection'],
    demoRelevant: false,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2437',
    name: 'Payroll ACH Blocked Under OFAC Alert Generates Reg E Funds Availability Violation',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's OFAC screening engine places a block and hold on an inbound ACH
      payroll credit that generates a potential name match against the SDN list, pending
      manual compliance review. The compliance team's OFAC review queue averages 72 hours
      for ACH transaction holds, but Reg CC's next-business-day funds availability rule
      requires that payroll direct deposit credits be made available the next business day.
      The 72-hour OFAC review hold systematically violates the Reg CC availability deadline
      for payroll credits that are ultimately determined to be false positives — which represent
      approximately 94% of the payroll credits placed on OFAC hold. The bank's legal team
      has not resolved the tension between OFAC's obligation to hold potential SDN matches
      and Reg CC's availability requirements, creating a compliance program gap acknowledged
      internally but unresolved for 18 months.`,
    keywords: ['OFAC', 'Reg CC', 'payroll ACH', 'funds availability', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2438',
    name: 'Consumer Bill Payment Errors Not Treated as Reg E Error Resolution Eligible by Help Desk',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's consumer banking help desk is trained to treat online bill payment
      errors — misdirected payments, incorrect amounts, or duplicate payments — as service
      recovery issues handled through the bank's courtesy credit process, rather than as
      Reg E electronic fund transfer error resolution claims subject to the 10-business-day
      provisional credit requirement and formal investigation procedures. When a consumer
      reports that a bill payment was sent to the wrong biller account number due to an
      error in the bank's bill payment platform, the help desk representative offers a
      courtesy credit process that may take 10–15 business days — far exceeding the Reg E
      10-business-day provisional credit requirement — without informing the consumer
      of their statutory right to a Reg E error resolution investigation and
      provisional credit.`,
    keywords: ['Reg E', 'CFPB', 'bill payment', 'error resolution', 'consumer protection'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },
  {
    code: 'B2439',
    name: 'Payment Network Rule Changes Not Incorporated in Annual Compliance Program Update',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `NACHA, Visa, Mastercard, The Clearing House, and the Federal Reserve each publish
      annual updates to their operating rules that impose compliance obligations on
      member banks, with effective dates staggered across the calendar year. First Capital's
      compliance program update process reviews regulatory agency rule changes — from the
      OCC, CFPB, Federal Reserve, and FDIC — on a defined schedule, but does not have an
      equivalent process for systematically tracking and implementing payment network
      operating rule changes from non-regulatory network operators. The gap means that
      NACHA rule updates, Visa chargeback reason code modifications, and RTP network
      amendment notices are routed to the bank's operations team for awareness but do not
      trigger a formal compliance impact assessment, implementation project, or policy
      update, resulting in recurring ODFI compliance audit findings for rules that have
      been effective for 12 months before the bank identifies the implementation gap.`,
    keywords: ['NACHA', 'payment network rules', 'compliance program', 'OCC', 'Reg E'],
    demoRelevant: true,
    subTopic: 'payment-regulation',
  },

];
