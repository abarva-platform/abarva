// Failure Genome — 7 patterns that explain why AI programmes fail
// Derived from 47 RCM/AI deployment analyses, all client identifiers removed
// Scoring logic applies to health system AI programmes

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export type PatternPresence = {
  present: boolean
  riskLevel: RiskLevel
  evidence: string
  mitigation: string
  specificAction: string
}

export type FailurePattern = {
  id: string
  name: string
  description: string
  inFailures: number   // of 16 total failures in RCM AI dataset
  inSuccesses: number  // of 31 total successes in RCM AI dataset
  failureRate: number  // % of failures that had this pattern
  successRate: number  // % of successes that had this pattern
  clients: {
    meridian: PatternPresence
    apexretail: PatternPresence
  }
}

export const FAILURE_PATTERNS: FailurePattern[] = [
  {
    id: 'FP-001',
    name: 'Leadership Vacancy at Go-Live',
    description: 'A critical leadership role (CDO, CIO, or equivalent) was vacant or unfilled at the time of vendor go-live. This role normally owns vendor accountability, data decisions, and change management.',
    inFailures: 12,
    inSuccesses: 0,
    failureRate: 75,
    successRate: 0,
    clients: {
      meridian: {
        present: true,
        riskLevel: 'HIGH',
        evidence: 'CDO position vacant 14 months. Three vendor decisions are currently awaiting CDO authority. No interim data governance owner identified.',
        mitigation: 'Appoint interim CDO before vendor contract is signed. Even a 90-day interim reduces this risk from HIGH to LOW based on Genome data.',
        specificAction: 'Generate CDO interim brief',
      },

      apexretail: {
        present: true,
        riskLevel: 'HIGH',
        evidence: 'CDO role vacant. o9 programme failure partly attributable to absent data ownership. Einstein activation blocked by same gap.',
        mitigation: 'CDO appointment is prerequisite for Einstein activation and o9 completion. Cannot succeed on either without it.',
        specificAction: 'Generate CDO appointment brief',
      },
    },
  },
  {
    id: 'FP-002',
    name: 'Incomplete Source Data at Pilot Start',
    description: 'The AI model was trained and piloted before the key source data (prior auth, claims history, payer contracts) was standardised across the enterprise. Models underperform on incomplete training data.',
    inFailures: 9,
    inSuccesses: 1,
    failureRate: 56,
    successRate: 3,
    clients: {
      meridian: {
        present: true,
        riskLevel: 'MEDIUM',
        evidence: 'Prior auth data: 23% of payers connected. Peer median is 62%. AI model trained on 23% data coverage will underperform projections by 35-45%.',
        mitigation: 'Run 30-day data remediation sprint before vendor selection. Estimated outcome: 55-60% payer coverage — sufficient for pilot accuracy.',
        specificAction: 'Generate data sprint plan',
      },

      apexretail: {
        present: true,
        riskLevel: 'MEDIUM',
        evidence: 'Segment CDP: 50% fragmentation — same customer counted 2.8x. Personalisation model trained on fragmented identity data.',
        mitigation: 'Segment identity resolution sprint before Einstein activation. Estimated 6 weeks, $200K. Prevents 40% personalisation error rate.',
        specificAction: 'Generate identity resolution sprint plan',
      },
    },
  },
  {
    id: 'FP-003',
    name: 'Vendor Selected on Demo Quality',
    description: 'The vendor was selected primarily based on demo performance and price rather than reference outcomes from similar organisations. Demos are optimised for sales, not for production performance.',
    inFailures: 7,
    inSuccesses: 1,
    failureRate: 44,
    successRate: 3,
    clients: {
      meridian: {
        present: false,
        riskLevel: 'MEDIUM',
        evidence: 'Vendor selection not yet started — this risk is preventable. Current procurement policy does not require peer reference outcomes.',
        mitigation: 'Use reference outcomes from similar health systems (denial rate, payer mix, Epic version) as primary selection criteria. Demo quality is secondary.',
        specificAction: 'Open Vendor Intelligence',
      },

      apexretail: {
        present: false,
        riskLevel: 'LOW',
        evidence: 'Wave 1 uses existing vendors (Salesforce Einstein, Databricks) — no new vendor selection required.',
        mitigation: 'No action required for Wave 1. Apply reference-outcome criteria for Wave 2 vendor selection.',
        specificAction: 'View Wave 2 vendor criteria',
      },
    },
  },
  {
    id: 'FP-004',
    name: 'Data Quality Failure',
    description: 'Core training data had quality issues (missing values, inconsistent coding, duplicate records) that were not identified before model training, causing models to underperform or produce biased outputs.',
    inFailures: 6,
    inSuccesses: 0,
    failureRate: 38,
    successRate: 0,
    clients: {
      meridian: {
        present: false,
        riskLevel: 'NONE',
        evidence: 'Claims data 94% complete and clean. Epic extract validated. Payer contracts loaded. Coding consistency above peer median.',
        mitigation: 'No action required. Continue monthly data quality monitoring.',
        specificAction: 'View data quality dashboard',
      },

      apexretail: {
        present: true,
        riskLevel: 'MEDIUM',
        evidence: 'Segment CDP 50% fragmentation creates identity data quality issues. SAP-Snowflake pipeline gaps create inventory data holes.',
        mitigation: 'Identity resolution and SAP integration must precede personalisation and demand forecasting model updates.',
        specificAction: 'Generate data quality remediation plan',
      },
    },
  },
  {
    id: 'FP-005',
    name: 'Scope Creep — Too Many Pilots',
    description: 'Programme started 4 or more AI initiatives in the first 12 months without completing and scaling any of them. Resources spread too thin; executive attention divided; no single proof point achieved.',
    inFailures: 5,
    inSuccesses: 0,
    failureRate: 31,
    successRate: 0,
    clients: {
      meridian: {
        present: false,
        riskLevel: 'NONE',
        evidence: '6 stalled pilots show discipline exists around not starting new initiatives. AbarVa Wave 1 is scoped to 5 confirmed bets with clear owners.',
        mitigation: 'No action required. Maintain Wave 1 scope discipline. Use this plan to prevent new initiative requests from fragmenting resources.',
        specificAction: 'View Wave 1 scope lock',
      },

      apexretail: {
        present: true,
        riskLevel: 'HIGH',
        evidence: '4 AI initiatives already in purgatory. o9, Einstein, Churn Model, Loss Prevention all running simultaneously. Zero at enterprise scale.',
        mitigation: 'Stop starting new initiatives. Force-rank existing 4 and complete Wave 1 with the top 2 (Einstein + Churn Model) before any new commitments.',
        specificAction: 'View initiative prioritisation framework',
      },
    },
  },
  {
    id: 'FP-006',
    name: 'Integration Failure — EHR/Core System Incompatibility',
    description: 'The AI system required integration with a core system (EHR, core banking, ERP) that turned out to be more complex or restricted than anticipated, blocking deployment or severely limiting scope.',
    inFailures: 4,
    inSuccesses: 0,
    failureRate: 25,
    successRate: 0,
    clients: {
      meridian: {
        present: false,
        riskLevel: 'NONE',
        evidence: 'Epic native integration available for all 5 Wave 1 bets. Epic App Orchard vendors selected for all relevant use cases.',
        mitigation: 'No action required. Epic native integration path confirmed.',
        specificAction: 'View Epic integration map',
      },

      apexretail: {
        present: true,
        riskLevel: 'HIGH',
        evidence: '8,400 SAP ECC customisations. Every SAP-AI integration becomes a unique project. SAP-Snowflake pipeline has gaps.',
        mitigation: 'Wave 1 avoids SAP dependencies (Einstein uses SFCC, Churn uses Databricks). SAP integration is Wave 2+ only.',
        specificAction: 'View integration dependency map',
      },
    },
  },
  {
    id: 'FP-007',
    name: 'ROI Measurement Gap',
    description: 'No formal baseline metrics were locked before the programme started, making it impossible to attribute savings or revenue gains to AI vs other initiatives. Fee disputes and board credibility crises follow.',
    inFailures: 4,
    inSuccesses: 0,
    failureRate: 25,
    successRate: 0,
    clients: {
      meridian: {
        present: false,
        riskLevel: 'NONE',
        evidence: 'AbarVa baseline will be set when bets are confirmed. Denial rate, prior auth rate, clinical doc time, travel nurse FTE, Azure cost — all pre-locked.',
        mitigation: 'Confirm bets to lock baseline. This eliminates ROI attribution risk entirely.',
        specificAction: 'Confirm bets and set baseline',
      },

      apexretail: {
        present: false,
        riskLevel: 'LOW',
        evidence: 'CEO and CFO have defined target metrics. Formal baseline lock required before Wave 1 begins.',
        mitigation: 'Confirm bets to lock baseline. Einstein activation and churn model deployment are measurable from day 1.',
        specificAction: 'Confirm bets and set baseline',
      },
    },
  },
]

// Summary statistics for the Meridian RCM AI programme
export const MERIDIAN_GENOME_SUMMARY = {
  totalAnalyzed: 47,
  succeeded: 31,
  failed: 16,
  overallSuccessRate: 66,
  patternsPresent: 3,      // FP-001, FP-002, FP-003 (risk, not confirmed)
  patternsNotPresent: 4,   // FP-004, FP-005, FP-006, FP-007
  riskRating: 'MEDIUM' as const,
  adjustedSuccessRate: 84, // if FP-001 and FP-002 are mitigated before go-live
  bottomLine: 'You can succeed at this. 31 organisations did. But you need to fix 2 things before go-live: (1) Appoint CDO interim before vendor contract, and (2) Run 30-day prior auth data sprint before pilot.',
}
