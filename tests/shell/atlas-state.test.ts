import {
  ATLAS_SYNTHESIS_TURN_ID,
  appendAtlasAgentTurn,
  appendAtlasUserTurn,
  createAtlasPageState,
  resetAtlasPageState,
} from '@/lib/shell/atlas-page-state';

describe('Atlas page state', () => {
  it('initializes tenant-aware state with synthesis as turn 0', () => {
    const state = createAtlasPageState({
      tenantName: ' Apex Retail Group ',
      surface: 'tower',
      stage: null,
      surfaceContext: { pressureCount: 3 },
      synthesisText: '3 active pressures need review.',
      timestamp: 100,
    });

    expect(state.tenantName).toBe('Apex Retail Group');
    expect(state.conversation).toHaveLength(1);
    expect(state.conversation[0]).toMatchObject({
      id: ATLAS_SYNTHESIS_TURN_ID,
      role: 'agent',
      text: '3 active pressures need review.',
      agentName: 'Atlas',
      timestamp: 100,
    });
  });

  it('appends user and agent turns without replacing synthesis', () => {
    const state = createAtlasPageState({
      tenantName: 'Apex Retail Group',
      surface: 'programs-detail',
      stage: 'P3',
      timestamp: 100,
    });

    const withUser = appendAtlasUserTurn(state, 'Explain the design risks', {
      timestamp: 101,
      id: 'user-1',
    });
    const withAgent = appendAtlasAgentTurn(withUser, 'Here are the risks.', {
      timestamp: 102,
      id: 'agent-1',
    });

    expect(withAgent.conversation.map((turn) => turn.id)).toEqual([
      ATLAS_SYNTHESIS_TURN_ID,
      'user-1',
      'agent-1',
    ]);
  });

  it('resets to a new tenant-scoped synthesis turn', () => {
    const state = appendAtlasUserTurn(
      createAtlasPageState({
        tenantName: 'Apex Retail Group',
        surface: 'source-detail',
        stage: 'S4',
        timestamp: 100,
      }),
      'What changed?',
      { timestamp: 101 },
    );

    const reset = resetAtlasPageState({
      tenantName: 'Northstar Foods',
      surface: 'source-detail',
      stage: 'S5',
      synthesisText: 'BAFO review is ready.',
      timestamp: 200,
    });

    expect(state.conversation).toHaveLength(2);
    expect(reset.tenantName).toBe('Northstar Foods');
    expect(reset.stage).toBe('S5');
    expect(reset.conversation).toHaveLength(1);
    expect(reset.conversation[0].text).toBe('BAFO review is ready.');
  });
});
