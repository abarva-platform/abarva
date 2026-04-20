import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// Turn-key VIP person provisioning for demo setup.
//
// Usage:
//   npx tsx src/scripts/seed/provision-vip-person.ts \
//     --email prat.demo@abarva.ai \
//     --name "Prat Vemana" \
//     --role "Executive Vice President, Chief Information and Product Officer" \
//     --organization "Target Corporation"
//
// What it does:
//   1. Upsert a persons row matching email (idempotent)
//   2. Confirm or force-link vip_profiles.person_id (migration 039's
//      trigger should do this automatically on insert; this script is
//      belt-and-suspenders for cases where the trigger missed)
//   3. Print the state so you can verify before signing in

function parseArgs(): { email: string; name: string; role?: string; organization?: string } {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    if (i < 0 || i + 1 >= args.length) return undefined;
    return args[i + 1];
  };

  const email = getArg('--email');
  const name = getArg('--name');
  if (!email || !name) {
    console.error('Usage: --email <email> --name "First Last" [--role "Role"] [--organization "Company"]');
    process.exit(1);
  }
  return {
    email,
    name,
    role: getArg('--role'),
    organization: getArg('--organization'),
  };
}

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const args = parseArgs();
  const sb = getSb();

  // Step 1 · Upsert persons row
  const { data: existingPerson } = await sb
    .from('persons')
    .select('id, name, email, role, organization')
    .eq('email', args.email)
    .maybeSingle();

  let personId: string;
  if (existingPerson) {
    personId = (existingPerson as { id: string }).id;
    console.log(`ℹ  persons row exists · id=${personId}`);
    // Refresh name/role/organization if provided (helps if Clerk-provisioned
    // without full metadata)
    const updates: Record<string, string> = {};
    if (args.name && (existingPerson as { name: string }).name !== args.name) updates.name = args.name;
    if (args.role) updates.role = args.role;
    if (args.organization) updates.organization = args.organization;
    if (Object.keys(updates).length > 0) {
      const { error } = await sb.from('persons').update(updates).eq('id', personId);
      if (error) throw error;
      console.log(`✓  persons updated · fields=${Object.keys(updates).join(',')}`);
    }
  } else {
    const { data: inserted, error } = await sb
      .from('persons')
      .insert({
        name: args.name,
        email: args.email,
        role: args.role ?? null,
        organization: args.organization ?? null,
        familiarity: 'first_meeting',
        communication_style: {},
        working_rhythm: {},
        personal_threads: [],
      })
      .select('id')
      .single();
    if (error) throw error;
    personId = (inserted as { id: string }).id;
    console.log(`✓  persons created · id=${personId}`);
  }

  // Step 2 · Verify vip_profiles linkage
  const { data: vipByPersonId } = await sb
    .from('vip_profiles')
    .select('id, display_name, person_id, demo_tier')
    .eq('person_id', personId)
    .maybeSingle();

  if (vipByPersonId) {
    console.log(`✓  vip_profile already linked · display=${(vipByPersonId as { display_name: string }).display_name} · tier=${(vipByPersonId as { demo_tier: string }).demo_tier}`);
    return;
  }

  // Try exact name match
  const { data: vipByName } = await sb
    .from('vip_profiles')
    .select('id, display_name, person_id, demo_tier')
    .ilike('display_name', args.name)
    .maybeSingle();

  if (vipByName) {
    const v = vipByName as { id: string; display_name: string; person_id: string | null; demo_tier: string };
    if (v.person_id === null) {
      const { error } = await sb.from('vip_profiles').update({ person_id: personId }).eq('id', v.id);
      if (error) throw error;
      console.log(`✓  vip_profile linked · display=${v.display_name} · tier=${v.demo_tier}`);
    } else if (v.person_id === personId) {
      console.log(`✓  vip_profile already linked · display=${v.display_name}`);
    } else {
      console.warn(`⚠  vip_profile exists but linked to different person_id=${v.person_id}. Leaving as-is.`);
    }
    return;
  }

  // Fuzzy first+last
  const tokens = args.name.trim().split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length >= 2) {
    const { data: vipFuzzy } = await sb
      .from('vip_profiles')
      .select('id, display_name, person_id, demo_tier')
      .ilike('display_name', `${tokens[0]}%${tokens[tokens.length - 1]}`)
      .maybeSingle();
    if (vipFuzzy) {
      const v = vipFuzzy as { id: string; display_name: string; person_id: string | null };
      if (v.person_id === null) {
        const { error } = await sb.from('vip_profiles').update({ person_id: personId }).eq('id', v.id);
        if (error) throw error;
        console.log(`✓  vip_profile linked via fuzzy match · display=${v.display_name} (Clerk name = ${args.name})`);
      } else {
        console.log(`ℹ  vip_profile found by fuzzy match but already linked · display=${v.display_name}`);
      }
      return;
    }
  }

  console.warn(`⚠  No vip_profile found for name="${args.name}". Seed vip_profiles first (migration 038 includes the Prat Vemana seed).`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
