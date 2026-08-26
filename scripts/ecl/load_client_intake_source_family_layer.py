#!/usr/bin/env python3

"""Land all client-shaped source families into ECL source rows.

This is a Layer 1 -> Layer 2 landing proof. It reads a source-room manifest and
the CSV extracts it names, writes one ecl_source.source_file row per family, and
one ecl_source.source_record row per extract row. It deliberately does not write
canonical/context/commercial/projection rows; those remain separate adapters.
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
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-source-family-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-source-family-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"

SOURCE_TYPE_BY_FAMILY = {
    "SP01_Documents_Interviews": "interview",
    "SP02_HRIS": "manual_workbook",
    "SP03_CMDB": "cmdb",
    "SP04_Data_BI_ETL": "bi",
    "SP05_Infrastructure": "manual_workbook",
    "SP06_Finance_ERP": "erp",
    "SP07_PPM": "ppm",
    "SP08_Vendor_Contract": "clm",
    "SP09_GRC": "grc",
    "SP10_KPI_Operations": "manual_workbook",
    "SP11_AI_Usage_Models": "ai_telemetry",
    "SP12_Evidence_Room": "document",
    "SP13_Data_Flows_Integrations": "etl",
    "SP14_Deployments_Hosting": "cmdb",
}


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-source-family:{seed}"))


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
    basis = (row.get("source_basis") or "").strip()
    review_state = (row.get("review_state") or "").strip()
    if basis == "known_gap" or review_state in {"needs_follow_up", "partial"}:
        return "partial"
    return "parsed"


def build_sql(
    *,
    source_room_dir: Path,
    out_dir: Path,
    tenant_key: str,
    assessment_id: str,
    origin: str,
    source_date: str,
) -> dict[str, Any]:
    manifest_path = source_room_dir / "dense_source_room_manifest.csv"
    manifest = read_csv(manifest_path)
    source_file_rows: list[dict[str, str]] = []
    source_record_rows: list[dict[str, str]] = []
    counts_by_family: dict[str, int] = {}
    source_type_by_family: dict[str, str] = {}

    for manifest_index, manifest_row in enumerate(manifest, start=1):
        family = manifest_row["source_room_family"]
        source_type = SOURCE_TYPE_BY_FAMILY.get(family)
        if source_type is None:
            raise AssertionError(f"no source_type mapping for source family {family}")

        extract_path = source_room_dir / manifest_row["file_path"]
        rows = read_csv(extract_path)
        expected_rows = int(manifest_row["row_count"])
        if len(rows) != expected_rows:
            raise AssertionError(f"{family} manifest row_count={expected_rows} but read {len(rows)} rows")

        manifest_hash = manifest_row.get("sha256") or file_sha(extract_path)
        actual_hash = file_sha(extract_path)
        if manifest_hash != actual_hash:
            raise AssertionError(f"{family} manifest hash does not match extract hash")

        file_id = stable_uuid("source_file", tenant_key, assessment_id, family, actual_hash)
        counts_by_family[family] = len(rows)
        source_type_by_family[family] = source_type
        source_file_rows.append(
            {
                "id": sql_text(file_id),
                "tenant_key": sql_text(tenant_key),
                "assessment_id": sql_text(assessment_id),
                "source_type": sql_text(source_type),
                "origin": sql_text(origin),
                "source_owner": sql_text(family),
                "file_name": sql_text(extract_path.name),
                "blob_uri": sql_text(extract_path.as_posix()),
                "file_hash": sql_text(actual_hash),
                "source_date": sql_text(source_date),
                "access_class": sql_text("internal"),
                "quality_state": sql_text("partial"),
                "metadata_json": sql_json(
                    {
                        "adapter": "client_intake_source_family_landing",
                        "manifest_file": manifest_path.name,
                        "manifest_index": manifest_index,
                        "source_room_family": family,
                        "row_grain": manifest_row["row_grain"],
                        "input_fixture_state": "client_shaped_synthetic_extract",
                    }
                ),
            }
        )

        for row_index, row in enumerate(rows, start=1):
            native_id = row.get("source_row_id") or f"{family}-{row_index:05d}"
            source_record_rows.append(
                {
                    "id": sql_text(stable_uuid("source_record", tenant_key, assessment_id, family, native_id)),
                    "tenant_key": sql_text(tenant_key),
                    "assessment_id": sql_text(assessment_id),
                    "source_file_id": sql_text(file_id),
                    "native_id": sql_text(native_id),
                    "record_type": sql_text(family),
                    "row_number": sql_num(row_index),
                    "payload_json": sql_json(row),
                    "parse_state": sql_text(parse_state_for(row)),
                    "parse_notes": sql_text("client_source_family_landing_only_no_canonical_projection"),
                }
            )

    load_sql = "\n".join(
        [
            "begin;",
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
            "commit;",
        ]
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    load_sql_path = out_dir / "client_intake_source_family_ecl_source_load.sql"
    summary_path = out_dir / "client_intake_source_family_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")

    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_files": len(source_file_rows),
        "source_records": len(source_record_rows),
        "counts_by_family": counts_by_family,
        "source_type_by_family": source_type_by_family,
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "ecl_source landing only; no canonical, commercial, projection or serving rows written",
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
