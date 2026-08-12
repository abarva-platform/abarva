export interface SourceOptimizeContractRouteParams {
  readonly contractId?: string | null;
  readonly opportunityId?: string | null;
}

export function buildSourceOptimizeContractHref(
  params: SourceOptimizeContractRouteParams = {},
): string {
  const query = new URLSearchParams();
  const contractId = params.contractId?.trim();
  const opportunityId = params.opportunityId?.trim();

  if (contractId) query.set("contractId", contractId);
  if (opportunityId) query.set("opportunityId", opportunityId);

  const suffix = query.toString();
  return suffix ? `/source/optimize?${suffix}` : "/source/optimize";
}
