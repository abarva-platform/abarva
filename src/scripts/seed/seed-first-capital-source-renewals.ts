// Seed — First Capital Financial vendor_contracts + it_financials for the
// Source Decision Queue + Renewal Cockpit slice (Practitioner-Fit §3/§4).
//
// Additive and idempotent: upserts a credible, demo-grade set of
// `vendor_contracts` and `it_financials` records into the
// `data_inventory_records` substrate so the Source Decision Queue renders
// real cards and the Renewal Cockpit has real renewals to open for the
// First Capital Financial tenant. No production data is mutated — this is the
// synthetic First Capital tenant only, and every row is upserted on its
// natural key.
//
// Mirror of `seed-apex-source-renewals.ts`: same table, same row shape, same
// `segment_id` values. The vendor portfolio is bank-appropriate — core
// banking, fraud detection, AML/BSA screening, card processing, digital
// banking, data warehouse, regulatory reporting, and cybersecurity. The
// fraud-detection and AML/BSA contracts are aligned with First Capital's
// known programs (FC-FRAUD-2026 and BSA/AML automation) so Source corroborates
// the rest of the product.
//
// Tenant-key note: the Source Decision Queue read adapter
// (`sourceDecisionQueueReadAdapter.ts` → `brokerTenantKey`) only remaps the
// `apexretail` app key; every other client key — including `arcturus` (First
// Capital's app key) — is passed through unchanged. The active Source surface
// therefore queries `tenant_key = 'arcturus'`, so this seed writes that exact
// key. Do NOT change it to the canonical `first-capital` substrate key or the
// Decision Queue will render empty.
//
// Run:  npx tsx src/scripts/seed/seed-first-capital-source-renewals.ts [--dry-run]
//
// Term-end dates are expressed RELATIVE to the run date so the queue always
// has triage-worthy cards across the 30/60/90-day notice windows regardless
// of when the seed is run.

import { getAzureWriteFluentClient, type PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
type SeedClient = PostgresCompatClient;
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const TENANT_KEY = 'arcturus';
const SOURCE_BASIS = 'tenant_admin_upload';
const UPLOADED_BY = 'First Capital Financial synthetic dataset · Source renewals slice';

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
//   - NICE Actimize AML   → 9 days out   (inside the 30-day window)
//   - Feedzai fraud       → 21 days out  (inside the 30-day window)
//   - Fiserv card proc.   → 44 days out  (inside the 60-day window)
//   - Q2 digital banking  → 68 days out  (inside the 90-day window)
//   - Wolters Kluwer reg. → 84 days out  (inside the 90-day window)
//   - FIS core banking    → 174 days out (steady-state, high criticality)
//   - Snowflake DW        → 233 days out (steady-state)
//   - Palo Alto Networks  → 297 days out (steady-state)

const CONTRACTS: ContractSeed[] = [
  {
    recordId: 'vendor_contracts:firstcapital-fis-core-banking',
    title: 'FIS — Core Banking Platform',
    payload: {
      vendor_name: 'FIS',
      product: 'IBS Core Banking Platform',
      category: 'core_banking',
      annual_spend_usd: 7_600_000,
      term_end_date: isoFromOffset(174),
      auto_renew: false,
      notice_period_days: 180,
      utilization_rate: 0.95,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:cio-office',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-feedzai-fraud',
    title: 'Feedzai — Fraud Detection Platform (FC-FRAUD-2026)',
    payload: {
      vendor_name: 'Feedzai',
      product: 'RiskOps Fraud Detection Platform',
      category: 'fraud_detection',
      annual_spend_usd: 2_140_000,
      term_end_date: isoFromOffset(21),
      auto_renew: true,
      notice_period_days: 60,
      utilization_rate: 0.74,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:fraud-risk-office',
      program_ref: 'FC-FRAUD-2026',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-nice-actimize-aml',
    title: 'NICE Actimize — AML / BSA Screening',
    payload: {
      vendor_name: 'NICE Actimize',
      product: 'Anti-Money-Laundering & BSA Screening Suite',
      category: 'aml_bsa',
      annual_spend_usd: 1_680_000,
      term_end_date: isoFromOffset(9),
      auto_renew: true,
      notice_period_days: 45,
      utilization_rate: 0.69,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:bsa-aml-office',
      program_ref: 'BSA/AML automation',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-fiserv-card-processing',
    title: 'Fiserv — Card Processing',
    payload: {
      vendor_name: 'Fiserv',
      product: 'Optis Card Processing',
      category: 'card_processing',
      annual_spend_usd: 3_050_000,
      term_end_date: isoFromOffset(44),
      auto_renew: true,
      notice_period_days: 90,
      utilization_rate: 0.88,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:payments-ops',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-q2-digital-banking',
    title: 'Q2 Holdings — Digital Banking Platform',
    payload: {
      vendor_name: 'Q2 Holdings',
      product: 'Digital Banking Platform',
      category: 'digital_banking',
      annual_spend_usd: 1_420_000,
      term_end_date: isoFromOffset(68),
      auto_renew: false,
      notice_period_days: null,
      utilization_rate: 0.57,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:digital-channels',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-snowflake-data-warehouse',
    title: 'Snowflake — Data Warehouse',
    payload: {
      vendor_name: 'Snowflake',
      product: 'Data Cloud / Enterprise Data Warehouse',
      category: 'data_warehouse',
      annual_spend_usd: 1_180_000,
      term_end_date: isoFromOffset(233),
      auto_renew: false,
      notice_period_days: null,
      utilization_rate: 0.46,
      business_criticality: 'medium',
      owner_id: 'person:firstcapital:chief-data-office',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-wolters-kluwer-regreporting',
    title: 'Wolters Kluwer — Regulatory Reporting',
    payload: {
      vendor_name: 'Wolters Kluwer',
      product: 'OneSumX Regulatory Reporting',
      category: 'regulatory_reporting',
      annual_spend_usd: 860_000,
      term_end_date: isoFromOffset(84),
      auto_renew: true,
      notice_period_days: 60,
      utilization_rate: 0.62,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:regulatory-affairs',
    },
  },
  {
    recordId: 'vendor_contracts:firstcapital-palo-alto-security',
    title: 'Palo Alto Networks — Network Security',
    payload: {
      vendor_name: 'Palo Alto Networks',
      product: 'Prisma & Strata Network Security',
      category: 'cybersecurity',
      annual_spend_usd: 1_540_000,
      term_end_date: isoFromOffset(297),
      auto_renew: true,
      notice_period_days: 60,
      utilization_rate: 0.84,
      business_criticality: 'high',
      owner_id: 'person:firstcapital:ciso-office',
    },
  },
];

// --- IT financials (category benchmarks) -----------------------------------

const FINANCIALS: FinancialSeed[] = [
  {
    recordId: 'it_financials:firstcapital-benchmark-core-banking',
    title: 'Core banking — category benchmark',
    payload: {
      category: 'core_banking',
      annual_budget_usd: 7_800_000,
      benchmark_usd: 7_200_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-fraud-detection',
    title: 'Fraud detection — category benchmark',
    payload: {
      category: 'fraud_detection',
      annual_budget_usd: 2_200_000,
      benchmark_usd: 1_900_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-aml-bsa',
    title: 'AML / BSA — category benchmark',
    payload: {
      category: 'aml_bsa',
      annual_budget_usd: 1_750_000,
      benchmark_usd: 1_480_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-card-processing',
    title: 'Card processing — category benchmark',
    payload: {
      category: 'card_processing',
      annual_budget_usd: 3_100_000,
      benchmark_usd: 2_820_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-digital-banking',
    title: 'Digital banking — category benchmark',
    payload: {
      category: 'digital_banking',
      annual_budget_usd: 1_450_000,
      benchmark_usd: 1_220_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-data-warehouse',
    title: 'Data warehouse — category benchmark',
    payload: {
      category: 'data_warehouse',
      annual_budget_usd: 1_150_000,
      benchmark_usd: 940_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-regulatory-reporting',
    title: 'Regulatory reporting — category benchmark',
    payload: {
      category: 'regulatory_reporting',
      annual_budget_usd: 900_000,
      benchmark_usd: 780_000,
    },
  },
  {
    recordId: 'it_financials:firstcapital-benchmark-cybersecurity',
    title: 'Cybersecurity — category benchmark',
    payload: {
      category: 'cybersecurity',
      annual_budget_usd: 1_600_000,
      benchmark_usd: 1_460_000,
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
    .or(
      'name.eq.First Capital Financial,name.eq.First Capital,legal_name.eq.First Capital Financial',
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
    source_doc: 'first-capital-source-renewals-seed.ts',
    source_path: 'src/scripts/seed/seed-first-capital-source-renewals.ts',
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
