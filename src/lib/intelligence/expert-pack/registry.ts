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
