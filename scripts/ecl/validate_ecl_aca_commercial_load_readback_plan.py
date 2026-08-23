#!/usr/bin/env python3
"""Validate the plan-only ACA commercial-load/readback slice."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-aca-commercial-load-readback-plan-2026-08-23"
EXPECTED_ORDER = [
    "build_aca_data_build_job_to_contract_no_data",
    "commercial_family_load_to_lab_preprod",
    "independent_commercial_row_for_row_readback",
    "dense_source_rooms_for_remaining_8_families",
    "full_local_validation_across_all_9_families",
    "reload_and_readback_all_9_families",
    "route_browser_qa_source_first",
]
REQUIRED_JOB_FIELDS = {
    "job_name",
    "runner",
    "wrapper",
    "tenant_scope",
    "build_version",
    "input_source_version",
    "idempotency_key",
    "required_image",
    "required_inputs",
    "required_outputs",
    "not_executed_in_this_pr",
}
FORBIDDEN_TRUE_BOUNDARIES = {
    "azure_mutation",
    "migration_apply",
    "active_tenant_promotion",
    "product_route_repointing",
    "deploy_or_traffic_shift",
    "browser_live_claim",
}


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise AssertionError(f"Missing required artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def rel(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def add_issue(issues: list[dict[str, str]], rule_id: str, artifact: str, detail: str) -> None:
    issues.append({"rule_id": rule_id, "artifact": artifact, "detail": detail})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    issues: list[dict[str, str]] = []

    artifacts: dict[str, dict[str, Any]] = {}
    for name, filename in {
        "contract": "aca_data_build_job_contract.json",
        "load": "commercial_family_lab_preprod_load_plan.json",
        "readback": "commercial_row_for_row_readback_plan.json",
        "queue": "execution_order_queue.json",
        "progress": "ecl_ordered_execution_progress.json",
    }.items():
        path = out_dir / filename
        try:
            artifacts[name] = read_json(path)
        except AssertionError as exc:
            add_issue(issues, "missing_artifact", rel(path), str(exc))
            artifacts[name] = {}

    contract = artifacts["contract"]
    missing_job_fields = sorted(REQUIRED_JOB_FIELDS - set(contract))
    for field in missing_job_fields:
        add_issue(issues, "missing_job_contract_field", "aca_data_build_job_contract.json", field)
    if contract.get("not_executed_in_this_pr") is not True:
        add_issue(issues, "job_execution_not_blocked", "aca_data_build_job_contract.json", "not_executed_in_this_pr must be true")
    if "digest" not in str(contract.get("required_image", "")).lower():
        add_issue(issues, "job_image_not_digest_pinned", "aca_data_build_job_contract.json", str(contract.get("required_image", "")))

    queue = artifacts["queue"]
    queue_steps = queue.get("steps", [])
    order = [step.get("name") for step in queue_steps]
    if order != EXPECTED_ORDER:
        add_issue(issues, "wrong_execution_order", "execution_order_queue.json", " -> ".join(order))
    for boundary in FORBIDDEN_TRUE_BOUNDARIES:
        if queue.get("hard_boundaries", {}).get(boundary) is not False:
            add_issue(issues, "hard_boundary_not_false", "execution_order_queue.json", boundary)

    load_plan = artifacts["load"]
    if load_plan.get("family") != "vendor_contract_commercial":
        add_issue(issues, "commercial_family_not_first_load", "commercial_family_lab_preprod_load_plan.json", str(load_plan.get("family")))
    if load_plan.get("write_allowed_in_this_pr") is not False:
        add_issue(issues, "write_allowed_in_plan_pr", "commercial_family_lab_preprod_load_plan.json", "write_allowed_in_this_pr must be false")
    if load_plan.get("first_gated_data_plane_action") is not True:
        add_issue(issues, "not_marked_first_gated_action", "commercial_family_lab_preprod_load_plan.json", "first_gated_data_plane_action must be true")

    readback = artifacts["readback"]
    if readback.get("comparison_type") != "row_for_row_against_local_commercial_proof":
        add_issue(issues, "readback_not_row_for_row", "commercial_row_for_row_readback_plan.json", str(readback.get("comparison_type")))
    if "independent" not in str(readback.get("reader", "")).lower():
        add_issue(issues, "readback_not_independent", "commercial_row_for_row_readback_plan.json", str(readback.get("reader")))

    progress = artifacts["progress"]
    if progress.get("execution_order") != EXPECTED_ORDER:
        add_issue(issues, "progress_order_mismatch", "ecl_ordered_execution_progress.json", "progress execution_order does not match expected order")
    dense_step = next((step for step in progress.get("steps", []) if step.get("step") == 4), {})
    if dense_step.get("percent_complete") != 0 or "deferred" not in str(dense_step.get("status", "")):
        add_issue(issues, "dense_step_not_deferred", "ecl_ordered_execution_progress.json", json.dumps(dense_step, sort_keys=True))

    dense_payloads = list((out_dir / "source_rooms").glob("*.csv")) if (out_dir / "source_rooms").exists() else []
    if dense_payloads:
        add_issue(issues, "dense_payload_present_in_commercial_first_slice", rel(out_dir / "source_rooms"), str(len(dense_payloads)))

    expected_counts = load_plan.get("expected_manifest", {}).get("local_commercial_proof_expected_counts", {})
    if int(expected_counts.get("source_records", 0)) <= 0 or int(expected_counts.get("contracts", 0)) <= 0:
        add_issue(issues, "missing_local_commercial_expected_counts", "commercial_family_lab_preprod_load_plan.json", json.dumps(expected_counts, sort_keys=True))

    summary = {
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "validated_artifacts": sorted(name for name, artifact in artifacts.items() if artifact),
        "expected_order": EXPECTED_ORDER,
        "hard_boundaries_preserved": not any(
            artifacts["queue"].get("hard_boundaries", {}).get(boundary) is not False
            for boundary in FORBIDDEN_TRUE_BOUNDARIES
        ),
    }
    summary_path = out_dir / "aca_commercial_plan_validation_summary.json"
    issue_path = out_dir / "aca_commercial_plan_validation_issues.csv"
    write_json(summary_path, summary)
    with issue_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["rule_id", "artifact", "detail"], lineterminator="\n")
        writer.writeheader()
        writer.writerows(issues)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
