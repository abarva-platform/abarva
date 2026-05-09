import type {
  SourceAuthenticatedUser,
  SourceContextAssemblyInput,
} from '../agent-context';
import type { SourceSurface } from '../agent-context';
import { getServerSupabase } from '@/lib/supabase-server';

export const APEX_RETAIL_CLIENT_KEY = 'apexretail';
export const APEX_RETAIL_BROKER_TENANT_KEY = 'apex-retail';

export const APEX_RETAIL_DATA_SEGMENTS = [
  'enterprise_profile',
  'org_structure',
  'it_landscape',
  'it_financials',
  'kpi_dictionary',
  'program_inventory',
  'sourcing_artifacts',
  'program_deliverables',
  'evidence_ledger',
  'operating_telemetry',
  'vendor_contracts',
  'compliance',
  'industry_context',
  'cross_program_signals',
] as const;

export type ApexRetailDataSegment = typeof APEX_RETAIL_DATA_SEGMENTS[number];

export interface ApexRetailAdapterOptions {
  eventId?: string;
  user: SourceAuthenticatedUser;
  userPrompt: string;
  surface?: SourceSurface;
  selectedAttachmentIds?: string[];
  priorConversationTurns?: SourceContextAssemblyInput['priorConversationTurns'];
  supabase?: Pick<ReturnType<typeof getServerSupabase>, 'from'>;
}

export interface ApexRetailSourceEventRow {
  id: string;
  event_code: string;
  event_name: string;
  client_key: string;
  current_stage_key: string | null;
  lifecycle_state: string | null;
  updated_at: string;
}

interface ApexRetailInventoryRecordRow {
  segment_id: string;
  record_id: string;
  title: string;
  freshness_state: string;
  ingestion_status: string;
  last_reviewed: string | null;
}

interface ApexRetailContextChunkRow {
  chunk_id: string;
  source_segment_id: string;
  source_record_id: string;
  embedding_status: string;
}

export interface ApexRetailAdapterLiveContext {
  clientKey: typeof APEX_RETAIL_CLIENT_KEY;
  brokerTenantKey: typeof APEX_RETAIL_BROKER_TENANT_KEY;
  dataSegmentsRequested: readonly ApexRetailDataSegment[];
  inventoryRecordCount: number;
  contextChunkCount: number;
  sourceEventFound: boolean;
  sourceEvent?: ApexRetailSourceEventRow;
  segmentCounts: Record<string, number>;
  embeddingStatusCounts: Record<string, number>;
}

export interface ApexRetailAdapterResult {
  input: SourceContextAssemblyInput;
  liveContext: ApexRetailAdapterLiveContext;
}

export async function buildApexRetailSourceContextAssemblyInput(
  options: ApexRetailAdapterOptions,
): Promise<ApexRetailAdapterResult> {
  const supabase = options.supabase ?? getServerSupabase();
  const [sourceEvent, inventoryRecords, contextChunks] = await Promise.all([
    loadApexRetailSourceEvent(supabase, options.eventId),
    loadApexRetailInventoryRecords(supabase),
    loadApexRetailContextChunks(supabase),
  ]);
  const eventId = sourceEvent?.id ?? options.eventId;

  return {
    input: {
      tenant: {
        tenantId: APEX_RETAIL_BROKER_TENANT_KEY,
        tenantKey: APEX_RETAIL_CLIENT_KEY,
        tenantName: 'Apex Retail Group',
        activeClientId: APEX_RETAIL_CLIENT_KEY,
        activeClientName: 'Apex Retail Group',
      },
      user: options.user,
      route: eventId ? `/source/events/${eventId}` : '/source',
      surface: options.surface ?? (eventId ? 'eventCanvas' : 'dashboard'),
      userPrompt: options.userPrompt,
      eventId,
      stageKey: normalizeStageKey(sourceEvent?.current_stage_key),
      selectedAttachmentIds: options.selectedAttachmentIds ?? [],
      priorConversationTurns: options.priorConversationTurns ?? [],
    },
    liveContext: {
      clientKey: APEX_RETAIL_CLIENT_KEY,
      brokerTenantKey: APEX_RETAIL_BROKER_TENANT_KEY,
      dataSegmentsRequested: APEX_RETAIL_DATA_SEGMENTS,
      inventoryRecordCount: inventoryRecords.length,
      contextChunkCount: contextChunks.length,
      sourceEventFound: Boolean(sourceEvent),
      sourceEvent: sourceEvent ?? undefined,
      segmentCounts: countBy(inventoryRecords, (record) => record.segment_id),
      embeddingStatusCounts: countBy(contextChunks, (chunk) => chunk.embedding_status),
    },
  };
}

async function loadApexRetailSourceEvent(
  supabase: Pick<ReturnType<typeof getServerSupabase>, 'from'>,
  eventId: string | undefined,
): Promise<ApexRetailSourceEventRow | null> {
  let query = supabase
    .from('source_events')
    .select('id,event_code,event_name,client_key,current_stage_key,lifecycle_state,updated_at')
    .eq('client_key', APEX_RETAIL_CLIENT_KEY)
    .neq('lifecycle_state', 'archived')
    .order('updated_at', { ascending: false });

  if (eventId) {
    query = query.or(`id.eq.${eventId},event_code.eq.${eventId}`);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    throw new Error(`Apex Retail source_events query failed: ${error.message}`);
  }

  return (data as ApexRetailSourceEventRow | null) ?? null;
}

async function loadApexRetailInventoryRecords(
  supabase: Pick<ReturnType<typeof getServerSupabase>, 'from'>,
): Promise<ApexRetailInventoryRecordRow[]> {
  const { data, error } = await supabase
    .from('data_inventory_records')
    .select('segment_id,record_id,title,freshness_state,ingestion_status,last_reviewed')
    .eq('tenant_key', APEX_RETAIL_BROKER_TENANT_KEY)
    .in('segment_id', [...APEX_RETAIL_DATA_SEGMENTS])
    .order('segment_id', { ascending: true })
    .order('record_id', { ascending: true });

  if (error) {
    throw new Error(`Apex Retail data_inventory_records query failed: ${error.message}`);
  }

  return (data as ApexRetailInventoryRecordRow[] | null) ?? [];
}

async function loadApexRetailContextChunks(
  supabase: Pick<ReturnType<typeof getServerSupabase>, 'from'>,
): Promise<ApexRetailContextChunkRow[]> {
  const { data, error } = await supabase
    .from('enterprise_context_chunks')
    .select('chunk_id,source_segment_id,source_record_id,embedding_status')
    .eq('tenant_key', APEX_RETAIL_BROKER_TENANT_KEY)
    .in('source_segment_id', [...APEX_RETAIL_DATA_SEGMENTS])
    .order('source_segment_id', { ascending: true })
    .order('chunk_id', { ascending: true });

  if (error) {
    throw new Error(`Apex Retail enterprise_context_chunks query failed: ${error.message}`);
  }

  return (data as ApexRetailContextChunkRow[] | null) ?? [];
}

function normalizeStageKey(stageKey: string | null | undefined): SourceContextAssemblyInput['stageKey'] {
  if (!stageKey) return undefined;
  if (stageKey === 'intake') return 'strategy';
  if (stageKey === 'sourcing_strategy') return 'strategy';
  if (stageKey === 'rfp_rfi_package') return 'rfp';
  if (stageKey === 'vendor_responses') return 'responses';
  if (stageKey === 'orals_bafo') return 'bafo';
  if (stageKey === 'contract_mobilization') return 'transition';
  if (stageKey === 'value_realization') return 'value';
  return stageKey as SourceContextAssemblyInput['stageKey'];
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
