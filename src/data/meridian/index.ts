export { meridianFinancials } from './financials'
export { meridianTechnology } from './technology'
export { meridianClinical } from './clinical'
export { meridianLeadership } from './leadership'

export const meridianHealth = {
  org: {
    name: "Meridian Health System",
    shortName: "Meridian",
    type: "Integrated Delivery Network",
    headquarters: "Charlotte, NC",
    states: ["NC", "SC", "VA", "TN"],
    employees: 42000,
    physicians: 3800,
    revenue: 11.2,
    operatingMargin: 1.8,
    targetOperatingMargin: 4.0,
  },
  hospitals: {
    total: 23,
    totalBeds: 6800,
    occupancyRate: 71,
    annualDischarges: 210000,
  },
  healthPlan: {
    totalCoveredLives: 187000,
    medicareAdvantage: {
      lives: 61000,
      starRating: 3.5,
      premiumRevenue: 920,
    },
  },
  technology: {
    ehr: {
      vendor: "Epic",
      optimizationScore: 58,
      knownGaps: [
        "Blue Ridge facilities still on legacy Epic version",
        "Only 12 of 47 Cogito dashboards live",
        "MyChart adoption at 34% vs 60% target",
        "Prior auth automation at only 23% of payers",
      ],
    },
    rcm: {
      vendor: "Ensemble Health Partners",
      contractValue: 48,
      denialRate: 18.2,
      benchmarkDenialRate: 12.0,
      denialWriteOff2023: 94,
      cleanClaimRate: 87,
      daysInAR: 52,
      priorAuthOverturnRate: 61,
      priorAuthAvgDays: 4.2,
      priorAuthPeerDays: 1.8,
    },
  },
  financials: {
    revenue2023: 11.2,
    operatingMargin2023: 1.8,
    targetOperatingMargin: 4.0,
    itBudget2024: 340,
    itBudgetBreakdown: {
      infrastructure: 98,
      applications: 124,
      security: 34,
      projectsAndTransformation: 84,
    },
    consultingSpend2023: 67,
  },
  strategicPriorities: [
    "Achieve 4% operating margin by FY2026",
    "Complete Blue Ridge integration",
    "Grow Medicare Advantage to 4.0 star rating",
    "Reduce RCM denial rate below 10%",
    "Unified data platform across all 23 hospitals",
  ],
  contradictions: [
    "IT budget increased 12% but 67% allocated to run-the-business leaving only 25% for transformation",
    "Board mandated 4% margin by FY2026 but approved only $84M for transformation vs $200M needed",
    "CIO hired to drive transformation but CDO role vacant — CIO carrying both jobs",
    "RCM outsourced at $48M per year but vendor missing SLAs with $8M penalties never enforced",
    "Prior auth AI evaluation in progress but Epic module already purchased and only 23% deployed",
    "Blue Ridge Cerner migration 22 months overdue — original go-live June 2023 — now Q2 2026 — $8.4M stranded cost, 22,847 patient records with duplicate MRN risk",
    "Epic optimization score reported as 71/100 in board materials — CIO's own assessment: 44-47/100 — 34% of clinical documentation happening outside Epic in workarounds",
    "Net collection rate reported as 94.2% (internal methodology) — HFMA-standard calculation: 87.1% — $31M annual gap",
    "Denial write-off reported as $94M — total economic impact $127M including $33M in rework labor and secondary write-offs",
    "Coding AI outperforming committed target — but model retrain in Q3 2026 is unmonitored risk, and 28-FTE coder reduction plan may trigger union discussion in NC — neither flagged to CFO",
    "Sepsis AI described as 'in pilot at 2 hospitals' — now live at 5, failing at 3, blocked at 13 — COO says 18-month scaling timeline but CMIO says technical deployment is 4-6 months",
  ],
  interviewInsights: {
    cio: "Marcus Webb: I inherited a mess. We have 23 hospitals that operate like 23 different companies. I need 6 months just to do a proper assessment.",
    cmio: "Dr. Sarah Okonkwo: Epic is not the problem. We never finished the implementation. Nobody owns optimization.",
    cfo: "Robert Chen: The $94M denial write-off keeps me up at night. Ensemble promised 12% denial rate by end of 2023. We are at 18.2%.",
    coo: "James Whitfield: Show me a vendor who will put their fees at risk and I will listen.",
  },
}
