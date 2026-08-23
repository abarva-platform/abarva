#!/usr/bin/env python3

"""Validate the local ECL client workbook execution package."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-client-workbook-execution-2026-08-23")

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

REQUIRED_PRODUCTS = {"Home", "Source 360", "Tower", "Intelligence", "Moves", "cubes"}

REQUIRED_FOLDER_FILES = {
    "README.md",
    "How_To_Use.html",
    "Field_Guide.csv",
    "Example_Rows.csv",
    "Source_Extract_Recipes.csv",
    "Product_Mapping.csv",
}

FORBIDDEN_PHRASES = {
    "all ETL pipelines",
    "all reports",
    "all scripts",
    "full inventory required before load",
    "infer from folder",
    "unknown equals zero",
    "synthetic source-backed value",
    "example value",
    "builder vocabulary",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise AssertionError(f"Missing required CSV: {path}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def add_issue(issues: list[dict[str, str]], rule_id: str, artifact: Path, detail: str) -> None:
    issues.append(
        {
            "rule_id": rule_id,
            "artifact": artifact.as_posix(),
            "detail": detail,
        }
    )


def scan_forbidden(path: Path, text: str, issues: list[dict[str, str]]) -> None:
    lower = text.lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase.lower() in lower:
            add_issue(issues, "forbidden_phrase", path, phrase)


def validate_folder(folder: Path, issues: list[dict[str, str]]) -> tuple[set[str], set[str], int, int, int]:
    for filename in REQUIRED_FOLDER_FILES:
        path = folder / filename
        if not path.exists():
            add_issue(issues, "missing_folder_file", path, filename)

    families: set[str] = set()
    products: set[str] = set()
    field_count = 0
    recipe_count = 0
    example_count = 0

    field_path = folder / "Field_Guide.csv"
    if field_path.exists():
        rows = read_csv(field_path)
        field_count = len(rows)
        required_columns = {
            "family_id",
            "field_code",
            "business_label",
            "source_owner",
            "source_system_hint",
            "why_needed",
            "example_value",
            "blank_behavior",
            "validation_rule",
            "product_consumers",
            "do_not_collect",
        }
        if rows and not required_columns.issubset(rows[0].keys()):
            add_issue(issues, "field_guide_missing_columns", field_path, ",".join(sorted(required_columns - set(rows[0].keys()))))
        for index, row in enumerate(rows, start=2):
            families.add(row.get("family_id", ""))
            products.update(part.strip() for part in row.get("product_consumers", "").split(";") if part.strip())
            for column in required_columns:
                if not row.get(column, "").strip():
                    add_issue(issues, "blank_required_field_guide_cell", field_path, f"row {index} column {column}")
            if row.get("example_value", "").strip().lower() in {"", "unknown", "n/a"}:
                add_issue(issues, "thin_or_missing_example_value", field_path, f"row {index} {row.get('field_code', '')}")
            if "unknown" not in row.get("blank_behavior", "").lower() and "gap" not in row.get("blank_behavior", "").lower() and "partial" not in row.get("blank_behavior", "").lower() and "missing" not in row.get("blank_behavior", "").lower():
                add_issue(issues, "blank_behavior_not_partial_aware", field_path, f"row {index}")
        scan_forbidden(field_path, field_path.read_text(encoding="utf-8"), issues)

    recipe_path = folder / "Source_Extract_Recipes.csv"
    if recipe_path.exists():
        rows = read_csv(recipe_path)
        recipe_count = len(rows)
        required_columns = {
            "family_id",
            "recipe_name",
            "source_owner",
            "system_extract",
            "right_filter",
            "row_grain",
            "output_format",
            "join_keys",
            "partial_load_behavior",
            "quality_gate",
            "do_not_collect",
        }
        if rows and not required_columns.issubset(rows[0].keys()):
            add_issue(issues, "recipe_missing_columns", recipe_path, ",".join(sorted(required_columns - set(rows[0].keys()))))
        for index, row in enumerate(rows, start=2):
            families.add(row.get("family_id", ""))
            for column in required_columns:
                if not row.get(column, "").strip():
                    add_issue(issues, "blank_required_recipe_cell", recipe_path, f"row {index} column {column}")
            if "do not export every report or pipeline" in row.get("right_filter", "").lower() and row.get("family_id") != "data_analytics_volumetrics":
                add_issue(issues, "overcollection_note_in_wrong_family", recipe_path, f"row {index}")
        scan_forbidden(recipe_path, recipe_path.read_text(encoding="utf-8"), issues)

    example_path = folder / "Example_Rows.csv"
    if example_path.exists():
        rows = read_csv(example_path)
        example_count = len(rows)
        for index, row in enumerate(rows, start=2):
            families.add(row.get("family_id", ""))
            populated = [value for key, value in row.items() if key not in {"family_id", "extract_or_tab"} and value.strip()]
            if len(populated) < 5:
                add_issue(issues, "example_row_too_thin", example_path, f"row {index}")
            if any(value.strip().lower() == "unknown" for value in populated):
                add_issue(issues, "example_row_uses_unknown", example_path, f"row {index}")
        scan_forbidden(example_path, example_path.read_text(encoding="utf-8"), issues)

    product_path = folder / "Product_Mapping.csv"
    if product_path.exists():
        rows = read_csv(product_path)
        for index, row in enumerate(rows, start=2):
            families.add(row.get("family_id", ""))
            products.update(part.strip() for part in row.get("product_consumers", "").split(";") if part.strip())
            if not row.get("product_need", "").strip():
                add_issue(issues, "missing_product_need", product_path, f"row {index}")
        scan_forbidden(product_path, product_path.read_text(encoding="utf-8"), issues)

    for text_path in [folder / "README.md", folder / "How_To_Use.html"]:
        if text_path.exists():
            text = text_path.read_text(encoding="utf-8")
            scan_forbidden(text_path, text, issues)
            if "Do not fill plausible values" not in text:
                add_issue(issues, "missing_no_invention_instruction", text_path, "expected client-facing no-invention instruction")

    return families, products, field_count, recipe_count, example_count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    issues: list[dict[str, str]] = []

    manifest_path = out_dir / "workbook_folder_manifest.csv"
    summary_path = out_dir / "workbook_execution_package_summary.json"
    if not manifest_path.exists():
        add_issue(issues, "missing_manifest", manifest_path, "run build_ecl_client_workbook_execution_package.py first")
        manifest_rows: list[dict[str, str]] = []
    else:
        manifest_rows = read_csv(manifest_path)
    if not summary_path.exists():
        add_issue(issues, "missing_summary", summary_path, "run build_ecl_client_workbook_execution_package.py first")

    all_families: set[str] = set()
    all_products: set[str] = set()
    total_fields = 0
    total_recipes = 0
    total_examples = 0

    for row in manifest_rows:
        folder = out_dir / row["workbook_folder"]
        families, products, field_count, recipe_count, example_count = validate_folder(folder, issues)
        all_families.update(families)
        all_products.update(products)
        total_fields += field_count
        total_recipes += recipe_count
        total_examples += example_count
        if int(row.get("field_count", "0")) != field_count:
            add_issue(issues, "manifest_field_count_mismatch", manifest_path, row["workbook_folder"])
        if int(row.get("example_row_count", "0")) != example_count:
            add_issue(issues, "manifest_example_count_mismatch", manifest_path, row["workbook_folder"])
        if int(row.get("recipe_count", "0")) != recipe_count:
            add_issue(issues, "manifest_recipe_count_mismatch", manifest_path, row["workbook_folder"])

    missing_families = sorted(REQUIRED_FAMILIES - all_families)
    for family in missing_families:
        add_issue(issues, "missing_required_family", out_dir, family)

    missing_products = sorted(REQUIRED_PRODUCTS - all_products)
    for product in missing_products:
        add_issue(issues, "missing_required_product_consumer", out_dir, product)

    if len(manifest_rows) != 8:
        add_issue(issues, "unexpected_workbook_folder_count", manifest_path, f"got {len(manifest_rows)}, expected 8")
    if total_fields < 75:
        add_issue(issues, "field_guide_too_thin", out_dir, f"got {total_fields}, expected at least 75")
    if total_examples < len(REQUIRED_FAMILIES):
        add_issue(issues, "not_enough_example_rows", out_dir, f"got {total_examples}, expected at least {len(REQUIRED_FAMILIES)}")
    if total_recipes < len(REQUIRED_FAMILIES):
        add_issue(issues, "not_enough_extract_recipes", out_dir, f"got {total_recipes}, expected at least {len(REQUIRED_FAMILIES)}")

    summary = {
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "workbook_folder_count": len(manifest_rows),
        "families_covered": sorted(all_families),
        "products_covered": sorted(all_products),
        "field_guide_rows": total_fields,
        "example_rows": total_examples,
        "source_extract_recipes": total_recipes,
        "partial_processing_supported": True,
        "client_package_replacement": False,
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "workbook_execution_package_validation_summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_csv(
        out_dir / "workbook_execution_package_validation_issues.csv",
        issues,
        ["rule_id", "artifact", "detail"],
    )
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
