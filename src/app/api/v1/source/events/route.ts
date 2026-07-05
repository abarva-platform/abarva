// POST /api/v1/source/events
//
// Form/API path for creating a persisted Source event without going through
// the chat tool. The chat tool and this route intentionally write the same
// `source_events` shape so approval and detail-canvas behavior stays unified.

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { createSourcingEvent } from '@/lib/source/queries';
import { buildSourceScopeDescription } from '@/lib/source/intake-summary';
import { selectSourceWriteAdapter } from '@/lib/data-plane/write-adapters/sourceWriteAdapter';

interface CreateSourceEventBody {
  eventName?: string;
  eventType?: 'managed_service' | 'software' | 'staffing' | 'infrastructure' | 'consulting' | 'other';
  triggerDescription?: string;
  decisionOwner?: string;
  scopeDescription?: string;
  valueTargetDescription?: string;
  baselineOwnerDescription?: string;
  categoryLabel?: string;
  creationRequestId?: string;
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
    const rawScopeDescription = parseOptionalString(body.scopeDescription);
    const valueTargetDescription = parseOptionalString(
      body.valueTargetDescription,
    );
    const baselineOwnerDescription = parseOptionalString(
      body.baselineOwnerDescription,
    );
    const categoryLabel = parseOptionalString(body.categoryLabel);
    const scopeDescription =
      valueTargetDescription || baselineOwnerDescription || categoryLabel
        ? buildSourceScopeDescription({
            scopeBoundary: rawScopeDescription,
            valueTarget: valueTargetDescription,
            baselineOwner: baselineOwnerDescription,
            category: categoryLabel,
          })
        : rawScopeDescription;

    const event = await createSourcingEvent({
      clientKey: activeClient.key,
      eventName,
      eventType: parseEventType(body.eventType),
      triggerDescription,
      decisionOwner: parseOptionalString(body.decisionOwner),
      scopeDescription,
      linkedProgramId: parseOptionalString(body.linkedProgramId),
      estimatedValueUsd: parseOptionalNumber(body.estimatedValueUsd),
      createdByUserId: tenancy.userId,
      creationRequestId: parseOptionalString(body.creationRequestId),
    });

    if (tenancy.userId) {
      // DB write routed through the data-plane write seam (Slice 3b). The
      // adapter tolerates a missing participants table, exactly as before.
      const participantWrite = await selectSourceWriteAdapter(
        undefined,
        activeClient.key,
      ).insertParticipant({
        clientKey: activeClient.key,
        sourceEventId: event.id,
        userId: tenancy.userId,
      });
      if (!participantWrite.ok) {
        throw new Error(participantWrite.error ?? 'source participant assignment failed');
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
