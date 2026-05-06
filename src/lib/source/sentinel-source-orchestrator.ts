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
      contribution: multi.sentinel,
    },
    {
      specialistId: 'evidence-gap-detector',
      specialistFlavor: 'sentinel',
      missionType: 'evidence_gap',
      contribution: multi.sentinel,
    },
    {
      specialistId: 'next-action-recommender',
      specialistFlavor: 'nexus',
      missionType: 'next_action',
      contribution: multi.nexus,
    },
    {
      specialistId: 'minimum-data-request-generator',
      specialistFlavor: 'nexus',
      missionType: 'data_readiness',
      contribution: multi.nexus,
    },
    {
      specialistId: 'value-at-stake-summarizer',
      specialistFlavor: 'atlas',
      missionType: 'value_risk',
      contribution: multi.atlas,
    },
    {
      specialistId: 'executive-decision-brief-writer',
      specialistFlavor: 'atlas',
      missionType: 'executive_brief',
      contribution: multi.atlas,
    },
    {
      specialistId: 'workflow-blocker-detector',
      specialistFlavor: 'steward',
      missionType: 'workflow_blocker',
      contribution: multi.steward,
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
  };
}
