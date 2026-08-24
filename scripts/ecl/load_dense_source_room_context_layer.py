#!/usr/bin/env python3

"""Load dense source-room extracts into ecl_source and ecl_context locally.

Local proof only. This runner reuses the dense source-room source-layer builder,
then emits canonical context objects, relationships, metric definitions,
measures, one snapshot, and one context pack into disposable Postgres.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import load_dense_source_room_source_layer as source_layer


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-context-layer-local-load-2026-08-23"
TENANT_KEY = "meridian-health"
ASSESSMENT_ID = "assessment-dense-source-room-20260823"
DDL_FILES = [
    ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def source_record_id(family: str, row: dict[str, str], index: int) -> str:
    return source_layer.stable_uuid("source_record", family, row.get("source_row_id") or index)


def object_id(object_type: str, object_key: str) -> str:
    return source_layer.stable_uuid("object", object_type, object_key)


def measure_id(subject_id: str, metric_key: str, source_id: str) -> str:
    return source_layer.stable_uuid("measure", subject_id, metric_key, source_id)


def as_num(value: str | None) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace(",", ""))
    except ValueError:
        return None


def metric_part(value: str | None) -> str:
    text = (value or "unknown").strip().lower()
    return "".join(char if char.isalnum() else "_" for char in text).strip("_") or "unknown"


def period_dates(period: str | None) -> tuple[str | None, str | None, str]:
    if not period:
        return None, None, "current"
    if period.endswith("-Q1"):
        return f"{period[:4]}-01-01", f"{period[:4]}-03-31", "actual"
    if period.endswith("-Q2"):
        return f"{period[:4]}-04-01", f"{period[:4]}-06-30", "actual"
    if period.endswith("-Q3"):
        return f"{period[:4]}-07-01", f"{period[:4]}-09-30", "actual"
    if period.endswith("-Q4"):
        return f"{period[:4]}-10-01", f"{period[:4]}-12-31", "actual"
    if len(period) == 7 and period[4] == "-":
        return f"{period}-01", f"{period}-28", "actual"
    return None, None, "current"


def lifecycle_state(value: str | None) -> str:
    normalized = (value or "current").strip().lower()
    if normalized in {"current", "target", "planned", "actual", "baseline", "forecast", "benchmark", "retired", "candidate"}:
        return normalized
    if normalized in {"watch", "watchlist", "monitor", "replace", "replace_candidate", "sunset"}:
        return "candidate"
    if normalized in {"active", "production"}:
        return "current"
    return "current"


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    if not rows:
        return ""
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


class ContextBuilder:
    def __init__(self, dense_out_dir: Path) -> None:
        self.dense_out_dir = dense_out_dir
        self.rows_by_family: dict[str, list[dict[str, str]]] = {}
        self.manifest = read_csv(dense_out_dir / "dense_source_room_manifest.csv")
        for entry in self.manifest:
            self.rows_by_family[entry["source_room_family"]] = read_csv(dense_out_dir / entry["file_path"])

        self.objects: dict[str, dict[str, str]] = {}
        self.object_lookup: dict[tuple[str, str], str] = {}
        self.relationships: dict[tuple[str, str, str], dict[str, str]] = {}
        self.metric_definitions: dict[str, dict[str, str]] = {}
        self.measures: dict[str, dict[str, str]] = {}

    def add_object(
        self,
        *,
        object_type: str,
        object_key: str,
        display_name: str,
        business_domain: str | None,
        source_id: str,
        attributes: dict[str, Any],
        lifecycle_state: str = "current",
        basis: str = "source_recorded",
        value_state: str = "known",
        confidence: float | None = None,
    ) -> str:
        lookup_key = (object_type, object_key)
        if lookup_key in self.object_lookup:
            return self.object_lookup[lookup_key]
        oid = object_id(object_type, object_key)
        self.object_lookup[lookup_key] = oid
        self.objects[oid] = {
            "id": source_layer.sql_text(oid),
            "tenant_key": source_layer.sql_text(TENANT_KEY),
            "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
            "object_key": source_layer.sql_text(object_key),
            "object_type": source_layer.sql_text(object_type),
            "display_name": source_layer.sql_text(display_name),
            "business_domain": source_layer.sql_text(business_domain),
            "lifecycle_state": source_layer.sql_text(lifecycle_state),
            "source_record_id": source_layer.sql_text(source_id),
            "basis": source_layer.sql_text(basis),
            "value_state": source_layer.sql_text(value_state),
            "review_state": source_layer.sql_text("not_reviewed"),
            "confidence": source_layer.sql_num(confidence),
            "attributes_json": source_layer.sql_json(attributes),
        }
        return oid

    def maybe_object(self, object_key: str | None) -> str | None:
        if not object_key:
            return None
        for object_type in ("application", "application_deployment", "infrastructure", "data_platform", "vendor", "contract", "program", "ai_tool", "ai_use_case", "business_function", "risk", "control"):
            found = self.object_lookup.get((object_type, object_key))
            if found:
                return found
        return None

    def add_relationship(self, from_id: str | None, rel_type: str, to_id: str | None, source_id: str, attributes: dict[str, Any]) -> None:
        if not from_id or not to_id or from_id == to_id:
            return
        key = (from_id, rel_type, to_id)
        if key in self.relationships:
            return
        self.relationships[key] = {
            "id": source_layer.sql_text(source_layer.stable_uuid("relationship", *key)),
            "tenant_key": source_layer.sql_text(TENANT_KEY),
            "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
            "from_object_id": source_layer.sql_text(from_id),
            "relationship_type": source_layer.sql_text(rel_type),
            "to_object_id": source_layer.sql_text(to_id),
            "direction_label": source_layer.sql_text(rel_type.lower()),
            "source_record_id": source_layer.sql_text(source_id),
            "basis": source_layer.sql_text("source_recorded"),
            "value_state": source_layer.sql_text("known"),
            "review_state": source_layer.sql_text("not_reviewed"),
            "confidence": "null",
            "attributes_json": source_layer.sql_json(attributes),
        }

    def add_metric_definition(self, metric_key: str, metric_name: str, unit: str, directionality: str = "neutral", cadence: str = "point_in_time", aggregation_rule: str = "sum") -> None:
        if metric_key in self.metric_definitions:
            return
        self.metric_definitions[metric_key] = {
            "id": source_layer.sql_text(source_layer.stable_uuid("metric_definition", TENANT_KEY, metric_key)),
            "tenant_key": source_layer.sql_text(TENANT_KEY),
            "metric_key": source_layer.sql_text(metric_key),
            "metric_name": source_layer.sql_text(metric_name),
            "definition": source_layer.sql_text(f"Dense source-room metric: {metric_name}"),
            "unit": source_layer.sql_text(unit),
            "directionality": source_layer.sql_text(directionality),
            "cadence": source_layer.sql_text(cadence),
            "aggregation_rule": source_layer.sql_text(aggregation_rule),
        }

    def add_measure(
        self,
        *,
        subject_id: str | None,
        metric_key: str,
        metric_name: str,
        value: float | None,
        unit: str,
        source_id: str,
        period: str | None = None,
        directionality: str = "neutral",
        cadence: str = "point_in_time",
        aggregation_rule: str = "sum",
        quality_state: str = "estimated",
        basis: str = "source_recorded",
    ) -> None:
        if not subject_id or value is None:
            return
        self.add_metric_definition(metric_key, metric_name, unit, directionality, cadence, aggregation_rule)
        start, end, scenario = period_dates(period)
        mid = measure_id(subject_id, metric_key, source_id)
        self.measures[mid] = {
            "id": source_layer.sql_text(mid),
            "tenant_key": source_layer.sql_text(TENANT_KEY),
            "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
            "subject_object_id": source_layer.sql_text(subject_id),
            "metric_key": source_layer.sql_text(metric_key),
            "value_number": source_layer.sql_num(value),
            "value_text": "null",
            "unit": source_layer.sql_text(unit),
            "period_start": source_layer.sql_text(start),
            "period_end": source_layer.sql_text(end),
            "scenario": source_layer.sql_text(scenario),
            "source_record_id": source_layer.sql_text(source_id),
            "document_extraction_id": "null",
            "basis": source_layer.sql_text(basis),
            "value_state": source_layer.sql_text("known"),
            "quality_state": source_layer.sql_text(quality_state),
            "review_state": source_layer.sql_text("not_reviewed"),
            "attributes_json": source_layer.sql_json({"source": "dense_source_room_context_layer"}),
        }

    def build(self) -> dict[str, list[dict[str, str]]]:
        enterprise_source = source_record_id("SP03_CMDB", self.rows_by_family["SP03_CMDB"][0], 1)
        enterprise_id = self.add_object(
            object_type="enterprise",
            object_key="MERIDIAN-HEALTH",
            display_name="Meridian Health",
            business_domain="Enterprise",
            source_id=enterprise_source,
            attributes={"profile_anchor": "$20B integrated payer-provider synthetic estate"},
        )

        function_ids: dict[str, str] = {}
        vendor_ids: dict[str, str] = {}

        def function(name: str | None, source_id: str) -> str | None:
            if not name:
                return None
            if name not in function_ids:
                function_ids[name] = self.add_object(
                    object_type="business_function",
                    object_key=name,
                    display_name=name,
                    business_domain=name,
                    source_id=source_id,
                    attributes={"source_family": "multi_family_function_reference"},
                )
                self.add_relationship(enterprise_id, "HAS_FUNCTION", function_ids[name], source_id, {})
            return function_ids[name]

        def vendor(name: str | None, source_id: str) -> str | None:
            if not name:
                return None
            if name not in vendor_ids:
                vendor_ids[name] = self.add_object(
                    object_type="vendor",
                    object_key=name,
                    display_name=name,
                    business_domain="Vendor / Commercial",
                    source_id=source_id,
                    attributes={"source_family": "multi_family_vendor_reference"},
                )
            return vendor_ids[name]

        for index, row in enumerate(self.rows_by_family["SP02_HRIS"], start=1):
            sid = source_record_id("SP02_HRIS", row, index)
            func_id = function(row.get("function"), sid)
            role_key = f"{row.get('function')}::{row.get('role_family')}::{row.get('location_segment')}"
            persona_id = self.add_object(
                object_type="persona",
                object_key=role_key,
                display_name=f"{row.get('function')} {row.get('role_family')} ({row.get('location_segment')})",
                business_domain=row.get("function"),
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(persona_id, "USED_BY", func_id, sid, {"relationship_basis": "workforce_role_segment"})
            self.add_measure(subject_id=persona_id, metric_key="employee_count", metric_name="Employee count", value=as_num(row.get("employee_count")), unit="count", source_id=sid)
            self.add_measure(subject_id=persona_id, metric_key="contractor_count", metric_name="Contractor count", value=as_num(row.get("contractor_count")), unit="count", source_id=sid)
            self.add_measure(subject_id=persona_id, metric_key="open_requisition_count", metric_name="Open requisition count", value=as_num(row.get("open_requisition_count")), unit="count", source_id=sid)
            self.add_measure(subject_id=persona_id, metric_key="attrition_rate", metric_name="Attrition rate", value=as_num(row.get("attrition_rate")), unit="ratio", source_id=sid, aggregation_rule="avg")

        for index, row in enumerate(self.rows_by_family["SP03_CMDB"], start=1):
            sid = source_record_id("SP03_CMDB", row, index)
            func_id = function(row.get("business_function"), sid)
            vendor_id = vendor(row.get("vendor_name"), sid)
            app_id = self.add_object(
                object_type="application",
                object_key=row["application_id"],
                display_name=row["application_name"],
                business_domain=row.get("application_domain"),
                source_id=sid,
                lifecycle_state=lifecycle_state(row.get("lifecycle_state")),
                attributes=row,
            )
            self.add_relationship(func_id, "SUPPORTED_BY", app_id, sid, {})
            self.add_relationship(app_id, "SUPPLIED_BY", vendor_id, sid, {})
            self.add_measure(subject_id=app_id, metric_key="annual_cost_usd", metric_name="Annual cost", value=as_num(row.get("annual_cost_usd")), unit="USD", source_id=sid, cadence="annual")
            self.add_measure(subject_id=app_id, metric_key="user_count_estimate", metric_name="User count estimate", value=as_num(row.get("user_count_estimate")), unit="users", source_id=sid)
            self.add_measure(subject_id=app_id, metric_key="interface_count", metric_name="Interface count", value=as_num(row.get("interface_count")), unit="count", source_id=sid)
            self.add_measure(subject_id=app_id, metric_key="environment_count", metric_name="Environment count", value=as_num(row.get("environment_count")), unit="count", source_id=sid)

        for index, row in enumerate(self.rows_by_family["SP05_Infrastructure"], start=1):
            sid = source_record_id("SP05_Infrastructure", row, index)
            func_id = function(row.get("business_function"), sid)
            infra_id = self.add_object(
                object_type="infrastructure",
                object_key=row["platform_id"],
                display_name=row["platform_name"],
                business_domain=row.get("business_function"),
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(func_id, "SUPPORTED_BY", infra_id, sid, {"relationship_basis": "hosting_platform_function_alignment"})
            self.add_measure(subject_id=infra_id, metric_key="capacity_value", metric_name="Capacity value", value=as_num(row.get("capacity_value")), unit=row.get("capacity_unit") or "count", source_id=sid)
            self.add_measure(subject_id=infra_id, metric_key="utilization_percent", metric_name="Utilization percent", value=as_num(row.get("utilization_percent")), unit="percent", source_id=sid, aggregation_rule="avg")
            platform_type = metric_part(row.get("platform_type"))
            self.add_measure(subject_id=infra_id, metric_key=f"{platform_type}_capacity_value", metric_name=f"{row.get('platform_type')} capacity value", value=as_num(row.get("capacity_value")), unit=row.get("capacity_unit") or "count", source_id=sid)
            self.add_measure(subject_id=infra_id, metric_key=f"{platform_type}_utilization_percent", metric_name=f"{row.get('platform_type')} utilization percent", value=as_num(row.get("utilization_percent")), unit="percent", source_id=sid, aggregation_rule="avg")

        for index, row in enumerate(self.rows_by_family["SP14_Deployments_Hosting"], start=1):
            sid = source_record_id("SP14_Deployments_Hosting", row, index)
            app_id = self.object_lookup.get(("application", row.get("application_id", "")))
            infra_id = self.object_lookup.get(("infrastructure", row.get("hosting_platform_ref", "")))
            deploy_id = self.add_object(
                object_type="application_deployment",
                object_key=row["deployment_id"],
                display_name=f"{row.get('application_id')} {row.get('environment')} deployment",
                business_domain=row.get("region_or_location"),
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(deploy_id, "DEPLOYMENT_OF", app_id, sid, {"environment": row.get("environment")})
            self.add_relationship(deploy_id, "HOSTED_ON", infra_id, sid, {"hosting_model": row.get("hosting_model")})

        for index, row in enumerate(self.rows_by_family["SP04_Data_BI_ETL"], start=1):
            sid = source_record_id("SP04_Data_BI_ETL", row, index)
            func_id = function(row.get("function"), sid)
            platform_key = f"{row.get('platform_name')}::{row.get('technology_name')}::{row.get('workload_type')}"
            platform_id = self.add_object(
                object_type="data_platform",
                object_key=platform_key,
                display_name=row["platform_name"],
                business_domain=row.get("function"),
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(platform_id, "USED_BY", func_id, sid, {"workload_type": row.get("workload_type")})
            self.add_measure(subject_id=platform_id, metric_key="workload_count", metric_name="Workload count", value=as_num(row.get("workload_count")), unit="count", source_id=sid)
            self.add_measure(subject_id=platform_id, metric_key="active_user_count", metric_name="Active user count", value=as_num(row.get("active_user_count")), unit="users", source_id=sid)
            self.add_measure(subject_id=platform_id, metric_key="data_volume_tb", metric_name="Data volume", value=as_num(row.get("data_volume_tb")), unit="TB", source_id=sid)
            workload = metric_part(row.get("workload_type"))
            self.add_measure(subject_id=platform_id, metric_key=f"{workload}_workload_count", metric_name=f"{row.get('workload_type')} workload count", value=as_num(row.get("workload_count")), unit="count", source_id=sid)
            self.add_measure(subject_id=platform_id, metric_key=f"{workload}_active_user_count", metric_name=f"{row.get('workload_type')} active user count", value=as_num(row.get("active_user_count")), unit="users", source_id=sid)
            self.add_measure(subject_id=platform_id, metric_key=f"{workload}_data_volume_tb", metric_name=f"{row.get('workload_type')} data volume", value=as_num(row.get("data_volume_tb")), unit="TB", source_id=sid)

        for index, row in enumerate(self.rows_by_family["SP06_Finance_ERP"], start=1):
            sid = source_record_id("SP06_Finance_ERP", row, index)
            func_id = function(row.get("business_function"), sid)
            vendor_id = vendor(row.get("supplier_name"), sid)
            subject_id = self.maybe_object(row.get("application_or_platform_ref")) or func_id
            self.add_relationship(subject_id, "SUPPLIED_BY", vendor_id, sid, {"allocation_basis": row.get("allocation_basis")})
            self.add_measure(subject_id=subject_id, metric_key="budget_usd", metric_name="Budget", value=as_num(row.get("budget_usd")), unit="USD", source_id=sid, period=row.get("fiscal_period"), cadence="monthly")
            self.add_measure(subject_id=subject_id, metric_key="actual_usd", metric_name="Actual spend", value=as_num(row.get("actual_usd")), unit="USD", source_id=sid, period=row.get("fiscal_period"), cadence="monthly")

        for index, row in enumerate(self.rows_by_family["SP07_PPM"], start=1):
            sid = source_record_id("SP07_PPM", row, index)
            func_id = function(row.get("sponsor_function"), sid)
            prog_id = self.add_object(
                object_type="program",
                object_key=row["program_id"],
                display_name=row["program_name"],
                business_domain=row.get("sponsor_function"),
                lifecycle_state="planned" if row.get("status") in {"approved", "proposed"} else "current",
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(prog_id, "FUNDED_BY", func_id, sid, {})
            for app_ref in [part for part in row.get("dependent_applications", "").split(";") if part]:
                self.add_relationship(prog_id, "CHANGES", self.object_lookup.get(("application", app_ref)), sid, {})
            self.add_measure(subject_id=prog_id, metric_key="approved_budget_usd", metric_name="Approved budget", value=as_num(row.get("approved_budget_usd")), unit="USD", source_id=sid)
            self.add_measure(subject_id=prog_id, metric_key="forecast_usd", metric_name="Forecast", value=as_num(row.get("forecast_usd")), unit="USD", source_id=sid)
            self.add_measure(subject_id=prog_id, metric_key="target_value_usd", metric_name="Target value", value=as_num(row.get("target_value_usd")), unit="USD", source_id=sid)

        for index, row in enumerate(self.rows_by_family["SP08_Vendor_Contract"], start=1):
            sid = source_record_id("SP08_Vendor_Contract", row, index)
            vendor_id = vendor(row.get("supplier_name"), sid)
            contract_id = self.add_object(
                object_type="contract",
                object_key=row["contract_id"],
                display_name=f"{row.get('supplier_name')} {row.get('service_tower')} contract",
                business_domain="Vendor / Commercial",
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(contract_id, "SUPPLIED_BY", vendor_id, sid, {})
            for app_ref in [part for part in row.get("scoped_applications", "").split(";") if part]:
                self.add_relationship(self.object_lookup.get(("application", app_ref)), "COVERED_BY", contract_id, sid, {"service_tower": row.get("service_tower")})
            self.add_measure(subject_id=contract_id, metric_key="contract_annualized_value_usd", metric_name="Contract annualized value", value=as_num(row.get("annualized_value_usd")), unit="USD", source_id=sid, cadence="annual")
            self.add_measure(subject_id=contract_id, metric_key="notice_window_days", metric_name="Notice window", value=as_num(row.get("notice_window_days")), unit="days", source_id=sid)
            self.add_measure(subject_id=contract_id, metric_key="minimum_commitment_usd", metric_name="Minimum commitment", value=as_num(row.get("minimum_commitment_usd")), unit="USD", source_id=sid)
            service_tower = metric_part(row.get("service_tower"))
            self.add_measure(subject_id=contract_id, metric_key=f"{service_tower}_annualized_value_usd", metric_name=f"{row.get('service_tower')} annualized value", value=as_num(row.get("annualized_value_usd")), unit="USD", source_id=sid, cadence="annual")
            self.add_measure(subject_id=contract_id, metric_key=f"{service_tower}_minimum_commitment_usd", metric_name=f"{row.get('service_tower')} minimum commitment", value=as_num(row.get("minimum_commitment_usd")), unit="USD", source_id=sid)

        for index, row in enumerate(self.rows_by_family["SP09_GRC"], start=1):
            sid = source_record_id("SP09_GRC", row, index)
            func_id = function(row.get("business_function"), sid)
            object_type = "control" if row.get("risk_type") == "control" else "risk"
            grc_id = self.add_object(
                object_type=object_type,
                object_key=row["risk_or_control_id"],
                display_name=f"{row.get('risk_type')} {row.get('risk_or_control_id')}",
                business_domain=row.get("business_function"),
                source_id=sid,
                attributes=row,
            )
            self.add_relationship(grc_id, "DEPENDS_ON", self.maybe_object(row.get("object_ref")) or func_id, sid, {})
            self.add_measure(subject_id=grc_id, metric_key="open_exception_count", metric_name="Open exception count", value=as_num(row.get("open_exception_count")), unit="count", source_id=sid)
            risk_type = metric_part(row.get("risk_type"))
            self.add_measure(subject_id=grc_id, metric_key=f"{risk_type}_open_exception_count", metric_name=f"{row.get('risk_type')} open exception count", value=as_num(row.get("open_exception_count")), unit="count", source_id=sid)

        for index, row in enumerate(self.rows_by_family["SP10_KPI_Operations"], start=1):
            sid = source_record_id("SP10_KPI_Operations", row, index)
            func_id = function(row.get("business_function"), sid)
            subject_id = self.maybe_object(row.get("source_application_ref")) or func_id
            metric_key = "kpi_" + hashlib.sha1(row["kpi_name"].encode("utf-8")).hexdigest()[:12]
            self.add_measure(subject_id=subject_id, metric_key=metric_key, metric_name=row["kpi_name"], value=as_num(row.get("kpi_value")), unit=row.get("kpi_unit") or "value", source_id=sid, period=row.get("period"), cadence="quarterly", aggregation_rule="avg")

        for index, row in enumerate(self.rows_by_family["SP11_AI_Usage_Models"], start=1):
            sid = source_record_id("SP11_AI_Usage_Models", row, index)
            func_id = function(row.get("business_function"), sid)
            vendor_id = vendor(row.get("vendor_name"), sid)
            tool_id = self.add_object(object_type="ai_tool", object_key=row["tool_name"], display_name=row["tool_name"], business_domain="AI", source_id=sid, attributes={"vendor_name": row.get("vendor_name")})
            use_case_id = self.add_object(object_type="ai_use_case", object_key=row["use_case_name"], display_name=row["use_case_name"], business_domain=row.get("business_function"), source_id=sid, attributes=row)
            self.add_relationship(tool_id, "SUPPLIED_BY", vendor_id, sid, {})
            self.add_relationship(use_case_id, "SUPPORTED_BY", tool_id, sid, {})
            self.add_relationship(use_case_id, "USED_BY", func_id, sid, {})
            self.add_measure(subject_id=tool_id, metric_key="licensed_users", metric_name="Licensed users", value=as_num(row.get("licensed_users")), unit="users", source_id=sid, period=row.get("period"), cadence="monthly")
            self.add_measure(subject_id=tool_id, metric_key="ai_active_users", metric_name="AI active users", value=as_num(row.get("active_users")), unit="users", source_id=sid, period=row.get("period"), cadence="monthly")
            self.add_measure(subject_id=tool_id, metric_key="usage_events", metric_name="Usage events", value=as_num(row.get("usage_events")), unit="events", source_id=sid, period=row.get("period"), cadence="monthly")
            self.add_measure(subject_id=tool_id, metric_key="monthly_cost_usd", metric_name="Monthly cost", value=as_num(row.get("monthly_cost_usd")), unit="USD", source_id=sid, period=row.get("period"), cadence="monthly")
            category = metric_part(row.get("use_case_category"))
            self.add_measure(subject_id=use_case_id, metric_key=f"{category}_ai_active_users", metric_name=f"{row.get('use_case_category')} AI active users", value=as_num(row.get("active_users")), unit="users", source_id=sid, period=row.get("period"), cadence="monthly")
            self.add_measure(subject_id=use_case_id, metric_key=f"{category}_usage_events", metric_name=f"{row.get('use_case_category')} usage events", value=as_num(row.get("usage_events")), unit="events", source_id=sid, period=row.get("period"), cadence="monthly")
            self.add_measure(subject_id=use_case_id, metric_key=f"{category}_monthly_cost_usd", metric_name=f"{row.get('use_case_category')} monthly cost", value=as_num(row.get("monthly_cost_usd")), unit="USD", source_id=sid, period=row.get("period"), cadence="monthly")

        for index, row in enumerate(self.rows_by_family["SP13_Data_Flows_Integrations"], start=1):
            sid = source_record_id("SP13_Data_Flows_Integrations", row, index)
            from_id = self.maybe_object(row.get("source_object_ref"))
            to_id = self.maybe_object(row.get("target_object_ref"))
            self.add_relationship(from_id, "INTEGRATES_WITH", to_id, sid, row)
            function(row.get("source_function"), sid)
            function(row.get("target_function"), sid)

        snapshot_id = source_layer.stable_uuid("snapshot", TENANT_KEY, ASSESSMENT_ID, "dense-context-local")
        manifest_hash = hashlib.sha256(json.dumps(self.manifest, sort_keys=True).encode("utf-8")).hexdigest()
        context_hash = hashlib.sha256(
            json.dumps(
                {
                    "objects": sorted(self.objects),
                    "relationships": sorted(str(key) for key in self.relationships),
                    "metrics": sorted(self.metric_definitions),
                    "measures": sorted(self.measures),
                },
                sort_keys=True,
            ).encode("utf-8")
        ).hexdigest()
        snapshot = [
            {
                "id": source_layer.sql_text(snapshot_id),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_key": source_layer.sql_text("dense-source-room-context-local"),
                "snapshot_type": source_layer.sql_text("projection_source"),
                "source_hash": source_layer.sql_text(manifest_hash),
                "context_hash": source_layer.sql_text(context_hash),
                "created_by_job": source_layer.sql_text("scripts/ecl/load_dense_source_room_context_layer.py"),
                "quality_state": source_layer.sql_text("passed"),
                "proof_uri": source_layer.sql_text(DEFAULT_OUT_DIR.as_posix()),
            }
        ]
        context_pack_payload = {
            "tenant_key": TENANT_KEY,
            "assessment_id": ASSESSMENT_ID,
            "object_count": len(self.objects),
            "relationship_count": len(self.relationships),
            "measure_count": len(self.measures),
            "source": "dense_source_room_context_layer",
        }
        context_pack_hash = hashlib.sha256(json.dumps(context_pack_payload, sort_keys=True).encode("utf-8")).hexdigest()
        context_pack = [
            {
                "id": source_layer.sql_text(source_layer.stable_uuid("context_pack", TENANT_KEY, ASSESSMENT_ID, "dense-source-room-context-pack", 1)),
                "tenant_key": source_layer.sql_text(TENANT_KEY),
                "assessment_id": source_layer.sql_text(ASSESSMENT_ID),
                "snapshot_id": source_layer.sql_text(snapshot_id),
                "pack_key": source_layer.sql_text("dense-source-room-context-pack"),
                "pack_version": source_layer.sql_num(1),
                "payload_json": source_layer.sql_json(context_pack_payload),
                "payload_hash": source_layer.sql_text(context_pack_hash),
                "retrieval_state": source_layer.sql_text("not_indexed"),
                "quality_state": source_layer.sql_text("passed"),
                "proof_uri": source_layer.sql_text(DEFAULT_OUT_DIR.as_posix()),
            }
        ]
        return {
            "objects": list(self.objects.values()),
            "relationships": list(self.relationships.values()),
            "metric_definitions": list(self.metric_definitions.values()),
            "measures": list(self.measures.values()),
            "snapshot": snapshot,
            "context_pack": context_pack,
        }


def build_context_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    builder = ContextBuilder(dense_out_dir)
    context = builder.build()
    columns = {
        "ecl_context.object": ["id", "tenant_key", "assessment_id", "object_key", "object_type", "display_name", "business_domain", "lifecycle_state", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
        "ecl_context.relationship": ["id", "tenant_key", "assessment_id", "from_object_id", "relationship_type", "to_object_id", "direction_label", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
        "ecl_context.metric_definition": ["id", "tenant_key", "metric_key", "metric_name", "definition", "unit", "directionality", "cadence", "aggregation_rule"],
        "ecl_context.measure": ["id", "tenant_key", "assessment_id", "subject_object_id", "metric_key", "value_number", "value_text", "unit", "period_start", "period_end", "scenario", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state", "attributes_json"],
        "ecl_context.snapshot": ["id", "tenant_key", "assessment_id", "snapshot_key", "snapshot_type", "source_hash", "context_hash", "created_by_job", "quality_state", "proof_uri"],
        "ecl_context.context_pack": ["id", "tenant_key", "assessment_id", "snapshot_id", "pack_key", "pack_version", "payload_json", "payload_hash", "retrieval_state", "quality_state", "proof_uri"],
    }
    sql_parts = ["begin;"]
    sql_parts.append(insert_sql("ecl_context.object", columns["ecl_context.object"], context["objects"]))
    sql_parts.append(insert_sql("ecl_context.relationship", columns["ecl_context.relationship"], context["relationships"]))
    sql_parts.append(insert_sql("ecl_context.metric_definition", columns["ecl_context.metric_definition"], context["metric_definitions"]))
    sql_parts.append(insert_sql("ecl_context.measure", columns["ecl_context.measure"], context["measures"]))
    sql_parts.append(insert_sql("ecl_context.snapshot", columns["ecl_context.snapshot"], context["snapshot"]))
    sql_parts.append(insert_sql("ecl_context.context_pack", columns["ecl_context.context_pack"], context["context_pack"]))
    sql_parts.append("commit;")
    sql_path = out_dir / "dense_source_room_ecl_context_load.sql"
    sql_path.parent.mkdir(parents=True, exist_ok=True)
    sql_path.write_text("\n".join(sql_parts) + "\n", encoding="utf-8")
    verify_sql = out_dir / "dense_source_room_ecl_context_verify.sql"
    verify_sql.write_text(
        """
\\pset format unaligned
\\pset tuples_only on
select jsonb_pretty(jsonb_build_object(
  'source_file', (select count(*) from ecl_source.source_file),
  'source_record', (select count(*) from ecl_source.source_record),
  'document', (select count(*) from ecl_source.document),
  'document_extraction', (select count(*) from ecl_source.document_extraction),
  'object_type_catalog', (select count(*) from ecl_context.object_type_catalog),
  'object', (select count(*) from ecl_context.object),
  'application', (select count(*) from ecl_context.application_v),
  'application_deployment', (select count(*) from ecl_context.application_deployment_v),
  'vendor', (select count(*) from ecl_context.object where object_type = 'vendor'),
  'data_platform', (select count(*) from ecl_context.technical_component_v where object_type = 'data_platform'),
  'infrastructure', (select count(*) from ecl_context.technical_component_v where object_type = 'infrastructure'),
  'relationship', (select count(*) from ecl_context.relationship),
  'deployment_of', (select count(*) from ecl_context.relationship where relationship_type = 'DEPLOYMENT_OF'),
  'hosted_on', (select count(*) from ecl_context.relationship where relationship_type = 'HOSTED_ON'),
  'integrates_with', (select count(*) from ecl_context.relationship where relationship_type = 'INTEGRATES_WITH'),
  'metric_definition', (select count(*) from ecl_context.metric_definition),
  'measure', (select count(*) from ecl_context.measure),
  'snapshot', (select count(*) from ecl_context.snapshot),
  'context_pack', (select count(*) from ecl_context.context_pack),
  'measure_metric_drift', (
    select count(*) from ecl_context.measure m
    left join ecl_context.metric_definition md on md.tenant_key = m.tenant_key and md.metric_key = m.metric_key
    where md.metric_key is null
  ),
  'relationship_endpoint_drift', (
    select count(*) from ecl_context.relationship r
    left join ecl_context.object f on f.tenant_key = r.tenant_key and f.assessment_id = r.assessment_id and f.id = r.from_object_id
    left join ecl_context.object t on t.tenant_key = r.tenant_key and t.assessment_id = r.assessment_id and t.id = r.to_object_id
    where f.id is null or t.id is null
  )
));
""".strip()
        + "\n",
        encoding="utf-8",
    )
    return {
        "context_sql": sql_path.as_posix(),
        "verify_sql": verify_sql.as_posix(),
        "expected_counts": {
            "object": len(context["objects"]),
            "relationship": len(context["relationships"]),
            "metric_definition": len(context["metric_definitions"]),
            "measure": len(context["measures"]),
            "snapshot": len(context["snapshot"]),
            "context_pack": len(context["context_pack"]),
        },
    }


def run_postgres_load(out_dir: Path, source_sql: Path, context_sql: Path, verify_sql: Path, keep_postgres: bool) -> dict[str, Any]:
    env = source_layer.command_env()
    pg_tmp = Path(source_layer.tempfile.mkdtemp(prefix="ecl-dense-context-layer-pg-"))
    port = source_layer.find_open_port()
    db_name = "ecl_dense_context_layer_proof"
    commands: list[dict[str, Any]] = []
    pg_started = False
    try:
        commands.append(source_layer.run(["initdb", "-D", (pg_tmp / "data").as_posix(), "--encoding=UTF8", "--locale=C.UTF-8"], cwd=ROOT, env=env, stdout_path=out_dir / "postgres_initdb.log"))
        commands.append(
            source_layer.run(
                ["pg_ctl", "-D", (pg_tmp / "data").as_posix(), "-l", (out_dir / "postgres.log").as_posix(), "-o", f"-p {port} -k {pg_tmp.as_posix()}", "start"],
                cwd=ROOT,
                env=env,
                stdout_path=out_dir / "postgres_start.log",
            )
        )
        pg_started = True
        commands.append(source_layer.run(["createdb", "-h", pg_tmp.as_posix(), "-p", str(port), db_name], cwd=ROOT, env=env))
        load_log = out_dir / "dense_source_room_ecl_context_load.log"
        for ddl in DDL_FILES:
            commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", ddl.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", source_sql.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        commands.append(source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-f", context_sql.as_posix()], cwd=ROOT, env=env, stdout_path=load_log, append=True))
        bad_rel_sql = "insert into ecl_context.relationship (tenant_key, assessment_id, from_object_id, relationship_type, to_object_id, basis, value_state, review_state) values ('meridian-health', 'assessment-dense-source-room-20260823', gen_random_uuid(), 'DEPENDS_ON', gen_random_uuid(), 'source_recorded', 'known', 'not_reviewed');"
        bad_measure_sql = "insert into ecl_context.measure (tenant_key, assessment_id, subject_object_id, metric_key, value_number, unit, scenario, basis, value_state, quality_state, review_state) select tenant_key, assessment_id, id, 'invented_metric_key', 1, 'count', 'current', 'source_recorded', 'known', 'usable', 'not_reviewed' from ecl_context.object limit 1;"
        planted_failures = []
        for key, sql in [("relationship_endpoint_fk", bad_rel_sql), ("measure_metric_definition_fk", bad_measure_sql)]:
            result = source_layer.subprocess.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-v", "ON_ERROR_STOP=1", "-c", sql], cwd=ROOT, env=env, text=True, capture_output=True)
            planted_failures.append({"key": key, "rejected": result.returncode != 0, "stderr": result.stderr[:500]})
        verify = source_layer.run(["psql", "-h", pg_tmp.as_posix(), "-p", str(port), "-d", db_name, "-f", verify_sql.as_posix()], cwd=ROOT, env=env, stdout_path=out_dir / "dense_source_room_ecl_context_readback.json")
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
    context_sql_summary = build_context_sql(dense_out_dir, out_dir)
    pg_summary = run_postgres_load(out_dir, Path(source_sql_summary["load_sql"]), Path(context_sql_summary["context_sql"]), Path(context_sql_summary["verify_sql"]), args.keep_postgres)
    readback = pg_summary["readback"]
    expected = {**source_sql_summary["expected_counts"], **context_sql_summary["expected_counts"]}
    issues = [
        f"{key}_count_expected_{expected[key]}_got_{readback.get(key)}"
        for key in expected
        if int(readback.get(key, -1)) != int(expected[key])
    ]
    if int(readback.get("application", 0)) < 650:
        issues.append("application_floor_not_met")
    if int(readback.get("application_deployment", 0)) < 1100:
        issues.append("application_deployment_floor_not_met")
    if int(readback.get("relationship", 0)) < 3200:
        issues.append("relationship_floor_not_met")
    if int(readback.get("metric_definition", 0)) < 75:
        issues.append("metric_definition_floor_not_met")
    if int(readback.get("measure", 0)) < 200:
        issues.append("measure_floor_not_met")
    if int(readback.get("relationship_endpoint_drift", 1)) != 0:
        issues.append("relationship_endpoint_drift")
    if int(readback.get("measure_metric_drift", 1)) != 0:
        issues.append("measure_metric_drift")
    if any(not failure["rejected"] for failure in pg_summary["planted_failures"]):
        issues.append("planted_failure_not_rejected")
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "boundary": {
            "azure_load": False,
            "projection_or_cube_rebuild": False,
            "product_route_repointing": False,
        },
        "dense_out_dir": dense_out_dir.as_posix(),
        "out_dir": out_dir.as_posix(),
        "source_sql": source_sql_summary,
        "context_sql": context_sql_summary,
        "readback": readback,
        "planted_failures": pg_summary["planted_failures"],
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    write_json(out_dir / "dense_source_room_ecl_context_load_summary.json", summary)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
