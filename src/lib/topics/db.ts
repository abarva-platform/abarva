import { getServerSupabase } from '@/lib/supabase-server';

export interface TopicRow {
  id: string;
  topic_key: string;
  title: string;
  tagline: string | null;
  industries: string[];
  typical_triggers: Array<{ phrase: string; confidence?: string }>;
  key_patterns: string[];
  vendor_landscape: Record<string, string[]>;
  diagnostic_questions: Array<{ id: string; question: string; phase: number }>;
  common_contradictions: string[];
  phase_playbook: Record<string, string>;
  typical_deliverables: string[];
  success_signals: string[];
  failure_modes: string[];
  maturity_version: number;
  source_attribution: string | null;
}

export interface EngagementTopicRow {
  id: string;
  engagement_id: string;
  topic_id: string;
  assigned_at: string;
  assigned_by_person_id: string | null;
  progress: Record<string, boolean>;
  notes: string | null;
}

export async function listAllTopics(): Promise<TopicRow[]> {
  const { data, error } = await getServerSupabase()
    .from('topics')
    .select('*')
    .order('title', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TopicRow[];
}

export async function listEngagementTopics(engagementId: string): Promise<EngagementTopicRow[]> {
  const { data, error } = await getServerSupabase()
    .from('engagement_topics')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EngagementTopicRow[];
}

export async function assignTopic(args: {
  engagementId: string;
  topicId: string;
  assignedBy: string | null;
}): Promise<void> {
  const { error } = await getServerSupabase()
    .from('engagement_topics')
    .insert({
      engagement_id: args.engagementId,
      topic_id: args.topicId,
      assigned_by_person_id: args.assignedBy,
      progress: {},
    });
  if (error && !/duplicate key/i.test(error.message)) throw error;
}

export async function unassignTopic(engagementTopicId: string): Promise<void> {
  const { error } = await getServerSupabase()
    .from('engagement_topics')
    .delete()
    .eq('id', engagementTopicId);
  if (error) throw error;
}

export async function toggleQuestionDone(args: {
  engagementTopicId: string;
  questionId: string;
  done: boolean;
}): Promise<void> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagement_topics')
    .select('progress')
    .eq('id', args.engagementTopicId)
    .maybeSingle();
  const progress = ((data?.progress as Record<string, boolean> | null) ?? {});
  progress[args.questionId] = args.done;
  const { error } = await sb
    .from('engagement_topics')
    .update({ progress })
    .eq('id', args.engagementTopicId);
  if (error) throw error;
}
