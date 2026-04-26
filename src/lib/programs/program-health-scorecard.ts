// PROG9 · Program Health Scorecard
//
// Deterministic 5-dimension health scorecard for programs. Aggregates
// signals from the PROG8 phase gate advancement flow and the MW7
// workshop template library into a structured letter-graded scorecard
// the Atlas executive, Steward, and Maestro dashboards can surface
// directly without any live state ingestion.
//
// What this module deliberately does NOT do:
//   - No DB writes, no migrations, no persistence layer.
//   - No model invocations. No live clocks. No randomness. No network IO.
//   - No 'use client'. No React imports.
//   - All outputs are deterministic seeds keyed only by programId.
//
// createdFrom: 'prog9_program_health_scorecard' on every output.

import {
  buildWorkshopTemplateLibrary,
  listWorkshopTemplateCategories,
} from './workshop-template-library'

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export interface ProgramHealthDimension {
  id: string
  label: string
  score: number        // 0–1
  status: 'healthy' | 'at_risk' | 'critical'
  notes: string[]
}

export interface ProgramHealthScorecard {
  programId: string
  overallScore: number    // weighted average of dimensions
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  dimensions: ProgramHealthDimension[]
  topStrength: string     // dimension id with highest score
  topRisk: string         // dimension id with lowest score
  recommendedNextAction: string
  honestDisclaimer: string
  createdFrom: 'prog9_program_health_scorecard'
}

export interface ProgramHealthSummary {
  scorecards: ProgramHealthScorecard[]
  averageOverallScore: number
  healthyCount: number    // grade A or B
  atRiskCount: number     // grade C or D
  criticalCount: number   // grade F
  createdFrom: 'prog9_program_health_scorecard'
}

// ---------------------------------------------------------------------
// Canonical demo program IDs (Apex Retail seed — memory anchor)
// ---------------------------------------------------------------------

const CANONICAL_PROGRAM_IDS: ReadonlyArray<string> = [
  'contact-center-ai-transformation',
  'unified-customer-data-platform',
  'store-associate-productivity',
  'owned-brand-margin-acceleration',
  'demand-forecasting-ai',
]

export function getDefaultProgramIds(): string[] {
  return [...CANONICAL_PROGRAM_IDS]
}

// ---------------------------------------------------------------------
// Deterministic seed helpers
// ---------------------------------------------------------------------

/**
 * Stable string hash (djb2) — no randomness, no Date.now().
 * Returns a non-negative integer.
 */
function djb2(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0 // keep as uint32
  }
  return hash
}

/**
 * Maps a hash deterministically into [min, max].
 */
function seedInRange(hash: number, min: number, max: number): number {
  const span = max - min
  return min + (hash % 10000) / 10000 * span
}

/**
 * Derive a stable score in [min, max] for (programId, dimensionKey).
 */
function dimensionScore(programId: string, dimensionKey: string, min: number, max: number): number {
  const hash = djb2(`${programId}::${dimensionKey}`)
  const raw = seedInRange(hash, min, max)
  // Round to 2 decimal places for legibility
  return Math.round(raw * 100) / 100
}

// ---------------------------------------------------------------------
// Grade classification
// ---------------------------------------------------------------------

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.8) return 'A'
  if (score >= 0.65) return 'B'
  if (score >= 0.5) return 'C'
  if (score >= 0.35) return 'D'
  return 'F'
}

function scoreToStatus(score: number): 'healthy' | 'at_risk' | 'critical' {
  if (score >= 0.65) return 'healthy'
  if (score >= 0.35) return 'at_risk'
  return 'critical'
}

// ---------------------------------------------------------------------
// Dimension builders
// ---------------------------------------------------------------------

function buildPhaseGateHealthDimension(programId: string): ProgramHealthDimension {
  // Phase gate health varies by programId — use the advancement flow as
  // a conceptual anchor. Scores seeded from the programId so they are
  // stable across renders.
  const score = dimensionScore(programId, 'phase_gate_health', 0.3, 0.95)
  const status = scoreToStatus(score)
  const notes: string[] = []

  if (status === 'healthy') {
    notes.push('Phase gate advancement signals are on track.')
    notes.push('No blocking readiness gaps detected in current gate review.')
  } else if (status === 'at_risk') {
    notes.push('One or more gate readiness signals are partially incomplete.')
    notes.push('Steward review of missing inputs is recommended before next gate.')
  } else {
    notes.push('Gate advancement is blocked — critical readiness gaps remain.')
    notes.push('Waiver or expedited Steward review required to proceed.')
  }

  return {
    id: 'phase_gate_health',
    label: 'Phase Gate Health',
    score,
    status,
    notes,
  }
}

function buildWorkshopCoverageDimension(programId: string): ProgramHealthDimension {
  // Workshop coverage = ratio of distinct categories covered in the
  // workshop template library that are relevant to this program.
  // We seed coverage count from the programId then normalise over total
  // available categories.
  const allCategories = listWorkshopTemplateCategories()
  const totalCategories = allCategories.length || 1

  const allTemplates = buildWorkshopTemplateLibrary()
  const totalTemplates = allTemplates.length || 1

  // Seed a "covered" count deterministically
  const coverageHash = djb2(`${programId}::workshop_coverage`)
  // coverage ranges: at least 40% of categories, at most 100%
  const coveredCategories = Math.max(
    Math.floor(totalCategories * 0.4),
    Math.floor((coverageHash % totalCategories) + 1),
  )
  const cappedCovered = Math.min(coveredCategories, totalCategories)
  const score = Math.round((cappedCovered / totalCategories) * 100) / 100
  const status = scoreToStatus(score)

  const notes: string[] = [
    `${cappedCovered} of ${totalCategories} workshop categories covered across ${totalTemplates} library templates.`,
  ]
  if (status === 'at_risk') {
    notes.push('Consider scheduling discovery or governance workshops to close gaps.')
  } else if (status === 'critical') {
    notes.push('Workshop coverage is critically low — program framing may be incomplete.')
  }

  return {
    id: 'workshop_coverage',
    label: 'Workshop Coverage',
    score,
    status,
    notes,
  }
}

function buildEvidenceQualityDimension(programId: string): ProgramHealthDimension {
  const score = dimensionScore(programId, 'evidence_quality', 0.4, 0.9)
  const status = scoreToStatus(score)
  const notes: string[] = []

  if (status === 'healthy') {
    notes.push('Evidence artifacts are well-formed and traceable to deliverables.')
    notes.push('Stakeholder sign-off is current on key evidence packages.')
  } else if (status === 'at_risk') {
    notes.push('Some evidence packages lack sufficient depth or stakeholder attestation.')
    notes.push('Recommended: review evidence trace for phase 2–3 deliverables.')
  } else {
    notes.push('Evidence quality is critically low — artifacts may be missing or unsigned.')
    notes.push('Escalation to Steward recommended before advancing any hard gate.')
  }

  return {
    id: 'evidence_quality',
    label: 'Evidence Quality',
    score,
    status,
    notes,
  }
}

function buildDeliverableCompletionDimension(programId: string): ProgramHealthDimension {
  const score = dimensionScore(programId, 'deliverable_completion', 0.3, 0.95)
  const status = scoreToStatus(score)
  const notes: string[] = []

  if (status === 'healthy') {
    notes.push('Deliverable completion rate is within healthy thresholds.')
    notes.push('No overdue deliverables flagged in current phase.')
  } else if (status === 'at_risk') {
    notes.push('Several deliverables are in-progress but approaching phase deadlines.')
    notes.push('Program Maestro should prioritize completion of gating deliverables.')
  } else {
    notes.push('Deliverable completion is critically low — program execution is at risk.')
    notes.push('Intervention: triage blocked deliverables and assign ownership.')
  }

  return {
    id: 'deliverable_completion',
    label: 'Deliverable Completion',
    score,
    status,
    notes,
  }
}

function buildRiskPostureDimension(programId: string): ProgramHealthDimension {
  // Higher score = better risk posture (i.e., fewer / lower-severity risks)
  const score = dimensionScore(programId, 'risk_posture', 0.2, 0.85)
  const status = scoreToStatus(score)
  const notes: string[] = []

  if (status === 'healthy') {
    notes.push('Risk posture is within acceptable bounds.')
    notes.push('Mitigation plans exist for all flagged risks.')
  } else if (status === 'at_risk') {
    notes.push('One or more medium-severity risks lack active mitigation plans.')
    notes.push('Recommend: schedule a risk review workshop with the Steward.')
  } else {
    notes.push('Critical open risks are unmitigated — program health is in jeopardy.')
    notes.push('Escalation required: executive sponsor visibility needed immediately.')
  }

  return {
    id: 'risk_posture',
    label: 'Risk Posture',
    score,
    status,
    notes,
  }
}

// ---------------------------------------------------------------------
// Weighted average
// ---------------------------------------------------------------------

// Weights sum to 1.0
const DIMENSION_WEIGHTS: Record<string, number> = {
  phase_gate_health: 0.30,
  workshop_coverage: 0.15,
  evidence_quality: 0.20,
  deliverable_completion: 0.25,
  risk_posture: 0.10,
}

function computeOverallScore(dimensions: ProgramHealthDimension[]): number {
  let weighted = 0
  for (const dim of dimensions) {
    const weight = DIMENSION_WEIGHTS[dim.id] ?? 0
    weighted += dim.score * weight
  }
  return Math.round(weighted * 100) / 100
}

// ---------------------------------------------------------------------
// Recommended next action (deterministic per grade + programId)
// ---------------------------------------------------------------------

function deriveRecommendedNextAction(
  grade: 'A' | 'B' | 'C' | 'D' | 'F',
  topRiskId: string,
): string {
  const actionMap: Record<string, string> = {
    phase_gate_health: 'Schedule a Steward gate-readiness review to unblock advancement.',
    workshop_coverage: 'Book a discovery or governance workshop to close coverage gaps.',
    evidence_quality: 'Audit evidence packages and obtain missing stakeholder attestations.',
    deliverable_completion: 'Triage overdue deliverables and re-assign ownership with Maestro.',
    risk_posture: 'Convene a risk review session and establish mitigation owners.',
  }

  const prefix =
    grade === 'A' ? 'Maintain momentum: ' :
    grade === 'B' ? 'Minor improvements needed: ' :
    grade === 'C' ? 'Attention required: ' :
    grade === 'D' ? 'Urgent action needed: ' :
    'Critical intervention required: '

  return prefix + (actionMap[topRiskId] ?? 'Review all health dimensions with the program Steward.')
}

// ---------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------

export function buildProgramHealthScorecard(programId: string): ProgramHealthScorecard {
  const dimensions: ProgramHealthDimension[] = [
    buildPhaseGateHealthDimension(programId),
    buildWorkshopCoverageDimension(programId),
    buildEvidenceQualityDimension(programId),
    buildDeliverableCompletionDimension(programId),
    buildRiskPostureDimension(programId),
  ]

  const overallScore = computeOverallScore(dimensions)
  const grade = scoreToGrade(overallScore)

  // topStrength = dimension with highest score
  const topStrengthDim = dimensions.reduce((best, d) => d.score > best.score ? d : best, dimensions[0])
  // topRisk = dimension with lowest score
  const topRiskDim = dimensions.reduce((worst, d) => d.score < worst.score ? d : worst, dimensions[0])

  const recommendedNextAction = deriveRecommendedNextAction(grade, topRiskDim.id)

  const honestDisclaimer =
    'All scores are deterministic seed data derived solely from the programId. ' +
    'No live program state, DB queries, or model inference were used. ' +
    'This scorecard reflects illustrative demo health signals only — not production program status.'

  return {
    programId,
    overallScore,
    grade,
    dimensions,
    topStrength: topStrengthDim.id,
    topRisk: topRiskDim.id,
    recommendedNextAction,
    honestDisclaimer,
    createdFrom: 'prog9_program_health_scorecard',
  }
}

// ---------------------------------------------------------------------
// Summary builder
// ---------------------------------------------------------------------

export function buildProgramHealthSummary(programIds: string[]): ProgramHealthSummary {
  const scorecards = programIds.map(buildProgramHealthScorecard)

  const averageOverallScore =
    scorecards.length === 0
      ? 0
      : Math.round(
          (scorecards.reduce((sum, s) => sum + s.overallScore, 0) / scorecards.length) * 100,
        ) / 100

  const healthyCount = scorecards.filter((s) => s.grade === 'A' || s.grade === 'B').length
  const atRiskCount = scorecards.filter((s) => s.grade === 'C' || s.grade === 'D').length
  const criticalCount = scorecards.filter((s) => s.grade === 'F').length

  return {
    scorecards,
    averageOverallScore,
    healthyCount,
    atRiskCount,
    criticalCount,
    createdFrom: 'prog9_program_health_scorecard',
  }
}
