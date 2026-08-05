/**
 * Node/server-side reader for the global Moves pricing reference extension.
 *
 * This bridges checked-in CSV reference assets to the pure selector in
 * `moves-rate-selection.ts`. It intentionally does not load a database,
 * call a route, or activate runtime Moves pricing.
 */
import fs from "node:fs";
import path from "node:path";
import {
  internalReferenceRateToCandidate,
  providerReferenceRateToCandidate,
  selectMovesRate,
  type MaterializedInternalRateRow,
  type MaterializedProviderRateRow,
  type MovesRateCandidate,
  type MovesRateSelectionRequest,
  type MovesRateSelectionResult,
  type PricingRateSelectionPolicy,
} from "./moves-rate-selection";

type RawRow = Record<string, string>;

export interface MovesPricingReferencePack {
  materializedProviderRates: RawRow[];
  materializedInternalRates: RawRow[];
  rateSelectionPolicies: PricingRateSelectionPolicy[];
}

const FILES = {
  materializedProviderRates: "pricing_materialized_provider_rates.csv",
  materializedInternalRates: "pricing_materialized_internal_rates.csv",
  rateSelectionPolicies: "pricing_rate_selection_policies.csv",
} as const;

function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value !== ""));
}

function readCsvFile(filePath: string): RawRow[] {
  const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));
  if (parsed.length === 0) return [];
  const [headers, ...rows] = parsed;
  return rows.map((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(`${filePath}: row ${index + 2} has ${row.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, i) => [header, row[i] ?? ""]));
  });
}

function parseBoolean(value: string, fileName: string, rowLabel: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${fileName}: ${rowLabel} has invalid boolean value "${value}"`);
}

function toRateSourceKind(value: string): PricingRateSelectionPolicy["rateSourceKind"] {
  if (
    value === "deal_override" ||
    value === "tenant_contracted_rate" ||
    value === "tenant_internal_rate" ||
    value === "industry_overlay" ||
    value === "global_reference"
  ) {
    return value;
  }
  throw new Error(`pricing_rate_selection_policies.csv: invalid rate_source_kind "${value}"`);
}

function policyRowsToPolicies(rows: RawRow[]): PricingRateSelectionPolicy[] {
  return rows.map((row) => ({
    rateSourceKind: toRateSourceKind(row.rate_source_kind),
    precedenceRank: Number.parseInt(row.precedence_rank, 10),
    selectedRateSourceLabel: row.selected_rate_source_label,
    allowUnapproved: parseBoolean(row.allow_unapproved, FILES.rateSelectionPolicies, row.policy_code),
    eligibleForCommittedSolutionPrice: parseBoolean(
      row.eligible_for_committed_solution_price,
      FILES.rateSelectionPolicies,
      row.policy_code,
    ),
  }));
}

export function defaultMovesPricingReferencePackDir(): string {
  return path.resolve(__dirname, "..", "..", "..", "..", "datasets", "reference", "pricing-engine-v1");
}

export function readMovesPricingReferencePackDir(
  dir: string = defaultMovesPricingReferencePackDir(),
): MovesPricingReferencePack {
  const providerRows = readCsvFile(path.join(dir, FILES.materializedProviderRates));
  const internalRows = readCsvFile(path.join(dir, FILES.materializedInternalRates));
  const policyRows = readCsvFile(path.join(dir, FILES.rateSelectionPolicies));
  return {
    materializedProviderRates: providerRows,
    materializedInternalRates: internalRows,
    rateSelectionPolicies: policyRowsToPolicies(policyRows),
  };
}

function candidateForRequest(
  request: MovesRateSelectionRequest,
  pack: MovesPricingReferencePack,
): MovesRateCandidate[] {
  const candidates: MovesRateCandidate[] = [];
  if (request.commercialModel === "partner_market_bill_rate") {
    for (const row of pack.materializedProviderRates) {
      if (row.role_code !== request.roleCode) continue;
      if (row.level_code !== request.levelCode) continue;
      if (row.location_code !== request.locationCode) continue;
      if (request.providerClassCode && row.provider_class_code !== request.providerClassCode) continue;
      candidates.push(providerReferenceRateToCandidate(row as unknown as MaterializedProviderRateRow));
    }
    return candidates;
  }

  if (
    request.commercialModel === "internal_loaded_cost" ||
    request.commercialModel === "internal_scarcity_adjusted_cost"
  ) {
    for (const row of pack.materializedInternalRates) {
      if (row.role_code !== request.roleCode) continue;
      if (row.level_code !== request.levelCode) continue;
      if (row.location_code !== request.locationCode) continue;
      candidates.push(internalReferenceRateToCandidate(row as unknown as MaterializedInternalRateRow, request.commercialModel));
    }
    return candidates;
  }

  return candidates;
}

export function selectMovesRateFromReferencePack(
  request: MovesRateSelectionRequest,
  pack: MovesPricingReferencePack,
): MovesRateSelectionResult {
  return selectMovesRate(request, candidateForRequest(request, pack), pack.rateSelectionPolicies);
}

export interface MovesRoleMixRateRequest {
  roleCode: string;
  levelCode: string;
}

export function selectMovesRatesForRoleMixFromReferencePack(
  roleMix: readonly MovesRoleMixRateRequest[],
  requestDefaults: Omit<MovesRateSelectionRequest, "roleCode" | "levelCode">,
  pack: MovesPricingReferencePack,
): Map<string, MovesRateSelectionResult> {
  const results = new Map<string, MovesRateSelectionResult>();
  for (const role of roleMix) {
    const request: MovesRateSelectionRequest = {
      ...requestDefaults,
      roleCode: role.roleCode,
      levelCode: role.levelCode,
      commercialModel: requestDefaults.commercialModel,
    };
    results.set(`${role.roleCode}:${role.levelCode}`, selectMovesRateFromReferencePack(request, pack));
  }
  return results;
}
