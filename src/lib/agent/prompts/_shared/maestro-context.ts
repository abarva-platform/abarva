import { getServerSupabase } from '@/lib/supabase-server';

// Assembles a plain-text MAESTRO CONTEXT block pulling:
// - persons.maestro_profile (JSONB) — structured evolving profile
// - last 5 relationship_notes where subject_type='maestro'
// Returns '' if no profile yet — callers should filter falsy.
export async function assembleMaestroContextBlock(args: {
  personId: string;
  personName: string;
}): Promise<string> {
  const sb = getServerSupabase();

  const { data: person } = await sb
    .from('persons')
    .select('name, maestro_profile')
    .eq('id', args.personId)
    .maybeSingle();
  if (!person) return '';

  type Profile = {
    background?: string;
    domain_depth?: string[];
    communication_style?: string;
    preferences?: string[];
    recent_patterns?: Array<{ pattern: string; seen_in_engagements: number }>;
    engagements_run?: number;
    industries_touched?: string[];
  };
  const profile = ((person as { maestro_profile?: Profile | null }).maestro_profile ?? {}) as Profile;

  const { data: notesRows } = await sb
    .from('relationship_notes')
    .select('note_text, created_at')
    .eq('person_id', args.personId)
    .eq('subject_type', 'maestro')
    .order('created_at', { ascending: false })
    .limit(5);
  const notes = ((notesRows as Array<{ note_text: string }> | null) ?? []).map((n) => n.note_text);

  const hasAnySignal =
    profile.background ||
    profile.communication_style ||
    profile.engagements_run ||
    (profile.domain_depth && profile.domain_depth.length > 0) ||
    (profile.recent_patterns && profile.recent_patterns.length > 0) ||
    notes.length > 0;

  if (!hasAnySignal) return '';

  const lines: string[] = [];
  lines.push(`MAESTRO CONTEXT (you're working with ${(person as { name: string }).name} today)`);
  if (profile.background) lines.push(`- Background: ${profile.background}`);
  if (profile.domain_depth?.length) lines.push(`- Domain depth: ${profile.domain_depth.join(', ')}`);
  if (profile.communication_style) lines.push(`- Style: ${profile.communication_style}`);
  if (profile.preferences?.length) lines.push(`- Preferences: ${profile.preferences.join('; ')}`);
  if (profile.engagements_run) {
    lines.push(
      `- Engagements run together: ${profile.engagements_run}${
        profile.industries_touched?.length ? ` across ${profile.industries_touched.join(', ')}` : ''
      }`,
    );
  }
  if (profile.recent_patterns?.length) {
    const top = [...profile.recent_patterns]
      .sort((a, b) => b.seen_in_engagements - a.seen_in_engagements)
      .slice(0, 3);
    lines.push(
      `- Patterns you've noticed: ${top.map((p) => `${p.pattern} (${p.seen_in_engagements}x)`).join('; ')}`,
    );
  }
  if (notes.length > 0) {
    lines.push(`- Recent notes: ${notes.join(' | ')}`);
  }
  lines.push('');
  lines.push('Use this context naturally. Reference shared history when relevant. Do not list these facts back at them.');

  return lines.join('\n');
}
