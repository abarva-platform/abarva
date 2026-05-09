import type {
  SourceAuthenticatedUser,
  SourceContextAssemblyInput,
  SourceLiveTenantContextSnapshot,
} from '../agent-context';
import type { SourceSurface } from '../agent-context';
import { getServerSupabase } from '@/lib/supabase-server';

export const APEX_RETAIL_CLIENT_KEY = 'apexretail';
export const APEX_RETAIL_BROKER_TENANT_KEY = 'apex-retail';

export const APEX_RETAIL_DATA_SEGMENTS = [
  'ai_transformation',
  'compliance',
  'cross_program_signals',
  'decision_traces',
  'enterprise_profile',
  'evidence_ledger',
  'financial_model',
  'graph_relationships',
  'industry_context',
  'it_financials',
  'it_landscape',
  'kpi_dictionary',
  'kpi_history',
  'operating_telemetry',
  'org_structure',
  'peer_benchmarks',
  'program_deliverables',
  'program_inventory',
  'scenario_library',
  'sourcing_artifacts',
  'stakeholder_notes',
  'vendor_contracts',
  'vendor_intelligence',
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
  value_at_stake_low_usd?: number | null;
  value_at_stake_high_usd?: number | null;
  lead_agent?: string | null;
  current_stage_entered_at?: string | null;
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
  contextChunkSegmentCounts: Record<string, number>;
  embeddedChunkSegmentCounts: Record<string, number>;
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
      contextChunkSegmentCounts: countBy(contextChunks, (chunk) => chunk.source_segment_id),
      embeddedChunkSegmentCounts: countBy(
        contextChunks.filter((chunk) => chunk.embedding_status === 'embedded'),
        (chunk) => chunk.source_segment_id,
      ),
      embeddingStatusCounts: countBy(contextChunks, (chunk) => chunk.embedding_status),
    },
  };
}

export function toApexRetailLiveTenantContextSnapshot(
  liveContext: ApexRetailAdapterLiveContext,
): SourceLiveTenantContextSnapshot {
  const segments = APEX_RETAIL_DATA_SEGMENTS.map((segmentId) => ({
    segmentId,
    inventoryRecords: liveContext.segmentCounts[segmentId] ?? 0,
    contextChunks: liveContext.contextChunkSegmentCounts[segmentId] ?? 0,
    embeddedChunks: liveContext.embeddedChunkSegmentCounts[segmentId] ?? 0,
  }));
  const activeSegments = segments.filter((segment) =>
    segment.inventoryRecords > 0 || segment.contextChunks > 0,
  );
  const embeddedContextChunkCount = segments.reduce(
    (sum, segment) => sum + segment.embeddedChunks,
    0,
  );
  const warnings: string[] = [];
  if (!liveContext.sourceEventFound) {
    warnings.push('No persisted Apex Retail source event matched this request.');
  }
  if (liveContext.inventoryRecordCount === 0) {
    warnings.push('Apex Retail current-state inventory records are unavailable.');
  }
  if (liveContext.contextChunkCount === 0) {
    warnings.push('Apex Retail enterprise context chunks are unavailable.');
  }
  if (embeddedContextChunkCount < liveContext.contextChunkCount) {
    warnings.push('Some Apex Retail context chunks are not embedded yet; semantic retrieval may be partial.');
  }

  return {
    clientKey: liveContext.clientKey,
    brokerTenantKey: liveContext.brokerTenantKey,
    inventoryRecordCount: liveContext.inventoryRecordCount,
    contextChunkCount: liveContext.contextChunkCount,
    embeddedContextChunkCount,
    sourceEventFound: liveContext.sourceEventFound,
    segments: activeSegments,
    currentStateAreas: activeSegments.map((segment) => formatSegmentLabel(segment.segmentId)),
    evidenceBasis: activeSegments
      .sort((a, b) => (b.inventoryRecords + b.contextChunks) - (a.inventoryRecords + a.contextChunks))
      .slice(0, 10)
      .map((segment) => (
        `${formatSegmentLabel(segment.segmentId)}: ${segment.inventoryRecords} records, ${segment.contextChunks} chunks, ${segment.embeddedChunks} embedded`
      )),
    warnings,
  };
}

async function loadApexRetailSourceEvent(
  supabase: Pick<ReturnType<typeof getServerSupabase>, 'from'>,
  eventId: string | undefined,
): Promise<ApexRetailSourceEventRow | null> {
  let query = supabase
    .from('source_events')
    .select('id,event_code,event_name,client_key,event_type,current_stage_key,lifecycle_state,linked_program_id,estimated_value_usd,trigger_description,scope_description,decision_owner,created_by_user_id,created_at,updated_at,value_at_stake_low_usd,value_at_stake_high_usd,lead_agent,current_stage_entered_at')
    .eq('client_key', APEX_RETAIL_CLIENT_KEY)
    .neq('lifecycle_state', 'archived')
    .order('updated_at', { ascending: false });

  if (eventId) {
    query = UUID_REGEX.test(eventId)
      ? query.eq('id', eventId)
      : query.eq('event_code', eventId);
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatSegmentLabel(segmentId: string): string {
  const acronyms = new Set(['ai', 'it', 'kpi']);
  return segmentId
    .split('_')
    .map((part) => acronyms.has(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
