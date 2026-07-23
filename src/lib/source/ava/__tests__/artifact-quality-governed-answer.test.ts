import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import {
  buildArtifactQualityGovernedAnswer,
  governedCandidateFromSourceArtifact,
  looksLikeArtifactQualityQuestion,
  sourceDataClassificationToClassification,
} from "@/lib/source/ava/artifact-quality-governed-answer";
import { listSourceArtifactsForSourceEventIdWithContent } from "@/lib/source/artifact-registry";
import type { SourceArtifactRegistryRecordWithContent } from "@/lib/source/artifact-registry";

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventIdWithContent: jest.fn(),
}));

const mockListSourceArtifacts = jest.mocked(
  listSourceArtifactsForSourceEventIdWithContent,
);

function artifact(
  overrides: Partial<SourceArtifactRegistryRecordWithContent> = {},
): SourceArtifactRegistryRecordWithContent {
  return {
    id: "artifact-1",
    tenantKey: "apexretail",
    sourceEventId: "event-1",
    sourceEventRowId: null,
    stageKey: "scope",
    artifactFamily: "scope_document",
    artifactKind: "d05_scope_memo",
    sourceOrigin: "uploaded",
    sourceFormat: "docx",
    originalName: "Client Final Scope Memo.docx",
    blobUri: "inline://source-event-artifact-state/artifact-1",
    uploaderUserId: "user-1",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: 1200,
    sha256: "sha",
    parseStatus: "parsed",
    embeddingStatus: "pending",
    graphStatus: "pending",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "cited",
    approvalState: "approved",
    description: null,
    isClientFinal: true,
    isCurrentAuthoritative: true,
    sourceGeneratedArtifactId: null,
    clientFinalUploadedBy: "user-1",
    clientFinalUploadedAt: "2026-07-23T00:00:00.000Z",
    clientFinalAcceptedBy: "user-2",
    clientFinalAcceptedAt: "2026-07-23T01:00:00.000Z",
    clientFinalNote: "Accepted after client review.",
    clientFinalReviewMeetingDate: null,
    clientFinalStakeholderGroup: "Steering committee",
    clientFinalChangeSummary: {},
    citedSourceArtifactIds: [],
    version: 2,
    supersedesArtifactVersionId: null,
    createdBy: "user-1",
    validatedBy: null,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T01:00:00.000Z",
    deletedAt: null,
    bodyMarkdown:
      "# Scope Memo\n\n## Executive Summary\n\nThis memo names scope, baselines, responsibilities, assumptions, and approval.",
    ...overrides,
  };
}

describe("looksLikeArtifactQualityQuestion", () => {
  it("matches artifact quality and lifecycle questions", () => {
    expect(looksLikeArtifactQualityQuestion("How is artifact quality?")).toBe(
      true,
    );
    expect(
      looksLikeArtifactQualityQuestion(
        "Which files are missing or blocked for Gate B?",
      ),
    ).toBe(true);
    expect(
      looksLikeArtifactQualityQuestion("Are the client final documents ready?"),
    ).toBe(true);
    expect(
      looksLikeArtifactQualityQuestion(
        "Assess artifact lifecycle posture, client-final readiness, consulting quality, and required deliverable standards.",
      ),
    ).toBe(true);
  });

  it("does not capture unrelated Source chat turns", () => {
    expect(looksLikeArtifactQualityQuestion(undefined)).toBe(false);
    expect(looksLikeArtifactQualityQuestion("")).toBe(false);
    expect(
      looksLikeArtifactQualityQuestion(
        "How are vendors doing on response coverage?",
      ),
    ).toBe(false);
    expect(looksLikeArtifactQualityQuestion("What is the value at stake?")).toBe(
      false,
    );
  });
});

describe("sourceDataClassificationToClassification", () => {
  it("maps registry classifications to the canonical governance enum explicitly", () => {
    expect(sourceDataClassificationToClassification("Public")).toBe("public");
    expect(sourceDataClassificationToClassification("Internal")).toBe(
      "internal",
    );
    expect(sourceDataClassificationToClassification("Confidential")).toBe(
      "confidential",
    );
    expect(sourceDataClassificationToClassification("Restricted")).toBe(
      "restricted",
    );
  });
});

describe("governedCandidateFromSourceArtifact", () => {
  it("maps a registry row to an honest governed artifact candidate", () => {
    const candidate = governedCandidateFromSourceArtifact(artifact(), {
      clientKey: "apex-retail",
      tenantId: "tenant-1",
    });

    expect(candidate.source_layer).toBe("artifact");
    expect(candidate.source_basis).toBe("Client Final Scope Memo.docx");
    expect(candidate.classification).toBe("confidential");
    expect(candidate.retrievability).toBe("committed_not_indexed");
    expect(candidate.agent_readiness_status).toBe("not_reviewed");
    expect(candidate.confidence_level).toBe("high");
    expect(candidate.cited_render_verified_at).toBeNull();
    expect(candidate.citations?.[0]).toContain(
      "Client Final Scope Memo.docx",
    );
  });

  it("blocks restricted artifact rows by default through the real governance gate", () => {
    const candidate = governedCandidateFromSourceArtifact(
      artifact({ dataClassification: "Restricted" }),
      {
        clientKey: "apex-retail",
        tenantId: "tenant-1",
      },
    );

    const bundle = buildValidatedAgentContextBundle([candidate], {
      requireAgentReady: false,
    });

    expect(bundle.decision).toBe("block");
    expect(bundle.usable).toHaveLength(0);
    expect(bundle.blocked[0]?.errors[0]).toContain(
      'sensitive classification "restricted"',
    );
  });
});

describe("buildArtifactQualityGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("emits a governed chart + table from the same lifecycle matrix as Files", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact(),
      artifact({
        id: "artifact-other-tenant",
        tenantKey: "other",
        originalName: "Other Tenant Scope Memo.docx",
      }),
    ]);

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(listSourceArtifactsForSourceEventIdWithContent).toHaveBeenCalledWith(
      "event-1",
    );
    expect(answer).not.toBeNull();
    expect(answer!.tenantKey).toBe("apex-retail");
    expect(answer!.intent).toBe("artifact_quality_lifecycle");
    expect(answer!.status).toBe("answered");
    expect(answer!.artifacts.map((item) => item.artifact)).toEqual([
      "chart",
      "table",
    ]);
    expect(answer!.citations).toHaveLength(1);
    expect(answer!.citations[0]?.recordId).toBe("artifact-1");
    expect(answer!.directAnswer).toContain("1 artifacts are registered");
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
    expect(answer!.artifacts[1]).toMatchObject({
      artifact: "table",
      title: "Artifact quality and lifecycle",
    });
  });

  it("answers honestly from canonical standards when no registry rows exist", async () => {
    mockListSourceArtifacts.mockResolvedValue([]);

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-empty",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Which artifacts are missing?",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("no_data");
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.gaps).toEqual([
      expect.objectContaining({
        id: "artifact-quality-required-files-missing",
        severity: "high",
      }),
    ]);
    expect(answer!.directAnswer).toContain("No Source artifacts are registered");
    expect(answer!.caveats[0]?.detail).toContain(
      "Missing artifacts come from Source's artifact standards",
    );
    expect(
      answer!.caveats
        .map((caveat) => `${caveat.label} ${caveat.detail}`)
        .join(" "),
    ).not.toMatch(/source_artifacts|\brows?\b/i);
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
  });
});
