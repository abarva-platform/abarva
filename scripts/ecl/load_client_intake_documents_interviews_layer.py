#!/usr/bin/env python3

"""Adapt the SP01 documents/interviews source family into ECL rows.

Local proof only. The source family is one row per interview answer or
thematic excerpt. It intentionally records interview-summary evidence, not
raw transcripts or personal HR records.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOM_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-documents-interviews-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-documents-interviews-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP01_Documents_Interviews"

METRICS = [
    {
        "metric_key": "interview_excerpt_count",
        "metric_name": "Interview excerpt count",
        "definition": "Count of interview answer or thematic excerpt rows by function.",
        "unit": "count",
        "directionality": "neutral",
    },
    {
        "metric_key": "interview_high_priority_signal_count",
        "metric_name": "High-priority interview signal count",
        "definition": "Count of high-priority signals captured from interview summaries by function.",
        "unit": "count",
        "directionality": "neutral",
    },
    {
        "metric_key": "interview_follow_up_count",
        "metric_name": "Interview follow-up count",
        "definition": "Count of interview rows requiring follow-up by function.",
        "unit": "count",
        "directionality": "lower_is_better",
    },
    {
        "metric_key": "interview_known_gap_count",
        "metric_name": "Interview known-gap count",
        "definition": "Count of interview rows explicitly marked as known gaps by function.",
        "unit": "count",
        "directionality": "lower_is_better",
    },
]


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-documents-interviews:{seed}"))


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


def read_family(source_room_dir: Path) -> tuple[dict[str, str], Path, list[dict[str, str]]]:
    manifest = read_csv(source_room_dir / "dense_source_room_manifest.csv")
    row = next((item for item in manifest if item["source_room_family"] == FAMILY), None)
    if row is None:
        raise AssertionError(f"{FAMILY} not found in source-room manifest")
    path = source_room_dir / row["file_path"]
    rows = read_csv(path)
    if len(rows) != int(row["row_count"]):
        raise AssertionError(f"{FAMILY} manifest row_count={row['row_count']} but read {len(rows)} rows")
    actual_hash = file_sha(path)
    if row["sha256"] != actual_hash:
        raise AssertionError(f"{FAMILY} manifest hash does not match extract hash")
    return row, path, rows


def slug(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace("&", "and")
        .replace("/", "_")
        .replace(" ", "_")
        .replace("-", "_")
    )


def review_state(value: str | None, *, partial: bool = False) -> str:
    if partial or value in {"needs_follow_up", "partial"}:
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def row_is_partial(row: dict[str, str]) -> bool:
    return row.get("source_basis") == "known_gap" or row.get("review_state") in {"needs_follow_up", "partial"}


def parse_state_for(row: dict[str, str]) -> str:
    return "partial" if row_is_partial(row) else "parsed"


def parse_notes_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "known_gap_requires_review"
    if row.get("review_state") in {"needs_follow_up", "partial"}:
        return "needs_follow_up"
    return "client_documents_interviews_adapter"


def basis_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "unknown"
    if row.get("source_basis") == "owner_estimated":
        return "model_inferred"
    return "interview_derived"


def value_state_for(row: dict[str, str]) -> str:
    return "unknown" if row.get("source_basis") == "known_gap" else "known"


def quality_state_for(row: dict[str, str]) -> str:
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
    row_review_state: str,
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


def build(args: argparse.Namespace) -> dict[str, Any]:
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest_row, source_path, rows = read_family(Path(args.source_room_dir))
    tenant_key = args.tenant_key
    assessment_id = args.assessment_id
    file_id = stable_uuid(tenant_key, assessment_id, FAMILY, manifest_row["sha256"])

    source_file_rows = [
        {
            "id": sql_text(file_id),
            "tenant_key": sql_text(tenant_key),
            "assessment_id": sql_text(assessment_id),
            "source_type": sql_text("interview"),
            "origin": sql_text("client_intake"),
            "source_owner": sql_text("Executive sponsors, function leaders, and engagement interview lead"),
            "file_name": sql_text(source_path.name),
            "blob_uri": sql_text(f"client-intake://{tenant_key}/{FAMILY}/{source_path.name}"),
            "file_hash": sql_text(manifest_row["sha256"]),
            "source_date": sql_text(args.source_date),
            "access_class": sql_text("client_confidential"),
            "quality_state": sql_text("partial" if any(row_is_partial(row) for row in rows) else "accepted"),
            "metadata_json": sql_json(
                {
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "source_system": rows[0]["source_system"] if rows else "unknown",
                    "source_path": str(source_path.relative_to(Path(args.source_room_dir))),
                }
            ),
        }
    ]

    source_record_rows = []
    document_rows = []
    extraction_rows = []
    source_record_ids: dict[str, str] = {}
    document_ids: dict[str, str] = {}
    extraction_ids: dict[str, str] = {}

    for idx, row in enumerate(rows, start=1):
        native_id = row["source_row_id"]
        source_record_id = stable_uuid(tenant_key, assessment_id, FAMILY, native_id, "source_record")
        document_id = stable_uuid(tenant_key, assessment_id, FAMILY, row["interview_id"], "document")
        extraction_id = stable_uuid(tenant_key, assessment_id, FAMILY, row["interview_id"], row["question_id"], "extraction")
        source_record_ids[native_id] = source_record_id
        document_ids[native_id] = document_id
        extraction_ids[native_id] = extraction_id
        partial = row_is_partial(row)

        source_record_rows.append(
            {
                "id": sql_text(source_record_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "source_file_id": sql_text(file_id),
                "native_id": sql_text(native_id),
                "record_type": sql_text(FAMILY),
                "row_number": sql_num(idx),
                "payload_json": sql_json(row),
                "parse_state": sql_text(parse_state_for(row)),
                "parse_notes": sql_text(parse_notes_for(row)),
            }
        )

        title = f"{row['interviewee_role']} interview note - {row['function']} - {row['question_id']}"
        document_rows.append(
            {
                "id": sql_text(document_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "source_file_id": sql_text(file_id),
                "document_key": sql_text(f"SP01-{row['interview_id']}"),
                "document_type": sql_text("interview_notes"),
                "title": sql_text(title),
                "file_hash": sql_text(stable_uuid(manifest_row["sha256"], row["interview_id"])),
                "page_count": sql_num(1 + (idx % 3)),
                "effective_date": sql_text(args.source_date),
                "access_class": sql_text("client_confidential"),
                "review_state": sql_text(review_state(row.get("review_state"), partial=partial)),
            }
        )

        excerpt = row["answer_excerpt"]
        span_start = 80 + (idx * 17)
        span_end = span_start + min(len(excerpt), 180)
        extraction_rows.append(
            {
                "id": sql_text(extraction_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "document_id": sql_text(document_id),
                "field_key": sql_text("interview_answer_excerpt"),
                "extracted_value": sql_text(excerpt),
                "normalized_value_json": sql_json(
                    {
                        "interview_id": row["interview_id"],
                        "interviewee_role": row["interviewee_role"],
                        "function": row["function"],
                        "seniority_band": row["seniority_band"],
                        "question_id": row["question_id"],
                        "theme": row["theme"],
                        "priority_signal": row["priority_signal"],
                        "ai_implication": row["ai_implication"],
                        "source_basis": row["source_basis"],
                        "review_state": row["review_state"],
                    }
                ),
                "page_number": sql_num(1 + (idx % 3)),
                "span_reference": sql_text(f"p{1 + (idx % 3)}:{span_start}-{span_end}"),
                "basis": sql_text("interview_derived" if row["source_basis"] != "known_gap" else "unknown"),
                "confidence": sql_num(round(0.71 + ((idx % 23) / 100), 4)),
                "human_verification_state": sql_text("unverified"),
            }
        )

    first_by_function: dict[str, dict[str, str]] = {}
    first_by_role: dict[str, dict[str, str]] = {}
    first_by_theme: dict[str, dict[str, str]] = {}
    for row in rows:
        first_by_function.setdefault(row["function"], row)
        first_by_role.setdefault(row["interviewee_role"], row)
        first_by_theme.setdefault(row["theme"], row)

    object_rows = []
    object_ids: dict[tuple[str, str], str] = {}

    for function, row in sorted(first_by_function.items()):
        object_id = stable_uuid(tenant_key, assessment_id, "business_function", function)
        object_ids[("business_function", function)] = object_id
        partial = row_is_partial(row)
        object_rows.append(
            object_row(
                object_id=object_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=f"function:{slug(function)}",
                object_type="business_function",
                display_name=function,
                business_domain=function,
                source_record_id=source_record_ids[row["source_row_id"]],
                basis=basis_for(row),
                value_state=value_state_for(row),
                row_review_state=row["review_state"],
                partial=partial,
                attrs={"source_family": FAMILY, "context_grain": "interview_function"},
            )
        )

    for role, row in sorted(first_by_role.items()):
        object_id = stable_uuid(tenant_key, assessment_id, "persona", role)
        object_ids[("persona", role)] = object_id
        partial = row_is_partial(row)
        object_rows.append(
            object_row(
                object_id=object_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=f"interview_role:{slug(role)}",
                object_type="persona",
                display_name=role,
                business_domain=row["function"],
                source_record_id=source_record_ids[row["source_row_id"]],
                basis=basis_for(row),
                value_state=value_state_for(row),
                row_review_state=row["review_state"],
                partial=partial,
                attrs={"source_family": FAMILY, "context_grain": "interviewee_role", "seniority_band": row["seniority_band"]},
            )
        )

    for theme, row in sorted(first_by_theme.items()):
        object_id = stable_uuid(tenant_key, assessment_id, "process", theme)
        object_ids[("process", theme)] = object_id
        partial = row_is_partial(row)
        object_rows.append(
            object_row(
                object_id=object_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=f"interview_theme:{slug(theme)}",
                object_type="process",
                display_name=theme.title(),
                business_domain=None,
                source_record_id=source_record_ids[row["source_row_id"]],
                basis=basis_for(row),
                value_state=value_state_for(row),
                row_review_state=row["review_state"],
                partial=partial,
                attrs={"source_family": FAMILY, "context_grain": "interview_theme"},
            )
        )

    pair_first: dict[tuple[str, str, str], dict[str, str]] = {}
    pair_partial: dict[tuple[str, str, str], bool] = defaultdict(bool)
    for row in rows:
        for key in [
            ("role_function", row["interviewee_role"], row["function"]),
            ("theme_function", row["theme"], row["function"]),
        ]:
            pair_first.setdefault(key, row)
            pair_partial[key] = pair_partial[key] or row_is_partial(row)

    relationship_rows = []
    for (kind, left, function), row in sorted(pair_first.items()):
        source_record_id = source_record_ids[row["source_row_id"]]
        partial = pair_partial[(kind, left, function)]
        if kind == "role_function":
            from_object_id = object_ids[("persona", left)]
            to_object_id = object_ids[("business_function", function)]
            relationship_type = "USED_BY"
            basis_label = "interview_role_function"
        else:
            from_object_id = object_ids[("process", left)]
            to_object_id = object_ids[("business_function", function)]
            relationship_type = "SUPPORTED_BY"
            basis_label = "interview_theme_function"
        relationship_rows.append(
            relationship_row(
                relationship_id=stable_uuid(tenant_key, assessment_id, "relationship", kind, left, function),
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                from_object_id=from_object_id,
                relationship_type=relationship_type,
                to_object_id=to_object_id,
                source_record_id=source_record_id,
                row=row,
                partial=partial,
                attrs={"source_family": FAMILY, "relationship_basis": basis_label},
            )
        )

    metric_definition_rows = [
        {
            "id": sql_text(stable_uuid(tenant_key, "metric_definition", metric["metric_key"])),
            "tenant_key": sql_text(tenant_key),
            "metric_key": sql_text(metric["metric_key"]),
            "metric_name": sql_text(metric["metric_name"]),
            "definition": sql_text(metric["definition"]),
            "unit": sql_text(metric["unit"]),
            "directionality": sql_text(metric["directionality"]),
            "cadence": sql_text("point_in_time"),
            "aggregation_rule": sql_text("sum"),
        }
        for metric in METRICS
    ]

    by_function: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_function[row["function"]].append(row)

    measure_rows = []
    for function, function_rows in sorted(by_function.items()):
        representative = function_rows[0]
        source_record_id = source_record_ids[representative["source_row_id"]]
        function_object_id = object_ids[("business_function", function)]
        values = {
            "interview_excerpt_count": len(function_rows),
            "interview_high_priority_signal_count": sum(1 for row in function_rows if row["priority_signal"] == "high"),
            "interview_follow_up_count": sum(1 for row in function_rows if row["review_state"] == "needs_follow_up"),
            "interview_known_gap_count": sum(1 for row in function_rows if row["source_basis"] == "known_gap"),
        }
        for metric in METRICS:
            metric_key = metric["metric_key"]
            measure_rows.append(
                {
                    "id": sql_text(stable_uuid(tenant_key, assessment_id, "measure", function, metric_key)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "subject_object_id": sql_text(function_object_id),
                    "metric_key": sql_text(metric_key),
                    "value_number": sql_num(values[metric_key]),
                    "value_text": "null",
                    "unit": sql_text(metric["unit"]),
                    "period_start": sql_text(args.source_date),
                    "period_end": sql_text(args.source_date),
                    "scenario": sql_text("current"),
                    "source_record_id": sql_text(source_record_id),
                    "document_extraction_id": "null",
                    "basis": sql_text("calculated"),
                    "value_state": sql_text("known"),
                    "quality_state": sql_text("usable"),
                    "review_state": sql_text("in_review" if any(row_is_partial(row) for row in function_rows) else "not_reviewed"),
                    "attributes_json": sql_json(
                        {
                            "source_family": FAMILY,
                            "function": function,
                            "metric_source": "interview_summary_rows",
                        }
                    ),
                }
            )

    sql_parts = [
        "begin;\n",
        insert_sql(
            "ecl_source.source_file",
            [
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
            ],
            source_file_rows,
        ),
        insert_sql(
            "ecl_source.source_record",
            [
                "id",
                "tenant_key",
                "assessment_id",
                "source_file_id",
                "native_id",
                "record_type",
                "row_number",
                "payload_json",
                "parse_state",
                "parse_notes",
            ],
            source_record_rows,
        ),
        insert_sql(
            "ecl_source.document",
            [
                "id",
                "tenant_key",
                "assessment_id",
                "source_file_id",
                "document_key",
                "document_type",
                "title",
                "file_hash",
                "page_count",
                "effective_date",
                "access_class",
                "review_state",
            ],
            document_rows,
        ),
        insert_sql(
            "ecl_source.document_extraction",
            [
                "id",
                "tenant_key",
                "assessment_id",
                "document_id",
                "field_key",
                "extracted_value",
                "normalized_value_json",
                "page_number",
                "span_reference",
                "basis",
                "confidence",
                "human_verification_state",
            ],
            extraction_rows,
        ),
        insert_sql(
            "ecl_context.object",
            [
                "id",
                "tenant_key",
                "assessment_id",
                "object_key",
                "object_type",
                "display_name",
                "business_domain",
                "lifecycle_state",
                "source_record_id",
                "basis",
                "value_state",
                "review_state",
                "confidence",
                "attributes_json",
            ],
            object_rows,
        ),
        insert_sql(
            "ecl_context.relationship",
            [
                "id",
                "tenant_key",
                "assessment_id",
                "from_object_id",
                "relationship_type",
                "to_object_id",
                "direction_label",
                "source_record_id",
                "basis",
                "value_state",
                "review_state",
                "confidence",
                "attributes_json",
            ],
            relationship_rows,
        ),
        insert_sql(
            "ecl_context.metric_definition",
            [
                "id",
                "tenant_key",
                "metric_key",
                "metric_name",
                "definition",
                "unit",
                "directionality",
                "cadence",
                "aggregation_rule",
            ],
            metric_definition_rows,
        ),
        insert_sql(
            "ecl_context.measure",
            [
                "id",
                "tenant_key",
                "assessment_id",
                "subject_object_id",
                "metric_key",
                "value_number",
                "value_text",
                "unit",
                "period_start",
                "period_end",
                "scenario",
                "source_record_id",
                "document_extraction_id",
                "basis",
                "value_state",
                "quality_state",
                "review_state",
                "attributes_json",
            ],
            measure_rows,
        ),
        "commit;\n",
    ]

    load_sql = out_dir / "client_intake_documents_interviews_ecl_load.sql"
    load_sql.write_text("\n".join(sql_parts), encoding="utf-8")

    partial_rows = [row for row in rows if row_is_partial(row)]
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "scope": "SP01 documents/interviews adapter; interview answer, thematic excerpt, role, function, and theme grain",
        "source_origin": "client_intake",
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "document": len(document_rows),
        "document_extraction": len(extraction_rows),
        "business_function": len(first_by_function),
        "interview_role": len(first_by_role),
        "interview_theme": len(first_by_theme),
        "object": len(object_rows),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "partial_source_record": len(partial_rows),
        "known_gap_rows": sum(1 for row in rows if row["source_basis"] == "known_gap"),
        "owner_estimated_rows": sum(1 for row in rows if row["source_basis"] == "owner_estimated"),
        "needs_follow_up_rows": sum(1 for row in rows if row["review_state"] == "needs_follow_up"),
        "distinct_extraction_spans": len({row["span_reference"] for row in extraction_rows}),
        "load_sql": str(load_sql),
        "summary_json": str(out_dir / "client_intake_documents_interviews_summary.json"),
    }
    (out_dir / "client_intake_documents_interviews_summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-room-dir", default=str(DEFAULT_SOURCE_ROOM_DIR))
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    parser.add_argument("--tenant-key", default=DEFAULT_TENANT_KEY)
    parser.add_argument("--assessment-id", default=DEFAULT_ASSESSMENT_ID)
    parser.add_argument("--source-date", default=DEFAULT_SOURCE_DATE)
    args = parser.parse_args()
    print(json.dumps(build(args), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
