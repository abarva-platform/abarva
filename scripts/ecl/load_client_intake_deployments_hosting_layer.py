#!/usr/bin/env python3

"""Adapt the SP14 deployments/hosting source family into ECL context rows."""

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
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-client-intake-deployments-hosting-proof"
DEFAULT_TENANT_KEY = "meridian-health"
DEFAULT_ASSESSMENT_ID = "client-intake-deployments-hosting-proof"
DEFAULT_SOURCE_DATE = "2026-08-23"
FAMILY = "SP14_Deployments_Hosting"
CMDB_FAMILY = "SP03_CMDB"
INFRA_FAMILY = "SP05_Infrastructure"


def stable_uuid(*parts: object) -> str:
    seed = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"abarva:ecl-client-deployments-hosting:{seed}"))


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
    return "client_deployments_hosting_adapter"


def review_state(value: str | None, *, partial: bool = False) -> str:
    if partial or value == "needs_follow_up":
        return "in_review"
    if value in {"not_reviewed", "in_review", "confirmed", "corrected", "rejected", "blocked", "superseded"}:
        return value
    return "not_reviewed"


def basis_for(row: dict[str, str]) -> str:
    return "unknown" if row.get("source_basis") == "known_gap" else "source_recorded"


def value_state_for(row: dict[str, str]) -> str:
    return "unknown" if row.get("source_basis") == "known_gap" else "known"


def lifecycle_for(runtime_state: str | None) -> str:
    if runtime_state == "retired":
        return "retired"
    if runtime_state == "planned":
        return "planned"
    return "current"


def object_row(
    *,
    object_id: str,
    tenant_key: str,
    assessment_id: str,
    object_key: str,
    object_type: str,
    display_name: str,
    business_domain: str | None,
    lifecycle_state: str,
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
        "lifecycle_state": sql_text(lifecycle_state),
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
        "direction_label": sql_text(relationship_type.lower()),
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
            "source_type": sql_text("cmdb"),
            "origin": sql_text(origin),
            "source_owner": sql_text("CMDB, cloud platform, hosting, and application operations owners"),
            "file_name": sql_text(extract_path.name),
            "blob_uri": sql_text(extract_path.as_posix()),
            "file_hash": sql_text(actual_hash),
            "source_date": sql_text(source_date),
            "access_class": sql_text("internal"),
            "quality_state": sql_text("partial"),
            "metadata_json": sql_json(
                {
                    "adapter": "client_intake_deployments_hosting",
                    "source_room_family": FAMILY,
                    "row_grain": manifest_row["row_grain"],
                    "lookup_families": [CMDB_FAMILY, INFRA_FAMILY],
                    "collection_guidance": "deployment_environment_to_hosting_platform_not_application_count",
                }
            ),
        }
    ]

    source_record_rows: list[dict[str, str]] = []
    object_rows_by_key: dict[tuple[str, str], dict[str, str]] = {}
    relationship_rows: list[dict[str, str]] = []

    application_refs: set[str] = set()
    platform_refs: set[str] = set()
    unresolved_application_refs: set[str] = set()
    unresolved_platform_refs: set[str] = set()
    environments: set[str] = set()
    hosting_models: set[str] = set()
    runtime_states: set[str] = set()
    dr_tiers: set[str] = set()
    partial_rows = 0
    known_gap_rows = 0
    planned_rows = 0
    retired_rows = 0

    def add_application(ref: str, source_record_id: str, row: dict[str, str]) -> str:
        application_refs.add(ref)
        app = app_lookup.get(ref)
        partial = app is None
        if partial:
            unresolved_application_refs.add(ref)
        object_id = stable_uuid("object", tenant_key, assessment_id, "application", ref)
        object_rows_by_key.setdefault(
            ("application", ref),
            object_row(
                object_id=object_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=ref,
                object_type="application",
                display_name=(app or {}).get("application_name") or ref,
                business_domain=(app or {}).get("business_function"),
                lifecycle_state="current",
                source_record_id=source_record_id,
                basis="source_recorded" if app else "unknown",
                value_state="known" if app else "unknown",
                row_review_state=row.get("review_state"),
                partial=partial,
                attrs={
                    "adapter": "client_intake_deployments_hosting",
                    "reference_only": True,
                    "lookup_resolved": bool(app),
                    "application_id": ref,
                    "vendor_name": (app or {}).get("vendor_name"),
                    "application_domain": (app or {}).get("application_domain"),
                    "application_subdomain": (app or {}).get("application_subdomain"),
                },
            ),
        )
        return object_id

    def add_platform(ref: str, source_record_id: str, row: dict[str, str]) -> str:
        platform_refs.add(ref)
        platform = platform_lookup.get(ref)
        partial = platform is None
        if partial:
            unresolved_platform_refs.add(ref)
        object_id = stable_uuid("object", tenant_key, assessment_id, "infrastructure", ref)
        object_rows_by_key.setdefault(
            ("infrastructure", ref),
            object_row(
                object_id=object_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=ref,
                object_type="infrastructure",
                display_name=(platform or {}).get("platform_name") or ref,
                business_domain=(platform or {}).get("business_function"),
                lifecycle_state="current",
                source_record_id=source_record_id,
                basis="source_recorded" if platform else "unknown",
                value_state="known" if platform else "unknown",
                row_review_state=row.get("review_state"),
                partial=partial,
                attrs={
                    "adapter": "client_intake_deployments_hosting",
                    "reference_only": True,
                    "lookup_resolved": bool(platform),
                    "platform_id": ref,
                    "platform_type": (platform or {}).get("platform_type"),
                    "hosting_location": (platform or {}).get("hosting_location"),
                },
            ),
        )
        return object_id

    for index, row in enumerate(rows, start=1):
        source_record_id = stable_uuid("source_record", tenant_key, assessment_id, FAMILY, row["source_row_id"])
        partial = row_is_partial(row)
        if partial:
            partial_rows += 1
        if row.get("source_basis") == "known_gap":
            known_gap_rows += 1
        if row.get("runtime_state") == "planned":
            planned_rows += 1
        if row.get("runtime_state") == "retired":
            retired_rows += 1
        environments.add(row.get("environment") or "unknown")
        hosting_models.add(row.get("hosting_model") or "unknown")
        runtime_states.add(row.get("runtime_state") or "unknown")
        dr_tiers.add(row.get("dr_tier") or "unknown")

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

        app_id = add_application(row["application_id"], source_record_id, row)
        platform_id = add_platform(row["hosting_platform_ref"], source_record_id, row)
        deployment_id = stable_uuid("object", tenant_key, assessment_id, "application_deployment", row["deployment_id"])
        object_rows_by_key.setdefault(
            ("application_deployment", row["deployment_id"]),
            object_row(
                object_id=deployment_id,
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                object_key=row["deployment_id"],
                object_type="application_deployment",
                display_name=f"{row['application_id']} {row['environment']} deployment",
                business_domain=row.get("region_or_location"),
                lifecycle_state=lifecycle_for(row.get("runtime_state")),
                source_record_id=source_record_id,
                basis=basis_for(row),
                value_state=value_state_for(row),
                row_review_state=row.get("review_state"),
                partial=partial,
                attrs={
                    "adapter": "client_intake_deployments_hosting",
                    "deployment_id": row.get("deployment_id"),
                    "application_id": row.get("application_id"),
                    "environment": row.get("environment"),
                    "hosting_platform_ref": row.get("hosting_platform_ref"),
                    "hosting_model": row.get("hosting_model"),
                    "region_or_location": row.get("region_or_location"),
                    "runtime_state": row.get("runtime_state"),
                    "dr_tier": row.get("dr_tier"),
                    "deployment_owner": row.get("deployment_owner"),
                    "source_basis": row.get("source_basis"),
                    "source_review_state": row.get("review_state"),
                },
            ),
        )
        relationship_rows.append(
            relationship_row(
                relationship_id=stable_uuid("relationship", tenant_key, assessment_id, FAMILY, row["deployment_id"], "DEPLOYMENT_OF"),
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                from_object_id=deployment_id,
                relationship_type="DEPLOYMENT_OF",
                to_object_id=app_id,
                source_record_id=source_record_id,
                row=row,
                partial=partial,
                attrs={"adapter": "client_intake_deployments_hosting", "environment": row.get("environment")},
            )
        )
        relationship_rows.append(
            relationship_row(
                relationship_id=stable_uuid("relationship", tenant_key, assessment_id, FAMILY, row["deployment_id"], "HOSTED_ON"),
                tenant_key=tenant_key,
                assessment_id=assessment_id,
                from_object_id=deployment_id,
                relationship_type="HOSTED_ON",
                to_object_id=platform_id,
                source_record_id=source_record_id,
                row=row,
                partial=partial,
                attrs={
                    "adapter": "client_intake_deployments_hosting",
                    "hosting_model": row.get("hosting_model"),
                    "region_or_location": row.get("region_or_location"),
                    "dr_tier": row.get("dr_tier"),
                },
            )
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
            "commit;",
        ]
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    load_sql_path = out_dir / "client_intake_deployments_hosting_ecl_load.sql"
    summary_path = out_dir / "client_intake_deployments_hosting_summary.json"
    load_sql_path.write_text(load_sql, encoding="utf-8")
    summary = {
        "accepted": True,
        "tenant_key": tenant_key,
        "assessment_id": assessment_id,
        "source_origin": origin,
        "source_file": len(source_file_rows),
        "source_record": len(source_record_rows),
        "application_reference": len(application_refs),
        "infrastructure_reference": len(platform_refs),
        "application_deployment": sum(1 for row in object_rows if row["object_type"] == sql_text("application_deployment")),
        "deployment_of": sum(1 for row in relationship_rows if row["relationship_type"] == sql_text("DEPLOYMENT_OF")),
        "hosted_on": sum(1 for row in relationship_rows if row["relationship_type"] == sql_text("HOSTED_ON")),
        "relationship": len(relationship_rows),
        "partial_source_record": partial_rows,
        "known_gap_rows": known_gap_rows,
        "unresolved_application_reference": len(unresolved_application_refs),
        "unresolved_platform_reference": len(unresolved_platform_refs),
        "planned_deployments": planned_rows,
        "retired_deployments": retired_rows,
        "environments": sorted(environments),
        "hosting_models": sorted(hosting_models),
        "runtime_states": sorted(runtime_states),
        "dr_tiers": sorted(dr_tiers),
        "load_sql": load_sql_path.as_posix(),
        "summary_json": summary_path.as_posix(),
        "scope": "SP14 deployments/hosting adapter; deployment grain with DEPLOYMENT_OF and HOSTED_ON relationships",
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
