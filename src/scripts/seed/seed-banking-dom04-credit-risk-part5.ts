// seed-banking-dom04-credit-risk-part5.ts
// Banking genome patterns — Credit Risk Management
// Code range: B1240–B1299  (60 patterns)
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

export const BANKING_DOM04_CREDIT_RISK_PART5_PATTERNS: PatternSeed[] = [

  // ── AI Credit Part 5 (B1240–B1257) ───────────────────────────────────────────

  {
    code: 'B1240',
    name: 'GenAI Credit Memo Hallucinating Borrower Financial Projections',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital relationship managers use a generative AI credit memo drafting tool that ingests borrower-submitted financial projections and prior credit files, and the tool is generating forward revenue and EBITDA projections in credit memos that do not correspond to any borrower-submitted document — the AI interpolates plausible-looking five-year forecasts from historical trends, which relationship managers accept without cross-referencing against actual borrower projections before submitting to credit committee. OCC Bulletin 2023-17 on AI risk management requires that generative AI outputs used in credit underwriting documentation be verified against source documents before use in credit decisions; examiners reviewing credit committee submissions for the prior six months find that nine credit memos contain forward financial projections that differ materially from the borrower-submitted business plans, each constituting a credit underwriting documentation deficiency attributable to inadequate GenAI hallucination controls.`,
    keywords: ['genai-credit-risk', 'hallucination', 'OCC-2023-17', 'credit-memo', 'ai-verification'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1241',
    name: 'LLM Covenant Compliance Analysis Misreading Defined Terms in Credit Agreements',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's portfolio management team uses a large language model to parse credit agreement covenant packages and flag potential compliance breaches, but the LLM is misinterpreting defined terms in ISDA-standard and LMA-format credit agreements — treating "Consolidated EBITDA" as a synonym for GAAP EBITDA without applying the add-back schedule defined in the credit agreement — resulting in false-positive covenant breach alerts on performing borrowers and false-negative clearances on borrowers whose covenant compliance depends on negotiated add-backs. OCC guidance on model risk management (SR 11-7) requires that models used in material credit monitoring functions be validated for the specific data inputs and use case, including testing against known-correct outputs; LLM covenant parsing deployed without agreement-specific validation and defined-term mapping is an unvalidated model under SR 11-7, and erroneous covenant compliance outputs expose the bank to missed covenant breaches that should have triggered acceleration or enhanced monitoring.`,
    keywords: ['llm-covenant-analysis', 'SR-11-7', 'covenant-compliance', 'credit-agreement', 'ai-model-risk'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1242',
    name: 'AI Portfolio Concentration Analytics Lack Model Inventory Registration',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's credit risk analytics team has deployed three AI-driven concentration monitoring dashboards — for industry, geographic, and borrower-type concentration — that use ML clustering algorithms to dynamically segment the portfolio and flag emerging concentration risks, but none of these analytical tools have been registered in the bank's formal model inventory, submitted for independent model validation, or reviewed under the bank's model risk management policy. SR 11-7 model risk management guidance requires that all quantitative tools that inform material risk management decisions be included in the institution's model inventory and subjected to validation commensurate with the tool's risk; concentration monitoring tools that influence board-level credit concentration limits and ALCO portfolio decisions are clearly material models under SR 11-7, and their absence from the model inventory constitutes a model governance deficiency that OCC examiners treat as indicative of broader model risk management weaknesses.`,
    keywords: ['ai-portfolio-concentration', 'SR-11-7', 'model-inventory', 'model-risk-management', 'OCC-examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1243',
    name: 'ML Early Warning System Missing SR 11-7 Annual Validation Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's ML-based early warning system — which uses gradient boosting to flag commercial borrowers at elevated probability of downgrade within 90 days — has not completed its annual independent model validation since initial deployment 26 months ago, leaving the bank without current evidence that model performance metrics including accuracy, Gini coefficient, and false-negative rate remain acceptable after two years of significant credit environment changes. OCC Bulletin 2021-18 on model risk management and SR 11-7 both require that models in active use for credit risk monitoring be subject to ongoing performance monitoring and periodic independent validation; an early warning system that has not been validated through a 200-basis-point rate cycle cannot be relied upon as an accurate predictor of commercial credit deterioration, and examiners reviewing the model risk management program identify the missing validation cycle as a Matters Requiring Attention finding requiring a remediation timeline.`,
    keywords: ['ml-early-warning', 'SR-11-7', 'model-validation', 'OCC-2021-18', 'credit-monitoring'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1244',
    name: 'AI Stress Test Scenario Generator Producing Implausible Macro Combinations',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's credit stress testing function has deployed a generative AI tool to supplement its scenario library by generating novel macroeconomic stress scenarios, but the tool is producing macro variable combinations — simultaneous deflation, unemployment below 3%, and 10-year Treasury yields above 6% — that are internally inconsistent and economically implausible, resulting in stress scenarios that pass surface-level review but would produce nonsensical loss projections if applied to the credit portfolio model. OCC stress testing guidance and SR 18-8 require that stress scenarios used in credit loss estimation be plausible, internally consistent, and based on identifiable economic mechanisms; AI-generated scenarios that violate basic macroeconomic relationships cannot satisfy the plausibility requirement, and stress test results derived from implausible scenarios cannot be presented to the board risk committee as credible adverse outcome assessments.`,
    keywords: ['ai-stress-testing', 'scenario-generation', 'SR-18-8', 'macroeconomic-scenarios', 'OCC-stress-testing'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1245',
    name: 'GenAI Annual Review Summaries Not Flagging Negative Covenant Trends',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital uses generative AI to draft annual review summaries for commercial borrowers, and the AI tool is consistently omitting adverse trend commentary on borrowers whose year-over-year financial ratios show deterioration — the tool's summarization logic defaults to neutral-toned summaries that present absolute ratio values without highlighting directional trends — causing relationship managers and credit committee reviewers to miss early warning signals embedded in the underlying financial data. OCC annual review guidance and OCC examination standards for commercial credit monitoring require that annual review documents include explicit analysis of financial trend direction, not merely a snapshot of current metrics; generative AI tools used to draft credit documents must be configured and validated to produce trend analysis commentary, and the systematic omission of adverse trend flags from AI-generated summaries constitutes a credit monitoring documentation deficiency across the commercial portfolio.`,
    keywords: ['genai-annual-review', 'covenant-trends', 'OCC-examination', 'credit-monitoring', 'ai-verification'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1246',
    name: 'LLM-Based Borrower News Monitoring Producing False Credit Risk Alerts',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial banking team uses an LLM-based news monitoring service to surface credit-relevant news on commercial borrowers, but the tool has a 22% false-positive rate on credit risk alerts — generating alerts for borrowers based on news about similarly-named unrelated entities, industry-wide articles that the LLM incorrectly attributes to specific borrowers, and sentiment misclassification of neutral restructuring announcements — creating alert fatigue that causes relationship managers to dismiss genuine credit risk signals along with false positives. OCC guidance on credit risk data quality and SR 11-7 require that information used in credit monitoring decisions be accurate and traceable to verified sources; an AI news monitoring tool with a 22% false-positive rate cannot serve as a reliable input to portfolio monitoring without human verification protocols, and the alert fatigue it creates systematically degrades the bank's ability to act on genuine early warning signals.`,
    keywords: ['llm-news-monitoring', 'false-positives', 'SR-11-7', 'credit-monitoring', 'alert-fatigue'],
    demoRelevant: false,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1247',
    name: 'AI Credit Risk Rating System Not Explainable to Borrowers Under ECOA',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital's commercial credit scoring system incorporates an ensemble ML model whose output scores directly influence risk rating assignments, but the model uses a deep neural network component whose feature attribution cannot be decomposed into principal factors that can be communicated to borrowers as adverse action reasons under ECOA, leaving the bank unable to provide the specific reasons for unfavorable credit decisions as required by Regulation B. CFPB supervisory guidance on AI adverse action notices and Regulation B Section 202.9 require that adverse action notices identify the specific factors most significantly affecting the credit decision; the neural network's lack of inherent interpretability means the bank's post-hoc explainability approximations produce reason codes that may not accurately reflect the model's actual decision logic, creating ECOA compliance exposure on every commercial adverse action notice that references the AI scoring system.`,
    keywords: ['ai-credit-rating', 'ECOA', 'Regulation-B', 'adverse-action', 'CFPB-examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1248',
    name: 'AI Collateral Valuation Model Overvaluing Specialized Industrial Assets',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI collateral valuation model, trained on generic commercial real estate transaction data, is systematically overvaluing specialized industrial collateral — food processing plants, automotive stamping facilities, and semiconductor clean rooms — because the training dataset lacks sufficient transactions for specialty industrial assets with high conversion costs, causing the model to apply standard industrial cap rates to assets whose market value is far lower on a liquidation basis due to their limited alternative-use appeal. OCC appraisal and collateral valuation guidance requires that collateral valuations reflect the asset's actual market value under orderly liquidation conditions, accounting for asset-specific characteristics; an AI valuation model trained on generic industrial data without specialty-asset calibration produces loan-to-value ratios for specialized industrial collateral that overstate the bank's actual collateral coverage, causing underestimation of loss given default in the C&I secured portfolio.`,
    keywords: ['ai-collateral-valuation', 'specialized-industrial', 'OCC-appraisal', 'loan-to-value', 'model-validation'],
    demoRelevant: false,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1249',
    name: 'ML Fraud-Credit Risk Model Integration Missing Governance Documentation',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's technology team has integrated fraud detection ML model outputs as input features into the consumer credit underwriting model without documenting the integration in either model's validation documentation, creating an undocumented model dependency where the credit model implicitly relies on fraud risk scores whose accuracy, methodology, and ongoing performance have not been assessed by the credit model validator. SR 11-7 requires that model documentation describe all material inputs, including upstream model outputs used as features, and that model validators assess the reliability of those inputs; the undocumented fraud-credit model integration means the credit model's performance assessment does not account for fraud model error propagation, and a degradation in fraud model accuracy will create correlated errors in credit decisions that the bank cannot detect through its current model monitoring framework.`,
    keywords: ['ml-model-integration', 'SR-11-7', 'fraud-credit-risk', 'model-governance', 'model-documentation'],
    demoRelevant: false,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1250',
    name: 'AI Portfolio Manager Tool Recommending Concentration Increases Without Regulatory Limit Check',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's AI-powered portfolio optimization tool recommends loan origination targets and sector allocation adjustments to maximize risk-adjusted return, but the tool's recommendation engine does not incorporate the bank's board-approved concentration limits or OCC CRE concentration thresholds as hard constraints, enabling it to recommend sector allocation increases that would push portfolio concentrations beyond policy limits without flagging the regulatory or policy conflict to the portfolio manager. OCC guidance on concentration risk management and interagency CRE concentration guidance require that portfolio management decisions incorporate approved concentration limits as binding constraints; an AI optimization tool that generates recommendations without enforcing concentration limits is functioning as an unsupervised portfolio advisory that can actively guide the bank toward regulatory concentration violations, which represents both a model risk failure and a concentration risk governance failure.`,
    keywords: ['ai-portfolio-optimization', 'concentration-limits', 'OCC-CRE-concentration', 'model-risk', 'portfolio-governance'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1251',
    name: 'GenAI Loan Modification Drafting Tool Omitting Required Regulatory Disclosures',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's workout team uses a generative AI tool to draft loan modification agreements from a template, and examiners have identified that AI-generated modification documents are missing HMDA disclosure requirements on residential mortgage modifications, TILA disclosure requirements on consumer loan modifications, and troubled debt restructuring classification notices — omissions that create regulatory compliance violations on executed loan modification agreements that are already in the loan file. OCC consumer compliance examination procedures require that loan modification documents include all required regulatory disclosures appropriate to the loan type; generative AI drafting tools that produce legal documents must be constrained by a regulatory disclosure checklist system that validates document completeness before execution, and the systematic omission of required disclosures from AI-generated modification documents creates an accumulated body of non-compliant executed loan modifications that require remediation notices to affected borrowers.`,
    keywords: ['genai-loan-modification', 'HMDA', 'TILA', 'OCC-compliance', 'regulatory-disclosures'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1252',
    name: 'AI Credit Spreading Tool Misclassifying Operating Leases Under ASC 842',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI financial statement spreading tool, trained on pre-ASC 842 financial statement data, is misclassifying operating lease right-of-use assets and lease liabilities — treating them as balance sheet items irrelevant to leverage analysis rather than capitalizing them in the bank's adjusted leverage ratios — causing the bank's credit spreads to systematically understate debt-to-EBITDA and fixed charge coverage ratios for borrowers with significant operating lease obligations such as retailers, airlines, and restaurant chains. ASC 842 fundamentally changed the balance sheet treatment of operating leases beginning in 2019, and OCC commercial credit underwriting guidance requires that leverage ratio calculations reflect total funded debt obligations including capitalized lease liabilities; an AI spreading tool that has not been updated or retrained for ASC 842 produces materially incorrect leverage ratios for lease-heavy industries, creating credit underwriting documentation deficiencies across the retail and hospitality portfolio segments.`,
    keywords: ['ai-financial-spreading', 'ASC-842', 'operating-leases', 'leverage-ratios', 'OCC-underwriting'],
    demoRelevant: false,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1253',
    name: 'LLM Borrower Communication Drafts Missing Fair Lending Required Language',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial banking team uses an LLM to draft borrower-facing adverse action letters, credit limit reduction notices, and loan declination communications, and a fair lending audit has identified that LLM-generated communications are omitting the ECOA required statement of borrower rights to a written statement of reasons and the CFPB-required fair lending nondiscrimination notices, creating a pattern of non-compliant adverse action communications sent to borrowers. Regulation B Section 202.9 specifies the required content of adverse action notices, and OCC consumer compliance examination standards require that all borrower-facing adverse action communications include the complete required statutory language; LLM tools deployed to draft regulatory compliance documents without template constraints and post-generation compliance validation create systematic compliance deficiencies across every communication generated by the tool.`,
    keywords: ['llm-adverse-action', 'ECOA', 'Regulation-B', 'fair-lending', 'CFPB-examination'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1254',
    name: 'AI-Generated CECL Qualitative Factor Adjustments Without Board Approval',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's finance team uses an AI tool to recommend qualitative factor adjustments to CECL allowance calculations, and the team is implementing AI-recommended qualitative adjustments in the quarterly CECL calculation without presenting the AI's underlying rationale to the audit committee or credit risk committee for approval, effectively allowing an AI system to influence the bank's allowance for credit losses without the board-level governance review required for material model assumption changes. FASB ASC 326, OCC CECL guidance, and the interagency statement on CECL adoption all require that qualitative factors and their adjustments be approved through the bank's governance structure, with documentation supporting the reasonableness of adjustments reviewed by an appropriate governance body; AI-recommended CECL adjustments implemented without governance review circumvent the allowance governance framework and expose the bank to OCC criticism for inadequate allowance governance documentation.`,
    keywords: ['ai-CECL', 'qualitative-factors', 'ASC-326', 'OCC-CECL-guidance', 'allowance-governance'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1255',
    name: 'ML Credit Model Champion-Challenger Testing Bypassed for Emergency Deployment',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's ML credit risk team deployed an updated version of its consumer credit scoring model on an emergency basis during a period of rapid macroeconomic change without completing the champion-challenger testing protocol required by the bank's model risk management policy, and the model has been in production for seven months without the champion-challenger results that would demonstrate superior performance of the new model version over the prior version. SR 11-7 and OCC model risk management guidance require that material model updates be subject to validation testing before deployment, including performance comparison against the incumbent model; emergency deployment exceptions must be documented with a remediation plan specifying when full validation will be completed; the absence of champion-challenger results for a model in active use on consumer credit decisions for seven months constitutes an ongoing model risk governance deficiency with no documented remediation timeline.`,
    keywords: ['ml-model-deployment', 'champion-challenger', 'SR-11-7', 'model-validation', 'OCC-model-risk'],
    demoRelevant: false,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1256',
    name: 'AI Risk Rating Override Tool Masking Systematic Relationship Manager Grade Inflation',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's AI risk rating system includes a relationship manager override function that allows RMs to adjust AI-recommended risk grades upward with a documented business rationale, and an independent loan review has found that 34% of all AI-recommended downgrades in the prior year were overridden by relationship managers using generic rationale language generated by the same AI tool — creating a feedback loop where AI-generated justifications enable systematic reversal of AI-recommended adverse risk grade changes without substantive credit analysis. OCC examination guidance on credit risk rating systems and OCC Handbook on commercial credit underwriting require that risk rating overrides be supported by documented analysis of specific borrower circumstances; override rationale generated by AI tools rather than independent credit analysis defeats the purpose of the independent AI risk rating recommendation and constitutes a credit risk governance failure that masks actual portfolio credit quality deterioration.`,
    keywords: ['ai-risk-rating', 'grade-inflation', 'OCC-examination', 'override-controls', 'credit-governance'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },
  {
    code: 'B1257',
    name: 'LLM Credit Policy Exception Memos Understating Risk Deviation Severity',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's credit origination team uses an LLM to draft credit policy exception memos when proposed transactions deviate from underwriting policy, and an internal audit review finds that LLM-generated exception memos systematically use softer language to characterize policy deviations — describing "covenant lite structures" rather than "absence of financial covenants," and "elevated but manageable leverage" rather than "leverage exceeding policy maximum" — causing credit committee reviewers to underestimate deviation severity when approving exceptions. OCC commercial lending examination standards require that policy exception documentation accurately describe the nature and magnitude of the deviation from policy, the compensating factors, and the residual risk accepted by the approving authority; LLM-generated exception memos that minimize the apparent severity of policy deviations undermine the credit committee's ability to apply appropriate scrutiny to exception approvals and create a documentation record that understates the policy deviation history of the approved credit.`,
    keywords: ['llm-policy-exceptions', 'credit-governance', 'OCC-examination', 'exception-documentation', 'ai-risk-communication'],
    demoRelevant: true,
    subTopic: 'ai-credit-part5',
  },

  // ── Concentration Risk Management (B1258–B1269) ───────────────────────────────

  {
    code: 'B1258',
    name: 'CRE Concentration Exceeding OCC 300% Guidance Without Board Escalation',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital's CRE portfolio has grown to 318% of total risk-based capital, exceeding the OCC/FDIC interagency CRE concentration guidance threshold of 300% without the bank having implemented the enhanced risk management practices required of institutions operating above the threshold, including a board-approved CRE concentration risk management plan, enhanced management information system reporting, and quarterly board-level concentration reviews. Interagency guidance on CRE concentrations (OCC 2006-46) specifies that institutions exceeding the 300% CRE-to-capital threshold must implement enhanced concentration risk management measures and that examiners will assess whether those measures are commensurate with the level of concentration; First Capital's current CRE concentration risk management framework was designed for a sub-300% concentration and does not include the stress testing frequency, collateral revaluation cycles, or board reporting cadence required at the bank's current concentration level.`,
    keywords: ['CRE-concentration', 'OCC-2006-46', 'concentration-thresholds', 'board-escalation', 'capital-ratios'],
    demoRelevant: true,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1259',
    name: 'Industry Concentration Reporting Aggregates Affiliated Borrowers Incorrectly',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's industry concentration reporting aggregates exposures by the borrower's primary NAICS code without identifying and consolidating related affiliates under common ownership or control, causing the bank's single-industry concentration reports to understate effective exposure to conglomerates and private equity portfolio companies that operate across multiple NAICS codes under common financial control but appear as separate borrowers in the system of record. OCC large exposure guidance and OCC examination standards for concentration risk management require that concentration calculations aggregate all exposures to related entities under common ownership or control, recognizing that affiliated companies present correlated credit risk regardless of their different operating NAICS classifications; the failure to consolidate affiliated exposures means the bank's industry concentration metrics systematically understate effective single-issuer and industry concentrations, masking risk that would trigger enhanced monitoring if correctly aggregated.`,
    keywords: ['industry-concentration', 'affiliated-borrowers', 'OCC-examination', 'NAICS-aggregation', 'related-entities'],
    demoRelevant: true,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1260',
    name: 'Geographic Concentration in Flood-Zone Markets Without Hazard Insurance Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's C&I and CRE portfolio has a 28% geographic concentration in Gulf Coast markets where 40% of collateral properties are in FEMA Special Flood Hazard Areas, but the bank's annual credit review process does not include flood insurance currency verification — checking that flood insurance policies are in force, at the required replacement cost coverage level, and not subject to lapse — leaving the bank exposed to collateral impairment on flood-zone properties without timely detection. Flood Disaster Protection Act of 1973 and OCC flood insurance examination procedures require that lenders in federally regulated or insured financial institutions maintain flood insurance on covered loans throughout the life of the loan and obtain evidence of flood insurance currency at annual review; the failure to monitor flood insurance currency in a portfolio with high Gulf Coast geographic concentration creates systematic collateral risk that is not visible to the bank's credit monitoring function until a flood event triggers claims.`,
    keywords: ['geographic-concentration', 'flood-insurance', 'FEMA-SFHA', 'OCC-flood-examination', 'collateral-monitoring'],
    demoRelevant: false,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1261',
    name: 'Single-Borrower Large Loan Concentration Limit Not Enforced at Commitment Stage',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's credit policy establishes a single-borrower lending limit of 15% of Tier 1 capital, but the limit monitoring system calculates exposure based on outstanding loan balances rather than total commitments — excluding undrawn revolving credit facilities and unfunded term loan commitments — causing the bank to approve transactions that bring total committed exposure above the policy limit while the outstanding balance calculation remains within limits. OCC guidance on legal lending limits (12 CFR Part 32) and OCC concentration risk management standards require that single-borrower limits be calculated on a total-commitment basis, not merely on outstanding balances, because the bank is legally obligated to fund drawn amounts up to the commitment regardless of current outstanding levels; the commitment-versus-outstanding measurement gap has resulted in four borrowers with total committed exposure between 16–19% of Tier 1 capital that the system shows as within the 15% policy limit.`,
    keywords: ['single-borrower-limit', 'lending-limits', 'OCC-12-CFR-32', 'commitment-exposure', 'concentration-policy'],
    demoRelevant: true,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1262',
    name: 'Leveraged Loan Concentration Dashboard Excludes Indirect Exposures Through CLO Holdings',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's leveraged lending concentration dashboard reports direct leveraged loan portfolio exposure but does not include the bank's indirect leveraged credit exposure through its CLO tranche holdings and high-yield bond portfolio, understating the bank's total leveraged credit market exposure by an estimated $94M and preventing the risk committee from accurately assessing the bank's aggregate sensitivity to a leveraged credit market stress event. OCC leveraged lending guidance (OCC 2013-9) and interagency guidance on leveraged lending require that institutions assess leveraged credit concentration on a total exposure basis, including direct loans, purchased participations, and indirect exposure through structured credit vehicles; the dashboard gap means the bank's ALCO and board risk committee receive leveraged lending concentration reports that systematically understate aggregate leveraged credit exposure, making accurate portfolio risk limit compliance monitoring impossible.`,
    keywords: ['leveraged-lending', 'CLO-exposure', 'OCC-2013-9', 'indirect-exposure', 'concentration-dashboard'],
    demoRelevant: false,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1263',
    name: 'Sponsor-Backed Loan Concentration Aggregated by Borrower Not by PE Sponsor',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's concentration reporting system aggregates sponsor-backed commercial loans by the individual borrower entity name without consolidating exposures across all portfolio companies owned by the same private equity sponsor, causing the bank's sponsor concentration metrics to be invisible to the risk management function — a situation where the bank has $180M of aggregate credit exposure to companies owned by three PE sponsors but reports each borrower individually with no sponsor-level concentration flag. OCC examination guidance on concentration risk and agency leveraged lending guidance both require that institutions with material sponsor-backed loan exposure monitor credit concentration at the sponsor level, recognizing that PE portfolio companies under common ownership present correlated credit risk from sponsor financial distress, covenant reset patterns, and dividend recapitalization decisions that affect multiple portfolio companies simultaneously.`,
    keywords: ['PE-sponsor-concentration', 'leveraged-lending', 'OCC-examination', 'related-entity-aggregation', 'concentration-reporting'],
    demoRelevant: true,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1264',
    name: 'Shared National Credit Participation Concentration Not Reported to Board',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital holds $156M of purchased Shared National Credit participations across 22 agent-bank facilities, representing 11% of total commercial loans outstanding, but the bank's board credit reports present SNC participation exposure as part of the general commercial loan portfolio without identifying it as a discrete concentration category with its own concentration risk characteristics — specifically, that SNC participants have limited ability to exit positions, participate in restructuring negotiations, or obtain borrower-specific monitoring data independently from the agent bank. OCC SNC examination guidance and OCC Bulletin 2001-48 require that participating banks maintain concentration risk awareness of their SNC portfolio as a distinct category, including assessment of agent bank concentration (reliance on a single agent bank for multiple facilities) and sector concentration within the SNC book; the absence of SNC-specific concentration reporting prevents the board from assessing the concentration, liquidity, and governance risks unique to this exposure category.`,
    keywords: ['SNC-concentration', 'OCC-2001-48', 'shared-national-credit', 'participation-governance', 'board-reporting'],
    demoRelevant: false,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1265',
    name: 'Criticized Asset Concentration Exceeding 30% of Capital — No Formal Remediation Plan',
    officeCategory: 'middle_office',
    failureRatePct: 81,
    description:
      `First Capital's criticized and classified asset ratio has reached 34% of Tier 1 capital plus allowance (the Texas Ratio variant), exceeding the OCC supervisory trigger level without the bank having developed a formal criticized asset reduction plan, board-approved targets for criticized asset reduction, or a documented strategy for disposition, upgrade, or charge-off of the criticized portfolio within a defined timeframe. OCC Handbook on problem bank supervision and OCC examination standards for asset quality require that institutions with elevated criticized asset concentrations develop documented reduction plans with measurable milestones and board-approved targets; the absence of a formal remediation plan at a 34% criticized asset ratio means the bank is operating without an OCC-acceptable response to its asset quality deterioration, which OCC examiners treat as a governance deficiency requiring a formal corrective action commitment.`,
    keywords: ['criticized-assets', 'Texas-ratio', 'OCC-examination', 'asset-quality', 'remediation-plan'],
    demoRelevant: true,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1266',
    name: 'Correspondent Banking Concentration in Single Upstream Clearing Bank',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital routes 94% of its wire transfer, ACH, and Fed funds transaction volume through a single correspondent banking relationship with one upstream clearing bank, creating an operational and credit concentration where a disruption to the correspondent relationship — including the upstream bank's failure, loss of correspondent banking services, or a liquidity event — would immediately impair First Capital's payment processing capability with no fallback clearing arrangement in place. OCC operational risk guidance and OCC Bulletin 2023-17 on third-party risk management require that institutions identify and manage critical single-point-of-failure dependencies in their operational infrastructure; a correspondent banking concentration that processes 94% of clearing volume through a single relationship represents a critical operational concentration risk that should be addressed through either a secondary correspondent arrangement or a documented contingency plan with tested activation procedures.`,
    keywords: ['correspondent-banking', 'clearing-concentration', 'OCC-third-party-risk', 'operational-concentration', 'single-point-of-failure'],
    demoRelevant: false,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1267',
    name: 'Crypto-Exposed Borrower Concentration Not Tracked as Discrete Risk Category',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital has extended credit to 18 commercial borrowers whose primary business involves digital asset trading, crypto custody, blockchain infrastructure, or crypto-adjacent fintech services, representing $72M of aggregate exposure, but the bank's credit concentration framework does not recognize digital asset exposure as a discrete industry concentration category — these borrowers are classified under generic fintech or financial services NAICS codes and do not receive the elevated monitoring, stress testing, or board reporting that their correlated crypto market risk would warrant under OCC digital asset risk guidance. OCC guidance on digital asset activities and OCC Bulletin 2023-11 require that institutions with material credit exposure to digital asset counterparties assess the concentration, correlated risk, and novel credit risk factors specific to digital asset business models; the absence of a crypto-exposed borrower concentration category means the bank cannot identify or report its total crypto credit market exposure at a time when OCC is specifically examining this concentration in supervised institutions.`,
    keywords: ['crypto-concentration', 'digital-assets', 'OCC-2023-11', 'fintech-credit', 'correlated-risk'],
    demoRelevant: true,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1268',
    name: 'Healthcare Borrower Concentration Exposed to CMS Reimbursement Rate Risk Without Sector Stress Test',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's healthcare lending portfolio represents 19% of total commercial loans outstanding, concentrated in skilled nursing facilities, home health agencies, and rural hospital operators whose revenue streams are 70–85% dependent on Medicare and Medicaid reimbursement rates, but the bank's annual credit stress testing does not include a sector-specific scenario modeling the impact of a CMS reimbursement rate reduction or policy change on the healthcare borrower portfolio's debt service coverage capacity. OCC industry concentration guidance and OCC Handbook on commercial credit underwriting require that institutions with material healthcare sector concentrations include regulatory reimbursement risk as a stress scenario in their concentration risk analysis; CMS reimbursement policy changes in 2025 — including the 2.8% Medicare physician fee schedule cut — have already produced DSCR pressure on healthcare borrowers that a sector stress test would have surfaced as a portfolio risk.`,
    keywords: ['healthcare-concentration', 'CMS-reimbursement', 'OCC-examination', 'sector-stress-test', 'Medicare-risk'],
    demoRelevant: false,
    subTopic: 'concentration-risk-management',
  },
  {
    code: 'B1269',
    name: 'Municipal Borrower Concentration Without Pension Liability Stress Scenario',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital holds $84M of direct obligations and revenue-backed credits to municipal borrowers in three states where public pension funding ratios are below 65%, but the bank's municipal credit monitoring framework does not include a stress scenario modeling the impact of required pension contribution increases on municipal borrower debt service capacity, leaving the bank without quantified analysis of how pension funding gaps could impair the debt service coverage of municipal obligors in the portfolio. OCC commercial credit underwriting guidance and GFOA credit analysis standards for municipal lending require that credit analysis of municipal obligors assess all material off-balance-sheet obligations, including unfunded pension and OPEB liabilities; the absence of pension liability stress testing in the municipal portfolio means First Capital cannot assess whether its municipal obligors' creditworthiness is sensitive to actuarial assumption changes or required pension contribution escalations that are already mandated under state law.`,
    keywords: ['municipal-concentration', 'pension-liability', 'OCC-municipal-credit', 'off-balance-sheet', 'stress-testing'],
    demoRelevant: false,
    subTopic: 'concentration-risk-management',
  },

  // ── Credit Stress Testing (B1270–B1279) ──────────────────────────────────────

  {
    code: 'B1270',
    name: 'DFAST Credit Loss Model Using Static Loss Rate Without Vintage Analysis',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's Dodd-Frank Act stress testing credit loss model applies a single historical average loss rate to each loan segment without differentiating loss rate expectations by origination vintage, causing the model to apply 2015–2019 loss rate assumptions to 2022–2024 vintages originated under substantially different underwriting standards, credit cycle conditions, and interest rate environments, producing stress loss estimates that do not reflect the elevated risk characteristics of recent originations. OCC DFAST stress testing guidance and SR 18-8 on stress testing guidance for non-complex institutions require that credit loss models capture material differences in portfolio risk characteristics, including vintage-based risk stratification when newer origination vintages have materially different risk profiles from the historical loss data informing the model; the static loss rate approach understates the forward-looking stress loss for high-risk recent vintages and overstates losses for seasoned performing loans, producing inaccurate total loss estimates.`,
    keywords: ['DFAST', 'credit-loss-model', 'vintage-analysis', 'SR-18-8', 'OCC-stress-testing'],
    demoRelevant: true,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1271',
    name: 'Stress Test Scenario Library Missing Stagflation Scenario',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's credit stress test scenario library includes an adverse scenario based on a 2008-style deflationary recession and a baseline scenario reflecting consensus forecasts, but does not include a stagflation scenario — simultaneous elevated inflation and low economic growth — despite the 2022–2024 macroeconomic environment having demonstrated that this scenario is plausible and despite the bank's portfolio having material concentration in floating-rate C&I loans whose borrowers face margin compression under simultaneous input cost inflation and demand contraction. OCC stress testing guidance and the Basel Committee's stress testing guidance principles require that scenario libraries include a range of macroeconomic environments, including scenarios not captured by historical regression-based adverse scenarios; the absence of a stagflation scenario creates a gap in the bank's credit loss estimation that prevents the board from assessing credit portfolio resilience under an economic regime that has been historically relevant and is currently salient.`,
    keywords: ['stress-test-scenarios', 'stagflation', 'OCC-stress-testing', 'scenario-library', 'SR-18-8'],
    demoRelevant: true,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1272',
    name: 'Credit Stress Test Results Not Flowing Into CECL Allowance Qualitative Adjustments',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital conducts quarterly credit stress tests and annual DFAST exercises but the stress test outputs — scenario-based loss projections for each portfolio segment — are not formally integrated into the CECL qualitative factor framework, so the allowance calculation does not capture early warning signals identified in stress testing about emerging portfolio vulnerability, creating a disconnect between the stress testing function's forward-looking loss assessment and the allowance estimation that is reported to investors and regulators. OCC CECL examination guidance and FASB ASC 326 both require that qualitative adjustments to the CECL allowance incorporate management's expectation of future credit conditions, including insights from stress testing and scenario analysis; the failure to use stress test outputs as inputs to the CECL qualitative adjustment process means the bank's allowance calculation is less responsive to emerging credit deterioration than the institution's own stress testing capability would support.`,
    keywords: ['CECL-stress-integration', 'ASC-326', 'qualitative-factors', 'DFAST', 'OCC-CECL-guidance'],
    demoRelevant: true,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1273',
    name: 'Loan-Level Stress Test Data Quality Insufficient — Stress at Segment Not Loan Level',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's credit stress testing process calculates stressed loss estimates at the portfolio segment level rather than the individual loan level, applying average segment loss rates to all loans in the segment without capturing within-segment heterogeneity — the result is that a commercial real estate segment stress result masks the difference between well-performing suburban industrial loans and severely stressed urban office loans that happen to share the same CRE segment classification. OCC stress testing guidance for community and regional banks requires that stress test results be granular enough to identify concentrated pockets of credit risk within segments, particularly for institutions with elevated CRE concentrations; segment-level stress testing that averages over materially heterogeneous sub-segments produces stress results that underestimate tail loss for distressed sub-segments while overstating expected losses for performing ones, limiting the actionability of stress results for portfolio management.`,
    keywords: ['loan-level-stress', 'segment-heterogeneity', 'OCC-stress-testing', 'CRE-stress', 'data-granularity'],
    demoRelevant: false,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1274',
    name: 'Stress Test Governance — Results Not Presented to Full Board',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's quarterly credit stress test results are presented to the credit risk committee but not to the full board of directors, with the board receiving only a summary capital impact metric without access to the scenario narrative, portfolio segment loss projections, or concentration risk findings that informed the summary metric, limiting the board's ability to exercise informed oversight of credit risk in the context of capital adequacy. OCC DFAST guidance and OCC supervisory expectations for board oversight of stress testing require that the full board of directors receive sufficient detail about stress test scenarios, methodology, and results to fulfill their oversight responsibility for risk management; providing the board only with a summary capital impact number without the supporting analysis defeats the purpose of board-level stress test governance and constitutes a board oversight deficiency that OCC examiners identify as a corporate governance finding.`,
    keywords: ['stress-test-governance', 'board-oversight', 'DFAST', 'OCC-examination', 'risk-committee'],
    demoRelevant: true,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1275',
    name: 'Rate Sensitivity Stress Test Excludes Prepayment Behavior Impact on Net Interest Margin',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's interest rate stress testing quantifies credit loss impact of rate scenarios but does not model the interaction between rate changes and borrower prepayment behavior — specifically, how rising rate scenarios reduce refinancing prepayments on fixed-rate loans, extending the effective duration of the portfolio, and how falling rate scenarios trigger prepayment spikes that compress net interest income — causing the bank's stress testing to understate net interest margin volatility in rate stress scenarios. OCC interest rate risk examination guidance (OCC 2010-1) and the interagency advisory on interest rate risk require that rate stress testing capture both credit and income dimension impacts, including prepayment modeling that reflects expected borrower behavior under each rate scenario; the absence of prepayment behavior modeling in rate stress scenarios produces incomplete assessments of the bank's net interest margin resilience under the interest rate scenarios included in the stress test.`,
    keywords: ['rate-stress-testing', 'prepayment-behavior', 'OCC-2010-1', 'net-interest-margin', 'duration-risk'],
    demoRelevant: false,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1276',
    name: 'Stress Test Capital Projections Use Optimistic Pre-Stress Income Baseline',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's DFAST capital projection model applies stressed credit losses to a pre-stress income baseline that uses management's optimistic budget projections rather than the stressed revenue projections that would be expected under the adverse macroeconomic scenario, causing the post-stress capital ratio to overstate actual capital resilience by incorporating revenue assumptions incompatible with the stress scenario — in a recession scenario, fee income and new loan origination revenue would be significantly lower than budget. OCC DFAST guidance and the Board of Governors' supervisory scenarios guidance require that capital projections under stress scenarios reflect internally consistent income, expense, and credit loss assumptions for the stress scenario, not a mix of stressed credit losses and unstressed income projections; the baseline income optimism bias in First Capital's stress test capital projections has caused the bank to overstate its adverse scenario Tier 1 capital ratio by an estimated 40–60 basis points.`,
    keywords: ['DFAST-capital-projection', 'income-baseline', 'OCC-DFAST', 'capital-adequacy', 'scenario-consistency'],
    demoRelevant: true,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1277',
    name: 'Credit Stress Test Model Documentation Insufficient for Examiner Review',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's credit stress testing model documentation does not include a complete methodology description, variable selection rationale, historical calibration data sources, model limitation disclosures, or a record of prior validation findings and their resolution — the documentation package consists only of a model output template and a high-level one-page methodology summary that is insufficient for an independent reviewer to understand, replicate, or evaluate the model. SR 11-7 model risk management guidance requires that model documentation be sufficiently detailed to allow an independent reviewer to understand the model's purpose, inputs, methodology, outputs, and limitations without assistance from the model developer; OCC model risk examiners reviewing credit stress test documentation against the SR 11-7 standard identify documentation deficiency as a recurring MRA-level finding that requires remediation before the model can be considered fully compliant with the bank's model risk management policy.`,
    keywords: ['stress-test-documentation', 'SR-11-7', 'model-documentation', 'OCC-model-risk', 'examiner-review'],
    demoRelevant: false,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1278',
    name: 'Reverse Stress Test Not Conducted — Capital Breach Threshold Unknown',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital has never conducted a reverse stress test — working backward from a capital breach threshold to identify the combination of credit losses and income reductions that would exhaust the bank's capital buffer — so the bank's board and management cannot articulate the specific macroeconomic or credit event sequences that would threaten the institution's capital adequacy, which limits the board's ability to assess whether current capital levels are sufficient relative to the risk profile of the portfolio. OCC stress testing guidance and the Basel Committee's stress testing principles both recommend that institutions conduct reverse stress tests to identify the scenarios that would cause business failure, as reverse stress testing provides the most direct assessment of a bank's capital resilience boundary; for a bank with a CRE concentration above 300% of capital, the inability to articulate the credit loss magnitude that would breach minimum capital ratios represents a material gap in credit risk governance.`,
    keywords: ['reverse-stress-test', 'capital-adequacy', 'OCC-stress-testing', 'Basel-principles', 'capital-resilience'],
    demoRelevant: true,
    subTopic: 'credit-stress-testing',
  },
  {
    code: 'B1279',
    name: 'Stress Test Frequency Insufficient — Annual Only for $12B Asset Community Bank',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital, with $12B in total assets and significant CRE and leveraged lending concentrations, conducts formal credit stress testing only annually despite OCC guidance indicating that institutions with elevated credit risk concentrations should conduct stress testing more frequently — at a minimum semi-annually — to ensure that stress test outputs remain current relative to the rapidly changing economic environment and portfolio composition. OCC stress testing guidance for non-complex institutions and OCC supervisory expectations for institutions with concentration risks above threshold levels both indicate that the appropriate stress testing frequency is determined by the institution's risk profile, not solely by its asset size; a $12B bank with CRE concentration above 300% of capital and elevated leveraged lending exposure should conduct stress tests at least semi-annually, and the annual-only frequency means the bank's stress test results are typically 9–12 months stale when presented to the risk committee.`,
    keywords: ['stress-test-frequency', 'OCC-guidance', 'CRE-concentration', 'community-bank', 'supervisory-expectations'],
    demoRelevant: false,
    subTopic: 'credit-stress-testing',
  },

  // ── Loan Review Independent (B1280–B1289) ────────────────────────────────────

  {
    code: 'B1280',
    name: 'Independent Loan Review Program Not Staffed With Credit-Qualified Reviewers',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's independent loan review program is staffed with two reviewers who have backgrounds in loan documentation and compliance but lack the commercial credit underwriting experience — specifically, the ability to independently assess borrower financial performance, industry dynamics, and collateral value — required to form independent risk rating judgments on complex C&I and CRE credits, resulting in a loan review program that verifies documentation completeness but cannot independently challenge relationship manager risk ratings on substantive credit judgment grounds. OCC Handbook on loan review systems and OCC examination standards for loan review require that independent loan reviewers possess sufficient credit expertise to independently evaluate the risk rating accuracy of reviewed credits, including the ability to assess financial statement trends, industry risk factors, and collateral valuation; a loan review program that can verify documentation but cannot independently challenge risk grades does not provide the independent credit quality oversight that OCC expects and that the board relies on for its credit risk governance function.`,
    keywords: ['loan-review-staffing', 'OCC-loan-review', 'credit-expertise', 'independent-review', 'risk-rating-challenge'],
    demoRelevant: true,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1281',
    name: 'Criticized Asset Identification Delayed 6+ Months Behind Financial Statement Receipt',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's annual review process for commercial loans requires receipt of borrower financial statements before the annual review can be initiated, and the bank's 90-day financial statement receipt grace period — combined with a 60-day annual review completion timeline — means that a borrower who submits financial statements showing covenant breach does not receive a risk rating downgrade action until 5–8 months after the financial covenant was first breached, during which time the loan continues to be reported at its prior risk rating. OCC examination standards for credit risk monitoring require that risk ratings be updated promptly when information becomes available indicating a change in credit quality, including when covenant breach indicators become apparent from interim financial information, industry news, or payment behavior data available before annual financial statements are received; the 5–8 month lag between financial covenant deterioration and risk rating action is a systemic delayed recognition pattern that OCC examiners identify as a criticized asset identification deficiency.`,
    keywords: ['criticized-asset-identification', 'risk-rating-timeliness', 'OCC-examination', 'annual-review', 'covenant-breach'],
    demoRelevant: true,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1282',
    name: 'Loan Grading Inconsistency Between Business Lines — Same Borrower Rated Differently',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital has identified three borrowers whose commercial loans originated in different business lines — community banking, commercial banking, and corporate banking — carry different risk ratings on the same obligor, with the same borrower's revolving line of credit rated "Pass" in community banking while the same entity's term loan in commercial banking is rated "Special Mention," creating an inconsistent risk rating record that would be identified as a grading integrity failure in an OCC examination. OCC examination standards for credit risk rating systems require that all exposures to the same borrower entity carry consistent risk ratings regardless of the originating business line, and that risk rating discrepancies be identified and resolved through the loan review or credit risk oversight function; risk rating inconsistencies across business lines indicate that the bank's risk rating system lacks the cross-business-line reconciliation controls necessary to ensure a unified view of borrower credit quality.`,
    keywords: ['loan-grading-inconsistency', 'risk-rating-system', 'OCC-examination', 'cross-business-line', 'obligor-risk'],
    demoRelevant: true,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1283',
    name: 'Independent Loan Review Sample Coverage Below 60% of High-Risk Segments',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's independent loan review program reviews approximately 40% of the criticized and classified commercial loan portfolio and 25% of the special mention portfolio in each annual cycle, with coverage concentrated in the largest individual credits and limited coverage of middle-market credits between $2M and $10M — the segment where OCC examiners have historically found the highest rate of misclassified assets in community and regional banks of First Capital's size. OCC Handbook on loan review systems establishes that the adequacy of loan review coverage is assessed by whether the sample is sufficient to draw valid conclusions about the population, particularly in high-risk segments; a 40% coverage rate of the criticized portfolio and 25% coverage of special mention credits does not provide sufficient sample coverage to support reliable conclusions about the risk rating accuracy of those segments, and examiners will supplement internal loan review findings with their own credit file review to compensate for the coverage gap.`,
    keywords: ['loan-review-coverage', 'OCC-loan-review', 'criticized-assets', 'sample-adequacy', 'special-mention'],
    demoRelevant: false,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1284',
    name: 'Loan Review Findings Tracked in Spreadsheet — No Remediation Workflow Integration',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's independent loan review function documents findings in a standalone Excel spreadsheet that is distributed to business line managers by email, but there is no integration between the loan review findings and the bank's loan administrative system, credit risk management workflow, or management reporting, meaning that risk rating upgrade and downgrade actions recommended by loan review are tracked manually and have no automated escalation or completion verification mechanism. OCC Handbook on loan review systems requires that loan review findings be tracked to resolution and that management's response to loan review recommendations be documented and monitored by an appropriate governance function; a spreadsheet-based finding tracking system with email distribution and manual follow-up provides no assurance that recommended risk rating actions are implemented within the timeframe required by the bank's loan review policy, and historical compliance tracking shows 23% of recommended rating actions from the prior year's review remain unimplemented.`,
    keywords: ['loan-review-tracking', 'OCC-loan-review', 'finding-remediation', 'workflow-integration', 'governance'],
    demoRelevant: false,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1285',
    name: 'Purchased Loan Portfolios Excluded From Independent Loan Review Scope',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital has acquired three community bank loan portfolios through FDIC-assisted acquisitions and whole bank transactions over the past four years, totaling $340M in acquired loans, but the independent loan review program's annual scope excludes these acquired portfolios on the basis that they were reviewed at acquisition — despite the acquired loans now being four years into their post-acquisition performance cycle without an independent review of whether the acquired loan grades remain appropriate for current borrower financial conditions. OCC guidance on acquired loan portfolios and OCC examination standards for credit risk management require that acquired loan portfolios be incorporated into the acquiring institution's standard credit monitoring and loan review framework within a reasonable integration period; acquired portfolios that are permanently excluded from independent loan review create a blind spot in the bank's credit quality oversight that becomes increasingly significant as post-acquisition performance diverges from the credit condition assessed at acquisition.`,
    keywords: ['acquired-loan-portfolios', 'loan-review-scope', 'OCC-examination', 'FDIC-acquisition', 'credit-monitoring'],
    demoRelevant: false,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1286',
    name: 'Loan Review Independence Compromised — Reviewer Reports to Chief Lending Officer',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital's independent loan review function reports organizationally to the Chief Lending Officer rather than to the Chief Risk Officer or directly to the board audit committee, creating an independence impairment where the function responsible for independently assessing the credit quality of loans originated by the lending organization reports to the head of that same organization — a structural conflict that OCC examiners consistently identify as a loan review independence deficiency. OCC Handbook on loan review systems and OCC examination standards for credit risk governance require that the independent loan review function be organizationally positioned to ensure independence from the line lending function, typically reporting to the chief risk officer, audit committee, or board; the reporting line through the Chief Lending Officer creates an actual or apparent conflict of interest that undermines the independence of credit quality assessments and may cause reviewers to exercise less rigorous challenge of business line risk ratings to avoid organizational conflict.`,
    keywords: ['loan-review-independence', 'OCC-loan-review', 'organizational-structure', 'reporting-line', 'credit-governance'],
    demoRelevant: true,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1287',
    name: 'Classified Asset List Accuracy Not Verified Between Examinations',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's classified asset management function maintains the criticized and classified asset list between OCC examination cycles but does not conduct a formal self-assessment of classified asset list accuracy — comparing the list against the total loan portfolio to identify loans that should be on the list but are not — relying instead on individual relationship manager and credit officer judgment to flag loans for addition to the classified list. OCC examination standards for asset quality require that institutions maintain an accurate and current criticized and classified asset list as a foundation for allowance estimation, credit risk reporting, and special assets management; without a formal classified asset list accuracy verification process between examinations, First Capital's classified list accuracy depends entirely on the self-reporting diligence of relationship managers who have economic incentives to avoid downgrading their own relationships, creating a systematic understating risk in the classified list.`,
    keywords: ['classified-asset-list', 'OCC-examination', 'asset-quality', 'self-assessment', 'criticized-assets'],
    demoRelevant: false,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1288',
    name: 'Loan Review Not Assessing Credit File Completeness for Regulatory Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's independent loan review program focuses exclusively on risk rating accuracy and does not include a systematic assessment of credit file documentation completeness — specifically, whether credit files contain all required borrower financial statement updates, environmental reports, appraisal currency documentation, flood insurance evidence, and covenant compliance certifications required by OCC examination standards. OCC Handbook on loan review systems indicates that loan review should assess credit administration quality, including the adequacy of credit file documentation; a loan review program that assesses risk ratings without assessing the documentation supporting those ratings cannot identify cases where risk ratings appear appropriate but are based on stale or incomplete credit information, which is a common form of credit administration deficiency in community and regional bank examinations.`,
    keywords: ['loan-review-documentation', 'credit-file-completeness', 'OCC-examination', 'credit-administration', 'documentation-quality'],
    demoRelevant: false,
    subTopic: 'loan-review-independent',
  },
  {
    code: 'B1289',
    name: 'Loan Review Report Delivery Delayed 90+ Days After Review Completion',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's independent loan review report for the annual portfolio review cycle is delivered to the board audit committee 95–120 days after the review completion date, with the delay attributable to review, revision, and response cycles with business line management that allow individual finding challenges to extend the overall report finalization timeline indefinitely. OCC examination standards for loan review and OCC corporate governance guidance require that loan review results be reported promptly to the board audit committee and senior management, recognizing that delayed reporting reduces the actionability of findings and allows the credit conditions identified in the review to change materially before the board receives the assessment; a 95–120 day delivery lag on a loan review report means the board is receiving a credit quality assessment that is three to four months stale by the time it reaches the audit committee.`,
    keywords: ['loan-review-reporting', 'board-audit-committee', 'OCC-examination', 'report-timeliness', 'governance'],
    demoRelevant: false,
    subTopic: 'loan-review-independent',
  },

  // ── Credit Risk Data Quality (B1290–B1299) ────────────────────────────────────

  {
    code: 'B1290',
    name: 'Credit Risk Data Mart Lacking Authoritative Source Reconciliation',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      `First Capital's credit risk data mart — which feeds CECL calculations, regulatory capital reports, and board credit dashboards — aggregates loan data from three core banking system modules without a formal reconciliation process verifying that data mart totals agree with authoritative source system balances, and the risk team has identified recurring discrepancies of $8–15M between data mart outstanding balances and the general ledger loan balance for the same reporting period. OCC data governance guidance and BCBS 239 principles for effective risk data aggregation and reporting require that risk data used in regulatory reporting and risk management decision-making be reconciled to authoritative source systems at each reporting cycle; unreconciled credit risk data mart discrepancies mean that CECL allowance calculations, capital ratio computations, and board credit reports may be based on loan portfolio data that does not match the bank's own general ledger.`,
    keywords: ['credit-data-mart', 'data-reconciliation', 'BCBS-239', 'OCC-data-governance', 'CECL-data-quality'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1291',
    name: 'Risk Rating Data Lineage Undocumented — Examiner Cannot Trace Rating to Source',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's loan administration system stores the current risk rating for each commercial credit without maintaining a complete audit trail linking the current rating to the specific credit approval action, loan review recommendation, or management override decision that established it, making it impossible for OCC examiners to independently trace a current risk rating back to the documented credit event that justified the current grade assignment. OCC examination standards for credit risk rating systems require that each risk rating in the system be traceable to the credit decision or review event that established or confirmed the rating, with a complete history of prior ratings and the basis for each change; the absence of rating data lineage in the loan administration system means the bank cannot demonstrate to OCC examiners the governance and credit analysis basis for current risk ratings across the commercial portfolio, which examiners treat as a credit risk data integrity deficiency.`,
    keywords: ['risk-rating-lineage', 'data-audit-trail', 'OCC-examination', 'credit-governance', 'BCBS-239'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1292',
    name: 'Borrower Financial Statement Currency Tracking Not Automated — Stale Data Undetected',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's credit administration function relies on relationship managers to manually track when borrower financial statements are due and follow up on overdue submissions, but there is no automated system flag or credit administration alert when a borrower's financial statements in the credit file exceed the bank's 90-day financial statement currency standard, allowing stale financial data to persist in credit files without triggering an administrative exception that would alert the credit oversight function. OCC commercial credit underwriting and credit administration guidance require that credit files contain current borrower financial information and that administrative exceptions for overdue financial statements be tracked and escalated through the bank's exception management process; the absence of automated financial statement currency monitoring means the bank cannot identify the subset of commercial borrowers whose credit decisions are being made on financial data that has exceeded the bank's own currency standard.`,
    keywords: ['financial-statement-currency', 'credit-administration', 'OCC-examination', 'exception-tracking', 'data-staleness'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1293',
    name: 'NAICS Code Assignment Inconsistent — Industry Concentration Reports Unreliable',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's loan administration system allows relationship managers to self-select NAICS codes during loan origination without a validation step verifying that the assigned NAICS code matches the borrower's actual primary business activity, resulting in a material rate of NAICS misclassification — particularly in technology, healthcare, and professional services — that causes the bank's industry concentration reports to misstate sector exposures by allocating loans to incorrect industry categories. OCC examination standards for credit risk data quality and HMDA/CRA data integrity requirements both depend on accurate industry classification; a loan administration system that permits self-selected NAICS codes without validation produces concentration reports that cannot be relied upon for regulatory reporting, concentration limit compliance monitoring, or industry stress scenario design, because the borrower population assigned to each NAICS code does not accurately represent the bank's actual sector exposure.`,
    keywords: ['NAICS-code-accuracy', 'industry-classification', 'OCC-data-quality', 'concentration-reporting', 'loan-administration'],
    demoRelevant: false,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1294',
    name: 'Covenant Compliance Tracking Database Missing 40% of Monitored Covenants',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's commercial loan covenant tracking system contains covenant definitions and compliance status for approximately 60% of the financial covenants in the active commercial loan portfolio, with the remaining 40% — primarily covenants on loans originated before 2019 — not entered into the tracking system, causing the covenant monitoring function to rely on relationship manager discretion for the older loan cohort rather than systematic automated tracking. OCC examination standards for credit risk monitoring require that commercial loans with financial covenants have those covenants monitored systematically, with compliance certifications received and tested on the schedule specified in the loan agreement; a covenant tracking database that covers only 60% of monitored covenants cannot produce a reliable picture of portfolio-wide covenant compliance, and the 40% gap in tracking coverage creates a monitoring blind spot that allows covenant breaches in the older loan cohort to go undetected until relationship managers elect to escalate them.`,
    keywords: ['covenant-tracking', 'OCC-examination', 'credit-monitoring', 'data-completeness', 'commercial-lending'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1295',
    name: 'Loan Participation Data Not Consolidated Into Obligor-Level Exposure Reports',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's loan administration system stores purchased loan participations in a separate module from directly originated loans, and the bank's obligor-level exposure reporting does not join participation balances with direct loan balances at the obligor level — resulting in exposure reports that show a borrower's direct loan balance without including the bank's participation exposure to the same obligor through a different transaction, causing obligor-level exposure concentration to be systematically understated in risk reports. OCC large exposure guidance and OCC examination standards for concentration risk management require that all exposures to the same obligor be aggregated at the obligor level regardless of the transaction type or system of record in which they are maintained; the failure to consolidate participation and direct loan exposures at the obligor level means First Capital's single-obligor concentration monitoring is incomplete, and the bank may be unaware of obligors whose total exposure exceeds policy limits when participation and direct exposure are combined.`,
    keywords: ['participation-data', 'obligor-exposure', 'OCC-examination', 'data-consolidation', 'single-borrower-limit'],
    demoRelevant: false,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1296',
    name: 'Delinquency Data Feed From Servicer Not Validated Against Internal Payment Records',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital services a $210M consumer mortgage portfolio through a third-party servicer, receiving monthly delinquency reports used to update loan risk ratings and CECL loss estimates, but the bank does not validate servicer delinquency reports against its own payment records to verify reporting accuracy — accepting the servicer's delinquency classifications without an independent data validation that would identify misclassification of delinquent loans as current or late payment recognition delays. OCC third-party risk management guidance and OCC examination standards for servicer oversight require that institutions that rely on servicer-reported loan performance data for risk management and regulatory reporting have controls to validate the accuracy and completeness of servicer data; unvalidated servicer delinquency data creates a dependency where the accuracy of the bank's CECL allowance, credit risk reports, and regulatory delinquency disclosures is entirely dependent on the servicer's reporting accuracy without any bank-side validation.`,
    keywords: ['servicer-data-validation', 'OCC-third-party-risk', 'delinquency-reporting', 'CECL-data', 'mortgage-servicing'],
    demoRelevant: false,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1297',
    name: 'Charged-Off Loan Data Not Excluded From CECL Historical Loss Rate Calculation',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's CECL historical loss rate calculation includes charged-off loans in the denominator of the loss rate computation without removing them — treating charged-off balances as part of the surviving loan population rather than removing them from the denominator on the charge-off date — causing the calculated historical loss rate to be systematically understated because the denominator grows with charged-off balances while the numerator counts the same charge-offs as losses, producing a loss rate denominator that is too large. FASB ASC 326 and OCC CECL guidance require that historical loss rate calculations be computed on a methodology that accurately represents the probability of loss for the surviving loan population; including charged-off balances in the denominator is a data construction error that biases the historical loss rate downward, causing the CECL allowance to be understated relative to the portfolio's actual historical loss experience.`,
    keywords: ['CECL-historical-loss', 'charge-off-data', 'ASC-326', 'OCC-CECL-guidance', 'loss-rate-calculation'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1298',
    name: 'Credit Risk Dashboard Data Latency — Ratings Updated Monthly Not Daily',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's board-facing credit risk dashboard displays risk rating distributions, criticized asset totals, and delinquency rates using monthly-refreshed data that is updated only on the last business day of each month, meaning that intra-month risk rating downgrades, newly identified special mention credits, and emerging delinquency trends are invisible to senior management and board members reviewing the dashboard between monthly refresh cycles. OCC governance guidance and OCC examination standards for management information systems require that board and management credit risk reporting be sufficiently timely to support decision-making; a credit risk dashboard with monthly-only data refresh cannot serve as an effective early warning system because material credit events that occur mid-month — including a major borrower covenant breach, unexpected payment default, or risk rating downgrade — are not visible to board and senior management for up to 30 days after the event occurs.`,
    keywords: ['credit-dashboard-latency', 'OCC-MIS', 'risk-reporting-timeliness', 'board-reporting', 'data-refresh'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },
  {
    code: 'B1299',
    name: 'Collateral Data in Loan System Lacking Appraisal Date — LTV Calculations Rely on Stale Values',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital's loan administration system stores collateral property values for CRE and C&I secured loans without capturing the appraisal date or appraiser identity associated with each collateral value, making it impossible to systematically identify collateral records where the property value is based on appraisals older than OCC's recommended refresh cycle — the bank's LTV ratios in credit reports may reflect 2019 or 2020 appraisals on properties whose current values have declined materially without any flag in the reporting system. OCC appraisal guidance and OCC examination standards for collateral data integrity require that collateral records include the appraisal date so that portfolio-wide LTV analysis can identify stale collateral valuations that require refresh; the absence of appraisal date tracking means the bank's LTV distribution reports are produced without any basis for assessing whether the collateral values underlying them are current, causing both CECL loss given default estimates and board collateral coverage reports to be potentially based on valuations that no longer reflect market conditions.`,
    keywords: ['collateral-data', 'appraisal-date', 'LTV-accuracy', 'OCC-appraisal', 'credit-data-quality'],
    demoRelevant: true,
    subTopic: 'credit-risk-data-quality',
  },

];
