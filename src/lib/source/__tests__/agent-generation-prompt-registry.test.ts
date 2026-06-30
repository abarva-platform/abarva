import {
  findMissingUpstreamCodes,
  getPromptTemplate,
  listSupportedGenerationCodes,
} from '@/lib/source/agent-generation';
import type { SourceGenerationContext } from '@/lib/source/agent-generation';

describe('Source agent generation prompt registry', () => {
  it('supports the P0 Value Target Brief as a generated artifact', () => {
    const template = getPromptTemplate('d02_value_target');

    expect(template?.artifactCode).toBe('d02_value_target');
    expect(template?.upstreamRequired).toEqual([]);
    expect(template?.upstreamOptional).toContain('d01_strategy_memo');
    expect(listSupportedGenerationCodes()).toContain('d02_value_target');
  });

  it('does not block d02 generation when the strategy memo is not authored yet', () => {
    const template = getPromptTemplate('d02_value_target');
    expect(template).not.toBeNull();

    const ctx: SourceGenerationContext = {
      tenantKey: 'demo',
      tenantName: 'Demo Tenant',
      event: {
        id: 'evt-1',
        code: 'SRC-DEMO-001',
        name: 'Demo Sourcing Event',
        archetype: 'AMS',
        rigor: 'standard',
        currentStageKey: 'strategy',
        statusLabel: 'Active',
        owner: 'CIO',
        triggerDescription: 'Renewal and service pressure.',
        scopeDescription: 'Scope boundary: Finance and HR support.',
        estimatedValueUsd: 1_200_000,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
    };

    expect(findMissingUpstreamCodes(template!, ctx)).toEqual([]);
  });
});
