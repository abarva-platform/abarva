// POST /api/v1/source/:eventId/artifacts/:artifactCode/accept
//
// Body: { approvalRationale: string, contentDriftStatus?, gatePreconditionStatus?,
//         downstreamContextPolicy?, diffSummary? }
//
// SOURCE-SHELL-004 — records an explicit, auditable "accept this artifact as
// authoritative" action, independent of the stage GATE (see
// /api/v1/source/events/:eventId/approve for that). Append-only: this route
// never updates an existing row, it inserts a new source_artifact_acceptances
// row. `artifactState` and `artifactRole` are computed server-side from the
// real persisted artifact record — never trusted from the client — so an
// acceptance record always reflects what the artifact genuinely was at
// accept time, not what a caller claims.
//
// Auth: requireTenancy + canApproveSourceStages. Accepting an artifact as
// authoritative is a stronger claim than flipping its status or uploading a
// file, so it is gated by the same stricter permission the stage-gate
// approval route uses, not the broader canUploadSourceArtifacts check
// (Source integrity fix, 2026-07-23: see
// docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md, which found this
// route was guarded by the same permission as a plain upload).

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import type { SourceEventArtifactStateRow } from "@/lib/source/canvas-substrate/types";
import { scaffoldNewEventSubstrate } from "@/lib/source/queries";
import { deriveSourceArtifactGovernanceStage } from "@/lib/source/artifact-governance";
import { specByCode } from "@/lib/source/canonical-specs/artifact-specs";
import {
  insertArtifactAcceptance,
  type ArtifactContentDriftStatus,
  type ArtifactDownstreamContextPolicy,
  type ArtifactGatePreconditionStatus,
} from "@/lib/source/artifact-acceptances";
import { resolveArtifactAuthority } from "@/lib/source/contracts/artifact-authority";
import {
  getSourceArtifactContract,
  isArtifactEligibleAtStage,
} from "@/lib/source/contracts/registry";
import { normalizeSourceStageKey } from "@/lib/source/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

interface SourceArtifactGovernanceRow {
  id: string;
  status: string | null;
  lifecycle_state: string | null;
  approval_state: string | null;
  approved_by: string | null;
}

const DRIFT_STATUSES: ArtifactContentDriftStatus[] = [
  "current",
  "stale",
  "unknown",
];
const GATE_PRECONDITION_STATUSES: ArtifactGatePreconditionStatus[] = [
  "not_ready",
  "ready",
  "waived",
];
const CONTEXT_POLICIES: ArtifactDownstreamContextPolicy[] = [
  "include",
  "exclude",
  "restricted",
];

function isOneOf<T extends string>(
  allowed: readonly T[],
  value: unknown,
): value is T {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId, artifactCode } = await params;

    // Contract-driven: reject an unregistered artifact code up front (PR 4C,
    // ADR-0015) rather than proceeding to derive acceptance authority for a
    // code the registry doesn't recognize.
    const contract = getSourceArtifactContract(artifactCode);
    if (!contract) {
      return Response.json(
        {
          error: "unsupported_artifact",
          detail: `No SourceArtifactContract registered for "${artifactCode}".`,
        },
        { status: 404 },
      );
    }

    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await req.json().catch(() => null)) as {
      approvalRationale?: unknown;
      contentDriftStatus?: unknown;
      gatePreconditionStatus?: unknown;
      downstreamContextPolicy?: unknown;
      diffSummary?: unknown;
    } | null;

    const approvalRationale =
      typeof body?.approvalRationale === "string"
        ? body.approvalRationale.trim()
        : "";
    if (!approvalRationale) {
      return Response.json(
        { error: "bad_request", detail: "approvalRationale is required." },
        { status: 400 },
      );
    }
    const contentDriftStatus = isOneOf(DRIFT_STATUSES, body?.contentDriftStatus)
      ? body.contentDriftStatus
      : "unknown";
    const gatePreconditionStatus = isOneOf(
      GATE_PRECONDITION_STATUSES,
      body?.gatePreconditionStatus,
    )
      ? body.gatePreconditionStatus
      : "not_ready";
    const downstreamContextPolicy = isOneOf(
      CONTEXT_POLICIES,
      body?.downstreamContextPolicy,
    )
      ? body.downstreamContextPolicy
      : "restricted";
    const diffSummary =
      typeof body?.diffSummary === "string" &&
      body.diffSummary.trim().length > 0
        ? body.diffSummary.trim()
        : null;

    const supabase = getAzureReadFluentClient();
    const eventQuery = supabase.from("source_events").select("id, client_key");
    const { data: persistedEvent, error: fetchError } = isUuid(eventId)
      ? await eventQuery.eq("id", eventId).maybeSingle()
      : { data: null, error: null };
    if (fetchError) {
      return Response.json(
        { error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey)
        ? currentUser.metadataClientKey
        : null) ?? inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        {
          error: "no_client",
          detail: "No active client for Source artifact mutation",
        },
        { status: 403 },
      );
    }
    if (persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    await scaffoldNewEventSubstrate(
      persistedEvent.id,
      persistedEvent.client_key,
    ).catch((error) => {
      console.warn(
        "[source artifact accept] substrate scaffold repair failed:",
        error instanceof Error ? error.message : String(error),
      );
    });

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent.id,
          }).catch(() => null)
        : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      persistedEvent.client_key === effectiveClientKey;
    // Contract-driven acceptance authority (PR 4C, ADR-0015): resolves from
    // contract.acceptanceAuthority rather than a hardcoded permission name —
    // today every contract entry resolves to the same, already-stronger
    // `canApproveSourceStages` bar this route has used since the 2026-07-23
    // integrity fix (see header comment); this indirection is what lets a
    // future artifact type require a different capability without touching
    // this route again.
    const canMutate = Boolean(
      accessPolicy?.[contract.acceptanceAuthority] ||
        canonicalAdminFallbackAllowed,
    );
    if (!canMutate) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "Stage-approval rights are required to accept an artifact as authoritative — upload rights alone are not sufficient.",
        },
        { status: 403 },
      );
    }

    // Locate the per-event artifact slot, then the real artifact row it
    // links to — same lookup the status route uses, one hop further.
    const { data: artifactRow, error: artifactFetchError } = await supabase
      .from("source_event_artifact_states")
      .select("*")
      .eq("source_event_id", persistedEvent.id)
      .eq("artifact_code", artifactCode)
      .maybeSingle<SourceEventArtifactStateRow>();
    if (artifactFetchError) {
      return Response.json(
        { error: "lookup_failed", detail: artifactFetchError.message },
        { status: 500 },
      );
    }
    if (!artifactRow) {
      return Response.json(
        {
          error: "artifact_not_found",
          detail: `No artifact ${artifactCode} on event ${persistedEvent.id}.`,
        },
        { status: 404 },
      );
    }
    if (!artifactRow.linked_artifact_id) {
      return Response.json(
        {
          error: "no_content_to_accept",
          detail: `Artifact ${artifactCode} has no uploaded or generated content yet — nothing to accept.`,
        },
        { status: 409 },
      );
    }

    const { data: sourceArtifactRow, error: sourceArtifactError } =
      await supabase
        .from("source_artifacts")
        .select("id, status, lifecycle_state, approval_state, approved_by")
        .eq("id", artifactRow.linked_artifact_id)
        .maybeSingle<SourceArtifactGovernanceRow>();
    if (sourceArtifactError || !sourceArtifactRow) {
      return Response.json(
        {
          error: "artifact_record_not_found",
          detail: `Linked artifact ${artifactRow.linked_artifact_id} could not be read.`,
        },
        { status: 404 },
      );
    }

    const artifactState = deriveSourceArtifactGovernanceStage({
      status: sourceArtifactRow.status,
      isClientFinal: sourceArtifactRow.status === "client_final",
      lifecycleState: sourceArtifactRow.lifecycle_state,
      approvalState: sourceArtifactRow.approval_state,
      approvedBy: sourceArtifactRow.approved_by,
    });
    const artifactRole: "authoritative" | "evidence" = specByCode(artifactCode)
      ?.gateDefining
      ? "authoritative"
      : "evidence";

    // Contract-driven stage gate (PR 4C, ADR-0015): accepting an artifact
    // before the event has reached its earliest eligible stage is refused —
    // acceptance is exactly the moment PR 4B deliberately deferred stage
    // enforcement to for a human-authored, possibly out-of-sequence draft.
    // Saving remains unrestricted; becoming authoritative does not.
    const eventStageKey =
      normalizeSourceStageKey(artifactRow.stage_key) ?? "strategy";
    if (!isArtifactEligibleAtStage(artifactCode, eventStageKey)) {
      const decision = resolveArtifactAuthority({
        code: artifactCode,
        status: sourceArtifactRow.status,
        lifecycleState: sourceArtifactRow.lifecycle_state,
        approvalState: sourceArtifactRow.approval_state,
        approvedBy: sourceArtifactRow.approved_by,
        hasActiveAcceptance: false,
        eventStageKey,
      });
      const stageBlocker = decision.blockers.find(
        (b) => b.code === "stage_not_eligible",
      );
      return Response.json(
        {
          error: "stage_not_eligible",
          detail:
            stageBlocker?.detail ??
            `${artifactCode} is not eligible to accept before stage "${contract.earliestEligibleStage}".`,
          ...stageBlocker?.meta,
        },
        { status: 409 },
      );
    }

    const write = await insertArtifactAcceptance({
      artifactId: sourceArtifactRow.id,
      eventId: persistedEvent.id,
      stageKey: artifactRow.stage_key,
      artifactState,
      authoritativeVersionId: sourceArtifactRow.id,
      artifactRole,
      contentDriftStatus,
      gatePreconditionStatus,
      downstreamContextPolicy,
      diffSummary,
      approvalRationale,
      acceptedBy: tenancy?.userId ?? currentUser?.clerkUserId ?? "unknown",
    });
    if (!write.ok) {
      return Response.json(
        { error: "insert_failed", detail: write.error },
        { status: 500 },
      );
    }

    // Report the artifact's resulting authority decision (PR 4C) so callers
    // can distinguish "saved successfully" from "now authoritative" —
    // e.g. an artifact accepted at a stage-eligible event is authoritative;
    // one with unmet finality preconditions (a named sibling not yet
    // accepted) is authoritative but not final.
    const authority = resolveArtifactAuthority({
      code: artifactCode,
      status: sourceArtifactRow.status,
      lifecycleState: sourceArtifactRow.lifecycle_state,
      approvalState: sourceArtifactRow.approval_state,
      approvedBy: sourceArtifactRow.approved_by,
      hasActiveAcceptance: true,
      eventStageKey,
    });

    return Response.json({
      ok: true,
      acceptance: write.record,
      authority,
    });
  } catch (err) {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/accept]",
      err,
    );
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
