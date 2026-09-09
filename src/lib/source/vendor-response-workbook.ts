import "server-only";

import ExcelJS from "exceljs";

import { analyzeNormalizedResponseQuality } from "./analytics/normalized-response-quality";
import {
  SOURCE_REQUIREMENT_CATEGORIES,
  SOURCE_REQUIREMENT_LEVELS,
  SOURCE_RESPONSE_DISPOSITIONS,
  SOURCE_RESPONSE_TYPES,
  type NormalizedRequirementResponse,
  type NormalizedResponseQualityAnalytics,
  type SourceRequirementCategory,
  type SourceRequirementLevel,
  type SourceResponseDisposition,
  type SourceResponseType,
} from "./vendor-response-matrix";

const ITEM_SHEETS = ["Mandatory Items", "Optional Items"] as const;

const HEADERS = {
  requirementId: "requirement id",
  category: "requirement category",
  section: "rfp section",
  requirement: "requirement statement",
  requirementLevel: "requirement level",
  responseType: "response type",
  evaluationCriterionId: "evaluation criterion id",
  evidenceRequired: "evidence required",
  responseDisposition: "response disposition",
  responseNarrative: "response narrative",
  evidenceRefs: "evidence reference(s)",
  pricingRef: "pricing reference",
  slaRef: "sla / kpi reference",
  exceptionRef: "assumption / exception reference",
  vendorOwner: "vendor owner",
} as const;

export interface ParsedNormalizedVendorResponse {
  vendorId: string;
  vendorName: string;
  rows: NormalizedRequirementResponse[];
  analytics: NormalizedResponseQualityAnalytics;
  parserWarnings: string[];
}

export async function parseNormalizedVendorResponseWorkbook(args: {
  buffer: Buffer;
  vendorName?: string;
}): Promise<ParsedNormalizedVendorResponse | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(args.buffer as unknown as ArrayBuffer);

  const itemSheets = ITEM_SHEETS.map((name) => workbook.getWorksheet(name)).filter(
    (sheet): sheet is ExcelJS.Worksheet => Boolean(sheet),
  );
  if (itemSheets.length === 0) return null;

  const parserWarnings: string[] = [];
  const rows: NormalizedRequirementResponse[] = [];
  for (const sheet of itemSheets) {
    const headerMap = buildHeaderMap(sheet.getRow(1));
    const missingHeaders = Object.values(HEADERS).filter(
      (header) => !headerMap.has(header),
    );
    if (missingHeaders.length > 0) {
      parserWarnings.push(
        `${sheet.name}: normalized response columns missing: ${missingHeaders.join(", ")}.`,
      );
      continue;
    }

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const requirementId = readCell(row, headerMap, HEADERS.requirementId);
      if (!requirementId) continue;

      const category = enumValue(
        readCell(row, headerMap, HEADERS.category),
        SOURCE_REQUIREMENT_CATEGORIES,
      );
      const requirementLevel = enumValue(
        readCell(row, headerMap, HEADERS.requirementLevel),
        SOURCE_REQUIREMENT_LEVELS,
      );
      const responseType = enumValue(
        readCell(row, headerMap, HEADERS.responseType),
        SOURCE_RESPONSE_TYPES,
      );
      if (!category || !requirementLevel || !responseType) {
        parserWarnings.push(
          `${sheet.name}!${rowNumber}: issued requirement metadata is invalid; row ${requirementId} was not ingested.`,
        );
        continue;
      }

      const rawDisposition = readCell(
        row,
        headerMap,
        HEADERS.responseDisposition,
      );
      const responseDisposition = rawDisposition
        ? enumValue(rawDisposition, SOURCE_RESPONSE_DISPOSITIONS)
        : null;
      if (rawDisposition && !responseDisposition) {
        parserWarnings.push(
          `${sheet.name}!${rowNumber}: ${requirementId} uses invalid response disposition "${rawDisposition}".`,
        );
      }

      rows.push({
        requirementId,
        category: category as SourceRequirementCategory,
        section: readCell(row, headerMap, HEADERS.section),
        requirement: readCell(row, headerMap, HEADERS.requirement),
        requirementLevel: requirementLevel as SourceRequirementLevel,
        responseType: responseType as SourceResponseType,
        evidenceRequired: /^yes$/i.test(
          readCell(row, headerMap, HEADERS.evidenceRequired),
        ),
        evaluationCriterionId: optionalCell(
          row,
          headerMap,
          HEADERS.evaluationCriterionId,
        ),
        responseDisposition:
          (responseDisposition as SourceResponseDisposition | null) ?? null,
        responseNarrative: optionalCell(
          row,
          headerMap,
          HEADERS.responseNarrative,
        ),
        evidenceRefs: splitReferences(
          readCell(row, headerMap, HEADERS.evidenceRefs),
        ),
        pricingRef: optionalCell(row, headerMap, HEADERS.pricingRef),
        slaRef: optionalCell(row, headerMap, HEADERS.slaRef),
        exceptionRef: optionalCell(row, headerMap, HEADERS.exceptionRef),
        vendorOwner: optionalCell(row, headerMap, HEADERS.vendorOwner),
      });
    }
  }

  if (rows.length === 0) return null;
  const vendorName =
    args.vendorName?.trim() || readVendorName(workbook) || "Vendor not identified";
  return {
    vendorId: slug(vendorName),
    vendorName,
    rows,
    analytics: analyzeNormalizedResponseQuality(rows),
    parserWarnings,
  };
}

function buildHeaderMap(row: ExcelJS.Row): Map<string, number> {
  const map = new Map<string, number>();
  row.eachCell({ includeEmpty: false }, (cell, column) => {
    const header = cellText(cell.value).toLowerCase().replace(/\s+/g, " ").trim();
    if (header) map.set(header, column);
  });
  return map;
}

function readCell(row: ExcelJS.Row, map: Map<string, number>, header: string): string {
  const column = map.get(header);
  return column ? cellText(row.getCell(column).value).trim() : "";
}

function optionalCell(
  row: ExcelJS.Row,
  map: Map<string, number>,
  header: string,
): string | null {
  return readCell(row, map, header) || null;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
  if ("text" in value) return String(value.text ?? "");
  if ("richText" in value) {
    return value.richText.map((part) => part.text).join("");
  }
  return "";
}

function enumValue<T extends string>(value: string, values: readonly T[]): T | null {
  const normalized = value.trim().toLowerCase();
  return values.find((item) => item.toLowerCase() === normalized) ?? null;
}

function splitReferences(value: string): string[] {
  return value
    .split(/[;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readVendorName(workbook: ExcelJS.Workbook): string | null {
  for (const sheetName of ["Cover", "Submission Sign-off"]) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) continue;
    for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const label = cellText(row.getCell(1).value).trim().toLowerCase();
      if (label === "vendor name" || label === "vendor legal name") {
        const value = cellText(row.getCell(2).value).trim();
        if (value) return value;
      }
    }
  }
  return null;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "vendor-not-identified"
  );
}
