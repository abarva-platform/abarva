#!/usr/bin/env python3

"""Validate the local commercial source-room extracts before ECL load generation."""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_SOURCE_ROOM = Path(
    "outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_room/SP08_Vendor_Contract"
)
DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")

REQUIRED_FIELDS = {
    "contract_register.csv": ["tenant_key", "contract_id", "vendor_parent_id", "supplier_id", "supplier_legal_name", "contract_name", "annual_value_usd", "committed_value_usd", "review_state"],
    "supplier_master.csv": ["tenant_key", "vendor_parent_id", "supplier_id", "supplier_legal_name", "supplier_status", "review_state"],
    "contract_document_inventory.csv": ["tenant_key", "contract_id", "document_id", "document_role", "source_file_path", "sha256", "generated_page_count", "review_state"],
    "document_clause_extractions.csv": ["tenant_key", "contract_id", "document_id", "concept_ref", "source_page", "span_start", "span_end", "extracted_text", "confidence", "review_state", "span_basis"],
    "source_contract_scope_services.csv": ["tenant_key", "contract_id", "service_tower_id", "service_tower", "process_name", "system_of_record", "review_state"],
    "contract_scope_application_links.csv": ["tenant_key", "contract_id", "scope_type", "application_name", "business_domain", "allocation_percent", "review_state"],
    "source_contract_pricing_rate_cards.csv": ["tenant_key", "contract_id", "document_id", "pricing_line_id", "service_tower_id", "quantity_or_commitment", "unit_price_usd", "annual_value_usd", "review_state"],
    "source_market_benchmark_rates.csv": ["tenant_key", "contract_id", "service_tower_id", "benchmark_category", "contract_rate_annual_usd", "market_median_annual_usd", "market_variance_usd", "market_variance_pct", "benchmark_dataset_id", "benchmark_confidence", "benchmark_generation_basis", "review_state"],
    "source_ap_po_invoice_lines.csv": ["tenant_key", "contract_id", "supplier_id", "invoice_number", "invoice_line_id", "service_tower_id", "quantity", "invoice_amount_usd", "contract_rate_amount_usd", "variance_amount_usd", "review_state"],
    "source_sla_kpi_events.csv": ["tenant_key", "contract_id", "service_tower_id", "event_date", "sla_name", "breach_state", "service_credits_earned_usd", "service_credits_claimed_usd", "review_state"],
    "source_finance_realization.csv": ["tenant_key", "contract_id", "finance_period", "locked_baseline_usd", "approved_value_usd", "vendor_cost_usd", "finance_confirmed_value_usd", "review_state"],
    "contract_commercial_protection_assessment.csv": ["tenant_key", "contract_id", "protection_score", "protection_band", "notice_window_days", "estimated_tfc_cost_usd", "minimum_commitment_usd", "modeled_shortfall_exposure_usd", "primary_weakness", "review_state"],
}

UNIQUE_KEYS = {
    "contract_register.csv": ["contract_id"],
    "supplier_master.csv": ["supplier_id"],
    "contract_document_inventory.csv": ["document_id"],
    "document_clause_extractions.csv": ["source_record_id"],
    "source_contract_scope_services.csv": ["source_record_id"],
    "contract_scope_application_links.csv": ["source_record_id"],
    "source_contract_pricing_rate_cards.csv": ["pricing_line_id"],
    "source_market_benchmark_rates.csv": ["source_record_id"],
    "source_ap_po_invoice_lines.csv": ["invoice_line_id"],
    "source_sla_kpi_events.csv": ["source_record_id"],
    "source_finance_realization.csv": ["source_record_id"],
    "contract_commercial_protection_assessment.csv": ["contract_id"],
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def add_issue(
    issues: list[dict[str, str]],
    file_name: str,
    row_number: int,
    record_id: str,
    field: str,
    severity: str,
    rule_id: str,
    message: str,
) -> None:
    issues.append(
        {
            "file_name": file_name,
            "row_number": str(row_number),
            "record_id": record_id,
            "field": field,
            "severity": severity,
            "rule_id": rule_id,
            "message": message,
        }
    )


def row_id(row: dict[str, str]) -> str:
    for field in ("source_record_id", "contract_id", "document_id", "supplier_id", "invoice_line_id", "pricing_line_id"):
        if row.get(field):
            return row[field]
    return ""


def validate_required_and_unique(source_room: Path, tables: dict[str, list[dict[str, str]]], issues: list[dict[str, str]]) -> None:
    for file_name, fields in REQUIRED_FIELDS.items():
        path = source_room / "extracts" / file_name
        if not path.exists():
            add_issue(issues, file_name, 0, "", "", "error", "missing_file", "Required extract file is missing.")
            continue
        rows = tables[file_name]
        if not rows:
            add_issue(issues, file_name, 0, "", "", "error", "empty_file", "Required extract file has no data rows.")
            continue
        headers = set(rows[0].keys())
        for field in fields:
            if field not in headers:
                add_issue(issues, file_name, 1, "", field, "error", "missing_column", "Required column is missing.")
        for index, row in enumerate(rows, start=2):
            for field in fields:
                if field in headers and not str(row.get(field, "")).strip():
                    add_issue(issues, file_name, index, row_id(row), field, "error", "blank_required_field", "Required field is blank.")
        for key in UNIQUE_KEYS.get(file_name, []):
            values = defaultdict(list)
            for index, row in enumerate(rows, start=2):
                values[row.get(key, "")].append(index)
            for value, indexes in values.items():
                if value and len(indexes) > 1:
                    add_issue(
                        issues,
                        file_name,
                        indexes[0],
                        value,
                        key,
                        "error",
                        "duplicate_key",
                        f"Key repeats on rows {indexes}.",
                    )


def validate_references(tables: dict[str, list[dict[str, str]]], issues: list[dict[str, str]]) -> None:
    contract_ids = {row["contract_id"] for row in tables.get("contract_register.csv", []) if row.get("contract_id")}
    supplier_ids = {row["supplier_id"] for row in tables.get("supplier_master.csv", []) if row.get("supplier_id")}
    document_ids = {row["document_id"] for row in tables.get("contract_document_inventory.csv", []) if row.get("document_id")}
    service_keys = {
        (row.get("contract_id"), row.get("service_tower_id"))
        for row in tables.get("source_contract_scope_services.csv", [])
        if row.get("contract_id") and row.get("service_tower_id")
    }
    contract_ref_files = [
        "contract_document_inventory.csv",
        "document_clause_extractions.csv",
        "source_contract_scope_services.csv",
        "contract_scope_application_links.csv",
        "source_contract_pricing_rate_cards.csv",
        "source_market_benchmark_rates.csv",
        "source_ap_po_invoice_lines.csv",
        "source_sla_kpi_events.csv",
        "source_finance_realization.csv",
        "contract_commercial_protection_assessment.csv",
    ]
    for file_name in contract_ref_files:
        for index, row in enumerate(tables.get(file_name, []), start=2):
            if row.get("contract_id") and row["contract_id"] not in contract_ids:
                add_issue(issues, file_name, index, row_id(row), "contract_id", "error", "unknown_contract_id", "Referenced contract_id is not in contract_register.")
    for file_name in ["document_clause_extractions.csv", "source_contract_pricing_rate_cards.csv"]:
        for index, row in enumerate(tables.get(file_name, []), start=2):
            if row.get("document_id") and row["document_id"] not in document_ids:
                add_issue(issues, file_name, index, row_id(row), "document_id", "error", "unknown_document_id", "Referenced document_id is not in contract_document_inventory.")
    for file_name in ["source_ap_po_invoice_lines.csv"]:
        for index, row in enumerate(tables.get(file_name, []), start=2):
            if row.get("supplier_id") and row["supplier_id"] not in supplier_ids:
                add_issue(issues, file_name, index, row_id(row), "supplier_id", "error", "unknown_supplier_id", "Referenced supplier_id is not in supplier_master.")
    for file_name in ["source_contract_pricing_rate_cards.csv", "source_market_benchmark_rates.csv", "source_ap_po_invoice_lines.csv", "source_sla_kpi_events.csv"]:
        for index, row in enumerate(tables.get(file_name, []), start=2):
            key = (row.get("contract_id"), row.get("service_tower_id"))
            if all(key) and key not in service_keys:
                add_issue(issues, file_name, index, row_id(row), "service_tower_id", "error", "unknown_service_tower", "Referenced service tower is not declared for this contract.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-room", type=Path, default=DEFAULT_SOURCE_ROOM)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    source_room = args.source_room.resolve()
    tables = {
        file_name: read_csv(source_room / "extracts" / file_name)
        for file_name in REQUIRED_FIELDS
        if (source_room / "extracts" / file_name).exists()
    }
    issues: list[dict[str, str]] = []
    validate_required_and_unique(source_room, tables, issues)
    validate_references(tables, issues)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    issue_path = args.out_dir / "commercial_contract_supply_bad_rows.csv"
    with issue_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["file_name", "row_number", "record_id", "field", "severity", "rule_id", "message"],
        )
        writer.writeheader()
        writer.writerows(issues)
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_room": source_room.as_posix(),
        "files_checked": len(REQUIRED_FIELDS),
        "rows_checked": sum(len(rows) for rows in tables.values()),
        "issue_count": len(issues),
        "issues_by_severity": dict(Counter(issue["severity"] for issue in issues)),
        "issues_by_rule": dict(Counter(issue["rule_id"] for issue in issues)),
        "bad_rows_csv": issue_path.as_posix(),
    }
    (args.out_dir / "commercial_contract_supply_validation_summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, indent=2, sort_keys=True))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
