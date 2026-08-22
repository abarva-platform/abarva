#!/usr/bin/env python3

"""Write retained planted-failure artifacts for the commercial source-room validator."""

from __future__ import annotations

import argparse
import csv
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


DEFAULT_SOURCE_ROOM = Path(
    "outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_room/SP08_Vendor_Contract"
)
DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
VALIDATOR = Path("scripts/ecl/validate_commercial_source_room.py")


def mutate_first_row(path: Path, field: str, value: str) -> None:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        ordered_fields = reader.fieldnames or []
        rows = list(reader)
    if not rows:
        raise SystemExit(f"Cannot plant failure in empty file: {path}")
    if field not in ordered_fields:
        raise SystemExit(f"Cannot plant failure; missing field {field} in {path}")
    rows[0][field] = value
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=ordered_fields)
        writer.writeheader()
        writer.writerows(rows)


def run_case(source_room: Path, out_dir: Path, case_key: str, mutate_file: str, field: str, value: str) -> dict[str, object]:
    with tempfile.TemporaryDirectory(prefix=f"ecl-commercial-{case_key}-") as tmp:
        tmp_path = Path(tmp)
        case_room = tmp_path / "source_room"
        case_out = tmp_path / "validator_out"
        shutil.copytree(source_room, case_room)
        mutate_first_row(case_room / "extracts" / mutate_file, field, value)

        result = subprocess.run(
            [sys.executable, VALIDATOR.as_posix(), "--source-room", case_room.as_posix(), "--out-dir", case_out.as_posix()],
            text=True,
            capture_output=True,
            check=False,
        )
        bad_rows = case_out / "commercial_contract_supply_bad_rows.csv"
        summary = case_out / "commercial_contract_supply_validation_summary.json"
        if not bad_rows.exists() or not summary.exists():
            raise SystemExit(f"Validator did not emit retained artifacts for {case_key}: {result.stderr}")

        retained_bad_rows = out_dir / f"validator_planted_{case_key}_bad_rows.csv"
        retained_summary = out_dir / f"validator_planted_{case_key}_summary.json"
        shutil.copyfile(bad_rows, retained_bad_rows)
        shutil.copyfile(summary, retained_summary)
        summary_data = json.loads(retained_summary.read_text(encoding="utf-8"))
        return {
            "case_key": case_key,
            "mutated_file": mutate_file,
            "mutated_field": field,
            "mutated_value": value,
            "exit_status": result.returncode,
            "issue_count": summary_data.get("issue_count"),
            "issues_by_rule": summary_data.get("issues_by_rule", {}),
            "bad_rows_csv": retained_bad_rows.as_posix(),
            "summary_json": retained_summary.as_posix(),
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-room", type=Path, default=DEFAULT_SOURCE_ROOM)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    source_room = args.source_room.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    cases = [
        (
            "unknown_supplier",
            "source_ap_po_invoice_lines.csv",
            "supplier_id",
            "PLANTED-UNKNOWN-SUPPLIER",
        ),
        (
            "benchmark_service",
            "source_market_benchmark_rates.csv",
            "service_tower_id",
            "PLANTED-UNKNOWN-SERVICE-TOWER",
        ),
    ]
    results = [run_case(source_room, out_dir, *case) for case in cases]
    summary_path = out_dir / "validator_planted_failure_summary.json"
    summary_path.write_text(json.dumps({"cases": results}, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"summary": summary_path.as_posix(), "cases": results}, indent=2, sort_keys=True))

    failures = [case for case in results if case["exit_status"] == 0 or case["issue_count"] != 1]
    if failures:
        raise SystemExit(f"Unexpected planted-failure result: {failures}")


if __name__ == "__main__":
    main()
