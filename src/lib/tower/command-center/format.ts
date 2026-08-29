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
