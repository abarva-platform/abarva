import { formatConsultantCents } from "@/lib/programs/value-engine/format-money";

export type PurposeNumberType =
  | { kind: "currency"; currency: "USD" }
  | { kind: "percent"; scale: "ratio" | "whole" }
  | { kind: "count"; unit: string }
  | { kind: "duration"; unit: "sec" | "min" | "hr" | "days" }
  | { kind: "rate"; unit: string };

/** Display only. Raw values and units remain in the source binding proof. */
export function formatPurposeNumber(
  value: number,
  type: PurposeNumberType,
): string {
  if (!Number.isFinite(value)) throw new Error("purpose_number:non_finite");
  if ("unit" in type && !type.unit.trim())
    throw new Error("purpose_number:unit_missing");
  const fmt = (n: number, digits: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  switch (type.kind) {
    case "currency": {
      const cents = Math.round(value * 100);
      if (
        !Number.isSafeInteger(cents) ||
        Math.abs(cents / 100 - value) > 0.000001
      )
        throw new Error("purpose_number:currency_precision");
      return formatConsultantCents(cents, { compactDigits: 1 });
    }
    case "percent":
      return `${fmt(type.scale === "ratio" ? value * 100 : value, 1)}%`;
    case "count":
      if (!Number.isSafeInteger(value))
        throw new Error("purpose_number:count_not_integer");
      return fmt(value, 0);
    case "duration":
      return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${type.unit}`;
    case "rate":
      return `${fmt(value, 1)} ${type.unit}`;
  }
}

/** Only explicit lexical units are recognized here; bare numbers need adapter metadata. */
export function explicitPurposeNumber(
  raw: string,
): { value: number; type: PurposeNumberType; display: string } | undefined {
  const value = Number(
    raw
      .replace(/[$%,~]|\b(?:seconds?|secs?|minutes?|hours?|days?)\b/gi, "")
      .replace(/\s/g, ""),
  );
  if (!Number.isFinite(value)) return undefined;
  const type: PurposeNumberType | undefined = /^~?\s*\$/.test(raw)
    ? { kind: "currency", currency: "USD" }
    : /%$/.test(raw)
      ? { kind: "percent", scale: "whole" }
      : /(?:seconds?|secs?)$/.test(raw)
        ? { kind: "duration", unit: "sec" }
        : /minutes?$/.test(raw)
          ? { kind: "duration", unit: "min" }
          : /hours?$/.test(raw)
            ? { kind: "duration", unit: "hr" }
            : /days?$/.test(raw)
              ? { kind: "duration", unit: "days" }
              : undefined;
  return type
    ? {
        value,
        type,
        display: `${raw.trim().startsWith("~") ? "~" : ""}${formatPurposeNumber(value, type)}`,
      }
    : undefined;
}

export function purposeComparableUnit(type: PurposeNumberType): string {
  return type.kind === "currency"
    ? `currency:${type.currency}`
    : type.kind === "percent"
      ? "percent"
      : `${type.kind}:${type.unit}`;
}
