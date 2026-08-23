#!/usr/bin/env python3

"""Preflight a future dense ECL Azure execute approval.

This script does not call Azure or submit any job. It validates that a human
approval manifest is complete enough for a future operator to run the command
emitted by the non-mutating gate package.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PACKAGE_DIR = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23"
DEFAULT_GATE_MANIFEST = DEFAULT_PACKAGE_DIR / "ecl_dense_azure_load_gate_manifest.template.json"
DEFAULT_OUT = DEFAULT_PACKAGE_DIR / "ecl_dense_azure_execute_preflight_summary.json"

REQUIRED_ACKS = {
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
}

VALID_TARGETS = {
    "lab",
    "preprod",
    "client-preprod",
    "product-lab",
}

IMAGE_DIGEST_RE = re.compile(r"^[a-z0-9][a-z0-9./_-]+@sha256:[a-f0-9]{64}$")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def issue(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def require_file(path: Path, issues: list[str], label: str) -> None:
    issue(path.exists(), f"missing {label}: {repo_relative(path)}", issues)


def validate(
    *,
    package_dir: Path,
    gate_manifest_path: Path,
    image_digest: str,
    target_data_plane: str,
    database_secret_name: str,
    blob_secret_name: str,
    strict_hashes: bool,
) -> dict[str, Any]:
    issues: list[str] = []
    command_plan_path = package_dir / "ecl_dense_azure_command_plan.json"
    run_contract_path = package_dir / "ecl_dense_azure_load_run_contract.json"
    readback_contract_path = package_dir / "ecl_dense_azure_row_for_row_readback_contract.json"
    package_summary_path = package_dir / "ecl_dense_azure_load_gate_package_summary.json"

    for label, path in [
        ("gate manifest", gate_manifest_path),
        ("command plan", command_plan_path),
        ("run contract", run_contract_path),
        ("readback contract", readback_contract_path),
        ("package summary", package_summary_path),
    ]:
        require_file(path, issues, label)
    if issues:
        return {"accepted": False, "issues": issues}

    gate_manifest = read_json(gate_manifest_path)
    command_plan = read_json(command_plan_path)
    run_contract = read_json(run_contract_path)
    readback_contract = read_json(readback_contract_path)
    package_summary = read_json(package_summary_path)

    issue(gate_manifest.get("approved") is True, "gate manifest must set approved=true", issues)
    issue(gate_manifest.get("approval_file_purpose") == "human_operator_approval", "gate manifest must be a human approval, not the template", issues)
    issue(gate_manifest.get("mode") == "execute", "gate manifest mode must be execute", issues)
    issue(gate_manifest.get("family") == run_contract.get("family"), "family mismatch", issues)
    issue(gate_manifest.get("tenant_scope") == run_contract.get("tenant_scope"), "tenant scope mismatch", issues)
    issue(gate_manifest.get("build_version") == run_contract.get("build_version"), "build version mismatch", issues)
    issue(gate_manifest.get("input_source_version") == run_contract.get("input_source_version"), "input source version mismatch", issues)
    issue(gate_manifest.get("idempotency_key") == run_contract.get("idempotency_key"), "idempotency key mismatch", issues)
    issue(gate_manifest.get("idempotency_key") == package_summary.get("idempotency_key"), "summary idempotency key mismatch", issues)

    acknowledgements = gate_manifest.get("acknowledgements", {})
    issue(set(acknowledgements) == REQUIRED_ACKS, "acknowledgement set mismatch", issues)
    if isinstance(acknowledgements, dict):
        for key in REQUIRED_ACKS:
            issue(acknowledgements.get(key) is True, f"acknowledgement {key} must be true", issues)

    readback_link = gate_manifest.get("readback_contract", {})
    issue(readback_link.get("path") == run_contract.get("readback_contract"), "readback contract path mismatch", issues)
    issue(readback_link.get("sha256") == file_sha(readback_contract_path), "readback contract sha256 mismatch", issues)
    issue(readback_contract.get("actual_readback_execution") is False, "readback contract must still be not executed", issues)
    issue(readback_contract.get("field_hash_required") is True, "readback contract must require field hashes", issues)

    issue(command_plan.get("actual_azure_execution") is False, "command plan must be non-executed", issues)
    issue(command_plan.get("command_was_executed") is False, "command plan must not have executed", issues)
    future_command = command_plan.get("future_execute_command_not_run", [])
    issue(isinstance(future_command, list) and future_command[:3] == ["npm", "run", "ops:aca-job"], "future command must use ops:aca-job", issues)
    issue("--plan-only" not in future_command, "future execute command must not include --plan-only", issues)
    issue("az" not in future_command, "future command must not call az directly", issues)

    issue(bool(IMAGE_DIGEST_RE.match(image_digest)), "image digest must be a digest-pinned image reference", issues)
    issue(target_data_plane in VALID_TARGETS, f"target data plane must be one of {sorted(VALID_TARGETS)}", issues)
    issue(bool(database_secret_name.strip()), "database secret name is required", issues)
    issue(bool(blob_secret_name.strip()), "blob proof-bundle secret name is required", issues)

    expected_hashes = gate_manifest.get("expected_local_proof_hashes", {})
    issue(expected_hashes == run_contract.get("expected_local_proof_hashes"), "expected local proof hashes mismatch", issues)
    if strict_hashes and isinstance(expected_hashes, dict):
        for rel_path, expected_hash in expected_hashes.items():
            path = ROOT / rel_path
            issue(path.exists(), f"hashed proof input missing: {rel_path}", issues)
            if path.exists():
                issue(file_sha(path) == expected_hash, f"hashed proof input changed: {rel_path}", issues)

    materialized_command = [
        token
        .replace("${ECL_DENSE_IMAGE_DIGEST_PINNED}", image_digest)
        .replace("${ACA_OPERATOR_RESOURCE_GROUP}", f"${{ACA_OPERATOR_RESOURCE_GROUP_FOR_{target_data_plane.upper().replace('-', '_')}}}")
        .replace("${DATABASE_URL_SECRET_NAME}", database_secret_name)
        .replace("${AZURE_STORAGE_CONNECTION_SECRET_NAME}", blob_secret_name)
        for token in future_command
    ]
    return {
        "accepted": not issues,
        "actual_azure_execution": False,
        "command_was_executed": False,
        "database_secret_name": database_secret_name,
        "blob_secret_name": blob_secret_name,
        "gate_manifest": repo_relative(gate_manifest_path),
        "image_digest": image_digest,
        "issues": issues,
        "materialized_future_command_not_run": materialized_command,
        "package_dir": repo_relative(package_dir),
        "strict_hashes": strict_hashes,
        "target_data_plane": target_data_plane,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-dir", type=Path, default=DEFAULT_PACKAGE_DIR)
    parser.add_argument("--gate-manifest", type=Path, default=DEFAULT_GATE_MANIFEST)
    parser.add_argument("--image-digest", default=os.environ.get("ECL_DENSE_IMAGE_DIGEST_PINNED", ""))
    parser.add_argument("--target-data-plane", default=os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", ""))
    parser.add_argument("--database-secret-name", default=os.environ.get("DATABASE_URL_SECRET_NAME", ""))
    parser.add_argument("--blob-secret-name", default=os.environ.get("AZURE_STORAGE_CONNECTION_SECRET_NAME", ""))
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--strict-hashes", action="store_true")
    parser.add_argument("--expect-template-rejection", action="store_true")
    args = parser.parse_args()

    result = validate(
        package_dir=args.package_dir.resolve(),
        gate_manifest_path=args.gate_manifest.resolve(),
        image_digest=args.image_digest.strip(),
        target_data_plane=args.target_data_plane.strip(),
        database_secret_name=args.database_secret_name.strip(),
        blob_secret_name=args.blob_secret_name.strip(),
        strict_hashes=args.strict_hashes,
    )
    if args.expect_template_rejection:
        expected_rejected = not result["accepted"] and any("human approval" in issue for issue in result["issues"])
        result = {
            "accepted": expected_rejected,
            "actual_azure_execution": False,
            "command_was_executed": False,
            "expected_rejected": True,
            "rejection_issues": result["issues"],
        }
    write_json(args.out.resolve(), result)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
