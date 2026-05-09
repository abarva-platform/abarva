jest.mock('server-only', () => ({}));

import { atlasStakeholderConflictHandoff } from '../index';
import { retrieveSurfaceContextSources } from '../retrievers/surface-context';
import { chunkAskText, sanitizeAskSynthesis } from '../synthesizer';

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

  it('preserves whitespace across streamed synthesis chunks', () => {
    const text = 'Apex data and analytics current state includes Snowflake, Adobe Experience Platform, and Salesforce Marketing Cloud.';

    expect(chunkAskText(text).join('')).toBe(text);
  });

  it('promotes live surface facts as high-confidence Intelligence evidence', () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: 'vendors',
        activeClient: 'Apex Retail Group',
        clientKey: 'apexretail',
        stageFacts: ['Vendors tab: $107.4M spend across 21 active vendors.'],
        pageFacts: ['This is the live Apex Retail Intelligence substrate, not a healthcare fixture.'],
      },
      'current state of data analytics landscape',
    );

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      type: 'SURFACE',
      name: 'Apex Retail Group Intelligence surface',
      id: 'vendors',
      confidence: 0.98,
    });
    expect(sources[0].detail).toContain('Vendors tab: $107.4M spend');
    expect(sources[0].detail).toContain('not a healthcare fixture');
  });
});
