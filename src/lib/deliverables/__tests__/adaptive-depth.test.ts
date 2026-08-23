import {
  adaptArtifactBriefForDepth,
  renderAdaptiveDepthPrompt,
  resolveAdaptiveDepth,
  shouldGenerateArtifact,
} from "../adaptive-depth";
import { buildDeliverableRequest } from "../orchestrator/build-request";
import { getArtifactBrief } from "../orchestrator/artifact-brief-registry";
import { buildPassPrompt } from "../orchestrator/prompt-builder";

describe("Moves adaptive depth", () => {
  it("does not assign AI/model-risk story beats to a straightforward dashboard use case", () => {
    const decision = resolveAdaptiveDepth({
      text: "Straightforward executive dashboard for weekly KPI visibility; reusable reporting view.",
      signals: {
        declaredStraightforward: true,
        aiAgentComponent: false,
        modelAiComplexity: false,
      },
      artifactKeys: ["target_state_architecture"],
    });

    expect(decision.complexityTier).toBe("straightforward");
    expect(decision.storyBeatApplicability.ai_orchestration).toEqual(
      expect.objectContaining({ applicability: "not_applicable" }),
    );
    expect(renderAdaptiveDepthPrompt(decision)).toContain(
      "Do not include AI/model-risk",
    );
  });

  it("omits Sourcing Strategy when no vendor/build-buy decision exists", () => {
    const decision = resolveAdaptiveDepth({
      text: "Straightforward dashboard using an approved reusable internal pattern.",
      signals: {
        declaredStraightforward: true,
        vendorSourcingDecision: false,
      },
      artifactKeys: ["solution_design", "sourcing_strategy"],
    });

    expect(shouldGenerateArtifact(decision, "solution_design")).toBe(true);
    expect(shouldGenerateArtifact(decision, "sourcing_strategy")).toBe(false);
    expect(decision.artifactApplicability.sourcing_strategy).toEqual(
      expect.objectContaining({ applicability: "not_applicable" }),
    );
  });

  it("does not ask for fabricated Basic / Intermediate / Advanced options for a simple approved pattern", () => {
    const decision = resolveAdaptiveDepth({
      text: "Straightforward simple approved pattern: reuse existing governed dashboard pattern.",
      signals: {
        declaredStraightforward: true,
        vendorSourcingDecision: false,
      },
      artifactKeys: ["solution_approach_options"],
    });
    const prompt = renderAdaptiveDepthPrompt(
      decision,
      "solution_approach_options",
    );

    expect(prompt).toContain(
      "Do not invent Basic / Intermediate / Advanced options",
    );
  });

  it("omits physical architecture when deployment decisions are not mature", () => {
    const decision = resolveAdaptiveDepth({
      text: "Straightforward dashboard; no deployment topology decision yet.",
      signals: {
        declaredStraightforward: true,
        deploymentTopologyMature: false,
        securityBoundariesKnown: false,
        integrationPointCount: 0,
      },
      artifactKeys: ["target_state_architecture"],
    });
    const req = buildDeliverableRequest(
      {
        module: "moves",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
        deliverableType: "target_state_architecture",
        decisionContext: "Approve the lightweight architecture direction.",
        clientDisplayName: "Client",
        initiativeDisplayName: "Move",
        adaptiveDepth: decision,
      },
      [],
      [],
    );
    const brief = adaptArtifactBriefForDepth(req, getArtifactBrief(req));

    expect(
      brief.recommendedStructure.some((s) => s.key === "physical_architecture"),
    ).toBe(false);
    expect(
      brief.expectedExhibits.some((e) => e.key === "physical_architecture"),
    ).toBe(false);
  });

  it("keeps a required dimension as Insufficient Evidence rather than Not Applicable when evidence is missing", () => {
    const decision = resolveAdaptiveDepth({
      text: "Architecture needs a physical deployment decision but evidence is missing.",
      signals: {
        missingRequiredDimensions: ["physical_architecture"],
        deploymentTopologyMature: false,
      },
      artifactKeys: ["target_state_architecture"],
    });

    expect(decision.storyBeatApplicability.physical_architecture).toEqual(
      expect.objectContaining({
        applicability: "required",
        evidenceState: "insufficient_evidence",
      }),
    );
    expect(renderAdaptiveDepthPrompt(decision)).toContain(
      "Insufficient Evidence",
    );
  });

  it("keeps simple artifacts evidence-grounded and decision-oriented", () => {
    const decision = resolveAdaptiveDepth({
      text: "Straightforward dashboard; reusable pattern; no AI.",
      signals: { declaredStraightforward: true },
      artifactKeys: ["solution_design"],
    });
    const req = buildDeliverableRequest(
      {
        module: "moves",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
        deliverableType: "solution_design",
        decisionContext: "Confirm the solution design.",
        clientDisplayName: "Client",
        initiativeDisplayName: "Move",
        adaptiveDepth: decision,
      },
      [
        {
          citationNumber: 1,
          label: "Approved pattern",
          statement: "The move uses a reusable internal dashboard pattern.",
          evidenceFamily: "approved_solution_option",
          confidence: "high",
          disclosureTier: "internal_only",
          provenanceRef: "test",
        },
      ],
      [],
    );
    const prompt = buildPassPrompt("architect", {
      req,
      brief: adaptArtifactBriefForDepth(req, getArtifactBrief(req)),
      evidence: req.governedEvidenceBundle,
    });

    expect(prompt.user).toContain("Resolved complexity tier: straightforward");
    expect(prompt.user).toContain("Cite every client-specific fact");
    expect(prompt.user).toContain("decision");
  });

  it("keeps full required depth for complex regulated AI use cases", () => {
    const decision = resolveAdaptiveDepth({
      text: "Complex regulated clinical AI workflow with patient safety, human approval, model risk, identity resolution, real-time integration, vendor evaluation, and operating-model change.",
      artifactKeys: [
        "target_state_architecture",
        "operating_model_design",
        "sourcing_strategy",
      ],
    });

    expect(decision.complexityTier).toBe("complex");
    expect(decision.artifactApplicability.target_state_architecture).toEqual(
      expect.objectContaining({ applicability: "required" }),
    );
    expect(decision.artifactApplicability.operating_model_design).toEqual(
      expect.objectContaining({ applicability: "required" }),
    );
    expect(decision.artifactApplicability.sourcing_strategy).toEqual(
      expect.objectContaining({ applicability: "required" }),
    );
    expect(decision.storyBeatApplicability.ai_orchestration).toEqual(
      expect.objectContaining({ applicability: "triggered" }),
    );
    expect(decision.storyBeatApplicability.human_in_loop_design).toEqual(
      expect.objectContaining({ applicability: "triggered" }),
    );
  });
});
