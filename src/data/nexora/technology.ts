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
}
