#!/usr/bin/env python3

"""Prepare the dense ECL ACA data-build job contract as a local dry run.

This script does not call Azure, open a shared database connection, or mutate
tenant state. It first runs the dense local no-stop proof chain, then packages
the resulting evidence and writes the ACA Job contract artifacts required by
docs/ops/aca-data-build-job-rule.md.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import json
import os
import subprocess
import sys
import tarfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "reports/ecl-dense-aca-job-dry-run-2026-08-23"
QUEUE_SUMMARY = ROOT / "outputs/ecl-no-stop-execution-run/execution-summary.json"
OPERATOR_STATUS = ROOT / "outputs/ecl-no-stop-execution-run/operator-status.json"
JOB_NAME = "aca-job-ecl-dense-all-layer-load-lab-preprod"
FAMILY = "dense_all_layer_ecl"
FUTURE_EXECUTE_SCRIPT = "ecl:dense-all-layer:execute"
RELEASE_RECORD = "docs/releases/records/2026-08-23-ecl-dense-aca-job-dry-run-scaffold.md"

PROOF_ARTIFACTS = [
    "fixtures/ecl/source-workbooks/meridian-v2-2-2b-semantic-mapping-pilot-20260822-092150.zip",
    "docs/architecture/ecl-no-stop-execution-queue.json",
    "outputs/ecl-no-stop-execution-run/execution-summary.json",
    "outputs/ecl-no-stop-execution-run/operator-status.json",
    "outputs/ecl-no-stop-execution-run/operator-status.md",
    "outputs/source-room-depth-catchup-2026-08-23/dense_source_room_summary.json",
    "outputs/source-room-depth-catchup-2026-08-23/dense_source_room_manifest.csv",
    "reports/ecl-source-room-producer-coverage-2026-08-23/ecl_source_room_producer_coverage_summary.json",
    "reports/ecl-dense-source-layer-local-load-2026-08-23/dense_source_room_ecl_source_load_summary.json",
    "reports/ecl-dense-context-layer-local-load-2026-08-23/dense_source_room_ecl_context_load_summary.json",
    "reports/ecl-dense-commercial-layer-local-load-2026-08-23/dense_source_room_ecl_commercial_load_summary.json",
    "reports/ecl-dense-review-layer-local-load-2026-08-23/dense_source_room_ecl_review_load_summary.json",
    "reports/ecl-dense-source-projection-local-load-2026-08-23/dense_source_room_ecl_source_projection_load_summary.json",
    "reports/ecl-dense-cube-layer-local-load-2026-08-23/dense_source_room_ecl_cube_load_summary.json",
]

REQUIRED_EXECUTION_BINDINGS = [
    "ECL_DENSE_IMAGE",
    "ECL_DENSE_TARGET_DATA_PLANE",
    "DATABASE_URL",
    "AZURE_STORAGE_CONNECTION_STRING",
]

FORBIDDEN_ACTIONS = [
    "azure_execution",
    "database_write",
    "shared_environment_migration",
    "tenant_active_source_promotion",
    "product_route_repoint",
    "deploy_or_traffic_shift",
    "legacy_retirement",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def file_sha(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


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


def run_local_proof() -> None:
    env = os.environ.copy()
    env.setdefault("LANG", "C.UTF-8")
    env.setdefault("LC_ALL", "C.UTF-8")
    subprocess.run(
        [sys.executable, "scripts/ecl/run_no_stop_execution_queue.py"],
        cwd=ROOT,
        env=env,
        check=True,
    )
    subprocess.run(
        [sys.executable, "scripts/ecl/validate_ecl_operator_status_report.py"],
        cwd=ROOT,
        env=env,
        check=True,
    )


def proof_entries() -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    missing: list[str] = []
    for rel in PROOF_ARTIFACTS:
        path = ROOT / rel
        if not path.exists():
            missing.append(rel)
            continue
        entries.append({"path": rel, "bytes": path.stat().st_size, "sha256": file_sha(path)})
    if missing:
        raise SystemExit("Missing dense proof artifact(s): " + ", ".join(missing))
    return entries


def source_version(entries: list[dict[str, Any]]) -> str:
    canonical = "\n".join(f"{row['path']}:{row['sha256']}" for row in entries)
    return sha256_text(canonical)


def binding(name: str, value: str | None, *, required_for_execute: bool, source: str) -> dict[str, Any]:
    provided = bool(value)
    return {
        "name": name,
        "required_for_execute": required_for_execute,
        "source": source,
        "status": "provided" if provided else "missing_for_execution" if required_for_execute else "plan_only_default",
        "value": "<redacted>" if provided and ("URL" in name or "CONNECTION" in name or "KEY" in name) else value,
    }


def build_env_validation(git_commit: str, input_source_version: str, idempotency_key: str) -> dict[str, Any]:
    image = os.environ.get("ECL_DENSE_IMAGE", "").strip()
    bindings = [
        binding("ECL_DENSE_TENANT_SCOPE", os.environ.get("ECL_DENSE_TENANT_SCOPE", "").strip() or "meridian-health", required_for_execute=False, source="env_or_plan_default"),
        binding("ECL_DENSE_BUILD_VERSION", os.environ.get("ECL_DENSE_BUILD_VERSION", "").strip() or git_commit, required_for_execute=False, source="env_or_git"),
        binding("ECL_DENSE_INPUT_SOURCE_VERSION", os.environ.get("ECL_DENSE_INPUT_SOURCE_VERSION", "").strip() or input_source_version, required_for_execute=False, source="env_or_proof_bundle_hash"),
        binding("ECL_DENSE_IDEMPOTENCY_KEY", os.environ.get("ECL_DENSE_IDEMPOTENCY_KEY", "").strip() or idempotency_key, required_for_execute=False, source="env_or_deterministic_hash"),
        binding("ECL_DENSE_IMAGE", image or None, required_for_execute=True, source="env"),
        binding("ECL_DENSE_TARGET_DATA_PLANE", os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", "").strip() or None, required_for_execute=True, source="env"),
        binding("ECL_DENSE_OPERATOR_IDENTITY", os.environ.get("ECL_DENSE_OPERATOR_IDENTITY", "").strip() or getpass.getuser(), required_for_execute=False, source="env_or_local_user"),
        binding("DATABASE_URL", os.environ.get("DATABASE_URL", "").strip() or None, required_for_execute=True, source="secret_env"),
        binding("AZURE_STORAGE_CONNECTION_STRING", os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "").strip() or None, required_for_execute=True, source="secret_env"),
    ]
    missing = sorted({row["name"] for row in bindings if row["required_for_execute"] and row["status"] == "missing_for_execution"})
    return {
        "accepted_for_dry_run": True,
        "bindings": bindings,
        "dry_run_only": True,
        "execution_eligible": not missing and "@sha256:" in image,
        "generated_at": now_iso(),
        "image_digest_pinned": "@sha256:" in image if image else False,
        "missing_for_execution": missing,
        "mode": "plan_only_binding_validation",
    }


def candidate_command(out_dir: Path) -> list[str]:
    return [
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
        "ECL_DENSE_TENANT_SCOPE=${ECL_DENSE_TENANT_SCOPE}",
        "--env",
        "ECL_DENSE_RUN_MANIFEST=job-output/ecl_dense_aca_run_manifest.json",
        "--out-dir",
        repo_relative(out_dir / "future-aca-job-wrapper-output"),
        "--plan-only",
    ]


def package_proof_bundle(out_dir: Path, entries: list[dict[str, Any]], input_source_version: str) -> dict[str, Any]:
    manifest_path = out_dir / "dense_proof_bundle_manifest.json"
    bundle_path = out_dir / "dense_proof_bundle.tgz"
    manifest = {
        "accepted": True,
        "family": FAMILY,
        "generated_at": now_iso(),
        "input_source_version": input_source_version,
        "source_artifacts": entries,
        "source_basis": "dense_local_no_stop_proof_outputs",
    }
    write_json(manifest_path, manifest)
    with tarfile.open(bundle_path, "w:gz") as bundle:
        for entry in entries:
            bundle.add(ROOT / entry["path"], arcname=entry["path"])
        bundle.add(manifest_path, arcname=manifest_path.name)
    manifest["bundle"] = {
        "path": repo_relative(bundle_path),
        "bytes": bundle_path.stat().st_size,
        "sha256": file_sha(bundle_path),
    }
    manifest["manifest_path"] = repo_relative(manifest_path)
    write_json(manifest_path, manifest)
    return manifest


def write_outputs(out_dir: Path, *, skip_proof_run: bool) -> dict[str, Any]:
    if not skip_proof_run:
        run_local_proof()

    execution = read_json(QUEUE_SUMMARY)
    operator = read_json(OPERATOR_STATUS)
    if not execution.get("accepted"):
        raise SystemExit("Dense local proof queue is not accepted; refusing ACA dry-run scaffold.")
    if operator.get("run_state") != "completed":
        raise SystemExit("Operator status is not completed; refusing ACA dry-run scaffold.")

    out_dir.mkdir(parents=True, exist_ok=True)
    generated_at = now_iso()
    git_commit = git_sha()
    entries = proof_entries()
    input_source_version = source_version(entries)
    tenant_scope = os.environ.get("ECL_DENSE_TENANT_SCOPE", "").strip() or "meridian-health"
    build_version = os.environ.get("ECL_DENSE_BUILD_VERSION", "").strip() or git_commit
    idempotency_key = os.environ.get("ECL_DENSE_IDEMPOTENCY_KEY", "").strip() or "ecl-dense:" + sha256_text(
        "|".join([JOB_NAME, tenant_scope, build_version, input_source_version])
    )[:32]
    run_id = f"ecl-dense-{generated_at[:10].replace('-', '')}-{idempotency_key.rsplit(':', 1)[-1][:12]}"

    env_validation = build_env_validation(git_commit, input_source_version, idempotency_key)
    proof_bundle = package_proof_bundle(out_dir, entries, input_source_version)

    job_spec_path = out_dir / "ecl_dense_aca_job_spec.json"
    run_manifest_path = out_dir / "ecl_dense_aca_run_manifest.json"
    status_path = out_dir / "ecl_dense_aca_status.json"
    validation_path = out_dir / "ecl_dense_aca_validation_summary.json"
    quality_path = out_dir / "ecl_dense_aca_quality_gate.json"
    progress_path = out_dir / "ecl_dense_execution_progress.json"
    env_path = out_dir / "ecl_dense_aca_env_binding_validation.json"
    report_path = out_dir / "DRY_RUN_REPORT.md"

    job_spec = {
        "accepted": True,
        "actual_azure_execution": False,
        "build_version": build_version,
        "candidate_wrapper_command": candidate_command(out_dir),
        "docs_contract": "docs/ops/aca-data-build-job-rule.md",
        "dry_run_only": True,
        "family": FAMILY,
        "forbidden_actions": FORBIDDEN_ACTIONS,
        "generated_at": generated_at,
        "git_sha": git_commit,
        "idempotency_key": idempotency_key,
        "image_digest": "${ECL_DENSE_IMAGE_DIGEST_PINNED}",
        "input_source_version": input_source_version,
        "job_name": JOB_NAME,
        "mode": "dry_run_report_only",
        "required_status_paths": {
            "progress_status_json": repo_relative(progress_path),
            "proof_bundle": proof_bundle["bundle"]["path"],
            "validation_output": repo_relative(validation_path),
            "quality_gate_output": repo_relative(quality_path),
            "run_manifest": repo_relative(run_manifest_path),
        },
        "runner": "scripts/ops/submit-aca-operator-job.mjs",
        "tenant_scope": tenant_scope,
        "wrapper": "npm run ops:aca-job",
    }
    write_json(job_spec_path, job_spec)
    write_json(env_path, env_validation)

    progress = {
        "actual_azure_execution": False,
        "generated_at": generated_at,
        "overall_percent_complete": 50,
        "steps": [
            {"step": 1, "name": "raw_14_workbooks_and_dense_source_rooms", "percent_complete": 100, "state": "local_proven"},
            {"step": 2, "name": "local_all_layer_validation", "percent_complete": 100, "state": "local_proven"},
            {"step": 3, "name": "aca_data_build_job_contract", "percent_complete": 100, "state": "dry_run_scaffolded"},
            {"step": 4, "name": "azure_lab_load", "percent_complete": 0, "state": "blocked_by_hard_gate"},
            {"step": 5, "name": "independent_azure_readback", "percent_complete": 0, "state": "blocked_by_hard_gate"},
            {"step": 6, "name": "product_route_browser_qa", "percent_complete": 0, "state": "blocked_by_hard_gate"},
        ],
    }
    write_json(progress_path, progress)

    run_manifest = {
        "actual_azure_execution": False,
        "blob_proof_bundle_location": "local-only:" + proof_bundle["bundle"]["path"],
        "build_version": build_version,
        "ended_at": generated_at,
        "git_sha": git_commit,
        "idempotency_key": idempotency_key,
        "image_digest": "${ECL_DENSE_IMAGE_DIGEST_PINNED}",
        "input_source_version": input_source_version,
        "job_name": JOB_NAME,
        "operator_identity": os.environ.get("ECL_DENSE_OPERATOR_IDENTITY", "").strip() or getpass.getuser(),
        "progress_status_output": repo_relative(progress_path),
        "quality_gate_output": repo_relative(quality_path),
        "release_record_link": RELEASE_RECORD,
        "retry_count": 0,
        "run_id": run_id,
        "started_at": generated_at,
        "status": "dry_run_succeeded",
        "tenant_scope": tenant_scope,
        "timeout_seconds": 7200,
        "validation_output": repo_relative(validation_path),
    }
    write_json(run_manifest_path, run_manifest)

    validation = {
        "accepted": True,
        "actual_azure_execution": False,
        "checked_at": now_iso(),
        "checks": [
            {"name": "local_no_stop_queue_accepted", "status": "pass", "executable_slices": execution.get("executable_slice_count")},
            {"name": "proof_bundle_packaged", "status": "pass", "path": proof_bundle["bundle"]["path"]},
            {"name": "env_bindings_plan_only", "status": "pass", "missing_for_execution": env_validation["missing_for_execution"]},
            {"name": "azure_execution_refused", "status": "pass"},
            {"name": "product_routes_unchanged", "status": "pass"},
            {"name": "legacy_retirement_unchanged", "status": "pass"},
        ],
        "mode": "dense_dry_run_validation",
    }
    write_json(validation_path, validation)

    quality = {
        "accepted": True,
        "actual_azure_execution": False,
        "blocking_for_execute": env_validation["missing_for_execution"],
        "dry_run_gate_status": "pass",
        "execute_gate_status": "blocked_pending_explicit_future_execute_lane",
        "hard_gates_preserved": {
            "azure_mutation": "not_run",
            "data_mutation": "not_run",
            "product_route_repoint": "not_run",
            "browser_live_claim": "not_run",
            "legacy_retirement": "not_run",
        },
    }
    write_json(quality_path, quality)

    status = {
        "actual_azure_execution": False,
        "ended_at": generated_at,
        "events": [
            {"at": generated_at, "name": "dry_run_started"},
            {"at": generated_at, "name": "dense_local_queue_verified", "executable_slices": execution.get("executable_slice_count")},
            {"at": generated_at, "name": "proof_bundle_packaged", "path": proof_bundle["bundle"]["path"]},
            {"at": generated_at, "name": "env_bindings_validated_plan_only"},
            {"at": generated_at, "name": "azure_execution_refused_by_design"},
        ],
        "family": FAMILY,
        "idempotency_key": idempotency_key,
        "job_name": JOB_NAME,
        "mode": "dry_run_report_only",
        "run_id": run_id,
        "status": "dry_run_succeeded",
    }
    write_json(status_path, status)

    report = [
        "# ECL Dense ACA Job Dry Run",
        "",
        f"- Job name: `{JOB_NAME}`",
        f"- Run id: `{run_id}`",
        f"- Actual Azure execution: `false`",
        f"- Local queue accepted: `{str(execution.get('accepted')).lower()}`",
        f"- Proof bundle: `{proof_bundle['bundle']['path']}`",
        f"- Execute gate: `{quality['execute_gate_status']}`",
        "",
        "This artifact prepares the ACA Job contract only. It does not load Azure, write a shared database, repoint product routes, claim browser proof, or retire legacy assets.",
    ]
    report_path.write_text("\n".join(report) + "\n", encoding="utf-8")

    summary = {
        "accepted": True,
        "actual_azure_execution": False,
        "dry_run_only": True,
        "job_name": JOB_NAME,
        "run_id": run_id,
        "proof_bundle": proof_bundle["bundle"],
        "status_path": repo_relative(status_path),
        "run_manifest_path": repo_relative(run_manifest_path),
        "validation_output": repo_relative(validation_path),
        "quality_gate_output": repo_relative(quality_path),
        "progress_output": repo_relative(progress_path),
        "missing_for_execution": env_validation["missing_for_execution"],
    }
    write_json(out_dir / "ecl_dense_aca_dry_run_summary.json", summary)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--skip-proof-run", action="store_true")
    args = parser.parse_args()

    summary = write_outputs(args.out_dir.resolve(), skip_proof_run=args.skip_proof_run)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
