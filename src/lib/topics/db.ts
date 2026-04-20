import { getServerSupabase } from '@/lib/supabase-server';

// Schema aligns with Pack L spec · engagement_topics is the catalog,
// engagement_topics_map is the join with composite PK (engagement_id, topic_key).

export interface DiagnosticQuestion {
  id?: string;
  question: string;
  probe_depth?: number;
  tags?: string[];
  phase?: number;
}

export interface TypicalTrigger {
  phrase?: string;
  description?: string;
  confidence?: string;
}

export interface VendorEntry {
  name: string;
  role?: string;
  typical_spend_range_monthly?: [number, number];
  consolidation_play?: string;
  typical?: string;
}

export interface TopicRow {
  id: string;
  topic_key: string;
  title: string;
  tagline: string | null;
  industries: string[];
  typical_triggers: TypicalTrigger[] | string[];
  key_patterns: string[];
  vendor_landscape: Record<string, VendorEntry[] | string[]>;
  diagnostic_questions: DiagnosticQuestion[];
  common_contradictions: Array<{ type?: string; description: string } | string>;
  phase_playbook: Record<string, { priorities?: string[]; deliverable?: string } | string>;
  typical_deliverables: string[];
  success_signals: string[];
  failure_modes: string[];
  maturity_version: number;
  source_attribution: string | null;
}

export interface EngagementTopicMapRow {
  engagement_id: string;
  topic_key: string;
  is_primary: boolean;
  added_at: string;
  added_by_person_id: string | null;
  progress: Record<string, boolean>;
  notes: string | null;
}

export interface TopicRecommendation {
  topic: TopicRow;
  score: number;
  reasons: string[];
}

export function recommendTopics(args: {
  industryCode: string | null;
  objectiveCode?: string | null;
  functionCode?: string | null;
  engagementName?: string | null;
  candidates: TopicRow[];
}): TopicRecommendation[] {
  const industryCode = args.industryCode ?? '';
  const objectiveCode = (args.objectiveCode ?? '').toLowerCase();
  const functionCode = (args.functionCode ?? '').toLowerCase();
  const nameLower = (args.engagementName ?? '').toLowerCase();

  const scored: TopicRecommendation[] = args.candidates.map((t) => {
    let score = 0;
    const reasons: string[] = [];

    if (industryCode && t.industries.includes(industryCode)) {
      score += 40;
      reasons.push(`industry match · ${industryCode}`);
    } else if (t.industries.includes('GENERAL')) {
      score += 10;
      reasons.push('applies broadly');
    }

    if (t.maturity_version >= 2) {
      score += 15;
      reasons.push('spec-canonical');
    } else {
      score += 5;
    }

    // Objective + function + name scan against topic_key, title, tagline,
    // trigger phrases. Cheap bag-of-words overlap.
    const topicWords = new Set<string>();
    for (const source of [t.topic_key, t.title, t.tagline ?? '']) {
      for (const w of source.toLowerCase().split(/\W+/)) {
        if (w.length >= 4) topicWords.add(w);
      }
    }
    for (const trig of t.typical_triggers) {
      const s = typeof trig === 'string'
        ? trig
        : ('phrase' in trig && typeof (trig as { phrase?: string }).phrase === 'string' ? (trig as { phrase: string }).phrase : ((trig as { description?: string }).description ?? ''));
      for (const w of s.toLowerCase().split(/\W+/)) {
        if (w.length >= 4) topicWords.add(w);
      }
    }

    const engagementWords = new Set([...objectiveCode.split(/\W+/), ...functionCode.split(/\W+/), ...nameLower.split(/\W+/)].filter((w) => w.length >= 4));
    let overlap = 0;
    for (const w of engagementWords) if (topicWords.has(w)) overlap += 1;
    if (overlap > 0) {
      score += Math.min(30, overlap * 10);
      reasons.push(`${overlap} word match${overlap === 1 ? '' : 'es'} w/ engagement`);
    }

    return { topic: t, score, reasons };
  });

  return scored
    .filter((r) => r.score >= 30) // below this, not confident enough to recommend
    .sort((a, b) => b.score - a.score);
}

export async function listAllTopics(): Promise<TopicRow[]> {
  const { data, error } = await getServerSupabase()
    .from('engagement_topics')
    .select('*')
    .order('title', { ascending: true });
  if (error) {
    // Soft-fail: migration 040 may not yet be applied. Callers should
    // treat empty list as "no topic catalog available".
    console.warn('[topics.listAllTopics]', error.message);
    return [];
  }
  return (data ?? []) as TopicRow[];
}

export async function listEngagementTopics(engagementId: string): Promise<EngagementTopicMapRow[]> {
  const { data, error } = await getServerSupabase()
    .from('engagement_topics_map')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('added_at', { ascending: false });
  if (error) {
    console.warn('[topics.listEngagementTopics]', error.message);
    return [];
  }
  return (data ?? []) as EngagementTopicMapRow[];
}

export async function assignTopic(args: {
  engagementId: string;
  topicKey: string;
  assignedBy: string | null;
  isPrimary?: boolean;
}): Promise<void> {
  const { error } = await getServerSupabase()
    .from('engagement_topics_map')
    .insert({
      engagement_id: args.engagementId,
      topic_key: args.topicKey,
      is_primary: args.isPrimary ?? false,
      added_by_person_id: args.assignedBy,
      progress: {},
    });
  if (error && !/duplicate key/i.test(error.message)) throw error;
}

export async function unassignTopic(args: {
  engagementId: string;
  topicKey: string;
}): Promise<void> {
  const { error } = await getServerSupabase()
    .from('engagement_topics_map')
    .delete()
    .eq('engagement_id', args.engagementId)
    .eq('topic_key', args.topicKey);
  if (error) throw error;
}

export async function setTopicPrimary(args: {
  engagementId: string;
  topicKey: string;
  isPrimary: boolean;
}): Promise<void> {
  const sb = getServerSupabase();
  if (args.isPrimary) {
    // Spec models engagement_topics_map.is_primary as nullable — one engagement
    // can have many primaries, but a clear single primary is the typical case.
    // Clear existing primaries before setting new one so the UI stays clean.
    const { error: clearErr } = await sb
      .from('engagement_topics_map')
      .update({ is_primary: false })
      .eq('engagement_id', args.engagementId)
      .eq('is_primary', true);
    if (clearErr) throw clearErr;
  }
  const { error } = await sb
    .from('engagement_topics_map')
    .update({ is_primary: args.isPrimary })
    .eq('engagement_id', args.engagementId)
    .eq('topic_key', args.topicKey);
  if (error) throw error;
}

export async function toggleQuestionDone(args: {
  engagementId: string;
  topicKey: string;
  questionId: string;
  done: boolean;
}): Promise<void> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagement_topics_map')
    .select('progress')
    .eq('engagement_id', args.engagementId)
    .eq('topic_key', args.topicKey)
    .maybeSingle();
  const progress = ((data?.progress as Record<string, boolean> | null) ?? {});
  progress[args.questionId] = args.done;
  const { error } = await sb
    .from('engagement_topics_map')
    .update({ progress })
    .eq('engagement_id', args.engagementId)
    .eq('topic_key', args.topicKey);
  if (error) throw error;
}
