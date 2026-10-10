jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockFlag = jest.fn();
const mockAssemble = jest.fn();
const mockBuild = jest.fn();
const mockWorkbook = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: () => Response.json({ error: "unauthorized" }, { status: 401 }),
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
  unavailableEditionWords: () => [{ title: "draft words unavailable", answer: "draft words unavailable", notes: "The point: draft words unavailable. How to read: source line." }],
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-workbook", () => ({
  buildReferenceWorkbook: (...args: unknown[]) => mockWorkbook(...args),
}));

import { NextRequest } from "next/server";
import { GET } from "../route";

const request = () => new NextRequest("https://example.invalid/api/v1/programs/synthetic-move/decks/validation/workbook");
const params = (edition = "validation") => ({ params: Promise.resolve({ programId: "synthetic-move", edition }) });

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({ clientKey: "meridian", clientId: "synthetic-client" });
  mockFlag.mockReturnValue(true);
  mockAssemble.mockResolvedValue({ edition: "validation" });
  mockBuild.mockReturnValue({ edition: "validation", figureLedger: [] });
  mockWorkbook.mockResolvedValue(Buffer.from("PK synthetic workbook"));
});

describe("read-only reference workbook", () => {
  it("refuses a disabled tenant before reading the Move", async () => {
    mockFlag.mockReturnValue(false);
    const result = await GET(request(), params());
    expect(result.status).toBe(404);
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it("serves an in-memory workbook with the figure hash", async () => {
    const result = await GET(request(), params());
    expect(result.status).toBe(200);
    expect(result.headers.get("X-AbarVa-Preview")).toBe("not-persisted");
    expect(result.headers.get("X-AbarVa-Deck-Figure-Hash")).toMatch(/^[0-9a-f]{64}$/);
    expect(result.headers.get("Cache-Control")).toContain("no-store");
    expect(Buffer.from(await result.arrayBuffer()).toString()).toBe("PK synthetic workbook");
    expect(mockWorkbook).toHaveBeenCalledWith({ edition: "validation" }, { edition: "validation", figureLedger: [] });
  });

  it("refuses a stale formula result without publishing a workbook", async () => {
    mockWorkbook.mockRejectedValue(new Error("reference_rom_workbook_mismatch"));
    const result = await GET(request(), params("investment"));
    expect(result.status).toBe(409);
    expect(result.headers.get("X-AbarVa-Preview")).toBeNull();
  });
});
