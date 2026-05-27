#!/usr/bin/env node
/**
 * Reads brief markdown and emits a structured outline skeleton.
 *
 * Usage:
 *   node scripts/skyharbor/stages/01_brief_to_outline/parse_brief.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Reads brief markdown and emits a structured outline skeleton.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("01_brief_to_outline/parse_brief.mjs".includes('coverage_report') || "01_brief_to_outline/parse_brief.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
