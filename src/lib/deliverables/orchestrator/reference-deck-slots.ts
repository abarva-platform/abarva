import type { EditionInputs } from "./reference-deck-inputs";
import type { ReferenceArchetype, ReferenceEdition, ReferenceNarrativeEvidence } from "./reference-deck-model";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";
import { formatConsultantCents, formatConsultantPercent } from "@/lib/programs/value-engine/format-money";

export interface ReferenceSlot {
  key: string;
  meaning: string;
  display: string | null;
  sourceId: string;
  sourceLabel: string;
  missingPhrase: string;
  editions: readonly ReferenceEdition[];
}

export type ReferenceSlotTable = Readonly<Record<string, ReferenceSlot>>;

const both = ["validation", "investment"] as const;
const investment = ["investment"] as const;
const obj = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
// The same formatters the exhibits use: a title's figure and its exhibit's
// figure come from one source, so they must read the same ("$3.60M", "33%").
const cents = (value: unknown): string | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? formatConsultantCents(value) : null;
const ratio = (value: unknown): string | null =>
  typeof value === "number" && Number.isFinite(value) ? formatConsultantPercent(value) : null;
const count = (value: number): string => value.toLocaleString("en-US");

/** Slots for the AI-assisted delivery scenario. The model may use them only on the slide that shows it. */
export const AI_SCENARIO_SLOTS = {
  weeksSaved: "rom.ai.weeks_saved",
  hoursSaved: "rom.ai.hours_saved",
  costSaved: "rom.ai.cost_saved",
  toolCost: "rom.ai.tool_cost",
} as const;
export const AI_SCENARIO_SLOT_PREFIX = "rom.ai.";
/** The one slide whose exhibit sets the scenario beside the estimate. */
export const AI_SCENARIO_ARCHETYPE: ReferenceArchetype = "rom_hours";

/** Governed values stay server-side. Only keys and meanings enter the model prompt. */
export function buildReferenceSlotTable(inputs: EditionInputs): ReferenceSlotTable {
  const caseBody = inputs.valueCase.status === "ready" && inputs.valueCase.value.figuresRedacted !== true
    ? obj(inputs.valueCase.value.case) : null;
  const economics = obj(caseBody?.economics);
  const bases = obj(obj(economics?.threeYearBases)?.base);
  const basis = (key: string) => obj(bases?.[key]);
  const valueMissing = inputs.valueCase.status === "empty" ? "not yet modelled"
    : inputs.valueCase.status === "failed" ? "unavailable from the current read"
      : inputs.valueCase.value.figuresRedacted === true ? "withheld for this viewer"
        : "unresolved from current inputs";
  const entries: ReferenceSlot[] = [];
  const add = (slot: ReferenceSlot) => entries.push(slot);
  const value = (key: string, meaning: string, sourceKey: string, display: string | null, editions: readonly ReferenceEdition[] = both) => add({
    key, meaning, display,
    sourceId: display === null ? `gap:${key.replaceAll(".", "_")}` : `engine:${sourceKey}`,
    sourceLabel: display === null ? valueMissing : `Value engine: ${sourceKey.replaceAll("_", " ")}`,
    missingPhrase: valueMissing, editions,
  });
  value("value.annual.base", "annual counted value on the value-engine base", "annual_cash_base", cents(obj(economics?.annualCashCents)?.base));
  value("value.annual.plan", "annual counted value on the value-engine base", "annual_cash_base", cents(obj(economics?.annualCashCents)?.base), investment);
  value("value.three_year.credited", "three-year credited value counted when earned", "three_year_credited_earned", cents(basis("creditedEarned")?.totalCents));
  value("value.three_year.program", "three-year program value counted when earned", "three_year_program_earned", cents(basis("programEarned")?.totalCents), investment);
  value("value.three_year.paid", "three-year credited value counted when paid", "three_year_credited_paid", cents(basis("creditedPaid")?.totalCents), investment);
  [0, 1, 2].forEach((year) => {
    const annual = basis("creditedEarned")?.annualCents;
    value(`value.year_${["one", "two", "three"][year]}.credited`, `credited value in year ${["one", "two", "three"][year]} counted when earned`,
      `creditedEarned_year_${year + 1}`, Array.isArray(annual) ? cents(annual[year]) : null, investment);
  });
  value("roi.three_year.credited", "three-year credited return on investment", "creditedEarned_roi", ratio(basis("creditedEarned")?.roi), investment);
  const rom = inputs.rom.status === "ready" ? inputs.rom.value : null;
  add({
    key: "rom.total.plan", meaning: "approved combined delivery estimate at plan basis",
    display: rom ? cents(rom.result.combined.planCents) : null,
    sourceId: rom ? `rom:${rom.id}:combined_plan` : "gap:rom_total_plan",
    sourceLabel: rom ? `Approved ROM ${rom.id}` : "Approved ROM snapshot unavailable",
    missingPhrase: "unavailable", editions: investment,
  });
  // The AI-assisted scenario approved beside the estimate: a comparison, never
  // the funding basis. Each slot is a saving, so it is present only when the
  // scenario actually saves that much; otherwise the model may not use it.
  const ai = rom?.result.aiAssisted ?? null;
  const scenario = (key: string, meaning: string, sourceKey: string, magnitude: number | null, format: (value: number) => string | null) => {
    const display = rom && ai && magnitude !== null && magnitude > 0 ? format(magnitude) : null;
    add({
      key, meaning, display,
      sourceId: rom && display !== null ? `rom:${rom.id}:ai_assisted:${sourceKey}` : `gap:${key.replaceAll(".", "_")}`,
      sourceLabel: rom && display !== null ? `Approved ROM ${rom.id}: AI-assisted scenario, comparison only`
        : ai ? "The AI-assisted scenario does not reduce this figure" : "No AI-assisted scenario approved with the estimate",
      missingPhrase: "not modelled", editions: investment,
    });
  };
  const hours = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  scenario(AI_SCENARIO_SLOTS.weeksSaved, "weeks an AI-assisted delivery scenario would take off the approved estimate; a comparison, not the funding basis",
    "versus_weeks", ai ? -ai.versusEstimate.weeks : null, count);
  scenario(AI_SCENARIO_SLOTS.hoursSaved, "delivery hours an AI-assisted delivery scenario would take off the approved estimate; a comparison, not the funding basis",
    "versus_hours", ai ? -ai.versusEstimate.hours : null, hours);
  scenario(AI_SCENARIO_SLOTS.costSaved, "how much lower an AI-assisted delivery scenario's cost at plan is than the approved estimate, its AI tool licences included; a comparison, not the funding basis",
    "versus_plan", ai ? -ai.versusEstimate.planCents : null, cents);
  scenario(AI_SCENARIO_SLOTS.toolCost, "the AI tool licence cost inside an AI-assisted delivery scenario",
    "tool_cost", ai ? ai.toolCostCents : null, cents);
  const activeRows = inputs.register.status === "ready" && !inputs.register.value.figuresRedacted
    ? inputs.register.value.assumptions.filter((row) => ["open", "confirmed", "corrected"].includes(String(row.status))) : null;
  add({
    key: "register.count.active", meaning: "count of open, confirmed and corrected assumption rows returned by the register",
    display: activeRows ? count(activeRows.length) : null,
    sourceId: activeRows ? "evidence:register_active_count" : "gap:register_active_count",
    sourceLabel: activeRows ? "Signed-in assumptions register: active row count"
      : inputs.register.status === "ready" ? "Assumptions register figure withheld" : "Assumptions register read unavailable",
    missingPhrase: inputs.register.status === "ready" ? "withheld" : "unavailable", editions: both,
  });
  add({
    key: "register.count.open", meaning: "count of assumptions whose current status is open; excludes confirmed and corrected assumptions",
    display: activeRows ? count(activeRows.filter((row) => row.status === "open").length) : null,
    sourceId: activeRows ? "evidence:register_open_count" : "gap:register_open_count",
    sourceLabel: activeRows ? "Signed-in assumptions register: open status count" : "Open assumption count unavailable or withheld",
    missingPhrase: inputs.register.status === "ready" ? "withheld" : "unavailable", editions: both,
  });
  add({
    key: "baseline.current", meaning: "measured current-state baseline, only when separately sourced and governed",
    display: null, sourceId: "gap:baseline_current", sourceLabel: "Current-state baseline not source-verified",
    missingPhrase: "baseline not yet source-verified", editions: both,
  });
  const owners = inputs.capture[3].status === "ready"
    ? parseOperatingAdoption(inputs.capture[3].value.operating_adoption) : null;
  const acceptedOwners = owners?.ownersAcceptedAt ? owners.rows.filter((row) => row.owner) : null;
  add({
    key: "owners.count.accepted", meaning: "number of accepted operating owners in the phase-three readback",
    display: acceptedOwners ? count(acceptedOwners.length) : null,
    sourceId: acceptedOwners ? "evidence:P3:operating_adoption" : "gap:owners_count_accepted",
    sourceLabel: acceptedOwners ? "Signed-in P3 accepted owner readback" : "P3 owners not accepted",
    missingPhrase: "not yet accepted", editions: investment,
  });
  const citations = inputs.citations.status === "ready" ? inputs.citations.value : null;
  add({
    key: "sources.count.approved", meaning: "number of approved public citations returned by the source feed",
    display: citations ? count(citations.length) : null,
    sourceId: citations ? "evidence:approved_public_source_count" : "gap:sources_count_approved",
    sourceLabel: citations ? "Approved public-source citation feed count" : "Approved public-source feed unavailable",
    missingPhrase: "unavailable", editions: both,
  });
  return Object.fromEntries(entries.map((slot) => [slot.key, slot]));
}

export function promptSlotDefinitions(table: ReferenceSlotTable, edition: ReferenceEdition): Array<{ name: string; token: string; meaning: string; available: boolean }> {
  return Object.values(table).filter((slot) => slot.editions.includes(edition)).map((slot) => ({
    name: slot.key, token: `{${slot.key}}`, meaning: slot.meaning, available: slot.display !== null,
  }));
}

/** Only booleans from this record enter the prompt; displays stay server-side. */
export function buildReferenceNarrativeEvidence(table: ReferenceSlotTable, archetype: ReferenceArchetype, edition: ReferenceEdition): ReferenceNarrativeEvidence {
  const valueKey = ["one_page", "one_step_value"].includes(archetype)
    ? edition === "investment" ? "value.annual.plan" : "value.annual.base"
    : ["big_number_context", "three_year_value", "value_ledger", "shared_foundation"].includes(archetype)
      ? "value.three_year.credited" : null;
  const available = (key: string) => table[key] ? table[key].display !== null : undefined;
  const nonzero = (key: string) => table[key] ? table[key].display !== null && table[key].display !== "0" : undefined;
  return {
    ...(valueKey ? { valueAvailable: available(valueKey) } : {}),
    ...(["releases", "shared_foundation", "rom_hours"].includes(archetype) ? { estimateAvailable: available("rom.total.plan") } : {}),
    ...(archetype === AI_SCENARIO_ARCHETYPE && edition === "investment"
      ? { aiScenarioAvailable: Object.values(AI_SCENARIO_SLOTS).some((key) => available(key) === true) } : {}),
    baselineAvailable: available("baseline.current"),
    acceptedOwnersAvailable: nonzero("owners.count.accepted"),
    publicSourcesAvailable: nonzero("sources.count.approved"),
    ...(table["register.count.active"]?.display !== null && table["register.count.active"]?.display !== undefined
      ? { activeCount: table["register.count.active"]!.display! } : {}),
    ...(table["register.count.open"]?.display !== null && table["register.count.open"]?.display !== undefined
      ? { openCount: table["register.count.open"]!.display! } : {}),
  };
}
