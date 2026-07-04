/* eslint-disable @typescript-eslint/no-explicit-any */

import { createHash } from "node:crypto";

import { getRequiredContractEvidenceFamilies } from "./templates";
import type {
  SourceContractEvidenceFamily,
  SourceContractEvidenceMetricRow,
  SourceContractEvidencePackInput,
  SourceContractEvidencePersistencePayload,
  SourceContractEvidenceRowInput,
  SourceContractEvidenceStructuredRow,
} from "./types";

type ContractEvidenceDb = {
  from(table: string): any;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function evidenceRowHash(row: SourceContractEvidenceRowInput): string {
  return createHash("sha256")
    .update(stableJson({ family: row.family, payload: row.payload }))
    .digest("hex");
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
  }
  return null;
}

function asDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function periodStartFor(row: SourceContractEvidenceRowInput): string | null {
  const payload = row.payload;
  return (
    asDate(payload.month) ??
    asDate(payload.period) ??
    asDate(payload.date) ??
    null
  );
}

function amountFor(row: SourceContractEvidenceRowInput): number | null {
  const payload = row.payload;
  switch (row.family) {
    case "contract_baseline":
      return asNumber(payload.annual_run_rate_usd);
    case "invoice_summary":
      return asNumber(payload.invoiced_amount_usd);
    case "invoice_exception":
      return asNumber(payload.vendor_claim_usd);
    case "change_order":
      return asNumber(payload.amount_usd);
    default:
      return null;
  }
}

function subjectFor(row: SourceContractEvidenceRowInput): string | null {
  const payload = row.payload;
  return (
    asString(payload.contract_name) ??
    asString(payload.incumbent_vendor) ??
    asString(payload.service_level) ??
    asString(payload.tower) ??
    asString(payload.category) ??
    asString(payload.term_key) ??
    asString(payload.evidence_id) ??
    null
  );
}

function rowStatusFor(row: SourceContractEvidenceRowInput): SourceContractEvidenceStructuredRow["validation_status"] {
  if (Object.values(row.payload).every((value) => value === null || value === "")) {
    return "rejected";
  }
  return "accepted";
}

function toStructuredRows(
  input: SourceContractEvidencePackInput,
): SourceContractEvidenceStructuredRow[] {
  return input.rows.map((row) => ({
    tenant_key: input.tenantKey,
    source_event_id: input.sourceEventId,
    source_artifact_id: input.sourceArtifactId ?? null,
    archetype_key: input.archetypeKey,
    evidence_family: row.family,
    source_sheet: row.sourceSheet ?? row.family,
    source_row_number: row.sourceRowNumber ?? null,
    row_hash: evidenceRowHash(row),
    row_payload: row.payload,
    normalized_subject: subjectFor(row),
    period_start: periodStartFor(row),
    period_end: null,
    amount_usd: amountFor(row),
    confidence: input.sourceType === "synthetic_demo" ? 0.7 : 0.85,
    validation_status: rowStatusFor(row),
  }));
}

function metric(
  input: SourceContractEvidencePackInput,
  key: string,
  label: string,
  value: number,
  unit: string,
  family: SourceContractEvidenceFamily,
  basis: Record<string, unknown>,
): SourceContractEvidenceMetricRow {
  return {
    tenant_key: input.tenantKey,
    source_event_id: input.sourceEventId,
    archetype_key: input.archetypeKey,
    metric_key: key,
    metric_label: label,
    metric_value: Number(value.toFixed(4)),
    unit,
    evidence_family: family,
    basis,
    confidence: input.sourceType === "synthetic_demo" ? 0.7 : 0.85,
    validation_status: "accepted",
  };
}

function deriveMetrics(
  input: SourceContractEvidencePackInput,
): SourceContractEvidenceMetricRow[] {
  const metrics: SourceContractEvidenceMetricRow[] = [];

  const invoiceVariance = input.rows
    .filter((row) => row.family === "invoice_summary")
    .reduce((total, row) => {
      const invoiced = asNumber(row.payload.invoiced_amount_usd) ?? 0;
      const contracted = asNumber(row.payload.contracted_amount_usd) ?? 0;
      return total + (invoiced - contracted);
    }, 0);
  if (invoiceVariance !== 0) {
    metrics.push(
      metric(
        input,
        "invoice_variance_usd",
        "Invoice variance",
        invoiceVariance,
        "USD",
        "invoice_summary",
        { rowCount: input.rows.filter((row) => row.family === "invoice_summary").length },
      ),
    );
  }

  const exceptionExposure = input.rows
    .filter((row) => row.family === "invoice_exception")
    .reduce((total, row) => {
      const claim = asNumber(row.payload.vendor_claim_usd) ?? 0;
      const supported = asNumber(row.payload.supported_amount_usd) ?? 0;
      return total + Math.max(0, claim - supported);
    }, 0);
  if (exceptionExposure > 0) {
    metrics.push(
      metric(
        input,
        "invoice_exception_exposure_usd",
        "Invoice exception exposure",
        exceptionExposure,
        "USD",
        "invoice_exception",
        { calculation: "sum(max(vendor_claim_usd - supported_amount_usd, 0))" },
      ),
    );
  }

  const slaMisses = input.rows.filter((row) => {
    if (row.family !== "sla_performance") return false;
    const target = asNumber(row.payload.target_pct);
    const actual = asNumber(row.payload.actual_pct);
    return target !== null && actual !== null && actual < target;
  }).length;
  if (slaMisses > 0) {
    metrics.push(
      metric(input, "sla_miss_count", "SLA misses", slaMisses, "count", "sla_performance", {
        calculation: "count(actual_pct < target_pct)",
      }),
    );
  }

  const staffingGap = input.rows
    .filter((row) => row.family === "staffing_model")
    .reduce((total, row) => {
      const committed = asNumber(row.payload.committed_fte) ?? 0;
      const observed = asNumber(row.payload.observed_fte) ?? 0;
      return total + Math.max(0, committed - observed);
    }, 0);
  if (staffingGap > 0) {
    metrics.push(
      metric(input, "staffing_gap_fte", "Staffing gap", staffingGap, "FTE", "staffing_model", {
        calculation: "sum(max(committed_fte - observed_fte, 0))",
      }),
    );
  }

  const recurringChangeOrderExposure = input.rows
    .filter((row) => row.family === "change_order" && asBoolean(row.payload.recurring) === true)
    .reduce((total, row) => total + (asNumber(row.payload.amount_usd) ?? 0), 0);
  if (recurringChangeOrderExposure > 0) {
    metrics.push(
      metric(
        input,
        "recurring_change_order_exposure_usd",
        "Recurring change-order exposure",
        recurringChangeOrderExposure,
        "USD",
        "change_order",
        { calculation: "sum(amount_usd where recurring=true)" },
      ),
    );
  }

  const ticketOverBaseline = input.rows
    .filter((row) => row.family === "ticket_volume")
    .reduce((total, row) => {
      const baseline = asNumber(row.payload.baseline_tickets) ?? 0;
      const actual = asNumber(row.payload.actual_tickets) ?? 0;
      return total + Math.max(0, actual - baseline);
    }, 0);
  if (ticketOverBaseline > 0) {
    metrics.push(
      metric(
        input,
        "ticket_volume_above_baseline",
        "Ticket volume above baseline",
        ticketOverBaseline,
        "tickets",
        "ticket_volume",
        { calculation: "sum(max(actual_tickets - baseline_tickets, 0))" },
      ),
    );
  }

  return metrics;
}

export function buildContractEvidencePersistencePayload(
  input: SourceContractEvidencePackInput,
): SourceContractEvidencePersistencePayload {
  const requiredFamilies = getRequiredContractEvidenceFamilies(input.archetypeKey);
  const coveredFamilies = new Set(input.rows.map((row) => row.family));
  const missingRequiredFamilies = requiredFamilies.filter(
    (family) => !coveredFamilies.has(family),
  );
  const rows = toStructuredRows(input);
  const rejectedCount = rows.filter((row) => row.validation_status === "rejected").length;
  const validationStatus =
    missingRequiredFamilies.length > 0 || rejectedCount > 0 ? "partial" : "accepted";

  return {
    manifest: {
      tenant_key: input.tenantKey,
      source_event_id: input.sourceEventId,
      source_artifact_id: input.sourceArtifactId ?? null,
      archetype_key: input.archetypeKey,
      evidence_pack_name: input.evidencePackName,
      upload_batch_id: input.uploadBatchId,
      source_type: input.sourceType,
      validation_status: validationStatus,
      row_count: rows.length,
      required_family_count: requiredFamilies.length,
      covered_required_family_count: requiredFamilies.length - missingRequiredFamilies.length,
      missing_required_families: missingRequiredFamilies,
      warnings: [
        ...(input.sourceType === "synthetic_demo"
          ? ["Synthetic demo evidence; do not treat as client-approved truth."]
          : []),
        ...(rejectedCount > 0 ? [`${rejectedCount} blank or invalid row(s) rejected.`] : []),
      ],
      metadata: {
        ...(input.metadata ?? {}),
        persistenceBoundary:
          "Structured sourcing-critical extracts only; raw files stay in source_artifacts/blob or client systems.",
      },
    },
    rows,
    metrics: deriveMetrics(input),
  };
}

export async function persistContractEvidencePack(
  input: SourceContractEvidencePackInput,
  db: ContractEvidenceDb,
): Promise<
  SourceContractEvidencePersistencePayload & { manifestId: string }
> {
  const payload = buildContractEvidencePersistencePayload(input);
  const manifestWrite = (await db
    .from("source_contract_evidence_manifests")
    .upsert(payload.manifest, {
      onConflict: "tenant_key,source_event_id,upload_batch_id",
      ignoreDuplicates: false,
    })
    .select("id")
    .single()) as { data: { id?: string } | null; error: { message: string } | null };

  if (manifestWrite.error) throw new Error(manifestWrite.error.message);
  const manifestId = manifestWrite.data?.id;
  if (!manifestId) {
    throw new Error("Contract evidence manifest write did not return an id.");
  }

  const [rowDelete, metricDelete] = await Promise.all([
    db
      .from("source_contract_evidence_rows")
      .delete()
      .eq("manifest_id", manifestId),
    db
      .from("source_contract_evidence_metrics")
      .delete()
      .eq("manifest_id", manifestId),
  ]);
  if (rowDelete.error) throw new Error(rowDelete.error.message);
  if (metricDelete.error) throw new Error(metricDelete.error.message);

  if (payload.rows.length > 0) {
    const rowInsert = await db.from("source_contract_evidence_rows").insert(
      payload.rows.map((row) => ({
        manifest_id: manifestId,
        ...row,
      })),
    );
    if (rowInsert.error) throw new Error(rowInsert.error.message);
  }

  if (payload.metrics.length > 0) {
    const metricInsert = await db
      .from("source_contract_evidence_metrics")
      .insert(
        payload.metrics.map((metric) => ({
          manifest_id: manifestId,
          ...metric,
        })),
      );
    if (metricInsert.error) throw new Error(metricInsert.error.message);
  }

  return { ...payload, manifestId };
}
