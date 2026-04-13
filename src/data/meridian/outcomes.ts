type InitiativeStatus = 'ahead' | 'behind' | 'on_track' | 'early' | 'implementation'

interface BaselineMetric {
  value: number
  unit: string
  description: string
}

interface CommittedMetric {
  value: number
  unit: string
  annualSavings: number
}

interface CurrentMetric {
  value: number
  unit: string
  annualRunRate?: number
  savingsToDate: number
}

interface OutcomeFee {
  percentage: number
  basis: string
  verifiedSavings: number
  feeAmount: number
}

interface Initiative {
  id: string
  name: string
  owner: string
  goLiveDate: string
  monthsLive: number
  baseline: BaselineMetric
  committed: CommittedMetric
  current: CurrentMetric
  status: InitiativeStatus
  percentOfCommitted: number
  rootCause?: string
  recommendedAction?: string
  riskFlags: string[]
  outcomeFee?: OutcomeFee
  nextMilestone: string
}

interface WaveFinancials {
  wave: number
  name: string
  investment: number
  annualValue: number
  initiatives: string[]
}

interface MeridianOutcomesData {
  asOfDate: string
  activeInitiatives: Initiative[]
  waveFinancials: WaveFinancials[]
  portfolioSummary: {
    totalSavingsToDate: number
    totalCommittedAnnualSavings: number
    totalCurrentAnnualRunRate: number
    percentOfPortfolioOnTrack: number
    initiativesAhead: number
    initiativesBehind: number
    initiativesEarly: number
    initiativesInImplementation: number
    threeyearCumulativeValue: number
    totalInvestment: number
    blendedROI: number
  }
}

export const meridianOutcomes: MeridianOutcomesData = {
  asOfDate: "April 2026",

  activeInitiatives: [
    {
      id: "outcome-001",
      name: "Sepsis Prediction AI",
      owner: "Dr. Sarah Okonkwo (CMIO) / Dr. Marcus Thompson (VP Population Health)",
      goLiveDate: "August 2025",
      monthsLive: 8,
      baseline: {
        value: 14.2,
        unit: "% readmission rate",
        description: "Sepsis-related 30-day readmission rate across enterprise; $48M annual cost of care",
      },
      committed: {
        value: 11.8,
        unit: "% readmission rate",
        annualSavings: 18,
      },
      current: {
        value: 12.4,
        unit: "% readmission rate",
        annualRunRate: 14.4,
        savingsToDate: 10.2,
      },
      status: "behind",
      percentOfCommitted: 43,
      rootCause:
        "Physician adoption at 3 community hospitals (Blue Ridge East, Piedmont Regional, Carolina Coast) below threshold — alert acknowledgment rate 34% vs 70% required for clinical impact. Nursing workflow integration not completed at those sites.",
      recommendedAction:
        "Maestro intervention required: physician champion program at the 3 lagging hospitals. Identify 1 physician champion per hospital, run 4-week blitz. Estimate 90-day recovery to on-track status. Do not count those 3 hospitals in current savings calculation until adoption crosses 70%.",
      riskFlags: [
        "3 of 23 hospitals below 70% physician adoption threshold",
        "Blue Ridge East specifically has not completed nursing workflow integration",
        "Without course correction, will miss committed savings target by ~$4M this year",
        "Physician champion budget not yet approved",
      ],
      nextMilestone: "Physician champion program approval by COO — targeted May 2026",
    },
    {
      id: "outcome-002",
      name: "Coding AI (ICD-10/CPT Automation)",
      owner: "Diane Kowalski (VP Revenue Cycle)",
      goLiveDate: "February 2025",
      monthsLive: 14,
      baseline: {
        value: 2.40,
        unit: "$ cost per claim coded",
        description: "Fully-loaded cost per claim including coder labor, quality review, and error rework",
      },
      committed: {
        value: 1.60,
        unit: "$ cost per claim coded",
        annualSavings: 16,
      },
      current: {
        value: 1.58,
        unit: "$ cost per claim coded",
        annualRunRate: 17.2,
        savingsToDate: 19.8,
      },
      status: "ahead",
      percentOfCommitted: 108,
      outcomeFee: {
        percentage: 15,
        basis: "Verified savings above committed baseline",
        verifiedSavings: 19.2,
        feeAmount: 2.9,
      },
      riskFlags: [
        "Coder headcount reduction plan may trigger union discussion in 2 states — needs HR involvement",
        "Payer mix shift toward MA in Q4 may impact code complexity and automation rate",
        "Model retrain scheduled for Q3 — validate performance does not regress post-retrain",
      ],
      rootCause: undefined,
      recommendedAction:
        "Outcome fee of $2.9M triggered and due. Schedule verified savings review with CFO. Discuss expansion to professional fee coding (currently only facility coding automated).",
      nextMilestone: "Outcome fee verification meeting with CFO — May 2026",
    },
    {
      id: "outcome-003",
      name: "RCM Denial Prevention AI",
      owner: "Diane Kowalski (VP Revenue Cycle) / Ensemble Health Partners",
      goLiveDate: "December 2025",
      monthsLive: 4,
      baseline: {
        value: 18.2,
        unit: "% denial rate",
        description:
          "Claim denial rate at submission; baseline established August-November 2025 pre-deployment",
      },
      committed: {
        value: 12.4,
        unit: "% denial rate",
        annualSavings: 42,
      },
      current: {
        value: 16.1,
        unit: "% denial rate",
        annualRunRate: 18.6,
        savingsToDate: 3.4,
      },
      status: "early",
      percentOfCommitted: 37,
      rootCause: undefined,
      recommendedAction:
        "Early stage — current trajectory (2.1 point improvement in 4 months) is consistent with on-track path to 12.4% target if maintained. Do not adjust committed target yet.",
      riskFlags: [
        "CRITICAL: Q2 2026 payer contract change with Blue Shield NC may reclassify 1,800 authorization codes — could shift denial categories and invalidate baseline measurement. Validate baseline methodology is insulated from this change before Q2.",
        "Ensemble cooperation on data sharing has been inconsistent — 3 data access incidents in first 4 months",
        "No MLOps monitoring in place — model drift could go undetected",
        "Prior auth automation (separate initiative) will interact with denial prevention model — coordinate roadmaps",
      ],
      nextMilestone: "Q2 payer contract change validation — baseline audit due April 30, 2026",
    },
    {
      id: "outcome-004",
      name: "Staff Scheduling AI",
      owner: "Linda Reyes (CNO) / James Whitfield (COO)",
      goLiveDate: "February 2026",
      monthsLive: 2,
      baseline: {
        value: 148,
        unit: "$ million travel nurse spend",
        description:
          "Verified travel nurse spend including shadow agency spend; $142M primary contracts + $6M shadow agencies identified post-baseline",
      },
      committed: {
        value: 31,
        unit: "$ million reduction in travel nurse spend",
        annualSavings: 22,
      },
      current: {
        value: 0,
        unit: "$ savings measured",
        annualRunRate: 0,
        savingsToDate: 0,
      },
      status: "implementation",
      percentOfCommitted: 0,
      rootCause: undefined,
      recommendedAction:
        "First measurement checkpoint in 4 weeks (May 2026). Implementation progressing — Kronos integration complete at 14 hospitals. 6 legacy hospitals and 3 paper-scheduling Blue Ridge facilities are on separate integration track with 8-week delay. Do not project savings until first measurement confirms model is functioning as designed.",
      riskFlags: [
        "3 Blue Ridge facilities still on paper scheduling — excluded from first measurement cohort",
        "Float pool 180 nurses below target — limits model's ability to shift away from travel nurses even with accurate forecasting",
        "Union consultation in VA and TN not yet initiated — scheduling changes require 60-day notice",
        "Shadow agency spend ($6M) was not in original baseline — included now, which raises the ceiling for credited savings",
        "COO has not formally signed off on measurement methodology — schedule alignment meeting before first checkpoint",
      ],
      nextMilestone: "First savings measurement checkpoint — May 2026",
    },
  ],

  waveFinancials: [
    {
      wave: 1,
      name: "Foundation and Quick Wins",
      investment: 21,
      annualValue: 148,
      initiatives: ["Prior Auth Automation", "RCM Denial Prevention", "Sepsis Expansion", "Readmission Prevention", "Coding AI"],
    },
    {
      wave: 2,
      name: "Core Clinical and Operational AI",
      investment: 25,
      annualValue: 120,
      initiatives: ["Clinical Documentation AI", "Care Gap Closure", "Staff Scheduling AI", "Patient Flow", "MA Stars AI"],
    },
    {
      wave: 3,
      name: "Transformative and Strategic AI",
      investment: 5,
      annualValue: 20,
      initiatives: ["Supply Chain Optimization", "Predictive Maintenance"],
    },
  ],

  portfolioSummary: {
    totalSavingsToDate: 33.4,
    totalCommittedAnnualSavings: 98,
    totalCurrentAnnualRunRate: 31.8,
    percentOfPortfolioOnTrack: 50,
    initiativesAhead: 1,
    initiativesBehind: 1,
    initiativesEarly: 1,
    initiativesInImplementation: 1,
    threeyearCumulativeValue: 864,
    totalInvestment: 51,
    blendedROI: 6.8,
  },
}
