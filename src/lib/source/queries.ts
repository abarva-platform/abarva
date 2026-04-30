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
  SourceValueLedgerSnapshot,
  SourcingEventDetail,
  SourcingEventSummary,
} from './types';
import { getStageOverride } from './stage-overrides';
import { SOURCE_STAGE_LABELS } from './constants';
import { getServerSupabase } from '@/lib/supabase-server';

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
  return (data ?? []) as SourceEventRow[];
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
  return listSourceEventSeed();
}

export async function getSourcingEvent(eventId: string): Promise<SourcingEventDetail | null> {
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
