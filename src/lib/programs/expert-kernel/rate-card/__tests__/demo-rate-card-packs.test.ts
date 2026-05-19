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
  buildTieredDemoRateCatalog,
  coveredEnterpriseDomains,
  DEMO_RATE_CARD_PACKS,
  industryProfileForPack,
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

  it('contains enterprise application, ERP, Epic, and legacy disciplines', () => {
    const apex = DEMO_RATE_CARD_PACKS['apex-contact-center'];
    for (const role of [
      'frontend_engineer',
      'backend_engineer',
      'full_stack_engineer',
      'mobile_engineer',
      'erp_functional_consultant',
      'erp_technical_consultant',
      'sap_abap_developer',
      'oracle_erp_consultant',
      'epic_clarity_analyst',
      'epic_integration_engineer',
      'legacy_mainframe_engineer',
    ]) {
      expect(apex.rows.some((row) => row.role === role)).toBe(true);
    }
  });

  it('has tiered rates, so data engineering is not one flat rate', () => {
    const catalog = buildTieredDemoRateCatalog('apex-contact-center');
    const dataEngineerTiers = catalog
      .filter((row) => row.role === 'data_engineer' && row.deliveryLocation === 'onshore')
      .map((row) => row.seniority)
      .sort();
    expect(dataEngineerTiers).toEqual(['junior', 'lead', 'mid', 'senior']);

    const fullStackRows = catalog.filter(
      (row) => row.role === 'full_stack_engineer',
    );
    expect(fullStackRows.length).toBeGreaterThanOrEqual(8); // 4 tiers x 2 lanes
    expect(catalog.length).toBeGreaterThan(250);
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

  it('selects the right must-price categories for each tenant industry and stack', () => {
    const apex = industryProfileForPack('apex-contact-center');
    expect(apex.industry).toContain('Retail');
    expect(apex.techStackSignals).toEqual(
      expect.arrayContaining([
        'CRM / customer profile',
        'E-commerce and order management',
        'Warehouse and fulfillment integration',
      ]),
    );
    expect(apex.mustPriceRoles).toEqual(
      expect.arrayContaining([
        'frontend_engineer',
        'backend_engineer',
        'full_stack_engineer',
        'integration_engineer',
      ]),
    );

    const meridian = industryProfileForPack('meridian-ambient-clinical');
    expect(meridian.techStackSignals).toEqual(
      expect.arrayContaining([
        'Epic EHR',
        'Epic Clarity / Caboodle analytics',
        'HL7 / FHIR integration',
      ]),
    );
    expect(meridian.mustPriceRoles).toEqual(
      expect.arrayContaining([
        'epic_clarity_analyst',
        'epic_integration_engineer',
        'security_architect',
        'training_lead',
      ]),
    );

    const firstCapital = industryProfileForPack('firstcapital-fraud-detection');
    expect(firstCapital.techStackSignals).toEqual(
      expect.arrayContaining([
        'Core banking',
        'AML case management',
        'Mainframe / legacy integration',
        'Model risk management',
      ]),
    );
    expect(firstCapital.mustPriceRoles).toEqual(
      expect.arrayContaining([
        'legacy_mainframe_engineer',
        'middleware_engineer',
        'governance_risk_lead',
        'security_architect',
      ]),
    );
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
