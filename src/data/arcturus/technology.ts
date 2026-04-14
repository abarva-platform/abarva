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
  },

  clientPortal: {
    platform: 'Salesforce FSC',
    investedToDate: 38,    // $M
    adoptionRate: 44,      // % active clients
    targetAdoption: 85,    // %
    npsScore: 31,
    industryNpsMedian: 58,
    goLiveDate: '2024-08',
    mobileAppRating: 2.8,  // out of 5
    selfServiceRate: 28,   // % of queries resolved without advisor
    issues: [
      'Single sign-on not wired to core banking data',
      'Performance analytics 72-hour lag vs real-time expectation',
      'Mobile app missing portfolio rebalancing feature',
      'Advisor dashboard not connected to Bloomberg AIM positions',
    ],
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
}
