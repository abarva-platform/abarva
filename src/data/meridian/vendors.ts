interface VendorBreakdown {
  license?: number
  support?: number
  professionalServices?: number
  infrastructure?: number
  productivity?: number
  security?: number
  transactionFees?: number
  implementation?: number
  integrations?: number
  parallel?: number
}

interface SLAPerformance {
  metric: string
  contracted: string
  actual: string
  creditAvailable?: number
  breachStatus: 'Compliant' | 'Breach' | 'Critical Breach'
}

interface BenchmarkData {
  peerAvg: number
  overpayment: number
  overpaymentNote: string
}

interface VendorRecord {
  name: string
  category: string
  annualSpend: number
  breakdown: VendorBreakdown
  benchmark: BenchmarkData
  contractExpiry: string
  slaPerformance: SLAPerformance
  optimizationOpportunities: string[]
  immediateActions: string[]
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
}

interface ShadowIT {
  totalSpend: number
  subscriptionCount: number
  departmentLevelTools: number
  duplicateTools: number
  consolidationSavings: number
  topCategories: { category: string; toolCount: number; estimatedSpend: number }[]
}

interface MeridianVendorsData {
  totalITBudget: number
  vendors: VendorRecord[]
  shadowIT: ShadowIT
  totalOptimizationOpportunity: number
  optimizationSummary: {
    immediate: number
    contractRenegotiation: number
    decommission: number
    shadowITConsolidation: number
  }
}

export const meridianVendors: MeridianVendorsData = {
  totalITBudget: 504,

  vendors: [
    {
      name: "Epic Systems",
      category: "Electronic Health Record (EHR)",
      annualSpend: 84,
      breakdown: {
        license: 52,
        support: 18,
        professionalServices: 14,
      },
      benchmark: {
        peerAvg: 71,
        overpayment: 13,
        overpaymentNote:
          "Epic license fee 18% above peer IDN median. Price freeze leverage available at upcoming 18-month contract renewal. Meridian is below-median user of licensed modules (optimization score 71/100 vs 89/100 for top performers) — upgrade fees may be renegotiated.",
      },
      contractExpiry: "18 months (Q4 2025)",
      slaPerformance: {
        metric: "Epic optimization enablement — dedicated PS hours per quarter",
        contracted: "200 hours/quarter",
        actual: "94 hours/quarter delivered",
        creditAvailable: 0,
        breachStatus: "Breach",
      },
      optimizationOpportunities: [
        "Price freeze or reduction at contract renewal (18 months) — $8-13M savings",
        "Renegotiate PS hours to include outcome-based milestones tied to optimization score",
        "Consolidate Blue Ridge Epic migration under existing enterprise license vs separate agreement",
        "Audit module entitlements — 47 Cogito dashboards licensed, 12 active; potential license right-sizing of $3M",
      ],
      immediateActions: [
        "Initiate contract renegotiation preparation now — 18-month window creates negotiating leverage",
        "Reclaim unused PS hours from current contract year",
        "Document module utilization gap before renewal discussions",
      ],
      priority: "Critical",
    },
    {
      name: "Microsoft Azure",
      category: "Cloud Infrastructure & Productivity",
      annualSpend: 62,
      breakdown: {
        infrastructure: 38,
        productivity: 14,
        security: 10,
      },
      benchmark: {
        peerAvg: 54,
        overpayment: 8,
        overpaymentNote:
          "Overprovisioned reserved instances and 140 idle VMs identified in Azure Cost Management audit. Immediate reclaim opportunity of $6.2M. Additional $1.8M from right-sizing 340 VMs below 20% utilization.",
      },
      contractExpiry: "Enterprise Agreement — annual renewal, October 2024",
      slaPerformance: {
        metric: "Azure SLA — 99.9% uptime for production workloads",
        contracted: "99.9% monthly uptime",
        actual: "99.7% — two incidents in Q3 impacting Epic-Azure connectivity",
        creditAvailable: 0.4,
        breachStatus: "Breach",
      },
      optimizationOpportunities: [
        "Immediate: Decommission 140 idle VMs — $6.2M immediate annual savings",
        "Right-size 340 VMs below 20% CPU utilization — $1.8M additional",
        "Renegotiate reserved instance commitments at EA renewal in October",
        "Implement Azure Cost Management governance and FinOps practice",
        "Consolidate M365 licensing tiers — E3 vs E5 audit across 42,000 employees",
      ],
      immediateActions: [
        "Run Azure Advisor recommendations report — idle VM decommission is 2-week project",
        "Assign FinOps owner before October EA renewal",
        "File SLA credit claim for Q3 connectivity incidents",
      ],
      priority: "Critical",
    },
    {
      name: "Ensemble Health Partners",
      category: "Revenue Cycle Management (RCM) Outsourcing",
      annualSpend: 28,
      breakdown: {
        transactionFees: 19,
        implementation: 6,
        support: 3,
      },
      benchmark: {
        peerAvg: 22,
        overpayment: 6,
        overpaymentNote:
          "Transaction fee structure not renegotiated since original contract. Net collection rate 87.1% actual vs 92% SLA — contract overpaying for underperformance. $2.1M in SLA credits unclaimed on prior auth SLA breach alone.",
      },
      contractExpiry: "22 months — termination clause: $14M fee",
      slaPerformance: {
        metric: "Prior authorization average approval time",
        contracted: "1.8 days average",
        actual: "4.2 days average (verified via Epic records)",
        creditAvailable: 2.1,
        breachStatus: "Critical Breach",
      },
      optimizationOpportunities: [
        "Claim $2.1M in SLA credits immediately — prior auth breach documented in Epic records",
        "Trigger net collection rate SLA review — 87.1% actual vs 92% contracted",
        "Renegotiate transaction fee structure with performance-based pricing",
        "Evaluate contract termination vs renegotiation: $14M termination fee vs $6M+ annual overpayment",
        "Implement parallel RCM AI (denial prediction, prior auth automation) to reduce dependency",
      ],
      immediateActions: [
        "Legal review of SLA credit clause — file claim within 60 days or waive Q3 credits",
        "Commission independent net collection rate audit using HFMA methodology",
        "Require Ensemble to submit 90-day performance improvement plan",
      ],
      priority: "Critical",
    },
    {
      name: "Workday",
      category: "Human Capital Management (HCM)",
      annualSpend: 18,
      breakdown: {
        license: 12,
        support: 4,
        integrations: 2,
      },
      benchmark: {
        peerAvg: 15,
        overpayment: 3,
        overpaymentNote:
          "Three duplicate HRIS modules identified: legacy ADP payroll still active in 6 Blue Ridge hospitals ($800K), Kronos scheduling overlap with Workday Time ($600K), separate learning management platform not consolidated into Workday Learning ($400K).",
      },
      contractExpiry: "31 months",
      slaPerformance: {
        metric: "Workday uptime SLA",
        contracted: "99.9% monthly",
        actual: "99.95%",
        breachStatus: "Compliant",
      },
      optimizationOpportunities: [
        "Consolidate ADP payroll in 6 Blue Ridge hospitals into Workday — $800K savings",
        "Decommission standalone learning management platform — $400K savings",
        "Resolve Kronos/Workday Time overlap — $600K savings",
        "Renegotiate license at renewal given module underutilization",
      ],
      immediateActions: [
        "Audit active Workday modules vs licensed modules",
        "Timeline ADP consolidation with Blue Ridge integration workstream",
      ],
      priority: "High",
    },
    {
      name: "Meditech (Blue Ridge Legacy)",
      category: "Legacy EHR — Active Decommission Target",
      annualSpend: 14,
      breakdown: {
        license: 9,
        support: 4,
        professionalServices: 1,
      },
      benchmark: {
        peerAvg: 0,
        overpayment: 14,
        overpaymentNote:
          "Pure stranded cost — running parallel to Epic across 8 remaining Blue Ridge hospitals. No clinical differentiation. Full decommission by Q3 2026 eliminates $14M/year in perpetuity. Migration 8 months overdue per original Blue Ridge integration timeline.",
      },
      contractExpiry: "Month-to-month — can terminate with 90-day notice",
      slaPerformance: {
        metric: "Legacy system stability — no meaningful SLA",
        contracted: "Best effort",
        actual: "3 outages in Q3 2024",
        breachStatus: "Compliant",
      },
      optimizationOpportunities: [
        "Accelerate Epic migration at remaining 8 Blue Ridge hospitals — eliminates $14M/year",
        "Negotiate early termination of Meditech contract (month-to-month)",
        "Each hospital migrated saves $1.75M/year — prioritize by readiness",
      ],
      immediateActions: [
        "Restart stalled Blue Ridge Epic migration program with dedicated project resources",
        "Identify which of 8 hospitals are highest readiness — migrate those first",
        "Do not sign any new Meditech service agreements",
      ],
      priority: "High",
    },
  ],

  shadowIT: {
    totalSpend: 38,
    subscriptionCount: 847,
    departmentLevelTools: 23,
    duplicateTools: 14,
    consolidationSavings: 18,
    topCategories: [
      { category: "Analytics and BI tools", toolCount: 87, estimatedSpend: 6.4 },
      { category: "Communication and collaboration", toolCount: 124, estimatedSpend: 4.8 },
      { category: "Project management", toolCount: 63, estimatedSpend: 3.2 },
      { category: "Clinical data capture (non-Epic)", toolCount: 41, estimatedSpend: 5.1 },
      { category: "Document management", toolCount: 58, estimatedSpend: 3.6 },
      { category: "HR and workforce tools", toolCount: 34, estimatedSpend: 2.8 },
      { category: "Other / unclassified", toolCount: 440, estimatedSpend: 12.1 },
    ],
  },

  totalOptimizationOpportunity: 68,

  optimizationSummary: {
    immediate: 8.3,
    contractRenegotiation: 24,
    decommission: 17.8,
    shadowITConsolidation: 18,
  },
}
