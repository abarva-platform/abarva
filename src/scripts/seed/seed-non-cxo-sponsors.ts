import fs from 'node:fs';
import path from 'node:path';

type OrgKey = 'meridian' | 'arcturus' | 'apex';

type ClientRow = {
  id: string;
  name: string;
};

type PersonRow = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  organization: string | null;
  communication_style: Record<string, unknown> | null;
};

type SponsorSeed = {
  name: string;
  email: string;
  title: string;
  cxoFunction: string;
  unit: string;
  primaryFocus: string;
};

type OrgSeed = {
  key: OrgKey;
  label: string;
  clientNameCandidates: string[];
  organizationForClient: (clientName: string) => string;
  sponsors: SponsorSeed[];
};

const ORG_SEEDS: OrgSeed[] = [
  {
    key: 'meridian',
    label: 'Meridian',
    clientNameCandidates: ['Meridian Health', 'Meridian Health System'],
    organizationForClient: () => 'Meridian Health System',
    sponsors: [
      {
        name: 'Melissa Ahn',
        email: 'melissa.ahn@meridian-health.demo',
        title: 'VP Clinical Informatics',
        cxoFunction: 'IT',
        unit: 'Clinical Informatics and EHR Enablement',
        primaryFocus:
          'Translating physician workflow pain points into deployable Epic, ambient documentation, and analytics changes.',
      },
      {
        name: 'Aaron Patel',
        email: 'aaron.patel@meridian-health.demo',
        title: 'Executive Director Care Management Operations',
        cxoFunction: 'Operations',
        unit: 'Care Management and Throughput',
        primaryFocus:
          'Reducing discharge delays, readmissions, and care-coordination friction across the acute-to-home transition.',
      },
      {
        name: 'Rachel Dominguez',
        email: 'rachel.dominguez@meridian-health.demo',
        title: 'VP Revenue Cycle Transformation',
        cxoFunction: 'Finance',
        unit: 'Revenue Cycle and Prior Authorization',
        primaryFocus:
          'Tightening denial prevention, prior-auth cycle time, and cash acceleration without adding clinician burden.',
      },
      {
        name: 'Dr. Naomi Mercer',
        email: 'naomi.mercer@meridian-health.demo',
        title: 'Head of Ambulatory Access and Service Line Growth',
        cxoFunction: 'Clinical',
        unit: 'Ambulatory Operations',
        primaryFocus:
          'Improving referral conversion, clinic capacity, and patient access across high-growth specialties.',
      },
    ],
  },
  {
    key: 'arcturus',
    label: 'Arcturus',
    clientNameCandidates: [
      'Arcturus Financial Group',
      'Arcturus Financial',
      'First Capital',
      'First Capital Financial',
    ],
    organizationForClient: (clientName) =>
      /first capital/i.test(clientName) ? 'First Capital Financial' : 'Arcturus Financial Group',
    sponsors: [
      {
        name: 'Daniel Cho',
        email: 'daniel.cho@firstcapital.demo',
        title: 'VP Commercial Lending Transformation',
        cxoFunction: 'Commercial Banking',
        unit: 'Commercial Lending and Underwriting',
        primaryFocus:
          'Shortening underwriting cycle time while preserving credit discipline and relationship-manager trust.',
      },
      {
        name: 'Priyanka Mehra',
        email: 'priyanka.mehra@firstcapital.demo',
        title: 'Managing Director Wealth Platform Product',
        cxoFunction: 'Product',
        unit: 'Wealth Management Platform',
        primaryFocus:
          'Modernizing advisor workflow, client reporting, and portfolio intelligence across the post-acquisition wealth stack.',
      },
      {
        name: 'Sofia Ramirez',
        email: 'sofia.ramirez@firstcapital.demo',
        title: 'Director AML Investigations Optimization',
        cxoFunction: 'Risk',
        unit: 'BSA/AML Operations',
        primaryFocus:
          'Reducing false positives and investigator swivel-chair work ahead of regulator milestones.',
      },
      {
        name: 'Evan Brooks',
        email: 'evan.brooks@firstcapital.demo',
        title: 'Head of Digital Onboarding and Servicing',
        cxoFunction: 'Operations',
        unit: 'Consumer Digital Banking',
        primaryFocus:
          'Improving account-opening completion, KYC handoffs, and servicing deflection in mobile and online banking.',
      },
    ],
  },
  {
    key: 'apex',
    label: 'Apex',
    clientNameCandidates: ['Apex Retail', 'Apex Retail Group'],
    organizationForClient: () => 'Apex Retail Group',
    sponsors: [
      {
        name: 'Maya Reyes',
        email: 'maya.reyes@apex-retail.demo',
        title: 'VP Customer Care',
        cxoFunction: 'Operations',
        unit: 'Customer Care and Contact Center',
        primaryFocus:
          'Raising CSAT while cutting avoidable contact volume and agent handle time across retail service channels.',
      },
      {
        name: 'Marcus Liu',
        email: 'marcus.liu@apex-retail.demo',
        title: 'VP Merchandising',
        cxoFunction: 'Product',
        unit: 'Merchandising and Category Strategy',
        primaryFocus:
          'Improving assortment decisions, promo velocity, and in-season margin across core retail categories.',
      },
      {
        name: 'Neil Bhandari',
        email: 'neil.bhandari@apex-retail.demo',
        title: 'Head of Retail Technology Delivery',
        cxoFunction: 'IT',
        unit: 'Store Systems and Retail Technology',
        primaryFocus:
          'Sequencing store-system rollouts that reduce associate friction without disrupting peak trading periods.',
      },
      {
        name: 'Olivia Chen',
        email: 'olivia.chen@apex-retail.demo',
        title: 'VP Inventory Finance and Margin Analytics',
        cxoFunction: 'Finance',
        unit: 'Inventory Finance and Margin Analytics',
        primaryFocus:
          'Turning inventory turns, markdown exposure, and working-capital signals into sponsor-ready decisions for merchant and supply-chain teams.',
      },
    ],
  },
];

function loadLocalEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/u);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/gu, '');
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Export it or place it in .env.local before running this script.`);
  }
  return value;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '');
}

async function rest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${baseUrl}/rest/v1/${url}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`Supabase REST error ${response.status} for ${url}: ${JSON.stringify(payload)}`);
  }

  return payload as T;
}

async function findClient(seed: OrgSeed): Promise<ClientRow | null> {
  for (const candidate of seed.clientNameCandidates) {
    const rows = await rest<ClientRow[]>(
      `clients?select=id,name&name=eq.${encodeURIComponent(candidate)}&limit=1`,
      { method: 'GET' },
    );
    if (rows[0]) return rows[0];
  }

  for (const candidate of seed.clientNameCandidates) {
    const rows = await rest<ClientRow[]>(
      `clients?select=id,name&name=ilike.${encodeURIComponent(candidate)}&limit=1`,
      { method: 'GET' },
    );
    if (rows[0]) return rows[0];
  }

  return null;
}

async function findPerson(email: string, name: string, organization: string): Promise<PersonRow | null> {
  const byEmail = await rest<PersonRow[]>(
    `persons?select=id,name,email,role,organization,communication_style&email=eq.${encodeURIComponent(email)}&limit=1`,
    { method: 'GET' },
  );
  if (byEmail[0]) return byEmail[0];

  const byName = await rest<PersonRow[]>(
    `persons?select=id,name,email,role,organization,communication_style&name=eq.${encodeURIComponent(name)}&organization=eq.${encodeURIComponent(organization)}&limit=1`,
    { method: 'GET' },
  );
  return byName[0] ?? null;
}

async function createPerson(payload: Record<string, unknown>): Promise<PersonRow> {
  const rows = await rest<PersonRow[]>('persons?select=id,name,email,role,organization,communication_style', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!rows[0]) throw new Error(`Failed to create person ${payload.name as string}`);
  return rows[0];
}

async function updatePerson(id: string, payload: Record<string, unknown>): Promise<PersonRow> {
  const rows = await rest<PersonRow[]>(
    `persons?id=eq.${encodeURIComponent(id)}&select=id,name,email,role,organization,communication_style`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    },
  );
  if (!rows[0]) throw new Error(`Failed to update person ${id}`);
  return rows[0];
}

async function ensureMembership(personId: string, clientId: string): Promise<void> {
  await rest<unknown>('person_client_memberships?on_conflict=person_id,client_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([
      {
        person_id: personId,
        client_id: clientId,
        role: 'client_viewer',
      },
    ]),
  });
}

async function verifySponsors(organization: string, sponsors: SponsorSeed[]): Promise<void> {
  for (const sponsor of sponsors) {
    const person = await findPerson(sponsor.email, sponsor.name, organization);
    if (!person) {
      throw new Error(`Verification failed: ${sponsor.name} not found in ${organization}`);
    }

    const style = (person.communication_style ?? {}) as Record<string, unknown>;
    const requiredFields = ['title', 'cxo_function', 'unit', 'primary_focus'] as const;
    const missing = requiredFields.filter((field) => {
      const value = style[field];
      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missing.length > 0) {
      throw new Error(`Verification failed: ${sponsor.name} missing communication_style fields ${missing.join(', ')}`);
    }
  }
}

async function upsertSponsor(seed: OrgSeed, client: ClientRow, sponsor: SponsorSeed): Promise<'created' | 'updated'> {
  const organization = seed.organizationForClient(client.name);
  const existing = await findPerson(sponsor.email, sponsor.name, organization);
  const communicationStyle = {
    ...((existing?.communication_style ?? {}) as Record<string, unknown>),
    title: sponsor.title,
    cxo_function: sponsor.cxoFunction,
    unit: sponsor.unit,
    primary_focus: sponsor.primaryFocus,
  };

  const payload = {
    graph_node_id: `person_${seed.key}_${slugify(sponsor.name)}`,
    name: sponsor.name,
    email: sponsor.email,
    role: sponsor.title,
    organization,
    familiarity: 'first_meeting',
    communication_style: communicationStyle,
    working_rhythm: {},
    personal_threads: [],
    primary_role: 'client_viewer',
  };

  const row = existing
    ? await updatePerson(existing.id, payload)
    : await createPerson(payload);

  await ensureMembership(row.id, client.id);
  return existing ? 'updated' : 'created';
}

async function seedOrg(seed: OrgSeed): Promise<void> {
  const client = await findClient(seed);
  if (!client) {
    throw new Error(
      `Could not find a client row for ${seed.label}. Tried: ${seed.clientNameCandidates.join(', ')}`,
    );
  }

  const organization = seed.organizationForClient(client.name);
  console.log(`\n▸ ${seed.label} slot -> client "${client.name}" -> organization "${organization}"`);

  let created = 0;
  let updated = 0;

  for (const sponsor of seed.sponsors) {
    const result = await upsertSponsor(seed, client, sponsor);
    if (result === 'created') created += 1;
    else updated += 1;

    console.log(`  ${result === 'created' ? '+' : '↺'} ${sponsor.name} · ${sponsor.title}`);
  }

  await verifySponsors(organization, seed.sponsors);
  console.log(`  ✓ verified ${seed.sponsors.length} sponsor candidates with title/cxo_function/unit/primary_focus`);
  console.log(`  ✓ summary · created=${created} updated=${updated}`);
}

async function main(): Promise<void> {
  loadLocalEnv();
  requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  // The active-client layer still supports the legacy "arcturus" key.
  // On main today that key resolves to First Capital aliases, so this seed
  // enriches whichever alias is present without creating a duplicate client.
  for (const seed of ORG_SEEDS) {
    await seedOrg(seed);
  }

  console.log('\nDone.');
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
