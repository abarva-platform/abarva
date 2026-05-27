#!/usr/bin/env node
/**
 * Builds graph edges from record relationships.
 *
 * Usage:
 *   node scripts/skyharbor/stages/03_records_to_graph/build_edges.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Builds graph edges from record relationships.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("03_records_to_graph/build_edges.mjs".includes('coverage_report') || "03_records_to_graph/build_edges.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
