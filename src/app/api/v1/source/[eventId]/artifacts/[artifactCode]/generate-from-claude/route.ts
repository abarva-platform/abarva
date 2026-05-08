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

import Anthropic from '@anthropic-ai/sdk';
import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import {
  buildSourceGenerationContext,
  collectUpstreamBodies,
  findMissingUpstreamCodes,
  getPromptTemplate,
  type SourceArtifactBodyGenerationMetadata,
} from '@/lib/source/agent-generation';
import {
  artifactStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
} from '@/lib/source/canvas-substrate/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
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
        error: 'agent_unavailable',
        detail: 'ANTHROPIC_API_KEY is not configured for this environment.',
      },
      { status: 503 },
    );
  }

  // Resolve template up front so unknown artifact codes 404 fast.
  const template = getPromptTemplate(artifactCode);
  if (!template) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `Generation is not yet wired for ${artifactCode}. Supported codes are listed in the prompt registry.`,
      },
      { status: 404 },
    );
  }

  // Bind context (event + tenant + substrate).
  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: 'not_found', detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  // Auth check using the resolved event's UUID.
  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
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
    ctx.tenantKey === 'unknown'; // canonical-admin path skips active-client gating

  const canGenerate = Boolean(
    accessPolicy?.canGenerateSourcingArtifacts ||
      accessPolicy?.canUploadSourceArtifacts ||
      canonicalAdminFallbackAllowed,
  );
  if (!canGenerate) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: 'forbidden',
        detail: 'Generation rights (canGenerateSourcingArtifacts) required.',
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
        error: 'upstream_required',
        detail: `Cannot generate ${artifactCode} — author and approve these upstream artifacts first: ${missingUpstream.join(', ')}.`,
        missingUpstream,
      },
      { status: 409 },
    );
  }

  // Find the substrate row for the artifact we're generating into.
  const supabase = getServerSupabase();
  const { data: artifactRow, error: artifactFetchError } = await supabase
    .from('source_event_artifact_states')
    .select('*')
    .eq('source_event_id', ctx.event.id)
    .eq('artifact_code', artifactCode)
    .maybeSingle<SourceEventArtifactStateRow>();
  if (artifactFetchError) {
    return Response.json(
      { error: 'lookup_failed', detail: artifactFetchError.message },
      { status: 500 },
    );
  }
  if (!artifactRow) {
    return Response.json(
      {
        error: 'artifact_not_found',
        detail: `No artifact ${artifactCode} on event ${ctx.event.code}.`,
      },
      { status: 404 },
    );
  }
  if (artifactRow.status === 'locked' || artifactRow.status === 'superseded') {
    return Response.json(
      {
        error: 'terminal_state',
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

  // Call Claude.
  const startedAt = Date.now();
  const client = new Anthropic({ apiKey });
  let body: string;
  let stopReason: string | null = null;
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  try {
    const completion = await client.messages.create({
      model: template.model,
      max_tokens: template.maxTokens,
      system: template.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    stopReason = completion.stop_reason ?? null;
    tokensIn = completion.usage?.input_tokens ?? null;
    tokensOut = completion.usage?.output_tokens ?? null;
    const textBlock = completion.content.find((b) => b.type === 'text');
    body = textBlock && textBlock.type === 'text' ? textBlock.text : '';
  } catch (err) {
    console.error(
      '[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate-from-claude] Anthropic error',
      err,
    );
    return Response.json(
      {
        error: 'generation_failed',
        detail: err instanceof Error ? err.message : 'Anthropic call failed',
      },
      { status: 502 },
    );
  }

  if (body.trim().length === 0) {
    return Response.json(
      {
        error: 'empty_generation',
        detail: 'Anthropic returned an empty body. Retry, or surface a gap in the upstream context.',
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
    body_format: 'markdown',
    body_authored_by: currentUser?.clerkUserId ?? null,
    body_updated_at: nowIso,
    body_generation_metadata: generationMetadata as unknown as Record<string, unknown>,
    updated_at: nowIso,
  };
  if (artifactRow.tier === 'stub') update.tier = 'outline';

  const { data: updatedRow, error: updateError } = await supabase
    .from('source_event_artifact_states')
    .update(update)
    .eq('id', artifactRow.id)
    .select('*')
    .single<SourceEventArtifactStateRow>();
  if (updateError) {
    return Response.json(
      { error: 'update_failed', detail: updateError.message },
      { status: 500 },
    );
  }

  const view: SourceEventArtifactState = artifactStateRowToView(updatedRow);
  return Response.json({
    ok: true,
    artifact: view,
    generation: {
      ...generationMetadata,
      latencyMs: Date.now() - startedAt,
    },
  });
}
