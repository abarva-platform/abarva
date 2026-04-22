import {
  applyVoiceFilter,
  filterPayload,
  liveStripInternalTags,
} from '@/lib/nexus/voiceFilter';

describe('voice filter', () => {
  it('strips forbidden phrases from prose', () => {
    const result = applyVoiceFilter(
      "As an AI language model, I think this is right. Great question. Hope that helps.",
    );
    expect(result.cleaned).not.toMatch(/as an AI/i);
    expect(result.cleaned).not.toMatch(/I think/i);
    expect(result.cleaned).not.toMatch(/great question/i);
    expect(result.cleaned).not.toMatch(/hope that helps/i);
    expect(result.strippedCount).toBeGreaterThanOrEqual(4);
  });

  it('strips generic internal signal tags whose content looks like JSON', () => {
    const result = applyVoiceFilter(
      'Start <gate_approval>{"from_phase":0,"to_phase":1}</gate_approval> finish',
    );
    expect(result.cleaned).toBe('Start finish');
    expect(result.issues.some((issue) => issue.includes('internal signal tag'))).toBe(true);
  });

  it('preserves non-JSON markup-like content', () => {
    const result = applyVoiceFilter('Keep <em>this emphasis</em> intact.');
    expect(result.cleaned).toContain('<em>this emphasis</em>');
    expect(result.strippedCount).toBe(0);
  });

  it('hides an opening internal tag while the stream is incomplete', () => {
    const result = liveStripInternalTags('Visible text <gate_approval>{"from_phase":0');
    expect(result).toBe('Visible text');
  });

  it('deep-filters structured payload values without touching non-strings', () => {
    const input = {
      hero: 'I believe this works.',
      nested: [{ answer: 'As an AI language model, no.' }],
      count: 3,
    };
    const result = filterPayload(input);
    expect(result.filtered.hero).toBe('this works.');
    expect(result.filtered.nested[0].answer).toBe(', no.');
    expect(result.filtered.count).toBe(3);
    expect(result.strippedCount).toBeGreaterThanOrEqual(2);
  });
});
