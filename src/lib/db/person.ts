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

export interface CreatePersonArgs {
  name: string;
  email?: string | null;
  role: string;
  title?: string;
  organization: string;
  cxo_function?: string;
  primary_focus?: string;
  graph_node_id?: string;
}

export async function getAllPersons(): Promise<PersonRow[]> {
  const { data, error } = await getServerSupabase()
    .from('persons')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PersonRow[];
}

export async function createPerson(args: CreatePersonArgs): Promise<PersonRow> {
  const graphNodeId = args.graph_node_id ?? `person_${args.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
  const communicationStyle = {
    title: args.title,
    cxo_function: args.cxo_function,
    primary_focus: args.primary_focus,
  };
  const { data, error } = await getServerSupabase()
    .from('persons')
    .insert({
      graph_node_id: graphNodeId,
      name: args.name,
      email: args.email ?? null,
      role: args.role,
      organization: args.organization,
      familiarity: 'first_meeting',
      communication_style: communicationStyle,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PersonRow;
}
