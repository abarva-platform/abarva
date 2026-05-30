/**
 * Content-quality floor for the Workday AI Agents and Oracle AI Agents
 * archetypes. ERP AI-agent adoption data is still sparse, so this test locks
 * the task brief's qualitative floor rather than forcing fabricated metrics.
 */

import { oracleAiAgentsArchetype } from '../archetypes/oracle-ai-agents';
import { workdayAiAgentsArchetype } from '../archetypes/workday-ai-agents';
import type { InitiativeArchetype } from '../types';

const WAVE_TWO_ARCHETYPES: ReadonlyArray<readonly [string, InitiativeArchetype]> = [
  ['oracle_ai_agents', oracleAiAgentsArchetype],
  ['workday_ai_agents', workdayAiAgentsArchetype],
];

describe('IAC Wave 2 — Workday + Oracle ERP AI agents content floor', () => {
  it.each(WAVE_TWO_ARCHETYPES)('%s: archetypeKey matches', (key, archetype) => {
    expect(archetype.archetypeKey).toBe(key);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: has a non-empty label and definition', (_key, archetype) => {
    expect(archetype.label.length).toBeGreaterThan(0);
    expect(archetype.definition.length).toBeGreaterThan(40);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: category is ai-erp', (_key, archetype) => {
    expect(archetype.category).toBe('ai-erp');
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 2 deployment patterns', (_key, archetype) => {
    expect(archetype.deploymentPatterns.length).toBeGreaterThanOrEqual(2);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 2 pitfalls', (_key, archetype) => {
    expect(archetype.commonPitfalls.length).toBeGreaterThanOrEqual(2);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 2 emerging patterns (whatNext)', (_key, archetype) => {
    expect(archetype.whatNext.length).toBeGreaterThanOrEqual(2);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 3 evidence anchors', (_key, archetype) => {
    expect(archetype.evidenceAnchors.length).toBeGreaterThanOrEqual(3);
  });

  it.each(WAVE_TWO_ARCHETYPES)(
    '%s: trendDirection is early or emerging',
    (_key, archetype) => {
      expect(['early', 'emerging']).toContain(archetype.trendDirection.direction);
    },
  );
});
