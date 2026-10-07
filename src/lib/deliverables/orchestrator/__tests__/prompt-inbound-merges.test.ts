/**
 * Proof that an absorbed artifact's subject matter reaches the PARENT's prompt.
 *
 * The callee is pinned next to its own module. This file pins the wiring, which
 * is the part that was actually missing: adaptive depth resolved an artifact to
 * `merge_into_parent`, the generate-phase route dropped it from the build, and
 * the only statement of the merge went into the dropped artifact's own prompt.
 * Testing the computation alone would stay green with the caller unwired, so
 * these cases go through `buildPassPrompt` — the real prompt the model is sent.
 */
import { buildPassPrompt } from "../prompt-builder";
import { getArtifactBrief } from "../artifact-brief-registry";
import { resolveQualityBar } from "../quality-bar-registry";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";
import {
  resolveAdaptiveDepth,
  type AdaptiveDepthDecision,
} from "@/lib/deliverables/adaptive-depth";
import { resolvePhaseBuildSet } from "@/lib/programs/phase-build-set";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";

const STRAIGHTFORWARD =
  "straightforward simple bounded single process one data source fixed analytics outputs no ai no vendor";

/** The decision exactly as the generate-phase route builds it for a phase. */
function decisionForPhase(phase: number): AdaptiveDepthDecision {
  const buildSet = resolvePhaseBuildSet(phase, null);
  return resolveAdaptiveDepth({
    archetype: "governed_data_foundation",
    text: STRAIGHTFORWARD,
    artifactKeys: [
      ...buildSet.declaredKeys,
      ...buildSet.declaredKeys.map(orchestratorDeliverableType),
    ],
  });
}

function promptFor(
  deliverableType: string,
  adaptiveDepth?: AdaptiveDepthDecision,
): string {
  const base = amsRfpRequest();
  const req: DeliverableIntelligenceRequest = {
    ...base,
    module: "moves",
    deliverableType,
    qualityBar: resolveQualityBar("moves", deliverableType),
    ...(adaptiveDepth ? { adaptiveDepth } : {}),
  };
  const brief = getArtifactBrief(req);
  return buildPassPrompt("full_draft", {
    req,
    brief,
    evidence: req.governedEvidenceBundle,
    approvedPlanJson: "{}",
  }).user;
}

describe("an absorbed artifact reaches the parent's prompt", () => {
  it("tells the discovery report to carry the root-cause worksheet", () => {
    const prompt = promptFor("discovery_report", decisionForPhase(2));

    expect(prompt).toContain("ABSORBED ARTIFACTS");
    expect(prompt).toContain("root_cause_worksheet");
    expect(prompt).toMatch(/root-cause/i);
  });

  it("tells the solution design to carry the operating model", () => {
    const prompt = promptFor("solution_design", decisionForPhase(3));

    expect(prompt).toContain("ABSORBED ARTIFACTS");
    expect(prompt).toContain("operating_model");
  });

  it("names the absorbed operating model exactly once", () => {
    const prompt = promptFor("solution_design", decisionForPhase(3));

    // The decision carries two spellings of that one artifact; the prompt must
    // not ask for the same document twice.
    const bulletLines = prompt
      .split("\n")
      .filter((line) => line.startsWith("- operating_model"));
    expect(bulletLines).toHaveLength(1);
  });

  it("says nothing to an artifact that absorbed nothing", () => {
    const prompt = promptFor("target_state_architecture", decisionForPhase(3));

    expect(prompt).not.toContain("ABSORBED ARTIFACTS");
  });

  it("says nothing when no adaptive-depth decision was resolved", () => {
    const prompt = promptFor("solution_design");

    expect(prompt).not.toContain("ABSORBED ARTIFACTS");
  });

  it("says nothing at a tier that merges nothing", () => {
    const buildSet = resolvePhaseBuildSet(3, null);
    const complex = resolveAdaptiveDepth({
      archetype: "governed_data_foundation",
      text: "complex multi-source identity resolution 12 data sources 9 business processes real-time ai agent vendor sourcing clinical regulatory operating model impact novel platform",
      artifactKeys: [
        ...buildSet.declaredKeys,
        ...buildSet.declaredKeys.map(orchestratorDeliverableType),
      ],
    });
    expect(complex.complexityTier).toBe("complex");

    expect(promptFor("solution_design", complex)).not.toContain(
      "ABSORBED ARTIFACTS",
    );
  });

  it("keeps the absorbed block alongside the adaptive-depth block, not instead of it", () => {
    const prompt = promptFor("solution_design", decisionForPhase(3));

    // The original block still has to be there — this was an addition, and a
    // mutation that returned the inbound text in its place would otherwise pass.
    expect(prompt).toContain("ADAPTIVE DEPTH - DETERMINISTIC RESOLUTION:");
    expect(prompt.indexOf("ADAPTIVE DEPTH - DETERMINISTIC RESOLUTION:")).
      toBeLessThan(prompt.indexOf("ABSORBED ARTIFACTS"));
  });

  it("is withheld from a non-moves module even when a decision is present", () => {
    const base = amsRfpRequest();
    const req: DeliverableIntelligenceRequest = {
      ...base,
      deliverableType: "solution_design",
      adaptiveDepth: decisionForPhase(3),
    };
    const brief = getArtifactBrief(req);
    const prompt = buildPassPrompt("full_draft", {
      req,
      brief,
      evidence: req.governedEvidenceBundle,
      approvedPlanJson: "{}",
    }).user;

    expect(req.module).not.toBe("moves");
    expect(prompt).not.toContain("ABSORBED ARTIFACTS");
  });
});
