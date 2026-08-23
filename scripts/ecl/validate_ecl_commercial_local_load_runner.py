#!/usr/bin/env python3

"""Validate ECL commercial local load-runner outputs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("reports/ecl-commercial-local-load-runner-2026-08-23")
REQUIRED_FILES = {
    "status": "ecl_commercial_local_load_status.json",
    "row_counts": "ecl_commercial_local_load_row_counts.json",
    "validation": "ecl_commercial_local_load_validation_summary.json",
    "progress": "ecl_commercial_execution_progress.json",
    "report": "LOCAL_LOAD_RUNNER_REPORT.md",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def expect(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def validate(out_dir: Path) -> list[str]:
    issues: list[str] = []
    paths = {name: out_dir / rel_path for name, rel_path in REQUIRED_FILES.items()}
    for name, path in paths.items():
        expect(path.exists(), f"missing {name}: {path.as_posix()}", issues)
    if issues:
        return issues

    status = read_json(paths["status"])
    row_counts = read_json(paths["row_counts"])
    validation = read_json(paths["validation"])
    progress = read_json(paths["progress"])

    expect(status.get("accepted") is True, "status must be accepted", issues)
    expect(status.get("actual_azure_execution") is False, "status must prove no Azure execution", issues)
    expect(status.get("actual_shared_data_plane_mutation") is False, "status must prove no shared mutation", issues)
    expect(status.get("status") == "local_load_succeeded", "status must be local_load_succeeded", issues)
    expect(status.get("target_classification") in {"local_disposable", "lab", "preprod", "client_preprod"}, "target classification must be allowed", issues)

    expect(row_counts.get("commercial_metric_rows", 0) > 0, "row counts must include commercial metric rows", issues)
    expect(row_counts.get("numeric_metric_rows", 0) > 0, "row counts must include numeric rows", issues)
    expect(row_counts.get("gap_record_rows", 0) > 0, "row counts must include gap records", issues)

    expect(validation.get("accepted") is True, "validation summary must be accepted", issues)
    check_statuses = {check.get("name"): check.get("status") for check in validation.get("checks", [])}
    for required in [
        "gate_contract_present",
        "tenant_family_match",
        "local_proof_hashes_match",
        "idempotency_key_present",
        "readback_contract_present",
        "target_classification_allowed",
        "gaps_preserved_as_null",
    ]:
        expect(check_statuses.get(required) == "pass", f"missing/pass check: {required}", issues)

    steps = {step.get("step"): step for step in progress.get("steps", [])}
    expect(progress.get("overall_percent_complete") == 35, "overall progress must be 35", issues)
    expect(steps.get(1, {}).get("percent_complete") == 95, "step 1 progress must be 95", issues)
    expect(steps.get(2, {}).get("percent_complete") == 65, "step 2 progress must be 65", issues)
    expect(steps.get(3, {}).get("percent_complete") == 40, "step 3 progress must be 40", issues)
    for step_number in [4, 5, 6, 7]:
        expect(steps.get(step_number, {}).get("percent_complete") == 0, f"step {step_number} must remain 0", issues)

    return issues


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    issues = validate(args.out_dir)
    print(json.dumps({"accepted": not issues, "checked_out_dir": args.out_dir.as_posix(), "issues": issues}, indent=2, sort_keys=True))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"ecl commercial local load-runner validation failed: {exc}", file=sys.stderr)
        raise
