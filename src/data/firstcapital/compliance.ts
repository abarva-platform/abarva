interface MRA {
  id: string
  title: string
  severity: "Board-Level" | "Significant" | "Standard"
  examDate: string
  description: string
  specificFindings: string[]
  requiredActions: string[]
  ownerName: string
  ownerTitle: string
  deadline: string
  boardEscalationRequired: boolean
  status: "Open" | "In Progress" | "Closed"
  remediationProgress: string
  closureRisk: string
  abarvaOpportunity: string
}

interface CapitalRatio {
  metric: string
  firstCapital: number
  regulatoryMinimum: number
  wellCapitalizedThreshold: number
  status: "Well Capitalized" | "Adequately Capitalized" | "Below Minimum"
}

export const firstCapitalCompliance: {
  overview: {
    examiner: string
    primaryRegulator: string
    secondaryRegulator: string
    overallRating: string
    compositeRating: string
    lastExamDate: string
    nextExamDate: string
    examUrgency: string
    openMRAs: number
    openCFPBItems: number
  }
  mras: MRA[]
  cfpbItems: Array<{
    id: string
    title: string
    description: string
    riskLevel: "High" | "Medium" | "Low"
    deadline: string
    status: string
  }>
  bsaAmlFindings: {
    overallRating: string
    keyFindings: string[]
    programComponents: Array<{
      component: string
      rating: "Satisfactory" | "Needs Improvement" | "Unsatisfactory"
      notes: string
    }>
  }
  capitalRatios: CapitalRatio[]
  craRating: {
    overallRating: string
    lendingTest: string
    investmentTest: string
    serviceTest: string
    lastAssessmentDate: string
    notes: string
  }
  examinationSchedule: Array<{
    examiner: string
    examType: string
    scheduledDate: string
    scope: string
    firstCapitalReadiness: "Ready" | "At Risk" | "Not Ready"
    keyRisks: string[]
  }>
  complianceInvestments: Array<{
    initiative: string
    estimatedCost: number
    mraAddressed: string[]
    urgency: string
  }>
} = {
  overview: {
    examiner: "Office of the Comptroller of the Currency",
    primaryRegulator: "OCC",
    secondaryRegulator: "Federal Reserve Board",
    overallRating: "Satisfactory — with significant items requiring attention",
    compositeRating: "CAMELS composite 2 (Satisfactory) — at risk of downgrade to 3 if MRAs not resolved",
    lastExamDate: "March 2023",
    nextExamDate: "Q4 2026",
    examUrgency: "CRITICAL — 3 open MRAs must be remediated before Q4 2026 exam. MRA-1 requires board-level escalation by Q3 2026. Formal enforcement action risk if MRAs remain open at examination.",
    openMRAs: 3,
    openCFPBItems: 2,
  },
  mras: [
    {
      id: "MRA-1",
      title: "Real-Time Payments Risk Management and Controls",
      severity: "Board-Level",
      examDate: "March 2023",
      description: "The bank has not implemented FedNow or real-time payment capabilities despite 68% of peer institutions having deployed. The absence of a real-time payments risk management framework and transaction monitoring controls represents a significant gap relative to industry standards and creates both competitive and regulatory risk. The board has not formally addressed the real-time payments strategy gap, which the OCC finds unacceptable at the board governance level.",
      specificFindings: [
        "No FedNow implementation or approved implementation timeline despite 3+ years since FedNow launch",
        "No real-time transaction monitoring framework for instant payments",
        "Board has not received or approved a real-time payments strategy document",
        "Commercial deposit concentration risk from payment capability gap not quantified or reported to board",
        "No vendor assessment or RFP for real-time payments capability completed",
      ],
      requiredActions: [
        "Board must receive and approve a real-time payments strategy by Q3 2026 (board-level escalation)",
        "Complete vendor selection and contract execution for FedNow deployment",
        "Develop real-time payments fraud monitoring controls framework",
        "Quantify and report commercial deposit attrition risk from payment gap to board",
        "Establish go-live timeline and milestone plan for FedNow deployment",
      ],
      ownerName: "James Park",
      ownerTitle: "Chief Risk Officer",
      deadline: "Q3 2026 (board escalation) / Q4 2026 exam (closure)",
      boardEscalationRequired: true,
      status: "Open",
      remediationProgress: "No material progress. CIO has a technical plan but no vendor has been signed. Board has not received a strategy document. MRA-1 closure requires board action, not just technical remediation.",
      closureRisk: "CRITICAL — requires board-level action by Q3 2026. If not escalated to board before Q3, OCC has indicated this will be an automatic finding at Q4 exam. CRO James Park has personal accountability for this escalation.",
      abarvaOpportunity: "FedNow deployment via Finzly (87-day deployment) directly closes this MRA. AbarVa can deliver the board-level strategy document, vendor selection, and implementation milestone plan that the OCC requires. Closing MRA-1 is the centerpiece of the Q4 2026 exam readiness story.",
    },
    {
      id: "MRA-2",
      title: "BSA/AML System Deficiency — Technology and Automation Gap",
      severity: "Significant",
      examDate: "March 2023",
      description: "The bank's BSA/AML transaction monitoring system (NICE Actimize 8.1) is running 2 major versions behind current release, lacks ML-based detection capabilities, and produces an unacceptably high false positive rate of 94% against a benchmark of 45%. The bank's automated disposition rate of 34% is less than half the industry benchmark of 72%. These deficiencies create both a direct regulatory compliance risk and a fraud detection effectiveness risk.",
      specificFindings: [
        "NICE Actimize version 8.1 — 2 major releases behind current 10.2",
        "Missing ML transaction monitoring models released in versions 9.0 and 10.0",
        "AML false positive rate 94% vs 45% benchmark — analyst resources wasted on invalid alerts",
        "Automated disposition rate 34% vs 72% benchmark — 6 excess FTE at $1.08M annual cost",
        "SAR filing timeliness — 8% of SARs filed after 30-day deadline due to alert backlog",
        "Training programs for AML analysts not updated since 2021",
      ],
      requiredActions: [
        "Upgrade NICE Actimize to version 10.2 within 12 months of examination",
        "Achieve false positive rate below 60% within 18 months (interim milestone)",
        "Achieve automation rate above 60% within 18 months",
        "Update AML analyst training programs",
        "Demonstrate SAR timeliness improvement — all SARs filed within 30 days",
      ],
      ownerName: "James Park",
      ownerTitle: "Chief Risk Officer",
      deadline: "September 2026 (technology upgrade) / Q4 2026 exam (progress evidence)",
      boardEscalationRequired: false,
      status: "Open",
      remediationProgress: "Preliminary assessment of NICE Actimize 10.2 upgrade costs completed (Q1 2025). No contract executed. No timeline established. 3 years after examination with no material remediation progress.",
      closureRisk: "HIGH — NICE Actimize 10.2 upgrade takes 6-9 months. To show evidence of upgrade completion at Q4 2026 exam, contract must be signed by March 2026 at the latest. Already at risk of timeline.",
      abarvaOpportunity: "AML automation AI (Wave 1 opportunity) directly addresses this MRA. NICE Actimize 10.2 upgrade reduces false positives from 94% to 45% and automation rate from 34% to 72%. AbarVa can scope, contract, and deliver the upgrade as an MRA remediation project with exam-ready documentation.",
    },
    {
      id: "MRA-3",
      title: "Transaction Monitoring Gap — Relationship-Based Activity",
      severity: "Standard",
      examDate: "March 2023",
      description: "The bank lacks network analytics capability to detect relationship-based money laundering patterns. Current transaction monitoring treats customers as independent actors without analyzing linked accounts, beneficial ownership networks, or relationship-based transaction patterns. This capability gap was identified as an emerging regulatory standard that the bank has not yet implemented.",
      specificFindings: [
        "No network analytics or relationship mapping in transaction monitoring system",
        "Beneficial ownership data not integrated into transaction monitoring",
        "No ability to detect layering patterns across linked customer relationships",
        "Suspicious activity investigations lack network visualization capability",
        "NICE Actimize 8.1 does not include network analytics module (added in version 9.0)",
      ],
      requiredActions: [
        "Implement network analytics capability within the transaction monitoring system",
        "Integrate beneficial ownership data into transaction monitoring",
        "Document network analytics procedures and analyst training",
        "Demonstrate at least 12 months of network analytics operation at Q4 2026 exam",
      ],
      ownerName: "James Park",
      ownerTitle: "Chief Risk Officer",
      deadline: "Q4 2026 exam",
      boardEscalationRequired: false,
      status: "Open",
      remediationProgress: "No progress. Network analytics capability requires NICE Actimize version 9.0 or above — which is blocked by the same upgrade dependency as MRA-2.",
      closureRisk: "MEDIUM — Addressed as part of NICE Actimize 10.2 upgrade (version 10.2 includes network analytics module). If MRA-2 upgrade is executed, MRA-3 is largely resolved as a side effect.",
      abarvaOpportunity: "The NICE Actimize 10.2 upgrade that closes MRA-2 also provides the network analytics module that closes MRA-3. AbarVa can frame the upgrade as a single investment that closes 2 of 3 open MRAs.",
    },
  ],
  cfpbItems: [
    {
      id: "CFPB-1",
      title: "CFPB Section 1033 Open Banking Compliance",
      description: "First Capital has not established a customer data sharing capability as required by CFPB Regulation 1033, effective for banks of First Capital's asset size beginning Q4 2026. The bank lacks an API gateway and customer-authorized data sharing infrastructure. Non-compliance by the effective date creates consumer harm risk and enforcement exposure.",
      riskLevel: "High",
      deadline: "Q4 2026 (CFPB effective date for $10B+ banks)",
      status: "Not started — no project initiated",
    },
    {
      id: "CFPB-2",
      title: "Fair Lending — Credit Model Documentation",
      description: "CFPB has noted that First Capital's consumer credit model (FICO score + manual review) lacks contemporaneous documentation of underwriting criteria variation by examiner. Two loan files reviewed during CFPB examination showed inconsistent documentation of override decisions. Remediation requires updated underwriting guidelines and documentation protocols.",
      riskLevel: "Medium",
      deadline: "December 2026",
      status: "In Progress — underwriting guidelines update in draft",
    },
  ],
  bsaAmlFindings: {
    overallRating: "Needs Improvement",
    keyFindings: [
      "Transaction monitoring system (NICE Actimize 8.1) 2 major versions behind — missing ML capabilities",
      "False positive rate 94% — analyst capacity consumed by invalid alerts at expense of genuine suspicious activity",
      "SAR timeliness: 8% of filings past 30-day deadline — examiner required corrective action",
      "CDD (Customer Due Diligence) procedures: documentation inconsistent across branch network",
      "Training: AML analyst training last updated 2021 — does not reflect FinCEN guidance updates",
      "BSA Officer oversight: adequate but overwhelmed by manual review volume",
    ],
    programComponents: [
      {
        component: "Internal Controls",
        rating: "Needs Improvement",
        notes: "Transaction monitoring system technology is the primary control weakness. Procedures are documented but technology cannot execute them effectively.",
      },
      {
        component: "Independent Testing",
        rating: "Satisfactory",
        notes: "Annual BSA/AML audit by Baker Tilly — adequately scoped. 2024 audit findings consistent with MRA-2 findings.",
      },
      {
        component: "BSA Officer",
        rating: "Satisfactory",
        notes: "BSA Officer qualified and engaged. Resource-constrained due to high manual review volume.",
      },
      {
        component: "Training",
        rating: "Needs Improvement",
        notes: "Training programs not updated since 2021. Does not include FinCEN BOI reporting requirements or updated typologies.",
      },
      {
        component: "Customer Due Diligence",
        rating: "Satisfactory",
        notes: "CDD procedures adequate. Beneficial ownership collection consistent with FinCEN rules. Minor documentation inconsistencies in branch network.",
      },
    ],
  },
  capitalRatios: [
    {
      metric: "Common Equity Tier 1 (CET1) Ratio",
      firstCapital: 11.8,
      regulatoryMinimum: 4.5,
      wellCapitalizedThreshold: 6.5,
      status: "Well Capitalized",
    },
    {
      metric: "Tier 1 Capital Ratio",
      firstCapital: 12.4,
      regulatoryMinimum: 6.0,
      wellCapitalizedThreshold: 8.0,
      status: "Well Capitalized",
    },
    {
      metric: "Total Capital Ratio",
      firstCapital: 13.8,
      regulatoryMinimum: 8.0,
      wellCapitalizedThreshold: 10.0,
      status: "Well Capitalized",
    },
    {
      metric: "Leverage Ratio (Tier 1)",
      firstCapital: 8.2,
      regulatoryMinimum: 4.0,
      wellCapitalizedThreshold: 5.0,
      status: "Well Capitalized",
    },
  ],
  craRating: {
    overallRating: "Satisfactory",
    lendingTest: "High Satisfactory",
    investmentTest: "Satisfactory",
    serviceTest: "Needs to Improve",
    lastAssessmentDate: "2024",
    notes: "Service Test weakness driven by limited digital access in LMI communities — mobile app abandonment rate disproportionately impacts LMI applicants who complete applications on mobile. Improving digital onboarding would improve CRA Service Test rating.",
  },
  examinationSchedule: [
    {
      examiner: "OCC",
      examType: "Full Safety and Soundness Examination",
      scheduledDate: "Q4 2026",
      scope: "Full examination with special focus on MRA remediation, real-time payments, BSA/AML technology, and data governance",
      firstCapitalReadiness: "Not Ready",
      keyRisks: [
        "MRA-1 (FedNow) requires board escalation by Q3 2026 — no action taken",
        "MRA-2 (NICE Actimize) requires technology upgrade completion — not started",
        "MRA-3 (Network analytics) requires NICE Actimize upgrade — blocked by MRA-2",
        "SQL Server 2017 end-of-support (October 2025) — examiner will find unsupported Tier 1 system",
        "CFPB Section 1033 deadline coincides with OCC exam — dual compliance pressure",
      ],
    },
    {
      examiner: "OCC",
      examType: "BSA/AML Targeted Examination",
      scheduledDate: "Q2 2026",
      scope: "Targeted BSA/AML examination focused on MRA-2 and MRA-3 remediation progress — semi-annual monitoring given open MRA status",
      firstCapitalReadiness: "At Risk",
      keyRisks: [
        "NICE Actimize upgrade not started — no remediation evidence to present",
        "False positive rate still at 94% — no improvement since 2023 examination",
        "SAR timeliness may have recurring breaches",
      ],
    },
    {
      examiner: "Federal Reserve",
      examType: "Risk Management Examination",
      scheduledDate: "Q2 2027",
      scope: "Technology risk management, model risk, and enterprise risk management framework",
      firstCapitalReadiness: "At Risk",
      keyRisks: [
        "Model Risk Management framework not established — required for AI deployments",
        "SQL Server 2017 end-of-support creates technology risk management finding risk",
        "No enterprise AI governance framework despite AI pilots in progress",
      ],
    },
    {
      examiner: "CFPB",
      examType: "Supervision Examination",
      scheduledDate: "2027",
      scope: "Consumer financial protection, fair lending, and Section 1033 open banking compliance",
      firstCapitalReadiness: "At Risk",
      keyRisks: [
        "Section 1033 compliance deadline Q4 2026 — no project started",
        "Fair lending credit model documentation remediation in progress but not complete",
        "Account opening abandonment rate disparity for LMI and minority applicants under scrutiny",
      ],
    },
  ],
  complianceInvestments: [
    {
      initiative: "FedNow via Finzly (MRA-1 closure)",
      estimatedCost: 3200000,
      mraAddressed: ["MRA-1"],
      urgency: "CRITICAL — board escalation required Q3 2026",
    },
    {
      initiative: "NICE Actimize 10.2 Upgrade (MRA-2 and MRA-3 closure)",
      estimatedCost: 1600000,
      mraAddressed: ["MRA-2", "MRA-3"],
      urgency: "HIGH — upgrade must begin by March 2026 to complete before Q4 exam",
    },
    {
      initiative: "CFPB Section 1033 API Gateway",
      estimatedCost: 2400000,
      mraAddressed: ["CFPB-1"],
      urgency: "HIGH — Q4 2026 regulatory deadline",
    },
    {
      initiative: "SQL Server 2017 Migration to Snowflake",
      estimatedCost: 1800000,
      mraAddressed: [],
      urgency: "HIGH — already past end-of-support, OCC examination risk",
    },
  ],
}
