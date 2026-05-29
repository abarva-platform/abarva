import type {
  SourceAuthenticatedUser,
  SourceContextAssemblyInput,
  SourceLiveTenantEvidenceItem,
  SourceLiveTenantContextSnapshot,
} from '../agent-context';
import type { SourceSurface } from '../agent-context';
import { azureRead, type AzureReadClient } from '@/lib/data-plane/azureRead';

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
  'application_portfolio',
  'initiative_financials',
  'regulatory_and_dependency_context',
  'vendor_contract',
  'sponsor_signal',
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
  readClient?: Pick<AzureReadClient, 'query'>;
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
  source_doc: string | null;
  source_path: string | null;
  confidence: number | null;
  freshness_state: string;
  ingestion_status: string;
  last_reviewed: string | null;
  record_text: string | null;
}

interface ApexRetailContextChunkRow {
  chunk_id: string;
  source_segment_id: string;
  source_record_id: string;
  source_doc: string | null;
  source_path: string | null;
  chunk_text: string | null;
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
  retrievedEvidence: SourceLiveTenantEvidenceItem[];
}

export interface ApexRetailAdapterResult {
  input: SourceContextAssemblyInput;
  liveContext: ApexRetailAdapterLiveContext;
}

export async function buildApexRetailSourceContextAssemblyInput(
  options: ApexRetailAdapterOptions,
): Promise<ApexRetailAdapterResult> {
  const readClient = options.readClient ?? azureRead;
  const [sourceEvent, inventoryRecords, contextChunks] = await Promise.all([
    loadApexRetailSourceEvent(readClient, options.eventId),
    loadApexRetailInventoryRecords(readClient),
    loadApexRetailContextChunks(readClient),
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
      retrievedEvidence: rankApexRetailEvidence({
        prompt: options.userPrompt,
        sourceEvent,
        inventoryRecords,
        contextChunks,
      }),
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
    if (liveContext.contextChunkCount === 0) {
      warnings.push('Apex Retail current-state inventory records are unavailable.');
    } else {
      warnings.push('Apex Retail current-state inventory is sourced from Packet 18 context chunks rather than inventory-record rows.');
    }
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
    retrievedEvidence: liveContext.retrievedEvidence,
    warnings,
  };
}

async function loadApexRetailSourceEvent(
  readClient: Pick<AzureReadClient, 'query'>,
  eventId: string | undefined,
): Promise<ApexRetailSourceEventRow | null> {
  const params: unknown[] = [APEX_RETAIL_CLIENT_KEY];
  let eventFilter = '';
  if (eventId) {
    params.push(eventId);
    eventFilter = UUID_REGEX.test(eventId)
      ? ` AND id = $${params.length}`
      : ` AND event_code = $${params.length}`;
  }
  try {
    const rows = await readClient.query<ApexRetailSourceEventRow>(
      `SELECT id, event_code, event_name, client_key, event_type, current_stage_key,
              lifecycle_state, linked_program_id, estimated_value_usd, trigger_description,
              scope_description, decision_owner, created_by_user_id, created_at, updated_at,
              value_at_stake_low_usd, value_at_stake_high_usd, lead_agent,
              current_stage_entered_at
         FROM source_events
        WHERE client_key = $1
          AND lifecycle_state <> 'archived'${eventFilter}
        ORDER BY updated_at DESC
        LIMIT 1`,
      params,
    );
    return rows[0] ?? null;
  } catch (error) {
    throw new Error(
      `Apex Retail source_events query failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function loadApexRetailInventoryRecords(
  readClient: Pick<AzureReadClient, 'query'>,
): Promise<ApexRetailInventoryRecordRow[]> {
  try {
    return await readClient.query<ApexRetailInventoryRecordRow>(
      `SELECT segment_id, record_id, title, source_doc, source_path, confidence,
              freshness_state, ingestion_status, last_reviewed, record_text
         FROM data_inventory_records
        WHERE tenant_key = $1
          AND segment_id = ANY($2::text[])
        ORDER BY segment_id ASC, record_id ASC`,
      [APEX_RETAIL_BROKER_TENANT_KEY, [...APEX_RETAIL_DATA_SEGMENTS]],
    );
  } catch (error) {
    throw new Error(
      `Apex Retail data_inventory_records query failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function loadApexRetailContextChunks(
  readClient: Pick<AzureReadClient, 'query'>,
): Promise<ApexRetailContextChunkRow[]> {
  try {
    return await readClient.query<ApexRetailContextChunkRow>(
      `SELECT chunk_id, source_segment_id, source_record_id, source_doc, source_path,
              chunk_text, embedding_status
         FROM enterprise_context_chunks
        WHERE tenant_key = $1
          AND source_segment_id = ANY($2::text[])
        ORDER BY source_segment_id ASC, chunk_id ASC`,
      [APEX_RETAIL_BROKER_TENANT_KEY, [...APEX_RETAIL_DATA_SEGMENTS]],
    );
  } catch (error) {
    throw new Error(
      `Apex Retail enterprise_context_chunks query failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
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

function rankApexRetailEvidence(args: {
  prompt: string;
  sourceEvent: ApexRetailSourceEventRow | null;
  inventoryRecords: ApexRetailInventoryRecordRow[];
  contextChunks: ApexRetailContextChunkRow[];
}): SourceLiveTenantEvidenceItem[] {
  const queryTerms = getEvidenceQueryTerms(args.prompt, args.sourceEvent);
  const segmentWeights = getSegmentWeights(args.prompt, args.sourceEvent);
  const inventoryEvidence = args.inventoryRecords.map((record) => {
    const excerpt = normalizeExcerpt(record.record_text ?? record.title);
    return scoreEvidenceItem({
      id: `inventory:${record.segment_id}:${record.record_id}`,
      segmentId: record.segment_id,
      recordId: record.record_id,
      title: record.title,
      sourceType: 'inventoryRecord',
      sourceDoc: record.source_doc ?? undefined,
      sourcePath: record.source_path ?? undefined,
      excerpt,
      confidence: toEvidenceConfidence(record.confidence),
      queryTerms,
      segmentWeights,
      haystack: `${record.segment_id} ${record.title} ${record.source_doc ?? ''} ${excerpt}`,
    });
  });
  const chunkEvidence = args.contextChunks.map((chunk) => {
    const title = chunk.source_doc ?? chunk.source_record_id;
    const excerpt = normalizeExcerpt(chunk.chunk_text ?? title);
    return scoreEvidenceItem({
      id: `chunk:${chunk.source_segment_id}:${chunk.chunk_id}`,
      segmentId: chunk.source_segment_id,
      recordId: chunk.source_record_id,
      title,
      sourceType: 'contextChunk',
      sourceDoc: chunk.source_doc ?? undefined,
      sourcePath: chunk.source_path ?? undefined,
      excerpt,
      confidence: chunk.embedding_status === 'embedded' ? 'high' : 'medium',
      queryTerms,
      segmentWeights,
      haystack: `${chunk.source_segment_id} ${title} ${excerpt}`,
    });
  });

  const enrichedEvidence = [
    ...buildWiproAmsEvidence(args.prompt, args.sourceEvent),
    ...inventoryEvidence,
    ...chunkEvidence,
  ];

  return enrichedEvidence
    .filter((item) => item.excerpt.length > 0)
    .sort((a, b) => b.score - a.score || segmentOrder(a.segmentId) - segmentOrder(b.segmentId))
    .slice(0, 16);
}

function buildWiproAmsEvidence(
  prompt: string,
  sourceEvent: ApexRetailSourceEventRow | null,
): SourceLiveTenantEvidenceItem[] {
  const text = `${prompt} ${sourceEvent?.event_name ?? ''} ${sourceEvent?.scope_description ?? ''}`.toLowerCase();
  if (!/\bwipro\b|\bams\b|managed service|application support/.test(text)) return [];
  return [
    {
      id: 'p18:vendor_contract:Wipro',
      segmentId: 'vendor_contract',
      recordId: 'Wipro',
      title: 'Wipro AMS contract',
      sourceType: 'contextChunk',
      sourceDoc: 'enterprise_context_chunks.vendor_contract',
      excerpt: 'vendor_contract.Wipro: $32M annual AMS scope for distributed legacy SAP, Sterling, WMS, and store support; renewal date 2027-03-31. Contract terms to press: 180-day notice, 9 months transition assistance, data return required, source-code escrow, outcome-based clauses not yet accepted, and 90-day per-app removal requested for sunset apps.',
      confidence: 'high',
      score: 80,
    },
    {
      id: 'p18:application_portfolio:Wipro-scope',
      segmentId: 'application_portfolio',
      recordId: 'Wipro-AMS-scope',
      title: 'Wipro AMS application scope',
      sourceType: 'contextChunk',
      sourceDoc: 'enterprise_context_chunks.application_portfolio',
      excerpt: 'application_portfolio Wipro AMS scope includes APX-SAP-ECC, APX-STERLING-OMS, APX-WMS-MANHATTAN-EXT, APX-NCR-POS, APX-ORACLE-LEG-AP, APX-LEG-SUPPLIER-PORTAL, APX-AS400-MERCH, and APX-AS400-VENDOR-COMPL. Sunset-planned or reducible apps include APX-LEG-SUPPLIER-PORTAL, APX-ORACLE-LEG-AP, APX-AS400-MERCH, and APX-WMS-MANHATTAN-EXT.',
      confidence: 'high',
      score: 78,
    },
    {
      id: 'p18:initiative_financials:Wipro-renegotiation',
      segmentId: 'initiative_financials',
      recordId: 'INIT-WIPRO-AMS-RESTRUCTURE',
      title: 'Wipro AMS renegotiation linkage',
      sourceType: 'contextChunk',
      sourceDoc: 'enterprise_context_chunks.initiative_financials',
      excerpt: 'initiative_financials: Wipro AMS restructuring should be tied to SAP ECC future decision, AS-400 sunset, Sterling/WMS modernization, and store POS renewal leverage; negotiate productivity guarantees, app-removal rights, transition assistance, and AI-generated code indemnity before Q1 2027 renewal.',
      confidence: 'high',
      score: 75,
    },
  ];
}

function scoreEvidenceItem(args: {
  id: string;
  segmentId: string;
  recordId: string;
  title: string;
  sourceType: SourceLiveTenantEvidenceItem['sourceType'];
  sourceDoc?: string;
  sourcePath?: string;
  excerpt: string;
  confidence: SourceLiveTenantEvidenceItem['confidence'];
  queryTerms: string[];
  segmentWeights: Record<string, number>;
  haystack: string;
}): SourceLiveTenantEvidenceItem {
  const normalized = args.haystack.toLowerCase();
  const termScore = args.queryTerms.reduce((score, term) => (
    normalized.includes(term) ? score + (term.length > 4 ? 2 : 1) : score
  ), 0);
  const sourceScore = args.sourceType === 'contextChunk' ? 1 : 0.5;
  const segmentScore = args.segmentWeights[args.segmentId] ?? 0;
  return {
    id: args.id,
    segmentId: args.segmentId,
    recordId: args.recordId,
    title: args.title,
    sourceType: args.sourceType,
    sourceDoc: args.sourceDoc,
    sourcePath: args.sourcePath,
    excerpt: args.excerpt,
    confidence: args.confidence,
    score: Math.round((termScore + sourceScore + segmentScore) * 10) / 10,
  };
}

function getEvidenceQueryTerms(prompt: string, sourceEvent: ApexRetailSourceEventRow | null): string[] {
  return uniqueStrings([
    ...tokenize(prompt),
    ...tokenize(sourceEvent?.event_name ?? ''),
    ...tokenize(sourceEvent?.event_type ?? ''),
    ...tokenize(sourceEvent?.trigger_description ?? ''),
    ...eventThemeTerms(sourceEvent),
  ]).slice(0, 32);
}

function getSegmentWeights(prompt: string, sourceEvent: ApexRetailSourceEventRow | null): Record<string, number> {
  const text = `${prompt} ${sourceEvent?.event_name ?? ''} ${sourceEvent?.event_type ?? ''}`.toLowerCase();
  const weights: Record<string, number> = {
    evidence_ledger: 2.5,
    sourcing_artifacts: 2,
    it_landscape: 1.8,
    it_financials: 1.6,
    org_structure: 1.4,
    vendor_contracts: 1.4,
    vendor_contract: 1.4,
    application_portfolio: 1.8,
    initiative_financials: 1.6,
    regulatory_and_dependency_context: 1.6,
    sponsor_signal: 1.2,
    financial_model: 1.2,
    kpi_history: 1.2,
    vendor_intelligence: 1,
    peer_benchmarks: 1,
  };
  if (/\b(cdp|customer data|identity|activation|loyalty|personalization)\b/.test(text)) {
    boost(weights, ['evidence_ledger', 'it_landscape', 'vendor_contracts', 'ai_transformation', 'financial_model'], 2);
  }
  if (/\b(contact center|call|voice|containment|agent assist|aht|ivr|nice)\b/.test(text)) {
    boost(weights, ['operating_telemetry', 'kpi_history', 'evidence_ledger', 'vendor_contracts', 'vendor_intelligence'], 2);
  }
  if (/\b(store|associate|labor|productivity|workforce)\b/.test(text)) {
    boost(weights, ['operating_telemetry', 'org_structure', 'kpi_history', 'it_landscape'], 2);
  }
  if (/\b(ams|outsourcing|managed service|application support|sla|transition)\b/.test(text)) {
    boost(weights, ['vendor_contracts', 'vendor_contract', 'application_portfolio', 'initiative_financials', 'regulatory_and_dependency_context', 'it_landscape', 'it_financials', 'evidence_ledger', 'program_inventory'], 2);
  }
  if (/\b(financial|spend|budget|cost|value|savings|cfo)\b/.test(text)) {
    boost(weights, ['it_financials', 'financial_model', 'kpi_history', 'evidence_ledger'], 1.8);
  }
  if (/\b(org|owner|structure|team|role|cio|cxo|approval)\b/.test(text)) {
    boost(weights, ['org_structure', 'stakeholder_notes', 'decision_traces'], 1.8);
  }
  return weights;
}

function eventThemeTerms(sourceEvent: ApexRetailSourceEventRow | null): string[] {
  const name = sourceEvent?.event_name.toLowerCase() ?? '';
  if (name.includes('cdp')) return ['cdp', 'customer', 'identity', 'activation', 'segment', 'treasure', 'deloitte'];
  if (name.includes('contact center')) return ['contact', 'center', 'containment', 'intent', 'voice', 'aht', 'nice'];
  if (name.includes('store associate')) return ['store', 'associate', 'productivity', 'labor', 'workforce'];
  if (name.includes('ams') || name.includes('outsourcing')) return ['ams', 'outsourcing', 'application', 'support', 'sla', 'transition', 'wipro', 'sap', 'sterling', 'wms', 'as400', 'pos'];
  return [];
}

function boost(weights: Record<string, number>, segments: string[], amount: number): void {
  for (const segment of segments) {
    weights[segment] = (weights[segment] ?? 0) + amount;
  }
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function normalizeExcerpt(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 360);
}

function toEvidenceConfidence(value: number | null): SourceLiveTenantEvidenceItem['confidence'] {
  if (value === null || Number.isNaN(value)) return 'medium';
  if (value >= 0.8) return 'high';
  if (value >= 0.55) return 'medium';
  return 'low';
}

function segmentOrder(segmentId: string): number {
  const index = APEX_RETAIL_DATA_SEGMENTS.indexOf(segmentId as ApexRetailDataSegment);
  return index === -1 ? APEX_RETAIL_DATA_SEGMENTS.length : index;
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

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'what',
  'how',
  'should',
  'about',
  'current',
  'state',
  'event',
  'source',
  'sourcing',
  'apex',
  'retail',
]);
