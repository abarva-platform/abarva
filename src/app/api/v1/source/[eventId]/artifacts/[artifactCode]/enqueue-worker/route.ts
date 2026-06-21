// POST /api/v1/source/:eventId/artifacts/:artifactCode/enqueue-worker
//
// Body: {} (no inputs required)
//
// Enqueues an async durable worker job for this artifact via the
// source_artifact_generation_jobs queue. The worker calls
// generateSourceArtifactDraft with X-Source-Worker-Call: 1 which
// bypasses the sync budget and allows the quality-gate rewrite to run.
//
// Use this after a 422 quality_gate_failed on the sync generate route —
// the 422 body now includes `artifactId` so callers know which row was
// persisted. Pass that ID in the request body to skip the DB lookup:
//   { artifactId?: string }   (optional shortcut — route looks up if omitted)
//
// Auth: requireTenancy + canGenerateSourcingArtifacts (same gate as /generate).

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  enqueueSourceArtifactGenerationJob,
  findActiveSourceArtifactGenerationJob,
  isSourceArtifactGenerationQueueUnavailable,
} from "@/lib/source/artifact-generation-queue";
import { getPromptTemplate } from "@/lib/source/agent-generation/prompt-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ eventId: string; artifactCode: string }>;
};

export async function POST(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }
  if (!tenancy) return tenancyErrorResponse(tenancyError);

  const { eventId, artifactCode } = await params;

  const template = getPromptTemplate(artifactCode);
  if (!template) {
    return Response.json(
      { error: "unsupported_artifact", detail: `No prompt template for ${artifactCode}` },
      { status: 404 },
    );
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient || activeClient.id !== tenancy.clientId) {
    return Response.json({ error: "no_active_client" }, { status: 403 });
  }

  const currentUser = await getCurrentUser().catch(() => null);
  const adminEmail = (currentUser?.email ?? "").trim().toLowerCase();
  const isAdmin = CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    adminEmail as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);

  if (!isAdmin && !accessPolicy?.canGenerateSourcingArtifacts) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  // Parse optional body to allow caller to pass artifact ID directly.
  let providedArtifactId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.artifactId === "string" && body.artifactId.length > 0) {
      providedArtifactId = body.artifactId;
    }
  } catch {
    // no body — fine
  }

  // Look up the artifact state row (or use the provided ID).
  const supabase = getAzureReadFluentClient();
  let artifactRowId: string;
  let stageKey: string;

  if (providedArtifactId) {
    // Verify it belongs to this tenant + event.
    const { data: row, error } = await supabase
      .from("source_event_artifact_states")
      .select("id, stage_key, client_id")
      .eq("id", providedArtifactId)
      .eq("source_event_id", eventId)
      .eq("client_id", tenancy.clientId)
      .maybeSingle();
    if (error || !row) {
      return Response.json(
        { error: "artifact_not_found", detail: "Artifact row not found for this event and tenant" },
        { status: 404 },
      );
    }
    artifactRowId = row.id;
    stageKey = row.stage_key ?? "rfp";
  } else {
    const { data: row, error } = await supabase
      .from("source_event_artifact_states")
      .select("id, stage_key")
      .eq("source_event_id", eventId)
      .eq("client_id", tenancy.clientId)
      .eq("artifact_code", artifactCode)
      .maybeSingle();
    if (error || !row) {
      return Response.json(
        {
          error: "artifact_not_found",
          detail: "Run the sync /generate route first to create the artifact state row, then enqueue the worker.",
        },
        { status: 404 },
      );
    }
    artifactRowId = row.id;
    stageKey = row.stage_key ?? "rfp";
  }

  // Check if a job is already queued/running for this artifact.
  const existing = await findActiveSourceArtifactGenerationJob(artifactRowId).catch(
    () => null,
  );
  if (existing) {
    return Response.json(
      {
        ok: true,
        jobId: existing.id,
        status: existing.status,
        detail: "A worker job is already active for this artifact.",
      },
      { status: 200 },
    );
  }

  try {
    const job = await enqueueSourceArtifactGenerationJob({
      clientKey: activeClient.key,
      sourceEventId: eventId,
      artifactRowId,
      artifactCode,
      stageKey,
      requestedByUserId: tenancy.userId,
      requestedVia: "manual_retry",
      qualityTier: "real_engagement",
    });
    return Response.json({ ok: true, jobId: job.id, status: job.status }, { status: 202 });
  } catch (err) {
    if (isSourceArtifactGenerationQueueUnavailable(err)) {
      return Response.json(
        { error: "queue_unavailable", detail: "source_artifact_generation_jobs table not ready" },
        { status: 503 },
      );
    }
    throw err;
  }
}
