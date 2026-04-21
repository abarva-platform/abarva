// intelligence_threads CRUD · tenancy-enforced.

import { assertTenancy, getIntelSupabase } from './client';
import type { IntelligenceThread, TenancyCtx, ThreadState } from '../types';

interface ThreadRow {
  id: string;
  user_id: string;
  client_id: string;
  conversation_id: string | null;
  title: string | null;
  state: ThreadState;
  attached_engagement_id: string | null;
  created_at: string;
  last_turn_at: string | null;
  archived_at: string | null;
}

function rowToThread(r: ThreadRow): IntelligenceThread {
  return {
    id: r.id,
    userId: r.user_id,
    clientId: r.client_id,
    conversationId: r.conversation_id,
    title: r.title,
    state: r.state,
    attachedEngagementId: r.attached_engagement_id,
    createdAt: r.created_at,
    lastTurnAt: r.last_turn_at,
    archivedAt: r.archived_at,
  };
}

export async function createThread(ctx: TenancyCtx, input: { title?: string; conversationId?: string }): Promise<IntelligenceThread> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_threads')
    .insert({
      user_id: ctx.userId,
      client_id: ctx.clientId,
      conversation_id: input.conversationId ?? null,
      title: input.title ?? null,
      state: 'A',
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToThread(data as ThreadRow);
}

export async function getThread(ctx: TenancyCtx, threadId: string): Promise<IntelligenceThread | null> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_threads')
    .select('*')
    .eq('id', threadId)
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToThread(data as ThreadRow) : null;
}

export async function listThreads(ctx: TenancyCtx, limit = 20): Promise<IntelligenceThread[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_threads')
    .select('*')
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId)
    .is('archived_at', null)
    .order('last_turn_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data as ThreadRow[] | null ?? []).map(rowToThread);
}

export async function updateThreadState(ctx: TenancyCtx, threadId: string, state: ThreadState): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('intelligence_threads')
    .update({ state })
    .eq('id', threadId)
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId);
  if (error) throw error;
}

export async function touchThread(ctx: TenancyCtx, threadId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('intelligence_threads')
    .update({ last_turn_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('client_id', ctx.clientId);
  if (error) throw error;
}

export async function attachThreadToEngagement(ctx: TenancyCtx, threadId: string, engagementId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('intelligence_threads')
    .update({ attached_engagement_id: engagementId })
    .eq('id', threadId)
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId);
  if (error) throw error;
}

export async function archiveThread(ctx: TenancyCtx, threadId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('intelligence_threads')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId);
  if (error) throw error;
}

export async function countTurns(threadId: string): Promise<number> {
  const sb = getIntelSupabase();
  const { count, error } = await sb
    .from('intelligence_thread_turns')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId);
  if (error) throw error;
  return count ?? 0;
}
