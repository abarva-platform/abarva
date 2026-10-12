jest.mock("server-only", () => ({}));

const mockInfo = jest.fn();
const mockText = jest.fn();
const mockDestroy = jest.fn();
jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({ getInfo: mockInfo, getText: mockText, destroy: mockDestroy })),
}));

import { inspectReferenceDeckPdf, judgeReferencePdfPages } from "../reference-deck-pdf-inspection";
import { referenceSourceLine, type ReferenceDeckSpec } from "../reference-deck-model";

const spec: ReferenceDeckSpec = {
  edition: "validation", client: "Synthetic demo", program: "Demo case", useCase: "Demo case",
  sponsorRole: "Executive sponsor", monthYear: "October 2026", sourcesCheckedTo: "not checked",
  sources: { "engine:annual": "Calculated annual value" },
  figureLedger: [{ display: "$1,234", sourceId: "engine:annual", workbookCell: "Deck Figures!B2" }],
  slides: [{ archetype: "cover", actionTitle: "Demo case", answer: "A value proposition for your team to validate", blocks: [] }, {
    archetype: "one_page", actionTitle: "Confirmed evidence identifies the annual value", answer: "Confirm its counting basis before relying on this value.",
    sourceIds: ["engine:annual"], blocks: [{ kind: "table", columns: ["Measure", "Value"], rows: [["Annual", {
      display: "$1,234", sourceId: "engine:annual", workbookCell: "Deck Figures!B2",
    }]] }],
  }],
};
const pages = () => spec.slides.map((slide, index) => ({
  pageNumber: index + 1, width: 960, height: 540,
  text: [slide.actionTitle, slide.answer, index ? "$1,234" : "", referenceSourceLine(slide)].filter(Boolean).join("\n"),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockInfo.mockResolvedValue({ pages: pages().map(({ pageNumber, width, height }) => ({ pageNumber, width, height })) });
  mockText.mockResolvedValue({ pages: pages().map(({ pageNumber, text }) => ({ num: pageNumber, text })) });
  mockDestroy.mockResolvedValue(undefined);
});

describe("rendered reference PDF", () => {
  it("rejects an unsupported owner claim in the PDF's own answer text", () => {
    const guarded = structuredClone(spec);
    guarded.slides[1]!.narrativeEvidence = { acceptedOwnersAvailable: false };
    const rendered = pages();
    rendered[1]!.text += "\nTHE ANSWER: Each decision has been mapped to the user who holds authority for it.\nSources: Workshop evidence.";
    expect(judgeReferencePdfPages(rendered, guarded)).toContainEqual(expect.objectContaining({ kind: "reference_client_copy", detailCode: "unaccepted_owner_claim" }));
  });

  it("checks every shortened architecture label in the PDF's own text", () => {
    const architecture = structuredClone(spec);
    architecture.slides[1]!.blocks = [{ kind: "architecture", layers: [{ name: "Source", items: ["Reviewed input sources"] }], governance: "Traceability" }];
    const rendered = pages();
    expect(judgeReferencePdfPages(rendered, architecture)).toContainEqual(expect.objectContaining({ detailCode: "pdf_architecture_label_missing" }));
    rendered[1]!.text += "\nReviewed input sources";
    expect(judgeReferencePdfPages(rendered, architecture)).not.toContainEqual(expect.objectContaining({ detailCode: "pdf_architecture_label_missing" }));
  });
  it("accepts its own complete pages and releases the parser", async () => {
    expect(judgeReferencePdfPages(pages(), spec)).toEqual([]);
    expect(await inspectReferenceDeckPdf(Buffer.from("synthetic PDF"), spec)).toEqual([]);
    expect(mockInfo).toHaveBeenCalledWith({ parsePageInfo: true });
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("refuses a changed canvas, an extra page, or a missing page identity", () => {
    const wrongSize = pages(); wrongSize[1]!.width = 800;
    expect(judgeReferencePdfPages(wrongSize, spec)).toContainEqual(expect.objectContaining({ kind: "canvas" }));
    expect(judgeReferencePdfPages([...pages(), { ...pages()[1]!, pageNumber: 3 }], spec))
      .toContainEqual(expect.objectContaining({ kind: "slide_count" }));
    expect(judgeReferencePdfPages([pages()[0]!, { ...pages()[1]!, pageNumber: 1 }], spec))
      .toContainEqual(expect.objectContaining({ kind: "empty_canvas", slide: 2 }));
  });

  it.each([
    ["Sources: Calculated value figures.", "source_line_mismatch"],
    ["$1,234", "bound_figure_missing"],
    ["Confirmed evidence identifies the annual value", "pdf_title_missing"],
    ["Confirm its counting basis before relying on this value.", "pdf_answer_missing"],
  ])("detects missing rendered text %s", (removed, detailCode) => {
    const damaged = pages(); damaged[1]!.text = damaged[1]!.text.replace(removed, "");
    expect(judgeReferencePdfPages(damaged, spec)).toContainEqual(expect.objectContaining({ slide: 2, detailCode }));
  });

  it("refuses internal terms and an edition rule in actual PDF text", () => {
    const internal = pages(); internal[1]!.text += "\nThe readback is complete.";
    expect(judgeReferencePdfPages(internal, spec)).toContainEqual(expect.objectContaining({ kind: "reference_client_copy", detailCode: "internal_term" }));
    const layout = pages(); layout[1]!.text += "\nBig number\ncontext: evidence is complete.";
    expect(judgeReferencePdfPages(layout, spec)).toContainEqual(expect.objectContaining({ kind: "reference_client_copy", detailCode: "internal_term" }));
    const capture = pages(); capture[1]!.text += "\nCaptured evidence is complete.";
    expect(judgeReferencePdfPages(capture, spec)).toContainEqual(expect.objectContaining({ kind: "reference_client_copy", detailCode: "internal_term" }));
    const rule = pages(); rule[0]!.text += "\nValidate the need; no solution, plan or cost.";
    expect(judgeReferencePdfPages(rule, spec)).toContainEqual(expect.objectContaining({ kind: "reference_client_copy", detailCode: "edition_rule_visible" }));
  });

  it("fails closed when extraction fails and still releases the parser", async () => {
    mockText.mockRejectedValueOnce(new Error("synthetic parse failure"));
    await expect(inspectReferenceDeckPdf(Buffer.from("synthetic PDF"), spec)).rejects.toThrow("synthetic parse failure");
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("requires the divider answer and supporting text in the PDF", () => {
    const dividerSpec: ReferenceDeckSpec = { ...spec, slides: [spec.slides[0]!, {
      ...spec.slides[1]!, archetype: "divider", sourceIds: [], blocks: [{ kind: "text", lines: ["The need and its counting basis"] }],
    }] };
    const rendered = pages(); rendered[1]!.text += "\nThe need and its counting basis";
    expect(judgeReferencePdfPages(rendered, dividerSpec)).toEqual([]);
    rendered[1]!.text = rendered[1]!.text.replace("The need and its counting basis", "");
    expect(judgeReferencePdfPages(rendered, dividerSpec)).toContainEqual(expect.objectContaining({ slide: 2, detailCode: "pdf_divider_text_missing" }));
    rendered[1]!.text = rendered[1]!.text.replace(spec.slides[1]!.answer!, "");
    expect(judgeReferencePdfPages(rendered, dividerSpec)).toContainEqual(expect.objectContaining({ slide: 2, detailCode: "pdf_answer_missing" }));
  });
});
