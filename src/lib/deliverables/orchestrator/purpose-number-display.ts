import { formatConsultantCents } from "@/lib/programs/value-engine/format-money";
import type { RenderableTable } from "./types";
import {
  compactPurposeCitationIds,
  purposeCitationIds,
} from "./purpose-citations";

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

export interface PurposeMeasurementPeriod {
  label: string;
  sourceCitation: number;
  sourceQuote: string;
}

/** Bind a complete magnitude, never the integer fragment before a decimal suffix. */
export function purposeSourceNumberPattern(): RegExp {
  return /(?<![\w{])(?:~\s*)?(?:\$\s*)?\d[\d,]*(?:\.\d+)?(?:[KMB]|%|\s*(?:seconds?|secs?|hours?|days?|minutes?))?(?!\w|\.\d)/g;
}

export function purposeSourceNumberValue(raw: string): number {
  const match = raw
    .trim()
    .match(
      /^(?:~\s*)?(?:\$\s*)?(-?\d[\d,]*(?:\.\d+)?)([KMB])?(?:%|\s*(?:seconds?|secs?|hours?|days?|minutes?))?$/,
    );
  if (!match) throw new Error("purpose_number:unsupported_literal");
  return (
    Number(match[1]!.replace(/,/g, "")) *
    ({ K: 1e3, M: 1e6, B: 1e9 }[match[2] || ""] || 1)
  );
}

/** Preserve an explicit source qualifier without changing figure-slot identities. */
export function purposeSourceApproximation(
  line: string,
  offset: number,
  raw: string,
): boolean {
  return (
    /^~/.test(raw.trim()) ||
    /\b(?:approximately|approx\.?|about|roughly)\s*$/i.test(
      line.slice(0, offset),
    )
  );
}

/** A common scalar period is stated once within a cell/paragraph, never borrowed across pages. */
export function purposePeriodSuffix(
  period: string | undefined,
  localText: string,
  displayed: Set<string>,
): string {
  if (!period) return "";
  const normalize = (value: string) => value.replace(/\s+/g, " ").toLowerCase();
  const seen =
    displayed.has(period) || normalize(localText).includes(normalize(period));
  displayed.add(period);
  return seen ? "" : ` (${period})`;
}

/** A scalar's window must be declared independently of any chart window. */
export function validatePurposeMeasurementPeriod(
  period: PurposeMeasurementPeriod | undefined,
  sources: readonly { citationNumber: number; statement: string }[],
): void {
  if (!period) return;
  const source = sources.find(
    (s) => s.citationNumber === period.sourceCitation,
  );
  const normalized = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  if (
    !period.label.trim() ||
    !period.sourceQuote.trim() ||
    !normalized(period.sourceQuote).includes(normalized(period.label)) ||
    !source ||
    !normalized(source.statement).includes(normalized(period.sourceQuote))
  )
    throw new Error("purpose_number:unsupported_measurement_period");
}

/** Both native formats use the same server-bound value, unit, period and citations. */
export function purposeTypedTableRows(table: RenderableTable): string[][] {
  const rows = table.rows.map((row) => [...row]);
  for (const cell of table.numericCells || []) {
    const original = rows[cell.row]?.[cell.column];
    if (original === undefined)
      throw new Error(`purpose_number:numeric_cell_missing:${table.key}`);
    const citations = [
      ...new Set([
        ...purposeCitationIds(original),
        ...(cell.measurementPeriod
          ? [cell.measurementPeriod.sourceCitation]
          : []),
      ]),
    ];
    rows[cell.row]![cell.column] = [
      formatPurposeNumber(cell.value, cell.type),
      cell.measurementPeriod ? `(${cell.measurementPeriod.label})` : "",
      citations.length ? compactPurposeCitationIds(citations) : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return rows;
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

export interface PurposeSourceRecordReference {
  identifier: string;
  source: number;
  locator: string;
}

/** Only a declared ID column establishes record identifiers; prose and amounts do not. */
export function purposeSourceRecordReferences(
  sourceTexts: readonly string[],
): PurposeSourceRecordReference[] {
  return sourceTexts.flatMap((text, sourceIndex) => {
    let idColumns: number[] = [];
    return text.split("\n").flatMap((line, lineIndex) => {
      if (line.startsWith("Worksheet ")) idColumns = [];
      const match = line.match(/^row (\d+): (\[.*\])$/);
      if (!match) return [];
      let cells: unknown;
      try {
        cells = JSON.parse(match[2]!);
      } catch {
        idColumns = [];
        return [];
      }
      if (!Array.isArray(cells) || !cells.every((c) => typeof c === "string"))
        return [];
      if (match[1] === "1") {
        idColumns = cells.flatMap((cell, index) =>
          /(?:^id$|[_ ]id$)/i.test(cell.trim()) ? [index] : [],
        );
        return [];
      }
      return idColumns.flatMap((column) => {
        const identifier = cells[column];
        return typeof identifier === "string" &&
          /^[A-Za-z][A-Za-z0-9_]*-[A-Za-z0-9_.-]*\d[A-Za-z0-9_.-]*$/.test(
            identifier,
          )
          ? [
              {
                identifier,
                source: sourceIndex + 1,
                locator: `extracted line ${lineIndex + 1}`,
              },
            ]
          : [];
      });
    });
  });
}

export function stripPurposeSourceRecordReferences(
  text: string,
  references: readonly PurposeSourceRecordReference[],
): string {
  return references.reduce((value, reference) => {
    const escaped = reference.identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return value.replace(
      new RegExp(`(?<![\\w.-])${escaped}(?![\\w.-])`, "g"),
      "",
    );
  }, text);
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
      return `${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 3 })} ${type.unit}`;
  }
}

/** Only explicit lexical units are recognized here; bare numbers need adapter metadata. */
export function explicitPurposeNumber(
  raw: string,
): { value: number; type: PurposeNumberType; display: string } | undefined {
  let value: number;
  try {
    value = purposeSourceNumberValue(raw);
  } catch {
    return undefined;
  }
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
