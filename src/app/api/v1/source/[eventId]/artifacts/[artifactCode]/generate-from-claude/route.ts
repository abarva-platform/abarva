// POST /api/v1/source/:eventId/artifacts/:artifactCode/generate-from-claude
//
// Body: {} (no inputs — context is bound server-side)
//
// Generates an artifact body via Claude using bound tenant + event +
// upstream-artifact context. Persists the body to
// source_event_artifact_states.body and an audit receipt to
// body_generation_metadata.
//
// Auth: requireTenancy + canGenerateSourcingArtifacts (or canonical
// admin fallback).
//
// Returns the updated artifact view-model. Non-streaming for
// simplicity in this slice; streaming arrives when the canvas surfaces
// a progress UI.

import { createHash, randomUUID } from "node:crypto";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import {
  buildSourceGenerationContext,
  collectUpstreamBodies,
  findMissingUpstreamCodes,
  getPromptTemplate,
  type SourceArtifactBodyGenerationMetadata,
} from "@/lib/source/agent-generation/server";
import {
  artifactStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
} from "@/lib/source/canvas-substrate/types";
import {
  registerSourceArtifactUpload,
  type SourceArtifactRegistryRecord,
} from "@/lib/source/artifact-registry";
import { specByCode } from "@/lib/source/canonical-specs";
import {
  ensurePersistedSourceEventForClient,
  scaffoldNewEventSubstrate,
} from "@/lib/source/queries";

const REGISTRY_GENERATED_MIME = "text/markdown";
const INLINE_REGISTRY_URI_PREFIX = "inline://source-event-artifact-state";

function safeRegistryFilename(
  artifactCode: string,
  artifactId: string,
): string {
  const stem = artifactCode.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 90);
  return `${stem || "source-generated-artifact"}-${artifactId.slice(0, 8)}.md`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Long ceiling — large RFP-class generations stream tokens for 60–120s.
// Vercel Pro caps Node functions at 300s; matching that gives room for
// retries inside the route without surfacing a timeout to the user.
export const maxDuration = 300;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function POST(_req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, artifactCode } = await params;

  // Anthropic key check — fail fast with a clear error rather than
  // letting the SDK throw deep in the call.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "agent_unavailable",
        detail: "ANTHROPIC_API_KEY is not configured for this environment.",
      },
      { status: 503 },
    );
  }

  // Resolve template up front so unknown artifact codes 404 fast.
  const template = getPromptTemplate(artifactCode);
  if (!template) {
    return Response.json(
      {
        error: "unsupported_artifact",
        detail: `Generation is not yet wired for ${artifactCode}. Supported codes are listed in the prompt registry.`,
      },
      { status: 404 },
    );
  }

  // Generation is a write surface. If we cannot bind the request to an
  // active tenant, fail here instead of falling through to a misleading 404.
  if (!tenancy) {
    return tenancyErrorResponse(tenancyError);
  }
  const tenantClientKey = tenancy.clientKey;
  if (!tenantClientKey) {
    return Response.json(
      { error: "no_client", detail: "No active client for this user" },
      { status: 403 },
    );
  }

  const currentUser = await getCurrentUser().catch(() => null);

  // Legacy golden-shell routes can exist before a matching persisted
  // source_events row does. Materialize the seeded event into the
  // UUID-backed substrate on first write so generation, exports, and the
  // stored-document registry all have a real event row to bind to.
  await ensurePersistedSourceEventForClient(
    eventId,
    tenantClientKey,
    currentUser?.clerkUserId ?? tenancy.userId,
  ).catch((error) => {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate-from-claude] seed materialization failed",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  });

  // Bind context (event + tenant + substrate).
  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: "not_found", detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  await scaffoldNewEventSubstrate(ctx.event.id, ctx.tenantKey).catch(
    (error) => {
      console.warn(
        "[source generate] substrate scaffold repair failed:",
        error instanceof Error ? error.message : String(error),
      );
    },
  );

  // Auth check using the resolved event's UUID.
  const activeClient = await getActiveClientRow().catch(() => null);
  const accessPolicy =
    tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: ctx.event.id,
        }).catch(() => null)
      : null;
  const canonicalAdminFallbackAllowed =
    !activeClient &&
    isCanonicalClientAdminEmail(currentUser?.email) &&
    ctx.tenantKey === "unknown"; // canonical-admin path skips active-client gating

  const canGenerate = Boolean(
    accessPolicy?.canGenerateSourcingArtifacts ||
    accessPolicy?.canUploadSourceArtifacts ||
    canonicalAdminFallbackAllowed,
  );
  if (!canGenerate) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: "forbidden",
        detail: "Generation rights (canGenerateSourcingArtifacts) required.",
      },
      { status: 403 },
    );
  }

  // Upstream-required gate. Refuses with 409 + the missing codes so
  // the UI can surface a precise "author X first" message.
  const missingUpstream = findMissingUpstreamCodes(template, ctx);
  if (missingUpstream.length > 0) {
    return Response.json(
      {
        error: "upstream_required",
        detail: `Cannot generate ${artifactCode} — author and approve these upstream artifacts first: ${missingUpstream.join(", ")}.`,
        missingUpstream,
      },
      { status: 409 },
    );
  }

  // Find the substrate row for the artifact we're generating into.
  const supabase = getAzureReadFluentClient();
  const { data: artifactRow, error: artifactFetchError } = await supabase
    .from("source_event_artifact_states")
    .select("*")
    .eq("source_event_id", ctx.event.id)
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
        detail: `No artifact ${artifactCode} on event ${ctx.event.code}.`,
      },
      { status: 404 },
    );
  }
  if (artifactRow.status === "locked" || artifactRow.status === "superseded") {
    return Response.json(
      {
        error: "terminal_state",
        detail: `Artifact ${artifactCode} is ${artifactRow.status}; body cannot be regenerated.`,
      },
      { status: 409 },
    );
  }

  // Collect upstream bodies + build the user message.
  const upstreamBound = collectUpstreamBodies(ctx, [
    ...template.upstreamRequired,
    ...template.upstreamOptional,
  ]);
  const userMessage = template.buildUserMessage(ctx, upstreamBound);

  // Call Claude. Use the streaming API so the function doesn't block
  // waiting for the entire completion before responding — first byte
  // arrives in 1–3s, full body in 30–60s, and we can detect mid-stream
  // failures cleanly.
  const startedAt = Date.now();
  let body = "";
  let stopReason: string | null = null;
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  try {
    if (!tenancy) {
      return tenancyErrorResponse(tenancyError);
    }
    const preflight = await preflightAnthropicDirectClient({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      workflow: "source-artifact-generate",
      artifactId: artifactRow.id,
      artifactType: artifactCode,
      model: template.model,
      prompt: [template.systemPrompt, userMessage].join("\n\n"),
      dataClass: "confidential",
      metadata: {
        eventId: ctx.event.id,
        sourceEventId: ctx.event.id,
        artifactCode,
      },
    });
    if (!preflight.ok) {
      return Response.json(
        {
          error: "ai_egress_denied",
          detail: preflight.reason,
          auditId: preflight.auditId,
        },
        { status: 403 },
      );
    }
    const client = preflight.client;
    const stream = client.messages.stream({
      model: template.model,
      max_tokens: template.maxTokens,
      system: template.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        body += chunk.delta.text;
      }
    }
    const final = await stream.finalMessage();
    stopReason = final.stop_reason ?? null;
    tokensIn = final.usage?.input_tokens ?? null;
    tokensOut = final.usage?.output_tokens ?? null;
  } catch (err) {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate-from-claude] Anthropic error",
      err,
    );
    return Response.json(
      {
        error: "generation_failed",
        detail: err instanceof Error ? err.message : "Anthropic call failed",
      },
      { status: 502 },
    );
  }

  if (body.trim().length === 0) {
    return Response.json(
      {
        error: "empty_generation",
        detail:
          "Anthropic returned an empty body. Retry, or surface a gap in the upstream context.",
      },
      { status: 502 },
    );
  }

  // Persist body + provenance.
  const nowIso = new Date().toISOString();
  const generationMetadata: SourceArtifactBodyGenerationMetadata = {
    model: template.model,
    promptTemplateId: template.artifactCode,
    promptTemplateVersion: template.version,
    upstreamBoundCodes: Object.keys(upstreamBound),
    generatedAt: nowIso,
    generatedByUserId: currentUser?.clerkUserId ?? null,
    tokensIn,
    tokensOut,
    stopReason,
  };

  const update: Partial<SourceEventArtifactStateRow> = {
    body,
    body_format: "markdown",
    body_authored_by: currentUser?.clerkUserId ?? null,
    body_updated_at: nowIso,
    body_generation_metadata: generationMetadata as unknown as Record<
      string,
      unknown
    >,
    updated_at: nowIso,
  };
  if (artifactRow.tier === "stub") update.tier = "outline";

  // DB write routed through the data-plane write seam (Slice 3b). The
  // Claude call above stays route-side; the seam owns only the body persist.
  const sourceWrite = selectSourceWriteAdapter(undefined, ctx.tenantKey);
  const bodyWrite = await sourceWrite.updateArtifactBody({
    artifactRowId: artifactRow.id,
    columns: update as Record<string, unknown>,
  });
  if (!bodyWrite.ok || !bodyWrite.data) {
    return Response.json(
      { error: "update_failed", detail: bodyWrite.error },
      { status: 500 },
    );
  }

  const view: SourceEventArtifactState = artifactStateRowToView(
    bodyWrite.data as unknown as SourceEventArtifactStateRow,
  );

  // Also persist the generated body to the source_artifacts registry so the
  // canvas Document tab's "Stored documents" shelf has a row to render. For
  // inline AI drafts, the substrate body is already the canonical content, so
  // the registry row uses an inline provenance URI instead of requiring a
  // second object-storage write just to mirror the same markdown bytes.
  let registryArtifact: SourceArtifactRegistryRecord | null = null;
  try {
    const spec = specByCode(artifactCode);
    const family = spec?.family ?? "other";
    const registryArtifactId = randomUUID();
    const substrateTenantKey = clientKeyToInventorySubstrateKey(ctx.tenantKey);
    const filename = safeRegistryFilename(artifactCode, registryArtifactId);
    const buffer = Buffer.from(body, "utf8");
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const inlineBlobUri = `${INLINE_REGISTRY_URI_PREFIX}/${ctx.event.id}/${artifactCode}/${registryArtifactId}/${filename}`;
    registryArtifact = await registerSourceArtifactUpload({
      artifactId: registryArtifactId,
      tenantKey: substrateTenantKey,
      sourceEventId: ctx.event.id,
      sourceEventRowId: ctx.event.id,
      stageKey: artifactRow.stage_key,
      artifactFamily: family,
      artifactKind: artifactCode,
      sourceOrigin: "generated",
      sourceFormat: "markdown",
      originalName: filename,
      blobUri: inlineBlobUri,
      uploaderUserId: currentUser?.clerkUserId ?? tenancy.userId,
      mimeType: REGISTRY_GENERATED_MIME,
      sizeBytes: buffer.byteLength,
      sha256,
      dataClassification: "Confidential",
      createdBy: currentUser?.clerkUserId ?? tenancy.userId,
    });
  } catch (registryError) {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate-from-claude] registry persist failed",
      registryError instanceof Error
        ? registryError.message
        : String(registryError),
    );
  }

  const activityWrite = await sourceWrite.insertActivityLog({
    eventId: ctx.event.id,
    clientKey: ctx.tenantKey,
    actorUserId: currentUser?.personId ?? currentUser?.clerkUserId ?? null,
    actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
    actorRole: currentUser?.primaryRole ?? null,
    actionType: "artifact_generated",
    actionLabel: `Generated AI draft for ${artifactCode}`,
    stageKey: artifactRow.stage_key,
    artifactCode,
    reason: null,
    metadata: {
      model: template.model,
      promptTemplateVersion: template.version,
      stopReason,
      tokensIn,
      tokensOut,
      latencyMs: Date.now() - startedAt,
    },
    occurredAtIso: nowIso,
  });
  if (!activityWrite.ok) {
    console.error(
      "[source artifact generation activity] insert failed:",
      activityWrite.error,
    );
  }
  return Response.json({
    ok: true,
    artifact: view,
    registryArtifact,
    generation: {
      ...generationMetadata,
      latencyMs: Date.now() - startedAt,
    },
  });
}
