// POST /api/v1/programs/:programId/artifacts/:artifactId/client-approval
//
// Turns a generated Move artifact into the governed deliverables_v2 source of
// truth before phase-gate approval. The orchestrator persists AI drafts in
// generated_artifacts; hard gates evaluate signed_off deliverables_v2 rows. This
// route is the human review bridge between those two stores.

import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { signOffDeliverable } from "@/lib/programs/mutations";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import {
  type GeneratedArtifactRecord,
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
import {
  loadApprovedSolutionApproach,
  P3_ARCHITECTURE_DELIVERABLE_KEYS,
  validateArchitectureGenerationLineage,
} from "@/lib/programs/approved-solution-approach";
import { loadCurrentMoveContextExtractFreshness } from "@/lib/programs/move-context-extract";
import { classifyP3ArchitectureLineagePrecondition } from "@/lib/programs/p3-architecture-lineage-precondition";
import {
  approvedMoveEvidenceRevisionForPhase,
  isApprovedMoveEvidenceBasisCurrent,
  loadApprovedMoveEvidenceSnapshot,
} from "@/lib/programs/approved-move-evidence-snapshot";
import {
  approvedEvidenceBasisRefusalCode,
  classifyApprovedEvidenceBasisRefusal,
  describeApprovedEvidenceBasisRefusal,
  unevaluableApprovedEvidenceBasisRefusal,
} from "@/lib/programs/approved-evidence-basis-refusal";
// Each `error:` literal below is annotated `satisfies
// MoveClientApprovalOwnRefusalCode`, so adding a refusal code here without
// giving it a reviewer sentence in `move-client-approval-refusal.ts` is a
// compile error rather than a bare token on a reviewer's screen.
import type { MoveClientApprovalOwnRefusalCode } from "@/lib/programs/move-client-approval-refusal";
import { stampApprovedEvidenceLineage } from "@/lib/programs/deliverables/approved-evidence-lineage";
import { findUnsupportedFinancialClaimDeltas } from "@/lib/programs/reviewed-deliverable-financial-claims";
import { renderValidatedDocx } from "@/lib/deliverables/orchestrator/render-validated-doc";
import { renderValidatedDeck } from "@/lib/deliverables/orchestrator/render-validated-deck";
import { architectureModelForArtifact } from "@/lib/deliverables/orchestrator/architecture-artifact-model";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

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

function registryKeyForGeneratedType(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const type = value.trim();
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

function normalizeForKeyMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function registryKeyFromMoveBoardPackTitle(title: string): string | null {
  const normalized = normalizeForKeyMatch(title);
  const exactTitle = DELIVERABLE_REGISTRY.find(
    (spec) => normalizeForKeyMatch(spec.documentTitle) === normalized,
  );
  if (exactTitle) return exactTitle.deliverableTypeKey;

  const titleHints: Array<[RegExp, string]> = [
    [/\b(program )?charter\b/, "charter"],
    // Ambiguous P2 board-pack titles often include both "Discovery" and
    // "Root Cause Diagnostic". P2 gates read signed `discovery_report` rows,
    // while exact "Root Cause Analysis Worksheet" titles are already handled
    // by the exact-title match above.
    [/\b(discovery|diagnosis|diagnostic)\b/, "discovery_report"],
    [/\broot cause\b/, "root_cause_worksheet"],
    [/\b(target state|reference) architecture\b/, "target_state_architecture"],
    [/\bsolution design\b/, "solution_design"],
    [/\boperating model\b/, "operating_model_design"],
    [/\bsourcing strategy\b/, "sourcing_strategy"],
    [/\b(execution )?roadmap\b/, "execution_roadmap"],
    [/\bbusiness case\b/, "business_case"],
    [/\b(financial|estimate) model\b/, "financial_model"],
    [/\btower metrics?\b/, "tower_metrics_plan"],
    [/\bvalue measurement\b/, "value_measurement_contract"],
    [/\b(handoff|mobilization)\b/, "handoff_package"],
  ];
  for (const [pattern, key] of titleHints) {
    if (
      pattern.test(normalized) &&
      DELIVERABLE_REGISTRY.some((spec) => spec.deliverableTypeKey === key)
    ) {
      return key;
    }
  }
  return null;
}

function registryKeyForGeneratedArtifact(
  artifact: GeneratedArtifactRecord,
  doc: Record<string, unknown> | null,
): string | null {
  const metadata = artifact.metadata ?? {};
  const candidates: unknown[] = [
    artifact.artifactType,
    metadata.deliverableTypeKey,
    metadata.deliverableType,
    metadata.typeKey,
    metadata.registryKey,
    doc?.deliverableTypeKey,
    doc?.deliverableType,
    doc?.typeKey,
    doc?.key,
  ];
  for (const candidate of candidates) {
    const key = registryKeyForGeneratedType(candidate);
    if (key) return key;
  }

  if (artifact.artifactType !== "move_board_pack") return null;

  const titleCandidates = [
    typeof doc?.title === "string" ? doc.title : null,
    typeof metadata.title === "string" ? metadata.title : null,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const title of titleCandidates) {
    const key = registryKeyFromMoveBoardPackTitle(title);
    if (key) return key;
  }

  return null;
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

function contentFromDoc(
  doc: Record<string, unknown> | null,
  html: string | null,
) {
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

function safeArtifactFileName(title: string, ext: string): string {
  const stem =
    title
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/[^\x20-\x7e]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "move-deliverable";
  return `${stem}.${ext}`;
}

async function renderAcceptedGeneratedDraft(args: {
  artifact: GeneratedArtifactRecord;
  doc: Record<string, unknown> | null;
  title: string;
}): Promise<{
  body: Buffer;
  fileName: string;
  fileFormat: "docx" | "pptx";
  mimeType: string;
  parseMethod: string;
} | null> {
  if (!args.doc) return null;
  const structuredDoc = args.doc as unknown as RenderableDeliverable;
  if (args.artifact.outputFormat === "pptx") {
    const architectureModel = architectureModelForArtifact(args.artifact);
    const validated = await renderValidatedDeck(
      structuredDoc,
      {},
      architectureModel,
    );
    if (!validated.physicallyIntact || !validated.verdict.ok) {
      const details = validated.physicallyIntact
        ? validated.verdict.findings
            .map((finding) => finding.message)
            .slice(0, 3)
        : validated.integrityFailures.slice(0, 3);
      throw new Error(
        `generated_artifact_pptx_quality_failed: ${details.join("; ")}`,
      );
    }
    return {
      body: Buffer.from(validated.buffer),
      fileName: safeArtifactFileName(args.title, "pptx"),
      fileFormat: "pptx",
      mimeType: PPTX_CONTENT_TYPE,
      parseMethod: "generated_renderable_deliverable_pptx",
    };
  }
  const docx = await renderValidatedDocx(structuredDoc);
  return {
    body: Buffer.from(docx),
    fileName: safeArtifactFileName(args.title, "docx"),
    fileFormat: "docx",
    mimeType: DOCX_CONTENT_TYPE,
    parseMethod: "generated_renderable_deliverable_docx",
  };
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
    if (!program)
      return Response.json(
        { error: "not_found" satisfies MoveClientApprovalOwnRefusalCode },
        { status: 404 },
      );

    const artifact =
      (await getGeneratedArtifactById(artifactId, {
        clientId: ctx.clientId,
      })) ??
      (ctx.clientKey && ctx.clientKey !== ctx.clientId
        ? await getGeneratedArtifactById(artifactId, {
            clientId: ctx.clientKey,
          })
        : null);
    if (!artifact)
      return Response.json(
        { error: "not_found" satisfies MoveClientApprovalOwnRefusalCode },
        { status: 404 },
      );
    if (
      !generatedArtifactBelongsToMove(artifact.sourceArtifactRef, programId)
    ) {
      return Response.json(
        {
          error: "wrong_move" satisfies MoveClientApprovalOwnRefusalCode,
          detail: "Generated artifact is not scoped to this Move.",
        },
        { status: 403 },
      );
    }

    const doc = renderableDocFromGeneratedArtifact(artifact);
    const html = renderedHtmlFromGeneratedArtifact(artifact);
    const deliverableTypeKey = registryKeyForGeneratedArtifact(artifact, doc);
    if (!deliverableTypeKey) {
      return Response.json(
        {
          error:
            "unsupported_artifact_type" satisfies MoveClientApprovalOwnRefusalCode,
          detail: `"${artifact.artifactType}" cannot be resolved to a registered Move deliverable.`,
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
        {
          error: "unsupported_phase" satisfies MoveClientApprovalOwnRefusalCode,
          detail: "Only P1-P5 artifacts can be approved here.",
        },
        { status: 422 },
      );
    }

    let verifiedGenerationLineage: Record<string, unknown> | null = null;
    if (!ctx.clientKey) {
      // No tenant key means the approved-evidence read was never issued, so
      // nothing was established about this document's currency.
      const refusal = unevaluableApprovedEvidenceBasisRefusal(
        "tenant_scope_unresolved",
      );
      return Response.json(
        {
          error: approvedEvidenceBasisRefusalCode(refusal),
          detail: describeApprovedEvidenceBasisRefusal(refusal, "approval"),
        },
        { status: 409 },
      );
    }
    const currentEvidenceSnapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: ctx.clientKey,
      moveId: programId,
    });
    const artifactSnapshotHash =
      typeof artifact.metadata.phaseEvidenceSnapshotHash === "string"
        ? artifact.metadata.phaseEvidenceSnapshotHash
        : typeof artifact.metadata.evidenceSnapshotHash === "string"
          ? artifact.metadata.evidenceSnapshotHash
          : null;
    const evidenceBasisRefusal = classifyApprovedEvidenceBasisRefusal({
      basisEvaluable: Boolean(currentEvidenceSnapshot),
      cause: "snapshot_unreadable",
      recordedRevision: artifactSnapshotHash,
      basisIsCurrent:
        Boolean(currentEvidenceSnapshot) &&
        isApprovedMoveEvidenceBasisCurrent({
          snapshot: currentEvidenceSnapshot,
          phase,
          recordedRevision: artifactSnapshotHash,
          scope:
            typeof artifact.metadata.evidenceSnapshotScope === "string"
              ? artifact.metadata.evidenceSnapshotScope
              : null,
          generatedAt: artifact.renderedAt,
        }),
    });
    // The `!currentEvidenceSnapshot` disjunct narrows the snapshot for the
    // lineage written below; a null snapshot already classifies as
    // `basis_unevaluable`, so the fallback resolves to that same refusal.
    if (evidenceBasisRefusal || !currentEvidenceSnapshot) {
      const refusal =
        evidenceBasisRefusal ?? unevaluableApprovedEvidenceBasisRefusal();
      return Response.json(
        {
          error: approvedEvidenceBasisRefusalCode(refusal),
          detail: describeApprovedEvidenceBasisRefusal(refusal, "approval"),
        },
        { status: 409 },
      );
    }
    verifiedGenerationLineage = {
      ...((artifact.metadata.generationLineage &&
      typeof artifact.metadata.generationLineage === "object" &&
      !Array.isArray(artifact.metadata.generationLineage)
        ? artifact.metadata.generationLineage
        : {}) as Record<string, unknown>),
      evidenceSnapshotHash: currentEvidenceSnapshot.revision,
      phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
        currentEvidenceSnapshot,
        phase,
      ),
      evidenceSnapshotScope: "phase",
    };

    if (
      phase === 3 &&
      P3_ARCHITECTURE_DELIVERABLE_KEYS.has(deliverableTypeKey)
    ) {
      const approved = ctx.clientKey
        ? await loadApprovedSolutionApproach({
            moveId: programId,
            clientId: ctx.clientId,
          })
        : null;
      const freshness = ctx.clientKey
        ? await loadCurrentMoveContextExtractFreshness({
            tenantKey: ctx.clientKey,
            moveId: programId,
            phase: 3,
          })
        : null;
      // This path also refuses a non-`fresh` extract, which the sign-off path
      // leaves to the lineage comparison. `staleRefuses: true` keeps that.
      const precondition = classifyP3ArchitectureLineagePrecondition({
        clientKey: ctx.clientKey,
        approvedOptionPresent: Boolean(approved),
        freshness,
        staleRefuses: true,
      });
      if (precondition) {
        return Response.json(
          {
            error:
              "architecture_lineage_not_current" satisfies MoveClientApprovalOwnRefusalCode,
            detail: precondition.detail,
          },
          { status: 409 },
        );
      }
      if (!approved || !freshness) {
        // Unreachable: the classifier refuses on every input that leaves either
        // read unusable. Kept so the comparison below narrows without a
        // non-null assertion.
        return Response.json(
          {
            error:
              "architecture_lineage_not_current" satisfies MoveClientApprovalOwnRefusalCode,
            detail:
              "The current approved option or P3 context snapshot is unavailable.",
          },
          { status: 409 },
        );
      }
      const validation = validateArchitectureGenerationLineage({
        lineage: artifact.metadata.generationLineage,
        approved,
        currentContextSnapshotHash: freshness.evidenceFingerprint,
      });
      if (!validation.ok) {
        return Response.json(
          {
            error:
              "architecture_lineage_not_current" satisfies MoveClientApprovalOwnRefusalCode,
            detail: validation.detail,
          },
          { status: 409 },
        );
      }
      verifiedGenerationLineage = {
        ...(validation.lineage as unknown as Record<string, unknown>),
        evidenceSnapshotHash: currentEvidenceSnapshot.revision,
        phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
          currentEvidenceSnapshot,
          phase,
        ),
        evidenceSnapshotScope: "phase",
      };
    }

    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (
      !accessPolicy.canApproveGates ||
      (Array.isArray(accessPolicy.programIdsAllowed) &&
        !accessPolicy.programIdsAllowed.includes(programId))
    ) {
      return Response.json(
        {
          error: "forbidden" satisfies MoveClientApprovalOwnRefusalCode,
          detail: "Authorized Move approval permission required.",
        },
        { status: 403 },
      );
    }

    const generatedContent = contentFromDoc(doc, html);
    if (!generatedContent) {
      return Response.json(
        {
          error:
            "generated_artifact_not_extractable" satisfies MoveClientApprovalOwnRefusalCode,
          detail:
            "The generated artifact has no extractable content to approve.",
        },
        { status: 422 },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    const isFileUploadApproval = contentType.includes("multipart/form-data");
    let reason =
      "Client reviewed the AI-prepared draft and accepted it as the authoritative phase deliverable.";
    let approvedArtifactId: string | undefined;
    let approvedContent:
      | {
          content: string;
          fileName: string;
          mimeType: string;
          parseMethod: string;
          warnings: string[];
          generationLineage?: Record<string, unknown>;
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
          {
            error: "file_required" satisfies MoveClientApprovalOwnRefusalCode,
            detail: "A client-approved file is required.",
          },
          { status: 400 },
        );
      }
      if (!isWithinSizeLimit(file.size)) {
        return Response.json(
          {
            error: "file_too_large" satisfies MoveClientApprovalOwnRefusalCode,
            detail: `max ${MAX_ATTACHMENT_SIZE_BYTES} bytes`,
          },
          { status: 413 },
        );
      }
      if (file.type && !isAllowedMimeType(file.type)) {
        return Response.json(
          {
            error:
              "unsupported_type" satisfies MoveClientApprovalOwnRefusalCode,
            detail: file.type,
          },
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
            error:
              "approved_upload_not_extractable" satisfies MoveClientApprovalOwnRefusalCode,
            detail:
              "Client-approved replacement files must contain extractable text before they can become the downstream source of truth.",
            parseMethod: parsed.extractedStructured.parse_method,
            warnings: parsed.extractedStructured.warnings,
            ...(verifiedGenerationLineage
              ? { generationLineage: verifiedGenerationLineage }
              : {}),
          },
          { status: 422 },
        );
      }

      const unsupportedFinancialClaims = findUnsupportedFinancialClaimDeltas(
        generatedContent,
        parsedText,
      );
      if (unsupportedFinancialClaims.length > 0) {
        return Response.json(
          {
            error:
              "unsupported_financial_claim_delta" satisfies MoveClientApprovalOwnRefusalCode,
            detail:
              "The reviewed file adds or strengthens financial claims that are not established by the generated source. Attach and approve supporting financial evidence, rebuild the deliverable, then review it again.",
            unsupportedClaims: unsupportedFinancialClaims,
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
        description:
          "Client-approved replacement — uploaded to replace the AI draft.",
        fileName: file.name,
        fileFormat: ext,
        body,
        status: "approved",
        sourceBasis: "client_approved_deliverable",
        confidence: "medium",
        citationReady: false,
        generatedBy: ctx.email ?? "client-approval",
        metadata: {
          uploadedBy: ctx.email ?? null,
          mime: file.type || null,
          deliverableTypeKey,
          generatedArtifactId: artifact.id,
          clientApprovedReplacement: true,
          factualClaimsIndependentlyEvidenceVerified: false,
          approvalReason: reason,
          parseMethod: parsed.extractedStructured.parse_method,
          parseWarnings: parsed.extractedStructured.warnings,
          evidenceSnapshotHash: currentEvidenceSnapshot.revision,
          phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
            currentEvidenceSnapshot,
            phase,
          ),
          evidenceSnapshotScope: "phase",
          generationLineage: verifiedGenerationLineage,
        },
      });
      approvedArtifactId = saved.artifactId;
      approvedContent = {
        content: parsedText,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        parseMethod: parsed.extractedStructured.parse_method,
        warnings: parsed.extractedStructured.warnings,
        ...(verifiedGenerationLineage
          ? { generationLineage: verifiedGenerationLineage }
          : {}),
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
    if (!isFileUploadApproval) {
      let renderedFinal: Awaited<
        ReturnType<typeof renderAcceptedGeneratedDraft>
      > | null = null;
      try {
        renderedFinal = await renderAcceptedGeneratedDraft({
          artifact,
          doc,
          title,
        });
      } catch (err) {
        return Response.json(
          {
            error:
              "generated_artifact_final_render_failed" satisfies MoveClientApprovalOwnRefusalCode,
            detail:
              err instanceof Error
                ? err.message
                : "The generated artifact could not be rendered as a final editable file.",
          },
          { status: 422 },
        );
      }
      if (!renderedFinal) {
        return Response.json(
          {
            error:
              "generated_artifact_final_not_available" satisfies MoveClientApprovalOwnRefusalCode,
            detail:
              "Accepting an AI draft requires a structured generated artifact that can render to a final DOCX or PPTX and be stored in the artifact vault.",
          },
          { status: 422 },
        );
      }

      let saved: Awaited<ReturnType<typeof saveMoveArtifact>>;
      try {
        saved = await saveMoveArtifact(ctx, {
          moveId: programId,
          phase,
          artifactType: deliverableTypeKey,
          artifactFamily: "generated_deliverable",
          title,
          description:
            "Client-reviewed generated draft accepted as the authoritative phase deliverable.",
          fileName: renderedFinal.fileName,
          fileFormat: renderedFinal.fileFormat,
          body: renderedFinal.body,
          status: "approved",
          sourceBasis: "generated_artifact_acceptance",
          confidence: "high",
          citationReady: true,
          generatedBy: ctx.email ?? "client-approval",
          qualityScore: artifact.qualityScore,
          requireBlobStored: true,
          metadata: {
            deliverableTypeKey,
            generatedArtifactId: artifact.id,
            generatedArtifactType: artifact.artifactType,
            sourceArtifactRef: artifact.sourceArtifactRef,
            clientAcceptedGeneratedDraft: true,
            approvalReason: reason,
            finalFormat: renderedFinal.fileFormat,
            mimeType: renderedFinal.mimeType,
            parseMethod: renderedFinal.parseMethod,
            ...(verifiedGenerationLineage
              ? { generationLineage: verifiedGenerationLineage }
              : {}),
            evidenceSnapshotHash: currentEvidenceSnapshot.revision,
            phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
              currentEvidenceSnapshot,
              phase,
            ),
            evidenceSnapshotScope: "phase",
          },
        });
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === "artifact_blob_storage_unavailable"
        ) {
          return Response.json(
            {
              error:
                "artifact_storage_unavailable" satisfies MoveClientApprovalOwnRefusalCode,
              detail:
                "The final editable artifact could not be stored. Approval was not recorded; retry after artifact storage is available.",
            },
            { status: 503 },
          );
        }
        throw err;
      }
      approvedArtifactId = saved.artifactId;
    }

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
        ...stampApprovedEvidenceLineage({
          evidenceSnapshotHash: currentEvidenceSnapshot.revision,
          phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
            currentEvidenceSnapshot,
            phase,
          ),
        }),
        approvalReason: reason,
        mode: isFileUploadApproval
          ? "client_approved_replacement"
          : "accept_ai_draft_as_authoritative",
        ...(verifiedGenerationLineage
          ? { generationLineage: verifiedGenerationLineage }
          : {}),
      },
      provenanceMap: {
        moveId: programId,
        artifactId: artifact.id,
        artifactType: artifact.artifactType,
        sourceArtifactRef: artifact.sourceArtifactRef,
      },
    });

    const signedOff = await signOffDeliverable(
      ctx,
      programId,
      drafted.deliverableId,
      {
        supabase,
        approvedArtifactId,
        approvedContent,
        approvalLineage: {
          source: "generated_artifact_acceptance",
          generatedArtifactId: artifact.id,
          ...stampApprovedEvidenceLineage({
            evidenceSnapshotHash: currentEvidenceSnapshot.revision,
            phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
              currentEvidenceSnapshot,
              phase,
            ),
          }),
          approvalMode: isFileUploadApproval
            ? "client_approved_replacement"
            : "accept_ai_draft_as_authoritative",
        },
      },
    );
    if (!signedOff) {
      return Response.json(
        {
          error: "sign_off_failed" satisfies MoveClientApprovalOwnRefusalCode,
          detail: "Deliverable could not be signed off.",
        },
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
      {
        error: "internal_error" satisfies MoveClientApprovalOwnRefusalCode,
        detail: (err as Error).message,
      },
      { status: 500 },
    );
  }
}
