export function packageOpportunityAmountFailure(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0) {
    return "package_opportunity_amount_usd must be a finite, nonnegative total";
  }
  return null;
}
