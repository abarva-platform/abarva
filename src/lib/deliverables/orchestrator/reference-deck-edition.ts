import { factTokens } from "./numeric-lineage-tokens";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";
import type { EditionInputs } from "./reference-deck-inputs";
import type { EditionWords } from "./reference-deck-words";
import {
  type ReferenceArchetype, type ReferenceBlock, type ReferenceCell,
  type ReferenceDeckSpec, type ReferenceFigure, type ReferenceSection,
  type ReferenceSlide, validateReferenceDeck,
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

const GAP = "Gap — governed input unavailable";
const text = (value: unknown, fallback = GAP): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const obj = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
const safeCaptured = (value: unknown): string => {
  const line = text(value).replace(/\s+/g, " ").slice(0, 170);
  return factTokens(line).length ? "Gap — captured figure needs a governed source" : line;
};
const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString("en-US")}`;
const percent = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`;
const cell = (row: number): string => `Deck Figures!B${row}`;

/** All figure bindings are assembled here; Claude has no route to mint one. */
export function buildReferenceEdition(inputs: EditionInputs, words: EditionWords[]): ReferenceDeckSpec {
  const sequence = inputs.edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
  if (words.length !== sequence.length) throw new Error("reference_words_count_mismatch");
  const sources: Record<string, string> = {};
  const figureLedger: ReferenceFigure[] = [];
  const figures = new Map<string, ReferenceFigure>();
  const safeRead = (value: unknown): string => {
    const result = safeCaptured(value);
    return inputs.edition === "validation" && /\b(cost|rom|roi|investment|solution|plan|roadmap|release)\b/i.test(result)
      ? "Gap — captured wording is out of edition scope" : result;
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
  const capture = (phase: 1 | 2 | 3, key: string): string =>
    inputs.capture[phase].status === "ready" ? safeRead(inputs.capture[phase].value[key])
      : `Gap — ${inputs.capture[phase].detail}`;
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
    (inputs.valueCase.status === "gap" ? `Gap — ${inputs.valueCase.detail}` : GAP);
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
  const citationsRows = sourceRows.length ? sourceRows : [[GAP, inputs.citations.status === "gap" ? inputs.citations.detail : "No approved public sources"]];
  const rom = inputs.rom.status === "ready" ? inputs.rom.value : null;
  const romCombined = rom ? bind(`rom:${rom.id}:combined_plan`, `Approved ROM ${rom.id}`, money(rom.result.combined.planCents)) : null;
  const adoption = inputs.capture[3].status === "ready"
    ? parseOperatingAdoption(inputs.capture[3].value.operating_adoption) : null;
  const acceptedOwners = adoption?.ownersAcceptedAt ? adoption.rows.filter((row) => row.owner) : [];
  const flowNodes = inputs.move.archetype === "workflow_automation"
    ? ["Intake", "Handoff", "Owner review", "Decision"]
    : inputs.move.archetype === "platform_modernization"
      ? ["Source systems", "Canonical model", "Governed measure", "Decision"]
      : inputs.move.archetype === "operational_optimization"
        ? ["Baseline", "Measured change", "Value review", "Decision"]
        : ["Captured source", "Named owner", "Governed measure", "Decision"];

  const blocksFor = (archetype: ReferenceArchetype): ReferenceBlock[] => {
    switch (archetype) {
      case "cover": return [];
      case "one_page": return [
        metrics(inputs.edition === "validation" ? [
          { label: "Annual value", value: valueCell(annual), meaning: "Value-engine basis" },
          { label: "Credited value", value: valueCell(threeTotal), meaning: "Earned basis" },
          { label: "Working assumptions", value: assumptions.length ? "Register rows open for review" : GAP, meaning: "Review status" },
        ] : [
          { label: "Annual value", value: valueCell(annual), meaning: "Value-engine basis" },
          { label: "Credited value", value: valueCell(threeTotal), meaning: "Earned basis" },
          { label: "Approved ROM", value: valueCell(romCombined), meaning: "Delivery basis" },
          { label: "Three-year ROI", value: valueCell(roi("creditedEarned")), meaning: "Value-engine base" },
        ]),
        { kind: "text", lines: [
          `Problem: ${safeRead(inputs.move.problemStatement)}`,
          `Outcome: ${safeRead(inputs.move.targetOutcome)}`,
          "Decision: confirm the governed gaps and named owners.",
        ] },
      ];
      case "contents": return [table(["Section", "What the reader can inspect"], [
        ["Context", "Move and capture readback"], ["What", "Current flow and owners"],
        ["Why", "Value-engine figures"], [inputs.edition === "validation" ? "Confirm" : "Validate", "Assumptions and sources"],
        ["How", inputs.edition === "validation" ? "Next decision" : "Delivery and ROM"],
      ])];
      case "divider": return [{ kind: "text", lines: ["Read the governed exhibits and visible gaps."] }];
      case "big_number_context": return [
        metrics([
          { label: "Annual counted value", value: valueCell(annual), meaning: "Value-engine base" },
          { label: "Credited earned", value: valueCell(threeTotal), meaning: "Three-year base" },
          { label: "Open assumption", value: firstAssumption[0]!, meaning: "Named register row" },
        ]),
        { kind: "text", lines: [`Move need: ${safeRead(inputs.move.problemStatement)}`] },
        table(["What the figure rests on", "Readback", "Owner or source"], [
          ["Scope", capture(1, "scope_boundary"), "P1 capture"],
          ["Current state", capture(2, "current_state_findings"), "P2 capture"],
        ]),
      ];
      case "plain_english_table": return [table(["Question", "Current answer", "Owner", "Basis"], [
        ["Why now", capture(1, "sponsor_commitment"), "Sponsor", "P1 capture"],
        ["What changes", capture(2, "current_state_findings"), "Move team", "P2 capture"],
        ["What to prove", capture(1, "success_criteria"), "Measure owner", "P1 capture"],
      ])];
      case "flow_today": return [
        { kind: "flow", nodes: flowNodes, annotation: capture(2, "process_handoffs") },
        table(["Evidence", "Readback"], [["P2 findings", capture(2, "current_state_findings")]]),
      ];
      case "one_step_value": {
        const blocks: ReferenceBlock[] = [table(["Step", "Driver", "Working value", "Basis"], [
          ["Counted value", "Value engine", valueCell(annual), "Earned or paid is explicit"],
          ["Validation", "Assumptions register", firstAssumption[2]!, firstAssumption[0]!],
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
        if (inputs.edition === "validation") rows.push(["Counting basis", "Credited", "Earned", "No cash claim", "Confirm"]);
        else rows.push(["Case cost basis", "Not phased", "Not phased", "Not phased", valueCell(caseCost), "Value-engine cost"]);
        const blocks: ReferenceBlock[] = [table(inputs.edition === "investment"
          ? ["Basis", "Year one", "Year two", "Year three", "Total", "ROI"]
          : ["Basis", "Year one", "Year two", "Year three", "Total"], rows)];
        const bars = [0, 1, 2].map((year) => ({ label: `Year ${["one", "two", "three"][year]}`, value: yearFigure("creditedEarned", year), magnitude: Number((credited?.annualCents as number[] | undefined)?.[year] ?? 0) }))
          .filter((row): row is { label: string; value: ReferenceFigure; magnitude: number } => row.value !== null);
        if (bars.length) blocks.push({ kind: "bars", items: bars });
        return blocks;
      }
      case "assumptions": return [table(["ID", "Assumption", "Working figure", "Owner", "Status"], assumptionRows.length ? assumptionRows : [[GAP, GAP, GAP, GAP, GAP]], [0])];
      case "value_ledger": return [table(["Basis", "Earned", "Paid", "Counted", "Source", "Review"], [
        ["Credited", valueCell(dollars("credited_earned_total", credited?.totalCents)), valueCell(dollars("credited_paid_total", creditedPaid?.totalCents)), "Value-engine case", "Engine", "Check timing"],
        ["Program", valueCell(dollars("program_earned_total", programEarned?.totalCents)), valueCell(dollars("program_paid_total", programPaid?.totalCents)), "Value-engine case", "Engine", "Check attribution"],
      ])];
      case "users_decisions": return [table(["Decision", "Named owner", "Right", "Source", "Status"],
        acceptedOwners.length ? acceptedOwners.slice(0, 4).map((row) => [
          safeRead(row.name), safeRead(row.owner?.name),
          Object.keys(row.rights).filter((right) => row.rights[right as keyof typeof row.rights]?.value).join(", ") || GAP,
          "P3 owner readback", "Accepted",
        ]) : [["Gap — P3 owners not accepted", GAP, GAP, "P3 owner readback", "Review"]])];
      case "target_state": return [{ kind: "architecture", layers: [
        { name: "Sources", items: [capture(2, "current_state_findings")] },
        { name: "Intake", items: [capture(3, "architecture_integration")] },
        { name: "Canonical", items: ["Governed object IDs"] },
        { name: "Measures", items: ["Value-engine basis"] },
        { name: "Review", items: [capture(3, "controls_governance")] },
        { name: "Use", items: [capture(3, "solution_approach")] },
      ], governance: "Tenant scope · lineage · approval" }];
      case "channels": return [table(["Channel", "Input", "Owner", "Control", "Readiness"], [
        ["Operational", capture(3, "workflow_delta"), capture(3, "operating_model"), "P3 controls", "Review"],
        ["Evidence", capture(2, "data_quality_governance"), "Data owner", "Source approval", "Review"],
      ])];
      case "releases": return [{ kind: "timeline", quarters: ["Foundation", "First release", "Later release"], rows: [
        { label: "Shared foundation", from: 0, to: 0 },
        ...((rom?.result.releases ?? []).slice(0, 2).map((release, index) => ({ label: safeRead(release.code), from: index + 1, to: index + 1 }))),
      ], today: 0, commit: 2 }];
      case "shared_foundation": return [metrics([
        { label: "Shared ROM basis", value: valueCell(romCombined), meaning: "Approved snapshot" },
        { label: "Governed source", value: inputs.citations.status === "ready" && inputs.citations.value.length ? "Approved citation feed" : GAP, meaning: "Public sources" },
      ])];
      case "client_needs": return [table(["Need", "Input", "Decision"], [
        ["Access", capture(3, "controls_governance"), "Confirm owner"],
        ["Measurement", capture(1, "success_criteria"), "Confirm basis"],
      ])];
      case "ai_options": return [{ kind: "text", lines: [
        `Candidate: ${capture(3, "solution_approach")}`,
        "Value: support review of governed evidence.",
        "Prerequisite: approved source access and human oversight.",
      ] }];
      case "next_steps": return [table(["Action", "Owner", "Evidence needed"], [
        ["Confirm captured need", "Sponsor", capture(1, "scope_boundary")],
        ["Resolve open assumptions", firstAssumption[3]!, firstAssumption[0]!],
        ["Review delivery basis", "Move team", rom ? "Approved ROM snapshot" : "Gap — approved ROM unavailable"],
      ])];
      case "rom_hours": {
        if (!rom) return [{ kind: "gap", title: "Approved ROM detail is unavailable", detail: inputs.rom.status === "gap" ? inputs.rom.detail : GAP,
          nextAction: "Review the ROM approval and its source-linked unit hours before using delivery figures." }];
        const unitRows = rom ? Object.entries(rom.workbookStructure.unitHours).slice(0, 3)
          .flatMap(([driver, unit]) => {
            if (!unit) return [];
            const ref = `rom:${rom.id}:unit_hours:${driver}`;
            const bound = bind(ref, unit.source, `${unit.value} h`);
            return [[safeRead(driver), "Unit-hour driver", bound, unit.confidence, GAP, GAP, GAP, ref] as ReferenceCell[]];
          }) : [];
        return [table(["Driver", "Basis", "Unit hours", "Confidence", "Low", "Plan", "High", "Source"],
          unitRows.length ? unitRows : [[GAP, GAP, GAP, GAP, GAP, GAP, GAP, GAP]])];
      }
      case "team": return [table(["Role", "Decision", "Source", "State"], [
        ["Sponsor", "Confirm need", "P1 capture", capture(1, "sponsor_commitment")],
        ...(acceptedOwners.length ? acceptedOwners.slice(0, 2).map((row) => [safeRead(row.owner?.name), "Own change", "P3 owner readback", "Accepted"] as ReferenceCell[])
          : [["Gap — P3 owner", "Own change", "P3 owner readback", "Review"]]),
      ])];
      case "sources": return [table(["Citation", "Approved source"], citationsRows.length >= 3 ? citationsRows : [...citationsRows, ...Array.from({ length: 3 - citationsRows.length }, () => ["Gap — no further approved source", "Source review needed"])])];
    }
  };

  const sectionFor = (kind: ReferenceArchetype): ReferenceSection => {
    if (["one_page", "contents", "big_number_context"].includes(kind)) return "CONTEXT";
    if (["plain_english_table", "flow_today"].includes(kind)) return "WHAT";
    if (["one_step_value", "three_year_value", "value_ledger"].includes(kind)) return "WHY";
    if (["assumptions", "sources"].includes(kind)) return inputs.edition === "validation" ? "CONFIRM" : "VALIDATE";
    return "HOW";
  };
  const slides: ReferenceSlide[] = sequence.map((archetype, index) => {
    const blocks = blocksFor(archetype);
    const authored = words[index]!;
    const extra = archetype === "plain_english_table" ? [sourceCapture(1, "sponsor_commitment"), sourceCapture(2, "current_state_findings"), sourceCapture(1, "success_criteria")]
      : archetype === "big_number_context" ? [sourceCapture(1, "scope_boundary"), sourceCapture(2, "current_state_findings")]
        : archetype === "flow_today" ? [sourceCapture(2, "process_handoffs"), sourceCapture(2, "current_state_findings")]
      : archetype === "team" ? [sourceCapture(1, "sponsor_commitment"), sourceCapture(3, "operating_model")]
        : [];
    return {
      archetype,
      ...(archetype === "cover" || archetype === "divider" ? {} : { section: sectionFor(archetype) }),
      actionTitle: authored.title,
      answerLabel: "The answer",
      answer: authored.answer,
      speakerNotes: authored.notes,
      blocks,
      sourceIds: sourceIdsFor(blocks, extra),
    };
  });
  if (inputs.edition === "validation") {
    slides[0]!.actionTitle = "Validate the need; no solution, plan or cost.";
  }
  const spec: ReferenceDeckSpec = {
    edition: inputs.edition,
    client: "Synthetic demo tenant",
    program: inputs.move.name,
    useCase: inputs.move.name,
    sponsorRole: "Move sponsor",
    monthYear: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    sourcesCheckedTo: inputs.citations.status === "ready" && inputs.citations.value.length
      ? inputs.citations.value.map((item) => item.retrievedAt).sort().at(-1) ?? "not checked"
      : "not checked",
    sources, figureLedger, slides,
  };
  const blocking = validateReferenceDeck(spec).filter((finding) => finding.blocking);
  if (blocking.length) throw new Error(`reference_deck_lineage_refusal: ${blocking.map((item) => `${item.slide}:${item.code}`).join(",")}`);
  return spec;
}
