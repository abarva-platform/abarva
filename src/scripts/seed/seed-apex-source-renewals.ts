// Seed — Apex Retail vendor_contracts + it_financials for the Source
// Decision Queue + Renewal Cockpit slice (Practitioner-Fit §3/§4).
//
// Additive and idempotent: upserts a small, demo-grade set of `vendor_contracts`
// and `it_financials` records into the `data_inventory_records` substrate so
// the Decision Queue renders real cards and the Renewal Cockpit has a real
// renewal to open. No production data is mutated — this is the synthetic Apex
// tenant only, and every row is upserted on its natural key.
//
// Run:  npx tsx src/scripts/seed/seed-apex-source-renewals.ts [--dry-run]
//
// Term-end dates are expressed RELATIVE to the run date so the queue always
// has a "today" / "this_week" card regardless of when the seed is run.

import { getAzureWriteFluentClient, type PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
type SeedClient = PostgresCompatClient;
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const TENANT_KEY = 'apex-retail';
const SOURCE_BASIS = 'tenant_admin_upload';
const UPLOADED_BY = 'Apex synthetic dataset · Source renewals slice';

/** Days-from-today → ISO date string. */
function isoFromOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface ContractSeed {
  recordId: string;
  title: string;
  payload: Record<string, unknown>;
}

interface FinancialSeed {
  recordId: string;
  title: string;
  payload: Record<string, unknown>;
}

// --- Vendor contracts -------------------------------------------------------

const CONTRACTS: ContractSeed[] = [
  {
    recordId: 'vendor_contracts:apex-adobe-experience-cloud',
    title: 'Adobe Experience Cloud',
    payload: {
      vendor_name: 'Adobe',
      product: 'Experience Cloud',
      category: 'marketing_cloud',
      annual_spend_usd: 1_240_000,
      term_end_date: isoFromOffset(26),
      auto_renew: true,
      notice_period_days: 60,
      utilization_rate: 0.78,
      business_criticality: 'high',
      owner_id: 'person:apex:cmo-office',
    },
  },
  {
    recordId: 'vendor_contracts:apex-salesforce-sales-cloud',
    title: 'Salesforce Sales Cloud',
    payload: {
      vendor_name: 'Salesforce',
      product: 'Sales Cloud',
      category: 'crm',
      annual_spend_usd: 880_000,
      term_end_date: isoFromOffset(140),
      auto_renew: false,
      notice_period_days: null,
      utilization_rate: 0.64,
      business_criticality: 'high',
      owner_id: 'person:apex:vp-sales-ops',
    },
  },
  {
    recordId: 'vendor_contracts:apex-microsoft-dynamics',
    title: 'Microsoft Dynamics 365',
    payload: {
      vendor_name: 'Microsoft',
      product: 'Dynamics 365 Sales',
      category: 'crm',
      annual_spend_usd: 410_000,
      term_end_date: isoFromOffset(205),
      auto_renew: true,
      notice_period_days: 90,
      utilization_rate: 0.31,
      business_criticality: 'medium',
      owner_id: 'person:apex:it-applications',
    },
  },
  {
    recordId: 'vendor_contracts:apex-servicenow-itsm',
    title: 'ServiceNow ITSM',
    payload: {
      vendor_name: 'ServiceNow',
      product: 'IT Service Management',
      category: 'itsm',
      annual_spend_usd: 690_000,
      term_end_date: isoFromOffset(58),
      auto_renew: true,
      notice_period_days: 45,
      utilization_rate: 0.88,
      business_criticality: 'high',
      owner_id: 'person:apex:it-operations',
    },
  },
  {
    recordId: 'vendor_contracts:apex-snowflake-data-cloud',
    title: 'Snowflake Data Cloud',
    payload: {
      vendor_name: 'Snowflake',
      product: 'Data Cloud',
      category: 'data_platform',
      annual_spend_usd: 1_050_000,
      term_end_date: isoFromOffset(320),
      auto_renew: false,
      notice_period_days: null,
      utilization_rate: 0.42,
      business_criticality: 'high',
      owner_id: 'person:apex:chief-data-office',
    },
  },
];

// --- IT financials (category benchmarks) -----------------------------------

const FINANCIALS: FinancialSeed[] = [
  {
    recordId: 'it_financials:apex-benchmark-marketing-cloud',
    title: 'Marketing cloud — category benchmark',
    payload: {
      category: 'marketing_cloud',
      annual_budget_usd: 1_100_000,
      benchmark_usd: 980_000,
    },
  },
  {
    recordId: 'it_financials:apex-benchmark-crm',
    title: 'CRM — category benchmark',
    payload: {
      category: 'crm',
      annual_budget_usd: 1_050_000,
      benchmark_usd: 950_000,
    },
  },
  {
    recordId: 'it_financials:apex-benchmark-itsm',
    title: 'ITSM — category benchmark',
    payload: {
      category: 'itsm',
      annual_budget_usd: 720_000,
      benchmark_usd: 700_000,
    },
  },
  {
    recordId: 'it_financials:apex-benchmark-data-platform',
    title: 'Data platform — category benchmark',
    payload: {
      category: 'data_platform',
      annual_budget_usd: 1_000_000,
      benchmark_usd: 820_000,
    },
  },
];

function getClient(): SeedClient {
  return getAzureWriteFluentClient();
}

async function resolveClientId(client: SeedClient): Promise<string | null> {
  const { data } = await client
    .from('clients')
    .select('id')
    .or('name.eq.Apex Retail,name.eq.Apex Retail Group,legal_name.eq.Apex Retail Group')
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function recordRow(
  clientId: string | null,
  segmentId: string,
  seed: ContractSeed | FinancialSeed,
  recordKind: string,
) {
  const now = new Date().toISOString();
  return {
    client_id: clientId,
    tenant_key: TENANT_KEY,
    segment_id: segmentId,
    record_id: seed.recordId,
    title: seed.title,
    record_kind: recordKind,
    source_doc: 'apex-source-renewals-seed.ts',
    source_path: 'src/scripts/seed/seed-apex-source-renewals.ts',
    source_basis: SOURCE_BASIS,
    uploaded_by: UPLOADED_BY,
    data_classification: 'Internal',
    confidence: 0.85,
    last_reviewed: new Date().toISOString().slice(0, 10),
    freshness_state: 'fresh',
    ingestion_status: 'indexed',
    indexed_at: now,
    record_text: JSON.stringify(seed.payload),
    record_payload: seed.payload,
  };
}

async function upsertSegmentRollup(
  client: SeedClient,
  clientId: string | null,
  segmentId: string,
  segmentName: string,
  familyNumber: number,
  recordCount: number,
) {
  const { error } = await client.from('data_inventory_segments').upsert(
    {
      client_id: clientId,
      tenant_key: TENANT_KEY,
      segment_id: segmentId,
      segment_name: segmentName,
      family_number: familyNumber,
      coverage_score: 100,
      health_state: 'complete',
      record_count: recordCount,
      stale_count: 0,
      missing_count: 0,
      last_ingested_at: new Date().toISOString(),
      provenance_summary: { source_basis: SOURCE_BASIS, uploaded_by: UPLOADED_BY },
    },
    { onConflict: 'tenant_key,segment_id' },
  );
  if (error) {
    throw new Error(`data_inventory_segments upsert (${segmentId}) failed: ${error.message}`);
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const contractRows = (clientId: string | null) =>
    CONTRACTS.map((c) => recordRow(clientId, 'vendor_contracts', c, 'vendor_contract'));
  const financialRows = (clientId: string | null) =>
    FINANCIALS.map((f) => recordRow(clientId, 'it_financials', f, 'it_financial_line'));

  const summary = {
    tenantKey: TENANT_KEY,
    vendorContracts: CONTRACTS.length,
    itFinancials: FINANCIALS.length,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const client = getClient();
  const clientId = await resolveClientId(client);

  const contracts = contractRows(clientId);
  const financials = financialRows(clientId);

  const contractUpsert = await client
    .from('data_inventory_records')
    .upsert(contracts, { onConflict: 'tenant_key,segment_id,record_id' });
  if (contractUpsert.error) {
    throw new Error(`vendor_contracts upsert failed: ${contractUpsert.error.message}`);
  }

  const financialUpsert = await client
    .from('data_inventory_records')
    .upsert(financials, { onConflict: 'tenant_key,segment_id,record_id' });
  if (financialUpsert.error) {
    throw new Error(`it_financials upsert failed: ${financialUpsert.error.message}`);
  }

  await upsertSegmentRollup(client, clientId, 'vendor_contracts', 'Vendor and contract', 11, CONTRACTS.length);
  await upsertSegmentRollup(client, clientId, 'it_financials', 'IT financials', 4, FINANCIALS.length);

  console.log(JSON.stringify({ ...summary, status: 'seeded' }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
