#!/usr/bin/env python3

"""Write the gated dense ECL Azure load/readback package.

This is a gate package only. It prepares the future ACA Job execution contract,
approval checklist, and independent row-for-row readback contract. It does not
call Azure, submit a job, connect to a shared database, repoint routes, promote
tenant inputs, deploy, or retire legacy assets.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23"
DRY_RUN_OUT_DIR = ROOT / "reports/ecl-dense-aca-job-dry-run-2026-08-23"
DRY_RUN_SUMMARY = DRY_RUN_OUT_DIR / "ecl_dense_aca_dry_run_summary.json"
DRY_RUN_PROOF_MANIFEST = DRY_RUN_OUT_DIR / "dense_proof_bundle_manifest.json"
DRY_RUN_RUN_MANIFEST = DRY_RUN_OUT_DIR / "ecl_dense_aca_run_manifest.json"
DRY_RUN_QUALITY_GATE = DRY_RUN_OUT_DIR / "ecl_dense_aca_quality_gate.json"
DRY_RUN_STATUS = DRY_RUN_OUT_DIR / "ecl_dense_aca_status.json"
OPERATOR_STATUS = ROOT / "outputs/ecl-no-stop-execution-run/operator-status.json"
JOB_NAME = "aca-job-ecl-dense-all-layer-load-lab-preprod"
FAMILY = "dense_all_layer_ecl"
FUTURE_EXECUTE_SCRIPT = "ecl:dense-all-layer:execute"
RELEASE_RECORD = "docs/releases/records/2026-08-23-ecl-dense-azure-load-gate-package.md"

ACK_KEYS = [
    "approved_for_future_aca_job_submission",
    "tenant_scope_confirmed",
    "digest_pinned_image_confirmed",
    "private_data_plane_target_confirmed",
    "idempotency_key_confirmed",
    "proof_bundle_hash_confirmed",
    "independent_readback_required",
    "no_product_route_change",
    "no_active_source_promotion",
    "human_review_after_readback_required",
]

READBACK_SUMMARY_FILES = {
    "source": ROOT / "reports/ecl-dense-source-layer-local-load-2026-08-23/dense_source_room_ecl_source_load_summary.json",
    "context": ROOT / "reports/ecl-dense-context-layer-local-load-2026-08-23/dense_source_room_ecl_context_load_summary.json",
    "commercial": ROOT / "reports/ecl-dense-commercial-layer-local-load-2026-08-23/dense_source_room_ecl_commercial_load_summary.json",
    "review": ROOT / "reports/ecl-dense-review-layer-local-load-2026-08-23/dense_source_room_ecl_review_load_summary.json",
    "projection": ROOT / "reports/ecl-dense-source-projection-local-load-2026-08-23/dense_source_room_ecl_source_projection_load_summary.json",
    "cube": ROOT / "reports/ecl-dense-cube-layer-local-load-2026-08-23/dense_source_room_ecl_cube_load_summary.json",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def file_sha(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def git_sha() -> str:
    env_sha = os.environ.get("ABARVA_OPERATOR_BRANCH_COMMIT", "").strip()
    if env_sha:
        return env_sha
    result = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=False)
    return result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "unknown"


def repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def require_file(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"Missing required gate package input: {repo_relative(path)}")


def run_dry_run() -> None:
    env = os.environ.copy()
    env.setdefault("LANG", "C.UTF-8")
    env.setdefault("LC_ALL", "C.UTF-8")
    subprocess.run(
        ["npm", "run", "ecl:dense-aca-job:dry-run"],
        cwd=ROOT,
        env=env,
        check=True,
    )
    subprocess.run(
        ["npm", "run", "ecl:dense-aca-job:validate"],
        cwd=ROOT,
        env=env,
        check=True,
    )


def load_basis(skip_dry_run: bool) -> dict[str, Any]:
    if not skip_dry_run:
        run_dry_run()
    for path in [DRY_RUN_SUMMARY, DRY_RUN_PROOF_MANIFEST, DRY_RUN_RUN_MANIFEST, DRY_RUN_QUALITY_GATE, DRY_RUN_STATUS, OPERATOR_STATUS, *READBACK_SUMMARY_FILES.values()]:
        require_file(path)
    dry_summary = read_json(DRY_RUN_SUMMARY)
    proof_manifest = read_json(DRY_RUN_PROOF_MANIFEST)
    run_manifest = read_json(DRY_RUN_RUN_MANIFEST)
    quality_gate = read_json(DRY_RUN_QUALITY_GATE)
    status = read_json(DRY_RUN_STATUS)
    operator_status = read_json(OPERATOR_STATUS)
    if dry_summary.get("actual_azure_execution") is not False:
        raise SystemExit("Dry-run summary must prove actual_azure_execution=false")
    if quality_gate.get("execute_gate_status") != "blocked_pending_explicit_future_execute_lane":
        raise SystemExit("Dry-run quality gate must still block future execute")
    return {
        "dry_summary": dry_summary,
        "proof_manifest": proof_manifest,
        "run_manifest": run_manifest,
        "quality_gate": quality_gate,
        "status": status,
        "operator_status": operator_status,
        "readback_summaries": {name: read_json(path) for name, path in READBACK_SUMMARY_FILES.items()},
    }


def expected_hashes(basis: dict[str, Any]) -> dict[str, str]:
    paths = [
        DRY_RUN_SUMMARY,
        DRY_RUN_PROOF_MANIFEST,
        DRY_RUN_RUN_MANIFEST,
        DRY_RUN_QUALITY_GATE,
        DRY_RUN_STATUS,
        OPERATOR_STATUS,
        *READBACK_SUMMARY_FILES.values(),
    ]
    bundle_path = ROOT / basis["proof_manifest"]["bundle"]["path"]
    paths.append(bundle_path)
    for artifact in basis["proof_manifest"].get("source_artifacts", []):
        paths.append(ROOT / artifact["path"])
    return dict(sorted((repo_relative(path), file_sha(path)) for path in paths))


def readback_expectations(readback_summaries: dict[str, dict[str, Any]]) -> dict[str, Any]:
    return {
        layer: summary.get("readback", {})
        for layer, summary in readback_summaries.items()
    }


def build_idempotency_key(
    *,
    tenant_scope: str,
    build_version: str,
    input_source_version: str,
    hashes: dict[str, str],
) -> str:
    payload = {
        "job_name": JOB_NAME,
        "family": FAMILY,
        "tenant_scope": tenant_scope,
        "build_version": build_version,
        "input_source_version": input_source_version,
        "expected_hashes": hashes,
    }
    return "ecl-dense-azure-load:" + sha256_text(json.dumps(payload, sort_keys=True))[:32]


def command_plan(out_dir: Path, run_contract_path: Path, readback_contract_path: Path, run_id: str, idempotency_key: str) -> dict[str, Any]:
    base = [
        "npm",
        "run",
        "ops:aca-job",
        "--",
        "--image",
        "${ECL_DENSE_IMAGE_DIGEST_PINNED}",
        "--script",
        FUTURE_EXECUTE_SCRIPT,
        "--job",
        JOB_NAME,
        "--container",
        "${ACA_OPERATOR_CONTAINER:-db-migrate}",
        "--resource-group",
        "${ACA_OPERATOR_RESOURCE_GROUP}",
        "--secret-env",
        "DATABASE_URL=${DATABASE_URL_SECRET_NAME}",
        "--secret-env",
        "AZURE_STORAGE_CONNECTION_STRING=${AZURE_STORAGE_CONNECTION_SECRET_NAME}",
        "--env",
        "ECL_DENSE_MODE=execute",
        "--env",
        f"ECL_DENSE_RUN_ID={run_id}",
        "--env",
        f"ECL_DENSE_IDEMPOTENCY_KEY={idempotency_key}",
        "--env",
        f"ECL_DENSE_LOAD_RUN_CONTRACT={repo_relative(run_contract_path)}",
        "--env",
        f"ECL_DENSE_READBACK_CONTRACT={repo_relative(readback_contract_path)}",
        "--out-dir",
        repo_relative(out_dir / "future-aca-wrapper-output"),
    ]
    return {
        "actual_azure_execution": False,
        "az_invoked": False,
        "command_was_executed": False,
        "dry_run_selected_command": [*base, "--plan-only"],
        "future_execute_command_not_run": base,
        "wrapper": "npm run ops:aca-job",
        "notes": [
            "The selected command is plan-only and is not submitted by this package.",
            "The future execute command is emitted for gate review only.",
        ],
    }


def write_outputs(out_dir: Path, *, skip_dry_run: bool) -> dict[str, str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    basis = load_basis(skip_dry_run)
    generated_at = now_iso()
    build_version = os.environ.get("ECL_DENSE_BUILD_VERSION", "").strip() or git_sha()
    tenant_scope = basis["run_manifest"].get("tenant_scope") or "meridian-health"
    input_source_version = basis["proof_manifest"].get("input_source_version")
    hashes = expected_hashes(basis)
    idempotency_key = build_idempotency_key(
        tenant_scope=tenant_scope,
        build_version=build_version,
        input_source_version=input_source_version,
        hashes=hashes,
    )
    run_id = f"ecl-dense-azure-{generated_at[:10].replace('-', '')}-{idempotency_key.rsplit(':', 1)[-1][:12]}"

    run_contract_path = out_dir / "ecl_dense_azure_load_run_contract.json"
    readback_contract_path = out_dir / "ecl_dense_azure_row_for_row_readback_contract.json"
    command_plan_path = out_dir / "ecl_dense_azure_command_plan.json"
    gate_template_path = out_dir / "ecl_dense_azure_load_gate_manifest.template.json"
    checklist_path = out_dir / "ecl_dense_azure_load_approval_checklist.json"
    status_path = out_dir / "ecl_dense_azure_load_gate_status.json"
    progress_path = out_dir / "ecl_dense_azure_execution_progress.json"
    summary_path = out_dir / "ecl_dense_azure_load_gate_package_summary.json"
    report_path = out_dir / "AZURE_LOAD_GATE_PACKAGE.md"

    expectations = readback_expectations(basis["readback_summaries"])
    local_quality = basis["operator_status"].get("quality_denominators", [])
    proof_bundle = basis["proof_manifest"].get("bundle", {})
    readback_contract = {
        "accepted": True,
        "actual_readback_execution": False,
        "comparison_type": "row_for_row_against_local_dense_all_layer_proof",
        "expected_readback_by_layer": expectations,
        "field_hash_required": True,
        "generated_at": generated_at,
        "independent_reader": "future_independent_read_only_identity",
        "local_quality_denominators": local_quality,
        "local_proof_bundle": {
            "path": proof_bundle.get("path"),
            "sha256": proof_bundle.get("sha256"),
        },
        "local_proof_hashes": hashes,
        "output_paths": {
            "row_count_parity": repo_relative(out_dir / "future_readback_row_count_parity.json"),
            "missing_row_report": repo_relative(out_dir / "future_readback_missing_rows.csv"),
            "extra_row_report": repo_relative(out_dir / "future_readback_extra_rows.csv"),
            "field_hash_mismatch_report": repo_relative(out_dir / "future_readback_field_hash_mismatch_report.csv"),
            "tenant_scope_confirmation": repo_relative(out_dir / "future_readback_tenant_scope_confirmation.json"),
        },
        "required_outputs": [
            "row_count_parity_by_layer_and_table",
            "missing_row_report",
            "extra_row_report",
            "field_hash_mismatch_report",
            "tenant_scope_confirmation",
            "readback_identity_confirmation",
            "zero_metric_or_measure_drift_confirmation",
        ],
        "run_id": run_id,
        "status": "contract_ready_not_executed",
        "tenant_scope": tenant_scope,
    }
    write_json(readback_contract_path, readback_contract)

    gate_template = {
        "approval_file_purpose": "template_only_not_approval",
        "approved": False,
        "build_version": build_version,
        "family": FAMILY,
        "idempotency_key": idempotency_key,
        "input_source_version": input_source_version,
        "mode": "execute",
        "operator_approval_reference": "fill-in-future-private-approval-reference",
        "output_blob_prefix": f"blob://future-approved-ecl-dense-all-layer-load/{tenant_scope}/{run_id}/",
        "readback_contract": {
            "path": repo_relative(readback_contract_path),
            "sha256": file_sha(readback_contract_path),
        },
        "tenant_scope": tenant_scope,
        "expected_local_proof_hashes": hashes,
        "acknowledgements": {key: False for key in ACK_KEYS},
    }
    write_json(gate_template_path, gate_template)

    command = command_plan(out_dir, run_contract_path, readback_contract_path, run_id, idempotency_key)
    write_json(command_plan_path, command)

    run_contract = {
        "accepted": True,
        "actual_azure_execution": False,
        "blob_proof_bundle_location": f"{gate_template['output_blob_prefix'].rstrip('/')}/proof-bundle.tgz",
        "build_version": build_version,
        "command_plan": repo_relative(command_plan_path),
        "dry_run_only": True,
        "expected_local_proof_hashes": hashes,
        "family": FAMILY,
        "gate_manifest_template": repo_relative(gate_template_path),
        "generated_at": generated_at,
        "git_sha": git_sha(),
        "idempotency_key": idempotency_key,
        "image_digest": "${ECL_DENSE_IMAGE_DIGEST_PINNED}",
        "input_source_version": input_source_version,
        "job_name": JOB_NAME,
        "mode": "gate_package_not_executed",
        "operator_identity": os.environ.get("ECL_DENSE_OPERATOR_IDENTITY", "").strip() or getpass.getuser(),
        "output_blob_prefix": gate_template["output_blob_prefix"],
        "progress_status_output": repo_relative(status_path),
        "quality_gate_output": repo_relative(checklist_path),
        "readback_contract": repo_relative(readback_contract_path),
        "release_record_link": RELEASE_RECORD,
        "retry_count": 0,
        "run_id": run_id,
        "started_at": generated_at,
        "status": "planned_not_executed",
        "tenant_scope": tenant_scope,
        "timeout_seconds": 7200,
        "validation_output": repo_relative(summary_path),
    }
    write_json(run_contract_path, run_contract)

    checklist = {
        "accepted": True,
        "actual_azure_execution": False,
        "approval_required_before_execution": True,
        "checks": [
            {"name": "digest_pinned_image", "required": True, "status": "pending_future_approval", "value": "${ECL_DENSE_IMAGE_DIGEST_PINNED}"},
            {"name": "private_data_plane_target", "required": True, "status": "pending_future_approval", "value": "${ECL_DENSE_TARGET_DATA_PLANE}"},
            {"name": "database_secret_binding", "required": True, "status": "pending_future_approval", "value": "${DATABASE_URL_SECRET_NAME}"},
            {"name": "blob_proof_bundle_binding", "required": True, "status": "pending_future_approval", "value": "${AZURE_STORAGE_CONNECTION_SECRET_NAME}"},
            {"name": "idempotency_key", "required": True, "status": "generated_not_approved", "value": idempotency_key},
            {"name": "row_for_row_readback_contract", "required": True, "status": "ready_not_executed", "value": repo_relative(readback_contract_path)},
            {"name": "product_route_repointing", "required": False, "status": "explicitly_not_authorized"},
            {"name": "legacy_retirement", "required": False, "status": "explicitly_not_authorized"},
        ],
    }
    write_json(checklist_path, checklist)

    progress = {
        "actual_azure_execution": False,
        "generated_at": generated_at,
        "overall_percent_complete": 50,
        "steps": [
            {"step": 1, "name": "raw_14_workbooks_and_dense_source_rooms", "percent_complete": 100, "state": "local_proven"},
            {"step": 2, "name": "local_all_layer_validation", "percent_complete": 100, "state": "local_proven"},
            {"step": 3, "name": "aca_data_build_job_contract", "percent_complete": 100, "state": "dry_run_scaffolded"},
            {"step": 4, "name": "azure_load_gate_package", "percent_complete": 100, "state": "gate_package_ready_not_executed"},
            {"step": 5, "name": "azure_lab_load", "percent_complete": 0, "state": "blocked_by_hard_gate"},
            {"step": 6, "name": "independent_azure_readback", "percent_complete": 0, "state": "blocked_by_hard_gate"},
            {"step": 7, "name": "product_route_browser_qa", "percent_complete": 0, "state": "blocked_by_hard_gate"},
        ],
    }
    write_json(progress_path, progress)

    status = {
        "actual_azure_execution": False,
        "events": [
            {"at": generated_at, "name": "gate_package_started"},
            {"at": now_iso(), "name": "dry_run_proof_verified", "proof_bundle": proof_bundle.get("path")},
            {"at": now_iso(), "name": "readback_contract_generated", "path": repo_relative(readback_contract_path)},
            {"at": now_iso(), "name": "future_command_emitted_not_executed", "path": repo_relative(command_plan_path)},
            {"at": now_iso(), "name": "azure_execution_refused_by_design"},
        ],
        "family": FAMILY,
        "idempotency_key": idempotency_key,
        "mode": "gate_package_not_executed",
        "run_id": run_id,
        "status": "ready_for_explicit_future_gate_review",
    }
    write_json(status_path, status)

    summary = {
        "accepted": True,
        "actual_azure_execution": False,
        "dry_run_basis": repo_relative(DRY_RUN_SUMMARY),
        "future_execute_command_not_run": repo_relative(command_plan_path),
        "gate_manifest_template": repo_relative(gate_template_path),
        "idempotency_key": idempotency_key,
        "local_quality_denominators": local_quality,
        "proof_bundle_sha256": proof_bundle.get("sha256"),
        "readback_contract": repo_relative(readback_contract_path),
        "run_contract": repo_relative(run_contract_path),
        "run_id": run_id,
        "status": "gate_package_ready_not_executed",
    }
    write_json(summary_path, summary)

    report = [
        "# ECL Dense Azure Load Gate Package",
        "",
        f"- Run id: `{run_id}`",
        "- Actual Azure execution: `false`",
        f"- Proof bundle SHA-256: `{proof_bundle.get('sha256')}`",
        f"- Command plan: `{repo_relative(command_plan_path)}`",
        f"- Run contract: `{repo_relative(run_contract_path)}`",
        f"- Readback contract: `{repo_relative(readback_contract_path)}`",
        f"- Gate manifest template: `{repo_relative(gate_template_path)}`",
        "",
        "## Boundary",
        "",
        "This package is ready for explicit future gate review only. It does not load Azure, write a shared database, promote tenant sources, repoint product routes, deploy, claim browser proof, or retire legacy assets.",
        "",
        "## Required Future Approval",
        "",
        "- Digest-pinned image.",
        "- Target private data-plane binding.",
        "- Database and Blob secret bindings.",
        "- Idempotency key and proof-bundle hash confirmation.",
        "- Independent row-for-row readback contract.",
        "- Human review before product route adoption.",
    ]
    report_path.write_text("\n".join(report) + "\n", encoding="utf-8")

    return {
        "checklist": repo_relative(checklist_path),
        "command_plan": repo_relative(command_plan_path),
        "gate_manifest_template": repo_relative(gate_template_path),
        "progress": repo_relative(progress_path),
        "readback_contract": repo_relative(readback_contract_path),
        "report": repo_relative(report_path),
        "run_contract": repo_relative(run_contract_path),
        "status": repo_relative(status_path),
        "summary": repo_relative(summary_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--skip-dry-run", action="store_true")
    args = parser.parse_args()
    outputs = write_outputs(args.out_dir.resolve(), skip_dry_run=args.skip_dry_run)
    print(json.dumps(outputs, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as exc:
        print(f"ecl dense Azure load gate package failed: {exc}", file=sys.stderr)
        raise
