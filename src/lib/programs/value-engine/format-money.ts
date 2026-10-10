/** Format an engine amount in cents for consultant-facing value readback. */
export function formatValueCents(cents: unknown): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) {
    return "unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}
