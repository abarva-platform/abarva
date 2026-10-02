import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { MoveArtifactRow } from "./move-artifacts";

export type ArtifactReviewDecision =
  | "approve_for_p3_draft"
  | "request_revisions"
  | "hold_for_evidence";

export interface ArtifactReviewDecisionRow {
  id: string;
  tenant_id: string;
  tenant_key: string;
  move_id: string;
  phase: number;
  artifact_id: string;
  artifact_version: number;
  html_visual_companion_artifact_id: string | null;
  docx_editable_artifact_id: string | null;
  reviewed_artifact_ids: string[];
  reviewer_user_id: string | null;
  reviewer_email: string | null;
  decision: ArtifactReviewDecision;
  rationale: string;
  carried_forward_caveats: string[];
  missing_evidence: string[];
  allowed_next_action: string;
  ready_for_p3_draft: boolean;
  ready_for_p3_final: boolean;
  p2_final_approved: boolean;
  created_at: string;
}

export interface ArtifactReviewReadiness {
  readyForP3Draft: boolean;
  readyForP3Final: boolean;
  p2FinalApproved: boolean;
  allowedNextAction: string;
  reason: string;
}

export interface ArtifactReviewPackage {
  reviewedArtifactId: string;
  htmlVisualCompanionArtifactId: string | null;
  docxEditableArtifactId: string | null;
  reviewedArtifactIds: string[];
}

export interface P2ReviewPacket {
  headline: string;
  diagnosticThesis: string;
  strongestEvidence: string[];
  quantifiedFacts: string[];
  knownLimitations: string[];
  missingEvidence: string[];
  decisionsRequired: string[];
  approvalOptions: Array<{
    decision: ArtifactReviewDecision;
    label: string;
    consequence: string;
  }>;
  recommendedNextAction: string;
  p3Implication: string;
}

export interface CreateArtifactReviewDecisionInput {
  artifact: MoveArtifactRow;
  decision: ArtifactReviewDecision;
  rationale: string;
  carriedForwardCaveats?: string[];
  missingEvidence?: string[];
  reviewPackage?: ArtifactReviewPackage;
}

const DECISION_CONFIG: Record<
  ArtifactReviewDecision,
  Pick<
    ArtifactReviewReadiness,
    | "readyForP3Draft"
    | "readyForP3Final"
    | "p2FinalApproved"
    | "allowedNextAction"
    | "reason"
  >
> = {
  approve_for_p3_draft: {
    readyForP3Draft: true,
    readyForP3Final: false,
    p2FinalApproved: false,
    allowedNextAction: "generate_p3_draft",
    reason:
      "P2 is accepted as a diagnostic basis for P3 draft shaping; final authorized-user approval gates still apply.",
  },
  request_revisions: {
    readyForP3Draft: false,
    readyForP3Final: false,
    p2FinalApproved: false,
    allowedNextAction: "regenerate_p2",
    reason:
      "Reviewer requested changes. P2 remains review-required and P3 remains blocked.",
  },
  hold_for_evidence: {
    readyForP3Draft: false,
    readyForP3Final: false,
    p2FinalApproved: false,
    allowedNextAction: "collect_missing_evidence",
    reason:
      "Reviewer held P2 for missing evidence. P3 remains blocked until required inputs are provided.",
  },
};

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function metadataList(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string[] {
  return unique(keys.flatMap((key) => cleanList(metadata[key])));
}

function metadataText(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function jsonb(value: unknown): string {
  return JSON.stringify(value ?? []);
}

function metaString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildReviewPackageFromArtifacts(args: {
  artifact: MoveArtifactRow;
  pairedArtifact?: MoveArtifactRow | null;
}): ArtifactReviewPackage {
  const artifact = args.artifact;
  const artifactMeta = artifact.metadata ?? {};
  const paired = args.pairedArtifact ?? null;
  const pairedMeta = paired?.metadata ?? {};

  const artifactOutputRole = metaString(artifactMeta, "outputRole");
  const pairedOutputRole = paired ? metaString(pairedMeta, "outputRole") : null;

  const htmlVisualCompanionArtifactId =
    artifactOutputRole === "html_visual_review_companion" ||
    artifact.file_format === "html"
      ? artifact.artifact_id
      : pairedOutputRole === "html_visual_review_companion" ||
          paired?.file_format === "html"
        ? (paired?.artifact_id ?? null)
        : (metaString(artifactMeta, "pairedVisualCompanionArtifactId") ??
          metaString(pairedMeta, "pairedVisualCompanionArtifactId"));

  const docxEditableArtifactId =
    artifactOutputRole === "docx_editable_phase_record" ||
    artifact.file_format === "docx"
      ? artifact.artifact_id
      : pairedOutputRole === "docx_editable_phase_record" ||
          paired?.file_format === "docx"
        ? (paired?.artifact_id ?? null)
        : null;

  return {
    reviewedArtifactId: artifact.artifact_id,
    htmlVisualCompanionArtifactId,
    docxEditableArtifactId,
    reviewedArtifactIds: unique([
      artifact.artifact_id,
      htmlVisualCompanionArtifactId ?? "",
      docxEditableArtifactId ?? "",
    ]),
  };
}

export function readinessForDecision(
  decision: ArtifactReviewDecision | null | undefined,
): ArtifactReviewReadiness {
  if (!decision) {
    return {
      readyForP3Draft: false,
      readyForP3Final: false,
      p2FinalApproved: false,
      allowedNextAction: "review_p2",
      reason:
        "P2 has not been explicitly reviewed. P3 draft and final generation remain blocked.",
    };
  }
  return DECISION_CONFIG[decision];
}

export function buildP2ReviewPacket(args: {
  artifact: MoveArtifactRow;
}): P2ReviewPacket {
  const meta = args.artifact.metadata ?? {};
  const metaOpenItems = metadataList(meta, "openItems", "open_items");
  const missingInputs = metadataList(meta, "missingInputs", "missing_inputs");
  const caveats = metadataList(
    meta,
    "clientCompleteItems",
    "client_complete_items",
  );
  const quantifiedFacts = metadataList(
    meta,
    "quantifiedFacts",
    "quantified_facts",
  );
  const strongestEvidence = metadataList(
    meta,
    "strongestEvidence",
    "strongest_evidence",
  );
  const knownLimitations = unique([
    ...metadataList(meta, "knownLimitations", "known_limitations"),
    ...metaOpenItems,
    ...caveats,
    "This review action authorizes P3 draft shaping only; it does not satisfy final P2 approval by an authorized workspace user.",
    "P3 remains subject to its own evidence and approval gates.",
  ]);
  const missingEvidence = unique([
    ...missingInputs,
    ...metaOpenItems,
    ...metadataList(meta, "missingEvidence", "missing_evidence"),
    "Evidence required for final P2 gate approval by an authorized workspace user",
  ]);
  const diagnosticThesis = metadataText(
    meta,
    "diagnosticThesis",
    "diagnostic_thesis",
  );
  const p3Implication = metadataText(meta, "p3Implication", "p3_implication");

  return {
    headline: `${args.artifact.title} · P2 authorized-user review`,
    diagnosticThesis:
      diagnosticThesis ??
      `${args.artifact.title} is presented for review. Confirm each conclusion against its cited source evidence and resolve or explicitly carry forward open items before P3 draft shaping.`,
    strongestEvidence,
    quantifiedFacts,
    knownLimitations,
    missingEvidence,
    decisionsRequired: [
      "Approve P2 for P3 draft shaping",
      "Request revisions and generate the next P2 version",
      "Hold P2 until required missing evidence is supplied",
    ],
    approvalOptions: [
      {
        decision: "approve_for_p3_draft",
        label: "Approve for P3 draft",
        consequence:
          "Allows future-state design drafts from this P2 diagnostic. Does not mark P2 final or bypass the authorized-user approval gate.",
      },
      {
        decision: "request_revisions",
        label: "Request revisions",
        consequence:
          "Captures reviewer feedback and keeps P2 in review-required state.",
      },
      {
        decision: "hold_for_evidence",
        label: "Hold for evidence",
        consequence:
          "Keeps P3 blocked until specific missing inputs are provided.",
      },
    ],
    recommendedNextAction:
      "Approve for P3 draft shaping only if the cited P2 evidence and explicit limitations are acceptable; otherwise request revisions or hold for evidence.",
    p3Implication:
      p3Implication ??
      "Use only reviewed, source-cited P2 findings as P3 inputs. Carry all open items and the authorized-user approval record forward; P3 remains subject to its own evidence and approval gates.",
  };
}

export function normalizeDecision(
  value: unknown,
): ArtifactReviewDecision | null {
  return value === "approve_for_p3_draft" ||
    value === "request_revisions" ||
    value === "hold_for_evidence"
    ? value
    : null;
}

export async function createArtifactReviewDecision(
  ctx: TenancyCtx,
  input: CreateArtifactReviewDecisionInput,
): Promise<ArtifactReviewDecisionRow> {
  const tenantKey = ctx.clientKey ?? "";
  const config = DECISION_CONFIG[input.decision];
  const reviewPackage =
    input.reviewPackage ??
    buildReviewPackageFromArtifacts({ artifact: input.artifact });
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("move_artifact_review_decisions")
    .insert({
      tenant_id: ctx.clientId,
      tenant_key: tenantKey,
      move_id: input.artifact.move_id,
      phase: input.artifact.phase ?? 0,
      artifact_id: input.artifact.artifact_id,
      artifact_version: input.artifact.version,
      html_visual_companion_artifact_id:
        reviewPackage.htmlVisualCompanionArtifactId,
      docx_editable_artifact_id: reviewPackage.docxEditableArtifactId,
      reviewed_artifact_ids: jsonb(reviewPackage.reviewedArtifactIds),
      reviewer_user_id: ctx.userId ?? null,
      reviewer_email: ctx.email ?? null,
      decision: input.decision,
      rationale: input.rationale.trim(),
      carried_forward_caveats: jsonb(input.carriedForwardCaveats ?? []),
      missing_evidence: jsonb(input.missingEvidence ?? []),
      allowed_next_action: config.allowedNextAction,
      ready_for_p3_draft: config.readyForP3Draft,
      ready_for_p3_final: config.readyForP3Final,
      p2_final_approved: config.p2FinalApproved,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ArtifactReviewDecisionRow;
}

export async function getLatestArtifactReviewDecision(
  ctx: TenancyCtx,
  args: { moveId: string; phase?: number; artifactId?: string },
): Promise<ArtifactReviewDecisionRow | null> {
  const tenantKey = ctx.clientKey ?? "";
  if (!tenantKey || !args.moveId) return null;
  try {
    const sb = getAzureWriteFluentClient();
    let q = sb
      .from("move_artifact_review_decisions")
      .select("*")
      .eq("tenant_key", tenantKey)
      .eq("move_id", args.moveId);
    if (typeof args.phase === "number") q = q.eq("phase", args.phase);
    if (args.artifactId) q = q.eq("artifact_id", args.artifactId);
    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as ArtifactReviewDecisionRow;
  } catch {
    return null;
  }
}

export async function hasPriorPhaseDraftApproval(
  ctx: TenancyCtx,
  args: { moveId: string; targetPhase: number },
): Promise<{
  approved: boolean;
  decision: ArtifactReviewDecisionRow | null;
  caveats: string[];
}> {
  if (args.targetPhase !== 3) {
    return { approved: false, decision: null, caveats: [] };
  }
  const decision = await getLatestArtifactReviewDecision(ctx, {
    moveId: args.moveId,
    phase: 2,
  });
  const approved = decision?.decision === "approve_for_p3_draft";
  return {
    approved,
    decision,
    caveats: approved
      ? [
          "P3 draft is based on an approved-for-draft P2 diagnostic, not final P2 signoff.",
          ...cleanList(decision?.carried_forward_caveats),
          ...cleanList(decision?.missing_evidence).map(
            (item) => `Client to complete before final: ${item}`,
          ),
        ]
      : [],
  };
}
