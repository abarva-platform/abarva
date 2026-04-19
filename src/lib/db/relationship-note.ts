import { getServerSupabase } from '@/lib/supabase-server';

export interface RelationshipNoteRow {
  id: string;
  person_id: string;
  category: string;
  note_text: string;
  source_turn_id: string | null;
  source_engagement_id: string | null;
  decay_at: string | null;
  surfaced_count: number;
  captured_at: string;
}

export interface AppendNoteArgs {
  personId: string;
  category: string;
  noteText: string;
  sourceTurnId?: string | null;
  sourceEngagementId?: string | null;
  decayDays: number;
}

export async function appendRelationshipNote(args: AppendNoteArgs): Promise<RelationshipNoteRow> {
  const decayAt = new Date(Date.now() + args.decayDays * 86_400_000).toISOString();
  const { data, error } = await getServerSupabase()
    .from('relationship_notes')
    .insert({
      person_id: args.personId,
      category: args.category,
      note_text: args.noteText,
      source_turn_id: args.sourceTurnId ?? null,
      source_engagement_id: args.sourceEngagementId ?? null,
      decay_at: decayAt,
      surfaced_count: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as RelationshipNoteRow;
}

export async function getActivePersonalThreads(personId: string, limit = 8): Promise<string[]> {
  const { data, error } = await getServerSupabase()
    .from('relationship_notes')
    .select('note_text')
    .eq('person_id', personId)
    .gt('decay_at', new Date().toISOString())
    .in('category', ['personal', 'preference'])
    .order('captured_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as Array<{ note_text: string }>).map((r) => r.note_text);
}

// Increment surfaced_count for a set of note texts for a given person.
// Simpler than an RPC — fetch matching rows, bump each individually.
export async function markThreadsSurfaced(personId: string, noteTexts: string[]): Promise<void> {
  if (noteTexts.length === 0) return;
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('relationship_notes')
    .select('id, surfaced_count, note_text')
    .eq('person_id', personId)
    .in('note_text', noteTexts);
  if (error || !data) return;
  for (const row of data as Array<{ id: string; surfaced_count: number | null }>) {
    await sb
      .from('relationship_notes')
      .update({ surfaced_count: (row.surfaced_count ?? 0) + 1 })
      .eq('id', row.id);
  }
}
