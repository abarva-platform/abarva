// MW8 · Workshop Outcome Synthesis
//
// Deterministic synthesizer that converts raw meeting-note captures
// (decisions, actions, risks, questions, evidence gaps) into a
// structured SynthesizedOutcome report.
//
// Design constraints:
//   - proposed: true on every output — no program state is ever modified
//   - No model calls, no DB writes, no fetch, no Date.now() reads
//   - No 'use client' — pure server/shared utility
//   - Does NOT import MW4 types to avoid tight coupling; defines its
//     own lean input contract (WorkshopCapture)
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export interface WorkshopCapture {
  workshopId: string
  captureType: 'decision' | 'action' | 'risk' | 'question' | 'evidence_gap'
  content: string
  owner?: string
  priority: 'high' | 'medium' | 'low'
}

export interface SynthesizedOutcome {
  workshopId: string
  confirmedDecisions: WorkshopCapture[]
  openActions: WorkshopCapture[]      // captureType === 'action'
  openQuestions: WorkshopCapture[]    // captureType === 'question'
  evidenceGaps: WorkshopCapture[]     // captureType === 'evidence_gap'
  risks: WorkshopCapture[]            // captureType === 'risk'
  nextWorkshopRecommendation: string  // e.g. 'architecture_review' or 'value_mapping'
  synthesisQuality: 'high' | 'medium' | 'low'  // based on count of captures
  honestDisclaimer: string
  proposed: true
  createdFrom: 'mw8_workshop_outcome_synthesis'
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

/**
 * Derives the recommended next workshop type from the current workshop ID.
 * Deterministic — same input always returns the same output.
 */
function deriveNextWorkshopRecommendation(workshopId: string): string {
  const id = workshopId.toLowerCase()

  if (id.includes('current_state_discovery') || id.includes('discovery')) {
    return 'value_mapping'
  }
  if (id.includes('value_mapping') || id.includes('value-mapping')) {
    return 'architecture_review'
  }
  if (id.includes('architecture_review') || id.includes('architecture-review')) {
    return 'governance_alignment'
  }
  if (id.includes('governance_alignment') || id.includes('governance')) {
    return 'adoption_planning'
  }
  if (id.includes('adoption_planning') || id.includes('adoption')) {
    return 'executive_review'
  }
  if (id.includes('executive_review') || id.includes('executive')) {
    return 'program_close'
  }
  if (id.includes('framing') || id.includes('problem_framing')) {
    return 'current_state_discovery'
  }

  // Stable fallback derived from the workshopId string to remain deterministic
  const fallbacks = [
    'current_state_discovery',
    'value_mapping',
    'architecture_review',
    'governance_alignment',
    'adoption_planning',
    'executive_review',
  ]
  let hash = 0
  for (let i = 0; i < workshopId.length; i++) {
    hash = (hash * 31 + workshopId.charCodeAt(i)) >>> 0
  }
  return fallbacks[hash % fallbacks.length]
}

/**
 * Scores synthesis quality based on the number of captures provided.
 */
function scoreSynthesisQuality(count: number): 'high' | 'medium' | 'low' {
  if (count >= 6) return 'high'
  if (count >= 3) return 'medium'
  return 'low'
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Synthesizes workshop outcomes from meeting note captures.
 *
 * The returned SynthesizedOutcome is always `proposed: true` — no
 * program state is modified by calling this function.
 */
export function synthesizeWorkshopOutcomes(
  workshopId: string,
  captures: WorkshopCapture[]
): SynthesizedOutcome {
  const confirmedDecisions = captures.filter((c) => c.captureType === 'decision')
  const openActions = captures.filter((c) => c.captureType === 'action')
  const openQuestions = captures.filter((c) => c.captureType === 'question')
  const evidenceGaps = captures.filter((c) => c.captureType === 'evidence_gap')
  const risks = captures.filter((c) => c.captureType === 'risk')

  return {
    workshopId,
    confirmedDecisions,
    openActions,
    openQuestions,
    evidenceGaps,
    risks,
    nextWorkshopRecommendation: deriveNextWorkshopRecommendation(workshopId),
    synthesisQuality: scoreSynthesisQuality(captures.length),
    honestDisclaimer:
      'Synthesis is proposed only; no program state has been modified.',
    proposed: true,
    createdFrom: 'mw8_workshop_outcome_synthesis',
  }
}

/**
 * Returns 5–8 deterministic sample captures for a given workshopId.
 * Useful for seeding the UI with realistic placeholder content.
 */
export function buildDefaultWorkshopCaptures(workshopId: string): WorkshopCapture[] {
  return [
    {
      workshopId,
      captureType: 'decision',
      content: 'Adopt phased rollout approach starting with pilot cohort.',
      owner: 'Program Lead',
      priority: 'high',
    },
    {
      workshopId,
      captureType: 'decision',
      content: 'Proceed with vendor-provided integration layer rather than custom build.',
      owner: 'Technical Lead',
      priority: 'high',
    },
    {
      workshopId,
      captureType: 'action',
      content: 'Document current-state data flows for all impacted systems.',
      owner: 'Business Analyst',
      priority: 'high',
    },
    {
      workshopId,
      captureType: 'action',
      content: 'Schedule follow-on working session with security team.',
      owner: 'Program Lead',
      priority: 'medium',
    },
    {
      workshopId,
      captureType: 'risk',
      content: 'Change fatigue risk if two concurrent programs compete for same user group.',
      priority: 'medium',
    },
    {
      workshopId,
      captureType: 'question',
      content: 'What is the escalation path if pilot metrics fall below threshold?',
      priority: 'high',
    },
    {
      workshopId,
      captureType: 'evidence_gap',
      content: 'Baseline productivity data not yet available for comparison.',
      priority: 'medium',
    },
    {
      workshopId,
      captureType: 'question',
      content: 'Has legal reviewed the data-sharing agreement with the vendor?',
      priority: 'low',
    },
  ]
}

/**
 * Synthesizes outcomes for a portfolio of workshops.
 * Each workshopId gets a default set of captures.
 * Returns one SynthesizedOutcome per workshopId in the same order.
 */
export function synthesizePortfolioOutcomes(workshopIds: string[]): SynthesizedOutcome[] {
  return workshopIds.map((id) =>
    synthesizeWorkshopOutcomes(id, buildDefaultWorkshopCaptures(id))
  )
}
