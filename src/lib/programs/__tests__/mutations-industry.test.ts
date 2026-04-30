import { resolveProgramIndustryCode } from '../mutations';

describe('resolveProgramIndustryCode', () => {
  it('uses the explicit client industry code when present', () => {
    expect(
      resolveProgramIndustryCode({
        name: 'Apex Retail',
        industry_code: 'retail',
      }),
    ).toBe('RETAIL');
  });

  it('falls back from a blank Apex client row to the canonical retail code', () => {
    expect(
      resolveProgramIndustryCode({
        name: 'Apex Retail',
        industry_code: null,
      }),
    ).toBe('RETAIL');
  });

  it('falls back from a blank Meridian client row to the canonical healthcare code', () => {
    expect(
      resolveProgramIndustryCode({
        name: 'Meridian Health System',
        industry_code: '',
      }),
    ).toBe('HEALTHCARE_IDN');
  });

  it('uses the request hint before UNKNOWN for non-demo clients', () => {
    expect(
      resolveProgramIndustryCode(
        {
          name: 'Unmapped Client',
          industry_code: null,
        },
        'industrial',
      ),
    ).toBe('INDUSTRIAL');
  });
});
