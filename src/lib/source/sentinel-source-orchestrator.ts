import {
  buildSourceMultiAgentBriefing,
} from './multi-agent-briefing';
import type {
  SourceAgentBriefing,
  SourceAgentBriefingInput,
  SourceAgentName,
  SourceMultiAgentOverallReadiness,
  SpecialistContribution,
  SentinelSourceBriefing,
} from './multi-agent-types';
import {
  checkSentinelVoice,
  isSentinelVoiceDoctrineEnabled,
} from '../agent/voice-doctrine/sentinel';

// ── Specialist ranking ───────────────────────────────────────────────────────
//
// Priority order: steward (gate blockers) > sentinel (evidence) > nexus (action)
// > atlas (executive). Within a tier, higher-confidence contributions rank first.

const SPECIALIST_PRIORITY: Record<SourceAgentName, number> = {
  steward: 0,
  sentinel: 1,
  nexus: 2,
  atlas: 3,
};

function rankSpecialists(
  contributions: SpecialistContribution[],
): SpecialistContribution[] {
  return [...contributions].sort((a, b) => {
    const tierDiff =
      SPECIALIST_PRIORITY[a.specialistFlavor] -
      SPECIALIST_PRIORITY[b.specialistFlavor];
    if (tierDiff !== 0) return tierDiff;
    const confOrder = { high: 0, medium: 1, low: 2 } as const;
    return (
      (confOrder[a.contribution.confidence] ?? 2) -
      (confOrder[b.contribution.confidence] ?? 2)
    );
  });
}

// ── Primary-voice synthesis ──────────────────────────────────────────────────
//
// The summary is built from the top-ranked specialist's primary finding
// plus the highest-severity context from other specialists, trimmed to
// the /source word cap (120 words). Sentinel voice doctrine is checked
// and violations are surfaced in evidence notes.

const SOURCE_SENTINEL_WORD_CAP = 120;

type BriefingPatch = Partial<
  Pick<
    SourceAgentBriefing,
    | 'primaryFinding'
    | 'summary'
    | 'confidence'
    | 'recommendedNextAction'
    | 'suggestedActions'
    | 'cannotProceedReasons'
    | 'handoffRecommendation'
  >
>;

function withBriefingPatch(
  base: SourceAgentBriefing,
  patch: BriefingPatch,
): SourceAgentBriefing {
  return {
    ...base,
    ...patch,
  };
}

function action(
  id: string,
  label: string,
  agentName: SourceAgentName,
) {
  return {
    id,
    label,
    description: label,
    actionType: 'showEvidenceGaps' as const,
    agentName,
    enabled: true,
  };
}

function valueLabel(input: SourceAgentBriefingInput): 'projected' | 'seeded' | 'realized' {
  if ((input.contextBundle.realizedValueLedger ?? []).length > 0) return 'realized';
  if (input.contextBundle.projectedValueLedger.length > 0) return 'projected';
  return 'seeded';
}

function valueAtStake(input: SourceAgentBriefingInput): number {
  return input.contextBundle.sourcingEvent?.valueAtStakeUsd
    ?? input.contextBundle.projectedValueLedger.reduce((sum, item) => sum + item.amountUsd, 0);
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function buildContextValidationChecker(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const verdict = input.contextValidationReport?.suite.verdict ?? 'unknown';
  const gaps = input.contextValidationReport?.remainingContextGaps.length ?? 0;
  return withBriefingPatch(base, {
    primaryFinding: `Context validation verdict is ${verdict}; ${gaps} context gap${gaps === 1 ? '' : 's'} remain before the recommendation is decision-grade.`,
    confidence: verdict === 'pass' ? 'high' : 'medium',
    cannotProceedReasons: input.contextValidationReport?.rejectReasons.map((reject) => reject.reason) ?? [],
    handoffRecommendation: 'Sentinel to Nexus: use the validation verdict to shape the next safe action.',
  });
}

function buildEvidenceGapDetector(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const missing = input.contextBundle.citationCoverage?.missingCitationClaims ?? [];
  const gap = missing[0] ?? input.contextValidationReport?.remainingContextGaps[0]?.summary ?? 'Missing source evidence';
  return withBriefingPatch(base, {
    primaryFinding: `${gap} could make the downstream recommendation non-decision-grade.`,
    confidence: missing.length > 0 ? 'medium' : base.confidence,
    suggestedActions: [
      action('evidence-gap-show', 'Show evidence gaps', 'sentinel'),
      action('evidence-gap-explain', 'Explain weak claims', 'sentinel'),
    ],
    cannotProceedReasons: input.contextValidationReport?.rejectReasons.map((reject) => reject.reason) ?? [],
    handoffRecommendation: 'Sentinel to Nexus: evidence gaps must bound the next recommendation.',
  });
}

function buildNextActionRecommender(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const actionText = input.contextBundle.nextAction ?? 'Resolve missing sourcing inputs';
  const reason = input.contextBundle.missingInputs[0] ?? input.contextBundle.blockers[0] ?? 'advance the sourcing workflow safely';
  return withBriefingPatch(base, {
    primaryFinding: `[ACTION] ${actionText} - required to ${reason}.`,
    confidence: input.contextBundle.missingInputs.length > 0 || input.contextBundle.blockers.length > 0 ? 'medium' : base.confidence,
    cannotProceedReasons: base.cannotProceedReasons,
    handoffRecommendation: 'Nexus to Steward: a gate or workflow blocker needs enforcement before action.',
  });
}

function buildMinimumDataRequestGenerator(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const items = input.contextBundle.missingInputs;
  return withBriefingPatch(base, {
    primaryFinding: `The minimum data request to advance is: [${items.length} item${items.length === 1 ? '' : 's'}] ${items.join('; ') || 'No missing inputs'}.`,
    confidence: items.length > 0 ? 'medium' : base.confidence,
    cannotProceedReasons: items,
    handoffRecommendation: 'Nexus to Steward: missing data must be collected or waived before the workflow advances.',
  });
}

function buildValueAtStakeSummarizer(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const label = valueLabel(input);
  return withBriefingPatch(base, {
    primaryFinding: `${formatUsd(valueAtStake(input))} ${label} value at stake. Evidence citations available: ${input.contextBundle.evidenceCitations.length}.`,
    confidence: 'medium',
    cannotProceedReasons: label === 'realized' ? [] : ['Atlas cannot label value as realized without measurement evidence.'],
    handoffRecommendation: 'Atlas to Nexus: value framing needs operational follow-up in the sourcing workflow.',
  });
}

function buildExecutiveDecisionBriefWriter(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const eventName = input.contextBundle.sourcingEvent?.name ?? 'Source event';
  const stage = input.contextBundle.workflowStage?.label ?? 'current stage';
  const label = valueLabel(input);
  return withBriefingPatch(base, {
    primaryFinding: `Decision: ${eventName} vs no-action baseline - turning on ${stage}. Value at stake: ${formatUsd(valueAtStake(input))} ${label}.`,
    summary: `${eventName} needs an executive decision on ${stage}. Value is ${label} and must stay bounded by evidence. Missing inputs must be resolved before Atlas can write realized-value language.`,
    confidence: 'medium',
    cannotProceedReasons: input.contextBundle.missingInputs,
    handoffRecommendation: 'Atlas to Nexus: convert the executive brief into the next operational action.',
  });
}

function buildWorkflowBlockerDetector(
  input: SourceAgentBriefingInput,
  base: SourceAgentBriefing,
): SourceAgentBriefing {
  const workflow = input.workflowValidationReport;
  const primaryFinding = workflow?.failedExpectations.length
    ? 'Workflow validation has failed expectations; review should stop.'
    : workflow?.blockerExplanations.length || workflow?.intentionalDefers.length || input.contextBundle.blockers.length
      ? 'Workflow gates contain blockers that must remain enforced.'
      : 'No workflow blocker was found in the provided deterministic context.';
  return withBriefingPatch(base, {
    primaryFinding,
    confidence: workflow ? 'high' : 'medium',
    cannotProceedReasons: base.cannotProceedReasons,
    handoffRecommendation: 'Steward to Nexus: workflow action is blocked or deferred; Nexus should guide the unblock path, not bypass the gate.',
  });
}

function synthesiseSummary(
  ranked: SpecialistContribution[],
  overallReadiness: SourceMultiAgentOverallReadiness,
): string {
  const parts: string[] = [];

  const lead = ranked[0];
  if (lead) {
    parts.push(lead.contribution.primaryFinding);
  }

  if (overallReadiness === 'blocked') {
    const blockerContrib = ranked.find(
      (c) => c.contribution.blockers.length > 0,
    );
    if (blockerContrib && blockerContrib !== lead) {
      parts.push(blockerContrib.contribution.primaryFinding);
    }
  }

  if (overallReadiness === 'lowContext') {
    parts.push(
      'Context confidence is below decision-grade; validate missing inputs before advancing.',
    );
  }

  const raw = parts.filter(Boolean).join(' ');
  const words = raw.trim().split(/\s+/);
  return words.length > SOURCE_SENTINEL_WORD_CAP
    ? `${words.slice(0, SOURCE_SENTINEL_WORD_CAP).join(' ')}…`
    : raw;
}

function composePrimaryVoice(
  ranked: SpecialistContribution[],
  multiAgentBriefing: ReturnType<typeof buildSourceMultiAgentBriefing>,
): SourceAgentBriefing {
  const lead = ranked[0]?.contribution ?? multiAgentBriefing.sentinel;
  const summary = synthesiseSummary(ranked, multiAgentBriefing.overallReadiness);
  const primaryFinding = lead.primaryFinding;

  const allEvidenceNotes = ranked.flatMap((c) => c.contribution.evidenceNotes);
  const allValidationNotes = ranked.flatMap((c) => c.contribution.validationNotes);
  const allCannotProceed = ranked.flatMap((c) => c.contribution.cannotProceedReasons);

  const driftCheck = isSentinelVoiceDoctrineEnabled()
    ? checkSentinelVoice(summary, { maxWords: SOURCE_SENTINEL_WORD_CAP })
    : null;

  const driftNotes = driftCheck && !driftCheck.pass
    ? driftCheck.violations.map(
        (v) => `[voice-drift:${v.category}] ${v.phrase}`,
      )
    : [];

  return {
    agentName: 'sentinel',
    title: 'Sentinel sourcing read',
    summary,
    primaryFinding,
    confidence: lead.confidence,
    contextUsed: multiAgentBriefing.sentinel.contextUsed,
    risks: ranked.flatMap((c) => c.contribution.risks).slice(0, 5),
    blockers: multiAgentBriefing.blockers,
    missingInputs: multiAgentBriefing.sentinel.missingInputs,
    recommendedNextAction: lead.recommendedNextAction,
    suggestedActions: lead.suggestedActions,
    evidenceNotes: [...new Set([...allEvidenceNotes, ...driftNotes])],
    validationNotes: [...new Set(allValidationNotes)],
    cannotProceedReasons: [...new Set(allCannotProceed)],
    handoffRecommendation: lead.handoffRecommendation,
    generatedAt: multiAgentBriefing.generatedAt,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function buildSentinelSourceBriefing(
  input: SourceAgentBriefingInput,
): SentinelSourceBriefing {
  const multi = buildSourceMultiAgentBriefing(input);

  const specialistContributions: SpecialistContribution[] = [
    {
      specialistId: 'context-validation-checker',
      specialistFlavor: 'sentinel',
      missionType: 'validation_defer',
      contribution: buildContextValidationChecker(input, multi.sentinel),
    },
    {
      specialistId: 'evidence-gap-detector',
      specialistFlavor: 'sentinel',
      missionType: 'evidence_gap',
      contribution: buildEvidenceGapDetector(input, multi.sentinel),
    },
    {
      specialistId: 'next-action-recommender',
      specialistFlavor: 'nexus',
      missionType: 'next_action',
      contribution: buildNextActionRecommender(input, multi.nexus),
    },
    {
      specialistId: 'minimum-data-request-generator',
      specialistFlavor: 'nexus',
      missionType: 'data_readiness',
      contribution: buildMinimumDataRequestGenerator(input, multi.nexus),
    },
    {
      specialistId: 'value-at-stake-summarizer',
      specialistFlavor: 'atlas',
      missionType: 'value_risk',
      contribution: buildValueAtStakeSummarizer(input, multi.atlas),
    },
    {
      specialistId: 'executive-decision-brief-writer',
      specialistFlavor: 'atlas',
      missionType: 'executive_brief',
      contribution: buildExecutiveDecisionBriefWriter(input, multi.atlas),
    },
    {
      specialistId: 'workflow-blocker-detector',
      specialistFlavor: 'steward',
      missionType: 'workflow_blocker',
      contribution: buildWorkflowBlockerDetector(input, multi.steward),
    },
  ];

  const ranked = rankSpecialists(specialistContributions);
  const primaryVoice = composePrimaryVoice(ranked, multi);

  return {
    eventId: multi.eventId,
    contextScope: multi.contextScope,
    generatedAt: multi.generatedAt,
    primaryVoice,
    specialistContributions: ranked,
    combinedSummary: primaryVoice.summary,
    highestPriorityAction: multi.highestPriorityAction,
    overallReadiness: multi.overallReadiness,
    blockers: multi.blockers,
    defers: multi.defers,
    recommendedNextSlice: multi.recommendedNextSlice,
    functionGrounding: input.contextBundle.functionGrounding,
  };
}

// ── Back-compat adapter ──────────────────────────────────────────────────────
//
// Temporary shim for consumers not yet migrated to SentinelSourceBriefing.
// Each consumer using this adapter should migrate within this wave.

export function adaptSentinelBriefingToMultiAgent(
  brief: SentinelSourceBriefing,
): ReturnType<typeof buildSourceMultiAgentBriefing> {
  const nexusContrib = brief.specialistContributions.find(
    (c) => c.specialistFlavor === 'nexus',
  )?.contribution ?? brief.primaryVoice;
  const sentinelContrib = brief.specialistContributions.find(
    (c) => c.specialistFlavor === 'sentinel',
  )?.contribution ?? brief.primaryVoice;
  const atlasContrib = brief.specialistContributions.find(
    (c) => c.specialistFlavor === 'atlas',
  )?.contribution ?? brief.primaryVoice;
  const stewardContrib = brief.specialistContributions.find(
    (c) => c.specialistFlavor === 'steward',
  )?.contribution ?? brief.primaryVoice;

  return {
    eventId: brief.eventId,
    contextScope: brief.contextScope,
    generatedAt: brief.generatedAt,
    nexus: nexusContrib,
    sentinel: sentinelContrib,
    atlas: atlasContrib,
    steward: stewardContrib,
    combinedSummary: brief.combinedSummary,
    highestPriorityAction: brief.highestPriorityAction,
    overallReadiness: brief.overallReadiness,
    blockers: brief.blockers,
    defers: brief.defers,
    recommendedNextSlice: brief.recommendedNextSlice,
    functionGrounding: brief.functionGrounding,
  };
}
