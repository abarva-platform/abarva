import { azureRead } from '@/lib/data-plane/azureRead';

// Assembles a plain-text USER CONTEXT block pulling:
// - persons.maestro_profile (JSONB) — structured evolving profile
// - last 5 relationship_notes where subject_type='user'
// Returns '' if no profile yet — callers should filter falsy.
// (Pack F Part 2 · subject_type value renamed 'maestro' → 'user' in
//  migration 025. Column name persons.maestro_profile kept for now to
//  avoid a deploy-window breakage; full column rename deferred.)
export async function assembleMaestroContextBlock(args: {
  personId: string;
  personName: string;
}): Promise<string> {
  const person = await azureRead.maybeSingle<{ name: string; maestro_profile: Profile | null }>({
    table: 'persons',
    columns: ['name', 'maestro_profile'],
    where: { id: args.personId },
  }).catch(() => null);
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
  const profile = person.maestro_profile ?? {};

  const notesRows = await azureRead.select<{ note_text: string }>({
    table: 'relationship_notes',
    columns: ['note_text', 'created_at'],
    where: {
      person_id: args.personId,
      subject_type: 'user',
    },
    orderBy: { column: 'created_at', direction: 'desc' },
    limit: 5,
    missingTable: 'empty',
  }).catch(() => []);
  const notes = notesRows.map((n) => n.note_text);

  const hasAnySignal =
    profile.background ||
    profile.communication_style ||
    profile.engagements_run ||
    (profile.domain_depth && profile.domain_depth.length > 0) ||
    (profile.recent_patterns && profile.recent_patterns.length > 0) ||
    notes.length > 0;

  if (!hasAnySignal) return '';

  const lines: string[] = [];
  lines.push(`USER CONTEXT (you're working with ${person.name} today)`);
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
