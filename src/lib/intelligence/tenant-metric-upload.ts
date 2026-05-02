import {
  normalizeTenantMetricTenantKey,
  type MetricDirection,
  type TenantMetricMeasurementStatus,
  type TenantMetricObservation,
} from "./tenant-metric-fixtures";
import { getMetricRecordById, type MetricRecord } from "./metric-records";

export interface ParsedTenantMetricUpload {
  tenantKey: string;
  accepted: readonly TenantMetricObservation[];
  rejected: readonly TenantMetricUploadRejection[];
}

export interface TenantMetricUploadRejection {
  rowNumber: number;
  reason: string;
  row: Record<string, string>;
}

const REQUIRED_HEADERS = [
  "metric_id",
  "current_value",
  "unit",
  "as_of",
  "source_detail",
  "owner_role",
] as const;

export function parseTenantMetricCsv(
  text: string,
  tenantKey: string,
): ParsedTenantMetricUpload {
  const normalizedTenant = normalizeTenantMetricTenantKey(tenantKey);
  const rows = parseCsv(text);
  if (rows.length === 0)
    return { tenantKey: normalizedTenant, accepted: [], rejected: [] };

  const headers = rows[0].map((header) => normalizeHeader(header));
  const missing = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missing.length > 0) {
    throw new Error(
      `Tenant metric upload missing required headers: ${missing.join(", ")}`,
    );
  }

  const accepted: TenantMetricObservation[] = [];
  const rejected: TenantMetricUploadRejection[] = [];

  for (const [index, values] of rows.slice(1).entries()) {
    if (values.every((value) => value.trim() === "")) continue;
    const rowNumber = index + 2;
    const row = Object.fromEntries(
      headers.map((header, valueIndex) => [header, values[valueIndex] ?? ""]),
    );
    const metricId = row.metric_id as MetricRecord["id"];
    const metric = getMetricRecordById(metricId);
    if (!metric) {
      rejected.push({
        rowNumber,
        reason: `Unknown metric_id ${metricId}`,
        row,
      });
      continue;
    }

    const status = normalizeMeasurementStatus(
      row.measurement_status || "measured",
    );
    const currentValue =
      row.current_value.trim() === "" ? null : Number(row.current_value);
    if (currentValue !== null && Number.isNaN(currentValue)) {
      rejected.push({
        rowNumber,
        reason: `current_value is not numeric: ${row.current_value}`,
        row,
      });
      continue;
    }
    if (status === "measured" && currentValue === null) {
      rejected.push({
        rowNumber,
        reason: "measured rows require current_value",
        row,
      });
      continue;
    }

    accepted.push({
      id: `upload-${normalizedTenant}-${rowNumber}-${metricId.toLowerCase()}`,
      tenantKey: normalizedTenant,
      clientId: normalizedTenant,
      metricId,
      metricName: row.metric_name || metric.name,
      industry: metric.industries[0],
      currentValue,
      unit: row.unit,
      asOf: row.as_of,
      source: "setup_upload",
      sourceDetail: row.source_detail,
      measurementStatus: status,
      direction: normalizeDirection(row.direction, metric),
      confidence: normalizeConfidence(row.confidence),
      ownerRole: row.owner_role,
      notes: row.notes || "Uploaded through Setup metric ingestion.",
      programIds: row.program_id ? [row.program_id] : undefined,
      sourceEventIds: row.source_event_id ? [row.source_event_id] : undefined,
    });
  }

  return { tenantKey: normalizedTenant, accepted, rejected };
}

export function looksLikeTenantMetricUpload(
  fileName: string,
  documentName: string,
): boolean {
  const label = `${fileName} ${documentName}`.toLowerCase();
  return /metric|kpi|benchmark|baseline|current-state|current state/.test(
    label,
  );
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeMeasurementStatus(
  value: string,
): TenantMetricMeasurementStatus {
  const normalized = normalizeHeader(value);
  if (normalized === "measurement_gap" || normalized === "gap")
    return "measurement_gap";
  if (normalized === "stale") return "stale";
  return "measured";
}

function normalizeDirection(
  value: string | undefined,
  metric: MetricRecord,
): MetricDirection {
  const normalized = normalizeHeader(value ?? "");
  if (normalized === "lower_is_better" || normalized === "lower")
    return "lower_is_better";
  if (normalized === "higher_is_better" || normalized === "higher")
    return "higher_is_better";
  const name = metric.name.toLowerCase();
  return /abandonment|cycle|days|time|denial|false positive|false decline|defect|exception|variance|aging|downtime|shrink|leakage|burden|cost/.test(
    name,
  )
    ? "lower_is_better"
    : "higher_is_better";
}

function normalizeConfidence(value: string | undefined): number {
  if (!value) return 0.7;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0.7;
  if (numeric > 1) return Math.max(0, Math.min(1, numeric / 100));
  return Math.max(0, Math.min(1, numeric));
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }

  row.push(current.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}
