// Shared Context Brain — answer engine spine (W1.2 + W1.3).
//
// One server-side flow: route → assemble context bundle → summon expert(s) →
// synthesize → shape into the universal AgentAnswer. Grounding doctrine is
// CONFIDENT SYNTHESIS — we answer from expertise even when tenant evidence is
// thin, mark HOW we know via groundingMode, and only hard-block on cross-tenant
// leakage. There is NO blocking evidence gate.
//
// The broker call and the model call are INJECTED (SharedBrainDeps) so this
// module is pure-testable without a DB or the AI client, and so the live route
// (a later, flag-gated slice) can supply the real AgentContextBroker + Claude
// synthesizer without this file importing them.

import type { ContextBundle } from "@/lib/knowledge/context-broker/types";
import { routeQuestion, type RoutingDecision } from "@/lib/intelligence/answer/router";
import type {
  AgentAnswer,
  AgentSurface,
  AnswerCitation,
  AnswerConfidence,
  CitationSourceClass,
  GroundingMode,
} from "@/lib/intelligence/answer/agent-answer";
import {
  enforceHomeKnowAgentAnswerDoctrine,
  enforceIntelligenceAdvisorDoctrine,
} from "@/lib/intelligence/answer/surface-doctrine";

/** Map the broker's provenance source-class to the answer citation taxonomy. */
function mapSourceClass(
  pc: ContextBundle["provenance"][number]["sourceClass"],
): CitationSourceClass {
  switch (pc) {
    case "private_client_data":
    case "tenant_admin_upload":
    case "synthetic":
    case "unknown":
      return "tenant-fact";
    case "corpus":
      return "worldview";
    case "pattern_catalog":
      return "corpus-pattern";
    default:
      return "tenant-fact";
  }
}

function bandFromScore(score: number | undefined): AnswerConfidence | undefined {
  if (score === undefined) return undefined;
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}

/** Citations are DATA — one per provenance entry the bundle emitted. */
export function citationsFromBundle(bundle: ContextBundle): AnswerCitation[] {
  return (bundle.provenance ?? []).map((p, i) => ({
    id: `c${i + 1}`,
    label: p.sourceDoc ?? p.sourceId,
    sourceClass: mapSourceClass(p.sourceClass),
    recordId: p.sourceId,
    url: p.sourceDoc,
    confidence: bandFromScore(p.confidence),
  }));
}

/** How the answer was grounded — drives hedge language, not a refusal. */
export function groundingModeFromBundle(bundle: ContextBundle): GroundingMode {
  const hasTenant =
    (bundle.facts?.length ?? 0) > 0 ||
    (bundle.provenance ?? []).some(
      (p) => p.sourceClass === "private_client_data" || p.sourceClass === "tenant_admin_upload",
    );
  const hasIndustry =
    (bundle.corpusPatterns?.length ?? 0) > 0 ||
    (bundle.worldviewChunks?.length ?? 0) > 0 ||
    (bundle.provenance ?? []).some((p) => p.sourceClass === "corpus" || p.sourceClass === "pattern_catalog");
  if (hasTenant && hasIndustry) return "mixed";
  if (hasTenant) return "tenant-evidence";
  return "industry-pattern"; // confident synthesis fallback
}

export interface AssembleAgentAnswerArgs {
  surface: AgentSurface;
  routing: RoutingDecision;
  bundle: ContextBundle;
  /** The synthesized narrative (from the model, or empty when blocked). */
  prose: string;
  /** True only when the cross-tenant fence fired. */
  crossTenantBlocked?: boolean;
  /** Structured channels, when a renderer recipe produced them (later slices). */
  tables?: AgentAnswer["tables"];
  charts?: AgentAnswer["charts"];
  graphs?: AgentAnswer["graphs"];
  gaps?: string[];
  recommendedActions?: AgentAnswer["recommendedActions"];
}

/**
 * Pure shaping step: turn (routing, bundle, prose) into the universal
 * AgentAnswer. Deterministic + side-effect-free so it is unit-testable.
 */
export function assembleAgentAnswer(args: AssembleAgentAnswerArgs): AgentAnswer {
  const { surface, routing, bundle, prose, crossTenantBlocked = false } = args;
  const groundingMode = groundingModeFromBundle(bundle);
  // Confident-synthesis confidence: tenant-grounded answers rate higher than
  // pure industry-pattern ones, but we never refuse on either.
  const confidence: AnswerConfidence =
    groundingMode === "tenant-evidence" ? "high" : groundingMode === "mixed" ? "medium" : "low";

  const answer: AgentAnswer = {
    engineVersion: "agent-answer/v1",
    surface,
    expertId: routing.experts[0]?.id ?? null,
    contributingExperts: routing.experts,
    prose: crossTenantBlocked ? "" : prose,
    tables: args.tables ?? [],
    charts: args.charts ?? [],
    graphs: args.graphs ?? [],
    citations: crossTenantBlocked ? [] : citationsFromBundle(bundle),
    gaps: args.gaps ?? [],
    recommendedActions: args.recommendedActions ?? [],
    groundingMode,
    confidence,
    limits: [],
    crossTenantBlocked,
  };
  if (surface === "home") return enforceHomeKnowAgentAnswerDoctrine(answer);
  if (surface === "intelligence") return enforceIntelligenceAdvisorDoctrine(answer);
  return answer;
}

export interface SharedBrainInput {
  query: string;
  surface: AgentSurface;
  tenantKey?: string;
  /** Tenant industry, when known — improves expert routing. */
  industry?: string;
}

/**
 * Injected dependencies. The live route supplies the real AgentContextBroker
 * and the Claude synthesizer; tests supply stubs.
 */
export interface SharedBrainDeps {
  assembleBundle: (input: { query: string; tenantKey?: string }) => Promise<ContextBundle>;
  synthesize: (ctx: {
    query: string;
    routing: RoutingDecision;
    bundle: ContextBundle;
  }) => Promise<string>;
  /** Cross-tenant fence — the only hard block. Returns true to suppress. */
  detectCrossTenant?: (prose: string, tenantKey?: string) => boolean;
}

/**
 * The orchestrator: route → assemble → synthesize → fence → shape. This is the
 * single seam the five surfaces will call (behind a flag) once wired.
 */
export async function answerWithSharedBrain(
  input: SharedBrainInput,
  deps: SharedBrainDeps,
): Promise<AgentAnswer> {
  const routing = routeQuestion({ query: input.query, industry: input.industry });
  const bundle = await deps.assembleBundle({ query: input.query, tenantKey: input.tenantKey });
  const prose = await deps.synthesize({ query: input.query, routing, bundle });
  const crossTenantBlocked = deps.detectCrossTenant?.(prose, input.tenantKey) ?? false;
  return assembleAgentAnswer({ surface: input.surface, routing, bundle, prose, crossTenantBlocked });
}
