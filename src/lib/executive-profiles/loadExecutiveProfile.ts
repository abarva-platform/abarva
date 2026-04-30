import { getServerSupabase } from '@/lib/supabase-server';

export interface ExecutiveProfileLookupArgs {
  personId?: string | null;
  displayName?: string | null;
  /** Overrides current_company in the Role line when a tenant is active. */
  activeTenantDisplayName?: string | null;
}

interface ExecutiveProfileRow {
  id: string;
  client_id: string | null;
  person_id: string | null;
  full_name: string;
  preferred_name: string | null;
  pronouns: string | null;
  current_role_title: string;
  current_company: string;
  current_tenure_start: string | null;
  current_remit: string | null;
  reporting_structure: Record<string, unknown>;
  strategic_priorities_personally_owned: string[];
  initiatives_personally_sponsored: string[];
  communication_style: Record<string, unknown>;
  decision_patterns: Record<string, unknown>;
  known_priorities: Array<Record<string, unknown>>;
  known_constraints: Array<Record<string, unknown>>;
  influential_voices: Array<Record<string, unknown>>;
  abarva_relationship_history: Record<string, unknown>;
  source_material: Array<Record<string, unknown>>;
  profile_type: 'real_world' | 'composite_tenant';
  profile_use_statement: string;
  profile_non_use_statement: string;
  human_reviewed_by: string | null;
  human_reviewed_at: string | null;
  last_refreshed_at: string | null;
  confidence: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ExecutiveCareerEntry {
  id: string;
  ordinal: number;
  role: string;
  company: string;
  tenure_start: string | null;
  tenure_end: string | null;
  notable_accomplishments: string[];
  exit_context: string | null;
}

export interface ExecutivePublicStatementEntry {
  id: string;
  ordinal: number;
  statement_summary: string;
  source: string;
  statement_date: string | null;
  topic_tags: string[];
  commitment_quality: string | null;
}

export interface ExecutiveProfileRelationship {
  id: string;
  relationship_type: string;
  relationship_context: string | null;
  confidence: string;
  related_profile_id: string;
  related_profile_name: string | null;
  related_profile_role: string | null;
  related_profile_company: string | null;
}

export interface ExecutiveInteractionLogEntry {
  id: string;
  interaction_date: string;
  interaction_type: string;
  summary: string;
  outcome: string | null;
  next_step: string | null;
}

export interface ExecutiveDemoPersonaOverrides {
  use_preferred_name_in_greetings: boolean;
  specific_frames_to_open_with: string[];
  topics_to_lead_with: string[];
  sensitivities_to_acknowledge: string[];
  avoid_framings: string[];
}

export interface ExecutiveProfileDetail extends ExecutiveProfileRow {
  career_history: ExecutiveCareerEntry[];
  public_statements: ExecutivePublicStatementEntry[];
  relationships: ExecutiveProfileRelationship[];
  interaction_log: ExecutiveInteractionLogEntry[];
  persona_overrides: ExecutiveDemoPersonaOverrides | null;
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
      .select('id, client_id, person_id, full_name, preferred_name, pronouns, current_role_title, current_company, current_tenure_start, current_remit, reporting_structure, strategic_priorities_personally_owned, initiatives_personally_sponsored, communication_style, decision_patterns, known_priorities, known_constraints, influential_voices, abarva_relationship_history, source_material, profile_type, profile_use_statement, profile_non_use_statement, human_reviewed_by, human_reviewed_at, last_refreshed_at, confidence, metadata')
      .eq('person_id', args.personId)
      .maybeSingle();
    if (error) console.warn('[executive_profile.person_id]', error.message);
    row = (data as ExecutiveProfileRow | null) ?? null;
  }

  if (!row && args.displayName) {
    const { data: exact, error: exactErr } = await sb
      .from('executive_profiles')
      .select('id, client_id, person_id, full_name, preferred_name, pronouns, current_role_title, current_company, current_tenure_start, current_remit, reporting_structure, strategic_priorities_personally_owned, initiatives_personally_sponsored, communication_style, decision_patterns, known_priorities, known_constraints, influential_voices, abarva_relationship_history, source_material, profile_type, profile_use_statement, profile_non_use_statement, human_reviewed_by, human_reviewed_at, last_refreshed_at, confidence, metadata')
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
          .select('id, client_id, person_id, full_name, preferred_name, pronouns, current_role_title, current_company, current_tenure_start, current_remit, reporting_structure, strategic_priorities_personally_owned, initiatives_personally_sponsored, communication_style, decision_patterns, known_priorities, known_constraints, influential_voices, abarva_relationship_history, source_material, profile_type, profile_use_statement, profile_non_use_statement, human_reviewed_by, human_reviewed_at, last_refreshed_at, confidence, metadata')
          .ilike('full_name', `${first}%${last}`)
          .maybeSingle();
        if (fuzzyErr) console.warn('[executive_profile.full_name_fuzzy]', fuzzyErr.message);
        row = (fuzzy as ExecutiveProfileRow | null) ?? null;
      }
    }
  }

  return row;
}

export async function loadExecutiveProfileDetail(args: ExecutiveProfileLookupArgs): Promise<ExecutiveProfileDetail | null> {
  const base = await loadExecutiveProfile(args);
  if (!base) return null;

  const sb = getServerSupabase();
  const [careerQ, statementsQ, relationshipsQ, interactionsQ, personaQ] = await Promise.all([
    sb
      .from('executive_career_history')
      .select('id, ordinal, role, company, tenure_start, tenure_end, notable_accomplishments, exit_context')
      .eq('profile_id', base.id)
      .order('ordinal', { ascending: true }),
    sb
      .from('executive_public_statements')
      .select('id, ordinal, statement_summary, source, statement_date, topic_tags, commitment_quality')
      .eq('profile_id', base.id)
      .order('ordinal', { ascending: true }),
    sb
      .from('executive_relationships')
      .select('id, relationship_type, relationship_context, confidence, related_profile_id')
      .eq('profile_id', base.id),
    sb
      .from('executive_interaction_log')
      .select('id, interaction_date, interaction_type, summary, outcome, next_step')
      .eq('profile_id', base.id)
      .order('interaction_date', { ascending: false }),
    sb
      .from('executive_demo_persona_overrides')
      .select('use_preferred_name_in_greetings, specific_frames_to_open_with, topics_to_lead_with, sensitivities_to_acknowledge, avoid_framings')
      .eq('profile_id', base.id)
      .maybeSingle(),
  ]);

  const relationshipIds = (((relationshipsQ.data ?? []) as Array<{ related_profile_id: string }>)).map((row) => row.related_profile_id);
  const relatedProfilesById = new Map<string, { full_name: string; current_role_title: string | null; current_company: string | null }>();

  if (relationshipIds.length > 0) {
    const { data: relatedProfiles } = await sb
      .from('executive_profiles')
      .select('id, full_name, current_role_title, current_company')
      .in('id', relationshipIds);

    for (const row of ((relatedProfiles ?? []) as Array<{
      id: string;
      full_name: string;
      current_role_title: string | null;
      current_company: string | null;
    }>)) {
      relatedProfilesById.set(row.id, {
        full_name: row.full_name,
        current_role_title: row.current_role_title,
        current_company: row.current_company,
      });
    }
  }

  return {
    ...base,
    career_history: ((careerQ.data ?? []) as ExecutiveCareerEntry[]),
    public_statements: ((statementsQ.data ?? []) as ExecutivePublicStatementEntry[]),
    relationships: (((relationshipsQ.data ?? []) as Array<{
      id: string;
      relationship_type: string;
      relationship_context: string | null;
      confidence: string;
      related_profile_id: string;
    }>)).map((row) => {
      const related = relatedProfilesById.get(row.related_profile_id);
      return {
        ...row,
        related_profile_name: related?.full_name ?? null,
        related_profile_role: related?.current_role_title ?? null,
        related_profile_company: related?.current_company ?? null,
      };
    }),
    interaction_log: ((interactionsQ.data ?? []) as ExecutiveInteractionLogEntry[]),
    persona_overrides: (personaQ.data as ExecutiveDemoPersonaOverrides | null) ?? null,
  };
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
  lines.push(`Role · ${profile.current_role_title} at ${args.activeTenantDisplayName ?? profile.current_company}`);

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
