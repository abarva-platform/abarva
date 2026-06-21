// scripts/provision-cxo-personas.ts
//
// Provisions the canonical CXO/tenant-demo Clerk users AND their Supabase
// person + person_client_memberships rows so the active-client
// resolver can find them. Disables every other *.example.com demo
// account.
//
// Run:
//   npx tsx scripts/provision-cxo-personas.ts --dry-run        # default
//   npx tsx scripts/provision-cxo-personas.ts --apply           # mutate
//   npx tsx scripts/provision-cxo-personas.ts --apply --skip-ban # mutate only canonical users
//   npx tsx scripts/provision-cxo-personas.ts --client lakeshore --plan-only
//   npx tsx scripts/provision-cxo-personas.ts --client lakeshore --clerk-only --apply
//   npx tsx scripts/provision-cxo-personas.ts --client lakeshore --apply --skip-ban
//
// Requires in .env.local:
//   CLERK_SECRET_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Safety:
//   - --dry-run is the default. --apply must be passed explicitly.
//   - --plan-only prints the selected personas and exits before env/network setup.
//   - --clerk-only creates/updates Clerk users and skips membership-table writes.
//   - anand.sundaram@thesundaram.com is hardcoded as never-touched.
//   - Banning is reversible (clerk.users.unbanUser).

import { config as loadEnv } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import path from 'node:path';
import { CXO_PERSONAS } from '../src/lib/auth/cxo-personas';
import { AGENT_CLIENT_LOGINS } from '../src/lib/auth/agent-client-logins';

const PROTECTED_EMAILS = new Set<string>([
  'anand.sundaram@thesundaram.com',
]);

const DEMO_PASSWORD = 'Demo2026!';
const KEEP_EMAILS = new Set<string>([
  ...PROTECTED_EMAILS,
  ...CXO_PERSONAS.map((p) => p.email),
  ...AGENT_CLIENT_LOGINS.map((p) => p.email),
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
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const clientArg = rawArgs.find((arg) => arg.startsWith('--client='));
  const clientFlagIndex = rawArgs.findIndex((arg) => arg === '--client');
  const clientValue =
    clientArg?.slice('--client='.length).trim() ||
    (clientFlagIndex >= 0 ? rawArgs[clientFlagIndex + 1]?.trim() : null) ||
    null;
  return {
    apply: args.has('--apply'),
    client: clientValue,
    clerkOnly: args.has('--clerk-only'),
    planOnly: args.has('--plan-only'),
    // --agents provisions the per-client automation logins (AGENT_CLIENT_LOGINS)
    // instead of the human CXO_PERSONAS. Skip the ban sweep for agent runs
    // (the agent roster is its own closed set).
    agents: args.has('--agents'),
    skipBan: args.has('--skip-ban') || Boolean(clientValue) || args.has('--agents'),
  };
}

interface ClientRow {
  id: string;
  name: string;
}

const CLIENT_SEED_FALLBACKS: Record<string, {
  id: string;
  name: string;
  legal_name: string;
  industry_code: string;
  tenant_key: string;
  slug: string;
}> = {
  skyharbor: {
    id: '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301',
    name: 'SkyHarbor Air',
    legal_name: 'SkyHarbor Air',
    industry_code: 'AIRLINE',
    tenant_key: 'skyharbor-air',
    slug: 'skyharbor-air',
  },
  lakeshore: {
    id: 'f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61',
    name: 'Lakeshore Holdings',
    legal_name: 'Lakeshore Holdings',
    industry_code: 'DIVERSIFIED',
    tenant_key: 'lakeshore-holdings',
    slug: 'lakeshore-holdings',
  },
};

async function loadClientsByKey(sb: SupabaseClient): Promise<Map<string, ClientRow>> {
  const { data, error } = await sb.from('clients').select('id, name, tenant_key');
  if (error) throw error;

  const byKey = new Map<string, ClientRow>();
  for (const row of (data as Array<ClientRow & { tenant_key?: string | null }> | null) ?? []) {
    if (/Meridian/i.test(row.name) || row.tenant_key === 'meridian-health') byKey.set('meridian', row);
    if (/Arcturus|First Capital/i.test(row.name) || row.tenant_key === 'first-capital') byKey.set('arcturus', row);
    if (/Apex Retail/i.test(row.name) || row.tenant_key === 'apex-retail') byKey.set('apexretail', row);
    if (/Northstar/i.test(row.name) || row.tenant_key === 'northstar-clinical') byKey.set('northstar', row);
    if (/SkyHarbor/i.test(row.name) || row.tenant_key === 'skyharbor-air') byKey.set('skyharbor', row);
    if (/Lakeshore/i.test(row.name) || row.tenant_key === 'lakeshore-holdings') byKey.set('lakeshore', row);
  }
  return byKey;
}

async function ensureSeedClients(
  sb: SupabaseClient,
  clients: Map<string, ClientRow>,
  apply: boolean,
): Promise<void> {
  for (const [key, seed] of Object.entries(CLIENT_SEED_FALLBACKS)) {
    if (clients.has(key)) continue;

    if (!apply) {
      console.log(`  [CLIENT] would create ${seed.name} (${seed.tenant_key})`);
      clients.set(key, { id: seed.id, name: seed.name });
      continue;
    }

    const { data, error } = await sb
      .from('clients')
      .upsert({
        ...seed,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id, name')
      .single();
    if (error) throw error;
    clients.set(key, data as ClientRow);
    console.log(`  [CLIENT] created/updated ${seed.name} (${seed.tenant_key})`);
  }
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

function buildClerkPublicMetadata(persona: (typeof CXO_PERSONAS)[number]) {
  return {
    role: persona.authRole ?? 'maestro',
    clientId: persona.clientKey,
    tenantKey: persona.tenantKey,
    personaName: persona.personaName,
    personaTitle: persona.titleFull,
    personaTitleShort: persona.titleShort,
    tenantName: persona.tenant,
    bio: persona.bioShort,
  };
}

async function provisionClerkPersona(
  clerk: ReturnType<typeof createClerkClient>,
  persona: (typeof CXO_PERSONAS)[number],
  apply: boolean,
): Promise<PersonaActions['clerkAction']> {
  const existing = await findUserByEmail(clerk, persona.email);
  if (!existing) {
    if (apply) {
      await clerk.users.createUser({
        emailAddress: [persona.email],
        password: DEMO_PASSWORD,
        firstName: persona.firstName,
        lastName: persona.lastName,
        publicMetadata: buildClerkPublicMetadata(persona),
        skipPasswordChecks: true,
        skipPasswordRequirement: false,
      });
    }
    return 'create';
  }

  if (apply) {
    await clerk.users.updateUser(existing.id, {
      firstName: persona.firstName,
      lastName: persona.lastName,
      publicMetadata: buildClerkPublicMetadata(persona),
      password: DEMO_PASSWORD,
      skipPasswordChecks: true,
    });
    if (existing.banned) await clerk.users.unbanUser(existing.id);
  }
  return 'update';
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

  // ── Phase A · Clerk user ──────────────────────────────────────
  result.clerkAction = await provisionClerkPersona(clerk, persona, apply);

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
  const { apply, client, clerkOnly, planOnly, skipBan, agents } = parseArgs();
  const roster = agents ? AGENT_CLIENT_LOGINS : CXO_PERSONAS;
  if (agents) console.log('Roster: AGENT_CLIENT_LOGINS (per-client automation logins)');
  const selectedPersonas = client
    ? roster.filter((persona) => persona.clientKey === client)
    : roster;
  if (client && selectedPersonas.length === 0) {
    throw new Error(`Unknown --client ${client}; no ${agents ? 'agent logins' : 'CXO personas'} found.`);
  }

  console.log('━'.repeat(70));
  console.log(`AbarVa CXO persona provisioning · ${apply ? 'APPLY MODE' : 'DRY-RUN'}${clerkOnly ? ' · CLERK ONLY' : ''}`);
  if (client) console.log(`Client scope: ${client} (${selectedPersonas.length} persona${selectedPersonas.length === 1 ? '' : 's'})`);
  console.log('━'.repeat(70));
  if (planOnly) {
    for (const persona of selectedPersonas) {
      console.log(
        [
          `  ${persona.email}`,
          `clientId=${persona.clientKey}`,
          `tenantKey=${persona.tenantKey}`,
          `role=${persona.authRole ?? 'maestro'}`,
          `title="${persona.titleFull}"`,
        ].join(' · '),
      );
    }
    console.log();
    console.log('✓ Plan-only complete. No env was read and no network calls were made.');
    return;
  }
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  if (!apply) {
    console.log('No changes will be made. Re-run with --apply to mutate.\n');
  } else {
    console.log('⚠️  APPLY MODE — Clerk + Supabase will be mutated. Hit Ctrl-C now to abort.\n');
    await new Promise((r) => setTimeout(r, 3_000));
  }

  const clerk = makeClerk();
  if (clerkOnly) {
    console.log('Phase 1 · Provision Clerk users only');
    console.log('─'.repeat(70));
    for (const persona of selectedPersonas) {
      const clerkAction = await provisionClerkPersona(clerk, persona, apply);
      console.log(`  ${persona.shortLabel.padEnd(22)} → clerk:${clerkAction}`);
    }
    console.log();
    console.log('Summary');
    console.log('─'.repeat(70));
    console.log(`  Clerk personas processed: ${selectedPersonas.length}`);
    console.log('  Membership rows skipped: --clerk-only supplied');
    if (!apply) {
      console.log('✓ Clerk-only dry-run complete. Re-run with --apply to execute.');
    } else {
      console.log('✓ Clerk-only apply complete. Run without --clerk-only when membership credentials are available.');
      console.log(`  Demo password: ${DEMO_PASSWORD}`);
      console.log('  OTP code: 424242');
    }
    return;
  }

  const sb = makeSupabase();
  const clients = await loadClientsByKey(sb);
  await ensureSeedClients(sb, clients, apply);

  // ── Phase 1 · provision canonical personas ─────────────────────
  console.log('Phase 1 · Provision canonical personas (Clerk + Supabase)');
  console.log('─'.repeat(70));
  for (const persona of selectedPersonas) {
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
  const toBan: Array<{ id: string; email: string; banned: boolean }> = [];
  if (skipBan) {
    console.log('  [SKIP] --skip-ban supplied; no legacy demo accounts will be disabled.\n');
  } else {
    const allUsers = await listAllUsers(clerk);
    toBan.push(...allUsers.filter(
      (u) => u.email.endsWith('.example.com') && !KEEP_EMAILS.has(u.email) && !u.banned,
    ));
  }

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
  console.log(`  Personas provisioned: ${selectedPersonas.length}`);
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
