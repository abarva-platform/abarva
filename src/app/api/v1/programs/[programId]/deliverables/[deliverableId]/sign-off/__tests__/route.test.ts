const mockRequireTenancy = jest.fn();
const mockTenancyErrorResponse = jest.fn();
const mockGetProgramById = jest.fn();
const mockHasAuthority = jest.fn();
const mockSignOffDeliverable = jest.fn();
const mockSaveMoveArtifact = jest.fn();
const mockListMoveArtifacts = jest.fn();
const mockDownloadArtifactBytes = jest.fn();
const mockExtractProgramEvidenceFromUploadBuffer = jest.fn();
const mockWriteAuditLog = jest.fn();
const mockExtractOfficeText = jest.fn();

jest.mock("../../../../../_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => mockTenancyErrorResponse(err),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));

jest.mock("@/lib/programs/governance", () => ({
  hasAuthority: (...args: unknown[]) => mockHasAuthority(...args),
}));

jest.mock("@/lib/programs/mutations", () => ({
  signOffDeliverable: (...args: unknown[]) => mockSignOffDeliverable(...args),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (...args: unknown[]) => mockSaveMoveArtifact(...args),
  listMoveArtifacts: (...args: unknown[]) => mockListMoveArtifacts(...args),
  downloadArtifactBytes: (...args: unknown[]) =>
    mockDownloadArtifactBytes(...args),
}));

jest.mock("@/lib/deliverables/shared/office-text-extract", () => ({
  extractOfficeText: (...args: unknown[]) => mockExtractOfficeText(...args),
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: (...args: unknown[]) =>
    mockWriteAuditLog(...args),
}));

jest.mock("@/lib/programs/evidence-ingestion", () => ({
  extractProgramEvidenceFromUploadBuffer: (...args: unknown[]) =>
    mockExtractProgramEvidenceFromUploadBuffer(...args),
}));

let deliverableRow: {
  deliverable_type_key: string;
  title: string;
  current_version: number | null;
} | null;
let versionRow: {
  id?: string | null;
  structured_data: Record<string, unknown> | null;
  content?: string | null;
} | null;

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: async () => ({
    supabase: {
      from: (table: string) => {
        if (table === "deliverables_v2") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: deliverableRow,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "deliverable_versions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: versionRow, error: null }),
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    },
  }),
}));

const ctx = {
  clientId: "client-1",
  userId: "person-1",
  role: "client_admin",
  email: "reviewer@example.com",
};
const params = Promise.resolve({
  programId: "prog-1",
  deliverableId: "deliverable-1",
});

function req(body?: Record<string, unknown>): Request {
  return new Request(
    "http://test/api/v1/programs/prog-1/deliverables/deliverable-1/sign-off",
    {
      method: "POST",
      ...(body
        ? {
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    },
  );
}

describe("POST /api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue(ctx);
    mockTenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    mockGetProgramById.mockResolvedValue({ id: "prog-1", name: "Test Move" });
    mockHasAuthority.mockResolvedValue(true);
    mockSignOffDeliverable.mockResolvedValue(true);
    deliverableRow = {
      deliverable_type_key: "business_case",
      title: "Business Case",
      current_version: 1,
    };
    versionRow = {
      id: "version-1",
      structured_data: { source: "generated_by_orchestrator" },
      content:
        "<p>SkyHarbor Global should instrument turnaround delay before committing to a predictive model.</p>",
    };
    mockListMoveArtifacts.mockResolvedValue([]);
    mockDownloadArtifactBytes.mockResolvedValue(null);
    mockExtractOfficeText.mockResolvedValue({
      ok: true,
      format: "docx",
      text: "clean generated office companion",
      partCount: 1,
    });
  });

  it("PHASE CAPTURE EVIDENCE INTEGRITY: rejects sign-off for an unrecognized/stale deliverable type key", async () => {
    // A deliverable created under a type key the codebase does not actually
    // recognize must never be signable, since it can never satisfy a real gate
    // check either.
    deliverableRow = {
      deliverable_type_key: "totally_made_up_type",
      title: "Mystery Artifact",
      current_version: 1,
    };

    const { POST } = await import("../route");
    const res = await POST(req(), { params });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      error: "unsupported_artifact_type",
    });
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("PHASE CAPTURE EVIDENCE INTEGRITY: rejects sign-off of raw phase-capture-derived content as-is", async () => {
    // Even when the type key is legitimate, capture-derived content must not
    // become signable gate evidence via the plain JSON-body approval path.
    deliverableRow = {
      deliverable_type_key: "design_spec",
      title: "Solution Design Specification",
      current_version: 1,
    };
    versionRow = {
      id: "version-1",
      structured_data: {
        source: "phase_capture",
        generated_by: "phase_capture_route",
      },
    };

    const { POST } = await import("../route");
    const res = await POST(req(), { params });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      error: "capture_text_not_signable",
    });
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  it("signs off a recognized deliverable type with real (non-capture) provenance", async () => {
    const { POST } = await import("../route");
    const res = await POST(req(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: "signed_off",
    });
    expect(mockSignOffDeliverable).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      "deliverable-1",
      expect.objectContaining({
        approvedArtifactId: undefined,
        approvedContent: undefined,
      }),
    );
  });

  it("requires approver authority before checking type key or provenance", async () => {
    mockHasAuthority.mockResolvedValue(false);
    deliverableRow = {
      deliverable_type_key: "design_spec",
      title: "Solution Design Specification",
      current_version: 1,
    };
    versionRow = { structured_data: { source: "phase_capture" } };

    const { POST } = await import("../route");
    const res = await POST(req(), { params });

    expect(res.status).toBe(403);
    expect(mockSignOffDeliverable).not.toHaveBeenCalled();
  });

  describe("client-readiness gate", () => {
    const LEAKY =
      "<p>Target-state architecture. Generated with claude-sonnet-5 from record " +
      "5bbf2d7c-328c-41e0-8a69-50094cd15f75.</p>";

    it("refuses sign-off when the document contains something a client must not see", async () => {
      versionRow = {
        id: "version-1",
        structured_data: { source: "generated_by_orchestrator" },
        content: LEAKY,
      };

      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("client_readiness_blockers");
      expect(body.blockers.map((f: { kind: string }) => f.kind).sort()).toEqual(
        ["model_name", "uuid"],
      );
      expect(mockSignOffDeliverable).not.toHaveBeenCalled();
    });

    it("names the escape hatch in the refusal, so the reviewer is not stuck", async () => {
      versionRow = {
        id: "version-1",
        structured_data: { source: "generated_by_orchestrator" },
        content: LEAKY,
      };

      const { POST } = await import("../route");
      const body = await (await POST(req(), { params })).json();

      expect(body.acknowledgeField).toBe("acknowledgeReadinessBlockers");
    });

    it("proceeds when the reviewer explicitly acknowledges the findings", async () => {
      versionRow = {
        id: "version-1",
        structured_data: { source: "generated_by_orchestrator" },
        content: LEAKY,
      };

      const { POST } = await import("../route");
      const res = await POST(req({ acknowledgeReadinessBlockers: true }), {
        params,
      });

      expect(res.status).toBe(200);
      expect(mockSignOffDeliverable).toHaveBeenCalled();
      await expect(res.json()).resolves.toMatchObject({
        clientReadiness: { verdict: "acknowledged" },
      });
    });

    it("writes the accepted findings to the audit log, so the override is not silent", async () => {
      versionRow = {
        id: "version-1",
        structured_data: { source: "generated_by_orchestrator" },
        content: LEAKY,
      };

      const { POST } = await import("../route");
      await POST(req({ acknowledgeReadinessBlockers: true }), { params });

      expect(mockWriteAuditLog).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          action: "deliverable_signed_off_with_readiness_blockers",
          evidenceRefs: expect.arrayContaining([
            "model_name: claude-sonnet-5",
            "uuid: 5bbf2d7c-328c-41e0-8a69-50094cd15f75",
          ]),
        }),
      );
    });

    it("does not log an override when the document was clean", async () => {
      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(200);
      expect(mockWriteAuditLog).not.toHaveBeenCalled();
      await expect(res.json()).resolves.toMatchObject({
        clientReadiness: { verdict: "clear" },
      });
    });

    it("does not block on review-only findings", async () => {
      versionRow = {
        id: "version-1",
        structured_data: { source: "generated_by_orchestrator" },
        content: "<p>The quality score was 80 for this operating model.</p>",
      };

      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.clientReadiness.verdict).toBe("clear");
      expect(body.clientReadiness.reviewItems).toBeGreaterThan(0);
    });

    it("reports not_scanned rather than clear when there is no content", async () => {
      versionRow = {
        id: "version-1",
        structured_data: { source: "generated_by_orchestrator" },
        content: null,
      };

      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        clientReadiness: { verdict: "not_scanned" },
      });
    });

    function generatedDocxArtifact(overrides: Record<string, unknown> = {}) {
      return {
        artifact_id: "artifact-docx-1",
        move_id: "prog-1",
        phase: 4,
        artifact_type: "business_case_editable_docx",
        artifact_family: "generated_deliverable",
        title: "Business Case Editable",
        file_name: "business-case.docx",
        file_format: "docx",
        blob_container: "context-drops",
        blob_path: "moves/test/business-case.docx",
        file_size: 1024,
        version: 1,
        status: "draft",
        generated_by: "generator@example.com",
        generated_at: "2026-08-23T00:00:00.000Z",
        quality_score: null,
        unsupported_claims_count: 0,
        lifecycle_state: "current",
        created_at: "2026-08-23T00:00:00.000Z",
        metadata: {
          deliverableId: "deliverable-1",
          versionId: "version-1",
          outputFormat: "docx",
          outputRole: "docx_editable_phase_record",
        },
        ...overrides,
      };
    }

    it("scans current generated Office companions before sign-off", async () => {
      mockListMoveArtifacts.mockResolvedValue([generatedDocxArtifact()]);
      mockDownloadArtifactBytes.mockResolvedValue({
        bytes: Buffer.from("fake-docx"),
        fileName: "business-case.docx",
        fileFormat: "docx",
      });
      mockExtractOfficeText.mockResolvedValue({
        ok: true,
        format: "docx",
        text: "Generated with claude-sonnet-5 for the business case.",
        partCount: 3,
      });

      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("client_readiness_blockers");
      expect(body.blockers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "model_name" }),
        ]),
      );
      expect(mockExtractOfficeText).toHaveBeenCalledWith(
        Buffer.from("fake-docx"),
        "docx",
      );
      expect(mockSignOffDeliverable).not.toHaveBeenCalled();
    });

    it("blocks sign-off when a current generated Office companion cannot be read", async () => {
      mockListMoveArtifacts.mockResolvedValue([generatedDocxArtifact()]);
      mockDownloadArtifactBytes.mockResolvedValue({
        bytes: Buffer.from("not-office"),
        fileName: "business-case.docx",
        fileFormat: "docx",
      });
      mockExtractOfficeText.mockResolvedValue({
        ok: false,
        reason: "not_a_zip",
        detail: "Not a ZIP container. The document was NOT scanned.",
      });

      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(422);
      await expect(res.json()).resolves.toMatchObject({
        error: "generated_artifact_not_scannable",
        artifact: {
          artifactId: "artifact-docx-1",
          fileName: "business-case.docx",
          fileFormat: "docx",
        },
      });
      expect(mockSignOffDeliverable).not.toHaveBeenCalled();
    });

    it("ignores generated Office artifacts from another deliverable version", async () => {
      mockListMoveArtifacts.mockResolvedValue([
        generatedDocxArtifact({
          artifact_id: "stale-docx",
          metadata: {
            deliverableId: "deliverable-1",
            versionId: "older-version",
          },
        }),
      ]);

      const { POST } = await import("../route");
      const res = await POST(req(), { params });

      expect(res.status).toBe(200);
      expect(mockDownloadArtifactBytes).not.toHaveBeenCalled();
      expect(mockExtractOfficeText).not.toHaveBeenCalled();
      await expect(res.json()).resolves.toMatchObject({
        clientReadiness: {
          verdict: "clear",
          scannedArtifacts: [],
        },
      });
    });

    it("records acknowledgement when the accepted blocker came from an Office companion", async () => {
      mockListMoveArtifacts.mockResolvedValue([generatedDocxArtifact()]);
      mockDownloadArtifactBytes.mockResolvedValue({
        bytes: Buffer.from("fake-docx"),
        fileName: "business-case.docx",
        fileFormat: "docx",
      });
      mockExtractOfficeText.mockResolvedValue({
        ok: true,
        format: "docx",
        text: "Generated with claude-sonnet-5 for the business case.",
        partCount: 3,
      });

      const { POST } = await import("../route");
      const res = await POST(req({ acknowledgeReadinessBlockers: true }), {
        params,
      });

      expect(res.status).toBe(200);
      expect(mockWriteAuditLog).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          action: "deliverable_signed_off_with_readiness_blockers",
          evidenceRefs: expect.arrayContaining(["model_name: claude-sonnet-5"]),
        }),
      );
      await expect(res.json()).resolves.toMatchObject({
        clientReadiness: {
          verdict: "acknowledged",
          scannedArtifacts: [
            {
              artifactId: "artifact-docx-1",
              fileName: "business-case.docx",
              fileFormat: "docx",
              partCount: 3,
            },
          ],
        },
      });
    });
  });
});

export {};
