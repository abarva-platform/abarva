#!/usr/bin/env node
/**
 * Checks named facts trace to records and no forbidden target-carrier claims appear.
 *
 * Usage:
 *   node scripts/skyharbor/stages/07_verify/fact_fingerprint_check.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Checks named facts trace to records and no forbidden target-carrier claims appear.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("07_verify/fact_fingerprint_check.mjs".includes('coverage_report') || "07_verify/fact_fingerprint_check.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
