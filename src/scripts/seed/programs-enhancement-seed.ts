import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { buildAllProgramsSeedPlan, type ProgramSeedPlan, type TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { TENANT_PORTFOLIOS, validateProgramsSeedEnhancementSpec, type TenantPortfolioSeed } from '@/lib/programs/enhancement-spec';
import {
  buildDeliverablePayload,
  buildDeliverableTypePayload,
  buildDeliverableVersionPayload,
  buildProgramPayload,
  buildSeedClientPayload,
  clientAliasesForPortfolio,
  filterProgramsSeedPlan,
  titleForDeliverableInstance,
  type FilteredProgramsSeedPlan,
  type SeedWriteFilters,
} from '@/lib/programs/enhancement-seed-writer';
import { writeSeedIntegrityReport } from '@/lib/integrity/seed-integrity-report';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

interface WriteCounts {
  clientsInserted: number;
  clientsUpdated: number;
  deliverableTypesInserted: number;
  deliverableTypesUpdated: number;
  programsInserted: number;
  programsUpdated: number;
  deliverablesInserted: number;
  deliverablesUpdated: number;
  versionsInsertedOrUpdated: number;
}

interface ClientResolution {
  id: string;
  name: string;
  inserted: boolean;
}

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const shouldPrintJson = args.includes('--json');

function parseFilters(): SeedWriteFilters {
  return {
    tenantKeys: readCsvArg('--tenant'),
    programCodes: readCsvArg('--program'),
    includeStubs: !args.includes('--no-stubs'),
  };
}

function readCsvArg(flag: string): string[] | undefined {
  const prefix = `${flag}=`;
  const value = args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  if (!value) return undefined;
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function getSeedClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required for --write');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function portfolioForTenant(tenantKey: string): TenantPortfolioSeed {
  const portfolio = TENANT_PORTFOLIOS.find((entry) => entry.tenantKey === tenantKey);
  if (!portfolio) throw new Error(`No source portfolio found for tenant ${tenantKey}`);
  return portfolio;
}

async function ensureClient(sb: SupabaseClient, sourcePortfolio: TenantPortfolioSeed): Promise<ClientResolution> {
  const aliases = clientAliasesForPortfolio(sourcePortfolio);
  const payload = buildSeedClientPayload(sourcePortfolio);
  const { data: existingRows, error: lookupError } = await sb.from('clients').select('id, name').in('name', aliases);
  if (lookupError) throw new Error(`client lookup ${sourcePortfolio.tenantKey}: ${lookupError.message}`);

  const existing = aliases
    .map((alias) => (existingRows as Array<{ id: string; name: string }> | null)?.find((row) => row.name === alias))
    .find(Boolean);

  if (existing) {
    const { error } = await sb
      .from('clients')
      .update({
        legal_name: payload.legal_name,
        industry_code: payload.industry_code,
      })
      .eq('id', existing.id);
    if (error) throw new Error(`client update ${existing.name}: ${error.message}`);
    return { id: existing.id, name: existing.name, inserted: false };
  }

  const { data: inserted, error } = await sb
    .from('clients')
    .insert(payload)
    .select('id, name')
    .single();
  if (error || !inserted) throw new Error(`client insert ${payload.name}: ${error?.message ?? 'no row returned'}`);
  const row = inserted as { id: string; name: string };
  return { id: row.id, name: row.name, inserted: true };
}

async function upsertDeliverableTypes(sb: SupabaseClient, plan: FilteredProgramsSeedPlan, counts: WriteCounts): Promise<void> {
  for (const seedType of plan.deliverableTypes) {
    const payload = buildDeliverableTypePayload(seedType);
    const { data: existing, error: lookupError } = await sb
      .from('deliverable_types')
      .select('id')
      .eq('type_key', payload.type_key)
      .maybeSingle();
    if (lookupError) throw new Error(`deliverable_type lookup ${payload.type_key}: ${lookupError.message}`);

    if (existing) {
      const { error } = await sb.from('deliverable_types').update(payload).eq('id', (existing as { id: string }).id);
      if (error) throw new Error(`deliverable_type update ${payload.type_key}: ${error.message}`);
      counts.deliverableTypesUpdated += 1;
    } else {
      const { error } = await sb.from('deliverable_types').insert(payload);
      if (error) throw new Error(`deliverable_type insert ${payload.type_key}: ${error.message}`);
      counts.deliverableTypesInserted += 1;
    }
  }
}

async function upsertProgram(sb: SupabaseClient, tenant: TenantSeedPlan, program: ProgramSeedPlan, clientId: string, nowIso: string, counts: WriteCounts): Promise<string> {
  const payload = buildProgramPayload(tenant, program, clientId, nowIso);
  const { data: existing, error: lookupError } = await sb
    .from('engagements')
    .select('id')
    .eq('graph_node_id', payload.graph_node_id)
    .maybeSingle();
  if (lookupError) throw new Error(`program lookup ${payload.graph_node_id}: ${lookupError.message}`);

  if (existing) {
    const id = (existing as { id: string }).id;
    const { error } = await sb.from('engagements').update(payload).eq('id', id);
    if (error) throw new Error(`program update ${payload.graph_node_id}: ${error.message}`);
    counts.programsUpdated += 1;
    return id;
  }

  const { data: inserted, error } = await sb
    .from('engagements')
    .insert(payload)
    .select('id')
    .single();
  if (error || !inserted) throw new Error(`program insert ${payload.graph_node_id}: ${error?.message ?? 'no row returned'}`);
  counts.programsInserted += 1;
  return (inserted as { id: string }).id;
}

async function upsertDeliverables(
  sb: SupabaseClient,
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  engagementId: string,
  nowIso: string,
  counts: WriteCounts,
): Promise<void> {
  for (const deliverable of program.deliverables) {
    const payload = buildDeliverablePayload(deliverable, engagementId, nowIso);
    const { data: existingRows, error: lookupError } = await sb
      .from('deliverables_v2')
      .select('id')
      .eq('engagement_id', engagementId)
      .eq('deliverable_type_key', payload.deliverable_type_key)
      .eq('title', payload.title)
      .order('created_at', { ascending: true })
      .limit(1);
    if (lookupError) throw new Error(`deliverable lookup ${program.graphNodeId}/${payload.deliverable_type_key}: ${lookupError.message}`);

    const existing = (existingRows as Array<{ id: string }> | null)?.[0];
    const deliverableId = existing
      ? existing.id
      : await insertDeliverable(sb, payload, `${program.graphNodeId}/${payload.deliverable_type_key}`, counts);

    if (existing) {
      const { error } = await sb.from('deliverables_v2').update(payload).eq('id', deliverableId);
      if (error) throw new Error(`deliverable update ${program.graphNodeId}/${payload.deliverable_type_key}: ${error.message}`);
      counts.deliverablesUpdated += 1;
    }

    const versionPayload = buildDeliverableVersionPayload(tenant, program, deliverable, deliverableId);
    const { error: versionError } = await sb
      .from('deliverable_versions')
      .upsert(versionPayload, { onConflict: 'deliverable_id,version' });
    if (versionError) throw new Error(`deliverable version upsert ${program.graphNodeId}/${payload.deliverable_type_key}: ${versionError.message}`);
    counts.versionsInsertedOrUpdated += 1;
  }
}

async function insertDeliverable(sb: SupabaseClient, payload: ReturnType<typeof buildDeliverablePayload>, label: string, counts: WriteCounts): Promise<string> {
  const { data: inserted, error } = await sb
    .from('deliverables_v2')
    .insert(payload)
    .select('id')
    .single();
  if (error || !inserted) throw new Error(`deliverable insert ${label}: ${error?.message ?? 'no row returned'}`);
  counts.deliverablesInserted += 1;
  return (inserted as { id: string }).id;
}

async function writePlan(plan: FilteredProgramsSeedPlan): Promise<WriteCounts> {
  const sb = getSeedClient();
  const nowIso = new Date().toISOString();
  const counts: WriteCounts = {
    clientsInserted: 0,
    clientsUpdated: 0,
    deliverableTypesInserted: 0,
    deliverableTypesUpdated: 0,
    programsInserted: 0,
    programsUpdated: 0,
    deliverablesInserted: 0,
    deliverablesUpdated: 0,
    versionsInsertedOrUpdated: 0,
  };

  await upsertDeliverableTypes(sb, plan, counts);

  for (const tenant of plan.tenants) {
    const client = await ensureClient(sb, portfolioForTenant(tenant.tenantKey));
    if (client.inserted) counts.clientsInserted += 1;
    else counts.clientsUpdated += 1;

    for (const program of tenant.programs) {
      const engagementId = await upsertProgram(sb, tenant, program, client.id, nowIso, counts);
      await removeLegacyCollapsedSeedDeliverables(sb, program, engagementId);
      await upsertDeliverables(sb, tenant, program, engagementId, nowIso, counts);
    }
  }

  return counts;
}

async function removeLegacyCollapsedSeedDeliverables(sb: SupabaseClient, program: ProgramSeedPlan, engagementId: string): Promise<void> {
  const legacyTitles = Array.from(
    new Set(program.deliverables.map((deliverable) => `${deliverable.deliverableCode} · ${deliverable.title}`)),
  );
  const currentTitles = new Set(program.deliverables.map(titleForDeliverableInstance));
  const staleTitles = legacyTitles.filter((title) => !currentTitles.has(title));
  if (staleTitles.length === 0) return;

  const { data: staleRows, error: lookupError } = await sb
    .from('deliverables_v2')
    .select('id')
    .eq('engagement_id', engagementId)
    .in('title', staleTitles);
  if (lookupError) throw new Error(`legacy deliverable lookup ${program.graphNodeId}: ${lookupError.message}`);

  const staleIds = ((staleRows as Array<{ id: string }> | null) ?? []).map((row) => row.id);
  if (staleIds.length === 0) return;

  const { error: versionDeleteError } = await sb.from('deliverable_versions').delete().in('deliverable_id', staleIds);
  if (versionDeleteError) throw new Error(`legacy deliverable version cleanup ${program.graphNodeId}: ${versionDeleteError.message}`);

  const { error: deliverableDeleteError } = await sb.from('deliverables_v2').delete().in('id', staleIds);
  if (deliverableDeleteError) throw new Error(`legacy deliverable cleanup ${program.graphNodeId}: ${deliverableDeleteError.message}`);
}

function printPlan(plan: FilteredProgramsSeedPlan): void {
  console.log(`Programs enhancement seed ${shouldWrite ? 'writer' : 'dry run'}`);
  console.log('──────────────────────────────────────');
  console.log(`Mode:                   ${shouldWrite ? 'WRITE' : 'dry-run only'}`);
  console.log(`Tenants:                ${plan.summary.tenants}`);
  console.log(`Clients ensured:         ${plan.summary.clients}`);
  console.log(`Deliverable types:       ${plan.summary.deliverableTypes}`);
  console.log(`Programs:                ${plan.summary.programs}`);
  console.log(`Deliverables:            ${plan.summary.deliverables}`);
  console.log(`Deliverable versions:    ${plan.summary.deliverableVersions}`);
  console.log(`Rich / Outline / Stub:   ${plan.summary.richDeliverables} / ${plan.summary.outlineDeliverables} / ${plan.summary.stubDeliverables}`);
  console.log('\nTenants');
  for (const tenant of plan.tenants) {
    const deliverableCount = tenant.programs.reduce((sum, program) => sum + program.deliverables.length, 0);
    console.log(`- ${tenant.displayName} (${tenant.tenantKey}) · ${tenant.programs.length} programs · ${deliverableCount} deliverables`);
  }
  console.log('\nSafety');
  console.log(shouldWrite ? '- --write supplied: database rows will be inserted/updated.' : '- No database writes. Add --write to execute.');
  console.log('- Reruns are idempotent by graph_node_id, deliverable type key, and deliverable version 1.');
}

async function main(): Promise<void> {
  const validation = validateProgramsSeedEnhancementSpec();
  const filters = parseFilters();
  const plan = filterProgramsSeedPlan(buildAllProgramsSeedPlan(), filters);
  const integrityReport = writeSeedIntegrityReport(plan, validation, {
    mode: shouldWrite ? 'write' : 'dry-run',
    filters,
    timestamp: process.env.REPORT_TIMESTAMP,
  });

  if (validation.errors.length) {
    throw new Error(`Spec validation failed:\n${validation.errors.map((entry) => `- ${entry}`).join('\n')}`);
  }

  if (shouldPrintJson && !shouldWrite) {
    console.log(JSON.stringify({ mode: 'dry-run', plan, validation, integrityReportPath: integrityReport.path }, null, 2));
    return;
  }

  printPlan(plan);
  console.log(`\nSeed integrity report: ${integrityReport.path}`);

  if (validation.warnings.length) {
    console.log('\nWarnings');
    for (const warning of validation.warnings) console.log(`- ${warning}`);
  }

  if (!shouldWrite) return;

  const counts = await writePlan(plan);
  if (shouldPrintJson) {
    console.log(JSON.stringify({ mode: 'write', counts, validation, integrityReportPath: integrityReport.path }, null, 2));
    return;
  }

  console.log('\nWrite complete');
  console.log(`- Clients inserted/updated:           ${counts.clientsInserted}/${counts.clientsUpdated}`);
  console.log(`- Deliverable types inserted/updated: ${counts.deliverableTypesInserted}/${counts.deliverableTypesUpdated}`);
  console.log(`- Programs inserted/updated:          ${counts.programsInserted}/${counts.programsUpdated}`);
  console.log(`- Deliverables inserted/updated:      ${counts.deliverablesInserted}/${counts.deliverablesUpdated}`);
  console.log(`- Versions upserted:                  ${counts.versionsInsertedOrUpdated}`);
}

main().catch((error) => {
  console.error('FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});
