// CTX4 - Context Pack Quality Scoring v2.
//
// Pure deterministic scorer that grades a CTX2 Unified Context Pack
// across ten canonical dimensions, derives an overall band, and
// emits per-dimension risks plus actionable recommendations. The
// scorer is the canonical "is this pack good enough to act on?"
// verdict that any agent runtime would consult after CTX2 builds
// the pack. No model call. No live retrieval. No Date.now reads.
// No randomness. No UI. No migrations.
//
// CTX4 reads ONLY from the CTX2 module (read-only type alignment
// plus structural inspection of the pack value). It explicitly does
// not import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/auth/**, supabase/**
//   - src/lib/programs/mock.ts
//   - any model SDK (anthropic, openai, ...)
//
// The scorer inspects only the structure of the pack value:
// section list, hasContent flags, retrievalSources, governance
// constraints, and identity / work_object resolution. It does NOT
// invoke any CTX2 runtime helper.

import type {
  UnifiedContextPack,
  UnifiedContextSection,
  UnifiedContextSectionKey,
} from '@/lib/architecture/unified-context-builder';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export const CONTEXT_QUALITY_DIMENSIONS = [
  'completeness',
  'evidence_strength',
  'pattern_grounding',
  'solution_grounding',
  'workflow_state',
  'data_readiness',
  'governance_safety',
  'missing_input_severity',
  'sparsity_risk',
  'actionability',
] as const;

export type ContextQualityDimension =
  typeof CONTEXT_QUALITY_DIMENSIONS[number];

export type ContextQualityBand =
  | 'usable'
  | 'partial'
  | 'weak'
  | 'refused';

export interface ContextQualityDimensionScore {
  dimension: ContextQualityDimension;
  score: number; // 0..1
  band: ContextQualityBand;
  rationale: string;
}

export interface ContextQualityRisk {
  kind:
    | 'missing_evidence'
    | 'missing_governance'
    | 'sparse_inputs'
    | 'tenant_scope_unclear'
    | 'work_object_unresolved'
    | 'low_actionability';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ContextQualityRecommendation {
  kind:
    | 'capture_inputs'
    | 'load_evidence'
    | 'add_governance_constraint'
    | 'resolve_work_object'
    | 'request_workshop'
    | 'defer_to_steward';
  description: string;
}

export interface ContextQualityV2Score {
  overallScore: number; // 0..1
  overallBand: ContextQualityBand;
  dimensionScores: readonly ContextQualityDimensionScore[];
  risks: readonly ContextQualityRisk[];
  recommendations: readonly ContextQualityRecommendation[];
  refused: boolean;
  refusalReason?: string;
  basis: {
    scorerVersion: 'ctx4.v1';
    source: 'deterministic_context_quality_scoring';
  };
  createdFrom: 'deterministic_seed';
}

const SCORER_VERSION = 'ctx4.v1' as const;
const SCORER_SOURCE = 'deterministic_context_quality_scoring' as const;

const TOTAL_SECTIONS = 12;

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Score a CTX2 Unified Context Pack across the ten canonical
 * dimensions. Pure: same input pack → byte-equal output across calls.
 */
export function scoreContextQualityV2(
  pack: UnifiedContextPack,
): ContextQualityV2Score {
  const sectionMap = indexSections(pack.sections);
  const dimensionScores: ContextQualityDimensionScore[] = [
    scoreCompleteness(pack, sectionMap),
    scoreEvidenceStrength(pack, sectionMap),
    scorePatternGrounding(sectionMap),
    scoreSolutionGrounding(pack, sectionMap),
    scoreWorkflowState(sectionMap),
    scoreDataReadiness(sectionMap),
    scoreGovernanceSafety(sectionMap),
    scoreMissingInputSeverity(pack, sectionMap),
    scoreSparsityRisk(pack),
    scoreActionability(pack, sectionMap),
  ];

  const overallScore = roundQuarter(
    averageWeighted(dimensionScores.map((d) => d.score)),
  );
  const lowestBand = lowestDimensionBand(dimensionScores);
  const refusalSignal = computeRefusalSignal(pack, overallScore);

  const overallBand: ContextQualityBand = refusalSignal.refused
    ? 'refused'
    : lowestBand;

  const risks = generateRisks(pack, dimensionScores, refusalSignal);
  const recommendations = generateRecommendations(pack, risks);

  const score: ContextQualityV2Score = {
    overallScore,
    overallBand,
    dimensionScores: freezeReadonly(dimensionScores),
    risks: freezeReadonly(risks),
    recommendations: freezeReadonly(recommendations),
    refused: refusalSignal.refused,
    refusalReason: refusalSignal.refused
      ? refusalSignal.reason
      : undefined,
    basis: {
      scorerVersion: SCORER_VERSION,
      source: SCORER_SOURCE,
    },
    createdFrom: 'deterministic_seed',
  };
  return score;
}

/** Re-derive the overall band from a score (idempotent). */
export function classifyContextQualityV2(
  score: ContextQualityV2Score,
): ContextQualityBand {
  if (score.refused) return 'refused';
  return score.overallBand;
}

/** Aggregate counters for surfacing summaries. Pure. */
export function summarizeContextQualityV2(
  score: ContextQualityV2Score,
): {
  totalDimensions: number;
  usableDimensions: number;
  weakDimensions: number;
  topRisks: readonly ContextQualityRisk[];
  topRecommendations: readonly ContextQualityRecommendation[];
} {
  const totalDimensions = score.dimensionScores.length;
  const usableDimensions = score.dimensionScores.filter(
    (d) => d.band === 'usable',
  ).length;
  const weakDimensions = score.dimensionScores.filter(
    (d) => d.band === 'weak' || d.band === 'refused',
  ).length;

  const sortedRisks = [...score.risks].sort(
    (a, b) =>
      severityRank(b.severity) - severityRank(a.severity)
      || a.kind.localeCompare(b.kind),
  );
  const topRisks = sortedRisks.slice(0, 3);
  const topRecommendations = score.recommendations.slice(0, 3);

  return {
    totalDimensions,
    usableDimensions,
    weakDimensions,
    topRisks,
    topRecommendations,
  };
}

/** Convenience accessor; returns the recommendation list. */
export function getContextQualityRecommendations(
  score: ContextQualityV2Score,
): readonly ContextQualityRecommendation[] {
  return score.recommendations;
}

// ---------------------------------------------------------------------
// Section indexing
// ---------------------------------------------------------------------

type SectionMap = Readonly<
  Partial<Record<UnifiedContextSectionKey, UnifiedContextSection>>
>;

function indexSections(
  sections: ReadonlyArray<UnifiedContextSection>,
): SectionMap {
  const out: Partial<Record<UnifiedContextSectionKey, UnifiedContextSection>> = {};
  for (const s of sections) {
    out[s.key] = s;
  }
  return out;
}

function sectionHasContent(
  map: SectionMap,
  key: UnifiedContextSectionKey,
): boolean {
  return map[key]?.hasContent === true;
}

function nonEmptySectionCount(pack: UnifiedContextPack): number {
  return pack.sections.filter((s) => s.hasContent).length;
}

// ---------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------

function scoreCompleteness(
  pack: UnifiedContextPack,
  _map: SectionMap,
): ContextQualityDimensionScore {
  const totalPresent = pack.sections.length;
  const totalNonEmpty = nonEmptySectionCount(pack);
  const denom = Math.max(totalPresent, TOTAL_SECTIONS);
  const ratio = denom > 0 ? totalNonEmpty / denom : 0;
  const score = clamp01(ratio);
  return {
    dimension: 'completeness',
    score,
    band: bandFromScore(score),
    rationale: `${totalNonEmpty} of ${denom} sections carry content.`,
  };
}

function scoreEvidenceStrength(
  pack: UnifiedContextPack,
  map: SectionMap,
): ContextQualityDimensionScore {
  const evidence = map.evidence;
  if (!evidence || !evidence.hasContent) {
    return {
      dimension: 'evidence_strength',
      score: 0,
      band: 'refused',
      rationale: 'Evidence section is empty.',
    };
  }
  const body = evidence.body as
    | {
        usableOnly?: boolean;
        items?: ReadonlyArray<{ id?: string; usable_as_evidence?: boolean }>;
      }
    | undefined;
  const items = Array.isArray(body?.items) ? body!.items! : [];
  const usableIds = items.filter((i) => i?.usable_as_evidence === true).length;
  const usableOnly = body?.usableOnly === true;

  if (usableOnly && usableIds >= 3) {
    return {
      dimension: 'evidence_strength',
      score: 1,
      band: 'usable',
      rationale: `${usableIds} usable_as_evidence ids present with usableOnly=true.`,
    };
  }
  if (usableIds > 0) {
    return {
      dimension: 'evidence_strength',
      score: 0.5,
      band: 'partial',
      rationale: `${usableIds} usable_as_evidence ids present; not yet at the usable bar.`,
    };
  }
  // Some evidence content but no usable_as_evidence flagged.
  return {
    dimension: 'evidence_strength',
    score: 0.25,
    band: 'weak',
    rationale: 'Evidence section has content but no usable_as_evidence ids.',
    // Used by tests to confirm the partial-but-not-usable path is honest.
  };
  // Note: pack source helpers are intentionally not consulted; we
  // grade the projected pack value only. This keeps CTX4 a structural
  // observer of what CTX2 emitted.
}

function scorePatternGrounding(
  map: SectionMap,
): ContextQualityDimensionScore {
  const patterns = map.patterns;
  if (!patterns || !patterns.hasContent) {
    return {
      dimension: 'pattern_grounding',
      score: 0,
      band: 'refused',
      rationale: 'Patterns section is empty.',
    };
  }
  const body = patterns.body as
    | {
        patternKey?: unknown;
        detections?: ReadonlyArray<{ patternKey?: unknown }>;
      }
    | undefined;
  const detections = Array.isArray(body?.detections) ? body!.detections! : [];
  const patternKeys = countPatternKeys(body, detections);
  if (patternKeys >= 3) {
    return {
      dimension: 'pattern_grounding',
      score: 1,
      band: 'usable',
      rationale: `${patternKeys} pattern keys grounded in the pack.`,
    };
  }
  if (patternKeys >= 1) {
    return {
      dimension: 'pattern_grounding',
      score: 0.7,
      band: 'usable',
      rationale: `${patternKeys} pattern key(s) grounded in the pack.`,
    };
  }
  return {
    dimension: 'pattern_grounding',
    score: 0.2,
    band: 'weak',
    rationale: 'Patterns section has content but no pattern keys.',
  };
}

function countPatternKeys(
  body: { patternKey?: unknown } | undefined,
  detections: ReadonlyArray<{ patternKey?: unknown }>,
): number {
  const keys = new Set<string>();
  if (body && typeof body.patternKey === 'string' && body.patternKey.length > 0) {
    keys.add(body.patternKey);
  }
  for (const d of detections) {
    if (typeof d?.patternKey === 'string' && d.patternKey.length > 0) {
      keys.add(d.patternKey);
    }
  }
  return keys.size;
}

function scoreSolutionGrounding(
  pack: UnifiedContextPack,
  map: SectionMap,
): ContextQualityDimensionScore {
  const sec = map.solution_archetypes;
  const body = sec?.body as
    | { archetype?: unknown; archetypeKeys?: ReadonlyArray<string> }
    | undefined;
  const archetypeKeys = Array.isArray(body?.archetypeKeys)
    ? body!.archetypeKeys!.filter((k) => typeof k === 'string' && k.length > 0)
    : [];
  const hasArchetype = !!body?.archetype;

  if (sec?.hasContent && (archetypeKeys.length >= 1 || hasArchetype)) {
    return {
      dimension: 'solution_grounding',
      score: 1,
      band: 'usable',
      rationale:
        archetypeKeys.length > 0
          ? `${archetypeKeys.length} archetype key(s) grounded.`
          : 'Solution archetype is grounded.',
    };
  }
  if (pack.workObject.kind !== 'solution_archetype') {
    return {
      dimension: 'solution_grounding',
      score: 0.5,
      band: 'partial',
      rationale:
        'Solution grounding is not required for this work-object kind.',
    };
  }
  return {
    dimension: 'solution_grounding',
    score: 0,
    band: 'refused',
    rationale: 'Solution archetype work object has no archetype grounding.',
  };
}

function scoreWorkflowState(
  map: SectionMap,
): ContextQualityDimensionScore {
  const wf = map.workflow_state;
  if (!wf || !wf.hasContent) {
    return {
      dimension: 'workflow_state',
      score: 0.2,
      band: 'weak',
      rationale: 'Workflow state section has no content.',
    };
  }
  const body = wf.body as
    | {
        currentCanonicalPhase?: unknown;
        status?: unknown;
        hardGates?: ReadonlyArray<unknown>;
      }
    | undefined;
  const phasePresent =
    body?.currentCanonicalPhase != null && body?.currentCanonicalPhase !== '';
  const statusPresent = body?.status != null && body?.status !== '';
  const gatesPresent =
    Array.isArray(body?.hardGates) && body!.hardGates!.length > 0;
  const present = [phasePresent, statusPresent, gatesPresent].filter(Boolean)
    .length;
  const ratio = present / 3;
  const score = clamp01(ratio);
  return {
    dimension: 'workflow_state',
    score,
    band: bandFromScore(score),
    rationale:
      `${present}/3 workflow signals present `
      + `(phase=${phasePresent}, status=${statusPresent}, gates=${gatesPresent}).`,
  };
}

function scoreDataReadiness(
  map: SectionMap,
): ContextQualityDimensionScore {
  const ds = map.datasets;
  if (!ds || !ds.hasContent) {
    return {
      dimension: 'data_readiness',
      score: 0,
      band: 'refused',
      rationale: 'Datasets section is empty.',
    };
  }
  const body = ds.body as
    | { summaries?: ReadonlyArray<unknown> }
    | undefined;
  const count = Array.isArray(body?.summaries) ? body!.summaries!.length : 0;
  if (count >= 3) {
    return {
      dimension: 'data_readiness',
      score: 1,
      band: 'usable',
      rationale: `${count} dataset summaries present.`,
    };
  }
  if (count >= 1) {
    return {
      dimension: 'data_readiness',
      score: 0.6,
      band: 'partial',
      rationale: `${count} dataset summary present; not yet at the usable bar.`,
    };
  }
  return {
    dimension: 'data_readiness',
    score: 0.2,
    band: 'weak',
    rationale: 'Datasets section has content but no summaries.',
  };
}

function scoreGovernanceSafety(
  map: SectionMap,
): ContextQualityDimensionScore {
  const gov = map.governance_constraints;
  if (!gov || !gov.hasContent) {
    return {
      dimension: 'governance_safety',
      score: 0,
      band: 'refused',
      rationale: 'Governance constraints section is empty.',
    };
  }
  const body = gov.body as
    | {
        constraints?: ReadonlyArray<{
          severity?: unknown;
          policy?: unknown;
        }>;
      }
    | undefined;
  const constraints = Array.isArray(body?.constraints)
    ? body!.constraints!
    : [];
  const hardCount = constraints.filter((c) => c?.severity === 'hard').length;
  const softCount = constraints.filter((c) => c?.severity === 'soft').length;
  if (hardCount >= 2) {
    return {
      dimension: 'governance_safety',
      score: 1,
      band: 'usable',
      rationale: `${hardCount} hard governance constraint(s) honored.`,
    };
  }
  if (hardCount === 1) {
    return {
      dimension: 'governance_safety',
      score: 0.6,
      band: 'partial',
      rationale: `1 hard governance constraint honored; ${softCount} soft.`,
    };
  }
  if (softCount > 0) {
    return {
      dimension: 'governance_safety',
      score: 0.3,
      band: 'weak',
      rationale: 'Only soft governance constraints are present.',
    };
  }
  return {
    dimension: 'governance_safety',
    score: 0.1,
    band: 'refused',
    rationale: 'Governance constraints list is empty.',
  };
}

function scoreMissingInputSeverity(
  pack: UnifiedContextPack,
  _map: SectionMap,
): ContextQualityDimensionScore {
  // The pack does not carry the build-time missingInputs list (CTX2
  // returns it on the result, not the pack). CTX4 infers severity
  // from honest empties on the always-empty sections (evidence,
  // conversation, datasets) and from the work-object resolution.
  const honestEmpties = (
    ['evidence', 'conversation', 'datasets'] as const
  ).filter((k) => !sectionHasContent(_map, k)).length;
  const tenantUnknown = pack.identity.tenantKey.trim().length === 0;
  const workUnresolved = !pack.workObject.resolved;

  let penalty = 0;
  penalty += honestEmpties * 0.1; // up to 0.3
  if (tenantUnknown) penalty += 0.4;
  if (workUnresolved) penalty += 0.3;

  const score = clamp01(1 - penalty);
  return {
    dimension: 'missing_input_severity',
    score,
    band: bandFromScore(score),
    rationale:
      `honest_empties=${honestEmpties}, tenantUnknown=${tenantUnknown}, `
      + `workUnresolved=${workUnresolved}.`,
  };
}

function scoreSparsityRisk(
  pack: UnifiedContextPack,
): ContextQualityDimensionScore {
  const total = Math.max(pack.sections.length, TOTAL_SECTIONS);
  const empties = pack.sections.filter((s) => !s.hasContent).length;
  const ratioEmpty = total > 0 ? empties / total : 1;
  const score = clamp01(1 - ratioEmpty);
  return {
    dimension: 'sparsity_risk',
    score,
    band: bandFromScore(score),
    rationale: `${empties} of ${total} sections empty.`,
  };
}

function scoreActionability(
  pack: UnifiedContextPack,
  map: SectionMap,
): ContextQualityDimensionScore {
  const tenantOk = pack.identity.tenantKey.trim().length > 0;
  const workOk = pack.workObject.resolved;
  const businessOk = sectionHasContent(map, 'business_context');
  const workflowOk = sectionHasContent(map, 'workflow_state');
  const artifactsOk = sectionHasContent(map, 'artifacts');
  const patternOk = sectionHasContent(map, 'patterns');
  const archetypeOk = sectionHasContent(map, 'solution_archetypes');

  const signals: boolean[] = [tenantOk, workOk];
  if (pack.workObject.kind === 'program') {
    signals.push(businessOk, workflowOk, artifactsOk);
  } else if (pack.workObject.kind === 'intelligence_pattern') {
    signals.push(patternOk);
  } else {
    signals.push(archetypeOk);
  }
  const present = signals.filter(Boolean).length;
  const ratio = signals.length > 0 ? present / signals.length : 0;
  const score = clamp01(ratio);
  return {
    dimension: 'actionability',
    score,
    band: bandFromScore(score),
    rationale: `${present}/${signals.length} actionability signals present.`,
  };
}

// ---------------------------------------------------------------------
// Refusal logic
// ---------------------------------------------------------------------

interface RefusalSignal {
  refused: boolean;
  reason: string;
}

function computeRefusalSignal(
  pack: UnifiedContextPack,
  overallScore: number,
): RefusalSignal {
  if (pack.identity.tenantKey.trim().length === 0) {
    return {
      refused: true,
      reason: 'Pack carries no tenant scope; refusing to score as actionable.',
    };
  }
  if (!pack.workObject.resolved) {
    return {
      refused: true,
      reason: `Work object ${pack.workObject.kind}:${pack.workObject.id} is unresolved.`,
    };
  }
  if (overallScore < 0.15) {
    return {
      refused: true,
      reason: `Overall score ${overallScore.toFixed(2)} is below the 0.15 refusal floor.`,
    };
  }
  return { refused: false, reason: '' };
}

// ---------------------------------------------------------------------
// Risks
// ---------------------------------------------------------------------

function generateRisks(
  pack: UnifiedContextPack,
  dimensionScores: ReadonlyArray<ContextQualityDimensionScore>,
  refusal: RefusalSignal,
): ContextQualityRisk[] {
  const risks: ContextQualityRisk[] = [];

  if (refusal.refused) {
    if (pack.identity.tenantKey.trim().length === 0) {
      risks.push({
        kind: 'tenant_scope_unclear',
        severity: 'high',
        description:
          'Tenant scope is missing; pack cannot be acted on without a tenant key.',
      });
    }
    if (!pack.workObject.resolved) {
      risks.push({
        kind: 'work_object_unresolved',
        severity: 'high',
        description: `Work object ${pack.workObject.kind}:${pack.workObject.id} is unresolved.`,
      });
    }
  } else {
    if (pack.identity.tenantKey.trim().length === 0) {
      risks.push({
        kind: 'tenant_scope_unclear',
        severity: 'high',
        description: 'Tenant scope is missing.',
      });
    }
    if (!pack.workObject.resolved) {
      risks.push({
        kind: 'work_object_unresolved',
        severity: 'high',
        description: `Work object ${pack.workObject.kind}:${pack.workObject.id} is unresolved.`,
      });
    }
  }

  const byDim = new Map<ContextQualityDimension, ContextQualityDimensionScore>();
  for (const d of dimensionScores) byDim.set(d.dimension, d);

  const evid = byDim.get('evidence_strength')!;
  if (evid.score < 0.4) {
    risks.push({
      kind: 'missing_evidence',
      severity: evid.score < 0.2 ? 'high' : 'medium',
      description:
        'Evidence section lacks usable_as_evidence ids; agent answers cannot be grounded.',
    });
  }

  const gov = byDim.get('governance_safety')!;
  if (gov.score < 0.6) {
    risks.push({
      kind: 'missing_governance',
      severity: gov.score < 0.3 ? 'high' : 'medium',
      description:
        'Governance constraint coverage is below the safety bar; hard policies missing.',
    });
  }

  const sparsity = byDim.get('sparsity_risk')!;
  if (sparsity.score < 0.5) {
    risks.push({
      kind: 'sparse_inputs',
      severity: sparsity.score < 0.3 ? 'high' : 'medium',
      description:
        'Most pack sections are empty; surface is too sparse to act on.',
    });
  }

  const action = byDim.get('actionability')!;
  if (action.score < 0.6) {
    risks.push({
      kind: 'low_actionability',
      severity: action.score < 0.3 ? 'high' : 'medium',
      description:
        'Pack lacks the signals required to take action on this work-object kind.',
    });
  }

  return risks;
}

// ---------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------

function generateRecommendations(
  pack: UnifiedContextPack,
  risks: ReadonlyArray<ContextQualityRisk>,
): ContextQualityRecommendation[] {
  const recs: ContextQualityRecommendation[] = [];
  const seen = new Set<ContextQualityRecommendation['kind']>();

  function push(rec: ContextQualityRecommendation) {
    if (!seen.has(rec.kind)) {
      seen.add(rec.kind);
      recs.push(rec);
    }
  }

  for (const r of risks) {
    switch (r.kind) {
      case 'work_object_unresolved':
        push({
          kind: 'resolve_work_object',
          description: `Resolve work object ${pack.workObject.kind}:${pack.workObject.id} against canonical sources before acting.`,
        });
        break;
      case 'tenant_scope_unclear':
        push({
          kind: 'capture_inputs',
          description:
            'Capture tenantKey before scoring or surfacing this pack.',
        });
        break;
      case 'missing_evidence':
        push({
          kind: 'load_evidence',
          description:
            'Load EVID2 ledger entries that mark usable_as_evidence: true for this work object.',
        });
        break;
      case 'missing_governance':
        push({
          kind: 'add_governance_constraint',
          description:
            'Add at least one hard governance constraint before approving any high-stakes action.',
        });
        break;
      case 'sparse_inputs':
        push({
          kind: 'request_workshop',
          description:
            'Request a workshop turn to capture the missing inputs (program scope, datasets, evidence).',
        });
        break;
      case 'low_actionability':
        push({
          kind: 'defer_to_steward',
          description:
            'Defer to Steward for orientation; pack does not yet carry enough signal for runtime action.',
        });
        break;
    }
  }

  return recs;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function roundQuarter(x: number): number {
  // Stable two-decimal rounding without Math.random / Date.now, used
  // to keep overallScore byte-equal across calls.
  return Math.round(x * 1000) / 1000;
}

function averageWeighted(values: ReadonlyArray<number>): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function bandFromScore(score: number): ContextQualityBand {
  if (score >= 0.7) return 'usable';
  if (score >= 0.4) return 'partial';
  if (score >= 0.15) return 'weak';
  return 'refused';
}

function bandRank(band: ContextQualityBand): number {
  switch (band) {
    case 'refused':
      return 0;
    case 'weak':
      return 1;
    case 'partial':
      return 2;
    case 'usable':
      return 3;
  }
}

function lowestDimensionBand(
  dimensions: ReadonlyArray<ContextQualityDimensionScore>,
): ContextQualityBand {
  let lowest: ContextQualityBand = 'usable';
  for (const d of dimensions) {
    if (bandRank(d.band) < bandRank(lowest)) lowest = d.band;
  }
  return lowest;
}

function severityRank(severity: ContextQualityRisk['severity']): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function freezeReadonly<T>(value: ReadonlyArray<T>): ReadonlyArray<T> {
  // Defensive freeze keeps callers honest about treating the value
  // as readonly. Returned arrays are byte-equal across calls because
  // every input above is itself constructed deterministically.
  return Object.freeze([...value]);
}
