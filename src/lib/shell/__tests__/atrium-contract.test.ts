import {
  ATRIUM_AGENT_STATES,
  ATRIUM_LOCKED_DIMENSIONS,
  ATRIUM_MODULES,
  getAtriumModule,
} from '@/lib/shell/atrium-contract';

describe('Atrium contract registry', () => {
  it('locks the six platform modules in canonical order', () => {
    expect(ATRIUM_MODULES.map((module) => module.id)).toEqual([
      'home',
      'setup',
      'programs',
      'source',
      'intelligence',
      'tower',
    ]);
  });

  it('keeps Strategic Moves as the external label while preserving programs as the code id', () => {
    const moves = getAtriumModule('programs');

    expect(moves.canonicalName).toBe('Strategic Moves');
    expect(moves.productNavLabel).toBe('Strategic Moves');
    expect(moves.route).toBe('/programs');
    expect(moves.agent).toBe('Nexus');
  });

  it('locks the three agent states and dimensions named by canonical V2', () => {
    expect(ATRIUM_AGENT_STATES).toEqual(['ambient', 'engaged', 'focus']);
    expect(ATRIUM_LOCKED_DIMENSIONS).toMatchObject({
      topNavHeightPx: 32,
      submenuStripHeightPx: 36,
      ambientAgentWidthPx: 200,
      engagedAgentWidthPx: 360,
      focusAgentWidthPx: 520,
    });
  });

  it('locks the seven Intelligence submenus without an eighth tab', () => {
    expect(getAtriumModule('intelligence').submenus.map((item) => item.label)).toEqual([
      'Today',
      'By function',
      'Patterns',
      'Vendors',
      'Peer activity',
      'My strategy',
      'Sessions',
    ]);
  });

  it('keeps module agents aligned to the cross-module brief', () => {
    expect(Object.fromEntries(ATRIUM_MODULES.map((module) => [module.id, module.agent]))).toEqual({
      home: 'Atlas',
      setup: 'Steward',
      programs: 'Nexus',
      source: 'Nexus',
      intelligence: 'Sentinel',
      tower: 'Atlas',
    });
  });
});
