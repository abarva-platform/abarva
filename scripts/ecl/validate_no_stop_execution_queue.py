#!/usr/bin/env python3
"""Validate the ECL no-stop execution queue contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
QUEUE_PATH = ROOT / "docs/architecture/ecl-no-stop-execution-queue.json"
OUTPUT_DIR = ROOT / "outputs/ecl-no-stop-queue-validation"
SUMMARY_PATH = OUTPUT_DIR / "validation-summary.json"

REQUIRED_HARD_GATES = {
    "azure_data_plane_write",
    "database_migration",
    "active_tenant_replacement",
    "product_route_repointing",
    "browser_live_claim",
    "legacy_retirement",
}

REQUIRED_SLICE_FIELDS = {
    "order",
    "slice_id",
    "status",
    "percent_complete",
    "auto_proceed_allowed",
    "proof_command",
    "evidence_paths",
    "next_auto_action",
    "stop_gate",
}

VALID_STATUSES = {"queued", "in_progress", "done", "blocked_by_hard_gate"}


def load_queue() -> dict[str, Any]:
    if not QUEUE_PATH.exists():
        raise AssertionError(f"Missing queue manifest: {QUEUE_PATH.relative_to(ROOT)}")
    return json.loads(QUEUE_PATH.read_text())


def validate_queue(queue: dict[str, Any], *, check_evidence_paths: bool = True) -> dict[str, Any]:
    issues: list[str] = []

    hard_gates = queue.get("hard_stop_gates")
    if not isinstance(hard_gates, list):
        issues.append("hard_stop_gates must be a list")
        hard_gate_ids: set[str] = set()
    else:
        hard_gate_ids = {
            str(gate.get("gate_id"))
            for gate in hard_gates
            if isinstance(gate, dict) and gate.get("gate_id")
        }
        missing_gates = sorted(REQUIRED_HARD_GATES - hard_gate_ids)
        if missing_gates:
            issues.append(f"missing required hard_stop_gates: {', '.join(missing_gates)}")

    slices = queue.get("slices")
    if not isinstance(slices, list) or not slices:
        issues.append("slices must be a non-empty list")
        slices = []

    seen_orders: set[int] = set()
    seen_ids: set[str] = set()
    auto_allowed = 0
    blocked = 0
    queued_for_proof = 0
    evidence_checked = 0

    for index, item in enumerate(slices, start=1):
        if not isinstance(item, dict):
            issues.append(f"slice {index} must be an object")
            continue

        missing_fields = sorted(REQUIRED_SLICE_FIELDS - item.keys())
        if missing_fields:
            issues.append(f"slice {index} missing fields: {', '.join(missing_fields)}")
            continue

        order = item["order"]
        slice_id = str(item["slice_id"])
        status = str(item["status"])
        percent = item["percent_complete"]
        proof_command = str(item["proof_command"])
        evidence_paths = item["evidence_paths"]
        auto_proceed = bool(item["auto_proceed_allowed"])

        if not isinstance(order, int) or order < 1:
            issues.append(f"{slice_id}: order must be a positive integer")
        elif order in seen_orders:
            issues.append(f"{slice_id}: duplicate order {order}")
        else:
            seen_orders.add(order)

        if slice_id in seen_ids:
            issues.append(f"{slice_id}: duplicate slice_id")
        seen_ids.add(slice_id)

        if status not in VALID_STATUSES:
            issues.append(f"{slice_id}: invalid status {status}")

        if not isinstance(percent, int) or percent < 0 or percent > 100:
            issues.append(f"{slice_id}: percent_complete must be an integer from 0 to 100")

        if status == "blocked_by_hard_gate":
            blocked += 1
            if auto_proceed:
                issues.append(f"{slice_id}: blocked_by_hard_gate cannot auto proceed")
            if item["stop_gate"] not in hard_gate_ids:
                issues.append(f"{slice_id}: blocked slice stop_gate must name a hard gate")
            if proof_command:
                issues.append(f"{slice_id}: blocked slice should not declare a proof command")
        else:
            if auto_proceed:
                auto_allowed += 1
            else:
                queued_for_proof += 1
            if auto_proceed and not proof_command:
                issues.append(f"{slice_id}: non-blocked slice requires a proof_command")

        if not isinstance(evidence_paths, list):
            issues.append(f"{slice_id}: evidence_paths must be a list")
            continue

        for raw_path in evidence_paths:
            path = ROOT / str(raw_path)
            evidence_checked += 1
            if check_evidence_paths and not path.exists():
                issues.append(f"{slice_id}: missing evidence path {raw_path}")

    expected_orders = list(range(1, len(slices) + 1))
    if sorted(seen_orders) != expected_orders:
        issues.append(
            f"slice orders must be contiguous 1..{len(slices)}; got {sorted(seen_orders)}"
        )

    if auto_allowed == 0:
        issues.append("at least one slice must be auto_proceed_allowed")
    if blocked == 0:
        issues.append("at least one slice must explicitly demonstrate hard-gate blocking")

    return {
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "slice_count": len(slices),
        "auto_proceed_slice_count": auto_allowed,
        "blocked_slice_count": blocked,
        "queued_for_proof_command_count": queued_for_proof,
        "evidence_path_count": evidence_checked,
        "evidence_paths_checked": check_evidence_paths,
    }


def main() -> int:
    queue = load_queue()
    summary = validate_queue(queue)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
