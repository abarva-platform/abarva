import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { WorkspaceExplorer } from "@/components/workspace-explorer/WorkspaceExplorer";
import { getActiveClientRow } from "@/lib/active-client";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";
import {
  listMovesWorkspaceGenerateCandidates,
  listMovesWorkspaceItems,
} from "@/lib/workspace-explorer/moves-adapter";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StrategicMoveWorkspacePage({
  params,
  searchParams,
}: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");

  const { moveId } = await params;
  const sp: Record<string, string | string[] | undefined> =
    (await (searchParams ?? Promise.resolve({}))) ?? {};
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

  const showGenerateIntent = sp.intent === "generate";
  const items = await listMovesWorkspaceItems(ctx, move.id);
  const generateCandidates =
    showGenerateIntent || items.length === 0
      ? listMovesWorkspaceGenerateCandidates(move)
      : [];

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
        generateIntent={
          showGenerateIntent
            ? {
                module: "moves",
                eventId: move.id,
                candidates: generateCandidates,
              }
            : undefined
        }
      />
    </AppShell>
  );
}
