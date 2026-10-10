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
      { name: "Silver", items: ["Clean"] }, { name: "Gold", items: ["Governed"] },
      { name: "Semantic", items: ["Measures"] }, { name: "Use", items: ["Decisions"] },
    ], governance: "Lineage and quality checks" };
  if (archetype === "releases")
    return { kind: "timeline", quarters: ["Early", "Middle", "Later"], rows: [
      { label: "Foundation", from: 0, to: 1 }, { label: "Validation", from: 1, to: 2 },
    ], today: 0, commit: 2 };
  if (archetype === "ai_options")
    return { kind: "text", lines: ["Candidate: reviewed summary", "Purpose: help owners compare evidence", "Prerequisite: governed source access"] };
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
    actionTitle: archetype === "cover" && edition === "validation"
      ? "Validate the problem and value; no solution, plan or cost."
      : TITLE,
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
      { change: { objectNames: target.objectNames!.filter((n) => n !== "ref:source-line"), namedText: { ...target.namedText, "ref:source-line": "" } }, kind: "reference_source" },
      { change: { notesText: "" }, kind: "reference_structure" },
      { change: { pictureCount: 1 }, kind: "reference_editability" },
    ] as const;
    for (const { change, kind } of cases) {
      const slides = [...rendered.slides];
      slides[5] = { ...target, ...change };
      const verdict = judgeRenderedDeck({ ...rendered, slides }, { referenceDeck: draft });
      expect(verdict.findings.some((finding) => finding.kind === kind && "slide" in finding && finding.slide === 6)).toBe(true);
    }
  }, 60_000);
});
