import {
  buildBulkDocumentReviewArtifact,
  commitApprovedBulkDocumentReviewArtifact,
  persistBulkDocumentReviewArtifact,
} from "../bulk-document-review";

const mockUpload = jest.fn();

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(() => ({
    upload: (...args: unknown[]) => mockUpload(...args),
    remove: jest.fn(),
    download: jest.fn(),
    createSignedUrl: jest.fn(),
  })),
}));

describe("bulk document review artifacts", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalAzureDatabaseUrl = process.env.ABARVA_AZURE_DATABASE_URL;

  beforeEach(() => {
    mockUpload.mockResolvedValue(undefined);
    delete process.env.DATABASE_URL;
    delete process.env.ABARVA_AZURE_DATABASE_URL;
  });

  afterEach(() => {
    mockUpload.mockReset();
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalAzureDatabaseUrl === undefined) {
      delete process.env.ABARVA_AZURE_DATABASE_URL;
    } else {
      process.env.ABARVA_AZURE_DATABASE_URL = originalAzureDatabaseUrl;
    }
  });

  it("builds review-required candidates with source citations and embedding handoff", () => {
    const artifact = buildBulkDocumentReviewArtifact({
      jobId: "bulk-0123456789abcdef",
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      fileName: "reports/fy26-modernization.pdf",
      templateId: "annual-quarterly-reports",
      segmentKey: "enterprise_profile",
      sha256: "a".repeat(64),
      blobPath: "meridian-health/load/fy26-modernization.pdf",
      dataClassification: "confidential_business",
      generatedAt: "2026-06-06T15:00:00.000Z",
      document: {
        text: "Healthcare modernization landing zone\n\nAWS and Databricks medallion architecture evidence.",
        parseMethod: "pdf-parse",
        warnings: [],
        metadata: {
          mimeType: "application/pdf",
          extension: "pdf",
          bytesParsed: 1024,
          truncated: false,
          pageCount: 3,
        },
      },
    });

    expect(artifact).toMatchObject({
      schema: "abarva.context-bulk-upload.document-review.v1",
      status: "needs_operator_review",
      approval: {
        required: true,
        approvedBy: null,
      },
      embeddingHandoff: {
        status: "pending_embed_job",
        command: "npm run embed:pending-chunks -- --tenant meridian-health",
      },
    });
    expect(artifact.candidates).toHaveLength(1);
    expect(artifact.candidates[0]).toMatchObject({
      sourcePath:
        "bulk-document://meridian-health/bulk-0123456789abcdef/reports%2Ffy26-modernization.pdf#chunk=1",
      locator: {
        document: "reports/fy26-modernization.pdf",
        chunk: 1,
        pageCount: 3,
      },
      reviewStatus: "needs_operator_review",
    });
  });

  it("records approval without marking the artifact committed when no database is configured", async () => {
    const artifact = buildBulkDocumentReviewArtifact({
      jobId: "bulk-0123456789abcdef",
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      fileName: "fy26-modernization.pdf",
      templateId: "annual-quarterly-reports",
      segmentKey: "enterprise_profile",
      sha256: "b".repeat(64),
      blobPath: "meridian-health/load/fy26-modernization.pdf",
      dataClassification: "confidential_business",
      document: {
        text: "Approved candidate text.",
        parseMethod: "pdf-parse",
        warnings: [],
        metadata: {
          mimeType: "application/pdf",
          extension: "pdf",
          bytesParsed: 512,
          truncated: false,
        },
      },
    });

    const { artifact: reviewedArtifact, result } =
      await commitApprovedBulkDocumentReviewArtifact({
        artifact,
        approvedBy: "user-meridian",
      });

    expect(result).toMatchObject({
      status: "skipped_no_database_url",
      chunksInserted: 0,
      approvedCandidates: 1,
    });
    expect(reviewedArtifact.status).toBe("needs_operator_review");
    expect(reviewedArtifact.approval.approvedBy).toBe("user-meridian");
    expect(reviewedArtifact.candidates[0]?.reviewStatus).toBe("approved");
    expect(mockUpload).toHaveBeenCalledWith(
      "context-uploads",
      "meridian-health/_reviews/bulk-0123456789abcdef/fy26-modernization-pdf-bbbbbbbbbbbb.json",
      expect.stringContaining('"approvedBy": "user-meridian"'),
      expect.objectContaining({
        contentType: "application/json",
        upsert: true,
      }),
    );
  });

  it("persists review artifacts under tenant-scoped review paths", async () => {
    const artifact = buildBulkDocumentReviewArtifact({
      jobId: "bulk-0123456789abcdef",
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      fileName: "contracts/vendor.docx",
      templateId: "vendor-baa-contracts",
      segmentKey: "it_financials",
      sha256: "c".repeat(64),
      blobPath: "meridian-health/load/vendor.docx",
      dataClassification: "confidential_business",
      document: {
        text: "BAA contract term evidence.",
        parseMethod: "docx-mammoth",
        warnings: [],
        metadata: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          extension: "docx",
          bytesParsed: 2048,
          truncated: false,
        },
      },
    });

    const location = await persistBulkDocumentReviewArtifact(artifact);

    expect(location).toEqual({
      bucket: "context-uploads",
      path: "meridian-health/_reviews/bulk-0123456789abcdef/contracts-vendor-docx-cccccccccccc.json",
    });
    expect(mockUpload).toHaveBeenCalledWith(
      location.bucket,
      location.path,
      expect.stringContaining(
        '"schema": "abarva.context-bulk-upload.document-review.v1"',
      ),
      expect.objectContaining({
        metadata: expect.objectContaining({
          tenantKey: "meridian-health",
          clientId: "client-meridian",
          jobId: "bulk-0123456789abcdef",
        }),
      }),
    );
  });
});
