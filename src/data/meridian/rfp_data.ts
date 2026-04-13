type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical'
type Recommendation = 'Recommended' | 'Acceptable' | 'Not Recommended' | 'Disqualified'

interface VendorScoring {
  totalScore: number
  technicalFit: number
  implementationRisk: number
  commercialTerms: number
  references: number
  financialStability: number
}

interface VendorFinancials {
  implementationCost: number
  annualLicenseCost: number
  totalYearOneInvestment: number
  totalThreeYearCost: number
  vendorClaimedAutomationRate: number
  abarvaVerifiedAutomationRate: number
  projectedAnnualSavings: number
  paybackMonths: number
}

interface RedFlag {
  flag: string
  severity: RiskLevel
  abarvaVerification: string
}

interface RFPVendor {
  rank: number
  name: string
  recommendation: Recommendation
  abarvaScore: number
  scoring: VendorScoring
  financials: VendorFinancials
  keyStrengths: string[]
  keyWeaknesses: string[]
  redFlags: RedFlag[]
  epicIntegration: string
  payerConnections: number
  referenceCustomers: string[]
  implementationTimeline: { vendorClaim: string; abarvaEstimate: string }
}

interface RFPCriterion {
  category: string
  weight: number
  description: string
  rationale: string
}

interface ContractClause {
  clause: string
  risk: string
  severity: RiskLevel
  negotiationApproach: string
}

interface NegotiationPoint {
  item: string
  currentTerms: string
  targetTerms: string
  estimatedValue: number
  walkawayPosition: string
}

interface RFPTimelinePhase {
  week: string
  phase: string
  activities: string[]
  deliverable: string
}

interface MeridianRFPData {
  rfpTitle: string
  rfpScope: string
  abarvaLead: string
  rfpLaunchDate: string
  vendorsEvaluated: number
  recommendedVendor: string
  rfpTimeline: RFPTimelinePhase[]
  rfpCriteria: RFPCriterion[]
  vendors: RFPVendor[]
  contractIntelligence: {
    flaggedClauses: ContractClause[]
    negotiationPoints: NegotiationPoint[]
    totalNegotiationValue: number
    recommendedNegotiationSequence: string[]
  }
  finalRecommendation: {
    vendor: string
    rationale: string
    conditions: string[]
    alternativeScenario: string
    decisionDeadline: string
    implementationStart: string
    goLiveTarget: string
    yearOneSavings: number
    threeYearROI: string
  }
}

export const meridianRFP: MeridianRFPData = {
  rfpTitle: "Prior Authorization AI Automation — Vendor Selection",
  rfpScope:
    "Enterprise deployment across all 23 Meridian hospitals and 187,000 health plan covered lives. Requirement: Epic-native integration, minimum 80% automation rate on standard clinical criteria, CMS interoperability rule compliance by January 2026.",
  abarvaLead: "AbarVa Procurement Intelligence",
  rfpLaunchDate: "January 2026",
  vendorsEvaluated: 4,
  recommendedVendor: "Cohere Health",

  rfpTimeline: [
    {
      week: "Week 1",
      phase: "RFP Issuance and Vendor Briefing",
      activities: [
        "Issue RFP to 4 shortlisted vendors",
        "Host vendor briefing call — explain Meridian context, Epic environment, CMS deadline",
        "Provide data room access: Epic configuration, payer mix, prior auth volume by category",
        "Clarify AbarVa independent verification methodology to vendors",
      ],
      deliverable: "RFP document, data room",
    },
    {
      week: "Week 2",
      phase: "Vendor Proposal Submission",
      activities: [
        "Vendors submit written proposals",
        "AbarVa preliminary scoring of written proposals",
        "Reference customer outreach initiated",
        "Financial stability review initiated",
      ],
      deliverable: "4 vendor proposals received",
    },
    {
      week: "Week 3",
      phase: "Demo and Technical Deep Dive",
      activities: [
        "3-hour structured demo for each vendor",
        "Epic integration architecture review",
        "Automation rate methodology audit — require vendors to show how they calculate claimed rates",
        "Security and compliance review (HIPAA, SOC 2 Type II verification)",
      ],
      deliverable: "Technical scorecards for each vendor",
    },
    {
      week: "Week 4",
      phase: "AbarVa Independent Verification",
      activities: [
        "AbarVa calls 3 reference customers per vendor",
        "Cross-check claimed automation rates against reference-reported actuals",
        "Verify implementation timelines against reference experiences",
        "Financial stability review — review vendor financials, funding, key personnel retention",
      ],
      deliverable: "AbarVa verification report",
    },
    {
      week: "Weeks 5-6",
      phase: "Commercial Negotiation and Recommendation",
      activities: [
        "Share preliminary scoring with top 2 vendors",
        "Negotiate contract terms with recommended vendor",
        "Flag contract risk clauses to Meridian legal",
        "Prepare final recommendation memo for CFO and CIO",
        "Board approval if total contract value >$5M",
      ],
      deliverable: "Final recommendation memo, negotiated term sheet",
    },
  ],

  rfpCriteria: [
    {
      category: "Technical Fit and Automation Rate",
      weight: 30,
      description: "Verified automation rate, accuracy, and clinical scope coverage",
      rationale:
        "Automation rate is the primary economic driver. AbarVa requires vendor-claimed rates to be independently verified via reference customer calls and live demo using Meridian's actual payer mix.",
    },
    {
      category: "Epic Integration",
      weight: 25,
      description: "Native Epic integration depth, workflow embedding, payer network breadth",
      rationale:
        "Must integrate into existing Epic workflows without requiring separate logins or dual entry. Payer network size directly determines automation scope.",
    },
    {
      category: "Implementation Risk",
      weight: 20,
      description:
        "Timeline accuracy, IDN experience, implementation resource requirements, go-live track record",
      rationale:
        "CMS January 2026 deadline creates implementation urgency. Vendors with IDN-scale deployment history and accurate timeline claims are materially lower risk.",
    },
    {
      category: "Commercial Terms",
      weight: 15,
      description: "Total cost of ownership, pricing model, SLA structure, outcome-based options",
      rationale:
        "Meridian CFO requires outcome-based pricing where possible. SLA provisions must include meaningful penalties. Total 3-year cost evaluated, not year-one only.",
    },
    {
      category: "Financial and Organizational Stability",
      weight: 10,
      description:
        "Vendor viability: funding, leadership stability, customer concentration, roadmap continuity",
      rationale:
        "Enterprise healthcare AI vendors have significant failure and pivot risk. Investing in a vendor that pivots or fails creates stranded implementation costs.",
    },
  ],

  vendors: [
    {
      rank: 2,
      name: "Cohere Health",
      recommendation: "Recommended",
      abarvaScore: 88,
      scoring: {
        totalScore: 88,
        technicalFit: 91,
        implementationRisk: 85,
        commercialTerms: 86,
        references: 92,
        financialStability: 88,
      },
      financials: {
        implementationCost: 2.4,
        annualLicenseCost: 1.8,
        totalYearOneInvestment: 4.2,
        totalThreeYearCost: 7.8,
        vendorClaimedAutomationRate: 91,
        abarvaVerifiedAutomationRate: 89,
        projectedAnnualSavings: 28,
        paybackMonths: 4,
      },
      keyStrengths: [
        "Epic-native integration — embedded in Epic clinical workflow, no separate interface",
        "847 payer connections — highest payer network in evaluation; covers Meridian's full payer mix",
        "89% automation rate independently verified across 3 reference IDNs (claimed 91%)",
        "CMS interoperability rule compliant — 6 months ahead of January 2026 deadline",
        "Strong IDN references: deployed at 4 IDNs of comparable size",
        "Outcome-based pricing option available — aligns with CFO preference",
        "Implementation timeline accurate within 10% per reference customers",
      ],
      keyWeaknesses: [
        "License cost 8% above category median — partially offset by payer breadth",
        "Implementation team requires 2 dedicated Meridian IT FTEs for 6 months",
        "No prior deployment in NC/SC regulatory environment — minor regulatory mapping needed",
      ],
      redFlags: [
        {
          flag: "No material red flags identified",
          severity: "None",
          abarvaVerification:
            "Leadership stable — CEO and CTO both 3+ years; Series B closed 8 months ago with $65M; 4 IDN references verified; no customer churn in 18 months",
        },
      ],
      epicIntegration: "Native Epic App Market integration — embedded in Epic clinical workflow with no separate login required. Epic interoperability certified.",
      payerConnections: 847,
      referenceCustomers: [
        "Advocate Health (24-hospital IDN) — 87% automation rate, 5 months to go-live",
        "OhioHealth (13 hospitals) — 91% automation rate, 4.5 months to go-live",
        "UCSF Health (8 hospitals) — 89% automation rate, 6 months to go-live",
      ],
      implementationTimeline: {
        vendorClaim: "5-6 months to enterprise go-live",
        abarvaEstimate: "5.5-7 months (references averaged 5.2 months; Meridian Blue Ridge complexity adds ~1.5 months)",
      },
    },
    {
      rank: 1,
      name: "Olive AI",
      recommendation: "Acceptable",
      abarvaScore: 74,
      scoring: {
        totalScore: 74,
        technicalFit: 78,
        implementationRisk: 65,
        commercialTerms: 72,
        references: 76,
        financialStability: 54,
      },
      financials: {
        implementationCost: 3.8,
        annualLicenseCost: 2.1,
        totalYearOneInvestment: 5.9,
        totalThreeYearCost: 10.1,
        vendorClaimedAutomationRate: 94,
        abarvaVerifiedAutomationRate: 87,
        projectedAnnualSavings: 26,
        paybackMonths: 6,
      },
      keyStrengths: [
        "Broad RPA + AI automation platform — prior auth is one of many use cases",
        "Strong brand recognition in healthcare AI market",
        "Reference customers report high satisfaction with clinical coverage breadth",
      ],
      keyWeaknesses: [
        "7-point gap between claimed (94%) and verified (87%) automation rate",
        "Implementation cost highest in evaluation at $3.8M",
        "CEO turnover 8 months ago — new CEO still establishing strategic direction",
        "Series C fundraising round failed — company operating on Series B runway",
        "3-year total cost 29% higher than recommended vendor",
      ],
      redFlags: [
        {
          flag: "CEO turnover 8 months ago — prior CEO departed 'by mutual agreement'",
          severity: "High",
          abarvaVerification:
            "Confirmed via LinkedIn and press records. New CEO (Sarah Berns) joined from Waystar; 3 of 5 original C-suite have departed in past 18 months. Enterprise stability risk for multi-year deployment.",
        },
        {
          flag: "Series C fundraising round failed — company confirmed by reference contact",
          severity: "High",
          abarvaVerification:
            "Series C of $120M targeted; raised $0. Company now operating on existing Series B capital. Runway unclear. AbarVa recommends escrow provision and source code access in any contract.",
        },
        {
          flag: "Claimed 94% automation rate vs 87% verified — 7-point gap",
          severity: "Medium",
          abarvaVerification:
            "Claimed rate uses vendor's internal definition that excludes payer-rejected auto-submissions. AbarVa definition (clinically completed without human touchpoint) yields 87%.",
        },
      ],
      epicIntegration: "Epic integration via HL7 FHIR API — not Epic App Market native. Requires separate Olive interface. Additional Epic IT resource required.",
      payerConnections: 610,
      referenceCustomers: [
        "Banner Health — 88% automation rate, 9 months to go-live (longer than vendor claimed)",
        "Intermountain Health — 86% automation rate, 7 months to go-live",
      ],
      implementationTimeline: {
        vendorClaim: "5-7 months",
        abarvaEstimate: "7-10 months (references averaged 8.5 months; CEO transition adds delivery risk)",
      },
    },
    {
      rank: 3,
      name: "Infinitus",
      recommendation: "Not Recommended",
      abarvaScore: 61,
      scoring: {
        totalScore: 61,
        technicalFit: 68,
        implementationRisk: 42,
        commercialTerms: 58,
        references: 64,
        financialStability: 72,
      },
      financials: {
        implementationCost: 4.2,
        annualLicenseCost: 2.6,
        totalYearOneInvestment: 6.8,
        totalThreeYearCost: 12.0,
        vendorClaimedAutomationRate: 96,
        abarvaVerifiedAutomationRate: 88,
        projectedAnnualSavings: 24,
        paybackMonths: 8,
      },
      keyStrengths: [
        "Conversational AI differentiator — voice-based payer outreach for complex cases",
        "Financial stability — Series B backed, no executive turnover",
        "Strong product roadmap for complex prior auth categories",
      ],
      keyWeaknesses: [
        "Highest implementation cost in evaluation at $4.2M",
        "Reference customers report implementation timelines 40% longer than quoted",
        "Highest 3-year TCO at $12M vs $7.8M for recommended vendor",
        "8-point gap between claimed (96%) and verified (88%) automation rate",
      ],
      redFlags: [
        {
          flag: "Implementation timelines 40% longer than vendor quotes per reference customers",
          severity: "Critical",
          abarvaVerification:
            "3 reference calls confirmed average actual implementation time 40% beyond vendor-quoted timeline. For Meridian, 5-month quote becomes estimated 7+ months — CMS January 2026 deadline risk is significant.",
        },
        {
          flag: "Claimed 96% vs 87% verified automation rate — 9-point gap, largest in evaluation",
          severity: "High",
          abarvaVerification:
            "Infinitus includes payer-side voice calls in automation rate even when calls require escalation. AbarVa straight-through-processing definition yields 88%.",
        },
      ],
      epicIntegration: "Epic integration via FHIR API — partial integration only. No Epic App Market certification.",
      payerConnections: 520,
      referenceCustomers: [
        "Bon Secours Mercy — 85% automation rate, 11 months to go-live (vendor quoted 7 months)",
        "CommonSpirit (partial deployment) — 88% automation rate, 9 months to go-live",
      ],
      implementationTimeline: {
        vendorClaim: "5-6 months",
        abarvaEstimate: "7-9 months (40% overrun pattern across all references)",
      },
    },
    {
      rank: 4,
      name: "MedLogix",
      recommendation: "Disqualified",
      abarvaScore: 44,
      scoring: {
        totalScore: 44,
        technicalFit: 48,
        implementationRisk: 32,
        commercialTerms: 58,
        references: 38,
        financialStability: 46,
      },
      financials: {
        implementationCost: 1.8,
        annualLicenseCost: 1.4,
        totalYearOneInvestment: 3.2,
        totalThreeYearCost: 6.0,
        vendorClaimedAutomationRate: 84,
        abarvaVerifiedAutomationRate: 79,
        projectedAnnualSavings: 18,
        paybackMonths: 5,
      },
      keyStrengths: [
        "Lowest price point in evaluation — lowest implementation and license costs",
        "Simple deployment model — may suit community hospital single-site deployments",
      ],
      keyWeaknesses: [
        "No IDN experience — all reference customers are single-facility or small health systems",
        "No Epic integration — custom API build required; no certified Epic connection",
        "Lowest verified automation rate at 79%",
        "No deployment at comparable scale to Meridian (23 hospitals, 187K lives)",
        "Reference customers limited to 1-3 hospital systems",
      ],
      redFlags: [
        {
          flag: "No IDN deployment experience — largest customer is 4-hospital system",
          severity: "Critical",
          abarvaVerification:
            "All 3 reference customers are single-facility or 2-hospital systems. No evidence of IDN-scale prior auth volume handling. Meridian's complexity is 5-10x reference customer size.",
        },
        {
          flag: "No Epic integration — requires custom build with unknown Epic App Market timeline",
          severity: "Critical",
          abarvaVerification:
            "MedLogix confirmed they are 'in process' of building Epic integration. No App Market certification. Timeline for Epic certification not guaranteed.",
        },
      ],
      epicIntegration: "None — custom API integration required. Epic App Market certification not in progress.",
      payerConnections: 340,
      referenceCustomers: [
        "Franklin County Hospital (1 facility) — 78% automation rate",
        "Piedmont Valley Medical Center (2 hospitals) — 81% automation rate",
      ],
      implementationTimeline: {
        vendorClaim: "3-4 months",
        abarvaEstimate: "8-12 months minimum (Epic integration build required before deployment can begin)",
      },
    },
  ],

  contractIntelligence: {
    flaggedClauses: [
      {
        clause: "Data portability on termination — 90-day notice, vendor retains data 12 months post-termination",
        risk: "Meridian's prior auth training data used to train vendor model; Meridian cannot extract or delete model training data",
        severity: "Critical",
        negotiationApproach:
          "Require immediate data return on notice; delete training data contributions from model weights within 30 days; add IP ownership clause for Meridian-specific model customizations",
      },
      {
        clause: "Automation rate SLA penalty is $25K per percentage point below SLA",
        risk: "$25K penalty is immaterial relative to $28M savings commitment — no real accountability",
        severity: "High",
        negotiationApproach:
          "Require outcome-based fee structure: 15% of verified savings above baseline, capped at $4.2M/year. This aligns incentives and eliminates need to track SLA penalty payments.",
      },
      {
        clause: "Price escalation clause allows 8% annual increase without renegotiation",
        risk: "$1.8M license becomes $2.7M in year 3 without any scope change",
        severity: "High",
        negotiationApproach:
          "Cap price escalation at CPI (currently ~3%). Year 2 and Year 3 pricing fixed in contract at time of signing.",
      },
      {
        clause: "Implementation timeline defined as 'best efforts' — no financial remedy for delays",
        risk: "If implementation delays past CMS January 2026 deadline, no vendor liability for Meridian compliance penalties",
        severity: "Critical",
        negotiationApproach:
          "Add delay penalty of $50K/week beyond agreed go-live date, capped at 20% of implementation fee. Require milestone payment schedule tied to delivery.",
      },
    ],
    negotiationPoints: [
      {
        item: "Implementation fee reduction — competitive pressure",
        currentTerms: "$2.4M implementation fee",
        targetTerms: "$2.0M — cite 3 competing bids all below $2.4M",
        estimatedValue: 400000,
        walkawayPosition: "$2.2M with extended payment terms",
      },
      {
        item: "Year 1 license discount — early signature",
        currentTerms: "$1.8M annual license",
        targetTerms: "$1.5M year 1 with standard renewal thereafter",
        estimatedValue: 300000,
        walkawayPosition: "$1.65M year 1",
      },
      {
        item: "Outcome-based pricing conversion",
        currentTerms: "Fixed license + transaction fees",
        targetTerms: "15% of verified savings above $0 baseline, capped at $4.2M/year",
        estimatedValue: 280000,
        walkawayPosition: "Fixed fee with SLA credits as backstop",
      },
      {
        item: "Free seats for Meridian IT team during implementation",
        currentTerms: "Not included — $420K implementation training add-on",
        targetTerms: "Include 3 admin seats and training at no additional cost",
        estimatedValue: 420000,
        walkawayPosition: "Half-price training ($210K)",
      },
      {
        item: "Most favored customer pricing clause",
        currentTerms: "Not included",
        targetTerms: "MFC clause — Meridian prices match or beat any IDN customer at comparable volume",
        estimatedValue: 180000,
        walkawayPosition: "Annual pricing transparency review",
      },
      {
        item: "Implementation delay penalty insertion",
        currentTerms: "Best efforts language, no remedy",
        targetTerms: "$50K/week penalty beyond go-live date, capped at 20% of implementation fee",
        estimatedValue: 240000,
        walkawayPosition: "$25K/week penalty, same cap",
      },
    ],
    totalNegotiationValue: 340000,
    recommendedNegotiationSequence: [
      "1. Open with implementation fee reduction — creates anchoring effect on all subsequent items",
      "2. Introduce outcome-based pricing as alternative to fixed license — reframes vendor incentive structure",
      "3. Add delay penalty clause — vendor will resist; use CMS deadline as Meridian-side risk justification",
      "4. Package training seats as close concession — low cost to vendor, high value to Meridian",
      "5. Year 1 discount as final close — position as signature acceleration",
      "6. MFC clause as goodwill item at signing — low probability but worth including",
    ],
  },

  finalRecommendation: {
    vendor: "Cohere Health",
    rationale:
      "Cohere Health scored highest in the AbarVa independent evaluation at 88/100 — 14 points above the next vendor and 44 points above the lowest. The recommendation is driven by four factors: (1) Highest independently-verified automation rate at 89% — smallest gap between claimed and actual in the evaluation; (2) Epic-native integration via App Market — the only vendor evaluated with true Epic workflow embedding, eliminating the separate-interface problem that reduces physician adoption; (3) 847 payer connections covering Meridian's full commercial, Medicare Advantage, and Medicaid payer mix; (4) No material organizational risk factors — leadership stable, funding secure, references uniformly positive. At $7.8M three-year cost vs $10.1M for the second-ranked vendor, Cohere delivers better outcomes at lower total cost.",
    conditions: [
      "Contract must include implementation delay penalty clause at $50K/week minimum",
      "Data portability and training data deletion clause required before signature",
      "Outcome-based pricing option must be exercised — align vendor incentives with Meridian outcomes",
      "Three reference calls with comparable IDNs must be completed by Meridian team before final approval",
      "CMS compliance certification (January 2026) must be written as a contract milestone with financial remedy",
    ],
    alternativeScenario:
      "If Cohere Health contract negotiations fail on delay penalty clause, Olive AI is the acceptable fallback — but requires escrow provision and source code access given financial stability risk. Do not proceed with Infinitus (implementation timeline risk vs CMS deadline) or MedLogix (no IDN experience, no Epic integration).",
    decisionDeadline: "May 15, 2026 — required to meet July 2026 implementation start and January 2027 go-live",
    implementationStart: "July 2026",
    goLiveTarget: "January 2027",
    yearOneSavings: 28,
    threeYearROI: "7.2x — $200M three-year value against $28M total investment",
  },
}
