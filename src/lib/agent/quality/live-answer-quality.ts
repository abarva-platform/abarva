import {
  assertEvidenceLedgerReady,
  composeEvidenceLedger,
  type ComposeEvidenceLedgerInput,
  type EvidenceLedger,
} from '../evidence-ledger/composer';
import {
  answerPrefixForReadiness,
  scoreReadiness,
  type ReadinessAssessment,
  type ScoreReadinessInput,
} from '../readiness-score/scorer';
import {
  gate as runComprehensionGate,
  type ComprehensionGateResult,
} from '../comprehension-gate/lint';

export const LIVE_AGENT_ANSWER_QUALITY_GATE_IDS = [
  'evidence-ledger',
  'readiness-score',
  'comprehension-gate',
] as const;

export const LIVE_AGENT_ANSWER_QUALITY_WIRING_TARGETS = [
  {
    agent: 'nexus',
    routePath: 'src/app/api/v1/nexus/query/route.ts',
    compositionPath: 'src/lib/nexus/orchestrator.ts',
    compositionFunction: 'runPipeline',
    answerFunction: 'compose',
  },
  {
    agent: 'sentinel',
    routePath: 'src/app/api/v1/sentinel/query/route.ts',
    compositionPath: 'src/lib/sentinel/orchestrator.ts',
    compositionFunction: 'runSentinelTurn',
    answerFunction: 'synthesizeWithClaude',
  },
  {
    agent: 'source',
    routePath: 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts',
    compositionPath: 'src/lib/source/nexus-api.ts',
    compositionFunction: 'createSourceNexusApiStubResponse',
    answerFunction: 'buildSourceAnswerEngine',
  },
  {
    agent: 'steward',
    routePath: 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts',
    compositionPath: 'src/lib/source/multi-agent-briefing.ts',
    compositionFunction: 'buildStewardBriefing',
    answerFunction: 'buildStewardBriefing',
  },
] as const;

export type LiveAgentAnswerQualityGateId =
  typeof LIVE_AGENT_ANSWER_QUALITY_GATE_IDS[number];

export interface LiveAgentAnswerQualityInput {
  answerText: string;
  tenantKey: string;
  evidenceLedger: ComposeEvidenceLedgerInput;
  readiness: ScoreReadinessInput;
}

export interface LiveAgentAnswerQualityBlock {
  gate: LiveAgentAnswerQualityGateId;
  reason: string;
}

export interface LiveAgentAnswerQualityResult {
  renderable: boolean;
  answerText: string;
  evidenceLedger: EvidenceLedger;
  evidenceLedgerCheck: ReturnType<typeof assertEvidenceLedgerReady>;
  readiness: ReadinessAssessment;
  readinessPrefix: string | null;
  comprehension: ComprehensionGateResult;
  blocks: LiveAgentAnswerQualityBlock[];
}

export function evaluateLiveAgentAnswerQuality(
  input: LiveAgentAnswerQualityInput,
): LiveAgentAnswerQualityResult {
  const evidenceLedger = composeEvidenceLedger(input.evidenceLedger);
  const evidenceLedgerCheck = assertEvidenceLedgerReady(evidenceLedger);
  const readiness = scoreReadiness(input.readiness);
  const readinessPrefix = answerPrefixForReadiness(readiness);
  const comprehension = runComprehensionGate(input.answerText, {
    tenantKey: input.tenantKey,
  });
  const blocks: LiveAgentAnswerQualityBlock[] = [];

  if (!evidenceLedgerCheck.passed) {
    for (const reason of evidenceLedgerCheck.reasons) {
      blocks.push({ gate: 'evidence-ledger', reason });
    }
  }

  if (readiness.readinessVerdict === 'insufficient') {
    blocks.push({
      gate: 'readiness-score',
      reason: readiness.recommendedAction,
    });
  }

  if (comprehension.blocked) {
    blocks.push({
      gate: 'comprehension-gate',
      reason: comprehension.blockReason ?? 'Answer failed comprehension gate.',
    });
  }

  const answerText = [readinessPrefix, comprehension.cleaned]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');

  return {
    renderable: blocks.length === 0,
    answerText,
    evidenceLedger,
    evidenceLedgerCheck,
    readiness,
    readinessPrefix,
    comprehension,
    blocks,
  };
}
