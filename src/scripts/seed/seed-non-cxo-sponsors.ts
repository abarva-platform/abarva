import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type TenantSeed = {
  key: 'meridian' | 'arcturus' | 'apexretail';
  clientNameCandidates: string[];
  people: Array<{
    graphNodeId: string;
    name: string;
    email: string;
    title: string;
    cxoFunction: string;
    unit: string;
    primaryFocus: string;
    familiarity?: 'first_meeting' | 'returning_recent' | 'returning_dormant' | 'frequent_collaborator';
  }>;
};

type ClientRow = {
  id: string;
  name: string;
};

type PersonRow = {
  id: string;
  graph_node_id: string | null;
};

const TENANTS: TenantSeed[] = [
  {
    key: 'meridian',
    clientNameCandidates: ['Meridian Health', 'Meridian Health System'],
    people: [
      {
        graphNodeId: 'person_meridian_maya_patel',
        name: 'Maya Patel',
        email: 'maya.patel@meridian-health.demo',
        title: 'VP Clinical Informatics',
        cxoFunction: 'Clinical',
        unit: 'Clinical Informatics',
        primaryFocus: 'Driving EHR-adjacent workflow modernization across ambulatory and inpatient care teams.',
        familiarity: 'returning_recent',
      },
      {
        graphNodeId: 'person_meridian_aaron_bishop',
        name: 'Aaron Bishop',
        email: 'aaron.bishop@meridian-health.demo',
        title: 'Director, Revenue Cycle Transformation',
        cxoFunction: 'Finance',
        unit: 'Revenue Cycle',
        primaryFocus: 'Reducing denials and manual rework across prior auth, coding, and patient billing operations.',
        familiarity: 'returning_recent',
      },
      {
        graphNodeId: 'person_meridian_lena_ortiz',
        name: 'Lena Ortiz',
        email: 'lena.ortiz@meridian-health.demo',
        title: 'VP Ambulatory Operations',
        cxoFunction: 'Operations',
        unit: 'Ambulatory Care',
        primaryFocus: 'Improving clinic throughput, staffing stability, and patient access across the outpatient network.',
      },
      {
        graphNodeId: 'person_meridian_devon_kim',
        name: 'Devon Kim',
        email: 'devon.kim@meridian-health.demo',
        title: 'Head of Data Platform Engineering',
        cxoFunction: 'IT',
        unit: 'Enterprise Data Platform',
        primaryFocus: 'Stabilizing the Snowflake migration and making analytics delivery dependable for operating leaders.',
      },
    ],
  },
  {
    key: 'arcturus',
    clientNameCandidates: ['Arcturus Financial Group', 'Arcturus Financial', 'First Capital Financial', 'First Capital'],
    people: [
      {
        graphNodeId: 'person_arcturus_elena_marwick',
        name: 'Elena Marwick',
        email: 'elena.marwick@arcturus-financial.demo',
        title: 'VP Wealth Platform Engineering',
        cxoFunction: 'IT',
        unit: 'Wealth Platform',
        primaryFocus: 'Modernizing advisor and client-platform workflows without disrupting regulated portfolio operations.',
        familiarity: 'returning_recent',
      },
      {
        graphNodeId: 'person_arcturus_tom_bevan',
        name: 'Tom Bevan',
        email: 'tom.bevan@arcturus-financial.demo',
        title: 'Director, Portfolio Operations',
        cxoFunction: 'Operations',
        unit: 'Portfolio Operations',
        primaryFocus: 'Removing reconciliation drag from investment operations and shortening handoffs between portfolio, risk, and settlements.',
      },
      {
        graphNodeId: 'person_arcturus_nisha_kapur',
        name: 'Nisha Kapur',
        email: 'nisha.kapur@arcturus-financial.demo',
        title: 'Head of Client Reporting Automation',
        cxoFunction: 'Product',
        unit: 'Client Reporting',
        primaryFocus: 'Turning quarterly reporting and commentary production into a scalable, audit-ready workflow for relationship teams.',
      },
      {
        graphNodeId: 'person_arcturus_graham_ellis',
        name: 'Graham Ellis',
        email: 'graham.ellis@arcturus-financial.demo',
        title: 'VP Platform Finance',
        cxoFunction: 'Finance',
        unit: 'Technology Finance',
        primaryFocus: 'Linking platform investment decisions to margin recovery, run-cost discipline, and board-level ROI scrutiny.',
      },
    ],
  },
  {
    key: 'apexretail',
    clientNameCandidates: ['Apex Retail Group', 'Apex Retail'],
    people: [
      {
        graphNodeId: 'person_apex_nina_brooks',
        name: 'Nina Brooks',
        email: 'nina.brooks@apex-retail.demo',
        title: 'VP Supply Chain Operations',
        cxoFunction: 'Operations',
        unit: 'Supply Chain',
        primaryFocus: 'Improving flow-through from DCs to stores while protecting service levels during assortment and promo volatility.',
        familiarity: 'returning_recent',
      },
      {
        graphNodeId: 'person_apex_omar_haddad',
        name: 'Omar Haddad',
        email: 'omar.haddad@apex-retail.demo',
        title: 'Director, Merchandise Planning',
        cxoFunction: 'Product',
        unit: 'Merchandise Planning',
        primaryFocus: 'Tightening category plans and forecast quality in apparel and home where margin swing is highest.',
      },
      {
        graphNodeId: 'person_apex_casey_lin',
        name: 'Casey Lin',
        email: 'casey.lin@apex-retail.demo',
        title: 'Head of Digital Product',
        cxoFunction: 'IT',
        unit: 'Digital Commerce',
        primaryFocus: 'Owning customer-facing product changes across search, basket, loyalty, and digital self-service journeys.',
      },
      {
        graphNodeId: 'person_apex_felicia_grant',
        name: 'Felicia Grant',
        email: 'felicia.grant@apex-retail.demo',
        title: 'VP Store Finance',
        cxoFunction: 'Finance',
        unit: 'Store Finance',
        primaryFocus: 'Translating field execution choices into margin, labor, and same-store-sales outcomes for the store portfolio.',
      },
    ],
  },
];

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function resolveClient(sb: SupabaseClient, tenant: TenantSeed): Promise<ClientRow> {
  for (const candidate of tenant.clientNameCandidates) {
    const { data, error } = await sb.from('clients').select('id, name').ilike('name', candidate).maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }

  throw new Error(`Client not found for ${tenant.key}. Tried: ${tenant.clientNameCandidates.join(', ')}`);
}

async function ensurePerson(
  sb: SupabaseClient,
  client: ClientRow,
  person: TenantSeed['people'][number],
): Promise<PersonRow> {
  const communicationStyle = {
    title: person.title,
    cxo_function: person.cxoFunction,
    unit: person.unit,
    primary_focus: person.primaryFocus,
  };

  const payload = {
    graph_node_id: person.graphNodeId,
    name: person.name,
    email: person.email,
    role: person.title,
    organization: client.name,
    familiarity: person.familiarity ?? 'first_meeting',
    communication_style: communicationStyle,
    primary_role: 'client_viewer',
  };

  const { data: existingByGraph, error: graphError } = await sb
    .from('persons')
    .select('id, graph_node_id')
    .eq('graph_node_id', person.graphNodeId)
    .maybeSingle();
  if (graphError) throw graphError;

  if (existingByGraph) {
    const { error: updateError } = await sb.from('persons').update(payload).eq('id', (existingByGraph as PersonRow).id);
    if (updateError) throw updateError;
    return existingByGraph as PersonRow;
  }

  const { data: existingByEmail, error: emailError } = await sb
    .from('persons')
    .select('id, graph_node_id')
    .eq('email', person.email)
    .maybeSingle();
  if (emailError) throw emailError;

  if (existingByEmail) {
    const { error: updateError } = await sb.from('persons').update(payload).eq('id', (existingByEmail as PersonRow).id);
    if (updateError) throw updateError;
    return existingByEmail as PersonRow;
  }

  const { data: inserted, error: insertError } = await sb
    .from('persons')
    .insert(payload)
    .select('id, graph_node_id')
    .single();
  if (insertError || !inserted) throw insertError ?? new Error(`Failed to insert ${person.email}`);
  return inserted as PersonRow;
}

async function ensureMembership(sb: SupabaseClient, personId: string, clientId: string): Promise<void> {
  const { error } = await sb
    .from('person_client_memberships')
    .upsert(
      {
        person_id: personId,
        client_id: clientId,
        role: 'client_viewer',
      },
      { onConflict: 'person_id,client_id' },
    );
  if (error) throw error;
}

async function verifyTenant(sb: SupabaseClient, client: ClientRow, expectedNames: string[]): Promise<Array<{ name: string; role: string; title: string; unit: string }>> {
  const { data, error } = await sb
    .from('persons')
    .select('name, role, communication_style')
    .eq('organization', client.name)
    .in('name', expectedNames)
    .order('name', { ascending: true });
  if (error) throw error;

  return ((data ?? []) as Array<{ name: string; role: string; communication_style?: Record<string, unknown> }>)
    .map((row) => ({
      name: row.name,
      role: row.role,
      title: String((row.communication_style ?? {}).title ?? ''),
      unit: String((row.communication_style ?? {}).unit ?? ''),
    }));
}

async function runTenant(sb: SupabaseClient, tenant: TenantSeed): Promise<void> {
  const client = await resolveClient(sb, tenant);
  for (const person of tenant.people) {
    const row = await ensurePerson(sb, client, person);
    await ensureMembership(sb, row.id, client.id);
  }

  const verified = await verifyTenant(sb, client, tenant.people.map((person) => person.name));
  console.log(`\n${tenant.key} · ${client.name}`);
  console.log(`  seeded/updated · ${verified.length}`);
  for (const row of verified) {
    console.log(`  - ${row.name} · ${row.role} · ${row.unit}`);
  }
}

async function main() {
  const sb = getSb();
  console.log('─── Non-CXO sponsor demo seed ───');
  for (const tenant of TENANTS) {
    await runTenant(sb, tenant);
  }
  console.log('\nDone.');
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
