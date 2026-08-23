#!/usr/bin/env python3
"""Run the ECL no-stop execution queue as an ordered multi-slice plan.

This runner is intentionally local-proof only. It can execute pre-authorized
proof/report commands, emit checkpoint status, and stop at hard gates. It does
not load Azure data, apply migrations, repoint product routes, shift traffic, or
retire legacy assets.
"""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from validate_no_stop_execution_queue import validate_queue


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_QUEUE_PATH = ROOT / "docs/architecture/ecl-no-stop-execution-queue.json"
DEFAULT_OUT_DIR = ROOT / "outputs/ecl-no-stop-execution-run"
CHECKPOINTS = (0, 15, 30, 45, 60, 75, 90, 100)

PROHIBITED_COMMAND_TOKENS = {
    "az",
    "docker",
    "kubectl",
    "psql",
    "supabase",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_event(path: Path, event: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def notice(message: str) -> None:
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print(f"::notice title=ECL no-stop queue::{message}")
    print(message)


def command_tokens(command: str) -> list[str]:
    try:
        return shlex.split(command)
    except ValueError as exc:
        raise AssertionError(f"Invalid proof command quoting: {command}: {exc}") from exc


def assert_local_command(slice_id: str, command: str) -> list[str]:
    tokens = command_tokens(command)
    if not tokens:
        raise AssertionError(f"{slice_id}: empty command")
    executable = Path(tokens[0]).name
    if executable in PROHIBITED_COMMAND_TOKENS:
        raise AssertionError(f"{slice_id}: prohibited command for local proof lane: {tokens[0]}")
    if executable not in {"python3", "node", "npm"}:
        raise AssertionError(f"{slice_id}: unsupported proof command executable: {tokens[0]}")
    return tokens


def execute_command(
    *,
    slice_id: str,
    command: str,
    out_dir: Path,
    dry_run: bool,
) -> dict[str, Any]:
    tokens = assert_local_command(slice_id, command)
    log_path = out_dir / "logs" / f"{slice_id}.log"
    started = utc_now()
    result: dict[str, Any] = {
        "slice_id": slice_id,
        "command": command,
        "started_at": started,
        "log_path": log_path.relative_to(ROOT).as_posix(),
        "dry_run": dry_run,
    }
    if dry_run:
        result.update({"completed_at": utc_now(), "exit_code": 0, "state": "planned"})
        return result

    env = os.environ.copy()
    env.setdefault("LANG", "C.UTF-8")
    env.setdefault("LC_ALL", "C.UTF-8")
    completed = subprocess.run(
        tokens,
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
            "completed_at": utc_now(),
            "exit_code": completed.returncode,
            "state": "passed" if completed.returncode == 0 else "failed",
        }
    )
    return result


def emit_checkpoints(
    *,
    emitted: set[int],
    completed: int,
    total: int,
    current_slice: str,
    event_path: Path,
) -> None:
    percent = 100 if total == 0 else int((completed / total) * 100)
    for checkpoint in CHECKPOINTS:
        if checkpoint <= percent and checkpoint not in emitted:
            emitted.add(checkpoint)
            event = {
                "event": "checkpoint",
                "checkpoint_percent": checkpoint,
                "completed_executable_slices": completed,
                "total_executable_slices": total,
                "current_slice": current_slice,
                "created_at": utc_now(),
            }
            append_event(event_path, event)
            notice(
                f"{checkpoint}% checkpoint: {completed}/{total} executable slices complete; current={current_slice}"
            )


def render_status_markdown(summary: dict[str, Any], path: Path) -> None:
    lines = [
        "# ECL No-Stop Execution Run",
        "",
        f"- Run ID: `{summary['run_id']}`",
        f"- Accepted: `{str(summary['accepted']).lower()}`",
        f"- Started: `{summary['started_at']}`",
        f"- Completed: `{summary['completed_at']}`",
        f"- Executable slices passed: `{summary['passed_executable_slice_count']} / {summary['executable_slice_count']}`",
        f"- Hard-gated slices: `{summary['hard_gated_slice_count']}`",
        "",
        "## Slice Status",
        "",
        "| Order | Slice | Lane decision | Result | Checkpoint | Stop gate |",
        "|---:|---|---|---|---:|---|",
    ]
    for item in summary["slices"]:
        lines.append(
            "| {order} | `{slice_id}` | {lane_decision} | {result_state} | {checkpoint_percent}% | {stop_gate} |".format(
                **item
            )
        )
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "This run can execute local proof/report commands only. Azure data-plane writes, database migration execution, active tenant replacement, product route repointing, traffic mutation outside the repo-owned deploy workflow, browser-live claims, and legacy retirement remain hard gates.",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queue", type=Path, default=DEFAULT_QUEUE_PATH)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    queue_path = args.queue.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    event_path = out_dir / "execution-events.jsonl"
    if event_path.exists():
        event_path.unlink()

    queue = read_json(queue_path)
    preflight = validate_queue(queue, check_evidence_paths=False)
    slices = sorted(queue.get("slices", []), key=lambda item: item["order"])
    executable = [
        item
        for item in slices
        if item.get("auto_proceed_allowed") and item.get("proof_command") and item.get("status") != "blocked_by_hard_gate"
    ]
    hard_gated = [item for item in slices if item.get("status") == "blocked_by_hard_gate"]
    queued_for_proof = [
        item
        for item in slices
        if item.get("status") != "blocked_by_hard_gate" and not item.get("auto_proceed_allowed")
    ]

    run_id = f"ecl-no-stop-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    summary: dict[str, Any] = {
        "run_id": run_id,
        "started_at": utc_now(),
        "queue_path": queue_path.relative_to(ROOT).as_posix(),
        "dry_run": args.dry_run,
        "preflight_accepted": preflight["accepted"],
        "preflight_issue_count": preflight["issue_count"],
        "preflight_issues": preflight["issues"],
        "executable_slice_count": len(executable),
        "hard_gated_slice_count": len(hard_gated),
        "queued_for_proof_command_count": len(queued_for_proof),
        "slices": [],
    }

    append_event(event_path, {"event": "run_started", "run_id": run_id, "created_at": utc_now()})
    emitted: set[int] = set()
    emit_checkpoints(
        emitted=emitted,
        completed=0,
        total=len(executable),
        current_slice="start",
        event_path=event_path,
    )

    passed = 0
    failed = False
    executable_by_id = {item["slice_id"]: item for item in executable}
    for item in slices:
        slice_id = item["slice_id"]
        if slice_id not in executable_by_id:
            is_hard_gated = item in hard_gated
            state = "hard_gated" if is_hard_gated else "queued_for_proof_command"
            lane_decision = "hard_gate_requires_explicit_approval" if is_hard_gated else "queued_awaiting_proof_command"
            row = {
                "order": item["order"],
                "slice_id": slice_id,
                "lane_decision": lane_decision,
                "result_state": state,
                "checkpoint_percent": min(100, int((passed / max(1, len(executable))) * 100)),
                "stop_gate": item.get("stop_gate", ""),
                "command": item.get("proof_command", ""),
            }
            summary["slices"].append(row)
            append_event(event_path, {"event": "slice_skipped", "created_at": utc_now(), **row})
            continue

        notice(f"Starting slice {item['order']}: {slice_id}")
        command_result = execute_command(
            slice_id=slice_id,
            command=item["proof_command"],
            out_dir=out_dir,
            dry_run=args.dry_run,
        )
        state = command_result["state"]
        if state in {"passed", "planned"}:
            passed += 1
        else:
            failed = True
        row = {
            "order": item["order"],
            "slice_id": slice_id,
            "lane_decision": "pre_authorized_auto_proceed",
            "result_state": state,
            "checkpoint_percent": int((passed / max(1, len(executable))) * 100),
            "stop_gate": item.get("stop_gate", ""),
            "command": item["proof_command"],
            "log_path": command_result["log_path"],
            "exit_code": command_result["exit_code"],
        }
        summary["slices"].append(row)
        append_event(event_path, {"event": "slice_completed", "created_at": utc_now(), **row})
        emit_checkpoints(
            emitted=emitted,
            completed=passed,
            total=len(executable),
            current_slice=slice_id,
            event_path=event_path,
        )
        if failed:
            break

    postflight = validate_queue(queue)
    summary.update(
        {
            "completed_at": utc_now(),
            "passed_executable_slice_count": passed,
            "postflight_accepted": postflight["accepted"],
            "postflight_issue_count": postflight["issue_count"],
            "postflight_issues": postflight["issues"],
            "accepted": (not failed and passed == len(executable) and postflight["accepted"]),
            "event_log": event_path.relative_to(ROOT).as_posix(),
        }
    )
    write_json(out_dir / "execution-summary.json", summary)
    render_status_markdown(summary, out_dir / "execution-status.md")
    append_event(
        event_path,
        {
            "event": "run_completed",
            "created_at": utc_now(),
            "accepted": summary["accepted"],
            "passed_executable_slice_count": passed,
            "executable_slice_count": len(executable),
        },
    )
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
