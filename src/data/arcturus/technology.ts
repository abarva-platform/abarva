export const arcturusTechnology = {
  source: 'client' as const,
  uploadedBy: 'Michael Santos (CTO)',
  uploadedAt: '2026-03-30',
  confidence: 0.88,

  corePlatform: {
    name: 'Bloomberg AIM',
    type: 'Order Management System',
    age: 28,               // years
    failedModernizations: 3,
    lastAttempt: '2022',
    currentStatus: 'CRITICAL — custom integrations blocking migration',
    annualMaintenanceCost: 42, // $M
    apiCapability: 'limited',
    cloudReady: false,
    note: 'Every AI initiative that requires real-time portfolio data hits this wall.',

    failureHistory: [
      {
        phase: 1,
        year: 2016,
        codename: 'The Charles River Migration',
        durationMonths: 14,
        investmentSunk: 4.2, // $M
        approach: 'Full OMS replacement — Bloomberg AIM to Charles River Development as primary order management system',
        failureMode: 'Data reconciliation in month 14 revealed 847 custom Bloomberg BVAL/FLDS formula dependencies embedded across 12 trading desk workflows. No Bloomberg-equivalent formulas existed in Charles River. Bloomberg refused to provide formula equivalency documentation citing IP. 3 months from go-live when abandoned.',
        rootCause: 'Dependency discovery failure — no inventory of Bloomberg formula customizations existed before migration began. Project assumed OMS functions were standard; they were not.',
        aftermath: 'Project lead departed. IT credibility deficit vs investment teams began here. Bloomberg used the failed migration to negotiate 3-year contract lock-in at renewal.',
      },
      {
        phase: 2,
        year: 2019,
        codename: 'The API Wrapper',
        durationMonths: 12,
        investmentSunk: 6.8, // $M
        approach: 'REST API middleware over Bloomberg AIM to expose position data to downstream systems without core replacement',
        failureMode: 'Bloomberg Professional Services agreed to participate, then delivered a commercial API SLA with rate limits of 500 calls/hour — 100x below the 50,000 calls/hour required for real-time ML inference. IT built an unofficial screen-scraping layer as workaround. Bloomberg compliance flagged it as Terms of Service violation and threatened termination of 342 Bloomberg Terminal licenses ($28M annual value). Project abandoned under threat.',
        rootCause: 'Bloomberg deliberately restricts API access to protect terminal revenue model. Official API route is commercially unviable for AI workloads. Unofficial route creates unacceptable termination risk.',
        aftermath: 'Bloomberg relationship damaged. IT attempted to negotiate API terms at 2021 renewal — Bloomberg refused. Terminal dependency is now the firm\'s most significant single vendor risk.',
      },
      {
        phase: 3,
        year: '2022–2023',
        codename: 'Project Aurora (Microservices Wrapper)',
        durationMonths: 14,
        investmentSunk: 11.2, // $M
        approach: 'Microservices architecture fronting Bloomberg AIM — Accenture Financial Services engaged as implementation partner',
        failureMode: 'Three of 14 trading desks (Emerging Markets, Global Macro, Real Estate) had Bloomberg AIM configurations built without documentation. Custom order routing logic for 2,800 active securities had no written specification — only tribal knowledge in the heads of 4 senior traders. Day one of User Acceptance Testing produced 23 unmatched positions. Project Aurora abandoned in Q3 2023. Accenture contract closed at penalty clause.',
        rootCause: 'Undocumented operational dependency — same failure mode as Phase 1, never fixed. No Bloomberg AIM configuration audit was completed before Phase 3 began despite Phase 1 having the identical failure.',
        aftermath: 'Current Head of Technology Michael Santos was the Accenture partner who led Project Aurora before being recruited to fix what he helped build. This is known inside the firm and shapes IT team dynamics. $22M approved for Phase 4 (current) — not yet started.',
        currentPlan: 'Phase 4 approach: API middleware only — no OMS core migration. Requires Bloomberg cooperation on FIX protocol extensions. CDO hire required before Bloomberg will re-engage on technical discussions. Bloomberg contract auto-renews December 2026 — this is the negotiation window.',
      },
    ],
  },

  clientPortal: {
    platform: 'Salesforce FSC',
    investedToDate: 38,    // $M
    adoptionRate: 44,      // % active clients
    targetAdoption: 85,    // % (CIO privately reset to 70% in November 2025 — not communicated to board)
    npsScore: 31,
    industryNpsMedian: 58,
    goLiveDate: '2024-08',
    mobileAppRating: 2.8,  // out of 5
    selfServiceRate: 28,   // % of queries resolved without advisor
    issues: [
      'Single sign-on not wired to Bloomberg AIM positions — core adoption blocker',
      'Performance analytics 72-hour lag vs real-time expectation',
      'Mobile app missing portfolio rebalancing feature — advisors still need Bloomberg for trades',
      'Advisor dashboard not connected to Bloomberg AIM positions — creates dual-system cognitive load',
    ],

    adoptionTrajectory: [
      { date: '2024-08', month: 0,  adoptionPct: 12, note: 'Go-live — UAT participants and early adopters only' },
      { date: '2024-11', month: 3,  adoptionPct: 28, note: 'Post mandatory training — advisors completed onboarding but not yet embedded' },
      { date: '2025-02', month: 6,  adoptionPct: 38, note: 'Plateau — advisors who completed training reverting to Bloomberg AIM and legacy CRM' },
      { date: '2025-05', month: 9,  adoptionPct: 41, note: 'Wealth Centre incentive program ($2,000/quarter bonus for FSC activity) — marginal uptick' },
      { date: '2025-08', month: 12, adoptionPct: 42, note: 'Flat despite incentive program — root cause not yet identified by IT' },
      { date: '2025-11', month: 15, adoptionPct: 43, note: 'CIO reset target from 85% to 70% — SSO gap identified as primary blocker. Not communicated to board.' },
      { date: '2026-02', month: 18, adoptionPct: 44, note: 'Current — SSO still 6 months from delivery. Trajectory effectively flat for 3 quarters.' },
    ],

    nonAdopterFeedback: {
      surveyDate: '2026-02',
      responsesCollected: 218,
      topReasons: [
        { reason: 'Bloomberg shows real-time positions, FSC doesn\'t — cannot trust FSC for client meetings', pct: 78 },
        { reason: 'Two login systems adds friction to every client interaction', pct: 61 },
        { reason: 'Mobile app cannot execute trades — Bloomberg still required for rebalancing', pct: 44 },
        { reason: 'FSC dashboard shows yesterday\'s performance — clients ask about today\'s', pct: 37 },
        { reason: 'My Bloomberg workflow is optimised — FSC adds steps without adding value', pct: 23 },
      ],
      keyInsight: 'Adoption is blocked by the Bloomberg AIM data lag, not by Salesforce platform quality or advisor resistance. SSO integration that surfaces real-time Bloomberg positions inside FSC is the single fix that unlocks adoption. Without it, asking advisors to use FSC is asking them to work with stale data.',
    },

    einsteinAIStatus: 'Licensed — not activated. CRO AI deployment freeze applies. Einstein features dormant across all Salesforce modules.',
  },

  dataArchitecture: {
    systemCount: 14,
    hasGoldenRecord: false,
    reportingLag: 3,         // days
    goldenRecordETA: null,   // not in roadmap
    dataSilos: [
      'Bloomberg AIM (positions)',
      'Salesforce FSC (client relationships)',
      'Aladdin (risk)',
      'Charles River (compliance)',
      'Advent Geneva (accounting)',
      'Workday (HR/finance)',
      'Tableau (reporting)',
      '7 regional systems',
    ],
    dataGovernanceScore: 28, // out of 100
    aiReadinessScore: 32,    // out of 100
  },

  riskSystem: {
    name: 'BlackRock Aladdin',
    stressTestingFrequency: 'monthly',
    regulatoryRequirement: 'daily',
    gap: 'Daily stress testing required by SEC — system runs monthly. Critical compliance gap.',
  },

  aiPortfolio: {
    totalInitiatives: 28,
    totalCommitted: 94,       // $M
    initiativesWithBaselines: 0,
    initiativesWithDocumentation: 8,
    initiativesLive: 3,
    initiativesStalled: 14,
    initiativesCancelled: 2,
    initiativesInPlanning: 9,
  },

  topAiInitiatives: [
    {
      name: 'Intelligent Portfolio Construction',
      spend: 18.4, // $M committed
      status: 'stalled',
      issue: 'Requires golden record — 14 siloed systems block data input',
      potentialValue: 120, // $M AUM uplift via alpha generation
    },
    {
      name: 'Client Churn Prediction Model',
      spend: 12.2,
      status: 'live-underperforming',
      issue: 'Model trained on incomplete CRM data. 44% portal adoption means 56% of client signals missing.',
      potentialValue: 280, // $M retained AUM
    },
    {
      name: 'Automated ESG Scoring',
      spend: 8.6,
      status: 'stalled',
      issue: 'No CDO to govern data sourcing standards. Compliance blocked sign-off.',
      potentialValue: 45,
    },
    {
      name: 'AI-Powered Client Reporting',
      spend: 11.0,
      status: 'in-planning',
      issue: '3-day reporting lag in data architecture makes real-time reports impossible.',
      potentialValue: 22, // $M cost reduction
    },
    {
      name: 'Regulatory Change Monitor',
      spend: 7.8,
      status: 'stalled',
      issue: 'MAS FEAT overdue — legal blocked further AI deployments pending governance framework.',
      potentialValue: 15,
    },
    {
      name: 'Advisor Productivity Assistant',
      spend: 14.0,
      status: 'in-planning',
      issue: 'Salesforce FSC 44% adoption means majority of advisors not on target platform.',
      potentialValue: 38, // $M advisor capacity recovery
    },
  ],

  // ─── Cloud & Infrastructure ────────────────────────────────────────────────

  cloudInfrastructure: {
    primaryCloud: 'Microsoft Azure',
    secondaryCloud: 'AWS (disaster recovery and data backup)',
    onPremPct: 42,           // % of workloads — driven by Bloomberg AIM and Advent Geneva
    cloudPct: 58,            // % of workloads — Azure primary, AWS DR
    hybridModel: true,
    datacentres: [
      { location: 'London (primary)', type: 'co-located', purpose: 'Bloomberg AIM, Advent Geneva, Charles River', aiReady: false },
      { location: 'Frankfurt', type: 'co-located', purpose: 'EMEA backup, Aladdin regional node', aiReady: false },
      { location: 'Azure West Europe', type: 'cloud', purpose: 'Salesforce FSC, Workday, Tableau, new development', aiReady: true },
      { location: 'Azure Southeast Asia', type: 'cloud', purpose: 'APAC Salesforce FSC, regional reporting', aiReady: true },
      { location: 'AWS US-East (DR)', type: 'cloud', purpose: 'Disaster recovery — critical systems backup', aiReady: false },
    ],
    networkLatency: '180ms Bloomberg AIM to Azure — AI real-time inference blocked by this gap',
    aiReadyInfrastructurePct: 31,  // % of infrastructure capable of supporting AI workloads
    mlPlatformExists: false,
    dataLakeExists: false,
    note: 'On-premise Bloomberg AIM and Advent Geneva create a structural barrier to AI. Real-time AI on portfolio data requires sub-50ms latency — current 180ms makes this impossible without an API middleware layer.',
  },

  applicationPortfolio: [
    {
      name: 'Bloomberg AIM',
      businessFunction: 'Portfolio Management / Order Management',
      techStack: 'Bloomberg proprietary, FIX protocol, Bloomberg Terminal integration',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 42,          // $M (maintenance + terminal licenses)
      healthStatus: 'CRITICAL — 28 years old, 3 failed migrations',
      aiReady: false,
      businessCriticality: 'mission-critical',
      replaceableWithin12mo: false,
      notes: 'Every AI initiative requiring real-time portfolio positions hits this wall. API capability limited to batch exports. Modern alternative: Aladdin Order Management (same vendor as risk), Charles River, or Finastra Vermeg.',
    },
    {
      name: 'BlackRock Aladdin (Risk)',
      businessFunction: 'Risk Analytics / Stress Testing / Portfolio Analytics',
      techStack: 'Aladdin platform, BlackRock cloud-hosted',
      deploymentModel: 'vendor-hosted',
      cloudProvider: 'BlackRock cloud',
      annualCost: 38,          // $M
      healthStatus: 'functional — configuration gap on stress testing cadence',
      aiReady: true,           // Aladdin has AI capabilities — not yet activated
      businessCriticality: 'mission-critical',
      replaceableWithin12mo: false,
      notes: 'Stress testing configured for monthly cadence. SEC requires daily. Configuration upgrade resolves — not a replacement decision. Aladdin AI features (factor modelling, scenario analysis) not activated.',
    },
    {
      name: 'Salesforce FSC (Financial Services Cloud)',
      businessFunction: 'Client Relationship Management / Client Portal / Advisor Workflow',
      techStack: 'Salesforce FSC, Einstein AI (licensed, not activated), Experience Cloud',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'Salesforce',
      annualCost: 14,          // $M (ongoing license post $38M implementation)
      healthStatus: 'poor — 44% adoption, NPS 31, $38M invested',
      aiReady: true,           // platform AI-ready, Einstein licensed but idle
      businessCriticality: 'high',
      replaceableWithin12mo: false,
      notes: '$38M invested since August 2024. 44% adoption — majority of advisors still on legacy tools. Einstein AI licensed but not activated. Adoption programme required before AI features can deliver value.',
    },
    {
      name: 'Charles River Development (IMS)',
      businessFunction: 'Compliance / Trade Order Management / Pre-trade Compliance',
      techStack: 'Charles River Investment Management Solution, SQL Server',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 8,           // $M
      healthStatus: 'functional',
      aiReady: false,
      businessCriticality: 'high',
      replaceableWithin12mo: false,
      notes: 'Primary compliance monitoring platform. Not connected to Bloomberg AIM for real-time position compliance. Charles River Cloud migration would unblock AI compliance monitoring.',
    },
    {
      name: 'Advent Geneva',
      businessFunction: 'Fund Accounting / NAV Calculation / Investor Reporting',
      techStack: 'Advent Geneva (SS&C), Oracle DB',
      deploymentModel: 'on-premise',
      cloudProvider: null,
      annualCost: 12,          // $M
      healthStatus: 'aging — 14 years old, critical accounting dependency',
      aiReady: false,
      businessCriticality: 'mission-critical',
      replaceableWithin12mo: false,
      notes: 'Primary source of fund accounting truth. Not cloud-deployable in current configuration. 3-day reporting lag partly caused by Geneva batch processing architecture. SS&C Eze alternative under consideration.',
    },
    {
      name: 'Workday (HCM + Finance)',
      businessFunction: 'HR / Payroll / Finance / Procurement',
      techStack: 'Workday HCM, Workday Financial Management',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'Workday cloud',
      annualCost: 4.2,         // $M
      healthStatus: 'good',
      aiReady: true,
      businessCriticality: 'medium',
      replaceableWithin12mo: false,
      notes: 'Well-implemented. Workday Prism Analytics available but not activated. Workday AI features not in scope — CRO freeze on new AI deployments applies.',
    },
    {
      name: 'Tableau (Reporting & Analytics)',
      businessFunction: 'Business Intelligence / Management Reporting',
      techStack: 'Tableau Desktop + Server, Salesforce integration',
      deploymentModel: 'cloud (SaaS)',
      cloudProvider: 'Salesforce (Tableau Cloud)',
      annualCost: 1.8,         // $M
      healthStatus: 'functional — 3-day lag in source data limits value',
      aiReady: true,           // Tableau AI features available
      businessCriticality: 'medium',
      replaceableWithin12mo: true,
      notes: 'Analytics layer is good but only as good as the source data. 3-day lag from Geneva/Bloomberg means dashboards are always stale. AI explain features licensed but not used.',
    },
  ],

  // ─── IT Spend (sliceable by category / vendor / function / deployment) ─────

  itSpend: {
    totalAnnual: 680,           // $M — 4.2% of $16.2B revenue
    peerBenchmark: 502,         // $M — 3.1% of revenue (peer median)
    excessVsPeer: 178,          // $M above peer benchmark annually

    byCategory: [
      { category: 'Software / Licensing',          amount: 204, pct: 30 },
      { category: 'Infrastructure & Hosting',       amount: 136, pct: 20 },
      { category: 'IT Staff & Contractors',         amount: 170, pct: 25 },
      { category: 'AI & Data Initiatives',          amount: 94,  pct: 14 },
      { category: 'Cybersecurity',                  amount: 48,  pct:  7 },
      { category: 'Telecom & Connectivity',         amount: 28,  pct:  4 },
    ],

    byVendor: [
      { vendor: 'Bloomberg',          category: 'OMS / Data',        annualSpend: 42,  contractEnd: 'Dec 2026', autoRenew: true  },
      { vendor: 'BlackRock (Aladdin)', category: 'Risk Platform',     annualSpend: 38,  contractEnd: 'Mar 2027', autoRenew: false },
      { vendor: 'Salesforce',          category: 'CRM / Cloud',       annualSpend: 14,  contractEnd: 'Aug 2026', autoRenew: false },
      { vendor: 'Microsoft Azure',     category: 'Cloud Platform',    annualSpend: 22,  contractEnd: 'ongoing',  autoRenew: true  },
      { vendor: 'SS&C (Advent Geneva)',category: 'Fund Accounting',   annualSpend: 12,  contractEnd: 'Jun 2026', autoRenew: false },
      { vendor: 'Charles River (SS&C)',category: 'Compliance / OMS',  annualSpend: 8,   contractEnd: 'Sep 2026', autoRenew: false },
      { vendor: 'Workday',             category: 'HCM / Finance',     annualSpend: 4.2, contractEnd: 'Dec 2027', autoRenew: true  },
      { vendor: 'AWS',                 category: 'Cloud (DR)',         annualSpend: 3.8, contractEnd: 'ongoing',  autoRenew: true  },
      { vendor: 'Tableau (Salesforce)',category: 'Analytics',         annualSpend: 1.8, contractEnd: 'Feb 2027', autoRenew: false },
    ],

    byBusinessFunction: [
      { function: 'Investment Management (OMS/PMS)',  amount: 42,  pct: 6.2 },
      { function: 'Risk Analytics',                   amount: 38,  pct: 5.6 },
      { function: 'Client Management (CRM/Portal)',   amount: 14,  pct: 2.1 },
      { function: 'Fund Accounting / Finance',        amount: 12,  pct: 1.8 },
      { function: 'Compliance & Regulatory',          amount: 8,   pct: 1.2 },
      { function: 'Cloud Infrastructure',             amount: 25.8,pct: 3.8 },
      { function: 'AI & Data Initiatives',            amount: 94,  pct: 13.8 },
      { function: 'HR / Workforce',                   amount: 4.2, pct: 0.6 },
      { function: 'IT Operations & Support',          amount: 170, pct: 25.0 },
      { function: 'Cybersecurity',                    amount: 48,  pct: 7.1 },
    ],

    byDeploymentModel: [
      { model: 'On-Premise',      amount: 238, pct: 35 },
      { model: 'Cloud (Azure)',   amount: 170, pct: 25 },
      { model: 'SaaS',            amount: 170, pct: 25 },
      { model: 'Vendor-Hosted',   amount: 68,  pct: 10 },
      { model: 'Cloud (AWS)',     amount: 34,  pct:  5 },
    ],

    capexVsOpex: {
      capex: 136, // $M — 20% (infrastructure investment, system implementations)
      opex: 544,  // $M — 80% (licenses, staff, maintenance, cloud)
      note: 'High OpEx ratio reflects legacy on-premise maintenance burden and AI initiative cost',
    },

    shadowItEstimate: 18, // $M — estimated ungoverned SaaS spend across business units
  },

  // ─── Projects in Flight ───────────────────────────────────────────────────

  projectsInFlight: [
    {
      name: 'Bloomberg AIM Modernisation (Phase 4)',
      status: 'planning',
      budget: 22,              // $M approved
      budgetSpent: 0,          // fourth attempt — not yet started
      timeline: '24 months',
      owner: 'Michael Santos (Head of Technology)',
      startDate: null,
      targetDate: '2028-06',
      risk: 'CRITICAL',
      dependencies: ['CDO hire', 'CRO governance framework', 'Bloomberg cooperation on API access'],
      note: '3 prior attempts failed. Current approach: API middleware layer rather than core replacement. Not yet started as of April 2026.',
    },
    {
      name: 'Salesforce FSC Adoption Programme',
      status: 'in-flight',
      budget: 6,               // $M incremental
      budgetSpent: 1.2,
      timeline: '18 months',
      owner: 'Raj Malhotra (CIO)',
      startDate: '2026-02',
      targetDate: '2027-08',
      risk: 'HIGH',
      dependencies: ['Advisor change management programme', 'SSO integration with Bloomberg AIM'],
      note: 'Target: 85% adoption. Currently 44%. Without SSO to Bloomberg, advisors have no reason to switch. The SSO dependency is blocking adoption.',
    },
    {
      name: 'AI Governance Framework',
      status: 'not-started',
      budget: 4.2,             // $M
      budgetSpent: 0,
      timeline: '6 months once started',
      owner: 'CDO (VACANT)',
      startDate: null,
      targetDate: null,
      risk: 'CRITICAL',
      dependencies: ['CDO hire — prerequisite'],
      note: 'CRO has frozen all new AI deployments until this programme exists. 11-month CDO vacancy means this has not progressed. Unlocks $94M AI portfolio.',
    },
    {
      name: 'Golden Record Data Programme',
      status: 'not-started',
      budget: 12,              // $M
      budgetSpent: 0,
      timeline: '12 months once started',
      owner: 'CDO (VACANT)',
      startDate: null,
      targetDate: null,
      risk: 'CRITICAL',
      dependencies: ['CDO hire — prerequisite', 'AI Governance Framework'],
      note: 'Foundational dependency for 18 of 28 AI initiatives. Not started. 14 data silos remain unresolved. 3-day reporting lag directly caused by missing golden record architecture.',
    },
    {
      name: 'MAS FEAT Remediation',
      status: 'in-flight',
      budget: 1.8,             // $M
      budgetSpent: 0.4,
      timeline: '3 months to compliance',
      owner: 'Sarah Chen (CRO)',
      startDate: '2026-03',
      targetDate: '2026-06',
      risk: 'CRITICAL',
      dependencies: ['AI model documentation — currently zero models documented', 'CIO cooperation on model inventory'],
      note: 'MAS FEAT overdue 4 months. $2.4B Singapore AUM at regulatory risk. CRO leading remediation. Requires complete AI model inventory which does not exist.',
    },
  ],

  // ─── Contracts ────────────────────────────────────────────────────────────

  contracts: [
    {
      vendor: 'Bloomberg (AIM + Terminal)',
      category: 'OMS / Data',
      annualSpend: 42,         // $M
      contractEnd: '2026-12',
      autoRenew: true,
      slaTerms: '99.9% uptime, 4hr RTO',
      actualUptime: 99.91,
      slaCredit: 0,            // $0 — uptime met
      leveragePoints: 'Migration threat (Charles River + Aladdin OMS) is the only leverage. Bloomberg knows switching cost is high. Negotiate at renewal for API access improvements as condition of renewal.',
      note: 'Auto-renews December 2026. No API modernisation commitment in current contract. This is the time to negotiate API terms.',
    },
    {
      vendor: 'BlackRock Aladdin',
      category: 'Risk Platform',
      annualSpend: 38,         // $M
      contractEnd: '2027-03',
      autoRenew: false,
      slaTerms: '99.8% uptime, monthly stress testing cadence',
      actualUptime: 99.84,
      slaCredit: 0,
      leveragePoints: 'Stress testing cadence not meeting SEC daily requirement — this is a contract gap that Aladdin must remediate or provide credit for. Also: Aladdin AI features (not activated) should be negotiated into existing contract at renewal.',
      note: 'March 2027 renewal. SEC daily stress testing gap gives leverage. Negotiate daily cadence as baseline requirement with penalty clause.',
    },
    {
      vendor: 'Salesforce (FSC + Einstein)',
      category: 'CRM / AI',
      annualSpend: 14,         // $M ongoing
      contractEnd: '2026-08',
      autoRenew: false,
      slaTerms: '99.9% uptime, standard Salesforce SLA',
      actualUptime: 99.93,
      slaCredit: 0,
      leveragePoints: '$38M implementation already committed creates lock-in risk. August 2026 renewal is the moment to negotiate: Einstein activation SLAs, adoption targets, and penalties for platform delivery gaps.',
      note: 'Renewal August 2026. 44% adoption after 18 months is a contract performance issue — use it to negotiate remediation plan and price reduction.',
    },
    {
      vendor: 'SS&C (Advent Geneva)',
      category: 'Fund Accounting',
      annualSpend: 12,         // $M
      contractEnd: '2026-06',
      autoRenew: false,
      slaTerms: '99.7% uptime, T+1 NAV reporting',
      actualUptime: 99.72,
      slaCredit: 0,
      leveragePoints: 'June 2026 renewal approaching. SS&C Eze (alternative fund accounting) is viable competitor. Negotiate cloud migration roadmap as condition of renewal.',
      note: 'Approaching renewal. Evaluate SS&C Eze migration vs Geneva renewal. Cloud migration would reduce 3-day reporting lag.',
    },
    {
      vendor: 'Charles River (SS&C)',
      category: 'Compliance / IMS',
      annualSpend: 8,          // $M
      contractEnd: '2026-09',
      autoRenew: false,
      slaTerms: '99.8% uptime',
      actualUptime: 99.81,
      slaCredit: 0,
      leveragePoints: 'September 2026 renewal. Charles River Cloud migration (from on-premise) unlocks AI compliance monitoring. Negotiate cloud migration roadmap at renewal.',
      note: 'On-premise deployment blocks AI compliance features. Cloud migration adds ~$1.2M annually but unlocks MAS FEAT-compliant AI monitoring.',
    },
  ],
}
