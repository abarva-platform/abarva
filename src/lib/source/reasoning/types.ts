// Source reasoning · framework + analysis types (Phase 1, Slice 1.0)
//
// A framework (§5.2) is a pure function (input, params) → AnalysisResult that runs
// one reasoning model (should-cost, delivery-model gate, proposal normalization, …)
// and emits a STRUCTURED finding — never prose. The Analysis stage (Slice 1.3) runs
// the selected frameworks; the Recommendation stage (Slice 1.5) consumes their
// results into one ReasoningEnvelope.

import type { SourceRigorLevel } from "@/lib/source/types";
import type { ConfidenceBand, EvidenceRef } from "./reasoning-envelope";

/** Structured output of one reasoning framework (§5.2) — NOT prose. */
export interface AnalysisResult {
  /** Framework key that produced this (e.g. "should_cost_baseline"). */
  framework: string;
  /** A short structured finding (a should-cost band, a delivery-model verdict, …). */
  finding: Record<string, unknown>;
  confidence: ConfidenceBand;
  evidence: EvidenceRef[];
}

/** Parameters passed to every framework; `rigor` modulates analysis depth (§5.6). */
export interface FrameworkParams {
  rigor: SourceRigorLevel;
  [key: string]: unknown;
}

/** A framework is a pure function (input, params) → AnalysisResult (§5.2). */
export type Framework<TInput = unknown> = (
  input: TInput,
  params: FrameworkParams,
) => AnalysisResult;
