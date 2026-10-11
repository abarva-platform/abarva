import { buildReferenceEdition, INVESTMENT_SEQUENCE, VALIDATION_SEQUENCE } from "../reference-deck-edition";
import { validateReferenceDeck } from "../reference-deck-model";
import { renderReferenceDeck } from "../reference-deck-renderer";
import { inspectDeck } from "../deck-inspection";
import { judgeRenderedDeck } from "../deck-quality";
import { buildReferenceWorkbook } from "../reference-deck-workbook";
import ExcelJS from "exceljs";
import fs from "node:fs";
import type { EditionInputs } from "../reference-deck-inputs";
import type { EditionWords } from "../reference-deck-words";
import { unavailableEditionWords } from "../reference-deck-words";

const basis = (values: number[]) => {
  const totalCents = values.reduce((sum, item) => sum + item, 0);
  return { annualCents: values, totalCents, roi: (totalCents - 30000000) / 30000000 };
};
const words = (count: number): EditionWords[] => Array.from({ length: count }, () => ({
  title: "The governed read identifies the next decision.",
  answer: "Confirm the source and the owner before advancing.",
  notes: "The point: this exhibit has a governed basis. How to read: follow the source line to its exact input.",
}));

function fixture(edition: EditionInputs["edition"]): EditionInputs {
  return {
    edition,
    move: { id: "synthetic", name: "Synthetic facility performance", problemStatement: "Fragmented reporting", targetOutcome: "Clearer decisions" } as EditionInputs["move"],
    valueCase: { status: "ready", value: { ok: true, programId: "synthetic", figuresRedacted: false, case: {
      status: "evaluated", economics: {
        annualCashCents: { base: 120000000 },
        costCents: { base: 30000000 },
        threeYearBases: { base: {
          creditedEarned: basis([100000000, 120000000, 140000000]),
          creditedPaid: basis([90000000, 110000000, 130000000]),
          programEarned: basis([120000000, 140000000, 160000000]),
          programPaid: basis([110000000, 130000000, 150000000]),
        } },
      },
    } } },
    register: { status: "ready", value: { figuresRedacted: false, assumptions: [{
      registerId: "V1", statement: "Review the baseline", workingFigure: "$1,200", source: "Synthetic assumption row", ownerRole: "Data lead", status: "open",
    }] } },
    rom: { status: "gap", detail: "No approved ROM snapshot is available." },
    citations: { status: "ready", value: [{ citationNumber: 1, url: "https://example.org", title: "Synthetic published source", publisher: "Example", publishedAt: null, retrievedAt: "2026-10-10", excerpt: "Synthetic excerpt", claim: null }] },
    capture: {
      1: { status: "ready", value: { sponsor_commitment: "Sponsor will review", scope_boundary: "Facility reporting", success_criteria: "Decision clarity" } },
      2: { status: "ready", value: { current_state_findings: "Reporting is fragmented", process_handoffs: "Handoffs need review", data_quality_governance: "Data lead reviews sources" } },
      3: { status: "ready", value: { operating_model: "Data lead owns review", controls_governance: "Council approves access", architecture_integration: "Governed intake", solution_approach: "Review evidence", workflow_delta: "Fewer manual handoffs" } },
    },
  };
}

describe("live-input reference edition", () => {
  it.each(["validation", "investment"] as const)("builds %s from bound synthetic governed reads", async (edition) => {
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(fixture(edition), words(sequence.length));
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}-spec.json`, JSON.stringify(spec));
    }
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    expect(spec.figureLedger.length).toBeGreaterThan(3);
    const pptx = await renderReferenceDeck(spec);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}.pptx`, pptx);
    }
    const rendered = await inspectDeck(pptx);
    expect(rendered.slideCount).toBe(sequence.length);
    expect(rendered.slides.every((slide) => slide.pictureCount === 0)).toBe(true);
    expect(rendered.slides[1]?.namedText?.["ref:footer"]).toBe("Synthetic facility performance · Discussion draft");
    const verdict = judgeRenderedDeck(rendered, { referenceDeck: spec });
    expect(verdict.fidelityScore).toEqual(expect.any(Number));
    const fallbackVerdict = judgeRenderedDeck(rendered, { referenceDeck: spec, fallbackWordSlides: [1, 2] });
    expect(fallbackVerdict.findings.filter((finding) => finding.kind === "fallback_words")).toHaveLength(2);
    expect(fallbackVerdict.fidelityScore).toBe((verdict.fidelityScore ?? 0) - 10);
    const workbookBytes = await buildReferenceWorkbook(fixture(edition), spec);
    const workbook = new ExcelJS.Workbook();
    // ExcelJS declares a legacy Buffer shape; its runtime accepts Node buffers.
    await workbook.xlsx.load(workbookBytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const figures = workbook.getWorksheet("Deck Figures");
    expect(figures).toBeDefined();
    for (const entry of spec.figureLedger) {
      const cell = entry.workbookCell.split("!")[1]!;
      expect(figures!.getCell(cell).value).toBe(entry.display);
    }
    expect(workbook.getWorksheet("Move Assumptions")?.getCell("A2").value).toBe("V1");
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}-score.json`, JSON.stringify(verdict, null, 2));
    }
  }, 60_000);

  it("shows a read failure as a gap and refuses an invented figure", () => {
    const inputs = fixture("validation");
    inputs.valueCase = { status: "failed", detail: "Value case could not be read." };
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    expect(JSON.stringify(spec.slides)).toContain("Gap — Value case could not be read.");
    spec.slides[4]!.answer = "Unsupported value is $9,999.";
    expect(validateReferenceDeck(spec).some((finding) => finding.code === "unbound_prose_figure" && finding.blocking)).toBe(true);
  });

  it("chooses the flow exhibit from the canonical use-case type", () => {
    const workflow = fixture("validation");
    workflow.move.archetype = "workflow_automation";
    const platform = fixture("validation");
    platform.move.archetype = "platform_modernization";
    const workflowFlow = buildReferenceEdition(workflow, words(VALIDATION_SEQUENCE.length)).slides
      .find((slide) => slide.archetype === "flow_today")?.blocks.find((block) => block.kind === "flow");
    const platformFlow = buildReferenceEdition(platform, words(VALIDATION_SEQUENCE.length)).slides
      .find((slide) => slide.archetype === "flow_today")?.blocks.find((block) => block.kind === "flow");
    expect(workflowFlow?.kind === "flow" ? workflowFlow.nodes : []).toContain("Handoff");
    expect(platformFlow?.kind === "flow" ? platformFlow.nodes : []).toContain("Canonical model");
  });

  it("substitutes a governed title slot, carries its ledger source and rejects a model-written digit", () => {
    const authored = words(VALIDATION_SEQUENCE.length);
    authored[4] = {
      title: "Credited value reaches {value.three_year.credited} over three years",
      answer: "Review {value.three_year.credited} against the counted basis.",
      notes: "The point: verify {value.three_year.credited}. How to read: inspect the governed source.",
    };
    const spec = buildReferenceEdition(fixture("validation"), authored);
    const noSlotWords = buildReferenceEdition(fixture("validation"), words(VALIDATION_SEQUENCE.length));
    expect(spec.figureLedger).toEqual(noSlotWords.figureLedger);
    const slide = spec.slides[4]!;
    expect(slide.actionTitle).toContain("$3,600,000");
    expect(slide.narrativeFigures?.some((figure) => figure.display === "$3,600,000")).toBe(true);
    expect(slide.sourceIds).toContain("engine:three_year_credited_earned");
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    slide.actionTitle = "A model typed $9,999 outside the governed slot.";
    expect(validateReferenceDeck(spec).some((finding) => finding.code === "unbound_prose_figure" && finding.blocking)).toBe(true);
  });

  it("renders an authoritative empty value case as a visible gap and refuses disallowed slots", () => {
    const inputs = fixture("validation");
    inputs.valueCase = { status: "empty", detail: "No value levers yet; add them in P4 Step 3." };
    const authored = words(VALIDATION_SEQUENCE.length);
    authored[4]!.title = "Credited value reaches {value.three_year.credited} over three years";
    const spec = buildReferenceEdition(inputs, authored);
    expect(spec.slides[4]?.actionTitle).toContain("not yet modelled");
    expect(JSON.stringify(spec.slides)).toContain("No value levers yet; add them in P4 Step 3.");
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    authored[4]!.title = "The delivery basis is {rom.total.plan} before approval";
    expect(() => buildReferenceEdition(inputs, authored)).toThrow("unknown_or_disallowed_slot");
    spec.slides[4]!.speakerNotes += " Review the solution plan.";
    expect(validateReferenceDeck(spec).some((finding) => finding.code === "edition_violation" && finding.blocking)).toBe(true);
  });

  it("shows a register-source gap instead of binding a figure to an invented source", () => {
    const inputs = fixture("validation");
    if (inputs.register.status !== "ready") throw new Error("synthetic register fixture missing");
    inputs.register.value.assumptions[0]!.source = "";
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    expect(JSON.stringify(spec.slides)).toContain("Gap — register figure or source missing");
    expect(spec.figureLedger.some((entry) => entry.sourceId === "[A:V1]")).toBe(false);
  });

  it.each(["validation", "investment"] as const)("renders every %s fallback without the unavailable marker", async (edition) => {
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(fixture(edition), unavailableEditionWords(edition, sequence));
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    const pptx = await renderReferenceDeck(spec);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT)
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}-fallback.pptx`, pptx);
    const rendered = await inspectDeck(pptx);
    expect(rendered.slides.flatMap((slide) => slide.textRuns).join(" ")).not.toContain("draft words unavailable");
    const verdict = judgeRenderedDeck(rendered, { referenceDeck: spec, fallbackWordSlides: sequence.map((_, index) => index + 1) });
    expect(verdict.findings.filter((finding) => finding.kind === "fallback_words")).toHaveLength(sequence.length);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT)
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}-fallback-score.json`, JSON.stringify(verdict, null, 2));
    const [{ pdf }, { buildReferenceDeckPdf }] = await Promise.all([
      import("@react-pdf/renderer"), import("../reference-deck-pdf"),
    ]);
    const stream = await pdf(buildReferenceDeckPdf(spec)).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>)
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    expect(Buffer.concat(chunks).subarray(0, 4).toString()).toBe("%PDF");
  }, 60_000);
});
