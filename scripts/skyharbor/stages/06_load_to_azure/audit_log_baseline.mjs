#!/usr/bin/env node
/**
 * Reports ai_egress_audit rows after load.
 *
 * Usage:
 *   node scripts/skyharbor/stages/06_load_to_azure/audit_log_baseline.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Reports ai_egress_audit rows after load.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("06_load_to_azure/audit_log_baseline.mjs".includes('coverage_report') || "06_load_to_azure/audit_log_baseline.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
