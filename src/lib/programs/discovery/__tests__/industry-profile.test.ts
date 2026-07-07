import {
  industryProfileFor,
  GENERIC_INDUSTRY_PROFILE,
  profiledIndustryCodes,
} from '../industry-profile';
import { CLIENT_KEY_TO_INDUSTRY_CODE } from '@/lib/client-config';

describe('industryProfileFor — industry-adaptive, industry-agnostic fallback', () => {
  it('returns industry-relevant domains per industry', () => {
    expect(industryProfileFor('HEALTHCARE_IDN').suggestedDomains).toContain('EHR / Clinical');
    expect(industryProfileFor('RETAIL').suggestedDomains).toContain('POS / Transactions');
    expect(industryProfileFor('FINSERV').suggestedDomains).toContain('Core Banking');
    expect(industryProfileFor('AIRLINE').suggestedDomains).toContain('Reservations / PSS');
    expect(industryProfileFor('MEDTECH').suggestedDomains).toContain('Device Telemetry');
  });

  it('falls back to the generic cross-industry profile for unknown / missing codes', () => {
    expect(industryProfileFor('SOMETHING_NEW')).toBe(GENERIC_INDUSTRY_PROFILE);
    expect(industryProfileFor(null)).toBe(GENERIC_INDUSTRY_PROFILE);
    expect(industryProfileFor(undefined)).toBe(GENERIC_INDUSTRY_PROFILE);
    expect(industryProfileFor('')).toBe(GENERIC_INDUSTRY_PROFILE);
  });

  it('is case-insensitive on the industry code', () => {
    expect(industryProfileFor('retail').industryCode).toBe('RETAIL');
    expect(industryProfileFor(' Finserv ').industryCode).toBe('FINSERV');
  });

  it('covers EVERY real tenant industry (replicates across all clients)', () => {
    const realCodes = new Set(Object.values(CLIENT_KEY_TO_INDUSTRY_CODE));
    const profiled = new Set(profiledIndustryCodes());
    for (const code of realCodes) {
      expect(profiled.has(code)).toBe(true);
    }
  });

  it('every profile has at least 4 suggested domains', () => {
    for (const code of profiledIndustryCodes()) {
      expect(industryProfileFor(code).suggestedDomains.length).toBeGreaterThanOrEqual(4);
    }
  });
});
