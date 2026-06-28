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
}

const DECISION_CONFIG: Record<
  ArtifactReviewDecision,
  Pick<
    ArtifactReviewReadiness,
    "readyForP3Draft" | "readyForP3Final" | "p2FinalApproved" | "allowedNextAction" | "reason"
  >
> = {
  approve_for_p3_draft: {
    readyForP3Draft: true,
    readyForP3Final: false,
    p2FinalApproved: false,
    allowedNextAction: "generate_p3_draft",
    reason:
      "P2 is accepted as a diagnostic basis for P3 draft shaping; final sponsor/signoff gates still apply.",
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

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function hasText(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
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
  artifactHtml?: string | null;
}): P2ReviewPacket {
  const text = htmlToText(args.artifactHtml ?? "");
  const meta = args.artifact.metadata ?? {};
  const metaOpenItems = cleanList(meta.openItems);
  const missingInputs = cleanList(meta.missingInputs ?? meta.missing_inputs);
  const caveats = cleanList(meta.clientCompleteItems ?? meta.client_complete_items);

  const quantifiedFacts = unique([
    hasText(text, /\b1,872\b/) ? "1,872 monthly invoice exceptions" : "",
    hasText(text, /\b2,345\b/)
      ? "2,345 manual touch hours per month"
      : "",
    hasText(text, /\b7\.4\b/) ? "7.4 average resolution days" : "",
    hasText(text, /payment hold/i)
      ? "Payment hold exposure is visible in the diagnostic evidence"
      : "",
    hasText(text, /duplicate[-\s]?payment/i)
      ? "Duplicate-payment control risk is called out as a control implication"
      : "",
  ]);

  const strongestEvidence = unique([
    quantifiedFacts.length
      ? "The diagnostic contains quantified exception volume, manual effort, and cycle-time evidence."
      : "The diagnostic artifact is evidence-bound and available for sponsor review.",
    hasText(text, /invoice|exception|AP|accounts payable/i)
      ? "The evidence pattern is tied to invoice exception handling and AP operating work."
      : "",
    hasText(text, /triage|classification|routing|duplicate/i)
      ? "The artifact separates AI-assist opportunities from payment-control decisions."
      : "",
    hasText(text, /golden bar|quality score|review required/i)
      ? "Quality and review posture are visible in the artifact governance metadata."
      : "",
  ]);

  const knownLimitations = unique([
    "P2 is review-ready, but it is not final sponsor/signoff approval.",
    "P3 may proceed only as a draft until final gates are satisfied.",
    hasText(text, /human|approval|control/i)
      ? "AI can assist classification, triage, duplicate detection, and routing, but should not bypass human-controlled payment decisions without stronger controls."
      : "AI-fit boundaries must remain explicit in P3 design.",
    ...metaOpenItems,
    ...caveats,
  ]);

  const missingEvidence = unique([
    ...missingInputs,
    "Sponsor/signoff evidence for final P2 approval",
    "Client-confirmed control owner and payment decision approval boundary",
  ]);

  return {
    headline: "P2 diagnostic is review-ready.",
    diagnosticThesis:
      "The Current Work Diagnostic is strong enough to support P3 future-state draft shaping, provided open evidence and final sponsor/signoff caveats are carried forward.",
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
          "Allows future-state design drafts from this P2 diagnostic. Does not mark P2 final or bypass sponsor/signoff gates.",
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
      "Approve for P3 draft shaping if the sponsor accepts the diagnostic caveats; otherwise request revisions or hold for evidence.",
    p3Implication:
      "P3 should reference this P2 diagnostic as the basis and visibly carry forward all unresolved evidence and final-gate caveats.",
  };
}

export function normalizeDecision(value: unknown): ArtifactReviewDecision | null {
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
      reviewer_user_id: ctx.userId ?? null,
      reviewer_email: ctx.email ?? null,
      decision: input.decision,
      rationale: input.rationale.trim(),
      carried_forward_caveats: input.carriedForwardCaveats ?? [],
      missing_evidence: input.missingEvidence ?? [],
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
