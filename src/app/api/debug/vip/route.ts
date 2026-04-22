import { currentUser } from '@clerk/nextjs/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { loadVipGreetingData } from '@/lib/agent/prompts/_shared/user-context';
import { getCurrentPerson } from '@/lib/auth/maestro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Diagnostic endpoint for VIP-greeting verification. Returns the full
// lookup path so Anand can diagnose missing greetings in prod without
// needing server-log access.
//
// Hit while signed in:  /api/debug/vip
// Returns JSON: Clerk identity, persons lookup, vip_profile lookup,
//               loadVipGreetingData result.

export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // ── Clerk identity
  try {
    const user = await currentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ ...result, signed_in: false, error: 'no clerk session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const primaryEmail = user.emailAddresses[0]?.emailAddress ?? null;
    result.clerk = {
      user_id: user.id,
      primary_email: primaryEmail,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: user.fullName,
    };
  } catch (err) {
    result.error = `clerk lookup failed: ${err instanceof Error ? err.message : 'unknown'}`;
    return new Response(JSON.stringify(result, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── persons row
  const person = await getCurrentPerson();
  result.persons_row = person
    ? { id: person.id, name: person.name, email: person.email, role: person.role }
    : null;

  // ── vip_profiles lookup by person_id (if we have one) and by displayName
  const sb = getServerSupabase();
  let vipByPersonId: Record<string, unknown> | null = null;
  let vipByDisplayNameExact: Record<string, unknown> | null = null;
  let vipByFuzzy: Record<string, unknown> | null = null;

  if (person) {
    const { data } = await sb
      .from('vip_profiles')
      .select('id, person_id, display_name, demo_tier, current_title, current_company')
      .eq('person_id', person.id)
      .maybeSingle();
    vipByPersonId = (data as Record<string, unknown> | null) ?? null;

    const { data: exactData } = await sb
      .from('vip_profiles')
      .select('id, person_id, display_name, demo_tier, current_title, current_company')
      .ilike('display_name', person.name)
      .maybeSingle();
    vipByDisplayNameExact = (exactData as Record<string, unknown> | null) ?? null;

    const tokens = person.name.trim().split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length >= 2) {
      const first = tokens[0];
      const last = tokens[tokens.length - 1];
      const { data: fuzzyData } = await sb
        .from('vip_profiles')
        .select('id, person_id, display_name, demo_tier, current_title, current_company')
        .ilike('display_name', `${first}%${last}`)
        .maybeSingle();
      vipByFuzzy = (fuzzyData as Record<string, unknown> | null) ?? null;
    }
  }

  result.vip_lookup = {
    by_person_id: vipByPersonId,
    by_display_name_exact: vipByDisplayNameExact,
    by_display_name_fuzzy: vipByFuzzy,
  };

  // ── Final result: what the engagement console actually receives
  const greeting = person
    ? await loadVipGreetingData({ personId: person.id, displayName: person.name })
    : null;
  result.loadVipGreetingData_result = greeting;

  // ── Prescription
  const prescription: string[] = [];
  if (!person) {
    prescription.push(
      'No persons row matches your Clerk email. Either create a persons row manually (SQL: INSERT INTO persons(name, email) VALUES (\'Prat Vemana\', \'your-email\')) or sign in through a flow that provisions it.',
    );
  } else if (!greeting) {
    if (!vipByPersonId && !vipByDisplayNameExact && !vipByFuzzy) {
      prescription.push('No vip_profiles row matches by person_id, exact name, or fuzzy first+last. Confirm the VIP seed ran (migration 038).');
    } else if (vipByDisplayNameExact && (vipByDisplayNameExact as { demo_tier?: string }).demo_tier === 'standard') {
      prescription.push('Found a vip_profiles row but demo_tier is \'standard\'. Update demo_tier to \'vip\' to activate the greeting.');
    } else if (!vipByPersonId && (vipByDisplayNameExact || vipByFuzzy)) {
      const v = vipByDisplayNameExact ?? vipByFuzzy;
      prescription.push(`Found vip_profile by name but person_id not yet linked. Run: UPDATE vip_profiles SET person_id = '${person.id}' WHERE id = '${(v as { id: string }).id}';`);
    }
  } else {
    prescription.push('All checks pass. Greeting should render on zero-turn engagements.');
  }
  result.prescription = prescription;

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
