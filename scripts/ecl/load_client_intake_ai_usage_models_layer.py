#!/usr/bin/env python3

"""Adapt the SP11 AI usage/models source family into ECL source/context rows."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import uuid
from datetime import date, timedelta
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOM_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-ai-usage-models-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-ai-usage-models-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP11_AI_Usage_Models"
PLACEHOLDER_VENDOR = "AbarVa synthetic vendor mapping"

METRICS = [
    {
        "metric_key": "ai_licensed_users",
        "metric_name": "AI licensed users",
        "definition": "Licensed user count for an AI tool, function, user segment, and month.",
        "unit": "users",
        "directionality": "neutral",
        "source_field": "licensed_users",
    },
    {
        "metric_key": "ai_active_users",
        "metric_name": "AI active users",
        "definition": "Active user count for an AI tool, function, user segment, and month.",
        "unit": "users",
        "directionality": "higher_is_better",
        "source_field": "active_users",
    },
    {
        "metric_key": "ai_usage_events",
        "metric_name": "AI usage events",
        "definition": "Usage event count for an AI tool, function, user segment, and month.",
        "unit": "count",
        "directionality": "neutral",
        "source_field": "usage_events",
    },
    {
        "metric_key": "ai_monthly_cost_usd",
        "metric_name": "AI monthly cost",
        "definition": "Monthly AI tool cost for a function, user segment, and use case.",
        "unit": "USD",
        "directionality": "lower_is_better",
        "source_field": "monthly_cost_usd",
    },
]


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-ai-usage:{seed}"))


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


def is_placeholder_vendor(row: dict[str, str]) -> bool:
    return row.get("vendor_name") == PLACEHOLDER_VENDOR


def parse_state_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap" or row.get("review_state") in {"needs_follow_up", "partial"}:
        return "partial"
    if is_placeholder_vendor(row):
        return "partial"
    return "parsed"


def review_state(value: str | None, row: dict[str, str] | None = None) -> str:
    if row is not None and is_placeholder_vendor(row):
        return "in_review"
    if value == "needs_follow_up":
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def value_quality_state(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "insufficient"
    if row.get("source_basis") == "owner_estimated" or is_placeholder_vendor(row):
        return "estimated"
    return "usable"


def metric_value(row: dict[str, str], source_field: str) -> float | None:
    if row.get("source_basis") == "known_gap":
        return None
    value = row.get(source_field)
    if value is None or value == "":
        return None
    return float(value)


def month_dates(period: str | None) -> tuple[str | None, str | None]:
    if not period:
        return None, None
    year_text, month_text = period.split("-", 1)
    start = date(int(year_text), int(month_text), 1)
    if start.month == 12:
        next_month = date(start.year + 1, 1, 1)
    else:
        next_month = date(start.year, start.month + 1, 1)
    end = next_month - timedelta(days=1)
    return start.isoformat(), end.isoformat()


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
    relationship_type: str,
    to_object_id: str,
    source_record_id: str,
    value_state: str,
    row: dict[str, str],
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
        "value_state": sql_text(value_state),
        "review_state": sql_text(review_state(row.get("review_state"), row)),
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

    actual_hash = file_sha(extract_path)
    source_file_id = stable_uuid("source_file", tenant_key, assessment_id, FAMILY, actual_hash)
    source_file_rows = [
        {
            "id": sql_text(source_file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("ai_telemetry"),
            "origin": sql_text(origin),
            "source_owner": sql_text("AI platform, security, operations, and functional analytics owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_ai_usage_models",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "collection_guidance": "tool_model_use_case_function_user_segment_month_summary_not_prompt_logs",
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
            "cadence": sql_text("monthly"),
            "aggregation_rule": sql_text("sum"),
        }
        for metric in METRICS
    ]
    measure_rows: list[dict[str, str]] = []

    functions: set[str] = set()
    tools: set[str] = set()
    use_cases: set[str] = set()
    personas: set[str] = set()
    vendors: set[str] = set()
    placeholder_vendor_rows = 0
    periods: set[str] = set()
    categories: set[str] = set()

    for index, row in enumerate(rows, start=1):
        source_record_id = stable_uuid("source_record", tenant_key, assessment_id, FAMILY, row["source_row_id"])
        placeholder_vendor = is_placeholder_vendor(row)
        if placeholder_vendor:
            placeholder_vendor_rows += 1
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
                "parse_notes": sql_text("placeholder_vendor_requires_review" if placeholder_vendor else "client_ai_usage_models_adapter"),
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
                attrs={"adapter": "client_intake_ai_usage_models", "review_state": row.get("review_state")},
            ),
        )

        tool_name = row["tool_name"]
        tool_id = stable_uuid("object", tenant_key, assessment_id, "ai_tool", tool_name)
        tools.add(tool_name)
        object_rows_by_key.setdefault(
            ("ai_tool", tool_name),
            object_row(
                object_id=tool_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=tool_name,
                object_type="ai_tool",
                display_name=tool_name,
                business_domain="AI Usage",
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={"adapter": "client_intake_ai_usage_models", "source_review_state": row.get("review_state")},
            ),
        )

        use_case_name = row["use_case_name"]
        use_case_id = stable_uuid("object", tenant_key, assessment_id, "ai_use_case", use_case_name)
        use_cases.add(use_case_name)
        categories.add(row.get("use_case_category") or "unknown")
        object_rows_by_key.setdefault(
            ("ai_use_case", use_case_name),
            object_row(
                object_id=use_case_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=use_case_name,
                object_type="ai_use_case",
                display_name=use_case_name,
                business_domain=function_name,
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={
                    "adapter": "client_intake_ai_usage_models",
                    "use_case_category": row.get("use_case_category"),
                    "source_review_state": row.get("review_state"),
                },
            ),
        )

        persona_key = row["user_segment"]
        persona_id = stable_uuid("object", tenant_key, assessment_id, "persona", persona_key)
        personas.add(persona_key)
        object_rows_by_key.setdefault(
            ("persona", persona_key),
            object_row(
                object_id=persona_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=persona_key,
                object_type="persona",
                display_name=persona_key.replace("_", " ").title(),
                business_domain="AI Usage",
                source_record_id=source_record_id,
                basis="source_recorded",
                value_state="known",
                attrs={"adapter": "client_intake_ai_usage_models", "source_review_state": row.get("review_state")},
            ),
        )

        vendor_name = row["vendor_name"]
        vendor_key = "UNKNOWN_AI_VENDOR_SYNTHETIC_MAPPING" if placeholder_vendor else vendor_name
        vendor_id = stable_uuid("object", tenant_key, assessment_id, "vendor", vendor_key)
        vendors.add(vendor_key)
        object_rows_by_key.setdefault(
            ("vendor", vendor_key),
            object_row(
                object_id=vendor_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=vendor_key,
                object_type="vendor",
                display_name="Unknown AI vendor (source placeholder)" if placeholder_vendor else vendor_name,
                business_domain="AI Usage",
                source_record_id=source_record_id,
                basis="unknown" if placeholder_vendor else "source_recorded",
                value_state="unknown" if placeholder_vendor else "known",
                attrs={
                    "adapter": "client_intake_ai_usage_models",
                    "raw_vendor_name": vendor_name,
                    "placeholder_vendor": placeholder_vendor,
                    "review_state": "needs_follow_up" if placeholder_vendor else row.get("review_state"),
                },
            ),
        )

        relationships = [
            (function_id, "SUPPORTED_BY", use_case_id, "function_ai_use_case"),
            (use_case_id, "SUPPORTED_BY", tool_id, "use_case_ai_tool"),
            (use_case_id, "USED_BY", persona_id, "use_case_persona"),
            (tool_id, "SUPPLIED_BY", vendor_id, "tool_vendor"),
        ]
        for from_id, relationship_type, to_id, basis in relationships:
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
                    value_state="unknown" if basis == "tool_vendor" and placeholder_vendor else "known",
                    row=row,
                    attrs={
                        "adapter": "client_intake_ai_usage_models",
                        "relationship_basis": basis,
                        "tool_name": tool_name,
                        "model_name": row.get("model_name"),
                        "use_case_name": use_case_name,
                        "business_function": function_name,
                        "user_segment": persona_key,
                        "raw_vendor_name": vendor_name,
                        "placeholder_vendor": placeholder_vendor,
                    },
                ),
            )

        period_start, period_end = month_dates(row.get("period"))
        periods.add(row.get("period") or "unknown")
        for metric in METRICS:
            value = metric_value(row, metric["source_field"])
            measure_rows.append(
                {
                    "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, use_case_id, metric["metric_key"], source_record_id)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "subject_object_id": sql_text(use_case_id),
                    "metric_key": sql_text(metric["metric_key"]),
                    "value_number": sql_num(value),
                    "value_text": "null",
                    "unit": sql_text(metric["unit"]),
                    "period_start": sql_text(period_start),
                    "period_end": sql_text(period_end),
                    "scenario": sql_text("current"),
                    "source_record_id": sql_text(source_record_id),
                    "document_extraction_id": "null",
                    "basis": sql_text("unknown" if value is None else "source_recorded"),
                    "value_state": sql_text("unknown" if value is None else "known"),
                    "quality_state": sql_text(value_quality_state(row)),
                    "review_state": sql_text(review_state(row.get("review_state"), row)),
                    "attributes_json": sql_json(
                        {
                            "adapter": "client_intake_ai_usage_models",
                            "source_field": metric["source_field"],
                            "period": row.get("period"),
                            "tool_name": tool_name,
                            "model_name": row.get("model_name"),
                            "use_case_name": use_case_name,
                            "use_case_category": row.get("use_case_category"),
                            "business_function": function_name,
                            "user_segment": persona_key,
                            "raw_vendor_name": vendor_name,
                            "placeholder_vendor": placeholder_vendor,
                            "source_review_state": row.get("review_state"),
                            "raw_value": row.get(metric["source_field"]),
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
    load_sql_path = out_dir / "client_intake_ai_usage_models_ecl_load.sql"
    summary_path = out_dir / "client_intake_ai_usage_models_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "business_function": len(functions),
        "ai_tool": len(tools),
        "ai_use_case": len(use_cases),
        "persona": len(personas),
        "vendor_reference": len(vendors),
        "placeholder_vendor_rows": placeholder_vendor_rows,
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "periods": sorted(periods),
        "use_case_categories": sorted(categories),
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP11 AI usage/models adapter; month, tool, model, use case, function, user segment, usage, license, event, and cost grain",
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
