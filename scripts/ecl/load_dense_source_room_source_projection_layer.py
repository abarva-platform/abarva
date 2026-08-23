#!/usr/bin/env python3

"""Load dense source-room Source projections locally.

Local proof only. This runner composes source, context, commercial, and review
local loads, then materializes Source-facing projection rows in disposable
Postgres. It does not repoint a product route or write Azure.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import load_dense_source_room_commercial_layer as commercial_layer
import load_dense_source_room_context_layer as context_layer
import load_dense_source_room_review_layer as review_layer
import load_dense_source_room_source_layer as source_layer


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-source-projection-local-load-2026-08-23"
TENANT_KEY = "meridian-health"
ASSESSMENT_ID = "assessment-dense-source-room-20260823"
PROJECTION_VERSION = 1
DDL_FILES = [
    ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def source_paths(dense_out_dir: Path) -> dict[str, Path]:
    manifest = read_csv(dense_out_dir / "dense_source_room_manifest.csv")
    return {row["source_room_family"]: dense_out_dir / row["file_path"] for row in manifest}


def source_record_id(family: str, row: dict[str, str], index: int) -> str:
    return source_layer.stable_uuid("source_record", family, row.get("source_row_id") or index)


def object_id(object_type: str, object_key: str) -> str:
    return source_layer.stable_uuid("object", object_type, object_key)


def contract_id(contract_number: str) -> str:
    return source_layer.stable_uuid("commercial_contract", contract_number)


def snapshot_id() -> str:
    return source_layer.stable_uuid("snapshot", TENANT_KEY, ASSESSMENT_ID, "dense-context-local")


def projection_manifest_id(projection_key: str) -> str:
    return source_layer.stable_uuid("projection_manifest", TENANT_KEY, ASSESSMENT_ID, projection_key, PROJECTION_VERSION)


def as_num(value: str | None) -> float:
    if value in (None, ""):
        return 0.0
    return float(str(value).replace(",", ""))


def source_hash(payload: object) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=True).encode("utf-8")).hexdigest()


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    if not rows:
        return ""
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


def source_ref(family: str, row: dict[str, str], index: int) -> dict[str, Any]:
    return {
        "source_family": family,
        "source_row_id": row.get("source_row_id"),
        "source_record_id": source_record_id(family, row, index),
        "basis": row.get("source_basis"),
        "review_state": row.get("review_state"),
    }


def build_projection_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    paths = source_paths(dense_out_dir)
    contracts = read_csv(paths["SP08_Vendor_Contract"])
    finance = read_csv(paths["SP06_Finance_ERP"])
    kpis = read_csv(paths["SP10_KPI_Operations"])

    contract_numbers = sorted(row["contract_id"] for row in contracts)
    finance_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    for index, row in enumerate(finance, start=1):
        if index % 3 == 0:
            finance_by_contract[contract_numbers[index % len(contract_numbers)]].append(row)

    kpi_by_app: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in kpis:
        kpi_by_app[row["source_application_ref"]].append(row)

    contract_projection: list[dict[str, str]] = []
    vendor_contracts: dict[str, list[dict[str, str]]] = defaultdict(list)
    value_levers: list[dict[str, str]] = []
    event_rows: list[dict[str, str]] = []

    snap_id = snapshot_id()
    projection_keys = [
        "source_contract_360",
        "source_vendor_360",
        "source_value_levers",
        "source_event_workspace",
    ]

    manifests: list[dict[str, str]] = []
    row_counts: dict[str, int] = {}

    for index, row in enumerate(contracts, start=1):
        cid = contract_id(row["contract_id"])
        contract_obj = object_id("contract", row["contract_id"])
        vendor_obj = object_id("vendor", row["supplier_name"])
        scoped_apps = [value for value in row.get("scoped_applications", "").split(";") if value]
        service_line = {
            "service_tower": row.get("service_tower"),
            "annualized_value_usd": as_num(row.get("annualized_value_usd")),
            "service_category": commercial_layer.service_category(row.get("service_tower")),
        }
        scope_json = [
            {
                "application_ref": app_ref,
                "application_object_id": object_id("application", app_ref),
                "allocation_percent": round(100 / len(scoped_apps), 4) if scoped_apps else None,
            }
            for app_ref in scoped_apps
        ]
        spend_rows = finance_by_contract.get(row["contract_id"], [])
        invoice_total = sum(as_num(item.get("actual_usd")) for item in spend_rows)
        sla_candidates = [candidate for app_ref in scoped_apps for candidate in kpi_by_app.get(app_ref, [])]
        has_benchmark_gap = row.get("benchmarking_right") in {"absent", "limited"}
        has_long_notice = as_num(row.get("notice_window_days")) >= 180
        gap_flags = []
        if has_benchmark_gap:
            gap_flags.append({"gap": "benchmarking_right_requires_review", "state": row.get("benchmarking_right")})
        if not spend_rows:
            gap_flags.append({"gap": "invoice_lines_not_linked_to_contract", "state": "partial_intake"})
        if not sla_candidates:
            gap_flags.append({"gap": "sla_observations_not_scoped_to_contract", "state": "partial_intake"})
        contract_projection.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("source_contract_360", row["contract_id"])),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_contract_360")),
                "projection_version": str(PROJECTION_VERSION),
                "row_key": source_layer.sql_text(row["contract_id"]),
                "contract_id": source_layer.sql_text(cid),
                "contract_object_id": source_layer.sql_text(contract_obj),
                "vendor_object_id": source_layer.sql_text(vendor_obj),
                "contract_name": source_layer.sql_text(f"{row['supplier_name']} {row['service_tower']} agreement"),
                "vendor_name": source_layer.sql_text(row["supplier_name"]),
                "renewal_notice_date": "null",
                "end_date": source_layer.sql_text(row.get("end_date")),
                "annualized_value_usd": source_layer.sql_num(as_num(row.get("annualized_value_usd"))),
                "total_contract_value_usd": source_layer.sql_num(as_num(row.get("annualized_value_usd")) * 5),
                "value_state": source_layer.sql_text("known"),
                "quality_state": source_layer.sql_text("warning" if gap_flags else "passed"),
                "service_lines_json": source_layer.sql_json([service_line]),
                "scope_json": source_layer.sql_json(scope_json),
                "spend_summary_json": source_layer.sql_json({"invoice_line_count": len(spend_rows), "invoice_actuals_usd": round(invoice_total, 2), "basis": "source_recorded_partial"}),
                "sla_summary_json": source_layer.sql_json({"candidate_sla_observation_count": len(sla_candidates), "basis": "source_recorded_candidate"}),
                "document_proof_json": source_layer.sql_json([]),
                "gap_flags_json": source_layer.sql_json(gap_flags),
                "source_refs_json": source_layer.sql_json([source_ref("SP08_Vendor_Contract", row, index)]),
                "source_hash": source_layer.sql_text(source_hash(row)),
            }
        )
        vendor_contracts[row["supplier_name"]].append(row)

        notice_days = as_num(row.get("notice_window_days"))
        annual_value = as_num(row.get("annualized_value_usd"))
        lever_type = "renewal_leverage" if has_long_notice else "evidence_request"
        if has_benchmark_gap:
            lever_type = "rate_variance"
        gate_status = "blocked" if row.get("benchmarking_right") == "absent" or notice_days >= 365 else "gated"
        value_levers.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("source_value_lever", row["contract_id"])),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_value_levers")),
                "projection_version": str(PROJECTION_VERSION),
                "row_key": source_layer.sql_text(f"lever-{row['contract_id']}"),
                "lever_type": source_layer.sql_text(lever_type),
                "opportunity_type": source_layer.sql_text("protect" if lever_type == "renewal_leverage" else "evidence_request"),
                "opportunity_title": source_layer.sql_text(f"Review {row['service_tower']} leverage for {row['supplier_name']}"),
                "contract_id": source_layer.sql_text(cid),
                "contract_object_id": source_layer.sql_text(contract_obj),
                "vendor_object_id": source_layer.sql_text(vendor_obj),
                "primary_metric_key": source_layer.sql_text("notice_window_days" if has_long_notice else "contract_annualized_value_usd"),
                "baseline_spend_usd": source_layer.sql_num(annual_value),
                "addressable_spend_usd": source_layer.sql_num(annual_value if has_benchmark_gap or has_long_notice else 0),
                "estimated_value_low_usd": source_layer.sql_num(round(annual_value * 0.03, 2) if has_benchmark_gap else 0),
                "estimated_value_high_usd": source_layer.sql_num(round(annual_value * 0.08, 2) if has_benchmark_gap else 0),
                "claimable_value_usd": "0",
                "blocked_value_usd": source_layer.sql_num(round(annual_value * 0.08, 2) if gate_status == "blocked" else round(annual_value * 0.03, 2)),
                "value_gate_status": source_layer.sql_text(gate_status),
                "value_gate_reason_code": source_layer.sql_text("commercial_terms_need_review"),
                "value_gate_reason_detail": source_layer.sql_text("Commercial leverage is not claimable until owner and finance review events clear."),
                "evidence_state": source_layer.sql_text("source_recorded"),
                "confidence": "0.68",
                "affected_scope_json": source_layer.sql_json(scope_json),
                "benchmark_context_json": source_layer.sql_json({"benchmarking_right": row.get("benchmarking_right"), "market_benchmark_status": "not_loaded_for_claim"}),
                "protection_context_json": source_layer.sql_json({"notice_window_days": notice_days, "minimum_commitment_usd": as_num(row.get("minimum_commitment_usd"))}),
                "next_action_json": source_layer.sql_json({"owner_role": "sourcing_lead", "action": "review_contract_terms_and_finance_basis"}),
                "metric_keys_json": source_layer.sql_json(["notice_window_days", "contract_annualized_value_usd"]),
                "source_refs_json": source_layer.sql_json([source_ref("SP08_Vendor_Contract", row, index)]),
                "gap_flags_json": source_layer.sql_json(gap_flags),
                "source_hash": source_layer.sql_text(source_hash({"lever": row})),
            }
        )

        if has_benchmark_gap or has_long_notice:
            event_key = f"SRC-EVT-{row['contract_id']}"
            review_event_id = source_layer.stable_uuid(
                "review_event",
                f"contract-benchmarking-{row['contract_id']}" if has_benchmark_gap else f"contract-notice-window-{row['contract_id']}",
            )
            gate_status_sql = "blocked" if gate_status == "blocked" else "gated"
            event_rows.append(
                {
                    "id": source_layer.sql_text(source_layer.stable_uuid("source_event_workspace", event_key)),
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "snapshot_id": source_layer.sql_text(snap_id),
                    "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_event_workspace")),
                    "projection_version": str(PROJECTION_VERSION),
                    "row_key": source_layer.sql_text(event_key),
                    "workspace_tab": source_layer.sql_text("events"),
                    "row_type": source_layer.sql_text("sourcing_event"),
                    "event_key": source_layer.sql_text(event_key),
                    "event_title": source_layer.sql_text(f"{row['supplier_name']} {row['service_tower']} review"),
                    "contract_id": source_layer.sql_text(cid),
                    "contract_object_id": source_layer.sql_text(contract_obj),
                    "vendor_object_id": source_layer.sql_text(vendor_obj),
                    "review_event_id": source_layer.sql_text(review_event_id),
                    "event_stage": source_layer.sql_text("evidence_collection"),
                    "event_status": source_layer.sql_text("blocked" if gate_status_sql == "blocked" else "in_progress"),
                    "gate_status": source_layer.sql_text(gate_status_sql),
                    "gate_reason_code": source_layer.sql_text("commercial_terms_need_review"),
                    "gate_reason_detail": source_layer.sql_text("Source event is gated until review event evidence is resolved."),
                    "owner_role": source_layer.sql_text("sourcing_lead"),
                    "due_date": source_layer.sql_text("2026-09-30"),
                    "evidence_needed_json": source_layer.sql_json(["contract_terms_review", "finance_basis_review"]),
                    "decision_context_json": source_layer.sql_json({"notice_window_days": notice_days, "benchmarking_right": row.get("benchmarking_right")}),
                    "next_action_json": source_layer.sql_json({"action": "collect_missing_evidence"}),
                    "source_refs_json": source_layer.sql_json([source_ref("SP08_Vendor_Contract", row, index)]),
                    "gap_flags_json": source_layer.sql_json(gap_flags),
                    "source_hash": source_layer.sql_text(source_hash({"event": row})),
                }
            )

    vendor_projection: list[dict[str, str]] = []
    for vendor_name, rows in vendor_contracts.items():
        contract_ids = [contract_id(row["contract_id"]) for row in rows]
        covered = sorted({app for row in rows for app in row.get("scoped_applications", "").split(";") if app})
        spend = sum(as_num(row.get("annualized_value_usd")) for row in rows)
        renewal_exposure = sum(as_num(row.get("annualized_value_usd")) for row in rows if as_num(row.get("notice_window_days")) >= 180)
        gap_flags = []
        weak_count = sum(1 for row in rows if row.get("benchmarking_right") in {"absent", "limited"} or as_num(row.get("notice_window_days")) >= 180)
        if weak_count:
            gap_flags.append({"gap": "commercial_terms_need_review", "contract_count": weak_count})
        vendor_projection.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("source_vendor_360", vendor_name)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_vendor_360")),
                "projection_version": str(PROJECTION_VERSION),
                "row_key": source_layer.sql_text(vendor_name),
                "vendor_object_id": source_layer.sql_text(object_id("vendor", vendor_name)),
                "vendor_name": source_layer.sql_text(vendor_name),
                "contract_count": str(len(rows)),
                "covered_object_count": str(len(covered)),
                "annualized_spend_usd": source_layer.sql_num(round(spend, 2)),
                "renewal_exposure_usd": source_layer.sql_num(round(renewal_exposure, 2)),
                "value_state": source_layer.sql_text("known"),
                "quality_state": source_layer.sql_text("warning" if gap_flags else "passed"),
                "contract_ids_json": source_layer.sql_json(contract_ids),
                "covered_objects_json": source_layer.sql_json([{"application_ref": app, "application_object_id": object_id("application", app)} for app in covered]),
                "spend_summary_json": source_layer.sql_json({"annualized_spend_usd": round(spend, 2), "contract_count": len(rows)}),
                "sla_summary_json": source_layer.sql_json({"status": "contract_sla_rollup_not_yet_approved"}),
                "risk_control_json": source_layer.sql_json([{"weak_contract_count": weak_count, "basis": "source_recorded_review_gated"}]),
                "gap_flags_json": source_layer.sql_json(gap_flags),
                "source_refs_json": source_layer.sql_json([{"contract_id": row["contract_id"], "source_row_id": row["source_row_id"]} for row in rows]),
                "source_hash": source_layer.sql_text(source_hash({"vendor": vendor_name, "contracts": rows})),
            }
        )

    row_counts.update(
        {
            "source_contract_360": len(contract_projection),
            "source_vendor_360": len(vendor_projection),
            "source_value_levers": len(value_levers),
            "source_event_workspace": len(event_rows),
        }
    )
    for projection_key in projection_keys:
        payload = {"projection_key": projection_key, "row_count": row_counts[projection_key], "source_hash": "dense-source-room-local"}
        manifests.append(
            {
                "id": source_layer.sql_text(projection_manifest_id(projection_key)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_key": source_layer.sql_text(projection_key),
                "projection_version": str(PROJECTION_VERSION),
                "rebuild_command": source_layer.sql_text("npm run ecl:source-room-source-projection:load"),
                "source_hash": source_layer.sql_text(source_hash({"projection": projection_key, "source": "dense-source-room"})),
                "projection_hash": source_layer.sql_text(source_hash(payload)),
                "row_count": str(row_counts[projection_key]),
                "quality_state": source_layer.sql_text("warning" if projection_key in {"source_contract_360", "source_vendor_360", "source_event_workspace"} else "passed"),
                "admission_status": source_layer.sql_text("not_applicable"),
                "admission_gate_results_json": source_layer.sql_json([]),
                "gated_claim_count": str(row_counts[projection_key] if projection_key in {"source_value_levers", "source_event_workspace"} else 0),
                "proof_uri": source_layer.sql_text("local-disposable-postgres"),
            }
        )

    columns = {
        "ecl_projection.projection_manifest": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_key", "projection_version", "rebuild_command", "source_hash", "projection_hash", "row_count", "quality_state", "admission_status", "admission_gate_results_json", "gated_claim_count", "proof_uri"],
        "ecl_projection.source_contract_360": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "contract_id", "contract_object_id", "vendor_object_id", "contract_name", "vendor_name", "renewal_notice_date", "end_date", "annualized_value_usd", "total_contract_value_usd", "value_state", "quality_state", "service_lines_json", "scope_json", "spend_summary_json", "sla_summary_json", "document_proof_json", "gap_flags_json", "source_refs_json", "source_hash"],
        "ecl_projection.source_vendor_360": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "vendor_object_id", "vendor_name", "contract_count", "covered_object_count", "annualized_spend_usd", "renewal_exposure_usd", "value_state", "quality_state", "contract_ids_json", "covered_objects_json", "spend_summary_json", "sla_summary_json", "risk_control_json", "gap_flags_json", "source_refs_json", "source_hash"],
        "ecl_projection.source_value_levers": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "lever_type", "opportunity_type", "opportunity_title", "contract_id", "contract_object_id", "vendor_object_id", "primary_metric_key", "baseline_spend_usd", "addressable_spend_usd", "estimated_value_low_usd", "estimated_value_high_usd", "claimable_value_usd", "blocked_value_usd", "value_gate_status", "value_gate_reason_code", "value_gate_reason_detail", "evidence_state", "confidence", "affected_scope_json", "benchmark_context_json", "protection_context_json", "next_action_json", "metric_keys_json", "source_refs_json", "gap_flags_json", "source_hash"],
        "ecl_projection.source_event_workspace": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "workspace_tab", "row_type", "event_key", "event_title", "contract_id", "contract_object_id", "vendor_object_id", "review_event_id", "event_stage", "event_status", "gate_status", "gate_reason_code", "gate_reason_detail", "owner_role", "due_date", "evidence_needed_json", "decision_context_json", "next_action_json", "source_refs_json", "gap_flags_json", "source_hash"],
    }
    sql_path = out_dir / "dense_source_room_ecl_source_projection_load.sql"
    sql_parts = ["begin;"]
    sql_parts.append(insert_sql("ecl_projection.projection_manifest", columns["ecl_projection.projection_manifest"], manifests))
    sql_parts.append(insert_sql("ecl_projection.source_contract_360", columns["ecl_projection.source_contract_360"], contract_projection))
    sql_parts.append(insert_sql("ecl_projection.source_vendor_360", columns["ecl_projection.source_vendor_360"], vendor_projection))
    sql_parts.append(insert_sql("ecl_projection.source_value_levers", columns["ecl_projection.source_value_levers"], value_levers))
    sql_parts.append(insert_sql("ecl_projection.source_event_workspace", columns["ecl_projection.source_event_workspace"], event_rows))
    sql_parts.append("commit;")
    sql_path.parent.mkdir(parents=True, exist_ok=True)
    sql_path.write_text("\n".join(sql_parts) + "\n", encoding="utf-8")
    verify_sql = out_dir / "dense_source_room_ecl_source_projection_verify.sql"
    verify_sql.write_text(
        """
\\pset format unaligned
\\pset tuples_only on
select jsonb_pretty(jsonb_build_object(
  'projection_manifest', (select count(*) from ecl_projection.projection_manifest),
  'source_contract_360', (select count(*) from ecl_projection.source_contract_360),
  'source_vendor_360', (select count(*) from ecl_projection.source_vendor_360),
  'source_value_levers', (select count(*) from ecl_projection.source_value_levers),
  'source_event_workspace', (select count(*) from ecl_projection.source_event_workspace),
  'source_value_claimable_rows', (select count(*) from ecl_projection.source_value_levers where claimable_value_usd > 0),
  'source_value_gated_rows', (select count(*) from ecl_projection.source_value_levers where value_gate_status in ('gated','blocked')),
  'event_rows_without_evidence_payload', (select count(*) from ecl_projection.source_event_workspace where gate_status in ('gated','blocked') and jsonb_array_length(evidence_needed_json) = 0),
  'contract_projection_contract_drift', (
    select count(*) from ecl_projection.source_contract_360 p
    left join ecl_commercial.contract c on c.tenant_key = p.tenant_key and c.assessment_id = p.assessment_id and c.id = p.contract_id
    where c.id is null
  ),
  'vendor_projection_vendor_drift', (
    select count(*) from ecl_projection.source_vendor_360 p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.vendor_object_id
    where o.id is null
  ),
  'value_lever_metric_drift', (
    select count(*) from ecl_projection.source_value_levers p
    left join ecl_context.metric_definition md on md.tenant_key = p.tenant_key and md.metric_key = p.primary_metric_key
    where md.metric_key is null
  ),
  'event_review_drift', (
    select count(*) from ecl_projection.source_event_workspace p
    left join ecl_review.review_event re on re.tenant_key = p.tenant_key and re.assessment_id = p.assessment_id and re.id = p.review_event_id
    where re.id is null
  )
));
""".strip()
        + "\n",
        encoding="utf-8",
    )
    return {
        "projection_sql": sql_path.as_posix(),
        "verify_sql": verify_sql.as_posix(),
        "expected_counts": row_counts,
    }


def run_postgres_load(
    out_dir: Path,
    source_sql: Path,
    context_sql: Path,
    commercial_sql: Path,
    review_sql: Path,
    projection_sql: Path,
    verify_sql: Path,
    keep_postgres: bool,
) -> dict[str, Any]:
    env = source_layer.command_env()
    pg_tmp = Path(source_layer.tempfile.mkdtemp(prefix="ecl-dense-source-projection-pg-"))
    port = source_layer.find_open_port()
    db_name = "ecl_dense_source_projection_proof"
    commands: list[dict[str, Any]] = []
    pg_started = False
    try:
        commands.append(source_layer.run(["initdb", "-D", (pg_tmp / "data").as_posix(), "--encoding=UTF8", "--locale=C.UTF-8"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_initdb.log"))
        commands.append(source_layer.run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "-l", (out_dir / "postgres.log").as_posix(), "-o", f"-p {port} -k {pg_tmp.as_posix()}", "start"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_start.log"))
        pg_started = True
        commands.append(source_layer.run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), db_name], cwd=ROOT, env=env))
        load_log = out_dir / "dense_source_room_ecl_source_projection_load.log"
        for ddl in DDL_FILES:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        for sql_path in [source_sql, context_sql, commercial_sql, review_sql, projection_sql]:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", sql_path.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        bad_value_metric_sql = "insert into ecl_projection.source_value_levers (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_version, row_key, lever_type, opportunity_type, opportunity_title, contract_id, contract_object_id, vendor_object_id, primary_metric_key, claimable_value_usd, value_gate_status, value_gate_reason_code, value_gate_reason_detail, evidence_state, source_hash) select p.tenant_key, p.assessment_id, p.snapshot_id, p.projection_manifest_id, p.projection_version, 'bad-metric', p.lever_type, p.opportunity_type, p.opportunity_title, p.contract_id, p.contract_object_id, p.vendor_object_id, 'invented_metric_key', 0, 'gated', 'test', 'test', 'source_recorded', 'bad' from ecl_projection.source_value_levers p limit 1;"
        bad_event_payload_sql = "insert into ecl_projection.source_event_workspace (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_version, row_key, workspace_tab, row_type, event_key, event_title, contract_id, contract_object_id, vendor_object_id, review_event_id, event_stage, event_status, gate_status, gate_reason_code, gate_reason_detail, owner_role, source_hash) select tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_version, 'bad-event-payload', workspace_tab, row_type, 'bad-event', event_title, contract_id, contract_object_id, vendor_object_id, review_event_id, event_stage, event_status, 'blocked', 'test', 'test', owner_role, 'bad' from ecl_projection.source_event_workspace limit 1;"
        planted_failures = []
        for key, sql in [("source_value_lever_metric_fk", bad_value_metric_sql), ("source_event_workspace_gate_payload_check", bad_event_payload_sql)]:
            result = source_layer.subprocess.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-c", sql], cwd=ROOT, env=env, text=True, capture_output=True)
            planted_failures.append({"key": key, "rejected": result.returncode != 0, "stderr": result.stderr[:500]})
        verify = source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-f", verify_sql.as_posix()], cwd=ROOT, env=env, stdout_path=out_dir / "dense_source_room_ecl_source_projection_readback.json")
        readback = source_layer.parse_readback(verify["stdout"])
    finally:
        if pg_started:
            try:
                commands.append(source_layer.run(["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "stop", "-m", "fast"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_stop.log"))
            except source_layer.CommandFailure:
                pass
        if not keep_postgres:
            source_layer.shutil.rmtree(pg_tmp, ignore_errors=True)
    return {"commands": commands, "postgres": {"socket_dir": pg_tmp.as_posix(), "port": port, "kept": keep_postgres}, "readback": readback, "planted_failures": planted_failures}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dense-out-dir", type=Path, default=DEFAULT_DENSE_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--keep-postgres", action="store_true")
    args = parser.parse_args()
    dense_out_dir = args.dense_out_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    source_layer.generate_dense_package(dense_out_dir)
    source_sql_summary = source_layer.build_sql(dense_out_dir, out_dir)
    context_sql_summary = context_layer.build_context_sql(dense_out_dir, out_dir)
    commercial_sql_summary = commercial_layer.build_commercial_sql(dense_out_dir, out_dir)
    review_sql_summary = review_layer.build_review_sql(dense_out_dir, out_dir)
    projection_sql_summary = build_projection_sql(dense_out_dir, out_dir)
    pg_summary = run_postgres_load(
        out_dir,
        Path(source_sql_summary["load_sql"]),
        Path(context_sql_summary["context_sql"]),
        Path(commercial_sql_summary["commercial_sql"]),
        Path(review_sql_summary["review_sql"]),
        Path(projection_sql_summary["projection_sql"]),
        Path(projection_sql_summary["verify_sql"]),
        args.keep_postgres,
    )
    readback = pg_summary["readback"]
    expected = projection_sql_summary["expected_counts"]
    issues = [
        f"{key}_count_expected_{expected[key]}_got_{readback.get(key)}"
        for key in expected
        if int(readback.get(key, -1)) != int(expected[key])
    ]
    for drift_key in ["contract_projection_contract_drift", "vendor_projection_vendor_drift", "value_lever_metric_drift", "event_review_drift", "event_rows_without_evidence_payload"]:
        if int(readback.get(drift_key, 1)) != 0:
            issues.append(drift_key)
    if int(readback.get("source_value_claimable_rows", 1)) != 0:
        issues.append("source_value_claimable_rows_should_be_zero_before_review")
    if any(not failure["rejected"] for failure in pg_summary["planted_failures"]):
        issues.append("planted_failure_not_rejected")
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "boundary": {"azure_load": False, "product_route_repointing": False, "browser_proof": False},
        "dense_out_dir": dense_out_dir.as_posix(),
        "out_dir": out_dir.as_posix(),
        "source_sql": source_sql_summary,
        "context_sql": context_sql_summary,
        "commercial_sql": commercial_sql_summary,
        "review_sql": review_sql_summary,
        "projection_sql": projection_sql_summary,
        "readback": readback,
        "planted_failures": pg_summary["planted_failures"],
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    write_json(out_dir / "dense_source_room_ecl_source_projection_load_summary.json", summary)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
