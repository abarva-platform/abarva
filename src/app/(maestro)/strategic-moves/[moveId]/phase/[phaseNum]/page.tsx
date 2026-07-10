import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { MovesPhaseStandaloneClient } from "@/components/strategic-moves/MovesPhaseStandaloneClient";
import {
  isStrategicMoveRouteId,
  parseStrategicMovePhaseNum,
} from "@/lib/programs/strategic-move-route-params";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  buildMoveEvidenceNeedPackets,
  type MoveEvidenceNeedPacket,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getMovePhaseTallies } from "@/lib/programs/phase-explorer-tallies";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string; phaseNum: string }>;
}

export default async function StrategicMovePhaseWorkspacePage({
  params,
}: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect("/sign-in");
  }

  const { moveId, phaseNum } = await params;
  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const parsedPhase = parseStrategicMovePhaseNum(phaseNum);
  if (parsedPhase === null) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  // State reconciliation: current_phase is the single source of truth for where
  // the Move actually is. A user must not work a phase ahead of it (e.g. open
  // /phase/1 while P0 is still awaiting the brief approval), or the workspace
  // would contradict the Overview/Documents/File Cabinet. Redirect forward-
  // looking requests back to the true current phase.
  const currentPhase = move.currentPhase ?? 0;
  if (parsedPhase > currentPhase) {
    // Carry the reason as a query param — a silent redirect here reads as a
    // broken link (bookmarked/shared URLs to a future phase would otherwise
    // land the user somewhere else with zero explanation). StrategicMove-
    // PhaseClient reads this to show a one-time dismissible banner.
    redirect(
      `/strategic-moves/${moveId}/phase/${currentPhase}?phaseLocked=${parsedPhase}`,
    );
  }

  let evidenceNeedPackets: MoveEvidenceNeedPacket[] = [];
  try {
    const tctx = await requireTenancy();
    const evidenceReadiness = await loadDiscoveryEvidenceReadiness(tctx, moveId);
    evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: move.name,
      currentPhase: parsedPhase,
      readiness: evidenceReadiness,
    });
  } catch {
    evidenceNeedPackets = [];
  }

  return (
    <MovesPhaseStandaloneClient
      evidenceNeedPackets={evidenceNeedPackets}
      move={move}
      phaseNum={parsedPhase}
      phaseTallies={getMovePhaseTallies(move)}
    />
  );
}
