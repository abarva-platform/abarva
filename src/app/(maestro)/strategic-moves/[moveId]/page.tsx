import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import {
  getModuleState,
  getPhaseSnapshots,
  getStrategicMoveById,
} from "@/lib/programs/queries";
import { snapshotsApprovePhase } from "@/lib/programs/approved-gate-phases";
import {
  detectPhaseCatchUp,
  firstCatchUpHref,
} from "@/lib/programs/phase-catch-up";
import { phaseCaptureModuleKey } from "@/lib/programs/phase-capture-contract";
import { getMovePhaseTallies } from "@/lib/programs/phase-explorer-tallies";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string }>;
}

export default async function StrategicMoveDetailRedirectPage({
  params,
}: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");

  const { moveId } = await params;
  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  const catchUpEnabled =
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_step_pages_catch_up_v1",
    ) &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_step_pages_v3",
    ) &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_capture_v2",
    );
  if (catchUpEnabled && (move.currentPhase ?? 0) > 2) {
    // A failed read is unknown, never an empty record to act on.
    const [modules, snapshots] = await Promise.all([
      getModuleState(ctx, move.id).catch(() => null),
      getPhaseSnapshots(ctx, move.id, 2).catch(() => null),
    ]);
    if (modules) {
      const rootRow = modules.find(
        (row) => row.moduleKey === phaseCaptureModuleKey(2, "gaps_root_causes"),
      );
      const catchUp = detectPhaseCatchUp({
        moveId: move.id,
        phase: 2,
        currentPhase: move.currentPhase ?? 0,
        terminalComplete: move.terminalComplete,
        gatePassed: getMovePhaseTallies(move).some(
          (row) => row.phase === 2 && row.state === "done",
        ),
        gateRecordConfirmed: snapshotsApprovePhase(snapshots, 2),
        rootCauses:
          typeof rootRow?.state?.value === "string" ? rootRow.state.value : "",
      });
      const first = firstCatchUpHref(catchUp ? [catchUp] : []);
      if (first) redirect(first);
    }
  }

  redirect(`/strategic-moves/${move.id}/phase/${move.currentPhase ?? 0}`);
}
