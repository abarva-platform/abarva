// Stage-gate resolver — compute the three-level assessment for a stage.
//
// Pure: given a stage definition + what is currently satisfied, produce the recommended
// standard, the minimum-viable gate, the gaps (with risk + downstream impact), the gate
// status, and the recommended decision. Never hides gaps; never fakes completeness.

import type {
  GapItem,
  GateStatus,
  RecommendedDecision,
  SourceStageGateAssessment,
  StageCompletionState,
  StageGateDefinition,
  StageGateRequirement,
} from './types';

function toGap(req: StageGateRequirement): GapItem {
  return {
    key: req.key,
    label: req.label,
    kind: req.kind,
    tier: req.tier,
    riskIfMissing: req.riskIfMissing,
    downstreamImpact: req.downstreamImpact ?? [],
  };
}

export function assessStageGate(
  def: StageGateDefinition,
  completion: StageCompletionState,
): SourceStageGateAssessment {
  const satisfiedKeys = completion.satisfiedRequirementKeys;
  const recommendedStandard = def.requirements;
  const minimumViableGate = def.requirements.filter((r) => r.tier === 'minimum_viable');

  const satisfied = recommendedStandard.filter((r) => satisfiedKeys.has(r.key));
  const unmet = recommendedStandard.filter((r) => !satisfiedKeys.has(r.key));
  const gaps = unmet.map(toGap);

  const minimumViableMet = minimumViableGate.every((r) => satisfiedKeys.has(r.key));
  const allMet = unmet.length === 0;
  const currentCompletion = recommendedStandard.length === 0 ? 1 : Math.round((satisfied.length / recommendedStandard.length) * 100) / 100;

  // status: prefer the most specific honest label
  let gateStatus: GateStatus;
  if (allMet) {
    gateStatus = 'ready';
  } else if (!minimumViableMet) {
    gateStatus = 'blocked';
  } else {
    // minimum-viable met, but recommended gaps remain — classify by what kind of gap dominates
    const kinds = new Set(unmet.map((r) => r.kind));
    if (kinds.size === 1 && kinds.has('review')) gateStatus = 'needs_review';
    else if (kinds.size === 1 && (kinds.has('decision'))) gateStatus = 'client_to_complete';
    else gateStatus = 'ready_with_gaps';
  }

  const risksOfProceeding = [...new Set(gaps.map((g) => g.riskIfMissing))];
  const downstreamImpacts = [...new Set(gaps.flatMap((g) => g.downstreamImpact))];

  const recommendedDecision: RecommendedDecision =
    gateStatus === 'ready' ? 'advance'
      : gateStatus === 'blocked' ? 'hold_or_override'
        : 'advance_with_gaps_or_hold';

  return {
    archetype: def.archetype,
    stageKey: def.stageKey,
    stageName: def.stageName,
    recommendedStandard,
    minimumViableGate,
    satisfied,
    gaps,
    currentCompletion,
    minimumViableMet,
    risksOfProceeding,
    downstreamImpacts,
    gateStatus,
    recommendedDecision,
    maestroOverrideAllowed: true, // Maestro may always override — with rationale when gaps exist
  };
}
