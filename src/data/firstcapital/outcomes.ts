interface Milestone {
  month: number
  description: string
  status: "completed" | "in-progress" | "upcoming"
  actualResult?: string
}

interface MonthlyDataPoint {
  month: number
  label: string
  value: number
}

interface Initiative {
  id: string
  name: string
  status: "active" | "completed" | "at-risk" | "on-track"
  startDate: string
  monthsLive: number
  executiveSponsor: string
  programManager: string
  investment: number
  committedOutcome: string
  baseline: {
    metric: string
    value: number
    unit: string
    measuredDate: string
  }
  committed: {
    metric: string
    value: number
    unit: string
    targetDate: string
  }
  current: {
    metric: string
    value: number
    unit: string
    measuredDate: string
    trend: "improving" | "declining" | "stable"
    onTrack: boolean
    scheduleVariance: string
  }
  monthlyProgress: MonthlyDataPoint[]
  milestones: Milestone[]
  insights: string[]
  risks: string[]
  nextActions: string[]
}

export const firstCapitalOutcomes: {
  summary: {
    activeInitiatives: number
    totalInvestmentActive: number
    initiativesOnTrack: number
    initiativesAtRisk: number
    projectedAnnualSavings: number
  }
  initiatives: Initiative[]
} = {
  summary: {
    activeInitiatives: 3,
    totalInvestmentActive: 6500000,
    initiativesOnTrack: 2,
    initiativesAtRisk: 1,
    projectedAnnualSavings: 8400000,
  },
  initiatives: [
    {
      id: "init-001",
      name: "Digital Onboarding Redesign",
      status: "at-risk",
      startDate: "October 2025",
      monthsLive: 6,
      executiveSponsor: "Sandra Liu (CDO)",
      programManager: "Rachel Kim (Digital Product)",
      investment: 2100000,
      committedOutcome: "Reduce account opening abandonment rate from 64% to 35% by April 2026",
      baseline: {
        metric: "Account opening abandonment rate",
        value: 64,
        unit: "percent",
        measuredDate: "September 2025",
      },
      committed: {
        metric: "Account opening abandonment rate",
        value: 35,
        unit: "percent",
        targetDate: "April 2026",
      },
      current: {
        metric: "Account opening abandonment rate",
        value: 51,
        unit: "percent",
        measuredDate: "March 2026",
        trend: "improving",
        onTrack: false,
        scheduleVariance: "Improving but behind committed pace. At current trajectory, will reach 46-48% by April target, not 35%.",
      },
      monthlyProgress: [
        { month: 1, label: "Oct 2025", value: 64 },
        { month: 2, label: "Nov 2025", value: 62 },
        { month: 3, label: "Dec 2025", value: 59 },
        { month: 4, label: "Jan 2026", value: 57 },
        { month: 5, label: "Feb 2026", value: 53 },
        { month: 6, label: "Mar 2026", value: 51 },
      ],
      milestones: [
        {
          month: 1,
          description: "Baseline measurement and analytics instrumentation",
          status: "completed",
          actualResult: "Hotjar session recording deployed. Socure timeout root cause identified: 8% of applications timing out at identity verification step.",
        },
        {
          month: 2,
          description: "Remove redundant form fields and add progress indicator",
          status: "completed",
          actualResult: "Removed 3 redundant fields. Progress indicator added. Average time reduced from 18 minutes to 14 minutes. Abandonment moved from 64% to 59%.",
        },
        {
          month: 3,
          description: "Socure timeout fix and mobile layout optimization",
          status: "completed",
          actualResult: "Socure timeout reduced from 8% to 2.4%. Mobile-first layout reduced mobile abandonment by 8 points. Overall abandonment moved to 59% then 57%.",
        },
        {
          month: 6,
          description: "Target: 50% abandonment (on-pace milestone)",
          status: "completed",
          actualResult: "Reached 51%. One point behind milestone. Primary remaining driver: accounts not visible until next business day (batch sync). This requires FedNow API layer — not yet deployed.",
        },
        {
          month: 9,
          description: "Target: 35% abandonment (committed outcome)",
          status: "upcoming",
        },
      ],
      insights: [
        "Improvement from 64% to 51% confirmed — surface-level friction has been successfully reduced",
        "Primary remaining barrier: accounts invisible until next business day — customers open accounts and cannot log in until tomorrow",
        "This root cause requires FedNow API layer real-time sync — currently not in scope and not funded",
        "Without the batch sync fix, modeling suggests floor of approximately 44-46% abandonment",
        "CDO Sandra Liu has escalated the FedNow dependency to CIO and CEO — unresolved",
        "Mobile abandonment rate has improved 12 points — mobile-first layout was high-leverage change",
      ],
      risks: [
        "CRITICAL: 35% committed target is not achievable without real-time account visibility (FedNow API layer)",
        "CDO faces board review in April 2026 with metric gap — likely needs to renegotiate target or fund API layer",
        "If target is missed, budget for digital onboarding Phase 2 may be cut",
        "Competitor neobanks averaging 28% abandonment — even 35% target leaves First Capital at disadvantage",
      ],
      nextActions: [
        "Escalate FedNow API layer as blocker to CEO and CFO — tie to $340M commercial deposit risk to create funding urgency",
        "Prepare board update: 13-point improvement in 6 months, API layer needed for final 16 points",
        "Scope and price the real-time account visibility feature as a discrete FedNow deliverable",
        "Deploy AI-assisted application flow as 2-point improvement opportunity while API layer is funded",
      ],
    },
    {
      id: "init-002",
      name: "Fraud Detection Enhancement",
      status: "on-track",
      startDate: "January 2026",
      monthsLive: 3,
      executiveSponsor: "James Park (CRO)",
      programManager: "David Chen (Risk Technology)",
      investment: 1800000,
      committedOutcome: "Reduce annual fraud losses from $7M to under $4.8M by December 2026 — first phase commitment $2.1M baseline to $1.2M on card fraud by June 2026",
      baseline: {
        metric: "Annual card fraud losses (annualized)",
        value: 2100000,
        unit: "USD annualized",
        measuredDate: "December 2025",
      },
      committed: {
        metric: "Annual card fraud losses (annualized)",
        value: 1200000,
        unit: "USD annualized",
        targetDate: "June 2026",
      },
      current: {
        metric: "Annual card fraud losses (annualized based on Q1 actuals)",
        value: 1800000,
        unit: "USD annualized",
        measuredDate: "March 2026",
        trend: "improving",
        onTrack: true,
        scheduleVariance: "On track. Early results show $300K quarterly improvement run rate — projects to $1.2M by June 2026 at current pace.",
      },
      monthlyProgress: [
        { month: 0, label: "Dec 2025 baseline", value: 2100000 },
        { month: 1, label: "Jan 2026", value: 2050000 },
        { month: 2, label: "Feb 2026", value: 1920000 },
        { month: 3, label: "Mar 2026", value: 1800000 },
      ],
      milestones: [
        {
          month: 1,
          description: "FICO Falcon rules engine optimization — high-confidence rules added",
          status: "completed",
          actualResult: "14 new velocity rules deployed. Card fraud losses reduced from $2.1M to $2.05M annualized in first month. False positive rate held steady — not increased.",
        },
        {
          month: 2,
          description: "Merchant category risk scoring enhancement",
          status: "completed",
          actualResult: "MCCs with elevated fraud rates flagged for enhanced authentication. $130K monthly fraud reduction achieved. Fraud rate on high-risk MCCs down 28%.",
        },
        {
          month: 3,
          description: "Real-time transaction velocity monitoring",
          status: "completed",
          actualResult: "Real-time velocity monitoring live on card transactions. $1.8M annualized run rate — $300K improvement from baseline. On pace for June 2026 target.",
        },
        {
          month: 6,
          description: "Target: $1.2M annualized card fraud losses",
          status: "upcoming",
        },
        {
          month: 12,
          description: "ML model deployment (FICO Falcon ML or Featurespace) — Wave 1 AI initiative",
          status: "upcoming",
        },
      ],
      insights: [
        "Phase 1 (rules optimization) showing strong early results — $300K quarterly run rate improvement",
        "False positive rate has not increased despite more restrictive rules — good signal for ML readiness",
        "Merchant category risk scoring was the highest-leverage rules change — targeting MCCs not velocity",
        "Model Risk Management framework being built in parallel — CRO requirement for Phase 2 ML deployment",
        "FedNow API layer will enable real-time Zelle fraud scoring in Phase 2 — $2.8M Zelle fraud still untouched",
      ],
      risks: [
        "Phase 1 is rules optimization only — ML deployment (Phase 2) requires model risk governance approval",
        "FedNow API layer needed for real-time Zelle fraud scoring — Zelle losses of $2.8M not yet addressable",
        "Rules-based approach will hit diminishing returns after month 6 — ML required for sustained improvement",
        "Customer friction risk if rules become too restrictive — currently managed but bears monitoring",
      ],
      nextActions: [
        "Complete Model Risk Management framework by May 2026 — gates ML deployment",
        "Evaluate FICO Falcon ML vs Featurespace for Phase 2 — RFP in April 2026",
        "Coordinate with CIO on FedNow API layer timeline — Zelle fraud requires real-time data",
        "Report Q1 progress to CRO and CFO — positive early results support Wave 1 AI investment case",
      ],
    },
    {
      id: "init-003",
      name: "Mobile App Rebuild",
      status: "active",
      startDate: "March 2026",
      monthsLive: 1,
      executiveSponsor: "Sandra Liu (CDO)",
      programManager: "Michael Park (Mobile Engineering)",
      investment: 2600000,
      committedOutcome: "Raise App Store rating from 2.8 to 4.0+ by September 2026 (Month 6 milestone)",
      baseline: {
        metric: "Apple App Store rating",
        value: 2.8,
        unit: "stars out of 5",
        measuredDate: "February 2026",
      },
      committed: {
        metric: "Apple App Store rating",
        value: 4.0,
        unit: "stars out of 5",
        targetDate: "September 2026",
      },
      current: {
        metric: "Apple App Store rating",
        value: 2.8,
        unit: "stars out of 5",
        measuredDate: "March 2026",
        trend: "stable",
        onTrack: true,
        scheduleVariance: "Very early — 1 month live. No rating improvement expected until major feature releases in months 3-4.",
      },
      monthlyProgress: [
        { month: 0, label: "Feb 2026 baseline", value: 2.8 },
        { month: 1, label: "Mar 2026", value: 2.8 },
      ],
      milestones: [
        {
          month: 1,
          description: "Technical baseline and architecture decisions",
          status: "completed",
          actualResult: "Performance profiling complete. Login flow identified as primary complaint driver — average 8.2 seconds vs industry benchmark of 2 seconds. Real-time balance display roadmapped pending FedNow API layer. Design system established.",
        },
        {
          month: 2,
          description: "Login performance optimization — target: under 3 seconds",
          status: "in-progress",
        },
        {
          month: 3,
          description: "Navigation redesign and transfer flow simplification",
          status: "upcoming",
        },
        {
          month: 4,
          description: "First major release — target for first rating improvement signal",
          status: "upcoming",
        },
        {
          month: 6,
          description: "Target: 4.0 App Store rating",
          status: "upcoming",
        },
      ],
      insights: [
        "Month 1 is infrastructure and discovery — no rating improvement expected until month 4 first major release",
        "Login speed (8.2 seconds vs 2 second benchmark) is the single highest-rated complaint in 2,840 reviews",
        "Real-time balance display (second-highest complaint) requires FedNow API layer — dependency managed",
        "App Store rating improvements require sustained positive reviews over 60-90 days — not instant",
        "Google Play rating is 3.1 — combined improvement will require parallel effort, 6-week lag vs App Store",
        "CDO has identified a 4.0 target as achievable without real-time balances — login fix alone should drive 0.8-1.0 point improvement",
      ],
      risks: [
        "App Store rating improvement takes 60-90 days of positive reviews after feature release — timing is tight for September target",
        "Real-time balance display requires FedNow API layer — if not live by month 4, top complaint remains unaddressed",
        "Login performance fix requires FIS HORIZON API improvement — cross-team dependency",
        "Resource contention: digital onboarding rebuild and mobile rebuild share the same engineering team",
      ],
      nextActions: [
        "Complete login performance fix by end of April 2026 — highest-leverage single change",
        "Coordinate with CIO on FIS HORIZON API screen pop fix — shared dependency with call center",
        "Set up App Store review monitoring and response protocol — positive responses improve rating",
        "Establish beta tester program for month 4 release — early positive reviews seed rating improvement",
      ],
    },
  ],
}
