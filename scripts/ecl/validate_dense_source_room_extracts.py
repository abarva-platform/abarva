#!/usr/bin/env python3

"""Validate dense source-room catch-up extract outputs."""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from collections import Counter
from pathlib import Path
import re


DEFAULT_OUT_DIR = Path("outputs/source-room-depth-catchup-2026-08-23")
EXPECTED_EXTRACTS = 14
EXPECTED_MIN_ROWS = 7000
APP_REF_RE = re.compile(r"APP-(\d{4})")

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
    "application_cost_total_usd": 436_500_000,
    "application_cost_total_tolerance": 0.005,
    "application_cost_top_decile_min": 0.30,
    "application_cost_top_decile_max": 0.75,
    "application_environment_count_distinct_min": 4,
    "contract_distinct_supplier_min": 90,
    "contract_distinct_supplier_max": 143,
    "contracts_per_supplier_min": 1.60,
    "contract_top_supplier_contract_count_min": 5,
    "contract_value_top_decile_min": 0.30,
    "contract_value_top_decile_max": 0.75,
    "contract_max_single_value_share_max": 0.06,
    "graph_stride_dominant_share_max": 0.30,
    "graph_stride_min_observations": 50,
    "function_distribution_min_distinct": 12,
    "categorical_uniform_min_distinct": 4,
    "categorical_uniform_max_min_ratio": 1.15,
    "finance_min_fiscal_years": 2,
}

PROFILE = os.environ.get("ECL_DENSE_PROFILE", "meridian-health").strip().lower().replace("_", "-")
if PROFILE in {"skyharbor", "skyharbor-air", "skyharbor-airline", "airline"}:
    REALISM_GATES["application_cost_total_usd"] = 1_540_000_000


def app_ref_indices(value: str) -> list[int]:
    return [int(match.group(1)) for match in APP_REF_RE.finditer(value or "")]


def stride_distribution(rows: list[dict[str, str]], field_names: list[str]) -> Counter[int]:
    strides: Counter[int] = Counter()
    for row in rows:
        for field_name in field_names:
            refs = app_ref_indices(row.get(field_name, ""))
            for left, right in zip(refs, refs[1:]):
                if left != right:
                    strides[(right - left) % 750] += 1
    return strides


def paired_stride_distribution(rows: list[dict[str, str]], left_field: str, right_field: str) -> Counter[int]:
    strides: Counter[int] = Counter()
    for row in rows:
        left_refs = app_ref_indices(row.get(left_field, ""))
        right_refs = app_ref_indices(row.get(right_field, ""))
        if len(left_refs) == 1 and len(right_refs) == 1 and left_refs[0] != right_refs[0]:
            strides[(right_refs[0] - left_refs[0]) % 750] += 1
    return strides


def validate_stride_gate(label: str, strides: Counter[int], issues: list[str]) -> None:
    total = sum(strides.values())
    if total < REALISM_GATES["graph_stride_min_observations"]:
        return
    dominant_stride, dominant_count = strides.most_common(1)[0]
    dominant_share = dominant_count / total
    if dominant_share > REALISM_GATES["graph_stride_dominant_share_max"]:
        issues.append(
            f"{label} dominant APP stride {dominant_stride} appears on {dominant_share:.1%} of {total} references; "
            "synthetic graph appears rotational rather than modeled"
        )


def validate_categorical_shape(label: str, values: list[str], issues: list[str], *, min_distinct: int | None = None) -> None:
    clean = [value for value in values if value]
    counts = Counter(clean)
    if not counts:
        issues.append(f"{label} has no populated values")
        return
    required_distinct = min_distinct or REALISM_GATES["categorical_uniform_min_distinct"]
    if len(counts) < required_distinct:
        issues.append(f"{label} reaches {len(counts)} distinct values, below required {required_distinct}")
        return
    min_count = min(counts.values())
    max_count = max(counts.values())
    if min_count and max_count / min_count <= REALISM_GATES["categorical_uniform_max_min_ratio"]:
        issues.append(f"{label} distribution is too uniform: min={min_count}, max={max_count}, distinct={len(counts)}")


def owner_function(value: str) -> str:
    suffix = " Platform Owner"
    return value[: -len(suffix)] if value.endswith(suffix) else value


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
        validate_categorical_shape(
            f"{family}.business_function",
            [row.get("business_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        tier_1_count = sum(1 for row in rows if row.get("criticality_tier") == "tier_1")
        tier_1_ratio = tier_1_count / len(rows)
        if not (REALISM_GATES["application_tier_1_min"] <= tier_1_ratio <= REALISM_GATES["application_tier_1_max"]):
            issues.append(f"{family} tier_1 ratio {tier_1_ratio:.1%} outside 10%-15% realism gate")
        if any(row.get("environment", "").strip() for row in rows):
            issues.append(f"{family} contains environment values; deployments must live in SP14")
        costs = sorted((float(row.get("annual_cost_usd", "0") or 0) for row in rows), reverse=True)
        cost_total = sum(costs)
        expected_total = REALISM_GATES["application_cost_total_usd"]
        tolerance = REALISM_GATES["application_cost_total_tolerance"]
        if abs(cost_total - expected_total) / expected_total > tolerance:
            issues.append(f"{family} annual_cost_usd total ${cost_total:,.2f} outside governed baseline ${expected_total:,.2f} ±{tolerance:.1%}")
        top_decile_count = max(1, len(costs) // 10)
        top_decile_share = sum(costs[:top_decile_count]) / max(cost_total, 1)
        if not (REALISM_GATES["application_cost_top_decile_min"] <= top_decile_share <= REALISM_GATES["application_cost_top_decile_max"]):
            issues.append(f"{family} top-decile annual_cost_usd share {top_decile_share:.1%} outside 30%-75% realism gate")
        environment_counts = {row.get("environment_count", "").strip() for row in rows if row.get("environment_count", "").strip()}
        if len(environment_counts) < REALISM_GATES["application_environment_count_distinct_min"]:
            issues.append(f"{family} environment_count expected at least {REALISM_GATES['application_environment_count_distinct_min']} distinct values, got {len(environment_counts)}")

    if family == "SP04_Data_BI_ETL":
        validate_categorical_shape(
            f"{family}.function",
            [row.get("function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        validate_categorical_shape(f"{family}.technology_name", [row.get("technology_name", "").strip() for row in rows], issues)
        validate_categorical_shape(f"{family}.workload_type", [row.get("workload_type", "").strip() for row in rows], issues)

    if family == "SP05_Infrastructure":
        validate_categorical_shape(
            f"{family}.business_function",
            [row.get("business_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        validate_categorical_shape(f"{family}.platform_type", [row.get("platform_type", "").strip() for row in rows], issues)
        validate_categorical_shape(f"{family}.hosting_location", [row.get("hosting_location", "").strip() for row in rows], issues)

    if family == "SP06_Finance_ERP":
        validate_categorical_shape(
            f"{family}.business_function",
            [row.get("business_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        fiscal_years = {row.get("fiscal_period", "").split("-", 1)[0] for row in rows if row.get("fiscal_period", "").strip()}
        if len(fiscal_years) < REALISM_GATES["finance_min_fiscal_years"]:
            issues.append(f"{family} fiscal_period covers {len(fiscal_years)} fiscal years, below required {REALISM_GATES['finance_min_fiscal_years']}")
        cost_center_counts = Counter(row.get("cost_center", "").strip() for row in rows if row.get("cost_center", "").strip())
        if cost_center_counts and len(set(cost_center_counts.values())) < 2:
            issues.append(f"{family} cost_center row counts are identical across all populated cost centers")

    if family == "SP07_PPM":
        validate_categorical_shape(
            f"{family}.sponsor_function",
            [row.get("sponsor_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        validate_stride_gate(
            f"{family}.dependent_applications",
            stride_distribution(rows, ["dependent_applications"]),
            issues,
        )

    if family == "SP08_Vendor_Contract":
        supplier_counts = Counter(row.get("supplier_name", "").strip() for row in rows if row.get("supplier_name", "").strip())
        distinct_suppliers = len(supplier_counts)
        contracts_per_supplier = len(rows) / max(distinct_suppliers, 1)
        if distinct_suppliers < REALISM_GATES["contract_distinct_supplier_min"]:
            issues.append(f"{family} expected at least {REALISM_GATES['contract_distinct_supplier_min']} distinct suppliers for a genuine long tail, got {distinct_suppliers}")
        if distinct_suppliers > REALISM_GATES["contract_distinct_supplier_max"]:
            issues.append(f"{family} expected at most {REALISM_GATES['contract_distinct_supplier_max']} distinct suppliers so concentration is visible, got {distinct_suppliers}")
        if contracts_per_supplier < REALISM_GATES["contracts_per_supplier_min"]:
            issues.append(f"{family} contracts per supplier {contracts_per_supplier:.2f} below {REALISM_GATES['contracts_per_supplier_min']:.2f}")
        if max(supplier_counts.values(), default=0) < REALISM_GATES["contract_top_supplier_contract_count_min"]:
            issues.append(f"{family} top supplier holds {max(supplier_counts.values(), default=0)} contracts, below {REALISM_GATES['contract_top_supplier_contract_count_min']}")
        values = sorted((float(row.get("annualized_value_usd", "0") or 0) for row in rows), reverse=True)
        value_total = sum(values)
        top_decile_count = max(1, len(values) // 10)
        top_decile_share = sum(values[:top_decile_count]) / max(value_total, 1)
        max_contract_share = max(values, default=0) / max(value_total, 1)
        if not (REALISM_GATES["contract_value_top_decile_min"] <= top_decile_share <= REALISM_GATES["contract_value_top_decile_max"]):
            issues.append(f"{family} top-decile annualized value share {top_decile_share:.1%} outside 30%-75% realism gate")
        if max_contract_share > REALISM_GATES["contract_max_single_value_share_max"]:
            issues.append(f"{family} largest contract share {max_contract_share:.1%} exceeds 6% guardrail")
        notice_values = {row.get("notice_window_days", "") for row in rows}
        if len(notice_values) < 4:
            issues.append(f"{family} lacks renewal/notice-window spread")
        commitment_positive = sum(1 for row in rows if float(row.get("minimum_commitment_usd", "0") or 0) > 0)
        if commitment_positive < 20:
            issues.append(f"{family} has too few minimum-commitment records: {commitment_positive}")
        validate_stride_gate(
            f"{family}.scoped_applications",
            stride_distribution(rows, ["scoped_applications"]),
            issues,
        )

    if family == "SP09_GRC":
        validate_categorical_shape(
            f"{family}.business_function",
            [row.get("business_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )

    if family == "SP10_KPI_Operations":
        validate_categorical_shape(
            f"{family}.business_function",
            [row.get("business_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )

    if family == "SP11_AI_Usage_Models":
        validate_categorical_shape(
            f"{family}.business_function",
            [row.get("business_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        require_distinct(rows, "tool_name", REALISM_GATES["ai_tool_min"], family, issues)
        require_distinct(rows, "model_name", REALISM_GATES["ai_model_min"], family, issues)
        require_distinct(rows, "use_case_name", REALISM_GATES["ai_use_case_min"], family, issues)

    if family == "SP12_Evidence_Room":
        validate_categorical_shape(
            f"{family}.owning_function",
            [row.get("owning_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        contract_docs = sum(1 for row in rows if row.get("artifact_type") == "contract_pdf")
        if contract_docs < REALISM_GATES["contract_document_min"]:
            issues.append(f"{family} contract documents expected at least {REALISM_GATES['contract_document_min']}, got {contract_docs}")
        span_rows = sum(1 for row in rows if row.get("page_ref") and row.get("span_ref"))
        if span_rows < 200:
            issues.append(f"{family} page/span extraction pointers expected at least 200, got {span_rows}")

    if family == "SP13_Data_Flows_Integrations":
        validate_categorical_shape(
            f"{family}.source_function",
            [row.get("source_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
        validate_categorical_shape(
            f"{family}.target_function",
            [row.get("target_function", "").strip() for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
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
        validate_stride_gate(
            f"{family}.source_to_target",
            paired_stride_distribution(rows, "source_object_ref", "target_object_ref"),
            issues,
        )

    if family == "SP14_Deployments_Hosting":
        require_distinct(rows, "environment", REALISM_GATES["deployment_environment_min"], family, issues)
        validate_categorical_shape(
            f"{family}.deployment_owner",
            [owner_function(row.get("deployment_owner", "").strip()) for row in rows],
            issues,
            min_distinct=REALISM_GATES["function_distribution_min_distinct"],
        )
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
