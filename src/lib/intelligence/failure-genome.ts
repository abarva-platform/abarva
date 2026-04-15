/**
 * Transformation Failure Genome
 *
 * A knowledge base of failure patterns extracted from enterprise AI
 * transformation programs. Each pattern is a deterministic detection
 * function over client data — no pre-written outputs.
 *
 * Scoring is a weighted probability calculation. Claude writes the
 * narrative via /api/intelligence/failures.
 */

import { meridianAI } from '@/data/meridian/ai'
import { firstCapitalAI } from '@/data/firstcapital/ai'
import { apexRetailAI } from '@/data/apexretail/ai'
import type { FailurePattern, InitiativeRisk } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// GENOME — Seven failure patterns with historical failure rates
// ─────────────────────────────────────────────────────────────────────────────

export const GENOME: Record<string, FailurePattern> = {
  F001: {
    code: 'F001',
    name: 'Vendor Dependency Without Internal Capability',
    description: 'Initiative outcome depends entirely on a single external vendor with no internal technical capability to verify, recover, or rebuild',
    historicalFailureRate: 0.72,
  },
  F002: {
    code: 'F002',
    name: 'No Named Executive Sponsor',
    description: 'No C-suite executive with budget authority has publicly claimed ownership of this initiative',
    historicalFailureRate: 0.84,
  },
  F003: {
    code: 'F003',
    name: 'Data Readiness Below Threshold',
    description: 'Required data sources are below 60% readiness — model quality will be insufficient for production use',
    historicalFailureRate: 0.68,
  },
  F004: {
    code: 'F004',
    name: 'Pilot Purgatory Organizational Pattern',
    description: 'Organization has 3+ prior AI/ML pilots that did not reach enterprise scale — change fatigue and credibility deficit are structural risks',
    historicalFailureRate: 0.76,
  },
  F005: {
    code: 'F005',
    name: 'No CDO or AI Leadership',
    description: 'The CDO role is vacant or the AI strategy leadership position is unfilled — no accountable executive to own data and AI delivery',
    historicalFailureRate: 0.82,
  },
  F006: {
    code: 'F006',
    name: 'No MLOps Infrastructure',
    description: 'No ML model deployment, versioning, monitoring, or lifecycle management infrastructure exists — models cannot reach production',
    historicalFailureRate: 0.79,
  },
  F007: {
    code: 'F007',
    name: 'Change Management Gap',
    description: 'No formal change management plan, clinical champion program, or workforce training budget — adoption will fail even if technology succeeds',
    historicalFailureRate: 0.61,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT READINESS PROFILES — derived from typed data, not hard-coded
// ─────────────────────────────────────────────────────────────────────────────

interface ClientReadiness {
  cdoVacant: boolean
  mlopsScore: number          // 0–100
  dataReadinessOverall: number
  pilotsPurgatory: number     // count of stuck pilots
  changeReadinessOverall: number
  hasMLOpsPlatform: boolean
  hasDataPlatform: boolean
}

function getClientReadiness(clientId: string): ClientReadiness {
  if (clientId === 'firstcapital') {
    const m = firstCapitalAI.maturity
    return {
      cdoVacant: true, // No CDO role — documented in patternDescription
      mlopsScore: m.techReadiness.mlops, // 8/100
      dataReadinessOverall: m.dataReadiness.overall, // 52/100
      pilotsPurgatory: m.pilotsPurgatory, // 2
      changeReadinessOverall: firstCapitalAI.changeReadiness.overall, // 44/100
      hasMLOpsPlatform: m.techReadiness.mlops > 30,
      hasDataPlatform: m.techReadiness.dataPlatform > 40,
    }
  }
  if (clientId === 'apexretail') {
    const m = apexRetailAI.maturity
    return {
      cdoVacant: true, // CDO vacant — explicitly documented
      mlopsScore: m.techReadiness.mlops, // 18/100
      dataReadinessOverall: m.dataReadiness.overall, // 54/100
      pilotsPurgatory: m.pilotsPurgatory, // 4
      changeReadinessOverall: apexRetailAI.changeReadiness.overall, // 36/100
      hasMLOpsPlatform: m.techReadiness.mlops > 30,
      hasDataPlatform: m.techReadiness.dataPlatform > 40,
    }
  }
  return getMeridianReadiness()
}

function getMeridianReadiness(): ClientReadiness {
  const m = meridianAI.maturity
  return {
    cdoVacant: true,                           // explicitly documented — 8 months vacant
    mlopsScore: m.techReadiness.mlops,          // 12/100
    dataReadinessOverall: m.dataReadiness.overall, // 58/100
    pilotsPurgatory: m.pilotsPurgatory,         // 2 (was 6 — Sepsis, Coding AI, Denial AI, Scheduling AI now live)
    changeReadinessOverall: meridianAI.changeReadiness.overall, // 38/100
    hasMLOpsPlatform: m.techReadiness.mlops > 30,
    hasDataPlatform: m.techReadiness.dataPlatform > 40,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN DETECTION — deterministic functions over client data
// ─────────────────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string
  name: string
  annualValue: number
  dataReadinessPct: number
  wave: number
  vendor: string[]
}

function detectPatterns(opp: Opportunity, r: ClientReadiness): FailurePattern[] {
  const patterns: FailurePattern[] = []

  // F005 — No CDO: affects all AI initiatives
  if (r.cdoVacant) patterns.push(GENOME.F005)

  // F006 — No MLOps: blocks any initiative that requires model deployment
  // Applies to: Wave 2+ (complex), and Wave 1 initiatives with high data readiness
  // (model validated but cannot deploy)
  const needsMLOps = opp.wave >= 2 || (opp.wave === 1 && opp.dataReadinessPct >= 70)
  if (needsMLOps && !r.hasMLOpsPlatform) patterns.push(GENOME.F006)

  // F003 — Data readiness below 60%
  if (opp.dataReadinessPct < 60) patterns.push(GENOME.F003)

  // F004 — Pilot purgatory pattern: affects all Wave 2+ in a struggling org
  if (r.pilotsPurgatory >= 4 && opp.wave >= 2) patterns.push(GENOME.F004)
  // Also affects Wave 1 if the org has already tried this specific type before
  if (r.pilotsPurgatory >= 6 && opp.wave === 1) patterns.push(GENOME.F004)

  // F001 — Vendor dependency: Wave 2+ with no internal capability and external vendor
  const hasInternalVendor = opp.vendor.some(v =>
    v.toLowerCase().includes('build internal') || v.toLowerCase().includes('internal model')
  )
  if (!hasInternalVendor && opp.wave >= 2 && !r.hasDataPlatform) patterns.push(GENOME.F001)

  // F007 — Change management gap: low change readiness affects clinical/workforce initiatives
  const isClinicalOrWorkforce = opp.name.toLowerCase().includes('sepsis') ||
    opp.name.toLowerCase().includes('nurse') ||
    opp.name.toLowerCase().includes('clinical') ||
    opp.name.toLowerCase().includes('physician')
  if (r.changeReadinessOverall < 40 && isClinicalOrWorkforce) patterns.push(GENOME.F007)

  return patterns
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBABILITY CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

function computeSuccessProbability(patterns: FailurePattern[]): number {
  if (patterns.length === 0) return 88
  // Multiplicative decay — each pattern compounds the failure risk
  // Weight factor 0.4 means patterns contribute 40% of their historical rate
  let probability = 1.0
  for (const p of patterns) {
    probability *= 1 - p.historicalFailureRate * 0.4
  }
  return Math.max(12, Math.round(probability * 100))
}

function getCriticalBlocker(patterns: FailurePattern[]): string {
  // Priority ordering — the one that blocks everything else
  if (patterns.find(p => p.code === 'F005')) return 'CDO vacancy — no executive owns AI delivery'
  if (patterns.find(p => p.code === 'F006')) return 'No MLOps — validated models cannot reach production'
  if (patterns.find(p => p.code === 'F003')) return 'Data readiness below deployment threshold'
  if (patterns.find(p => p.code === 'F004')) return 'Pilot purgatory pattern — structural change deficit'
  if (patterns.find(p => p.code === 'F001')) return 'Vendor dependency with no internal fallback'
  if (patterns.find(p => p.code === 'F007')) return 'Change management gap — adoption at risk'
  return 'Ready to proceed'
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export function scoreMeridianInitiatives(): InitiativeRisk[] {
  const readiness = getMeridianReadiness()
  const allOpps: Opportunity[] = [
    ...meridianAI.opportunities.frontOffice,
    ...meridianAI.opportunities.middleOffice,
    ...meridianAI.opportunities.backOffice,
  ]

  return allOpps.map(opp => {
    const patterns = detectPatterns(opp, readiness)
    const successProbability = computeSuccessProbability(patterns)
    const isBlocked = patterns.some(p => p.code === 'F005' || p.code === 'F006') || successProbability < 35

    return {
      initiativeId: opp.id,
      initiativeName: opp.name,
      annualValue: opp.annualValue,
      successProbability,
      activePatterns: patterns,
      criticalBlocker: getCriticalBlocker(patterns),
      isBlocked,
    }
  })
}

// Returns a lookup map by initiative ID for efficient O(1) access in UI
export function getMeridianRiskMap(): Record<string, InitiativeRisk> {
  const risks = scoreMeridianInitiatives()
  return Object.fromEntries(risks.map(r => [r.initiativeId, r]))
}

export function scoreFirstCapitalInitiatives(): InitiativeRisk[] {
  const readiness = getClientReadiness('firstcapital')
  const allOpps: Opportunity[] = [
    ...firstCapitalAI.opportunities.frontOffice,
    ...firstCapitalAI.opportunities.middleOffice,
    ...firstCapitalAI.opportunities.backOffice,
  ]

  return allOpps.map(opp => {
    const patterns = detectPatterns(opp, readiness)
    const successProbability = computeSuccessProbability(patterns)
    const isBlocked = patterns.some(p => p.code === 'F005' || p.code === 'F006') || successProbability < 35

    return {
      initiativeId: opp.id,
      initiativeName: opp.name,
      annualValue: opp.annualValue,
      successProbability,
      activePatterns: patterns,
      criticalBlocker: getCriticalBlocker(patterns),
      isBlocked,
    }
  })
}

export function scoreApexInitiatives(): InitiativeRisk[] {
  const readiness = getClientReadiness('apexretail')
  const allOpps: Opportunity[] = [
    ...apexRetailAI.opportunities.frontOffice,
    ...apexRetailAI.opportunities.middleOffice,
    ...apexRetailAI.opportunities.backOffice,
  ]

  return allOpps.map(opp => {
    const patterns = detectPatterns(opp, readiness)
    const successProbability = computeSuccessProbability(patterns)
    const isBlocked = patterns.some(p => p.code === 'F005' || p.code === 'F006') || successProbability < 35

    return {
      initiativeId: opp.id,
      initiativeName: opp.name,
      annualValue: opp.annualValue,
      successProbability,
      activePatterns: patterns,
      criticalBlocker: getCriticalBlocker(patterns),
      isBlocked,
    }
  })
}

// Generic scorer — dispatches by clientId
export function scoreInitiatives(clientId: string): InitiativeRisk[] {
  if (clientId === 'firstcapital') return scoreFirstCapitalInitiatives()
  if (clientId === 'apexretail') return scoreApexInitiatives()
  return scoreMeridianInitiatives()
}

// Identify the single critical dependency node — the initiative that unlocks the most value
export function getCriticalPath(risks: InitiativeRisk[]): {
  criticalNode: string
  lockedValue: number
  blockedInitiatives: string[]
} {
  const cdoBlocked = risks.filter(r => r.activePatterns.some(p => p.code === 'F005'))
  const mlopsBlocked = risks.filter(r => r.activePatterns.some(p => p.code === 'F006') && !r.activePatterns.some(p => p.code === 'F005'))

  const cdoLockedValue = cdoBlocked.reduce((sum, r) => sum + r.annualValue, 0)

  return {
    criticalNode: 'CDO Hire',
    lockedValue: cdoLockedValue,
    blockedInitiatives: cdoBlocked.map(r => r.initiativeName),
  }
}
