#!/usr/bin/env python3

"""Validate dense source-room catch-up extract outputs."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/source-room-depth-catchup-2026-08-23")
EXPECTED_EXTRACTS = 14
EXPECTED_MIN_ROWS = 7000

MIN_ROWS_BY_FAMILY = {
    "SP01_Documents_Interviews": 220,
    "SP02_HRIS": 360,
    "SP03_CMDB": 750,
    "SP04_Data_BI_ETL": 360,
    "SP05_Infrastructure": 110,
    "SP06_Finance_ERP": 480,
    "SP07_PPM": 140,
    "SP08_Vendor_Contract": 230,
    "SP09_GRC": 200,
    "SP10_KPI_Operations": 260,
    "SP11_AI_Usage_Models": 360,
    "SP12_Evidence_Room": 500,
    "SP13_Data_Flows_Integrations": 1150,
    "SP14_Deployments_Hosting": 1400,
}

REALISM_GATES = {
    "application_tier_1_min": 0.10,
    "application_tier_1_max": 0.15,
    "vendor_distinct_min": 165,
    "contract_document_min": 400,
    "ai_tool_min": 26,
    "ai_model_min": 34,
    "ai_use_case_min": 30,
    "data_flow_singleton_target_max": 0.60,
    "data_flow_max_inbound_min": 60,
    "deployment_environment_min": 3,
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise AssertionError(f"Missing required CSV: {path}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def require_distinct(rows: list[dict[str, str]], column: str, minimum: int, label: str, issues: list[str]) -> None:
    distinct = {row.get(column, "").strip() for row in rows if row.get(column, "").strip()}
    if len(distinct) < minimum:
        issues.append(f"{label} expected at least {minimum} distinct {column}, got {len(distinct)}")


def validate_family_realism(family: str, rows: list[dict[str, str]], issues: list[str]) -> None:
    if family == "SP03_CMDB":
        tier_1_count = sum(1 for row in rows if row.get("criticality_tier") == "tier_1")
        tier_1_ratio = tier_1_count / len(rows)
        if not (REALISM_GATES["application_tier_1_min"] <= tier_1_ratio <= REALISM_GATES["application_tier_1_max"]):
            issues.append(f"{family} tier_1 ratio {tier_1_ratio:.1%} outside 10%-15% realism gate")
        if any(row.get("environment", "").strip() for row in rows):
            issues.append(f"{family} contains environment values; deployments must live in SP14")

    if family == "SP08_Vendor_Contract":
        require_distinct(rows, "supplier_name", REALISM_GATES["vendor_distinct_min"], family, issues)
        notice_values = {row.get("notice_window_days", "") for row in rows}
        if len(notice_values) < 4:
            issues.append(f"{family} lacks renewal/notice-window spread")
        commitment_positive = sum(1 for row in rows if float(row.get("minimum_commitment_usd", "0") or 0) > 0)
        if commitment_positive < 20:
            issues.append(f"{family} has too few minimum-commitment records: {commitment_positive}")

    if family == "SP11_AI_Usage_Models":
        require_distinct(rows, "tool_name", REALISM_GATES["ai_tool_min"], family, issues)
        require_distinct(rows, "model_name", REALISM_GATES["ai_model_min"], family, issues)
        require_distinct(rows, "use_case_name", REALISM_GATES["ai_use_case_min"], family, issues)

    if family == "SP12_Evidence_Room":
        contract_docs = sum(1 for row in rows if row.get("artifact_type") == "contract_pdf")
        if contract_docs < REALISM_GATES["contract_document_min"]:
            issues.append(f"{family} contract documents expected at least {REALISM_GATES['contract_document_min']}, got {contract_docs}")
        span_rows = sum(1 for row in rows if row.get("page_ref") and row.get("span_ref"))
        if span_rows < 200:
            issues.append(f"{family} page/span extraction pointers expected at least 200, got {span_rows}")

    if family == "SP13_Data_Flows_Integrations":
        target_counts = Counter(row.get("target_object_ref", "") for row in rows)
        singleton_ratio = sum(1 for count in target_counts.values() if count == 1) / max(len(target_counts), 1)
        max_inbound = max(target_counts.values(), default=0)
        if singleton_ratio >= REALISM_GATES["data_flow_singleton_target_max"]:
            issues.append(f"{family} singleton target ratio {singleton_ratio:.1%} must stay below 60%")
        if max_inbound < REALISM_GATES["data_flow_max_inbound_min"]:
            issues.append(f"{family} max inbound {max_inbound} below convergence floor 60")
        if not any(row.get("landing_layer") == "raw" for row in rows):
            issues.append(f"{family} has no raw landing layer")
        if not any(row.get("consumption_layer") in {"reporting", "api_consumer"} for row in rows):
            issues.append(f"{family} has no consumption layer")

    if family == "SP14_Deployments_Hosting":
        require_distinct(rows, "environment", REALISM_GATES["deployment_environment_min"], family, issues)
        if any(row.get("application_name", "").strip() for row in rows):
            issues.append(f"{family} should reference application_id, not restate application_name")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    issues: list[str] = []
    summary_path = out_dir / "dense_source_room_summary.json"
    manifest_path = out_dir / "dense_source_room_manifest.csv"
    dictionary_path = out_dir / "dense_source_room_field_dictionary.csv"

    if not summary_path.exists():
        issues.append(f"missing summary: {summary_path}")
        summary = {}
    else:
        summary = json.loads(summary_path.read_text(encoding="utf-8"))

    manifest = read_csv(manifest_path) if manifest_path.exists() else []
    dictionary = read_csv(dictionary_path) if dictionary_path.exists() else []
    if len(manifest) != EXPECTED_EXTRACTS:
        issues.append(f"extract count expected {EXPECTED_EXTRACTS}, got {len(manifest)}")
    if int(summary.get("row_count", 0)) < EXPECTED_MIN_ROWS:
        issues.append(f"row count expected at least {EXPECTED_MIN_ROWS}, got {summary.get('row_count')}")

    for entry in manifest:
        row_count = int(entry["row_count"])
        family = entry["source_room_family"]
        family_floor = MIN_ROWS_BY_FAMILY.get(family)
        if family_floor is None:
            issues.append(f"{family} is not in the approved density-floor map")
        elif row_count < family_floor:
            issues.append(f"{family} has {row_count} rows, below floor {family_floor}")
        file_path = out_dir / entry["file_path"]
        rows = read_csv(file_path)
        if len(rows) != row_count:
            issues.append(f"{entry['source_room_family']} manifest row count {row_count} != file rows {len(rows)}")
        for required in ["source_basis", "review_state", "synthetic_dataset_id", "client_attestation_state"]:
            if rows and required not in rows[0]:
                issues.append(f"{entry['source_room_family']} missing {required}")
        if rows and len({row.get("source_basis", "") for row in rows}) < 2:
            issues.append(f"{entry['source_room_family']} source_basis lacks partial/gap variation")
        if rows and any(row.get("client_attestation_state") != "not_client_attested" for row in rows):
            issues.append(f"{entry['source_room_family']} contains a client-attested row")
        if rows:
            validate_family_realism(entry["source_room_family"], rows, issues)
            for column in rows[0]:
                values = [row.get(column, "") for row in rows]
                numeric = []
                for value in values:
                    try:
                        numeric.append(float(str(value).replace("%", "")))
                    except ValueError:
                        numeric = []
                        break
                if numeric and len(numeric) > 1:
                    distinct_ratio = len(set(numeric)) / len(numeric)
                    most_common_ratio = max(numeric.count(value) for value in set(numeric)) / len(numeric)
                    if len(set(numeric)) < 2:
                        issues.append(f"{entry['source_room_family']} numeric column {column} is constant")
                    if most_common_ratio > 0.95:
                        issues.append(f"{entry['source_room_family']} numeric column {column} repeats one value on {most_common_ratio:.1%} of rows")
                    cost_like = any(token in column.lower() for token in ["cost", "budget", "actual", "annualized_value", "amount"])
                    if cost_like and distinct_ratio < 0.50:
                        issues.append(f"{entry['source_room_family']} cost-like numeric column {column} has low distinct ratio {distinct_ratio:.3f}")

    by_family_fields: dict[str, list[dict[str, str]]] = {}
    for row in dictionary:
        by_family_fields.setdefault(row.get("source_room_family", ""), []).append(row)
        for required in ["owner", "source_system", "export_query", "row_grain", "acceptable_unfilled_state", "do_not_collect", "client_fillability_state"]:
            if not row.get(required, "").strip():
                issues.append(f"field dictionary missing {required} for {row.get('source_room_family')}.{row.get('field_name')}")
        if row.get("client_fillability_state") not in {"fillable_by_named_export", "interview_derived"}:
            issues.append(f"field dictionary has unsupported fillability state for {row.get('source_room_family')}.{row.get('field_name')}")
    for family in MIN_ROWS_BY_FAMILY:
        if family not in by_family_fields:
            issues.append(f"field dictionary missing family {family}")

    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1

    print(json.dumps({"status": "pass", "extracts": len(manifest), "rows": summary.get("row_count")}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
