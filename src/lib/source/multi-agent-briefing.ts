import {
  getSourceContextUsed,
} from './context-builder';
import type {
  SourceAgentBriefing,
  SourceAgentBriefingConfidence,
  SourceAgentBriefingInput,
  SourceAgentName,
  SourceMultiAgentBriefing,
  SourceMultiAgentOverallReadiness,
  SourceSuggestedAgentAction,
  SourceSuggestedAgentActionType,
} from './multi-agent-types';

const SOURCE_MULTI_AGENT_BRIEFING_VERSION = 'source-multi-agent-briefing/v1';
const DEFAULT_GENERATED_AT = '2026-04-25T00:00:00.000Z';
const LOW_CONTEXT_RECOMMENDED_SLICE = 'Strengthen Source context and evidence before adding UI, API routes, or model calls.';
const DEFAULT_RECOMMENDED_SLICE = 'Review deterministic multi-agent briefing output, then plan a Source-specific Nexus API route stub with no model calls.';

export function buildSourceMultiAgentBriefing(
  input: SourceAgentBriefingInput,
): SourceMultiAgentBriefing {
  const nexus = buildNexusBriefing(input);
  const sentinel = buildSentinelBriefing(input);
  const atlas = buildAtlasBriefing(input);
  const steward = buildStewardBriefing(input);
  const blockers = unique([
    ...nexus.blockers,
    ...steward.blockers,
  ]);
  const defers = unique([
    ...(input.contextValidationReport?.deferReasons.map((defer) => `${defer.fixtureId}: ${defer.reason}`) ?? []),
    ...(input.workflowValidationReport?.intentionalDefers.map((defer) => `${defer.fixtureId}: ${defer.explanation}`) ?? []),
  ]);
  const overallReadiness = deriveOverallReadiness(input, blockers, defers);
  const highestPriorityAction = getHighestPriorityAction(input, nexus, steward, overallReadiness);

  return {
    eventId: input.contextBundle.sourcingEvent?.id,
    contextScope: input.contextBundle.contextScope,
    generatedAt: getGeneratedAt(input),
    nexus,
    sentinel,
    atlas,
    steward,
    combinedSummary: [
      `Briefing version ${SOURCE_MULTI_AGENT_BRIEFING_VERSION}.`,
      nexus.primaryFinding,
      sentinel.primaryFinding,
      atlas.primaryFinding,
      steward.primaryFinding,
      `Overall readiness: ${overallReadiness}.`,
    ].join(' '),
    highestPriorityAction,
    overallReadiness,
    blockers,
    defers,
    recommendedNextSlice: overallReadiness === 'lowContext'
      ? LOW_CONTEXT_RECOMMENDED_SLICE
      : DEFAULT_RECOMMENDED_SLICE,
  };
}

export function buildNexusBriefing(input: SourceAgentBriefingInput): SourceAgentBriefing {
  const bundle = input.contextBundle;
  const eventName = getEventName(input);
  const stageLabel = bundle.workflowStage?.label ?? 'portfolio';
  const missingInputs = [...bundle.missingInputs];
  const blockers = [...bundle.blockers];
  const hasWorkflowBlockers = Boolean(input.workflowValidationReport?.blockerExplanations.length);
  const confidence = getBriefingConfidence(input, missingInputs.length > 0 || blockers.length > 0);
  const primaryFinding = missingInputs.length > 0
    ? `${eventName} cannot move cleanly until ${missingInputs.length} missing input${plural(missingInputs.length)} are resolved.`
    : blockers.length > 0
      ? `${eventName} is blocked by ${blockers[0]}.`
      : `${eventName} has enough deterministic context for current-state sourcing guidance.`;

  return {
    agentName: 'nexus',
    title: 'Nexus sourcing command read',
    summary: `${eventName} is in ${stageLabel}. ${formatLifecycle(input)} ${formatValueAtStake(input)}`,
    primaryFinding,
    confidence,
    contextUsed: getSourceContextUsed(bundle),
    risks: formatRisks(input),
    blockers,
    missingInputs,
    recommendedNextAction: bundle.nextAction ?? (missingInputs.length > 0
      ? 'Resolve missing sourcing inputs before release or generation.'
      : 'Review the current Source portfolio attention items.'),
    suggestedActions: getNexusSuggestedActions(input),
    evidenceNotes: formatEvidenceNotes(input),
    validationNotes: [
      formatContextValidationNote(input),
      formatWorkflowValidationNote(input),
    ],
    cannotProceedReasons: unique([
      ...blockers,
      ...(missingInputs.length > 0 ? [`Missing inputs: ${missingInputs.join('; ')}`] : []),
      ...(hasWorkflowBlockers ? ['Workflow validation contains expected BLOCK outcomes that must remain enforced.'] : []),
    ]),
    handoffRecommendation: getNexusHandoffRecommendation(input),
    generatedAt: getGeneratedAt(input),
  };
}

export function buildSentinelBriefing(input: SourceAgentBriefingInput): SourceAgentBriefing {
  const bundle = input.contextBundle;
  const missingCitationClaims = bundle.citationCoverage?.missingCitationClaims ?? [];
  const contextGaps = input.contextValidationReport?.remainingContextGaps.map((gap) => `${gap.id}: ${gap.summary}`) ?? [];
  const deferNotes = input.contextValidationReport?.deferReasons.map((defer) => `${defer.fixtureId}: ${defer.reason}`) ?? [];
  const evidenceNotes = formatEvidenceNotes(input);
  const weakEvidence = missingCitationClaims.length > 0 || contextGaps.length > 0 || deferNotes.length > 0;

  return {
    agentName: 'sentinel',
    title: 'Sentinel evidence and validation read',
    summary: weakEvidence
      ? 'Evidence is usable for deterministic context checks, but some claims remain low-confidence or intentionally deferred.'
      : 'Evidence and context validation show no current reject condition in the provided reports.',
    primaryFinding: missingCitationClaims.length > 0
      ? `Client-specific citation coverage is incomplete for ${missingCitationClaims.join(', ')}.`
      : input.contextValidationReport
        ? `Context validation verdict is ${input.contextValidationReport.suite.verdict}.`
        : 'No context validation report was provided; evidence confidence should stay bounded.',
    confidence: weakEvidence ? 'medium' : getBriefingConfidence(input),
    contextUsed: getSourceContextUsed(bundle),
    risks: unique([
      ...contextGaps,
      ...deferNotes,
      ...missingCitationClaims.map((claim) => `Missing citation coverage for ${claim}.`),
    ]),
    blockers: input.contextValidationReport?.rejectReasons.map((reject) => `${reject.fixtureId}: ${reject.reason}`) ?? [],
    missingInputs: unique([...bundle.contextQuality.missingContextReasons, ...bundle.missingInputs]),
    recommendedNextAction: weakEvidence
      ? 'Validate missing evidence and keep unsupported claims labeled as pattern-level or low-confidence.'
      : 'Keep context validation report attached to future Nexus runtime work.',
    suggestedActions: [
      suggestedAction('sentinel-show-evidence-gaps', 'Show evidence gaps', 'Review missing citations, weak evidence, and deferred context checks.', 'showEvidenceGaps', 'sentinel'),
      suggestedAction('sentinel-show-context-validation', 'Show context validation', 'Inspect pass, defer, and reject results before using agent output.', 'showContextValidation', 'sentinel'),
      suggestedAction('sentinel-explain-weak-claims', 'Explain weak claims', 'List claims Nexus should not overstate yet.', 'showEvidenceGaps', 'sentinel'),
      customAction('sentinel'),
    ],
    evidenceNotes,
    validationNotes: [
      formatContextValidationNote(input),
      ...contextGaps,
      ...deferNotes,
    ],
    cannotProceedReasons: input.contextValidationReport?.rejectReasons.map((reject) => reject.reason) ?? [],
    handoffRecommendation: weakEvidence
      ? 'Sentinel to Nexus: missing or weak evidence should shape the next action and lower confidence.'
      : undefined,
    generatedAt: getGeneratedAt(input),
  };
}

export function buildAtlasBriefing(input: SourceAgentBriefingInput): SourceAgentBriefing {
  const bundle = input.contextBundle;
  const valueAtStake = bundle.sourcingEvent?.valueAtStakeUsd ?? sumLedgerValue(bundle.projectedValueLedger);
  const projectedValue = bundle.sourcingEvent?.projectedValueUsd ?? sumLedgerValue(bundle.projectedValueLedger);
  const realizedValue = bundle.sourcingEvent?.realizedValueUsd ?? sumLedgerValue(bundle.realizedValueLedger ?? []);
  const valueSummary = [
    valueAtStake > 0 ? `${formatUsd(valueAtStake)} value at stake` : 'No value-at-stake amount is available',
    projectedValue > 0 ? `${formatUsd(projectedValue)} projected value` : 'projected value is not quantified',
    realizedValue > 0 ? `${formatUsd(realizedValue)} realized value` : 'realized value is not yet established',
  ].join('; ');
  const executiveRisks = unique([
    ...formatRisks(input),
    ...bundle.blockers.map((blocker) => `Execution blocker: ${blocker}`),
    ...(input.workflowValidationReport?.intentionalDefers.map((defer) => `Deferred workflow confidence: ${defer.explanation}`) ?? []),
  ]);

  return {
    agentName: 'atlas',
    title: 'Atlas executive synthesis',
    summary: `${getEventName(input)} executive read: ${valueSummary}.`,
    primaryFinding: realizedValue > 0
      ? 'Value has realized entries, but executive confidence still depends on evidence and measurement ownership.'
      : 'Value is projected or seeded; Atlas should not present it as realized savings.',
    confidence: bundle.evidenceCitations.length > 0 ? 'medium' : 'low',
    contextUsed: getSourceContextUsed(bundle),
    risks: executiveRisks,
    blockers: bundle.blockers,
    missingInputs: bundle.missingInputs,
    recommendedNextAction: executiveRisks.length > 0
      ? 'Prepare an executive decision brief that separates value, risk, and missing evidence.'
      : 'Prepare a concise executive status brief from the deterministic Source context.',
    suggestedActions: [
      suggestedAction('atlas-show-value-at-stake', 'Show value at stake', 'Summarize value, confidence, and measurement limits.', 'showValueAtStake', 'atlas'),
      suggestedAction('atlas-prepare-executive-brief', 'Prepare executive brief', 'Create CIO/CFO-style decision language from deterministic context.', 'prepareExecutiveBrief', 'atlas'),
      suggestedAction('atlas-show-tradeoffs', 'Show tradeoffs', 'Explain executive tradeoffs without overstating evidence.', 'prepareExecutiveBrief', 'atlas'),
      customAction('atlas'),
    ],
    evidenceNotes: [
      'Atlas labels current value as projected or seeded unless realized value evidence exists.',
      ...formatEvidenceNotes(input),
    ],
    validationNotes: [
      formatContextValidationNote(input),
      formatWorkflowValidationNote(input),
    ],
    cannotProceedReasons: realizedValue <= 0
      ? ['Atlas cannot label value as realized without measurement evidence.']
      : [],
    handoffRecommendation: 'Atlas to Nexus: executive action needs operational follow-up in the sourcing workflow.',
    generatedAt: getGeneratedAt(input),
  };
}

export function buildStewardBriefing(input: SourceAgentBriefingInput): SourceAgentBriefing {
  const bundle = input.contextBundle;
  const workflow = input.workflowValidationReport;
  const blockerExplanations = workflow?.blockerExplanations.map((blocker) => `${blocker.fixtureId}: ${blocker.explanation}`) ?? [];
  const deferExplanations = workflow?.intentionalDefers.map((defer) => `${defer.fixtureId}: ${defer.explanation}`) ?? [];
  const failedExpectations = workflow?.failedExpectations.map((failure) => (
    `${failure.fixtureId}: expected ${failure.expectedOutcome}, got ${failure.actualOutcome}`
  )) ?? [];
  const gateBlockers = unique([
    ...bundle.blockers,
    ...blockerExplanations,
    ...failedExpectations,
  ]);

  return {
    agentName: 'steward',
    title: 'Steward gate integrity read',
    summary: workflow
      ? `${workflow.summaryHeadline}. Steward treats BLOCK outcomes as expected enforcement when fixture expectations match.`
      : 'No workflow validation report was provided; gate readiness must stay conservative.',
    primaryFinding: failedExpectations.length > 0
      ? 'Workflow validation has failed expectations; review should stop.'
      : deferExplanations.length > 0
        ? 'Workflow validation has an intentional defer that must remain blocked until the missing capability exists.'
        : gateBlockers.length > 0
          ? 'Workflow gates contain blockers that must remain enforced.'
          : 'No workflow blocker was found in the provided deterministic context.',
    confidence: workflow ? 'high' : 'medium',
    contextUsed: getSourceContextUsed(bundle),
    risks: unique([
      ...deferExplanations,
      ...(workflow?.remainingWorkflowGaps ?? []),
    ]),
    blockers: gateBlockers,
    missingInputs: bundle.missingInputs,
    recommendedNextAction: workflow?.remediationByFixture[0]
      ?? (bundle.blockers.length > 0 ? `Resolve blocker: ${bundle.blockers[0]}` : 'Keep gate validation attached to the next Source runtime plan.'),
    suggestedActions: [
      suggestedAction('steward-show-gate-blockers', 'Show gate blockers', 'List blocked actions, rules, and required remediations.', 'showGateBlockers', 'steward'),
      suggestedAction('steward-show-required-approvals', 'Show required approvals', 'Inspect approval-owner and release-route requirements.', 'showRequiredApprovals', 'steward'),
      suggestedAction('steward-explain-waiver-path', 'Explain waiver path', 'Explain when an exception requires waiver rationale and owner.', 'explainWaiverPath', 'steward'),
      customAction('steward'),
    ],
    evidenceNotes: workflow
      ? workflow.fixtureOutcomes.map((row) => `${row.fixtureId}: ${row.evidenceSummary}`)
      : ['Workflow validation evidence was not provided.'],
    validationNotes: [
      formatWorkflowValidationNote(input),
      ...(workflow?.remainingWorkflowGaps ?? []),
    ],
    cannotProceedReasons: unique([
      ...failedExpectations,
      ...deferExplanations,
      ...bundle.blockers,
    ]),
    handoffRecommendation: gateBlockers.length > 0 || deferExplanations.length > 0
      ? 'Steward to Nexus: workflow action is blocked or deferred; Nexus should guide the unblock path, not bypass the gate.'
      : 'Steward to Nexus: workflow action may proceed only if current deterministic gates remain clear.',
    generatedAt: getGeneratedAt(input),
  };
}

export function getSourceMultiAgentSuggestedActions(
  briefing: SourceMultiAgentBriefing,
): SourceSuggestedAgentAction[] {
  return uniqueActions([
    ...briefing.nexus.suggestedActions,
    ...briefing.sentinel.suggestedActions,
    ...briefing.atlas.suggestedActions,
    ...briefing.steward.suggestedActions,
  ]);
}

export function summarizeSourceMultiAgentBriefing(
  briefing: SourceMultiAgentBriefing,
): string {
  return briefing.combinedSummary;
}

export function formatSourceMultiAgentBriefingAsMarkdown(
  briefing: SourceMultiAgentBriefing,
): string {
  const suggestedActions = getSourceMultiAgentSuggestedActions(briefing);
  const lines = [
    '# Source Multi-Agent Briefing',
    '',
    `Generated at: ${briefing.generatedAt}`,
    `Context scope: ${briefing.contextScope}`,
    briefing.eventId ? `Event id: ${briefing.eventId}` : 'Event id: portfolio',
    `Overall readiness: ${briefing.overallReadiness}`,
    '',
    '## Combined Summary',
    '',
    briefing.combinedSummary,
    '',
    '## Nexus',
    '',
    formatAgentBriefing(briefing.nexus),
    '',
    '## Sentinel',
    '',
    formatAgentBriefing(briefing.sentinel),
    '',
    '## Atlas',
    '',
    formatAgentBriefing(briefing.atlas),
    '',
    '## Steward',
    '',
    formatAgentBriefing(briefing.steward),
    '',
    '## Highest Priority Action',
    '',
    briefing.highestPriorityAction,
    '',
    '## Blockers / Defers',
    '',
    ...formatListSection('Blockers', briefing.blockers),
    '',
    ...formatListSection('Defers', briefing.defers),
    '',
    '## Suggested Actions',
    '',
    ...suggestedActions.map((action) => (
      `- ${action.label} (${action.agentName}): ${action.description}${action.enabled ? '' : ` [disabled: ${action.disabledReason ?? 'unavailable'}]`}`
    )),
    '',
    '## Recommended Next Slice',
    '',
    briefing.recommendedNextSlice,
  ];

  return `${lines.join('\n')}\n`;
}

function getNexusSuggestedActions(input: SourceAgentBriefingInput): SourceSuggestedAgentAction[] {
  const bundle = input.contextBundle;
  const hasWorkflowBlockers = Boolean(input.workflowValidationReport?.blockerExplanations.length);

  if (bundle.blockers.length > 0 || hasWorkflowBlockers) {
    return [
      suggestedAction('nexus-show-gate-blockers', 'Show gate blockers', 'Review what is blocked and why the gate cannot be bypassed.', 'showGateBlockers', 'nexus'),
      suggestedAction('nexus-show-required-approvals', 'Show required approvals', 'Identify owners, approval routes, and missing approval state.', 'showRequiredApprovals', 'nexus'),
      suggestedAction('nexus-explain-waiver-path', 'Explain waiver path', 'Explain what would require a governed waiver and rationale.', 'explainWaiverPath', 'nexus'),
      customAction('nexus'),
    ];
  }

  if (bundle.missingInputs.length > 0 || bundle.workflowStage?.key === 'scope' || bundle.waitState?.status === 'waitingOnClient') {
    return [
      suggestedAction('nexus-show-missing-inputs', 'Show missing inputs', 'List missing inputs, owners, and stage impact.', 'showMissingInputs', 'nexus'),
      suggestedAction('nexus-generate-minimum-data-request', 'Generate minimum data request', 'Draft a deterministic request for the missing baseline.', 'generateMinimumDataRequest', 'nexus'),
      suggestedAction('nexus-explain-scope-readiness', 'Explain scope readiness', 'Explain whether Scope can advance and what is still unsafe.', 'explainReadiness', 'nexus'),
      customAction('nexus'),
    ];
  }

  return [
    suggestedAction('nexus-explain-readiness', 'Explain readiness', 'Summarize current Source readiness and next action.', 'explainReadiness', 'nexus'),
    suggestedAction('nexus-show-value-at-stake', 'Show value at stake', 'Summarize value context and confidence.', 'showValueAtStake', 'nexus'),
    suggestedAction('nexus-show-evidence-gaps', 'Show evidence gaps', 'Show evidence and citation gaps before next action.', 'showEvidenceGaps', 'nexus'),
    customAction('nexus'),
  ];
}

function deriveOverallReadiness(
  input: SourceAgentBriefingInput,
  blockers: string[],
  defers: string[],
): SourceMultiAgentOverallReadiness {
  const contextQuality = input.contextBundle.contextQuality;

  if (!input.contextBundle.sourcingEvent && input.contextBundle.contextScope !== 'portfolio') {
    return 'lowContext';
  }

  if (contextQuality.contextCompleteness <= 1 || contextQuality.overallConfidence === 'low') {
    return 'lowContext';
  }

  if (input.contextValidationReport?.suite.verdict === 'reject' || input.workflowValidationReport?.failedExpectations.length) {
    return 'blocked';
  }

  if (blockers.length > 0 || input.contextBundle.missingInputs.length > 0) {
    return 'blocked';
  }

  if (input.workflowValidationReport?.suiteVerdict === 'defer' || input.contextValidationReport?.suite.verdict === 'defer' || defers.length > 0) {
    return 'deferred';
  }

  if (contextQuality.overallConfidence === 'medium') {
    return 'partiallyReady';
  }

  return 'ready';
}

function getHighestPriorityAction(
  input: SourceAgentBriefingInput,
  nexus: SourceAgentBriefing,
  steward: SourceAgentBriefing,
  readiness: SourceMultiAgentOverallReadiness,
): string {
  if (readiness === 'lowContext') {
    return 'Resolve missing context before treating any briefing as decision-grade.';
  }

  if (input.contextBundle.missingInputs.length > 0) {
    return 'Collect or waive missing inputs before advancing the sourcing workflow.';
  }

  if (readiness === 'blocked' && steward.cannotProceedReasons.length > 0) {
    return steward.recommendedNextAction;
  }

  return nexus.recommendedNextAction;
}

function getNexusHandoffRecommendation(input: SourceAgentBriefingInput): string | undefined {
  if (input.contextBundle.citationCoverage?.missingCitationClaims.length) {
    return 'Nexus to Sentinel: evidence is weak, so validate missing citation coverage before decision-grade claims.';
  }

  if (input.contextBundle.blockers.length > 0 || input.workflowValidationReport?.blockerExplanations.length) {
    return 'Nexus to Steward: a gate or workflow blocker needs enforcement before action.';
  }

  if (input.mode === 'executive' || input.userRole === 'cio' || input.userRole === 'cfo') {
    return 'Nexus to Atlas: executive framing is needed for decision readability.';
  }

  return undefined;
}

function getBriefingConfidence(
  input: SourceAgentBriefingInput,
  downgrade = false,
): SourceAgentBriefingConfidence {
  const base = input.contextBundle.contextQuality.overallConfidence;
  if (!downgrade) return base;
  if (base === 'high') return 'medium';
  return base;
}

function getGeneratedAt(input: SourceAgentBriefingInput): string {
  return input.generatedAt
    ?? input.workflowValidationReport?.generatedAt
    ?? input.contextValidationReport?.generatedAt
    ?? DEFAULT_GENERATED_AT;
}

function getEventName(input: SourceAgentBriefingInput): string {
  return input.contextBundle.sourcingEvent?.name ?? (
    input.contextBundle.contextScope === 'portfolio' ? 'Source portfolio' : 'Unknown Source event'
  );
}

function formatLifecycle(input: SourceAgentBriefingInput): string {
  const bundle = input.contextBundle;
  const status = bundle.lifecycleStatus ? `Status: ${bundle.lifecycleStatus}.` : '';
  const owner = bundle.eventOwner ? `Owner: ${bundle.eventOwner}.` : '';
  const aging = typeof bundle.agingDays === 'number' ? `Aging: ${bundle.agingDays} days.` : '';
  return [status, owner, aging].filter(Boolean).join(' ');
}

function formatValueAtStake(input: SourceAgentBriefingInput): string {
  const value = input.contextBundle.sourcingEvent?.valueAtStakeUsd ?? sumLedgerValue(input.contextBundle.projectedValueLedger);
  return value > 0 ? `Value at stake: ${formatUsd(value)}.` : 'Value at stake is not quantified.';
}

function formatRisks(input: SourceAgentBriefingInput): string[] {
  return input.contextBundle.risks.map((risk) => (
    `${risk.severity.toUpperCase()}: ${risk.title}${risk.owner ? ` (owner: ${risk.owner})` : ''}`
  ));
}

function formatEvidenceNotes(input: SourceAgentBriefingInput): string[] {
  const bundle = input.contextBundle;
  const notes: string[] = [];

  notes.push(`Evidence citations available: ${bundle.evidenceCitations.length}.`);
  if (bundle.citationCoverage) {
    notes.push(`Citation confidence: ${bundle.citationCoverage.confidence}.`);
    if (bundle.citationCoverage.missingCitationClaims.length > 0) {
      notes.push(`Missing citation claims: ${bundle.citationCoverage.missingCitationClaims.join(', ')}.`);
    }
  }
  if (bundle.uploadedFiles.length > 0) {
    notes.push(`Uploaded files in context: ${bundle.uploadedFiles.map((file) => file.fileName).join(', ')}.`);
  }
  if (bundle.parsedFileSummaries.length === 0) {
    notes.push('No parsed uploaded-file summaries are available.');
  }
  if (bundle.projectedValueLedger.length > 0) {
    notes.push('Value context is projected/seeded unless realized measurement evidence exists.');
  }

  return unique(notes);
}

function formatContextValidationNote(input: SourceAgentBriefingInput): string {
  const report = input.contextValidationReport;
  if (!report) {
    return 'Context validation report was not provided.';
  }

  return `Context validation: ${report.suite.totalFixtures} fixtures / ${report.suite.passCount} pass / ${report.suite.deferCount} defer / ${report.suite.rejectCount} reject / verdict ${report.suite.verdict}.`;
}

function formatWorkflowValidationNote(input: SourceAgentBriefingInput): string {
  const report = input.workflowValidationReport;
  if (!report) {
    return 'Workflow validation report was not provided.';
  }

  return `${report.summaryHeadline}; suite verdict ${report.suiteVerdict}; mismatch count ${report.mismatchCount}.`;
}

function formatAgentBriefing(briefing: SourceAgentBriefing): string {
  const lines = [
    `Title: ${briefing.title}`,
    `Confidence: ${briefing.confidence}`,
    `Summary: ${briefing.summary}`,
    `Primary finding: ${briefing.primaryFinding}`,
    `Recommended next action: ${briefing.recommendedNextAction}`,
    briefing.handoffRecommendation ? `Handoff: ${briefing.handoffRecommendation}` : undefined,
    '',
    'Risks:',
    ...formatBullets(briefing.risks),
    '',
    'Blockers:',
    ...formatBullets(briefing.blockers),
    '',
    'Missing inputs:',
    ...formatBullets(briefing.missingInputs),
    '',
    'Validation notes:',
    ...formatBullets(briefing.validationNotes),
    '',
    'Cannot proceed reasons:',
    ...formatBullets(briefing.cannotProceedReasons),
  ].filter((line): line is string => line !== undefined);

  return lines.join('\n');
}

function formatListSection(title: string, values: string[]): string[] {
  return [
    `${title}:`,
    ...formatBullets(values),
  ];
}

function formatBullets(values: string[]): string[] {
  if (values.length === 0) return ['- None.'];
  return values.map((value) => `- ${value}`);
}

function suggestedAction(
  id: string,
  label: string,
  description: string,
  actionType: SourceSuggestedAgentActionType,
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

function uniqueActions(actions: SourceSuggestedAgentAction[]): SourceSuggestedAgentAction[] {
  const byId = new Map<string, SourceSuggestedAgentAction>();
  for (const action of actions) {
    byId.set(action.id, action);
  }
  return Array.from(byId.values());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function sumLedgerValue(lines: Array<{ amountUsd?: number }>): number {
  return lines.reduce((total, line) => total + (line.amountUsd ?? 0), 0);
}

function formatUsd(value: number): string {
  return `$${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value)}`;
}

function plural(count: number): string {
  return count === 1 ? '' : 's';
}
