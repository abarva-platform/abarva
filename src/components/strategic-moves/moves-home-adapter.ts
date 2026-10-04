import type {
  MovesHomeProps,
  MovesHomeReconciliation,
  MovesHomeMoveRow,
  MovesHomeWaitingItem,
  MovesHomeStatusTone,
} from "@/components/strategic-moves/MovesHome";

/**
 * Pure assembly of `MovesHome` props from a normalized move list. Derives the
 * headline counts and the oldest-first "waiting on you" triage; it does NOT
 * compute or invent value/budget numbers — `valueLine` and `reconciliation`
 * are passed in by the host, which sources them from governed value facts
 * (fact-lineage: quote ONE_SOURCE, never a CONFLICT). Framework-free + tested.
 */
export interface MovesHomeMoveInput {
  id: string;
  name: string;
  code: string;
  /** 0..5 — clamped for the phase rail. */
  currentPhase: number;
  phaseLabel: string;
  sponsor: string;
  /** Governed value string for the row (already resolved by the host). */
  value: string;
  status: string;
  statusTone: MovesHomeStatusTone;
  /** Human "last activity", e.g. "3 days ago". */
  activity: string;
  href: string;
  /** False only for terminal/handed-off moves; defaults to in flight. */
  inFlight?: boolean;
  /** When set, the move is waiting on the user — the ask shown in triage. */
  waitingAsk?: string | null;
  /** Where the move is for triage, e.g. "P1 Charter · step 2". */
  waitingWhere?: string;
  /** Age in days, for the oldest-first triage sort. */
  ageDays?: number;
}

function clampPhase(phase: number): number {
  if (!Number.isFinite(phase)) return 0;
  return Math.max(0, Math.min(5, Math.trunc(phase)));
}

export function buildMovesHomeProps(args: {
  tenantName: string;
  moves: readonly MovesHomeMoveInput[];
  valueLine: string;
  reconciliation?: MovesHomeReconciliation | null;
  newMoveHref: string;
  footerNote?: string;
}): MovesHomeProps {
  const inFlightCount = args.moves.filter((m) => m.inFlight !== false).length;

  const waiting: MovesHomeWaitingItem[] = args.moves
    .filter((m) => Boolean(m.waitingAsk && m.waitingAsk.trim()))
    .slice()
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0)) // oldest first
    .map((m) => ({
      id: m.id,
      where: m.waitingWhere ?? m.phaseLabel,
      name: m.name,
      ask: (m.waitingAsk ?? "").trim(),
      sponsor: m.sponsor,
      when: m.activity,
      href: m.href,
    }));

  const moves: MovesHomeMoveRow[] = args.moves.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    phaseLabel: m.phaseLabel,
    phaseIndex: clampPhase(m.currentPhase),
    status: m.status,
    statusTone: m.statusTone,
    sponsor: m.sponsor,
    value: m.value,
    activity: m.activity,
    href: m.href,
  }));

  const inFlightLabel = `${inFlightCount} ${inFlightCount === 1 ? "move" : "moves"} in flight`;
  const headline =
    waiting.length > 0
      ? `${inFlightLabel} · ${waiting.length} waiting on a decision`
      : inFlightLabel;

  return {
    tenantName: args.tenantName,
    headline,
    valueLine: args.valueLine,
    waiting,
    moves,
    reconciliation: args.reconciliation ?? null,
    newMoveHref: args.newMoveHref,
    footerNote: args.footerNote,
  };
}
