// seed-banking-dom15-commercial-banking-part3.ts
// Banking genome patterns — Commercial Banking (dom15) Part 3
// Code range: B4420–B4479  (60 patterns)
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

export const BANKING_DOM15_COMMERCIAL_BANKING_PART3_PATTERNS: PatternSeed[] = [

  // ── AI Commercial Banking (B4420–B4437) ───────────────────────────────────
  {
    code: 'B4420',
    name: 'AI Credit Memo Drafting Omits Negative Covenant Review — Approval on Incomplete Documentation',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an LLM assistant to draft commercial credit memos from structured deal data inputs, significantly accelerating memo production time, but the AI drafting template does not include a section for negative covenant terms — restrictions on additional debt incurrence, asset dispositions, restricted payments, and change-of-control that are negotiated in the credit agreement and that materially constrain the borrower's financial flexibility during the loan term. OCC commercial credit documentation standards and the bank's own credit policy require that approved credit memos include a complete summary of all material loan terms including negative covenants; when an examiner reviews five AI-drafted credit memos and finds that none include a negative covenant summary, the documentation deficiency becomes a Matters Requiring Attention finding and the bank must re-underwrite and re-document all affected credits in the portfolio to confirm that covenant terms were actually evaluated during approval.`,
    keywords: ['AI credit memo', 'negative covenants', 'OCC credit documentation', 'SR 11-7', 'commercial underwriting'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4421',
    name: 'GenAI Relationship Management Tool Produces Inaccurate Call Report Summaries',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial banking team adopts a GenAI relationship management assistant that summarizes prior client call notes, auto-drafts call reports after relationship manager meetings, and generates next-step action items; the AI assistant's call report summaries contain inaccuracies — misattributing client statements about credit facility needs, conflating financial data discussed across different meetings, and fabricating specific commitment language — that relationship managers accept without review and log as official call reports in the CRM system. OCC commercial banking relationship management expectations and the bank's own CRM data integrity policy require that call reports accurately reflect actual client interactions; when an inaccurate AI-generated call report that attributes a verbal loan commitment to the bank is later cited by a commercial client in a dispute about a denied credit application, the legal and reputational exposure requires outside counsel engagement, a CRM data audit, and a mandatory human review protocol for all AI-generated call reports.`,
    keywords: ['GenAI relationship management', 'call report accuracy', 'OCC guidance', 'CRM data integrity', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4422',
    name: 'ML Commercial Loan Pricing Model Not in SR 11-7 Model Inventory — No Ongoing Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's commercial banking pricing team deploys a machine learning model that recommends spread pricing for C&I and commercial real estate loans based on borrower risk rating, loan structure, collateral type, and competitive market inputs, using the model's output as the primary basis for pricing decisions without registering it in the bank's SR 11-7 model risk inventory. SR 11-7 model risk management guidance defines a model as any quantitative method that produces outputs used for material business decisions, requiring that all such models be validated before deployment and monitored on an ongoing basis for performance, stability, and bias; when an OCC model risk examination identifies the commercial pricing tool as an unregistered model used to price over $400M in new commercial loan originations, the finding triggers a retroactive validation requirement, temporary suspension of the pricing model, and a model governance remediation plan submitted to the OCC within 60 days.`,
    keywords: ['ML loan pricing', 'SR 11-7', 'model inventory', 'OCC model risk', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4423',
    name: 'AI Cash Flow Forecasting Model Exhibits Drift — Commercial Covenant Compliance Projections Unreliable',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's commercial credit monitoring team uses an AI cash flow forecasting model to project borrower DSCR trajectories over the next four quarters, using the projections to identify credits at risk of covenant violation before the quarterly financial statement delivery; the model was validated in 2022 using pre-pandemic mean reversion parameters and has not been re-validated as post-pandemic working capital dynamics, supply chain normalization patterns, and interest rate sensitivity have shifted materially, causing the model's forward DSCR projections to systematically overestimate cash flow recovery for rate-sensitive middle-market borrowers. SR 11-7 ongoing monitoring requirements and OCC commercial credit risk management expectations require that banks detect and remediate model performance drift before relying on model outputs for credit decisions; the bank's model monitoring team identifies a 34% rate of false-negative covenant risk signals — credits projected as covenant-compliant that subsequently breach — attributable to the unaddressed model drift, requiring an emergency model re-validation and recalibration.`,
    keywords: ['AI cash flow forecasting', 'model drift', 'SR 11-7', 'OCC credit guidance', 'covenant monitoring'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4424',
    name: 'LLM Covenant Monitoring Tool Misinterprets Defined Term Ambiguity — False Compliance Reports',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an LLM-based covenant monitoring tool that parses executed credit agreement language to extract covenant definitions and test compliance against borrower-submitted financial statements, but the LLM tool does not flag definitional ambiguity cases — specifically where terms like "Consolidated EBITDA," "Permitted Debt," or "Restricted Subsidiary" are defined differently across the bank's portfolio of credit agreements — instead applying a generalized interpretation that in some cases reports compliance where the correct contractual interpretation would show a violation. OCC commercial credit risk examination guidance and the bank's workout policy require that covenant monitoring be based on the precise contractual definitions in each executed credit agreement, not generalized interpretations; when the LLM tool misinterprets a modified "Consolidated EBITDA" definition and reports a $28M term loan as covenant-compliant when it is in technical default, the bank loses the right to accelerate the loan and must negotiate a forbearance from a position of weakened contractual leverage.`,
    keywords: ['LLM covenant monitoring', 'defined term ambiguity', 'OCC credit guidance', 'SR 11-7', 'commercial lending'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4425',
    name: 'AI Commercial Pipeline Forecast Trained on Bull-Market Data — Recession Scenario Bias',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial banking business development team deploys an AI pipeline forecasting model that predicts quarterly loan origination volumes by relationship manager, market segment, and deal stage using historical pipeline conversion data as training input; the model was trained exclusively on 2017–2022 data encompassing a period of sustained commercial credit demand and does not include the pipeline conversion dynamics of the 2008–2009 credit contraction or the 2020 COVID-driven demand shock, causing the model to systematically overestimate pipeline conversion rates in a rising-rate, credit-tightening environment. OCC commercial banking management expectations and the bank's capital planning process rely on origination forecasts to dimension lending capacity and capital allocation; when the AI forecast projects $180M in Q3 commercial loan closings against an actual outcome of $112M — a 38% miss driven by deal falls-out that the recession-naïve model could not anticipate — the bank's capital and liquidity planning for the quarter is materially misaligned with actual credit demand.`,
    keywords: ['AI pipeline forecast', 'model training bias', 'SR 11-7', 'OCC guidance', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4426',
    name: 'GenAI Commercial Proposal Generator Includes Unauthorized Rate Guarantees',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking team uses a GenAI proposal generation tool to produce customized credit facility term sheets and relationship proposals for prospective middle-market clients, streamlining proposal production; the GenAI tool, drawing on prior approved proposals in its training corpus, sometimes generates language that implies an interest rate guarantee or commitment — phrases like "your pricing will be locked at SOFR+175" — that the bank has not authorized and that constitutes a binding representation under applicable contract law principles if relied upon by the client. OCC commercial banking conduct standards, Reg B's adverse action notice requirements, and the bank's own credit approval authority matrix require that terms communicated to commercial clients be subject to credit committee approval; when a commercial client files a breach of contract claim citing the AI-generated proposal's rate language after the bank prices the facility at SOFR+225, the legal exposure requires outside counsel defense of the claim and a complete redesign of the AI tool's output review and disclaimer workflow.`,
    keywords: ['GenAI proposals', 'rate commitment', 'OCC conduct standards', 'Reg B', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4427',
    name: 'AI Commercial Loan Spreading Tool Misclassifies Non-Recurring Items — Overstates Normalized EBITDA',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's commercial underwriting team uses an AI financial spreading tool to extract income statement, balance sheet, and cash flow data from borrower-submitted financial statements and populate the bank's spreading template, with automated EBITDA normalization adjustments for identified non-recurring items; the AI tool misclassifies recurring operational losses — restructuring charges that recur annually, litigation accruals related to ongoing disputes, and management fee payments to related entities — as non-recurring items and adds them back to EBITDA, producing a normalized EBITDA figure that overstates the borrower's sustainable earnings capacity. OCC commercial credit documentation standards and the bank's underwriting policy require that EBITDA normalization adjustments be supported by clear evidence of non-recurrence, reviewed by an underwriter; the AI-generated overstatement of $1.8M in normalized EBITDA for a $12M term loan pushes the DSCR calculation above the bank's 1.20x covenant floor when the correct figure is 1.08x, creating a material underwriting deficiency that loan review identifies during a post-closing quality review.`,
    keywords: ['AI financial spreading', 'EBITDA normalization', 'OCC credit guidance', 'non-recurring items', 'commercial underwriting'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4428',
    name: 'ML Commercial Customer Segmentation Model Excludes Behavioral Data — Missed Cross-Sell Signals',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial banking analytics team deploys an ML customer segmentation model to identify cross-sell opportunities for treasury management, equipment finance, and commercial real estate products among existing C&I lending clients, but the model uses only demographic and financial profile variables — company size, industry, revenue tier — while excluding behavioral data such as transaction volume trends, revolver utilization patterns, cash flow seasonality, and digital banking engagement that are more predictive of specific product fit. OCC commercial banking management expectations regarding customer profitability and relationship depth, combined with the bank's strategic plan targets for fee income diversification, require that cross-sell models be calibrated against actual product adoption outcomes rather than demographic proxies; the segmentation model identifies 340 cross-sell targets but achieves only an 8% conversion rate versus the 22% conversion rate the bank achieves through relationship-manager-driven identification, indicating that the model's demographic-only signals are substantially weaker than behavioral signal integration would produce.`,
    keywords: ['ML customer segmentation', 'cross-sell model', 'commercial banking', 'SR 11-7', 'behavioral data'],
    demoRelevant: false,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4429',
    name: 'AI Document Review Tool Misses Material Adverse Change Clause in Commercial Loan Amendment',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's commercial lending operations team deploys an AI document review tool to check loan amendment documentation for completeness and consistency with the credit approval memo, flagging discrepancies between approved terms and executed documents before funding; the AI tool does not review Material Adverse Change (MAC) clause language for alignment with the bank's standard MAC definition, missing an amendment that inadvertently narrows the MAC definition to exclude borrower financial covenant deterioration — removing a key credit protection that the bank's standard credit agreement preserves. OCC commercial credit operations guidance and the bank's loan administration policy require that loan amendments be reviewed against standard credit protection benchmarks, including MAC clause scope, before execution; when the narrowed MAC clause is discovered during a workout of the same borrower 18 months later and prevents the bank from declaring an event of default based on the borrower's deteriorating financial condition, the documentation error materially impairs the bank's remedies.`,
    keywords: ['AI document review', 'MAC clause', 'OCC guidance', 'loan amendment', 'commercial lending'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4430',
    name: 'GenAI Commercial Banking Training Content Contains Outdated Regulatory Guidance',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's commercial banking training team uses a GenAI content generation tool to produce compliance training modules for commercial relationship managers covering CRA obligations, fair lending, and commercial credit documentation requirements; the GenAI tool's training corpus includes superseded regulatory guidance and pre-amendment policy documents, causing the generated training content to reference the pre-CECL allowance methodology as current practice, cite an outdated OCC commercial real estate concentration risk threshold, and omit the bank's 2023 updated CRA assessment area definitions. OCC commercial banking examination expectations and the bank's compliance management system requirements specify that training content for regulated activities be reviewed for accuracy against current guidance before deployment; when an OCC compliance examination tests commercial RM knowledge on CRA assessment area boundaries and finds a 40% error rate traceable to the AI-generated training module, the compliance management finding requires immediate training withdrawal, corrective re-training, and a content review workflow that ensures regulatory currency.`,
    keywords: ['GenAI training content', 'OCC compliance', 'CRA', 'CECL', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4431',
    name: 'AI-Assisted Commercial Term Sheet Generator Bypasses Credit Approval Authority Matrix',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deploys a GenAI commercial term sheet generation tool integrated into the relationship management workflow that allows relationship managers to generate indicative term sheets directly from CRM deal records without triggering a credit committee pre-approval workflow, relying on AI guardrails to constrain term sheet parameters to approved deal structures; the AI guardrails correctly constrain loan amount and tenor but do not validate interest rate floor provisions, recourse structure, or collateral release terms against the bank's credit approval authority matrix, allowing relationship managers to effectively pre-commit the bank to structural terms that require senior credit officer approval. OCC commercial credit governance expectations and the bank's written credit authority policy require that all indicative term sheet commitments to commercial clients be reviewed by a credit officer with appropriate authority; when a relationship manager's AI-generated term sheet for a $22M commercial real estate loan includes a partial recourse structure requiring credit committee approval, and the client signs and returns the term sheet before credit committee review, the bank faces a commitment dispute that requires legal intervention and client relationship damage to resolve.`,
    keywords: ['AI term sheet', 'credit approval authority', 'OCC governance', 'commercial real estate', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4432',
    name: 'LLM Commercial Relationship Briefing Aggregates Stale CRM Data as Current Client Intelligence',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial banking team uses an LLM relationship briefing tool that synthesizes CRM data, recent call notes, financial statement spreads, and publicly available news into a pre-meeting client intelligence brief; the tool does not distinguish between current and stale data, presenting two-year-old call notes about a client's acquisition interest and a 14-month-old financial profile as contextually current, causing a senior relationship manager to reference the client's previously discussed acquisition target — a transaction that closed, failed, and was sold — as an active strategic priority in a client meeting. OCC commercial banking relationship governance expectations require that client-facing intelligence and relationship strategy be based on current, verified information; the relationship manager's reference to outdated acquisition intelligence damages the bank's credibility with a $50M commercial deposit and lending relationship client who specifically tests whether the bank understands their current strategic context, triggering a relationship manager reassignment and a data freshness review of the LLM briefing system.`,
    keywords: ['LLM relationship briefing', 'stale CRM data', 'commercial banking', 'OCC guidance', 'client intelligence'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4433',
    name: 'AI Commercial Appraisal Review Tool Misses Comparable Selection Bias in CRE Valuations',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI appraisal review tool for commercial real estate loans that analyzes third-party appraisals against bank-prescribed review criteria, flagging discrepancies in capitalization rates, comparable selection methodology, and income stabilization assumptions; the AI tool checks whether the required number of comparables is present and whether they fall within the geographic search radius but does not assess whether the selected comparables are cherry-picked from the high end of the market range — a systematic cherry-picking pattern where appraisers exclude lower-value recent transactions — causing the AI review to pass appraisals with upward comparable selection bias. OCC Real Estate Lending Standards (12 CFR Part 34) and FIRREA appraisal independence requirements mandate that appraisal reviews identify methodological deficiencies, including comparable selection adequacy; when the bank's review identifies a pattern of AI-approved appraisals that systematically overvalue CRE collateral by an estimated 12–18% relative to a retrospective independent review, the collateral quality of a $180M CRE portfolio segment is materially worse than the AI tool's approvals implied.`,
    keywords: ['AI appraisal review', 'FIRREA', 'OCC real estate standards', 'comparable selection bias', 'commercial real estate'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4434',
    name: 'GenAI Commercial Workout Strategy Generator Produces Legally Inadmissible Settlement Drafts',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's commercial workout and special assets team uses a GenAI tool to draft initial workout strategy memos and forbearance agreement outlines for distressed commercial credits, accelerating documentation of strategic options and proposed terms; the GenAI tool produces draft forbearance agreements that contain legally inconsistent provisions — combining waiver of demand language with reservation-of-rights clauses in ways that are contradictory under state commercial law — that workout officers treat as near-final rather than preliminary drafts requiring outside counsel review. OCC commercial credit workout guidance and the bank's classified credit management policy require that forbearance agreements and settlement documentation be reviewed by the bank's legal department or outside counsel before presentation to borrowers; when a GenAI-drafted forbearance agreement's contradictory waiver language is presented to a borrower's counsel and challenged as legally unenforceable, the resulting renegotiation delay allows additional collateral deterioration and sets a precedent for borrowers to challenge the bank's workout documentation quality in future negotiations.`,
    keywords: ['GenAI workout strategy', 'forbearance agreement', 'OCC workout guidance', 'commercial credit', 'legal review'],
    demoRelevant: false,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4435',
    name: 'AI Commercial Credit Stress Testing Tool Uses Proxy Macroeconomic Variables Without Validation',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's commercial credit risk management team deploys an AI stress testing tool to model portfolio-level credit losses under adverse macroeconomic scenarios for the DFAST-compliant stress test framework, using AI-derived proxy macroeconomic variables — estimated unemployment rate proxies, sector-specific revenue decline estimates, and AI-generated cap rate shocks — when Federal Reserve-specified scenario variables are unavailable at the required industry disaggregation level. SR 11-7 model risk management and the Federal Reserve's DFAST supervisory expectations require that stress testing models use validated inputs and document all proxy variable derivation methodologies for examiner review; when the bank's DFAST submission uses AI-generated proxy variables that have not been independently validated and the examiner requests the proxy variable derivation documentation, the bank cannot produce the required methodological support, resulting in a model risk finding and a requirement to re-run the stress test with validated macroeconomic inputs before the next examination cycle.`,
    keywords: ['AI stress testing', 'DFAST', 'SR 11-7', 'proxy variables', 'commercial credit risk'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4436',
    name: 'ML Commercial Deposit Attrition Model Predicts Incorrectly in Rate-Sensitive Segments',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial banking analytics team deploys an ML deposit attrition prediction model to identify corporate clients at high risk of deposit outflows, enabling proactive relationship manager outreach to defend balances; the model was trained on 2015–2020 deposit behavior data during a period of zero-rate and near-zero-rate conditions and has not been recalibrated since the 2022–2023 rate cycle, causing it to systematically underpredict attrition risk for commercial clients in rate-sensitive industries — healthcare, real estate investment, and technology — who materially shift deposits to higher-yielding alternatives when fed funds rates exceed 4%. OCC commercial banking deposit management expectations and the bank's asset-liability management policy require that deposit behavior models be regularly recalibrated to reflect current rate environment dynamics; the model's underestimation of rate-sensitive segment attrition contributes to a $340M deposit outflow surprise that the bank's treasury team must fund through FHLB advances at a cost premium.`,
    keywords: ['ML deposit attrition', 'rate sensitivity', 'SR 11-7', 'commercial deposits', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },
  {
    code: 'B4437',
    name: 'AI Commercial Banking Chatbot Discloses Client Relationship Data Across Tenant Boundaries',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital deploys an AI chatbot integrated into the commercial banking portal for client self-service that can respond to account inquiry questions, transaction detail requests, and service configuration questions; the chatbot's multi-tenant session isolation is improperly configured in the commercial banking portal's single-sign-on integration, causing the AI model context to occasionally retain client-specific account data from a prior authenticated session and surface that data — account balances, transaction history, or configured payee information — in a subsequent client's authenticated session. OCC operational risk and information security guidance, Gramm-Leach-Bliley Act safeguards requirements, and the bank's information security policy prohibit cross-client data disclosure in any channel; when the session isolation failure is discovered through a client complaint that correctly describes another commercial client's account balance, the bank must immediately suspend the chatbot, conduct forensic log analysis to scope the disclosure, notify affected clients under applicable breach notification requirements, and engage regulatory examiners proactively.`,
    keywords: ['AI chatbot', 'data isolation failure', 'GLBA safeguards', 'OCC information security', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'ai-commercial-banking',
  },

  // ── Treasury Cash Management (B4438–B4449) ────────────────────────────────
  {
    code: 'B4438',
    name: 'Sweeping Agreement Compliance — Target Balance Drift Not Monitored After Rate Changes',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's treasury management operations team administers automated cash concentration and sweeping agreements for commercial clients that specify target operating account balances, sweep trigger thresholds, and investment sweep destination accounts, but the operations team does not monitor whether the client-designated target balances remain contractually and operationally appropriate after Federal Reserve rate changes that alter the economics of leaving funds in non-interest bearing operating accounts versus overnight investment vehicles. OCC treasury management operational guidance and the bank's account analysis billing policy require that sweeping agreement parameters be reviewed at defined intervals, particularly following material rate environment changes; when the bank continues to sweep a corporate client's operating account to a money market fund per a two-year-old agreement that the client has verbally requested modification for but never received documented confirmation, a large vendor payment creates an overdraft because the sweep trigger was too aggressive for the current balance level, causing a client dispute and service credit claim.`,
    keywords: ['sweeping agreement', 'target balance', 'treasury management', 'OCC guidance', 'cash concentration'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4439',
    name: 'Investment Policy Statement Gap — Permitted Counterparty List Not Updated for Credit Downgrades',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's treasury management advisory team assists corporate clients with investment policy statement (IPS) development and annual review, but the bank's IPS template does not include a dynamic counterparty quality maintenance requirement — a provision requiring the client to remove any counterparty whose credit rating falls below the IPS-specified minimum from the permitted investment counterparty list within a defined period following a downgrade event. OCC treasury management fiduciary and advisory guidelines and industry best practices for corporate investment policy require that IPS counterparty lists reflect current credit quality; when a commercial client maintains a $12M overnight placement with a financial institution that was downgraded below the IPS-specified minimum eight months prior and the bank's treasury management team did not notify the client of the downgrade, the client's investment committee discovers the gap during an internal audit and questions the bank's advisory quality, initiating a fee dispute and a request for IPS service credit.`,
    keywords: ['investment policy statement', 'counterparty credit', 'treasury management', 'OCC fiduciary guidance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4440',
    name: 'Counterparty Exposure Management — Intraday Credit Lines Not Included in Limit Aggregation',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's credit risk management framework tracks counterparty exposure limits for corporate clients across credit facilities, letter of credit contingent obligations, and derivative exposures, but the limit aggregation system does not capture intraday overdraft credit extensions in the commercial demand deposit operations system, which can provide uncommitted daylight credit to large commercial clients of up to $25M for a period of hours before end-of-day position settlement. OCC commercial credit concentration guidance and the bank's credit risk policy require that all forms of credit extension — including uncommitted intraday credit — be included in counterparty exposure aggregation for limit compliance testing; when a large commercial client draws simultaneously on its committed revolving credit facility, has outstanding letters of credit, and uses intraday credit extension, the aggregated exposure exceeds the approved credit limit by 18% for a period that the credit risk system does not detect because intraday data does not feed the limit monitoring platform until overnight batch processing.`,
    keywords: ['counterparty exposure', 'intraday credit', 'OCC concentration guidance', 'treasury management', 'credit limits'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4441',
    name: 'Commercial Account Analysis Statement Errors — Earnings Credit Rate Calculation Inconsistency',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's treasury management account analysis billing system calculates earnings credit allowances for commercial checking accounts using the prior month's average Federal funds rate with a 5% reserve requirement deduction applied to average collected balances, but the system does not correctly adjust the average collected balance calculation when commercial clients make large mid-month wire transfers that temporarily inflate reported balances — the system uses a simple monthly average rather than a true daily average collected balance — causing systematic overstatement of earnings credits that benefits commercial clients at the bank's expense. OCC commercial banking pricing practices and the bank's treasury management services agreement specify the exact methodology for earnings credit calculation; when a treasury management profitability review identifies that the systematic earnings credit overstatement has cost the bank an estimated $1.4M annually across the commercial account base, the billing system correction requires retroactive repricing discussions with 340 commercial clients and a system remediation that must be carefully managed to avoid triggering client defection.`,
    keywords: ['account analysis', 'earnings credit rate', 'treasury management', 'OCC pricing', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4442',
    name: 'Zero Balance Account Structure Fails — Subsidiary Accounts Fund Parent Overdrafts Without Authorization',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital administers zero balance account (ZBA) structures for commercial clients with multiple subsidiaries, where subsidiary operating accounts maintain zero balances with automatic sweeps to the master concentration account; the bank's ZBA administration system does not have an authorization override mechanism that prevents subsidiary accounts from funding parent-company overdrafts when the concentration account is negative — the system treats parent overdraft funding as a normal sweep in reverse — causing subsidiary account balances designated for subsidiary-specific payroll and vendor obligations to be unilaterally swept to cover parent overdrafts without the client's authorization for each instance. OCC commercial banking operations guidelines and the executed treasury management services agreement require that ZBA sweep mechanics be strictly governed by the documented account structure and that unauthorized funds movements be preventable by the client; when a subsidiary's payroll funding is swept to cover a parent overdraft and the subsidiary's payroll direct deposits return NSF, the client terminates the relationship and files a complaint with the OCC banking examiner.`,
    keywords: ['zero balance account', 'ZBA structure', 'treasury management', 'OCC operations', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4443',
    name: 'Commercial Lockbox Processing Delay — Float Calculation Does Not Match Availability Schedule',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's treasury management lockbox service provides next-day availability for checks processed through the bank's primary lockbox facility, per the commercial client's account analysis agreement and availability schedule, but the bank's lockbox operations team does not consistently apply the agreed availability schedule for checks deposited after the daily processing cutoff — crediting those items with two-day availability rather than the next-day availability that the client's agreement specifies for the late deposit time window. OCC treasury management services regulations (Regulation CC) and the bank's executed lockbox services agreement require that the bank apply the contractually specified availability schedule consistently; when a commercial client conducting a real-time cash position analysis on the day of a major vendor payment discovers a same-day availability discrepancy that prevents a wire transfer from funding, resulting in a late payment penalty, the client's treasury operations team calculates that incorrect float application has cost them an estimated $85K annually in excess float charges.`,
    keywords: ['lockbox processing', 'Regulation CC', 'float calculation', 'treasury management', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4444',
    name: 'Positive Pay Exception Handling Allows Fraudulent Check to Clear After Client Rejection',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's positive pay service allows commercial clients to receive daily reports of presented checks that do not match their issued check file and to submit pay or return decisions for each exception item; the bank's positive pay system contains a processing window configuration error that treats an undelivered exception decision notification — caused by a client email system outage — as a "pay" instruction under the bank's default-to-pay positive pay option, allowing a $145K fraudulent check that the client would have returned to clear against the client's account when the client's email system was down. OCC commercial fraud prevention guidance and the bank's positive pay terms of service require that clients be explicitly informed of the default-to-pay rule and given reliable notification methods; when the commercial client disputes the fraudulent check payment and the bank reviews the exception notification delivery log and discovers the email delivery failure, the bank must credit the fraudulent item and conduct a systemic review of notification reliability across all positive pay clients.`,
    keywords: ['positive pay', 'check fraud', 'OCC fraud prevention', 'treasury management', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4445',
    name: 'ACH Filter Service Not Updated for New Originator IDs — Unauthorized Debits Clear',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's treasury management ACH debit filter service allows commercial clients to specify authorized ACH debit originator company IDs, blocking all ACH debits except from pre-authorized originators; the bank's ACH filter management workflow requires clients to submit written requests to update the authorized originator list when they add new vendors or service providers, but the bank's operations team does not proactively notify clients that ACH debit filtering has blocked a new originator — instead returning the item as unauthorized — allowing commercial clients to miss debit blocks on legitimate new vendors and causing the ACH debit filter to be disabled by clients frustrated with legitimate transaction blocking. OCC commercial banking operational risk guidance on ACH fraud and NACHA operating rules require that ACH debit filter services be operationally effective and client-friendly; when a commercial client disables the ACH debit filter after experiencing repeated legitimate transaction blocks and subsequently suffers $280K in unauthorized ACH debits, the client argues the bank's filter service design forced them to disable the fraud prevention control.`,
    keywords: ['ACH filter', 'ACH fraud', 'treasury management', 'NACHA rules', 'OCC operational risk'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4446',
    name: 'Commercial Card Program Ghost Account Monitoring Not Implemented — Unauthorized Charges Missed',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial card program for corporate clients includes procurement cards, travel and entertainment cards, and virtual card accounts; the bank's commercial card program management does not implement ghost account monitoring — a process that regularly identifies virtual card or account numbers that have been issued but show no activity for an extended period and are therefore at elevated risk of fraudulent use if the card number has been compromised but not yet exploited. OCC commercial banking operational risk guidance and Nacha commercial payment fraud prevention expectations require that commercial card programs include proactive inactive-account monitoring as a standard fraud prevention control; when a corporate client's IT security team discovers that a list of ghost virtual card account numbers was exfiltrated in a data breach 11 months prior and the bank's monitoring has not flagged the dormant numbers, the bank faces a potential fraud loss exposure on all compromised ghost account numbers that could have been cancelled if monitoring had been active.`,
    keywords: ['commercial card', 'ghost account monitoring', 'OCC operational risk', 'card fraud', 'treasury management'],
    demoRelevant: false,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4447',
    name: 'Commercial Client Treasury API Integration Error Causes Duplicate Payment Submissions',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's treasury management digital banking platform provides commercial clients with an API integration layer for direct ERP-to-bank payment submission and cash position reporting; a versioning error in the bank's payment submission API endpoint causes duplicate idempotency key handling to fail under specific network retry conditions — when the client's ERP system experiences a timeout and retries a payment submission, the bank's API processes both the original and retry requests as separate payments rather than recognizing the idempotency key and deduplicating the retry. OCC commercial banking payment system reliability and operational risk guidance, combined with Fedwire and CHIPS operating rules regarding duplicate payment processing, require that bank payment APIs implement robust idempotency controls; when the API bug causes 14 duplicate wire payments totaling $4.7M across three commercial clients during a single processing day, the bank must unwind the duplicate transactions through correspondent bank recall procedures, fund the interim exposure, and conduct a comprehensive API idempotency review.`,
    keywords: ['treasury API', 'duplicate payment', 'idempotency', 'OCC operational risk', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4448',
    name: 'SWIFT Message Processing Error — Commercial Client MT 940 Reconciliation Data Truncated',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's treasury management operations team generates and transmits MT 940 end-of-day statement messages to commercial clients who use SWIFT connectivity for automated reconciliation with their treasury management systems; the bank's SWIFT message generation engine truncates reference field data for wire transfer transactions that include structured remittance information exceeding 35 characters, causing the MT 940 reconciliation messages to contain incomplete transaction references that clients' automated reconciliation systems cannot match to their internal records. OCC commercial banking payment operations standards and SWIFT messaging standards (Standards MT) require that statement messages accurately and completely represent transaction reference data as submitted; when three commercial clients report systematic reconciliation breaks attributable to truncated SWIFT reference fields, the bank's investigation identifies that the truncation affects all MT 940 messages with extended remittance data — approximately 12% of wire transaction volume — and has been occurring for 14 months without detection through operational monitoring.`,
    keywords: ['SWIFT MT 940', 'reconciliation', 'treasury management', 'OCC operations', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'treasury-cash-management',
  },
  {
    code: 'B4449',
    name: 'Commercial Line of Credit Automated Sweep Triggers Not Reviewed Against Current Rate Environment',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's treasury management team administers commercial clients' automated line-of-credit sweep structures, where operating account overdrafts automatically trigger draws on committed revolving credit facilities at configured minimum draw amounts; the sweep trigger thresholds and minimum draw amounts were established at account opening and have never been reviewed against the current interest rate environment, causing commercial clients to make minimum $100K line-of-credit draws at prime-plus rates to cover $15K operating account shortfalls — generating unnecessary borrowing costs and underutilizing available operating account optimization alternatives that the bank's treasury management team should proactively address during annual relationship reviews. OCC commercial banking relationship management expectations and the bank's treasury management advisory service standards require that sweep structure configurations be reviewed annually to ensure operational and economic efficiency; the bank's treasury management profitability review identifies that 28 commercial clients with outdated sweep configurations are generating $340K annually in unnecessary interest income that clients will eventually attribute to the bank's failure to optimize their cash management structures.`,
    keywords: ['LOC sweep', 'treasury management', 'sweep trigger', 'OCC relationship management', 'commercial banking'],
    demoRelevant: false,
    subTopic: 'treasury-cash-management',
  },

  // ── Trade Finance Compliance (B4450–B4459) ────────────────────────────────
  {
    code: 'B4450',
    name: 'Letter of Credit Document Discrepancy Management — Examiner Finds 34% Waiver Rate',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's trade finance operations team processes commercial letter of credit presentations and documents discrepancies — deviations from the letter of credit terms — for trade finance clients, requiring that discrepant presentations be referred to the issuing bank's commercial client for authorization before payment; an OCC trade finance examination finds that the bank's trade operations team waives document discrepancies on 34% of all LC presentations without obtaining documented applicant authorization, substituting an oral confirmation or relationship manager email for the formal written authorization required under UCP 600 Article 16. OCC trade finance examination guidance and UCP 600 Articles 14–16 governing standard for examination of documents require that discrepancy waivers be formally authorized by the applicant in writing before the issuing bank makes payment; the 34% undocumented waiver rate becomes an MRA that requires the bank to implement a discrepancy authorization workflow with documented sign-off before the next examination cycle.`,
    keywords: ['letter of credit', 'document discrepancy', 'UCP 600', 'OCC trade finance', 'discrepancy waiver'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4451',
    name: 'Trade-Based Money Laundering Controls — Shell Company Beneficiary Identification Gap',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's trade finance compliance team screens letter of credit and trade document beneficiaries against OFAC sanctions lists and FinCEN watch lists but does not conduct beneficial ownership verification for LC beneficiaries that are non-U.S. entities structured as shell companies in jurisdictions with opaque ownership registries — Cayman Islands, BVI, Panama — where trade-based money laundering (TBML) typologies frequently rely on shell beneficiary structures to obscure the ultimate recipient of trade finance proceeds. FinCEN's BSA/AML guidance on TBML and OCC commercial bank BSA/AML examination procedures require that trade finance programs implement enhanced due diligence for high-risk beneficiary structures, including beneficial ownership verification for shell entity beneficiaries; when a FinCEN examiner finds that the bank's trade finance program has processed $42M in LCs to BVI-domiciled shell beneficiaries without beneficial ownership documentation over a 24-month period, the gap triggers a BSA/AML examination MRA requiring a comprehensive trade finance TBML program build-out within 120 days.`,
    keywords: ['trade-based money laundering', 'TBML', 'BSA/AML', 'FinCEN', 'letter of credit'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4452',
    name: 'UCP 600 Compliance Gap — Transport Document Date Inconsistency Accepted as Complying Presentation',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's trade finance document examination team accepts letter of credit presentations that contain transport document date inconsistencies — specifically, bills of lading that are dated before the letter of credit issuance date or that show port of loading dates inconsistent with the LC-specified latest shipment date — treating these presentations as complying when they are in fact discrepant under UCP 600 Article 20 governing transport document requirements. OCC trade finance examination guidance and UCP 600 Articles 20 and 14 require that document examiners identify date-related discrepancies as material non-compliance with LC terms, requiring applicant waiver authorization before payment; the bank's systematic acceptance of transport document date inconsistencies as complying presentations generates liability for the bank under the LC's obligation to pay only against complying documents, and when an applicant refuses to accept goods that were shipped outside the LC's permitted shipment window, the bank has already paid against a discrepant presentation for which applicant authorization was not obtained.`,
    keywords: ['UCP 600', 'bill of lading', 'transport document', 'OCC trade finance', 'document examination'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4453',
    name: 'Dual-Use Goods Export Control Check Not Integrated into LC Issuance Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's trade finance team issues commercial letters of credit for importers without systematically screening the LC commodity codes against the Commerce Department's Commerce Control List (CCL) for dual-use goods that may require Export Control Classification Numbers (ECCNs) and export licenses before trade finance instruments can be validly issued to certain country-of-origin or beneficiary country combinations; the LC issuance workflow screens against OFAC sanctions but does not include a CCL commodity screening step that would flag LCs for items with both commercial and potential military applications. OCC BSA/AML and sanctions compliance guidance and Export Administration Regulations (EAR) 15 CFR Part 730 require that banks assess export control applicability for trade finance transactions involving goods that appear on the CCL; when a federal OFAC-referred investigation reveals that the bank issued LCs for dual-use electronics components to a front company importing for a restricted party, the lack of CCL screening in the LC workflow becomes an OCC enforcement priority requiring an immediate workflow remediation and a look-back for affected transactions.`,
    keywords: ['export controls', 'Commerce Control List', 'OFAC', 'OCC trade finance', 'dual-use goods'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4454',
    name: 'Standby Letter of Credit Expiry Extension Not Reviewed Against Credit Approval Authority',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's trade finance operations team processes standby letter of credit extension requests from commercial clients or SBLC beneficiaries, extending expiry dates on outstanding SBLCs per client instruction; the operations team processes SBLC extensions as administrative amendments without routing the extension through the bank's credit approval system, treating a one-year SBLC extension as a mechanical change rather than as a renewal of a contingent credit obligation that requires credit committee review and approval. OCC letter of credit guidance and the bank's credit approval authority matrix define SBLC extensions as credit facility renewals requiring appropriate credit officer approval; when a $15M SBLC supporting a commercial real estate construction project is extended twice at the client's request without credit review, and the underlying project subsequently experiences a completion default that triggers the SBLC draw, the credit officer reviewing the claim discovers that the SBLC has been extended beyond the project's original credit-approved completion timeline without authorization.`,
    keywords: ['standby letter of credit', 'SBLC extension', 'credit approval authority', 'OCC trade finance', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4455',
    name: 'eUCP Electronic Presentation Compliance Not Established — Digital Trade Finance Operations Gap',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's trade finance operations team does not have established operational procedures for accepting electronic LC presentations under the eUCP (Supplement to UCP 600 for Electronic Presentation), causing the bank to reject or delay electronic document sets submitted by beneficiaries through digital trade platforms, and forcing commercial clients who use digital trade finance platforms into paper-based workarounds that eliminate the efficiency benefits of digital trade document workflows. OCC trade finance operational guidance and the ICC eUCP Version 2.0 standard establish a framework for electronic LC presentations that banks operating in international trade finance must be prepared to accommodate; the bank's inability to process eUCP presentations causes it to lose two significant commercial import clients to competing banks with established digital trade finance operations, representing $8M in annual LC fee revenue and creating a competitive differentiation gap in the commercial banking treasury offering.`,
    keywords: ['eUCP', 'electronic presentation', 'digital trade finance', 'OCC trade finance', 'UCP 600'],
    demoRelevant: false,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4456',
    name: 'ISBP 745 Compliance Gap — Charter Party Bill of Lading Accepted Without Required LC Authorization',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's trade finance document examination team accepts charter party bills of lading in LC presentations without verifying that the underlying letter of credit expressly authorizes charter party transport documents, which is a specific ISBP 745 (International Standard Banking Practice) requirement reflecting UCP 600 Article 22; charter party bills of lading, which cover bulk commodity shipments under charter arrangements rather than scheduled liner services, present additional credit risk because the shipping company responsible for delivery may be a one-vessel entity rather than a reputable carrier. OCC trade finance examination guidance and ISBP 745 International Standard Banking Practice require that document examiners verify express LC authorization for charter party documents before accepting them as complying presentations; when an applicant refuses payment on goods shipped under a charter party arrangement the LC did not authorize, citing the ISBP violation, the bank has already paid the beneficiary against a discrepant presentation for which applicant waiver was not sought.`,
    keywords: ['ISBP 745', 'charter party bill of lading', 'UCP 600', 'OCC trade finance', 'document examination'],
    demoRelevant: false,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4457',
    name: 'Invoice Amount Exceeds LC Value — Complying Presentation Incorrectly Rejected',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's trade finance document examination team incorrectly applies UCP 600 Article 18(b) by rejecting LC presentations where the commercial invoice amount exceeds the letter of credit value, treating an invoice for the full contract value as a discrepancy even when the drawing amount requested is within the LC value — a systematic misapplication of the UCP rule that permits invoices to state the full sale price while limiting the drawing to the available LC balance. OCC trade finance examination guidance and UCP 600 Article 18(b) expressly permit the beneficiary to invoice for amounts exceeding the LC value, provided the drawing request does not exceed available LC credit; the bank's incorrect document examination standard results in 22 wrongful discrepancy notices over an 18-month period, causing beneficiaries to pursue complaints through the issuing applicant clients and eventually leading to an ICC Banking Commission query opinion request that documents the bank's examination error.`,
    keywords: ['UCP 600', 'invoice amount', 'document examination', 'OCC trade finance', 'LC discrepancy'],
    demoRelevant: false,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4458',
    name: 'Pre-Export Finance Risk — Assignment of Proceeds Not Perfected Under UCC Article 9',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's trade finance team provides pre-export finance facilities to commercial clients secured by an assignment of LC proceeds, where the bank advances funds to the exporter against an expected LC payment and holds a security interest in the LC payment as collateral; the bank's legal documentation for assignment of LC proceeds does not include a UCC Article 9 financing statement filing to perfect the security interest in the LC payment right as a commercial tort claim or general intangible, relying solely on notice to the issuing bank under UCC Article 5 without establishing a perfected first-priority lien. OCC commercial lending guidance and UCC Article 9 perfection requirements for security interests in payment rights require that assignment of proceeds security interests be perfected through the appropriate UCC filing; when a pre-export finance client files for bankruptcy and a competing creditor with a perfected UCC Article 9 lien challenges the bank's priority claim in the LC proceeds, the bank's unperfected security interest is subordinated, resulting in a loss on the pre-export advance that proper UCC perfection would have prevented.`,
    keywords: ['assignment of proceeds', 'UCC Article 9', 'pre-export finance', 'OCC trade finance', 'LC security interest'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },
  {
    code: 'B4459',
    name: 'Trade Finance Annual Review Cadence Misses Country Risk Reassessment After Geopolitical Events',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's trade finance credit risk program conducts annual reviews of country risk ratings and country exposure limits for trade finance transactions, but the annual review cycle does not include a trigger mechanism for off-cycle country risk reassessment when material geopolitical events — sanctions escalations, government changes, military conflicts, or sovereign rating downgrades — occur between annual reviews and materially alter the country risk profile for outstanding LC exposure. OCC commercial bank country risk management guidance (OCC 2011-32) requires that banks with international trade finance exposure maintain current country risk ratings and respond to material country risk deterioration in a timely manner, not just at scheduled annual intervals; when a geopolitical escalation in a country where the bank has $65M in outstanding LC exposure results in an emergency sanctions designation three months before the scheduled annual review, the bank discovers it has continued issuing LCs for 90 days without the required country risk re-evaluation that would have suspended new issuance.`,
    keywords: ['country risk', 'trade finance', 'OCC 2011-32', 'OFAC sanctions', 'geopolitical risk'],
    demoRelevant: true,
    subTopic: 'trade-finance-compliance',
  },

  // ── Commercial Deposit Services (B4460–B4469) ─────────────────────────────
  {
    code: 'B4460',
    name: 'Analyzed Checking Account Error Resolution — Billing Disputes Exceed 60-Day Window',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's treasury management account analysis billing team processes analyzed checking account statements monthly for commercial clients, itemizing service charges, transaction counts, and earnings credit calculations; the bank's account analysis dispute resolution process does not have a defined turnaround standard for investigating and resolving commercial client billing disputes, causing dispute investigations to extend beyond 60 days while the disputed charges remain on the client's account and continue to generate overdraft risk if the client adjusts operating account balances in anticipation of a credit. OCC commercial banking consumer relations guidance and the bank's treasury management services agreement specify that billing disputes be acknowledged within five business days and resolved within 30 days; when an OCC examination reviews commercial client correspondence files and identifies 14 open account analysis disputes older than 60 days without resolution, the finding requires the bank to implement a dispute tracking system with defined service level commitments and to resolve all open disputes within 30 days.`,
    keywords: ['account analysis', 'billing dispute', 'treasury management', 'OCC guidance', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4461',
    name: 'Commercial Deposit Agreement Material Change Notification — Fee Increase Not Disclosed 30 Days Prior',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's treasury management services team increases wire transfer fees, ACH origination fees, and commercial deposit account maintenance fees effective with the new fiscal year, sending notification to commercial clients via account analysis statement insert rather than a separate advance notice communication; the account analysis statement insert is distributed with the month-end statement that commercial clients receive in the first week of the month the fee changes take effect, providing less than 30 days' advance notice of the fee changes in violation of the commercial deposit agreement's required notice period. OCC commercial banking deposit agreement enforcement expectations and the bank's own treasury management services agreement specify that material fee changes require 30 days' advance written notice to commercial deposit clients; when a corporate treasury officer notices the fee increase on the same month's statement as the first application of the new fees, they file a formal complaint citing the deposit agreement's notice requirement, triggering a fee reversal, corrective notification to all affected commercial clients, and a compliance review of the bank's fee change notification process.`,
    keywords: ['deposit agreement', 'fee change notice', 'OCC compliance', 'treasury management', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4462',
    name: 'FDIC Coverage Limits for Commercial Accounts — Client Miscommunication Creates Uninsured Exposure Risk',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial relationship managers communicate to corporate clients that the bank provides "FDIC-insured deposit accounts" without specifying that the FDIC's standard maximum deposit insurance amount of $250,000 per depositor per insured bank applies to all related accounts in the same ownership category, causing commercial clients with operating account balances significantly exceeding $250K to incorrectly believe that their full commercial deposit balances are FDIC-insured. OCC consumer protection guidance and FDIC deposit insurance disclosure requirements (12 CFR Part 330) require that banks accurately communicate deposit insurance coverage limits to depositors, including commercial depositors; when a commercial client with $4.2M in operating account balances inquires about FDIC coverage after reading about the Silicon Valley Bank resolution and discovers from a direct FDIC inquiry that $3.95M of their deposits are uninsured, they file a complaint citing the bank's misleading FDIC-insured marketing communications as creating a false sense of security about their uninsured deposit exposure.`,
    keywords: ['FDIC coverage', 'deposit insurance', '12 CFR Part 330', 'OCC disclosure', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4463',
    name: 'Commercial Deposit Dormancy — Unclaimed Property Reporting Misses Electronically Active Accounts',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's deposit operations team manages the unclaimed property escheatment process for commercial deposit accounts, identifying dormant accounts based on a definition that requires no owner-initiated transactions for the state-specified dormancy period; the bank's dormancy identification system treats electronic account statement delivery as owner activity for the purpose of resetting the dormancy clock, even though the bank initiates the electronic statement delivery rather than the account owner, causing the bank to underreport commercial accounts that should be escheated to state unclaimed property programs. OCC deposit operations compliance and state unclaimed property statutes in all states where First Capital operates require that only owner-initiated activity — deposits, withdrawals, written instruction from the account owner — tolls the dormancy period, not bank-initiated communications; when a state unclaimed property examiner reviews the bank's escheatment filings and identifies the systematic under-escheating of electronically-active-but-owner-dormant accounts, the bank faces a retroactive escheatment liability and penalty assessment for three years of under-reported unclaimed property.`,
    keywords: ['unclaimed property', 'escheatment', 'dormancy', 'OCC deposit operations', 'commercial deposits'],
    demoRelevant: false,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4464',
    name: 'Business Continuity for Commercial Deposit Services — Recovery Time Objective Untested for Core Platform',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's commercial banking operations team maintains a business continuity plan for commercial deposit and treasury management services that specifies a four-hour recovery time objective (RTO) for the core deposit platform and treasury management operations center; the BCP has not been tested in a full failover simulation for three years, relying instead on component-level testing of individual systems that does not validate the end-to-end recovery workflow — including cross-system dependencies between the deposit platform, ACH operations, wire processing, and account analysis billing — that would be critical in an actual platform outage. OCC business continuity planning guidance (OCC 2004-34) and the bank's technology risk management policy require annual testing of critical system recovery capabilities at a level that validates the documented RTO; when a production database failure triggers the commercial deposit platform recovery procedure, the untested cross-system dependencies cause the actual recovery to take 11 hours — nearly three times the documented RTO — causing commercial clients to miss critical payment windows and file operational failure complaints with the OCC.`,
    keywords: ['business continuity', 'RTO', 'OCC 2004-34', 'commercial deposits', 'treasury management'],
    demoRelevant: false,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4465',
    name: 'Commercial Deposit Overdraft Protection Linked to Credit Facility Not Documented in CRA Assessment',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's commercial banking team markets overdraft protection for commercial checking accounts linked to the client's committed revolving credit facility as a standard feature of the commercial deposit relationship, but the bank's CRA examination documentation does not capture these commercial deposit-linked credit extensions as qualifying community development lending or as commercial loan originations in the bank's assessment area, depending on the borrower's community development purpose. OCC CRA examination guidance and 12 CFR Part 25 CRA regulations require that banks accurately document all qualifying community development activities in their assessment areas, and that commercial credit products — including deposit-linked overdraft facilities for small business clients — be correctly classified in the bank's CRA performance context; the documentation gap causes the bank to undercount small business lending in its CRA assessment area, contributing to a "Satisfactory" CRA rating that could have been "Outstanding" if the commercial overdraft protection facilities for qualifying small businesses were correctly captured.`,
    keywords: ['CRA', 'overdraft protection', 'commercial deposits', '12 CFR Part 25', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4466',
    name: 'Commercial Deposit Reconciliation Support — Bank Error in Prior-Period Statements Not Corrected',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking operations team discovers a systematic error in commercial deposit account statement generation affecting the prior six months — a fee-posting timing error that caused certain wire transfer fees to appear on the wrong period's statement, creating reconciliation discrepancies for commercial clients who match bank charges to their internal accounts payable records on an accrual basis; the operations team corrects the current-period posting going forward but does not issue corrected historical statements for the six-month affected period, leaving commercial clients with permanent reconciliation discrepancies on their historical records. OCC commercial banking deposit operations standards and the bank's own treasury management service quality commitments require that known statement errors be corrected and corrected statements issued to affected clients within a reasonable period; when a corporate controller conducting a year-end reconciliation identifies the six-month statement discrepancy and the bank cannot provide corrected historical statements, the audit finding creates a commercial client retention risk and a potential regulatory complaint about the bank's statement accuracy.`,
    keywords: ['deposit reconciliation', 'statement error', 'OCC deposit operations', 'commercial banking', 'treasury management'],
    demoRelevant: false,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4467',
    name: 'Reg E Dispute Rights Incorrectly Extended to Commercial Accounts — Liability Exposure Created',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial banking customer service team incorrectly applies Regulation E error resolution procedures — which provide consumer electronic fund transfer dispute rights — to commercial checking account holders who contact the bank to dispute ACH debits, creating an expectation of provisional credit and investigation rights that Regulation E does not extend to business accounts; the customer service scripts and training materials do not distinguish between consumer accounts covered by Regulation E and commercial accounts that are not. OCC Regulation E compliance guidance (12 CFR Part 1005) and the bank's commercial deposit agreement, which governs disputes under commercial ACH transaction rules rather than Reg E, require that commercial account disputes be handled under commercial ACH framework; when the bank extends provisional credit to a commercial account for an ACH dispute under Reg E procedures that do not apply, and the commercial client structures subsequent disputes to exploit the Reg E timeline, the bank creates a liability exposure that is remediated only when legal counsel identifies the regulatory misapplication.`,
    keywords: ['Regulation E', 'commercial accounts', 'ACH dispute', 'OCC compliance', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4468',
    name: 'Commercial Deposit Concentration Risk — Single Industry Sector Represents 38% of Deposit Funding',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's commercial banking deposit base has significant concentration in the regional commercial real estate development sector — a pattern that developed as the bank grew its CRE construction lending business and the developer clients maintained operating deposits and escrow accounts — resulting in a single industry sector representing 38% of the bank's commercial deposit funding base without a deposit concentration risk limit framework to identify and manage the correlated outflow risk. OCC commercial bank liquidity risk management guidance and the bank's asset-liability management policy require that deposit funding concentration risk be identified, measured, and limited through explicit concentration thresholds and contingency funding scenarios that model correlated deposit outflows; when the commercial real estate sector experiences a construction financing pullback and multiple developer clients simultaneously reduce operating deposit balances to fund working capital needs, the correlated outflow totaling $280M over 60 days exceeds the bank's contingency funding plan assumptions, requiring emergency FHLB advance utilization at elevated cost.`,
    keywords: ['deposit concentration', 'liquidity risk', 'OCC ALM guidance', 'commercial deposits', 'commercial real estate'],
    demoRelevant: true,
    subTopic: 'commercial-deposit-services',
  },
  {
    code: 'B4469',
    name: 'Commercial Deposit Product Disclosure — Analysis of Charges Not Provided at Account Opening',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's commercial banking sales team opens analyzed commercial checking accounts for new commercial clients with a verbal overview of the account analysis billing methodology but without providing a written schedule of charges, account analysis methodology disclosure, or service fee schedule at the time of account opening — relying on the commercial client's ability to review charges through the monthly account analysis statement rather than providing the fee disclosure before account activation. OCC commercial banking consumer protection guidance and the bank's treasury management services agreement specify that commercial deposit clients receive a complete schedule of fees and account analysis methodology documentation at or before account opening; when a new commercial client with a $3.2M average deposit balance receives their first account analysis statement showing $8,400 in monthly service charges that they did not anticipate based on the verbal sales presentation, the fee dispute initiates a client retention intervention and a regulatory complaint review of the bank's commercial account opening disclosure practices.`,
    keywords: ['deposit disclosure', 'account analysis', 'OCC compliance', 'commercial deposits', 'fee transparency'],
    demoRelevant: true,
    subTopic: 'commercial-deposit-services',
  },

  // ── Relationship Banking Risk (B4470–B4479) ───────────────────────────────
  {
    code: 'B4470',
    name: 'Relationship Manager Concentration Risk — Single RM Controls 28% of Commercial Loan Portfolio',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's commercial banking market has experienced significant growth in one relationship manager's book of business, with a single RM managing 28% of the bank's C&I and commercial real estate loan portfolio — representing $340M in outstanding commitments and 42 relationship clients — without the bank implementing a concentration limit or transition risk management plan to address the exposure if the RM departs, is incapacitated, or is subject to conduct investigation. OCC commercial banking management guidance and the bank's operational risk framework require that single-point-of-failure risks in revenue-generating staff be identified and managed through succession planning, client introduction programs, and portfolio concentration limits for individual RMs; when the concentrated RM accepts a position with a competing institution, 18 of 42 clients express intent to follow, representing $140M in committed credit facilities and $90M in commercial deposits that must be transitioned in an unplanned, compressed timeline that the bank's commercial banking management team is unprepared to execute.`,
    keywords: ['RM concentration', 'key person risk', 'OCC operational risk', 'commercial banking', 'relationship management'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4471',
    name: 'CRM Data Integrity — Commercial Client Financial Profile Not Updated After Quarterly Statement Delivery',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial banking CRM system contains commercial client financial profiles — revenues, EBITDA, leverage, and employee count — that relationship managers are expected to update upon receipt of quarterly financial statements from credit clients, but the bank has no automated CRM update trigger, workflow enforcement, or data currency audit that ensures relationship managers actually update client financial profiles after financial statement delivery; as a result, CRM financial data becomes progressively stale, with 60% of commercial client profiles showing financial data more than 12 months old. OCC commercial banking relationship management expectations and the bank's credit risk monitoring policy require that client financial information used for risk rating, cross-sell targeting, and relationship strategy be current and maintained through the annual review cycle; when a treasury management cross-sell model uses CRM financial data to identify clients eligible for a new cash management product and contacts 28 commercial clients whose revenues have declined materially since their CRM profile was last updated, the irrelevant outreach damages relationship quality and triggers an internal CRM data quality audit.`,
    keywords: ['CRM data integrity', 'financial profile', 'OCC credit monitoring', 'commercial banking', 'relationship management'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4472',
    name: 'Key Person Dependency — Commercial Client CEO Succession Not Assessed in Annual Credit Review',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's commercial underwriting team evaluates management quality as part of the annual credit review for commercial borrowers, assigning a qualitative management assessment score, but does not specifically assess key person dependency risk — the degree to which the borrower's financial performance depends on the continued involvement of one or two individuals whose departure would materially impair the business's ability to service debt — and does not require key-man life insurance for loans above a defined threshold where management concentration is identified. OCC commercial credit examination guidance and the bank's commercial underwriting policy identify management quality assessment as a required component of commercial credit analysis, including identification of key person dependency for closely-held businesses; when a $14M C&I borrower's founder and CEO unexpectedly passes away and the business's revenues drop 40% within six months — driven by customer relationships built on the founder's personal network — the annual review's failure to identify key person dependency and require key-man insurance coverage leaves the bank with no insurance recovery mechanism on a credit that deteriorates to Substandard within the same period.`,
    keywords: ['key person dependency', 'management quality', 'OCC credit guidance', 'commercial underwriting', 'key-man insurance'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4473',
    name: 'Commercial Relationship Profitability Model Excludes Deposit Volatility Adjustment',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial banking relationship profitability model calculates net relationship contribution for each commercial client by summing loan spread income, fee income, and deposit funding benefit minus allocated credit and operational costs, but uses average deposit balances as the deposit funding benefit input without adjusting for deposit balance volatility — effectively treating highly volatile commercial operating deposits that fluctuate between $500K and $8M seasonally the same as stable core deposits with $2M average balances and low volatility. OCC asset-liability management and transfer pricing guidance require that commercial bank internal profitability models reflect the liquidity cost of deposit volatility in deposit funding benefit calculations; the profitability model's failure to discount volatile deposit funding benefits causes the bank to over-value and over-retain seasonal commercial deposit relationships at pricing levels that are unprofitable on a risk-adjusted basis when the high liquidity cost of volatile funding is correctly included, distorting the commercial banking team's relationship retention investment decisions.`,
    keywords: ['relationship profitability', 'deposit volatility', 'OCC ALM guidance', 'commercial banking', 'transfer pricing'],
    demoRelevant: false,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4474',
    name: 'Relationship Manager Incentive Compensation Structure Creates Loan Origination Over-Concentration Bias',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's commercial banking incentive compensation program for relationship managers weights new loan origination volume with a higher payout multiplier than deposit gathering, treasury management cross-sell, or fee income generation, creating a structural bias toward loan origination over relationship breadth that causes RMs to prioritize new credit facilities even when the client relationship's optimal development path favors treasury management or deposit deepening. OCC commercial banking incentive compensation guidance (OCC 2010-24 and the interagency sound incentive compensation guidance) requires that commercial bank incentive compensation structures not create incentives for excessive risk-taking and should reward balanced relationship development; the loan-heavy incentive structure contributes to a commercial portfolio concentration pattern where 78% of the bank's commercial relationships have lending-only characteristics with no treasury or deposit product depth — a one-dimensional relationship structure that increases attrition risk and reduces relationship switching costs for commercial clients.`,
    keywords: ['incentive compensation', 'OCC 2010-24', 'commercial banking', 'loan origination bias', 'relationship depth'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4475',
    name: 'Commercial Client Onboarding KYC Refresh Not Triggered by Ownership Change',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's BSA/AML compliance program performs KYC due diligence and beneficial ownership verification for commercial clients at account opening, with periodic refresh reviews scheduled based on the client's risk tier, but does not have a trigger-based refresh mechanism that initiates an out-of-cycle KYC review when a commercial client undergoes a material ownership change — such as a private equity acquisition, management buyout, or change in controlling shareholders — that may alter the beneficial ownership profile and risk assessment. FinCEN's Customer Due Diligence Rule (31 CFR Part 1010.230) and OCC BSA/AML examination procedures require that banks obtain and verify beneficial ownership information when material changes in ownership occur, not just at account opening and scheduled refresh dates; when an OCC BSA/AML examination identifies 12 commercial clients that underwent private equity ownership changes without triggering a KYC refresh, and one of those clients has a new beneficial owner with adverse information, the program gap generates a Material Weakness finding requiring an enterprise-wide ownership change trigger implementation.`,
    keywords: ['KYC refresh', 'beneficial ownership', 'FinCEN CDD Rule', 'OCC BSA/AML', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4476',
    name: 'Commercial Client Complaint Escalation Process Does Not Route Regulatory Complaints Correctly',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's commercial banking client service team receives commercial client complaints through relationship managers, branch operations, and the treasury management help desk, routing all complaints through a general client service resolution workflow without distinguishing between service quality complaints and regulatory complaints — formal written complaints about legal violations, discrimination, or regulatory non-compliance — that require escalation to the bank's compliance department under OCC complaint management guidance. OCC commercial banking complaint management guidance (OCC 2002-17 and OCC Bulletin 2020-86) requires that banks have a complaint management system that identifies, categorizes, and routes regulatory complaints to compliance personnel for resolution monitoring and root cause analysis; when an OCC examination reviews the bank's commercial client complaint log and identifies 14 regulatory complaints — including five ECOA complaints and three CRA-related complaints — that were resolved through the general service workflow without compliance department involvement, the complaint management deficiency becomes an examination finding requiring immediate workflow remediation.`,
    keywords: ['complaint management', 'OCC 2002-17', 'Reg B', 'commercial banking', 'compliance escalation'],
    demoRelevant: false,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4477',
    name: 'Relationship Banker Dual Capacity Conflict — Same RM Manages Credit and Deposit Retention for At-Risk Clients',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial banking model assigns the same relationship manager responsibility for both credit monitoring and deposit retention for commercial clients, creating a structural conflict of interest when a client's credit quality deteriorates — the RM simultaneously serves the bank's credit quality objective (requiring proactive workout engagement and potentially adversarial negotiation) and the bank's deposit retention objective (requiring positive relationship maintenance to prevent deposit withdrawal), causing RMs to delay escalating deteriorating credits to the special assets team to preserve the deposit relationship. OCC commercial credit risk management guidance and the bank's internal credit governance policy require that credit monitoring and deteriorating credit management responsibilities be structured to prioritize credit quality over relationship preservation; when a portfolio review identifies that five credits that should have been escalated to special assets 90 days earlier were retained in the relationship RM's portfolio to protect deposit relationships, and those credits subsequently deteriorated further during the delay period, the structural conflict is identified as a credit risk management governance gap.`,
    keywords: ['relationship manager conflict', 'credit monitoring', 'OCC credit governance', 'commercial banking', 'deposit retention'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4478',
    name: 'Commercial Relationship Succession Planning Gap — Retiring Senior RM Transition Not Documented',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's commercial banking management team does not have a formal relationship succession planning program that documents transition plans for senior relationship managers approaching retirement, identifying which clients require senior-level introduction to a successor RM, what relationship-specific context must be transferred, and what minimum tenure overlap is required before the departing RM's final date; the absence of a succession program causes client transitions to be executed reactively when retirement is announced, with compressed timelines that do not allow adequate relationship transfer. OCC commercial banking management expectations and the bank's human capital risk framework require that single-point-of-failure risks in client-facing revenue-generating roles be managed through documented succession plans that protect the bank's relationship continuity and revenue stability; when a senior RM with 22 years of relationship history with the bank's largest commercial client group announces retirement with 60 days' notice and no transition plan exists, the bank loses three of the eight marquee relationships in the first year post-transition, representing $28M in annual revenue.`,
    keywords: ['succession planning', 'RM transition', 'OCC operational risk', 'commercial banking', 'relationship management'],
    demoRelevant: true,
    subTopic: 'relationship-banking-risk',
  },
  {
    code: 'B4479',
    name: 'Commercial Relationship Tier Assignment Misclassification — High-Value Clients Under-Served',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial banking relationship tiering model assigns commercial clients to relationship service tiers — Premier, Core, and Emerging — based on current year-to-date revenue contribution to the bank, but does not incorporate forward-looking relationship potential, total relationship lifetime value, or strategic industry sector positioning, causing high-growth commercial clients in the early stages of their banking relationship to be classified in lower service tiers and assigned to less experienced relationship managers at the point in the relationship lifecycle where senior attention would drive the deepest product penetration and long-term loyalty. OCC commercial banking management quality expectations and the bank's commercial banking strategic plan require that the relationship tiering model align service delivery with relationship potential, not just current revenue; a strategic account review finds that eight commercial banking clients reclassified to the Premier tier based on relationship potential analysis generate 340% more fee income in the 24 months following tier upgrade than they had in the 24 months prior — confirming that the current-revenue-only tiering model systematically under-serves the clients with the highest future value to the bank.`,
    keywords: ['relationship tiering', 'commercial banking strategy', 'OCC management quality', 'client segmentation', 'relationship management'],
    demoRelevant: false,
    subTopic: 'relationship-banking-risk',
  },

];
