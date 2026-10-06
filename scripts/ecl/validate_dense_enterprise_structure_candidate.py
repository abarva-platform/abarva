#!/usr/bin/env python3

"""Verify an unapproved synthetic enterprise-structure source-set candidate."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from generate_dense_source_room_extracts import TARGETS
from write_dense_enterprise_structure_candidate import (
    FUNCTION_PATH,
    GENERATION_BASIS,
    REGISTRY,
    SEGMENT_PATH,
    SEGMENTS,
    UNMAPPED,
    VALIDATOR,
    read_csv,
    sha256,
    source_set_hash,
)


def verify(root: Path) -> dict[str, object]:
    root = root.resolve()
    base = subprocess.run(
        [sys.executable, str(VALIDATOR), "--out-dir", str(root)],
        capture_output=True,
        text=True,
        check=False,
    )
    if base.returncode:
        raise ValueError(f"Inherited source-room validation failed: {base.stderr.strip()}")
    manifest = json.loads((root / "candidate_source_set.json").read_text(encoding="utf-8"))
    expected_families = set(TARGETS) | {"SP15_Enterprise_Structure", "SP16_Organization_Functions"}
    if (
        manifest.get("state") != "candidate_not_approved_or_loaded"
        or manifest.get("client_attestation_state") != "not_client_attested"
        or manifest.get("generation_basis") != GENERATION_BASIS
        or any(key in manifest for key in ("approved_by", "approved_at", "load_authorized"))
    ):
        raise ValueError("Candidate state, basis, or approval boundary is invalid.")
    tenant_key = manifest.get("tenant_key")
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    active = next(
        (tenant for tenant in registry["activeTenants"] if tenant["tenantKey"] == tenant_key),
        None,
    )
    summary = json.loads((root / "dense_source_room_summary.json").read_text(encoding="utf-8"))
    if (
        not active
        or not any(packet.get("classification") == "synthetic-demo" for packet in active.get("packets", []))
        or summary.get("synthetic_profile") != tenant_key
        or summary.get("client_attestation_state") != "not_client_attested"
    ):
        raise ValueError("Candidate tenant is not the declared synthetic base-package tenant.")
    files = manifest.get("files")
    if not isinstance(files, list) or len(files) != len(expected_families):
        raise ValueError("Candidate file inventory is incomplete.")
    families: set[str] = set()
    paths: set[str] = set()
    row_total = 0
    for entry in files:
        if not isinstance(entry, dict):
            raise ValueError("Candidate file inventory entry is invalid.")
        family = entry.get("family")
        relative = entry.get("path")
        declared_hash = entry.get("sha256")
        if (
            not isinstance(family, str)
            or family not in expected_families
            or family in families
            or not isinstance(relative, str)
            or relative in paths
            or not isinstance(declared_hash, str)
            or not re.fullmatch(r"[a-f0-9]{64}", declared_hash)
        ):
            raise ValueError("Candidate family, path, or hash declaration is invalid.")
        source = (root / relative).resolve()
        family_root = (root / "__synthetic_sources__" / family).resolve()
        if not source.is_relative_to(family_root) or not source.is_file():
            raise ValueError("Candidate source path is missing or outside its declared family.")
        if sha256(source) != declared_hash:
            raise ValueError("Candidate source file hash mismatch.")
        rows = read_csv(source)
        if not isinstance(entry.get("rows"), int) or len(rows) != entry["rows"]:
            raise ValueError("Candidate source row count mismatch.")
        if any(row.get("client_attestation_state") != "not_client_attested" for row in rows):
            raise ValueError("Candidate contains a client-attested row.")
        families.add(family)
        paths.add(relative)
        row_total += len(rows)
    if families != expected_families:
        raise ValueError("Candidate source families do not match the declared set.")
    if (
        manifest.get("file_count") != len(files)
        or manifest.get("row_count") != row_total
        or manifest.get("source_set_hash") != source_set_hash(files)
    ):
        raise ValueError("Candidate source-set totals or hash do not reconcile.")
    segments = read_csv(root / SEGMENT_PATH)
    functions = read_csv(root / FUNCTION_PATH)
    assigned = {function: key for key, _name, values in SEGMENTS for function in values}
    if (
        len(segments) != len(SEGMENTS)
        or {(row["segment_key"], row["segment_name"]) for row in segments}
        != {(key, name) for key, name, _values in SEGMENTS}
        or len(functions) != len(assigned) + len(UNMAPPED)
        or {row["function_name"] for row in functions} != set(assigned) | set(UNMAPPED)
    ):
        raise ValueError("Candidate structure identities do not reconcile.")
    for row in segments:
        if (
            row["tenant_key"] != tenant_key
            or row["source_file"] != SEGMENT_PATH
            or row["classification_basis"] != "synthetic_fixture_not_client_declared"
            or any(row[column] for column in ("revenue_share_pct", "revenue_usd", "pnl_owner_role"))
            or row["review_state"] != "candidate"
        ):
            raise ValueError("Candidate segment asserts unreviewed economic or owner facts.")
    for row in functions:
        if (
            row["tenant_key"] != tenant_key
            or row["source_file"] != FUNCTION_PATH
            or row["business_segment_key"] != assigned.get(row["function_name"], "")
            or row["executive_owner"]
            or row["review_state"] != "candidate"
        ):
            raise ValueError("Candidate function mapping or owner boundary is invalid.")
    if manifest.get("structure") != {
        "segment_count": len(segments),
        "function_count": len(functions),
        "mapped_function_count": len(assigned),
        "unmapped_functions": sorted(UNMAPPED),
        "revenue_and_owner_basis": "not_declared",
    }:
        raise ValueError("Candidate structure summary does not reconcile.")
    return {
        "status": "pass_candidate_only",
        "file_count": len(files),
        "row_count": row_total,
        "source_set_hash": manifest["source_set_hash"],
        "unmapped_functions": sorted(UNMAPPED),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate-dir", required=True, type=Path)
    args = parser.parse_args()
    try:
        result = verify(args.candidate_dir)
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.error(str(error))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
