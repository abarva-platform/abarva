import { inspectDeck } from "../deck-inspection";
import { judgeRenderedDeck } from "../deck-quality";
import {
  REFERENCE_ARCHETYPES,
  validateReferenceDeck,
  type ReferenceArchetype,
  type ReferenceBlock,
  type ReferenceDeckSpec,
  type ReferenceFigure,
  type ReferenceSlide,
} from "../reference-deck-model";
import { renderReferenceDeck } from "../reference-deck-renderer";
import JSZip from "jszip";

const FIGURE: ReferenceFigure = {
  display: "$1,000",
  sourceId: "[A:V1]",
  workbookCell: "Value Case!B2",
};
const NOTES = "The point: This is a synthetic demonstration. How to read: Read the governed row before its conclusion.";
const TITLE = "The reviewed evidence narrows the next decision.";

function blockFor(archetype: ReferenceArchetype): ReferenceBlock {
  if (archetype === "one_page" || archetype === "big_number_context" || archetype === "shared_foundation")
    return { kind: "metrics", items: [{ label: "Working value", value: FIGURE, meaning: "A figure for a synthetic demonstration." }] };
  if (archetype === "flow_today")
    return { kind: "flow", nodes: ["Source", "Review", "Decision"], annotation: "The review step needs an owner." };
  if (archetype === "target_state")
    return { kind: "architecture", layers: [
      { name: "Sources", items: ["Landing"] }, { name: "Bronze", items: ["Raw"] },
      { name: "Silver", items: ["Clean"] }, { name: "Gold", items: ["Reviewed"] },
      { name: "Semantic", items: ["Measures"] }, { name: "Use", items: ["Decisions"] },
    ], governance: "Lineage and quality checks" };
  if (archetype === "releases")
    return { kind: "timeline", quarters: ["Early", "Middle", "Later"], rows: [
      { label: "Foundation", from: 0, to: 1 }, { label: "Validation", from: 1, to: 2 },
    ], today: 0, commit: 2 };
  if (archetype === "ai_options")
    return { kind: "text", lines: ["Candidate: reviewed summary", "Purpose: help owners compare evidence", "Prerequisite: approved source access"] };
  if (archetype === "cover" || archetype === "divider")
    return { kind: "text", lines: ["The synthetic evidence supports a decision."] };
  return { kind: "table", columns: ["Measure", "Working figure"], rows: [
    ["Synthetic row", FIGURE], ["Review basis", "Owner confirmation required"],
  ], ...(archetype === "assumptions" ? { decisiveRows: [0] } : {}) };
}

function slide(archetype: ReferenceArchetype, edition: ReferenceDeckSpec["edition"]): ReferenceSlide {
  const section = edition === "validation" ? "CONFIRM" : "VALIDATE";
  return {
    archetype,
    ...(archetype === "cover" || archetype === "divider" ? {} : { section }),
    actionTitle: archetype === "cover" ? "Demo case" : TITLE,
    answerLabel: "The answer",
    answer: "The next decision depends on confirming the working basis.",
    speakerNotes: NOTES,
    blocks: [blockFor(archetype)],
    sourceIds: ["[A:V1]"],
  };
}

function spec(edition: ReferenceDeckSpec["edition"]): ReferenceDeckSpec {
  const archetypes: ReferenceArchetype[] = edition === "investment"
    ? [...REFERENCE_ARCHETYPES]
    : ["cover", "one_page", "contents", "big_number_context", "plain_english_table", "flow_today", "one_step_value", "three_year_value", "assumptions", "value_ledger", "sources"];
  return {
    edition, client: "Synthetic demo tenant", program: "Demo program", useCase: "Demo case",
    sponsorRole: "Sponsor", monthYear: "October 2026", sourcesCheckedTo: "2026-10-10",
    sources: { "[A:V1]": "Synthetic register row" },
    figureLedger: [FIGURE],
    slides: archetypes.map((archetype) => slide(archetype, edition)),
  };
}

describe("reference deck components", () => {
  it("checks architecture label type, geometry, content and source notes in the physical file", async () => {
    const draft = spec("investment");
    const architecture = draft.slides[12]!.blocks[0]!;
    if (architecture.kind !== "architecture") throw new Error("synthetic architecture absent");
    architecture.layers[1]!.fullItems = ["The full source detail is retained for independent review against the original governed record."];
    draft.slides[12]!.speakerNotes += ` Source detail: ${architecture.layers[1]!.fullItems[0]}`;
    const rendered = await inspectDeck(await renderReferenceDeck(draft));
    const target = rendered.slides[12]!;
    expect(target.architectureText).toHaveLength(6);
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings.filter((finding) => finding.kind === "reference_layout")).toEqual([]);
    target.architectureText![0]!.fontSize = 8;
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings).toContainEqual(expect.objectContaining({ detailCode: "architecture_text_fit" }));
    target.architectureText![0]!.fontSize = 12; target.architectureText![0]!.heightIn = 0.01;
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings).toContainEqual(expect.objectContaining({ detailCode: "architecture_text_fit" }));
    target.architectureText![0]!.heightIn = 0.71; target.namedText!["ref:body:architecture-label:0"] = "Different content";
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings).toContainEqual(expect.objectContaining({ detailCode: "architecture_label_mismatch" }));
    target.notesText = NOTES;
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings).toContainEqual(expect.objectContaining({ detailCode: "architecture_notes_missing" }));
  });

  it("rejects a rendered owner assertion when accepted owner evidence is missing", async () => {
    const draft = spec("investment"); draft.slides[11]!.narrativeEvidence = { acceptedOwnersAvailable: false };
    const rendered = await inspectDeck(await renderReferenceDeck(draft));
    rendered.slides[11]!.namedText!["ref:answer:text"] = "Each decision has been mapped to the user who holds authority for it.";
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings).toContainEqual(expect.objectContaining({ kind: "reference_client_copy", detailCode: "unaccepted_owner_claim" }));
  });
  it("refuses a table that cannot fit without deleting rows or reducing readable type", async () => {
    const draft = spec("investment");
    draft.slides[9]!.blocks = [{ kind: "table", columns: ["Evidence", "Review"], rows: Array.from({ length: 12 }, () =>
      ["The analyst checks the complete supporting documentation before routing the evidence to its accountable owner for review and resolution.", "Owner review required"]) }];
    await expect(renderReferenceDeck(draft)).rejects.toThrow("reference_deck_body_overflow: slide 10");
  });

  it("preserves long editable table text at readable size and detects clipped or tiny rendered boxes", async () => {
    const draft = spec("investment");
    const statement = "The operations owner checks supporting documentation and the timing basis before deciding how the reviewed exception should be resolved and monitored.";
    draft.slides[9]!.blocks = [{ kind: "table", columns: ["ID", "Assumption", "Working figure", "Owner", "Status"], decisiveRows: [0],
      rows: [["[A:V1]", statement, FIGURE, "Operations improvement lead", "Open"],
        ["Review", "Check timing", "To confirm", "Operations lead", "Open"]] }];
    const bytes = await renderReferenceDeck(draft);
    const rendered = await inspectDeck(bytes);
    const cells = rendered.slides[9]!.tableText!;
    expect(cells.find((cell) => cell.text === statement)).toMatchObject({ fontSize: 11, heightIn: expect.any(Number) });
    expect(cells.find((cell) => cell.text === statement)!.heightIn).toBeGreaterThan(0.5);
    expect(judgeRenderedDeck(rendered, { referenceDeck: draft }).findings.filter((finding) => finding.kind === "reference_layout")).toEqual([]);
    const zip = await JSZip.loadAsync(bytes);
    const original = await zip.file("ppt/slides/slide10.xml")!.async("string");
    const damage = async (replacement: (shape: string) => string) => {
      zip.file("ppt/slides/slide10.xml", original.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) =>
        shape.includes('name="ref:body:table-text:1:1"') ? replacement(shape) : shape));
      return judgeRenderedDeck(await inspectDeck(await zip.generateAsync({ type: "nodebuffer" })), { referenceDeck: draft });
    };
    expect((await damage((shape) => shape.replace(/cy="\d+"/, 'cy="91440"'))).findings)
      .toContainEqual(expect.objectContaining({ kind: "reference_layout", slide: 10, detailCode: "table_text_overflow" }));
    expect((await damage((shape) => shape.replaceAll('sz="1100"', 'sz="600"'))).findings)
      .toContainEqual(expect.objectContaining({ kind: "reference_layout", slide: 10, detailCode: "table_type_size" }));
  });

  it("renders every archetype as editable shapes and text with business-case notes", async () => {
    const draft = spec("investment");
    expect(validateReferenceDeck(draft).filter((f) => f.blocking)).toEqual([]);
    const rendered = await inspectDeck(await renderReferenceDeck(draft));
    expect(rendered.slideCount).toBe(REFERENCE_ARCHETYPES.length);
    const verdict = judgeRenderedDeck(rendered, { referenceDeck: draft });
    expect(verdict.fidelityScore).toBeLessThan(100);
    expect(verdict.findings.some((finding) => finding.kind === "reference_structure" && finding.message.includes("KPI tiles"))).toBe(true);
    for (const [index, archetype] of REFERENCE_ARCHETYPES.entries()) {
      const slide = rendered.slides[index]!;
      expect(slide.pictureCount).toBe(0);
      expect(slide.chartCount).toBe(0);
      expect(slide.tableCount).toBe(0);
      expect(slide.notesText).toContain("The point:");
      if (archetype !== "cover" && archetype !== "divider") {
        expect(slide.objectNames).toContain(`ref:action:${archetype}:VALIDATE`);
        expect(slide.objectNames).toContain("ref:answer:bar");
        expect(slide.objectNames).toContain("ref:chip:VALIDATE:filled");
      }
      if (draft.slides[index]!.blocks[0]!.kind === "table")
        expect(slide.objectNames?.some((name) => name.startsWith("ref:body:table-cell:"))).toBe(true);
    }
  }, 60_000);

  it("blocks unbound figures and validation-edition investment material", async () => {
    const draft = spec("validation");
    expect(validateReferenceDeck(draft).filter((f) => f.blocking)).toEqual([]);
    const rendered = await inspectDeck(await renderReferenceDeck(draft));
    expect(rendered.slideCount).toBe(11);
    const violated = spec("validation");
    violated.slides[2]!.answer = "The next plan is ready.";
    expect(validateReferenceDeck(violated).some((f) => f.code === "edition_violation" && f.blocking)).toBe(true);
    await expect(renderReferenceDeck(violated)).rejects.toThrow("reference_deck_blocked");
    const invented = spec("validation");
    invented.slides[3]!.answer = "The unsupported estimate is $9,999.";
    expect(validateReferenceDeck(invented).some((f) => f.code === "unbound_prose_figure" && f.blocking)).toBe(true);
    const inventedCell = spec("validation");
    const table = inventedCell.slides[4]!.blocks[0]!;
    if (table.kind !== "table") throw new Error("fixture expected table");
    table.rows[1]![1] = "$9,999";
    expect(validateReferenceDeck(inventedCell).some((f) => f.code === "unbound_prose_figure" && f.blocking)).toBe(true);
    const inventedBinding = spec("validation");
    const metric = inventedBinding.slides[1]!.blocks[0]!;
    if (metric.kind !== "metrics") throw new Error("fixture expected KPI tiles");
    metric.items[0]!.value = { ...FIGURE, display: "$2,000" };
    expect(validateReferenceDeck(inventedBinding).some((f) => f.code === "figure_ledger" && f.blocking)).toBe(true);
  }, 60_000);

  it("detects planted rendered-file mutations independently of the authored spec", async () => {
    const draft = spec("investment");
    const rendered = await inspectDeck(await renderReferenceDeck(draft));
    const target = rendered.slides[5]!;
    const cases = [
      { change: { objectNames: target.objectNames!.filter((n) => n !== "ref:chip:VALIDATE:filled") }, kind: "reference_structure" },
      { change: { objectNames: target.objectNames!.filter((n) => n !== "ref:answer:bar") }, kind: "reference_structure" },
      { change: { objectNames: target.objectNames!.filter((n) => n !== "ref:source-line"), namedText: { ...target.namedText, "ref:source-line": "" } }, kind: "reference_source", detailCode: "source_line_mismatch" },
      { change: { notesText: "" }, kind: "reference_structure" },
      { change: { pictureCount: 1 }, kind: "reference_editability" },
      { change: { textRuns: target.textRuns.filter((run) => !run.includes("$1,000")) }, kind: "reference_source", detailCode: "bound_figure_missing" },
      { change: { textRuns: [...target.textRuns, "The readback is ready"] }, kind: "reference_client_copy", detailCode: "internal_term" },
    ];
    for (const item of cases) {
      const { change, kind } = item;
      const slides = [...rendered.slides];
      slides[5] = { ...target, ...change };
      const verdict = judgeRenderedDeck({ ...rendered, slides }, { referenceDeck: draft });
      expect(verdict.findings.some((finding) => finding.kind === kind && "slide" in finding && finding.slide === 6)).toBe(true);
      if ("detailCode" in item) {
        expect(verdict.findings).toContainEqual(expect.objectContaining({ kind, slide: 6, detailCode: item.detailCode }));
      }
    }
    const cover = rendered.slides[0]!;
    const coverSlides = [...rendered.slides];
    coverSlides[0] = { ...cover, namedText: { ...cover.namedText, "ref:cover:title": "Validate the need; no solution, plan or cost." } };
    expect(judgeRenderedDeck({ ...rendered, slides: coverSlides }, { referenceDeck: draft }).findings)
      .toContainEqual(expect.objectContaining({ kind: "reference_client_copy", slide: 1, detailCode: "cover_use_case" }));
    coverSlides[0] = { ...cover, textRuns: [...cover.textRuns, "Validate the need; no solution, plan or cost."] };
    expect(judgeRenderedDeck({ ...rendered, slides: coverSlides }, { referenceDeck: draft }).findings)
      .toContainEqual(expect.objectContaining({ kind: "reference_client_copy", slide: 1, detailCode: "edition_rule_visible" }));
    const bodySlides = [...rendered.slides];
    bodySlides[5] = { ...target, textRuns: [...target.textRuns, "Validate the need; no solution, plan or cost."] };
    expect(judgeRenderedDeck({ ...rendered, slides: bodySlides }, { referenceDeck: draft }).findings)
      .toContainEqual(expect.objectContaining({ kind: "reference_client_copy", slide: 6, detailCode: "edition_rule_visible" }));
  }, 60_000);
});
