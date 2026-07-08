// Dimensional router — W1.1 of the Shared Context Brain.
//
// Replaces the legacy 1-D intent gate (it_productivity|general). Given a
// question + optional tenant industry, it summons the most relevant Consilium
// expert(s) and infers the output shape the answer should take. Pure +
// deterministic so it is testable and cheap; no model call. The engine (W1.3)
// consumes the RoutingDecision to load the right ExpertPack(s) into the prompt
// and to bias the renderer.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import { EXPERT_PACKS } from "@/lib/intelligence/expert-pack/registry";
import type { ExpertRef } from "@/lib/ava-answer/contract";

/** Coarse shape the answer should lead with — biases the renderer, not a hard rule. */
export type OutputShape = "prose" | "table" | "chart" | "graph";

export interface RoutingDecision {
  query: string;
  /** Tenant industry if known (helps disambiguate same-named functions). */
  industry?: string;
  /** Ranked experts, most relevant first (may be empty → general synthesis). */
  experts: ExpertRef[];
  /** Inferred output shape for the renderer. */
  outputShape: OutputShape;
  /** Transparent per-expert scores for trace/audit. */
  scores: Array<{ id: string; name: string; score: number }>;
}

export interface RouteInput {
  query: string;
  /** Tenant's canonical industry, when known. */
  industry?: string;
  /** Max experts to summon (default 2 — a lead + an optional cross-cutting). */
  maxExperts?: number;
}

const WORD = /[a-z0-9]+/g;
const VERTICAL_CROSS_CUTTING_COMPATIBILITY: Record<string, string[]> = {
  "consumer-products-operations": ["retail"],
  "foodservice-hospitality-operations": [],
  "insurance-underwriting-claims": [],
  "life-sciences-rd-commercial": [],
  "manufacturing-operations": [],
  "media-entertainment": [],
  "public-sector-citizen-services": [],
  "telecom-network-operations": [],
};

function tokens(s: string): Set<string> {
  return new Set(
    (s.toLowerCase().match(WORD) ?? []).filter((w) => w.length > 3),
  );
}

/**
 * The searchable keyword surface of a pack — identity + scope + the operator
 * vocabulary that makes a pack recognizable from a question.
 */
function packKeywords(p: ExpertPack): Set<string> {
  const parts: string[] = [
    p.identity.expertName,
    p.identity.scopeNote,
    p.identity.industry ?? "",
    p.identity.functionKey ?? "",
    p.identity.crossCuttingDomain ?? "",
    ...p.domain.operatingMetrics.map((m) => m.name),
    ...p.domain.painThemes.map((t) => t.name),
    ...p.domain.aiUseCaseArchetypes.map((a) => a.name),
    ...p.domain.vocabulary.canonicalTerms.map((t) => t.term),
    ...p.domain.vocabulary.systemsOfRecord.map((s) => s.name),
  ];
  return tokens(parts.join(" "));
}

function inferOutputShape(query: string): OutputShape {
  const q = query.toLowerCase();
  if (
    /\b(?:2\s*x\s*2|2x2|quadrant)\b/.test(q) ||
    /\bvalue\b[\s\S]{0,80}\bcomplexity\b/.test(q) ||
    /\bcomplexity\b[\s\S]{0,80}\bvalue\b/.test(q)
  ) {
    return "chart";
  }
  if (
    /\b(relate|related|connect|connected|depend|dependenc|map of|network|upstream|downstream|impact of .* on)\b/.test(
      q,
    )
  ) {
    return "graph";
  }
  if (
    /\b(chart|charts|visual|visually|visuali[sz]e|plot|graphically)\b/.test(q)
  ) {
    return "chart";
  }
  if (
    /\b(trend|over time|by month|by quarter|year over year|trajectory)\b/.test(
      q,
    )
  ) {
    return "chart";
  }
  if (
    /\b(table|tables|tabular|matrix|break ?down|by vendor|by category|by function|by segment|compare|comparison|how much|spend|cost|budget|top \d|rank)\b/.test(
      q,
    )
  ) {
    return "table";
  }
  return "prose";
}

function isIndustryCompatibleCrossCuttingPack(
  p: ExpertPack,
  industry: string,
): boolean {
  const domain = p.identity.crossCuttingDomain;
  if (!domain) return true;
  const compatibleIndustries = VERTICAL_CROSS_CUTTING_COMPATIBILITY[domain];
  return compatibleIndustries ? compatibleIndustries.includes(industry) : true;
}

/**
 * Route a question to expert(s) + an output shape. Industry, when known, gives
 * a relevance bonus to industry-matched packs so a healthcare tenant's "denials"
 * question prefers the healthcare expert over a same-word cross-cutting one.
 */
export function routeQuestion(input: RouteInput): RoutingDecision {
  const { query, industry } = input;
  const maxExperts = input.maxExperts ?? 2;
  const qTokens = tokens(query);

  const scores = EXPERT_PACKS.map((p) => {
    // When the tenant industry is known, an industry-specific expert from a
    // DIFFERENT industry is not relevant to this tenant — exclude it (score 0,
    // dropped below). Cross-cutting experts (no `identity.industry`) stay
    // eligible for every tenant; same-industry experts get the bonus.
    if (industry && p.identity.industry && p.identity.industry !== industry) {
      return { id: p.identity.id, name: p.identity.expertName, score: 0 };
    }
    if (
      industry &&
      !p.identity.industry &&
      !isIndustryCompatibleCrossCuttingPack(p, industry)
    ) {
      return { id: p.identity.id, name: p.identity.expertName, score: 0 };
    }
    const kw = packKeywords(p);
    let score = 0;
    for (const t of qTokens) if (kw.has(t)) score += 1;
    // Industry alignment bonus (only for industry-function experts).
    if (industry && p.identity.industry === industry) score += 2;
    return { id: p.identity.id, name: p.identity.expertName, score };
  }).sort((a, b) => b.score - a.score);

  const ranked = scores.filter((s) => s.score > 0);
  const packById = new Map(EXPERT_PACKS.map((p) => [p.identity.id, p]));
  const selected = ranked.slice(0, maxExperts);
  if (
    industry &&
    maxExperts > 0 &&
    selected.every((s) => packById.get(s.id)?.identity.industry !== industry)
  ) {
    const industryCandidate = ranked.find(
      (s) => packById.get(s.id)?.identity.industry === industry,
    );
    if (industryCandidate) {
      if (selected.length < maxExperts) {
        selected.push(industryCandidate);
      } else {
        selected[selected.length - 1] = industryCandidate;
      }
    }
  }

  const experts: ExpertRef[] = selected.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return {
    query,
    industry,
    experts,
    outputShape: inferOutputShape(query),
    scores,
  };
}
