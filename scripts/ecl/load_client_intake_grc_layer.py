#!/usr/bin/env python3

"""Adapt the SP09 GRC source family into ECL source/context rows.

Local proof only. The source family is risk/control/exception/finding grain. It
captures severity, control state, exception count, business function, evidence
reference, and impacted application or platform references for Tower and
Intelligence risk reasoning.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import uuid
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOM_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-grc-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-grc-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP09_GRC"
CMDB_FAMILY = "SP03_CMDB"
INFRA_FAMILY = "SP05_Infrastructure"
METRIC = {
    "metric_key": "open_exception_count",
    "metric_name": "Open exception count",
    "definition": "Open exceptions for the risk, control, exception, or audit finding row.",
    "unit": "count",
    "directionality": "lower_is_better",
    "cadence": "point_in_time",
    "aggregation_rule": "sum",
}


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-grc:{seed}"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def sql_text(value: object | None) -> str:
    if value is None or value == "":
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_num(value: object | None) -> str:
    if value is None or value == "":
        return "null"
    return str(value)


def sql_json(value: object) -> str:
    return sql_text(json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"))) + "::jsonb"


def insert_sql(table: str, columns: list[str], rows: list[dict[str, str]], batch_size: int = 500) -> str:
    if not rows:
        return f"-- no rows for {table}\n"
    chunks: list[str] = []
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        values = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in batch)
        chunks.append(f"insert into {table} ({', '.join(columns)}) values\n{values};")
    return "\n".join(chunks) + "\n"


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_state_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap" or row.get("review_state") in {"needs_follow_up", "partial"}:
        return "partial"
    return "parsed"


def review_state(value: str | None) -> str:
    if value == "needs_follow_up":
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def metric_number(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def quality_state(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "insufficient"
    if row.get("source_basis") == "owner_estimated":
        return "estimated"
    return "usable"


def object_row(
    *,
    object_id: str,
    tenant_key: str,
    assessment_id: str,
    object_key: str,
    object_type: str,
    display_name: str,
    business_domain: str | None,
    source_record_id: str,
    basis: str,
    value_state: str,
    attrs: dict[str, Any],
) -> dict[str, str]:
    return {
        "id": sql_text(object_id),
        "tenant_key": sql_text(tenant_key),
        "assessment_id": sql_text(assessment_id),
        "object_key": sql_text(object_key),
        "object_type": sql_text(object_type),
        "display_name": sql_text(display_name),
        "business_domain": sql_text(business_domain),
        "lifecycle_state": sql_text("current"),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text(basis),
        "value_state": sql_text(value_state),
        "review_state": sql_text(review_state(attrs.get("review_state"))),
        "confidence": "null",
        "attributes_json": sql_json(attrs),
    }


def relationship_row(
    *,
    relationship_id: str,
    tenant_key: str,
    assessment_id: str,
    from_object_id: str,
    to_object_id: str,
    source_record_id: str,
    attrs: dict[str, Any],
) -> dict[str, str]:
    return {
        "id": sql_text(relationship_id),
        "tenant_key": sql_text(tenant_key),
        "assessment_id": sql_text(assessment_id),
        "from_object_id": sql_text(from_object_id),
        "relationship_type": sql_text("DEPENDS_ON"),
        "to_object_id": sql_text(to_object_id),
        "direction_label": sql_text("depends on"),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text(review_state(attrs.get("review_state"))),
        "confidence": "null",
        "attributes_json": sql_json(attrs),
    }


def read_family(source_room_dir: Path, manifest: list[dict[str, str]], family: str) -> tuple[dict[str, str], Path, list[dict[str, str]]]:
    row = next((item for item in manifest if item["source_room_family"] == family), None)
    if row is None:
        raise AssertionError(f"{family} not found in source-room manifest")
    path = source_room_dir / row["file_path"]
    rows = read_csv(path)
    if len(rows) != int(row["row_count"]):
        raise AssertionError(f"{family} manifest row_count={row['row_count']} but read {len(rows)} rows")
    actual_hash = file_sha(path)
    if row["sha256"] != actual_hash:
        raise AssertionError(f"{family} manifest hash does not match extract hash")
    return row, path, rows


def build_sql(
    *,
    source_room_dir: Path,
    out_dir: Path,
    tenant_key: str,
    assessment_id: str,
    origin: str,
    source_date: str,
) -> dict[str, Any]:
    manifest = read_csv(source_room_dir / "dense_source_room_manifest.csv")
    grc_manifest, extract_path, rows = read_family(source_room_dir, manifest, FAMILY)
    _, _, cmdb_rows = read_family(source_room_dir, manifest, CMDB_FAMILY)
    _, _, infra_rows = read_family(source_room_dir, manifest, INFRA_FAMILY)
    app_lookup = {row["application_id"]: row for row in cmdb_rows}
    platform_lookup = {row["platform_id"]: row for row in infra_rows}

    actual_hash = file_sha(extract_path)
    source_file_id = stable_uuid("source_file", tenant_key, assessment_id, FAMILY, actual_hash)
    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("grc"),
            "origin": sql_text(origin),
            "source_owner": sql_text("Risk, compliance, security, audit, and control owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_grc",
                    "source_room_family": FAMILY,
                    "row_grain": grc_manifest["row_grain"],
                    "lookup_families": [CMDB_FAMILY, INFRA_FAMILY],
                    "collection_guidance": "risk_control_exception_summary_not_full_audit_workpaper_detail",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
    relationship_rows_by_key: dict[tuple[str, str, str], dict[str, str]] = {}
    measure_rows: list[dict[str, str]] = []
    metric_definition_rows = [
        {
            "id": sql_text(stable_uuid("metric_definition", tenant_key, METRIC["metric_key"])),
            "tenant_key": sql_text(tenant_key),
            "metric_key": sql_text(METRIC["metric_key"]),
            "metric_name": sql_text(METRIC["metric_name"]),
            "definition": sql_text(METRIC["definition"]),
            "unit": sql_text(METRIC["unit"]),
            "directionality": sql_text(METRIC["directionality"]),
            "cadence": sql_text(METRIC["cadence"]),
            "aggregation_rule": sql_text(METRIC["aggregation_rule"]),
        }
    ]

    functions: set[str] = set()
    risks: set[str] = set()
    controls: set[str] = set()
    target_refs: set[str] = set()
    unresolved_refs: set[str] = set()
    severities: set[str] = set()
    control_states: set[str] = set()

    for index, row in enumerate(rows, start=1):
        source_record_id = stable_uuid("source_record", tenant_key, assessment_id, FAMILY, row["source_row_id"])
        source_record_rows.append(
            {
                "id": sql_text(source_record_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "source_file_id": sql_text(source_file_id),
                "native_id": sql_text(row["source_row_id"]),
                "record_type": sql_text(FAMILY),
                "row_number": sql_num(index),
                "payload_json": sql_json(row),
                "parse_state": sql_text(parse_state_for(row)),
                "parse_notes": sql_text("client_grc_adapter"),
            }
        )

        function_name = row["business_function"]
        function_id = stable_uuid("object", tenant_key, assessment_id, "business_function", function_name)
        functions.add(function_name)
        object_rows_by_key.setdefault(
            ("business_function", function_name),
            object_row(
                object_id=function_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=function_name,
                object_type="business_function",
                display_name=function_name,
                business_domain=function_name,
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={"adapter": "client_intake_grc", "review_state": row.get("review_state")},
            ),
        )

        grc_key = row["risk_or_control_id"]
        grc_type = "control" if grc_key.startswith("CTRL-") else "risk"
        if grc_type == "control":
            controls.add(grc_key)
        else:
            risks.add(grc_key)
        severities.add(row.get("severity") or "unknown")
        control_states.add(row.get("control_state") or "unknown")
        grc_id = stable_uuid("object", tenant_key, assessment_id, grc_type, grc_key)
        object_rows_by_key.setdefault(
            (grc_type, grc_key),
            object_row(
                object_id=grc_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=grc_key,
                object_type=grc_type,
                display_name=f"{row.get('risk_type')} {grc_key}",
                business_domain=function_name,
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={
                    "adapter": "client_intake_grc",
                    "risk_type": row.get("risk_type"),
                    "severity": row.get("severity"),
                    "control_state": row.get("control_state"),
                    "evidence_ref": row.get("evidence_ref"),
                    "source_basis": row.get("source_basis"),
                    "source_review_state": row.get("review_state"),
                    "review_state": row.get("review_state"),
                },
            ),
        )

        target_ref = row.get("object_ref") or ""
        target_refs.add(target_ref)
        app_lookup_row = app_lookup.get(target_ref)
        platform_lookup_row = platform_lookup.get(target_ref)
        target_type = "application" if target_ref.startswith("APP-") else "infrastructure"
        target_lookup = app_lookup_row or platform_lookup_row
        if target_lookup is None:
            unresolved_refs.add(target_ref)
        target_id = stable_uuid("object", tenant_key, assessment_id, f"{target_type}_reference", target_ref)
        target_name = target_lookup.get("application_name") if app_lookup_row else target_lookup.get("platform_name") if platform_lookup_row else target_ref
        target_domain = target_lookup.get("business_function") if app_lookup_row else target_lookup.get("business_function") if platform_lookup_row else None
        object_rows_by_key.setdefault(
            (target_type, target_ref),
            object_row(
                object_id=target_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=target_ref,
                object_type=target_type,
                display_name=target_name,
                business_domain=target_domain,
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known" if target_lookup else "unknown",
                attrs={
                    "adapter": "client_intake_grc",
                    "reference_only": True,
                    "reference_source_field": "object_ref",
                    "lookup_resolved": target_lookup is not None,
                    "object_ref": target_ref,
                    "lookup_family": CMDB_FAMILY if app_lookup_row else INFRA_FAMILY if platform_lookup_row else None,
                    "review_state": row.get("review_state"),
                },
            ),
        )

        relationship_key = (grc_id, "DEPENDS_ON", target_id)
        relationship_rows_by_key.setdefault(
            relationship_key,
            relationship_row(
                relationship_id=stable_uuid("relationship", *relationship_key),
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                from_object_id=grc_id,
                to_object_id=target_id,
                source_record_id=source_record_id,
                attrs={
                    "adapter": "client_intake_grc",
                    "object_ref": target_ref,
                    "severity": row.get("severity"),
                    "control_state": row.get("control_state"),
                    "review_state": row.get("review_state"),
                },
            ),
        )

        value = metric_number(row.get("open_exception_count"))
        measure_rows.append(
            {
                "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, grc_id, METRIC["metric_key"], source_record_id)),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "subject_object_id": sql_text(grc_id),
                "metric_key": sql_text(METRIC["metric_key"]),
                "value_number": sql_num(value),
                "value_text": "null",
                "unit": sql_text(METRIC["unit"]),
                "period_start": "null",
                "period_end": "null",
                "scenario": sql_text("current"),
                "source_record_id": sql_text(source_record_id),
                "document_extraction_id": "null",
                "basis": sql_text("source_recorded" if value is not None else "unknown"),
                "value_state": sql_text("known" if value is not None else "unknown"),
                "quality_state": sql_text(quality_state(row)),
                "review_state": sql_text(review_state(row.get("review_state"))),
                "attributes_json": sql_json(
                    {
                        "adapter": "client_intake_grc",
                        "source_field": "open_exception_count",
                        "risk_or_control_id": grc_key,
                        "risk_type": row.get("risk_type"),
                        "severity": row.get("severity"),
                        "control_state": row.get("control_state"),
                        "object_ref": target_ref,
                        "evidence_ref": row.get("evidence_ref"),
                        "source_review_state": row.get("review_state"),
                    }
                ),
            }
        )

    object_rows = list(object_rows_by_key.values())
    relationship_rows = list(relationship_rows_by_key.values())
    load_sql = "\n".join(
        [
            "begin;",
            insert_sql(
                "ecl_source.source_file",
                ["id", "tenant_key", "assessment_id", "source_type", "origin", "source_owner", "file_name", "blob_uri", "file_hash", "source_date", "access_class", "quality_state", "metadata_json"],
                source_file_rows,
            ),
            insert_sql(
                "ecl_source.source_record",
                ["id", "tenant_key", "assessment_id", "source_file_id", "native_id", "record_type", "row_number", "payload_json", "parse_state", "parse_notes"],
                source_record_rows,
            ),
            insert_sql(
                "ecl_context.object",
                ["id", "tenant_key", "assessment_id", "object_key", "object_type", "display_name", "business_domain", "lifecycle_state", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
                object_rows,
            ),
            insert_sql(
                "ecl_context.relationship",
                ["id", "tenant_key", "assessment_id", "from_object_id", "relationship_type", "to_object_id", "direction_label", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
                relationship_rows,
            ),
            insert_sql(
                "ecl_context.metric_definition",
                ["id", "tenant_key", "metric_key", "metric_name", "definition", "unit", "directionality", "cadence", "aggregation_rule"],
                metric_definition_rows,
            ),
            insert_sql(
                "ecl_context.measure",
                ["id", "tenant_key", "assessment_id", "subject_object_id", "metric_key", "value_number", "value_text", "unit", "period_start", "period_end", "scenario", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state", "attributes_json"],
                measure_rows,
            ),
            "commit;",
        ]
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    load_sql_path = out_dir / "client_intake_grc_ecl_load.sql"
    summary_path = out_dir / "client_intake_grc_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "business_function": len(functions),
        "risk": len(risks),
        "control": len(controls),
        "target_reference": len(target_refs),
        "unresolved_target_reference": len(unresolved_refs),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "severities": sorted(severities),
        "control_states": sorted(control_states),
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP09 GRC adapter; risk/control/exception/finding, function, object reference, severity, control-state, and exception-count grain",
    }
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-room-dir", type=Path, default=DEFAULT_SOURCE_ROOM_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--tenant-key", default=DEFAULT_TENANT_KEY)
    parser.add_argument("--assessment-id", default=DEFAULT_ASSESSMENT_ID)
    parser.add_argument("--origin", default="client_intake", choices=["client_intake", "synthetic_generator"])
    parser.add_argument("--source-date", default=DEFAULT_SOURCE_DATE)
    args = parser.parse_args()
    summary = build_sql(
        source_room_dir=args.source_room_dir,
        out_dir=args.out_dir,
        tenant_key=args.tenant_key,
        assessment_id=args.assessment_id,
        origin=args.origin,
        source_date=args.source_date,
    )
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
