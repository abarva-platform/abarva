type FailureRisk = 'Low' | 'Medium' | 'High'
type WaveNumber = 1 | 2 | 3

interface FinancialModel {
  annualSavings: number
  implementationCost: number
  roi: number
  netPresentValue: number
  paybackMonths: number
  threeYearValue: number
}

interface Opportunity {
  id: string
  name: string
  description: string
  owner: string
  annualSavings: number
  implementationCost: number
  roi: number
  timeToValueMonths: number
  dataReadiness: number
  failureRisk: FailureRisk
  wave: WaveNumber
  financialModel: FinancialModel
  failurePatterns: string[]
  successConditions: string[]
  tags: string[]
}

interface WaveFinancials {
  wave: WaveNumber
  name: string
  totalInvestment: number
  annualValue: number
  threeYearCumulativeValue: number
  initiativeIds: string[]
  prerequisite: string
}

interface MeridianOpportunitiesData {
  generatedDate: string
  opportunities: Opportunity[]
  waveFinancials: WaveFinancials[]
  portfolioSummary: {
    totalOpportunities: number
    totalAnnualValue: number
    totalInvestment: number
    blendedROI: number
    threeYearCumulativeValue: number
    wave1Count: number
    wave2Count: number
    wave3Count: number
    lowRiskCount: number
    mediumRiskCount: number
    highRiskCount: number
  }
}

export const meridianOpportunities: MeridianOpportunitiesData = {
  generatedDate: "April 2026",

  opportunities: [
    {
      id: "opp-001",
      name: "Prior Authorization Automation",
      description:
        "Deploy AI-powered prior authorization automation across all 23 hospitals and 187K health plan lives. Only 23% of payers currently connected to Epic prior auth module despite CMS January 2026 mandate. Cohere Health recommended (88/100 AbarVa score). 89% verified automation rate. Eliminates 4.2-day average approval time vs 1.8-day SLA. Reduces manual prior auth FTE by 68%.",
      owner: "Diane Kowalski (VP Revenue Cycle)",
      annualSavings: 28,
      implementationCost: 4,
      roi: 7,
      timeToValueMonths: 6,
      dataReadiness: 72,
      failureRisk: "Medium",
      wave: 1,
      financialModel: {
        annualSavings: 28,
        implementationCost: 4,
        roi: 7,
        netPresentValue: 68,
        paybackMonths: 5,
        threeYearValue: 80,
      },
      failurePatterns: [
        "Payer connectivity gaps in Medicaid managed care — 3 NC plans not in Cohere payer network",
        "Physician resistance to AI-generated clinical criteria justifications",
        "Blue Ridge hospitals on legacy workflow requiring separate integration track",
        "CMS compliance deadline creates implementation timeline pressure — delay risk if contract not signed by May 2026",
      ],
      successConditions: [
        "Contract signed by May 15, 2026 to meet January 2027 go-live",
        "Epic integration team allocated — 2 dedicated FTEs for 6 months",
        "Physician communication plan developed before go-live",
        "Ensemble Health Partners cooperation on prior auth data access",
      ],
      tags: ["wave-1", "rcm", "compliance", "quick-win"],
    },
    {
      id: "opp-002",
      name: "RCM Denial Prevention AI",
      description:
        "Deploy ML-based claim denial prediction model to flag high-risk claims before submission. Denial model already validated internally on Ensemble data (8 months, $280K invested). Blocked by MLOps gap and Ensemble data access. Active initiative live 4 months, currently at 16.1% denial rate vs 18.2% baseline — on track if current trajectory holds. Target: 12.4% denial rate, $42M annual savings.",
      owner: "Diane Kowalski (VP Revenue Cycle)",
      annualSavings: 42,
      implementationCost: 6,
      roi: 7,
      timeToValueMonths: 9,
      dataReadiness: 68,
      failureRisk: "Low",
      wave: 1,
      financialModel: {
        annualSavings: 42,
        implementationCost: 6,
        roi: 7,
        netPresentValue: 98,
        paybackMonths: 6,
        threeYearValue: 120,
      },
      failurePatterns: [
        "Q2 2026 payer contract change may reclassify denial categories — baseline validation required before Q2",
        "Ensemble Health Partners has been inconsistent on data access — 3 incidents in first 4 months",
        "No MLOps monitoring — model drift could go undetected between retrains",
        "Coding AI interaction: both models affect claim accuracy — coordinate so they reinforce each other",
      ],
      successConditions: [
        "Baseline methodology validated before Q2 payer contract change",
        "Ensemble data access formalized in SLA amendment",
        "MLOps monitoring deployed alongside model",
        "Denial prevention and coding AI roadmaps coordinated",
      ],
      tags: ["wave-1", "rcm", "active", "high-value"],
    },
    {
      id: "opp-003",
      name: "Sepsis Prediction Expansion",
      description:
        "Scale proven sepsis AI model from 2 hospitals (Carolinas East, Blue Ridge Memorial) to all 23 hospitals. Model validated: 31% mortality reduction at pilot hospitals. Stuck 18 months due to MLOps gap and lack of physician champion program. Active initiative live 8 months — behind committed target due to adoption gaps at 3 community hospitals. Fastest path to enterprise value in portfolio given proven model.",
      owner: "Dr. Sarah Okonkwo (CMIO)",
      annualSavings: 18,
      implementationCost: 2,
      roi: 9,
      timeToValueMonths: 3,
      dataReadiness: 89,
      failureRisk: "Low",
      wave: 1,
      financialModel: {
        annualSavings: 18,
        implementationCost: 2,
        roi: 9,
        netPresentValue: 44,
        paybackMonths: 4,
        threeYearValue: 52,
      },
      failurePatterns: [
        "Physician adoption below threshold at 3 community hospitals — physician champion program not yet funded",
        "Blue Ridge East has not completed nursing workflow integration",
        "Technical scaling is fast (4-6 months per CMIO/IT); organizational change is the bottleneck",
        "Alert fatigue at receiving hospitals could suppress sepsis alert response rate",
      ],
      successConditions: [
        "Physician champion program approved and funded by COO — May 2026",
        "Blue Ridge East nursing workflow integration completed before hospital goes live",
        "Alert tuning completed to differentiate sepsis alerts from BPA alert noise",
        "MLOps monitoring deployed at all hospital sites",
      ],
      tags: ["wave-1", "clinical", "active", "proven-model"],
    },
    {
      id: "opp-004",
      name: "Readmission Prevention AI",
      description:
        "Deploy ML readmission risk scoring across enterprise using Epic data. All-cause 30-day readmission rate 14.2% vs 12.1% peer median. Internal readmission risk model in development (4 months, $160K invested) — not yet deployed. Value-based care contracts put 41% of revenue at risk; lower readmission directly improves shared savings. Targets: 11.8% readmission rate, $24M annual savings.",
      owner: "Dr. Marcus Thompson (VP Population Health)",
      annualSavings: 24,
      implementationCost: 3,
      roi: 8,
      timeToValueMonths: 6,
      dataReadiness: 71,
      failureRisk: "Medium",
      wave: 1,
      financialModel: {
        annualSavings: 24,
        implementationCost: 3,
        roi: 8,
        netPresentValue: 58,
        paybackMonths: 5,
        threeYearValue: 69,
      },
      failurePatterns: [
        "Internal model uses Epic data only — excludes post-acute and community care data for patients in other networks",
        "Care transition workflows vary significantly across 23 hospitals — standardization required",
        "CDO vacancy means no data governance owner for cross-network data integration",
        "Social determinants data absent from current model — reduces predictive accuracy",
      ],
      successConditions: [
        "Complete internal model validation before deployment",
        "Standardize care transition workflows in top 10 highest-readmission hospitals first",
        "CDO hire enables post-acute data integration in Wave 2",
        "Integrate with sepsis AI — coordinate interventions for sepsis patients at discharge",
      ],
      tags: ["wave-1", "clinical", "value-based-care"],
    },
    {
      id: "opp-005",
      name: "Clinical Documentation AI (Ambient)",
      description:
        "Deploy ambient AI documentation across all physician-facing clinical encounters. Physicians spend 2.1 hours/shift on documentation vs 1.3-hour benchmark — 68% attribute burnout to EHR burden. Pilot in one ED department completed 10 months ago with 94% physician satisfaction and no deployment decision made. Highest dollar opportunity in portfolio ($31M annual savings) but highest adoption risk. Requires strong physician champion program and CMIO-led governance.",
      owner: "Dr. Sarah Okonkwo (CMIO)",
      annualSavings: 31,
      implementationCost: 8,
      roi: 4,
      timeToValueMonths: 12,
      dataReadiness: 55,
      failureRisk: "High",
      wave: 2,
      financialModel: {
        annualSavings: 31,
        implementationCost: 8,
        roi: 4,
        netPresentValue: 62,
        paybackMonths: 12,
        threeYearValue: 85,
      },
      failurePatterns: [
        "Physician adoption is the primary failure mode — 'high satisfaction in pilots, zero scale' pattern repeated across healthcare industry",
        "90th percentile alert fatigue will suppress physician willingness to adopt additional AI touchpoints",
        "No CMIO project team or budget currently allocated — governance gap",
        "Blue Ridge physicians have higher change resistance than legacy Meridian physicians per COO",
        "HIPAA ambient recording compliance varies by state — NC, SC, VA, TN requirements differ",
      ],
      successConditions: [
        "Alert fatigue addressed in Wave 1 before ambient documentation deployment",
        "CMIO project team funded and staffed",
        "Physician champion program proven at Wave 1 sepsis initiative before reapplying to documentation",
        "State-by-state HIPAA ambient recording compliance review completed",
        "Pilot scale plan: 3 hospitals first, then enterprise — not simultaneous rollout",
      ],
      tags: ["wave-2", "clinical", "high-value", "high-risk", "physician-adoption"],
    },
    {
      id: "opp-006",
      name: "Care Gap Closure AI",
      description:
        "ML-based care gap prediction and automated patient outreach to close HEDIS gaps for 187K MA covered lives. MA star rating 3.5 vs 4.0 target — $34M quality bonus at risk. AWV completion 46% vs 65% target. Medication adherence 68th percentile. Mental health access 58th percentile. Automated outreach model built by VP Population Health — cannot scale to full 187K lives without MLOps and Azure Synapse. Wave 2 to allow CDO hire and MLOps deployment as prerequisites.",
      owner: "Dr. Marcus Thompson (VP Population Health)",
      annualSavings: 34,
      implementationCost: 5,
      roi: 7,
      timeToValueMonths: 12,
      dataReadiness: 64,
      failureRisk: "Medium",
      wave: 2,
      financialModel: {
        annualSavings: 34,
        implementationCost: 5,
        roi: 7,
        netPresentValue: 78,
        paybackMonths: 8,
        threeYearValue: 97,
      },
      failurePatterns: [
        "Azure Synapse prerequisite 14 months overdue — CDO hire required to unblock data platform",
        "HEDIS measurement period is fixed — care gap interventions need 6+ months to register in star rating",
        "Two HEDIS measures (mental health access, medication adherence) may have attribution methodology issues — challenge plan-side before investing in clinical interventions",
        "Member outreach response rates typically 12-18% for digital channels in MA population",
      ],
      successConditions: [
        "CDO hired and Azure Synapse data platform completed in Wave 1",
        "HEDIS attribution methodology challenges filed with health plan before Q3 2026",
        "Outreach response rate assumptions stress-tested against Meridian member demographics",
        "Measurement period alignment: interventions must begin by Q3 2026 to impact next star rating cycle",
      ],
      tags: ["wave-2", "medicare-advantage", "population-health", "stars"],
    },
    {
      id: "opp-007",
      name: "Coding AI (ICD-10/CPT Automation)",
      description:
        "NLP-based coding AI for facility claims — ICD-10 and CPT code suggestion from Epic clinical notes. Active initiative live 14 months. OUTPERFORMING: cost per claim $1.58 vs $1.60 committed, $17.2M annual run rate vs $16M committed (108% of target). Outcome fee of $2.9M triggered. Expansion to professional fee coding not yet scoped.",
      owner: "Diane Kowalski (VP Revenue Cycle)",
      annualSavings: 16,
      implementationCost: 2,
      roi: 8,
      timeToValueMonths: 4,
      dataReadiness: 81,
      failureRisk: "Low",
      wave: 1,
      financialModel: {
        annualSavings: 16,
        implementationCost: 2,
        roi: 8,
        netPresentValue: 40,
        paybackMonths: 4,
        threeYearValue: 46,
      },
      failurePatterns: [
        "Coder headcount reduction plan may trigger union discussion in 2 states — HR involvement required",
        "Payer mix shift toward MA in Q4 may increase code complexity, reducing automation rate",
        "Model retrain Q3 2026 — validate performance does not regress post-retrain",
        "Professional fee coding expansion (not yet scoped) would require separate Epic integration",
      ],
      successConditions: [
        "Outcome fee $2.9M verified and invoiced to Meridian",
        "Professional fee coding expansion scoped and budgeted for Wave 2",
        "Model retrain Q3 2026 monitored and validated",
        "HR engagement on coder team transition plan",
      ],
      tags: ["wave-1", "rcm", "active", "outperforming"],
    },
    {
      id: "opp-008",
      name: "Supply Chain Optimization",
      description:
        "ML demand forecasting for medical supply ordering across all 23 hospitals. 18% stockout rate vs 8% benchmark. $8M annual emergency procurement waste from reactive ordering. Historical supply consumption data exists in Workday and departmental systems but fragmented across Blue Ridge transition. Wave 3 to allow data platform stabilization.",
      owner: "James Whitfield (COO)",
      annualSavings: 12,
      implementationCost: 3,
      roi: 4,
      timeToValueMonths: 18,
      dataReadiness: 48,
      failureRisk: "High",
      wave: 3,
      financialModel: {
        annualSavings: 12,
        implementationCost: 3,
        roi: 4,
        netPresentValue: 24,
        paybackMonths: 14,
        threeYearValue: 33,
      },
      failurePatterns: [
        "Supply data fragmented across Workday, legacy supply chain systems, and Blue Ridge transition systems — data readiness 48% is the primary risk",
        "Clinical staff resistance to AI-driven supply ordering — 'what if the model is wrong' concern",
        "Vendor contract structures may not allow AI-driven ordering variations without amendment",
        "GPO contract compliance requirements may constrain model optimization",
      ],
      successConditions: [
        "Data platform (Azure Synapse) complete before Wave 3 initiation",
        "Blue Ridge supply chain systems migrated before supply AI deployment",
        "GPO contract review to identify ordering flexibility",
        "Pilot at 3 hospitals before enterprise rollout",
      ],
      tags: ["wave-3", "operational", "supply-chain"],
    },
    {
      id: "opp-009",
      name: "Staff Scheduling AI",
      description:
        "ML optimization of nurse scheduling to reduce travel nurse dependency. Active initiative in implementation — live 2 months, first measurement in 4 weeks. Baseline established at $148M travel nurse spend (includes $6M shadow agency spend identified post-baseline). Target: $31M reduction. Kronos integration complete at 14 hospitals; 6 legacy and 3 Blue Ridge paper-scheduling facilities on separate track.",
      owner: "Linda Reyes (CNO)",
      annualSavings: 22,
      implementationCost: 4,
      roi: 6,
      timeToValueMonths: 9,
      dataReadiness: 77,
      failureRisk: "Medium",
      wave: 2,
      financialModel: {
        annualSavings: 22,
        implementationCost: 4,
        roi: 6,
        netPresentValue: 48,
        paybackMonths: 8,
        threeYearValue: 62,
      },
      failurePatterns: [
        "Float pool 180 nurses below target — limits model effectiveness even with accurate forecasting",
        "3 Blue Ridge facilities on paper scheduling — excluded from initial measurement cohort",
        "Union consultation in VA and TN not yet initiated — 60-day notice required for scheduling changes",
        "Shadow agency spend ($6M) was outside original tracking system — creates baseline reconciliation complexity",
        "COO measurement methodology sign-off pending — first checkpoint could be disputed",
      ],
      successConditions: [
        "COO signs off on measurement methodology before May 2026 checkpoint",
        "Union consultation initiated in VA and TN immediately",
        "Float pool recruitment plan funded — 180-nurse gap directly caps savings potential",
        "Shadow agency spend captured in baseline going forward",
        "Blue Ridge facilities on paper scheduling get interim data capture solution",
      ],
      tags: ["wave-2", "operational", "active", "labor"],
    },
    {
      id: "opp-010",
      name: "Patient Flow Optimization",
      description:
        "ML-based patient flow and bed management optimization to reduce length of stay and ED boarding. Current LOS 5.2 days vs 4.6-day peer median — 0.6-day gap at $14M annual impact. ED door-to-provider time 42 minutes vs 30-minute benchmark. Opportunity to use Epic ADT data and census patterns to predict discharges and optimize bed assignments in real time.",
      owner: "James Whitfield (COO)",
      annualSavings: 19,
      implementationCost: 3,
      roi: 6,
      timeToValueMonths: 9,
      dataReadiness: 69,
      failureRisk: "Medium",
      wave: 2,
      financialModel: {
        annualSavings: 19,
        implementationCost: 3,
        roi: 6,
        netPresentValue: 42,
        paybackMonths: 7,
        threeYearValue: 54,
      },
      failurePatterns: [
        "Discharge planning workflows inconsistent across 23 hospitals — requires standardization before AI can optimize",
        "COO change resistance to technology affecting clinical workflows",
        "Post-acute capacity constraints (SNF, home health) may limit discharge rate improvement",
        "Blue Ridge hospitals have different case mix than legacy Meridian — separate model tuning required",
      ],
      successConditions: [
        "Discharge planning workflow standardization completed at 10 highest-LOS hospitals",
        "COO endorsement and clinical champion per facility",
        "Post-acute network capacity assessment included in patient flow model",
        "Epic ADT data quality review before model training",
      ],
      tags: ["wave-2", "operational", "clinical", "throughput"],
    },
    {
      id: "opp-011",
      name: "Predictive Maintenance",
      description:
        "ML-based predictive maintenance for biomedical equipment and facilities infrastructure across all 23 hospitals. Current reactive maintenance model. $8M annual opportunity from reduced emergency repairs, equipment downtime, and preventive part replacement optimization. Data readiness low (52%) — biomedical equipment sensor data exists in disparate systems. Wave 3 to allow data platform prerequisite.",
      owner: "James Whitfield (COO)",
      annualSavings: 8,
      implementationCost: 2,
      roi: 4,
      timeToValueMonths: 18,
      dataReadiness: 52,
      failureRisk: "Low",
      wave: 3,
      financialModel: {
        annualSavings: 8,
        implementationCost: 2,
        roi: 4,
        netPresentValue: 16,
        paybackMonths: 14,
        threeYearValue: 22,
      },
      failurePatterns: [
        "Biomedical equipment sensor data is fragmented — 8 different CMMS systems across 23 hospitals",
        "Blue Ridge facilities have older equipment with limited sensor connectivity",
        "Facilities and biomedical team change resistance to AI-triggered maintenance schedules",
      ],
      successConditions: [
        "CMMS system consolidation (separate initiative) completed before predictive maintenance AI",
        "Pilot at 2-3 largest facilities with best sensor coverage",
        "Maintenance team engaged in model design and threshold setting",
      ],
      tags: ["wave-3", "operational", "facilities"],
    },
    {
      id: "opp-012",
      name: "MA Stars Improvement AI",
      description:
        "AI-powered Medicare Advantage star rating improvement through automated HEDIS gap closure and care management optimization. 3.5 stars vs 4.0 target — $34M quality bonus at risk. Key gaps: diabetes management (62nd percentile), mental health access (58th), medication adherence (68th). Two measures may have attribution methodology issues not yet challenged with health plan. Requires Azure Synapse and CDO for data foundation.",
      owner: "Dr. Marcus Thompson (VP Population Health)",
      annualSavings: 34,
      implementationCost: 5,
      roi: 7,
      timeToValueMonths: 12,
      dataReadiness: 61,
      failureRisk: "Medium",
      wave: 2,
      financialModel: {
        annualSavings: 34,
        implementationCost: 5,
        roi: 7,
        netPresentValue: 78,
        paybackMonths: 8,
        threeYearValue: 97,
      },
      failurePatterns: [
        "HEDIS measurement period timing — interventions must begin 6+ months before measurement closes",
        "Azure Synapse prerequisite not complete — cannot scale outreach model without data platform",
        "Mental health access and medication adherence HEDIS measures may have attribution errors — unchallenged",
        "Member outreach response rates for MA population typically 12-18%",
        "CDO vacancy blocks data architecture decisions required for 187K-life scale",
      ],
      successConditions: [
        "Immediately: File HEDIS attribution challenges with health plan for mental health access and medication adherence",
        "CDO hire in Wave 1 prerequisite",
        "Azure Synapse data platform complete before Wave 2 deployment",
        "HEDIS intervention timing: begin no later than Q3 2026 for next measurement cycle",
        "Combine with care gap closure initiative (opp-006) — shared data infrastructure",
      ],
      tags: ["wave-2", "medicare-advantage", "stars", "population-health", "high-value"],
    },
  ],

  waveFinancials: [
    {
      wave: 1,
      name: "Foundation and Quick Wins",
      totalInvestment: 21,
      annualValue: 148,
      threeYearCumulativeValue: 400,
      initiativeIds: ["opp-001", "opp-002", "opp-003", "opp-004", "opp-007"],
      prerequisite: "None — begin immediately",
    },
    {
      wave: 2,
      name: "Core Clinical and Operational AI",
      totalInvestment: 25,
      annualValue: 120,
      threeYearCumulativeValue: 360,
      initiativeIds: ["opp-005", "opp-006", "opp-009", "opp-010", "opp-012"],
      prerequisite: "CDO hired; MLOps deployed; Azure Synapse data platform complete",
    },
    {
      wave: 3,
      name: "Transformative and Strategic AI",
      totalInvestment: 5,
      annualValue: 20,
      threeYearCumulativeValue: 60,
      initiativeIds: ["opp-008", "opp-011"],
      prerequisite: "Wave 1 and Wave 2 complete; data platform stable; Blue Ridge integration complete",
    },
  ],

  portfolioSummary: {
    totalOpportunities: 12,
    totalAnnualValue: 288,
    totalInvestment: 51,
    blendedROI: 6.8,
    threeYearCumulativeValue: 864,
    wave1Count: 5,
    wave2Count: 5,
    wave3Count: 2,
    lowRiskCount: 4,
    mediumRiskCount: 6,
    highRiskCount: 2,
  },
}
