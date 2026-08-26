#!/usr/bin/env python3

"""Adapt the SP08 vendor/contract source family into ECL context/commercial rows.

Local proof only. This adapter reads the source-room contract register shape and
materializes source rows, vendor objects, contract objects, SUPPLIED_BY
relationships, commercial contracts, service lines, and annualized value
measures. Application scope references are preserved as unresolved attributes
until the application adapter supplies matching application objects.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOM_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-vendor-contract-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-vendor-contract-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP08_Vendor_Contract"
METRIC_KEY = "contract_annualized_value_usd"


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-vendor-contract:{seed}"))


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


def parse_money(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def valid_date(value: str | None) -> str | None:
    if not value or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return None
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None
    return value


def review_state(value: str | None) -> str:
    if value == "needs_follow_up":
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def service_category(service_tower: str | None) -> str:
    tower = (service_tower or "").lower()
    if "ai" in tower:
        return "ai"
    if "data" in tower:
        return "data"
    if "cloud" in tower:
        return "cloud"
    if "support" in tower:
        return "support"
    if "bpo" in tower or "claims" in tower or "rcm" in tower:
        return "managed_service"
    if "software" in tower or "clinical" in tower:
        return "software"
    return "professional_service"


def object_row(
    *,
    object_id: str,
    tenant_key: str,
    assessment_id: str,
    object_key: str,
    object_type: str,
    display_name: str,
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
        "business_domain": "null",
        "lifecycle_state": sql_text("current"),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text("not_reviewed"),
        "confidence": "null",
        "attributes_json": sql_json(attrs),
    }


def relationship_row(
    *,
    tenant_key: str,
    assessment_id: str,
    contract_object_id: str,
    vendor_object_id: str,
    source_record_id: str,
    contract_id: str,
) -> dict[str, str]:
    return {
        "id": sql_text(stable_uuid("relationship", contract_object_id, "SUPPLIED_BY", vendor_object_id)),
        "tenant_key": sql_text(tenant_key),
        "assessment_id": sql_text(assessment_id),
        "from_object_id": sql_text(contract_object_id),
        "relationship_type": sql_text("SUPPLIED_BY"),
        "to_object_id": sql_text(vendor_object_id),
        "direction_label": sql_text("supplied by"),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text("not_reviewed"),
        "confidence": "null",
        "attributes_json": sql_json({"contract_id": contract_id, "adapter": "client_intake_vendor_contract"}),
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
            "source_type": sql_text("clm"),
            "origin": sql_text(origin),
            "source_owner": sql_text("Vendor Management / Procurement"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_vendor_contract",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "input_fixture_state": "client_shaped_synthetic_extract",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
    relationship_rows: list[dict[str, str]] = []
    metric_rows = [
        {
            "tenant_key": sql_text(tenant_key),
            "metric_key": sql_text(METRIC_KEY),
            "metric_name": sql_text("Contract annualized value"),
            "definition": sql_text("Annualized value recorded in the vendor contract register."),
            "unit": sql_text("USD"),
            "directionality": sql_text("neutral"),
            "cadence": sql_text("annual"),
            "aggregation_rule": sql_text("sum"),
        }
    ]
    measure_rows: list[dict[str, str]] = []
    contract_rows: list[dict[str, str]] = []
    service_line_rows: list[dict[str, str]] = []
    invalid_date_rows = 0
    unresolved_scope_refs = 0

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
                "parse_state": sql_text("partial" if row.get("review_state") in {"needs_follow_up", "partial"} else "parsed"),
                "parse_notes": sql_text("client_vendor_contract_adapter"),
            }
        )

        vendor_key = row["supplier_name"]
        vendor_id = stable_uuid("object", tenant_key, assessment_id, "vendor", vendor_key)
        object_rows_by_key.setdefault(
            ("vendor", vendor_key),
            object_row(
                object_id=vendor_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=vendor_key,
                object_type="vendor",
                display_name=vendor_key,
                source_record_id=source_record_id,
                attrs={"adapter": "client_intake_vendor_contract"},
            ),
        )

        contract_key = row["contract_id"]
        contract_object_id = stable_uuid("object", tenant_key, assessment_id, "contract", contract_key)
        scoped_refs = [value for value in row.get("scoped_applications", "").split(";") if value]
        unresolved_scope_refs += len(scoped_refs)
        start_date = valid_date(row.get("start_date"))
        end_date = valid_date(row.get("end_date"))
        if row.get("start_date") and start_date is None:
            invalid_date_rows += 1
        if row.get("end_date") and end_date is None:
            invalid_date_rows += 1

        object_rows_by_key.setdefault(
            ("contract", contract_key),
            object_row(
                object_id=contract_object_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=contract_key,
                object_type="contract",
                display_name=f"{vendor_key} {row['service_tower']} agreement",
                source_record_id=source_record_id,
                attrs={
                    "adapter": "client_intake_vendor_contract",
                    "service_tower": row.get("service_tower"),
                    "scoped_application_refs_unresolved": scoped_refs,
                    "source_start_date": row.get("start_date"),
                    "source_end_date": row.get("end_date"),
                },
            ),
        )
        relationship_rows.append(
            relationship_row(
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                contract_object_id=contract_object_id,
                vendor_object_id=vendor_id,
                source_record_id=source_record_id,
                contract_id=contract_key,
            )
        )

        annual_value = parse_money(row.get("annualized_value_usd"))
        total_value = annual_value * 5 if annual_value is not None else None
        commercial_contract_id = stable_uuid("commercial_contract", tenant_key, assessment_id, contract_key)
        contract_rows.append(
            {
                "id": sql_text(commercial_contract_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "contract_object_id": sql_text(contract_object_id),
                "vendor_object_id": sql_text(vendor_id),
                "contract_number": sql_text(contract_key),
                "contract_name": sql_text(f"{vendor_key} {row['service_tower']} agreement"),
                "contract_type": sql_text("master_service_agreement"),
                "start_date": sql_text(start_date),
                "end_date": sql_text(end_date),
                "renewal_notice_date": "null",
                "annualized_value_usd": sql_num(annual_value),
                "total_contract_value_usd": sql_num(total_value),
                "currency": sql_text("USD"),
                "source_document_id": "null",
                "source_record_id": sql_text(source_record_id),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known"),
                "review_state": sql_text(review_state(row.get("review_state"))),
                "attributes_json": sql_json(
                    {
                        "source_review_state": row.get("review_state"),
                        "notice_window_days": row.get("notice_window_days"),
                        "benchmarking_right": row.get("benchmarking_right"),
                        "minimum_commitment_usd": row.get("minimum_commitment_usd"),
                        "termination_for_convenience": row.get("termination_for_convenience"),
                        "auto_renew": row.get("auto_renew"),
                        "demo_as_of_date": row.get("demo_as_of_date"),
                        "scoped_application_refs_unresolved": scoped_refs,
                    }
                ),
            }
        )
        service_line_rows.append(
            {
                "id": sql_text(stable_uuid("commercial_service_line", tenant_key, assessment_id, contract_key, row["service_tower"])),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "contract_id": sql_text(commercial_contract_id),
                "service_line_key": sql_text(row["service_tower"]),
                "service_category": sql_text(service_category(row.get("service_tower"))),
                "description": sql_text(f"{row['service_tower']} services under {contract_key}"),
                "annualized_value_usd": sql_num(annual_value),
                "value_state": sql_text("known"),
                "source_record_id": sql_text(source_record_id),
                "document_extraction_id": "null",
                "review_state": sql_text(review_state(row.get("review_state"))),
            }
        )
        measure_rows.append(
            {
                "id": sql_text(stable_uuid("measure", tenant_key, assessment_id, contract_object_id, METRIC_KEY)),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "subject_object_id": sql_text(contract_object_id),
                "metric_key": sql_text(METRIC_KEY),
                "value_number": sql_num(annual_value),
                "value_text": "null",
                "unit": sql_text("USD"),
                "period_start": "null",
                "period_end": sql_text(row.get("demo_as_of_date")),
                "scenario": sql_text("current"),
                "source_record_id": sql_text(source_record_id),
                "document_extraction_id": "null",
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known"),
                "quality_state": sql_text("usable"),
                "review_state": sql_text(review_state(row.get("review_state"))),
                "attributes_json": sql_json(
                    {
                        "adapter": "client_intake_vendor_contract",
                        "contract_id": contract_key,
                        "source_review_state": row.get("review_state"),
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
                ["tenant_key", "metric_key", "metric_name", "definition", "unit", "directionality", "cadence", "aggregation_rule"],
                metric_rows,
            ),
            insert_sql(
                "ecl_context.measure",
                ["id", "tenant_key", "assessment_id", "subject_object_id", "metric_key", "value_number", "value_text", "unit", "period_start", "period_end", "scenario", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state", "attributes_json"],
                measure_rows,
            ),
            insert_sql(
                "ecl_commercial.contract",
                ["id", "tenant_key", "assessment_id", "contract_object_id", "vendor_object_id", "contract_number", "contract_name", "contract_type", "start_date", "end_date", "renewal_notice_date", "annualized_value_usd", "total_contract_value_usd", "currency", "source_document_id", "source_record_id", "basis", "value_state", "review_state", "attributes_json"],
                contract_rows,
            ),
            insert_sql(
                "ecl_commercial.contract_service_line",
                ["id", "tenant_key", "assessment_id", "contract_id", "service_line_key", "service_category", "description", "annualized_value_usd", "value_state", "source_record_id", "document_extraction_id", "review_state"],
                service_line_rows,
            ),
            "commit;",
        ]
    )
    out_dir.mkdir(parents=True, exist_ok=True)
    load_sql_path = out_dir / "client_intake_vendor_contract_ecl_load.sql"
    summary_path = out_dir / "client_intake_vendor_contract_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "vendor": len([row for row in object_rows if "'vendor'" in row["object_type"]]),
        "contract_object": len([row for row in object_rows if "'contract'" in row["object_type"]]),
        "relationship": len(relationship_rows),
        "metric_definition": len(metric_rows),
        "measure": len(measure_rows),
        "contract": len(contract_rows),
        "contract_service_line": len(service_line_rows),
        "unresolved_scope_refs_preserved": unresolved_scope_refs,
        "invalid_date_values_preserved_in_attributes": invalid_date_rows,
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP08 vendor/contract canonical-commercial adapter; application scope refs preserved as unresolved attributes",
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
