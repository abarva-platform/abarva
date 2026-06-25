/**
 * Tests for the tenant-identity pin + cross-tenant leak detector.
 *
 * Regression target: STRESS-P0-001 (2026-05-24 full-module stress test).
 * A Meridian Health CDIO authenticated session on /intelligence/ask
 * CROSS-CORPUS mode received an aVa response that asserted "you're
 * Apex Retail, a multi-banner specialty retailer" — including Apex's
 * FY2026 capital plan and funding-authority matrix surfaced TO the
 * Meridian session.
 *
 * Root cause: hardcoded Apex pin in the aVa synthesizer system prompt.
 * Fix: dynamic buildTenantIdentityPin(clientKey) + post-response
 * detectCrossTenantIdentityLeak() guard.
 */

import { describe, expect, it } from '@jest/globals';
import {
  buildTenantIdentityPin,
  detectCrossTenantIdentityLeak,
  detectOffTenantMention,
} from '../tenant-identity-pin';

describe('buildTenantIdentityPin', () => {
  describe('with each known tenant', () => {
    const fixtures = [
      {
        key: 'apexretail',
        expectedNameSubstring: 'Apex Retail Group',
        expectedVertical: 'Retail',
        offLimitsExamples: ['healthcare', 'Epic', 'HIPAA', 'Meridian'],
        notInOffLimits: ['multi-banner', 'merchandising', 'assortment'],
      },
      {
        key: 'meridian',
        expectedNameSubstring: 'Meridian Health System',
        expectedVertical: 'Healthcare',
        offLimitsExamples: ['retail', 'multi-banner', 'NCR POS', 'Apex'],
        notInOffLimits: ['Epic', 'HIPAA', 'clinical'],
      },
      {
        key: 'arcturus',
        expectedNameSubstring: 'First Capital Financial',
        expectedVertical: 'Financial Services',
        offLimitsExamples: ['retail', 'healthcare', 'Apex', 'Meridian', 'HIPAA'],
        notInOffLimits: ['FedNow', 'BSA', 'core banking'],
      },
      {
        key: 'skyharbor',
        expectedNameSubstring: 'SkyHarbor Air',
        expectedVertical: 'Global Airline',
        offLimitsExamples: ['retail', 'healthcare', 'Apex', 'Meridian', 'First Capital'],
        notInOffLimits: ['airline'],
      },
    ];

    for (const fx of fixtures) {
      it(`names the active tenant "${fx.expectedNameSubstring}" and lists vertical "${fx.expectedVertical}"`, () => {
        const pin = buildTenantIdentityPin(fx.key);
        expect(pin).toContain('TENANT IDENTITY');
        expect(pin).toContain('authoritative');
        expect(pin).toContain(fx.expectedNameSubstring);
        expect(pin).toContain(`vertical: ${fx.expectedVertical}`);
        expect(pin).toContain(`client_id: ${fx.key}`);
      });

      it(`marks other-vertical terminology as off-limits for ${fx.key}`, () => {
        const pin = buildTenantIdentityPin(fx.key);
        for (const term of fx.offLimitsExamples) {
          expect(pin).toMatch(new RegExp(`\\b${term}\\b`));
        }
        for (const own of fx.notInOffLimits) {
          // own-vertical terms should NOT appear in the off-limits line
          // (we look at the off-limits line specifically)
          const offLimitsLine = pin
            .split('\n')
            .find((line) => line.includes('Off-limits terminology'));
          if (offLimitsLine) {
            expect(offLimitsLine).not.toMatch(new RegExp(`\\b${own}\\b`));
          }
        }
      });
    }
  });

  describe('with no tenant', () => {
    it('returns a safe refusal pin when clientKey is null', () => {
      const pin = buildTenantIdentityPin(null);
      expect(pin).toContain('No active tenant');
      expect(pin).toContain('Decline tenant-specific questions');
      expect(pin).toContain('do not fabricate');
    });

    it('returns a safe refusal pin when clientKey is undefined', () => {
      const pin = buildTenantIdentityPin(undefined);
      expect(pin).toContain('No active tenant');
    });

    it('returns a safe refusal pin when clientKey is empty string', () => {
      const pin = buildTenantIdentityPin('');
      expect(pin).toContain('No active tenant');
    });

    it('does not fall back to Apex when passed a database UUID instead of a client key', () => {
      const pin = buildTenantIdentityPin('3f4a6d85-0ed0-4f6c-9d7a-9b6ad1e88c11');
      expect(pin).toContain('No active tenant');
      expect(pin).not.toMatch(/active\s+tenant.*Apex Retail/i);
    });
  });

  describe('STRESS-P0-001 regression — the exact failing case', () => {
    it('for Meridian session, the pin DOES NOT contain "Apex Retail" as an active-tenant assertion', () => {
      const pin = buildTenantIdentityPin('meridian');
      // The pin lists "Apex Retail" as an OFF-LIMITS tenant name (good), but
      // must never frame it as the active tenant.
      expect(pin).not.toMatch(/active\s+tenant.*is\s+["']?Apex Retail["']?/i);
      expect(pin).toMatch(/active\s+tenant.*is\s+["']?Meridian Health System["']?/i);
    });

    it('for Apex session, the pin DOES NOT contain "Meridian Health" as an active-tenant assertion', () => {
      const pin = buildTenantIdentityPin('apexretail');
      expect(pin).not.toMatch(/active\s+tenant.*is\s+["']?Meridian/i);
      expect(pin).toMatch(/active\s+tenant.*is\s+["']?Apex Retail Group["']?/i);
    });
  });
});

describe('detectOffTenantMention', () => {
  it('allows defensive off-tenant references that are not used as evidence', () => {
    const result = detectOffTenantMention({
      clientKey: 'skyharbor',
      response: 'SkyHarbor should avoid importing Apex Retail assumptions into the modernization readout.',
      query: 'What is one sensible next action for the SkyHarbor CTO?',
    });

    expect(result.detected).toBe(false);
  });

  it('detects off-tenant names used as tenant evidence in a non-comparison SkyHarbor response', () => {
    const result = detectOffTenantMention({
      clientKey: 'skyharbor',
      response:
        'SkyHarbor should use the Apex Retail capital plan facts to size the modernization readout.',
      query: 'What is one sensible next action for the SkyHarbor CTO?',
    });

    expect(result).toEqual({ detected: true, term: 'Apex Retail' });
  });

  it('allows explicit cross-industry comparison requests', () => {
    const result = detectOffTenantMention({
      clientKey: 'skyharbor',
      response: 'Compared with Apex Retail, SkyHarbor has a different modernization risk profile.',
      query: 'Give me a cross-industry comparison with retail peers.',
    });

    expect(result.detected).toBe(false);
  });

  it('does not flag the active tenant name', () => {
    const result = detectOffTenantMention({
      clientKey: 'skyharbor',
      response: 'SkyHarbor should use the IBM dependency evidence to sequence the next modernization move.',
      query: 'What is one sensible next action for the SkyHarbor CTO?',
    });

    expect(result.detected).toBe(false);
  });
});

describe('detectCrossTenantIdentityLeak', () => {
  describe('STRESS-P0-001 regression — exact captured failing response', () => {
    const verbatimFailingResponse = `Here's my honest read on what I have versus where I'm filling in gaps. High confidence — you're Apex Retail, a multi-banner specialty retailer, Fortune 500 scale. The multi-banner structure is a defining fact in your enterprise layer, and it shapes almost every AI bet I'd recommend — separate demand signals per banner, potential model duplication costs, governance complexity across banners. High confidence on your IT financial structure — I have FY2026 capital plan data with funding-source tagging.`;

    it('detects the leak when the response asserts "you\'re Apex Retail" on a Meridian session', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: verbatimFailingResponse,
      });
      expect(result.leaked).toBe(true);
      if (result.leaked) {
        expect(result.assertedTenant).toBe('Apex Retail');
      }
    });

    it('does NOT flag the same response when the session is correctly Apex', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'apexretail',
        response: verbatimFailingResponse,
      });
      expect(result.leaked).toBe(false);
    });
  });

  describe('various leak patterns', () => {
    it('detects "your organization is X" frame', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: 'Your organization is Apex Retail Group, a Fortune 500 specialty retailer.',
      });
      expect(result.leaked).toBe(true);
    });

    it('detects "the active tenant is X" frame', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: 'The active tenant is Apex Retail, so my recommendations focus on multi-banner specialty retail.',
      });
      expect(result.leaked).toBe(true);
    });

    it('detects "you are X" (without contraction)', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: 'High confidence — you are Apex Retail, a multi-banner specialty retailer.',
      });
      expect(result.leaked).toBe(true);
    });

    it('detects Meridian leak on an Apex session', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'apexretail',
        response: 'High confidence — you\'re Meridian Health System, a not-for-profit IDN.',
      });
      expect(result.leaked).toBe(true);
      if (result.leaked) {
        expect(['Meridian Health System', 'Meridian', 'Meridian Health']).toContain(result.assertedTenant);
      }
    });
  });

  describe('false-positive resistance', () => {
    it('does NOT flag casual cross-industry comparisons', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: 'For your situation, contrast this with how retailers like Apex Retail handle multi-banner promo orchestration — the failure modes are similar.',
      });
      expect(result.leaked).toBe(false);
    });

    it('does NOT flag the agent\'s own honest admission of session bleed', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: 'The session memory has Apex Retail loaded as the active tenant, but the sources just surfaced are for Meridian Health — a different organization entirely. I want to be transparent about that.',
      });
      expect(result.leaked).toBe(false);
    });

    it('does NOT flag the correct tenant being named', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: 'For Meridian Health System, the highest-leverage bet is ambient documentation rollout phased across cardiology first.',
      });
      expect(result.leaked).toBe(false);
    });

    it('returns false when clientKey is null', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: null,
        response: 'You\'re Apex Retail.',
      });
      expect(result.leaked).toBe(false);
    });

    it('returns false on empty response', () => {
      const result = detectCrossTenantIdentityLeak({
        clientKey: 'meridian',
        response: '',
      });
      expect(result.leaked).toBe(false);
    });
  });
});
