#!/usr/bin/env python3

"""Validate ECL commercial lab/preprod load preflight outputs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("reports/ecl-commercial-lab-load-preflight-2026-08-23")
REQUIRED_FILES = {
    "command_plan": "ecl_commercial_lab_load_command_plan.json",
    "gate_template": "ecl_commercial_lab_load_gate_manifest.template.json",
    "gate_validation": "ecl_commercial_lab_load_gate_validation.json",
    "progress": "ecl_commercial_execution_progress.json",
    "readback_contract": "ecl_commercial_lab_load_readback_contract.json",
    "run_contract": "ecl_commercial_lab_load_run_contract.json",
    "status": "ecl_commercial_lab_load_status.json",
    "report": "PREFLIGHT_REPORT.md",
}
RUN_CONTRACT_FIELDS = [
    "job_name",
    "run_id",
    "tenant_scope",
    "build_version",
    "input_source_version",
    "idempotency_key",
    "expected_local_proof_hashes",
    "operator_identity",
    "git_sha",
    "image_digest",
    "status",
    "retry_count",
    "timeout_seconds",
    "progress_status_output",
    "blob_proof_bundle_location",
    "validation_output",
    "quality_gate_output",
    "release_record_link",
    "readback_contract",
]


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

    command_plan = read_json(paths["command_plan"])
    gate_template = read_json(paths["gate_template"])
    gate_validation = read_json(paths["gate_validation"])
    progress = read_json(paths["progress"])
    readback_contract = read_json(paths["readback_contract"])
    run_contract = read_json(paths["run_contract"])
    status = read_json(paths["status"])

    expect(command_plan.get("actual_azure_execution") is False, "command plan must not execute Azure", issues)
    expect(command_plan.get("az_invoked") is False, "command plan must record az_invoked=false", issues)
    expect(command_plan.get("command_was_executed") is False, "command plan must not be executed", issues)
    dry_run_command = command_plan.get("dry_run_selected_command", [])
    expect(isinstance(dry_run_command, list) and dry_run_command[:3] == ["npm", "run", "ops:aca-job"], "dry-run command must use ops:aca-job wrapper", issues)
    expect("--plan-only" in dry_run_command, "dry-run command must include --plan-only", issues)
    expect("az" not in dry_run_command, "dry-run command must not invoke az directly", issues)

    expect(gate_template.get("approved") is False, "committed gate template must not be approved", issues)
    expect(gate_template.get("approval_file_purpose") == "template_only_not_approval", "gate template must be explicitly not approval", issues)
    expect(gate_template.get("family") == "vendor_contract_commercial", "gate template family mismatch", issues)
    expect(isinstance(gate_template.get("expected_local_proof_hashes"), dict), "gate template must include expected local proof hashes", issues)
    expect(len(gate_template.get("expected_local_proof_hashes", {})) >= 10, "gate template must include local proof hash set", issues)
    expect(isinstance(gate_template.get("readback_contract"), dict), "gate template must include readback contract reference", issues)

    expect(gate_validation.get("actual_azure_execution") is False, "gate validation must not execute Azure", issues)
    expect(gate_validation.get("dry_run_allowed") is True, "default gate validation must allow dry-run", issues)
    expect(gate_validation.get("status") == "not_required_for_dry_run", "default gate validation status mismatch", issues)

    for field in RUN_CONTRACT_FIELDS:
        expect(field in run_contract, f"run contract missing field: {field}", issues)
    expect(run_contract.get("actual_azure_execution") is False, "run contract must not execute Azure", issues)
    expect(run_contract.get("mode") == "dry_run_plan_only", "default run contract must be dry_run_plan_only", issues)
    expect(str(run_contract.get("blob_proof_bundle_location", "")).startswith("blob://"), "run contract must emit future blob proof path", issues)
    expect(isinstance(run_contract.get("expected_local_proof_hashes"), dict), "run contract must include expected local proof hashes", issues)

    expect(readback_contract.get("actual_readback_execution") is False, "readback contract must not execute readback", issues)
    expect(readback_contract.get("comparison_type") == "row_for_row_against_local_commercial_proof", "readback comparison type mismatch", issues)
    expect(len(readback_contract.get("required_compare_keys", [])) > 0, "readback contract missing compare keys", issues)
    expect(len(readback_contract.get("required_outputs", [])) > 0, "readback contract missing required outputs", issues)

    expect(status.get("actual_azure_execution") is False, "status must record no Azure execution", issues)
    expect(any(event.get("name") == "command_plan_emitted_not_executed" for event in status.get("events", [])), "status missing command-plan event", issues)

    steps = {step.get("step"): step for step in progress.get("steps", [])}
    expect(progress.get("overall_percent_complete") == 29, "overall progress must be 29", issues)
    expect(steps.get(1, {}).get("percent_complete") == 90, "step 1 progress must be 90", issues)
    expect(steps.get(2, {}).get("percent_complete") == 45, "step 2 progress must be 45", issues)
    expect(steps.get(3, {}).get("percent_complete") == 35, "step 3 progress must be 35", issues)
    for step_number in [4, 5, 6, 7]:
        expect(steps.get(step_number, {}).get("percent_complete") == 0, f"step {step_number} must remain 0", issues)

    return issues


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    issues = validate(args.out_dir)
    summary = {
        "accepted": len(issues) == 0,
        "checked_out_dir": args.out_dir.as_posix(),
        "issues": issues,
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"ecl commercial lab load preflight validation failed: {exc}", file=sys.stderr)
        raise
