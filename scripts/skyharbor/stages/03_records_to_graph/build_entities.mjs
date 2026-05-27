#!/usr/bin/env node
/**
 * Builds graph entity nodes from generated records.
 *
 * Usage:
 *   node scripts/skyharbor/stages/03_records_to_graph/build_entities.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Builds graph entity nodes from generated records.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("03_records_to_graph/build_entities.mjs".includes('coverage_report') || "03_records_to_graph/build_entities.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
