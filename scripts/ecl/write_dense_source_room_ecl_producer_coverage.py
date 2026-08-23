#!/usr/bin/env python3

"""Write source-room-to-ECL producer coverage from the dense Layer 1 package.

This is a local proof/report only. It does not load Postgres, Azure, cubes,
projections, or product routes. Its job is to make the next loader work
countable: every ECL table is either source-supplied, partially source-supplied,
or explicitly downstream-builder required.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-source-room-producer-coverage-2026-08-23"
DDL_PATHS = [
    ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql",
]

CORE_SCHEMAS = {"ecl_source", "ecl_context", "ecl_commercial", "ecl_review"}
SOURCE_FAMILIES = [
    "SP01_Documents_Interviews",
    "SP02_HRIS",
    "SP03_CMDB",
    "SP04_Data_BI_ETL",
    "SP05_Infrastructure",
    "SP06_Finance_ERP",
    "SP07_PPM",
    "SP08_Vendor_Contract",
    "SP09_GRC",
    "SP10_KPI_Operations",
    "SP11_AI_Usage_Models",
    "SP12_Evidence_Room",
    "SP13_Data_Flows_Integrations",
    "SP14_Deployments_Hosting",
]

PRODUCER_MAP: dict[str, dict[str, Any]] = {
    "ecl_source.source_file": {
        "status": "source_supplied",
        "families": SOURCE_FAMILIES,
        "producer": "dense source-room manifest",
        "basis": "one source_file row per generated extract",
    },
    "ecl_source.source_record": {
        "status": "source_supplied",
        "families": SOURCE_FAMILIES,
        "producer": "dense source-room manifest and CSV rows",
        "basis": "one source_record row per source-room row",
    },
    "ecl_source.document": {
        "status": "source_supplied",
        "families": ["SP01_Documents_Interviews", "SP12_Evidence_Room"],
        "producer": "document/evidence source-room adapter",
        "basis": "interview notes, contract PDFs, attestations, and evidence artifacts",
    },
    "ecl_source.document_extraction": {
        "status": "source_supplied",
        "families": ["SP12_Evidence_Room"],
        "producer": "document extraction adapter",
        "basis": "page/span-backed evidence rows where available",
    },
    "ecl_context.object": {
        "status": "source_supplied",
        "families": ["SP02_HRIS", "SP03_CMDB", "SP04_Data_BI_ETL", "SP05_Infrastructure", "SP07_PPM", "SP08_Vendor_Contract", "SP09_GRC", "SP10_KPI_Operations", "SP11_AI_Usage_Models"],
        "producer": "canonical object adapters",
        "basis": "organizations, roles, applications, platforms, vendors, contracts, risks, metrics, AI tools, models, and use cases",
    },
    "ecl_context.relationship": {
        "status": "source_supplied",
        "families": ["SP03_CMDB", "SP07_PPM", "SP08_Vendor_Contract", "SP09_GRC", "SP13_Data_Flows_Integrations", "SP14_Deployments_Hosting"],
        "producer": "relationship adapters",
        "basis": "application-vendor, contract scope, program dependency, risk subject, data flow, and deployment-hosting references",
    },
    "ecl_context.metric_definition": {
        "status": "partial_source_supplied",
        "families": ["SP04_Data_BI_ETL", "SP08_Vendor_Contract", "SP10_KPI_Operations", "SP11_AI_Usage_Models"],
        "producer": "metric dictionary builder",
        "basis": "metric names and units exist in source rows; adapter must still emit governed definitions",
        "gap": "requires explicit metric-definition builder before measure load",
    },
    "ecl_context.measure": {
        "status": "source_supplied",
        "families": ["SP04_Data_BI_ETL", "SP06_Finance_ERP", "SP08_Vendor_Contract", "SP09_GRC", "SP10_KPI_Operations", "SP11_AI_Usage_Models"],
        "producer": "measure adapters",
        "basis": "spend, workload, KPI, AI usage, risk/control, commercial value, SLA, and benchmark measures",
    },
    "ecl_context.snapshot": {
        "status": "downstream_builder_required",
        "families": SOURCE_FAMILIES,
        "producer": "canonical snapshot builder",
        "basis": "derived from loaded canonical context, not directly from one source extract",
    },
    "ecl_context.context_pack": {
        "status": "downstream_builder_required",
        "families": SOURCE_FAMILIES,
        "producer": "context-pack builder",
        "basis": "derived from snapshot and retrieval packaging rules",
    },
    "ecl_commercial.contract": {
        "status": "source_supplied",
        "families": ["SP08_Vendor_Contract"],
        "producer": "contract-register adapter",
        "basis": "one contract row per contract/service tower segment",
    },
    "ecl_commercial.contract_service_line": {
        "status": "source_supplied",
        "families": ["SP08_Vendor_Contract"],
        "producer": "contract service-line adapter",
        "basis": "service tower and rate-card segment rows",
    },
    "ecl_commercial.contract_scope": {
        "status": "source_supplied",
        "families": ["SP08_Vendor_Contract", "SP13_Data_Flows_Integrations"],
        "producer": "contract scope adapter",
        "basis": "scoped application refs and integration/data-flow scope links",
    },
    "ecl_commercial.invoice_line": {
        "status": "source_supplied",
        "families": ["SP06_Finance_ERP", "SP08_Vendor_Contract"],
        "producer": "finance/AP adapter",
        "basis": "budget/actual allocation rows and commercial register value rows",
    },
    "ecl_commercial.sla_observation": {
        "status": "partial_source_supplied",
        "families": ["SP10_KPI_Operations", "SP12_Evidence_Room"],
        "producer": "SLA/KPI adapter",
        "basis": "KPI observations and SLA-report evidence artifacts exist; explicit SLA grain is still required",
        "gap": "requires SLA observation adapter that links KPI rows to contract/service line/scope",
    },
    "ecl_review.review_event": {
        "status": "partial_source_supplied",
        "families": ["SP01_Documents_Interviews", "SP12_Evidence_Room"],
        "producer": "review-event adapter",
        "basis": "interview follow-ups, owner attestations, and evidence verification states",
        "gap": "human workflow approvals remain unexecuted",
    },
}

PROJECTION_STATUS = {
    "status": "downstream_builder_required",
    "producer": "projection or cube builder",
    "basis": "derived from canonical snapshot; never loaded directly from Layer 1",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise AssertionError(f"Missing required CSV: {path}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def run_dense_generation(out_dir: Path) -> None:
    subprocess.run(
        [sys.executable, "scripts/ecl/generate_dense_source_room_extracts.py", "--out-dir", out_dir.as_posix()],
        cwd=ROOT,
        check=True,
    )
    subprocess.run(
        [sys.executable, "scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", out_dir.as_posix()],
        cwd=ROOT,
        check=True,
    )


def ecl_tables() -> list[str]:
    tables: set[str] = set()
    for ddl_path in DDL_PATHS:
        text = ddl_path.read_text(encoding="utf-8")
        tables.update(match.group(1) for match in re.finditer(r"create table if not exists\s+([a-z0-9_]+\.[a-z0-9_]+)", text, re.I))
    return sorted(tables)


def family_row_counts(manifest: list[dict[str, str]]) -> dict[str, int]:
    return {row["source_room_family"]: int(row["row_count"]) for row in manifest}


def build_rows(tables: list[str], counts: dict[str, int]) -> tuple[list[dict[str, Any]], list[str]]:
    issues: list[str] = []
    coverage_rows: list[dict[str, Any]] = []
    for table in tables:
        schema = table.split(".", 1)[0]
        spec = PRODUCER_MAP.get(table)
        if spec is None:
            if schema == "ecl_projection":
                spec = {**PROJECTION_STATUS, "families": SOURCE_FAMILIES, "gap": "requires canonical load, snapshot, and projection builder"}
            else:
                spec = {
                    "status": "missing_producer",
                    "families": [],
                    "producer": "",
                    "basis": "",
                    "gap": "no producer mapping declared",
                }
        families = list(spec.get("families", []))
        source_rows = sum(counts.get(family, 0) for family in families)
        status = spec["status"]
        if status == "missing_producer" and schema in CORE_SCHEMAS:
            issues.append(f"{table} has no core producer mapping")
        coverage_rows.append(
            {
                "ecl_table": table,
                "layer_kind": "source_or_canonical" if schema in CORE_SCHEMAS else "projection_or_cube",
                "producer_status": status,
                "source_room_families": ";".join(families),
                "available_source_rows": source_rows,
                "producer": spec.get("producer", ""),
                "mapping_basis": spec.get("basis", ""),
                "remaining_gap": spec.get("gap", ""),
                "next_loader_action": "build_adapter_and_load" if status in {"source_supplied", "partial_source_supplied"} else "run_downstream_builder_after_canonical_load",
            }
        )
    mapped_families = {family for row in coverage_rows for family in row["source_room_families"].split(";") if family}
    for family in SOURCE_FAMILIES:
        if family not in mapped_families:
            issues.append(f"{family} is not mapped to any ECL table")
    return coverage_rows, issues


def build_markdown(summary: dict[str, Any], rows: list[dict[str, Any]]) -> str:
    lines = [
        "# Dense Source Room to ECL Producer Coverage",
        "",
        "This is a local coverage proof. It confirms which source-room families can feed each ECL table and which tables require downstream builders after canonical load. It does not load Azure, rebuild cubes, or prove product routes.",
        "",
        "## Summary",
        "",
        f"- ECL tables inventoried: {summary['table_count']}",
        f"- Source families: {summary['source_family_count']}",
        f"- Dense source rows: {summary['dense_source_rows']}",
        f"- Source-supplied tables: {summary['source_supplied_tables']}",
        f"- Partial source-supplied tables: {summary['partial_source_supplied_tables']}",
        f"- Downstream-builder tables: {summary['downstream_builder_required_tables']}",
        f"- Missing core producers: {summary['missing_core_producer_count']}",
        "",
        "## Table Coverage",
        "",
        "| ECL table | Status | Families | Rows | Remaining gap |",
        "|---|---|---|---:|---|",
    ]
    for row in rows:
        lines.append(
            f"| `{row['ecl_table']}` | `{row['producer_status']}` | `{row['source_room_families']}` | {row['available_source_rows']} | {row['remaining_gap']} |"
        )
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "- `source_supplied` means dense Layer 1 rows exist and a local adapter can load the table.",
            "- `partial_source_supplied` means dense rows exist, but the adapter must add a governed dictionary, SLA grain, or human review semantics before the table is complete.",
            "- `downstream_builder_required` means the table is not directly sourced from Layer 1. It must be rebuilt from canonical load outputs.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dense-out-dir", type=Path, default=DEFAULT_DENSE_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--generate", action="store_true", help="Generate and validate the dense source-room package before reporting.")
    args = parser.parse_args()

    dense_out_dir = args.dense_out_dir.resolve()
    out_dir = args.out_dir.resolve()
    if args.generate:
        run_dense_generation(dense_out_dir)

    manifest = read_csv(dense_out_dir / "dense_source_room_manifest.csv")
    counts = family_row_counts(manifest)
    tables = ecl_tables()
    rows, issues = build_rows(tables, counts)

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dense_out_dir": dense_out_dir.as_posix(),
        "table_count": len(tables),
        "source_family_count": len(counts),
        "dense_source_rows": sum(counts.values()),
        "source_supplied_tables": sum(1 for row in rows if row["producer_status"] == "source_supplied"),
        "partial_source_supplied_tables": sum(1 for row in rows if row["producer_status"] == "partial_source_supplied"),
        "downstream_builder_required_tables": sum(1 for row in rows if row["producer_status"] == "downstream_builder_required"),
        "missing_core_producer_count": len(issues),
        "issues": issues,
    }
    write_json(out_dir / "ecl_source_room_producer_coverage_summary.json", summary)
    write_csv(
        out_dir / "ecl_source_room_producer_coverage.csv",
        rows,
        [
            "ecl_table",
            "layer_kind",
            "producer_status",
            "source_room_families",
            "available_source_rows",
            "producer",
            "mapping_basis",
            "remaining_gap",
            "next_loader_action",
        ],
    )
    (out_dir / "ECL_SOURCE_ROOM_PRODUCER_COVERAGE.md").write_text(build_markdown(summary, rows), encoding="utf-8")
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
