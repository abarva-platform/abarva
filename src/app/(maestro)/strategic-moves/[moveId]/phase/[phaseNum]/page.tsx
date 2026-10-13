import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import {
  getModuleState,
  getProgramById,
  getPhaseSnapshots,
  getOriginationRequestState,
  getProgramDeliverables,
  getStrategicMoveById,
} from "@/lib/programs/queries";
import {
  snapshotsApprovePhase,
  originationApprovalReadback,
} from "@/lib/programs/approved-gate-phases";
import { previewP0ReviewedCaptureCorrection } from "@/lib/programs/p0-reviewed-capture-correction";
import {
  detectPhaseCatchUp,
  firstCatchUpHref,
} from "@/lib/programs/phase-catch-up";
import { readSyntheticReferenceDraft } from "@/lib/programs/phase-capture-reference-drafts";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import {
  carriedCharterAssumptions,
  charterAssumptionCarryForwardActive,
} from "@/lib/programs/charter-assumptions-carry-forward";
import {
  charterStandingAfterDiscover,
  charterStandingAfterDiscoverActive,
} from "@/lib/programs/charter-standing-after-discover";
import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  bridgeCharterAssumptions,
  charterBridgeMayWrite,
  charterBridgeMount,
} from "@/lib/programs/assumption-register/charter-bridge";
import { ASSUMPTION_REGISTER_FLAG } from "@/lib/programs/assumption-register/register-route-access";
import { seesRegisterFigures } from "@/lib/programs/assumption-register/register-route-access";
import {
  assumptionForViewer,
  type AssumptionView,
} from "@/lib/programs/assumption-register/register-request";
import { listAssumptions } from "@/lib/programs/assumption-register/store";
import type { AssumptionRecord } from "@/lib/programs/assumption-register/model";
import { resolveConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";
import { listApprovedPhaseEvidence } from "@/lib/programs/approved-phase-evidence";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { MovesPhaseStandaloneClient } from "@/components/strategic-moves/MovesPhaseStandaloneClient";
import { PhaseDocumentsPanel } from "@/components/strategic-moves/PhaseDocumentsPanel";
import { authoredUploadFlag } from "@/lib/programs/authored-deliverable-receipt";
import { p1ParticipantBindingEnabled, readP1ParticipantBinding } from "@/lib/data-plane/write-adapters/p1ParticipantBindingAdapter";
import {
  isStrategicMoveRouteId,
  parseStrategicMovePhaseNum,
} from "@/lib/programs/strategic-move-route-params";
import {
  buildPhaseNavigationStatus,
  parseRequestedPhase,
  type StageReadinessReviewGateStatus,
} from "@/lib/programs/phase-navigation-status";
import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import { listGeneratedArtifactsForMoveAllRefs } from "@/lib/artifacts/repository";
import { loadDeliverableSignOffByKey } from "@/lib/programs/deliverable-sign-off-readback";
import {
  findCurrentStageReadinessProposalSetArtifact,
  toStageReadinessGateProposal,
} from "@/lib/programs/stage-readiness-workbooks/current-proposal-set";
import { loadStageReadinessStoredReview } from "@/lib/programs/stage-readiness-workbooks/review-accumulation";
import { previewStageReadinessStoredReview } from "@/lib/programs/stage-readiness-workbooks/review-preview";
import {
  recordedDispositionsOnly,
  seedProposalsFromReviewPreview,
} from "@/lib/programs/stage-readiness-workbooks/review-provenance";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  buildMoveEvidenceNeedPackets,
  type MoveEvidenceNeedPacket,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import {
  applyStageReadinessToEvidencePackets,
  type StageReadinessGateProposal,
} from "@/lib/programs/stage-readiness-workbooks/gate-readiness";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";
import { getMovePhaseTallies } from "@/lib/programs/phase-explorer-tallies";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import {
  readApprovedPhaseGateContentSignals,
  readPhaseGateContentSignals,
  type DeliverableContentSignal,
} from "@/lib/deliverables/deliverable-content-signals";
import { AppShell } from "@/components/shell/AppShell";
import type { StageId } from "@/lib/shell/atlas-page-state";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { phaseStepRecordSections } from "@/lib/programs/phase-workflow-registry";
import {
  parseStepPageView,
  STEP_PAGE_VIEWS,
  type StepPageView,
} from "@/lib/programs/step-page-views";
import {
  phaseStepPageFlagEnabled,
  needsGateDocumentRead,
  resolveBarePhaseStepPageLanding,
  shouldDeferBarePhaseLanding,
} from "@/lib/programs/phase-step-page-routing";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { capturePhaseSavedAnswerCounts } from "@/lib/programs/capture-phase-saved-answers";
import { loadP0MinimumEvidenceStatus } from "@/lib/programs/p0-source-evidence";
import { resolveEffectiveMovePhase } from "@/lib/programs/effective-move-phase";
import {
  createPhasePageGateReads,
  createPhasePageReadSet,
} from "@/lib/programs/phase-page-gate-reads";
import { loadApprovedMoveEvidenceSnapshot } from "@/lib/programs/approved-move-evidence-snapshot";
import { parseUploadedSolutionOptions } from "@/lib/programs/phase-templates/uploaded-solution-options";
import { loadApprovedSolutionApproach } from "@/lib/programs/approved-solution-approach";
import {
  buildGateCriteria,
  gateCriteriaForViewedPhase,
} from "@/lib/programs/transformers";
import { getPhaseLabel } from "@/lib/programs/phase-labels";
import { p0SourceEvidenceNeedPacket } from "@/lib/programs/phase-progress-readiness";
import {
  p1CharterBasisInputFromRecord,
  readP1CharterBasisRecord,
  type P1CharterBasisInput,
} from "@/lib/programs/p1-charter-evidence";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string; phaseNum: string }>;
  searchParams?: Promise<{
    focus?: string | string[];
    blockedPhase?: string | string[];
    phaseLocked?: string | string[];
    /**
     * `gate` opens P3 Gate readiness; `root-causes` opens P2 Step 3
     * (moves_step_pages_v3).
     */
    step?: string | string[];
    workspace?: string | string[];
    legacy?: string | string[];
    section?: string | string[];
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

interface StageReadinessProposalSetPreview {
  ok: boolean;
  summary?: {
    totalQuestions?: number;
    answeredQuestions?: number;
    requiredAnswered?: number;
    requiredTotal?: number;
    warningCount?: number;
    errorCount?: number;
  };
  proposalSet?: {
    artifactId?: string;
    artifactVersion?: number;
    proposalSetId?: string;
    transition?: { fromPhase?: number; toPhase?: number };
    status?: string;
    proposalCount?: number;
    pendingCount?: number;
    review?: {
      status?: string;
      acceptedCount?: number;
      rejectedCount?: number;
      needsValidationCount?: number;
      pendingCount?: number;
      carriedForwardFromPriorUpload?: number;
      readiness?: {
        ready?: number;
        partial?: number;
        insufficientEvidence?: number;
        unknown?: number;
      };
    };
    proposals?: Array<{
      proposalId?: string;
      questionId?: string;
      dimensionId?: string;
      requirement?: "required" | "recommended";
      question?: string;
      response?: string;
      context?: string;
      answerState?: string;
      disposition?: string;
      /**
       * The disposition was restored from an earlier upload of this workbook
       * and no review of the set under review has recorded it. It is shown,
       * and `recordedDispositionsOnly` keeps it out of every gate reading.
       */
      dispositionRestoredFromPriorUpload?: boolean;
      evidenceOrSource?: string;
    }>;
    message?: string;
  } | null;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function proposalSetPreviewFromJson(
  artifactId: string,
  artifactVersion: number,
  value: unknown,
): StageReadinessProposalSetPreview | null {
  const proposalSet = objectValue(value);
  if (!proposalSet) return null;
  const summary = objectValue(proposalSet.summary);
  const proposals = Array.isArray(proposalSet.proposals)
    ? proposalSet.proposals
        .map((raw) => {
          const proposal = objectValue(raw);
          if (!proposal) return null;
          return {
            proposalId:
              typeof proposal.proposalId === "string"
                ? proposal.proposalId
                : undefined,
            questionId:
              typeof proposal.questionId === "string"
                ? proposal.questionId
                : undefined,
            dimensionId:
              typeof proposal.dimensionId === "string"
                ? proposal.dimensionId
                : undefined,
            requirement: (proposal.requirement === "recommended"
              ? "recommended"
              : "required") as "required" | "recommended",
            question:
              typeof proposal.question === "string"
                ? proposal.question
                : undefined,
            response:
              typeof proposal.response === "string"
                ? proposal.response
                : undefined,
            // `context` is the "Tell Us More / Context" column a human fills
            // in, and `stageReadinessAnswerIdentity` keys on it. Dropping it
            // here would silently match nothing on every row that has one.
            context:
              typeof proposal.context === "string"
                ? proposal.context
                : undefined,
            answerState:
              typeof proposal.answerState === "string"
                ? proposal.answerState
                : undefined,
            evidenceOrSource:
              typeof proposal.evidenceOrSource === "string"
                ? proposal.evidenceOrSource
                : undefined,
            disposition:
              typeof proposal.disposition === "string"
                ? proposal.disposition
                : undefined,
          };
        })
        .filter((proposal): proposal is NonNullable<typeof proposal> =>
          Boolean(proposal?.proposalId),
        )
    : [];
  if (proposals.length === 0) return null;
  return {
    ok: true,
    summary: summary
      ? {
          totalQuestions: numberFromMetadata(summary, "totalQuestions"),
          answeredQuestions: numberFromMetadata(summary, "answeredQuestions"),
          requiredAnswered: numberFromMetadata(summary, "requiredAnswered"),
          requiredTotal: numberFromMetadata(summary, "requiredTotal"),
          warningCount: numberFromMetadata(summary, "warningCount"),
          errorCount: numberFromMetadata(summary, "errorCount"),
        }
      : undefined,
    proposalSet: {
      artifactId,
      artifactVersion,
      proposalSetId:
        typeof proposalSet.proposalSetId === "string"
          ? proposalSet.proposalSetId
          : undefined,
      transition: objectValue(proposalSet.transition)
        ? {
            fromPhase: numberFromMetadata(
              objectValue(proposalSet.transition),
              "fromPhase",
            ),
            toPhase: numberFromMetadata(
              objectValue(proposalSet.transition),
              "toPhase",
            ),
          }
        : undefined,
      status: "review_required",
      proposalCount:
        numberFromMetadata(summary, "proposalCount") || proposals.length,
      pendingCount: numberFromMetadata(summary, "pendingCount"),
      proposals,
      message:
        "Workbook responses were stored as pending proposals. They do not feed P2 until accepted.",
    },
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

function deliverableKeyFromArtifactMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const renderableDoc = objectMetadata(metadata?.renderableDoc);
  const candidates = [
    metadata?.deliverableTypeKey,
    metadata?.registryKey,
    metadata?.deliverableType,
    renderableDoc.deliverableTypeKey,
    renderableDoc.deliverableType,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function createStepServerTimer() {
  const routeStartedAt = performance.now();
  const serverTimings: Record<string, { startMs: number; durationMs: number }> =
    {};
  const timed = async <T,>(
    name: string,
    read: () => Promise<T>,
  ): Promise<T> => {
    const startedAt = performance.now();
    try {
      return await read();
    } finally {
      serverTimings[name] = {
        startMs: Math.round(startedAt - routeStartedAt),
        durationMs: Math.round(performance.now() - startedAt),
      };
    }
  };
  const finish = () => {
    serverTimings.serverRoute = {
      startMs: 0,
      durationMs: Math.round(performance.now() - routeStartedAt),
    };
  };
  return { serverTimings, timed, finish };
}

export default async function StrategicMovePhaseWorkspacePage({
  params,
  searchParams,
}: Props) {
  const { serverTimings, timed, finish } = createStepServerTimer();
  await timed("moduleAccess", () => requireProductModule("programs"));
  const ctx = await timed("tenancy", getStrategicMovesTenancy);
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

  const captureV2Enabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_capture_v2",
  );
  const stepPagesV3Enabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_step_pages_v3",
  );
  const phaseStepPagesEnabled = phaseStepPageFlagEnabled(parsedPhase, {
    captureV2: captureV2Enabled,
    stepPagesV3: stepPagesV3Enabled,
    p0p1: isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_step_pages_p0p1_v1",
    ),
    p4p5: isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_step_pages_p4p5_v1",
    ),
  });
  const flaggedStepView =
    phaseStepPagesEnabled &&
    resolvedSearchParams.legacy !== "1" &&
    parseStepPageView(resolvedSearchParams.step) !== null;
  const selectedStepView = parseStepPageView(resolvedSearchParams.step);
  const p1BindingActive = parsedPhase === 1 && phaseStepPagesEnabled && p1ParticipantBindingEnabled(ctx);
  const p1BindingPreview = p1BindingActive ? timed("p1ParticipantBinding", () => readP1ParticipantBinding(ctx, moveId)).catch(() => null) : undefined;
  const readSet = flaggedStepView
    ? createPhasePageReadSet(ctx, moveId)
    : undefined;
  const loadProgram: typeof getProgramById = (tctx, id, options) =>
    readSet && !options?.supabase
      ? readSet(tctx, id, "program", () =>
          getProgramById(tctx, id, { readSet }),
        )
      : getProgramById(tctx, id, options);
  const loadModules: typeof getModuleState = (tctx, id) =>
    readSet
      ? readSet(tctx, id, "moduleState", () =>
          getModuleState(tctx, id, { readSet }),
        )
      : getModuleState(tctx, id);
  const loadSnapshots: typeof getPhaseSnapshots = async (tctx, id, phase) => {
    if (!readSet) return getPhaseSnapshots(tctx, id, phase);
    const snapshots = await readSet(tctx, id, "phaseSnapshots", () =>
      getPhaseSnapshots(tctx, id, undefined, { readSet }),
    );
    return phase === undefined
      ? snapshots
      : snapshots.filter((snapshot) => snapshot.phaseNumber === phase);
  };
  const loadEvidenceSnapshot: typeof loadApprovedMoveEvidenceSnapshot = async (
    args,
  ) => {
    if (!readSet) return loadApprovedMoveEvidenceSnapshot(args);
    if (args.tenantKey !== ctx.clientKey)
      throw new Error("Phase page evidence tenant mismatch");
    return readSet(ctx, args.moveId, "approvedEvidenceSnapshot", () =>
      loadApprovedMoveEvidenceSnapshot(args),
    );
  };
  const loadPhaseEvidence: typeof listApprovedPhaseEvidence = (
    tctx,
    id,
    phase,
  ) =>
    readSet
      ? readSet(tctx, id, `approvedPhaseEvidence:${phase}`, () =>
          listApprovedPhaseEvidence(tctx, id, phase),
        )
      : listApprovedPhaseEvidence(tctx, id, phase);
  const readGate = flaggedStepView
    ? createPhasePageGateReads(ctx, moveId, undefined, readSet)
    : undefined;
  const stepGateCriteriaPromise = flaggedStepView
    ? timed("gateCriteria", () =>
        buildGateCriteria(ctx, moveId, parsedPhase, {
          allowHistoricalPhase: true,
          evaluateGate: readGate,
        }),
      )
    : null;
  const dataTenancyPromise = flaggedStepView
    ? Promise.resolve(ctx)
    : timed("dataTenancy", requireTenancy).catch(() => null);
  const readTenancy = async () => {
    const value = await dataTenancyPromise;
    if (!value) throw new Error("Move data tenancy unavailable");
    return value;
  };
  const loadCurrentStateReadiness = async () => {
    try {
      const tctx = await readTenancy();
      const [archetype, profile] = await Promise.all([
        readSet
          ? loadProgram(tctx, moveId).then((program) => {
              if (!program) throw new Error("Move unavailable for readiness");
              return resolveMoveArchetypeForProgram(
                tctx,
                moveId,
                program,
                loadModules,
              );
            })
          : resolveMoveArchetypeForProgram(tctx, moveId),
        inferMoveProfile(tctx, {}, { readSet, moveId }),
      ]);
      return await resolveCurrentStateReadiness(
        tctx,
        archetype,
        profile,
        parsedPhase,
        moveId,
        { readSet, moveId },
      );
    } catch {
      return null;
    }
  };
  const captureModulesPromise = timed("stepRecords", () =>
    loadModules(ctx, moveId).then(
      (modules) => ({ modules, unavailable: false }),
      () => ({ modules: [], unavailable: true }),
    ),
  );
  const currentStateReadinessPrefetch = flaggedStepView
    ? timed("currentStateReadiness", loadCurrentStateReadiness)
    : null;
  const phaseSnapshotsPrefetch = flaggedStepView
    ? loadSnapshots(ctx, moveId)
    : null;
  const discoveryReadinessPrefetch = flaggedStepView
    ? timed("evidenceReadiness", async () =>
        loadDiscoveryEvidenceReadiness(await readTenancy(), moveId, {
          loadProgram,
          parallelReadbacks: true,
        }),
      )
    : null;
  const approvalPolicyPromise = timed("accessPolicy", () =>
    loadUserProgramAccessPolicy(ctx, {
      programId: moveId,
      ...(readSet ? { readSet } : {}),
    }).catch(() => null),
  );
  const assumptionRegisterEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    ASSUMPTION_REGISTER_FLAG,
  );
  const registerRowsPrefetch =
    flaggedStepView && assumptionRegisterEnabled
      ? timed("registerVisibility", async () => {
          const [program, policy] = await Promise.all([
            loadProgram(ctx, moveId),
            approvalPolicyPromise,
          ]);
          if (!program || policy === null)
            return { status: "unavailable" as const, rows: null };
          try {
            return {
              status: "ok" as const,
              rows: await listAssumptions(ctx, moveId),
            };
          } catch {
            return { status: "unavailable" as const, rows: null };
          }
        })
      : null;
  const approvalArtifactsPrefetch = flaggedStepView
    ? timed("gateReadback", async () => {
        const program = await loadProgram(ctx, moveId);
        if (!program) throw new Error("Move unavailable for gate readback");
        return listMoveArtifacts(ctx, moveId, {
          family: "approval_artifact",
          currentOnly: true,
        });
      })
    : null;
  void Promise.allSettled([
    currentStateReadinessPrefetch,
    phaseSnapshotsPrefetch,
    discoveryReadinessPrefetch,
    registerRowsPrefetch,
    approvalArtifactsPrefetch,
  ]);

  const [loadedMove, approvalPolicy] = await Promise.all([
    timed("move", () =>
      getStrategicMoveById(
        ctx,
        moveId,
        flaggedStepView
          ? {
              evaluateGateCriteria: false,
              loadProgram,
              loadPhaseSnapshots: loadSnapshots,
              readSet,
            }
          : undefined,
      ),
    ),
    approvalPolicyPromise,
  ]);
  if (!loadedMove) notFound();
  const canApproveGates = approvalPolicy?.canApproveGates === true;
  const {
    effectivePhase: effectiveCurrentPhase,
    reopenedForEvidenceReview,
    reopenedForGateReview,
  } = await timed("effectivePhase", () =>
    resolveEffectiveMovePhase(
      ctx,
      loadedMove,
      readGate
        ? {
            getPhaseSnapshots: loadSnapshots,
            loadApprovedMoveEvidenceSnapshot: loadEvidenceSnapshot,
            evaluateGate: readGate,
          }
        : undefined,
    ),
  );
  const effectiveMove =
    effectiveCurrentPhase === loadedMove.currentPhase
      ? loadedMove
      : {
          ...loadedMove,
          currentPhase: effectiveCurrentPhase,
          phaseLabel: getPhaseLabel(effectiveCurrentPhase),
          gateCriteria: await buildGateCriteria(
            ctx,
            moveId,
            effectiveCurrentPhase,
            {
              allowHistoricalPhase: flaggedStepView || reopenedForGateReview,
              evaluateGate: readGate,
            },
          ),
        };
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
  const catchUpEnabled =
    phaseStepPagesEnabled &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_step_pages_catch_up_v1",
    );
  // P3 Step 4's bottom-up estimate prices through the ROM preview route, which
  // this flag gates; the step page needs it as well as the step-page flag.
  const romEngineEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_rom_engine_v1",
  );
  const deliveryOptionsEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_delivery_options_v1",
  );
  // P0 Originate was left on the legacy canvas when the 3-step capture shipped
  // for phases 1-5. This flag extends the same flow to P0; it is deliberately
  // separate from `moves_capture_v2` so a tenant already on the redesigned
  // phases 1-5 does not have its P0 screen change without its own review.
  const captureP0Enabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_capture_p0_v1",
  );
  // The same tenant gate the phase-capture route applies to the P1 basis gate,
  // resolved here so the per-field basis control renders only where the relaxed
  // gate is actually in force. Off ⇒ the control does not render at all.
  const charterBasisEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_charter_basis_v1",
  );
  // The P2 half of the same promise: P1 tells the person an assumption
  // "carries into Discover", and this is the read that performs it. Resolved
  // as its own flag so a tenant on the P1 basis control does not have its
  // Discover screen change without its own review.
  const charterAssumptionsInDiscoverEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_charter_assumptions_discover_v1",
  );
  // Whether a charter assumption Discover has already resolved still counts as
  // open. Separate from the flag above on purpose: a tenant may want to inherit
  // the assumptions read-only without the resolve path acting on them.
  const charterAssumptionResolutionEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_charter_assumption_resolution_v1",
  );
  // What a charter answer is worth once Discover has closed. Its own flag, and
  // the fold additionally requires the resolution read: without it a resolved
  // assumption and a surviving one are indistinguishable, and the surface would
  // report work that was really done as work nobody did.
  const charterStandingAfterDiscoverEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_charter_standing_after_discover_v1",
  );
  // Composition-only polish for the redesigned capture. It has nothing to show
  // unless the redesigned capture is what renders, so it is resolved as the
  // conjunction rather than left to the client to remember.
  const captureCompositionEnabled =
    captureV2Enabled &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_capture_composition_v1",
    );
  // Increment 1 of the phase-workspace v2 shell (one slim phase rail, the
  // four-stage sub-step spine, workbook on the gate step). CONJUNCTION with
  // `moves_capture_v2`: there is no capture flow to reshape without it. It
  // subsumes the composition polish in the host, so it does not also require
  // the composition flag.
  const workspaceV2Enabled =
    captureV2Enabled &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_workspace_v2",
    );
  // Governed fill-from-notes in the capture dock. Gated separately from the
  // capture redesign itself so the dock affordance can be reviewed on its own.
  const captureNotesEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_capture_notes_v1",
  );
  // Reachability-only polish of the redesigned capture, so it is the
  // CONJUNCTION with `moves_capture_v2`: there is no hand-off recap to reach
  // unless the redesigned flow is what rendered.
  const captureHandoffRecapEnabled =
    captureV2Enabled &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_capture_handoff_recap_v1",
    );

  // A bare phase address has no step state to preserve. The catch-up lane
  // waits for the saved records below, so a current phase lands on its actual
  // first open step; other lanes retain the existing early redirect.
  const earlyStepTarget = resolveBarePhaseStepPageLanding({
    moveId,
    phase: parsedPhase,
    currentPhase: effectiveMove.currentPhase ?? 0,
    implementedViews: (Object.keys(STEP_PAGE_VIEWS) as StepPageView[]).filter(
      (view) => view !== "rom-estimate" || romEngineEnabled,
    ),
    enabled: phaseStepPagesEnabled,
    searchParams: resolvedSearchParams,
  });
  const deferCatchUpLanding = shouldDeferBarePhaseLanding({
    catchUpEnabled,
    requestedPhase: parsedPhase,
    currentPhase: effectiveMove.currentPhase ?? 0,
    earlyTarget: earlyStepTarget,
  });
  if (earlyStepTarget && !deferCatchUpLanding) redirect(earlyStepTarget);
  const gateCriteriaPromise =
    stepGateCriteriaPromise ??
    timed("gateCriteria", () =>
      gateCriteriaForViewedPhase(ctx, effectiveMove, parsedPhase),
    );
  const p2GateSnapshotsPromise = timed("catchUpGate", () =>
    catchUpEnabled && (effectiveMove.currentPhase ?? 0) > 2
      ? loadSnapshots(ctx, moveId, 2).catch(() => null)
      : Promise.resolve(null),
  );
  const includeGateDocuments = needsGateDocumentRead({
    view: selectedStepView,
    enabled: phaseStepPagesEnabled,
    legacy: resolvedSearchParams.legacy === "1",
  });
  const sharedRegisterReadEnabled =
    assumptionRegisterEnabled && flaggedStepView;
  const registerRowsPromise = sharedRegisterReadEnabled
    ? (registerRowsPrefetch ??
      (approvalPolicy === null
        ? Promise.resolve({ status: "unavailable" as const, rows: null })
        : timed("registerVisibility", async () => {
            try {
              return {
                status: "ok" as const,
                rows: await listAssumptions(ctx, moveId),
              };
            } catch {
              return { status: "unavailable" as const, rows: null };
            }
          })))
    : Promise.resolve(null);
  const approvedEvidencePromise = timed("approvedEvidence", () =>
    Promise.all([
      loadPhaseEvidence(ctx, moveId, 2),
      parsedPhase === 1
        ? loadPhaseEvidence(ctx, moveId, 1)
        : Promise.resolve([]),
    ]),
  );
  const currentStateReadinessPromise =
    currentStateReadinessPrefetch ??
    timed("currentStateReadiness", loadCurrentStateReadiness);
  const carriesForwardContentPromise = timed("carryForward", () =>
    readPhaseGateContentSignals(moveId, parsedPhase).catch(
      () => [] as DeliverableContentSignal[],
    ),
  );
  const p3PriorPhaseContentPromise = timed("priorPhaseContent", () =>
    parsedPhase === 3
      ? readApprovedPhaseGateContentSignals(moveId, 2).catch(
          () => [] as DeliverableContentSignal[],
        )
      : Promise.resolve([] as DeliverableContentSignal[]),
  );
  const approvalArtifactsPromise =
    approvalArtifactsPrefetch ??
    timed("gateReadback", async () =>
      listMoveArtifacts(await readTenancy(), moveId, {
        family: "approval_artifact",
        currentOnly: true,
      }),
    );
  const readinessWorkbookPhase = Math.min(
    parsedPhase,
    effectiveMove.currentPhase ?? 0,
  );
  const downloadedProposalSetPromise = timed(
    "gateWorkbookDownload",
    async () => {
      const [tctx, approvalArtifacts] = await Promise.all([
        readTenancy(),
        approvalArtifactsPromise,
      ]);
      const currentProposalSet = findCurrentStageReadinessProposalSetArtifact(
        approvalArtifacts,
        readinessWorkbookPhase,
      );
      return currentProposalSet
        ? {
            tctx,
            currentProposalSet,
            downloaded: await downloadArtifactBytes(
              tctx,
              currentProposalSet.artifact_id,
            ),
          }
        : null;
    },
  );
  const discoveryReadinessPromise =
    discoveryReadinessPrefetch ??
    timed("evidenceReadiness", async () =>
      loadDiscoveryEvidenceReadiness(await readTenancy(), moveId),
    );
  const p0EvidencePromise = timed("p0Evidence", async () =>
    parsedPhase === 0
      ? readTenancy().then((tctx) =>
          loadP0MinimumEvidenceStatus({
            tenantKey: tctx.clientKey ?? tctx.clientId,
            moveId,
          }),
        )
      : null,
  );
  const generatedArtifactsPromise = includeGateDocuments
    ? timed("generatedArtifacts", async () =>
        listMoveArtifacts(await readTenancy(), moveId, {
          family: "generated_deliverable",
          currentOnly: true,
        }),
      )
    : Promise.resolve([]);
  const deliverableSignOffPromise =
    flaggedStepView && includeGateDocuments
      ? timed("deliverableSignOff", () => loadDeliverableSignOffByKey(moveId))
      : Promise.resolve(null);
  const legacyGeneratedArtifactsPromise = includeGateDocuments
    ? timed("legacyArtifacts", async () => {
        const tctx = await readTenancy();
        return listGeneratedArtifactsForMoveAllRefs({
          clientId: tctx.clientId,
          clientIds: [tctx.clientKey].filter(
            (clientId): clientId is string => typeof clientId === "string",
          ),
          moveId,
        });
      })
    : Promise.resolve([]);
  // A navigation redirect can leave a prefetched read unused. Observe every
  // outcome without changing the result seen by the consumer below.
  void Promise.allSettled([
    approvedEvidencePromise,
    registerRowsPromise,
    approvalArtifactsPromise,
    downloadedProposalSetPromise,
    discoveryReadinessPromise,
    p0EvidencePromise,
    generatedArtifactsPromise,
    deliverableSignOffPromise,
    legacyGeneratedArtifactsPromise,
  ]);
  const move = {
    ...effectiveMove,
    gateCriteria: await gateCriteriaPromise,
  };

  // CONJUNCTION with `moves_capture_v2`: the phase strip this rollup feeds is
  // part of the redesigned capture flow, so there is no row to label unless the
  // flow is what rendered.
  const capturePhaseRollupEnabled =
    captureV2Enabled &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_capture_phase_rollup_v1",
    );

  // The review queue for outside public sources the research step stored for
  // this Move. Same flag as the research step itself: a tenant that is not
  // researching has nothing to review.
  const publicSourceReviewEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_public_source_research",
  );

  // State reconciliation: current_phase is the single source of truth for where
  // the Move actually is. A user must not work a phase ahead of it (e.g. open
  // /phase/1 while P0 is still awaiting the brief approval), or the workspace
  // would contradict the Overview/Documents/File Cabinet. Redirect forward-
  // looking requests back to the true current phase.
  const currentPhase = move.currentPhase ?? 0;
  let p1ToP2WorkbookReview: StageReadinessReviewGateStatus | null = null;
  let initialStageReadinessPreview: StageReadinessProposalSetPreview | null =
    null;
  try {
    const proposalSetRead = await downloadedProposalSetPromise;
    if (proposalSetRead) {
      const { tctx, currentProposalSet, downloaded } = proposalSetRead;
      if (downloaded?.fileFormat === "json") {
        const proposalSetJson = JSON.parse(downloaded.bytes.toString("utf8"));
        initialStageReadinessPreview = proposalSetPreviewFromJson(
          currentProposalSet.artifact_id,
          currentProposalSet.version,
          proposalSetJson,
        );

        const parsedProposals =
          initialStageReadinessPreview?.proposalSet?.proposals;
        if (initialStageReadinessPreview?.proposalSet && parsedProposals) {
          // One read of the stored review, two readings of it. A review of
          // THIS set is the one this surface has always seeded. A review of an
          // EARLIER upload holds decisions the submit path restores by answer
          // text, and showing none of them is what sent a reviewer back
          // through every response after correcting a single cell.
          const storedReview = await timed("gateStoredReview", () =>
            loadStageReadinessStoredReview(
              tctx,
              moveId,
              readinessWorkbookPhase,
              {
                proposalSetId:
                  initialStageReadinessPreview!.proposalSet!.proposalSetId ??
                  "",
                artifactId: currentProposalSet.artifact_id,
                artifactVersion: currentProposalSet.version,
              },
            ),
          );
          const reviewPreview = previewStageReadinessStoredReview({
            proposals: parsedProposals.map((proposal) => ({
              proposalId: proposal.proposalId ?? "",
              questionId: proposal.questionId ?? "",
              response: proposal.response ?? "",
              context: proposal.context ?? "",
              evidenceOrSource: proposal.evidenceOrSource ?? "",
              answerState:
                proposal.answerState === "answered" ||
                proposal.answerState === "unknown" ||
                proposal.answerState === "insufficient_evidence"
                  ? proposal.answerState
                  : ("blank" as const),
            })),
            storedReview,
          });

          if (storedReview && reviewPreview.source !== "none") {
            // Provenance is set with the disposition it describes. The
            // gate projection below reads `recordedDispositionsOnly`, so a
            // restored decision reaches the screen and never the gate.
            const seeded = seedProposalsFromReviewPreview({
              proposals: parsedProposals,
              preview: reviewPreview,
            });
            const tally = (disposition: string) =>
              seeded.filter((proposal) => proposal.disposition === disposition)
                .length;
            const decidedCount =
              tally("accepted") + tally("rejected") + tally("needs_validation");

            // A superseded review's own stored summary counts a DIFFERENT set
            // of answers, and only the rows whose text is unchanged carried
            // over, so those figures are recomputed here from what actually
            // stands. Its stored readiness split is dropped rather than
            // restated: it was measured over responses this set may no longer
            // contain.
            const fromPriorUpload = reviewPreview.source === "prior_upload";
            const reviewSummary = fromPriorUpload
              ? null
              : objectValue(storedReview.summary);

            initialStageReadinessPreview = {
              ...initialStageReadinessPreview,
              proposalSet: {
                ...initialStageReadinessPreview.proposalSet,
                status:
                  !fromPriorUpload && storedReview.artifactStatus === "approved"
                    ? "accepted"
                    : "review_required",
                pendingCount: seeded.length - decidedCount,
                review: {
                  status:
                    !fromPriorUpload &&
                    storedReview.artifactStatus === "approved"
                      ? "accepted"
                      : "review_required",
                  acceptedCount: tally("accepted"),
                  rejectedCount: tally("rejected"),
                  needsValidationCount: tally("needs_validation"),
                  pendingCount: seeded.length - decidedCount,
                  carriedForwardFromPriorUpload:
                    reviewPreview.restoredFromPriorUploadCount,
                  readiness: fromPriorUpload
                    ? undefined
                    : {
                        ready: numberFromMetadata(
                          objectValue(reviewSummary?.readiness),
                          "ready",
                        ),
                        partial: numberFromMetadata(
                          objectValue(reviewSummary?.readiness),
                          "partial",
                        ),
                        insufficientEvidence: numberFromMetadata(
                          objectValue(reviewSummary?.readiness),
                          "insufficientEvidence",
                        ),
                        unknown: numberFromMetadata(
                          objectValue(reviewSummary?.readiness),
                          "unknown",
                        ),
                      },
                },
                proposals: seeded,
              },
            };

            // The P1->P2 gate status reads the review artifact's metadata and
            // must keep answering only for a review of the set under review;
            // a superseded review has not cleared this transition.
            if (readinessWorkbookPhase === 1 && !fromPriorUpload) {
              p1ToP2WorkbookReview = p1ToP2ReviewStatusFromMetadata(
                objectMetadata(storedReview.artifactMetadata),
              );
            }
          }
        }
      }
    }
  } catch {
    p1ToP2WorkbookReview = null;
    initialStageReadinessPreview = null;
  }
  const blockedPhaseFromQuery =
    parseRequestedPhase(resolvedSearchParams.blockedPhase) ??
    parseRequestedPhase(resolvedSearchParams.phaseLocked);
  const phaseNavigationStatus = buildPhaseNavigationStatus({
    currentPhase,
    requestedPhase: parsedPhase,
    blockedPhase: blockedPhaseFromQuery,
    p1ToP2WorkbookReview: reopenedForEvidenceReview
      ? null
      : p1ToP2WorkbookReview,
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
  let evidenceReadinessAvailable = false;
  let syntheticEvidencePackHref: string | null = null;
  try {
    const tctx = await readTenancy();
    const evidenceReadiness = await discoveryReadinessPromise;
    evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId,
      moveName: move.name,
      currentPhase: parsedPhase,
      readiness: evidenceReadiness,
    });
    const readinessProposals: StageReadinessGateProposal[] | null =
      readinessWorkbookPhase === parsedPhase
        ? recordedDispositionsOnly(
            initialStageReadinessPreview?.proposalSet?.proposals,
          ).map(toStageReadinessGateProposal)
        : null;
    evidenceNeedPackets = applyStageReadinessToEvidencePackets(
      evidenceNeedPackets,
      parsedPhase,
      readinessProposals,
      moveId,
    );
    if (parsedPhase === 1 && readinessWorkbookPhase === 1) {
      evidenceNeedPackets = applyStageReadinessToEvidencePackets(
        evidenceNeedPackets,
        2,
        readinessProposals,
        moveId,
      );
    }
    evidenceReadinessAvailable = true;
    if (parsedPhase === 0) {
      const p0Evidence = await p0EvidencePromise;
      if (!p0Evidence) throw new Error("P0 evidence read unavailable");
      evidenceNeedPackets.push(
        p0SourceEvidenceNeedPacket({
          moveId,
          evidenceTitles: p0Evidence.evidenceTitles,
          pendingReviewCount: p0Evidence.pendingReviewCount,
        }),
      );
      evidenceReadinessAvailable = p0Evidence.available;
    }
    if (parsedPhase < 5 && isFoundationTenantKey(tctx.clientKey)) {
      syntheticEvidencePackHref = `/api/v1/programs/${encodeURIComponent(
        moveId,
      )}/stage-readiness-evidence-pack?phase=${parsedPhase}`;
    }
  } catch {
    evidenceNeedPackets = [];
    syntheticEvidencePackHref = null;
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
  let phaseBuildArtifactsAvailable = true;
  try {
    const artifactsById = new Map<
      string,
      (typeof phaseBuildArtifacts)[number]
    >();
    const generatedArtifacts = await generatedArtifactsPromise;
    for (const artifact of generatedArtifacts) {
      if (artifact.phase !== parsedPhase) continue;
      const artifactMetadata = objectMetadata(artifact.metadata);
      artifactsById.set(artifact.artifact_id, {
        artifactId: artifact.artifact_id,
        deliverableTypeKey:
          deliverableKeyFromArtifactMetadata(artifactMetadata) ??
          artifact.artifact_type,
        documentTitle: artifact.title,
        phase: artifact.phase,
        status: artifact.status,
        version: artifact.version,
        downloadUrl: `/api/v1/programs/${moveId}/artifacts/${artifact.artifact_id}/download`,
      });
    }

    const legacyGeneratedArtifacts = await legacyGeneratedArtifactsPromise;
    for (const artifact of legacyGeneratedArtifacts) {
      if (artifact.supersededBy) continue;
      const artifactPhase = phaseFromGeneratedArtifactMetadata(
        artifact.metadata,
      );
      if (artifactPhase !== parsedPhase) continue;
      artifactsById.set(artifact.id, {
        artifactId: artifact.id,
        deliverableTypeKey:
          deliverableKeyFromArtifactMetadata(artifact.metadata) ??
          artifact.artifactType,
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
    phaseBuildArtifactsAvailable = false;
  }
  const deliverableSignOff = await deliverableSignOffPromise;
  if (deliverableSignOff?.available) {
    phaseBuildArtifacts = phaseBuildArtifacts.map((artifact) => {
      const signOff = deliverableSignOff.byKey.get(artifact.deliverableTypeKey);
      return signOff ? { ...artifact, ...signOff } : artifact;
    });
  }

  // Keep current-phase carry-forward separate from P2 evidence used to score
  // P3 options. Otherwise P3 can score itself from its own outputs and omit
  // the approved discovery limits that should constrain the design choice.
  const [carriesForwardContent, p3PriorPhaseContent, currentStateReadiness] =
    await Promise.all([
      carriesForwardContentPromise,
      p3PriorPhaseContentPromise,
      currentStateReadinessPromise,
    ]);

  // Preload the AUTHORITATIVE phase-capture values server-side rather than
  // letting the client synthesize or fetch-after-mount. The client previously
  // fell back to a hardcoded draft list when it had nothing, rendered that
  // boilerplate as if it were the client's own answers, and POSTed it back over
  // the real data. Handing it one authoritative snapshot removes both the
  // synthesis and the loading window in which it happened.
  // A failed read is remembered: an empty list would otherwise read as "the
  // charter declares no assumptions" to the register bridge below, which would
  // then report every charter row as stale.
  const [captureRead, p2GateSnapshots, registerRead] = await Promise.all([
    captureModulesPromise,
    p2GateSnapshotsPromise,
    registerRowsPromise,
  ]);
  const { modules: captureModules, unavailable: captureModulesUnavailable } =
    captureRead;
  const captureValue = (capturePhase: number, key: string) => {
    const moduleRow = captureModules.find(
      (entry) => entry.moduleKey === phaseCaptureModuleKey(capturePhase, key),
    );
    const value = moduleRow?.state?.value;
    return typeof value === "string" ? value : "";
  };
  const p2GateRecordConfirmed = snapshotsApprovePhase(p2GateSnapshots, 2);
  const p2CatchUp =
    catchUpEnabled && !captureModulesUnavailable
      ? detectPhaseCatchUp({
          moveId: move.id,
          phase: 2,
          currentPhase: effectiveMove.currentPhase ?? 0,
          terminalComplete: effectiveMove.terminalComplete,
          gatePassed: getMovePhaseTallies(effectiveMove).some(
            (row) => row.phase === 2 && row.state === "done",
          ),
          gateRecordConfirmed: p2GateRecordConfirmed,
          rootCauses: captureValue(2, "gaps_root_causes"),
        })
      : null;
  if (deferCatchUpLanding && parsedPhase === 2) {
    const first = firstCatchUpHref(p2CatchUp ? [p2CatchUp] : []);
    if (first) redirect(first);
  }
  const initialBusinessChangeAssessment = captureValue(
    1,
    "business_change_assessment",
  );
  const [
    initialApprovedEvidenceReferences,
    initialApprovedP1CaptureEvidenceReferences,
  ] = await approvedEvidencePromise;
  // The design phase decides between options. When the Move's approved
  // evidence declares its own option set, that set — not a template one — is
  // what is offered and what gets recorded as approved.
  const [uploadedSolutionOptionSet, approvedSolutionOption] = await Promise.all(
    [
      parsedPhase === 3
        ? loadApprovedMoveEvidenceSnapshot({
            tenantKey: ctx.clientKey ?? ctx.clientId,
            moveId,
          })
            .then((snapshot) =>
              snapshot ? parseUploadedSolutionOptions(snapshot.rows) : null,
            )
            .catch(() => null)
        : Promise.resolve(null),
      parsedPhase === 3
        ? loadApprovedSolutionApproach({
            moveId,
            clientId: ctx.clientId,
          })
            .then((approved) =>
              approved
                ? {
                    selectedOptionId: approved.selectedOptionId,
                    chosenOption: approved.chosenOption,
                  }
                : null,
            )
            .catch(() => null)
        : Promise.resolve(null),
    ],
  );
  // The design decision already recorded for this Move. The page restores it
  // as the selected option, so a reload does not ask for it again.
  const initialConfirmedSolutionRoute = resolveConfirmedSolutionRoute({
    businessChangeAssessment: initialBusinessChangeAssessment,
    routeValidation: captureValue(2, "solution_route_validation"),
    approvedEvidenceReferences: initialApprovedEvidenceReferences.map(
      (item) => item.evidenceId,
    ),
  });
  // Every phase's saved-answer count, for the capture strip's unmeasured rows.
  // `captureModules` already holds EVERY capture-module row for the Move — the
  // loop below then keeps only the viewed phase's — so this is a derivation of
  // rows in hand, not a second read. Route-aware because P3's question set
  // depends on the confirmed route.
  const capturePhaseSavedAnswerCountsForStrip = capturePhaseRollupEnabled
    ? capturePhaseSavedAnswerCounts(
        captureModules,
        initialConfirmedSolutionRoute,
      )
    : undefined;
  const initialPhaseCaptureValues: Record<string, string> = {};
  const priorPhaseCaptureValues: Record<string, string> | null =
    parsedPhase > 0
      ? Object.fromEntries(
          [
            ...getPhaseCaptureSections(
              parsedPhase - 1,
              initialConfirmedSolutionRoute,
            ),
            ...phaseStepRecordSections(parsedPhase - 1),
          ].map((section) => [
            section.key,
            captureValue(parsedPhase - 1, section.key),
          ]),
        )
      : null;
  const initialP1CharterBasisBySection: Record<string, P1CharterBasisInput> =
    {};
  const initialReferenceDraftValues: Record<string, string> = {};
  // A saved step-page record (P3's design traceability) joins the values the
  // client autosaves, exactly as the capture route's snapshot includes it.
  for (const record of phaseStepRecordSections(parsedPhase)) {
    const value = captureValue(parsedPhase, record.key);
    if (value) initialPhaseCaptureValues[record.key] = value;
  }
  for (const section of getPhaseCaptureSections(
    parsedPhase,
    initialConfirmedSolutionRoute,
  )) {
    const moduleRow = captureModules.find(
      (entry) =>
        entry.moduleKey === phaseCaptureModuleKey(parsedPhase, section.key),
    );
    const value = moduleRow?.state?.value;
    initialPhaseCaptureValues[section.key] =
      typeof value === "string" ? value : "";
    if (parsedPhase === 1 && section.evidenceFamily) {
      const basisRecord = readP1CharterBasisRecord(
        moduleRow?.state,
        section.key,
        initialPhaseCaptureValues[section.key],
      );
      const basisInput = p1CharterBasisInputFromRecord(basisRecord);
      const sourceStillApproved =
        basisInput?.kind !== "approved_evidence" ||
        initialApprovedP1CaptureEvidenceReferences.some(
          (reference) =>
            reference.evidenceId === basisInput.evidenceId &&
            reference.familyKey === section.evidenceFamily,
        );
      if (basisInput && sourceStillApproved) {
        initialP1CharterBasisBySection[section.key] = basisInput;
      }
    }
    const referenceDraft = readSyntheticReferenceDraft(moduleRow);
    if (referenceDraft)
      initialReferenceDraftValues[section.key] = referenceDraft;
  }
  // The charter's assumptions on the register (`moves_assumption_register_v1`).
  // Runs on page load, server-side, and is idempotent on the charter section:
  // a section that already has a row is never written again, so a steady-state
  // load is one register read. It WRITES only once the Move is past the
  // charter, and only for a viewer who may change the register
  // (`charterBridgeMayWrite`). The P1 basis stays the declaration; the
  // register owns resolution.
  const charterBridgeWrites = charterBridgeMayWrite({
    currentPhase,
    policy: approvalPolicy,
    programId: move.id,
  });
  let sharedRegisterRows: AssumptionRecord[] | null =
    registerRead?.rows ?? null;
  const charterBridge = !assumptionRegisterEnabled
    ? null
    : captureModulesUnavailable
      ? ({ status: "unavailable" } as const)
      : await bridgeCharterAssumptions({
          ctx,
          programId: move.id,
          modules: captureModules.map((entry) => ({
            moduleKey: entry.moduleKey,
            status: entry.status,
            state: entry.state ?? null,
          })),
          write: charterBridgeWrites,
          records: sharedRegisterReadEnabled ? sharedRegisterRows : undefined,
          onRows: sharedRegisterReadEnabled
            ? (rows) => {
                sharedRegisterRows = rows;
              }
            : undefined,
        });
  const initialP2RegisterRows: AssumptionView[] | null | undefined =
    assumptionRegisterEnabled && parsedPhase === 2 && phaseStepPagesEnabled
      ? (sharedRegisterRows?.map((row) =>
          assumptionForViewer(row, {
            canViewFinancialData: approvalPolicy
              ? seesRegisterFigures(approvalPolicy, move.id)
              : false,
          }),
        ) ?? null)
      : undefined;
  // The charter answers P1 left standing on an assumption, read on P2 only.
  // `captureModules` already holds every module row for the Move (it is not
  // phase-scoped), so P1's rows are in hand here without a second load.
  const carriedCharterAssumptionRows = carriedCharterAssumptions({
    active: charterAssumptionCarryForwardActive({
      flagEnabled: charterAssumptionsInDiscoverEnabled,
      phaseNumber: parsedPhase,
    }),
    modules: captureModules.map((entry) => ({
      moduleKey: entry.moduleKey,
      status: entry.status,
      state: entry.state ?? null,
    })),
    resolutionReadEnabled: charterAssumptionResolutionEnabled,
    registerResolvedSectionKeys:
      charterBridge?.status === "ok" ? charterBridge.resolvedSectionKeys : null,
  });
  // The charter answers P3+ should not quote flat. Same Move-wide
  // `captureModules` as the carry-forward above, so P1's rows are in hand
  // without a second load; the fold owns the phase window and the flag pair.
  const charterStandingAfterDiscoverRows = charterStandingAfterDiscover({
    active: charterStandingAfterDiscoverActive({
      flagEnabled: charterStandingAfterDiscoverEnabled,
      resolutionReadEnabled: charterAssumptionResolutionEnabled,
      phaseNumber: parsedPhase,
    }),
    modules: captureModules.map((entry) => ({
      moduleKey: entry.moduleKey,
      status: entry.status,
      state: entry.state ?? null,
    })),
  });
  const initialPhaseCaptureRevision = computeCaptureRevision(
    initialPhaseCaptureValues,
    parsedPhase === 1 ? initialP1CharterBasisBySection : undefined,
  );
  const initialOriginationApproval =
    flaggedStepView && parsedPhase === 0 && selectedStepView === "p0-approve"
      ? await Promise.all([
          loadSnapshots(ctx, moveId).catch(() => null),
          readSet!(ctx, moveId, "originationApprovalRequests", () =>
            getOriginationRequestState(ctx, moveId, { readSet }),
          ).catch(() => null),
          loadProgram(ctx, moveId),
          loadModules(ctx, moveId).catch(() => null),
          readSet!(ctx, moveId, "deliverables", () =>
            getProgramDeliverables(ctx, moveId, { readSet }),
          ).catch(() => null),
        ]).then(
          ([snapshots, requests, declaredProgram, modules, deliverables]) => {
            const approval = originationApprovalReadback(
              moveId,
              snapshots,
              requests,
              declaredProgram?.lifecycleState,
            );
            if (
              approval.state === "recorded" &&
              declaredProgram?.currentPhase === 1 &&
              isFeatureEnabled(ctx, "moves_extended_intake_fields_v1")
            ) {
              const briefs = deliverables?.filter((row) =>
                [
                  "origination_brief",
                  "program_seed_brief",
                  "program_seed",
                ].includes(row.deliverable_type_key),
              );
              approval.captureCorrection =
                !snapshots || !modules || !deliverables
                  ? {
                      state: "unavailable",
                      reason: "Captured input consistency could not be read.",
                    }
                  : previewP0ReviewedCaptureCorrection({
                      program: declaredProgram,
                      actorId: ctx.userId,
                      snapshots,
                      modules,
                      signedBrief: briefs?.length === 1 ? briefs[0] : null,
                    });
            }
            return approval;
          },
        )
      : undefined;

  const initialP1ParticipantBinding = p1BindingPreview ? await p1BindingPreview : undefined;
  finish();

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
      }}
    >
      {phaseStepPagesEnabled && resolvedSearchParams.step ? (
        <span
          hidden
          data-testid="moves-step-server-timing"
          data-timings={JSON.stringify(serverTimings)}
        />
      ) : null}
      <MovesPhaseStandaloneClient
        initialAuthoredPhaseDocuments={(parsedPhase === 1 || parsedPhase === 2 && move.currentPhase === 2) &&
          isFeatureEnabled(ctx, authoredUploadFlag(parsedPhase as 1 | 2)) &&
          approvalPolicy?.canUploadArtifacts === true && approvalPolicy.canGenerateDeliverables === true &&
          (!Array.isArray(approvalPolicy.programIdsAllowed) || approvalPolicy.programIdsAllowed.includes(move.id)) ?
          <PhaseDocumentsPanel moveId={move.id} currentPhase={parsedPhase} compact presentationMode authoredAdmissionView /> : null}
        canApproveGates={canApproveGates}
        carriesForwardContent={carriesForwardContent}
        p3PriorPhaseContent={p3PriorPhaseContent}
        currentStateReadiness={currentStateReadiness}
        evidenceReadinessAvailable={evidenceReadinessAvailable}
        currentUser={{
          email: ctx.email ?? null,
          role: ctx.tenantRole ?? ctx.role ?? null,
        }}
        evidenceNeedPackets={evidenceNeedPackets}
        initialPhaseCaptureRevision={initialPhaseCaptureRevision}
        initialOriginationApproval={initialOriginationApproval}
        initialPhaseCaptureValues={initialPhaseCaptureValues}
        priorPhaseCaptureValues={priorPhaseCaptureValues}
        initialReferenceDraftValues={initialReferenceDraftValues}
        initialBusinessChangeAssessment={initialBusinessChangeAssessment}
        initialApprovedEvidenceReferences={initialApprovedEvidenceReferences}
        initialApprovedP1CaptureEvidenceReferences={
          initialApprovedP1CaptureEvidenceReferences
        }
        initialConfirmedSolutionRoute={initialConfirmedSolutionRoute}
        uploadedSolutionOptionSet={uploadedSolutionOptionSet}
        approvedSolutionOption={approvedSolutionOption}
        initialStageReadinessPreview={initialStageReadinessPreview}
        syntheticEvidencePackHref={syntheticEvidencePackHref}
        phaseBuildArtifacts={phaseBuildArtifacts}
        phaseBuildArtifactsAvailable={phaseBuildArtifactsAvailable}
        initialSignOffReadable={
          flaggedStepView && includeGateDocuments
            ? (deliverableSignOff?.available ?? false)
            : undefined
        }
        initialSubstepKey={
          parsedPhase === 0 && resolvedSearchParams.focus === "gate"
            ? "approve"
            : undefined
        }
        move={move}
        phaseNavigationStatus={phaseNavigationStatus}
        phaseNum={parsedPhase}
        phaseTallies={getMovePhaseTallies(effectiveMove)}
        pricingEngineEnabled={pricingEngineEnabled}
        riskAssessmentEnabled={riskAssessmentEnabled}
        solutionPatternGateEnabled={solutionPatternGateEnabled}
        captureV2Enabled={captureV2Enabled}
        stepPagesV3Enabled={stepPagesV3Enabled}
        phaseStepPagesEnabled={phaseStepPagesEnabled}
        p1ParticipantBindingEnabled={p1BindingActive}
        initialP1ParticipantBinding={initialP1ParticipantBinding}
        p5TowerHandoffEnabled={isFeatureEnabled(
          ctx,
          "moves_p5_tower_handoff_v1",
        )}
        catchUpEnabled={catchUpEnabled && !captureModulesUnavailable}
        p2RootCausesForCatchUp={captureValue(2, "gaps_root_causes")}
        p2GateRecordConfirmed={p2GateRecordConfirmed}
        initialP2RegisterRows={initialP2RegisterRows}
        legacyCaptureRequested={resolvedSearchParams.legacy === "1"}
        initialLegacySectionKey={
          typeof resolvedSearchParams.section === "string"
            ? resolvedSearchParams.section
            : null
        }
        romEngineEnabled={romEngineEnabled}
        deliveryOptionsEnabled={deliveryOptionsEnabled}
        priorPhaseCapture={
          stepPagesV3Enabled && parsedPhase === 3
            ? {
                gapsRootCauses: captureValue(2, "gaps_root_causes"),
                baselineMetrics: captureValue(2, "baseline_metrics"),
              }
            : null
        }
        initialStepView={
          phaseStepPagesEnabled && resolvedSearchParams.legacy !== "1"
            ? parseStepPageView(resolvedSearchParams.step)
            : null
        }
        initialWorkspaceView={
          resolvedSearchParams.workspace === "intelligence"
            ? "intelligence"
            : resolvedSearchParams.workspace === "files"
              ? "files"
              : "phase"
        }
        captureP0Enabled={captureP0Enabled}
        charterBasisEnabled={charterBasisEnabled}
        captureCompositionEnabled={captureCompositionEnabled}
        workspaceV2Enabled={workspaceV2Enabled}
        initialP1CharterBasisBySection={initialP1CharterBasisBySection}
        capturePhaseSavedAnswerCounts={capturePhaseSavedAnswerCountsForStrip}
        captureNotesEnabled={captureNotesEnabled}
        captureHandoffRecapEnabled={captureHandoffRecapEnabled}
        carriedCharterAssumptions={carriedCharterAssumptionRows}
        charterStandingAfterDiscover={charterStandingAfterDiscoverRows}
        assumptionRegister={
          charterBridge
            ? charterBridgeMount(move.id, charterBridge, charterBridgeWrites)
            : null
        }
        publicSourceReviewEnabled={publicSourceReviewEnabled}
      />
    </AppShell>
  );
}
