/**
 * Moves value engine — register inputs (increment 2).
 *
 * Resolves every `{kind: "register", registerId}` input of a value case
 * against the Move's assumptions register. The register rows are read ONCE,
 * through the store's `listAssumptions` (injected — the engine never imports
 * the store), and the engine's synchronous resolver answers from that read.
 *
 * The rule is the register's own (`effectiveValue` in the register model):
 *   - confirmed and corrected rows count, on their answer value;
 *   - open rows count on their working value, flagged `mustValidate`;
 *   - proposed, rejected and superseded rows do not count: the engine reports
 *     the input `not_counted` and blocks the lever (`blocked_unresolved_input`)
 *     — a release path that reads one is `zero_release_unconfirmed` instead;
 *   - a missing row, or a counted row with no numeric value, is unresolved.
 *
 * Ranges: the row's confidence is handed to the engine, which draws the
 * default band from its named constants (`CONFIDENCE_1_BAND` ±50%,
 * `CONFIDENCE_3_BAND` ±25%, `CONFIDENCE_5_BAND` ±10%) unless the input
 * declares its own range.
 *
 * Every input that reads the register also gets a resolution record with a
 * sentence naming the row's status, so a blocked case says WHICH row stops it
 * and why — never a number in its place. The sentences carry no figure, so a
 * viewer whose figures are withheld can still read them.
 *
 * No I/O of its own: the read is the injected `listAssumptions`.
 */
import {
  effectiveValue,
  isCountedStatus,
  type AssumptionRecord,
  type AssumptionStatus,
  type CountedStatus,
} from "@/lib/programs/assumption-register/model";
import { DISCOUNT_RATE_KEY } from "./case-model";
import type { InputRef, ValueCase, ValueInputResolver } from "./types";

/** One input of the case that reads a register row, under the engine's input key. */
export interface RegisterInputRef {
  key: string;
  registerId: string;
}

export type RegisterInputOutcome =
  /** Confirmed or corrected: counts. */
  | "counted"
  /** Open: counts, but its figure must be validated. */
  | "must_validate"
  /** Proposed, rejected or superseded: does not count. */
  | "not_counted"
  /** A counted row with no numeric value to stand on. */
  | "no_value"
  /** No row with this register ID on the Move. */
  | "missing";

export interface RegisterInputResolution {
  key: string;
  registerId: string;
  outcome: RegisterInputOutcome;
  /** The row's status; null when no row exists. */
  status: AssumptionStatus | null;
  /** Figure-free sentence naming the row and its status. */
  detail: string;
}

export interface RegisterInputs {
  resolver: ValueInputResolver;
  resolutions: RegisterInputResolution[];
}

/** Every register-backed input of a case, keyed as the engine keys it. */
export function registerInputRefs(model: ValueCase): RegisterInputRef[] {
  const refs: RegisterInputRef[] = [];
  const visit = (ref: InputRef, key: string) => {
    if (ref.kind === "register") refs.push({ key, registerId: ref.registerId });
  };
  for (const lever of model.levers) {
    visit(lever.driver.baseline, `${lever.id}.driver.baseline`);
    visit(lever.driver.target, `${lever.id}.driver.target`);
    lever.terms.forEach((term, index) => {
      if (term.role !== "driver_delta") {
        visit(term.ref, `${lever.id}.term[${index}]`);
      }
    });
    visit(lever.attribution, `${lever.id}.attribution`);
    visit(lever.probability, `${lever.id}.probability`);
    if (lever.releasePath) {
      visit(lever.releasePath.releasedCost, `${lever.id}.release_cost`);
    }
  }
  visit(model.discountRate, DISCOUNT_RATE_KEY);
  return refs;
}

type UncountedStatus = Exclude<AssumptionStatus, CountedStatus>;

/** What a person does next, per status that does not count. */
const NOT_COUNTED_REMEDY: Readonly<Record<UncountedStatus, string>> = {
  proposed:
    "it is only proposed, so it does not count until a person accepts it",
  rejected:
    "it was rejected, so it does not count; point this input at another row",
  superseded:
    "it was superseded, so it does not count; point this input at the row that replaced it",
};

function sourceOf(registerId: string): string {
  return `register:${registerId}`;
}

function resolutionFor(
  ref: RegisterInputRef,
  row: AssumptionRecord | undefined,
  byId: ReadonlyMap<string, AssumptionRecord>,
): RegisterInputResolution {
  const base = { key: ref.key, registerId: ref.registerId };
  if (!row) {
    return {
      ...base,
      outcome: "missing",
      status: null,
      detail: `${ref.key} reads register row ${ref.registerId}, which does not exist on this Move's register.`,
    };
  }
  const value = effectiveValue(row);
  if (value) {
    return value.mustValidate
      ? {
          ...base,
          outcome: "must_validate",
          status: row.status,
          detail: `${ref.key} reads register row ${ref.registerId}, which is open: it counts, but its figure must be validated before the case is approved.`,
        }
      : {
          ...base,
          outcome: "counted",
          status: row.status,
          detail: `${ref.key} reads register row ${ref.registerId}, which is ${row.status}: it counts.`,
        };
  }
  if (isCountedStatus(row.status)) {
    return {
      ...base,
      outcome: "no_value",
      status: row.status,
      detail: `${ref.key} reads register row ${ref.registerId}, which is ${row.status} but has no numeric value to count; record its figure as a number.`,
    };
  }
  const replacement = row.supersededBy
    ? byId.get(row.supersededBy)?.registerId
    : undefined;
  return {
    ...base,
    outcome: "not_counted",
    status: row.status,
    detail:
      `${ref.key} reads register row ${ref.registerId}: ${NOT_COUNTED_REMEDY[row.status]}` +
      (replacement ? ` (${replacement}).` : "."),
  };
}

/**
 * Build the resolver and the per-input resolutions from rows already read.
 * Pure. Rows of every status are expected: the not-counted ones are how a
 * blocked input names its status.
 */
export function buildRegisterInputs(
  model: ValueCase,
  rows: readonly AssumptionRecord[],
): RegisterInputs {
  const byRegisterId = new Map(rows.map((row) => [row.registerId, row]));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const resolver: ValueInputResolver = (ref) => {
    if (ref.kind !== "register") return null;
    const row = byRegisterId.get(ref.registerId);
    if (!row) return null;
    const value = effectiveValue(row);
    if (value) {
      return {
        value: value.value,
        source: sourceOf(row.registerId),
        confidence: value.confidence,
        status: value.status,
      };
    }
    if (isCountedStatus(row.status)) {
      // Counted, but nothing numeric to stand on: unresolved, never zero.
      return null;
    }
    // Not counted. The engine refuses the status before it reads the value,
    // so this NaN is never multiplied; it is here only because the shape
    // requires a number and any real number would look like a figure.
    return {
      value: Number.NaN,
      source: sourceOf(row.registerId),
      status: row.status,
    };
  };
  return {
    resolver,
    resolutions: registerInputRefs(model).map((ref) =>
      resolutionFor(ref, byRegisterId.get(ref.registerId), byId),
    ),
  };
}

/**
 * Read the Move's register once (when the case reads it at all) and build the
 * resolver. A read failure is thrown, never folded into "no rows": an empty
 * register would read as every input missing, which is a verdict, not a
 * failure.
 */
export async function loadRegisterInputs<Ctx>(
  model: ValueCase,
  read: {
    ctx: Ctx;
    programId: string;
    listAssumptions: (
      ctx: Ctx,
      programId: string,
    ) => Promise<AssumptionRecord[]>;
  },
): Promise<RegisterInputs> {
  if (registerInputRefs(model).length === 0) {
    return buildRegisterInputs(model, []);
  }
  const rows = await read.listAssumptions(read.ctx, read.programId);
  return buildRegisterInputs(model, rows);
}
