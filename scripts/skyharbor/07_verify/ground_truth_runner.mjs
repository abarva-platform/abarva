#!/usr/bin/env node
/**
 * Compatibility entrypoint for Packet 29 Section 8.
 *
 * The implementation lives under the staged SkyHarbor pipeline folder. Keep
 * this wrapper so the documented command remains stable:
 *
 *   node scripts/skyharbor/07_verify/ground_truth_runner.mjs --persona=cto
 */

import '../stages/07_verify/ground_truth_runner.mjs';
