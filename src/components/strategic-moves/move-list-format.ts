// Shared formatting + filtering helpers for the Strategic Moves list surfaces
// (landing + Manage Moves). Pure functions only — no React, no I/O — so the
// filter/search/count logic is unit-tested independently of the UI.

import type { StrategicMove } from "@/lib/programs/types.ui";

/** The filter chips shared by the landing and Manage Moves, in display order. */
export type MoveChipKey =
  | "all"
  | "attention"
  | "awaiting"
  | "on_track"
  | "archived";

export const MOVE_CHIPS: ReadonlyArray<{ key: MoveChipKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "awaiting", label: "Awaiting decision" },
  { key: "on_track", label: "On track" },
  { key: "archived", label: "Archived" },
];

export function isArchived(move: StrategicMove): boolean {
  return move.lifecycleState === "archived" || Boolean(move.archivedAt);
}

export function formatValueAtStake(amountUsd: number): string {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return "$—";
  if (amountUsd >= 1_000_000_000)
    return `$${(amountUsd / 1_000_000_000).toFixed(1)}B`;
  if (amountUsd >= 1_000_000) return `$${Math.round(amountUsd / 1_000_000)}M`;
  if (amountUsd >= 1_000) return `$${Math.round(amountUsd / 1_000)}K`;
  return `$${Math.round(amountUsd).toLocaleString()}`;
}

export function moveValue(move: StrategicMove): number {
  return (
    move.valueAtStake.projected?.high ?? move.valueAtStake.verified?.amount ?? 0
  );
}

/**
 * Lifecycle % complete for a Move — how far it has advanced through the five
 * delivery phases (P1…P5). `currentPhase` is the phase the Move is IN, so the
 * count of passed gates equals it: P0 = 0%, P1 = 20%, … P5 (→ Tower) = 100%.
 * A single truthful portfolio-level signal; per-phase gate detail lives in the
 * phase workbench.
 */
export function moveLifecyclePct(move: StrategicMove): number {
  const phase = Math.max(0, Math.min(5, move.currentPhase));
  return Math.round((phase / 5) * 100);
}

/**
 * Human "last activity" label from an ISO timestamp, relative to `now`
 * (injected so this stays pure/testable). Returns "—" for missing/invalid.
 */
export function relativeTime(
  iso: string | null | undefined,
  now: number,
): string {
  if (!iso) return "—";
  // `now <= 0` means "clock not ready" (pre-mount) — callers seed 0 on the
  // server/first render and set the real time after mount to avoid a hydration
  // mismatch on the relative label.
  if (!Number.isFinite(now) || now <= 0) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const diffMs = Math.max(0, now - t);
  const day = 86_400_000;
  const days = Math.floor(diffMs / day);
  if (diffMs < 60_000) return "Just now";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

/** Apply a chip filter. `all` (and every active chip) excludes archived. */
export function filterByChip(
  moves: ReadonlyArray<StrategicMove>,
  chip: MoveChipKey,
): StrategicMove[] {
  switch (chip) {
    case "archived":
      return moves.filter(isArchived);
    case "attention":
      return moves.filter(
        (m) => !isArchived(m) && m.status.key === "gate_blocked",
      );
    case "awaiting":
      return moves.filter(
        (m) => !isArchived(m) && m.status.key === "awaiting_decision",
      );
    case "on_track":
      return moves.filter((m) => !isArchived(m) && m.status.key === "on_track");
    case "all":
    default:
      return moves.filter((m) => !isArchived(m));
  }
}

/** Case-insensitive search over name + display code. Empty query = no filter. */
export function searchMoves(
  moves: ReadonlyArray<StrategicMove>,
  query: string,
): StrategicMove[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...moves];
  return moves.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.displayCode.toLowerCase().includes(q),
  );
}

/** Counts shown on the chips. Active chips count non-archived; archived counts archived. */
export function chipCounts(
  moves: ReadonlyArray<StrategicMove>,
): Record<MoveChipKey, number> {
  const active = moves.filter((m) => !isArchived(m));
  return {
    all: active.length,
    attention: active.filter((m) => m.status.key === "gate_blocked").length,
    awaiting: active.filter((m) => m.status.key === "awaiting_decision").length,
    on_track: active.filter((m) => m.status.key === "on_track").length,
    archived: moves.filter(isArchived).length,
  };
}

/** The four landing summary cards, derived from the active subset. */
export function summaryStats(moves: ReadonlyArray<StrategicMove>): {
  active: number;
  needAttention: number;
  onTrack: number;
  valueAtStake: number;
} {
  const active = moves.filter((m) => !isArchived(m));
  return {
    active: active.length,
    needAttention: active.filter((m) => m.statusColor === "red").length,
    onTrack: active.filter((m) => m.status.key === "on_track").length,
    valueAtStake: active.reduce((sum, m) => sum + moveValue(m), 0),
  };
}
