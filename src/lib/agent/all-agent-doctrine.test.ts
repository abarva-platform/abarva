import { composeAllAgentDoctrineBlock } from './all-agent-doctrine';

describe('composeAllAgentDoctrineBlock', () => {
  it('requires tenant and pattern grounding before synthesis', () => {
    const block = composeAllAgentDoctrineBlock({
      agentName: 'Nexus',
      surface: '/strategic-moves/new',
    });

    expect(block).toContain('active tenant/current-state context');
    expect(block).toContain('canonical industry/function/use-case patterns');
    expect(block).toContain('where is the most value?');
    expect(block).toContain('Never invent current-state facts');
    expect(block).toContain('Default answer shape');
  });

  it('maps setup, intelligence, moves, source, and tower surfaces', () => {
    expect(composeAllAgentDoctrineBlock({ agentName: 'Steward', surface: '/setup' })).toContain(
      'Surface family: setup_governance',
    );
    expect(composeAllAgentDoctrineBlock({ agentName: 'Sentinel', surface: '/intelligence' })).toContain(
      'Surface family: intelligence',
    );
    expect(composeAllAgentDoctrineBlock({ agentName: 'Nexus', surface: '/moves' })).toContain(
      'Surface family: strategic_moves',
    );
    expect(composeAllAgentDoctrineBlock({ agentName: 'Sentinel', surface: '/source' })).toContain(
      'Surface family: source',
    );
    expect(composeAllAgentDoctrineBlock({ agentName: 'Atlas', surface: '/tower' })).toContain(
      'Surface family: tower',
    );
  });
});
