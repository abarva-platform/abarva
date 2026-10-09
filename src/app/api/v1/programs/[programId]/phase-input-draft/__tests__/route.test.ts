// The drafting step of the demo walk, at the route.
//
// Two things are pinned here. The first is the refusal this suite was written
// for: a Move this account cannot read used to answer `{ error: "not_found" }`
// and nothing else, and the one client of this route renders a failed draft
// through `body.detail || body.error`, so the cited-draft panel printed the
// literal `not_found` into a `role="alert"` paragraph. The body now carries the
// cause-blind sentence from `move-unreadable-refusal`, with the 404 and the
// `error` code byte-identical to before -- the cross-tenant denial contract
// other suites pin is that status and that code.
//
// The second is the pair of properties the route's own header claims and
// nothing had ever checked: that it writes nothing, and that it refuses
// outright rather than guessing when asked for a phase outside [1,5]. Both are
// load-bearing for the walk -- a drafting request that quietly wrote capture
// would make a reviewer's saved answers untraceable, and P0 and the stage-6
// Tower handoff are both outside the drafting window.

const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockListApprovedPhaseEvidence = jest.fn();
const mockListProgramEvidenceForPrompt = jest.fn();
const mockBuildAvaPhaseInputProposals = jest.fn();
const mockDescribeAvaPhaseInputDraftRefusal = jest.fn();

// `tenancyErrorResponse` is stubbed to answer the way the real shared helper
// does -- a Response for a tenancy refusal, a rethrow for anything else -- so
// a tenancy refusal and an unanticipated throw are told apart here the same way
// they are in production. A stub that always rethrew would send both down the
// route's own 500 arm and hide which one the route took.
class StubTenancyError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof StubTenancyError) {
      return Response.json(
        { error: err.code },
        { status: err.code === "unauthenticated" ? 401 : 403 },
      );
    }
    throw err;
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
  getModuleState: (ctx: unknown, programId: string) =>
    mockGetModuleState(ctx, programId),
}));

jest.mock("@/lib/programs/approved-phase-evidence", () => ({
  listApprovedPhaseEvidence: (...args: unknown[]) =>
    mockListApprovedPhaseEvidence(...args),
}));

jest.mock("@/lib/programs/evidence-context", () => ({
  listProgramEvidenceForPrompt: (...args: unknown[]) =>
    mockListProgramEvidenceForPrompt(...args),
}));

jest.mock("@/lib/programs/phase-input-draft-proposals", () => ({
  buildAvaPhaseInputProposals: (...args: unknown[]) =>
    mockBuildAvaPhaseInputProposals(...args),
  describeAvaPhaseInputDraftRefusal: (...args: unknown[]) =>
    mockDescribeAvaPhaseInputDraftRefusal(...args),
}));

jest.mock("@/lib/programs/phase-capture-values-for-move", () => ({
  phaseCaptureModuleValueReader: () => () => undefined,
  phaseCaptureValuesByPhase: () => ({ 1: { sponsor_commitment: "Jordan" } }),
  resolveMoveConfirmedSolutionRoute: () => null,
}));

import { POST } from "../route";
import { MOVE_UNREADABLE_REFUSAL_DETAIL } from "@/lib/programs/move-unreadable-refusal";

const params = Promise.resolve({ programId: "prog-1" });

function req(body: unknown): Request {
  return new Request("http://test/api/v1/programs/prog-1/phase-input-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    clientId: "client-1",
    clientKey: "meridian",
    userId: "11111111-1111-4111-8111-111111111111",
  });
  mockGetProgramById.mockResolvedValue({ id: "prog-1", current_phase: 1 });
  mockGetModuleState.mockResolvedValue([]);
  mockListApprovedPhaseEvidence.mockResolvedValue([]);
  mockListProgramEvidenceForPrompt.mockResolvedValue([]);
  mockBuildAvaPhaseInputProposals.mockReturnValue([]);
  mockDescribeAvaPhaseInputDraftRefusal.mockReturnValue("No cited upstream.");
});

describe("POST .../phase-input-draft — a Move this account cannot read", () => {
  it("answers the cause-blind sentence, not the wire code", async () => {
    mockGetProgramById.mockResolvedValue(null);

    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as { error?: string; detail?: string };

    expect(res.status).toBe(404);
    expect(body.detail).toBe(MOVE_UNREADABLE_REFUSAL_DETAIL);
    // The point of the fix: nothing a reviewer reads is the bare code.
    expect(body.detail).not.toBe("not_found");
    expect(body.detail).toMatch(/could not be opened for your account/i);
  });

  it("keeps the 404 and the `not_found` code the denial contract pins", async () => {
    mockGetProgramById.mockResolvedValue(null);

    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as { error?: string };

    // A Move outside this account's grants, a Move in another tenant and an
    // absent Move must stay indistinguishable. Naming the refusal must not
    // leak which of the three happened, so the status and code are unchanged.
    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });

  it("omits `resubmitCanSatisfy`, which this route's reader does not consume", async () => {
    mockGetProgramById.mockResolvedValue(null);

    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as Record<string, unknown>;

    // The gate-submission ladder reads that field; the drafting panel does
    // not. Emitting it here would claim a behaviour change that never happens.
    expect("resubmitCanSatisfy" in body).toBe(false);
  });

  it("refuses before reading any of the Move's capture state", async () => {
    mockGetProgramById.mockResolvedValue(null);

    await POST(req({ phase: 1 }) as never, { params });

    expect(mockGetModuleState).not.toHaveBeenCalled();
    expect(mockListApprovedPhaseEvidence).not.toHaveBeenCalled();
    expect(mockBuildAvaPhaseInputProposals).not.toHaveBeenCalled();
  });
});

describe("POST .../phase-input-draft — the drafting window", () => {
  // P0 Originate and the stage-6 Tower handoff both sit outside it. A request
  // for either must be refused with a reason, not served an empty draft set
  // that reads as "aVa has nothing to offer for this phase".
  it.each([
    ["P0 Originate", 0],
    ["the stage-6 Tower handoff", 6],
    ["a non-integer phase", 2.5],
    ["a negative phase", -1],
  ])("refuses %s with a stated range", async (_label, phase) => {
    const res = await POST(req({ phase }) as never, { params });
    const body = (await res.json()) as { error?: string; detail?: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe("bad_request");
    expect(body.detail).toBe("phase must be an integer in [1,5]");
    expect(mockBuildAvaPhaseInputProposals).not.toHaveBeenCalled();
  });

  it.each([1, 2, 3, 4, 5])("serves phase %i", async (phase) => {
    const res = await POST(req({ phase }) as never, { params });
    const body = (await res.json()) as { ok?: boolean; phase?: number };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.phase).toBe(phase);
  });

  it("refuses a body with no phase at all", async () => {
    const res = await POST(req({}) as never, { params });

    expect(res.status).toBe(400);
  });
});

describe("POST .../phase-input-draft — read-only by contract", () => {
  it("states that it writes nothing, and names where a save would go", async () => {
    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as {
      writes?: boolean;
      savePath?: string;
      currentRevision?: string;
    };

    // The panel inserts a draft locally and the reviewer saves it themselves.
    // `writes: false` is the claim the surface relies on when it tells them so.
    expect(body.writes).toBe(false);
    expect(body.savePath).toBe("/api/v1/programs/prog-1/phase-capture");
    // The revision is what fences that later save against a concurrent edit.
    expect(typeof body.currentRevision).toBe("string");
    expect(body.currentRevision).not.toBe("");
  });

  it("explains an empty proposal set instead of returning a bare empty list", async () => {
    mockBuildAvaPhaseInputProposals.mockReturnValue([]);
    mockDescribeAvaPhaseInputDraftRefusal.mockReturnValue(
      "No approved upstream answer maps to a P2 field yet.",
    );

    const res = await POST(req({ phase: 2 }) as never, { params });
    const body = (await res.json()) as {
      proposals?: unknown[];
      refusal?: string | null;
    };

    expect(body.proposals).toEqual([]);
    expect(body.refusal).toBe(
      "No approved upstream answer maps to a P2 field yet.",
    );
  });

  it("carries no refusal when it has proposals to offer", async () => {
    mockBuildAvaPhaseInputProposals.mockReturnValue([
      {
        fieldKey: "sponsor_commitment",
        proposedValue: "Jordan Lee, COO",
        evidenceRefs: [{ label: "P0 brief" }],
      },
    ]);

    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as {
      proposals?: unknown[];
      refusal?: string | null;
    };

    expect(body.proposals).toHaveLength(1);
    expect(body.refusal).toBeNull();
    expect(mockDescribeAvaPhaseInputDraftRefusal).not.toHaveBeenCalled();
  });

  it("degrades rather than failing when the approved-evidence read is down", async () => {
    mockListProgramEvidenceForPrompt.mockRejectedValue(new Error("db down"));

    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(200);
    // The builder is told the count is unavailable, NOT that it is zero —
    // zero would read as "no approved evidence exists", which is a different
    // and false claim about the Move.
    expect(mockBuildAvaPhaseInputProposals).toHaveBeenCalledWith(
      expect.objectContaining({
        approvedEvidenceUnavailable: true,
        approvedEvidenceCount: 0,
      }),
    );
  });

  it("does not consult the per-phase evidence read at all for P1", async () => {
    await POST(req({ phase: 1 }) as never, { params });

    // P1 drafts from the P0 brief, not from approved evidence, so the read is
    // skipped — and an outage there must not mark P1 as degraded.
    expect(mockListProgramEvidenceForPrompt).not.toHaveBeenCalled();
    expect(mockBuildAvaPhaseInputProposals).toHaveBeenCalledWith(
      expect.objectContaining({ approvedEvidenceUnavailable: false }),
    );
  });
});

describe("POST .../phase-input-draft — an unanticipated failure", () => {
  it("names the step rather than printing the thrown text", async () => {
    mockGetModuleState.mockRejectedValue(new Error("pg: connection reset"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(500);
    expect(body.error).toBe("internal_error");
    expect(String(body.detail)).toMatch(/Nothing in your capture was changed/i);
    // The raw text belongs in the operator's log, not in the browser.
    expect(JSON.stringify(body)).not.toContain("connection reset");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("lets a tenancy refusal answer for itself instead of claiming a crash", async () => {
    mockRequireTenancy.mockRejectedValue(
      new StubTenancyError("unauthenticated"),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const res = await POST(req({ phase: 1 }) as never, { params });
    const body = (await res.json()) as Record<string, unknown>;

    // The shared `/api/v1/programs/**` helper owns this answer. The route must
    // return it untouched: a 401 reported as this route's own 500 would tell a
    // reviewer their draft crashed when their session simply expired, and
    // would log a routine sign-out as a server error.
    expect(res.status).toBe(401);
    expect(body.error).toBe("unauthenticated");
    expect(body.detail).toBeUndefined();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
