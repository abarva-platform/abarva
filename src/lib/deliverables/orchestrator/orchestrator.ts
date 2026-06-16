// Deliverable Intelligence Orchestrator — the multi-pass driver.
//
// Sequences: resolve brief → architect (plan) → validate plan → evidence grounding →
// full draft → red-team critique → board-grade rewrite → render package → quality gate.
//
// The model is injected as a `ModelCaller` so the loop is testable with a stub and
// PR-3 can plug in the audited Anthropic egress unchanged. High-stakes deliverables
// are never run in a single cramped call — each pass is its own prompt with a
// generous token budget.

import type {
  DeliverableArtifactBrief,
  DeliverableGenerationPlan,
  DeliverableIntelligenceRequest,
  GenerationPass,
  PassPrompt,
  PlanValidationResult,
  QualityValidationResult,
  RenderableDeliverable,
} from './types';
import { getArtifactBrief } from './artifact-brief-registry';
import { buildGenerationProgress, type GenerationProgress } from './progress';
import { buildPassPrompt } from './prompt-builder';
import { validateGenerationPlan } from './generation-plan';
import { validateDeliverableQuality } from './quality-validator';

export interface ModelCallResult {
  text: string;
  responseId?: string;
}

/** Injected model call. PR-3 backs this with getAuditedAnthropicClient. */
export type ModelCaller = (
  prompt: PassPrompt,
  req: DeliverableIntelligenceRequest,
) => Promise<ModelCallResult>;

export interface PassTraceEntry {
  pass: GenerationPass;
  maxTokens: number;
  highStakes: boolean;
  outputChars: number;
  responseId?: string;
  parsedOk?: boolean;
}

export interface OrchestrationResult {
  ok: boolean;
  brief: DeliverableArtifactBrief;
  plan?: DeliverableGenerationPlan;
  planValidation?: PlanValidationResult;
  draftMarkdown?: string;
  critique?: string;
  revisedMarkdown?: string;
  document?: RenderableDeliverable;
  quality?: QualityValidationResult;
  passTrace: PassTraceEntry[];
  blockedReason?: string;
}

/** Pull the first JSON object/array out of a model response (handles ``` fences). */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  // find the matching close by scanning bracket depth (string-aware)
  const open = candidate[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function call(
  modelCall: ModelCaller,
  prompt: PassPrompt,
  req: DeliverableIntelligenceRequest,
  trace: PassTraceEntry[],
  onProgress?: (p: GenerationProgress) => void,
): Promise<ModelCallResult> {
  const res = await modelCall(prompt, req);
  trace.push({
    pass: prompt.pass,
    maxTokens: prompt.maxTokens,
    highStakes: prompt.highStakes,
    outputChars: res.text.length,
    responseId: res.responseId,
  });
  // Emit a progress event for the pass that just completed (trace.length is the
  // 1-based count of completed passes). The callback persists it to the run
  // ledger so the UI can show a live percent band during generation.
  onProgress?.(buildGenerationProgress(prompt.pass, trace.length));
  return res;
}

export interface OrchestrationOptions {
  /** if true (default), a failed plan validation blocks the run; else it warns and proceeds. */
  enforcePlanGate?: boolean;
  /** if true (default), quality blockers mark the result not-ok (export should be refused). */
  enforceQualityGate?: boolean;
  /** invoked after each pass completes, with a human-facing {pct,label} for the run ledger / UI band. */
  onProgress?: (p: GenerationProgress) => void;
}

export async function runDeliverableOrchestration(
  req: DeliverableIntelligenceRequest,
  modelCall: ModelCaller,
  opts: OrchestrationOptions = {},
): Promise<OrchestrationResult> {
  const enforcePlanGate = opts.enforcePlanGate ?? true;
  const enforceQualityGate = opts.enforceQualityGate ?? true;

  const brief = getArtifactBrief(req);
  const evidence = req.governedEvidenceBundle;
  const trace: PassTraceEntry[] = [];

  // Pass 1 — architect
  const architectRes = await call(modelCall, buildPassPrompt('architect', { req, brief, evidence }), req, trace, opts.onProgress);
  const plan = extractJson<DeliverableGenerationPlan>(architectRes.text);
  trace[trace.length - 1].parsedOk = !!plan;
  if (!plan) {
    return { ok: false, brief, passTrace: trace, blockedReason: 'architect pass did not return a parseable generation plan' };
  }
  const planValidation = validateGenerationPlan(plan, req, brief);
  if (!planValidation.ok && enforcePlanGate) {
    return { ok: false, brief, plan, planValidation, passTrace: trace, blockedReason: `plan failed validation: ${planValidation.errors.join('; ')}` };
  }
  const approvedPlanJson = JSON.stringify(plan);

  // Pass 2 — evidence grounding (refines mapping; output threaded as context only)
  await call(modelCall, buildPassPrompt('evidence_grounding', { req, brief, evidence, approvedPlanJson }), req, trace, opts.onProgress);

  // Pass 3 — full draft
  const draftRes = await call(modelCall, buildPassPrompt('full_draft', { req, brief, evidence, approvedPlanJson }), req, trace, opts.onProgress);
  const draftMarkdown = draftRes.text;

  // Pass 4 — red-team
  const critiqueRes = await call(modelCall, buildPassPrompt('red_team', { req, brief, evidence, draftMarkdown }), req, trace, opts.onProgress);
  const critique = critiqueRes.text;

  // Pass 5 — board-grade rewrite
  const rewriteRes = await call(modelCall, buildPassPrompt('board_grade_rewrite', { req, brief, evidence, draftMarkdown, critiqueText: critique }), req, trace, opts.onProgress);
  const revisedMarkdown = rewriteRes.text;

  // Pass 6 — render package
  const renderRes = await call(modelCall, buildPassPrompt('render_package', { req, brief, evidence, revisedDraftMarkdown: revisedMarkdown }), req, trace, opts.onProgress);
  const document = extractJson<RenderableDeliverable>(renderRes.text);
  trace[trace.length - 1].parsedOk = !!document;
  if (!document) {
    return { ok: false, brief, plan, planValidation, draftMarkdown, critique, revisedMarkdown, passTrace: trace, blockedReason: 'render pass did not return a parseable render package' };
  }

  // Quality gate
  const quality = validateDeliverableQuality(document, req);
  const ok = enforceQualityGate ? quality.pass : true;
  return {
    ok,
    brief,
    plan,
    planValidation,
    draftMarkdown,
    critique,
    revisedMarkdown,
    document,
    quality,
    passTrace: trace,
    blockedReason: ok ? undefined : `quality gate blocked export: ${quality.blockers.join('; ')}`,
  };
}
