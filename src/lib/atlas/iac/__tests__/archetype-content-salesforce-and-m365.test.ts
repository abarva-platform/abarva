/**
 * Content-quality floor for the Wave 2 sibling archetypes shipped in the
 * Salesforce + Microsoft 365 slice.
 *
 * Minima per archetype (mirrors the reference floor in
 * `archetype-content.test.ts`):
 *  - 4 adoption metrics
 *  - 3 deployment patterns
 *  - 3 pitfalls
 *  - 3 emerging patterns ("whatNext")
 *  - 4 evidence anchors
 */

import { microsoft365CopilotArchetype } from '../archetypes/microsoft-365-copilot';
import { salesforceEinsteinAgentforceArchetype } from '../archetypes/salesforce-einstein-agentforce';
import type { InitiativeArchetype } from '../types';

const WAVE_2_ARCHETYPES: ReadonlyArray<readonly [string, InitiativeArchetype]> = [
  ['microsoft_365_copilot', microsoft365CopilotArchetype],
  ['salesforce_einstein_agentforce', salesforceEinsteinAgentforceArchetype],
];

describe('IAC Wave 2 — Salesforce + M365 content floor', () => {
  it.each(WAVE_2_ARCHETYPES)('%s: archetypeKey matches', (key, archetype) => {
    expect(archetype.archetypeKey).toBe(key);
  });

  it.each(WAVE_2_ARCHETYPES)('%s: has a non-empty label and definition', (_key, archetype) => {
    expect(archetype.label.length).toBeGreaterThan(0);
    expect(archetype.definition.length).toBeGreaterThan(40);
  });

  it.each(WAVE_2_ARCHETYPES)('%s: at least 4 adoption metrics', (_key, archetype) => {
    expect(archetype.adoptionMetrics.length).toBeGreaterThanOrEqual(4);
  });

  it.each(WAVE_2_ARCHETYPES)('%s: at least 3 deployment patterns', (_key, archetype) => {
    expect(archetype.deploymentPatterns.length).toBeGreaterThanOrEqual(3);
  });

  it.each(WAVE_2_ARCHETYPES)('%s: at least 3 pitfalls', (_key, archetype) => {
    expect(archetype.commonPitfalls.length).toBeGreaterThanOrEqual(3);
  });

  it.each(WAVE_2_ARCHETYPES)('%s: at least 3 emerging patterns (whatNext)', (_key, archetype) => {
    expect(archetype.whatNext.length).toBeGreaterThanOrEqual(3);
  });

  it.each(WAVE_2_ARCHETYPES)('%s: at least 4 evidence anchors', (_key, archetype) => {
    expect(archetype.evidenceAnchors.length).toBeGreaterThanOrEqual(4);
  });

  it('microsoft_365_copilot category is ai-productivity', () => {
    expect(microsoft365CopilotArchetype.category).toBe('ai-productivity');
  });

  it('salesforce_einstein_agentforce category is ai-crm', () => {
    expect(salesforceEinsteinAgentforceArchetype.category).toBe('ai-crm');
  });

  it('both archetypes are trending mainstream-scaling', () => {
    expect(microsoft365CopilotArchetype.trendDirection.direction).toBe('mainstream-scaling');
    expect(salesforceEinsteinAgentforceArchetype.trendDirection.direction).toBe('mainstream-scaling');
  });
});
