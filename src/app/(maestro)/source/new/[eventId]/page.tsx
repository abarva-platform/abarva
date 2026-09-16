import { notFound } from "next/navigation";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";
import { SourceNewWorkspace } from "@/components/source/new-workspace/SourceNewWorkspace";
import type { SourceNewFileRow, SourceNewFilePhase } from "@/components/source/new-workspace/SourceNewFiles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Source New · AbarVa" };

function filePhase(row: SourceArtifactRecord): SourceNewFilePhase | null {
  const stage = row.sourcingStage?.toLowerCase() ?? "";
  if (row.artifactType.toLowerCase().includes("nda")) return "suppliers";
  if (stage === "intake") return "request";
  if (stage === "strategy" || stage === "sourcing_strategy" || stage === "scope") return "define";
  if (stage === "rfp" || stage === "rfp_rfi_package") return "rfi";
  return null;
}

export default async function SourceNewEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [activeClient, tenancy] = await Promise.all([
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  if (!activeClient || !tenancy || canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey)) notFound();

  const event = await getSourcingEventForResolvedClient(eventId, {
    activeClientKey: activeClient.key,
    activeClientName: activeClient.name,
    tenancy,
  });
  if (!event) notFound();

  const files: SourceNewFileRow[] = activeClient.id
    ? (await listSourceArtifacts(event.id, activeClient.id, { includeHistory: true }))
        .flatMap((artifact) => {
          const phase = filePhase(artifact);
          if (!phase || canonicalTenantKey(artifact.tenantKey) !== canonicalTenantKey(activeClient.key)) return [];
          return [{
            id: artifact.id,
            artifactGroup: artifact.artifactGroup,
            artifactType: artifact.artifactType,
            title: artifact.title,
            fileName: artifact.fileName,
            fileFormat: artifact.fileFormat,
            fileSize: artifact.fileSize,
            version: artifact.version,
            status: artifact.status,
            lifecycleState: artifact.lifecycleState,
            generatedAt: artifact.generatedAt,
            generatedBy: artifact.generatedBy,
            sourceBasis: artifact.sourceBasis,
            blobSha256: artifact.blobSha256,
            approvalState: artifact.approvalState,
            approvedBy: artifact.approvedBy,
            approvedAt: artifact.approvedAt,
            phase,
          }];
        })
    : [];

  return (
    <SourceNewWorkspace
      event={{
        id: event.id,
        code: event.code,
        name: event.name,
        clientName: activeClient.name,
        clientKey: activeClient.key,
        eventType: event.eventType ?? event.archetype,
        category: event.classifiedCategory ?? null,
        currentStage: event.currentStageKey,
        lifecycle: event.status,
        trigger: event.triggerDescription ?? null,
        scope: event.scopeDescription ?? null,
        decisionOwner: event.decisionOwner ?? null,
      }}
      files={files}
    />
  );
}
