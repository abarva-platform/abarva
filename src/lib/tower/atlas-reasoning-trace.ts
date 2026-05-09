import type {
  AtlasReasoningTraceInput,
  AtlasReasoningTraceObservation,
} from '@/lib/atlas/repository';
import { ATLAS_PROMPT_VERSION } from '@/lib/atlas/prompt';
import type { AtlasInterpretation, AtlasReasoningInput } from '@/lib/tower/atlas-interpretation-view';
import type { AtlasPatternId } from '@/lib/tower/atlas-pattern-selectors';

export const ATLAS_TRAINING_PACKAGE_VERSION = 'v1.0.0';
export const ATLAS_REASONING_MODEL = 'deterministic-atlas-v1';

const ALL_PATTERNS: ReadonlyArray<AtlasPatternId> = [
  'pattern_01_top_pressure',
  'pattern_02_shared_root',
  'pattern_03_defend_while_resolving',
  'pattern_04_vendor_clock',
  'pattern_05_look_ahead',
  'pattern_06_healthy_posture',
];

function bandConfidenceFloor(input: AtlasReasoningInput): 'high' | 'med' | 'low' | 'none' {
  const values = input.bandMetrics.metrics.map((metric) => metric.confidence);
  if (values.includes('low')) return 'low';
  if (values.includes('med')) return 'med';
  if (values.includes('none')) return 'none';
  return 'high';
}

function skippedPatterns(fired: ReadonlyArray<AtlasPatternId>): ReadonlyArray<{ pattern: AtlasPatternId; reason: string }> {
  const firedSet = new Set(fired);
  return ALL_PATTERNS
    .filter((pattern) => !firedSet.has(pattern))
    .map((pattern) => ({
      pattern,
      reason: 'Trigger not satisfied by current Tower substrate shape.',
    }));
}

function observationsForTrace(interpretation: AtlasInterpretation): ReadonlyArray<AtlasReasoningTraceObservation> {
  return interpretation.observations.map((observation) => ({
    number: observation.number,
    topic: observation.topic,
    body: observation.body,
    confidenceFloor: observation.confidenceFloor,
    citationsCount: observation.citations.length,
    actionsCount: observation.actions.length,
  }));
}

export function buildTowerRightRailReasoningTrace(input: {
  ctx: { clientId: string; userId?: string | null };
  reasoningInput: AtlasReasoningInput;
  interpretation: AtlasInterpretation;
  fallbackUsed: boolean;
  fallbackReason?: string | null;
  latencyMs?: number | null;
}): AtlasReasoningTraceInput {
  return {
    threadId: null,
    tenantId: input.ctx.clientId,
    userId: input.ctx.userId ?? null,
    trigger: 'tower_right_rail_render',
    inputSummary: {
      initiativesCount: input.reasoningInput.initiatives.length,
      vendorsCount: input.reasoningInput.vendors.length,
      pressuresCount: input.reasoningInput.pressuresView.cards.length,
      bandConfidenceFloor: bandConfidenceFloor(input.reasoningInput),
      lens: input.reasoningInput.lens,
      todayIso: input.reasoningInput.todayIso,
    },
    patternsFired: input.interpretation.patternsFired,
    patternsSkipped: skippedPatterns(input.interpretation.patternsFired),
    observations: observationsForTrace(input.interpretation),
    ifYouOnlyDoOneToday: input.interpretation.ifYouOnlyDoOneToday,
    citations: input.interpretation.citations,
    interpretationConfidence: input.interpretation.interpretationConfidence,
    fallbackUsed: input.fallbackUsed,
    fallbackReason: input.fallbackReason ?? null,
    latencyMs: input.latencyMs ?? null,
    model: ATLAS_REASONING_MODEL,
    promptVersion: ATLAS_PROMPT_VERSION,
    packageVersion: ATLAS_TRAINING_PACKAGE_VERSION,
  };
}
