import { buildReferenceEdition, INVESTMENT_SEQUENCE, VALIDATION_SEQUENCE } from "../reference-deck-edition";
import { validateReferenceDeck, ReferenceDeckLineageRefusal, type ReferenceBlock } from "../reference-deck-model";
import { renderReferenceDeck } from "../reference-deck-renderer";
import { inspectDeck } from "../deck-inspection";
import { judgeRenderedDeck } from "../deck-quality";
import { approvedRomLoaders, buildReferenceWorkbook } from "../reference-deck-workbook";

const mockListRateCardVersions = jest.fn();
const mockListRateCardLines = jest.fn();
jest.mock("@/lib/pricing/rate-card-repository", () => ({
  getCurrentRateCard: async () => null,
  listRateCardVersions: (...args: unknown[]) => mockListRateCardVersions(...args),
  listRateCardLines: (...args: unknown[]) => mockListRateCardLines(...args),
}));
import ExcelJS from "exceljs";
import fs from "node:fs";
import type { EditionInputs } from "../reference-deck-inputs";
import type { EditionWords } from "../reference-deck-words";
import { unavailableEditionWords } from "../reference-deck-words";
import type { ReferenceCell, ReferenceFigure } from "../reference-deck-model";
import { AI_SCENARIO_NOT_FUNDING_DETAIL } from "@/lib/programs/value-engine/value-case-view";
import { buildReferenceNarrativeEvidence, buildReferenceSlotTable } from "../reference-deck-slots";

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
  it.each(["validation", "investment"] as const)("gives every %s figure one display, so a title and its exhibit match", (edition) => {
    const inputs = fixture(edition);
    inputs.rom = { status: "ready", value: { id: "ROM-1", result: { combined: { planCents: 55_000_000 }, releases: [] }, workbookStructure: { unitHours: {} } } } as never;
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(inputs, words(sequence.length));
    const displays = new Map<string, Set<string>>();
    for (const figure of spec.figureLedger) displays.set(figure.sourceId, (displays.get(figure.sourceId) ?? new Set()).add(figure.display));
    const split = [...displays].filter(([, set]) => set.size > 1).map(([id, set]) => `${id}: ${[...set].join(" | ")}`);
    expect(split).toEqual([]);
    // The slot a title uses and the exhibit read the same compact form.
    expect(displays.get("engine:three_year_credited_earned")).toEqual(new Set(["$3.60M"]));
    if (edition === "investment") expect(displays.get("rom:ROM-1:combined_plan")).toEqual(new Set(["$0.55M"]));
  });

  it("keeps unsupported wording blocked with source-free typed refusal metadata", () => {
    const inputs = fixture("validation");
    inputs.valueCase = { status: "empty", detail: "Synthetic value evidence is unavailable." };
    const authored = words(VALIDATION_SEQUENCE.length);
    authored[7]!.answer = "The annual value is confirmed before proceeding.";
    try {
      buildReferenceEdition(inputs, authored);
      throw new Error("Expected a lineage refusal");
    } catch (error) {
      expect(error).toBeInstanceOf(ReferenceDeckLineageRefusal);
      expect((error as ReferenceDeckLineageRefusal).findings).toContainEqual({
        kind: "reference_lineage", slide: 8, code: "unsupported_narrative", detailCode: "unavailable_value_claim",
      });
      expect(JSON.stringify(error)).not.toContain(authored[7]!.answer);
    }
  });

  it.each([
    ["validation", "empty"], ["investment", "empty"],
    ["validation", "failed"], ["investment", "failed"],
  ] as const)("renders unavailable words without a value case in %s when the read is %s", async (edition, status) => {
    const inputs = fixture(edition);
    inputs.valueCase = { status, detail: "Synthetic value evidence is unavailable." };
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(inputs, unavailableEditionWords(edition, sequence));
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    expect(spec.figureLedger.some((figure) => figure.sourceId.startsWith("engine:"))).toBe(false);
    expect(spec.slides.find((entry) => entry.archetype === "one_step_value")?.answer).toContain("Draft words unavailable.");
    expect(JSON.stringify(spec.slides.map((entry) => entry.blocks))).toContain("To confirm");
    const pptx = await renderReferenceDeck(spec);
    const verdict = judgeRenderedDeck(await inspectDeck(pptx), {
      referenceDeck: spec, fallbackWordSlides: sequence.map((_, index) => index + 1),
    });
    expect(verdict.findings.filter((finding) => finding.kind === "reference_client_copy")).toEqual([]);
    expect(verdict.findings.filter((finding) => finding.kind === "fallback_words")).toHaveLength(sequence.length);
    expect(verdict.fidelityScore).toBeLessThan(90);
    const bytes = await buildReferenceWorkbook(inputs, spec);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    expect(workbook.getWorksheet("Value Case")?.getCell("A2").value).toBe("Gap — value-case figures unavailable");
    expect(workbook.getWorksheet("Value Case")?.getCell("B2").value).toBe("");
    for (const figure of spec.figureLedger) {
      const [sheet, cell] = figure.workbookCell.split("!");
      expect(workbook.getWorksheet(sheet!)?.getCell(cell!).value).toBe(figure.display);
    }
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      const prefix = `${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-${edition}-${status}-unavailable`;
      fs.writeFileSync(`${prefix}.pptx`, pptx);
      fs.writeFileSync(`${prefix}.xlsx`, bytes);
      fs.writeFileSync(`${prefix}-spec.json`, JSON.stringify(spec));
      fs.writeFileSync(`${prefix}-score.json`, JSON.stringify(verdict, null, 2));
    }
  }, 60_000);

  const CALCULATED = /\b(?:Calculated case|Case model|Calculated cost|Calculated base)\b/;
  const shown = (spec: ReturnType<typeof buildReferenceEdition>) => JSON.stringify(spec.slides.map((slide) => slide.blocks));

  it.each([
    ["empty", (inputs: EditionInputs) => { inputs.valueCase = { status: "empty", detail: "Synthetic value case not modelled." }; }],
    ["failed", (inputs: EditionInputs) => { inputs.valueCase = { status: "failed", detail: "Synthetic read failed." }; }],
    ["withheld", (inputs: EditionInputs) => { if (inputs.valueCase.status === "ready") inputs.valueCase.value.figuresRedacted = true; }],
    ["blocked", (inputs: EditionInputs) => { if (inputs.valueCase.status === "ready") inputs.valueCase.value.case = { status: "blocked", economics: null }; }],
    ["evaluated without figures", (inputs: EditionInputs) => { if (inputs.valueCase.status === "ready") inputs.valueCase.value.case = { status: "evaluated" }; }],
  ] as const)("claims no calculated case when the value case is %s", (_, alter) => {
    for (const edition of ["validation", "investment"] as const) {
      const inputs = fixture(edition);
      alter(inputs);
      const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
      const spec = buildReferenceEdition(inputs, unavailableEditionWords(edition, sequence));
      expect(shown(spec)).not.toMatch(CALCULATED);
    }
  });

  it("names each calculated basis when the case is evaluated", () => {
    const text = shown(buildReferenceEdition(fixture("investment"), words(INVESTMENT_SEQUENCE.length)));
    for (const label of ["Calculated case", "Case model", "Calculated cost", "Calculated base"]) expect(text).toContain(label);
  });

  it("binds active and open assumption counts to distinct governed sources", () => {
    const inputs = fixture("validation");
    if (inputs.register.status !== "ready") throw new Error("fixture unavailable");
    const row = inputs.register.value.assumptions[0]!;
    inputs.register.value.assumptions = ["open", "confirmed", "corrected"].map((status, index) => ({ ...row, registerId: `V${index + 1}`, status }));
    const authored = words(VALIDATION_SEQUENCE.length);
    authored[9]!.answer = "Of {register.count.active} active assumptions, {register.count.open} remain open for review.";
    const spec = buildReferenceEdition(inputs, authored);
    expect(spec.slides[9]?.answer).toBe("Of 3 active assumptions, 1 remain open for review.");
    expect(spec.figureLedger).toContainEqual(expect.objectContaining({ sourceId: "evidence:register_active_count", display: "3" }));
    expect(spec.figureLedger).toContainEqual(expect.objectContaining({ sourceId: "evidence:register_open_count", display: "1" }));
    authored[9]!.answer = "The {register.count.active} open assumptions require review.";
    expect(() => buildReferenceEdition(inputs, authored)).toThrow("unsupported_narrative");
  });

  it("allows the governed open count when every active assumption is open", () => {
    const inputs = fixture("validation");
    const authored = words(VALIDATION_SEQUENCE.length);
    authored[9]!.answer = "The {register.count.open} open assumptions require review before the next decision.";
    const spec = buildReferenceEdition(inputs, authored);
    expect(spec.slides[9]?.answer).toBe("The 1 open assumptions require review before the next decision.");
    expect(spec.slides[9]?.narrativeEvidence).toMatchObject({ activeCount: "1", openCount: "1" });
    expect(spec.slides[9]?.visibleNarrativeFigures).toContainEqual(expect.objectContaining({ sourceId: "evidence:register_open_count" }));
  });

  it("withholds role setup as evidence and retains substantive scope hypotheses", () => {
    const inputs = fixture("investment");
    inputs.capture[1] = { status: "ready", value: {
      sponsor_commitment: "Synthetic role contact: Executive sponsor. Role alias only; no real person, external email, or outreach.",
      scope_boundary: "Synthetic scope hypothesis: reviewed reporting boundaries and owner decisions.", success_criteria: "Decision clarity",
    } };
    const spec = buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
    const bodies = JSON.stringify(spec.slides.map((slide) => slide.blocks));
    expect(bodies).not.toMatch(/Role alias only|no real person|external email|Synthetic role contact/);
    expect(bodies).toContain("Working scope hypothesis: reviewed reporting boundaries and owner decisions.");
    expect(spec.slides[5]?.sourceIds).toContain("evidence:P1:sponsor_commitment");
  });

  it("withholds both active and open counts when register figures are redacted", () => {
    const inputs = fixture("validation");
    if (inputs.register.status !== "ready") throw new Error("fixture unavailable");
    inputs.register.value.figuresRedacted = true;
    const authored = words(VALIDATION_SEQUENCE.length);
    authored[9]!.answer = "Of {register.count.active} active assumptions, {register.count.open} remain open for review.";
    const spec = buildReferenceEdition(inputs, authored);
    expect(spec.figureLedger.some((figure) => /register_(active|open)_count/.test(figure.sourceId))).toBe(false);
    expect(spec.slides[9]?.narrativeEvidence?.activeCount).toBeUndefined();
    expect(spec.slides[9]?.narrativeEvidence?.openCount).toBeUndefined();
    expect(spec.slides[9]?.answer).not.toMatch(/\d/);
  });

  it("preserves architecture source detail and identifiers behind short editable labels", async () => {
    const inputs = fixture("investment");
    const detail = "Source integration / reviewed transformations / access boundaries with complete provenance and the accountable owner identified in the original approved evidence. The recorded transformation detail remains attached to its source identifier and can be checked without relying on the short diagram label.";
    inputs.capture[3] = { status: "ready", value: { architecture_integration: detail,
      controls_governance: "Reviewed source permissions and recorded transformation provenance establish the controls for use", solution_approach: "A reviewer uses the evidence to make a decision" } };
    const spec = buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
    const block = spec.slides[12]?.blocks.find((item) => item.kind === "architecture");
    expect(block?.kind).toBe("architecture");
    if (block?.kind !== "architecture") throw new Error("architecture absent");
    expect(block.layers[1]?.items[0]).toMatch(/…$/);
    expect(block.layers[1]?.fullItems?.[0]).toBe(detail);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(rendered.slides[12]?.notesText).toContain(detail);
    expect(rendered.slides[12]?.notesText).toContain("evidence:P3:architecture_integration");
    expect(rendered.slides[12]?.architectureText).toHaveLength(6);
    expect(rendered.slides[12]?.architectureText?.every((label) => label.fontSize >= 12 && label.widthIn > 3.5)).toBe(true);
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) => finding.kind === "reference_layout")).toEqual([]);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-architecture.pptx`, await renderReferenceDeck(spec));
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-architecture-spec.json`, JSON.stringify(spec));
    }
  });

  it.each([
    [11, "Each decision has been mapped to the user who holds authority for it."],
    [14, "This figure represents the approved delivery estimate."],
  ])("refuses an unsupported completed-evidence claim on slide %i", (index, answer) => {
    const authored = words(INVESTMENT_SEQUENCE.length); authored[index]!.answer = answer;
    expect(() => buildReferenceEdition(fixture("investment"), authored)).toThrow("unsupported_narrative");
  });

  it.each(["validation", "investment"] as const)("renders long %s workshop answers and assumptions without shrinking table type", async (edition) => {
    const inputs = fixture(edition);
    const statement = "The accountable operations owner checks supporting documentation and the timing basis before deciding how the reviewed exception should be resolved and monitored.";
    inputs.register = { status: "ready", value: { figuresRedacted: false, assumptions: Array.from({ length: 4 }, (_, index) => ({
      registerId: `V${index + 1}`, statement, workingFigure: "$1,200", source: "Synthetic working assumption",
      ownerRole: "Operations improvement and evidence review lead", status: "open",
    })) } };
    inputs.capture[1] = { status: "ready", value: {
      sponsor_commitment: "The sponsor reviews the business outcome and appoints an accountable operations owner to resolve disputed evidence before the team proceeds with delivery.",
      scope_boundary: statement,
      success_criteria: "The agreed measure reflects complete source evidence and timely review of exceptions by the accountable operations owner before the decision is reported.",
    } };
    inputs.capture[2] = { status: "ready", value: { current_state_findings: statement,
      process_handoffs: "Intake reviews evidence; Operations checks eligibility; The analyst examines documentation; The owner assesses the exception; Finance checks timing; The lead monitors the outcome" } };
    if (edition === "investment") {
      const at = "2026-10-10T10:00:00Z";
      const unitHours = { data_source_count: { value: 8, source: "Synthetic unit-hour benchmark", confidence: "medium" as const },
        source_table_count: { value: 12, source: "Synthetic table benchmark", confidence: "medium" as const } };
      const releases = [{ code: "First delivery", name: "First delivery", hours: 8, weeks: 1, lowCents: 80_000, planCents: 100_000, highCents: 150_000 },
        { code: "Later delivery", name: "Later delivery", hours: 12, weeks: 1, lowCents: 120_000, planCents: 150_000, highCents: 200_000 }];
      inputs.rom = { status: "ready", value: { id: "synthetic-approved-estimate", approvedAt: at, workbookHref: "https://example.invalid/approved-estimate",
        result: { version: 1, approvedBy: "synthetic-reviewer", approvedAt: at, inputsFingerprint: "synthetic-fingerprint", unitHours, releases, foundation: null,
          combined: { hours: 20, weeks: 2, lowCents: 200_000, planCents: 250_000, highCents: 350_000 } },
        workbookStructure: { useCases: [{ code: "Case", name: "Synthetic scope", counts: { data_source_count: 1, source_table_count: 1 } }], unitHours,
          releases: releases.map((release) => ({ code: release.code, name: release.name, designStatus: "not_designed", useCaseCodes: ["Case"] })),
          pod: { templateCode: "Synthetic pod", locationCode: "US", rateBasis: "loaded_cost" },
          friction: { value: 1.1, source: "Synthetic workshop" }, productiveShare: { value: 0.7, source: "Synthetic workshop" }, hoursPerFteWeek: { value: 40, source: "Synthetic workshop" } },
      } };
    }
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(inputs, words(sequence.length));
    const bytes = await renderReferenceDeck(spec);
    const rendered = await inspectDeck(bytes);
    expect(rendered.slides.flatMap((slide) => slide.tableText ?? []).every((cell) => cell.fontSize >= 10)).toBe(true);
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) =>
      ["reference_layout", "off_canvas", "reference_source", "reference_edition", "reference_client_copy"].includes(finding.kind))).toEqual([]);
    expect(rendered.slides[9]?.textRuns).toContain(statement);
    if (edition === "investment") {
      expect(rendered.slides[19]?.textRuns).toContain("Approved delivery estimate");
      expect(rendered.slides[19]?.textRuns).toContain("Data sources");
      expect(rendered.slides[19]?.textRuns.join(" ")).not.toContain("rom:synthetic-approved-estimate");
      expect(rendered.slides[19]?.notesText).toContain("rom:synthetic-approved-estimate:unit_hours:data_source_count");
    }
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-long-${edition}.pptx`, bytes);
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-long-${edition}-spec.json`, JSON.stringify(spec));
    }
  });

  it("keeps an eight-stage flow and its missing evidence panel inside the investment body", async () => {
    const inputs = fixture("investment");
    inputs.capture[2] = { status: "ready", value: { process_handoffs: "Intake reviews evidence; Operations checks eligibility; The analyst examines documentation; The owner assesses the exception; The reviewer confirms the basis; Finance checks timing; The team records the decision; The lead monitors the outcome" } };
    const authored = words(INVESTMENT_SEQUENCE.length);
    authored[6]!.title = "The workflow spans several accountable teams whose supporting evidence must be confirmed before leaders can rely on the proposed outcome";
    const spec = buildReferenceEdition(inputs, authored);
    const flow = spec.slides[6]!;
    expect(flow.blocks[0]).toMatchObject({ kind: "flow", nodes: expect.any(Array) });
    expect(flow.blocks[1]).toMatchObject({ kind: "gap", compact: true });
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(rendered.slideCount).toBe(22);
    expect(rendered.slides[6]?.objectNames).toContain("ref:body:governed-gap");
    expect(rendered.slides[6]?.namedText?.["ref:body:flow-label:7"]).toBe("The lead monitors the outcome");
    expect(rendered.slides[6]?.offCanvas).toEqual([]);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-flow-gap-investment.pptx`, await renderReferenceDeck(spec));
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-flow-gap-investment-spec.json`, JSON.stringify(spec));
    }
  });

  it("renders an investment summary with working assumptions and an unavailable financial basis", async () => {
    const inputs = fixture("investment");
    inputs.valueCase = { status: "empty", detail: "The value basis still needs confirmation." };
    const spec = buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
    const summary = spec.slides[1]!;
    expect(summary.blocks.filter((block) => block.kind === "gap")).toHaveLength(1);
    expect(summary.blocks.some((block) => block.kind === "text")).toBe(true);
    expect(spec.figureLedger.some((figure) => figure.sourceId.startsWith("engine:") || figure.sourceId.startsWith("rom:"))).toBe(false);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(rendered.slideCount).toBe(INVESTMENT_SEQUENCE.length);
    expect(rendered.slides[1]!.textRuns.join(" ")).toContain("figures for this exhibit still need confirmation");
    expect(rendered.slides[1]!.textRuns.join(" ")).toContain("Problem: Fragmented reporting");
    expect(rendered.slides.every((slide) => slide.offCanvas.length === 0)).toBe(true);
    const overflowing = structuredClone(spec);
    overflowing.slides[1]!.blocks = overflowing.slides[1]!.blocks.map((block) =>
      block.kind === "gap" ? { ...block, compact: false } : block);
    await expect(renderReferenceDeck(overflowing)).rejects.toThrow("reference_deck_body_overflow: slide 2");
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-missing-value-investment.pptx`, await renderReferenceDeck(spec));
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-missing-value-investment-spec.json`, JSON.stringify(spec));
    }
  });

  it.each(["validation", "investment"] as const)("renders %s partial context without hiding the known value or its confirmation gap", async (edition) => {
    const inputs = fixture(edition);
    inputs.capture[1] = { status: "gap", detail: "Sponsor evidence still needs confirmation." };
    inputs.capture[2] = { status: "gap", detail: "Discovery evidence still needs confirmation." };
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(inputs, words(sequence.length));
    const context = spec.slides.find((slide) => slide.archetype === "big_number_context")!;
    expect(context.blocks.filter((block) => block.kind === "gap")).toHaveLength(1);
    expect(context.blocks.some((block) => block.kind === "metrics")).toBe(true);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(rendered.slides[4]!.textRuns.join(" ")).toContain("$1.20M");
    expect(rendered.slides[4]!.textRuns.join(" ")).toContain("still needs confirmation");
    expect(rendered.slides[4]!.offCanvas).toEqual([]);
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) =>
      ["reference_source", "reference_client_copy", "reference_edition", "off_canvas"].includes(finding.kind))).toEqual([]);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) {
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-partial-${edition}.pptx`, await renderReferenceDeck(spec));
      fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-partial-${edition}-spec.json`, JSON.stringify(spec));
    }
  });

  it.each(["validation", "investment"] as const)("uses a real %s cover and section-answer contents", async (edition) => {
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
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    const contentsPage = rendered.slides[2]!;
    expect(Array.from({ length: 5 }, (_, index) => contentsPage.namedText?.[`ref:body:contents-number:${index}`]))
      .toEqual(["1", "2", "3", "4", "5"]);
    const damaged = [...rendered.slides];
    damaged[2] = { ...contentsPage, namedText: { ...contentsPage.namedText, "ref:body:contents-number:2": "" } };
    expect(judgeRenderedDeck({ ...rendered, slides: damaged }, { referenceDeck: spec }).findings)
      .toContainEqual(expect.objectContaining({ kind: "reference_structure", slide: 3, detailCode: "contents_number_missing" }));
  });

  it.each([
    ["A governed data foundation for claims", "The problem is a governed data foundation for claims."],
    ["Fragmented reporting", "The problem is fragmented reporting."],
    ["AI answers lack sources", "The problem is AI answers lack sources."],
  ])("places the problem statement mid-sentence in the contents: %s", (problemStatement, expected) => {
    const inputs = fixture("investment");
    inputs.move = { ...inputs.move, problemStatement };
    const spec = buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
    const contents = spec.slides[INVESTMENT_SEQUENCE.indexOf("contents")]!.blocks[0]!;
    expect(contents.kind === "table" ? contents.rows[0]![1] : null).toBe(expected);
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

  describe("investment economics on the value-ledger slide", () => {
    const withEconomics = (extra: Record<string, unknown>) => {
      const inputs = fixture("investment");
      if (inputs.valueCase.status !== "ready") throw new Error("fixture");
      const caseBody = inputs.valueCase.value.case as { economics: Record<string, unknown> };
      Object.assign(caseBody.economics, extra);
      return inputs;
    };
    const ECONOMICS = { npvCents: { base: 681_000_000 }, paybackMonth: { base: 13 }, breakevenRealisation: { base: 0.0731 } };
    const ledger = (spec: ReturnType<typeof buildReferenceEdition>) => spec.slides.find((slide) => slide.archetype === "value_ledger")!;

    it("shows NPV, payback and breakeven realisation, bound to the slots' sources and displays", async () => {
      const inputs = withEconomics(ECONOMICS);
      const spec = buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
      const metricsBlock = ledger(spec).blocks.find((block) => block.kind === "metrics");
      expect(metricsBlock && metricsBlock.kind === "metrics" ? metricsBlock.items.map((item) => [item.label, item.value]) : null).toEqual([
        ["Net present value", { display: "$6.81M", sourceId: "engine:npv_base", workbookCell: expect.any(String) }],
        ["Payback", { display: "13 months", sourceId: "engine:payback_month_base", workbookCell: expect.any(String) }],
        ["Breakeven realisation", { display: "7%", sourceId: "engine:breakeven_realisation_base", workbookCell: expect.any(String) }],
      ]);
      // The three-year slide keeps its year-by-year chart.
      expect(spec.slides.find((slide) => slide.archetype === "three_year_value")!.blocks.some((block) => block.kind === "bars")).toBe(true);
      const slots = buildReferenceSlotTable(inputs);
      expect(["value.npv.plan", "value.payback.plan", "value.breakeven.realisation"].map((key) => [slots[key]!.display, slots[key]!.sourceId])).toEqual([
        ["$6.81M", "engine:npv_base"], ["13 months", "engine:payback_month_base"], ["7%", "engine:breakeven_realisation_base"],
      ]);
      const displays = new Map<string, Set<string>>();
      for (const figure of spec.figureLedger) displays.set(figure.sourceId, (displays.get(figure.sourceId) ?? new Set()).add(figure.display));
      expect(["engine:npv_base", "engine:payback_month_base", "engine:breakeven_realisation_base"].map((id) => displays.get(id)?.size)).toEqual([1, 1, 1]);
      expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
      const slideNumber = spec.slides.indexOf(ledger(spec)) + 1;
      const findings = judgeRenderedDeck(await inspectDeck(await renderReferenceDeck(spec)), { referenceDeck: spec }).findings
        .filter((finding) => "slide" in finding && finding.slide === slideNumber);
      expect(findings).toEqual([]);
    }, 60_000);

    it("states a payback that is never reached as a finding, and a negative NPV in accounting form", () => {
      const inputs = withEconomics({ npvCents: { base: -12_000_000 }, paybackMonth: { base: null }, breakevenRealisation: { base: 1.1016 } });
      const spec = buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
      const metricsBlock = ledger(spec).blocks.find((block) => block.kind === "metrics");
      expect(metricsBlock && metricsBlock.kind === "metrics" ? metricsBlock.items.map((item) => typeof item.value === "string" ? item.value : item.value.display) : null)
        .toEqual(["$(0.12)M", "Not within horizon", "110%"]);
      const payback = buildReferenceSlotTable(inputs)["value.payback.plan"]!;
      expect([payback.display, payback.missingPhrase]).toEqual([null, "not reached within the horizon"]);
    });

    it("keeps the validation edition free of investment economics", () => {
      const inputs = withEconomics(ECONOMICS);
      inputs.edition = "validation";
      const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
      expect(JSON.stringify(spec.slides.map((slide) => slide.blocks))).not.toMatch(/Net present value|Payback|Breakeven realisation/);
      expect(spec.figureLedger.some((figure) => /npv|payback|breakeven/.test(figure.sourceId))).toBe(false);
      const slots = buildReferenceSlotTable(inputs);
      expect(["value.npv.plan", "value.payback.plan", "value.breakeven.realisation"].every((key) => !slots[key]!.editions.includes("validation"))).toBe(true);
    });

    it("adds no economics row when the case carries none of the three", () => {
      const spec = buildReferenceEdition(fixture("investment"), words(INVESTMENT_SEQUENCE.length));
      expect(ledger(spec).blocks.map((block) => block.kind)).toEqual(["table"]);
    });
  });

  it("replaces a sentence with missing figures and retains its exact basis in notes", async () => {
    const inputs = fixture("investment");
    const authored = words(INVESTMENT_SEQUENCE.length);
    authored[1]!.title = "The annual basis {value.annual.base} can be compared with {rom.total.plan}";
    authored[1]!.answer = "Compare {value.annual.base} with the estimate {rom.total.plan} before deciding.";
    const spec = buildReferenceEdition(inputs, authored);
    const summary = spec.slides[1]!;
    expect(summary.actionTitle).toBe("The case summary still needs a confirmed value basis");
    expect(summary.answer).toBe("Confirm how value is counted before relying on this summary.");
    expect(summary.actionTitle).not.toContain("unavailable");
    expect(summary.speakerNotes).toContain("Draft title awaiting input:");
    expect(summary.speakerNotes).toContain("$1.20M");
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
    expect(slide.actionTitle).toBe("Credited value reaches $3.60M over three years");
    expect(slide.narrativeFigures?.some((figure) => figure.display === "$3.60M")).toBe(true);
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
    expect(spec.slides[4]?.actionTitle).toBe("The headline value still needs a confirmed basis");
    expect(spec.slides[4]?.speakerNotes).toContain("not yet modelled");
    expect(spec.slides[4]?.speakerNotes).toContain("No value levers yet; add them in P4 Step 3.");
    expect(JSON.stringify(spec.slides[4]?.blocks)).not.toContain("P4 Step 3");
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    authored[4]!.title = "The delivery basis is {rom.total.plan} before approval";
    expect(() => buildReferenceEdition(inputs, authored)).toThrow("unknown_or_disallowed_slot");
    spec.slides[4]!.speakerNotes += " Review the solution plan.";
    expect(validateReferenceDeck(spec).some((finding) => finding.code === "edition_violation" && finding.blocking)).toBe(true);
  });

  it.each(["validation", "investment"] as const)("names each %s gap slide's own missing input, never one title on every slide", async (edition) => {
    const inputs = fixture(edition);
    inputs.valueCase = { status: "empty", detail: "No value levers yet; add them in P4 Step 3." };
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    // The deterministic words keep every required figure token, so every figure slide is a gap.
    const spec = buildReferenceEdition(inputs, unavailableEditionWords(edition, sequence));
    const titles = spec.slides.filter((slide) => slide.archetype !== "cover").map((slide) => slide.actionTitle);
    expect(new Set(titles).size).toBe(titles.length);
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) =>
      ["reference_client_copy", "reference_edition"].includes(finding.kind))).toEqual([]);
  }, 60_000);

  it.each(["validation", "investment"] as const)("gives each %s gap panel its own missing input and next action", (edition) => {
    const inputs = fixture(edition);
    inputs.valueCase = { status: "empty", detail: "No value levers yet; add them in P4 Step 3." };
    inputs.citations = { status: "ready", value: [] };
    inputs.capture[2] = { status: "ready", value: {} };
    inputs.capture[3] = { status: "ready", value: {} };
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(inputs, unavailableEditionWords(edition, sequence));
    const gaps = spec.slides.flatMap((slide) => slide.blocks).filter((block): block is Extract<ReferenceBlock, { kind: "gap" }> => block.kind === "gap");
    expect(gaps.length).toBeGreaterThanOrEqual(3);
    expect(new Set(gaps.map((gap) => gap.detail)).size).toBe(gaps.length);
    expect(new Set(gaps.map((gap) => gap.nextAction)).size).toBe(gaps.length);
    if (edition === "validation")
      for (const gap of gaps) expect(`${gap.title} ${gap.detail} ${gap.nextAction}`).not.toMatch(/\b(?:cost|rom|roi|investment|solution|plan|roadmap|release)\b/i);
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
  });

  it("states the open-assumption count on the headline slide, bound to the register, never an assumption ID", () => {
    const spec = buildReferenceEdition(fixture("investment"), words(INVESTMENT_SEQUENCE.length));
    const headline = spec.slides[INVESTMENT_SEQUENCE.indexOf("big_number_context")]!.blocks.find((block) => block.kind === "metrics");
    const open = headline?.kind === "metrics" ? headline.items.find((item) => item.label === "Open assumptions")?.value : null;
    expect(open).toMatchObject({ display: "1", sourceId: "evidence:register_open_count" });
  });

  it("replaces a withheld title of any form with its own sentence, keeping the draft in notes", async () => {
    const inputs = fixture("investment");
    inputs.valueCase = { status: "empty", detail: "No value levers yet; add them in P4 Step 3." };
    const authored = words(INVESTMENT_SEQUENCE.length);
    authored[1] = { title: "Value: {value.annual.plan}. Pending.", answer: "Confirm the value basis before relying on it.",
      notes: "The point: the basis is open. How to read: follow the source line." };
    const spec = buildReferenceEdition(inputs, authored);
    expect(spec.slides[1]!.actionTitle).toBe("The case summary still needs a confirmed value basis");
    expect(spec.slides[1]!.answer).toBe("Confirm the value basis before relying on it.");
    expect(spec.slides[1]!.speakerNotes).toContain("Draft title awaiting input: Value: not yet modelled. Pending.");
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    await expect(renderReferenceDeck(spec)).resolves.toBeInstanceOf(Buffer);
  }, 60_000);

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

describe("the AI-assisted scenario on the delivery-hours slide", () => {
  const ROM_ID = "synthetic-approved-estimate";
  const ROM_SLIDE = INVESTMENT_SEQUENCE.indexOf("rom_hours");
  const LABEL = "Synthetic coding agents";

  function scenarioInputs(opts: { scenario?: boolean; measured?: boolean; costedOn?: string } = {}): EditionInputs {
    const inputs = fixture("investment");
    const at = "2026-10-10T10:00:00Z";
    const unitHours = {
      data_source_count: { value: 8, source: "Synthetic unit-hour benchmark", confidence: "medium" as const },
      source_table_count: { value: 12, source: "Synthetic table benchmark", confidence: "medium" as const },
      design_row_count: { value: 2, source: "Synthetic design benchmark", confidence: "low" as const },
    };
    const releases = [{ code: "First delivery", name: "First delivery", hours: 1200, weeks: 15, lowCents: 45_000_000, planCents: 55_000_000, highCents: 70_000_000 }];
    const aiAssisted = {
      spec: { label: LABEL, factors: { design_row_count: { hoursReduction: 0.35, source: "[A:AI1]", confidence: "medium" as const } },
        tools: [{ code: "T0", label: "Agent seats", seats: 3, monthlyCostCents: 19_000, source: "[A:TC1]", confidence: "medium" as const }] },
      figures: { hours: 1000, weeks: 12, lowCents: 38_000_000, planCents: 47_000_000, highCents: 60_000_000 },
      toolCostCents: 1_368_000,
      versusEstimate: { hours: -200, weeks: -3, planCents: -8_000_000 },
    };
    inputs.rom = { status: "ready", value: { id: ROM_ID, approvedAt: at, workbookHref: "https://example.invalid/approved-estimate",
      result: { version: 1, approvedBy: "synthetic-reviewer", approvedAt: at, inputsFingerprint: "synthetic-fingerprint", unitHours, releases, foundation: null,
        combined: { hours: 1200, weeks: 15, lowCents: 45_000_000, planCents: 55_000_000, highCents: 70_000_000 },
        ...(opts.scenario === false ? {} : { aiAssisted }) },
      workbookStructure: { useCases: [{ code: "Case", name: "Synthetic scope", counts: { data_source_count: 1, source_table_count: 1, design_row_count: 40 } }], unitHours,
        releases: releases.map((release) => ({ code: release.code, name: release.name, designStatus: "not_designed", useCaseCodes: ["Case"] })),
        pod: { templateCode: "Synthetic pod", locationCode: "US", rateBasis: "loaded_cost" },
        friction: { value: 1.1, source: "Synthetic workshop" }, productiveShare: { value: 0.7, source: "Synthetic workshop" }, hoursPerFteWeek: { value: 40, source: "Synthetic workshop" } },
    } };
    if (inputs.valueCase.status !== "ready") throw new Error("fixture value case");
    const value = inputs.valueCase.value;
    Object.assign((value.case as { economics: Record<string, unknown> }).economics, { npvCents: { base: 150_000_000 }, paybackMonth: { base: 14 } });
    value.costBasis = { status: "resolved", basis: "rom_snapshot", source: opts.costedOn ?? `rom:${ROM_ID}` };
    value.aiAssisted = opts.scenario === false || opts.measured === false ? null : {
      label: LABEL, fundingBasis: false, status: "evaluated", detail: AI_SCENARIO_NOT_FUNDING_DETAIL,
      costBasis: { status: "resolved", basis: "rom_snapshot", source: `rom:${ROM_ID}:ai-assisted` },
      economics: { npvCents: { base: 158_000_000 }, paybackMonth: { base: 12 } },
      toolCostCents: aiAssisted.toolCostCents, versusEstimate: aiAssisted.versusEstimate,
    };
    return inputs;
  }
  const build = (inputs: EditionInputs) => buildReferenceEdition(inputs, words(INVESTMENT_SEQUENCE.length));
  type Table = Extract<ReferenceBlock, { kind: "table" }>;
  const tablesOf = (spec: ReturnType<typeof build>) => spec.slides[ROM_SLIDE]!.blocks.filter((block): block is Table => block.kind === "table");
  const shown = (row: ReferenceCell[]) => row.map((cell) => typeof cell === "string" ? cell : cell.display);
  const comparisonOf = (spec: ReturnType<typeof build>) =>
    tablesOf(spec).find((block) => block.rows[0]?.[0] === "Approved estimate · funding basis");
  /** Each measure as [header, estimate, scenario, difference]. */
  const comparisonRows = (spec: ReturnType<typeof build>) => {
    const comparison = comparisonOf(spec);
    return comparison ? comparison.columns.slice(1).map((header, index) =>
      [header, ...comparison.rows.map((row) => shown([row[index + 1]!])[0]!)]) : null;
  };

  it("sets the approved scenario beside the estimate, every figure bound, the estimate named the funding basis", async () => {
    const spec = build(scenarioInputs());
    const [, comparison] = tablesOf(spec);
    expect(comparison?.rows.map((row) => row[0])).toEqual(["Approved estimate · funding basis", "AI-assisted scenario · comparison", "Difference"]);
    expect(comparison?.decisiveRows).toEqual([0]);
    expect(comparisonRows(spec)).toEqual([
      ["Effort", "1,200 h", "1,000 h", "\u2212200 h"],
      ["Duration", "15 weeks", "12 weeks", "\u22123 weeks"],
      ["Cost at plan", "$0.55M", "$0.47M", "\u2212$80.0K"],
      ["AI tool licences", "None added", "$13.7K", "In scenario cost"],
      ["NPV", "$1.50M", "$1.58M", "+$80.0K"],
      ["Payback", "14 months", "12 months", "\u22122 months"],
    ]);
    const bound = comparison!.rows.flat().filter((cell): cell is ReferenceFigure => typeof cell !== "string");
    expect(bound.map((figure) => figure.sourceId).sort()).toEqual([
      `rom:${ROM_ID}:combined_hours`, `rom:${ROM_ID}:ai_assisted:hours`, `rom:${ROM_ID}:ai_assisted:versus_hours`,
      `rom:${ROM_ID}:combined_weeks`, `rom:${ROM_ID}:ai_assisted:weeks`, `rom:${ROM_ID}:ai_assisted:versus_weeks`,
      `rom:${ROM_ID}:combined_plan`, `rom:${ROM_ID}:ai_assisted:plan`, `rom:${ROM_ID}:ai_assisted:versus_plan`,
      `rom:${ROM_ID}:ai_assisted:tool_cost`,
      "engine:npv_base", "engine:ai_assisted_npv_base", "engine:ai_assisted_npv_versus_estimate",
      "engine:payback_month_base", "engine:ai_assisted_payback_month_base", "engine:ai_assisted_payback_versus_estimate",
    ].sort());
    const ledger = new Set(spec.figureLedger.map((figure) => `${figure.sourceId}\u0000${figure.display}\u0000${figure.workbookCell}`));
    for (const figure of bound) {
      expect(ledger.has(`${figure.sourceId}\u0000${figure.display}\u0000${figure.workbookCell}`)).toBe(true);
      expect(spec.slides[ROM_SLIDE]!.sourceIds).toContain(figure.sourceId);
    }
    // The funding basis everywhere else stays the estimate: the summary's delivery figure IS the comparison's estimate cell.
    const summary = spec.slides[INVESTMENT_SEQUENCE.indexOf("one_page")]!.blocks[0]!;
    const delivery = summary.kind === "metrics" ? summary.items.find((item) => item.label === "Delivery estimate")?.value : null;
    expect(delivery).toBe(comparison!.rows[0]![3]);
    expect(spec.slides[ROM_SLIDE]!.speakerNotes).toContain(`AI-assisted scenario: ${LABEL}. ${AI_SCENARIO_NOT_FUNDING_DETAIL}`);

    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) =>
      ["reference_layout", "off_canvas", "reference_source", "reference_edition", "reference_client_copy"].includes(finding.kind))).toEqual([]);
    expect(rendered.slides[ROM_SLIDE]?.textRuns).toEqual(expect.arrayContaining(["Approved estimate · funding basis", "AI-assisted scenario · comparison", "$0.47M"]));
    expect(rendered.slides[ROM_SLIDE]?.notesText).toContain(`rom:${ROM_ID}:ai_assisted:plan`);
    if (process.env.REFERENCE_DECK_VISUAL_OUTPUT) fs.writeFileSync(`${process.env.REFERENCE_DECK_VISUAL_OUTPUT}-ai-scenario.pptx`, await renderReferenceDeck(spec));
  }, 60_000);

  it("gives up driver rows, never comparison cells, to fit the slide, and binds only the drivers it shows", async () => {
    expect(tablesOf(build(scenarioInputs()))[0]?.rows).toHaveLength(3);
    // Long figures in every cell wrap the comparison; the driver table gives up its last row so the body still fits.
    const crowded = scenarioInputs();
    if (crowded.rom.status !== "ready" || !crowded.rom.value.result.aiAssisted || crowded.valueCase.status !== "ready") throw new Error("fixture");
    const long = 1e10;
    const rom = crowded.rom.value.result;
    const ai = rom.aiAssisted!;
    Object.assign(rom.combined, { hours: long + 0.5, weeks: long, planCents: long * 100 });
    Object.assign(ai.figures, { hours: long + 0.5, weeks: long, planCents: long * 100 });
    Object.assign(ai.versusEstimate, { hours: -long - 0.5, weeks: -long, planCents: -long * 100 });
    ai.toolCostCents = long * 100;
    const value = crowded.valueCase.value;
    Object.assign((value.case as { economics: Record<string, unknown> }).economics, { npvCents: { base: long * 100 }, paybackMonth: { base: long } });
    Object.assign((value.aiAssisted as { economics: Record<string, unknown> }).economics, { npvCents: { base: long * 300 }, paybackMonth: { base: long * 3 } });
    const spec = build(crowded);
    const [drivers, comparison] = tablesOf(spec);
    expect(comparison?.columns).toHaveLength(7);
    expect(comparisonRows(spec)?.[1]).toEqual(["Duration", "10,000,000,000 weeks", "10,000,000,000 weeks", "\u221210,000,000,000 weeks"]);
    expect(drivers?.rows.map((row) => row[0])).toEqual(["Data sources", "Source tables"]);
    expect(spec.figureLedger.some((figure) => figure.sourceId === `rom:${ROM_ID}:unit_hours:design_row_count`)).toBe(false);
    await expect(renderReferenceDeck(spec)).resolves.toBeInstanceOf(Buffer);
  }, 60_000);

  it("shows a funded figure still to confirm in words, beside the scenario, and keeps every driver", () => {
    const inputs = scenarioInputs();
    if (inputs.valueCase.status !== "ready") throw new Error("fixture");
    const economics = (inputs.valueCase.value.case as { economics: Record<string, unknown> }).economics;
    delete economics.npvCents;
    delete economics.paybackMonth;
    const spec = build(inputs);
    expect(comparisonRows(spec)?.slice(4).map((measure) => measure.slice(0, 2))).toEqual([["NPV", "To confirm"], ["Payback", "To confirm"]]);
    expect(tablesOf(spec)[0]?.rows).toHaveLength(3);
  });

  it("leaves the slide as it was when no scenario was approved", () => {
    const spec = build(scenarioInputs({ scenario: false }));
    expect(tablesOf(spec)).toHaveLength(1);
    expect(tablesOf(spec)[0]?.rows).toHaveLength(3);
    expect(spec.slides[ROM_SLIDE]!.speakerNotes).not.toMatch(/AI-assisted/);
    expect(spec.figureLedger.some((figure) => figure.sourceId.includes("ai_assisted"))).toBe(false);
  });

  it("says why the case's return is not compared, by cause", () => {
    const notes = (spec: ReturnType<typeof build>) => spec.slides[ROM_SLIDE]!.speakerNotes ?? "";
    const delivery = 4;

    const otherBasis = build(scenarioInputs({ costedOn: "estimate_model:internal" }));
    expect(comparisonRows(otherBasis)).toHaveLength(delivery);
    expect(notes(otherBasis)).toContain("The value case is not costed on this approved estimate");

    const unmeasured = build(scenarioInputs({ measured: false }));
    expect(comparisonRows(unmeasured)?.slice(delivery)).toEqual([
      ["NPV", "$1.50M", "Not measured", "Not comparable"],
      ["Payback", "14 months", "Not measured", "Not comparable"],
    ]);
    expect(notes(unmeasured)).toContain("The value case has not been measured against this scenario.");

    const failed = scenarioInputs();
    failed.valueCase = { status: "failed", detail: "Value case could not be read." };
    expect(comparisonRows(build(failed))).toHaveLength(delivery);
    expect(notes(build(failed))).toContain("The value case is not available to this deck");

    const redacted = scenarioInputs();
    if (redacted.valueCase.status === "ready") redacted.valueCase.value.figuresRedacted = true;
    expect(comparisonRows(build(redacted))).toHaveLength(delivery);
    expect(notes(build(redacted))).toContain("The value case is not available to this deck");

    const notEvaluated = scenarioInputs();
    if (notEvaluated.valueCase.status === "ready") (notEvaluated.valueCase.value.case as Record<string, unknown>).economics = null;
    expect(comparisonRows(build(notEvaluated))).toHaveLength(delivery);
    expect(notes(build(notEvaluated))).toContain("The value case has no calculated return yet");
  });

  it("measures the scenario's return only from the value case that priced this same scenario", () => {
    const scenarioCase = (inputs: EditionInputs) =>
      (inputs.valueCase.status === "ready" ? inputs.valueCase.value.aiAssisted : null) as Record<string, unknown>;
    const otherSnapshot = scenarioInputs();
    scenarioCase(otherSnapshot).costBasis = { status: "resolved", basis: "rom_snapshot", source: "rom:other-estimate:ai-assisted" };
    const funding = scenarioInputs();
    scenarioCase(funding).fundingBasis = true;
    const unevaluated = scenarioInputs();
    scenarioCase(unevaluated).status = "blocked";
    for (const inputs of [otherSnapshot, funding, unevaluated])
      expect(comparisonRows(build(inputs))?.[4]).toEqual(["NPV", "$1.50M", "Not measured", "Not comparable"]);
  });

  it("states a payback outside the horizon in words and does not difference it", () => {
    const inputs = scenarioInputs();
    if (inputs.valueCase.status === "ready") ((inputs.valueCase.value.aiAssisted as Record<string, unknown>).economics as Record<string, unknown>).paybackMonth = { base: null };
    expect(comparisonRows(build(inputs))?.[5]).toEqual(["Payback", "14 months", "Not within horizon", "Not comparable"]);
  });

  it("gives every scenario figure one display, so the slot and the comparison exhibit agree", () => {
    const spec = buildReferenceEdition(scenarioInputs(), words(INVESTMENT_SEQUENCE.length));
    const displays = new Map<string, Set<string>>();
    for (const figure of spec.figureLedger) displays.set(figure.sourceId, (displays.get(figure.sourceId) ?? new Set()).add(figure.display));
    expect([...displays].filter(([, set]) => set.size > 1).map(([id, set]) => `${id}: ${[...set].join(" | ")}`)).toEqual([]);
  });

  it("offers the slide words only the savings the scenario makes", () => {
    const table = buildReferenceSlotTable(scenarioInputs());
    expect(["rom.ai.weeks_saved", "rom.ai.hours_saved", "rom.ai.cost_saved", "rom.ai.tool_cost"].map((key) => [table[key]?.display, table[key]?.sourceId])).toEqual([
      ["3", `rom:${ROM_ID}:ai_assisted:weeks_saved`],
      ["200", `rom:${ROM_ID}:ai_assisted:hours_saved`],
      ["$80.0K", `rom:${ROM_ID}:ai_assisted:cost_saved`],
      ["$13.7K", `rom:${ROM_ID}:ai_assisted:tool_cost`],
    ]);
    expect(table["rom.ai.weeks_saved"]?.editions).toEqual(["investment"]);
    expect(buildReferenceNarrativeEvidence(table, "rom_hours", "investment").aiScenarioAvailable).toBe(true);
    expect(buildReferenceNarrativeEvidence(table, "releases", "investment")).not.toHaveProperty("aiScenarioAvailable");
    expect(buildReferenceNarrativeEvidence(table, "rom_hours", "validation")).not.toHaveProperty("aiScenarioAvailable");

    // A scenario that costs more saves no money: that slot is withheld, the others stand.
    // Hours that rise, or weeks that do not move, are not savings either.
    const dearer = scenarioInputs();
    if (dearer.rom.status === "ready") Object.assign(dearer.rom.value.result.aiAssisted!.versusEstimate, { planCents: 2_000_000, hours: 50 });
    const dearerTable = buildReferenceSlotTable(dearer);
    expect(dearerTable["rom.ai.cost_saved"]).toMatchObject({ display: null, sourceId: "gap:rom_ai_cost_saved", sourceLabel: "The AI-assisted scenario does not reduce this figure" });
    expect(dearerTable["rom.ai.hours_saved"]?.display).toBeNull();
    expect(dearerTable["rom.ai.weeks_saved"]?.display).toBe("3");
    const level = scenarioInputs();
    if (level.rom.status === "ready") level.rom.value.result.aiAssisted!.versusEstimate.weeks = 0;
    expect(buildReferenceSlotTable(level)["rom.ai.weeks_saved"]?.display).toBeNull();

    const none = buildReferenceSlotTable(scenarioInputs({ scenario: false }));
    expect(none["rom.ai.weeks_saved"]).toMatchObject({ display: null, sourceLabel: "No AI-assisted scenario approved with the estimate" });
    expect(buildReferenceNarrativeEvidence(none, "rom_hours", "investment").aiScenarioAvailable).toBe(false);
  });

  it("binds a scenario saving the slide's answer cites, beside the comparison", async () => {
    const authored = words(INVESTMENT_SEQUENCE.length);
    authored[ROM_SLIDE] = {
      title: "The delivery estimate is {rom.total.plan} across the work",
      answer: "An AI-assisted scenario would take {rom.ai.weeks_saved} weeks off, as a comparison only.",
      notes: "The point: the estimate funds the case. How to read: compare the scenario row with the estimate row.",
    };
    const spec = buildReferenceEdition(scenarioInputs(), authored);
    const slide = spec.slides[ROM_SLIDE]!;
    expect(slide.answer).toBe("An AI-assisted scenario would take 3 weeks off, as a comparison only.");
    expect(slide.visibleNarrativeFigures).toContainEqual(expect.objectContaining({ display: "3", sourceId: `rom:${ROM_ID}:ai_assisted:weeks_saved` }));
    expect(slide.sourceIds).toContain(`rom:${ROM_ID}:ai_assisted:weeks_saved`);
    expect(validateReferenceDeck(spec).filter((finding) => finding.blocking)).toEqual([]);
    const rendered = await inspectDeck(await renderReferenceDeck(spec));
    expect(judgeRenderedDeck(rendered, { referenceDeck: spec }).findings.filter((finding) =>
      ["reference_layout", "off_canvas", "reference_source", "reference_edition", "reference_client_copy"].includes(finding.kind))).toEqual([]);
  }, 60_000);

  it("binds the funded NPV and payback once, for the comparison and the value ledger alike", () => {
    const spec = buildReferenceEdition(scenarioInputs(), words(INVESTMENT_SEQUENCE.length));
    const displays = (id: string) => new Set(spec.figureLedger.filter((figure) => figure.sourceId === id).map((figure) => figure.display));
    expect(displays("engine:npv_base").size).toBe(1);
    expect([...displays("engine:payback_month_base")]).toEqual([expect.stringMatching(/^\d+ months?$/)]);
    const ledger = spec.slides.find((slide) => slide.archetype === "value_ledger")!.blocks.find((block) => block.kind === "metrics");
    expect(ledger?.kind === "metrics" ? ledger.items.map((item) => item.label) : null).toEqual(["Net present value", "Payback", "Breakeven realisation"]);
  });

  it("never reaches the validation edition", () => {
    const inputs = scenarioInputs();
    inputs.edition = "validation";
    const spec = buildReferenceEdition(inputs, words(VALIDATION_SEQUENCE.length));
    expect(spec.figureLedger.some((figure) => figure.sourceId.includes("ai_assisted"))).toBe(false);
    expect(spec.slides.some((slide) => /AI-assisted/.test(slide.speakerNotes ?? ""))).toBe(false);
  });
});

describe("approvedRomLoaders — the deck workbook recomputes on the approval's own card", () => {
  const version = (id: string, status: string) => ({ id, card_code: "ENTERPRISE", version: 3, status, approved_at: null });
  beforeEach(() => {
    mockListRateCardVersions.mockReset();
    mockListRateCardLines.mockReset();
  });

  it("serves exactly the pinned client card version for this tenant", async () => {
    mockListRateCardVersions.mockResolvedValue([version("card-v3", "superseded")]);
    mockListRateCardLines.mockResolvedValue([{ role_or_band_ref: "ROL-037", level: "LVL-07", rate_value: 150, currency: "USD", card_version_id: "card-v3" }]);
    const loaders = await approvedRomLoaders("meridian-health", { mode: "client", cardVersionId: "card-v3" });
    expect(mockListRateCardVersions).toHaveBeenCalledWith("client", "meridian-health", "ENTERPRISE");
    expect(loaders.loadClientRateCard?.("card-v3")?.lines).toHaveLength(1);
    expect(loaders.loadClientRateCard?.("card-v4")).toBeNull();
  });

  it("treats a pinned card that is not this tenant's approved card as a mismatch, never a reference re-price", async () => {
    mockListRateCardVersions.mockResolvedValue([version("card-v3", "draft")]);
    await expect(approvedRomLoaders("meridian-health", { mode: "client", cardVersionId: "card-v3" })).rejects.toThrow("reference_rom_workbook_mismatch");
  });

  it("uses reference rates for an approval that names none", async () => {
    const loaders = await approvedRomLoaders("meridian-health", undefined);
    expect(loaders.loadClientRateCard).toBeUndefined();
    expect(mockListRateCardVersions).not.toHaveBeenCalled();
  });
});
