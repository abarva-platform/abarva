import type { SourceStageGateReadiness, SourceStageGateReadinessInput, SourceStageGateReadinessItem, SourceStageGateState, SourceStageGateTransitionDefinition } from './source-stage-gate-types';
import type { SourceStageKey } from './types';
import { normalizeSourceStageKey, SOURCE_STAGE_LABELS } from './constants';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const TRANSITIONS: SourceStageGateTransitionDefinition[] = [
  { id: 'gate-strategy-scope', from: 'strategy', to: 'scope', label: 'Strategy -> Scope' },
  { id: 'gate-scope-rfp', from: 'scope', to: 'rfp', label: 'Scope -> RFP' },
  { id: 'gate-rfp-responses', from: 'rfp', to: 'responses', label: 'RFP -> Responses' },
  { id: 'gate-responses-evaluation', from: 'responses', to: 'evaluation', label: 'Responses -> Evaluation' },
  { id: 'gate-evaluation-pricing', from: 'evaluation', to: 'pricing', label: 'Evaluation -> Pricing' },
  { id: 'gate-pricing-bafo', from: 'pricing', to: 'bafo', label: 'Pricing -> BAFO' },
  { id: 'gate-bafo-executive-decision', from: 'bafo', to: 'executive_decision', label: 'BAFO -> Executive Decision' },
  { id: 'gate-executive-decision-selection', from: 'executive_decision', to: 'selection', label: 'Executive Decision -> Selection' },
  { id: 'gate-selection-transition', from: 'selection', to: 'transition', label: 'Selection -> Transition' },
  { id: 'gate-transition-value', from: 'transition', to: 'value', label: 'Transition -> Value' },
  { id: 'gate-value-closed', from: 'value', to: 'closed', label: 'Value -> Closed' },
];

const REQUIRED_APPROVALS_BY_TRANSITION: Record<string, string[]> = {
  'gate-strategy-scope': ['Sourcing lead review'],
  'gate-scope-rfp': ['Business sponsor approval'],
  'gate-rfp-responses': ['Procurement release approval'],
  'gate-responses-evaluation': ['Evaluation governance checkpoint'],
  'gate-evaluation-pricing': ['Evaluation governance checkpoint'],
  'gate-pricing-bafo': ['Finance and commercial lead review'],
  'gate-bafo-executive-decision': ['Steering alignment'],
  'gate-executive-decision-selection': ['Executive review'],
  'gate-selection-transition': ['Contract and mobilization sign-off'],
  'gate-transition-value': ['Operations readiness review'],
  'gate-value-closed': ['Value office closure review'],
};

const EVIDENCE_GAP_BY_TRANSITION: Record<string, string> = {
  'gate-strategy-scope': 'Sourcing model assumptions require evidence reconciliation.',
  'gate-scope-rfp': 'Scope baseline must be validated for pricing-safe packaging.',
  'gate-rfp-responses': 'Response checklist cannot be finalized without template closure.',
  'gate-responses-evaluation': 'Comparability evidence gaps reduce evaluation confidence.',
  'gate-evaluation-pricing': 'Scorecard rationale needs evidence linkage before commercial normalization.',
  'gate-pricing-bafo': 'Pricing assumptions, exclusions, and TCO basis must be normalized before BAFO.',
  'gate-bafo-executive-decision': 'BAFO clarifications remain open for one or more vendors.',
  'gate-executive-decision-selection': 'Executive decision evidence is not fully captured for selection.',
  'gate-selection-transition': 'Transition owner split is not fully ratified.',
  'gate-transition-value': 'Value realization instrumentation is still partial.',
  'gate-value-closed': 'Sustained realized value evidence is not yet complete.',
};

export function buildSourceStageGateReadiness(input: SourceStageGateReadinessInput): SourceStageGateReadiness {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const stageMap = new Map(input.event.stages.map((stage) => [
    normalizeSourceStageKey(stage.key) ?? stage.key,
    {
      ...stage,
      key: normalizeSourceStageKey(stage.key) ?? stage.key,
      label: SOURCE_STAGE_LABELS[normalizeSourceStageKey(stage.key) ?? stage.key],
    },
  ]));
  const gates = TRANSITIONS.map((transition) => {
    const fromStage = stageMap.get(transition.from);
    const toStage = transition.to === 'closed' ? null : stageMap.get(transition.to);
    return buildReadinessItem(transition, fromStage, toStage);
  });
  const blockers = getSourceStageGateBlockers({ gates });
  const overallState = deriveOverallState(gates);

  return {
    eventId: input.event.id,
    eventName: input.event.name,
    generatedAt,
    currentStageKey: input.event.currentStageKey,
    currentStageLabel: input.event.currentStageLabel,
    overallState,
    gates,
    blockers,
    recommendedNextAction: chooseNextAction(gates, blockers),
    summary: summarizeSourceStageGateReadiness({ eventName: input.event.name, overallState, gates, blockers }),
  };
}

export function getSourceStageGateBlockers(readiness: { gates: SourceStageGateReadinessItem[] }): string[] {
  return readiness.gates
    .filter((gate) => gate.state === 'blocked' || gate.state === 'needs_approval')
    .map((gate) => gate.blocker ?? `${gate.transitionLabel} needs owner action before progression.`);
}

export function summarizeSourceStageGateReadiness(input: {
  eventName: string;
  overallState: SourceStageGateState;
  gates: SourceStageGateReadinessItem[];
  blockers: string[];
}): string {
  const stateCounts = input.gates.reduce<Record<SourceStageGateState, number>>(
    (counts, gate) => {
      counts[gate.state] += 1;
      return counts;
    },
    { ready: 0, blocked: 0, waiting: 0, needs_approval: 0, waiver_required: 0, deferred: 0 },
  );

  const blockerSummary = input.blockers.length > 0
    ? `Top blocker: ${input.blockers[0]}`
    : 'No explicit blockers are recorded in deterministic seed data.';

  return [
    `${input.eventName} stage-gate posture is ${input.overallState}.`,
    `Ready ${stateCounts.ready}, blocked ${stateCounts.blocked}, waiting ${stateCounts.waiting}, needs approval ${stateCounts.needs_approval}, deferred ${stateCounts.deferred}.`,
    blockerSummary,
  ].join(' ');
}

export function formatSourceStageGateReadinessAsMarkdown(readiness: SourceStageGateReadiness): string {
  const lines: string[] = [];
  lines.push('# Source Stage Gate Readiness');
  lines.push('');
  lines.push(`- Event: ${readiness.eventName} (${readiness.eventId})`);
  lines.push(`- Current stage: ${readiness.currentStageLabel}`);
  lines.push(`- Overall state: ${readiness.overallState}`);
  lines.push(`- Recommended next action: ${readiness.recommendedNextAction}`);
  lines.push('');
  lines.push('## Gate transitions');
  lines.push('');

  for (const gate of readiness.gates) {
    lines.push(`### ${gate.transitionLabel}`);
    lines.push(`- State: ${gate.state}`);
    lines.push(`- Blocker: ${gate.blocker ?? 'none'}`);
    lines.push(`- Required artifacts: ${gate.requiredArtifacts.join(', ')}`);
    lines.push(`- Required approvals: ${gate.requiredApprovals.join(', ')}`);
    lines.push(`- Evidence gap: ${gate.evidenceGap ?? 'none'}`);
    lines.push('');
  }

  return lines.join('\n');
}

function buildReadinessItem(
  transition: SourceStageGateTransitionDefinition,
  fromStage:
    | {
      key: SourceStageKey;
      label: string;
      status: string;
      summary: string;
      gate: { status: string; ownerRole: string; requiredArtifacts: string[]; blocker: string | null };
    }
    | undefined,
  toStage:
    | {
      key: SourceStageKey;
      label: string;
      status: string;
      summary: string;
      gate: { status: string; ownerRole: string; requiredArtifacts: string[]; blocker: string | null };
    }
    | null
    | undefined,
): SourceStageGateReadinessItem {
  const stageMissing = !fromStage || (transition.to !== 'closed' && !toStage);
  const blocker = fromStage?.gate.blocker ?? (stageMissing ? 'Deterministic stage data missing for transition mapping.' : null);
  const state = deriveTransitionState(transition, fromStage, toStage, blocker);

  return {
    transitionId: transition.id,
    transitionLabel: transition.label,
    fromStageKey: transition.from,
    toStageKey: transition.to,
    state,
    blocker,
    requiredArtifacts: fromStage?.gate.requiredArtifacts?.length
      ? fromStage.gate.requiredArtifacts
      : ['Stage package'],
    requiredApprovals: REQUIRED_APPROVALS_BY_TRANSITION[transition.id] ?? ['Owner approval'],
    evidenceGap: blocker ? EVIDENCE_GAP_BY_TRANSITION[transition.id] ?? null : null,
  };
}

function deriveTransitionState(
  transition: SourceStageGateTransitionDefinition,
  fromStage:
    | {
      status: string;
      gate: { status: string; blocker: string | null };
    }
    | undefined,
  toStage:
    | {
      status: string;
      gate: { status: string };
    }
    | null
    | undefined,
  blocker: string | null,
): SourceStageGateState {
  if (!fromStage) return 'waiting';
  if (blocker || fromStage.status === 'blocked' || fromStage.gate.status === 'blocked') return 'blocked';
  if (fromStage.status === 'needs_approval' || fromStage.gate.status === 'in_review') return 'needs_approval';
  if (fromStage.status === 'active') return 'waiting';
  if (fromStage.status === 'not_started') return 'deferred';

  if (transition.to === 'closed') {
    return fromStage.status === 'complete' ? 'ready' : 'deferred';
  }

  if (!toStage) return 'waiting';
  if (toStage.status === 'active' || toStage.status === 'complete') return 'ready';
  if (toStage.status === 'needs_approval') return 'needs_approval';
  return 'ready';
}

function deriveOverallState(gates: SourceStageGateReadinessItem[]): SourceStageGateState {
  if (gates.some((gate) => gate.state === 'blocked')) return 'blocked';
  if (gates.some((gate) => gate.state === 'needs_approval')) return 'needs_approval';
  if (gates.some((gate) => gate.state === 'waiting')) return 'waiting';
  if (gates.some((gate) => gate.state === 'deferred')) return 'deferred';
  if (gates.some((gate) => gate.state === 'waiver_required')) return 'waiver_required';
  return 'ready';
}

function chooseNextAction(gates: SourceStageGateReadinessItem[], blockers: string[]): string {
  if (blockers.length > 0) return blockers[0];
  const firstWaiting = gates.find((gate) => gate.state === 'waiting' || gate.state === 'needs_approval');
  if (firstWaiting) return `Close ${firstWaiting.transitionLabel} requirements before progressing.`;
  return 'Continue progression through deterministic stage gates and maintain evidence caveats.';
}
