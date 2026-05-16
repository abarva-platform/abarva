import {
  ATLAS_DOCTRINE_VERSION,
  composeAtlasSystemPrompt,
} from '../atlas';

describe('composeAtlasSystemPrompt — L7 live-gate discipline', () => {
  const prompt = composeAtlasSystemPrompt({ surface: '/tower' });

  it('bumps the Atlas doctrine for the L7 quality gate', () => {
    expect(ATLAS_DOCTRINE_VERSION.voice).toBe('0.draft.2026-05-16a');
  });

  it('locks board pre-read, model-risk, evidence-map, and continuity wording', () => {
    expect(prompt).toMatch(/L7\s+live[- ]gate\s+discipline/i);
    expect(prompt).toMatch(/board\s+pre-read/i);
    expect(prompt).toMatch(/say\s+"why"\s+explicitly/i);
    expect(prompt).toMatch(/exact\s+phrase\s+"model\s+risk"/i);
    expect(prompt).toMatch(/strongest\s+evidence/i);
    expect(prompt).toMatch(/confidence\s+level/i);
    expect(prompt).toMatch(/what\s+changed/i);
  });
});
