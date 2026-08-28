// Cross-module decision trace · Wave 5, Slice 5.4.
//
// Pure, deterministic view-model that joins, by ID, the evidence trail
// for one decision (a Move) across the four AbarVa surfaces:
//
//   Intelligence  ->  Move  ->  Source  ->  Tower
//
// For each loop hand-off it produces one `TraceStep`. A step is either
// `linked` (the artifact and its ID-join exist in product data) or
// `not_yet_linked` (the loop is not fully wired — see the gap
// inventories in docs/strategy/scenarios/*-LOOP-WIRING-GAPS.md). The
// view never fabricates a link: where the join does not exist it
// surfaces the gap honestly with a reference to the follow-on work.
//
// This module performs NO writes, NO model calls, NO live retrieval,
// and does not call Date.now / Math.random / new Date / fetch. The
// route layer reads data through the existing read-adapter seam and
// hands plain inputs to `buildCrossModuleTrace`.

import type { StrategicMove } from "./types.ui";
import type { OutcomeLedgerRow } from "@/lib/tower/outcome-ledger/types";
import type { ControlEvalMatrix } from "@/lib/programs/controls/control-eval-matrix";
import {
  buildSr117ControlDeliverable,
  isSr117RegulatedTenant,
  type Sr117ControlDeliverable,
} from "@/lib/programs/regulatory/sr-11-7-control-deliverable";

/**
 * The minimal Source-event shape the trace ID-joins on. A projection
 * of the persisted `source_events` row that keeps `linkedProgramId` —
 * the column the Move-to-Source hand-off is joined through. The route
 * builds this from the source-events read adapter.
 */
export interface TraceSourceEvent {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly currentStageLabel: string;
  readonly statusLabel: string;
  readonly nextAction: string;
  /** The Move/program id this event was seeded from, when wired. */
  readonly linkedProgramId: string | null;
}

/** The four surfaces the trace stitches together, in loop order. */
export const TRACE_MODULES = [
  "intelligence",
  "move",
  "source",
  "tower",
] as const;

export type TraceModule = (typeof TRACE_MODULES)[number];

/**
 * Whether a hand-off in the loop is wired in product.
 *
 * - `linked`         — the artifact exists and is ID-joined to the Move.
 * - `not_yet_linked` — the loop hand-off is not yet wired; the step is
 *                      shown honestly as a gap, not fabricated.
 */
export type TraceLinkState = "linked" | "not_yet_linked";

/** One row in the joined evidence trail. */
export interface TraceStep {
  /** Which surface this step belongs to. */
  readonly module: TraceModule;
  /** Short surface label, e.g. "Intelligence". */
  readonly moduleLabel: string;
  /** What kind of artifact the step represents, e.g. "Originating bet". */
  readonly artifactKind: string;
  /** Whether the hand-off is wired. */
  readonly linkState: TraceLinkState;
  /** Human-readable artifact title, or the gap headline when unlinked. */
  readonly title: string;
  /** One-line detail: the joined evidence, or why the link is missing. */
  readonly detail: string;
  /** The ID this step is joined on, when one exists. */
  readonly joinId: string | null;
  /** In-product route to the artifact, when one exists. */
  readonly href: string | null;
  /** When unlinked, the gap ticket id (e.g. "GAP-1") this traces to. */
  readonly gapRef: string | null;
  /**
   * The SR 11-7 model-risk control deliverable, present on the Move step
   * only when the tenant is under model-risk supervision (financial
   * services). For regulated tenants this surfaces model validation,
   * ongoing monitoring, and governance controls as an explicit, traceable
   * deliverable in the phase trace (closes FIRSTCAPITAL GAP-3). `null` for
   * non-regulated tenants and on every non-Move step.
   */
  readonly regulatoryDeliverable: Sr117ControlDeliverable | null;
}

/** The full joined trace for one Move. */
export interface CrossModuleTrace {
  /** The Move the trace is anchored on. */
  readonly moveId: string;
  readonly moveDisplayCode: string;
  readonly moveName: string;
  readonly tenantName: string;
  /** Steps in loop order — always one per `TRACE_MODULES` entry. */
  readonly steps: readonly TraceStep[];
  /** Count of steps whose hand-off is wired. */
  readonly linkedCount: number;
  /** Count of steps shown as an honest gap. */
  readonly unlinkedCount: number;
  /**
   * Coarse coherence read for the CXO:
   * `coherent` — every hand-off wired; `partial` — some wired;
   * `unwired` — none of the cross-module hand-offs are wired.
   */
  readonly coherence: "coherent" | "partial" | "unwired";
}

const MODULE_LABELS: Record<TraceModule, string> = {
  intelligence: "Intelligence",
  move: "Move",
  source: "Source",
  tower: "Tower",
};

/** The shaping artifacts a Move carries, surfaced as one trace detail. */
const SHAPING_TYPE_KEYS = [
  "suitability",
  "decomposition",
  "architecture",
  "controls",
  "mobilization",
] as const;

/** Inputs the route gathers and hands to the pure builder. */
export interface CrossModuleTraceInput {
  /** The anchor Move, read through the programs query seam. */
  readonly move: StrategicMove;
  /**
   * Source events for the tenant, read through the source-events
   * adapter seam. The trace ID-joins on `linkedProgramId === move.id`.
   */
  readonly sourceEvents: readonly TraceSourceEvent[];
  /**
   * Current outcome-ledger entries for the tenant, read through the
   * outcome-ledger adapter seam. The trace ID-joins on
   * `subjectKind === 'move' && subjectRef === move.id`.
   */
  readonly outcomeEntries: readonly OutcomeLedgerRow[];
  /**
   * The Move's Slice 2.5 control & eval matrix, when the route has shaped
   * it. Supplied for regulated tenants so the Move step can surface the
   * SR 11-7 model-risk control deliverable in the phase trace. Optional —
   * a non-regulated tenant, or a Move not yet shaped, leaves it undefined
   * and the SR 11-7 deliverable simply does not appear.
   */
  readonly controlMatrix?: ControlEvalMatrix;
}

function intelligenceStep(move: StrategicMove): TraceStep {
  // The Intelligence -> Move hand-off (GAP-1): a discrete bet-brief
  // artifact that deep-links into the Move. The Move's `linkedEvidence`
  // is the closest joined signal — when an Intelligence-anchored
  // evidence row exists we treat the bet as linked.
  const betEvidence = move.linkedEvidence.find((e) =>
    /pattern|bet|intelligence|signal/i.test(`${e.anchor} ${e.summary}`),
  );
  if (betEvidence) {
    return {
      module: "intelligence",
      moduleLabel: MODULE_LABELS.intelligence,
      artifactKind: "Originating bet / pattern",
      linkState: "linked",
      title: betEvidence.anchor,
      detail: betEvidence.summary,
      joinId: betEvidence.id,
      href: betEvidence.url || null,
      gapRef: null,
      regulatoryDeliverable: null,
    };
  }
  return {
    module: "intelligence",
    moduleLabel: MODULE_LABELS.intelligence,
    artifactKind: "Originating bet / pattern",
    linkState: "not_yet_linked",
    title: "No bet-brief artifact deep-links into this Move",
    detail:
      "The Intelligence pattern-to-Move funnel renders for the tenant, but no discrete bet-brief artifact carries a deep-link into this Move yet.",
    joinId: null,
    href: null,
    gapRef: "GAP-1",
    regulatoryDeliverable: null,
  };
}

/**
 * Resolve the SR 11-7 model-risk control deliverable for the Move step.
 *
 * The deliverable is surfaced only when (a) the tenant is under model-risk
 * supervision — financial services — and (b) the route has shaped the
 * Move's Slice 2.5 control matrix. For a regulated tenant this projects
 * model validation, ongoing monitoring, and governance controls into an
 * explicit, traceable deliverable on the phase trace (closes GAP-3). For
 * a non-regulated tenant, or an unshaped Move, it returns `null` and the
 * deliverable does not appear.
 */
function resolveRegulatoryDeliverable(
  input: CrossModuleTraceInput,
): Sr117ControlDeliverable | null {
  if (!isSr117RegulatedTenant(input.move.tenant.industryCode)) return null;
  if (!input.controlMatrix) return null;
  return buildSr117ControlDeliverable(input.controlMatrix);
}

function moveStep(input: CrossModuleTraceInput): TraceStep {
  const { move } = input;
  // The Move itself is always linked — it is the trace anchor. The
  // detail enumerates the shaping artifacts present on the Move.
  const shaping = move.deliverables.filter((d) =>
    SHAPING_TYPE_KEYS.some((k) => d.typeKey.includes(k)),
  );
  const shapingLabel =
    shaping.length > 0
      ? `${shaping.length} shaping artifact${shaping.length === 1 ? "" : "s"}: ${shaping
          .map((d) => d.title)
          .join(", ")}`
      : "No suitability / decomposition / architecture / controls / mobilization artifact is present yet.";

  const regulatoryDeliverable = resolveRegulatoryDeliverable(input);
  // For a regulated tenant, the SR 11-7 control matrix is a first-class
  // deliverable in the phase trace — append its readiness to the detail
  // so the model-risk gap is legible without opening the deliverable.
  const regulatoryLabel = regulatoryDeliverable
    ? ` ${regulatoryDeliverable.title}: ${regulatoryDeliverable.satisfiedCount}/${regulatoryDeliverable.lines.length} SR 11-7 expectations satisfied (${regulatoryDeliverable.readiness}).`
    : "";

  return {
    module: "move",
    moduleLabel: MODULE_LABELS.move,
    artifactKind: "Move & shaping artifacts",
    linkState: "linked",
    title: `${move.displayCode} · ${move.name}`,
    detail: `${move.phaseLabel} · ${move.status.text}. ${shapingLabel}${regulatoryLabel}`,
    joinId: move.id,
    href: `/strategic-moves/${move.id}`,
    gapRef: null,
    regulatoryDeliverable,
  };
}

function sourceStep(input: CrossModuleTraceInput): TraceStep {
  // The Move -> Source hand-off (GAP-2 / GAP-3): a Source event seeded
  // from the Move. ID-join: source event whose linkedProgramId is the
  // Move id.
  const linked = input.sourceEvents.find(
    (e) => e.linkedProgramId === input.move.id,
  );
  if (linked) {
    return {
      module: "source",
      moduleLabel: MODULE_LABELS.source,
      artifactKind: "Source hand-off / event",
      linkState: "linked",
      title: `${linked.code} · ${linked.name}`,
      detail: `${linked.currentStageLabel} · ${linked.statusLabel}. ${linked.nextAction}`,
      joinId: linked.id,
      href: `/source/events/${linked.id}`,
      gapRef: null,
      regulatoryDeliverable: null,
    };
  }
  return {
    module: "source",
    moduleLabel: MODULE_LABELS.source,
    artifactKind: "Source hand-off / event",
    linkState: "not_yet_linked",
    title: "No Source event is linked to this Move",
    detail:
      "Source brief preparation can be tracked in the Move, but sourcing workflow activation is not configured for this demo Move. No Source event carries this Move as its linked program.",
    joinId: null,
    href: null,
    gapRef: "GAP-2 / GAP-3",
    regulatoryDeliverable: null,
  };
}

function towerStep(input: CrossModuleTraceInput): TraceStep {
  // The Source -> Tower / Tower -> Outcome hand-off (GAP-4 / GAP-5):
  // an outcome-ledger entry for the Move. ID-join: ledger entry whose
  // subjectKind is 'move' and subjectRef is the Move id.
  const ledger = input.outcomeEntries.find(
    (e) => e.subjectKind === "move" && e.subjectRef === input.move.id,
  );
  if (ledger) {
    const note = ledger.note ? ` ${ledger.note}` : "";
    return {
      module: "tower",
      moduleLabel: MODULE_LABELS.tower,
      artifactKind: "Tower outcome-ledger entry",
      linkState: "linked",
      title: ledger.subjectLabel || "Outcome ledger entry",
      detail: `Value rung: ${ledger.valueRung.replace(/_/g, " ")} · governance: ${ledger.governanceReviewStatus.replace(/_/g, " ")}.${note}`,
      joinId: ledger.id,
      href: '/tower',
      gapRef: null,
      regulatoryDeliverable: null,
    };
  }
  return {
    module: "tower",
    moduleLabel: MODULE_LABELS.tower,
    artifactKind: "Tower outcome-ledger entry",
    linkState: "not_yet_linked",
    title: "No outcome-ledger entry records this Move",
    detail:
      "Tower handoff package preparation can be tracked in the Move, but live Tower tracking activation is not configured for this demo Move. The Tower outcome ledger has no projected -> tracked -> verified entry for this Move.",
    joinId: null,
    href: null,
    gapRef: "GAP-4 / GAP-5",
    regulatoryDeliverable: null,
  };
}

/**
 * Join, by ID, the cross-module evidence trail for one Move. Pure and
 * deterministic — same inputs always yield the same trace.
 */
export function buildCrossModuleTrace(
  input: CrossModuleTraceInput,
): CrossModuleTrace {
  const { move } = input;
  const steps: TraceStep[] = [
    intelligenceStep(move),
    moveStep(input),
    sourceStep(input),
    towerStep(input),
  ];

  const linkedCount = steps.filter((s) => s.linkState === "linked").length;
  const unlinkedCount = steps.length - linkedCount;

  // The Move step is always linked (it is the anchor); coherence is a
  // read on the three cross-module hand-offs around it.
  const crossModuleLinked = steps
    .filter((s) => s.module !== "move")
    .filter((s) => s.linkState === "linked").length;
  const crossModuleTotal = steps.length - 1;
  let coherence: CrossModuleTrace["coherence"];
  if (crossModuleLinked === crossModuleTotal) {
    coherence = "coherent";
  } else if (crossModuleLinked === 0) {
    coherence = "unwired";
  } else {
    coherence = "partial";
  }

  return {
    moveId: move.id,
    moveDisplayCode: move.displayCode,
    moveName: move.name,
    tenantName: move.tenant.name,
    steps,
    linkedCount,
    unlinkedCount,
    coherence,
  };
}
