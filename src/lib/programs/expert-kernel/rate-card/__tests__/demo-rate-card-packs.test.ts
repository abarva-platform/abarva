// Demo comprehensive rate-card pack tests.
//
// Guardrail for the founder callout: a four-row template is not a
// comprehensive rate card. The actual demo packs must cover every role and
// both estimator lanes, carry a committed budget, and build in strict mode
// without benchmark fallback.

import {
  ENTERPRISE_RATE_CARD_DOMAINS,
  SHOULD_COST_ROLES,
} from '@/lib/source/should-cost/should-cost-model';
import {
  buildDemoRateCardPack,
  coveredEnterpriseDomains,
  DEMO_RATE_CARD_PACKS,
  REQUIRED_ENTERPRISE_RATE_CARD_DOMAINS,
  type DemoRateCardPackId,
} from '../demo-rate-card-packs';
import { buildApexContactCenterCase } from '../../apex-contact-center-case';
import { buildMeridianAmbientClinicalCase } from '../../meridian-ambient-clinical-case';
import { buildFirstCapitalFraudDetectionCase } from '../../firstcapital-fraud-detection-case';

const PACK_IDS: DemoRateCardPackId[] = [
  'apex-contact-center',
  'meridian-ambient-clinical',
  'firstcapital-fraud-detection',
];

describe('demo comprehensive rate-card packs', () => {
  it('are full packs, not the tiny load template', () => {
    for (const id of PACK_IDS) {
      const pack = DEMO_RATE_CARD_PACKS[id];
      expect(pack.rows).toHaveLength(SHOULD_COST_ROLES.length * 2 + 1);
      expect(
        pack.rows.filter((row) => row.sourceKind === 'committed_budget'),
      ).toHaveLength(1);
      for (const role of SHOULD_COST_ROLES) {
        expect(
          pack.rows.some(
            (row) => row.role === role && row.deliveryLocation === 'onshore',
          ),
        ).toBe(true);
        expect(
          pack.rows.some(
            (row) => row.role === role && row.deliveryLocation === 'offshore',
          ),
        ).toBe(true);
      }
    }
  });

  it('covers the enterprise domains, not only a delivery squad', () => {
    expect(REQUIRED_ENTERPRISE_RATE_CARD_DOMAINS).toEqual(
      ENTERPRISE_RATE_CARD_DOMAINS,
    );
    for (const id of PACK_IDS) {
      expect(coveredEnterpriseDomains(DEMO_RATE_CARD_PACKS[id])).toEqual(
        [...ENTERPRISE_RATE_CARD_DOMAINS].sort(),
      );
    }
  });

  it('build in strict mode without benchmark fallback', () => {
    for (const id of PACK_IDS) {
      const built = buildDemoRateCardPack(id);
      expect(built.validation.valid).toBe(true);
      expect(built.validation.errors).toEqual([]);
      expect(built.validation.warnings).toEqual([]);
      expect(built.kernelRateCard.provenance).toBe('comprehensive');
      expect(built.appliedRates).toHaveLength(SHOULD_COST_ROLES.length * 2);
      expect(
        built.appliedRates.every(
          (rate) => rate.sourceKind !== 'fallback_benchmark',
        ),
      ).toBe(true);
      expect(built.committedBudget?.amountUsd).toBeGreaterThan(0);
    }
  });

  it('First Capital pack captures the committed budget envelope explicitly', () => {
    const built = buildDemoRateCardPack('firstcapital-fraud-detection');
    expect(built.committedBudget?.amountUsd).toBe(1_800_000);
    expect(
      built.appliedRates.some((rate) => rate.sourceKind === 'internal_team_cost'),
    ).toBe(true);
    expect(
      built.appliedRates.some((rate) => rate.sourceKind === 'vendor_quote'),
    ).toBe(true);
  });

  it('tenant case anchors now use comprehensive packs instead of only benchmark default', () => {
    for (const build of [
      buildApexContactCenterCase,
      buildMeridianAmbientClinicalCase,
      buildFirstCapitalFraudDetectionCase,
    ]) {
      const { skeleton } = build();
      expect(skeleton.effort.rateCard.provenance).toBe('comprehensive');
      expect(skeleton.effort.rateCard.label.toLowerCase()).toContain(
        'comprehensive',
      );
    }
  });
});
