import type { MovesHomeStatusTone } from "@/components/strategic-moves/MovesHome";
import type { MovesHomeMoveInput } from "@/components/strategic-moves/moves-home-adapter";

/**
 * Maps a StrategicMove portfolio row to the `MovesHome` adapter input. Pure and
 * framework-free. Value is read from the move's governed `valueAtStake` (the
 * same field the current list uses) — nothing is invented. A move is surfaced
 * as "waiting on you" when its status needs a human decision (amber/red), using
 * the status description as the specific ask.
 */
export type StrategicMoveStatusColor = "red" | "amber" | "green" | "teal";

export interface StrategicMoveHomeSource {
  id: string;
  displayCode: string;
  name: string;
  currentPhase: number;
  phaseLabel: string;
  terminalComplete?: boolean;
  status: { key: string; text: string; description: string };
  statusColor: StrategicMoveStatusColor;
  sponsor: { name: string } | null;
  valueAtStake: {
    projected: { low: number; high: number; currency: string } | null;
    verified: { amount: number; status: "pending" | "tracked" | "final" } | null;
  } | null;
  updatedAt: string | null;
}

const TONE: Record<StrategicMoveStatusColor, MovesHomeStatusTone> = {
  red: "blocked",
  amber: "watch",
  green: "active",
  teal: "done",
};

export function strategicMoveStatusTone(
  color: StrategicMoveStatusColor,
): MovesHomeStatusTone {
  return TONE[color] ?? "active";
}

function money(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  }
}

/**
 * The copy a move carries when its governed `valueAtStake` declares nothing.
 * Presentation only — never compare against it to decide whether a value was
 * declared; use `hasDeclaredValue`.
 */
export const DECLARES_IN_CHARTER = "Declares in Charter";

/**
 * Whether the move's governed `valueAtStake` declares a value at all.
 *
 * This is the ONE place that decides it. `formatMoveValue` consults it to pick
 * its fallback copy, and the portfolio landing's value line counts with it.
 * Counting instead by comparing the FORMATTED string against the fallback copy
 * (which the landing host used to do) makes a pure copy change silently
 * overstate governed coverage — every move would read as having declared a
 * value. The figure must come from the governed field, not from its label.
 */
export function hasDeclaredValue(
  value: StrategicMoveHomeSource["valueAtStake"],
): boolean {
  if (value?.verified && value.verified.amount > 0) return true;
  return Boolean(value?.projected);
}

export function formatMoveValue(
  value: StrategicMoveHomeSource["valueAtStake"],
): string {
  if (!hasDeclaredValue(value)) return DECLARES_IN_CHARTER;
  if (value?.verified && value.verified.amount > 0) {
    const label = money(value.verified.amount);
    return value.verified.status === "final" ? label : `${label} tracked`;
  }
  const projected = value!.projected!;
  const currency = projected.currency || "USD";
  return `${money(projected.low, currency)}–${money(projected.high, currency)} projected`;
}

/**
 * The portfolio landing's one-line value summary, derived from the governed
 * `valueAtStake` of each move — not from any rendered label.
 *
 * Counting here by `formatMoveValue(v) !== DECLARES_IN_CHARTER` instead is a
 * FALSE-SURVIVOR mutation: it kills no case, because the fallback copy and the
 * predicate agree by construction and the suite pins that agreement. The guard
 * against the old derivation is that agreement — the moment the copy drifts
 * from the predicate, the "renders the fallback copy exactly when nothing is
 * declared" case fails — plus the signature, which takes the governed field
 * and so makes a string comparison at the host a type error.
 */
export function buildPortfolioValueLine(
  values: ReadonlyArray<StrategicMoveHomeSource["valueAtStake"]>,
): string {
  const total = values.length;
  if (total === 0) return "No moves yet.";
  const withValue = values.filter((value) => hasDeclaredValue(value)).length;
  return `${withValue} of ${total} ${total === 1 ? "move has" : "moves have"} declared value; the rest declare in Charter.`;
}

function daysSince(iso: string | null, now: Date): number | undefined {
  if (!iso) return undefined;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return undefined;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

function relativeWhen(ageDays: number | undefined): string {
  if (ageDays === undefined) return "";
  if (ageDays === 0) return "Today";
  if (ageDays === 1) return "Yesterday";
  if (ageDays < 7) return `${ageDays} days ago`;
  if (ageDays < 30) return `${Math.floor(ageDays / 7)}w ago`;
  return `${Math.floor(ageDays / 30)}mo ago`;
}

/** A move needs a human decision when its status is amber (watch) or red (blocked). */
function isWaiting(move: StrategicMoveHomeSource): boolean {
  return (
    !move.terminalComplete &&
    (move.statusColor === "amber" || move.statusColor === "red")
  );
}

export function strategicMoveToHomeInput(
  move: StrategicMoveHomeSource,
  now: Date = new Date(),
): MovesHomeMoveInput {
  const ageDays = daysSince(move.updatedAt, now);
  const waiting = isWaiting(move);
  return {
    id: move.id,
    name: move.name,
    code: move.displayCode,
    currentPhase: move.currentPhase,
    phaseLabel: move.phaseLabel,
    sponsor: move.sponsor?.name ?? "Unassigned",
    value: formatMoveValue(move.valueAtStake),
    status: move.status.text,
    statusTone: strategicMoveStatusTone(move.statusColor),
    activity: relativeWhen(ageDays),
    href: `/strategic-moves/${move.id}`,
    inFlight: !move.terminalComplete,
    waitingAsk: waiting ? move.status.description : null,
    waitingWhere: move.phaseLabel,
    ageDays,
  };
}
