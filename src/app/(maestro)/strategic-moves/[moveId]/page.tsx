import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string }>;
}

export default async function StrategicMoveDetailRedirectPage({ params }: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");

  const { moveId } = await params;
  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  redirect(`/strategic-moves/${move.id}/phase/${move.currentPhase ?? 0}`);
}
