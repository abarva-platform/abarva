// Pure model for the Source Approvals ledger — no I/O, no Clerk import, so
// it can be imported by UI tests and client components without pulling in
// server-only dependencies. See approval-ledger.ts for the loader that
// resolves real data through this model.
//
// Honesty invariant: a past stage's "approved" status is derived purely
// from stage position vs. current_stage_key (always reliable — gate
// advancement always requires approval). The approver name/timestamp is a
// real enrichment from source_event_approvals rows with a matching
// stage_key, and is null (never guessed) when no matching row exists —
// see the migration 20260721142419_source_event_approvals_stage_key.sql
// for why older rows can be missing it.

import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";

export interface ApprovalLedgerStageLike {
  key: SourceStageKey;
  label?: string | null;
}

export interface ApprovalLedgerRow {
  stageKey: SourceStageKey;
  stageLabel: string;
  index: number;
  state: "approved" | "current" | "locked";
  /** Real resolved name, or null if no matching stage_key row was found. */
  approverName: string | null;
  approvedAtIso: string | null;
  /** Plain-language authorization statement for current/locked stages. */
  authorizationNote: string;
  /** Human rationale captured on the append-only approval record. */
  approverRationale: string | null;
}

export interface ApprovalRowLike {
  stage_key: string | null;
  approved_by_user_id: string;
  action: string;
  created_at: string;
  notes?: string | null;
}

const APPROVED_ACTIONS = new Set(["admin_review", "stage_advance"]);

/** Pure: compose the approval ledger for the event's resolved journey. */
export function buildApprovalLedger(args: {
  currentStageKey: string | null;
  approvalRows: ApprovalRowLike[];
  approverNames: ReadonlyMap<string, string>;
  stages?: readonly ApprovalLedgerStageLike[];
}): ApprovalLedgerRow[] {
  const stages =
    args.stages && args.stages.length > 0
      ? args.stages
      : SOURCE_STAGE_ORDER.map((key) => ({
          key,
          label: SOURCE_STAGE_LABELS[key],
        }));
  const stageKeys = stages.map((stage) => stage.key);
  const currentIndex = stageKeys.indexOf(
    args.currentStageKey as SourceStageKey,
  );

  // Most recent matching, approved row per stage_key (last one wins if a
  // stage was approved more than once, e.g. after a send-back).
  const latestByStage = new Map<string, ApprovalRowLike>();
  for (const row of args.approvalRows) {
    if (!row.stage_key || !APPROVED_ACTIONS.has(row.action)) continue;
    const existing = latestByStage.get(row.stage_key);
    if (!existing || row.created_at > existing.created_at) {
      latestByStage.set(row.stage_key, row);
    }
  }

  return stages.map((stage, index) => {
    const stageKey = stage.key;
    const state: ApprovalLedgerRow["state"] =
      currentIndex < 0
        ? "locked"
        : index < currentIndex
          ? "approved"
          : index === currentIndex
            ? "current"
            : "locked";

    const matched = latestByStage.get(stageKey) ?? null;
    const approverName = matched
      ? (args.approverNames.get(matched.approved_by_user_id) ??
        "Unknown approver")
      : null;

    const authorizationNote =
      state === "approved"
        ? approverName
          ? `Approved by ${approverName}.`
          : "Approved — approver not recorded for this stage (predates stage-level tracking)."
        : state === "current"
          ? "Any client admin can approve this gate."
          : "Locked until the current stage gate is approved.";

    return {
      stageKey,
      stageLabel: stage.label ?? SOURCE_STAGE_LABELS[stageKey] ?? stageKey,
      index: index + 1,
      state,
      approverName,
      approvedAtIso: matched?.created_at ?? null,
      authorizationNote,
      approverRationale: matched?.notes?.trim() || null,
    };
  });
}
