#!/usr/bin/env python3

"""Adapt the SP05 infrastructure source family into ECL context rows.

Local proof only. The source family is intentionally summarized at platform,
cluster, account, appliance, or hosting-segment grain. It captures the
infrastructure substrate without asking a client to enumerate every VM, subnet,
disk, or appliance component as a separate row.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import uuid
from datetime import date
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOM_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-infrastructure-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-infrastructure-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP05_Infrastructure"
METRICS = [
    {
        "metric_key": "platform_capacity_value",
        "metric_name": "Platform capacity",
        "definition": "Capacity value for the infrastructure row in its native declared unit.",
        "unit": "native_unit",
        "directionality": "neutral",
        "cadence": "point_in_time",
        "aggregation_rule": "sum",
        "source_field": "capacity_value",
    },
    {
        "metric_key": "platform_utilization_percent",
        "metric_name": "Platform utilization",
        "definition": "Observed or estimated utilization percentage for the infrastructure row.",
        "unit": "percent",
        "directionality": "lower_is_better",
        "cadence": "point_in_time",
        "aggregation_rule": "avg",
        "source_field": "utilization_percent",
    },
    {
        "metric_key": "support_days_remaining",
        "metric_name": "Support days remaining",
        "definition": "Days from the pinned demo as-of date to the declared support end date.",
        "unit": "days",
        "directionality": "higher_is_better",
        "cadence": "point_in_time",
        "aggregation_rule": "min",
        "source_field": "support_end_date",
    },
]


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-infrastructure:{seed}"))


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


def support_days_remaining(support_end_date: str | None, demo_as_of_date: str | None) -> int | None:
    if not support_end_date:
        return None
    try:
        support_end = date.fromisoformat(support_end_date)
        as_of = date.fromisoformat(demo_as_of_date or DEFAULT_SOURCE_DATE)
    except ValueError:
        return None
    return (support_end - as_of).days


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
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text(review_state(attrs.get("review_state"))),
        "confidence": "null",
        "attributes_json": sql_json(attrs),
    }


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
    manifest_row = next((row for row in manifest if row["source_room_family"] == FAMILY), None)
    if manifest_row is None:
        raise AssertionError(f"{FAMILY} not found in source-room manifest")

    extract_path = source_room_dir / manifest_row["file_path"]
    rows = read_csv(extract_path)
    if len(rows) != int(manifest_row["row_count"]):
        raise AssertionError(f"{FAMILY} manifest row_count={manifest_row['row_count']} but read {len(rows)} rows")

    actual_hash = file_sha(extract_path)
    if manifest_row["sha256"] != actual_hash:
        raise AssertionError(f"{FAMILY} manifest hash does not match extract hash")

    source_file_id = stable_uuid("source_file", tenant_key, assessment_id, FAMILY, actual_hash)
    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("manual_workbook"),
            "origin": sql_text(origin),
            "source_owner": sql_text("Infrastructure, cloud, data center, hosting, and platform engineering"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_infrastructure",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "input_fixture_state": "client_shaped_synthetic_extract",
                    "collection_guidance": "platform_cluster_account_appliance_or_hosting_segment_not_every_component",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
    relationship_rows_by_key: dict[tuple[str, str, str], dict[str, str]] = {}
    metric_definition_rows: list[dict[str, str]] = []
    measure_rows: list[dict[str, str]] = []

    for metric in METRICS:
        metric_definition_rows.append(
            {
                "id": sql_text(stable_uuid("metric_definition", tenant_key, metric["metric_key"])),
                "tenant_key": sql_text(tenant_key),
                "metric_key": sql_text(metric["metric_key"]),
                "metric_name": sql_text(metric["metric_name"]),
                "definition": sql_text(metric["definition"]),
                "unit": sql_text(metric["unit"]),
                "directionality": sql_text(metric["directionality"]),
                "cadence": sql_text(metric["cadence"]),
                "aggregation_rule": sql_text(metric["aggregation_rule"]),
            }
        )

    functions: set[str] = set()
    platforms: set[str] = set()
    platform_types: set[str] = set()
    hosting_locations: set[str] = set()
    dr_tiers: set[str] = set()

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
                "parse_notes": sql_text("client_infrastructure_adapter"),
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
                attrs={"adapter": "client_intake_infrastructure", "review_state": row.get("review_state")},
            ),
        )

        platform_key = row["platform_id"]
        platform_id = stable_uuid("object", tenant_key, assessment_id, "infrastructure", platform_key)
        platforms.add(platform_key)
        platform_types.add(row.get("platform_type") or "unknown")
        hosting_locations.add(row.get("hosting_location") or "unknown")
        dr_tiers.add(row.get("dr_tier") or "unknown")
        object_rows_by_key.setdefault(
            ("infrastructure", platform_key),
            object_row(
                object_id=platform_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=platform_key,
                object_type="infrastructure",
                display_name=row["platform_name"],
                business_domain=function_name,
                source_record_id=source_record_id,
                attrs={
                    "adapter": "client_intake_infrastructure",
                    "platform_type": row.get("platform_type"),
                    "hosting_location": row.get("hosting_location"),
                    "capacity_unit": row.get("capacity_unit"),
                    "dr_tier": row.get("dr_tier"),
                    "support_end_date": row.get("support_end_date"),
                    "demo_as_of_date": row.get("demo_as_of_date"),
                    "source_basis": row.get("source_basis"),
                    "source_review_state": row.get("review_state"),
                    "review_state": row.get("review_state"),
                },
            ),
        )

        relationship_key = (function_id, "SUPPORTED_BY", platform_id)
        relationship_rows_by_key.setdefault(
            relationship_key,
            {
                "id": sql_text(stable_uuid("relationship", *relationship_key)),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "from_object_id": sql_text(function_id),
                "relationship_type": sql_text("SUPPORTED_BY"),
                "to_object_id": sql_text(platform_id),
                "direction_label": sql_text("supported by"),
                "source_record_id": sql_text(source_record_id),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known"),
                "review_state": sql_text(review_state(row.get("review_state"))),
                "confidence": "null",
                "attributes_json": sql_json(
                    {
                        "adapter": "client_intake_infrastructure",
                        "platform_type": row.get("platform_type"),
                        "hosting_location": row.get("hosting_location"),
                        "dr_tier": row.get("dr_tier"),
                        "relationship_basis": "hosting_platform_function_alignment",
                    }
                ),
            },
        )

        for metric in METRICS:
            if metric["metric_key"] == "support_days_remaining":
                value = support_days_remaining(row.get("support_end_date"), row.get("demo_as_of_date"))
                value_state = "known" if value is not None else "unknown"
                basis = "calculated" if value is not None else "unknown"
                quality_state = "usable" if value is not None else "insufficient"
                unit = metric["unit"]
            else:
                value = metric_number(row.get(metric["source_field"]))
                value_state = "known" if value is not None else "unknown"
                basis = "source_recorded" if value is not None else "unknown"
                quality_state = "usable" if value is not None else "insufficient"
                unit = row.get("capacity_unit") if metric["metric_key"] == "platform_capacity_value" else metric["unit"]
            measure_rows.append(
                {
                    "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, platform_id, metric["metric_key"], source_record_id)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "subject_object_id": sql_text(platform_id),
                    "metric_key": sql_text(metric["metric_key"]),
                    "value_number": sql_num(value),
                    "value_text": "null",
                    "unit": sql_text(unit),
                    "period_start": "null",
                    "period_end": sql_text(row.get("demo_as_of_date") or "2026-08-23"),
                    "scenario": sql_text("current"),
                    "source_record_id": sql_text(source_record_id),
                    "document_extraction_id": "null",
                    "basis": sql_text(basis),
                    "value_state": sql_text(value_state),
                    "quality_state": sql_text(quality_state),
                    "review_state": sql_text(review_state(row.get("review_state"))),
                    "attributes_json": sql_json(
                        {
                            "adapter": "client_intake_infrastructure",
                            "source_field": metric["source_field"],
                            "function": function_name,
                            "platform_type": row.get("platform_type"),
                            "hosting_location": row.get("hosting_location"),
                            "capacity_unit": row.get("capacity_unit"),
                            "dr_tier": row.get("dr_tier"),
                            "support_end_date": row.get("support_end_date"),
                            "demo_as_of_date": row.get("demo_as_of_date"),
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
    load_sql_path = out_dir / "client_intake_infrastructure_ecl_load.sql"
    summary_path = out_dir / "client_intake_infrastructure_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "business_function": len(functions),
        "infrastructure": len(platforms),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "platform_types": sorted(platform_types),
        "hosting_locations": sorted(hosting_locations),
        "dr_tiers": sorted(dr_tiers),
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP05 infrastructure adapter; platform, cluster, account, appliance, or hosting-segment grain",
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
