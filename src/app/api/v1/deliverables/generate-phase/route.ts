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
import {
  PHASE_CANONICAL_KEYS,
  DELIVERABLE_REGISTRY,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
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

    // Resolve the phase's canonical deliverables from the registry. These are the
    // documents an "Approve & Build" for this phase produces.
    let specs = (PHASE_CANONICAL_KEYS[phase] ?? [])
      .map((key) =>
        DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key),
      )
      .filter(Boolean) as DeliverableSpec[];

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

    const adaptiveDepth: AdaptiveDepthDecision = resolveAdaptiveDepth({
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
        useCaseArchetype,
        deliverableTypeKey: spec.deliverableTypeKey,
        deliverableType,
        decisionContext: [
          `${moveName} — ${clientSafePhaseLabel}: ${spec.documentPurpose}`,
          approvedApproachBlock,
        ]
          .filter(Boolean)
          .join("\n\n"),
        clientDisplayName,
        initiativeDisplayName: moveName,
        sourceArtifactRef: moveId,
        adaptiveDepth,
        ...(approvedApproachBlock
          ? { approvedSolutionApproach: approvedApproachBlock }
          : {}),
        ...(decisionLineage ? { decisionLineage } : {}),
      };
    };

    const results: EnqueuedDeliverable[] = [];
    if (phase === 3 && approvedSolutionApproach && decisionLineage) {
      try {
        const runs = await createSequentialDeliverableRunBatch(
          specs.map((spec, sequenceNo) => ({
            clientId: ctx.clientId,
            tenantKey: clientKey,
            userId: ctx.userId,
            module: "moves",
            archetype: useCaseArchetype,
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
            archetype: useCaseArchetype,
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
    // 202 if anything queued; 500 only if every deliverable failed to enqueue.
    return Response.json(
      {
        phase,
        phaseLabel,
        generationAttemptId,
        contextExtract,
        adaptiveDepth,
        omittedDeliverables,
        queued,
        total: results.length,
        deliverables: results,
      },
      { status: queued > 0 ? 202 : 500 },
    );
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    const message = errorMessage(err);
    console.error("[POST /api/v1/deliverables/generate-phase]", err);
    return Response.json({ error: "internal_error", message }, { status: 500 });
  }
}
