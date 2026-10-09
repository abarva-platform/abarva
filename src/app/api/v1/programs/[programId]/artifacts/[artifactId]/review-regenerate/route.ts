// POST /api/v1/programs/:programId/artifacts/:artifactId/review-regenerate
// Captures client review feedback and writes the next durable Move artifact
// version through the existing move_artifacts vault.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  downloadArtifactBytes,
  getMoveArtifactForTenant,
  saveMoveArtifact,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import {
  buildReviewRegenerationPlan,
  buildReviewRegenerationPrompt,
} from "@/lib/programs/deliverables/review-regeneration";
import {
  buildPhaseWordEquivalentDocx,
  phaseWordEquivalentFileName,
} from "@/lib/deliverables/phase-word-equivalent";
import { extractOfficeText } from "@/lib/deliverables/shared/office-text-extract";
import { getPhaseDeliverablePackageContract } from "@/lib/programs/phase-deliverable-package-contract";
import {
  moveReviewRegenerateRefusalDetail,
  type MoveReviewRegenerateRefusalCode,
} from "@/lib/programs/move-review-regenerate-refusal";
import { streamAgentTurn } from "@/lib/agent/stream";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function stripHtmlFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function htmlFileNameFrom(title: string, version: number): string {
  const stem =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "review-regenerated-artifact";
  return `${stem}-v${version}-review-regenerated.html`;
}

function maxTokensForReview(requested: number): number {
  const envTokens = Number(process.env.NEXUS_MOVES_ARTIFACT_MAX_TOKENS ?? 0);
  return Math.max(Number.isFinite(envTokens) ? envTokens : 0, requested);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isEditablePackagingRequest(feedbackText: string): boolean {
  const text = feedbackText.toLowerCase();
  const asksForEditableRecord =
    /(editable|word[-\s]?equivalent|docx|phase[-\s]?end|sponsor review|review package|package for sponsor)/.test(
      text,
    );
  const asksForSubstantiveRewrite =
    /(rewrite|redo|rework|replace|add diagram|add chart|add table|change section|new analysis|new recommendation|revise architecture|revise roadmap|revise business case)/.test(
      text,
    ) ||
    /(layout|pagination|page break|page layout|formatting|duplicate|repeated section|consolidate|restructure|table row|section heading)/.test(
      text,
    );
  return asksForEditableRecord && !asksForSubstantiveRewrite;
}

async function readableArtifactBody(
  bytes: Buffer,
  fileFormat: string,
): Promise<string | null> {
  const format = fileFormat.trim().toLowerCase().replace(/^\./, "");
  if (format === "docx" || format === "pptx") {
    const extracted = await extractOfficeText(bytes, format);
    return extracted.ok ? extracted.text : null;
  }

  if (
    !["html", "htm", "md", "markdown", "txt", "csv", "json", "xml"].includes(
      format,
    )
  ) {
    return null;
  }

  const source = bytes.toString("utf8");
  if (format === "html" || format === "htm") {
    return source
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }
  return source.trim() || null;
}

function renderDeterministicReviewCompanionHtml(args: {
  title: string;
  feedbackText: string;
  feedbackItems: Array<{
    id: string;
    area: string;
    priority: string;
    requestedChange: string;
  }>;
  artifactTitle: string;
  artifactType: string;
  phase: number;
  qualityStatus: string;
  goldenBarStatus: string;
  preliminaryCaveat: string;
}): string {
  const feedbackRows =
    args.feedbackItems.length > 0
      ? args.feedbackItems
          .map(
            (item) => `<tr>
              <td>${escapeHtml(item.id)}</td>
              <td>${escapeHtml(item.area)}</td>
              <td>${escapeHtml(item.priority)}</td>
              <td>${escapeHtml(item.requestedChange)}</td>
            </tr>`,
          )
          .join("")
      : `<tr><td colspan="4">No parseable feedback items were found.</td></tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(args.title)}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; color: #17202a; margin: 40px; line-height: 1.5; }
      h1, h2 { font-family: Georgia, serif; color: #111827; }
      .status { display: inline-block; border: 1px solid #b45309; color: #92400e; background: #fffbeb; padding: 6px 10px; border-radius: 999px; font-weight: 700; }
      .note { border-left: 4px solid #0ea5e9; background: #f0f9ff; padding: 12px 16px; margin: 16px 0; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; }
      th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <p class="status">Review required</p>
    <h1>${escapeHtml(args.title)}</h1>
    <p class="note">This review companion records workspace-review packaging feedback and creates the paired editable phase record. It does not mark the deliverable final, approved, or board-ready.</p>

    <h2>Executive Summary</h2>
    <p>The prior phase artifact remains the source visual review companion. This version records workspace review feedback, preserves the evidence caveats, and creates the paired Word-equivalent deliverable for authorized workspace-user review.</p>

    <h2>Table of Contents</h2>
    <ol>
      <li>Executive Summary</li>
      <li>Review Status</li>
      <li>Feedback Applied</li>
      <li>Client-To-Complete Fields</li>
      <li>Lineage</li>
    </ol>

    <h2>Review Status</h2>
    <table>
      <tr><th>Field</th><th>Status</th></tr>
      <tr><td>Phase</td><td>P${args.phase}</td></tr>
      <tr><td>Artifact type</td><td>${escapeHtml(args.artifactType)}</td></tr>
      <tr><td>Prior artifact</td><td>${escapeHtml(args.artifactTitle)}</td></tr>
      <tr><td>Quality check</td><td>${escapeHtml(args.qualityStatus)}</td></tr>
      <tr><td>Golden-bar check</td><td>${escapeHtml(args.goldenBarStatus)}</td></tr>
      <tr><td>Evidence caveat</td><td>${escapeHtml(args.preliminaryCaveat)}</td></tr>
    </table>

    <h2>Feedback Applied</h2>
    <table>
      <tr><th>Item</th><th>Area</th><th>Priority</th><th>Requested change</th></tr>
      ${feedbackRows}
    </table>

    <h2>Original Feedback</h2>
    <p>${escapeHtml(args.feedbackText)}</p>

    <h2>Client-To-Complete Fields</h2>
    <table>
      <tr><th>Field</th><th>Why it matters</th></tr>
      <tr><td>Evidence owner</td><td>Confirms who will provide or approve the missing support.</td></tr>
      <tr><td>Source file or meeting note</td><td>Provides traceable backing for the requested change.</td></tr>
      <tr><td>Final approval decision</td><td>Determines whether this version can move from review required to approved.</td></tr>
    </table>

    <h2>Lineage</h2>
    <p>This review companion was generated from the prior artifact version and review feedback. It is paired with an editable Word-equivalent deliverable and remains review-required until an authorized workspace user approves it.</p>
  </body>
</html>`;
}

function normalizeReviewArtifactKey(
  artifactType: string | undefined,
  phase: number,
  title: string,
): DeliverableKey {
  const raw = `${artifactType ?? ""} ${title}`.toLowerCase();
  if (raw.includes("charter")) return "charter";
  if (raw.includes("root cause")) return "root_cause_worksheet";
  if (
    raw.includes("diagnose") ||
    raw.includes("diagnostic") ||
    raw.includes("discover")
  ) {
    return "discovery_report";
  }
  if (raw.includes("approach") || raw.includes("option")) {
    return "solution_approach_options";
  }
  if (raw.includes("architecture") || raw.includes("target state")) {
    return "target_state_architecture";
  }
  if (raw.includes("business case")) return "business_case";
  if (raw.includes("roadmap")) return "execution_roadmap";
  if (raw.includes("handoff")) return "handoff_package";
  if (phase === 1) return "charter";
  if (phase === 2) return "discovery_report";
  if (phase === 4) return "execution_roadmap";
  if (phase === 5) return "handoff_package";
  return "solution_design";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { programId, artifactId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json().catch(() => ({}))) as {
      feedbackText?: string;
    };
    const feedbackText = String(body.feedbackText ?? "").trim();
    if (!feedbackText) {
      return Response.json(
        {
          ok: false,
          error: "feedback_required" satisfies MoveReviewRegenerateRefusalCode,
          detail: moveReviewRegenerateRefusalDetail("feedback_required"),
        },
        { status: 400 },
      );
    }

    const artifact = await getMoveArtifactForTenant(ctx, artifactId);
    if (!artifact || artifact.move_id !== programId) {
      return Response.json(
        {
          ok: false,
          error: "artifact_not_found" satisfies MoveReviewRegenerateRefusalCode,
          detail: moveReviewRegenerateRefusalDetail("artifact_not_found"),
        },
        { status: 404 },
      );
    }

    const plan = buildReviewRegenerationPlan({
      artifact,
      feedbackText,
      requestedBy: ctx.email ?? ctx.userId,
    });
    const original = await downloadArtifactBytes(ctx, artifactId);
    const originalArtifactBody = original
      ? await readableArtifactBody(original.bytes, original.fileFormat)
      : "[MISSING — prior artifact body could not be retrieved from artifact storage. Use metadata and feedback, and preserve this as a client-to-complete caveat.]";
    if (original && !originalArtifactBody) {
      return Response.json(
        {
          ok: false,
          error:
            "source_artifact_not_extractable" satisfies MoveReviewRegenerateRefusalCode,
          detail: moveReviewRegenerateRefusalDetail(
            "source_artifact_not_extractable",
          ),
        },
        { status: 422 },
      );
    }
    const artifactKey = normalizeReviewArtifactKey(
      artifact.artifact_type,
      artifact.phase ?? 0,
      artifact.title,
    );
    let regenerationMode = "complete_artifact";
    let regeneratedHtml = "";
    if (isEditablePackagingRequest(feedbackText)) {
      regenerationMode = "deterministic_editable_review_package";
      regeneratedHtml = renderDeterministicReviewCompanionHtml({
        title: plan.title,
        feedbackText,
        feedbackItems: plan.feedbackItems,
        artifactTitle: artifact.title,
        artifactType: artifactKey,
        phase: artifact.phase ?? 0,
        qualityStatus: plan.qualityStatus,
        goldenBarStatus: plan.goldenBarStatus,
        preliminaryCaveat: plan.preliminaryCaveat,
      });
    } else {
      const prompt = buildReviewRegenerationPrompt({
        artifact,
        artifactKey,
        feedbackText,
        feedbackItems: plan.feedbackItems,
        originalArtifactBody: originalArtifactBody ?? "",
        phase: artifact.phase ?? 0,
        contextSummary:
          typeof artifact.metadata?.solutionContextDigest === "string"
            ? artifact.metadata.solutionContextDigest
            : undefined,
      });
      for await (const chunk of streamAgentTurn({
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
        model: process.env.NEXUS_COMPOSER_MODEL ?? "claude-opus-4-7",
        maxTokens: maxTokensForReview(prompt.maxTokens),
        aiEgress: {
          tenantId: ctx.clientId,
          userId: /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(ctx.userId ?? "")
            ? ctx.userId
            : undefined,
          workflow: "moves-review-regenerate-complete-artifact",
          dataClass: "confidential",
          artifactType: "program",
          metadata: {
            output_format: "html",
            artifact: artifactKey,
            phase: artifact.phase ?? 0,
            regeneratedFromArtifactId: artifact.artifact_id,
          },
        },
      })) {
        regeneratedHtml += chunk;
      }
      regeneratedHtml = stripHtmlFences(regeneratedHtml);
    }
    if (!regeneratedHtml.trim()) {
      regeneratedHtml = plan.body;
    }

    const saved = await saveMoveArtifact(ctx, {
      moveId: programId,
      phase: artifact.phase ?? 0,
      artifactType: artifact.artifact_type,
      artifactFamily: artifact.artifact_family as ArtifactFamily,
      title: plan.title,
      description:
        "Complete regenerated artifact from client review feedback. Requires review before final use.",
      fileName: htmlFileNameFrom(artifact.title, (artifact.version ?? 1) + 1),
      fileFormat: regeneratedHtml === plan.body ? "md" : "html",
      body: regeneratedHtml,
      status: "review_required",
      generatedBy: ctx.email ?? ctx.userId ?? "review-regenerate",
      qualityScore: plan.qualityScore,
      unsupportedClaimsCount: 0,
      sourceBasis: "client_review_feedback",
      confidence: "medium",
      citationReady: false,
      metadata: {
        ...(artifact.metadata ?? {}),
        ...plan.metadata,
        sourceArtifactTitle: artifact.title,
        regenerationMode,
        outputRole: "html_visual_review_companion",
        provenanceCategory: "abarva_generated_deliverable",
        originalArtifactBodyRetrieved: Boolean(original),
      },
    });

    // Everything below this point runs AFTER the revised artifact is stored.
    // A throw here used to reach the handler's catch, which reported it as an
    // unbodied 500 — telling a reviewer nothing about the version that had
    // already landed. It gets its own arm so the refusal can say so.
    let editableSaved: Awaited<ReturnType<typeof saveMoveArtifact>>;
    try {
      const deliverablePackageContract = getPhaseDeliverablePackageContract({
        artifact: artifactKey,
        phase: artifact.phase ?? 0,
      });
      const editableDocx = await buildPhaseWordEquivalentDocx({
        artifact: artifactKey,
        phase: artifact.phase ?? 0,
        moveName: artifact.title,
        title: plan.title,
        html: regeneratedHtml,
        generationMode: "draft",
        reviewStatus: "review_required",
        qualityStatus: plan.qualityStatus,
        goldenBarStatus: plan.goldenBarStatus,
        contract: deliverablePackageContract,
        feedbackSummary: plan.feedbackItems.map((item) => item.requestedChange),
      });
      editableSaved = await saveMoveArtifact(ctx, {
        moveId: programId,
        phase: artifact.phase ?? 0,
        artifactType: `${artifact.artifact_type}_editable_docx`,
        artifactFamily: artifact.artifact_family as ArtifactFamily,
        title: `${plan.title} — Editable Deliverable`,
        description:
          "Editable Word-equivalent regenerated from client review feedback. Requires review before final use.",
        fileName: phaseWordEquivalentFileName({
          title: plan.title,
          artifact: artifact.artifact_type,
          version: saved.version,
        }),
        fileFormat: "docx",
        body: editableDocx,
        status: "review_required",
        generatedBy: ctx.email ?? ctx.userId ?? "review-regenerate",
        qualityScore: plan.qualityScore,
        unsupportedClaimsCount: 0,
        sourceBasis: "client_review_feedback",
        confidence: "medium",
        citationReady: false,
        metadata: {
          ...(artifact.metadata ?? {}),
          ...plan.metadata,
          outputFormat: "docx",
          outputRole: "docx_editable_phase_record",
          provenanceCategory: "abarva_generated_deliverable",
          pairedVisualCompanionArtifactId: saved.artifactId,
          visualCompanionArtifactType: artifact.artifact_type,
          editableWordEquivalentRequired:
            deliverablePackageContract.formalEditableRecordRequired,
          primaryEditableRecordLabel:
            deliverablePackageContract.primaryEditableRecordLabel,
          requiredCompanionOutputs: deliverablePackageContract.outputs,
          wordEquivalentSections:
            deliverablePackageContract.wordDocumentSections,
          requiredWorkshopEvidence:
            deliverablePackageContract.requiredWorkshopEvidence,
          provenanceRules: deliverablePackageContract.provenanceRules,
          sourceArtifactTitle: artifact.title,
          regenerationMode,
          originalArtifactBodyRetrieved: Boolean(original),
          regeneratedFromArtifactId: artifact.artifact_id,
          reviewStatus: "review_required",
          clientFacingVersionLabel: `Version ${saved.version}`,
        },
      });
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            "editable_companion_failed" satisfies MoveReviewRegenerateRefusalCode,
          detail: moveReviewRegenerateRefusalDetail(
            "editable_companion_failed",
          ),
          recordedArtifactId: saved.artifactId,
          recordedVersion: saved.version,
        },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      feedbackItems: plan.feedbackItems,
      feedbackItemCount: plan.feedbackItems.length,
      regeneratedArtifact: {
        artifactId: saved.artifactId,
        version: saved.version,
        title: plan.title,
        status: "review_required",
        qualityScore: plan.qualityScore,
        qualityStatus: plan.qualityStatus,
        goldenBarStatus: plan.goldenBarStatus,
        regeneratedFromArtifactId: artifact.artifact_id,
        blobStored: saved.blobStored,
        editableArtifactId: editableSaved.artifactId,
        editableArtifactVersion: editableSaved.version,
        editableBlobStored: editableSaved.blobStored,
      },
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      // `tenancyErrorResponse` re-throws anything that is not a TenancyError.
      // That second throw rejected this handler, so the only report a reviewer
      // got was an unbodied `HTTP 500`. This arm is reachable on EITHER side
      // of the two stores, so its sentence claims neither.
      return Response.json(
        {
          ok: false,
          error: "internal_error" satisfies MoveReviewRegenerateRefusalCode,
          detail: moveReviewRegenerateRefusalDetail("internal_error"),
        },
        { status: 500 },
      );
    }
  }
}
