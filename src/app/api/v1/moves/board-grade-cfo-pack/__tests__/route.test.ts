import { NextRequest } from "next/server";

const mockGetCurrentUser = jest.fn();
const mockRequireTenancy = jest.fn();
const mockLoadMove = jest.fn();
const mockLoadValue = jest.fn();
const mockFlag = jest.fn();
const mockOrchestrated = jest.fn();
const mockRender = jest.fn();
const mockPersist = jest.fn();

jest.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => mockGetCurrentUser() }));
jest.mock("@/lib/auth/tenancy", () => ({ requireTenancy: () => mockRequireTenancy() }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: (...args: unknown[]) => mockFlag(...(args as [])) }));
jest.mock("@/lib/programs/value-model-generation", () => ({ loadValueGenerationForMove: (...args: unknown[]) => mockLoadValue(...(args as [])) }));
jest.mock("@/lib/programs/board-artifacts/load-move-business-case-input", () => ({ loadMoveBusinessCaseInput: (...args: unknown[]) => mockLoadMove(...(args as [])) }));
jest.mock("@/lib/programs/board-artifacts/orchestrated-move-route", () => ({ maybeRenderOrchestratedMoveArtifact: (...args: unknown[]) => mockOrchestrated(...(args as [])) }));
jest.mock("@/lib/programs/expert-kernel/exports/board-grade", () => ({
  renderApexCfoPackHtml: jest.fn(),
  renderMoveCfoPackHtml: (...args: unknown[]) => mockRender(...(args as [])),
}));
jest.mock("@/lib/programs/expert-kernel/exports/board-grade/render-cache", () => ({
  cachedRender: (_key: string, render: () => string) => render(),
}));
jest.mock("@/lib/programs/board-artifacts/board-grade-route-guard", () => ({ assertBoardGradeTenancy: jest.fn() }));
jest.mock("@/lib/programs/board-artifacts/board-grade-persistence", () => ({
  generatedArtifactResponseHeaders: () => ({}),
  persistBoardGradeMoveArtifact: (...args: unknown[]) => mockPersist(...(args as [])),
}));

import { GET } from "../route";

const request = () => new NextRequest("https://example.test/api/v1/moves/board-grade-cfo-pack?moveId=move-1");

describe("board-grade CFO route value-model boundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ personId: "user-1", clerkUserId: "clerk-1", metadataClientKey: "demo" });
    mockRequireTenancy.mockResolvedValue({ clientId: "client-1", clientKey: "demo" });
    mockLoadMove.mockResolvedValue({ tenant_key: "demo", tenantKey: "demo", name: "Fictional Move" });
    mockFlag.mockReturnValue(false);
    mockLoadValue.mockResolvedValue({ kind: "legacy" });
    mockOrchestrated.mockResolvedValue(null);
    mockRender.mockReturnValue("<html>legacy deck</html>");
    mockPersist.mockResolvedValue(null);
  });

  it("refuses a flagged structured case before the legacy deck or orchestrator runs", async () => {
    mockFlag.mockReturnValue(true);
    mockLoadValue.mockResolvedValue({ kind: "ready", snapshot: { inputHash: "hash" } });
    const response = await GET(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(expect.objectContaining({ error: "value_engine_phase_build_required" }));
    expect(mockOrchestrated).not.toHaveBeenCalled();
    expect(mockRender).not.toHaveBeenCalled();
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it("evaluates the guard from the authenticated app key when the Move stores an alias", async () => {
    mockLoadMove.mockResolvedValue({ tenant_key: "substrate-alias", name: "Fictional Move" });
    mockFlag.mockImplementation((ctx: { clientKey?: string }) => ctx.clientKey === "demo");
    mockLoadValue.mockResolvedValue({ kind: "ready", snapshot: { inputHash: "hash" } });
    const response = await GET(request());
    expect(response.status).toBe(409);
    expect(mockFlag).toHaveBeenCalledWith({ clientKey: "demo", clientId: "client-1" }, expect.any(String));
    expect(mockRender).not.toHaveBeenCalled();
  });

  it("passes through the specific review-required refusal", async () => {
    mockFlag.mockReturnValue(true);
    mockLoadValue.mockResolvedValue({ kind: "review_required", detail: "Review lever L1 and [A:V3]." });
    const response = await GET(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "value_model_review_required", detail: "Review lever L1 and [A:V3]." });
    expect(mockRender).not.toHaveBeenCalled();
  });

  it("keeps flag-off and flagged free-text response bodies unchanged", async () => {
    const off = await GET(request());
    expect(off.status).toBe(200);
    expect(await off.text()).toBe("<html>legacy deck</html>");
    expect(mockLoadValue).not.toHaveBeenCalled();
    mockFlag.mockReturnValue(true);
    const freeText = await GET(request());
    expect(freeText.status).toBe(200);
    expect(await freeText.text()).toBe("<html>legacy deck</html>");
    expect(mockLoadValue).toHaveBeenCalledWith(expect.objectContaining({ clientKey: "demo" }), "move-1");
  });
});
