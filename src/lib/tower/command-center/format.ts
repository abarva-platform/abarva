// Tower Command Center v2 — number formatting.
//
// The design renders every money figure in `$M` with at most one decimal, and
// renders a true zero as a bare `$0` (no unit) so that "nothing is claimable"
// reads as a hard stop rather than "$0.0M". That behaviour is transcribed from
// the design file's `fmt()` helper — keep it byte-identical in output.

/** Round to `places` decimals without float drift on .5 boundaries. */
function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format whole USD as the design's `$M` string.
 *
 *   0            → "$0"
 *   650_000_000  → "$650M"
 *   35_500_000   → "$35.5M"
 *   40_000       → "$0.04M"  (small but non-zero must never collapse to "$0")
 *
 * A non-zero amount that rounds to 0.0 at one decimal keeps two decimals, so a
 * real-but-small figure is never displayed as the "nothing here" zero.
 */
export function formatUsdM(usd: number | null | undefined): string {
  if (usd === null || usd === undefined || !Number.isFinite(usd)) return "—";
  if (usd === 0) return "$0";

  const millions = usd / 1_000_000;
  const sign = millions < 0 ? "-" : "";
  const abs = Math.abs(millions);

  const oneDp = round(abs, 1);
  if (oneDp === 0) {
    // Non-zero but sub-$0.05M. Show two decimals rather than claiming zero.
    return `${sign}$${round(abs, 2).toFixed(2)}M`;
  }
  const text = Number.isInteger(oneDp) ? String(oneDp) : oneDp.toFixed(1);
  return `${sign}$${text}M`;
}

/** A signed delta, e.g. the waterfall's "−$21.3M" drop labels. */
export function formatUsdMDelta(usd: number): string {
  if (!Number.isFinite(usd) || usd === 0) return "$0";
  const body = formatUsdM(Math.abs(usd));
  return usd < 0 ? `−${body}` : `+${body}`;
}

/** Whole-number percent, or an em dash when the input is unknown. */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return `${Math.round(value)}%`;
}

/** Integer with thousands separators, or an em dash when unknown. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

/** Ratio (0–1) as a whole percent. */
export function formatRatioPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return `${Math.round(value * 100)}%`;
}

/**
 * Three states, not two: a named blocker, a reviewed rollout with nothing found, and a rollout
 * nobody has recorded. Only the first is red.
 *
 * `control_blocker` carries `none` as a real value, so a truthy check painted a cleared rollout in
 * alarm red and counted it as blocked.
 */
export function controlBlockerCell(item: {
  controlBlocker: string | null;
  controlBlockerReviewed: boolean;
}): { text: string; tone: "blocked" | "clear" | "absent" } {
  if (item.controlBlocker !== null) {
    return { text: item.controlBlocker, tone: "blocked" };
  }
  return item.controlBlockerReviewed
    ? { text: "None found", tone: "clear" }
    : { text: "Not loaded", tone: "absent" };
}

export const BLOCKER_TONE: Record<"blocked" | "clear" | "absent", string> = {
  blocked: "var(--canon-red)",
  clear: "var(--canon-teal-dark)",
  absent: "var(--canon-gray-500)",
};

const CONTROL_BLOCKER_EXPLANATIONS: Record<string, string> = {
  "clinical safety review":
    "Clinical governance has to confirm the use is safe for care teams or patients before value can move forward.",
  "dlp policy":
    "Data-loss-prevention approval is needed for the data this tool handles.",
  "sox evidence":
    "Finance-control evidence is needed when the tool or workflow can affect financial reporting.",
  "workflow telemetry":
    "The workflow must emit evidence that people are using the AI-supported process, not just that the tool was deployed.",
};

const GATING_CONSTRAINT_EXPLANATIONS: Record<string, string> = {
  "usage-to-value support":
    "Usage exists, but it is not yet mapped to the value claim it is supposed to prove.",
  "measured outcome":
    "The business result has to be measured before Finance can validate it.",
  "finance value treatment":
    "Finance has not approved how the value should be recognized.",
  "finance attestation":
    "Finance has not signed the measured value as claimable.",
  "business attestation":
    "The business owner has not signed the outcome as delivered.",
};

function normalizedDictionaryKey(value: string): string {
  return value.replace(/_/g, " ").trim().toLowerCase();
}

export function controlBlockerExplanation(item: {
  controlBlocker: string | null;
  controlBlockerReviewed: boolean;
}): string {
  const cell = controlBlockerCell(item);
  if (cell.tone === "clear") {
    return "This row was reviewed and no control blocker was recorded.";
  }
  if (cell.tone === "absent") {
    return "No reviewed blocker field is loaded; absence is not clearance.";
  }
  return (
    CONTROL_BLOCKER_EXPLANATIONS[normalizedDictionaryKey(cell.text)] ??
    "A named control blocker is loaded for this row; open details for the source context."
  );
}

export function gatingConstraintExplanation(value: string | null): string {
  if (value === null) {
    return "No gating constraint is loaded for this row.";
  }
  return (
    GATING_CONSTRAINT_EXPLANATIONS[normalizedDictionaryKey(value)] ??
    "This is the loaded gate holding the row before it can move to the next value-proof state."
  );
}
