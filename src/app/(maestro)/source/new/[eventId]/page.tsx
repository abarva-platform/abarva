import { notFound } from "next/navigation";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { SourceNewWorkspace } from "@/components/source/new-workspace/SourceNewWorkspace";
import type { SourceNewFileRow } from "@/components/source/new-workspace/SourceNewFiles";
import { listSourceEventActivityEntries } from "@/lib/source/activity-log";
import { sourceNewFilePhase } from "@/lib/source/new-workspace/phase-state";
import { readSourceEventAuthority } from "@/lib/source/new-workspace/event-authority";
import { readSourceAuthorityVersionState } from "@/lib/source/new-workspace/authority-version-store";
import { evaluateRequestVersionApproval } from "@/lib/source/new-workspace/source-version-authority";
import { buildSourceNewEventIntelligence } from "@/lib/source/new-workspace/event-intelligence";
import { buildSourceEventStagePlanSnapshot } from "@/lib/source/new-workspace/stage-plan-snapshot";
import { readSourceNewStage04VendorPanel } from "@/lib/source/new-workspace/stage04-vendor-panel";
import { readSourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import { buildSourceNewResponseIntake } from "@/lib/source/new-workspace/response-intake";
import {
  buildHistoricalRequestSummary,
  historicalRequestOriginForEvent,
} from "@/lib/source/new-workspace/historical-request-summary";
import { readSourceIntakeRequestQueue } from "@/lib/source/intake/servicenow-sourcing-request-repository";
import { listSourceArtifactsForStage } from "@/lib/source/artifact-registry";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";
import { buildScorecardAuthorityView } from "@/lib/source/proposal-intelligence";

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
  const stagePlanSnapshot = buildSourceEventStagePlanSnapshot(
    {
      id: event.id,
      client_key: activeClient.key,
      current_stage_key: event.currentStageKey,
      lifecycle_state: event.status,
      sourcing_motion: event.sourcingMotion ?? null,
      event_type: event.eventType ?? event.archetype ?? null,
      classified_category: event.classifiedCategory ?? null,
      event_name: event.name,
      event_code: event.code,
      trigger_description: event.triggerDescription ?? null,
    },
    activeClient.key,
  );
  const projectedCurrentStage =
    stagePlanSnapshot.kind === "available"
      ? stagePlanSnapshot.snapshot.currentStageKey
      : event.currentStageKey;

  const asOfDate = event.valueLedger.updatedAt.slice(0, 10);
  const [
    artifacts,
    activity,
    authority,
    requestVersion,
    stage04VendorPanel,
    stage05NdaCoverage,
    responseArtifactsResult,
    normalizedResponsePackagesResult,
    intakeRequestQueue,
  ] = await Promise.all([
    listSourceArtifacts(
      event.id,
      {
        tenantKey: clientKeyToInventorySubstrateKey(activeClient.key),
      },
      { includeHistory: true },
    ),
    listSourceEventActivityEntries(event.id),
    readSourceEventAuthority(event.id, activeClient.key),
    readSourceAuthorityVersionState(event.id, activeClient.key, "request"),
    readSourceNewStage04VendorPanel({
      clientKey: activeClient.key,
      eventId: event.id,
      categoryId: event.classifiedCategory ?? null,
      archetypeId: event.archetype ?? null,
      asOf: asOfDate,
    }),
    readSourceNewStage05NdaCoverage({
      clientKey: activeClient.key,
      eventId: event.id,
      asOf: asOfDate,
    }),
    listSourceArtifactsForStage(activeClient.key, event.id, "responses")
      .then((data) => ({ kind: "available" as const, data }))
      .catch(() => ({ kind: "unavailable" as const, data: null })),
    readNormalizedVendorResponsePackages({
      tenantKey: activeClient.key,
      eventId: event.id,
    })
      .then((data) => ({ kind: "available" as const, data }))
      .catch(() => ({ kind: "unavailable" as const, data: null })),
    readSourceIntakeRequestQueue(activeClient.key),
  ]);

  // Request authority, read from the persisted version store rather than
  // inferred from the current stage or from navigation. `null` means the store
  // could not answer — the authority tables are behind the separate migration
  // apply gate — and is deliberately NOT the same value as "no acceptance
  // recorded". A surface that cannot read the authority must say so, not
  // report the request as unaccepted.
  const requestVersionApproval =
    requestVersion.kind === "available" && requestVersion.currentVersion
      ? evaluateRequestVersionApproval({
          currentVersionId: requestVersion.currentVersion.id,
          approvals: requestVersion.approvals,
        }).status
      : null;

  const files: SourceNewFileRow[] = artifacts.flatMap((artifact) => {
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
  });
  const intelligence = buildSourceNewEventIntelligence({
    event: {
      id: event.id,
      clientId: activeClient.id ?? activeClient.key,
      clientKey: activeClient.key,
      eventType: event.eventType ?? event.archetype ?? null,
      category: event.classifiedCategory ?? null,
      currentStage: projectedCurrentStage,
    },
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      fileName: artifact.fileName,
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
  const scorecardAuthority = buildScorecardAuthorityView({
    tenantKey: activeClient.key,
    sourceEventId: event.id,
    criteria: [],
    scores: [],
  });
  const responseReadBlockers = [
    responseArtifactsResult.kind === "unavailable"
      ? "The response-stage artifact registry could not be read."
      : null,
    normalizedResponsePackagesResult.kind === "unavailable"
      ? "The normalized response parser output could not be read."
      : null,
  ].filter((blocker): blocker is string => Boolean(blocker));
  const responseIntake = buildSourceNewResponseIntake({
    eventId: event.id,
    asOf: asOfDate,
    uploadActionHref: `/api/v1/source/${encodeURIComponent(event.id)}/artifacts/upload`,
    vendorPanel: stage04VendorPanel,
    files,
    responseArtifacts:
      responseArtifactsResult.kind === "available"
        ? responseArtifactsResult.data
        : null,
    normalizedPackages:
      normalizedResponsePackagesResult.kind === "available"
        ? normalizedResponsePackagesResult.data
        : null,
    readBlockers: responseReadBlockers,
  });
  const historicalRequestSummary = buildHistoricalRequestSummary({
    event: {
      trigger: event.triggerDescription ?? null,
      scope: event.scopeDescription ?? null,
      category: event.classifiedCategory ?? null,
      decisionOwner: event.decisionOwner ?? null,
    },
    origin: historicalRequestOriginForEvent({
      eventId: event.id,
      registryAvailable: intakeRequestQueue.registryAvailable,
      requests: intakeRequestQueue.requests,
    }),
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
        currentStage: projectedCurrentStage,
        lifecycle: event.status,
        trigger: event.triggerDescription ?? null,
        scope: event.scopeDescription ?? null,
        decisionOwner: event.decisionOwner ?? null,
        asOfDate,
        solicitationMotion:
          authority.kind === "available" ? authority.solicitationMotion : null,
        solicitationMotionAcceptedAt:
          authority.kind === "available" ? authority.acceptedAt : null,
        solicitationMotionAcceptedByUserId:
          authority.kind === "available" ? authority.acceptedByUserId : null,
        requestVersionApproval,
        requestAuthorityVersionId:
          requestVersion.kind === "available"
            ? (requestVersion.currentVersion?.id ?? null)
            : null,
      }}
      files={files}
      stage04VendorPanel={stage04VendorPanel}
      stage05NdaCoverage={stage05NdaCoverage}
      scorecardAuthority={scorecardAuthority}
      responseIntake={responseIntake}
      historicalRequestSummary={historicalRequestSummary}
    />
  );
}
