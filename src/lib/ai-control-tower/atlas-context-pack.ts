import {
  AI_CONTROL_TOWER_METRIC_DICTIONARY,
  classifyAiControlTowerIntent,
  lensForAiControlIntent,
  type AiControlTowerContextFact,
  type AiControlTowerContextPack,
  type AiControlTowerEvidenceStatus,
  type AiControlTowerLens,
  type AiControlTowerQuestionIntent,
  type AiControlTowerSurfaceContext,
  type AiControlTowerStructuredAnswer,
} from './contracts';

export interface BuildAiControlTowerContextPackInput {
  clientId: string;
  question: string;
  refreshRunId?: string | null;
  snapshotMonth?: string | null;
  surfaceContext?: AiControlTowerSurfaceContext;
  facts?: AiControlTowerContextFact[];
}

function evidenceStatusToGuardrail(status: AiControlTowerEvidenceStatus): boolean {
  return status === 'missing' || status === 'review_required';
}

function relevantMetricIdsForIntent(intent: AiControlTowerQuestionIntent): Set<string> {
  return new Set(
    AI_CONTROL_TOWER_METRIC_DICTIONARY
      .filter((metric) => metric.commonQuestionIntents.includes(intent))
      .map((metric) => metric.metricId),
  );
}

export function buildAiControlTowerContextPack(
  input: BuildAiControlTowerContextPackInput,
): AiControlTowerContextPack {
  const intent = classifyAiControlTowerIntent(input.question);
  const activeLens = input.surfaceContext?.activeLens ?? lensForAiControlIntent(intent);
  const selectedMetricIds = new Set(input.surfaceContext?.selectedMetricIds ?? []);
  const intentMetricIds = relevantMetricIdsForIntent(intent);
  const metricDictionary = AI_CONTROL_TOWER_METRIC_DICTIONARY.filter(
    (metric) =>
      metric.defaultLens === activeLens ||
      metric.commonQuestionIntents.includes(intent) ||
      selectedMetricIds.has(metric.metricId),
  );

  const facts = (input.facts ?? []).filter((fact) => {
    if (fact.clientId !== input.clientId) return false;
    if (input.refreshRunId && fact.refreshRunId !== input.refreshRunId) return false;
    if (fact.recordType === 'derived_enterprise_read' || fact.recordType === 'derived_enterprise_insight') return true;
    if (selectedMetricIds.has(fact.factKey) || intentMetricIds.has(fact.factKey)) return true;
    return metricDictionary.some((metric) => metric.metricId === fact.factKey);
  });

  const missingInputs = metricDictionary
    .filter((metric) => metric.evidenceRequired && !facts.some((fact) => fact.factKey === metric.metricId))
    .map((metric) => metric.metricId);
  const reviewRequiredFactIds = facts
    .filter((fact) => evidenceStatusToGuardrail(fact.evidenceStatus))
    .map((fact) => fact.factId);

  return {
    packVersion: 'ai-control-tower-context-v1',
    clientId: input.clientId,
    refreshRunId: input.refreshRunId ?? null,
    snapshotMonth: input.snapshotMonth ?? input.surfaceContext?.snapshotMonth ?? null,
    activeLens,
    intent,
    question: input.question,
    metricDictionary,
    facts,
    guardrails: {
      canClaimRealizedValue: reviewRequiredFactIds.length === 0 && !missingInputs.includes('benefit_realization_usd'),
      missingInputs,
      staleSources: [],
      reviewRequiredFactIds,
    },
  };
}

function chooseVerdict(pack: AiControlTowerContextPack): AiControlTowerStructuredAnswer['summary']['verdict'] {
  if (pack.guardrails.missingInputs.length > 0) return 'insufficient_evidence';
  if (pack.intent === 'steering_actions') return 'review';
  if (pack.intent === 'spend_to_value' || pack.intent === 'agent_outcome') return 'prove';
  if (pack.intent === 'scale_or_hold') return 'hold';
  return 'review';
}

function choiceTargetsForLens(lens: AiControlTowerLens): AiControlTowerStructuredAnswer['choices'] {
  if (lens === 'actions') {
    return [
      { label: 'Open spend impact', action: 'set_lens', target: 'spend' },
      { label: 'Check evidence', action: 'set_lens', target: 'evidence' },
      { label: 'Open risk gates', action: 'set_lens', target: 'risk' },
    ];
  }
  if (lens === 'agents') {
    return [
      { label: 'Show spend posture', action: 'set_lens', target: 'spend' },
      { label: 'Open evidence', action: 'set_lens', target: 'evidence' },
      { label: 'Prepare actions', action: 'set_lens', target: 'actions' },
    ];
  }
  return [
    { label: 'Open actions', action: 'set_lens', target: 'actions' },
    { label: 'Open evidence', action: 'set_lens', target: 'evidence' },
    { label: 'Ask follow-up', action: 'ask_followup', target: packFollowupTarget(lens) },
  ];
}

function packFollowupTarget(lens: AiControlTowerLens): string {
  switch (lens) {
    case 'spend':
      return 'Which spend should the CFO challenge?';
    case 'productivity':
      return 'Which productivity gains are supported by quality counterweights?';
    case 'risk':
      return 'Which risks block scale claims?';
    default:
      return 'What should go to steering?';
  }
}

export function buildStructuredAnswerFromContextPack(
  pack: AiControlTowerContextPack,
): AiControlTowerStructuredAnswer {
  const topFacts = pack.facts.slice(0, 5);
  return {
    answerVersion: 'ai-control-tower-v1',
    clientId: pack.clientId,
    snapshotId: pack.refreshRunId,
    snapshotMonth: pack.snapshotMonth,
    activeLens: pack.activeLens,
    intent: pack.intent,
    summary: {
      headline:
        topFacts[0]?.factText ??
        'Atlas needs committed, evidence-linked Tower rows before making a strong claim.',
      verdict: chooseVerdict(pack),
      confidence: pack.guardrails.reviewRequiredFactIds.length > 0 ? 'low' : topFacts.length > 0 ? 'medium' : 'low',
      disclosure:
        pack.guardrails.missingInputs.length > 0
          ? `Missing inputs: ${pack.guardrails.missingInputs.join(', ')}`
          : null,
    },
    table:
      topFacts.length > 0
        ? {
            columns: [
              { key: 'metric', label: 'Metric', type: 'text' },
              { key: 'read', label: 'Read', type: 'text' },
              { key: 'evidence', label: 'Evidence', type: 'status' },
            ],
            rows: topFacts.map((fact) => ({
              metric: fact.factKey,
              read: fact.factText,
              evidence: fact.evidenceStatus,
            })),
          }
        : undefined,
    choices: choiceTargetsForLens(pack.activeLens),
    citations: topFacts.flatMap((fact) =>
      fact.evidenceIds.map((evidenceId) => ({
        evidenceId,
        sourceSystem: 'ai_control_tower',
        sourceLabel: fact.recordKey,
        sourceRef: `${fact.recordType}:${fact.recordKey}`,
        confidence: fact.confidence && fact.confidence >= 0.8 ? 'high' : fact.confidence && fact.confidence >= 0.5 ? 'medium' : 'low',
      })),
    ),
    dashboardPatch: {
      setLens: pack.activeLens,
      highlightMetricIds: pack.metricDictionary.map((metric) => metric.metricId),
      highlightEntityIds: topFacts.map((fact) => fact.recordKey),
      openDrawer: pack.guardrails.reviewRequiredFactIds.length > 0 ? 'evidence' : null,
    },
    guardrails: {
      canClaimRealizedValue: pack.guardrails.canClaimRealizedValue,
      missingInputs: pack.guardrails.missingInputs,
      staleSources: pack.guardrails.staleSources,
    },
  };
}
