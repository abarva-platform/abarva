import {
  AGENT_OUTPUT_LENGTH_BUDGETS,
  AGENT_OUTPUT_SHAPES,
  composeRuntimeOutputDisciplineBlock,
  normalizeOutputDisciplinedAgent,
} from './prompt-contract';

describe('agent output prompt contract', () => {
  it('locks the six allowed answer shapes', () => {
    expect(AGENT_OUTPUT_SHAPES).toEqual([
      'cxo-decision-digest',
      'lead-bullets',
      'lead-table',
      'stat-stack',
      'sequential-steps',
      'brief-narrative',
    ]);
  });

  it.each([
    ['Nexus', 'nexus', 200, 350],
    ['Sentinel', 'sentinel', 250, 400],
    ['Atlas', 'atlas', 220, 350],
    ['Source', 'source', 350, 500],
    ['Steward', 'steward', 180, 300],
  ] as const)('sets a runtime budget for %s', (agentName, key, soft, hard) => {
    expect(normalizeOutputDisciplinedAgent(agentName)).toBe(key);
    expect(AGENT_OUTPUT_LENGTH_BUDGETS[key]).toMatchObject({
      softWords: soft,
      hardWords: hard,
    });

    const block = composeRuntimeOutputDisciplineBlock(agentName);
    expect(block).toContain(`soft ${soft} words, hard ${hard} words`);
    expect(block).toContain('cxo-decision-digest, lead-bullets, lead-table, stat-stack, sequential-steps, or brief-narrative');
  });

  it('forbids raw markdown, visible raw ids, oversized structures, and unsupported value ranking', () => {
    const block = composeRuntimeOutputDisciplineBlock('Nexus');

    expect(block).toContain('For hard CXO or strategic questions, default to cxo-decision-digest');
    expect(block).toContain('CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap');
    expect(block).toContain('Simple factual questions stay simple');
    expect(block).toContain('avoid wall-of-text answers over roughly 120 words');
    expect(block).toContain('do not emit raw markdown emphasis markers');
    expect(block).toContain('do not show raw pattern, use-case, vendor, database field, or artifact IDs');
    expect(block).toContain('no paragraph over 3 sentences');
    expect(block).toContain('rank from available tenant KPIs, financials, strategic priorities, systems, current programs, and evidence');
    expect(block).toContain('State exactly what is missing');
  });
});
