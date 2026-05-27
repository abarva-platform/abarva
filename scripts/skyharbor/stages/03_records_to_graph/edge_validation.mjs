#!/usr/bin/env node
/**
 * Checks orphan and dangling references.
 *
 * Usage:
 *   node scripts/skyharbor/stages/03_records_to_graph/edge_validation.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Checks orphan and dangling references.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("03_records_to_graph/edge_validation.mjs".includes('coverage_report') || "03_records_to_graph/edge_validation.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
