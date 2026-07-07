import { scoreGroundingCase } from '../scorer';
import type { AgentGroundingCase } from '../types';

const baseCase: AgentGroundingCase = {
  id: 'sentinel-meridian-profile',
  agent: 'sentinel',
  tenant: 'meridian-health',
  persona: 'cdao',
  category: 'tenant-profile',
  surface: '/intelligence',
  prompt: 'What should I know about Meridian before we discuss ambient AI?',
  expected: {
    requiredTerms: ['Sacramento', '30+ hospitals'],
    forbiddenTerms: ['14 hospitals', '220 ambulatory'],
    requiresTenantFacts: true,
    requiresCorpusContext: true,
    requiresEvidence: true,
    requiresHonestRefusal: false,
    requiresDataGap: false,
    minActionCues: 1,
  },
};

describe('scoreGroundingCase', () => {
  it('passes a grounded, cited, actionable answer', () => {
    const score = scoreGroundingCase(baseCase, {
      id: baseCase.id,
      mode: 'live',
      status: 200,
      answer:
        'Meridian is a Sacramento-based integrated health system with a 30+ hospitals footprint. The corpus pattern to use is clinical AI governance, not retail automation. Evidence basis: context layer and healthcare corpus as of the current run. Next step: validate the loaded profile in Steward before using this in an executive brief.',
    });

    expect(score.passed).toBe(true);
    expect(score.issues).toEqual([]);
  });

  it('blocks stale Meridian profile facts', () => {
    const score = scoreGroundingCase(baseCase, {
      id: baseCase.id,
      mode: 'live',
      status: 200,
      answer:
        'Meridian is a 14 hospitals and 220 ambulatory site system. Next step: proceed with a clinical AI plan.',
    });

    expect(score.passed).toBe(false);
    expect(score.issues.some((issue) => issue.code === 'forbidden_term')).toBe(true);
  });

  it('blocks cross-tenant bleed and raw implementation tokens', () => {
    const score = scoreGroundingCase(
      {
        ...baseCase,
        tenant: 'skyharbor-air',
        expected: {
          ...baseCase.expected,
          requiredTerms: ['airline'],
          forbiddenTerms: ['Innovaccer'],
        },
      },
      {
        id: baseCase.id,
        mode: 'live',
        status: 200,
        answer:
          'SkyHarbor is an airline, but the top risk is Innovaccer. signal:39901c16-2e8b-4c8c-b758-7ad81cc326e0 should be opened next.',
      },
    );

    expect(score.passed).toBe(false);
    expect(score.issues.some((issue) => issue.code === 'tenant_leak')).toBe(true);
    expect(score.issues.some((issue) => issue.code === 'raw_internal_id')).toBe(true);
  });

  it('requires honest refusal for cross-tenant prompts', () => {
    const score = scoreGroundingCase(
      {
        ...baseCase,
        category: 'cross-tenant',
        expected: {
          ...baseCase.expected,
          requiredTerms: ['not in your scope'],
          forbiddenTerms: ['sepsis baseline'],
          requiresTenantFacts: false,
          requiresCorpusContext: false,
          requiresEvidence: false,
          requiresHonestRefusal: true,
          minActionCues: 0,
        },
      },
      {
        id: baseCase.id,
        mode: 'live',
        status: 200,
        answer:
          'That Meridian item is not in your scope from the current tenant. I can summarize your own portfolio instead.',
      },
    );

    expect(score.passed).toBe(true);
  });

  it('treats an HTML page response as a transport failure, not an agent answer', () => {
    const score = scoreGroundingCase(baseCase, {
      id: baseCase.id,
      mode: 'unknown',
      status: 200,
      answer: '<!DOCTYPE html><html><head><title>AbarVa</title></head><body>Sign in</body></html>',
    });

    expect(score.passed).toBe(false);
    expect(score.issues.some((issue) => issue.severity === 'P0' && issue.code === 'transport_failure')).toBe(true);
  });

  it('matches single-word forbidden terms on word boundaries only', () => {
    const score = scoreGroundingCase(
      {
        ...baseCase,
        expected: {
          ...baseCase.expected,
          requiredTerms: ['Sacramento', '30+ hospitals', 'next'],
          forbiddenTerms: ['final'],
          requiresCorpusContext: false,
          requiresEvidence: false,
        },
      },
      {
        id: baseCase.id,
        mode: 'live',
        status: 200,
        answer:
          'Meridian is a Sacramento-based integrated health system with 30+ hospitals. Next step: finalize the profile review through Steward.',
      },
    );

    expect(score.issues.some((issue) => issue.code === 'forbidden_term')).toBe(false);
  });
});
