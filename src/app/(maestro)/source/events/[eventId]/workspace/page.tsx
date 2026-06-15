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
  const showUploadIntent = sp.intent === "upload";
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
        uploadIntent={
          showUploadIntent
            ? {
                module: "source",
                eventId: event.id,
                stageKey: stageKey ?? event.currentStageKey,
                uploadHref: `/api/v1/source/${encodeURIComponent(
                  event.id,
                )}/artifacts/upload`,
                acceptedFormats:
                  ".pdf,.docx,.xlsx,.pptx,.md,.markdown,.csv,.txt,.html,image/png,image/jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/markdown,text/csv,text/plain,text/html",
                defaultClassification: "Confidential",
                classificationOptions: [
                  "Public",
                  "Internal",
                  "Confidential",
                  "Restricted",
                ],
                defaultFamily: "other",
                familyOptions: [
                  { value: "other", label: "Evidence or context" },
                  { value: "sourcing_strategy", label: "Strategy evidence" },
                  { value: "scope_document", label: "Scope evidence" },
                  { value: "rfp", label: "RFP or addendum" },
                  { value: "proposal", label: "Vendor response" },
                  { value: "scorecard", label: "Evaluation scorecard" },
                  { value: "pricing_workbook", label: "Pricing workbook" },
                  { value: "bafo", label: "BAFO evidence" },
                  { value: "decision_brief", label: "Decision evidence" },
                  { value: "value_ledger", label: "Value evidence" },
                ],
              }
            : undefined
        }
      />
    </AppShell>
  );
}
