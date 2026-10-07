// Load a Move's confirmed solution route for a read-only surface.
//
// The route is not a column. It is derived from two capture answers — the P1
// business-change assessment and the P2 route validation — plus the approved P2
// evidence the validation cites, and `resolveConfirmedSolutionRoute` returns
// null unless all three agree (see that module for the refusals).
//
// The phase workspace and the gate evaluator each already assemble those inputs
// as part of a larger read. A read-only surface that needs nothing else from
// that read should not have to restate the assembly, so it lives here once.
//
// Best-effort by construction: every failure resolves to null, which every
// caller must treat as "not narrowed" — the full canonical set — and never as
// "narrowed to nothing".
//
// Fencing: `program_modules` carries no tenant column — it is scoped through
// `engagement_id -> engagements` — so the Move id is the only fence available
// and is the same one the gate evaluator's read of this table uses. The caller
// is expected to have authorized the Move already; `ctx` is passed because the
// approved-evidence read IS tenant-keyed. Nothing read here is rendered: the
// capture text is parsed into a route object or discarded.

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "./types.db";
import { listApprovedPhaseEvidence } from "./approved-phase-evidence";
import {
  resolveConfirmedSolutionRoute,
  type ConfirmedSolutionRoute,
} from "./solution-route-assessment";

interface CaptureModuleRow {
  module_key: string;
  state_jsonb?: Record<string, unknown> | null;
}

/** The capture answer stored for `phase_<n>_<key>`, or "" when absent. */
export function captureValueFromModuleRows(
  rows: readonly CaptureModuleRow[],
  phase: number,
  key: string,
): string {
  const row = rows.find((item) => item.module_key === `phase_${phase}_${key}`);
  const value = row?.state_jsonb?.value;
  return typeof value === "string" ? value : "";
}

/**
 * The route this Move has recorded, or null when it has not recorded one (or
 * when the recorded one does not resolve).
 */
export async function loadMoveConfirmedSolutionRoute(
  ctx: TenancyCtx,
  moveId: string,
): Promise<ConfirmedSolutionRoute | null> {
  try {
    const db = getAzureWriteFluentClient();
    const [{ data: modules }, approvedEvidence] = await Promise.all([
      db
        .from("program_modules")
        .select("module_key, state_jsonb")
        .eq("engagement_id", moveId),
      listApprovedPhaseEvidence(ctx, moveId, 2).catch(() => []),
    ]);
    const rows = (modules as CaptureModuleRow[] | null) ?? [];
    return resolveConfirmedSolutionRoute({
      businessChangeAssessment: captureValueFromModuleRows(
        rows,
        1,
        "business_change_assessment",
      ),
      routeValidation: captureValueFromModuleRows(
        rows,
        2,
        "solution_route_validation",
      ),
      approvedEvidenceReferences: approvedEvidence.map(
        (item) => item.evidenceId,
      ),
    });
  } catch {
    return null;
  }
}
