const mockEvents: string[] = [];
const mockExtract = jest.fn();
const mockEnrich = jest.fn();
const mockRecordEvidence = jest.fn();
const mockEvaluateSensitiveUpload = jest.fn();
const mockWriteAudit = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock("../evidence-ingestion", () => ({
  extractProgramEvidenceFromUploadBuffer: (...args: unknown[]) =>
    mockExtract(...args),
  enrichWithFlexibleEvidenceEnvelope: (...args: unknown[]) =>
    mockEnrich(...args),
  recordProgramEvidence: (...args: unknown[]) => mockRecordEvidence(...args),
}));

jest.mock("@/lib/security/sensitive-upload-guard", () => ({
  evaluateSensitiveUpload: (...args: unknown[]) =>
    mockEvaluateSensitiveUpload(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: (...args: unknown[]) =>
    mockWriteAudit(...args),
}));

import {
  ingestCurrentStateDoc,
  QuarantinedDocumentError,
} from "../current-state-doc-ingest";

const ctx = {
  clientId: "tenant-id",
  clientKey: "tenant-key",
  userId: "reviewer-id",
};
const family = {
  key: "operating_model",
  label: "Operating model",
  kind: "qualitative" as const,
  whyNeeded: "Ground future-state planning in current operations.",
  sourceDocHint: "Operating model notes",
  acceptedFormats: ["txt", "docx"],
};
const args = {
  moveId: "move-id",
  family,
  archetypeId: "test-archetype",
  phase: 2,
  filename: "operating-model.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("Synthetic operating model notes"),
  persistSourceArtifact: jest.fn(async () => {
    mockEvents.push("retain-source");
    return { artifactId: "artifact-1", blobStored: true };
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockEvents.length = 0;
  mockExtract.mockImplementation(async () => {
    mockEvents.push("extract");
    return {
      evidenceType: "document",
      title: "Operating model",
      summary: "Synthetic operating model notes",
      extractedText: "Synthetic operating model notes",
      extractedStructured: {
        decisions: [],
        action_items: [],
        risks: [],
        baseline_candidates: [],
        attendees: [],
        parse_method: "plain-text/v1",
        warnings: [],
      },
      confidence: 0.85,
    };
  });
  mockEvaluateSensitiveUpload.mockImplementation(() => {
    mockEvents.push("sensitivity-check");
    return { decision: "allow" };
  });
  mockEnrich.mockImplementation(async (evidence) => {
    mockEvents.push("enrich");
    return evidence;
  });
  mockRecordEvidence.mockImplementation(async () => {
    mockEvents.push("record-evidence");
    return "evidence-1";
  });
  mockSingle.mockResolvedValue({ data: { id: "review-1" }, error: null });
  mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
  mockFrom.mockReturnValue({ insert: mockInsert });
  mockWriteAudit.mockResolvedValue(undefined);
});

describe("current-state source artifact retention", () => {
  it("retains the original only after safety checks and links it to the review", async () => {
    const result = await ingestCurrentStateDoc(ctx as never, args);

    expect(mockEvents).toEqual([
      "extract",
      "sensitivity-check",
      "enrich",
      "retain-source",
      "record-evidence",
    ]);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        source_ref: expect.objectContaining({
          move_artifact_id: "artifact-1",
          filename: "operating-model.txt",
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        sourceArtifactId: "artifact-1",
        sourceArtifactStored: true,
        reviewState: "review_required",
      }),
    );
  });

  it("does not retain or write extracted evidence when decoded text is quarantined", async () => {
    mockEvaluateSensitiveUpload.mockImplementation(() => {
      mockEvents.push("sensitivity-check");
      return { decision: "quarantine" };
    });

    await expect(
      ingestCurrentStateDoc(ctx as never, args),
    ).rejects.toBeInstanceOf(QuarantinedDocumentError);
    expect(args.persistSourceArtifact).not.toHaveBeenCalled();
    expect(mockRecordEvidence).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("fails closed if the source artifact was not durably stored", async () => {
    const persistSourceArtifact = jest.fn(async () => ({
      artifactId: "artifact-unavailable",
      blobStored: false,
    }));

    await expect(
      ingestCurrentStateDoc(ctx as never, {
        ...args,
        persistSourceArtifact,
      }),
    ).rejects.toThrow("source_artifact_not_durably_stored");
    expect(mockRecordEvidence).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
