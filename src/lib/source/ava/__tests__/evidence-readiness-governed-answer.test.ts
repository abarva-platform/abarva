import {
  buildEvidenceReadinessGovernedAnswer,
  looksLikeEvidenceReadinessQuestion,
} from "@/lib/source/ava/evidence-readiness-governed-answer";
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
    parseStatus: "pending",
    embeddingStatus: "pending",
    graphStatus: "pending",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "unparsed",
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

describe("looksLikeEvidenceReadinessQuestion", () => {
  it("matches parse, indexing, and evidence-readiness questions", () => {
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Which uploaded evidence is parsed and search-ready?",
      ),
    ).toBe(true);
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Show files needing parser backfill or indexing as a chart",
      ),
    ).toBe(true);
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Have the workshop notes been promoted to enterprise context?",
      ),
    ).toBe(true);
  });

  it("does not swallow neighboring structured-answer intents", () => {
    expect(looksLikeEvidenceReadinessQuestion(undefined)).toBe(false);
    expect(looksLikeEvidenceReadinessQuestion("")).toBe(false);
    expect(looksLikeEvidenceReadinessQuestion("How is artifact quality?")).toBe(
      false,
    );
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Assess artifact lifecycle posture, client-final readiness, consulting quality, and required deliverable standards.",
      ),
    ).toBe(false);
    expect(
      looksLikeEvidenceReadinessQuestion(
        "How are vendors doing on response coverage?",
      ),
    ).toBe(false);
    expect(looksLikeEvidenceReadinessQuestion("Show the value waterfall")).toBe(
      false,
    );
  });
});

describe("buildEvidenceReadinessGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("emits a governed chart + table from existing registry parse/search states", async () => {
    const parserReady = artifact();
    const parsedSearchReady = artifact({
      id: "artifact-2",
      originalName: "Parsed Pricing Workbook.xlsx",
      artifactFamily: "pricing_workbook",
      artifactKind: "d19_pricing_workbook",
      sourceFormat: "xlsx",
      parseStatus: "parsed",
      embeddingStatus: "embedded",
      graphStatus: "projected",
      evidenceState: "cited",
    });
    const failed = artifact({
      id: "artifact-3",
      originalName: "Failed Workshop Notes.txt",
      artifactFamily: "meeting_notes",
      artifactKind: "workshop_notes",
      sourceFormat: "txt",
      parseStatus: "failed",
      approvalState: "not_required",
      isClientFinal: false,
      isCurrentAuthoritative: false,
    });

    mockListSourceArtifacts.mockImplementation(async (eventId) => {
      if (eventId === "event-1") {
        return [
          parserReady,
          parsedSearchReady,
          artifact({ id: "other-tenant", tenantKey: "other" }),
        ];
      }
      if (eventId === "SRC-001") return [parserReady, failed];
      return [];
    });

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      eventAliases: ["SRC-001"],
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Which uploaded evidence is parsed and search-ready?",
    });

    expect(listSourceArtifactsForSourceEventIdWithContent).toHaveBeenCalledWith(
      "event-1",
    );
    expect(listSourceArtifactsForSourceEventIdWithContent).toHaveBeenCalledWith(
      "SRC-001",
    );
    expect(answer).not.toBeNull();
    expect(answer!.tenantKey).toBe("apex-retail");
    expect(answer!.intent).toBe("evidence_processing_readiness");
    expect(answer!.status).toBe("answered");
    expect(answer!.artifacts.map((item) => item.artifact)).toEqual([
      "chart",
      "table",
    ]);
    expect(answer!.citations).toHaveLength(3);
    expect(answer!.directAnswer).toContain("3 Source files are stored");
    expect(answer!.directAnswer).toContain("1 are parsed");
    expect(answer!.directAnswer).toContain("1 are search-ready");
    expect(answer!.directAnswer).toContain("1 are parser-ready");
    expect(answer!.directAnswer).toContain("1 need attention");
    expect(answer!.artifacts[0]).toMatchObject({
      artifact: "chart",
      title: "Evidence processing readiness",
    });
    expect(answer!.artifacts[1]).toMatchObject({
      artifact: "table",
      title: "Evidence items needing attention",
    });
    expect(answer!.caveats.map((caveat) => caveat.id)).toContain(
      "evidence-readiness-read-only",
    );
    expect(answer!.safety.tenantFencePassed).toBe(true);
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
  });

  it("answers honestly when no registry rows exist", async () => {
    mockListSourceArtifacts.mockResolvedValue([]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-empty",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Show evidence readiness status",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("no_data");
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.directAnswer).toContain(
      "No Source evidence files are registered",
    );
    expect(answer!.gaps).toEqual([
      expect.objectContaining({
        id: "evidence-readiness-files-missing",
        severity: "high",
      }),
    ]);
    expect(answer!.caveats[0]?.detail).toContain("parsed no bytes");
  });

  it("blocks instead of rendering restricted evidence rows", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact({ dataClassification: "Restricted" }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-restricted",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Which files are parsed?",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("blocked");
    expect(answer!.safety.tenantFencePassed).toBe(false);
    expect(answer!.artifacts).toHaveLength(0);
    expect(answer!.gaps[0]?.detail).toContain(
      'sensitive classification "restricted"',
    );
  });
});
