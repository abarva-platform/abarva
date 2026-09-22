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
import { readSourceIntakeRequestQueue } from "@/lib/source/intake/servicenow-sourcing-request-repository";
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
    const { status, importedRequests, eventWorkspaces } =
      await loadRequestFirstWorkspace(clientKey);
    return (
      <SourceNewRequestFirstPage
        clientName={activeClientDisplayName}
        clientKey={clientOption.id}
        requestQueueStatus={status}
        importedRequests={importedRequests}
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

async function loadRequestFirstWorkspace(clientKey: string | null): Promise<{
  status: SourceNewRequestQueueStatus;
  importedRequests: Awaited<
    ReturnType<typeof readSourceIntakeRequestQueue>
  >["requests"];
  eventWorkspaces: SourceNewEventWorkspaceSummary[];
}> {
  if (!clientKey) {
    return {
      status: "unauthorized",
      importedRequests: [],
      eventWorkspaces: [],
    };
  }
  const [requestRead, events] = await Promise.all([
    readSourceIntakeRequestQueue(clientKey),
    listSourcingEvents().catch(() => null),
  ]);
  if (!events) {
    return {
      status: "unavailable",
      importedRequests: [],
      eventWorkspaces: [],
    };
  }
  return {
    status: !requestRead.registryAvailable
      ? "unavailable"
      : requestRead.requests.length > 0
        ? "loaded"
        : "empty",
    importedRequests: requestRead.registryAvailable ? requestRead.requests : [],
    eventWorkspaces: events.map((event) => ({
      id: event.id,
      code: event.code,
      name: event.name,
      currentStageLabel: event.currentStageLabel,
      lifecycleLabel: event.statusLabel,
      lifecycle: event.status,
      trigger: event.triggerDescription ?? null,
      scope: event.scopeDescription ?? null,
      decisionOwner: event.decisionOwner ?? null,
      href: `/source/new/${encodeURIComponent(event.id)}`,
    })),
  };
}
