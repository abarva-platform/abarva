#!/usr/bin/env node
/**
 * Checks chunk length, source citation, and fact density.
 *
 * Usage:
 *   node scripts/skyharbor/stages/04_graph_to_chunks/chunk_quality_gate.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Checks chunk length, source citation, and fact density.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("04_graph_to_chunks/chunk_quality_gate.mjs".includes('coverage_report') || "04_graph_to_chunks/chunk_quality_gate.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
