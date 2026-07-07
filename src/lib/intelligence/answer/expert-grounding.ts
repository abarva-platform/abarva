// Expert grounding — W1.2/W1.3 wiring helper.
//
// Turns a question into the Consilium expert(s) it should be answered by, plus
// a prompt-ready grounding block built from those experts' AUTHORED content
// (scope, benchmarked metrics, AI plays, honest odds, hedge language). The live
// Intelligence ask path injects this block into the synthesizer when the
// `scb_shared_engine_intelligence` flag is on for the tenant, so Ava answers AS
// the expert — using real planning-range benchmarks and confident-synthesis
// hedges — rather than free-associating.
//
// Pure + deterministic (no DB, no model) so it is unit-testable and cheap.

import { routeQuestion } from "@/lib/intelligence/answer/router";
import { getExpertById } from "@/lib/intelligence/expert-pack/registry";
import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertRef } from "@/lib/ava-answer/contract";
import { CLIENT_KEY_TO_INDUSTRY_CODE } from "@/lib/client-config";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";

// Bridge the tenant's canonical industry CODE (CLIENT_KEY_TO_INDUSTRY_CODE) to
// the ExpertPack `identity.industry` token used by industry-specific experts.
// Only clean, unambiguous matches are listed — a tenant whose code has no entry
// (e.g. MEDTECH, DIVERSIFIED) resolves to `undefined`, which means "no industry
// exclusion": the router then keeps every cross-cutting expert and ranks on
// keywords alone, rather than wrongly fencing a conglomerate to one vertical.
const EXPERT_INDUSTRY_BY_CODE: Record<string, string> = {
  RETAIL: "retail",
  AIRLINE: "airline",
  HEALTHCARE_IDN: "healthcare_provider",
  FINSERV: "financial_services_banking",
  ENERGY: "energy",
};

/** Resolve a tenant's ExpertPack industry token from its app client key. */
export function expertIndustryForClientKey(
  clientKey?: string | null,
): string | undefined {
  const appClientKey = appClientKeyForTenant(clientKey);
  if (!appClientKey) return undefined;
  const code = CLIENT_KEY_TO_INDUSTRY_CODE[appClientKey];
  return code ? EXPERT_INDUSTRY_BY_CODE[code] : undefined;
}

export interface ExpertGrounding {
  /** The summoned experts (for trace/audit + AgentAnswer.contributingExperts). */
  experts: ExpertRef[];
  /** Prompt-ready grounding text. Empty string when no expert was summoned. */
  groundingBlock: string;
}

const TOP_METRICS = 5;
const TOP_PLAYS = 3;

function formatExpert(p: ExpertPack): string {
  const metrics = p.domain.operatingMetrics.slice(0, TOP_METRICS).map((m) => {
    const r = m.benchmarkRange;
    return `${m.name} ${r.low}–${r.high}${m.unit === "%" ? "%" : " " + m.unit}`;
  });
  const plays = p.domain.aiUseCaseArchetypes.slice(0, TOP_PLAYS).map((a) => {
    return `${a.name} [${a.controlPosture}] — ${a.valueMechanism}`;
  });
  const sm = p.successModel;
  const hedge =
    p.hedgeRules.inferenceLanguage?.[0] ??
    "Across peers, the pattern typically is…";

  return [
    `[CONSILIUM EXPERT — ${p.identity.expertName}]`,
    `Scope: ${p.identity.scopeNote}`,
    `Key metrics (planning ranges, NOT the tenant's measured values): ${metrics.join("; ")}.`,
    `Where AI applies: ${plays.join(" | ")}.`,
    `Honest odds: probability of success ${sm.probabilityOfSuccess}, adoption ${sm.adoptionReadiness}, ROI clarity ${sm.roiClarity}.`,
    `Hedge when the tenant's own data is not loaded: "${hedge}" — present benchmarks as planning ranges, never as this tenant's measured numbers.`,
  ].join("\n");
}

/**
 * Summon the expert(s) for a question and build the grounding block. The caller
 * (the ask path) injects `groundingBlock` into the synthesizer prompt and
 * surfaces `experts` as the contributing specialists.
 */
export function summonExpertsForQuery(input: {
  query: string;
  industry?: string;
  /** Tenant app client key — used to derive the industry when not passed explicitly. */
  clientKey?: string | null;
  maxExperts?: number;
}): ExpertGrounding {
  const industry =
    input.industry ?? expertIndustryForClientKey(input.clientKey);
  const routing = routeQuestion({
    query: input.query,
    industry,
    maxExperts: input.maxExperts ?? 2,
  });
  const packs = routing.experts
    .map((e) => getExpertById(e.id))
    .filter((p): p is ExpertPack => Boolean(p));

  if (packs.length === 0) {
    return { experts: [], groundingBlock: "" };
  }

  const header =
    "You are answering as AbarVa's Consilium faculty. Ground the answer in the " +
    "following expert knowledge. Use the planning-range benchmarks to frame the " +
    "answer, attribute claims honestly (industry pattern vs the tenant's own " +
    "data), and lead with the decision implication.";

  return {
    experts: routing.experts,
    groundingBlock: [header, ...packs.map(formatExpert)].join("\n\n"),
  };
}
