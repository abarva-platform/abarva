// Proof that the Moves runtime path uses the CANONICAL per-artifact quality
// contract, not a hardcoded generic floor.
//
// The audit found `resolveQualityBar` was never called on this path: the
// registry's per-artifact depth bands, ceilings and narrative-spine
// requirements had been written, reviewed and reconciled across two pipelines —
// and never executed once. The enforced bar was 5 sections / 600 words with no
// ceiling, for every Moves artifact type.

import { buildMoveDeliverableRequest } from "../build-request";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { buildPassPrompt } from "@/lib/deliverables/orchestrator/prompt-builder";
import type { MoveBusinessCaseInput } from "@/lib/programs/move-business-case";

function move(): MoveBusinessCaseInput {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Care coordination uplift",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    charter: {
      sponsor: "Chief Operating Officer",
      stakeholders: "Care management, analytics, IT",
      success_metrics: "Reduce avoidable readmissions",
      value_range: "Directional, to be validated in P4",
      scope: "In: care coordination. Out: claims adjudication.",
    },
    baseline_metrics: [],
  } as unknown as MoveBusinessCaseInput;
}

function barFor(deliverableType: string) {
  return buildMoveDeliverableRequest(move(), {
    deliverableType,
    phaseOrStage: "P4_business_case",
    artifactStandard: "moves.board_grade.costed_business_case",
    decisionContext: "Fund / shape / kill.",
  }).request.qualityBar;
}

describe("the canonical quality contract reaches the runtime request", () => {
  it("applies the reconciled compact P4 business-case band, not a generic low bar", () => {
    const bar = barFor("business_case");
    expect(bar.minSections).toBe(5);
    expect(bar.minBodyWords).toBe(3_000);
    expect(bar.targetBodyWordsMax).toBe(5_000);
    expect(bar.advisoryBandMax).toBe(5_800);
    expect(bar.enforceMaxAsBlocker).toBe(true);
    expect(bar.excludeNonProseFromBody).toBe(true);
  });

  it("carries the narrative-spine requirements that were previously dead", () => {
    const bar = barFor("business_case");
    expect(bar.requiresCentralTension).toBe(true);
    expect(bar.requiresOptionsConsidered).toBe(true);
    expect(bar.requiresEvidenceGapsNoted).toBe(true);
  });

  it("is no longer the hardcoded 600-word generic floor", () => {
    const bar = barFor("business_case");
    expect(bar.minBodyWords).not.toBe(600);
    expect(bar.targetBodyWordsMax).toBeDefined();
    expect(bar.enforceMaxAsBlocker).toBe(true);
  });

  it("gives each artifact type its own contract rather than one shared bar", () => {
    const businessCase = barFor("business_case");
    const charter = barFor("charter");
    const architecture = barFor("target_state_architecture");

    expect(charter.minBodyWords).toBeLessThan(businessCase.minBodyWords);
    expect(architecture.minBodyWords).toBeGreaterThan(
      businessCase.minBodyWords,
    );
    // The architecture artifact must never be squeezed by a brevity rule.
    expect(architecture.enforceMaxAsBlocker).toBe(false);
  });

  it("matches the registry exactly, so the runtime cannot drift from the contract", () => {
    for (const type of [
      "business_case",
      "charter",
      "target_state_architecture",
      "solution_design",
      "roadmap",
    ]) {
      const expected = resolveQualityBar("moves", type);
      const actual = barFor(type);
      // Everything except the deliberate source-register override.
      const actualRest = { ...actual, requiresSourceRegister: undefined };
      const expectedRest = { ...expected, requiresSourceRegister: undefined };
      expect(actualRest).toEqual(expectedRest);
    }
  });

  it("keeps the source register mandatory for board-grade Move artifacts", () => {
    // Deliberately stricter than the generic builder's `evidence.length > 0`:
    // a Move artifact is gated on governed evidence upstream, so a missing
    // register here is a real defect rather than an empty-bundle edge case.
    expect(barFor("business_case").requiresSourceRegister).toBe(true);
    expect(barFor("charter").requiresSourceRegister).toBe(true);
  });

  it("executes the design-guide registry guidance in its fixed-size generation prompt", () => {
    const { request } = buildMoveDeliverableRequest(move(), {
      deliverableType: "design_workshop_guide",
      phaseOrStage: "P2_discover_and_diagnose",
      artifactStandard: "moves.design_workshop_guide",
      decisionContext: "Prepare focused, estimate-ready design sessions.",
    });
    const brief = getArtifactBrief(request);
    const prompt = buildPassPrompt("full_draft", {
      req: request,
      brief,
      evidence: request.governedEvidenceBundle,
      approvedPlanJson: "{}",
    }).user;
    const synthesisPrompt = buildPassPrompt("synthesis", {
      req: request,
      brief,
      evidence: request.governedEvidenceBundle,
      sectionDrafts: [],
    }).user;
    const sectionPrompt = buildPassPrompt("section_draft", {
      req: request,
      brief,
      evidence: request.governedEvidenceBundle,
      section: {
        key: "design_session_plan",
        title: "Design Sessions & Decisions",
        rationale:
          "Define the minimum sessions required for estimate-ready scope.",
        groundingMode: "mixed",
        evidenceCitations: [],
        assumptionsUsed: [],
        placeholders: [],
      },
      outlineSummary: "1. Design Sessions & Decisions",
    }).user;
    const redTeamPrompt = buildPassPrompt("red_team", {
      req: request,
      brief,
      evidence: request.governedEvidenceBundle,
      draftMarkdown: "draft",
    }).user;
    const renderPrompt = buildPassPrompt("render_package", {
      req: request,
      brief,
      evidence: request.governedEvidenceBundle,
      revisedDraftMarkdown: "draft",
    }).user;

    expect(request.generationPromptGuidance).toEqual(
      expect.stringContaining("not a second Discovery Report"),
    );
    expect(prompt).toContain(request.generationPromptGuidance ?? "");
    expect(prompt).toContain("Use exactly the five required sections");
    expect(prompt).toContain("at or below 3,000 words");
    expect(prompt).toContain("estimate-ready scope");
    expect(prompt).not.toContain("crisp sponsor decision memo");
    expect(prompt).toContain(
      "No cover memo, table of contents, generic risk register",
    );
    expect(prompt).toContain("EXPECTED TABLES: only the compact tables");
    expect(prompt).toContain(
      "EXPECTED EXHIBITS:\n  (none; use only the required guide sections)",
    );
    expect(prompt).not.toContain("risk/issues/dependencies table");
    expect(prompt).not.toContain("clear recommendation with next steps");
    expect(sectionPrompt).toContain(
      "Hard cap for this section: 700 body words",
    );
    expect(sectionPrompt).toContain(
      "Write client-ready facilitation-guide Markdown",
    );
    expect(redTeamPrompt).toContain("Do not request a generic risk register");
    expect(redTeamPrompt).not.toContain("too short for a board-grade artifact");
    expect(synthesisPrompt).toContain(
      "Include only tables required by the brief",
    );
    expect(synthesisPrompt).toContain("not a decision ask");
    expect(synthesisPrompt).toContain("do not create a project execution plan");
    expect(synthesisPrompt).not.toContain(
      '"tables" MUST include a risk/issues/dependencies table',
    );
    expect(renderPrompt).toContain("Preserve the five required sections");
    expect(renderPrompt).not.toContain("preserve all content, citations");
    expect(request.qualityBar.targetBodyWordsMax).toBe(3_000);
    expect(request.qualityBar.enforceMaxAsBlocker).toBe(true);
  });
});
