// POST /api/v1/programs/:programId/deliverables/:deliverableId/sign-off
// in_review → signed_off. Requires sponsor or approver authority per Packet 4 matrix.
//
// Two modes, both real client approval — not just an AI-generation trigger:
//   - JSON body (or no body): approve the AI-drafted content as-is.
//   - multipart/form-data with a `file` field: approve by uploading an edited
//     replacement. The file is registered in move_artifacts
//     (artifact_family=generated_deliverable) via the existing File Cabinet
//     write path, then linked back via deliverables_v2.approved_artifact_id.
// Either way, deliverables_v2.signed_off_version is set to the version being
// approved so later regeneration (v2-generator.ts) can never silently clobber
// the approval record, and moves-generate-deps.ts / deliverable-content-signals.ts
// prefer this version when feeding content forward to the next phase.
//
// PHASE CAPTURE EVIDENCE INTEGRITY (added here): this route used to accept
// ANY in_review/draft deliverable from ANY authorized approver, with no
// check on the deliverable's type key or on how its content was produced.
// That let a stale, free-text-fabricated `deliverables_v2` row (created by
// `phase-capture/route.ts`'s now-removed auto-creation — see that file's
// own incident comment) be signed off as if it were reviewed, generated
// evidence, satisfying a hard gate check on nothing but raw capture text.
// Two independent checks now run before any sign-off:
//   1. RECOGNIZED_DELIVERABLE_TYPE_KEYS — the deliverable's type key must be
//      one of the deliberately registered types the codebase actually
//      produces (orchestrator DELIVERABLE_REGISTRY, or the agent-authored
//      completeDeliverable/draftArtifact allowlists). An unrecognized or
//      stale key is rejected outright — it can never satisfy a gate, so it
//      should never be signable as gate evidence either.
//   2. Provenance — a deliverable whose current version was tagged
//      `structured_data.source: "phase_capture"` (raw capture-field text,
//      never deliberately authored or generated) cannot be signed off
//      as-is. The client-approved-upload path (below) remains the correct
//      way to promote it: upload a real document, which creates a new,
//      properly-sourced version and signs off that instead.

import { signOffDeliverable } from "@/lib/programs/mutations";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import { evaluateClientReadinessForSignOff } from "@/lib/deliverables/shared/client-readiness-gate";
import { hasAuthority } from "@/lib/programs/governance";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { ALLOWED_PROGRAM_DELIVERABLE_TYPES } from "@/lib/agent/tools/program/completeDeliverable";
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

// Union of every deliberately registered/agent-authorable deliverable type
// key this codebase actually produces. A small handful of legacy alias keys
// that governance.ts's gate checks still recognize for historical Moves
// (program_seed_brief, program_seed, discovery_synthesis,
// discovery_findings, approval_business_case, mobilization_handoff_package,
// mobilization_package, benefits_realization_plan, value_contract) are not
// included here deliberately — if a real historical row under one of those
// keys ever needs signing off, that is a one-line addition with a clear,
// auditable reason, not a silent allowance.
const RECOGNIZED_DELIVERABLE_TYPE_KEYS = new Set<string>([
  ...DELIVERABLE_REGISTRY.map((spec) => spec.deliverableTypeKey),
  ...ALLOWED_PROGRAM_DELIVERABLE_TYPES,
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string; deliverableId: string }> },
) {
  try {
    const { programId, deliverableId } = await params;
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
        { error: "forbidden", detail: "approver authority or higher required" },
        { status: 403 },
      );
    }

    const { data: deliverableRow, error: deliverableError } = await supabase
      .from("deliverables_v2")
      .select("deliverable_type_key, title, current_version")
      .eq("id", deliverableId)
      .eq("engagement_id", programId)
      .maybeSingle();
    if (deliverableError) throw deliverableError;
    if (!deliverableRow)
      return Response.json({ error: "not_found" }, { status: 404 });
    const {
      deliverable_type_key: deliverableTypeKey,
      title: deliverableTitle,
      current_version: currentVersion,
    } = deliverableRow as {
      deliverable_type_key: string;
      title: string;
      current_version: number | null;
    };

    if (!RECOGNIZED_DELIVERABLE_TYPE_KEYS.has(deliverableTypeKey)) {
      return Response.json(
        {
          error: "unsupported_artifact_type",
          detail: `"${deliverableTypeKey}" is not a registered gate-deliverable type and cannot be signed off.`,
        },
        { status: 422 },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    const isFileUploadApproval = contentType.includes("multipart/form-data");

    // The JSON path historically accepts no body at all, so an absent or
    // unparseable body must stay valid — it means "approve as drafted".
    let acknowledgeReadinessBlockers = false;
    if (!isFileUploadApproval) {
      const parsedBody = (await req.json().catch(() => null)) as {
        acknowledgeReadinessBlockers?: unknown;
      } | null;
      acknowledgeReadinessBlockers =
        parsedBody?.acknowledgeReadinessBlockers === true;
    }

    let readinessOutcome: ReturnType<
      typeof evaluateClientReadinessForSignOff
    > | null = null;

    if (!isFileUploadApproval && currentVersion) {
      const { data: versionRow, error: versionError } = await supabase
        .from("deliverable_versions")
        .select("structured_data, content")
        .eq("deliverable_id", deliverableId)
        .eq("version", currentVersion)
        .maybeSingle();
      if (versionError) throw versionError;
      const source = (
        versionRow as {
          structured_data?: Record<string, unknown> | null;
        } | null
      )?.structured_data?.source;
      if (source === "phase_capture") {
        return Response.json(
          {
            error: "capture_text_not_signable",
            detail:
              "This deliverable's current content is raw phase-capture text, not a reviewed or generated " +
              "artifact. Generate the real deliverable, or upload an approved replacement document, before " +
              "signing off.",
          },
          { status: 422 },
        );
      }

      // Client-readiness gate. Signing off is the moment a document becomes
      // something a client can be shown, so this is the last point at which a
      // UUID, content hash, model name, schema identifier or unfilled
      // placeholder can still be caught cheaply.
      //
      // Blockers refuse the sign-off. Review items never do. A reviewer who
      // judges the findings acceptable can re-submit with
      // `acknowledgeReadinessBlockers: true`, and the specific findings they
      // accepted are written into the approval record — because "signed off
      // with three known leaks" and "was clean" are different facts and a
      // later reader must be able to tell them apart.
      const readiness = evaluateClientReadinessForSignOff({
        content: (versionRow as { content?: string | null } | null)?.content,
        acknowledgeBlockers: acknowledgeReadinessBlockers,
      });
      if (!readiness.allowed) {
        return Response.json(
          {
            error: "client_readiness_blockers",
            detail: readiness.summary,
            blockers: readiness.blockers.map((finding) => ({
              kind: finding.kind,
              match: finding.match,
              why: finding.why,
              context: finding.context,
            })),
            reviewItems: readiness.reviewItems.length,
            acknowledgeField: "acknowledgeReadinessBlockers",
          },
          { status: 422 },
        );
      }
      readinessOutcome = readiness;

      if (P3_ARCHITECTURE_DELIVERABLE_KEYS.has(deliverableTypeKey)) {
        if (!ctx.clientKey) {
          return Response.json(
            {
              error: "architecture_lineage_not_current",
              detail: "The active tenant key is unavailable.",
            },
            { status: 409 },
          );
        }
        const structuredData = (
          versionRow as {
            structured_data?: Record<string, unknown> | null;
          } | null
        )?.structured_data;
        const approved = await loadApprovedSolutionApproach({
          moveId: programId,
          clientId: ctx.clientId,
        });
        const freshness = await loadCurrentMoveContextExtractFreshness({
          tenantKey: ctx.clientKey,
          moveId: programId,
          phase: 3,
        });
        if (!approved || !freshness?.evidenceFingerprint) {
          return Response.json(
            {
              error: "architecture_lineage_not_current",
              detail:
                "The current approved option or P3 context snapshot is unavailable.",
            },
            { status: 409 },
          );
        }
        const validation = validateArchitectureGenerationLineage({
          lineage: structuredData?.generationLineage,
          approved,
          currentContextSnapshotHash: freshness.evidenceFingerprint,
        });
        if (!validation.ok) {
          return Response.json(
            {
              error: "architecture_lineage_not_current",
              detail: validation.detail,
            },
            { status: 409 },
          );
        }
      }
    }

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
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
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

        const title = deliverableTitle;
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const body = Buffer.from(await file.arrayBuffer());
        const phase =
          DELIVERABLE_REGISTRY.find(
            (spec) => spec.deliverableTypeKey === deliverableTypeKey,
          )?.phase ?? 0;
        const parsed = await extractProgramEvidenceFromUploadBuffer({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          buffer: body,
          cacheScope: `program:${programId}:deliverable:${deliverableId}:approval`,
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

        const saved = await saveMoveArtifact(ctx, {
          moveId: programId,
          phase,
          artifactType: deliverableTypeKey,
          artifactFamily: "generated_deliverable",
          title: title || deliverableTypeKey.replace(/_/g, " "),
          description:
            "Client-approved replacement — uploaded to replace the AI draft.",
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
            deliverableId,
            clientApprovedReplacement: true,
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
      }
    }

    const signedOff = await signOffDeliverable(ctx, programId, deliverableId, {
      supabase,
      approvedArtifactId,
      approvedContent,
    });
    if (!signedOff)
      return Response.json({ error: "not_found" }, { status: 404 });

    // Record an override, not the absence of one. A deliverable signed off
    // over known client-visible findings is a materially different fact from
    // one that scanned clean, and the record has to say which happened, with
    // the findings named.
    if (readinessOutcome?.verdict === "acknowledged") {
      await writeProgramAuditLogBestEffort(ctx, {
        programId,
        action: "deliverable_signed_off_with_readiness_blockers",
        toState: "signed_off",
        rationale: readinessOutcome.summary,
        evidenceRefs: readinessOutcome.acknowledgedFindings,
      });
    }

    return Response.json({
      ok: true,
      deliverableId,
      status: "signed_off",
      signedOffBy: ctx.userId,
      approvedArtifactId: approvedArtifactId ?? null,
      clientReadiness: readinessOutcome
        ? {
            verdict: readinessOutcome.verdict,
            summary: readinessOutcome.summary,
            reviewItems: readinessOutcome.reviewItems.length,
            acknowledgedFindings: readinessOutcome.acknowledgedFindings,
          }
        : null,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error("[POST /programs/:id/deliverables/:did/sign-off]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
