/**
 * An artifact folded into a parent must reach the parent's prompt.
 *
 * `merge_into_parent` means the document is not built and its subject matter is
 * supposed to appear inside a named parent. The only place that was ever stated
 * was the CHILD's prompt, which is never built — so the content was dropped. The
 * cases below pin both halves: the inbound relation is computed correctly from a
 * REAL adaptive-depth decision (not a hand-built map, which is what let the
 * duplicate-spelling trap hide), and the parent's prompt states it.
 */
import {
  inboundArtifactMerges,
  renderInboundMergeInstruction,
} from "@/lib/deliverables/adaptive-depth-inbound-merges";
import {
  resolveAdaptiveDepth,
  shouldGenerateArtifact,
  type AdaptiveDepthDecision,
} from "@/lib/deliverables/adaptive-depth";
import { resolvePhaseBuildSet } from "@/lib/programs/phase-build-set";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";

/** The text that resolves the straightforward tier, where the merges happen. */
const STRAIGHTFORWARD =
  "straightforward simple bounded single process one data source fixed analytics outputs no ai no vendor";

/** Exactly what the generate-phase route builds, including BOTH key spellings. */
function decisionForPhase(phase: number, text: string): AdaptiveDepthDecision {
  const buildSet = resolvePhaseBuildSet(phase, null);
  return resolveAdaptiveDepth({
    archetype: "governed_data_foundation",
    text,
    artifactKeys: [
      ...buildSet.declaredKeys,
      ...buildSet.declaredKeys.map(orchestratorDeliverableType),
    ],
  });
}

/** The keys the route actually enqueues after adaptive-depth filtering. */
function enqueuedKeys(phase: number, decision: AdaptiveDepthDecision): string[] {
  return resolvePhaseBuildSet(phase, null).declaredKeys.filter((key) =>
    shouldGenerateArtifact(decision, key),
  );
}

describe("inboundArtifactMerges", () => {
  it("names the root-cause worksheet as inbound to the discovery report at P2", () => {
    const decision = decisionForPhase(2, STRAIGHTFORWARD);
    expect(decision.complexityTier).toBe("straightforward");

    const merges = inboundArtifactMerges(decision, "discovery_report");

    expect(merges.map((merge) => merge.artifactKey)).toEqual([
      "root_cause_worksheet",
    ]);
    expect(merges[0].reason).toMatch(/root-cause/i);
  });

  it("the absorbed child is the one the route refuses to build, and its parent is built", () => {
    const decision = decisionForPhase(2, STRAIGHTFORWARD);
    const enqueued = enqueuedKeys(2, decision);

    // Without both halves of this, the instruction would be pointless: the
    // child must be absent (nothing else will carry its content) and the
    // parent present (something must).
    expect(enqueued).not.toContain("root_cause_worksheet");
    expect(enqueued).toContain("discovery_report");
  });

  it("de-duplicates one artifact carrying two key spellings at P3", () => {
    const decision = decisionForPhase(3, STRAIGHTFORWARD);

    // The precondition this case exists for: the real decision carries BOTH
    // spellings of the single operating-model artifact, each merging into the
    // same parent. If this ever stops holding the de-duplication is untested,
    // so assert it rather than trusting it.
    const rawMergeEntries = Object.entries(decision.artifactApplicability)
      .filter(([, value]) => value.applicability === "merge_into_parent")
      .map(([key]) => key);
    expect(rawMergeEntries).toEqual(
      expect.arrayContaining(["operating_model_design", "operating_model"]),
    );

    const merges = inboundArtifactMerges(decision, "solution_design");

    // One artifact, not two.
    expect(merges).toHaveLength(1);
    expect(merges[0].artifactKey).toBe("operating_model");
  });

  // Both of today's real merge TARGETS are identity under the orchestrator map,
  // so comparing `solution_design` against its own canonical form asserts
  // nothing. These two cases use the one pair in the registry that actually
  // differs — `operating_model_design` -> `operating_model` — once on each side
  // of the comparison, so dropping canonicalisation from either side fails.
  it("matches a parent declared under its non-canonical spelling", () => {
    expect(orchestratorDeliverableType("operating_model_design")).toBe(
      "operating_model",
    );
    const decision: AdaptiveDepthDecision = {
      ...decisionForPhase(2, STRAIGHTFORWARD),
      artifactApplicability: {
        root_cause_worksheet: {
          applicability: "merge_into_parent",
          mergeInto: "operating_model_design",
          reason: "Declared against the registry spelling.",
        },
      },
    };

    expect(
      inboundArtifactMerges(decision, "operating_model").map(
        (merge) => merge.artifactKey,
      ),
    ).toEqual(["root_cause_worksheet"]);
  });

  it("matches when the caller asks under the non-canonical spelling", () => {
    const decision: AdaptiveDepthDecision = {
      ...decisionForPhase(2, STRAIGHTFORWARD),
      artifactApplicability: {
        root_cause_worksheet: {
          applicability: "merge_into_parent",
          mergeInto: "operating_model",
          reason: "Declared against the orchestrator spelling.",
        },
      },
    };

    expect(
      inboundArtifactMerges(decision, "operating_model_design").map(
        (merge) => merge.artifactKey,
      ),
    ).toEqual(["root_cause_worksheet"]);
  });

  it("returns nothing for an artifact nothing merged into", () => {
    const decision = decisionForPhase(3, STRAIGHTFORWARD);

    expect(inboundArtifactMerges(decision, "target_state_architecture")).toEqual(
      [],
    );
    // A key absent from the decision entirely is not an error either.
    expect(inboundArtifactMerges(decision, "charter")).toEqual([]);
  });

  it("returns nothing at a tier that merges nothing", () => {
    const decision = decisionForPhase(
      3,
      "complex multi-source identity resolution 12 data sources 9 business processes real-time ai agent vendor sourcing clinical regulatory operating model impact novel platform",
    );
    expect(decision.complexityTier).toBe("complex");

    expect(inboundArtifactMerges(decision, "solution_design")).toEqual([]);
    expect(inboundArtifactMerges(decision, "discovery_report")).toEqual([]);
  });

  it("ignores a merge aimed at a different parent", () => {
    const decision = decisionForPhase(3, STRAIGHTFORWARD);
    // The P3 merge targets solution_design, so the P2 parent gets nothing from
    // a P3 decision even though that artifact key exists elsewhere.
    expect(inboundArtifactMerges(decision, "discovery_report")).toEqual([]);
  });

  it("is empty without a decision or a parent key", () => {
    const decision = decisionForPhase(2, STRAIGHTFORWARD);
    expect(inboundArtifactMerges(undefined, "discovery_report")).toEqual([]);
    expect(inboundArtifactMerges(decision, undefined)).toEqual([]);
  });

  it("drops a self-merge rather than telling a document to absorb itself", () => {
    const decision: AdaptiveDepthDecision = {
      ...decisionForPhase(2, STRAIGHTFORWARD),
      artifactApplicability: {
        discovery_report: {
          applicability: "merge_into_parent",
          mergeInto: "discovery_report",
          reason: "Degenerate self-reference.",
        },
      },
    };

    expect(inboundArtifactMerges(decision, "discovery_report")).toEqual([]);
  });

  it("ignores a merge decision with no parent named", () => {
    const decision: AdaptiveDepthDecision = {
      ...decisionForPhase(2, STRAIGHTFORWARD),
      artifactApplicability: {
        root_cause_worksheet: {
          applicability: "merge_into_parent",
          reason: "No parent recorded.",
        },
      },
    };

    expect(inboundArtifactMerges(decision, "discovery_report")).toEqual([]);
  });

  it("ignores applicabilities that are not a merge", () => {
    const decision = decisionForPhase(3, STRAIGHTFORWARD);
    // A lightweight sourcing brief is a standalone gate artifact, not a merge.
    expect(
      decision.artifactApplicability.sourcing_strategy?.applicability,
    ).toBe("lightweight");
    expect(
      inboundArtifactMerges(decision, "solution_design").map(
        (merge) => merge.artifactKey,
      ),
    ).not.toContain("sourcing_strategy");
  });
});

describe("renderInboundMergeInstruction", () => {
  it("is empty when nothing merged in, so callers can concatenate it blind", () => {
    expect(renderInboundMergeInstruction([])).toBe("");
  });

  it("names each absorbed artifact and its reason", () => {
    const text = renderInboundMergeInstruction([
      { artifactKey: "operating_model", reason: "Operating impact is limited." },
    ]);

    expect(text).toContain("operating_model");
    expect(text).toContain("Operating impact is limited.");
  });

  it("states that the merge overrides the surrounding exclusion rules", () => {
    const text = renderInboundMergeInstruction([
      { artifactKey: "operating_model", reason: "Operating impact is limited." },
    ]);

    // The adaptive-depth prompt already tells the model NOT to include
    // operating-model content "unless triggered above". Without this the
    // instruction loses to that rule.
    expect(text).toMatch(/overrides/i);
    expect(text).toContain("THIS document");
  });

  it("renders one line per absorbed artifact", () => {
    const text = renderInboundMergeInstruction([
      { artifactKey: "a", reason: "ra" },
      { artifactKey: "b", reason: "rb" },
    ]);

    expect(text.split("\n").filter((line) => line.startsWith("- "))).toEqual([
      "- a: ra",
      "- b: rb",
    ]);
  });
});
