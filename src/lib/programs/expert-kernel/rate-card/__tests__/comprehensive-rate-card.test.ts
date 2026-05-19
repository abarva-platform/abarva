// Comprehensive rate-card fabric tests.
//
// These assert the commercial-governance behavior the Moves business case now
// needs: client/vendor/internal rows override the benchmark cleanly, committed
// budget is carried as an envelope (not a fake rate), and missing lanes fall
// back honestly with warnings unless strict mode is requested.

import {
  assessBudgetFit,
  buildComprehensiveRateCard,
  validateRateCardRows,
  type RateCardTemplateRow,
} from '../comprehensive-rate-card';
import { RESEARCHED_PLANNING_RATES } from '../derived-planning-rate-card';

const BASE_ROWS: RateCardTemplateRow[] = [
  {
    sourceKind: 'client_rate_card',
    sourceName: 'First Capital FY26 delivery rate card',
    role: 'senior_engineer',
    specialization: 'ai_ml_engineering',
    deliveryLocation: 'onshore',
    seniority: 'senior',
    annualRateUsd: 265_000,
    currency: 'USD',
    asOf: '2026-05-19',
    owner: 'Procurement Ops',
    confidence: 'high',
    note: 'Approved internal blended onshore rate.',
  },
  {
    sourceKind: 'vendor_quote',
    sourceName: 'Fraud platform integrator BAFO',
    role: 'senior_engineer',
    specialization: 'ai_ml_engineering',
    deliveryLocation: 'offshore',
    seniority: 'senior',
    rateUsdPerHour: 82,
    currency: 'USD',
    asOf: '2026-05-18',
    owner: 'Sourcing VP',
    confidence: 'medium',
    note: 'Quoted offshore AI engineering rate.',
  },
  {
    sourceKind: 'committed_budget',
    sourceName: 'First Capital committed FC-FRAUD-2026 budget',
    committedBudgetUsd: 1_800_000,
    currency: 'USD',
    asOf: '2026-05-19',
    owner: 'Transformation Finance',
    confidence: 'high',
    note: 'Approved phase-1 envelope.',
  },
];

describe('comprehensive rate card — validation', () => {
  it('accepts sourced client/vendor/budget rows', () => {
    const validation = validateRateCardRows(BASE_ROWS);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('rejects unsourced or non-positive rows', () => {
    const validation = validateRateCardRows([
      {
        sourceKind: 'client_rate_card',
        sourceName: '',
        role: 'engineer',
        deliveryLocation: 'onshore',
        annualRateUsd: -1,
        asOf: 'not-a-date',
        owner: '',
        confidence: 'high',
      },
    ]);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(' ')).toContain('sourceName');
    expect(validation.errors.join(' ')).toContain('asOf');
    expect(validation.errors.join(' ')).toContain('owner');
    expect(validation.errors.join(' ')).toContain('annualRateUsd');
  });

  it('warns that nearshore rows are loaded but not costed by the current estimator', () => {
    const validation = validateRateCardRows([
      {
        sourceKind: 'client_rate_card',
        sourceName: 'Apex nearshore pilot card',
        role: 'engineer',
        deliveryLocation: 'nearshore',
        rateUsdPerHour: 95,
        currency: 'USD',
        asOf: '2026-05-19',
        owner: 'Procurement',
        confidence: 'medium',
      },
    ]);
    expect(validation.valid).toBe(true);
    expect(validation.warnings.join(' ')).toContain('nearshore');
  });
});

describe('comprehensive rate card — build', () => {
  it('turns loaded rows into a KernelRateCard with provenance preserved', () => {
    const result = buildComprehensiveRateCard({
      label: 'First Capital fraud detection case',
      rows: BASE_ROWS,
    });
    const seniorEngineer = result.kernelRateCard.rates.find(
      (rate) => rate.role === 'senior_engineer',
    );
    expect(result.kernelRateCard.provenance).toBe('comprehensive');
    expect(result.kernelRateCard.label).toContain('client rate card');
    expect(seniorEngineer?.onshoreAnnualRate).toBe(265_000);
    expect(seniorEngineer?.offshoreAnnualRate).toBe(82 * 2080);
    expect(result.appliedRates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'senior_engineer',
          lane: 'onshore',
          sourceKind: 'client_rate_card',
          sourceName: 'First Capital FY26 delivery rate card',
        }),
        expect.objectContaining({
          role: 'senior_engineer',
          lane: 'offshore',
          sourceKind: 'vendor_quote',
          sourceName: 'Fraud platform integrator BAFO',
        }),
      ]),
    );
  });

  it('keeps committed budget as an envelope, not a fake role rate', () => {
    const result = buildComprehensiveRateCard({
      label: 'First Capital fraud detection case',
      rows: BASE_ROWS,
    });
    expect(result.committedBudget?.amountUsd).toBe(1_800_000);
    expect(result.kernelRateCard.rates).toHaveLength(
      RESEARCHED_PLANNING_RATES.length,
    );
    expect(
      result.appliedRates.some((rate) => rate.sourceKind === 'committed_budget'),
    ).toBe(false);
  });

  it('falls back to the researched benchmark with explicit warnings', () => {
    const result = buildComprehensiveRateCard({
      label: 'Sparse client card',
      rows: BASE_ROWS,
    });
    const architect = result.appliedRates.find(
      (rate) =>
        rate.role === 'solution_architect' && rate.lane === 'onshore',
    );
    expect(architect?.sourceKind).toBe('fallback_benchmark');
    expect(result.validation.warnings.join(' ')).toContain(
      'using researched benchmark fallback',
    );
  });

  it('can require a complete client card in strict mode', () => {
    const result = buildComprehensiveRateCard({
      label: 'Strict sparse card',
      rows: BASE_ROWS,
      strict: true,
    });
    expect(result.validation.valid).toBe(false);
    expect(result.validation.errors.join(' ')).toContain('strict mode');
  });
});

describe('comprehensive rate card — budget fit', () => {
  it('flags a material over-budget case without pretending benchmark economics are the final answer', () => {
    const result = buildComprehensiveRateCard({
      label: 'First Capital fraud detection case',
      rows: BASE_ROWS,
    });
    const fit = assessBudgetFit(4_820_000, result.committedBudget);
    expect(fit.status).toBe('over_budget');
    expect(fit.varianceUsd).toBe(-3_020_000);
    expect(fit.note).toContain('do not use benchmark economics alone');
  });

  it('reports no-budget when no committed envelope was loaded', () => {
    const fit = assessBudgetFit(500_000);
    expect(fit.status).toBe('no_budget');
    expect(fit.note).toContain('No committed budget');
  });
});
