// Shared Context Brain — answer engine spine (W1.2 + W1.3).
//
// One server-side flow: route → assemble context bundle → summon expert(s) →
// synthesize → shape into the universal AvaAnswerPacket. Grounding doctrine is
// CONFIDENT SYNTHESIS — we answer from expertise even when tenant evidence is
// thin, mark HOW we know via groundingMode, and only hard-block on cross-tenant
// leakage. There is NO blocking evidence gate.
//
// The broker call and the model call are INJECTED (SharedBrainDeps) so this
// module is pure-testable without a DB or the AI client, and so the live route
// (a later, flag-gated slice) can supply the real AgentContextBroker + Claude
// synthesizer without this file importing them.

import type { ContextBundle } from "@/lib/knowledge/context-broker/types";
import {
  routeQuestion,
  type RoutingDecision,
} from "@/lib/intelligence/answer/router";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AvaAnswerPacket,
  AnswerChart,
  AnswerCitation,
  AvaConfidence,
  AnswerGraph,
  AnswerTable,
  CitationSourceClass,
} from "@/lib/ava-answer/contract";
import type { AvaNextStep, AvaSurface } from "@/lib/ava-answer/contract";

type GroundingMode = "tenant-evidence" | "industry-pattern" | "mixed";

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

function bandFromScore(score: number | undefined): AvaConfidence | undefined {
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
      (p) =>
        p.sourceClass === "private_client_data" ||
        p.sourceClass === "tenant_admin_upload",
    );
  const hasIndustry =
    (bundle.corpusPatterns?.length ?? 0) > 0 ||
    (bundle.worldviewChunks?.length ?? 0) > 0 ||
    (bundle.provenance ?? []).some(
      (p) => p.sourceClass === "corpus" || p.sourceClass === "pattern_catalog",
    );
  if (hasTenant && hasIndustry) return "mixed";
  if (hasTenant) return "tenant-evidence";
  return "industry-pattern"; // confident synthesis fallback
}

export interface AssembleAgentAnswerArgs {
  surface: AvaSurface;
  routing: RoutingDecision;
  bundle: ContextBundle;
  /** The synthesized narrative (from the model, or empty when blocked). */
  prose: string;
  /** True only when the cross-tenant fence fired. */
  crossTenantBlocked?: boolean;
  /** Structured channels, when a renderer recipe produced them (later slices). */
  tables?: AnswerTable[];
  charts?: AnswerChart[];
  graphs?: AnswerGraph[];
  gaps?: string[];
  recommendedActions?: AvaNextStep[];
}

/**
 * Pure shaping step: turn (routing, bundle, prose) into the universal
 * AvaAnswerPacket. Deterministic + side-effect-free so it is unit-testable.
 */
export function assembleAgentAnswer(
  args: AssembleAgentAnswerArgs,
): AvaAnswerPacket {
  const { surface, routing, bundle, prose, crossTenantBlocked = false } = args;
  const groundingMode = groundingModeFromBundle(bundle);
  // Confident-synthesis confidence: tenant-grounded answers rate higher than
  // pure industry-pattern ones, but we never refuse on either.
  const confidence: AvaConfidence =
    groundingMode === "tenant-evidence"
      ? "high"
      : groundingMode === "mixed"
        ? "medium"
        : "low";

  return composeAvaAnswer({
    surface,
    mode:
      surface === "home"
        ? "KNOW"
        : surface === "moves"
          ? "EXECUTE"
          : surface === "source"
            ? "SOURCE"
            : surface === "tower"
              ? "CONTROL"
              : "ANALYZE",
    tenantKey: bundle.tenantKey ?? "unknown",
    question: bundle.query,
    intent: routing.outputShape,
    status: crossTenantBlocked ? "blocked" : "answered",
    directAnswer: crossTenantBlocked ? "" : prose,
    interpretation:
      surface === "intelligence"
        ? "This is an advisory interpretation; tenant claims still need source grounding before action."
        : undefined,
    artifacts: [
      ...(args.tables ?? []).map((table) => ({
        ...table,
        artifact: "table" as const,
      })),
      ...(args.charts ?? []).map((chart) => ({
        ...chart,
        artifact: "chart" as const,
      })),
      ...(args.graphs ?? []).map((graph) => ({
        ...graph,
        artifact: "graph" as const,
      })),
    ],
    citations: crossTenantBlocked ? [] : citationsFromBundle(bundle),
    gaps: (args.gaps ?? []).map((gap, index) => ({
      id: `gap-${index + 1}`,
      label: "Gap",
      detail: gap,
    })),
    nextSteps: args.recommendedActions ?? [],
    expertsUsed: routing.experts,
    corpusUsed:
      groundingMode === "tenant-evidence"
        ? []
        : [
            {
              id: "corpus-grounding",
              label:
                groundingMode === "mixed"
                  ? "Tenant context plus corpus grounding"
                  : "Corpus grounding",
              confidence,
            },
          ],
    retrievalSummary: {
      substrate:
        groundingMode === "tenant-evidence" ? "module_read_model" : "corpus",
      factCount: bundle.facts.length,
      sourceCount: bundle.provenance.length,
      hasTenantFacts: groundingMode !== "industry-pattern",
      hasCorpus: groundingMode !== "tenant-evidence",
      hasExperts: routing.experts.length > 0,
    },
  });
}

export interface SharedBrainInput {
  query: string;
  surface: AvaSurface;
  tenantKey?: string;
  /** Tenant industry, when known — improves expert routing. */
  industry?: string;
}

/**
 * Injected dependencies. The live route supplies the real AgentContextBroker
 * and the Claude synthesizer; tests supply stubs.
 */
export interface SharedBrainDeps {
  assembleBundle: (input: {
    query: string;
    tenantKey?: string;
  }) => Promise<ContextBundle>;
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
): Promise<AvaAnswerPacket> {
  const routing = routeQuestion({
    query: input.query,
    industry: input.industry,
  });
  const bundle = await deps.assembleBundle({
    query: input.query,
    tenantKey: input.tenantKey,
  });
  const prose = await deps.synthesize({ query: input.query, routing, bundle });
  const crossTenantBlocked =
    deps.detectCrossTenant?.(prose, input.tenantKey) ?? false;
  return assembleAgentAnswer({
    surface: input.surface,
    routing,
    bundle,
    prose,
    crossTenantBlocked,
  });
}
