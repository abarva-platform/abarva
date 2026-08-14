import { deriveSourceEvidenceLifecycle } from "@/lib/source/evidence-lifecycle";
import type { SourceEvidenceRequirement } from "@/lib/source/canonical-specs";
import type { SourceEventEvidence } from "@/lib/source/canvas-substrate";

function requirement(
  overrides: Partial<SourceEvidenceRequirement> = {},
): SourceEvidenceRequirement {
  return {
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    stage: "scope",
    label: "Application inventory",
    evidenceClass: "scope",
    sourceLabel: "CMDB",
    sourceSystems: ["ServiceNow CMDB"],
    acceptedFileTypes: ["xlsx", "csv"],
    recordGrain: "one application per row",
    criticalFields: ["application_id"],
    filenameTokens: ["application"],
    qualityChecks: ["Stable application id is present"],
    minimumState: "Available",
    level: "required",
    description: "Scope evidence fixture.",
    unlocks: "Scope gate.",
    ...overrides,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> = {},
): Pick<
  SourceEventEvidence,
  "currentState" | "sourceArtifactId" | "sourceEventFactIds"
> {
  return {
    currentState: "Not Requested",
    sourceArtifactId: null,
    sourceEventFactIds: [],
    ...overrides,
  };
}

describe("deriveSourceEvidenceLifecycle", () => {
  it("keeps an uploaded file from being treated as ready", () => {
    const result = deriveSourceEvidenceLifecycle({
      requirement: requirement(),
      evidence: evidence({
        currentState: "Loaded",
        sourceArtifactId: "artifact-1",
      }),
      artifact: {
        parseStatus: "pending",
        embeddingStatus: "pending",
        evidenceState: "unparsed",
        approvalState: "draft",
      },
    });

    expect(result.status).toBe("uploaded");
    expect(result.uploaded).toBe(true);
    expect(result.parsed).toBe(false);
    expect(result.stageReady).toBe(false);
    expect(result.blocksGate).toBe(true);
  });

  it("keeps parsed evidence separate from cited and accepted evidence", () => {
    const result = deriveSourceEvidenceLifecycle({
      requirement: requirement(),
      evidence: evidence({
        currentState: "Parsed",
        sourceArtifactId: "artifact-1",
      }),
      artifact: {
        parseStatus: "parsed",
        embeddingStatus: "pending",
        evidenceState: "parsed_uncited",
        approvalState: "draft",
      },
    });

    expect(result.status).toBe("parsed");
    expect(result.parsed).toBe(true);
    expect(result.cited).toBe(false);
    expect(result.accepted).toBe(false);
    expect(result.stageReady).toBe(false);
  });

  it("requires citation and acceptance before stage ready", () => {
    const citedOnly = deriveSourceEvidenceLifecycle({
      requirement: requirement(),
      evidence: evidence({
        currentState: "Available",
        sourceArtifactId: "artifact-1",
        sourceEventFactIds: ["fact-1"],
      }),
      artifact: {
        parseStatus: "parsed",
        embeddingStatus: "embedded",
        evidenceState: "cited",
        approvalState: "in_review",
      },
    });

    expect(citedOnly.status).toBe("cited");
    expect(citedOnly.meetsMinimumState).toBe(true);
    expect(citedOnly.stageReady).toBe(false);

    const accepted = deriveSourceEvidenceLifecycle({
      requirement: requirement(),
      evidence: evidence({
        currentState: "Usable Evidence",
        sourceArtifactId: "artifact-1",
        sourceEventFactIds: ["fact-1"],
      }),
      artifact: {
        parseStatus: "parsed",
        embeddingStatus: "embedded",
        evidenceState: "cited",
        approvalState: "approved",
      },
    });

    expect(accepted.status).toBe("stage_ready");
    expect(accepted.stageReady).toBe(true);
    expect(accepted.blocksGate).toBe(false);
  });

  it("blocks required stale, low-confidence, and rejected evidence", () => {
    expect(
      deriveSourceEvidenceLifecycle({
        requirement: requirement(),
        evidence: evidence({ currentState: "Stale" }),
      }).status,
    ).toBe("stale");

    expect(
      deriveSourceEvidenceLifecycle({
        requirement: requirement(),
        evidence: evidence({ currentState: "Low Confidence" }),
      }).status,
    ).toBe("low_confidence");

    const rejected = deriveSourceEvidenceLifecycle({
      requirement: requirement(),
      evidence: evidence({
        currentState: "Usable Evidence",
        sourceArtifactId: "artifact-1",
      }),
      artifact: {
        parseStatus: "parsed",
        evidenceState: "cited",
        approvalState: "rejected",
      },
    });

    expect(rejected.status).toBe("rejected");
    expect(rejected.blocksGate).toBe(true);
    expect(rejected.stageReady).toBe(false);
  });
});
