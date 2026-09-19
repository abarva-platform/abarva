export type PricingComparabilityDimension =
  | "amount"
  | "currency"
  | "unit"
  | "period"
  | "quantity"
  | "scenario";

export type PricingComparabilityValueKind = "raw" | "normalized";

export interface PricingComparabilityValue {
  amount: number | null;
  currency?: string | null;
  unit?: string | null;
  period?: string | null;
  quantity?: number | null;
  scenario?: string | null;
  method?: string | null;
}

export interface PricingComparabilityRecord {
  recordId: string;
  vendorId: string;
  vendorName: string;
  lineItemId?: string | null;
  raw: PricingComparabilityValue;
  normalized?: PricingComparabilityValue | null;
}

export interface PricingComparabilityBlocker {
  recordId: string;
  vendorId: string;
  vendorName: string;
  lineItemId: string | null;
  valueKind: PricingComparabilityValueKind;
  dimension: PricingComparabilityDimension;
  reason: "missing_required_dimension" | "normalized_basis_mismatch";
  detail: string;
}

export interface PricingComparabilityRecordResult
  extends PricingComparabilityRecord {
  status: "comparable" | "blocked";
  blockers: PricingComparabilityBlocker[];
}

export interface PricingComparabilityResult {
  claimId: string;
  status: "comparable" | "blocked";
  comparisonAllowed: boolean;
  tcoClaimsAllowed: boolean;
  records: PricingComparabilityRecordResult[];
  blockers: PricingComparabilityBlocker[];
}

export interface EvaluatePricingComparabilityInput {
  claimId: string;
  records: PricingComparabilityRecord[];
}

const REQUIRED_DIMENSIONS: PricingComparabilityDimension[] = [
  "amount",
  "currency",
  "unit",
  "period",
  "quantity",
  "scenario",
];

const BASIS_DIMENSIONS: Exclude<PricingComparabilityDimension, "amount">[] = [
  "currency",
  "unit",
  "period",
  "quantity",
  "scenario",
];

export function evaluatePricingComparability(
  input: EvaluatePricingComparabilityInput,
): PricingComparabilityResult {
  const blockerByRecord = new Map<string, PricingComparabilityBlocker[]>();
  const blockers: PricingComparabilityBlocker[] = [];

  for (const record of input.records) {
    addRequiredDimensionBlockers(blockers, record, "raw", record.raw);
    addRequiredDimensionBlockers(
      blockers,
      record,
      "normalized",
      record.normalized ?? null,
    );
  }

  blockers.push(...findNormalizedBasisMismatches(input.records));

  for (const blocker of blockers) {
    const current = blockerByRecord.get(blocker.recordId) ?? [];
    current.push(blocker);
    blockerByRecord.set(blocker.recordId, current);
  }

  const records: PricingComparabilityRecordResult[] = input.records.map((record) => {
    const recordBlockers = blockerByRecord.get(record.recordId) ?? [];
    return {
      ...record,
      normalized: record.normalized ?? null,
      status: recordBlockers.length > 0 ? "blocked" : "comparable",
      blockers: recordBlockers,
    };
  });

  const status = blockers.length > 0 ? "blocked" : "comparable";
  return {
    claimId: input.claimId,
    status,
    comparisonAllowed: status === "comparable",
    tcoClaimsAllowed: status === "comparable",
    records,
    blockers,
  };
}

function addRequiredDimensionBlockers(
  blockers: PricingComparabilityBlocker[],
  record: PricingComparabilityRecord,
  valueKind: PricingComparabilityValueKind,
  value: PricingComparabilityValue | null,
): void {
  for (const dimension of REQUIRED_DIMENSIONS) {
    if (hasDimension(value, dimension)) continue;
    blockers.push({
      recordId: record.recordId,
      vendorId: record.vendorId,
      vendorName: record.vendorName,
      lineItemId: record.lineItemId ?? null,
      valueKind,
      dimension,
      reason: "missing_required_dimension",
      detail: `${record.vendorName} ${record.lineItemId ?? record.recordId} is missing ${valueKind} ${dimension}.`,
    });
  }
}

function findNormalizedBasisMismatches(
  records: PricingComparabilityRecord[],
): PricingComparabilityBlocker[] {
  const blockers: PricingComparabilityBlocker[] = [];
  for (const dimension of BASIS_DIMENSIONS) {
    const buckets = new Map<string, PricingComparabilityRecord[]>();
    for (const record of records) {
      const normalized = record.normalized ?? null;
      if (!hasDimension(normalized, dimension)) continue;
      const groupKey = basisGroupKey(record, dimension);
      const current = buckets.get(groupKey) ?? [];
      current.push(record);
      buckets.set(groupKey, current);
    }

    for (const bucketRecords of buckets.values()) {
      const first = bucketRecords[0];
      if (!first?.normalized) continue;
      const expected = dimensionValue(first.normalized, dimension);
      for (const record of bucketRecords.slice(1)) {
        const actual = dimensionValue(record.normalized, dimension);
        if (actual === expected) continue;
        blockers.push({
          recordId: record.recordId,
          vendorId: record.vendorId,
          vendorName: record.vendorName,
          lineItemId: record.lineItemId ?? null,
          valueKind: "normalized",
          dimension,
          reason: "normalized_basis_mismatch",
          detail: `${record.vendorName} ${record.lineItemId ?? record.recordId} has normalized ${dimension} ${String(actual)}; expected ${String(expected)}.`,
        });
      }
    }
  }
  return blockers;
}

function basisGroupKey(
  record: PricingComparabilityRecord,
  dimension: Exclude<PricingComparabilityDimension, "amount">,
): string {
  if (dimension === "unit" || dimension === "quantity") {
    return record.lineItemId ?? record.recordId;
  }
  return "all-records";
}

function hasDimension(
  value: PricingComparabilityValue | null,
  dimension: PricingComparabilityDimension,
): boolean {
  if (!value) return false;
  const actual = dimensionValue(value, dimension);
  if (typeof actual === "number") return Number.isFinite(actual) && actual > 0;
  return typeof actual === "string" && actual.trim().length > 0;
}

function dimensionValue(
  value: PricingComparabilityValue | null | undefined,
  dimension: PricingComparabilityDimension,
): string | number | null | undefined {
  if (!value) return null;
  return value[dimension];
}
