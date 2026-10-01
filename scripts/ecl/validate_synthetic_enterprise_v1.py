#!/usr/bin/env python3
"""Independently validate a generated synthetic enterprise source set."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFINITION = ROOT / "datasets/synthetic/enterprise-v1/definition.json"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def matches_csv_value(raw: str | None, value: Any) -> bool:
    if value is None:
        return raw in (None, "")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        try:
            return raw is not None and Decimal(raw) == Decimal(str(value))
        except InvalidOperation:
            return False
    return raw == str(value)


def money_share(rows: list[dict[str, str]], field: str) -> float:
    values = sorted((float(row[field]) for row in rows), reverse=True)
    return sum(values[: max(1, len(values) // 10)]) / sum(values)


def validate(directory: Path) -> dict[str, Any]:
    root = directory.resolve()
    manifest = json.loads((root / "enterprise_manifest.json").read_text(encoding="utf-8"))
    require(manifest["dataset_id"] == "MERIDIAN_SYNTHETIC_ENTERPRISE_V1", "Wrong dataset version")
    require(manifest["assessment_id"] == "assessment-meridian-synthetic-enterprise-v1", "Wrong assessment")
    require(manifest["review_state"] == "candidate_not_loaded", "Generated pack must remain a candidate")
    require(manifest["client_attestation_state"] == "not_client_attested", "Synthetic pack claims client attestation")
    definition = json.loads(DEFINITION.read_text(encoding="utf-8"))
    definition_hash = hashlib.sha256(json.dumps(definition, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    require(manifest["definition_hash"] == definition_hash, "Source set was built from a different definition")
    files = manifest["files"]
    require(len(files) == 22, "Source-family inventory is incomplete")
    require(len({row["source_room_family"] for row in files}) == len(files), "Duplicate source family")
    require(len({row["file_path"] for row in files}) == len(files), "Duplicate source path")
    rows: dict[str, list[dict[str, str]]] = {}
    for entry in files:
        path = (root / entry["file_path"]).resolve()
        require(path.is_relative_to(root), "Source path escapes the pack")
        require(path.is_file(), f"Missing source file: {path}")
        require(file_hash(path) == entry["sha256"], f"Source hash mismatch: {path}")
        family_rows = read_csv(path)
        require(len(family_rows) == entry["row_count"], f"Source count mismatch: {path}")
        require(len(family_rows) > 0, f"Empty source family: {path}")
        require(len({row["source_row_id"] for row in family_rows}) == len(family_rows),
                f"Duplicate native source IDs: {path}")
        require(all(row["synthetic_dataset_id"] == manifest["dataset_id"] for row in family_rows),
                f"Wrong dataset ID: {path}")
        require(all(row["client_attestation_state"] == "not_client_attested" for row in family_rows),
                f"Client attestation leak: {path}")
        rows[entry["source_room_family"]] = family_rows
    expected_hash = hashlib.sha256(json.dumps(
        sorted((entry["file_path"], entry["sha256"]) for entry in files),
        separators=(",", ":"),
    ).encode()).hexdigest()
    require(manifest["source_set_hash"] == expected_hash, "Source-set hash mismatch")
    registered = read_csv(root / "dense_source_room_manifest.csv")
    require(len(registered) == len(files), "Legacy-shaped file inventory count mismatch")
    require({row["file_path"]: row["sha256"] for row in registered}
            == {row["file_path"]: row["sha256"] for row in files}, "File inventories disagree")

    objects = {obj["object_id"]: obj for obj in manifest["objects"]}
    require(len(objects) == len(manifest["objects"]), "Duplicate governed object IDs")
    source_rows = {
        family: {row["source_row_id"]: row for row in family_rows}
        for family, family_rows in rows.items()
    }
    for obj in objects.values():
        family = obj["source_family"]
        source_row = source_rows.get(family, {}).get(obj["source_row_id"])
        require(source_row is not None, f"Object has no source row: {obj['object_id']}")
        require(source_row["governed_object_id"] == obj["object_id"],
                f"Object/source identity mismatch: {obj['object_id']}")
        require(source_row["source_as_of"] == obj["source_as_of"]
                and source_row["provenance_class"] == obj["provenance_class"],
                f"Object/source provenance mismatch: {obj['object_id']}")
        require(all(matches_csv_value(source_row.get(key), value)
                    for key, value in obj["attributes"].items()),
                f"Object/source attribute mismatch: {obj['object_id']}")
    require(len({edge["relationship_id"] for edge in manifest["relationships"]})
            == len(manifest["relationships"]), "Duplicate relationship IDs")
    relationship_rows = source_rows["SP17_Relationships"]
    missing = []
    for edge in manifest["relationships"]:
        source_row = relationship_rows.get(edge["relationship_id"])
        require(source_row is not None and all(source_row.get(key) == str(value)
                for key, value in edge.items()),
                f"Relationship/source row mismatch: {edge['relationship_id']}")
        require(edge["from_object_id"] in objects, f"Unknown edge source: {edge['relationship_id']}")
        if edge["to_object_id"] not in objects:
            require(edge["resolution_state"] == "unresolved", "Undeclared dangling relationship")
            missing.append(edge["relationship_id"])
    require(len(missing) == 1, "The unknown dependency was lost or multiplied")
    require(len(rows["SP17_Relationships"]) == len(manifest["relationships"]),
            "Relationship file does not match manifest")

    counts = Counter(obj["object_type"] for obj in objects.values())
    floors = {"business_segment": 3, "business_function": 10, "owner": 4,
              "program": 20, "metric": 30, "application": 300, "platform": 80,
              "data_asset": 300, "vendor": 50, "contract": 50, "risk": 40,
              "ai_use_case": 20}
    for kind, floor in floors.items():
        require(counts[kind] >= floor, f"Too few {kind} objects")

    apps = rows["SP03_CMDB"]
    contracts = rows["SP08_Vendor_Contract"]
    programs = rows["SP07_PPM"]
    metrics = rows["SP10_KPI_Operations"]
    flows = rows["SP13_Data_Flows_Integrations"]
    require(sum(not row["business_owner_id"] for row in apps) == 12, "Application ownership gap changed")
    require(all(row["vendor_id"] in objects and row["business_function_id"] in objects for row in apps),
            "Application identity join is broken")
    app_by_id = {row["application_id"]: row for row in apps}
    epic = next(row for row in apps if row["application_id"] == "APP-0007")
    require(epic["business_function_id"] == "FUNC-0005" and epic["criticality_tier"] == "tier_1",
            "Core clinical application mapping is implausible")
    require(all(row["vendor_id"] in objects for row in contracts), "Contract vendor join is broken")
    for contract in contracts:
        scoped = [item for item in contract["scoped_applications"].split(";") if item]
        require(all(app_id in app_by_id and (
            app_by_id[app_id]["vendor_id"] == contract["vendor_id"] or
            (contract["vendor_id"] == "VEN-0003" and app_by_id[app_id]["hosting_model"] == "aws_hosted")
        ) for app_id in scoped), f"Contract scope crosses an undeclared supplier or hosting relationship: {contract['contract_id']}")
        require(bool(scoped) == (contract["scope_basis"] == "declared_app_supplier_or_hosting"),
                f"Contract scope basis disagrees with its edges: {contract['contract_id']}")
    require(all(row["priority_id"] in objects for row in programs if row["priority_id"]),
            "Program priority join is broken")
    program_by_id = {row["program_id"]: row for row in programs}
    require(program_by_id["PROG-0013"]["priority_id"] == "PRI-0003"
            and program_by_id["PROG-0013"]["sponsor_function_id"] == "FUNC-0010",
            "Cloud modernization programme is off-strategy")
    require(program_by_id["PROG-0017"]["priority_id"] == "PRI-0004"
            and program_by_id["PROG-0017"]["sponsor_function_id"] == "FUNC-0009",
            "Value office programme is off-strategy")
    require(sum(not row["priority_id"] for row in programs) == 1, "Missing priority relationship changed")
    require(sum(not row["owner_id"] for row in programs) == 1, "Unresolved owner changed")
    for program in programs:
        dependent = program["dependent_applications"].split(";")
        require(len(dependent) == len(set(dependent)) == 3,
                f"Program has repeated or missing dependencies: {program['program_id']}")
        require(all(app_id in app_by_id for app_id in dependent),
                f"Program has an unknown application dependency: {program['program_id']}")
        require(program["status"] not in {"proposed", "approved"} or program["completion_pct"] == "0",
                f"Unstarted program has reported progress: {program['program_id']}")
        require(program["status"] != "closed" or program["completion_pct"] == "100",
                f"Closed program is not complete: {program['program_id']}")
    require(sum(row["value_claim_status"] == "unsupported_hypothesis" for row in programs) == 1,
            "Unsupported value hypothesis changed")
    require(sum(row["renewal_risk"] == "notice_window_at_risk" for row in contracts) == 1,
            "Renewal risk changed")
    require(all(row["source_object_ref"] in objects and row["target_object_ref"] in objects for row in flows),
            "Flow endpoint identity join is broken")
    require(Counter(row["period"] for row in metrics) == {"2026-Q2": 36, "2026-Q3": 37},
            "Comparable KPI periods changed")
    star = next(row for row in metrics if row["metric_id"] == "MET-0001" and row["period"] == "2026-Q3")
    require(star["kpi_unit"] == "stars" and star["kpi_value"] == "4.1" and star["target_value"] == "4.5",
            "Star Rating unit or target is not executive-readable")
    require(all(row["priority_id"] in objects for row in metrics), "KPI priority identity is broken")
    require(all(not row["source_application_ref"] or row["source_application_ref"] in objects
                for row in metrics), "KPI application identity is broken")
    require(sum(row["definition_state"] == "conflicting_source" for row in metrics) == 1,
            "Conflicting KPI definition changed")
    require(sum(row["source_as_of"] == "2025-06-30" for row in rows["SP04_Data_BI_ETL"]) == 1,
            "Stale source changed")
    require(sum(row["response_basis"] == "modelled" for row in rows["SP01_Documents_Interviews"]) == 1,
            "Modelled leadership observation changed")
    require(all(row["evidence_object_id"] in objects and "Not a transcribed client statement." in row["synthetic_answer"]
                for row in rows["SP01_Documents_Interviews"]),
            "Leadership material lost its evidence or synthetic basis")
    require(all(row["vendor_id"] in objects and row["business_function_id"] in objects
                for row in rows["SP11_AI_Usage_Models"]),
            "AI use case owner or supplier join is broken")
    benchmark = rows["SP21_External_Benchmarks"]
    require(len(benchmark) == 1 and benchmark[0]["provenance_class"] == "external_benchmark"
            and benchmark[0]["source_basis"] == "external_publication"
            and benchmark[0]["source_url"] == "https://www.cms.gov/files/document/2026-star-ratings-fact-sheet.pdf"
            and benchmark[0]["benchmark_value"] == "40"
            and benchmark[0]["comparability_state"] == "national_contract_distribution_not_directly_comparable_to_tenant_rating",
            "External benchmark lacks a primary source or comparability boundary")
    require(len({row["environment"] for row in rows["SP14_Deployments_Hosting"]}) >= 3,
            "Deployment environments are too uniform")
    require(len({row["platform_type"] for row in rows["SP05_Infrastructure"]}) >= 4,
            "Platform estate is too uniform")
    require(len({row["technology_name"] for row in rows["SP04_Data_BI_ETL"]}) >= 4,
            "Data technology estate is too uniform")
    app_share = money_share(apps, "annual_cost_usd")
    contract_share = money_share(contracts, "annualized_value_usd")
    require(0.25 <= app_share <= 0.75, "Application costs lack a believable long tail")
    require(0.25 <= contract_share <= 0.75, "Contract values lack a believable long tail")
    inbound = Counter(row["target_object_ref"] for row in flows)
    require(max(inbound.values()) >= 100, "Data-flow concentration point is missing")
    supplier_contracts = Counter(row["vendor_id"] for row in contracts)
    require(max(supplier_contracts.values()) >= 5, "Contract concentration point is missing")
    return {
        "dataset_id": manifest["dataset_id"],
        "assessment_id": manifest["assessment_id"],
        "source_set_hash": expected_hash,
        "source_file_count": len(files),
        "source_row_count": sum(len(family_rows) for family_rows in rows.values()),
        "object_count": len(objects),
        "relationship_count": len(manifest["relationships"]),
        "unresolved_edge_count": len(missing),
        "app_top_decile_cost_share": round(app_share, 3),
        "contract_top_decile_value_share": round(contract_share, 3),
        "max_flow_inbound": max(inbound.values()),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(validate(args.out_dir), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
