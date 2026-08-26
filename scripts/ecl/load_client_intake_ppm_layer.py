#!/usr/bin/env python3

"""Adapt the SP07 PPM source family into ECL source/context rows.

Local proof only. The source family is intentionally summarized at program or
initiative grain. It captures sponsor, status, budget, forecast, value, and
dependent application references for current-state planning and value reasoning
without pretending to be a full project management system.
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
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-ppm-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-ppm-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP07_PPM"
CMDB_FAMILY = "SP03_CMDB"
METRICS = [
    {
        "metric_key": "approved_budget_usd",
        "metric_name": "Approved budget",
        "definition": "Approved program or initiative budget from the PPM extract.",
        "unit": "USD",
        "directionality": "neutral",
        "cadence": "point_in_time",
        "aggregation_rule": "sum",
        "source_field": "approved_budget_usd",
    },
    {
        "metric_key": "forecast_usd",
        "metric_name": "Forecast",
        "definition": "Current forecast for the program or initiative from the PPM extract.",
        "unit": "USD",
        "directionality": "lower_is_better",
        "cadence": "point_in_time",
        "aggregation_rule": "sum",
        "source_field": "forecast_usd",
    },
    {
        "metric_key": "target_value_usd",
        "metric_name": "Target value",
        "definition": "Target value associated with the program or initiative from the PPM extract.",
        "unit": "USD",
        "directionality": "higher_is_better",
        "cadence": "point_in_time",
        "aggregation_rule": "sum",
        "source_field": "target_value_usd",
    },
]


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-ppm:{seed}"))


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


def lifecycle_state(status: str | None) -> str:
    if status in {"approved", "proposed"}:
        return "planned"
    if status == "closed":
        return "retired"
    return "current"


def ecl_lifecycle_state(value: str | None) -> str:
    if value in {"current", "target", "planned", "actual", "baseline", "forecast", "benchmark", "retired", "candidate"}:
        return value
    if value in {"retire", "retiring", "retired_pending"}:
        return "retired"
    if value in {"future", "roadmap", "approved"}:
        return "planned"
    return "current"


def value_quality_state(row: dict[str, str]) -> str:
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
    lifecycle: str,
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
        "lifecycle_state": sql_text(lifecycle),
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
    relationship_type: str,
    to_object_id: str,
    source_record_id: str,
    attrs: dict[str, Any],
) -> dict[str, str]:
    return {
        "id": sql_text(relationship_id),
        "tenant_key": sql_text(tenant_key),
        "assessment_id": sql_text(assessment_id),
        "from_object_id": sql_text(from_object_id),
        "relationship_type": sql_text(relationship_type),
        "to_object_id": sql_text(to_object_id),
        "direction_label": sql_text(relationship_type.lower()),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text(review_state(attrs.get("review_state"))),
        "confidence": "null",
        "attributes_json": sql_json(attrs),
    }


def manifest_row(manifest: list[dict[str, str]], family: str) -> dict[str, str]:
    row = next((item for item in manifest if item["source_room_family"] == family), None)
    if row is None:
        raise AssertionError(f"{family} not found in source-room manifest")
    return row


def read_family(source_room_dir: Path, manifest: list[dict[str, str]], family: str) -> tuple[dict[str, str], Path, list[dict[str, str]]]:
    row = manifest_row(manifest, family)
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
    ppm_manifest, extract_path, rows = read_family(source_room_dir, manifest, FAMILY)
    _, _, cmdb_rows = read_family(source_room_dir, manifest, CMDB_FAMILY)
    application_lookup = {row["application_id"]: row for row in cmdb_rows}

    actual_hash = file_sha(extract_path)
    source_file_id = stable_uuid("source_file", tenant_key, assessment_id, FAMILY, actual_hash)
    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("ppm"),
            "origin": sql_text(origin),
            "source_owner": sql_text("Portfolio management, transformation, and finance governance owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_ppm",
                    "source_room_family": FAMILY,
                    "row_grain": ppm_manifest["row_grain"],
                    "input_fixture_state": "client_shaped_synthetic_extract",
                    "lookup_family": CMDB_FAMILY,
                    "collection_guidance": "program_initiative_summary_not_task_or_timesheet_detail",
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
    programs: set[str] = set()
    application_refs: set[str] = set()
    statuses: set[str] = set()
    unresolved_application_refs: set[str] = set()

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
                "parse_notes": sql_text("client_ppm_adapter"),
            }
        )

        status = row.get("status") or "unknown"
        statuses.add(status)
        function_name = row["sponsor_function"]
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
                lifecycle="current",
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={"adapter": "client_intake_ppm", "review_state": row.get("review_state")},
            ),
        )

        program_key = row["program_id"]
        program_id = stable_uuid("object", tenant_key, assessment_id, "program", program_key)
        programs.add(program_key)
        object_rows_by_key.setdefault(
            ("program", program_key),
            object_row(
                object_id=program_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=program_key,
                object_type="program",
                display_name=row["program_name"],
                business_domain=function_name,
                lifecycle=lifecycle_state(status),
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={
                    "adapter": "client_intake_ppm",
                    "initiative_id": row.get("initiative_id"),
                    "status": status,
                    "source_basis": row.get("source_basis"),
                    "source_review_state": row.get("review_state"),
                    "review_state": row.get("review_state"),
                },
            ),
        )

        relationship_key = (program_id, "FUNDED_BY", function_id)
        relationship_rows_by_key.setdefault(
            relationship_key,
            relationship_row(
                relationship_id=stable_uuid("relationship", *relationship_key),
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                from_object_id=program_id,
                relationship_type="FUNDED_BY",
                to_object_id=function_id,
                source_record_id=source_record_id,
                attrs={"adapter": "client_intake_ppm", "review_state": row.get("review_state")},
            ),
        )

        for app_ref in [part.strip() for part in row.get("dependent_applications", "").split(";") if part.strip()]:
            application_refs.add(app_ref)
            lookup = application_lookup.get(app_ref)
            if lookup is None:
                unresolved_application_refs.add(app_ref)
            app_id = stable_uuid("object", tenant_key, assessment_id, "application_reference", app_ref)
            object_rows_by_key.setdefault(
                ("application", app_ref),
                object_row(
                    object_id=app_id,
                    tenant_key=tenant_key,
                    assessment_id=assessment_id,
                    object_key=app_ref,
                    object_type="application",
                    display_name=lookup.get("application_name") if lookup else app_ref,
                    business_domain=lookup.get("business_function") if lookup else None,
                    lifecycle=ecl_lifecycle_state(lookup.get("lifecycle_state") if lookup else None),
                    source_record_id=source_record_id,
                    basis="source_recorded",
                    value_state="known" if lookup else "unknown",
                    attrs={
                        "adapter": "client_intake_ppm",
                        "reference_only": True,
                        "reference_source_field": "dependent_applications",
                        "lookup_family": CMDB_FAMILY,
                        "lookup_resolved": lookup is not None,
                        "application_ref": app_ref,
                        "vendor_name": lookup.get("vendor_name") if lookup else None,
                        "lookup_lifecycle_state": lookup.get("lifecycle_state") if lookup else None,
                        "review_state": row.get("review_state"),
                    },
                ),
            )
            change_key = (program_id, "CHANGES", app_id)
            relationship_rows_by_key.setdefault(
                change_key,
                relationship_row(
                    relationship_id=stable_uuid("relationship", *change_key),
                    tenant_key=tenant_key,
                    assessment_id=assessment_id,
                    from_object_id=program_id,
                    relationship_type="CHANGES",
                    to_object_id=app_id,
                    source_record_id=source_record_id,
                    attrs={
                        "adapter": "client_intake_ppm",
                        "application_ref": app_ref,
                        "lookup_resolved": lookup is not None,
                        "review_state": row.get("review_state"),
                    },
                ),
            )

        quality_state = value_quality_state(row)
        for metric in METRICS:
            value = metric_number(row.get(metric["source_field"]))
            basis = "source_recorded" if value is not None else "unknown"
            value_state = "known" if value is not None else "unknown"
            measure_rows.append(
                {
                    "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, program_id, metric["metric_key"], source_record_id)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "subject_object_id": sql_text(program_id),
                    "metric_key": sql_text(metric["metric_key"]),
                    "value_number": sql_num(value),
                    "value_text": "null",
                    "unit": sql_text(metric["unit"]),
                    "period_start": "null",
                    "period_end": "null",
                    "scenario": sql_text("current"),
                    "source_record_id": sql_text(source_record_id),
                    "document_extraction_id": "null",
                    "basis": sql_text(basis),
                    "value_state": sql_text(value_state),
                    "quality_state": sql_text(quality_state),
                    "review_state": sql_text(review_state(row.get("review_state"))),
                    "attributes_json": sql_json(
                        {
                            "adapter": "client_intake_ppm",
                            "source_field": metric["source_field"],
                            "program_id": program_key,
                            "initiative_id": row.get("initiative_id"),
                            "status": status,
                            "sponsor_function": function_name,
                            "dependent_applications": row.get("dependent_applications"),
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
    load_sql_path = out_dir / "client_intake_ppm_ecl_load.sql"
    summary_path = out_dir / "client_intake_ppm_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "business_function": len(functions),
        "program": len(programs),
        "application_reference": len(application_refs),
        "unresolved_application_reference": len(unresolved_application_refs),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "statuses": sorted(statuses),
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP07 PPM adapter; program, initiative, sponsor, dependent application, budget, forecast, and target value grain",
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
