import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  TENANTS,
  type TenantConfig,
  type TenantKey,
  type ParsedTenantSeed,
  loadSeedEnv,
  createSeedClient,
  parseTenantSeed,
  slugify,
} from './seed-wave-lib';

type ClientRole = 'client_viewer';

interface ClientRow {
  id: string;
  name: string;
  legal_name: string | null;
  industry_code: string | null;
}

interface PersonRow {
  id: string;
  name: string;
}

const ORG_CATEGORIES = [
  'source_document',
  'company_profile',
  'role_taxonomy',
  'org_units',
  'people_roster',
  'reporting_relationships',
  'subsidiary_structure',
  'regulatory_environment',
  'vip_profiles',
  'strategic_priorities',
  'active_initiatives',
  'vendor_landscape',
  'active_patterns',
  'benchmark_data',
  'industry_external_sources',
  'prior_program_history',
  'data_room_inventory',
];

function parseTenantArgs(argv: string[]): TenantConfig[] {
  const idx = argv.findIndex((arg) => arg === '--tenant' || arg === '--tenants');
  if (idx < 0) return Object.values(TENANTS);
  const raw = argv[idx + 1] ?? '';
  const requested = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean) as TenantKey[];
  if (requested.length === 0) return Object.values(TENANTS);
  return requested.map((key) => {
    const tenant = TENANTS[key];
    if (!tenant) {
      throw new Error(`Unknown tenant "${key}". Expected one of: ${Object.keys(TENANTS).join(', ')}`);
    }
    return tenant;
  });
}

async function ensureClient(sb: SupabaseClient, tenant: TenantConfig): Promise<ClientRow> {
  const existing = await findClient(sb, tenant);
  if (existing) {
    const { error: updateError } = await sb
      .from('clients')
      .update({
        legal_name: tenant.legalName,
        industry_code: tenant.industryCode,
      })
      .eq('id', existing.id);
    if (updateError) throw updateError;
    return { ...existing, legal_name: tenant.legalName, industry_code: tenant.industryCode };
  }

  const { data: created, error: insertError } = await sb
    .from('clients')
    .insert({
      name: tenant.shortName,
      legal_name: tenant.legalName,
      industry_code: tenant.industryCode,
    })
    .select('id, name, legal_name, industry_code')
    .single();
  if (insertError || !created) throw insertError ?? new Error(`Failed to create client ${tenant.shortName}`);
  return created as ClientRow;
}

async function findClient(sb: SupabaseClient, tenant: TenantConfig): Promise<ClientRow | undefined> {
  for (const field of [
    { column: 'name', value: tenant.shortName },
    { column: 'name', value: tenant.canonicalName },
    { column: 'legal_name', value: tenant.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, legal_name, industry_code')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  return undefined;
}

async function replaceOrgCategory(
  sb: SupabaseClient,
  orgId: string,
  category: string,
  content: Record<string, unknown>,
  fileName: string,
): Promise<void> {
  const { error: deleteError } = await sb.from('org_master_data').delete().eq('org_id', orgId).eq('category', category);
  if (deleteError) throw deleteError;
  const { error: insertError } = await sb.from('org_master_data').insert({
    org_id: orgId,
    category,
    sensitivity_tier: category === 'vip_profiles' ? 2 : 1,
    content,
    file_name: fileName,
    file_size_bytes: Buffer.byteLength(JSON.stringify(content), 'utf8'),
    approved_by: 'codex-seed-wave',
  });
  if (insertError) throw insertError;
}

async function upsertPerson(
  sb: SupabaseClient,
  tenant: TenantConfig,
  clientId: string,
  person: ParsedTenantSeed['people'][number],
): Promise<PersonRow> {
  const email = buildEmail(tenant, person.name);
  const graphNodeId = `person_${tenant.key}_${slugify(person.name)}`;
  const organization = tenant.canonicalName;
  const profileNotes = [person.profileBody, person.abbreviatedSummary].filter(Boolean);

  const { data: existing, error } = await sb
    .from('persons')
    .select('id, name')
    .or(`email.eq.${email},and(name.eq.${person.name},organization.eq.${organization})`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  const payload = {
    graph_node_id: graphNodeId,
    name: person.name,
    email,
    role: person.role,
    organization,
    familiarity: 'first_meeting',
    communication_style: profileNotes.length > 0 ? { seed_profile: profileNotes.join(' ') } : {},
    working_rhythm: {},
    personal_threads: [],
    primary_role: 'client_viewer' as ClientRole,
  };

  if (existing?.id) {
    const { error: updateError } = await sb.from('persons').update(payload).eq('id', existing.id);
    if (updateError) throw updateError;
    await ensureMembership(sb, existing.id, clientId);
    return existing as PersonRow;
  }

  const { data: created, error: insertError } = await sb
    .from('persons')
    .insert(payload)
    .select('id, name')
    .single();
  if (insertError || !created) throw insertError ?? new Error(`Failed to insert person ${person.name}`);
  await ensureMembership(sb, (created as PersonRow).id, clientId);
  return created as PersonRow;
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

async function upsertVipProfile(
  sb: SupabaseClient,
  tenant: TenantConfig,
  personId: string | null,
  vip: ParsedTenantSeed['vips'][number],
  sponsoredInitiatives: string[],
): Promise<void> {
  const quotes = vip.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('> '))
    .map((line) => line.replace(/^>\s*/, ''));
  const knownConcerns = vip.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').replace(/\*\*/g, '').trim());

  const communicationStyle = extractLabeledBody(vip.body, 'Communication style');
  const strategicPriorities = extractLabeledBody(vip.body, 'Strategic priorities');
  const background = extractLabeledBody(vip.body, 'Background');

  const payload = {
    person_id: personId,
    display_name: vip.name,
    current_title: vip.role,
    current_company: tenant.canonicalName,
    current_industry: tenant.vertical,
    current_company_scale: tenant.companyScale,
    career_history: background ? [{ summary: background }] : [],
    education: [],
    board_seats: [],
    current_initiatives: [...sponsoredInitiatives],
    areas_of_expertise: deriveExpertise(vip.role, tenant),
    recent_public_signals: quotes.map((quote) => ({ type: 'quote', text: quote })),
    company_principles: strategicPriorities ? [strategicPriorities] : [],
    labor_model: 'Composite tenant seed',
    cloud_posture: 'See source seed document',
    communication_style: communicationStyle ? { summary: communicationStyle } : {},
    builder_vs_buyer: 'mixed',
    known_concerns: knownConcerns,
    demo_tier: 'standard',
    relationship_to_abarva: 'composite client seed',
    avoid_topics: [],
    emphasize_topics: [],
    curated_by: 'codex',
    confidence: 'high',
    source_urls: [tenant.specPath],
  };

  const { data: existing, error } = await sb
    .from('vip_profiles')
    .select('id')
    .eq('display_name', vip.name)
    .maybeSingle();
  if (error) throw error;

  if (existing?.id) {
    const { error: updateError } = await sb.from('vip_profiles').update(payload).eq('id', existing.id);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await sb.from('vip_profiles').insert(payload);
  if (insertError) throw insertError;
}

async function replaceBenchmarkHistory(
  sb: SupabaseClient,
  clientId: string,
  benchmarks: ParsedTenantSeed['benchmarks'],
): Promise<number> {
  const { error: deleteError } = await sb.from('benchmark_history').delete().eq('client_id', clientId);
  if (deleteError) {
    if (isMissingTableError(deleteError)) return 0;
    throw deleteError;
  }

  const rows = benchmarks
    .filter((benchmark) => benchmark.clientValue !== null)
    .map((benchmark) => ({
      client_id: clientId,
      metric_name: benchmark.title,
      value: benchmark.clientValue,
      peer_median: benchmark.peerMedian,
      date: new Date().toISOString().slice(0, 10),
      source: benchmark.sourceAttribution.join('; ') || 'Composite seed spec',
    }));

  if (rows.length === 0) return 0;
  const { error: insertError } = await sb.from('benchmark_history').insert(rows);
  if (insertError) {
    if (isMissingTableError(insertError)) return 0;
    throw insertError;
  }
  return rows.length;
}

async function replaceKnowledgeSources(
  sb: SupabaseClient,
  parsed: ParsedTenantSeed,
  client: ClientRow,
): Promise<number> {
  const prefix = `seed_wave_${parsed.tenant.key}`;
  const { error: deleteError } = await sb
    .from('knowledge_sources')
    .delete()
    .like('source_key', `${prefix}%`);
  if (deleteError) throw deleteError;

  const rows = [
    {
      source_key: `${prefix}_overview`,
      title: `${parsed.tenant.canonicalName} overview`,
      content_type: 'case_study',
      topic_tags: ['overview', parsed.tenant.key, parsed.tenant.vertical],
      source_url: `https://abarva.local/seed/${parsed.tenant.key}/overview`,
    },
    ...parsed.patterns.map((pattern) => ({
      source_key: `${prefix}_pattern_${slugify(pattern.title)}`,
      title: `${parsed.tenant.canonicalName} pattern · ${pattern.title}`,
      content_type: 'case_study',
      topic_tags: ['pattern', parsed.tenant.key, slugify(pattern.title)],
      source_url: `https://abarva.local/seed/${parsed.tenant.key}/patterns/${slugify(pattern.title)}`,
    })),
    ...parsed.initiatives.map((initiative) => ({
      source_key: `${prefix}_initiative_${slugify(initiative.title)}`,
      title: `${parsed.tenant.canonicalName} initiative · ${initiative.title}`,
      content_type: 'research_report',
      topic_tags: ['initiative', parsed.tenant.key, slugify(initiative.title)],
      source_url: `https://abarva.local/seed/${parsed.tenant.key}/initiatives/${slugify(initiative.title)}`,
    })),
    ...parsed.benchmarks.map((benchmark) => ({
      source_key: `${prefix}_benchmark_${slugify(benchmark.title)}`,
      title: `${parsed.tenant.canonicalName} benchmark · ${benchmark.title}`,
      content_type: 'benchmark',
      topic_tags: ['benchmark', parsed.tenant.key, slugify(benchmark.title)],
      source_url: `https://abarva.local/seed/${parsed.tenant.key}/benchmarks/${slugify(benchmark.title)}`,
    })),
    ...parsed.externalDataSources.map((source) => ({
      source_key: `${prefix}_external_${slugify(source)}`,
      title: `${parsed.tenant.canonicalName} external source · ${source}`,
      content_type: 'research_report',
      topic_tags: ['external_source', parsed.tenant.key, parsed.tenant.vertical],
      source_url: `https://abarva.local/seed/${parsed.tenant.key}/external/${slugify(source)}`,
    })),
  ].map((row) => ({
    ...row,
    publisher: 'AbarVa Composite Seed',
    publisher_url: null,
    license_class: 'attribution',
    license_notes: 'Internal composite tenant seed',
    industry_tags: [client.industry_code ?? parsed.tenant.industryTag],
    published_at: new Date().toISOString().slice(0, 10),
    half_life_days: 365,
    chunk_count: 0,
    pinecone_namespace: `seed-wave-${parsed.tenant.key}`,
    status: 'active',
    ingestion_notes: {
      seed_wave: true,
      tenant: parsed.tenant.key,
      canonical_name: parsed.tenant.canonicalName,
    },
  }));

  if (rows.length === 0) return 0;
  const { error: insertError } = await sb.from('knowledge_sources').insert(rows);
  if (insertError) throw insertError;
  return rows.length;
}

async function upsertPriorPrograms(
  sb: SupabaseClient,
  parsed: ParsedTenantSeed,
  clientId: string,
  personIdsByName: Map<string, string>,
): Promise<number> {
  let count = 0;

  for (const [index, program] of parsed.priorPrograms.entries()) {
    const sponsorName = extractSponsorName(program.sponsor);
    const sponsorId = sponsorName ? personIdsByName.get(sponsorName.toLowerCase()) ?? null : null;
    const graphNodeId = `eng_seed_wave_${parsed.tenant.key}_${index + 1}_${slugify(program.title)}`;
    const currentPhase = program.phases?.includes('0-4') ? 4 : 4;
    const status = /completed/i.test(program.phases ?? '') && !/in progress/i.test(program.phases ?? '') ? 'completed' : 'active';
    const payload = {
      graph_node_id: graphNodeId,
      name: program.title,
      industry_code: parsed.tenant.industryCode,
      function_code: 'ENTERPRISE',
      objective_code: 'TRANSFORMATION',
      client_id: clientId,
      sponsor_person_id: sponsorId,
      current_phase: currentPhase,
      status,
      deliverables: program.outcomes.map((outcome) => ({ title: outcome, source: 'seed_wave' })),
      decisions: [],
      sponsor_approvals: [],
    };

    const { data: existing, error } = await sb
      .from('engagements')
      .select('id')
      .eq('graph_node_id', graphNodeId)
      .maybeSingle();
    if (error) throw error;

    if (existing?.id) {
      const { error: updateError } = await sb.from('engagements').update(payload).eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await sb.from('engagements').insert(payload);
      if (insertError) throw insertError;
    }
    count += 1;
  }

  return count;
}

function personRoleForName(parsed: ParsedTenantSeed, name: string): string | null {
  return parsed.people.find((person) => person.name.toLowerCase() === name.toLowerCase())?.role ?? null;
}

function extractSponsorName(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(' with ')[0].trim();
  return first.split('(')[0].trim();
}

function deriveOrgUnits(parsed: ParsedTenantSeed): Array<Record<string, unknown>> {
  const chiefExecutive = parsed.people.find((person) => /Chief Executive Officer|President and Chief Executive Officer|CEO/i.test(person.role));
  const root = chiefExecutive?.name ?? parsed.tenant.canonicalName;
  return parsed.people.map((person) => ({
    leader: person.name,
    title: person.role,
    parent: person.reportsToName ?? (person.name === root ? null : root),
    function_group: person.functionGroup ?? person.role,
  }));
}

function deriveRoleTaxonomy(parsed: ParsedTenantSeed): Array<Record<string, unknown>> {
  const uniqueRoles = [...new Set(parsed.people.map((person) => person.role))];
  return uniqueRoles.map((role) => ({
    role,
    executive: /^Chief|^President|CEO|CFO|COO|CMO|CIO|CDO|General Counsel/i.test(role),
  }));
}

function deriveReportingRelationships(parsed: ParsedTenantSeed): Array<Record<string, unknown>> {
  return parsed.people
    .filter((person) => person.reportsToName)
    .map((person) => ({
      person: person.name,
      reports_to: person.reportsToName,
      role: person.role,
    }));
}

function extractLabeledBody(body: string, label: string): string | null {
  const match = body.match(new RegExp(`\\*\\*${label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\.?\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n### |\\n## |$)`));
  return match?.[1]?.replace(/\n+/g, ' ').trim() ?? null;
}

function deriveExpertise(role: string, tenant: TenantConfig): string[] {
  return [...new Set([role, tenant.vertical, tenant.canonicalName])];
}

function buildEmail(tenant: TenantConfig, name: string): string {
  const slug = slugify(name).replace(/_/g, '.');
  return `${slug}@${tenant.domain}`;
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || /Could not find the table/i.test(error.message ?? '');
}

async function seedTenant(sb: SupabaseClient, tenant: TenantConfig): Promise<void> {
  const parsed = parseTenantSeed(tenant);
  const client = await ensureClient(sb, tenant);

  const peopleRows = new Map<string, string>();
  for (const person of parsed.people) {
    const row = await upsertPerson(sb, tenant, client.id, person);
    peopleRows.set(person.name.toLowerCase(), row.id);
  }

  for (const vip of parsed.vips) {
    const personId = peopleRows.get(vip.name.toLowerCase()) ?? null;
    const sponsoredInitiatives = parsed.initiatives
      .filter((initiative) => (initiative.sponsorLine ?? '').toLowerCase().includes(vip.name.toLowerCase()))
      .map((initiative) => initiative.title);
    await upsertVipProfile(sb, tenant, personId, vip, sponsoredInitiatives);
  }

  const categories: Array<[string, Record<string, unknown>]> = [
    ['source_document', { tenant: tenant.key, canonical_name: tenant.canonicalName, markdown: parsed.markdown }],
    ['company_profile', { tenant: tenant.key, canonical_name: tenant.canonicalName, section: parsed.sections['Part 1'] ?? '', company_scale: tenant.companyScale }],
    ['role_taxonomy', { roles: deriveRoleTaxonomy(parsed) }],
    ['org_units', { units: deriveOrgUnits(parsed) }],
    ['people_roster', { people: parsed.people }],
    ['reporting_relationships', { relationships: deriveReportingRelationships(parsed) }],
    ['subsidiary_structure', { subsidiaries: parsed.subsidiaries }],
    ['regulatory_environment', { regulators: parsed.regulators }],
    ['vip_profiles', { vip_profiles: parsed.vips.map((vip) => ({ name: vip.name, role: vip.role })) }],
    ['strategic_priorities', { priorities: parsed.priorities }],
    ['active_initiatives', { initiatives: parsed.initiatives }],
    ['vendor_landscape', { vendors: parsed.vendors }],
    ['active_patterns', { patterns: parsed.patterns }],
    ['benchmark_data', { benchmarks: parsed.benchmarks }],
    ['industry_external_sources', { sources: parsed.externalDataSources }],
    ['prior_program_history', { programs: parsed.priorPrograms }],
    ['data_room_inventory', { section: parsed.sections[tenant.parts.dataRoom] ?? '' }],
  ];

  for (const [category, content] of categories) {
    await replaceOrgCategory(sb, client.id, category, content, path.basename(tenant.specPath));
  }

  const benchmarkCount = await replaceBenchmarkHistory(sb, client.id, parsed.benchmarks);
  const knowledgeCount = await replaceKnowledgeSources(sb, parsed, client);
  const programCount = await upsertPriorPrograms(sb, parsed, client.id, peopleRows);

  console.log(`\n${tenant.canonicalName}`);
  console.log(`  client row     · ${client.id} (${client.name} / ${client.legal_name ?? '—'})`);
  console.log(`  people         · ${parsed.people.length}`);
  console.log(`  vip profiles   · ${parsed.vips.length}`);
  console.log(`  initiatives    · ${parsed.initiatives.length}`);
  console.log(`  patterns       · ${parsed.patterns.length}`);
  console.log(`  benchmarks     · ${benchmarkCount}`);
  console.log(`  prior programs · ${programCount}`);
  console.log(`  knowledge rows · ${knowledgeCount}`);
}

async function main() {
  loadSeedEnv();
  const tenants = parseTenantArgs(process.argv.slice(2));
  const sb = createSeedClient();
  for (const tenant of tenants) {
    await seedTenant(sb, tenant);
  }
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
