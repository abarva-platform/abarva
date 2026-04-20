// intelligence_thread_turns CRUD · tenancy via thread ownership check.

import { assertTenancy, getIntelSupabase } from './client';
import type {
  CapabilityKey,
  ContradictionFlag,
  NexusConfidence,
  NexusFormat,
  NexusMode,
  NexusTurnData,
  NexusTurnPayload,
  Source,
  TenancyCtx,
  TurnRole,
} from '../types';

interface TurnRow {
  id: string;
  thread_id: string;
  index: number;
  role: TurnRole;
  mode: NexusMode | null;
  format: NexusFormat | null;
  confidence: NexusConfidence | null;
  payload_jsonb: NexusTurnPayload;
  sources_jsonb: Source[];
  capabilities_active: CapabilityKey[];
  counter_of_turn_id: string | null;
  contradiction_self_check: ContradictionFlag | null;
  persona_key: string | null;
  latency_ms: number | null;
  first_token_ms: number | null;
  created_at: string;
}

function rowToTurn(r: TurnRow): NexusTurnData {
  return {
    id: r.id,
    threadId: r.thread_id,
    index: r.index,
    role: r.role,
    mode: r.mode,
    format: r.format,
    confidence: r.confidence,
    payload: r.payload_jsonb ?? {},
    sources: r.sources_jsonb ?? [],
    capabilitiesActive: r.capabilities_active ?? [],
    counterOfTurnId: r.counter_of_turn_id,
    contradictionSelfCheck: r.contradiction_self_check,
    personaKey: r.persona_key,
    latencyMs: r.latency_ms,
    firstTokenMs: r.first_token_ms,
    createdAt: r.created_at,
  };
}

async function assertThreadOwned(threadId: string, ctx: TenancyCtx): Promise<void> {
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_threads')
    .select('id')
    .eq('id', threadId)
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('[turnRepository] thread not found or access denied');
}

export async function appendTurn(
  ctx: TenancyCtx,
  input: {
    threadId: string;
    role: TurnRole;
    mode?: NexusMode | null;
    format?: NexusFormat | null;
    confidence?: NexusConfidence | null;
    payload?: NexusTurnPayload;
    sources?: Source[];
    capabilitiesActive?: CapabilityKey[];
    counterOfTurnId?: string | null;
    contradictionSelfCheck?: ContradictionFlag | null;
    personaKey?: string | null;
    latencyMs?: number | null;
    firstTokenMs?: number | null;
  },
): Promise<NexusTurnData> {
  assertTenancy(ctx);
  await assertThreadOwned(input.threadId, ctx);
  const sb = getIntelSupabase();

  const { count } = await sb
    .from('intelligence_thread_turns')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', input.threadId);
  const nextIndex = count ?? 0;

  const { data, error } = await sb
    .from('intelligence_thread_turns')
    .insert({
      thread_id: input.threadId,
      index: nextIndex,
      role: input.role,
      mode: input.mode ?? null,
      format: input.format ?? null,
      confidence: input.confidence ?? null,
      payload_jsonb: input.payload ?? {},
      sources_jsonb: input.sources ?? [],
      capabilities_active: input.capabilitiesActive ?? [],
      counter_of_turn_id: input.counterOfTurnId ?? null,
      contradiction_self_check: input.contradictionSelfCheck ?? null,
      persona_key: input.personaKey ?? null,
      latency_ms: input.latencyMs ?? null,
      first_token_ms: input.firstTokenMs ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToTurn(data as TurnRow);
}

export async function listTurns(ctx: TenancyCtx, threadId: string, opts: { limit?: number; offset?: number } = {}): Promise<NexusTurnData[]> {
  assertTenancy(ctx);
  await assertThreadOwned(threadId, ctx);
  const sb = getIntelSupabase();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const { data, error } = await sb
    .from('intelligence_thread_turns')
    .select('*')
    .eq('thread_id', threadId)
    .order('index', { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data as TurnRow[] | null ?? []).map(rowToTurn);
}

export async function getTurn(ctx: TenancyCtx, turnId: string): Promise<NexusTurnData | null> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_thread_turns')
    .select('*, intelligence_threads!inner(client_id, user_id)')
    .eq('id', turnId)
    .eq('intelligence_threads.client_id', ctx.clientId)
    .eq('intelligence_threads.user_id', ctx.userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToTurn(data as unknown as TurnRow) : null;
}
