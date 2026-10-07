#!/usr/bin/env tsx
/**
 * Report what the declared archetype configuration source will do, before a
 * deployment makes it the thing generating a client's evidence requests.
 *
 * Read-only: it resolves the same source the generation path resolves and
 * prints the outcome. It writes nothing, touches no tenant data and needs no
 * credentials.
 *
 *   ABARVA_ARCHETYPE_CONFIG_PATH=./my-archetypes.json \
 *     npm run moves:archetype-config-preflight
 *
 * Exit code is the verdict, so a deploy step can gate on it:
 *   0  nothing declared, or every configured entry takes effect
 *   1  the source was rejected whole, or an entry does not do what it looks
 *      like it does (an unreachable addition, or an id declared twice)
 */

import {
  archetypeConfigPreflightPasses,
  formatArchetypeConfigPreflight,
  preflightArchetypeConfig,
} from "../../src/lib/deliverables/orchestrator/briefs/archetype-config-preflight";

const report = preflightArchetypeConfig();
console.log(formatArchetypeConfigPreflight(report));
process.exit(archetypeConfigPreflightPasses(report) ? 0 : 1);
