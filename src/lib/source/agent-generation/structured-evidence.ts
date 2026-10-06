import type {
  SourceContractEvidenceFamily,
} from "@/lib/source/contract-evidence/types";
import type { SourceGenerationContext } from "./types";

function clean(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

export function formatStructuredEvidenceOverview(
  ctx: SourceGenerationContext,
): string | null {
  const evidence = ctx.structuredContractEvidence;
  if (!evidence || evidence.summary.manifests.length === 0) return null;
  const lines = [
    "— GOVERNED STRUCTURED CONTRACT EVIDENCE —",
    evidence.summary.userFacingSummary,
    ...evidence.summary.families.map(
      (family) =>
        `- ${family.label}: ${family.acceptedRows}/${family.rowCount} accepted rows (${family.status})`,
    ),
  ];
  if (evidence.summary.metrics.length > 0) {
    lines.push("Calculated metrics:");
    lines.push(
      ...evidence.summary.metrics.map(
        (metric) =>
          `- ${metric.label}: ${metric.value} ${metric.unit} (${metric.family}; confidence ${metric.confidence})`,
      ),
    );
  }
  if (evidence.summary.warnings.length > 0) {
    lines.push(...evidence.summary.warnings.map((warning) => `- Warning: ${warning}`));
  }
  return lines.join("\n");
}

export function formatStructuredApplicationInventory(
  ctx: SourceGenerationContext,
): string | null {
  const rows = (ctx.structuredContractEvidence?.records ?? []).filter(
    (row) => row.family === "application_inventory",
  );
  if (rows.length === 0) return null;
  return [
    `Loaded event-scoped application inventory: ${rows.length} applications. Use these rows verbatim; do not invent or substitute applications.`,
    "| Application ID | Application/System | Business function | Criticality | Hosting / technology | Scope role | Monthly reports | Named users | Evidence |",
    "|---|---|---|---|---|---|---:|---:|---|",
    ...rows.map(({ payload }) =>
      [
        clean(payload.application_ref),
        clean(payload.application_name),
        clean(payload.business_function),
        clean(payload.criticality),
        clean(payload.hosting_model),
        clean(payload.scope_role),
        clean(payload.monthly_report_count),
        clean(payload.monthly_named_user_count),
        clean(payload.source_file_id),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    ),
  ].join("\n");
}

export function formatStructuredOperationalEvidence(
  ctx: SourceGenerationContext,
): string | null {
  const records = ctx.structuredContractEvidence?.records ?? [];
  const tickets = records.filter((row) => row.family === "ticket_volume");
  const slas = records.filter((row) => row.family === "sla_performance");
  if (tickets.length === 0 && slas.length === 0) return null;
  const lines = [
    "— EVENT-SCOPED ITSM AND SLA EVIDENCE —",
    "Use exact loaded periods and values. Ticket classes are heterogeneous; do not combine their resolution hours into one MTTR.",
  ];
  if (tickets.length > 0) {
    lines.push(
      `Ticket-volume rows: ${tickets.length}.`,
      "| Period | Class / severity | Tickets | SLA target hours | Average resolution hours | Backlog end | Evidence |",
      "|---|---|---:|---:|---:|---:|---|",
      ...tickets.map(({ payload }) =>
        `| ${clean(payload.month ?? payload.period_start)} | ${clean(payload.severity ?? payload.demand_unit)} | ${clean(payload.ticket_count ?? payload.actual_quantity)} | ${clean(payload.sla_target_hours)} | ${clean(payload.avg_resolution_hours)} | ${clean(payload.backlog_end_count)} | ${clean(payload.source_file_id)} |`,
      ),
    );
  }
  if (slas.length > 0) {
    lines.push(
      `SLA-performance rows: ${slas.length}.`,
      "| Period | Metric | Threshold | Actual | Direction | Breach state | Credit owed | Claimed | Evidence |",
      "|---|---|---:|---:|---|---|---:|---|---|",
      ...slas.map(({ payload }) =>
        `| ${clean(payload.period_start ?? payload.period)} | ${clean(payload.metric_name ?? payload.service_level)} | ${clean(payload.committed_threshold_pct ?? payload.target_pct)} | ${clean(payload.actual_result_pct ?? payload.actual_pct)} | ${clean(payload.threshold_direction)} | ${clean(payload.breach_state)} | ${clean(payload.credit_owed_usd)} | ${clean(payload.credit_claimed)} | ${clean(payload.source_file_id)} |`,
      ),
    );
  }
  return lines.join("\n");
}

export function countStructuredEvidenceRows(
  ctx: SourceGenerationContext,
  family: SourceContractEvidenceFamily,
): number {
  return (ctx.structuredContractEvidence?.records ?? []).filter(
    (row) => row.family === family,
  ).length;
}
