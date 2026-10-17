/** Presentation only. Engine and workbook retain whole-cent precision. */
export function formatConsultantCents(
  cents: unknown,
  options?: { compactDigits: number },
): string {
  if (typeof cents !== "number" || !Number.isSafeInteger(cents)) {
    return "unknown";
  }
  const dollars = Math.abs(cents) / 100;
  const unit = dollars >= 100000 ? "M" : dollars >= 1000 ? "K" : "";
  const scaled =
    unit === "M" ? dollars / 1000000 : unit === "K" ? dollars / 1000 : dollars;
  const digits = unit ? (options?.compactDigits ?? (unit === "M" ? 2 : 1)) : 0;
  const amount = scaled.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: unit ? digits : 2,
  });
  return cents < 0 ? `$(${amount})${unit}` : `$${amount}${unit}`;
}

export function formatConsultantPercent(ratio: unknown): string {
  return typeof ratio === "number" && Number.isFinite(ratio)
    ? `${Math.round(ratio * 100)}%`
    : "unknown";
}

export const formatValueCents = formatConsultantCents;
