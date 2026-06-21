// ExpertPack registry — the catalog of Consilium experts the router selects from.
//
// W1.1 dependency. Today it enumerates the in-repo reference packs; when the
// W2.3 loader lands, the registry becomes a thin read-model over the
// expert_packs store (the router contract below stays identical).

import type { ExpertPack } from "./expert-pack";
import { healthcareRevenueCycleExpert } from "./packs/healthcare-revenue-cycle";
import { backOfficeSharedServicesExpert } from "./packs/back-office-shared-services";
import { futureOfWorkExpert } from "./packs/future-of-work";
import { contactCenterCxExpert } from "./packs/contact-center-cx";
import { clinicalProcessTransformationExpert } from "./packs/clinical-process-transformation";
import { treasuryTransformationExpert } from "./packs/treasury-transformation";
import { legalContractAiExpert } from "./packs/legal-contract-ai";
import { aiGovernanceExpert } from "./packs/ai-governance";
import { supplyChainTransformationExpert } from "./packs/supply-chain-transformation";
import { cybersecurityExpert } from "./packs/cybersecurity";
import { engineeringProductivityExpert } from "./packs/engineering-productivity";
import { dataAnalyticsPlatformExpert } from "./packs/data-analytics-platform";
import { salesRevenueOperationsExpert } from "./packs/sales-revenue-operations";
import { fsFinancialCrimeExpert } from "./packs/financial-services-fraud";
import { retailMerchandisingExpert } from "./packs/retail-merchandising-pricing";
import { airlineOperationsExpert } from "./packs/airline-operations";
import { energyGridOperationsExpert } from "./packs/energy-grid-operations";
import { healthcareCareManagementVbcExpert } from "./packs/healthcare-care-management-vbc";
import { healthcarePatientAccessExpert } from "./packs/healthcare-patient-access";
import { healthcarePharmacyOperationsExpert } from "./packs/healthcare-pharmacy-operations";
import { airlineNetworkPlanningExpert } from "./packs/airline-network-planning";
import { airlineLoyaltyCustomerExpert } from "./packs/airline-loyalty-customer";
import { airlineGroundAirportOpsExpert } from "./packs/airline-ground-operations";
import { retailStoreOperationsExpert } from "./packs/retail-store-operations";
import { retailOmnichannelFulfillmentExpert } from "./packs/retail-omnichannel-fulfillment";
import { valueOfficeAiEnablementExpert } from "./packs/value-office-ai-enablement";
import { consumerProductsOperationsExpert } from "./packs/consumer-products-operations";
import { foodserviceHospitalityOperationsExpert } from "./packs/foodservice-hospitality-operations";
import { marketingBrandExpert } from "./packs/marketing-brand";
import { financeFpaControllershipExpert } from "./packs/finance-fpa-controllership";
import { corporateDevelopmentMaExpert } from "./packs/corporate-development-ma";
import { humanCapitalHrExpert } from "./packs/human-capital-hr";
import { procurementSourcingExpert } from "./packs/procurement-strategic-sourcing";
import { enterpriseRiskComplianceExpert } from "./packs/enterprise-risk-compliance-audit";
import { itOperationsItsmExpert } from "./packs/it-operations-itsm";
import { insuranceUnderwritingClaimsExpert } from "./packs/insurance-underwriting-claims";
import { manufacturingOperationsExpert } from "./packs/manufacturing-operations";
import { lifeSciencesRdCommercialExpert } from "./packs/life-sciences-rd-commercial";
import { telecomNetworkOperationsExpert } from "./packs/telecom-network-operations";
import { mediaEntertainmentExpert } from "./packs/media-entertainment";
import { publicSectorCitizenServicesExpert } from "./packs/public-sector-citizen-services";
import { itOutsourcingManagedServicesExpert } from "./packs/it-outsourcing-managed-services";
import { itSpendOptimizationExpert } from "./packs/it-spend-optimization-tbm";
import { aiEngineeringDeliveryExpert } from "./packs/ai-engineering-delivery";
import { cloudInfrastructureModernizationExpert } from "./packs/cloud-infrastructure-modernization";
import { erpPlatformModernizationExpert } from "./packs/erp-platform-modernization";
import { applicationModernizationExpert } from "./packs/application-modernization";
import { enterpriseArchitectureExpert } from "./packs/enterprise-architecture";
import { itStrategyOperatingModelExpert } from "./packs/it-strategy-operating-model";
import { digitalProductManagementExpert } from "./packs/digital-product-management";
import { integrationApiManagementExpert } from "./packs/integration-api-management";
import { identityAccessManagementExpert } from "./packs/identity-access-management";
import { technologyResilienceBcdrExpert } from "./packs/technology-resilience-bcdr";
import { customerLoyaltyPersonalizationExpert } from "./packs/customer-loyalty-personalization";
import { logisticsTransportationOperationsExpert } from "./packs/logistics-transportation-operations";
import { pricingRevenueManagementExpert } from "./packs/pricing-revenue-management";
import { automotiveOperationsExpert } from "./packs/automotive-operations";
import { esgSustainabilityExpert } from "./packs/esg-sustainability";
import { fieldCustomerServiceOperationsExpert } from "./packs/field-customer-service-operations";
import { bankingPaymentsOperationsExpert } from "./packs/banking-payments-operations";
import { wealthAssetManagementExpert } from "./packs/wealth-asset-management";
import { dataGovernanceMdmExpert } from "./packs/data-governance-mdm";
import { dataPrivacyProtectionExpert } from "./packs/data-privacy-protection";
import { hospitalityLodgingOperationsExpert } from "./packs/hospitality-lodging-operations";
import { higherEducationOperationsExpert } from "./packs/higher-education-operations";
import { corporateTaxExpert } from "./packs/corporate-tax";
import { customerSuccessAccountManagementExpert } from "./packs/customer-success-account-management";

/** All registered experts. Order is not significant — the router ranks. */
export const EXPERT_PACKS: readonly ExpertPack[] = [
  healthcareRevenueCycleExpert,
  backOfficeSharedServicesExpert,
  futureOfWorkExpert,
  contactCenterCxExpert,
  clinicalProcessTransformationExpert,
  treasuryTransformationExpert,
  legalContractAiExpert,
  aiGovernanceExpert,
  supplyChainTransformationExpert,
  cybersecurityExpert,
  engineeringProductivityExpert,
  dataAnalyticsPlatformExpert,
  salesRevenueOperationsExpert,
  fsFinancialCrimeExpert,
  retailMerchandisingExpert,
  airlineOperationsExpert,
  energyGridOperationsExpert,
  healthcareCareManagementVbcExpert,
  healthcarePatientAccessExpert,
  healthcarePharmacyOperationsExpert,
  airlineNetworkPlanningExpert,
  airlineLoyaltyCustomerExpert,
  airlineGroundAirportOpsExpert,
  retailStoreOperationsExpert,
  retailOmnichannelFulfillmentExpert,
  valueOfficeAiEnablementExpert,
  consumerProductsOperationsExpert,
  foodserviceHospitalityOperationsExpert,
  marketingBrandExpert,
  financeFpaControllershipExpert,
  corporateDevelopmentMaExpert,
  humanCapitalHrExpert,
  procurementSourcingExpert,
  enterpriseRiskComplianceExpert,
  itOperationsItsmExpert,
  insuranceUnderwritingClaimsExpert,
  manufacturingOperationsExpert,
  lifeSciencesRdCommercialExpert,
  telecomNetworkOperationsExpert,
  mediaEntertainmentExpert,
  publicSectorCitizenServicesExpert,
  itOutsourcingManagedServicesExpert,
  itSpendOptimizationExpert,
  aiEngineeringDeliveryExpert,
  cloudInfrastructureModernizationExpert,
  erpPlatformModernizationExpert,
  applicationModernizationExpert,
  enterpriseArchitectureExpert,
  itStrategyOperatingModelExpert,
  digitalProductManagementExpert,
  integrationApiManagementExpert,
  identityAccessManagementExpert,
  technologyResilienceBcdrExpert,
  customerLoyaltyPersonalizationExpert,
  logisticsTransportationOperationsExpert,
  pricingRevenueManagementExpert,
  automotiveOperationsExpert,
  esgSustainabilityExpert,
  fieldCustomerServiceOperationsExpert,
  bankingPaymentsOperationsExpert,
  wealthAssetManagementExpert,
  dataGovernanceMdmExpert,
  dataPrivacyProtectionExpert,
  hospitalityLodgingOperationsExpert,
  higherEducationOperationsExpert,
  corporateTaxExpert,
  customerSuccessAccountManagementExpert,
];

export function getExpertById(id: string): ExpertPack | undefined {
  return EXPERT_PACKS.find((p) => p.identity.id === id);
}

/** Structured lookup by the router's dimensional axes. */
export function findExperts(filter: {
  industry?: string;
  functionKey?: string;
  crossCuttingDomain?: string;
}): ExpertPack[] {
  return EXPERT_PACKS.filter((p) => {
    if (filter.industry && p.identity.industry !== filter.industry) return false;
    if (filter.functionKey && p.identity.functionKey !== filter.functionKey) return false;
    if (filter.crossCuttingDomain && p.identity.crossCuttingDomain !== filter.crossCuttingDomain) return false;
    return true;
  });
}
