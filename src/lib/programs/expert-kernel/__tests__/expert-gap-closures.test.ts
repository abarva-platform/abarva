import { buildApexContactCenterCase } from '../apex-contact-center-case';
import {
  buildNextBestAdvisoryTurn,
} from '../advisory-session';
import {
  calibrateBusinessCaseWithExpertReviews,
} from '../expert-review-calibration';
import {
  calibrateOutcomeAgainstForecast,
} from '../outcome-calibration';
import {
  getMovesArchetypePlaybook,
  MOVES_ARCHETYPE_PLAYBOOKS,
} from '../use-case-archetype-playbooks';

describe('Moves Expert Kernel gap closures', () => {
  const { skeleton } = buildApexContactCenterCase();

  it('adds a practitioner calibration gate requiring finance and delivery lenses', () => {
    const notReady = calibrateBusinessCaseWithExpertReviews(skeleton, [
      {
        reviewerId: 'vp-source',
        role: 'sourcing_vp',
        verdict: 'credible',
        note: 'Commercial logic is readable.',
      },
    ]);
    expect(notReady.accepted).toBe(false);
    expect(notReady.findings.map((finding) => finding.code)).toContain('review_minimum_not_met');
    expect(notReady.findings.some((finding) => finding.code.includes('missing_cfo'))).toBe(true);

    const conditional = calibrateBusinessCaseWithExpertReviews(skeleton, [
      {
        reviewerId: 'cfo-1',
        role: 'cfo',
        verdict: 'credible_with_conditions',
        note: 'Trustworthy as a shape recommendation, not a fund decision.',
        requiredActions: ['Close cost-per-contact baseline before gate.'],
      },
      {
        reviewerId: 'delivery-1',
        role: 'delivery_lead',
        verdict: 'credible',
        note: 'Workstream effort split is plausible for planning.',
      },
    ]);

    expect(conditional.accepted).toBe(true);
    expect(conditional.verdict).toBe('conditional');
    expect(conditional.requiredActions).toEqual(['Close cost-per-contact baseline before gate.']);
  });

  it('covers the major AI-bet archetypes with diagnostics, baselines, kills, and Tower metrics', () => {
    expect(Object.keys(MOVES_ARCHETYPE_PLAYBOOKS)).toHaveLength(8);
    for (const playbook of Object.values(MOVES_ARCHETYPE_PLAYBOOKS)) {
      expect(playbook.diagnosticQuestions.length).toBeGreaterThanOrEqual(3);
      expect(playbook.requiredBaselineMetrics.length).toBeGreaterThanOrEqual(3);
      expect(playbook.killConditions.length).toBeGreaterThanOrEqual(2);
      expect(playbook.towerMeasurements.length).toBeGreaterThanOrEqual(3);
    }

    const contactCenter = getMovesArchetypePlaybook('contact_center_ai');
    expect(contactCenter.requiredBaselineMetrics).toContain('cost_per_contact_usd');
    expect(contactCenter.killConditions.join(' ')).toMatch(/cost-per-contact/);
  });

  it('turns a non-fundable skeleton into a next-best advisory question, not a static report', () => {
    const turn = buildNextBestAdvisoryTurn(skeleton);
    expect(turn.headline).toMatch(/not yet fundable/);
    expect(turn.recommendedAction.kind).toBe('ask_for_data');
    expect(turn.recommendedAction.relatedKeys).toContain('cost_per_contact_usd');
    expect(turn.actions.some((action) => action.kind === 'prepare_tower_measurement')).toBe(true);
  });

  it('calibrates future priors from Tower actuals with anonymized outcome bands', () => {
    const noActuals = calibrateOutcomeAgainstForecast({
      tenantKey: 'apex-retail',
      moveId: 'contact-center-ai-routing',
      archetype: 'contact_center_ai',
      forecastNetValue: { low: 4_000_000, point: 10_000_000, high: 16_000_000 },
      realizedNetValue: null,
      realizedAt: null,
      evidenceConfidence: 'missing',
    });
    expect(noActuals.adjustment).toBe('no_actuals');
    expect(noActuals.anonymized.realizationRatioBand).toBe('not_measured');

    const underRun = calibrateOutcomeAgainstForecast({
      tenantKey: 'apex-retail',
      moveId: 'contact-center-ai-routing',
      archetype: 'contact_center_ai',
      forecastNetValue: { low: 4_000_000, point: 10_000_000, high: 16_000_000 },
      realizedNetValue: 6_000_000,
      realizedAt: '2027-06-30',
      evidenceConfidence: 'verified',
    });
    expect(underRun.realizationRatio).toBe(0.6);
    expect(underRun.adjustment).toBe('discount_future_priors');
    expect(underRun.anonymized).toEqual({
      archetype: 'contact_center_ai',
      forecastBand: '5m_to_20m',
      realizationRatioBand: '50_to_80pct',
      evidenceConfidence: 'verified',
    });
  });
});
