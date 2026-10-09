/**
 * Moves value engine — input resolution.
 *
 * Every number the engine multiplies comes through here, resolved to a
 * low/base/high triple with its provenance. Literal and evidence refs carry
 * their own value; register and ROM refs are resolved by an injected
 * resolver (the engine never imports the register). A ref that cannot be
 * resolved, or resolves to a row that is not counted, is reported as an
 * issue — never replaced by a default.
 *
 * Range precedence: the ref's own `range`, then the resolver's `range`, then
 * the default band for the register confidence, then the point value.
 *
 * Pure, no I/O.
 */
import type {
  InputIssue,
  InputIssueReason,
  InputRange,
  InputRef,
  RegisterRowStatus,
  ValueInputResolver,
} from "./types";

/** Default ± band for a register row of confidence 1 (lowest). */
export const CONFIDENCE_1_BAND = 0.5;
/** Default ± band for a register row of confidence 3. */
export const CONFIDENCE_3_BAND = 0.25;
/** Default ± band for a register row of confidence 5 (highest). */
export const CONFIDENCE_5_BAND = 0.1;

/** Register statuses whose value is counted. `open` counts but must be validated. */
export const COUNTED_REGISTER_STATUSES: ReadonlySet<RegisterRowStatus> =
  new Set<RegisterRowStatus>(["open", "confirmed", "corrected"]);

/**
 * The default band for a confidence score. A score between two declared
 * levels takes the WIDER band of the level below it (2 → ±50%, 4 → ±25%):
 * an undeclared confidence is never read as more certain than declared.
 * Null for no score or one outside 1..5.
 */
export function bandForConfidence(
  confidence: number | undefined,
): number | null {
  if (confidence === undefined || !Number.isInteger(confidence)) return null;
  if (confidence < 1 || confidence > 5) return null;
  if (confidence >= 5) return CONFIDENCE_5_BAND;
  if (confidence >= 3) return CONFIDENCE_3_BAND;
  return CONFIDENCE_1_BAND;
}

/** What domain an input's values must lie in. */
export type InputDomain =
  /** finite and ≥ 0 */
  | "non_negative"
  /** finite, 0..1 */
  | "fraction"
  /** finite, 0 ≤ r < 1 (an annual discount rate) */
  | "rate";

export interface ResolvedNumber {
  key: string;
  low: number;
  base: number;
  high: number;
  source: string;
  /** True when the value came from an OPEN register row. */
  mustValidate: boolean;
}

export type ResolveOutcome =
  | { ok: true; value: ResolvedNumber }
  | { ok: false; issue: InputIssue };

function fail(key: string, reason: InputIssueReason): ResolveOutcome {
  return { ok: false, issue: { key, reason } };
}

interface RawInput {
  value: number;
  source: string;
  range: InputRange | null;
  band: number | null;
  status: RegisterRowStatus | undefined;
}

function readRaw(
  ref: InputRef,
  resolver: ValueInputResolver | undefined,
): RawInput | null {
  if (ref.kind === "literal") {
    if (typeof ref.source !== "string" || ref.source.trim() === "") return null;
    return {
      value: ref.value,
      source: `literal:${ref.source.trim()}`,
      range: ref.range ?? null,
      band: null,
      status: undefined,
    };
  }
  if (ref.kind === "evidence") {
    if (typeof ref.evidenceId !== "string" || ref.evidenceId.trim() === "") {
      return null;
    }
    return {
      value: ref.value,
      source: `evidence:${ref.evidenceId.trim()}`,
      range: ref.range ?? null,
      band: null,
      status: undefined,
    };
  }
  const resolved = resolver ? resolver(ref) : null;
  if (!resolved) return null;
  return {
    value: resolved.value,
    source: resolved.source,
    range: ref.range ?? resolved.range ?? null,
    band: bandForConfidence(resolved.confidence),
    status: resolved.status,
  };
}

function inDomain(value: number, domain: InputDomain): InputIssueReason | null {
  if (!Number.isFinite(value)) return "non_finite";
  if (value < 0) return "negative";
  if (domain === "fraction" && value > 1) return "fraction_out_of_bounds";
  if (domain === "rate" && value >= 1) return "rate_out_of_bounds";
  return null;
}

/** Resolve one input to low/base/high in its domain, or report why it cannot be. */
export function resolveInput(
  ref: InputRef,
  key: string,
  domain: InputDomain,
  resolver: ValueInputResolver | undefined,
): ResolveOutcome {
  const raw = readRaw(ref, resolver);
  if (!raw) return fail(key, "unresolved");
  if (raw.status !== undefined && !COUNTED_REGISTER_STATUSES.has(raw.status)) {
    return fail(key, "not_counted");
  }
  const base = raw.value;
  let low = base;
  let high = base;
  if (raw.range) {
    low = raw.range.low;
    high = raw.range.high;
  } else if (raw.band !== null) {
    low = base * (1 - raw.band);
    high = base * (1 + raw.band);
    // A banded fraction cannot exceed 1; a banded rate stays below 1.
    if (domain === "fraction") high = Math.min(1, high);
  }
  for (const v of [low, base, high]) {
    const reason = inDomain(v, domain);
    if (reason) return fail(key, reason);
  }
  if (!(low <= base && base <= high)) return fail(key, "range_out_of_order");
  return {
    ok: true,
    value: {
      key,
      low,
      base,
      high,
      source: raw.source,
      mustValidate: raw.status === "open",
    },
  };
}
