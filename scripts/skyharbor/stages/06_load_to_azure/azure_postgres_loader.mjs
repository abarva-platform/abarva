#!/usr/bin/env node
/**
 * Runs TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts.
 *
 * Usage:
 *   node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Runs TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("06_load_to_azure/azure_postgres_loader.mjs".includes('coverage_report') || "06_load_to_azure/azure_postgres_loader.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
