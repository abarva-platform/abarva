import { cellText } from "./cxo-language";

const CURRENCY_FIELDS: ReadonlySet<string> = new Set([
  "annualCostUsd",
  "annualSpendUsd",
  "exitCostUsd",
]);

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))
    return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function compactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000)
    return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString("en-US")}`;
}

export function formatRecordField(field: string, value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  )
    return "\u2014";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && !Number.isFinite(value)) return "Unknown";

  // Cost provenance shares a name prefix with money, but is not an amount.
  const currency = CURRENCY_FIELDS.has(field);
  const percentage = /pct|percent/i.test(field);
  if (currency || percentage) {
    const number = finiteNumber(value);
    if (number !== null)
      return currency
        ? compactCurrency(number)
        : `${number.toLocaleString("en-US")}%`;
  }

  if (typeof value === "number") return value.toLocaleString("en-US");
  return cellText(String(value));
}
