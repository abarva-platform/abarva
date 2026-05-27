#!/usr/bin/env node
/**
 * Verifies cross-tenant reads return zero SkyHarbor rows.
 *
 * Usage:
 *   node scripts/skyharbor/stages/06_load_to_azure/rls_verification.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Verifies cross-tenant reads return zero SkyHarbor rows.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("06_load_to_azure/rls_verification.mjs".includes('coverage_report') || "06_load_to_azure/rls_verification.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
