#!/usr/bin/env python3
"""Validate the no-stop runner's operator status artifact."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STATUS_PATH = ROOT / "outputs/ecl-no-stop-execution-run/operator-status.json"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-no-stop-execution-run"
SUMMARY_PATH = DEFAULT_OUT_DIR / "operator-status-validation-summary.json"
ISSUES_PATH = DEFAULT_OUT_DIR / "operator-status-validation-issues.csv"


REQUIRED_EVIDENCE_KEYS = {
    "execution_summary",
    "execution_status",
    "event_log",
    "operator_status_json",
    "operator_status_markdown",
}

ALLOWED_NEXT_BLOCKED_GATES = {
    "azure_data_plane_write",
    "product_route_repointing",
    "legacy_retirement",
}

REQUIRED_COMPLETED_BLOCKED_GATES = {
    "azure_data_plane_write",
    "product_route_repointing",
    "legacy_retirement",
}

REQUIRED_QUALITY_AREAS = {
    "raw_14_workbook_coverage",
    "dense_realistic_source_room_families",
    "application_realism_gates",
    "ecl_table_producer_coverage",
    "local_layer_readback_chain",
    "azure_load_gate_package",
    "azure_readback_comparator",
    "runtime_and_browser_hard_gates",
}


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_issues(path: Path, issues: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["issue"]
    lines.extend(f'"{issue.replace(chr(34), chr(34) + chr(34))}"' for issue in issues)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def validate_status(status: dict[str, Any], *, allow_in_progress: bool) -> dict[str, Any]:
    issues: list[str] = []
    progress = status.get("progress")
    next_item = status.get("next")
    evidence = status.get("evidence")
    slices = status.get("slices")
    checkpoints = status.get("checkpoints")
    quality_denominators = status.get("quality_denominators")

    if status.get("run_state") not in {"running", "completed"}:
        issues.append("run_state must be running or completed")
    if status.get("run_state") == "running" and not allow_in_progress:
        issues.append("operator status is still running; final validation requires completed")

    if not isinstance(progress, dict):
        issues.append("progress must be an object")
        progress = {}
    total_executable = progress.get("total_executable_slices")
    passed_executable = progress.get("passed_executable_slices")
    completion_percent = progress.get("completion_percent")
    if not isinstance(total_executable, int) or total_executable < 1:
        issues.append("progress.total_executable_slices must be a positive integer")
    if not isinstance(passed_executable, int) or passed_executable < 0:
        issues.append("progress.passed_executable_slices must be a non-negative integer")
    if not isinstance(completion_percent, int) or completion_percent < 0 or completion_percent > 100:
        issues.append("progress.completion_percent must be 0..100")
    elif status.get("run_state") == "completed" and completion_percent != 100:
        issues.append("completed operator status must report 100 percent")
    elif status.get("run_state") == "running" and completion_percent < 75:
        issues.append("in-progress operator status validation should run after at least 75 percent")

    if not isinstance(checkpoints, list) or not checkpoints:
        issues.append("checkpoints must be a non-empty list")
        checkpoint_values: set[int] = set()
    else:
        checkpoint_values = {
            int(item.get("checkpoint_percent"))
            for item in checkpoints
            if isinstance(item, dict) and isinstance(item.get("checkpoint_percent"), int)
        }
        required = {0, 15, 30, 45, 60, 75}
        if status.get("run_state") == "completed":
            required.update({90, 100})
        missing = sorted(required - checkpoint_values)
        if missing:
            issues.append(f"missing checkpoint events: {', '.join(map(str, missing))}")

    if not isinstance(next_item, dict):
        issues.append("next must be an object")
        next_item = {}
    if not next_item.get("operator_instruction"):
        issues.append("next.operator_instruction is required")
    if not next_item.get("blocked_gate"):
        issues.append("next.blocked_gate is required so the operator sees the hard stop")
    elif next_item.get("blocked_gate") not in ALLOWED_NEXT_BLOCKED_GATES:
        issues.append(
            "next.blocked_gate must be one of: "
            + ", ".join(sorted(ALLOWED_NEXT_BLOCKED_GATES))
        )

    if not isinstance(evidence, dict):
        issues.append("evidence must be an object")
        evidence = {}
    missing_evidence = sorted(REQUIRED_EVIDENCE_KEYS - set(evidence))
    if missing_evidence:
        issues.append(f"missing evidence keys: {', '.join(missing_evidence)}")

    if not isinstance(slices, list) or not slices:
        issues.append("slices must be a non-empty list")
        slices = []
    blocked_slices = [item for item in slices if item.get("result_state") == "hard_gated"]
    if not blocked_slices and status.get("run_state") == "completed":
        issues.append("completed status must include at least one hard_gated slice")
    if status.get("run_state") == "completed":
        blocked_gates = {str(item.get("stop_gate")) for item in blocked_slices}
        missing_gates = sorted(REQUIRED_COMPLETED_BLOCKED_GATES - blocked_gates)
        if missing_gates:
            issues.append(f"completed status missing hard-gated stop gates: {', '.join(missing_gates)}")
    if not any(item.get("evidence_paths") for item in slices):
        issues.append("slice rows must carry evidence_paths")

    if not isinstance(quality_denominators, list) or not quality_denominators:
        issues.append("quality_denominators must be a non-empty list")
        quality_denominators = []
    quality_by_area = {
        item.get("area"): item
        for item in quality_denominators
        if isinstance(item, dict)
    }
    missing_quality = sorted(REQUIRED_QUALITY_AREAS - set(quality_by_area))
    if missing_quality:
        issues.append(f"missing quality denominator areas: {', '.join(missing_quality)}")
    for area, item in quality_by_area.items():
        if item.get("status") not in {"pass", "pending", "hard_gated"}:
            issues.append(f"{area}: quality status must be pass, pending, or hard_gated")
        if not isinstance(item.get("passed"), int) or not isinstance(item.get("total"), int):
            issues.append(f"{area}: passed and total must be integers")
        elif item["passed"] < 0 or item["total"] < 0 or item["passed"] > item["total"]:
            issues.append(f"{area}: passed/total values are invalid")
        if not item.get("evidence_path"):
            issues.append(f"{area}: evidence_path is required")

    app_realism = quality_by_area.get("application_realism_gates", {})
    if app_realism and app_realism.get("status") != "pass":
        issues.append("application_realism_gates must pass before operator status is accepted")
    app_notes = app_realism.get("notes") if isinstance(app_realism, dict) else {}
    gate_results = app_notes.get("gate_results") if isinstance(app_notes, dict) else {}
    if isinstance(gate_results, dict):
        failed_gates = sorted(key for key, value in gate_results.items() if not value)
        if failed_gates:
            issues.append(f"application realism failed gates: {', '.join(failed_gates)}")
    else:
        issues.append("application_realism_gates.notes.gate_results is required")

    local_chain = quality_by_area.get("local_layer_readback_chain", {})
    if status.get("run_state") == "completed" and local_chain.get("status") != "pass":
        issues.append("completed operator status requires local_layer_readback_chain pass")

    return {
        "accepted": not issues,
        "issue_count": len(issues),
        "issues": issues,
        "allow_in_progress": allow_in_progress,
        "run_state": status.get("run_state"),
        "completion_percent": completion_percent,
        "checkpoint_count": len(checkpoints) if isinstance(checkpoints, list) else 0,
        "slice_count": len(slices),
        "quality_denominator_count": len(quality_denominators),
        "blocked_gate": next_item.get("blocked_gate"),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--status", type=Path, default=DEFAULT_STATUS_PATH)
    parser.add_argument("--allow-in-progress", action="store_true")
    args = parser.parse_args()

    status_path = args.status.resolve()
    if not status_path.exists():
        print(f"Missing operator status report: {status_path}", file=sys.stderr)
        return 1

    summary = validate_status(read_json(status_path), allow_in_progress=args.allow_in_progress)
    DEFAULT_OUT_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    write_issues(ISSUES_PATH, summary["issues"])
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
