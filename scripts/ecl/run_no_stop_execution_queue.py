#!/usr/bin/env python3
"""Run the ECL no-stop execution queue as an ordered multi-slice plan.

This runner is intentionally local-proof only. It can execute pre-authorized
proof/report commands, emit checkpoint status, and stop at hard gates. It does
not load Azure data, apply migrations, repoint product routes, shift traffic, or
retire legacy assets.
"""

from __future__ import annotations

import argparse
import csv
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


def read_json_if_exists(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return read_json(path)


def read_csv_if_exists(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_event(path: Path, event: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def read_events(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    events: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            events.append(json.loads(line))
    return events


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


def build_operator_status(
    *,
    summary: dict[str, Any],
    queue_slices: list[dict[str, Any]],
    event_path: Path,
) -> dict[str, Any]:
    completed_rows = {
        row["slice_id"]: row
        for row in summary.get("slices", [])
        if row.get("result_state") in {"passed", "planned", "hard_gated", "queued_for_proof_command"}
    }
    executable_total = int(summary.get("executable_slice_count", 0))
    passed = int(summary.get("passed_executable_slice_count", 0))
    if not passed:
        passed = sum(
            1
            for row in summary.get("slices", [])
            if row.get("result_state") in {"passed", "planned"}
        )
    completion_percent = 100 if executable_total == 0 else int((passed / executable_total) * 100)

    remaining_auto: list[dict[str, Any]] = []
    blocked: list[dict[str, Any]] = []
    for item in queue_slices:
        slice_id = item["slice_id"]
        if item.get("status") == "blocked_by_hard_gate":
            blocked.append(item)
            continue
        if (
            item.get("auto_proceed_allowed")
            and item.get("proof_command")
            and slice_id not in completed_rows
        ):
            remaining_auto.append(item)

    checkpoints = [
        event
        for event in read_events(event_path)
        if event.get("event") == "checkpoint"
    ]
    last_checkpoint = checkpoints[-1]["checkpoint_percent"] if checkpoints else 0
    next_auto = remaining_auto[0] if remaining_auto else None
    next_blocked = blocked[0] if blocked else None
    evidence = {
        "execution_summary": (event_path.parent / "execution-summary.json").relative_to(ROOT).as_posix(),
        "execution_status": (event_path.parent / "execution-status.md").relative_to(ROOT).as_posix(),
        "event_log": event_path.relative_to(ROOT).as_posix(),
        "operator_status_json": (event_path.parent / "operator-status.json").relative_to(ROOT).as_posix(),
        "operator_status_markdown": (event_path.parent / "operator-status.md").relative_to(ROOT).as_posix(),
    }
    quality_denominators = build_quality_denominators()

    return {
        "run_id": summary.get("run_id"),
        "generated_at": utc_now(),
        "queue_path": summary.get("queue_path"),
        "accepted": bool(summary.get("accepted", False)),
        "run_state": "completed" if summary.get("completed_at") else "running",
        "started_at": summary.get("started_at"),
        "completed_at": summary.get("completed_at"),
        "progress": {
            "completion_percent": completion_percent,
            "last_checkpoint_percent": last_checkpoint,
            "passed_executable_slices": passed,
            "total_executable_slices": executable_total,
            "total_slices": len(queue_slices),
            "hard_gated_slices": int(summary.get("hard_gated_slice_count", len(blocked))),
            "queued_for_proof_command_slices": int(
                summary.get("queued_for_proof_command_count", 0)
            ),
        },
        "next": {
            "auto_slice_id": next_auto.get("slice_id") if next_auto else None,
            "auto_action": next_auto.get("next_auto_action") if next_auto else None,
            "blocked_slice_id": next_blocked.get("slice_id") if next_blocked else None,
            "blocked_gate": next_blocked.get("stop_gate") if next_blocked else None,
            "operator_instruction": (
                "Continue local auto-proceed queue."
                if next_auto
                else "No remaining local auto-proceed slices; stop at hard gate before runtime or route changes."
            ),
        },
        "checkpoints": checkpoints,
        "quality_denominators": quality_denominators,
        "evidence": evidence,
        "slices": [
            {
                "order": item["order"],
                "slice_id": item["slice_id"],
                "configured_status": item.get("status"),
                "result_state": completed_rows.get(item["slice_id"], {}).get(
                    "result_state", "pending"
                ),
                "percent_complete": item.get("percent_complete"),
                "auto_proceed_allowed": item.get("auto_proceed_allowed"),
                "proof_command": item.get("proof_command"),
                "evidence_paths": item.get("evidence_paths", []),
                "next_auto_action": item.get("next_auto_action"),
                "stop_gate": item.get("stop_gate"),
            }
            for item in queue_slices
        ],
    }


def build_quality_denominators() -> list[dict[str, Any]]:
    raw_dir = ROOT / "reports/source-excel-raw-landing-2026-08-23"
    dense_dir = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
    producer_dir = ROOT / "reports/ecl-source-room-producer-coverage-2026-08-23"
    source_dir = ROOT / "reports/ecl-dense-source-layer-local-load-2026-08-23"
    context_dir = ROOT / "reports/ecl-dense-context-layer-local-load-2026-08-23"
    commercial_dir = ROOT / "reports/ecl-dense-commercial-layer-local-load-2026-08-23"
    review_dir = ROOT / "reports/ecl-dense-review-layer-local-load-2026-08-23"
    projection_dir = ROOT / "reports/ecl-dense-source-projection-local-load-2026-08-23"
    cube_dir = ROOT / "reports/ecl-dense-cube-layer-local-load-2026-08-23"
    azure_gate_dir = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23"
    azure_readback_compare_dir = ROOT / "reports/ecl-dense-azure-readback-compare-2026-08-23"
    azure_readback_negative_dir = ROOT / "reports/ecl-dense-azure-readback-compare-negative-2026-08-23"

    raw_summary = read_json_if_exists(raw_dir / "source_excel_raw_landing_summary.json")
    dense_summary = read_json_if_exists(dense_dir / "dense_source_room_summary.json")
    dense_manifest = read_csv_if_exists(dense_dir / "dense_source_room_manifest.csv")
    producer_summary = read_json_if_exists(producer_dir / "ecl_source_room_producer_coverage_summary.json")
    source_summary = read_json_if_exists(source_dir / "dense_source_room_ecl_source_load_summary.json")
    context_summary = read_json_if_exists(context_dir / "dense_source_room_ecl_context_load_summary.json")
    commercial_summary = read_json_if_exists(commercial_dir / "dense_source_room_ecl_commercial_load_summary.json")
    review_summary = read_json_if_exists(review_dir / "dense_source_room_ecl_review_load_summary.json")
    projection_summary = read_json_if_exists(projection_dir / "dense_source_room_ecl_source_projection_load_summary.json")
    cube_summary = read_json_if_exists(cube_dir / "dense_source_room_ecl_cube_load_summary.json")
    azure_gate_summary = read_json_if_exists(azure_gate_dir / "ecl_dense_azure_load_gate_package_summary.json")
    azure_gate_status = read_json_if_exists(azure_gate_dir / "ecl_dense_azure_load_gate_status.json")
    azure_execute_preflight = read_json_if_exists(azure_gate_dir / "ecl_dense_azure_execute_preflight_summary.json")
    azure_readback_compare = read_json_if_exists(azure_readback_compare_dir / "readback_compare_summary.json")
    azure_readback_negative = read_json_if_exists(azure_readback_negative_dir / "readback_compare_expected_failure_summary.json")

    def readback(summary: dict[str, Any]) -> dict[str, Any]:
        value = summary.get("readback")
        return value if isinstance(value, dict) else {}

    family_rows = {
        row["source_room_family"]: int(row["row_count"])
        for row in dense_manifest
        if row.get("source_room_family") and row.get("row_count")
    }
    family_files = {
        row["source_room_family"]: dense_dir / row["file_path"]
        for row in dense_manifest
        if row.get("source_room_family") and row.get("file_path")
    }
    application_rows = read_csv_if_exists(family_files.get("SP03_CMDB", dense_dir / "__missing__.csv"))
    source_readback = readback(source_summary)
    context_readback = readback(context_summary)
    commercial_readback = readback(commercial_summary)
    review_readback = readback(review_summary)
    projection_readback = readback(projection_summary)
    cube_readback = readback(cube_summary)
    application_realism = application_realism_notes(application_rows, dense_summary)
    application_realism_passed = sum(1 for value in application_realism["gate_results"].values() if value)
    local_layer_summaries = [source_summary, context_summary, commercial_summary, review_summary, projection_summary, cube_summary]
    local_layer_passed = sum(1 for summary in local_layer_summaries if summary and not summary.get("issues"))
    producer_missing_core = int(producer_summary.get("missing_core_producer_count", 1))
    azure_gate_checks = [
        azure_gate_summary.get("status") == "gate_package_ready_not_executed",
        azure_gate_summary.get("actual_azure_execution") is False,
        azure_gate_status.get("status") == "ready_for_explicit_future_gate_review",
        azure_gate_status.get("actual_azure_execution") is False,
        azure_execute_preflight.get("accepted") is True,
        azure_execute_preflight.get("expected_rejected") is True,
        azure_execute_preflight.get("actual_azure_execution") is False,
        azure_execute_preflight.get("command_was_executed") is False,
    ]
    azure_gate_passed = sum(1 for value in azure_gate_checks if value)
    azure_readback_checks = [
        azure_readback_compare.get("accepted") is True,
        azure_readback_compare.get("actual_azure_execution") is False,
        azure_readback_compare.get("tables_compared") == 77,
        azure_readback_compare.get("missing_row_report_rows") == 0,
        azure_readback_compare.get("extra_row_report_rows") == 0,
        azure_readback_compare.get("field_hash_mismatch_rows") == 0,
        azure_readback_negative.get("accepted") is True,
        azure_readback_negative.get("expected_failed") is True,
    ]
    azure_readback_passed = sum(1 for value in azure_readback_checks if value)

    return [
        {
            "area": "raw_14_workbook_coverage",
            "status": "pass" if raw_summary.get("landed_workbooks") == 14 and raw_summary.get("blocking_gaps") == 0 else "pending",
            "passed": int(raw_summary.get("landed_workbooks", 0) or 0),
            "total": 14,
            "evidence_path": "reports/source-excel-raw-landing-2026-08-23/source_excel_raw_landing_summary.json",
            "notes": {
                "source_room_extracts": raw_summary.get("source_room_extracts"),
                "traceability_rows": raw_summary.get("traceability_rows"),
                "blocking_gaps": raw_summary.get("blocking_gaps"),
            },
        },
        {
            "area": "dense_realistic_source_room_families",
            "status": "pass" if len(family_rows) == 14 and int(dense_summary.get("row_count", 0) or 0) >= 7000 else "pending",
            "passed": len(family_rows),
            "total": 14,
            "evidence_path": "outputs/source-room-depth-catchup-2026-08-23/dense_source_room_summary.json",
            "notes": {
                "source_rows": dense_summary.get("row_count"),
                "applications": family_rows.get("SP03_CMDB"),
                "deployments": family_rows.get("SP14_Deployments_Hosting"),
                "data_flows": family_rows.get("SP13_Data_Flows_Integrations"),
                "contracts": family_rows.get("SP08_Vendor_Contract"),
                "budget_spend": family_rows.get("SP06_Finance_ERP"),
                "evidence_documents": family_rows.get("SP12_Evidence_Room"),
            },
        },
        {
            "area": "application_realism_gates",
            "status": "pass" if application_realism_passed == 5 else "pending",
            "passed": application_realism_passed,
            "total": 5,
            "evidence_path": "outputs/source-room-depth-catchup-2026-08-23/dense_source_room_summary.json",
            "notes": application_realism,
        },
        {
            "area": "ecl_table_producer_coverage",
            "status": "pass" if int(producer_summary.get("table_count", 0) or 0) >= 26 and producer_missing_core == 0 else "pending",
            "passed": int(producer_summary.get("source_supplied_tables", 0) or 0) + int(producer_summary.get("partial_source_supplied_tables", 0) or 0) + int(producer_summary.get("downstream_builder_required_tables", 0) or 0),
            "total": int(producer_summary.get("table_count", 0) or 0),
            "evidence_path": "reports/ecl-source-room-producer-coverage-2026-08-23/ecl_source_room_producer_coverage_summary.json",
            "notes": {
                "source_supplied_tables": producer_summary.get("source_supplied_tables"),
                "partial_source_supplied_tables": producer_summary.get("partial_source_supplied_tables"),
                "downstream_builder_required_tables": producer_summary.get("downstream_builder_required_tables"),
                "missing_core_producer_count": producer_summary.get("missing_core_producer_count"),
            },
        },
        {
            "area": "local_layer_readback_chain",
            "status": "pass" if local_layer_passed == 6 else "pending",
            "passed": local_layer_passed,
            "total": 6,
            "evidence_path": "outputs/ecl-no-stop-execution-run/execution-summary.json",
            "notes": {
                "source_records": source_readback.get("source_record"),
                "context_objects": context_readback.get("object"),
                "commercial_contracts": commercial_readback.get("contract"),
                "review_events": review_readback.get("review_event"),
                "source_contract_360_rows": projection_readback.get("source_contract_360"),
                "cube_slices": cube_readback.get("cube_slice"),
                "cube_metric_drift": cube_readback.get("cube_metric_drift"),
                "cube_measure_drift": cube_readback.get("cube_measure_drift"),
            },
        },
        {
            "area": "azure_load_gate_package",
            "status": "pass" if azure_gate_passed == len(azure_gate_checks) else "pending",
            "passed": azure_gate_passed,
            "total": len(azure_gate_checks),
            "evidence_path": "reports/ecl-dense-azure-load-gate-package-2026-08-23/ecl_dense_azure_load_gate_package_summary.json",
            "notes": {
                "gate_package_status": azure_gate_summary.get("status"),
                "gate_status": azure_gate_status.get("status"),
                "template_rejection_proven": azure_execute_preflight.get("expected_rejected"),
                "actual_azure_execution": azure_gate_summary.get("actual_azure_execution"),
                "command_was_executed": azure_execute_preflight.get("command_was_executed"),
                "readback_contract": azure_gate_summary.get("readback_contract"),
            },
        },
        {
            "area": "azure_readback_comparator",
            "status": "pass" if azure_readback_passed == len(azure_readback_checks) else "pending",
            "passed": azure_readback_passed,
            "total": len(azure_readback_checks),
            "evidence_path": "reports/ecl-dense-azure-readback-compare-2026-08-23/readback_compare_summary.json",
            "notes": {
                "tables_compared": azure_readback_compare.get("tables_compared"),
                "positive_sample_accepted": azure_readback_compare.get("accepted"),
                "negative_sample_refused": azure_readback_negative.get("expected_failed"),
                "comparison_issues": azure_readback_negative.get("comparison_issues", []),
                "actual_azure_execution": azure_readback_compare.get("actual_azure_execution"),
            },
        },
        {
            "area": "runtime_and_browser_hard_gates",
            "status": "hard_gated",
            "passed": 0,
            "total": 3,
            "evidence_path": "outputs/ecl-no-stop-execution-run/operator-status.json",
            "notes": {
                "azure_readback": "not_started_hard_gated",
                "product_route_browser_qa": "not_started_hard_gated",
                "legacy_retirement": "not_started_hard_gated",
            },
        },
    ]


def application_realism_notes(rows: list[dict[str, str]], summary: dict[str, Any]) -> dict[str, Any]:
    if not rows:
        return {
            "annual_cost_total_usd": summary.get("application_annual_cost_total_usd"),
            "top_decile_cost_share": summary.get("application_top_decile_cost_share"),
            "distinct_application_costs": summary.get("distinct_application_annual_costs"),
            "environment_count_values": summary.get("application_environment_count_values"),
            "tier_1_ratio": summary.get("application_tier_1_ratio"),
            "gate_results": {
                "governed_cost_total": False,
                "long_tail_top_decile": False,
                "distinct_costs": False,
                "environment_count_diversity": False,
                "tier_1_ratio": False,
            },
        }
    costs = sorted((float(row.get("annual_cost_usd", "0") or 0) for row in rows), reverse=True)
    cost_total = round(sum(costs), 2)
    top_decile_count = max(1, len(costs) // 10)
    top_decile_share = round(sum(costs[:top_decile_count]) / max(sum(costs), 1), 4)
    distinct_costs = len(set(costs))
    environment_values = sorted(
        {
            int(float(row.get("environment_count", "0") or 0))
            for row in rows
            if row.get("environment_count", "").strip()
        }
    )
    tier_1_ratio = round(sum(1 for row in rows if row.get("criticality_tier") == "tier_1") / len(rows), 4)
    expected_total = 436_500_000
    gate_results = {
        "governed_cost_total": abs(cost_total - expected_total) / expected_total <= 0.005,
        "long_tail_top_decile": 0.30 <= top_decile_share <= 0.75,
        "distinct_costs": distinct_costs == len(rows),
        "environment_count_diversity": len(environment_values) >= 4,
        "tier_1_ratio": 0.10 <= tier_1_ratio <= 0.15,
    }
    return {
        "annual_cost_total_usd": cost_total,
        "top_decile_cost_share": top_decile_share,
        "distinct_application_costs": distinct_costs,
        "application_rows": len(rows),
        "environment_count_values": environment_values,
        "tier_1_ratio": tier_1_ratio,
        "gate_results": gate_results,
    }


def render_operator_status_markdown(status: dict[str, Any], path: Path) -> None:
    progress = status["progress"]
    next_item = status["next"]
    lines = [
        "# ECL Operator Status",
        "",
        f"- Run ID: `{status['run_id']}`",
        f"- Run state: `{status['run_state']}`",
        f"- Accepted: `{str(status['accepted']).lower()}`",
        f"- Progress: `{progress['passed_executable_slices']} / {progress['total_executable_slices']}` executable slices (`{progress['completion_percent']}%`)",
        f"- Last checkpoint emitted: `{progress['last_checkpoint_percent']}%`",
        f"- Hard-gated slices: `{progress['hard_gated_slices']}`",
        f"- Next auto slice: `{next_item['auto_slice_id'] or 'none'}`",
        f"- Next blocked gate: `{next_item['blocked_gate'] or 'none'}`",
        "",
        "## Operator Instruction",
        "",
        next_item["operator_instruction"],
        "",
        "## Quality Denominators",
        "",
        "| Area | Status | Passed | Total | Evidence |",
        "|---|---|---:|---:|---|",
    ]
    for item in status.get("quality_denominators", []):
        lines.append(
            f"| `{item['area']}` | `{item['status']}` | {item['passed']} | {item['total']} | `{item['evidence_path']}` |"
        )
    lines.extend(
        [
            "",
            "## Slice Detail",
            "",
            "| Order | Slice | Result | Auto | Stop gate | Evidence paths |",
            "|---:|---|---|---|---|---:|",
        ]
    )
    for item in status["slices"]:
        lines.append(
            "| {order} | `{slice_id}` | {result_state} | {auto_proceed_allowed} | {stop_gate} | {evidence_count} |".format(
                order=item["order"],
                slice_id=item["slice_id"],
                result_state=item["result_state"],
                auto_proceed_allowed=str(item["auto_proceed_allowed"]).lower(),
                stop_gate=item["stop_gate"] or "",
                evidence_count=len(item["evidence_paths"]),
            )
        )
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "This status is evidence of local proof execution only. Runtime, route, data-plane, migration, active-tenant replacement, browser-live, and legacy-retirement actions remain behind their declared gates.",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_operator_status(
    *,
    summary: dict[str, Any],
    queue_slices: list[dict[str, Any]],
    event_path: Path,
) -> None:
    status = build_operator_status(summary=summary, queue_slices=queue_slices, event_path=event_path)
    write_json(event_path.parent / "operator-status.json", status)
    render_operator_status_markdown(status, event_path.parent / "operator-status.md")


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
    write_operator_status(summary=summary, queue_slices=slices, event_path=event_path)

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
            write_operator_status(summary=summary, queue_slices=slices, event_path=event_path)
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
        summary["passed_executable_slice_count"] = passed
        write_operator_status(summary=summary, queue_slices=slices, event_path=event_path)
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
    write_operator_status(summary=summary, queue_slices=slices, event_path=event_path)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
