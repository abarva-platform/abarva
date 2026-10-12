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
  title: "Reviewed evidence identifies the next decision.",
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
  it.each(["validation", "investment"] as const)("uses a real %s cover and section-answer contents", (edition) => {
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(fixture(edition), words(sequence.length));
    expect(spec.slides[0]?.actionTitle).toBe("Synthetic facility performance");
    expect(spec.slides[3]?.section).toBe("CONTEXT");
    expect(spec.slides[0]?.answer).toContain(edition === "validation" ? "for your team to validate" : "value over three years");
    expect(spec.slides[0]?.actionTitle).not.toContain("no solution, plan or cost");
    const contents = spec.slides[2]?.blocks[0];
    if (contents?.kind !== "table") throw new Error("expected contents table");
    expect(contents.columns).toEqual(["Section", "The answer in this section", "Slides"]);
    expect(contents.rows).toHaveLength(5);
    expect(contents.rows.map((row) => String(row[0]))).toEqual(expect.arrayContaining([
      expect.stringMatching(/^01\s/), expect.stringMatching(/^02\s/), expect.stringMatching(/^03\s/),
      expect.stringMatching(/^04\s/), expect.stringMatching(/^05\s/),
    ]));
    expect(contents.rows.every((row) => String(row[1]).trim().split(/\s+/).length >= 5 && String(row[2]).trim())).toBe(true);
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
  });

  it("preserves domain wording in the use-case name while refusing internal phrases", () => {
    const inputs = fixture("validation");
    inputs.move.name = "Governed data foundation for AI";
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    expect(spec.slides[0]?.actionTitle).toBe(inputs.move.name);
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    spec.slides[1]!.answer = "The governed gap depends on register rows.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "client_copy_term", blocking: true, slide: 2 }));
    spec.slides[1]!.answer = "Confirm the supporting source with your team.";
    spec.slides[1]!.actionTitle = "Big number context: the evidence identifies the next decision.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "client_copy_term", blocking: true, slide: 2 }));
  });

  it("replaces a sentence with missing figures and retains its exact basis in notes", async () => {
    const inputs = fixture("investment");
    const authored = words(INVESTMENT_SEQUENCE.length);
    authored[1]!.title = "The annual basis {value.annual.base} can be compared with {rom.total.plan}";
    authored[1]!.answer = "Compare {value.annual.base} with the estimate {rom.total.plan} before deciding.";
    const spec = buildReferenceEdition(inputs, authored);
    const summary = spec.slides[1]!;
    expect(summary.actionTitle).toBe("The value case still needs a confirmed basis");
    expect(summary.answer).toBe("Confirm the source and counting basis before relying on this value.");
    expect(summary.actionTitle).not.toContain("unavailable");
    expect(summary.speakerNotes).toContain("Draft title awaiting input:");
    expect(summary.speakerNotes).toContain("$1,200,000");
    expect(summary.visibleNarrativeFigures).toEqual([]);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) =>
      finding.kind === "reference_source" && "slide" in finding && finding.slide === 2)).toEqual([]);
  }, 60_000);

  it("uses one client-language panel for each empty exhibit and keeps partial rows", () => {
    const inputs = fixture("validation");
    inputs.register = { status: "ready", value: { assumptions: [], figuresRedacted: false } };
    inputs.citations = { status: "ready", value: [] };
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    for (const archetype of ["assumptions", "sources", "flow_today"] as const) {
      const blocks = spec.slides.find((slide) => slide.archetype === archetype)?.blocks;
      expect(blocks).toHaveLength(1);
      expect(blocks?.[0]?.kind).toBe("gap");
    }
    const partial = fixture("validation");
    if (partial.register.status !== "ready") throw new Error("missing fixture");
    partial.register.value.assumptions[0]!.source = "";
    const partialSpec = buildReferenceEdition(partial, words(VALIDATION_SEQUENCE.length));
    const table = partialSpec.slides.find((slide) => slide.archetype === "assumptions")?.blocks[0];
    expect(table?.kind).toBe("table");
    if (table?.kind === "table") expect(table.rows[0]?.[2]).toBe("To confirm");
    const sparse = fixture("validation");
    sparse.valueCase = { status: "failed", detail: "Value read unavailable." };
    sparse.capture[1] = { status: "gap", detail: "Sponsor notes unavailable." };
    sparse.capture[2] = { status: "gap", detail: "Discovery notes unavailable." };
    const sparseSpec = buildReferenceEdition(sparse, words(VALIDATION_SEQUENCE.length));
    const contextBlocks = sparseSpec.slides.find((slide) => slide.archetype === "big_number_context")?.blocks;
    expect(contextBlocks?.filter((block) => block.kind === "gap")).toHaveLength(1);
    expect(contextBlocks?.some((block) => block.kind === "table")).toBe(false);
  });

  it("blocks internal slide words and cover rules while marking down count dumps", () => {
    const spec = buildReferenceEdition(fixture("validation"), words(VALIDATION_SEQUENCE.length));
    spec.slides[1]!.answer = "The governed slot needs a readback.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "client_copy_term", blocking: true, slide: 2 }));
    spec.slides[1]!.answer = "The readback is ready for discussion.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "client_copy_term", blocking: true, slide: 2 }));
    spec.slides[1]!.answer = "Confirmed assumption rows number 21.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "answer_count_dump", slide: 2 }));
    spec.slides[0]!.actionTitle = "Validate the need; no solution, plan or cost.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "cover_edition_rule", blocking: true, slide: 1 }));
    spec.slides[2]!.answer = "This edition excludes the solution, plan and cost.";
    expect(validateReferenceDeck(spec)).toContainEqual(expect.objectContaining({ code: "edition_rule_visible", blocking: true, slide: 3 }));
  });

  it("checks a governed notes-only figure in notes without demanding it on the canvas", async () => {
    const drafted = words(VALIDATION_SEQUENCE.length);
    drafted[2]!.notes = "The point: {value.annual.base} is the governed annual basis. How to read: inspect its source line.";
    const spec = buildReferenceEdition(fixture("validation"), drafted);
    const contents = spec.slides[2]!;
    const figure = contents.narrativeFigures?.[0];
    expect(figure).toBeDefined();
    expect(contents.visibleNarrativeFigures).toEqual([]);
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    const inspected = await inspectDeck(await renderReferenceDeck(spec));
    expect(inspected.slides[2]?.textRuns.join(" ")).not.toContain(figure!.display);
    expect(inspected.slides[2]?.notesText).toContain(figure!.display);
    const verdict = judgeRenderedDeck(inspected, { referenceDeck: spec });
    expect(verdict.findings).not.toContainEqual(expect.objectContaining({ kind: "reference_source", slide: 3 }));
    const damagedSlides = [...inspected.slides];
    damagedSlides[2] = { ...damagedSlides[2]!, notesText: damagedSlides[2]!.notesText!.replaceAll(figure!.display, "") };
    const damaged = judgeRenderedDeck({ ...inspected, slides: damagedSlides }, { referenceDeck: spec });
    expect(damaged.findings).toContainEqual(expect.objectContaining({
      kind: "reference_source", slide: 3, detailCode: "notes_figure_missing",
    }));
  }, 60_000);

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

  it("shows a read failure in one client-language panel and refuses an invented figure", () => {
    const inputs = fixture("validation");
    inputs.valueCase = { status: "failed", detail: "Value case could not be read." };
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    expect(JSON.stringify(spec.slides[7]?.blocks)).toContain("To confirm");
    expect(spec.slides[7]?.speakerNotes).toContain("Value case could not be read.");
    expect(JSON.stringify(spec.slides[7]?.blocks)).not.toContain("Value case could not be read.");
    spec.slides[4]!.answer = "Unsupported value is $9,999.";
    expect(validateReferenceDeck(spec).some((finding) => finding.code === "unbound_prose_figure" && finding.blocking)).toBe(true);
  });

  it("uses the recorded handoffs and cuts labels at word boundaries", async () => {
    const workflow = fixture("validation");
    if (workflow.capture[2].status !== "ready") throw new Error("missing fixture");
    workflow.capture[2].value.process_handoffs = "Patient access checks coverage and authorization before submission, billing submits the claim, the clearinghouse acknowledges, the analyst routes corrections.";
    const workflowSpec = buildReferenceEdition(workflow, words(VALIDATION_SEQUENCE.length));
    const workflowFlow = workflowSpec.slides
      .find((slide) => slide.archetype === "flow_today")?.blocks.find((block) => block.kind === "flow");
    if (workflowFlow?.kind !== "flow") throw new Error("expected recorded flow");
    expect(workflowFlow.nodes[0]).toBe("Patient access checks coverage and…");
    expect(workflowFlow.nodes[1]).toBe("billing submits the claim");
    expect(workflowFlow.nodes[2]).toBe("the clearinghouse acknowledges");
    expect(workflowFlow.fullNodes?.[3]).toBe("the analyst routes corrections");
    expect(workflowFlow.nodes.every((label, index) =>
      !label.endsWith("…") || workflowFlow.fullNodes?.[index]?.startsWith(`${label.slice(0, -1)} `))).toBe(true);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-recorded-flow.pptx`, await renderReferenceDeck(workflowSpec));
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-recorded-flow-spec.json`, JSON.stringify(workflowSpec));
    }
  });

  it("keeps a longer synthetic handoff sequence readable and source-linked", async () => {
    const inputs = fixture("validation");
    if (inputs.capture[2].status !== "ready") throw new Error("missing fixture");
    inputs.capture[2].value.process_handoffs = "Patient access checks coverage, billing submits, the clearinghouse acknowledges, remits arrive, the analyst maps a reason and routes a correction, and cash application reconciles recovery or final disposition.";
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    const flowSlide = spec.slides.find((slide) => slide.archetype === "flow_today")!;
    const flow = flowSlide.blocks.find((block) => block.kind === "flow");
    if (flow?.kind !== "flow") throw new Error("expected source flow");
    expect(flow.nodes).toHaveLength(6);
    expect(flow.nodes[4]).toBe("the analyst maps a reason and routes a correction");
    expect(flowSlide.speakerNotes).toContain("cash application reconciles recovery or final disposition");
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings
      .filter((finding) => finding.kind === "reference_flow_label")).toEqual([]);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-six-stage-flow.pptx`, await renderReferenceDeck(spec));
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-six-stage-flow-spec.json`, JSON.stringify(spec));
    }
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
    expect(spec.slides[4]?.actionTitle).toBe("The value case still needs a confirmed basis");
    expect(spec.slides[4]?.speakerNotes).toContain("not yet modelled");
    expect(spec.slides[4]?.speakerNotes).toContain("No value levers yet; add them in P4 Step 3.");
    expect(JSON.stringify(spec.slides[4]?.blocks)).not.toContain("P4 Step 3");
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
    expect(JSON.stringify(spec.slides)).toContain("To confirm");
    expect(JSON.stringify(spec.slides.map((slide) => slide.blocks))).not.toContain("Gap — register figure or source missing");
    expect(spec.figureLedger.some((entry) => entry.sourceId === "[A:V1]")).toBe(false);
  });

  it.each(["validation", "investment"] as const)("marks every %s wording fallback as unavailable", async (edition) => {
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(fixture(edition), unavailableEditionWords(edition, sequence));
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    const pptx = await renderReferenceDeck(spec);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT)
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}-fallback.pptx`, pptx);
    const rendered = await inspectDeck(pptx);
    expect(rendered.slides.filter((_, index) => !["cover", "divider"].includes(sequence[index]!))
      .every((slide) => slide.textRuns.join(" ").toLowerCase().includes("draft words unavailable"))).toBe(true);
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
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT)
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}.pdf`, Buffer.concat(chunks));
  }, 60_000);
});
