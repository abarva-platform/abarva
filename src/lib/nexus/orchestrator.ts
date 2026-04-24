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
import { loadSessionContext, renderSessionContextBlock, type SessionContext } from './sessionContext';
import { adaptToContextBundle } from './context-adapter';
import type {
  ContextBundle,
  ContextBundleQualityScore,
  ContextBundleResponseGate,
  ContextBundleState,
  ContextBundleSummary,
} from '@/lib/agent/context-bundle';
import type {
  NexusFormat,
  NexusMode,
  NexusTurnData,
  TenancyCtx,
} from '@/lib/intelligence/types';

export interface GateSignal {
  type: 'gate_approval' | 'phase_transition' | 'charter_generation';
  fromPhase?: number;
  toPhase?: number;
  payload?: Record<string, unknown>;
}

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
  /**
   * When true, loads SessionContext (user + tenant + recent engagements +
   * VIP profile) and injects it into the composer system prompt. Defaults
   * to true for intelligent personalization; disable only for synthetic /
   * test runs where you want deterministic output.
   */
  includeSessionContext?: boolean;
  onProgress?: (p: OrchestratorProgress) => void;
  onTextDelta?: (text: string) => void;
  onGateSignal?: (signal: GateSignal) => void;
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
  session?: SessionContext;
  gateSignals: GateSignal[];

  // S4 · Context Bundle adapter metadata. Optional and additive: these
  // fields surface the platform Context Bundle / scoring / response gate
  // for observability but do not change prompt content, payload, or
  // visible UI. Absence is normal when the adapter could not run.
  contextBundle?: ContextBundle;
  contextBundleSummary?: ContextBundleSummary;
  contextBundleGate?: ContextBundleResponseGate;
  contextBundleScore?: ContextBundleQualityScore;
  contextBundleState?: ContextBundleState;
}

// S4 · Run the Context Bundle adapter without letting any failure surface
// to the pipeline. The adapter is a pure function but we still defend
// against future extensions throwing.
function runContextAdapterSafely(args: {
  pipelineInput: OrchestratorInput;
  compositionBundle?: CompositionBundle | null;
  session?: SessionContext | null;
  isClarifying?: boolean;
}):
  | {
      contextBundle: ContextBundle;
      contextBundleSummary: ContextBundleSummary;
      contextBundleGate: ContextBundleResponseGate;
      contextBundleScore: ContextBundleQualityScore;
      contextBundleState: ContextBundleState;
    }
  | undefined {
  try {
    const result = adaptToContextBundle({
      pipelineInput: args.pipelineInput,
      compositionBundle: args.compositionBundle ?? null,
      session: args.session ?? null,
      isClarifying: args.isClarifying ?? false,
    });
    return {
      contextBundle: result.bundle,
      contextBundleSummary: result.summary,
      contextBundleGate: result.responseGate,
      contextBundleScore: result.qualityScore,
      contextBundleState: result.state,
    };
  } catch {
    return undefined;
  }
}

const HARD_CAP_MS = 15_000;

// Tags emitted by the model that signal phase-gate lifecycle actions.
// The voiceFilter strips these from user-visible text; we separately
// parse them here to drive phase transitions.
const GATE_TAG_PATTERNS: Array<{ tag: string; signal: GateSignal['type'] }> = [
  { tag: 'gate_approval', signal: 'gate_approval' },
  { tag: 'phase_transition', signal: 'phase_transition' },
  { tag: 'charter_generation', signal: 'charter_generation' },
];

function parseGateSignals(raw: string): GateSignal[] {
  const out: GateSignal[] = [];
  for (const { tag, signal } of GATE_TAG_PATTERNS) {
    const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(raw)) !== null) {
      const inner = match[1].trim();
      let payload: Record<string, unknown> = {};
      try { payload = JSON.parse(inner); } catch { /* keep empty */ }
      out.push({
        type: signal,
        fromPhase: typeof payload.from_phase === 'number' ? payload.from_phase : undefined,
        toPhase: typeof payload.to_phase === 'number' ? payload.to_phase : undefined,
        payload,
      });
    }
  }
  return out;
}

export async function runPipeline(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const started = Date.now();
  const progress = (p: OrchestratorProgress) => input.onProgress?.(p);

  // Session context (Fix 6) · loaded in parallel with Phase 1 parse
  const sessionPromise: Promise<SessionContext | undefined> =
    input.includeSessionContext !== false
      ? loadSessionContext(input.tenancy).catch(() => undefined)
      : Promise.resolve(undefined);

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
    const clarifyingShellBundle: CompositionBundle = {
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
    };
    const clarifyingAdapter = runContextAdapterSafely({
      pipelineInput: input,
      compositionBundle: clarifyingShellBundle,
      isClarifying: true,
    });
    return {
      mode: modeResult.mode,
      format: 'clarification',
      payload: {
        format: 'clarification',
        question: clarifying.question,
        options: clarifying.options,
      },
      bundle: clarifyingShellBundle,
      latencyMs: { parse: parseMs, plan: 0, retrieve: 0, assemble: 0, compose: 0, total: Date.now() - started },
      strippedCount: 0,
      clarifying,
      gateSignals: [],
      ...clarifyingAdapter,
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
    const idkAdapter = runContextAdapterSafely({
      pipelineInput: input,
      compositionBundle: bundle,
    });
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
      gateSignals: [],
      ...idkAdapter,
    };
  }

  // Session context · await before composition so the prompt carries it
  const session = await sessionPromise;

  // ── Phase 5 · compose ───────────────────────────────────────────────
  const t5 = Date.now();
  progress({ phase: 'compose', status: 'start' });
  const composed = await compose({
    bundle,
    format,
    capability: input.capability,
    sessionContextBlock: session ? renderSessionContextBlock(session) : undefined,
    onTextDelta: input.onTextDelta,
  });
  const composeMs = Date.now() - t5;
  progress({ phase: 'compose', status: 'complete', latencyMs: composeMs });

  // Parse gate signals from the raw LLM output and surface them. The
  // voiceFilter has already stripped the tags from the user-facing payload,
  // so the only place signals survive is composed.rawText.
  const gateSignals = parseGateSignals(composed.rawText);
  for (const sig of gateSignals) input.onGateSignal?.(sig);

  // ── Phase 6 · render (payload is ready) ─────────────────────────────
  progress({ phase: 'render', status: 'complete' });

  const finalAdapter = runContextAdapterSafely({
    pipelineInput: input,
    compositionBundle: bundle,
    session,
  });

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
    session,
    gateSignals,
    ...finalAdapter,
  };
}
