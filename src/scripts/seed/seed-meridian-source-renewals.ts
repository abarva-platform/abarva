// Seed — Meridian Health System vendor_contracts + it_financials for the
// Source Decision Queue + Renewal Cockpit slice (Practitioner-Fit §3/§4).
//
// Additive and idempotent: upserts a credible, demo-grade set of
// `vendor_contracts` and `it_financials` records into the
// `data_inventory_records` substrate so the Source Decision Queue renders
// real cards and the Renewal Cockpit has real renewals to open for the
// Meridian Health System tenant. No production data is mutated — this is the
// synthetic Meridian tenant only, and every row is upserted on its natural key.
//
// Mirror of `seed-apex-source-renewals.ts`: same table, same row shape, same
// `segment_id` values. The vendor portfolio is health-system-appropriate —
// EHR, PACS/imaging, revenue-cycle, clinical documentation, telehealth, ERP,
// medical-device integration, and cybersecurity.
//
// Tenant-key note: the Source Decision Queue read adapter
// (`sourceDecisionQueueReadAdapter.ts` → `brokerTenantKey`) only remaps the
// `apexretail` app key; every other client key — including `meridian` — is
// passed through unchanged. The active Source surface therefore queries
// `tenant_key = 'meridian'`, so this seed writes that exact key. Do NOT
// change it to the canonical `meridian-health` substrate key or the Decision
// Queue will render empty.
//
// Run:  npx tsx src/scripts/seed/seed-meridian-source-renewals.ts [--dry-run]
//
// Term-end dates are expressed RELATIVE to the run date so the queue always
// has triage-worthy cards across the 30/60/90-day notice windows regardless
// of when the seed is run.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const TENANT_KEY = 'meridian';
const SOURCE_BASIS = 'tenant_admin_upload';
const UPLOADED_BY = 'Meridian Health synthetic dataset · Source renewals slice';

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
//
// Renewal urgency is spread so the Decision Queue is genuinely triageable:
//   - Oracle Health PACS  → 12 days out  (inside the 30-day window)
//   - Nuance DAX          → 24 days out  (inside the 30-day window)
//   - R1 RCM              → 47 days out  (inside the 60-day window)
//   - Teladoc telehealth  → 71 days out  (inside the 90-day window)
//   - Workday ERP         → 88 days out  (inside the 90-day window)
//   - Epic EHR            → 196 days out (steady-state, high criticality)
//   - CrowdStrike         → 281 days out (steady-state)

const CONTRACTS: ContractSeed[] = [
  {
    recordId: 'vendor_contracts:meridian-epic-ehr',
    title: 'Epic Systems — Electronic Health Record',
    payload: {
      vendor_name: 'Epic Systems',
      product: 'Epic EHR (Hyperspace)',
      category: 'ehr',
      annual_spend_usd: 9_400_000,
      term_end_date: isoFromOffset(196),
      auto_renew: false,
      notice_period_days: 180,
      utilization_rate: 0.93,
      business_criticality: 'high',
      owner_id: 'person:meridian:cmio-office',
    },
  },
  {
    recordId: 'vendor_contracts:meridian-oracle-health-pacs',
    title: 'Oracle Health — PACS / Medical Imaging',
    payload: {
      vendor_name: 'Oracle Health',
      product: 'PACS & Enterprise Imaging',
      category: 'medical_imaging',
      annual_spend_usd: 1_870_000,
      term_end_date: isoFromOffset(12),
      auto_renew: true,
      notice_period_days: 60,
      utilization_rate: 0.71,
      business_criticality: 'high',
      owner_id: 'person:meridian:radiology-it',
    },
  },
  {
    recordId: 'vendor_contracts:meridian-r1-rcm',
    title: 'R1 RCM — Revenue Cycle Management',
    payload: {
      vendor_name: 'R1 RCM',
      product: 'Revenue Cycle Management Platform',
      category: 'revenue_cycle',
      annual_spend_usd: 3_250_000,
      term_end_date: isoFromOffset(47),
      auto_renew: true,
      notice_period_days: 90,
      utilization_rate: 0.82,
      business_criticality: 'high',
      owner_id: 'person:meridian:vp-revenue-cycle',
    },
  },
  {
    recordId: 'vendor_contracts:meridian-nuance-dax',
    title: 'Microsoft Nuance — DAX Clinical Documentation',
    payload: {
      vendor_name: 'Microsoft Nuance',
      product: 'Dragon Ambient eXperience (DAX Copilot)',
      category: 'clinical_documentation',
      annual_spend_usd: 1_120_000,
      term_end_date: isoFromOffset(24),
      auto_renew: false,
      notice_period_days: null,
      utilization_rate: 0.38,
      business_criticality: 'medium',
      owner_id: 'person:meridian:cmio-office',
    },
  },
  {
    recordId: 'vendor_contracts:meridian-teladoc-telehealth',
    title: 'Teladoc Health — Telehealth Platform',
    payload: {
      vendor_name: 'Teladoc Health',
      product: 'Virtual Care / Telehealth Platform',
      category: 'telehealth',
      annual_spend_usd: 940_000,
      term_end_date: isoFromOffset(71),
      auto_renew: true,
      notice_period_days: 45,
      utilization_rate: 0.49,
      business_criticality: 'medium',
      owner_id: 'person:meridian:ambulatory-ops',
    },
  },
  {
    recordId: 'vendor_contracts:meridian-workday-erp',
    title: 'Workday — Enterprise Resource Planning',
    payload: {
      vendor_name: 'Workday',
      product: 'Workday HCM & Financial Management',
      category: 'erp',
      annual_spend_usd: 2_180_000,
      term_end_date: isoFromOffset(88),
      auto_renew: false,
      notice_period_days: null,
      utilization_rate: 0.86,
      business_criticality: 'high',
      owner_id: 'person:meridian:cfo-office',
    },
  },
  {
    recordId: 'vendor_contracts:meridian-crowdstrike-security',
    title: 'CrowdStrike — Endpoint Security & Threat Detection',
    payload: {
      vendor_name: 'CrowdStrike',
      product: 'Falcon Endpoint Protection Platform',
      category: 'cybersecurity',
      annual_spend_usd: 1_360_000,
      term_end_date: isoFromOffset(281),
      auto_renew: true,
      notice_period_days: 60,
      utilization_rate: 0.9,
      business_criticality: 'high',
      owner_id: 'person:meridian:ciso-office',
    },
  },
];

// --- IT financials (category benchmarks) -----------------------------------

const FINANCIALS: FinancialSeed[] = [
  {
    recordId: 'it_financials:meridian-benchmark-ehr',
    title: 'EHR — category benchmark',
    payload: {
      category: 'ehr',
      annual_budget_usd: 9_600_000,
      benchmark_usd: 9_000_000,
    },
  },
  {
    recordId: 'it_financials:meridian-benchmark-medical-imaging',
    title: 'Medical imaging — category benchmark',
    payload: {
      category: 'medical_imaging',
      annual_budget_usd: 1_900_000,
      benchmark_usd: 1_640_000,
    },
  },
  {
    recordId: 'it_financials:meridian-benchmark-revenue-cycle',
    title: 'Revenue cycle — category benchmark',
    payload: {
      category: 'revenue_cycle',
      annual_budget_usd: 3_300_000,
      benchmark_usd: 2_880_000,
    },
  },
  {
    recordId: 'it_financials:meridian-benchmark-clinical-documentation',
    title: 'Clinical documentation — category benchmark',
    payload: {
      category: 'clinical_documentation',
      annual_budget_usd: 1_150_000,
      benchmark_usd: 980_000,
    },
  },
  {
    recordId: 'it_financials:meridian-benchmark-telehealth',
    title: 'Telehealth — category benchmark',
    payload: {
      category: 'telehealth',
      annual_budget_usd: 1_000_000,
      benchmark_usd: 820_000,
    },
  },
  {
    recordId: 'it_financials:meridian-benchmark-erp',
    title: 'ERP — category benchmark',
    payload: {
      category: 'erp',
      annual_budget_usd: 2_250_000,
      benchmark_usd: 2_050_000,
    },
  },
  {
    recordId: 'it_financials:meridian-benchmark-cybersecurity',
    title: 'Cybersecurity — category benchmark',
    payload: {
      category: 'cybersecurity',
      annual_budget_usd: 1_400_000,
      benchmark_usd: 1_300_000,
    },
  },
];

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
    );
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveClientId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client
    .from('clients')
    .select('id')
    .or(
      'name.eq.Meridian Health System,name.eq.Meridian Health,legal_name.eq.Meridian Health System',
    )
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
    source_doc: 'meridian-source-renewals-seed.ts',
    source_path: 'src/scripts/seed/seed-meridian-source-renewals.ts',
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
  client: SupabaseClient,
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
