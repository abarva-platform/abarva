import {
  computeRequirementCoverage,
  computeStageRequirementCoverage,
} from "@/lib/source/requirement-coverage";
import {
  requiredEvidenceForStage,
  requiredSpecsForStage,
} from "@/lib/source/canonical-specs";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
} from "@/lib/source/canvas-substrate";
import type {
  SourceArtifactSpec,
  SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs";

function requiredArtifact(code: string): SourceArtifactSpec {
  return {
    code,
    name: code,
    description: "",
    stage: "scope",
    family: "scope_document",
    requirementLevel: "required",
    gateDefining: true,
    defaultTier: "stub",
  };
}

function requiredEvidence(
  requirementId: string,
  minimumState: SourceEvidenceRequirement["minimumState"] = "Available",
): SourceEvidenceRequirement {
  return {
    requirementId,
    stage: "scope",
    label: requirementId,
    evidenceClass: "scope",
    sourceLabel: "",
    sourceSystems: ["Test source system"],
    acceptedFileTypes: ["csv"],
    recordGrain: "one test record per row",
    criticalFields: ["record_id"],
    filenameTokens: ["test"],
    qualityChecks: ["Test fixture quality check"],
    minimumState,
    level: "required",
    description: "",
    unlocks: "",
  };
}

function artifactState(
  artifactCode: string,
  status: SourceEventArtifactState["status"] = "not_started",
): SourceEventArtifactState {
  return {
    artifactCode,
    status,
  } as SourceEventArtifactState;
}

function evidenceState(
  requirementId: string,
  currentState: SourceEventEvidence["currentState"] = "Loaded",
): SourceEventEvidence {
  return {
    requirementId,
    currentState,
  } as SourceEventEvidence;
}

describe("requirement coverage", () => {
  it("renders an honest none-defined state instead of 0 / 0", () => {
    expect(
      computeRequirementCoverage({
        requiredArtifacts: [],
        requiredEvidence: [],
        artifactStates: [],
        evidenceStates: [],
      }),
    ).toEqual({
      met: 0,
      required: 0,
      displayValue: "no requirements defined",
    });
  });

  it("reports 0 / n when requirements exist without matching state", () => {
    expect(
      computeRequirementCoverage({
        requiredArtifacts: [requiredArtifact("d05_scope_memo")],
        requiredEvidence: [requiredEvidence("EVID-SCOPE-APP-INV")],
        artifactStates: [],
        evidenceStates: [],
      }).displayValue,
    ).toBe("0 / 2");
  });

  it("ignores unrelated evidence", () => {
    expect(
      computeRequirementCoverage({
        requiredArtifacts: [],
        requiredEvidence: [requiredEvidence("EVID-SCOPE-APP-INV")],
        artifactStates: [],
        evidenceStates: [evidenceState("EVID-OTHER", "Usable Evidence")],
      }).displayValue,
    ).toBe("0 / 1");
  });

  it("increments for qualifying artifact and evidence state", () => {
    expect(
      computeRequirementCoverage({
        requiredArtifacts: [requiredArtifact("d05_scope_memo")],
        requiredEvidence: [requiredEvidence("EVID-SCOPE-APP-INV")],
        artifactStates: [artifactState("d05_scope_memo", "approved")],
        evidenceStates: [evidenceState("EVID-SCOPE-APP-INV", "Available")],
      }).displayValue,
    ).toBe("2 / 2");
  });

  it("does not double count duplicate matching rows", () => {
    expect(
      computeRequirementCoverage({
        requiredArtifacts: [requiredArtifact("d05_scope_memo")],
        requiredEvidence: [requiredEvidence("EVID-SCOPE-APP-INV")],
        artifactStates: [
          artifactState("d05_scope_memo", "approved"),
          artifactState("d05_scope_memo", "locked"),
        ],
        evidenceStates: [
          evidenceState("EVID-SCOPE-APP-INV", "Available"),
          evidenceState("EVID-SCOPE-APP-INV", "Usable Evidence"),
        ],
      }).displayValue,
    ).toBe("2 / 2");
  });

  it("treats upload-only evidence as coverage only when canonical minimum allows it", () => {
    expect(
      computeRequirementCoverage({
        requiredArtifacts: [],
        requiredEvidence: [requiredEvidence("EVID-SCOPE-APP-INV", "Available")],
        artifactStates: [],
        evidenceStates: [evidenceState("EVID-SCOPE-APP-INV", "Loaded")],
      }).displayValue,
    ).toBe("0 / 1");

    expect(
      computeRequirementCoverage({
        requiredArtifacts: [],
        requiredEvidence: [
          requiredEvidence("EVID-STR-SPONSOR-COMMIT", "Loaded"),
        ],
        artifactStates: [],
        evidenceStates: [evidenceState("EVID-STR-SPONSOR-COMMIT", "Loaded")],
      }).displayValue,
    ).toBe("1 / 1");
  });

  it("uses the canonical stage catalog for the canvas strip", () => {
    const required =
      requiredSpecsForStage("scope").length +
      requiredEvidenceForStage("scope").length;
    expect(
      computeStageRequirementCoverage({
        stageKey: "scope",
        artifactStates: [],
        evidenceStates: [],
      }).displayValue,
    ).toBe(`0 / ${required}`);
  });

  it("excludes only sponsor commitment from SELF Strategy coverage", () => {
    const legacy = computeStageRequirementCoverage({ stageKey: "strategy", artifactStates: [], evidenceStates: [] });
    const self = computeStageRequirementCoverage({ stageKey: "strategy", artifactStates: [], evidenceStates: [], approvalPolicyCode: "self_v1" });
    expect(self.required).toBe(legacy.required - 1);
    expect(self.met).toBe(0);
  });

  it("does not count an unbacked incumbent contract as covered", () => {
    const requirement = requiredEvidenceForStage("strategy").find((row) => row.requirementId === "EVID-SRC-STR-INCUMBENT");
    expect(requirement).toBeDefined();
    expect(computeRequirementCoverage({
      requiredArtifacts: [],
      requiredEvidence: [requirement!],
      artifactStates: [],
      evidenceStates: [evidenceState("EVID-SRC-STR-INCUMBENT", "Available")],
    }).displayValue).toBe("0 / 1");
  });

  it("counts a narrowly audited absence without counting an invented agreement", () => {
    const requirement = requiredEvidenceForStage("strategy").find((row) => row.requirementId === "EVID-SRC-STR-INCUMBENT");
    expect(requirement).toBeDefined();
    const absent = {
      ...evidenceState("EVID-SRC-STR-INCUMBENT", "Not Requested"),
      sourceArtifactId: null,
      applicabilityStatus: "not_applicable" as const,
      applicabilityReason: "This is a net-new service with no incumbent agreement.",
      applicabilityActorUserId: "event-owner",
      applicabilityDecidedAt: "2026-09-28T00:00:00Z",
    };
    expect(computeRequirementCoverage({
      requiredArtifacts: [], requiredEvidence: [requirement!],
      artifactStates: [], evidenceStates: [absent],
    }).displayValue).toBe("1 / 1");
    expect(absent.currentState).toBe("Not Requested");
  });
});
