#!/usr/bin/env python3
"""Validate the local-only ECL Azure load approval request packet."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-azure-load-approval-request-2026-08-23"
DEFAULT_SUMMARY = DEFAULT_OUT_DIR / "ecl_azure_load_approval_request_summary.json"
VALIDATION_SUMMARY = DEFAULT_OUT_DIR / "ecl_azure_load_approval_request_validation_summary.json"


def repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def issue(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def validate(summary_path: Path) -> dict[str, Any]:
    issues: list[str] = []
    if not summary_path.exists():
        return {"accepted": False, "issues": [f"missing summary: {repo_relative(summary_path)}"]}
    summary = read_json(summary_path)
    request_path = ROOT / summary.get("request", "")
    manifest_path = ROOT / summary.get("human_manifest_to_fill", "")
    report_path = ROOT / summary.get("report", "")
    for label, path in [
        ("request", request_path),
        ("human manifest", manifest_path),
        ("markdown report", report_path),
    ]:
        issue(path.exists(), f"missing {label}: {repo_relative(path)}", issues)
    if issues:
        return {"accepted": False, "issues": issues}

    request = read_json(request_path)
    manifest = read_json(manifest_path)
    report_text = report_path.read_text(encoding="utf-8")
    issue(summary.get("accepted") is True, "summary must be accepted", issues)
    issue(summary.get("actual_azure_execution") is False, "summary must prove no Azure execution", issues)
    issue(summary.get("approval_state") == "requested_not_approved", "summary must remain requested_not_approved", issues)
    issue(summary.get("next_action") == "human_gate_decision_required", "next action must be human gate decision", issues)

    issue(request.get("actual_azure_execution") is False, "request must prove no Azure execution", issues)
    issue(request.get("approval_state") == "requested_not_approved", "request must remain requested_not_approved", issues)
    issue(bool(request.get("idempotency_key")), "request idempotency key required", issues)
    issue(bool(request.get("proof_bundle_sha256")), "request proof bundle hash required", issues)
    issue(request.get("local_quality", {}).get("passed_denominators") == 8, "request must reflect 8 passed quality denominators", issues)
    issue(request.get("local_quality", {}).get("hard_gated_denominators") == 1, "request must reflect 1 hard-gated denominator", issues)

    issue(manifest.get("approval_file_purpose") == "human_operator_approval_to_fill", "manifest must be to-fill only", issues)
    issue(manifest.get("approved") is False, "manifest must not be approved", issues)
    issue(manifest.get("idempotency_key") == request.get("idempotency_key"), "manifest idempotency key mismatch", issues)
    issue(not manifest.get("digest_pinned_image"), "manifest digest image must be blank until human approval", issues)
    issue(not manifest.get("target_data_plane"), "manifest target data plane must be blank until human approval", issues)
    acknowledgements = manifest.get("acknowledgements", {})
    issue(isinstance(acknowledgements, dict) and acknowledgements, "manifest acknowledgements required", issues)
    if isinstance(acknowledgements, dict):
        true_acks = [key for key, value in acknowledgements.items() if value is True]
        issue(not true_acks, f"to-fill manifest must not pre-acknowledge: {', '.join(true_acks)}", issues)

    forbidden = {
        "actual_azure_execution\": true",
        "approved\": true",
        "command_was_executed\": true",
    }
    blob = json.dumps({"summary": summary, "request": request, "manifest": manifest}, sort_keys=True)
    for text in forbidden:
        issue(text not in blob, f"forbidden approval/execution marker found: {text}", issues)
    issue("Actual Azure execution: `false`" in report_text, "markdown report must state no Azure execution", issues)
    issue("This request packet is not an approval" in report_text, "markdown report must state request is not approval", issues)

    return {
        "accepted": not issues,
        "actual_azure_execution": False,
        "approval_state": summary.get("approval_state"),
        "issues": issues,
        "request_sha256": file_sha(request_path),
        "manifest_sha256": file_sha(manifest_path),
        "report_sha256": file_sha(report_path),
        "summary": repo_relative(summary_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", type=Path, default=DEFAULT_SUMMARY)
    parser.add_argument("--out", type=Path, default=VALIDATION_SUMMARY)
    args = parser.parse_args()
    result = validate(args.summary.resolve())
    write_json(args.out.resolve(), result)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
