const SOURCE_EXPECTATION_LABELS: Readonly<Record<string, string>> = {
  cost_productivity_or_cycle_time: "Save time, improve productivity, or shorten a process",
  revenue_uplift_or_experience: "Increase revenue or improve people's experience",
  yield_leakage_or_regulatory_exposure: "Reduce lost value or compliance risk",
};

export function expectedBenefitKindLabel(sourceCode: string | null | undefined): string | null {
  if (!sourceCode?.trim()) return null;
  const code = sourceCode.trim();
  return SOURCE_EXPECTATION_LABELS[code] ?? code.replace(/_/g, " ");
}
