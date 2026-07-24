/**
 * Nexus Pricing Engine — PR3 governed-load semantic validation.
 *
 * Pure functions: given already schema-parsed rows (see `csv-parse.ts`) plus
 * a snapshot of the reference taxonomy the caller fetched (see
 * `reference-lookup.ts` for the real DB-backed snapshot builder), decide
 * which rows are semantically valid. No I/O here — tests can hand-build a
 * tiny `RateCardReferenceSnapshot` fixture directly.
 *
 * Two rules enforced here, per the PR3 execution prompt:
 *   1. `role_or_band_ref` must resolve to a real `pricing_roles.role_code`
 *      OR `pricing_rate_bands.rate_band_code` row; `level` (if present) must
 *      resolve to a real `pricing_seniority_levels.level_code` row.
 *   2. No duplicate rows per PR2's rate-card-line idempotency key
 *      (`rateCardLineIdentityKey`) within the same upload — the SECOND and
 *      later occurrence of a key is flagged, the first occurrence is kept.
 */
import { clientProfileAssumptionKey, rateCardLineIdentityKey } from "./identity-keys";
import type {
  ClientPricingProfileCsvRow,
  ClientRateCardCsvRow,
  ClientRoleAliasCsvRow,
  ClientTechnologyCostCsvRow,
  RowError,
} from "./types";

export interface RateCardReferenceSnapshot {
  taxonomyVersion: number;
  roleCodes: ReadonlySet<string>;
  rateBandCodes: ReadonlySet<string>;
  levelCodes: ReadonlySet<string>;
}

export interface SemanticValidationResult<T> {
  validRows: T[];
  errors: RowError[];
}

export function validateRateCardRowsAgainstReference(
  rows: readonly ClientRateCardCsvRow[],
  refs: RateCardReferenceSnapshot,
): SemanticValidationResult<ClientRateCardCsvRow> {
  const errors: RowError[] = [];
  const seenKeys = new Map<string, number>(); // identityKey -> first rowNumber

  const semanticallyValid: ClientRateCardCsvRow[] = [];

  for (const row of rows) {
    let ok = true;

    const resolvesToRoleOrBand =
      refs.roleCodes.has(row.roleOrBandRef) || refs.rateBandCodes.has(row.roleOrBandRef);
    if (!resolvesToRoleOrBand) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "role_or_band_ref",
        code: "unresolved_role_or_band_ref",
        message: `"${row.roleOrBandRef}" does not match any pricing_roles.role_code or pricing_rate_bands.rate_band_code in taxonomy version ${refs.taxonomyVersion}`,
      });
      ok = false;
    }

    if (row.level && !refs.levelCodes.has(row.level)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "level",
        code: "unresolved_level",
        message: `"${row.level}" does not match any pricing_seniority_levels.level_code in taxonomy version ${refs.taxonomyVersion}`,
      });
      ok = false;
    }

    if (!ok) continue;

    const key = rateCardLineIdentityKey(row);
    const firstRowNumber = seenKeys.get(key);
    if (firstRowNumber !== undefined) {
      errors.push({
        rowNumber: row.rowNumber,
        code: "duplicate_row",
        message: `Duplicate rate-card line (same role_or_band_ref/level/provider_ref/location_ref/rate_basis/unit/valid_from as row ${firstRowNumber})`,
      });
      continue;
    }
    seenKeys.set(key, row.rowNumber);
    semanticallyValid.push(row);
  }

  return { validRows: semanticallyValid, errors };
}

// ---------------------------------------------------------------------------
// Client pricing profile — schema-only semantics: no duplicate assumption_key
// within the same upload (mirrors the (tenant_key, profile_version,
// assumption_key) idempotency key — tenant/version are constant per upload).
// ---------------------------------------------------------------------------

export function validateClientProfileRowsWithinUpload(
  rows: readonly ClientPricingProfileCsvRow[],
): SemanticValidationResult<ClientPricingProfileCsvRow> {
  const errors: RowError[] = [];
  const seenKeys = new Map<string, number>();
  const validRows: ClientPricingProfileCsvRow[] = [];

  for (const row of rows) {
    const key = clientProfileAssumptionKey(row.assumptionKey);
    const firstRowNumber = seenKeys.get(key);
    if (firstRowNumber !== undefined) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "assumption_key",
        code: "duplicate_row",
        message: `Duplicate assumption_key "${row.assumptionKey}" (first seen at row ${firstRowNumber})`,
      });
      continue;
    }
    seenKeys.set(key, row.rowNumber);
    validRows.push(row);
  }

  return { validRows, errors };
}

// ---------------------------------------------------------------------------
// Client role aliases — role_code must resolve; no duplicate normalized
// alias within the upload (mirrors (tenant_key, normalized_alias,
// provider_scope), provider_scope always null for a client CSV upload).
// ---------------------------------------------------------------------------

export function validateRoleAliasRowsAgainstReference(
  rows: readonly ClientRoleAliasCsvRow[],
  refs: Pick<RateCardReferenceSnapshot, "roleCodes" | "taxonomyVersion">,
): SemanticValidationResult<ClientRoleAliasCsvRow> {
  const errors: RowError[] = [];
  const seenKeys = new Map<string, number>();
  const validRows: ClientRoleAliasCsvRow[] = [];

  for (const row of rows) {
    if (!refs.roleCodes.has(row.roleCode)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "role_code",
        code: "unresolved_role_code",
        message: `"${row.roleCode}" does not match any pricing_roles.role_code in taxonomy version ${refs.taxonomyVersion}`,
      });
      continue;
    }
    const normalized = row.aliasLabel.trim().toLowerCase();
    const firstRowNumber = seenKeys.get(normalized);
    if (firstRowNumber !== undefined) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "alias_label",
        code: "duplicate_row",
        message: `Duplicate alias_label "${row.aliasLabel}" (first seen at row ${firstRowNumber})`,
      });
      continue;
    }
    seenKeys.set(normalized, row.rowNumber);
    validRows.push(row);
  }

  return { validRows, errors };
}

// ---------------------------------------------------------------------------
// Client technology costs — no duplicate cost_key within the upload.
// ---------------------------------------------------------------------------

export function validateTechnologyCostRowsWithinUpload(
  rows: readonly ClientTechnologyCostCsvRow[],
): SemanticValidationResult<ClientTechnologyCostCsvRow> {
  const errors: RowError[] = [];
  const seenKeys = new Map<string, number>();
  const validRows: ClientTechnologyCostCsvRow[] = [];

  for (const row of rows) {
    const firstRowNumber = seenKeys.get(row.costKey);
    if (firstRowNumber !== undefined) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "cost_key",
        code: "duplicate_row",
        message: `Duplicate cost_key "${row.costKey}" (first seen at row ${firstRowNumber})`,
      });
      continue;
    }
    seenKeys.set(row.costKey, row.rowNumber);
    validRows.push(row);
  }

  return { validRows, errors };
}
