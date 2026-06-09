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

  return (
    <AppShell surface="programs-detail">
      <StrategicMovePhaseClient move={move} phaseNum={parsedPhase} />
    </AppShell>
  );
}
