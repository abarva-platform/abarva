import type {
  ContractOptimizationOpportunitySet,
  OpportunityCalculationRead,
} from "./contract-optimization-opportunity";

/**
 * Contract optimization calculations can carry many line-level inputs. The
 * browser page needs the reproducible totals, counts, formula, and state; raw
 * calculation lines stay in Postgres for drill-down/API proof instead of being
 * serialized into the initial React payload.
 */
export function trimContractOptimizationOpportunitySetForClient(
  opportunitySet: ContractOptimizationOpportunitySet | null,
): ContractOptimizationOpportunitySet | null {
  if (!opportunitySet) return null;
  return {
    ...opportunitySet,
    opportunities: opportunitySet.opportunities.map((opportunity) => ({
      ...opportunity,
      calculation: trimCalculationForClient(opportunity.calculation),
    })),
  };
}

function trimCalculationForClient(
  calculation: OpportunityCalculationRead | null,
): OpportunityCalculationRead | null {
  if (!calculation) return null;
  return {
    ...calculation,
    lines: [],
  };
}
