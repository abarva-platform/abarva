import {
  sanitizeRestrictedFinancialText,
  summarizeFinancialValueForPrompt,
} from '../restricted-output-policy';

const restrictedPolicy = {
  outputPolicy: {
    exactFinancialValues: false,
  },
};

const financeAllowedPolicy = {
  outputPolicy: {
    exactFinancialValues: true,
  },
};

describe('restricted output policy', () => {
  it('redacts dollar values and financial metrics when exact financial visibility is denied', () => {
    const text = 'The budget is $22M and the 18% margin target creates a high-exposure business case.';

    expect(sanitizeRestrictedFinancialText(text, restrictedPolicy)).toBe(
      'The budget is [restricted financial value] and the [restricted financial metric] margin target creates a high-exposure business case.',
    );
  });

  it('preserves exact financial values when finance visibility is allowed', () => {
    const text = 'The budget is $22M and ROI is 3.2x.';

    expect(sanitizeRestrictedFinancialText(text, financeAllowedPolicy)).toBe(text);
  });

  it('summarizes prompt-only financial values for restricted users', () => {
    expect(summarizeFinancialValueForPrompt('Contract value at stake', '$48M', restrictedPolicy)).toBe(
      'Contract value at stake: restricted financial value available for risk/readiness reasoning only',
    );
  });
});
