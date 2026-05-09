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
});
