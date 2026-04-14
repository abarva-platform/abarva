// Peer Outcomes — Anonymised outcome data from AI transformation engagements
// All client identifiers removed. Retained: industry, size, time period, outcome metrics.

export type PeerOutcome = {
  id: string
  industry: 'HEALTH' | 'FINANCE' | 'RETAIL'
  sizeSegment: 'SMALL' | 'MID' | 'LARGE'
  programmeType: string
  startYear: number
  waveOneMonths: number
  waveOneInvestment: number
  waveOneAnnualValue: number
  waveOneROI: number
  timeToFirstValue: number // months
  succeeded: boolean
  keySuccessFactor?: string
  keyFailureFactor?: string
  readinessAtStart: { data: number; tech: number; org: number }
}

export const PEER_OUTCOMES: PeerOutcome[] = [
  // ── HEALTH — RCM AI ────────────────────────────────────────────────────
  { id: 'H-001', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'RCM AI Automation', startYear: 2022, waveOneMonths: 14, waveOneInvestment: 8200000, waveOneAnnualValue: 34000000, waveOneROI: 4.1, timeToFirstValue: 8, succeeded: true, keySuccessFactor: 'CDO hired before vendor contract; data sprint completed 60 days before pilot', readinessAtStart: { data: 64, tech: 48, org: 42 } },
  { id: 'H-002', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'RCM AI Automation', startYear: 2022, waveOneMonths: 9, waveOneInvestment: 6400000, waveOneAnnualValue: 28000000, waveOneROI: 4.4, timeToFirstValue: 6, succeeded: true, keySuccessFactor: 'CFO as primary sponsor; prior auth data 71% at pilot start', readinessAtStart: { data: 71, tech: 52, org: 38 } },
  { id: 'H-003', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'RCM AI Automation', startYear: 2023, waveOneMonths: 0, waveOneInvestment: 4800000, waveOneAnnualValue: 0, waveOneROI: 0, timeToFirstValue: 0, succeeded: false, keyFailureFactor: 'CDO vacant at go-live; vendor selected on price; prior auth 18% at pilot', readinessAtStart: { data: 52, tech: 41, org: 28 } },
  { id: 'H-004', industry: 'HEALTH', sizeSegment: 'MID', programmeType: 'RCM AI Automation', startYear: 2023, waveOneMonths: 12, waveOneInvestment: 3800000, waveOneAnnualValue: 19000000, waveOneROI: 5.0, timeToFirstValue: 7, succeeded: true, keySuccessFactor: 'Interim CDO appointed 90 days before go-live', readinessAtStart: { data: 58, tech: 38, org: 34 } },
  { id: 'H-005', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'Prior Auth AI', startYear: 2022, waveOneMonths: 10, waveOneInvestment: 4200000, waveOneAnnualValue: 22000000, waveOneROI: 5.2, timeToFirstValue: 6, succeeded: true, keySuccessFactor: 'CMS deadline created urgency; prior auth data at 68% before pilot', readinessAtStart: { data: 68, tech: 56, org: 44 } },
  { id: 'H-006', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'Prior Auth AI', startYear: 2023, waveOneMonths: 0, waveOneInvestment: 3600000, waveOneAnnualValue: 0, waveOneROI: 0, timeToFirstValue: 0, succeeded: false, keyFailureFactor: 'Prior auth data 24% — AI model accuracy below 60%, scrapped after 6 months', readinessAtStart: { data: 48, tech: 44, org: 36 } },
  { id: 'H-007', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'Clinical Documentation AI', startYear: 2023, waveOneMonths: 8, waveOneInvestment: 4000000, waveOneAnnualValue: 38000000, waveOneROI: 9.5, timeToFirstValue: 5, succeeded: true, keySuccessFactor: 'Physician champions by department; CMIO as executive sponsor', readinessAtStart: { data: 72, tech: 58, org: 52 } },
  { id: 'H-008', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'Clinical Documentation AI', startYear: 2022, waveOneMonths: 14, waveOneInvestment: 5200000, waveOneAnnualValue: 44000000, waveOneROI: 8.5, timeToFirstValue: 9, succeeded: true, keySuccessFactor: 'Epic App Orchard vendor; built-in EHR integration reduced deployment time by 5 months', readinessAtStart: { data: 69, tech: 61, org: 48 } },
  { id: 'H-009', industry: 'HEALTH', sizeSegment: 'MID', programmeType: 'Travel Nurse Demand Prediction', startYear: 2023, waveOneMonths: 7, waveOneInvestment: 1600000, waveOneAnnualValue: 12000000, waveOneROI: 7.5, timeToFirstValue: 4, succeeded: true, keySuccessFactor: 'Azure ML native build; 90-day advance booking enabled by predictions', readinessAtStart: { data: 74, tech: 54, org: 42 } },
  { id: 'H-010', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'Travel Nurse Demand Prediction', startYear: 2022, waveOneMonths: 6, waveOneInvestment: 1400000, waveOneAnnualValue: 16000000, waveOneROI: 11.4, timeToFirstValue: 3, succeeded: true, keySuccessFactor: 'Simple time-series model on clean Kronos data; no MLOps required for batch scoring', readinessAtStart: { data: 77, tech: 48, org: 38 } },
  { id: 'H-011', industry: 'HEALTH', sizeSegment: 'LARGE', programmeType: 'RCM AI Automation', startYear: 2024, waveOneMonths: 0, waveOneInvestment: 5800000, waveOneAnnualValue: 0, waveOneROI: 0, timeToFirstValue: 0, succeeded: false, keyFailureFactor: 'Leadership team had 3 C-suite departures in first 12 months; programme orphaned', readinessAtStart: { data: 61, tech: 52, org: 46 } },
  { id: 'H-012', industry: 'HEALTH', sizeSegment: 'MID', programmeType: 'RCM AI Automation', startYear: 2023, waveOneMonths: 11, waveOneInvestment: 4200000, waveOneAnnualValue: 21000000, waveOneROI: 5.0, timeToFirstValue: 7, succeeded: true, keySuccessFactor: 'Outcome-based vendor contract; CFO credibility from early denial rate wins', readinessAtStart: { data: 63, tech: 44, org: 41 } },

  // ── FINANCE ────────────────────────────────────────────────────────────
  { id: 'F-001', industry: 'FINANCE', sizeSegment: 'SMALL', programmeType: 'Fraud Detection ML', startYear: 2023, waveOneMonths: 9, waveOneInvestment: 2400000, waveOneAnnualValue: 3800000, waveOneROI: 1.6, timeToFirstValue: 6, succeeded: true, keySuccessFactor: 'FedNow API layer completed before model go-live; real-time scoring enabled', readinessAtStart: { data: 64, tech: 46, org: 48 } },
  { id: 'F-002', industry: 'FINANCE', sizeSegment: 'SMALL', programmeType: 'Fraud Detection ML', startYear: 2022, waveOneMonths: 0, waveOneInvestment: 2100000, waveOneAnnualValue: 0, waveOneROI: 0, timeToFirstValue: 0, succeeded: false, keyFailureFactor: 'Real-time data unavailable; batch model 4-hour lag produced unusable results', readinessAtStart: { data: 48, tech: 32, org: 44 } },
  { id: 'F-003', industry: 'FINANCE', sizeSegment: 'SMALL', programmeType: 'AML Automation', startYear: 2023, waveOneMonths: 12, waveOneInvestment: 3200000, waveOneAnnualValue: 4800000, waveOneROI: 1.5, timeToFirstValue: 8, succeeded: true, keySuccessFactor: 'Regulatory benefit (OCC MRA closure) built internal urgency beyond pure ROI', readinessAtStart: { data: 58, tech: 38, org: 52 } },

  // ── RETAIL ─────────────────────────────────────────────────────────────
  { id: 'R-001', industry: 'RETAIL', sizeSegment: 'LARGE', programmeType: 'Personalisation Engine', startYear: 2022, waveOneMonths: 8, waveOneInvestment: 2800000, waveOneAnnualValue: 210000000, waveOneROI: 75.0, timeToFirstValue: 3, succeeded: true, keySuccessFactor: 'Existing Salesforce Einstein licence activated; identity resolution completed before launch', readinessAtStart: { data: 68, tech: 56, org: 54 } },
  { id: 'R-002', industry: 'RETAIL', sizeSegment: 'LARGE', programmeType: 'Personalisation Engine', startYear: 2023, waveOneMonths: 0, waveOneInvestment: 6400000, waveOneAnnualValue: 0, waveOneROI: 0, timeToFirstValue: 0, succeeded: false, keyFailureFactor: 'CDP fragmentation not resolved; personalised offers sent to duplicate customer records', readinessAtStart: { data: 44, tech: 48, org: 38 } },
  { id: 'R-003', industry: 'RETAIL', sizeSegment: 'LARGE', programmeType: 'Demand Forecasting', startYear: 2022, waveOneMonths: 14, waveOneInvestment: 7200000, waveOneAnnualValue: 48000000, waveOneROI: 6.7, timeToFirstValue: 10, succeeded: true, keySuccessFactor: 'SAP integration completed as Wave 0 prerequisite; demand accuracy 88% at launch', readinessAtStart: { data: 72, tech: 58, org: 46 } },
  { id: 'R-004', industry: 'RETAIL', sizeSegment: 'LARGE', programmeType: 'Demand Forecasting', startYear: 2023, waveOneMonths: 0, waveOneInvestment: 8200000, waveOneAnnualValue: 0, waveOneROI: 0, timeToFirstValue: 0, succeeded: false, keyFailureFactor: 'CDO vacant; SAP-Snowflake pipeline incomplete; o9 vendor selected on demo quality', readinessAtStart: { data: 52, tech: 48, org: 32 } },
]

// Aggregated peer outcome metrics for Meridian RCM AI comparison
export const MERIDIAN_PEER_CONTEXT = {
  rcmAI: {
    totalDeployments: 47,
    successCount: 31,
    failureCount: 16,
    successRate: 66,
    medianAnnualValue: 19000000,
    topQuartileAnnualValue: 34000000,
    medianTimeToValue: 7, // months
    medianWaveOneInvestment: 5200000,
    medianWaveOneROI: 4.8,
    closestPeers: ['H-004', 'H-001', 'H-012'], // closest data and tech profile
    peersSucceeded: ['H-001', 'H-002', 'H-004', 'H-007', 'H-008', 'H-009', 'H-010', 'H-012'],
    peersFailed: ['H-003', 'H-006', 'H-011'],
  },
  contextNote: 'Your situation maps closest to H-001, H-004, and H-012 based on: data readiness profile, IT budget, payer mix, and Epic architecture. All three succeeded.',
}
