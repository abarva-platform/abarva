// seed-banking-dom08-payments-part5.ts
// Banking genome patterns — Payments & Transaction Processing
// Code range: B2440–B2499  (60 patterns)
// Sub-topics: ai-payments-part5 (B2440–B2457, 18, all aiInsertionRisk: true),
//             real-time-payments-risk (B2458–B2469, 12),
//             ach-nacha-compliance (B2470–B2479, 10),
//             cross-border-correspondent (B2480–B2489, 10),
//             payment-card-security (B2490–B2499, 10)
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

export const BANKING_DOM08_PAYMENTS_PART5_PATTERNS: PatternSeed[] = [

  // ── AI Payments Part 5 (B2440–B2457, all aiInsertionRisk) ────────────────

  {
    code: 'B2440',
    name: 'AI Payment Routing Engine Deployed Without Human Fallback Governance Policy',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an AI model that autonomously selects the optimal payment rail
      for outbound transactions — routing between FedNow, same-day ACH, Fedwire, and RTP
      based on amount, urgency, and counterparty profile — without a documented fallback
      governance policy specifying human override authority when the AI selects a rail that
      contradicts the client's explicit instruction or that incurs unexpected fees. During a
      quarterly commercial payroll cycle, the AI routing engine reroutes a batch of
      same-day ACH payroll entries to Fedwire to meet an intraday settlement deadline,
      incurring $18 per-wire fees rather than the $0.003 per-entry ACH fee; the AI's
      routing decision is not subject to pre-execution human review and the fee overrun
      totaling $62,000 is discovered only during the monthly billing reconciliation,
      creating a client dispute that First Capital's treasury services team must absorb.`,
    keywords: ['AI payment routing', 'fallback governance', 'FedNow', 'Fedwire', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2441',
    name: 'GenAI Sanctions Screening Explanation Gaps Create OFAC Audit Trail Deficiencies',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital integrates a generative AI layer into its OFAC sanctions screening
      workflow to produce plain-language explanations for compliance analysts reviewing
      potential SDN name matches against payment transaction counterparties. The GenAI
      explanation module generates narrative justifications for auto-clear decisions but
      does not retain the input context — the specific name tokens, fuzzy-match scores,
      and SDN entry data — used to generate each explanation, storing only the final
      narrative text in the audit log. OFAC's compliance framework requires that sanctions
      screening decisions be documented with the specific data and reasoning used at the
      time of the decision, enabling examiners to reconstruct the decision logic; First
      Capital's GenAI audit trail stores the narrative conclusion without the inputs,
      creating an explanation gap that the OCC's BSA/AML examination team characterizes
      as a documentation deficiency under 31 CFR Part 1020.`,
    keywords: ['GenAI sanctions screening', 'OFAC', 'OCC', 'audit trail', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2442',
    name: 'ML Payment Anomaly Detection Model Lacks SR 11-7 Tiering Classification for SAR Trigger Decisions',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital deploys a machine learning anomaly detection model that flags unusual
      payment transaction patterns — atypical timing, structuring indicators, and network
      concentration — as inputs to the bank's Suspicious Activity Report decisioning workflow.
      The bank's model risk management team has not classified the anomaly detection model
      under SR 11-7's tiering framework, because the AML operations team characterizes the
      model as an "alert scoring tool" rather than a decision model, arguing that human
      analysts make the final SAR filing decision. SR 11-7's guidance is explicit that models
      used as material inputs to consequential compliance decisions — including SAR filing
      triggers — are subject to the same inventory, documentation, and validation requirements
      as direct decision models; the untiered model has not been independently validated,
      creating a compliance gap the OCC identifies as a recurrence of the bank's prior
      MRM consent order findings.`,
    keywords: ['ML anomaly detection', 'SR 11-7', 'OCC', 'SAR filing', 'model risk'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2443',
    name: 'LLM Payment Dispute Resolution Chatbot Creates CFPB UDAAP Risk Through Incomplete Reg E Guidance',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital deploys a large language model-powered chatbot to handle consumer
      payment dispute intake and provide initial guidance on the Regulation E error
      resolution process. During post-deployment testing, consumer advocacy groups
      document instances in which the LLM chatbot provides incomplete or subtly inaccurate
      information about consumers' Reg E rights — including misstating the provisional
      credit timeline as "up to 15 business days" rather than 10, and omitting information
      about the consumer's right to request the bank's investigation findings in writing.
      The CFPB's 2025 guidance on AI-assisted consumer financial services characterizes
      systematic LLM misrepresentation of consumer rights as a UDAAP deceptive practice,
      regardless of whether the inaccuracy was intentional; First Capital's LLM chatbot
      lacks a retrieval-augmented generation layer grounding responses in current Reg E
      regulatory text.`,
    keywords: ['LLM chatbot', 'CFPB', 'UDAAP', 'Reg E', 'AI consumer protection'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2444',
    name: 'AI Treasury Cash Management Model Generates Systematic Overnight Overdraft Due to Data Lag',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI model to optimize overnight cash positioning for commercial
      clients with complex multi-account treasury structures, automatically sweeping surplus
      balances into overnight investment vehicles and positioning reserves across operating
      accounts to minimize idle cash. The AI model's cash flow projections use end-of-day
      balance feeds from the bank's core system with a 90-minute data lag; when same-day
      ACH and FedNow inbound credits post after the model's data cutoff, the model under-
      counts available cash and fails to execute end-of-day sweeps for accounts that
      received late-arriving credits. Three commercial clients experience overnight overdraft
      positions that incur penalty fees and force intraday borrowing the following morning;
      the AI model's data dependency architecture was not tested against the bank's actual
      same-day payment posting schedule during pre-deployment validation.`,
    keywords: ['AI treasury management', 'cash management', 'SR 11-7', 'FedNow', 'model risk'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2445',
    name: 'AI Payment Fraud Model Produces Unexplained Disparate Block Rates Across Immigrant Corridors',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AI fraud detection model for international wire and remittance
      transactions produces statistically significantly higher transaction block rates for
      payments to Central American and Southeast Asian corridors compared to Western European
      corridors of equivalent transaction size and customer relationship tenure. A fair lending
      analysis commissioned by First Capital's compliance team finds that the disparity correlates
      with the geographic origin features used in the model's training data, which over-
      represents fraud cases in developing-market corridors due to historical reporting bias.
      The CFPB's 2024 AI fairness guidance and the OCC's non-discrimination examination
      framework both require that AI models used in payment access decisions be tested for
      disparate impact across national origin proxies; First Capital's model was not subjected
      to a geographic corridor disparate impact analysis before deployment.`,
    keywords: ['AI fraud model', 'disparate impact', 'CFPB', 'OCC', 'remittance corridors'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2446',
    name: 'Agentic AI Payment Orchestration Agent Bypasses Dual-Control Requirement for Large Wire Releases',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an agentic AI payment orchestration agent that manages end-to-end
      Fedwire payment processing for commercial clients, including automated release of queued
      wire instructions once standing authorization conditions are met. The agent's authorization
      logic is designed to require dual-control sign-off from two human operators for wires
      above $500,000, but a configuration error in the agent's conditional logic treats the
      reviewing analyst's "approve for processing" queue action as satisfying both the initiator
      and approver controls. The OCC's 2025 AI governance guidance and FFIEC wire transfer
      security guidelines both require that dual-control requirements for large-value payments
      not be reducible to a single action by any combination of human and AI actor; First Capital's
      misconfigured agent releases $2.4 million in wires with single-operator authorization
      before the configuration error is identified.`,
    keywords: ['agentic AI', 'dual-control', 'Fedwire', 'OCC', 'wire transfer security'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2447',
    name: 'AI Cross-Border Payment Routing Optimization Conflicts With FinCEN Travel Rule Recordkeeping',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's AI model for cross-border payment routing dynamically selects
      correspondent bank chains to minimize settlement cost and time, potentially routing
      a single outbound wire through two or three intermediate correspondents rather than
      the bank's standard bilateral correspondent arrangement. The AI's multi-hop routing
      creates FinCEN Travel Rule recordkeeping complications: the bank must transmit
      originator and beneficiary information to each subsequent financial institution in
      the chain, but the AI routing engine does not automatically trigger Travel Rule
      transmission obligations to newly-selected intermediate correspondents. The OCC's
      BSA/AML examination team identifies three instances in which the AI's dynamic
      multi-hop routing caused Travel Rule information to be transmitted only to the first
      correspondent, not to the AI-selected intermediate hops, creating 31 CFR Part 1010
      recordkeeping violations.`,
    keywords: ['AI payment routing', 'FinCEN Travel Rule', 'correspondent banking', 'OCC', 'BSA/AML'],
    demoRelevant: false,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2448',
    name: 'GenAI Payment Operations Assistant Confabulates Fedwire Cutoff Times in Client Communications',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's treasury services team deploys a generative AI assistant to help
      relationship managers respond to commercial client inquiries about payment processing
      schedules, cutoff times, and settlement windows. The GenAI assistant is trained on
      general banking knowledge and does not have access to real-time Federal Reserve
      Fedwire operating schedule data; in several documented instances, the assistant
      provides incorrect Fedwire cutoff times — citing the historical 6:00 PM ET cutoff
      after the Federal Reserve extended it to 7:00 PM ET — causing commercial clients
      to miss same-day wire processing windows. UCC Article 4A establishes bank liability
      for payment execution failures when the bank has communicated incorrect settlement
      information to the originator; First Capital's GenAI-generated confabulations about
      cutoff times create direct Article 4A liability exposure for missed settlement obligations.`,
    keywords: ['GenAI', 'Fedwire cutoff', 'UCC Article 4A', 'treasury operations', 'AI hallucination'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2449',
    name: 'ML Liquidity Forecast Model for Intraday Funding Not Monitored for Concept Drift',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's intraday liquidity management function relies on an ML model to
      forecast the timing and magnitude of outbound Fedwire and FedNow settlement obligations
      throughout the operating day, enabling the bank to minimize the size of its Federal
      Reserve master account prefunding. The ML model was trained on 18 months of historical
      payment flow data but has not been monitored for concept drift since deployment —
      meaning the model's underlying assumptions about payment timing distributions are not
      tested against actual payment behavior on an ongoing basis. When the bank's commercial
      client mix shifts materially following a large corporate banking acquisition, the
      model's payment timing predictions diverge from actual settlement patterns, causing
      the bank to underestimate peak intraday funding needs by 30% and triggering two
      intraday overdraft events in the Federal Reserve master account within a 60-day period.`,
    keywords: ['ML liquidity forecast', 'concept drift', 'SR 11-7', 'intraday funding', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2450',
    name: 'AI Wire Fraud Detection Model Suppresses High-Value Alerts for VIP Commercial Clients',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AI wire fraud detection model includes a business rules override layer
      that suppresses fraud alerts for accounts classified as "VIP commercial" — a designation
      applied to the bank's top 50 commercial clients by revenue — on the premise that
      relationship managers manually review VIP client wire instructions. An internal audit
      review finds that the VIP suppression logic is applied inconsistently: 38% of VIP
      client wire instructions are not reviewed by a relationship manager before processing,
      meaning the AI model's alert suppression creates an unreviewed gap in fraud detection
      for high-value client accounts. The OCC's 2025 AI governance guidance prohibits
      creating systematic alert suppression rules in fraud detection models without
      compensating controls; a $4.2 million business email compromise fraud against a
      VIP client account exploits the suppression gap before it is identified.`,
    keywords: ['AI fraud detection', 'wire fraud', 'BEC', 'OCC', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2451',
    name: 'AI-Powered Payment Orchestration Platform Vendor Model Not Subject to Bank SR 11-7 Governance',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys a vendor-provided AI payment orchestration platform that uses
      embedded ML models to sequence, prioritize, and route the bank's outbound payment
      queue across ACH, Fedwire, RTP, and FedNow channels. The bank's model risk management
      team has not inventoried, documented, or independently validated the vendor's embedded
      ML models because the bank's MRM policy currently covers only internally developed
      models and vendor models that produce direct credit decisions. SR 11-7 does not
      distinguish between internal and vendor models for purposes of the governance
      requirements when vendor models are used in material financial institution processes;
      the OCC's examination team issues a Matters Requiring Attention requiring the bank
      to extend its MRM program to cover the vendor payment orchestration models within
      90 days, creating an unplanned remediation workstream.`,
    keywords: ['AI vendor model', 'SR 11-7', 'OCC', 'payment orchestration', 'MRM'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2452',
    name: 'GenAI-Assisted ACH Origination Onboarding Fails to Detect ODFI Due Diligence Red Flags',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital deploys a generative AI assistant to support the ACH originator due
      diligence review process, using the AI to summarize applicant financial statements,
      analyze return rate history, and flag discrepancies in the originator's transaction
      volume projections. The GenAI assistant summarizes financial documents accurately
      when data is clearly presented, but misses subtle red flags in the originator's
      application — including disguised beneficial ownership structures and transaction
      volume projections that are inconsistent with the applicant's stated business model.
      NACHA's ODFI risk management standards require that originators be assessed for
      fraud propensity and business legitimacy; First Capital onboards an originator
      that subsequently generates a return rate of 28% on WEB debit entries, well above
      the NACHA 15% unauthorized return rate threshold, within 90 days of activation.`,
    keywords: ['GenAI due diligence', 'NACHA', 'ODFI', 'ACH originator', 'return rate'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2453',
    name: 'AI Payment Compliance Monitoring System Trained on Biased Historical Alert Data Perpetuates Over-Screening',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI payment compliance monitoring system is retrained annually on
      the bank's historical alert data, which reflects the output of a prior rules-based
      monitoring system that generated disproportionate alert volumes for transactions
      involving money service business customers and international remittance originators.
      The AI model trained on this biased historical data learns to replicate the
      over-screening of MSB and remittance accounts, generating 3–4 times the alert
      rate for these customer segments compared to equally low-risk segments not
      historically over-screened. The CFPB's and OCC's joint guidance on AI fairness
      in financial services compliance monitoring requires that banks audit for training
      data bias before retraining AI compliance models; First Capital's annual retraining
      process does not include a training data bias audit, systematically perpetuating
      the historical over-screening pattern.`,
    keywords: ['AI compliance monitoring', 'training data bias', 'MSB', 'CFPB', 'OCC'],
    demoRelevant: false,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2454',
    name: 'AI-Driven Dynamic Pricing for Wire Transfer Fees Creates UDAP Exposure Without Disclosure',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital pilots an AI dynamic pricing model that adjusts outbound wire transfer
      fees for commercial clients based on relationship profitability, transaction volume,
      and real-time correspondent bank cost inputs, charging different fees to different
      clients for economically similar wire transactions. The AI pricing model's fee
      differentiation is not disclosed to clients — the commercial banking master agreement
      specifies a standard fee schedule without disclosing that AI dynamic adjustments
      may apply — meaning clients cannot compare prices across providers on an equivalent
      basis. The CFPB's UDAP framework and OCC fair pricing guidance require that
      differential pricing be disclosed with sufficient specificity for consumers and
      commercial clients to understand the basis for the price they are charged; First
      Capital's undisclosed AI dynamic pricing creates a UDAP exposure characterized by
      the OCC as an unfair pricing practice.`,
    keywords: ['AI dynamic pricing', 'UDAP', 'CFPB', 'wire transfer fees', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2455',
    name: 'LLM-Generated Payment Error Explanations Contain Regulatory Misstatements in Consumer Notices',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital deploys an LLM to generate plain-language explanations for consumer
      payment error notices — returned ACH entries, declined card transactions, and held
      funds notifications — replacing static template language with AI-generated explanations
      personalized to the specific transaction context. Post-deployment review identifies
      regulatory misstatements in 4% of generated notices: the LLM describes Reg CC hold
      periods as "up to 7 days" when the regulation specifies 2-day next-day availability
      for most ACH credits, and incorrectly states that consumers have "30 days to dispute"
      unauthorized debit card transactions when Reg E provides 60 days from statement date.
      The CFPB's supervision program treats regulatory misstatements in consumer notices
      as UDAAP deceptive practices regardless of AI generation; First Capital's LLM notice
      system lacks a compliance review gate before notice delivery.`,
    keywords: ['LLM consumer notices', 'UDAAP', 'CFPB', 'Reg E', 'Reg CC'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2456',
    name: 'AI Receivables Matching Engine Misdirects Corporate Payments to Wrong Subsidiary Accounts',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an AI receivables matching engine for a multi-entity corporate
      client that automatically associates inbound ACH and wire payments with the correct
      subsidiary accounts in a 47-entity corporate structure based on payment reference
      fields, payer identifiers, and amount patterns. The AI matching model produces a
      98.2% accuracy rate in testing, but its 1.8% mismatch rate represents an average
      of 12 misrouted payments per day at the client's transaction volume, each requiring
      manual correction and inter-subsidiary accounting adjustments. The corporate client's
      treasury team discovers that the AI mismatch rate is double the accuracy rate of
      the prior rules-based system, because the AI model generalizes poorly on edge cases
      involving subsidiary names with similar prefixes; the bank has no contractual liability
      cap for AI-driven receivables mismatch losses under the treasury management agreement.`,
    keywords: ['AI receivables matching', 'treasury management', 'ACH', 'corporate payments', 'SR 11-7'],
    demoRelevant: false,
    subTopic: 'ai-payments-part5',
  },
  {
    code: 'B2457',
    name: 'AI Payment Risk Scoring Model Excludes Explanation Requirement for Business Banking Adverse Decisions',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI payment risk scoring model restricts ACH origination volume limits,
      wire transfer velocity limits, and RTP access for business banking clients based on
      a composite risk score derived from transaction behavioral features and account history.
      The bank's adverse action notice process for AI-driven payment access restrictions
      provides business banking clients with only a generic "risk management criteria" reason,
      without identifying the specific model factors that triggered the restriction, because
      the bank's legal team classified business payment restrictions as outside ECOA's
      adverse action explanation requirements. The CFPB's 2024 guidance on AI adverse action
      notices clarifies that explanations are required for AI-driven restrictions affecting
      a business's access to financial services even when the business is not covered by
      ECOA's consumer protections, creating an unresolved adverse action disclosure gap
      for First Capital's business banking segment.`,
    keywords: ['AI adverse action', 'CFPB', 'business banking', 'payment access', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-part5',
  },

  // ── Real-Time Payments Risk (B2458–B2469) ────────────────────────────────

  {
    code: 'B2458',
    name: 'FedNow Fraud Liability Allocation in Participation Agreement Not Reviewed by Consumer Compliance',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's FedNow participation agreement with the Federal Reserve includes
      fraud liability provisions that define the bank's responsibility for losses arising
      from unauthorized FedNow send transactions initiated through compromised consumer
      credentials, but the bank's consumer compliance team was not included in the contract
      review because the FedNow implementation was managed by the payments technology
      group. The participation agreement's fraud liability framework conflicts with Reg E's
      consumer protections for unauthorized electronic fund transfers — specifically, the
      agreement's 24-hour reporting requirement conflicts with Reg E's 60-day statement-based
      dispute window for unauthorized transactions. First Capital's FedNow consumer terms
      of service, drafted to align with the participation agreement, unintentionally
      narrows consumer dispute rights below the Reg E minimum, creating a CFPB enforcement
      exposure identified during a post-launch consumer compliance review.`,
    keywords: ['FedNow', 'fraud liability', 'Reg E', 'CFPB', 'consumer protection'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2459',
    name: 'RTP Network Irrevocability Creates Unresolved Loss Exposure for Misdirected Instant Payments',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `The RTP network operated by The Clearing House settles transactions with immediate
      finality and does not provide a network-level payment recall mechanism — once an RTP
      credit is posted to the receiver's account, the sending bank cannot unilaterally
      reverse the transaction as it can with ACH. First Capital's consumer mobile banking
      app allows users to initiate RTP payments to payees specified by account number and
      routing number, without a secondary confirmation of the payee name against the receiving
      bank's account records. When consumers mistype a routing number and send RTP credits to
      unintended accounts, First Capital has no automated recall mechanism and must pursue
      voluntary return requests through The Clearing House's request for return process,
      which succeeds in only 34% of cases because receiving banks are not obligated to
      comply with unilateral return requests.`,
    keywords: ['RTP', 'irrevocability', 'payment recall', 'The Clearing House', 'consumer protection'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2460',
    name: 'Instant Payment Liquidity Stress Scenario Does Not Model Concentrated Commercial Payroll Events',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's intraday liquidity stress scenarios, developed under BCBS 248 monitoring
      guidelines, model instant payment outflow stress based on a diversified distribution of
      consumer P2P and retail payment transactions throughout the operating day. The stress
      scenarios do not model the concentrated outbound liquidity demand that occurs when the
      bank's three largest commercial clients — together representing 18% of FedNow send volume —
      all process biweekly payroll disbursements on the same calendar day, which occurs when
      corporate payroll cycles align on alternating Fridays. The coincident payroll event creates
      an outbound FedNow send volume 6.2 times the daily average within a 90-minute morning
      window, exhausting the bank's pre-positioned FedNow settlement liquidity and requiring
      emergency borrowing from the Federal Reserve's intraday credit facility at penalty pricing
      not modeled in the bank's liquidity risk budget.`,
    keywords: ['instant payment liquidity', 'BCBS 248', 'FedNow', 'intraday stress', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2461',
    name: 'FedNow Receive Limit Configuration Not Updated to Reflect Commercial Client Onboarding Growth',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's FedNow receive limit — the maximum single-transaction dollar amount
      the bank will accept for credit to consumer and commercial accounts — was set at
      $500,000 at the time of the bank's FedNow activation, calibrated to the bank's
      original consumer-only FedNow use case. When the bank extends FedNow receive
      capabilities to commercial clients receiving large supplier payments and real estate
      escrow disbursements, the $500,000 limit causes rejection of 7–12 legitimate commercial
      transactions per day that exceed the configured threshold. The Federal Reserve's FedNow
      operating rules allow individual receiving institutions to set their receive limit up
      to the FedNow network maximum of $1 million; First Capital's limit update request
      requires a Federal Reserve configuration change that takes 45 business days, during
      which commercial clients experience repeated payment rejections affecting their
      settlement obligations.`,
    keywords: ['FedNow receive limit', 'Federal Reserve', 'commercial payments', 'configuration management', 'instant payments'],
    demoRelevant: false,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2462',
    name: 'Real-Time Payment Confirmation Fraud — Account Name Verification Not Implemented Before RTP Go-Live',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital activates RTP send capabilities for consumer mobile banking users
      without implementing account name verification — the capability to confirm that
      the account holder name at the receiving bank matches the payee name entered by
      the sender before payment execution. The absence of account name verification
      enables authorized push payment scams in which fraudsters provide victims with
      account numbers controlled by money mule accounts that do not correspond to the
      payee name the victim believes they are paying. The UK's Confirmation of Payee
      framework, adopted by the major UK instant payment schemes, demonstrates that
      name verification reduces APP fraud losses by 35–40%; while the U.S. lacks a
      mandated CoP equivalent, the CFPB's 2025 guidance on instant payment consumer
      protection identifies name verification as an expected industry practice for
      managing APP fraud risk at go-live.`,
    keywords: ['RTP', 'account name verification', 'APP fraud', 'CFPB', 'Confirmation of Payee'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2463',
    name: 'Instant Payment Chargeback Framework Not Defined in Consumer Deposit Agreement Before FedNow Launch',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital launches FedNow send capabilities for consumer accounts without updating
      the bank's consumer deposit agreement to define the specific conditions, timelines, and
      procedures applicable to disputes and error resolution requests for FedNow transactions.
      The existing deposit agreement references "electronic fund transfer" dispute procedures
      under Reg E, but FedNow's real-time finality and lack of a network-level reversal
      mechanism create practical differences from ACH dispute resolution that are not
      addressed in the agreement. When consumers file Reg E error resolution claims for
      FedNow misdirected payments, First Capital's dispute operations team encounters
      ambiguity about whether to process the claim under the ACH return procedures or a
      new FedNow-specific workflow, causing inconsistent provisional credit timing that
      generates CFPB complaint volume in the bank's first quarter of FedNow operation.`,
    keywords: ['FedNow', 'Reg E', 'consumer deposit agreement', 'CFPB', 'dispute resolution'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2464',
    name: 'RTP Request for Payment Feature Enabled Without Business Client Authorization Framework',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital activates the RTP Request for Payment feature for commercial clients,
      enabling businesses to send RfP messages through the bank's commercial banking portal
      requesting that counterparties initiate RTP credits in response. The bank does not
      establish a client authorization framework specifying which commercial client employees
      are authorized to send RfP messages, what dollar thresholds require additional approval,
      or how RfP messages will be authenticated to prevent unauthorized use by compromised
      commercial banking credentials. Within three months of RfP activation, a business
      email compromise incident results in a fraudster using a compromised commercial banking
      login to send fraudulent RfP messages to the corporate client's suppliers, who respond
      with RTP credits to an account the fraudster controls; the bank has no pre-established
      authorization controls to prevent or detect the unauthorized RfP usage.`,
    keywords: ['RTP Request for Payment', 'BEC fraud', 'commercial banking', 'The Clearing House', 'payment fraud'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2465',
    name: 'FedNow Operational Cutover Testing Gaps Create Day-One Processing Failures for Consumer Receive',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's FedNow implementation testing focuses on outbound send transaction
      processing and Federal Reserve connectivity, but allocates only two days to end-to-end
      testing of inbound receive processing — specifically the bank's ability to route
      incoming FedNow credits to the correct consumer account and generate real-time
      push notifications within the mobile banking app. On the production go-live date,
      the bank experiences a 40% failure rate on inbound FedNow credit routing due to
      a core banking system account lookup configuration error that was not detected
      during the abbreviated receive testing. The receive routing failure causes 340
      FedNow inbound credits to remain in a suspense queue for 8 hours before correction,
      triggering Reg CC same-day availability obligations on a proportion of the delayed
      credits and generating consumer complaints that the bank's customer service team
      is not prepared to address.`,
    keywords: ['FedNow', 'implementation testing', 'Reg CC', 'consumer receive', 'payment operations'],
    demoRelevant: false,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2466',
    name: 'Instant Payment Velocity Limits Not Calibrated to Consumer Fraud Loss Data After Go-Live',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital establishes FedNow consumer send velocity limits — daily aggregate
      transaction amount caps and per-transaction frequency limits — at the time of launch
      using peer bank benchmarks rather than First Capital's own consumer loss data,
      because the bank has no FedNow fraud loss history at go-live. The bank's fraud
      strategy commits to reviewing and recalibrating the limits using First Capital's
      actual fraud experience 90 days post-launch, but the review is deprioritized and
      not completed until 11 months after launch. During the intervening period, First
      Capital's FedNow consumer fraud losses run at 1.8 times the peer bank benchmark
      rate used to set the initial limits, indicating that the initial velocity limits
      were set too permissively for First Capital's specific consumer risk profile;
      the uncalibrated limits cost the bank $1.4 million in excess fraud losses
      during the recalibration gap.`,
    keywords: ['FedNow velocity limits', 'consumer fraud', 'payment fraud controls', 'OCC', 'instant payments'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2467',
    name: 'RTP Network Participation Expansion to SMB Segment Without Fraud Controls Uplift',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital extends RTP send and receive capabilities from its commercial banking
      segment to its small and medium business banking segment, tripling the number of
      RTP-enabled accounts without corresponding uplift of the bank's RTP fraud detection
      controls, which were calibrated to the fraud behavioral patterns of large commercial
      clients. The SMB segment exhibits materially different fraud attack patterns —
      including higher BEC frequency, lower average transaction size, and more diverse
      counterparty networks — that the existing commercial-calibrated fraud detection
      model fails to detect effectively, producing a false negative rate 2.6 times higher
      in the SMB segment than in the commercial segment during the first quarter of
      SMB RTP availability. The FFIEC's payments fraud examination guidance requires
      that fraud detection systems be tested and calibrated for each new customer
      segment before the segment is granted access to instant payment rails.`,
    keywords: ['RTP fraud controls', 'SMB banking', 'BEC fraud', 'FFIEC', 'payment fraud'],
    demoRelevant: false,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2468',
    name: 'FedNow Positive Pay Feature Not Available for Commercial Clients at Go-Live Due to Core Limitations',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's commercial banking clients expect FedNow to include positive pay
      capabilities — the ability for commercial clients to pre-authorize a list of expected
      inbound credits and automatically return credits from unauthorized originators — as
      an equivalent control to the positive pay features available on ACH receive. The bank's
      core banking system does not natively support FedNow positive pay functionality;
      the feature requires a core system enhancement that First Capital's technology team
      estimates will take 18 months to deliver. Commercial clients who are onboarded to
      FedNow receive without positive pay controls experience three unauthorized credit
      diversions — fraudulent FedNow credits followed by immediate account withdrawal —
      within the first six months of operation, losses that positive pay controls would
      have prevented if the feature had been available at go-live.`,
    keywords: ['FedNow positive pay', 'commercial banking', 'core banking', 'payment fraud controls', 'instant payments'],
    demoRelevant: false,
    subTopic: 'real-time-payments-risk',
  },
  {
    code: 'B2469',
    name: 'Instant Payment Network Outage Communication to Commercial Clients Not Meeting SLA Notification Times',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's treasury management agreements with commercial clients specify a
      15-minute notification timeline for payment system disruptions affecting time-sensitive
      commercial payment processing. When The Clearing House's RTP network experiences a
      service degradation event, First Capital's incident response process routes RTP
      network status updates through the bank's internal IT service management platform
      before generating external commercial client notifications, introducing a 47-minute
      delay from RTP service degradation onset to client notification. Commercial clients
      who initiate large supplier payments during the unannounced degradation period
      experience unexpected delays that affect their accounts payable obligations; two
      clients cite the delayed notification as a material breach of the treasury management
      agreement SLA terms and submit formal breach notices to the bank.`,
    keywords: ['RTP outage', 'SLA notification', 'commercial banking', 'payment resilience', 'The Clearing House'],
    demoRelevant: true,
    subTopic: 'real-time-payments-risk',
  },

  // ── ACH NACHA Compliance (B2470–B2479) ────────────────────────────────────

  {
    code: 'B2470',
    name: 'NACHA WEB Debit Rule Annual Validation Methodology Not Approved by Risk Management',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `NACHA's WEB Debit Account Validation Rule, effective March 2022, requires ODFIs and
      third-party senders originating WEB debit entries to use a commercially reasonable
      method to validate that a consumer account is a valid open account before the first
      use of that account for a WEB debit. First Capital's ACH operations team implements
      an account validation methodology using the bank's own real-time account verification
      API for accounts at First Capital and a third-party micro-deposit service for accounts
      at other financial institutions. The micro-deposit validation methodology has not been
      reviewed or approved by the bank's risk management function or the bank's compliance
      team as a "commercially reasonable" method under the NACHA rule definition; NACHA's
      audit team, reviewing First Capital's WEB Debit Rule compliance, identifies the
      missing risk management approval as an implementation documentation gap that exposes
      the bank to NACHA rules violation findings.`,
    keywords: ['NACHA WEB debit', 'account validation', 'ODFI', 'ACH compliance', 'NACHA rules'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2471',
    name: 'ACH Return Rate Threshold Breach Not Escalated to NACHA Compliance Within Required Timeline',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `NACHA's operating rules require ODFIs to monitor their ACH originators' unauthorized
      return rates — specifically the rate of R05, R07, R10, R29, and R51 return entries —
      and to take corrective action when any originator's unauthorized return rate exceeds
      0.5% of the originator's ACH debit entries. First Capital's ACH return monitoring
      system flags two originators whose unauthorized return rates breach the 0.5% threshold,
      but the automated alert is routed to the bank's ACH operations queue rather than the
      compliance team, and the originator risk management response — which NACHA's rules
      require to include outreach to the originator and potential suspension of origination
      authority — is not initiated within NACHA's expected 30-day corrective action window.
      NACHA's compliance team, reviewing First Capital's return rate monitoring during an
      RDFI audit, identifies the breach response delay as a willful non-compliance indicator.`,
    keywords: ['NACHA return rate', 'ODFI', 'ACH compliance', 'R10 returns', 'unauthorized debits'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2472',
    name: 'Same-Day ACH Third Settlement Window Capacity Not Tested Before Commercial Client Onboarding',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `NACHA's same-day ACH rules include a third settlement window — with a 4:45 PM ET
      submission deadline and 6:00 PM ET settlement — added to accommodate late-afternoon
      payroll and commercial payment origination. First Capital's ACH origination platform
      supports the third settlement window for consumer payments, but the bank has not
      tested the platform's capacity to process large commercial payroll batches — which
      can contain tens of thousands of entries — within the third window's compressed
      time frame. When a commercial payroll client onboarded specifically to use the
      third window submits its first large batch of 68,000 entries at 4:30 PM ET, the
      ACH origination platform's batch processing queue cannot complete the file within
      the third window's deadline, causing the batch to miss the settlement window and
      delay payroll credits by one business day, triggering a NACHA same-day rule breach.`,
    keywords: ['same-day ACH', 'NACHA', 'ODFI', 'payroll ACH', 'ACH settlement window'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2473',
    name: 'ACH Originator Risk Tier Classification Not Updated Following Originator Business Model Change',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's ODFI risk management program classifies ACH originators into risk
      tiers at onboarding, with higher-risk tiers subject to enhanced monitoring, origination
      volume limits, and reserve requirements. An originator originally classified as a
      low-risk payroll processor begins expanding into debt collection ACH debits — a
      higher-risk origination category with substantially higher return rate exposure —
      without notifying First Capital of the business model change. The bank's annual
      originator review process does not include a comparison of current transaction activity
      type against the onboarding classification, failing to detect the business model shift.
      NACHA's ODFI standards require that originators be re-assessed when their transaction
      activity materially changes; the originator's unauthorized return rate reaches 2.3%
      before the business model change is identified, by which point the bank has accumulated
      significant NACHA return rate rule exposure.`,
    keywords: ['NACHA', 'ODFI', 'originator risk', 'ACH compliance', 'return rate'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2474',
    name: 'ACH SEC Code Misuse — CCD Entries Used for Consumer Debits That Require PPD Authorization',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's ACH operations team accepts and processes ACH debit batches from a
      commercial originator that uses the CCD standard entry class code — designated for
      corporate-to-corporate transactions — for ACH debits against individual consumer
      accounts. NACHA's operating rules require that ACH debits against consumer accounts
      use the PPD or WEB entry class codes, which carry consumer protection requirements
      including specific authorization language, revocation rights, and return code eligibility
      that do not apply to CCD entries. The RDFI of one affected consumer files a NACHA
      compliance complaint when the consumer is unable to obtain an R10 unauthorized return
      because the CCD code makes the entry ineligible for the R10 return reason; NACHA's
      compliance investigation finds First Capital as ODFI responsible for accepting batches
      with incorrect entry class codes that violate consumer protection rule requirements.`,
    keywords: ['NACHA SEC code', 'CCD', 'PPD', 'consumer ACH', 'ODFI compliance'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2475',
    name: 'NACHA Third-Party Sender Agreement Missing Indemnification Clause for Originator Fraud Losses',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital serves as ODFI for a third-party sender that originates ACH transactions
      on behalf of a roster of underlying originators, under a third-party sender agreement
      that defines the sender's origination authority, volume limits, and compliance obligations.
      The third-party sender agreement does not include an explicit indemnification clause
      requiring the sender to indemnify First Capital for NACHA fine assessments, ACH return
      losses, and regulatory penalties arising from the underlying originators' ACH rule
      violations. When a fraudulent underlying originator in the sender's portfolio generates
      $340,000 in unauthorized ACH debit losses and NACHA assesses First Capital a $10,000
      rules compliance fine, First Capital has no contractual right of indemnification against
      the third-party sender under the existing agreement, and must pursue recovery through
      general commercial litigation rather than a defined contractual remedy.`,
    keywords: ['NACHA third-party sender', 'ODFI', 'ACH fraud', 'indemnification', 'ACH compliance'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2476',
    name: 'ACH Positive Pay System Not Extended to Small Business Receive Accounts Before RTP Go-Live',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital offers ACH positive pay controls to commercial banking clients above
      a $10 million annual revenue threshold, allowing qualifying clients to pre-authorize
      expected ACH debit originators and return unauthorized entries. The bank's small
      business banking segment — clients below the $10 million revenue threshold — does
      not have access to ACH positive pay, because the bank's treasury management platform
      requires a minimum contract value for positive pay enablement. When the bank launches
      RTP receive capabilities in the small business segment, the absence of any positive
      pay equivalent for the segment creates a payment fraud control gap that peer banks
      serving the SMB segment have addressed through lower-cost automated debit authorization
      filter products; First Capital's SMB segment experiences ACH unauthorized debit losses
      at 3.4 times the commercial segment rate per account.`,
    keywords: ['ACH positive pay', 'SMB banking', 'NACHA', 'unauthorized debits', 'payment fraud controls'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2477',
    name: 'ACH Credit Origination Limit Not Scaled With Commercial Client Revenue Growth',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital establishes ACH credit origination limits for commercial clients at
      onboarding based on the client's represented average monthly payment volume, with
      limits designed to constrain exposure to originator insolvency and return losses.
      The bank's commercial banking relationship review process — which occurs annually —
      does not include a systematic check of whether current ACH origination volumes are
      approaching the client's established limits. Three commercial clients whose businesses
      have grown substantially since onboarding hit their origination limits mid-month
      during payroll cycles, causing same-day ACH payroll batches to be held for manual
      limit review. The manual review adds 6–24 hours of delay to payroll processing;
      NACHA's same-day ACH settlement rules impose RDFI liability for delays, and the
      commercial clients cite the unannounced holds as a service failure under their
      treasury management agreements.`,
    keywords: ['ACH origination limit', 'NACHA', 'ODFI', 'commercial payroll', 'treasury management'],
    demoRelevant: true,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2478',
    name: 'NACHA Annual Audit Program Not Completed Within Calendar Year Deadline',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `NACHA's operating rules require all participating DFIs to complete an annual ACH
      rules compliance audit covering the bank's adherence to NACHA operating rules as
      an ODFI and RDFI, with the audit results to be retained and available for review
      by NACHA's compliance team. First Capital's ACH compliance audit is assigned to
      the bank's internal audit function as a co-sourced engagement with an external
      specialist firm; due to resource prioritization during the bank's core banking
      upgrade project, the annual audit is not initiated until October and cannot be
      completed before the December 31 calendar-year deadline. First Capital's late
      audit completion — filed in March of the following calendar year — is identified
      by NACHA's compliance program as a deadline non-compliance finding, and the bank
      is placed on enhanced NACHA monitoring status that requires quarterly self-certification
      submissions for two years.`,
    keywords: ['NACHA annual audit', 'ODFI compliance', 'ACH rules', 'internal audit', 'NACHA monitoring'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },
  {
    code: 'B2479',
    name: 'ACH Prenote Waiver Policy Not Disclosed to Business Clients Who Rely on Prenote Verification',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `NACHA's operating rules permit — but do not require — the use of prenote test
      transactions to verify ACH receiving account validity before live entry origination.
      First Capital's commercial ACH origination platform has been updated to permit
      commercial clients to bypass the prenote step and originate live ACH entries
      directly, reducing implementation time for new ACH payment relationships. The
      platform's prenote waiver option is enabled by default without disclosure to
      clients that bypassing prenotes increases the risk of routing errors creating
      unauthorized returns; three commercial clients who rely on the prenote verification
      step as a control in their own payment operations discover that their ACH setup
      did not include prenote verification only when live entries are returned, having
      assumed the bank's platform would enforce the traditional prenote sequence unless
      they explicitly opted out.`,
    keywords: ['ACH prenote', 'NACHA', 'ODFI', 'ACH verification', 'commercial payments'],
    demoRelevant: false,
    subTopic: 'ach-nacha-compliance',
  },

  // ── Cross-Border Correspondent (B2480–B2489) ──────────────────────────────

  {
    code: 'B2480',
    name: 'SWIFT gpi Adoption Gap Creates Delayed Payment Status Visibility for Corporate Clients',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `SWIFT's global payments innovation service requires participating banks to provide
      same-day use-of-funds confirmation and end-to-end payment tracking visibility through
      the SWIFT gpi Tracker, enabling corporate clients to monitor the status of cross-border
      wire payments in real time. First Capital participates in the SWIFT network but has not
      completed the gpi implementation upgrade required to populate the UETR unique transaction
      reference and to update payment status records in the gpi Tracker at each processing step.
      Corporate treasury clients who expect gpi tracker visibility — a feature that peer
      banks have offered since 2020 — are unable to obtain real-time payment status for
      outbound cross-border wires processed through First Capital, creating competitive
      disadvantage and driving 12 corporate treasury mandates to peer institutions
      that have completed gpi implementation.`,
    keywords: ['SWIFT gpi', 'UETR', 'cross-border payments', 'payment tracking', 'corporate treasury'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2481',
    name: 'Correspondent Banking De-Risking Leaves Trade Finance Payment Corridor Uncovered',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's correspondent banking de-risking review, conducted in response to OCC
      and FinCEN guidance on high-risk correspondent relationships, terminates correspondent
      banking arrangements with three regional banks in Sub-Saharan Africa that the bank's
      risk framework classifies as presenting elevated AML risk based on FATF grey list
      designations. The termination of these correspondent arrangements removes First Capital's
      only direct payment corridors to the affected countries, preventing the bank from
      processing trade finance payment obligations for commercial clients with active import
      contracts in the affected region. The World Bank's 2024 correspondent banking survey
      and FinCEN's guidance both note that indiscriminate de-risking — terminating relationships
      without individual AML risk assessment — violates the spirit of FinCEN's 2016 guidance
      on managing correspondent banking relationships, which calls for risk-based retention
      rather than blanket termination.`,
    keywords: ['correspondent banking', 'de-risking', 'FATF', 'FinCEN', 'trade finance payments'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2482',
    name: 'Cross-Border AML Data Quality Gaps Produce Systematic Screening False Positives in LATAM Corridor',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's cross-border payment AML screening system receives beneficiary name
      and address data from the bank's LATAM correspondent banks in formats that include
      abbreviated given names, compound surnames rendered in inconsistent order, and
      address data with Spanish-language diacritical marks that the bank's screening
      engine does not handle correctly. The data quality limitations cause First Capital's
      OFAC and watchlist screening engine to generate false positive alert rates 4.2 times
      higher for LATAM-corridor payments than for Western European-corridor payments of
      equivalent transaction profiles, creating screening queue backlogs that delay LATAM
      cross-border payments by an average of 48 hours. The Wolf & Company 2024 cross-border
      payment data quality survey identifies name and address format inconsistencies from
      Latin American correspondent banks as the leading cause of elevated false positive
      rates in cross-border payment AML screening programs.`,
    keywords: ['cross-border AML', 'data quality', 'OFAC screening', 'correspondent banking', 'LATAM payments'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2483',
    name: 'SWIFT Message Authentication Credential Rotation Not Enforced Within Required 12-Month Cycle',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `SWIFT's Customer Security Programme mandatory controls require that SWIFT interface
      operator credentials be rotated at least every 12 months and that expired credentials
      be immediately deactivated. First Capital's SWIFT connectivity operations team manages
      credential rotation through a manual ticketing process that relies on the SWIFT
      service bureau sending an advance renewal notice; two SWIFT interface operator
      credentials expire without triggering the renewal process because the service bureau's
      notification email is routed to a distribution list that no longer has an active owner
      after a staffing change. The expired credentials remain in an active but unremediated
      state for four months before First Capital's annual SWIFT CSP self-attestation process
      identifies the violation, at which point the bank must complete a mandatory remediation
      attestation and a root cause analysis submission to SWIFT's compliance team.`,
    keywords: ['SWIFT CSP', 'credential rotation', 'cybersecurity', 'SWIFT compliance', 'FFIEC'],
    demoRelevant: false,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2484',
    name: 'Correspondent Bank Due Diligence Refresh Not Completed for High-Risk Jurisdictions Within Annual Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's correspondent banking risk management policy requires annual due
      diligence refresh for correspondent relationships classified as high-risk — including
      those in FATF-identified jurisdictions, those with elevated beneficial ownership
      opacity, and those whose transaction patterns have shifted materially from the
      onboarding baseline. Internal audit findings for two consecutive years document
      that 23–28% of high-risk correspondent relationships receive their annual due
      diligence refresh more than 120 days after the policy deadline, due to resource
      constraints in the bank's financial institutions team. The OCC's correspondent
      banking examination guidance, aligned with FinCEN's 2016 guidance, requires
      that high-risk correspondent due diligence be completed within the policy-prescribed
      timeframe without exception; repeated late completions constitute a systemic
      compliance program effectiveness deficiency.`,
    keywords: ['correspondent banking', 'due diligence', 'FATF', 'FinCEN', 'OCC'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2485',
    name: 'Cross-Border Payment Transparency Fees Regulation EU 2021/1230 Not Applied to EEA Correspondent Payments',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `EU Regulation 2021/1230 on cross-border payments requires that fees charged for
      cross-border euro payments between EU and non-EU countries be clearly disclosed
      and align with domestic euro payment fee structures where the currency matches.
      First Capital processes euro-denominated cross-border payments for corporate
      clients transacting in the EEA, routing through European correspondent banks;
      the bank's fee disclosure for these payments does not comply with EU 2021/1230
      requirements because the bank has not assessed its EEA payment corridor fee
      structure against the regulation's domestic-equivalent transparency requirement.
      EEA-based corporate counterparties' banks are beginning to generate complaints
      to EU supervisory authorities about non-compliant cross-border fee disclosures
      from U.S. correspondent banks, creating a reputational and regulatory risk
      in First Capital's European correspondent banking relationships.`,
    keywords: ['EU cross-border payments', 'fee transparency', 'correspondent banking', 'EEA', 'EU Regulation 2021/1230'],
    demoRelevant: false,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2486',
    name: 'Foreign Currency Account Opening for Cross-Border Clients Not Subject to Enhanced CDD Triggers',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital opens foreign currency accounts for international corporate clients
      — including EUR, GBP, and CAD denominated operating accounts — using the bank's
      standard commercial account CDD process, which does not include the enhanced due
      diligence triggers that the bank's BSA/AML program applies to correspondent accounts
      held for foreign financial institutions. FinCEN's CDD rule and FATF Recommendation 13
      require that accounts used by international clients for cross-border payment flows
      receive scrutiny equivalent to correspondent account due diligence when the client
      uses the account to originate or receive cross-border payments on behalf of third parties.
      The OCC's 2025 BSA/AML examination finds that First Capital's FX account CDD
      process has a structural gap for international corporate clients using FX accounts
      for apparent third-party payment flows, which is indistinguishable from correspondent
      banking without correspondent account governance.`,
    keywords: ['foreign currency accounts', 'enhanced CDD', 'FinCEN CDD rule', 'correspondent banking', 'OCC'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2487',
    name: 'SWIFT gpi Stop and Recall Payment Feature Not Implemented Leaving Erroneous Wire Unrecoverable',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `SWIFT's gpi Instant Stop and Recall service enables financial institutions to initiate
      near-instant recall requests for erroneous or fraudulent cross-border wire payments,
      with the request transmitted through the SWIFT network to each bank in the payment
      chain before the funds are credited to the final beneficiary. First Capital has not
      implemented the gpi Instant Stop and Recall service, relying instead on the manual
      SWIFT MT199 message recall process, which takes 3–7 business days and has a successful
      recall rate of approximately 40% for cross-border wires. When a commercial client
      reports a $780,000 business email compromise fraud on an outbound cross-border wire
      within minutes of payment execution, First Capital's inability to initiate an instant
      recall allows the funds to reach the beneficiary account before the manual recall
      request is processed, resulting in a near-total fraud loss that gpi Stop and Recall
      would have prevented.`,
    keywords: ['SWIFT gpi', 'payment recall', 'BEC fraud', 'cross-border wire', 'SWIFT Stop and Recall'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2488',
    name: 'Cross-Border Outward Remittance Reporting to FinCEN Not Automated for Aggregate Reporting Thresholds',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's BSA/AML compliance system monitors individual cross-border remittance
      transactions against CTR filing thresholds but does not aggregate multiple same-day
      outbound remittance transactions by the same originator for aggregate CTR threshold
      analysis. A high-volume remittance originator structures its cross-border transfers
      as multiple sub-$10,000 transactions processed throughout the day, individually below
      the CTR threshold but collectively aggregating to $84,000 in a single day. FinCEN's
      currency transaction reporting rules require aggregation of structurally similar
      same-day transactions by the same individual when the bank has reason to believe they
      are related; First Capital's transaction monitoring system does not flag the pattern
      because no single transaction exceeds $10,000, creating a CTR aggregation failure
      that constitutes a BSA/AML reporting gap under 31 CFR Part 1010.311.`,
    keywords: ['CTR aggregation', 'FinCEN', 'cross-border remittance', 'BSA/AML', 'structuring'],
    demoRelevant: false,
    subTopic: 'cross-border-correspondent',
  },
  {
    code: 'B2489',
    name: 'International ACH Transaction IAT Entry Class Code Not Used for Eligible Cross-Border ACH Credits',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `NACHA's International ACH Transaction operating rules require that ACH entries with
      a settlement leg outside the United States use the IAT standard entry class code,
      which carries additional OFAC screening, beneficiary address, and foreign financial
      institution identification fields designed to support BSA/AML and international
      wire monitoring requirements. First Capital's commercial banking platform permits
      corporate clients to originate PPD and CCD ACH entries for payments that ultimately
      settle through a Canadian correspondent bank to a Canadian beneficiary, without
      enforcing IAT code usage for the cross-border leg. NACHA's compliance review
      identifies 340 CCD and PPD entries per quarter processed by First Capital that
      should have been originated as IAT entries, creating a systematic NACHA rule
      compliance deficiency and a BSA/AML screening gap because IAT-required OFAC
      fields are not populated on non-IAT cross-border entries.`,
    keywords: ['NACHA IAT', 'international ACH', 'cross-border ACH', 'OFAC', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'cross-border-correspondent',
  },

  // ── Payment Card Security (B2490–B2499) ──────────────────────────────────

  {
    code: 'B2490',
    name: 'PCI DSS v4.0 Requirement 6.4 Client-Side Script Security Controls Not Implemented by Deadline',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `PCI DSS version 4.0, which became the sole standard effective March 2024, includes
      Requirement 6.4 — a new mandatory control requiring entities to manage all payment
      page scripts that execute in the consumer's browser, including maintaining an
      inventory of authorized scripts and deploying integrity-checking mechanisms to
      detect unauthorized script modifications that could enable Magecart-style card
      skimming attacks. First Capital's online bill payment portal is in-scope for PCI
      DSS as a payment page that collects card data, but the bank's PCI compliance program
      update for v4.0 has not implemented the Requirement 6.4 script inventory and
      integrity monitoring controls by the March 2025 deadline. The bank's QSA identifies
      the Requirement 6.4 gap as a non-compliant finding in the annual Report on Compliance,
      placing First Capital's PCI DSS compliance certificate in jeopardy pending remediation.`,
    keywords: ['PCI DSS v4.0', 'Requirement 6.4', 'Magecart', 'card security', 'QSA'],
    demoRelevant: true,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2491',
    name: 'Card Tokenization Implementation Uses Non-PCI-Compliant Token Vault Hosted by Third Party Without Audit',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital deploys card tokenization for its e-commerce merchant clients, replacing
      primary account numbers in stored credential transactions with tokens managed by a
      third-party token vault vendor. The token vault vendor is represented as PCI DSS
      Level 1 compliant in its sales materials, but First Capital's vendor due diligence
      process accepts the vendor's self-attestation without reviewing the vendor's current
      Attestation of Compliance or verifying the vendor's inclusion on the applicable
      card network's registered service provider lists. The vendor's actual PCI DSS
      assessment has lapsed by 14 months at the time First Capital onboards; when a
      cardholder data breach occurs at the token vault, Visa's forensic investigation
      finds that the vault had implemented deprecated encryption for stored tokens in
      violation of PCI DSS Requirement 3.5, and First Capital — as the party responsible
      for the token vault's PCI compliance verification — shares liability for the breach.`,
    keywords: ['card tokenization', 'PCI DSS', 'token vault', 'TPRM', 'cardholder data breach'],
    demoRelevant: true,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2492',
    name: 'Merchant Acquiring Risk Tiering Model Not Updated to Reflect Rise of Marketplace Aggregator Merchants',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's merchant acquiring risk tiering model classifies merchants into
      risk categories based on merchant category code, annual processing volume, and
      chargeback history, using a risk taxonomy developed when the bank's merchant
      portfolio consisted primarily of traditional retail and restaurant merchants.
      The emergence of marketplace aggregator merchants — platforms that process payments
      on behalf of multiple sub-merchants without disclosing the sub-merchant identity
      to First Capital's acquiring platform — creates a risk category that the existing
      tiering model does not address. Visa's October 2024 rule changes require acquirers
      to monitor marketplace aggregators as "payment facilitators" with enhanced due
      diligence; First Capital's portfolio includes 23 marketplace merchants processed
      under standard merchant risk controls that do not meet the Visa payment facilitator
      monitoring requirements.`,
    keywords: ['merchant acquiring risk', 'payment facilitator', 'Visa rules', 'chargeback', 'marketplace merchants'],
    demoRelevant: false,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2493',
    name: 'Debit Card PIN Verification System Does Not Enforce Minimum PIN Length for Reissued Cards',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's debit card PIN management system enforces a minimum 4-digit PIN
      length for initial PIN selection, but the PIN change workflow for reissued replacement
      cards — cards issued after a data compromise event — allows cardholders to set a
      new PIN through an IVR process that accepts 4-digit entries without enforcing the
      bank's updated minimum 6-digit PIN policy that was adopted following the bank's
      2023 debit card fraud strategy review. The inconsistency between the card issuance
      PIN policy (6 digits) and the card replacement IVR process (accepting 4 digits) is
      not identified during the card replacement workflow testing because the testing team
      focused on the new card issuance flow rather than the replacement path. FFIEC's
      authentication guidance recommends 6-digit PINs as a minimum for debit card
      authentication, and the bank's own policy inconsistency creates a knowable
      fraud control gap.`,
    keywords: ['debit card PIN', 'FFIEC authentication', 'card reissuance', 'fraud controls', 'card security'],
    demoRelevant: false,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2494',
    name: 'EMV 3DS2 Authentication Not Enabled for Card-Not-Present Transactions Above Risk Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `Visa and Mastercard mandate EMV 3D Secure version 2 authentication for card-not-present
      e-commerce transactions above defined risk thresholds as a condition of chargeback
      liability shift — merchants and issuers that do not implement 3DS2 retain full
      liability for card-not-present fraud regardless of authentication outcome. First Capital's
      card issuing platform supports 3DS2 frictionless authentication but has not enabled
      the step-up challenge authentication flow required when the 3DS2 risk engine flags a
      transaction as high-risk, defaulting to an approve or decline decision rather than
      triggering the challenge. The absence of the challenge authentication pathway means
      First Capital retains fraud liability for high-risk CNP transactions that could be
      shifted to the merchant under 3DS2, accumulating an estimated $2.1 million in
      preventable fraud liability annually based on the bank's CNP chargeback volume analysis.`,
    keywords: ['EMV 3DS2', 'card-not-present fraud', 'chargeback liability', 'Visa', 'Mastercard'],
    demoRelevant: true,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2495',
    name: 'PCI DSS Scope Reduction Through Network Segmentation Not Validated With QSA Before Annual Assessment',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's PCI DSS compliance program relies on network segmentation to
      reduce the scope of systems subject to PCI DSS controls, segregating the cardholder
      data environment from the bank's general corporate network through firewall rules
      and network access control policies. Following a network infrastructure modernization
      project, the segmentation architecture is updated by the bank's network engineering
      team without engaging the bank's QSA to validate that the new network topology
      maintains the scope reduction that the previous architecture achieved. The annual
      QSA assessment finds that three network path changes created unintended connectivity
      between the general corporate network and the cardholder data environment, expanding
      PCI DSS scope to include 47 additional systems that were not subject to PCI controls
      during the intervening period, creating a potential unassessed control gap that
      requires retroactive remediation documentation.`,
    keywords: ['PCI DSS scope', 'network segmentation', 'QSA', 'cardholder data environment', 'PCI compliance'],
    demoRelevant: false,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2496',
    name: 'Contactless Card Transaction Limit Not Updated Following Visa and Mastercard Post-Pandemic Increase',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `Visa and Mastercard increased the contactless card transaction limit for U.S. issuers
      from $100 to $250 in 2023 to align with cardholder convenience expectations
      following pandemic-driven contactless adoption. First Capital's debit and credit card
      contactless transaction limit remains set at $100 because the bank's card management
      system parameter update requires a product change governance approval, and the change
      was submitted but not prioritized in the bank's card product governance calendar for
      18 months. Cardholders attempting contactless transactions above $100 are unexpectedly
      prompted to insert their card and enter a PIN, creating friction at high-volume retail
      environments that causes cardholder complaints and, in several instances, abandoned
      purchases attributed to First Capital's debit card products in customer satisfaction
      surveys that the bank's card product team receives from merchant partners.`,
    keywords: ['contactless card limit', 'Visa', 'Mastercard', 'debit card', 'card product management'],
    demoRelevant: false,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2497',
    name: 'Merchant Chargeback Dispute Process Not Compliant With Visa Compelling Evidence 3.0 Rules',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `Visa's Compelling Evidence 3.0 framework, effective April 2023, allows merchants
      to challenge certain 10.4 (Other Fraud — Card-Absent) chargebacks by providing
      compelling evidence of prior non-disputed transactions from the same device ID and
      IP address within a defined lookback window, effectively shifting the fraud liability
      burden back to the issuer when the prior transaction evidence is accepted. First
      Capital's dispute processing team has not updated its chargeback response procedures
      to evaluate whether Compelling Evidence 3.0 applies to incoming 10.4 disputes,
      because the rule change was communicated through Visa's operating rules update
      notice but not incorporated into the bank's chargeback procedure manual. First
      Capital fails to apply Compelling Evidence 3.0 defenses on 340 eligible disputes
      in the first year, forfeiting an estimated $410,000 in chargeback liability that
      could have been reversed.`,
    keywords: ['Visa Compelling Evidence 3.0', 'chargeback dispute', 'fraud liability', 'card operations', 'Visa rules'],
    demoRelevant: true,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2498',
    name: 'Card Program Account Data Compromise Event Response Plan Not Tested in Tabletop Exercise',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's card program incident response plan for an account data compromise
      event — triggered when a PCI forensic investigation identifies unauthorized access
      to cardholder data — defines response roles, notification timelines for card networks
      and regulators, and mass card reissuance procedures. The response plan has not been
      exercised in a tabletop simulation since its creation three years prior, and key
      roles specified in the plan are now held by different personnel who have not
      participated in an ADC response drill. When a third-party processor data breach
      requires First Capital to activate its ADC response plan for 84,000 affected
      cards, the response team's unfamiliarity with the plan's card network notification
      procedures causes the bank to miss Visa's required 72-hour notification window,
      creating a compliance violation that triggers an immediate $10,000 per-day
      penalty assessment from Visa's compliance program.`,
    keywords: ['account data compromise', 'PCI DSS', 'Visa notification', 'incident response', 'card security'],
    demoRelevant: true,
    subTopic: 'payment-card-security',
  },
  {
    code: 'B2499',
    name: 'Virtual Card Issuance for Commercial AP Not Subject to PCI DSS Scope Review Before Launch',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital launches a virtual card accounts payable product for commercial clients,
      enabling the bank to issue single-use virtual Visa card numbers for each supplier
      payment, capturing interchange revenue while providing clients with payment automation
      and reconciliation benefits. The bank's PCI DSS compliance team is not engaged in
      the virtual card product launch because the product management team classifies virtual
      card issuance as a software feature of the commercial banking platform rather than
      a new cardholder data environment. The virtual card issuance system stores, processes,
      and transmits primary account numbers — PAN data — for the single-use virtual cards
      between the bank's treasury management platform, the Visa network, and commercial
      clients' ERP systems, introducing new PCI DSS scope elements that are not covered
      by the bank's current annual QSA assessment scope definition and not subject to
      the PCI DSS controls required for cardholder data handling.`,
    keywords: ['virtual card', 'PCI DSS scope', 'commercial AP', 'QSA', 'cardholder data'],
    demoRelevant: true,
    subTopic: 'payment-card-security',
  },

];
