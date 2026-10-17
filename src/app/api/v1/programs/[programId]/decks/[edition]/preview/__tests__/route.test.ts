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
const mockPdfInspect = jest.fn();
const mockValidate = jest.fn();
const mockWorkbook = jest.fn();

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
  unavailableEditionWords: () => [],
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-slots", () => ({
  buildReferenceSlotTable: () => ({}),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-model", () => ({
  ...jest.requireActual("@/lib/deliverables/orchestrator/reference-deck-model"),
  validateReferenceDeck: (...args: unknown[]) => mockValidate(...args),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-workbook", () => ({ buildReferenceWorkbook: (...args: unknown[]) => mockWorkbook(...args) }));
jest.mock("@/lib/pricing/moves-workflow/rom-workbook", () => ({ ROM_WORKBOOK_CONTENT_TYPE: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
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
jest.mock("@/lib/deliverables/orchestrator/reference-deck-pdf-inspection", () => ({ inspectReferenceDeckPdf: (...args: unknown[]) => mockPdfInspect(...args) }));

import { NextRequest } from "next/server";
import { GET } from "../route";
import { GET as workbookGET } from "../../workbook/route";
import { ReferenceDeckLineageRefusal } from "@/lib/deliverables/orchestrator/reference-deck-model";

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
  mockJudge.mockReturnValue({ fidelityScore: 85, findings: [] });
  mockPdfInspect.mockResolvedValue([]);
  mockValidate.mockReturnValue([]);
  mockWorkbook.mockResolvedValue(Buffer.from("PK synthetic workbook"));
});

describe("read-only reference deck preview", () => {
  it.each(["preview", "workbook"])("retains typed lineage codes without private wording in the %s refusal", async (format) => {
    mockBuild.mockImplementationOnce(() => { throw new ReferenceDeckLineageRefusal([
      { slide: 8, code: "unsupported_narrative", message: "private source detail", blocking: true },
    ]); });
    const result = await (format === "preview" ? GET : workbookGET)(request(), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Score")).toBeNull();
    expect(result.headers.get("X-AbarVa-Deck-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    const body = await result.json();
    expect(body).toMatchObject({ error: "figure_lineage_refusal", findings: [{ kind: "reference_lineage", code: "unsupported_narrative", detailCode: "unsupported_narrative", slide: 8 }] });
    expect(JSON.stringify(body)).not.toContain("private source detail");
    expect(mockRender).not.toHaveBeenCalled();
    expect(mockWorkbook).not.toHaveBeenCalled();
  });

  it.each(["pptx", "pdf"])("retains known wording context and unknown score for an early %s lineage refusal", async (format) => {
    mockWords.mockResolvedValueOnce({ status: "unavailable", reason: "slide_rejected", rule: "missing_title_slot", slide: 9, fallbackSlides: [9, 12], words: [],
      fallbackCauses: [{ slide: 9, cause: "missing_title_slot" }, { slide: 12, cause: "parse_failed" }] });
    mockBuild.mockImplementationOnce(() => { throw new Error("reference_deck_lineage_refusal: 8:unsupported_narrative; private source detail"); });
    const result = await GET(request(format), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.headers.get("X-AbarVa-Deck-Words-Rule")).toBe("missing_title_slot");
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Count")).toBe("2");
    // Every fallback slide and why, names only.
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Causes")).toBe("9:missing_title_slot,12:parse_failed");
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Score")).toBeNull();
    expect(result.headers.get("Cache-Control")).toContain("no-store");
    expect(JSON.stringify(await result.json())).not.toContain("private source detail");
    expect(mockRender).not.toHaveBeenCalled();
  });

  it("returns only safe lineage codes and slides before physical rendering", async () => {
    mockValidate.mockReturnValueOnce([{ code: "figure_ledger", slide: 8, blocking: true, message: "private source value" }]);
    const result = await GET(request(), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    const body = await result.json();
    expect(body).toMatchObject({ error: "figure_lineage_refusal", findings: [{ kind: "reference_lineage", detailCode: "figure_ledger", slide: 8 }] });
    expect(JSON.stringify(body)).not.toContain("private source value");
    expect(mockRender).not.toHaveBeenCalled();
  });

  it("classifies a companion workbook lineage refusal without turning it into a server failure", async () => {
    mockBuild.mockImplementationOnce(() => { throw new Error("reference_deck_lineage_refusal: 8:unsupported_narrative; private source detail"); });
    const result = await workbookGET(request(), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.headers.get("Cache-Control")).toContain("no-store");
    expect(await result.json()).toMatchObject({ error: "figure_lineage_refusal" });
    expect(mockWorkbook).not.toHaveBeenCalled();
  });

  it("keeps approved-estimate mismatch and unexpected workbook errors as distinct refusals", async () => {
    mockWorkbook.mockRejectedValueOnce(new Error("reference_rom_workbook_mismatch"));
    const mismatch = await workbookGET(request(), params("investment"));
    expect(mismatch.status).toBe(409);
    expect(await mismatch.json()).toMatchObject({ error: "rom_workbook_mismatch" });
    mockWorkbook.mockRejectedValueOnce(new Error("private provider detail"));
    const failed = await workbookGET(request(), params());
    expect(failed.status).toBe(500);
    expect(JSON.stringify(await failed.json())).not.toContain("private provider detail");
  });

  it("fences the companion workbook and returns no persisted artifact", async () => {
    mockFlag.mockReturnValueOnce(false);
    expect((await workbookGET(request(), params())).status).toBe(404);
    expect(mockAssemble).not.toHaveBeenCalled();
    const result = await workbookGET(request(), params());
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toContain("no-store");
    expect(result.headers.get("X-AbarVa-Preview")).toBe("not-persisted");
    expect(Buffer.from(await result.arrayBuffer()).toString()).toBe("PK synthetic workbook");
  });

  it("refuses a clipped or unreadable native table before returning either format", async () => {
    mockJudge.mockReturnValue({ fidelityScore: 90, findings: [{ kind: "reference_layout", slide: 10, detailCode: "table_text_overflow" }] });
    const response = await GET(request("pdf"), params());
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: "deck_render_refusal", findings: [{ kind: "reference_layout", slide: 10, detailCode: "table_text_overflow" }] });
    expect(mockPdfInspect).not.toHaveBeenCalled();
  });

  it("refuses a defective PDF after the PPTX checks pass", async () => {
    mockPdfInspect.mockResolvedValueOnce([{ kind: "reference_source", slide: 2, detailCode: "bound_figure_missing" }]);
    const result = await GET(request("pdf"), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Score")).toBe("0");
    expect(await result.json()).toMatchObject({ error: "deck_render_refusal", findings: [{ kind: "reference_source", slide: 2, detailCode: "bound_figure_missing" }] });
    expect(mockPdfInspect).toHaveBeenCalledWith(expect.any(Buffer), mockBuild.mock.results[0]!.value);
  });

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
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Causes")).toBeNull();
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Count")).toBe("0");
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Findings")).toBe("none");
    expect(result.headers.get("X-AbarVa-Deck-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.headers.get("Cache-Control")).toContain("no-store");
    expect(mockAssemble).toHaveBeenCalledWith("synthetic-move", "validation");
    expect(mockWords).toHaveBeenCalledWith(expect.objectContaining({
      requestId: expect.any(String),
      useCaseType: "workflow_automation",
      phaseStage: "design_review",
      available: expect.objectContaining({ rom: false, valueCase: false }),
    }));
    expect(Buffer.from(await result.arrayBuffer()).toString()).toBe("PK synthetic preview");
  });

  it.each(["pptx", "pdf"])("names every finding behind a %s score by code, without its message", async (format) => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 85, findings: [
      { kind: "reference_gap", slide: 4, message: "secret gap wording" },
      { kind: "thin_slide", slide: 7, message: "secret thin wording" },
      { kind: "reference_count_dump", slide: 9, detailCode: "count_dump_answer", message: "secret answer" },
    ] });
    const result = await GET(request(format), params());
    expect(result.status).toBe(200);
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Score")).toBe("85");
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Findings")).toBe("4:reference_gap,7:thin_slide,9:reference_count_dump/count_dump_answer");
    expect([...result.headers.values()].join(" ")).not.toMatch(/secret/);
  });

  it("names a deck-wide finding without a slide, and caps a long list with the remainder", async () => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 0, findings: [
      { kind: "slide_count", message: "synthetic" },
      ...Array.from({ length: 44 }, (_, i) => ({ kind: "thin_slide", slide: i + 1, message: "synthetic" })),
    ] });
    const result = await GET(request(), params());
    const codes = result.headers.get("X-AbarVa-Deck-Fidelity-Findings")!.split(",");
    expect(codes[0]).toBe("-:slide_count");
    expect(codes).toHaveLength(41);
    expect(codes[39]).toBe("39:thin_slide");
    expect(codes[40]).toBe("+5");
  });

  it.each([[40, 40, null], [41, 41, "+1"]])("caps at forty codes: %i findings give %i entries", async (total, entries, last) => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 0, findings: Array.from({ length: total }, (_, i) => ({ kind: "thin_slide", slide: i + 1, message: "synthetic" })) });
    const codes = (await GET(request(), params())).headers.get("X-AbarVa-Deck-Fidelity-Findings")!.split(",");
    expect(codes).toHaveLength(entries);
    expect(codes.at(-1)).toBe(last ?? `${total}:thin_slide`);
  });

  it("names the findings on a render refusal too, beside its body", async () => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 90, findings: [
      { kind: "reference_layout", slide: 3, detailCode: "table_fit", message: "private" },
      { kind: "thin_slide", slide: 5, message: "private" },
    ] });
    const result = await GET(request(), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Findings")).toBe("3:reference_layout/table_fit,5:thin_slide");
  });

  it("states no findings header where the deck was never judged", async () => {
    mockBuild.mockImplementationOnce(() => { throw new ReferenceDeckLineageRefusal([
      { slide: 8, code: "unsupported_narrative", message: "private", blocking: true },
    ]); });
    const result = await GET(request(), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("X-AbarVa-Deck-Fidelity-Findings")).toBeNull();
  });

  it("refuses unsupported formats without reading data", async () => {
    const result = await GET(request("json"), params());
    expect(result.status).toBe(400);
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it("refuses a physical deck failure before returning a file", async () => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 80, findings: [{ kind: "off_canvas", slide: 1, shapes: 1, worstOverflowIn: 0.2, message: "synthetic overflow" }] });
    const result = await GET(request(), params());
    expect(result.status).toBe(422);
    expect(result.headers.get("Content-Type")).toContain("application/json");
    expect(await result.json()).toMatchObject({ error: "deck_render_refusal", findings: [{ kind: "off_canvas", slide: 1 }] });
  });

  it("reports a source refusal subtype without revealing the source value", async () => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 80, findings: [{
      kind: "reference_source", slide: 9, detailCode: "notes_source_missing", message: "synthetic private source value",
    }] });
    const result = await GET(request("pdf"), params());
    expect(result.status).toBe(422);
    const body = await result.json();
    expect(body).toMatchObject({ error: "deck_render_refusal", findings: [{ kind: "reference_source", slide: 9, detailCode: "notes_source_missing" }] });
    expect(JSON.stringify(body)).not.toContain("synthetic private source value");
  });

  it("refuses internal client-facing copy before returning a file", async () => {
    mockJudge.mockReturnValueOnce({ fidelityScore: 95, findings: [{
      kind: "reference_client_copy", slide: 2, detailCode: "internal_term", message: "private rendered wording",
    }] });
    const result = await GET(request(), params());
    expect(result.status).toBe(422);
    const body = await result.json();
    expect(body).toMatchObject({ error: "deck_render_refusal", findings: [{ kind: "reference_client_copy", slide: 2, detailCode: "internal_term" }] });
    expect(JSON.stringify(body)).not.toContain("private rendered wording");
  });

  it("serves an in-memory PDF under the same preview contract", async () => {
    mockWords.mockResolvedValueOnce({ words: [{ title: "The governed read identifies the next decision.", answer: "Review the exhibit.", notes: "The point: review. How to read: source line." }], status: "unavailable", reason: "preflight_denied", fallbackSlides: [1], fallbackCauses: [{ slide: 1, cause: "preflight_denied" }] });
    const result = await GET(request("pdf"), params());
    expect(result.status).toBe(200);
    expect(result.headers.get("Content-Type")).toBe("application/pdf");
    expect(result.headers.get("X-AbarVa-Preview")).toBe("not-persisted");
    expect(result.headers.get("X-AbarVa-Deck-Words-Status")).toBe("unavailable");
    expect(result.headers.get("X-AbarVa-Deck-Words-Reason")).toBe("preflight_denied");
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Count")).toBe("1");
    expect(result.headers.get("X-AbarVa-Deck-Fallback-Causes")).toBe("1:preflight_denied");
    expect(Buffer.from(await result.arrayBuffer()).toString()).toBe("%PDF synthetic preview");
  });
});
