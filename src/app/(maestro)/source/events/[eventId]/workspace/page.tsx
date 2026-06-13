import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { WorkspaceExplorer } from "@/components/workspace-explorer/WorkspaceExplorer";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { getSourcingEvent } from "@/lib/source/queries";
import {
  listSourceWorkspaceGenerateCandidates,
  listSourceWorkspaceItems,
} from "@/lib/workspace-explorer/source-adapter";

export const dynamic = "force-dynamic";

export default async function SourceEventWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp: Record<string, string | string[] | undefined> =
    (await (searchParams ?? Promise.resolve({}))) ?? {};
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

  const stageParam = typeof sp.stage === "string" ? sp.stage : null;
  const stageKey = stageParam ? normalizeSourceStageKey(stageParam) : null;
  const showGenerateIntent = sp.intent === "generate";
  const [items, generateCandidates] = await Promise.all([
    listSourceWorkspaceItems(event.id),
    showGenerateIntent
      ? listSourceWorkspaceGenerateCandidates({
          sourceEventId: event.id,
          stageKey,
        })
      : Promise.resolve([]),
  ]);
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
        generateIntent={
          showGenerateIntent
            ? {
                module: "source",
                eventId: event.id,
                stageKey,
                candidates: generateCandidates,
              }
            : undefined
        }
      />
    </AppShell>
  );
}
