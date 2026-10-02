import type { NextRequest } from "next/server";

const requireTenancy = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const getProgramById = jest.fn();
const decideEvidenceReview = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();

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

jest.mock("@/lib/programs/current-state-doc-ingest", () => ({
  decideEvidenceReview,
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy,
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
const EVIDENCE_ID = "evidence-1";
const REVIEWED_EXTRACTION = {
  version: 1,
  summary: "Reviewed summary",
  structured: {
    decisions: [],
    risks: [],
    baselineCandidates: [],
    actionItems: [],
    observations: [],
    assumptions: [],
    openQuestions: [],
    citations: [],
  },
};

function request(body: Record<string, unknown> = {}): NextRequest {
  return new Request(
    `http://localhost/api/v1/programs/${PROGRAM_ID}/current-state/evidence/${EVIDENCE_ID}/approve`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  ) as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue(CTX);
  loadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: true });
  getProgramsRouteSupabase.mockResolvedValue({
    mode: "service_role",
    supabase: SUPABASE,
  });
  getProgramById.mockImplementation((_ctx, programId) =>
    programId === PROGRAM_ID
      ? Promise.resolve({ id: PROGRAM_ID })
      : Promise.resolve(null),
  );
  decideEvidenceReview.mockResolvedValue({
    ok: true,
    evidenceId: EVIDENCE_ID,
    familyKey: "stakeholder_map",
    decision: "approved",
  });
});

describe("current-state evidence approval route", () => {
  it("rejects approval for a non-visible Move before changing review state", async () => {
    const { POST } = await import("../route");

    const res = await POST(request({ decision: "approved" }), {
      params: Promise.resolve({
        programId: MISSING_PROGRAM_ID,
        evidenceId: EVIDENCE_ID,
      }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
    expect(getProgramById).toHaveBeenCalledWith(CTX, MISSING_PROGRAM_ID, {
      supabase: SUPABASE,
    });
    expect(decideEvidenceReview).not.toHaveBeenCalled();
  });

  it("approves evidence only after the Move visibility check passes", async () => {
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        rationale: "Reviewed synthetic evidence.",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      {
        params: Promise.resolve({
          programId: PROGRAM_ID,
          evidenceId: EVIDENCE_ID,
        }),
      },
    );

    expect(res.status).toBe(200);
    expect(decideEvidenceReview).toHaveBeenCalledWith(CTX, {
      moveId: PROGRAM_ID,
      evidenceId: EVIDENCE_ID,
      decision: "approved",
      rationale: "Reviewed synthetic evidence.",
      reviewedExtraction: REVIEWED_EXTRACTION,
    });
  });

  it("does not let a founder role name replace explicit approval permission", async () => {
    requireTenancy.mockResolvedValue({ ...CTX, role: "founder" });
    loadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: false });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      {
        params: Promise.resolve({
          programId: PROGRAM_ID,
          evidenceId: EVIDENCE_ID,
        }),
      },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "forbidden" });
    expect(loadUserProgramAccessPolicy).toHaveBeenCalledWith(
      { ...CTX, role: "founder" },
      {
        programId: PROGRAM_ID,
      },
    );
    expect(decideEvidenceReview).not.toHaveBeenCalled();
  });

  it("requires the human-reviewed extraction snapshot before approval", async () => {
    const { POST } = await import("../route");
    const res = await POST(request({ decision: "approved" }), {
      params: Promise.resolve({
        programId: PROGRAM_ID,
        evidenceId: EVIDENCE_ID,
      }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "reviewed_extraction_required",
    });
    expect(decideEvidenceReview).not.toHaveBeenCalled();
  });
});
