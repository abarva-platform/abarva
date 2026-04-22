// intelligence_artifacts CRUD · ephemeral-by-default with expiry and
// one-way promotion to deliverables_v2 (per spec §4.5).

import { assertTenancy, getIntelSupabase } from './client';
import type { ArtifactKind, IntelligenceArtifact, TenancyCtx } from '../types';

const EPHEMERAL_GRACE_HOURS = 24;

interface ArtifactRow {
  id: string;
  thread_id: string | null;
  turn_id: string | null;
  user_id: string;
  client_id: string;
  kind: ArtifactKind;
  title: string;
  html_content: string;
  metadata_jsonb: Record<string, unknown> | null;
  governance_state: 'ephemeral' | 'persistent';
  session_id: string | null;
  promoted_to_deliverable_id: string | null;
  promoted_at: string | null;
  expires_at: string | null;
  created_at: string;
}

function rowToArtifact(r: ArtifactRow): IntelligenceArtifact {
  return {
    id: r.id,
    threadId: r.thread_id,
    turnId: r.turn_id,
    userId: r.user_id,
    clientId: r.client_id,
    kind: r.kind,
    title: r.title,
    htmlContent: r.html_content,
    metadata: r.metadata_jsonb ?? {},
    governanceState: r.governance_state,
    sessionId: r.session_id,
    promotedToDeliverableId: r.promoted_to_deliverable_id,
    promotedAt: r.promoted_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

export async function createArtifact(
  ctx: TenancyCtx,
  input: {
    threadId?: string | null;
    turnId?: string | null;
    kind: ArtifactKind;
    title: string;
    htmlContent: string;
    metadata?: Record<string, unknown>;
    sessionId?: string | null;
  },
): Promise<IntelligenceArtifact> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const expiresAt = new Date(Date.now() + EPHEMERAL_GRACE_HOURS * 3_600_000).toISOString();
  const { data, error } = await sb
    .from('intelligence_artifacts')
    .insert({
      thread_id: input.threadId ?? null,
      turn_id: input.turnId ?? null,
      user_id: ctx.userId,
      client_id: ctx.clientId,
      kind: input.kind,
      title: input.title,
      html_content: input.htmlContent,
      metadata_jsonb: input.metadata ?? {},
      governance_state: 'ephemeral',
      session_id: input.sessionId ?? null,
      expires_at: expiresAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToArtifact(data as ArtifactRow);
}

export async function getArtifact(ctx: TenancyCtx, artifactId: string): Promise<IntelligenceArtifact | null> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_artifacts')
    .select('*')
    .eq('id', artifactId)
    .eq('client_id', ctx.clientId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToArtifact(data as ArtifactRow) : null;
}

export async function listArtifacts(ctx: TenancyCtx, opts: { threadId?: string } = {}): Promise<IntelligenceArtifact[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  let q = sb
    .from('intelligence_artifacts')
    .select('*')
    .eq('client_id', ctx.clientId)
    .eq('user_id', ctx.userId);
  if (opts.threadId) q = q.eq('thread_id', opts.threadId);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data as ArtifactRow[] | null ?? []).map(rowToArtifact);
}

/**
 * Promote an ephemeral artifact to a persistent deliverable. One-way per
 * spec §4.5 — no reverse, no re-promote. Caller must have already
 * created the deliverables_v2 row via the deliverable module.
 */
export async function promoteArtifact(
  ctx: TenancyCtx,
  artifactId: string,
  deliverableV2Id: string,
): Promise<IntelligenceArtifact> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_artifacts')
    .update({
      governance_state: 'persistent',
      promoted_to_deliverable_id: deliverableV2Id,
      promoted_at: new Date().toISOString(),
      expires_at: null,
    })
    .eq('id', artifactId)
    .eq('client_id', ctx.clientId)
    .eq('governance_state', 'ephemeral')
    .select('*')
    .single();
  if (error) throw error;
  return rowToArtifact(data as ArtifactRow);
}

/** Purge any ephemeral artifacts whose expires_at is in the past. */
export async function purgeExpiredArtifacts(): Promise<number> {
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('intelligence_artifacts')
    .delete({ count: 'exact' })
    .eq('governance_state', 'ephemeral')
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (error) throw error;
  return (data ?? []).length;
}
