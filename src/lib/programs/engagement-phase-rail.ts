// The phase rail the engagement console's meta strip draws: one marker per
// canonical Strategic Move phase, each carrying the canonical label and
// whichever gate approval the Move's records name for it.
//
// Three separate defects put this in a module instead of at the render site.
//
// 1. The strip stated its own phase model. It hardcoded five labels —
//    'Start', 'Diagnose', 'Design', 'Execute', 'Verify' — on a surface the
//    product chrome lights the Moves nav tab for. `phase-labels` is the
//    declared source of truth ("Centralize every user-visible phase label
//    here") and says a Strategic Move runs across SIX phases, P0 Originate
//    through P5 Mobilize & Handoff, and says in as many words that Build /
//    Execute / Verify are NOT Strategic Move phases because Tower owns
//    downstream execution. So the rail named two phases the doctrine excludes,
//    renamed three it does define, and had no column at all for P5 — the last
//    phase of the walk fell off the chart, and a Move sitting at phase 5
//    indexed past the end of both the label and the colour array and rendered
//    the bare fallback 'Phase 5'.
//
// 2. The strip recognised one recorded shape of a gate approval. It asked each
//    `gates_passed` entry for `.phase` and `.status === 'approved'`, while the
//    only control that appends to that array on the Moves path appends the
//    BARE PHASE NUMBER. A number has no `.phase`, so the approval the product
//    itself records matched nothing. A sibling reader of the same array,
//    `hasTerminalTowerHandoffPassed`, does accept the bare number, so two
//    readers disagreed about the same record. Asking a shared reader means the
//    phase spellings and approving statuses are stated once, in
//    `approved-gate-phases`, for every reader rather than per surface.
//
// 3. The rail asked one of the two records that can say a gate was approved.
//    `gates_passed` is not appended to for phases 1-4 by any reachable
//    control — the advance SQL omits the column and the only product writer is
//    the terminal P5 handoff — so a user who approved the P1, P2, P3 or P4
//    gate in the product saw that phase render unmarked, on the surface whose
//    whole job is to show how far the Move has come. The authoritative record
//    for those phases is `phase_snapshots`: both `runAdvancePhase`
//    implementations insert a row for the phase being left, stamped `approved`
//    with a `locked_at`. Taking both records closes that, and because the
//    snapshot row is dated it also gives the two date readings below something
//    to read on a walked Move, where before they could only ever be null.
//
// Approval and its date are both asked of `buildGateApprovalEvents`, which
// already states that union once for the activity timeline, so the rail gains
// a reader of the existing rule rather than restating it. Phases it reports as
// approved-but-undatable come back separately and are marked without a date.
//
// What is deliberately NOT claimed. A bare phase number carries no date, so
// such an entry reports `approved: true` with `signedAt: null`: the rail can
// say the gate was approved without inventing when. Date-derived text
// (baseline lock, next gate) stays absent in that case rather than guessing.
// And a host that loads no snapshots is told nothing new — the rail reads what
// it is handed, so wiring the host is part of the fix, not an optional half.

import {
  PHASE_LABELS_SHORT,
  TOTAL_PHASES,
  getPhaseLabelShort,
} from "@/lib/programs/phase-labels";
import {
  buildGateApprovalEvents,
  type DatedGateSnapshot,
} from "@/lib/programs/gate-approval-events";

/** Days from the most recent signed gate to the nominal next one. */
export const NEXT_GATE_INTERVAL_DAYS = 30;

export type EngagementPhaseMarker = {
  phase: number;
  /** The canonical short rail label, e.g. `Originate` for phase 0. */
  label: string;
  /** Does either gate record name this phase's gate as approved? */
  approved: boolean;
  /** The recorded sign-off date, or null when the record carried none. */
  signedAt: string | null;
};

export type EngagementPhaseRail = {
  /** When the baseline was locked, or null when nothing records it. */
  baselineLockedAt: string | null;
  /** The nominal next gate date, or null with no dated gate to count from. */
  nextGateAt: string | null;
  /** One marker per canonical phase, ascending from phase 0. */
  markers: EngagementPhaseMarker[];
};

export type EngagementPhaseRailInput = {
  /** `engagements.gates_passed`, in any shape it has been written in. */
  gatesPassed: readonly unknown[] | null | undefined;
  /**
   * `phase_snapshots` rows for the Move — the record that carries the P1-P4
   * approvals the array never receives. Omit only when the host genuinely
   * loaded none; omitting it reinstates the blind spot this input exists for.
   */
  snapshots?: readonly DatedGateSnapshot[] | null;
  /** `baseline_metrics.captured_at`, which outranks a gate date when present. */
  baselineCapturedAt?: string | null;
};

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export function deriveEngagementPhaseRail({
  gatesPassed,
  snapshots = null,
  baselineCapturedAt = null,
}: EngagementPhaseRailInput): EngagementPhaseRail {
  // Both records, asked once. `events` carries the approvals some record can
  // date; `undatedPhases` carries the approvals no record can — a bare phase
  // number is an approval with no time attached, and dropping it would report
  // an approved gate as unapproved purely for want of a timestamp.
  const { events, undatedPhases } = buildGateApprovalEvents({
    gatesPassed,
    snapshots,
  });
  const signedAtByPhase = new Map(events.map((event) => [event.phase, event.at]));
  const undated = new Set(undatedPhases);

  // The rail is as long as the canonical phase model, so a Move at the last
  // phase has a column to sit in and no index runs off the end.
  const markers: EngagementPhaseMarker[] = [];
  for (let phase = 0; phase < TOTAL_PHASES; phase += 1) {
    const signedAt = signedAtByPhase.get(phase) ?? null;
    markers.push({
      phase,
      label: getPhaseLabelShort(phase),
      approved: signedAt !== null || undated.has(phase),
      signedAt,
    });
  }

  // The baseline's own capture date is the record; a phase-2 gate date is the
  // fallback the strip has always used when the baseline carries none. The two
  // former fallback arms were identical expressions, so collapsing them to the
  // phase-2 gate date changes no outcome.
  const phase2SignedAt =
    markers.find((marker) => marker.phase === 2)?.signedAt ?? null;
  const baselineLockedAt = nonEmpty(baselineCapturedAt) ?? phase2SignedAt;

  // Count forward from the most recently signed gate, whichever phase that is.
  const latestSignedAt = markers
    .map((marker) => marker.signedAt)
    .filter((signedAt): signedAt is string => signedAt !== null)
    .sort((a, b) => b.localeCompare(a))[0];
  const latestSignedMs = latestSignedAt
    ? new Date(latestSignedAt).getTime()
    : Number.NaN;
  const nextGateAt = Number.isFinite(latestSignedMs)
    ? new Date(
        latestSignedMs + NEXT_GATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  return { baselineLockedAt, nextGateAt, markers };
}

/** The canonical rail labels, for a host that needs them without the records. */
export const ENGAGEMENT_RAIL_LABELS: readonly string[] = Array.from(
  { length: TOTAL_PHASES },
  (_, phase) => PHASE_LABELS_SHORT[phase] ?? `Phase ${phase}`,
);
