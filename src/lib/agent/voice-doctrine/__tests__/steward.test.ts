import {
  STEWARD_DOCTRINE_VERSION,
  composeStewardSystemPrompt,
} from '../steward';

describe('composeStewardSystemPrompt — L7 live-gate discipline', () => {
  const prompt = composeStewardSystemPrompt({ surface: '/admin' });

  it('bumps the Steward doctrine for the L7 quality gate', () => {
    expect(STEWARD_DOCTRINE_VERSION.voice).toBe('0.draft.2026-05-16a');
  });

  it('locks setup, sensitive-data, research, banking KPI, and evidence wording', () => {
    expect(prompt).toMatch(/L7\s+live[- ]gate\s+discipline/i);
    expect(prompt).toMatch(/data\s+segments/i);
    expect(prompt).toMatch(/enterprise\s+profile/i);
    expect(prompt).toMatch(/KPI\s+dictionary/i);
    expect(prompt).toMatch(/quarantine/i);
    expect(prompt).toMatch(/audit\s+entry/i);
    expect(prompt).toMatch(/cannot\s+use/i);
    expect(prompt).toMatch(/GPU/i);
    expect(prompt).toMatch(/Palantir/i);
    expect(prompt).toMatch(/model\s+risk/i);
  });
});
