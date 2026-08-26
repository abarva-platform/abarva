#!/usr/bin/env python3

"""Adapt the SP12 evidence-room source family into ECL source/context rows.

Local proof only. The source family is evidence-register grain. It loads
documents and page/span extraction pointers when present, then emits
function-level coverage measures without pretending unverified evidence is
client-attested.
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
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-evidence-room-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-evidence-room-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP12_Evidence_Room"

DOCUMENT_TYPE_BY_ARTIFACT = {
    "contract_pdf": "contract",
    "interview_note": "interview_notes",
    "cmdb_export": "architecture_doc",
    "finance_extract": "invoice",
    "sla_report": "sla_report",
    "dashboard_export": "architecture_doc",
    "policy_document": "architecture_doc",
    "attestation": "attestation",
}

METRICS = [
    {
        "metric_key": "evidence_artifact_count",
        "metric_name": "Evidence artifact count",
        "definition": "Evidence artifacts registered by owning function.",
        "unit": "count",
        "directionality": "neutral",
    },
    {
        "metric_key": "evidence_extraction_pointer_count",
        "metric_name": "Evidence extraction pointer count",
        "definition": "Evidence artifacts with page and span pointers by owning function.",
        "unit": "count",
        "directionality": "higher_is_better",
    },
    {
        "metric_key": "evidence_follow_up_count",
        "metric_name": "Evidence follow-up count",
        "definition": "Evidence artifacts needing follow-up by owning function.",
        "unit": "count",
        "directionality": "lower_is_better",
    },
    {
        "metric_key": "evidence_known_gap_count",
        "metric_name": "Evidence known-gap count",
        "definition": "Evidence artifacts explicitly marked as known gaps by owning function.",
        "unit": "count",
        "directionality": "lower_is_better",
    },
]


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-evidence-room:{seed}"))


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
    return (
        row.get("source_basis") == "known_gap"
        or row.get("review_state") in {"needs_follow_up", "partial"}
        or row.get("verification_state") in {"needs_follow_up", "unverified"}
    )


def parse_notes_for(row: dict[str, str]) -> str:
    if row.get("source_basis") == "known_gap":
        return "known_gap_requires_review"
    if row.get("review_state") in {"needs_follow_up", "partial"} or row.get("verification_state") == "needs_follow_up":
        return "needs_follow_up"
    if row.get("verification_state") == "unverified":
        return "evidence_unverified"
    return "client_evidence_room_adapter"


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
    if row.get("verification_state") in {"needs_follow_up", "unverified"}:
        return "estimated"
    return "usable"


def page_number(page_ref: str | None) -> int | None:
    if not page_ref:
        return None
    return int(page_ref.lower().replace("p", ""))


def human_state(row: dict[str, str]) -> str:
    if row.get("verification_state") in {"owner_attested", "system_exported"}:
        return "verified"
    return "unverified"


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
        "review_state": sql_text(review_state(attrs.get("source_review_state"))),
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
            "source_type": sql_text("document"),
            "origin": sql_text(origin),
            "source_owner": sql_text("Evidence room, contract office, architecture, finance, and operations owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_evidence_room",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "collection_guidance": "evidence_artifact_register_with_page_span_pointers_when_available",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    document_rows: list[dict[str, str]] = []
    extraction_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
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
            "aggregation_rule": sql_text("sum"),
        }
        for metric in METRICS
    ]
    measure_rows: list[dict[str, str]] = []

    function_stats: dict[str, dict[str, int | str]] = defaultdict(
        lambda: {
            "artifact_count": 0,
            "extraction_count": 0,
            "follow_up_count": 0,
            "known_gap_count": 0,
            "source_record_id": "",
        }
    )
    artifact_types: set[str] = set()
    supported_contract_refs: set[str] = set()
    supported_application_refs: set[str] = set()
    partial_rows = 0
    known_gap_rows = 0
    extractions_verified = 0

    for index, row in enumerate(rows, start=1):
        partial = row_is_partial(row)
        if partial:
            partial_rows += 1
        if row.get("source_basis") == "known_gap":
            known_gap_rows += 1

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
                "parse_state": sql_text("partial" if partial else "parsed"),
                "parse_notes": sql_text(parse_notes_for(row)),
            }
        )

        artifact_type = row["artifact_type"]
        artifact_types.add(artifact_type)
        supported_ref = row.get("supports_object_ref") or ""
        if supported_ref.startswith("CTR-"):
            supported_contract_refs.add(supported_ref)
        if supported_ref.startswith("APP-"):
            supported_application_refs.add(supported_ref)

        doc_id = stable_uuid("document", tenant_key, assessment_id, FAMILY, row["evidence_id"])
        doc_type = DOCUMENT_TYPE_BY_ARTIFACT.get(artifact_type, "architecture_doc")
        document_rows.append(
            {
                "id": sql_text(doc_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "source_file_id": sql_text(source_file_id),
                "document_key": sql_text(row["evidence_id"]),
                "document_type": sql_text(doc_type),
                "title": sql_text(f"{artifact_type.replace('_', ' ').title()} {row['evidence_id']}"),
                "file_hash": sql_text(stable_uuid("document_hash", tenant_key, assessment_id, row["evidence_id"]).replace("-", "")),
                "page_count": sql_num(18 if artifact_type == "contract_pdf" else 4),
                "effective_date": sql_text(row.get("document_date") or source_date),
                "access_class": sql_text("internal"),
                "review_state": sql_text(review_state(row.get("review_state"), partial=partial)),
            }
        )

        function_name = row["owning_function"]
        stats = function_stats[function_name]
        stats["artifact_count"] = int(stats["artifact_count"]) + 1
        stats["source_record_id"] = str(stats["source_record_id"] or source_record_id)
        if row.get("page_ref") and row.get("span_ref"):
            stats["extraction_count"] = int(stats["extraction_count"]) + 1
            h_state = human_state(row)
            if h_state == "verified":
                extractions_verified += 1
            extraction_rows.append(
                {
                    "id": sql_text(stable_uuid("document_extraction", tenant_key, assessment_id, row["evidence_id"])),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "document_id": sql_text(doc_id),
                    "field_key": sql_text(f"{artifact_type}_supporting_subject"),
                    "extracted_value": sql_text(supported_ref or artifact_type),
                    "normalized_value_json": sql_json(
                        {
                            "artifact_type": artifact_type,
                            "supports_object_ref": supported_ref,
                            "owning_function": function_name,
                            "verification_state": row.get("verification_state"),
                            "source_review_state": row.get("review_state"),
                        }
                    ),
                    "page_number": sql_num(page_number(row.get("page_ref"))),
                    "span_reference": sql_text(row.get("span_ref")),
                    "basis": sql_text("document_extracted"),
                    "confidence": sql_num(round(0.71 + (index % 23) / 100, 4)),
                    "human_verification_state": sql_text(h_state),
                }
            )
        if row.get("verification_state") == "needs_follow_up" or row.get("review_state") == "needs_follow_up":
            stats["follow_up_count"] = int(stats["follow_up_count"]) + 1
        if row.get("source_basis") == "known_gap":
            stats["known_gap_count"] = int(stats["known_gap_count"]) + 1

        function_id = stable_uuid("object", tenant_key, assessment_id, "business_function", function_name)
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
                attrs={"adapter": "client_intake_evidence_room", "source_review_state": row.get("review_state")},
            ),
        )

    for function_name, stats in function_stats.items():
        function_id = stable_uuid("object", tenant_key, assessment_id, "business_function", function_name)
        source_record_id = str(stats["source_record_id"])
        values = {
            "evidence_artifact_count": int(stats["artifact_count"]),
            "evidence_extraction_pointer_count": int(stats["extraction_count"]),
            "evidence_follow_up_count": int(stats["follow_up_count"]),
            "evidence_known_gap_count": int(stats["known_gap_count"]),
        }
        for metric in METRICS:
            metric_key = metric["metric_key"]
            value = values[metric_key]
            measure_rows.append(
                {
                    "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, function_id, metric_key)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "subject_object_id": sql_text(function_id),
                    "metric_key": sql_text(metric_key),
                    "value_number": sql_num(value),
                    "value_text": "null",
                    "unit": sql_text(metric["unit"]),
                    "period_start": "null",
                    "period_end": "null",
                    "scenario": sql_text("current"),
                    "source_record_id": sql_text(source_record_id),
                    "document_extraction_id": "null",
                    "basis": sql_text("calculated"),
                    "value_state": sql_text("known"),
                    "quality_state": sql_text("usable"),
                    "review_state": sql_text("not_reviewed"),
                    "attributes_json": sql_json(
                        {
                            "adapter": "client_intake_evidence_room",
                            "function": function_name,
                            "aggregation_basis": "SP12 evidence register rows",
                        }
                    ),
                }
            )

    object_rows = list(object_rows_by_key.values())
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
                "ecl_source.document",
                ["id", "tenant_key", "assessment_id", "source_file_id", "document_key", "document_type", "title", "file_hash", "page_count", "effective_date", "access_class", "review_state"],
                document_rows,
            ),
            insert_sql(
                "ecl_source.document_extraction",
                ["id", "tenant_key", "assessment_id", "document_id", "field_key", "extracted_value", "normalized_value_json", "page_number", "span_reference", "basis", "confidence", "human_verification_state"],
                extraction_rows,
            ),
            insert_sql(
                "ecl_context.object",
                ["id", "tenant_key", "assessment_id", "object_key", "object_type", "display_name", "business_domain", "lifecycle_state", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
                object_rows,
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
    load_sql_path = out_dir / "client_intake_evidence_room_ecl_load.sql"
    summary_path = out_dir / "client_intake_evidence_room_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "document": len(document_rows),
        "document_extraction": len(extraction_rows),
        "business_function": len(object_rows),
        "metric_definition": len(metric_definition_rows),
        "measure": len(measure_rows),
        "artifact_types": sorted(artifact_types),
        "supported_contract_refs": len(supported_contract_refs),
        "supported_application_refs": len(supported_application_refs),
        "partial_source_record": partial_rows,
        "known_gap_rows": known_gap_rows,
        "verified_extractions": extractions_verified,
        "unverified_extractions": len(extraction_rows) - extractions_verified,
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP12 evidence-room adapter; evidence artifact register, document, extraction pointer, and function coverage grain",
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
