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
  RenderableSection,
} from "./types";
import { getArtifactBrief } from "./artifact-brief-registry";
import { buildGenerationProgress, type GenerationProgress } from "./progress";
import { buildPassPrompt } from "./prompt-builder";
import {
  sanitizeGenerationPlan,
  validateGenerationPlan,
} from "./generation-plan";
import { validateDeliverableQuality } from "./quality-validator";
import {
  mapWithConcurrency,
  extractUnsupportedFigureClaims,
  repairUncitedFigures,
  summariseSection,
  assembleDeliverable,
  type SynthesisResult,
  type UnsupportedFigureClaim,
} from "./section-generation";

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

/**
 * Scan `candidate` for the first complete JSON object/array starting at the
 * first `{`/`[` and ending at its depth-0 match. String-aware: braces inside
 * "..." string values (including nested ``` fences in board-grade bodyMarkdown)
 * do not affect depth, so the full object is recovered even when the content is
 * rich markdown. Returns the parsed value or null.
 */
function scanJson<T>(candidate: string): T | null {
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\") {
      esc = true;
      continue;
    }
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

/**
 * Pull the first JSON object/array out of a model response.
 *
 * A ```json fence is the happy path, but the fence regex is non-greedy and a
 * board-grade render package carries markdown bodyMarkdown that itself contains
 * ``` fences — so the regex slices at the FIRST nested fence and yields truncated,
 * unparseable JSON ("render pass did not return a parseable render package",
 * 2026-06-17). So: try the fenced slice first, then fall back to scanning the RAW
 * text. The raw scan is string-aware, so nested ``` fences inside string values
 * never break it and the outermost JSON object is recovered intact.
 */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? scanJson<T>(fenced[1]) : null) ?? scanJson<T>(text);
}

async function call(
  modelCall: ModelCaller,
  prompt: PassPrompt,
  req: DeliverableIntelligenceRequest,
  trace: PassTraceEntry[],
  onProgress?: (p: GenerationProgress) => void,
  expectedTotal?: number,
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
  // 1-based count of completed model calls). `expectedTotal` (architect + N
  // sections + synthesis) is known only after the plan is parsed, so the
  // architect call omits it and reports the "planning" percent. The callback
  // persists the event so the UI can show a live band during generation.
  onProgress?.(
    buildGenerationProgress(prompt.pass, trace.length, expectedTotal),
  );
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
  const architectRes = await call(
    modelCall,
    buildPassPrompt("architect", { req, brief, evidence }),
    req,
    trace,
    opts.onProgress,
  );
  const plan = extractJson<DeliverableGenerationPlan>(architectRes.text);
  trace[trace.length - 1].parsedOk = !!plan;
  if (!plan) {
    return {
      ok: false,
      brief,
      passTrace: trace,
      blockedReason:
        "architect pass did not return a parseable generation plan",
    };
  }
  // Deterministically repair the LLM's invalid citations / ungrounded sections
  // before the gate — the architect won't reliably self-constrain (it cites
  // numbers outside the bundle), and those would be broken references anyway.
  sanitizeGenerationPlan(plan, req, brief);
  const planValidation = validateGenerationPlan(plan, req, brief);
  if (!planValidation.ok && enforcePlanGate) {
    return {
      ok: false,
      brief,
      plan,
      planValidation,
      passTrace: trace,
      blockedReason: `plan failed validation: ${planValidation.errors.join("; ")}`,
    };
  }
  // ── DECOMPOSED GENERATION ──
  // One bounded-parallel call per planned section → deterministic citation-repair → a
  // synthesis call for the doc-level structured fields → assemble in code. No monolithic
  // draft/rewrite/render call, so truncation is structurally impossible and total length
  // scales with section COUNT, not a single call's output ceiling.
  const outlineSummary = plan.sectionPlan
    .map((s, i) => `${i + 1}. ${s.title} — ${s.rationale || ""}`)
    .join("\n");
  // architect (1) + one call per planned section + synthesis (1) → the band denominator.
  const expectedTotal = plan.sectionPlan.length + 2;
  const concurrency = (() => {
    const v = Number(process.env.ABARVA_DOCGEN_SECTION_CONCURRENCY);
    return Number.isFinite(v) && v > 0 ? v : 5;
  })();
  const validCitation = new Set(evidence.map((e) => e.citationNumber));
  const unsupportedFigureClaims: UnsupportedFigureClaim[] = [];
  const sections: RenderableSection[] = await mapWithConcurrency(
    plan.sectionPlan,
    concurrency,
    async (s) => {
      const assignedEvidence = evidence.filter((e) =>
        s.evidenceCitations.includes(e.citationNumber),
      );
      const res = await call(
        modelCall,
        buildPassPrompt("section_draft", {
          req,
          brief,
          evidence: assignedEvidence,
          section: s,
          outlineSummary,
        }),
        req,
        trace,
        opts.onProgress,
        expectedTotal,
      );
      const parsed = extractJson<RenderableSection>(res.text);
      const body =
        parsed && parsed.bodyMarkdown ? parsed.bodyMarkdown : res.text;
      const unsupported = extractUnsupportedFigureClaims(body);
      for (const claim of unsupported) {
        unsupportedFigureClaims.push({
          sectionKey: s.key,
          sectionTitle: (parsed && parsed.title) || s.title,
          claim,
          treatment:
            req.deliverableType === "business_case" ||
            req.deliverableType === "estimate_model" ||
            req.deliverableType === "financial_model" ||
            req.deliverableType === "value_measurement_contract"
              ? "open_input_required"
              : "assumption_to_validate",
        });
      }
      const citationsUsed = (
        parsed && Array.isArray(parsed.citationsUsed)
          ? parsed.citationsUsed
          : s.evidenceCitations
      ).filter((n) => validCitation.has(n));
      return {
        key: s.key,
        title: (parsed && parsed.title) || s.title,
        bodyMarkdown: repairUncitedFigures(body),
        // Keep what the model actually wrote, so the quality gate judges the
        // original claim rather than the repaired one — see RenderableSection.
        rawBodyMarkdown: body,
        groundingMode: s.groundingMode,
        citationsUsed,
      };
    },
  );

  // Synthesis — the doc-level structured fields the quality gate checks (recommendation,
  // risk/issues/dependencies table, client-to-complete checklist).
  const synthRes = await call(
    modelCall,
    buildPassPrompt("synthesis", {
      req,
      brief,
      evidence,
      sectionDrafts: sections.map(summariseSection),
    }),
    req,
    trace,
    opts.onProgress,
    expectedTotal,
  );
  const synth = extractJson<SynthesisResult>(synthRes.text) ?? {};
  const document: RenderableDeliverable = assembleDeliverable(
    req,
    sections,
    synth,
    evidence,
    {
      brief,
      unsupportedClaims: unsupportedFigureClaims,
    },
  );

  // Quality gate
  const quality = validateDeliverableQuality(document, req);
  const ok = enforceQualityGate ? quality.pass : true;
  return {
    ok,
    brief,
    plan,
    planValidation,
    document,
    quality,
    passTrace: trace,
    blockedReason: ok
      ? undefined
      : `quality gate blocked export: ${quality.blockers.join("; ")}`,
  };
}
