import { classifyPhaseBuildSettlement } from "../phase-build-settlement";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "../deliverable-registry";

function gateFlag(key: string): boolean {
  const spec = DELIVERABLE_REGISTRY.find(
    (entry) => entry.deliverableTypeKey === key,
  );
  if (!spec) throw new Error(`no registry spec for ${key}`);
  return spec.gateArtifact;
}

function settled(...keys: string[]) {
  return keys.map((key) => ({
    deliverableTypeKey: key,
    gateArtifact: gateFlag(key),
  }));
}

describe("the scenario this split exists for is live in the real build sets", () => {
  // Written out as literals rather than derived from the registry: an
  // expectation read off the declaration under test cannot see the declaration
  // change. If a phase's working documents are re-declared as gate artifacts,
  // this fails and the split has to be re-justified.
  const WORKING_DOCUMENTS_BY_PHASE: Record<number, string[]> = {
    1: ["discovery_plan"],
    2: ["root_cause_worksheet", "design_workshop_guide"],
    3: ["solution_design", "operating_model_design", "planning_workshop_guide"],
    4: ["financial_model", "mobilization_workshop_guide"],
    5: ["execution_kickoff_guide"],
  };

  it.each([1, 2, 3, 4, 5])(
    "P%s declares at least one document no gate check reads",
    (phase) => {
      const nonGate = PHASE_CANONICAL_KEYS[phase].filter(
        (key) => !gateFlag(key),
      );
      expect(nonGate).toEqual(WORKING_DOCUMENTS_BY_PHASE[phase]);
      expect(nonGate.length).toBeGreaterThan(0);
    },
  );

  it("still declares both P3 documents as gate artifacts on the narrowed technical route", () => {
    const narrowed = phaseCanonicalKeysForRoute(3, {
      route: "technical_product",
    } as Parameters<typeof phaseCanonicalKeysForRoute>[1]);
    expect(narrowed).toEqual([
      "target_state_architecture",
      "requirements_traceability",
    ]);
    expect(narrowed.filter((key) => !gateFlag(key))).toEqual([]);
  });
});

describe("classifyPhaseBuildSettlement", () => {
  it("submits the gate when only a working document failed, and names it", () => {
    // The case seen live: the P4 workshop guide over-ran its length ceiling
    // while every document the P4 gate reads built.
    const result = classifyPhaseBuildSettlement({
      phase: 4,
      succeeded: settled(
        "execution_roadmap",
        "business_case",
        "tower_metrics_plan",
        "readiness_and_change_plan",
      ),
      failed: settled("mobilization_workshop_guide", "financial_model"),
    });
    expect(result.refusal).toBeNull();
    expect(result.failedGateArtifacts).toEqual([]);
    expect(result.failedWorkingDocuments).toEqual([
      "mobilization_workshop_guide",
      "financial_model",
    ]);
    expect(result.workingDocumentCaveat).toContain(
      "mobilization_workshop_guide",
    );
    expect(result.workingDocumentCaveat).toContain("financial_model");
    expect(result.workingDocumentCaveat).toContain("2 working documents");
    expect(result.workingDocumentCaveat).toContain("No P4 gate check reads");
    expect(result.workingDocumentCaveat).toContain("still submitted");
  });

  it("refuses the gate when a document the gate reads failed", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 4,
      succeeded: settled("execution_roadmap"),
      failed: settled("business_case"),
    });
    expect(result.refusal).toContain("business_case");
    expect(result.refusal).toContain("1 gate document");
    expect(result.refusal).toContain("The P4 gate reads this document");
    expect(result.refusal).toContain("re-run Approve & Build");
    expect(result.failedGateArtifacts).toEqual(["business_case"]);
    expect(result.workingDocumentCaveat).toBeNull();
  });

  it("names only the gate documents in the refusal and the working ones in the caveat", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 2,
      succeeded: [],
      failed: settled(
        "discovery_report",
        "root_cause_worksheet",
        "design_workshop_guide",
      ),
    });
    expect(result.refusal).toContain("discovery_report");
    expect(result.refusal).not.toContain("root_cause_worksheet");
    expect(result.refusal).not.toContain("design_workshop_guide");
    expect(result.workingDocumentCaveat).toContain("root_cause_worksheet");
    expect(result.workingDocumentCaveat).toContain("design_workshop_guide");
    expect(result.workingDocumentCaveat).not.toContain("discovery_report");
  });

  it("refuses when nothing at all built, even with no failures recorded", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 5,
      succeeded: [],
      failed: [],
    });
    expect(result.refusal).toBe(
      "No required deliverables completed generation for P5.",
    );
    expect(result.workingDocumentCaveat).toBeNull();
  });

  it("is silent when the whole batch built", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 5,
      succeeded: settled(
        "handoff_package",
        "value_measurement_contract",
        "execution_kickoff_guide",
      ),
      failed: [],
    });
    expect(result.refusal).toBeNull();
    expect(result.workingDocumentCaveat).toBeNull();
    expect(result.failedGateArtifacts).toEqual([]);
    expect(result.failedWorkingDocuments).toEqual([]);
  });

  it("reads the singular and the phase number from the batch, not a fixed string", () => {
    const one = classifyPhaseBuildSettlement({
      phase: 1,
      succeeded: settled("charter"),
      failed: settled("discovery_plan"),
    });
    expect(one.workingDocumentCaveat).toContain("1 working document did not");
    expect(one.workingDocumentCaveat).toContain("No P1 gate check reads it");
    expect(one.workingDocumentCaveat).toContain("this document is missing");

    const two = classifyPhaseBuildSettlement({
      phase: 3,
      succeeded: settled("target_state_architecture"),
      failed: settled("solution_design", "planning_workshop_guide"),
    });
    expect(two.workingDocumentCaveat).toContain("2 working documents did not");
    expect(two.workingDocumentCaveat).toContain("No P3 gate check reads them");
    expect(two.workingDocumentCaveat).toContain("these documents are missing");
  });

  it("refuses on a gate document even when a working document also built", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 3,
      succeeded: settled("solution_design", "planning_workshop_guide"),
      failed: settled("target_state_architecture", "requirements_traceability"),
    });
    expect(result.refusal).toContain("2 gate documents");
    expect(result.refusal).toContain("were held below gate");
    expect(result.refusal).toContain("target_state_architecture");
    expect(result.refusal).toContain("requirements_traceability");
    expect(result.refusal).toContain("The P3 gate reads these documents");
  });
});
