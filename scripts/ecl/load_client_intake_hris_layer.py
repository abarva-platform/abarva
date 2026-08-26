#!/usr/bin/env python3

"""Adapt the SP02 HRIS source family into ECL source/context rows.

Local proof only. The source family is function, role-family, and location
segment grain. It intentionally records workforce counts and attrition
summaries, not employee-level records.
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
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-hris-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-hris-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP02_HRIS"

METRICS = [
    {
        "metric_key": "workforce_employee_count",
        "metric_name": "Employee count",
        "definition": "Employee headcount by function, role family, and location segment.",
        "unit": "count",
        "directionality": "neutral",
        "source_field": "employee_count",
    },
    {
        "metric_key": "workforce_contractor_count",
        "metric_name": "Contractor count",
        "definition": "Contractor headcount by function, role family, and location segment.",
        "unit": "count",
        "directionality": "neutral",
        "source_field": "contractor_count",
    },
    {
        "metric_key": "workforce_open_requisition_count",
        "metric_name": "Open requisition count",
        "definition": "Open requisitions by function, role family, and location segment.",
        "unit": "count",
        "directionality": "lower_is_better",
        "source_field": "open_requisition_count",
    },
    {
        "metric_key": "workforce_attrition_rate",
        "metric_name": "Attrition rate",
        "definition": "Attrition rate by function, role family, and location segment.",
        "unit": "percent",
        "directionality": "lower_is_better",
        "source_field": "attrition_rate",
    },
]


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-hris:{seed}"))


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


def row_is_partial(row: dict[str, str]) -> bool:
    return row.get("source_basis") == "known_gap" or row.get("review_state") in {"needs_follow_up", "partial"}


def parse_state_for(row: dict[str, str]) -> str:
    return "partial" if row_is_partial(row) else "parsed"


def parse_notes_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "known_gap_requires_review"
    if row.get("review_state") in {"needs_follow_up", "partial"}:
        return "needs_follow_up"
    return "client_hris_adapter"


def review_state(value: str | None, *, partial: bool = False) -> str:
    if partial or value == "needs_follow_up":
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def basis_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "unknown"
    if row.get("source_basis") == "owner_estimated":
        return "model_inferred"
    return "source_recorded"


def value_state_for(row: dict[str, str]) -> str:
    return "unknown" if row.get("source_basis") == "known_gap" else "known"


def quality_state_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "insufficient"
    if row.get("source_basis") == "owner_estimated":
        return "estimated"
    return "usable"


def metric_value(row: dict[str, str], field: str) -> float | None:
    if row.get("source_basis") == "known_gap":
        return None
    value = row.get(field)
    if value is None or value == "":
        return None
    return float(value)


def display_role(role_family: str) -> str:
    return role_family.replace("_", " ").title()


def display_location(location_segment: str) -> str:
    return location_segment.replace("_", " ").title()


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
    row_review_state: str | None,
    partial: bool,
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
        "review_state": sql_text(review_state(row_review_state, partial=partial)),
        "confidence": "null",
        "attributes_json": sql_json(attrs),
    }


def relationship_row(
    *,
    relationship_id: str,
    tenant_key: str,
    assessment_id: str,
    from_object_id: str,
    relationship_type: str,
    to_object_id: str,
    source_record_id: str,
    row: dict[str, str],
    partial: bool,
    attrs: dict[str, Any],
) -> dict[str, str]:
    return {
        "id": sql_text(relationship_id),
        "tenant_key": sql_text(tenant_key),
        "assessment_id": sql_text(assessment_id),
        "from_object_id": sql_text(from_object_id),
        "relationship_type": sql_text(relationship_type),
        "to_object_id": sql_text(to_object_id),
        "direction_label": sql_text(attrs["relationship_basis"]),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text(basis_for(row)),
        "value_state": sql_text(value_state_for(row)),
        "review_state": sql_text(review_state(row.get("review_state"), partial=partial)),
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
    manifest_row, extract_path, rows = read_family(source_room_dir, manifest, FAMILY)

    actual_hash = file_sha(extract_path)
    source_file_id = stable_uuid("source_file", tenant_key, assessment_id, FAMILY, actual_hash)
    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("manual_workbook"),
            "origin": sql_text(origin),
            "source_owner": sql_text("HRIS, workforce planning, finance, and functional operations owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_hris",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "collection_guidance": "function_role_location_workforce_summary_not_employee_level_extract",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
    relationship_rows_by_key: dict[tuple[str, str, str], dict[str, str]] = {}
    metric_definition_rows = [
        {
            "id": sql_text(stable_uuid("metric_definition", tenant_key, metric["metric_key"])),
            "tenant_key": sql_text(tenant_key),
            "metric_key": sql_text(metric["metric_key"]),
            "metric_name": sql_text(metric["metric_name"]),
            "definition": sql_text(metric["definition"]),
            "unit": sql_text(metric["unit"]),
            "directionality": sql_text(metric["directionality"]),
            "cadence": sql_text("point_in_time"),
            "aggregation_rule": sql_text("sum" if metric["metric_key"] != "workforce_attrition_rate" else "avg"),
        }
        for metric in METRICS
    ]
    measure_rows: list[dict[str, str]] = []

    functions: set[str] = set()
    roles: set[str] = set()
    locations: set[str] = set()
    partial_rows = 0
    known_gap_rows = 0
    owner_estimated_rows = 0

    for index, row in enumerate(rows, start=1):
        source_record_id = stable_uuid("source_record", tenant_key, assessment_id, FAMILY, row["source_row_id"])
        partial = row_is_partial(row)
        if partial:
            partial_rows += 1
        if row.get("source_basis") == "known_gap":
            known_gap_rows += 1
        if row.get("source_basis") == "owner_estimated":
            owner_estimated_rows += 1

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
                "parse_notes": sql_text(parse_notes_for(row)),
            }
        )

        function_name = row["function"]
        role_family = row["role_family"]
        location_segment = row["location_segment"]
        segment_key = f"{function_name}|{role_family}|{location_segment}"

        functions.add(function_name)
        roles.add(role_family)
        locations.add(location_segment)

        function_id = stable_uuid("object", tenant_key, assessment_id, "business_function", function_name)
        role_id = stable_uuid("object", tenant_key, assessment_id, "persona", role_family)
        location_id = stable_uuid("object", tenant_key, assessment_id, "organization", f"location_segment:{location_segment}")
        segment_id = stable_uuid("object", tenant_key, assessment_id, "organization", f"workforce_segment:{segment_key}")

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
                row_review_state=row.get("review_state"),
                partial=False,
                attrs={"adapter": "client_intake_hris", "source_review_state": row.get("review_state")},
            ),
        )
        object_rows_by_key.setdefault(
            ("persona", role_family),
            object_row(
                object_id=role_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=role_family,
                object_type="persona",
                display_name=display_role(role_family),
                business_domain="Workforce",
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                row_review_state=row.get("review_state"),
                partial=False,
                attrs={"adapter": "client_intake_hris", "role_family": role_family},
            ),
        )
        object_rows_by_key.setdefault(
            ("organization", f"location_segment:{location_segment}"),
            object_row(
                object_id=location_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=f"location_segment:{location_segment}",
                object_type="organization",
                display_name=f"{display_location(location_segment)} Workforce Segment",
                business_domain="Workforce",
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                row_review_state=row.get("review_state"),
                partial=False,
                attrs={
                    "adapter": "client_intake_hris",
                    "organization_type": "location_segment",
                    "location_segment": location_segment,
                },
            ),
        )
        object_rows_by_key.setdefault(
            ("organization", f"workforce_segment:{segment_key}"),
            object_row(
                object_id=segment_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=f"workforce_segment:{segment_key}",
                object_type="organization",
                display_name=f"{function_name} - {display_role(role_family)} - {display_location(location_segment)}",
                business_domain=function_name,
                source_record_id=source_record_id,
                basis=basis_for(row),
                value_state=value_state_for(row),
                row_review_state=row.get("review_state"),
                partial=partial,
                attrs={
                    "adapter": "client_intake_hris",
                    "organization_type": "workforce_segment",
                    "function": function_name,
                    "role_family": role_family,
                    "location_segment": location_segment,
                    "source_basis": row.get("source_basis"),
                    "source_review_state": row.get("review_state"),
                },
            ),
        )

        relationships = [
            (segment_id, "OWNED_BY", function_id, "workforce_segment_function"),
            (segment_id, "USED_BY", role_id, "workforce_segment_role_family"),
        ]
        for from_id, relationship_type, to_id, relationship_basis in relationships:
            relationship_key = (from_id, relationship_type, to_id)
            relationship_rows_by_key.setdefault(
                relationship_key,
                relationship_row(
                    relationship_id=stable_uuid("relationship", *relationship_key),
                    tenant_key=tenant_key,
                    assessment_id=assessment_id,
                    from_object_id=from_id,
                    relationship_type=relationship_type,
                    to_object_id=to_id,
                    source_record_id=source_record_id,
                    row=row,
                    partial=partial,
                    attrs={
                        "adapter": "client_intake_hris",
                        "relationship_basis": relationship_basis,
                        "function": function_name,
                        "role_family": role_family,
                        "location_segment": location_segment,
                    },
                ),
            )

        for metric in METRICS:
            value = metric_value(row, metric["source_field"])
            measure_rows.append(
                {
                    "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, segment_id, metric["metric_key"], source_record_id)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "subject_object_id": sql_text(segment_id),
                    "metric_key": sql_text(metric["metric_key"]),
                    "value_number": sql_num(value),
                    "value_text": "null",
                    "unit": sql_text(metric["unit"]),
                    "period_start": "null",
                    "period_end": "null",
                    "scenario": sql_text("current"),
                    "source_record_id": sql_text(source_record_id),
                    "document_extraction_id": "null",
                    "basis": sql_text(basis_for(row) if value is not None else "unknown"),
                    "value_state": sql_text("known" if value is not None else "unknown"),
                    "quality_state": sql_text(quality_state_for(row)),
                    "review_state": sql_text(review_state(row.get("review_state"), partial=partial)),
                    "attributes_json": sql_json(
                        {
                            "adapter": "client_intake_hris",
                            "source_field": metric["source_field"],
                            "function": function_name,
                            "role_family": role_family,
                            "location_segment": location_segment,
                            "raw_value": row.get(metric["source_field"]),
                            "source_basis": row.get("source_basis"),
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
    load_sql_path = out_dir / "client_intake_hris_ecl_load.sql"
    summary_path = out_dir / "client_intake_hris_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "business_function": len(functions),
        "role_family": len(roles),
        "location_segment": len(locations),
        "workforce_segment": sum(1 for key in object_rows_by_key if key[0] == "organization" and key[1].startswith("workforce_segment:")),
        "organization": sum(1 for key in object_rows_by_key if key[0] == "organization"),
        "persona": len(roles),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "partial_source_record": partial_rows,
        "known_gap_rows": known_gap_rows,
        "owner_estimated_rows": owner_estimated_rows,
        "functions": sorted(functions),
        "role_families": sorted(roles),
        "location_segments": sorted(locations),
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP02 HRIS adapter; function, role-family, location, workforce count, requisition, and attrition summary grain",
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
