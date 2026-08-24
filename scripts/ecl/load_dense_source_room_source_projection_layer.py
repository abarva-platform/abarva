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


def context_pack_id() -> str:
    return source_layer.stable_uuid("context_pack", TENANT_KEY, ASSESSMENT_ID, "dense-source-room-context-pack", 1)


def slug(value: str | None) -> str:
    text = (value or "unknown").strip().lower()
    return "".join(char if char.isalnum() else "_" for char in text).strip("_") or "unknown"


def source_ref_for_family(family: str, row: dict[str, str], index: int) -> list[dict[str, Any]]:
    return [source_ref(family, row, index)]


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
    interviews = read_csv(paths["SP01_Documents_Interviews"])
    workforce = read_csv(paths["SP02_HRIS"])
    apps = read_csv(paths["SP03_CMDB"])
    data_rows = read_csv(paths["SP04_Data_BI_ETL"])
    infrastructure = read_csv(paths["SP05_Infrastructure"])
    programs = read_csv(paths["SP07_PPM"])
    contracts = read_csv(paths["SP08_Vendor_Contract"])
    grc_rows = read_csv(paths["SP09_GRC"])
    finance = read_csv(paths["SP06_Finance_ERP"])
    kpis = read_csv(paths["SP10_KPI_Operations"])
    ai_rows = read_csv(paths["SP11_AI_Usage_Models"])
    evidence_rows = read_csv(paths["SP12_Evidence_Room"])
    flows = read_csv(paths["SP13_Data_Flows_Integrations"])
    deployments = read_csv(paths["SP14_Deployments_Hosting"])

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
    home_rows: list[dict[str, str]] = []
    tower_rows: list[dict[str, str]] = []
    intelligence_rows: list[dict[str, str]] = []
    projection_entries: list[dict[str, str]] = []
    projection_object_refs: list[dict[str, str]] = []
    projection_metric_refs: list[dict[str, str]] = []
    projection_measure_refs: list[dict[str, str]] = []
    projection_relationship_refs: list[dict[str, str]] = []
    projection_source_record_refs: list[dict[str, str]] = []
    projection_document_extraction_refs: list[dict[str, str]] = []

    snap_id = snapshot_id()
    projection_keys = [
        "home_enterprise_landscape",
        "source_contract_360",
        "source_vendor_360",
        "source_value_levers",
        "source_event_workspace",
        "tower_command_center",
        "intelligence_context_pack",
    ]

    manifests: list[dict[str, str]] = []
    row_counts: dict[str, int] = {}

    def projection_entry_id(surface_key: str, row_key: str) -> str:
        return source_layer.stable_uuid("projection_entry", TENANT_KEY, ASSESSMENT_ID, surface_key, row_key, PROJECTION_VERSION)

    def add_projection_entry(
        *,
        surface_key: str,
        row_key: str,
        row_type: str,
        row_hash: str,
        object_refs: list[tuple[str, str]] | None = None,
        metric_keys: list[str] | None = None,
        measure_refs: list[str] | None = None,
        relationship_refs: list[str] | None = None,
        source_refs: list[dict[str, Any]] | None = None,
        document_extraction_refs: list[str] | None = None,
        display_cache: dict[str, Any] | None = None,
    ) -> str:
        entry_id = projection_entry_id(surface_key, row_key)
        object_refs = [(role, object_id_value) for role, object_id_value in (object_refs or []) if object_id_value]
        metric_keys = [metric_key for metric_key in (metric_keys or []) if metric_key]
        measure_refs = [measure_id_value for measure_id_value in (measure_refs or []) if measure_id_value]
        relationship_refs = [relationship_id for relationship_id in (relationship_refs or []) if relationship_id]
        source_refs = [source_ref_row for source_ref_row in (source_refs or []) if source_ref_row.get("source_record_id")]
        document_extraction_refs = [extraction_id for extraction_id in (document_extraction_refs or []) if extraction_id]
        refs_payload = {
            "objects": object_refs,
            "metrics": sorted(set(metric_keys)),
            "measures": sorted(set(measure_refs)),
            "relationships": sorted(set(relationship_refs)),
            "source_records": sorted(source_ref_row["source_record_id"] for source_ref_row in source_refs),
            "document_extractions": sorted(set(document_extraction_refs)),
        }
        projection_entries.append(
            {
                "id": source_layer.sql_text(entry_id),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id(surface_key)),
                "projection_version": str(PROJECTION_VERSION),
                "surface_key": source_layer.sql_text(surface_key),
                "row_key": source_layer.sql_text(row_key),
                "row_type": source_layer.sql_text(row_type),
                "source_hash": source_layer.sql_text(row_hash),
                "refs_content_hash": source_layer.sql_text(source_hash(refs_payload)),
                "refs_cache_json": source_layer.sql_json(refs_payload),
                "display_cache_json": source_layer.sql_json(display_cache or {}),
            }
        )
        for sort_order, (role, object_id_value) in enumerate(object_refs, start=1):
            projection_object_refs.append(
                {
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "projection_entry_id": source_layer.sql_text(entry_id),
                    "object_id": source_layer.sql_text(object_id_value),
                    "ref_role": source_layer.sql_text(role),
                    "sort_order": str(sort_order),
                    "source_hash": source_layer.sql_text(row_hash),
                }
            )
        for sort_order, metric_key in enumerate(sorted(set(metric_keys)), start=1):
            projection_metric_refs.append(
                {
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "projection_entry_id": source_layer.sql_text(entry_id),
                    "metric_key": source_layer.sql_text(metric_key),
                    "ref_role": source_layer.sql_text("display"),
                    "sort_order": str(sort_order),
                    "source_hash": source_layer.sql_text(row_hash),
                }
            )
        for sort_order, measure_id_value in enumerate(sorted(set(measure_refs)), start=1):
            projection_measure_refs.append(
                {
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "projection_entry_id": source_layer.sql_text(entry_id),
                    "measure_id": source_layer.sql_text(measure_id_value),
                    "ref_role": source_layer.sql_text("supporting_measure"),
                    "sort_order": str(sort_order),
                    "source_hash": source_layer.sql_text(row_hash),
                }
            )
        for sort_order, relationship_id in enumerate(sorted(set(relationship_refs)), start=1):
            projection_relationship_refs.append(
                {
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "projection_entry_id": source_layer.sql_text(entry_id),
                    "relationship_id": source_layer.sql_text(relationship_id),
                    "ref_role": source_layer.sql_text("supporting_relationship"),
                    "sort_order": str(sort_order),
                    "source_hash": source_layer.sql_text(row_hash),
                }
            )
        for sort_order, source_ref_row in enumerate(source_refs, start=1):
            projection_source_record_refs.append(
                {
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "projection_entry_id": source_layer.sql_text(entry_id),
                    "source_record_id": source_layer.sql_text(source_ref_row["source_record_id"]),
                    "ref_role": source_layer.sql_text(source_ref_row.get("source_family") or "source_record"),
                    "sort_order": str(sort_order),
                    "source_hash": source_layer.sql_text(row_hash),
                }
            )
        for sort_order, extraction_id in enumerate(sorted(set(document_extraction_refs)), start=1):
            projection_document_extraction_refs.append(
                {
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "projection_entry_id": source_layer.sql_text(entry_id),
                    "document_extraction_id": source_layer.sql_text(extraction_id),
                    "ref_role": source_layer.sql_text("supporting_extraction"),
                    "sort_order": str(sort_order),
                    "source_hash": source_layer.sql_text(row_hash),
                }
            )
        return entry_id

    def add_home_row(
        *,
        page_key: str,
        row_key: str,
        section_key: str,
        row_type: str,
        title: str,
        summary: str,
        primary_object_id: str | None,
        metric_keys: list[str],
        relationship_ids: list[str] | None,
        source_refs: list[dict[str, Any]],
        basis_summary: str,
        value_state: str = "known",
        quality_state: str = "passed",
        admission_status: str = "not_applicable",
        admission_gate_key: str | None = None,
        admission_result: dict[str, Any] | None = None,
        gap_flags: list[dict[str, Any]] | None = None,
        display_payload: dict[str, Any] | None = None,
    ) -> None:
        payload = {
            "page_key": page_key,
            "row_key": row_key,
            "title": title,
            "summary": summary,
            "metrics": metric_keys,
            "display": display_payload or {},
        }
        row_hash = source_hash(payload)
        entry_id = add_projection_entry(
            surface_key="home_enterprise_landscape",
            row_key=row_key,
            row_type=row_type,
            row_hash=row_hash,
            object_refs=[("primary_object", primary_object_id)] if primary_object_id else [],
            metric_keys=metric_keys,
            relationship_refs=relationship_ids or [],
            source_refs=source_refs,
            display_cache={"page_key": page_key, "section_key": section_key, "title": title},
        )
        home_rows.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("home_enterprise_landscape", page_key, row_key)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("home_enterprise_landscape")),
                "projection_entry_id": source_layer.sql_text(entry_id),
                "projection_version": str(PROJECTION_VERSION),
                "page_key": source_layer.sql_text(page_key),
                "row_key": source_layer.sql_text(row_key),
                "section_key": source_layer.sql_text(section_key),
                "row_type": source_layer.sql_text(row_type),
                "title": source_layer.sql_text(title),
                "summary": source_layer.sql_text(summary),
                "primary_object_id": source_layer.sql_text(primary_object_id),
                "metric_keys_json": source_layer.sql_json(metric_keys),
                "relationship_ids_json": source_layer.sql_json(relationship_ids or []),
                "source_refs_json": source_layer.sql_json(source_refs),
                "basis_summary": source_layer.sql_text(basis_summary),
                "value_state": source_layer.sql_text(value_state),
                "quality_state": source_layer.sql_text(quality_state),
                "admission_status": source_layer.sql_text(admission_status),
                "admission_gate_key": source_layer.sql_text(admission_gate_key),
                "admission_result_json": source_layer.sql_json(admission_result or {}),
                "gap_flags_json": source_layer.sql_json(gap_flags or []),
                "display_payload_json": source_layer.sql_json(display_payload or {}),
                "source_hash": source_layer.sql_text(row_hash),
            }
        )

    def add_tower_row(
        *,
        row_key: str,
        page_key: str,
        row_type: str,
        primary_object_id: str | None,
        claim_id: str | None,
        gate_status: str,
        gate_reason_code: str | None,
        gate_reason_detail: str | None,
        next_gate: str | None,
        evidence_needed: list[str],
        funded: float | None = None,
        promised: float | None = None,
        usage_supported: float | None = None,
        finance_validated: float | None = None,
        claimable: float | None = None,
        blocked: float | None = None,
        proof_score: int | None = None,
        risk_score: int | None = None,
        usage_score: int | None = None,
        owner_role: str | None = None,
        handoff_module: str | None = None,
        value_state: str = "known",
        quality_state: str = "warning",
        metric_keys: list[str] | None = None,
        source_refs: list[dict[str, Any]] | None = None,
        gap_flags: list[dict[str, Any]] | None = None,
        display_payload: dict[str, Any] | None = None,
    ) -> None:
        payload = {
            "page_key": page_key,
            "row_key": row_key,
            "gate_status": gate_status,
            "metrics": metric_keys or [],
            "display": display_payload or {},
        }
        row_hash = source_hash(payload)
        entry_id = add_projection_entry(
            surface_key="tower_command_center",
            row_key=f"{page_key}::{row_key}",
            row_type=row_type,
            row_hash=row_hash,
            object_refs=[("primary_object", primary_object_id)] if primary_object_id else [],
            metric_keys=metric_keys or [],
            source_refs=source_refs or [],
            display_cache={"page_key": page_key, "claim_id": claim_id, "title": (display_payload or {}).get("title")},
        )
        tower_rows.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("tower_command_center", page_key, row_key)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("tower_command_center")),
                "projection_entry_id": source_layer.sql_text(entry_id),
                "projection_version": str(PROJECTION_VERSION),
                "row_key": source_layer.sql_text(row_key),
                "page_key": source_layer.sql_text(page_key),
                "row_type": source_layer.sql_text(row_type),
                "primary_object_id": source_layer.sql_text(primary_object_id),
                "claim_id": source_layer.sql_text(claim_id),
                "claim_gate_status": source_layer.sql_text(gate_status),
                "claim_gate_reason_code": source_layer.sql_text(gate_reason_code),
                "claim_gate_reason_detail": source_layer.sql_text(gate_reason_detail),
                "next_gate": source_layer.sql_text(next_gate),
                "evidence_needed_json": source_layer.sql_json(evidence_needed),
                "funded_amount_usd": source_layer.sql_num(funded),
                "promised_value_usd": source_layer.sql_num(promised),
                "usage_supported_value_usd": source_layer.sql_num(usage_supported),
                "finance_validated_value_usd": source_layer.sql_num(finance_validated),
                "claimable_value_usd": source_layer.sql_num(claimable),
                "blocked_value_usd": source_layer.sql_num(blocked),
                "proof_maturity_score": source_layer.sql_num(proof_score),
                "risk_pressure_score": source_layer.sql_num(risk_score),
                "usage_strength_score": source_layer.sql_num(usage_score),
                "owner_role": source_layer.sql_text(owner_role),
                "handoff_module": source_layer.sql_text(handoff_module),
                "value_state": source_layer.sql_text(value_state),
                "quality_state": source_layer.sql_text(quality_state),
                "metric_keys_json": source_layer.sql_json(metric_keys or []),
                "source_refs_json": source_layer.sql_json(source_refs or []),
                "gap_flags_json": source_layer.sql_json(gap_flags or []),
                "display_payload_json": source_layer.sql_json(display_payload or {}),
                "source_hash": source_layer.sql_text(row_hash),
            }
        )

    def add_intelligence_row(
        *,
        surface_key: str,
        row_key: str,
        primary_object_id: str | None,
        permitted_facts: list[dict[str, Any]],
        blocked_facts: list[dict[str, Any]],
        citations: list[dict[str, Any]],
        gap_flags: list[dict[str, Any]],
    ) -> None:
        payload = {
            "surface_key": surface_key,
            "row_key": row_key,
            "permitted": permitted_facts,
            "blocked": blocked_facts,
        }
        row_hash = source_hash(payload)
        entry_id = add_projection_entry(
            surface_key="intelligence_context_pack",
            row_key=f"{surface_key}::{row_key}",
            row_type="context_pack",
            row_hash=row_hash,
            object_refs=[("primary_object", primary_object_id)] if primary_object_id else [],
            display_cache={"surface_key": surface_key},
        )
        intelligence_rows.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("intelligence_context_pack", surface_key, row_key)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "context_pack_id": source_layer.sql_text(context_pack_id()),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("intelligence_context_pack")),
                "projection_entry_id": source_layer.sql_text(entry_id),
                "projection_version": str(PROJECTION_VERSION),
                "row_key": source_layer.sql_text(row_key),
                "surface_key": source_layer.sql_text(surface_key),
                "primary_object_id": source_layer.sql_text(primary_object_id),
                "prompt_context_json": source_layer.sql_json({"instruction": "Use permitted facts only; cite source refs; keep gaps explicit."}),
                "permitted_facts_json": source_layer.sql_json(permitted_facts),
                "blocked_facts_json": source_layer.sql_json(blocked_facts),
                "citation_refs_json": source_layer.sql_json(citations),
                "retrieval_state": source_layer.sql_text("not_indexed"),
                "value_state": source_layer.sql_text("known"),
                "quality_state": source_layer.sql_text("warning"),
                "access_class": source_layer.sql_text("public_demo"),
                "gap_flags_json": source_layer.sql_json(gap_flags),
                "source_hash": source_layer.sql_text(row_hash),
            }
        )

    contract_index_by_id = {row["contract_id"]: index for index, row in enumerate(contracts, start=1)}
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
        contract_source_ref = source_ref("SP08_Vendor_Contract", row, index)
        contract_row_hash = source_hash(row)
        contract_entry_id = add_projection_entry(
            surface_key="source_contract_360",
            row_key=row["contract_id"],
            row_type="contract",
            row_hash=contract_row_hash,
            object_refs=[("contract_object", contract_obj), ("vendor_object", vendor_obj)],
            metric_keys=["contract_annualized_value_usd", "notice_window_days", "minimum_commitment_usd"],
            source_refs=[contract_source_ref],
            display_cache={"contract_name": f"{row['supplier_name']} {row['service_tower']} agreement", "vendor_name": row["supplier_name"]},
        )
        contract_projection.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("source_contract_360", row["contract_id"])),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_contract_360")),
                "projection_entry_id": source_layer.sql_text(contract_entry_id),
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
                "source_refs_json": source_layer.sql_json([contract_source_ref]),
                "source_hash": source_layer.sql_text(contract_row_hash),
            }
        )
        vendor_contracts[row["supplier_name"]].append(row)

        notice_days = as_num(row.get("notice_window_days"))
        annual_value = as_num(row.get("annualized_value_usd"))
        lever_type = "renewal_leverage" if has_long_notice else "evidence_request"
        if has_benchmark_gap:
            lever_type = "rate_variance"
        gate_status = "blocked" if row.get("benchmarking_right") == "absent" or notice_days >= 365 else "gated"
        lever_metric_keys = ["notice_window_days", "contract_annualized_value_usd"]
        lever_row_hash = source_hash({"lever": row})
        lever_entry_id = add_projection_entry(
            surface_key="source_value_levers",
            row_key=f"lever-{row['contract_id']}",
            row_type="value_lever",
            row_hash=lever_row_hash,
            object_refs=[("contract_object", contract_obj), ("vendor_object", vendor_obj)],
            metric_keys=lever_metric_keys,
            source_refs=[contract_source_ref],
            display_cache={"lever_type": lever_type, "opportunity_type": "protect" if lever_type == "renewal_leverage" else "evidence_request"},
        )
        value_levers.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("source_value_lever", row["contract_id"])),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_value_levers")),
                "projection_entry_id": source_layer.sql_text(lever_entry_id),
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
                "metric_keys_json": source_layer.sql_json(lever_metric_keys),
                "source_refs_json": source_layer.sql_json([contract_source_ref]),
                "gap_flags_json": source_layer.sql_json(gap_flags),
                "source_hash": source_layer.sql_text(lever_row_hash),
            }
        )
        add_tower_row(
            row_key=f"lever-{row['contract_id']}",
            page_key="recommended_actions",
            row_type="commercial_value_lever",
            primary_object_id=contract_obj,
            claim_id=f"lever-{row['contract_id']}",
            gate_status=gate_status,
            gate_reason_code="commercial_terms_need_review",
            gate_reason_detail="Commercial leverage is not claimable until owner and finance review events clear.",
            next_gate="owner_review",
            evidence_needed=["owner_review", "finance_validation", "document_clause_confirmation"],
            funded=as_num(row.get("minimum_commitment_usd")),
            promised=annual_value,
            usage_supported=None,
            finance_validated=0,
            claimable=0,
            blocked=round(annual_value * 0.08, 2) if gate_status == "blocked" else round(annual_value * 0.03, 2),
            proof_score=38,
            risk_score=72 if gate_status == "blocked" else 55,
            usage_score=None,
            owner_role="sourcing_lead",
            handoff_module="Source",
            metric_keys=["contract_annualized_value_usd", "notice_window_days" if has_long_notice else "contract_annualized_value_usd"],
            source_refs=source_ref_for_family("SP08_Vendor_Contract", row, index),
            gap_flags=gap_flags,
            display_payload={
                "title": f"Review {row['service_tower']} leverage for {row['supplier_name']}",
                "lever_type": lever_type,
                "opportunity_type": "protect" if lever_type == "renewal_leverage" else "evidence_request",
            },
        )

        if has_benchmark_gap or has_long_notice:
            event_key = f"SRC-EVT-{row['contract_id']}"
            review_event_id = source_layer.stable_uuid(
                "review_event",
                f"contract-benchmarking-{row['contract_id']}" if has_benchmark_gap else f"contract-notice-window-{row['contract_id']}",
            )
            gate_status_sql = "blocked" if gate_status == "blocked" else "gated"
            event_row_hash = source_hash({"event": row})
            event_entry_id = add_projection_entry(
                surface_key="source_event_workspace",
                row_key=event_key,
                row_type="sourcing_event",
                row_hash=event_row_hash,
                object_refs=[("contract_object", contract_obj), ("vendor_object", vendor_obj)],
                source_refs=[contract_source_ref],
                display_cache={"event_stage": "evidence_collection", "event_status": "blocked" if gate_status_sql == "blocked" else "in_progress"},
            )
            event_rows.append(
                {
                    "id": source_layer.sql_text(source_layer.stable_uuid("source_event_workspace", event_key)),
                    "tenant_key": source_layer.sql_text(TENANT_KEY),
                    "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                    "snapshot_id": source_layer.sql_text(snap_id),
                    "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_event_workspace")),
                    "projection_entry_id": source_layer.sql_text(event_entry_id),
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
                    "source_refs_json": source_layer.sql_json([contract_source_ref]),
                    "gap_flags_json": source_layer.sql_json(gap_flags),
                    "source_hash": source_layer.sql_text(event_row_hash),
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
        vendor_source_refs = [source_ref("SP08_Vendor_Contract", row, contract_index_by_id[row["contract_id"]]) for row in rows]
        vendor_row_hash = source_hash({"vendor": vendor_name, "contracts": rows})
        vendor_entry_id = add_projection_entry(
            surface_key="source_vendor_360",
            row_key=vendor_name,
            row_type="vendor",
            row_hash=vendor_row_hash,
            object_refs=[("vendor_object", object_id("vendor", vendor_name))],
            metric_keys=["contract_annualized_value_usd", "notice_window_days"],
            source_refs=vendor_source_refs,
            display_cache={"vendor_name": vendor_name, "contract_count": len(rows)},
        )
        vendor_projection.append(
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("source_vendor_360", vendor_name)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snap_id),
                "projection_manifest_id": source_layer.sql_text(projection_manifest_id("source_vendor_360")),
                "projection_entry_id": source_layer.sql_text(vendor_entry_id),
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
                "source_refs_json": source_layer.sql_json(vendor_source_refs),
                "source_hash": source_layer.sql_text(vendor_row_hash),
            }
        )

    enterprise_id = object_id("enterprise", "MERIDIAN-HEALTH")
    app_by_id = {row["application_id"]: row for row in apps}
    function_names = sorted(
        {
            *(row.get("business_function", "") for row in apps),
            *(row.get("function", "") for row in data_rows),
            *(row.get("source_function", "") for row in flows),
            *(row.get("target_function", "") for row in flows),
        }
        - {""}
    )
    apps_by_function: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in apps:
        apps_by_function[row.get("business_function", "")].append(row)
    flow_targets: dict[str, int] = defaultdict(int)
    for row in flows:
        flow_targets[row.get("target_object_ref", "")] += 1
    singleton_destinations = sum(1 for count in flow_targets.values() if count == 1)
    singleton_ratio = singleton_destinations / max(len(flow_targets), 1)
    max_inbound = max(flow_targets.values() or [0])
    has_landing = any(row.get("landing_layer") for row in flows)
    has_consumption = any(row.get("consumption_layer") for row in flows)
    data_flow_admitted = singleton_ratio < 0.6 and max_inbound >= 60 and has_landing and has_consumption
    data_flow_refusal = {
        "failedRules": [
            rule
            for rule, failed in [
                ("FLOW-CONVERGENCE", singleton_ratio >= 0.6 or max_inbound < 60),
                ("LANDING-LAYER", not has_landing),
                ("CONSUMPTION-LAYER", not has_consumption),
            ]
            if failed
        ],
        "measurement": {
            "singletonDestinationRatio": round(singleton_ratio, 4),
            "maxInbound": max_inbound,
            "landingLayersPresent": has_landing,
            "consumptionLayersPresent": has_consumption,
        },
        "evidenceNeeded": ["flow convergence path", "landing layer", "consumption layer"],
        "supportedAlternative": "browse_the_record",
    }

    source_totals = {
        "applications": len(apps),
        "deployments": len(deployments),
        "data_flows": len(flows),
        "contracts": len(contracts),
        "vendors": len(vendor_contracts),
        "data_analytics_rows": len(data_rows),
        "infrastructure_rows": len(infrastructure),
        "ai_usage_rows": len(ai_rows),
        "evidence_rows": len(evidence_rows),
        "interview_rows": len(interviews),
        "relationships": len(flows) + len(deployments) + sum(len(row.get("scoped_applications", "").split(";")) for row in contracts),
    }
    add_home_row(
        page_key="executive_brief",
        row_key="executive_brief_summary",
        section_key="orientation",
        row_type="summary",
        title="Meridian Health dense ECL source room loaded",
        summary=f"{len(apps)} applications, {len(contracts)} contracts, {len(flows)} data flows, and {len(ai_rows)} AI usage rows are available as governed ECL inputs. Missing retrieval/browser proof remains explicit.",
        primary_object_id=enterprise_id,
        metric_keys=["annual_cost_usd", "contract_annualized_value_usd", "data_volume_tb", "ai_active_users"],
        relationship_ids=[],
        source_refs=[{"source_family": "dense_source_room_manifest", "source_record_count": sum(source_totals.values())}],
        basis_summary="source_recorded_dense_synthetic",
        quality_state="warning",
        gap_flags=[{"gap": "product_browser_proof_pending"}, {"gap": "retrieval_index_not_built"}],
        display_payload=source_totals,
    )
    for page_key, title, summary in [
        ("our_business", "Business functions represented", f"{len(function_names)} functions have workforce, application, data, spend, or operations records."),
        ("strategy_value_creation", "Programs and value hypotheses represented", f"{len(programs)} program rows carry funded amount, forecast, target value, status, and dependent applications."),
        ("how_we_operate", "Operating workflows represented", f"{len(workforce)} workforce/persona rows and {len(kpis)} KPI rows support operating-model slices."),
        ("technology_data", "Technology and data estate represented", f"{len(apps)} applications, {len(infrastructure)} infrastructure/platform rows, {len(data_rows)} data/analytics rows, and {len(flows)} data flows are loaded."),
        ("performance_value", "Performance and value measures represented", f"{len(kpis)} KPI rows, {len(finance)} finance rows, and {len(programs)} program-value rows are present; finance validation gates remain explicit."),
        ("leadership_perspective", "Interview themes represented", f"{len(interviews)} interview/source excerpts are available for leadership themes; they remain not reviewed until client validation."),
        ("what_needs_attention", "Known gaps and gates represented", "Projection rows preserve missing evidence, gated values, and retrieval/browser proof gaps instead of converting them to zero."),
        ("what_has_been_loaded", "Source families loaded", f"{len(paths)} source families are present in the dense source room manifest."),
        ("browse_the_record", "Slice and dice record available", "The record browser can slice objects, measures, relationships, contracts, flows, and evidence by owner/function/source family."),
    ]:
        add_home_row(
            page_key=page_key,
            row_key=f"{page_key}_summary",
            section_key="summary",
            row_type="summary",
            title=title,
            summary=summary,
            primary_object_id=enterprise_id,
            metric_keys=[],
            relationship_ids=[],
            source_refs=[{"source_family": "dense_source_room_manifest"}],
            basis_summary="source_recorded_dense_synthetic",
            quality_state="warning" if page_key in {"leadership_perspective", "performance_value", "what_needs_attention"} else "passed",
            gap_flags=[{"gap": "client_review_pending"}] if page_key in {"leadership_perspective", "performance_value"} else [],
            display_payload={"source_totals": source_totals},
        )

    for function_name in function_names:
        function_apps = apps_by_function.get(function_name, [])
        tier1 = sum(1 for row in function_apps if row.get("criticality_tier") == "tier1")
        watch = sum(1 for row in function_apps if row.get("lifecycle_state") != "current")
        total_cost = sum(as_num(row.get("annual_cost_usd")) for row in function_apps)
        add_home_row(
            page_key="current_state_architecture",
            row_key=f"function::{slug(function_name)}",
            section_key="function_architecture",
            row_type="function_architecture",
            title=function_name,
            summary=f"{len(function_apps)} applications, {tier1} tier-1 systems, {watch} lifecycle-watch items, {round(total_cost, 2)} annual cost basis.",
            primary_object_id=object_id("business_function", function_name),
            metric_keys=["annual_cost_usd", "user_count_estimate", "interface_count", "environment_count"],
            relationship_ids=[],
            source_refs=[{"source_family": "SP03_CMDB", "business_function": function_name}],
            basis_summary="source_recorded_cmdb",
            quality_state="passed" if function_apps else "warning",
            display_payload={"application_count": len(function_apps), "tier1_count": tier1, "lifecycle_watch_count": watch, "annual_cost_usd": round(total_cost, 2)},
        )

    for index, row in enumerate(apps, start=1):
        add_home_row(
            page_key="applications_systems",
            row_key=row["application_id"],
            section_key="application_slice",
            row_type="application",
            title=row["application_name"],
            summary=f"{row.get('business_function')} · {row.get('vendor_name')} · {row.get('hosting_model')} · {row.get('criticality_tier')}",
            primary_object_id=object_id("application", row["application_id"]),
            metric_keys=["annual_cost_usd", "user_count_estimate", "interface_count", "environment_count"],
            relationship_ids=[],
            source_refs=source_ref_for_family("SP03_CMDB", row, index),
            basis_summary="source_recorded_cmdb",
            quality_state="passed",
            display_payload=row,
        )

    for index, row in enumerate(infrastructure, start=1):
        add_home_row(
            page_key="infrastructure_platforms",
            row_key=row["platform_id"],
            section_key="infrastructure_slice",
            row_type="infrastructure",
            title=row["platform_name"],
            summary=f"{row.get('platform_type')} · {row.get('hosting_location')} · {row.get('utilization_percent')}% utilized · DR {row.get('dr_tier')}",
            primary_object_id=object_id("infrastructure", row["platform_id"]),
            metric_keys=["capacity_value", "utilization_percent"],
            relationship_ids=[],
            source_refs=source_ref_for_family("SP05_Infrastructure", row, index),
            basis_summary="source_recorded_infrastructure_export",
            quality_state="warning" if as_num(row.get("utilization_percent")) >= 85 else "passed",
            gap_flags=[{"gap": "capacity_pressure_review"}] if as_num(row.get("utilization_percent")) >= 85 else [],
            display_payload=row,
        )

    for index, row in enumerate(contracts, start=1):
        add_home_row(
            page_key="vendor_contracts",
            row_key=row["contract_id"],
            section_key="contract_slice",
            row_type="contract",
            title=f"{row.get('supplier_name')} · {row.get('service_tower')}",
            summary=f"{round(as_num(row.get('annualized_value_usd')), 2)} annualized value; notice window {row.get('notice_window_days')} days; benchmarking right {row.get('benchmarking_right')}.",
            primary_object_id=object_id("contract", row["contract_id"]),
            metric_keys=["contract_annualized_value_usd", "notice_window_days", "minimum_commitment_usd"],
            relationship_ids=[],
            source_refs=source_ref_for_family("SP08_Vendor_Contract", row, index),
            basis_summary="source_recorded_contract_register",
            quality_state="warning" if row.get("benchmarking_right") in {"absent", "limited"} else "passed",
            gap_flags=[{"gap": "commercial_terms_need_review"}] if row.get("benchmarking_right") in {"absent", "limited"} else [],
            display_payload=row,
        )

    for index, row in enumerate(data_rows, start=1):
        add_home_row(
            page_key="data_assets_integrations",
            row_key=row["source_row_id"],
            section_key="data_analytics_slice",
            row_type="data_analytics_workload",
            title=f"{row.get('function')} · {row.get('platform_name')} · {row.get('workload_type')}",
            summary=f"{row.get('workload_count')} workloads, {row.get('active_user_count')} active users, {row.get('data_volume_tb')} TB, {row.get('governance_state')} governance state.",
            primary_object_id=object_id("data_platform", f"{row.get('platform_name')}::{row.get('technology_name')}::{row.get('workload_type')}"),
            metric_keys=["workload_count", "active_user_count", "data_volume_tb"],
            relationship_ids=[],
            source_refs=source_ref_for_family("SP04_Data_BI_ETL", row, index),
            basis_summary="source_recorded_data_analytics_export",
            quality_state="warning" if row.get("governance_state") != "governed" else "passed",
            gap_flags=[{"gap": "governance_state_not_governed", "state": row.get("governance_state")}] if row.get("governance_state") != "governed" else [],
            display_payload=row,
        )

    for index, row in enumerate(flows, start=1):
        add_home_row(
            page_key="current_state_data_flow",
            row_key=row["flow_id"],
            section_key="data_flow",
            row_type="data_flow",
            title=f"{row.get('source_object_ref')} to {row.get('target_object_ref')}",
            summary=f"{row.get('integration_pattern')} · {row.get('landing_layer')} to {row.get('consumption_layer')} · cadence {row.get('cadence')}.",
            primary_object_id=object_id("application", row["source_object_ref"]) if row.get("source_object_ref") in app_by_id else None,
            metric_keys=[],
            relationship_ids=[],
            source_refs=source_ref_for_family("SP13_Data_Flows_Integrations", row, index),
            basis_summary="source_recorded_data_flow_export",
            quality_state="passed" if data_flow_admitted else "blocked",
            admission_status="admitted" if data_flow_admitted else "refused",
            admission_gate_key=None if data_flow_admitted else "end_to_end_data_flow",
            admission_result={} if data_flow_admitted else data_flow_refusal,
            gap_flags=[] if data_flow_admitted else [{"gap": "data_flow_topology_unfit", "measurement": data_flow_refusal["measurement"]}],
            display_payload=row,
        )

    for family, path in paths.items():
        row_count = len(read_csv(path))
        add_home_row(
            page_key="what_has_been_loaded",
            row_key=family,
            section_key="source_family_coverage",
            row_type="source_family",
            title=family,
            summary=f"{row_count} rows loaded from {path.name}.",
            primary_object_id=enterprise_id,
            metric_keys=[],
            relationship_ids=[],
            source_refs=[{"source_family": family, "file_path": path.name, "row_count": row_count}],
            basis_summary="source_file_manifest",
            quality_state="passed",
            display_payload={"file_path": path.name, "row_count": row_count},
        )

    for index, row in enumerate(programs, start=1):
        add_tower_row(
            row_key=f"program::{row['program_id']}",
            page_key="decision_lanes",
            row_type="program_value_gate",
            primary_object_id=object_id("program", row["program_id"]),
            claim_id=f"PROG-CLAIM-{row['program_id']}",
            gate_status="gated",
            gate_reason_code="finance_validation_required",
            gate_reason_detail="Program target value is a planning value until finance validates measured outcome.",
            next_gate="finance_review",
            evidence_needed=["baseline_measure", "actual_measure", "finance_owner_attestation"],
            funded=as_num(row.get("approved_budget_usd")),
            promised=as_num(row.get("target_value_usd")),
            usage_supported=0,
            finance_validated=0,
            claimable=0,
            blocked=as_num(row.get("target_value_usd")),
            proof_score=30,
            risk_score=50 if row.get("status") in {"delayed", "at_risk"} else 35,
            usage_score=None,
            owner_role="program_sponsor",
            handoff_module="Tower",
            metric_keys=["approved_budget_usd", "forecast_usd", "target_value_usd"],
            source_refs=source_ref_for_family("SP07_PPM", row, index),
            gap_flags=[{"gap": "finance_validation_pending"}],
            display_payload=row,
        )

    for index, row in enumerate(ai_rows, start=1):
        licensed = as_num(row.get("licensed_users"))
        active = as_num(row.get("active_users"))
        usage_score = min(100, int(round((active / licensed) * 100))) if licensed else None
        add_tower_row(
            row_key=f"ai::{row['source_row_id']}",
            page_key="ai_portfolio",
            row_type="ai_usage_observation",
            primary_object_id=object_id("ai_use_case", row["use_case_name"]),
            claim_id=None,
            gate_status="not_applicable",
            gate_reason_code=None,
            gate_reason_detail=None,
            next_gate=None,
            evidence_needed=[],
            funded=as_num(row.get("monthly_cost_usd")),
            promised=None,
            usage_supported=None,
            finance_validated=None,
            claimable=None,
            blocked=None,
            proof_score=45,
            risk_score=40,
            usage_score=usage_score,
            owner_role="ai_product_owner",
            handoff_module="Tower",
            value_state="known",
            quality_state="warning",
            metric_keys=["licensed_users", "ai_active_users", "usage_events", "monthly_cost_usd"],
            source_refs=source_ref_for_family("SP11_AI_Usage_Models", row, index),
            gap_flags=[{"gap": "value_outcome_not_finance_validated"}],
            display_payload=row,
        )

    for index, row in enumerate(grc_rows, start=1):
        severity_score = {"critical": 90, "high": 75, "medium": 50, "low": 25}.get(row.get("severity", "").lower(), 50)
        open_exceptions = as_num(row.get("open_exception_count"))
        add_tower_row(
            row_key=f"risk::{row['risk_or_control_id']}",
            page_key="risk_lens",
            row_type="risk_control_observation",
            primary_object_id=object_id("control" if row.get("risk_type") == "control" else "risk", row["risk_or_control_id"]),
            claim_id=None,
            gate_status="not_applicable",
            gate_reason_code=None,
            gate_reason_detail=None,
            next_gate=None,
            evidence_needed=[],
            proof_score=55 if row.get("evidence_ref") else 20,
            risk_score=severity_score,
            owner_role="risk_owner",
            handoff_module="Tower",
            metric_keys=["open_exception_count"],
            source_refs=source_ref_for_family("SP09_GRC", row, index),
            gap_flags=[{"gap": "open_control_exception", "count": open_exceptions}] if open_exceptions else [],
            display_payload=row,
        )

    intelligence_surfaces = [
        ("advisory_page", [{"fact": "loaded_sources", "value": len(paths)}, {"fact": "objects_and_relationships_available", "value": True}]),
        ("enterprise_landscape", [{"fact": "application_count", "value": len(apps)}, {"fact": "function_count", "value": len(function_names)}]),
        ("ask_query_api", [{"fact": "context_pack_id", "value": context_pack_id()}, {"fact": "retrieval_state", "value": "not_indexed"}]),
        ("insights_evaluate", [{"fact": "risk_rows", "value": len(grc_rows)}, {"fact": "program_rows", "value": len(programs)}]),
        ("pattern_detail", [{"fact": "flow_rows", "value": len(flows)}, {"fact": "contract_scope_rows", "value": sum(len(row.get("scoped_applications", "").split(";")) for row in contracts)}]),
        ("context_summary", [{"fact": "source_hash_basis", "value": "dense_source_room"}, {"fact": "source_record_count", "value": sum(len(read_csv(path)) for path in paths.values())}]),
        ("source_context", [{"fact": "contract_count", "value": len(contracts)}, {"fact": "vendor_count", "value": len(vendor_contracts)}]),
        ("tower_context", [{"fact": "tower_rows", "value": len(tower_rows)}, {"fact": "claimable_value_rows", "value": 0}]),
        ("ai_context", [{"fact": "ai_usage_rows", "value": len(ai_rows)}, {"fact": "ai_use_case_rows", "value": len({row.get("use_case_name") for row in ai_rows})}]),
    ]
    for surface_key, facts in intelligence_surfaces:
        add_intelligence_row(
            surface_key=surface_key,
            row_key=surface_key,
            primary_object_id=enterprise_id,
            permitted_facts=facts,
            blocked_facts=[{"reason": "retrieval_index_not_built", "state": "not_indexed"}],
            citations=[{"context_pack_id": context_pack_id(), "basis": "ecl_context.context_pack"}],
            gap_flags=[{"gap": "retrieval_index_not_built"}, {"gap": "citation_render_proof_pending"}],
        )

    row_counts.update(
        {
            "projection_entry": len(projection_entries),
            "projection_entry_object_ref": len(projection_object_refs),
            "projection_entry_metric_ref": len(projection_metric_refs),
            "projection_entry_measure_ref": len(projection_measure_refs),
            "projection_entry_relationship_ref": len(projection_relationship_refs),
            "projection_entry_source_record_ref": len(projection_source_record_refs),
            "projection_entry_document_extraction_ref": len(projection_document_extraction_refs),
            "home_enterprise_landscape": len(home_rows),
            "source_contract_360": len(contract_projection),
            "source_vendor_360": len(vendor_projection),
            "source_value_levers": len(value_levers),
            "source_event_workspace": len(event_rows),
            "tower_command_center": len(tower_rows),
            "intelligence_context_pack": len(intelligence_rows),
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
                "quality_state": source_layer.sql_text("warning" if projection_key in {"home_enterprise_landscape", "source_contract_360", "source_vendor_360", "source_event_workspace", "tower_command_center", "intelligence_context_pack"} else "passed"),
                "admission_status": source_layer.sql_text("not_applicable"),
                "admission_gate_results_json": source_layer.sql_json([]),
                "gated_claim_count": str(
                    row_counts[projection_key]
                    if projection_key in {"source_value_levers", "source_event_workspace", "tower_command_center"}
                    else 0
                ),
                "proof_uri": source_layer.sql_text("local-disposable-postgres"),
            }
        )

    columns = {
        "ecl_projection.projection_manifest": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_key", "projection_version", "rebuild_command", "source_hash", "projection_hash", "row_count", "quality_state", "admission_status", "admission_gate_results_json", "gated_claim_count", "proof_uri"],
        "ecl_projection.projection_entry": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "surface_key", "row_key", "row_type", "source_hash", "refs_content_hash", "refs_cache_json", "display_cache_json"],
        "ecl_projection.projection_entry_object_ref": ["tenant_key", "assessment_id", "projection_entry_id", "object_id", "ref_role", "sort_order", "source_hash"],
        "ecl_projection.projection_entry_metric_ref": ["tenant_key", "assessment_id", "projection_entry_id", "metric_key", "ref_role", "sort_order", "source_hash"],
        "ecl_projection.projection_entry_measure_ref": ["tenant_key", "assessment_id", "projection_entry_id", "measure_id", "ref_role", "sort_order", "source_hash"],
        "ecl_projection.projection_entry_relationship_ref": ["tenant_key", "assessment_id", "projection_entry_id", "relationship_id", "ref_role", "sort_order", "source_hash"],
        "ecl_projection.projection_entry_source_record_ref": ["tenant_key", "assessment_id", "projection_entry_id", "source_record_id", "ref_role", "sort_order", "source_hash"],
        "ecl_projection.projection_entry_document_extraction_ref": ["tenant_key", "assessment_id", "projection_entry_id", "document_extraction_id", "ref_role", "sort_order", "source_hash"],
        "ecl_projection.home_enterprise_landscape": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "page_key", "row_key", "section_key", "row_type", "title", "summary", "primary_object_id", "metric_keys_json", "relationship_ids_json", "source_refs_json", "basis_summary", "value_state", "quality_state", "admission_status", "admission_gate_key", "admission_result_json", "gap_flags_json", "display_payload_json", "source_hash"],
        "ecl_projection.source_contract_360": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "contract_id", "contract_object_id", "vendor_object_id", "contract_name", "vendor_name", "renewal_notice_date", "end_date", "annualized_value_usd", "total_contract_value_usd", "value_state", "quality_state", "service_lines_json", "scope_json", "spend_summary_json", "sla_summary_json", "document_proof_json", "gap_flags_json", "source_refs_json", "source_hash"],
        "ecl_projection.source_vendor_360": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "vendor_object_id", "vendor_name", "contract_count", "covered_object_count", "annualized_spend_usd", "renewal_exposure_usd", "value_state", "quality_state", "contract_ids_json", "covered_objects_json", "spend_summary_json", "sla_summary_json", "risk_control_json", "gap_flags_json", "source_refs_json", "source_hash"],
        "ecl_projection.source_value_levers": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "lever_type", "opportunity_type", "opportunity_title", "contract_id", "contract_object_id", "vendor_object_id", "primary_metric_key", "baseline_spend_usd", "addressable_spend_usd", "estimated_value_low_usd", "estimated_value_high_usd", "claimable_value_usd", "blocked_value_usd", "value_gate_status", "value_gate_reason_code", "value_gate_reason_detail", "evidence_state", "confidence", "affected_scope_json", "benchmark_context_json", "protection_context_json", "next_action_json", "metric_keys_json", "source_refs_json", "gap_flags_json", "source_hash"],
        "ecl_projection.source_event_workspace": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "workspace_tab", "row_type", "event_key", "event_title", "contract_id", "contract_object_id", "vendor_object_id", "review_event_id", "event_stage", "event_status", "gate_status", "gate_reason_code", "gate_reason_detail", "owner_role", "due_date", "evidence_needed_json", "decision_context_json", "next_action_json", "source_refs_json", "gap_flags_json", "source_hash"],
        "ecl_projection.tower_command_center": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "page_key", "row_type", "primary_object_id", "claim_id", "claim_gate_status", "claim_gate_reason_code", "claim_gate_reason_detail", "next_gate", "evidence_needed_json", "funded_amount_usd", "promised_value_usd", "usage_supported_value_usd", "finance_validated_value_usd", "claimable_value_usd", "blocked_value_usd", "proof_maturity_score", "risk_pressure_score", "usage_strength_score", "owner_role", "handoff_module", "value_state", "quality_state", "metric_keys_json", "source_refs_json", "gap_flags_json", "display_payload_json", "source_hash"],
        "ecl_projection.intelligence_context_pack": ["id", "tenant_key", "assessment_id", "snapshot_id", "context_pack_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "surface_key", "primary_object_id", "prompt_context_json", "permitted_facts_json", "blocked_facts_json", "citation_refs_json", "retrieval_state", "value_state", "quality_state", "access_class", "gap_flags_json", "source_hash"],
    }
    sql_path = out_dir / "dense_source_room_ecl_source_projection_load.sql"
    sql_parts = ["begin;"]
    sql_parts.append(insert_sql("ecl_projection.projection_manifest", columns["ecl_projection.projection_manifest"], manifests))
    sql_parts.append(insert_sql("ecl_projection.projection_entry", columns["ecl_projection.projection_entry"], projection_entries))
    sql_parts.append(insert_sql("ecl_projection.home_enterprise_landscape", columns["ecl_projection.home_enterprise_landscape"], home_rows))
    sql_parts.append(insert_sql("ecl_projection.source_contract_360", columns["ecl_projection.source_contract_360"], contract_projection))
    sql_parts.append(insert_sql("ecl_projection.source_vendor_360", columns["ecl_projection.source_vendor_360"], vendor_projection))
    sql_parts.append(insert_sql("ecl_projection.source_value_levers", columns["ecl_projection.source_value_levers"], value_levers))
    sql_parts.append(insert_sql("ecl_projection.source_event_workspace", columns["ecl_projection.source_event_workspace"], event_rows))
    sql_parts.append(insert_sql("ecl_projection.tower_command_center", columns["ecl_projection.tower_command_center"], tower_rows))
    sql_parts.append(insert_sql("ecl_projection.intelligence_context_pack", columns["ecl_projection.intelligence_context_pack"], intelligence_rows))
    sql_parts.append(insert_sql("ecl_projection.projection_entry_object_ref", columns["ecl_projection.projection_entry_object_ref"], projection_object_refs))
    sql_parts.append(insert_sql("ecl_projection.projection_entry_metric_ref", columns["ecl_projection.projection_entry_metric_ref"], projection_metric_refs))
    sql_parts.append(insert_sql("ecl_projection.projection_entry_measure_ref", columns["ecl_projection.projection_entry_measure_ref"], projection_measure_refs))
    sql_parts.append(insert_sql("ecl_projection.projection_entry_relationship_ref", columns["ecl_projection.projection_entry_relationship_ref"], projection_relationship_refs))
    sql_parts.append(insert_sql("ecl_projection.projection_entry_source_record_ref", columns["ecl_projection.projection_entry_source_record_ref"], projection_source_record_refs))
    sql_parts.append(insert_sql("ecl_projection.projection_entry_document_extraction_ref", columns["ecl_projection.projection_entry_document_extraction_ref"], projection_document_extraction_refs))
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
  'projection_entry', (select count(*) from ecl_projection.projection_entry),
  'projection_entry_object_ref', (select count(*) from ecl_projection.projection_entry_object_ref),
  'projection_entry_metric_ref', (select count(*) from ecl_projection.projection_entry_metric_ref),
  'projection_entry_measure_ref', (select count(*) from ecl_projection.projection_entry_measure_ref),
  'projection_entry_relationship_ref', (select count(*) from ecl_projection.projection_entry_relationship_ref),
  'projection_entry_source_record_ref', (select count(*) from ecl_projection.projection_entry_source_record_ref),
  'projection_entry_document_extraction_ref', (select count(*) from ecl_projection.projection_entry_document_extraction_ref),
  'home_enterprise_landscape', (select count(*) from ecl_projection.home_enterprise_landscape),
  'source_contract_360', (select count(*) from ecl_projection.source_contract_360),
  'source_vendor_360', (select count(*) from ecl_projection.source_vendor_360),
  'source_value_levers', (select count(*) from ecl_projection.source_value_levers),
  'source_event_workspace', (select count(*) from ecl_projection.source_event_workspace),
  'tower_command_center', (select count(*) from ecl_projection.tower_command_center),
  'intelligence_context_pack', (select count(*) from ecl_projection.intelligence_context_pack),
  'source_value_claimable_rows', (select count(*) from ecl_projection.source_value_levers where claimable_value_usd > 0),
  'source_value_gated_rows', (select count(*) from ecl_projection.source_value_levers where value_gate_status in ('gated','blocked')),
  'event_rows_without_evidence_payload', (select count(*) from ecl_projection.source_event_workspace where gate_status in ('gated','blocked') and jsonb_array_length(evidence_needed_json) = 0),
  'projection_entry_count_drift', (
    select abs(
      (select count(*) from ecl_projection.projection_entry)
      - (
        (select count(*) from ecl_projection.home_enterprise_landscape)
        + (select count(*) from ecl_projection.source_contract_360)
        + (select count(*) from ecl_projection.source_vendor_360)
        + (select count(*) from ecl_projection.source_value_levers)
        + (select count(*) from ecl_projection.source_event_workspace)
        + (select count(*) from ecl_projection.tower_command_center)
        + (select count(*) from ecl_projection.intelligence_context_pack)
      )
    )
  ),
  'projection_surface_entry_drift', (
    select count(*) from (
      select tenant_key, assessment_id, projection_entry_id from ecl_projection.home_enterprise_landscape
      union all select tenant_key, assessment_id, projection_entry_id from ecl_projection.source_contract_360
      union all select tenant_key, assessment_id, projection_entry_id from ecl_projection.source_vendor_360
      union all select tenant_key, assessment_id, projection_entry_id from ecl_projection.source_value_levers
      union all select tenant_key, assessment_id, projection_entry_id from ecl_projection.source_event_workspace
      union all select tenant_key, assessment_id, projection_entry_id from ecl_projection.tower_command_center
      union all select tenant_key, assessment_id, projection_entry_id from ecl_projection.intelligence_context_pack
    ) p
    left join ecl_projection.projection_entry pe
      on pe.tenant_key = p.tenant_key
      and pe.assessment_id = p.assessment_id
      and pe.id = p.projection_entry_id
    where pe.id is null
  ),
  'projection_entry_metric_ref_drift', (
    select count(*) from ecl_projection.projection_entry_metric_ref pemr
    left join ecl_context.metric_definition md
      on md.tenant_key = pemr.tenant_key
      and md.metric_key = pemr.metric_key
    where md.metric_key is null
  ),
  'projection_entry_object_ref_drift', (
    select count(*) from ecl_projection.projection_entry_object_ref peor
    left join ecl_context.object o
      on o.tenant_key = peor.tenant_key
      and o.assessment_id = peor.assessment_id
      and o.id = peor.object_id
    where o.id is null
  ),
  'projection_entry_source_record_ref_drift', (
    select count(*) from ecl_projection.projection_entry_source_record_ref pesr
    left join ecl_source.source_record sr
      on sr.tenant_key = pesr.tenant_key
      and sr.assessment_id = pesr.assessment_id
      and sr.id = pesr.source_record_id
    where sr.id is null
  ),
  'home_primary_object_drift', (
    select count(*) from ecl_projection.home_enterprise_landscape p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.primary_object_id
    where p.primary_object_id is not null and o.id is null
  ),
  'home_refusal_without_payload', (
    select count(*) from ecl_projection.home_enterprise_landscape
    where admission_status = 'refused' and (admission_gate_key is null or admission_result_json = '{}'::jsonb)
  ),
  'home_application_count_basis_drift', (
    select abs(
      (select count(*) from ecl_projection.home_enterprise_landscape where page_key = 'applications_systems')
      - (select count(*) from ecl_context.application_v)
    )
  ),
  'home_application_page_deployment_rows', (
    select count(*)
    from ecl_projection.home_enterprise_landscape p
    join ecl_context.application_deployment_v d
      on d.tenant_key = p.tenant_key
      and d.assessment_id = p.assessment_id
      and d.id = p.primary_object_id
    where p.page_key = 'applications_systems'
  ),
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
  ),
  'tower_primary_object_drift', (
    select count(*) from ecl_projection.tower_command_center p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.primary_object_id
    where p.primary_object_id is not null and o.id is null
  ),
  'tower_gated_without_reason', (
    select count(*) from ecl_projection.tower_command_center
    where claim_gate_status in ('gated','blocked') and claim_gate_reason_code is null
  ),
  'intelligence_context_pack_drift', (
    select count(*) from ecl_projection.intelligence_context_pack p
    left join ecl_context.context_pack cp on cp.tenant_key = p.tenant_key and cp.assessment_id = p.assessment_id and cp.id = p.context_pack_id
    where cp.id is null
  ),
  'intelligence_primary_object_drift', (
    select count(*) from ecl_projection.intelligence_context_pack p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.primary_object_id
    where p.primary_object_id is not null and o.id is null
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
        bad_entry_fk_sql = "insert into ecl_projection.source_contract_360 (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, row_key, contract_id, contract_object_id, vendor_object_id, contract_name, vendor_name, value_state, quality_state, source_hash) select p.tenant_key, p.assessment_id, p.snapshot_id, p.projection_manifest_id, gen_random_uuid(), p.projection_version, 'bad-entry-fk', p.contract_id, p.contract_object_id, p.vendor_object_id, p.contract_name, p.vendor_name, p.value_state, p.quality_state, 'bad' from ecl_projection.source_contract_360 p limit 1;"
        bad_value_metric_sql = "insert into ecl_projection.source_value_levers (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, row_key, lever_type, opportunity_type, opportunity_title, contract_id, contract_object_id, vendor_object_id, primary_metric_key, claimable_value_usd, value_gate_status, value_gate_reason_code, value_gate_reason_detail, evidence_state, source_hash) select p.tenant_key, p.assessment_id, p.snapshot_id, p.projection_manifest_id, p.projection_entry_id, p.projection_version, 'bad-metric', p.lever_type, p.opportunity_type, p.opportunity_title, p.contract_id, p.contract_object_id, p.vendor_object_id, 'invented_metric_key', 0, 'gated', 'test', 'test', 'source_recorded', 'bad' from ecl_projection.source_value_levers p limit 1;"
        bad_event_payload_sql = "insert into ecl_projection.source_event_workspace (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, row_key, workspace_tab, row_type, event_key, event_title, contract_id, contract_object_id, vendor_object_id, review_event_id, event_stage, event_status, gate_status, gate_reason_code, gate_reason_detail, owner_role, source_hash) select tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, 'bad-event-payload', workspace_tab, row_type, 'bad-event', event_title, contract_id, contract_object_id, vendor_object_id, review_event_id, event_stage, event_status, 'blocked', 'test', 'test', owner_role, 'bad' from ecl_projection.source_event_workspace limit 1;"
        bad_home_refusal_sql = "insert into ecl_projection.home_enterprise_landscape (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, page_key, row_key, section_key, row_type, title, primary_object_id, basis_summary, value_state, quality_state, admission_status, source_hash) select tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, page_key, 'bad-refusal', section_key, row_type, title, primary_object_id, basis_summary, value_state, quality_state, 'refused', 'bad' from ecl_projection.home_enterprise_landscape limit 1;"
        bad_tower_gate_sql = "insert into ecl_projection.tower_command_center (tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, row_key, page_key, row_type, primary_object_id, claim_gate_status, value_state, quality_state, source_hash) select tenant_key, assessment_id, snapshot_id, projection_manifest_id, projection_entry_id, projection_version, 'bad-gate', page_key, row_type, primary_object_id, 'blocked', value_state, quality_state, 'bad' from ecl_projection.tower_command_center limit 1;"
        bad_intelligence_context_sql = "insert into ecl_projection.intelligence_context_pack (tenant_key, assessment_id, snapshot_id, context_pack_id, projection_manifest_id, projection_entry_id, projection_version, row_key, surface_key, retrieval_state, value_state, quality_state, access_class, source_hash) select tenant_key, assessment_id, snapshot_id, gen_random_uuid(), projection_manifest_id, projection_entry_id, projection_version, 'bad-context-pack', surface_key, retrieval_state, value_state, quality_state, access_class, 'bad' from ecl_projection.intelligence_context_pack limit 1;"
        planted_failures = []
        for key, sql in [
            ("projection_surface_entry_fk", bad_entry_fk_sql),
            ("source_value_lever_metric_fk", bad_value_metric_sql),
            ("source_event_workspace_gate_payload_check", bad_event_payload_sql),
            ("home_refusal_payload_check", bad_home_refusal_sql),
            ("tower_gate_reason_check", bad_tower_gate_sql),
            ("intelligence_context_pack_fk", bad_intelligence_context_sql),
        ]:
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
    for drift_key in [
        "home_primary_object_drift",
        "home_refusal_without_payload",
        "home_application_count_basis_drift",
        "home_application_page_deployment_rows",
        "contract_projection_contract_drift",
        "vendor_projection_vendor_drift",
        "value_lever_metric_drift",
        "event_review_drift",
        "event_rows_without_evidence_payload",
        "projection_entry_count_drift",
        "projection_surface_entry_drift",
        "projection_entry_metric_ref_drift",
        "projection_entry_object_ref_drift",
        "projection_entry_source_record_ref_drift",
        "tower_primary_object_drift",
        "tower_gated_without_reason",
        "intelligence_context_pack_drift",
        "intelligence_primary_object_drift",
    ]:
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
