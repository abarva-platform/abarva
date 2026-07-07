import { classifyAtlasIntent } from './classifier';

describe('Atlas classifier', () => {
  it('routes broad current-state asks to the scripted executive summary path', () => {
    expect(classifyAtlasIntent('Can you give me a perspective of our current state?')).toEqual({
      intent: 'morning_summary',
      routeType: 'scripted',
    });
    expect(classifyAtlasIntent('Where do we stand right now?')).toEqual({
      intent: 'morning_summary',
      routeType: 'scripted',
    });
  });

  it('routes Copilot usage/value asks, including common typos, to a deterministic grounded path', () => {
    expect(classifyAtlasIntent('TALK TO ME ABOUT COPIPLOT USAGE AND VALUE')).toEqual({
      intent: 'copilot_usage_value',
      routeType: 'scripted',
    });
    expect(classifyAtlasIntent('Talk to me about Copilot usage and value')).toEqual({
      intent: 'copilot_usage_value',
      routeType: 'scripted',
    });
  });

  it('routes lagging realized-value asks to the measured/commit ranking path', () => {
    expect(classifyAtlasIntent('Show me the lagging programs by realized value')).toEqual({
      intent: 'lagging_programs_by_value',
      routeType: 'scripted',
    });
  });

  it('routes federated L0 visibility-boundary asks to a deterministic Tower path', () => {
    expect(classifyAtlasIntent('As the Lakeshore L0 sponsor, what can I see across Lakeshore Holdings and sibling HoldCos in Tower, and what can I not see without an explicit grant?')).toEqual({
      intent: 'federated_visibility_boundary',
      routeType: 'scripted',
    });
  });

  it('does not mistake board-language context asks for strategy refusal', () => {
    expect(classifyAtlasIntent('Explain Workday AI agents in board language: what is real, what is early, and what should we watch?')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
  });
});
