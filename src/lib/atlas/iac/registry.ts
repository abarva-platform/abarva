/**
 * Initiative-Archetype Corpus (IAC) — registry.
 *
 * Single-entry-per-archetype registry. APPEND-ONLY across sibling slices:
 * Wave 2 agents each append ONE entry by importing their archetype here and
 * adding it to the `INITIATIVE_ARCHETYPES` array — alphabetical by
 * `archetypeKey` to make union merges trivial.
 *
 * Precedent: `src/lib/tower/ingest/registry.ts` uses the same append-only
 * shape; merge conflicts are resolved by union.
 */

import type { InitiativeArchetype } from './types';
import { aiLedProductDevelopmentArchetype } from './archetypes/ai-led-product-development';
import { claudeCodeArchetype } from './archetypes/claude-code';
import { cursorArchetype } from './archetypes/cursor';
import { githubCopilotArchetype } from './archetypes/github-copilot';
import { microsoft365CopilotArchetype } from './archetypes/microsoft-365-copilot';
import { oracleAiAgentsArchetype } from './archetypes/oracle-ai-agents';
import { salesforceEinsteinAgentforceArchetype } from './archetypes/salesforce-einstein-agentforce';
import { workdayAiAgentsArchetype } from './archetypes/workday-ai-agents';

export const INITIATIVE_ARCHETYPES: InitiativeArchetype[] = [
  aiLedProductDevelopmentArchetype,
  claudeCodeArchetype,
  cursorArchetype,
  githubCopilotArchetype,
  microsoft365CopilotArchetype,
  oracleAiAgentsArchetype,
  salesforceEinsteinAgentforceArchetype,
  workdayAiAgentsArchetype,
  // Sibling slices append here, alphabetical by `archetypeKey`.
];
