export const nexoraOperations = {
  source: 'client' as const,
  uploadedBy: 'Priya Krishnamurthy (COO)',
  uploadedAt: '2026-04-01',
  confidence: 0.87,

  supplyChain: {
    supplierCount: 2400,
    riskScoredSuppliers: 0,
    riskScoredPct: 0,
    avgLeadTimeDays: 47,
    targetLeadTimeDays: 28,
    leadTimeGap: 19,
    onTimeDeliveryRate: 71,      // %
    benchmarkOnTimeDelivery: 88, // %
    supplierConcentration: 'Top 20 suppliers = 68% of COGS',
    climateRiskAssessed: false,
    note: '0 of 2,400 suppliers risk-scored. Climate risk assessment not started. SAP R/3 EOL 2027 is the primary data gap for supplier visibility.',
  },

  erpSystems: [
    {
      region: 'North America',
      system: 'SAP S/4HANA',
      age: 4,
      status: 'modern',
      cloudDeployed: true,
      annualCost: 28,   // $M
      aiReady: true,
      note: 'NA is the only fully modern ERP. Beacon for other regions.',
    },
    {
      region: 'UK & Ireland',
      system: 'Oracle EBS',
      age: 14,
      status: 'aging',
      cloudDeployed: false,
      annualCost: 12,   // $M
      aiReady: false,
      note: 'Oracle EBS R12 — extended support only. Integration to SAP S/4HANA required for unified reporting.',
    },
    {
      region: 'Continental Europe',
      system: 'SAP R/3',
      age: 18,
      status: 'CRITICAL',
      cloudDeployed: false,
      annualCost: 18,   // $M
      aiReady: false,
      eolDate: '2027-12',
      note: 'EOL December 2027. 8,200 customizations. This is the most urgent ERP decision — 18-month migration timeline means starting NOW.',
    },
    {
      region: 'Nordics',
      system: 'Microsoft Dynamics 365',
      age: 3,
      status: 'modern',
      cloudDeployed: true,
      annualCost: 6,    // $M
      aiReady: true,
      note: 'Modern, cloud-native. Not integrated with SAP data model — separate data pipeline required.',
    },
    {
      region: 'Asia Pacific',
      system: 'Custom SAP',
      age: 9,
      status: 'fragmented',
      cloudDeployed: false,
      annualCost: 14,   // $M
      aiReady: false,
      note: 'Custom-built on legacy SAP. 4,100 customizations unique to APAC. Migration path unclear.',
    },
    {
      region: 'Middle East',
      system: 'SAP Business One',
      age: 7,
      status: 'underspecced',
      cloudDeployed: false,
      annualCost: 4,    // $M
      aiReady: false,
      note: 'SAP B1 designed for SME, not enterprise-scale retail. Underspecced for $2.8B regional operation.',
    },
  ],

  erpSummary: {
    totalERPCount: 6,
    modernSystems: 2,
    legacySystems: 4,
    totalAnnualERPCost: 82,  // $M
    unifiedDataModel: false,
    unifiedReportingCapable: false,
    aiReadyRegions: ['North America', 'Nordics'],
    criticalEOLCount: 1,     // SAP R/3 Continental Europe
    estimatedUnificationCost: 140, // $M (SAP S/4HANA global rollout estimate)
  },

  inventory: {
    turnoverRatio: 4.2,
    benchmarkTurns: 6.8,
    turnoverGap: -2.6,
    excessInventoryDollars: 900,   // $M
    forecastAccuracy: 62,           // %
    benchmarkForecastAccuracy: 84, // %
    slowMovingInventoryPct: 18,    // % of total inventory
    seasonalVariance: 'High — inadequate AI demand forecasting',
    o9Implementation: {
      status: '40% complete after 18 months',
      investedToDate: 6.8, // $M
      remainingToComplete: 3.6, // $M (estimated)
      note: 'Finish vs restart decision required. Completion recommended — 85% vs 58% success rate.',
    },
  },

  stores: {
    totalStores: 2400,
    underperformingStores: 340,
    underperformingPct: 14.2,
    revenuePerSqFt: 621,          // $
    targetRevenuePerSqFt: 820,    // $
    benchmarkRevenuePerSqFt: 780, // $ industry median
    avgStoreSize: 18000,          // sq ft
    storeFormatMix: {
      flagship: 85,
      standard: 1680,
      smallFormat: 490,
      outlet: 145,
    },
    closuresPlanned: 0,           // no announced closure programme
    note: '340 underperforming stores represent $2.1B revenue but drag on blended margin.',
  },

  shrinkage: {
    rate: 2.8,          // % of revenue
    dollars: 515,       // $M
    benchmark: 1.4,     // % industry median
    benchmarkDollars: 257, // $M
    excess: 259,        // $M above benchmark
    breakdown: {
      external: 42,     // %
      internal: 31,     // %
      admin: 27,        // % (errors, damage, waste)
    },
    aiDetectionDeployed: false,
    cameraAiPiloted: true,
    pilotStores: 12,
    pilotResult: '34% shrinkage reduction in pilot stores',
    scaleDecisionPending: true,
  },
}
