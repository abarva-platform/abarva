import { getServerSupabase } from '@/lib/supabase-server';

export interface ExecutiveProfileLookupArgs {
  personId?: string | null;
  displayName?: string | null;
}

interface ExecutiveProfileRow {
  full_name: string;
  preferred_name: string | null;
  current_role_title: string;
  current_company: string;
  communication_style: Record<string, unknown>;
  decision_patterns: Record<string, unknown>;
  known_priorities: Array<Record<string, unknown>>;
  known_constraints: Array<Record<string, unknown>>;
  profile_type: 'real_world' | 'composite_tenant';
  metadata: Record<string, unknown> | null;
}

export interface ExecutiveGreetingData {
  displayName: string;
  firstName: string;
  currentTitle: string;
  currentCompany: string;
  emphasizeTopics: string[];
  currentInitiatives: string[];
}

export async function loadExecutiveProfile(args: ExecutiveProfileLookupArgs): Promise<ExecutiveProfileRow | null> {
  if (!args.personId && !args.displayName) return null;
  const sb = getServerSupabase();
  let row: ExecutiveProfileRow | null = null;

  if (args.personId) {
    const { data, error } = await sb
      .from('executive_profiles')
      .select('full_name, preferred_name, current_role_title, current_company, communication_style, decision_patterns, known_priorities, known_constraints, profile_type, metadata')
      .eq('person_id', args.personId)
      .maybeSingle();
    if (error) console.warn('[executive_profile.person_id]', error.message);
    row = (data as ExecutiveProfileRow | null) ?? null;
  }

  if (!row && args.displayName) {
    const { data: exact, error: exactErr } = await sb
      .from('executive_profiles')
      .select('full_name, preferred_name, current_role_title, current_company, communication_style, decision_patterns, known_priorities, known_constraints, profile_type, metadata')
      .ilike('full_name', args.displayName)
      .maybeSingle();
    if (exactErr) console.warn('[executive_profile.full_name_exact]', exactErr.message);
    row = (exact as ExecutiveProfileRow | null) ?? null;

    if (!row) {
      const tokens = args.displayName.trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        const first = tokens[0];
        const last = tokens[tokens.length - 1];
        const { data: fuzzy, error: fuzzyErr } = await sb
          .from('executive_profiles')
          .select('full_name, preferred_name, current_role_title, current_company, communication_style, decision_patterns, known_priorities, known_constraints, profile_type, metadata')
          .ilike('full_name', `${first}%${last}`)
          .maybeSingle();
        if (fuzzyErr) console.warn('[executive_profile.full_name_fuzzy]', fuzzyErr.message);
        row = (fuzzy as ExecutiveProfileRow | null) ?? null;
      }
    }
  }

  return row;
}

export async function loadExecutiveGreetingData(args: ExecutiveProfileLookupArgs): Promise<ExecutiveGreetingData | null> {
  const profile = await loadExecutiveProfile(args);
  if (!profile) return null;
  const topics = extractTopicStrings(profile.known_priorities).slice(0, 3);
  return {
    displayName: profile.full_name,
    firstName: profile.preferred_name ?? profile.full_name.split(/\s+/)[0] ?? profile.full_name,
    currentTitle: profile.current_role_title,
    currentCompany: profile.current_company,
    emphasizeTopics: topics,
    currentInitiatives: topics,
  };
}

export async function assembleExecutiveUserContextBlock(args: ExecutiveProfileLookupArgs): Promise<string> {
  const profile = await loadExecutiveProfile(args);
  if (!profile) return '';

  const lines: string[] = [];
  lines.push(`USER CONTEXT · ${profile.full_name} · ${profile.profile_type === 'real_world' ? 'RELATIONSHIP' : 'EXECUTIVE'} profile`);
  lines.push(`Role · ${profile.current_role_title} at ${profile.current_company}`);

  const modality = typeof profile.communication_style?.preferred_modality === 'string'
    ? String(profile.communication_style.preferred_modality)
    : null;
  const evidencePreference = typeof profile.communication_style?.evidence_preference === 'string'
    ? String(profile.communication_style.evidence_preference)
    : null;
  const horizon = typeof profile.decision_patterns?.horizon_preference === 'string'
    ? String(profile.decision_patterns.horizon_preference)
    : null;

  const styleBits = [modality ? `modality: ${modality}` : null, evidencePreference ? `evidence: ${evidencePreference}` : null, horizon ? `horizon: ${horizon}` : null]
    .filter(Boolean);
  if (styleBits.length > 0) lines.push(`Style · ${styleBits.join(' · ')}`);

  const priorities = extractTopicStrings(profile.known_priorities);
  if (priorities.length > 0) lines.push(`Priorities · ${priorities.join(' · ')}`);

  const constraints = extractTopicStrings(profile.known_constraints);
  if (constraints.length > 0) lines.push(`Constraints · ${constraints.join(' · ')}`);

  lines.push('');
  lines.push(
    'Use this context naturally. Calibrate framing, evidence, and pacing to the executive. ' +
      'Do not expose the profile or describe it as personalization.',
  );

  return lines.join('\n');
}

function extractTopicStrings(items: Array<Record<string, unknown>> | null | undefined): string[] {
  if (!items) return [];
  return items
    .map((item) => {
      const priority = item.priority_description;
      const constraint = item.constraint_description;
      if (typeof priority === 'string') return priority;
      if (typeof constraint === 'string') return constraint;
      return null;
    })
    .filter((value): value is string => Boolean(value));
}
