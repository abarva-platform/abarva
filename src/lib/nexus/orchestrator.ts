// Nexus orchestrator · 6-phase pipeline per spec §3.2.
// Phase 1 parse+classify · Phase 2 retrieval plan · Phase 3 parallel
// retrieval · Phase 4 assembly · Phase 5 LLM composition · Phase 6 render.
//
// Exposes runPipeline() that drives the whole turn. Emits SSE-ready
// progress events to an optional emitter callback.

import { classifyMode } from './classifiers/modeClassifier';
import { classifyFormat } from './classifiers/formatClassifier';
import { shouldClarify } from './classifiers/clarifyingTrigger';
import { runIntake } from './specialists/intake';
import { runEvidence } from './specialists/evidence';
import { runContradiction } from './specialists/contradiction';
import { runValue } from './specialists/value';
import { runDecision } from './specialists/decision';
import { assemble, type CompositionBundle } from './assembler';
import { compose } from './composer';
import type {
  NexusFormat,
  NexusMode,
  NexusTurnData,
  TenancyCtx,
} from '@/lib/intelligence/types';

export interface OrchestratorProgress {
  phase: 'parse' | 'plan' | 'retrieve' | 'assemble' | 'compose' | 'render';
  status: 'start' | 'complete' | 'clarifying' | 'error';
  latencyMs?: number;
  detail?: Record<string, unknown>;
}

export interface OrchestratorInput {
  query: string;
  tenancy: TenancyCtx;
  priorTurns?: NexusTurnData[];
  formatOverride?: NexusFormat;
  pivotHints?: {
    majorIrreversibleDecision?: boolean;
    successCriteriaMissing?: boolean;
    stakeholderCount?: number;
    dollarImpactUsd?: number;
    preloadablePhases?: number;
  };
  capability?: 'counter' | { persona: string };
  onProgress?: (p: OrchestratorProgress) => void;
  onTextDelta?: (text: string) => void;
}

export interface OrchestratorOutput {
  mode: NexusMode;
  format: NexusFormat;
  payload: Record<string, unknown>;
  bundle: CompositionBundle;
  latencyMs: {
    parse: number;
    plan: number;
    retrieve: number;
    assemble: number;
    compose: number;
    total: number;
  };
  strippedCount: number;
  clarifying?: ReturnType<typeof shouldClarify>;
}

const HARD_CAP_MS = 15_000;

export async function runPipeline(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const started = Date.now();
  const progress = (p: OrchestratorProgress) => input.onProgress?.(p);

  // ── Phase 1 · parse + classify ──────────────────────────────────────
  const t1 = Date.now();
  progress({ phase: 'parse', status: 'start' });
  const modeResult = classifyMode({
    query: input.query,
    turnCount: input.priorTurns?.length ?? 0,
    ...(input.pivotHints ?? {}),
  });
  const clarifying = shouldClarify({ query: input.query, turnCount: input.priorTurns?.length ?? 0 });
  const format = input.formatOverride ?? classifyFormat({
    query: input.query,
    mode: modeResult.mode,
    needsClarification: clarifying.fires,
    isCounterRequest: input.capability === 'counter',
  });
  const parseMs = Date.now() - t1;
  progress({ phase: 'parse', status: 'complete', latencyMs: parseMs, detail: { mode: modeResult.mode, format } });

  // Fast-path · if clarifying fires, skip retrieval and return the question directly
  if (clarifying.fires) {
    progress({ phase: 'parse', status: 'clarifying' });
    return {
      mode: modeResult.mode,
      format: 'clarification',
      payload: {
        format: 'clarification',
        question: clarifying.question,
        options: clarifying.options,
      },
      bundle: {
        mode: modeResult.mode,
        query: input.query,
        entities: [],
        evidence: [],
        valueSignals: [],
        valueHeadline: null,
        contradictions: [],
        contradictionSelfCheck: null,
        decision: { crux: null, branches: [], tiebreaker: null },
        sources: [],
        contextTokenEstimate: 0,
      },
      latencyMs: { parse: parseMs, plan: 0, retrieve: 0, assemble: 0, compose: 0, total: Date.now() - started },
      strippedCount: 0,
      clarifying,
    };
  }

  // ── Phase 2 · retrieval plan ────────────────────────────────────────
  const t2 = Date.now();
  progress({ phase: 'plan', status: 'start' });
  const intake = runIntake(input.query, modeResult.mode, input.tenancy);
  const planMs = Date.now() - t2;
  progress({ phase: 'plan', status: 'complete', latencyMs: planMs, detail: { dimensions: intake.dimensions, entities: intake.entities } });

  // ── Phase 3 · parallel retrieval ────────────────────────────────────
  const t3 = Date.now();
  progress({ phase: 'retrieve', status: 'start' });
  const evidence = await runEvidence(intake.plan);
  const retrieveMs = Date.now() - t3;
  progress({
    phase: 'retrieve',
    status: 'complete',
    latencyMs: retrieveMs,
    detail: { claims: evidence.claims.length, partial: evidence.partialDimensions },
  });

  // ── Phase 4 · assemble ──────────────────────────────────────────────
  const t4 = Date.now();
  progress({ phase: 'assemble', status: 'start' });
  const [value, decision] = await Promise.all([
    runValue(input.tenancy, evidence.claims),
    Promise.resolve(runDecision({ query: input.query, entities: intake.entities, claims: evidence.claims })),
  ]);
  const contradiction = runContradiction({
    query: input.query,
    claims: evidence.claims,
    priorTurns: input.priorTurns ?? [],
  });
  const bundle = assemble({
    mode: modeResult.mode,
    query: input.query,
    entities: intake.entities,
    evidence: evidence.claims,
    value,
    contradiction,
    decision,
  });
  const assembleMs = Date.now() - t4;
  progress({ phase: 'assemble', status: 'complete', latencyMs: assembleMs, detail: { tokenEstimate: bundle.contextTokenEstimate, sources: bundle.sources.length } });

  // Hard cap · if we've already burned 10s+ before composition, surface an idk
  const elapsed = Date.now() - started;
  if (elapsed > HARD_CAP_MS - 3000) {
    return {
      mode: modeResult.mode,
      format: 'idk',
      payload: {
        format: 'idk',
        why_dont_know: 'Pipeline exceeded latency budget before composition.',
        who_would_know: 'Retry with a narrower question · or contact Maestro.',
      },
      bundle,
      latencyMs: { parse: parseMs, plan: planMs, retrieve: retrieveMs, assemble: assembleMs, compose: 0, total: elapsed },
      strippedCount: 0,
    };
  }

  // ── Phase 5 · compose ───────────────────────────────────────────────
  const t5 = Date.now();
  progress({ phase: 'compose', status: 'start' });
  const composed = await compose({
    bundle,
    format,
    capability: input.capability,
    onTextDelta: input.onTextDelta,
  });
  const composeMs = Date.now() - t5;
  progress({ phase: 'compose', status: 'complete', latencyMs: composeMs });

  // ── Phase 6 · render (payload is ready) ─────────────────────────────
  progress({ phase: 'render', status: 'complete' });

  return {
    mode: modeResult.mode,
    format,
    payload: composed.payload,
    bundle,
    latencyMs: {
      parse: parseMs,
      plan: planMs,
      retrieve: retrieveMs,
      assemble: assembleMs,
      compose: composeMs,
      total: Date.now() - started,
    },
    strippedCount: composed.strippedCount,
  };
}
