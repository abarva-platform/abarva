export const meridianHealth = {
  org: {
    name: "Meridian Health System",
    shortName: "Meridian",
    type: "Integrated Delivery Network",
    headquarters: "Charlotte, NC",
    states: ["NC", "SC", "VA", "TN"],
    founded: 1987,
    recentMerger: "Merged with Blue Ridge Health Network in 2022",
    employees: 42000,
    physicians: 3800,
    nurses: 14000,
    revenue: 11.2, // $B
    operatingMargin: 1.8, // %
    cashOnHand: 2.1, // $B
    creditRating: "A-",
  },

  hospitals: {
    total: 23,
    academicMedicalCenters: 2,
    communityHospitals: 16,
    criticalAccessHospitals: 5,
    totalBeds: 6800,
    occupancyRate: 71, // %
    averageLengthOfStay: 4.2, // days
    annualDischarges: 210000,
    annualEdVisits: 890000,
    annualOutpatientVisits: 4200000,
  },

  healthPlan: {
    name: "Meridian Health Plan",
    totalCoveredLives: 187000,
    commercial: {
      lives: 94000,
      premiumRevenue: 680, // $M
      medicalLossRatio: 87, // %
      memberSatisfactionScore: 3.8, // out of 5
    },
    medicareAdvantage: {
      lives: 61000,
      starRating: 3.5,
      premiumRevenue: 920, // $M
      medicalLossRatio: 89, // %
      riskAdjustmentRevenue: 145, // $M
    },
    medicaid: {
      lives: 32000,
      premiumRevenue: 210, // $M
      medicalLossRatio: 91, // %
    },
  },

  valueBasedCare: {
    percentRevenueAtRisk: 41, // %
    acosParticipating: 3,
    totalAttributedLives: 156000,
    sharedSavingsEarned2023: 23, // $M
    qualityScorePercentile: 58, // national percentile
    gaps: [
      "Diabetes management — bottom quartile vs. peers",
      "Readmission rate 14.2% vs. 11.8% target",
      "Medication adherence tracking incomplete across post-merger entities",
      "Care management workflows not unified post-merger",
    ],
  },

  technology: {
    ehr: {
      vendor: "Epic",
      modules: ["Inpatient", "Ambulatory", "MyChart", "Willow", "Beaker"],
      version: "2023 (partially upgraded — Blue Ridge still on 2021)",
      optimizationScore: 58, // out of 100 — self-assessed
      knownGaps: [
        "Blue Ridge facilities still on legacy Epic version",
        "Epic Cogito (analytics) underutilized — only 12 of 47 planned dashboards live",
        "MyChart adoption at 34% — target is 60%",
        "Prior auth automation deployed but only 23% of payer contracts connected",
      ],
    },
    rcm: {
      vendor: "Ensemble Health Partners (outsourced)",
      contractValue: 48, // $M/year
      denialRate: 18.2, // % — industry benchmark is 11.4%
      denialWriteOff2023: 94, // $M
      cleanClaimRate: 87, // % — target is 95%
      daysInAR: 52, // days — target is 42
      priorAuthDenials: 34000, // annual
      priorAuthOverturnRate: 61, // % — high overturn = denials are wrong
      codingAccuracyRate: 91, // % — target is 96%
    },
    analytics: {
      primaryPlatform: "Epic Cogito + Tableau",
      dataWarehouse: "Azure Synapse (partially implemented)",
      aiInitiatives: [
        "Sepsis prediction model (live, 2 hospitals)",
        "Readmission risk scoring (pilot, 1 hospital)",
        "Prior auth AI (vendor evaluation in progress)",
      ],
      dataGovernanceMaturity: "Level 2 of 5",
      reportingBacklog: 340, // outstanding report requests
    },
    otherSystems: [
      { name: "Workday", function: "HR + Finance", status: "Live" },
      { name: "Kronos", function: "Workforce Management", status: "Live — integration gaps post-merger" },
      { name: "ServiceNow", function: "IT Service Management", status: "Live" },
      { name: "Infor Lawson", function: "Legacy Finance (Blue Ridge)", status: "Sunsetting — migration planned 2025" },
      { name: "Cerner (legacy)", function: "2 Blue Ridge hospitals not yet migrated", status: "Migration overdue by 8 months" },
    ],
  },

  leadership: {
    ceo: { name: "Dr. Patricia Holloway", tenure: "6 years", background: "Physician executive, value-based care champion" },
    cio: { name: "Marcus Webb", tenure: "8 months", background: "Former CIO at regional health system — first 90 days focused on assessment" },
    cdo: { name: "Vacant", note: "CDO role approved by board, search in progress — CIO carrying both roles" },
    cfo: { name: "Robert Chen", tenure: "4 years", background: "Healthcare finance, focused on margin recovery post-merger" },
    cmio: { name: "Dr. Sarah Okonkwo", tenure: "2 years", background: "Physician informaticist — Epic champion but frustrated with optimization pace" },
    coo: { name: "James Whitfield", tenure: "11 years", background: "Operations executive — skeptical of technology-first solutions" },
  },

  financials: {
    revenue2023: 11.2, // $B
    operatingIncome2023: 201, // $M
    operatingMargin2023: 1.8, // %
    targetOperatingMargin: 4.0, // % — board mandate
    itBudget2024: 340, // $M
    itBudgetAsPercentRevenue: 3.0, // %
    itBudgetBreakdown: {
      infrastructure: 98, // $M
      applications: 124, // $M
      security: 34, // $M
      projectsAndTransformation: 84, // $M
    },
    consultingSpend2023: 67, // $M
    mergerIntegrationCostsRemaining: 145, // $M
    costSavingsTargetFY2025: 180, // $M
  },

  strategicPriorities: [
    "Achieve 4% operating margin by FY2026 (currently 1.8%)",
    "Complete Blue Ridge integration — technology, clinical, operational",
    "Grow Medicare Advantage from 3.5 to 4.0 star rating",
    "Reduce RCM denial rate from 18.2% to below 10