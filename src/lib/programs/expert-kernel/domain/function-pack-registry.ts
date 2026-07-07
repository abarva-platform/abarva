// Domain Function Pack registry — the extensible catalog and the resolver.
//
// `resolveFunctionPack(industryKey, functionKey)` is the single entry point a
// surface uses to bind a pack before it reasons about a task (spec §5). The
// registry is an EXTENSIBLE catalog — adding a future pack is exactly one new
// entry in `FUNCTION_PACK_ENTRIES`, no other file changes. This mirrors the
// shape of `board-artifacts-registry.ts`.
//
// HONESTY: when no pack exists for an `(industryKey, functionKey)`, the
// resolver returns `null` — never a faked or partial pack. A missing pack is a
// known gap the agent surfaces honestly (spec §5, §7), it is not silently
// papered over.
//
// Pure module: deterministic, no I/O.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
  type FunctionPack,
  type FunctionPackFunctionKey,
  type FunctionPackIndustryKey,
} from "./function-pack-types";
import { careDeliveryCareManagementPack } from "./healthcare/care-delivery-care-management";
import { clinicalOperationsDocumentationPack } from "./healthcare/clinical-operations-documentation";
import { patientAccessEngagementExperiencePack } from "./healthcare/patient-access-engagement-experience";
import { populationHealthValueBasedCarePack } from "./healthcare/population-health-value-based-care";
import { qualitySafetyRegulatoryPack } from "./healthcare/quality-safety-regulatory";
import { healthInformationInteroperabilityPack } from "./healthcare/health-information-interoperability";
import { researchClinicalTrialsPack } from "./healthcare/research-clinical-trials";
import { revenueCyclePack } from "./healthcare/revenue-cycle";
import { clinicalSupplyChainPack } from "./healthcare/clinical-supply-chain";
import { clinicalWorkforceStaffingPack } from "./healthcare/clinical-workforce-staffing";
import { payerClaimsOperationsPack } from "./healthcare/payer-claims-operations";
import { pharmacyPack } from "./healthcare/pharmacy";
import { merchandisingAssortmentPack } from "./retail/merchandising-assortment";
import { pricingPromotionsPack } from "./retail/pricing-promotions";
import { demandInventoryPlanningPack } from "./retail/demand-inventory-planning";
import { supplyChainFulfillmentPack } from "./retail/supply-chain-fulfillment";
import { digitalCommercePack } from "./retail/digital-commerce";
import { marketingRetailMediaPack } from "./retail/marketing-retail-media";
import { storeOperationsPack } from "./retail/store-operations";
import { customerLoyaltyPersonalizationPack } from "./retail/customer-loyalty-personalization";
import { customerCarePack } from "./retail/customer-care";
import { workforceLaborPack } from "./retail/workforce-labor";
import { returnsReverseLogisticsPack } from "./retail/returns-reverse-logistics";
import { lossPreventionPack } from "./retail/loss-prevention";
import { customerServicingContactCenterPack } from "./financial-services/customer-servicing-contact-center";
import { collectionsRecoveryPack } from "./financial-services/collections-recovery";
import { riskManagementPack } from "./financial-services/risk-management";
import { fraudFinancialCrimePack } from "./financial-services/fraud-financial-crime";
import { regulatoryCompliancePack } from "./financial-services/regulatory-compliance";
import { financeTreasuryAlmPack } from "./financial-services/finance-treasury-alm";
import { costOptimizationVendorManagementPack } from "./financial-services/cost-optimization-vendor-management";
import { retailBankingDepositsPack } from "./financial-services/retail-banking-deposits";
import { lendingCreditUnderwritingPack } from "./financial-services/lending-credit-underwriting";
import { capitalMarketsTradingPack } from "./financial-services/capital-markets-trading";
import { commercialCorporateBankingPack } from "./financial-services/commercial-corporate-banking";
import { paymentsMoneyMovementPack } from "./financial-services/payments-money-movement";
import { wealthAssetManagementPack } from "./financial-services/wealth-asset-management";
import { airlineIropsRecoveryPack } from "./airline/irops-recovery";

/**
 * The Function Pack catalog — one entry per `(industryKey, functionKey)`.
 *
 * TODAY this holds the complete healthcare reference library — all twelve
 * functions of the provider taxonomy (spec §3): the two value-based-care
 * spine packs (spec §6), clinical documentation, patient access, research &
 * clinical trials, the revenue cycle, quality / safety / regulatory, health
 * information / interoperability, the clinical supply chain, clinical
 * workforce & staffing, payer / claims operations, and pharmacy — plus the
 * opening retail packs: merchandising & assortment, pricing & promotions,
 * demand & inventory planning, and supply chain & fulfillment. A future pack
 * is added as ONE additional entry; the resolver and every consumer need no
 * change. Keyed off the pack's own `industryKey` / `functionKey` so an entry
 * can never disagree with its pack.
 */
const FUNCTION_PACK_ENTRIES: readonly FunctionPack[] = [
  careDeliveryCareManagementPack,
  populationHealthValueBasedCarePack,
  clinicalOperationsDocumentationPack,
  patientAccessEngagementExperiencePack,
  qualitySafetyRegulatoryPack,
  healthInformationInteroperabilityPack,
  researchClinicalTrialsPack,
  revenueCyclePack,
  clinicalSupplyChainPack,
  clinicalWorkforceStaffingPack,
  payerClaimsOperationsPack,
  pharmacyPack,
  merchandisingAssortmentPack,
  pricingPromotionsPack,
  demandInventoryPlanningPack,
  supplyChainFulfillmentPack,
  digitalCommercePack,
  marketingRetailMediaPack,
  storeOperationsPack,
  customerLoyaltyPersonalizationPack,
  customerCarePack,
  workforceLaborPack,
  returnsReverseLogisticsPack,
  lossPreventionPack,
  customerServicingContactCenterPack,
  collectionsRecoveryPack,
  riskManagementPack,
  fraudFinancialCrimePack,
  regulatoryCompliancePack,
  financeTreasuryAlmPack,
  costOptimizationVendorManagementPack,
  retailBankingDepositsPack,
  lendingCreditUnderwritingPack,
  capitalMarketsTradingPack,
  commercialCorporateBankingPack,
  paymentsMoneyMovementPack,
  wealthAssetManagementPack,
  airlineIropsRecoveryPack,
] as const;

/**
 * Resolve the Domain Function Pack for an `(industryKey, functionKey)`.
 *
 * Returns the pack when one is catalogued, or `null` when none exists — the
 * resolver NEVER fabricates a pack. A `null` is the signal for the caller to
 * fall back to general reasoning and say so honestly (spec §5).
 */
export function resolveFunctionPack(
  industryKey: FunctionPackIndustryKey,
  functionKey: FunctionPackFunctionKey,
): FunctionPack | null {
  return (
    FUNCTION_PACK_ENTRIES.find(
      (pack) =>
        pack.industryKey === industryKey && pack.functionKey === functionKey,
    ) ?? null
  );
}

/**
 * List every `(industryKey, functionKey)` the catalog covers — useful for a
 * coverage view that wants to show, honestly, which functions have curated
 * depth and which are still general-reasoning gaps.
 */
export function listFunctionPackCoverage(): {
  industryKey: FunctionPackIndustryKey;
  functionKey: FunctionPackFunctionKey;
  functionLabel: string;
}[] {
  return FUNCTION_PACK_ENTRIES.map((pack) => ({
    industryKey: pack.industryKey,
    functionKey: pack.functionKey,
    functionLabel: pack.functionLabel,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Depth check — the §6 depth bar, enforced in one place
// ─────────────────────────────────────────────────────────────────────────────

/** The result of checking a pack against the §6 depth bar. */
export interface FunctionPackDepthCheck {
  /** True only when every minimum is met and no hard fail is present. */
  passes: boolean;
  /** Human-readable reasons a pack fell short — empty when it passes. */
  shortfalls: string[];
}

/**
 * Check a Function Pack against the §6 depth bar — the minimum layer counts,
 * the four required deliverable outlines, and the structural hard fails (a
 * metric with no definition or benchmark, an archetype with no value
 * mechanism, a deliverable outline that is a label list).
 *
 * This is the machine-checkable half of the depth bar; it cannot judge whether
 * content is "senior-operator deep", but it does reject the structural fails
 * the spec names. The pack tests call it; a future authoring tool can too.
 */
export function checkFunctionPackDepth(
  pack: FunctionPack,
): FunctionPackDepthCheck {
  const shortfalls: string[] = [];
  const min = FUNCTION_PACK_DEPTH_MINIMUMS;

  if (pack.operatingMetrics.length < min.operatingMetrics) {
    shortfalls.push(
      `operating metrics: ${pack.operatingMetrics.length} < ${min.operatingMetrics}`,
    );
  }
  if (pack.painThemes.length < min.painThemes) {
    shortfalls.push(
      `pain themes: ${pack.painThemes.length} < ${min.painThemes}`,
    );
  }
  if (pack.aiUseCaseArchetypes.length < min.aiUseCaseArchetypes) {
    shortfalls.push(
      `AI use-case archetypes: ${pack.aiUseCaseArchetypes.length} < ${min.aiUseCaseArchetypes}`,
    );
  }
  if (pack.referenceSolutionPatterns.length < min.referenceSolutionPatterns) {
    shortfalls.push(
      `reference solution patterns: ${pack.referenceSolutionPatterns.length} < ${min.referenceSolutionPatterns}`,
    );
  }
  if (pack.evidenceAnchors.length < min.evidenceAnchors) {
    shortfalls.push(
      `evidence anchors: ${pack.evidenceAnchors.length} < ${min.evidenceAnchors}`,
    );
  }

  // Hard fail — every metric needs a definition AND a benchmark range.
  for (const metric of pack.operatingMetrics) {
    if (!metric.definition.trim()) {
      shortfalls.push(`metric "${metric.key}" has no definition`);
    }
    if (
      !Number.isFinite(metric.benchmarkRange.low) ||
      !Number.isFinite(metric.benchmarkRange.high)
    ) {
      shortfalls.push(`metric "${metric.key}" has no benchmark range`);
    }
  }

  // Hard fail — every archetype needs a value mechanism.
  for (const archetype of pack.aiUseCaseArchetypes) {
    if (!archetype.valueMechanism.trim()) {
      shortfalls.push(`archetype "${archetype.key}" has no value mechanism`);
    }
  }

  // The four Moves phase artifacts must each carry an outline.
  for (const artifact of REQUIRED_DELIVERABLE_ARTIFACTS) {
    const outline = pack.deliverableOutlines.find(
      (o) => o.artifact === artifact,
    );
    if (!outline) {
      shortfalls.push(`deliverable outline missing: ${artifact}`);
      continue;
    }
    // Hard fail — an outline must be a real TOC, not a label list. Every
    // section needs substantive guidance.
    for (const section of outline.sections) {
      if (!section.guidance.trim()) {
        shortfalls.push(
          `outline "${artifact}" section "${section.heading}" has no guidance (label list, not a TOC)`,
        );
      }
    }
    if (outline.sections.length < 3) {
      shortfalls.push(
        `outline "${artifact}" has only ${outline.sections.length} sections — too thin for a real TOC`,
      );
    }
  }

  return { passes: shortfalls.length === 0, shortfalls };
}
