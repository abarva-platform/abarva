// seed-banking-dom08-payments-part6.ts
// Banking genome patterns — Payments & Transaction Processing
// Code range: B2500–B2559  (60 patterns)
// Sub-topics: ai-payments-advanced (B2500–B2517, 18, all aiInsertionRisk: true),
//             iso20022-migration (B2518–B2529, 12),
//             central-bank-digital-currency (B2530–B2539, 10),
//             payment-network-compliance (B2540–B2549, 10),
//             treasury-payments-risk (B2550–B2559, 10)
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
  aiInsertionRisk?: boolean;
}

export const BANKING_DOM08_PAYMENTS_PART6_PATTERNS: PatternSeed[] = [

  // ── AI Payments Advanced (B2500–B2517, all aiInsertionRisk: true) ─────────

  {
    code: 'B2500',
    name: 'AI Correspondent Banking Due Diligence Misses Shell Entity Layering',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI model to automate correspondent banking due diligence reviews,
      using the model to assess respondent bank ownership structures, jurisdictional risk ratings,
      and AML program adequacy from submitted documentation packets. The AI model performs well
      on straightforward single-layer ownership structures but fails to detect multi-tier shell
      entity layering where a respondent bank's ultimate beneficial owners are obscured behind
      three or more holding company layers in secrecy jurisdictions — a pattern that human
      analysts previously flagged through iterative document cross-referencing. FFIEC guidance
      on correspondent banking due diligence and OCC BSA/AML examination procedures both require
      that respondent bank ownership be traced to ultimate beneficial controllers; First Capital's
      AI model approves two respondent relationships where subsequent FinCEN SAR analysis
      reveals shell entity structures concealing sanctioned-country exposure.`,
    keywords: ['AI correspondent banking', 'shell entity detection', 'FinCEN', 'OCC', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2501',
    name: 'GenAI SWIFT Message Interpretation Hallucination Creates Misdirected Wire Payments',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital deploys a generative AI assistant to help its international wire operations
      team parse and interpret complex SWIFT MT103 and MT202 messages, particularly for payments
      containing non-standard free-text fields, mixed-language beneficiary details, and
      multi-bank chain instructions. In a documented incident, the GenAI assistant misinterprets
      a SWIFT MT103 field 70 remittance information entry containing abbreviated German-language
      beneficiary address details as a routing instruction to an alternate correspondent,
      causing the operations team to manually re-enter wire instructions directing $1.4 million
      to the wrong final beneficiary bank. UCC Article 4A assigns liability to the receiving
      bank when execution errors result from the bank's own processing failure rather than
      the originator's instruction; the GenAI interpretation hallucination constitutes a
      bank-side processing error with full Article 4A liability exposure.`,
    keywords: ['GenAI SWIFT parsing', 'MT103 interpretation', 'UCC Article 4A', 'wire misdirection', 'AI hallucination'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2502',
    name: 'ML Liquidity Forecasting Deployed Without Model Governance Breach of SR 11-7',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's treasury division deploys an ML model to forecast 30-day liquidity
      requirements for its intraday payment settlement obligations across Fedwire, FedNow,
      and CHIPS, using the forecast to optimize reserve positioning and minimize the cost
      of overnight borrowing. The ML forecasting model was developed by an external fintech
      vendor and integrated directly into the bank's liquidity management system without
      formal model risk management review, independent validation, or inclusion in the
      bank's SR 11-7 model inventory. When the model's forecasts systematically underestimate
      peak intraday settlement demand following a change in the bank's large-value payment
      client mix, the bank's liquidity buffer falls below its internal LCR stress scenario
      threshold on four consecutive days before the forecasting error is identified; the
      OCC's examination team issues a Matter Requiring Attention for SR 11-7 non-compliance
      in the bank's liquidity model governance program.`,
    keywords: ['ML liquidity forecasting', 'SR 11-7', 'OCC', 'model governance', 'LCR'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2503',
    name: 'AI Payment Compliance Engine Lacks OFAC Confidence Scoring for Auto-Clear Decisions',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an AI-driven payment compliance engine that automatically clears
      OFAC SDN name-match alerts for inbound and outbound wire transactions when the engine's
      internal confidence score exceeds a threshold calibrated during vendor testing, without
      surfacing the underlying confidence score to compliance analysts or audit logs. The
      AI engine's auto-clear decisions are not accompanied by a calibrated probability
      estimate that would allow compliance staff to assess whether the auto-clear threshold
      is appropriately conservative for the specific transaction risk profile — high-value
      wires to high-risk jurisdictions are auto-cleared at the same threshold as low-value
      domestic transfers. OFAC's compliance framework requires that sanctions screening
      decisions be made with documented risk-based reasoning; the absence of confidence
      score transparency in auto-clear decisions creates an examination finding characterized
      by the OCC's BSA/AML team as a systemic documentation deficiency.`,
    keywords: ['AI OFAC screening', 'confidence scoring', 'OCC', 'BSA/AML', 'sanctions compliance'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2504',
    name: 'LLM Payment Instruction Parsing Errors Generate Duplicate Origination in ACH Batch',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital deploys an LLM-assisted workflow tool that converts commercial client
      payment instruction files — submitted in unstructured formats including PDF, Excel, and
      Word — into properly formatted NACHA ACH batch files for origination processing.
      The LLM parsing layer produces accurate output for well-structured client files but
      introduces duplicate entry errors when processing multi-page instruction sets where
      payment entries span page breaks, causing the model to re-parse continuation entries
      as new transaction records. Three commercial payroll clients experience ACH batch
      origination with duplicate entries totaling $890,000 in excess debits before the
      duplicate detection controls in First Capital's ACH origination platform flag the
      anomaly; NACHA's ODFI standards require that originators implement pre-transmission
      duplicate detection, which First Capital's LLM-to-NACHA conversion layer bypasses.`,
    keywords: ['LLM payment parsing', 'ACH duplicate origination', 'NACHA', 'ODFI', 'payment errors'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2505',
    name: 'AI Fraud Scoring Model for FedNow Not Validated Against Real-Time Payment Speed Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI fraud scoring model to evaluate FedNow send requests in
      real time, applying a risk score to each payment request and routing high-risk transactions
      to a manual review queue before release. The model was validated for accuracy and
      discrimination on historical transaction data but was not subjected to latency testing
      under production-level transaction volume; when the bank's FedNow volume increases
      following marketing launch, the AI model's inference latency increases to 4.2 seconds
      at peak throughput, causing FedNow send requests to time out and return payment
      failures to originating clients. The Federal Reserve's FedNow operating rules require
      that participating institutions implement fraud controls that do not systematically
      impair the network's real-time settlement performance; First Capital's latency-impaired
      fraud model generates 340 avoidable payment failures in the first post-launch quarter.`,
    keywords: ['AI fraud scoring', 'FedNow latency', 'Federal Reserve', 'real-time payments', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2506',
    name: 'GenAI Correspondent Bank Relationship Summary Omits Negative News Indicators',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital uses a generative AI tool to produce relationship summary reports for
      its correspondent banking portfolio, aggregating publicly available information about
      respondent banks into a quarterly overview for relationship managers and the BSA
      compliance team. The GenAI tool is instructed to produce balanced, professional
      summaries and through RLHF fine-tuning has developed a tendency to under-weight or
      omit adverse news items — regulatory enforcement actions, money laundering charges,
      and ownership controversies — relative to positive relationship indicators such as
      asset growth and correspondent network expansion. FFIEC guidance on correspondent
      banking due diligence requires that ongoing monitoring include negative news analysis;
      a respondent bank subject to a FinCEN civil money penalty for BSA violations
      receives a GenAI-generated relationship summary describing it as a "growing regional
      bank with expanding correspondent relationships" without referencing the enforcement action.`,
    keywords: ['GenAI correspondent monitoring', 'FFIEC', 'FinCEN', 'adverse news', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2507',
    name: 'Agentic AI Payment Exception Handling Agent Creates Unauthorized Holds on Consumer Accounts',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital deploys an agentic AI system to manage payment exception processing —
      handling returned ACH entries, rejected wire instructions, and unmatched inbound
      credits — by autonomously placing account holds, generating exception notifications,
      and initiating fund recovery workflows. The agent's hold logic is misconfigured to
      apply a precautionary hold to consumer deposit accounts whenever an outbound ACH
      return is received, regardless of whether the consumer account holds sufficient
      funds to cover the return; this causes the agent to place holds on accounts with
      positive balances, triggering declined debit card transactions for affected consumers.
      Regulation E's error resolution procedures and the CFPB's 2025 guidance on AI-driven
      account actions both require that automated holds on consumer funds be accompanied
      by timely notice and be limited to the disputed amount; First Capital's agent
      places blanket holds exceeding CFPB guidelines on 1,200 consumer accounts.`,
    keywords: ['agentic AI', 'account holds', 'Reg E', 'CFPB', 'ACH returns'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2508',
    name: 'ML Payment Network Routing Model Systematically Selects Higher-Cost Rails Without Client Disclosure',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's ML payment network routing model is optimized on a composite objective
      function that weights settlement speed and bank profitability, inadvertently producing
      a systematic tendency to route eligible payments over Fedwire rather than same-day ACH
      when the profitability weight exceeds the cost-minimization weight at certain transaction
      sizes. Commercial clients with treasury management agreements specifying best-execution
      routing receive AI-selected Fedwire routing for transactions that would have settled
      equivalently via same-day ACH at materially lower cost; the model's profitability
      weighting was introduced during a retraining cycle without a formal model change
      management review. The OCC's 2025 AI governance guidance and UCC Article 4A both
      require that payment execution comply with the originator's stated preference for
      cost-effective routing when the bank has undertaken a best-execution obligation.`,
    keywords: ['ML routing model', 'best-execution', 'UCC Article 4A', 'OCC', 'Fedwire vs ACH'],
    demoRelevant: false,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2509',
    name: 'AI Cross-Border Remittance Fee Disclosure Model Produces Inaccurate Consumer Estimates',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deploys an AI model to generate pre-transaction fee disclosures for
      international remittance transfers as required by the Dodd-Frank Act's remittance
      transfer provisions and the CFPB's Regulation E remittance rules, using the model
      to estimate correspondent fees, exchange rate margins, and taxes applicable to the
      destination country. The AI model's fee estimates are based on training data that
      is updated quarterly but does not reflect real-time correspondent fee changes, causing
      the model to systematically under-estimate total transfer costs by 8–15% for corridors
      where correspondent banks have recently revised their fee structures. The CFPB's
      remittance transfer rules require that disclosed fees be accurate at the time of
      disclosure or the bank must bear the difference; First Capital's AI-generated
      disclosures create systematic Reg E compliance violations across its consumer
      remittance product for 14 high-volume corridors.`,
    keywords: ['AI remittance disclosure', 'CFPB', 'Reg E remittance', 'Dodd-Frank', 'correspondent fees'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2510',
    name: 'AI Transaction Monitoring Model Generates Structured Transaction Alerts Without Consideration of Context',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AI transaction monitoring model generates structuring alerts for cash
      deposit patterns that fall below CTR reporting thresholds without incorporating
      customer relationship context — including known business type, historical cash-handling
      patterns, and account age — as mitigating factors in the alert scoring. The model
      produces structuring alerts for legitimate cash-intensive businesses such as car washes,
      laundromats, and retail food service operators whose regular deposit patterns match
      structuring indicators when analyzed in isolation, generating a 4.3× false positive rate
      compared to the bank's prior rules-based system. FinCEN's SAR guidance and the FFIEC
      BSA/AML examination manual both require that structuring alert decisions incorporate
      customer context before SAR filing; First Capital's context-blind AI model creates
      systematic over-filing that the bank's BSA officer characterizes as a FinCEN
      relationship management risk.`,
    keywords: ['AI transaction monitoring', 'structuring alerts', 'FinCEN', 'FFIEC', 'SAR false positives'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2511',
    name: 'GenAI Payment Operations Knowledge Base Surfaces Superseded SWIFT Standards to Operations Staff',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's payment operations team uses a GenAI knowledge base assistant to
      look up SWIFT message format specifications, field definitions, and processing rules
      during complex international wire processing. The knowledge base's training corpus
      includes SWIFT standards documentation that predates the 2022 ISO 20022 co-existence
      migration timeline, and the GenAI assistant responds to queries about MT versus MX
      message equivalence using pre-migration guidance that does not reflect current SWIFT
      co-existence rules. Operations staff following outdated AI-sourced guidance generate
      MT202 cover payment messages with incomplete ISO 20022 originator data fields required
      by receiving institutions that have migrated to MX processing, causing payment rejections
      at correspondent banks; the knowledge base's training data cutoff is not disclosed
      to operations users, creating a silent accuracy risk in SWIFT format guidance.`,
    keywords: ['GenAI knowledge base', 'SWIFT MT vs MX', 'ISO 20022', 'payment operations', 'AI staleness'],
    demoRelevant: false,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2512',
    name: 'AI Sanctions Screening Vendor Model Lacks Financial Institution-Specific False Positive Calibration',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital licenses an AI-powered sanctions screening solution that was trained
      and calibrated on a generic multi-industry dataset representing retail, corporate,
      and correspondent payment flows from multiple financial institution types, including
      community banks, credit unions, and large money center institutions. The vendor model's
      name-matching thresholds and SDN false positive rates are calibrated to the aggregate
      training population, not to First Capital's specific correspondent banking and commercial
      payment customer profile, resulting in a false positive rate that is 60% higher than the
      industry benchmark for comparable transaction volumes. OFAC's compliance framework and
      the bank's own BSA compliance program require that screening systems be calibrated to
      produce manageable alert volumes; the excessive false positive burden delays processing
      of legitimate international payments and strains the compliance team's alert review
      capacity, creating a queue backlog that the OCC examiner characterizes as a systemic
      screening program deficiency.`,
    keywords: ['AI sanctions screening', 'false positive calibration', 'OFAC', 'OCC', 'vendor model'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2513',
    name: 'ML Payment Velocity Model Incorrectly Restricts Legitimate Intraday Commercial Treasury Sweeps',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deploys an ML payment velocity model that flags accounts exceeding
      intraday payment volume thresholds as potential fraud or operational error, automatically
      routing flagged accounts to a payment hold queue for human review. The model's velocity
      thresholds were calibrated on the bank's retail and small business transaction dataset
      and do not account for legitimate intraday treasury sweep patterns exhibited by large
      commercial clients, which routinely generate 50–200 outbound ACH and wire transactions
      during morning settlement windows. During a quarterly commercial payroll cycle, the
      ML model flags eight commercial client accounts for velocity holds, delaying $34 million
      in legitimate payroll ACH origination and triggering client complaints to the bank's
      executive relationship team; the model's commercial client exclusion list was not
      updated following the bank's mid-year acquisition of a new commercial banking portfolio.`,
    keywords: ['ML velocity model', 'commercial treasury', 'ACH payroll', 'fraud false positive', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2514',
    name: 'AI-Assisted SWIFT gpi Tracking Confabulates Payment Status for Delayed Correspondent Confirmations',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital deploys an AI assistant to help relationship managers and commercial
      clients track SWIFT gpi payment status, interpreting gpi tracker data and generating
      plain-language status updates when clients inquire about international wire progress.
      When SWIFT gpi tracker confirmations are delayed — a common occurrence when correspondent
      banks experience system maintenance windows — the AI assistant interpolates probable
      payment status from historical settlement timing data and generates confident status
      updates such as "your payment is in final processing at the beneficiary bank" that
      are not supported by actual gpi tracker data. Three commercial clients make business
      decisions based on AI-generated payment status updates that prove incorrect when
      the delayed confirmations arrive showing the payments are still in transit; UCC Article
      4A assigns bank liability when the bank provides materially incorrect payment status
      information that the originator relies upon to its detriment.`,
    keywords: ['AI SWIFT gpi', 'payment status confabulation', 'UCC Article 4A', 'correspondent banking', 'AI hallucination'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2515',
    name: 'GenAI AML Narrative Generator Produces Insufficient SAR Activity Descriptions for FinCEN Filing',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital deploys a generative AI tool to assist BSA analysts in drafting Suspicious
      Activity Report narratives, using the model to synthesize transaction data, account history,
      and analyst notes into the required FinCEN narrative format. The GenAI narrative generator
      produces grammatically correct and formally structured SAR narratives, but post-filing
      quality review finds that 22% of AI-assisted narratives omit material facts required by
      FinCEN's SAR filing guidance — including specific transaction amounts, dates, and
      counterparty identifiers that the analyst's source notes contained but the AI
      summarized away as granular details. FinCEN's SAR filing requirements mandate that
      narratives contain sufficient factual specificity to support law enforcement investigation;
      the OCC's BSA examination team identifies the AI-assisted narrative deficiencies as
      a recurrence pattern in the bank's SAR quality program.`,
    keywords: ['GenAI SAR narrative', 'FinCEN', 'OCC', 'BSA/AML', 'SAR quality'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2516',
    name: 'AI Payment Hub Concentration Risk Model Underestimates Single-Vendor Technology Dependency',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI model for payment operations risk assessment evaluates concentration
      risk across the bank's payment technology stack, scoring vendor dependency, geographic
      concentration, and channel redundancy. The model systematically underestimates the
      operational impact of the bank's reliance on a single payment hub vendor for ACH,
      Fedwire, RTP, and FedNow origination processing, because the model's training data
      represents payment outage events from an era of greater payment technology diversity
      and does not weight cloud-hosted single-platform concentration risks at appropriate
      severity. When the payment hub vendor experiences a 6-hour outage affecting all four
      payment rails simultaneously, the bank's business continuity plan — which the AI risk
      model rated as "adequate" — proves insufficient to maintain commercial client payment
      service levels; the Federal Reserve's operational resilience guidance requires that
      critical payment infrastructure concentration risks be independently stress-tested.`,
    keywords: ['AI concentration risk', 'payment hub', 'operational resilience', 'Federal Reserve', 'TPRM'],
    demoRelevant: false,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2517',
    name: 'AI-Powered RTP Request for Payment Decisioning Engine Lacks Consumer Consent Verification',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital deploys an AI decisioning engine to automatically respond to RTP Request
      for Payment messages on behalf of enrolled consumer clients, using behavioral models
      to determine whether to auto-approve, auto-decline, or queue for manual review based
      on account balance, payee relationship, and payment amount patterns. The AI engine
      auto-approves RFP responses for amounts below $500 without verifying that the consumer
      has provided affirmative consent for AI-automated payment approvals in the specific
      payee-amount combination, relying on a one-time enrollment consent that the bank's
      consumer compliance team determines is insufficient for ongoing automated payment
      authorization under Regulation E's authorization requirements. The CFPB's 2025 guidance
      on AI-automated payment authorization requires that consumers provide specific and
      revocable authorization for each class of automated payment decision; First Capital's
      blanket enrollment consent does not satisfy the specificity requirement.`,
    keywords: ['AI RTP decisioning', 'Reg E authorization', 'CFPB', 'consumer consent', 'Request for Payment'],
    demoRelevant: true,
    subTopic: 'ai-payments-advanced',
    aiInsertionRisk: true,
  },

  // ── ISO 20022 Migration (B2518–B2529) ────────────────────────────────────

  {
    code: 'B2518',
    name: 'ISO 20022 Data Truncation Risk Strips AML-Critical Beneficiary Fields in Legacy Conversion',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital's SWIFT MT-to-MX message conversion layer truncates beneficiary name
      and address fields when converting legacy MT103 messages from correspondent banks to
      ISO 20022 MX pacs.008 format for internal AML screening, reducing 140-character MT
      beneficiary name fields to the 70-character legacy limit retained by the conversion
      middleware. The truncated beneficiary data is then fed into the bank's OFAC screening
      engine, which screens against the truncated string rather than the full ISO 20022
      beneficiary record; AML analysts identify two instances where SDN name matches present
      in the full ISO 20022 data are undetected because the truncating conversion strips
      the discriminating name components. OFAC and the OCC's BSA/AML examination procedures
      require that data quality controls preserve the integrity of screening inputs through
      format migration; First Capital's conversion layer has not been tested for sanctions-
      relevant field truncation.`,
    keywords: ['ISO 20022 truncation', 'MT to MX conversion', 'OFAC screening', 'OCC', 'SWIFT migration'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2519',
    name: 'Legacy SWIFT Format Conversion Errors Create Incorrect Settlement Amounts in ISO 20022 Pacs Messages',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's SWIFT MT-to-MX conversion gateway mishandles decimal separator
      conventions when converting MT103 settlement amount fields from correspondent banks
      operating in jurisdictions that use comma as the decimal separator rather than period,
      causing the conversion layer to interpret "EUR 1.234,56" as EUR 1,234,560 rather than
      EUR 1,234.56 in the ISO 20022 pacs.008 interbank settlement message. Three large-value
      payment conversions produce inflated settlement amounts that are caught by the bank's
      outbound exception monitoring only after the erroneous MX messages are transmitted to
      the Eurosystem's TARGET2 migration infrastructure. UCC Article 4A and the European
      Central Bank's TARGET2 operating rules both assign liability to the sending institution
      for settlement amount errors originating in the institution's own processing; the
      conversion error represents a format migration testing gap for international number
      format conventions.`,
    keywords: ['ISO 20022 conversion', 'decimal separator', 'pacs.008', 'TARGET2', 'UCC Article 4A'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2520',
    name: 'Rich ISO 20022 Payment Data Not Leveraged for AML Pattern Enhancement Post-Migration',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital completes its SWIFT MT-to-MX migration, gaining access to structured ISO
      20022 MX payment data that includes purpose codes, remittance information structured fields,
      and full Legal Entity Identifier data for corporate originators and beneficiaries — data
      elements that were unavailable in the legacy MT format's free-text fields. The bank's
      BSA/AML transaction monitoring system continues to screen on legacy-equivalent data
      fields extracted from MX messages rather than leveraging the new structured data elements,
      missing an opportunity to enhance AML detection with purpose code anomaly analysis and
      LEI-based counterparty relationship mapping. FFIEC BSA/AML guidance encourages financial
      institutions to enhance transaction monitoring programs when new data elements become
      available; First Capital's failure to upgrade its monitoring rules post-migration
      is cited in an OCC examination as a missed risk management improvement opportunity.`,
    keywords: ['ISO 20022 AML enhancement', 'LEI', 'MX purpose codes', 'FFIEC', 'OCC'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2521',
    name: 'ISO 20022 Ultimate Debtor Field Population Gaps Create Correspondent Bank Rejection Loops',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's ISO 20022 message generation layer does not populate the UltimateDebtor
      structured data block in pacs.008 messages for commercial payments initiated through
      the bank's online corporate treasury portal, leaving the field absent when the originating
      commercial client is acting as a payment intermediary for its own subsidiary network.
      Several of First Capital's European correspondent bank partners have implemented ISO 20022
      validation rules that reject incoming pacs.008 messages with missing UltimateDebtor fields
      when the payment purpose code indicates a third-party initiated transfer; the rejection
      loop requires manual intervention by First Capital's international operations team for
      each affected payment, creating processing delays averaging 4.7 hours and UCC Article 4A
      questions about settlement failure liability for time-critical correspondent payments.`,
    keywords: ['ISO 20022 UltimateDebtor', 'pacs.008 validation', 'correspondent rejection', 'UCC Article 4A', 'SWIFT MX'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2522',
    name: 'ISO 20022 Regulatory Reporting Mapping Errors Cause Incorrect CAMT Statement Data for Corporate Clients',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's ISO 20022 migration includes delivering camt.053 end-of-day account
      statement messages to corporate clients in place of legacy MT940 account statements,
      but the bank's MT940-to-camt.053 mapping layer incorrectly assigns transaction type
      codes for same-day ACH credits, classifying them as international credit transfers
      rather than domestic ACH credits in the camt.053 BkTxCd block. Corporate treasury
      management systems that rely on ISO 20022 bank transaction codes for automated
      reconciliation categorization incorrectly classify the mislabeled entries, requiring
      manual reconciliation corrections for clients whose ERP systems use the camt.053
      transaction type codes for automated general ledger posting rules. The bank's ISO
      20022 migration testing program did not include end-to-end testing with corporate
      client ERP reconciliation systems, leaving the mapping error undetected until post-
      migration client complaints.`,
    keywords: ['ISO 20022 camt.053', 'bank transaction codes', 'corporate reconciliation', 'SWIFT migration', 'ERP integration'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2523',
    name: 'ISO 20022 Structured Address Fields Incomplete for OFAC Jurisdiction Screening Enhancement',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's ISO 20022 implementation populates the StructuredPostalAddress field
      in outbound pacs.008 messages using data from the bank's core system, but the core
      system's address fields do not enforce ISO 3166-1 country code standards — storing
      country data in free-text format with inconsistent abbreviations, legacy codes, and
      descriptive names. The bank's OFAC screening engine uses the structured country code
      field in MX messages to apply jurisdiction-based risk scoring and Cuba, Iran, North
      Korea, and Syria country filters; when the StructuredPostalAddress country field
      contains non-standard values, the screening engine falls back to unstructured address
      text parsing, producing a 12% reduction in screening accuracy for jurisdiction
      identification compared to correctly coded structured addresses.`,
    keywords: ['ISO 20022 structured address', 'OFAC jurisdiction screening', 'ISO 3166', 'OCC', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2524',
    name: 'ISO 20022 LEI Validation Not Enforced for Mandatory Corporate Originator Fields',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's ISO 20022 message processing layer accepts inbound pacs.008 corporate
      payment messages where the InitiatingParty LEI field is populated with syntactically
      invalid or expired Legal Entity Identifiers without rejecting or flagging the messages
      for compliance review. The Global LEI System database provides real-time validation
      of LEI status including expiry and lapsed registration; First Capital's message
      processing layer performs format-only validation of the 20-character LEI structure
      without checking the LEI against the GLEIF registry. Corporate payments with invalid
      LEIs bypass the enhanced due diligence trigger that First Capital's BSA program applies
      to counterparties with unverifiable entity identifiers; the OCC's examination team
      identifies the LEI validation gap as a control weakness in the bank's ISO 20022
      migration quality assurance program.`,
    keywords: ['ISO 20022 LEI validation', 'GLEIF', 'OCC', 'corporate payments', 'BSA due diligence'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2525',
    name: 'ISO 20022 Purpose Code Population Absent for Correspondent Bank Regulatory Reporting Requirements',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital does not populate ISO 20022 payment purpose codes in outbound pacs.008
      messages to its European correspondent bank partners, leaving the Purp block absent
      on all outbound MX payments. Several EU-domiciled correspondent banks are subject to
      European Payment Services Directive requirements that mandate purpose code data for
      certain payment categories including real estate, securities settlement, and foreign
      direct investment, and use purpose codes for their own domestic regulatory reporting
      obligations; the absence of purpose code data from First Capital causes its correspondents
      to request manual clarification for affected payment categories, increasing exception
      processing volumes. The SWIFT ISO 20022 migration adoption guidelines encourage
      purpose code population as a data quality best practice; First Capital's migration
      implementation deliberately excluded purpose codes as a scope reduction measure
      without assessing correspondent reporting impacts.`,
    keywords: ['ISO 20022 purpose codes', 'PSD2', 'correspondent bank', 'SWIFT migration', 'regulatory reporting'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2526',
    name: 'ISO 20022 Remittance Information Rich Data Not Passed Through Correspondent Chain',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `A key commercial promise of ISO 20022 migration is the ability to transmit structured
      remittance information — invoice references, purchase order numbers, and payment
      rationale — alongside the payment instruction in a standardized machine-readable format
      enabling end-to-end reconciliation. First Capital populates ISO 20022 structured
      remittance data blocks in outbound pacs.008 messages but does not verify that its
      correspondent banking partners preserve the remittance data block when forwarding the
      payment through their own systems; analysis of received camt.054 credit confirmations
      shows that two of First Capital's major correspondent banks strip the structured
      remittance block during their own MT-to-MX co-existence processing. Corporate clients
      whose accounts receivable reconciliation workflows depend on ISO 20022 remittance data
      experience reconciliation failures on payments routed through the affected correspondents.`,
    keywords: ['ISO 20022 remittance data', 'pacs.008', 'correspondent data quality', 'SWIFT co-existence', 'AR reconciliation'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2527',
    name: 'ISO 20022 Migration Testing Did Not Cover High-Value CHIPS Payment Format Requirements',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's ISO 20022 migration program tested MX message formats for Fedwire
      and SWIFT correspondent payments but did not include end-to-end testing for large-value
      payments processed through CHIPS — The Clearing House's high-value payment system,
      which completed its own ISO 20022 migration ahead of Fedwire. When First Capital begins
      routing large-value commercial payments through CHIPS following the bank's liquidity
      optimization initiative, format gaps in the bank's pacs.009 financial institution credit
      transfer message population cause CHIPS to reject messages where the InstrForDbtrAgt
      instruction codes do not meet CHIPS-specific business validation rules that differ from
      the SWIFT pacs.009 validation profile. The CHIPS format rejection rate for First Capital's
      initial large-value payment batches reaches 8%, creating settlement delays for time-critical
      commercial payments.`,
    keywords: ['ISO 20022 CHIPS', 'pacs.009', 'high-value payments', 'CHIPS format validation', 'SWIFT MX'],
    demoRelevant: false,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2528',
    name: 'ISO 20022 Data Governance Policy Not Established for Rich Payment Data Retention and Access',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `ISO 20022 MX payment messages contain substantially richer personal and business data
      than legacy MT messages — including full structured names, addresses, LEIs, purpose codes,
      and extended remittance information — creating new data governance obligations around
      retention, access control, and privacy compliance. First Capital's ISO 20022 migration
      program deploys MX processing infrastructure without updating its payment data governance
      policy to address the expanded data set, resulting in MX payment data being stored in
      the same retention tier and access control framework as legacy MT data without
      assessment of GDPR-equivalent state privacy law implications for structured personal
      data in payment records. The OCC's data governance examination framework and the bank's
      own enterprise data management policy require that new data elements be assessed for
      classification, retention, and access control obligations before operational deployment.`,
    keywords: ['ISO 20022 data governance', 'MX data retention', 'GDPR payments', 'OCC', 'data privacy'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },
  {
    code: 'B2529',
    name: 'ISO 20022 AML Enrichment Schema Not Updated to Ingest Structured MX Counterparty Fields',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AML transaction monitoring database schema was designed around the
      SWIFT MT message field set and has not been updated to ingest the additional structured
      counterparty fields available in ISO 20022 MX messages — including the DebtorAgent BIC,
      CreditorAgentBIC, InstructingAgent, and IntermediaryAgent chain fields that provide
      complete correspondent path visibility. The AML system ingests only the fields mapped
      from legacy MT equivalents, discarding the extended chain transparency data that would
      enable detection of high-risk correspondent routing through jurisdictions not visible
      in the MT message format. FFIEC guidance on correspondent banking risk and the OCC's
      BSA/AML examination manual both emphasize the importance of complete payment chain
      visibility for AML monitoring; First Capital's schema lag means the bank is not
      realizing the AML risk improvement benefit of its ISO 20022 migration investment.`,
    keywords: ['ISO 20022 AML schema', 'correspondent chain visibility', 'FFIEC', 'OCC', 'MX enrichment'],
    demoRelevant: true,
    subTopic: 'iso20022-migration',
  },

  // ── Central Bank Digital Currency (B2530–B2539) ──────────────────────────

  {
    code: 'B2530',
    name: 'CBDC Integration Readiness Assessment Not Conducted for Core Banking Architecture',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital has not conducted a formal CBDC integration readiness assessment for its
      core banking and payment infrastructure, despite the Federal Reserve's continued
      exploratory research on a potential digital dollar and public consultation processes
      that indicate infrastructure preparation is a near-term strategic requirement for
      systemically important financial institutions. The bank's core banking system vendor
      does not currently support CBDC ledger account types, real-time CBDC settlement APIs,
      or the digital wallet custody architecture that a retail CBDC distribution model would
      require, and no vendor roadmap assessment has been completed. The OFR and Federal Reserve
      have both published guidance indicating that financial institutions should conduct
      scenario planning for CBDC integration; First Capital's absence of readiness planning
      creates a strategic gap that peer banks with active CBDC working groups have already
      begun to address.`,
    keywords: ['CBDC integration readiness', 'digital dollar', 'Federal Reserve', 'core banking', 'OFR'],
    demoRelevant: true,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2531',
    name: 'Digital Dollar AML Framework Not Designed for Programmable CBDC Transaction Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's BSA/AML program has not been updated to address the transaction
      monitoring requirements that would apply under a retail CBDC distribution model where
      the bank serves as an intermediary holding CBDC wallets for consumer clients. The
      programmable nature of CBDC — where smart contract conditions can trigger automated
      payments, time-locked disbursements, and conditional transfers — creates transaction
      monitoring challenges that First Capital's current rule-based and ML monitoring systems
      are not designed to evaluate, as the systems do not have logic to analyze smart contract
      execution events as potential structuring or layering activity. FinCEN's preliminary
      CBDC guidance and the FFIEC BSA/AML examination manual's emerging technology section
      both note that financial institutions should evaluate their monitoring capabilities
      against CBDC-specific transaction patterns before CBDC rollout.`,
    keywords: ['CBDC AML framework', 'programmable CBDC', 'FinCEN', 'FFIEC', 'digital dollar monitoring'],
    demoRelevant: true,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2532',
    name: 'CBDC Custody Model Risk Not Assessed for Consumer Protection and Insolvency Treatment',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's strategic planning team has not assessed the legal and regulatory risk
      profile of the two primary CBDC custody models under consideration by the Federal Reserve
      — a direct claims model where consumers hold CBDC claims directly on the Federal Reserve,
      and an intermediated model where commercial banks hold CBDC on behalf of clients. The
      bank has not analyzed how CBDC assets held in an intermediated model would be treated
      under FDIC insurance frameworks, state money transmission laws, or the bank's own
      insolvency proceeding structure, nor whether consumer CBDC balances would be subject
      to bank lien rights or set-off provisions. The OCC's trust and custody examination
      framework and emerging CBDC policy guidance both require that institutions assess the
      legal nature of CBDC custody obligations before offering CBDC-related products.`,
    keywords: ['CBDC custody risk', 'FDIC insurance', 'OCC', 'consumer protection', 'insolvency treatment'],
    demoRelevant: false,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2533',
    name: 'CBDC Interoperability With Private Stablecoin Rails Not Evaluated for Regulatory Arbitrage Risk',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's payments strategy team is evaluating CBDC integration scenarios without
      assessing the regulatory arbitrage and financial stability risks that would arise if the
      bank's CBDC infrastructure is interoperable with private stablecoin payment rails — a
      configuration that could enable rapid conversion between CBDC and stablecoins outside
      the bank's AML and BSA monitoring perimeter. The President's Working Group on Financial
      Markets and the Federal Reserve's stablecoin risk reports both identify bank-to-stablecoin
      interoperability as a risk area requiring regulatory analysis before implementation;
      First Capital's CBDC scenario planning does not include an interoperability risk
      assessment as a required workstream, leaving the bank unprepared to respond to
      regulatory inquiries about its CBDC-stablecoin interaction controls.`,
    keywords: ['CBDC interoperability', 'stablecoin risk', 'Federal Reserve', 'PWG', 'regulatory arbitrage'],
    demoRelevant: false,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2534',
    name: 'BSA Customer Due Diligence Program Not Updated for CBDC Wallet Onboarding Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's Customer Due Diligence program for the bank's anticipated CBDC wallet
      product has not been developed, leaving the bank without defined KYC, beneficial
      ownership, and risk rating procedures for consumers opening CBDC wallet accounts.
      The bank's current CDD program covers deposit accounts, loan accounts, and money
      transmission products but does not address the CBDC-specific onboarding considerations
      identified in FinCEN's preliminary guidance — including the treatment of CBDC wallet
      holders who are not existing deposit customers and the application of CDD refresh
      triggers for CBDC transaction pattern changes. FinCEN's 2025 CBDC regulatory
      framework consultation document explicitly identifies CDD program gaps as a priority
      supervisory concern for commercial banks entering the CBDC intermediary market.`,
    keywords: ['CBDC CDD program', 'FinCEN', 'KYC wallet onboarding', 'BSA/AML', 'digital dollar'],
    demoRelevant: true,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2535',
    name: 'CBDC Pilot Infrastructure Privacy Architecture Does Not Meet State Privacy Law Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital participates in a Federal Reserve CBDC pilot program and deploys
      pilot infrastructure that logs all CBDC wallet transaction metadata — including
      transaction amounts, timestamps, and counterparty pseudonymous identifiers — in a
      centralized analytics database accessible to the bank's operations team. The Federal
      Reserve's CBDC privacy design principles and state privacy laws in the bank's
      operating states both require that CBDC transaction data not be used for commercial
      profiling without consumer consent, and that access to individual transaction records
      be restricted to documented compliance and law enforcement purposes. First Capital's
      pilot infrastructure does not implement the access control segmentation and consent
      management architecture required by applicable privacy frameworks, creating a
      regulatory compliance gap identified during the Federal Reserve's pilot governance review.`,
    keywords: ['CBDC privacy', 'Federal Reserve pilot', 'state privacy law', 'transaction metadata', 'data governance'],
    demoRelevant: false,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2536',
    name: 'CBDC Cross-Border Settlement Protocol Gaps Create OFAC Screening Blind Spots',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's analysis of cross-border CBDC settlement scenarios — where foreign
      central bank CBDCs are exchanged through atomic swap arrangements with the U.S. digital
      dollar — identifies a screening blind spot: the atomic swap settlement model's
      pseudonymous counterparty design does not require disclosure of the foreign wallet
      holder's identity to the U.S. intermediary bank, creating an OFAC screening gap
      for CBDC-to-CBDC cross-border transactions. The bank's current OFAC compliance
      program is designed for correspondent banking arrangements where counterparty identity
      is disclosed through SWIFT message fields; the pseudonymous CBDC settlement model
      does not provide equivalent counterparty transparency. OFAC's compliance framework
      requires that financial institutions screen all cross-border payment counterparties;
      the CBDC pseudonymity gap has not been presented to the bank's BSA compliance
      officer for resolution.`,
    keywords: ['CBDC cross-border', 'OFAC screening', 'atomic swap', 'digital dollar', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2537',
    name: 'CBDC Consumer Disclosure Framework Not Developed for Interest-Bearing Digital Dollar Features',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `Federal Reserve CBDC design scenarios include non-interest-bearing and potentially
      interest-bearing variants of a digital dollar, and First Capital has not developed
      a consumer disclosure framework that addresses how CBDC interest features would be
      disclosed under Truth in Savings Act and Regulation DD requirements. The bank's
      existing deposit disclosure infrastructure is designed for FDIC-insured deposit
      products and does not address the novel regulatory classification questions that arise
      if CBDC holds a different legal status from a deposit — including whether TISA's APY
      disclosure requirements, grace period rules, and penalty fee disclosures apply to
      CBDC interest features. The CFPB's emerging technology team has flagged consumer
      disclosure readiness as a key pre-launch requirement for bank-intermediated CBDC
      products.`,
    keywords: ['CBDC consumer disclosure', 'TISA', 'Regulation DD', 'CFPB', 'digital dollar interest'],
    demoRelevant: false,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2538',
    name: 'CBDC Operational Resilience Plan Absent for Digital Wallet Service Continuity Requirements',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's business continuity and operational resilience planning does not
      include CBDC wallet service continuity scenarios, leaving the bank without documented
      recovery time and recovery point objectives for its anticipated CBDC wallet product
      or a contingency plan for maintaining consumer access to CBDC balances during system
      outages. The Federal Reserve's CBDC intermediary governance framework requires that
      participating institutions demonstrate operational resilience for CBDC wallet services
      at standards consistent with systemically important payment system participants; the
      OCC's operational resilience guidance for digital asset activities extends resilience
      requirements to any novel digital payment product that consumers rely upon for
      day-to-day transactions. First Capital's CBDC program governance structure has not
      assigned ownership for operational resilience planning.`,
    keywords: ['CBDC operational resilience', 'Federal Reserve', 'OCC', 'digital wallet continuity', 'BCP'],
    demoRelevant: false,
    subTopic: 'central-bank-digital-currency',
  },
  {
    code: 'B2539',
    name: 'CBDC Liquidity Management Strategy Not Integrated With Federal Reserve Master Account Reserve Planning',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital has not integrated CBDC balance management into its Federal Reserve
      master account reserve planning framework, leaving the bank without a strategy for
      managing the potential reserve impact of large-scale consumer CBDC adoption — including
      scenarios where consumer deposit balances migrate to CBDC wallets at scale, reducing
      the bank's deposit funding base and altering its reserve requirement and liquidity
      coverage ratio position. The Federal Reserve's CBDC research papers and the Basel
      Committee's digital currency liquidity guidance both identify disintermediation risk
      as a key systemic concern for commercial bank CBDC intermediaries; First Capital's
      ALCO has not added CBDC disintermediation stress scenarios to its liquidity stress
      testing framework.`,
    keywords: ['CBDC liquidity management', 'Federal Reserve', 'LCR', 'disintermediation', 'ALCO'],
    demoRelevant: true,
    subTopic: 'central-bank-digital-currency',
  },

  // ── Payment Network Compliance (B2540–B2549) ─────────────────────────────

  {
    code: 'B2540',
    name: 'Mastercard Network Rule Violations From Excessive Chargeback Ratio Trigger Program Review',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's acquiring portfolio includes a segment of online merchants generating
      chargeback ratios that persistently exceed Mastercard's Excessive Chargeback Program
      thresholds — 1% chargeback-to-transaction ratio — without the bank implementing the
      remediation plans that Mastercard's program rules require at the initial threshold
      breach. First Capital's merchant risk monitoring system flags merchants at the 0.85%
      ratio level as "approaching threshold" but does not escalate to Mastercard ECP remediation
      plan requirements until the ratio exceeds 1.5%, using a more lenient internal threshold
      than Mastercard's program mandates. Mastercard network rules specify graduated fee
      assessments and potential program suspension for acquiring banks that fail to remediate
      excessive chargeback merchants; First Capital accumulates $340,000 in Mastercard ECP
      non-compliance assessments before its network compliance team identifies the threshold
      calibration discrepancy.`,
    keywords: ['Mastercard ECP', 'chargeback ratio', 'acquiring compliance', 'network rules', 'merchant risk'],
    demoRelevant: true,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2541',
    name: 'Visa Compelling Evidence 3.0 Dispute Response Process Not Implemented by Operations Team',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `Visa's Compelling Evidence 3.0 framework, introduced in 2023, allows merchants and
      acquiring banks to refute first-party misuse chargebacks by submitting prior undisputed
      transaction evidence demonstrating the cardholder's established relationship with the
      merchant. First Capital's chargeback operations team has not implemented the CE3.0
      evidence submission workflow in its dispute management system, continuing to respond
      to eligible CE3.0 dispute reason codes with legacy evidence frameworks that Visa now
      rates as insufficient for counterfeit and fraud dispute categories. The bank's merchants
      lose 34% of CE3.0-eligible disputes that would qualify for reversal under the new
      framework, representing approximately $890,000 in preventable annual chargeback losses
      across the bank's acquiring portfolio; the operations team attributes the gap to
      delayed training on Visa's updated operating regulation.`,
    keywords: ['Visa CE3.0', 'chargeback disputes', 'acquiring operations', 'Visa operating regulations', 'fraud disputes'],
    demoRelevant: true,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2542',
    name: 'Payment Facilitation Sub-Merchant Underwriting Lacks Visa and Mastercard Required Screening',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital registers as a payment facilitator on the Visa and Mastercard networks,
      assuming the network-required obligation to underwrite and monitor sub-merchants processed
      under the bank's payment facilitator merchant ID. The bank's sub-merchant onboarding
      process does not implement the MATCH file screening check required by both Visa and
      Mastercard network rules for all sub-merchant applicants — a database of merchants
      terminated by other acquirers for cause that must be consulted before onboarding.
      First Capital onboards three sub-merchants that appear on the MATCH file for prior
      fraud and chargeback violations, which subsequently generate $1.2 million in chargebacks
      before the bank identifies the MATCH status through a routine network compliance audit.
      Visa and Mastercard both assess non-compliance fines against payment facilitators that
      fail to screen sub-merchants against the MATCH file.`,
    keywords: ['payment facilitation', 'MATCH file screening', 'Visa network rules', 'Mastercard', 'sub-merchant risk'],
    demoRelevant: true,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2543',
    name: 'Scheme Compliance Audit Gaps Leave Network Rule Updates Unreviewed for 18 Months',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's payment network compliance function does not have a systematic process
      for reviewing and implementing Visa and Mastercard operating regulation updates,
      relying on an annual external compliance review rather than a continuous monitoring
      process that tracks network rule changes as they are published in quarterly bulletin
      updates. Visa and Mastercard each issue operating regulation updates quarterly that
      can include mandatory compliance deadlines for new fraud liability shift rules,
      authentication requirements, and chargeback dispute code changes; First Capital's
      annual review cycle means the bank can be operating under outdated rule assumptions
      for up to 18 months following a rule change. The bank receives a Mastercard compliance
      notice for failing to implement the updated EMV 3DS 2.3 authentication requirements
      within the network's mandatory compliance timeline.`,
    keywords: ['scheme compliance audit', 'Visa operating regulations', 'Mastercard', 'EMV 3DS', 'network rule updates'],
    demoRelevant: true,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2544',
    name: 'Visa Token Service Integration Gaps Create Card-on-File Liability Shift Eligibility Failures',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's merchant acquiring platform integrates with the Visa Token Service for
      card-on-file tokenization but does not implement the VTS token requestor ID mapping
      required to transmit eligible card-on-file tokens in the authorization message's
      token assurance data fields. Without the token assurance data, Visa's fraud liability
      shift rules do not apply to authenticated token transactions processed by First Capital
      merchants, meaning the bank and its merchants bear fraud liability for transactions
      that would qualify for network-side liability shift if the token assurance data were
      correctly populated. First Capital's merchants pay $670,000 in excess fraud losses
      annually on card-on-file token transactions that should qualify for Visa's liability
      shift; the integration gap was introduced during a platform migration and not detected
      by the bank's post-migration network compliance testing.`,
    keywords: ['Visa Token Service', 'card-on-file tokenization', 'liability shift', 'VTS', 'acquiring integration'],
    demoRelevant: false,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2545',
    name: 'Mastercard Identity Check Express Mandate Not Met by Issuing Portfolio for Non-3DS Transactions',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `Mastercard's Identity Check Express mandate requires that issuers support EMV 3DS
      2.x authentication for card-not-present transactions above defined thresholds, with
      non-compliant issuers bearing fraud liability for transactions that would have qualified
      for 3DS authentication but were processed outside the program. First Capital's credit
      card issuing portfolio has deployed EMV 3DS 2.x for its direct digital banking channel
      but has not implemented 3DS support for card-present digital wallet transactions where
      the wallet provider's authentication pathway bypasses the bank's 3DS infrastructure.
      Mastercard's network liability shift rules assign fraud liability to the issuer when
      the issuer's failure to support 3DS is the proximate reason an authenticated transaction
      was not performed; First Capital's issuing portfolio bears $520,000 in annual CNP
      fraud losses attributable to the wallet authentication gap.`,
    keywords: ['Mastercard Identity Check', 'EMV 3DS 2.x', 'issuer liability shift', 'digital wallet', 'CNP fraud'],
    demoRelevant: false,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2546',
    name: 'Network-Mandated Fraud Data Reporting Not Submitted Within Visa and Mastercard Required Timelines',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `Visa and Mastercard both require acquiring banks to submit fraud data reports — including
      transaction-level fraud disposition data for disputed transactions and merchant-level
      fraud rate reporting — within defined submission timelines to support network-wide
      fraud intelligence programs. First Capital's acquiring operations team submits fraud
      data on a monthly batch basis rather than the weekly cadence required by Mastercard's
      Global Security Bulletin for banks with acquiring volumes above threshold, and does
      not submit the transaction-level fraud detail that Visa's Risk Management Network
      requires alongside aggregate merchant fraud rates. Both networks assess non-compliance
      fines for systematic reporting failures; First Capital accumulates network non-compliance
      assessments for late and incomplete fraud data submissions before the gap is identified
      during an annual network relationship review.`,
    keywords: ['network fraud reporting', 'Visa risk management', 'Mastercard', 'acquiring compliance', 'fraud data submission'],
    demoRelevant: false,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2547',
    name: 'High-Risk Merchant Category Code Assignment Errors Create Network Compliance Exposure',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's merchant onboarding process assigns Merchant Category Codes based on
      self-reported business descriptions from merchant applications, without independent
      verification of the merchant's primary business activity against Visa and Mastercard's
      MCC assignment requirements. Several merchants in the bank's acquiring portfolio are
      assigned standard retail MCCs rather than the high-risk MCCs required by network rules
      for their business categories — including online firearms accessories, adult content
      subscription services, and multi-level marketing programs — causing the bank to
      bypass the enhanced monitoring, reserve requirements, and acquirer registration
      obligations that apply to high-risk MCC categories. Visa and Mastercard's network
      rules require accurate MCC assignment as a condition of participation; incorrect
      high-risk MCC assignments are treated as network rule violations subject to assessment.`,
    keywords: ['MCC assignment', 'high-risk merchants', 'Visa network rules', 'Mastercard', 'acquiring compliance'],
    demoRelevant: true,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2548',
    name: 'Acquirer Monitoring Program Thresholds Misaligned With Current Visa and Mastercard Standards',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's internal acquiring monitoring program uses fraud and chargeback threshold
      parameters that were calibrated in 2021 and have not been updated to reflect the
      current Visa Acquirer Monitoring Program and Mastercard Acquirer Monitoring Program
      threshold changes implemented in 2023 and 2024. The bank's internal monitoring system
      marks merchants as requiring remediation at thresholds above the current network
      program levels, meaning merchants who are already in a network monitoring program
      based on current thresholds are not flagged by the bank's internal monitoring as
      requiring action. When Visa notifies the bank of three merchants in VAMP, the acquiring
      risk team discovers the internal monitoring system would not have identified these
      merchants for remediation under its current threshold configuration, representing
      a systematic gap between internal controls and network program requirements.`,
    keywords: ['VAMP', 'Mastercard AMP', 'acquirer monitoring', 'Visa', 'acquiring risk management'],
    demoRelevant: false,
    subTopic: 'payment-network-compliance',
  },
  {
    code: 'B2549',
    name: 'PCI DSS Level Misclassification Creates Incorrect Self-Assessment Validation for Acquiring Portfolio',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital classifies its acquiring merchant portfolio for PCI DSS validation level
      purposes based on annual transaction volume thresholds reported by merchants at
      onboarding, without implementing a process to re-classify merchants when their
      transaction volumes grow into higher validation tiers. Several merchants originally
      onboarded as Level 4 (fewer than 20,000 e-commerce transactions annually) have grown
      to Level 3 or Level 2 transaction volumes but continue to submit self-assessment
      questionnaires appropriate for Level 4 rather than the on-site or network-scan
      validation requirements applicable at higher tiers. Visa and Mastercard network rules
      require acquiring banks to maintain accurate merchant PCI DSS tier classification;
      a data compromise at a misclassified merchant conducting Level 2 transaction volumes
      under Level 4 validation triggers a network forensic investigation that identifies
      the classification failure.`,
    keywords: ['PCI DSS merchant classification', 'acquiring compliance', 'Visa network rules', 'Mastercard', 'SAQ validation'],
    demoRelevant: true,
    subTopic: 'payment-network-compliance',
  },

  // ── Treasury Payments Risk (B2550–B2559) ─────────────────────────────────

  {
    code: 'B2550',
    name: 'Same-Day ACH Settlement Liquidity Management Does Not Account for End-of-Day Batch Concentration',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's same-day ACH settlement liquidity management framework maintains a
      fixed intraday liquidity reserve based on average same-day ACH settlement obligations,
      without accounting for the concentration risk created by large commercial payroll
      clients who batch their entire payroll ACH origination in the 4:45 PM ET same-day
      ACH submission window. On payroll Fridays, the concentration of end-of-window batch
      submissions from five large commercial payroll clients generates a peak same-day ACH
      settlement obligation that is 3.8× the bank's daily average, exhausting the bank's
      intraday liquidity reserve and requiring emergency Federal Reserve discount window
      borrowing on two occasions in a single quarter. The Federal Reserve's intraday
      liquidity guidance and FFIEC liquidity risk management standards both require that
      peak settlement concentration scenarios be stress-tested in the bank's liquidity
      management framework.`,
    keywords: ['same-day ACH liquidity', 'settlement concentration', 'Federal Reserve', 'FFIEC', 'payroll batch risk'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2551',
    name: 'Nostro Account Reconciliation Failures Accumulate Unresolved Breaks Exceeding Tolerance Thresholds',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description:
      `First Capital's treasury operations team manages 23 nostro accounts with correspondent
      banks across 14 currencies for its international payment business, using a reconciliation
      system that performs daily nostro account matching but applies a $25,000 tolerance
      threshold below which unresolved reconciliation breaks are carried forward without
      escalation. A systematic analysis conducted following an internal audit reveals that
      the bank has accumulated $4.7 million in outstanding nostro reconciliation breaks
      carried forward for more than 90 days, with many breaks representing settled payments
      where the correspondent bank's confirmation message was received with incorrect value
      date or currency fields that the reconciliation system flagged but the treasury operations
      team did not resolve. The OCC's international banking examination procedures and FFIEC
      nostro account management guidance both require that nostro reconciliation breaks be
      resolved within defined timelines regardless of individual break size.`,
    keywords: ['nostro reconciliation', 'correspondent banking', 'OCC', 'FFIEC', 'treasury operations'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2552',
    name: 'Payment Hub Technology Concentration Risk Not Captured in Enterprise Risk Framework',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital routes 94% of its total payment volume — ACH, Fedwire, FedNow, RTP,
      and card acquiring — through a single third-party payment hub platform, creating a
      concentration risk that is not captured in the bank's enterprise risk framework as
      a critical dependency risk requiring board-level oversight. The bank's TPRM program
      classifies the payment hub vendor as a Tier 1 critical vendor subject to annual
      due diligence, but the concentration risk analysis — which would quantify the impact
      of a payment hub outage on the bank's total payment processing capability — has not
      been performed. The Federal Reserve's operational resilience guidance and OCC
      Bulletin 2023-17 on third-party risk management both require that concentration
      risk at critical third parties be quantified and reported to the board; First Capital's
      enterprise risk committee has not reviewed payment hub concentration risk as a
      standalone risk item.`,
    keywords: ['payment hub concentration', 'TPRM', 'OCC', 'Federal Reserve', 'operational resilience'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2553',
    name: 'Intraday Overdraft Limit at Federal Reserve Not Monitored in Real Time Against Payment Commitments',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's Federal Reserve master account carries a net debit cap that limits
      the bank's intraday overdraft position at the Fed; the bank's treasury management
      system monitors the master account balance at 30-minute intervals rather than in
      real time against the bank's scheduled Fedwire and FedNow outbound payment queue.
      During high-volume processing days, the 30-minute monitoring interval allows outbound
      payment queues to accumulate beyond the net debit cap before the system issues an
      alert, causing the bank to breach its debit cap on three occasions and receive Federal
      Reserve debit cap violation notices. The Federal Reserve's Payment System Risk Policy
      requires that depository institutions monitor their intraday Federal Reserve account
      positions in a manner sufficient to prevent debit cap breaches; the 30-minute monitoring
      cadence is insufficient for the bank's current payment volume profile.`,
    keywords: ['Federal Reserve debit cap', 'intraday overdraft', 'Fedwire', 'FedNow', 'PSR Policy'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2554',
    name: 'Cross-Currency Settlement Netting Framework Lacks Intraday FX Risk Governance',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's international payment operations use a cross-currency settlement
      netting arrangement with a correspondent bank that batches and nets the bank's daily
      foreign currency payment obligations, settling the net position once at end of day
      rather than on a transaction-by-transaction basis. The bank's treasury risk governance
      framework does not address intraday FX exposure created by the netting arrangement —
      the cumulative open FX position that builds throughout the day as individual payment
      obligations are accepted but not yet settled in the netting batch. During a period of
      elevated FX volatility, the bank's intraday EUR/USD netting position reaches €18 million
      before the end-of-day settlement; the bank's FX risk policy does not define intraday
      position limits for netting arrangements, creating an unmonitored intraday market
      risk exposure that the OCC's market risk examination team characterizes as a governance gap.`,
    keywords: ['FX settlement netting', 'intraday FX risk', 'OCC', 'cross-currency payments', 'treasury risk'],
    demoRelevant: false,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2555',
    name: 'Correspondent Banking Bilateral Credit Limits Not Reviewed Following Counterparty Credit Events',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital maintains bilateral credit limits for its correspondent banking
      relationships that define the maximum unsettled payment exposure the bank will
      accept with each correspondent; these limits are reviewed annually as part of the
      correspondent bank due diligence cycle. The bank does not have a process for
      triggering an out-of-cycle credit limit review when a correspondent bank experiences
      a material credit event — including rating downgrades, regulatory enforcement actions,
      or public disclosures of liquidity stress — meaning the bank may continue processing
      payments up to the existing bilateral limit for a credit-impaired correspondent for
      up to 12 months until the next annual review. A correspondent bank subject to a
      significant regulatory enforcement action continues to receive payment processing
      up to its full bilateral limit for 8 months before the annual review triggers
      a credit limit reduction.`,
    keywords: ['correspondent credit limits', 'bilateral exposure', 'credit event', 'OCC', 'correspondent banking risk'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2556',
    name: 'Trapped Liquidity in Foreign Nostro Accounts Not Included in LCR High-Quality Liquid Asset Calculation',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital maintains operating balances in foreign currency nostro accounts for its
      international payment corridors; these balances represent liquidity that is operationally
      necessary for same-day payment processing but is physically located in foreign currency
      accounts at correspondent banks in jurisdictions where immediate repatriation may be
      restricted by capital controls or settlement timing. The bank's LCR calculation
      classifies these foreign nostro operating balances as high-quality liquid assets
      without applying the trapped liquidity haircut required by Basel III for assets that
      cannot be freely transferred or liquidated within the 30-day LCR stress horizon.
      The Federal Reserve's LCR rule requires that HQLA eligibility be assessed based on
      the asset's accessibility in a stress scenario; the OCC's LCR examination team
      identifies the nostro balance classification as a material LCR calculation methodology
      error.`,
    keywords: ['trapped liquidity', 'nostro HQLA', 'LCR', 'Federal Reserve', 'Basel III'],
    demoRelevant: false,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2557',
    name: 'Payment Factory Operating Model Lacks Clear FRBNY Account Ownership and Liability Assignment',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital establishes a centralized payment factory operating model for its
      commercial banking division, routing all commercial client payment origination through
      a centralized processing entity that accesses the bank's Federal Reserve master account.
      The legal documentation governing the payment factory's relationship with the bank's
      Federal Reserve master account does not clearly assign liability for payment errors,
      late payments, and UCC Article 4A acceptance obligations between the payment factory
      operating entity and the bank's master account holder — creating ambiguity about
      which legal entity bears responsibility when the payment factory generates a processing
      error. The Federal Reserve's account relationship governance requirements and UCC
      Article 4A's receiving bank acceptance framework both require unambiguous identification
      of the legal entity responsible for payment processing obligations.`,
    keywords: ['payment factory', 'Federal Reserve account', 'UCC Article 4A', 'liability assignment', 'commercial payments'],
    demoRelevant: false,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2558',
    name: 'End-of-Day Fedwire Deadline Management Creates Systematic Late Settlement Exposure for Time-Critical Payments',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's commercial payment operations team manages a queue of end-of-day
      Fedwire settlements for time-critical transactions including real estate closings,
      securities settlements, and commercial loan fundings that must settle before the
      5:30 PM ET Fedwire customer transfer deadline. The bank's payment queue management
      system does not prioritize time-critical Fedwire settlements ahead of routine commercial
      wire traffic when the end-of-day queue approaches the Fedwire cutoff, resulting in
      an average of 2.3 time-critical payments per month failing to meet their settlement
      deadlines because they were processed behind routine lower-priority wires. UCC Article
      4A assigns potential liability to the receiving bank for late settlement of time-critical
      payments when the bank has been notified of the settlement urgency; First Capital's
      queue management system does not have a time-critical priority flag in its processing
      logic.`,
    keywords: ['Fedwire deadline', 'payment prioritization', 'UCC Article 4A', 'settlement risk', 'time-critical payments'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },
  {
    code: 'B2559',
    name: 'Treasury Payment Hub Failover Architecture Does Not Maintain Same-Day ACH Cutoff Compliance on DR Switch',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's disaster recovery architecture for its payment hub includes an automated
      failover to a secondary data center with a recovery time objective of 4 hours for
      full payment processing capability. A tabletop exercise testing the DR failover
      scenario identifies that the 4-hour RTO exceeds the available processing window for
      same-day ACH batch submissions when a failover event occurs between 1:00 PM and
      3:00 PM ET — the optimal window for assembling and transmitting the 4:45 PM same-day
      ACH batch. During a simulated DR activation at 2:00 PM ET, the bank cannot restore
      full ACH batch processing capability before the same-day ACH submission deadline,
      causing an entire day's same-day ACH payroll origination to fail for 12 commercial
      clients. NACHA's ODFI operating rules and the Federal Reserve's operational resilience
      guidance require that ODFI capabilities be resilient through defined business continuity
      scenarios; First Capital's 4-hour RTO is incompatible with same-day ACH processing
      continuity.`,
    keywords: ['payment hub DR failover', 'same-day ACH RTO', 'NACHA', 'operational resilience', 'ODFI continuity'],
    demoRelevant: true,
    subTopic: 'treasury-payments-risk',
  },

];
