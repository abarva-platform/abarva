import {
  buildCurrentStateAdvisory,
  isBroadCurrentStateQuestion,
  sanitizeAskSynthesis,
} from './response-policy';
import type { AskSource } from './types';

const surfaceSources: AskSource[] = [
  {
    type: 'SURFACE',
    name: 'Apex Retail live Intelligence surface',
    id: 'brief',
    confidence: 0.99,
    detail: [
      'Active Intelligence surface: brief.',
      '- Active client: Apex Retail.',
      '- Brief: 3 ranked bets above the line, 5 below the line, 3 triggered patterns.',
      '- Brief synthesis: Sentinel sees Apex Retail priorities above the line: fix customer identity before scaling loyalty AI, sequence demand sensing through data readiness, and make the AI roadmap honest about platform prerequisites.',
    ].join('\n'),
  },
  {
    type: 'TENANT',
    name: 'Apex Retail 360 Intelligence substrate',
    id: 'apexretail',
    confidence: 0.96,
    detail: [
      'Tenant 360: Apex Retail.',
      '- Executive posture: CMO wants loyalty and personalization outcomes, CTO owns platform/CDP plumbing, CFO wants cost-takeout evidence, CIO is sequencing platform modernization.',
      '- Current strategic center: resolve customer identity and consent, decide the integration hub, sequence demand sensing through item-location readiness, and prevent AI pilots from outrunning data readiness.',
    ].join('\n'),
  },
];

describe('Ask Intelligence response policy', () => {
  it('recognizes broad current-state questions', () => {
    expect(isBroadCurrentStateQuestion('Can you give me a perspective of our current state?')).toBe(true);
    expect(isBroadCurrentStateQuestion('Where do we stand right now?')).toBe(true);
    expect(isBroadCurrentStateQuestion('Compare Snowflake and Databricks')).toBe(false);
  });

  it('strips markdown control characters before plain-text dock rendering', () => {
    expect(sanitizeAskSynthesis('Apex has **3 bets** and `F200` active.')).toBe('Apex has 3 bets and F200 active.');
  });

  it('builds an advisor-style current-state answer instead of a metric dump', () => {
    const answer = buildCurrentStateAdvisory(surfaceSources);

    expect(answer).toContain('My read: Apex Retail is not short on AI ideas.');
    expect(answer).toContain('Business lens: Sentinel sees Apex Retail priorities');
    expect(answer).toContain('Technical lens: resolve customer identity');
    expect(answer).toContain('CFO value lens');
    expect(answer).not.toContain('3 ranked bets');
    expect(answer).not.toContain('**');
  });
});
