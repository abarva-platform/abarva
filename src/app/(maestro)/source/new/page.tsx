import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  canonicalClientDisplayName,
  getClientOption,
} from "@/lib/client-config";
import { SourceOriginatePage } from "@/components/source/SourceOriginatePage";
import {
  SourceNewRequestFirstPage,
  type SourceNewEventWorkspaceSummary,
  type SourceNewRequestQueueStatus,
} from "@/components/source/new-workspace/SourceNewRequestFirstPage";
import { buildSourceOptimizeContractHref } from "@/lib/source/optimize-routing";
import { listSourcingEvents } from "@/lib/source/queries";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export const metadata: Metadata = { title: "Source Requests · AbarVa" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    intent?: string;
    contractId?: string;
    opportunityId?: string;
    mode?: string;
  }>;
}) {
  const tenant = await resolveTenant().catch(() => null);
  const params = await searchParams;
  if (params.intent === "contract-optimization") {
    redirect(buildSourceOptimizeContractHref(params));
  }
  const clientKey = tenant?.appClientKey ?? null;
  const clientOption = getClientOption(clientKey);
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: clientKey,
      name: tenant?.displayName,
    }) ?? clientOption.name;

  if (params.mode !== "intake" && !params.intent) {
    const { status, eventWorkspaces } = await loadRequestFirstWorkspace(
      Boolean(tenant),
    );
    return (
      <SourceNewRequestFirstPage
        clientName={activeClientDisplayName}
        clientKey={clientOption.id}
        requestQueueStatus={status}
        eventWorkspaces={eventWorkspaces}
      />
    );
  }

  return (
    <SourceOriginatePage
      clientName={activeClientDisplayName}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
    />
  );
}

async function loadRequestFirstWorkspace(hasTenant: boolean): Promise<{
  status: SourceNewRequestQueueStatus;
  eventWorkspaces: SourceNewEventWorkspaceSummary[];
}> {
  if (!hasTenant) {
    return { status: "unauthorized", eventWorkspaces: [] };
  }
  const events = await listSourcingEvents().catch(() => null);
  if (!events) {
    return { status: "unavailable", eventWorkspaces: [] };
  }
  return {
    status: "empty",
    eventWorkspaces: events.map((event) => ({
      id: event.id,
      code: event.code,
      name: event.name,
      currentStageLabel: event.currentStageLabel,
      lifecycleLabel: event.statusLabel,
      href: `/source/new/${encodeURIComponent(event.id)}`,
    })),
  };
}
