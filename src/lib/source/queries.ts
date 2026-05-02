import {
  getSourceArtifactSeed,
  getSourceDashboardSeed,
  getSourceEventSeed,
  getSourceValueSeed,
  listSourceEventSeed,
} from './mock-seed';
import type {
  AbarvaSourceDashboardData,
  SourceArtifactDetail,
  SourceStageKey,
  SourceValueLedgerSnapshot,
  SourcingEventDetail,
  SourcingEventSummary,
} from './types';
import { getStageOverride } from './stage-overrides';
import { SOURCE_LIFECYCLE_STATUS_LABELS, SOURCE_STAGE_LABELS } from './constants';
import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy } from '@/lib/auth/tenancy';
import { allowedSourceEventIdsForUser, canReadSourceEvent } from '@/lib/auth/source-access-policy';

// ── DB row type for source_events ─────────────────────────────────────────────

export interface SourceEventRow {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  event_type: string;
  current_stage_key: string;
  lifecycle_state: string;
  linked_program_id: string | null;
  estimated_value_usd: number | null;
  trigger_description: string | null;
  scope_description: string | null;
  decision_owner: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSourcingEventInput {
  clientKey: string;
  eventName: string;
  eventType: string;
  triggerDescription: string;
  decisionOwner?: string;
  scopeDescription?: string;
  linkedProgramId?: string;
  estimatedValueUsd?: number;
  createdByUserId?: string;
}

function generateEventCode(clientKey: string, eventName: string): string {
  const prefix = clientKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const nameSlug = eventName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ').slice(0, 3).join('-');
  const year = new Date().getFullYear();
  return `${prefix}-${nameSlug}-${year}`;
}

export async function getPendingSourceEvents(clientKey: string): Promise<SourceEventRow[]> {
  const tenancy = await requireTenancy().catch(() => null);
  const allowedIds = tenancy ? await allowedSourceEventIdsForUser(tenancy, clientKey).catch(() => []) : [];
  if (allowedIds !== null && allowedIds.length === 0) return [];

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_events')
    .select('*')
    .eq('client_key', clientKey)
    .eq('lifecycle_state', 'waiting_on_client')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPendingSourceEvents]', error.message);
    return [];
  }
  const rows = (data ?? []) as SourceEventRow[];
  return allowedIds === null ? rows : rows.filter((event) => allowedIds.includes(event.id));
}

export async function createSourcingEvent(input: CreateSourcingEventInput): Promise<SourceEventRow> {
  const supabase = getServerSupabase();
  const eventCode = generateEventCode(input.clientKey, input.eventName);

  const { data, error } = await supabase
    .from('source_events')
    .insert({
      client_key: input.clientKey,
      event_code: eventCode,
      event_name: input.eventName,
      event_type: input.eventType,
      trigger_description: input.triggerDescription || null,
      decision_owner: input.decisionOwner || null,
      scope_description: input.scopeDescription || null,
      linked_program_id: input.linkedProgramId || null,
      estimated_value_usd: input.estimatedValueUsd ?? null,
      created_by_user_id: input.createdByUserId || null,
      current_stage_key: 'intake',
      lifecycle_state: 'waiting_on_client',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SourceEventRow;
}

// Canonical Source query boundary. Keep all temporary seed reads here so the
// new route family does not inherit legacy /programs mocks or preview pages.

export async function getSourceDashboardData(): Promise<AbarvaSourceDashboardData> {
  return getSourceDashboardSeed();
}

export async function listSourcingEvents(): Promise<SourcingEventSummary[]> {
  const seedEvents = listSourceEventSeed();
  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) return seedEvents;
  const activeClientSeedEvents = seedEvents.filter((event) =>
    seedEventMatchesClient(event, activeClient.key),
  );

  const tenancy = await requireTenancy().catch(() => null);
  const allowedIds = tenancy ? await allowedSourceEventIdsForUser(tenancy, activeClient.key).catch(() => []) : null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_events')
    .select('*')
    .eq('client_key', activeClient.key)
    .neq('lifecycle_state', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listSourcingEvents] source_events overlay failed', error.message);
    return activeClientSeedEvents;
  }

  const persistedRows = ((data as SourceEventRow[] | null) ?? []);
  const scopedPersistedRows = allowedIds === null
    ? persistedRows
    : persistedRows.filter((row) => allowedIds.includes(row.id));
  const persisted = scopedPersistedRows.map((row) =>
    sourceEventRowToSummary(row, activeClient.name),
  );
  const persistedIds = new Set(persisted.map((event) => event.id));
  const scopedSeedEvents = allowedIds === null
    ? activeClientSeedEvents
    : activeClientSeedEvents.filter((event) => allowedIds.includes(event.id));
  return [...persisted, ...scopedSeedEvents.filter((event) => !persistedIds.has(event.id))];
}

function seedEventMatchesClient(event: SourcingEventSummary, clientKey: string): boolean {
  const accountName = event.accountName.trim().toLowerCase();

  if (clientKey === 'apexretail') return accountName.includes('apex');
  if (clientKey === 'meridian') return accountName.includes('meridian');
  if (clientKey === 'arcturus') {
    return accountName.includes('arcturus') || accountName.includes('first capital');
  }
  if (clientKey === 'keystone') return accountName.includes('keystone');

  return false;
}

function sourceEventRowToSummary(row: SourceEventRow, accountName: string): SourcingEventSummary {
  const stageKey = isSourceStageKey(row.current_stage_key) ? row.current_stage_key : 'intake';
  const status = isSourceLifecycleStatus(row.lifecycle_state) ? row.lifecycle_state : 'waiting_on_client';
  const valueAtStakeUsd = row.estimated_value_usd ?? 0;
  const waitingForApproval = status === 'waiting_on_client';
  const approvalCopy =
    'Tenant admin approval required; S0 exit then needs decision-owner and sourcing-lead co-sign.';

  return {
    id: row.id,
    code: row.event_code,
    name: row.event_name,
    accountName,
    leadAgent: 'Nexus',
    archetype: formatSourceEventType(row.event_type),
    rigor: row.event_type === 'managed_service' || row.event_type === 'consulting' ? 'strategic' : 'standard',
    status,
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS[status],
    priority: waitingForApproval ? 'high' : 'medium',
    currentStageKey: stageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[stageKey],
    openAlerts: waitingForApproval ? 1 : 0,
    owner: row.decision_owner || 'Decision owner pending',
    agingDays: daysSince(row.created_at),
    blocker: waitingForApproval ? approvalCopy : null,
    nextAction: waitingForApproval ? 'Admin reviews intake package' : 'Open event canvas and continue Source workflow',
    isAtRisk: false,
    valueAtStakeUsd,
    projectedValueUsd: valueAtStakeUsd,
    realizedValueUsd: 0,
    nextDecision: waitingForApproval
      ? `Approval authority: ${approvalCopy}`
      : row.scope_description || 'Continue Source workflow from current stage.',
  };
}

function formatSourceEventType(eventType: string): string {
  return eventType
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function daysSince(isoDate: string): number {
  const created = new Date(isoDate).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}

function isSourceStageKey(value: string): value is SourceStageKey {
  return value in SOURCE_STAGE_LABELS;
}

function isSourceLifecycleStatus(value: string): value is SourcingEventSummary['status'] {
  return value in SOURCE_LIFECYCLE_STATUS_LABELS;
}

export async function getSourcingEvent(eventId: string): Promise<SourcingEventDetail | null> {
  const [activeClient, tenancy] = await Promise.all([
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  if (activeClient && tenancy && !(await canReadSourceEvent(tenancy, activeClient.key, eventId).catch(() => false))) {
    return null;
  }

  const event = getSourceEventSeed(eventId);
  if (!event) return null;
  const override = getStageOverride(eventId);
  if (override) {
    return {
      ...event,
      currentStageKey: override,
      currentStageLabel: SOURCE_STAGE_LABELS[override],
    };
  }
  return event;
}

export async function getSourcingEventArtifact(eventId: string, artifactId: string): Promise<SourceArtifactDetail | null> {
  return getSourceArtifactSeed(eventId, artifactId);
}

export async function getSourceValueLedger(): Promise<SourceValueLedgerSnapshot> {
  return getSourceValueSeed();
}
