#!/usr/bin/env python3

"""Validate ECL commercial-family local load runner outputs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("reports/ecl-commercial-family-local-load-2026-08-23")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def expect(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def validate_dry_run(out_dir: Path) -> list[str]:
    issues: list[str] = []
    status_path = out_dir / "ecl_commercial_family_load_runner_status.json"
    progress_path = out_dir / "ecl_commercial_execution_progress.json"
    report_path = out_dir / "LOCAL_LOAD_RUNNER_REPORT.md"
    for path in [status_path, progress_path, report_path]:
        expect(path.exists(), f"missing required dry-run output: {path.as_posix()}", issues)
    if issues:
        return issues

    status = read_json(status_path)
    progress = read_json(progress_path)
    expect(status.get("accepted") is True, "status must be accepted", issues)
    expect(status.get("actual_azure_execution") is False, "status must record no Azure execution", issues)
    expect(status.get("actual_database_write") is False, "dry-run status must record no database write", issues)
    expect(status.get("family") == "vendor_contract_commercial", "status family mismatch", issues)
    expect(status.get("tenant_key") == "meridian-health", "status tenant mismatch", issues)
    expect(status.get("status") == "runner_ready_execute_requires_gate_and_safe_target", "dry-run status mismatch", issues)
    expect(isinstance(status.get("readback_expected_counts"), dict), "status must include expected readback counts", issues)
    expect(status.get("readback_expected_counts", {}).get("contracts") == 5, "dry-run expected contract count mismatch", issues)
    expect(progress.get("overall_percent_complete") == 34, "overall progress must be 34", issues)
    steps = {step.get("step"): step for step in progress.get("steps", [])}
    expect(steps.get(1, {}).get("percent_complete") == 95, "step 1 progress must be 95", issues)
    expect(steps.get(2, {}).get("percent_complete") == 60, "step 2 progress must be 60", issues)
    expect(steps.get(3, {}).get("percent_complete") == 40, "step 3 progress must be 40", issues)
    for step_number in [4, 5, 6, 7]:
        expect(steps.get(step_number, {}).get("percent_complete") == 0, f"step {step_number} must remain 0", issues)
    return issues


def validate_execute(out_dir: Path) -> list[str]:
    issues: list[str] = []
    status_path = out_dir / "ecl_commercial_family_load_runner_status.json"
    readback_path = out_dir / "ecl_commercial_family_load_readback.json"
    for path in [status_path, readback_path]:
        expect(path.exists(), f"missing required execute output: {path.as_posix()}", issues)
    if issues:
        return issues

    status = read_json(status_path)
    readback = read_json(readback_path)
    expect(status.get("actual_azure_execution") is False, "execute status must record no Azure execution", issues)
    expect(status.get("actual_database_write") is True, "execute status must record a database write", issues)
    expect(status.get("family") == "vendor_contract_commercial", "execute status family mismatch", issues)
    expect(status.get("tenant_key") == "meridian-health", "execute status tenant mismatch", issues)
    expect(readback.get("accepted") is True, "readback must be accepted", issues)
    expect(readback.get("target_environment") in {"local_disposable", "lab_preprod"}, "target environment mismatch", issues)
    expect(readback.get("idempotent_run_count", 0) >= 1, "idempotent run count must be present", issues)
    parity = readback.get("parity", {})
    expect(parity.get("contracts", {}).get("actual") == 5, "contract readback count mismatch", issues)
    expect(all(item.get("match") is True for item in parity.values()), "all readback parity rows must match", issues)
    quality = readback.get("quality", {})
    expect(quality.get("gap_flagged_contract_rows", 0) > 0, "gap flags must be present", issues)
    expect(quality.get("gated_value_levers_with_blocked_value", 0) > 0, "blocked value gates must be present", issues)
    expect(quality.get("unknown_zero_measure_rows") == 0, "unknown values must not be encoded as zero", issues)
    expect(quality.get("zero_invoice_lines_without_reason") == 0, "zero invoice lines must have reasons", issues)
    return issues


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--mode", choices=["dry-run", "execute"], default="dry-run")
    args = parser.parse_args()

    issues = validate_dry_run(args.out_dir) if args.mode == "dry-run" else validate_execute(args.out_dir)
    print(
        json.dumps(
            {
                "accepted": len(issues) == 0,
                "checked_out_dir": args.out_dir.as_posix(),
                "issues": issues,
                "mode": args.mode,
            },
            indent=2,
            sort_keys=True,
        )
    )
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"ecl commercial family local load validation failed: {exc}", file=sys.stderr)
        raise
