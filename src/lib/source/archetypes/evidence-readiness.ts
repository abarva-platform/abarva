// Source evidence-readiness model — bound to archetype evidence families.
//
// The single surface the agent AND the readiness UI both consume. It maps each
// archetype-declared evidence family to a position on the PROMOTION-ONLY ladder
// (missing → staged → parsing → committed → indexed → retrievable →
// citation_ready → promotion_candidate → agent_ready) and computes, per stage,
// exactly which hard families block the gate — never silently.
//
// Governance discipline (mirrors CONTEXT_CORPUS_POLICY): "loaded" ≠ "indexed" ≠
// "retrievable" ≠ "cited" ≠ "agent_ready". A family is agent-usable ONLY at the
// top of the ladder, and that top rung is reached by governed promotion — never
// inferred here from a lower state.

import type {
  EvidenceFamilySpec,
  EvidenceKind,
  EvidenceState,
  SourceEventArchetype,
} from './types';
import { EVIDENCE_STATE_ORDER } from './types';
import type { SourceStageKey } from '../types';

/** A snapshot of where each evidence family sits on the ladder (from the data plane). */
export type EvidenceStateMap = Record<string, EvidenceState>;

export interface FamilyReadiness {
  family: string;
  label: string;
  kind: EvidenceKind;
  required: boolean;
  optional: boolean;
  state: EvidenceState;
  /** Ladder index 0..8 for sorting / progress bars. */
  ladderIndex: number;
  /** True ONLY when state === 'agent_ready' (governed promotion reached). */
  agentUsable: boolean;
  /** Committed to the data plane but not yet promoted to agent_ready. */
  committedNotPromoted: boolean;
  whyNeeded: string;
  sourceDocHint: string;
  acceptedFormats: string[];
  /** Stage keys whose hard gate this family blocks while not agent_ready. */
  blocksStages: SourceStageKey[];
}

export type ReadinessVerdict = 'not_ready' | 'partial' | 'ready';

export interface StageReadiness {
  stage: SourceStageKey;
  ready: boolean;
  /** Hard families not yet agent_ready, with reasons. */
  blockers: Array<{ family: string; state: EvidenceState; reason: string }>;
}

export interface SourceEvidenceReadiness {
  archetypeId: string;
  eventResolved: string | null;
  families: FamilyReadiness[];
  /** Required families still entirely absent (state === 'missing'). */
  missingRequired: string[];
  /** Required families that exist in the data plane but are NOT agent_ready. */
  committedNotPromoted: string[];
  /** Required families that ARE agent_ready (governed promotion reached). */
  agentReady: string[];
  /** Per-stage gate readiness (hard families only). */
  stages: StageReadiness[];
  overall: ReadinessVerdict;
}

function ladderIndex(state: EvidenceState): number {
  const i = EVIDENCE_STATE_ORDER.indexOf(state);
  return i < 0 ? 0 : i;
}

/** Stages whose hard requirements include this family. */
function stagesBlockedBy(arch: SourceEventArchetype, family: string): SourceStageKey[] {
  return arch.stageModel
    .filter((s) => s.requiredEvidence.some((r) => r.family === family && r.severity === 'hard'))
    .map((s) => s.stage);
}

function reasonFor(state: EvidenceState): string {
  switch (state) {
    case 'missing': return 'not provided — upload required';
    case 'staged': return 'staged to blob, not parsed';
    case 'parsing': return 'parsing in progress';
    case 'committed': return 'committed to data plane, not yet indexed';
    case 'indexed': return 'indexed, not yet retrievable';
    case 'retrievable': return 'retrievable, citations not yet verified';
    case 'citation_ready': return 'cite-render verified, awaiting promotion review';
    case 'promotion_candidate': return 'in governed promotion queue, not yet approved';
    case 'agent_ready': return 'agent-ready';
    default: return 'unknown state';
  }
}

/**
 * Build the readiness model for an archetype given a snapshot of family states.
 * Families absent from the snapshot default to 'missing'.
 */
export function buildSourceEvidenceReadiness(
  archetype: SourceEventArchetype,
  stateMap: EvidenceStateMap = {},
  eventResolved: string | null = null,
): SourceEvidenceReadiness {
  const requiredKeys = new Set(archetype.requiredEvidenceFamilies.map((f) => f.key));
  const optionalKeys = new Set(archetype.optionalEvidenceFamilies.map((f) => f.key));
  const all: EvidenceFamilySpec[] = [
    ...archetype.requiredEvidenceFamilies,
    ...archetype.optionalEvidenceFamilies,
  ];

  const families: FamilyReadiness[] = all.map((spec) => {
    const state = stateMap[spec.key] ?? 'missing';
    const idx = ladderIndex(state);
    const agentUsable = state === 'agent_ready';
    return {
      family: spec.key,
      label: spec.label,
      kind: spec.kind,
      required: requiredKeys.has(spec.key),
      optional: optionalKeys.has(spec.key) && !requiredKeys.has(spec.key),
      state,
      ladderIndex: idx,
      agentUsable,
      committedNotPromoted: idx >= ladderIndex('committed') && !agentUsable,
      whyNeeded: spec.whyNeeded,
      sourceDocHint: spec.sourceDocHint,
      acceptedFormats: spec.acceptedFormats,
      blocksStages: stagesBlockedBy(archetype, spec.key),
    };
  });

  const req = families.filter((f) => f.required);
  const missingRequired = req.filter((f) => f.state === 'missing').map((f) => f.family);
  const committedNotPromoted = req.filter((f) => f.committedNotPromoted).map((f) => f.family);
  const agentReady = req.filter((f) => f.agentUsable).map((f) => f.family);

  const stages: StageReadiness[] = archetype.stageModel.map((s) => {
    const hard = s.requiredEvidence.filter((r) => r.severity === 'hard');
    const blockers = hard
      .map((r) => {
        const fr = families.find((f) => f.family === r.family);
        const state = fr?.state ?? 'missing';
        return { family: r.family, state, agentUsable: fr?.agentUsable ?? false };
      })
      .filter((b) => !b.agentUsable)
      .map((b) => ({ family: b.family, state: b.state, reason: reasonFor(b.state) }));
    return { stage: s.stage, ready: blockers.length === 0, blockers };
  });

  let overall: ReadinessVerdict = 'partial';
  if (agentReady.length === 0) overall = 'not_ready';
  else if (req.every((f) => f.agentUsable)) overall = 'ready';

  return {
    archetypeId: archetype.id,
    eventResolved,
    families,
    missingRequired,
    committedNotPromoted,
    agentReady,
    stages,
    overall,
  };
}

/** Is the event allowed through a given stage gate (all hard families agent_ready)? */
export function stageGateClear(
  readiness: SourceEvidenceReadiness,
  stage: SourceStageKey,
): { clear: boolean; blockers: StageReadiness['blockers'] } {
  const s = readiness.stages.find((x) => x.stage === stage);
  if (!s) return { clear: true, blockers: [] };
  return { clear: s.ready, blockers: s.blockers };
}

/**
 * The set of family keys an agent is ALLOWED to reason over for this event:
 * only those that reached agent_ready via governed promotion. Anything below is
 * excluded from the model context — never silently downgraded to "usable".
 */
export function agentUsableFamilies(readiness: SourceEvidenceReadiness): string[] {
  return readiness.families.filter((f) => f.agentUsable).map((f) => f.family);
}
