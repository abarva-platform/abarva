#!/usr/bin/env python3

"""Compare a dense ECL Azure readback export with the local proof contract.

This comparator does not connect to Azure. It consumes a read-only export
produced by a future independent reader and compares it row-for-row at the
table-count level against the local dense ECL proof contract. Field-hash reports
can be attached by the future reader; this script validates their presence when
declared.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PACKAGE_DIR = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23"
DEFAULT_CONTRACT = PACKAGE_DIR / "ecl_dense_azure_row_for_row_readback_contract.json"
DEFAULT_EXPORT_DIR = ROOT / "reports/ecl-dense-azure-readback-export-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-azure-readback-compare-2026-08-23"

COUNTS_FILE = "readback_counts.json"
FIELD_HASH_MISMATCH_FILE = "field_hash_mismatch_report.csv"
MISSING_ROWS_FILE = "missing_rows.csv"
EXTRA_ROWS_FILE = "extra_rows.csv"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def expected_counts(contract: dict[str, Any]) -> dict[str, dict[str, int]]:
    raw = contract.get("expected_readback_by_layer")
    if not isinstance(raw, dict) or not raw:
        raise SystemExit("Readback contract missing expected_readback_by_layer")
    result: dict[str, dict[str, int]] = {}
    for layer, rows in raw.items():
        if not isinstance(rows, dict):
            raise SystemExit(f"Readback contract layer {layer} must be an object")
        result[layer] = {}
        for table, value in rows.items():
            if isinstance(value, bool) or not isinstance(value, int):
                continue
            result[layer][table] = value
    return result


def write_sample_export(export_dir: Path, contract: dict[str, Any], *, negative: bool) -> Path:
    counts = expected_counts(contract)
    if negative:
        first_layer = sorted(counts)[0]
        first_table = sorted(counts[first_layer])[0]
        counts[first_layer][first_table] = counts[first_layer][first_table] + 1
    payload = {
        "actual_azure_execution": False,
        "actual_readback_execution": False,
        "data_mutation": False,
        "export_kind": "local_contract_sample_negative" if negative else "local_contract_sample_positive",
        "exported_at": now_iso(),
        "layers": counts,
        "source_contract": repo_relative(DEFAULT_CONTRACT),
    }
    export_dir.mkdir(parents=True, exist_ok=True)
    path = export_dir / COUNTS_FILE
    write_json(path, payload)
    for file_name in [FIELD_HASH_MISMATCH_FILE, MISSING_ROWS_FILE, EXTRA_ROWS_FILE]:
        (export_dir / file_name).write_text("layer,table,row_id,field,expected,actual\n", encoding="utf-8")
    return path


def flatten_counts(layers: dict[str, dict[str, int]]) -> dict[tuple[str, str], int]:
    result: dict[tuple[str, str], int] = {}
    for layer, tables in layers.items():
        for table, count in tables.items():
            result[(layer, table)] = count
    return result


def count_data_rows(path: Path) -> int:
    if not path.exists():
        return -1
    with path.open(newline="", encoding="utf-8") as handle:
        return max(0, sum(1 for _ in csv.DictReader(handle)))


def write_parity_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["layer", "table", "expected_count", "actual_count", "delta", "status"]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def compare(contract_path: Path, export_dir: Path, out_dir: Path) -> dict[str, Any]:
    issues: list[str] = []
    if not contract_path.exists():
        raise SystemExit(f"Missing readback contract: {repo_relative(contract_path)}")
    counts_path = export_dir / COUNTS_FILE
    if not counts_path.exists():
        raise SystemExit(f"Missing readback export counts: {repo_relative(counts_path)}")

    contract = read_json(contract_path)
    export = read_json(counts_path)
    if export.get("data_mutation") is True:
        issues.append("readback export must be read-only; data_mutation=true is refused")
    if export.get("actual_azure_execution") is True:
        issues.append("readback export must not be produced by an Azure mutating execution")

    expected = flatten_counts(expected_counts(contract))
    actual_layers = export.get("layers")
    if not isinstance(actual_layers, dict):
        raise SystemExit("Readback export missing layers object")
    actual = flatten_counts({
        layer: {table: int(count) for table, count in tables.items()}
        for layer, tables in actual_layers.items()
        if isinstance(tables, dict)
    })

    keys = sorted(set(expected) | set(actual))
    parity_rows: list[dict[str, Any]] = []
    for layer, table in keys:
        expected_count = expected.get((layer, table), 0)
        actual_count = actual.get((layer, table), 0)
        delta = actual_count - expected_count
        status = "pass" if delta == 0 else "mismatch"
        if status != "pass":
            issues.append(f"{layer}.{table} expected {expected_count}, got {actual_count}")
        parity_rows.append({
            "layer": layer,
            "table": table,
            "expected_count": expected_count,
            "actual_count": actual_count,
            "delta": delta,
            "status": status,
        })

    missing_rows = count_data_rows(export_dir / MISSING_ROWS_FILE)
    extra_rows = count_data_rows(export_dir / EXTRA_ROWS_FILE)
    field_hash_mismatches = count_data_rows(export_dir / FIELD_HASH_MISMATCH_FILE)
    if missing_rows > 0:
        issues.append(f"missing row report has {missing_rows} rows")
    if extra_rows > 0:
        issues.append(f"extra row report has {extra_rows} rows")
    if field_hash_mismatches > 0:
        issues.append(f"field hash mismatch report has {field_hash_mismatches} rows")
    if contract.get("field_hash_required") is True and field_hash_mismatches < 0:
        issues.append("field hash mismatch report is required and missing")

    out_dir.mkdir(parents=True, exist_ok=True)
    parity_path = out_dir / "row_count_parity.csv"
    write_parity_csv(parity_path, parity_rows)
    summary = {
        "accepted": not issues,
        "actual_azure_execution": False,
        "checked_at": now_iso(),
        "contract": repo_relative(contract_path),
        "export_counts": repo_relative(counts_path),
        "extra_row_report_rows": extra_rows,
        "field_hash_mismatch_rows": field_hash_mismatches,
        "issues": issues,
        "missing_row_report_rows": missing_rows,
        "row_count_parity": repo_relative(parity_path),
        "tables_compared": len(parity_rows),
    }
    write_json(out_dir / "readback_compare_summary.json", summary)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    parser.add_argument("--export-dir", type=Path, default=DEFAULT_EXPORT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--write-sample-export", action="store_true")
    parser.add_argument("--write-negative-sample-export", action="store_true")
    parser.add_argument("--expect-failure", action="store_true")
    args = parser.parse_args()

    contract_path = args.contract.resolve()
    export_dir = args.export_dir.resolve()
    out_dir = args.out_dir.resolve()
    if args.write_sample_export or args.write_negative_sample_export:
        write_sample_export(export_dir, read_json(contract_path), negative=args.write_negative_sample_export)
    summary = compare(contract_path, export_dir, out_dir)
    if args.expect_failure:
        expected_failed = not summary["accepted"]
        result = {
            "accepted": expected_failed,
            "expected_failed": True,
            "comparison_issues": summary["issues"],
        }
        write_json(out_dir / "readback_compare_expected_failure_summary.json", result)
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0 if expected_failed else 1
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
