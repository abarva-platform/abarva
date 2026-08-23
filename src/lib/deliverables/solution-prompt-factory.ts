// solution-prompt-factory — builds the artifact prompt DYNAMICALLY from the rich
// SolutionContext + the VisualArtifactContract + the visual-first standard.
//
// "The prompt becomes simple because the context is finally rich." Replaces the
// static fill-the-outline markdown templates + `[DATA GAP]` stubs.

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import type { GenerationMode } from "@/lib/programs/assert-phase-ready";
import type { SolutionContext } from "@/lib/programs/solution-context";
import {
  VISUAL_ARTIFACT_STANDARD,
  renderVisualContractPrompt,
  visualContractFor,
} from "./visual-artifact-contract";
import {
  renderStrategicMovesArtifactBrief,
  STRATEGIC_MOVES_DRAFT_CAVEAT,
} from "./strategic-moves-artifact-standard";

const SYSTEM_PROMPT = `You are a senior consulting principal — strategist, solution architect, and
presentation designer at a top-tier firm. You produce board-grade, decision-oriented, VISUAL
consulting artifacts as complete self-contained HTML documents with custom inline SVG diagrams,
tables, charts, and decision exhibits. You write like a partner who understood the client's context
and made a clear judgment — never a generic, mechanical, section-pack memo. You decide the right
exhibit mix, but you are visual-first by default.`;

function field(
  label: string,
  value: string | undefined,
  fallback: string,
): string {
  return `${label}:\n${value && value.trim() ? value : `[MISSING — ${fallback}]`}`;
}

function kpiBlock(ctx: SolutionContext): string {
  if (!ctx.kpis?.length) return "KPIS:\n[MISSING — no KPIs in SolutionContext]";
  return (
    "KPIS:\n" +
    ctx.kpis
      .map(
        (k) =>
          `- ${k.name} (${k.domain})${k.baseline ? ` ${k.baseline}→${k.target ?? "?"}` : ""}`,
      )
      .join("\n")
  );
}

function decisionsBlock(ctx: SolutionContext): string {
  if (!ctx.decisions.length) return "APPROVED DECISIONS:\n[none yet]";
  return (
    "APPROVED DECISIONS:\n" +
    ctx.decisions
      .map((d) => `- P${d.phase}: ${d.decision} — ${d.rationale}`)
      .join("\n")
  );
}

function p3FutureStateBoundaryBlock(args: {
  artifact: DeliverableKey;
  phase: number;
  generationMode: GenerationMode;
  context: SolutionContext;
  draftCaveat?: string;
}): string {
  if (args.artifact !== "target_state_architecture" || args.phase !== 3)
    return "";
  const draftStatus =
    args.generationMode === "draft"
      ? `- This is "P3 Draft — based on approved P2 diagnostic for design shaping".
- P2 is approved only for P3 draft shaping. P2 is not final. P3 is not final.
- Include the active draft caveat near the top: "${args.draftCaveat ?? STRATEGIC_MOVES_DRAFT_CAVEAT}"`
      : "- Final P3 output requires formal P3 option approval and phase-gate approval.";
  const optionRule = args.context.chosenOption
    ? `- Build to the approved chosen option: "${args.context.chosenOption}".`
    : `- No approved option is present. STOP and request P3a solution-option approval. Do not draft architecture, select an option, or blend alternatives.`;
  return `\nP3 FUTURE-STATE BLUEPRINT BOUNDARY
${draftStatus}
${optionRule}
- Carry forward P2 caveats, missing evidence, sponsor/signoff limits, and client-to-complete fields.
- AbarVa's role is to shape, govern, prove, and help the client decide. The client and delivery teams own detailed process redesign, BPMN/workflow design, system configuration, data engineering, implementation, training, adoption execution, and run-state operations.
- Use client-facing labels: Future-State Direction, New Way of Working Blueprint, Target Operating Concept, Implementation work packages for client/delivery teams.
- Do not write that AbarVa implements, executes, configures systems, trains users, runs operations, or completes end-to-end automation.`;
}

export interface BuiltPrompt {
  system: string;
  user: string;
  outputFormat: "html" | "docx" | "pptx" | "markdown";
}

/** Build the dynamic, context-rich prompt for an artifact. */
export function buildArtifactPrompt(args: {
  artifact: DeliverableKey;
  phase: number;
  context: SolutionContext;
  generationMode?: GenerationMode;
  draftCaveat?: string;
}): BuiltPrompt {
  const { artifact, phase, context: ctx } = args;
  const generationMode = args.generationMode ?? "final";
  const profile = getDeliverableProfile(artifact);
  const contract = visualContractFor(artifact);

  const contextBlock = [
    field(
      "USE CASE",
      ctx.useCase ?? ctx.useCaseCandidate,
      "no use case — blocking input",
    ),
    kpiBlock(ctx),
    field(
      "CURRENT STATE",
      ctx.currentState,
      "current state not captured — blocking input",
    ),
    "GAPS / ROOT CAUSES:\n" +
      ((ctx.gaps?.length ? ctx.gaps : (ctx.rootCauses ?? []))
        .map((g) => `- ${g}`)
        .join("\n") || "[MISSING — diagnosis not captured]"),
    decisionsBlock(ctx),
    "HUMAN REVIEW NOTES:\n" +
      (ctx.humanApprovalNotes.length
        ? ctx.humanApprovalNotes.map((n) => `- ${n}`).join("\n")
        : "[none]"),
  ].join("\n\n");

  const visualBlock = contract
    ? renderVisualContractPrompt(contract)
    : "Produce a visual-first artifact with the exhibits the content warrants.";
  const standardBrief = renderStrategicMovesArtifactBrief({
    artifact,
    phase,
    context: ctx,
    generationMode,
    draftCaveat: args.draftCaveat,
  });

  const archRule =
    profile.renderer === "html_architecture" &&
    artifact !== "solution_approach_options"
      ? `\nARCHITECTURE RULE:\n- Do NOT choose the solution approach here — use the already-approved chosenOption: ${ctx.chosenOption ? `"${ctx.chosenOption}"` : "[MISSING — STOP and request P3a approval]"}.\n- The architecture must be built to that decision.\n- Do not reopen, blend, or silently replace rejected alternatives. If new evidence conflicts with the decision, expose the conflict in the Open Decision Log.`
      : "";

  const draftBlock =
    generationMode === "draft"
      ? `\nDRAFT STATUS REQUIREMENT:\n- This is a pre-gate review draft, not a final or board-ready artifact.\n- Include this visible caveat near the top of the artifact: "${args.draftCaveat ?? "Draft status: This artifact was generated before formal phase approval and is intended for review only."}"\n- Write for sponsor review, workshop preparation, and refinement.\n- Do not imply phase approval, sponsor signoff, final acceptance, or board-ready quality.\n- Include a concise "Client to Complete Before Final" exhibit listing the open gate items and missing evidence.\n- The artifact may be visually strong, but every recommendation must be phrased as draft/review-ready until the gate is approved.`
      : "";

  const user = `You are generating "${profile.title}" for phase P${phase}.

${standardBrief}

${p3FutureStateBoundaryBlock({
  artifact,
  phase,
  generationMode,
  context: ctx,
  draftCaveat: args.draftCaveat,
})}

BOUND SOLUTION CONTEXT
${contextBlock}

${draftBlock}

${VISUAL_ARTIFACT_STANDARD}

${visualBlock}

TASK:
Generate "${profile.title}" as a complete, self-contained HTML document with custom inline SVG
diagrams and tables — board-grade, decision-led, story-first.

RULES:
- Do not invent facts. If a required context field is marked [MISSING], call it out as a blocking
  input in a single "Open Inputs Required" exhibit — do not fabricate around it.
- Every recommendation must trace to a KPI, a gap, an evidence item, or an approved decision.
- Lead with judgment and the decision; hide the machinery; visuals carry the story.
- For drafts, use this exact status language where visible: "${args.draftCaveat ?? STRATEGIC_MOVES_DRAFT_CAVEAT}"
- For P1/P2, include every required structure named in the Strategic Moves Premium Artifact Brief.
- Return the complete artifact, not an outline, summary, short patch, or placeholder.${archRule}`;

  return { system: SYSTEM_PROMPT, user, outputFormat: "pptx" };
}
