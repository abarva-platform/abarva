import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getModuleState, getStrategicMoveById } from "@/lib/programs/queries";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { MovesPhaseStandaloneClient } from "@/components/strategic-moves/MovesPhaseStandaloneClient";
import {
  isStrategicMoveRouteId,
  parseStrategicMovePhaseNum,
} from "@/lib/programs/strategic-move-route-params";
import {
  buildPhaseNavigationStatus,
  parseRequestedPhase,
  type StageReadinessReviewGateStatus,
} from "@/lib/programs/phase-navigation-status";
import { listMoveArtifacts } from "@/lib/programs/deliverables/move-artifacts";
import { listGeneratedArtifactsForMoveAllRefs } from "@/lib/artifacts/repository";
import { STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE } from "@/lib/programs/stage-readiness-workbooks/proposals";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  buildMoveEvidenceNeedPackets,
  type MoveEvidenceNeedPacket,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getMovePhaseTallies } from "@/lib/programs/phase-explorer-tallies";
import {
  DELIVERABLE_REGISTRY,
  getGateArtifacts,
} from "@/lib/programs/deliverable-registry";
import {
  readDeliverableContentSignals,
  type DeliverableContentSignal,
} from "@/lib/deliverables/deliverable-content-signals";
import { AppShell } from "@/components/shell/AppShell";
import type { StageId } from "@/lib/shell/atlas-page-state";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
  type ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string; phaseNum: string }>;
  searchParams?: Promise<{
    focus?: string | string[];
    blockedPhase?: string | string[];
    phaseLocked?: string | string[];
  }>;
}

function numberFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): number {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function p1ToP2ReviewStatusFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): StageReadinessReviewGateStatus | null {
  if (!metadata) return null;
  const readiness =
    metadata.readiness && typeof metadata.readiness === "object"
      ? (metadata.readiness as Record<string, unknown>)
      : {};
  return {
    acceptedCount: numberFromMetadata(metadata, "acceptedCount"),
    pendingCount: numberFromMetadata(metadata, "pendingCount"),
    rejectedCount: numberFromMetadata(metadata, "rejectedCount"),
    needsValidationCount: numberFromMetadata(metadata, "needsValidationCount"),
    ready: numberFromMetadata(readiness, "ready"),
    insufficientEvidence: numberFromMetadata(readiness, "insufficientEvidence"),
    unknown: numberFromMetadata(readiness, "unknown"),
  };
}

function objectMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function phaseFromGeneratedArtifactMetadata(
  metadata: Record<string, unknown>,
): number | null {
  const directPhase = metadata.phase;
  if (typeof directPhase === "number" && Number.isInteger(directPhase)) {
    return directPhase;
  }
  if (typeof directPhase === "string" && directPhase.trim()) {
    const parsed = Number(directPhase);
    if (Number.isInteger(parsed)) return parsed;
  }

  const renderableDoc = objectMetadata(metadata.renderableDoc);
  const candidates = [
    metadata.deliverableTypeKey,
    metadata.registryKey,
    metadata.deliverableType,
    renderableDoc.deliverableTypeKey,
    renderableDoc.deliverableType,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const spec = DELIVERABLE_REGISTRY.find(
      (item) => item.deliverableTypeKey === candidate.trim(),
    );
    if (spec) return spec.phase;
  }

  return null;
}

function generatedArtifactTitle(
  metadata: Record<string, unknown>,
): string | null {
  const renderableDoc = objectMetadata(metadata.renderableDoc);
  const title = renderableDoc.title ?? metadata.title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

function contextExtractAttachedEvidenceCount(
  metadata: Record<string, unknown>,
): number {
  const extract = objectMetadata(metadata.moveContextExtract);
  const attached = extract.attachedEvidenceItems;
  return Array.isArray(attached) ? attached.length : 0;
}

function isMoveContextExtractArtifact(artifactType: string): boolean {
  return artifactType.startsWith("move_context_extract_p");
}

export default async function StrategicMovePhaseWorkspacePage({
  params,
  searchParams,
}: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect("/sign-in");
  }

  const { moveId, phaseNum } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const parsedPhase = parseStrategicMovePhaseNum(phaseNum);
  if (parsedPhase === null) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  const pricingEngineEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_pricing_engine",
  );
  const riskAssessmentEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_risk_tier_scoring_v1",
  );
  const solutionPatternGateEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_solution_pattern_gate_v1",
  );

  // State reconciliation: current_phase is the single source of truth for where
  // the Move actually is. A user must not work a phase ahead of it (e.g. open
  // /phase/1 while P0 is still awaiting the brief approval), or the workspace
  // would contradict the Overview/Documents/File Cabinet. Redirect forward-
  // looking requests back to the true current phase.
  const currentPhase = move.currentPhase ?? 0;
  let p1ToP2WorkbookReview: StageReadinessReviewGateStatus | null = null;
  try {
    const tctx = await requireTenancy();
    const approvalArtifacts = await listMoveArtifacts(tctx, moveId, {
      family: "approval_artifact",
      currentOnly: true,
    });
    const currentReview = approvalArtifacts.find(
      (artifact) =>
        artifact.phase === 1 &&
        artifact.artifact_type ===
          STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
    );
    p1ToP2WorkbookReview = p1ToP2ReviewStatusFromMetadata(
      currentReview?.metadata,
    );
  } catch {
    p1ToP2WorkbookReview = null;
  }
  const blockedPhaseFromQuery =
    parseRequestedPhase(resolvedSearchParams.blockedPhase) ??
    parseRequestedPhase(resolvedSearchParams.phaseLocked);
  const phaseNavigationStatus = buildPhaseNavigationStatus({
    currentPhase,
    requestedPhase: parsedPhase,
    blockedPhase: blockedPhaseFromQuery,
    p1ToP2WorkbookReview,
  });
  if (!phaseNavigationStatus.canOpenRequestedPhase) {
    // Carry the reason as a query param — a silent redirect here reads as a
    // broken link (bookmarked/shared URLs to a future phase would otherwise
    // land the user somewhere else with zero explanation). StrategicMove-
    // PhaseClient reads this to show a one-time dismissible banner.
    redirect(
      `/strategic-moves/${moveId}/phase/${currentPhase}?blockedPhase=${parsedPhase}`,
    );
  }

  let evidenceNeedPackets: MoveEvidenceNeedPacket[] = [];
  try {
    const tctx = await requireTenancy();
    const evidenceReadiness = await loadDiscoveryEvidenceReadiness(
      tctx,
      moveId,
    );
    evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: move.name,
      currentPhase: parsedPhase,
      readiness: evidenceReadiness,
    });
  } catch {
    evidenceNeedPackets = [];
  }

  let moveContextExtractEvidenceCount = 0;
  try {
    const tctx = await requireTenancy();
    const contextExtractArtifacts = await listMoveArtifacts(tctx, moveId, {
      family: "session_artifact",
      currentOnly: true,
    });
    const phaseExtract =
      contextExtractArtifacts.find(
        (artifact) =>
          artifact.phase === parsedPhase &&
          isMoveContextExtractArtifact(artifact.artifact_type),
      ) ??
      contextExtractArtifacts.find((artifact) =>
        isMoveContextExtractArtifact(artifact.artifact_type),
      );
    moveContextExtractEvidenceCount = phaseExtract
      ? contextExtractAttachedEvidenceCount(phaseExtract.metadata)
      : 0;
  } catch {
    moveContextExtractEvidenceCount = 0;
  }

  let phaseBuildArtifacts: Array<{
    artifactId: string;
    deliverableTypeKey: string;
    documentTitle: string;
    phase: number | null;
    status: string;
    version: number;
    downloadUrl: string;
  }> = [];
  try {
    const tctx = await requireTenancy();
    const artifactsById = new Map<
      string,
      (typeof phaseBuildArtifacts)[number]
    >();
    const generatedArtifacts = await listMoveArtifacts(tctx, moveId, {
      family: "generated_deliverable",
      currentOnly: true,
    });
    for (const artifact of generatedArtifacts) {
      if (artifact.phase !== parsedPhase) continue;
      artifactsById.set(artifact.artifact_id, {
        artifactId: artifact.artifact_id,
        deliverableTypeKey: artifact.artifact_type,
        documentTitle: artifact.title,
        phase: artifact.phase,
        status: artifact.status,
        version: artifact.version,
        downloadUrl: `/api/v1/programs/${moveId}/artifacts/${artifact.artifact_id}/download`,
      });
    }

    const legacyGeneratedArtifacts = await listGeneratedArtifactsForMoveAllRefs(
      {
        clientId: tctx.clientId,
        clientIds: [tctx.clientKey].filter(
          (clientId): clientId is string => typeof clientId === "string",
        ),
        moveId,
      },
    );
    for (const artifact of legacyGeneratedArtifacts) {
      if (artifact.supersededBy) continue;
      const artifactPhase = phaseFromGeneratedArtifactMetadata(
        artifact.metadata,
      );
      if (artifactPhase !== parsedPhase) continue;
      artifactsById.set(artifact.id, {
        artifactId: artifact.id,
        deliverableTypeKey: artifact.artifactType,
        documentTitle:
          generatedArtifactTitle(artifact.metadata) ?? artifact.artifactType,
        phase: artifactPhase,
        status: artifact.quarantineReason ? "quarantined" : "board_ready",
        version: 1,
        downloadUrl: `/api/v1/artifacts/${artifact.id}`,
      });
    }
    phaseBuildArtifacts = Array.from(artifactsById.values());
  } catch {
    phaseBuildArtifacts = [];
  }

  // Real "carries forward" content — extracted from the current phase's own
  // already-generated gate deliverable(s), not fabricated. A phase whose gate
  // artifact hasn't been generated yet (or whose content has no matching
  // heading/table) simply yields no signals; the readiness pack renders that
  // honestly rather than inventing a punch list.
  let carriesForwardContent: DeliverableContentSignal[] = [];
  try {
    const gateArtifactTypeKeys = getGateArtifacts(parsedPhase).map(
      (d) => d.deliverableTypeKey,
    );
    const signalsByKey = new Map<string, DeliverableContentSignal>();
    for (const typeKey of gateArtifactTypeKeys) {
      const signals = await readDeliverableContentSignals(moveId, typeKey);
      for (const signal of signals) {
        if (!signalsByKey.has(signal.key)) signalsByKey.set(signal.key, signal);
      }
    }
    carriesForwardContent = Array.from(signalsByKey.values());
  } catch {
    carriesForwardContent = [];
  }

  let currentStateReadiness: ReadinessReport | null = null;
  try {
    const tctx = await requireTenancy();
    const archetype = await resolveMoveArchetypeForProgram(tctx, moveId);
    const profile = await inferMoveProfile(tctx);
    currentStateReadiness = await resolveCurrentStateReadiness(
      tctx,
      archetype,
      profile,
      parsedPhase,
      moveId,
    );
  } catch {
    currentStateReadiness = null;
  }

  // Preload the AUTHORITATIVE phase-capture values server-side rather than
  // letting the client synthesize or fetch-after-mount. The client previously
  // fell back to a hardcoded draft list when it had nothing, rendered that
  // boilerplate as if it were the client's own answers, and POSTed it back over
  // the real data. Handing it one authoritative snapshot removes both the
  // synthesis and the loading window in which it happened.
  const captureModules = await getModuleState(ctx, move.id).catch(() => []);
  const initialPhaseCaptureValues: Record<string, string> = {};
  for (const section of getPhaseCaptureSections(parsedPhase)) {
    const moduleRow = captureModules.find(
      (entry) =>
        entry.moduleKey === phaseCaptureModuleKey(parsedPhase, section.key),
    );
    const value = moduleRow?.state?.value;
    initialPhaseCaptureValues[section.key] =
      typeof value === "string" ? value : "";
  }
  const initialPhaseCaptureRevision = computeCaptureRevision(
    initialPhaseCaptureValues,
  );

  return (
    <AppShell
      surface="programs-detail"
      stage={`P${parsedPhase}` as StageId}
      hasTenantKey
      surfaceContext={{
        moveId: move.id,
        moveName: move.name,
        phase: parsedPhase,
        currentPhase,
        moveContextExtractEvidenceCount,
      }}
    >
      <MovesPhaseStandaloneClient
        carriesForwardContent={carriesForwardContent}
        currentStateReadiness={currentStateReadiness}
        currentUser={{
          email: ctx.email ?? null,
          role: ctx.tenantRole ?? ctx.role ?? null,
        }}
        evidenceNeedPackets={evidenceNeedPackets}
        initialPhaseCaptureRevision={initialPhaseCaptureRevision}
        initialPhaseCaptureValues={initialPhaseCaptureValues}
        moveContextExtractEvidenceCount={moveContextExtractEvidenceCount}
        phaseBuildArtifacts={phaseBuildArtifacts}
        initialSubstepKey={
          parsedPhase === 0 && resolvedSearchParams.focus === "gate"
            ? "approve"
            : undefined
        }
        move={move}
        phaseNavigationStatus={phaseNavigationStatus}
        phaseNum={parsedPhase}
        phaseTallies={getMovePhaseTallies(move)}
        pricingEngineEnabled={pricingEngineEnabled}
        riskAssessmentEnabled={riskAssessmentEnabled}
        solutionPatternGateEnabled={solutionPatternGateEnabled}
      />
    </AppShell>
  );
}
