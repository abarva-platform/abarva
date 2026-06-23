// The integration keystone — composes every muscle into ONE tested orchestration
// the route calls. Codex provides the injected deps (broker/DB sources + the
// governed model call) and calls generateArtifact; everything else (gate,
// context assembly, prompt, quality bar) is here, tested, tenant-agnostic.
//
//   gate (no approved gate, no generation) → assemble real context → readiness
//   → dynamic prompt → governed model → golden-bar quality gate → result

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import {
  assertPhaseReadyForGeneration,
  type GateReadinessSources,
  type GenerationBlocker,
} from "@/lib/programs/assert-phase-ready";
import {
  assembleMoveSolutionContext,
  type SolutionContextSources,
} from "@/lib/programs/assemble-solution-context";
import { architectureMayProceed, type SolutionContext } from "@/lib/programs/solution-context";
import { buildArtifactPrompt } from "./solution-prompt-factory";
import { meetsGoldenBar, type GoldenBarResult } from "./golden-bar";

export interface GenerateArtifactDeps {
  contextSources: SolutionContextSources;
  gateSources: GateReadinessSources;
  /** The GOVERNED model call (egress-audited). Returns the artifact HTML. */
  callModel: (system: string, user: string) => Promise<string>;
}

export type GenerateArtifactResult =
  | { status: "generated"; html: string; context: SolutionContext; goldenBar: GoldenBarResult }
  | { status: "blocked_gate"; httpStatus: 409; blockers: GenerationBlocker[] }
  | { status: "blocked_context"; missing: string[] }
  | { status: "blocked_quality"; html: string; goldenBar: GoldenBarResult; context: SolutionContext };

/** Generate one artifact end to end. Persist `generated` as client-ready, everything else as draft. */
export async function generateArtifact(
  args: {
    moveId: string;
    tenantKey: string;
    phase: number;
    artifact: DeliverableKey;
    allowApprovedRetry?: boolean;
    useCaseQuery?: string;
  },
  deps: GenerateArtifactDeps,
): Promise<GenerateArtifactResult> {
  // 1) Gate — no approved gate, no generation.
  const gate = await assertPhaseReadyForGeneration(
    { moveId: args.moveId, phase: args.phase, allowApprovedRetry: args.allowApprovedRetry },
    deps.gateSources,
  );
  if (!gate.ready) return { status: "blocked_gate", httpStatus: 409, blockers: gate.blockers };

  // 2) Assemble the REAL cumulative context (kills [DATA GAP]).
  const assembled = await assembleMoveSolutionContext(
    { moveId: args.moveId, tenantKey: args.tenantKey, targetPhase: args.phase, ...(args.useCaseQuery ? { useCaseQuery: args.useCaseQuery } : {}) },
    deps.contextSources,
  );
  const ctx = assembled.context;

  // 3) Readiness — phase inputs present; architecture needs an approved option.
  if (!assembled.readiness.ready) {
    return { status: "blocked_context", missing: assembled.readiness.missing };
  }
  const profile = getDeliverableProfile(args.artifact);
  if (profile.renderer === "html_architecture" && args.artifact !== "solution_approach_options") {
    const archOk = architectureMayProceed(ctx);
    if (!archOk.ready) return { status: "blocked_context", missing: archOk.missing };
  }

  // 4) Dynamic, context-rich prompt.
  const prompt = buildArtifactPrompt({ artifact: args.artifact, phase: args.phase, context: ctx });

  // 5) Governed model call → artifact HTML.
  const html = await deps.callModel(prompt.system, prompt.user);

  // 6) Quality bar — must be a real visual artifact, no [DATA GAP], required exhibits present.
  const goldenBar = meetsGoldenBar(html, args.artifact);
  if (!goldenBar.pass) return { status: "blocked_quality", html, goldenBar, context: ctx };

  return { status: "generated", html, context: ctx, goldenBar };
}
