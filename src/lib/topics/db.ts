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

export async function listAllTopics(): Promise<TopicRow[]> {
  const { data, error } = await getServerSupabase()
    .from('engagement_topics')
    .select('*')
    .order('title', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TopicRow[];
}

export async function listEngagementTopics(engagementId: string): Promise<EngagementTopicMapRow[]> {
  const { data, error } = await getServerSupabase()
    .from('engagement_topics_map')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('added_at', { ascending: false });
  if (error) throw error;
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
