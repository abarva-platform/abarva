// Mode-specific grounding for Phase A's 6 answer modes. Each builder must read
// the SAME structures the canvas already trusts (stage view tasks/gate,
// artifact registry records, template-fact presence) and never invent a
// number/state the data doesn't show — this suite fixtures a known event with
// known facts/artifacts/gate state and asserts the grounding block reflects it.

import { buildModeGrounding } from "../mode-grounding";
import { SAMPLE_SCOPE_STAGE } from "@/components/source/canvas/analytics/sample-view-model";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";

const EVENT = {
  code: "SRC-AMS-2026-001",
  name: "Lakeshore AMS Consolidation",
  currentStageKey: "rfp",
  blocker: "Awaiting signed sponsor letter",
  nextAction: "Upload the signed sponsor letter",
};

function artifactFixture(
  overrides: Partial<SourceArtifactRegistryRecord>,
): SourceArtifactRegistryRecord {
  return {
    id: "artifact-1",
    tenantKey: "lakeshore",
    sourceEventId: "event-1",
    sourceEventRowId: null,
    stageKey: "scope",
    artifactFamily: "scope_document",
    artifactKind: "scope_memo",
    sourceOrigin: "uploaded",
    sourceFormat: "pdf",
    originalName: "Scope Memo v1.pdf",
    blobUri: "blob://scope-memo-v1",
    uploaderUserId: "user-1",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    sha256: "abc123",
    parseStatus: "parsed",
    embeddingStatus: "embedded",
    graphStatus: "projected",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "cited",
    approvalState: "approved",
    version: 1,
    supersedesArtifactVersionId: null,
    createdBy: "user-1",
    validatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("buildModeGrounding — event_status", () => {
  it("names the current stage, stage-of-11, and the named blocker/next action", () => {
    const result = buildModeGrounding({
      mode: "event_status",
      event: EVENT,
      viewStageKey: "rfp",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });
    expect(result.block).toContain("RFP");
    expect(result.block).toContain("3 of 11");
    expect(result.block).toContain("Awaiting signed sponsor letter");
    expect(result.block).toContain("Upload the signed sponsor letter");
    expect(result.quotableFacts.currentStageLabel).toBe("RFP");
  });

  it("lists completed and remaining stages honestly relative to current stage", () => {
    const result = buildModeGrounding({
      mode: "event_status",
      event: { ...EVENT, currentStageKey: "strategy" },
      viewStageKey: "strategy",
    });
    expect(result.block).toContain("Completed stages: none yet");
    expect(result.block).toContain("Remaining stages:");
    expect(result.block).toContain("Value"); // last stage should be in remaining list
  });

  it("does not call prior stages complete from position when approval evidence is absent", () => {
    const result = buildModeGrounding({
      mode: "event_status",
      event: { ...EVENT, currentStageKey: "scope" },
      viewStageKey: "scope",
      approvedStageKeys: [],
    });

    expect(result.block).toContain(
      "Completed stages with approval evidence: none.",
    );
    expect(result.block).toContain(
      "Prior stages without approval evidence: Strategy.",
    );
    expect(result.block).toContain(
      "do not say all prior stages are completed",
    );
    expect(result.block).not.toContain("Completed stages: Strategy.");
    expect(result.quotableFacts.approvalEvidencedStageCount).toBe("0");
    expect(result.quotableFacts.priorStagesWithoutApprovalEvidence).toBe("1");
  });
});

describe("buildModeGrounding — workflow_how_to", () => {
  it("maps 'upload the final reviewed version' to the PROVIDE task dropzone action", () => {
    const result = buildModeGrounding({
      mode: "workflow_how_to",
      event: EVENT,
      question: "How do I upload the final reviewed version?",
    });
    expect(result.block).toContain("PROVIDE task dropzone");
    expect(result.block).toContain("supersedes");
  });

  it("maps 'advance the stage' to the gate Approve button + confirm requirements", () => {
    const result = buildModeGrounding({
      mode: "workflow_how_to",
      event: EVENT,
      question: "How do I advance the stage?",
    });
    expect(result.block).toContain("Approve button");
    expect(result.block).toContain("confirm box");
  });

  it("falls back to a generic-but-still-deterministic action for an unmatched how-to question", () => {
    const result = buildModeGrounding({
      mode: "workflow_how_to",
      event: EVENT,
      question: "How do I do the thing?",
    });
    expect(result.block.length).toBeGreaterThan(0);
  });
});

describe("buildModeGrounding — evidence_readiness", () => {
  it("separates present vs missing provide-tasks using template-fact presence", () => {
    const stageView: StageAnalyticsView = {
      ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
      stageKey: "scope",
      stageName: "Scope",
      tasks: [
        {
          id: "scope.volumetrics",
          title: "Provide the volumetrics",
          subtitle: "Ticket history",
          type: "provide",
          state: "todo",
          guide: "Upload your ticket history.",
          cta: "Confirm volumetrics",
          factTemplateCode: "VOLUMETRICS_V1",
        },
        {
          id: "scope.app-inventory",
          title: "Provide the application inventory",
          subtitle: "Run cost per app",
          type: "provide",
          state: "todo",
          guide: "Upload your application inventory.",
          cta: "Confirm inventory",
          factTemplateCode: "APP_INVENTORY_V1",
        },
      ],
    };
    const result = buildModeGrounding({
      mode: "evidence_readiness",
      event: EVENT,
      stageView,
      // No fact inputs at all — both tasks should read as missing.
      factInputs: {},
      artifacts: [],
    });
    expect(result.block).toContain("Missing");
    expect(result.block).toContain("Provide the volumetrics");
    expect(result.block).toContain("Provide the application inventory");
    expect(result.quotableFacts.evidenceMissingCount).toBe("2");
  });

  it("says nothing is missing when a stage view has no provide tasks left open", () => {
    const stageView: StageAnalyticsView = {
      ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
      tasks: [],
    };
    const result = buildModeGrounding({
      mode: "evidence_readiness",
      event: EVENT,
      stageView,
    });
    expect(result.block).toContain("none");
  });

  it("is honest when no stage view is available — does not claim presence or absence", () => {
    const result = buildModeGrounding({
      mode: "evidence_readiness",
      event: EVENT,
      stageView: null,
    });
    expect(result.block).toContain("not been computed");
  });
});

describe("buildModeGrounding — artifact_lineage", () => {
  it("names the current version and lists prior versions as remaining available in history", () => {
    const older = artifactFixture({
      id: "artifact-old",
      version: 1,
      originalName: "Scope Memo v1.pdf",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      isCurrentAuthoritative: false,
    });
    const newer = artifactFixture({
      id: "artifact-new",
      version: 2,
      originalName: "Scope Memo v2 (client final).pdf",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
      isClientFinal: true,
      isCurrentAuthoritative: true,
    });
    const result = buildModeGrounding({
      mode: "artifact_lineage",
      event: EVENT,
      artifacts: [older, newer],
    });
    expect(result.block).toContain("Scope Memo v2 (client final).pdf");
    expect(result.block).toContain("v2");
    expect(result.block).toContain("remain available in history");
    expect(result.block).toContain("Scope Memo v1.pdf");
  });

  it("is honest when no artifacts exist", () => {
    const result = buildModeGrounding({
      mode: "artifact_lineage",
      event: EVENT,
      artifacts: [],
    });
    expect(result.block).toContain("no artifacts are registered");
  });
});

describe("buildModeGrounding — artifact_finality", () => {
  it("marks the client-final upload authoritative and the prior draft superseded", () => {
    const generated = artifactFixture({
      id: "artifact-draft",
      version: 1,
      originalName: "Scope Memo (generated draft).pdf",
      sourceOrigin: "generated",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const clientFinal = artifactFixture({
      id: "artifact-final",
      version: 2,
      originalName: "Scope Memo (client final).pdf",
      sourceOrigin: "uploaded",
      isClientFinal: true,
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
    const result = buildModeGrounding({
      mode: "artifact_finality",
      event: EVENT,
      artifacts: [generated, clientFinal],
    });
    expect(result.block).toContain("Scope Memo (client final).pdf: AUTHORITATIVE");
    expect(result.block).toContain("marked client-final");
    expect(result.block).toContain("Superseded but remains available in history");
    expect(result.block).toContain("Scope Memo (generated draft).pdf");
  });

  it("falls back to recency (not a fabricated finality flag) when no flag is persisted", () => {
    const first = artifactFixture({
      id: "artifact-a",
      version: 1,
      originalName: "Notes A.docx",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const second = artifactFixture({
      id: "artifact-b",
      version: 2,
      originalName: "Notes B.docx",
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    });
    const result = buildModeGrounding({
      mode: "artifact_finality",
      event: EVENT,
      artifacts: [first, second],
    });
    expect(result.block).toContain("Notes B.docx: AUTHORITATIVE");
    expect(result.block).toContain("treated as authoritative by recency");
  });

  it("is honest when no artifacts exist", () => {
    const result = buildModeGrounding({
      mode: "artifact_finality",
      event: EVENT,
      artifacts: [],
    });
    expect(result.block).toContain("no artifacts are registered");
  });
});

describe("buildModeGrounding — stage_gate", () => {
  it("names the gate's confirm items and marks the evidence box MET when all tasks are complete", () => {
    const stageView: StageAnalyticsView = {
      ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({ ...t, evidenceComplete: true })),
    };
    const result = buildModeGrounding({
      mode: "stage_gate",
      event: EVENT,
      viewStageKey: "scope",
      stageView,
    });
    expect(result.block).toContain("Evidence complete");
    expect(result.block).toContain("MET");
    expect(result.quotableFacts.gateAllTasksComplete).toBe("true");
  });

  it("marks the evidence box UNMET when a task is still open", () => {
    const stageView: StageAnalyticsView = {
      ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({ ...t, evidenceComplete: false, state: "todo" as const })),
    };
    const result = buildModeGrounding({
      mode: "stage_gate",
      event: EVENT,
      viewStageKey: "scope",
      stageView,
    });
    expect(result.block).toContain("UNMET");
    expect(result.quotableFacts.gateAllTasksComplete).toBe("false");
  });

  it("does not fabricate a met/unmet state for non-evidence confirm boxes — requires human confirmation", () => {
    const result = buildModeGrounding({
      mode: "stage_gate",
      event: EVENT,
      viewStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });
    expect(result.block).toContain("requires human confirmation");
  });

  it("is honest when no live gate view is available", () => {
    const result = buildModeGrounding({
      mode: "stage_gate",
      event: EVENT,
      viewStageKey: "scope",
      stageView: null,
    });
    expect(result.block).toContain("not been computed");
  });
});

describe("buildModeGrounding — non-Phase-A modes return an empty result", () => {
  it("returns an empty block/facts for a deferred mode", () => {
    const result = buildModeGrounding({
      mode: "value_at_stake",
      event: EVENT,
    });
    expect(result.block).toBe("");
    expect(result.quotableFacts).toEqual({});
  });
});
