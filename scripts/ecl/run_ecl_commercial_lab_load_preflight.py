#!/usr/bin/env python3

"""Prepare the gated ECL commercial lab/preprod load contract.

This is a contract/preflight surface only. It never calls Azure, never starts
an ACA Job, never opens a data-plane connection, and never mutates product
routes or tenant active-source state.
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


DEFAULT_OUT_DIR = Path("reports/ecl-commercial-lab-load-preflight-2026-08-23")
STEP1_OUT_DIR = Path("reports/ecl-commercial-aca-job-dry-run-2026-08-23")
STEP1_PROOF_MANIFEST = STEP1_OUT_DIR / "commercial_proof_bundle_manifest.json"
STEP1_RUN_MANIFEST = STEP1_OUT_DIR / "ecl_commercial_aca_run_manifest.json"
SOURCE_SUMMARY = Path("reports/ecl-source-layer-completion-2026-08-23/source_layer_completion_summary.json")
READBACK_PLAN = Path("reports/ecl-aca-commercial-load-readback-plan-2026-08-23/commercial_row_for_row_readback_plan.json")
FAMILY = "vendor_contract_commercial"
JOB_NAME = "aca-job-ecl-source-commercial-load-lab-preprod"
RELEASE_RECORD = "docs/releases/records/2026-08-23-ecl-commercial-lab-load-preflight.md"
FUTURE_SCRIPT = "ecl:commercial-aca-job:dry-run"
ACK_KEYS = [
    "approved_for_future_aca_job_submission",
    "tenant_scope_confirmed",
    "digest_pinned_image_required",
    "private_data_plane_target_confirmed",
    "independent_readback_required",
    "no_product_route_change",
    "human_review_after_readback_required",
]


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
    result = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=False)
    return result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "unknown"


def repo_relative(path: Path) -> str:
    return path.as_posix()


def expected_tenant_scope(repo: Path) -> str:
    summary = read_json(repo / SOURCE_SUMMARY)
    tenant = summary.get("commercial_counts", {}).get("tenant_key")
    if not isinstance(tenant, str) or not tenant.strip():
        raise SystemExit(f"Unable to determine commercial tenant scope from {SOURCE_SUMMARY.as_posix()}")
    return tenant.strip()


def require_file(repo: Path, path: Path) -> None:
    if not (repo / path).exists():
        raise SystemExit(f"Missing required preflight input: {path.as_posix()}")


def collect_expected_hashes(repo: Path, proof_manifest: dict[str, Any]) -> dict[str, str]:
    expected: dict[str, str] = {}
    for rel_path in [STEP1_PROOF_MANIFEST, STEP1_RUN_MANIFEST, READBACK_PLAN, SOURCE_SUMMARY]:
        require_file(repo, rel_path)
        expected[rel_path.as_posix()] = file_sha(repo / rel_path)
    bundle = proof_manifest.get("bundle", {})
    bundle_path = Path(str(bundle.get("path", "")))
    if bundle_path.as_posix() == ".":
        raise SystemExit("Proof bundle manifest is missing bundle.path")
    require_file(repo, bundle_path)
    expected[bundle_path.as_posix()] = file_sha(repo / bundle_path)
    recorded_bundle_sha = str(bundle.get("sha256", ""))
    if recorded_bundle_sha and recorded_bundle_sha != expected[bundle_path.as_posix()]:
        raise SystemExit("Proof bundle hash drifted from the committed Step 1 manifest")
    for artifact in proof_manifest.get("source_artifacts", []):
        rel_path = Path(str(artifact.get("path", "")))
        if rel_path.as_posix() == ".":
            raise SystemExit("Proof bundle manifest contains a source artifact without a path")
        require_file(repo, rel_path)
        current = file_sha(repo / rel_path)
        recorded = str(artifact.get("sha256", ""))
        if recorded and recorded != current:
            raise SystemExit(f"Source artifact hash drifted from Step 1 manifest: {rel_path.as_posix()}")
        expected[rel_path.as_posix()] = current
    return dict(sorted(expected.items()))


def load_basis(repo: Path) -> dict[str, Any]:
    require_file(repo, STEP1_PROOF_MANIFEST)
    require_file(repo, STEP1_RUN_MANIFEST)
    require_file(repo, READBACK_PLAN)
    require_file(repo, SOURCE_SUMMARY)
    proof_manifest = read_json(repo / STEP1_PROOF_MANIFEST)
    step1_run = read_json(repo / STEP1_RUN_MANIFEST)
    readback_plan = read_json(repo / READBACK_PLAN)
    source_summary = read_json(repo / SOURCE_SUMMARY)
    expected_hashes = collect_expected_hashes(repo, proof_manifest)
    return {
        "proof_manifest": proof_manifest,
        "step1_run": step1_run,
        "readback_plan": readback_plan,
        "source_summary": source_summary,
        "expected_hashes": expected_hashes,
        "tenant_scope": expected_tenant_scope(repo),
    }


def build_idempotency_key(job_name: str, family: str, tenant_scope: str, build_version: str, input_source_version: str, expected_hashes: dict[str, str]) -> str:
    hash_basis = json.dumps(
        {
            "job_name": job_name,
            "family": family,
            "tenant_scope": tenant_scope,
            "build_version": build_version,
            "input_source_version": input_source_version,
            "expected_hashes": expected_hashes,
        },
        sort_keys=True,
    )
    return "ecl-commercial-lab-load:" + sha256_text(hash_basis)[:32]


def command_plan(out_dir: Path, run_contract_path: Path, readback_contract_path: Path, run_id: str, idempotency_key: str) -> dict[str, Any]:
    base = [
        "npm",
        "run",
        "ops:aca-job",
        "--",
        "--image",
        "${ECL_COMMERCIAL_IMAGE_DIGEST_PINNED}",
        "--script",
        FUTURE_SCRIPT,
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
        f"ECL_COMMERCIAL_RUN_ID={run_id}",
        "--env",
        f"ECL_COMMERCIAL_IDEMPOTENCY_KEY={idempotency_key}",
        "--env",
        f"ECL_COMMERCIAL_LOAD_RUN_CONTRACT={repo_relative(run_contract_path)}",
        "--env",
        f"ECL_COMMERCIAL_READBACK_CONTRACT={repo_relative(readback_contract_path)}",
        "--out-dir",
        repo_relative(out_dir / "future-aca-wrapper-output"),
    ]
    plan_only = [*base, "--plan-only"]
    return {
        "actual_azure_execution": False,
        "az_invoked": False,
        "command_was_executed": False,
        "dry_run_selected_command": plan_only,
        "future_execute_command_not_run": base,
        "notes": [
            "The dry-run command includes --plan-only and is not executed by this script.",
            "The future execute command is emitted as a contract only; this PR does not submit it.",
        ],
        "wrapper": "npm run ops:aca-job",
    }


def build_readback_contract(repo: Path, basis: dict[str, Any], out_dir: Path, run_id: str, expected_hashes: dict[str, str]) -> dict[str, Any]:
    readback_plan = basis["readback_plan"]
    expected_manifest = readback_plan.get("expected_manifest", {})
    proof_bundle = basis["proof_manifest"].get("bundle", {})
    return {
        "accepted": True,
        "actual_readback_execution": False,
        "comparison_type": "row_for_row_against_local_commercial_proof",
        "expected_counts": expected_manifest.get("local_commercial_proof_expected_counts", {}),
        "family": FAMILY,
        "generated_at": now_iso(),
        "independent_reader": "future_independent_read_only_identity",
        "local_proof_bundle": {
            "path": proof_bundle.get("path"),
            "sha256": proof_bundle.get("sha256"),
        },
        "local_proof_hashes": expected_hashes,
        "output_paths": {
            "field_hash_mismatch_report": repo_relative(out_dir / "future_readback_field_hash_mismatch_report.csv"),
            "missing_row_report": repo_relative(out_dir / "future_readback_missing_rows.csv"),
            "extra_row_report": repo_relative(out_dir / "future_readback_extra_rows.csv"),
            "row_count_parity": repo_relative(out_dir / "future_readback_row_count_parity.json"),
        },
        "readback_plan_source": {
            "path": READBACK_PLAN.as_posix(),
            "sha256": file_sha(repo / READBACK_PLAN),
        },
        "required_compare_keys": expected_manifest.get("row_for_row_compare_keys", []),
        "required_outputs": readback_plan.get("required_outputs", []),
        "run_id": run_id,
        "status": "contract_ready_not_executed",
        "tenant_scope": basis["tenant_scope"],
    }


def build_gate_template(
    basis: dict[str, Any],
    build_version: str,
    input_source_version: str,
    idempotency_key: str,
    readback_contract_path: Path,
    expected_hashes: dict[str, str],
) -> dict[str, Any]:
    return {
        "approval_file_purpose": "template_only_not_approval",
        "approved": False,
        "build_version": build_version,
        "family": FAMILY,
        "idempotency_key": idempotency_key,
        "input_source_version": input_source_version,
        "mode": "execute",
        "operator_approval_reference": "fill-in-future-private-approval-reference",
        "output_blob_prefix": "blob://future-approved-ecl-commercial-lab-load/{tenant_scope}/{run_id}/",
        "readback_contract": {
            "path": repo_relative(readback_contract_path),
            "sha256": None,
        },
        "tenant_scope": basis["tenant_scope"],
        "expected_local_proof_hashes": expected_hashes,
        "acknowledgements": {key: False for key in ACK_KEYS},
    }


def validate_gate(repo: Path, gate_path: Path | None, expected: dict[str, Any]) -> tuple[bool, list[str], dict[str, Any] | None]:
    issues: list[str] = []
    if gate_path is None:
        return False, ["missing_gate_manifest"], None
    if not gate_path.exists():
        return False, [f"gate_manifest_not_found:{gate_path.as_posix()}"], None
    gate = read_json(gate_path)
    if gate.get("approved") is not True:
        issues.append("gate_not_approved")
    if gate.get("approval_file_purpose") == "template_only_not_approval":
        issues.append("template_manifest_is_not_approval")
    for field in ["mode", "family", "tenant_scope", "build_version", "input_source_version", "idempotency_key", "output_blob_prefix"]:
        if field not in gate:
            issues.append(f"missing_gate_field:{field}")
    for field in ["mode", "family", "tenant_scope", "build_version", "input_source_version", "idempotency_key"]:
        if field in gate and gate.get(field) != expected[field]:
            issues.append(f"gate_{field}_mismatch")
    if not str(gate.get("output_blob_prefix", "")).startswith("blob://"):
        issues.append("output_blob_prefix_must_be_blob_uri")

    acknowledgements = gate.get("acknowledgements", {})
    for key in ACK_KEYS:
        if acknowledgements.get(key) is not True:
            issues.append(f"missing_acknowledgement:{key}")

    expected_hashes = expected["expected_local_proof_hashes"]
    provided_hashes = gate.get("expected_local_proof_hashes")
    if not isinstance(provided_hashes, dict):
        issues.append("missing_expected_local_proof_hashes")
    else:
        for path, digest in expected_hashes.items():
            if path not in provided_hashes:
                issues.append(f"missing_local_proof_hash:{path}")
            elif provided_hashes[path] != digest:
                issues.append(f"local_proof_hash_mismatch:{path}")

    readback = gate.get("readback_contract")
    if not isinstance(readback, dict):
        issues.append("readback_contract_missing")
    else:
        readback_path = Path(str(readback.get("path", "")))
        if readback_path.as_posix() == ".":
            issues.append("readback_contract_path_missing")
        elif not (repo / readback_path).exists():
            issues.append("readback_contract_file_missing")
        else:
            current = file_sha(repo / readback_path)
            if readback.get("sha256") != current:
                issues.append("readback_contract_hash_mismatch")

    return len(issues) == 0, issues, gate


def write_refusal(out_dir: Path, issues: list[str], gate_path: Path | None) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    refusal = {
        "accepted": False,
        "actual_azure_execution": False,
        "generated_at": now_iso(),
        "gate_manifest": gate_path.as_posix() if gate_path else None,
        "issues": issues,
        "mode": "execute",
        "reason": "execute_mode_refused_by_preflight_gate",
    }
    write_json(out_dir / "ecl_commercial_lab_load_refusal.json", refusal)


def write_outputs(repo: Path, out_dir: Path, mode: str, gate_manifest: Path | None) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    basis = load_basis(repo)
    generated_at = now_iso()
    build_version = os.environ.get("ECL_COMMERCIAL_BUILD_VERSION", "").strip() or git_sha()
    input_source_version = str(basis["proof_manifest"].get("input_source_version", ""))
    expected_hashes = basis["expected_hashes"]
    idempotency_key = build_idempotency_key(JOB_NAME, FAMILY, basis["tenant_scope"], build_version, input_source_version, expected_hashes)
    run_id = f"ecl-commercial-lab-{generated_at[:10].replace('-', '')}-{idempotency_key.rsplit(':', 1)[-1][:12]}"

    run_contract_path = out_dir / "ecl_commercial_lab_load_run_contract.json"
    command_plan_path = out_dir / "ecl_commercial_lab_load_command_plan.json"
    gate_validation_path = out_dir / "ecl_commercial_lab_load_gate_validation.json"
    readback_contract_path = out_dir / "ecl_commercial_lab_load_readback_contract.json"
    status_path = out_dir / "ecl_commercial_lab_load_status.json"
    progress_path = out_dir / "ecl_commercial_execution_progress.json"
    report_path = out_dir / "PREFLIGHT_REPORT.md"
    gate_template_path = out_dir / "ecl_commercial_lab_load_gate_manifest.template.json"

    readback_contract = build_readback_contract(repo, basis, out_dir, run_id, expected_hashes)
    write_json(readback_contract_path, readback_contract)
    gate_template = build_gate_template(basis, build_version, input_source_version, idempotency_key, readback_contract_path, expected_hashes)
    gate_template["readback_contract"]["sha256"] = file_sha(readback_contract_path)
    write_json(gate_template_path, gate_template)

    expected_gate = {
        "mode": "execute",
        "family": FAMILY,
        "tenant_scope": basis["tenant_scope"],
        "build_version": build_version,
        "input_source_version": input_source_version,
        "idempotency_key": idempotency_key,
        "expected_local_proof_hashes": expected_hashes,
    }
    gate_ok, gate_issues, gate = validate_gate(repo, gate_manifest, expected_gate) if mode == "execute" else (False, ["gate_not_required_for_dry_run"], None)
    if mode == "execute" and not gate_ok:
        write_refusal(out_dir, gate_issues, gate_manifest)
        raise SystemExit("Refused: execute mode requires a matching explicit gate manifest.")

    command = command_plan(out_dir, run_contract_path, readback_contract_path, run_id, idempotency_key)
    write_json(command_plan_path, command)
    gate_validation = {
        "accepted": mode == "dry-run" or gate_ok,
        "actual_azure_execution": False,
        "dry_run_allowed": mode == "dry-run",
        "gate_manifest": gate_manifest.as_posix() if gate_manifest else None,
        "gate_manifest_present": gate_manifest is not None,
        "issues": gate_issues,
        "mode": mode,
        "status": "not_required_for_dry_run" if mode == "dry-run" else "accepted_execute_preflight_not_run",
    }
    write_json(gate_validation_path, gate_validation)

    output_blob_prefix = gate.get("output_blob_prefix") if gate else gate_template["output_blob_prefix"]
    run_contract = {
        "accepted": True,
        "actual_azure_execution": False,
        "blob_proof_bundle_location": f"{output_blob_prefix.rstrip('/')}/proof-bundle.tgz",
        "build_version": build_version,
        "command_plan": repo_relative(command_plan_path),
        "dry_run_only": mode == "dry-run",
        "expected_local_proof_hashes": expected_hashes,
        "family": FAMILY,
        "gate_manifest": gate_manifest.as_posix() if gate_manifest else None,
        "gate_manifest_template": repo_relative(gate_template_path),
        "generated_at": generated_at,
        "git_sha": git_sha(),
        "idempotency_key": idempotency_key,
        "image_digest": "${ECL_COMMERCIAL_IMAGE_DIGEST_PINNED}",
        "input_source_version": input_source_version,
        "job_name": JOB_NAME,
        "mode": "dry_run_plan_only" if mode == "dry-run" else "execute_preflight_accepted_not_run",
        "operator_identity": os.environ.get("ECL_COMMERCIAL_OPERATOR_IDENTITY", "").strip() or getpass.getuser(),
        "output_blob_prefix": output_blob_prefix,
        "progress_status_output": repo_relative(status_path),
        "quality_gate_output": repo_relative(gate_validation_path),
        "readback_contract": repo_relative(readback_contract_path),
        "release_record_link": RELEASE_RECORD,
        "retry_count": 0,
        "run_id": run_id,
        "started_at": generated_at,
        "status": "planned_not_executed" if mode == "dry-run" else "execute_preflight_accepted_not_run",
        "tenant_scope": basis["tenant_scope"],
        "timeout_seconds": 7200,
        "validation_output": repo_relative(gate_validation_path),
    }
    write_json(run_contract_path, run_contract)

    status = {
        "actual_azure_execution": False,
        "events": [
            {"at": generated_at, "name": "preflight_started"},
            {"at": now_iso(), "name": "local_proof_hashes_verified", "count": len(expected_hashes)},
            {"at": now_iso(), "name": "readback_contract_generated", "path": repo_relative(readback_contract_path)},
            {"at": now_iso(), "name": "command_plan_emitted_not_executed", "path": repo_relative(command_plan_path)},
        ],
        "family": FAMILY,
        "mode": run_contract["mode"],
        "run_id": run_id,
        "status": run_contract["status"],
    }
    write_json(status_path, status)

    progress = {
        "accepted": True,
        "generated_at": now_iso(),
        "overall_percent_complete": 29,
        "source": "ecl_commercial_lab_load_preflight",
        "steps": [
            {
                "blockers": ["explicit future execute approval", "digest-pinned image", "private data-plane target and secrets"],
                "evidence": ["reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_job_spec.json", repo_relative(run_contract_path)],
                "gate": "no_data_plane_mutation_in_this_pr",
                "name": "build_aca_data_build_job_to_contract_no_data",
                "percent_complete": 90,
                "status": "job_contract_plus_load_preflight_surface_ready",
                "step": 1,
            },
            {
                "blockers": ["explicit gate manifest", "digest-pinned image", "target private data-plane confirmation", "Azure execution approval"],
                "evidence": [repo_relative(run_contract_path), repo_relative(command_plan_path), repo_relative(gate_template_path)],
                "gate": "azure_data_plane_write",
                "name": "commercial_family_load_to_lab_preprod",
                "percent_complete": 45,
                "status": "preflight_contract_ready_execute_gated_not_run",
                "step": 2,
            },
            {
                "blockers": ["commercial load execution must complete first"],
                "evidence": [repo_relative(readback_contract_path)],
                "gate": "readback_after_approved_load",
                "name": "independent_commercial_row_for_row_readback",
                "percent_complete": 35,
                "status": "readback_contract_ready_not_executed",
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

    report_path.write_text(
        "\n".join(
            [
                "# ECL Commercial Lab Load Preflight",
                "",
                f"- Run id: `{run_id}`",
                f"- Mode: `{run_contract['mode']}`",
                f"- Actual Azure execution: `{run_contract['actual_azure_execution']}`",
                f"- Command plan: `{repo_relative(command_plan_path)}`",
                f"- Run contract: `{repo_relative(run_contract_path)}`",
                f"- Readback contract: `{repo_relative(readback_contract_path)}`",
                f"- Gate manifest template: `{repo_relative(gate_template_path)}`",
                "",
                "Hard gates preserved: no Azure mutation, no data mutation, no route repointing, no active source promotion, no deploy or traffic shift.",
                "",
            ]
        ),
        encoding="utf-8",
    )

    return {
        "command_plan": command_plan_path,
        "gate_manifest_template": gate_template_path,
        "gate_validation": gate_validation_path,
        "progress": progress_path,
        "readback_contract": readback_contract_path,
        "run_contract": run_contract_path,
        "status": status_path,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["dry-run", "execute"], default="dry-run")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--gate-manifest", type=Path)
    args = parser.parse_args()

    outputs = write_outputs(Path.cwd(), args.out_dir, args.mode, args.gate_manifest)
    print(json.dumps({key: repo_relative(value) for key, value in outputs.items()}, indent=2, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"ecl commercial lab load preflight failed: {exc}", file=sys.stderr)
        raise
