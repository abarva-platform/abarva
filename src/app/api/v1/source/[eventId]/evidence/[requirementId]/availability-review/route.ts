import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { evidenceById } from "@/lib/source/canonical-specs";
import {
  evidenceStateRowToView,
  type SourceEventEvidenceCurrentState,
  type SourceEventEvidenceStateRow,
} from "@/lib/source/canvas-substrate/types";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ eventId: string; requirementId: string }>;
};

type ReviewContext = {
  currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  effectiveClientKey: string;
  eventId: string;
  evidence: SourceEventEvidenceStateRow;
  reviewer: {
    personId: string;
    displayName: string;
    email: string;
    role: string;
  };
  requirement: NonNullable<ReturnType<typeof evidenceById>>;
};

type ReviewPersonRow = {
  id: string;
  name: string | null;
  email: string | null;
};

const STATE_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Stale: 0,
  "Low Confidence": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
};

const REVIEW_PROVENANCE = "uploaded-evidence-human-review";
const REVIEW_SCOPE = "availability_only";
const REVIEW_DISCLAIMER =
  "Confirms that parsed evidence is available for this workflow requirement. It does not approve legal, security, commercial, supplier, or finance content.";
const PLACEHOLDER_REVIEWER_NAMES = new Set([
  "user",
  "unknown",
  "unknown user",
]);

function badRequest(detail: string): Response {
  return Response.json(
    { ok: false, error: "bad_request", detail },
    { status: 400 },
  );
}

function cleanRationale(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 8) return null;
  return trimmed.slice(0, 8_000);
}

function cleanReviewerName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || PLACEHOLDER_REVIEWER_NAMES.has(trimmed.toLowerCase())) {
    return null;
  }
  return trimmed;
}

function reviewPreview(context: ReviewContext) {
  return {
    actionType: "evidence_reviewed",
    actionLabel: `Reviewed parsed evidence: ${context.requirement.label}`,
    reviewer: context.reviewer,
    requirementId: context.requirement.requirementId,
    requirementLabel: context.requirement.label,
    stage: context.requirement.stage,
    currentState: context.evidence.current_state,
    targetState:
      STATE_RANK[context.evidence.current_state] > STATE_RANK.Available
        ? context.evidence.current_state
        : "Available",
    provenance: REVIEW_PROVENANCE,
    reviewScope: REVIEW_SCOPE,
    approvalGranted: false,
    disclaimer: REVIEW_DISCLAIMER,
  };
}

async function resolveReviewContext(
  eventId: string,
  requirementId: string,
): Promise<ReviewContext | Response> {
  const requirement = evidenceById(requirementId);
  if (!requirement) return badRequest("Unknown evidence requirement.");

  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    tenancyError = error;
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const fallbackClientKey =
    (isClientKey(currentUser?.metadataClientKey)
      ? currentUser.metadataClientKey
      : null) ?? inferClientKeyFromEmail(currentUser?.email);
  const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
  if (!effectiveClientKey) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        ok: false,
        error: "no_client",
        detail: "No active client for Source evidence review.",
      },
      { status: 403 },
    );
  }
  if (!currentUser?.personId || !currentUser.email) {
    return Response.json(
      {
        ok: false,
        error: "reviewer_identity_required",
        detail:
          "A tenant-scoped person record with name and email is required before evidence can be reviewed.",
      },
      { status: 409 },
    );
  }

  const db = getAzureWriteFluentClient();
  const { data: reviewerPerson, error: reviewerError } = await db
    .from("persons")
    .select("id, name, email")
    .eq("id", currentUser.personId)
    .maybeSingle<ReviewPersonRow>();
  if (reviewerError) {
    return Response.json(
      { ok: false, error: "lookup_failed", detail: reviewerError.message },
      { status: 500 },
    );
  }
  const reviewerPersonId = reviewerPerson?.id;
  const reviewerName = cleanReviewerName(reviewerPerson?.name);
  const reviewerEmail =
    reviewerPerson?.email?.trim() || currentUser.email.trim();
  if (!reviewerPersonId || !reviewerName || !reviewerEmail) {
    return Response.json(
      {
        ok: false,
        error: "reviewer_identity_required",
        detail:
          "A tenant-scoped person record with name and email is required before evidence can be reviewed.",
      },
      { status: 409 },
    );
  }

  const resolvedEventId = await resolveSourceEventUuidForClient(
    eventId,
    effectiveClientKey,
  ).catch(() => null);
  const persistedEventId = resolvedEventId ?? eventId;
  const { data: persistedEvent, error: eventError } = await db
    .from("source_events")
    .select("id, client_key")
    .eq("id", persistedEventId)
    .maybeSingle<{ id: string; client_key: string }>();
  if (eventError) {
    return Response.json(
      { ok: false, error: "lookup_failed", detail: eventError.message },
      { status: 500 },
    );
  }
  if (!persistedEvent || persistedEvent.client_key !== effectiveClientKey) {
    return Response.json(
      {
        ok: false,
        error: "not_found",
        detail: `No source event with id ${eventId}`,
      },
      { status: 404 },
    );
  }

  const accessPolicy =
    tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: persistedEvent.id,
        }).catch(() => null)
      : null;
  const canReview = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
    accessPolicy?.canGenerateSourcingArtifacts,
  );
  if (!canReview) {
    return Response.json(
      {
        ok: false,
        error: "forbidden",
        detail: "Source contributor rights are required to review evidence.",
      },
      { status: 403 },
    );
  }

  const { data: evidence, error: evidenceError } = await db
    .from("source_event_evidence_states")
    .select("*")
    .eq("source_event_id", persistedEvent.id)
    .eq("requirement_id", requirementId)
    .maybeSingle<SourceEventEvidenceStateRow>();
  if (evidenceError) {
    return Response.json(
      { ok: false, error: "lookup_failed", detail: evidenceError.message },
      { status: 500 },
    );
  }
  if (!evidence || STATE_RANK[evidence.current_state] < STATE_RANK.Parsed) {
    return Response.json(
      {
        ok: false,
        error: "parsed_evidence_required",
        detail:
          "Evidence must be parsed before a human availability review is recorded.",
      },
      { status: 409 },
    );
  }

  return {
    currentUser,
    effectiveClientKey,
    eventId: persistedEvent.id,
    evidence,
    reviewer: {
      personId: reviewerPersonId,
      displayName: reviewerName,
      email: reviewerEmail,
      role: currentUser.primaryRole,
    },
    requirement,
  };
}

export async function GET(_request: NextRequest, { params }: RouteCtx) {
  try {
    const { eventId, requirementId } = await params;
    const context = await resolveReviewContext(eventId, requirementId);
    if (context instanceof Response) return context;
    return Response.json({ ok: true, review: reviewPreview(context) });
  } catch (error) {
    console.error(
      "[GET /api/v1/source/:eventId/evidence/:requirementId/availability-review]",
      error,
    );
    return Response.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteCtx) {
  try {
    const { eventId, requirementId } = await params;
    const body = (await request.json().catch(() => null)) as {
      rationale?: unknown;
      stage?: unknown;
    } | null;
    const rationale = cleanRationale(body?.rationale);
    if (!rationale)
      return badRequest("rationale must be at least 8 characters.");

    const context = await resolveReviewContext(eventId, requirementId);
    if (context instanceof Response) return context;
    const requestedStage =
      typeof body?.stage === "string"
        ? normalizeSourceStageKey(body.stage)
        : null;
    if (requestedStage && requestedStage !== context.requirement.stage) {
      return badRequest(
        `requirement ${requirementId} belongs to ${context.requirement.stage}, not ${requestedStage}.`,
      );
    }

    const nowIso = new Date().toISOString();
    const targetState =
      STATE_RANK[context.evidence.current_state] > STATE_RANK.Available
        ? context.evidence.current_state
        : "Available";
    const reviewNote = [
      `Evidence lifecycle review (${nowIso})`,
      `reviewer=${context.reviewer.displayName}`,
      `person_id=${context.reviewer.personId}`,
      `scope=${REVIEW_SCOPE}`,
      "approval_granted=false",
      rationale,
    ].join("; ");
    const notes = context.evidence.notes
      ? `${context.evidence.notes}\n${reviewNote}`
      : reviewNote;

    const db = getAzureWriteFluentClient();
    const { data: row, error: updateError } = await db
      .from("source_event_evidence_states")
      .update({
        current_state: targetState,
        notes,
        last_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", context.evidence.id)
      .eq("tenant_key", context.effectiveClientKey)
      .select("*")
      .single<SourceEventEvidenceStateRow>();
    if (updateError) {
      return Response.json(
        { ok: false, error: "update_failed", detail: updateError.message },
        { status: 500 },
      );
    }
    if (!row) {
      return Response.json(
        {
          ok: false,
          error: "update_failed",
          detail: "Evidence review did not return a persisted row.",
        },
        { status: 500 },
      );
    }

    const sourceWrite = selectSourceWriteAdapter(
      undefined,
      context.effectiveClientKey,
    );
    const preview = reviewPreview(context);
    const activityWrite = await sourceWrite.insertActivityLog({
      eventId: context.eventId,
      clientKey: context.effectiveClientKey,
      actorUserId: context.reviewer.personId,
      actorDisplayName: context.reviewer.displayName,
      actorRole: context.reviewer.role,
      actionType: preview.actionType,
      actionLabel: preview.actionLabel,
      stageKey: context.requirement.stage,
      criterionId: requirementId,
      reason: "evidence lifecycle review",
      metadata: {
        requirementId,
        label: context.requirement.label,
        provenance: REVIEW_PROVENANCE,
        reviewScope: REVIEW_SCOPE,
        approvalGranted: false,
        rationale,
        state: targetState,
        disclaimer: REVIEW_DISCLAIMER,
      },
      occurredAtIso: nowIso,
    });
    if (!activityWrite.ok) {
      console.error("[source evidence review activity] insert failed", {
        error: activityWrite.error,
      });
    }

    return Response.json({
      ok: true,
      evidence: evidenceStateRowToView(row),
      review: {
        ...preview,
        targetState,
        rationale,
        reviewedAt: nowIso,
      },
    });
  } catch (error) {
    console.error(
      "[POST /api/v1/source/:eventId/evidence/:requirementId/availability-review]",
      error,
    );
    return Response.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
