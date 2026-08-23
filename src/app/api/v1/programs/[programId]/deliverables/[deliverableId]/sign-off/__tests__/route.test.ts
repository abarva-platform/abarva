const mockRequireTenancy = jest.fn();
const mockTenancyErrorResponse = jest.fn();
const mockGetProgramById = jest.fn();
const mockHasAuthority = jest.fn();
const mockSignOffDeliverable = jest.fn();
const mockSaveMoveArtifact = jest.fn();
const mockExtractProgramEvidenceFromUploadBuffer = jest.fn();
const mockWriteAuditLog = jest.fn();

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
      structured_data: { source: "generated_by_orchestrator" },
      content:
        "<p>SkyHarbor Global should instrument turnaround delay before committing to a predictive model.</p>",
    };
  });

  it("PHASE CAPTURE EVIDENCE INTEGRITY: rejects sign-off for an unrecognized/stale deliverable type key", async () => {
    // Regression for the phase-capture incident: a deliverable created
    // under a type key the codebase does not actually recognize must never
    // be signable, since it can never satisfy a real gate check either.
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
    // The exact exploit path: phase-capture used to create a real,
    // registered-type deliverable (e.g. design_spec) whose only content was
    // concatenated capture-field text. Even though the type key is
    // legitimate, capture-derived content must not become signable gate
    // evidence via the plain JSON-body approval path.
    deliverableRow = {
      deliverable_type_key: "design_spec",
      title: "Solution Design Specification",
      current_version: 1,
    };
    versionRow = {
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
        structured_data: { source: "generated_by_orchestrator" },
        content: LEAKY,
      };

      const { POST } = await import("../route");
      const body = await (await POST(req(), { params })).json();

      expect(body.acknowledgeField).toBe("acknowledgeReadinessBlockers");
    });

    it("proceeds when the reviewer explicitly acknowledges the findings", async () => {
      versionRow = {
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
  });
});

export {};
