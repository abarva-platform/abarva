import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getModuleState, getStrategicMoveById } from "@/lib/programs/queries";
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
import { resolveConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";
import { listApprovedPhaseEvidence } from "@/lib/programs/approved-phase-evidence";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
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
import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import { listGeneratedArtifactsForMoveAllRefs } from "@/lib/artifacts/repository";
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
  type ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { phaseStepRecordSections } from "@/lib/programs/phase-workflow-registry";
import { parseStepPageView } from "@/lib/programs/step-page-views";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { capturePhaseSavedAnswerCounts } from "@/lib/programs/capture-phase-saved-answers";
import { loadP0MinimumEvidenceStatus } from "@/lib/programs/p0-source-evidence";
import { resolveEffectiveMovePhase } from "@/lib/programs/effective-move-phase";
import { loadApprovedMoveEvidenceSnapshot } from "@/lib/programs/approved-move-evidence-snapshot";
import { parseUploadedSolutionOptions } from "@/lib/programs/phase-templates/uploaded-solution-options";
import { loadApprovedSolutionApproach } from "@/lib/programs/approved-solution-approach";
import { buildGateCriteria } from "@/lib/programs/transformers";
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

  const loadedMove = await getStrategicMoveById(ctx, moveId);
  if (!loadedMove) notFound();
  const approvalPolicy = await loadUserProgramAccessPolicy(ctx, {
    programId: moveId,
  }).catch(() => null);
  const canApproveGates = approvalPolicy?.canApproveGates === true;
  const {
    effectivePhase: effectiveCurrentPhase,
    reopenedForEvidenceReview,
    reopenedForGateReview,
  } = await resolveEffectiveMovePhase(ctx, loadedMove);
  const move =
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
            { allowHistoricalPhase: reopenedForGateReview },
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
  const captureV2Enabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_capture_v2",
  );
  const stepPagesV3Enabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_step_pages_v3",
  );
  // P3 Step 4's bottom-up estimate prices through the ROM preview route, which
  // this flag gates; the step page needs it as well as the step-page flag.
  const romEngineEnabled = isFeatureEnabled(
    { clientKey: ctx.clientKey, clientId: ctx.clientId },
    "moves_rom_engine_v1",
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

  // CONJUNCTION with `moves_capture_v2`: the phase strip this rollup feeds is
  // part of the redesigned capture flow, so there is no row to label unless the
  // flow is what rendered.
  const capturePhaseRollupEnabled =
    captureV2Enabled &&
    isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_capture_phase_rollup_v1",
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
  const readinessWorkbookPhase = Math.min(parsedPhase, currentPhase);
  try {
    const tctx = await requireTenancy();
    const approvalArtifacts = await listMoveArtifacts(tctx, moveId, {
      family: "approval_artifact",
      currentOnly: true,
    });
    // Chosen by the same finder the gate route uses, so the page and the gate
    // judge the transition on the same upload.
    const currentProposalSet = findCurrentStageReadinessProposalSetArtifact(
      approvalArtifacts,
      readinessWorkbookPhase,
    );
    if (currentProposalSet) {
      const downloaded = await downloadArtifactBytes(
        tctx,
        currentProposalSet.artifact_id,
      );
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
          const storedReview = await loadStageReadinessStoredReview(
            tctx,
            moveId,
            readinessWorkbookPhase,
            {
              proposalSetId:
                initialStageReadinessPreview.proposalSet.proposalSetId ?? "",
              artifactId: currentProposalSet.artifact_id,
              artifactVersion: currentProposalSet.version,
            },
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
      const p0Evidence = await loadP0MinimumEvidenceStatus({
        tenantKey: tctx.clientKey ?? tctx.clientId,
        moveId,
      });
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
  }

  // Keep current-phase carry-forward separate from P2 evidence used to score
  // P3 options. Otherwise P3 can score itself from its own outputs and omit
  // the approved discovery limits that should constrain the design choice.
  let carriesForwardContent: DeliverableContentSignal[] = [];
  let p3PriorPhaseContent: DeliverableContentSignal[] = [];
  try {
    carriesForwardContent = await readPhaseGateContentSignals(
      moveId,
      parsedPhase,
    );
  } catch {
    carriesForwardContent = [];
  }
  if (parsedPhase === 3) {
    try {
      p3PriorPhaseContent = await readApprovedPhaseGateContentSignals(
        moveId,
        2,
      );
    } catch {
      p3PriorPhaseContent = [];
    }
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
  const captureValue = (capturePhase: number, key: string) => {
    const moduleRow = captureModules.find(
      (entry) => entry.moduleKey === phaseCaptureModuleKey(capturePhase, key),
    );
    const value = moduleRow?.state?.value;
    return typeof value === "string" ? value : "";
  };
  const initialBusinessChangeAssessment = captureValue(
    1,
    "business_change_assessment",
  );
  const initialApprovedEvidenceReferences = await listApprovedPhaseEvidence(
    ctx,
    move.id,
    2,
  );
  const initialApprovedP1CaptureEvidenceReferences =
    parsedPhase === 1 ? await listApprovedPhaseEvidence(ctx, move.id, 1) : [];
  // The design phase decides between options. When the Move's approved
  // evidence declares its own option set, that set — not a template one — is
  // what is offered and what gets recorded as approved.
  const uploadedSolutionOptionSet =
    parsedPhase === 3
      ? await loadApprovedMoveEvidenceSnapshot({
          tenantKey: ctx.clientKey ?? ctx.clientId,
          moveId,
        })
          .then((snapshot) =>
            snapshot ? parseUploadedSolutionOptions(snapshot.rows) : null,
          )
          .catch(() => null)
      : null;
  // The design decision already recorded for this Move. The page restores it
  // as the selected option, so a reload does not ask for it again.
  const approvedSolutionOption =
    parsedPhase === 3
      ? await loadApprovedSolutionApproach({
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
      : null;
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
      <MovesPhaseStandaloneClient
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
        initialPhaseCaptureValues={initialPhaseCaptureValues}
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
        captureV2Enabled={captureV2Enabled}
        stepPagesV3Enabled={stepPagesV3Enabled}
        romEngineEnabled={romEngineEnabled}
        priorPhaseCapture={
          stepPagesV3Enabled && parsedPhase === 3
            ? {
                gapsRootCauses: captureValue(2, "gaps_root_causes"),
                baselineMetrics: captureValue(2, "baseline_metrics"),
              }
            : null
        }
        initialStepView={
          stepPagesV3Enabled
            ? parseStepPageView(resolvedSearchParams.step)
            : null
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
      />
    </AppShell>
  );
}
