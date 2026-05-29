import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type { SynthesisViolationEvent, ViolationsBackend } from './violationsRecorder';
import type { Violation, ViolationType } from './outputValidator';

type DbViolationEventRow = {
  id: string;
  event_timestamp: string;
  route: string;
  surface: string | null;
  tenant_client_key: string;
  user_id: string | null;
  violation_count: number;
  violation_types: string[] | null;
  violations: unknown;
  response_length: number;
};

function eventToDbRow(event: SynthesisViolationEvent) {
  return {
    id: event.id,
    event_timestamp: event.timestamp,
    route: event.route,
    surface: event.surface,
    tenant_client_key: event.tenantId,
    user_id: event.userId,
    violation_count: event.violationCount,
    violation_types: event.violationTypes,
    violations: event.violations,
    response_length: event.responseLength,
  };
}

function rowToEvent(row: DbViolationEventRow): SynthesisViolationEvent {
  return {
    id: row.id,
    timestamp: row.event_timestamp,
    route: row.route,
    surface: row.surface,
    tenantId: row.tenant_client_key,
    userId: row.user_id,
    violationCount: row.violation_count,
    violationTypes: (row.violation_types ?? []) as ViolationType[],
    violations: Array.isArray(row.violations) ? (row.violations as Violation[]) : [],
    responseLength: row.response_length,
  };
}

export function canUseSupabaseViolationBackend(): boolean {
  return Boolean(process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL);
}

export const supabaseViolationsBackend: ViolationsBackend = {
  async write(event: SynthesisViolationEvent): Promise<void> {
    const sb = getAzureWriteFluentClient();
    const { error } = await sb.from('agent_quality_violation_events').insert(eventToDbRow(event));
    if (error) {
      throw new Error(`agent_quality_violation_insert_failed: ${error.message}`);
    }
  },
};

export async function listRecentAgentQualityViolationEvents(
  tenantKey: string,
  limit = 500,
): Promise<SynthesisViolationEvent[]> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from('agent_quality_violation_events')
    .select(
      'id, event_timestamp, route, surface, tenant_client_key, user_id, violation_count, violation_types, violations, response_length',
    )
    .eq('tenant_client_key', tenantKey)
    .order('event_timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`agent_quality_violation_list_failed: ${error.message}`);
  }
  return ((data ?? []) as DbViolationEventRow[]).map(rowToEvent);
}

export const __testing__ = {
  eventToDbRow,
  rowToEvent,
};
