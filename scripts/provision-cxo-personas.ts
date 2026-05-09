// scripts/provision-cxo-personas.ts
//
// Provisions the four canonical CXO Clerk users AND their Supabase
// person + person_client_memberships rows so the active-client
// resolver can find them. Disables every other *.example.com demo
// account.
//
// Run:
//   npx tsx scripts/provision-cxo-personas.ts --dry-run        # default
//   npx tsx scripts/provision-cxo-personas.ts --apply           # mutate
//
// Requires in .env.local:
//   CLERK_SECRET_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Safety:
//   - --dry-run is the default. --apply must be passed explicitly.
//   - anand.sundaram@thesundaram.com is hardcoded as never-touched.
//   - Banning is reversible (clerk.users.unbanUser).

import { config as loadEnv } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import path from 'node:path';
import { CXO_PERSONAS } from '../src/lib/auth/cxo-personas';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const PROTECTED_EMAILS = new Set<string>([
  'anand.sundaram@thesundaram.com',
]);

const DEMO_PASSWORD = 'Demo2026!';
const KEEP_EMAILS = new Set<string>([
  ...PROTECTED_EMAILS,
  ...CXO_PERSONAS.map((p) => p.email),
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function makeClerk() {
  return createClerkClient({ secretKey: requireEnv('CLERK_SECRET_KEY') });
}

function makeSupabase(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  ) as SupabaseClient;
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return { apply: args.has('--apply') };
}

interface ClientRow {
  id: string;
  name: string;
}

async function loadClientsByKey(sb: SupabaseClient): Promise<Map<string, ClientRow>> {
  const { data, error } = await sb.from('clients').select('id, name');
  if (error) throw error;

  const byKey = new Map<string, ClientRow>();
  for (const row of (data as ClientRow[] | null) ?? []) {
    if (/Meridian/i.test(row.name)) byKey.set('meridian', row);
    if (/Arcturus|First Capital/i.test(row.name)) byKey.set('arcturus', row);
    if (/Apex Retail/i.test(row.name)) byKey.set('apexretail', row);
  }
  return byKey;
}

async function findUserByEmail(clerk: ReturnType<typeof createClerkClient>, email: string) {
  const list = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  return list.data[0] ?? null;
}

interface PersonaActions {
  clerkAction: 'create' | 'update' | 'noop';
  personAction: 'create' | 'update' | 'noop';
  membershipAction: 'create' | 'update' | 'noop';
}

async function provisionPersona(
  clerk: ReturnType<typeof createClerkClient>,
  sb: SupabaseClient,
  persona: (typeof CXO_PERSONAS)[number],
  clientRow: ClientRow,
  apply: boolean,
): Promise<PersonaActions> {
  const result: PersonaActions = {
    clerkAction: 'noop',
    personAction: 'noop',
    membershipAction: 'noop',
  };

  // Build the canonical publicMetadata. The active-client resolver
  // reads `clientId` (canonical app key) — this is the field that was
  // missing in the v1 script. Other fields are persona surface data.
  const publicMetadata = {
    role: 'maestro',
    clientId: persona.clientKey, // ← critical: drives getActiveClientKey()
    tenantKey: persona.tenantKey, // broker-namespace (separate)
    personaName: persona.personaName,
    personaTitle: persona.titleFull,
    personaTitleShort: persona.titleShort,
    tenantName: persona.tenant,
    bio: persona.bioShort,
  };

  // ── Phase A · Clerk user ──────────────────────────────────────
  const existing = await findUserByEmail(clerk, persona.email);
  if (!existing) {
    result.clerkAction = 'create';
    if (apply) {
      await clerk.users.createUser({
        emailAddress: [persona.email],
        password: DEMO_PASSWORD,
        firstName: persona.firstName,
        lastName: persona.lastName,
        publicMetadata,
        skipPasswordChecks: true,
        skipPasswordRequirement: false,
      });
    }
  } else {
    result.clerkAction = 'update';
    if (apply) {
      await clerk.users.updateUser(existing.id, {
        firstName: persona.firstName,
        lastName: persona.lastName,
        publicMetadata,
        password: DEMO_PASSWORD,
        skipPasswordChecks: true,
      });
      if (existing.banned) await clerk.users.unbanUser(existing.id);
    }
  }

  // ── Phase B · Supabase persons row ────────────────────────────
  // Look up by email first, then by graph_node_id as a secondary key.
  const { data: existingPerson } = await sb
    .from('persons')
    .select('id, email, graph_node_id')
    .or(`email.eq.${persona.email},graph_node_id.eq.${persona.graphNodeId}`)
    .maybeSingle();

  // `primary_role` is the user_role_type enum (maestro / client_viewer / etc.),
  // NOT the persona title. The persona title goes into the free-text `role`
  // field. Founder-confirmed all four CXO accounts get maestro.
  const personPayload = {
    graph_node_id: persona.graphNodeId,
    name: persona.personaName,
    email: persona.email,
    role: persona.titleFull,
    organization: persona.tenant,
    primary_role: 'maestro',
    familiarity: 'first_meeting',
    communication_style: {},
    working_rhythm: {},
    personal_threads: [],
  };

  let personId: string;
  if (existingPerson) {
    result.personAction = 'update';
    personId = (existingPerson as { id: string }).id;
    if (apply) {
      const { error } = await sb.from('persons').update(personPayload).eq('id', personId);
      if (error) throw error;
    }
  } else {
    result.personAction = 'create';
    if (apply) {
      const { data, error } = await sb.from('persons').insert(personPayload).select('id').single();
      if (error) throw error;
      personId = (data as { id: string }).id;
    } else {
      personId = '<DRY-RUN-PERSON-ID>';
    }
  }

  // ── Phase C · person_client_memberships row ───────────────────
  // In dry-run we skip this lookup if person was newly created
  // (would FK to nothing). Otherwise we report the planned action.
  if (apply || result.personAction !== 'create') {
    const { data: existingMembership } = await sb
      .from('person_client_memberships')
      .select('id, role')
      .eq('person_id', personId)
      .eq('client_id', clientRow.id)
      .maybeSingle();

    const membershipPayload = {
      role: 'maestro',
      access_level: null,
      financial_visibility: true,
      can_admin_users: true,
      can_create_programs: true,
      can_approve_gates: true,
      can_create_source_events: true,
      can_approve_source_stages: true,
      can_approve_award: true,
      can_upload_source_artifacts: true,
      can_generate_sourcing_artifacts: true,
      can_publish_sourcing_artifacts: true,
    };

    if (existingMembership) {
      result.membershipAction = 'update';
      if (apply) {
        const { error } = await sb
          .from('person_client_memberships')
          .update(membershipPayload)
          .eq('id', (existingMembership as { id: string }).id);
        if (error) throw error;
      }
    } else {
      result.membershipAction = 'create';
      if (apply) {
        const { error } = await sb.from('person_client_memberships').insert({
          person_id: personId,
          client_id: clientRow.id,
          ...membershipPayload,
        });
        if (error) throw error;
      }
    }
  } else {
    result.membershipAction = 'create';
  }

  return result;
}

async function listAllUsers(clerk: ReturnType<typeof createClerkClient>) {
  const all: Array<{ id: string; email: string; banned: boolean }> = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const page = await clerk.users.getUserList({ limit, offset });
    for (const u of page.data) {
      const email = u.emailAddresses[0]?.emailAddress ?? '';
      all.push({ id: u.id, email: email.toLowerCase(), banned: u.banned });
    }
    if (page.data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  const { apply } = parseArgs();

  console.log('━'.repeat(70));
  console.log(`AbarVa CXO persona provisioning · ${apply ? 'APPLY MODE' : 'DRY-RUN'}`);
  console.log('━'.repeat(70));
  if (!apply) {
    console.log('No changes will be made. Re-run with --apply to mutate.\n');
  } else {
    console.log('⚠️  APPLY MODE — Clerk + Supabase will be mutated. Hit Ctrl-C now to abort.\n');
    await new Promise((r) => setTimeout(r, 3_000));
  }

  const clerk = makeClerk();
  const sb = makeSupabase();
  const clients = await loadClientsByKey(sb);

  // ── Phase 1 · provision the 4 CXO personas ─────────────────────
  console.log('Phase 1 · Provision CXO personas (Clerk + Supabase)');
  console.log('─'.repeat(70));
  for (const persona of CXO_PERSONAS) {
    const clientRow = clients.get(persona.clientKey);
    if (!clientRow) {
      console.log(`  [SKIP] ${persona.email} — clients table has no ${persona.clientKey}`);
      continue;
    }
    const r = await provisionPersona(clerk, sb, persona, clientRow, apply);
    console.log(
      `  ${persona.shortLabel.padEnd(22)} → clerk:${r.clerkAction.padEnd(6)} person:${r.personAction.padEnd(6)} membership:${r.membershipAction}`,
    );
  }
  console.log();

  // ── Phase 2 · ban every other *.example.com demo user ─────────
  console.log('Phase 2 · Disable legacy *.example.com demo accounts');
  console.log('─'.repeat(70));
  const allUsers = await listAllUsers(clerk);
  const toBan = allUsers.filter(
    (u) => u.email.endsWith('.example.com') && !KEEP_EMAILS.has(u.email) && !u.banned,
  );

  if (toBan.length === 0) {
    console.log('  (no eligible demo accounts to ban)\n');
  } else {
    for (const u of toBan) {
      if (!apply) {
        console.log(`  [BAN] ${u.email}`);
      } else {
        await clerk.users.banUser(u.id);
        console.log(`  [BANNED] ${u.email}`);
      }
    }
    console.log();
  }

  // ── Phase 3 · summary ──────────────────────────────────────────
  console.log('Summary');
  console.log('─'.repeat(70));
  console.log(`  Personas provisioned: ${CXO_PERSONAS.length}`);
  console.log(`  Legacy demo accounts banned: ${toBan.length}`);
  console.log(`  Protected (always kept): ${[...PROTECTED_EMAILS].join(', ')}`);
  console.log();

  if (!apply) {
    console.log('✓ Dry-run complete. Re-run with --apply to execute.');
  } else {
    console.log('✓ Apply complete. Sign in at https://app.abarva.ai/sign-in');
    console.log(`  Demo password: ${DEMO_PASSWORD}`);
    console.log('  OTP code: 424242');
  }
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
