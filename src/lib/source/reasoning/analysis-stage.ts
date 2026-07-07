// Source reasoning · Analysis stage (Phase 1, Slice 1.3)
//
// Stage 2 of the pipeline (Context → ANALYSIS → Recommendation → Deliverable).
// Resolves the framework set for the event's (archetype, rigor, stage) and runs
// each wired framework via the registry, collecting structured AnalysisResults.
// Authors NO prose. Pure. The live generate path is untouched (no caller yet).

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import type { AnalysisResult } from "./types";
import { resolveAnalysisPlan, type ResolvedAnalysisPlan } from "./archetype-resolver";
import { runFramework } from "./framework-registry";
import { toRigorLevel } from "./context-adapter";

export interface AnalysisStageOutput {
  plan: ResolvedAnalysisPlan;
  results: AnalysisResult[];
  /** Frameworks the plan wanted but that are not yet wired (skipped, not failed). */
  skipped: string[];
}

export function runAnalysisStage(
  ctx: SourceGenerationContext,
): AnalysisStageOutput {
  const archetype = ctx.event.classifiedCategory ?? ctx.event.archetype ?? "unknown";
  const rigor = toRigorLevel(ctx);
  const stage = ctx.event.currentStageKey;
  const plan = resolveAnalysisPlan(archetype, rigor, stage);

  const results: AnalysisResult[] = [];
  const skipped: string[] = [];
  for (const key of plan.frameworks) {
    const r = runFramework(key, ctx);
    if (r) results.push(r);
    else skipped.push(key);
  }
  return { plan, results, skipped };
}
