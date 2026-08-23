#!/usr/bin/env python3

"""Write a machine-readable proof-bundle manifest for the commercial ECL slice.

This is intentionally post-proof: run the builder, run the disposable DB proof,
then run this script so the manifest hashes the final observed proof files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import subprocess
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
TENANT_KEYS = ["meridian-health"]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_value(args: list[str]) -> str:
    try:
        return subprocess.check_output(["git", *args], text=True).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unavailable"


def file_entry(path: Path, root: Path) -> dict[str, object]:
    return {
        "path": path.as_posix(),
        "relative_path": path.relative_to(root).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def collect_files(root: Path) -> list[Path]:
    return sorted(path for path in root.rglob("*") if path.is_file())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    out_dir = args.out_dir.resolve()
    source_room = out_dir / "source_room"
    base_manifest_path = out_dir / "commercial_contract_supply_manifest.json"
    if not base_manifest_path.exists():
        raise SystemExit(f"Missing builder manifest: {base_manifest_path}")

    base_manifest = json.loads(base_manifest_path.read_text(encoding="utf-8"))
    tracked_artifacts = [
        out_dir / "commercial_contract_supply_ecl_load.sql",
        out_dir / "commercial_contract_supply_verify.sql",
        out_dir / "commercial_contract_supply_db_proof.txt",
        out_dir / "commercial_proof_run_summary.json",
        out_dir / "commercial_proof_acceptance_summary.json",
        out_dir / "commercial_contract_supply_manifest.json",
        out_dir / "commercial_contract_supply_validation_summary.json",
        out_dir / "commercial_contract_supply_bad_rows.csv",
        out_dir / "commercial_contract_supply_field_lineage.csv",
        out_dir / "commercial_client_extraction_mapping.csv",
        out_dir / "commercial_client_extraction_mapping.md",
        out_dir / "commercial_client_extraction_mapping_summary.json",
        out_dir / "commercial_product_consumption_mapping.csv",
        out_dir / "commercial_product_consumption_mapping.md",
        out_dir / "commercial_product_consumption_mapping_summary.json",
        out_dir / "source_360_page_fact_contract.csv",
        out_dir / "source_360_page_fact_contract.md",
        out_dir / "source_360_page_fact_contract_summary.json",
        out_dir / "source_value_levers_projection.csv",
        out_dir / "commercial_document_quality_issues.csv",
        out_dir / "commercial_document_quality_summary.json",
        out_dir / "validator_planted_unknown_supplier_bad_rows.csv",
        out_dir / "validator_planted_unknown_supplier_summary.json",
        out_dir / "validator_planted_benchmark_service_bad_rows.csv",
        out_dir / "validator_planted_benchmark_service_summary.json",
        out_dir / "validator_planted_failure_summary.json",
        out_dir / "commercial_scope_dense_meridian_required_additions.csv",
        out_dir / "commercial_scope_dense_meridian_required_additions.md",
        out_dir / "README.md",
        out_dir / "scope_active_application_reconciliation.csv",
    ]
    missing = [path.as_posix() for path in tracked_artifacts if not path.exists()]
    if missing:
        raise SystemExit("Missing expected proof artifacts: " + ", ".join(missing))

    source_files = collect_files(source_room) if source_room.exists() else []
    repo_status = git_value(["status", "--short"])
    manifest = {
        "manifest_version": "ecl-proof-bundle/v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "proof_scope": "local-commercial-source-room-to-ecl",
        "tenant_keys": TENANT_KEYS,
        "assessment_id": base_manifest["assessment_id"],
        "source_hash_label": "commercial-contract-supply-correction",
        "code": {
            "git_commit_sha": git_value(["rev-parse", "HEAD"]),
            "git_dirty": bool(repo_status),
            "git_status_short_sha256": hashlib.sha256(repo_status.encode("utf-8")).hexdigest(),
        },
        "environment": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "cwd": Path.cwd().as_posix(),
            "user": os.environ.get("USER", "unknown"),
        },
        "counts": {
            key: base_manifest[key]
            for key in [
                "source_files",
                "source_records",
                "documents",
                "document_extractions",
                "objects",
                "relationships",
                "measures",
                "contracts",
                "service_lines",
                "contract_scope",
                "invoice_lines",
                "sla_observations",
                "source_contract_360_rows",
                "source_vendor_360_rows",
                "source_value_levers_rows",
                "tower_rows",
                "cube_manifests",
                "cube_slices",
                "cube_slice_metrics",
                "cube_slice_measures",
            ]
        },
        "artifact_hashes": [file_entry(path.resolve(), out_dir) for path in tracked_artifacts],
        "source_room_hashes": [file_entry(path.resolve(), out_dir) for path in source_files],
        "boundary": {
            "azure_load": False,
            "active_tenant_input_mutation": False,
            "migration_authorization": False,
            "product_route_repointing": False,
            "browser_qa": False,
        },
    }

    manifest_path = out_dir / "proof_bundle_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "manifest": manifest_path.as_posix(),
                "artifact_hashes": len(manifest["artifact_hashes"]),
                "source_room_hashes": len(manifest["source_room_hashes"]),
                "git_commit_sha": manifest["code"]["git_commit_sha"],
                "git_dirty": manifest["code"]["git_dirty"],
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
