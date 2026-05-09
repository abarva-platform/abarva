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
import { sourceEventRowToDetail } from '@/lib/source/queries';
import { getServerSupabase } from '@/lib/supabase-server';

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
    const liveEventDetail = apexContext?.liveContext.sourceEvent
      ? sourceEventRowToDetail(apexContext.liveContext.sourceEvent, 'Apex Retail Group')
      : undefined;
    const liveTenantContext = apexContext
      ? toApexRetailLiveTenantContextSnapshot(apexContext.liveContext)
      : undefined;

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

    const response = createSourceNexusApiStubResponse({
      ...normalizedBody,
      eventId,
      tenant: apexContext?.input.tenant ?? {
        tenantId: tenancy.clientId,
        tenantKey: activeClient?.key,
        tenantName: activeClient?.name,
        activeClientId: tenancy.clientId,
        activeClientName: activeClient?.name,
      },
      user: {
        id: tenancy.userId,
      },
      liveEventDetail,
      liveTenantContext,
    });

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
  try {
    const sb = getServerSupabase();
    await sb
      .from('agent_attachment')
      .update({ linked_event_id: eventId })
      .in('id', attachmentIds)
      .eq('tenant_id', tenantId)
      .is('linked_event_id', null);
  } catch {
    // Swallow — the agent turn must still respond even if metadata
    // persistence fails. The attachment row keeps its other context
    // (surface, agent, surfaceContext) and a retention sweeper can
    // reconcile from telemetry if needed.
  }
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
