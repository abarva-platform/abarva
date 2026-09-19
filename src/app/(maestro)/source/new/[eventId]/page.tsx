import { notFound } from "next/navigation";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { SourceNewWorkspace } from "@/components/source/new-workspace/SourceNewWorkspace";
import type { SourceNewFileRow } from "@/components/source/new-workspace/SourceNewFiles";
import { listSourceEventActivityEntries } from "@/lib/source/activity-log";
import { sourceNewFilePhase } from "@/lib/source/new-workspace/phase-state";
import { readSourceEventAuthority } from "@/lib/source/new-workspace/event-authority";
import { buildSourceNewEventIntelligence } from "@/lib/source/new-workspace/event-intelligence";

export const dynamic = "force-dynamic";
export const metadata = { title: "Source New · AbarVa" };

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
  if (
    !activeClient ||
    !tenancy ||
    canonicalTenantKey(activeClient.key) !==
      canonicalTenantKey(tenancy.clientKey)
  )
    notFound();

  const event = await getSourcingEventForResolvedClient(eventId, {
    activeClientKey: activeClient.key,
    activeClientName: activeClient.name,
    tenancy,
  });
  if (!event) notFound();

  const [artifacts, activity, authority] = await Promise.all([
    activeClient.id
      ? listSourceArtifacts(event.id, activeClient.id, { includeHistory: true })
      : Promise.resolve([]),
    listSourceEventActivityEntries(event.id),
    readSourceEventAuthority(event.id, activeClient.key),
  ]);

  const files: SourceNewFileRow[] = activeClient.id
    ? artifacts.flatMap((artifact) => {
        // Tenancy is the only reason to drop an artifact here. A stage this
        // workspace has no phase for still belongs to the operator's event.
        if (
          canonicalTenantKey(artifact.tenantKey) !==
          canonicalTenantKey(activeClient.key)
        )
          return [];
        const phase = sourceNewFilePhase(artifact);
        return [
          {
            id: artifact.id,
            artifactGroup: artifact.artifactGroup,
            artifactType: artifact.artifactType,
            artifactFamily: artifact.artifactFamily,
            description: artifact.description,
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
            confidence: artifact.confidence,
            citationReady: artifact.citationReady,
            evidenceFamiliesUsed: artifact.evidenceFamiliesUsed,
            sourceRegisterId: artifact.sourceRegisterId,
            contextBundleTraceId: artifact.contextBundleTraceId,
            missingInputs: artifact.missingInputs,
            clientCompleteItems: artifact.clientCompleteItems,
            assumptions: artifact.assumptions,
            supersedesArtifactId: artifact.supersedesArtifactId,
            supersededByArtifactId: artifact.supersededByArtifactId,
            blobSha256: artifact.blobSha256,
            approvalState: artifact.approvalState,
            approvedBy: artifact.approvedBy,
            approvedAt: artifact.approvedAt,
            isClientFinal: artifact.isClientFinal,
            isCurrentAuthoritative: artifact.isCurrentAuthoritative,
            sourceGeneratedArtifactId: artifact.sourceGeneratedArtifactId,
            clientFinalUploadedBy: artifact.clientFinalUploadedBy,
            clientFinalUploadedAt: artifact.clientFinalUploadedAt,
            clientFinalAcceptedBy: artifact.clientFinalAcceptedBy,
            clientFinalAcceptedAt: artifact.clientFinalAcceptedAt,
            clientFinalNote: artifact.clientFinalNote,
            clientFinalReviewMeetingDate: artifact.clientFinalReviewMeetingDate,
            clientFinalStakeholderGroup: artifact.clientFinalStakeholderGroup,
            createdAt: artifact.createdAt,
            updatedAt: artifact.updatedAt,
            phase,
          },
        ];
      })
    : [];
  const intelligence = buildSourceNewEventIntelligence({
    event: {
      id: event.id,
      clientId: activeClient.id ?? activeClient.key,
      clientKey: activeClient.key,
      eventType: event.eventType ?? event.archetype ?? null,
      category: event.classifiedCategory ?? null,
      currentStage: event.currentStageKey,
    },
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      artifactType: artifact.artifactType,
      artifactFamily: artifact.artifactFamily,
      lifecycleState: artifact.lifecycleState,
      sourceBasis: artifact.sourceBasis,
      confidence: artifact.confidence,
      citationReady: artifact.citationReady,
      evidenceFamiliesUsed: artifact.evidenceFamiliesUsed,
      sourceRegisterId: artifact.sourceRegisterId,
      contextBundleTraceId: artifact.contextBundleTraceId,
      missingInputs: artifact.missingInputs,
      generatedAt: artifact.generatedAt,
    })),
  });

  return (
    <SourceNewWorkspace
      activity={activity}
      intelligence={intelligence}
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
        solicitationMotion:
          authority.kind === "available" ? authority.solicitationMotion : null,
        solicitationMotionAcceptedAt:
          authority.kind === "available" ? authority.acceptedAt : null,
        solicitationMotionAcceptedByUserId:
          authority.kind === "available" ? authority.acceptedByUserId : null,
      }}
      files={files}
    />
  );
}
