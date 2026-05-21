// Domain Function Packs — public surface.
//
// A Domain Function Pack is a curated, function-indexed industry-depth layer
// an agent binds into context BEFORE it reaches for general intelligence
// (spec: docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md).
//
// v1 ships the eight-layer schema, the extensible registry, the complete
// twelve-function healthcare reference library, the first two retail packs,
// and one concrete context-binding consumer.
//
//   • function-pack-types        — the typed eight-layer FunctionPack schema.
//   • function-pack-registry     — resolveFunctionPack + the §6 depth check.
//   • function-pack-context-binding — bindFunctionPackForArtifact (the §5 proof).
//   • healthcare/*               — the twelve healthcare reference packs: the
//     value-based-care spine, clinical operations & documentation, patient
//     access / engagement / experience, research & clinical trials, the
//     revenue cycle, quality / safety / regulatory, health information
//     management / data & interoperability, the clinical supply chain,
//     clinical workforce & staffing, payer / claims operations, and pharmacy
//     — the complete provider-function taxonomy.
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
