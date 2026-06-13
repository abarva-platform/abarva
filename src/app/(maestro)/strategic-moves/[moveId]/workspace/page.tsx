import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { WorkspaceExplorer } from "@/components/workspace-explorer/WorkspaceExplorer";
import { getActiveClientRow } from "@/lib/active-client";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";
import { listMovesWorkspaceItems } from "@/lib/workspace-explorer/moves-adapter";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string }>;
}

export default async function StrategicMoveWorkspacePage({ params }: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");

  const { moveId } = await params;
  if (!isStrategicMoveRouteId(moveId)) notFound();

  const activeClient = await getActiveClientRow().catch(() => null);
  const enabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? ctx.clientKey ?? null,
      clientId: activeClient?.id ?? ctx.clientId ?? null,
    },
    "workspace_explorer_moves",
  );
  if (!enabled) notFound();

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  const items = await listMovesWorkspaceItems(ctx, move.id);

  return (
    <AppShell
      surface="programs-detail"
      topBarProps={{
        tenantName: move.tenant.name,
        showLocked: true,
        context: `Moves · ${move.name} · Workspace`,
      }}
    >
      <WorkspaceExplorer
        eyebrow={`${move.displayCode} · Moves workspace`}
        title={move.name}
        backHref={`/strategic-moves/${move.id}`}
        items={items}
      />
    </AppShell>
  );
}
