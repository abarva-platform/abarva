#!/usr/bin/env node
/**
 * Documents embedding handoff; runtime loader performs actual Azure/OpenAI embedding.
 *
 * Usage:
 *   node scripts/skyharbor/stages/05_chunks_to_embeddings/embed_chunks.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Documents embedding handoff; runtime loader performs actual Azure/OpenAI embedding.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("05_chunks_to_embeddings/embed_chunks.mjs".includes('coverage_report') || "05_chunks_to_embeddings/embed_chunks.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
