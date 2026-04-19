import { getServerSupabase } from '@/lib/supabase-server';

export interface TurnRow {
  id: string;
  engagement_id: string;
  phase: number;
  sender: 'agent' | 'user';
  text: string;
  mode_label: string | null;
  retrieved_refs: Record<string, unknown>;
  created_at: string;
}

export async function getRecentTurns(engagementId: string, limit = 50): Promise<TurnRow[]> {
  const { data, error } = await getServerSupabase()
    .from('turns')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TurnRow[];
}

export interface AppendTurnArgs {
  engagementId: string;
  phase: number;
  sender: 'agent' | 'user';
  text: string;
  modeLabel?: string | null;
  retrievedRefs?: Record<string, unknown>;
}

export async function appendTurn(args: AppendTurnArgs): Promise<TurnRow> {
  const { data, error } = await getServerSupabase()
    .from('turns')
    .insert({
      engagement_id: args.engagementId,
      phase: args.phase,
      sender: args.sender,
      text: args.text,
      mode_label: args.modeLabel ?? null,
      retrieved_refs: args.retrievedRefs ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data as TurnRow;
}
