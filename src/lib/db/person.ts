import { getServerSupabase } from '@/lib/supabase-server';

export interface PersonRow {
  id: string;
  graph_node_id: string | null;
  name: string;
  email: string | null;
  role: string | null;
  organization: string | null;
  familiarity: 'first_meeting' | 'returning_recent' | 'returning_dormant' | 'frequent_collaborator';
  communication_style: Record<string, unknown>;
  working_rhythm: Record<string, unknown>;
  personal_threads: string[];
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

export async function getPersonById(id: string): Promise<PersonRow | null> {
  const { data, error } = await getServerSupabase().from('persons').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PersonRow | null;
}
