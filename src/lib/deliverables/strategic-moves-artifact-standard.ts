import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import type { GenerationMode } from "@/lib/programs/assert-phase-ready";
import type { SolutionContext } from "@/lib/programs/solution-context";

export const STRATEGIC_MOVES_ARTIFACT_STANDARD_DOC =
  "docs/design/strategic-moves/ARTIFACT_GENERATION_STANDARD.md";

export const STRATEGIC_MOVES_DRAFT_CAVEAT =
  "This is a pre-gate review draft generated from available evidence. It is intended for sponsor review, workshop preparation, and refinement. It is not final or board-ready until sponsor assignment, charter signoff, and phase gate approval are completed.";

export const STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS = [
  "kernel",
  "function-pack",
  "generated-pack",
  "source row",
  "raw route",
  "blob path",
  "tenant key",
  "debug",
  "canonical internal id",
  "prompt",
  "model call",
  "implementation detail",
] as const;

export interface ArtifactDepthStandard {
  targetWords: string;
  minWords: number;
  maxTokens: number;
}

const DEPTH_BY_ARTIFACT: Partial<Record<DeliverableKey, ArtifactDepthStandard>> = {
  charter: { targetWords: "2,000-3,500", minWords: 1500, maxTokens: 26000 },
  discovery_report: { targetWords: "3,000-5,000", minWords: 2500, maxTokens: 34000 },
  root_cause_worksheet: { targetWords: "1,500-2,500", minWords: 1200, maxTokens: 24000 },
  solution_approach_options: { targetWords: "2,000-3,500", minWords: 1500, maxTokens: 30000 },
  target_state_architecture: { targetWords: "3,500-6,000", minWords: 2500, maxTokens: 36000 },
  solution_design: { targetWords: "3,500-6,000", minWords: 2500, maxTokens: 36000 },
  execution_roadmap: { targetWords: "3,000-5,000", minWords: 2500, maxTokens: 32000 },
  business_case: { targetWords: "3,000-5,000", minWords: 2500, maxTokens: 32000 },
  handoff_package: { targetWords: "2,500-4,000", minWords: 2000, maxTokens: 30000 },
};

export function depthStandardForArtifact(
  artifact: DeliverableKey,
): ArtifactDepthStandard {
  return (
    DEPTH_BY_ARTIFACT[artifact] ?? {
      targetWords: "1,800-3,000",
      minWords: 1200,
      maxTokens: 24000,
    }
  );
}

export function modelTokenBudgetForArtifact(artifact: DeliverableKey): number {
  return depthStandardForArtifact(artifact).maxTokens;
}

export function premiumGoldenBarOptionsForArtifact(
  artifact: DeliverableKey,
): {
  minimumWordCount?: number;
  forbiddenLanguage?: readonly string[];
} {
  if (artifact === "charter" || artifact === "discovery_report") {
    return {
      minimumWordCount: depthStandardForArtifact(artifact).minWords,
      forbiddenLanguage: STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS,
    };
  }
  return {};
}

function list(values: readonly string[] | undefined, fallback: string): string {
  if (!values?.length) return `[MISSING — ${fallback}]`;
  return values.map((value) => `- ${value}`).join("\n");
}

function claimClassificationBlock(): string {
  return `EVIDENCE-BOUND WRITING RULE
Classify substantive claims naturally in the artifact:
- supported by uploaded evidence or extracted enterprise context
- inferred from evidence
- assumption for review
- missing evidence
- decision needed

Use client-facing language such as "current evidence supports", "stakeholder notes suggest",
"this remains an assumption until", and "this cannot be finalized until". Do not invent values,
ROI, named owners, sponsor approval, or control readiness.`;
}

function p1Assignment(): string {
  return `PHASE-SPECIFIC ASSIGNMENT — P1 MOVE CHARTER
Purpose: define the Move well enough for sponsor review and a phase-gate discussion.
Do not over-design the future solution.

The artifact must answer:
- what problem is being solved
- what is in scope, out of scope, and adjacent
- who owns the Move and who must decide
- what outcomes and KPIs matter
- what success means
- what assumptions remain
- what evidence is unresolved
- what working session should happen next

Required structures:
- Scope In / Out / Adjacent table
- Stakeholder and Decision Rights table
- Success Criteria table
- Assumptions and Evidence Gaps table
- Decision Log
- Next Working Session Agenda`;
}

function p2Assignment(): string {
  return `PHASE-SPECIFIC ASSIGNMENT — P2 CURRENT WORK DIAGNOSTIC
Purpose: diagnose how work runs today and what must be validated before solution design.
Do not jump to a fully designed future state. AI opportunities may be identified, but only after
the current work, handoffs, controls, data, policy, and ownership issues are clear.

The artifact must answer:
- how work is performed today
- where handoffs, delays, rework, leakage, risk, or exception types occur
- what works today and should be preserved
- what breaks, why it breaks, and the implication
- whether the issue is process, data, policy, control, ownership, AI-fit, or a mix
- what evidence supports the diagnosis
- what evidence is still needed before finalizing

Required structures:
- Current-State Handoff Map
- Exception Taxonomy
- Pain Point / Root Cause Matrix
- Process vs Data vs Policy vs Ownership vs AI Matrix
- Control Implications table
- Evidence Coverage table
- Next Evidence Request table
- Owner / Action Matrix`;
}

function genericPhaseAssignment(phase: number): string {
  const byPhase: Record<number, string> = {
    0: "Frame the opportunity, evidence, value hypothesis, known/unknowns, and P1 recommendation.",
    3: "Design the future way of working, roles, controls, data/platform dependencies, and open design decisions.",
    4: "Sequence work, value, dependencies, funding assumptions, and decision gates without unsupported ROI.",
    5: "Mobilize execution with owners, governance cadence, Tower/Source handoff status, and 30/60/90 actions.",
  };
  return `PHASE-SPECIFIC ASSIGNMENT\n${byPhase[phase] ?? "Produce the phase deliverable with evidence-bound judgment and visual structure."}`;
}

export function phaseAssignmentForArtifact(args: {
  artifact: DeliverableKey;
  phase: number;
}): string {
  if (args.artifact === "charter" || args.phase === 1) return p1Assignment();
  if (args.artifact === "discovery_report" || args.phase === 2) return p2Assignment();
  return genericPhaseAssignment(args.phase);
}

export function renderStrategicMovesArtifactBrief(args: {
  artifact: DeliverableKey;
  phase: number;
  context: SolutionContext;
  generationMode: GenerationMode;
  draftCaveat?: string;
}): string {
  const { context: ctx } = args;
  const depth = depthStandardForArtifact(args.artifact);
  const evidenceSignals = [
    ctx.currentState ? "current-state broker bundle is bound in full below" : undefined,
    ctx.humanApprovalNotes.length ? "human review notes are bound" : undefined,
    ctx.decisions.length ? "approved decisions are bound" : undefined,
    ctx.evidenceNeeds?.length ? "evidence needs are captured" : undefined,
  ].filter(Boolean);

  return `STRATEGIC MOVES PREMIUM ARTIFACT BRIEF
Standard: ${STRATEGIC_MOVES_ARTIFACT_STANDARD_DOC}

1. Artifact identity
- Tenant/client key: ${ctx.tenantKey}
- Move id: ${ctx.moveId}
- Phase: P${args.phase}
- Artifact type: ${args.artifact}
- Generation mode: ${args.generationMode}
- Intended use: sponsor review, workshop preparation, steering discussion, and phase-gate refinement
- Target depth: ${depth.targetWords} words; minimum acceptable depth: ${depth.minWords} words

2. Business context
- Use case / opportunity: ${ctx.useCase ?? ctx.useCaseCandidate ?? ctx.problemSeed ?? "[MISSING — use case or opportunity seed required]"}
- Scope: ${ctx.scope ?? "[MISSING — scope not captured]"}
- Value hypothesis: ${ctx.valueHypothesis ?? "[MISSING — value hypothesis not captured]"}
- Sponsor / owner status: ${ctx.sponsorCandidate ?? "[MISSING — sponsor not assigned]"}
- Constraints: ${list(ctx.constraints, "constraints not captured")}

3. Evidence base
- Evidence binding status: ${evidenceSignals.length ? evidenceSignals.join("; ") : "[MISSING — no evidence signals captured]"}
- Current state, extracted context, and structured summaries must be used when present below; do not treat file names or metadata as a substitute for extracted evidence.
- Missing evidence: ${list(ctx.evidenceNeeds, "evidence request list not captured")}
- Assumptions / kill criteria for review: ${list(ctx.killCriteria, "assumptions or kill criteria not captured")}

4. Readiness and gates
- Draft/final mode: ${args.generationMode}
- Draft caveat when applicable: ${args.generationMode === "draft" ? args.draftCaveat ?? STRATEGIC_MOVES_DRAFT_CAVEAT : "Not a draft artifact."}
- Final artifacts require capture complete, sponsor/owner conditions satisfied, evidence covered or waived, gate approval, golden-bar pass, and no hard blockers.

5. Phase-specific assignment
${phaseAssignmentForArtifact({ artifact: args.artifact, phase: args.phase })}

6. Quality bar
- Lead with judgment and a clear executive answer.
- Use diagrams, tables, matrices, and charts where they clarify flow, comparison, ownership, dependencies, controls, value, or gates.
- Make every section useful for a client discussion.
- State what is known, what it means, what is missing, what decision is needed, and what happens next.
- No generic AI filler, no fake certainty, no internal language, no unsupported value claims.

${claimClassificationBlock()}`;
}
