import type {
  NormalizedRequirementResponse,
  NormalizedVendorResponsePackage,
} from "./vendor-response-matrix";

export type ResponseCoverageEvidenceClass =
  | "production"
  | "synthetic"
  | "test";

export type ResponseCoverageStatus =
  | "answered"
  | "partial"
  | "missing"
  | "not_comparable";

export interface ResponseCoverageFact {
  vendorId: string;
  requirementId: string;
  status: Exclude<ResponseCoverageStatus, "missing">;
  evidenceClass: ResponseCoverageEvidenceClass;
  source: "artifact_response" | "event_fact";
}

export interface SourceResponseCoverageReadModelInput {
  requiredFields: readonly string[];
  criticalRequiredFields?: readonly string[];
  packages?: readonly NormalizedVendorResponsePackage[];
  facts?: readonly ResponseCoverageFact[];
}

export interface SourceResponseCoverageVendorReadModel {
  vendorId: string;
  vendorName: string;
  evidenceClass: ResponseCoverageEvidenceClass;
  status: ResponseCoverageStatus;
  answered: string[];
  missing: string[];
  notComparable: string[];
}

export interface SourceResponseCoverageClaimGuard {
  permitted: boolean;
  reason: string;
}

export interface SourceResponseCoverageEvidenceGroup {
  evidenceClass: ResponseCoverageEvidenceClass;
  vendorCount: number;
  answeredCount: number;
  missingCount: number;
  notComparableCount: number;
  vendors: SourceResponseCoverageVendorReadModel[];
  claims: {
    completeness: SourceResponseCoverageClaimGuard;
    ranking: SourceResponseCoverageClaimGuard;
  };
}

export interface SourceResponseCoverageReadModel {
  requiredFields: string[];
  criticalRequiredFields: string[];
  production: SourceResponseCoverageEvidenceGroup;
  synthetic: SourceResponseCoverageEvidenceGroup;
  test: SourceResponseCoverageEvidenceGroup;
}

type FieldStatusMap = Map<string, ResponseCoverageStatus>;

function normalizeId(value: string): string {
  return value.trim();
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set([...values].map(normalizeId).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function rowStatus(row: NormalizedRequirementResponse): ResponseCoverageStatus {
  if (
    row.responseDisposition === "Not Applicable" ||
    row.responseDisposition === "Exception"
  ) {
    return "not_comparable";
  }
  if (row.responseDisposition === "Partially Comply") {
    return "partial";
  }
  if (row.responseNarrative?.trim() || (row.evidenceRefs?.length ?? 0) > 0) {
    return "answered";
  }
  return "missing";
}

function mergeStatus(
  current: ResponseCoverageStatus | undefined,
  next: ResponseCoverageStatus,
): ResponseCoverageStatus {
  if (!current) return next;
  if (current === "answered" || next === "answered") return "answered";
  if (current === "partial" || next === "partial") return "partial";
  if (current === "not_comparable" || next === "not_comparable") {
    return "not_comparable";
  }
  return "missing";
}

function packageEvidenceClass(
  responsePackage: NormalizedVendorResponsePackage,
): ResponseCoverageEvidenceClass {
  return responsePackage.syntheticDemo ? "synthetic" : "production";
}

function buildPackageVendor(
  responsePackage: NormalizedVendorResponsePackage,
  requiredFields: readonly string[],
): SourceResponseCoverageVendorReadModel {
  const statuses: FieldStatusMap = new Map();
  for (const row of responsePackage.rows) {
    const requirementId = normalizeId(row.requirementId);
    if (!requirementId) continue;
    statuses.set(
      requirementId,
      mergeStatus(statuses.get(requirementId), rowStatus(row)),
    );
  }
  return buildVendorFromStatuses({
    vendorId: responsePackage.vendorId,
    vendorName: responsePackage.vendorName,
    evidenceClass: packageEvidenceClass(responsePackage),
    requiredFields,
    statuses,
  });
}

function buildVendorFromStatuses(input: {
  vendorId: string;
  vendorName: string;
  evidenceClass: ResponseCoverageEvidenceClass;
  requiredFields: readonly string[];
  statuses: FieldStatusMap;
}): SourceResponseCoverageVendorReadModel {
  const answered: string[] = [];
  const missing: string[] = [];
  const notComparable: string[] = [];

  for (const field of input.requiredFields) {
    const status = input.statuses.get(field) ?? "missing";
    if (status === "answered" || status === "partial") {
      answered.push(field);
    } else if (status === "not_comparable") {
      notComparable.push(field);
    } else {
      missing.push(field);
    }
  }

  let status: ResponseCoverageStatus = "answered";
  if (missing.length > 0) status = "missing";
  else if (notComparable.length > 0) status = "not_comparable";
  else if (
    input.requiredFields.some((field) => input.statuses.get(field) === "partial")
  ) {
    status = "partial";
  }

  return {
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    evidenceClass: input.evidenceClass,
    status,
    answered,
    missing,
    notComparable,
  };
}

function factStatus(status: ResponseCoverageFact["status"]): ResponseCoverageStatus {
  return status === "partial" ? "partial" : status;
}

function mergeFactVendors(
  vendors: SourceResponseCoverageVendorReadModel[],
  facts: readonly ResponseCoverageFact[],
  requiredFields: readonly string[],
): SourceResponseCoverageVendorReadModel[] {
  const byKey = new Map(
    vendors.map((vendor) => [
      `${vendor.evidenceClass}:${vendor.vendorId}`,
      vendor,
    ]),
  );
  const statusMaps = new Map<string, FieldStatusMap>();

  for (const vendor of vendors) {
    const statuses: FieldStatusMap = new Map();
    for (const field of vendor.answered) statuses.set(field, "answered");
    for (const field of vendor.notComparable) {
      statuses.set(field, "not_comparable");
    }
    statusMaps.set(`${vendor.evidenceClass}:${vendor.vendorId}`, statuses);
  }

  for (const fact of facts) {
    const vendorId = normalizeId(fact.vendorId);
    const requirementId = normalizeId(fact.requirementId);
    if (!vendorId || !requirementId) continue;
    const key = `${fact.evidenceClass}:${vendorId}`;
    const statuses = statusMaps.get(key) ?? new Map<string, ResponseCoverageStatus>();
    statuses.set(
      requirementId,
      mergeStatus(statuses.get(requirementId), factStatus(fact.status)),
    );
    statusMaps.set(key, statuses);
    if (!byKey.has(key)) {
      byKey.set(key, {
        vendorId,
        vendorName: vendorId,
        evidenceClass: fact.evidenceClass,
        status: "missing",
        answered: [],
        missing: [],
        notComparable: [],
      });
    }
  }

  return [...byKey.values()].map((vendor) =>
    buildVendorFromStatuses({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      evidenceClass: vendor.evidenceClass,
      requiredFields,
      statuses:
        statusMaps.get(`${vendor.evidenceClass}:${vendor.vendorId}`) ??
        new Map(),
    }),
  );
}

function claimGuard(input: {
  evidenceClass: ResponseCoverageEvidenceClass;
  vendors: readonly SourceResponseCoverageVendorReadModel[];
  criticalRequiredFields: readonly string[];
  claim: "completeness" | "ranking";
}): SourceResponseCoverageClaimGuard {
  if (input.evidenceClass !== "production") {
    return {
      permitted: false,
      reason: `Cannot claim ${input.claim}: ${input.evidenceClass} responses are separated from production evidence.`,
    };
  }

  const absentCritical =
    input.vendors.length === 0
      ? uniqueSorted(input.criticalRequiredFields)
      : uniqueSorted(
          input.vendors.flatMap((vendor) =>
            vendor.missing.filter((field) =>
              input.criticalRequiredFields.includes(field),
            ),
          ),
        );
  if (absentCritical.length > 0) {
    return {
      permitted: false,
      reason: `Cannot claim ${input.claim}: critical required fields are absent (${absentCritical.join(", ")}).`,
    };
  }

  if (input.claim === "ranking") {
    const notComparableCritical = uniqueSorted(
      input.vendors.flatMap((vendor) =>
        vendor.notComparable.filter((field) =>
          input.criticalRequiredFields.includes(field),
        ),
      ),
    );
    if (notComparableCritical.length > 0) {
      return {
        permitted: false,
        reason: `Cannot claim ranking: critical required fields are not comparable (${notComparableCritical.join(", ")}).`,
      };
    }
  }

  return {
    permitted: true,
    reason: `${input.claim} claim is permitted for production response coverage.`,
  };
}

function buildGroup(input: {
  evidenceClass: ResponseCoverageEvidenceClass;
  vendors: readonly SourceResponseCoverageVendorReadModel[];
  criticalRequiredFields: readonly string[];
}): SourceResponseCoverageEvidenceGroup {
  const vendors = [...input.vendors].sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName),
  );
  return {
    evidenceClass: input.evidenceClass,
    vendorCount: vendors.length,
    answeredCount: vendors.reduce(
      (sum, vendor) => sum + vendor.answered.length,
      0,
    ),
    missingCount: vendors.reduce((sum, vendor) => sum + vendor.missing.length, 0),
    notComparableCount: vendors.reduce(
      (sum, vendor) => sum + vendor.notComparable.length,
      0,
    ),
    vendors,
    claims: {
      completeness: claimGuard({
        evidenceClass: input.evidenceClass,
        vendors,
        criticalRequiredFields: input.criticalRequiredFields,
        claim: "completeness",
      }),
      ranking: claimGuard({
        evidenceClass: input.evidenceClass,
        vendors,
        criticalRequiredFields: input.criticalRequiredFields,
        claim: "ranking",
      }),
    },
  };
}

export function buildSourceResponseCoverageReadModel(
  input: SourceResponseCoverageReadModelInput,
): SourceResponseCoverageReadModel {
  const requiredFields = uniqueSorted(input.requiredFields);
  const criticalRequiredFields = uniqueSorted(input.criticalRequiredFields ?? []);
  const packageVendors = (input.packages ?? []).map((responsePackage) =>
    buildPackageVendor(responsePackage, requiredFields),
  );
  const vendors = mergeFactVendors(
    packageVendors,
    input.facts ?? [],
    requiredFields,
  );

  const vendorsByClass = (evidenceClass: ResponseCoverageEvidenceClass) =>
    vendors.filter((vendor) => vendor.evidenceClass === evidenceClass);

  return {
    requiredFields,
    criticalRequiredFields,
    production: buildGroup({
      evidenceClass: "production",
      vendors: vendorsByClass("production"),
      criticalRequiredFields,
    }),
    synthetic: buildGroup({
      evidenceClass: "synthetic",
      vendors: vendorsByClass("synthetic"),
      criticalRequiredFields,
    }),
    test: buildGroup({
      evidenceClass: "test",
      vendors: vendorsByClass("test"),
      criticalRequiredFields,
    }),
  };
}
