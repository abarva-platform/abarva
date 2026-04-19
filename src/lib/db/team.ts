import { getServerSupabase } from '@/lib/supabase-server';

export interface TeamRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  person_id: string;
  role: 'admin' | 'maestro' | 'observer';
  created_at: string;
}

export async function getTeamsForPerson(
  personId: string,
): Promise<Array<{ team: TeamRow; role: TeamMembership['role'] }>> {
  const { data, error } = await getServerSupabase()
    .from('team_memberships')
    .select('role, teams(*)')
    .eq('person_id', personId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{
    role: TeamMembership['role'];
    teams: TeamRow | TeamRow[] | null;
  }>;
  return rows
    .map((m) => {
      const team = Array.isArray(m.teams) ? m.teams[0] ?? null : m.teams;
      return team ? { team, role: m.role } : null;
    })
    .filter((x): x is { team: TeamRow; role: TeamMembership['role'] } => x !== null);
}

export async function getEngagementIdsForPerson(personId: string): Promise<string[]> {
  const sb = getServerSupabase();
  const { data: memberships, error: mErr } = await sb
    .from('team_memberships')
    .select('team_id')
    .eq('person_id', personId);
  if (mErr) return [];
  const teamIds = ((memberships ?? []) as Array<{ team_id: string }>).map((m) => m.team_id);

  const ids = new Set<string>();
  if (teamIds.length > 0) {
    const { data: engs } = await sb.from('engagements').select('id').in('team_id', teamIds);
    for (const e of ((engs ?? []) as Array<{ id: string }>)) ids.add(e.id);
  }

  // Also include engagements where person is sponsor / co-sponsor / maestro directly
  const { data: direct } = await sb
    .from('engagements')
    .select('id, sponsor_person_id, co_sponsor_person_id, maestro_person_id')
    .or(
      `sponsor_person_id.eq.${personId},co_sponsor_person_id.eq.${personId},maestro_person_id.eq.${personId}`,
    );
  for (const e of ((direct ?? []) as Array<{ id: string }>)) ids.add(e.id);

  return Array.from(ids);
}

export async function personIsAdminAnywhere(personId: string): Promise<boolean> {
  const { data, error } = await getServerSupabase()
    .from('team_memberships')
    .select('id')
    .eq('person_id', personId)
    .eq('role', 'admin')
    .limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}
