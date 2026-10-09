// POST /api/v1/deliverables/generate-phase
//
// Phase-level "Approve & Build": ENQUEUES every governed deliverable for a Move
// phase in one batch, rather than the client firing one generate call per document.
// This is the north-star action — a phase is approved and built as a unit, not a
// pile of per-deliverable buttons.
//
// Like /generate, it does NO model work: for each deliverable in the phase it
// validates and persists a self-contained queued run row, then returns 202 with the
// run ids. The durable ACA Job worker claims and runs each row; the client polls
// GET /deliverables/runs/{id} per returned run. Enqueue is best-effort per
// deliverable — a single deliverable that fails to enqueue is reported in its row
// with an error, and does not abort the others.

import { rootCauseCaptureText } from "@/lib/programs/root-cause-register";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  createDeliverableRun,
  createSequentialDeliverableRunBatch,
  type DeliverableRunJobPayload,
} from "@/lib/deliverables/orchestrator/runs-repository";
import {
  tenantInvariantHttpStatus,
  validateDeliverableTenantInvariant,
} from "@/lib/deliverables/orchestrator/tenant-invariant";
import { type DeliverableSpec } from "@/lib/programs/deliverable-registry";
import {
  resolvePhaseBuildSet,
  describeUnresolvedBuildSet,
} from "@/lib/programs/phase-build-set";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { resolvePhaseBuildUseCaseArchetype } from "@/lib/programs/deliverables/orchestrated/phase-build-use-case-archetype";
import {
  createMoveContextExtract,
  type MoveContextExtractResult,
} from "@/lib/programs/move-context-extract";
import {
  formatApprovedSolutionApproach,
  loadApprovedSolutionApproach,
  ARCHITECTURE_MODEL_VERSION,
} from "@/lib/programs/approved-solution-approach";
import {
  resolveAdaptiveDepth,
  shouldGenerateArtifact,
  type AdaptiveDepthDecision,
} from "@/lib/deliverables/adaptive-depth";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import {
  phaseBuildNotQueuedRefusal,
  type PhaseBuildEnqueueOutcome,
} from "@/lib/programs/phase-build-enqueue-refusal";
import { listApprovedPhaseEvidence } from "@/lib/programs/approved-phase-evidence";
import {
  approvedMoveEvidenceRevisionForPhase,
  loadApprovedMoveEvidenceSnapshot,
} from "@/lib/programs/approved-move-evidence-snapshot";
import {
  formatSolutionRouteForP4Prompt,
  formatSolutionRouteDepthForPrompt,
  resolveConfirmedSolutionRoute,
  type ConfirmedSolutionRoute,
} from "@/lib/programs/solution-route-assessment";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { formatEstimateModelForPrompt } from "@/lib/programs/estimate-model";
import {
  loadDiscoveryEvidenceReadiness,
  resolveDeclaredProgramArchetypeId,
} from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { currentPhaseRequiredEvidenceGaps } from "@/lib/programs/phase-progress-readiness";
import {
  appendEvidenceFrameworkProvenance,
  resolveEvidenceFrameworkProvenance,
  type EvidenceFrameworkProvenance,
} from "@/lib/programs/evidence-framework-provenance";
import { buildHeldByEvidenceDetail } from "@/lib/programs/evidence-readiness/evidence-waiver-availability";
import { phaseReadsPrecedingTransitionReview } from "@/lib/programs/stage-readiness-prompt-window";
import { applyStageReadinessToEvidencePackets } from "@/lib/programs/stage-readiness-workbooks/gate-readiness";
import { loadStageReadinessGateProposals } from "@/lib/programs/stage-readiness-workbooks/gate-proposal-context";
import {
  formatStageReadinessPromptContext,
  loadStageReadinessPromptContext,
} from "@/lib/programs/stage-readiness-workbooks/prompt-context";
import { unexpectedWalkStepFailureBody } from "@/lib/programs/walk-step-unexpected-failure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface GeneratePhaseBody {
  moveId?: string;
  phase?: number;
  useCaseArchetype?: string;
  moveName?: string;
  clientDisplayName?: string;
  generationAttemptId?: string;
  contextExtract?: {
    candidatePreview?: {
      enabled?: boolean;
      candidateVersionId?: string;
      acknowledgedNotActiveRuntimeTruth?: boolean;
    };
  };
}

interface EnqueuedDeliverable {
  deliverableTypeKey: string;
  documentTitle: string;
  deliverableType: string;
  gateArtifact: boolean;
  runId: string | null;
  status: "queued" | "error";
  error?: string;
}

interface OmittedDeliverable {
  deliverableTypeKey: string;
  documentTitle: string;
  applicability: string;
  reason: string;
  mergeInto?: string;
}

function errorMessage(err: unknown, fallback = "unknown error"): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err.trim();
  if (err && typeof err === "object") {
    const record = err as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts = [
      typeof record.message === "string" ? record.message : null,
      typeof record.code === "string" ? `code=${record.code}` : null,
      typeof record.details === "string" ? record.details : null,
      typeof record.hint === "string" ? record.hint : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" | ").slice(0, 1000);
    try {
      return JSON.stringify(err).slice(0, 1000);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeGenerationAttemptId(value: unknown): string {
  if (typeof value !== "string") return randomUUID();
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return normalized || randomUUID();
}

async function buildPhaseCaptureDecisionContext(args: {
  ctx: Awaited<ReturnType<typeof requireTenancy>>;
  moveId: string;
  phase: number;
  confirmedSolutionRoute?: ConfirmedSolutionRoute | null;
  modules?: Awaited<ReturnType<typeof getModuleState>>;
}): Promise<string | null> {
  const sections = getPhaseCaptureSections(
    args.phase,
    args.confirmedSolutionRoute,
  );
  if (sections.length === 0) return null;

  const modules = args.modules ?? (await getModuleState(args.ctx, args.moveId));
  const lines: string[] = [];
  for (const section of sections) {
    const moduleKey = phaseCaptureModuleKey(args.phase, section.key);
    const captureModule = modules.find(
      (entry) => entry.moduleKey === moduleKey,
    );
    const state = (captureModule?.state ?? {}) as Record<string, unknown>;
    const value = typeof state.value === "string" ? state.value.trim() : "";
    if (!value) continue;
    if (section.structured === "estimate-model") {
      const formatted = formatEstimateModelForPrompt(value);
      if (formatted) lines.push(formatted);
      continue;
    }
    lines.push(
      `- ${section.label}: ${
        section.key === "gaps_root_causes" ? rootCauseCaptureText(value) : value
      }`,
    );
  }
  if (lines.length === 0) return null;

  return [
    "SAVED PHASE CAPTURE (authoritative input for this build)",
    `Use these captured values as the primary source for this phase artifact. Do not replace them with generic tenant context, and do not re-collect them in the artifact.`,
    ...lines,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    if (!ctx.clientKey) {
      return Response.json(
        {
          error: "no_tenant_key",
          detail: "Active tenant has no resolvable tenant key.",
        },
        { status: 409 },
      );
    }
    const clientKey = ctx.clientKey;

    let body: GeneratePhaseBody;
    try {
      body = (await req.json()) as GeneratePhaseBody;
    } catch {
      return Response.json(
        { error: "bad_request", detail: "Body was not valid JSON." },
        { status: 400 },
      );
    }

    const moveId = body.moveId?.trim();
    const phase = Number(body.phase);
    const useCaseArchetype = body.useCaseArchetype?.trim();
    if (!moveId)
      return Response.json(
        { error: "bad_request", detail: "moveId is required." },
        { status: 400 },
      );
    if (!Number.isInteger(phase) || phase < 1 || phase > 5) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer 1–5." },
        { status: 400 },
      );
    }
    if (!useCaseArchetype)
      return Response.json(
        { error: "bad_request", detail: "useCaseArchetype is required." },
        { status: 400 },
      );

    const moveName = body.moveName?.trim() || "Strategic Move";
    const clientDisplayName = body.clientDisplayName?.trim() || "Client";
    const generationAttemptId = normalizeGenerationAttemptId(
      body.generationAttemptId,
    );

    const tenantInvariant = await validateDeliverableTenantInvariant({
      module: "moves",
      sourceArtifactRef: moveId,
      clientId: ctx.clientId,
      tenantKey: clientKey,
    });
    if (!tenantInvariant.ok) {
      return Response.json(
        {
          error: tenantInvariant.code,
          detail: tenantInvariant.detail,
          sourceKind: tenantInvariant.sourceKind,
          sourceId: tenantInvariant.sourceId,
          expectedTenantKey: tenantInvariant.expectedTenantKey,
          actualTenantKey: tenantInvariant.actualTenantKey,
        },
        { status: tenantInvariantHttpStatus(tenantInvariant) },
      );
    }

    const captureModules = await getModuleState(ctx, moveId).catch(() => []);
    const captureValue = (capturePhase: number, key: string) => {
      const captureModule = captureModules.find(
        (entry) => entry.moduleKey === phaseCaptureModuleKey(capturePhase, key),
      );
      const value = captureModule?.state?.value;
      return typeof value === "string" ? value : "";
    };
    if (
      phase === 4 &&
      !formatEstimateModelForPrompt(captureValue(4, "estimates_capacity"))
    ) {
      return Response.json(
        {
          error: "estimate_model_review_required",
          detail:
            "Complete the internal/vendor role-based estimate, review the low/base/high calculations, and record a human reviewer before building the roadmap package.",
          nextAction:
            "Return to Estimates & capacity, resolve open inputs, and confirm the estimate review.",
        },
        { status: 409 },
      );
    }
    const confirmedSolutionRoute =
      phase >= 3
        ? resolveConfirmedSolutionRoute({
            businessChangeAssessment: captureValue(
              1,
              "business_change_assessment",
            ),
            routeValidation: captureValue(2, "solution_route_validation"),
            approvedEvidenceReferences: (
              await listApprovedPhaseEvidence(ctx, moveId, 2)
            ).map((item) => item.evidenceId),
          })
        : null;
    if (phase === 3 && !confirmedSolutionRoute) {
      return Response.json(
        {
          error: "solution_route_validation_required",
          detail:
            "Complete the P1 business-change assessment and validate the P2 solution route against approved evidence before building P3 outputs.",
          nextAction:
            "Return to P2, select an approved evidence item, and confirm or correct the recommended route.",
        },
        { status: 409 },
      );
    }

    let requiredEvidenceGaps: ReturnType<
      typeof currentPhaseRequiredEvidenceGaps
    >;
    // What chose the framework the gaps below were measured against. Stays
    // `null` if readiness never loaded, so the refusal cannot claim a
    // declaration it did not read.
    let evidenceFramework: EvidenceFrameworkProvenance | null = null;
    let acceptedStageReadinessPrompt = "";
    try {
      const readiness = await loadDiscoveryEvidenceReadiness(ctx, moveId);
      evidenceFramework = resolveEvidenceFrameworkProvenance(readiness);
      let packets = buildMoveEvidenceNeedPackets({
        moveId,
        moveName,
        currentPhase: phase,
        readiness,
      });
      if (phase >= 1 && phase <= 4) {
        // The gate reading takes the review as it stands, under its own
        // required-only policy. See `gate-proposal-context`.
        const transitionProposals = await loadStageReadinessGateProposals(
          ctx,
          moveId,
          phase + 1,
        );
        packets = applyStageReadinessToEvidencePackets(
          packets,
          phase,
          transitionProposals,
          moveId,
        );
      }
      if (phaseReadsPrecedingTransitionReview(phase)) {
        // The prompt gets every accepted answer on the preceding transition's
        // review, whether or not that review is finished. The finished-review
        // policy belongs to the forward controls above, not here.
        //
        // The window starts at P1, not P2: the P0 to P1 workbook is served,
        // offered and reviewed like any other, so P1 Charter — the first
        // generating phase — has a preceding transition to read. See
        // `stage-readiness-prompt-window`.
        const currentPhaseContext = await loadStageReadinessPromptContext(
          ctx,
          moveId,
          phase,
        );
        acceptedStageReadinessPrompt =
          formatStageReadinessPromptContext(currentPhaseContext);
      }
      requiredEvidenceGaps = currentPhaseRequiredEvidenceGaps(packets, phase);
    } catch (err) {
      console.error("[generate-phase] evidence_readiness_unavailable", {
        moveId,
        phase,
        message: errorMessage(err),
      });
      return Response.json(
        {
          error: "evidence_readiness_unavailable",
          detail:
            "Required evidence readiness could not be verified. No phase build was queued; retry after evidence readiness is available.",
        },
        { status: 503 },
      );
    }
    if (requiredEvidenceGaps.length > 0) {
      return Response.json(
        {
          error: "required_evidence_open",
          // The count and the slot names are correct; what needs saying is
          // whether a declaration chose the framework they came from.
          detail: appendEvidenceFrameworkProvenance(
            buildHeldByEvidenceDetail(requiredEvidenceGaps.length),
            evidenceFramework,
          ),
          requiredEvidenceGaps: requiredEvidenceGaps.map((gap) => ({
            evidenceSlot: gap.evidenceSlot,
            status: gap.status,
            nextAction: gap.nextAction,
          })),
          evidenceFramework,
          nextAction:
            "Upload the minimum required source evidence, review the extracted facts, and approve or formally waive each required item before building.",
        },
        { status: 409 },
      );
    }

    // Resolve the phase's canonical deliverables from the registry. These are the
    // documents an "Approve & Build" for this phase produces.
    // A declared key that does not resolve is NOT dropped. Building the rest would
    // report success while the phase gate goes on to ask for a document this build
    // could never produce, so the build refuses and names the keys.
    const buildSet = resolvePhaseBuildSet(phase, confirmedSolutionRoute);
    if (buildSet.unresolvedKeys.length > 0) {
      return Response.json(
        {
          error: "phase_build_set_unresolvable",
          detail: describeUnresolvedBuildSet(phase, buildSet.unresolvedKeys),
          unresolvedDeliverableKeys: buildSet.unresolvedKeys,
        },
        { status: 500 },
      );
    }
    let specs = buildSet.specs;

    if (specs.length === 0) {
      return Response.json(
        {
          error: "no_deliverables",
          detail: `Phase ${phase} has no configured deliverables to build.`,
        },
        { status: 422 },
      );
    }

    const phaseLabel = specs[0]?.phaseLabel ?? `P${phase}`;
    // The registry's phaseLabel (e.g. "P4 Roadmap & Business Case") is an internal
    // gate name — it must never reach the model's prompt verbatim. decisionContext IS
    // sent to the model (prompt-builder.ts), so a model faithfully following its own
    // instructions will naturally echo "P4" back into the client-facing narrative,
    // which the non_mechanical_writing gate then (correctly) blocks. Strip the leading
    // "P<n>" token for the client-safe decision framing; phaseLabel itself is kept
    // as-is for the route's own response (internal/ops-facing, not model input).
    const clientSafePhaseLabel =
      phaseLabel.replace(/^P\d+\s*/i, "").trim() || "this phase";

    // P3 is deliberately split into two governed decisions. The option set is
    // shaped first; target architecture and the companion design artifacts may
    // only build after a human has signed off one option. Enforce this at the
    // batch boundary so older clients and direct API callers cannot bypass it.
    const approvedSolutionApproach =
      phase === 3
        ? await loadApprovedSolutionApproach({
            moveId,
            clientId: ctx.clientId,
          })
        : null;
    if (phase === 3 && !approvedSolutionApproach) {
      return Response.json(
        {
          error: "solution_approach_approval_required",
          detail:
            "Select and approve a P3 solution option before building target architecture, solution design, operating model, or sourcing strategy.",
          nextAction:
            "Review the solution options, record the decision rationale and accepted tradeoffs, then run Approve & Build again.",
        },
        { status: 409 },
      );
    }
    const approvedApproachBlock = approvedSolutionApproach
      ? formatApprovedSolutionApproach(approvedSolutionApproach)
      : null;

    // The archetype this route is HANDED (`useCaseArchetype`) is the Move's
    // coarse program archetype, and not one of its five possible values names a
    // discovery blueprint or an archetype pack. Resolve what a human actually
    // DECLARED for this Move and pass that alongside, so the context extract
    // grades evidence against the declared framework instead of one keyword
    // inference picked. `resolveDeclaredProgramArchetypeId` is the same rule the
    // upload, solution-pattern and risk-assessment routes already apply — this
    // path was the one resolving nothing.
    //
    // Best-effort on purpose: a failed read must not fail the enqueue, and
    // `null` is exactly today's behavior.
    let declaredArchetypeId: string | null = null;
    try {
      declaredArchetypeId = resolveDeclaredProgramArchetypeId(
        await getProgramById(ctx, moveId),
      );
    } catch {
      declaredArchetypeId = null;
    }

    // The archetype this route is HANDED is `move.archetype`, the coarse legacy
    // UI column, and none of its values names an archetype in either the
    // archetype-pack or discovery-blueprint catalog. The worker rebuilds the
    // orchestrator request from the persisted payload alone, so it never
    // reaches the in-process precedence rule in `build-request.ts` — the
    // declaration resolved just above has to reach the PAYLOAD or the queued
    // build composes against no declared archetype at all.
    //
    // A request that already names a real archetype still wins, so this is a
    // no-op for any caller sending one.
    const buildArchetype = resolvePhaseBuildUseCaseArchetype({
      requestedArchetype: useCaseArchetype,
      declaredArchetypeId,
    });
    const buildUseCaseArchetype = buildArchetype.useCaseArchetype;

    let contextExtract: MoveContextExtractResult | null = null;
    try {
      contextExtract = await createMoveContextExtract({
        ctx,
        moveId,
        tenantKey: clientKey,
        phase,
        targetPhase: phase,
        moveName,
        useCaseArchetype,
        declaredArchetypeId,
        phaseLabel,
        phasePurpose: specs.map((spec) => spec.documentPurpose).join(" "),
        candidatePreview: {
          enabled:
            req.headers.get("x-abarva-candidate-preview-mode") === "enabled" &&
            body.contextExtract?.candidatePreview?.enabled === true,
          candidateVersionId:
            body.contextExtract?.candidatePreview?.candidateVersionId?.trim(),
          acknowledgedNotActiveRuntimeTruth:
            body.contextExtract?.candidatePreview
              ?.acknowledgedNotActiveRuntimeTruth === true,
        },
      });
    } catch (err) {
      contextExtract = {
        status: "error",
        extractId: null,
        artifactId: null,
        evidenceId: null,
        moveId,
        tenantKey: clientKey,
        sourceMode: "active_home_context",
        phase,
        targetPhase: phase,
        activeTenantAccessVersionId: null,
        candidateVersionId: null,
        sourceBuildId: null,
        attachedEvidenceItems: [],
        suggestedContextItems: [],
        excludedContextItems: [],
        gapItems: [
          {
            status: "gap",
            label: "Move Context Extract",
            summary: "Context extract failed before generation enqueue.",
            reason: errorMessage(err),
            sourceMode: "active_home_context",
          },
        ],
        freshness: {
          extractId: null,
          moveId,
          tenantKey: clientKey,
          evidenceFingerprint: "error",
          approvedEvidenceRevision: null,
          attachedEvidenceCount: 0,
          acceptedEvidenceCount: 0,
          latestEvidenceUpdatedAt: null,
          blueprintId: "unknown",
          blueprintVersion: "unknown",
          createdAt: new Date().toISOString(),
          freshnessStatus: "rebuild_required",
        },
        generatedAt: new Date().toISOString(),
        message: errorMessage(err),
      };
    }

    const evidenceSnapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: clientKey,
      moveId,
    });
    const evidenceSnapshotHash = evidenceSnapshot?.revision;
    const phaseEvidenceSnapshotHash = evidenceSnapshot
      ? approvedMoveEvidenceRevisionForPhase(evidenceSnapshot, phase)
      : null;
    if (
      !contextExtract ||
      contextExtract.status === "error" ||
      !evidenceSnapshotHash ||
      !phaseEvidenceSnapshotHash ||
      contextExtract.freshness.approvedEvidenceRevision !==
        phaseEvidenceSnapshotHash
    ) {
      return Response.json(
        {
          error: "evidence_snapshot_unavailable",
          detail:
            "The current approved-evidence revision could not be captured. No phase build was queued; retry after evidence review state is available.",
        },
        { status: 503 },
      );
    }

    const decisionLineage = approvedSolutionApproach
      ? {
          decisionHash: approvedSolutionApproach.decisionHash,
          decisionVersion: approvedSolutionApproach.decisionVersion,
          approvedOptionId: approvedSolutionApproach.selectedOptionId,
          approvedOptionVersion: approvedSolutionApproach.selectedOptionVersion,
          contextSnapshotHash:
            contextExtract?.freshness.evidenceFingerprint ??
            "context-extract-error",
          architectureModelVersion: ARCHITECTURE_MODEL_VERSION,
        }
      : null;

    const phaseCaptureContext = await buildPhaseCaptureDecisionContext({
      ctx,
      moveId,
      phase,
      confirmedSolutionRoute,
      modules: captureModules,
    });
    const solutionRoutePromptBlock =
      phase === 3
        ? formatSolutionRouteDepthForPrompt(confirmedSolutionRoute)
        : phase === 4
          ? formatSolutionRouteForP4Prompt(confirmedSolutionRoute)
          : null;

    const adaptiveDepth: AdaptiveDepthDecision = resolveAdaptiveDepth({
      archetype: useCaseArchetype,
      text: [
        useCaseArchetype,
        moveName,
        phaseLabel,
        approvedApproachBlock,
        contextExtract
          ? JSON.stringify({
              attachedEvidenceItems: contextExtract.attachedEvidenceItems,
              suggestedContextItems: contextExtract.suggestedContextItems,
              gapItems: contextExtract.gapItems,
            })
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      artifactKeys: [
        ...specs.map((spec) => spec.deliverableTypeKey),
        ...specs.map((spec) =>
          orchestratorDeliverableType(spec.deliverableTypeKey),
        ),
      ],
    });
    const omittedDeliverables: OmittedDeliverable[] = specs
      .filter(
        (spec) =>
          !shouldGenerateArtifact(adaptiveDepth, spec.deliverableTypeKey),
      )
      .map((spec) => {
        const decision =
          adaptiveDepth.artifactApplicability[spec.deliverableTypeKey];
        return {
          deliverableTypeKey: spec.deliverableTypeKey,
          documentTitle: spec.documentTitle,
          applicability: decision?.applicability ?? "not_applicable",
          reason: decision?.reason ?? "Not applicable to this Move.",
          ...(decision?.mergeInto ? { mergeInto: decision.mergeInto } : {}),
        };
      });
    specs = specs.filter((spec) =>
      shouldGenerateArtifact(adaptiveDepth, spec.deliverableTypeKey),
    );

    if (specs.length === 0) {
      return Response.json(
        {
          error: "no_applicable_deliverables",
          detail: `Phase ${phase} has no applicable deliverables after adaptive-depth resolution.`,
          adaptiveDepth,
          omittedDeliverables,
        },
        { status: 422 },
      );
    }

    const payloadFor = (spec: DeliverableSpec): DeliverableRunJobPayload => {
      const deliverableType = orchestratorDeliverableType(
        spec.deliverableTypeKey,
      );
      return {
        module: "moves",
        useCaseArchetype: buildUseCaseArchetype,
        deliverableTypeKey: spec.deliverableTypeKey,
        deliverableType,
        decisionContext: [
          `${moveName} — ${clientSafePhaseLabel}: ${spec.documentPurpose}`,
          phaseCaptureContext,
          acceptedStageReadinessPrompt,
          solutionRoutePromptBlock,
          approvedApproachBlock,
        ]
          .filter(Boolean)
          .join("\n\n"),
        clientDisplayName,
        initiativeDisplayName: moveName,
        sourceArtifactRef: moveId,
        phase,
        adaptiveDepth,
        ...(approvedApproachBlock
          ? { approvedSolutionApproach: approvedApproachBlock }
          : {}),
        ...(decisionLineage ? { decisionLineage } : {}),
        evidenceSnapshotHash,
        phaseEvidenceSnapshotHash,
      };
    };

    const results: EnqueuedDeliverable[] = [];
    // Which enqueue path ran, declared where it is chosen rather than inferred
    // from the result rows later. The two paths differ in what they may have
    // written when nothing ends up queued, and the refusal below has to say
    // which — see `phase-build-enqueue-refusal`. Deliberately left unassigned:
    // a third enqueue path that forgets to declare its outcome is a compile
    // error here, not a path that silently inherits another one's claim.
    let enqueueOutcome: PhaseBuildEnqueueOutcome;
    if (phase === 3 && approvedSolutionApproach && decisionLineage) {
      // The batch call reports success or throws; reaching the response with
      // nothing queued means it was accepted and still returned no run.
      enqueueOutcome = "accepted_without_runs";
      try {
        const runs = await createSequentialDeliverableRunBatch(
          specs.map((spec, sequenceNo) => ({
            clientId: ctx.clientId,
            tenantKey: clientKey,
            userId: ctx.userId,
            module: "moves",
            archetype: buildUseCaseArchetype,
            deliverableType: orchestratorDeliverableType(
              spec.deliverableTypeKey,
            ),
            jobPayload: payloadFor(spec),
            sequenceNo,
          })),
          {
            idempotencyKey: [
              moveId,
              phase,
              decisionLineage.decisionHash,
              decisionLineage.contextSnapshotHash,
              contextExtract?.extractId ?? "context-extract-missing",
              generationAttemptId,
            ].join(":"),
          },
        );
        specs.forEach((spec, index) => {
          const run = runs[index];
          results.push({
            deliverableTypeKey: spec.deliverableTypeKey,
            documentTitle: spec.documentTitle,
            deliverableType: orchestratorDeliverableType(
              spec.deliverableTypeKey,
            ),
            gateArtifact: spec.gateArtifact,
            runId: run?.id ?? null,
            status: run ? "queued" : "error",
            ...(!run
              ? { error: "atomic P3 assembly did not return a run" }
              : {}),
          });
        });
      } catch (err) {
        return Response.json(
          {
            error: "p3_assembly_enqueue_failed",
            detail: errorMessage(err, "atomic P3 assembly enqueue failed"),
          },
          { status: 500 },
        );
      }
    } else {
      // Each spec is its own insert, which throws only when the insert itself
      // failed, so every attempt throwing means no run row exists.
      enqueueOutcome = "every_attempt_failed";
      for (const spec of specs) {
        const deliverableType = orchestratorDeliverableType(
          spec.deliverableTypeKey,
        );
        try {
          const run = await createDeliverableRun({
            clientId: ctx.clientId,
            tenantKey: clientKey,
            userId: ctx.userId,
            module: "moves",
            archetype: buildUseCaseArchetype,
            deliverableType,
            jobPayload: payloadFor(spec),
          });
          results.push({
            deliverableTypeKey: spec.deliverableTypeKey,
            documentTitle: spec.documentTitle,
            deliverableType,
            gateArtifact: spec.gateArtifact,
            runId: run.id,
            status: "queued",
          });
        } catch (err) {
          results.push({
            deliverableTypeKey: spec.deliverableTypeKey,
            documentTitle: spec.documentTitle,
            deliverableType,
            gateArtifact: spec.gateArtifact,
            runId: null,
            status: "error",
            error: errorMessage(err, "enqueue failed"),
          });
        }
      }
    }

    const queued = results.filter((r) => r.status === "queued").length;
    const enqueueReport = {
      phase,
      phaseLabel,
      generationAttemptId,
      contextExtract,
      adaptiveDepth,
      omittedDeliverables,
      ...(confirmedSolutionRoute ? { confirmedSolutionRoute } : {}),
      queued,
      total: results.length,
      deliverables: results,
    };
    // 202 if anything queued; 500 only if every deliverable failed to enqueue.
    // That 500 used to carry no `error` and no `detail`, so the one product
    // fetcher's ladder fell through to the literal `HTTP 500` and the
    // per-document reasons below were drawn nowhere. They were logged nowhere
    // either: each rejection is caught into a result row, so the most complete
    // failure this route can have was its quietest.
    if (queued === 0) {
      console.error("[generate-phase] phase_build_not_queued", {
        moveId,
        phase,
        enqueueOutcome,
        attempted: results.length,
        reasons: results.map((result) => ({
          deliverableTypeKey: result.deliverableTypeKey,
          error: result.error ?? null,
        })),
      });
      return Response.json(
        {
          ...enqueueReport,
          ...phaseBuildNotQueuedRefusal({
            phase,
            attempted: results.length,
            outcome: enqueueOutcome,
          }),
        },
        { status: 500 },
      );
    }
    return Response.json(enqueueReport, { status: 202 });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error(
      "[POST /api/v1/deliverables/generate-phase]",
      errorMessage(err),
      err,
    );
    return Response.json(
      unexpectedWalkStepFailureBody("phase_deliverable_build"),
      { status: 500 },
    );
  }
}
