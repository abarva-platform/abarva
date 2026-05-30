import { classifyAtlasIacIntent } from '../intent';

describe('Atlas IAC intent classifier', () => {
  it('detects initiative-specific prompts', () => {
    expect(classifyAtlasIacIntent('tell me about AR-02')).toMatchObject({
      kind: 'initiative-specific',
      initiativeId: 'AR-02',
    });
  });

  it('detects archetype-specific prompts', () => {
    expect(classifyAtlasIacIntent('what is the trend in Claude Code adoption?')).toMatchObject({
      kind: 'archetype-specific',
      archetypeKey: 'claude_code',
    });
  });

  it('detects hybrid initiative plus industry prompts', () => {
    expect(classifyAtlasIacIntent('how does our AR-02 Copilot pilot compare to industry?')).toMatchObject({
      kind: 'hybrid',
      initiativeId: 'AR-02',
      archetypeKey: 'microsoft_365_copilot',
    });
  });
});
