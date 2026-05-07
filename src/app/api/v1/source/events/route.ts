// POST /api/v1/source/events
//
// Form/API path for creating a persisted Source event without going through
// the chat tool. The chat tool and this route intentionally write the same
// `source_events` shape so approval and detail-canvas behavior stays unified.

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { createSourcingEvent } from '@/lib/source/queries';
import { getServerSupabase } from '@/lib/supabase-server';

interface CreateSourceEventBody {
  eventName?: string;
  eventType?: 'managed_service' | 'software' | 'staffing' | 'infrastructure' | 'consulting' | 'other';
  triggerDescription?: string;
  decisionOwner?: string;
  scopeDescription?: string;
  linkedProgramId?: string;
  estimatedValueUsd?: number;
}

function parseEventType(value: unknown): NonNullable<CreateSourceEventBody['eventType']> {
  if (
    value === 'managed_service' ||
    value === 'software' ||
    value === 'staffing' ||
    value === 'infrastructure' ||
    value === 'consulting' ||
    value === 'other'
  ) {
    return value;
  }
  return 'other';
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const normalized = Number(value.replace(/[$,]/g, ''));
    return Number.isFinite(normalized) ? normalized : undefined;
  }
  return undefined;
}

export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json({ error: 'no_client', detail: 'No active client for Source event creation' }, { status: 403 });
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
  }).catch(() => null);

  if (!accessPolicy?.canCreateSourceEvents) {
    return Response.json({
      error: 'forbidden_source_create_required',
      detail: 'Source create access is required to create sourcing events.',
    }, { status: 403 });
  }

  let body: CreateSourceEventBody;
  try {
    body = (await request.json()) as CreateSourceEventBody;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const eventName = parseOptionalString(body.eventName);
  const triggerDescription = parseOptionalString(body.triggerDescription);
  if (!eventName || !triggerDescription) {
    return Response.json({
      error: 'missing_required_fields',
      detail: 'eventName and triggerDescription are required.',
    }, { status: 400 });
  }

  try {
    const event = await createSourcingEvent({
      clientKey: activeClient.key,
      eventName,
      eventType: parseEventType(body.eventType),
      triggerDescription,
      decisionOwner: parseOptionalString(body.decisionOwner),
      scopeDescription: parseOptionalString(body.scopeDescription),
      linkedProgramId: parseOptionalString(body.linkedProgramId),
      estimatedValueUsd: parseOptionalNumber(body.estimatedValueUsd),
      createdByUserId: tenancy.userId,
    });

    if (tenancy.userId) {
      const { error: participantError } = await getServerSupabase()
        .from('source_event_participants')
        .insert({
          client_key: activeClient.key,
          source_event_id: event.id,
          source_event_row_id: event.id,
          user_id: tenancy.userId,
          role: 'source creator',
          approval_authority: 'contributor',
          source_access_level: 'source_member',
          can_view_financial: false,
          can_upload_source_artifacts: true,
          can_generate_sourcing_artifacts: true,
          can_publish_sourcing_artifacts: false,
          can_approve_source_stages: false,
          can_approve_award: false,
          notify_on: ['source_event_update', 'approval_needed'],
        });
      if (participantError && !/source_event_participants|schema cache|does not exist/i.test(participantError.message)) {
        throw new Error(`source participant assignment failed: ${participantError.message}`);
      }
    }

    return Response.json({
      ok: true,
      event,
      approvalAuthority:
        'Tenant admin reviews the intake record; S0 exit is co-signed by the decision owner and sourcing lead.',
      approvalUrl: '/source/events',
      eventUrl: `/source/events/${event.id}?stage=Strategy`,
    });
  } catch (error) {
    return Response.json({
      error: 'db_write_failed',
      detail: error instanceof Error ? error.message : 'failed to create Source event',
    }, { status: 500 });
  }
}
