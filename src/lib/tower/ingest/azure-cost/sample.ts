/**
 * Synthetic sample data — Northwind Retail · 12 months · 5 subscriptions ×
 * ~20 resource groups. ~2000 rows. Plausible Azure service mix.
 *
 * THIS IS NOT REAL DATA. The template carries a SYNTHETIC banner.
 */

import type { AzureCostRow } from './parse';

export const SAMPLE_TENANT = 'Northwind Retail';

interface ServiceShape {
  service: string;
  meter: string;
  base: number; // baseline monthly USD before jitter
  variance: number; // +/- USD jitter
  growth?: number; // monthly growth multiplier
}

interface ResourceShape {
  rg: string;
  program: 'pgm-ecom' | 'pgm-supply-chain' | 'pgm-store-ops' | 'pgm-data-platform' | 'pgm-shared-svcs' | '__untagged__';
  environment: 'prod' | 'staging' | 'dev';
  location: 'eastus' | 'westeurope' | 'centralus' | 'westus2' | 'northeurope';
  services: Array<{ name: string; shapeKey: keyof typeof SERVICE_SHAPES; multiplier?: number }>;
}

const SERVICE_SHAPES: Record<string, ServiceShape> = {
  containerApps: { service: 'Container Apps', meter: 'Compute', base: 4800, variance: 600, growth: 1.02 },
  postgresFlex: { service: 'Azure Database for PostgreSQL', meter: 'Databases', base: 3200, variance: 400, growth: 1.015 },
  aiSearch: { service: 'Azure AI Search', meter: 'AI + Machine Learning', base: 2100, variance: 300, growth: 1.04 },
  serviceBus: { service: 'Service Bus', meter: 'Integration', base: 380, variance: 60 },
  keyVault: { service: 'Key Vault', meter: 'Security', base: 60, variance: 15 },
  appInsights: { service: 'Application Insights', meter: 'Monitor', base: 540, variance: 90 },
  storageBlob: { service: 'Storage', meter: 'Storage', base: 920, variance: 140, growth: 1.025 },
  cdn: { service: 'Front Door', meter: 'Networking', base: 720, variance: 120 },
  openai: { service: 'Azure OpenAI', meter: 'AI + Machine Learning', base: 5800, variance: 900, growth: 1.08 },
  apim: { service: 'API Management', meter: 'Integration', base: 1200, variance: 180 },
  cosmosdb: { service: 'Azure Cosmos DB', meter: 'Databases', base: 2600, variance: 350 },
  vnet: { service: 'Virtual Network', meter: 'Networking', base: 140, variance: 30 },
};

const RESOURCES: ResourceShape[] = [
  // E-commerce
  { rg: 'rg-ecom-prod-eus', program: 'pgm-ecom', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-storefront-eus', shapeKey: 'containerApps', multiplier: 1.4 },
    { name: 'pg-ecom-orders-eus', shapeKey: 'postgresFlex' },
    { name: 'srch-products-eus', shapeKey: 'aiSearch' },
    { name: 'sb-orders-eus', shapeKey: 'serviceBus' },
    { name: 'kv-ecom-eus', shapeKey: 'keyVault' },
    { name: 'appi-storefront-eus', shapeKey: 'appInsights' },
    { name: 'st-ecomassets-eus', shapeKey: 'storageBlob' },
    { name: 'fd-storefront', shapeKey: 'cdn' },
  ]},
  { rg: 'rg-ecom-prod-weu', program: 'pgm-ecom', environment: 'prod', location: 'westeurope', services: [
    { name: 'ca-storefront-weu', shapeKey: 'containerApps' },
    { name: 'pg-ecom-orders-weu', shapeKey: 'postgresFlex' },
    { name: 'srch-products-weu', shapeKey: 'aiSearch' },
    { name: 'sb-orders-weu', shapeKey: 'serviceBus' },
    { name: 'appi-storefront-weu', shapeKey: 'appInsights' },
    { name: 'st-ecomassets-weu', shapeKey: 'storageBlob' },
  ]},
  { rg: 'rg-ecom-staging', program: 'pgm-ecom', environment: 'staging', location: 'eastus', services: [
    { name: 'ca-storefront-stg', shapeKey: 'containerApps', multiplier: 0.3 },
    { name: 'pg-ecom-orders-stg', shapeKey: 'postgresFlex', multiplier: 0.4 },
    { name: 'srch-products-stg', shapeKey: 'aiSearch', multiplier: 0.4 },
    { name: 'appi-storefront-stg', shapeKey: 'appInsights', multiplier: 0.3 },
    { name: 'sb-orders-stg', shapeKey: 'serviceBus', multiplier: 0.3 },
    { name: 'kv-ecom-stg', shapeKey: 'keyVault' },
    { name: 'st-ecomassets-stg', shapeKey: 'storageBlob', multiplier: 0.3 },
  ]},
  { rg: 'rg-ecom-dev', program: 'pgm-ecom', environment: 'dev', location: 'eastus', services: [
    { name: 'ca-storefront-dev', shapeKey: 'containerApps', multiplier: 0.15 },
    { name: 'pg-ecom-orders-dev', shapeKey: 'postgresFlex', multiplier: 0.2 },
    { name: 'srch-products-dev', shapeKey: 'aiSearch', multiplier: 0.2 },
    { name: 'appi-storefront-dev', shapeKey: 'appInsights', multiplier: 0.1 },
    { name: 'kv-ecom-dev', shapeKey: 'keyVault' },
  ]},
  { rg: 'rg-supply-dev', program: 'pgm-supply-chain', environment: 'dev', location: 'centralus', services: [
    { name: 'ca-supply-dev', shapeKey: 'containerApps', multiplier: 0.15 },
    { name: 'pg-supply-dev', shapeKey: 'postgresFlex', multiplier: 0.2 },
    { name: 'aoai-supply-dev', shapeKey: 'openai', multiplier: 0.1 },
    { name: 'appi-supply-dev', shapeKey: 'appInsights', multiplier: 0.1 },
  ]},
  { rg: 'rg-data-dev', program: 'pgm-data-platform', environment: 'dev', location: 'westus2', services: [
    { name: 'st-lake-dev', shapeKey: 'storageBlob', multiplier: 0.3 },
    { name: 'aoai-lake-dev', shapeKey: 'openai', multiplier: 0.15 },
    { name: 'srch-lake-dev', shapeKey: 'aiSearch', multiplier: 0.2 },
    { name: 'appi-lake-dev', shapeKey: 'appInsights', multiplier: 0.1 },
  ]},
  // Supply chain
  { rg: 'rg-supply-prod', program: 'pgm-supply-chain', environment: 'prod', location: 'centralus', services: [
    { name: 'ca-demand-fcst', shapeKey: 'containerApps', multiplier: 0.9 },
    { name: 'pg-inventory', shapeKey: 'postgresFlex', multiplier: 1.2 },
    { name: 'srch-skus', shapeKey: 'aiSearch', multiplier: 0.7 },
    { name: 'sb-replenishment', shapeKey: 'serviceBus' },
    { name: 'aoai-fcst', shapeKey: 'openai', multiplier: 1.3 },
    { name: 'kv-supply', shapeKey: 'keyVault' },
    { name: 'appi-supply', shapeKey: 'appInsights' },
    { name: 'st-supplydata', shapeKey: 'storageBlob' },
  ]},
  { rg: 'rg-supply-warehouse', program: 'pgm-supply-chain', environment: 'prod', location: 'centralus', services: [
    { name: 'ca-wms-api', shapeKey: 'containerApps', multiplier: 0.6 },
    { name: 'pg-wms', shapeKey: 'postgresFlex', multiplier: 0.8 },
    { name: 'sb-wms-events', shapeKey: 'serviceBus' },
    { name: 'st-wms-archive', shapeKey: 'storageBlob', multiplier: 1.3 },
  ]},
  // Store ops
  { rg: 'rg-store-ops-prod', program: 'pgm-store-ops', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-pos-sync', shapeKey: 'containerApps', multiplier: 1.1 },
    { name: 'cdb-store-state', shapeKey: 'cosmosdb' },
    { name: 'sb-pos-events', shapeKey: 'serviceBus', multiplier: 1.4 },
    { name: 'kv-store-ops', shapeKey: 'keyVault' },
    { name: 'appi-store-ops', shapeKey: 'appInsights', multiplier: 1.2 },
    { name: 'apim-store-ops', shapeKey: 'apim' },
  ]},
  { rg: 'rg-store-ops-weu', program: 'pgm-store-ops', environment: 'prod', location: 'westeurope', services: [
    { name: 'ca-pos-sync-weu', shapeKey: 'containerApps', multiplier: 0.7 },
    { name: 'cdb-store-state-weu', shapeKey: 'cosmosdb', multiplier: 0.6 },
    { name: 'sb-pos-events-weu', shapeKey: 'serviceBus' },
    { name: 'appi-store-ops-weu', shapeKey: 'appInsights', multiplier: 0.6 },
  ]},
  { rg: 'rg-store-ops-dev', program: 'pgm-store-ops', environment: 'dev', location: 'eastus', services: [
    { name: 'ca-pos-sync-dev', shapeKey: 'containerApps', multiplier: 0.15 },
    { name: 'cdb-store-state-dev', shapeKey: 'cosmosdb', multiplier: 0.2 },
  ]},
  // Data platform
  { rg: 'rg-data-platform', program: 'pgm-data-platform', environment: 'prod', location: 'westus2', services: [
    { name: 'srch-analytics', shapeKey: 'aiSearch', multiplier: 1.3 },
    { name: 'st-lake-bronze', shapeKey: 'storageBlob', multiplier: 2.4 },
    { name: 'st-lake-silver', shapeKey: 'storageBlob', multiplier: 1.6 },
    { name: 'aoai-summarize', shapeKey: 'openai', multiplier: 0.9 },
    { name: 'appi-data-platform', shapeKey: 'appInsights' },
    { name: 'kv-data-platform', shapeKey: 'keyVault' },
  ]},
  { rg: 'rg-data-platform-eu', program: 'pgm-data-platform', environment: 'prod', location: 'northeurope', services: [
    { name: 'srch-analytics-eu', shapeKey: 'aiSearch', multiplier: 0.6 },
    { name: 'st-lake-bronze-eu', shapeKey: 'storageBlob', multiplier: 1.1 },
    { name: 'aoai-summarize-eu', shapeKey: 'openai', multiplier: 0.5 },
  ]},
  // Shared services
  { rg: 'rg-shared-network', program: 'pgm-shared-svcs', environment: 'prod', location: 'eastus', services: [
    { name: 'vnet-hub-eus', shapeKey: 'vnet', multiplier: 2.5 },
    { name: 'fd-shared', shapeKey: 'cdn', multiplier: 0.8 },
    { name: 'apim-shared', shapeKey: 'apim', multiplier: 1.2 },
  ]},
  { rg: 'rg-shared-network-eu', program: 'pgm-shared-svcs', environment: 'prod', location: 'westeurope', services: [
    { name: 'vnet-hub-weu', shapeKey: 'vnet', multiplier: 2.0 },
    { name: 'fd-shared-weu', shapeKey: 'cdn', multiplier: 0.5 },
  ]},
  { rg: 'rg-shared-security', program: 'pgm-shared-svcs', environment: 'prod', location: 'eastus', services: [
    { name: 'kv-shared-secrets', shapeKey: 'keyVault', multiplier: 2.0 },
    { name: 'appi-platform', shapeKey: 'appInsights', multiplier: 1.4 },
  ]},
  { rg: 'rg-shared-identity', program: 'pgm-shared-svcs', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-idp-broker', shapeKey: 'containerApps', multiplier: 0.5 },
    { name: 'cdb-identity', shapeKey: 'cosmosdb', multiplier: 0.4 },
    { name: 'kv-identity', shapeKey: 'keyVault' },
  ]},
  // Untagged drift
  { rg: 'rg-misc-sandbox', program: '__untagged__', environment: 'dev', location: 'eastus', services: [
    { name: 'ca-sandbox-1', shapeKey: 'containerApps', multiplier: 0.2 },
    { name: 'st-sandbox', shapeKey: 'storageBlob', multiplier: 0.4 },
  ]},
  { rg: 'rg-legacy-archive', program: '__untagged__', environment: 'prod', location: 'centralus', services: [
    { name: 'st-archive-legacy', shapeKey: 'storageBlob', multiplier: 1.8 },
    { name: 'pg-legacy-readonly', shapeKey: 'postgresFlex', multiplier: 0.4 },
    { name: 'kv-legacy', shapeKey: 'keyVault' },
  ]},
  // Extra rgs to hit ~20 total
  { rg: 'rg-ecom-payments', program: 'pgm-ecom', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-payments', shapeKey: 'containerApps', multiplier: 0.7 },
    { name: 'pg-payments', shapeKey: 'postgresFlex', multiplier: 0.6 },
    { name: 'kv-payments', shapeKey: 'keyVault' },
  ]},
  { rg: 'rg-cust-care', program: 'pgm-store-ops', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-care-bot', shapeKey: 'containerApps', multiplier: 0.5 },
    { name: 'aoai-care', shapeKey: 'openai', multiplier: 0.6 },
    { name: 'appi-care', shapeKey: 'appInsights' },
  ]},
  { rg: 'rg-data-mlops', program: 'pgm-data-platform', environment: 'prod', location: 'westus2', services: [
    { name: 'ca-mlops-train', shapeKey: 'containerApps', multiplier: 0.8 },
    { name: 'aoai-mlops', shapeKey: 'openai', multiplier: 1.1 },
    { name: 'st-mlops-models', shapeKey: 'storageBlob', multiplier: 0.9 },
    { name: 'pg-mlops-meta', shapeKey: 'postgresFlex', multiplier: 0.5 },
    { name: 'srch-mlops-features', shapeKey: 'aiSearch', multiplier: 0.5 },
  ]},
  { rg: 'rg-ecom-recs', program: 'pgm-ecom', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-recs-api', shapeKey: 'containerApps', multiplier: 0.8 },
    { name: 'aoai-recs', shapeKey: 'openai', multiplier: 1.0 },
    { name: 'cdb-recs-state', shapeKey: 'cosmosdb', multiplier: 0.7 },
    { name: 'srch-recs-catalog', shapeKey: 'aiSearch', multiplier: 0.8 },
    { name: 'appi-recs', shapeKey: 'appInsights' },
    { name: 'kv-recs', shapeKey: 'keyVault' },
  ]},
  { rg: 'rg-supply-analytics', program: 'pgm-supply-chain', environment: 'prod', location: 'centralus', services: [
    { name: 'ca-supply-analytics', shapeKey: 'containerApps', multiplier: 0.7 },
    { name: 'pg-supply-marts', shapeKey: 'postgresFlex', multiplier: 0.9 },
    { name: 'st-supply-staging', shapeKey: 'storageBlob', multiplier: 1.1 },
    { name: 'aoai-supply-summary', shapeKey: 'openai', multiplier: 0.6 },
    { name: 'appi-supply-analytics', shapeKey: 'appInsights' },
  ]},
  { rg: 'rg-store-ops-mobile', program: 'pgm-store-ops', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-store-mobile', shapeKey: 'containerApps', multiplier: 0.6 },
    { name: 'apim-store-mobile', shapeKey: 'apim', multiplier: 0.8 },
    { name: 'cdb-store-mobile', shapeKey: 'cosmosdb', multiplier: 0.5 },
    { name: 'appi-store-mobile', shapeKey: 'appInsights' },
    { name: 'kv-store-mobile', shapeKey: 'keyVault' },
  ]},
  { rg: 'rg-shared-observability', program: 'pgm-shared-svcs', environment: 'prod', location: 'eastus', services: [
    { name: 'appi-tenant-shared', shapeKey: 'appInsights', multiplier: 2.0 },
    { name: 'st-logs-archive', shapeKey: 'storageBlob', multiplier: 1.6 },
    { name: 'sb-telemetry', shapeKey: 'serviceBus', multiplier: 1.5 },
  ]},
  { rg: 'rg-ecom-checkout', program: 'pgm-ecom', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-checkout-api', shapeKey: 'containerApps', multiplier: 1.0 },
    { name: 'pg-checkout', shapeKey: 'postgresFlex', multiplier: 0.7 },
    { name: 'sb-checkout-events', shapeKey: 'serviceBus' },
    { name: 'kv-checkout', shapeKey: 'keyVault' },
    { name: 'appi-checkout', shapeKey: 'appInsights' },
    { name: 'apim-checkout', shapeKey: 'apim', multiplier: 0.6 },
    { name: 'st-checkout-receipts', shapeKey: 'storageBlob', multiplier: 0.5 },
  ]},
  { rg: 'rg-ecom-search', program: 'pgm-ecom', environment: 'prod', location: 'eastus', services: [
    { name: 'srch-products-recall', shapeKey: 'aiSearch', multiplier: 1.5 },
    { name: 'ca-search-api', shapeKey: 'containerApps', multiplier: 0.6 },
    { name: 'cdb-search-state', shapeKey: 'cosmosdb', multiplier: 0.4 },
    { name: 'appi-search', shapeKey: 'appInsights' },
  ]},
  { rg: 'rg-supply-orders', program: 'pgm-supply-chain', environment: 'prod', location: 'centralus', services: [
    { name: 'ca-po-svc', shapeKey: 'containerApps', multiplier: 0.5 },
    { name: 'pg-po', shapeKey: 'postgresFlex', multiplier: 0.7 },
    { name: 'sb-po-events', shapeKey: 'serviceBus' },
    { name: 'kv-supply-orders', shapeKey: 'keyVault' },
    { name: 'appi-supply-orders', shapeKey: 'appInsights' },
    { name: 'st-po-archive', shapeKey: 'storageBlob', multiplier: 0.6 },
  ]},
  { rg: 'rg-data-governance', program: 'pgm-data-platform', environment: 'prod', location: 'westus2', services: [
    { name: 'ca-catalog-svc', shapeKey: 'containerApps', multiplier: 0.4 },
    { name: 'pg-catalog', shapeKey: 'postgresFlex', multiplier: 0.5 },
    { name: 'st-policy-bundles', shapeKey: 'storageBlob', multiplier: 0.6 },
    { name: 'appi-governance', shapeKey: 'appInsights' },
    { name: 'kv-governance', shapeKey: 'keyVault' },
  ]},
  { rg: 'rg-store-ops-receiving', program: 'pgm-store-ops', environment: 'prod', location: 'eastus', services: [
    { name: 'ca-receiving', shapeKey: 'containerApps', multiplier: 0.5 },
    { name: 'cdb-receiving', shapeKey: 'cosmosdb', multiplier: 0.4 },
    { name: 'sb-receiving-events', shapeKey: 'serviceBus' },
    { name: 'appi-receiving', shapeKey: 'appInsights' },
  ]},
  { rg: 'rg-shared-cicd', program: 'pgm-shared-svcs', environment: 'prod', location: 'eastus', services: [
    { name: 'st-cicd-cache', shapeKey: 'storageBlob', multiplier: 0.8 },
    { name: 'ca-runner-pool', shapeKey: 'containerApps', multiplier: 0.6 },
    { name: 'kv-cicd-secrets', shapeKey: 'keyVault' },
  ]},
];

const SUBSCRIPTIONS = [
  '00000000-0000-0000-0000-0000000a0001', // ecom
  '00000000-0000-0000-0000-0000000a0002', // supply
  '00000000-0000-0000-0000-0000000a0003', // store ops
  '00000000-0000-0000-0000-0000000a0004', // data platform
  '00000000-0000-0000-0000-0000000a0005', // shared / legacy
];

function subscriptionFor(program: ResourceShape['program']): string {
  switch (program) {
    case 'pgm-ecom': return SUBSCRIPTIONS[0];
    case 'pgm-supply-chain': return SUBSCRIPTIONS[1];
    case 'pgm-store-ops': return SUBSCRIPTIONS[2];
    case 'pgm-data-platform': return SUBSCRIPTIONS[3];
    case 'pgm-shared-svcs': return SUBSCRIPTIONS[4];
    case '__untagged__': return SUBSCRIPTIONS[4];
  }
}

/** Deterministic seeded RNG so the synthetic file is reproducible. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function rand(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS_BACK = 12;

function buildMonths(asOf: Date): Array<{ start: string; end: string }> {
  const months: Array<{ start: string; end: string }> = [];
  // 12 full months ending in the month BEFORE asOf
  const base = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1));
  for (let i = MONTHS_BACK; i >= 1; i -= 1) {
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    months.push({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
  }
  return months;
}

export interface SampleOptions {
  asOf?: Date;
  seed?: number;
}

export function generateSampleRows(options: SampleOptions = {}): AzureCostRow[] {
  const asOf = options.asOf ?? new Date('2026-05-01T00:00:00Z');
  const rand = mulberry32(options.seed ?? 0xA21EC057);
  const months = buildMonths(asOf);
  const rows: AzureCostRow[] = [];

  months.forEach((period, monthIdx) => {
    for (const resource of RESOURCES) {
      for (const svc of resource.services) {
        const shape = SERVICE_SHAPES[svc.shapeKey];
        if (!shape) continue;
        const growthFactor = (shape.growth ?? 1) ** monthIdx;
        const multiplier = svc.multiplier ?? 1;
        const jitter = (rand() - 0.5) * 2 * shape.variance;
        const cost = Math.max(0, (shape.base * multiplier * growthFactor) + jitter);
        rows.push({
          subscriptionId: subscriptionFor(resource.program),
          resourceGroup: resource.rg,
          resourceName: svc.name,
          service: shape.service,
          tagProgram: resource.program,
          tagEnvironment: resource.environment,
          periodStart: period.start,
          periodEnd: period.end,
          monthlyCostUsd: Math.round(cost * 100) / 100,
          currency: 'USD',
          meterCategory: shape.meter,
          location: resource.location,
        });
      }
    }
  });

  return rows;
}
