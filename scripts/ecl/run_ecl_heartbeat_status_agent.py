#!/usr/bin/env python3
"""Advance the ECL heartbeat lane by the next eligible local-safe action.

The heartbeat agent is intentionally conservative: it may run local proof and
gate-readiness commands, refresh operator status, and emit a concise machine
readable report. It must not execute Azure data-plane work, repoint product
routes, deploy traffic, or retire legacy assets.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
NO_STOP_OUT_DIR = ROOT / "outputs/ecl-no-stop-execution-run"
HEARTBEAT_OUT_DIR = ROOT / "outputs/ecl-heartbeat-status-agent"
QUEUE_PATH = ROOT / "docs/architecture/ecl-no-stop-execution-queue.json"
QUEUE_SUMMARY_PATH = NO_STOP_OUT_DIR / "execution-summary.json"
QUEUE_EVENT_PATH = NO_STOP_OUT_DIR / "execution-events.jsonl"
OPERATOR_STATUS_PATH = NO_STOP_OUT_DIR / "operator-status.json"
POST_QUEUE_SUMMARY_PATH = (
    ROOT
    / "reports/ecl-dense-azure-load-gate-package-2026-08-23/ecl_dense_azure_gate_local_proof_summary.json"
)
OPERATOR_VALIDATION_PATH = NO_STOP_OUT_DIR / "operator-status-validation-summary.json"
APPROVAL_REQUEST_SUMMARY_PATH = (
    ROOT
    / "reports/ecl-azure-load-approval-request-2026-08-23/ecl_azure_load_approval_request_summary.json"
)
APPROVAL_REQUEST_VALIDATION_PATH = (
    ROOT
    / "reports/ecl-azure-load-approval-request-2026-08-23/ecl_azure_load_approval_request_validation_summary.json"
)
PRODUCT_BROWSER_QA_SUMMARY_PATH = (
    ROOT / "reports/ecl-product-browser-qa-gate-package-2026-08-23/ecl_product_browser_qa_gate_summary.json"
)

PROHIBITED_EXECUTABLES = {"az", "docker", "kubectl", "psql", "supabase"}
MIN_ACTUAL_READBACK_TABLES = 24
ACTUAL_READBACK_COMPARE_ENV = "ECL_ACA_READBACK_COMPARE_PATH"
ACTUAL_READBACK_EXPORT_SUMMARY_ENV = "ECL_ACA_READBACK_EXPORT_SUMMARY_PATH"
QUALITY_ZERO_CHECKS = (
    "relationship_endpoint_drift",
    "cube_metric_drift",
    "cube_measure_drift",
    "source_value_claimable_rows",
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def repo_or_absolute(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def newest_existing(paths: list[Path]) -> Path | None:
    existing = [path for path in paths if path.exists()]
    if not existing:
        return None
    return max(existing, key=lambda path: (path.stat().st_mtime_ns, path.as_posix()))


def discover_json_path(*, env_var: str, patterns: tuple[str, ...]) -> Path | None:
    env_value = os.environ.get(env_var)
    if env_value:
        env_path = Path(env_value).expanduser()
        if env_path.exists():
            return env_path

    search_roots = [
        ROOT,
        ROOT.parent / "ecl-aca-execute",
    ]
    candidates: list[Path] = []
    for search_root in search_roots:
        for pattern in patterns:
            candidates.extend(search_root.glob(pattern))
    return newest_existing(candidates)


def command_name(command: list[str]) -> str:
    return Path(command[0]).name if command else ""


def assert_command_allowed(command: list[str]) -> None:
    executable = command_name(command)
    if executable in PROHIBITED_EXECUTABLES:
        raise AssertionError(f"heartbeat agent cannot run prohibited executable: {executable}")
    if executable not in {"python3", "npm", "node"}:
        raise AssertionError(f"heartbeat agent cannot run unsupported executable: {executable}")


def run_step(name: str, command: list[str], out_dir: Path, *, execute: bool) -> dict[str, Any]:
    assert_command_allowed(command)
    started_at = now_iso()
    log_path = out_dir / "logs" / f"{name}.log"
    result: dict[str, Any] = {
        "name": name,
        "command": command,
        "started_at": started_at,
        "log_path": log_path.relative_to(ROOT).as_posix(),
        "executed": execute,
    }
    if not execute:
        result.update({"completed_at": now_iso(), "exit_code": 0, "status": "planned"})
        return result

    env = os.environ.copy()
    env.setdefault("LANG", "C.UTF-8")
    env.setdefault("LC_ALL", "C.UTF-8")
    completed = subprocess.run(
        command,
        cwd=ROOT,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(completed.stdout, encoding="utf-8")
    result.update(
        {
            "completed_at": now_iso(),
            "exit_code": completed.returncode,
            "status": "pass" if completed.returncode == 0 else "fail",
        }
    )
    return result


def queue_summary_accepted() -> bool:
    summary = read_json(QUEUE_SUMMARY_PATH)
    return bool(summary.get("accepted")) and int(summary.get("passed_executable_slice_count", 0) or 0) >= 12


def post_queue_summary_accepted() -> bool:
    summary = read_json(POST_QUEUE_SUMMARY_PATH)
    return (
        bool(summary.get("accepted"))
        and summary.get("actual_azure_execution") is False
        and summary.get("command_was_executed") is False
    )


def operator_validation_accepted() -> bool:
    summary = read_json(OPERATOR_VALIDATION_PATH)
    return bool(summary.get("accepted")) and summary.get("blocked_gate") == "azure_data_plane_write"


def approval_request_accepted() -> bool:
    summary = read_json(APPROVAL_REQUEST_SUMMARY_PATH)
    validation = read_json(APPROVAL_REQUEST_VALIDATION_PATH)
    return (
        bool(summary.get("accepted"))
        and summary.get("actual_azure_execution") is False
        and summary.get("approval_state") == "requested_not_approved"
        and bool(validation.get("accepted"))
        and validation.get("actual_azure_execution") is False
    )


def actual_readback_proof() -> dict[str, Any]:
    compare_path = discover_json_path(
        env_var=ACTUAL_READBACK_COMPARE_ENV,
        patterns=("reports/ecl-dense-aca-readback-direct-compare-*/readback_direct_compare_summary.json",),
    )
    export_summary_path = discover_json_path(
        env_var=ACTUAL_READBACK_EXPORT_SUMMARY_ENV,
        patterns=(
            "reports/ecl-dense-aca-job-readback-*/proof/ecl-dense-all-layer-readback/ecl_dense_all_layer_readback_export_summary.json",
        ),
    )
    compare = read_json(compare_path) if compare_path else {}
    export_summary = read_json(export_summary_path) if export_summary_path else {}
    quality_zero = compare.get("quality_zero_checks", {})
    issues: list[str] = []

    if not compare_path:
        issues.append("missing actual ACA direct readback compare summary")
    if not export_summary_path:
        issues.append("missing actual ACA readback export summary")
    if compare.get("accepted") is not True:
        issues.append("direct readback compare is not accepted")
    if compare.get("issues") not in ([], None):
        issues.append("direct readback compare has issues")
    if int(compare.get("tables_compared", 0) or 0) < MIN_ACTUAL_READBACK_TABLES:
        issues.append("direct readback compare table count is below the ECL minimum")
    for check in QUALITY_ZERO_CHECKS:
        if quality_zero.get(check) != 0:
            issues.append(f"{check} is not zero in direct readback compare")
    if export_summary.get("accepted") is not True:
        issues.append("readback export summary is not accepted")
    if export_summary.get("status") != "pass":
        issues.append("readback export summary status is not pass")
    if export_summary.get("issues") not in ([], None):
        issues.append("readback export summary has issues")
    if export_summary.get("actual_target_database_mutation") is not False:
        issues.append("readback proof must be read-only")

    return {
        "accepted": not issues,
        "issues": issues,
        "compare_path": repo_or_absolute(compare_path) if compare_path else None,
        "export_summary_path": repo_or_absolute(export_summary_path) if export_summary_path else None,
        "run_id": export_summary.get("run_id"),
        "tables_compared": compare.get("tables_compared"),
        "quality_zero_checks": quality_zero,
        "target_classification": export_summary.get("target_classification"),
        "tenant_key": export_summary.get("tenant_key"),
    }


def actual_readback_accepted() -> bool:
    return bool(actual_readback_proof().get("accepted"))


def product_browser_qa_gate_accepted() -> bool:
    summary = read_json(PRODUCT_BROWSER_QA_SUMMARY_PATH)
    return bool(summary.get("accepted")) and summary.get("status") == "ready_for_future_browser_gate_review"


def refresh_operator_status() -> dict[str, Any]:
    """Rebuild operator status so post-queue artifacts are reflected."""

    sys.path.insert(0, str(ROOT / "scripts/ecl"))
    import run_no_stop_execution_queue as queue_runner  # pylint: disable=import-error,import-outside-toplevel

    queue = queue_runner.read_json(QUEUE_PATH)
    summary = queue_runner.read_json(QUEUE_SUMMARY_PATH)
    slices = sorted(queue.get("slices", []), key=lambda item: item["order"])
    queue_runner.write_operator_status(
        summary=summary,
        queue_slices=slices,
        event_path=QUEUE_EVENT_PATH,
    )
    return read_json(OPERATOR_STATUS_PATH)


def validation_step_needed() -> bool:
    if not OPERATOR_STATUS_PATH.exists():
        return True
    if not OPERATOR_VALIDATION_PATH.exists():
        return True
    return not operator_validation_accepted()


def next_actions() -> list[tuple[str, list[str]]]:
    actions: list[tuple[str, list[str]]] = []
    if not queue_summary_accepted():
        actions.append(("local_no_stop_queue", ["python3", "scripts/ecl/run_no_stop_execution_queue.py"]))
        return actions
    if actual_readback_accepted():
        if not product_browser_qa_gate_accepted():
            actions.extend(
                [
                    ("product_browser_qa_gate_package", ["npm", "run", "ecl:product-browser-qa-gate:package"]),
                    ("product_browser_qa_gate_validate", ["npm", "run", "ecl:product-browser-qa-gate:validate"]),
                ]
            )
        return actions
    if not post_queue_summary_accepted():
        actions.append(("post_queue_gate_local_proof", ["python3", "scripts/ecl/run_ecl_dense_azure_gate_local_proof.py"]))
    if validation_step_needed() or actions:
        actions.append(
            (
                "operator_status_validation",
                ["python3", "scripts/ecl/validate_ecl_operator_status_report.py", "--allow-in-progress"],
            )
        )
    if post_queue_summary_accepted() and operator_validation_accepted() and not approval_request_accepted():
        actions.extend(
            [
                (
                    "azure_load_approval_request_package",
                    ["python3", "scripts/ecl/write_ecl_azure_load_approval_request.py"],
                ),
                (
                    "azure_load_approval_request_validate",
                    ["python3", "scripts/ecl/validate_ecl_azure_load_approval_request.py"],
                ),
            ]
        )
    return actions


def build_heartbeat_summary(*, out_dir: Path, steps: list[dict[str, Any]]) -> dict[str, Any]:
    status = read_json(OPERATOR_STATUS_PATH)
    validation = read_json(OPERATOR_VALIDATION_PATH)
    post_queue = read_json(POST_QUEUE_SUMMARY_PATH)
    queue_summary = read_json(QUEUE_SUMMARY_PATH)
    approval_request = read_json(APPROVAL_REQUEST_SUMMARY_PATH)
    approval_validation = read_json(APPROVAL_REQUEST_VALIDATION_PATH)
    actual_readback = actual_readback_proof()
    product_browser_summary = read_json(PRODUCT_BROWSER_QA_SUMMARY_PATH)
    progress = status.get("progress", {}) if isinstance(status.get("progress"), dict) else {}
    next_item = status.get("next", {}) if isinstance(status.get("next"), dict) else {}
    quality_rows = status.get("quality_denominators", [])
    quality_rows = quality_rows if isinstance(quality_rows, list) else []
    pass_rows = [row for row in quality_rows if isinstance(row, dict) and row.get("status") == "pass"]
    hard_rows = [row for row in quality_rows if isinstance(row, dict) and row.get("status") == "hard_gated"]
    failed_steps = [row for row in steps if row.get("status") == "fail"]
    hard_gate = next_item.get("blocked_gate") or "azure_data_plane_write"
    if failed_steps:
        decision = "failed"
        instruction = "Stop auto-advance and inspect the heartbeat agent logs."
    elif actual_readback.get("accepted") and product_browser_qa_gate_accepted():
        decision = "hard_gated"
        hard_gate = "product_route_browser_qa"
        blocked_slice_id = "product_route_browser_qa"
        instruction = "Actual ACA load/readback proof is accepted and the product browser QA gate package is ready; the next slice is route/browser execution with proof captured before any live claim."
    elif actual_readback.get("accepted"):
        decision = "continue"
        hard_gate = "product_browser_qa_gate_packaging"
        blocked_slice_id = None
        instruction = "Actual ACA load/readback proof is accepted; run the heartbeat agent again to finish product browser QA gate packaging."
    elif queue_summary_accepted() and post_queue_summary_accepted() and operator_validation_accepted() and approval_request_accepted():
        decision = "hard_gated"
        blocked_slice_id = next_item.get("blocked_slice_id")
        instruction = "Local auto-proceed work and the Azure approval request packet are current; run governed ACA execution only when the operating lane has been approved and proof capture is configured."
    else:
        decision = "continue"
        blocked_slice_id = next_item.get("blocked_slice_id")
        instruction = "Run the heartbeat agent again to advance the next local-safe slice."

    return {
        "accepted": not failed_steps,
        "agent_id": "ecl-heartbeat-status-agent",
        "generated_at": now_iso(),
        "decision": decision,
        "operator_instruction": instruction,
        "advanced_step_count": len([row for row in steps if row.get("executed")]),
        "steps": steps,
        "progress": {
            "local_executable_slices": {
                "passed": progress.get("passed_executable_slices", queue_summary.get("passed_executable_slice_count")),
                "total": progress.get("total_executable_slices", queue_summary.get("executable_slice_count")),
                "percent": progress.get("local_executable_completion_percent", progress.get("completion_percent")),
            },
            "overall_governed_completion": {
                "percent": progress.get("overall_governed_completion_percent", progress.get("completion_percent")),
            },
            "quality_denominators": {
                "passed": len(pass_rows),
                "total": len(quality_rows),
                "hard_gated": len(hard_rows),
            },
            "post_queue_gate_local_proof": {
                "accepted": post_queue.get("accepted"),
                "actual_azure_execution": post_queue.get("actual_azure_execution"),
                "command_was_executed": post_queue.get("command_was_executed"),
            },
            "operator_status_validation": {
                "accepted": validation.get("accepted"),
                "blocked_gate": validation.get("blocked_gate"),
                "quality_denominator_count": validation.get("quality_denominator_count"),
            },
            "azure_load_approval_request": {
                "accepted": approval_request.get("accepted"),
                "approval_state": approval_request.get("approval_state"),
                "validation_accepted": approval_validation.get("accepted"),
                "actual_azure_execution": approval_request.get("actual_azure_execution"),
            },
            "actual_aca_readback": actual_readback,
            "product_browser_qa_gate": {
                "accepted": product_browser_summary.get("accepted"),
                "status": product_browser_summary.get("status"),
                "summary": PRODUCT_BROWSER_QA_SUMMARY_PATH.relative_to(ROOT).as_posix(),
            },
        },
        "next": {
            "blocked_gate": hard_gate,
            "blocked_slice_id": blocked_slice_id,
            "auto_slice_id": next_item.get("auto_slice_id"),
            "backlog_item": (
                "await_product_route_browser_qa_gate"
                if actual_readback.get("accepted") and product_browser_qa_gate_accepted()
                else "finish_product_browser_qa_gate_packaging"
                if actual_readback.get("accepted")
                else
                "await_explicit_azure_lab_load_gate_decision"
                if decision == "hard_gated"
                else "continue_local_auto_proceed_queue"
            ),
            "proof_required_before_claim_or_mutation": [
                "database migrations against shared environments",
                "active tenant input replacement",
                "snapshot promotion",
                "product route repointing",
                "traffic mutation",
                "browser-live proof claims",
                "legacy deletion or retirement",
            ],
        },
        "evidence": {
            "heartbeat_summary": (out_dir / "heartbeat-agent-summary.json").relative_to(ROOT).as_posix(),
            "heartbeat_status": (out_dir / "HEARTBEAT_AGENT_STATUS.md").relative_to(ROOT).as_posix(),
            "operator_status": OPERATOR_STATUS_PATH.relative_to(ROOT).as_posix(),
            "operator_validation": OPERATOR_VALIDATION_PATH.relative_to(ROOT).as_posix(),
            "queue_summary": QUEUE_SUMMARY_PATH.relative_to(ROOT).as_posix(),
            "post_queue_gate_local_proof": POST_QUEUE_SUMMARY_PATH.relative_to(ROOT).as_posix(),
            "azure_load_approval_request": APPROVAL_REQUEST_SUMMARY_PATH.relative_to(ROOT).as_posix(),
            "azure_load_approval_request_validation": APPROVAL_REQUEST_VALIDATION_PATH.relative_to(ROOT).as_posix(),
            "actual_aca_readback_compare": actual_readback.get("compare_path"),
            "actual_aca_readback_export_summary": actual_readback.get("export_summary_path"),
            "product_browser_qa_gate": PRODUCT_BROWSER_QA_SUMMARY_PATH.relative_to(ROOT).as_posix(),
        },
    }


def render_markdown(summary: dict[str, Any], path: Path) -> None:
    progress = summary["progress"]
    next_item = summary["next"]
    lines = [
        "# ECL Heartbeat Status Agent",
        "",
        f"- Generated: `{summary['generated_at']}`",
        f"- Accepted: `{str(summary['accepted']).lower()}`",
        f"- Decision: `{summary['decision']}`",
        f"- Advanced steps this run: `{summary['advanced_step_count']}`",
        f"- Local executable slices: `{progress['local_executable_slices']['passed']} / {progress['local_executable_slices']['total']}`",
        f"- Quality denominators: `{progress['quality_denominators']['passed']} / {progress['quality_denominators']['total']}` pass, `{progress['quality_denominators']['hard_gated']}` hard-gated",
        f"- Actual ACA readback: `{str(progress['actual_aca_readback']['accepted']).lower()}`",
        f"- Product browser QA gate: `{progress['product_browser_qa_gate']['status']}`",
        f"- Next blocked gate: `{next_item['blocked_gate']}`",
        f"- Next backlog item: `{next_item['backlog_item']}`",
        "",
        "## Operator Instruction",
        "",
        summary["operator_instruction"],
        "",
        "## Steps",
        "",
        "| Step | Status | Executed | Log |",
        "|---|---|---|---|",
    ]
    for step in summary.get("steps", []):
        lines.append(
            f"| `{step['name']}` | `{step['status']}` | `{str(step['executed']).lower()}` | `{step['log_path']}` |"
        )
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "This agent advances local proof and gate-readiness work only. It does not mutate Azure data, execute shared migrations, repoint routes, claim browser-live proof, promote snapshots, or retire legacy assets.",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=HEARTBEAT_OUT_DIR)
    parser.add_argument("--max-actions", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    planned_actions = next_actions()[: max(args.max_actions, 0)]
    steps: list[dict[str, Any]] = []
    for name, command in planned_actions:
        step = run_step(name, command, out_dir, execute=not args.dry_run)
        steps.append(step)
        if step["status"] == "fail":
            break
        if name in {"local_no_stop_queue", "post_queue_gate_local_proof"} and not args.dry_run:
            refresh_operator_status()

    if not args.dry_run and QUEUE_SUMMARY_PATH.exists():
        refresh_operator_status()
    summary = build_heartbeat_summary(out_dir=out_dir, steps=steps)
    write_json(out_dir / "heartbeat-agent-summary.json", summary)
    render_markdown(summary, out_dir / "HEARTBEAT_AGENT_STATUS.md")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
