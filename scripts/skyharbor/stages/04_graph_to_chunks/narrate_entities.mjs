#!/usr/bin/env node
/**
 * Emits RAG chunks from records and graph entities.
 *
 * Usage:
 *   node scripts/skyharbor/stages/04_graph_to_chunks/narrate_entities.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Emits RAG chunks from records and graph entities.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("04_graph_to_chunks/narrate_entities.mjs".includes('coverage_report') || "04_graph_to_chunks/narrate_entities.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
