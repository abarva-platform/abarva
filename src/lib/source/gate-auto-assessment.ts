import {
  criterionById,
  evidenceById,
  evidenceRequirementsForCriterion,
} from './canonical-specs';
import type {
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
  SourceEventGateCriterion,
} from './canvas-substrate';
import type { GateCriterionSeverity } from './canonical-specs';
import type { SourceStageKey } from './types';

export const AUTO_EVIDENCE_REVIEWER_ID = 'system:auto-evidence';

export type GateAssessmentDisplayState =
  | 'met_manual'
  | 'not_met_manual'
  | 'waived'
  | 'deferred_manual'
  | 'met_auto_evidence'
  | 'blocked_evidence'
  | 'pending_review';

export type GateAssessmentProvenance = 'manual' | 'auto-evidence' | 'none';

export interface GateAssessmentEvidenceMatch {
  requirementId: string;
  label: string;
  minimumState: SourceEventEvidenceCurrentState;
  currentState: SourceEventEvidenceCurrentState | 'missing';
  level: 'required' | 'recommended';
  satisfied: boolean;
  sourceArtifactId: string | null;
}

export interface GateCriterionAssessment {
  criterionId: string;
  title: string;
  severity: GateCriterionSeverity | 'unknown';
  required: boolean;
  persistedState: SourceEventGateCriterion['state'];
  displayState: GateAssessmentDisplayState;
  provenance: GateAssessmentProvenance;
  reason: string;
  evidence: GateAssessmentEvidenceMatch[];
}

export interface GateAssessment {
  fromStage: SourceStageKey;
  criteria: GateCriterionAssessment[];
}

export type StageRecommendationStatus =
  | 'ready'
  | 'ready_with_warnings'
  | 'blocked'
  | 'needs_review';

export interface StageRecommendation {
  status: StageRecommendationStatus;
  reasonCodes: string[];
  requiredMet: number;
  requiredTotal: number;
  autoMetCount: number;
  manualMetCount: number;
  blockers: Array<{
    criterionId: string;
    title: string;
    reason: string;
  }>;
}

const READINESS_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  'Not Requested': 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  'Usable Evidence': 4,
  Stale: -1,
  'Low Confidence': -1,
};

const FAILURE_STATES = new Set<SourceEventEvidenceCurrentState>([
  'Stale',
  'Low Confidence',
]);

export function assessStageGate(input: {
  fromStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
}): GateAssessment {
  const evidenceByRequirement = new Map(
    input.evidence.map((row) => [row.requirementId, row]),
  );

  return {
    fromStage: input.fromStage,
    criteria: input.criteria
      .filter((criterion) => criterion.fromStage === input.fromStage)
      .map((criterion) =>
        assessCriterion(criterion, evidenceByRequirement),
      ),
  };
}

export function buildStageRecommendation(
  assessment: GateAssessment,
): StageRecommendation {
  const blockers: StageRecommendation['blockers'] = [];
  const reasonCodes = new Set<string>();
  let requiredTotal = 0;
  let requiredMet = 0;
  let autoMetCount = 0;
  let manualMetCount = 0;
  let softUnmet = 0;
  let hardBlocked = 0;

  for (const criterion of assessment.criteria) {
    const blocksPromotion =
      criterion.required &&
      (criterion.severity === 'hard' || criterion.severity === 'soft');
    const met = isAssessmentMet(criterion);
    if (blocksPromotion) {
      requiredTotal += 1;
      if (met) requiredMet += 1;
    }
    if (criterion.displayState === 'met_auto_evidence') {
      autoMetCount += 1;
      reasonCodes.add('AUTO_EVIDENCE_REVIEW_REQUIRED');
    }
    if (criterion.displayState === 'met_manual' || criterion.displayState === 'waived') {
      manualMetCount += 1;
    }
    const hasFailureMode = criterion.evidence.some(
      (match) =>
        match.currentState === 'Stale' || match.currentState === 'Low Confidence',
    );
    if (hasFailureMode) reasonCodes.add('EVIDENCE_FAILURE_MODE');
    if (!blocksPromotion || met) continue;
    if (criterion.severity === 'soft') {
      softUnmet += 1;
      reasonCodes.add('SOFT_CRITERIA_OPEN');
      continue;
    }
    hardBlocked += 1;
    reasonCodes.add('HARD_CRITERIA_BLOCKED');
    blockers.push({
      criterionId: criterion.criterionId,
      title: criterion.title,
      reason: criterion.reason,
    });
  }

  let status: StageRecommendationStatus = 'ready';
  if (hardBlocked > 0) {
    status = 'blocked';
  } else if (autoMetCount > 0 || reasonCodes.has('EVIDENCE_FAILURE_MODE')) {
    status = 'needs_review';
  } else if (softUnmet > 0) {
    status = 'ready_with_warnings';
  }

  return {
    status,
    reasonCodes: [...reasonCodes],
    requiredMet,
    requiredTotal,
    autoMetCount,
    manualMetCount,
    blockers,
  };
}

export function isAssessmentMet(
  criterion: GateCriterionAssessment,
): boolean {
  return (
    criterion.displayState === 'met_manual' ||
    criterion.displayState === 'waived' ||
    criterion.displayState === 'met_auto_evidence'
  );
}

function assessCriterion(
  criterion: SourceEventGateCriterion,
  evidenceByRequirement: Map<string, SourceEventEvidence>,
): GateCriterionAssessment {
  const definition = criterionById(criterion.criterionId);
  const mappedRequirementIds = evidenceRequirementsForCriterion(
    criterion.criterionId,
  );
  const base = {
    criterionId: criterion.criterionId,
    title: definition?.title ?? criterion.criterionId,
    severity: definition?.severity ?? 'unknown',
    required: definition?.required !== false,
    persistedState: criterion.state,
  } satisfies Pick<
    GateCriterionAssessment,
    'criterionId' | 'title' | 'severity' | 'required' | 'persistedState'
  >;

  const mappedEvidence = mappedRequirementIds.map((requirementId) =>
    buildEvidenceMatch(requirementId, evidenceByRequirement),
  );

  if (criterion.state === 'met') {
    const systemAssessed =
      criterion.reviewerUserId === AUTO_EVIDENCE_REVIEWER_ID;
    return {
      ...base,
      displayState: systemAssessed ? 'met_auto_evidence' : 'met_manual',
      provenance: systemAssessed ? 'auto-evidence' : 'manual',
      reason: systemAssessed
        ? (criterion.notes ?? 'Auto-assessed from evidence')
        : 'Manual override',
      evidence: systemAssessed ? mappedEvidence : [],
    };
  }
  if (criterion.state === 'not_met') {
    return {
      ...base,
      displayState: 'not_met_manual',
      provenance: 'manual',
      reason: 'Manual override',
      evidence: [],
    };
  }
  if (criterion.state === 'waived') {
    return {
      ...base,
      displayState: 'waived',
      provenance: 'manual',
      reason: 'Manual override',
      evidence: [],
    };
  }
  if (criterion.state === 'deferred') {
    return {
      ...base,
      displayState: 'deferred_manual',
      provenance: 'manual',
      reason: 'Manual override',
      evidence: [],
    };
  }

  if (mappedRequirementIds.length === 0) {
    return {
      ...base,
      displayState: 'pending_review',
      provenance: 'none',
      reason: 'Needs human review',
      evidence: [],
    };
  }

  const evidence = mappedEvidence;

  const requiredEvidence = evidence.filter((match) => match.level === 'required');
  const missingOrWeak = requiredEvidence.filter((match) => !match.satisfied);

  if (missingOrWeak.length === 0) {
    return {
      ...base,
      displayState: 'met_auto_evidence',
      provenance: 'auto-evidence',
      reason: 'Auto-assessed from evidence',
      evidence,
    };
  }

  const firstBlocker = missingOrWeak[0];
  const reason =
    firstBlocker.currentState === 'Stale' ||
    firstBlocker.currentState === 'Low Confidence'
      ? `${firstBlocker.label} is ${firstBlocker.currentState}; needs human review.`
      : `${firstBlocker.label} must be at least ${firstBlocker.minimumState}; current state is ${firstBlocker.currentState}.`;

  return {
    ...base,
    displayState: 'blocked_evidence',
    provenance: 'auto-evidence',
    reason,
    evidence,
  };
}

function buildEvidenceMatch(
  requirementId: string,
  evidenceByRequirement: Map<string, SourceEventEvidence>,
): GateAssessmentEvidenceMatch {
  const requirement = evidenceById(requirementId);
  const state = evidenceByRequirement.get(requirementId);
  const minimumState = requirement?.minimumState ?? 'Usable Evidence';
  const currentState = state?.currentState ?? 'missing';
  const satisfied =
    Boolean(requirement) &&
    Boolean(state) &&
    currentState !== 'missing' &&
    !FAILURE_STATES.has(currentState) &&
    READINESS_RANK[currentState] >= READINESS_RANK[minimumState];
  return {
    requirementId,
    label: requirement?.label ?? requirementId,
    minimumState,
    currentState,
    level: requirement?.level ?? 'required',
    satisfied,
    sourceArtifactId: state?.sourceArtifactId ?? null,
  };
}
