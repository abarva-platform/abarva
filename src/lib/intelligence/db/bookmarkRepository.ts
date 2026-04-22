// user_bookmarks + user_pinned_signals · L4 personalization.

import { assertTenancy, getIntelSupabase } from './client';
import type { PortfolioSignal, TenancyCtx, UserBookmark } from '../types';

interface BookmarkRow {
  id: string;
  user_id: string;
  client_id: string;
  bookmark_type: UserBookmark['bookmarkType'];
  target_id: string;
  target_kind: string | null;
  note: string | null;
  metadata_jsonb: Record<string, unknown> | null;
  created_at: string;
}

function rowToBookmark(r: BookmarkRow): UserBookmark {
  return {
    id: r.id,
    userId: r.user_id,
    clientId: r.client_id,
    bookmarkType: r.bookmark_type,
    targetId: r.target_id,
    targetKind: r.target_kind,
    note: r.note,
    metadata: r.metadata_jsonb ?? {},
    createdAt: r.created_at,
  };
}

export async function addBookmark(
  ctx: TenancyCtx,
  input: {
    bookmarkType: UserBookmark['bookmarkType'];
    targetId: string;
    targetKind?: string;
    note?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<UserBookmark> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('user_bookmarks')
    .upsert(
      {
        user_id: ctx.userId,
        client_id: ctx.clientId,
        bookmark_type: input.bookmarkType,
        target_id: input.targetId,
        target_kind: input.targetKind ?? null,
        note: input.note ?? null,
        metadata_jsonb: input.metadata ?? {},
      },
      { onConflict: 'user_id,bookmark_type,target_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return rowToBookmark(data as BookmarkRow);
}

export async function removeBookmark(ctx: TenancyCtx, bookmarkType: UserBookmark['bookmarkType'], targetId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('user_bookmarks')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('bookmark_type', bookmarkType)
    .eq('target_id', targetId);
  if (error) throw error;
}

export async function listBookmarks(ctx: TenancyCtx, limit = 50): Promise<UserBookmark[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('client_id', ctx.clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as BookmarkRow[] | null ?? []).map(rowToBookmark);
}

export async function pinSignal(ctx: TenancyCtx, signalId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('user_pinned_signals')
    .upsert({ user_id: ctx.userId, signal_id: signalId }, { onConflict: 'user_id,signal_id' });
  if (error) throw error;
}

export async function unpinSignal(ctx: TenancyCtx, signalId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('user_pinned_signals')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('signal_id', signalId);
  if (error) throw error;
}

export async function listPinnedSignals(ctx: TenancyCtx): Promise<PortfolioSignal[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('user_pinned_signals')
    .select('portfolio_signals!inner(*)')
    .eq('user_id', ctx.userId)
    .eq('portfolio_signals.client_id', ctx.clientId);
  if (error) throw error;
  // Supabase returns joined tables as arrays when the relationship isn't 1:1;
  // we defined a simple FK so it's usually a single object, but handle both.
  type PinnedRow = { portfolio_signals: Record<string, unknown> | Record<string, unknown>[] };
  const rows = (data as unknown as PinnedRow[] | null) ?? [];
  return rows.map((r) => {
    const raw = r.portfolio_signals;
    const s = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>;
    return {
      id: s.id as string,
      clientId: s.client_id as string,
      category: s.category as PortfolioSignal['category'],
      severity: s.severity as PortfolioSignal['severity'],
      headline: s.headline as string,
      context: (s.context_jsonb as Record<string, unknown>) ?? {},
      sourceContradictionId: (s.source_contradiction_id as string | null) ?? null,
      affectedEngagementIds: (s.affected_engagement_ids as string[] | null) ?? [],
      sponsorNotified: Boolean(s.sponsor_notified),
      firedAt: s.fired_at as string,
      resolvedAt: (s.resolved_at as string | null) ?? null,
      dismissedAt: (s.dismissed_at as string | null) ?? null,
      dismissedByUserId: (s.dismissed_by_user_id as string | null) ?? null,
    };
  });
}
