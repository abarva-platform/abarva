#!/usr/bin/env node
/**
 * Validates records against JSON schema templates.
 *
 * Usage:
 *   node scripts/skyharbor/stages/02_outline_to_records/enforce_schema.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Validates records against JSON schema templates.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("02_outline_to_records/enforce_schema.mjs".includes('coverage_report') || "02_outline_to_records/enforce_schema.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
