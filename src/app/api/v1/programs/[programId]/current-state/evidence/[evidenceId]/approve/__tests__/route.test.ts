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

describe("a refused review decision prescribes its own next action", () => {
  function params() {
    return {
      params: Promise.resolve({
        programId: PROGRAM_ID,
        evidenceId: EVIDENCE_ID,
      }),
    };
  }

  it("says the evidence is not on the Move instead of promising a recorded decision", async () => {
    // The promotion found neither a review row nor an evidence row. This used
    // to answer `no_pending_review`, whose reviewer sentence says the decision
    // was already made and to reload and read it — there is nothing to read.
    decideEvidenceReview.mockResolvedValue({
      ok: false,
      evidenceId: EVIDENCE_ID,
      familyKey: null,
      decision: "pending",
      reason: "evidence_not_found",
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      params(),
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("evidence_not_in_move");
    expect(body.detail).toMatch(/not on this Move/);
    expect(body.detail).toMatch(/nothing was recorded/);
    expect(body.detail).not.toMatch(/already/);
  });

  it("names the decision on record when the evidence was already decided", async () => {
    decideEvidenceReview.mockResolvedValue({
      ok: false,
      evidenceId: EVIDENCE_ID,
      familyKey: "stakeholder_map",
      decision: "rejected",
      reason: "already_decided",
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      params(),
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("no_pending_review");
    expect(body.detail).toMatch(/already on record as rejected/);
  });

  it("keeps the already-decided sentence unnamed when the decision is not known", async () => {
    decideEvidenceReview.mockResolvedValue({
      ok: false,
      evidenceId: EVIDENCE_ID,
      familyKey: "stakeholder_map",
      decision: "pending",
      reason: "already_decided",
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      params(),
    );

    const body = await res.json();
    expect(body.error).toBe("no_pending_review");
    expect(body.detail).toMatch(/no review awaiting a decision/);
    expect(body.detail).not.toMatch(/on record as pending/);
  });

  it("answers an unreported refusal reason as an already-decided one", async () => {
    // A promotion that refuses without saying why is not evidence that the
    // item is absent, so the conservative arm is the one that does not claim
    // nothing is there.
    decideEvidenceReview.mockResolvedValue({
      ok: false,
      evidenceId: EVIDENCE_ID,
      familyKey: null,
      decision: "pending",
    });
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      params(),
    );

    const body = await res.json();
    expect(body.error).toBe("no_pending_review");
  });

  it("cannot reach the missing-extraction refusal at all", async () => {
    // `reviewed_extraction_missing` is a reason the promotion declares, and
    // this route has no arm for it BY CONSTRUCTION: the 400 above refuses an
    // approval that carries no reviewed extraction before the promotion is
    // called, and the promotion re-derives it from that same argument. Asserted
    // rather than given an arm nothing can exercise.
    const { POST } = await import("../route");

    const res = await POST(request({ decision: "approved" }), params());

    expect(res.status).toBe(400);
    expect(decideEvidenceReview).not.toHaveBeenCalled();
  });
});

describe("a failed review decision reaches the reviewer with a body", () => {
  const PARAMS = () => ({
    params: Promise.resolve({
      programId: PROGRAM_ID,
      evidenceId: EVIDENCE_ID,
    }),
  });

  it("answers a storage failure with a named refusal rather than an unbodied 500", async () => {
    // `tenancyErrorResponse` re-throws a non-tenancy error, so the bare
    // `return tenancyErrorResponse(err)` this replaced rejected the handler and
    // the framework answered with no body at all. The cabinet then parsed `{}`
    // and rendered its unnamed-refusal sentence.
    decideEvidenceReview.mockRejectedValue(new Error("insert failed"));
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      PARAMS(),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("review_decision_unconfirmed");
    expect(typeof body.detail).toBe("string");
    expect(body.detail.length).toBeGreaterThan(40);
  });

  it("claims neither direction about the write it could not confirm", async () => {
    // This arm is reachable on either side of the promotion's one write, so a
    // sentence settling it would be a claim nobody read back.
    decideEvidenceReview.mockRejectedValue(new Error("connection reset"));
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      PARAMS(),
    );

    const { detail } = await res.json();
    expect(detail).toMatch(/may or may not/);
    expect(detail).not.toMatch(/nothing was (approved|recorded)/);
    expect(detail).not.toMatch(/unchanged/);
    expect(detail).toMatch(/[Rr]eload/);
  });

  it("does not report an unreadable program lookup as a refusal to decide", async () => {
    getProgramById.mockRejectedValue(new Error("read failed"));
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      PARAMS(),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      error: "review_decision_unconfirmed",
    });
    expect(decideEvidenceReview).not.toHaveBeenCalled();
  });

  it("still gives a tenancy failure its own status and body", async () => {
    // Regression direction: the named arm must only answer what the tenancy
    // responder RETURNS nothing for. A real tenancy error still returns, so it
    // must not be swallowed into a 500.
    requireTenancy.mockRejectedValue(new MockTenancyError("unauthenticated"));
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      PARAMS(),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
  });

  it("keeps a no-client tenancy failure on its own 403", async () => {
    requireTenancy.mockRejectedValue(new MockTenancyError("no_client"));
    const { POST } = await import("../route");

    const res = await POST(
      request({
        decision: "approved",
        reviewedExtraction: REVIEWED_EXTRACTION,
      }),
      PARAMS(),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "no_client" });
  });
});
