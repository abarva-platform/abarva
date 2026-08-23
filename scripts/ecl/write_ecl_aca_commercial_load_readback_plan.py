#!/usr/bin/env python3
"""Write the gated ACA commercial-load/readback plan for ECL Source.

This generator emits plan and progress artifacts only. It does not submit an
ACA job, mutate Azure, apply migrations, repoint routes, deploy, or claim
browser proof.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-aca-commercial-load-readback-plan-2026-08-23"
DEFAULT_COMPLETION_SUMMARY = ROOT / "reports/ecl-source-layer-completion-2026-08-23/source_layer_completion_summary.json"

ORDERED_STEPS = [
    {
        "step": 1,
        "name": "build_aca_data_build_job_to_contract_no_data",
        "percent_complete": 65,
        "status": "contract_built_no_data",
        "gate": "no_data_plane_mutation_in_this_pr",
        "blockers": [],
    },
    {
        "step": 2,
        "name": "commercial_family_load_to_lab_preprod",
        "percent_complete": 25,
        "status": "plan_ready_gated_not_executed",
        "gate": "azure_data_plane_write",
        "blockers": ["explicit operator approval", "digest-pinned image", "target private data-plane confirmation"],
    },
    {
        "step": 3,
        "name": "independent_commercial_row_for_row_readback",
        "percent_complete": 25,
        "status": "plan_ready_gated_not_executed",
        "gate": "readback_after_approved_load",
        "blockers": ["commercial load execution must complete first"],
    },
    {
        "step": 4,
        "name": "dense_source_rooms_for_remaining_8_families",
        "percent_complete": 0,
        "status": "deferred_after_commercial_readback",
        "gate": "commercial_readback_parity",
        "blockers": ["complete step 3 first"],
    },
    {
        "step": 5,
        "name": "full_local_validation_across_all_9_families",
        "percent_complete": 0,
        "status": "deferred_after_remaining_8_dense_rooms",
        "gate": "all_9_local_artifacts_exist",
        "blockers": ["complete step 4 first"],
    },
    {
        "step": 6,
        "name": "reload_and_readback_all_9_families",
        "percent_complete": 0,
        "status": "deferred_hard_gated",
        "gate": "azure_data_plane_write_and_readback",
        "blockers": ["complete step 5 and obtain explicit load approval"],
    },
    {
        "step": 7,
        "name": "route_browser_qa_source_first",
        "percent_complete": 0,
        "status": "deferred_hard_gated",
        "gate": "product_route_repointing_and_browser_live_claim",
        "blockers": ["complete step 6", "deploy through approved workflow", "signed-in Source browser QA"],
    },
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def rel(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def commercial_counts(summary: dict[str, Any]) -> dict[str, Any]:
    counts = summary.get("commercial_counts", {})
    if counts:
        return counts
    return {
        "source_files": 0,
        "source_records": 0,
        "documents": 0,
        "document_extractions": 0,
        "contracts": 0,
        "service_lines": 0,
        "contract_scope": 0,
        "invoice_lines": 0,
        "sla_observations": 0,
        "source_contract_360_rows": 0,
        "source_vendor_360_rows": 0,
        "source_value_levers_rows": 0,
        "source_event_workspace_rows": 0,
    }


def build_artifacts(out_dir: Path, completion_summary_path: Path) -> dict[str, Any]:
    generated_at = utc_now()
    completion_summary = read_json(completion_summary_path)
    counts = commercial_counts(completion_summary)
    expected_manifest = {
        "basis": rel(completion_summary_path),
        "local_commercial_proof_expected_counts": {
            "source_files": counts.get("source_files", 0),
            "source_records": counts.get("source_records", 0),
            "documents": counts.get("documents", 0),
            "document_extractions": counts.get("document_extractions", 0),
            "contracts": counts.get("contracts", 0),
            "service_lines": counts.get("service_lines", 0),
            "contract_scope": counts.get("contract_scope", 0),
            "invoice_lines": counts.get("invoice_lines", 0),
            "sla_observations": counts.get("sla_observations", 0),
            "source_contract_360_rows": counts.get("source_contract_360_rows", 0),
            "source_vendor_360_rows": counts.get("source_vendor_360_rows", 0),
            "source_value_levers_rows": counts.get("source_value_levers_rows", 0),
            "source_event_workspace_rows": counts.get("source_event_workspace_rows", 0),
        },
        "row_for_row_compare_keys": [
            "tenant_key",
            "assessment_id",
            "source_file_id",
            "source_record_id",
            "document_id",
            "contract_id",
            "commercial_instrument_id",
            "review_event_id",
            "projection_row_id",
            "cube_slice_id",
        ],
    }

    aca_contract = {
        "accepted": True,
        "generated_at": generated_at,
        "mode": "contract_built_no_data",
        "job_name": "aca-job-ecl-source-commercial-load-lab-preprod",
        "runner": "scripts/ops/submit-aca-operator-job.mjs",
        "wrapper": "npm run ops:aca-job",
        "tenant_scope": "explicit_operator_supplied",
        "build_version": "git_sha_plus_source_room_manifest_sha",
        "input_source_version": "local_commercial_proof_manifest_sha",
        "idempotency_key": "ecl-commercial-load-{tenant_scope}-{input_source_version}",
        "required_image": "digest_pinned_acr_image",
        "status_model": ["queued", "running", "succeeded", "failed", "cancelled"],
        "required_inputs": [
            "job_name",
            "run_id",
            "tenant_scope",
            "build_version",
            "input_source_version",
            "idempotency_key",
            "operator_identity_or_automation_identity",
            "git_sha",
            "image_digest",
        ],
        "required_outputs": [
            "started_finished_timestamps",
            "progress_status_json",
            "blob_proof_bundle_location",
            "validation_output_location",
            "quality_gate_output_location",
            "release_record_link",
            "idle_restore_evidence",
        ],
        "not_executed_in_this_pr": True,
        "forbidden_without_explicit_approval": [
            "Azure data-plane writes",
            "database migrations against shared environments",
            "active tenant source promotion",
            "product route repointing",
            "deploy or traffic shift",
        ],
    }
    write_json(out_dir / "aca_data_build_job_contract.json", aca_contract)

    load_plan = {
        "accepted": True,
        "generated_at": generated_at,
        "mode": "plan_ready_gated_not_executed",
        "family": "vendor_contract_commercial",
        "target": "lab_or_client_preprod_private_data_plane",
        "first_gated_data_plane_action": True,
        "write_allowed_in_this_pr": False,
        "execution_order_step": 2,
        "source_basis": rel(completion_summary_path),
        "expected_manifest": expected_manifest,
        "required_preflight": [
            "confirm target private data plane",
            "confirm tenant scope from registry or operator input",
            "confirm digest-pinned image",
            "dry-run job request summary",
            "capture explicit approval before write",
        ],
        "proof_bundle_required_before_any_product_route_adoption": True,
    }
    write_json(out_dir / "commercial_family_lab_preprod_load_plan.json", load_plan)

    readback_plan = {
        "accepted": True,
        "generated_at": generated_at,
        "mode": "plan_ready_gated_not_executed",
        "execution_order_step": 3,
        "reader": "independent_read_only_identity",
        "compare_against": rel(completion_summary_path),
        "comparison_type": "row_for_row_against_local_commercial_proof",
        "expected_manifest": expected_manifest,
        "required_outputs": [
            "row_count_parity_by_table",
            "missing_row_report",
            "extra_row_report",
            "field_hash_mismatch_report",
            "tenant_scope_confirmation",
            "readback_identity_confirmation",
        ],
        "not_valid_as_proof": [
            "service-role-only readback",
            "HTTP 200",
            "deploy log",
            "CI pass without data-plane readback",
        ],
    }
    write_json(out_dir / "commercial_row_for_row_readback_plan.json", readback_plan)

    queue = {
        "accepted": True,
        "generated_at": generated_at,
        "queue_id": "ecl-source-ordered-aca-commercial-first",
        "current_focus": "ACA job contract plus commercial-family load/readback plan",
        "hard_boundaries": {
            "azure_mutation": False,
            "migration_apply": False,
            "active_tenant_promotion": False,
            "product_route_repointing": False,
            "deploy_or_traffic_shift": False,
            "browser_live_claim": False,
        },
        "steps": ORDERED_STEPS,
    }
    write_json(out_dir / "execution_order_queue.json", queue)

    progress = {
        "accepted": True,
        "generated_at": generated_at,
        "overall_percent_complete": 19,
        "execution_order": [step["name"] for step in ORDERED_STEPS],
        "immediate_deliverable": "aca_job_contract_and_commercial_load_readback_plan",
        "steps": [
            {
                **step,
                "evidence": {
                    1: [rel(out_dir / "aca_data_build_job_contract.json")],
                    2: [rel(out_dir / "commercial_family_lab_preprod_load_plan.json")],
                    3: [rel(out_dir / "commercial_row_for_row_readback_plan.json")],
                }.get(step["step"], []),
            }
            for step in ORDERED_STEPS
        ],
    }
    write_json(out_dir / "ecl_ordered_execution_progress.json", progress)

    rows = [
        {
            "step": step["step"],
            "name": step["name"],
            "percent_complete": step["percent_complete"],
            "status": step["status"],
            "gate": step["gate"],
            "blockers": "; ".join(step["blockers"]),
        }
        for step in ORDERED_STEPS
    ]
    write_csv(
        out_dir / "execution_order_queue.csv",
        rows,
        ["step", "name", "percent_complete", "status", "gate", "blockers"],
    )
    write_markdown(out_dir, progress, expected_manifest)
    return {
        "accepted": True,
        "generated_at": generated_at,
        "out_dir": rel(out_dir),
        "files": {
            "aca_contract": rel(out_dir / "aca_data_build_job_contract.json"),
            "commercial_load_plan": rel(out_dir / "commercial_family_lab_preprod_load_plan.json"),
            "commercial_readback_plan": rel(out_dir / "commercial_row_for_row_readback_plan.json"),
            "queue": rel(out_dir / "execution_order_queue.json"),
            "progress": rel(out_dir / "ecl_ordered_execution_progress.json"),
            "markdown": rel(out_dir / "ORDERED_EXECUTION_PLAN.md"),
        },
    }


def write_markdown(out_dir: Path, progress: dict[str, Any], expected_manifest: dict[str, Any]) -> None:
    counts = expected_manifest["local_commercial_proof_expected_counts"]
    lines = [
        "# ECL Ordered ACA Commercial-First Plan",
        "",
        "Plan-only PR slice. No Azure mutation, migration apply, active tenant promotion, product route repointing, deploy, traffic shift, or browser-live claim was performed.",
        "",
        "## Immediate Deliverable",
        "",
        "Build the ACA data-build job contract, then stage the commercial family as the first gated lab/preprod data-plane action, followed by independent row-for-row readback against the local commercial proof.",
        "",
        "## Commercial Proof Basis",
        "",
        f"- Source records: `{counts['source_records']}`",
        f"- Documents: `{counts['documents']}`",
        f"- Document extractions: `{counts['document_extractions']}`",
        f"- Contracts: `{counts['contracts']}`",
        f"- Source Contract 360 rows: `{counts['source_contract_360_rows']}`",
        "",
        "## Ordered Queue",
        "",
        "| Step | Percent | Status | Gate | Blockers |",
        "|---:|---:|---|---|---|",
    ]
    for step in progress["steps"]:
        lines.append(
            f"| {step['step']} | {step['percent_complete']}% | `{step['status']}` | `{step['gate']}` | {', '.join(step['blockers']) or 'none'} |"
        )
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "ORDERED_EXECUTION_PLAN.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--completion-summary", type=Path, default=DEFAULT_COMPLETION_SUMMARY)
    args = parser.parse_args()
    summary = build_artifacts(args.out_dir.resolve(), args.completion_summary.resolve())
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
