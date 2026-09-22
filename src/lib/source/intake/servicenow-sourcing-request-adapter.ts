import { resolveArchetypeForEvent } from "../archetypes/event-archetype-resolver";
import { classifySourcingEvent } from "../classifier/category-classifier";
import type { TenantContextSegment } from "../taxonomy/category-taxonomy";
import type {
  CanonicalSourceIntakeRequest,
  SourceRequestBusinessDomain,
} from "./servicenow-sourcing-request-contract";

export type ServiceNowSourcingRequestRow = {
  sys_id: string;
  number: string;
  opened_at: string;
  updated_at: string;
  state: string;
  requested_by_user_id: string;
  requested_by_display_name: string;
  requested_for_org: string;
  business_domain: string;
  business_function: string;
  cost_center: string;
  assignment_group: string;
  short_description: string;
  description: string;
  business_justification: string;
  sourcing_trigger: string;
  requested_outcome: string;
  needed_by: string;
  target_decision_date: string;
  contract_end_date: string;
  estimated_annual_value: string;
  currency: string;
  value_confidence: string;
  incumbent_supplier_name: string;
  existing_contract_reference: string;
  scope_in: string;
  scope_out: string;
  geography: string;
  service_criticality: string;
  regulated_data_flags: string;
  data_system_owner: string;
  budget_status: string;
  decision_owner: string;
  baseline_owner: string;
  security_review_needed: string;
  legal_review_needed: string;
  attachment_references: string;
  estimated_value_low: string;
  estimated_value_high: string;
  value_time_basis: string;
  incumbent_context: string;
  service_volume_summary: string;
  source_system_references: string;
  evidence_references: string;
  source_table: string;
  extract_timestamp: string;
  extract_version: string;
};

const DOMAINS = new Set<SourceRequestBusinessDomain>([
  "plan",
  "delivery",
  "enterprise",
  "it",
]);

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function required(value: string | null | undefined, label: string): string {
  const normalized = clean(value);
  if (!normalized) throw new Error(`ServiceNow ${label} is required`);
  return normalized;
}

function iso(value: string | null | undefined, label: string): string | null {
  const normalized = clean(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`ServiceNow ${label} must be a valid date`);
  }
  return parsed.toISOString();
}

function dateOnly(value: string | null | undefined): string | null {
  const normalized = clean(value);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`ServiceNow date '${normalized}' must use YYYY-MM-DD`);
  }
  return normalized;
}

function booleanOrNull(value: string | null | undefined): boolean | null {
  const normalized = clean(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "true" || normalized === "yes" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "no" || normalized === "0") {
    return false;
  }
  throw new Error(`ServiceNow boolean '${value}' is invalid`);
}

function list(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nonNegativeMoney(
  value: string | null | undefined,
  label: string,
): number | null {
  const normalized = clean(value);
  if (!normalized) return null;
  const amount = Number(normalized.replace(/[$,]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`ServiceNow ${label} must be a non-negative number`);
  }
  return amount;
}

function valueRange(
  row: ServiceNowSourcingRequestRow,
): { low: number; high: number } | null {
  const low = nonNegativeMoney(row.estimated_value_low, "estimated_value_low");
  const high = nonNegativeMoney(row.estimated_value_high, "estimated_value_high");
  if (low === null && high === null) return null;
  if (low === null || high === null || low > high) {
    throw new Error(
      "ServiceNow estimated value range requires low <= high with both bounds recorded",
    );
  }
  return { low, high };
}

function evidenceReferences(value: string | null | undefined) {
  return list(value).map((reference) => {
    const [attachmentId, evidenceType, sourceBasis, ...extra] = reference.split(":");
    if (
      !attachmentId ||
      !evidenceType ||
      extra.length > 0 ||
      !["source_extract", "source_report", "planning_document"].includes(
        sourceBasis,
      )
    ) {
      throw new Error(
        `ServiceNow evidence reference '${reference}' must use attachment:type:source_basis`,
      );
    }
    return {
      attachmentId,
      evidenceType,
      sourceBasis: sourceBasis as
        | "source_extract"
        | "source_report"
        | "planning_document",
    };
  });
}

function domain(value: string): SourceRequestBusinessDomain {
  const normalized = value.trim().toLowerCase() as SourceRequestBusinessDomain;
  if (!DOMAINS.has(normalized)) {
    throw new Error(`ServiceNow business_domain '${value}' is unsupported`);
  }
  return normalized;
}

function money(row: ServiceNowSourcingRequestRow): CanonicalSourceIntakeRequest["value"] {
  const raw = clean(row.estimated_annual_value);
  if (!raw) return null;
  const amount = nonNegativeMoney(raw, "estimated_annual_value");
  if (amount === null) return null;
  const range = valueRange(row);
  if (range && (amount < range.low || amount > range.high)) {
    throw new Error(
      "ServiceNow estimated_annual_value must fall within the requester value range",
    );
  }
  return {
    amount,
    currency: required(row.currency, "currency").toUpperCase(),
    basis: clean(row.value_confidence) ?? "requester_stated_unvalidated",
    validated: false,
    range,
    timeBasis: clean(row.value_time_basis),
  };
}

export function adaptServiceNowSourcingRequest(input: {
  tenantKey: string;
  sourceRow: number;
  row: ServiceNowSourcingRequestRow;
  loadedSegments: readonly TenantContextSegment[];
}): CanonicalSourceIntakeRequest {
  const tenantKey = required(input.tenantKey, "tenant identity");
  const sourceTable = required(input.row.source_table, "source_table");
  const recordId = required(input.row.sys_id, "sys_id");
  const requestNumber = required(input.row.number, "number");
  const title = required(input.row.short_description, "short_description");
  const description = required(input.row.description, "description");
  const extractedAt = required(
    iso(input.row.extract_timestamp, "extract_timestamp"),
    "extract_timestamp",
  );
  const sourceVersion = required(input.row.extract_version, "extract_version");
  if (!Number.isInteger(input.sourceRow) || input.sourceRow < 2) {
    throw new Error("ServiceNow source row must identify a CSV data row");
  }

  const classification = classifySourcingEvent(
    {
      name: title,
      description: [
        description,
        input.row.business_justification,
        input.row.sourcing_trigger,
        input.row.requested_outcome,
        input.row.scope_in,
        input.row.scope_out,
      ]
        .filter(Boolean)
        .join(" "),
    },
    { loadedSegments: input.loadedSegments },
  );
  const resolution = resolveArchetypeForEvent({
    categoryId: classification.categoryId,
  });
  const trigger = clean(input.row.sourcing_trigger);
  const decisionOwner = clean(input.row.decision_owner);
  const scopeIn = clean(input.row.scope_in);
  const baselineOwner = clean(input.row.baseline_owner);
  const value = money(input.row);
  const requiredFactGaps: Array<
    CanonicalSourceIntakeRequest["requiredFactGaps"][number]
  > = [];
  if (!trigger) requiredFactGaps.push("trigger");
  if (!decisionOwner) requiredFactGaps.push("decision_owner");
  if (!scopeIn) requiredFactGaps.push("scope_boundary");
  if (!value && !clean(input.row.requested_outcome)) {
    requiredFactGaps.push("value_target");
  }
  if (!baselineOwner) requiredFactGaps.push("baseline_owner");

  return {
    tenantKey,
    requestId: `servicenow:${sourceTable}:${recordId}`,
    lifecycle: "imported_request",
    source: {
      system: "servicenow",
      table: sourceTable,
      recordId,
      requestNumber,
      row: input.sourceRow,
      extractedAt,
      version: sourceVersion,
    },
    rawSource: { ...input.row },
    sourceStatus: clean(input.row.state) ?? "unknown",
    openedAt: iso(input.row.opened_at, "opened_at"),
    updatedAt: iso(input.row.updated_at, "updated_at"),
    requestedBy: {
      userId: clean(input.row.requested_by_user_id),
      displayName: clean(input.row.requested_by_display_name),
    },
    organization: {
      requestedFor: clean(input.row.requested_for_org),
      businessDomain: domain(required(input.row.business_domain, "business_domain")),
      businessFunction: clean(input.row.business_function),
      costCenter: clean(input.row.cost_center),
      assignmentGroup: clean(input.row.assignment_group),
    },
    title,
    description,
    businessJustification: clean(input.row.business_justification),
    trigger,
    requestedOutcome: clean(input.row.requested_outcome),
    timing: {
      neededBy: dateOnly(input.row.needed_by),
      targetDecisionDate: dateOnly(input.row.target_decision_date),
      contractEndDate: dateOnly(input.row.contract_end_date),
    },
    value,
    incumbent: {
      supplierName: clean(input.row.incumbent_supplier_name),
      contractReference: clean(input.row.existing_contract_reference),
      context: clean(input.row.incumbent_context),
    },
    scope: {
      included: scopeIn,
      excluded: clean(input.row.scope_out),
      geography: clean(input.row.geography),
      serviceCriticality: clean(input.row.service_criticality),
    },
    governance: {
      regulatedDataFlags: list(input.row.regulated_data_flags),
      dataSystemOwner: clean(input.row.data_system_owner),
      budgetStatus: clean(input.row.budget_status),
      decisionOwner,
      baselineOwner,
      securityReviewNeeded: booleanOrNull(input.row.security_review_needed),
      legalReviewNeeded: booleanOrNull(input.row.legal_review_needed),
    },
    attachments: list(input.row.attachment_references),
    serviceVolumes: (input.row.service_volume_summary ?? "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean),
    sourceSystemReferences: list(input.row.source_system_references),
    evidenceReferences: evidenceReferences(input.row.evidence_references),
    requiredFactGaps,
    loadedSegments: [...input.loadedSegments],
    mappingProposal: {
      categoryId: classification.categoryId,
      buyingMotion: classification.buyingMotion,
      archetypeId: resolution.archetypeId,
      confidence: classification.confidence,
      reasons: classification.matchReasons,
      alternatives: [],
      evidenceGaps: classification.evidenceGaps,
      classifierVersion: classification.classifierVersion,
      proposalVersion: "servicenow-request-mapping/v1",
    },
    mappingDecision: null,
    eventLink: null,
  };
}

export function adaptServiceNowSourcingRequestExtract(input: {
  tenantKey: string;
  rows: readonly {
    sourceRow: number;
    row: ServiceNowSourcingRequestRow;
  }[];
  loadedSegments: readonly TenantContextSegment[];
}): CanonicalSourceIntakeRequest[] {
  const byVersion = new Map<string, CanonicalSourceIntakeRequest>();
  for (const item of input.rows) {
    const request = adaptServiceNowSourcingRequest({
      tenantKey: input.tenantKey,
      sourceRow: item.sourceRow,
      row: item.row,
      loadedSegments: input.loadedSegments,
    });
    const key = `${request.requestId}:${request.source.version}`;
    const prior = byVersion.get(key);
    if (!prior) {
      byVersion.set(key, request);
      continue;
    }
    if (JSON.stringify(prior.rawSource) !== JSON.stringify(request.rawSource)) {
      throw new Error(
        `Conflicting ServiceNow rows share request/version identity '${key}'`,
      );
    }
  }
  return [...byVersion.values()].sort(
    (left, right) =>
      left.requestId.localeCompare(right.requestId) ||
      left.source.version.localeCompare(right.source.version),
  );
}
