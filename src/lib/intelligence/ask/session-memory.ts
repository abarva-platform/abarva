import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';

const RECENT_TURN_LIMIT = 10;
const MAX_CONTEXT_CHARS = 8_000;
const MAX_TURN_CHARS = 1_200;
const MAX_SUMMARY_CHARS = 2_000;

export interface AskSessionMemory {
  sessionId: string;
  tabId: string;
  contextBlock: string;
  priorTurnCount: number;
  summary: string | null;
}

export interface AskSessionTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

interface AskSessionRow {
  id: string;
  summary: string | null;
}

interface AskTurnRow {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

function cleanText(value: string, max = MAX_TURN_CHARS): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function titleFromQuery(query: string): string {
  const title = cleanText(query, 80);
  return title.length > 0 ? title : 'Intelligence Ask session';
}

function stableFallbackTabId(userId: string, tenantId: string): string {
  return `server-${tenantId.slice(0, 8)}-${userId.slice(0, 16)}`;
}

export function normalizeAskTabId(value: string | null | undefined, userId: string, tenantId: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (/^[a-zA-Z0-9._:-]{8,120}$/.test(trimmed)) return trimmed;
  return stableFallbackTabId(userId, tenantId);
}

function summarizeTurns(turns: AskTurnRow[]): string {
  const lines = turns
    .filter((turn) => turn.role === 'user' || turn.role === 'assistant')
    .slice(-16)
    .map((turn) => `${turn.role}: ${cleanText(turn.content, 220)}`);
  return lines.join('\n').slice(0, MAX_SUMMARY_CHARS);
}

function formatConversationContext(summary: string | null, turns: AskTurnRow[]): string {
  const parts: string[] = ['INTELLIGENCE ASK SESSION MEMORY:'];
  if (summary?.trim()) {
    parts.push('Older-turn summary:', summary.trim());
  }
  if (turns.length > 0) {
    parts.push(
      'Recent turns:',
      ...turns.map((turn) => {
        const created = turn.created_at ? ` @ ${turn.created_at}` : '';
        return `${turn.role}${created}: ${cleanText(turn.content)}`;
      }),
    );
  }
  parts.push(
    'Use this memory to resolve follow-ups and pronouns. If the latest user query says "this Move", resolve it against the originating Intelligence session when one is present.',
  );
  return parts.join('\n').slice(0, MAX_CONTEXT_CHARS);
}

async function readSessionTurns(sessionId: string): Promise<AskTurnRow[]> {
  const { data, error } = await getServerSupabase()
    .from('intelligence_ask_turns')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as AskTurnRow[];
}

async function maybeRefreshSummary(sessionId: string): Promise<string | null> {
  const turns = await readSessionTurns(sessionId);
  if (turns.length <= RECENT_TURN_LIMIT) return null;
  const older = turns.slice(0, Math.max(0, turns.length - RECENT_TURN_LIMIT));
  const summary = summarizeTurns(older);
  if (!summary) return null;
  await getServerSupabase()
    .from('intelligence_ask_sessions')
    .update({ summary, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  return summary;
}

export async function prepareAskSessionMemory(input: {
  tenantId: string | null;
  userId: string | null;
  tabId: string | null;
  query: string;
}): Promise<AskSessionMemory | null> {
  if (!input.tenantId || !input.userId) return null;
  const tabId = normalizeAskTabId(input.tabId, input.userId, input.tenantId);
  const now = new Date().toISOString();
  const row = {
    tenant_id: input.tenantId,
    user_id: input.userId,
    tab_id: tabId,
    title: titleFromQuery(input.query),
    updated_at: now,
    last_turn_at: now,
  };
  const { data, error } = await getServerSupabase()
    .from('intelligence_ask_sessions')
    .upsert(row, { onConflict: 'tenant_id,user_id,tab_id' })
    .select('id, summary')
    .single();
  if (error || !data) return null;

  const session = data as AskSessionRow;
  const allTurns = await readSessionTurns(session.id);
  const summary = allTurns.length > RECENT_TURN_LIMIT
    ? session.summary ?? summarizeTurns(allTurns.slice(0, allTurns.length - RECENT_TURN_LIMIT))
    : session.summary;
  const recentTurns = allTurns.slice(-RECENT_TURN_LIMIT);

  return {
    sessionId: session.id,
    tabId,
    contextBlock: allTurns.length > 0 || summary ? formatConversationContext(summary, recentTurns) : '',
    priorTurnCount: allTurns.length,
    summary: summary ?? null,
  };
}

export async function appendAskSessionTurn(input: {
  sessionId: string | null | undefined;
  tenantId: string | null;
  userId: string | null;
  role: AskSessionTurn['role'];
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const content = input.content.trim();
  if (!input.sessionId || !input.tenantId || !input.userId || !content) return;
  const now = new Date().toISOString();
  await getServerSupabase()
    .from('intelligence_ask_turns')
    .insert({
      session_id: input.sessionId,
      tenant_id: input.tenantId,
      user_id: input.userId,
      role: input.role,
      content,
      metadata_jsonb: input.metadata ?? {},
      created_at: now,
    });
  await getServerSupabase()
    .from('intelligence_ask_sessions')
    .update({ updated_at: now, last_turn_at: now })
    .eq('id', input.sessionId);
  await maybeRefreshSummary(input.sessionId).catch(() => null);
}

export async function linkAskSessionToMove(input: {
  sessionId: string | null | undefined;
  tenantId: string;
  moveId: string;
}): Promise<void> {
  if (!input.sessionId) return;
  const now = new Date().toISOString();
  await getServerSupabase()
    .from('intelligence_ask_sessions')
    .update({ linked_move_id: input.moveId, updated_at: now })
    .eq('id', input.sessionId)
    .eq('tenant_id', input.tenantId);
  await getServerSupabase()
    .from('move_instances')
    .update({ originating_intelligence_session_id: input.sessionId, updated_at: now })
    .eq('client_id', input.tenantId)
    .eq('engagement_id', input.moveId);
}

export async function getAskSessionForMove(input: {
  tenantId: string;
  moveId: string;
}): Promise<{ sessionId: string; contextBlock: string } | null> {
  const { data: direct } = await getServerSupabase()
    .from('intelligence_ask_sessions')
    .select('id, summary')
    .eq('tenant_id', input.tenantId)
    .eq('linked_move_id', input.moveId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let session = direct as AskSessionRow | null;
  if (!session) {
    const { data: instance } = await getServerSupabase()
      .from('move_instances')
      .select('originating_intelligence_session_id')
      .eq('client_id', input.tenantId)
      .eq('engagement_id', input.moveId)
      .not('originating_intelligence_session_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sessionId = (instance as { originating_intelligence_session_id?: string } | null)?.originating_intelligence_session_id;
    if (sessionId) {
      const { data } = await getServerSupabase()
        .from('intelligence_ask_sessions')
        .select('id, summary')
        .eq('tenant_id', input.tenantId)
        .eq('id', sessionId)
        .maybeSingle();
      session = data as AskSessionRow | null;
    }
  }

  if (!session) return null;
  const turns = (await readSessionTurns(session.id)).slice(-RECENT_TURN_LIMIT);
  return {
    sessionId: session.id,
    contextBlock: formatConversationContext(session.summary, turns),
  };
}

export async function getAskSessionContextById(input: {
  tenantId: string;
  sessionId: string;
}): Promise<{ sessionId: string; contextBlock: string } | null> {
  const { data } = await getServerSupabase()
    .from('intelligence_ask_sessions')
    .select('id, summary')
    .eq('tenant_id', input.tenantId)
    .eq('id', input.sessionId)
    .maybeSingle();
  const session = data as AskSessionRow | null;
  if (!session) return null;
  const turns = (await readSessionTurns(session.id)).slice(-RECENT_TURN_LIMIT);
  return {
    sessionId: session.id,
    contextBlock: formatConversationContext(session.summary, turns),
  };
}
