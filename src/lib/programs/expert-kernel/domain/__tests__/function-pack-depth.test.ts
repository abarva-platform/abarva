// function-pack depth-bar tests.
//
// Asserts every reference pack — the twelve healthcare packs and the two
// retail packs that open the retail vertical — meets the §6 depth bar: the
// minimum layer counts, the four required deliverable outlines, and the
// structural hard fails (no metric without a definition+benchmark, no
// archetype without a value mechanism, no deliverable outline that is a label
// list rather than a real TOC). The floors come from
// FUNCTION_PACK_DEPTH_MINIMUMS so the bar lives in exactly one place.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
  type FunctionPack,
} from '../function-pack-types';
import { checkFunctionPackDepth } from '../function-pack-registry';
import { careDeliveryCareManagementPack } from '../healthcare/care-delivery-care-management';
import { clinicalOperationsDocumentationPack } from '../healthcare/clinical-operations-documentation';
import { patientAccessEngagementExperiencePack } from '../healthcare/patient-access-engagement-experience';
import { populationHealthValueBasedCarePack } from '../healthcare/population-health-value-based-care';
import { qualitySafetyRegulatoryPack } from '../healthcare/quality-safety-regulatory';
import { healthInformationInteroperabilityPack } from '../healthcare/health-information-interoperability';
import { researchClinicalTrialsPack } from '../healthcare/research-clinical-trials';
import { revenueCyclePack } from '../healthcare/revenue-cycle';
import { clinicalSupplyChainPack } from '../healthcare/clinical-supply-chain';
import { clinicalWorkforceStaffingPack } from '../healthcare/clinical-workforce-staffing';
import { payerClaimsOperationsPack } from '../healthcare/payer-claims-operations';
import { pharmacyPack } from '../healthcare/pharmacy';
import { merchandisingAssortmentPack } from '../retail/merchandising-assortment';
import { pricingPromotionsPack } from '../retail/pricing-promotions';
import { demandInventoryPlanningPack } from '../retail/demand-inventory-planning';
import { supplyChainFulfillmentPack } from '../retail/supply-chain-fulfillment';
import { digitalCommercePack } from '../retail/digital-commerce';
import { marketingRetailMediaPack } from '../retail/marketing-retail-media';
import { storeOperationsPack } from '../retail/store-operations';
import { customerLoyaltyPersonalizationPack } from '../retail/customer-loyalty-personalization';
import { customerCarePack } from '../retail/customer-care';
import { workforceLaborPack } from '../retail/workforce-labor';
import { returnsReverseLogisticsPack } from '../retail/returns-reverse-logistics';
import { lossPreventionPack } from '../retail/loss-prevention';
import { customerServicingContactCenterPack } from '../financial-services/customer-servicing-contact-center';
import { collectionsRecoveryPack } from '../financial-services/collections-recovery';
import { riskManagementPack } from '../financial-services/risk-management';
import { fraudFinancialCrimePack } from '../financial-services/fraud-financial-crime';
import { regulatoryCompliancePack } from '../financial-services/regulatory-compliance';
import { financeTreasuryAlmPack } from '../financial-services/finance-treasury-alm';
import { costOptimizationVendorManagementPack } from '../financial-services/cost-optimization-vendor-management';
import { retailBankingDepositsPack } from '../financial-services/retail-banking-deposits';
import { lendingCreditUnderwritingPack } from '../financial-services/lending-credit-underwriting';
import { capitalMarketsTradingPack } from '../financial-services/capital-markets-trading';
import { commercialCorporateBankingPack } from '../financial-services/commercial-corporate-banking';
import { paymentsMoneyMovementPack } from '../financial-services/payments-money-movement';
import { wealthAssetManagementPack } from '../financial-services/wealth-asset-management';

const PACKS: ReadonlyArray<readonly [string, FunctionPack]> = [
  ['care_delivery_care_management', careDeliveryCareManagementPack],
  ['population_health_value_based_care', populationHealthValueBasedCarePack],
  ['clinical_operations_documentation', clinicalOperationsDocumentationPack],
  [
    'patient_access_engagement_experience',
    patientAccessEngagementExperiencePack,
  ],
  ['quality_safety_regulatory', qualitySafetyRegulatoryPack],
  [
    'health_information_interoperability',
    healthInformationInteroperabilityPack,
  ],
  ['research_clinical_trials', researchClinicalTrialsPack],
  ['revenue_cycle', revenueCyclePack],
  ['clinical_supply_chain', clinicalSupplyChainPack],
  ['clinical_workforce_staffing', clinicalWorkforceStaffingPack],
  ['payer_claims_operations', payerClaimsOperationsPack],
  ['pharmacy', pharmacyPack],
  ['merchandising_assortment', merchandisingAssortmentPack],
  ['pricing_promotions', pricingPromotionsPack],
  ['demand_inventory_planning', demandInventoryPlanningPack],
  ['supply_chain_fulfillment', supplyChainFulfillmentPack],
  ['digital_commerce', digitalCommercePack],
  ['marketing_retail_media', marketingRetailMediaPack],
  ['store_operations', storeOperationsPack],
  ['customer_loyalty_personalization', customerLoyaltyPersonalizationPack],
  ['customer_care', customerCarePack],
  ['workforce_labor', workforceLaborPack],
  ['returns_reverse_logistics', returnsReverseLogisticsPack],
  ['loss_prevention', lossPreventionPack],
  [
    'customer_servicing_contact_center',
    customerServicingContactCenterPack,
  ],
  ['collections_recovery', collectionsRecoveryPack],
  ['risk_management', riskManagementPack],
  ['fraud_financial_crime', fraudFinancialCrimePack],
  ['regulatory_compliance', regulatoryCompliancePack],
  ['finance_treasury_alm', financeTreasuryAlmPack],
  [
    'cost_optimization_vendor_management',
    costOptimizationVendorManagementPack,
  ],
  ['retail_banking_deposits', retailBankingDepositsPack],
  ['lending_credit_underwriting', lendingCreditUnderwritingPack],
  ['capital_markets_trading', capitalMarketsTradingPack],
  ['commercial_corporate_banking', commercialCorporateBankingPack],
  ['payments_money_movement', paymentsMoneyMovementPack],
  ['wealth_asset_management', wealthAssetManagementPack],
];

describe.each(PACKS)('Function Pack §6 depth bar — %s', (_key, pack) => {
  it('passes the machine-checkable depth bar with no shortfalls', () => {
    const result = checkFunctionPackDepth(pack);
    expect(result.shortfalls).toEqual([]);
    expect(result.passes).toBe(true);
  });

  it(`carries >= ${FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics} operating metrics`, () => {
    expect(pack.operatingMetrics.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics,
    );
  });

  it(`carries >= ${FUNCTION_PACK_DEPTH_MINIMUMS.painThemes} pain themes`, () => {
    expect(pack.painThemes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.painThemes,
    );
  });

  it(`carries >= ${FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes} AI use-case archetypes`, () => {
    expect(pack.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes,
    );
  });

  it(`carries >= ${FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns} reference solution patterns`, () => {
    expect(pack.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns,
    );
  });

  it(`carries >= ${FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors} evidence anchors`, () => {
    expect(pack.evidenceAnchors.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors,
    );
  });

  it('every operating metric has a definition, unit, benchmark range and data source', () => {
    for (const metric of pack.operatingMetrics) {
      expect(metric.definition.trim().length).toBeGreaterThan(0);
      expect(metric.unit.trim().length).toBeGreaterThan(0);
      expect(metric.dataSource.trim().length).toBeGreaterThan(0);
      expect(Number.isFinite(metric.benchmarkRange.low)).toBe(true);
      expect(Number.isFinite(metric.benchmarkRange.high)).toBe(true);
      expect(metric.benchmarkRange.high).toBeGreaterThanOrEqual(
        metric.benchmarkRange.low,
      );
      // §6 hard fail: every benchmark is a labelled planning range, never a
      // figure asserted as fact.
      expect(metric.benchmarkRange.label).toBe('planning-range');
      expect(metric.benchmarkRange.basis.trim().length).toBeGreaterThan(0);
    }
  });

  it('every AI use-case archetype has a value mechanism, data deps and metrics moved', () => {
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
      expect(archetype.dataDependencies.length).toBeGreaterThan(0);
      expect(archetype.controlRiskNotes.length).toBeGreaterThan(0);
      expect(archetype.metricsMoved.length).toBeGreaterThan(0);
    }
  });

  it('every archetype moves only metrics the pack actually defines', () => {
    const metricKeys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const archetype of pack.aiUseCaseArchetypes) {
      for (const moved of archetype.metricsMoved) {
        expect(metricKeys.has(moved)).toBe(true);
      }
    }
  });

  it('every pain theme has a detection signal and a diagnostic question', () => {
    for (const theme of pack.painThemes) {
      expect(theme.detectionSignal.trim().length).toBeGreaterThan(0);
      expect(theme.diagnosticQuestion.trim().length).toBeGreaterThan(0);
    }
  });

  it('every reference solution pattern names a boundary and human accountability', () => {
    for (const pattern of pack.referenceSolutionPatterns) {
      expect(pattern.boundary.trim().length).toBeGreaterThan(0);
      expect(pattern.humanAccountabilityPoint.trim().length).toBeGreaterThan(0);
    }
  });

  it('carries a complete value model with dominant haircut factors and benchmarks', () => {
    expect(
      pack.valueModel.valueRealizationNarrative.trim().length,
    ).toBeGreaterThan(0);
    expect(pack.valueModel.dominantHaircutFactors.length).toBeGreaterThan(0);
    expect(pack.valueModel.valueBenchmarks.length).toBeGreaterThan(0);
    expect(pack.valueModel.timeToValueBand.trim().length).toBeGreaterThan(0);
    // Every haircut is a labelled planning range, never an asserted fact.
    for (const factor of pack.valueModel.dominantHaircutFactors) {
      expect(factor.typicalHaircut.label).toBe('planning-range');
    }
    for (const benchmark of pack.valueModel.valueBenchmarks) {
      expect(benchmark.range.label).toBe('planning-range');
    }
  });

  it('carries a real vocabulary & entities layer', () => {
    expect(pack.vocabulary.systemsOfRecord.length).toBeGreaterThan(0);
    expect(pack.vocabulary.roles.length).toBeGreaterThan(0);
    expect(pack.vocabulary.regulatoryFrames.length).toBeGreaterThan(0);
    expect(pack.vocabulary.canonicalTerms.length).toBeGreaterThan(0);
  });

  it('carries a deliverable outline for each of the four Moves phase artifacts', () => {
    const artifacts = pack.deliverableOutlines.map((o) => o.artifact).sort();
    expect(artifacts).toEqual([...REQUIRED_DELIVERABLE_ARTIFACTS].sort());
  });

  it('every deliverable outline is a real TOC — sections carry substantive guidance', () => {
    for (const outline of pack.deliverableOutlines) {
      // A real TOC, not a label list: enough sections, each with guidance.
      expect(outline.sections.length).toBeGreaterThanOrEqual(3);
      expect(outline.purpose.trim().length).toBeGreaterThan(0);
      for (const section of outline.sections) {
        expect(section.heading.trim().length).toBeGreaterThan(0);
        // Guidance must be a real instruction, not a restated heading.
        expect(section.guidance.trim().length).toBeGreaterThan(40);
      }
    }
  });

  it('every evidence anchor names an authoritative source and rejects weak evidence', () => {
    for (const anchor of pack.evidenceAnchors) {
      expect(anchor.authoritativeSource.trim().length).toBeGreaterThan(0);
      expect(
        anchor.whatGoodEvidenceLooksLike.trim().length,
      ).toBeGreaterThan(0);
      expect(anchor.weakEvidenceToReject.trim().length).toBeGreaterThan(0);
    }
  });

  it('operating-metric keys are unique within the pack', () => {
    const keys = pack.operatingMetrics.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('checkFunctionPackDepth — rejects a shallow pack', () => {
  it('reports shortfalls for a pack that fails the depth bar', () => {
    // A deliberately shallow pack: too few metrics, an archetype with no
    // value mechanism, a deliverable outline that is a label list.
    const shallow: FunctionPack = {
      ...careDeliveryCareManagementPack,
      operatingMetrics: careDeliveryCareManagementPack.operatingMetrics.slice(
        0,
        2,
      ),
      aiUseCaseArchetypes: [
        {
          ...careDeliveryCareManagementPack.aiUseCaseArchetypes[0],
          valueMechanism: '   ',
        },
        ...careDeliveryCareManagementPack.aiUseCaseArchetypes.slice(1),
      ],
      deliverableOutlines: careDeliveryCareManagementPack.deliverableOutlines.map(
        (outline) =>
          outline.artifact === 'discover_brief'
            ? {
                ...outline,
                sections: outline.sections.map((section) => ({
                  ...section,
                  guidance: '',
                })),
              }
            : outline,
      ),
    };

    const result = checkFunctionPackDepth(shallow);
    expect(result.passes).toBe(false);
    expect(result.shortfalls.some((s) => s.includes('operating metrics'))).toBe(
      true,
    );
    expect(
      result.shortfalls.some((s) => s.includes('value mechanism')),
    ).toBe(true);
    expect(
      result.shortfalls.some((s) => s.includes('label list')),
    ).toBe(true);
  });
});
