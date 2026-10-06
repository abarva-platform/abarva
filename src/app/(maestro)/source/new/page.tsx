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
import {
  readServiceNowRequestDisposition,
  readServiceNowRequestDispositions,
} from "@/lib/source/intake/servicenow-request-event-authority";
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
    requestId?: string;
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
    const { status, importedRequests, eventWorkspaces, requestDispositions, dispositionStatus } =
      await loadRequestFirstWorkspace(clientKey);
    return (
      <SourceNewRequestFirstPage
        clientName={activeClientDisplayName}
        clientKey={clientOption.id}
        requestQueueStatus={status}
        importedRequests={importedRequests}
        eventWorkspaces={eventWorkspaces}
        requestDispositions={requestDispositions}
        dispositionStatus={dispositionStatus}
      />
    );
  }

  const sourceRequest = params.requestId
    ? await readSourceIntakeRequestQueue(clientKey ?? "").then((read) =>
        read.registryAvailable
          ? (read.requests.find(
              (request) => request.requestId === params.requestId,
            ) ?? null)
          : null,
      )
    : null;
  if (params.requestId && !sourceRequest) {
    redirect("/source/new");
  }
  const sourceRequestDisposition = sourceRequest
    ? await readServiceNowRequestDisposition({
        tenantKey: clientKey ?? "",
        requestId: sourceRequest.requestId,
        sourceVersion: sourceRequest.sourceVersion,
      }).catch(() => null)
    : null;

  return (
    <SourceOriginatePage
      clientName={activeClientDisplayName}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
      sourceRequest={sourceRequest}
      sourceRequestDisposition={sourceRequestDisposition?.disposition_state ?? null}
    />
  );
}

async function loadRequestFirstWorkspace(clientKey: string | null): Promise<{
  status: SourceNewRequestQueueStatus;
  importedRequests: Awaited<
    ReturnType<typeof readSourceIntakeRequestQueue>
  >["requests"];
  eventWorkspaces: SourceNewEventWorkspaceSummary[];
  requestDispositions: Array<{
    requestId: string;
    sourceVersion: string;
    state: "accepted" | "returned" | "merged" | "declined";
    rationale: string | null;
    survivingRequestId: string | null;
  }>;
  dispositionStatus: "available" | "unavailable";
}> {
  if (!clientKey) {
    return {
      status: "unauthorized",
      importedRequests: [],
      eventWorkspaces: [],
      requestDispositions: [],
      dispositionStatus: "unavailable",
    };
  }
  const [requestRead, events] = await Promise.all([
    readSourceIntakeRequestQueue(clientKey),
    listSourcingEvents().catch(() => null),
  ]);
  const dispositionRead = requestRead.registryAvailable
    ? await readServiceNowRequestDispositions(clientKey)
        .then((rows) => ({ available: true as const, rows }))
        .catch(() => ({ available: false as const, rows: [] }))
    : { available: false as const, rows: [] };
  return {
    status: !requestRead.registryAvailable
      ? "unavailable"
      : requestRead.requests.length > 0
        ? "loaded"
        : "empty",
    importedRequests: requestRead.registryAvailable ? requestRead.requests : [],
    dispositionStatus: dispositionRead.available ? "available" : "unavailable",
    requestDispositions: dispositionRead.rows.map((row) => ({
      requestId: row.request_id,
      sourceVersion: row.source_version,
      state: row.disposition_state,
      rationale: row.rationale,
      survivingRequestId: row.surviving_request_id,
    })),
    eventWorkspaces: (events ?? []).map((event) => ({
      id: event.id,
      code: event.code,
      name: event.name,
      currentStageKey: event.currentStageKey,
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
