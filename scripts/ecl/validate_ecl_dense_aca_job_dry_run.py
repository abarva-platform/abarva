#!/usr/bin/env python3

"""Validate the dense ECL ACA data-build dry-run scaffold outputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("reports/ecl-dense-aca-job-dry-run-2026-08-23")
REQUIRED_FILES = {
    "job_spec": "ecl_dense_aca_job_spec.json",
    "run_manifest": "ecl_dense_aca_run_manifest.json",
    "status": "ecl_dense_aca_status.json",
    "env_validation": "ecl_dense_aca_env_binding_validation.json",
    "validation_summary": "ecl_dense_aca_validation_summary.json",
    "quality_gate": "ecl_dense_aca_quality_gate.json",
    "progress": "ecl_dense_execution_progress.json",
    "proof_bundle_manifest": "dense_proof_bundle_manifest.json",
    "dry_run_report": "DRY_RUN_REPORT.md",
    "summary": "ecl_dense_aca_dry_run_summary.json",
}

REQUIRED_CONTRACT_FIELDS = [
    "job_name",
    "run_id",
    "tenant_scope",
    "build_version",
    "input_source_version",
    "idempotency_key",
    "operator_identity",
    "git_sha",
    "image_digest",
    "started_at",
    "ended_at",
    "status",
    "retry_count",
    "timeout_seconds",
    "progress_status_output",
    "blob_proof_bundle_location",
    "validation_output",
    "quality_gate_output",
    "release_record_link",
]

REQUIRED_MISSING_BINDINGS = {
    "ECL_DENSE_IMAGE",
    "ECL_DENSE_TARGET_DATA_PLANE",
    "DATABASE_URL",
    "AZURE_STORAGE_CONNECTION_STRING",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def expect(condition: bool, message: str, issues: list[str]) -> None:
    if not condition:
        issues.append(message)


def validate(out_dir: Path) -> list[str]:
    issues: list[str] = []
    paths = {name: out_dir / rel for name, rel in REQUIRED_FILES.items()}
    for name, path in paths.items():
        expect(path.exists(), f"missing {name}: {path.as_posix()}", issues)
    proof_bundle_path = out_dir / "dense_proof_bundle.tgz"
    expect(proof_bundle_path.exists(), f"missing proof bundle: {proof_bundle_path.as_posix()}", issues)
    if issues:
        return issues

    job_spec = read_json(paths["job_spec"])
    run_manifest = read_json(paths["run_manifest"])
    status = read_json(paths["status"])
    env_validation = read_json(paths["env_validation"])
    validation = read_json(paths["validation_summary"])
    quality = read_json(paths["quality_gate"])
    progress = read_json(paths["progress"])
    proof_manifest = read_json(paths["proof_bundle_manifest"])
    summary = read_json(paths["summary"])

    expect(job_spec.get("actual_azure_execution") is False, "job spec must be dry-run/no Azure", issues)
    expect(job_spec.get("dry_run_only") is True, "job spec must be dry_run_only", issues)
    expect(job_spec.get("runner") == "scripts/ops/submit-aca-operator-job.mjs", "job spec runner mismatch", issues)
    command = job_spec.get("candidate_wrapper_command", [])
    expect(isinstance(command, list) and command[:3] == ["npm", "run", "ops:aca-job"], "candidate command must use ops:aca-job", issues)
    expect("--plan-only" in command, "candidate command must stay plan-only", issues)
    expect("az" not in command, "candidate command must not call az directly", issues)

    for field in REQUIRED_CONTRACT_FIELDS:
        expect(field in run_manifest, f"run manifest missing contract field: {field}", issues)
    expect(run_manifest.get("actual_azure_execution") is False, "run manifest must be dry-run/no Azure", issues)
    expect(str(run_manifest.get("blob_proof_bundle_location", "")).startswith("local-only:"), "proof bundle location must be local-only", issues)
    expect(run_manifest.get("status") == "dry_run_succeeded", "run manifest status must be dry_run_succeeded", issues)

    expect(status.get("actual_azure_execution") is False, "status must be dry-run/no Azure", issues)
    expect(status.get("status") == "dry_run_succeeded", "status must be dry_run_succeeded", issues)
    expect(any(event.get("name") == "azure_execution_refused_by_design" for event in status.get("events", [])), "status missing Azure refusal event", issues)

    missing = set(env_validation.get("missing_for_execution", []))
    expect(env_validation.get("accepted_for_dry_run") is True, "env validation must accept dry-run", issues)
    expect(env_validation.get("execution_eligible") is False, "dry-run must not be execution eligible by default", issues)
    expect(REQUIRED_MISSING_BINDINGS.issubset(missing), "env validation must record execution-only missing bindings", issues)

    expect(validation.get("accepted") is True, "validation summary must be accepted", issues)
    expect(validation.get("actual_azure_execution") is False, "validation must be dry-run/no Azure", issues)
    expect(quality.get("dry_run_gate_status") == "pass", "quality dry-run gate must pass", issues)
    expect(quality.get("execute_gate_status") == "blocked_pending_explicit_future_execute_lane", "execute gate must remain blocked", issues)
    for gate in ["azure_mutation", "data_mutation", "product_route_repoint", "browser_live_claim", "legacy_retirement"]:
        expect(quality.get("hard_gates_preserved", {}).get(gate) == "not_run", f"{gate} gate must be not_run", issues)

    steps = {row.get("step"): row for row in progress.get("steps", [])}
    expect(progress.get("overall_percent_complete") == 50, "overall progress must be 50", issues)
    for step in [1, 2, 3]:
        expect(steps.get(step, {}).get("percent_complete") == 100, f"step {step} must be 100", issues)
    for step in [4, 5, 6]:
        expect(steps.get(step, {}).get("percent_complete") == 0, f"step {step} must be 0", issues)

    expect(proof_manifest.get("family") == "dense_all_layer_ecl", "proof manifest family mismatch", issues)
    bundle = proof_manifest.get("bundle", {})
    expect(bundle.get("path") == proof_bundle_path.as_posix(), "proof bundle path mismatch", issues)
    expect(bundle.get("bytes", 0) > 0, "proof bundle must be non-empty", issues)
    expect(len(proof_manifest.get("source_artifacts", [])) == 14, "proof bundle must include 14 source artifacts", issues)

    expect(summary.get("accepted") is True, "dry-run summary must be accepted", issues)
    expect(summary.get("actual_azure_execution") is False, "dry-run summary must be no Azure", issues)
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    issues = validate(args.out_dir)
    summary = {
        "accepted": not issues,
        "checked_out_dir": args.out_dir.as_posix(),
        "issues": issues,
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
