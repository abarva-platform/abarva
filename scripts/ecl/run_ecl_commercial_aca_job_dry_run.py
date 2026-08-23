#!/usr/bin/env python3

"""Prepare the ECL commercial ACA data-build job contract as a local dry run.

This script does not call Azure, open a database connection, or mutate tenant
state. It packages the compact commercial proof-plan inputs, writes the ACA Job
spec/run manifest/status paths required by docs/ops/aca-data-build-job-rule.md,
and marks execution-only bindings as missing for the later gated run.
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


DEFAULT_OUT_DIR = Path("reports/ecl-commercial-aca-job-dry-run-2026-08-23")
FAMILY = "vendor_contract_commercial"
JOB_NAME = "aca-job-ecl-source-commercial-load-lab-preprod"
NPM_SCRIPT = "ecl:commercial-aca-job:dry-run"
RELEASE_RECORD = "docs/releases/records/2026-08-23-ecl-commercial-aca-job-dry-run-scaffold.md"
QUEUE_SOURCE = Path("reports/ecl-aca-commercial-load-readback-plan-2026-08-23")
COMPLETION_SOURCE = Path("reports/ecl-source-layer-completion-2026-08-23")
SOURCE_FILES = [
    QUEUE_SOURCE / "aca_data_build_job_contract.json",
    QUEUE_SOURCE / "commercial_family_lab_preprod_load_plan.json",
    QUEUE_SOURCE / "commercial_row_for_row_readback_plan.json",
    QUEUE_SOURCE / "ecl_ordered_execution_progress.json",
    QUEUE_SOURCE / "execution_order_queue.json",
    COMPLETION_SOURCE / "source_layer_completion_summary.json",
    COMPLETION_SOURCE / "source_layer_completion_matrix.csv",
    COMPLETION_SOURCE / "source_backlog_20_status.csv",
]
FORBIDDEN_ACTIONS = [
    "azure_execution",
    "database_write",
    "shared_environment_migration",
    "tenant_active_source_promotion",
    "product_route_repoint",
    "deploy_or_traffic_shift",
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


def git_sha() -> str:
    env_sha = os.environ.get("ABARVA_OPERATOR_BRANCH_COMMIT", "").strip()
    if env_sha:
        return env_sha
    result = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=False)
    return result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "unknown"


def repo_relative(path: Path) -> str:
    return path.as_posix()


def require_source_files(repo: Path) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    missing: list[str] = []
    for rel_path in SOURCE_FILES:
        full_path = repo / rel_path
        if not full_path.exists():
            missing.append(rel_path.as_posix())
            continue
        entries.append(
            {
                "path": rel_path.as_posix(),
                "bytes": full_path.stat().st_size,
                "sha256": file_sha(full_path),
            }
        )
    if missing:
        raise SystemExit(f"Missing required commercial proof-plan artifact(s): {', '.join(missing)}")
    return entries


def source_version(entries: list[dict[str, Any]]) -> str:
    canonical = "\n".join(f"{entry['path']}:{entry['sha256']}" for entry in entries)
    return sha256_text(canonical)


def binding(name: str, value: str | None, *, required_for_execute: bool, source: str) -> dict[str, Any]:
    provided = bool(value)
    status = "provided" if provided else "missing_for_execution" if required_for_execute else "plan_only_default"
    return {
        "name": name,
        "required_for_execute": required_for_execute,
        "source": source,
        "status": status,
        "value": "<redacted>" if "URL" in name or "CONNECTION" in name or "KEY" in name else value,
    }


def build_env_validation(git_commit: str, input_source_version: str, idempotency_key: str) -> dict[str, Any]:
    image = os.environ.get("ECL_COMMERCIAL_IMAGE", "").strip()
    image_digest_ok = "@sha256:" in image if image else False
    env_bindings = [
        binding("ECL_COMMERCIAL_TENANT_SCOPE", os.environ.get("ECL_COMMERCIAL_TENANT_SCOPE", "").strip() or "explicit_operator_supplied_later", required_for_execute=False, source="env_or_plan_default"),
        binding("ECL_COMMERCIAL_BUILD_VERSION", os.environ.get("ECL_COMMERCIAL_BUILD_VERSION", "").strip() or git_commit, required_for_execute=False, source="env_or_git"),
        binding("ECL_COMMERCIAL_INPUT_SOURCE_VERSION", os.environ.get("ECL_COMMERCIAL_INPUT_SOURCE_VERSION", "").strip() or input_source_version, required_for_execute=False, source="env_or_source_artifact_hash"),
        binding("ECL_COMMERCIAL_IDEMPOTENCY_KEY", os.environ.get("ECL_COMMERCIAL_IDEMPOTENCY_KEY", "").strip() or idempotency_key, required_for_execute=False, source="env_or_deterministic_hash"),
        binding("ECL_COMMERCIAL_IMAGE", image or None, required_for_execute=True, source="env"),
        binding("ECL_COMMERCIAL_TARGET_DATA_PLANE", os.environ.get("ECL_COMMERCIAL_TARGET_DATA_PLANE", "").strip() or None, required_for_execute=True, source="env"),
        binding("ECL_COMMERCIAL_OPERATOR_IDENTITY", os.environ.get("ECL_COMMERCIAL_OPERATOR_IDENTITY", "").strip() or getpass.getuser(), required_for_execute=False, source="env_or_local_user"),
        binding("DATABASE_URL", os.environ.get("DATABASE_URL", "").strip() or None, required_for_execute=True, source="secret_env"),
        binding("AZURE_STORAGE_CONNECTION_STRING", os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "").strip() or None, required_for_execute=True, source="secret_env"),
    ]
    missing_for_execution = [
        item["name"]
        for item in env_bindings
        if item["required_for_execute"] and item["status"] == "missing_for_execution"
    ]
    return {
        "accepted_for_dry_run": True,
        "dry_run_only": True,
        "execution_eligible": len(missing_for_execution) == 0 and image_digest_ok,
        "generated_at": now_iso(),
        "image_digest_pinned": image_digest_ok,
        "missing_for_execution": sorted(set(missing_for_execution)),
        "mode": "plan_only_binding_validation",
        "notes": [
            "Dry-run accepts missing execution bindings and records them as blockers.",
            "A later execute lane must provide digest-pinned image, private data-plane target, database secret, and blob proof-bundle binding.",
        ],
        "bindings": env_bindings,
    }


def package_proof_bundle(repo: Path, out_dir: Path, entries: list[dict[str, Any]], input_source_version: str) -> dict[str, Any]:
    bundle_manifest_path = out_dir / "commercial_proof_bundle_manifest.json"
    bundle_path = out_dir / "commercial_proof_bundle.tgz"
    manifest = {
        "accepted": True,
        "family": FAMILY,
        "generated_at": now_iso(),
        "input_source_version": input_source_version,
        "source_artifacts": entries,
        "source_basis": "compact_tracked_reports_from_merged_ordered_plan",
    }
    write_json(bundle_manifest_path, manifest)
    with tarfile.open(bundle_path, "w:gz") as bundle:
        for entry in entries:
            bundle.add(repo / entry["path"], arcname=entry["path"])
        bundle.add(bundle_manifest_path, arcname=bundle_manifest_path.name)
    bundle_manifest = {
        **manifest,
        "bundle": {
            "path": repo_relative(bundle_path),
            "bytes": bundle_path.stat().st_size,
            "sha256": file_sha(bundle_path),
        },
        "manifest_path": repo_relative(bundle_manifest_path),
    }
    write_json(bundle_manifest_path, bundle_manifest)
    return bundle_manifest


def candidate_command(out_dir: Path) -> list[str]:
    return [
        "npm",
        "run",
        "ops:aca-job",
        "--",
        "--image",
        "${ECL_COMMERCIAL_IMAGE_DIGEST_PINNED}",
        "--script",
        NPM_SCRIPT,
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
        "ECL_COMMERCIAL_MODE=execute",
        "--env",
        "ECL_COMMERCIAL_FAMILY=vendor_contract_commercial",
        "--env",
        "ECL_COMMERCIAL_RUN_MANIFEST=job-output/ecl_commercial_aca_run_manifest.json",
        "--out-dir",
        repo_relative(out_dir / "future-aca-job-wrapper-output"),
        "--plan-only",
    ]


def write_dry_run_outputs(repo: Path, out_dir: Path) -> dict[str, Any]:
    out_dir.mkdir(parents=True, exist_ok=True)
    generated_at = now_iso()
    git_commit = git_sha()
    entries = require_source_files(repo)
    input_source_version = source_version(entries)
    tenant_scope = os.environ.get("ECL_COMMERCIAL_TENANT_SCOPE", "").strip() or "explicit_operator_supplied_later"
    build_version = os.environ.get("ECL_COMMERCIAL_BUILD_VERSION", "").strip() or git_commit
    idempotency_key = os.environ.get("ECL_COMMERCIAL_IDEMPOTENCY_KEY", "").strip() or "ecl-commercial:" + sha256_text(
        "|".join([JOB_NAME, FAMILY, tenant_scope, build_version, input_source_version])
    )[:32]
    run_id = f"ecl-commercial-{generated_at[:10].replace('-', '')}-{idempotency_key.rsplit(':', 1)[-1][:12]}"

    env_validation = build_env_validation(git_commit, input_source_version, idempotency_key)
    env_validation_path = out_dir / "ecl_commercial_aca_env_binding_validation.json"
    write_json(env_validation_path, env_validation)
    proof_bundle = package_proof_bundle(repo, out_dir, entries, input_source_version)

    status_path = out_dir / "ecl_commercial_aca_status.json"
    validation_output_path = out_dir / "ecl_commercial_aca_validation_summary.json"
    quality_gate_path = out_dir / "ecl_commercial_aca_quality_gate.json"
    run_manifest_path = out_dir / "ecl_commercial_aca_run_manifest.json"
    job_spec_path = out_dir / "ecl_commercial_aca_job_spec.json"
    progress_path = out_dir / "ecl_commercial_execution_progress.json"
    dry_run_report_path = out_dir / "DRY_RUN_REPORT.md"

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
        "image_digest": "${ECL_COMMERCIAL_IMAGE_DIGEST_PINNED}",
        "input_source_version": input_source_version,
        "job_name": JOB_NAME,
        "mode": "dry_run_report_only",
        "required_status_paths": {
            "progress_status_json": repo_relative(status_path),
            "proof_bundle": repo_relative(Path(proof_bundle["bundle"]["path"])),
            "validation_output": repo_relative(validation_output_path),
            "quality_gate_output": repo_relative(quality_gate_path),
            "run_manifest": repo_relative(run_manifest_path),
        },
        "runner": "scripts/ops/submit-aca-operator-job.mjs",
        "tenant_scope": tenant_scope,
        "wrapper": "npm run ops:aca-job",
    }
    write_json(job_spec_path, job_spec)

    validation_summary = {
        "accepted": True,
        "actual_azure_execution": False,
        "checked_at": now_iso(),
        "checks": [
            {"name": "source_artifacts_present", "status": "pass", "count": len(entries)},
            {"name": "proof_bundle_packaged", "status": "pass", "path": proof_bundle["bundle"]["path"]},
            {"name": "env_bindings_plan_only", "status": "pass", "missing_for_execution": env_validation["missing_for_execution"]},
            {"name": "azure_execution_refused", "status": "pass"},
            {"name": "product_routes_unchanged", "status": "not_applicable_to_runner"},
            {"name": "tenant_active_source_unchanged", "status": "not_applicable_to_runner"},
        ],
        "mode": "dry_run_validation",
    }
    write_json(validation_output_path, validation_summary)

    quality_gate = {
        "accepted": True,
        "actual_azure_execution": False,
        "blocking_for_execute": env_validation["missing_for_execution"],
        "dry_run_gate_status": "pass",
        "execute_gate_status": "blocked_pending_explicit_future_execute_lane",
        "family": FAMILY,
        "generated_at": now_iso(),
        "hard_gates_preserved": {
            "azure_mutation": "not_run",
            "data_mutation": "not_run",
            "deploy_or_traffic_shift": "not_run",
            "product_route_repoint": "not_run",
            "tenant_active_source_promotion": "not_run",
        },
    }
    write_json(quality_gate_path, quality_gate)

    status = {
        "actual_azure_execution": False,
        "ended_at": now_iso(),
        "events": [
            {"at": generated_at, "name": "dry_run_started"},
            {"at": now_iso(), "name": "proof_bundle_packaged", "path": proof_bundle["bundle"]["path"]},
            {"at": now_iso(), "name": "env_bindings_validated_plan_only"},
            {"at": now_iso(), "name": "azure_execution_refused_by_design"},
        ],
        "family": FAMILY,
        "idempotency_key": idempotency_key,
        "job_name": JOB_NAME,
        "mode": "dry_run_report_only",
        "run_id": run_id,
        "status": "dry_run_succeeded",
    }
    write_json(status_path, status)

    run_manifest = {
        "accepted": True,
        "actual_azure_execution": False,
        "blob_proof_bundle_location": "local-only:" + proof_bundle["bundle"]["path"],
        "build_version": build_version,
        "dry_run_only": True,
        "ended_at": status["ended_at"],
        "family": FAMILY,
        "git_sha": git_commit,
        "idempotency_key": idempotency_key,
        "image_digest": "${ECL_COMMERCIAL_IMAGE_DIGEST_PINNED}",
        "input_source_version": input_source_version,
        "job_name": JOB_NAME,
        "operator_identity": os.environ.get("ECL_COMMERCIAL_OPERATOR_IDENTITY", "").strip() or getpass.getuser(),
        "progress_status_output": repo_relative(status_path),
        "quality_gate_output": repo_relative(quality_gate_path),
        "release_record_link": RELEASE_RECORD,
        "retry_count": 0,
        "run_id": run_id,
        "started_at": generated_at,
        "status": "dry_run_succeeded",
        "tenant_scope": tenant_scope,
        "timeout_seconds": 7200,
        "validation_output": repo_relative(validation_output_path),
    }
    write_json(run_manifest_path, run_manifest)

    progress = {
        "accepted": True,
        "generated_at": now_iso(),
        "overall_percent_complete": 22,
        "source": "ecl_commercial_aca_job_dry_run_scaffold",
        "steps": [
            {
                "blockers": ["explicit future execute approval", "digest-pinned image", "private data-plane target and secrets"],
                "evidence": [repo_relative(job_spec_path), repo_relative(run_manifest_path), repo_relative(status_path), proof_bundle["bundle"]["path"]],
                "gate": "no_data_plane_mutation_in_this_pr",
                "name": "build_aca_data_build_job_to_contract_no_data",
                "percent_complete": 85,
                "status": "dry_run_runner_scaffolded_and_manifested",
                "step": 1,
            },
            {
                "blockers": ["explicit operator approval", "digest-pinned image", "target private data-plane confirmation"],
                "evidence": ["reports/ecl-aca-commercial-load-readback-plan-2026-08-23/commercial_family_lab_preprod_load_plan.json"],
                "gate": "azure_data_plane_write",
                "name": "commercial_family_load_to_lab_preprod",
                "percent_complete": 25,
                "status": "plan_ready_gated_not_executed",
                "step": 2,
            },
            {
                "blockers": ["commercial load execution must complete first"],
                "evidence": ["reports/ecl-aca-commercial-load-readback-plan-2026-08-23/commercial_row_for_row_readback_plan.json"],
                "gate": "readback_after_approved_load",
                "name": "independent_commercial_row_for_row_readback",
                "percent_complete": 25,
                "status": "plan_ready_gated_not_executed",
                "step": 3,
            },
            {
                "blockers": ["complete step 3 first"],
                "evidence": [],
                "gate": "commercial_readback_parity",
                "name": "dense_source_rooms_for_remaining_8_families",
                "percent_complete": 0,
                "status": "deferred_after_commercial_readback",
                "step": 4,
            },
            {
                "blockers": ["complete step 4 first"],
                "evidence": [],
                "gate": "all_9_local_artifacts_exist",
                "name": "full_local_validation_across_all_9_families",
                "percent_complete": 0,
                "status": "deferred_after_remaining_8_dense_rooms",
                "step": 5,
            },
            {
                "blockers": ["complete step 5 and obtain explicit load approval"],
                "evidence": [],
                "gate": "azure_data_plane_write_and_readback",
                "name": "reload_and_readback_all_9_families",
                "percent_complete": 0,
                "status": "deferred_hard_gated",
                "step": 6,
            },
            {
                "blockers": ["complete step 6", "deploy through approved workflow", "signed-in Source browser QA"],
                "evidence": [],
                "gate": "product_route_repointing_and_browser_live_claim",
                "name": "route_browser_qa_source_first",
                "percent_complete": 0,
                "status": "deferred_hard_gated",
                "step": 7,
            },
        ],
    }
    write_json(progress_path, progress)

    dry_run_report_path.write_text(
        "\n".join(
            [
                "# ECL Commercial ACA Job Dry Run",
                "",
                f"- Run id: `{run_id}`",
                f"- Job name: `{JOB_NAME}`",
                f"- Family: `{FAMILY}`",
                f"- Actual Azure execution: `{job_spec['actual_azure_execution']}`",
                f"- Proof bundle: `{proof_bundle['bundle']['path']}`",
                f"- Run manifest: `{repo_relative(run_manifest_path)}`",
                f"- Status path: `{repo_relative(status_path)}`",
                f"- Missing for future execute: `{', '.join(env_validation['missing_for_execution'])}`",
                "",
                "Hard gates preserved: no Azure mutation, no data mutation, no route repointing, no active source promotion, no deploy or traffic shift.",
                "",
            ]
        ),
        encoding="utf-8",
    )

    return {
        "job_spec": job_spec_path,
        "run_manifest": run_manifest_path,
        "status": status_path,
        "progress": progress_path,
        "proof_bundle": Path(proof_bundle["bundle"]["path"]),
        "validation": validation_output_path,
        "quality_gate": quality_gate_path,
    }


def write_execute_refusal(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    refusal = {
        "accepted": False,
        "actual_azure_execution": False,
        "generated_at": now_iso(),
        "mode": "execute",
        "reason": "Execute mode is intentionally not implemented in this dry-run/report-only PR.",
        "required_future_gate": "separate approved execute lane with explicit operator approval and digest-pinned ACA job image",
    }
    write_json(out_dir / "ecl_commercial_aca_execution_refusal.json", refusal)
    raise SystemExit("Refused: execute mode is gated out in this dry-run/report-only scaffold.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["dry-run", "execute"], default="dry-run")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    repo = Path.cwd()
    out_dir = args.out_dir
    if args.mode == "execute":
        write_execute_refusal(out_dir)
    outputs = write_dry_run_outputs(repo, out_dir)
    print(json.dumps({key: repo_relative(value) for key, value in outputs.items()}, indent=2, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"ecl commercial ACA dry-run failed: {exc}", file=sys.stderr)
        raise
