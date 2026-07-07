/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  SourceContractEvidenceFamily,
  SourceContractEvidenceMetricRow,
} from "./types";

type ReadDb = {
  from(table: string): any;
};

export interface ContractEvidenceManifestSummary {
  id: string;
  evidencePackName: string;
  sourceType: string;
  validationStatus: string;
  rowCount: number;
  requiredFamilyCount: number;
  coveredRequiredFamilyCount: number;
  missingFamilies: SourceContractEvidenceFamily[];
  warnings: string[];
  sourceArtifactId: string | null;
  createdAt: string | null;
}

export interface ContractEvidenceFamilySummary {
  family: SourceContractEvidenceFamily;
  label: string;
  rowCount: number;
  acceptedRows: number;
  status: "loaded" | "partial" | "missing";
}

export interface ContractEvidenceMetricSummary {
  key: string;
  label: string;
  value: number;
  unit: string;
  family: SourceContractEvidenceFamily;
  confidence: number;
}

export interface ContractEvidenceFindingSummary {
  key: string;
  label: string;
  evidenceFamily: SourceContractEvidenceFamily;
  evidence: string;
  implication: string;
}

export interface ContractEvidenceRuntimeSummary {
  eventId: string;
  tenantKey: string;
  manifests: ContractEvidenceManifestSummary[];
  families: ContractEvidenceFamilySummary[];
  metrics: ContractEvidenceMetricSummary[];
  findings: ContractEvidenceFindingSummary[];
  missingFamilies: SourceContractEvidenceFamily[];
  warnings: string[];
  userFacingSummary: string;
}

type ManifestRow = {
  id?: string;
  evidence_pack_name?: string;
  source_type?: string;
  validation_status?: string;
  row_count?: number;
  required_family_count?: number;
  covered_required_family_count?: number;
  missing_required_families?: SourceContractEvidenceFamily[];
  warnings?: string[];
  source_artifact_id?: string | null;
  created_at?: string | null;
};

type EvidenceRow = {
  evidence_family?: SourceContractEvidenceFamily;
  validation_status?: string;
};

type MetricRow = Partial<SourceContractEvidenceMetricRow> & {
  metric_key?: string;
  metric_label?: string;
  metric_value?: number;
  evidence_family?: SourceContractEvidenceFamily;
};

export const CONTRACT_EVIDENCE_FAMILY_LABELS: Record<
  SourceContractEvidenceFamily,
  string
> = {
  contract_baseline: "Contract baseline",
  invoice_summary: "Invoice baseline",
  invoice_exception: "Invoice exceptions",
  sla_performance: "SLA performance",
  ticket_volume: "Ticket volume",
  staffing_model: "Staffing model",
  change_order: "Change-order history",
  renewal_terms: "Renewal terms",
  evidence_reference: "Evidence references",
};

const FAMILY_ORDER: SourceContractEvidenceFamily[] = [
  "contract_baseline",
  "invoice_summary",
  "invoice_exception",
  "sla_performance",
  "ticket_volume",
  "staffing_model",
  "change_order",
  "renewal_terms",
  "evidence_reference",
];

export async function loadContractEvidenceRuntimeSummary(args: {
  db: ReadDb;
  tenantKey: string;
  sourceEventId: string;
}): Promise<ContractEvidenceRuntimeSummary> {
  try {
    const [manifestResult, rowResult, metricResult] = await Promise.all([
      args.db
        .from("source_contract_evidence_manifests")
        .select(
          "id,evidence_pack_name,source_type,validation_status,row_count,required_family_count,covered_required_family_count,missing_required_families,warnings,source_artifact_id,created_at",
        )
        .eq("tenant_key", args.tenantKey)
        .eq("source_event_id", args.sourceEventId)
        .order("created_at", { ascending: false })
        .limit(20),
      args.db
        .from("source_contract_evidence_rows")
        .select("evidence_family,validation_status")
        .eq("tenant_key", args.tenantKey)
        .eq("source_event_id", args.sourceEventId)
        .limit(1000),
      args.db
        .from("source_contract_evidence_metrics")
        .select(
          "metric_key,metric_label,metric_value,unit,evidence_family,confidence,validation_status,basis",
        )
        .eq("tenant_key", args.tenantKey)
        .eq("source_event_id", args.sourceEventId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (manifestResult.error || rowResult.error || metricResult.error) {
      return emptyContractEvidenceSummary(args);
    }

    return buildContractEvidenceRuntimeSummary({
      sourceEventId: args.sourceEventId,
      tenantKey: args.tenantKey,
      manifests: ((manifestResult.data ?? []) as ManifestRow[]).map(
        toManifestSummary,
      ),
      rows: (rowResult.data ?? []) as EvidenceRow[],
      metrics: ((metricResult.data ?? []) as MetricRow[]).map(toMetricSummary),
    });
  } catch {
    return emptyContractEvidenceSummary(args);
  }
}

export function buildContractEvidenceRuntimeSummary(args: {
  sourceEventId: string;
  tenantKey: string;
  manifests: ContractEvidenceManifestSummary[];
  rows: EvidenceRow[];
  metrics: ContractEvidenceMetricSummary[];
}): ContractEvidenceRuntimeSummary {
  const rowCounts = new Map<SourceContractEvidenceFamily, number>();
  const acceptedCounts = new Map<SourceContractEvidenceFamily, number>();
  for (const row of args.rows) {
    const family = row.evidence_family;
    if (!family) continue;
    rowCounts.set(family, (rowCounts.get(family) ?? 0) + 1);
    if (row.validation_status === "accepted") {
      acceptedCounts.set(family, (acceptedCounts.get(family) ?? 0) + 1);
    }
  }
  const manifestMissing = new Set(
    args.manifests.flatMap((manifest) => manifest.missingFamilies),
  );
  const families = FAMILY_ORDER.filter(
    (family) => rowCounts.has(family) || manifestMissing.has(family),
  ).map((family) => {
    const rowCount = rowCounts.get(family) ?? 0;
    const acceptedRows = acceptedCounts.get(family) ?? 0;
    const status: ContractEvidenceFamilySummary["status"] =
      rowCount === 0 ? "missing" : acceptedRows === rowCount ? "loaded" : "partial";
    return {
      family,
      label: CONTRACT_EVIDENCE_FAMILY_LABELS[family],
      rowCount,
      acceptedRows,
      status,
    };
  });
  const findings = deriveFindings(args.metrics);
  const missingFamilies = [...manifestMissing];
  const warnings = [
    ...new Set(args.manifests.flatMap((manifest) => manifest.warnings)),
  ];

  return {
    eventId: args.sourceEventId,
    tenantKey: args.tenantKey,
    manifests: args.manifests,
    families,
    metrics: args.metrics,
    findings,
    missingFamilies,
    warnings,
    userFacingSummary:
      args.manifests.length === 0
        ? "No structured Source evidence has been loaded for this event yet."
        : `${args.manifests.length} structured evidence pack${args.manifests.length === 1 ? "" : "s"} loaded with ${args.rows.length} evidence record${args.rows.length === 1 ? "" : "s"} and ${args.metrics.length} calculated metric${args.metrics.length === 1 ? "" : "s"}.`,
  };
}

function toManifestSummary(row: ManifestRow): ContractEvidenceManifestSummary {
  return {
    id: row.id ?? "",
    evidencePackName: row.evidence_pack_name ?? "Structured evidence pack",
    sourceType: row.source_type ?? "client_uploaded",
    validationStatus: row.validation_status ?? "partial",
    rowCount: Number(row.row_count ?? 0),
    requiredFamilyCount: Number(row.required_family_count ?? 0),
    coveredRequiredFamilyCount: Number(row.covered_required_family_count ?? 0),
    missingFamilies: row.missing_required_families ?? [],
    warnings: row.warnings ?? [],
    sourceArtifactId: row.source_artifact_id ?? null,
    createdAt: row.created_at ?? null,
  };
}

function toMetricSummary(row: MetricRow): ContractEvidenceMetricSummary {
  return {
    key: row.metric_key ?? "metric",
    label: row.metric_label ?? "Metric",
    value: Number(row.metric_value ?? 0),
    unit: row.unit ?? "count",
    family: row.evidence_family ?? "evidence_reference",
    confidence: Number(row.confidence ?? 0.8),
  };
}

function deriveFindings(
  metrics: ContractEvidenceMetricSummary[],
): ContractEvidenceFindingSummary[] {
  return metrics
    .filter((metric) => metric.value > 0)
    .map((metric) => {
      if (metric.key === "invoice_exception_exposure_usd") {
        return {
          key: "invoice_leakage",
          label: "Invoice leakage",
          evidenceFamily: metric.family,
          evidence: `${metric.label}: ${formatMetricValue(metric)}.`,
          implication:
            "This supports a recovery or cure discussion before renewal or renegotiation.",
        };
      }
      if (metric.key === "staffing_gap_fte") {
        return {
          key: "staffing_variance",
          label: "Staffing variance",
          evidenceFamily: metric.family,
          evidence: `${metric.label}: ${formatMetricValue(metric)}.`,
          implication:
            "This supports staffing true-up language and service coverage reconciliation.",
        };
      }
      if (metric.key === "sla_miss_count") {
        return {
          key: "sla_weakness",
          label: "SLA weakness",
          evidenceFamily: metric.family,
          evidence: `${metric.label}: ${formatMetricValue(metric)}.`,
          implication:
            "This supports stronger service-credit economics and chronic-miss remedies.",
        };
      }
      if (metric.key === "recurring_change_order_exposure_usd") {
        return {
          key: "change_order_leakage",
          label: "Change-order leakage",
          evidenceFamily: metric.family,
          evidence: `${metric.label}: ${formatMetricValue(metric)}.`,
          implication:
            "This supports catalog normalization instead of letting recurring run work remain change-order spend.",
        };
      }
      return {
        key: metric.key,
        label: metric.label,
        evidenceFamily: metric.family,
        evidence: `${metric.label}: ${formatMetricValue(metric)}.`,
        implication:
          "This metric is available for sourcing analytics and advisory artifacts.",
      };
    });
}

export function formatMetricValue(metric: ContractEvidenceMetricSummary): string {
  if (metric.unit === "USD") {
    return `$${Math.round(metric.value).toLocaleString("en-US")}`;
  }
  if (metric.unit === "FTE") {
    return `${metric.value.toLocaleString("en-US")} FTE`;
  }
  return `${metric.value.toLocaleString("en-US")} ${metric.unit}`;
}

function emptyContractEvidenceSummary(args: {
  sourceEventId: string;
  tenantKey: string;
}): ContractEvidenceRuntimeSummary {
  return {
    eventId: args.sourceEventId,
    tenantKey: args.tenantKey,
    manifests: [],
    families: [],
    metrics: [],
    findings: [],
    missingFamilies: [],
    warnings: [],
    userFacingSummary:
      "No structured Source evidence has been loaded for this event yet.",
  };
}
