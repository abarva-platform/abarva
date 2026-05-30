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
import { claudeCodeArchetype } from './archetypes/claude-code';
import { githubCopilotArchetype } from './archetypes/github-copilot';
import { microsoft365CopilotArchetype } from './archetypes/microsoft-365-copilot';
import { salesforceEinsteinAgentforceArchetype } from './archetypes/salesforce-einstein-agentforce';

export const INITIATIVE_ARCHETYPES: InitiativeArchetype[] = [
  claudeCodeArchetype,
  githubCopilotArchetype,
  microsoft365CopilotArchetype,
  salesforceEinsteinAgentforceArchetype,
  // Sibling slices append here, alphabetical by `archetypeKey`.
];
