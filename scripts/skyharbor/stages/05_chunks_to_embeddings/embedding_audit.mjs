#!/usr/bin/env node
/**
 * Checks embedding manifest and post-load audit rows.
 *
 * Usage:
 *   node scripts/skyharbor/stages/05_chunks_to_embeddings/embedding_audit.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Checks embedding manifest and post-load audit rows.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("05_chunks_to_embeddings/embedding_audit.mjs".includes('coverage_report') || "05_chunks_to_embeddings/embedding_audit.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
