#!/usr/bin/env python3

"""Validate the source Excel raw landing proof."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path


DEFAULT_OUT_DIR = Path("reports/source-excel-raw-landing-2026-08-23")
EXPECTED_WORKBOOK_COUNT = 14
EXPECTED_SOURCE_ROOM_MIN = 12
EXPECTED_TRACEABILITY_MIN = 1


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise AssertionError(f"Missing required file: {path}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    issues: list[str] = []

    summary_path = out_dir / "source_excel_raw_landing_summary.json"
    if not summary_path.exists():
        issues.append(f"missing summary: {summary_path}")
        summary = {}
    else:
        summary = json.loads(summary_path.read_text(encoding="utf-8"))

    workbook_rows = read_csv(out_dir / "source_excel_workbook_inventory.csv") if (out_dir / "source_excel_workbook_inventory.csv").exists() else []
    sheet_rows = read_csv(out_dir / "source_excel_sheet_inventory.csv") if (out_dir / "source_excel_sheet_inventory.csv").exists() else []
    gap_rows = read_csv(out_dir / "source_excel_gap_register.csv") if (out_dir / "source_excel_gap_register.csv").exists() else []
    source_rows = read_csv(out_dir / "source_room_inventory.csv") if (out_dir / "source_room_inventory.csv").exists() else []
    ledger_rows = read_csv(out_dir / "source_excel_ledger_inventory.csv") if (out_dir / "source_excel_ledger_inventory.csv").exists() else []

    if summary.get("landed_workbooks") != EXPECTED_WORKBOOK_COUNT:
        issues.append(f"landed_workbooks expected {EXPECTED_WORKBOOK_COUNT}, got {summary.get('landed_workbooks')}")
    if len(workbook_rows) != EXPECTED_WORKBOOK_COUNT:
        issues.append(f"workbook inventory rows expected {EXPECTED_WORKBOOK_COUNT}, got {len(workbook_rows)}")
    if summary.get("source_room_extracts", 0) < EXPECTED_SOURCE_ROOM_MIN:
        issues.append(f"source room extracts expected at least {EXPECTED_SOURCE_ROOM_MIN}, got {summary.get('source_room_extracts')}")
    if summary.get("traceability_rows", 0) < EXPECTED_TRACEABILITY_MIN:
        issues.append("traceability ledger has no rows")
    if summary.get("blocking_gaps", 0) != 0:
        issues.append(f"blocking_gaps expected 0, got {summary.get('blocking_gaps')}")

    if not sheet_rows:
        issues.append("sheet inventory is empty")
    if not source_rows:
        issues.append("source room inventory is empty")
    if not ledger_rows:
        issues.append("ledger inventory is empty")

    row_landing_path = Path(str(summary.get("raw_landing_row_jsonl", "")))
    if not row_landing_path.exists():
        issues.append(f"row landing JSONL missing: {row_landing_path}")
    else:
        line_count = sum(1 for _ in row_landing_path.open(encoding="utf-8"))
        if line_count != summary.get("workbook_declared_rows"):
            issues.append(f"row landing line count {line_count} != workbook_declared_rows {summary.get('workbook_declared_rows')}")

    blocking_gap_rows = [row for row in gap_rows if row.get("severity") == "blocker"]
    if blocking_gap_rows:
        issues.append(f"blocking rows present in gap register: {len(blocking_gap_rows)}")

    if issues:
        for issue in issues:
            print(f"FAIL: {issue}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "status": "pass",
                "workbooks": len(workbook_rows),
                "sheets": len(sheet_rows),
                "source_room_extracts": len(source_rows),
                "traceability_rows": summary.get("traceability_rows"),
                "declared_rows": summary.get("workbook_declared_rows"),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
