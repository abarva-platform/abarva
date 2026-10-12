import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { getProgramById } from "@/lib/programs/queries";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { P5_TOWER_HANDOFF_FLAG } from "@/lib/programs/p5-measurement-plan";
import { stepPageHref } from "@/lib/programs/step-page-views";
import { P5TowerPublicationReadback } from "@/components/strategic-moves/step-page/P5TowerHandoff";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Move planned Tower handoff · AbarVa" };

export default async function MoveTowerHandoffPage({
  params,
}: {
  params: Promise<{ moveId: string }>;
}) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");
  const { moveId } = await params;
  if (
    !isStrategicMoveRouteId(moveId) ||
    isFeatureEnabled(ctx, P5_TOWER_HANDOFF_FLAG) !== true
  )
    notFound();
  const move = await getProgramById(ctx, moveId);
  if (!move || move.clientId !== ctx.clientId) notFound();
  const policy = await loadUserProgramAccessPolicy(ctx, { programId: moveId });
  if (
    !policy.canViewFinancialData ||
    (policy.programIdsAllowed && !policy.programIdsAllowed.includes(moveId))
  )
    notFound();
  return (
    <AppShell
      surface="programs-detail"
      topBarProps={{ context: "Move planned Tower handoff", showLocked: true }}
    >
      <h1 className="sr-only">Move planned Tower handoff</h1>
      <P5TowerPublicationReadback key={moveId} moveId={moveId} />
      <a href={stepPageHref(moveId, 5, "P5.4")}>Return to P5 acceptance</a>
    </AppShell>
  );
}
