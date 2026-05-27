#!/usr/bin/env node
/**
 * Uses schema templates and outlines to emit records.
 *
 * Usage:
 *   node scripts/skyharbor/stages/02_outline_to_records/generate_records.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Uses schema templates and outlines to emit records.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("02_outline_to_records/generate_records.mjs".includes('coverage_report') || "02_outline_to_records/generate_records.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
