// Golden eval runner — W5.2.
//
// Scores the DETERMINISTIC layer of the Shared Context Brain without the model
// or the live env: for each golden question, does the router summon the right
// expert, and does the grounding block actually carry that expert's authored
// content (its name, benchmarked metrics, honest odds, hedge language)? This is
// the foundation the model-answer quality eval (W5.1 runner + live env) builds
// on — if routing/grounding is wrong, the prose can't be right.

import { routeQuestion } from "@/lib/intelligence/answer/router";
import { summonExpertsForQuery } from "@/lib/intelligence/answer/expert-grounding";
import { getExpertById } from "@/lib/intelligence/expert-pack/registry";
import { GOLDEN_QUESTIONS, type GoldenQuestion } from "./golden-questions";

export interface GoldenResult {
  id: string;
  routedTo: string | null;
  routingOk: boolean;
  /** Grounding block exists and carries the expert's name + odds + hedge. */
  groundingOk: boolean;
  /** All `mustInclude` terms present (true when none specified). */
  contentOk: boolean;
  pass: boolean;
  notes: string[];
}

export interface GoldenEvalReport {
  total: number;
  passCount: number;
  routingPass: number;
  groundingPass: number;
  contentPass: number;
  results: GoldenResult[];
}

function evalOne(q: GoldenQuestion): GoldenResult {
  const notes: string[] = [];
  const routing = routeQuestion({ query: q.query, industry: q.industry });
  const routedTo = routing.experts[0]?.id ?? null;
  const routingOk = routedTo === q.expectedExpertId;
  if (!routingOk) notes.push(`routed to ${routedTo ?? "(none)"} expected ${q.expectedExpertId}`);

  const grounding = summonExpertsForQuery({ query: q.query, industry: q.industry });
  const block = grounding.groundingBlock;
  const expert = getExpertById(q.expectedExpertId);
  const expertName = expert?.identity.expertName ?? "";
  const hasName = Boolean(expertName) && block.includes(expertName);
  const hasOdds = /Honest odds:/.test(block);
  const hasHedge = /Hedge when/.test(block);
  const hasBenchmark = /\d+–\d+/.test(block); // an en-dash planning range
  const groundingOk = hasName && hasOdds && hasHedge && hasBenchmark;
  if (!groundingOk) {
    notes.push(
      `grounding missing: ${[!hasName && "expert-name", !hasOdds && "odds", !hasHedge && "hedge", !hasBenchmark && "benchmark"].filter(Boolean).join(", ")}`,
    );
  }

  const lower = block.toLowerCase();
  const missing = (q.mustInclude ?? []).filter((t) => !lower.includes(t.toLowerCase()));
  const contentOk = missing.length === 0;
  if (!contentOk) notes.push(`grounding missing terms: ${missing.join(", ")}`);

  return {
    id: q.id,
    routedTo,
    routingOk,
    groundingOk,
    contentOk,
    pass: routingOk && groundingOk && contentOk,
    notes,
  };
}

/** Run the full golden set. Pure + deterministic. */
export function runGoldenEval(): GoldenEvalReport {
  const results = GOLDEN_QUESTIONS.map(evalOne);
  return {
    total: results.length,
    passCount: results.filter((r) => r.pass).length,
    routingPass: results.filter((r) => r.routingOk).length,
    groundingPass: results.filter((r) => r.groundingOk).length,
    contentPass: results.filter((r) => r.contentOk).length,
    results,
  };
}
