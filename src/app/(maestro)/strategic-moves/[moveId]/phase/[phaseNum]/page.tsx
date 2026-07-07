import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { AppShell } from "@/components/shell/AppShell";
import { StrategicMovePhaseClient } from "@/components/strategic-moves/StrategicMovePhaseClient";
import {
  isStrategicMoveRouteId,
  parseStrategicMovePhaseNum,
} from "@/lib/programs/strategic-move-route-params";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
  type ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  buildMoveEvidenceNeedPackets,
  type MoveEvidenceNeedPacket,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import {
  buildCurrentStateRecommendation,
  type CurrentStateRecommendation,
} from "@/lib/programs/current-state-maturity";
import {
  buildCurrentStatePlan,
  type CurrentStatePlan,
} from "@/lib/programs/current-state-plan";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";

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
    redirect(`/strategic-moves/${moveId}/phase/${currentPhase}`);
  }

  // Estate-derived current-state readiness for this phase (best-effort; never
  // blocks the workspace render).
  let readiness: ReadinessReport | null = null;
  let recommendation: CurrentStateRecommendation | null = null;
  let plan: CurrentStatePlan | null = null;
  let evidenceNeedPackets: MoveEvidenceNeedPacket[] = [];
  try {
    const tctx = await requireTenancy();
    // Archetype resolved from the Move's own row — never a hardcoded default.
    const archetype = resolveProgramArchetype({
      archetype: move.archetype,
      classification: (move.charter as { classification?: string } | null)
        ?.classification,
      name: move.name,
    });
    const profile = await inferMoveProfile(tctx);
    readiness = await resolveCurrentStateReadiness(
      tctx,
      archetype,
      profile,
      parsedPhase,
      moveId,
    );
    recommendation = await buildCurrentStateRecommendation(tctx, profile);
    plan = buildCurrentStatePlan(recommendation, { moveName: move.name });
    const evidenceReadiness = await loadDiscoveryEvidenceReadiness(tctx, moveId);
    evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: move.name,
      currentPhase: parsedPhase,
      readiness: evidenceReadiness,
    });
  } catch {
    readiness = null;
    recommendation = null;
    plan = null;
    evidenceNeedPackets = [];
  }

  return (
    <AppShell surface="programs-detail">
      <StrategicMovePhaseClient
        move={move}
        phaseNum={parsedPhase}
        readiness={readiness}
        recommendation={recommendation}
        plan={plan}
        evidenceNeedPackets={evidenceNeedPackets}
      />
    </AppShell>
  );
}
