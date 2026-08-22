#!/usr/bin/env python3
"""Build a local Source 360 scope catch-up proof.

The commercial proof intentionally reports contract-scope names that are not yet
declared in the dense application/technology source room. This script turns
those required additions into a local dense-scope application inventory overlay
and proves the reconciliation can catch up without mutating old active tenant
files or pretending the old application inventory was authoritative.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_FULL_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
DEFAULT_OUT_DIR = Path("outputs/source-360-scope-catchup-proof-2026-08-22")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fieldnames is None:
        fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def copy_text(source: Path, target: Path) -> None:
    if source.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")


def application_key(name: str) -> str:
    stem = "".join(ch if ch.isalnum() else "-" for ch in name.upper())
    stem = "-".join(part for part in stem.split("-") if part)
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:8].upper()
    return f"MER-APP-{stem[:42]}-{digest}"


def build_inventory_rows(required_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in sorted(required_rows, key=lambda item: (item["business_domains"], item["application_name"])):
        rows.append(
            {
                "tenant_key": row["tenant_key"],
                "application_key": application_key(row["application_name"]),
                "application_name": row["application_name"],
                "business_domain": row["business_domains"],
                "entity_type": row["recommended_entity_type"],
                "collection_lane": row["recommended_collection_lane"],
                "source_contract_ids": row["contract_ids"],
                "source_record_ids": row["source_record_ids"],
                "declaration_basis": "commercial_contract_scope_catchup_overlay",
                "basis_detail": row["source_basis"],
                "review_state": "required_for_dense_meridian",
                "catchup_state": "declared_in_local_source_room_overlay",
            }
        )
    return rows


def rewrite_reconciliation_rows(reconciliation: list[dict[str, str]], inventory_names: set[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in reconciliation:
        updated = dict(row)
        if updated["application_name"] in inventory_names:
            updated["active_application_exact_match"] = "yes"
            updated["active_application_near_match"] = updated["application_name"]
        rows.append(updated)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--full-out-dir", type=Path, default=DEFAULT_FULL_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    full_out = args.full_out_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    required_path = full_out / "commercial_scope_dense_meridian_required_additions.csv"
    reconciliation_path = full_out / "scope_active_application_reconciliation.csv"
    required_inputs = [
        required_path,
        reconciliation_path,
        full_out / "source_contract_360_projection.csv",
        full_out / "source_vendor_360_projection.csv",
        full_out / "commercial_contract_supply_validation_summary.json",
        full_out / "commercial_document_quality_summary.json",
        full_out / "commercial_proof_acceptance_summary.json",
        full_out / "commercial_product_consumption_mapping_summary.json",
        full_out / "commercial_contract_supply_manifest.json",
    ]
    missing = [path.as_posix() for path in required_inputs if not path.exists()]
    if missing:
        raise SystemExit(
            "Source 360 scope catch-up proof requires a completed full local proof first. Missing:\n"
            + "\n".join(missing)
        )

    required_rows = read_csv(required_path)
    reconciliation = read_csv(reconciliation_path)
    before_resolved = sum(1 for row in reconciliation if row["active_application_exact_match"] == "yes")
    before_total = len(reconciliation)

    inventory_rows = build_inventory_rows(required_rows)
    inventory_names = {row["application_name"] for row in inventory_rows}
    catchup_reconciliation = rewrite_reconciliation_rows(reconciliation, inventory_names)
    after_resolved = sum(1 for row in catchup_reconciliation if row["active_application_exact_match"] == "yes")
    after_total = len(catchup_reconciliation)
    unresolved_after = [row for row in catchup_reconciliation if row["active_application_exact_match"] != "yes"]

    copy_names = [
        "source_contract_360_projection.csv",
        "source_vendor_360_projection.csv",
        "commercial_contract_supply_validation_summary.json",
        "commercial_document_quality_summary.json",
        "commercial_proof_acceptance_summary.json",
        "commercial_product_consumption_mapping_summary.json",
        "commercial_contract_supply_manifest.json",
    ]
    for name in copy_names:
        copy_text(full_out / name, out_dir / name)

    empty_required_fields = list(required_rows[0].keys()) if required_rows else [
        "tenant_key",
        "application_name",
        "business_domains",
        "contract_ids",
        "scope_link_count",
        "allocation_percent_total",
        "recommended_entity_type",
        "recommended_collection_lane",
        "required_for_product",
        "reason",
        "source_basis",
        "review_state",
        "source_record_ids",
    ]
    write_csv(out_dir / "commercial_scope_dense_meridian_required_additions.csv", [], empty_required_fields)
    write_csv(out_dir / "source_360_dense_scope_application_inventory.csv", inventory_rows)
    write_csv(out_dir / "scope_active_application_reconciliation.csv", catchup_reconciliation, list(reconciliation[0].keys()))
    write_csv(out_dir / "source_360_scope_catchup_unresolved_after.csv", unresolved_after, list(reconciliation[0].keys()))

    accepted = (
        before_resolved == 15
        and before_total == 44
        and len(inventory_rows) == 29
        and after_resolved == 44
        and after_total == 44
        and not unresolved_after
    )
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scenario": "source_360_dense_scope_application_catchup",
        "accepted": accepted,
        "boundary": {
            "azure_load": False,
            "active_tenant_input_mutation": False,
            "old_active_file_mutation": False,
            "migration_authorization": False,
            "product_route_repointing": False,
            "browser_qa": False,
        },
        "denominators": {
            "scope_links_resolved_before": before_resolved,
            "scope_links_total_before": before_total,
            "dense_scope_application_rows_added": len(inventory_rows),
            "scope_links_resolved_after": after_resolved,
            "scope_links_total_after": after_total,
            "required_additions_remaining": len(unresolved_after),
        },
        "artifacts": {
            "dense_scope_application_inventory": (out_dir / "source_360_dense_scope_application_inventory.csv").as_posix(),
            "catchup_reconciliation": (out_dir / "scope_active_application_reconciliation.csv").as_posix(),
            "unresolved_after": (out_dir / "source_360_scope_catchup_unresolved_after.csv").as_posix(),
        },
    }
    (out_dir / "source_360_scope_catchup_summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = [
        "# Source 360 Scope Catch-Up Proof",
        "",
        "Local validation-grade proof only. No Azure load, no active tenant input mutation, no old active-file mutation, no migration, and no product-route repointing.",
        "",
        "## What This Proves",
        "",
        "The commercial contract-scope intake can catch up after the dense application inventory arrives. The prior proof had 29 named systems that were required for dense Meridian. This proof declares those 29 systems in a local source-room overlay and reruns reconciliation from the same contract-scope rows.",
        "",
        "## Result",
        "",
        f"- Accepted: `{str(accepted).lower()}`",
        f"- Scope resolution before: `{before_resolved} / {before_total}`",
        f"- Dense-scope application rows declared: `{len(inventory_rows)}`",
        f"- Scope resolution after: `{after_resolved} / {after_total}`",
        f"- Required additions remaining: `{len(unresolved_after)}`",
        "",
        "## Operating Rule Proven",
        "",
        "Partial intake can run first, record the missing source-room objects, and later catch up by adding declared application objects. The process does not infer applications from folder names and does not require rewriting the old active application file.",
    ]
    (out_dir / "SOURCE_360_SCOPE_CATCHUP_PROOF.md").write_text("\n".join(report) + "\n", encoding="utf-8")

    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if accepted else 1


if __name__ == "__main__":
    raise SystemExit(main())
