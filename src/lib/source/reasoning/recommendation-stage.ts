// Source reasoning · Recommendation stage (Phase 1, Slice 1.5)
//
// Stage 3 of the pipeline (Context → Analysis → RECOMMENDATION → Deliverable).
// Consumes the Analysis stage's AnalysisResult[] and produces EXACTLY ONE
// ReasoningEnvelope — the durable artifact of the system's thinking.
//
// Honest by construction: only evidence-anchored findings become CLAIMS (the
// classifier's deterministic classification becomes an ASSUMPTION, not a claim).
// If no gate-defining claim rests on usable evidence, it emits a grounded REFUSAL
// with a minimum-data request rather than a fabricated recommendation (§5.6). Pure;
// timestamps + ids are passed in so the stage stays deterministic. No live caller.

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import type { SourceDataReadinessState } from "@/lib/source/types";
import type {
  Assumption,
  Claim,
  ConfidenceBand,
  ReasoningEnvelope,
  TraceStep,
} from "./reasoning-envelope";
import { GATE_SUPPORTING_READINESS } from "./reasoning-envelope";
import type { AnalysisResult } from "./types";
import { toRigorLevel } from "./context-adapter";

export interface RecommendationOptions {
  /** Stable id for the envelope (the route supplies a real one). */
  envelopeId: string;
  /** ISO timestamp (pure code never reads the clock). */
  now: string;
}

function aggregateConfidence(results: AnalysisResult[]): ConfidenceBand {
  if (results.length === 0) {
    return {
      label: "low",
      score: 0.2,
      interval: [0.1, 0.3],
      factors: {
        evidenceSufficiency: 0.2,
        evidenceRecency: 0.2,
        corroboration: 0.2,
        modelUncertainty: 0.8,
      },
    };
  }
  const score =
    results.reduce((s, r) => s + r.confidence.score, 0) / results.length;
  const label = score >= 0.75 ? "high" : score >= 0.5 ? "moderate" : "low";
  return {
    label,
    score,
    interval: [Math.max(0, score - 0.12), Math.min(1, score + 0.12)],
    factors: {
      evidenceSufficiency:
        results.reduce((s, r) => s + r.confidence.factors.evidenceSufficiency, 0) /
        results.length,
      evidenceRecency:
        results.reduce((s, r) => s + r.confidence.factors.evidenceRecency, 0) /
        results.length,
      corroboration: Math.min(1, results.length / 3),
      modelUncertainty: 1 - score,
    },
  };
}

function summarizeFinding(r: AnalysisResult): string {
  const keys = Object.keys(r.finding);
  return `${r.framework}: ${keys
    .map((k) => `${k}=${JSON.stringify((r.finding as Record<string, unknown>)[k])}`)
    .join(", ")}`;
}

export function runRecommendationStage(
  ctx: SourceGenerationContext,
  analysis: AnalysisResult[],
  opts: RecommendationOptions,
): ReasoningEnvelope {
  const rigor = toRigorLevel(ctx);
  const classifier = analysis.find((a) => a.framework === "archetype_method_set");
  // Slice 1.1: prefer the pre-classified categoryId stored at intake over the
  // live re-classification, which is the same deterministic result but reads
  // from the DB rather than re-running the classifier on every generate call.
  const archetype =
    ctx.event.classifiedCategory ??
    (classifier?.finding as { categoryId?: string } | undefined)?.categoryId ??
    ctx.event.archetype ??
    "unknown";

  const evidence = analysis.flatMap((a) => a.evidence);
  const usableIds = new Set(
    evidence
      .filter((e) => e.readinessState === GATE_SUPPORTING_READINESS)
      .map((e) => e.id),
  );

  const decisionTrace: TraceStep[] = [];
  const claims: Claim[] = [];
  let step = 0;
  for (const a of analysis) {
    decisionTrace.push({
      step: step++,
      inputRefs: a.evidence.map((e) => e.id),
      framework: a.framework,
      decision: `ran ${a.framework}`,
      confidence: a.confidence.label,
      ts: opts.now,
    });
    // Only evidence-anchored findings become claims; an empty supportedBy would
    // (correctly) fail the gate, so we never manufacture one.
    if (a.evidence.length > 0) {
      claims.push({
        id: `claim_${a.framework}`,
        text: summarizeFinding(a),
        supportedBy: a.evidence.map((e) => e.id),
        confidence: a.confidence,
        challenged: true,
        gateDefining: a.evidence.some((e) => usableIds.has(e.id)),
      });
    }
  }

  const assumptions: Assumption[] = [];
  if (classifier) {
    assumptions.push({
      id: "assume_archetype",
      statement: `Event classified as ${archetype}.`,
      status: "accepted",
      reason: "deterministic classification over event attributes",
    });
  }

  const confidence = aggregateConfidence(analysis);
  const base: Omit<ReasoningEnvelope, "claims" | "refusal"> = {
    envelopeId: opts.envelopeId,
    eventId: ctx.event.id,
    tenantKey: ctx.tenantKey,
    stage: ctx.event.currentStageKey,
    archetype,
    rigor,
    evidence,
    assumptions,
    confidence,
    caveats: [],
    decisionTrace,
  };

  // Grounded refusal: no gate-defining claim rests on usable evidence.
  const hasUsableGateClaim = claims.some(
    (c) => c.gateDefining && c.supportedBy.some((id) => usableIds.has(id)),
  );
  if (!hasUsableGateClaim) {
    const gaps =
      (classifier?.finding as { evidenceGaps?: string[] } | undefined)
        ?.evidenceGaps ?? [];
    return {
      ...base,
      claims: [],
      refusal: {
        reason:
          "No gate-defining claim rests on usable evidence yet; refusing rather than asserting.",
        missingEvidence: gaps.map((g) => ({
          requirement: g,
          currentState: "Missing" as SourceDataReadinessState,
        })),
        minimumDataRequest: gaps.length
          ? `Load and parse to usable evidence: ${gaps.join(", ")}.`
          : "Load and parse the required evidence for this stage before a recommendation can be made.",
      },
    };
  }

  return { ...base, claims };
}
