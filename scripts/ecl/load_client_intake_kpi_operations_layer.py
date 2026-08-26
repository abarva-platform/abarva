#!/usr/bin/env python3

"""Adapt the SP10 KPI/operations source family into ECL source/context rows.

Local proof only. The source family is period, business-function, KPI, and
source-application grain. It captures operational metrics for Home, Tower,
Intelligence, and Source without pretending that every KPI is finance-grade or
fully attested. Semantic unit mismatches are preserved and routed to review.
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
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-kpi-operations-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-kpi-operations-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP10_KPI_Operations"
CMDB_FAMILY = "SP03_CMDB"

EXPECTED_KPI_UNITS = {
    "appointment access days": "days",
    "claims auto-adjudication rate": "percent",
    "cloud cost variance": "percent",
    "days in AR": "days",
    "denial overturn rate": "percent",
    "member NPS": "score",
    "nursing vacancy rate": "percent",
    "operating margin": "percent",
    "report freshness SLA": "percent",
    "supply fill rate": "percent",
}


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-kpi-operations:{seed}"))


def metric_key(kpi_name: str) -> str:
    digest = hashlib.sha1(kpi_name.encode("utf-8")).hexdigest()[:12]
    return f"kpi_{digest}"


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
    if unit_mismatch(row):
        return "partial"
    return "parsed"


def review_state(value: str | None, row: dict[str, str] | None = None) -> str:
    if row is not None and unit_mismatch(row):
        return "in_review"
    if value == "needs_follow_up":
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def metric_number(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def quarter_dates(period: str | None) -> tuple[str | None, str | None]:
    if not period or "-Q" not in period:
        return None, None
    year_text, quarter_text = period.split("-Q", 1)
    year = int(year_text)
    quarter = int(quarter_text)
    start_month = ((quarter - 1) * 3) + 1
    end_month = start_month + 2
    start = date(year, start_month, 1)
    if end_month == 12:
        end = date(year, 12, 31)
    else:
        end = date(year, end_month + 1, 1).replace(day=1)
        end = date.fromordinal(end.toordinal() - 1)
    return start.isoformat(), end.isoformat()


def unit_mismatch(row: dict[str, str]) -> bool:
    expected = EXPECTED_KPI_UNITS.get(row.get("kpi_name", ""))
    return expected is not None and expected != row.get("kpi_unit")


def quality_state(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap" or unit_mismatch(row):
        return "insufficient"
    if row.get("source_basis") == "owner_estimated":
        return "estimated"
    return "usable"


def basis_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "unknown"
    return "source_recorded" if row.get("kpi_value") else "unknown"


def value_state_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap" or not row.get("kpi_value"):
        return "unknown"
    return "known"


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
    manifest_row, extract_path, rows = read_family(source_room_dir, manifest, FAMILY)
    _, _, cmdb_rows = read_family(source_room_dir, manifest, CMDB_FAMILY)
    app_lookup = {row["application_id"]: row for row in cmdb_rows}

    actual_hash = file_sha(extract_path)
    source_file_id = stable_uuid("source_file", tenant_key, assessment_id, FAMILY, actual_hash)
    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("manual_workbook"),
            "origin": sql_text(origin),
            "source_owner": sql_text("Operations, performance, analytics, and functional KPI owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_kpi_operations",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "lookup_families": [CMDB_FAMILY],
                    "collection_guidance": "period_function_kpi_summary_not_full_reporting_mart_extract",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
    relationship_rows_by_key: dict[tuple[str, str, str], dict[str, str]] = {}
    metric_definition_rows_by_key: dict[str, dict[str, str]] = {}
    measure_rows: list[dict[str, str]] = []

    functions: set[str] = set()
    application_refs: set[str] = set()
    unresolved_application_refs: set[str] = set()
    kpi_names: set[str] = set()
    periods: set[str] = set()
    units: set[str] = set()
    unit_mismatches = 0

    for index, row in enumerate(rows, start=1):
        source_record_id = stable_uuid("source_record", tenant_key, assessment_id, FAMILY, row["source_row_id"])
        mismatch = unit_mismatch(row)
        if mismatch:
            unit_mismatches += 1
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
                "parse_notes": sql_text("unit_mismatch_requires_review" if mismatch else "client_kpi_operations_adapter"),
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
                attrs={"adapter": "client_intake_kpi_operations", "review_state": row.get("review_state")},
            ),
        )

        app_ref = row.get("source_application_ref") or ""
        application_refs.add(app_ref)
        app_lookup_row = app_lookup.get(app_ref)
        if app_lookup_row is None:
            unresolved_application_refs.add(app_ref)
        app_id = stable_uuid("object", tenant_key, assessment_id, "application_reference", app_ref)
        app_name = app_lookup_row.get("application_name") if app_lookup_row else app_ref
        object_rows_by_key.setdefault(
            ("application", app_ref),
            object_row(
                object_id=app_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=app_ref,
                object_type="application",
                display_name=app_name,
                business_domain=app_lookup_row.get("business_function") if app_lookup_row else function_name,
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known" if app_lookup_row else "unknown",
                attrs={
                    "adapter": "client_intake_kpi_operations",
                    "reference_only": True,
                    "reference_source_field": "source_application_ref",
                    "lookup_resolved": app_lookup_row is not None,
                    "lookup_family": CMDB_FAMILY,
                    "source_application_ref": app_ref,
                    "review_state": row.get("review_state"),
                },
            ),
        )

        relationship_key = (function_id, "SUPPORTED_BY", app_id)
        relationship_rows_by_key.setdefault(
            relationship_key,
            {
                "id": sql_text(stable_uuid("relationship", *relationship_key)),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "from_object_id": sql_text(function_id),
                "relationship_type": sql_text("SUPPORTED_BY"),
                "to_object_id": sql_text(app_id),
                "direction_label": sql_text("kpi source application"),
                "source_record_id": sql_text(source_record_id),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known" if app_lookup_row else "unknown"),
                "review_state": sql_text(review_state(row.get("review_state"), row)),
                "confidence": "null",
                "attributes_json": sql_json(
                    {
                        "adapter": "client_intake_kpi_operations",
                        "relationship_basis": "kpi_source_application_ref",
                        "kpi_name": row.get("kpi_name"),
                        "period": row.get("period"),
                        "source_review_state": row.get("review_state"),
                    }
                ),
            },
        )

        kpi_name = row["kpi_name"]
        kpi_names.add(kpi_name)
        periods.add(row.get("period") or "unknown")
        units.add(row.get("kpi_unit") or "unknown")
        key = metric_key(kpi_name)
        expected_unit = EXPECTED_KPI_UNITS.get(kpi_name)
        metric_definition_rows_by_key.setdefault(
            key,
            {
                "id": sql_text(stable_uuid("metric_definition", tenant_key, key)),
                "tenant_key": sql_text(tenant_key),
                "metric_key": sql_text(key),
                "metric_name": sql_text(kpi_name),
                "definition": sql_text(f"Operational KPI from SP10 source family: {kpi_name}."),
                "unit": sql_text(expected_unit or row.get("kpi_unit") or "value"),
                "directionality": sql_text("neutral"),
                "cadence": sql_text("quarterly"),
                "aggregation_rule": sql_text("avg"),
            },
        )

        period_start, period_end = quarter_dates(row.get("period"))
        value = None if row.get("source_basis") == "known_gap" else metric_number(row.get("kpi_value"))
        measure_rows.append(
            {
                "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, app_id, key, source_record_id)),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "subject_object_id": sql_text(app_id),
                "metric_key": sql_text(key),
                "value_number": sql_num(value),
                "value_text": "null",
                "unit": sql_text(row.get("kpi_unit")),
                "period_start": sql_text(period_start),
                "period_end": sql_text(period_end),
                "scenario": sql_text("current"),
                "source_record_id": sql_text(source_record_id),
                "document_extraction_id": "null",
                "basis": sql_text(basis_for(row)),
                "value_state": sql_text(value_state_for(row)),
                "quality_state": sql_text(quality_state(row)),
                "review_state": sql_text(review_state(row.get("review_state"), row)),
                "attributes_json": sql_json(
                    {
                        "adapter": "client_intake_kpi_operations",
                        "source_field": "kpi_value",
                        "business_function": function_name,
                        "source_application_ref": app_ref,
                        "kpi_name": kpi_name,
                        "source_unit": row.get("kpi_unit"),
                        "raw_kpi_value": row.get("kpi_value"),
                        "expected_unit": expected_unit,
                        "unit_mismatch": mismatch,
                        "target_value": row.get("target_value"),
                        "source_review_state": row.get("review_state"),
                    }
                ),
            }
        )

    object_rows = list(object_rows_by_key.values())
    relationship_rows = list(relationship_rows_by_key.values())
    metric_definition_rows = list(metric_definition_rows_by_key.values())
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
    load_sql_path = out_dir / "client_intake_kpi_operations_ecl_load.sql"
    summary_path = out_dir / "client_intake_kpi_operations_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "business_function": len(functions),
        "application_reference": len(application_refs),
        "unresolved_application_reference": len(unresolved_application_refs),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "kpi_names": sorted(kpi_names),
        "periods": sorted(periods),
        "units": sorted(units),
        "unit_mismatch_rows": unit_mismatches,
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP10 KPI/operations adapter; period, function, KPI, source application, value, target, unit, and review-state grain",
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
