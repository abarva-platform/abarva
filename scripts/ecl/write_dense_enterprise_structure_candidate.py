#!/usr/bin/env python3

"""Prepare an unapproved enterprise-structure source set from a validated synthetic pack."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
VALIDATOR = REPO_ROOT / "scripts/ecl/validate_dense_source_room_extracts.py"
REGISTRY = REPO_ROOT / "datasets/tenant-inputs/tenant-input-registry.json"
BASE_MANIFEST = "dense_source_room_manifest.csv"
SEGMENT_PATH = "__synthetic_sources__/SP15_Enterprise_Structure/01b_business_segments.csv"
FUNCTION_PATH = "__synthetic_sources__/SP16_Organization_Functions/01_business_functions.csv"
GENERATION_BASIS = "declared_synthetic_structure_fixture_v1"

SEGMENTS = (
    ("payer_operations", "Payer Operations", (
        "Health Plan Operations", "Member Services", "Provider Network", "Pharmacy",
    )),
    ("care_delivery", "Care Delivery", ("Clinical Operations",)),
    ("enterprise_services", "Enterprise Services", (
        "Finance", "Supply Chain", "Human Resources", "Data and Analytics",
        "Information Technology", "Risk and Compliance",
    )),
)
UNMAPPED = {
    "Revenue Cycle": "Segment ownership is shared or unresolved; no segment edge is declared.",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def source_set_hash(entries: list[dict[str, object]]) -> str:
    pairs = sorted((str(row["path"]), str(row["sha256"])) for row in entries)
    encoded = json.dumps(pairs, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_scope(base_dir: Path, tenant_key: str) -> None:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    active = next(
        (tenant for tenant in registry["activeTenants"] if tenant["tenantKey"] == tenant_key),
        None,
    )
    if not active or not any(packet.get("classification") == "synthetic-demo" for packet in active.get("packets", [])):
        raise ValueError("Candidate requires a declared active synthetic tenant key.")
    summary = json.loads((base_dir / "dense_source_room_summary.json").read_text(encoding="utf-8"))
    if summary.get("synthetic_profile") != tenant_key or summary.get("client_attestation_state") != "not_client_attested":
        raise ValueError("Base package profile or attestation state does not match the declared tenant.")
    result = subprocess.run(
        [sys.executable, str(VALIDATOR), "--out-dir", str(base_dir)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        raise ValueError(f"Base source-room validation failed: {result.stderr.strip()}")


def base_functions(base_dir: Path, manifest: list[dict[str, str]]) -> set[str]:
    functions: set[str] = set()
    for entry in manifest:
        for row in read_csv(base_dir / entry["file_path"]):
            for column in ("business_function", "function"):
                value = row.get(column, "").strip()
                if value:
                    functions.add(value)
    declared = [function for _key, _name, values in SEGMENTS for function in values]
    if len(declared) != len(set(declared)):
        raise ValueError("A function is assigned to more than one segment.")
    if functions != set(declared) | set(UNMAPPED):
        raise ValueError(
            f"Synthetic function dictionary changed; reassess the candidate crosswalk: "
            f"missing={sorted(functions - set(declared) - set(UNMAPPED))}, "
            f"stale={sorted((set(declared) | set(UNMAPPED)) - functions)}"
        )
    return functions


def structure_rows(tenant_key: str, functions: set[str]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    segments: list[dict[str, str]] = []
    function_rows: list[dict[str, str]] = []
    assignments = {function: key for key, _name, values in SEGMENTS for function in values}
    for key, name, _values in SEGMENTS:
        segments.append({
            "tenant_key": tenant_key,
            "segment_key": key,
            "segment_name": name,
            "revenue_share_pct": "",
            "revenue_usd": "",
            "pnl_owner_role": "",
            "classification_basis": "synthetic_fixture_not_client_declared",
            "source_file": SEGMENT_PATH,
            "confidence": "low",
            "source_basis": "synthetic_generated",
            "review_state": "candidate",
            "client_attestation_state": "not_client_attested",
            "synthetic_dataset_id": "DENSE_ENTERPRISE_STRUCTURE_CANDIDATE_V1",
            "synthetic_generation_basis": GENERATION_BASIS,
            "known_gaps": "Revenue share, revenue amount, and P&L owner are not declared.",
        })
    for function in sorted(functions):
        key = assignments.get(function, "")
        function_rows.append({
            "tenant_key": tenant_key,
            "function_name": function,
            "business_segment_key": key,
            "parent_function": "",
            "executive_owner": "",
            "source_file": FUNCTION_PATH,
            "confidence": "low",
            "source_basis": "synthetic_generated" if key else "known_gap",
            "review_state": "candidate",
            "client_attestation_state": "not_client_attested",
            "synthetic_dataset_id": "DENSE_ENTERPRISE_STRUCTURE_CANDIDATE_V1",
            "synthetic_generation_basis": GENERATION_BASIS,
            "known_gaps": UNMAPPED.get(function, "Function owner and decision rights are not declared."),
        })
    return segments, function_rows


def build(base_dir: Path, out_dir: Path, tenant_key: str) -> dict[str, object]:
    base_dir = base_dir.resolve()
    out_dir = out_dir.resolve()
    if out_dir.exists() or out_dir == base_dir or out_dir.is_relative_to(base_dir):
        raise ValueError("Candidate output must be a new directory outside the base package.")
    validate_scope(base_dir, tenant_key)
    manifest = read_csv(base_dir / BASE_MANIFEST)
    functions = base_functions(base_dir, manifest)
    segment_rows, function_rows = structure_rows(tenant_key, functions)

    out_dir.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{out_dir.name}-", dir=out_dir.parent))
    try:
        for metadata in (
            BASE_MANIFEST,
            "dense_source_room_summary.json",
            "dense_source_room_field_dictionary.csv",
        ):
            shutil.copyfile(base_dir / metadata, staging / metadata)
        entries: list[dict[str, object]] = []
        for row in manifest:
            relative = Path(row["file_path"])
            source = (base_dir / relative).resolve()
            if not source.is_relative_to(base_dir) or not source.is_file():
                raise ValueError("Base manifest contains a missing or escaping source path.")
            destination = staging / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
            entries.append({
                "family": row["source_room_family"],
                "path": relative.as_posix(),
                "rows": int(row["row_count"]),
                "sha256": sha256(destination),
            })
        for family, relative, rows in (
            ("SP15_Enterprise_Structure", SEGMENT_PATH, segment_rows),
            ("SP16_Organization_Functions", FUNCTION_PATH, function_rows),
        ):
            path = staging / relative
            write_csv(path, rows, list(rows[0]))
            entries.append({"family": family, "path": relative, "rows": len(rows), "sha256": sha256(path)})
        candidate = {
            "state": "candidate_not_approved_or_loaded",
            "tenant_key": tenant_key,
            "origin": "synthetic_generator",
            "generation_basis": GENERATION_BASIS,
            "client_attestation_state": "not_client_attested",
            "file_count": len(entries),
            "row_count": sum(int(entry["rows"]) for entry in entries),
            "source_set_hash": source_set_hash(entries),
            "files": entries,
            "structure": {
                "segment_count": len(segment_rows),
                "function_count": len(function_rows),
                "mapped_function_count": sum(bool(row["business_segment_key"]) for row in function_rows),
                "unmapped_functions": sorted(UNMAPPED),
                "revenue_and_owner_basis": "not_declared",
            },
            "gate": "Requires a separate approved dataset manifest, reviewed source set, scoped ACA job, quality gate, and readback before publication.",
        }
        (staging / "candidate_source_set.json").write_text(
            json.dumps(candidate, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        os.replace(staging, out_dir)
        return candidate
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-dir", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--tenant-key", required=True)
    args = parser.parse_args()
    try:
        candidate = build(args.base_dir, args.out_dir, args.tenant_key)
    except (OSError, ValueError, KeyError) as error:
        parser.error(str(error))
    print(json.dumps({
        "state": candidate["state"],
        "file_count": candidate["file_count"],
        "row_count": candidate["row_count"],
        "source_set_hash": candidate["source_set_hash"],
        "structure": candidate["structure"],
    }, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
