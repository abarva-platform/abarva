// Regression coverage for the archetype-driven playbook routing fix: the
// route used to detect "is this an AI-PDLC Move" with a fragile regex over
// free-text (`archetype`/`name`), which never reliably matched because
// `archetype` on a StrategicMove is a coarse 5-value UI label
// (`strategic_transformation`, etc.), not the fine-grained framework
// archetype id. It must instead key off the canonical archetype registry via
// `resolveMoveArchetypeForProgram`, the same helper every other
// archetype-aware route uses.
import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockGetStrategicMoveById = jest.fn();
const mockResolveMoveArchetypeForProgram = jest.fn();
const mockGetMovePhasePlaybook = jest.fn();
const mockGenerateDesignSessionPack = jest.fn();

jest.mock("../../../_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getStrategicMoveById: (ctx: unknown, programId: string) =>
    mockGetStrategicMoveById(ctx, programId),
}));

jest.mock("@/lib/programs/move-archetype-resolution", () => ({
  resolveMoveArchetypeForProgram: (ctx: unknown, programId: string) =>
    mockResolveMoveArchetypeForProgram(ctx, programId),
}));

jest.mock("@/lib/programs/playbook/move-phase-playbook", () => ({
  getMovePhasePlaybook: (phase: number | null, overrides: unknown) =>
    mockGetMovePhasePlaybook(phase, overrides),
}));

jest.mock("@/lib/programs/playbook/ai-pdlc-design-sessions", () => ({
  AI_PDLC_SESSION_OVERRIDES: { 3: [{ key: "ai-pdlc-only-session" }] },
}));

jest.mock("@/lib/programs/playbook/design-session-pack", () => ({
  generateDesignSessionPack: (ctx: unknown, input: unknown) =>
    mockGenerateDesignSessionPack(ctx, input),
}));

function req(phase?: number): NextRequest {
  const url = phase == null
    ? "http://test/api/v1/programs/prog-1/playbook"
    : `http://test/api/v1/programs/prog-1/playbook?phase=${phase}`;
  return new NextRequest(url);
}

const params = Promise.resolve({ programId: "prog-1" });
const ctx = { clientId: "client-1", userId: "person-1", role: "client_admin" };

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockGetStrategicMoveById.mockResolvedValue({
    id: "prog-1",
    name: "Some Move",
    currentPhase: 3,
    archetype: "strategic_transformation",
  });
  mockGetMovePhasePlaybook.mockReturnValue({
    phase: 3,
    sessions: [{ key: "default-session" }],
  });
});

describe("GET /api/v1/programs/[programId]/playbook — archetype-driven routing", () => {
  it("applies the AI-PDLC session overrides when the canonical archetype id is AI_PRODUCT_DEVELOPMENT_LIFECYCLE", async () => {
    mockResolveMoveArchetypeForProgram.mockResolvedValue({
      id: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    });

    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, isAiPdlc: true });
    expect(mockGetMovePhasePlaybook).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ 3: [{ key: "ai-pdlc-only-session" }] }),
    );
  });

  it("does NOT apply AI-PDLC overrides for a different canonical archetype, even when the free-text name/archetype label would have matched the old regex", async () => {
    // The old regex matched on `/pdlc|product development lifecycle|ai-?pdlc|sdlc/`
    // over `archetype + name` — a Move literally named "SDLC Modernization"
    // used to false-positive into AI-PDLC overrides despite being a genuinely
    // different archetype (e.g. platform modernization/IT sourcing).
    mockGetStrategicMoveById.mockResolvedValue({
      id: "prog-1",
      name: "SDLC Modernization Program",
      currentPhase: 3,
      archetype: "platform_modernization",
    });
    mockResolveMoveArchetypeForProgram.mockResolvedValue({
      id: "IT_SOURCING_EVENT",
    });

    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, isAiPdlc: false });
    expect(mockGetMovePhasePlaybook).toHaveBeenCalledWith(3, undefined);
  });

  it("resolves the archetype via the canonical registry helper, not a regex over free text", async () => {
    mockResolveMoveArchetypeForProgram.mockResolvedValue({
      id: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    });

    const { GET } = await import("../route");
    await GET(req(), { params });

    expect(mockResolveMoveArchetypeForProgram).toHaveBeenCalledWith(ctx, "prog-1");
  });

  it("still resolves the playbook (without overrides) when archetype resolution throws — best-effort, never a 500", async () => {
    mockResolveMoveArchetypeForProgram.mockRejectedValue(new Error("db down"));

    const { GET } = await import("../route");
    const res = await GET(req(), { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, isAiPdlc: false });
  });

  it("an explicit ?phase= query param overrides the Move's current phase", async () => {
    mockResolveMoveArchetypeForProgram.mockResolvedValue({ id: "IT_SOURCING_EVENT" });
    mockGetMovePhasePlaybook.mockReturnValue({ phase: 1, sessions: [] });

    const { GET } = await import("../route");
    await GET(req(1), { params });

    expect(mockGetMovePhasePlaybook).toHaveBeenCalledWith(1, undefined);
  });
});
