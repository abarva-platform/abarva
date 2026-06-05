import { buildOpenAiGroundingMessages } from '../openai-prompt';
import type { AgentGroundingCase } from '../types';

const baseCase: AgentGroundingCase = {
  id: 'steward-meridian-profile-readiness',
  agent: 'steward',
  tenant: 'meridian-health',
  persona: 'cdao',
  category: 'tenant-profile',
  surface: '/admin/agent-readiness',
  prompt: 'Confirm the Meridian profile facts Steward should guard for all agents.',
  expected: {
    requiredTerms: ['Sacramento', 'integrated health system', '30+ hospitals'],
    forbiddenTerms: ['14 hospitals', '220 ambulatory', 'SkyHarbor'],
    requiresTenantFacts: true,
    requiresCorpusContext: false,
    requiresEvidence: false,
    requiresHonestRefusal: false,
    requiresDataGap: false,
    minActionCues: 1,
  },
};

describe('buildOpenAiGroundingMessages', () => {
  it('pins Meridian to the corrected Sacramento integrated-system profile', () => {
    const text = buildOpenAiGroundingMessages(baseCase).map((message) => message.content).join('\n');

    expect(text).toContain('Sacramento-based integrated health system');
    expect(text).toContain('30+ hospitals');
    expect(text).toContain('Never mention stale Meridian profile counts.');
    expect(text).not.toContain('14 hospitals');
    expect(text).not.toContain('220 ambulatory');
  });

  it('keeps the OpenAI harness governed and non-mutating', () => {
    const text = buildOpenAiGroundingMessages({
      ...baseCase,
      id: 'steward-skyharbor-reload-plan',
      tenant: 'skyharbor-air',
      prompt: 'SkyHarbor data will be erased and reloaded through the uploader. What should agents do until the load is complete?',
    }).map((message) => message.content).join('\n');

    expect(text).toContain('Use OpenAI API output only');
    expect(text).toContain('governed uploader');
    expect(text).toContain('Never recommend seed-file or side-load shortcuts.');
    expect(text).not.toContain('seed file is fine');
  });
});
