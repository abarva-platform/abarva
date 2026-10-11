import type { EditionInputs } from "./reference-deck-inputs";
import type { ReferenceEdition } from "./reference-deck-model";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";

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
const cents = (value: unknown): string | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? `$${Math.round(value / 100).toLocaleString("en-US")}` : null;
const ratio = (value: unknown): string | null =>
  typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : null;
const count = (value: number): string => value.toLocaleString("en-US");

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

export function promptSlotDefinitions(table: ReferenceSlotTable, edition: ReferenceEdition): Array<{ name: string; meaning: string }> {
  return Object.values(table).filter((slot) => slot.editions.includes(edition)).map((slot) => ({ name: slot.key, meaning: slot.meaning }));
}
