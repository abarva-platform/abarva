import { atlasStakeholderConflictHandoff } from '../index';
import { sanitizeAskSynthesis } from '../synthesizer';

describe('Ask Intelligence guardrails', () => {
  it('routes advice requests about executive contradictions to Atlas', () => {
    const handoff = atlasStakeholderConflictHandoff('What should I do about the CMO-vs-CFO contradiction?');

    expect(handoff).toContain('Atlas should own that call');
    expect(handoff).toContain('Sentinel should not prescribe');
    expect(handoff).not.toContain('concrete playbook');
  });

  it('does not route ordinary synthesis questions to Atlas', () => {
    expect(atlasStakeholderConflictHandoff('Why is Apex CDP at risk right now?')).toBeNull();
  });

  it('strips hollow openers from synthesized answers', () => {
    expect(sanitizeAskSynthesis('Good question, Anand. Let me give you an honest read here. Apex has a sourcing risk.'))
      .toBe('Apex has a sourcing risk.');
  });

  it('caps Ask Intelligence answers to the surface word limit', () => {
    const long = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ');
    const capped = sanitizeAskSynthesis(long, 120);

    expect(capped.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(120);
  });
});
