export const nexoraTechnology = {
  source: 'client' as const,
  uploadedBy: 'David Park (CIO)',
  uploadedAt: '2026-04-02',
  confidence: 0.85,

  ecommerce: {
    platform: 'Salesforce Commerce Cloud (SFCC)',
    conversionRate: 2.3,          // %
    benchmarkConversion: 3.8,     // %
    conversionGap: -1.5,          // pp
    cartAbandonmentRate: 72,      // %
    benchmarkAbandonmentRate: 58, // %
    mobileConversionRate: 1.4,    // %
    mobileTrafficShare: 68,       // %
    returnRate: 28,               // %
    industryReturnRate: 18,       // %
    returnCostPerOrder: 14.20,    // $
    fulfillmentCostPerOrder: 18.40, // $
    targetFulfillmentCost: 11.20,   // $
    fulfillmentCostGap: 7.20,       // $ per order
    totalOrdersAnnual: 48_000_000,  // units
    fulfillmentCostExcess: 346,     // $M annually (48M × $7.20)
    siteSpeedScore: 54,             // / 100 (Google PageSpeed)
    benchmarkSiteSpeed: 82,
    searchRelevanceScore: 61,       // / 100
    personalizationActive: false,
  },

  personalization: {
    platform: 'Salesforce Einstein AI',
    annualLicenseCost: 14,      // $M per year
    licensedMonths: 18,
    totalLicensedSpend: 21,     // $M
    activated: false,
    activationStatus: 'NOT STARTED — license paid for 18 months, zero activation work begun',
    potentialAnnualRevenue: 248, // $M uplift from loyalty personalization
    activationCost: 1.2,        // $M (one-time)
    timeToValue: '6-8 weeks',
    roi: '207x on activation cost',
    loyaltyMembersUntapped: 28_400_000,
    note: 'Einstein is in the SFCC license. $14M/yr being paid. $248M revenue opportunity sitting idle. Activation cost $1.2M. This is the highest-ROI action available.',
  },

  loyalty: {
    totalMembers: 28_400_000,
    activeMembers: 11_940_000,  // 42%
    activeMemberTargetPct: 68,
    aiPersonalizationEnabled: false,
    segmentsInUse: 3,
    targetSegments: 40,
    churnRateAnnual: 18,        // %
    churnRatePeer: 11,          // %
    avgTransactionFrequency: 3.2, // times per year (active)
    benchmarkFrequency: 5.1,
    emailOpenRate: 14,          // % (loyalty comms)
    benchmarkEmailOpenRate: 28,
  },

  dataInfrastructure: {
    cdpExists: false,
    dataWarehouse: 'Databricks (partially implemented)',
    databricksStatus: 'Live for APAC — not connected to loyalty or Einstein',
    churnModelBuilt: true,
    churnModelDeployed: false,
    cartRecoveryTriggersBuilt: true,
    cartRecoveryTriggersDeployed: false,
    segmentPlatformLicensed: true,
    segmentPlatformConnected: false,
    klaviyoLicensed: true,
    klaviyoConnected: false,
    note: 'Klaviyo + Segment licensed. Databricks churn model built. Cart triggers designed. None deployed. This is an execution problem, not a technology problem.',
  },

  aiPortfolio: {
    totalInitiatives: 34,
    totalCommitted: 148,        // $M
    documentedROI: 12,          // $M
    roiPct: 8,                  // %
    initiativesWithBaselines: 2,
    initiativesLive: 4,
    initiativesStalled: 18,
    initiativesInPlanning: 12,
  },

  topAiInitiatives: [
    {
      name: 'Einstein Personalization Activation',
      spend: 21,         // $M (license already paid — no incremental cost)
      status: 'not-started',
      issue: 'License paid for 18 months. Activation not started. CIO and CMO not aligned on ownership.',
      value: 248,        // $M annual
    },
    {
      name: 'Inventory Demand Forecasting (o9)',
      spend: 6.8,
      status: 'stalled-40pct',
      issue: '40% implemented in 18 months. Decision required: complete or replace. $6.8M already spent.',
      value: 180,        // $M excess inventory recovery
    },
    {
      name: 'Cart Recovery Automation',
      spend: 2.4,
      status: 'built-not-deployed',
      issue: 'Triggers built in Klaviyo. Not deployed. Platform teams not connected.',
      value: 68,         // $M (conservative: 15% recovery of abandoned carts)
    },
    {
      name: 'Shrinkage AI Detection',
      spend: 4.2,
      status: 'piloting',
      issue: '12 stores piloted. 34% shrinkage reduction. Scale decision pending — no executive sponsor named.',
      value: 130,        // $M (50% of excess shrinkage at scale)
    },
    {
      name: 'Store Traffic AI Optimization',
      spend: 8.6,
      status: 'stalled',
      issue: 'Requires unified store data from all 6 ERP systems. 4 of 6 ERPs not AI-ready.',
      value: 85,         // $M (revenue per sqft improvement)
    },
    {
      name: 'Supplier Risk Intelligence',
      spend: 3.8,
      status: 'not-started',
      issue: 'SAP R/3 EOL blocks supplier data feed. 0 of 2,400 suppliers risk-scored.',
      value: 45,         // $M (supply chain disruption reduction)
    },
  ],

  // ─── Cloud & Infrastructure ───────────────────────────────────────────────

  cloudInfrastructure: {
    primaryCloud: 'Microsoft Azure (data platform — Databricks)',
    secondaryCloud: 'AWS (APAC workloads, ecommerce DR)',
    erpCloudStatus: '2 of 6 ERP regions cloud-deployed (NA SAP S/4HANA, Nordics Dynamics 365)',
    onPremPct: 54,           // % of workloads — 4 legacy ERP regions + store systems
    cloudPct: 46,            // % — SFCC, Databricks, NA S/4, Nordics D365, Klaviyo, Segment
    hybridModel: true,
    datacentres: [
      { location: 'Columbus OH (NA)', type: 'Azure cloud', purpose: 'SAP S/4HANA NA, Databricks, Azure ML', aiReady: true },
      { location: 'Frankfurt (Continental Europe)', type: 'co-located on-prem', purpose: 'SAP R/3 (EOL Dec 2027), legacy finance', aiReady: false },
      { location: 'London (UK & Ireland)', type: 'co-located on-prem', purpose: 'Oracle EBS R12, UK store systems', aiReady: false },
      { location: 'Stockholm (Nordics)', type: 'Microsoft Azure', purpose: 'Dynamics 365 — cloud-native', aiReady: true },
      { location: 'Singapore (APAC)', type: 'AWS ap-southeast-1', purpose: 'Custom SAP, store operations, Databricks APAC node', aiReady: false },
      { location: 'Dubai (Middle East)', type: 'co-located on-prem', purpose: 'SAP Business One, ME operations', aiReady: false },
      { location: 'Salesforce cloud (global)', type: 'SaaS', purpose: 'SFCC ecommerce, Einstein (not activated), CRM', aiReady: true },
    ],
    erpAiReadinessMap: {
      'North America — SAP S/4HANA': 'AI-READY',
      'Nordics — Dynamics 365': 'AI-READY',
      'Continental Europe — SAP R/3': 'NOT AI-READY (EOL Dec 2027)',
      'UK & Ireland — Oracle EBS': 'NOT AI-READY',
      'Asia Pacific — Custom SAP': 'NOT AI-READY',
      'Middle East — SAP Business One': 'NOT AI-READY',
    },
    note: '4 of 6 ERP regions are not AI-ready. Every initiative requiring cross-regional inventory or supply chain AI is blocked. Unified data layer is the only near-term bridge solution.',
  },

  applicationPortfolio: [
    {
      name: 'SAP S/4HANA (North America)',
      businessFunction: 'ERP — Finance, Supply Chain, Procurement (NA)',
      techStack: 'SAP S/4HANA 2023, Azure cloud, standard APIs',
      deploymentModel: 'cloud (Azure)',
      cloudProvider: 'Microsoft Azure',
      annualCost: 28,          // $M
      healthStatus: 'modern — beacon for other regions',
      aiReady: true,
      businessCriticality: 'mission-critical',
      region: 'North America',
      customisations: 420,
      notes: 'Only fully modern ERP. NA is the template for global rollout. Databricks connected for NA inventory data.',
    },
    {
      name: 'SAP R/3 (Continental Europe)',
      businessFunction: 'ERP — Finance, Supply Chain, Procurement (Continental Europe)',
      techStack: 'SAP R/3 4.7, on-premise, custom ABAP',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 18,          // $M
      healthStatus: 'CRITICAL — EOL December 2027, 8,200 customisations',
      aiReady: false,
      businessCriticality: 'mission-critical',
      region: 'Continental Europe',
      customisations: 8200,
      eolDate: '2027-12',
      notes: '$4.6B revenue region. 18-24 month migration window starting now means arriving at deadline. Every month of delay increases risk. 8,200 customisations must be rationalised regardless of target platform.',
    },
    {
      name: 'Oracle EBS R12 (UK & Ireland)',
      businessFunction: 'ERP — Finance, HR, Supply Chain (UK & Ireland)',
      techStack: 'Oracle EBS R12.2, on-premise, Oracle DB',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 12,          // $M
      healthStatus: 'aging — extended support only, no upgrade path planned',
      aiReady: false,
      businessCriticality: 'high',
      region: 'UK & Ireland',
      customisations: 1840,
      notes: 'Oracle EBS R12 extended support ends 2027. Integration to SAP S/4HANA required for unified reporting. 14% of revenue region.',
    },
    {
      name: 'Microsoft Dynamics 365 (Nordics)',
      businessFunction: 'ERP — Finance, Operations (Nordics)',
      techStack: 'Dynamics 365 Finance + Operations, Azure native',
      deploymentModel: 'cloud (Azure)',
      cloudProvider: 'Microsoft Azure',
      annualCost: 6,           // $M
      healthStatus: 'modern — cloud-native, 3 years old',
      aiReady: true,
      businessCriticality: 'high',
      region: 'Nordics',
      customisations: 180,
      notes: 'Modern and cloud-native. Not integrated with SAP data model — separate data pipeline needed for unified inventory view.',
    },
    {
      name: 'Custom SAP (Asia Pacific)',
      businessFunction: 'ERP — Finance, Retail Operations (APAC)',
      techStack: 'SAP ECC 6.0 with 4,100 custom ABAP modifications, on-premise',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 14,          // $M
      healthStatus: 'fragmented — heavily customised, migration path unclear',
      aiReady: false,
      businessCriticality: 'high',
      region: 'Asia Pacific',
      customisations: 4100,
      notes: 'Custom-built on legacy SAP. 4,100 customisations unique to APAC make migration path highly complex. Databricks APAC node connected but limited to SFCC data, not ERP.',
    },
    {
      name: 'SAP Business One (Middle East)',
      businessFunction: 'ERP — Finance, Operations (Middle East)',
      techStack: 'SAP Business One 10.0, on-premise',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 4,           // $M
      healthStatus: 'underspecced — SME product running $2.8B operation',
      aiReady: false,
      businessCriticality: 'medium',
      region: 'Middle East',
      customisations: 290,
      notes: 'SAP Business One designed for SME (under $50M revenue). Running a $2.8B regional operation on it creates structural reporting gaps.',
    },
    {
      name: 'Salesforce Commerce Cloud (SFCC)',
      businessFunction: 'E-Commerce Platform — all regions',
      techStack: 'Salesforce Commerce Cloud, Einstein AI (licensed, not activated), Salesforce Order Management',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'Salesforce',
      annualCost: 21,          // $M — includes Einstein license
      healthStatus: 'functional — conversion 2.3% vs 3.8% benchmark',
      aiReady: true,           // Einstein licensed
      businessCriticality: 'mission-critical',
      region: 'Global',
      notes: 'Einstein AI licensed for 18 months at $14M/yr. Not activated. $248M annual revenue opportunity idle. Site speed 54/100 vs 82 benchmark. Mobile conversion 1.4% on 68% of traffic.',
    },
    {
      name: 'Databricks (Data Platform)',
      businessFunction: 'Data Engineering / ML Platform',
      techStack: 'Databricks on Azure, Delta Lake, MLflow (not deployed)',
      deploymentModel: 'cloud (Azure)',
      cloudProvider: 'Microsoft Azure',
      annualCost: 3.2,         // $M
      healthStatus: 'partial — live for APAC only, not connected to loyalty or Einstein',
      aiReady: true,
      businessCriticality: 'high',
      region: 'APAC (primary), NA (planned)',
      notes: 'Churn model built in Databricks — not deployed. Cart recovery triggers designed — not activated. MLflow available for MLOps — not configured. Platform is ready; execution is not.',
    },
    {
      name: 'o9 Solutions (Demand Forecasting)',
      businessFunction: 'Inventory Demand Forecasting / Supply Planning',
      techStack: 'o9 Solutions platform, connected to NA SAP S/4HANA only',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'o9 cloud',
      annualCost: 2.4,         // $M ongoing license
      healthStatus: '40% implemented after 18 months — stalled',
      aiReady: true,           // platform AI-ready but only 40% live
      businessCriticality: 'high',
      region: 'North America (partial)',
      notes: '$6.8M invested. NA module functional. Other 5 regions not onboarded. $900M excess inventory and 4.2x vs 6.8x turns benchmark are direct consequences.',
    },
    {
      name: 'Klaviyo (Email / CRM Automation)',
      businessFunction: 'Customer Marketing Automation / Loyalty Communications',
      techStack: 'Klaviyo, Segment integration (partial)',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'Klaviyo cloud',
      annualCost: 0.8,         // $M
      healthStatus: 'licensed — cart recovery triggers built but not deployed',
      aiReady: true,
      businessCriticality: 'high',
      region: 'Global',
      notes: 'Cart recovery automation triggers built and ready. Not activated end-to-end — platform teams not coordinated with Segment. $68M cart recovery opportunity sitting idle.',
    },
    {
      name: 'Segment (Customer Data Platform)',
      businessFunction: 'Customer Data Collection / Identity Resolution',
      techStack: 'Segment CDP, SFCC integration',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'Twilio Segment cloud',
      annualCost: 0.6,         // $M
      healthStatus: 'licensed and connected to SFCC — not connected to Klaviyo or Einstein',
      aiReady: true,
      businessCriticality: 'high',
      region: 'Global',
      notes: 'Infrastructure is in place. Segment collects customer behaviour data from SFCC. Not wired to Klaviyo for campaign triggers or to Einstein for personalisation. Activation is an execution problem.',
    },
  ],

  // ─── IT Spend (sliceable by category / vendor / function / deployment) ────

  itSpend: {
    totalAnnual: 148,           // $M — committed AI investment (from financials)
    erpAnnualTotal: 82,         // $M — 6 ERP systems combined
    totalITEstimate: 310,       // $M — total IT including operations, staff, infrastructure

    byCategory: [
      { category: 'ERP Licensing & Maintenance',   amount: 82,  pct: 26.5 },
      { category: 'AI & Data Initiatives',         amount: 148, pct: 47.7 },  // committed over 3 years, ~$49M/yr
      { category: 'eCommerce Platform (SFCC)',     amount: 21,  pct: 6.8  },
      { category: 'Cloud Infrastructure (Azure)',  amount: 12,  pct: 3.9  },
      { category: 'Data & Analytics Tools',        amount: 8,   pct: 2.6  },  // Databricks + o9 + Klaviyo + Segment
      { category: 'Cybersecurity',                 amount: 18,  pct: 5.8  },
      { category: 'IT Operations & Support',       amount: 21,  pct: 6.8  },
    ],

    byVendor: [
      { vendor: 'SAP (all systems)',       category: 'ERP',               annualSpend: 50,  contractEnd: 'various', autoRenew: true  },
      { vendor: 'Salesforce (SFCC + Einstein)', category: 'eCommerce / AI', annualSpend: 21,  contractEnd: '2027-02', autoRenew: false },
      { vendor: 'Oracle (EBS UK)',         category: 'ERP',               annualSpend: 12,  contractEnd: '2026-11', autoRenew: false },
      { vendor: 'Microsoft (Azure + D365)',category: 'Cloud / ERP',       annualSpend: 18,  contractEnd: 'ongoing', autoRenew: true  },
      { vendor: 'o9 Solutions',            category: 'Demand Forecasting', annualSpend: 2.4, contractEnd: '2026-11', autoRenew: false },
      { vendor: 'Databricks',              category: 'Data Platform',     annualSpend: 3.2, contractEnd: '2027-03', autoRenew: false },
      { vendor: 'Klaviyo',                 category: 'Marketing Automation', annualSpend: 0.8, contractEnd: '2026-09', autoRenew: true },
      { vendor: 'Segment (Twilio)',        category: 'CDP',               annualSpend: 0.6, contractEnd: '2026-08', autoRenew: false },
    ],

    byBusinessFunction: [
      { function: 'Supply Chain / Inventory',   amount: 96,  pct: 31.0 },  // ERP + o9
      { function: 'eCommerce / Customer',       amount: 73,  pct: 23.5 },  // SFCC + Einstein + Klaviyo + Segment
      { function: 'Finance / Accounting',       amount: 28,  pct: 9.0  },  // ERP finance modules
      { function: 'Store Operations',           amount: 22,  pct: 7.1  },
      { function: 'AI / ML Initiatives',        amount: 49,  pct: 15.8 },  // annual from $148M committed
      { function: 'Data & Analytics',           amount: 12,  pct: 3.9  },
      { function: 'IT Infrastructure',          amount: 30,  pct: 9.7  },
    ],

    byDeploymentModel: [
      { model: 'On-Premise (legacy ERP)',  amount: 116, pct: 37.4 },
      { model: 'Cloud (Azure)',            amount: 55,  pct: 17.7 },
      { model: 'SaaS',                     amount: 108, pct: 34.8 },
      { model: 'Vendor-Hosted',            amount: 31,  pct: 10.0 },
    ],

    capexVsOpex: {
      capex: 62,   // $M — SAP migration investments, implementation projects
      opex: 248,   // $M — licenses, maintenance, cloud, staff
      note: 'SAP R/3 migration will shift significant CapEx in 2026-2028. Current ratio understates future investment requirement.',
    },

    shadowItEstimate: 38, // $M — 28,000 store employees using untracked SaaS tools (from COO data)
  },

  // ─── Projects in Flight ───────────────────────────────────────────────────

  projectsInFlight: [
    {
      name: 'Einstein Personalization Activation',
      status: 'not-started',
      budget: 1.2,             // $M activation cost
      budgetSpent: 0,
      timeline: '8 weeks',
      owner: 'TBD — CIO/CMO ownership dispute unresolved',
      startDate: null,
      targetDate: null,
      risk: 'CRITICAL',
      dependencies: ['Executive owner appointed', 'CIO/CMO alignment on technical activation path'],
      note: '18 months idle. $14M/yr license paid. $248M revenue opportunity. Highest-ROI available action. Blocked only by organisational ownership dispute.',
    },
    {
      name: 'o9 Demand Forecasting Completion',
      status: 'stalled',
      budget: 10.4,            // $M total ($6.8M spent + $3.6M to complete)
      budgetSpent: 6.8,
      timeline: '9 months to full deployment',
      owner: 'Priya Krishnamurthy (COO)',
      startDate: '2024-10',
      targetDate: '2027-01',   // estimated completion
      risk: 'HIGH',
      dependencies: ['o9 SI recommitment', 'Data integration from non-NA ERP regions (partial)'],
      note: '40% complete after 18 months. Fixed-fee completion contract required. Milestone payments tied to inventory turn improvement, not go-live date.',
    },
    {
      name: 'SAP R/3 Continental Europe Migration',
      status: 'not-started',
      budget: 0,               // no budget allocated
      budgetSpent: 0,
      timeline: '18-24 months to complete',
      owner: 'No programme owner assigned',
      startDate: null,
      targetDate: '2027-12',   // hard deadline — SAP EOL
      risk: 'CRITICAL',
      dependencies: ['SI selection', 'Budget allocation (est. $28-42M)', 'Customisation rationalisation sprint'],
      note: 'EOL December 2027. 20 months remaining. No migration programme initiated, no budget allocated, no SI selected. Every month of delay reduces migration margin. This is the most dangerous open decision.',
    },
    {
      name: 'Cart Recovery Automation Deployment',
      status: 'built-not-deployed',
      budget: 0.8,             // $M
      budgetSpent: 0.4,
      timeline: '8 weeks to go-live',
      owner: 'David Park (CIO)',
      startDate: null,
      targetDate: null,
      risk: 'LOW',
      dependencies: ['Platform team coordination (Klaviyo ↔ Segment ↔ SFCC)', 'CIO sign-off'],
      note: 'Triggers built. Segment connected to SFCC. Klaviyo configured. Platform teams not coordinated for end-to-end activation. $68M at stake for 8-week sprint.',
    },
    {
      name: 'Shrinkage AI Scale Programme',
      status: 'decision-pending',
      budget: 8.4,             // $M for 2,400-store rollout
      budgetSpent: 4.2,        // pilot spend
      timeline: '12 months',
      owner: 'No executive sponsor named',
      startDate: null,
      targetDate: null,
      risk: 'MEDIUM',
      dependencies: ['Executive sponsor named', 'SI / hardware vendor selected', 'Store rollout sequencing plan'],
      note: '12-store pilot: 34% shrinkage reduction proven. Scale to 2,400 stores requires $8.4M investment and executive ownership. $130M annual opportunity. Pending scale decision since Q4 2025.',
    },
  ],

  // ─── Contracts ────────────────────────────────────────────────────────────

  contracts: [
    {
      vendor: 'SAP (all ERP contracts combined)',
      category: 'ERP',
      annualSpend: 50,         // $M combined across all SAP systems
      contractEnd: 'various (NA: 2028, CE: 2026, APAC: 2027)',
      autoRenew: true,
      slaTerms: '99.9% uptime, standard SAP SLA',
      leveragePoints: 'SAP R/3 EOL forces a migration decision — Nexora has leverage as a migration candidate for S/4HANA. Negotiate global rollout pricing as part of CE migration programme. SAP needs reference customers for S/4HANA retail.',
      note: 'Continental Europe contract renewal in 2026 is the critical negotiation window. Use S/4HANA migration commitment to negotiate global license pricing reduction.',
    },
    {
      vendor: 'Salesforce (SFCC + Einstein)',
      category: 'eCommerce / AI',
      annualSpend: 21,         // $M — $7M SFCC + $14M Einstein
      contractEnd: '2027-02',
      autoRenew: false,
      slaTerms: '99.9% uptime, standard Salesforce SLA',
      leveragePoints: '$14M/yr Einstein license for 18 months with zero activation — Salesforce has SLA obligation to support activation. Demand dedicated Salesforce activation engineer as contract condition. February 2027 renewal gives 10-month window to prove Einstein ROI.',
      note: 'Negotiate activation SLA into contract: Salesforce must provide technical support resources until activation is complete and verified.',
    },
    {
      vendor: 'Oracle (EBS UK)',
      category: 'ERP',
      annualSpend: 12,         // $M
      contractEnd: '2026-11',
      autoRenew: false,
      slaTerms: '99.8% uptime',
      leveragePoints: 'November 2026 renewal is the decision point: extend Oracle EBS or migrate to SAP S/4HANA UK. Migrating UK to S/4HANA in parallel with CE migration creates scale efficiency but increases programme complexity.',
      note: 'Decision required by Q2 2026: extend Oracle or begin UK S/4 migration planning. Aligning with CE migration reduces total programme cost by est. $6-8M.',
    },
    {
      vendor: 'o9 Solutions',
      category: 'Demand Forecasting',
      annualSpend: 2.4,        // $M
      contractEnd: '2026-11',
      autoRenew: false,
      slaTerms: '99.5% uptime, implementation milestone schedule',
      leveragePoints: '40% implementation after 18 months represents a contract performance failure. o9 has an obligation to complete the implementation. Negotiate: fixed-fee completion contract, milestone payments tied to inventory turns improvement (not go-live), penalty clause for further delays.',
      note: '$6.8M spent, 40% delivered. November 2026 contract renewal is leverage moment — do not auto-renew before completion terms are locked.',
    },
    {
      vendor: 'Databricks',
      category: 'Data Platform',
      annualSpend: 3.2,        // $M
      contractEnd: '2027-03',
      autoRenew: false,
      slaTerms: '99.9% uptime',
      leveragePoints: 'Platform underutilised — churn model built but not deployed, MLops not configured. Negotiate activation support and training as part of renewal. March 2027 renewal gives time to prove value.',
      note: 'Underutilised asset. Negotiate SI support for deployment as condition of renewal. Databricks wants reference customers for retail — use this for leverage.',
    },
  ],
}
