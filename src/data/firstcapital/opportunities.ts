interface FinancialModel {
  annualSavingsUSD: number
  implementationCostUSD: number
  roiMultiple: number
  paybackMonths: number
  netPresentValue3YearUSD: number
  confidenceLevel: "High" | "Medium" | "Low"
}

interface Opportunity {
  id: string
  name: string
  category: string
  wave: 1 | 2 | 3
  urgency: "Critical" | "High" | "Medium"
  timeToValueMonths: number
  aiReadinessPct: number
  financialModel: FinancialModel
  problemStatement: string
  solution: string
  dataRequirements: string[]
  vendors: string[]
  occMRAImpact?: string
  prerequisites: string[]
  risks: string[]
  quickWins: string[]
}

interface WaveFinancials {
  waveName: string
  months: string
  totalInvestmentUSD: number
  totalAnnualSavingsUSD: number
  roiMultiple: number
  paybackMonths: number
  initiatives: string[]
  prerequisite: string
}

export const firstCapitalOpportunities: {
  summary: {
    totalOpportunities: number
    totalAnnualSavingsUSD: number
    totalImplementationCostUSD: number
    blendedROI: number
    overallPaybackMonths: number
  }
  opportunities: Opportunity[]
  waveFinancials: WaveFinancials[]
  strategicNarrative: string[]
} = {
  summary: {
    totalOpportunities: 8,
    totalAnnualSavingsUSD: 28900000,
    totalImplementationCostUSD: 16200000,
    blendedROI: 1.78,
    overallPaybackMonths: 11,
  },
  opportunities: [
    {
      id: "opp-001",
      name: "Fraud Detection AI — Real-Time ML Scoring",
      category: "Fraud Prevention",
      wave: 1,
      urgency: "High",
      timeToValueMonths: 6,
      aiReadinessPct: 78,
      financialModel: {
        annualSavingsUSD: 4200000,
        implementationCostUSD: 1800000,
        roiMultiple: 2.3,
        paybackMonths: 6,
        netPresentValue3YearUSD: 9800000,
        confidenceLevel: "High",
      },
      problemStatement: "Total annual fraud losses are $7M vs $3.2M peer benchmark — $3.8M annual excess. Card fraud alone accounts for $4.2M vs $2.1M benchmark. Current FICO Falcon system is rules-based with 34% false positive rate and 15-minute decisioning delay. FIS HORIZON batch architecture prevents real-time transaction scoring.",
      solution: "Deploy ML-based fraud scoring layer (FICO Falcon ML or Featurespace ARIC) via FedNow API middleware. Real-time transaction scoring replaces 15-minute delayed rules engine. ML models reduce false positive rate from 34% to under 15%. Estimated $4.2M annual savings from combined card and Zelle fraud reduction.",
      dataRequirements: [
        "24 months of transaction history — available in SQL Server DW",
        "Merchant category codes and transaction geolocation — available in FIS HORIZON",
        "Device fingerprint and behavioral biometrics — requires Q2 SDK integration",
        "Real-time transaction stream — requires FedNow API layer (prerequisite)",
      ],
      vendors: ["FICO Falcon ML", "Featurespace ARIC", "Feedzai"],
      prerequisites: ["FedNow API layer for real-time transaction stream", "Azure ML platform for model hosting and monitoring"],
      risks: [
        "Model risk governance review required before deployment — CRO gating requirement",
        "FedNow API layer is a prerequisite — timeline dependency",
        "Customer friction from increased friction during model tuning period",
      ],
      quickWins: [
        "Deploy Featurespace on card transactions only — no FedNow dependency for card data",
        "Immediate $2.1M savings from card fraud improvement — 6-month payback standalone",
      ],
    },
    {
      id: "opp-002",
      name: "FedNow Implementation with AI Payment Routing",
      category: "Payments Infrastructure",
      wave: 1,
      urgency: "Critical",
      timeToValueMonths: 9,
      aiReadinessPct: 65,
      financialModel: {
        annualSavingsUSD: 6800000,
        implementationCostUSD: 3200000,
        roiMultiple: 2.1,
        paybackMonths: 7,
        netPresentValue3YearUSD: 14400000,
        confidenceLevel: "High",
      },
      problemStatement: "$340M in commercial deposits at documented attrition risk. 23 commercial clients have verbally indicated intent to move operating accounts if FedNow is not deployed. 3 clients have already moved partial balances. 68% of peer banks are live on FedNow. First Capital is losing commercial banking relationships in real time. Additionally, 2 of 3 open OCC MRAs can be closed as a direct outcome of FedNow deployment with proper controls documentation.",
      solution: "Deploy FedNow via Finzly payment hub middleware. Finzly provides API layer over FIS HORIZON, enabling real-time payments without core banking replacement. AI-powered payment routing optimizes payment channel selection (FedNow vs ACH vs wire) for cost and speed. Target: deployed within 90 days of contract signing. FedNow deployment resolves OCC MRA-1 (real-time payment controls) and MRA-3 (transaction monitoring for real-time payments) as documented side effects.",
      dataRequirements: [
        "Commercial client payment history — available in FIS HORIZON",
        "Payment routing rules and thresholds — configurable in Finzly",
        "Real-time transaction monitoring rules — required for OCC MRA resolution",
      ],
      vendors: ["Finzly (recommended)", "Jack Henry Payments", "FIS Payments Modernization", "Q2 FedNow Module"],
      occMRAImpact: "Resolves MRA-1 (real-time payment controls gaps) and MRA-3 (transaction monitoring for instant payments) — 2 of 3 open MRAs closed as direct outcome. Required documentation: control framework, monitoring procedures, incident response plan.",
      prerequisites: ["FIS HORIZON API access credentials — available from FIS", "OCC notification of FedNow go-live (required under examination agreement)"],
      risks: [
        "FedNow transaction limits ($500K per transaction) — commercial clients must be educated",
        "Real-time fraud monitoring must be in place at FedNow go-live per OCC MRA terms",
        "FIS HORIZON API reliability during peak hours — contingency plan required",
      ],
      quickWins: [
        "Day 1: Commercial client communication — 'FedNow in 90 days' stops attrition conversations immediately",
        "Day 30: Finzly sandbox testing — show clients demo environment before go-live",
        "Day 90: Commercial client go-live event — retain $340M in at-risk deposits",
      ],
    },
    {
      id: "opp-003",
      name: "Credit Underwriting AI — Commercial and Consumer",
      category: "Lending",
      wave: 2,
      urgency: "High",
      timeToValueMonths: 12,
      aiReadinessPct: 71,
      financialModel: {
        annualSavingsUSD: 3100000,
        implementationCostUSD: 2400000,
        roiMultiple: 1.3,
        paybackMonths: 11,
        netPresentValue3YearUSD: 4900000,
        confidenceLevel: "Medium",
      },
      problemStatement: "Commercial credit decision time is 18 days vs 5-day benchmark — losing middle market deals to faster competitors. Consumer loan automation rate is 42% vs 78% benchmark — manual underwriting costs $4.2M annually above benchmark. Private equity portfolio companies refuse to wait 18 days. Auto dealer POS lending is not supported — losing dealer relationships.",
      solution: "Deploy Zest AI ML underwriting on nCino for commercial lending. Consumer automation via FICO Originations ML model. Target commercial decision time: 5 days (from 18). Target consumer automation: 75% (from 42%). Commercial side alone retains estimated $2.4M in deal revenue annually from speed improvement. Consumer automation saves $1.8M in underwriter FTE cost.",
      dataRequirements: [
        "5 years of credit performance data — available but requires data quality work",
        "Borrower financial spreads from nCino — available for commercial",
        "Bureau data integration — Equifax and Experian connections required",
        "Alternative data sources for thin-file borrowers — new integration required",
      ],
      vendors: ["Zest AI (commercial)", "FICO Originations (consumer)", "Upstart Network (consumer alternative)"],
      prerequisites: [
        "nCino adoption raised to 90% — currently 68%",
        "Fair lending model validation by independent third party",
        "Model Risk Management framework established (CRO requirement)",
      ],
      risks: [
        "Fair lending compliance review adds 3-4 months to timeline",
        "Model risk governance is CRO hard requirement before deployment",
        "Commercial credit culture change — bankers resistant to automated recommendations",
      ],
      quickWins: [
        "nCino Automated Spreading module — reduces commercial spreading time 40% in 60 days",
        "FICO Originations on consumer auto-decisioning — quick win before full ML deployment",
      ],
    },
    {
      id: "opp-004",
      name: "BSA/AML Automation — NICE Actimize Upgrade",
      category: "Compliance Automation",
      wave: 1,
      urgency: "Critical",
      timeToValueMonths: 6,
      aiReadinessPct: 82,
      financialModel: {
        annualSavingsUSD: 2800000,
        implementationCostUSD: 1600000,
        roiMultiple: 1.75,
        paybackMonths: 7,
        netPresentValue3YearUSD: 5600000,
        confidenceLevel: "High",
      },
      problemStatement: "AML false positive rate is 94% vs 45% benchmark. NICE Actimize running version 8.1 vs 10.2 current — missing 2 major releases of ML detection models. Automation rate at 34% vs 72% benchmark means 6 excess AML analysts at $1.08M annual cost. OCC MRA-2 directly cites BSA/AML system deficiency. Q4 2026 examination will find same deficiency if not remediated.",
      solution: "Upgrade NICE Actimize to version 10.2. ML models in 10.2 reduce false positives from 94% to approximately 45%. Automation rate improves from 34% to 72% — eliminating 6 excess FTE and $1.08M annual cost. Network analytics module in 10.2 addresses relationship-based money laundering detection gap cited in OCC MRA-3. Total savings: $1.08M FTE + $1.72M compliance cost reduction from faster alert disposition.",
      dataRequirements: [
        "24 months of SAR filing history — available in NICE Actimize",
        "Transaction data from FIS HORIZON — batch feed currently in place",
        "Customer risk rating data — available in NICE Actimize",
        "Network relationship mapping — new data requirement for version 10.2 network analytics",
      ],
      vendors: ["NICE Actimize 10.2 (existing vendor — upgrade path)", "Verafin (alternative if NICE contract not renewed)", "ComplyAdvantage (AML component alternative)"],
      occMRAImpact: "Directly closes OCC MRA-2 (BSA/AML system deficiency). Network analytics module addresses OCC MRA-3 component. Required documentation: system upgrade evidence, false positive rate improvement, automation rate improvement, model validation report.",
      prerequisites: [
        "NICE Actimize upgrade contract executed",
        "Data migration and testing environment provisioned",
        "AML analyst retraining on new workflow and reduced alert volume",
      ],
      risks: [
        "Upgrade disrupts existing AML workflows — parallel running period required",
        "False positive reduction means analysts review different alert types — training required",
        "OCC will scrutinize model validation documentation — external validation recommended",
      ],
      quickWins: [
        "Upgrade announcement to OCC as remediation evidence — immediate MRA progress credit",
        "Quick false positive reduction visible within 30 days of 10.2 deployment",
      ],
    },
    {
      id: "opp-005",
      name: "Digital Onboarding AI — Account Opening Redesign",
      category: "Digital Banking",
      wave: 1,
      urgency: "High",
      timeToValueMonths: 9,
      aiReadinessPct: 68,
      financialModel: {
        annualSavingsUSD: 4400000,
        implementationCostUSD: 2100000,
        roiMultiple: 2.1,
        paybackMonths: 7,
        netPresentValue3YearUSD: 9600000,
        confidenceLevel: "Medium",
      },
      problemStatement: "Account opening abandonment rate is 64% vs 32% benchmark. Approximately 10,000 completed applicants fail to open annually due to abandonment. Each abandoned application represents an estimated $440 in lost lifetime deposit revenue. 18-minute average application time vs 8-minute benchmark. Socure identity verification timing out on 8% of applications. Accounts not visible in Q2 until next business day due to FIS HORIZON batch sync.",
      solution: "AI-powered application flow optimization with intelligent field pre-fill, real-time identity verification, and progressive disclosure. Reduce abandonment from 64% to 35% (CDO committed target). Average application time from 18 minutes to 8 minutes. AI-assisted identity verification reduces Socure timeout rate from 8% to under 2%. $4.4M annual savings from abandonment reduction calculated at $440 lifetime value per recovered applicant.",
      dataRequirements: [
        "Application drop-off analytics by step — available in Narmi",
        "Session recording data from Hotjar or FullStory — requires new tool deployment",
        "Socure timeout analytics — available from Socure API logs",
        "Customer lifetime value data by acquisition channel — requires SQL Server DW query",
      ],
      vendors: ["Narmi (existing — upgrade features)", "Blend Digital Onboarding", "Temenos Infinity", "Jack Henry Banno Digital"],
      prerequisites: [
        "FedNow API layer for real-time account visibility post-opening",
        "Socure contract amendment for higher SLA on identity verification",
        "FIS HORIZON real-time sync for Narmi (API layer makes this possible)",
      ],
      risks: [
        "Core driver of abandonment (batch sync) requires API layer — cannot fully solve without it",
        "CDO has committed 35% abandonment target to board — partial fix may not meet target",
        "A/B testing infrastructure needed to measure improvement rigorously",
      ],
      quickWins: [
        "Remove 3 redundant form steps in Narmi — reduces time by 4 minutes in 30 days",
        "Fix Socure timeout configuration — reduces 8% timeout rate in 2 weeks",
        "Add progress indicator to application — reduces abandonment by estimated 8-12 points",
      ],
    },
    {
      id: "opp-006",
      name: "Customer Service AI — Contact Center Automation",
      category: "Operational Efficiency",
      wave: 2,
      urgency: "Medium",
      timeToValueMonths: 6,
      aiReadinessPct: 74,
      financialModel: {
        annualSavingsUSD: 2200000,
        implementationCostUSD: 1400000,
        roiMultiple: 1.6,
        paybackMonths: 8,
        netPresentValue3YearUSD: 4300000,
        confidenceLevel: "Medium",
      },
      problemStatement: "IVR self-service completion rate is 28% vs 52% benchmark — 180 agents handling calls that should self-serve. Average handle time is 7.2 minutes vs 4.8 benchmark. Annual excess cost $3.8M. No AI-assisted agent response — agents manually searching knowledge base adding 2+ minutes per complex call. Genesys Cloud CX AI features are already licensed but not deployed.",
      solution: "Deploy Genesys AI (included in current license at no additional cost) for AI agent assist and knowledge suggestions. Deploy virtual agent for top 10 call types: balance inquiry, transfer, payment confirmation, address change, card dispute, statement request. Virtual agent handles 30% of call volume. Agent assist reduces handle time from 7.2 to 5.2 minutes for remaining calls. Total savings: $2.2M from volume deflection and handle time reduction.",
      dataRequirements: [
        "Call center transcripts for virtual agent training — 12 months in Genesys",
        "Knowledge base content — requires curation and structuring",
        "Customer intent classification data — Genesys Analytics provides this",
        "FIS HORIZON customer account data via API — real-time lookup for agent assist",
      ],
      vendors: ["Genesys AI (already licensed)", "IBM Watson (alternative)", "Nuance (call center AI)"],
      prerequisites: [
        "Knowledge base content curation — 4-week project",
        "FIS HORIZON screen pop API improvement — reduces 8-second delay",
        "Agent training on AI-assisted workflow",
      ],
      risks: [
        "Agent resistance to AI-assisted workflow — change management required",
        "Virtual agent quality — customers frustrated by poor AI will escalate faster",
        "Knowledge base must be maintained — ongoing content governance required",
      ],
      quickWins: [
        "Enable Genesys AI agent assist for knowledge suggestions — already licensed, deploy in 2 weeks",
        "Top 3 call types as virtual agent — balance, transfer, payment confirmation — 20% volume deflection",
      ],
    },
    {
      id: "opp-007",
      name: "Commercial Lending AI — Decision Acceleration",
      category: "Lending",
      wave: 3,
      urgency: "Medium",
      timeToValueMonths: 18,
      aiReadinessPct: 54,
      financialModel: {
        annualSavingsUSD: 3600000,
        implementationCostUSD: 2800000,
        roiMultiple: 1.3,
        paybackMonths: 11,
        netPresentValue3YearUSD: 5900000,
        confidenceLevel: "Low",
      },
      problemStatement: "Commercial credit decision time is 18 days vs 5-day benchmark. Middle market and private equity-backed clients refusing to wait. Head of Commercial Banking (Kevin Walsh) estimates $4M in lost commercial deals annually from speed gap. nCino is deployed but manual spreading in Excel persists for 32% of commercial bankers.",
      solution: "Advanced commercial credit AI including automated financial spreading, covenant monitoring, and early warning signals. Integration with nCino for AI-generated credit recommendations. Zest AI commercial model provides ML-assisted underwriting decisions. CFO financial analysis automation via NLP on uploaded financial statements. Target: 18-day decision to 5-day decision.",
      dataRequirements: [
        "10 years of commercial credit performance data — partially available",
        "Industry financial benchmarks (Sageworks/Piper Sandler) — requires subscription",
        "Commercial borrower financial statements — digitization required",
        "nCino deal history and credit memo templates — available",
      ],
      vendors: ["Zest AI (commercial)", "nCino Automated Spreading (quick win component)", "Moody's Analytics CreditLens"],
      prerequisites: [
        "nCino adoption at 90% — currently 68%",
        "Credit data quality improvement project",
        "Fair lending model validation (adds 3-4 months)",
        "Model Risk Management framework",
      ],
      risks: [
        "Commercial credit is relationship-driven — bankers resist algorithmic recommendations",
        "Regulatory scrutiny of commercial credit AI is increasing",
        "Data quality insufficient for reliable ML — prerequisite work required",
        "Long timeline reduces urgency relative to Wave 1 priorities",
      ],
      quickWins: [
        "nCino Automated Spreading: 40% time reduction in spreading step — available in Wave 1",
      ],
    },
    {
      id: "opp-008",
      name: "Document Processing AI — Intelligent Automation",
      category: "Operational Efficiency",
      wave: 1,
      urgency: "High",
      timeToValueMonths: 4,
      aiReadinessPct: 86,
      financialModel: {
        annualSavingsUSD: 1800000,
        implementationCostUSD: 900000,
        roiMultiple: 2.0,
        paybackMonths: 6,
        netPresentValue3YearUSD: 3800000,
        confidenceLevel: "High",
      },
      problemStatement: "84% of documents processed manually. 18 FTE dedicated to document processing. Loan processing takes 5 days vs 1-day benchmark due to manual document review. Compliance documentation manual — 14 FTE on regulatory reporting. Regulatory reporting costs $8.4M vs $3.2M benchmark — $5.2M excess.",
      solution: "Deploy Azure Form Recognizer or ABBYY Vantage for intelligent document processing. Target use cases: loan application documents, account opening identity documents, commercial credit spreads, and OCC regulatory report data extraction. AI extraction accuracy targets: 95%+ for structured documents, 85%+ for unstructured. Reduces 18 document FTE by 10 through automation. Loan processing from 5 days to 1 day for standard applications.",
      dataRequirements: [
        "Document samples for model training — 10,000 loan documents available",
        "Classification taxonomy — document types and routing rules",
        "Validation rules for extracted fields — compliance review required",
      ],
      vendors: ["Azure Form Recognizer (recommended — existing Azure footprint)", "ABBYY Vantage", "Hyperscience"],
      prerequisites: [
        "Azure ML platform provisioned — $200K",
        "Document workflow integration with nCino and Narmi",
        "Compliance review of automated extraction accuracy thresholds",
      ],
      risks: [
        "Accuracy thresholds must meet regulatory standards — compliance sign-off required",
        "FTE reduction requires HR change management",
        "Document variation in legacy loan files may reduce model accuracy",
      ],
      quickWins: [
        "Azure Form Recognizer on new loan applications — same-day deployment possible on Azure infrastructure",
        "Account opening identity document extraction — reduces Narmi abandonment from manual review",
        "Fastest Wave 1 initiative — 4-month payback with existing Azure infrastructure",
      ],
    },
  ],
  waveFinancials: [
    {
      waveName: "Wave 1 — Quick Wins and Critical Infrastructure",
      months: "0-9",
      totalInvestmentUSD: 9600000,
      totalAnnualSavingsUSD: 19200000,
      roiMultiple: 2.0,
      paybackMonths: 6,
      initiatives: ["opp-001", "opp-002", "opp-004", "opp-005", "opp-008"],
      prerequisite: "FedNow API layer is the infrastructure unlock for opp-001 and opp-005",
    },
    {
      waveName: "Wave 2 — Digital and Operational Transformation",
      months: "6-15",
      totalInvestmentUSD: 3800000,
      totalAnnualSavingsUSD: 5300000,
      roiMultiple: 1.4,
      paybackMonths: 9,
      initiatives: ["opp-003", "opp-006"],
      prerequisite: "Model Risk Management framework (for opp-003), FedNow live (for opp-006 efficiency gains)",
    },
    {
      waveName: "Wave 3 — Advanced AI and Intelligence",
      months: "12-24",
      totalInvestmentUSD: 2800000,
      totalAnnualSavingsUSD: 3600000,
      roiMultiple: 1.3,
      paybackMonths: 11,
      initiatives: ["opp-007"],
      prerequisite: "nCino adoption at 90%, credit data quality project complete",
    },
  ],
  strategicNarrative: [
    "FedNow (opp-002) is the unlock: it resolves $340M deposit attrition risk, closes 2 of 3 OCC MRAs, and provides the API layer that enables fraud AI and digital onboarding AI",
    "Wave 1 pays for the entire 3-wave program: $19.2M annual savings on $9.6M investment recovers full program cost in under 6 months",
    "AML upgrade (opp-004) is the fastest OCC MRA closure: $1.6M investment closes MRA-2 and partially closes MRA-3 — critical before Q4 2026 examination",
    "Document processing AI (opp-008) is the lowest-risk highest-readiness initiative: 86% data readiness, existing Azure infrastructure, 4-month payback",
    "CFO framing: Wave 1 reduces cost-to-income ratio by 2.4 percentage points — moves First Capital from 68% toward 65.6% and onto a credible path to 55% target",
  ],
}
