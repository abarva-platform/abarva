import {
  getSourceContextUsed,
} from './context-builder';
import type {
  SourceAgentName,
  SourceSuggestedAgentAction,
} from './multi-agent-types';
import type {
  SourceAgentMission,
  SourceAgentMissionInput,
  SourceAgentMissionPriority,
  SourceAgentMissionState,
  SourceAgentMissionSummary,
} from './agent-mission-types';

const DEFAULT_CREATED_AT = '2026-04-26T00:00:00.000Z';

const PRIORITY_RANK: Record<SourceAgentMissionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATE_RANK: Record<SourceAgentMissionState, number> = {
  blocked: 0,
  active: 1,
  waiting: 2,
  deferred: 3,
  escalated: 4,
  proposed: 5,
  completed: 6,
  dismissed: 7,
};

export function buildSourceAgentMissions(input: SourceAgentMissionInput): SourceAgentMission[] {
  return prioritizeSourceAgentMissions([
    ...buildNexusSourceMissions(input),
    ...buildSentinelSourceMissions(input),
    ...buildAtlasSourceMissions(input),
    ...buildStewardSourceMissions(input),
  ]);
}

export function buildNexusSourceMissions(input: SourceAgentMissionInput): SourceAgentMission[] {
  const bundle = input.contextBundle;
  const eventName = getEventName(input);
  const stageLabel = bundle.workflowStage?.label ?? 'portfolio';
  const missions: SourceAgentMission[] = [
    createMission(input, {
      agentName: 'nexus',
      missionType: 'next_action',
      title: `${stageLabel} next action`,
      summary: `${eventName} needs a clear operational next action from the current Source context.`,
      priority: bundle.blockers.length > 0 || bundle.missingInputs.length > 0 ? 'high' : 'medium',
      state: bundle.blockers.length > 0 ? 'blocked' : 'active',
      trigger: bundle.workflowStage ? 'stage_focus' : 'event_load',
      evidenceStatus: deriveEvidenceStatus(input),
      blockerReason: firstOrUndefined(bundle.blockers),
      recommendedAction: bundle.nextAction ?? getFallbackNextAction(input),
      suggestedActions: getNexusSuggestedActions(input),
      handoffTarget: bundle.blockers.length > 0 ? 'steward' : undefined,
    }),
  ];

  if (bundle.missingInputs.length > 0) {
    missions.push(createMission(input, {
      agentName: 'nexus',
      missionType: 'data_readiness',
      title: 'Minimum data request needed',
      summary: `${bundle.missingInputs.length} required input${plural(bundle.missingInputs.length)} are missing for ${eventName}.`,
      priority: 'high',
      state: 'waiting',
      trigger: 'missing_inputs_detected',
      evidenceStatus: 'missing',
      blockerReason: `Missing inputs: ${bundle.missingInputs.join('; ')}`,
      recommendedAction: 'Generate a minimum data request before advancing the Source workflow.',
      suggestedActions: getMissingInputActions('nexus'),
      handoffTarget: 'sentinel',
    }));
  }

  if (bundle.selectedPatternPack) {
    missions.push(createMission(input, {
      agentName: 'nexus',
      missionType: 'pattern_signal',
      title: `${bundle.selectedPatternPack.name} pattern signal`,
      summary: `Use ${bundle.selectedPatternPack.name} to keep sourcing guidance specific to ${bundle.sourcingArchetype ?? 'this event'}.`,
      priority: 'medium',
      state: 'proposed',
      trigger: 'multi_agent_briefing',
      evidenceStatus: deriveEvidenceStatus(input),
      recommendedAction: 'Use the pattern sections as guidance, not as unsourced market benchmark data.',
      suggestedActions: [
        suggestedAction('nexus-show-pattern-inputs', 'Show missing inputs', 'List required pattern inputs and current gaps.', 'showMissingInputs', 'nexus'),
        suggestedAction('nexus-explain-pattern-readiness', 'Explain readiness', 'Explain how the pattern affects this sourcing stage.', 'explainReadiness', 'nexus'),
        suggestedAction('nexus-show-evidence-gaps', 'Show evidence gaps', 'Check where pattern guidance still needs client evidence.', 'showEvidenceGaps', 'nexus'),
        customAction('nexus'),
      ],
      handoffTarget: 'sentinel',
    }));
  }

  return missions;
}

export function buildSentinelSourceMissions(input: SourceAgentMissionInput): SourceAgentMission[] {
  const bundle = input.contextBundle;
  const contextReport = input.contextValidationReport;
  const contextDefers = contextReport?.deferReasons ?? [];
  const contextGaps = contextReport?.remainingContextGaps ?? [];
  const missingCitationClaims = bundle.citationCoverage?.missingCitationClaims ?? [];
  const missions: SourceAgentMission[] = [];

  if (contextDefers.length > 0) {
    missions.push(createMission(input, {
      agentName: 'sentinel',
      missionType: 'validation_defer',
      title: 'Context validation has intentional defers',
      summary: `${contextDefers.length} context validation defer${plural(contextDefers.length)} must remain visible before decision-grade output.`,
      priority: 'medium',
      state: 'deferred',
      trigger: 'validation_defer_detected',
      evidenceStatus: deriveEvidenceStatus(input),
      blockerReason: contextDefers[0]?.reason,
      recommendedAction: contextDefers[0]?.remediationRequiredBeforePass ?? 'Resolve deferred context validation gaps before treating guidance as complete.',
      suggestedActions: getEvidenceActions('sentinel'),
      handoffTarget: 'nexus',
    }));
  }

  if (missingCitationClaims.length > 0 || contextGaps.length > 0 || bundle.parsedFileSummaries.length === 0) {
    const gapSummary = unique([
      ...missingCitationClaims.map((claim) => `Missing citation: ${claim}`),
      ...contextGaps.map((gap) => gap.summary),
      ...(bundle.parsedFileSummaries.length === 0 ? ['No parsed uploaded-file summaries are available.'] : []),
    ]);

    missions.push(createMission(input, {
      agentName: 'sentinel',
      missionType: 'evidence_gap',
      title: 'Evidence readiness gap',
      summary: gapSummary[0] ?? 'Evidence should remain bounded until citations and parsed files are available.',
      priority: missingCitationClaims.length > 0 ? 'high' : 'medium',
      state: 'waiting',
      trigger: 'context_validation_report',
      evidenceStatus: missingCitationClaims.length > 0 ? 'missing' : 'lowConfidence',
      blockerReason: gapSummary[0],
      recommendedAction: 'Keep unsupported Source claims labeled as low-confidence or pattern-level until evidence is available.',
      suggestedActions: getEvidenceActions('sentinel'),
      handoffTarget: 'nexus',
    }));
  }

  if (bundle.contextQuality.overallConfidence === 'low') {
    missions.push(createMission(input, {
      agentName: 'sentinel',
      missionType: 'low_context_warning',
      title: 'Low context warning',
      summary: formatList(bundle.contextQuality.missingContextReasons, 'Source context confidence is low.'),
      priority: 'high',
      state: 'active',
      trigger: 'data_readiness_gap',
      evidenceStatus: 'lowConfidence',
      blockerReason: firstOrUndefined(bundle.contextQuality.missingContextReasons),
      recommendedAction: 'Gather missing event context before using agent guidance as decision support.',
      suggestedActions: getEvidenceActions('sentinel'),
      handoffTarget: 'nexus',
    }));
  }

  return missions;
}

export function buildAtlasSourceMissions(input: SourceAgentMissionInput): SourceAgentMission[] {
  const bundle = input.contextBundle;
  const valueAtStake = getValueAtStake(input);
  const missions: SourceAgentMission[] = [];

  if (valueAtStake > 0) {
    missions.push(createMission(input, {
      agentName: 'atlas',
      missionType: 'value_risk',
      title: 'Value at stake needs executive visibility',
      summary: `${formatUsd(valueAtStake)} is at stake for ${getEventName(input)}; current value should be treated as projected until measured evidence exists.`,
      priority: valueAtStake >= 10_000_000 || bundle.blockers.length > 0 ? 'high' : 'medium',
      state: 'active',
      trigger: 'value_at_stake_detected',
      evidenceStatus: bundle.realizedValueLedger?.length ? deriveEvidenceStatus(input) : 'lowConfidence',
      recommendedAction: 'Prepare an executive value/risk brief that separates projected value, blockers, and confidence limits.',
      suggestedActions: [
        suggestedAction('atlas-show-value-at-stake', 'Show value at stake', 'Summarize projected value, risk, and evidence confidence.', 'showValueAtStake', 'atlas'),
        suggestedAction('atlas-prepare-executive-brief', 'Prepare executive brief', 'Create CIO/CFO-style decision language from deterministic context.', 'prepareExecutiveBrief', 'atlas'),
        suggestedAction('atlas-show-tradeoffs', 'Show tradeoffs', 'Explain executive tradeoffs without claiming realized value.', 'prepareExecutiveBrief', 'atlas'),
        customAction('atlas'),
      ],
      handoffTarget: 'nexus',
    }));
  }

  if (bundle.decisions.length > 0 || input.mode === 'executive' || input.userRole === 'cio' || input.userRole === 'cfo') {
    missions.push(createMission(input, {
      agentName: 'atlas',
      missionType: 'executive_brief',
      title: 'Executive decision brief available',
      summary: bundle.decisions[0]?.title ?? 'Executive-facing Source brief can be prepared from current deterministic context.',
      priority: bundle.decisions.length > 0 ? 'high' : 'low',
      state: 'proposed',
      trigger: 'multi_agent_briefing',
      evidenceStatus: deriveEvidenceStatus(input),
      recommendedAction: 'Summarize decision need, value at stake, risks, and caveats for leadership.',
      suggestedActions: [
        suggestedAction('atlas-prepare-decision-brief', 'Prepare executive brief', 'Draft concise decision language for leadership review.', 'prepareExecutiveBrief', 'atlas'),
        suggestedAction('atlas-show-value-context', 'Show value at stake', 'Show value context and measurement caveats.', 'showValueAtStake', 'atlas'),
        suggestedAction('atlas-show-risk-tradeoffs', 'Show tradeoffs', 'Explain executive tradeoffs and open risks.', 'prepareExecutiveBrief', 'atlas'),
        customAction('atlas'),
      ],
      handoffTarget: 'nexus',
    }));
  }

  return missions;
}

export function buildStewardSourceMissions(input: SourceAgentMissionInput): SourceAgentMission[] {
  const bundle = input.contextBundle;
  const workflowReport = input.workflowValidationReport;
  const workflowBlockers = workflowReport?.blockerExplanations ?? [];
  const workflowDefers = workflowReport?.intentionalDefers ?? [];
  const failedExpectations = workflowReport?.failedExpectations ?? [];
  const missions: SourceAgentMission[] = [];

  if (bundle.blockers.length > 0 || workflowBlockers.length > 0 || failedExpectations.length > 0) {
    const blockerReason = firstOrUndefined([
      ...bundle.blockers,
      ...workflowBlockers.map((blocker) => blocker.explanation),
      ...failedExpectations.map((failure) => `${failure.fixtureId}: expected ${failure.expectedOutcome}, got ${failure.actualOutcome}`),
    ]);

    missions.push(createMission(input, {
      agentName: 'steward',
      missionType: 'workflow_blocker',
      title: 'Workflow gate is blocked',
      summary: blockerReason ?? 'Workflow validation found a Source gate blocker.',
      priority: 'critical',
      state: 'blocked',
      trigger: 'workflow_block_detected',
      evidenceStatus: deriveEvidenceStatus(input),
      blockerReason,
      recommendedAction: workflowReport?.remediationByFixture[0] ?? 'Resolve workflow blocker before advancing the Source event.',
      suggestedActions: getGateActions('steward'),
      handoffTarget: 'nexus',
    }));
  }

  if (workflowDefers.length > 0) {
    missions.push(createMission(input, {
      agentName: 'steward',
      missionType: 'validation_defer',
      title: 'Workflow validation defer must stay visible',
      summary: workflowDefers[0]?.explanation ?? 'A workflow validation defer remains open.',
      priority: 'high',
      state: 'deferred',
      trigger: 'validation_defer_detected',
      evidenceStatus: deriveEvidenceStatus(input),
      blockerReason: workflowDefers[0]?.explanation,
      recommendedAction: workflowDefers[0]?.remediation ?? 'Resolve deferred workflow readiness before proceeding.',
      suggestedActions: getGateActions('steward'),
      handoffTarget: 'nexus',
    }));
  }

  if (bundle.scorecard?.lockStatus === 'unlocked') {
    missions.push(createMission(input, {
      agentName: 'steward',
      missionType: 'scorecard_governance',
      title: 'Scorecard lock required before evaluation',
      summary: 'Scorecard governance is still unlocked, so evaluation guidance must remain gated.',
      priority: 'high',
      state: 'waiting',
      trigger: 'scorecard_not_locked',
      evidenceStatus: deriveEvidenceStatus(input),
      blockerReason: 'Scorecard lock status is unlocked.',
      recommendedAction: 'Lock or approve the scorecard before using it for vendor evaluation.',
      suggestedActions: [
        suggestedAction('steward-show-required-approvals', 'Show required approvals', 'Identify scorecard owner and approval state.', 'showRequiredApprovals', 'steward'),
        suggestedAction('steward-explain-readiness', 'Explain readiness', 'Explain why scorecard lock matters before evaluation.', 'explainReadiness', 'steward'),
        suggestedAction('steward-explain-waiver-path', 'Explain waiver path', 'Explain waiver conditions if the workflow must proceed.', 'explainWaiverPath', 'steward'),
        customAction('steward'),
      ],
      handoffTarget: 'nexus',
    }));
  }

  if (bundle.stageGates.some((gate) => gate.status === 'blocked')) {
    missions.push(createMission(input, {
      agentName: 'steward',
      missionType: 'gate_check',
      title: 'Stage gate check required',
      summary: 'At least one Source stage gate is blocked in deterministic event state.',
      priority: 'critical',
      state: 'blocked',
      trigger: 'workflow_validation_report',
      evidenceStatus: deriveEvidenceStatus(input),
      blockerReason: bundle.stageGates.find((gate) => gate.status === 'blocked')?.blocker ?? undefined,
      recommendedAction: 'Review blocked stage gates and required artifacts before allowing stage progress.',
      suggestedActions: getGateActions('steward'),
      handoffTarget: 'nexus',
    }));
  }

  return missions;
}

export function prioritizeSourceAgentMissions(missions: SourceAgentMission[]): SourceAgentMission[] {
  return [...missions].sort((a, b) => {
    const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDelta !== 0) return priorityDelta;

    const stateDelta = STATE_RANK[a.state] - STATE_RANK[b.state];
    if (stateDelta !== 0) return stateDelta;

    const createdDelta = a.createdAt.localeCompare(b.createdAt);
    if (createdDelta !== 0) return createdDelta;

    return a.missionId.localeCompare(b.missionId);
  });
}

export function summarizeSourceAgentMissions(missions: SourceAgentMission[]): string {
  const summary = createSourceAgentMissionSummary(missions);
  return summary.summary;
}

export function formatSourceAgentMissionsAsMarkdown(missions: SourceAgentMission[]): string {
  const orderedMissions = prioritizeSourceAgentMissions(missions);
  const summary = createSourceAgentMissionSummary(orderedMissions);
  const lines = [
    '# Source Agent Missions',
    '',
    summary.summary,
    '',
    '## Mission Inventory',
    '',
    '| Priority | State | Agent | Type | Title | Recommended action |',
    '|---|---|---|---|---|---|',
    ...orderedMissions.map((mission) => (
      `| ${mission.priority} | ${mission.state} | ${mission.agentName} | ${mission.missionType} | ${escapeTableCell(mission.title)} | ${escapeTableCell(mission.recommendedAction)} |`
    )),
    '',
    '## Highest Priority Mission',
    '',
    summary.highestPriorityMission
      ? formatMissionDetail(summary.highestPriorityMission)
      : 'No missions were generated.',
    '',
    '## Suggested Actions',
    '',
    ...formatMissionActions(orderedMissions),
  ];

  return `${lines.join('\n')}\n`;
}

function createSourceAgentMissionSummary(missions: SourceAgentMission[]): SourceAgentMissionSummary {
  const byPriority = countBy(PRIORITY_RANK);
  const byState = countBy(STATE_RANK);

  for (const mission of missions) {
    byPriority[mission.priority] += 1;
    byState[mission.state] += 1;
  }

  const orderedMissions = prioritizeSourceAgentMissions(missions);
  const highestPriorityMission = orderedMissions[0];
  const summary = [
    `Source agent missions: ${missions.length} total`,
    `${byPriority.critical} critical`,
    `${byPriority.high} high`,
    `${byPriority.medium} medium`,
    `${byPriority.low} low.`,
    highestPriorityMission
      ? `Highest priority: ${highestPriorityMission.title} (${highestPriorityMission.agentName}).`
      : 'No current missions.',
  ].join(' ');

  return {
    total: missions.length,
    byPriority,
    byState,
    highestPriorityMission,
    summary,
  };
}

function createMission(
  input: SourceAgentMissionInput,
  mission: Omit<SourceAgentMission, 'missionId' | 'sourceEventId' | 'stageId' | 'contextUsed' | 'createdAt'>,
): SourceAgentMission {
  const bundle = input.contextBundle;
  const createdAt = getCreatedAt(input);
  const sourceEventId = bundle.sourcingEvent?.id;
  const stageId = bundle.workflowStage?.key;

  return {
    ...mission,
    missionId: createMissionId(sourceEventId, stageId, mission),
    sourceEventId,
    stageId,
    contextUsed: getSourceContextUsed(bundle),
    createdAt,
  };
}

function createMissionId(
  sourceEventId: string | undefined,
  stageId: string | undefined,
  mission: Pick<SourceAgentMission, 'agentName' | 'missionType' | 'title'>,
): string {
  return [
    'source-mission',
    sourceEventId ?? 'portfolio',
    stageId ?? 'portfolio',
    mission.agentName,
    mission.missionType,
    slugify(mission.title),
  ].join(':');
}

function getNexusSuggestedActions(input: SourceAgentMissionInput): SourceSuggestedAgentAction[] {
  const bundle = input.contextBundle;

  if (bundle.blockers.length > 0 || input.workflowValidationReport?.blockerExplanations.length) {
    return getGateActions('nexus');
  }

  if (bundle.missingInputs.length > 0 || bundle.workflowStage?.key === 'scope' || bundle.waitState?.status === 'waitingOnClient') {
    return getMissingInputActions('nexus');
  }

  return [
    suggestedAction('nexus-explain-readiness', 'Explain readiness', 'Summarize current Source readiness and next action.', 'explainReadiness', 'nexus'),
    suggestedAction('nexus-show-value-at-stake', 'Show value at stake', 'Summarize value context and confidence.', 'showValueAtStake', 'nexus'),
    suggestedAction('nexus-show-evidence-gaps', 'Show evidence gaps', 'Show evidence and citation gaps before next action.', 'showEvidenceGaps', 'nexus'),
    customAction('nexus'),
  ];
}

function getMissingInputActions(agentName: SourceAgentName): SourceSuggestedAgentAction[] {
  return [
    suggestedAction(`${agentName}-show-missing-inputs`, 'Show missing inputs', 'List missing inputs, owners, and stage impact.', 'showMissingInputs', agentName),
    suggestedAction(`${agentName}-generate-minimum-data-request`, 'Generate minimum data request', 'Draft a deterministic request for the missing baseline.', 'generateMinimumDataRequest', agentName),
    suggestedAction(`${agentName}-explain-scope-readiness`, 'Explain scope readiness', 'Explain whether Scope can advance and what is still unsafe.', 'explainReadiness', agentName),
    customAction(agentName),
  ];
}

function getEvidenceActions(agentName: SourceAgentName): SourceSuggestedAgentAction[] {
  return [
    suggestedAction(`${agentName}-show-evidence-gaps`, 'Show evidence gaps', 'Review missing citations, weak evidence, and deferred context checks.', 'showEvidenceGaps', agentName),
    suggestedAction(`${agentName}-show-context-validation`, 'Show context validation', 'Inspect pass, defer, and reject results before using agent output.', 'showContextValidation', agentName),
    suggestedAction(`${agentName}-explain-weak-claims`, 'Explain weak claims', 'List claims Nexus should not overstate yet.', 'showEvidenceGaps', agentName),
    customAction(agentName),
  ];
}

function getGateActions(agentName: SourceAgentName): SourceSuggestedAgentAction[] {
  return [
    suggestedAction(`${agentName}-show-gate-blockers`, 'Show gate blockers', 'Review what is blocked and why the gate cannot be bypassed.', 'showGateBlockers', agentName),
    suggestedAction(`${agentName}-show-required-approvals`, 'Show required approvals', 'Identify owners, approval routes, and missing approval state.', 'showRequiredApprovals', agentName),
    suggestedAction(`${agentName}-explain-waiver-path`, 'Explain waiver path', 'Explain what would require a governed waiver and rationale.', 'explainWaiverPath', agentName),
    customAction(agentName),
  ];
}

function suggestedAction(
  id: string,
  label: string,
  description: string,
  actionType: SourceSuggestedAgentAction['actionType'],
  agentName: SourceAgentName,
  enabled = true,
  disabledReason?: string,
): SourceSuggestedAgentAction {
  return {
    id,
    label,
    description,
    actionType,
    agentName,
    enabled,
    disabledReason,
  };
}

function customAction(agentName: SourceAgentName): SourceSuggestedAgentAction {
  return suggestedAction(
    `${agentName}-ask-custom-question`,
    'Ask something else',
    'Use custom input while preserving the current Source context.',
    'askCustomQuestion',
    agentName,
  );
}

function deriveEvidenceStatus(input: SourceAgentMissionInput): SourceAgentMission['evidenceStatus'] {
  const bundle = input.contextBundle;

  if (bundle.citationCoverage?.missingCitationClaims.length) {
    return 'missing';
  }

  if (bundle.contextQuality.overallConfidence === 'low' || bundle.evidenceCitations.length === 0) {
    return 'lowConfidence';
  }

  if (bundle.evidenceCitations.length > 0 || bundle.citationCoverage?.confidence === 'high') {
    return 'usable';
  }

  return 'notApplicable';
}

function getValueAtStake(input: SourceAgentMissionInput): number {
  return input.contextBundle.sourcingEvent?.valueAtStakeUsd
    ?? sumAmounts(input.contextBundle.projectedValueLedger)
    ?? 0;
}

function getEventName(input: SourceAgentMissionInput): string {
  return input.contextBundle.sourcingEvent?.name ?? (
    input.contextBundle.contextScope === 'portfolio' ? 'Source portfolio' : 'Unknown Source event'
  );
}

function getFallbackNextAction(input: SourceAgentMissionInput): string {
  if (input.contextBundle.missingInputs.length > 0) {
    return 'Resolve missing Source inputs before advancing workflow.';
  }

  if (input.contextBundle.blockers.length > 0) {
    return `Resolve blocker: ${input.contextBundle.blockers[0]}`;
  }

  return 'Review Source event readiness and confirm the next action owner.';
}

function getCreatedAt(input: SourceAgentMissionInput): string {
  return input.generatedAt
    ?? input.workflowValidationReport?.generatedAt
    ?? input.contextValidationReport?.generatedAt
    ?? input.multiAgentBriefing?.generatedAt
    ?? DEFAULT_CREATED_AT;
}

function countBy<T extends string>(template: Record<T, number>): Record<T, number> {
  const counts = {} as Record<T, number>;
  for (const key of Object.keys(template) as T[]) {
    counts[key] = 0;
  }
  return counts;
}

function formatMissionDetail(mission: SourceAgentMission): string {
  return [
    `Title: ${mission.title}`,
    `Agent: ${mission.agentName}`,
    `Type: ${mission.missionType}`,
    `Priority: ${mission.priority}`,
    `State: ${mission.state}`,
    `Recommended action: ${mission.recommendedAction}`,
    mission.blockerReason ? `Blocker: ${mission.blockerReason}` : undefined,
    mission.handoffTarget ? `Handoff target: ${mission.handoffTarget}` : undefined,
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function formatMissionActions(missions: SourceAgentMission[]): string[] {
  const actionsById = new Map<string, SourceSuggestedAgentAction>();
  for (const mission of missions) {
    for (const action of mission.suggestedActions) {
      actionsById.set(action.id, action);
    }
  }

  if (actionsById.size === 0) {
    return ['- None.'];
  }

  return Array.from(actionsById.values()).map((action) => (
    `- ${action.label} (${action.agentName}): ${action.description}${action.enabled ? '' : ` [disabled: ${action.disabledReason ?? 'unavailable'}]`}`
  ));
}

function formatList(values: string[], fallback: string): string {
  return values.length > 0 ? values.join('; ') : fallback;
}

function firstOrUndefined(values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => Boolean(value?.trim()));
}

function sumAmounts(lines: Array<{ amountUsd?: number }>): number {
  return lines.reduce((total, line) => total + (line.amountUsd ?? 0), 0);
}

function formatUsd(value: number): string {
  return `$${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value)}`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function plural(count: number): string {
  return count === 1 ? '' : 's';
}
