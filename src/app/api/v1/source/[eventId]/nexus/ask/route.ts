import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '../../../../_intel-auth';
import {
  createSourceNexusApiStubResponse,
  normalizeSourceNexusApiRequestBody,
} from '@/lib/source/nexus-api';
import { getActiveClientRow } from '@/lib/active-client';
import {
  APEX_RETAIL_BROKER_TENANT_KEY,
  APEX_RETAIL_CLIENT_KEY,
  buildApexRetailSourceContextAssemblyInput,
  toApexRetailLiveTenantContextSnapshot,
  type ApexRetailAdapterResult,
} from '@/lib/source/adapters/apex-retail-adapter';
import type { SourceLiveTenantContextSnapshot } from '@/lib/source/agent-context';
import type { SourcingEventDetail } from '@/lib/source/types';
import { getSourcingEvent, sourceEventRowToDetail } from '@/lib/source/queries';
import { selectSourceWriteAdapter } from '@/lib/data-plane/write-adapters/sourceWriteAdapter';
import { preflightAnthropicDirectClient } from '@/lib/integrations/ai-egress';
import { composeSentinelSystemPrompt } from '@/lib/agent/voice-doctrine/sentinel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SourceNexusRouteContext = {
  params: Promise<{ eventId?: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: SourceNexusRouteContext,
) {
  try {
    const tenancy = await requireTenancy();
    const { eventId } = await params;
    const bodyResult = await parseSourceNexusRequestBody(request);

    if (!bodyResult.ok) {
      return Response.json(bodyResult.body, { status: bodyResult.status });
    }

    const normalizedBody = normalizeSourceNexusApiRequestBody(bodyResult.body);
    const activeClient = await getActiveClientRow().catch(() => null);
    const apexContext = await loadApexRetailSourceIntelligence({
      eventId,
      userId: tenancy.userId,
      prompt: normalizedBody.prompt,
      selectedAttachmentIds: normalizedBody.selectedAttachmentIds,
      clientId: tenancy.clientId,
      clientKey: activeClient?.key,
    });
    const apexLiveEventDetail = apexContext?.liveContext.sourceEvent
      ? sourceEventRowToDetail(apexContext.liveContext.sourceEvent, 'Apex Retail Group')
      : undefined;
    const apexLiveTenantContext = apexContext
      ? toApexRetailLiveTenantContextSnapshot(apexContext.liveContext)
      : undefined;
    const fallbackLiveEventDetail = apexLiveEventDetail || !eventId
      ? undefined
      : await getSourcingEvent(eventId).catch(() => null);
    const liveEventDetail = apexLiveEventDetail ?? fallbackLiveEventDetail ?? undefined;
    const liveTenantContext = apexLiveTenantContext
      ?? (fallbackLiveEventDetail
        ? buildEventIntakeTenantContextSnapshot({
            activeClientKey: activeClient?.key,
            activeClientName: activeClient?.name,
            event: fallbackLiveEventDetail,
          })
        : undefined);

    // Source canvas migration · before invoking the (unchanged) deterministic
    // runtime, link any attachments from this turn to the source event so the
    // canvas owns them across turns and a future Atlas read can join on
    // linked_event_id. The DB column is nullable + tenant-isolated via RLS,
    // so a no-op is safe when no attachments are present.
    if (
      eventId &&
      normalizedBody.selectedAttachmentIds &&
      normalizedBody.selectedAttachmentIds.length > 0
    ) {
      await linkAttachmentsToEvent({
        attachmentIds: normalizedBody.selectedAttachmentIds,
        tenantId: tenancy.clientId,
        eventId,
      });
    }

    const stubInput = {
      ...normalizedBody,
      eventId,
      tenant: apexContext?.input.tenant ?? {
        tenantId: tenancy.clientId,
        tenantKey: activeClient?.key,
        tenantName: activeClient?.name,
        activeClientId: tenancy.clientId,
        activeClientName: activeClient?.name,
      },
      user: { id: tenancy.userId },
      liveEventDetail,
      liveTenantContext,
    };

    // Build context + deterministic briefing (always needed for fallback + suggested actions).
    const stubResponse = createSourceNexusApiStubResponse(stubInput);

    // Attempt a real Claude call. Falls back to stub summary on any failure.
    const claudeSummary = await callSentinelWithClaude({
      prompt: normalizedBody.prompt ?? '',
      briefingContext: stubResponse.summary ?? '',
      tenantKey: activeClient?.key ?? null,
      tenantId: tenancy.clientId,
    }).catch(() => null);

    const response = claudeSummary
      ? { ...stubResponse, summary: claudeSummary, noModel: false }
      : stubResponse;

    return Response.json(response, { status: response.httpStatus });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: 'internal_error',
          detail: error instanceof Error ? error.message : 'Unknown Source Nexus API stub error',
          noModel: true,
        },
        { status: 500 },
      );
    }
  }
}

function buildEventIntakeTenantContextSnapshot(args: {
  activeClientKey?: string;
  activeClientName?: string;
  event: SourcingEventDetail;
}): SourceLiveTenantContextSnapshot {
  const clientKey = args.activeClientKey ?? 'unknown';
  const brokerTenantKey = clientKey === APEX_RETAIL_BROKER_TENANT_KEY
    ? APEX_RETAIL_BROKER_TENANT_KEY
    : clientKey;
  const evidence = [
    {
      recordId: 'trigger',
      title: 'Source intake trigger',
      excerpt: `Trigger: ${args.event.problemStatement}`,
      score: 16,
    },
    {
      recordId: 'scope',
      title: 'Source intake scope and value basis',
      excerpt: `Scope and value basis: ${args.event.synopsis}`,
      score: 15,
    },
    {
      recordId: 'decision-owner',
      title: 'Source intake decision owner',
      excerpt: `Decision owner: ${args.event.scorecard.decisionOwner || args.event.owner}`,
      score: 14,
    },
    ...args.event.scorecard.criteria.map((criterion, index) => ({
      recordId: criterion.id,
      title: criterion.label,
      excerpt: `${criterion.label}: ${criterion.note ?? criterion.status}`,
      score: 12 - index,
    })),
  ].filter((item) => item.excerpt.trim().length > 0);

  return {
    clientKey,
    brokerTenantKey,
    inventoryRecordCount: 0,
    contextChunkCount: evidence.length,
    embeddedContextChunkCount: 0,
    sourceEventFound: true,
    segments: [
      {
        segmentId: 'sourcing_artifacts',
        inventoryRecords: 0,
        contextChunks: evidence.length,
        embeddedChunks: 0,
      },
    ],
    currentStateAreas: ['Sourcing Artifacts'],
    evidenceBasis: [
      `${args.activeClientName ?? clientKey} persisted Source event: trigger, scope, value basis, decision owner and gate criteria from source_events.`,
    ],
    retrievedEvidence: evidence.map((item) => ({
      id: `source-event:${args.event.id}:${item.recordId}`,
      segmentId: 'sourcing_artifacts',
      recordId: item.recordId,
      title: item.title,
      sourceType: 'contextChunk',
      sourceDoc: 'source_events',
      excerpt: item.excerpt,
      confidence: 'high',
      score: item.score,
    })),
    warnings: [
      'Using persisted Source intake facts for this newly-created event; deeper tenant corpus retrieval is not required to answer event-gate questions.',
    ],
  };
}

async function loadApexRetailSourceIntelligence(args: {
  eventId?: string;
  userId: string;
  prompt?: string;
  selectedAttachmentIds?: string[];
  clientId?: string;
  clientKey?: string;
}): Promise<ApexRetailAdapterResult | null> {
  const { eventId, clientId, clientKey } = args;
  if (!shouldUseApexRetailAdapter(eventId, clientId, clientKey)) return null;

  try {
    return await buildApexRetailSourceContextAssemblyInput({
      eventId,
      user: { id: args.userId },
      userPrompt: args.prompt ?? 'Provide the current Source command read.',
      surface: 'nexusPanel',
      selectedAttachmentIds: args.selectedAttachmentIds ?? [],
    });
  } catch (error) {
    console.error(
      '[source-nexus-ask] Apex Retail source intelligence load failed',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function shouldUseApexRetailAdapter(
  eventId: string | undefined,
  clientId: string | undefined,
  clientKey: string | undefined,
): boolean {
  const normalizedClientId = clientId?.trim().toLowerCase();
  const normalizedClientKey = clientKey?.trim().toLowerCase();
  if (
    normalizedClientId === APEX_RETAIL_CLIENT_KEY ||
    normalizedClientId === APEX_RETAIL_BROKER_TENANT_KEY ||
    normalizedClientKey === APEX_RETAIL_CLIENT_KEY ||
    normalizedClientKey === APEX_RETAIL_BROKER_TENANT_KEY
  ) {
    return true;
  }
  const normalizedEventId = eventId?.trim().toUpperCase() ?? '';
  return normalizedEventId.startsWith('APX-') || normalizedEventId.startsWith('SRC-APX-');
}

/**
 * Stamp `linked_event_id` on AgentDock attachment rows referenced by this
 * turn so the canvas owns them across the conversation. Tenant-scoped to
 * keep the update honest under RLS.
 *
 * Best-effort: persistence failures must not block the agent runtime —
 * the attachment metadata is recoverable, the user-facing response is not.
 */
async function linkAttachmentsToEvent(args: {
  attachmentIds: string[];
  tenantId: string;
  eventId: string;
}): Promise<void> {
  const { attachmentIds, tenantId, eventId } = args;
  if (attachmentIds.length === 0) return;
  // DB write routed through the data-plane write seam (Slice 3b). The seam's
  // linkAttachments is best-effort and never throws — the agent turn must
  // still respond even if attachment metadata persistence fails. The
  // attachment row keeps its other context and a retention sweeper can
  // reconcile from telemetry if needed.
  await selectSourceWriteAdapter().linkAttachments({
    attachmentIds,
    tenantId,
    eventId,
  });
}

/**
 * Call Claude with Sentinel voice for Source canvas chat.
 * Returns the answer string, or throws so the caller can fall back to stub.
 */
async function callSentinelWithClaude(args: {
  prompt: string;
  briefingContext: string;
  tenantKey: string | null;
  tenantId: string;
}): Promise<string> {
  if (!args.prompt.trim()) throw new Error('empty prompt');

  const preflight = await preflightAnthropicDirectClient({
    tenantId: args.tenantId,
    workflow: 'source-canvas-chat',
    model: 'claude-sonnet-4-6',
    prompt: args.prompt,
    dataClass: 'confidential',
    metadata: { surface: 'source', tenantKey: args.tenantKey ?? 'unknown' },
  });
  if (!preflight.ok) throw new Error(`egress blocked: ${preflight.reason}`);

  const systemPrompt = composeSentinelSystemPrompt({
    mode: 'tenant',
    tenantKey: args.tenantKey,
    surface: '/source',
    vectorIndexPending: false,
    worldviewPending: false,
    worldviewHitsPresent: false,
  });

  const userMessage = args.briefingContext
    ? `${args.briefingContext}\n\nUser question: ${args.prompt}`
    : args.prompt;

  const msg = await preflight.client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  if (!text.trim()) throw new Error('empty Claude response');
  return text;
}

async function parseSourceNexusRequestBody(
  request: NextRequest,
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; status: number; body: { ok: false; error: string; detail: string; noModel: true } }
> {
  const raw = await request.text();
  if (!raw.trim()) {
    return { ok: true, body: {} };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        error: 'bad_request',
        detail: 'Malformed JSON request body.',
        noModel: true,
      },
    };
  }
}
