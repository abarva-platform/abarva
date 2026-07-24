/**
 * Nexus Pricing Engine — PR3 governed-load CSV parsing.
 *
 * Pure, dependency-light (papaparse only — the same dependency
 * `reference-pack-loader.ts` already uses) schema-level parsing for the four
 * client upload templates in
 * `datasets/templates/pricing-engine-v1/`. Deliberately does NOT reject the
 * whole file on the first bad row — every row is checked independently and
 * every problem is collected, matching the reasonable UX pattern the PR3
 * brief asks for (the expert-kernel `rate-card-row-parser.ts` precedent,
 * not imported here per the PR0/PR3 "own independent pipeline" boundary).
 *
 * No database access happens in this file. Semantic validation (does
 * `role_or_band_ref` resolve to a real taxonomy row?) is a separate,
 * downstream step — see `semantic-validation.ts` — so this module stays
 * fully unit-testable against synthetic CSV strings with zero mocking.
 */
import Papa from "papaparse";
import type {
  ClientPricingProfileCsvRow,
  ClientRateCardCsvRow,
  ClientRoleAliasCsvRow,
  ClientTechnologyCostCsvRow,
  ParseResult,
  RowError,
} from "./types";

type RawRow = Record<string, string>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRawCsv(csvText: string): { data: RawRow[]; errors: RowError[] } {
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const errors: RowError[] = parsed.errors.map((e) => ({
    rowNumber: typeof e.row === "number" ? e.row + 1 : 0,
    code: "csv_parse_error",
    message: e.message,
  }));
  return { data: parsed.data, errors };
}

function trimOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function requireField(
  row: RawRow,
  field: string,
  rowNumber: number,
  errors: RowError[],
): string | null {
  const value = row[field]?.trim();
  if (!value) {
    errors.push({
      rowNumber,
      field,
      code: "required_field_missing",
      message: `${field} is required`,
    });
    return null;
  }
  return value;
}

function parseNumberField(
  row: RawRow,
  field: string,
  rowNumber: number,
  errors: RowError[],
): number | null {
  const raw = requireField(row, field, rowNumber, errors);
  if (raw === null) return null;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0) {
    errors.push({
      rowNumber,
      field,
      code: "invalid_number",
      message: `${field} must be a non-negative number, got "${raw}"`,
    });
    return null;
  }
  return value;
}

function parseDateField(
  row: RawRow,
  field: string,
  rowNumber: number,
  errors: RowError[],
  required: boolean,
): string | null {
  const raw = row[field]?.trim();
  if (!raw) {
    if (required) {
      errors.push({
        rowNumber,
        field,
        code: "required_field_missing",
        message: `${field} is required`,
      });
    }
    return null;
  }
  if (!DATE_RE.test(raw)) {
    errors.push({
      rowNumber,
      field,
      code: "invalid_date",
      message: `${field} must be YYYY-MM-DD, got "${raw}"`,
    });
    return null;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// client_rate_card.template.csv
// ---------------------------------------------------------------------------

export function parseClientRateCardCsv(
  csvText: string,
): ParseResult<ClientRateCardCsvRow> {
  const { data, errors: csvErrors } = parseRawCsv(csvText);
  const errors: RowError[] = [...csvErrors];
  const rows: ClientRateCardCsvRow[] = [];

  data.forEach((raw, index) => {
    const rowNumber = index + 1;
    const rowErrors: RowError[] = [];

    const roleOrBandRef = requireField(raw, "role_or_band_ref", rowNumber, rowErrors);
    const rateBasis = requireField(raw, "rate_basis", rowNumber, rowErrors);
    const unit = requireField(raw, "unit", rowNumber, rowErrors);
    const rateValue = parseNumberField(raw, "rate_value", rowNumber, rowErrors);
    const validFrom = parseDateField(raw, "valid_from", rowNumber, rowErrors, true);
    const validTo = parseDateField(raw, "valid_to", rowNumber, rowErrors, false);

    errors.push(...rowErrors);
    if (rowErrors.length > 0) return;

    rows.push({
      rowNumber,
      roleOrBandRef: roleOrBandRef!,
      level: trimOrNull(raw.level),
      providerRef: trimOrNull(raw.provider_ref),
      locationRef: trimOrNull(raw.location_ref),
      rateBasis: rateBasis!,
      unit: unit!,
      rateValue: rateValue!,
      currency: trimOrNull(raw.currency) ?? "USD",
      validFrom: validFrom!,
      validTo,
    });
  });

  return { rows, errors };
}

// ---------------------------------------------------------------------------
// client_pricing_profile.template.csv
// ---------------------------------------------------------------------------

function coerceAssumptionValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return trimmed;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export function parseClientPricingProfileCsv(
  csvText: string,
): ParseResult<ClientPricingProfileCsvRow> {
  const { data, errors: csvErrors } = parseRawCsv(csvText);
  const errors: RowError[] = [...csvErrors];
  const rows: ClientPricingProfileCsvRow[] = [];

  data.forEach((raw, index) => {
    const rowNumber = index + 1;
    const rowErrors: RowError[] = [];

    const assumptionKey = requireField(raw, "assumption_key", rowNumber, rowErrors);
    const rawValue = requireField(raw, "assumption_value", rowNumber, rowErrors);

    errors.push(...rowErrors);
    if (rowErrors.length > 0) return;

    rows.push({
      rowNumber,
      assumptionKey: assumptionKey!,
      assumptionValue: coerceAssumptionValue(rawValue!),
      unitHint: trimOrNull(raw.unit_hint),
      notes: trimOrNull(raw.notes),
    });
  });

  return { rows, errors };
}

// ---------------------------------------------------------------------------
// client_role_aliases.template.csv (optional)
// ---------------------------------------------------------------------------

export function parseClientRoleAliasesCsv(
  csvText: string,
): ParseResult<ClientRoleAliasCsvRow> {
  const { data, errors: csvErrors } = parseRawCsv(csvText);
  const errors: RowError[] = [...csvErrors];
  const rows: ClientRoleAliasCsvRow[] = [];

  data.forEach((raw, index) => {
    const rowNumber = index + 1;
    const rowErrors: RowError[] = [];

    const aliasLabel = requireField(raw, "alias_label", rowNumber, rowErrors);
    const roleCode = requireField(raw, "role_code", rowNumber, rowErrors);

    errors.push(...rowErrors);
    if (rowErrors.length > 0) return;

    rows.push({
      rowNumber,
      aliasLabel: aliasLabel!,
      roleCode: roleCode!,
      aliasType: trimOrNull(raw.alias_type) ?? "client_naming",
      notes: trimOrNull(raw.notes),
    });
  });

  return { rows, errors };
}

// ---------------------------------------------------------------------------
// client_technology_costs.template.csv (optional)
// ---------------------------------------------------------------------------

export function parseClientTechnologyCostsCsv(
  csvText: string,
): ParseResult<ClientTechnologyCostCsvRow> {
  const { data, errors: csvErrors } = parseRawCsv(csvText);
  const errors: RowError[] = [...csvErrors];
  const rows: ClientTechnologyCostCsvRow[] = [];

  data.forEach((raw, index) => {
    const rowNumber = index + 1;
    const rowErrors: RowError[] = [];

    const costKey = requireField(raw, "cost_key", rowNumber, rowErrors);
    const costValue = parseNumberField(raw, "cost_value", rowNumber, rowErrors);
    const unit = requireField(raw, "unit", rowNumber, rowErrors);

    errors.push(...rowErrors);
    if (rowErrors.length > 0) return;

    rows.push({
      rowNumber,
      costKey: costKey!,
      costValue: costValue!,
      unit: unit!,
      notes: trimOrNull(raw.notes),
    });
  });

  return { rows, errors };
}
