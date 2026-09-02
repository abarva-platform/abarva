import type { NextRequest } from "next/server";

const requireTenancy = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const getProgramById = jest.fn();
const ingestCurrentStateCsv = jest.fn();
const ingestCurrentStateDoc = jest.fn();
const evaluateSensitiveUpload = jest.fn();
const isDocumentFamily = jest.fn();

class MockTenancyError extends Error {
  constructor(public readonly code: "unauthenticated" | "no_client") {
    super(code);
  }
}

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy,
  TenancyError: MockTenancyError,
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof MockTenancyError) {
      return Response.json(
        { error: err.code },
        { status: err.code === "unauthenticated" ? 401 : 403 },
      );
    }
    throw err;
  },
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase,
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById,
}));

jest.mock("@/lib/programs/current-state-ingest", () => ({
  ingestCurrentStateCsv,
}));

jest.mock("@/lib/programs/current-state-doc-ingest", () => ({
  ingestCurrentStateDoc,
  isDocumentFamily,
  QuarantinedDocumentError: class QuarantinedDocumentError extends Error {
    result = { decision: "quarantine" };
  },
}));

jest.mock("@/lib/programs/archetypes/registry", () => ({
  DEFAULT_ARCHETYPE_ID: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
  getArchetype: () => ({
    id: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    evidenceFamilies: [
      { key: "qualitative_context", label: "Qualitative context" },
    ],
  }),
  resolveProgramArchetype: () => ({
    id: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    evidenceFamilies: [
      { key: "qualitative_context", label: "Qualitative context" },
    ],
  }),
}));

jest.mock("@/lib/programs/current-state-routing", () => ({
  structuredCurrentStateUploadDetail: () =>
    "Use the structured current-state CSV path.",
}));

jest.mock("@/lib/security/sensitive-upload-guard", () => ({
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse: () =>
    Response.json({ error: "sensitive_upload_rejected" }, { status: 422 }),
}));

const CTX = {
  clientId: "client-1",
  clientKey: "tenant-one",
  userId: "user-1",
  role: "client_admin",
};
const SUPABASE = { mocked: true };
const PROGRAM_ID = "program-visible";
const MISSING_PROGRAM_ID = "program-hidden";

function csvRequest(): NextRequest {
  const form = new FormData();
  form.set("family", "it_systems_landscape");
  form.set("phase", "2");
  form.set("archetypeId", "AI_PRODUCT_DEVELOPMENT_LIFECYCLE");
  form.set(
    "file",
    new File(
      [
        "ci_sys_id,ci_name,ci_type,ci_class,lifecycle_state,owner_team,business_service,criticality,environment\n",
        "CI1,claims-system,application,cmdb_ci_appl,production,Ops,Claims,1,production\n",
      ],
      "cmdb.csv",
      { type: "text/csv" },
    ),
  );
  return new Request(
    "http://localhost/api/v1/programs/x/current-state/ingest",
    {
      method: "POST",
      body: form,
    },
  ) as unknown as NextRequest;
}

function docRequest(): NextRequest {
  const form = new FormData();
  form.set("family", "qualitative_context");
  form.set("phase", "2");
  form.set(
    "file",
    new File(["Narrative current-state note"], "current-state.txt", {
      type: "text/plain",
    }),
  );
  return new Request(
    "http://localhost/api/v1/programs/x/current-state/ingest-doc",
    {
      method: "POST",
      body: form,
    },
  ) as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue(CTX);
  getProgramsRouteSupabase.mockResolvedValue({
    mode: "service_role",
    supabase: SUPABASE,
  });
  getProgramById.mockImplementation((_ctx, programId) =>
    programId === PROGRAM_ID
      ? Promise.resolve({ id: PROGRAM_ID })
      : Promise.resolve(null),
  );
  evaluateSensitiveUpload.mockReturnValue({ decision: "allow" });
  ingestCurrentStateCsv.mockResolvedValue({
    parsedRows: 1,
    committedRows: 1,
    ledgerEntries: 1,
  });
  isDocumentFamily.mockReturnValue(true);
  ingestCurrentStateDoc.mockResolvedValue({ status: "review_required" });
});

describe("current-state upload routes", () => {
  it("rejects CSV ingest for a non-visible Move before parsing or writing", async () => {
    const { POST } = await import("../route");

    const res = await POST(csvRequest(), {
      params: Promise.resolve({ programId: MISSING_PROGRAM_ID }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
    expect(getProgramById).toHaveBeenCalledWith(CTX, MISSING_PROGRAM_ID, {
      supabase: SUPABASE,
    });
    expect(evaluateSensitiveUpload).not.toHaveBeenCalled();
    expect(ingestCurrentStateCsv).not.toHaveBeenCalled();
  });

  it("allows CSV ingest for a visible Move and lineages the visible Move id", async () => {
    const { POST } = await import("../route");

    const res = await POST(csvRequest(), {
      params: Promise.resolve({ programId: PROGRAM_ID }),
    });

    expect(res.status).toBe(200);
    expect(ingestCurrentStateCsv).toHaveBeenCalledWith(
      CTX,
      "it_systems_landscape",
      expect.stringContaining("claims-system"),
      "cmdb.csv",
      "representative_synthetic",
      expect.any(String),
      {
        moveId: PROGRAM_ID,
        archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
        phase: 2,
      },
    );
  });

  it("rejects document ingest for a non-visible Move before extraction or writing", async () => {
    const { POST } = await import("../../ingest-doc/route");

    const res = await POST(docRequest(), {
      params: Promise.resolve({ programId: MISSING_PROGRAM_ID }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
    expect(getProgramById).toHaveBeenCalledWith(CTX, MISSING_PROGRAM_ID, {
      supabase: SUPABASE,
    });
    expect(evaluateSensitiveUpload).not.toHaveBeenCalled();
    expect(ingestCurrentStateDoc).not.toHaveBeenCalled();
  });
});
