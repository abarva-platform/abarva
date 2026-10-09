/**
 * Moves value engine — one-at-a-time sensitivity.
 *
 * Every resolved input whose low and high differ is moved, alone, to each
 * end of its range while everything else stays at base; each row reports
 * the base-scenario annual cash, NPV, payback month and every lever's
 * breakeven under that one change. (A higher spend base, for example, lowers
 * the reduction share a cost lever needs to break even.)
 *
 * Pure, no I/O.
 */
import { caseBreakeven } from "./breakeven";
import { overlapExclusions, runScenario, type ReadyCase } from "./case-model";
import type { ResolvedNumber } from "./resolve-inputs";
import type { LeverBreakeven, SensitivityRow } from "./types";

interface SensitivityInput {
  value: ResolvedNumber;
  label: string;
}

/** Every input of a ready case, in case order, with a reader-facing label. */
export function sensitivityInputs(ready: ReadyCase): SensitivityInput[] {
  const out: SensitivityInput[] = [];
  for (const prepared of ready.levers) {
    const { lever } = prepared;
    for (const term of prepared.terms) {
      out.push({
        value: term.value,
        label: `${lever.id} ${lever.name}: ${term.label}`,
      });
    }
    out.push(
      {
        value: prepared.attribution,
        label: `${lever.id} ${lever.name}: attribution`,
      },
      {
        value: prepared.probability,
        label: `${lever.id} ${lever.name}: probability`,
      },
    );
    if (prepared.release?.cost) {
      out.push({
        value: prepared.release.cost,
        label: `${lever.id} ${lever.name}: released cost`,
      });
    }
  }
  out.push(
    { value: ready.discountRate, label: "discount rate" },
    { value: ready.cost, label: "investment (cents)" },
  );
  return out;
}

export function oneAtATimeSensitivity(ready: ReadyCase): SensitivityRow[] {
  const rows: SensitivityRow[] = [];
  for (const input of sensitivityInputs(ready)) {
    if (input.value.low === input.value.high) continue;
    for (const side of ["low", "high"] as const) {
      const overrides = new Map([[input.value.key, input.value[side]]]);
      const run = runScenario(
        ready,
        "base",
        overrides,
        overlapExclusions(ready, overrides),
      );
      const breakeven: Record<string, LeverBreakeven> = {};
      for (const entry of caseBreakeven(ready, overrides)) {
        breakeven[entry.leverId] = entry;
      }
      rows.push({
        key: input.value.key,
        label: input.label,
        side,
        inputValue: input.value[side],
        annualCashCents: run.annualCash.figure,
        npvCents: run.npv.figure,
        paybackMonth: run.paybackMonth,
        breakeven,
      });
    }
  }
  return rows;
}
