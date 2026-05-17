// Source · MRM-readiness vendor screen · Wave C1 · tests.
//
// Exercises the encoded SR 11-7 criteria and the pass/fail gating
// behaviour: critical criteria must be fully met, failures are removed
// from TCO eligibility, conditional vendors proceed with conditions.

import {
  MRM_CRITERIA,
  MRM_CRITICAL_CRITERION_IDS,
  MRM_CRITERION_IDS,
  buildMrmScreenView,
  getMrmCriterion,
  screenVendorForMrmReadiness,
  summarizeMrmScreen,
  vendorsEligibleForTco,
  type MrmCriterionAssessment,
  type MrmCriterionId,
  type MrmVendorScreenInput,
} from '../index';

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Grade every criterion `met` unless overridden. */
function assessments(
  overrides: Partial<Record<MrmCriterionId, MrmCriterionAssessment['grade']>> = {},
): MrmCriterionAssessment[] {
  return MRM_CRITERION_IDS.map((id) => ({
    criterionId: id,
    grade: overrides[id] ?? 'met',
    evidenceNote: overrides[id] && overrides[id] !== 'met' ? '' : `Evidence for ${id}`,
  }));
}

function vendor(
  overrides: Partial<MrmVendorScreenInput> = {},
): MrmVendorScreenInput {
  return {
    vendorId: 'V-1',
    vendorName: 'Acme MRM Co',
    assessments: assessments(),
    ...overrides,
  };
}

// ── Encoded criteria ─────────────────────────────────────────────────────────

describe('encoded SR 11-7 criteria', () => {
  it('encodes eight criteria, each with an SR 11-7 reference', () => {
    expect(MRM_CRITERIA).toHaveLength(8);
    expect(MRM_CRITERION_IDS).toHaveLength(8);
    for (const c of MRM_CRITERIA) {
      expect(c.sr117Reference).toMatch(/SR 11-7/);
      expect(c.question.length).toBeGreaterThan(20);
      expect(c.whyGating.length).toBeGreaterThan(20);
    }
  });

  it('marks the four validation-pillar criteria as critical', () => {
    expect([...MRM_CRITICAL_CRITERION_IDS].sort()).toEqual(
      [
        'conceptual_soundness_evidence',
        'independent_validation_support',
        'ongoing_monitoring_drift',
        'outcomes_analysis_backtesting',
      ].sort(),
    );
  });

  it('resolves a criterion definition by id', () => {
    expect(getMrmCriterion('ongoing_monitoring_drift')?.critical).toBe(true);
    expect(getMrmCriterion('explainability_documentation')?.critical).toBe(false);
  });
});

// ── Per-vendor screen ────────────────────────────────────────────────────────

describe('screenVendorForMrmReadiness', () => {
  it('passes a vendor that meets every criterion', () => {
    const result = screenVendorForMrmReadiness(vendor());
    expect(result.verdict).toBe('pass');
    expect(result.eligibleForTco).toBe(true);
    expect(result.blockingCriterionIds).toEqual([]);
    expect(result.conditionCriterionIds).toEqual([]);
    expect(result.readout).toMatch(/clears the SR 11-7/);
  });

  it('fails — and removes from TCO — when a critical criterion is partial', () => {
    const result = screenVendorForMrmReadiness(
      vendor({ assessments: assessments({ independent_validation_support: 'partial' }) }),
    );
    expect(result.verdict).toBe('fail');
    expect(result.eligibleForTco).toBe(false);
    expect(result.blockingCriterionIds).toContain('independent_validation_support');
    expect(result.readout).toMatch(/pricing cannot buy this back/);
  });

  it('treats a missing critical assessment as not_assessed and fails', () => {
    const partial = MRM_CRITERION_IDS.filter(
      (id) => id !== 'outcomes_analysis_backtesting',
    ).map((id) => ({ criterionId: id, grade: 'met' as const, evidenceNote: 'x' }));
    const result = screenVendorForMrmReadiness(
      vendor({ assessments: partial }),
    );
    expect(result.verdict).toBe('fail');
    const blocked = result.criteria.find(
      (c) => c.criterionId === 'outcomes_analysis_backtesting',
    );
    expect(blocked?.grade).toBe('not_assessed');
    expect(blocked?.isBlocker).toBe(true);
  });

  it('is conditional — and TCO-eligible — when only non-critical gaps exist', () => {
    const result = screenVendorForMrmReadiness(
      vendor({ assessments: assessments({ explainability_documentation: 'partial' }) }),
    );
    expect(result.verdict).toBe('conditional');
    expect(result.eligibleForTco).toBe(true);
    expect(result.conditionCriterionIds).toEqual(['explainability_documentation']);
    expect(result.readout).toMatch(/recorded condition/);
  });

  it('sorts criticals first', () => {
    const result = screenVendorForMrmReadiness(vendor());
    const firstNonCritical = result.criteria.findIndex((c) => !c.critical);
    const lastCritical = result.criteria.map((c) => c.critical).lastIndexOf(true);
    expect(lastCritical).toBeLessThan(firstNonCritical);
  });
});

// ── Screen view + summary ────────────────────────────────────────────────────

describe('buildMrmScreenView', () => {
  it('reconciles the summary and gates TCO eligibility', () => {
    const view = buildMrmScreenView({
      sourceEventId: 'EVT-9',
      vendors: [
        vendor({ vendorId: 'V-pass', vendorName: 'Pass Co' }),
        vendor({
          vendorId: 'V-fail',
          vendorName: 'Fail Co',
          assessments: assessments({ ongoing_monitoring_drift: 'not_met' }),
        }),
        vendor({
          vendorId: 'V-cond',
          vendorName: 'Cond Co',
          assessments: assessments({ data_lineage_quality: 'not_met' }),
        }),
      ],
    });

    expect(view.summary.vendorsScreened).toBe(3);
    expect(view.summary.passCount).toBe(1);
    expect(view.summary.conditionalCount).toBe(1);
    expect(view.summary.failCount).toBe(1);
    expect(view.summary.eligibleForTcoCount).toBe(2);

    // Reconciliation invariants.
    expect(
      view.summary.passCount +
        view.summary.conditionalCount +
        view.summary.failCount,
    ).toBe(view.summary.vendorsScreened);

    // Failed vendors sort last.
    expect(view.vendors[view.vendors.length - 1].verdict).toBe('fail');

    // The TCO-eligible set excludes the failure.
    const eligible = vendorsEligibleForTco(view);
    expect(eligible.map((v) => v.vendorId).sort()).toEqual(['V-cond', 'V-pass']);
  });

  it('summarizeMrmScreen over an empty set is all-zero', () => {
    const summary = summarizeMrmScreen([]);
    expect(summary).toEqual({
      vendorsScreened: 0,
      passCount: 0,
      conditionalCount: 0,
      failCount: 0,
      eligibleForTcoCount: 0,
    });
  });
});
