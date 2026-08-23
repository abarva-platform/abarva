#!/usr/bin/env python3

"""Validate the next ECL local planning/proof batch."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-next-slice-planning-2026-08-23")

REQUIRED_PRODUCTS = {"Source 360", "Tower", "Home", "Intelligence", "Moves", "Cubes"}
REQUIRED_FAMILIES = {
    "cmdb_application_portfolio",
    "application_deployment_and_hosting",
    "vendor_contract_commercial",
    "budget_spend_finance",
    "data_analytics_volumetrics",
    "ai_tool_usage",
    "executive_and_director_interviews",
    "infrastructure_cloud_datacenter",
    "program_portfolio_moves",
}
FORBIDDEN_PHRASES = {
    "all ETL pipelines",
    "all reports",
    "all scripts",
    "full inventory required before load",
    "old active-file design authority",
    "infer from folder",
    "unknown equals zero",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise AssertionError(f"Missing required artifact: {path}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def require_fields(rows: list[dict[str, str]], fields: set[str], artifact: str, issues: list[dict[str, str]]) -> None:
    for index, row in enumerate(rows, start=2):
        for field in fields:
            if not row.get(field, "").strip():
                issues.append(
                    {
                        "rule_id": "missing_required_field",
                        "artifact": artifact,
                        "row": str(index),
                        "field": field,
                    }
                )


def scan_forbidden(rows: list[dict[str, str]], artifact: str, issues: list[dict[str, str]]) -> None:
    for index, row in enumerate(rows, start=2):
        haystack = " ".join(row.values()).lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase.lower() in haystack:
                issues.append(
                    {
                        "rule_id": "forbidden_collection_or_authority_phrase",
                        "artifact": artifact,
                        "row": str(index),
                        "phrase": phrase,
                    }
                )


def contains_any(value: str, options: tuple[str, ...]) -> bool:
    lower = value.lower()
    return any(option in lower for option in options)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    issues: list[dict[str, str]] = []

    extraction = read_csv(out_dir / "ecl_client_extraction_mapping.csv")
    dense = read_csv(out_dir / "ecl_dense_source_room_requirements.csv")
    product = read_csv(out_dir / "ecl_product_deterministic_fact_contracts.csv")

    require_fields(
        extraction,
        {
            "family_id",
            "workbook_folder",
            "business_facing_workbook",
            "source_owner",
            "one_row_represents",
            "right_grain",
            "primary_join_keys",
            "product_need",
            "acceptable_partial_behavior",
            "quality_gate",
            "do_not_collect",
            "example_prefilled_row",
        },
        "ecl_client_extraction_mapping.csv",
        issues,
    )
    require_fields(
        dense,
        {
            "requirement_id",
            "domain",
            "source_room_family",
            "minimum_viable_rows",
            "dense_meridian_target_rows",
            "must_include",
            "why_needed",
            "partial_catchup_rule",
            "quality_gate",
        },
        "ecl_dense_source_room_requirements.csv",
        issues,
    )
    require_fields(
        product,
        {
            "contract_id",
            "product_module",
            "page_or_view",
            "cxo_question",
            "deterministic_facts",
            "required_entities",
            "required_relationships",
            "required_measures",
            "required_extracts",
            "admission_or_gate",
            "partial_input_behavior",
            "not_allowed",
        },
        "ecl_product_deterministic_fact_contracts.csv",
        issues,
    )

    scan_forbidden(extraction, "ecl_client_extraction_mapping.csv", issues)
    scan_forbidden(dense, "ecl_dense_source_room_requirements.csv", issues)
    scan_forbidden(product, "ecl_product_deterministic_fact_contracts.csv", issues)

    families = {row["family_id"] for row in extraction}
    missing_families = sorted(REQUIRED_FAMILIES - families)
    for family in missing_families:
        issues.append({"rule_id": "missing_required_source_family", "artifact": "ecl_client_extraction_mapping.csv", "family_id": family})

    dense_families = {row["source_room_family"] for row in dense}
    missing_dense_families = sorted(REQUIRED_FAMILIES - dense_families)
    for family in missing_dense_families:
        issues.append({"rule_id": "missing_dense_requirement_family", "artifact": "ecl_dense_source_room_requirements.csv", "family_id": family})

    products = {row["product_module"] for row in product}
    missing_products = sorted(REQUIRED_PRODUCTS - products)
    for product_name in missing_products:
        issues.append({"rule_id": "missing_required_product_module", "artifact": "ecl_product_deterministic_fact_contracts.csv", "product_module": product_name})

    for index, row in enumerate(extraction, start=2):
        partial = row.get("acceptable_partial_behavior", "")
        if not contains_any(partial, ("unknown", "gap", "partial", "missing")):
            issues.append({"rule_id": "partial_behavior_not_explicit", "artifact": "ecl_client_extraction_mapping.csv", "row": str(index)})
        if "product" not in row.get("product_need", "").lower() and not row.get("product_consumers", "").strip():
            issues.append({"rule_id": "product_need_not_justified", "artifact": "ecl_client_extraction_mapping.csv", "row": str(index)})

    for index, row in enumerate(product, start=2):
        gate_text = f"{row.get('admission_or_gate', '')} {row.get('partial_input_behavior', '')}"
        if not contains_any(gate_text, ("gate", "refusal", "partial", "unknown", "missing", "blocked")):
            issues.append({"rule_id": "product_contract_missing_gate_or_partial_behavior", "artifact": "ecl_product_deterministic_fact_contracts.csv", "row": str(index)})

    summary = {
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "extraction_families": len(extraction),
        "dense_requirements": len(dense),
        "product_fact_contracts": len(product),
        "products": sorted(products),
        "partial_processing_supported": True,
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "ecl_next_slice_acceptance_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    issue_path = out_dir / "ecl_next_slice_acceptance_issues.csv"
    fields = ["rule_id", "artifact", "row", "field", "phrase", "family_id", "product_module"]
    with issue_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(issues)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
