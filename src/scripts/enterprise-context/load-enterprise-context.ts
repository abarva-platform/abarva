import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
  retargetEnterpriseContextIngestionPlan,
  type EnterpriseContextIngestionPlan,
  type PlannedEnterpriseContextRecord,
} from '../../lib/enterprise-context/ingestion/meridian-loader';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

type DbRow = Record<string, unknown>;

type Args = {
  apply: boolean;
  sourceRoot: string;
  tenantKey: string;
};

type ClientProfile = {
  tenantKey: string;
  sourceRoot: string;
  name: string;
  legalName: string;
  industryCode: string;
  slugs: string[];
  aliases: string[];
};

const CLIENT_PROFILES: Record<string, ClientProfile> = {
  'meridian-health': {
    tenantKey: 'meridian-health',
    sourceRoot: 'docs/enterprise-context/generated/meridian-vnext',
    name: 'Meridian Health System',
    legalName: 'Meridian Health System',
    industryCode: 'healthcare_provider',
    slugs: ['meridian-health', 'meridian'],
    aliases: ['Meridian Health', 'Meridian Health System'],
  },
  meridian: {
    tenantKey: 'meridian',
    sourceRoot: 'docs/enterprise-context/synthetic/meridian',
    name: 'Meridian Health System',
    legalName: 'Meridian Health System',
    industryCode: 'healthcare',
    slugs: ['meridian'],
    aliases: ['Meridian Health', 'Meridian Health System'],
  },
  apexretail: {
    tenantKey: 'apexretail',
    sourceRoot: 'docs/enterprise-context/synthetic/apexretail',
    name: 'Apex Retail',
    legalName: 'Apex Retail Group',
    industryCode: 'retail',
    slugs: ['apex-retail', 'apexretail'],
    aliases: ['Apex Retail', 'Apex Retail Group'],
  },
  arcturus: {
    tenantKey: 'arcturus',
    sourceRoot: 'docs/enterprise-context/synthetic/arcturus',
    name: 'First Capital',
    legalName: 'First Capital Financial Group',
    industryCode: 'financial_services',
    slugs: ['first-capital', 'first-capital-financial', 'arcturus'],
    aliases: ['First Capital', 'First Capital Financial', 'First Capital Financial Group'],
  },
};

function profileForTenant(tenantKey: string): ClientProfile {
  const profile = CLIENT_PROFILES[tenantKey];
  if (!profile) throw new Error(`Unsupported tenant ${tenantKey}. Expected one of: ${Object.keys(CLIENT_PROFILES).join(', ')}`);
  return profile;
}

function importedByFor(tenantKey: string): string {
  return `${profileForTenant(tenantKey).legalName} Enterprise Context synthetic Day One import`;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf('--source');
  const sourceEquals = args.find((arg) => arg.startsWith('--source='));
  const tenantKey = args.find((arg) => arg.startsWith('--tenant='))?.split('=')[1] ?? 'meridian';
  const sourceRoot = sourceEquals
    ? path.resolve(sourceEquals.split('=')[1] ?? '')
    : sourceIdx >= 0
      ? path.resolve(args[sourceIdx + 1])
      : path.resolve(process.cwd(), profileForTenant(tenantKey).sourceRoot);
  return {
    apply: args.includes('--apply'),
    sourceRoot,
    tenantKey,
  };
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply enterprise context.');
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findClientIdByColumn(client: SupabaseClient, column: string, values: string[]): Promise<string | null> {
  for (const value of values) {
    const existing = await client
      .from('clients')
      .select('id')
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    if (existing.error) throw new Error(`Client lookup by ${column} failed: ${existing.error.message}`);
    if (existing.data?.id) return existing.data.id as string;
  }
  return null;
}

async function normalizeClientProfile(client: SupabaseClient, clientId: string, profile: ClientProfile): Promise<void> {
  const normalized = await client
    .from('clients')
    .update({
      name: profile.name,
      legal_name: profile.legalName,
      industry_code: profile.industryCode,
      slug: profile.slugs[0],
      tenant_key: profile.tenantKey,
    })
    .eq('id', clientId);
  if (normalized.error) throw new Error(`Client profile normalize failed for ${profile.tenantKey}: ${normalized.error.message}`);
}

async function ensureClientId(client: SupabaseClient, tenantKey: string): Promise<string> {
  const profile = profileForTenant(tenantKey);
  const byTenant = await findClientIdByColumn(client, 'tenant_key', [profile.tenantKey]);
  if (byTenant) {
    await normalizeClientProfile(client, byTenant, profile);
    return byTenant;
  }

  const bySlug = await findClientIdByColumn(client, 'slug', profile.slugs);
  if (bySlug) {
    await normalizeClientProfile(client, bySlug, profile);
    return bySlug;
  }

  const byName = await findClientIdByColumn(client, 'name', profile.aliases);
  if (byName) {
    await normalizeClientProfile(client, byName, profile);
    return byName;
  }

  const byLegalName = await findClientIdByColumn(client, 'legal_name', profile.aliases);
  if (byLegalName) {
    await normalizeClientProfile(client, byLegalName, profile);
    return byLegalName;
  }

  const inserted = await client
    .from('clients')
    .insert({
      name: profile.name,
      legal_name: profile.legalName,
      industry_code: profile.industryCode,
      slug: profile.slugs[0],
      tenant_key: profile.tenantKey,
    })
    .select('id')
    .single();
  if (inserted.error) throw new Error(`Client insert failed for ${tenantKey}: ${inserted.error.message}`);
  return inserted.data.id as string;
}

function dedupeRows(rows: DbRow[], onConflict: string): DbRow[] {
  const conflictKeys = onConflict.split(',').map((key) => key.trim()).filter(Boolean);
  return [...new Map(rows.map((row) => [
    conflictKeys.map((key) => String(row[key] ?? '')).join('\u0000'),
    row,
  ])).values()];
}

async function upsertBatch(client: SupabaseClient, table: string, rows: DbRow[], onConflict: string): Promise<number> {
  const dedupedRows = dedupeRows(rows, onConflict);
  const batchSize = 250;
  for (let i = 0; i < dedupedRows.length; i += batchSize) {
    const batch = dedupedRows.slice(i, i + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  return dedupedRows.length;
}

async function fetchIdMap(
  client: SupabaseClient,
  table: string,
  tenantKey: string,
  keyColumn: string,
  keys: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const uniqueKeys = [...new Set(keys.filter(Boolean))];
  const batchSize = 200;
  for (let i = 0; i < uniqueKeys.length; i += batchSize) {
    const batch = uniqueKeys.slice(i, i + batchSize);
    const { data, error } = await client
      .from(table)
      .select(`id,${keyColumn}`)
      .eq('tenant_key', tenantKey)
      .in(keyColumn, batch);
    if (error) throw new Error(`${table} id lookup failed: ${error.message}`);
    for (const row of (data ?? []) as unknown as DbRow[]) {
      out.set(String(row[keyColumn]), String(row.id));
    }
  }
  return out;
}

function sourceRows(plan: EnterpriseContextIngestionPlan, clientId: string, now: string): DbRow[] {
  const importedBy = importedByFor(plan.tenantKey);
  const profile = profileForTenant(plan.tenantKey);
  return plan.sources.map((source) => ({
    client_id: clientId,
    tenant_key: plan.tenantKey,
    source_system: source.sourceSystem,
    source_key: source.sourceKey,
    source_type: source.sourceSystem === 'day_one_template' ? 'template_workbook' : 'source_system_export',
    display_name: source.displayName,
    system_of_record: source.sourceSystem !== 'day_one_template',
    source_owner: source.sourceOwner,
    steward_owner: 'Enterprise Context Stewardship',
    sync_cadence: source.sourceSystem === 'day_one_template' ? 'manual' : 'weekly',
    tenant_aliases: [profile.tenantKey, ...profile.slugs, ...profile.aliases.map((alias) => alias.toLowerCase().replace(/[^a-z0-9]+/g, '-'))],
    source_status: 'active',
    last_synced_at: now,
    last_validated_at: '2026-05-01',
    confidence: 0.86,
    freshness_status: 'fresh',
    evidence_pointer: `${plan.sourceRoot}/manifest.json`,
    metadata: { imported_by: importedBy },
    updated_at: now,
  }));
}

function sourceFileRows(
  plan: EnterpriseContextIngestionPlan,
  clientId: string,
  sourceIdBySystem: Map<string, string>,
  now: string,
): DbRow[] {
  const importedBy = importedByFor(plan.tenantKey);
  const dayOneSourceId = sourceIdBySystem.get('day_one_template') ?? null;
  return plan.sourceFiles.map((sourceFile) => ({
    client_id: clientId,
    tenant_key: plan.tenantKey,
    source_id: dayOneSourceId,
    source_file_id: sourceFile.sourceFileId,
    source_system: sourceFile.sourceSystem,
    source_file: sourceFile.sourceFile,
    source_path: path.join(plan.sourceRoot, sourceFile.sourceFile),
    workbook_name: sourceFile.workbookName,
    sheet_names: ['Instructions', 'Data Dictionary', 'Data'],
    row_count: sourceFile.rowCount,
    imported_by: importedBy,
    last_synced_at: now,
    last_validated_at: '2026-05-01',
    confidence: 0.86,
    freshness_status: 'fresh',
    evidence_pointer: `${sourceFile.sourceFile}#Data`,
    metadata: { source_root: plan.sourceRoot },
    updated_at: now,
  }));
}

function recordRows(
  plan: EnterpriseContextIngestionPlan,
  clientId: string,
  sourceIdBySystem: Map<string, string>,
  sourceFileIdByFile: Map<string, string>,
  now: string,
): DbRow[] {
  return plan.records.map((record) => ({
    client_id: clientId,
    tenant_key: record.tenantKey,
    canonical_record_id: record.canonicalRecordId,
    record_type: record.recordType,
    title: record.title,
    source_id: sourceIdBySystem.get(record.sourceSystem) ?? null,
    source_file_id: sourceFileIdByFile.get(`${record.tenantKey}:${record.recordType}`) ?? null,
    source_system: record.sourceSystem,
    source_record_id: record.sourceRecordId,
    source_file: record.sourceFile,
    source_sheet: record.sourceSheet,
    source_row_number: record.sourceRowNumber,
    owner: record.owner,
    steward_owner: 'Enterprise Context Stewardship',
    last_synced_at: now,
    last_validated_at: record.lastValidatedAt,
    confidence: record.confidence,
    freshness_status: record.freshnessStatus,
    evidence_pointer: record.evidencePointer,
    lifecycle_state: record.lifecycleState,
    payload_hash: record.payloadHash,
    payload: record.payload,
    updated_at: now,
  }));
}

function recordForSourceRow(
  records: PlannedEnterpriseContextRecord[],
  sourceFile: string,
  sourceRowNumber: number,
): PlannedEnterpriseContextRecord | undefined {
  return records.find((record) => record.sourceFile === sourceFile && record.sourceRowNumber === sourceRowNumber);
}

async function applyPlan(plan: EnterpriseContextIngestionPlan): Promise<Record<string, unknown>> {
  const client = getClient();
  const clientId = await ensureClientId(client, plan.tenantKey);
  const now = new Date().toISOString();
  const runKey = `${plan.tenantKey}:synthetic-day-one:${plan.summary.records}`;
  const runStart = await client
    .from('data_ingestion_runs')
    .insert({
      client_id: clientId,
      tenant_key: plan.tenantKey,
      source_label: `${profileForTenant(plan.tenantKey).legalName} enterprise context template load`,
      source_root: plan.sourceRoot,
      status: 'started',
      summary: {
        loader: 'enterprise-context-template-loader',
        run_key: runKey,
        planned: plan.summary,
      },
    })
    .select('id')
    .single();
  if (runStart.error) throw new Error(`data_ingestion_runs insert failed: ${runStart.error.message}`);
  const dataIngestionRunId = runStart.data.id as string;

  await upsertBatch(client, 'enterprise_context_template_runs', [{
    client_id: clientId,
    tenant_key: plan.tenantKey,
    run_key: runKey,
    run_type: 'apply',
    status: 'started',
    source_system: 'day_one_template',
    owner: 'Enterprise Context Stewardship',
    last_synced_at: now,
    last_validated_at: '2026-05-01',
    confidence: 0.86,
    freshness_status: 'fresh',
    evidence_pointer: `${plan.sourceRoot}/manifest.json`,
    source_root: plan.sourceRoot,
    workbook_count: plan.summary.sourceFiles,
    records_seen: plan.summary.records,
    records_loaded: 0,
    quality_issues_created: 0,
    summary: plan.summary,
    error_payload: {},
    started_at: now,
    updated_at: now,
  }], 'tenant_key,run_key');

  try {
    const sourceCount = await upsertBatch(client, 'enterprise_context_sources', sourceRows(plan, clientId, now), 'tenant_key,source_system,source_key');
    const sourceIdByKey = await fetchIdMap(client, 'enterprise_context_sources', plan.tenantKey, 'source_system', plan.sources.map((source) => source.sourceSystem));
    const sourceFileCount = await upsertBatch(client, 'enterprise_context_source_files', sourceFileRows(plan, clientId, sourceIdByKey, now), 'tenant_key,source_file_id');
    const sourceFileIdByKey = await fetchIdMap(client, 'enterprise_context_source_files', plan.tenantKey, 'source_file_id', plan.sourceFiles.map((sourceFile) => sourceFile.sourceFileId));

    const recordCount = await upsertBatch(client, 'enterprise_context_records', recordRows(plan, clientId, sourceIdByKey, sourceFileIdByKey, now), 'tenant_key,canonical_record_id');
    const recordIdByCanonical = await fetchIdMap(client, 'enterprise_context_records', plan.tenantKey, 'canonical_record_id', plan.records.map((record) => record.canonicalRecordId));

    const factCount = await upsertBatch(client, 'enterprise_context_facts', plan.facts.map((fact) => ({
      client_id: clientId,
      tenant_key: fact.tenantKey,
      record_id: recordIdByCanonical.get(fact.canonicalRecordId),
      fact_key: fact.factKey,
      fact_type: fact.factType,
      fact_value: fact.factValue,
      fact_text: fact.factText,
      source_system: fact.sourceSystem,
      source_record_id: fact.sourceRecordId,
      source_file: fact.sourceFile,
      source_sheet: fact.sourceSheet,
      source_row_number: fact.sourceRowNumber,
      owner: fact.owner,
      last_synced_at: now,
      last_validated_at: fact.lastValidatedAt,
      confidence: fact.confidence,
      freshness_status: fact.freshnessStatus,
      evidence_pointer: fact.evidencePointer,
      lifecycle_state: fact.lifecycleState,
      value_hash: fact.valueHash,
      updated_at: now,
    })), 'tenant_key,record_id,fact_key,value_hash');

    const relationshipCount = await upsertBatch(client, 'enterprise_context_relationships', plan.relationships.map((relationship) => ({
      client_id: clientId,
      tenant_key: relationship.tenantKey,
      relationship_key: relationship.relationshipKey,
      relationship_type: relationship.relationshipType,
      from_record_id: recordIdByCanonical.get(`${plan.tenantKey}:cmdb_applications_services:${relationship.fromExternalId}`) ?? null,
      to_record_id: recordIdByCanonical.get(`${plan.tenantKey}:cmdb_applications_services:${relationship.toExternalId}`) ?? null,
      from_external_id: relationship.fromExternalId,
      to_external_id: relationship.toExternalId,
      source_system: relationship.sourceSystem,
      source_record_id: relationship.sourceRecordId,
      source_file: relationship.sourceFile,
      source_sheet: relationship.sourceSheet,
      source_row_number: relationship.sourceRowNumber,
      owner: relationship.owner,
      last_synced_at: now,
      last_validated_at: relationship.lastValidatedAt,
      confidence: relationship.confidence,
      freshness_status: relationship.freshnessStatus,
      evidence_pointer: relationship.evidencePointer,
      lifecycle_state: 'active',
      properties: relationship.properties,
      updated_at: now,
    })), 'tenant_key,relationship_key');

    const evidenceCount = await upsertBatch(client, 'enterprise_context_evidence', plan.evidence.map((evidence) => ({
      client_id: clientId,
      tenant_key: evidence.tenantKey,
      evidence_key: evidence.evidenceKey,
      evidence_type: evidence.evidenceType,
      record_id: recordIdByCanonical.get(evidence.canonicalRecordId),
      citation_label: evidence.citationLabel,
      citation_locator: evidence.citationLocator,
      evidence_pointer: evidence.evidencePointer,
      source_system: evidence.sourceSystem,
      source_record_id: evidence.sourceRecordId,
      source_file: evidence.sourceFile,
      source_sheet: evidence.sourceSheet,
      source_row_number: evidence.sourceRowNumber,
      owner: evidence.owner,
      evidence_usable: evidence.evidenceUsable,
      last_synced_at: now,
      last_validated_at: '2026-05-01',
      confidence: evidence.confidence,
      freshness_status: evidence.freshnessStatus,
      lifecycle_state: 'active',
      metadata: { source_root: plan.sourceRoot },
      updated_at: now,
    })), 'tenant_key,evidence_key');

    const qualityIssueCount = await upsertBatch(client, 'enterprise_context_quality_issues', plan.qualityIssues.map((issue) => {
      const record = recordForSourceRow(plan.records, issue.sourceFile, issue.sourceRowNumber);
      return {
        client_id: clientId,
        tenant_key: plan.tenantKey,
        issue_key: issue.issueKey,
        issue_type: issue.issueType,
        severity: issue.severity,
        status: 'open',
        affected_record_id: record ? recordIdByCanonical.get(record.canonicalRecordId) : null,
        source_system: record?.sourceSystem ?? 'day_one_template',
        source_record_id: record?.sourceRecordId ?? null,
        source_file: issue.sourceFile,
        source_sheet: issue.sourceSheet,
        source_row_number: issue.sourceRowNumber,
        owner: record?.owner ?? null,
        steward_owner: 'Enterprise Context Stewardship',
        last_synced_at: now,
        last_validated_at: record?.lastValidatedAt ?? '2026-05-01',
        confidence: record?.confidence ?? null,
        freshness_status: record?.freshnessStatus ?? 'unknown',
        evidence_pointer: record?.evidencePointer ?? null,
        details: { message: issue.message },
        updated_at: now,
      };
    }), 'tenant_key,issue_key');

    const issueIdByKey = await fetchIdMap(client, 'enterprise_context_quality_issues', plan.tenantKey, 'issue_key', plan.qualityIssues.map((issue) => issue.issueKey));
    const stewardshipCount = await upsertBatch(client, 'enterprise_context_stewardship_tasks', plan.stewardshipTasks.map((task) => {
      const record = recordForSourceRow(plan.records, task.sourceFile, task.sourceRowNumber);
      return {
        client_id: clientId,
        tenant_key: plan.tenantKey,
        task_key: task.taskKey,
        issue_id: issueIdByKey.get(task.issueKey) ?? null,
        task_type: task.issueType,
        title: task.title,
        status: 'open',
        priority: task.severity,
        assigned_owner: task.assignedOwner,
        source_system: record?.sourceSystem ?? 'day_one_template',
        source_record_id: record?.sourceRecordId ?? null,
        source_file: task.sourceFile,
        source_sheet: task.sourceSheet,
        source_row_number: task.sourceRowNumber,
        owner: record?.owner ?? null,
        due_date: '2026-05-22',
        last_synced_at: now,
        last_validated_at: record?.lastValidatedAt ?? '2026-05-01',
        confidence: record?.confidence ?? null,
        freshness_status: record?.freshnessStatus ?? 'unknown',
        evidence_pointer: record?.evidencePointer ?? null,
        details: { message: task.message },
        updated_at: now,
      };
    }), 'tenant_key,task_key');

    const chunkQueueCount = await upsertBatch(client, 'enterprise_context_chunk_queue', plan.chunkQueue.map((queued) => {
      const record = plan.records.find((candidate) => candidate.canonicalRecordId === queued.canonicalRecordId);
      return {
        client_id: clientId,
        tenant_key: plan.tenantKey,
        queue_key: queued.queueKey,
        chunk_id: `${queued.canonicalRecordId}:chunk:0`,
        record_id: recordIdByCanonical.get(queued.canonicalRecordId),
        operation: queued.operation,
        status: 'pending',
        source_system: queued.sourceSystem,
        source_record_id: queued.sourceRecordId,
        source_file: record?.sourceFile ?? null,
        source_sheet: record?.sourceSheet ?? null,
        source_row_number: record?.sourceRowNumber ?? null,
        owner: record?.owner ?? null,
        last_synced_at: now,
        last_validated_at: record?.lastValidatedAt ?? '2026-05-01',
        confidence: record?.confidence ?? null,
        freshness_status: record?.freshnessStatus ?? 'unknown',
        evidence_pointer: record?.evidencePointer ?? null,
        payload: { canonical_record_id: queued.canonicalRecordId, vector_status: 'vector_pending' },
        updated_at: now,
      };
    }), 'tenant_key,queue_key');

    const appliedSummary = {
      ...plan.summary,
      upserted: {
        sources: sourceCount,
        sourceFiles: sourceFileCount,
        records: recordCount,
        facts: factCount,
        relationships: relationshipCount,
        evidence: evidenceCount,
        qualityIssues: qualityIssueCount,
        stewardshipTasks: stewardshipCount,
        chunkQueue: chunkQueueCount,
      },
    };

    await upsertBatch(client, 'enterprise_context_template_runs', [{
      client_id: clientId,
      tenant_key: plan.tenantKey,
      run_key: runKey,
      run_type: 'apply',
      status: 'completed',
      source_system: 'day_one_template',
      owner: 'Enterprise Context Stewardship',
      last_synced_at: now,
      last_validated_at: '2026-05-01',
      confidence: 0.86,
      freshness_status: 'fresh',
      evidence_pointer: `${plan.sourceRoot}/manifest.json`,
      source_root: plan.sourceRoot,
      workbook_count: plan.summary.sourceFiles,
      records_seen: plan.summary.records,
      records_loaded: recordCount,
      quality_issues_created: qualityIssueCount,
      summary: appliedSummary,
      error_payload: {},
      started_at: now,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }], 'tenant_key,run_key');

    const runComplete = await client
      .from('data_ingestion_runs')
      .update({
        status: 'completed',
        records_loaded: recordCount,
        chunks_loaded: 0,
        nodes_loaded: 0,
        edges_loaded: relationshipCount,
        summary: {
          loader: 'enterprise-context-template-loader',
          run_key: runKey,
          applied: appliedSummary,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', dataIngestionRunId);
    if (runComplete.error) throw new Error(`data_ingestion_runs update failed: ${runComplete.error.message}`);

    return appliedSummary;
  } catch (error) {
    await upsertBatch(client, 'enterprise_context_template_runs', [{
      client_id: clientId,
      tenant_key: plan.tenantKey,
      run_key: runKey,
      run_type: 'apply',
      status: 'failed',
      source_system: 'day_one_template',
      owner: 'Enterprise Context Stewardship',
      freshness_status: 'unknown',
      source_root: plan.sourceRoot,
      workbook_count: plan.summary.sourceFiles,
      records_seen: plan.summary.records,
      records_loaded: 0,
      quality_issues_created: 0,
      summary: plan.summary,
      error_payload: { message: error instanceof Error ? error.message : String(error) },
      started_at: now,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }], 'tenant_key,run_key');
    await client
      .from('data_ingestion_runs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      .eq('id', dataIngestionRunId);
    throw error;
  }
}

async function main() {
  const args = parseArgs();
  const parsed = parseMeridianEnterpriseContextDataset(args.sourceRoot);
  const builtPlan = buildMeridianEnterpriseContextIngestionPlan(parsed);
  const plan = retargetEnterpriseContextIngestionPlan(builtPlan, args.tenantKey);
  const summary = {
    mode: args.apply ? 'apply' : 'dry-run',
    sourceRoot: args.sourceRoot,
    tenantKey: plan.tenantKey,
    ...plan.summary,
  };

  if (!args.apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const applied = await applyPlan(plan);
  console.log(JSON.stringify({ mode: 'apply', tenantKey: plan.tenantKey, applied }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
