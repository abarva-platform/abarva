import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '../../../../_intel-auth';
import {
  createSourceNexusApiStubResponse,
  normalizeSourceNexusApiRequestBody,
} from '@/lib/source/nexus-api';
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
      tenant: {
        tenantId: tenancy.clientId,
        activeClientId: tenancy.clientId,
      },
      user: {
        id: tenancy.userId,
      },
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
