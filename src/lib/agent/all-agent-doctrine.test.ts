import { composeAllAgentDoctrineBlock } from './all-agent-doctrine';

describe('composeAllAgentDoctrineBlock', () => {
  it('requires tenant and pattern grounding before synthesis', () => {
    const block = composeAllAgentDoctrineBlock({
      agentName: 'Nexus',
      surface: '/strategic-moves/new',
    });

    expect(block).toContain('active tenant/current-state context');
    expect(block).toContain('Before I guide a Move');
    expect(block).toContain('phase, business problem, relevant industry patterns, failure modes');
    expect(block).toContain('expected artifacts, and value model');
    expect(block).toContain('guide the user to complete the work');
    expect(block).toContain('Pre-advice checklist: client context; phase or lifecycle stage; business problem');
    expect(block).toContain('Outcome-first: every response must clarify the decision');
    expect(block).toContain('Pattern-first: retrieve tenant context, industry patterns, AI patterns');
    expect(block).toContain('Evidence-governed: label claims as client fact, pattern-backed');
    expect(block).toContain('Artifact-driven: chat should advance a concrete work product');
    expect(block).toContain('Human-plus-agent by design');
    expect(block).toContain('Challenge mode: flag weak value case');
    expect(block).toContain('Value proof from day one');
    expect(block).toContain('canonical industry/function/use-case patterns');
    expect(block).toContain('where is the most value?');
    expect(block).toContain('Never invent current-state facts');
    expect(block).toContain('AGENT OUTPUT CONTRACT v2026-06-05');
    expect(block).toContain('three-depth CXO reading model');
    expect(block).toContain('cxo-decision-digest, lead-bullets, lead-table, stat-stack, sequential-steps, or brief-narrative');
    expect(block).toContain('CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap');
    expect(block).toContain('Simple factual questions stay simple');
    expect(block).toContain('do not emit raw markdown emphasis markers');
    expect(block).toContain('do not show raw pattern, use-case, vendor, database field, or artifact IDs');
    expect(block).toContain('AGENT OUTPUT FEW-SHOT EXAMPLES');
    expect(block).toContain('Do not copy the facts unless the current retrieved context supports them');
  });

  it('maps setup, intelligence, moves, source, and tower surfaces', () => {
    expect(composeAllAgentDoctrineBlock({ agentName: 'Steward', surface: '/admin/setup' })).toContain(
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

  it.each([
    ['Nexus', 'Before I guide a Move', 'value model'],
    ['Sentinel', 'Before I advise on Intelligence', 'what evidence would change the recommendation'],
    ['Source', 'Before I advise on Source', 'renewal clock'],
    ['Atlas', 'Before I advise in Tower', 'board-ready status'],
    ['Steward', 'Before I advise on Setup', 'which agent/module each data family unlocks'],
  ] as const)('injects the %s agent posture', (agentName, lead, requiredPhrase) => {
    const block = composeAllAgentDoctrineBlock({ agentName, surface: '/moves' });

    expect(block).toContain(lead);
    expect(block).toContain(requiredPhrase);
    expect(block).toContain('If any checklist element is missing');
  });
});
