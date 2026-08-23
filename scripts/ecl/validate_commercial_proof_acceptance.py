#!/usr/bin/env python3

"""Validate the commercial ECL proof bundle against acceptance gates."""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
EXPECTED_COUNTS = {
    "source_files": 67,
    "source_records": 564,
    "documents": 55,
    "document_extractions": 235,
    "objects": 46,
    "relationships": 49,
    "measures": 75,
    "contracts": 5,
    "service_lines": 20,
    "contract_scope": 44,
    "invoice_lines": 40,
    "sla_observations": 90,
    "source_contract_360_rows": 5,
    "source_vendor_360_rows": 5,
    "source_value_levers_rows": 5,
    "tower_rows": 5,
    "cube_manifests": 4,
    "cube_slices": 20,
    "cube_slice_metrics": 160,
    "cube_slice_measures": 160,
}
DB_PROOF_EXPECTATIONS = {
    "json_metric_drift": "0",
    "document_span_distinct": "235",
    "document_confidence_distinct": "28",
    "document_span_fallback_count": "0",
    "pricing_rate_card_reconciliation_failures": "0",
    "invoice_arithmetic_failures": "0",
    "invoice_rate_annualization_failures": "0",
    "market_benchmark_source_distinct_variance_values": "20",
    "market_benchmark_model_inferred_basis_rows": "10",
    "market_benchmark_source_recorded_basis_rows": "0",
    "source_value_levers": "5",
    "source_value_levers_gated": "5",
    "source_value_levers_claimable_sum": "0",
    "source_value_levers_primary_metric_drift": "0",
    "source_value_levers_model_inferred_benchmark_rows": "5",
    "cube_metric_unit_failures": "0",
    "owner_confirmed_or_claimable_money_from_unverified_extraction": "0",
    "contract_money_document_extracted_basis": "0",
}
SNAKE_CASE_RE = re.compile(r"\b[a-z]+_[a-z0-9_]*[a-z0-9]\b")


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def count_csv_rows(path: Path) -> int:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        next(reader)
        return sum(1 for _ in reader)


def proof_contains_expected_value(text: str, label: str, expected: str) -> bool:
    pattern = re.compile(rf"\b{re.escape(label)}\b\s*\|\s*{re.escape(expected)}\b")
    return bool(pattern.search(text))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()

    issues: list[dict[str, str]] = []
    manifest_path = out_dir / "commercial_contract_supply_manifest.json"
    quality_path = out_dir / "commercial_document_quality_summary.json"
    extraction_path = out_dir / "commercial_client_extraction_mapping_summary.json"
    product_path = out_dir / "commercial_product_consumption_mapping_summary.json"
    source_page_contract_path = out_dir / "source_360_page_fact_contract_summary.json"
    db_proof_path = out_dir / "commercial_contract_supply_db_proof.txt"
    run_summary_path = out_dir / "commercial_proof_run_summary.json"

    manifest = load_json(manifest_path)
    quality = load_json(quality_path)
    extraction = load_json(extraction_path)
    product = load_json(product_path)
    source_page_contract = load_json(source_page_contract_path)
    run_summary = load_json(run_summary_path) if run_summary_path.exists() else {}
    db_proof = db_proof_path.read_text(encoding="utf-8") if db_proof_path.exists() else ""

    for key, expected in EXPECTED_COUNTS.items():
        actual = manifest.get(key)
        if actual != expected:
            issues.append({"rule_id": "count_mismatch", "subject": key, "expected": str(expected), "actual": str(actual)})

    if quality.get("documents_checked") != 55 or quality.get("issue_count") != 0:
        issues.append(
            {
                "rule_id": "document_quality_failed",
                "subject": "commercial_document_quality_summary",
                "expected": "55 documents, 0 issues",
                "actual": f"{quality.get('documents_checked')} documents, {quality.get('issue_count')} issues",
            }
        )

    if extraction.get("extracts_documented") != 12:
        issues.append({"rule_id": "client_extraction_mapping_failed", "subject": "extracts_documented", "expected": "12", "actual": str(extraction.get("extracts_documented"))})
    if product.get("mappings") != 7:
        issues.append({"rule_id": "product_consumption_mapping_failed", "subject": "mappings", "expected": "7", "actual": str(product.get("mappings"))})
    if source_page_contract.get("accepted") is not True:
        issues.append(
            {
                "rule_id": "source_360_page_contract_failed",
                "subject": "accepted",
                "expected": "true",
                "actual": str(source_page_contract.get("accepted")),
            }
        )
    if source_page_contract.get("rows") != 14:
        issues.append({"rule_id": "source_360_page_contract_rows_failed", "subject": "rows", "expected": "14", "actual": str(source_page_contract.get("rows"))})
    if source_page_contract.get("supplied_rows") != 11 or source_page_contract.get("missing_projection_rows") != 3:
        issues.append(
            {
                "rule_id": "source_360_page_contract_mix_failed",
                "subject": "supplied/missing_projection",
                "expected": "11/3",
                "actual": f"{source_page_contract.get('supplied_rows')}/{source_page_contract.get('missing_projection_rows')}",
            }
        )

    visible_snake_case_hits = 0
    docs_dir = out_dir / "source_room/SP08_Vendor_Contract/documents"
    for path in sorted(docs_dir.glob("*.md")):
        for line in path.read_text(encoding="utf-8").splitlines():
            visible_snake_case_hits += len(SNAKE_CASE_RE.findall(line))
    if visible_snake_case_hits:
        issues.append({"rule_id": "visible_snake_case", "subject": "contract_documents", "expected": "0", "actual": str(visible_snake_case_hits)})

    for label, expected in DB_PROOF_EXPECTATIONS.items():
        if not proof_contains_expected_value(db_proof, label, expected):
            issues.append({"rule_id": "db_proof_expectation_missing", "subject": label, "expected": expected, "actual": "not found"})

    boundary = run_summary.get("boundary", {})
    for key in ["azure_load", "active_tenant_input_mutation", "migration_authorization", "product_route_repointing", "browser_qa"]:
        if boundary.get(key) is not False:
            issues.append({"rule_id": "boundary_not_closed", "subject": key, "expected": "false", "actual": str(boundary.get(key))})

    proof_manifest_path = out_dir / "proof_bundle_manifest.json"
    artifact_hash_count = None
    source_room_hash_count = None
    if proof_manifest_path.exists():
        proof_manifest = load_json(proof_manifest_path)
        artifact_hash_count = len(proof_manifest.get("artifact_hashes", []))
        source_room_hash_count = len(proof_manifest.get("source_room_hashes", []))
        if artifact_hash_count < 25:
            issues.append({"rule_id": "artifact_hash_count_low", "subject": "artifact_hashes", "expected": ">=25", "actual": str(artifact_hash_count)})
        if source_room_hash_count != 67:
            issues.append({"rule_id": "source_room_hash_count_mismatch", "subject": "source_room_hashes", "expected": "67", "actual": str(source_room_hash_count)})

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "checks": {
            "expected_counts": len(EXPECTED_COUNTS),
            "db_proof_expectations": len(DB_PROOF_EXPECTATIONS),
            "documents_checked": quality.get("documents_checked"),
            "document_quality_issues": quality.get("issue_count"),
            "extracts_documented": extraction.get("extracts_documented"),
            "product_mappings": product.get("mappings"),
            "source_360_page_contract_rows": source_page_contract.get("rows"),
            "source_360_page_contract_supplied_rows": source_page_contract.get("supplied_rows"),
            "source_360_page_contract_missing_projection_rows": source_page_contract.get("missing_projection_rows"),
            "visible_snake_case_hits": visible_snake_case_hits,
            "artifact_hash_count": artifact_hash_count,
            "source_room_hash_count": source_room_hash_count,
            "field_lineage_rows": count_csv_rows(out_dir / "commercial_contract_supply_field_lineage.csv"),
        },
    }
    summary_path = out_dir / "commercial_proof_acceptance_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
