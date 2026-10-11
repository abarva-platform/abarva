jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockTenancyResponse = jest.fn();
const mockFlag = jest.fn();
const mockAssemble = jest.fn();
const mockWords = jest.fn();
const mockBuild = jest.fn();
const mockRender = jest.fn();
const mockInspect = jest.fn();
const mockJudge = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (...args: unknown[]) => mockTenancyResponse(...args),
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: (...args: unknown[]) => mockFlag(...args) }));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-inputs", () => ({
  assembleEditionInputs: (...args: unknown[]) => mockAssemble(...args),
  ReferenceMoveUnavailable: class ReferenceMoveUnavailable extends Error {},
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-edition", () => ({
  VALIDATION_SEQUENCE: ["cover"], INVESTMENT_SEQUENCE: ["cover"],
  buildReferenceEdition: (...args: unknown[]) => mockBuild(...args),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-words", () => ({
  draftEditionWords: (...args: unknown[]) => mockWords(...args),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-slots", () => ({
  buildReferenceSlotTable: () => ({}),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-model", () => ({
  validateReferenceDeck: jest.fn(() => []),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-renderer", () => ({
  renderReferenceDeck: (...args: unknown[]) => mockRender(...args),
}));
jest.mock("@/lib/deliverables/orchestrator/deck-inspection", () => ({
  inspectDeck: (...args: unknown[]) => mockInspect(...args),
}));
jest.mock("@/lib/deliverables/orchestrator/deck-quality", () => ({
  judgeRenderedDeck: (...args: unknown[]) => mockJudge(...args),
}));
jest.mock("@react-pdf/renderer", () => ({
  pdf: () => ({ toBuffer: async () => (async function* () { yield Buffer.from("%PDF synthetic preview"); })() }),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-pdf", () => ({ buildReferenceDeckPdf: () => ({}) }));

import { NextRequest } from "next/server";
import { GET } from "../route";

const params = (edition = "validation") => ({ params: Promise.resolve({ programId: "synthetic-move", edition }) });
const request = (format = "pptx") => new NextRequest(`https://example.invalid/api/v1/programs/synthetic-move/decks/validation/preview?format=${format}`);

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({ clientKey: "meridian", clientId: "synthetic-client", userId: "synthetic-user" });
  mockTenancyResponse.mockImplementation(() => Response.json({ error: "unauthorized" }, { status: 401 }));
  mockFlag.mockReturnValue(true);
  mockAssemble.mockResolvedValue({ move: { archetype: "workflow_automation", currentPhase: 3 }, valueCase: { status: "empty" }, register: { status: "gap" }, rom: { status: "gap" }, citations: { status: "gap" }, capture: { 3: { status: "gap" } } });
  mockWords.mockResolvedValue({ words: [{ title: "The governed read identifies the next decision.", answer: "Review the exhibit.", notes: "The point: review. How to read: source line." }], status: "ok", fallbackSlides: [] });
  mockBuild.mockReturnValue({ edition: "validation", slides: [], figureLedger: [] });
  mockRender.mockResolvedValue(Buffer.from("PK synthetic preview"));
  mockInspect.mockResolvedValue({ slideCount: 1 });
  mockJudge.mockReturnValue({ fidelityScore: 85 });
});

describe("read-only reference deck preview", () => {
  it("keeps tenancy refusals and names unexpected auth failures", async () => {
    mockRequireTenancy.mockRejectedValueOnce(new Error("unauthenticated"));
    expect((await GET(request(), params())).status).toBe(401);
    mockRequireTenancy.mockRejectedValueOnce(new Error("auth backend unavailable"));
    mockTenancyResponse.mockImplementationOnce(() => { throw new Error("auth backend unavailable"); });
    const result = await GET(request(), params());
    expect(result.status).toBe(500);
    expect(await result.json()).toEqual(expect.objectContaining({ error: "preview_auth_failed" }));
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it("refuses the disabled or non-demo tenant before any Move read", async () => {
    mockFlag.mockReturnValue(false);
    const disabled = await GET(request(), params());
    expect(disabled.status).toBe(404);
    expect(mockAssemble).not.toHaveBeenCalled();
    mockFlag.mockReturnValue(true);
    mockRequireTenancy.mockResolvedValue({ clientKey: "other", clientId: "other", userId: "user" });
    const other = await GET(request(), params());
    expect(other.status).toBe(404);
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it("serves memory-only PPTX with fidelity and non-persistence headers", async () => {
    const result = await GET(request(), params());
    expect(result.status).toBe(200);
    expect(result.headers.get("X-AbarVa-Preview")).toBe("not-persisted");
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Score")).toBe("85");
    expect(result.headers.get("X-AbarVa-Deck-Title-Figure-Count")).toBe("0");
    expect(result.headers.get("X-AbarVa-Deck-Words-Status")).toBe("ok");
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Count")).toBe("0");
    expect(result.headers.get("X-AbarVa-Deck-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.headers.get("Cache-Control")).toContain("no-store");
    expect(mockAssemble).toHaveBeenCalledWith("synthetic-move", "validation");
    expect(mockWords).toHaveBeenCalledWith(expect.objectContaining({
      useCaseType: "workflow_automation",
      phaseStage: "design_review",
      available: expect.objectContaining({ rom: false, valueCase: false }),
    }));
    expect(Buffer.from(await result.arrayBuffer()).toString()).toBe("PK synthetic preview");
  });

  it("refuses unsupported formats without reading data", async () => {
    const result = await GET(request("json"), params());
    expect(result.status).toBe(400);
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it("serves an in-memory PDF under the same preview contract", async () => {
    mockWords.mockResolvedValueOnce({ words: [{ title: "The governed read identifies the next decision.", answer: "Review the exhibit.", notes: "The point: review. How to read: source line." }], status: "unavailable", reason: "preflight_denied", fallbackSlides: [1] });
    const result = await GET(request("pdf"), params());
    expect(result.status).toBe(200);
    expect(result.headers.get("Content-Type")).toBe("application/pdf");
    expect(result.headers.get("X-AbarVa-Preview")).toBe("not-persisted");
    expect(result.headers.get("X-AbarVa-Deck-Words-Status")).toBe("unavailable");
    expect(result.headers.get("X-AbarVa-Deck-Words-Reason")).toBe("preflight_denied");
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Count")).toBe("1");
    expect(Buffer.from(await result.arrayBuffer()).toString()).toBe("%PDF synthetic preview");
  });
});
