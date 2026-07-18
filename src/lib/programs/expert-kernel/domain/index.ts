// Domain Function Packs — public surface.
//
// A Domain Function Pack is a curated, function-indexed industry-depth layer
// an agent binds into context BEFORE it reaches for general intelligence
// (spec: docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md).
//
// v1 ships the eight-layer schema, the extensible registry, the healthcare
// reference library, the first retail packs,
// and one concrete context-binding consumer.
//
//   • function-pack-types        — the typed eight-layer FunctionPack schema.
//   • function-pack-registry     — resolveFunctionPack + the §6 depth check.
//   • function-pack-context-binding — bindFunctionPackForArtifact (the §5 proof).
//   • healthcare/*               — the healthcare reference packs: the
//     provider-function taxonomy plus the member-service Agent Assist
//     specialization used by payer/provider contact-center Moves.
//   • retail/*                   — the retail vertical: merchandising &
//     assortment, pricing & promotions, demand & inventory planning, and
//     supply chain & fulfillment. The remaining eight retail functions are
//     deepened in later batches.

export * from './function-pack-types';
export * from './function-pack-registry';
export * from './function-pack-context-binding';
export { careDeliveryCareManagementPack } from './healthcare/care-delivery-care-management';
export { populationHealthValueBasedCarePack } from './healthcare/population-health-value-based-care';
export { clinicalOperationsDocumentationPack } from './healthcare/clinical-operations-documentation';
export { patientAccessEngagementExperiencePack } from './healthcare/patient-access-engagement-experience';
export { qualitySafetyRegulatoryPack } from './healthcare/quality-safety-regulatory';
export { healthInformationInteroperabilityPack } from './healthcare/health-information-interoperability';
export { researchClinicalTrialsPack } from './healthcare/research-clinical-trials';
export { revenueCyclePack } from './healthcare/revenue-cycle';
export { clinicalSupplyChainPack } from './healthcare/clinical-supply-chain';
export { clinicalWorkforceStaffingPack } from './healthcare/clinical-workforce-staffing';
export { payerClaimsOperationsPack } from './healthcare/payer-claims-operations';
export { memberServiceAgentAssistPack } from './healthcare/member-service-agent-assist';
export { pharmacyPack } from './healthcare/pharmacy';
export { merchandisingAssortmentPack } from './retail/merchandising-assortment';
export { pricingPromotionsPack } from './retail/pricing-promotions';
export { demandInventoryPlanningPack } from './retail/demand-inventory-planning';
export { supplyChainFulfillmentPack } from './retail/supply-chain-fulfillment';
export { digitalCommercePack } from './retail/digital-commerce';
export { marketingRetailMediaPack } from './retail/marketing-retail-media';
export { storeOperationsPack } from './retail/store-operations';
export { customerLoyaltyPersonalizationPack } from './retail/customer-loyalty-personalization';
export { customerCarePack } from './retail/customer-care';
export { workforceLaborPack } from './retail/workforce-labor';
export { returnsReverseLogisticsPack } from './retail/returns-reverse-logistics';
export { lossPreventionPack } from './retail/loss-prevention';
export { customerServicingContactCenterPack } from './financial-services/customer-servicing-contact-center';
export { collectionsRecoveryPack } from './financial-services/collections-recovery';
export { riskManagementPack } from './financial-services/risk-management';
export { fraudFinancialCrimePack } from './financial-services/fraud-financial-crime';
export { regulatoryCompliancePack } from './financial-services/regulatory-compliance';
export { financeTreasuryAlmPack } from './financial-services/finance-treasury-alm';
export { retailBankingDepositsPack } from './financial-services/retail-banking-deposits';
export { lendingCreditUnderwritingPack } from './financial-services/lending-credit-underwriting';
export { capitalMarketsTradingPack } from './financial-services/capital-markets-trading';
export { commercialCorporateBankingPack } from './financial-services/commercial-corporate-banking';
export { paymentsMoneyMovementPack } from './financial-services/payments-money-movement';
export { wealthAssetManagementPack } from './financial-services/wealth-asset-management';
