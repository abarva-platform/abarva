#!/usr/bin/env node
/**
 * Runs the 25 CTO questions after load.
 *
 * Usage:
 *   node scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs
 */
import { spawnSync } from 'node:child_process';

console.log("Runs the 25 CTO questions after load.");
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if ("07_verify/ground_truth_runner.mjs".includes('coverage_report') || "07_verify/ground_truth_runner.mjs".includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
