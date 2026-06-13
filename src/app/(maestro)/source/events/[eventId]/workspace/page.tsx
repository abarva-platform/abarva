import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { WorkspaceExplorer } from "@/components/workspace-explorer/WorkspaceExplorer";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getSourcingEvent } from "@/lib/source/queries";
import { listSourceWorkspaceItems } from "@/lib/workspace-explorer/source-adapter";

export const dynamic = "force-dynamic";

export default async function SourceEventWorkspacePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [event, activeClient] = await Promise.all([
    getSourcingEvent(eventId),
    getActiveClientRow().catch(() => null),
  ]);
  if (!event) notFound();

  const enabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? null,
      clientId: activeClient?.id ?? null,
    },
    "workspace_explorer_source",
  );
  if (!enabled) notFound();

  const items = await listSourceWorkspaceItems(event.id);
  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? event.accountName;

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `Source · ${event.name} · Workspace`,
      }}
      subNav={<SourceSubNav />}
    >
      <WorkspaceExplorer
        eyebrow={`${event.code} · Source workspace`}
        title={event.name}
        backHref={`/source/events/${eventId}`}
        items={items}
      />
    </AppShell>
  );
}
