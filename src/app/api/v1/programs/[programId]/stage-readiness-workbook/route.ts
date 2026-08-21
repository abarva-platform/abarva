import { createHash } from "node:crypto";

import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  downloadArtifactBytes,
  getMoveArtifactForTenant,
} from "@/lib/programs/deliverables/move-artifacts";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getProgramById } from "@/lib/programs/queries";
import { parseStageReadinessWorkbookXlsx } from "@/lib/programs/stage-readiness-workbooks/parser";
import {
  persistStageReadinessProposalReview,
  persistStageReadinessProposalSet,
  STAGE_READINESS_PROPOSAL_SET_ARTIFACT_TYPE,
  type StageReadinessProposalDecision,
  type StageReadinessWorkbookProposalSet,
} from "@/lib/programs/stage-readiness-workbooks/proposals";
import { buildStageReadinessWorkbookSpec } from "@/lib/programs/stage-readiness-workbooks/resolver";
import { renderStageReadinessWorkbookXlsx } from "@/lib/programs/stage-readiness-workbooks/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(
  value: string | null | undefined,
  fallback: number,
): number | null {
  const raw =
    value === null || value === undefined || value === ""
      ? fallback
      : Number(value);
  if (!Number.isInteger(raw) || raw < 0 || raw > 4) return null;
  return raw;
}

function safeFilenamePart(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "move";
}

function isReviewDisposition(
  value: unknown,
): value is StageReadinessProposalDecision["disposition"] {
  return (
    value === "accepted" || value === "rejected" || value === "needs_validation"
  );
}

function decodeWorkbookBase64(value: string): Buffer | null {
  const normalized = value.trim().replace(/^data:[^,]+,/, "");
  if (
    normalized.length === 0 ||
    !/^[a-z0-9+/]+={0,2}$/i.test(normalized) ||
    normalized.length % 4 === 1
  ) {
    return null;
  }
  const decoded = Buffer.from(normalized, "base64");
  if (decoded.length === 0) return null;
  return decoded;
}

async function readUploadedWorkbook(
  req: Request,
): Promise<
  { ok: true; bytes: Buffer } | { ok: false; status: number; detail: string }
> {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return {
        ok: false,
        status: 400,
        detail: "invalid JSON body",
      };
    }
    const payload = body as { workbookBase64?: unknown; fileBase64?: unknown };
    const raw =
      typeof payload.workbookBase64 === "string"
        ? payload.workbookBase64
        : typeof payload.fileBase64 === "string"
          ? payload.fileBase64
          : "";
    const decoded = decodeWorkbookBase64(raw);
    if (!decoded) {
      return {
        ok: false,
        status: 400,
        detail: "workbookBase64 is required",
      };
    }
    return { ok: true, bytes: decoded };
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return {
      ok: false,
      status: 400,
      detail: "invalid multipart form data",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return {
      ok: false,
      status: 400,
      detail: "file is required",
    };
  }

  return { ok: true, bytes: Buffer.from(await file.arrayBuffer()) };
}

async function readProposalSetArtifact(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  artifactId: string,
  expectedVersion: number | null,
): Promise<
  | {
      ok: true;
      artifactVersion: number | null;
      proposalSet: StageReadinessWorkbookProposalSet;
    }
  | { ok: false; status: number; detail: string }
> {
  const artifact = await getMoveArtifactForTenant(ctx, artifactId);
  if (!artifact) {
    return {
      ok: false,
      status: 404,
      detail: "proposal set artifact not found",
    };
  }
  if (artifact.move_id !== programId) {
    return {
      ok: false,
      status: 404,
      detail: "proposal set artifact not found",
    };
  }
  if (artifact.artifact_type !== STAGE_READINESS_PROPOSAL_SET_ARTIFACT_TYPE) {
    return {
      ok: false,
      status: 400,
      detail: "artifact is not a stage readiness proposal set",
    };
  }
  if (expectedVersion !== null && artifact.version !== expectedVersion) {
    return {
      ok: false,
      status: 409,
      detail: "proposal set version changed; reload before reviewing",
    };
  }

  const downloaded = await downloadArtifactBytes(ctx, artifactId);
  if (!downloaded) {
    return {
      ok: false,
      status: 424,
      detail: "proposal set bytes are not available for review",
    };
  }

  try {
    const proposalSet = JSON.parse(
      downloaded.bytes.toString("utf-8"),
    ) as StageReadinessWorkbookProposalSet;
    if (proposalSet.moveId !== programId) {
      return {
        ok: false,
        status: 400,
        detail: "proposal set move id does not match this route",
      };
    }
    return { ok: true, artifactVersion: artifact.version, proposalSet };
  } catch {
    return {
      ok: false,
      status: 422,
      detail: "proposal set artifact is not valid JSON",
    };
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    const url = new URL(req.url);
    const phase = parsePhase(
      url.searchParams.get("phase"),
      program.currentPhase ?? 1,
    );
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,4]" },
        { status: 400 },
      );
    }

    const nextPhase = phase + 1;
    const readiness = await loadDiscoveryEvidenceReadiness(ctx, programId);
    const evidenceNeedPackets = buildMoveEvidenceNeedPackets({
      moveId: programId,
      moveName: program.name ?? "Move",
      currentPhase: phase,
      readiness,
    });
    const spec = buildStageReadinessWorkbookSpec({
      moveId: programId,
      moveName: program.name ?? "Move",
      phase,
      nextPhase,
      archetype: readiness.archetypeLabel,
      readiness,
      evidenceNeedPackets,
      generatedAt: new Date().toISOString(),
    });
    const workbook = await renderStageReadinessWorkbookXlsx(spec);
    const filename = `${safeFilenamePart(program.name ?? programId)}-p${phase}-p${nextPhase}-readiness-workbook.xlsx`;

    return new Response(new Uint8Array(workbook), {
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, max-age=0, no-store",
        "x-abarva-workbook-id": spec.workbookId,
        "x-abarva-workbook-hash": spec.metadata.workbookContentHash,
      },
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      console.error(
        "[GET /api/v1/programs/:programId/stage-readiness-workbook]",
        error,
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    const url = new URL(req.url);
    const phase = parsePhase(
      url.searchParams.get("phase"),
      program.currentPhase ?? 1,
    );
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,4]" },
        { status: 400 },
      );
    }

    const uploaded = await readUploadedWorkbook(req);
    if (!uploaded.ok) {
      return Response.json(
        { error: "bad_request", detail: uploaded.detail },
        { status: uploaded.status },
      );
    }

    const uploadedWorkbook = uploaded.bytes;
    const uploadedWorkbookSha256 = createHash("sha256")
      .update(uploadedWorkbook)
      .digest("hex");
    const parsed = await parseStageReadinessWorkbookXlsx(uploadedWorkbook, {
      expectedMoveId: programId,
      expectedPhase: phase,
    });
    const persistedProposalSet = parsed.ok
      ? await persistStageReadinessProposalSet({
          ctx,
          program,
          parsed,
          uploadedWorkbookSha256,
        })
      : null;

    return Response.json(
      {
        ok: parsed.ok,
        metadata: parsed.metadata,
        responses: parsed.responses,
        issues: parsed.issues,
        summary: parsed.summary,
        proposalSet: persistedProposalSet
          ? {
              proposalSetId: persistedProposalSet.proposalSet.proposalSetId,
              artifactId: persistedProposalSet.artifactId,
              artifactVersion: persistedProposalSet.artifactVersion,
              status: "review_required",
              proposalCount:
                persistedProposalSet.proposalSet.summary.proposalCount,
              pendingCount:
                persistedProposalSet.proposalSet.summary.pendingCount,
              answerStates:
                persistedProposalSet.proposalSet.summary.answerStates,
              proposals: persistedProposalSet.proposalSet.proposals.map(
                (proposal) => ({
                  proposalId: proposal.proposalId,
                  questionId: proposal.questionId,
                  dimensionId: proposal.dimensionId,
                  requirement: proposal.requirement,
                  question: proposal.question,
                  response: proposal.response,
                  answerState: proposal.answerState,
                  disposition: proposal.disposition,
                }),
              ),
              blobStored: persistedProposalSet.blobStored,
              message:
                "Workbook responses were stored as pending proposals. They do not feed P2 until accepted.",
            }
          : null,
      },
      { status: parsed.ok ? 200 : 422 },
    );
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      console.error(
        "[POST /api/v1/programs/:programId/stage-readiness-workbook]",
        error,
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "bad_request", detail: "invalid JSON body" },
        { status: 400 },
      );
    }

    const payload = body as {
      proposalSetArtifactId?: unknown;
      proposalSetArtifactVersion?: unknown;
      decisions?: unknown;
    };
    const proposalSetArtifactId =
      typeof payload.proposalSetArtifactId === "string"
        ? payload.proposalSetArtifactId.trim()
        : "";
    if (!proposalSetArtifactId) {
      return Response.json(
        { error: "bad_request", detail: "proposalSetArtifactId is required" },
        { status: 400 },
      );
    }
    const proposalSetArtifactVersion =
      typeof payload.proposalSetArtifactVersion === "number" &&
      Number.isInteger(payload.proposalSetArtifactVersion)
        ? payload.proposalSetArtifactVersion
        : null;
    if (!Array.isArray(payload.decisions) || payload.decisions.length === 0) {
      return Response.json(
        { error: "bad_request", detail: "at least one decision is required" },
        { status: 400 },
      );
    }
    const decisions: StageReadinessProposalDecision[] = [];
    for (const decision of payload.decisions) {
      const item = decision as {
        proposalId?: unknown;
        disposition?: unknown;
        note?: unknown;
      };
      const proposalId =
        typeof item.proposalId === "string" ? item.proposalId.trim() : "";
      if (!proposalId || !isReviewDisposition(item.disposition)) {
        return Response.json(
          {
            error: "bad_request",
            detail:
              "each decision requires proposalId and disposition accepted/rejected/needs_validation",
          },
          { status: 400 },
        );
      }
      decisions.push({
        proposalId,
        disposition: item.disposition,
        note: typeof item.note === "string" ? item.note : undefined,
      });
    }

    const loaded = await readProposalSetArtifact(
      ctx,
      programId,
      proposalSetArtifactId,
      proposalSetArtifactVersion,
    );
    if (!loaded.ok) {
      return Response.json(
        { error: "proposal_set_unavailable", detail: loaded.detail },
        { status: loaded.status },
      );
    }

    const persistedReview = await persistStageReadinessProposalReview({
      ctx,
      program,
      proposalSet: loaded.proposalSet,
      sourceProposalSetArtifactId: proposalSetArtifactId,
      sourceProposalSetArtifactVersion: loaded.artifactVersion,
      decisions,
    });

    return Response.json({
      ok: true,
      proposalReview: {
        reviewId: persistedReview.proposalReview.reviewId,
        artifactId: persistedReview.artifactId,
        artifactVersion: persistedReview.artifactVersion,
        status:
          persistedReview.proposalReview.summary.pendingCount === 0 &&
          persistedReview.proposalReview.summary.needsValidationCount === 0
            ? "accepted"
            : "review_required",
        proposalSetId: persistedReview.proposalReview.proposalSetId,
        acceptedCount: persistedReview.proposalReview.summary.acceptedCount,
        rejectedCount: persistedReview.proposalReview.summary.rejectedCount,
        needsValidationCount:
          persistedReview.proposalReview.summary.needsValidationCount,
        pendingCount: persistedReview.proposalReview.summary.pendingCount,
        acceptedAnswerStates:
          persistedReview.proposalReview.summary.acceptedAnswerStates,
        readiness: persistedReview.proposalReview.summary.readiness,
        acceptedResponses:
          persistedReview.proposalReview.acceptedResponses.length,
        blobStored: persistedReview.blobStored,
        message:
          "Human review recorded. Only accepted workbook responses can feed the next phase context.",
      },
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      console.error(
        "[PATCH /api/v1/programs/:programId/stage-readiness-workbook]",
        error,
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }
}
