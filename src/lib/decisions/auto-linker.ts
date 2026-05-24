import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import { getEvidenceProofPointCount } from '@/lib/evidence/ledger';
import type { GeneratedArtifactType } from '@/lib/artifacts/types';

export type DecisionSurface = 'intelligence' | 'moves' | 'source' | 'tower' | 'watchlist' | 'artifact';
export type DecisionThreadStatus = 'open' | 'in_flight' | 'decided' | 'closed' | 'archived';

export interface DecisionThreadRow {
  id: string;
  client_id: string;
  thread_slug: string;
  title: string;
  originating_intelligence_session: string | null;
  primary_owner_role: string;
  status: DecisionThreadStatus;
  created_at: string;
  last_activity_at: string;
}

export interface DecisionThreadLinkRow {
  id: string;
  thread_id: string;
  surface: DecisionSurface;
  artifact_ref: string;
  linked_at: string;
  linked_by: string;
  link_reason: string | null;
}

export interface DecisionThreadDossier {
  thread: DecisionThreadRow;
  links: DecisionThreadLinkRow[];
  proofPointCounts: Record<string, number>;
}

interface EnsureDecisionThreadInput {
  clientId: string;
  title: string;
  primaryOwnerRole: string;
  status?: DecisionThreadStatus;
  originatingIntelligenceSession?: string | null;
}

interface LinkDecisionArtifactInput {
  threadId: string;
  surface: DecisionSurface;
  artifactRef: string;
  linkedBy: string;
  linkReason?: string | null;
}

interface LinkMoveInput {
  clientId: string;
  moveId: string;
  title: string;
  ownerRole?: string | null;
  intelligenceSessionId?: string | null;
  linkedBy?: string;
}

interface LinkSourceInput {
  clientId: string;
  sourceEventId: string;
  title: string;
  ownerRole?: string | null;
  linkedProgramId?: string | null;
  linkedBy?: string;
}

interface LinkTowerInput {
  clientId: string;
  artifactRef: string;
  title: string;
  ownerRole?: string | null;
  linkedMoveId?: string | null;
  linkedSourceEventId?: string | null;
  linkedBy?: string;
}

interface LinkGeneratedArtifactInput {
  clientId: string;
  generatedArtifactId: string;
  sourceArtifactRef: string;
  artifactType: GeneratedArtifactType;
  title: string;
  linkedBy?: string;
}

function normalizeSlugPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export function buildDecisionThreadSlug(clientId: string, title: string): string {
  const client = normalizeSlugPart(clientId) || 'tenant';
  const subject = normalizeSlugPart(title) || 'decision';
  return `${client}-${subject}`;
}

async function touchThread(threadId: string): Promise<void> {
  const { error } = await getServerSupabase()
    .from('decision_threads')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', threadId);
  if (error) throw new Error(`decision thread touch failed: ${error.message}`);
}

export async function ensureDecisionThread(input: EnsureDecisionThreadInput): Promise<DecisionThreadRow> {
  const clientId = input.clientId.trim();
  const slug = buildDecisionThreadSlug(clientId, input.title);
  const status = input.status ?? 'open';
  const row = {
    client_id: clientId,
    thread_slug: slug,
    title: input.title.trim(),
    originating_intelligence_session: input.originatingIntelligenceSession ?? null,
    primary_owner_role: (input.primaryOwnerRole || 'CIO').trim(),
    status,
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await getServerSupabase()
    .from('decision_threads')
    .upsert(row, { onConflict: 'client_id,thread_slug' })
    .select('*')
    .single();

  if (error) throw new Error(`decision thread upsert failed: ${error.message}`);
  return data as DecisionThreadRow;
}

export async function linkDecisionArtifact(input: LinkDecisionArtifactInput): Promise<DecisionThreadLinkRow> {
  const row = {
    thread_id: input.threadId,
    surface: input.surface,
    artifact_ref: input.artifactRef.trim(),
    linked_by: input.linkedBy.trim(),
    link_reason: input.linkReason ?? null,
  };

  const { data, error } = await getServerSupabase()
    .from('decision_thread_links')
    .upsert(row, { onConflict: 'thread_id,surface,artifact_ref' })
    .select('*')
    .single();

  if (error) throw new Error(`decision thread link upsert failed: ${error.message}`);
  await touchThread(input.threadId);
  return data as DecisionThreadLinkRow;
}

export async function getThreadForArtifact(
  surface: DecisionSurface,
  artifactRef: string,
  clientId?: string,
): Promise<DecisionThreadRow | null> {
  const supabase = getServerSupabase();
  const { data: link, error: linkError } = await supabase
    .from('decision_thread_links')
    .select('thread_id')
    .eq('surface', surface)
    .eq('artifact_ref', artifactRef)
    .order('linked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) throw new Error(`decision thread artifact lookup failed: ${linkError.message}`);
  const threadId = (link as { thread_id?: string } | null)?.thread_id;
  if (!threadId) return null;

  let threadQuery = supabase.from('decision_threads').select('*').eq('id', threadId);
  if (clientId) threadQuery = threadQuery.eq('client_id', clientId);
  const { data: thread, error: threadError } = await threadQuery.maybeSingle();
  if (threadError) throw new Error(`decision thread lookup failed: ${threadError.message}`);
  return (thread as DecisionThreadRow | null) ?? null;
}

export async function ensureThreadForMove(input: LinkMoveInput): Promise<DecisionThreadRow> {
  const existing = await getThreadForArtifact('moves', input.moveId, input.clientId);
  if (existing) return existing;
  const thread = await ensureDecisionThread({
    clientId: input.clientId,
    title: input.title,
    primaryOwnerRole: input.ownerRole ?? 'CIO',
    originatingIntelligenceSession: input.intelligenceSessionId ?? null,
  });
  await linkDecisionArtifact({
    threadId: thread.id,
    surface: 'moves',
    artifactRef: input.moveId,
    linkedBy: input.linkedBy ?? 'auto',
    linkReason: 'Move opened inside the unified decision dossier spine',
  });
  if (input.intelligenceSessionId) {
    await linkDecisionArtifact({
      threadId: thread.id,
      surface: 'intelligence',
      artifactRef: input.intelligenceSessionId,
      linkedBy: input.linkedBy ?? 'auto',
      linkReason: 'Move originated from Intelligence Stage 6 CTA',
    });
  }
  return thread;
}

export async function ensureThreadForSourceEvent(input: LinkSourceInput): Promise<DecisionThreadRow> {
  const existing = await getThreadForArtifact('source', input.sourceEventId, input.clientId);
  if (existing) return existing;

  const fromMove = input.linkedProgramId
    ? await getThreadForArtifact('moves', input.linkedProgramId, input.clientId)
    : null;
  const thread = fromMove ?? await ensureDecisionThread({
    clientId: input.clientId,
    title: input.title,
    primaryOwnerRole: input.ownerRole ?? 'CPO',
    status: 'in_flight',
  });

  await linkDecisionArtifact({
    threadId: thread.id,
    surface: 'source',
    artifactRef: input.sourceEventId,
    linkedBy: input.linkedBy ?? 'auto',
    linkReason: input.linkedProgramId
      ? `Source event linked from Move ${input.linkedProgramId}`
      : 'Source event opened inside the unified decision dossier spine',
  });
  return thread;
}

export async function ensureThreadForTower(input: LinkTowerInput): Promise<DecisionThreadRow> {
  const existing = await getThreadForArtifact('tower', input.artifactRef, input.clientId);
  if (existing) return existing;

  const fromMove = input.linkedMoveId
    ? await getThreadForArtifact('moves', input.linkedMoveId, input.clientId)
    : null;
  const fromSource = !fromMove && input.linkedSourceEventId
    ? await getThreadForArtifact('source', input.linkedSourceEventId, input.clientId)
    : null;
  const thread = fromMove ?? fromSource ?? await ensureDecisionThread({
    clientId: input.clientId,
    title: input.title,
    primaryOwnerRole: input.ownerRole ?? 'CIO',
    status: 'in_flight',
  });

  await linkDecisionArtifact({
    threadId: thread.id,
    surface: 'tower',
    artifactRef: input.artifactRef,
    linkedBy: input.linkedBy ?? 'auto',
    linkReason: 'Tower measurement plan linked to decision thread',
  });
  return thread;
}

export async function linkGeneratedArtifactToDecisionThread(input: LinkGeneratedArtifactInput): Promise<DecisionThreadRow> {
  const sourceSurface: DecisionSurface =
    input.artifactType === 'move_board_pack' ? 'moves'
      : input.artifactType === 'source_board_pack' ? 'source'
        : input.artifactType === 'watchlist_review_pack' ? 'watchlist'
          : 'artifact';
  const existing = await getThreadForArtifact(sourceSurface, input.sourceArtifactRef, input.clientId);
  const thread = existing ?? await ensureDecisionThread({
    clientId: input.clientId,
    title: input.title,
    primaryOwnerRole: 'CIO',
    status: 'in_flight',
  });
  await linkDecisionArtifact({
    threadId: thread.id,
    surface: 'artifact',
    artifactRef: input.generatedArtifactId,
    linkedBy: input.linkedBy ?? 'auto',
    linkReason: `Generated ${input.artifactType} attached to decision dossier`,
  });
  return thread;
}

export async function getDecisionThreadDossier(threadId: string): Promise<DecisionThreadDossier | null> {
  const supabase = getServerSupabase();
  const { data: thread, error: threadError } = await supabase
    .from('decision_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle();
  if (threadError) throw new Error(`decision thread load failed: ${threadError.message}`);
  if (!thread) return null;

  const { data: links, error: linkError } = await supabase
    .from('decision_thread_links')
    .select('*')
    .eq('thread_id', threadId)
    .order('linked_at', { ascending: true });
  if (linkError) throw new Error(`decision thread links load failed: ${linkError.message}`);

  const typedLinks = (links ?? []) as DecisionThreadLinkRow[];
  const proofEntries = await Promise.all(
    typedLinks.map(async (link) => {
      try {
        const count = await getEvidenceProofPointCount(link.artifact_ref, (thread as DecisionThreadRow).client_id);
        return [linkKey(link), count.total] as const;
      } catch {
        return [linkKey(link), 0] as const;
      }
    }),
  );

  return {
    thread: thread as DecisionThreadRow,
    links: typedLinks,
    proofPointCounts: Object.fromEntries(proofEntries),
  };
}

export async function listDecisionThreads(clientId?: string): Promise<DecisionThreadDossier[]> {
  let query = getServerSupabase()
    .from('decision_threads')
    .select('*')
    .order('last_activity_at', { ascending: false })
    .limit(50);
  if (clientId) query = query.eq('client_id', clientId);
  const { data, error } = await query;
  if (error) throw new Error(`decision thread list failed: ${error.message}`);

  const threads = (data ?? []) as DecisionThreadRow[];
  const dossiers = await Promise.all(
    threads.map((thread) => getDecisionThreadDossier(thread.id)),
  );
  return dossiers.filter((dossier): dossier is DecisionThreadDossier => Boolean(dossier));
}

export function linkKey(link: Pick<DecisionThreadLinkRow, 'surface' | 'artifact_ref'>): string {
  return `${link.surface}:${link.artifact_ref}`;
}
