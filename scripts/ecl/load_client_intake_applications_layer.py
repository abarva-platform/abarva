#!/usr/bin/env python3

"""Adapt the active reference applications intake CSV into ECL source/context rows.

This is the first direct Layer 1 -> Layer 2 -> Layer 3 proof for the active
tenant-input packet. It intentionally reads the registry-declared active input
root and writes a local SQL artifact; it does not touch Azure.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import uuid
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY = ROOT / "datasets/tenant-inputs/tenant-input-registry.json"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_FILE_NAME = "04_applications_systems.csv"
DEFAULT_ASSESSMENT_ID = "client-intake-active-applications-proof"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-applications-proof"
ENVIRONMENT_SUFFIX_RE = re.compile(
    r"\s+[\u2013\u2014-]\s+"
    r"(Production|Prod|Test|Training|Train|Development|Dev|QA|UAT|Sandbox|DR|Disaster Recovery|Non-Prod|Nonprod)$",
    re.IGNORECASE,
)


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-intake:{seed}"))


def sql_text(value: object | None) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_num(value: object | None) -> str:
    if value is None or value == "":
        return "null"
    return str(value)


def sql_json(value: object) -> str:
    return sql_text(json.dumps(value, sort_keys=True, separators=(",", ":"))) + "::jsonb"


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]]) -> str:
    if not rows:
        return f"-- no rows for {table}"
    values = []
    for row in rows:
        values.append("(" + ", ".join(row[column] for column in columns) + ")")
    return f"insert into {table} ({', '.join(columns)}) values\n" + ",\n".join(values) + ";\n"


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def slug(value: str, fallback: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9]+", "-", value.upper()).strip("-")
    if not normalized:
        return fallback
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:10].upper()
    return f"{normalized[:64]}-{digest}"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def registry_input_path(registry_path: Path, tenant_key: str, file_name: str) -> Path:
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    active = [tenant for tenant in registry.get("activeTenants", []) if tenant.get("tenantKey") == tenant_key]
    if len(active) != 1:
        raise AssertionError(f"expected exactly one active tenant registry entry for {tenant_key}, got {len(active)}")
    root = ROOT / active[0]["canonicalInputRoot"]
    path = root / file_name
    if not path.exists():
        raise AssertionError(f"registry-declared intake file missing: {path}")
    return path


def split_environment_variant(system_name: str) -> tuple[str, str | None]:
    match = ENVIRONMENT_SUFFIX_RE.search(system_name)
    if not match:
        return system_name.strip(), None
    return system_name[: match.start()].strip(), match.group(1).strip()


def lifecycle_state(row: dict[str, str]) -> str:
    raw = (row.get("lifecycle_state") or "").strip().lower()
    if raw in {"current", "candidate", "planned", "retired"}:
        return raw
    if "target" in raw:
        return "planned"
    if "retir" in raw:
        return "retired"
    return "current"


def basis_for_cost(row: dict[str, str]) -> str:
    return "model_inferred" if row.get("annual_cost_basis") == "synthetic_modeled" else "source_recorded"


def normalize_environment(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.lower().replace(" ", "_").replace("-", "_")
    if normalized == "prod":
        return "production"
    if normalized == "train":
        return "training"
    if normalized == "nonprod":
        return "non_prod"
    if normalized == "disaster_recovery":
        return "dr"
    return normalized


def object_row(
    *,
    object_id: str,
    object_key: str,
    object_type: str,
    display_name: str,
    business_domain: str | None,
    lifecycle: str,
    source_record_id: str,
    basis: str,
    confidence: str | None,
    attrs: dict[str, Any],
) -> dict[str, str]:
    return {
        "id": sql_text(object_id),
        "tenant_key": sql_text(DEFAULT_TENANT_KEY),
        "assessment_id": sql_text(DEFAULT_ASSESSMENT_ID),
        "object_key": sql_text(object_key),
        "object_type": sql_text(object_type),
        "display_name": sql_text(display_name),
        "business_domain": sql_text(business_domain),
        "lifecycle_state": sql_text(lifecycle),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text(basis),
        "value_state": sql_text("known"),
        "review_state": sql_text("not_reviewed"),
        "confidence": sql_num(None),
        "attributes_json": sql_json({**attrs, "source_confidence": confidence}),
    }


def relationship_row(from_id: str, rel_type: str, to_id: str, source_record_id: str, attrs: dict[str, Any]) -> dict[str, str]:
    return {
        "id": sql_text(stable_uuid("relationship", from_id, rel_type, to_id)),
        "tenant_key": sql_text(DEFAULT_TENANT_KEY),
        "assessment_id": sql_text(DEFAULT_ASSESSMENT_ID),
        "from_object_id": sql_text(from_id),
        "relationship_type": sql_text(rel_type),
        "to_object_id": sql_text(to_id),
        "direction_label": sql_text(rel_type.lower()),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text("not_reviewed"),
        "confidence": sql_num(None),
        "attributes_json": sql_json(attrs),
    }


def measure_row(subject_id: str, metric_key: str, value: float, unit: str, source_record_id: str, basis: str) -> dict[str, str]:
    return {
        "id": sql_text(stable_uuid("measure", subject_id, metric_key)),
        "tenant_key": sql_text(DEFAULT_TENANT_KEY),
        "assessment_id": sql_text(DEFAULT_ASSESSMENT_ID),
        "subject_object_id": sql_text(subject_id),
        "metric_key": sql_text(metric_key),
        "value_number": sql_num(value),
        "value_text": "null",
        "unit": sql_text(unit),
        "period_start": "null",
        "period_end": sql_text("2026-07-31"),
        "scenario": sql_text("current"),
        "source_record_id": sql_text(source_record_id),
        "document_extraction_id": "null",
        "basis": sql_text(basis),
        "value_state": sql_text("known"),
        "quality_state": sql_text("estimated" if basis == "model_inferred" else "usable"),
        "review_state": sql_text("not_reviewed"),
        "attributes_json": sql_json({"adapter": "client_intake_applications"}),
    }


def build_sql(intake_path: Path, out_dir: Path) -> dict[str, Any]:
    rows = read_csv(intake_path)
    intake_hash = file_sha(intake_path)
    source_file_id = stable_uuid("source_file", DEFAULT_TENANT_KEY, DEFAULT_FILE_NAME, intake_hash)

    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(DEFAULT_TENANT_KEY),
            "assessment_id": sql_text(DEFAULT_ASSESSMENT_ID),
            "source_type": sql_text("cmdb"),
            "origin": sql_text("client_intake"),
            "source_owner": sql_text("CMDB / application portfolio owner"),
            "file_name": sql_text(intake_path.name),
            "blob_uri": sql_text(intake_path.as_posix()),
            "file_hash": sql_text(intake_hash),
            "source_date": sql_text("2026-07-31"),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "registry_declared_path": intake_path.as_posix(),
                    "adapter": "client_intake_applications",
                    "source_origin": "client_intake",
                    "row_grain": "one row per application/system row from active tenant intake",
                }
            ),
        }
    ]
    metric_definition_rows = [
        {
            "id": sql_text(stable_uuid("metric_definition", DEFAULT_TENANT_KEY, "annual_cost_usd")),
            "tenant_key": sql_text(DEFAULT_TENANT_KEY),
            "metric_key": sql_text("annual_cost_usd"),
            "metric_name": sql_text("Annual cost"),
            "definition": sql_text("Annual application or deployment cost carried from the active applications intake file."),
            "unit": sql_text("USD"),
            "directionality": sql_text("neutral"),
            "cadence": sql_text("annual"),
            "aggregation_rule": sql_text("sum"),
        },
        {
            "id": sql_text(stable_uuid("metric_definition", DEFAULT_TENANT_KEY, "user_count")),
            "tenant_key": sql_text(DEFAULT_TENANT_KEY),
            "metric_key": sql_text("user_count"),
            "metric_name": sql_text("User count"),
            "definition": sql_text("Application user count carried from the active applications intake file."),
            "unit": sql_text("users"),
            "directionality": sql_text("neutral"),
            "cadence": sql_text("point_in_time"),
            "aggregation_rule": sql_text("latest"),
        },
    ]
    source_records: list[dict[str, str]] = []
    objects: dict[str, dict[str, str]] = {}
    relationships: dict[tuple[str, str, str], dict[str, str]] = {}
    measures: dict[str, dict[str, str]] = {}
    app_by_base_key: dict[str, str] = {}
    function_by_name: dict[str, str] = {}
    vendor_by_name: dict[str, str] = {}
    deployment_rows = 0

    def add_relationship(from_id: str | None, rel_type: str, to_id: str | None, source_record_id: str, attrs: dict[str, Any]) -> None:
        if not from_id or not to_id or from_id == to_id:
            return
        key = (from_id, rel_type, to_id)
        relationships.setdefault(key, relationship_row(from_id, rel_type, to_id, source_record_id, attrs))

    for row_number, row in enumerate(rows, start=1):
        system_name = row.get("system_name", "").strip()
        if not system_name:
            continue
        native_id = f"04_applications_systems:{row_number}:{system_name}"
        source_record_id = stable_uuid("source_record", DEFAULT_TENANT_KEY, native_id)
        source_records.append(
            {
                "id": sql_text(source_record_id),
                "tenant_key": sql_text(DEFAULT_TENANT_KEY),
                "assessment_id": sql_text(DEFAULT_ASSESSMENT_ID),
                "source_file_id": sql_text(source_file_id),
                "native_id": sql_text(native_id),
                "record_type": sql_text("active_tenant_applications_systems"),
                "row_number": sql_num(row_number),
                "payload_json": sql_json(row),
                "parse_state": sql_text("parsed"),
                "parse_notes": sql_text("client_intake_adapter_proof"),
            }
        )

        function_name = row.get("business_function", "").strip() or "Unknown Function"
        if function_name not in function_by_name:
            function_id = stable_uuid("object", "business_function", function_name)
            function_by_name[function_name] = function_id
            objects[function_id] = object_row(
                object_id=function_id,
                object_key=f"FUNC-{slug(function_name, 'FUNCTION')}",
                object_type="business_function",
                display_name=function_name,
                business_domain=function_name,
                lifecycle="current",
                source_record_id=source_record_id,
                basis="source_recorded",
                confidence=row.get("confidence"),
                attrs={"adapter": "client_intake_applications"},
            )
        function_id = function_by_name[function_name]

        vendor_name = row.get("vendor", "").strip()
        vendor_id = None
        if vendor_name and vendor_name.lower() != "unknown":
            if vendor_name not in vendor_by_name:
                vendor_id = stable_uuid("object", "vendor", vendor_name)
                vendor_by_name[vendor_name] = vendor_id
                objects[vendor_id] = object_row(
                    object_id=vendor_id,
                    object_key=f"VEN-{slug(vendor_name, 'VENDOR')}",
                    object_type="vendor",
                    display_name=vendor_name,
                    business_domain="Vendor / Commercial",
                    lifecycle="current",
                    source_record_id=source_record_id,
                    basis="source_recorded",
                    confidence=row.get("confidence"),
                    attrs={"adapter": "client_intake_applications"},
                )
            vendor_id = vendor_by_name[vendor_name]

        base_name, environment = split_environment_variant(system_name)
        base_key = f"{vendor_name or 'unknown'}::{base_name}"
        app_id = app_by_base_key.get(base_key)
        if not app_id:
            app_id = stable_uuid("object", "application", base_key)
            app_by_base_key[base_key] = app_id
            objects[app_id] = object_row(
                object_id=app_id,
                object_key=f"APP-{slug(base_key, 'APPLICATION')}",
                object_type="application",
                display_name=base_name,
                business_domain=function_name,
                lifecycle=lifecycle_state(row),
                source_record_id=source_record_id,
                basis="source_recorded",
                confidence=row.get("confidence"),
                attrs={
                    "adapter": "client_intake_applications",
                    "system_category": row.get("system_category"),
                    "system_type": row.get("system_type"),
                    "system_scope": row.get("system_scope"),
                    "deployment_model": row.get("deployment_model"),
                    "hosting_location": row.get("hosting_location"),
                    "criticality": row.get("criticality"),
                    "business_owner": row.get("business_owner"),
                    "technology_owner": row.get("technology_owner"),
                    "data_domains": row.get("data_domains"),
                    "current_state_or_target_state": row.get("current_state_or_target_state"),
                    "contract_ref": row.get("contract_ref"),
                    "compliance_scope": row.get("compliance_scope"),
                    "data_classification": row.get("data_classification"),
                },
            )
            add_relationship(function_id, "SUPPORTED_BY", app_id, source_record_id, {"source_row": row_number})
            add_relationship(app_id, "SUPPLIED_BY", vendor_id, source_record_id, {"source_row": row_number})

        measure_subject_id = app_id
        if environment:
            deployment_rows += 1
            deployment_id = stable_uuid("object", "application_deployment", native_id)
            objects[deployment_id] = object_row(
                object_id=deployment_id,
                object_key=f"DEP-{slug(native_id, 'DEPLOYMENT')}",
                object_type="application_deployment",
                display_name=system_name,
                business_domain=function_name,
                lifecycle=lifecycle_state(row),
                source_record_id=source_record_id,
                basis="source_recorded",
                confidence=row.get("confidence"),
                attrs={
                    "adapter": "client_intake_applications",
                    "base_application_name": base_name,
                    "environment": normalize_environment(environment),
                    "environment_source": "system_name_suffix",
                    "deployment_model": row.get("deployment_model"),
                    "hosting_location": row.get("hosting_location"),
                    "rto_hours": row.get("rto_hours"),
                    "rpo_hours": row.get("rpo_hours"),
                },
            )
            add_relationship(deployment_id, "DEPLOYMENT_OF", app_id, source_record_id, {"environment": normalize_environment(environment)})
            measure_subject_id = deployment_id

        try:
            annual_cost = float(row.get("annual_cost_usd", "") or 0)
        except ValueError:
            annual_cost = 0
        if annual_cost > 0:
            measure = measure_row(measure_subject_id, "annual_cost_usd", annual_cost, "USD", source_record_id, basis_for_cost(row))
            measures[measure["id"]] = measure

        try:
            user_count = float(row.get("user_count", "") or 0)
        except ValueError:
            user_count = 0
        if user_count > 0:
            measure = measure_row(measure_subject_id, "user_count", user_count, "users", source_record_id, "source_recorded")
            measures[measure["id"]] = measure

    source_file_columns = [
        "id",
        "tenant_key",
        "assessment_id",
        "source_type",
        "origin",
        "source_owner",
        "file_name",
        "blob_uri",
        "file_hash",
        "source_date",
        "access_class",
        "quality_state",
        "metadata_json",
    ]
    source_record_columns = ["id", "tenant_key", "assessment_id", "source_file_id", "native_id", "record_type", "row_number", "payload_json", "parse_state", "parse_notes"]
    object_columns = ["id", "tenant_key", "assessment_id", "object_key", "object_type", "display_name", "business_domain", "lifecycle_state", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"]
    relationship_columns = ["id", "tenant_key", "assessment_id", "from_object_id", "relationship_type", "to_object_id", "direction_label", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"]
    metric_definition_columns = ["id", "tenant_key", "metric_key", "metric_name", "definition", "unit", "directionality", "cadence", "aggregation_rule"]
    measure_columns = ["id", "tenant_key", "assessment_id", "subject_object_id", "metric_key", "value_number", "value_text", "unit", "period_start", "period_end", "scenario", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state", "attributes_json"]

    out_dir.mkdir(parents=True, exist_ok=True)
    load_sql_path = out_dir / "client_intake_applications_ecl_load.sql"
    load_sql_path.write_text(
        "\n".join(
            [
                "begin;",
                insert_sql("ecl_source.source_file", source_file_columns, source_file_rows),
                insert_sql("ecl_source.source_record", source_record_columns, source_records),
                insert_sql("ecl_context.object", object_columns, list(objects.values())),
                insert_sql("ecl_context.relationship", relationship_columns, list(relationships.values())),
                insert_sql("ecl_context.metric_definition", metric_definition_columns, metric_definition_rows),
                insert_sql("ecl_context.measure", measure_columns, list(measures.values())),
                "commit;",
            ]
        ),
        encoding="utf-8",
    )
    summary = {
        "accepted": True,
        "tenant_key": DEFAULT_TENANT_KEY,
        "assessment_id": DEFAULT_ASSESSMENT_ID,
        "source_origin": "client_intake",
        "intake_path": intake_path.as_posix(),
        "source_rows": len(rows),
        "source_file": 1,
        "source_record": len(source_records),
        "application": sum(1 for row in objects.values() if row["object_type"] == sql_text("application")),
        "application_deployment": sum(1 for row in objects.values() if row["object_type"] == sql_text("application_deployment")),
        "environment_variant_source_rows": deployment_rows,
        "business_function": len(function_by_name),
        "vendor": len(vendor_by_name),
        "relationship": len(relationships),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measures),
        "load_sql": load_sql_path.as_posix(),
    }
    (out_dir / "client_intake_applications_ecl_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--tenant-key", default=DEFAULT_TENANT_KEY)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    if args.tenant_key != DEFAULT_TENANT_KEY:
        raise AssertionError("this first adapter proof is intentionally scoped to meridian-health")
    intake_path = registry_input_path(args.registry.resolve(), args.tenant_key, DEFAULT_FILE_NAME)
    summary = build_sql(intake_path, args.out_dir.resolve())
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
