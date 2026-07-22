// POST /api/v1/programs/:programId/artifacts/:artifactId/client-approval
//
// Turns a generated Move artifact into the governed deliverables_v2 source of
// truth before phase-gate approval. The orchestrator persists AI drafts in
// generated_artifacts; hard gates evaluate signed_off deliverables_v2 rows. This
// route is the human review bridge between those two stores.

import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { hasAuthority } from "@/lib/programs/governance";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { signOffDeliverable } from "@/lib/programs/mutations";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import {
  getGeneratedArtifactById,
  renderableDocFromGeneratedArtifact,
  renderedHtmlFromGeneratedArtifact,
} from "@/lib/artifacts/repository";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import {
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/lib/programs/attachments/mime";
import { extractProgramEvidenceFromUploadBuffer } from "@/lib/programs/evidence-ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PHASE_TO_MODULE_KEY: Record<number, string> = {
  1: "charter",
  2: "diagnose",
  3: "design",
  4: "roadmap",
  5: "mobilize",
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function registryKeyForGeneratedType(type: string): string | null {
  const fromProfile = deliverableKeyForOrchestratorType(type);
  if (
    fromProfile &&
    DELIVERABLE_REGISTRY.some((spec) => spec.deliverableTypeKey === fromProfile)
  ) {
    return fromProfile;
  }
  return DELIVERABLE_REGISTRY.some((spec) => spec.deliverableTypeKey === type)
    ? type
    : null;
}

function generatedArtifactBelongsToMove(
  sourceArtifactRef: string,
  programId: string,
): boolean {
  return (
    sourceArtifactRef === programId ||
    sourceArtifactRef.startsWith(`move:${programId}:`)
  );
}

function titleFromDoc(doc: Record<string, unknown> | null, fallback: string) {
  return typeof doc?.title === "string" && doc.title.trim()
    ? doc.title.trim()
    : fallback;
}

function contentFromDoc(doc: Record<string, unknown> | null, html: string | null) {
  if (doc) {
    const sections = Array.isArray(doc.generatedSections)
      ? doc.generatedSections
      : [];
    const sectionText = sections
      .map((section) => {
        if (!section || typeof section !== "object") return "";
        const typed = section as { title?: unknown; bodyMarkdown?: unknown };
        const title = typeof typed.title === "string" ? typed.title.trim() : "";
        const body =
          typeof typed.bodyMarkdown === "string"
            ? typed.bodyMarkdown.trim()
            : "";
        return [title ? `## ${title}` : "", body].filter(Boolean).join("\n");
      })
      .filter(Boolean)
      .join("\n\n");
    const lead = [
      typeof doc.title === "string" ? `# ${doc.title}` : "",
      typeof doc.recommendation === "string" ? doc.recommendation : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const content = [lead, sectionText].filter(Boolean).join("\n\n").trim();
    if (content) return content;
  }
  return html ? stripHtml(html) : "";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { programId, artifactId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("mutation");
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const canApprove =
      (await hasAuthority(ctx, programId, "approver", { supabase })) ||
      ctx.role === "founder" ||
      ctx.role === "maestro";
    if (!canApprove) {
      return Response.json(
        {
          error: "forbidden",
          detail: "approver authority or higher required",
        },
        { status: 403 },
      );
    }

    const artifact = await getGeneratedArtifactById(artifactId, {
      clientId: ctx.clientId,
    });
    if (!artifact) return Response.json({ error: "not_found" }, { status: 404 });
    if (!generatedArtifactBelongsToMove(artifact.sourceArtifactRef, programId)) {
      return Response.json(
        {
          error: "wrong_move",
          detail: "Generated artifact is not scoped to this Move.",
        },
        { status: 403 },
      );
    }

    const deliverableTypeKey = registryKeyForGeneratedType(
      artifact.artifactType,
    );
    if (!deliverableTypeKey) {
      return Response.json(
        {
          error: "unsupported_artifact_type",
          detail: `"${artifact.artifactType}" cannot be approved as a registered Move deliverable.`,
        },
        { status: 422 },
      );
    }
    const spec = DELIVERABLE_REGISTRY.find(
      (item) => item.deliverableTypeKey === deliverableTypeKey,
    );
    const phase = spec?.phase ?? 0;
    if (phase < 1 || phase > 5) {
      return Response.json(
        { error: "unsupported_phase", detail: "Only P1-P5 artifacts can be approved here." },
        { status: 422 },
      );
    }

    const doc = renderableDocFromGeneratedArtifact(artifact);
    const html = renderedHtmlFromGeneratedArtifact(artifact);
    const generatedContent = contentFromDoc(doc, html);
    if (!generatedContent) {
      return Response.json(
        {
          error: "generated_artifact_not_extractable",
          detail:
            "The generated artifact has no extractable content to approve.",
        },
        { status: 422 },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    const isFileUploadApproval = contentType.includes("multipart/form-data");
    let reason = "Client reviewed the AI-prepared draft and accepted it as the authoritative phase deliverable.";
    let approvedArtifactId: string | undefined;
    let approvedContent:
      | {
          content: string;
          fileName: string;
          mimeType: string;
          parseMethod: string;
          warnings: string[];
        }
      | undefined;

    if (isFileUploadApproval) {
      const form = await req.formData();
      const maybeReason = form.get("reason");
      if (typeof maybeReason === "string" && maybeReason.trim()) {
        reason = maybeReason.trim();
      }
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return Response.json(
          { error: "file_required", detail: "A client-approved file is required." },
          { status: 400 },
        );
      }
      if (!isWithinSizeLimit(file.size)) {
        return Response.json(
          {
            error: "file_too_large",
            detail: `max ${MAX_ATTACHMENT_SIZE_BYTES} bytes`,
          },
          { status: 413 },
        );
      }
      if (file.type && !isAllowedMimeType(file.type)) {
        return Response.json(
          { error: "unsupported_type", detail: file.type },
          { status: 415 },
        );
      }

      const body = Buffer.from(await file.arrayBuffer());
      const parsed = await extractProgramEvidenceFromUploadBuffer({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer: body,
        cacheScope: `program:${programId}:generated-artifact:${artifactId}:approval`,
      });
      const parsedText = parsed.extractedText?.trim();
      if (!parsedText) {
        return Response.json(
          {
            error: "approved_upload_not_extractable",
            detail:
              "Client-approved replacement files must contain extractable text before they can become the downstream source of truth.",
            parseMethod: parsed.extractedStructured.parse_method,
            warnings: parsed.extractedStructured.warnings,
          },
          { status: 422 },
        );
      }

      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const saved = await saveMoveArtifact(ctx, {
        moveId: programId,
        phase,
        artifactType: deliverableTypeKey,
        artifactFamily: "generated_deliverable",
        title: spec?.documentTitle ?? titleFromDoc(doc, deliverableTypeKey),
        description: "Client-approved replacement — uploaded to replace the AI draft.",
        fileName: file.name,
        fileFormat: ext,
        body,
        status: "approved",
        sourceBasis: "client_upload",
        confidence: "high",
        citationReady: true,
        generatedBy: ctx.email ?? "client-approval",
        metadata: {
          uploadedBy: ctx.email ?? null,
          mime: file.type || null,
          deliverableTypeKey,
          generatedArtifactId: artifact.id,
          clientApprovedReplacement: true,
          approvalReason: reason,
          parseMethod: parsed.extractedStructured.parse_method,
          parseWarnings: parsed.extractedStructured.warnings,
        },
      });
      approvedArtifactId = saved.artifactId;
      approvedContent = {
        content: parsedText,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        parseMethod: parsed.extractedStructured.parse_method,
        warnings: parsed.extractedStructured.warnings,
      };
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        reason?: string;
      };
      if (typeof body.reason === "string" && body.reason.trim()) {
        reason = body.reason.trim();
      }
    }

    const title = spec?.documentTitle ?? titleFromDoc(doc, deliverableTypeKey);
    const drafted = await draftModuleDeliverable(ctx, {
      programId,
      moduleKey: PHASE_TO_MODULE_KEY[phase] ?? deliverableTypeKey,
      deliverableTypeKey,
      title,
      draftContent: generatedContent,
      structuredData: {
        source: "generated_artifact_acceptance",
        generatedArtifactId: artifact.id,
        generatedArtifactType: artifact.artifactType,
        sourceArtifactRef: artifact.sourceArtifactRef,
        approvalReason: reason,
        mode: isFileUploadApproval
          ? "client_approved_replacement"
          : "accept_ai_draft_as_authoritative",
      },
      provenanceMap: {
        moveId: programId,
        artifactId: artifact.id,
        artifactType: artifact.artifactType,
        sourceArtifactRef: artifact.sourceArtifactRef,
      },
    });

    const signedOff = await signOffDeliverable(ctx, programId, drafted.deliverableId, {
      supabase,
      approvedArtifactId,
      approvedContent,
    });
    if (!signedOff) {
      return Response.json(
        { error: "sign_off_failed", detail: "Deliverable could not be signed off." },
        { status: 409 },
      );
    }

    return Response.json({
      ok: true,
      programId,
      artifactId,
      deliverableId: drafted.deliverableId,
      versionId: drafted.versionId,
      deliverableTypeKey,
      approvalMode: isFileUploadApproval
        ? "client_approved_replacement"
        : "accept_ai_draft_as_authoritative",
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error(
      "[POST /api/v1/programs/[programId]/artifacts/[artifactId]/client-approval]",
      err,
    );
    return Response.json(
      { error: "internal_error", detail: (err as Error).message },
      { status: 500 },
    );
  }
}
