#!/usr/bin/env python3
"""Write the explicit ECL Azure load approval request packet.

This is a local-only operator packet. It turns the prepared gate package into a
human-readable request with the exact blanks an approver/operator must fill
before a future Azure data-plane job can be run. It does not approve, execute,
submit, deploy, repoint routes, or retire anything.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GATE_DIR = ROOT / "reports/ecl-dense-azure-load-gate-package-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "reports/ecl-azure-load-approval-request-2026-08-23"
SUMMARY_NAME = "ecl_azure_load_approval_request_summary.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def repo_relative(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_sha(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def require(path: Path, label: str) -> None:
    if not path.exists():
        raise SystemExit(f"Missing {label}: {repo_relative(path)}")


def load_gate(gate_dir: Path) -> dict[str, Any]:
    paths = {
        "summary": gate_dir / "ecl_dense_azure_load_gate_package_summary.json",
        "status": gate_dir / "ecl_dense_azure_load_gate_status.json",
        "run_contract": gate_dir / "ecl_dense_azure_load_run_contract.json",
        "readback_contract": gate_dir / "ecl_dense_azure_row_for_row_readback_contract.json",
        "command_plan": gate_dir / "ecl_dense_azure_command_plan.json",
        "approval_template": gate_dir / "ecl_dense_azure_load_gate_manifest.template.json",
        "checklist": gate_dir / "ecl_dense_azure_load_approval_checklist.json",
        "operator_status": ROOT / "outputs/ecl-no-stop-execution-run/operator-status.json",
    }
    for label, path in paths.items():
        require(path, label)
    loaded = {label: read_json(path) for label, path in paths.items()}
    if loaded["summary"].get("actual_azure_execution") is not False:
        raise SystemExit("Gate package summary must prove actual_azure_execution=false")
    if loaded["status"].get("status") != "ready_for_explicit_future_gate_review":
        raise SystemExit("Gate package status must be ready for explicit gate review")
    if loaded["approval_template"].get("approved") is not False:
        raise SystemExit("Approval template must remain unapproved")
    if loaded["readback_contract"].get("actual_readback_execution") is not False:
        raise SystemExit("Readback contract must remain unexecuted")
    loaded["paths"] = {label: repo_relative(path) for label, path in paths.items()}
    loaded["hashes"] = {label: file_sha(path) for label, path in paths.items()}
    return loaded


def build_request(gate: dict[str, Any]) -> dict[str, Any]:
    summary = gate["summary"]
    run_contract = gate["run_contract"]
    template = gate["approval_template"]
    operator_status = gate["operator_status"]
    quality_rows = operator_status.get("quality_denominators", [])
    quality_rows = quality_rows if isinstance(quality_rows, list) else []
    pass_count = sum(1 for row in quality_rows if isinstance(row, dict) and row.get("status") == "pass")
    hard_gated_count = sum(1 for row in quality_rows if isinstance(row, dict) and row.get("status") == "hard_gated")

    return {
        "accepted": True,
        "actual_azure_execution": False,
        "approval_state": "requested_not_approved",
        "approval_request_purpose": "human_gate_decision_for_future_azure_lab_preprod_load",
        "created_at": now_iso(),
        "family": run_contract.get("family"),
        "tenant_scope": run_contract.get("tenant_scope"),
        "run_id": run_contract.get("run_id"),
        "idempotency_key": run_contract.get("idempotency_key"),
        "build_version": run_contract.get("build_version"),
        "input_source_version": run_contract.get("input_source_version"),
        "proof_bundle_sha256": summary.get("proof_bundle_sha256"),
        "local_quality": {
            "passed_denominators": pass_count,
            "total_denominators": len(quality_rows),
            "hard_gated_denominators": hard_gated_count,
        },
        "required_human_inputs": [
            "operator_approval_reference",
            "digest_pinned_image",
            "target_data_plane",
            "database_secret_name",
            "blob_proof_bundle_secret_name",
            "independent_readback_operator_identity",
        ],
        "required_acknowledgements": sorted(template.get("acknowledgements", {}).keys()),
        "must_not_include": [
            "product route repointing",
            "snapshot promotion",
            "active tenant source replacement",
            "traffic mutation",
            "legacy deletion or retirement",
        ],
        "source_artifacts": gate["paths"],
        "source_artifact_hashes": gate["hashes"],
    }


def render_request_md(request: dict[str, Any], path: Path) -> None:
    lines = [
        "# ECL Azure Load Approval Request",
        "",
        f"- Approval state: `{request['approval_state']}`",
        "- Actual Azure execution: `false`",
        f"- Tenant scope: `{request['tenant_scope']}`",
        f"- Run id: `{request['run_id']}`",
        f"- Idempotency key: `{request['idempotency_key']}`",
        f"- Proof bundle SHA-256: `{request['proof_bundle_sha256']}`",
        f"- Local quality denominators: `{request['local_quality']['passed_denominators']} / {request['local_quality']['total_denominators']}` pass, `{request['local_quality']['hard_gated_denominators']}` hard-gated",
        "",
        "## Human Inputs Required",
        "",
    ]
    lines.extend(f"- `{item}`" for item in request["required_human_inputs"])
    lines.extend(
        [
            "",
            "## Required Acknowledgements",
            "",
        ]
    )
    lines.extend(f"- `{item}`" for item in request["required_acknowledgements"])
    lines.extend(
        [
            "",
            "## Explicitly Out Of Scope",
            "",
        ]
    )
    lines.extend(f"- {item}" for item in request["must_not_include"])
    lines.extend(
        [
            "",
            "## Gate Artifacts",
            "",
            "| Artifact | Path | SHA-256 |",
            "|---|---|---|",
        ]
    )
    for label, artifact_path in sorted(request["source_artifacts"].items()):
        lines.append(f"| `{label}` | `{artifact_path}` | `{request['source_artifact_hashes'][label]}` |")
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "This request packet is not an approval and is not an execution record. It exists so the future gate decision has the exact run id, idempotency key, proof hashes, readback contract, and out-of-scope boundaries in one place.",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_outputs(gate_dir: Path, out_dir: Path) -> dict[str, str]:
    gate = load_gate(gate_dir)
    request = build_request(gate)
    request_path = out_dir / "ecl_azure_load_approval_request.json"
    manifest_path = out_dir / "ecl_azure_load_human_approval_manifest.to-fill.json"
    report_path = out_dir / "ECL_AZURE_LOAD_APPROVAL_REQUEST.md"
    summary_path = out_dir / SUMMARY_NAME

    human_manifest = {
        "approval_file_purpose": "human_operator_approval_to_fill",
        "approved": False,
        "approval_reference": "",
        "mode": "execute",
        "tenant_scope": request["tenant_scope"],
        "run_id": request["run_id"],
        "idempotency_key": request["idempotency_key"],
        "digest_pinned_image": "",
        "target_data_plane": "",
        "database_secret_name": "",
        "blob_proof_bundle_secret_name": "",
        "independent_readback_operator_identity": "",
        "acknowledgements": {key: False for key in request["required_acknowledgements"]},
        "not_authorized": request["must_not_include"],
    }
    write_json(request_path, request)
    write_json(manifest_path, human_manifest)
    render_request_md(request, report_path)
    summary = {
        "accepted": True,
        "actual_azure_execution": False,
        "approval_state": request["approval_state"],
        "request": repo_relative(request_path),
        "human_manifest_to_fill": repo_relative(manifest_path),
        "report": repo_relative(report_path),
        "run_id": request["run_id"],
        "idempotency_key": request["idempotency_key"],
        "next_action": "human_gate_decision_required",
    }
    write_json(summary_path, summary)
    return {key: repo_relative(path) for key, path in {
        "request": request_path,
        "human_manifest_to_fill": manifest_path,
        "report": report_path,
        "summary": summary_path,
    }.items()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate-dir", type=Path, default=DEFAULT_GATE_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    outputs = write_outputs(args.gate_dir.resolve(), args.out_dir.resolve())
    print(json.dumps(outputs, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
