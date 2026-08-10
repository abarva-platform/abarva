// Source Approvals inbox — "everything waiting on you", in one place.
//
// The approval experience was scattered: intake approvals only appeared when you
// happened to click a pending event, and stage approvals lived three layers deep in the
// canvas (Next Move card → Gate tab → per-criterion actions → promotion reason). This
// builds the single inbox: every event waiting for intake approval, and every active
// event's current gate with its readiness — each with one obvious destination.
//
// Pure builder (testable) + a thin loader over the existing read adapters.

import { selectSourceEventsReadAdapter } from "@/lib/data-plane/read-adapters/sourceEventsReadAdapter";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";

export interface ApprovalsInboxItem {
  kind: "intake_approval" | "stage_gate";
  eventId: string;
  eventCode: string;
  eventName: string;
  /** plain-English line: what the approver is being asked to do. */
  ask: string;
  /** plain-English readiness, e.g. "2 of 3 gate items met". */
  readiness: string;
  /** 'ready' = approve now · 'ready_with_gaps' = approvable with rationale · 'waiting' = items open */
  status: "ready" | "ready_with_gaps" | "waiting";
  stageKey: string | null;
  stageLabel: string | null;
  estimatedValueUsd: number | null;
  /** the ONE place to go. */
  href: string;
  actionLabel: string;
}

export interface ApprovalsInbox {
  items: ApprovalsInboxItem[];
  intakeCount: number;
  gateReadyCount: number;
}

interface EventRowLike {
  id: string;
  event_code: string;
  event_name: string;
  current_stage_key: string;
  lifecycle_state: string;
  estimated_value_usd: number | null;
}

interface CriterionRowLike {
  source_event_id: string;
  from_stage: string;
  state: string;
}

/** Pure: compose the inbox from raw rows. */
export function buildApprovalsInbox(args: {
  pendingEvents: EventRowLike[];
  activeEvents: EventRowLike[];
  criterionRows: CriterionRowLike[];
}): ApprovalsInbox {
  const items: ApprovalsInboxItem[] = [];

  // 1 · intake approvals — the event cannot start until a named person approves.
  for (const e of args.pendingEvents) {
    items.push({
      kind: "intake_approval",
      eventId: e.id,
      eventCode: e.event_code,
      eventName: e.event_name,
      ask: "Approve the event intake to unlock the working canvas.",
      readiness: "Review the five captured facts, add your rationale, approve.",
      status: "ready",
      stageKey: null,
      stageLabel: null,
      estimatedValueUsd: e.estimated_value_usd,
      href: `/source/events/${e.id}/approval`,
      actionLabel: "Review & approve",
    });
  }

  // 2 · stage gates — every active event's current stage, with honest readiness.
  const byEvent = new Map<string, CriterionRowLike[]>();
  for (const row of args.criterionRows) {
    const list = byEvent.get(row.source_event_id) ?? [];
    list.push(row);
    byEvent.set(row.source_event_id, list);
  }
  for (const e of args.activeEvents) {
    if (e.lifecycle_state === "waiting_on_client") continue; // shown as intake above
    const stageRows = (byEvent.get(e.id) ?? []).filter(
      (r) => r.from_stage === e.current_stage_key,
    );
    if (stageRows.length === 0) continue; // no gate defined → nothing to approve
    const met = stageRows.filter(
      (r) => r.state === "met" || r.state === "waived",
    ).length;
    const total = stageRows.length;
    const stageLabel =
      SOURCE_STAGE_LABELS[e.current_stage_key as SourceStageKey] ??
      e.current_stage_key;
    const status: ApprovalsInboxItem["status"] =
      met === total ? "ready" : "ready_with_gaps";
    items.push({
      kind: "stage_gate",
      eventId: e.id,
      eventCode: e.event_code,
      eventName: e.event_name,
      ask: `Approve advancing out of ${stageLabel}.`,
      readiness:
        met === total
          ? `All ${total} gate items met — ready to approve.`
          : `${met} of ${total} gate items met — you can approve with gaps (rationale required) or wait.`,
      status,
      stageKey: e.current_stage_key,
      stageLabel,
      estimatedValueUsd: e.estimated_value_usd,
      href: `/source/events/${e.id}?stage=${encodeURIComponent(e.current_stage_key)}&workspace=approvals`,
      actionLabel: met === total ? "Approve now" : "Review & decide",
    });
  }

  // intake first (blocks everything), then ready gates, then gates with gaps.
  const rank = (i: ApprovalsInboxItem) =>
    i.kind === "intake_approval" ? 0 : i.status === "ready" ? 1 : 2;
  items.sort((a, b) => rank(a) - rank(b));

  return {
    items,
    intakeCount: args.pendingEvents.length,
    gateReadyCount: items.filter(
      (i) => i.kind === "stage_gate" && i.status === "ready",
    ).length,
  };
}

/** Load the inbox for a tenant via the existing read adapters. */
export async function loadApprovalsInbox(
  clientKey: string,
  db = getAzureWriteFluentClient(),
): Promise<ApprovalsInbox> {
  const adapter = selectSourceEventsReadAdapter(undefined, clientKey);
  const [pendingEvents, activeEvents] = await Promise.all([
    adapter.getPendingEventsForClient(clientKey),
    adapter.getActiveEventsForClient(clientKey),
  ]);
  const eventIds = activeEvents.map((e) => e.id);
  let criterionRows: CriterionRowLike[] = [];
  if (eventIds.length > 0) {
    const { data, error } = await db
      .from("source_event_gate_criterion_states")
      .select("source_event_id, from_stage, state")
      .in("source_event_id", eventIds);
    if (!error && Array.isArray(data))
      criterionRows = data as CriterionRowLike[];
  }
  return buildApprovalsInbox({
    pendingEvents: pendingEvents as EventRowLike[],
    activeEvents: activeEvents as EventRowLike[],
    criterionRows,
  });
}
