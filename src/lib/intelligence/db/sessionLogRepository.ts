// Intelligence surface audit + telemetry repositories.
//
// These helpers are intentionally data-layer-only. They do not compose
// answers, call models, or render UI. Their job is to preserve the v1
// Intelligence surface contract: every Sentinel answer can be audited by
// mode, retrieval set, provenance, tenant-data usage, and latency.

import { assertTenancy, getIntelSupabase } from './client';
import type {
  IntelligenceAuthState,
  IntelligenceEngagementState,
  IntelligenceModeToggleEvent,
  IntelligenceProvenanceTrail,
  IntelligenceReasoningMode,
  IntelligenceSessionLog,
  IntelligenceSurfaceContentEntry,
  IntelligenceSurfaceContentEntryType,
  IntelligenceSurfaceContentStatus,
  TenancyCtx,
} from '../types';

export const INTELLIGENCE_REASONING_MODES = [
  'generic',
  'corpus_grounded',
  'tenant_grounded',
  'cross_corpus',
] as const satisfies readonly IntelligenceReasoningMode[];

export function modeRequiresTenant(mode: IntelligenceReasoningMode): boolean {
  return mode === 'tenant_grounded' || mode === 'cross_corpus';
}

export interface RecordIntelligenceSessionInput {
  tenantKey?: string | null;
  clientId?: string | null;
  userId?: string | null;
  sessionId: string;
  threadId?: string | null;
  queryText: string;
  responseMode: IntelligenceReasoningMode;
  availableModes?: IntelligenceReasoningMode[];
  retrievedPatternIds?: string[];
  retrievedEvidenceIds?: string[];
  retrievedContradictionIds?: string[];
  retrievedSignalIds?: string[];
  provenanceRendered?: IntelligenceProvenanceTrail[];
  tenantDataUsed?: boolean;
  authState: IntelligenceAuthState;
  engagementState: IntelligenceEngagementState;
  latencyMs?: number | null;
  toolNames?: string[];
  errorCode?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RecordModeToggleInput {
  sessionLogId?: string | null;
  sessionId: string;
  clientId?: string | null;
  userId?: string | null;
  previousMode?: IntelligenceReasoningMode | null;
  nextMode: IntelligenceReasoningMode;
  dwellMs?: number | null;
  metadata?: Record<string, unknown>;
}

export interface UpsertSurfaceContentInput {
  registryKey: string;
  entryType: IntelligenceSurfaceContentEntryType;
  title: string;
  body: Record<string, unknown>;
  citedPatternIds?: string[];
  citedContradictionIds?: string[];
  citedSignalIds?: string[];
  citedResearchAnchors?: Array<Record<string, unknown>>;
  status?: IntelligenceSurfaceContentStatus;
  version?: number;
  lastReviewedBy?: string | null;
  lastReviewedAt?: string | null;
}

interface SessionLogRow {
  id: string;
  tenant_key: string | null;
  client_id: string | null;
  user_id: string | null;
  session_id: string;
  thread_id: string | null;
  query_text: string;
  response_mode: IntelligenceReasoningMode;
  available_modes: IntelligenceReasoningMode[] | null;
  retrieved_pattern_ids: string[] | null;
  retrieved_evidence_ids: string[] | null;
  retrieved_contradiction_ids: string[] | null;
  retrieved_signal_ids: string[] | null;
  provenance_rendered: IntelligenceProvenanceTrail[] | null;
  tenant_data_used: boolean;
  auth_state: IntelligenceAuthState;
  engagement_state: IntelligenceEngagementState;
  latency_ms: number | null;
  tool_names: string[] | null;
  error_code: string | null;
  metadata_jsonb: Record<string, unknown> | null;
  created_at: string;
}

interface ModeToggleRow {
  id: string;
  session_log_id: string | null;
  session_id: string;
  client_id: string | null;
  user_id: string | null;
  previous_mode: IntelligenceReasoningMode | null;
  next_mode: IntelligenceReasoningMode;
  dwell_ms: number | null;
  metadata_jsonb: Record<string, unknown> | null;
  created_at: string;
}

interface SurfaceContentRow {
  id: string;
  registry_key: string;
  entry_type: IntelligenceSurfaceContentEntryType;
  title: string;
  body_jsonb: Record<string, unknown> | null;
  cited_pattern_ids: string[] | null;
  cited_contradiction_ids: string[] | null;
  cited_signal_ids: string[] | null;
  cited_research_anchors: Array<Record<string, unknown>> | null;
  status: IntelligenceSurfaceContentStatus;
  version: number;
  last_reviewed_by: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function ensureTenantAllowed(input: {
  mode: IntelligenceReasoningMode;
  clientId?: string | null;
  userId?: string | null;
  tenantDataUsed?: boolean;
}): void {
  const tenantBound = modeRequiresTenant(input.mode) || input.tenantDataUsed === true;
  if (tenantBound && (!input.clientId || !input.userId)) {
    throw new Error('[intelligence/session-log] tenant-bound mode requires clientId and userId');
  }
}

function rowToSessionLog(row: SessionLogRow): IntelligenceSessionLog {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    clientId: row.client_id,
    userId: row.user_id,
    sessionId: row.session_id,
    threadId: row.thread_id,
    queryText: row.query_text,
    responseMode: row.response_mode,
    availableModes: row.available_modes ?? [],
    retrievedPatternIds: row.retrieved_pattern_ids ?? [],
    retrievedEvidenceIds: row.retrieved_evidence_ids ?? [],
    retrievedContradictionIds: row.retrieved_contradiction_ids ?? [],
    retrievedSignalIds: row.retrieved_signal_ids ?? [],
    provenanceRendered: row.provenance_rendered ?? [],
    tenantDataUsed: row.tenant_data_used,
    authState: row.auth_state,
    engagementState: row.engagement_state,
    latencyMs: row.latency_ms,
    toolNames: row.tool_names ?? [],
    errorCode: row.error_code,
    metadata: row.metadata_jsonb ?? {},
    createdAt: row.created_at,
  };
}

function rowToToggle(row: ModeToggleRow): IntelligenceModeToggleEvent {
  return {
    id: row.id,
    sessionLogId: row.session_log_id,
    sessionId: row.session_id,
    clientId: row.client_id,
    userId: row.user_id,
    previousMode: row.previous_mode,
    nextMode: row.next_mode,
    dwellMs: row.dwell_ms,
    metadata: row.metadata_jsonb ?? {},
    createdAt: row.created_at,
  };
}

function rowToSurfaceContent(row: SurfaceContentRow): IntelligenceSurfaceContentEntry {
  return {
    id: row.id,
    registryKey: row.registry_key,
    entryType: row.entry_type,
    title: row.title,
    body: row.body_jsonb ?? {},
    citedPatternIds: row.cited_pattern_ids ?? [],
    citedContradictionIds: row.cited_contradiction_ids ?? [],
    citedSignalIds: row.cited_signal_ids ?? [],
    citedResearchAnchors: row.cited_research_anchors ?? [],
    status: row.status,
    version: row.version,
    lastReviewedBy: row.last_reviewed_by,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSessionLogInsert(input: RecordIntelligenceSessionInput): Record<string, unknown> {
  ensureTenantAllowed({
    mode: input.responseMode,
    clientId: input.clientId,
    userId: input.userId,
    tenantDataUsed: input.tenantDataUsed,
  });

  return {
    tenant_key: input.tenantKey ?? null,
    client_id: input.clientId ?? null,
    user_id: input.userId ?? null,
    session_id: input.sessionId,
    thread_id: input.threadId ?? null,
    query_text: input.queryText,
    response_mode: input.responseMode,
    available_modes: input.availableModes ?? [input.responseMode],
    retrieved_pattern_ids: input.retrievedPatternIds ?? [],
    retrieved_evidence_ids: input.retrievedEvidenceIds ?? [],
    retrieved_contradiction_ids: input.retrievedContradictionIds ?? [],
    retrieved_signal_ids: input.retrievedSignalIds ?? [],
    provenance_rendered: input.provenanceRendered ?? [],
    tenant_data_used: input.tenantDataUsed ?? false,
    auth_state: input.authState,
    engagement_state: input.engagementState,
    latency_ms: input.latencyMs ?? null,
    tool_names: input.toolNames ?? [],
    error_code: input.errorCode ?? null,
    metadata_jsonb: input.metadata ?? {},
  };
}

export function toModeToggleInsert(input: RecordModeToggleInput): Record<string, unknown> {
  ensureTenantAllowed({
    mode: input.nextMode,
    clientId: input.clientId,
    userId: input.userId,
  });

  return {
    session_log_id: input.sessionLogId ?? null,
    session_id: input.sessionId,
    client_id: input.clientId ?? null,
    user_id: input.userId ?? null,
    previous_mode: input.previousMode ?? null,
    next_mode: input.nextMode,
    dwell_ms: input.dwellMs ?? null,
    metadata_jsonb: input.metadata ?? {},
  };
}

export async function recordIntelligenceSession(input: RecordIntelligenceSessionInput): Promise<IntelligenceSessionLog> {
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_session_log')
    .insert(toSessionLogInsert(input))
    .select('*')
    .single();
  if (error) throw error;
  return rowToSessionLog(data as SessionLogRow);
}

export async function recordModeToggle(input: RecordModeToggleInput): Promise<IntelligenceModeToggleEvent> {
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_mode_toggle_events')
    .insert(toModeToggleInsert(input))
    .select('*')
    .single();
  if (error) throw error;
  return rowToToggle(data as ModeToggleRow);
}

export async function listSessionLogsForTenant(
  ctx: TenancyCtx,
  opts: { sessionId?: string; limit?: number } = {},
): Promise<IntelligenceSessionLog[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  let query = sb
    .from('intelligence_session_log')
    .select('*')
    .eq('client_id', ctx.clientId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.sessionId) query = query.eq('session_id', opts.sessionId);
  const { data, error } = await query;
  if (error) throw error;
  return ((data as SessionLogRow[] | null) ?? []).map(rowToSessionLog);
}

export async function listModeTogglesForSession(
  ctx: TenancyCtx,
  sessionId: string,
): Promise<IntelligenceModeToggleEvent[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_mode_toggle_events')
    .select('*')
    .eq('client_id', ctx.clientId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data as ModeToggleRow[] | null) ?? []).map(rowToToggle);
}

export async function upsertSurfaceContentEntry(
  input: UpsertSurfaceContentInput,
): Promise<IntelligenceSurfaceContentEntry> {
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_surface_content_registry')
    .upsert(
      {
        registry_key: input.registryKey,
        entry_type: input.entryType,
        title: input.title,
        body_jsonb: input.body,
        cited_pattern_ids: input.citedPatternIds ?? [],
        cited_contradiction_ids: input.citedContradictionIds ?? [],
        cited_signal_ids: input.citedSignalIds ?? [],
        cited_research_anchors: input.citedResearchAnchors ?? [],
        status: input.status ?? 'draft',
        version: input.version ?? 1,
        last_reviewed_by: input.lastReviewedBy ?? null,
        last_reviewed_at: input.lastReviewedAt ?? null,
      },
      { onConflict: 'registry_key' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return rowToSurfaceContent(data as SurfaceContentRow);
}

export async function listSurfaceContentEntries(
  opts: {
    entryType?: IntelligenceSurfaceContentEntryType;
    status?: IntelligenceSurfaceContentStatus;
    limit?: number;
  } = {},
): Promise<IntelligenceSurfaceContentEntry[]> {
  const sb = getIntelSupabase();
  let query = sb
    .from('intelligence_surface_content_registry')
    .select('*')
    .order('registry_key', { ascending: true })
    .limit(opts.limit ?? 100);
  if (opts.entryType) query = query.eq('entry_type', opts.entryType);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, error } = await query;
  if (error) throw error;
  return ((data as SurfaceContentRow[] | null) ?? []).map(rowToSurfaceContent);
}
