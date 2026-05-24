import { extractProjectedValueFromLegacyBaseline, parseUsdRangeFromText } from '@/lib/programs/value-utils';

describe('value-utils', () => {
  it('parses USD ranges from narrative text', () => {
    expect(parseUsdRangeFromText('Value at stake is $8M-$12M over 18 months')).toEqual({
      low: 8_000_000,
      high: 12_000_000,
    });
  });

  it('applies a shared suffix to compact narrative ranges', () => {
    expect(parseUsdRangeFromText('Unvalidated planning range: $2–4.8M if the hub ambiguity is removed')).toEqual({
      low: 2_000_000,
      high: 4_800_000,
    });
  });

  it('parses single USD numbers as low/high equal', () => {
    expect(parseUsdRangeFromText('Target value $24M')).toEqual({
      low: 24_000_000,
      high: 24_000_000,
    });
  });

  it('extracts value from legacy baseline metrics payloads', () => {
    expect(
      extractProjectedValueFromLegacyBaseline({
        items: [{ baseline_value: '$11M' }],
      }),
    ).toEqual({
      low: 11_000_000,
      high: 11_000_000,
    });
  });
});
