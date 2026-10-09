// The capture-save step of the demo walk, at its Move-unreadable refusal.
//
// `POST .../phase-capture` has FOUR reader ladders in the standalone Moves
// workspace -- the per-section autosave, the aVa draft save, the basis save and
// the gate finalize -- and every one of them ends `detail || error`. So a Move
// this account can no longer read answered `{ error: "not_found" }` and the
// per-section save slot printed the literal `not_found` beside the field the
// reviewer had just typed into.
//
// The pair of tests that matter here are the POST one and the GET one, and they
// pull in opposite directions ON PURPOSE. The POST arm earns the sentence
// because it has readers. The GET arm keeps its bare body because it has none:
// the phase page preloads capture values server-side and no client fetches it,
// which is the same reason `GET .../phase-capture` is absent from
// `MovesWalkStep`. Pinning both sides stops a later sweep from "finishing the
// job" by adding copy to a response nobody renders.

const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockSbFrom = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: mockSbFrom }),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
  getModuleState: (ctx: unknown, programId: string) =>
    mockGetModuleState(ctx, programId),
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn().mockResolvedValue(false),
}));

import { GET, POST } from "../route";
import { MOVE_UNREADABLE_REFUSAL_DETAIL } from "@/lib/programs/move-unreadable-refusal";

const params = Promise.resolve({ programId: "prog-1" });

function postReq(body: unknown): Request {
  return new Request("http://test/api/v1/programs/prog-1/phase-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getReq(phase: number) {
  return {
    nextUrl: { searchParams: new URLSearchParams({ phase: String(phase) }) },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    clientId: "client-1",
    clientKey: "meridian",
    userId: "11111111-1111-4111-8111-111111111111",
  });
  mockGetProgramById.mockResolvedValue(null);
  mockGetModuleState.mockResolvedValue([]);
});

describe("POST .../phase-capture — a Move this account cannot read", () => {
  it("answers the cause-blind sentence, not the wire code", async () => {
    const res = await POST(
      postReq({
        phase: 1,
        sections: { sponsor_commitment: "Jordan" },
      }) as never,
      { params },
    );
    const body = (await res.json()) as { error?: string; detail?: string };

    expect(res.status).toBe(404);
    expect(body.detail).toBe(MOVE_UNREADABLE_REFUSAL_DETAIL);
    expect(body.detail).not.toBe("not_found");
    expect(body.detail).toMatch(/could not be opened for your account/i);
  });

  it("keeps the 404 and the `not_found` code the denial contract pins", async () => {
    const res = await POST(postReq({ phase: 1, sections: {} }) as never, {
      params,
    });
    const body = (await res.json()) as { error?: string };

    // An absent Move, a foreign Move and a Move outside this account's grants
    // must stay indistinguishable on the wire. The sentence is added to that
    // body; it does not split it into named refusals.
    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });

  it("omits `resubmitCanSatisfy`, which none of its four readers consume", async () => {
    const res = await POST(postReq({ phase: 1, sections: {} }) as never, {
      params,
    });
    const body = (await res.json()) as Record<string, unknown>;

    expect("resubmitCanSatisfy" in body).toBe(false);
  });

  it("writes nothing before refusing", async () => {
    await POST(
      postReq({
        phase: 1,
        sections: { sponsor_commitment: "Jordan" },
      }) as never,
      { params },
    );

    // The refusal sits directly after the Move read and ahead of every write,
    // so a reviewer whose access narrowed mid-session cannot have their edit
    // half-applied under a Move they can no longer open.
    expect(mockSbFrom).not.toHaveBeenCalled();
  });
});

describe("GET .../phase-capture — deliberately still bare", () => {
  it("carries no sentence, because no client renders its body", async () => {
    const res = await GET(getReq(1) as never, { params });
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
    // Not an oversight. The phase page preloads capture values server-side, so
    // this arm reaches no screen; copy here would be unread text to maintain.
    // If a client ever starts fetching this route, THIS is the test to change.
    expect(body.detail).toBeUndefined();
  });
});
