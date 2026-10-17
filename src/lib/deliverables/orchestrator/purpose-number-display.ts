import { formatConsultantCents } from "@/lib/programs/value-engine/format-money";

export type PurposeNumberType =
  | { kind: "currency"; currency: "USD" }
  | { kind: "percent"; scale: "ratio" | "whole" }
  | { kind: "count"; unit: string }
  | { kind: "duration"; unit: "sec" | "min" | "hr" | "days" }
  | { kind: "rate"; unit: string };

export interface PurposeDatePart {
  part: "year" | "month" | "day";
  iso: string;
  group: string;
}

/** Retain an explicit adjacent calendar-duration unit without renumbering source slots. */
export function purposeSourceTrailingUnit(
  line: string,
  offset: number,
  raw: string,
): string | undefined {
  if (!/^\d[\d,]*(?:\.\d+)?$/.test(raw)) return undefined;
  return line
    .slice(offset + raw.length)
    .match(/^\s+(?:whole\s+)?(weeks?|months?|years?)\b/i)?.[1]
    ?.toLowerCase()
    .replace(/s$/, "");
}

export function assertPurposeUnitSlotUse(
  text: string,
  slots: Record<string, { trailingUnit?: string }>,
): void {
  for (const match of text.matchAll(/\{([^{}]+)\}/g)) {
    const unit = slots[match[1]!]?.trailingUnit;
    if (!unit) continue;
    const after = text.slice(match.index! + match[0].length);
    const before = text.slice(0, match.index);
    if (
      !new RegExp(`^\\s+(?:whole\\s+)?${unit}s?\\b`, "i").test(after) &&
      !new RegExp(`\\b${unit}s?\\s*[:=]\\s*$`, "i").test(before)
    )
      throw new Error(
        `purpose_number:unit_missing:${match[1]} requires its source unit ${unit}`,
      );
  }
}

/** Versioned source references are identifiers, not measured values. Match the whole identifier. */
export function stripPurposeSourceVersionReferences(
  text: string,
  sourceTexts: readonly string[],
): string {
  const pattern = /(?<![\w.-])[a-z][a-z-]*-v\d+(?:\.\d+)*(?![\w.-])/g;
  const declared = new Set(
    sourceTexts.flatMap((source) => source.match(pattern) || []),
  );
  return text.replace(pattern, (reference) =>
    declared.has(reference) ? "" : reference,
  );
}

/** Preserve source date components without changing existing figure-slot identities. */
export function purposeSourceDatePart(
  line: string,
  offset: number,
  sourceLine: string,
): PurposeDatePart | undefined {
  for (const match of line.matchAll(
    /(?<![\w-])\d{4}-\d{2}(?:-\d{2})?(?![\w-])/g,
  )) {
    const iso = match[0];
    const full = iso.length === 7 ? `${iso}-01` : iso;
    const date = new Date(`${full}T00:00:00Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== full
    )
      continue;
    const relative = offset - match.index!;
    const part =
      relative === 0
        ? "year"
        : relative === 5
          ? "month"
          : relative === 8 && iso.length === 10
            ? "day"
            : undefined;
    if (part) return { part, iso, group: `${sourceLine}:${match.index}` };
  }
  return undefined;
}

/** A month/day token is usable only in its original ISO date chain, never as a year or quantity. */
export function assertPurposeDateSlotUse(
  text: string,
  slots: Record<string, { datePart?: PurposeDatePart }>,
): void {
  for (const match of text.matchAll(/\{([^{}]+)\}/g)) {
    const date = slots[match[1]!]?.datePart;
    if (!date || date.part === "year") continue;
    const prefix = text.slice(0, match.index);
    const previous = prefix.match(/\{([^{}]+)\}-$/);
    const parent = previous ? slots[previous[1]!]?.datePart : undefined;
    if (
      !parent ||
      parent.group !== date.group ||
      parent.part !== (date.part === "month" ? "year" : "month")
    )
      throw new Error(
        `purpose_number:date_part_misused:${match[1]} is the ${date.part} of ${date.iso}; use the original ISO chain or a year token with a written month`,
      );
  }
}

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
