import { factTokens } from "./numeric-lineage-tokens";
import { formatConsultantCents, formatConsultantPercent } from "@/lib/programs/value-engine/format-money";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";
import { ROM_DRIVER_LABELS, type RomDriver } from "@/lib/pricing/moves-workflow/rom-drivers";
import type { EditionInputs } from "./reference-deck-inputs";
import type { EditionWords } from "./reference-deck-words";
import { buildReferenceNarrativeEvidence, buildReferenceSlotTable, type ReferenceSlotTable } from "./reference-deck-slots";
import { AI_SCENARIO_NOT_FUNDING_DETAIL } from "@/lib/programs/value-engine/value-case-view";
import {
  layoutReferenceTable, referenceArchitectureLabel,
  REFERENCE_BODY_BOTTOM, REFERENCE_BODY_TOP, REFERENCE_TABLE_GAP,
} from "./reference-deck-layout";
import {
  type ReferenceArchetype, type ReferenceBlock, type ReferenceCell,
  type ReferenceDeckSpec, type ReferenceFigure, type ReferenceSection,
  type ReferenceSlide, validateReferenceDeck, ReferenceDeckLineageRefusal,
  clientCopyIssue,
} from "./reference-deck-model";

export const VALIDATION_SEQUENCE: ReferenceArchetype[] = [
  "cover", "one_page", "contents", "divider", "big_number_context",
  "plain_english_table", "flow_today", "one_step_value", "three_year_value",
  "assumptions", "sources",
];
export const INVESTMENT_SEQUENCE: ReferenceArchetype[] = [
  "cover", "one_page", "contents", "divider", "big_number_context",
  "plain_english_table", "flow_today", "one_step_value", "three_year_value",
  "assumptions", "value_ledger", "users_decisions", "target_state",
  "channels", "releases", "shared_foundation", "client_needs",
  "ai_options", "next_steps", "rom_hours", "team", "sources",
];

const GAP = "Gap — input unavailable";
const text = (value: unknown, fallback = GAP): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const obj = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
const safeCaptured = (value: unknown, maxLength: number | null = 170): string => {
  const raw = text(value).replace(/\s+/g, " ");
  // A contact/alias instruction does not establish a business rationale or commitment.
  if (/^Synthetic role contact:|\bRole alias only\b/i.test(raw)) return GAP;
  const line = raw.replace(/^Synthetic scope hypothesis:/i, "Working scope hypothesis:")
    .replace(/^Stakeholder map:\s*Synthetic role roster:/i, "Working role map:");
  if (factTokens(line).length || clientCopyIssue(line)) return GAP;
  if (maxLength === null || line.length <= maxLength) return line;
  const prefix = line.slice(0, maxLength);
  const boundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, boundary > 0 ? boundary : maxLength).trimEnd()}…`;
};
const hasGap = (value: ReferenceCell): boolean => typeof value === "string" && value.startsWith("Gap —");
const clientCell = (value: ReferenceCell): ReferenceCell => hasGap(value) ? "To confirm" : value;
const gapPanel = (title: string): ReferenceBlock => ({
  kind: "gap", title, detail: "The evidence for this exhibit is still being confirmed with your team.",
  nextAction: "Confirm the source and owner before relying on this exhibit.",
});
const shortLabel = (value: string, max = 24): string => {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const prefix = clean.slice(0, max);
  const boundary = prefix.lastIndexOf(" ");
  return boundary > 0 ? `${prefix.slice(0, boundary).trimEnd()}…` : clean.split(" ")[0]!;
};
const flowFromHandoffs = (value: string): { labels: string[]; full: string[] } | null => {
  const source = value.split(/[.!?]/, 1)[0]?.trim() ?? "";
  const parts = source.split(/\s*(?:→|->|=>|;|,|\n)\s*/).map((part) =>
    part.replace(/^(?:and\s+|then\s+|\d+[.)]\s*)/i, "").trim()).filter(Boolean);
  if (parts.length < 3 || parts.length > 8 || parts.some((part) => clientCopyIssue(part) || factTokens(part).length)) return null;
  const maxLabel = parts.length > 6 ? 40 : parts.length > 4 ? 58 : 48;
  return { labels: parts.map((part) => shortLabel(part, maxLabel)), full: parts };
};
const money = formatConsultantCents;
const percent = formatConsultantPercent;
const hoursText = (hours: number): string => `${hours.toLocaleString("en-US", { maximumFractionDigits: 1 })} h`;
const weeksText = (weeks: number): string => `${weeks.toLocaleString("en-US")} ${weeks === 1 ? "week" : "weeks"}`;
const monthsText = (months: number): string => `${months.toLocaleString("en-US")} ${months === 1 ? "month" : "months"}`;
/** A difference reads as a change: an explicit sign, then the magnitude in the row's own unit. */
const signed = (value: number, format: (magnitude: number) => string): string =>
  value === 0 ? "No change" : `${value < 0 ? "\u2212" : "+"}${format(Math.abs(value))}`;
type ReferenceTable = Extract<ReferenceBlock, { kind: "table" }>;
/** Whether these tables, as the client sees them, stack inside the renderer's slide body. */
const tablesFitBody = (tables: ReferenceTable[]): boolean => tables.reduce((y, block) => y + REFERENCE_TABLE_GAP
  + layoutReferenceTable({ ...block, rows: block.rows.map((row) => row.map(clientCell)) }).height, REFERENCE_BODY_TOP) <= REFERENCE_BODY_BOTTOM;
const cell = (row: number): string => `Deck Figures!B${row}`;

function missingNarrative(archetype: ReferenceArchetype): { title: string; answer: string } {
  if (["releases", "shared_foundation", "rom_hours"].includes(archetype)) return {
    title: "The delivery estimate still needs an approved basis",
    answer: "Confirm the delivery scope and estimate before comparing it with value.",
  };
  if (["users_decisions", "team"].includes(archetype)) return {
    title: "Decision owners still need your team's agreement",
    answer: "Agree who owns each decision before delivery begins.",
  };
  if (archetype === "flow_today") return {
    title: "The current handoffs still need an agreed basis",
    answer: "Confirm how the work moves between owners before relying on this account.",
  };
  if (["one_page", "big_number_context", "one_step_value", "three_year_value", "value_ledger"].includes(archetype)) return {
    title: "The value case still needs a confirmed basis",
    answer: "Confirm the source and counting basis before relying on this value.",
  };
  return {
    title: "The evidence for this decision still needs confirmation",
    answer: "Confirm the supporting source with your team before relying on this conclusion.",
  };
}

/** All figure bindings are assembled here; Claude has no route to mint one. */
export function buildReferenceEdition(inputs: EditionInputs, words: EditionWords[], providedSlots?: ReferenceSlotTable): ReferenceDeckSpec {
  const sequence = inputs.edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
  if (words.length !== sequence.length) throw new Error("reference_words_count_mismatch");
  const sources: Record<string, string> = {};
  const figureLedger: ReferenceFigure[] = [];
  const figures = new Map<string, ReferenceFigure>();
  const safeRead = (value: unknown, complete = false): string => {
    const result = safeCaptured(value, complete ? null : 170);
    return inputs.edition === "validation" && /\b(cost|rom|roi|investment|solution|plan|roadmap|release)\b/i.test(result)
      ? GAP : result;
  };
  const bind = (sourceId: string, label: string, display: string): ReferenceFigure => {
    const key = `${sourceId}\u0000${display}`;
    const cached = figures.get(key);
    if (cached) return cached;
    sources[sourceId] = label;
    const result = { display, sourceId, workbookCell: cell(figureLedger.length + 2) };
    figures.set(key, result);
    figureLedger.push(result);
    return result;
  };
  const slots = providedSlots ?? buildReferenceSlotTable(inputs);
  // Reserve every permitted governed slot in a stable order. PPTX, PDF and the
  // companion workbook then carry the same figure ledger even if model wording varies.
  for (const slot of Object.values(slots)) {
    if (slot.editions.includes(inputs.edition) && slot.display !== null)
      bind(slot.sourceId, slot.sourceLabel, slot.display);
  }
  const capture = (phase: 1 | 2 | 3, key: string, complete = false): string =>
    inputs.capture[phase].status === "ready" ? safeRead(inputs.capture[phase].value[key], complete)
      : GAP;
  const sourceCapture = (phase: 1 | 2 | 3, key: string) => {
    const id = `evidence:P${phase}:${key}`;
    sources[id] = `Signed-in P${phase} capture: ${key.replace(/_/g, " ")}`;
    return id;
  };
  const caseBody = inputs.valueCase.status === "ready" && inputs.valueCase.value.figuresRedacted !== true
    ? obj(inputs.valueCase.value.case) : null;
  const economics = obj(caseBody?.economics);
  const threeYear = obj(economics?.threeYearBases);
  const base = obj(threeYear?.base);
  const basis = (key: string) => obj(base?.[key]);
  const dollars = (id: string, value: unknown): ReferenceFigure | null =>
    typeof value === "number" && Number.isSafeInteger(value)
      ? bind(`engine:${id}`, `Value engine: ${id.replace(/_/g, " ")}`, money(value)) : null;
  const annualCash = obj(economics?.annualCashCents);
  const costCents = obj(economics?.costCents);
  const credited = basis("creditedEarned");
  const creditedPaid = basis("creditedPaid");
  const programEarned = basis("programEarned");
  const programPaid = basis("programPaid");
  const annual = dollars("annual_cash_base", annualCash?.base);
  const caseCost = inputs.edition === "investment" ? dollars("case_cost_base", costCents?.base) : null;
  const threeTotal = dollars("three_year_credited_earned", credited?.totalCents);
  const roi = (basisKey: string): ReferenceFigure | null => {
    if (inputs.edition !== "investment") return null;
    const value = basis(basisKey)?.roi;
    return typeof value === "number" && Number.isFinite(value)
      ? bind(`engine:${basisKey}_roi`, `Value engine: ${basisKey} ROI`, percent(value)) : null;
  };
  const valueCell = (value: ReferenceFigure | null): ReferenceCell => value ??
    (inputs.valueCase.status === "ready" ? GAP : `Gap — ${inputs.valueCase.detail}`);
  const yearFigure = (basisKey: string, year: number): ReferenceFigure | null => {
    const row = basis(basisKey);
    const values = row?.annualCents;
    return Array.isArray(values) ? dollars(`${basisKey}_year_${year + 1}`, values[year]) : null;
  };
  const registerRows = inputs.register.status === "ready" ? inputs.register.value.assumptions : [];
  const registerFiguresRedacted = inputs.register.status !== "ready" || inputs.register.value.figuresRedacted;
  const registerSource = (row: Record<string, unknown>) => {
    const id = text(row.registerId, "");
    if (!/^(?:DL|V|D|A)[1-9]\d*$/.test(id)) return null;
    const answered = typeof row.answerFigure === "string" && row.answerFigure.trim().length > 0;
    const basis = text(answered ? row.answerSource : row.source, "");
    if (!basis) return null;
    const ref = `[A:${id}]`;
    sources[ref] = basis;
    return ref;
  };
  const assumptions = registerRows
    .filter((row) => ["open", "confirmed", "corrected"].includes(text(row.status, "")))
    .slice(0, 4);
  const assumptionRows: ReferenceCell[][] = assumptions.map((row) => {
    const id = registerSource(row);
    const display = text(row.answerFigure, text(row.workingFigure, ""));
    const figure = id && display && !registerFiguresRedacted
      ? bind(id, sources[id]!, display) : null;
    return [id ?? "Gap — register source or ID missing", safeRead(row.statement),
      figure ?? (registerFiguresRedacted ? "Gap — figure withheld" : "Gap — register figure or source missing"),
      safeRead(row.ownerRole), text(row.status)];
  });
  const firstAssumption = assumptionRows[0] ?? [GAP, GAP, GAP, GAP, GAP];
  const sourceIdsFor = (blocks: ReferenceBlock[], extra: string[] = []): string[] => {
    const ids = new Set(extra);
    const add = (value: ReferenceCell) => { if (typeof value !== "string") ids.add(value.sourceId); };
    for (const block of blocks) {
      if (block.kind === "table") block.rows.flat().forEach(add);
      if (block.kind === "metrics") block.items.forEach((item) => add(item.value));
      if (block.kind === "bars") block.items.forEach((item) => ids.add(item.value.sourceId));
      if (block.kind === "timeline") block.rows.forEach((row) => row.cost && ids.add(row.cost.sourceId));
    }
    return [...ids];
  };
  const table = (columns: string[], rows: ReferenceCell[][], decisiveRows?: number[]): ReferenceBlock =>
    ({ kind: "table", columns, rows, ...(decisiveRows ? { decisiveRows } : {}) });
  const metrics = (items: { label: string; value: ReferenceCell; meaning: string }[]): ReferenceBlock =>
    ({ kind: "metrics", items });
  const sourceRows = inputs.citations.status === "ready"
    ? inputs.citations.value.slice(0, 3).map((citation) => {
      const id = `[S:${citation.citationNumber}]`;
      sources[id] = `${citation.title} — ${citation.url}`;
      return [id, safeRead(citation.title)] as ReferenceCell[];
    }) : [];
  const rom = inputs.rom.status === "ready" ? inputs.rom.value : null;
  const romCombined = rom ? bind(`rom:${rom.id}:combined_plan`, `Approved ROM ${rom.id}`, money(rom.result.combined.planCents)) : null;
  // The AI-assisted scenario recorded with the approval, beside the estimate.
  // A comparison only: every other slide, and the case, stay on the estimate.
  const aiScenario = inputs.edition === "investment" && rom ? rom.result.aiAssisted ?? null : null;
  const valueBody = inputs.valueCase.status === "ready" && inputs.valueCase.value.figuresRedacted !== true
    ? inputs.valueCase.value : null;
  // The case's return is compared only when the case is costed on this
  // approved estimate; its scenario figures only when the value case measured
  // this same scenario.
  const costedOnRom = Boolean(rom && obj(valueBody?.costBasis)?.source === `rom:${rom.id}`);
  const caseOnRom = costedOnRom && economics !== null;
  const scenarioCase = obj(valueBody?.aiAssisted);
  const scenarioEconomics = rom && caseOnRom && scenarioCase?.fundingBasis === false && scenarioCase.status === "evaluated"
    && obj(scenarioCase.costBasis)?.source === `rom:${rom.id}:ai-assisted` ? obj(scenarioCase.economics) : null;
  const aiScenarioNotes = (): string[] => !aiScenario ? [] : [
    `AI-assisted scenario: ${safeRead(aiScenario.spec.label)}. ${AI_SCENARIO_NOT_FUNDING_DETAIL} Each reduction and its source is in the deck workbook.`,
    ...(!valueBody ? ["The value case is not available to this deck, so its return is not compared with the scenario."]
      : !costedOnRom ? ["The value case is not costed on this approved estimate, so its return is not compared with the scenario."]
        : !caseOnRom ? ["The value case has no calculated return yet, so its return is not compared with the scenario."]
          : !scenarioEconomics ? ["The value case has not been measured against this scenario."] : []),
  ];
  type Figure = (sourceId: string, label: string, display: string) => ReferenceCell;
  type Measure = { header: string; estimate: ReferenceCell; scenario: ReferenceCell; difference: ReferenceCell };
  /**
   * One row per basis, one column per measure, the funding basis first.
   * Built twice: once with plain text to measure it, once binding what the slide shows.
   */
  const aiScenarioTable = (figure: Figure): ReferenceTable | null => {
    if (!rom || !aiScenario) return null;
    const own = (key: string, display: string) => figure(`rom:${rom.id}:${key}`, `Approved ROM ${rom.id}`, display);
    const ai = (key: string, display: string) =>
      figure(`rom:${rom.id}:ai_assisted:${key}`, `Approved ROM ${rom.id}: AI-assisted scenario, comparison only`, display);
    const engine = (id: string, label: string, display: string) => figure(`engine:${id}`, `Value engine: ${label}`, display);
    const versus = aiScenario.versusEstimate;
    const measures: Measure[] = [
      { header: "Effort", estimate: own("combined_hours", hoursText(rom.result.combined.hours)),
        scenario: ai("hours", hoursText(aiScenario.figures.hours)), difference: ai("versus_hours", signed(versus.hours, hoursText)) },
      { header: "Duration", estimate: own("combined_weeks", weeksText(rom.result.combined.weeks)),
        scenario: ai("weeks", weeksText(aiScenario.figures.weeks)), difference: ai("versus_weeks", signed(versus.weeks, weeksText)) },
      { header: "Cost at plan", estimate: own("combined_plan", money(rom.result.combined.planCents)),
        scenario: ai("plan", money(aiScenario.figures.planCents)), difference: ai("versus_plan", signed(versus.planCents, money)) },
      { header: "AI tool licences", estimate: "None added",
        scenario: ai("tool_cost", money(aiScenario.toolCostCents)), difference: "In scenario cost" },
    ];
    if (caseOnRom) {
      const isCents = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
      const npv = (from: Record<string, unknown> | null) => obj(from?.npvCents)?.base;
      const fundedNpv = npv(economics);
      const scenarioNpv = npv(scenarioEconomics);
      measures.push({ header: "NPV",
        estimate: isCents(fundedNpv) ? engine("npv_base", "npv base", money(fundedNpv)) : GAP,
        scenario: isCents(scenarioNpv) ? engine("ai_assisted_npv_base", "NPV base against the AI-assisted scenario, comparison only", money(scenarioNpv)) : "Not measured",
        difference: isCents(fundedNpv) && isCents(scenarioNpv)
          ? engine("ai_assisted_npv_versus_estimate", "AI-assisted scenario NPV less the funded NPV", signed(scenarioNpv - fundedNpv, money))
          : "Not comparable" });
      const payback = (from: Record<string, unknown> | null): number | null | undefined => {
        const value = obj(from?.paybackMonth)?.base;
        return value === null || (typeof value === "number" && Number.isSafeInteger(value)) ? value : undefined;
      };
      const fundedPayback = payback(economics);
      const scenarioPayback = payback(scenarioEconomics);
      const paybackCell = (id: string, label: string, value: number | null | undefined, missing: ReferenceCell): ReferenceCell =>
        value === null ? "Not within horizon" : value === undefined ? missing : engine(id, label, monthsText(value));
      measures.push({ header: "Payback",
        estimate: paybackCell("payback_month_base", "payback month base", fundedPayback, GAP),
        scenario: paybackCell("ai_assisted_payback_month_base", "payback month base against the AI-assisted scenario, comparison only", scenarioPayback, "Not measured"),
        difference: typeof fundedPayback === "number" && typeof scenarioPayback === "number"
          ? engine("ai_assisted_payback_versus_estimate", "AI-assisted scenario payback less the funded payback", signed(scenarioPayback - fundedPayback, monthsText))
          : "Not comparable" });
    }
    return table(["Basis", ...measures.map((measure) => measure.header)], [
      ["Approved estimate · funding basis", ...measures.map((measure) => measure.estimate)],
      ["AI-assisted scenario · comparison", ...measures.map((measure) => measure.scenario)],
      ["Difference", ...measures.map((measure) => measure.difference)],
    ], [0]) as ReferenceTable;
  };
  const plainText: Figure = (_sourceId, _label, display) => display;
  let aiScenarioShown = false;
  const adoption = inputs.capture[3].status === "ready"
    ? parseOperatingAdoption(inputs.capture[3].value.operating_adoption) : null;
  const acceptedOwners = adoption?.ownersAcceptedAt ? adoption.rows.filter((row) => row.owner) : [];
  const actualFlow = inputs.capture[2].status === "ready"
    && !(inputs.edition === "validation" && /\b(cost|rom|roi|investment|solution|plan|roadmap|release)\b/i.test(inputs.capture[2].value.process_handoffs ?? ""))
    ? flowFromHandoffs(inputs.capture[2].value.process_handoffs ?? "") : null;

  const clientBlocks = (archetype: ReferenceArchetype, blocks: ReferenceBlock[]): ReferenceBlock[] => {
    const mapped = blocks.map((block): ReferenceBlock => {
    if (block.kind === "table") {
      const gapCount = block.rows.flat().filter(hasGap).length;
      const hasFigure = block.rows.flat().some((value) => typeof value !== "string");
      const answerColumn = block.columns.findIndex((column) => /^(?:current position|current answer)$/i.test(column));
      const allAnswersMissing = answerColumn >= 0 && block.rows.every((row) => hasGap(row[answerColumn]!));
      const oneStepMissing = archetype === "one_step_value" && gapCount > 0 && !hasFigure;
      const subject: Partial<Record<ReferenceArchetype, string>> = {
        big_number_context: "context", plain_english_table: "current position",
        one_step_value: "annual value", three_year_value: "three-year value",
        value_ledger: "value comparison", client_needs: "team needs",
        channels: "working channels", next_steps: "decisions",
      };
      if (!hasFigure && (gapCount >= block.rows.length * block.columns.length / 2 || allAnswersMissing || oneStepMissing))
        return gapPanel(`The ${subject[archetype] ?? "supporting"} evidence still needs confirmation`);
      return { ...block, rows: block.rows.map((row) => row.map(clientCell)) };
    }
    if (block.kind === "metrics") {
      if (block.items.every((item) => hasGap(item.value)))
        return gapPanel("The figures for this exhibit still need confirmation");
      return { ...block, items: block.items.map((item) => ({ ...item, value: clientCell(item.value) })) };
    }
    if (block.kind === "architecture") return { ...block, layers: block.layers.map((layer) => ({
      ...layer, fullItems: [...layer.items], items: layer.items.map((item) => hasGap(item) ? "To confirm" : referenceArchitectureLabel(item)),
    })) };
    if (block.kind === "text") return { ...block, lines: block.lines.map((line) => line.replace(/Gap —[^\n]*/g, "To confirm")) };
    return block;
    });
    const gaps = mapped.filter((block) => block.kind === "gap");
    const otherEvidence = mapped.some((block) => block.kind !== "gap" && block.kind !== "text");
    if (gaps.length > 1 && !otherEvidence) return [gaps[0]!];
    // Leave room for known evidence alongside the same visible confirmation panel.
    if (gaps.length && mapped.length > 1) return mapped.map((block) =>
      block.kind === "gap" ? { ...block, compact: true } : block);
    return mapped;
  };

  const blocksFor = (archetype: ReferenceArchetype): ReferenceBlock[] => {
    switch (archetype) {
      case "cover": return [];
      case "one_page": return [
        metrics(inputs.edition === "validation" ? [
          { label: "Annual value", value: valueCell(annual), meaning: "Current basis" },
          { label: "Credited value", value: valueCell(threeTotal), meaning: "Earned basis" },
          { label: "Working assumptions", value: assumptions.length ? "To confirm" : GAP, meaning: "Review status" },
        ] : [
          { label: "Annual value", value: valueCell(annual), meaning: "Current basis" },
          { label: "Credited value", value: valueCell(threeTotal), meaning: "Earned basis" },
          { label: "Delivery estimate", value: valueCell(romCombined), meaning: "Approved basis" },
          { label: "Three-year return", value: valueCell(roi("creditedEarned")), meaning: "Calculated base" },
        ]),
        { kind: "text", lines: [
          `Problem: ${safeRead(inputs.move.problemStatement)}`,
          `Outcome: ${safeRead(inputs.move.targetOutcome)}`,
          "Decision: confirm the evidence and named owners.",
        ] },
      ];
      case "contents": return [table(["Section", "The answer in this section", "Slides"], [
        ["01  Context", !hasGap(safeRead(inputs.move.problemStatement)) ? `The problem is ${shortLabel(safeRead(inputs.move.problemStatement), 69)}.` : "The need remains to confirm.", "2–5"],
        ["02  What", actualFlow ? `The work runs from ${shortLabel(actualFlow.full[0]!, 27)} to ${shortLabel(actualFlow.full.at(-1)!, 27)}.` : "The current handoffs remain to confirm.", "6–7"],
        ["03  Why", annual ? "Counted value has a stated basis for review." : "The value basis remains to confirm.", inputs.edition === "validation" ? "8–9" : "8–9, 11"],
        [inputs.edition === "validation" ? "04  Confirm" : "04  Validate", assumptions.length ? "Working assumptions could change the case." : "The assumptions remain to confirm.", inputs.edition === "validation" ? "10" : "10, 22"],
        ["05  How", inputs.edition === "validation" ? "Published evidence shows what can be checked." : rom ? "Delivery choices follow the approved estimate." : "The delivery basis remains to confirm.", inputs.edition === "validation" ? "11" : "12–21"],
      ])];
      case "divider": return [{ kind: "text", lines: ["The next decision rests on evidence your team can check."] }];
      case "big_number_context": return [
        metrics([
          { label: "Annual counted value", value: valueCell(annual), meaning: "Current basis" },
          { label: "Credited earned", value: valueCell(threeTotal), meaning: "Three-year base" },
          { label: "Open assumption", value: firstAssumption[0]!, meaning: "Working basis" },
        ]),
        { kind: "text", lines: [`Need: ${safeRead(inputs.move.problemStatement)}`] },
        table(["What the figure rests on", "Current position", "Owner or source"], [
          ["Scope", capture(1, "scope_boundary"), "Sponsor workshop"],
          ["Current state", capture(2, "current_state_findings"), "Discovery workshop"],
        ]),
      ];
      case "plain_english_table": return [table(["Question", "Current answer", "Owner", "Basis"], [
        ["Why now", capture(1, "sponsor_commitment"), "Sponsor", "Sponsor workshop"],
        ["What changes", capture(2, "current_state_findings"), "Delivery team", "Discovery workshop"],
        ["What to prove", capture(1, "success_criteria"), "Measure owner", "Sponsor workshop"],
      ])];
      case "flow_today": return actualFlow ? [
        { kind: "flow", nodes: actualFlow.labels, fullNodes: actualFlow.full },
        table(["Evidence", "Current position"], [["Discovery findings", capture(2, "current_state_findings")]]),
      ] : [gapPanel("The current handoffs still need to be mapped")];
      case "one_step_value": {
        const blocks: ReferenceBlock[] = [table(["Step", "Driver", "Working value", "Basis"], [
          ["Counted value", "Calculated case", valueCell(annual), "Earned or paid is explicit"],
          ["Validation", "Working assumptions", firstAssumption[2]!, firstAssumption[0]!],
        ])];
        if (annual) blocks.push({ kind: "bars", items: [{ label: "Annual base", value: annual, magnitude: Math.max(0, Number(annualCash?.base) || 0) }] });
        return blocks;
      }
      case "three_year_value": {
        const rows: ReferenceCell[][] = ["creditedEarned", "creditedPaid", "programEarned", "programPaid"]
          .filter((key) => inputs.edition === "investment" || key !== "programPaid")
          .map((key) => [key === "creditedEarned" ? "Credited · earned" : key === "creditedPaid" ? "Credited · paid" : key === "programEarned" ? "Program · earned" : "Program · paid",
            valueCell(yearFigure(key, 0)), valueCell(yearFigure(key, 1)), valueCell(yearFigure(key, 2)), valueCell(dollars(`${key}_total`, basis(key)?.totalCents)),
            ...(inputs.edition === "investment" ? [valueCell(roi(key))] : [])]);
        if (inputs.edition === "validation") rows.push(["Counting basis", "Credited", "Earned", "To confirm", "To confirm"]);
        else rows.push(["Case cost basis", "Not phased", "Not phased", "Not phased", valueCell(caseCost), "Calculated cost"]);
        const blocks: ReferenceBlock[] = [table(inputs.edition === "investment"
          ? ["Basis", "Year one", "Year two", "Year three", "Total", "ROI"]
          : ["Basis", "Year one", "Year two", "Year three", "Total"], rows)];
        const bars = [0, 1, 2].map((year) => ({ label: `Year ${["one", "two", "three"][year]}`, value: yearFigure("creditedEarned", year), magnitude: Number((credited?.annualCents as number[] | undefined)?.[year] ?? 0) }))
          .filter((row): row is { label: string; value: ReferenceFigure; magnitude: number } => row.value !== null);
        if (bars.length) blocks.push({ kind: "bars", items: bars });
        return blocks;
      }
      case "assumptions": return assumptionRows.length
        ? [table(["ID", "Assumption", "Working figure", "Owner", "Status"], assumptionRows, [0])]
        : [gapPanel("Working assumptions still need to be agreed")];
      case "value_ledger": return [table(["Basis", "Earned", "Paid", "Counted", "Source", "Review"], [
        ["Credited", valueCell(dollars("credited_earned_total", credited?.totalCents)), valueCell(dollars("credited_paid_total", creditedPaid?.totalCents)), "Calculated case", "Case model", "Check timing"],
        ["Program", valueCell(dollars("program_earned_total", programEarned?.totalCents)), valueCell(dollars("program_paid_total", programPaid?.totalCents)), "Calculated case", "Case model", "Check attribution"],
      ])];
      case "users_decisions": return acceptedOwners.length ? [table(["Decision", "Named owner", "Right", "Source", "Status"],
        acceptedOwners.length ? acceptedOwners.slice(0, 4).map((row) => [
          safeRead(row.name), safeRead(row.owner?.name),
          Object.keys(row.rights).filter((right) => row.rights[right as keyof typeof row.rights]?.value).join(", ") || GAP,
          "Owner review", "Accepted",
        ]) : [])] : [gapPanel("Decision owners still need to be confirmed")];
      case "target_state": return inputs.capture[3].status !== "ready"
        || ["architecture_integration", "controls_governance", "solution_approach"].every((key) => hasGap(capture(3, key)))
        ? [gapPanel("The proposed design still needs your team's input")]
        : [{ kind: "architecture", layers: [
        { name: "Sources", items: [capture(2, "current_state_findings", true)] },
        { name: "Intake", items: [capture(3, "architecture_integration", true)] },
        { name: "Common view", items: ["Shared records"] },
        { name: "Measures", items: ["Calculated case"] },
        { name: "Review", items: [capture(3, "controls_governance", true)] },
        { name: "Use", items: [capture(3, "solution_approach", true)] },
      ], governance: "Access · traceability · approval" }];
      case "channels": return inputs.capture[3].status !== "ready"
        || ["workflow_delta", "operating_model"].every((key) => hasGap(capture(3, key)))
        ? [gapPanel("The working channels still need to be agreed")]
        : [table(["Channel", "Input", "Owner", "Control", "Readiness"], [
        ["Operational", capture(3, "workflow_delta"), capture(3, "operating_model"), "Owner controls", "Review"],
        ["Evidence", capture(2, "data_quality_governance"), "Data owner", "Source approval", "Review"],
      ])];
      case "releases": return !rom || !rom.result.releases.length ? [gapPanel("The delivery sequence needs an approved estimate")]
        : [{ kind: "timeline", quarters: ["Foundation", "First release", "Later release"], rows: [
        { label: "Shared foundation", from: 0, to: 0 },
        ...((rom?.result.releases ?? []).slice(0, 2).map((release, index) => ({ label: safeRead(release.code), from: index + 1, to: index + 1 }))),
      ], today: 0, commit: 2 }];
      case "shared_foundation": return [metrics([
        { label: "Shared delivery basis", value: valueCell(romCombined), meaning: "Approved estimate" },
        { label: "Published source", value: inputs.citations.status === "ready" && inputs.citations.value.length ? "Available" : GAP, meaning: "External evidence" },
      ])];
      case "client_needs": return hasGap(capture(3, "controls_governance")) && hasGap(capture(1, "success_criteria"))
        ? [gapPanel("The team needs access and a clear measure")]
        : [table(["Need", "Input", "Decision"], [
        ["Access", capture(3, "controls_governance"), "Confirm owner"],
        ["Measurement", capture(1, "success_criteria"), "Confirm basis"],
      ])];
      case "ai_options": return hasGap(capture(3, "solution_approach"))
        ? [gapPanel("Any AI option needs a reviewed working approach")]
        : [{ kind: "text", lines: [
        `Candidate: ${capture(3, "solution_approach")}`,
        "Value: support review of approved evidence.",
        "Prerequisite: approved source access and human oversight.",
      ] }];
      case "next_steps": return [table(["Action", "Owner", "Evidence needed"], [
        ["Confirm the need", "Sponsor", capture(1, "scope_boundary")],
        ["Resolve open assumptions", firstAssumption[3]!, firstAssumption[0]!],
        ["Review delivery basis", "Delivery team", rom ? "Approved estimate" : GAP],
      ])];
      case "rom_hours": {
        if (!rom) return [gapPanel("The delivery estimate is still to confirm")];
        const units = Object.entries(rom.workbookStructure.unitHours).slice(0, 3)
          .flatMap(([driver, unit]) => unit ? [{ driver, unit }] : []);
        if (!units.length) return [gapPanel("The delivery hours still need an approved basis")];
        const unitTable = (count: number, figure: Figure): ReferenceTable => table(["Driver", "Basis", "Unit hours", "Confidence", "Low", "Plan", "High", "Source"],
          units.slice(0, count).map(({ driver, unit }) => [ROM_DRIVER_LABELS[driver as RomDriver] ?? safeRead(driver), "Unit-hour driver",
            figure(`rom:${rom.id}:unit_hours:${driver}`, unit.source, `${unit.value} h`), unit.confidence, GAP, GAP, GAP, "Approved delivery estimate"])) as ReferenceTable;
        const comparison = aiScenarioTable(plainText);
        // The comparison keeps every row; the driver table gives up rows to fit.
        const shown = comparison && [3, 2, 1].filter((count) => count <= units.length)
          .find((count) => tablesFitBody([unitTable(count, plainText), comparison]));
        aiScenarioShown = shown !== undefined;
        return shown ? [unitTable(shown, bind), aiScenarioTable(bind)!] : [unitTable(units.length, bind)];
      }
      case "team": return [table(["Role", "Decision", "Source", "State"], [
        ["Sponsor", "Confirm need", "Sponsor workshop", capture(1, "sponsor_commitment")],
        ...(acceptedOwners.length ? acceptedOwners.slice(0, 2).map((row) => [safeRead(row.owner?.name), "Own change", "Owner review", "Accepted"] as ReferenceCell[])
          : [["To confirm", "Own change", "Owner review", "To confirm"]]),
      ])];
      case "sources": return sourceRows.length
        ? [table(["Citation", "Published source"], sourceRows)]
        : [gapPanel("Published evidence still needs to be confirmed")];
    }
  };

  const sectionFor = (kind: ReferenceArchetype): ReferenceSection => {
    if (["one_page", "contents", "big_number_context"].includes(kind)) return "CONTEXT";
    if (["plain_english_table", "flow_today"].includes(kind)) return "WHAT";
    if (["one_step_value", "three_year_value", "value_ledger"].includes(kind)) return "WHY";
    if (kind === "assumptions") return inputs.edition === "validation" ? "CONFIRM" : "VALIDATE";
    if (kind === "sources") return inputs.edition === "validation" ? "HOW" : "VALIDATE";
    return "HOW";
  };
  const slides: ReferenceSlide[] = sequence.map((archetype, index) => {
    const blocks = clientBlocks(archetype, blocksFor(archetype));
    const authored = words[index]!;
    const narrativeFigures = new Map<string, ReferenceFigure>();
    const visibleNarrativeFigures = new Map<string, ReferenceFigure>();
    const narrativeSourceIds = new Set<string>();
    const narrativeSourceLabels = new Set<string>();
    const resolveSlots = (prose: string, visible: boolean): string => prose.replace(/\{([^{}]+)\}/g, (_, key: string) => {
      const slot = slots[key];
      if (!slot || !slot.editions.includes(inputs.edition))
        throw new Error("reference_deck_lineage_refusal: unknown_or_disallowed_slot");
      narrativeSourceIds.add(slot.sourceId);
      narrativeSourceLabels.add(slot.sourceLabel);
      if (slot.display === null) {
        sources[slot.sourceId] = slot.sourceLabel;
        return slot.missingPhrase;
      }
      const figure = bind(slot.sourceId, slot.sourceLabel, slot.display);
      narrativeFigures.set(`${figure.sourceId}\u0000${figure.display}`, figure);
      if (visible) visibleNarrativeFigures.set(`${figure.sourceId}\u0000${figure.display}`, figure);
      return slot.display;
    });
    const withheldNarratives: string[] = [];
    const resolveVisibleSentence = (prose: string, field: "title" | "answer"): string => {
      const missing = [...prose.matchAll(/\{([^{}]+)\}/g)].some((match) => slots[match[1]!]?.display === null);
      const resolved = resolveSlots(prose, !missing);
      if (!missing) return resolved;
      withheldNarratives.push(`Draft ${field} awaiting input: ${resolved}`);
      return missingNarrative(archetype)[field];
    };
    const actionTitle = archetype === "cover" ? inputs.move.name : resolveVisibleSentence(authored.title, "title");
    const answer = archetype === "cover"
      ? inputs.edition === "validation"
        ? "First version of the value proposition, for your team to validate"
        : "The problem, the value over three years, the solution and the plan"
      : resolveVisibleSentence(authored.answer, "answer");
    const noteParts = [resolveSlots(authored.notes, false), ...withheldNarratives];
    if (archetype === "cover" && inputs.edition === "validation")
      noteParts.push("Edition guidance: this discussion validates the need and excludes the solution, plan and cost.");
    if (archetype === "rom_hours") noteParts.push(...(aiScenarioShown ? aiScenarioNotes()
      : aiScenario ? ["An AI-assisted scenario was approved beside the estimate; it is not shown on this slide."] : []));
    if (archetype === "flow_today" && actualFlow)
      noteParts.push(`Full handoffs: ${actualFlow.full.join(" → ")}.`);
    for (const block of blocks) {
      if (block.kind === "architecture") block.layers.forEach((layer) =>
        noteParts.push(`Source detail — ${layer.name}: ${(layer.fullItems ?? layer.items).join("; ")}.`));
    }
    if (["one_page", "big_number_context", "one_step_value", "three_year_value", "value_ledger"].includes(archetype)
      && inputs.valueCase.status !== "ready")
      noteParts.push(`Consultant follow-up: ${inputs.valueCase.detail}`);
    const speakerNotes = noteParts.join(" ");
    const extra = archetype === "plain_english_table" ? [sourceCapture(1, "sponsor_commitment"), sourceCapture(2, "current_state_findings"), sourceCapture(1, "success_criteria")]
      : archetype === "big_number_context" ? [sourceCapture(1, "scope_boundary"), sourceCapture(2, "current_state_findings")]
        : archetype === "flow_today" ? [sourceCapture(2, "process_handoffs"), sourceCapture(2, "current_state_findings")]
      : archetype === "team" ? [sourceCapture(1, "sponsor_commitment"), sourceCapture(3, "operating_model")]
        : archetype === "target_state" ? [sourceCapture(2, "current_state_findings"), sourceCapture(3, "architecture_integration"), sourceCapture(3, "controls_governance"), sourceCapture(3, "solution_approach")]
        : [];
    return {
      archetype,
      ...(archetype === "cover" ? {} : { section: archetype === "divider" ? "CONTEXT" : sectionFor(archetype) }),
      actionTitle,
      answerLabel: "The answer",
      answer,
      speakerNotes,
      blocks,
      narrativeFigures: [...narrativeFigures.values()],
      visibleNarrativeFigures: [...visibleNarrativeFigures.values()],
      narrativeSourceLabels: [...narrativeSourceLabels],
      sourceIds: sourceIdsFor(blocks, [...extra, ...narrativeSourceIds]),
      narrativeEvidence: buildReferenceNarrativeEvidence(slots, archetype, inputs.edition),
    };
  });
  const spec: ReferenceDeckSpec = {
    edition: inputs.edition,
    client: "Discussion draft",
    program: inputs.move.name,
    useCase: inputs.move.name,
    sponsorRole: "Executive sponsor",
    monthYear: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    sourcesCheckedTo: inputs.citations.status === "ready" && inputs.citations.value.length
      ? inputs.citations.value.map((item) => item.retrievedAt).sort().at(-1) ?? "not checked"
      : "not checked",
    sources, figureLedger, slides,
  };
  const blocking = validateReferenceDeck(spec).filter((finding) => finding.blocking);
  if (blocking.length) throw new ReferenceDeckLineageRefusal(blocking);
  return spec;
}
