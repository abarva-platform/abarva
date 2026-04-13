interface MigrationOption {
  vendor: string
  estimatedCost: number
  timeline: string
  notes: string
}

interface Vendor {
  id: string
  name: string
  category: string
  annualCostUSD: number
  contractExpiry: string
  status: string
  health: "red" | "yellow" | "green"
  riskLevel: "Critical" | "High" | "Medium" | "Low"
  businessOwner: string
  itOwner: string
  keyIssues: string[]
  opportunities: string[]
  migrationOptions?: MigrationOption[]
  immediateAction: string
}

interface ShadowITTool {
  name: string
  category: string
  estimatedAnnualCost: number
  users: number
  regulatoryRisk: boolean
  riskDescription?: string
}

export const firstCapitalVendors: {
  summary: {
    totalITBudget: number
    contractedVendorSpend: number
    shadowITSpend: number
    vendors: Vendor[]
  }
  shadowIT: {
    totalEstimatedAnnualCost: number
    toolCount: number
    regulatoryRiskTools: number
    tools: ShadowITTool[]
  }
  optimizationOpportunities: Array<{
    vendor: string
    opportunityType: string
    estimatedAnnualSavings: number
    effort: string
    timeframe: string
  }>
} = {
  summary: {
    totalITBudget: 168000000,
    contractedVendorSpend: 156000000,
    shadowITSpend: 12000000,
    vendors: [
      {
        id: "fis-horizon",
        name: "FIS HORIZON",
        category: "Core Banking",
        annualCostUSD: 28000000,
        contractExpiry: "2027",
        status: "Live — Extended Maintenance",
        health: "red",
        riskLevel: "Critical",
        businessOwner: "Michael Torres (CFO)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "22-year-old system — peer median core banking age is 14 years",
          "Running at 87% peak capacity — no headroom for growth",
          "Extended maintenance premium: $4.2M above standard support annually",
          "Cannot support FedNow or RTP natively without middleware layer",
          "FIS has not released a major feature since 2018 — roadmap frozen",
          "COBOL/PL-1 codebase — fewer than 200 COBOL developers in Mid-Atlantic market",
          "Unsupported risk begins 2027 — 18 months from now",
          "6.2-hour nightly batch — real-time banking impossible without re-architecture",
          "42 downstream systems dependent on batch files — single point of failure",
        ],
        opportunities: [
          "API layer addition — $18M — enables FedNow, CFPB 1033, and real-time payments without full replacement",
          "Progressive modernization via Mambu or Thought Machine — $65M — 24-36 month path",
          "Full replacement — Temenos, Thought Machine, or FIS Modern Banking Platform — $120M — highest risk",
          "Renegotiate maintenance fees — leverage extended premium as negotiation basis",
        ],
        migrationOptions: [
          { vendor: "Temenos Transact", estimatedCost: 34000000, timeline: "36 months", notes: "Best fit for $18B bank. Strong retail banking modules. Reference banks of similar size." },
          { vendor: "nCino (full platform)", estimatedCost: 28000000, timeline: "30 months", notes: "Already in use for commercial lending at First Capital. Expansion path with reduced integration risk." },
          { vendor: "Thought Machine Vault", estimatedCost: 41000000, timeline: "42 months", notes: "Cloud-native, highest capability but highest cost and longest timeline. Better fit for $30B+ banks." },
          { vendor: "FIS Modern Banking Platform", estimatedCost: 22000000, timeline: "24 months", notes: "Migration within FIS ecosystem — lowest migration risk but depends on FIS roadmap continuation." },
        ],
        immediateAction: "Decision required by Q3 2026: API layer modernization vs full replacement. Cannot defer again — 2027 support risk creates hard deadline.",
      },
      {
        id: "q2-holdings",
        name: "Q2 Holdings — Digital Banking Platform",
        category: "Digital Banking",
        annualCostUSD: 14000000,
        contractExpiry: "2027",
        status: "Live — Underperforming",
        health: "red",
        riskLevel: "High",
        businessOwner: "Sandra Liu (CDO)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "Mobile app rating 3.2 vs 4.1 benchmark — below competitive threshold of 3.8",
          "Displaying T+1 balances — FIS HORIZON batch limitation but visible as Q2 problem",
          "99.4% uptime vs 99.9% SLA — recurring SLA breach with no financial remedy claimed",
          "Digital adoption at 41% vs 67% peer benchmark — Q2 platform contributes to friction",
          "Account opening abandonment 64% via Narmi integration — Q2 not the root cause but affects perception",
          "Business banking capabilities inadequate for commercial clients — losing treasury management",
          "No real-time transaction push notifications — batch dependent",
        ],
        opportunities: [
          "Migrate to Q2 Catalyst platform — $2.8M annual savings vs current Q2 Platform contract",
          "Leverage SLA breach history to renegotiate — 12 months of uptime data support $400K credit",
          "Competitive RFP — Alkami, Temenos Digital, or Jack Henry Banno — creates negotiating leverage",
          "Q2 Innovation Studio AI features — AI chatbot and spending insights within existing contract",
        ],
        immediateAction: "Issue Q2 contract renegotiation notice. Quantify SLA breach credits. Evaluate Q2 Catalyst migration for $2.8M savings. Q2 Innovation Studio AI features available without contract change.",
      },
      {
        id: "salesforce",
        name: "Salesforce — CRM Platform",
        category: "CRM",
        annualCostUSD: 8000000,
        contractExpiry: "2026",
        status: "Live — Significantly Underutilized",
        health: "yellow",
        riskLevel: "Medium",
        businessOwner: "Kevin Walsh (Head of Commercial Banking)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "Only 34% adoption by relationship managers — paid for 100% license coverage",
          "6 modules licensed and unused: Marketing Cloud, Service Cloud, Tableau CRM, Einstein Analytics, Revenue Intelligence, Slack",
          "No integration with FIS HORIZON — relationship managers maintain dual entry",
          "Commercial relationship data fragmented — no single customer view",
          "Renewal at current pricing would be a $5.3M annual waste given actual usage",
        ],
        opportunities: [
          "Right-size licenses immediately — reduce to 35% coverage matching actual adoption: $2.4M annual savings",
          "Drop 4 of 6 unused modules: $1.8M additional savings — total $4.2M optimization",
          "Invest savings in Salesforce Financial Services Cloud adoption program — raise adoption to 80%",
          "Einstein AI for relationship manager next-best-action — already licensed, not deployed",
          "Use contract renewal (2026) as leverage for 20% rate reduction on retained licenses",
        ],
        immediateAction: "Right-size Salesforce licenses by October 2026 renewal. $2.4M savings available immediately. Einstein AI features are licensed but not deployed — quick win for relationship managers.",
      },
      {
        id: "nice-actimize",
        name: "NICE Actimize SAM",
        category: "BSA/AML Compliance",
        annualCostUSD: 4800000,
        contractExpiry: "2026",
        status: "Live — 2 Major Versions Behind",
        health: "red",
        riskLevel: "Critical",
        businessOwner: "James Park (CRO)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "Running version 8.1 vs current 10.2 — 2 major versions behind",
          "Missing ML-based detection models added in versions 9.0 and 10.0",
          "AML false positive rate 94% vs 45% benchmark — more than double acceptable level",
          "Automation rate 34% vs 72% benchmark — 6 excess FTE at $1.08M annual cost",
          "3 OCC MRAs cite AML system deficiencies — version is directly implicated",
          "No network analytics capability — cannot detect relationship-based money laundering",
          "Alert quality so poor that analysts dismiss alerts by default — regulatory risk",
        ],
        opportunities: [
          "Upgrade to NICE Actimize 10.2: $1.6M investment — reduces false positives from 94% to ~45%, closes OCC MRA-2",
          "ML detection models in 10.2 would automate 72% of dispositions — save $1.08M in excess FTE annually",
          "Network analytics module in 10.2 addresses OCC MRA-3 (relationship-based monitoring gap)",
          "Post-upgrade, renegotiate maintenance based on version currency — current premium unjustified for outdated version",
        ],
        immediateAction: "Upgrade to NICE Actimize 10.2 immediately. $1.6M investment with 6-month payback through FTE reduction. Closes OCC MRA-2. Required before Q4 2026 OCC examination.",
      },
      {
        id: "fis-fedwire-ach",
        name: "FIS Payments — Fedwire and ACH",
        category: "Payments Infrastructure",
        annualCostUSD: 3600000,
        contractExpiry: "2027",
        status: "Live — FedNow Not Deployed",
        health: "red",
        riskLevel: "Critical",
        businessOwner: "Kevin Walsh (Head of Commercial Banking)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "FedNow not live — 68% of peer banks already deployed",
          "RTP (The Clearing House) not live — same architectural constraint",
          "$340M commercial deposit attrition risk from payment capability gap",
          "FIS cannot support FedNow natively without middleware addition",
          "ACH limited to 3 processing windows — no real-time ACH",
          "Wire cutoff at 4:00 PM ET — commercial clients losing deal closings",
          "No SWIFT GPI — cannot track international wires in real time",
        ],
        opportunities: [
          "FedNow via API middleware (Finzly): $3.2M — 87-day average deployment — resolves $340M deposit risk",
          "FedNow enables 2 OCC MRA resolutions as side effect (payment risk and data governance MRAs)",
          "Real-time payments capability supports new treasury management product revenue",
          "RTP deployment can follow FedNow on same middleware infrastructure",
          "International wire tracking via SWIFT GPI — commercial client retention feature",
        ],
        immediateAction: "Sign FedNow vendor contract by May 2026 to deploy before Q4 2026 OCC exam. Finzly recommended — 87-day average deployment is fastest available path.",
      },
      {
        id: "fico-fraud",
        name: "FICO — Falcon Fraud Detection",
        category: "Fraud Prevention",
        annualCostUSD: 2800000,
        contractExpiry: "2025",
        status: "Live — Rules-Based Only",
        health: "yellow",
        riskLevel: "High",
        businessOwner: "James Park (CRO)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "Rules-based detection only — no ML scoring",
          "Card fraud losses $4.2M annually vs $2.1M benchmark for portfolio size",
          "False positive rate 34% — customer friction and manual review cost",
          "15-minute delay on fraud decisioning — real-time detection not supported",
          "Contract expires 2025 — renewal decision point",
          "Cannot integrate real-time data from FedNow payments — batch dependent",
        ],
        opportunities: [
          "Upgrade to FICO Falcon with ML layer: $1.8M investment — reduces losses by estimated $2.1M annually",
          "Alternative: Featurespace ARIC or Feedzai — competitive RFP at renewal could reduce cost 20%",
          "FedNow API layer enables real-time fraud scoring — transforms detection capability",
          "ML fraud detection closes performance gap to benchmark — $2.1M annual savings",
        ],
        immediateAction: "Do not auto-renew without competitive RFP. Evaluate FICO Falcon ML upgrade vs Featurespace vs Feedzai. FedNow API layer is prerequisite for real-time fraud scoring.",
      },
      {
        id: "ncino-commercial",
        name: "nCino — Commercial Loan Origination",
        category: "Lending Platform",
        annualCostUSD: 1800000,
        contractExpiry: "2027",
        status: "Live — Adoption Gap",
        health: "yellow",
        riskLevel: "Medium",
        businessOwner: "Kevin Walsh (Head of Commercial Banking)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "68% adoption among commercial bankers — 32% still using Excel",
          "18-day average credit decision vs 5-day benchmark",
          "No AI underwriting integration — manual spreading in Excel",
          "Best FIS HORIZON integration in the stack — API-based and real-time",
          "Credit analysis templates not standardized post-nCino implementation",
        ],
        opportunities: [
          "Drive adoption to 90% — eliminate Excel spreading that creates model risk",
          "AI underwriting via Zest AI integration on nCino — reduce 18-day decision to 5 days",
          "nCino Automated Spreading module — reduces decision time by 40%",
          "nCino is a potential foundation for core banking migration path if FIS HORIZON modernization chosen",
        ],
        immediateAction: "Deploy nCino Automated Spreading module and mandate adoption for all commercial bankers. 18-day decision is losing deals — addressable within 90 days.",
      },
      {
        id: "genesys-cloud",
        name: "Genesys Cloud CX — Contact Center",
        category: "Contact Center",
        annualCostUSD: 3200000,
        contractExpiry: "2026",
        status: "Live — AI Features Unlicensed",
        health: "yellow",
        riskLevel: "Medium",
        businessOwner: "Amara Osei (Head of Retail Banking)",
        itOwner: "Patricia Huang (CIO)",
        keyIssues: [
          "IVR self-service completion rate 28% vs 52% benchmark — 180 agents handling calls that should self-serve",
          "8-second FIS HORIZON screen pop delay — customer already frustrated before agent answers",
          "Average handle time 7.2 minutes vs 4.8 benchmark — $3.8M annual excess cost",
          "Agent abandonment rate 18% vs 6% benchmark — customers giving up",
          "No AI-assisted response — agents manually searching knowledge base",
          "4 system lookups required for complex calls — no unified customer view",
        ],
        opportunities: [
          "Genesys AI (included in CX license) — enables AI agent assist and knowledge suggestions",
          "Virtual agent deployment for top 10 call types — could reduce call volume 30%",
          "Fix FIS HORIZON screen pop delay — API improvement, not Genesys issue",
          "Call center AI reduces handle time from 7.2 to 5.2 minutes — $1.6M annual savings",
          "AI customer service at $1.4M investment would save $2.2M annually",
        ],
        immediateAction: "Enable Genesys AI features already licensed — no additional cost. Deploy virtual agent for balance inquiry, transfer, and payment confirmation — top 3 call types represent 40% of volume.",
      },
    ],
  },
  shadowIT: {
    totalEstimatedAnnualCost: 12000000,
    toolCount: 23,
    regulatoryRiskTools: 4,
    tools: [
      {
        name: "Venmo for Business (unauthorized)",
        category: "Payments",
        estimatedAnnualCost: 48000,
        users: 14,
        regulatoryRisk: true,
        riskDescription: "Customer funds processed outside approved payment systems — BSA/AML monitoring gap",
      },
      {
        name: "DocuSign (non-enterprise)",
        category: "Document Management",
        estimatedAnnualCost: 84000,
        users: 280,
        regulatoryRisk: true,
        riskDescription: "Customer PII in non-enterprise DocuSign — data leaving approved perimeter, GLBA risk",
      },
      {
        name: "Google Sheets (customer data)",
        category: "Data and Analytics",
        estimatedAnnualCost: 0,
        users: 840,
        regulatoryRisk: true,
        riskDescription: "Customer financial data stored in Google Sheets — GLBA and CCPA compliance risk, data leaving approved perimeter",
      },
      {
        name: "ChatGPT Enterprise (unsanctioned)",
        category: "AI Tools",
        estimatedAnnualCost: 120000,
        users: 340,
        regulatoryRisk: true,
        riskDescription: "Customer data and internal financial models submitted to external LLM — data governance and regulatory risk",
      },
      {
        name: "Calendly",
        category: "Productivity",
        estimatedAnnualCost: 28000,
        users: 184,
        regulatoryRisk: false,
      },
      {
        name: "Loom",
        category: "Productivity",
        estimatedAnnualCost: 18000,
        users: 84,
        regulatoryRisk: false,
      },
      {
        name: "Notion",
        category: "Knowledge Management",
        estimatedAnnualCost: 42000,
        users: 128,
        regulatoryRisk: false,
      },
      {
        name: "Asana",
        category: "Project Management",
        estimatedAnnualCost: 64000,
        users: 184,
        regulatoryRisk: false,
      },
      {
        name: "Miro",
        category: "Collaboration",
        estimatedAnnualCost: 24000,
        users: 84,
        regulatoryRisk: false,
      },
      {
        name: "Grammarly Business",
        category: "Productivity",
        estimatedAnnualCost: 18000,
        users: 280,
        regulatoryRisk: false,
      },
    ],
  },
  optimizationOpportunities: [
    {
      vendor: "Salesforce",
      opportunityType: "License right-sizing",
      estimatedAnnualSavings: 2400000,
      effort: "Low",
      timeframe: "30 days",
    },
    {
      vendor: "Salesforce",
      opportunityType: "Unused module removal",
      estimatedAnnualSavings: 1800000,
      effort: "Low",
      timeframe: "60 days",
    },
    {
      vendor: "Q2 Holdings",
      opportunityType: "Migrate to Q2 Catalyst / renegotiate",
      estimatedAnnualSavings: 2800000,
      effort: "Medium",
      timeframe: "6 months",
    },
    {
      vendor: "NICE Actimize",
      opportunityType: "Upgrade enables FTE reduction",
      estimatedAnnualSavings: 1080000,
      effort: "Medium",
      timeframe: "6 months",
    },
    {
      vendor: "Azure (cloud)",
      opportunityType: "Right-size 60 underutilized VMs",
      estimatedAnnualSavings: 480000,
      effort: "Low",
      timeframe: "30 days",
    },
    {
      vendor: "Tableau / Cognos",
      opportunityType: "Retire Cognos, right-size Tableau",
      estimatedAnnualSavings: 340000,
      effort: "Low",
      timeframe: "60 days",
    },
    {
      vendor: "FIS HORIZON",
      opportunityType: "Renegotiate extended maintenance premium",
      estimatedAnnualSavings: 1400000,
      effort: "Medium",
      timeframe: "3 months",
    },
  ],
}
