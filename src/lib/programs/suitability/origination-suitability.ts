// Origination ↔ suitability adapter · Wave 2, Slice 2.1.
//
// The seam that lets the Moves origination/shaping path call the agentic
// suitability classifier without rewiring the surface. It maps the tenant's
// five-dimension data-readiness ledger onto the three readiness dimensions
// the archetype taxonomy gates reference (data / control / eval), then runs
// the classifier over the origination brief's free text.
//
// Both mappers are deterministic and pure (client- and server-safe). The
// `submitOriginationBrief` server action composes `assessOriginationBrief`
// to embed the assessment into the engagement charter JSONB — a logic-only
// integration, no surface change, no DB migration.

import {
  assessAgenticSuitability,
  type SuitabilityAssessment,
} from '@/lib/programs/suitability/agentic-suitability';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';
import type { MaturityLevel } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type {
  ReadinessDimension as LedgerDimension,
  ReadinessDimensionInput,
  ReadinessStatus,
} from '@/lib/workflow/dataReadiness';

/** Ordinal ranking of taxonomy maturity for averaging. */
const MATURITY_RANK: Readonly<Record<MaturityLevel, number>> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
};
const RANK_TO_MATURITY: readonly MaturityLevel[] = ['none', 'low', 'moderate', 'high'];

/** A data-readiness ledger status → taxonomy maturity level. */
function statusToMaturity(status: ReadinessStatus): MaturityLevel {
  switch (status) {
    case 'ready':
      return 'high';
    case 'gaps':
      return 'moderate';
    case 'blocked':
      return 'none';
    default:
      return 'low';
  }
}

/** Average a set of maturity levels, rounded to the nearest rung. */
function averageMaturity(levels: MaturityLevel[]): MaturityLevel {
  if (levels.length === 0) return 'low';
  const mean =
    levels.reduce((sum, l) => sum + MATURITY_RANK[l], 0) / levels.length;
  return RANK_TO_MATURITY[Math.max(0, Math.min(3, Math.round(mean)))];
}

/**
 * Map the data-readiness ledger's five dimensions onto the three readiness
 * dimensions the archetype taxonomy gates reference:
 *
 *   - data    ← availability + quality      (is the grounding there and fresh?)
 *   - control ← governance + skills         (can we operate it safely?)
 *   - eval    ← integration                 (production-grade pipelines / harness)
 *
 * Conservative: a missing ledger dimension defaults to `low`.
 */
export function readinessProfileFromLedger(
  dimensions: readonly ReadinessDimensionInput[],
): ReadinessProfile {
  const byDimension = new Map<LedgerDimension, MaturityLevel>();
  for (const d of dimensions) {
    byDimension.set(d.dimension, statusToMaturity(d.status));
  }
  const at = (dim: LedgerDimension): MaturityLevel => byDimension.get(dim) ?? 'low';

  return {
    data: averageMaturity([at('availability'), at('quality')]),
    control: averageMaturity([at('governance'), at('skills')]),
    eval: at('integration'),
  };
}

/** The free-text origination fields the classifier reads. */
export interface OriginationBriefSignals {
  programName: string;
  problemStatement: string;
  targetOutcome?: string | null;
  classification?: string | null;
}

/** The assessment plus the inputs it was derived from — embeddable in a charter. */
export interface OriginationSuitabilityResult {
  assessment: SuitabilityAssessment;
  readiness: ReadinessProfile;
  /** The free text the classifier was run over. */
  proposedMove: string;
}

/**
 * The single call the Moves origination path makes: build the proposed-Move
 * free text from the brief, derive the readiness profile from the data-
 * readiness ledger (empty when no ledger entry exists yet — the mapper
 * defaults conservatively), then assess.
 */
export function assessOriginationBrief(
  brief: OriginationBriefSignals,
  dimensions: readonly ReadinessDimensionInput[] = [],
): OriginationSuitabilityResult {
  const proposedMove = [
    brief.problemStatement,
    brief.targetOutcome ?? '',
    brief.classification ?? '',
  ]
    .filter((s) => s.trim().length > 0)
    .join(' ')
    .trim();
  const readiness = readinessProfileFromLedger(dimensions);
  const assessment = assessAgenticSuitability(proposedMove, readiness);
  return { assessment, readiness, proposedMove };
}

/**
 * Serialize an assessment to a plain JSON object for the engagement charter.
 * Stable, versioned shape — downstream readers can version against `version`.
 */
export function suitabilityCharterFragment(
  result: OriginationSuitabilityResult,
): Record<string, unknown> {
  return {
    version: 1,
    assessed_at: new Date().toISOString(),
    recommended_archetype: result.assessment.recommendedArchetype,
    recommended_name: result.assessment.recommendedName,
    intended_archetype: result.assessment.intendedArchetype,
    stepped_down: result.assessment.steppedDown,
    anti_pattern_code: result.assessment.antiPatternCode,
    readiness_score: result.assessment.readinessScore,
    readiness_gaps: result.assessment.readinessGaps.map((g) => ({
      dimension: g.dimension,
      current: g.current,
      required: g.required,
      note: g.note,
    })),
    reasons: result.assessment.reasons,
    readiness_profile: result.readiness,
  };
}
