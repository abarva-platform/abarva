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

  // HI-4 fix — display-id prefixes must include FCF (First Capital) and
  // SHA (SkyHarbor), and MR (Meridian alt). The original regex only had
  // `FC` which `\b`-boundary-failed on real `FCF-NN` codes.
  it.each([
    ['Compare FCF-01 to industry benchmarks', 'FCF-01'],
    ['Compare FCF-018 to industry benchmarks', 'FCF-018'],
    ['What is the status of SHA-12?', 'SHA-12'],
    ['Tell me about MR-01', 'MR-01'],
    ['Compare AR-01 to industry benchmarks', 'AR-01'],
    ['Tell me about MH-01', 'MH-01'],
  ])('extracts display_id from %s', (prompt, expected) => {
    expect(classifyAtlasIacIntent(prompt).initiativeId).toBe(expected);
  });
});
